begin;
create temp table inc (question text primary key, answer text not null, aliases text[] not null default '{}') on commit drop;
insert into inc (question, answer, aliases) values

($q$Did Manish work on data quality?$q$,
 $q$Yes. Investigating data quality problems was a core part of the Yali internship: missing values, duplicate records and inconsistent formats, caught before the processed datasets were handed on.$q$,
 '{"data quality","data validation"}'),

($q$What does Manish do day to day?$q$,
 $q$Device lifecycle and inventory across roughly 3,500 devices, Jamf and Apple School Manager administration, Windows and macOS support, WiFi, DNS and VPN issues, and Google Workspace onboarding and offboarding. Alongside that he maintains the department websites and the technology checkout platform he built.$q$,
 '{"what does he do at work","describe his daily work","daily responsibilities"}'),

($q$What is the technology checkout system Manish built?$q$,
 $q$A React and Node.js platform for booking and tracking equipment at CISE, with REST APIs, JWT authentication, role based access control, and PostgreSQL behind it. Instead of a long generic request form, a guided workflow recommends equipment based on what the user needs. It is used across five to six programs and departments.$q$,
 '{"checkout system","ticketing system","inventory system","what did he build at work"}'),

($q$What does Manish do with device lifecycle?$q$,
 $q$Asset tracking, workstation deployment, equipment recovery, and preparing devices for reuse across CISE programs and partner school sites. The inventory is roughly 3,500 devices.$q$,
 '{"device lifecycle","asset tracking","equipment recovery"}'),

($q$Does Manish provision accounts and devices?$q$,
 $q$Yes. He provisions accounts and prepares device deployments for different educational programs, working through Jamf and Apple School Manager, and handles workstation setup as part of onboarding.$q$,
 '{"provisioning","device setup","onboarding"}'),

($q$Does Manish work with CM1?$q$,
 $q$Yes. He rebuilt the CISE website in CM1 to meet campus accessibility and compliance requirements, and creates pages for individual programs within it.$q$,
 '{"CM1","CMS"}'),

($q$What content management systems does Manish use?$q$,
 $q$CM1 for the CISE website and WordPress for the Fabrication Lab pages, five to six of them.$q$,
 '{"CMS","wordpress"}'),

($q$Does Manish support Windows?$q$,
 $q$Yes. Windows support sits alongside macOS and iOS in his role, together with WiFi, DNS and VPN issues.$q$,
 '{"windows support"}'),

($q$Does Manish have experience with network access?$q$,
 $q$He coordinates with the campus security team on network access and wireless scheduling requirements. That is collaborative infrastructure work rather than a dedicated network engineering role.$q$,
 '{"network access","networking"}'),

($q$Has Manish worked in a school or district environment?$q$,
 $q$Yes. CISE works with partner school sites and school districts. He prepares device deployments for those sites and produces photography and video content for the districts CISE partners with.$q$,
 '{"school districts","K-12","education environment"}');

update public.faq f set answer = i.answer,
       aliases = case when i.aliases = '{}' then f.aliases else i.aliases end
  from inc i where f.question = i.question;

insert into public.faq (question, answer, aliases)
select i.question, i.answer, i.aliases from inc i
 where not exists (select 1 from public.faq f where f.question = i.question);
commit;
