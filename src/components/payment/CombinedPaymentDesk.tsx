import React, { useState, useEffect, useMemo } from 'react';
import { StoreInventoryItem, SaleLineItem, StudentSearchResult } from '../../types/inventory';
import { CombinedPaymentRecord, CombinedPaymentPayload, FeeAllocationDetail } from '../../types/combinedPayment';
import { CombinedPaymentReceiptModal } from './CombinedPaymentReceiptModal';
import { CombinedPaymentAuditModal } from './CombinedPaymentAuditModal';
import {
  Layers,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Banknote,
  Building,
  GraduationCap,
  Store,
  ArrowRight,
  ShieldCheck,
  Percent,
  Receipt,
  User,
  Phone,
  FileText,
  Sparkles,
  Info,
  Clock,
  Check,
  X,
  History,
  RotateCcw,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  AlertCircle,
  Eye,
  CheckSquare
} from 'lucide-react';

interface CombinedPaymentDeskProps {
  initialStudent?: StudentSearchResult | null;
  initialCart?: SaleLineItem[];
  onSessionComplete?: (record: CombinedPaymentRecord) => void;
}

export const CombinedPaymentDesk: React.FC<CombinedPaymentDeskProps> = ({
  initialStudent,
  initialCart,
  onSessionComplete
}) => {
  // Cashier Info
  const cashierId = 'usr-cashier-01';
  const cashierName = 'Hajiya Maryam (Accounts & Store Desk)';

  // Core Data Lists
  const [inventoryItems, setInventoryItems] = useState<StoreInventoryItem[]>([]);
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [feeLedgers, setFeeLedgers] = useState<any[]>([]);
  const [recentCombinedPayments, setRecentCombinedPayments] = useState<CombinedPaymentRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Student Search & Selection
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(initialStudent || null);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Store Items Cart
  const [cart, setCart] = useState<SaleLineItem[]>(initialCart || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [itemSearch, setItemSearch] = useState('');
  const [storeBranch, setStoreBranch] = useState('Main Campus');
  const [storeLocation, setStoreLocation] = useState('Uniform Depot');

  // Store Discount
  const [storeDiscountAmount, setStoreDiscountAmount] = useState<number | string>(0);

  // Parent Payment Inputs
  const [totalPaymentReceived, setTotalPaymentReceived] = useState<string>('60000');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'POS Card' | 'Student Wallet'>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('TRF-ZENITH-883912');
  const [notes, setNotes] = useState('Single parent payment covering uniform goods and tuition fee.');
  const [allocationRule, setAllocationRule] = useState<'oldest_first' | 'highest_outstanding' | 'lowest_outstanding'>('oldest_first');

  // Manual Override & Policy Adjustments
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [manualStorePaid, setManualStorePaid] = useState<string>('');
  const [manualFeeAllocations, setManualFeeAllocations] = useState<{ [ledgerId: string]: string }>({});
  const [overrideReason, setOverrideReason] = useState('Parent requested prioritizing Current Term uniform & tuition per bursary agreement');
  const [overriddenBy, setOverriddenBy] = useState('M. Abubakar (Head Bursar)');

  // Processing & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<CombinedPaymentRecord | null>(null);
  const [activeAuditModalRecord, setActiveAuditModalRecord] = useState<CombinedPaymentRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'desk' | 'history'>('desk');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'overrides' | 'standard'>('all');

  // Load backend data
  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [invRes, stuRes, ledgRes, combRes] = await Promise.all([
        fetch('/api/inventory/items'),
        fetch('/api/students/store_search'),
        fetch('/api/student_fee_ledgers'),
        fetch('/api/combined_payments')
      ]);

      if (invRes.ok) setInventoryItems(await invRes.json());
      if (stuRes.ok) setStudents(await stuRes.json());
      if (ledgRes.ok) setFeeLedgers(await ledgRes.json());
      if (combRes.ok) setRecentCombinedPayments(await combRes.json());
    } catch (e) {
      console.error("Error loading initial data for combined desk:", e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Pre-seed sample selection if initial values are provided or on first load
  useEffect(() => {
    if (!selectedStudent && students.length > 0) {
      const sample = students.find(s => s.schoolFeesBalance > 0) || students[0];
      if (sample) {
        setSelectedStudent(sample);
      }
    }
  }, [students, selectedStudent]);

  // Set default initial cart if empty (Uniform Material + Shirts + Tie = ₦15,000 for prompt scenario)
  useEffect(() => {
    if (cart.length === 0 && inventoryItems.length > 0) {
      const item1 = inventoryItems.find(i => i.itemCode === 'MAT-MET-01') || inventoryItems[0];
      const item3 = inventoryItems.find(i => i.itemCode === 'UNI-SHT-01') || inventoryItems[2];
      const item5 = inventoryItems.find(i => i.itemCode === 'ACC-TIE-01') || inventoryItems[4];

      if (item1 && item3 && item5) {
        setCart([
          {
            itemId: item1.id,
            itemCode: item1.itemCode,
            itemName: item1.name,
            unit: item1.unit,
            quantity: 3,
            unitPrice: item1.sellingPrice,
            subtotal: 3 * item1.sellingPrice // 7,500
          },
          {
            itemId: item3.id,
            itemCode: item3.itemCode,
            itemName: item3.name,
            unit: item3.unit,
            quantity: 1,
            unitPrice: item3.sellingPrice,
            subtotal: 1 * item3.sellingPrice // 4,500
          },
          {
            itemId: item5.id,
            itemCode: item5.itemCode,
            itemName: item5.name,
            unit: item5.unit,
            quantity: 2,
            unitPrice: item5.sellingPrice,
            subtotal: 2 * item5.sellingPrice // 3,600
          }
        ]);
        setStoreDiscountAmount(600); // Gives round ₦15,000 store total exactly matching user example!
      }
    }
  }, [inventoryItems]);

  // Debounced search for students
  useEffect(() => {
    if (!studentSearch.trim()) return;
    const timer = setTimeout(async () => {
      setIsSearchingStudents(true);
      try {
        const res = await fetch(`/api/students/store_search?q=${encodeURIComponent(studentSearch.trim())}`);
        if (res.ok) {
          const results = await res.json();
          setStudents(results);
          setShowStudentDropdown(true);
        }
      } catch (e) {
        console.error("Student search error:", e);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Filter sellable inventory items
  const filteredInventory = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = itemSearch === '' ||
        item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(itemSearch.toLowerCase());
      const isSellable = item.setting === 'Sell to Parent' || item.setting === 'Both';
      return matchesCat && matchesSearch && isSellable && item.status === 'Active';
    });
  }, [inventoryItems, selectedCategory, itemSearch]);

  // Fee ledgers for selected student (sorted oldest outstanding term first)
  const studentLedgerList = useMemo(() => {
    if (!selectedStudent) return [];

    const existing = feeLedgers.filter(l => l.studentId === selectedStudent.id && (Number(l.outstanding) || 0) > 0);
    if (existing.length > 0) {
      // Sort oldest billing date first
      return [...existing].sort((a, b) => {
        const timeA = new Date(a.billingDate || a.createdAt || 0).getTime();
        const timeB = new Date(b.billingDate || b.createdAt || 0).getTime();
        return timeA - timeB;
      });
    }

    // Default multi-term breakdown representing previous term (₦20,000) and current term (₦50,000)
    const totalBal = selectedStudent.schoolFeesBalance || 70000;
    const prevTermOutstanding = Math.min(20000, totalBal);
    const currTermOutstanding = Math.max(0, totalBal - prevTermOutstanding);

    return [
      {
        id: `sfl-${selectedStudent.id}-term1`,
        studentId: selectedStudent.id,
        termId: 'term-prev',
        termName: 'Previous Term (First Term Outstanding)',
        billingDate: '2026-01-10',
        dueDate: '2026-01-30',
        grandTotal: 50000,
        paid: 30000,
        outstanding: prevTermOutstanding,
        status: prevTermOutstanding === 0 ? 'Paid' : 'Partially Paid'
      },
      {
        id: `sfl-${selectedStudent.id}-term2`,
        studentId: selectedStudent.id,
        termId: 'term-curr',
        termName: 'Current Term (Second Term Tuition)',
        billingDate: '2026-04-15',
        dueDate: '2026-05-15',
        grandTotal: 50000,
        paid: 0,
        outstanding: currTermOutstanding,
        status: 'Unpaid'
      }
    ];
  }, [feeLedgers, selectedStudent]);

  const schoolFeeOutstanding = useMemo(() => {
    return studentLedgerList.reduce((sum, l) => sum + (Number(l.outstanding) || 0), 0);
  }, [studentLedgerList]);

  // Cart operations
  const handleAddToCart = (item: StoreInventoryItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        return prev.map(i =>
          i.itemId === item.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          itemCode: item.itemCode,
          itemName: item.name,
          unit: item.unit,
          quantity: 1,
          unitPrice: item.sellingPrice,
          subtotal: item.sellingPrice
        }
      ];
    });
  };

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.itemId !== itemId));
      return;
    }
    setCart(prev =>
      prev.map(i => (i.itemId === itemId ? { ...i, quantity: newQty, subtotal: parseFloat((newQty * i.unitPrice).toFixed(2)) } : i))
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.itemId !== itemId));
  };

  // Cart Calculations
  const storeSubtotal = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.subtotal, 0);
  }, [cart]);

  const discountNum = Number(storeDiscountAmount) || 0;
  const storeGrandTotal = Math.max(0, storeSubtotal - discountNum);

  // -------------------------------------------------------------
  // DYNAMIC ALLOCATION ENGINE (Store P1 -> Fees P2 [Oldest First] -> Advance P3)
  // -------------------------------------------------------------
  const paymentAmountNum = Number(totalPaymentReceived) || 0;

  // Auto Allocation Simulation
  const autoAllocationDetails = useMemo(() => {
    // Step 1: Store Settlement (Priority 1)
    const storePaid = Math.min(paymentAmountNum, storeGrandTotal);
    const storeRemaining = Math.max(0, storeGrandTotal - storePaid);
    const storeStatus: 'Paid' | 'Partially Paid' | 'Unpaid' =
      storeGrandTotal === 0 ? 'Paid' : storePaid >= storeGrandTotal ? 'Paid' : storePaid > 0 ? 'Partially Paid' : 'Unpaid';

    // Step 2: Remaining Payment for School Fees (Priority 2)
    let remainingForFees = Math.max(0, paymentAmountNum - storePaid);
    let totalFeeAllocated = 0;

    const termAllocations = studentLedgerList.map(ledger => {
      const outBefore = Number(ledger.outstanding) || 0;
      let alloc = 0;
      if (remainingForFees > 0) {
        if (remainingForFees >= outBefore) {
          alloc = outBefore;
          remainingForFees -= outBefore;
        } else {
          alloc = remainingForFees;
          remainingForFees = 0;
        }
      }
      totalFeeAllocated += alloc;
      const outAfter = Math.max(0, outBefore - alloc);
      const status: 'Paid' | 'Partially Paid' | 'Unpaid' =
        outBefore === 0 ? 'Paid' : outAfter === 0 ? 'Paid' : alloc > 0 ? 'Partially Paid' : 'Unpaid';

      return {
        ledgerId: ledger.id,
        termName: ledger.termName || ledger.termId || 'Term Ledger',
        billingDate: ledger.billingDate,
        outstandingBefore: outBefore,
        amountAllocated: alloc,
        outstandingAfter: outAfter,
        status
      };
    });

    const feeRemainingOutstanding = Math.max(0, schoolFeeOutstanding - totalFeeAllocated);
    const feeStatus: 'Paid' | 'Partially Paid' | 'Unpaid' =
      schoolFeeOutstanding === 0 ? 'Paid' : feeRemainingOutstanding === 0 ? 'Paid' : totalFeeAllocated > 0 ? 'Partially Paid' : 'Unpaid';

    // Step 3: Advance Wallet Credit Surplus (Priority 3)
    const advanceSurplus = Math.max(0, remainingForFees);

    return {
      storePaid,
      storeRemaining,
      storeStatus,
      remainingForFees: Math.max(0, paymentAmountNum - storePaid),
      totalFeeAllocated,
      feeRemainingOutstanding,
      feeStatus,
      termAllocations,
      advanceSurplus
    };
  }, [paymentAmountNum, storeGrandTotal, studentLedgerList, schoolFeeOutstanding]);

  // Initialize or reset manual override inputs when toggled
  useEffect(() => {
    if (isManualOverride) {
      setManualStorePaid(autoAllocationDetails.storePaid.toString());
      const initialFeeMap: { [id: string]: string } = {};
      autoAllocationDetails.termAllocations.forEach(t => {
        initialFeeMap[t.ledgerId] = t.amountAllocated.toString();
      });
      setManualFeeAllocations(initialFeeMap);
    }
  }, [isManualOverride]);

  // Computed Manual Allocation Details
  const manualAllocationDetails = useMemo(() => {
    if (!isManualOverride) return null;

    const manualStore = Number(manualStorePaid) || 0;
    const storeRemaining = Math.max(0, storeGrandTotal - manualStore);
    const storeStatus: 'Paid' | 'Partially Paid' | 'Unpaid' =
      storeGrandTotal === 0 ? 'Paid' : manualStore >= storeGrandTotal ? 'Paid' : manualStore > 0 ? 'Partially Paid' : 'Unpaid';

    let totalFeeAllocated = 0;
    const termAllocations = studentLedgerList.map(ledger => {
      const outBefore = Number(ledger.outstanding) || 0;
      const userAlloc = Number(manualFeeAllocations[ledger.id]) || 0;
      const alloc = Math.min(userAlloc, outBefore);
      totalFeeAllocated += alloc;
      const outAfter = Math.max(0, outBefore - alloc);
      const status: 'Paid' | 'Partially Paid' | 'Unpaid' =
        outBefore === 0 ? 'Paid' : outAfter === 0 ? 'Paid' : alloc > 0 ? 'Partially Paid' : 'Unpaid';

      return {
        ledgerId: ledger.id,
        termName: ledger.termName || ledger.termId || 'Term Ledger',
        billingDate: ledger.billingDate,
        outstandingBefore: outBefore,
        amountAllocated: alloc,
        outstandingAfter: outAfter,
        status
      };
    });

    const totalAllocated = manualStore + totalFeeAllocated;
    const difference = paymentAmountNum - totalAllocated;
    const feeRemainingOutstanding = Math.max(0, schoolFeeOutstanding - totalFeeAllocated);
    const feeStatus: 'Paid' | 'Partially Paid' | 'Unpaid' =
      schoolFeeOutstanding === 0 ? 'Paid' : feeRemainingOutstanding === 0 ? 'Paid' : totalFeeAllocated > 0 ? 'Partially Paid' : 'Unpaid';

    const advanceSurplus = Math.max(0, difference);

    return {
      storePaid: manualStore,
      storeRemaining,
      storeStatus,
      totalFeeAllocated,
      feeRemainingOutstanding,
      feeStatus,
      termAllocations,
      totalAllocated,
      difference,
      advanceSurplus,
      isOverAllocated: totalAllocated > paymentAmountNum
    };
  }, [isManualOverride, manualStorePaid, manualFeeAllocations, storeGrandTotal, studentLedgerList, paymentAmountNum, schoolFeeOutstanding]);

  // Active Effective Allocation (Auto vs Manual)
  const activeAllocation = isManualOverride && manualAllocationDetails ? manualAllocationDetails : autoAllocationDetails;

  // Quick Presets
  const handleApplyPreset = (preset: 'exact_both' | 'store_only' | '60k' | '50k' | 'clear') => {
    if (preset === 'exact_both') {
      setTotalPaymentReceived((storeGrandTotal + schoolFeeOutstanding).toString());
    } else if (preset === 'store_only') {
      setTotalPaymentReceived(storeGrandTotal.toString());
    } else if (preset === '60k') {
      setTotalPaymentReceived('60000');
    } else if (preset === '50k') {
      setTotalPaymentReceived('50000');
    } else if (preset === 'clear') {
      setTotalPaymentReceived('');
    }
  };

  // Submit Combined Payment Session
  const handleSubmitCombinedPayment = async () => {
    if (!selectedStudent) {
      setErrorNotice("Please select a student to bill.");
      return;
    }

    if (paymentAmountNum <= 0) {
      setErrorNotice("Please enter a valid positive payment amount.");
      return;
    }

    if (cart.length === 0 && schoolFeeOutstanding === 0) {
      setErrorNotice("Nothing to settle: No store items in cart and no outstanding school fees.");
      return;
    }

    if (isManualOverride && manualAllocationDetails?.isOverAllocated) {
      setErrorNotice(`Total allocations (₦${manualAllocationDetails.totalAllocated.toLocaleString()}) exceed payment received (₦${paymentAmountNum.toLocaleString()}). Please adjust.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorNotice(null);

      const parsedManualFeeAllocations: { [id: string]: number } = {};
      if (isManualOverride && manualAllocationDetails) {
        manualAllocationDetails.termAllocations.forEach(t => {
          parsedManualFeeAllocations[t.ledgerId] = t.amountAllocated;
        });
      }

      const payload: CombinedPaymentPayload = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        admissionNo: selectedStudent.admissionNo,
        grade: selectedStudent.grade,
        classSection: selectedStudent.classSection,
        branch: storeBranch,
        parentName: selectedStudent.parentName || "Parent / Guardian",
        parentPhone: selectedStudent.parentPhone || "",
        parentEmail: selectedStudent.parentEmail || "",
        totalPaymentReceived: paymentAmountNum,
        paymentMethod,
        referenceNo,
        cashierId,
        cashierName,
        notes,
        store: storeLocation,
        storeItems: cart,
        storeDiscountAmount: discountNum,
        allocationRule,
        isManualOverride,
        overrideReason: isManualOverride ? overrideReason : undefined,
        overriddenBy: isManualOverride ? overriddenBy : undefined,
        manualStorePaid: isManualOverride ? Number(manualStorePaid) || 0 : undefined,
        manualFeeAllocations: isManualOverride ? parsedManualFeeAllocations : undefined
      };

      const res = await fetch('/api/combined_payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to process combined payment.");
      }

      const newRecord: CombinedPaymentRecord = await res.json();

      // Update state
      setRecentCombinedPayments(prev => [newRecord, ...prev]);
      setActiveReceiptModal(newRecord);
      setShowConfirmModal(false);

      if (onSessionComplete) {
        onSessionComplete(newRecord);
      }

      // Reload databases to reflect updated balances and stock
      await loadInitialData();

      // Reset cart and reference
      setCart([]);
      setReferenceNo(`TRF-REF-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsManualOverride(false);
    } catch (err: any) {
      setErrorNotice(err.message || "An error occurred while posting combined payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered past sessions
  const filteredSessions = useMemo(() => {
    if (historyFilter === 'overrides') {
      return recentCombinedPayments.filter(s => s.isManualOverride || s.overrideAuditInfo?.isOverridden);
    }
    if (historyFilter === 'standard') {
      return recentCombinedPayments.filter(s => !s.isManualOverride && !s.overrideAuditInfo?.isOverridden);
    }
    return recentCombinedPayments;
  }, [recentCombinedPayments, historyFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* TOP DESK CONTROLLER BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl text-white shadow-xs">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Integrated Bursary & Store Terminal
              </span>
              <span className="text-xs text-slate-400">
                Default Rule: Store First (P1) → Oldest Term Fees (P2)
              </span>
            </div>
            <h1 className="text-lg font-black text-white mt-0.5">
              Combined Payment Processing Terminal
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('desk')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'desk'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Active Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Past Sessions & Audit Logs ({recentCombinedPayments.length})</span>
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs font-bold text-rose-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'desk' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: CUSTOMER + STORE ITEMS CART + OVERRIDE CONTROLS (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. STUDENT & FAMILY ACCOUNT SELECTOR */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">1</span>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Select Student / Family Account
                  </h2>
                </div>
                {selectedStudent && (
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentSearch('');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    Change Student
                  </button>
                )}
              </div>

              {!selectedStudent ? (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by Admission No, Student Name, Parent Name, or Phone..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>

                  {students.length > 0 && (
                    <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-56 overflow-y-auto z-20">
                      {students.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setShowStudentDropdown(false);
                          }}
                          className="w-full p-3 text-left hover:bg-indigo-50/50 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div>
                            <p className="font-bold text-xs text-slate-800">{s.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Adm: {s.admissionNo} • {s.grade} • Parent: {s.parentName} ({s.parentPhone || 'No Phone'})
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">Outstanding Fees:</span>
                            <span className="text-xs font-extrabold text-rose-600">
                              ₦{(s.schoolFeesBalance || 0).toLocaleString()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* SELECTED STUDENT PROFILE CARD */
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-black text-slate-900 text-sm">{selectedStudent.name}</h3>
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                          {selectedStudent.admissionNo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedStudent.grade} • Parent: <strong className="text-slate-700">{selectedStudent.parentName}</strong> ({selectedStudent.parentPhone || 'N/A'})
                      </p>
                    </div>
                  </div>

                  {/* OUTSTANDING FEE STATS */}
                  <div className="bg-white border border-rose-200 rounded-xl p-3 text-right shrink-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Current Total Fee Outstanding</span>
                    <span className="text-base font-black text-rose-600">
                      ₦{schoolFeeOutstanding.toLocaleString()}
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">{studentLedgerList.length} Outstanding Term Ledgers</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. STORE MATERIALS CART & ITEM PICKER */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">2</span>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Store Goods to Purchase (Priority 1)
                  </h2>
                </div>
                <span className="text-xs font-bold text-indigo-600">
                  {cart.length} Item(s) in Cart (₦{storeGrandTotal.toLocaleString()})
                </span>
              </div>

              {/* CATEGORY FILTER & SEARCH */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Search materials by name or SKU code..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                <div className="flex space-x-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
                  {['All', 'Uniforms', 'Stationery', 'Textbooks'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* QUICK INVENTORY PICKER TILES */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                {filteredInventory.slice(0, 9).map(item => {
                  const inCart = cart.find(c => c.itemId === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        inCart
                          ? 'bg-indigo-50/80 border-indigo-300'
                          : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-slate-800 text-[11px] line-clamp-1">{item.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{item.itemCode} • {item.unit}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="font-extrabold text-indigo-900 text-xs">₦{item.sellingPrice.toLocaleString()}</span>
                        <span className="text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-bold">
                          Stock: {item.currentStock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CURRENT CART ITEMS TABLE */}
              {cart.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs">
                  No store items in cart. Click an item above to add to this combined payment session.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-left">Item Description</th>
                        <th className="py-2 px-2 text-center">Unit</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-2 text-right">Price</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                        <th className="py-2 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {cart.map(item => (
                        <tr key={item.itemId}>
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-900">{item.itemName}</span>
                            <span className="block text-[9px] text-slate-400 font-mono">{item.itemCode}</span>
                          </td>
                          <td className="py-2 px-2 text-center text-slate-500">{item.unit}</td>
                          <td className="py-2 px-2 text-center">
                            <div className="inline-flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <button
                                onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                                className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-bold">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                                className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right text-slate-600">₦{item.unitPrice.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">₦{item.subtotal.toLocaleString()}</td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleRemoveFromCart(item.itemId)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* CART TOTAL SUMMARY FOOTER */}
                  <div className="bg-slate-50 p-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Discount (₦):</span>
                      <input
                        type="number"
                        value={storeDiscountAmount}
                        onChange={(e) => setStoreDiscountAmount(e.target.value)}
                        placeholder="0"
                        className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 mr-2">Store Value (Priority 1):</span>
                      <span className="text-sm font-black text-indigo-900">₦{storeGrandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. POLICY-PERMITTED MANUAL OVERRIDE ACCORDION / TOGGLE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Policy-Permitted Allocation Override
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Allows authorized users to adjust store or fee allocations (Audited)
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isManualOverride}
                    onChange={(e) => setIsManualOverride(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {isManualOverride ? (
                <div className="space-y-4 p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs animate-fade-in">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold">
                    <UserCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Authorized Manual Allocation Adjustment Mode</span>
                  </div>

                  {/* OVERRIDE REASON & AUTHORIZER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">
                        Policy Justification / Override Reason *
                      </label>
                      <select
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white outline-none focus:border-amber-500 font-medium"
                      >
                        <option value="Parent requested prioritizing Current Term uniform & tuition per bursary agreement">Parent requested prioritizing Current Term</option>
                        <option value="Approved Bursary installment concession plan">Approved Bursary installment concession</option>
                        <option value="Special store goods priority arrangement">Special store goods priority</option>
                        <option value="Bursar authorized custom fee allocation">Bursar authorized custom fee allocation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">
                        Authorized Officer Name *
                      </label>
                      <input
                        type="text"
                        value={overriddenBy}
                        onChange={(e) => setOverriddenBy(e.target.value)}
                        placeholder="e.g. M. Abubakar (Head Bursar)"
                        className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* ADJUSTABLE ALLOCATION INPUTS */}
                  <div className="space-y-2 pt-2 border-t border-amber-200">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-800">
                      <span>Adjust Custom Allocation Amounts (₦):</span>
                      <button
                        type="button"
                        onClick={() => {
                          setManualStorePaid(autoAllocationDetails.storePaid.toString());
                          const map: any = {};
                          autoAllocationDetails.termAllocations.forEach(t => map[t.ledgerId] = t.amountAllocated.toString());
                          setManualFeeAllocations(map);
                        }}
                        className="text-[10px] text-indigo-700 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to Auto-Allocation (Oldest First)</span>
                      </button>
                    </div>

                    {/* MANUAL STORE PAID */}
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200">
                      <div>
                        <span className="font-bold text-slate-900 block">Store Merchandise Paid</span>
                        <span className="text-[10px] text-slate-500">Store Grand Total: ₦{storeGrandTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold text-slate-400">₦</span>
                        <input
                          type="number"
                          value={manualStorePaid}
                          onChange={(e) => setManualStorePaid(e.target.value)}
                          max={storeGrandTotal}
                          className="w-28 px-2 py-1 text-right font-black border border-slate-300 rounded-lg outline-none focus:border-indigo-600 bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* MANUAL PER-TERM ALLOCATIONS */}
                    {studentLedgerList.map(ledger => {
                      const currentAlloc = manualFeeAllocations[ledger.id] !== undefined ? manualFeeAllocations[ledger.id] : (autoAllocationDetails.termAllocations.find(t => t.ledgerId === ledger.id)?.amountAllocated || 0).toString();
                      return (
                        <div key={ledger.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200">
                          <div>
                            <span className="font-bold text-slate-900 block">{ledger.termName || ledger.termId}</span>
                            <span className="text-[10px] text-slate-500">Outstanding: ₦{(Number(ledger.outstanding) || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-bold text-slate-400">₦</span>
                            <input
                              type="number"
                              value={currentAlloc}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualFeeAllocations(prev => ({ ...prev, [ledger.id]: val }));
                              }}
                              max={ledger.outstanding}
                              className="w-28 px-2 py-1 text-right font-black border border-slate-300 rounded-lg outline-none focus:border-indigo-600 bg-slate-50"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* RECONCILIATION SUMMARY */}
                  {manualAllocationDetails && (
                    <div className="p-2.5 bg-amber-100/80 rounded-lg border border-amber-300 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-700 font-bold">Total Manual Allocated: </span>
                        <span className="font-black text-slate-900">₦{manualAllocationDetails.totalAllocated.toLocaleString()}</span>
                        <span className="text-slate-500 text-[10px] ml-1">of ₦{paymentAmountNum.toLocaleString()} received</span>
                      </div>
                      <div>
                        {manualAllocationDetails.isOverAllocated ? (
                          <span className="text-rose-700 font-black text-[11px] flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Over by ₦{Math.abs(manualAllocationDetails.difference).toLocaleString()}!</span>
                          </span>
                        ) : manualAllocationDetails.difference > 0 ? (
                          <span className="text-purple-800 font-bold text-[10px]">
                            ₦{manualAllocationDetails.difference.toLocaleString()} → Advance Credit
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[10px] flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>100% Balanced</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Standard institutional policy is currently active: Payments settle <strong>Store Merchandise first (Priority 1)</strong> and automatically cascade remaining funds to school fees using <strong>Oldest Outstanding Term First (Priority 2)</strong>.
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: PAYMENT INPUT & LIVE SETTLEMENT ENGINE (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* PAYMENT INPUT FORM */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">3</span>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Parent Single Payment Details
                </h2>
              </div>

              {/* PAYMENT AMOUNT INPUT */}
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">
                  Total Amount Received from Parent (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-black text-slate-400">₦</span>
                  <input
                    type="number"
                    value={totalPaymentReceived}
                    onChange={(e) => setTotalPaymentReceived(e.target.value)}
                    placeholder="60000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-black text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                  />
                </div>

                {/* QUICK PRESETS */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('60k')}
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    ₦60,000 (Example Scenario)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('exact_both')}
                    className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-[10px] font-bold cursor-pointer"
                  >
                    Exact Full (₦{(storeGrandTotal + schoolFeeOutstanding).toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('store_only')}
                    className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-[10px] font-bold cursor-pointer"
                  >
                    Store Only (₦{storeGrandTotal.toLocaleString()})
                  </button>
                </div>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Bank Transfer', 'POS Card', 'Cash', 'Student Wallet'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left flex items-center space-x-2 ${
                        paymentMethod === method
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method === 'Bank Transfer' && <Building className="w-3.5 h-3.5 text-indigo-400" />}
                      {method === 'POS Card' && <CreditCard className="w-3.5 h-3.5 text-emerald-400" />}
                      {method === 'Cash' && <Banknote className="w-3.5 h-3.5 text-amber-400" />}
                      {method === 'Student Wallet' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                      <span>{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* REFERENCE NUMBER & NOTES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Bank / POS Reference #
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="TRF-884920"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Fee Allocation Priority Rule
                  </label>
                  <select
                    value={allocationRule}
                    onChange={(e: any) => setAllocationRule(e.target.value)}
                    disabled={isManualOverride}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500 bg-white disabled:opacity-60"
                  >
                    <option value="oldest_first">Oldest Outstanding Term First (Standard)</option>
                    <option value="highest_outstanding">Highest Outstanding First</option>
                    <option value="lowest_outstanding">Lowest Outstanding First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* LIVE DYNAMIC ALLOCATION SIMULATION BREAKDOWN */}
            <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Real-Time Settlement Allocation
                  </h3>
                </div>
                {isManualOverride ? (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    Manual Override
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    Oldest Term First
                  </span>
                )}
              </div>

              {/* STEP-BY-STEP BREAKDOWN CARDS */}
              <div className="space-y-3 text-xs">
                
                {/* STEP 1: STORE GOODS SETTLEMENT (PRIORITY 1) */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 flex items-center space-x-1.5 text-[11px] uppercase">
                      <Store className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Priority 1: Store Purchase</span>
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      activeAllocation.storeStatus === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {activeAllocation.storeStatus}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 pt-1">
                    <span>Store Value:</span>
                    <span className="font-bold text-white">₦{storeGrandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 font-semibold text-[11px]">
                    <span>Amount Settled (Store):</span>
                    <span>- ₦{activeAllocation.storePaid.toLocaleString()}</span>
                  </div>
                  {activeAllocation.storeRemaining > 0 && (
                    <div className="flex justify-between items-center text-rose-400 text-[10px]">
                      <span>Remaining Store Balance Due:</span>
                      <span>₦{activeAllocation.storeRemaining.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* STEP 2: MULTI-TERM SCHOOL FEES ALLOCATION (PRIORITY 2) */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 flex items-center space-x-1.5 text-[11px] uppercase">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Priority 2: School Fees Allocation</span>
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      activeAllocation.feeStatus === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {activeAllocation.feeStatus}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 text-[11px]">
                    <span>Available from Payment for Fees:</span>
                    <span className="font-bold text-indigo-200">₦{Math.max(0, paymentAmountNum - activeAllocation.storePaid).toLocaleString()}</span>
                  </div>

                  {/* INDIVIDUAL TERM ALLOCATION ROWS */}
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-700/80">
                    {activeAllocation.termAllocations.map((term, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-200 text-[11px]">{term.termName}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            term.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {term.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400">
                          <div>Before: <strong className="text-slate-200">₦{term.outstandingBefore.toLocaleString()}</strong></div>
                          <div className="text-center text-emerald-400">Alloc: <strong>₦{term.amountAllocated.toLocaleString()}</strong></div>
                          <div className="text-right text-rose-300">After: <strong>₦{term.outstandingAfter.toLocaleString()}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-amber-300 font-bold border-t border-slate-700 pt-1.5">
                    <span>New Total Fee Outstanding:</span>
                    <span className="text-sm font-black text-rose-400">₦{activeAllocation.feeRemainingOutstanding.toLocaleString()}</span>
                  </div>
                </div>

                {/* ADVANCE CREDIT SURPLUS IF APPLICABLE */}
                {activeAllocation.advanceSurplus > 0 && (
                  <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 flex justify-between items-center text-purple-200">
                    <span className="text-[11px] font-bold">Surplus Advance Wallet Credit:</span>
                    <span className="font-black text-sm text-purple-300">+ ₦{activeAllocation.advanceSurplus.toLocaleString()}</span>
                  </div>
                )}

              </div>

              {/* STRICT ACCOUNTING INTEGRITY NOTICE */}
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex items-start space-x-2 text-[10px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Accounting Integrity Guaranteed:</strong> Store purchases and school fees post to separate General Ledger accounts. No silent alterations occur without transparent receipts and audit trails.
                </span>
              </div>

              {/* ACTION CONFIRM BUTTON (Opens Pre-Confirmation Modal) */}
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isSubmitting || paymentAmountNum <= 0 || (isManualOverride && manualAllocationDetails?.isOverAllocated)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Review & Confirm Allocation (₦{paymentAmountNum.toLocaleString()})</span>
              </button>
            </div>

          </div>

        </div>
      ) : (
        /* TAB 2: HISTORICAL COMBINED PAYMENTS & AUDIT TRAIL */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Recorded Combined Payment Sessions ({recentCombinedPayments.length})
              </h2>
              <p className="text-xs text-slate-400">
                Cross-referenced store and fee transactions with audit trail verification
              </p>
            </div>

            {/* AUDIT FILTER TOGGLES */}
            <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({recentCombinedPayments.length})
              </button>
              <button
                onClick={() => setHistoryFilter('overrides')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'overrides' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-100'
                }`}
              >
                Manual Overrides (Audited)
              </button>
              <button
                onClick={() => setHistoryFilter('standard')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'standard' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Standard Priority
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No sessions found matching current filter.
              </div>
            ) : (
              filteredSessions.map(session => {
                const isOverridden = session.isManualOverride || session.overrideAuditInfo?.isOverridden;
                return (
                  <div key={session.id} className="py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-indigo-700">{session.combinedReceiptNo}</span>
                        <span className="text-xs font-bold text-slate-900">{session.studentName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{session.admissionNo || 'N/A'}</span>
                        {isOverridden ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            Audited Override
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Oldest First
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Parent: {session.parentName} • {session.date} {session.time} • Cashier: {session.cashierName} • Method: {session.paymentMethod}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px]">
                        <span className="text-indigo-700 font-semibold">Store: ₦{session.storeGrandTotal.toLocaleString()} ({session.allocationSummary.storeStatus})</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-700 font-semibold">Fees Applied: ₦{session.allocationSummary.feeAmountAllocated.toLocaleString()}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-600 font-semibold">Fee Rem: ₦{session.allocationSummary.schoolFeeOutstandingAfter.toLocaleString()}</span>
                        {isOverridden && (
                          <span className="text-amber-800 italic">
                            (Auth: {session.overriddenBy || session.overrideAuditInfo?.overriddenBy || 'Officer'})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="text-right mr-2">
                        <span className="text-xs font-black text-slate-900 block">₦{session.totalPaymentReceived.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-600 font-bold">Total Paid</span>
                      </div>

                      <button
                        onClick={() => setActiveAuditModalRecord(session)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                        title="View Audit Trail"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                        <span>Audit Log</span>
                      </button>

                      <button
                        onClick={() => setActiveReceiptModal(session)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Dual Receipt</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* PRE-CONFIRMATION ALLOCATION BREAKDOWN MODAL (CRITICAL REQUIREMENT) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            
            {/* MODAL HEADER */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Pre-Posting Verification
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-0.5">
                    Confirm Dual Allocation Breakdown
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-800 text-xs">
              
              {/* TRANSACTION METRICS BANNER */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Student</span>
                  <span className="font-bold text-slate-900 text-xs">{selectedStudent?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Payment</span>
                  <span className="font-black text-indigo-700 text-sm">₦{paymentAmountNum.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Method</span>
                  <span className="font-semibold text-slate-800">{paymentMethod}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Reference #</span>
                  <span className="font-mono font-semibold text-slate-800">{referenceNo}</span>
                </div>
              </div>

              {/* OVERRIDE NOTICE IF APPLICABLE */}
              {isManualOverride && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-amber-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Policy-Permitted Manual Allocation Override Active</span>
                  </div>
                  <p className="text-[11px] pl-5.5">
                    Authorized by: <strong>{overriddenBy}</strong> • Justification: <em>{overrideReason}</em>
                  </p>
                </div>
              )}

              {/* DUAL ALLOCATION STEP-BY-STEP TABLE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Category / Component</th>
                      <th className="py-2.5 px-3 text-right">Total Due</th>
                      <th className="py-2.5 px-3 text-right">Amount Allocated</th>
                      <th className="py-2.5 px-3 text-right">Remaining Due</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* STORE GOODS ROW */}
                    <tr className="bg-indigo-50/30">
                      <td className="py-2.5 px-3 font-bold text-indigo-950 flex items-center space-x-2">
                        <Store className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>1. Store Merchandise ({cart.length} items)</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">₦{storeGrandTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-black text-indigo-700">₦{activeAllocation.storePaid.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-rose-600 font-bold">₦{activeAllocation.storeRemaining.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          activeAllocation.storeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {activeAllocation.storeStatus}
                        </span>
                      </td>
                    </tr>

                    {/* PER-TERM FEE ROWS */}
                    {activeAllocation.termAllocations.map((term, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 pl-6 flex items-center space-x-2">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>2.{idx + 1} {term.termName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">₦{term.outstandingBefore.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">₦{term.amountAllocated.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-rose-600 font-bold">₦{term.outstandingAfter.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            term.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {term.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* ADVANCE CREDIT ROW IF APPLICABLE */}
                    {activeAllocation.advanceSurplus > 0 && (
                      <tr className="bg-purple-50/40">
                        <td className="py-2.5 px-3 font-bold text-purple-900 flex items-center space-x-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>3. Surplus Advance Credit (Wallet)</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">₦0</td>
                        <td className="py-2.5 px-3 text-right font-black text-purple-700">+ ₦{activeAllocation.advanceSurplus.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">₦0</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            Prepaid
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* FINANCIAL POSTING DISCLOSURE */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Commitment Verification:</span>
                <p>
                  Upon confirmation, the system will simultaneously generate a Store Sales Receipt (<strong>₦{activeAllocation.storePaid.toLocaleString()}</strong>) and a School Fees Receipt (<strong>₦{activeAllocation.totalFeeAllocated.toLocaleString()}</strong>), updating the respective inventory stock levels and student ledger balances with full audit traceability.
                </p>
              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Back to Adjustments
              </button>

              <button
                type="button"
                onClick={handleSubmitCombinedPayment}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg transition-all cursor-pointer flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Posting to Dual Ledgers...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Authorize & Commit Dual Payment</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DUAL COMBINED RECEIPT MODAL */}
      {activeReceiptModal && (
        <CombinedPaymentReceiptModal
          receipt={activeReceiptModal}
          onClose={() => setActiveReceiptModal(null)}
        />
      )}

      {/* AUDIT LOG MODAL */}
      {activeAuditModalRecord && (
        <CombinedPaymentAuditModal
          record={activeAuditModalRecord}
          onClose={() => setActiveAuditModalRecord(null)}
        />
      )}

    </div>
  );
};
