-- ==============================================================================
-- SAMS SCHOOL ERP — PHASE 5: STAFF, HR & PAYROLL MANAGEMENT SCHEMA
-- Migration Version: 005_hr_payroll.sql
-- Target Database: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. DEPARTMENTS, CATEGORIES & POSITIONS
-- ==============================================================================

-- Table: departments (Academic, Finance, Administration, Store, Maintenance, etc.)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE, -- NULL means global / all branches
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(50) NOT NULL,
    description TEXT,
    head_of_department_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_dept_code UNIQUE (branch_id, department_code)
);

-- Table: staff_categories (Teaching, Administration, Finance, Store, Security, Maintenance, Support, Other)
CREATE TABLE IF NOT EXISTS public.staff_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_teaching BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: staff_positions (Teacher, Principal, Accountant, Administrator, Store Manager, etc.)
CREATE TABLE IF NOT EXISTS public.staff_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    staff_category_id UUID REFERENCES public.staff_categories(id) ON DELETE SET NULL,
    position_title VARCHAR(100) NOT NULL UNIQUE,
    position_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    min_salary NUMERIC(14,2) DEFAULT 0.00 CHECK (min_salary >= 0),
    max_salary NUMERIC(14,2) DEFAULT 0.00 CHECK (max_salary >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. EMPLOYEE HR EXTENSIONS & DOCUMENTS
-- ==============================================================================

-- Table: employee_hr_details (Detailed HR extension linked 1:1 to public.employees)
CREATE TABLE IF NOT EXISTS public.employee_hr_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    staff_category_id UUID REFERENCES public.staff_categories(id) ON DELETE SET NULL,
    position_id UUID REFERENCES public.staff_positions(id) ON DELETE SET NULL,
    employment_type VARCHAR(50) NOT NULL DEFAULT 'Full_Time' CHECK (employment_type IN ('Full_Time', 'Part_Time', 'Contract', 'Temporary', 'Intern', 'Other')),
    confirmation_date DATE,
    contract_start_date DATE,
    contract_end_date DATE,
    nin_national_id VARCHAR(50),
    tax_identification_number VARCHAR(50),
    pension_rsa_number VARCHAR(50),
    pension_pfa_name VARCHAR(100),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(50),
    certifications_summary TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: employee_documents (Secure metadata for certificates, contracts, IDs)
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    document_title VARCHAR(150) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('ID_Card', 'Certificate', 'Contract', 'Appointment_Letter', 'Resume', 'Appraisal', 'Medical_Report', 'Other')),
    storage_file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    uploaded_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: employee_bank_accounts (Secure bank disbursement details)
CREATE TABLE IF NOT EXISTS public.employee_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(30),
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    account_type VARCHAR(30) NOT NULL DEFAULT 'Savings' CHECK (account_type IN ('Savings', 'Current', 'Salary')),
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_emp_bank_acc UNIQUE (employee_id, account_number)
);

-- ==============================================================================
-- 3. SALARY STRUCTURES & CONFIGURABLE COMPONENTS
-- ==============================================================================

-- Table: salary_components (Configurable earnings and deductions catalog)
CREATE TABLE IF NOT EXISTS public.salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name VARCHAR(100) NOT NULL,
    component_code VARCHAR(50) NOT NULL UNIQUE,
    component_type VARCHAR(30) NOT NULL CHECK (component_type IN ('Earning', 'Deduction')),
    calculation_type VARCHAR(30) NOT NULL DEFAULT 'Fixed_Amount' CHECK (calculation_type IN ('Fixed_Amount', 'Percentage_of_Basic', 'Percentage_of_Gross', 'Attendance_Rule')),
    is_taxable BOOLEAN NOT NULL DEFAULT FALSE,
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: employee_salary_structures (Versioned salary packages per employee with effective dates)
CREATE TABLE IF NOT EXISTS public.employee_salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    effective_from_date DATE NOT NULL,
    effective_to_date DATE,
    basic_salary NUMERIC(14,2) NOT NULL CHECK (basic_salary >= 0),
    total_allowances NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_allowances >= 0),
    gross_salary NUMERIC(14,2) NOT NULL CHECK (gross_salary >= 0),
    standard_deductions NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (standard_deductions >= 0),
    net_salary NUMERIC(14,2) NOT NULL CHECK (net_salary >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Superseded', 'Cancelled')),
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: employee_salary_structure_items (Granular allowance/deduction breakdowns)
CREATE TABLE IF NOT EXISTS public.employee_salary_structure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_structure_id UUID NOT NULL REFERENCES public.employee_salary_structures(id) ON DELETE CASCADE,
    salary_component_id UUID NOT NULL REFERENCES public.salary_components(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    percentage NUMERIC(6,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_struct_component UNIQUE (salary_structure_id, salary_component_id)
);

-- ==============================================================================
-- 4. ATTENDANCE DEDUCTION RULES, PENALTIES, LOANS & LEAVE
-- ==============================================================================

-- Table: attendance_deduction_policies (Configurable absence/late policies per branch)
CREATE TABLE IF NOT EXISTS public.attendance_deduction_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    policy_name VARCHAR(150) NOT NULL DEFAULT 'Standard Staff Attendance Policy',
    absence_deduction_type VARCHAR(50) NOT NULL DEFAULT 'Daily_Rate' CHECK (absence_deduction_type IN ('Daily_Rate', 'Fixed_Amount', 'None')),
    absence_fixed_amount NUMERIC(14,2) DEFAULT 0.00 CHECK (absence_fixed_amount >= 0),
    late_deduction_type VARCHAR(50) NOT NULL DEFAULT 'Fixed_Amount' CHECK (late_deduction_type IN ('Fixed_Amount', 'Graduated', 'None')),
    late_deduction_amount NUMERIC(14,2) DEFAULT 500.00 CHECK (late_deduction_amount >= 0),
    late_grace_count_per_month INTEGER NOT NULL DEFAULT 2 CHECK (late_grace_count_per_month >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: staff_penalties (Audited disciplinary financial deductions)
CREATE TABLE IF NOT EXISTS public.staff_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    penalty_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Approved' CHECK (status IN ('Pending', 'Approved', 'Deducted_In_Payroll', 'Waived', 'Cancelled')),
    payroll_period_id UUID, -- Set when deducted in a payroll run
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: staff_loans_advances (Loans and salary advances with repayment installments)
CREATE TABLE IF NOT EXISTS public.staff_loans_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    disbursement_type VARCHAR(30) NOT NULL DEFAULT 'Loan' CHECK (disbursement_type IN ('Loan', 'Salary_Advance', 'Emergency_Support')),
    principal_amount NUMERIC(14,2) NOT NULL CHECK (principal_amount > 0),
    monthly_installment_amount NUMERIC(14,2) NOT NULL CHECK (monthly_installment_amount > 0),
    repayment_start_date DATE NOT NULL,
    repayment_end_date DATE,
    total_repaid_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_repaid_amount >= 0),
    outstanding_balance NUMERIC(14,2) NOT NULL CHECK (outstanding_balance >= 0),
    purpose TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Pending', 'Active', 'Fully_Repaid', 'Defaulted', 'Cancelled')),
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: staff_leaves (Leave applications and approvals)
CREATE TABLE IF NOT EXISTS public.staff_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('Annual', 'Sick', 'Maternity', 'Paternity', 'Emergency', 'Study', 'Compassionate', 'Unpaid', 'Other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL CHECK (total_days > 0),
    reason TEXT NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'Approved' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    approval_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

-- ==============================================================================
-- 5. PAYROLL PERIODS, RUNS & LINE ITEMS
-- ==============================================================================

-- Table: payroll_periods (Monthly payroll batches per branch)
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
    term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
    period_name VARCHAR(100) NOT NULL, -- e.g. "September 2026 Payroll - Branch A"
    month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Processing', 'Reviewed', 'Approved', 'Paid', 'Locked')),
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    reviewed_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_payroll_period UNIQUE (branch_id, month, year),
    CONSTRAINT chk_period_dates CHECK (end_date >= start_date)
);

-- Table: payroll_runs (Aggregated payroll execution and totals per period)
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    total_employees_count INTEGER NOT NULL DEFAULT 0,
    total_basic_salary NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_basic_salary >= 0),
    total_allowances NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_allowances >= 0),
    total_gross_salary NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_gross_salary >= 0),
    total_attendance_deductions NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_attendance_deductions >= 0),
    total_penalty_deductions NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_penalty_deductions >= 0),
    total_loan_deductions NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_loan_deductions >= 0),
    total_advance_deductions NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_advance_deductions >= 0),
    total_other_deductions NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_other_deductions >= 0),
    total_deductions NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_deductions >= 0),
    total_net_salary NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_net_salary >= 0),
    expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL, -- Connects to Phase 2 General Expenses
    status VARCHAR(30) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Processed', 'Approved', 'Paid', 'Cancelled')),
    processed_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: employee_payroll_entries (Per-employee monthly payslip records)
CREATE TABLE IF NOT EXISTS public.employee_payroll_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    salary_structure_id UUID REFERENCES public.employee_salary_structures(id) ON DELETE SET NULL,
    bank_account_id UUID REFERENCES public.employee_bank_accounts(id) ON DELETE SET NULL,
    days_worked INTEGER NOT NULL DEFAULT 0,
    days_absent INTEGER NOT NULL DEFAULT 0,
    days_late INTEGER NOT NULL DEFAULT 0,
    basic_salary NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (basic_salary >= 0),
    total_allowances NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_allowances >= 0),
    gross_salary NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (gross_salary >= 0),
    absence_deduction NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (absence_deduction >= 0),
    late_deduction NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (late_deduction >= 0),
    penalty_deduction NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (penalty_deduction >= 0),
    loan_repayment_deduction NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (loan_repayment_deduction >= 0),
    advance_repayment_deduction NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (advance_repayment_deduction >= 0),
    tax_pension_deduction NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (tax_pension_deduction >= 0),
    other_deductions NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (other_deductions >= 0),
    total_deductions NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_deductions >= 0),
    net_salary NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (net_salary >= 0),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Processing', 'Paid', 'Hold')),
    payment_date DATE,
    payment_reference VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_emp_payroll_period UNIQUE (employee_id, payroll_period_id)
);

-- Table: employee_payroll_items (Detailed line items for each employee payslip)
CREATE TABLE IF NOT EXISTS public.employee_payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_entry_id UUID NOT NULL REFERENCES public.employee_payroll_entries(id) ON DELETE CASCADE,
    component_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(30) NOT NULL CHECK (component_type IN ('Earning', 'Deduction')),
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: payroll_snapshots (Immutable JSON archive of finalized payroll runs)
CREATE TABLE IF NOT EXISTS public.payroll_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL UNIQUE REFERENCES public.payroll_runs(id) ON DELETE RESTRICT,
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    snapshot_data JSONB NOT NULL,
    total_net_payout NUMERIC(14,2) NOT NULL,
    locked_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: payroll_payments (Individual or batch payment disbursement logs)
CREATE TABLE IF NOT EXISTS public.payroll_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE RESTRICT,
    payroll_entry_id UUID NOT NULL REFERENCES public.employee_payroll_entries(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Bank_Transfer' CHECK (payment_method IN ('Bank_Transfer', 'Cash', 'Cheque', 'Other')),
    payment_reference VARCHAR(150),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'Successful' CHECK (status IN ('Pending', 'Successful', 'Failed', 'Reversed')),
    disbursed_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. CLASS-LEVEL SALARY ANALYSIS & FEE HEAD FUNDING MAPPINGS
-- ==============================================================================

-- Table: teacher_class_cost_allocations (Configurable teaching salary weightings per class)
CREATE TABLE IF NOT EXISTS public.teacher_class_cost_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    allocation_percentage NUMERIC(6,2) NOT NULL CHECK (allocation_percentage > 0 AND allocation_percentage <= 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_teacher_class_alloc UNIQUE (employee_id, session_id, term_id, class_id)
);

-- ==============================================================================
-- 7. INDEXES FOR PERFORMANCE & AUDIT
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_departments_branch ON public.departments(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_positions_dept ON public.staff_positions(department_id);
CREATE INDEX IF NOT EXISTS idx_emp_hr_employee ON public.employee_hr_details(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_documents_emp ON public.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_bank_acc_emp ON public.employee_bank_accounts(employee_id);

CREATE INDEX IF NOT EXISTS idx_salary_struct_emp ON public.employee_salary_structures(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_struct_branch ON public.employee_salary_structures(branch_id);
CREATE INDEX IF NOT EXISTS idx_salary_struct_dates ON public.employee_salary_structures(effective_from_date, effective_to_date);

CREATE INDEX IF NOT EXISTS idx_penalties_emp ON public.staff_penalties(employee_id);
CREATE INDEX IF NOT EXISTS idx_penalties_branch ON public.staff_penalties(branch_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON public.staff_penalties(status);

CREATE INDEX IF NOT EXISTS idx_loans_emp ON public.staff_loans_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.staff_loans_advances(status);

CREATE INDEX IF NOT EXISTS idx_leaves_emp ON public.staff_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_dates ON public.staff_leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON public.staff_leaves(status);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_branch ON public.payroll_periods(branch_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_month_year ON public.payroll_periods(month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON public.payroll_runs(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_branch ON public.payroll_runs(branch_id);

CREATE INDEX IF NOT EXISTS idx_payroll_entries_run ON public.employee_payroll_entries(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_emp ON public.employee_payroll_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_branch ON public.employee_payroll_entries(branch_id);

CREATE INDEX IF NOT EXISTS idx_payroll_items_entry ON public.employee_payroll_items(payroll_entry_id);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_run ON public.payroll_payments(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_emp ON public.payroll_payments(employee_id);

CREATE INDEX IF NOT EXISTS idx_teacher_class_cost_emp ON public.teacher_class_cost_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_cost_class ON public.teacher_class_cost_allocations(class_id);

-- ==============================================================================
-- 8. TRIGGERS FOR UPDATED_AT TIMESTAMP REFRESH
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_departments_updated_at') THEN
    CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_staff_categories_updated_at') THEN
    CREATE TRIGGER trg_staff_categories_updated_at BEFORE UPDATE ON public.staff_categories FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_staff_positions_updated_at') THEN
    CREATE TRIGGER trg_staff_positions_updated_at BEFORE UPDATE ON public.staff_positions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emp_hr_details_updated_at') THEN
    CREATE TRIGGER trg_emp_hr_details_updated_at BEFORE UPDATE ON public.employee_hr_details FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emp_documents_updated_at') THEN
    CREATE TRIGGER trg_emp_documents_updated_at BEFORE UPDATE ON public.employee_documents FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emp_bank_accounts_updated_at') THEN
    CREATE TRIGGER trg_emp_bank_accounts_updated_at BEFORE UPDATE ON public.employee_bank_accounts FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_salary_components_updated_at') THEN
    CREATE TRIGGER trg_salary_components_updated_at BEFORE UPDATE ON public.salary_components FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_salary_structures_updated_at') THEN
    CREATE TRIGGER trg_salary_structures_updated_at BEFORE UPDATE ON public.employee_salary_structures FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_attendance_ded_pol_updated_at') THEN
    CREATE TRIGGER trg_attendance_ded_pol_updated_at BEFORE UPDATE ON public.attendance_deduction_policies FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_staff_penalties_updated_at') THEN
    CREATE TRIGGER trg_staff_penalties_updated_at BEFORE UPDATE ON public.staff_penalties FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_staff_loans_updated_at') THEN
    CREATE TRIGGER trg_staff_loans_updated_at BEFORE UPDATE ON public.staff_loans_advances FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_staff_leaves_updated_at') THEN
    CREATE TRIGGER trg_staff_leaves_updated_at BEFORE UPDATE ON public.staff_leaves FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payroll_periods_updated_at') THEN
    CREATE TRIGGER trg_payroll_periods_updated_at BEFORE UPDATE ON public.payroll_periods FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payroll_runs_updated_at') THEN
    CREATE TRIGGER trg_payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payroll_entries_updated_at') THEN
    CREATE TRIGGER trg_payroll_entries_updated_at BEFORE UPDATE ON public.employee_payroll_entries FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_teacher_cost_alloc_updated_at') THEN
    CREATE TRIGGER trg_teacher_cost_alloc_updated_at BEFORE UPDATE ON public.teacher_class_cost_allocations FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all Phase 5 tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_hr_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary_structure_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_deduction_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_loans_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_class_cost_allocations ENABLE ROW LEVEL SECURITY;

-- 1. Read-only global dictionary tables (authenticated staff)
CREATE POLICY "Allow authenticated read for departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for staff_categories" ON public.staff_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for staff_positions" ON public.staff_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for salary_components" ON public.salary_components FOR SELECT TO authenticated USING (true);

-- 2. Sensitive Bank & Salary RLS: Employees can view only their own bank details; HR/Super Admin can view branch
CREATE POLICY "Employees can view own bank details" ON public.employee_bank_accounts FOR SELECT TO authenticated USING (
  employee_id IN (
    SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
  ) OR public.is_super_admin()
);

CREATE POLICY "Employees can view own salary structure" ON public.employee_salary_structures FOR SELECT TO authenticated USING (
  employee_id IN (
    SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
  ) OR public.has_branch_access(branch_id)
);

CREATE POLICY "Employees can view own payroll entries" ON public.employee_payroll_entries FOR SELECT TO authenticated USING (
  employee_id IN (
    SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
  ) OR public.has_branch_access(branch_id)
);

CREATE POLICY "Employees can view own leaves" ON public.staff_leaves FOR SELECT TO authenticated USING (
  employee_id IN (
    SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
  ) OR public.has_branch_access(branch_id)
);

CREATE POLICY "Employees can view own penalties" ON public.staff_penalties FOR SELECT TO authenticated USING (
  employee_id IN (
    SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
  ) OR public.has_branch_access(branch_id)
);

CREATE POLICY "Employees can view own loans" ON public.staff_loans_advances FOR SELECT TO authenticated USING (
  employee_id IN (
    SELECT p.employee_id FROM public.system_user_profiles p WHERE p.auth_user_id = auth.uid() AND p.status = 'Active'
  ) OR public.has_branch_access(branch_id)
);

-- 3. Branch-scoped read access for authenticated managers & accountants
CREATE POLICY "Branch-scoped read access for employee_hr_details" ON public.employee_hr_details FOR SELECT TO authenticated USING (
  employee_id IN (SELECT id FROM public.employees WHERE public.has_branch_access(branch_id))
);

CREATE POLICY "Branch-scoped read access for employee_documents" ON public.employee_documents FOR SELECT TO authenticated USING (
  employee_id IN (SELECT id FROM public.employees WHERE public.has_branch_access(branch_id))
);

CREATE POLICY "Branch-scoped read access for attendance_deduction_policies" ON public.attendance_deduction_policies FOR SELECT TO authenticated USING (
  branch_id IS NULL OR public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for payroll_periods" ON public.payroll_periods FOR SELECT TO authenticated USING (
  public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for payroll_runs" ON public.payroll_runs FOR SELECT TO authenticated USING (
  public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for payroll_snapshots" ON public.payroll_snapshots FOR SELECT TO authenticated USING (
  public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for payroll_payments" ON public.payroll_payments FOR SELECT TO authenticated USING (
  public.has_branch_access(branch_id)
);

CREATE POLICY "Branch-scoped read access for teacher_class_cost_allocations" ON public.teacher_class_cost_allocations FOR SELECT TO authenticated USING (
  public.has_branch_access(branch_id)
);

-- 4. Super Admin full management across all Phase 5 tables
CREATE POLICY "Super admin full access on departments" ON public.departments TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on staff_categories" ON public.staff_categories TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on staff_positions" ON public.staff_positions TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on employee_hr_details" ON public.employee_hr_details TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on employee_documents" ON public.employee_documents TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on employee_bank_accounts" ON public.employee_bank_accounts TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on salary_components" ON public.salary_components TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on employee_salary_structures" ON public.employee_salary_structures TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on employee_salary_structure_items" ON public.employee_salary_structure_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on attendance_deduction_policies" ON public.attendance_deduction_policies TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on staff_penalties" ON public.staff_penalties TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on staff_loans_advances" ON public.staff_loans_advances TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on staff_leaves" ON public.staff_leaves TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on payroll_periods" ON public.payroll_periods TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on payroll_runs" ON public.payroll_runs TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on employee_payroll_entries" ON public.employee_payroll_entries TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on employee_payroll_items" ON public.employee_payroll_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on payroll_snapshots" ON public.payroll_snapshots TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on payroll_payments" ON public.payroll_payments TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on teacher_class_cost_allocations" ON public.teacher_class_cost_allocations TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
