-- FAQ refresh, August 2026
--
-- Run in the Supabase SQL editor, or:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/faq-refresh-2026-08.sql
--
-- Safe to run repeatedly. Rows are matched on `question`: an existing question has its
-- answer replaced, a new one is inserted. Nothing is deleted, so hand-written rows that
-- are not listed here survive untouched.
--
-- This pass does two jobs:
--
--   1. Corrects answers that carried figures Manish never measured, or claims his
--      resume does not support. Specifically: the "4,000-5,000 devices" count (actual
--      figure is roughly 3,500), "JAMF-certified" (he completed Jamf 100 and 200,
--      which are courses), Yali's "roughly 30%" and "100K+ records" (never measured),
--      the CNN's "480,000-image dataset" (contradicts his own description of a small
--      dataset), and the PostgreSQL/SQLite ambiguity on the checkout system (it is
--      PostgreSQL). It also moves target roles from "security-focused" to "systems
--      administration and cloud operations", which is his current direction.
--
--   2. Fills coverage gaps found by auditing the table: the summer iPad deployment,
--      Apple School Manager, WiFi scheduling, offboarding, the checkout system's design
--      rationale, the CISE website rebuild, the Fabrication Lab, his instrumentation
--      background, several projects that had no rows at all, and the subjective
--      questions that visitors actually asked and the bot had no answer for.

begin;

create temp table faq_incoming (
    question text primary key,
    answer   text not null,
    aliases  text[] not null default '{}'
) on commit drop;

insert into faq_incoming (question, answer, aliases) values

-- ─── Corrections to existing rows ────────────────────────────────────────────

($q$What does Manish do?$q$,
 $q$Manish is an IT Specialist at CISE, part of California State University, Dominguez Hills. He supports the systems, devices and digital services used across several educational programs and partner school sites, looks after an inventory of roughly 3,500 devices, and builds the internal software his team depends on.$q$,
 '{}'),

($q$How would you summarize Manish''s background?$q$,
 $q$His background combines systems administration, software development and data engineering. Day to day he runs device and account operations in higher education; alongside that he has shipped full-stack web work at CaspianLogic, built data collection and cleaning pipelines at Yali, and done cloud pipeline and PyTorch work during his master's.$q$,
 '{}'),

($q$Does Manish have mobile device management experience?$q$,
 $q$Yes. He administers Apple devices through Jamf and Apple School Manager: writing configuration profiles and policies, troubleshooting iOS issues, and handling deployments. The inventory he looks after is roughly 3,500 devices.$q$,
 '{}'),

($q$Does Manish support macOS?$q$,
 $q$Yes. Apple devices are the bulk of what he administers, roughly 3,500 devices across macOS and iOS, with Windows workstation support as well.$q$,
 '{}'),

($q$Does Manish know PostgreSQL?$q$,
 $q$Yes. He worked with PostgreSQL at Yali, uses it in project work, and it is the database behind the technology checkout system he built at CSUDH.$q$,
 '{}'),

($q$Does Manish know SQLite?$q$,
 $q$Yes. SQLite stores data for his football match prediction application. The checkout system he built at work uses PostgreSQL rather than SQLite.$q$,
 '{}'),

($q$What database does Manish''s CSUDH platform use?$q$,
 $q$PostgreSQL. The technology checkout and inventory system he built at CSUDH runs on PostgreSQL, with a React front end and a Node.js and Express back end.$q$,
 '{}'),

($q$Does Manish know Apache Airflow?$q$,
 $q$Yes. Airflow is listed on his resume for the Yali internship, where he worked on scheduled ingestion as part of the pipelines feeding the company's model training.$q$,
 '{}'),

($q$Did Manish improve pipeline performance?$q$,
 $q$There is no measured performance figure published for that work. What his resume describes is building the collection, cleaning and annotation pipelines that fed model training at Yali. If you want a specific number, ask him directly rather than take one from me.$q$,
 '{}'),

($q$Does Manish know PyTorch?$q$,
 $q$Yes. He built and trained a CNN from scratch in PyTorch to classify synthetic 3D objects, writing the whole pipeline himself: preprocessing, augmentation, normalisation, train and validation splitting, GPU-accelerated training, evaluation, and reproducible checkpoints.$q$,
 '{}'),

($q$How large is the environment Manish supports?$q$,
 $q$Roughly 3,500 devices. It is mostly Apple hardware, macOS and iOS, with Windows workstation support alongside it.$q$,
 '{}'),

($q$What is Manish''s 3D shape classification project?$q$,
 $q$A CNN he built from scratch in PyTorch to classify six to eight synthetic geometric shapes seen from a wide range of angles. He wrote the full pipeline rather than calling a library end to end: preprocessing, augmentation, normalisation, the train and validation split, GPU training, evaluation, and saving weights so runs were reproducible. Accuracy came out very high, which reflects a small, clean, well-separated dataset more than model sophistication.$q$,
 '{}'),

($q$What machine learning projects has Manish built?$q$,
 $q$The main one is a PyTorch CNN that classifies synthetic 3D geometric shapes across many orientations, built end to end for his master's. At Yali he also worked on the data side of machine learning: collecting, cleaning and annotating banking data for model training.$q$,
 '{}'),

($q$Is Manish JAMF certified?$q$,
 $q$He has completed Jamf 100 and Jamf 200, which are Jamf's training courses rather than a certification. The accurate phrasing is that he is Jamf 100 and 200 trained, and he administers Jamf daily.$q$,
 '{}'),

($q$What roles is Manish looking for?$q$,
 $q$Systems administration and cloud operations, where he can work on more complex infrastructure while continuing to learn.$q$,
 '{}'),

($q$Is Manish interested in security roles?$q$,
 $q$Security is part of his interest and Security+ is on his certification plan, but the roles he is actively pursuing are systems administration and cloud operations.$q$,
 '{}'),

($q$Does Manish have SOC or SIEM analyst experience?$q$,
 $q$Professional SOC or SIEM analyst work is not on his resume. He works with the campus security team on network matters, but that is not the same as prior SOC experience.$q$,
 '{}'),

($q$Why is Manish leaving his current job?$q$,
 $q$Nothing published says he is leaving or gives a reason. What it says is that he is pursuing systems administration and cloud operations roles, where he can work on more complex infrastructure.$q$,
 '{}'),

-- ─── Current role: the work that had no rows ─────────────────────────────────

($q$What does Manish do day to day?$q$,
 $q$Most weeks: Jamf policies and configuration profiles, setting up new workstations and devices, creating accounts, and handling the offboarding side when someone leaves. Alongside that he maintains the department's websites and builds and supports the technology checkout system.$q$,
 '{"what does he do at work","describe his daily work"}'),

($q$How many devices does Manish manage?$q$,
 $q$Roughly 3,500. That is the inventory he looks after at CISE, mostly Apple with some Windows.$q$,
 '{"how many devices","fleet size"}'),

($q$Has Manish done any large device deployments?$q$,
 $q$Yes. Over one summer a team of three prepared 25 to 30 carts of 40 iPads each for three school sites. That work included wiping the devices, re-enrolling them, and configuring them for specific programs before the fall term.$q$,
 '{"large deployment","bulk device setup"}'),

($q$Does Manish use Apple School Manager?$q$,
 $q$Yes. He uses Apple School Manager alongside Jamf to enrol and configure devices in bulk, including rebuilding the iPad carts used across partner school sites between terms.$q$,
 '{"ASM","apple school manager"}'),

($q$Does Manish work with WiFi or networking?$q$,
 $q$Yes. He builds the WiFi schedule for the coming semester and coordinates it with the campus security and networking teams. DNS and VPN support are also part of the role.$q$,
 '{"wifi","networking","network experience"}'),

($q$Does Manish work with the campus security team?$q$,
 $q$Yes. He collaborates with campus security and networking teams, including on WiFi scheduling. It is collaborative infrastructure work rather than a dedicated security analyst role.$q$,
 '{}'),

($q$Does Manish handle onboarding and offboarding?$q$,
 $q$Yes, and the offboarding half is the part people tend to forget. When someone leaves he closes their Google Workspace account, transfers file ownership to their supervisor, and returns their equipment to inventory.$q$,
 '{"offboarding","account lifecycle","when someone leaves"}'),

($q$Does Manish manage Google Workspace?$q$,
 $q$Yes. He manages the Google Workspace account lifecycle: creating accounts, closing them when people leave, and transferring ownership of their files to supervisors.$q$,
 '{"google workspace","gsuite"}'),

($q$What is the technology checkout system Manish built?$q$,
 $q$An internal system for booking and tracking equipment at CISE. He built it with React, Node.js and Express, and PostgreSQL, with JWT authentication, role-based access control, audit logging, and automated checkout and return workflows. It is used across five to six programs and departments.$q$,
 '{"checkout system","ticketing system","inventory system"}'),

($q$Why did Manish build the checkout system?$q$,
 $q$Booking equipment meant filling out a long, generic request form, so people put it off or gave up. He replaced it with a guided workflow that recommends equipment based on what the user actually needs, rather than asking them to describe it.$q$,
 '{}'),

($q$Does Manish do web development at work?$q$,
 $q$Yes. He rebuilt the CISE website to meet campus compliance requirements and builds out pages for the programs and departments under it. He also maintains the Fabrication Lab content in WordPress.$q$,
 '{"website work","wordpress"}'),

($q$Did Manish rebuild the CISE website?$q$,
 $q$Yes. He rebuilt it to meet campus compliance standards, including accessibility requirements, and builds the individual program and department pages across it.$q$,
 '{}'),

($q$What is the Fabrication Lab?$q$,
 $q$It is one of the areas under CISE. Manish maintains its section of the site, around five or six pages, in WordPress.$q$,
 '{"fab lab"}'),

($q$Does Manish know about web accessibility?$q$,
 $q$Yes. The CISE site he rebuilt had to meet campus compliance standards, which includes accessibility requirements, and ADA-compliant web work is listed among his skills.$q$,
 '{"ADA","accessibility","WCAG"}'),

($q$Does Manish do photography or video at work?$q$,
 $q$Yes. He shoots and edits photo and video for CISE, including pieces for the school districts the department works with, using Adobe Premiere Pro and Illustrator.$q$,
 '{"video production","media work"}'),

($q$Does Manish mentor anyone?$q$,
 $q$Yes. He mentors the student IT assistants on his team and supervised an undergraduate intern over the summer. He is not a manager by title.$q$,
 '{"leadership","does he lead a team"}'),

($q$Was Manish an Apple Teacher?$q$,
 $q$Yes. His resume lists an Apple Teacher role teaching Swift programming to elementary and high school students in LA County.$q$,
 '{"apple teacher","teaching experience","swift"}'),

($q$Does Manish write Jamf policies?$q$,
 $q$Yes. Writing configuration profiles and policies in Jamf is part of his regular work, along with iOS troubleshooting and enrolment.$q$,
 '{}'),

-- ─── Projects with no coverage ───────────────────────────────────────────────

($q$What projects has Manish built?$q$,
 $q$Cloud data pipelines on Azure and GCP, a PyTorch CNN for 3D shape classification, an exploratory analysis of world population data, a football match prediction web app, a full-stack React and MySQL app, a soccer social platform, and this portfolio site. At work he built the technology checkout and inventory system.$q$,
 '{"list his projects","what has he built"}'),

($q$What is the Azure Olympics project?$q$,
 $q$An end-to-end data pipeline on Azure. He ingested source data with Azure Data Factory, transformed it with Spark on Azure Databricks, and loaded the result into Azure Synapse Analytics for warehousing.$q$,
 '{"azure project","olympics project"}'),

($q$What is the Uber data engineering project?$q$,
 $q$A pipeline on Google Cloud that processes Uber trip data. He used Mage on Google Compute Engine for orchestration, applied fact and dimension modelling, stored the result in BigQuery, and built a Google Data Studio dashboard on top of it.$q$,
 '{"uber project","gcp project"}'),

($q$What is Manish''s world population project?$q$,
 $q$An exploratory data analysis of global population trends using Python, Pandas and Seaborn, including correlation studies and continent-level trend analysis.$q$,
 '{"EDA project"}'),

($q$What is the Soccer Social platform?$q$,
 $q$A social application for soccer fans, focused on community interaction and the interface. It is a JavaScript web project from his portfolio.$q$,
 '{}'),

($q$Tell me about this portfolio site$q$,
 $q$He built it in React, TypeScript and Vite as an interactive Windows 98 desktop, with a taskbar, Start menu, CRT overlay and scroll-driven animation. It also carries playable games with a shared leaderboard on PostgreSQL, a Signals section that pulls live security, AI and software feeds daily through GitHub Actions, and this assistant.$q$,
 '{"portfolio site","this website","who built this site"}'),

($q$What is the Signals section?$q$,
 $q$A live feed panel on the site. A scheduled job runs every morning, pulls from three public sources including CISA's known exploited vulnerabilities catalogue, arXiv and Hacker News, filters the security entries down to the platforms he actually administers, and republishes the site. Nothing on it is typed by hand.$q$,
 '{"signals","live feeds"}'),

($q$Does the portfolio have games?$q$,
 $q$Yes, three: Snake, Flappy and Traffic Racer, each with a shared high score board backed by PostgreSQL.$q$,
 '{"games","snake"}'),

-- ─── Background and education ────────────────────────────────────────────────

($q$Why did Manish switch from instrumentation to computer science?$q$,
 $q$His bachelor's was in Instrumentation and Control Systems Engineering at the University of Mumbai. He moved into computer science because he had started to enjoy the coding side of it, and went on to a master's in Computer Science at CSUDH.$q$,
 '{"why did he switch","career change","non-CS background"}'),

($q$What did Manish study for his bachelor''s?$q$,
 $q$Instrumentation and Control Systems Engineering at the University of Mumbai, completed in 2020.$q$,
 '{"bachelors","undergraduate degree"}'),

($q$When did Manish graduate?$q$,
 $q$He completed his bachelor's at the University of Mumbai in 2020 and his M.S. in Computer Science at CSUDH in December 2023.$q$,
 '{"graduation date","when did he finish"}'),

($q$Is Manish willing to relocate?$q$,
 $q$Yes, he is open to relocating.$q$,
 '{"relocation","will he move"}'),

($q$What certifications is Manish working on?$q$,
 $q$CompTIA Linux+ is in progress, with AutoOps+ and Security+ planned after it. He has also completed Jamf 100 and Jamf 200, which are training courses rather than certifications.$q$,
 '{"certifications","certs"}'),

-- ─── Outside work ────────────────────────────────────────────────────────────

($q$What does Manish do outside work?$q$,
 $q$Travel, photography, video production, and soccer. He also likes understanding how mechanical things work: he has worked on his own minibike and hopes to take on a small project car eventually, to learn how the systems fit together and rebuild parts himself.$q$,
 '{"hobbies","outside of work","interests"}'),

($q$Does Manish play sports?$q$,
 $q$Yes, soccer. He plays in a league in Long Beach.$q$,
 '{"soccer","football","sports"}'),

($q$Does Manish work on cars or machines?$q$,
 $q$He likes learning how mechanical systems fit together. He has worked on his own minibike, and hopes to take on a small project car so he can diagnose problems and rebuild parts himself.$q$,
 '{"cars","minibike","mechanical"}'),

-- ─── The subjective questions visitors actually asked ────────────────────────

($q$Is Manish good at his job?$q$,
 $q$That is not something I can answer honestly. I work from his resume, and a resume cannot tell you whether someone is good, only what they have done. His references and an interview will tell you what I cannot.$q$,
 '{"is he good","how good is he","is he any good"}'),

($q$What is Manish like to work with?$q$,
 $q$I do not know. I can tell you what he has built and what he is responsible for, but I have never been in a room with him. His contact form reaches an actual human who can arrange that.$q$,
 '{"what is he like","his nature","personality","is he nice"}'),

($q$Is Manish good at Python?$q$,
 $q$Python is his main language and he has used it for scrapers and data pipelines at Yali, cloud pipeline work on GCP and Azure, and a PyTorch CNN he built end to end. Whether that makes him good at it is a judgement I am not in a position to make.$q$,
 '{"good at python","python skills"}'),

($q$What are Manish''s weaknesses?$q$,
 $q$That is not on his resume, and I am not going to invent one. Worth asking him directly.$q$,
 '{"weakness","weaknesses"}');

-- Existing questions get the new answer; new ones get inserted. Nothing is removed.
update public.faq f
   set answer  = i.answer,
       aliases = case when i.aliases = '{}' then f.aliases else i.aliases end
  from faq_incoming i
 where f.question = i.question;

insert into public.faq (question, answer, aliases)
select i.question, i.answer, i.aliases
  from faq_incoming i
 where not exists (select 1 from public.faq f where f.question = i.question);

commit;

-- Check it worked:
--   select count(*) from public.faq;
--   select count(*) from public.faq
--    where answer ~* '4,?000-?5,?000|JAMF.?certif|99\.77|480,?000|roughly 30%';
