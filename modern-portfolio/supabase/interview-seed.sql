-- Seed answers for Interview.exe
--
-- Every fact here is drawn from content already published on the site (the About
-- Me panel, the Experience entries, and the project list). Nothing is invented —
-- if a claim isn't on the site or the resume, it does not belong in this file.
--
-- Voice: dry and a little deadpan, but the facts are stated straight. The joke is
-- never at the expense of the answer, because the person reading it may be
-- deciding whether to interview you.
--
-- To edit: change the text and re-run this file (it upserts on question).
-- To add: copy a block. `aliases` are alternate phrasings that should hit the
-- same entry — the more natural phrasings you list, the fewer questions fall
-- through to the model.

insert into public.faq (question, aliases, answer) values

('What does Manish do?',
 array['who is manish', 'tell me about manish', 'what is his job', 'what does he do for work', 'introduce yourself', 'summary', 'background', 'current role'],
 'He is an IT Specialist at CSU Dominguez Hills, where he keeps infrastructure running for 4,000 to 5,000 managed devices. That covers provisioning, mobile device management, DNS, VPN, WiFi, and Google Workspace administration. Alongside that he builds the internal software that makes IT operations less painful. He also holds an M.S. in Computer Science.'),

('Does he know Python?',
 array['python experience', 'can he write python', 'does he use python', 'python skills', 'pytorch pandas pyspark'],
 'Yes. He uses Python for data pipeline work, including Apache Airflow, PySpark, and Pandas, and for machine learning in PyTorch. It is one of his primary languages rather than something he touched once.'),

('What programming languages does he know?',
 array['what languages', 'which languages does he use', 'tech stack', 'what technologies does he know', 'programming languages', 'what tools does he use', 'frameworks'],
 'Python, JavaScript, and SQL as the core three. On top of that: React, Node.js with Express, PostgreSQL, MongoDB, REST APIs, Git, and CI/CD. On the cloud and data side, AWS, Azure, GCP, Apache Airflow, PySpark, and BigQuery.'),

('What is his experience with system administration?',
 array['sysadmin experience', 'sysadmin work', 'system admin', 'infrastructure experience', 'does he do systems administration', 'IT operations experience', 'device management', 'jamf mdm', 'help desk'],
 'It is his day job. He manages end-to-end IT operations for 4,000 to 5,000 macOS devices with Windows support, covering provisioning, lifecycle management, onboarding and offboarding, DNS, VPN, WiFi, and Google Workspace administration. He is JAMF-certified and leads mobile device management deployment, policy enforcement, and security compliance.'),

('Does he have security experience?',
 array['security background', 'cybersecurity experience', 'infosec', 'is he a security engineer', 'security skills', 'certifications', 'comptia'],
 'More working understanding than deep specialization, and he would rather say that upfront than have it come up later. He has built the security pieces into his own applications, mostly side projects and internal tools: role-based access control, JWT authentication, audit logging. At work he handles policy enforcement and compliance across the device fleet. He is currently working through CompTIA Linux+, with AutoOps+ and Security+ planned after it. So: solid grounding and certifications in progress, not years as a dedicated security engineer.'),

('What has he built?',
 array['what projects has he worked on', 'show me his projects', 'what has he shipped', 'portfolio projects', 'what has he built', 'notable work', 'best project'],
 'The one he points at first is a full-stack IT ticketing and asset management system, built with React, Node.js, and PostgreSQL, with secure REST APIs, JWT authentication, role-based access control, and audit logs. It replaced manual spreadsheets with real audit trails. Beyond that: cloud data pipelines on Azure and GCP, a CNN in PyTorch that reached 99.77 percent validation accuracy on 3D shape classification, and a handful of full-stack applications. This site is on the list too, which is either charming or circular depending on your mood.'),

('Does he have cloud experience?',
 array['aws experience', 'azure experience', 'gcp experience', 'cloud engineering', 'cloud platforms', 'cloud providers', 'which cloud', 'data pipelines'],
 'Yes, across all three major providers. He has built data pipelines on Azure using Data Factory, Databricks, and Synapse Analytics, and on Google Cloud using Mage and BigQuery. AWS is in his working toolkit as well.'),

('What is his education?',
 array['degree', 'his degree', 'where did he study', 'did he go to college', 'qualifications', 'masters', 'university', 'school', 'education background'],
 'An M.S. in Computer Science from California State University, Dominguez Hills.'),

('What kind of role is he looking for?',
 array['what job does he want', 'is he looking for work', 'is he looking for a job', 'what roles is he open to', 'is he available', 'hiring', 'open to work', 'career goals'],
 'Systems administration and security-focused roles. His words are that he wants the kind of work where you own the boxes, the network, and the risk, rather than just the ticket queue. Software and data work stack on top of that rather than being replaced by it.'),

('How do I contact him?',
 array['contact', 'email address', 'how to reach him', 'get in touch', 'hire him', 'reach out', 'phone', 'linkedin'],
 'Email is manishcpatil9@gmail.com, and there is a contact form further down the page. He is based in Long Beach, California. Reaching him directly will be faster and considerably more informative than reaching me.'),

('Are you actually Manish?',
 array['are you a bot', 'is this a real person', 'are you human', 'who am i talking to', 'is this AI', 'are you chatgpt', 'are you claude'],
 'No. I am an automated assistant that answers from his resume, and I am fairly upfront about that. I can tell you what is documented. I cannot tell you what he is like in a meeting, whether he would enjoy your team, or what he thinks about your architecture. For those, use the contact form.')

on conflict do nothing;
