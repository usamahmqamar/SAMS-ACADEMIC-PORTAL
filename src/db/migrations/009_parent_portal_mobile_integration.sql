-- ==============================================================================
-- SAMS SCHOOL ERP — PHASE 9: PARENT PORTAL, MOBILE WORKFLOW, RECEIPTS & INTEGRATION
-- Migration Version: 009_parent_portal_mobile_integration.sql
-- Target Database: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. PARENT SECURITY HELPERS
-- ==============================================================================

-- Function: get_parent_family_id (Resolves the family account ID for authenticated parent)
CREATE OR REPLACE FUNCTION public.get_parent_family_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT p.family_id 
        FROM public.parent_user_profiles p 
        WHERE p.auth_user_id = auth.uid() 
          AND p.portal_status = 'Active' 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: is_parent_user (Checks if current session is an active parent)
CREATE OR REPLACE FUNCTION public.is_parent_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.parent_user_profiles p 
        WHERE p.auth_user_id = auth.uid() 
          AND p.portal_status = 'Active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 2. PARENT USER PROFILES & PORTAL ACCESS CONTROL
-- ==============================================================================

-- Table: parent_user_profiles (Secure auth linkage between Supabase Auth and Family Accounts)
CREATE TABLE IF NOT EXISTS public.parent_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE, -- Links to Supabase auth.users without duplicating passwords
    guardian_id UUID NOT NULL REFERENCES public.parents_guardians(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.family_accounts(id) ON DELETE CASCADE,
    primary_contact VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    whatsapp VARCHAR(50),
    preferred_language VARCHAR(50) NOT NULL DEFAULT 'English',
    notification_preference VARCHAR(50) NOT NULL DEFAULT 'In_App' CHECK (notification_preference IN ('In_App', 'WhatsApp', 'Email', 'SMS', 'All')),
    portal_status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (portal_status IN ('Pending', 'Active', 'Suspended', 'Disabled')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: portal_access_restriction_rules (Configurable thresholds for Report Card & Module Access)
CREATE TABLE IF NOT EXISTS public.portal_access_restriction_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE, -- NULL for global default rule
    rule_name VARCHAR(150) NOT NULL,
    report_card_min_payment_percentage NUMERIC(5,2) NOT NULL DEFAULT 80.00 CHECK (report_card_min_payment_percentage >= 0 AND report_card_min_payment_percentage <= 100),
    grace_period_days INTEGER NOT NULL DEFAULT 0 CHECK (grace_period_days >= 0),
    restrict_report_cards BOOLEAN NOT NULL DEFAULT TRUE,
    restrict_exam_dockets BOOLEAN NOT NULL DEFAULT FALSE,
    restrict_store_credit BOOLEAN NOT NULL DEFAULT TRUE,
    allow_payment_portal_access BOOLEAN NOT NULL DEFAULT TRUE,
    allow_receipt_download BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. MOBILE CASHIER SESSIONS & RECONCILIATION
-- ==============================================================================

-- Table: cashier_collection_sessions (Mobile/counter cash collection tracking & daily closeout)
CREATE TABLE IF NOT EXISTS public.cashier_collection_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(100) NOT NULL UNIQUE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    cashier_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    cashier_user_id UUID NOT NULL REFERENCES public.system_user_profiles(id) ON DELETE RESTRICT,
    session_status VARCHAR(30) NOT NULL DEFAULT 'Open' CHECK (session_status IN ('Open', 'Closed', 'Reconciled', 'Disputed')),
    opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (opening_balance >= 0),
    expected_cash NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (expected_cash >= 0),
    expected_pos NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (expected_pos >= 0),
    expected_transfer NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (expected_transfer >= 0),
    expected_total NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (expected_total >= 0),
    actual_cash_counted NUMERIC(14,2) CHECK (actual_cash_counted >= 0),
    actual_pos_counted NUMERIC(14,2) CHECK (actual_pos_counted >= 0),
    actual_transfer_counted NUMERIC(14,2) CHECK (actual_transfer_counted >= 0),
    actual_total_counted NUMERIC(14,2) CHECK (actual_total_counted >= 0),
    variance_amount NUMERIC(14,2) DEFAULT 0.00,
    variance_explanation TEXT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    reconciled_at TIMESTAMPTZ,
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. DIGITAL RECEIPT EXTENSIONS & VERIFICATION
-- ==============================================================================

-- Table: digital_receipt_extensions (Extends Phase 2 receipts with verification codes & share tracking)
CREATE TABLE IF NOT EXISTS public.digital_receipt_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE UNIQUE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    qr_verification_code VARCHAR(100) NOT NULL UNIQUE,
    pdf_storage_path TEXT,
    receipt_status VARCHAR(30) NOT NULL DEFAULT 'Issued' CHECK (receipt_status IN ('Draft', 'Issued', 'Reprinted', 'Cancelled', 'Refunded')),
    allocation_summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_shared_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_sent_at TIMESTAMPTZ,
    email_sent_at TIMESTAMPTZ,
    verified_count INTEGER NOT NULL DEFAULT 0,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. PAYMENT REVERSALS, CORRECTIONS & AUDIT
-- ==============================================================================

-- Table: payment_reversal_records (Audit trail for payment cancellations & corrections)
CREATE TABLE IF NOT EXISTS public.payment_reversal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    reversal_type VARCHAR(30) NOT NULL CHECK (reversal_type IN ('Correction', 'Reversal', 'Refund', 'Cancellation')),
    reversal_amount NUMERIC(14,2) NOT NULL CHECK (reversal_amount > 0),
    reason TEXT NOT NULL,
    reversal_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (reversal_status IN ('Pending', 'Approved', 'Rejected', 'Processed')),
    requested_by_user_id UUID NOT NULL REFERENCES public.system_user_profiles(id) ON DELETE RESTRICT,
    approved_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. PARENT NOTIFICATIONS & COMMUNICATIONS
-- ==============================================================================

-- Table: parent_portal_notifications (In-app, WhatsApp and Email notification queue/history)
CREATE TABLE IF NOT EXISTS public.parent_portal_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.family_accounts(id) ON DELETE CASCADE,
    parent_profile_id UUID REFERENCES public.parent_user_profiles(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'Payment_Confirmation', 'Receipt_Issued', 'Fee_Reminder', 'Fee_Overdue', 
        'New_Term_Fee', 'Report_Card_Available', 'Announcement', 'Calendar_Event', 'Attendance_Alert'
    )),
    title VARCHAR(200) NOT NULL,
    message_content TEXT NOT NULL,
    payload_data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    channel_preference VARCHAR(30) NOT NULL DEFAULT 'In_App' CHECK (channel_preference IN ('In_App', 'WhatsApp', 'Email', 'SMS')),
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'Sent', 'Delivered', 'Failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. PARENT SUPPORT & ENQUIRIES
-- ==============================================================================

-- Table: parent_support_tickets (Parent queries regarding fees, academics and receipts)
CREATE TABLE IF NOT EXISTS public.parent_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    family_id UUID NOT NULL REFERENCES public.family_accounts(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES public.parents_guardians(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Fee_Query', 'Payment_Issue', 'Receipt_Issue', 'Academic_Query', 'General_Enquiry')),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In_Progress', 'Resolved', 'Closed')),
    priority VARCHAR(30) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    assigned_to_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: parent_support_ticket_messages (Threaded conversation messages between parent & staff)
CREATE TABLE IF NOT EXISTS public.parent_support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.parent_support_tickets(id) ON DELETE CASCADE,
    sender_auth_user_id UUID NOT NULL,
    is_staff_reply BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. PORTAL ANNOUNCEMENTS
-- ==============================================================================

-- Table: portal_announcements (Targeted school announcements for the parent dashboard)
CREATE TABLE IF NOT EXISTS public.portal_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'All_Parents' CHECK (target_audience IN ('All_Parents', 'Branch_Parents', 'Section_Parents', 'Class_Parents', 'Specific_Family')),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    target_family_id UUID REFERENCES public.family_accounts(id) ON DELETE CASCADE,
    priority VARCHAR(30) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Important', 'Urgent')),
    status VARCHAR(30) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_by_user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. MOBILE DEVICE & TRANSACTION AUDIT LOGS
-- ==============================================================================

-- Table: mobile_device_audit_logs (Audit tracking for transactions originating on mobile apps)
CREATE TABLE IF NOT EXISTS public.mobile_device_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.system_user_profiles(id) ON DELETE SET NULL,
    parent_profile_id UUID REFERENCES public.parent_user_profiles(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN (
        'Mobile_Payment_Collected', 'Receipt_Generated', 'Attendance_Marked', 
        'Lesson_Evidence_Uploaded', 'Results_Entered', 'Report_Card_Viewed', 
        'Parent_Login', 'Receipt_Downloaded', 'Support_Ticket_Created'
    )),
    client_app_version VARCHAR(50) DEFAULT '1.0.0',
    ip_address INET,
    session_token_ref VARCHAR(150),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. INDEXES FOR PERFORMANCE & FAST LOOKUPS
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_parent_prof_auth ON public.parent_user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_prof_family ON public.parent_user_profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_parent_prof_guardian ON public.parent_user_profiles(guardian_id);

CREATE INDEX IF NOT EXISTS idx_cashier_sess_branch ON public.cashier_collection_sessions(branch_id);
CREATE INDEX IF NOT EXISTS idx_cashier_sess_status ON public.cashier_collection_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_cashier_sess_user ON public.cashier_collection_sessions(cashier_user_id);

CREATE INDEX IF NOT EXISTS idx_dig_receipt_qr ON public.digital_receipt_extensions(qr_verification_code);
CREATE INDEX IF NOT EXISTS idx_dig_receipt_receipt ON public.digital_receipt_extensions(receipt_id);
CREATE INDEX IF NOT EXISTS idx_dig_receipt_branch ON public.digital_receipt_extensions(branch_id);

CREATE INDEX IF NOT EXISTS idx_reversals_payment ON public.payment_reversal_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_reversals_branch ON public.payment_reversal_records(branch_id);

CREATE INDEX IF NOT EXISTS idx_parent_notif_family ON public.parent_portal_notifications(family_id);
CREATE INDEX IF NOT EXISTS idx_parent_notif_student ON public.parent_portal_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notif_read ON public.parent_portal_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_tickets_family ON public.parent_support_tickets(family_id);
CREATE INDEX IF NOT EXISTS idx_tickets_branch ON public.parent_support_tickets(branch_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.parent_support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_announcements_audience ON public.portal_announcements(target_audience, status);
CREATE INDEX IF NOT EXISTS idx_announcements_branch ON public.portal_announcements(branch_id);

CREATE INDEX IF NOT EXISTS idx_mobile_audit_user ON public.mobile_device_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_audit_created ON public.mobile_device_audit_logs(created_at DESC);

-- ==============================================================================
-- 11. TRIGGERS FOR AUTOMATIC TIMESTAMP REFRESH
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_parent_prof_updated_at') THEN
    CREATE TRIGGER trg_parent_prof_updated_at BEFORE UPDATE ON public.parent_user_profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_portal_rules_updated_at') THEN
    CREATE TRIGGER trg_portal_rules_updated_at BEFORE UPDATE ON public.portal_access_restriction_rules FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cashier_sess_updated_at') THEN
    CREATE TRIGGER trg_cashier_sess_updated_at BEFORE UPDATE ON public.cashier_collection_sessions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_dig_receipt_updated_at') THEN
    CREATE TRIGGER trg_dig_receipt_updated_at BEFORE UPDATE ON public.digital_receipt_extensions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reversals_updated_at') THEN
    CREATE TRIGGER trg_reversals_updated_at BEFORE UPDATE ON public.payment_reversal_records FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tickets_updated_at') THEN
    CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.parent_support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_announcements_updated_at') THEN
    CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.portal_announcements FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END $$;

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all Phase 9 tables
ALTER TABLE public.parent_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_access_restriction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_collection_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_receipt_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reversal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_portal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_device_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. parent_user_profiles RLS
CREATE POLICY "Parents can read their own profile" ON public.parent_user_profiles FOR SELECT TO authenticated USING (
    auth_user_id = auth.uid() 
    OR public.is_super_admin() 
    OR (family_id IN (SELECT s.family_id FROM public.students s WHERE public.has_branch_access(s.branch_id)))
);

CREATE POLICY "Parents can update their own preferences" ON public.parent_user_profiles FOR UPDATE TO authenticated USING (
    auth_user_id = auth.uid() OR public.is_super_admin()
) WITH CHECK (
    auth_user_id = auth.uid() OR public.is_super_admin()
);

CREATE POLICY "Super admin can insert parent_user_profiles" ON public.parent_user_profiles FOR INSERT TO authenticated WITH CHECK (
    public.is_super_admin() OR (family_id IN (SELECT s.family_id FROM public.students s WHERE public.has_branch_access(s.branch_id)))
);

-- 2. portal_access_restriction_rules RLS
CREATE POLICY "Branch-scoped read access for portal_access_restriction_rules" ON public.portal_access_restriction_rules FOR SELECT TO authenticated USING (
    branch_id IS NULL OR public.has_branch_access(branch_id) OR public.is_parent_user() OR public.is_super_admin()
);

CREATE POLICY "Super admin full management on portal_access_restriction_rules" ON public.portal_access_restriction_rules TO authenticated USING (
    public.is_super_admin()
) WITH CHECK (
    public.is_super_admin()
);

-- 3. cashier_collection_sessions RLS
CREATE POLICY "Cashiers and branch staff read cashier_collection_sessions" ON public.cashier_collection_sessions FOR SELECT TO authenticated USING (
    cashier_user_id IN (SELECT id FROM public.system_user_profiles WHERE auth_user_id = auth.uid()) 
    OR public.has_branch_access(branch_id) 
    OR public.is_super_admin()
);

CREATE POLICY "Cashiers can create sessions" ON public.cashier_collection_sessions FOR INSERT TO authenticated WITH CHECK (
    cashier_user_id IN (SELECT id FROM public.system_user_profiles WHERE auth_user_id = auth.uid()) 
    OR public.is_super_admin()
);

CREATE POLICY "Cashiers and branch staff update cashier_collection_sessions" ON public.cashier_collection_sessions FOR UPDATE TO authenticated USING (
    cashier_user_id IN (SELECT id FROM public.system_user_profiles WHERE auth_user_id = auth.uid()) 
    OR public.has_branch_access(branch_id) 
    OR public.is_super_admin()
) WITH CHECK (
    cashier_user_id IN (SELECT id FROM public.system_user_profiles WHERE auth_user_id = auth.uid()) 
    OR public.has_branch_access(branch_id) 
    OR public.is_super_admin()
);

-- 4. digital_receipt_extensions RLS
CREATE POLICY "Read access for digital_receipt_extensions" ON public.digital_receipt_extensions FOR SELECT TO authenticated USING (
    public.has_branch_access(branch_id) 
    OR receipt_id IN (SELECT r.id FROM public.receipts r WHERE r.family_id = public.get_parent_family_id()) 
    OR public.is_super_admin()
);

CREATE POLICY "Staff insert digital_receipt_extensions" ON public.digital_receipt_extensions FOR INSERT TO authenticated WITH CHECK (
    public.has_branch_access(branch_id) OR public.is_super_admin()
);

CREATE POLICY "Staff update digital_receipt_extensions" ON public.digital_receipt_extensions FOR UPDATE TO authenticated USING (
    public.has_branch_access(branch_id) OR public.is_super_admin()
) WITH CHECK (
    public.has_branch_access(branch_id) OR public.is_super_admin()
);

-- 5. payment_reversal_records RLS
CREATE POLICY "Branch-scoped read access for payment_reversal_records" ON public.payment_reversal_records FOR SELECT TO authenticated USING (
    public.has_branch_access(branch_id) OR public.is_super_admin()
);

CREATE POLICY "Authorized staff request payment reversals" ON public.payment_reversal_records FOR INSERT TO authenticated WITH CHECK (
    (requested_by_user_id IN (SELECT id FROM public.system_user_profiles WHERE auth_user_id = auth.uid()) AND public.has_branch_access(branch_id))
    OR public.is_super_admin()
);

CREATE POLICY "Approvers update payment reversals" ON public.payment_reversal_records FOR UPDATE TO authenticated USING (
    public.has_branch_access(branch_id) OR public.is_super_admin()
) WITH CHECK (
    public.has_branch_access(branch_id) OR public.is_super_admin()
);

-- 6. parent_portal_notifications RLS
CREATE POLICY "Family-scoped read access for parent_portal_notifications" ON public.parent_portal_notifications FOR SELECT TO authenticated USING (
    family_id = public.get_parent_family_id() 
    OR public.has_branch_access(branch_id) 
    OR public.is_super_admin()
);

CREATE POLICY "Parents can mark notifications as read" ON public.parent_portal_notifications FOR UPDATE TO authenticated USING (
    family_id = public.get_parent_family_id() OR public.is_super_admin()
) WITH CHECK (
    family_id = public.get_parent_family_id() OR public.is_super_admin()
);

CREATE POLICY "Staff insert parent_portal_notifications" ON public.parent_portal_notifications FOR INSERT TO authenticated WITH CHECK (
    public.has_branch_access(branch_id) OR public.is_super_admin()
);

-- 7. parent_support_tickets RLS
CREATE POLICY "Family and staff read access for parent_support_tickets" ON public.parent_support_tickets FOR SELECT TO authenticated USING (
    family_id = public.get_parent_family_id() 
    OR public.has_branch_access(branch_id) 
    OR public.is_super_admin()
);

CREATE POLICY "Parents can create support tickets" ON public.parent_support_tickets FOR INSERT TO authenticated WITH CHECK (
    family_id = public.get_parent_family_id() OR public.is_super_admin()
);

CREATE POLICY "Parents and staff update support tickets" ON public.parent_support_tickets FOR UPDATE TO authenticated USING (
    family_id = public.get_parent_family_id() 
    OR public.has_branch_access(branch_id) 
    OR public.is_super_admin()
) WITH CHECK (
    family_id = public.get_parent_family_id() 
    OR public.has_branch_access(branch_id) 
    OR public.is_super_admin()
);

-- 8. parent_support_ticket_messages RLS
CREATE POLICY "Read access for parent_support_ticket_messages" ON public.parent_support_ticket_messages FOR SELECT TO authenticated USING (
    ticket_id IN (
        SELECT t.id FROM public.parent_support_tickets t 
        WHERE t.family_id = public.get_parent_family_id() 
           OR public.has_branch_access(t.branch_id) 
           OR public.is_super_admin()
    )
);

CREATE POLICY "Create messages on accessible support tickets" ON public.parent_support_ticket_messages FOR INSERT TO authenticated WITH CHECK (
    ticket_id IN (
        SELECT t.id FROM public.parent_support_tickets t 
        WHERE t.family_id = public.get_parent_family_id() 
           OR public.has_branch_access(t.branch_id) 
           OR public.is_super_admin()
    )
);

-- 9. portal_announcements RLS
CREATE POLICY "Read access for portal_announcements" ON public.portal_announcements FOR SELECT TO authenticated USING (
    status = 'Published' AND (
        target_audience = 'All_Parents'
        OR (branch_id IS NOT NULL AND public.has_branch_access(branch_id))
        OR (target_family_id IS NOT NULL AND target_family_id = public.get_parent_family_id())
        OR public.is_super_admin()
    )
);

CREATE POLICY "Staff full management on portal_announcements" ON public.portal_announcements TO authenticated USING (
    (branch_id IS NOT NULL AND public.has_branch_access(branch_id)) OR public.is_super_admin()
) WITH CHECK (
    (branch_id IS NOT NULL AND public.has_branch_access(branch_id)) OR public.is_super_admin()
);

-- 10. mobile_device_audit_logs RLS
CREATE POLICY "Read access for mobile_device_audit_logs" ON public.mobile_device_audit_logs FOR SELECT TO authenticated USING (
    user_id IN (SELECT id FROM public.system_user_profiles WHERE auth_user_id = auth.uid()) 
    OR (parent_profile_id IN (SELECT id FROM public.parent_user_profiles WHERE auth_user_id = auth.uid()))
    OR (branch_id IS NOT NULL AND public.has_branch_access(branch_id)) 
    OR public.is_super_admin()
);

CREATE POLICY "Insert access for mobile_device_audit_logs" ON public.mobile_device_audit_logs FOR INSERT TO authenticated WITH CHECK (
    user_id IN (SELECT id FROM public.system_user_profiles WHERE auth_user_id = auth.uid()) 
    OR parent_profile_id IN (SELECT id FROM public.parent_user_profiles WHERE auth_user_id = auth.uid()) 
    OR public.is_super_admin()
);
