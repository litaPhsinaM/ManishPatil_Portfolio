-- Work experience answers, rewritten against Manish's updated CaspianLogic and Yali
-- bullets (August 2026).
--
-- Note on quoting: values use $q$...$q$ dollar quoting, where a single apostrophe is
-- literal. Do NOT double apostrophes inside these blocks; an earlier pass did that and
-- produced questions reading "Manish''s", which then failed to match their target rows.
--
-- Safe to run repeatedly. Every statement matches an existing question, so this only
-- rewrites answers and never inserts.

begin;

-- ─── Role summaries ──────────────────────────────────────────────────────────

update public.faq set answer = $q$He was a Software Developer Intern at CaspianLogic from May to October 2022, working on client web applications with React, Redux, Node.js, Express, MongoDB and REST APIs. He built responsive React interfaces and reusable components, managed frontend state with Redux, supported backend request handling and MongoDB integration, and tested and debugged both frontend and API functionality before client delivery.$q$
where question = $q$What was Manish's role at CaspianLogic?$q$;

update public.faq set answer = $q$He was a Data Engineering Intern at Yali Inc. from June to September 2019. He built Python web scraping workflows with Beautiful Soup to collect banking and financial data from multiple sources, cleaned and standardised it into structured datasets, annotated banking data used for model training, and wrote reusable Python scripts for ingestion and preprocessing.$q$
where question = $q$What was Manish's role at Yali Inc.?$q$;

-- ─── CaspianLogic capability rows ────────────────────────────────────────────

update public.faq set answer = $q$Yes. He worked on client web applications at CaspianLogic, and at CISE he built and maintains the technology checkout and inventory system his department uses.$q$
where question = $q$Does Manish have software development experience?$q$;

update public.faq set answer = $q$Yes. CaspianLogic does project-based consulting work in business process re-engineering and IT, and he contributed to client web applications there.$q$
where question = $q$Has Manish worked for a consulting firm?$q$;

update public.faq set answer = $q$Yes. His CaspianLogic work was on client web applications, tested and debugged before delivery. The technology checkout system he built at CISE is also in daily use.$q$
where question = $q$Has Manish shipped production software?$q$;

update public.faq set answer = $q$Yes. At CaspianLogic he contributed to client web applications, working across the interface, the REST API integrations and the backend.$q$
where question = $q$Has Manish built client-facing applications?$q$;

update public.faq set answer = $q$Yes. At CaspianLogic he developed responsive React interfaces and reusable components for forms, navigation and interactive application workflows.$q$
where question = $q$Does Manish build responsive interfaces?$q$;

-- The old answer claimed "more than 10 reusable components". That figure was not
-- measured and has been removed rather than restated.
update public.faq set answer = $q$At CaspianLogic he built responsive React interfaces and reusable components covering forms, navigation and interactive application workflows, connecting them to Redux state. No component count is published, so I will not invent one.$q$
where question = $q$How much frontend component work has Manish done?$q$;

update public.faq set answer = $q$His CaspianLogic role was project-based consulting work, so the projects varied over the internship. Nothing published says how many ran at the same time.$q$
where question = $q$Has Manish worked across concurrent client engagements?$q$;

update public.faq set answer = $q$Yes. At CaspianLogic he tested and debugged frontend and API functionality, resolving usability and integration issues before client delivery.$q$
where question = $q$Does Manish have software testing experience?$q$;

update public.faq set answer = $q$Yes. At CaspianLogic he worked across React, Redux, Node.js, Express and MongoDB on client web applications.$q$
where question = $q$Does Manish know the MERN stack?$q$;

update public.faq set answer = $q$Yes. At CaspianLogic he managed frontend application state with Redux and connected user interfaces to backend services through REST API integrations.$q$
where question = $q$Does Manish know Redux?$q$;

-- ─── Yali capability rows ────────────────────────────────────────────────────

update public.faq set answer = $q$Yes. He was a Data Engineering Intern at Yali, where he collected, cleaned, standardised and annotated banking data for machine learning workflows, and he has since built cloud data pipelines on GCP and Azure.$q$
where question = $q$Does Manish have data engineering experience?$q$;

update public.faq set answer = $q$Yes. At Yali he built Python web scraping workflows with Beautiful Soup to collect banking and financial data from multiple online sources.$q$
where question = $q$Does Manish know BeautifulSoup?$q$;

update public.faq set answer = $q$Yes. He used Pandas for cleaning and transforming data at Yali, and in the Uber pipeline project and his exploratory population analysis.$q$
where question = $q$Does Manish know Pandas?$q$;

update public.faq set answer = $q$Yes. Investigating data quality problems was a core part of the Yali internship: missing values, duplicate records and inconsistent formats, caught before the processed datasets were handed on.$q$
where question = $q$Did Manish work on data quality?$q$;

-- His resume credits the Yali internship with database indexing work; the bullet list
-- he uses now centres on collection, cleaning and annotation. Answer states what is
-- published without embellishing either version.
update public.faq set answer = $q$His resume lists PostgreSQL and MongoDB work at Yali including indexing, and he uses PostgreSQL today for the checkout system he built. For how deep that optimisation work went, ask him directly.$q$
where question = $q$Does Manish have database optimization experience?$q$;

commit;
