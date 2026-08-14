import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';
import Toast from './Toast';

interface Student {
  id: string;
  name: string;
  grade: string;
  branch: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
}

interface FeeLedger {
  id: string;
  studentId: string;
  studentName: string;
  grandTotal: number;
  outstanding: number;
  status: string;
  billingDate: string;
  dueDate: string;
}

interface PaymentItem {
  id: string;
  paymentId: string;
  ledgerId: string;
  name: string;
  amount: number;
}

interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNo: string;
  notes: string;
  createdAt: string;
  items?: PaymentItem[];
}

interface AdvanceCredit {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  initialAmount: number;
  notes: string;
  createdAt: string;
}

type OperatorRole = 'Accountant' | 'Principal' | 'Administrator';

export default function PaymentCollection() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  // Master Datasets
  const [students, setStudents] = useState<Student[]>([]);
  const [ledgers, setLedgers] = useState<FeeLedger[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [credits, setCredits] = useState<AdvanceCredit[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active View Modes
  // 'desktop' or 'mobile_terminal'
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile_terminal'>('desktop');
  const [simulatedRole, setSimulatedRole] = useState<OperatorRole>('Accountant');
  const [deskType, setDeskType] = useState<'student' | 'family'>('student');

  // Search and Select States (Shared)
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [familySearch, setFamilySearch] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<any | null>(null);

  // New Payment Form States
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'POS' | 'Waiver' | 'Advance Credit'>('Cash');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [autoAllocate, setAutoAllocate] = useState<boolean>(true);
  const [allocationRule, setAllocationRule] = useState<'oldest_first' | 'highest_outstanding' | 'lowest_outstanding' | 'even_distribution'>('oldest_first');
  const [manualAllocations, setManualAllocations] = useState<{ [ledgerId: string]: string }>({});
  const [savingPayment, setSavingPayment] = useState<boolean>(false);

  // Receipt Modal State (Desktop / Fallback)
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);
  const [receiptDetails, setReceiptDetails] = useState<(Payment & { items: PaymentItem[] }) | null>(null);
  const [receiptLoading, setReceiptLoading] = useState<boolean>(false);
  const [receiptTab, setReceiptTab] = useState<'a4' | 'pos' | 'email'>('a4');

  // Direct Credit Form Modal State
  const [isCreditModalOpen, setIsCreditModalOpen] = useState<boolean>(false);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [creditNotes, setCreditNotes] = useState<string>('');
  const [savingCredit, setSavingCredit] = useState<boolean>(false);

  // Filter for past payments history list
  const [historySearch, setHistorySearch] = useState<string>('');

  // Mobile Terminal Mode Specific Steps
  // 'select_student' -> 'amount_keypad' -> 'confirm_swipe' -> 'receipt_actions'
  const [mobileStep, setMobileStep] = useState<'select_student' | 'amount_keypad' | 'confirm_swipe' | 'receipt_actions'>('select_student');
  const [swipeProgress, setSwipeProgress] = useState<number>(0);
  const swipeTrackRef = useRef<HTMLDivElement>(null);
  const [isDraggingSwipe, setIsDraggingSwipe] = useState<boolean>(false);
  const [createdPaymentMobile, setCreatedPaymentMobile] = useState<Payment | null>(null);

  // Share Dialog States for WhatsApp and Email (Fully Functional Integrations)
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [whatsappMessage, setWhatsappMessage] = useState<string>('');

  const [isEmailOpen, setIsEmailOpen] = useState<boolean>(false);
  const [parentEmailAddress, setParentEmailAddress] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');

  // Default view state based on viewport width on initial load
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setViewMode('mobile_terminal');
    }
  }, []);

  // Loaded successfully trigger
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsRes, ledgersRes, paymentsRes, creditsRes, familiesRes, membersRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/student_fee_ledgers'),
        fetch('/api/student_payments'),
        fetch('/api/student_advance_credits'),
        fetch('/api/family_accounts'),
        fetch('/api/family_members')
      ]);

      if (!studentsRes.ok || !ledgersRes.ok || !paymentsRes.ok || !creditsRes.ok || !familiesRes.ok || !membersRes.ok) {
        throw new Error("Failed to load school payment databases.");
      }

      setStudents(await studentsRes.json());
      setLedgers(await ledgersRes.json());
      setPayments(await paymentsRes.json());
      setCredits(await creditsRes.json());
      setFamilies(await familiesRes.json());
      setFamilyMembers(await membersRes.json());
    } catch (err: any) {
      setError(err.message || "An error occurred while loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch specific receipt details
  const fetchReceiptDetails = async (paymentId: string) => {
    try {
      setReceiptLoading(true);
      const res = await fetch(`/api/student_payments/${paymentId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch receipt details.");
      }
      const data = await res.json();
      setReceiptDetails(data);
    } catch (err: any) {
      setToast({ message: err.message || "Error loading receipt.", type: "error" });
    } finally {
      setReceiptLoading(false);
    }
  };

  // Open Receipt Modal (Desktop)
  const handleOpenReceipt = (p: Payment) => {
    setSelectedPaymentForReceipt(p);
    setReceiptTab('a4');
    fetchReceiptDetails(p.id);
  };

  // Close Receipt Modal
  const handleCloseReceipt = () => {
    setSelectedPaymentForReceipt(null);
    setReceiptDetails(null);
  };

  // Filter families for dropdown lookup
  const filteredFamilies = useMemo(() => {
    if (familySearch.trim() === '') return [];
    const q = familySearch.toLowerCase();
    return families.filter(f => 
      f.familyName.toLowerCase().includes(q) || 
      (f.primaryParentName && f.primaryParentName.toLowerCase().includes(q)) ||
      (f.childrenNames && f.childrenNames.toLowerCase().includes(q)) ||
      f.id.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [families, familySearch]);

  // Unified outstanding ledgers for student or family selection
  const activeOutstandingLedgers = useMemo(() => {
    if (deskType === 'student') {
      if (!selectedStudent) return [];
      return ledgers.filter(l => l.studentId === selectedStudent.id && l.status !== 'Paid');
    } else {
      if (!selectedFamily) return [];
      const childRelations = familyMembers.filter(m => m.familyAccountId === selectedFamily.id);
      const studentIds = childRelations.map(m => m.studentId);
      return ledgers.filter(l => studentIds.includes(l.studentId) && l.status !== 'Paid');
    }
  }, [deskType, selectedStudent, selectedFamily, ledgers, familyMembers]);

  // Unified financial statistics
  const activeStats = useMemo(() => {
    let outstanding = 0;
    let creditsSum = 0;
    let name = '';
    let parentName = '';
    let typeLabel = '';

    if (deskType === 'student') {
      if (selectedStudent) {
        outstanding = activeOutstandingLedgers.reduce((sum, l) => sum + (l.outstanding || 0), 0);
        const studentCredits = credits.filter(c => c.studentId === selectedStudent.id);
        creditsSum = studentCredits.reduce((sum, c) => sum + (c.amount || 0), 0);
        name = selectedStudent.name;
        parentName = selectedStudent.parentName || 'None';
        typeLabel = 'Student';
      }
    } else {
      if (selectedFamily) {
        outstanding = activeOutstandingLedgers.reduce((sum, l) => sum + (l.outstanding || 0), 0);
        const childRelations = familyMembers.filter(m => m.familyAccountId === selectedFamily.id);
        const studentIds = childRelations.map(m => m.studentId);
        const familyCredits = credits.filter(c => studentIds.includes(c.studentId));
        creditsSum = familyCredits.reduce((sum, c) => sum + (c.amount || 0), 0);
        name = selectedFamily.familyName;
        parentName = selectedFamily.primaryParentName || 'None';
        typeLabel = 'Family Account';
      }
    }

    return {
      outstanding,
      credits: creditsSum,
      name,
      parentName,
      typeLabel
    };
  }, [deskType, selectedStudent, selectedFamily, activeOutstandingLedgers, credits, familyMembers]);

  // Calculations for selected entity (adapts studentStats transparently to unify logic)
  const studentStats = useMemo(() => {
    return {
      outstanding: activeStats.outstanding,
      credits: activeStats.credits,
      ledgers: activeOutstandingLedgers
    };
  }, [activeStats, activeOutstandingLedgers]);

  // Real-time allocation automatic engine (The Wizard Allocator)
  useEffect(() => {
    if (!autoAllocate) return;

    const numericAmount = Number(amount) || 0;
    if (numericAmount <= 0 || activeOutstandingLedgers.length === 0) {
      setManualAllocations({});
      return;
    }

    let remainingToAllocate = numericAmount;
    const computedAllocs: { [ledgerId: string]: string } = {};

    if (allocationRule === 'even_distribution') {
      const allocs = activeOutstandingLedgers.map(l => ({
        id: l.id,
        outstanding: l.outstanding || 0,
        allocated: 0
      }));

      let changed = true;
      while (remainingToAllocate > 0.01 && allocs.some(a => a.outstanding > 0) && changed) {
        changed = false;
        const unpaid = allocs.filter(a => a.outstanding > 0);
        if (unpaid.length === 0) break;

        const share = remainingToAllocate / unpaid.length;
        for (const item of unpaid) {
          const toApply = Math.min(item.outstanding, share);
          if (toApply > 0) {
            item.allocated += toApply;
            item.outstanding -= toApply;
            remainingToAllocate -= toApply;
            changed = true;
          }
        }
      }

      allocs.forEach(item => {
        if (item.allocated > 0) {
          computedAllocs[item.id] = Number(item.allocated.toFixed(2)).toString();
        }
      });
    } else {
      let sortedLedgers = [...activeOutstandingLedgers];
      if (allocationRule === 'highest_outstanding') {
        sortedLedgers.sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0));
      } else if (allocationRule === 'lowest_outstanding') {
        sortedLedgers.sort((a, b) => (a.outstanding || 0) - (b.outstanding || 0));
      } else {
        // default: oldest_first
        sortedLedgers.sort((a: any, b: any) => new Date(a.billingDate || a.createdAt || 0).getTime() - new Date(b.billingDate || b.createdAt || 0).getTime());
      }

      for (const ledger of sortedLedgers) {
        if (remainingToAllocate <= 0) break;
        const outstandingBefore = ledger.outstanding || 0;
        if (outstandingBefore <= 0) continue;

        if (remainingToAllocate >= outstandingBefore) {
          computedAllocs[ledger.id] = outstandingBefore.toString();
          remainingToAllocate -= outstandingBefore;
        } else {
          computedAllocs[ledger.id] = Number(remainingToAllocate.toFixed(2)).toString();
          remainingToAllocate = 0;
        }
      }
    }

    setManualAllocations(computedAllocs);
  }, [amount, allocationRule, autoAllocate, activeOutstandingLedgers]);

  // Compute total manual allocation
  const totalManualAllocated = useMemo(() => {
    let sum = 0;
    Object.keys(manualAllocations).forEach(k => {
      sum += Number(manualAllocations[k]) || 0;
    });
    return sum;
  }, [manualAllocations]);

  // Handle manual allocation input change
  const handleManualAllocationChange = (ledgerId: string, val: string) => {
    const ledger = ledgers.find(l => l.id === ledgerId);
    if (!ledger) return;

    let numVal = Number(val);
    if (isNaN(numVal) || numVal < 0) {
      numVal = 0;
    }

    if (numVal > ledger.outstanding) {
      numVal = ledger.outstanding;
    }

    setManualAllocations(prev => ({
      ...prev,
      [ledgerId]: numVal.toString()
    }));
  };

  // Shared submit logic for posting payments
  const executePaymentPost = async (numericAmount: number, overridePayload?: any) => {
    const isFamily = deskType === 'family';
    const endpoint = isFamily ? '/api/family_payments' : '/api/student_payments';

    // Prepare payload
    const payload: any = {
      amount: numericAmount,
      paymentMethod,
      paymentDate,
      referenceNo,
      notes,
      autoAllocate,
      allocationRule,
      ...overridePayload
    };

    if (isFamily) {
      payload.familyAccountId = selectedFamily?.id;
    } else {
      payload.studentId = selectedStudent?.id;
      payload.studentName = selectedStudent?.name;
    }

    if (!autoAllocate && !overridePayload?.autoAllocate) {
      payload.allocations = Object.keys(manualAllocations)
        .map(k => ({ ledgerId: k, amount: Number(manualAllocations[k]) || 0 }))
        .filter(a => a.amount > 0);
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Payment transaction rejected by engine.");
    }

    const paymentResult = await res.json();
    return paymentResult;
  };

  // Submit Payment Action (Desktop Standard)
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deskType === 'student' && !selectedStudent) {
      setToast({ message: "Please select a student first.", type: "warning" });
      return;
    }
    if (deskType === 'family' && !selectedFamily) {
      setToast({ message: "Please select a family first.", type: "warning" });
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      setToast({ message: "Please enter a valid payment amount.", type: "warning" });
      return;
    }

    // Validation for Advance Credit
    if (paymentMethod === 'Advance Credit' && numericAmount > studentStats.credits) {
      setToast({
        message: `Insufficient Advance Credit. Student/Family only has ₦${studentStats.credits.toLocaleString()} in credits.`,
        type: 'warning'
      });
      return;
    }

    if (!autoAllocate && totalManualAllocated > numericAmount) {
      setToast({ message: "The total manual allocation sum exceeds the actual amount to collect.", type: "warning" });
      return;
    }

    try {
      setSavingPayment(true);
      const paymentResult = await executePaymentPost(numericAmount);
      
      // Reset form
      setAmount('');
      setReferenceNo('');
      setNotes('');
      setManualAllocations({});
      setAutoAllocate(true);
      setAllocationRule('oldest_first');

      // Reload databases
      await loadData();

      // Trigger receipt modal immediately with the newly created payment
      handleOpenReceipt(paymentResult);
      setToast({ message: "Payment recorded and allocated successfully!", type: "success" });

    } catch (err: any) {
      setToast({ message: err.message || "Transaction error.", type: "error" });
    } finally {
      setSavingPayment(false);
    }
  };

  // Submit Payment Action (Mobile Swipe-to-Settle Engine)
  const handleMobileSwipeSettle = async () => {
    if (deskType === 'student' && !selectedStudent) return;
    if (deskType === 'family' && !selectedFamily) return;
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setToast({ message: "Please enter a valid payment amount.", type: "warning" });
      setMobileStep('amount_keypad');
      return;
    }

    try {
      setSavingPayment(true);
      const paymentResult = await executePaymentPost(numericAmount);
      
      // Save created payment to show in Mobile receipt view
      setCreatedPaymentMobile(paymentResult);
      
      // Reload databases
      await loadData();
      
      // Reset amount and inputs
      setAmount('');
      setReferenceNo('');
      setNotes('');
      setManualAllocations({});
      setAutoAllocate(true);

      // Advance to receipt screen
      setMobileStep('receipt_actions');
      setToast({ message: "Payment processed successfully!", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Settle transaction error.", type: "error" });
      setMobileStep('amount_keypad');
    } finally {
      setSavingPayment(false);
      setSwipeProgress(0);
    }
  };

  // Add Direct Advance Credit (Prepaid pool)
  const handleAddDirectCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const numAmt = Number(creditAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setToast({ message: "Please enter a valid credit amount.", type: "warning" });
      return;
    }

    try {
      setSavingCredit(true);
      const res = await fetch('/api/student_advance_credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          amount: numAmt,
          notes: creditNotes || "Direct manual advance deposit"
        })
      });

      if (!res.ok) {
        throw new Error("Failed to register advance deposit.");
      }

      setIsCreditModalOpen(false);
      setCreditAmount('');
      setCreditNotes('');
      await loadData();
      setToast({
        message: `🎉 Advance credit of ₦${numAmt.toLocaleString()} loaded for ${selectedStudent.name}.`,
        type: 'success'
      });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to load direct credit.", type: "error" });
    } finally {
      setSavingCredit(false);
    }
  };

  // Filter students for dropdown lookup
  const filteredStudents = useMemo(() => {
    if (studentSearch.trim() === '') return [];
    const q = studentSearch.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.parentName && s.parentName.toLowerCase().includes(q)) || 
      s.id.toLowerCase().includes(q)
    ).slice(0, 5); // Limit to top 5 results for extreme sleekness
  }, [students, studentSearch]);

  // Historical payments filtered
  const filteredPaymentsHistory = useMemo(() => {
    const q = historySearch.toLowerCase();
    return payments.filter(p => 
      q === '' ||
      p.studentName.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.paymentMethod.toLowerCase().includes(q) ||
      p.referenceNo.toLowerCase().includes(q)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [payments, historySearch]);

  // Quick preset amount taps for Mobile tactile keyboard
  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setAmount('');
    } else if (val === '⌫') {
      setAmount(prev => prev.slice(0, -1));
    } else if (val === '.') {
      if (!amount.includes('.')) {
        setAmount(prev => prev + '.');
      }
    } else {
      // Limit to max ₦10,000,000
      if (Number(amount + val) <= 10000000) {
        setAmount(prev => prev + val);
      }
    }
  };

  const handleApplyPreset = (type: 'outstanding' | '5k' | '20k' | '50k' | '100k') => {
    if (!selectedStudent) return;
    if (type === 'outstanding') {
      setAmount(studentStats.outstanding.toString());
    } else {
      const currentVal = Number(amount) || 0;
      let addon = 0;
      if (type === '5k') addon = 5000;
      if (type === '20k') addon = 20000;
      if (type === '50k') addon = 50000;
      if (type === '100k') addon = 100000;
      setAmount((currentVal + addon).toString());
    }
  };

  // Direct print trigger
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Deep-link sharing logic
  const initiateWhatsAppShare = (p: Payment) => {
    const parentPhone = selectedStudent?.parentPhone || '234'; // Default Nigerian prefix if none
    const msg = `Dear parent, this is an official SAMS update from Stanford Academy. We have received payment of ₦${p.amount.toLocaleString()} on ${p.paymentDate} via ${p.paymentMethod} for student ${p.studentName}. Receipt Reference ID: ${p.id}. Thank you for your support.`;
    
    setWhatsappPhone(parentPhone);
    setWhatsappMessage(msg);
    setIsWhatsAppOpen(true);
  };

  const handleLaunchWhatsApp = () => {
    const formattedPhone = whatsappPhone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(whatsappMessage);
    const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    window.open(waUrl, '_blank');
    setIsWhatsAppOpen(false);
  };

  // Email Sharing Logic
  const initiateEmailShare = (p: Payment) => {
    const pEmail = selectedStudent?.parentEmail || '';
    const subject = `Official School Fees Payment Receipt - ${selectedStudent?.name}`;
    const body = `Dear Parent/Guardian,\n\nThis is to acknowledge receipt of school fees payment for ${selectedStudent?.name} (${selectedStudent?.grade}).\n\nTransaction Details:\n- Receipt ID: ${p.id}\n- Date Received: ${p.paymentDate}\n- Payment Method: ${p.paymentMethod}\n- Amount Settled: ₦${p.amount.toLocaleString()}\n\nThank you for choosing Stanford Academy.\n\nWarm regards,\nStanford Academy Financial Desk`;
    
    setParentEmailAddress(pEmail);
    setEmailSubject(subject);
    setEmailBody(body);
    setIsEmailOpen(true);
  };

  const handleLaunchEmail = () => {
    const mailtoUrl = `mailto:${parentEmailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
    setIsEmailOpen(false);
  };

  // Drag handles for Mobile Settle Button (one-handed swipe track)
  const handleSwipeDrag = (e: any, info: any) => {
    if (!swipeTrackRef.current) return;
    const width = swipeTrackRef.current.clientWidth - 56; // track width minus thumb width
    const percentage = Math.min(100, Math.max(0, (info.offset.x / width) * 100));
    setSwipeProgress(percentage);
    
    if (info.offset.x >= width * 0.95 && !savingPayment) {
      handleMobileSwipeSettle();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Lucide.Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-semibold">Loading Payment Processing Engine...</p>
        <p className="text-xs text-slate-400 mt-1">Acquiring terminal state, receipts, and advance logs</p>
      </div>
    );
  }

  return (
    <div id="payment-collection-workspace" className="space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-150 rounded-xl p-4 text-xs font-semibold text-rose-700 flex items-center space-x-2">
          <Lucide.AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* VIEW TOGGLE BANNER */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <Lucide.Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Desk System Interface Selector</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Toggle between Desktop workstation ledger and simulated mobile handset POS views.</p>
          </div>
        </div>

        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shrink-0">
          <button
            onClick={() => {
              setViewMode('desktop');
              setSelectedStudent(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === 'desktop' ? 'bg-white text-slate-950 shadow-xs font-extrabold' : 'text-slate-400 hover:text-slate-100'}`}
          >
            <Lucide.Monitor className="w-3.5 h-3.5" />
            Desktop Console
          </button>
          <button
            onClick={() => {
              setViewMode('mobile_terminal');
              setSelectedStudent(null);
              setMobileStep('select_student');
              setAmount('');
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === 'mobile_terminal' ? 'bg-white text-slate-950 shadow-xs font-extrabold' : 'text-slate-400 hover:text-slate-100'}`}
          >
            <Lucide.Smartphone className="w-3.5 h-3.5 text-indigo-500" />
            Mobile Terminal
          </button>
        </div>
      </div>

      {/* VIEW RENDER: STANDARD DESKTOP WORKSPACE */}
      {viewMode === 'desktop' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                <Lucide.HandCoins className="w-7 h-7 text-indigo-600 mr-2.5" />
                Payment Collection Desk
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Collect school fees, apply waivers, record bank transfers/POS reference numbers, and generate dual printer-optimized receipts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: STUDENT LOOKUP & NEW TRANSACTION FORM */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SEARCH & SELECT SECTION */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      1. Select Billing Account Desk Type
                    </label>
                    <p className="text-[10px] text-slate-450">Collect individual student tuition or group multi-child family balances.</p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setDeskType('student');
                        setStudentSearch('');
                        setSelectedStudent(null);
                        setSelectedFamily(null);
                        setAmount('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${deskType === 'student' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      👧 Single Student
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeskType('family');
                        setFamilySearch('');
                        setSelectedStudent(null);
                        setSelectedFamily(null);
                        setAmount('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${deskType === 'family' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      👨‍👩‍👧 Family Account
                    </button>
                  </div>
                </div>

                {deskType === 'student' ? (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type student name, parental contact name, or ADM code..."
                        value={studentSearch}
                        onChange={(e) => {
                          setStudentSearch(e.target.value);
                          if (selectedStudent) setSelectedStudent(null);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 pl-9 pr-4 py-3 outline-none focus:border-indigo-500 transition-colors"
                      />
                      <Lucide.Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>

                    {/* Dropdown list for matching students */}
                    {filteredStudents.length > 0 && !selectedStudent && (
                      <div className="absolute left-5 right-5 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                        {filteredStudents.map(s => {
                          const studentLedgers = ledgers.filter(l => l.studentId === s.id && l.outstanding > 0);
                          const totalOutstanding = studentLedgers.reduce((sum, l) => sum + l.outstanding, 0);

                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSelectedStudent(s);
                                setStudentSearch(s.name);
                              }}
                              className="w-full text-left p-3 hover:bg-indigo-50/40 transition-colors flex justify-between items-center cursor-pointer"
                            >
                              <div>
                                <p className="text-xs font-black text-slate-900">{s.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Grade: <strong className="text-slate-700">{s.grade}</strong> | Parent: <strong className="text-slate-700">{s.parentName || 'None'}</strong>
                                </p>
                              </div>
                              <div className="text-right">
                                {totalOutstanding > 0 ? (
                                  <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded border border-amber-100">
                                    ₦{totalOutstanding.toLocaleString()} Due
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded border border-emerald-100">
                                    Clear
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Selected Student Profile Banner */}
                    {selectedStudent && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-black text-slate-900">{selectedStudent.name}</h3>
                            <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                              {selectedStudent.grade}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 space-y-0.5 font-semibold">
                            <p>Parent: <span className="text-slate-700">{selectedStudent.parentName || 'N/A'}</span></p>
                            <p>Contact: <span className="text-slate-700">{selectedStudent.parentPhone || 'N/A'}</span></p>
                            <p className="text-slate-400 font-mono text-[9px] mt-1">ID: {selectedStudent.id}</p>
                          </div>
                        </div>

                        <div className="flex gap-4 self-stretch md:self-auto justify-between border-t md:border-t-0 border-slate-200/65 pt-3 md:pt-0">
                          <div className="text-left md:text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Balance</p>
                            <p className={`text-sm font-black mt-0.5 ${studentStats.outstanding > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                              ₦{studentStats.outstanding.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-end gap-1">
                              <span>Advance Balance</span>
                              <button
                                onClick={() => setIsCreditModalOpen(true)}
                                className="p-0.5 bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-700 cursor-pointer"
                                title="Add direct advance credit"
                              >
                                <Lucide.Plus className="w-3 h-3" />
                              </button>
                            </p>
                            <p className={`text-sm font-black mt-0.5 ${studentStats.credits > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                              ₦{studentStats.credits.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type Family Name, Parent Contact, or Family ID..."
                        value={familySearch}
                        onChange={(e) => {
                          setFamilySearch(e.target.value);
                          if (selectedFamily) setSelectedFamily(null);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 pl-9 pr-4 py-3 outline-none focus:border-indigo-500 transition-colors"
                      />
                      <Lucide.Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>

                    {/* Dropdown list for matching families */}
                    {filteredFamilies.length > 0 && !selectedFamily && (
                      <div className="absolute left-5 right-5 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                        {filteredFamilies.map(f => {
                          const childRelations = familyMembers.filter(m => m.familyAccountId === f.id);
                          const studentIds = childRelations.map(m => m.studentId);
                          const familyLedgers = ledgers.filter(l => studentIds.includes(l.studentId) && l.outstanding > 0);
                          const totalOutstanding = familyLedgers.reduce((sum, l) => sum + l.outstanding, 0);

                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                setSelectedFamily(f);
                                setFamilySearch(f.familyName);
                              }}
                              className="w-full text-left p-3 hover:bg-indigo-50/40 transition-colors flex justify-between items-center cursor-pointer"
                            >
                              <div>
                                <p className="text-xs font-black text-slate-900">{f.familyName}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Parent: <strong className="text-slate-700">{f.primaryParentName || 'None'}</strong> | Children: <span className="text-slate-400">{f.childrenNames || 'None'}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                {totalOutstanding > 0 ? (
                                  <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded border border-amber-100">
                                    ₦{totalOutstanding.toLocaleString()} Due
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded border border-emerald-100">
                                    Clear
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Selected Family Profile Banner */}
                    {selectedFamily && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-black text-slate-900">{selectedFamily.familyName}</h3>
                            <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              👨‍👩‍👧 Family Group
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 space-y-0.5 font-semibold">
                            <p>Parent: <span className="text-slate-700">{selectedFamily.primaryParentName || 'N/A'}</span></p>
                            <p>Phone: <span className="text-slate-700">{selectedFamily.primaryParentPhone || 'N/A'}</span></p>
                            <p className="flex flex-wrap gap-1 mt-1 items-center">
                              <span className="text-[9px] text-slate-400 mr-1">Linked Pupils:</span>
                              {(selectedFamily.childrenNames || '').split(',').map((child: string, i: number) => (
                                <span key={i} className="bg-slate-200/80 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  {child.trim()}
                                </span>
                              ))}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4 self-stretch md:self-auto justify-between border-t md:border-t-0 border-slate-200/65 pt-3 md:pt-0 shrink-0">
                          <div className="text-left md:text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Balance</p>
                            <p className={`text-sm font-black mt-0.5 ${studentStats.outstanding > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                              ₦{studentStats.outstanding.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              Family Credits
                            </p>
                            <p className={`text-sm font-black mt-0.5 ${studentStats.credits > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                              ₦{studentStats.credits.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* MAIN payment collection form */}
              {((deskType === 'student' && selectedStudent) || (deskType === 'family' && selectedFamily)) ? (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleCollectPayment}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6"
                >
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100 flex items-center gap-2">
                    <Lucide.CreditCard className="w-4 h-4 text-indigo-600" />
                    2. Transaction Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* AMOUNT FIELD */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Collection Amount (₦) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="e.g. 150000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 px-3.5 py-3 outline-none focus:border-indigo-500"
                          required
                          min="0"
                        />
                        <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">NGN</span>
                      </div>
                    </div>

                    {/* PAYMENT METHOD */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Payment Method / Desk Type *
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 px-3.5 py-3 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Cash">💵 Cash</option>
                        <option value="Transfer">🏦 Bank Transfer</option>
                        <option value="POS">💳 POS Terminal</option>
                        <option value="Waiver">🎁 Waiver / Scholarship Credit</option>
                        <option value="Advance Credit">🌟 Apply Advance Credit Balance</option>
                      </select>
                    </div>
                  </div>

                  {/* PAYMENT CONDITIONAL SUB-FIELDS */}
                  {paymentMethod === 'Transfer' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                    >
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bank Transfer Specifications</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Reference No / Tx Hash</label>
                          <input
                            type="text"
                            placeholder="e.g. TRF-902341-NIBSS"
                            value={referenceNo}
                            onChange={(e) => setReferenceNo(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Transaction Date</label>
                          <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === 'POS' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                    >
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">POS Terminal Receipt Log</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">POS Approval Code / STAN</label>
                          <input
                            type="text"
                            placeholder="e.g. STAN-091223 / Terminal A"
                            value={referenceNo}
                            onChange={(e) => setReferenceNo(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Terminal Processing Date</label>
                          <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === 'Waiver' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-1"
                    >
                      <p className="text-xs font-black flex items-center gap-1.5 text-amber-800">
                        <Lucide.Gift className="w-4 h-4 shrink-0 text-amber-600" />
                        Waiver &amp; Grant Registry
                      </p>
                      <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
                        Waivers represent direct billing write-offs. No monetary transfer occurs, but the selected invoices will be write-down adjusted directly inside the ledger.
                      </p>
                    </motion.div>
                  )}

                  {paymentMethod === 'Advance Credit' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl space-y-1.5"
                    >
                      <p className="text-xs font-black flex items-center gap-1.5 text-emerald-800">
                        <Lucide.Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                        Apply Accumulated Advance Balance
                      </p>
                      <p className="text-[10px] text-emerald-700 leading-relaxed font-semibold">
                        This account has a credit pool of <strong className="text-emerald-900 font-extrabold">₦{studentStats.credits.toLocaleString()}</strong>.
                        Charging ₦{amount ? Number(amount).toLocaleString() : '0'} to this credit balance will deplete the pool oldest credit first and apply the settled funds to unpaid invoices.
                      </p>
                    </motion.div>
                  )}

                  {/* OVERPAYMENT NOTICE */}
                  {amount && Number(amount) > studentStats.outstanding && paymentMethod !== 'Waiver' && paymentMethod !== 'Advance Credit' && (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                      <p className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                        <Lucide.Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                        Overpayment Captured (Advance Deposit Trigger)
                      </p>
                      <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                        The entered payment of ₦{Number(amount).toLocaleString()} is greater than the total outstanding balance of ₦{studentStats.outstanding.toLocaleString()}.
                        The remaining excess of <span className="font-extrabold text-indigo-900">₦{(Number(amount) - studentStats.outstanding).toLocaleString()}</span> will be automatically saved as an Advance Credit under this parent/student profile.
                      </p>
                    </div>
                  )}

                  {/* ALLOCATION METHOD & MANUAL INVOICE ALLOCATIONS */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-800">Invoice Funds Allocation Wizard</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Determine how collected funds are split across outstanding child ledgers.</p>
                      </div>
                      <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAutoAllocate(true)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${autoAllocate ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Auto-Wizard
                        </button>
                        <button
                          type="button"
                          onClick={() => setAutoAllocate(false)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${!autoAllocate ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Manual Allocation
                        </button>
                      </div>
                    </div>

                    {autoAllocate ? (
                      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Select Automatic Allocation Rule
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            {[
                              { id: 'oldest_first', label: '⏳ Oldest First (FIFO)', desc: 'Prioritizes oldest unpaid bills.' },
                              { id: 'highest_outstanding', label: '📈 Highest Outstanding', desc: 'Settle largest bills first.' },
                              { id: 'lowest_outstanding', label: '📉 Lowest Outstanding', desc: 'Wipe small bills first.' },
                              { id: 'even_distribution', label: '⚖️ Even Distribution', desc: 'Split funds evenly.' }
                            ].map(rule => (
                              <button
                                key={rule.id}
                                type="button"
                                onClick={() => setAllocationRule(rule.id as any)}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${allocationRule === rule.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                              >
                                <span className="text-[10px] font-black block">{rule.label}</span>
                                <span className={`text-[9px] mt-1 block leading-tight ${allocationRule === rule.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                  {rule.desc}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="text-[10px] text-indigo-700 font-semibold italic flex items-center gap-1.5 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/40">
                          <Lucide.RefreshCcw className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
                          <span>Real-time Live Wizard Allocator previewing selected strategy below. Overpayments automatically go to parent credit pool.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Adjust the exact amount of funds to apply manually to each outstanding ledger.
                        </p>
                        <p className="text-[11px] font-black text-slate-700 mt-1">
                          Total Distributed: <strong className="text-indigo-600 font-extrabold">₦{totalManualAllocated.toLocaleString()}</strong> of <strong className="text-slate-800">₦{Number(amount || 0).toLocaleString()}</strong>
                        </p>
                      </div>
                    )}

                    {/* INVOICE LIST WITH PREVIEW & EDITING */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {autoAllocate ? 'Allocation Live Preview Ledger' : 'Ledger Allocation Control'}
                      </h5>

                      {studentStats.ledgers.filter(l => l.outstanding > 0).length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          No active unpaid ledgers available.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {studentStats.ledgers.filter(l => l.outstanding > 0).map(ledger => {
                            const allocatedAmt = Number(manualAllocations[ledger.id]) || 0;
                            const finalOutstanding = Math.max(0, ledger.outstanding - allocatedAmt);
                            const val = manualAllocations[ledger.id] || '';

                            return (
                              <div key={ledger.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-white border border-slate-200 rounded-xl gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-[11px] font-black text-slate-900">Term Invoice {ledger.id}</span>
                                    <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                                      {ledger.studentName || 'Pupil Ledger'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                                    Outstanding: <strong className="text-slate-600">₦{ledger.outstanding.toLocaleString()}</strong> 
                                    {allocatedAmt > 0 && (
                                      <span className="ml-1 text-[10px]">
                                        → New Due: <strong className="text-amber-800 font-extrabold">₦{finalOutstanding.toLocaleString()}</strong>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="w-full sm:w-44 shrink-0 relative flex items-center justify-end">
                                  {autoAllocate ? (
                                    <div className="bg-indigo-50/60 border border-indigo-100 px-3 py-2 rounded-lg text-right w-full flex justify-between items-center">
                                      <span className="text-[9px] font-bold text-indigo-400">Allocated:</span>
                                      <strong className="text-xs text-indigo-700 font-extrabold">₦{allocatedAmt.toLocaleString()}</strong>
                                    </div>
                                  ) : (
                                    <div className="relative w-full">
                                      <input
                                        type="number"
                                        placeholder="₦0"
                                        value={val}
                                        onChange={(e) => handleManualAllocationChange(ledger.id, e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 px-3 py-2 text-right outline-none focus:border-indigo-500"
                                      />
                                      <span className="absolute left-2.5 top-2 text-[10px] font-bold text-slate-400">Apply</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MEMO NOTES */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Transaction Notes / Memo Details
                    </label>
                    <textarea
                      placeholder="Memo (e.g. Sibling Tuition Payment for Term 1, terminal code logs etc.)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 px-3.5 py-3 outline-none focus:border-indigo-500 h-20 resize-none"
                    />
                  </div>

                  {/* FORM SUBMISSION */}
                  <button
                    type="submit"
                    disabled={savingPayment}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:bg-slate-300 flex items-center justify-center space-x-1.5"
                  >
                    {savingPayment ? (
                      <>
                        <Lucide.Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Financial Settlement...</span>
                      </>
                    ) : (
                      <>
                        <Lucide.CheckSquare className="w-4 h-4" />
                        <span>Generate &amp; Issue Receipt (₦{amount ? Number(amount).toLocaleString() : '0.00'})</span>
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 py-20 text-center text-slate-400 shadow-xs">
                  <Lucide.UserCheck className="w-12 h-12 mx-auto text-indigo-400 mb-3" />
                  <p className="text-sm font-semibold">Ready to Collect Payment</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Please search and select a billing account (Single Student or Family Account) using the panel above to begin posting and allocating fees.
                  </p>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: RECENT PAYMENTS HISTORICAL LOGS */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col h-[650px]">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Lucide.History className="w-4 h-4 text-slate-500" />
                    Desk Payment Receipts Log
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Review desk collections and reprint historical invoices.</p>
                  
                  <div className="relative mt-3">
                    <input
                      type="text"
                      placeholder="Search receipt ID, student, method..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 pl-8 pr-3 py-2 outline-none focus:border-indigo-500"
                    />
                    <Lucide.Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1">
                  {filteredPaymentsHistory.length === 0 ? (
                    <div className="text-center py-12 text-slate-300">
                      <Lucide.Receipt className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                      No payments logged
                    </div>
                  ) : (
                    filteredPaymentsHistory.map(p => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 rounded-xl transition-colors flex justify-between items-center"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-900 truncate">{p.studentName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-tight">{p.id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] bg-slate-200 text-slate-700 font-bold px-1 py-0.2 rounded uppercase tracking-wider">
                              {p.paymentMethod}
                            </span>
                            <span className="text-[9px] text-slate-500 font-semibold">{p.paymentDate}</span>
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-xs font-black text-slate-900">₦{p.amount.toLocaleString()}</p>
                          <button
                            onClick={() => handleOpenReceipt(p)}
                            className="mt-1 text-[9px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center justify-end gap-0.5 cursor-pointer"
                          >
                            <Lucide.Printer className="w-3 h-3" />
                            Reprint
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* VIEW RENDER: REVOLUTIONARY TACTILE MOBILE SYSTEM */}
      {viewMode === 'mobile_terminal' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[750px] py-4 bg-slate-100 rounded-3xl border border-slate-200 relative overflow-hidden"
        >
          {/* CONTROL RACK FOR OPERATOR OR VIEWING STATE */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 items-center justify-between z-10">
            {/* Operator Persona selection */}
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Operator Role:</span>
              <select
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value as OperatorRole)}
                className="bg-transparent border-none text-[11px] font-black text-indigo-700 outline-none pr-2 cursor-pointer"
              >
                <option value="Accountant">💼 Accountant Desk</option>
                <option value="Principal">🎓 Principal Walk</option>
                <option value="Administrator">👑 Administrator Panel</option>
              </select>
            </div>

            {/* Quick Helper reset button */}
            <button
              onClick={() => {
                setSelectedStudent(null);
                setAmount('');
                setMobileStep('select_student');
                setCreatedPaymentMobile(null);
              }}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black hover:bg-slate-800 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Lucide.RefreshCw className="w-3 h-3" />
              Reset App
            </button>
          </div>

          {/* SIMULATED MODERN HANDHELD DEVICE BOX */}
          <div className="w-[375px] h-[720px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl relative border-4 border-slate-800 ring-12 ring-slate-900 flex flex-col overflow-hidden my-12">
            
            {/* PHONE TOP NOTCH BUBBLE */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-full z-40 flex items-center justify-around px-4">
              <div className="w-3.5 h-3.5 bg-slate-900 rounded-full border border-slate-800"></div>
              <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
            </div>

            {/* HANDSET SCREEN INNER CONTENT AREA (TAILWIND STYLED APP CONTAINER) */}
            <div className="flex-1 bg-slate-50 rounded-[38px] overflow-hidden flex flex-col relative text-slate-800 font-sans shadow-inner select-none">
              
              {/* STATUS BAR */}
              <div className="h-10 bg-slate-900 text-white flex justify-between items-center px-6 pt-2 shrink-0 text-[10px] font-bold tracking-tight">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.2 rounded font-black uppercase tracking-wider scale-90 origin-right">
                    {simulatedRole} Mode
                  </span>
                  <Lucide.Wifi className="w-3 h-3 text-slate-200" />
                  <Lucide.Battery className="w-3.5 h-3.5 text-slate-200" />
                </div>
              </div>

              {/* SIMULATED APPLICATION APP BAR */}
              <div className="bg-white border-b border-slate-200/60 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <Lucide.Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-tight">SAMS Handheld POS</h4>
                    <p className="text-[8px] text-indigo-600 font-bold tracking-widest uppercase">Safe Ledger v2</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[8px] font-bold text-slate-400">POS-ONLINE</span>
                </div>
              </div>

              {/* STEP WORKFLOW SCREENS */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col relative">
                
                {/* 1. STEP SELECT STUDENT */}
                {mobileStep === 'select_student' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col space-y-3"
                  >
                    <div className="space-y-1">
                      <span className="text-[8px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">Step 1 of 4</span>
                      <h3 className="text-xs font-black text-slate-900">Identify Billing Account</h3>
                      <p className="text-[9px] text-slate-400">Search student name or parent family accounts.</p>
                    </div>

                    {/* Tactical Desk Switcher for Handheld One-Hand use */}
                    <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-300/80 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setDeskType('student');
                          setStudentSearch('');
                          setSelectedStudent(null);
                          setSelectedFamily(null);
                        }}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${deskType === 'student' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'}`}
                      >
                        👧 Pupil
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeskType('family');
                          setFamilySearch('');
                          setSelectedStudent(null);
                          setSelectedFamily(null);
                        }}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${deskType === 'family' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'}`}
                      >
                        👨‍👩‍👧 Family
                      </button>
                    </div>

                    {deskType === 'student' ? (
                      <>
                        {/* Simple pupil search bar */}
                        <div className="relative shrink-0">
                          <input
                            type="text"
                            placeholder="Type student name..."
                            value={studentSearch}
                            onChange={(e) => {
                              setStudentSearch(e.target.value);
                              if (selectedStudent) setSelectedStudent(null);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-850 pl-9 pr-3 py-2.5 outline-none focus:border-indigo-500 transition-all shadow-xs"
                          />
                          <Lucide.Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Simple family search bar */}
                        <div className="relative shrink-0">
                          <input
                            type="text"
                             placeholder="Type family name..."
                            value={familySearch}
                            onChange={(e) => {
                              setFamilySearch(e.target.value);
                              if (selectedFamily) setSelectedFamily(null);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-850 pl-9 pr-3 py-2.5 outline-none focus:border-indigo-500 transition-all shadow-xs"
                          />
                          <Lucide.Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        </div>
                      </>
                    )}

                    {/* Instant Matching Results Scroll List */}
                    <div className="flex-1 overflow-y-auto space-y-2 min-h-[220px]">
                      {deskType === 'student' ? (
                        filteredStudents.length > 0 ? (
                          filteredStudents.map(s => {
                            const studentLedgers = ledgers.filter(l => l.studentId === s.id && l.outstanding > 0);
                            const totalOutstanding = studentLedgers.reduce((sum, l) => sum + l.outstanding, 0);

                            return (
                              <motion.button
                                whileTap={{ scale: 0.98 }}
                                key={s.id}
                                onClick={() => {
                                  setSelectedStudent(s);
                                  setStudentSearch(s.name);
                                  setMobileStep('amount_keypad');
                                }}
                                className="w-full text-left p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-indigo-400 transition-colors flex justify-between items-center cursor-pointer"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-xs font-black text-slate-900 truncate">{s.name}</p>
                                  <p className="text-[9px] text-slate-500 mt-0.5 font-semibold truncate">
                                    Grade {s.grade} • {s.parentName || 'No Parent Name'}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  {totalOutstanding > 0 ? (
                                    <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 font-extrabold px-2 py-1 rounded-lg">
                                      ₦{totalOutstanding.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold px-2 py-1 rounded-lg">
                                      Clear
                                    </span>
                                  )}
                                </div>
                              </motion.button>
                            );
                          })
                        ) : studentSearch.trim() !== '' ? (
                          <div className="text-center py-8 text-slate-400 text-xs">
                            <Lucide.UserX className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            No student account matched.
                          </div>
                        ) : (
                          // Quick list of top default students to prompt selection
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quick Suggestions</p>
                            {students.slice(0, 4).map(s => {
                              const studentLedgers = ledgers.filter(l => l.studentId === s.id && l.outstanding > 0);
                              const totalOutstanding = studentLedgers.reduce((sum, l) => sum + l.outstanding, 0);
                              return (
                                <button
                                  key={s.id}
                                  onClick={() => {
                                    setSelectedStudent(s);
                                    setStudentSearch(s.name);
                                    setMobileStep('amount_keypad');
                                  }}
                                  className="w-full text-left p-3 bg-white hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs flex justify-between items-center cursor-pointer"
                                >
                                  <span className="font-extrabold text-slate-800">{s.name}</span>
                                  <span className="text-[10px] font-black text-slate-500">₦{totalOutstanding.toLocaleString()}</span>
                                </button>
                              );
                            })}
                          </div>
                        )
                      ) : (
                        filteredFamilies.length > 0 ? (
                          filteredFamilies.map(f => {
                            const childRelations = familyMembers.filter(m => m.familyAccountId === f.id);
                            const studentIds = childRelations.map(m => m.studentId);
                            const familyLedgers = ledgers.filter(l => studentIds.includes(l.studentId) && l.outstanding > 0);
                            const totalOutstanding = familyLedgers.reduce((sum, l) => sum + l.outstanding, 0);

                            return (
                              <motion.button
                                whileTap={{ scale: 0.98 }}
                                key={f.id}
                                onClick={() => {
                                  setSelectedFamily(f);
                                  setFamilySearch(f.familyName);
                                  setMobileStep('amount_keypad');
                                }}
                                className="w-full text-left p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-indigo-400 transition-colors flex justify-between items-center cursor-pointer"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-xs font-black text-slate-900 truncate">{f.familyName}</p>
                                  <p className="text-[9px] text-slate-500 mt-0.5 font-semibold truncate">
                                    Parent: {f.primaryParentName || 'None'} • Children: {f.childrenNames}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  {totalOutstanding > 0 ? (
                                    <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 font-extrabold px-2 py-1 rounded-lg">
                                      ₦{totalOutstanding.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold px-2 py-1 rounded-lg">
                                      Clear
                                    </span>
                                  )}
                                </div>
                              </motion.button>
                            );
                          })
                        ) : familySearch.trim() !== '' ? (
                          <div className="text-center py-8 text-slate-400 text-xs">
                            <Lucide.UserX className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            No family account matched.
                          </div>
                        ) : (
                          // Quick list of top default families to prompt selection
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quick Suggestions</p>
                            {families.slice(0, 4).map(f => {
                              const childRelations = familyMembers.filter(m => m.familyAccountId === f.id);
                              const studentIds = childRelations.map(m => m.studentId);
                              const familyLedgers = ledgers.filter(l => studentIds.includes(l.studentId) && l.outstanding > 0);
                              const totalOutstanding = familyLedgers.reduce((sum, l) => sum + l.outstanding, 0);
                              return (
                                <button
                                  key={f.id}
                                  onClick={() => {
                                    setSelectedFamily(f);
                                    setFamilySearch(f.familyName);
                                    setMobileStep('amount_keypad');
                                  }}
                                  className="w-full text-left p-3 bg-white hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs flex justify-between items-center cursor-pointer"
                                >
                                  <span className="font-extrabold text-slate-800">{f.familyName}</span>
                                  <span className="text-[10px] font-black text-slate-500">₦{totalOutstanding.toLocaleString()}</span>
                                </button>
                              );
                            })}
                          </div>
                        )
                      )}
                    </div>

                    {/* Operator quick welcome hint box */}
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1 mt-auto shrink-0">
                      <p className="text-[10px] font-black text-indigo-950 flex items-center gap-1">
                        <Lucide.Info className="w-3.5 h-3.5 text-indigo-600" />
                        Handheld Ledger Desk
                      </p>
                      <p className="text-[9px] text-indigo-700 font-semibold leading-relaxed">
                        Authorized: <strong>{simulatedRole}</strong>. Walk through classrooms or billing queues to tag and process real-time school fees.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* 2. STEP AMOUNT KEYPAD (ONE-HAND OPTIMIZED TRANSITIONAL CONTROLS) */}
                {mobileStep === 'amount_keypad' && (selectedStudent || selectedFamily) && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 flex flex-col space-y-3"
                  >
                    {/* Header summary of selected account */}
                    <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex justify-between items-center gap-2 relative animate-fadeIn">
                      <button
                        onClick={() => {
                          setMobileStep('select_student');
                          setSelectedStudent(null);
                          setSelectedFamily(null);
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg absolute -top-1 -left-1"
                        title="Back to search"
                      >
                        <Lucide.ArrowLeft className="w-3 h-3" />
                      </button>

                      <div className="min-w-0 pl-3">
                        <p className="text-[8px] text-indigo-400 font-black uppercase tracking-wider">Tagged Account</p>
                        <h4 className="text-[11px] font-black truncate">
                          {deskType === 'student' ? selectedStudent?.name : selectedFamily?.familyName}
                        </h4>
                        <p className="text-[8px] text-slate-400 font-semibold mt-0.5 truncate">
                          {deskType === 'student' ? `Grade: ${selectedStudent?.grade}` : `Parent: ${selectedFamily?.primaryParentName}`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[8px] text-amber-400 font-black uppercase tracking-wider">Due Outstanding</p>
                        <p className="text-xs font-black text-amber-300">₦{studentStats.outstanding.toLocaleString()}</p>
                        {studentStats.credits > 0 && (
                          <p className="text-[8px] text-emerald-400 font-bold mt-0.5">Credit: ₦{studentStats.credits.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    {/* AMOUNT DISPLAY PANEL */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-xs">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Collection Amount (₦)</span>
                      <div className="text-xl font-black text-indigo-950 font-mono tracking-tight mt-1 truncate">
                        ₦{(Number(amount) || 0).toLocaleString()}
                      </div>
                    </div>

                    {/* PAYMENT METHOD SLIDE/CHIPS */}
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Select Payment Channel</span>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
                        {(['Cash', 'Transfer', 'POS', 'Waiver', 'Advance Credit'] as const).map(m => {
                          const iconMap = {
                            Cash: '💵',
                            Transfer: '🏦',
                            POS: '💳',
                            Waiver: '🎁',
                            'Advance Credit': '🌟'
                          };
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setPaymentMethod(m);
                                if (m === 'Advance Credit') {
                                  // limit amount to credits pool if current is larger
                                  if (Number(amount) > studentStats.credits) {
                                    setAmount(studentStats.credits.toString());
                                  }
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black shrink-0 snap-start border transition-all cursor-pointer ${paymentMethod === m ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-600 border-slate-200'}`}
                            >
                              <span>{iconMap[m]} {m === 'Advance Credit' ? 'Wallet' : m}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* METHOD CONDITIONAL DETAILS INPUTS */}
                    {(paymentMethod === 'Transfer' || paymentMethod === 'POS') && (
                      <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200/50 space-y-1 animate-fadeIn">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">
                            {paymentMethod === 'Transfer' ? 'Transfer Reference Hash' : 'POS STAN Code'} *
                          </span>
                          <span className="text-[7px] text-slate-400 font-mono uppercase">REQ</span>
                        </div>
                        <input
                          type="text"
                          placeholder={paymentMethod === 'Transfer' ? 'e.g. TRF-NIBSS-9023' : 'e.g. STAN-891022'}
                          value={referenceNo}
                          onChange={(e) => setReferenceNo(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg text-[10px] font-bold px-2 py-1.5 outline-none"
                          required
                        />
                      </div>
                    )}

                    {/* ONE-HAND TOUCH PRESET SHORTCUT CHIPS */}
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      <button
                        onClick={() => handleApplyPreset('outstanding')}
                        className="py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Copy entire outstanding due sum"
                      >
                        Full Due
                      </button>
                      <button
                        onClick={() => handleApplyPreset('5k')}
                        className="py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-extrabold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        +5k
                      </button>
                      <button
                        onClick={() => handleApplyPreset('20k')}
                        className="py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-extrabold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        +20k
                      </button>
                      <button
                        onClick={() => handleApplyPreset('50k')}
                        className="py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-extrabold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        +50k
                      </button>
                      <button
                        onClick={() => handleApplyPreset('100k')}
                        className="py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-extrabold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        +100k
                      </button>
                    </div>

                    {/* HIGH-CONTRAST DIGITAL KEYPAD (STRICTLY ONE-HAND TOUCH OPTIMIZED) */}
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-200/50 p-2 rounded-2xl">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          key={k}
                          type="button"
                          onClick={() => handleKeypadPress(k)}
                          className={`py-3 rounded-xl font-bold font-mono text-sm transition-all shadow-xs flex items-center justify-center cursor-pointer ${k === 'C' ? 'bg-rose-50 text-rose-700 border border-rose-100 font-extrabold' : k === '⌫' ? 'bg-amber-50 text-amber-700 border border-amber-100 font-extrabold' : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/50 font-black'}`}
                        >
                          {k}
                        </motion.button>
                      ))}
                    </div>

                    {/* OVERPAYMENT ALERTS */}
                    {amount && Number(amount) > studentStats.outstanding && paymentMethod !== 'Waiver' && paymentMethod !== 'Advance Credit' && (
                      <div className="bg-indigo-50 text-indigo-950 p-2 rounded-xl text-[8px] font-bold leading-normal border border-indigo-100">
                        Overpayment of ₦{(Number(amount) - studentStats.outstanding).toLocaleString()} will fund this account's prepaid wallet.
                      </div>
                    )}

                    {/* PRIMARY FORWARD BUTTON */}
                    <button
                      onClick={() => {
                        const numericAmt = Number(amount);
                        if (isNaN(numericAmt) || numericAmt <= 0) {
                          setToast({ message: "Please specify a payment amount first.", type: "warning" });
                          return;
                        }
                        if (paymentMethod === 'Advance Credit' && numericAmt > studentStats.credits) {
                          setToast({ message: `Insufficient Credit pool. Max: ₦${studentStats.credits.toLocaleString()}`, type: "warning" });
                          return;
                        }
                        if ((paymentMethod === 'Transfer' || paymentMethod === 'POS') && !referenceNo) {
                          setToast({ message: "Please specify reference / STAN code.", type: "warning" });
                          return;
                        }
                        setMobileStep('confirm_swipe');
                      }}
                      className="w-full py-3.5 bg-indigo-600 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:bg-indigo-700 transition-colors shrink-0"
                    >
                      <span>Review &amp; Settle Ledger</span>
                      <Lucide.ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* 3. STEP CONFIRM SWIPE (DRAG TRACK TO TRIGGER FINANCIAL COMMIT) */}
                {mobileStep === 'confirm_swipe' && (selectedStudent || selectedFamily) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col space-y-4"
                  >
                    <div className="space-y-1">
                      <span className="text-[8px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">Step 3 of 4</span>
                      <h3 className="text-sm font-black text-slate-900">Confirm Payment Settlement</h3>
                      <p className="text-[10px] text-slate-400">Carefully verify financial details before locking transaction records.</p>
                    </div>

                    {/* DETAILED LEDGER SLIP CARD */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 flex-1 overflow-y-auto">
                      <div className="text-center pb-3 border-b border-dashed border-slate-200">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Settlement Value</span>
                        <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                          ₦{Number(amount).toLocaleString()}
                        </h2>
                        <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold px-2 py-0.5 rounded-md mt-1.5 inline-block">
                          {paymentMethod} Desk
                        </span>
                      </div>

                      <div className="space-y-2 text-[10px] font-semibold divide-y divide-slate-100">
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-slate-400">{deskType === 'student' ? 'Target Pupil' : 'Family Account'}</span>
                          <span className="text-slate-800 font-extrabold text-right truncate max-w-[150px]">
                            {deskType === 'student' ? selectedStudent?.name : selectedFamily?.familyName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-slate-400">{deskType === 'student' ? 'Grade Class' : 'Linked Children'}</span>
                          <span className="text-slate-800 font-extrabold text-right truncate max-w-[150px]">
                            {deskType === 'student' ? selectedStudent?.grade : selectedFamily?.childrenNames}
                          </span>
                        </div>
                        {referenceNo && (
                          <div className="flex justify-between items-center py-1.5 font-mono">
                            <span className="text-slate-400">Reference Hash</span>
                            <span className="text-slate-800 font-extrabold text-[9px] truncate max-w-[140px] uppercase">{referenceNo}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-slate-400">System Handover</span>
                          <span className="text-emerald-700 font-extrabold">FIFO Auto-Allocate</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-slate-400">Terminal Node</span>
                          <span className="text-slate-500 font-mono">NODE-PHONE-SAMS</span>
                        </div>
                      </div>

                      {/* Micro Warning audit text */}
                      <div className="p-2.5 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl text-[8px] font-semibold leading-relaxed">
                        ⚠️ Auditable records: Once swiped, this transaction executes server-side, committing ledgers immediately.
                      </div>
                    </div>

                    {/* BACK TO RE-EDIT BUTTON */}
                    <button
                      onClick={() => setMobileStep('amount_keypad')}
                      className="w-full py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      ↩️ Edit Amount or Method
                    </button>

                    {/* THE REVOLUTIONARY "SWIPE TO CONFIRM SETTLE" TRACK */}
                    <div className="space-y-1 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                        <span>Swipe To Settle</span>
                        <span>{Math.round(swipeProgress)}%</span>
                      </div>
                      
                      <div
                        ref={swipeTrackRef}
                        className="relative w-full h-14 bg-slate-800 rounded-full border border-slate-700/80 overflow-hidden flex items-center justify-center"
                      >
                        <motion.div
                          drag="x"
                          dragConstraints={{ left: 0, right: 290 }} // matches 375px phone padding width constraints
                          dragElastic={0}
                          dragMomentum={false}
                          onDrag={handleSwipeDrag}
                          className="absolute left-1 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-lg"
                        >
                          {savingPayment ? (
                            <Lucide.Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Lucide.ChevronsRight className="w-5 h-5 animate-pulse" />
                          )}
                        </motion.div>
                        <span className="text-[10px] font-black text-slate-400 pointer-events-none select-none uppercase tracking-wider pl-6">
                          {savingPayment ? 'Writing Ledger...' : 'Slide right to lock payment'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. STEP RECEIPT ACTIONS (PDF, WHATSAPP, EMAIL, PRINT) */}
                {mobileStep === 'receipt_actions' && createdPaymentMobile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col space-y-3.5"
                  >
                    {/* Success Animation Header */}
                    <div className="text-center space-y-1">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
                        <Lucide.Check className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-black text-emerald-800">Payment Committed Successfully</h4>
                      <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">ID: {createdPaymentMobile.id}</p>
                    </div>

                    {/* MINI THERMAL SLIP LOG CARD */}
                    <div className="bg-[#fdfcf8] text-black border border-slate-300 p-3.5 rounded-xl font-mono text-[9px] shadow-sm space-y-2">
                      <div className="text-center border-b border-slate-300 pb-1.5 space-y-0.5">
                        <p className="font-bold">*** STANFORD ACADEMY ***</p>
                        <p className="text-[8px] text-slate-500">IKEJA CAMPUS, LAGOS</p>
                        <p className="font-bold">OFFICIAL DESK RECEIPT</p>
                      </div>

                      <div className="space-y-0.5 font-bold">
                        <p>REF NO : {createdPaymentMobile.id}</p>
                        <p>STUDENT: {createdPaymentMobile.studentName}</p>
                        <p>GRADE  : {selectedStudent?.grade}</p>
                        <p>VAL    : ₦{createdPaymentMobile.amount.toLocaleString()}</p>
                        <p>METHOD : {createdPaymentMobile.paymentMethod}</p>
                      </div>

                      <p className="text-center text-[7px] text-slate-500 border-t border-slate-300 pt-1.5 uppercase font-bold">
                        Processed via Mobile Handheld
                      </p>
                    </div>

                    {/* GRID OF ONE-HANDED SHARING ACTIONS */}
                    <div className="space-y-2.5">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Issue &amp; Share Receipt</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Print */}
                        <button
                          onClick={handlePrint}
                          className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Lucide.Printer className="w-5 h-5 text-indigo-600" />
                          <span className="text-[9px] font-black">Thermal Print</span>
                        </button>

                        {/* PDF */}
                        <button
                          onClick={() => {
                            // Opens printable duplicates
                            window.print();
                          }}
                          className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Lucide.FileText className="w-5 h-5 text-indigo-600" />
                          <span className="text-[9px] font-black">Save as PDF</span>
                        </button>

                        {/* WhatsApp */}
                        <button
                          onClick={() => initiateWhatsAppShare(createdPaymentMobile)}
                          className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Lucide.MessageCircle className="w-5 h-5 text-emerald-600 animate-pulse" />
                          <span className="text-[9px] font-black">WhatsApp Parent</span>
                        </button>

                        {/* Email */}
                        <button
                          onClick={() => initiateEmailShare(createdPaymentMobile)}
                          className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Lucide.Mail className="w-5 h-5 text-indigo-600" />
                          <span className="text-[9px] font-black">Email Receipt</span>
                        </button>
                      </div>
                    </div>

                    {/* START OVER BUTTON */}
                    <button
                      onClick={() => {
                        setSelectedStudent(null);
                        setAmount('');
                        setCreatedPaymentMobile(null);
                        setMobileStep('select_student');
                      }}
                      className="w-full py-3.5 bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-xs rounded-2xl shadow-md cursor-pointer transition-colors mt-auto shrink-0"
                    >
                      🔄 Start New Collection
                    </button>
                  </motion.div>
                )}

              </div>

              {/* HOME INDICATOR FOR ONE-HAND REACH (BOTTOM BAR) */}
              <div className="h-6 bg-white flex justify-center items-center shrink-0 border-t border-slate-100">
                <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* WHATSAPP MODAL OVERLAY (FOR DEEP LINK CONFIRMATION AND PHONE FIELD INTEGRATION) */}
      <AnimatePresence>
        {isWhatsAppOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setIsWhatsAppOpen(false)}
                className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400"
              >
                <Lucide.X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <Lucide.MessageCircle className="w-6 h-6 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">Send WhatsApp Notification</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parent Mobile Number (WhatsApp-ready)</label>
                  <input
                    type="text"
                    placeholder="e.g. +2348031234567"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold px-3 py-2 outline-none focus:border-indigo-500"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">Please include country prefix code (e.g., 234 for Nigeria).</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Message Draft Message</label>
                  <textarea
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 outline-none focus:border-indigo-500 h-28 resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleLaunchWhatsApp}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lucide.ExternalLink className="w-4 h-4" />
                  <span>Launch WhatsApp Client</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EMAIL MODAL OVERLAY (FOR DEEP LINK MAILTO & INTERACTIVE BROADCAST DRAFTING) */}
      <AnimatePresence>
        {isEmailOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setIsEmailOpen(false)}
                className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400"
              >
                <Lucide.X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <Lucide.Mail className="w-6 h-6 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">Email Receipt Dispatch Desk</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parent Recipient Email Address</label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    value={parentEmailAddress}
                    onChange={(e) => setParentEmailAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Header</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Body Description</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 outline-none focus:border-indigo-500 h-36 resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleLaunchEmail}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lucide.ExternalLink className="w-4 h-4" />
                  <span>Launch Mail Client (mailto)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DESKTOP MODAL 1: RECEIPT VISUALIZER WORKSPACE */}
      <AnimatePresence>
        {selectedPaymentForReceipt && receiptDetails && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl border border-slate-200 shadow-2xl relative flex flex-col my-8 overflow-hidden"
            >
              
              {/* MODAL WORKSPACE CONTROLS HEADER */}
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Lucide.Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Receipt Processing Terminal</h3>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">RECEIPT ID: {receiptDetails.id}</p>
                  </div>
                </div>

                {/* TAB SELECTOR FOR DIFFERENT RECEIPT DESIGNS */}
                <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-200/40 shrink-0">
                  <button
                    onClick={() => setReceiptTab('a4')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${receiptTab === 'a4' ? 'bg-white text-slate-950 shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Lucide.FileText className="w-3.5 h-3.5 text-indigo-600" />
                    A4 PDF Receipt
                  </button>
                  <button
                    onClick={() => setReceiptTab('pos')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${receiptTab === 'pos' ? 'bg-white text-slate-950 shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Lucide.Printer className="w-3.5 h-3.5 text-indigo-600" />
                    POS Thermal (80mm)
                  </button>
                  <button
                    onClick={() => setReceiptTab('email')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${receiptTab === 'email' ? 'bg-white text-slate-950 shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Lucide.Mail className="w-3.5 h-3.5 text-indigo-600" />
                    Email Notification
                  </button>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handlePrint}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-800 cursor-pointer transition-colors"
                    title="Send to physical printer"
                  >
                    <Lucide.Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCloseReceipt}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    <Lucide.X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* RENDER TARGET */}
              <div className="p-6 md:p-8 bg-slate-100 max-h-[550px] overflow-y-auto flex justify-center">
                
                {/* 1. STANDARD A4 PRINT-READY FORMAT */}
                {receiptTab === 'a4' && (
                  <div id="print-area-a4" className="bg-white w-full max-w-2xl p-8 border border-slate-200 shadow-sm rounded-lg text-slate-800 space-y-6">
                    <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                      <div>
                        <h1 className="text-xl font-black text-indigo-950 tracking-tight">STANFORD ACADEMY</h1>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold">SCHOOL ACCOUNTING DEPT / OFFICIAL RECEIPT</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                          Plot 12, SAMS Boulevard, Ikeja Campus, Lagos State, Nigeria. info@stanford.edu
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-3 py-1 rounded">
                          RECEIPT DUPLICATE
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-3 uppercase">NO: {receiptDetails.id}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-semibold">DATE: {receiptDetails.paymentDate}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Received From (Student)</p>
                        <p className="font-extrabold text-slate-800 mt-1">{receiptDetails.studentName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Student ID: {receiptDetails.studentId}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction Specification</p>
                        <p className="font-extrabold text-slate-800 mt-1">Method: {receiptDetails.paymentMethod}</p>
                        {receiptDetails.referenceNo && (
                          <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Ref No: {receiptDetails.referenceNo}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Allocated Funds Summary</h4>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                            <th className="p-2.5">Allocation item / description</th>
                            <th className="p-2.5 text-right">Settled Amount (₦)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {receiptDetails.items && receiptDetails.items.length > 0 ? (
                            receiptDetails.items.map(item => (
                              <tr key={item.id} className="text-slate-700 font-semibold">
                                <td className="p-2.5">{item.name}</td>
                                <td className="p-2.5 text-right text-slate-900">₦{item.amount.toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr className="text-slate-500 italic">
                              <td className="p-2.5">Pure Advance Deposit Credit Pool (No active invoice allocation)</td>
                              <td className="p-2.5 text-right">₦{receiptDetails.amount.toLocaleString()}</td>
                            </tr>
                          )}
                          
                          <tr className="border-t-2 border-slate-200 text-slate-900 font-extrabold bg-slate-50/50">
                            <td className="p-2.5 text-right font-black">TOTAL SETTLED CASH</td>
                            <td className="p-2.5 text-right text-sm">₦{receiptDetails.amount.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {receiptDetails.notes && (
                      <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-xl">
                        <p className="text-[9px] font-black text-indigo-950 uppercase tracking-widest">Memo Comments / Auditor Notes</p>
                        <p className="text-[11px] text-indigo-800 italic mt-1 leading-normal font-semibold">"{receiptDetails.notes}"</p>
                      </div>
                    )}

                    <div className="flex justify-between items-end pt-10 border-t border-dashed border-slate-200">
                      <div className="text-center w-36">
                        <div className="border-b border-slate-300 pb-1 font-mono text-[10px] text-slate-600">SAMS Financial Desk</div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Cashier</p>
                      </div>

                      <div className="text-right text-[10px] text-slate-400 font-medium">
                        <p>Stanford Academy Financial Automation Console.</p>
                        <p className="mt-0.5">SAMS Safe Ledger Cryptographic Signature Verified.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. POS THERMAL 80MM LAYOUT */}
                {receiptTab === 'pos' && (
                  <div id="print-area-pos" className="bg-[#fcfbf9] text-black w-72 p-4 border border-slate-300 shadow-xs font-mono text-xs space-y-4 text-left">
                    <div className="text-center space-y-1">
                      <h2 className="font-bold text-sm tracking-tight">*** STANFORD ACADEMY ***</h2>
                      <p className="text-[10px]">IKEJA CAMPUS, LAGOS</p>
                      <p className="text-[10px]">TEL: +234-802-SAMS-FUNDS</p>
                      <p className="text-[9px] text-slate-600">--------------------------------</p>
                      <p className="font-bold">OFFICIAL RECEIPT</p>
                      <p className="text-[9px] text-slate-600">--------------------------------</p>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <p>REF NO: {receiptDetails.id}</p>
                      <p>DATE: {receiptDetails.paymentDate}</p>
                      <p>STUDENT: {receiptDetails.studentName}</p>
                      <p>ID: {receiptDetails.studentId}</p>
                      <p>CASHIER: SAMS-SYSTEM</p>
                    </div>

                    <p className="text-[9px] text-slate-600">================================</p>

                    <div className="space-y-1.5 text-[11px]">
                      {receiptDetails.items && receiptDetails.items.length > 0 ? (
                        receiptDetails.items.map(item => (
                          <div key={item.id} className="flex justify-between">
                            <span className="max-w-[160px] truncate">{item.name.replace('Payment Allocation - ', 'ALLOC ')}</span>
                            <span>₦{item.amount.toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between font-bold">
                          <span>ADVANCE CREDIT DEPOSIT</span>
                          <span>₦{receiptDetails.amount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[9px] text-slate-600">================================</p>

                    <div className="space-y-1 text-right">
                      <div className="flex justify-between font-bold">
                        <span>TOTAL PAID</span>
                        <span>₦{receiptDetails.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>METHOD</span>
                        <span>{receiptDetails.paymentMethod}</span>
                      </div>
                      {receiptDetails.referenceNo && (
                        <div className="flex justify-between text-[11px] truncate">
                          <span>REF/STAN</span>
                          <span className="font-mono text-[10px]">{receiptDetails.referenceNo}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[9px] text-slate-600">--------------------------------</p>

                    <div className="text-center space-y-1 text-[10px]">
                      <p className="font-bold">THANK YOU FOR YOUR PAYMENT</p>
                      <p>Education is the key to the future</p>
                      <p className="text-[8px] text-slate-500 mt-1">SAMS v2.1-LE SER: #0912</p>
                    </div>
                  </div>
                )}

                {/* 3. EMAIL NOTIFICATION PREVIEW */}
                {receiptTab === 'email' && (
                  <div className="bg-white w-full max-w-xl rounded-xl border border-slate-200 overflow-hidden shadow-xs text-slate-700 text-left">
                    <div className="bg-slate-100 p-4 border-b border-slate-200 text-xs font-semibold text-slate-600 space-y-1">
                      <p><span className="text-slate-400">From:</span> Stanford Billing &lt;no-reply@stanford.edu&gt;</p>
                      <p><span className="text-slate-400">To:</span> Sibling Parent &lt;parent-notifications@example.com&gt;</p>
                      <p><span className="text-slate-400">Subject:</span> School Fees Payment Acknowledgment: {receiptDetails.studentName}</p>
                    </div>

                    <div className="p-6 md:p-8 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Lucide.Sparkles className="w-5 h-5 text-indigo-600" />
                        <span className="text-xs font-black text-indigo-950 uppercase tracking-widest">Official Email Notice</span>
                      </div>

                      <div className="space-y-3 text-xs leading-relaxed">
                        <p className="font-semibold text-slate-800">Dear Parent / Guardian,</p>
                        <p>
                          We are pleased to inform you that we have successfully received and processed a school fees payment on behalf of your dependent child, <strong className="text-slate-900 font-extrabold">{receiptDetails.studentName}</strong>.
                        </p>
                        <p>
                          Below is a summarized overview of the transaction records logged inside SAMS Financial Desk.
                        </p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receipt No</span>
                          <span className="font-mono text-slate-800 font-bold">{receiptDetails.id}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</span>
                          <span className="font-bold text-slate-800">{receiptDetails.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount Received</span>
                          <span className="font-black text-indigo-950">₦{receiptDetails.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Logged</span>
                          <span className="font-semibold text-slate-800">{receiptDetails.paymentDate}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 leading-normal text-center bg-slate-50 p-3 rounded-lg border border-dashed border-slate-300">
                        A full printable PDF attachment of receipt <strong className="text-slate-700">{receiptDetails.id}.pdf</strong> is attached to this email broadcast.
                      </div>

                      <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4">
                        <p className="font-bold">Stanford Academy Finance Team</p>
                        <p className="mt-0.5">Please do not reply directly to this automated email system broadcast.</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DESKTOP MODAL 2: DIRECT MANUAL CREDIT DEPOSIT */}
      <AnimatePresence>
        {isCreditModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md border border-slate-200/80 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setIsCreditModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
              >
                <Lucide.X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                  <Lucide.Sparkles className="w-5.5 h-5.5 text-indigo-600 mr-2" />
                  Load Advance Wallet Credit
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Load non-allocated credit balance to the student's prepaid wallet.</p>
              </div>

              <form onSubmit={handleAddDirectCredit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Student Profile</label>
                  <input
                    type="text"
                    value={`${selectedStudent.name} (${selectedStudent.grade})`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 px-3 py-2.5 outline-none"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prepaid Credit Amount (₦) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2.5 outline-none focus:border-indigo-500"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deposit Memo / Reference Description</label>
                  <textarea
                    placeholder="e.g. Prepaid advance fee pool for incoming term uniform & materials"
                    value={creditNotes}
                    onChange={(e) => setCreditNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2.5 outline-none focus:border-indigo-500 h-20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingCredit}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:bg-slate-300"
                >
                  {savingCredit ? 'Registering Deposit...' : 'Commit Wallet Credit Balance'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
