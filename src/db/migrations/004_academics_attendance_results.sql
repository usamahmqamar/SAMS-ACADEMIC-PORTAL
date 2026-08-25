-- ==============================================================================
-- SAMS SCHOOL ERP — PHASE 4: ACADEMICS, ATTENDANCE & RESULTS SCHEMA
-- Migration Version: 004_academics_attendance_results.sql
-- Target Database: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. ACADEMIC STRUCTURE & ISLAMIA CLASSES
-- ==============================================================================

-- Table: islamia_classes (Separate independent Islamia class structure)
CREATE TABLE IF NOT EXISTS public.islamia_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    class_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(50),
    level_order INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 30 CHECK (capacity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_islamia_class UNIQUE (branch_id, class_name)
);

-- Table: subjects (Mainstream & Islamia subjects)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE RESTRICT,
    subject_name VARCHAR(150) NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    description TEXT,
    is_islamia_subject BOOLEAN NOT NULL DEFAULT FALSE,
    is_elective BOOLEAN NOT NULL DEFAULT FALSE,
    credit_units INTEGER NOT NULL DEFAULT 1 CHECK (credit_units > 0),
    display_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_subject_code UNIQUE (branch_id, subject_code, is_islamia_subject)
);

-- Table: class_subjects (Curriculum mapping: which subjects are taught in which class)
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    islamia_class_id UUID REFERENCES public.islamia_classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    is_compulsory BOOLEAN NOT NULL DEFAULT TRUE,
    periods_per_week INTEGER NOT NULL DEFAULT 3 CHECK (periods_per_week > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_class_or_islamia CHECK (
        (class_id IS NOT NULL AND islamia_class_id IS NULL) OR
        (class_id IS NULL AND islamia_class_id IS NOT NULL)
    ),
    CONSTRAINT uq_main_class_subject UNIQUE (branch_id, session_id, term_id, class_id, subject_id),
    CONSTRAINT uq_islamia_class_subject UNIQUE (branch_id, session_id, term_id, islamia_class_id, subject_id)
);

-- Table: teacher_subject_assignments (Assigning teachers to classes and subjects)
CREATE TABLE IF NOT EXISTS public.teacher_subject_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    islamia_class_id UUID REFERENCES public.islamia_classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    is_primary_teacher BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_teacher_target_class CHECK (
        (class_id IS NOT NULL AND islamia_class_id IS NULL) OR
        (class_id IS NULL AND islamia_class_id IS NOT NULL)
    )
);

-- Table: class_teacher_assignments (Form master / Class teacher assignment)
CREATE TABLE IF NOT EXISTS public.class_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    islamia_class_id UUID REFERENCES public.islamia_classes(id) ON DELETE CASCADE,
    teacher_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_class_teacher_scope CHECK (
        (class_id IS NOT NULL AND islamia_class_id IS NULL) OR
        (class_id IS NULL AND islamia_class_id IS NOT NULL)
    )
);

-- ==============================================================================
-- 2. STUDENT PROGRAMME PARTICIPATION (MAIN SCHOOL & ISLAMIA)
-- ==============================================================================

-- Table: student_islamia_enrollments (Explicit opt-in participation in Islamia)
CREATE TABLE IF NOT EXISTS public.student_islamia_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    islamia_class_id UUID NOT NULL REFERENCES public.islamia_classes(id) ON DELETE RESTRICT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exit_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Withdrawn', 'Completed')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_islamia_term UNIQUE (student_id, session_id, term_id)
);

-- ==============================================================================
-- 3. ASSESSMENT CONFIGURATION & GRADING SCALES
-- ==============================================================================

-- Table: assessment_schemes (Configurable assessment weights e.g. Test 1: 20%, Test 2: 20%, Exam: 60%)
CREATE TABLE IF NOT EXISTS public.assessment_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID REFERENCES public.terms(id) ON DELETE RESTRICT,
    scheme_name VARCHAR(150) NOT NULL DEFAULT 'Standard 20/20/60 Scheme',
    is_islamia_scheme BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: assessment_components (Sub-items: Test 1, Test 2, Exam, Project, Quiz)
CREATE TABLE IF NOT EXISTS public.assessment_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID NOT NULL REFERENCES public.assessment_schemes(id) ON DELETE CASCADE,
    component_name VARCHAR(100) NOT NULL, -- e.g. 'Test 1', 'Test 2', 'Exam'
    component_code VARCHAR(30) NOT NULL, -- e.g. 'TEST1', 'TEST2', 'EXAM'
    weight_percentage NUMERIC(5,2) NOT NULL CHECK (weight_percentage > 0 AND weight_percentage <= 100),
    max_score NUMERIC(6,2) NOT NULL DEFAULT 100.00 CHECK (max_score > 0),
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scheme_component_code UNIQUE (scheme_id, component_code)
);

-- Table: grading_scales (Configurable A, B, C, D, E, F boundaries and remarks)
CREATE TABLE IF NOT EXISTS public.grading_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE RESTRICT,
    scale_name VARCHAR(100) NOT NULL DEFAULT 'Standard WAEC/NECO Grade Scale',
    is_islamia_scale BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: grade_boundaries (Specific letter grade items)
CREATE TABLE IF NOT EXISTS public.grade_boundaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grading_scale_id UUID NOT NULL REFERENCES public.grading_scales(id) ON DELETE CASCADE,
    grade VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D', 'E', 'F'
    min_score NUMERIC(5,2) NOT NULL CHECK (min_score >= 0 AND min_score <= 100),
    max_score NUMERIC(5,2) NOT NULL CHECK (max_score >= 0 AND max_score <= 100),
    grade_point NUMERIC(4,2) DEFAULT 0.00,
    description VARCHAR(100) NOT NULL, -- 'Distinction', 'Excellent', 'Very Good', 'Good', 'Pass', 'Fail'
    remark VARCHAR(150) NOT NULL, -- 'Outstanding performance', 'Satisfactory', etc.
    display_order INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT chk_grade_range CHECK (max_score >= min_score),
    CONSTRAINT uq_scale_grade UNIQUE (grading_scale_id, grade)
);

-- ==============================================================================
-- 4. ASSESSMENT SCORES & RESULT BATCH WORKFLOWS
-- ==============================================================================

-- Table: result_batches (Approval workflow: Draft -> Submitted -> Reviewed -> Approved -> Published -> Locked)
CREATE TABLE IF NOT EXISTS public.result_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT,
    islamia_class_id UUID REFERENCES public.islamia_classes(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    batch_type VARCHAR(30) NOT NULL DEFAULT 'Mainstream' CHECK (batch_type IN ('Mainstream', 'Islamia')),
    status VARCHAR(30) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewed', 'Approved', 'Published', 'Locked')),
    submitted_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    reviewed_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_result_batch_scope CHECK (
        (class_id IS NOT NULL AND islamia_class_id IS NULL) OR
        (class_id IS NULL AND islamia_class_id IS NOT NULL)
    ),
    CONSTRAINT uq_main_result_batch UNIQUE (branch_id, session_id, term_id, class_id, subject_id),
    CONSTRAINT uq_islamia_result_batch UNIQUE (branch_id, session_id, term_id, islamia_class_id, subject_id)
);

-- Table: student_assessment_scores (Raw item scores: Test 1, Test 2, Exam, etc.)
CREATE TABLE IF NOT EXISTS public.student_assessment_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_batch_id UUID REFERENCES public.result_batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT,
    islamia_class_id UUID REFERENCES public.islamia_classes(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    component_id UUID NOT NULL REFERENCES public.assessment_components(id) ON DELETE RESTRICT,
    raw_score NUMERIC(6,2) NOT NULL DEFAULT 0.00 CHECK (raw_score >= 0),
    max_score NUMERIC(6,2) NOT NULL DEFAULT 100.00 CHECK (max_score > 0),
    weighted_score NUMERIC(6,2) NOT NULL DEFAULT 0.00 CHECK (weighted_score >= 0),
    recorded_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_score_validity CHECK (raw_score <= max_score),
    CONSTRAINT uq_student_subject_component UNIQUE (student_id, session_id, term_id, subject_id, component_id)
);

-- Table: academic_score_audit_logs (Immutable audit trail of any grade modifications)
CREATE TABLE IF NOT EXISTS public.academic_score_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    component_id UUID NOT NULL REFERENCES public.assessment_components(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    previous_score NUMERIC(6,2) NOT NULL,
    new_score NUMERIC(6,2) NOT NULL,
    reason TEXT NOT NULL,
    changed_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. CALCULATED SUBJECT RESULTS & RANKINGS
-- ==============================================================================

-- Table: student_subject_results (Computed Subject Total 100%, Grade, Position in Class, Remark)
CREATE TABLE IF NOT EXISTS public.student_subject_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT,
    islamia_class_id UUID REFERENCES public.islamia_classes(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    is_islamia BOOLEAN NOT NULL DEFAULT FALSE,
    test1_score NUMERIC(6,2) DEFAULT 0.00 CHECK (test1_score >= 0 AND test1_score <= 20),
    test2_score NUMERIC(6,2) DEFAULT 0.00 CHECK (test2_score >= 0 AND test2_score <= 20),
    exam_score NUMERIC(6,2) DEFAULT 0.00 CHECK (exam_score >= 0 AND exam_score <= 60),
    total_score NUMERIC(6,2) NOT NULL DEFAULT 0.00 CHECK (total_score >= 0 AND total_score <= 100),
    grade VARCHAR(10) NOT NULL,
    grade_point NUMERIC(4,2) DEFAULT 0.00,
    subject_position INTEGER, -- Subject ranking within class
    class_size INTEGER,
    highest_score_in_class NUMERIC(6,2),
    lowest_score_in_class NUMERIC(6,2),
    class_average_score NUMERIC(6,2),
    teacher_comment TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Calculated', 'Published', 'Locked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_subject_term UNIQUE (student_id, session_id, term_id, subject_id)
);

-- ==============================================================================
-- 6. MAINSTREAM & ISLAMIA TERMLY ACADEMIC SUMMARIES
-- ==============================================================================

-- Table: student_term_academic_summaries (Main school overall performance, ranking & remarks)
CREATE TABLE IF NOT EXISTS public.student_term_academic_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    total_subjects_taken INTEGER NOT NULL DEFAULT 0 CHECK (total_subjects_taken >= 0),
    total_score_obtained NUMERIC(8,2) NOT NULL DEFAULT 0.00 CHECK (total_score_obtained >= 0),
    cumulative_max_score NUMERIC(8,2) NOT NULL DEFAULT 0.00 CHECK (cumulative_max_score >= 0),
    average_percentage NUMERIC(6,2) NOT NULL DEFAULT 0.00 CHECK (average_percentage >= 0 AND average_percentage <= 100),
    overall_class_position INTEGER, -- 1st, 2nd, 3rd in class
    total_students_in_class INTEGER,
    class_highest_average NUMERIC(6,2),
    class_lowest_average NUMERIC(6,2),
    class_overall_average NUMERIC(6,2),
    -- Performance comparisons vs previous term
    previous_term_average NUMERIC(6,2),
    average_change NUMERIC(6,2), -- positive or negative
    previous_term_position INTEGER,
    position_change INTEGER,
    performance_trend VARCHAR(30) CHECK (performance_trend IN ('Improved', 'Declined', 'Maintained', 'New_Entry')),
    -- Attendance summary
    times_school_opened INTEGER DEFAULT 0,
    times_present INTEGER DEFAULT 0,
    times_absent INTEGER DEFAULT 0,
    times_late INTEGER DEFAULT 0,
    attendance_percentage NUMERIC(5,2),
    -- Remarks
    class_teacher_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    class_teacher_remark TEXT,
    principal_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    principal_remark TEXT,
    next_term_resumption_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Approved', 'Published', 'Locked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_main_term_summary UNIQUE (student_id, session_id, term_id)
);

-- Table: student_islamia_term_summaries (Completely separate Islamia overall performance & ranking)
CREATE TABLE IF NOT EXISTS public.student_islamia_term_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    islamia_class_id UUID NOT NULL REFERENCES public.islamia_classes(id) ON DELETE RESTRICT,
    total_islamia_subjects INTEGER NOT NULL DEFAULT 0 CHECK (total_islamia_subjects >= 0),
    total_islamia_score NUMERIC(8,2) NOT NULL DEFAULT 0.00 CHECK (total_islamia_score >= 0),
    cumulative_islamia_max NUMERIC(8,2) NOT NULL DEFAULT 0.00 CHECK (cumulative_islamia_max >= 0),
    islamia_average_percentage NUMERIC(6,2) NOT NULL DEFAULT 0.00 CHECK (islamia_average_percentage >= 0 AND islamia_average_percentage <= 100),
    islamia_class_position INTEGER, -- Separate ranking among Islamia participants
    total_islamia_students INTEGER,
    islamia_highest_average NUMERIC(6,2),
    islamia_lowest_average NUMERIC(6,2),
    -- Islamia Attendance & Remarks
    islamia_times_opened INTEGER DEFAULT 0,
    islamia_times_present INTEGER DEFAULT 0,
    islamia_times_absent INTEGER DEFAULT 0,
    islamia_teacher_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    islamia_teacher_remark TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Approved', 'Published', 'Locked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_islamia_term_summary UNIQUE (student_id, session_id, term_id)
);

-- Table: report_card_snapshots (Immutable JSON archive preserving published report card)
CREATE TABLE IF NOT EXISTS public.report_card_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    islamia_class_id UUID REFERENCES public.islamia_classes(id) ON DELETE SET NULL,
    has_islamia BOOLEAN NOT NULL DEFAULT FALSE,
    snapshot_data JSONB NOT NULL,
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    generated_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    qr_verification_code VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_term_report_snapshot UNIQUE (student_id, session_id, term_id)
);

-- ==============================================================================
-- 7. ATTENDANCE MANAGEMENT (STUDENTS & STAFF)
-- ==============================================================================

-- Table: student_daily_attendance (Granular daily attendance tracking)
CREATE TABLE IF NOT EXISTS public.student_daily_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT,
    islamia_class_id UUID REFERENCES public.islamia_classes(id) ON DELETE RESTRICT,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_islamia_session BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    arrival_time TIME,
    reason TEXT,
    recorded_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_daily_att UNIQUE (student_id, attendance_date, is_islamia_session)
);

-- Table: staff_attendance (Daily employee clock-in / attendance records)
CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Late', 'Excused', 'On_Leave')),
    time_in TIME,
    time_out TIME,
    work_duration_minutes INTEGER,
    remarks TEXT,
    recorded_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_staff_daily_att UNIQUE (employee_id, attendance_date)
);

-- ==============================================================================
-- 8. INDEXES FOR PERFORMANCE, RANKINGS & REPORTING
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_subjects_branch ON public.subjects(branch_id);
CREATE INDEX IF NOT EXISTS idx_subjects_section ON public.subjects(section_id);
CREATE INDEX IF NOT EXISTS idx_subjects_islamia ON public.subjects(is_islamia_subject);

CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON public.class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_islamia ON public.class_subjects(islamia_class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject ON public.class_subjects(subject_id);

CREATE INDEX IF NOT EXISTS idx_teacher_sub_teacher ON public.teacher_subject_assignments(teacher_employee_id);
CREATE INDEX IF NOT EXISTS idx_teacher_sub_class ON public.teacher_subject_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_sub_subject ON public.teacher_subject_assignments(subject_id);

CREATE INDEX IF NOT EXISTS idx_class_teacher_class ON public.class_teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_teacher_emp ON public.class_teacher_assignments(teacher_employee_id);

CREATE INDEX IF NOT EXISTS idx_islamia_enrollment_student ON public.student_islamia_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_islamia_enrollment_class ON public.student_islamia_enrollments(islamia_class_id);

CREATE INDEX IF NOT EXISTS idx_assessment_scores_student ON public.student_assessment_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_subject ON public.student_assessment_scores(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_batch ON public.student_assessment_scores(result_batch_id);

CREATE INDEX IF NOT EXISTS idx_subject_results_student ON public.student_subject_results(student_id);
CREATE INDEX IF NOT EXISTS idx_subject_results_class ON public.student_subject_results(class_id);
CREATE INDEX IF NOT EXISTS idx_subject_results_islamia_class ON public.student_subject_results(islamia_class_id);
CREATE INDEX IF NOT EXISTS idx_subject_results_subject ON public.student_subject_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_results_term ON public.student_subject_results(session_id, term_id);

CREATE INDEX IF NOT EXISTS idx_term_summary_student ON public.student_term_academic_summaries(student_id);
CREATE INDEX IF NOT EXISTS idx_term_summary_class ON public.student_term_academic_summaries(class_id);
CREATE INDEX IF NOT EXISTS idx_term_summary_pos ON public.student_term_academic_summaries(overall_class_position);

CREATE INDEX IF NOT EXISTS idx_islamia_summary_student ON public.student_islamia_term_summaries(student_id);
CREATE INDEX IF NOT EXISTS idx_islamia_summary_class ON public.student_islamia_term_summaries(islamia_class_id);
CREATE INDEX IF NOT EXISTS idx_islamia_summary_pos ON public.student_islamia_term_summaries(islamia_class_position);

CREATE INDEX IF NOT EXISTS idx_report_snapshots_student ON public.report_card_snapshots(student_id);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_qr ON public.report_card_snapshots(qr_verification_code);

CREATE INDEX IF NOT EXISTS idx_student_att_student ON public.student_daily_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_att_class ON public.student_daily_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_student_att_date ON public.student_daily_attendance(attendance_date DESC);

CREATE INDEX IF NOT EXISTS idx_staff_att_emp ON public.staff_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_att_date ON public.staff_attendance(attendance_date DESC);

CREATE INDEX IF NOT EXISTS idx_score_audit_student ON public.academic_score_audit_logs(student_id);

-- ==============================================================================
-- 9. TRIGGERS FOR UPDATED_AT TIMESTAMP REFRESH
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_islamia_classes_updated_at') THEN
    CREATE TRIGGER trg_islamia_classes_updated_at BEFORE UPDATE ON public.islamia_classes FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_subjects_updated_at') THEN
    CREATE TRIGGER trg_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_class_subjects_updated_at') THEN
    CREATE TRIGGER trg_class_subjects_updated_at BEFORE UPDATE ON public.class_subjects FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_teacher_sub_updated_at') THEN
    CREATE TRIGGER trg_teacher_sub_updated_at BEFORE UPDATE ON public.teacher_subject_assignments FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_class_teacher_updated_at') THEN
    CREATE TRIGGER trg_class_teacher_updated_at BEFORE UPDATE ON public.class_teacher_assignments FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_islamia_updated_at') THEN
    CREATE TRIGGER trg_student_islamia_updated_at BEFORE UPDATE ON public.student_islamia_enrollments FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assessment_schemes_updated_at') THEN
    CREATE TRIGGER trg_assessment_schemes_updated_at BEFORE UPDATE ON public.assessment_schemes FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assessment_components_updated_at') THEN
    CREATE TRIGGER trg_assessment_components_updated_at BEFORE UPDATE ON public.assessment_components FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_result_batches_updated_at') THEN
    CREATE TRIGGER trg_result_batches_updated_at BEFORE UPDATE ON public.result_batches FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_assessment_scores_updated_at') THEN
    CREATE TRIGGER trg_student_assessment_scores_updated_at BEFORE UPDATE ON public.student_assessment_scores FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_subject_results_updated_at') THEN
    CREATE TRIGGER trg_student_subject_results_updated_at BEFORE UPDATE ON public.student_subject_results FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_term_summaries_updated_at') THEN
    CREATE TRIGGER trg_student_term_summaries_updated_at BEFORE UPDATE ON public.student_term_academic_summaries FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_islamia_summaries_updated_at') THEN
    CREATE TRIGGER trg_islamia_summaries_updated_at BEFORE UPDATE ON public.student_islamia_term_summaries FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_daily_att_updated_at') THEN
    CREATE TRIGGER trg_student_daily_att_updated_at BEFORE UPDATE ON public.student_daily_attendance FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_staff_attendance_updated_at') THEN
    CREATE TRIGGER trg_staff_attendance_updated_at BEFORE UPDATE ON public.staff_attendance FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all Phase 4 academic tables
ALTER TABLE public.islamia_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_islamia_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_score_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_term_academic_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_islamia_term_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_card_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- 1. Read-only global dictionary tables (authenticated staff)
CREATE POLICY "Allow authenticated read for subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for assessment_schemes" ON public.assessment_schemes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for assessment_components" ON public.assessment_components FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for grading_scales" ON public.grading_scales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for grade_boundaries" ON public.grade_boundaries FOR SELECT TO authenticated USING (true);

-- 2. Branch-scoped read access for authenticated staff
CREATE POLICY "Branch-scoped read access for islamia_classes" ON public.islamia_classes FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for class_subjects" ON public.class_subjects FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for teacher_subject_assignments" ON public.teacher_subject_assignments FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for class_teacher_assignments" ON public.class_teacher_assignments FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for student_islamia_enrollments" ON public.student_islamia_enrollments FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for result_batches" ON public.result_batches FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for student_assessment_scores" ON public.student_assessment_scores FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for student_subject_results" ON public.student_subject_results FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for student_term_academic_summaries" ON public.student_term_academic_summaries FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for student_islamia_term_summaries" ON public.student_islamia_term_summaries FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for report_card_snapshots" ON public.report_card_snapshots FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for student_daily_attendance" ON public.student_daily_attendance FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for staff_attendance" ON public.staff_attendance FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));

-- 3. Super Admin full access on all Phase 4 academic tables
CREATE POLICY "Super admin full access on islamia_classes" ON public.islamia_classes TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on subjects" ON public.subjects TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on class_subjects" ON public.class_subjects TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on teacher_subject_assignments" ON public.teacher_subject_assignments TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on class_teacher_assignments" ON public.class_teacher_assignments TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_islamia_enrollments" ON public.student_islamia_enrollments TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on assessment_schemes" ON public.assessment_schemes TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on assessment_components" ON public.assessment_components TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on grading_scales" ON public.grading_scales TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on grade_boundaries" ON public.grade_boundaries TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on result_batches" ON public.result_batches TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_assessment_scores" ON public.student_assessment_scores TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on academic_score_audit_logs" ON public.academic_score_audit_logs TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_subject_results" ON public.student_subject_results TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_term_academic_summaries" ON public.student_term_academic_summaries TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_islamia_term_summaries" ON public.student_islamia_term_summaries TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on report_card_snapshots" ON public.report_card_snapshots TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_daily_attendance" ON public.student_daily_attendance TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on staff_attendance" ON public.staff_attendance TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
