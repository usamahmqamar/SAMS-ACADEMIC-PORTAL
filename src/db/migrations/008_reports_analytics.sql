-- ==============================================================================
-- SAMS SCHOOL ERP — PHASE 8: REPORTS, DASHBOARDS & MANAGEMENT INTELLIGENCE
-- Migration Version: 008_reports_analytics.sql
-- Target Database: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. REPORT DEFINITIONS & ACCESS REGISTRY
-- ==============================================================================

-- Table: report_definitions (Configurable catalog of available system reports)
CREATE TABLE IF NOT EXISTS public.report_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(150) NOT NULL UNIQUE,
    report_code VARCHAR(50) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL CHECK (module IN ('Finance', 'Academics', 'Inventory', 'HR_Payroll', 'Admissions', 'Attendance', 'Calendar_Compliance', 'Executive_Dashboard')),
    description TEXT,
    required_role VARCHAR(50) NOT NULL DEFAULT 'Principal' CHECK (required_role IN ('Super_Admin', 'Director', 'Principal', 'Accountant', 'Teacher', 'Store_Manager', 'Staff')),
    supported_formats VARCHAR(100) NOT NULL DEFAULT 'PDF,CSV,Excel,Print',
    is_system_default BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Deprecated')),
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: dashboard_metric_definitions (Configurable KPI cards for Executive and Branch dashboards)
CREATE TABLE IF NOT EXISTS public.dashboard_metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(150) NOT NULL UNIQUE,
    metric_code VARCHAR(50) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL CHECK (module IN ('Students', 'Fees', 'Expenses', 'Academics', 'Inventory', 'Staff', 'Admissions')),
    aggregation_type VARCHAR(50) NOT NULL DEFAULT 'SUM' CHECK (aggregation_type IN ('SUM', 'COUNT', 'AVG', 'RATIO', 'PERCENTAGE')),
    format_type VARCHAR(30) NOT NULL DEFAULT 'Currency' CHECK (format_type IN ('Currency', 'Integer', 'Decimal', 'Percentage')),
    display_order INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. REPORT SNAPSHOTS & EXPORT AUDIT LOGS
-- ==============================================================================

-- Table: report_snapshots (Immutable periodic snapshots of signed-off official reports)
CREATE TABLE IF NOT EXISTS public.report_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_definition_id UUID NOT NULL REFERENCES public.report_definitions(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE, -- NULL for consolidated multi-branch reports
    session_id UUID REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID REFERENCES public.terms(id) ON DELETE RESTRICT,
    snapshot_title VARCHAR(200) NOT NULL,
    snapshot_code VARCHAR(100) NOT NULL UNIQUE, -- e.g. "PL-2026-T1-MAIN-FINAL"
    filter_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    report_data_payload JSONB NOT NULL, -- Structured JSON payload of the entire generated report
    summary_metrics JSONB, -- High-level totals for fast index lookups (e.g. {"total_revenue": 5000000, "total_expenses": 3200000})
    is_locked BOOLEAN NOT NULL DEFAULT TRUE,
    generated_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: report_export_jobs (Audit tracking for on-demand CSV, Excel and PDF generation)
CREATE TABLE IF NOT EXISTS public.report_export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_definition_id UUID REFERENCES public.report_definitions(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    export_format VARCHAR(30) NOT NULL CHECK (export_format IN ('PDF', 'CSV', 'Excel', 'Print_HTML')),
    query_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    storage_file_path TEXT,
    file_size_bytes BIGINT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed')),
    error_message TEXT,
    requested_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. ANALYTICAL VIEWS (DERIVED DIRECTLY FROM SOURCE-OF-TRUTH TABLES)
-- ==============================================================================

-- View: vw_class_financial_performance (Class-wise revenue, teacher cost, books & net contribution)
CREATE OR REPLACE VIEW public.vw_class_financial_performance AS
SELECT 
    c.id AS class_id,
    c.branch_id,
    c.section_id,
    c.class_name,
    c.class_code,
    -- Student Headcount
    COUNT(DISTINCT seh.student_id) AS total_enrolled_students,
    -- Fee Revenue (Billed vs Collected)
    COALESCE(SUM(sfc.net_amount_due), 0.00) AS total_billed_revenue,
    COALESCE(SUM(pa.allocated_amount), 0.00) AS total_collected_revenue,
    (COALESCE(SUM(sfc.net_amount_due), 0.00) - COALESCE(SUM(pa.allocated_amount), 0.00)) AS total_outstanding_revenue,
    CASE 
        WHEN COALESCE(SUM(sfc.net_amount_due), 0.00) > 0 
        THEN ROUND((COALESCE(SUM(pa.allocated_amount), 0.00) / SUM(sfc.net_amount_due)) * 100.0, 2)
        ELSE 0.00 
    END AS collection_percentage,
    -- Direct Allocated Costs (Teacher Salaries from Phase 5 allocations * salary structures)
    COALESCE((
        SELECT SUM(ROUND(ess.gross_salary * (tca.allocation_percentage / 100.0), 2))
        FROM public.teacher_class_cost_allocations tca 
        JOIN public.employee_salary_structures ess ON ess.employee_id = tca.employee_id AND ess.status = 'Active'
        WHERE tca.class_id = c.id
    ), 0.00) AS direct_teacher_salary_cost,
    -- Net Class Contribution
    (
        COALESCE(SUM(pa.allocated_amount), 0.00) - 
        COALESCE((
            SELECT SUM(ROUND(ess.gross_salary * (tca.allocation_percentage / 100.0), 2))
            FROM public.teacher_class_cost_allocations tca 
            JOIN public.employee_salary_structures ess ON ess.employee_id = tca.employee_id AND ess.status = 'Active'
            WHERE tca.class_id = c.id
        ), 0.00)
    ) AS net_class_contribution,
    -- Expense Ratio
    CASE 
        WHEN COALESCE(SUM(pa.allocated_amount), 0.00) > 0 
        THEN ROUND((
            COALESCE((
                SELECT SUM(ROUND(ess.gross_salary * (tca.allocation_percentage / 100.0), 2))
                FROM public.teacher_class_cost_allocations tca 
                JOIN public.employee_salary_structures ess ON ess.employee_id = tca.employee_id AND ess.status = 'Active'
                WHERE tca.class_id = c.id
            ), 0.00) / 
            SUM(pa.allocated_amount)
        ) * 100.0, 2)
        ELSE 0.00 
    END AS class_expense_ratio
FROM public.classes c
LEFT JOIN public.student_enrollment_history seh ON seh.class_id = c.id AND seh.status = 'Active'
LEFT JOIN public.student_fee_charges sfc ON sfc.class_id = c.id
LEFT JOIN public.payment_allocations pa ON pa.student_fee_charge_id = sfc.id
GROUP BY c.id, c.branch_id, c.section_id, c.class_name, c.class_code;

-- View: vw_fee_head_profitability (Fee Head Revenue vs Fee Head Expenses)
CREATE OR REPLACE VIEW public.vw_fee_head_profitability AS
SELECT 
    fh.id AS fee_head_id,
    fh.name AS head_name,
    fh.code AS head_code,
    fh.category,
    -- Total Collected Revenue for this Fee Head
    COALESCE((
        SELECT SUM(pfha.allocated_amount)
        FROM public.payment_fee_head_allocations pfha
        WHERE pfha.fee_head_id = fh.id
    ), 0.00) AS total_collected_revenue,
    -- Total Expense Allocated to this Fee Head (from Phase 2 expense allocations)
    COALESCE((
        SELECT SUM(efa.allocated_amount)
        FROM public.expense_fee_head_allocations efa
        WHERE efa.fee_head_id = fh.id
    ), 0.00) AS total_allocated_expense,
    -- Net Margin
    (
        COALESCE((SELECT SUM(pfha.allocated_amount) FROM public.payment_fee_head_allocations pfha WHERE pfha.fee_head_id = fh.id), 0.00) -
        COALESCE((SELECT SUM(efa.allocated_amount) FROM public.expense_fee_head_allocations efa WHERE efa.fee_head_id = fh.id), 0.00)
    ) AS net_fee_head_margin,
    -- Profitability Percentage
    CASE 
        WHEN COALESCE((SELECT SUM(pfha.allocated_amount) FROM public.payment_fee_head_allocations pfha WHERE pfha.fee_head_id = fh.id), 0.00) > 0
        THEN ROUND((
            (
                COALESCE((SELECT SUM(pfha.allocated_amount) FROM public.payment_fee_head_allocations pfha WHERE pfha.fee_head_id = fh.id), 0.00) -
                COALESCE((SELECT SUM(efa.allocated_amount) FROM public.expense_fee_head_allocations efa WHERE efa.fee_head_id = fh.id), 0.00)
            ) / (SELECT SUM(pfha.allocated_amount) FROM public.payment_fee_head_allocations pfha WHERE pfha.fee_head_id = fh.id)
        ) * 100.0, 2)
        ELSE 0.00
    END AS profit_margin_percentage
FROM public.fee_heads fh;

-- View: vw_branch_executive_summary (Consolidated branch KPI snapshot)
CREATE OR REPLACE VIEW public.vw_branch_executive_summary AS
SELECT 
    b.id AS branch_id,
    b.branch_name,
    b.branch_code,
    -- Total Active Students
    COUNT(DISTINCT s.id) AS total_students,
    -- Total Active Employees
    (SELECT COUNT(*) FROM public.employees e WHERE e.branch_id = b.id AND e.employment_status = 'Active') AS total_employees,
    -- Total Collected Payments
    COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.branch_id = b.id AND p.status = 'Confirmed'), 0.00) AS total_collected_revenue,
    -- Total Operating Expenses (Phase 2 expenses)
    COALESCE((SELECT SUM(ex.amount) FROM public.expenses ex WHERE ex.branch_id = b.id AND ex.status = 'Approved'), 0.00) AS total_expenses,
    -- Net Profit / Loss
    (
        COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.branch_id = b.id AND p.status = 'Confirmed'), 0.00) -
        COALESCE((SELECT SUM(ex.amount) FROM public.expenses ex WHERE ex.branch_id = b.id AND ex.status = 'Approved'), 0.00)
    ) AS net_profit_loss,
    -- Expense Ratio
    CASE 
        WHEN COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.branch_id = b.id AND p.status = 'Confirmed'), 0.00) > 0
        THEN ROUND((
            COALESCE((SELECT SUM(ex.amount) FROM public.expenses ex WHERE ex.branch_id = b.id AND ex.status = 'Approved'), 0.00) / 
            (SELECT SUM(p.amount) FROM public.payments p WHERE p.branch_id = b.id AND p.status = 'Confirmed')
        ) * 100.0, 2)
        ELSE 0.00
    END AS branch_expense_ratio
FROM public.branches b
LEFT JOIN public.students s ON s.branch_id = b.id AND s.status = 'Active'
GROUP BY b.id, b.branch_name, b.branch_code;

-- ==============================================================================
-- 4. INDEXES FOR HIGH-SPEED REPORTING & DASHBOARDS
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_report_def_module ON public.report_definitions(module);
CREATE INDEX IF NOT EXISTS idx_report_def_role ON public.report_definitions(required_role);

CREATE INDEX IF NOT EXISTS idx_snapshots_report ON public.report_snapshots(report_definition_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_branch ON public.report_snapshots(branch_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_session_term ON public.report_snapshots(session_id, term_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON public.report_snapshots(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_jobs_branch ON public.report_export_jobs(branch_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON public.report_export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_user ON public.report_export_jobs(requested_by_user_id);

-- ==============================================================================
-- 5. TRIGGERS FOR UPDATED_AT TIMESTAMP REFRESH
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_report_defs_updated_at') THEN
    CREATE TRIGGER trg_report_defs_updated_at BEFORE UPDATE ON public.report_definitions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_metric_defs_updated_at') THEN
    CREATE TRIGGER trg_metric_defs_updated_at BEFORE UPDATE ON public.dashboard_metric_definitions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all Phase 8 reporting tables
ALTER TABLE public.report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_export_jobs ENABLE ROW LEVEL SECURITY;

-- 1. Read-only report and metric definitions for authenticated staff
CREATE POLICY "Allow authenticated read for report_definitions" ON public.report_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for dashboard_metric_definitions" ON public.dashboard_metric_definitions FOR SELECT TO authenticated USING (true);

-- 2. Branch-scoped read access for report snapshots
CREATE POLICY "Branch-scoped read access for report_snapshots" ON public.report_snapshots FOR SELECT TO authenticated USING (
    branch_id IS NULL OR public.has_branch_access(branch_id)
);

-- 3. User & branch scoped access for export jobs
CREATE POLICY "User-scoped read access for report_export_jobs" ON public.report_export_jobs FOR SELECT TO authenticated USING (
    requested_by_user_id IN (
        SELECT p.id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR (branch_id IS NOT NULL AND public.has_branch_access(branch_id)) OR public.is_super_admin()
);

CREATE POLICY "Users can create report_export_jobs" ON public.report_export_jobs FOR INSERT TO authenticated WITH CHECK (
    requested_by_user_id IN (
        SELECT p.id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
    ) OR public.is_super_admin()
);

-- 4. Super Admin full management across all Phase 8 tables
CREATE POLICY "Super admin full access on report_definitions" ON public.report_definitions TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on dashboard_metric_definitions" ON public.dashboard_metric_definitions TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on report_snapshots" ON public.report_snapshots TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on report_export_jobs" ON public.report_export_jobs TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
