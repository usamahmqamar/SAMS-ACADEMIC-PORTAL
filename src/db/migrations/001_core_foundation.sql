-- ==============================================================================
-- SAMS SCHOOL ERP — PHASE 1: CORE FOUNDATION SCHEMA MIGRATION
-- Migration Version: 001_core_foundation.sql
-- Target Database: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. GLOBAL TRIGGER FUNCTION FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. CORE ORGANIZATIONAL STRUCTURE
-- ==============================================================================

-- Table: branches
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code VARCHAR(30) NOT NULL UNIQUE,
    branch_name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: academic_sessions
CREATE TABLE IF NOT EXISTS public.academic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_name VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Upcoming', 'Active', 'Completed', 'Archived')),
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_session_dates CHECK (end_date >= start_date)
);

-- Table: terms
CREATE TABLE IF NOT EXISTS public.terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_name VARCHAR(50) NOT NULL,
    term_number SMALLINT NOT NULL CHECK (term_number BETWEEN 1 AND 4),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    resumption_date DATE,
    closing_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Active', 'Completed', 'Archived')),
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_term_number UNIQUE (session_id, term_number),
    CONSTRAINT chk_term_dates CHECK (end_date >= start_date)
);

-- Table: sections (Nursery, Primary, JSS, Islamia, etc.)
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    section_name VARCHAR(100) NOT NULL,
    section_code VARCHAR(30),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE RESTRICT,
    class_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(50),
    level VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 30 CHECK (capacity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_class_name UNIQUE (branch_id, class_name)
);

-- ==============================================================================
-- 4. FAMILY, GUARDIANS & STUDENTS
-- ==============================================================================

-- Table: family_accounts
CREATE TABLE IF NOT EXISTS public.family_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_code VARCHAR(50) NOT NULL UNIQUE,
    family_name VARCHAR(150) NOT NULL,
    primary_phone VARCHAR(50),
    primary_email VARCHAR(150),
    address TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: parents_guardians
CREATE TABLE IF NOT EXISTS public.parents_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL,
    title VARCHAR(20),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    alternative_phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    relationship VARCHAR(50),
    occupation VARCHAR(100),
    preferred_contact_method VARCHAR(30) DEFAULT 'Phone' CHECK (preferred_contact_method IN ('Phone', 'SMS', 'Email', 'WhatsApp')),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    admission_number VARCHAR(100) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female')),
    date_of_birth DATE,
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    profile_photo_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Graduated', 'Transferred', 'Withdrawn', 'Suspended', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: student_guardians (Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS public.student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES public.parents_guardians(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'Guardian',
    is_primary_contact BOOLEAN NOT NULL DEFAULT FALSE,
    is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
    can_pickup BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_guardian UNIQUE (student_id, guardian_id)
);

-- Table: student_enrollment_history
CREATE TABLE IF NOT EXISTS public.student_enrollment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID REFERENCES public.terms(id) ON DELETE RESTRICT,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Promoted', 'Repeated', 'Transferred', 'Graduated', 'Withdrawn', 'Inactive')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. HUMAN RESOURCES & EMPLOYEES
-- ==============================================================================

-- Table: employees
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female')),
    date_of_birth DATE,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    address TEXT,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    employment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    employment_status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (employment_status IN ('Active', 'On Leave', 'Suspended', 'Transferred', 'Resigned', 'Terminated', 'Inactive')),
    qualification VARCHAR(255),
    profile_photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: employee_branch_history (Transfers & Assignments)
CREATE TABLE IF NOT EXISTS public.employee_branch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    previous_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    new_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    authorized_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. ROLES, PERMISSIONS & USER ACCOUNTS
-- ==============================================================================

-- Table: roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module VARCHAR(50) NOT NULL,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    permission_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

-- Table: system_user_profiles (Link to Supabase Auth and Employee Profile)
CREATE TABLE IF NOT EXISTS public.system_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    primary_branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Deactivated')),
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: user_branch_access (Multi-branch authorization mapping)
CREATE TABLE IF NOT EXISTS public.user_branch_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL REFERENCES public.system_user_profiles(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_branch UNIQUE (user_profile_id, branch_id)
);

-- ==============================================================================
-- 7. AUDIT LOGGING FOUNDATION
-- ==============================================================================

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    user_email VARCHAR(150) NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    record_id VARCHAR(100),
    previous_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. INDEXES FOR PERFORMANCE & LOOKUPS
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_branches_code ON public.branches(branch_code);
CREATE INDEX IF NOT EXISTS idx_academic_sessions_current ON public.academic_sessions(is_current);
CREATE INDEX IF NOT EXISTS idx_terms_session ON public.terms(session_id);
CREATE INDEX IF NOT EXISTS idx_terms_current ON public.terms(is_current);
CREATE INDEX IF NOT EXISTS idx_sections_branch ON public.sections(branch_id);
CREATE INDEX IF NOT EXISTS idx_classes_branch ON public.classes(branch_id);
CREATE INDEX IF NOT EXISTS idx_classes_section ON public.classes(section_id);

CREATE INDEX IF NOT EXISTS idx_family_code ON public.family_accounts(family_code);
CREATE INDEX IF NOT EXISTS idx_parents_family ON public.parents_guardians(family_id);
CREATE INDEX IF NOT EXISTS idx_parents_phone ON public.parents_guardians(phone);

CREATE INDEX IF NOT EXISTS idx_students_admission_no ON public.students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_branch ON public.students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_family ON public.students(family_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);

CREATE INDEX IF NOT EXISTS idx_student_guardians_student ON public.student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian ON public.student_guardians(guardian_id);

CREATE INDEX IF NOT EXISTS idx_enrollment_student ON public.student_enrollment_history(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_branch ON public.student_enrollment_history(branch_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_session_term ON public.student_enrollment_history(session_id, term_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_class ON public.student_enrollment_history(class_id);

CREATE INDEX IF NOT EXISTS idx_employees_branch ON public.employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_emp_id ON public.employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_emp_branch_history_emp ON public.employee_branch_history(employee_id);

CREATE INDEX IF NOT EXISTS idx_system_user_email ON public.system_user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_system_user_auth ON public.system_user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_system_user_role ON public.system_user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_branch_profile ON public.user_branch_access(user_profile_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_branch ON public.audit_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action ON public.audit_logs(module, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 9. TRIGGERS FOR UPDATED_AT TIMESTAMP REFRESH
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_branches_updated_at') THEN
    CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_academic_sessions_updated_at') THEN
    CREATE TRIGGER trg_academic_sessions_updated_at BEFORE UPDATE ON public.academic_sessions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_terms_updated_at') THEN
    CREATE TRIGGER trg_terms_updated_at BEFORE UPDATE ON public.terms FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sections_updated_at') THEN
    CREATE TRIGGER trg_sections_updated_at BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_classes_updated_at') THEN
    CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_family_accounts_updated_at') THEN
    CREATE TRIGGER trg_family_accounts_updated_at BEFORE UPDATE ON public.family_accounts FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_parents_guardians_updated_at') THEN
    CREATE TRIGGER trg_parents_guardians_updated_at BEFORE UPDATE ON public.parents_guardians FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_students_updated_at') THEN
    CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_enrollment_updated_at') THEN
    CREATE TRIGGER trg_student_enrollment_updated_at BEFORE UPDATE ON public.student_enrollment_history FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_employees_updated_at') THEN
    CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_system_user_profiles_updated_at') THEN
    CREATE TRIGGER trg_system_user_profiles_updated_at BEFORE UPDATE ON public.system_user_profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES & ACCESS CONTROL
-- ==============================================================================

-- Enable RLS across all Phase 1 tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_branch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branch_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.system_user_profiles
    WHERE auth_user_id = auth.uid()
      AND (is_super_admin = TRUE OR email = 'usamah.m.qamar@gmail.com')
      AND status = 'Active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_branch_access(target_branch_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_super_admin() THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM public.system_user_profiles p
    JOIN public.user_branch_access uba ON uba.user_profile_id = p.id
    WHERE p.auth_user_id = auth.uid()
      AND p.status = 'Active'
      AND uba.branch_id = target_branch_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Table-specific granular policies
-- 1. Read-only global dictionary tables (authenticated staff)
CREATE POLICY "Allow authenticated read for academic sessions"
ON public.academic_sessions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read for terms"
ON public.terms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read for roles and permissions"
ON public.roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read for permissions catalog"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read for role permissions mapping"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

-- 2. Branch-scoped tables for authenticated users
CREATE POLICY "Branch-scoped read access for branches"
ON public.branches FOR SELECT
TO authenticated
USING (public.has_branch_access(id));

CREATE POLICY "Branch-scoped read access for sections"
ON public.sections FOR SELECT
TO authenticated
USING (branch_id IS NULL OR public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for classes"
ON public.classes FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for students"
ON public.students FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for enrollment history"
ON public.student_enrollment_history FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for employees"
ON public.employees FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

-- 3. Super Admin full management across all Phase 1 tables
CREATE POLICY "Super admin full access on branches" ON public.branches TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on academic_sessions" ON public.academic_sessions TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on terms" ON public.terms TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on sections" ON public.sections TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on classes" ON public.classes TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on family_accounts" ON public.family_accounts TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on parents_guardians" ON public.parents_guardians TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on students" ON public.students TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_guardians" ON public.student_guardians TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_enrollment_history" ON public.student_enrollment_history TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on employees" ON public.employees TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on employee_branch_history" ON public.employee_branch_history TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on roles" ON public.roles TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on permissions" ON public.permissions TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on role_permissions" ON public.role_permissions TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on system_user_profiles" ON public.system_user_profiles TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on user_branch_access" ON public.user_branch_access TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on audit_logs" ON public.audit_logs TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
