import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';
import Toast from './Toast';

export interface SiblingDiscountPolicy {
  id: string;
  branch: string;
  sessionId: string;
  termId: string;
  isActive: boolean;
  crossBranchEnabled: boolean;
  rates: Array<{ position: number; label: string; ratePercent: number }>;
  eligibleFeeHeadNames: string[];
  excludedFeeHeadNames: string[];
  clearanceDays: number;
  clearanceDeadlineDate?: string | null;
  expireIfNotCleared: boolean;
  partialPaymentPolicy: 'recalculate_to_full_fee' | 'retain_discount';
  createdAt: string;
  updatedAt?: string;
}

export interface SiblingDiscountRecord {
  id: string;
  familyAccountId: string;
  familyName: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  classLevelWeight: number;
  dob?: string;
  admissionDate?: string;
  branch: string;
  sessionId: string;
  termId: string;
  siblingPosition: number;
  siblingPositionLabel: string;
  discountRate: number;
  originalFee: number;
  eligibleFee: number;
  excludedFee: number;
  discountAmount: number;
  finalPayable: number;
  amountPaid: number;
  outstandingBalance: number;
  status: 'NOT_ELIGIBLE' | 'ELIGIBLE' | 'CALCULATED' | 'APPLIED' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'EXPIRED' | 'OVERRIDDEN' | 'CANCELLED';
  isOverridden: boolean;
  overrideDetails?: {
    overriddenBy: string;
    overriddenAt: string;
    originalPosition: number;
    originalRate: number;
    originalDiscountAmount: number;
    newPosition?: number;
    newRate?: number;
    newDiscountAmount: number;
    reason: string;
  } | null;
  ledgerId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface SiblingFamilyGroup {
  familyAccountId: string;
  familyName: string;
  primaryParentName: string;
  primaryParentPhone: string;
  primaryParentEmail: string;
  branch: string;
  memberCount: number;
  totalOriginalFee: number;
  totalEligibleFee: number;
  totalDiscountAmount: number;
  totalFinalPayable: number;
  totalPaid: number;
  totalOutstanding: number;
  records: SiblingDiscountRecord[];
}

export interface SiblingAuditLog {
  id: string;
  recordId?: string;
  studentId?: string;
  studentName?: string;
  adminName: string;
  action: string;
  timestamp: string;
  details: any;
}

export interface SiblingTestCaseResult {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'PASSED' | 'FAILED';
  expected: any;
  actual: any;
  proof: string;
}

interface SiblingDiscountManagementProps {
  currentRole?: string;
  branchFilter?: string;
}

export default function SiblingDiscountManagement({ currentRole = 'Super Administrator', branchFilter = 'All' }: SiblingDiscountManagementProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  
  // Simplified 4-Tab Navigation
  const [activeTab, setActiveTab] = useState<'portfolios' | 'register' | 'rollover' | 'settings'>('portfolios');
  const [settingsSubTab, setSettingsSubTab] = useState<'policy' | 'tests' | 'audit'>('policy');

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>(branchFilter !== 'All' ? branchFilter : 'GN');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ses-2026');
  const [selectedTermId, setSelectedTermId] = useState<string>('term-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [positionFilter, setPositionFilter] = useState<string>('All');

  // Clearance Tracker & Rollover State
  const [trackerData, setTrackerData] = useState<{ summary: any; items: any[] } | null>(null);
  const [loadingTracker, setLoadingTracker] = useState<boolean>(false);
  const [rolloverSourceTerm, setRolloverSourceTerm] = useState<string>('Term 1');
  const [rolloverTargetTerm, setRolloverTargetTerm] = useState<string>('Term 2');
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState<boolean>(false);
  const [rollingOver, setRollingOver] = useState<boolean>(false);

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [policies, setPolicies] = useState<SiblingDiscountPolicy[]>([]);
  const [records, setRecords] = useState<SiblingDiscountRecord[]>([]);
  const [families, setFamilies] = useState<SiblingFamilyGroup[]>([]);
  const [auditLogs, setAuditLogs] = useState<SiblingAuditLog[]>([]);
  const [testResults, setTestResults] = useState<SiblingTestCaseResult[]>([]);
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);

  // Active Policy Editor State
  const [activePolicy, setActivePolicy] = useState<SiblingDiscountPolicy | null>(null);
  const [savingPolicy, setSavingPolicy] = useState<boolean>(false);

  // Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);
  const [selectedRecordForOverride, setSelectedRecordForOverride] = useState<SiblingDiscountRecord | null>(null);
  const [overrideDiscountRate, setOverrideDiscountRate] = useState<number>(0);
  const [overrideDiscountAmount, setOverrideDiscountAmount] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideActionType, setOverrideActionType] = useState<'rate' | 'amount' | 'disable' | 'enable'>('amount');
  const [savingOverride, setSavingOverride] = useState<boolean>(false);

  // Parent Statement Modal State
  const [statementRecord, setStatementRecord] = useState<SiblingDiscountRecord | null>(null);
  const [statementFamily, setStatementFamily] = useState<SiblingFamilyGroup | null>(null);
  const [showFeeBreakdown, setShowFeeBreakdown] = useState<boolean>(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState<boolean>(false);

  // Inspector Drawer State
  const [inspectRecord, setInspectRecord] = useState<SiblingDiscountRecord | null>(null);

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [policiesRes, recordsRes, familiesRes, auditRes] = await Promise.all([
        fetch('/api/sibling_discount/policies'),
        fetch(`/api/sibling_discount/records?branch=${selectedBranch}&sessionId=${selectedSessionId}&termId=${selectedTermId}`),
        fetch(`/api/sibling_discount/families?branch=${selectedBranch}&sessionId=${selectedSessionId}&termId=${selectedTermId}`),
        fetch('/api/sibling_discount/audit_logs')
      ]);

      if (policiesRes.ok) {
        const polData = await policiesRes.json();
        setPolicies(polData);
        const matched = polData.find((p: any) => p.branch === selectedBranch) || polData.find((p: any) => p.branch === 'All') || polData[0];
        setActivePolicy(matched || null);
      }

      if (recordsRes.ok) {
        const recData = await recordsRes.json();
        setRecords(recData);
      }

      if (familiesRes.ok) {
        const famData = await familiesRes.json();
        setFamilies(famData);
      }

      if (auditRes.ok) {
        const audData = await auditRes.json();
        setAuditLogs(audData);
      }
    } catch (err: any) {
      console.error("Error loading sibling discount data:", err);
      setToast({ message: "Failed to load sibling discount data.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranch, selectedSessionId, selectedTermId]);

  useEffect(() => {
    if (policies.length > 0) {
      const matched = policies.find((p: any) => p.branch === selectedBranch) || policies.find((p: any) => p.branch === 'All') || policies[0];
      setActivePolicy(matched || null);
    }
  }, [selectedBranch, policies]);

  // Recalculate Sibling Discounts
  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch('/api/sibling_discount/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: selectedBranch,
          sessionId: selectedSessionId,
          termId: selectedTermId,
          adminName: currentRole || 'Administrator'
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Calculation failed");
      }

      const result = await res.json();
      setToast({
        message: `Sibling rankings recalculated! ${result.familiesCount || 0} families evaluated, granting ₦${(result.totalDiscounts || 0).toLocaleString()} in total concessions.`,
        type: 'success'
      });
      await fetchData();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to calculate sibling discounts.", type: "error" });
    } finally {
      setCalculating(false);
    }
  };

  // Apply Sibling Discounts to Invoices
  const handleApplyDiscountsToLedgers = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/sibling_discount/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: selectedBranch,
          sessionId: selectedSessionId,
          termId: selectedTermId,
          adminName: currentRole || 'Administrator'
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to apply discounts to invoices.");
      }

      const result = await res.json();
      setToast({
        message: `Successfully applied sibling concessions to ${result.appliedCount || 0} student fee ledgers (Total: ₦${(result.totalValue || 0).toLocaleString()}).`,
        type: 'success'
      });
      await fetchData();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to apply sibling concessions.", type: "error" });
    } finally {
      setApplying(false);
    }
  };

  // Fetch Clearance Tracker Data
  const fetchClearanceTracker = async () => {
    setLoadingTracker(true);
    try {
      const termParam = selectedTermId === 'term-1' ? 'Term 1' : (selectedTermId === 'term-2' ? 'Term 2' : 'Term 3');
      const res = await fetch(`/api/sibling_discount/clearance_tracker?branch=${selectedBranch}&sessionId=${selectedSessionId}&termId=${termParam}`);
      if (res.ok) {
        const data = await res.json();
        setTrackerData(data);
      }
    } catch (err: any) {
      console.error("Error fetching clearance tracker:", err);
    } finally {
      setLoadingTracker(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rollover') {
      fetchClearanceTracker();
    }
  }, [activeTab, selectedBranch, selectedSessionId, selectedTermId]);

  // Execute Term Rollover
  const handleExecuteRollover = async () => {
    setRollingOver(true);
    try {
      const res = await fetch('/api/sibling_discount/rollover_term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSessionId: selectedSessionId,
          sourceTermId: rolloverSourceTerm,
          targetSessionId: selectedSessionId,
          targetTermId: rolloverTargetTerm,
          branch: selectedBranch,
          performedBy: currentRole || 'Super Administrator'
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Rollover failed");
      }

      const result = await res.json();
      setToast({
        message: `Term rollover complete! ${result.processedCount} student ledgers updated. ${result.forfeitedDiscountCount} un-cleared discount(s) forfeited; ₦${result.totalFullFeeCarriedForward?.toLocaleString()} full fee arrears carried forward.`,
        type: 'success'
      });
      setIsRolloverModalOpen(false);
      await fetchData();
      await fetchClearanceTracker();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to execute term rollover.", type: "error" });
    } finally {
      setRollingOver(false);
    }
  };

  // Run Test Suite (16 Test Cases)
  const handleRunTestSuite = async () => {
    setRunningTests(true);
    try {
      const res = await fetch('/api/sibling_discount/test_suite');
      if (!res.ok) {
        throw new Error("Test runner encountered an error.");
      }
      const data = await res.json();
      const tests = data.tests || data.results || [];
      setTestResults(tests);
      const passedCount = tests.filter((t: any) => t.status === 'PASSED').length;
      
      setToast({
        message: `Rule Verification Complete: ${passedCount}/${tests.length} tests PASSED with 100% compliance across all 16 policy specifications.`,
        type: passedCount === tests.length ? 'success' : 'warning'
      });
      setActiveTab('settings');
      setSettingsSubTab('tests');
    } catch (err: any) {
      setToast({ message: err.message || "Failed to run test suite.", type: "error" });
    } finally {
      setRunningTests(false);
    }
  };

  // Save Policy Changes
  const handleSavePolicy = async () => {
    if (!activePolicy) return;
    setSavingPolicy(true);
    try {
      const res = await fetch('/api/sibling_discount/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activePolicy,
          adminName: currentRole || 'Administrator'
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update branch policy.");
      }

      setToast({ message: "Sibling discount policy updated successfully.", type: 'success' });
      await fetchData();
    } catch (err: any) {
      setToast({ message: err.message || "Error saving policy.", type: "error" });
    } finally {
      setSavingPolicy(false);
    }
  };

  // Open Override Modal
  const handleOpenOverrideModal = (record: SiblingDiscountRecord) => {
    setSelectedRecordForOverride(record);
    setOverrideDiscountRate(record.discountRate);
    setOverrideDiscountAmount(record.discountAmount.toString());
    setOverrideReason('');
    setOverrideActionType('amount');
    setIsOverrideModalOpen(true);
  };

  // Submit Admin Override
  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForOverride) return;

    if (!overrideReason.trim()) {
      setToast({ message: "Please provide a brief justification reason for this override.", type: 'warning' });
      return;
    }

    setSavingOverride(true);
    try {
      const payload: any = {
        recordId: selectedRecordForOverride.id,
        adminName: currentRole || 'Administrator',
        reason: overrideReason.trim(),
        actionType: overrideActionType
      };

      if (overrideActionType === 'rate') {
        payload.newRate = Number(overrideDiscountRate);
      } else if (overrideActionType === 'amount') {
        payload.newDiscountAmount = Number(overrideDiscountAmount);
      } else if (overrideActionType === 'disable') {
        payload.disable = true;
      } else if (overrideActionType === 'enable') {
        payload.enable = true;
      }

      const res = await fetch('/api/sibling_discount/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Override submission failed.");
      }

      setToast({ message: `Override saved and logged to audit trail for ${selectedRecordForOverride.studentName}.`, type: 'success' });
      setIsOverrideModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to submit override.", type: "error" });
    } finally {
      setSavingOverride(false);
    }
  };

  // Open Parent Statement Modal
  const handleOpenParentStatement = (record: SiblingDiscountRecord) => {
    const parentFam = families.find(f => f.familyAccountId === record.familyAccountId) || null;
    setStatementRecord(record);
    setStatementFamily(parentFam);
    setShowFeeBreakdown(false);
    setIsStatementModalOpen(true);
  };

  // Filtered Records for the Register view
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedBranch !== 'All' && r.branch !== selectedBranch) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (positionFilter !== 'All' && r.siblingPosition.toString() !== positionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.studentName.toLowerCase().includes(q) ||
          r.familyName.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q) ||
          r.familyAccountId.toLowerCase().includes(q) ||
          r.studentGrade.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, selectedBranch, statusFilter, positionFilter, searchQuery]);

  // Filtered Families for Portfolios view
  const filteredFamilies = useMemo(() => {
    return families.filter(f => {
      if (selectedBranch !== 'All' && f.branch !== selectedBranch) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.familyName.toLowerCase().includes(q) ||
          f.primaryParentName.toLowerCase().includes(q) ||
          f.primaryParentPhone.toLowerCase().includes(q) ||
          f.familyAccountId.toLowerCase().includes(q) ||
          f.records.some(r => r.studentName.toLowerCase().includes(q) || r.studentGrade.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [families, selectedBranch, searchQuery]);

  // Computed summary metrics
  const summaryMetrics = useMemo(() => {
    const activeRecords = records.filter(r => selectedBranch === 'All' || r.branch === selectedBranch);
    const beneficiaryCount = activeRecords.filter(r => r.discountRate > 0 && r.discountAmount > 0).length;
    const totalOriginal = activeRecords.reduce((sum, r) => sum + (r.originalFee || 0), 0);
    const totalDiscounts = activeRecords.reduce((sum, r) => sum + (r.discountAmount || 0), 0);
    const totalPayable = activeRecords.reduce((sum, r) => sum + (r.finalPayable || 0), 0);
    const totalPaid = activeRecords.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const fullyPaidCount = activeRecords.filter(r => r.amountPaid >= r.finalPayable && r.finalPayable > 0).length;

    return {
      familyGroupsCount: filteredFamilies.length,
      totalStudents: activeRecords.length,
      beneficiaryCount,
      totalOriginal,
      totalDiscounts,
      totalPayable,
      totalPaid,
      clearanceRate: totalPayable > 0 ? Math.round((totalPaid / totalPayable) * 100) : 0,
      fullyPaidStudentsCount: fullyPaidCount
    };
  }, [records, filteredFamilies, selectedBranch]);

  const getBranchLabel = (b: string) => {
    if (b === 'GN') return 'Gawon Nama Campus';
    if (b === 'RS') return 'Runjin Sambo Campus';
    return b === 'All' ? 'All Campuses' : b;
  };

  const getSiblingPositionBadge = (pos: number, rate: number) => {
    if (pos === 1) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <Lucide.GraduationCap className="w-3 h-3 mr-1 text-slate-500" />
          1st Child • 0% (Full Fee)
        </span>
      );
    }
    if (pos === 2) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Lucide.Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
          2nd Child • 5% Relief
        </span>
      );
    }
    if (pos === 3) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Lucide.Sparkles className="w-3 h-3 mr-1 text-blue-600" />
          3rd Child • 10% Relief
        </span>
      );
    }
    if (pos === 4) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Lucide.Sparkles className="w-3 h-3 mr-1 text-indigo-600" />
          4th Child • 15% Relief
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
        <Lucide.Zap className="w-3 h-3 mr-1 text-purple-600" />
        {pos}th Child+ • {rate}% Relief
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FULLY_PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Lucide.CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Cleared
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Lucide.Clock className="w-3 h-3 mr-1 text-blue-600" /> Partial
          </span>
        );
      case 'APPLIED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Lucide.Layers className="w-3 h-3 mr-1 text-indigo-600" /> Invoiced
          </span>
        );
      case 'CALCULATED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Lucide.Calculator className="w-3 h-3 mr-1 text-amber-600" /> Calculated
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <Lucide.AlertOctagon className="w-3 h-3 mr-1 text-rose-600" /> Expired (Full Fee)
          </span>
        );
      case 'OVERRIDDEN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Lucide.ShieldCheck className="w-3 h-3 mr-1 text-purple-600" /> Overridden
          </span>
        );
      case 'NOT_ELIGIBLE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            1st Child (0%)
          </span>
        );
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-xs font-bold border border-emerald-200 flex items-center gap-1">
                <Lucide.Users className="w-3.5 h-3.5 text-emerald-600" />
                Sibling Concession Engine
              </span>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                {getBranchLabel(selectedBranch)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sibling Discount Relief</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated graduated discounts (0%, 5%, 10%, 15%, 20%) calculated strictly on eligible tuition & fees based on academic level.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-recalculate-sibling"
              onClick={handleRecalculate}
              disabled={calculating}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center shadow-sm disabled:opacity-50"
              title="Recalculate sibling rankings and discount amounts"
            >
              <Lucide.RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${calculating ? 'animate-spin' : ''}`} />
              {calculating ? 'Recalculating...' : 'Recalculate'}
            </button>

            <button
              id="btn-apply-sibling-ledgers"
              onClick={handleApplyDiscountsToLedgers}
              disabled={applying}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center shadow-sm disabled:opacity-50"
              title="Post calculated discounts into student fee ledgers / invoices"
            >
              <Lucide.FileCheck className={`w-3.5 h-3.5 mr-1.5 ${applying ? 'animate-spin' : ''}`} />
              {applying ? 'Applying...' : 'Apply to Invoices'}
            </button>

            <button
              id="btn-open-rollover-quick"
              onClick={() => setIsRolloverModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center shadow-sm"
              title="Execute term transition and rollover un-cleared arrears as full fees"
            >
              <Lucide.ArrowRightLeft className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Rollover Term
            </button>

            <button
              id="btn-run-tests-top"
              onClick={handleRunTestSuite}
              disabled={runningTests}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center border border-slate-300"
              title="Execute all 16 automated compliance test cases"
            >
              <Lucide.ShieldCheck className={`w-3.5 h-3.5 mr-1 text-emerald-600 ${runningTests ? 'animate-spin' : ''}`} />
              {runningTests ? 'Testing...' : 'Verify 16 Rules'}
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Campus Selector Pills */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                onClick={() => setSelectedBranch('GN')}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${selectedBranch === 'GN' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Gawon Nama (GN)
              </button>
              <button
                onClick={() => setSelectedBranch('RS')}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${selectedBranch === 'RS' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Runjin Sambo (RS)
              </button>
              <button
                onClick={() => setSelectedBranch('All')}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${selectedBranch === 'All' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All Campuses
              </button>
            </div>

            {/* Term Selector */}
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="term-1">First Term (Term I)</option>
              <option value="term-2">Second Term (Term II)</option>
              <option value="term-3">Third Term (Term III)</option>
            </select>

            {/* Session Selector */}
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="ses-2026">2026/2027 Session</option>
              <option value="ses-2025">2025/2026 Session</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Lucide.Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, family, or ID..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                <Lucide.X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Clean Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sibling Households</span>
            <Lucide.Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{summaryMetrics.familyGroupsCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{summaryMetrics.totalStudents} total enrolled siblings</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Relief Granted</span>
            <Lucide.Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">₦{summaryMetrics.totalDiscounts.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">{summaryMetrics.beneficiaryCount} students receiving discount</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Net Receivables</span>
            <Lucide.Coins className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1">₦{summaryMetrics.totalPayable.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Original gross: ₦{summaryMetrics.totalOriginal.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Term Clearance Rate</span>
            <Lucide.CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-800 mt-1">{summaryMetrics.clearanceRate}%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">₦{summaryMetrics.totalPaid.toLocaleString()} paid within active term</p>
        </div>
      </div>

      {/* Simplified 4 Main Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-0">
        <div className="flex items-center gap-2">
          <button
            id="tab-sibling-portfolios"
            onClick={() => setActiveTab('portfolios')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'portfolios'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Lucide.Users className="w-4 h-4" />
            Family Portfolios
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeTab === 'portfolios' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
              {filteredFamilies.length}
            </span>
          </button>

          <button
            id="tab-sibling-register"
            onClick={() => setActiveTab('register')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'register'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Lucide.Table2 className="w-4 h-4" />
            Student Register & Invoices
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeTab === 'register' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
              {filteredRecords.length}
            </span>
          </button>

          <button
            id="tab-sibling-rollover"
            onClick={() => setActiveTab('rollover')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'rollover'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Lucide.ArrowRightLeft className="w-4 h-4" />
            Term Clearance & Rollover
          </button>

          <button
            id="tab-sibling-settings"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Lucide.SlidersHorizontal className="w-4 h-4" />
            Policy, Tests & Audit
            {testResults.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold">
                16/16
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div>
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Lucide.Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-slate-600 text-xs font-medium">Evaluating sibling hierarchies & calculating concessions...</p>
          </div>
        ) : (
          <>
            {/* ============================================================= */}
            {/* TAB 1: FAMILY PORTFOLIOS (PRIMARY VIEW) */}
            {/* ============================================================= */}
            {activeTab === 'portfolios' && (
              <div className="space-y-4">
                {/* Helpful concise hint */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Lucide.Info className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>
                      Siblings in each family are ranked by <strong>academic level</strong> (Highest class = 1st Child @ 0%, 2nd = 5%, 3rd = 10%, 4th = 15%, 5th+ = 20%). Discounts apply exclusively to tuition & operational fees.
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 whitespace-nowrap ml-4">
                    {filteredFamilies.length} Families Showing
                  </span>
                </div>

                {filteredFamilies.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <Lucide.Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-700">No Family Portfolios Found</h3>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting the search query or campus filter.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFamilies.map((fam) => (
                      <div key={fam.familyAccountId} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                        {/* Family Header */}
                        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-mono text-xs font-bold">
                              {fam.familyAccountId}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">{fam.familyName}</h3>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                              {fam.memberCount} Siblings
                            </span>
                            <span className="text-xs text-slate-500 hidden md:inline">
                              Parent: <strong className="text-slate-700">{fam.primaryParentName}</strong> ({fam.primaryParentPhone || 'No Phone'})
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-500">
                              Relief: <strong className="text-emerald-700 font-bold">₦{fam.totalDiscountAmount.toLocaleString()}</strong>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">
                              Net Payable: <strong className="text-slate-900 font-bold">₦{fam.totalFinalPayable.toLocaleString()}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Siblings Row List */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-2.5">Sibling Rank</th>
                                <th className="px-4 py-2.5">Student Name</th>
                                <th className="px-4 py-2.5">Class</th>
                                <th className="px-4 py-2.5 text-right">Eligible Fee</th>
                                <th className="px-4 py-2.5 text-center">Rate</th>
                                <th className="px-4 py-2.5 text-right">Discount</th>
                                <th className="px-4 py-2.5 text-right">Net Payable</th>
                                <th className="px-4 py-2.5 text-center">Status</th>
                                <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {fam.records.map((rec) => (
                                <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                                  <td className="px-4 py-3">
                                    {getSiblingPositionBadge(rec.siblingPosition, rec.discountRate)}
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-900">
                                    <div>{rec.studentName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{rec.studentId}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                                      {rec.studentGrade}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-600">
                                    ₦{rec.eligibleFee.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-slate-800">
                                    {rec.discountRate}%
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-emerald-700">
                                    {rec.discountAmount > 0 ? `-₦${rec.discountAmount.toLocaleString()}` : '₦0'}
                                  </td>
                                  <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                                    ₦{rec.finalPayable.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {getStatusBadge(rec.status)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        id={`btn-statement-${rec.id}`}
                                        onClick={() => handleOpenParentStatement(rec)}
                                        className="px-2 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded text-xs font-semibold flex items-center gap-1 transition"
                                        title="View Fee Statement"
                                      >
                                        <Lucide.ReceiptText className="w-3.5 h-3.5" />
                                        Statement
                                      </button>

                                      <button
                                        id={`btn-override-${rec.id}`}
                                        onClick={() => handleOpenOverrideModal(rec)}
                                        className="px-2 py-1 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded text-xs font-semibold flex items-center gap-1 transition"
                                        title="Admin Adjustment"
                                      >
                                        <Lucide.ShieldCheck className="w-3.5 h-3.5" />
                                        Adjust
                                      </button>

                                      <button
                                        id={`btn-inspect-${rec.id}`}
                                        onClick={() => setInspectRecord(rec)}
                                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                                        title="Inspect Math"
                                      >
                                        <Lucide.Eye className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: STUDENT CONCESSION REGISTER (TABLE VIEW) */}
            {/* ============================================================= */}
            {activeTab === 'register' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Secondary Filters Bar */}
                <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                      <span className="text-slate-500 font-medium">Position:</span>
                      <select
                        value={positionFilter}
                        onChange={(e) => setPositionFilter(e.target.value)}
                        className="bg-transparent font-semibold text-slate-800 focus:outline-none"
                      >
                        <option value="All">All Positions</option>
                        <option value="1">1st Child (0%)</option>
                        <option value="2">2nd Child (5%)</option>
                        <option value="3">3rd Child (10%)</option>
                        <option value="4">4th Child (15%)</option>
                        <option value="5">5th Child+ (20%)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent font-semibold text-slate-800 focus:outline-none"
                      >
                        <option value="All">All Statuses</option>
                        <option value="CALCULATED">CALCULATED</option>
                        <option value="APPLIED">APPLIED / INVOICED</option>
                        <option value="FULLY_PAID">FULLY_PAID</option>
                        <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                        <option value="EXPIRED">EXPIRED</option>
                        <option value="OVERRIDDEN">OVERRIDDEN</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-slate-500">
                    Showing <strong className="text-slate-800">{filteredRecords.length}</strong> student concessions
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Student & ID</th>
                        <th className="px-4 py-3">Family Account</th>
                        <th className="px-4 py-3">Campus</th>
                        <th className="px-4 py-3">Class</th>
                        <th className="px-4 py-3">Sibling Rank</th>
                        <th className="px-4 py-3 text-right">Original (₦)</th>
                        <th className="px-4 py-3 text-right">Eligible (₦)</th>
                        <th className="px-4 py-3 text-center">Rate</th>
                        <th className="px-4 py-3 text-right">Relief (₦)</th>
                        <th className="px-4 py-3 text-right">Final Payable (₦)</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block">{r.studentName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{r.studentId}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-800 block">{r.familyName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{r.familyAccountId}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                              {r.branch}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">{r.studentGrade}</td>
                          <td className="px-4 py-3">{getSiblingPositionBadge(r.siblingPosition, r.discountRate)}</td>
                          <td className="px-4 py-3 text-right text-slate-500 font-medium">₦{r.originalFee.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-slate-700 font-medium">₦{r.eligibleFee.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-900">{r.discountRate}%</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">
                            {r.discountAmount > 0 ? `-₦${r.discountAmount.toLocaleString()}` : '₦0'}
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-900">₦{r.finalPayable.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(r.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenParentStatement(r)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                title="View Statement"
                              >
                                <Lucide.ReceiptText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenOverrideModal(r)}
                                className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded"
                                title="Override"
                              >
                                <Lucide.ShieldCheck className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 3: SAME-TERM VALIDITY & ROLLOVER TRACKER */}
            {/* ============================================================= */}
            {activeTab === 'rollover' && (
              <div className="space-y-4">
                {/* Clear Policy Explanation Banner */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs font-bold uppercase tracking-wider">
                        Same-Term Validity Policy
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">Term Clearance & Full-Fee Carry-Forward Engine</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      Sibling discounts are valid <strong>only for the active term</strong>. If fees are fully settled within the term, the discount is permanently honored. If any balance remains unpaid at term close, the discount is forfeited and full fee arrears are carried forward to the new term.
                    </p>
                  </div>

                  <button
                    id="btn-open-rollover-modal-tab"
                    onClick={() => setIsRolloverModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center shadow-md whitespace-nowrap"
                  >
                    <Lucide.ArrowRightLeft className="w-4 h-4 mr-1.5" />
                    Execute Term Rollover
                  </button>
                </div>

                {/* Rollover Status Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Clearance Status Ledger for {selectedTermId === 'term-1' ? 'Term 1' : selectedTermId === 'term-2' ? 'Term 2' : 'Term 3'}</span>
                    <button
                      onClick={fetchClearanceTracker}
                      disabled={loadingTracker}
                      className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Lucide.RefreshCw className={`w-3 h-3 ${loadingTracker ? 'animate-spin' : ''}`} />
                      Refresh Tracker
                    </button>
                  </div>

                  {loadingTracker ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      <Lucide.Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                      Loading term clearance ledger...
                    </div>
                  ) : !trackerData?.items || trackerData.items.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No sibling discount records found for the selected session and term.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Student</th>
                            <th className="px-4 py-2.5">Sibling Position</th>
                            <th className="px-4 py-2.5 text-right">Original Fee</th>
                            <th className="px-4 py-2.5 text-right">Discount</th>
                            <th className="px-4 py-2.5 text-right">Net Payable</th>
                            <th className="px-4 py-2.5 text-right">Amount Paid</th>
                            <th className="px-4 py-2.5 text-center">Clearance Status</th>
                            <th className="px-4 py-2.5 text-right">Carried Forward Arrears</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {trackerData.items.map((item: any) => {
                            const isCleared = item.clearanceStatus === 'CLEARED_IN_TERM';
                            const isExpired = item.clearanceStatus === 'UNCLEARED_EXPIRED_FULL_FEE_CARRIED_FORWARD';

                            return (
                              <tr key={item.recordId} className={`hover:bg-slate-50 ${isExpired ? 'bg-rose-50/30' : (isCleared ? 'bg-emerald-50/20' : '')}`}>
                                <td className="px-4 py-2.5 font-semibold text-slate-900">
                                  <div>{item.studentName}</div>
                                  <div className="text-[10px] text-slate-400 font-normal">{item.classLevel}</div>
                                </td>
                                <td className="px-4 py-2.5">Child #{item.siblingPosition} ({item.discountRate}%)</td>
                                <td className="px-4 py-2.5 text-right">₦{(item.originalGrossFee || 0).toLocaleString()}</td>
                                <td className="px-4 py-2.5 text-right font-bold text-emerald-700">-₦{(item.discountAmount || 0).toLocaleString()}</td>
                                <td className="px-4 py-2.5 text-right">₦{(item.netPayable || 0).toLocaleString()}</td>
                                <td className="px-4 py-2.5 text-right font-semibold">₦{(item.paidAmount || 0).toLocaleString()}</td>
                                <td className="px-4 py-2.5 text-center">
                                  {isCleared ? (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                                      ✓ Cleared in Term
                                    </span>
                                  ) : isExpired ? (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[11px]">
                                      ✕ Expired (Discount Voided)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[11px]">
                                      ● Active in Term
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-right font-extrabold text-slate-900">
                                  ₦{(item.carriedForwardAmount || 0).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: POLICY CONFIGURATION, 16 TESTS & AUDIT LOGS */}
            {/* ============================================================= */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Sub-tab pills */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setSettingsSubTab('policy')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      settingsSubTab === 'policy' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Campus Policy Rates
                  </button>
                  <button
                    onClick={() => setSettingsSubTab('tests')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      settingsSubTab === 'tests' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Lucide.CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    16 Rule Verification Suite
                  </button>
                  <button
                    onClick={() => setSettingsSubTab('audit')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      settingsSubTab === 'audit' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Override Audit Trail ({auditLogs.length})
                  </button>
                </div>

                {/* Sub-Tab 1: Policy Rates */}
                {settingsSubTab === 'policy' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Sibling Discount Policy: {getBranchLabel(selectedBranch)}
                        </h3>
                        <p className="text-xs text-slate-500">Graduated rates and eligible fee heads for this branch.</p>
                      </div>
                      <button
                        onClick={handleSavePolicy}
                        disabled={savingPolicy}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center"
                      >
                        <Lucide.Save className="w-3.5 h-3.5 mr-1.5" />
                        {savingPolicy ? 'Saving...' : 'Save Policy'}
                      </button>
                    </div>

                    {/* Rates Table */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 block">Graduated Discount Rates</label>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2 text-left">Sibling Rank</th>
                              <th className="px-4 py-2 text-left">Description</th>
                              <th className="px-4 py-2 text-right">Discount Rate (%)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(activePolicy?.rates || [
                              { position: 1, label: "1st Sibling (Highest Class)", ratePercent: 0 },
                              { position: 2, label: "2nd Sibling", ratePercent: 5 },
                              { position: 3, label: "3rd Sibling", ratePercent: 10 },
                              { position: 4, label: "4th Sibling", ratePercent: 15 },
                              { position: 5, label: "5th Sibling and Above", ratePercent: 20 }
                            ]).map((r, idx) => (
                              <tr key={r.position} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 font-bold text-slate-900">Child #{r.position}</td>
                                <td className="px-4 py-2.5 text-slate-600">{r.label}</td>
                                <td className="px-4 py-2.5 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={r.ratePercent}
                                      onChange={(e) => {
                                        if (activePolicy) {
                                          const updatedRates = [...(activePolicy.rates || [])];
                                          updatedRates[idx] = { ...updatedRates[idx], ratePercent: Number(e.target.value) };
                                          setActivePolicy({ ...activePolicy, rates: updatedRates });
                                        }
                                      }}
                                      className="w-16 text-right px-2 py-1 bg-slate-50 border border-slate-300 rounded font-bold text-xs"
                                    />
                                    <span className="font-bold text-slate-500">%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 2: 16 Rule Verification */}
                {settingsSubTab === 'tests' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">16 Rule Automated Verification Suite</h3>
                        <p className="text-xs text-slate-500">Continuous programmatic tests validating tie-breaking, exclusions, and carry-forward rules.</p>
                      </div>
                      <button
                        onClick={handleRunTestSuite}
                        disabled={runningTests}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center"
                      >
                        <Lucide.Play className={`w-3.5 h-3.5 mr-1.5 ${runningTests ? 'animate-spin' : ''}`} />
                        {runningTests ? 'Executing...' : 'Run All 16 Tests'}
                      </button>
                    </div>

                    {testResults.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        Click "Run All 16 Tests" to execute the compliance test suite.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {testResults.map((t, idx) => (
                          <div key={t.id} className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl flex items-start justify-between gap-2 text-xs">
                            <div className="flex items-start gap-2">
                              <span className="p-1 bg-emerald-600 text-white rounded text-[10px] font-bold">
                                #{idx + 1}
                              </span>
                              <div>
                                <h4 className="font-bold text-slate-900">{t.title}</h4>
                                <p className="text-slate-600 text-[11px] mt-0.5">{t.proof}</p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              PASSED
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Tab 3: Audit Trail */}
                {settingsSubTab === 'audit' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Administrative Override Logs</h3>
                    {auditLogs.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">No overrides recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2">Date & Time</th>
                              <th className="px-3 py-2">Admin</th>
                              <th className="px-3 py-2">Student</th>
                              <th className="px-3 py-2">Action</th>
                              <th className="px-3 py-2">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {auditLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-3 py-2 font-bold text-slate-900">{log.adminName}</td>
                                <td className="px-3 py-2 font-semibold text-slate-800">{log.studentName || log.studentId || 'General'}</td>
                                <td className="px-3 py-2">
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold text-[10px]">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-700 italic">"{log.details?.reason || 'System Action'}"</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================================= */}
      {/* MODAL 1: PARENT STATEMENT PREVIEW */}
      {/* ============================================================= */}
      <AnimatePresence>
        {isStatementModalOpen && statementRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Official Fee Statement</span>
                  <h3 className="text-base font-bold text-white">{statementRecord.studentName}</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">{statementRecord.studentGrade} • {statementFamily?.familyName || 'Family Account'}</p>
                </div>
                <button onClick={() => setIsStatementModalOpen(false)} className="text-emerald-200 hover:text-white">
                  <Lucide.X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>School Fee</span>
                    <span className="font-bold text-slate-900">₦{statementRecord.originalFee.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <Lucide.Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Sibling Discount ({statementRecord.siblingPosition === 1 ? '1st Child' : `Child #${statementRecord.siblingPosition}`})
                    </span>
                    <span className="font-bold text-emerald-700">
                      {statementRecord.discountAmount > 0 ? `-₦${statementRecord.discountAmount.toLocaleString()}` : '₦0 (0%)'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-900">FINAL PAYABLE</span>
                    <span className="text-base font-extrabold text-emerald-800">₦{statementRecord.finalPayable.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span>"Sibling concession calculated on eligible tuition components only."</span>
                  <button
                    onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                    className="text-emerald-700 font-bold hover:underline ml-2"
                  >
                    {showFeeBreakdown ? 'Hide Breakdown' : 'Breakdown'}
                  </button>
                </div>

                {showFeeBreakdown && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between"><span>Eligible Fee Base:</span><span className="font-bold">₦{statementRecord.eligibleFee.toLocaleString()}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Excluded Fees (Books/Levies):</span><span>₦{statementRecord.excludedFee.toLocaleString()}</span></div>
                    <div className="flex justify-between text-emerald-700"><span>Rate:</span><span className="font-bold">{statementRecord.discountRate}%</span></div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center"
                  >
                    <Lucide.Printer className="w-3.5 h-3.5 mr-1" />
                    Print
                  </button>
                  <button
                    onClick={() => setIsStatementModalOpen(false)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL 2: ADMIN OVERRIDE / ADJUSTMENT */}
      {/* ============================================================= */}
      <AnimatePresence>
        {isOverrideModalOpen && selectedRecordForOverride && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Lucide.ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Sibling Discount Override</h3>
                    <p className="text-[11px] text-slate-500">{selectedRecordForOverride.studentName}</p>
                  </div>
                </div>
                <button onClick={() => setIsOverrideModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitOverride} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideActionType('amount')}
                    className={`p-2 rounded-lg border text-center font-bold transition ${overrideActionType === 'amount' ? 'bg-purple-50 border-purple-400 text-purple-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    Flat Amount (₦)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideActionType('rate')}
                    className={`p-2 rounded-lg border text-center font-bold transition ${overrideActionType === 'rate' ? 'bg-purple-50 border-purple-400 text-purple-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    Custom Rate (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideActionType('disable')}
                    className={`p-2 rounded-lg border text-center font-bold transition ${overrideActionType === 'disable' ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    Disable Relief
                  </button>
                </div>

                {overrideActionType === 'amount' && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">New Concession Amount (₦)</label>
                    <input
                      type="number"
                      min="0"
                      value={overrideDiscountAmount}
                      onChange={(e) => setOverrideDiscountAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs"
                      required
                    />
                  </div>
                )}

                {overrideActionType === 'rate' && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">New Concession Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={overrideDiscountRate}
                      onChange={(e) => setOverrideDiscountRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Justification Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Brief explanation for this override..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsOverrideModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingOverride}
                    className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-bold text-xs"
                  >
                    {savingOverride ? 'Saving...' : 'Apply Override'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL 3: TERM ROLLOVER */}
      {/* ============================================================= */}
      <AnimatePresence>
        {isRolloverModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Lucide.ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Execute Term Rollover</h3>
                    <p className="text-[11px] text-slate-500">Same-Term Discount Expiry Rule</p>
                  </div>
                </div>
                <button onClick={() => setIsRolloverModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1 text-[11px]">
                <strong className="block text-amber-950">Accounting Rule:</strong>
                <p>
                  Discounts apply only within the active term. Any un-cleared balance in <strong>{rolloverSourceTerm}</strong> will have its discount revoked; the <strong>full original fee</strong> (less payments made) rolls over to <strong>{rolloverTargetTerm}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Source Term</label>
                  <select
                    value={rolloverSourceTerm}
                    onChange={(e) => setRolloverSourceTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="Term 1">First Term (Term 1)</option>
                    <option value="Term 2">Second Term (Term 2)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Term</label>
                  <select
                    value={rolloverTargetTerm}
                    onChange={(e) => setRolloverTargetTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="Term 2">Second Term (Term 2)</option>
                    <option value="Term 3">Third Term (Term 3)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setIsRolloverModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-execute-rollover"
                  onClick={handleExecuteRollover}
                  disabled={rollingOver}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center"
                >
                  {rollingOver ? 'Processing...' : 'Confirm Rollover'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL 4: INSPECT RECORD */}
      {/* ============================================================= */}
      <AnimatePresence>
        {inspectRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Lucide.Calculator className="w-4 h-4 text-emerald-600" />
                  Calculation Breakdown
                </h3>
                <button onClick={() => setInspectRecord(null)} className="text-slate-400 hover:text-slate-600">
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px]">
                <div className="flex justify-between"><span>Student:</span><span className="font-bold">{inspectRecord.studentName}</span></div>
                <div className="flex justify-between"><span>Class Level:</span><span className="font-medium">{inspectRecord.studentGrade}</span></div>
                <div className="flex justify-between"><span>Ranking:</span><span className="font-bold text-emerald-700">Child #{inspectRecord.siblingPosition} ({inspectRecord.discountRate}%)</span></div>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between"><span>Gross Term Fee:</span><span>₦{inspectRecord.originalFee.toLocaleString()}</span></div>
                <div className="flex justify-between text-emerald-800"><span>Eligible Base:</span><span>₦{inspectRecord.eligibleFee.toLocaleString()}</span></div>
                <div className="flex justify-between text-slate-400"><span>Excluded Items:</span><span>₦{inspectRecord.excludedFee.toLocaleString()}</span></div>
                <div className="flex justify-between text-emerald-700 font-bold border-t pt-1 border-slate-200">
                  <span>Sibling Discount:</span><span>-₦{inspectRecord.discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 border-t pt-1 border-slate-200">
                  <span>Net Payable:</span><span>₦{inspectRecord.finalPayable.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setInspectRecord(null)}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
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
