-- Interview.exe — FAQ lookup, answer cache, and rate limiting
--
-- Run once in the Supabase SQL editor, or via psql.
--
-- Design: a question is answered from the cheapest source that can answer it.
--
--   1. answer_cache  — this exact question was asked before      (free)
--   2. faq           — a hand-written answer matches it well     (free)
--   3. the model     — genuinely novel question                  (fractions of a cent)
--
-- A model answer is written back into answer_cache, so every novel question is
-- paid for exactly once, ever.
--
-- The matching threshold is deliberately conservative. Serving a near-miss from
-- the FAQ is worse than falling through to the model: "does he know Kubernetes?"
-- quietly answered from the Docker entry is a false claim that looks deliberate,
-- because it came from a curated answer. Falling through costs a fraction of a
-- cent; a wrong answer costs an interview.

create extension if not exists pg_trgm;

-- ── Hand-written answers ────────────────────────────────────────────────────
create table if not exists public.faq (
    id          bigint generated always as identity primary key,
    question    text not null,
    answer      text not null,
    -- Extra phrasings that should hit this entry, so the matcher doesn't rely on
    -- the canonical question alone.
    aliases     text[] not null default '{}',
    created_at  timestamptz not null default now(),

    -- Maintained by the trigger below rather than GENERATED: array_to_string is
    -- only STABLE (it depends on type output functions), and a generated column
    -- requires every function in its expression to be IMMUTABLE.
    search      tsvector
);

-- Weighted so a hit on the question itself outranks a hit on the answer body —
-- otherwise a keyword that happens to appear in some other entry's prose can
-- outrank the entry actually about that keyword.
create or replace function public.faq_refresh_search()
returns trigger
language plpgsql
as $$
begin
    new.search :=
        setweight(to_tsvector('english'::regconfig, coalesce(new.question, '')), 'A') ||
        setweight(to_tsvector('english'::regconfig, array_to_string(coalesce(new.aliases, '{}'), ' ')), 'A') ||
        setweight(to_tsvector('english'::regconfig, coalesce(new.answer, '')), 'C');
    return new;
end;
$$;

drop trigger if exists faq_refresh_search_trg on public.faq;
create trigger faq_refresh_search_trg
    before insert or update of question, aliases, answer on public.faq
    for each row execute function public.faq_refresh_search();

create index if not exists faq_search_idx on public.faq using gin (search);
create index if not exists faq_question_trgm_idx on public.faq using gin (question gin_trgm_ops);

-- ── Answers already produced, keyed on the normalized question ──────────────
create table if not exists public.answer_cache (
    id                bigint generated always as identity primary key,
    question_norm     text not null unique,
    question_original text not null,
    answer            text not null,
    source            text not null check (source in ('faq', 'model')),
    hits              integer not null default 1,
    created_at        timestamptz not null default now()
);

-- ── Questions nothing could answer — this is the FAQ backlog ────────────────
create table if not exists public.unanswered_log (
    id          bigint generated always as identity primary key,
    question    text not null,
    created_at  timestamptz not null default now()
);

-- ── Per-caller throttle ─────────────────────────────────────────────────────
create table if not exists public.rate_limits (
    id          bigint generated always as identity primary key,
    caller_key  text not null,
    created_at  timestamptz not null default now()
);

create index if not exists rate_limits_lookup_idx
    on public.rate_limits (caller_key, created_at desc);

-- ── Matching ────────────────────────────────────────────────────────────────
-- Expands contractions written without an apostrophe. "whats" stems to the
-- lexeme 'what', which is not a stopword in that form, so AND-matching then
-- demands a 'what' the FAQ vector doesn't contain — "whats his degree" finds
-- nothing while "what is his degree" reduces to 'degre' and matches. Expanding
-- first puts both phrasings on the same footing.
create or replace function public.normalize_question(raw text)
returns text
language sql
immutable
as $$
    select regexp_replace(
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(lower(coalesce(raw, '')),
                        '\m(what|who|where|when|how|that|there|here|he|she|it)s\M', '\1 is', 'g'),
                    '\m(do|does|did|is|are|was|were|has|have|had|would|could|should|will|ca|wo)n''?t\M', '\1 not', 'g'),
                '\m(i|you|we|they)(re|ve|m|ll)\M', '\1 are', 'g'),
            '[^a-z0-9+#. ]', ' ', 'g'),
        '\s+', ' ', 'g');
$$;

-- Returns the best FAQ answer for a question, or nothing if no entry clears the
-- bar. AND semantics over the query lexemes, with stemming, so "engineering"
-- matches "engineer".
--
-- Deliberately NOT using trigram similarity on the question string. Measured
-- against this FAQ, similarity to "Does he know Python?" scored 0.52 for
-- "does he know rust" and 0.57 for "does he know go" — higher than the 0.48
-- scored by the genuine typo "does he no pyton". Whole-string similarity
-- measures shared boilerplate, not shared subject, so no threshold separates a
-- typo from a different question wearing the same phrasing. Losing typo
-- tolerance costs one fall-through; keeping it risks answering a Rust question
-- with the Python answer.
create or replace function public.match_faq(
    question_text text,
    rank_threshold real default 0.05
)
returns table (id bigint, question text, answer text, score real)
language sql
stable
as $$
    with query as (
        select websearch_to_tsquery(
            'english'::regconfig,
            public.normalize_question(question_text)
        ) as tsq
    )
    select f.id, f.question, f.answer, ts_rank(f.search, query.tsq)::real as score
    from public.faq f, query
    where query.tsq is not null
      and f.search @@ query.tsq
      and ts_rank(f.search, query.tsq) >= rank_threshold
    order by score desc
    limit 1;
$$;

-- The trigram index backed the similarity path that was just removed.
drop index if exists public.faq_question_trgm_idx;

-- ── Access control ──────────────────────────────────────────────────────────
-- Everything here is reached only through the Edge Function, which authenticates
-- with the service role. Anonymous callers get no policies at all, so with RLS
-- enabled the browser cannot read the FAQ, the cache, or the rate-limit ledger
-- directly — the only way in is through the function, where the throttle lives.
alter table public.faq enable row level security;
alter table public.answer_cache enable row level security;
alter table public.unanswered_log enable row level security;
alter table public.rate_limits enable row level security;
