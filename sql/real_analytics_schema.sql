-- 1. Extend public.profiles with placement columns
alter table public.profiles 
  add column if not exists placement_status text default 'pending' check (placement_status in ('placed', 'pending')),
  add column if not exists package_lpa numeric(5,2) default 0.00,
  add column if not exists batch_year integer default 2026;

-- 2. Create student_skills table to track roadmaps
create table if not exists public.student_skills (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  skill_set_name text not null,
  current_level integer default 1 check (current_level >= 1 and current_level <= 10),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, skill_set_name)
);

-- Enable RLS on student_skills
alter table public.student_skills enable row level security;

-- Create RLS Policies for student_skills
create policy "Student skills are viewable by authenticated users"
  on public.student_skills for select
  to authenticated
  using (true);

create policy "Users can update their own skills"
  on public.student_skills for all
  to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- 3. SEED DATA GENERATOR
-- We will create 20 fake students in auth.users, which automatically triggers profile creation.
-- Then we update their placement status and populate their skill levels in student_skills.

-- First, enable pgcrypto if not already enabled (for password hashing)
create extension if not exists pgcrypto;

do $$
declare
  fake_uid uuid;
  student_name text;
  student_email text;
  placed_status text;
  pkg numeric(5,2);
  i integer;
  names text[] := array[
    'Aarav Sharma', 'Aditya Verma', 'Ananya Iyer', 'Arjun Mehta', 'Dev Patel',
    'Ishaan Gupta', 'Kabir Reddy', 'Mira Nair', 'Neha Sen', 'Rahul Krishnan',
    'Rohan Joshi', 'Siddharth Rao', 'Tanvi Bhat', 'Vikram Kumar', 'Pooja Hegde',
    'Riya Kapoor', 'Sanjay Dutt', 'Kunal Nayyar', 'Deepika Padukone', 'Amitabh Bachchan'
  ];
  skills text[] := array['DSA', 'OOP', 'SQL', 'Cloud', 'OS/Networks', 'Communication', 'Generative AI'];
  s_level integer;
begin
  for i in 1..20 loop
    fake_uid := gen_random_uuid();
    student_name := names[i];
    student_email := lower(replace(student_name, ' ', '.')) || '@karunya.edu.in';
    
    -- Randomize placement: 70% placed, 30% pending
    if random() > 0.3 then
      placed_status := 'placed';
      -- Package between 4.5 LPA and 32 LPA
      pkg := round((4.5 + random() * (32.0 - 4.5))::numeric, 2);
    else
      placed_status := 'pending';
      pkg := 0.00;
    end if;

    -- Insert into auth.users (triggers profile creation via on_auth_user_created)
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
    values (
      fake_uid,
      student_email,
      crypt('student123', gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', student_name),
      now(),
      now(),
      'authenticated',
      'authenticated'
    ) on conflict do nothing;

    -- Update the created profile with placement info
    update public.profiles
    set 
      placement_status = placed_status,
      package_lpa = pkg,
      batch_year = 2026
    where id = fake_uid;

    -- Populate skills for this student
    for s_level in 1..array_length(skills, 1) loop
      insert into public.student_skills (student_id, skill_set_name, current_level)
      values (fake_uid, skills[s_level], floor(1 + random() * 10)::integer)
      on conflict (student_id, skill_set_name) do update 
      set current_level = excluded.current_level;
    end loop;

  end loop;
end $$;
