-- Two-pass FAQ matching.
--
-- Pass 1 (AND over every content word) is precise but brittle: a single word that
-- appears nowhere in the entry kills the match. "is he good at python" fails on
-- "good", even though the question is obviously about Python.
--
-- Pass 2 strips conversational filler and retries on what is left. This does NOT
-- weaken the safety property that matters most: "does he know kubernetes" reduces
-- to just 'kubernetes', which still matches nothing and still correctly falls
-- through to the model. Only filler is removed — never the subject of the
-- question. A query that reduces to nothing matches nothing.

create or replace function public.strip_filler(question_text text)
returns text
language sql
immutable
as $$
    select coalesce(nullif(trim(regexp_replace(lower(question_text), '\y(does|do|did|is|are|was|were|has|have|had|can|could|would|will|should|tell|me|about|know|knows|known|good|great|any|much|well|really|actually|ever|before|use|used|uses|using|work|works|worked|working|experience|experienced|skill|skills|code|coding|familiar|comfortable|strong|proficient|hands|his|he|him|the|a|an|of|for|to|in|on|at|with|and|or|but|what|which|who|whom|whose|when|where|why|how|you|your|manish)\y', ' ', 'g')), ''), '')
$$;

create or replace function public.match_faq(
    question_text text,
    rank_threshold real default 0.08,
    similarity_threshold real default 0.45
)
returns table (id bigint, question text, answer text, score real)
language sql
stable
as $$
    with pass1 as (
        select f.id, f.question, f.answer,
               greatest(ts_rank(f.search, q.tsq), similarity(f.question, question_text))::real as score
        from public.faq f,
             lateral (select websearch_to_tsquery('english'::regconfig, question_text) as tsq) q
        where (q.tsq is not null and f.search @@ q.tsq
               and ts_rank(f.search, q.tsq) >= rank_threshold)
           or similarity(f.question, question_text) >= similarity_threshold
        order by score desc
        limit 1
    ),
    pass2 as (
        select f.id, f.question, f.answer, ts_rank(f.search, q.tsq)::real as score
        from public.faq f,
             lateral (select websearch_to_tsquery('english'::regconfig, public.strip_filler(question_text)) as tsq) q
        where not exists (select 1 from pass1)
          and q.tsq is not null
          and f.search @@ q.tsq
          and ts_rank(f.search, q.tsq) >= rank_threshold
        order by score desc
        limit 1
    )
    select * from pass1
    union all
    select * from pass2;
$$;
