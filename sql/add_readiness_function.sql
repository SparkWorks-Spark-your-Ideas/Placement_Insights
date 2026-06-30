-- Extend public.profiles with target_role column
alter table public.profiles add column if not exists target_role text;

-- Create database function to calculate company readiness metrics for a given student
create or replace function public.calculate_company_readiness(
  target_company_id integer,
  target_student_id uuid
)
returns table (
  readiness_percentage numeric,
  total_required_level bigint,
  student_earned_level bigint,
  mastered_skills text[],
  needs_attention_skills text[]
) as $$
declare
  total_req bigint := 0;
  total_earned bigint := 0;
  readiness numeric := 0;
  mastered text[] := array[]::text[];
  needs_attn text[] := array[]::text[];
  r record;
begin
  -- Loop through all skill requirements for this company
  for r in (
    select 
      ssm.skill_set_name,
      csl.required_level,
      coalesce(ss.current_level, 0) as student_level
    from public.company_skill_levels csl
    join public.skill_set_master ssm on csl.skill_set_id = ssm.skill_set_id
    left join public.student_skills ss on (
      ssm.skill_set_name = ss.skill_set_name 
      and ss.student_id = target_student_id
    )
    where csl.company_id = target_company_id
  ) loop
    -- Sum the required levels
    total_req := total_req + r.required_level;
    
    -- Sum the student earned level, capped at the required level
    total_earned := total_earned + least(r.student_level, r.required_level);
    
    -- Categorize skill
    if r.student_level >= r.required_level then
      mastered := array_append(mastered, r.skill_set_name);
    else
      needs_attn := array_append(needs_attn, r.skill_set_name);
    end if;
  end loop;

  -- Calculate the percentage
  if total_req > 0 then
    readiness := round((total_earned::numeric / total_req::numeric) * 100, 2);
  else
    readiness := 0.00;
  end if;

  return query select 
    readiness, 
    total_req, 
    total_earned, 
    mastered, 
    needs_attn;
end;
$$ language plpgsql security definer;

-- Create database function to retrieve global placement statistics, bypassing RLS
create or replace function public.get_placement_stats()
returns table (
  total_students bigint,
  placed_count bigint,
  average_lpa numeric
) as $$
begin
  return query
  select 
    count(*)::bigint,
    count(*) filter (where placement_status = 'placed')::bigint,
    coalesce(avg(package_lpa) filter (where placement_status = 'placed' and package_lpa > 0), 0.00)::numeric
  from public.profiles;
end;
$$ language plpgsql security definer;
