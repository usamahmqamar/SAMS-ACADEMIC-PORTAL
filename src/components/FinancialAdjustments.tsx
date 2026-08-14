import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Toast from './Toast';
import { Teacher } from '../App';
import { 
  Plus, 
  Trash2, 
  Coins, 
  User,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Filter
} from 'lucide-react';

interface FinancialAdjustmentsProps {
  teachers: Teacher[];
  loans: {
    [teacherId: string]: {
      id: string;
      totalAmount: number;
      installments: number;
      startMonth: string;
    }[]
  };
  setLoans: React.Dispatch<React.SetStateAction<{
    [teacherId: string]: {
      id: string;
      totalAmount: number;
      installments: number;
      startMonth: string;
    }[]
  }>>;
  advanceSalaries: {
    [teacherId_month: string]: number;
  };
  setAdvanceSalaries: React.Dispatch<React.SetStateAction<{
    [teacherId_month: string]: number;
  }>>;
  bonuses: {
    [teacherId_month: string]: number;
  };
  setBonuses: React.Dispatch<React.SetStateAction<{
    [teacherId_month: string]: number;
  }>>;
}

const MONTHS_LIST = ["June 2026", "July 2026", "August 2026", "September 2026"];

export default function FinancialAdjustments({
  teachers,
  loans,
  setLoans,
  advanceSalaries,
  setAdvanceSalaries,
  bonuses,
  setBonuses
}: FinancialAdjustmentsProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teaching' | 'non-teaching' | 'management'>('all');

  // Form states
  const [bonusAmount, setBonusAmount] = useState<string>('');
  const [bonusMonth, setBonusMonth] = useState<string>('June 2026');

  // New bonus target states
  const [bonusTargetMode, setBonusTargetMode] = useState<'single' | 'multiple' | 'group'>('single');
  const [selectedBonusTeacherIds, setSelectedBonusTeacherIds] = useState<string[]>([]);
  const [bonusTargetGroup, setBonusTargetGroup] = useState<'all' | 'teaching' | 'non-teaching' | 'management'>('all');
  const [showAllSystemBonuses, setShowAllSystemBonuses] = useState<boolean>(false);
  const [bonusSelectionSearch, setBonusSelectionSearch] = useState<string>('');

  const [advanceAmount, setAdvanceAmount] = useState<string>('');
  const [advanceMonth, setAdvanceMonth] = useState<string>('June 2026');

  const [loanPrincipal, setLoanPrincipal] = useState<string>('');
  const [loanInstallments, setLoanInstallments] = useState<string>('3');
  const [loanStartMonth, setLoanStartMonth] = useState<string>('June 2026');

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  const resolveBaseSalary = (t: Teacher): number => {
    if (t.payroll && t.payroll.length > 0) {
      return t.payroll[0].basic;
    }
    if (t.role === 'management') return 4800;
    if (t.role === 'teaching') return 3500;
    return 2600; 
  };

  // Filter teachers
  const filteredTeacherList = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || t.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Action: Add / Update Bonus
  const handleAddBonus = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(bonusAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setToast({ message: "Please input a valid positive bonus amount!", type: "warning" });
      return;
    }

    if (bonusTargetMode === 'single') {
      if (!selectedTeacherId) {
        setToast({ message: "Please select an employee first.", type: "warning" });
        return;
      }
      const key = `${selectedTeacherId}_${bonusMonth}`;
      setBonuses(prev => ({
        ...prev,
        [key]: parsed
      }));
      setBonusAmount('');
      setToast({
        message: `Success! performance bonus of ₦${parsed.toLocaleString()} for ${selectedTeacher?.name} recorded for "${bonusMonth}".`,
        type: 'success'
      });
    } else if (bonusTargetMode === 'multiple') {
      if (selectedBonusTeacherIds.length === 0) {
        setToast({ message: "Please select at least one employee from the list!", type: "warning" });
        return;
      }
      setBonuses(prev => {
        const next = { ...prev };
        selectedBonusTeacherIds.forEach(id => {
          next[`${id}_${bonusMonth}`] = parsed;
        });
        return next;
      });
      setBonusAmount('');
      setSelectedBonusTeacherIds([]);
      setToast({
        message: `Success! performance bonus of ₦${parsed.toLocaleString()} granted to ${selectedBonusTeacherIds.length} selected employees for "${bonusMonth}".`,
        type: 'success'
      });
    } else if (bonusTargetMode === 'group') {
      const targets = teachers.filter(t => bonusTargetGroup === 'all' || t.role === bonusTargetGroup);
      if (targets.length === 0) {
        setToast({ message: "No employees found in the selected role group.", type: "warning" });
        return;
      }
      setBonuses(prev => {
        const next = { ...prev };
        targets.forEach(t => {
          next[`${t.id}_${bonusMonth}`] = parsed;
        });
        return next;
      });
      setBonusAmount('');
      setToast({
        message: `Success! performance bonus of ₦${parsed.toLocaleString()} granted to all ${targets.length} employees in the "${bonusTargetGroup}" role group for "${bonusMonth}".`,
        type: 'success'
      });
    }
  };

  // Action: Remove Bonus Key (flexible)
  const handleRemoveBonusByKey = (key: string) => {
    setBonuses(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Action: Remove Bonus
  const handleRemoveBonus = (month: string) => {
    if (!selectedTeacherId) return;
    const key = `${selectedTeacherId}_${month}`;
    handleRemoveBonusByKey(key);
  };

  // Action: Add / Update Salary Advance
  const handleAddAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;
    const parsed = parseFloat(advanceAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setToast({ message: "Please input a valid positive salary advance amount!", type: "warning" });
      return;
    }
    const key = `${selectedTeacherId}_${advanceMonth}`;
    setAdvanceSalaries(prev => ({
      ...prev,
      [key]: parsed
    }));
    setAdvanceAmount('');
    setToast({
      message: `Success! salary advance of ₦${parsed.toLocaleString()} for ${selectedTeacher?.name} recorded for "${advanceMonth}".`,
      type: 'success'
    });
  };

  // Action: Remove Salary Advance
  const handleRemoveAdvance = (month: string) => {
    if (!selectedTeacherId) return;
    const key = `${selectedTeacherId}_${month}`;
    setAdvanceSalaries(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Action: Add Loan Account
  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;
    const amt = parseFloat(loanPrincipal);
    const inst = parseInt(loanInstallments);
    if (isNaN(amt) || amt <= 0) {
      setToast({ message: "Please input a valid borrowing principal amount!", type: "warning" });
      return;
    }

    const newLoan = {
      id: 'loan-' + Date.now(),
      totalAmount: amt,
      installments: inst,
      startMonth: loanStartMonth
    };

    setLoans(prev => {
      const curr = prev[selectedTeacherId] || [];
      return {
        ...prev,
        [selectedTeacherId]: [...curr, newLoan]
      };
    });

    setLoanPrincipal('');
    setToast({
      message: `Success! Loan borrowing account activated for ${selectedTeacher?.name}. ₦${amt.toLocaleString()} principal with support of ${inst} monthly installments starting ${loanStartMonth}.`,
      type: 'success'
    });
  };

  // Action: Cancel Loan
  const handleRemoveLoan = (loanId: string) => {
    if (!selectedTeacherId) return;
    if (confirm("Are you sure you want to completely cancel and delete this staff loan amortization account?")) {
      setLoans(prev => {
        const list = prev[selectedTeacherId] || [];
        const nextList = list.filter(l => l.id !== loanId);
        return {
          ...prev,
          [selectedTeacherId]: nextList
        };
      });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-3xl p-6 relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-8">
          <Coins className="w-80 h-80 text-white" />
        </div>
        <div className="max-w-3xl space-y-2 relative z-10">
          <div className="flex items-center gap-1.5 text-xs bg-indigo-500/20 border border-indigo-400/35 px-3 py-1 rounded-full w-fit font-bold tracking-wide uppercase text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
            <span>Staff Discretionary Benefits Ledger</span>
          </div>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            Mid-Month Financial Setup Hub
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-medium">
            Grant bonuses, approve salary advances, and activate loan schedules for any workforce member <strong className="text-amber-300 font-bold">instantly at any stage</strong> during the school term. The system will automatically index and reflect these allocations into the corresponding Monthly Payroll Ledger calculations when applicable. There's no need to wait for month-end reconciliation to disburse.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: STAFF PERSONNEL SELECTOR (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-4 shadow-xs">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-widest block">
              1. Search Employees
            </span>

            {/* Quick Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold font-sans outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1 border-b border-rose-100 pb-3">
              {(['all', 'teaching', 'non-teaching', 'management'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide cursor-pointer select-none border transition-all ${
                    roleFilter === r
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-100/50 border-slate-200 text-slate-600 hover:bg-slate-150'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Personnel List Container */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredTeacherList.map((t) => {
                const isSel = t.id === selectedTeacherId;
                const teacherLoans = loans[t.id] || [];
                
                // Count current month adjustments (e.g. June 2026) for visual counts
                const hasAdvances = Object.keys(advanceSalaries).some(k => k.startsWith(t.id));
                const hasBonuses = Object.keys(bonuses).some(k => k.startsWith(t.id));

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSel 
                        ? 'bg-indigo-50 border-indigo-250 text-indigo-950 shadow-xs scale-[1.01]' 
                        : 'bg-white border-slate-150 hover:bg-slate-50/70 text-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <User className={`w-3.5 h-3.5 ${isSel ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="font-extrabold text-xs truncate max-w-[130px]">{t.name}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        ID: {t.id} | {t.qualification || 'Staff'}
                      </div>
                      
                      {/* Badge indicator counts */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="text-[8px] bg-indigo-100 text-indigo-805 px-1.5 py-0.5 rounded uppercase font-extrabold">
                          {t.role}
                        </span>
                        {teacherLoans.length > 0 && (
                          <span className="text-[8px] bg-amber-50 border border-amber-200 text-amber-850 px-1 py-0.2 rounded font-bold">
                            💼 {teacherLoans.length} {teacherLoans.length === 1 ? 'Loan' : 'Loans'}
                          </span>
                        )}
                        {hasBonuses && (
                          <span className="text-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-1 py-0.2 rounded font-bold">
                            ✨ Bonus
                          </span>
                        )}
                        {hasAdvances && (
                          <span className="text-[8px] bg-rose-50 border border-rose-150 text-rose-800 px-1 py-0.2 rounded font-bold">
                            💵 Adv
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSel ? 'text-indigo-600 translate-x-1' : 'text-slate-300'}`} />
                  </button>
                );
              })}

              {filteredTeacherList.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  No matching employees found inside register.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL OPERATIONS PANE (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedTeacher ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
              
              {/* Selected Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {selectedTeacher.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {(selectedTeacher.role || 'faculty').toUpperCase()} • {selectedTeacher.qualification || 'No Degree Registered'}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Base Monthly Salary
                  </span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    ₦{resolveBaseSalary(selectedTeacher).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* SECTION A: PERFORMANCE BONUSES */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-205 pb-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-spin-slow" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Staff Monthly performance Bonuses
                    </h4>
                  </div>
                  
                  {/* Target Mode Selector Tabs */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[9px] uppercase font-black text-slate-500 w-fit self-end">
                    <button
                      type="button"
                      onClick={() => setBonusTargetMode('single')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${bonusTargetMode === 'single' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Single Personnel
                    </button>
                    <button
                      type="button"
                      onClick={() => setBonusTargetMode('multiple')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${bonusTargetMode === 'multiple' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Multiple Selection
                    </button>
                    <button
                      type="button"
                      onClick={() => setBonusTargetMode('group')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${bonusTargetMode === 'group' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      By Role Group
                    </button>
                  </div>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Setup form */}
                  <form onSubmit={handleAddBonus} className="space-y-3 bg-white border rounded-xl p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wide block">
                        + Issue Performance Bonus
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                        {bonusTargetMode === 'single' ? '1 Target' : bonusTargetMode === 'multiple' ? `${selectedBonusTeacherIds.length} Chosen` : 'Group'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       <div>
                        <label className="text-[9px] font-extrabold text-slate-500 uppercase block mb-1">Target Month</label>
                        <select 
                          value={bonusMonth}
                          onChange={(e) => setBonusMonth(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-205 rounded-lg px-2 py-1 text-xs font-bold cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {MONTHS_LIST.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-500 uppercase block mb-1">Gross Amount (₦)</label>
                        <input 
                          type="number"
                          placeholder="e.g. 500"
                          value={bonusAmount}
                          onChange={(e) => setBonusAmount(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-205 rounded-lg px-2 py-1 text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Single mode info */}
                    {bonusTargetMode === 'single' && (
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-2.5 space-y-1">
                        <span className="text-[8.5px] font-extrabold text-indigo-650 uppercase block">Selected Beneficiary</span>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-800">{selectedTeacher?.name}</span>
                          <span className="text-[9.5px] font-bold font-mono text-slate-500">ID: {selectedTeacher?.id}</span>
                        </div>
                      </div>
                    )}

                    {/* Multiple mode selection list */}
                    {bonusTargetMode === 'multiple' && (
                      <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/30 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                            <input
                              type="text"
                              placeholder="Search list..."
                              value={bonusSelectionSearch}
                              onChange={(e) => setBonusSelectionSearch(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-md pl-7 pr-2 py-0.5 text-[10px] font-medium outline-none"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const matchedIds = teachers
                                  .filter(t => t.name.toLowerCase().includes(bonusSelectionSearch.toLowerCase()) || t.id.toLowerCase().includes(bonusSelectionSearch.toLowerCase()))
                                  .map(t => t.id);
                                setSelectedBonusTeacherIds(prev => Array.from(new Set([...prev, ...matchedIds])));
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[8px] font-black px-1 py-0.5 rounded select-none cursor-pointer"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedBonusTeacherIds([])}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[8px] font-black px-1 py-0.5 rounded select-none cursor-pointer"
                            >
                              None
                            </button>
                          </div>
                        </div>

                        <div className="max-h-24 overflow-y-auto space-y-0.5 border border-slate-150 rounded bg-white p-1">
                          {(() => {
                            const filtered = teachers.filter(t => 
                              t.name.toLowerCase().includes(bonusSelectionSearch.toLowerCase()) ||
                              t.id.toLowerCase().includes(bonusSelectionSearch.toLowerCase())
                            );
                            if (filtered.length === 0) {
                              return <span className="text-[9px] italic text-slate-400 block text-center py-2">No matching personnel</span>;
                            }
                            return filtered.map(t => {
                              const checked = selectedBonusTeacherIds.includes(t.id);
                              return (
                                <label key={t.id} className="flex items-center space-x-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 p-1 rounded-sm cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedBonusTeacherIds(prev => [...prev, t.id]);
                                      } else {
                                        setSelectedBonusTeacherIds(prev => prev.filter(id => id !== t.id));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-3 h-3"
                                  />
                                  <span className="truncate">{t.name} <span className="text-[8px] text-slate-450">({t.role || 'faculty'})</span></span>
                                </label>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Group mode options */}
                    {bonusTargetMode === 'group' && (
                      <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-2.5 space-y-2">
                        <label className="text-[9px] font-extrabold text-slate-500 uppercase block">Select Target Group</label>
                        <select
                          value={bonusTargetGroup}
                          onChange={(e) => setBonusTargetGroup(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="all">All School Personnel ({teachers.length})</option>
                          <option value="teaching">All Teaching Staff ({teachers.filter(t => t.role === 'teaching').length})</option>
                          <option value="non-teaching">All Non-Teaching Staff ({teachers.filter(t => t.role === 'non-teaching').length})</option>
                          <option value="management">All Management Staff ({teachers.filter(t => t.role === 'management').length})</option>
                        </select>
                        <div className="text-[9px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 rounded p-1.5 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>This will instantly record the specified bonus amount for all matching members of the selection.</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      {bonusTargetMode === 'single' ? 'Grant Bonus to Current Staff ✅' : bonusTargetMode === 'multiple' ? `Grant Bonus to ${selectedBonusTeacherIds.length} Selected ✅` : `Grant Bonus to All in Group ✅`}
                    </button>
                  </form>

                  {/* Right: Active list with filter toggling for master visualization */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="text-[10px] font-black uppercase text-slate-450 tracking-wide block">
                        Currently Recorded Bonuses
                      </span>
                      
                      {/* Master list filter toggle */}
                      <div className="flex bg-slate-100 rounded p-0.5 text-[8.5px] font-bold text-slate-500 uppercase select-none">
                        <button
                          type="button"
                          onClick={() => setShowAllSystemBonuses(false)}
                          className={`px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors ${!showAllSystemBonuses ? 'bg-white text-indigo-950 shadow-2xs' : 'hover:text-slate-900'}`}
                        >
                          This Employee
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAllSystemBonuses(true)}
                          className={`px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors ${showAllSystemBonuses ? 'bg-white text-indigo-950 shadow-2xs' : 'hover:text-slate-900'}`}
                        >
                          System Wide
                        </button>
                      </div>
                    </div>
                    
                    {/* Filter and display bonuses */}
                    {(() => {
                      let entriesToShow: [string, number][] = [];
                      if (showAllSystemBonuses) {
                        entriesToShow = Object.entries(bonuses);
                      } else {
                        entriesToShow = Object.entries(bonuses).filter(([key]) => key.startsWith(selectedTeacherId));
                      }

                      if (entriesToShow.length === 0) {
                        return (
                          <div className="p-4 text-[10px] font-bold text-slate-400 italic text-center border border-dashed rounded-xl bg-white/40">
                            {showAllSystemBonuses ? 'No performance bonuses issued in the system.' : 'No bonuses recorded for this personnel.'}
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                          {entriesToShow.map(([key, amount]) => {
                            // Extract teacherId and month
                            const [teacherId, ...monthParts] = key.split('_');
                            const month = monthParts.join('_');
                            const recipient = teachers.find(t => t.id === teacherId);

                            return (
                              <div key={key} className="bg-white border rounded-xl p-2 flex items-center justify-between shadow-3xs hover:border-slate-300 transition-colors">
                                <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                                  <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-800">₦{amount.toLocaleString()}</span>
                                    {showAllSystemBonuses && recipient && (
                                      <span className="text-[8px] px-1 bg-indigo-50 text-indigo-750 font-bold rounded truncate max-w-[100px]">
                                        {recipient.name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1.5 text-[8.5px] font-bold text-slate-400">
                                    <span className="uppercase text-emerald-600 bg-emerald-50 px-1 rounded-sm">{month}</span>
                                    <span>ID: {teacherId}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBonusByKey(key)}
                                  className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0 animate-scale-in"
                                  title="Unbind/Delete Bonus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>


              {/* SECTION B: SALARY ADVANCES */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-205 pb-2">
                  <Coins className="w-4 h-4 text-rose-500 animate-pulse" />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Staff Mid-Month Salary Advances
                  </h4>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Setup form */}
                  <form onSubmit={handleAddAdvance} className="space-y-3 bg-white border rounded-xl p-3 shadow-2xs">
                    <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wide block">
                      + Issue Mid-Month Advance
                    </span>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-500 uppercase block mb-1">Target Reconcile Month</label>
                      <select 
                        value={advanceMonth}
                        onChange={(e) => setAdvanceMonth(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {MONTHS_LIST.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-500 uppercase block mb-1">Advance Principal Paid (₦)</label>
                      <input 
                        type="number"
                        placeholder="e.g. 400"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-[10px] py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Record Advance Disbursed 💵
                    </button>
                  </form>

                  {/* Right: Active list */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide block">
                      Currently Outstanding Advances
                    </span>
                    
                    {(() => {
                      const teacherAdvances = Object.entries(advanceSalaries).filter(([key]) => key.startsWith(selectedTeacherId));
                      if (teacherAdvances.length === 0) {
                        return (
                          <div className="p-3 text-[10px] font-bold text-slate-400 italic text-center border border-dashed rounded-xl bg-white/40">
                            No advances recorded for this personnel.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {teacherAdvances.map(([key, amount]) => {
                            const month = key.substring(selectedTeacherId.length + 1);
                            return (
                              <div key={key} className="bg-white border rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold text-slate-800">₦{amount.toLocaleString()}</span>
                                  <span className="text-[9px] font-extrabold text-slate-400 block uppercase">{month}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAdvance(month)}
                                  className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                  title="Unbind/Delete Advance"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>


              {/* SECTION C: LOAN AMORTIZATION MATRIX */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-205 pb-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Staff Borrowings &amp; Longevity Loans
                  </h4>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Setup form */}
                  <form onSubmit={handleAddLoan} className="space-y-3 bg-white border rounded-xl p-3 shadow-2xs">
                    <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wide block">
                      + Introduce Borrowing Account
                    </span>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-500 uppercase block mb-1">Borrowing Principal (₦)</label>
                      <input 
                        type="number"
                        placeholder="e.g. 3000"
                        value={loanPrincipal}
                        onChange={(e) => setLoanPrincipal(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-500 uppercase block mb-1">Amortization (Mo)</label>
                        <select 
                          value={loanInstallments}
                          onChange={(e) => setLoanInstallments(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="1">1 Month</option>
                          <option value="2">2 Months</option>
                          <option value="3">3 Months</option>
                          <option value="4">4 Months</option>
                          <option value="5">5 Months</option>
                          <option value="6">6 Months</option>
                          <option value="12">12 Months</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-500 uppercase block mb-1">Starts Amortizing</label>
                        <select 
                          value={loanStartMonth}
                          onChange={(e) => setLoanStartMonth(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {MONTHS_LIST.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-[10px] py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Authorize Borrowing Scheme 💼
                    </button>
                  </form>

                  {/* Right: Active list */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide block">
                      Currently Active Loans
                    </span>
                    
                    {(() => {
                      const teacherLoans = loans[selectedTeacherId] || [];
                      if (teacherLoans.length === 0) {
                        return (
                          <div className="p-3 text-[10px] font-bold text-slate-400 italic text-center border border-dashed rounded-xl bg-white/40">
                            No active loans documented.
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-1.5 max-h-44 overflow-y-auto">
                          {teacherLoans.map((loan) => {
                            const perMonth = Math.ceil(loan.totalAmount / loan.installments);
                            return (
                              <div key={loan.id} className="bg-white border rounded-xl p-2.5 flex items-center justify-between shadow-2xs font-sans">
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs font-extrabold text-slate-800">₦{loan.totalAmount.toLocaleString()}</span>
                                    <span className="text-[9px] text-slate-400">({loan.installments} Months)</span>
                                  </div>
                                  <span className="text-[9.5px] text-slate-500 block">
                                    Amortization: <strong className="text-indigo-600 font-bold">₦{perMonth.toLocaleString()}/mo</strong>
                                  </span>
                                  <span className="text-[8.5px] text-slate-400 block leading-tight font-mono">Starts {loan.startMonth}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLoan(loan.id)}
                                  className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                  title="Unbind/Cancel Loan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>


            </div>
          ) : (
            <div className="bg-white border border-slate-205 rounded-3xl p-12 text-center text-slate-400 py-16 space-y-2 shadow-xs">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto animate-bounce" />
              <p className="text-xs font-black">No Faculty Account Target Selected</p>
              <p className="text-[11px] text-slate-440">Select an onboarded school personnel block on the left panel to introduce allowances/debt records.</p>
            </div>
          )}
        </div>

      </div>

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
