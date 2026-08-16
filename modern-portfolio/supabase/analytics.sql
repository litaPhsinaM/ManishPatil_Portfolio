-- Portfolio analytics: who visited, how far they got, what they clicked.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is safe to run more than once.
--
-- Threat model, same as arcade-scores.sql: the anon key ships inside the browser
-- bundle because that is what it is for. Anyone can POST fake events here. The
-- defence is not "prevent forgery", it is "bound the damage":
--
--   * insert-only for anon — no update, no delete, so history cannot be rewritten
--   * NO SELECT POLICY AT ALL — this is the important one. Someone holding the anon
--     key can add noise but cannot read a single row back. Analytics is the one
--     thing on this site that is genuinely private, so the anon key must not be a
--     key to it. Reads happen through the `insights` Edge Function, which holds the
--     service role key and a password, and never ships either to the browser.
--   * every text column is length-capped so rows cannot be used as free storage
--
-- Retention: there is no automatic cleanup, since free-tier projects have no
-- pg_cron. The delete statement at the bottom of this file trims old rows when you
-- feel like running it.

-- ── 1. Visits: one row per session ────────────────────────────────────────────
create table if not exists public.visits (
    id           bigint generated always as identity primary key,
    session_id   uuid        not null,
    started_at   timestamptz not null default now(),
    referrer     text,
    landing_path text,
    device       text,
    screen_w     integer,
    tz           text,
    is_bot       boolean     not null default false
);

-- One visit row per session. The client inserts once per sessionStorage lifetime;
-- this makes a retry after a flaky network a no-op conflict rather than a duplicate.
create unique index if not exists visits_session_idx on public.visits (session_id);
create index if not exists visits_started_idx on public.visits (started_at desc);

alter table public.visits drop constraint if exists visits_device_allowed;
alter table public.visits
    add constraint visits_device_allowed
    check (device is null or device in ('mobile', 'tablet', 'desktop'));

-- Referrers are hostnames, not full URLs — no query strings, so no accidental
-- collection of whatever a recruiter's ATS put in the link.
alter table public.visits drop constraint if exists visits_text_lengths;
alter table public.visits
    add constraint visits_text_lengths
    check (
        coalesce(length(referrer), 0)     <= 128 and
        coalesce(length(landing_path), 0) <= 128 and
        coalesce(length(tz), 0)           <= 64  and
        coalesce(screen_w, 0) between 0 and 20000
    );

-- ── 2. Events: what happened during a session ─────────────────────────────────
--
--   section   an IntersectionObserver saw them reach a section    label = 'projects'
--   click     they clicked something instrumented                 label = 'resume:download'
--   game      they started an arcade game                         label = 'snake'
--   pulse     engagement heartbeat, value = active ms so far      label = 'active'
--
-- Duration is carried by `pulse` rather than by updating the visit row: an UPDATE
-- policy would let anyone holding the anon key rewrite any session. Insert-only
-- plus max(value) gets the same number with none of that exposure.
create table if not exists public.events (
    id         bigint generated always as identity primary key,
    session_id uuid        not null,
    kind       text        not null,
    label      text        not null,
    value      integer,
    at         timestamptz not null default now()
);

create index if not exists events_at_idx      on public.events (at desc);
create index if not exists events_session_idx on public.events (session_id);
create index if not exists events_kind_idx    on public.events (kind, label);

alter table public.events drop constraint if exists events_kind_allowed;
alter table public.events
    add constraint events_kind_allowed
    check (kind in ('section', 'click', 'game', 'pulse'));

alter table public.events drop constraint if exists events_shape;
alter table public.events
    add constraint events_shape
    check (
        length(label) between 1 and 64 and
        -- 24h in ms. A larger value is a broken clock or a forged row, not a reader.
        (value is null or value between 0 and 86400000)
    );

-- ── 3. Row level security ─────────────────────────────────────────────────────
alter table public.visits enable row level security;
alter table public.events enable row level security;

drop policy if exists "visits_public_insert" on public.visits;
drop policy if exists "events_public_insert" on public.events;

create policy "visits_public_insert"
    on public.visits for insert to anon, authenticated with check (true);

create policy "events_public_insert"
    on public.events for insert to anon, authenticated with check (true);

-- Deliberately absent: any select, update or delete policy on either table.
-- With RLS on and no policy, anon reads return zero rows. The service role used by
-- the Edge Function bypasses RLS entirely, which is the only way in.

-- ── 4. The aggregate the dashboard reads ──────────────────────────────────────
-- One function, one round trip, one JSON document. The Edge Function never pulls
-- raw rows across the wire — it asks Postgres for the summary and forwards it.
create or replace function public.analytics_summary(window_days integer default 30)
returns json
language sql
security definer
set search_path = public
as $$
with span as (
    select now() - make_interval(days => greatest(1, least(window_days, 365))) as since
),
v as (
    select * from public.visits, span
    where started_at >= span.since and not is_bot
),
e as (
    select ev.* from public.events ev, span
    where ev.at >= span.since
      and ev.session_id in (select session_id from v)
),
-- One duration per session: the highest pulse it ever reported.
engaged as (
    select session_id, max(value) as ms
    from e where kind = 'pulse' and value is not null
    group by session_id
)
select json_build_object(
    'window_days', greatest(1, least(window_days, 365)),
    'generated_at', now(),

    'totals', (
        select json_build_object(
            'visits',        (select count(*) from v),
            'bots_filtered', (select count(*) from public.visits, span
                              where started_at >= span.since and is_bot),
            -- "Bounced" here means never scrolled past the first section, which is
            -- more honest for a one-page site than a page-count bounce rate.
            'engaged_visits', (select count(*) from v
                               where session_id in (select session_id from e where kind = 'section')),
            'median_seconds', (
                select coalesce(round(percentile_cont(0.5) within group (order by ms) / 1000.0), 0)
                from engaged
            ),
            'mean_seconds', (select coalesce(round(avg(ms) / 1000.0), 0) from engaged)
        )
    ),

    'daily', (
        select coalesce(json_agg(json_build_object('day', day, 'visits', visits) order by day), '[]'::json)
        from (
            select date_trunc('day', started_at)::date as day, count(*) as visits
            from v group by 1
        ) d
    ),

    'referrers', (
        select coalesce(json_agg(json_build_object('source', source, 'visits', visits) order by visits desc), '[]'::json)
        from (
            select coalesce(nullif(referrer, ''), 'direct') as source, count(*) as visits
            from v group by 1 order by 2 desc limit 12
        ) r
    ),

    'devices', (
        select coalesce(json_agg(json_build_object('device', device, 'visits', visits) order by visits desc), '[]'::json)
        from (
            select coalesce(device, 'unknown') as device, count(*) as visits
            from v group by 1
        ) d
    ),

    -- How deep people got: distinct sessions that reached each section.
    'sections', (
        select coalesce(json_agg(json_build_object('section', label, 'visits', visits) order by visits desc), '[]'::json)
        from (
            select label, count(distinct session_id) as visits
            from e where kind = 'section' group by 1
        ) s
    ),

    'clicks', (
        select coalesce(json_agg(json_build_object('label', label, 'clicks', clicks, 'visits', visits) order by clicks desc), '[]'::json)
        from (
            select label, count(*) as clicks, count(distinct session_id) as visits
            from e where kind = 'click' group by 1 order by 2 desc limit 20
        ) c
    ),

    'games', (
        select coalesce(json_agg(json_build_object('game', label, 'plays', plays) order by plays desc), '[]'::json)
        from (
            select label, count(*) as plays from e where kind = 'game' group by 1
        ) g
    )
);
$$;

-- The function is SECURITY DEFINER, so it reads straight past RLS. That makes who
-- may execute it the entire access control story: only the service role, which
-- lives in the Edge Function's environment and never reaches a browser.
revoke all on function public.analytics_summary(integer) from public, anon, authenticated;
grant execute on function public.analytics_summary(integer) to service_role;

-- ── Check it worked ───────────────────────────────────────────────────────────
-- select public.analytics_summary(30);
--
-- ── Retention, run by hand whenever ───────────────────────────────────────────
-- delete from public.events where at < now() - interval '180 days';
-- delete from public.visits where started_at < now() - interval '180 days';
