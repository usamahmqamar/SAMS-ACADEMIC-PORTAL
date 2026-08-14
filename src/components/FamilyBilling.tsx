import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';
import Toast from './Toast';

interface Student {
  id: string;
  name: string;
  grade: string;
  branch: string;
}

interface FamilyAccount {
  id: string;
  familyName: string;
  primaryParentName: string;
  primaryParentEmail: string;
  primaryParentPhone: string;
  memberCount: number;
  childrenNames: string;
  totalBilled: number;
  totalOutstanding: number;
  totalPaid: number;
  students?: Student[];
  createdAt: string;
}

interface StatementItem {
  id: string;
  date: string;
  type: 'invoice' | 'payment';
  description: string;
  studentName: string;
  amount: number;
  status: string;
  refId: string;
}

interface FamilyDetails {
  account: FamilyAccount & { students: Student[] };
  financials: {
    totalBilled: number;
    totalOutstanding: number;
    totalPaid: number;
    paymentsCount: number;
  };
  statement: StatementItem[];
  outstandingInvoices: any[];
  paymentsHistory: any[];
}

export default function FamilyBilling() {
  const [families, setFamilies] = useState<FamilyAccount[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Family Detail Workspace
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);
  const [familyDetails, setFamilyDetails] = useState<FamilyDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isLinkStudentModalOpen, setIsLinkStudentModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Add Family Form State
  const [newFamilyName, setNewFamilyName] = useState<string>('');
  const [newParentName, setNewParentName] = useState<string>('');
  const [newParentEmail, setNewParentEmail] = useState<string>('');
  const [newParentPhone, setNewParentPhone] = useState<string>('');
  const [addSaving, setAddSaving] = useState<boolean>(false);

  // Link Student Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [linkRelationship, setLinkRelationship] = useState<string>('Child');
  const [linkSaving, setLinkSaving] = useState<boolean>(false);

  // Record Payment Form State
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('Bank Transfer');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payAutoAllocate, setPayAutoAllocate] = useState<boolean>(true);
  const [paySaving, setPaySaving] = useState<boolean>(false);

  // Details Workspace Tabs: 'balance', 'statement', 'outstanding', 'payments'
  const [detailTab, setDetailTab] = useState<'balance' | 'statement' | 'outstanding' | 'payments'>('balance');

  // Load baseline accounts and students
  const loadBaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [famRes, stdRes] = await Promise.all([
        fetch('/api/family_accounts'),
        fetch('/api/students')
      ]);

      if (!famRes.ok || !stdRes.ok) {
        throw new Error("Failed to load family financial datasets.");
      }

      const famData = await famRes.json();
      const stdData = await stdRes.json();

      setFamilies(famData);
      setStudents(stdData);
    } catch (err: any) {
      setError(err.message || "Error contacting financial engine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  // Load detailed single family info
  const loadFamilyDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      const res = await fetch(`/api/family_accounts/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load family account portfolio.");
      }
      const data = await res.json();
      setFamilyDetails(data);
    } catch (err: any) {
      setToast({ message: `Error loading portfolio: ${err.message}`, type: "error" });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSelectFamily = (id: string) => {
    setActiveFamilyId(id);
    setDetailTab('balance');
    loadFamilyDetails(id);
  };

  const handleBackToList = () => {
    setActiveFamilyId(null);
    setFamilyDetails(null);
    loadBaseData(); // Refresh list to update totals
  };

  // Re-generate families by grouping parents
  const handleRegenerateFamilies = async () => {
    if (!confirm("Are you sure you want to run the Family Reconstruction service?\nThis will automatically rebuild family accounts from the student records based on parent matches.")) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/family_accounts/generate', {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error("Reconstruction engine reported an error.");
      }
      const result = await res.json();
      setToast({
        message: `🎉 Family accounts successfully constructed! Generated ${result.count} Unified Family Portfolios.`,
        type: 'success'
      });
      loadBaseData();
    } catch (err: any) {
      setToast({ message: `Reconstruction failed: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Create Family Account
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName) {
      setToast({ message: "Please specify a Primary Parent Name.", type: "warning" });
      return;
    }

    try {
      setAddSaving(true);
      const res = await fetch('/api/family_accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyName: newFamilyName,
          primaryParentName: newParentName,
          primaryParentEmail: newParentEmail,
          primaryParentPhone: newParentPhone
        })
      });

      if (!res.ok) {
        throw new Error("Failed to register family account.");
      }

      setIsAddModalOpen(false);
      setNewFamilyName('');
      setNewParentName('');
      setNewParentEmail('');
      setNewParentPhone('');
      
      loadBaseData();
      setToast({ message: "Family account registered successfully!", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to create family account.", type: "error" });
    } finally {
      setAddSaving(false);
    }
  };

  // Link student to family
  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamilyId || !selectedStudentId) {
      setToast({ message: "Please select a student to link.", type: "warning" });
      return;
    }

    try {
      setLinkSaving(true);
      const res = await fetch('/api/family_members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyAccountId: activeFamilyId,
          studentId: selectedStudentId,
          relationship: linkRelationship
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to link student.");
      }

      setIsLinkStudentModalOpen(false);
      setSelectedStudentId('');
      setLinkRelationship('Child');
      
      // Reload details to show newly linked student
      loadFamilyDetails(activeFamilyId);
      setToast({ message: "Student linked to family successfully!", type: "success" });
    } catch (err: any) {
      setToast({ message: `Link failed: ${err.message}`, type: "error" });
    } finally {
      setLinkSaving(false);
    }
  };

  // Unlink student
  const handleUnlinkStudent = async (studentId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from this Family Account?`)) {
      return;
    }

    try {
      // Find the family member link ID from the database
      const memRes = await fetch('/api/family_members');
      if (!memRes.ok) throw new Error("Failed to fetch member links.");
      const members = await memRes.json();
      
      const link = members.find((m: any) => m.familyAccountId === activeFamilyId && m.studentId === studentId);
      if (!link) {
        throw new Error("Could not locate member linkage.");
      }

      const delRes = await fetch(`/api/family_members/${link.id}`, {
        method: 'DELETE'
      });

      if (!delRes.ok) {
        throw new Error("Failed to delete member linkage.");
      }

      setToast({ message: "Student removed from family portfolio.", type: "success" });
      loadFamilyDetails(activeFamilyId!);
    } catch (err: any) {
      setToast({ message: `Unlink failed: ${err.message}`, type: "error" });
    }
  };

  // Record Family Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamilyId || !payAmount || Number(payAmount) <= 0) {
      setToast({ message: "Please specify a valid payment amount.", type: "warning" });
      return;
    }

    try {
      setPaySaving(true);
      const res = await fetch('/api/family_payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyAccountId: activeFamilyId,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          paymentDate: payDate,
          referenceNo: payRef,
          notes: payNotes,
          autoAllocate: payAutoAllocate
        })
      });

      if (!res.ok) {
        throw new Error("Failed to submit family payment record.");
      }

      setToast({
        message: `💳 Payment of ₦${Number(payAmount).toLocaleString()} successfully recorded! ${payAutoAllocate ? 'Funds have been allocated to outstanding bills.' : ''}`,
        type: 'success'
      });
      
      setIsPaymentModalOpen(false);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      
      loadFamilyDetails(activeFamilyId);
    } catch (err: any) {
      setToast({ message: `Payment recording failed: ${err.message}`, type: "error" });
    } finally {
      setPaySaving(false);
    }
  };

  // Delete family account
  const handleDeleteFamily = async (id: string, name: string) => {
    if (!confirm(`Permanently delete the family account "${name}"?\nThis unlinks all children (they will retain their individual school bills, but will not be consolidated).`)) {
      return;
    }

    try {
      const res = await fetch(`/api/family_accounts/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error("Failed to delete family account.");
      }
      setToast({ message: "Family Account deleted.", type: "info" });
      loadBaseData();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to delete family account.", type: "error" });
    }
  };

  // Filtered families list
  const filteredFamilies = useMemo(() => {
    return families.filter(f => {
      const q = searchQuery.toLowerCase();
      return q === '' ||
        f.familyName.toLowerCase().includes(q) ||
        f.primaryParentName.toLowerCase().includes(q) ||
        f.primaryParentEmail.toLowerCase().includes(q) ||
        f.primaryParentPhone.toLowerCase().includes(q) ||
        f.childrenNames.toLowerCase().includes(q);
    });
  }, [families, searchQuery]);

  // Aggregate School-Wide Family Statistics
  const aggregateStats = useMemo(() => {
    let billed = 0;
    let outstanding = 0;
    let paid = 0;
    families.forEach(f => {
      billed += f.totalBilled || 0;
      outstanding += f.totalOutstanding || 0;
      paid += f.totalPaid || 0;
    });
    return {
      billed,
      outstanding,
      paid,
      count: families.length
    };
  }, [families]);

  // Determine which students can be linked to active family (students not already in this family)
  const linkableStudents = useMemo(() => {
    if (!familyDetails) return [];
    const activeStudentIds = familyDetails.account.students.map(s => s.id);
    return students.filter(s => !activeStudentIds.includes(s.id));
  }, [students, familyDetails]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Lucide.Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-semibold">Contacting SAMS Financial Engine...</p>
        <p className="text-xs text-slate-400 mt-1">Consolidating family ledgers and member relationships</p>
      </div>
    );
  }

  return (
    <div id="family-billing-workspace" className="space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-150 rounded-xl p-4 text-xs font-semibold text-rose-700 flex items-center space-x-2">
          <Lucide.AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* DETAILED WORKSPACE (IF FAMILY IS SELECTED) */}
      <AnimatePresence mode="wait">
        {activeFamilyId && familyDetails ? (
          <motion.div
            key="family-details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* WORKSPACE HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5 gap-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToList}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                  title="Back to Family Portfolios"
                >
                  <Lucide.ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {familyDetails.account.familyName} Account
                    </h2>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded">
                      ID: {familyDetails.account.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Lucide.User className="w-3.5 h-3.5 text-slate-400" />
                      Parent: <strong className="text-slate-800">{familyDetails.account.primaryParentName}</strong>
                    </span>
                    {familyDetails.account.primaryParentEmail && (
                      <span className="flex items-center gap-1">
                        <Lucide.Mail className="w-3.5 h-3.5 text-slate-400" />
                        {familyDetails.account.primaryParentEmail}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setIsLinkStudentModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Lucide.UserPlus className="w-4 h-4 text-slate-500" />
                  <span>Link Dependent Child</span>
                </button>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Lucide.CreditCard className="w-4 h-4" />
                  <span>Record Family Payment</span>
                </button>
              </div>
            </div>

            {/* FINANCIAL STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Combined Billed</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  ₦{familyDetails.financials.totalBilled.toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Aggregated across all registered children</p>
                <Lucide.Coins className="w-12 h-12 text-slate-200/40 absolute right-4 top-4" />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-black">Outstanding Balance</p>
                <h3 className="text-2xl font-black text-amber-700 mt-1">
                  ₦{familyDetails.financials.totalOutstanding.toLocaleString()}
                </h3>
                <p className="text-[10px] text-amber-600 font-bold mt-1">Awaiting Collection / Overdue</p>
                <Lucide.AlertCircle className="w-12 h-12 text-amber-100/40 absolute right-4 top-4" />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Family Paid</p>
                <h3 className="text-2xl font-black text-emerald-700 mt-1">
                  ₦{familyDetails.financials.totalPaid.toLocaleString()}
                </h3>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">Recorded ledger collections & payments</p>
                <Lucide.CheckCircle className="w-12 h-12 text-emerald-100/40 absolute right-4 top-4" />
              </div>
            </div>

            {/* DETAILED WORKSPACE NAVIGATION TABS */}
            <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/40 flex flex-wrap gap-1">
              <button
                onClick={() => setDetailTab('balance')}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  detailTab === 'balance'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/30 font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                <Lucide.Users className="w-4 h-4" />
                Children Profiles ({familyDetails.account.students.length})
              </button>
              <button
                onClick={() => setDetailTab('statement')}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  detailTab === 'statement'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/30 font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                <Lucide.FileText className="w-4 h-4" />
                Family Statement
              </button>
              <button
                onClick={() => setDetailTab('outstanding')}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  detailTab === 'outstanding'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/30 font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                <Lucide.TrendingUp className="w-4 h-4" />
                Outstanding Bills ({familyDetails.outstandingInvoices.length})
              </button>
              <button
                onClick={() => setDetailTab('payments')}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  detailTab === 'payments'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/30 font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
              >
                <Lucide.Receipt className="w-4 h-4" />
                Payments History ({familyDetails.paymentsHistory.length})
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              {/* TAB 1: CHILDREN PROFILES */}
              {detailTab === 'balance' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Dependent Children Accounts</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">These student portfolios feed charges directly into this family account balance.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {familyDetails.account.students.length === 0 ? (
                      <div className="col-span-2 text-center py-12 text-slate-400">
                        <Lucide.UserX className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        No children linked to this parent yet.
                        <p className="text-xs text-slate-400 mt-1">Click "Link Dependent Child" to add a student.</p>
                      </div>
                    ) : (
                      familyDetails.account.students.map((s) => (
                        <div key={s.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 flex justify-between items-start">
                          <div>
                            <span className="text-[9px] bg-indigo-700 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Student
                            </span>
                            <h5 className="font-extrabold text-slate-900 text-sm mt-1.5">{s.name}</h5>
                            <div className="text-[10px] text-slate-500 mt-1 space-y-0.5 font-medium">
                              <p>Grade level: <span className="font-bold text-slate-700">{s.grade}</span></p>
                              <p>Campus Branch: <span className="font-bold text-indigo-700">{s.branch}</span></p>
                              <p className="font-mono text-[9px] text-slate-400 mt-1">ID: {s.id}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleUnlinkStudent(s.id, s.name)}
                            className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer text-[10px] font-bold flex items-center space-x-1"
                            title="Unlink Dependent from Family"
                          >
                            <Lucide.UserMinus className="w-3.5 h-3.5" />
                            <span>Unlink</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: STATEMENT */}
              {detailTab === 'statement' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Unified Family Financial Statement</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Comprehensive, chronological ledger showing combined billings and collections.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Student Affected</th>
                          <th className="px-4 py-3">Transaction Description</th>
                          <th className="px-4 py-3 text-center">Type</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                        {familyDetails.statement.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                              No financial records found in statement.
                            </td>
                          </tr>
                        ) : (
                          familyDetails.statement.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-semibold">{item.date}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{item.studentName}</td>
                              <td className="px-4 py-3 text-[11px] text-slate-600 max-w-sm font-normal">{item.description}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  item.type === 'invoice' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-right font-bold text-sm ${item.type === 'invoice' ? 'text-slate-900' : 'text-emerald-700'}`}>
                                {item.type === 'invoice' ? '' : '-'}₦{item.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                  item.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                                  item.status === 'Sent' ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: OUTSTANDING */}
              {detailTab === 'outstanding' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Unpaid &amp; Outstanding Billings</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Unsettled children invoices that require attention.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                          <th className="px-4 py-3">Student Name</th>
                          <th className="px-4 py-3">Billing Date</th>
                          <th className="px-4 py-3 text-right">Total Invoice Value</th>
                          <th className="px-4 py-3 text-right text-amber-700">Outstanding Balance</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                        {familyDetails.outstandingInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-12 text-center text-emerald-600 font-bold flex items-center justify-center gap-1">
                              <Lucide.CheckCircle className="w-5 h-5" />
                              Family outstanding is clean. All active children's invoices are fully settled!
                            </td>
                          </tr>
                        ) : (
                          familyDetails.outstandingInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-extrabold text-slate-900">{inv.studentName}</td>
                              <td className="px-4 py-3 font-semibold text-slate-500">{inv.billingDate}</td>
                              <td className="px-4 py-3 text-right font-semibold">₦{inv.grandTotal.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-black text-amber-800 text-sm">₦{inv.outstanding.toLocaleString()}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  inv.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: PAYMENTS */}
              {detailTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Family Payments Registry</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">History of receipts recorded under this parent portfolio.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                          <th className="px-4 py-3">Receipt Ref</th>
                          <th className="px-4 py-3 font-semibold">Date Paid</th>
                          <th className="px-4 py-3">Method</th>
                          <th className="px-4 py-3">Memo Notes</th>
                          <th className="px-4 py-3 text-right">Amount Collected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                        {familyDetails.paymentsHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-bold">
                              No payments recorded for this family yet.
                            </td>
                          </tr>
                        ) : (
                          familyDetails.paymentsHistory.map((pay) => (
                            <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-extrabold text-indigo-750 font-mono">{pay.referenceNo || pay.id}</td>
                              <td className="px-4 py-3 text-slate-500 font-semibold">{pay.paymentDate}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded">
                                  {pay.paymentMethod}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-normal italic max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">{pay.notes || 'No payment description notes.'}</td>
                              <td className="px-4 py-3 text-right font-black text-emerald-700 text-sm">₦{pay.amount.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="family-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* WORKSPACE LIST HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                  <Lucide.Users className="w-7 h-7 text-indigo-600 mr-2.5" />
                  Family Financial Portfolios
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Consolidate multiple children under a single family account to manage joint statements, combined balances, and payments.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleRegenerateFamilies}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Lucide.Sparkles className="w-4 h-4 text-slate-500" />
                  <span>Family Auto-Construct</span>
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Lucide.Plus className="w-4 h-4" />
                  <span>Register Parent Account</span>
                </button>
              </div>
            </div>

            {/* METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Portfolios</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">{aggregateStats.count} Family Accounts</h3>
                <p className="text-[9px] text-slate-500 mt-1">Synced with student parent registries</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Combined Billings</p>
                <h3 className="text-xl font-black text-slate-900 mt-1">₦{aggregateStats.billed.toLocaleString()}</h3>
                <p className="text-[9px] text-indigo-600 font-bold mt-1">Aggregate invoices</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Combined Outstanding</p>
                <h3 className="text-xl font-black text-amber-700 mt-1">₦{aggregateStats.outstanding.toLocaleString()}</h3>
                <p className="text-[9px] text-amber-600 font-bold mt-1">Awaiting sibling collection</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-black">Payments Collected</p>
                <h3 className="text-xl font-black text-emerald-700 mt-1">₦{aggregateStats.paid.toLocaleString()}</h3>
                <p className="text-[9px] text-emerald-600 font-bold mt-1">Settled balances</p>
              </div>
            </div>

            {/* SEARCH */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search family name, parent email, child's name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 pl-9 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
                />
                <Lucide.Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* FAMILIES TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Family Profile</th>
                      <th className="px-6 py-4">Parent Details</th>
                      <th className="px-6 py-4">Linked Dependent Children</th>
                      <th className="px-6 py-4 text-right">Combined Billings</th>
                      <th className="px-6 py-4 text-right">Combined Paid</th>
                      <th className="px-6 py-4 text-right text-amber-700 font-black">Outstanding Balance</th>
                      <th className="px-6 py-4 text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredFamilies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-bold">
                          <Lucide.Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                          No Family Financial Accounts found matching filter.
                          <p className="text-[11px] text-slate-400 font-normal mt-1">
                            Click "Family Auto-Construct" to automatically link parent-child databases.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredFamilies.map((fam) => (
                        <tr key={fam.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-slate-900 text-sm">{fam.familyName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {fam.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{fam.primaryParentName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{fam.primaryParentEmail || 'No email registered'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {fam.students && fam.students.length > 0 ? (
                                fam.students.map((s) => (
                                  <span key={s.id} className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-md">
                                    {s.name} ({s.grade})
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">No active dependents linked</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-900">
                            ₦{(fam.totalBilled || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-emerald-700">
                            ₦{(fam.totalPaid || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-amber-700 text-sm">
                            ₦{(fam.totalOutstanding || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleSelectFamily(fam.id)}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                              >
                                View Portfolio
                              </button>
                              <button
                                onClick={() => handleDeleteFamily(fam.id, fam.familyName)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete family account link"
                              >
                                <Lucide.Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: ADD FAMILY PORTFOLIO */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md border border-slate-200/80 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
              >
                <Lucide.X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                  <Lucide.Users className="w-5.5 h-5.5 text-indigo-600 mr-2" />
                  Register Parent Portfolio
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Create a family account manually to link dependents together.</p>
              </div>

              <form onSubmit={handleCreateFamily} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Family Account Label (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Martinez Sibling Account"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2.5 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Primary Parent Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Carlos Martinez"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2.5 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parent Email</label>
                    <input
                      type="email"
                      placeholder="parent@example.com"
                      value={newParentEmail}
                      onChange={(e) => setNewParentEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parent Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 0122"
                      value={newParentPhone}
                      onChange={(e) => setNewParentPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addSaving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:bg-slate-300"
                >
                  {addSaving ? 'Saving...' : 'Register Sibling Account'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: LINK DEPENDENT CHILD */}
      <AnimatePresence>
        {isLinkStudentModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md border border-slate-200/80 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setIsLinkStudentModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
              >
                <Lucide.X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                  <Lucide.UserPlus className="w-5.5 h-5.5 text-indigo-600 mr-2" />
                  Link Dependent Child
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Associate an existing student with this family account.</p>
              </div>

              <form onSubmit={handleLinkStudent} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Student *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2.5 outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    {linkableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.grade} - {s.branch})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Relationship / Role</label>
                  <select
                    value={linkRelationship}
                    onChange={(e) => setLinkRelationship(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2.5 outline-none cursor-pointer"
                  >
                    <option value="Child">Child</option>
                    <option value="Ward">Ward</option>
                    <option value="Dependent">Dependent</option>
                    <option value="Sibling Override">Sibling Override</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={linkSaving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:bg-slate-300"
                >
                  {linkSaving ? 'Linking...' : 'Add Student to Sibling Link'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: RECORD FAMILY PAYMENT */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md border border-slate-200/80 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
              >
                <Lucide.X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                  <Lucide.CreditCard className="w-5.5 h-5.5 text-indigo-600 mr-2" />
                  Record Family Payment
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Submit a bulk payment from parent. Funds will be routed according to preferences.</p>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Amount (₦) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2.5 outline-none focus:border-indigo-500 font-bold text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2.5 outline-none cursor-pointer"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="POS Card">POS Card</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reference / TXN ID</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank Ref Code, Cheque No"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2.5 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Memo / Payment Notes</label>
                  <textarea
                    placeholder="e.g. Sibling term fee coverage balance"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                  <input
                    type="checkbox"
                    id="payAutoAllocate"
                    checked={payAutoAllocate}
                    onChange={(e) => setPayAutoAllocate(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded outline-none"
                  />
                  <label htmlFor="payAutoAllocate" className="text-xs text-indigo-950 font-bold select-none cursor-pointer">
                    Auto-allocate across oldest children invoices
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={paySaving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:bg-slate-300"
                >
                  {paySaving ? 'Routing Funds...' : 'Record Receipt Portfolios'}
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
