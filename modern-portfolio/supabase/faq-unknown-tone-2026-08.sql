-- Answers for the "I genuinely do not know" path, in the bot's own dry register.
--
-- Deliberately NOT applied to the "does he know <technology>" rows. Those are useful,
-- factual answers to a fair recruiter question, and joking there would read as mocking
-- the person asking. The wry tone belongs where the bot has nothing at all.
begin;
create temp table inc (question text primary key, answer text not null, aliases text[] not null default '{}') on commit drop;
insert into inc (question, answer, aliases) values

($q$I have a question you cannot answer$q$,
 $q$Likely. I work from a fixed set of answers Manish wrote, so anything outside it gets an honest blank rather than a confident guess. He is building a retrieval layer so I can read his whole resume and project history instead; until that lands, the contact form reaches a human with none of my limitations.$q$,
 '{"you dont know","cant you answer","why dont you know"}'),

($q$Are you a real AI?$q$,
 $q$Partly. Right now I match your question against answers Manish wrote himself, which is closer to a very well-read FAQ than to intelligence. A proper retrieval-augmented setup is in progress, at which point I will be able to take credit for more than pattern matching.$q$,
 '{"are you AI","are you chatgpt","are you a bot","is this AI"}'),

($q$Why can you not answer that?$q$,
 $q$Because nothing written covers it, and inventing an answer about someone else's career is the one thing I am built not to do. A wrong yes could cost him an interview, which is a poor trade for sounding helpful.$q$,
 '{"why cant you answer","why no answer"}'),

($q$Will this bot get better?$q$,
 $q$That is the plan. Manish is adding a retrieval layer so I can answer from his full resume, projects and site content rather than a written list. I will still refuse to make things up, which is the only feature I am genuinely proud of.$q$,
 '{"will you improve","future of this bot","RAG"}');

update public.faq f set answer = i.answer,
       aliases = case when i.aliases = '{}' then f.aliases else i.aliases end
  from inc i where f.question = i.question;

insert into public.faq (question, answer, aliases)
select i.question, i.answer, i.aliases from inc i
 where not exists (select 1 from public.faq f where f.question = i.question);
commit;
