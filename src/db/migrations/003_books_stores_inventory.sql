-- ==============================================================================
-- SAMS SCHOOL ERP — PHASE 3: BOOKS, STORES & INVENTORY MANAGEMENT SCHEMA
-- Migration Version: 003_books_stores_inventory.sql
-- Target Database: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. STORES, PUBLISHERS & SUPPLIERS
-- ==============================================================================

-- Table: stores (Main Store, Secondary Store per Branch)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    store_code VARCHAR(50) NOT NULL,
    store_name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    store_manager_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Under_Maintenance')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_store_code UNIQUE (branch_id, store_code)
);

-- Table: publishers
CREATE TABLE IF NOT EXISTS public.publishers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    website VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    contact_person VARCHAR(150),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_account_name VARCHAR(150),
    tax_id VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Blacklisted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. INVENTORY CATALOGUE & BOOK MASTER
-- ==============================================================================

-- Table: inventory_items (Textbooks, Stationery, Uniform Materials, Ready-made, etc.)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'Textbooks',
        'Stationery',
        'Uniform_Materials',
        'Ready_made_Uniforms',
        'Office_Materials',
        'Teaching_Materials',
        'Sports_Materials',
        'Islamia_Materials',
        'Other'
    )),
    description TEXT,
    unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'Piece', -- Piece, Copy, Pack, Box, Meter, Yard, Set, Pair
    subject_id UUID, -- For future subjects relationship
    class_level VARCHAR(50),
    publisher_id UUID REFERENCES public.publishers(id) ON DELETE SET NULL,
    preferred_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    fee_head_id UUID REFERENCES public.fee_heads(id) ON DELETE SET NULL,
    cost_price NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    selling_price NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: books (Detailed book catalogue metadata linked to inventory item)
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL UNIQUE REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    isbn VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    publisher_id UUID REFERENCES public.publishers(id) ON DELETE SET NULL,
    author VARCHAR(200),
    edition VARCHAR(50),
    class_level VARCHAR(50) NOT NULL,
    cost_price NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    standard_selling_price NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (standard_selling_price >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Discontinued', 'Out_of_Print')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: branch_book_requirements (Branch/Session/Term/Class book demand matrix)
CREATE TABLE IF NOT EXISTS public.branch_book_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE RESTRICT,
    required_quantity INTEGER NOT NULL CHECK (required_quantity >= 0),
    is_compulsory BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Superseded', 'Archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_class_book_req UNIQUE (branch_id, session_id, term_id, class_id, book_id)
);

-- ==============================================================================
-- 3. STORE STOCK BALANCES & TRANSACTIONS
-- ==============================================================================

-- Table: store_inventory_balances (Current balances per item per store)
CREATE TABLE IF NOT EXISTS public.store_inventory_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    opening_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (opening_quantity >= 0),
    received_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (received_quantity >= 0),
    transferred_in_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (transferred_in_quantity >= 0),
    transferred_out_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (transferred_out_quantity >= 0),
    issued_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (issued_quantity >= 0),
    sold_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (sold_quantity >= 0),
    adjustment_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    current_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (current_quantity >= 0),
    average_unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (average_unit_cost >= 0),
    total_stock_value NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_stock_value >= 0),
    last_stock_count_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_store_item_balance UNIQUE (store_id, inventory_item_id)
);

-- Table: inventory_transactions (Immutable audit ledger of every physical stock move)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'Opening_Stock',
        'Purchase_Receipt',
        'Transfer_In',
        'Transfer_Out',
        'Student_Issue',
        'Material_Issue',
        'Sale',
        'Return',
        'Adjustment_Count',
        'Damage',
        'Loss',
        'Correction'
    )),
    quantity NUMERIC(12,2) NOT NULL,
    unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    total_value NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_value >= 0),
    resulting_balance NUMERIC(12,2) NOT NULL CHECK (resulting_balance >= 0),
    reference_table VARCHAR(50),
    reference_id UUID,
    batch_number VARCHAR(100),
    notes TEXT,
    performed_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. PROCUREMENT, PURCHASE ORDERS & GOODS RECEIVING
-- ==============================================================================

-- Table: purchase_orders (Batch procurement with multi-order tracking)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    destination_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
    term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    outstanding_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (outstanding_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Ordered', 'Partially_Received', 'Completed', 'Cancelled')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partially_Paid', 'Paid')),
    notes TEXT,
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: purchase_order_items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(12,2) NOT NULL CHECK (quantity_ordered > 0),
    unit_cost NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(14,2) NOT NULL CHECK (total_cost >= 0),
    quantity_received NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (quantity_received >= 0),
    quantity_pending NUMERIC(12,2) NOT NULL CHECK (quantity_pending >= 0),
    expected_delivery_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: goods_received_notes (Batch goods arrivals / partial receiving)
CREATE TABLE IF NOT EXISTS public.goods_received_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_number VARCHAR(100) NOT NULL UNIQUE,
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    receiving_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_delivery_note_ref VARCHAR(150),
    total_received_value NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_received_value >= 0),
    received_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: goods_received_items
CREATE TABLE IF NOT EXISTS public.goods_received_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES public.goods_received_notes(id) ON DELETE CASCADE,
    purchase_order_item_id UUID NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE RESTRICT,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity_received NUMERIC(12,2) NOT NULL CHECK (quantity_received > 0),
    unit_cost NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(14,2) NOT NULL CHECK (total_cost >= 0),
    batch_number VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. INTER-STORE INVENTORY TRANSFERS
-- ==============================================================================

-- Table: store_transfers (Inter-branch and intra-branch store transfers)
CREATE TABLE IF NOT EXISTS public.store_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number VARCHAR(100) NOT NULL UNIQUE,
    source_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    destination_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    source_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    destination_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In_Transit', 'Received', 'Rejected', 'Cancelled')),
    authorized_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    dispatched_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    received_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    total_items_count INTEGER NOT NULL DEFAULT 0,
    total_transfer_value NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_transfer_value >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_diff_stores CHECK (source_store_id != destination_store_id)
);

-- Table: store_transfer_items
CREATE TABLE IF NOT EXISTS public.store_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.store_transfers(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity_dispatched NUMERIC(12,2) NOT NULL CHECK (quantity_dispatched > 0),
    quantity_received NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (quantity_received >= 0),
    unit_cost NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
    total_value NUMERIC(14,2) NOT NULL CHECK (total_value >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. ELIGIBILITY CONFIGURATION & STUDENT ISSUANCES
-- ==============================================================================

-- Table: store_eligibility_settings (Configurable 60-70% fee payment threshold)
CREATE TABLE IF NOT EXISTS public.store_eligibility_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    term_id UUID REFERENCES public.terms(id) ON DELETE CASCADE,
    setting_name VARCHAR(150) NOT NULL DEFAULT 'Book Issue Fee Threshold',
    required_payment_percentage NUMERIC(5,2) NOT NULL DEFAULT 65.00 CHECK (required_payment_percentage >= 0 AND required_payment_percentage <= 100),
    allow_partial_issue_on_stock_shortage BOOLEAN NOT NULL DEFAULT TRUE,
    require_prior_arrears_cleared BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: student_material_issuances (Books & stationery distribution records)
CREATE TABLE IF NOT EXISTS public.student_material_issuances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issuance_number VARCHAR(100) NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    quantity_required NUMERIC(12,2) NOT NULL DEFAULT 1.00 CHECK (quantity_required > 0),
    quantity_issued NUMERIC(12,2) NOT NULL CHECK (quantity_issued > 0),
    unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    total_cost NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_cost >= 0),
    issuance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issuance_type VARCHAR(50) NOT NULL DEFAULT 'Fee_Entitled' CHECK (issuance_type IN ('Fee_Entitled', 'Direct_Sale', 'Replacement', 'Complimentary')),
    status VARCHAR(50) NOT NULL DEFAULT 'Fully_Issued' CHECK (status IN ('Fully_Issued', 'Partially_Issued_Stock_Shortage', 'Returned', 'Cancelled')),
    fee_payment_percentage_at_issue NUMERIC(5,2),
    student_fee_charge_id UUID REFERENCES public.student_fee_charges(id) ON DELETE SET NULL,
    issued_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. STORE SALES (Uniforms, Stationery, Materials)
-- ==============================================================================

-- Table: store_sales (Separate store counter sales)
CREATE TABLE IF NOT EXISTS public.store_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_receipt_number VARCHAR(100) NOT NULL UNIQUE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    family_id UUID REFERENCES public.family_accounts(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50),
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    net_amount NUMERIC(14,2) NOT NULL CHECK (net_amount > 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'Bank_Transfer', 'POS', 'From_Fee_Payment', 'Other')),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL, -- Preserves link to lump-sum payment
    status VARCHAR(30) NOT NULL DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Refunded', 'Cancelled')),
    sold_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: store_sale_items
CREATE TABLE IF NOT EXISTS public.store_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_sale_id UUID NOT NULL REFERENCES public.store_sales(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. INVENTORY ADJUSTMENTS
-- ==============================================================================

-- Table: inventory_adjustments (Audited stock corrections)
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_number VARCHAR(100) NOT NULL UNIQUE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('Damaged', 'Lost', 'Found', 'Count_Correction', 'Expired', 'Other')),
    reason TEXT NOT NULL,
    total_adjustment_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    recorded_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Approved' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: inventory_adjustment_items
CREATE TABLE IF NOT EXISTS public.inventory_adjustment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id UUID NOT NULL REFERENCES public.inventory_adjustments(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    system_quantity NUMERIC(12,2) NOT NULL,
    physical_quantity NUMERIC(12,2) NOT NULL,
    variance_quantity NUMERIC(12,2) NOT NULL,
    unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    total_variance_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. INDEXES FOR PERFORMANCE & LOOKUPS
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_stores_branch ON public.stores(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON public.inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_books_item ON public.books(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_books_class_level ON public.books(class_level);

CREATE INDEX IF NOT EXISTS idx_book_req_branch_class ON public.branch_book_requirements(branch_id, class_id);
CREATE INDEX IF NOT EXISTS idx_book_req_book ON public.branch_book_requirements(book_id);

CREATE INDEX IF NOT EXISTS idx_store_balances_store ON public.store_inventory_balances(store_id);
CREATE INDEX IF NOT EXISTS idx_store_balances_item ON public.store_inventory_balances(inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_inv_transactions_item ON public.inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inv_transactions_store ON public.inventory_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_inv_transactions_date ON public.inventory_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_transactions_type ON public.inventory_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_branch ON public.purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_grn_po ON public.goods_received_notes(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_transfers_source ON public.store_transfers(source_store_id);
CREATE INDEX IF NOT EXISTS idx_transfers_dest ON public.store_transfers(destination_store_id);

CREATE INDEX IF NOT EXISTS idx_issuances_student ON public.student_material_issuances(student_id);
CREATE INDEX IF NOT EXISTS idx_issuances_branch ON public.student_material_issuances(branch_id);
CREATE INDEX IF NOT EXISTS idx_issuances_item ON public.student_material_issuances(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_issuances_date ON public.student_material_issuances(issuance_date DESC);

CREATE INDEX IF NOT EXISTS idx_store_sales_branch ON public.store_sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_store_sales_student ON public.store_sales(student_id);
CREATE INDEX IF NOT EXISTS idx_store_sales_date ON public.store_sales(sale_date DESC);

-- ==============================================================================
-- 10. TRIGGERS FOR UPDATED_AT TIMESTAMP REFRESH
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stores_updated_at') THEN
    CREATE TRIGGER trg_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_publishers_updated_at') THEN
    CREATE TRIGGER trg_publishers_updated_at BEFORE UPDATE ON public.publishers FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_suppliers_updated_at') THEN
    CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inventory_items_updated_at') THEN
    CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_books_updated_at') THEN
    CREATE TRIGGER trg_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_branch_book_req_updated_at') THEN
    CREATE TRIGGER trg_branch_book_req_updated_at BEFORE UPDATE ON public.branch_book_requirements FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_store_balances_updated_at') THEN
    CREATE TRIGGER trg_store_balances_updated_at BEFORE UPDATE ON public.store_inventory_balances FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_purchase_orders_updated_at') THEN
    CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_po_items_updated_at') THEN
    CREATE TRIGGER trg_po_items_updated_at BEFORE UPDATE ON public.purchase_order_items FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_store_transfers_updated_at') THEN
    CREATE TRIGGER trg_store_transfers_updated_at BEFORE UPDATE ON public.store_transfers FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_store_eligibility_updated_at') THEN
    CREATE TRIGGER trg_store_eligibility_updated_at BEFORE UPDATE ON public.store_eligibility_settings FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_issuances_updated_at') THEN
    CREATE TRIGGER trg_student_issuances_updated_at BEFORE UPDATE ON public.student_material_issuances FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_store_sales_updated_at') THEN
    CREATE TRIGGER trg_store_sales_updated_at BEFORE UPDATE ON public.store_sales FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all Phase 3 inventory tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_book_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_received_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_received_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_eligibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_material_issuances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustment_items ENABLE ROW LEVEL SECURITY;

-- 1. Read-only global catalogue tables (authenticated staff)
CREATE POLICY "Allow authenticated read for publishers" ON public.publishers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for inventory_items" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for books catalogue" ON public.books FOR SELECT TO authenticated USING (true);

-- 2. Branch-scoped read access for authenticated staff
CREATE POLICY "Branch-scoped read access for stores" ON public.stores FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for branch_book_requirements" ON public.branch_book_requirements FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for inventory_transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for goods_received_notes" ON public.goods_received_notes FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for store_transfers" ON public.store_transfers FOR SELECT TO authenticated USING (public.has_branch_access(source_branch_id) OR public.has_branch_access(destination_branch_id));
CREATE POLICY "Branch-scoped read access for student_material_issuances" ON public.student_material_issuances FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for store_sales" ON public.store_sales FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));
CREATE POLICY "Branch-scoped read access for inventory_adjustments" ON public.inventory_adjustments FOR SELECT TO authenticated USING (public.has_branch_access(branch_id));

-- 3. Super Admin full access on all inventory tables
CREATE POLICY "Super admin full access on stores" ON public.stores TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on publishers" ON public.publishers TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on suppliers" ON public.suppliers TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on inventory_items" ON public.inventory_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on books" ON public.books TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on branch_book_requirements" ON public.branch_book_requirements TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on store_inventory_balances" ON public.store_inventory_balances TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on inventory_transactions" ON public.inventory_transactions TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on purchase_orders" ON public.purchase_orders TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on purchase_order_items" ON public.purchase_order_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on goods_received_notes" ON public.goods_received_notes TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on goods_received_items" ON public.goods_received_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on store_transfers" ON public.store_transfers TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on store_transfer_items" ON public.store_transfer_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on store_eligibility_settings" ON public.store_eligibility_settings TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on student_material_issuances" ON public.student_material_issuances TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on store_sales" ON public.store_sales TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on store_sale_items" ON public.store_sale_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on inventory_adjustments" ON public.inventory_adjustments TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin full access on inventory_adjustment_items" ON public.inventory_adjustment_items TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
