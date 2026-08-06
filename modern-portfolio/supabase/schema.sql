-- Snake arcade leaderboard
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Threat model, stated plainly: the anon key ships inside the browser bundle, because
-- that is what it is for. Anyone can therefore POST directly to this table without
-- playing the game. There is no way around that on a static site with no server of
-- our own, so the defence is not "prevent forgery" — it is "bound the damage":
--
--   * scores are validated against what the game can actually produce
--   * initials are constrained to three letters, so the board cannot carry a message
--   * rows are insert-only for anonymous users: nobody can edit or delete history
--   * a per-IP-ish rate limit is impossible here, so the score ceiling does that work
--
-- If the board is ever spammed, `delete from public.snake_scores where ...` in the
-- SQL editor cleans it up; only you hold a key that can delete.

create table if not exists public.snake_scores (
    id          bigint generated always as identity primary key,
    initials    text        not null,
    score       integer     not null,
    created_at  timestamptz not null default now(),

    -- Three capitals, arcade style. Nothing else is expressible.
    constraint snake_scores_initials_format
        check (initials ~ '^[A-Z]{3}$'),

    -- The board is 20x20 and the snake starts at length 1, so 399 pellets at 10
    -- points each is the theoretical maximum. Anything above it is forged.
    constraint snake_scores_score_range
        check (score >= 0 and score <= 3990),

    -- Small blocklist for the handful of ugly things three letters can spell.
    -- Extend freely: alter table ... drop constraint, then recreate.
    constraint snake_scores_initials_allowed
        check (initials not in (
            'ASS', 'FUK', 'FUC', 'FCK', 'CUM', 'TIT',
            'FAG', 'NIG', 'SEX', 'DIK', 'DIC', 'PIS'
        ))
);

-- Serves the "top 10 by score" read without a sort.
create index if not exists snake_scores_ranking_idx
    on public.snake_scores (score desc, created_at asc);

alter table public.snake_scores enable row level security;

-- Anyone may read the board.
drop policy if exists "snake_scores_public_read" on public.snake_scores;
create policy "snake_scores_public_read"
    on public.snake_scores
    for select
    to anon, authenticated
    using (true);

-- Anyone may add a score. The column constraints above do the validating.
-- Deliberately no update or delete policy: anonymous callers cannot alter history.
drop policy if exists "snake_scores_public_insert" on public.snake_scores;
create policy "snake_scores_public_insert"
    on public.snake_scores
    for insert
    to anon, authenticated
    with check (true);
