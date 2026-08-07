-- Fixes two problems left by faq-refresh-2026-08.sql.
--
-- 1. Doubled apostrophes. That file quoted values with $q$...$q$ dollar quoting, where
--    '' is two literal apostrophes rather than an escaped one. Six questions were
--    written as "Manish''s" and so failed to match the rows they were meant to update,
--    inserting malformed duplicates instead. This repairs the text, moves the corrected
--    answer onto the original row, and removes the duplicate.
--
-- 2. Four stale rows the first pass missed, still carrying the 4,000-5,000 device
--    count, the 480,000-image dataset, the 100,000-record claim, or "security-focused"
--    as the target role.
--
-- Safe to run more than once.

begin;

-- ─── 1. Repair the doubled apostrophes ───────────────────────────────────────
-- Fix the text first, so the malformed rows can be matched against their originals.
update public.faq
   set question = replace(question, '''''', '''')
 where question like '%''''%';

-- Where repairing created a duplicate of an existing question, keep the older row
-- (its id is referenced by nothing, but it is the one that has been there) and move
-- the newer, corrected answer onto it.
update public.faq f
   set answer  = dup.answer,
       aliases = case when dup.aliases = '{}' then f.aliases else dup.aliases end
  from (
        select distinct on (question) question, answer, aliases, id
          from public.faq
         order by question, id desc
       ) dup
 where f.question = dup.question
   and f.id < dup.id;

delete from public.faq f
 where exists (
        select 1 from public.faq g
         where g.question = f.question
           and g.id < f.id
       );

-- ─── 2. Stale rows the first pass missed ─────────────────────────────────────

update public.faq set answer =
 'Manish combines systems administration, software development and data engineering. Day to day he runs device and account operations in higher education across an inventory of roughly 3,500 devices, and builds the internal software his team uses. Earlier roles add full-stack web work at CaspianLogic and data collection and pipeline work at Yali.'
 where question = 'How would you summarize Manish''s background?';

update public.faq set answer =
 'His resume does not publish reliable volume figures for that work. At Yali he collected, cleaned and annotated banking data for model training, and his CNN project used a synthetic image dataset he describes as small and well separated. For exact numbers, ask him directly.'
 where question = 'What data volume has Manish worked with?';

update public.faq set answer =
 'A CNN he built from scratch in PyTorch to classify six to eight synthetic geometric shapes seen from a wide range of angles. He wrote the full pipeline rather than calling a library end to end: preprocessing, augmentation, normalisation, the train and validation split, GPU training, evaluation, and reproducible checkpoints. Accuracy came out very high, which reflects a small, clean, well-separated dataset more than model sophistication.'
 where question = 'What is Manish''s 3D shape classification project?';

update public.faq set answer =
 'Nothing published names a single biggest project. By scale of use, the technology checkout and inventory system he built at CSUDH is the largest: it runs across five to six programs and departments and supports an inventory of roughly 3,500 devices.'
 where question = 'What is Manish''s biggest project?';

update public.faq set answer =
 'Yes. Cloud operations is one of the two directions he is actively pursuing, alongside systems administration. He has pipeline projects on both Azure and GCP, and AWS appears in his skill set.'
 where question = 'Is Manish interested in cloud roles?';

update public.faq set answer =
 'Systems administration or cloud operations, with real responsibility for infrastructure and room to keep learning. He has said he would rather understand the fundamentals properly than move past them quickly.'
 where question = 'What is Manish looking for in his next role?';

commit;
