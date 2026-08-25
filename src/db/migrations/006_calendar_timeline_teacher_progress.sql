-- ==============================================================================
-- SAMS SCHOOL ERP — PHASE 6: ACADEMIC CALENDAR, TIMELINE & TEACHER PROGRESS
-- Migration Version: 006_calendar_timeline_teacher_progress.sql
-- Target Database: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. CALENDAR EVENT CATEGORIES & MINISTRY CALENDAR
-- ==============================================================================

-- Table: calendar_event_categories (Configurable event types)
CREATE TABLE IF NOT EXISTS public.calendar_event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_code VARCHAR(50) NOT NULL UNIQUE,
    color_hex VARCHAR(20) NOT NULL DEFAULT '#2563eb',
    icon_name VARCHAR(50) DEFAULT 'Calendar',
    affects_attendance BOOLEAN NOT NULL DEFAULT FALSE,
    affects_teaching_days BOOLEAN NOT NULL DEFAULT FALSE,
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: public_holidays (Independently tracked official and regional holidays)
CREATE TABLE IF NOT EXISTS public.public_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE, -- NULL means national / all branches
    holiday_name VARCHAR(150) NOT NULL,
    holiday_type VARCHAR(50) NOT NULL DEFAULT 'National' CHECK (holiday_type IN ('National', 'State', 'Religious', 'School_Specific', 'Other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 1 CHECK (total_days > 0),
    is_recurring_yearly BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_holiday_dates CHECK (end_date >= start_date)
);

-- Table: ministry_academic_calendars (Official state/federal ministry schedules)
CREATE TABLE IF NOT EXISTS public.ministry_academic_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    ministry_name VARCHAR(150) NOT NULL DEFAULT 'State Ministry of Education',
    reference_number VARCHAR(100),
    approved_date DATE,
    term1_resumption_date DATE,
    term1_vacation_date DATE,
    term1_teaching_weeks INTEGER DEFAULT 13,
    term2_resumption_date DATE,
    term2_vacation_date DATE,
    term2_teaching_weeks INTEGER DEFAULT 13,
    term3_resumption_date DATE,
    term3_vacation_date DATE,
    term3_teaching_weeks INTEGER DEFAULT 12,
    official_guidelines TEXT,
    document_storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_ministry UNIQUE (session_id, ministry_name)
);

-- ==============================================================================
-- 2. CENTRAL ACADEMIC CALENDAR & TERM TIMELINES
-- ==============================================================================

-- Table: academic_calendar_events (Central timeline events for past, current & upcoming tracking)
CREATE TABLE IF NOT EXISTS public.academic_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE, -- NULL means multi-branch / global school event
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID REFERENCES public.terms(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.calendar_event_categories(id) ON DELETE RESTRICT,
    event_scope VARCHAR(30) NOT NULL DEFAULT 'School' CHECK (event_scope IN ('Ministry', 'School', 'Branch', 'Section', 'Class', 'Staff_Only', 'Public')),
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(150),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN NOT NULL DEFAULT TRUE,
    priority VARCHAR(30) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
    status VARCHAR(30) NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Confirmed', 'In_Progress', 'Completed', 'Postponed', 'Cancelled')),
    -- Cross-module links
    fee_deadline_reference_id UUID, -- References financial fee timelines
    result_batch_reference_id UUID REFERENCES public.result_batches(id) ON DELETE SET NULL,
    inventory_audit_reference_id UUID,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule VARCHAR(100), -- e.g. "FREQ=WEEKLY;BYDAY=MO"
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    updated_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_event_dates CHECK (end_date >= start_date)
);

-- Table: term_timeline_milestones (Standard structural milestones: Resumption -> CA1 -> Midterm -> CA2 -> Exams -> Results -> Report Cards -> Vacation)
CREATE TABLE IF NOT EXISTS public.term_timeline_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    milestone_name VARCHAR(100) NOT NULL, -- e.g. "Continuous Assessment 1 (CA 1)", "Mid-Term Break", "End of Term Examination"
    milestone_code VARCHAR(50) NOT NULL,
    sequence_order INTEGER NOT NULL DEFAULT 1,
    target_start_date DATE NOT NULL,
    target_end_date DATE NOT NULL,
    actual_completion_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'In_Progress', 'Completed', 'Delayed', 'Rescheduled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_term_milestone UNIQUE (branch_id, term_id, milestone_code),
    CONSTRAINT chk_milestone_dates CHECK (target_end_date >= target_start_date)
);

-- ==============================================================================
-- 3. DEADLINES & TEACHER TASKS
-- ==============================================================================

-- Table: academic_deadlines (Due dates for question papers, marking, CA scores, etc.)
CREATE TABLE IF NOT EXISTS public.academic_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    event_id UUID REFERENCES public.academic_calendar_events(id) ON DELETE SET NULL,
    deadline_type VARCHAR(50) NOT NULL CHECK (deadline_type IN ('Lesson_Plan_Submission', 'Question_Paper_Submission', 'CA_Score_Entry', 'Exam_Score_Entry', 'Report_Card_Remark', 'Fee_Payment', 'Inventory_Audit', 'General_Admin')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    due_time TIME DEFAULT '23:59:59',
    priority VARCHAR(30) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
    assigned_role VARCHAR(50), -- e.g. "Teacher", "Class_Teacher", "Accountant", "Store_Manager"
    assigned_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'In_Progress', 'Completed', 'Overdue', 'Cancelled')),
    completed_at TIMESTAMPTZ,
    completed_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: teacher_tasks (Specific actionable assignments for teachers)
CREATE TABLE IF NOT EXISTS public.teacher_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deadline_id UUID REFERENCES public.academic_deadlines(id) ON DELETE SET NULL,
    teacher_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    task_title VARCHAR(200) NOT NULL,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('Lesson_Plan', 'Question_Preparation', 'CA_Submission', 'Exam_Submission', 'Marking_Verification', 'Result_Entry', 'Progress_Update', 'Other')),
    description TEXT,
    due_date DATE NOT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
    status VARCHAR(30) NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'In_Progress', 'Submitted', 'Reviewed', 'Completed', 'Overdue', 'Cancelled')),
    submission_notes TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    reviewer_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. CURRICULUM, LESSON PLANS & TOPIC COMPLETION
-- ==============================================================================

-- Table: subject_curriculum_topics (Planned syllabus breakdown per subject, class and term)
CREATE TABLE IF NOT EXISTS public.subject_curriculum_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 20),
    topic_title VARCHAR(200) NOT NULL,
    subtopics TEXT,
    learning_objectives TEXT,
    planned_periods INTEGER NOT NULL DEFAULT 3 CHECK (planned_periods > 0),
    sequence_order INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Started', 'Completed', 'Delayed', 'Skipped', 'Rescheduled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_subject_class_term_topic UNIQUE (session_id, term_id, class_id, subject_id, week_number, sequence_order)
);

-- Table: teacher_lesson_records (Granular daily/weekly log of what was taught)
CREATE TABLE IF NOT EXISTS public.teacher_lesson_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    curriculum_topic_id UUID REFERENCES public.subject_curriculum_topics(id) ON DELETE SET NULL,
    lesson_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_number INTEGER CHECK (period_number BETWEEN 1 AND 12),
    topic_taught VARCHAR(200) NOT NULL,
    subtopics_taught TEXT,
    lesson_summary TEXT NOT NULL,
    teaching_methodology VARCHAR(150), -- e.g. "Interactive Board, Demonstration, Group Activity"
    instructional_materials_used TEXT,
    homework_assigned TEXT,
    student_understanding_level VARCHAR(50) DEFAULT 'Good' CHECK (student_understanding_level IN ('Excellent', 'Good', 'Average', 'Needs_Review')),
    teacher_remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: lesson_evidence_artifacts (Board photos, notebook photos, worksheet uploads metadata)
CREATE TABLE IF NOT EXISTS public.lesson_evidence_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_record_id UUID NOT NULL REFERENCES public.teacher_lesson_records(id) ON DELETE CASCADE,
    artifact_type VARCHAR(50) NOT NULL CHECK (artifact_type IN ('Board_Photo', 'Student_Notebook_Photo', 'Worksheet', 'Lesson_Plan_Doc', 'Teaching_Aid', 'Other')),
    caption VARCHAR(200),
    storage_file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: teacher_monitoring_checks (Formal administrative supervision & pedagogical evaluations)
CREATE TABLE IF NOT EXISTS public.teacher_monitoring_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    teacher_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    reviewer_user_id UUID NOT NULL REFERENCES public.system_user_profiles(id) ON DELETE RESTRICT,
    lesson_record_id UUID REFERENCES public.teacher_lesson_records(id) ON DELETE SET NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_category VARCHAR(50) NOT NULL CHECK (check_category IN ('Lesson_Delivery', 'Board_Summary_Quality', 'Notebook_Marking', 'Curriculum_Pacing', 'CA_Entry_Timeliness', 'General_Pedagogy')),
    rating_score NUMERIC(3,1) CHECK (rating_score >= 1.0 AND rating_score <= 5.0),
    strengths_observed TEXT,
    areas_for_improvement TEXT,
    corrective_action_required TEXT,
    follow_up_deadline DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Completed' CHECK (status IN ('Draft', 'Completed', 'Follow_Up_Required', 'Closed')),
    teacher_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE,
    teacher_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. NOTIFICATION ALERTS & REMINDERS QUEUE
-- ==============================================================================

-- Table: system_timeline_notifications (In-app reminders and notifications for upcoming & overdue milestones)
CREATE TABLE IF NOT EXISTS public.system_timeline_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    recipient_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE CASCADE,
    recipient_employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('Upcoming_Deadline', 'Overdue_Task', 'Exam_Milestone', 'Fee_Drive_Alert', 'Monitoring_Feedback', 'Calendar_Event', 'General')),
    event_id UUID REFERENCES public.academic_calendar_events(id) ON DELETE SET NULL,
    deadline_id UUID REFERENCES public.academic_deadlines(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.teacher_tasks(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Read', 'Dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. INDEXES FOR TIMELINE DASHBOARDS & QUERIES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_calendar_events_branch ON public.academic_calendar_events(branch_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_term ON public.academic_calendar_events(session_id, term_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON public.academic_calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.academic_calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_priority ON public.academic_calendar_events(priority);

CREATE INDEX IF NOT EXISTS idx_public_holidays_dates ON public.public_holidays(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_milestones_term ON public.term_timeline_milestones(term_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_deadlines_branch ON public.academic_deadlines(branch_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON public.academic_deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_status ON public.academic_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_deadlines_assigned_emp ON public.academic_deadlines(assigned_employee_id);

CREATE INDEX IF NOT EXISTS idx_teacher_tasks_teacher ON public.teacher_tasks(teacher_employee_id);
CREATE INDEX IF NOT EXISTS idx_teacher_tasks_due ON public.teacher_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_teacher_tasks_status ON public.teacher_tasks(status);

CREATE INDEX IF NOT EXISTS idx_curriculum_topics_subject ON public.subject_curriculum_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_topics_class ON public.subject_curriculum_topics(class_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_topics_term ON public.subject_curriculum_topics(session_id, term_id);

CREATE INDEX IF NOT EXISTS idx_lesson_records_teacher ON public.teacher_lesson_records(teacher_employee_id);
CREATE INDEX IF NOT EXISTS idx_lesson_records_class ON public.teacher_lesson_records(class_id);
CREATE INDEX IF NOT EXISTS idx_lesson_records_subject ON public.teacher_lesson_records(subject_id);
CREATE INDEX IF NOT EXISTS idx_lesson_records_date ON public.teacher_lesson_records(lesson_date DESC);

CREATE INDEX IF NOT EXISTS idx_lesson_artifacts_record ON public.lesson_evidence_artifacts(lesson_record_id);

CREATE INDEX IF NOT EXISTS idx_monitoring_checks_teacher ON public.teacher_monitoring_checks(teacher_employee_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_checks_reviewer ON public.teacher_monitoring_checks(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_checks_date ON public.teacher_monitoring_checks(check_date DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.system_timeline_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.system_timeline_notifications(status);

-- ==============================================================================
-- 7. TRIGGERS FOR UPDATED_AT TIMESTAMP REFRESH
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_calendar_categories_updated_at') THEN
    CREATE TRIGGER trg_calendar_categories_updated_at BEFORE UPDATE ON public.calendar_event_categories FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_public_holidays_updated_at') THEN
    CREATE TRIGGER trg_public_holidays_updated_at BEFORE UPDATE ON public.public_holidays FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ministry_calendar_updated_at') THEN
    CREATE TRIGGER trg_ministry_calendar_updated_at BEFORE UPDATE ON public.ministry_academic_calendars FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_calendar_events_updated_at') THEN
    CREATE TRIGGER trg_calendar_events_updated_at BEFORE UPDATE ON public.academic_calendar_events FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_timeline_milestones_updated_at') THEN
    CREATE TRIGGER trg_timeline_milestones_updated_at BEFORE UPDATE ON public.term_timeline_milestones FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_academic_deadlines_updated_at') THEN
    CREATE TRIGGER trg_academic_deadlines_updated_at BEFORE UPDATE ON public.academic_deadlines FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_teacher_tasks_updated_at') THEN
    CREATE TRIGGER trg_teacher_tasks_updated_at BEFORE UPDATE ON public.teacher_tasks FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_curriculum_topics_updated_at') THEN
    CREATE TRIGGER trg_curriculum_topics_updated_at BEFORE UPDATE ON public.subject_curriculum_topics FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_teacher_lesson_rec_updated_at') THEN
    CREATE TRIGGER trg_teacher_lesson_rec_updated_at BEFORE UPDATE ON public.teacher_lesson_records FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_monitoring_checks_updated_at') THEN
    CREATE TRIGGER trg_monitoring_checks_updated_at BEFORE UPDATE ON public.teacher_monitoring_checks FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all Phase 6 tables
ALTER TABLE public.calendar_event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_academic_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_timeline_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_lesson_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_evidence_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_monitoring_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_timeline_notifications ENABLE ROW LEVEL SECURITY;

-- 1. Read-only global dictionary and calendar tables (authenticated staff)
CREATE POLICY "Allow authenticated read for calendar_event_categories" ON public.calendar_event_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for public_holidays" ON public.public_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for ministry_academic_calendars" ON public.ministry_academic_calendars FOR SELECT TO authenticated USING (true);

-- 2. Branch-scoped read access for calendar events and milestones
CREATE POLICY "Branch-scoped read access for academic_calendar_events" ON public.academic_calendar_events FOR SELECT TO authenticated USING (
    branch_id IS NULL OR public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for term_timeline_milestones" ON public.term_timeline_milestones FOR SELECT TO authenticated USING (
    branch_id IS NULL OR public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for academic_deadlines" ON public.academic_deadlines FOR SELECT TO authenticated USING (
    public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for subject_curriculum_topics" ON public.subject_curriculum_topics FOR SELECT TO authenticated USING (
    branch_id IS NULL OR public.has_branch_access(branch_id)
);

-- 3. Teacher-specific RLS for tasks, lesson records, artifacts and notifications
CREATE POLICY "Teachers can view assigned tasks" ON public.teacher_tasks FOR SELECT TO authenticated USING (
    teacher_employee_id IN (
        SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR public.has_branch_access(branch_id)
);

CREATE POLICY "Teachers can update own assigned tasks" ON public.teacher_tasks FOR UPDATE TO authenticated USING (
    teacher_employee_id IN (
        SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR public.has_branch_access(branch_id)
);

CREATE POLICY "Teachers can manage own lesson records" ON public.teacher_lesson_records FOR ALL TO authenticated USING (
    teacher_employee_id IN (
        SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR public.has_branch_access(branch_id)
);

CREATE POLICY "Staff can view lesson evidence artifacts" ON public.lesson_evidence_artifacts FOR SELECT TO authenticated USING (
    lesson_record_id IN (
        SELECT r.id FROM public.teacher_lesson_records r WHERE public.has_branch_access(r.branch_id)
    )
);

CREATE POLICY "Teachers can upload lesson evidence artifacts" ON public.lesson_evidence_artifacts FOR INSERT TO authenticated WITH CHECK (
    lesson_record_id IN (
        SELECT r.id FROM public.teacher_lesson_records r WHERE r.teacher_employee_id IN (
            SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
        )
    )
);

CREATE POLICY "Teachers can view own monitoring checks" ON public.teacher_monitoring_checks FOR SELECT TO authenticated USING (
    teacher_employee_id IN (
        SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR reviewer_user_id IN (
        SELECT p.id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR public.has_branch_access(branch_id)
);

CREATE POLICY "Users can view own notifications" ON public.system_timeline_notifications FOR SELECT TO authenticated USING (
    recipient_user_id IN (
        SELECT p.id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR recipient_employee_id IN (
        SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR public.is_super_admin()
);

CREATE POLICY "Users can update own notifications" ON public.system_timeline_notifications FOR UPDATE TO authenticated USING (
    recipient_user_id IN (
        SELECT p.id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR recipient_employee_id IN (
        SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR public.is_super_admin()
);

-- 4. Super Admin full management across all Phase 6 tables
CREATE POLICY "Super admin full access on calendar_event_categories" ON public.calendar_event_categories TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on public_holidays" ON public.public_holidays TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on ministry_academic_calendars" ON public.ministry_academic_calendars TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on academic_calendar_events" ON public.academic_calendar_events TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on term_timeline_milestones" ON public.term_timeline_milestones TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on academic_deadlines" ON public.academic_deadlines TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on teacher_tasks" ON public.teacher_tasks TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on subject_curriculum_topics" ON public.subject_curriculum_topics TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on teacher_lesson_records" ON public.teacher_lesson_records TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on lesson_evidence_artifacts" ON public.lesson_evidence_artifacts TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on teacher_monitoring_checks" ON public.teacher_monitoring_checks TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on system_timeline_notifications" ON public.system_timeline_notifications TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
