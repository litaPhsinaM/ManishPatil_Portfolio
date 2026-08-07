-- Certification answers, aligned to the resume uploaded 2026-08-07.
--
-- That version drops CompTIA A+, the Data Analyst Bootcamp and the Cisco Data
-- Analytics credential, and lists Linux+ and AutoOps+. Manish has confirmed Linux+ is
-- in progress and AutoOps+ and Security+ are planned, so the answers say so explicitly
-- rather than implying either is held.
begin;
create temp table inc (question text primary key, answer text not null, aliases text[] not null default '{}') on commit drop;
insert into inc (question, answer, aliases) values

($q$What certifications does Manish have?$q$,
 $q$Completed: Jamf 100, Career Essentials in Generative AI (Microsoft and LinkedIn), Python for Everybody, and Introduction to SQL. In progress: CompTIA Linux+, with AutoOps+ and Security+ planned after it. Note that Jamf 100 is a training course rather than a certification.$q$,
 '{"certifications","certs","what certs does he have"}'),

($q$What certifications is Manish currently pursuing?$q$,
 $q$CompTIA Linux+ is in progress, with AutoOps+ and Security+ planned after it. He has said he would rather understand the fundamentals properly than move past them quickly.$q$,
 '{}'),

($q$Does Manish have CompTIA A+?$q$,
 $q$No. An earlier version of his resume listed A+ in progress, but the current one does not include it. What he is working through now is CompTIA Linux+, with AutoOps+ and Security+ planned.$q$,
 '{"A+","CompTIA A+"}'),

($q$Does Manish have CompTIA Linux+?$q$,
 $q$Not yet. It is in progress. It appears on his resume because he is actively working through it, not because it is held.$q$,
 '{"Linux+","linux plus"}'),

($q$Does Manish have CompTIA AutoOps+?$q$,
 $q$Not yet. It is planned after Linux+, so it appears on his resume as direction rather than as a credential he holds.$q$,
 '{"AutoOps+","autoops"}'),

($q$Did Manish complete a data analyst bootcamp?$q$,
 $q$An earlier version of his resume listed one. The current version does not, so treat it as no longer claimed. His current listed training is Jamf 100, Career Essentials in Generative AI, Python for Everybody, and Introduction to SQL.$q$,
 '{}'),

($q$Does Manish have a Cisco data analytics credential?$q$,
 $q$An earlier resume listed Cisco Data Analytics Essentials. The current version does not include it, so it is no longer claimed.$q$,
 '{}');

update public.faq f set answer = i.answer,
       aliases = case when i.aliases = '{}' then f.aliases else i.aliases end
  from inc i where f.question = i.question;

insert into public.faq (question, answer, aliases)
select i.question, i.answer, i.aliases from inc i
 where not exists (select 1 from public.faq f where f.question = i.question);
commit;
