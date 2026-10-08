-- ============================================================================
-- STRONG CARE - Complete Supabase PostgreSQL Database Schema
-- AI-assisted Rehabilitation Monitoring Platform
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLES DEFINITION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 PROFILES (เชื่อมโยงกับ auth.users ของ Supabase)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'therapist', 'patient')),
    phone TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ----------------------------------------------------------------------------
-- 2.2 THERAPISTS (ข้อมูลวิชาชีพของนักกายภาพบำบัด)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.therapists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    code TEXT UNIQUE NOT NULL, -- e.g. T-003
    license_no TEXT NOT NULL,
    specialty TEXT NOT NULL,
    bio TEXT,
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapists_profile_id ON public.therapists(profile_id);

-- ----------------------------------------------------------------------------
-- 2.3 PATIENTS (ข้อมูลเวชระเบียนคนไข้)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL UNIQUE,
    patient_code TEXT UNIQUE NOT NULL, -- e.g. P-0012
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL DEFAULT 60,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    phone TEXT,
    chief_complaint TEXT,
    medical_history TEXT,
    treatment_outcome TEXT,
    therapist_notes TEXT,
    responsible_therapist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    started_at DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    pin_hash TEXT, -- SHA-256 Hash ของรหัส PIN 4 หลัก ป้องกัน Plain Text
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_code ON public.patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_therapist ON public.patients(responsible_therapist_id);

-- ----------------------------------------------------------------------------
-- 2.4 EXERCISES (คลังท่ากายภาพบำบัดชีวกลศาสตร์)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE,
    name_th TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    target_angle NUMERIC NOT NULL,
    hold_seconds NUMERIC NOT NULL DEFAULT 5,
    reps INTEGER NOT NULL DEFAULT 10,
    sets INTEGER NOT NULL DEFAULT 3,
    target_joint TEXT NOT NULL,
    instructions TEXT NOT NULL,
    caution TEXT NOT NULL,
    contraindication TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category);

-- ----------------------------------------------------------------------------
-- 2.5 TREATMENT_SESSIONS (ประวัติผลการฝึกท่ากายภาพบำบัด)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treatment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
    therapist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    score NUMERIC NOT NULL DEFAULT 0,
    avg_angle NUMERIC NOT NULL DEFAULT 0,
    hold_completed_seconds NUMERIC NOT NULL DEFAULT 0,
    accuracy_percent NUMERIC NOT NULL DEFAULT 0,
    total_reps INTEGER NOT NULL DEFAULT 0,
    correct_reps INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    mode TEXT NOT NULL DEFAULT 'therapy' CHECK (mode IN ('therapy', 'minigame')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON public.treatment_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON public.treatment_sessions(created_at DESC);

-- ----------------------------------------------------------------------------
-- 2.6 MINIGAME_RESULTS (ผลคะแนนมินิเกมตอบคำถาม ใช่/ไม่)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.minigame_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 10,
    correct_count INTEGER NOT NULL DEFAULT 0,
    stars INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_minigame_patient ON public.minigame_results(patient_id);

-- ----------------------------------------------------------------------------
-- 2.7 ACTIVITY_LOGS (บันทึก Audit Trail ความเคลื่อนไหวและความปลอดภัย)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    category TEXT NOT NULL DEFAULT 'SYSTEM',
    action TEXT NOT NULL,
    detail TEXT,
    device_info TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_created ON public.activity_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 2.8 BANNED_DEVICES & BANNED_IPS (ความปลอดภัยระดับอุปกรณ์และไอพี)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banned_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT UNIQUE NOT NULL,
    reason TEXT,
    banned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banned_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT UNIQUE NOT NULL,
    reason TEXT,
    banned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2.9 SYSTEM_SETTINGS (ค่าพารามิเตอร์ AI ชีวมิติและระบบส่วนกลาง)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2.10 FACE_EMBEDDINGS (เวกเตอร์ ResNet-34 128 มิติ สำหรับสแกนใบหน้า)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.face_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    embedding JSONB NOT NULL, -- Array 128 มิติ
    model_version TEXT NOT NULL DEFAULT 'face-resnet34-v2',
    quality_score NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_face_patient ON public.face_embeddings(patient_id);

-- ============================================================================
-- 3. TRIGGERS FOR AUTO UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_patients_updated_at ON public.patients;
CREATE TRIGGER set_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_therapists_updated_at ON public.therapists;
CREATE TRIGGER set_therapists_updated_at
BEFORE UPDATE ON public.therapists
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_exercises_updated_at ON public.exercises;
CREATE TRIGGER set_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minigame_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_embeddings ENABLE ROW LEVEL SECURITY;

-- Helper Functions ตรวจสอบบทบาทผู้ใช้
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT (public.current_user_role() = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_therapist()
RETURNS BOOLEAN AS $$
    SELECT (public.current_user_role() = 'therapist');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ----------------------------------------------------------------------------
-- RLS: PROFILES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_user_update_own" ON public.profiles;
CREATE POLICY "profiles_user_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS: THERAPISTS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "therapists_select_all" ON public.therapists;
CREATE POLICY "therapists_select_all" ON public.therapists
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "therapists_admin_manage" ON public.therapists;
CREATE POLICY "therapists_admin_manage" ON public.therapists
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "therapists_update_own" ON public.therapists;
CREATE POLICY "therapists_update_own" ON public.therapists
    FOR UPDATE TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS: PATIENTS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "patients_select_all_staff" ON public.patients;
CREATE POLICY "patients_select_all_staff" ON public.patients
    FOR SELECT TO authenticated
    USING (public.is_admin() OR public.is_therapist() OR profile_id = auth.uid());

DROP POLICY IF EXISTS "patients_admin_manage" ON public.patients;
CREATE POLICY "patients_admin_manage" ON public.patients
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "patients_therapist_insert" ON public.patients;
CREATE POLICY "patients_therapist_insert" ON public.patients
    FOR INSERT TO authenticated
    WITH CHECK (public.is_therapist());

DROP POLICY IF EXISTS "patients_therapist_update" ON public.patients;
CREATE POLICY "patients_therapist_update" ON public.patients
    FOR UPDATE TO authenticated
    USING (responsible_therapist_id = auth.uid() OR public.is_admin())
    WITH CHECK (responsible_therapist_id = auth.uid() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- RLS: EXERCISES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "exercises_select_all" ON public.exercises;
CREATE POLICY "exercises_select_all" ON public.exercises
    FOR SELECT TO authenticated, anon
    USING (is_active = true OR public.is_admin() OR public.is_therapist());

DROP POLICY IF EXISTS "exercises_staff_manage" ON public.exercises;
CREATE POLICY "exercises_staff_manage" ON public.exercises
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_therapist())
    WITH CHECK (public.is_admin() OR public.is_therapist());

-- ----------------------------------------------------------------------------
-- RLS: TREATMENT_SESSIONS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "sessions_select" ON public.treatment_sessions;
CREATE POLICY "sessions_select" ON public.treatment_sessions
    FOR SELECT TO authenticated
    USING (public.is_admin() OR public.is_therapist() OR patient_id IN (
        SELECT id FROM public.patients WHERE profile_id = auth.uid()
    ));

DROP POLICY IF EXISTS "sessions_insert" ON public.treatment_sessions;
CREATE POLICY "sessions_insert" ON public.treatment_sessions
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- RLS: MINIGAME_RESULTS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "minigame_select" ON public.minigame_results;
CREATE POLICY "minigame_select" ON public.minigame_results
    FOR SELECT TO authenticated
    USING (public.is_admin() OR public.is_therapist() OR patient_id IN (
        SELECT id FROM public.patients WHERE profile_id = auth.uid()
    ));

DROP POLICY IF EXISTS "minigame_insert" ON public.minigame_results;
CREATE POLICY "minigame_insert" ON public.minigame_results
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- RLS: ACTIVITY_LOGS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "logs_admin_select" ON public.activity_logs;
CREATE POLICY "logs_admin_select" ON public.activity_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "logs_insert" ON public.activity_logs;
CREATE POLICY "logs_insert" ON public.activity_logs
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- RLS: SYSTEM_SETTINGS & BANS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "settings_select" ON public.system_settings;
CREATE POLICY "settings_select" ON public.system_settings
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "settings_admin_update" ON public.system_settings;
CREATE POLICY "settings_admin_update" ON public.system_settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "banned_select" ON public.banned_devices;
CREATE POLICY "banned_select" ON public.banned_devices FOR SELECT USING (true);
DROP POLICY IF EXISTS "banned_ips_select" ON public.banned_ips;
CREATE POLICY "banned_ips_select" ON public.banned_ips FOR SELECT USING (true);

DROP POLICY IF EXISTS "banned_admin_manage" ON public.banned_devices;
CREATE POLICY "banned_admin_manage" ON public.banned_devices FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "banned_ips_admin_manage" ON public.banned_ips;
CREATE POLICY "banned_ips_admin_manage" ON public.banned_ips FOR ALL TO authenticated USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- RLS: FACE_EMBEDDINGS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "face_select" ON public.face_embeddings;
CREATE POLICY "face_select" ON public.face_embeddings FOR SELECT USING (true);

DROP POLICY IF EXISTS "face_manage" ON public.face_embeddings;
CREATE POLICY "face_manage" ON public.face_embeddings FOR ALL USING (true);
