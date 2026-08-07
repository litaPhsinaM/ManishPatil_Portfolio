-- Interview.exe — kill switch and monthly budget
--
-- Two protections that live in the database rather than in code, so they can be
-- changed from the Supabase dashboard on a phone with no redeploy:
--
--   kill switch  — flip `enabled` to false and the bot goes quiet immediately
--   budget       — the bot stops calling the model once the month's spend is up,
--                  and starts again by itself next month
--
-- Neither replaces the spend cap in the Anthropic Console. That one is the real
-- floor because it sits outside this code entirely: if anything here has a bug,
-- the Console still stops the money. These two exist so the common cases are
-- handled gracefully — with a written explanation to the visitor — instead of a
-- raw API error.

create table if not exists public.bot_settings (
    id                    integer primary key default 1,
    enabled               boolean not null default true,
    monthly_budget_cents  integer not null default 500,   -- $5.00
    disabled_notice       text not null default 'The assistant is offline right now. The contact form below still works, and reaches a human.',
    budget_notice         text not null default 'I have used up this month''s question budget. The contact form below has no such limit.',
    updated_at            timestamptz not null default now(),

    -- Enforces a single settings row: any insert must use id = 1.
    constraint bot_settings_single_row check (id = 1)
);

insert into public.bot_settings (id) values (1) on conflict (id) do nothing;

-- One row per model call, in cents, so spend is measured rather than estimated.
create table if not exists public.usage_ledger (
    id             bigint generated always as identity primary key,
    cost_micros    bigint not null,   -- millionths of a cent; a Haiku answer is ~400
    input_tokens   integer not null default 0,
    output_tokens  integer not null default 0,
    created_at     timestamptz not null default now()
);

create index if not exists usage_ledger_created_idx on public.usage_ledger (created_at desc);

-- Single gate the Edge Function calls before spending anything. Returns why it
-- said no, so the visitor gets the specific message rather than a generic error.
create or replace function public.bot_gate()
returns table (
    available       boolean,
    reason          text,
    notice          text,
    spent_micros    bigint,
    budget_micros   bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
    s            public.bot_settings%rowtype;
    month_spend  bigint;
    budget       bigint;
begin
    select * into s from public.bot_settings where id = 1;

    if s is null then
        -- No settings row means the schema is half-applied. Fail closed: a bot
        -- that stays quiet is a better failure than one that spends unmetered.
        return query select false, 'misconfigured'::text,
            'The assistant is unavailable.'::text, 0::bigint, 0::bigint;
        return;
    end if;

    if not s.enabled then
        return query select false, 'disabled'::text, s.disabled_notice, 0::bigint, 0::bigint;
        return;
    end if;

    budget := s.monthly_budget_cents::bigint * 1000000;

    select coalesce(sum(cost_micros), 0) into month_spend
    from public.usage_ledger
    where created_at >= date_trunc('month', now());

    if month_spend >= budget then
        return query select false, 'over_budget'::text, s.budget_notice, month_spend, budget;
        return;
    end if;

    return query select true, 'ok'::text, ''::text, month_spend, budget;
end;
$$;

-- Called after a model response, with the token counts the API actually reported.
-- Prices are per million tokens, in micro-cents, matching Haiku 4.5: $1 input,
-- $5 output. Passed in rather than hardcoded so changing model or pricing does
-- not mean editing this function.
create or replace function public.record_model_spend(
    in_tokens integer,
    out_tokens integer,
    input_micros_per_mtok bigint default 100000000,   -- $1.00 per 1M tokens
    output_micros_per_mtok bigint default 500000000   -- $5.00 per 1M tokens
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
    cost bigint;
begin
    cost := (in_tokens::bigint * input_micros_per_mtok / 1000000)
          + (out_tokens::bigint * output_micros_per_mtok / 1000000);

    insert into public.usage_ledger (cost_micros, input_tokens, output_tokens)
    values (cost, in_tokens, out_tokens);

    return cost;
end;
$$;

alter table public.bot_settings enable row level security;
alter table public.usage_ledger enable row level security;

-- Same rule as the quota functions: these are SECURITY DEFINER and write or
-- reveal spend, so only the service role (the Edge Function) may call them.
revoke execute on function public.bot_gate() from public, anon, authenticated;
revoke execute on function public.record_model_spend(integer, integer, bigint, bigint) from public, anon, authenticated;
