-- ==============================================================================
-- SAMS SCHOOL ERP — PHASE 7: ADMISSIONS, PROFILES, ID CARDS & DATA IMPORTS
-- Migration Version: 007_admissions_profiles_imports.sql
-- Target Database: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENDED PROFILES (STUDENTS, PARENTS & SYSTEM DOCUMENTS)
-- ==============================================================================

-- Table: student_extended_profiles (Additional medical, photo & previous school details)
CREATE TABLE IF NOT EXISTS public.student_extended_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
    photo_storage_path TEXT,
    photo_uploaded_at TIMESTAMPTZ,
    blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown')),
    genotype VARCHAR(10) CHECK (genotype IN ('AA', 'AS', 'SS', 'AC', 'SC', 'Unknown')),
    medical_allergies TEXT,
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(50),
    nationality VARCHAR(100) DEFAULT 'Nigerian',
    state_of_origin VARCHAR(100),
    lga_of_origin VARCHAR(100),
    previous_school_name VARCHAR(200),
    previous_school_last_class VARCHAR(100),
    admission_source VARCHAR(100), -- e.g. "Referral", "Website", "Walk-in", "Social Media"
    special_educational_needs TEXT,
    profile_completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 60.00 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: parent_profile_extensions (Extended communication channels & portal status)
CREATE TABLE IF NOT EXISTS public.parent_profile_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardian_id UUID NOT NULL UNIQUE REFERENCES public.parents_guardians(id) ON DELETE CASCADE,
    secondary_phone VARCHAR(50),
    whatsapp_phone VARCHAR(50),
    preferred_communication VARCHAR(30) NOT NULL DEFAULT 'WhatsApp' CHECK (preferred_communication IN ('WhatsApp', 'SMS', 'Email', 'Phone_Call')),
    portal_access_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    portal_last_login TIMESTAMPTZ,
    relationship_to_family VARCHAR(50) DEFAULT 'Parent', -- 'Father', 'Mother', 'Guardian', 'Sponsor'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: system_document_records (Generic secure metadata repository for all entity documents)
CREATE TABLE IF NOT EXISTS public.system_document_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    owner_type VARCHAR(50) NOT NULL CHECK (owner_type IN ('Student', 'Parent', 'Employee', 'Applicant', 'Branch', 'School')),
    owner_id UUID NOT NULL,
    document_category VARCHAR(100) NOT NULL, -- e.g. "Birth_Certificate", "Passport_Photo", "Medical_Report", "Contract"
    storage_file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    uploaded_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected')),
    verified_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. STUDENT & EMPLOYEE ID CARDS & VERIFICATION CODES
-- ==============================================================================

-- Table: student_id_cards (Physical/Digital ID card records with verification codes)
CREATE TABLE IF NOT EXISTS public.student_id_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    card_number VARCHAR(100) NOT NULL UNIQUE,
    template_code VARCHAR(50) NOT NULL DEFAULT 'STD_CARD_V1',
    qr_verification_code VARCHAR(150) NOT NULL UNIQUE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Lost', 'Replaced', 'Cancelled')),
    replacement_reason TEXT,
    issued_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_student_card_expiry CHECK (expiry_date >= issue_date)
);

-- Table: employee_id_cards (Staff ID cards with verification codes)
CREATE TABLE IF NOT EXISTS public.employee_id_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    card_number VARCHAR(100) NOT NULL UNIQUE,
    template_code VARCHAR(50) NOT NULL DEFAULT 'STAFF_CARD_V1',
    qr_verification_code VARCHAR(150) NOT NULL UNIQUE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Lost', 'Replaced', 'Cancelled')),
    replacement_reason TEXT,
    issued_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_staff_card_expiry CHECK (expiry_date >= issue_date)
);

-- ==============================================================================
-- 3. ADMISSIONS & APPLICATION WORKFLOW
-- ==============================================================================

-- Table: admission_applications (Prospective student application records)
CREATE TABLE IF NOT EXISTS public.admission_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number VARCHAR(100) NOT NULL UNIQUE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    target_section_id UUID REFERENCES public.sections(id) ON DELETE RESTRICT,
    target_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
    date_of_birth DATE NOT NULL,
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    guardian_first_name VARCHAR(100) NOT NULL,
    guardian_last_name VARCHAR(100) NOT NULL,
    guardian_relationship VARCHAR(50) NOT NULL DEFAULT 'Parent',
    guardian_phone VARCHAR(50) NOT NULL,
    guardian_email VARCHAR(150),
    guardian_address TEXT NOT NULL,
    previous_school VARCHAR(200),
    previous_class VARCHAR(100),
    application_fee_amount NUMERIC(14,2) DEFAULT 0.00 CHECK (application_fee_amount >= 0),
    fee_charge_id UUID REFERENCES public.student_fee_charges(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Draft', 'Submitted', 'Under_Review', 'Accepted', 'Rejected', 'Waitlisted', 'Enrolled', 'Withdrawn')),
    decision_date DATE,
    decision_notes TEXT,
    reviewed_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    -- Converted student reference
    converted_to_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    enrolled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: admission_checklist_templates (Configurable checklist requirements per branch/class)
CREATE TABLE IF NOT EXISTS public.admission_checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    requirement_name VARCHAR(150) NOT NULL,
    requirement_code VARCHAR(50) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_admission_req UNIQUE (branch_id, requirement_code)
);

-- Table: admission_checklist_items (Tracking completion of checklist requirements per applicant)
CREATE TABLE IF NOT EXISTS public.admission_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
    checklist_template_id UUID NOT NULL REFERENCES public.admission_checklist_templates(id) ON DELETE RESTRICT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    verified_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_app_checklist_item UNIQUE (application_id, checklist_template_id)
);

-- Table: admission_documents (Applicant uploaded files & references)
CREATE TABLE IF NOT EXISTS public.admission_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('Birth_Certificate', 'Previous_Result', 'Passport_Photo', 'Transfer_Certificate', 'Medical_Report', 'Other')),
    storage_file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    verification_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected')),
    verified_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. CSV BULK DATA IMPORT FRAMEWORK & ERROR TRACKING
-- ==============================================================================

-- Table: csv_import_jobs (Master import batch registry with audit metrics)
CREATE TABLE IF NOT EXISTS public.csv_import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    target_module VARCHAR(50) NOT NULL CHECK (target_module IN ('Students', 'Parents', 'Employees', 'Classes', 'Subjects', 'Fee_Structures', 'Fee_Charges', 'Payments', 'Inventory_Items', 'Books', 'Suppliers', 'Attendance', 'Results', 'Curriculum')),
    file_name VARCHAR(255) NOT NULL,
    storage_file_path TEXT,
    file_size_bytes BIGINT,
    stage VARCHAR(30) NOT NULL DEFAULT 'Upload' CHECK (stage IN ('Upload', 'Validation', 'Preview', 'Commit', 'Done', 'Failed')),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Validating', 'Validated', 'Processing', 'Completed', 'Failed', 'Cancelled')),
    total_rows INTEGER NOT NULL DEFAULT 0,
    successful_rows INTEGER NOT NULL DEFAULT 0,
    failed_rows INTEGER NOT NULL DEFAULT 0,
    duplicate_rows INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    uploaded_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,
    committed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    audit_meta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: csv_import_row_errors (Detailed granular row & column level validation error logs)
CREATE TABLE IF NOT EXISTS public.csv_import_row_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_job_id UUID NOT NULL REFERENCES public.csv_import_jobs(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    field_name VARCHAR(100),
    error_type VARCHAR(50) NOT NULL CHECK (error_type IN ('Missing_Required_Field', 'Invalid_Format', 'Foreign_Key_Not_Found', 'Duplicate_Key', 'Validation_Failed', 'Other')),
    error_message TEXT NOT NULL,
    raw_row_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. INDEXES FOR HIGH-SPEED LOOKUPS & IMPORT AUDITING
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_student_ext_student ON public.student_extended_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_ext_guardian ON public.parent_profile_extensions(guardian_id);

CREATE INDEX IF NOT EXISTS idx_system_docs_owner ON public.system_document_records(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_system_docs_branch ON public.system_document_records(branch_id);

CREATE INDEX IF NOT EXISTS idx_student_id_cards_student ON public.student_id_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_student_id_cards_qr ON public.student_id_cards(qr_verification_code);
CREATE INDEX IF NOT EXISTS idx_student_id_cards_card_no ON public.student_id_cards(card_number);

CREATE INDEX IF NOT EXISTS idx_employee_id_cards_emp ON public.employee_id_cards(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_id_cards_qr ON public.employee_id_cards(qr_verification_code);
CREATE INDEX IF NOT EXISTS idx_employee_id_cards_card_no ON public.employee_id_cards(card_number);

CREATE INDEX IF NOT EXISTS idx_admissions_branch ON public.admission_applications(branch_id);
CREATE INDEX IF NOT EXISTS idx_admissions_session ON public.admission_applications(session_id);
CREATE INDEX IF NOT EXISTS idx_admissions_class ON public.admission_applications(target_class_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admission_applications(status);
CREATE INDEX IF NOT EXISTS idx_admissions_converted ON public.admission_applications(converted_to_student_id);

CREATE INDEX IF NOT EXISTS idx_admission_docs_app ON public.admission_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_admission_items_app ON public.admission_checklist_items(application_id);

CREATE INDEX IF NOT EXISTS idx_import_jobs_branch ON public.csv_import_jobs(branch_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_module ON public.csv_import_jobs(target_module);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.csv_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_errors_job ON public.csv_import_row_errors(import_job_id);

-- ==============================================================================
-- 6. TRIGGERS FOR UPDATED_AT TIMESTAMP REFRESH
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_ext_profiles_updated_at') THEN
    CREATE TRIGGER trg_student_ext_profiles_updated_at BEFORE UPDATE ON public.student_extended_profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_parent_ext_profiles_updated_at') THEN
    CREATE TRIGGER trg_parent_ext_profiles_updated_at BEFORE UPDATE ON public.parent_profile_extensions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_system_docs_updated_at') THEN
    CREATE TRIGGER trg_system_docs_updated_at BEFORE UPDATE ON public.system_document_records FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_id_cards_updated_at') THEN
    CREATE TRIGGER trg_student_id_cards_updated_at BEFORE UPDATE ON public.student_id_cards FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_employee_id_cards_updated_at') THEN
    CREATE TRIGGER trg_employee_id_cards_updated_at BEFORE UPDATE ON public.employee_id_cards FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admission_apps_updated_at') THEN
    CREATE TRIGGER trg_admission_apps_updated_at BEFORE UPDATE ON public.admission_applications FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admission_checklists_updated_at') THEN
    CREATE TRIGGER trg_admission_checklists_updated_at BEFORE UPDATE ON public.admission_checklist_templates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admission_docs_updated_at') THEN
    CREATE TRIGGER trg_admission_docs_updated_at BEFORE UPDATE ON public.admission_documents FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_csv_import_jobs_updated_at') THEN
    CREATE TRIGGER trg_csv_import_jobs_updated_at BEFORE UPDATE ON public.csv_import_jobs FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all Phase 7 tables
ALTER TABLE public.student_extended_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profile_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_document_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_id_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_id_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_import_row_errors ENABLE ROW LEVEL SECURITY;

-- 1. Read-only global dictionary tables (authenticated staff)
CREATE POLICY "Allow authenticated read for admission_checklist_templates" ON public.admission_checklist_templates FOR SELECT TO authenticated USING (true);

-- 2. Branch-scoped read access for authenticated staff
CREATE POLICY "Branch-scoped read access for student_extended_profiles" ON public.student_extended_profiles FOR SELECT TO authenticated USING (
    student_id IN (SELECT s.id FROM public.students s WHERE public.has_branch_access(s.branch_id))
);

CREATE POLICY "Branch-scoped read access for parent_profile_extensions" ON public.parent_profile_extensions FOR SELECT TO authenticated USING (
    guardian_id IN (
        SELECT g.id FROM public.parents_guardians g
        JOIN public.students s ON s.family_id = g.family_id
        WHERE public.has_branch_access(s.branch_id)
    ) OR public.is_super_admin()
);

CREATE POLICY "Branch-scoped read access for system_document_records" ON public.system_document_records FOR SELECT TO authenticated USING (
    branch_id IS NULL OR public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for student_id_cards" ON public.student_id_cards FOR SELECT TO authenticated USING (
    public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for employee_id_cards" ON public.employee_id_cards FOR SELECT TO authenticated USING (
    public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for admission_applications" ON public.admission_applications FOR SELECT TO authenticated USING (
    public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for admission_checklist_items" ON public.admission_checklist_items FOR SELECT TO authenticated USING (
    application_id IN (SELECT a.id FROM public.admission_applications a WHERE public.has_branch_access(a.branch_id))
);

CREATE POLICY "Branch-scoped read access for admission_documents" ON public.admission_documents FOR SELECT TO authenticated USING (
    application_id IN (SELECT a.id FROM public.admission_applications a WHERE public.has_branch_access(a.branch_id))
);

CREATE POLICY "Branch-scoped read access for csv_import_jobs" ON public.csv_import_jobs FOR SELECT TO authenticated USING (
    branch_id IS NULL OR public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for csv_import_row_errors" ON public.csv_import_row_errors FOR SELECT TO authenticated USING (
    import_job_id IN (SELECT j.id FROM public.csv_import_jobs j WHERE j.branch_id IS NULL OR public.has_branch_access(j.branch_id))
);

-- 3. Super Admin full management across all Phase 7 tables
CREATE POLICY "Super admin full access on student_extended_profiles" ON public.student_extended_profiles TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on parent_profile_extensions" ON public.parent_profile_extensions TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on system_document_records" ON public.system_document_records TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_id_cards" ON public.student_id_cards TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on employee_id_cards" ON public.employee_id_cards TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on admission_applications" ON public.admission_applications TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on admission_checklist_templates" ON public.admission_checklist_templates TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on admission_checklist_items" ON public.admission_checklist_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on admission_documents" ON public.admission_documents TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on csv_import_jobs" ON public.csv_import_jobs TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on csv_import_row_errors" ON public.csv_import_row_errors TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
