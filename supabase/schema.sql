-- =========================================================
-- STRONG CARE: Schema + RLS
-- =========================================================

-- ตารางหลัก
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role text not null check (role in ('admin', 'therapist', 'patient')),
  phone text,
  email text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.therapists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  license_no text,
  specialty text,
  bio text,
  phone text,
  email text,
  status text default 'active' check (status in ('active', 'leave', 'suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  patient_code text unique not null,
  full_name text not null,
  age int,
  gender text,
  phone text,
  pin_hash text,
  chief_complaint text,
  medical_history text,
  treatment_outcome text,
  therapist_notes text,
  responsible_therapist_id uuid references public.profiles(id),
  started_at date default current_date,
  status text default 'active' check (status in ('active', 'suspended', 'discharged')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text,
  category text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  target_angle numeric,
  hold_seconds int default 20,
  reps int default 1,
  sets int default 1,
  target_joint text,
  instructions text,
  caution text,
  contraindication text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.treatment_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  therapist_id uuid references public.profiles(id),
  score numeric,
  avg_angle numeric,
  hold_completed_seconds numeric,
  accuracy_percent numeric,
  notes text,
  mode text default 'therapy' check (mode in ('therapy', 'minigame')),
  created_at timestamptz default now()
);

create table if not exists public.minigame_results (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  score int not null default 0,
  total_questions int not null default 10,
  correct_count int not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  action text not null,
  detail text,
  device_info text,
  ip_address text,
  created_at timestamptz default now()
);

create table if not exists public.banned_devices (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  reason text,
  banned_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.banned_ips (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  reason text,
  banned_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create index if not exists idx_patients_code on public.patients(patient_code);
create index if not exists idx_patients_therapist on public.patients(responsible_therapist_id);
create index if not exists idx_sessions_patient on public.treatment_sessions(patient_id);
create index if not exists idx_logs_created on public.activity_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_patients_updated on public.patients;
create trigger trg_patients_updated before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists trg_therapists_updated on public.therapists;
create trigger trg_therapists_updated before update on public.therapists
for each row execute function public.set_updated_at();

drop trigger if exists trg_exercises_updated on public.exercises;
create trigger trg_exercises_updated before update on public.exercises
for each row execute function public.set_updated_at();

-- helper: อ่าน role ของ user ปัจจุบัน
create or replace function public.current_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- เปิด RLS
alter table public.profiles enable row level security;
alter table public.therapists enable row level security;
alter table public.patients enable row level security;
alter table public.exercises enable row level security;
alter table public.treatment_sessions enable row level security;
alter table public.minigame_results enable row level security;
alter table public.activity_logs enable row level security;
alter table public.banned_devices enable row level security;
alter table public.banned_ips enable row level security;
alter table public.system_settings enable row level security;

-- profiles policies
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  public.current_role() = 'admin'
  or id = auth.uid()
  or public.current_role() = 'therapist'
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (
  public.current_role() = 'admin' or id = auth.uid()
);

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all using (
  public.current_role() = 'admin'
);

-- patients
drop policy if exists patients_admin_all on public.patients;
create policy patients_admin_all on public.patients for all using (
  public.current_role() = 'admin'
);

drop policy if exists patients_therapist_select on public.patients;
create policy patients_therapist_select on public.patients for select using (
  public.current_role() = 'therapist'
);

drop policy if exists patients_therapist_write on public.patients;
create policy patients_therapist_write on public.patients for all using (
  public.current_role() = 'therapist'
  and responsible_therapist_id = auth.uid()
);

drop policy if exists patients_self_select on public.patients;
create policy patients_self_select on public.patients for select using (
  profile_id = auth.uid()
);

-- therapists
drop policy if exists therapists_read on public.therapists;
create policy therapists_read on public.therapists for select using (
  public.current_role() in ('admin', 'therapist')
);

drop policy if exists therapists_admin on public.therapists;
create policy therapists_admin on public.therapists for all using (
  public.current_role() = 'admin'
);

drop policy if exists therapists_self_update on public.therapists;
create policy therapists_self_update on public.therapists for update using (
  profile_id = auth.uid()
);

-- exercises
drop policy if exists exercises_read on public.exercises;
create policy exercises_read on public.exercises for select using (true);

drop policy if exists exercises_staff_write on public.exercises;
create policy exercises_staff_write on public.exercises for all using (
  public.current_role() in ('admin', 'therapist')
);

-- treatment_sessions
drop policy if exists sessions_admin on public.treatment_sessions;
create policy sessions_admin on public.treatment_sessions for all using (
  public.current_role() = 'admin'
);

drop policy if exists sessions_therapist on public.treatment_sessions;
create policy sessions_therapist on public.treatment_sessions for all using (
  public.current_role() = 'therapist'
);

drop policy if exists sessions_patient_insert on public.treatment_sessions;
create policy sessions_patient_insert on public.treatment_sessions for insert with check (
  exists (
    select 1 from public.patients p
    where p.id = patient_id and p.profile_id = auth.uid()
  )
);

drop policy if exists sessions_patient_select on public.treatment_sessions;
create policy sessions_patient_select on public.treatment_sessions for select using (
  exists (
    select 1 from public.patients p
    where p.id = patient_id and p.profile_id = auth.uid()
  )
);

-- minigame
drop policy if exists minigame_admin on public.minigame_results;
create policy minigame_admin on public.minigame_results for all using (
  public.current_role() = 'admin'
);

drop policy if exists minigame_therapist on public.minigame_results;
create policy minigame_therapist on public.minigame_results for select using (
  public.current_role() = 'therapist'
);

drop policy if exists minigame_patient on public.minigame_results;
create policy minigame_patient on public.minigame_results for all using (
  exists (
    select 1 from public.patients p
    where p.id = patient_id and p.profile_id = auth.uid()
  )
);

-- activity logs / bans / settings = admin เป็นหลัก
drop policy if exists logs_admin on public.activity_logs;
create policy logs_admin on public.activity_logs for all using (
  public.current_role() = 'admin'
);

drop policy if exists logs_insert_auth on public.activity_logs;
create policy logs_insert_auth on public.activity_logs for insert with check (
  auth.uid() is not null
);

drop policy if exists banned_devices_admin on public.banned_devices;
create policy banned_devices_admin on public.banned_devices for all using (
  public.current_role() = 'admin'
);

drop policy if exists banned_ips_admin on public.banned_ips;
create policy banned_ips_admin on public.banned_ips for all using (
  public.current_role() = 'admin'
);

drop policy if exists settings_admin on public.system_settings;
create policy settings_admin on public.system_settings for all using (
  public.current_role() = 'admin'
);

drop policy if exists settings_read_staff on public.system_settings;
create policy settings_read_staff on public.system_settings for select using (
  public.current_role() in ('admin', 'therapist')
);
