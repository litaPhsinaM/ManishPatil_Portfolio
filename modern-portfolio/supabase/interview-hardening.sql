-- Hardening for answer_cache — run after interview.sql
--
-- Model answers were being cached and then served to every later visitor from
-- the cache branch, which runs BEFORE the kill switch, the quota, and the budget
-- counter. One weak answer therefore became the permanent canonical answer to
-- that question, bypassing every guard, with nothing surfacing that it had.
--
-- Now model answers are stored unapproved: they still spare the visitor who
-- triggered them a second charge, but they are not served to anyone else until
-- reviewed. FAQ answers are Manish's own words, so they are approved on write.

alter table public.answer_cache
    add column if not exists approved boolean not null default false;

-- Answers that came from the hand-written FAQ are already his words.
update public.answer_cache set approved = true where source = 'faq' and approved = false;

-- The cache lookup filters on this pair.
create index if not exists answer_cache_lookup_idx
    on public.answer_cache (question_norm) where approved;

-- Review queue: what the model said, awaiting a yes or no.
--   select * from public.pending_answers;
--   update public.answer_cache set approved = true where id = 42;   -- keep
--   delete from public.answer_cache where id = 42;                  -- discard
create or replace view public.pending_answers as
    select id, question_original, answer, created_at
    from public.answer_cache
    where source = 'model' and not approved
    order by created_at desc;
