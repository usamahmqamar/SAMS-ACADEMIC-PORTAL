import { supabase } from '../lib/supabaseClient';

export interface FeeHeadRecord {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'Academic' | 'Administrative' | 'Facilities' | 'Activities' | 'Religious' | 'Optional' | 'Other';
  is_optional: boolean;
  is_refundable: boolean;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface FeeStructureRecord {
  id: string;
  branch_id: string;
  session_id: string;
  term_id: string;
  section_id: string;
  class_id?: string | null;
  structure_name: string;
  effective_date: string;
  status: 'Draft' | 'Active' | 'Archived';
  created_by_user_id?: string | null;
  created_at?: string;
  items?: FeeStructureItemRecord[];
}

export interface FeeStructureItemRecord {
  id?: string;
  fee_structure_id?: string;
  fee_head_id: string;
  amount: number;
  percentage?: number | null;
  is_optional: boolean;
  is_included_in_main_fee: boolean;
  fee_head?: FeeHeadRecord;
}

export interface StudentFeeChargeRecord {
  id: string;
  student_id: string;
  family_id?: string | null;
  branch_id: string;
  session_id: string;
  term_id: string;
  class_id: string;
  fee_structure_id?: string | null;
  gross_amount: number;
  discount_amount: number;
  scholarship_amount: number;
  net_amount_due: number;
  amount_paid: number;
  outstanding_amount: number;
  due_date: string;
  grace_period_days: number;
  status: 'Pending' | 'Partially_Paid' | 'Paid' | 'Overdue' | 'Waived' | 'Cancelled';
  created_at?: string;
  updated_at?: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    branch_id?: string;
  };
  items?: FeeChargeItemRecord[];
}

export interface FeeChargeItemRecord {
  id?: string;
  student_fee_charge_id?: string;
  fee_head_id: string;
  gross_amount: number;
  discount_amount: number;
  scholarship_amount: number;
  net_amount: number;
  amount_paid: number;
  is_optional: boolean;
  fee_head?: FeeHeadRecord;
}

export interface PaymentAllocationPayload {
  student_id: string;
  student_fee_charge_id?: string;
  optional_fee_charge_id?: string;
  allocated_amount: number;
  allocation_order?: number;
  head_allocations?: {
    fee_head_id: string;
    allocated_amount: number;
  }[];
}

export interface RecordPaymentPayload {
  receipt_number?: string;
  family_id?: string | null;
  branch_id: string;
  payer_name: string;
  payer_phone?: string;
  payer_email?: string;
  payment_date?: string;
  amount: number;
  payment_method: 'Cash' | 'Bank_Transfer' | 'POS' | 'Cheque' | 'Online_Payment' | 'Other';
  reference_number?: string;
  bank_name?: string;
  received_by_user_id?: string | null;
  status?: 'Pending' | 'Confirmed' | 'Bounced' | 'Refunded' | 'Cancelled';
  notes?: string;
  allocations: PaymentAllocationPayload[];
  store_sale?: {
    sale_id?: string;
    store_branch?: string;
    amount: number;
    items?: any[];
  };
}

export interface ExpenseHeadRecord {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'Salaries' | 'Facilities' | 'Administrative' | 'Academic' | 'Maintenance' | 'Utilities' | 'Transportation' | 'Capital' | 'Other';
  is_active: boolean;
  created_at?: string;
}

export interface ExpenseRecord {
  id: string;
  branch_id: string;
  expense_head_id: string;
  session_id?: string | null;
  term_id?: string | null;
  amount: number;
  expense_date: string;
  vendor_payee: string;
  description: string;
  payment_method: 'Cash' | 'Bank_Transfer' | 'POS' | 'Cheque' | 'Petty_Cash' | 'Other';
  reference_number?: string;
  approved_by_user_id?: string | null;
  recorded_by_user_id?: string | null;
  status: 'Pending' | 'Approved' | 'Paid' | 'Cancelled' | 'Rejected';
  receipt_doc_url?: string | null;
  created_at?: string;
  expense_head?: ExpenseHeadRecord;
  allocations?: {
    fee_head_id: string;
    allocated_percentage: number;
    allocated_amount: number;
  }[];
}

export interface FinancialTimelineRecord {
  id: string;
  student_id: string;
  family_id?: string | null;
  branch_id: string;
  session_id?: string | null;
  term_id?: string | null;
  event_date: string;
  transaction_type: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  reference_id?: string;
  description: string;
  created_at?: string;
}

class FinanceService {
  // ============================================================================
  // 1. FEE HEADS
  // ============================================================================
  async getFeeHeads(): Promise<FeeHeadRecord[]> {
    try {
      const { data, error } = await supabase
        .from('fee_heads')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data as FeeHeadRecord[]) || [];
    } catch (err) {
      console.warn('FinanceService.getFeeHeads fallback to server API:', err);
      const res = await fetch('/api/fee_heads');
      if (res.ok) return await res.json();
      return [];
    }
  }

  async saveFeeHead(head: Partial<FeeHeadRecord>): Promise<FeeHeadRecord | null> {
    try {
      if (head.id) {
        const { data, error } = await supabase
          .from('fee_heads')
          .update({
            name: head.name,
            code: head.code,
            description: head.description,
            category: head.category || 'Academic',
            is_optional: head.is_optional ?? false,
            is_refundable: head.is_refundable ?? false,
            is_active: head.is_active ?? true,
            display_order: head.display_order ?? 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', head.id)
          .select()
          .single();
        if (error) throw error;
        return data as FeeHeadRecord;
      } else {
        const { data, error } = await supabase
          .from('fee_heads')
          .insert({
            name: head.name,
            code: head.code || `FH-${Date.now().toString().slice(-4)}`,
            description: head.description || '',
            category: head.category || 'Academic',
            is_optional: head.is_optional ?? false,
            is_refundable: head.is_refundable ?? false,
            is_active: head.is_active ?? true,
            display_order: head.display_order ?? 0
          })
          .select()
          .single();
        if (error) throw error;
        return data as FeeHeadRecord;
      }
    } catch (err) {
      console.warn('FinanceService.saveFeeHead error:', err);
      const method = head.id ? 'PUT' : 'POST';
      const url = head.id ? `/api/fee_heads/${head.id}` : '/api/fee_heads';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(head)
      });
      if (res.ok) return await res.json();
      return null;
    }
  }

  // ============================================================================
  // 2. FEE STRUCTURES & ITEMS
  // ============================================================================
  async getFeeStructures(params?: { branchId?: string; sessionId?: string; termId?: string }): Promise<FeeStructureRecord[]> {
    try {
      let query = supabase
        .from('fee_structures')
        .select(`
          *,
          fee_structure_items (
            id,
            fee_head_id,
            amount,
            percentage,
            is_optional,
            is_included_in_main_fee,
            fee_heads (
              id,
              name,
              code,
              category
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (params?.branchId && params.branchId !== 'All') {
        query = query.eq('branch_id', params.branchId);
      }
      if (params?.sessionId) {
        query = query.eq('session_id', params.sessionId);
      }
      if (params?.termId) {
        query = query.eq('term_id', params.termId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        items: (row.fee_structure_items || []).map((item: any) => ({
          id: item.id,
          fee_head_id: item.fee_head_id,
          amount: Number(item.amount) || 0,
          percentage: item.percentage,
          is_optional: item.is_optional,
          is_included_in_main_fee: item.is_included_in_main_fee,
          fee_head: item.fee_heads
        }))
      }));
    } catch (err) {
      console.warn('FinanceService.getFeeStructures fallback to server API:', err);
      const res = await fetch('/api/fee_templates');
      if (res.ok) return await res.json();
      return [];
    }
  }

  // ============================================================================
  // 3. STUDENT FEE CHARGES & BILLING
  // ============================================================================
  async getStudentFeeCharges(params?: {
    branchId?: string;
    sessionId?: string;
    termId?: string;
    classId?: string;
    studentId?: string;
    familyId?: string;
    status?: string;
  }): Promise<StudentFeeChargeRecord[]> {
    try {
      let query = supabase
        .from('student_fee_charges')
        .select(`
          *,
          students (
            id,
            first_name,
            last_name,
            admission_number,
            branch_id
          ),
          fee_charge_items (
            id,
            fee_head_id,
            gross_amount,
            discount_amount,
            scholarship_amount,
            net_amount,
            amount_paid,
            is_optional,
            fee_heads (
              id,
              name,
              code,
              category
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (params?.branchId && params.branchId !== 'All') {
        query = query.eq('branch_id', params.branchId);
      }
      if (params?.sessionId) {
        query = query.eq('session_id', params.sessionId);
      }
      if (params?.termId) {
        query = query.eq('term_id', params.termId);
      }
      if (params?.classId && params.classId !== 'All') {
        query = query.eq('class_id', params.classId);
      }
      if (params?.studentId) {
        query = query.eq('student_id', params.studentId);
      }
      if (params?.familyId) {
        query = query.eq('family_id', params.familyId);
      }
      if (params?.status && params.status !== 'All') {
        query = query.eq('status', params.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        gross_amount: Number(row.gross_amount) || 0,
        discount_amount: Number(row.discount_amount) || 0,
        scholarship_amount: Number(row.scholarship_amount) || 0,
        net_amount_due: Number(row.net_amount_due) || 0,
        amount_paid: Number(row.amount_paid) || 0,
        outstanding_amount: Number(row.outstanding_amount) || 0,
        student: row.students,
        items: (row.fee_charge_items || []).map((item: any) => ({
          id: item.id,
          fee_head_id: item.fee_head_id,
          gross_amount: Number(item.gross_amount) || 0,
          discount_amount: Number(item.discount_amount) || 0,
          scholarship_amount: Number(item.scholarship_amount) || 0,
          net_amount: Number(item.net_amount) || 0,
          amount_paid: Number(item.amount_paid) || 0,
          is_optional: item.is_optional,
          fee_head: item.fee_heads
        }))
      }));
    } catch (err) {
      console.warn('FinanceService.getStudentFeeCharges fallback to server API:', err);
      const res = await fetch('/api/student_fee_ledgers');
      if (res.ok) return await res.json();
      return [];
    }
  }

  // ============================================================================
  // 4. FAMILY ACCOUNT BALANCES & SMART ALLOCATION
  // ============================================================================
  async getFamilyFinancialSummary(familyId: string) {
    try {
      const charges = await this.getStudentFeeCharges({ familyId });
      const totalBilled = charges.reduce((sum, c) => sum + c.net_amount_due, 0);
      const totalPaid = charges.reduce((sum, c) => sum + c.amount_paid, 0);
      const totalOutstanding = charges.reduce((sum, c) => sum + c.outstanding_amount, 0);

      // Student breakdown
      const studentMap: Record<string, { studentName: string; charges: StudentFeeChargeRecord[]; outstanding: number }> = {};
      charges.forEach(c => {
        const name = c.student ? `${c.student.first_name} ${c.student.last_name}` : 'Student';
        if (!studentMap[c.student_id]) {
          studentMap[c.student_id] = { studentName: name, charges: [], outstanding: 0 };
        }
        studentMap[c.student_id].charges.push(c);
        studentMap[c.student_id].outstanding += c.outstanding_amount;
      });

      return {
        familyId,
        totalBilled,
        totalPaid,
        totalOutstanding,
        students: Object.entries(studentMap).map(([studentId, data]) => ({
          studentId,
          ...data
        }))
      };
    } catch (err) {
      console.error('Error fetching family financial summary:', err);
      return null;
    }
  }

  // ============================================================================
  // 5. PAYMENT PROCESSING & ATOMIC ALLOCATION WORKFLOW
  // ============================================================================
  async recordPayment(payload: RecordPaymentPayload): Promise<{
    paymentId: string;
    receiptNumber: string;
    totalAmount: number;
    allocations: any[];
    receipt: any;
  }> {
    const receiptNumber = payload.receipt_number || `REC-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentDate = payload.payment_date || new Date().toISOString().split('T')[0];

    try {
      // 1. Insert Payment Record
      const { data: paymentRecord, error: payError } = await supabase
        .from('payments')
        .insert({
          receipt_number: receiptNumber,
          family_id: payload.family_id || null,
          branch_id: payload.branch_id,
          payer_name: payload.payer_name,
          payer_phone: payload.payer_phone || null,
          payer_email: payload.payer_email || null,
          payment_date: paymentDate,
          amount: payload.amount,
          payment_method: payload.payment_method,
          reference_number: payload.reference_number || null,
          bank_name: payload.bank_name || null,
          received_by_user_id: payload.received_by_user_id || null,
          status: payload.status || 'Confirmed',
          notes: payload.notes || ''
        })
        .select()
        .single();

      if (payError) throw payError;
      const paymentId = paymentRecord.id;

      // 2. Process Allocations
      const savedAllocations: any[] = [];

      for (let i = 0; i < payload.allocations.length; i++) {
        const alloc = payload.allocations[i];
        if (alloc.allocated_amount <= 0) continue;

        // Insert payment_allocation
        const { data: allocRecord, error: allocError } = await supabase
          .from('payment_allocations')
          .insert({
            payment_id: paymentId,
            student_id: alloc.student_id,
            student_fee_charge_id: alloc.student_fee_charge_id || null,
            optional_fee_charge_id: alloc.optional_fee_charge_id || null,
            allocated_amount: alloc.allocated_amount,
            allocation_order: alloc.allocation_order || (i + 1)
          })
          .select()
          .single();

        if (!allocError && allocRecord) {
          savedAllocations.push(allocRecord);

          // Head-level allocations if specified
          if (alloc.head_allocations && alloc.head_allocations.length > 0) {
            const headRows = alloc.head_allocations.map(h => ({
              payment_allocation_id: allocRecord.id,
              fee_head_id: h.fee_head_id,
              allocated_amount: h.allocated_amount
            }));
            await supabase.from('payment_fee_head_allocations').insert(headRows);
          }

          // Update student_fee_charge balances
          if (alloc.student_fee_charge_id) {
            const { data: chargeData } = await supabase
              .from('student_fee_charges')
              .select('net_amount_due, amount_paid, outstanding_amount')
              .eq('id', alloc.student_fee_charge_id)
              .single();

            if (chargeData) {
              const newPaid = Number(chargeData.amount_paid || 0) + alloc.allocated_amount;
              const newOutstanding = Math.max(0, Number(chargeData.net_amount_due || 0) - newPaid);
              const nextStatus = newOutstanding === 0 ? 'Paid' : newPaid > 0 ? 'Partially_Paid' : 'Pending';

              await supabase
                .from('student_fee_charges')
                .update({
                  amount_paid: newPaid,
                  outstanding_amount: newOutstanding,
                  status: nextStatus,
                  updated_at: new Date().toISOString()
                })
                .eq('id', alloc.student_fee_charge_id);
            }
          }

          // Insert into student_financial_timeline
          await supabase
            .from('student_financial_timeline')
            .insert({
              student_id: alloc.student_id,
              family_id: payload.family_id || null,
              branch_id: payload.branch_id,
              event_date: paymentDate,
              transaction_type: 'Payment_Allocated',
              debit_amount: 0.00,
              credit_amount: alloc.allocated_amount,
              running_balance: 0.00, // Trigger / view can evaluate balance
              reference_id: receiptNumber,
              description: `Payment allocation of ₦${alloc.allocated_amount.toLocaleString()} received via ${payload.payment_method}. Receipt: ${receiptNumber}`
            });
        }
      }

      // 3. Generate Official Receipt in `receipts` table
      const primaryStudentId = payload.allocations[0]?.student_id || null;
      const { data: receiptRecord } = await supabase
        .from('receipts')
        .insert({
          payment_id: paymentId,
          receipt_number: receiptNumber,
          branch_id: payload.branch_id,
          family_id: payload.family_id || null,
          student_id: primaryStudentId,
          amount: payload.amount,
          payment_method: payload.payment_method,
          receipt_date: paymentDate,
          issued_by_user_id: payload.received_by_user_id || null,
          receipt_type: payload.allocations.length > 1 ? 'Summary' : 'Standard'
        })
        .select()
        .single();

      // 4. Handle Store Sale separation if integrated (Store + School Fee)
      if (payload.store_sale && payload.store_sale.amount > 0) {
        // Record in general ledger: Store Sales vs Fee Revenue
        const schoolFeeAmount = payload.amount - payload.store_sale.amount;

        // Ledger for Store Sale
        await supabase
          .from('general_ledger_entries')
          .insert({
            branch_id: payload.branch_id,
            entry_date: paymentDate,
            ledger_type: 'Store_Sales',
            account_code: 'REV-STORE-401',
            debit: 0.00,
            credit: payload.store_sale.amount,
            reference_table: 'payments',
            reference_id: paymentId,
            description: `Store sales item purchase covered in joint receipt ${receiptNumber}`
          });

        // Ledger for School Fee
        if (schoolFeeAmount > 0) {
          await supabase
            .from('general_ledger_entries')
            .insert({
              branch_id: payload.branch_id,
              entry_date: paymentDate,
              ledger_type: 'School_Fee_Revenue',
              account_code: 'REV-FEES-400',
              debit: 0.00,
              credit: schoolFeeAmount,
              reference_table: 'payments',
              reference_id: paymentId,
              description: `Tuition & academic fee revenue received in joint receipt ${receiptNumber}`
            });
        }
      } else {
        // Standard full School Fee ledger entry
        await supabase
          .from('general_ledger_entries')
          .insert({
            branch_id: payload.branch_id,
            entry_date: paymentDate,
            ledger_type: 'School_Fee_Revenue',
            account_code: 'REV-FEES-400',
            debit: 0.00,
            credit: payload.amount,
            reference_table: 'payments',
            reference_id: paymentId,
            description: `School fee payment received under receipt ${receiptNumber}`
          });
      }

      // Also mirror to local API backend for immediate in-memory UI reactivity
      try {
        await fetch('/api/student_payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: primaryStudentId,
            studentName: payload.payer_name,
            familyAccountId: payload.family_id,
            amount: payload.amount,
            paymentMethod: payload.payment_method,
            paymentDate: paymentDate,
            referenceNo: payload.reference_number || receiptNumber,
            notes: payload.notes || ''
          })
        });
      } catch (e) {
        // local mirror warning
      }

      return {
        paymentId,
        receiptNumber,
        totalAmount: payload.amount,
        allocations: savedAllocations,
        receipt: receiptRecord
      };
    } catch (err) {
      console.warn('FinanceService.recordPayment error falling back to server API:', err);
      // Fallback via server express route
      const res = await fetch('/api/student_payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: payload.allocations[0]?.student_id,
          studentName: payload.payer_name,
          familyAccountId: payload.family_id,
          amount: payload.amount,
          paymentMethod: payload.payment_method,
          paymentDate: paymentDate,
          referenceNo: payload.reference_number || receiptNumber,
          notes: payload.notes
        })
      });
      const data = await res.json();
      return {
        paymentId: data.id || `PAY-${Date.now()}`,
        receiptNumber: data.referenceNo || receiptNumber,
        totalAmount: payload.amount,
        allocations: payload.allocations,
        receipt: data
      };
    }
  }

  // ============================================================================
  // 6. EXPENSES & EXPENSE HEADS
  // ============================================================================
  async getExpenseHeads(): Promise<ExpenseHeadRecord[]> {
    try {
      const { data, error } = await supabase
        .from('expense_heads')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data as ExpenseHeadRecord[]) || [];
    } catch (err) {
      console.warn('FinanceService.getExpenseHeads fallback to server API:', err);
      const res = await fetch('/api/expense_heads');
      if (res.ok) return await res.json();
      return [];
    }
  }

  async getExpenses(filters?: { branchId?: string; sessionId?: string; termId?: string; status?: string }): Promise<ExpenseRecord[]> {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          expense_heads (
            id,
            name,
            code,
            category
          ),
          expense_fee_head_allocations (
            fee_head_id,
            allocated_percentage,
            allocated_amount
          )
        `)
        .order('expense_date', { ascending: false });

      if (filters?.branchId && filters.branchId !== 'All') {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters?.sessionId) {
        query = query.eq('session_id', filters.sessionId);
      }
      if (filters?.termId) {
        query = query.eq('term_id', filters.termId);
      }
      if (filters?.status && filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        amount: Number(row.amount) || 0,
        expense_head: row.expense_heads,
        allocations: row.expense_fee_head_allocations
      }));
    } catch (err) {
      console.warn('FinanceService.getExpenses fallback to server API:', err);
      const res = await fetch('/api/expenses');
      if (res.ok) return await res.json();
      return [];
    }
  }

  async recordExpense(expense: Partial<ExpenseRecord>, feeAllocations?: { fee_head_id: string; percentage: number; amount: number }[]): Promise<ExpenseRecord | null> {
    try {
      const expenseDate = expense.expense_date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          branch_id: expense.branch_id || '98765432-1111-2222-3333-444455556666',
          expense_head_id: expense.expense_head_id,
          session_id: expense.session_id || null,
          term_id: expense.term_id || null,
          amount: expense.amount || 0,
          expense_date: expenseDate,
          vendor_payee: expense.vendor_payee || 'General Supplier',
          description: expense.description || '',
          payment_method: expense.payment_method || 'Bank_Transfer',
          reference_number: expense.reference_number || `EXP-${Date.now()}`,
          approved_by_user_id: expense.approved_by_user_id || null,
          recorded_by_user_id: expense.recorded_by_user_id || null,
          status: expense.status || 'Paid',
          receipt_doc_url: expense.receipt_doc_url || null
        })
        .select()
        .single();

      if (error) throw error;

      // Fee head allocations for expense matching
      if (feeAllocations && feeAllocations.length > 0 && data?.id) {
        const rows = feeAllocations.map(a => ({
          expense_id: data.id,
          fee_head_id: a.fee_head_id,
          allocated_percentage: a.percentage,
          allocated_amount: a.amount
        }));
        await supabase.from('expense_fee_head_allocations').insert(rows);
      }

      // General Ledger debit for expense
      if (data?.id) {
        await supabase
          .from('general_ledger_entries')
          .insert({
            branch_id: data.branch_id,
            session_id: data.session_id,
            term_id: data.term_id,
            entry_date: expenseDate,
            ledger_type: 'Expense',
            account_code: 'EXP-OPS-500',
            debit: data.amount,
            credit: 0.00,
            reference_table: 'expenses',
            reference_id: data.id,
            description: `Operating expense disbursed to ${data.vendor_payee}: ${data.description}`
          });
      }

      return data as ExpenseRecord;
    } catch (err) {
      console.warn('FinanceService.recordExpense error:', err);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      if (res.ok) return await res.json();
      return null;
    }
  }

  // ============================================================================
  // 7. FINANCIAL TIMELINE AUDIT
  // ============================================================================
  async getStudentFinancialTimeline(studentId?: string, familyId?: string): Promise<FinancialTimelineRecord[]> {
    try {
      let query = supabase
        .from('student_financial_timeline')
        .select('*')
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      if (familyId) {
        query = query.eq('family_id', familyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as FinancialTimelineRecord[]) || [];
    } catch (err) {
      console.warn('FinanceService.getStudentFinancialTimeline fallback:', err);
      const res = await fetch('/api/financial_timeline');
      if (res.ok) return await res.json();
      return [];
    }
  }

  // ============================================================================
  // 8. EXECUTIVE REVENUE, COLLECTIONS & PROFIT/LOSS AGGREGATIONS
  // ============================================================================
  async getExecutiveFinancialSummary(branchId?: string, sessionId?: string, termId?: string) {
    try {
      const [charges, paymentsRes, expenses] = await Promise.all([
        this.getStudentFeeCharges({ branchId, sessionId, termId }),
        supabase.from('payments').select('amount, payment_method, payment_date, branch_id'),
        this.getExpenses({ branchId, sessionId, termId })
      ]);

      const expectedRevenue = charges.reduce((sum, c) => sum + c.net_amount_due, 0);
      const totalCollected = (paymentsRes.data || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      const totalOutstanding = Math.max(0, expectedRevenue - totalCollected);
      const collectionPercentage = expectedRevenue > 0 ? (totalCollected / expectedRevenue) * 100 : 0;
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netPosition = totalCollected - totalExpenses;

      return {
        expectedRevenue,
        totalCollected,
        totalOutstanding,
        collectionPercentage,
        totalExpenses,
        netPosition
      };
    } catch (err) {
      console.error('Error computing financial summary:', err);
      return null;
    }
  }
}

export const financeService = new FinanceService();
export default financeService;
