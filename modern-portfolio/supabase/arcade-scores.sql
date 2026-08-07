-- Arcade leaderboard: one board per game instead of Snake only.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is safe to run more than once.
--
-- What it does, and why it is done this way:
--
--   The original table was `snake_scores`. Rather than create a second table and
--   copy rows across (two places to keep in sync, and a window where the live board
--   is reading one and writing the other), this RENAMES the existing table and adds
--   a `game` discriminator. A rename preserves every row, index, grant and policy,
--   so the Snake scores already on the board survive untouched and simply become
--   rows where game = 'snake'.
--
-- Threat model is unchanged from schema.sql: the anon key ships inside the browser
-- bundle, because that is what it is for. Anyone can POST here without playing the
-- game. The defence is not "prevent forgery", it is "bound the damage" — scores are
-- range-checked per game, initials are three letters so the board cannot carry a
-- message, and rows are insert-only for anonymous users.

-- ── 1. Rename, if it has not happened already ──────────────────────────────────
do $$
begin
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'snake_scores')
       and not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'arcade_scores')
    then
        alter table public.snake_scores rename to arcade_scores;
    end if;
end $$;

-- Fresh project with no Snake history: create it outright.
create table if not exists public.arcade_scores (
    id          bigint generated always as identity primary key,
    initials    text        not null,
    score       integer     not null,
    created_at  timestamptz not null default now()
);

-- ── 2. The game discriminator ─────────────────────────────────────────────────
-- Defaulted to 'snake' so existing rows are labelled correctly by the backfill
-- that the default itself performs on an ALTER.
alter table public.arcade_scores
    add column if not exists game text not null default 'snake';

alter table public.arcade_scores drop constraint if exists arcade_scores_game_allowed;
alter table public.arcade_scores
    add constraint arcade_scores_game_allowed
    check (game in ('snake', 'flappy', 'traffic'));

-- ── 3. Constraints ────────────────────────────────────────────────────────────
-- Old single-game constraints, dropped under both their possible names: a rename
-- carries constraint names over unchanged, so these are still `snake_scores_*`.
alter table public.arcade_scores drop constraint if exists snake_scores_score_range;
alter table public.arcade_scores drop constraint if exists snake_scores_initials_format;
alter table public.arcade_scores drop constraint if exists snake_scores_initials_allowed;
alter table public.arcade_scores drop constraint if exists arcade_scores_score_range;
alter table public.arcade_scores drop constraint if exists arcade_scores_initials_format;
alter table public.arcade_scores drop constraint if exists arcade_scores_initials_allowed;

-- Three capitals, arcade style. Nothing else is expressible.
alter table public.arcade_scores
    add constraint arcade_scores_initials_format
    check (initials ~ '^[A-Z]{3}$');

-- Per-game plausibility ceiling. Mirrors SCORE_CEILINGS in src/lib/leaderboard.ts.
--   snake    20x20 board from length 1, 10 points a pellet → 399 * 10 = 3990
--   flappy   no natural maximum; this is "past any human run", not exact
--   traffic  same reasoning, one point per car passed
alter table public.arcade_scores
    add constraint arcade_scores_score_range
    check (
        score >= 0 and (
            (game = 'snake'   and score <= 3990) or
            (game = 'flappy'  and score <= 5000) or
            (game = 'traffic' and score <= 5000)
        )
    );

-- Small blocklist for the handful of ugly things three letters can spell.
alter table public.arcade_scores
    add constraint arcade_scores_initials_allowed
    check (initials not in (
        'ASS', 'FUK', 'FUC', 'FCK', 'CUM', 'TIT',
        'FAG', 'NIG', 'SEX', 'DIK', 'DIC', 'PIS'
    ));

-- ── 4. Index ──────────────────────────────────────────────────────────────────
-- Every read is "top N for one game", so game leads the index.
drop index if exists public.snake_scores_ranking_idx;
create index if not exists arcade_scores_ranking_idx
    on public.arcade_scores (game, score desc, created_at asc);

-- ── 5. Row level security ─────────────────────────────────────────────────────
alter table public.arcade_scores enable row level security;

drop policy if exists "snake_scores_public_read" on public.arcade_scores;
drop policy if exists "snake_scores_public_insert" on public.arcade_scores;
drop policy if exists "arcade_scores_public_read" on public.arcade_scores;
drop policy if exists "arcade_scores_public_insert" on public.arcade_scores;

-- Anyone may read the board.
create policy "arcade_scores_public_read"
    on public.arcade_scores
    for select
    to anon, authenticated
    using (true);

-- Anyone may add a score. The column constraints above do the validating.
-- Deliberately no update or delete policy: anonymous callers cannot alter history.
create policy "arcade_scores_public_insert"
    on public.arcade_scores
    for insert
    to anon, authenticated
    with check (true);

-- ── Check it worked ───────────────────────────────────────────────────────────
-- select game, count(*), max(score) from public.arcade_scores group by game;
