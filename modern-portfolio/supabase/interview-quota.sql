-- Interview.exe — per-visitor question quota
--
-- Depends on the rate_limits table created in interview.sql.
--
-- A credit is spent ONLY when a question reaches the model. Cache hits and FAQ
-- matches cost nothing and must not call consume_question_credit() — that is what
-- makes a 5-question quota feel generous rather than stingy: a visitor can ask
-- twenty predictable questions and spend nothing, because the answers were
-- already written. The quota bites only on genuinely novel questions, which is
-- exactly the slice that costs money.
--
-- Order of operations in the Edge Function:
--   1. cache lookup   -> hit? return, no credit
--   2. match_faq()    -> hit? return, no credit
--   3. consume_question_credit() -> denied? return the refusal
--   4. call the model, write the answer into answer_cache
--
-- Calling consume before step 1 would charge visitors for answers you already
-- wrote, and the counter would read as arbitrary.

-- Spend one credit if the caller has any left. Returns the decision plus the
-- numbers needed to render "N of 5 remaining" without a second round trip.
create or replace function public.consume_question_credit(
    caller text,
    max_questions integer default 5,
    window_span interval default interval '24 hours'
)
returns table (allowed boolean, used integer, remaining integer, resets_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
    used_count integer;
    oldest timestamptz;
begin
    -- Serialize concurrent requests from the same caller. Without this, two
    -- simultaneous questions can both read "4 used" and both insert, letting a
    -- visitor spend a sixth credit by firing requests in parallel. Transaction
    -- scoped, so it releases on commit or rollback either way.
    perform pg_advisory_xact_lock(hashtext('question_credit:' || caller));

    select count(*)::integer, min(created_at)
      into used_count, oldest
      from public.rate_limits
     where caller_key = caller
       and created_at > now() - window_span;

    if used_count >= max_questions then
        -- Rolling window: the quota frees up when the oldest question in the
        -- window ages out, not at a fixed wall-clock hour.
        return query select false, used_count, 0, oldest + window_span;
        return;
    end if;

    insert into public.rate_limits (caller_key) values (caller);

    used_count := used_count + 1;
    if oldest is null then
        oldest := now();
    end if;

    return query select true, used_count, max_questions - used_count, oldest + window_span;
end;
$$;

-- Read the counter without spending anything — for rendering the status bar on
-- page load, so the number is server-truth rather than a browser guess.
create or replace function public.question_credit_status(
    caller text,
    max_questions integer default 5,
    window_span interval default interval '24 hours'
)
returns table (used integer, remaining integer, resets_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
    select
        count(*)::integer,
        greatest(max_questions - count(*), 0)::integer,
        min(created_at) + window_span
    from public.rate_limits
    where caller_key = caller
      and created_at > now() - window_span;
$$;

-- Rows outside every window are dead weight. Call periodically (a cron job, or
-- opportunistically from the Edge Function).
create or replace function public.prune_rate_limits(
    older_than interval default interval '48 hours'
)
returns integer
language sql
security definer
set search_path = public
as $$
    with deleted as (
        delete from public.rate_limits
        where created_at < now() - older_than
        returning 1
    )
    select count(*)::integer from deleted;
$$;

-- The browser must never be able to call these directly: consume_question_credit
-- is SECURITY DEFINER and writes the ledger, so an anon caller with execute
-- rights could drain or inspect someone else's quota. Only the service role,
-- which the Edge Function uses, may execute them.
revoke execute on function public.consume_question_credit(text, integer, interval) from public, anon, authenticated;
revoke execute on function public.question_credit_status(text, integer, interval) from public, anon, authenticated;
revoke execute on function public.prune_rate_limits(interval) from public, anon, authenticated;
