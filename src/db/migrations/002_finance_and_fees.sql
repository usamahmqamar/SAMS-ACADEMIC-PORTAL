-- ==============================================================================
-- SAMS SCHOOL ERP — PHASE 2: FINANCE, FEES & EXPENSE MANAGEMENT SCHEMA
-- Migration Version: 002_finance_and_fees.sql
-- Target Database: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. FEE HEADS & CONFIGURATION
-- ==============================================================================

-- Table: fee_heads (Tuition, Textbooks, Stationery, Exam, Development, Sports, Islamia, etc.)
CREATE TABLE IF NOT EXISTS public.fee_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'Academic' CHECK (category IN ('Academic', 'Administrative', 'Facilities', 'Activities', 'Religious', 'Optional', 'Other')),
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    is_refundable BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. FEE STRUCTURES & ITEMS
-- ==============================================================================

-- Table: fee_structures (Branch, Session, Term, Section, optional Class level)
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT,
    structure_name VARCHAR(150) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Archived')),
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fee_struct_scope UNIQUE (branch_id, session_id, term_id, section_id, class_id)
);

-- Table: fee_structure_items (Fee Heads included within a Fee Structure)
CREATE TABLE IF NOT EXISTS public.fee_structure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES public.fee_heads(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    percentage NUMERIC(6,2),
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    is_included_in_main_fee BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_structure_head UNIQUE (fee_structure_id, fee_head_id)
);

-- Table: fee_class_overrides (Granular override for a specific class/term/fee_head)
CREATE TABLE IF NOT EXISTS public.fee_class_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES public.fee_heads(id) ON DELETE RESTRICT,
    override_amount NUMERIC(14,2) NOT NULL CHECK (override_amount >= 0),
    reason TEXT,
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_structure_class_head_override UNIQUE (fee_structure_id, class_id, fee_head_id)
);

-- ==============================================================================
-- 3. DISCOUNTS & SCHOLARSHIPS
-- ==============================================================================

-- Table: scholarships
CREATE TABLE IF NOT EXISTS public.scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    scholarship_name VARCHAR(150) NOT NULL,
    scholarship_type VARCHAR(30) NOT NULL CHECK (scholarship_type IN ('Percentage', 'Fixed_Amount', 'Full')),
    value NUMERIC(14,2) NOT NULL CHECK (value >= 0),
    start_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    start_term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    end_session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
    end_term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
    reason TEXT,
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Expired', 'Revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. STUDENT CHARGES & OBLIGATIONS
-- ==============================================================================

-- Table: student_fee_charges (Term-level cumulative financial obligation)
CREATE TABLE IF NOT EXISTS public.student_fee_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    family_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE RESTRICT,
    gross_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (gross_amount >= 0),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    scholarship_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (scholarship_amount >= 0),
    net_amount_due NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (net_amount_due >= 0),
    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    outstanding_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (outstanding_amount >= 0),
    due_date DATE NOT NULL,
    grace_period_days INTEGER NOT NULL DEFAULT 0 CHECK (grace_period_days >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially_Paid', 'Paid', 'Overdue', 'Waived', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_term_charge UNIQUE (student_id, session_id, term_id)
);

-- Table: fee_charge_items (Internal breakdown by fee head for accounting)
CREATE TABLE IF NOT EXISTS public.fee_charge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_fee_charge_id UUID NOT NULL REFERENCES public.student_fee_charges(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES public.fee_heads(id) ON DELETE RESTRICT,
    gross_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (gross_amount >= 0),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    scholarship_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (scholarship_amount >= 0),
    net_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (net_amount >= 0),
    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_charge_head_item UNIQUE (student_fee_charge_id, fee_head_id)
);

-- Table: discounts (Auditable discount events)
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    student_fee_charge_id UUID NOT NULL REFERENCES public.student_fee_charges(id) ON DELETE CASCADE,
    fee_head_id UUID REFERENCES public.fee_heads(id) ON DELETE SET NULL,
    discount_type VARCHAR(30) NOT NULL CHECK (discount_type IN ('Percentage', 'Fixed_Amount')),
    percentage NUMERIC(6,2),
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    reason TEXT NOT NULL,
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: optional_fee_charges (Independent non-mandatory charges: uniform, forms, etc.)
CREATE TABLE IF NOT EXISTS public.optional_fee_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    fee_head_id UUID NOT NULL REFERENCES public.fee_heads(id) ON DELETE RESTRICT,
    item_name VARCHAR(150) NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially_Paid', 'Paid', 'Cancelled')),
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. PAYMENTS & ALLOCATIONS
-- ==============================================================================

-- Table: payments (Money received from parents/guardians)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    family_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    payer_name VARCHAR(150) NOT NULL,
    payer_phone VARCHAR(50),
    payer_email VARCHAR(150),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'Bank_Transfer', 'POS', 'Cheque', 'Online_Payment', 'Other')),
    reference_number VARCHAR(150),
    bank_name VARCHAR(100),
    received_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Pending', 'Confirmed', 'Bounced', 'Refunded', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: payment_allocations (Distribution of payment to students & fee charges)
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    student_fee_charge_id UUID REFERENCES public.student_fee_charges(id) ON DELETE RESTRICT,
    optional_fee_charge_id UUID REFERENCES public.optional_fee_charges(id) ON DELETE RESTRICT,
    allocated_amount NUMERIC(14,2) NOT NULL CHECK (allocated_amount > 0),
    allocation_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_allocation_target CHECK (
      (student_fee_charge_id IS NOT NULL AND optional_fee_charge_id IS NULL) OR
      (student_fee_charge_id IS NULL AND optional_fee_charge_id IS NOT NULL)
    )
);

-- Table: payment_fee_head_allocations (Internal accounting allocation per fee head)
CREATE TABLE IF NOT EXISTS public.payment_fee_head_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_allocation_id UUID NOT NULL REFERENCES public.payment_allocations(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES public.fee_heads(id) ON DELETE RESTRICT,
    allocated_amount NUMERIC(14,2) NOT NULL CHECK (allocated_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: receipts
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    family_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    receipt_type VARCHAR(30) NOT NULL DEFAULT 'Standard' CHECK (receipt_type IN ('Standard', 'POS', 'Summary', 'Duplicate')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: refunds
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    refund_amount NUMERIC(14,2) NOT NULL CHECK (refund_amount > 0),
    refund_type VARCHAR(30) NOT NULL DEFAULT 'Partial' CHECK (refund_type IN ('Full', 'Partial')),
    reason TEXT NOT NULL,
    refund_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    processed_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. EXPENSES & EXPENSE ALLOCATIONS
-- ==============================================================================

-- Table: expense_heads (Salaries, Rent, Utilities, Maintenance, Transport, etc.)
CREATE TABLE IF NOT EXISTS public.expense_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'Operations' CHECK (category IN ('Salaries', 'Facilities', 'Administrative', 'Academic', 'Maintenance', 'Utilities', 'Transportation', 'Capital', 'Other')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    expense_head_id UUID NOT NULL REFERENCES public.expense_heads(id) ON DELETE RESTRICT,
    session_id UUID REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID REFERENCES public.terms(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor_payee VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'Bank_Transfer', 'POS', 'Cheque', 'Petty_Cash', 'Other')),
    reference_number VARCHAR(150),
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    recorded_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Paid' CHECK (status IN ('Pending', 'Approved', 'Paid', 'Cancelled', 'Rejected')),
    receipt_doc_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: expense_fee_head_allocations (Matching expenses to fee heads with % distribution)
CREATE TABLE IF NOT EXISTS public.expense_fee_head_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES public.fee_heads(id) ON DELETE RESTRICT,
    allocated_percentage NUMERIC(6,2) NOT NULL CHECK (allocated_percentage > 0 AND allocated_percentage <= 100.00),
    allocated_amount NUMERIC(14,2) NOT NULL CHECK (allocated_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_expense_fee_head UNIQUE (expense_id, fee_head_id)
);

-- ==============================================================================
-- 7. FINANCIAL TIMELINE & GENERAL LEDGER
-- ==============================================================================

-- Table: student_financial_timeline (Chronological immutable log of student balance events)
CREATE TABLE IF NOT EXISTS public.student_financial_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    family_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID REFERENCES public.terms(id) ON DELETE RESTRICT,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
      'Fee_Generated',
      'Discount_Applied',
      'Scholarship_Applied',
      'Payment_Received',
      'Payment_Allocated',
      'Refund_Issued',
      'Fee_Waived',
      'Adjustment_Debit',
      'Adjustment_Credit',
      'Store_Purchase',
      'Book_Issuance',
      'Material_Issuance'
    )),
    debit_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (debit_amount >= 0),
    credit_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (credit_amount >= 0),
    running_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    reference_id VARCHAR(150),
    description TEXT,
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: general_ledger_entries (Ledger separating fees, store sales, other revenue, expenses)
CREATE TABLE IF NOT EXISTS public.general_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID REFERENCES public.terms(id) ON DELETE RESTRICT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ledger_type VARCHAR(50) NOT NULL CHECK (ledger_type IN ('School_Fee_Revenue', 'Store_Sales', 'Other_Revenue', 'Expense', 'Refund', 'Adjustment')),
    account_code VARCHAR(50),
    debit NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
    credit NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
    reference_table VARCHAR(50),
    reference_id UUID,
    description TEXT,
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. INDEXES FOR PERFORMANCE & REPORTING
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_fee_heads_code ON public.fee_heads(code);
CREATE INDEX IF NOT EXISTS idx_fee_structures_lookup ON public.fee_structures(branch_id, session_id, term_id, section_id);
CREATE INDEX IF NOT EXISTS idx_fee_structure_items_struct ON public.fee_structure_items(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_fee_class_overrides_struct ON public.fee_class_overrides(fee_structure_id, class_id);

CREATE INDEX IF NOT EXISTS idx_scholarships_student ON public.scholarships(student_id);
CREATE INDEX IF NOT EXISTS idx_scholarships_status ON public.scholarships(status);

CREATE INDEX IF NOT EXISTS idx_fee_charges_student ON public.student_fee_charges(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_charges_family ON public.student_fee_charges(family_id);
CREATE INDEX IF NOT EXISTS idx_fee_charges_branch ON public.student_fee_charges(branch_id);
CREATE INDEX IF NOT EXISTS idx_fee_charges_session_term ON public.student_fee_charges(session_id, term_id);
CREATE INDEX IF NOT EXISTS idx_fee_charges_status ON public.student_fee_charges(status);
CREATE INDEX IF NOT EXISTS idx_fee_charges_due ON public.student_fee_charges(due_date);

CREATE INDEX IF NOT EXISTS idx_charge_items_charge ON public.fee_charge_items(student_fee_charge_id);
CREATE INDEX IF NOT EXISTS idx_discounts_charge ON public.discounts(student_fee_charge_id);
CREATE INDEX IF NOT EXISTS idx_optional_charges_student ON public.optional_fee_charges(student_id);

CREATE INDEX IF NOT EXISTS idx_payments_family ON public.payments(family_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch ON public.payments(branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_no ON public.payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON public.payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_student ON public.payment_allocations(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_charge ON public.payment_allocations(student_fee_charge_id);
CREATE INDEX IF NOT EXISTS idx_payment_head_alloc_alloc ON public.payment_fee_head_allocations(payment_allocation_id);

CREATE INDEX IF NOT EXISTS idx_receipts_payment ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_no ON public.receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds(payment_id);

CREATE INDEX IF NOT EXISTS idx_expenses_branch ON public.expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_head ON public.expenses(expense_head_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expense_fee_head_alloc ON public.expense_fee_head_allocations(expense_id);

CREATE INDEX IF NOT EXISTS idx_student_timeline_student ON public.student_financial_timeline(student_id);
CREATE INDEX IF NOT EXISTS idx_student_timeline_family ON public.student_financial_timeline(family_id);
CREATE INDEX IF NOT EXISTS idx_student_timeline_branch ON public.student_financial_timeline(branch_id);
CREATE INDEX IF NOT EXISTS idx_student_timeline_date ON public.student_financial_timeline(event_date DESC);

CREATE INDEX IF NOT EXISTS idx_general_ledger_branch ON public.general_ledger_entries(branch_id);
CREATE INDEX IF NOT EXISTS idx_general_ledger_type ON public.general_ledger_entries(ledger_type);
CREATE INDEX IF NOT EXISTS idx_general_ledger_date ON public.general_ledger_entries(entry_date DESC);

-- ==============================================================================
-- 9. TRIGGERS FOR UPDATED_AT TIMESTAMP REFRESH
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fee_heads_updated_at') THEN
    CREATE TRIGGER trg_fee_heads_updated_at BEFORE UPDATE ON public.fee_heads FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fee_structures_updated_at') THEN
    CREATE TRIGGER trg_fee_structures_updated_at BEFORE UPDATE ON public.fee_structures FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fee_structure_items_updated_at') THEN
    CREATE TRIGGER trg_fee_structure_items_updated_at BEFORE UPDATE ON public.fee_structure_items FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fee_class_overrides_updated_at') THEN
    CREATE TRIGGER trg_fee_class_overrides_updated_at BEFORE UPDATE ON public.fee_class_overrides FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_scholarships_updated_at') THEN
    CREATE TRIGGER trg_scholarships_updated_at BEFORE UPDATE ON public.scholarships FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_fee_charges_updated_at') THEN
    CREATE TRIGGER trg_student_fee_charges_updated_at BEFORE UPDATE ON public.student_fee_charges FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fee_charge_items_updated_at') THEN
    CREATE TRIGGER trg_fee_charge_items_updated_at BEFORE UPDATE ON public.fee_charge_items FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_optional_fee_charges_updated_at') THEN
    CREATE TRIGGER trg_optional_fee_charges_updated_at BEFORE UPDATE ON public.optional_fee_charges FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payments_updated_at') THEN
    CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_expense_heads_updated_at') THEN
    CREATE TRIGGER trg_expense_heads_updated_at BEFORE UPDATE ON public.expense_heads FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_expenses_updated_at') THEN
    CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all Phase 2 tables
ALTER TABLE public.fee_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structure_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_class_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_charge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optional_fee_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_fee_head_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_fee_head_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_financial_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_ledger_entries ENABLE ROW LEVEL SECURITY;

-- 1. Read-only global dictionary tables (authenticated staff)
CREATE POLICY "Allow authenticated read for fee_heads"
ON public.fee_heads FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read for expense_heads"
ON public.expense_heads FOR SELECT
TO authenticated
USING (true);

-- 2. Branch-scoped read access for authenticated staff
CREATE POLICY "Branch-scoped read access for fee_structures"
ON public.fee_structures FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for student_fee_charges"
ON public.student_fee_charges FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for optional_fee_charges"
ON public.optional_fee_charges FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for payments"
ON public.payments FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for receipts"
ON public.receipts FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for refunds"
ON public.refunds FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for student_financial_timeline"
ON public.student_financial_timeline FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

CREATE POLICY "Branch-scoped read access for general_ledger_entries"
ON public.general_ledger_entries FOR SELECT
TO authenticated
USING (public.has_branch_access(branch_id));

-- 3. Super Admin full management across all Phase 2 financial tables
CREATE POLICY "Super admin full access on fee_heads" ON public.fee_heads TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on fee_structures" ON public.fee_structures TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on fee_structure_items" ON public.fee_structure_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on fee_class_overrides" ON public.fee_class_overrides TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on scholarships" ON public.scholarships TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_fee_charges" ON public.student_fee_charges TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on fee_charge_items" ON public.fee_charge_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on discounts" ON public.discounts TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on optional_fee_charges" ON public.optional_fee_charges TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on payments" ON public.payments TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on payment_allocations" ON public.payment_allocations TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on payment_fee_head_allocations" ON public.payment_fee_head_allocations TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on receipts" ON public.receipts TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on refunds" ON public.refunds TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on expense_heads" ON public.expense_heads TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on expenses" ON public.expenses TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on expense_fee_head_allocations" ON public.expense_fee_head_allocations TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_financial_timeline" ON public.student_financial_timeline TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on general_ledger_entries" ON public.general_ledger_entries TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
