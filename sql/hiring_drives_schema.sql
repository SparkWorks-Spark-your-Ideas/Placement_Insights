-- =========================================================================
-- KITS PLACEMENT PLATFORM COMPREHENSIVE SEED MIGRATION
-- This script ensures all base tables are populated with Accenture data
-- so that foreign key constraints do not fail, and the app loads fully.
-- =========================================================================

-- 1. SEED COMPANIES PARENT TABLE WITH ACCENTURE (ID 1)
insert into public.companies (company_id, name)
select 1, 'Accenture'
where not exists (
  select 1 from public.companies where company_id = 1
);

-- 2. SEED COMPANY_JSON TABLE WITH ACCENTURE (ID 1)
insert into public.company_json (company_id, short_json, full_json)
select 
  1,
  '{
    "name": "Accenture plc",
    "short_name": "Accenture",
    "logo_url": "https://www.accenture.com/_acnmedia/Accenture/Dev/RedesigNAcc_Logo_Black.svg",
    "category": "Enterprise",
    "company_type": "Dream",
    "incorporation_year": 1989,
    "employee_size": "740,000 employees",
    "headquarters_address": "Dublin, Ireland",
    "operating_countries": "United States; United Kingdom; India; Germany; France; Japan; Australia; Canada; Brazil; Singapore",
    "office_locations": "New York, United States; London, United Kingdom; Bangalore, India; Paris, France; Tokyo, Japan; Toronto, Canada; Sydney, Australia; Frankfurt, Germany",
    "yoy_growth_rate": "3%",
    "website_url": "https://www.accenture.com"
  }'::jsonb,
  '{
    "name": "Accenture plc",
    "short_name": "Accenture",
    "category": "Enterprise",
    "incorporation_year": 1989,
    "nature_of_company": "Public",
    "overview_text": "Accenture is a global professional services company providing strategy, consulting, digital, technology, and operations services, serving large enterprises and governments across more than 120 countries.",
    "headquarters_address": "Dublin, Ireland",
    "operating_countries": "United States; United Kingdom; India; Germany; France; Japan; Australia; Canada; Brazil; Singapore",
    "office_count": "200+",
    "employee_size": "740,000 employees",
    "vision_statement": "To drive continuous innovation and help the world''s leading organizations build their digital core and achieve greater value.",
    "mission_statement": "Deliver on the promise of technology and human ingenuity to create value and shared success.",
    "core_values": "Client value creation; Integrity; Respect for individuals; Innovation; Stewardship; Best people",
    "website_url": "https://www.accenture.com",
    "linkedin_url": "https://www.linkedin.com/company/accenture",
    "tech_stack": "SAP; Salesforce; AWS; Microsoft Azure; ServiceNow; Kubernetes; Python",
    "annual_revenue": "$64.1B (FY2024)",
    "annual_profit": "$7.2B net income (FY2024)",
    "valuation": "$220B market capitalization",
    "remote_policy_details": "Hybrid, 60% flexible",
    "typical_hours": "Flexible",
    "burnout_risk": "Moderate",
    "work_culture_summary": "Collaborative; Performance-driven"
  }'::jsonb
where not exists (
  select 1 from public.company_json where company_id = 1
);


-- 2. SEED SKILL_SET_MASTER
insert into public.skill_set_master (skill_set_id, skill_set_name, short_name)
select * from (values
  (1, 'Data Structures & Algorithms', 'DSA'),
  (2, 'Object-Oriented Programming', 'OOP'),
  (3, 'SQL & Databases', 'SQL'),
  (4, 'Cloud Fundamentals (AWS/Azure)', 'Cloud'),
  (5, 'Operating Systems', 'OS'),
  (6, 'Computer Networks', 'CN'),
  (7, 'Aptitude & Logical Reasoning', 'Aptitude'),
  (8, 'Communication & Behavioral', 'HR'),
  (9, 'Web Development Basics', 'WebDev'),
  (10, 'System Design (Intro)', 'SysDesign'),
  (11, 'Git & Version Control', 'Git'),
  (12, 'Generative AI Basics', 'GenAI')
) as v(id, name, short)
where not exists (
  select 1 from public.skill_set_master where skill_set_id = v.id
);


-- 3. SEED PROFICIENCY_LEVELS
insert into public.proficiency_levels (proficiency_level_id, proficiency_name, proficiency_code)
select * from (values
  (1, 'Beginner', 'BEG'),
  (2, 'Intermediate', 'INT'),
  (3, 'Proficient', 'PRO'),
  (4, 'Advanced', 'ADV'),
  (5, 'Expert', 'EXP')
) as v(id, name, code)
where not exists (
  select 1 from public.proficiency_levels where proficiency_level_id = v.id
);


-- 4. SEED COMPANY_SKILL_LEVELS FOR ACCENTURE (ID 1)
insert into public.company_skill_levels (company_id, skill_set_id, required_level, required_proficiency_level_id)
select * from (values
  (1, 1, 8, 5), -- DSA
  (1, 2, 7, 4), -- OOP
  (1, 3, 7, 4), -- SQL
  (1, 4, 6, 3), -- Cloud
  (1, 5, 6, 3), -- OS
  (1, 6, 5, 3), -- CN
  (1, 7, 7, 4), -- Aptitude
  (1, 8, 7, 4), -- HR
  (1, 9, 5, 3), -- WebDev
  (1, 10, 4, 2), -- SysDesign
  (1, 11, 5, 3), -- Git
  (1, 12, 4, 2)  -- GenAI
) as v(cid, sid, req_lvl, req_prof_lvl)
where not exists (
  select 1 from public.company_skill_levels where company_id = v.cid and skill_set_id = v.sid
);


-- 5. SEED SKILL_SET_TOPICS
insert into public.skill_set_topics (skill_set_id, level_number, topics)
select * from (values
  -- DSA (ID 1)
  (1, 1, 'Arrays, strings, time/space complexity basics'),
  (1, 2, 'Linked lists, stacks, queues'),
  (1, 3, 'Hash maps and sets'),
  (1, 4, 'Recursion and backtracking fundamentals'),
  (1, 5, 'Trees and binary search trees'),
  (1, 6, 'Heaps and priority queues'),
  (1, 7, 'Graph traversal (BFS, DFS)'),
  (1, 8, 'Dynamic programming patterns'),
  (1, 9, 'Advanced graph algorithms (Dijkstra, Union-Find)'),
  (1, 10, 'Competitive problem solving and contest practice'),
  -- OOP (ID 2)
  (2, 1, 'Classes, objects, fields, methods'),
  (2, 2, 'Encapsulation and access modifiers'),
  (2, 3, 'Inheritance and method overriding'),
  (2, 4, 'Polymorphism and abstract classes'),
  (2, 5, 'Interfaces and contracts'),
  (2, 6, 'Composition vs inheritance'),
  (2, 7, 'SOLID principles overview'),
  (2, 8, 'Design patterns (Factory, Singleton, Observer)'),
  (2, 9, 'Dependency injection and inversion'),
  (2, 10, 'Domain-driven OOP modeling'),
  -- SQL (ID 3)
  (3, 1, 'Relational model and basic SELECT'),
  (3, 2, 'Filtering, sorting, aggregations'),
  (3, 3, 'Joins (INNER, LEFT, RIGHT, FULL)'),
  (3, 4, 'Subqueries and CTEs'),
  (3, 5, 'Indexes and query optimization basics'),
  (3, 6, 'Transactions and ACID properties'),
  (3, 7, 'Normalization (1NF–3NF)'),
  (3, 8, 'Window functions'),
  (3, 9, 'Stored procedures, triggers, views'),
  (3, 10, 'Database tuning and execution plans')
) as v(sid, lvl, tops)
where not exists (
  select 1 from public.skill_set_topics where skill_set_id = v.sid and level_number = v.lvl
);


-- =========================================================================
-- 6. CREATE HIRING_DRIVES TABLES
-- =========================================================================
create table if not exists public.hiring_drives (
  id uuid default gen_random_uuid() primary key,
  company_id integer references public.company_json(company_id) on delete cascade not null,
  title text not null,
  eligibility text,
  ctc text,
  deadline date not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on hiring_drives
alter table public.hiring_drives enable row level security;

-- Policies for hiring_drives
create policy "Drives are viewable by authenticated users"
  on public.hiring_drives for select
  to authenticated
  using (true);

create policy "Drives are manageable by admins and officers"
  on public.hiring_drives for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('officer', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('officer', 'admin')
    )
  );

-- 7. CREATE DRIVE_REGISTRATIONS TABLE
create table if not exists public.drive_registrations (
  id uuid default gen_random_uuid() primary key,
  drive_id uuid references public.hiring_drives(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (drive_id, student_id)
);

-- Enable RLS on drive_registrations
alter table public.drive_registrations enable row level security;

-- Policies for drive_registrations
create policy "Registrations are viewable by owners, officers, and admins"
  on public.drive_registrations for select
  to authenticated
  using (
    auth.uid() = student_id or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('officer', 'admin')
    )
  );

create policy "Users can register/unregister themselves"
  on public.drive_registrations for all
  to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- 8. SEED INITIAL DRIVES
insert into public.hiring_drives (company_id, title, eligibility, ctc, deadline, description)
select 1, 'Accenture Associate Software Engineer (ASE)', 'CGPA >= 6.5, No active backlogs, B.Tech/M.Tech', '4.5 LPA', current_date + interval '10 days', 'Accenture ASE role focuses on development, testing, and cloud infrastructure setup.'
where not exists (
  select 1 from public.hiring_drives where company_id = 1 and title = 'Accenture Associate Software Engineer (ASE)'
);

insert into public.hiring_drives (company_id, title, eligibility, ctc, deadline, description)
select 1, 'Accenture Advanced Associate Software Engineer (AASE)', 'CGPA >= 7.5, Strong coding fundamentals', '6.5 LPA', current_date + interval '14 days', 'AASE role focuses on advanced application architecture, AI implementations, and cloud engineering.'
where not exists (
  select 1 from public.hiring_drives where company_id = 1 and title = 'Accenture Advanced Associate Software Engineer (AASE)'
);
