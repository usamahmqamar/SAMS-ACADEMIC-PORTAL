import { SaleLineItem, StoreSaleRecord } from './inventory';

export interface FeeAllocationDetail {
  ledgerId: string;
  name: string;
  termName?: string;
  outstandingBefore: number;
  amountAllocated: number;
  outstandingAfter: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
}

export interface CombinedPaymentAllocationSummary {
  // Store Settlement (Priority 1)
  storePurchaseTotal: number;
  storeAmountPaid: number;
  storeBalanceDue: number;
  storeStatus: 'Paid' | 'Partially Paid' | 'Unpaid';

  // School Fee Settlement (Priority 2)
  remainingForFees: number;
  schoolFeeOutstandingBefore: number;
  feeAmountAllocated: number;
  schoolFeeOutstandingAfter: number;
  feeStatus: 'Paid' | 'Partially Paid' | 'Unpaid';

  // Advance Credit Surplus (Priority 3)
  advanceWalletCreditGenerated: number;
}

export interface OverrideAuditInfo {
  isOverridden: boolean;
  overrideReason?: string;
  overriddenBy?: string;
  overriddenRole?: string;
  timestamp: string;
  originalAutoAllocation?: {
    storePaid: number;
    feeAllocated: number;
    termAllocations: Array<{ ledgerId: string; termName: string; amount: number }>;
  };
  manualAllocation?: {
    storePaid: number;
    feeAllocated: number;
    termAllocations: Array<{ ledgerId: string; termName: string; amount: number }>;
  };
}

export interface CombinedPaymentRecord {
  id: string; // e.g. CPAY-2026-894102
  combinedReceiptNo: string; // e.g. RCP-COMB-2026-894102
  date: string;
  time: string;

  // Student & Customer Details
  studentId: string;
  admissionNo: string;
  studentName: string;
  grade: string;
  classSection?: string;
  branch: string;

  parentName: string;
  parentPhone?: string;
  parentEmail?: string;

  // Total Parent Payment
  totalPaymentReceived: number;
  paymentMethod: 'Cash' | 'POS Card' | 'Bank Transfer' | 'Student Wallet';
  referenceNo: string;
  cashierId: string;
  cashierName: string;
  notes?: string;

  // Allocation Breakdown
  allocationSummary: CombinedPaymentAllocationSummary;

  // Manual Override & Policy Audit Trail
  isManualOverride?: boolean;
  overrideReason?: string;
  overriddenBy?: string;
  overrideAuditInfo?: OverrideAuditInfo;

  // Component 1: Store Purchase (Isolated Accounting)
  storeSaleId: string;
  storeReceiptNo: string;
  store: string;
  storeItems: SaleLineItem[];
  storeSubtotal: number;
  storeDiscountAmount: number;
  storeGrandTotal: number;
  storeAmountPaid: number;
  storeLedgerCategory: 'Store Materials Purchase';

  // Component 2: School Fees (Isolated Accounting)
  feePaymentId: string;
  feeReceiptNo: string;
  feeLedgerAllocations: FeeAllocationDetail[];
  feeAmountAllocated: number;
  schoolFeeLedgerCategory: 'Tuition & School Fees';

  // Overpayment Credit
  advanceCreditId?: string;

  createdAt: string;
}

export interface CombinedPaymentPayload {
  studentId: string;
  studentName: string;
  admissionNo?: string;
  grade?: string;
  classSection?: string;
  branch?: string;
  parentName: string;
  parentPhone?: string;
  parentEmail?: string;

  totalPaymentReceived: number;
  paymentMethod: 'Cash' | 'POS Card' | 'Bank Transfer' | 'Student Wallet';
  referenceNo?: string;
  cashierId?: string;
  cashierName?: string;
  notes?: string;

  store: string;
  storeItems: SaleLineItem[];
  storeDiscountAmount?: number;

  allocationRule?: 'oldest_first' | 'highest_outstanding' | 'lowest_outstanding' | 'even_distribution';
  
  // Manual Override Fields
  isManualOverride?: boolean;
  overrideReason?: string;
  overriddenBy?: string;
  manualStorePaid?: number;
  manualFeeAllocations?: { [ledgerId: string]: number };
}
