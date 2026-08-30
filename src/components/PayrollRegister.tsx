import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Search, 
  Calendar, 
  UserCheck, 
  FileSpreadsheet, 
  AlertCircle, 
  Filter, 
  Clock, 
  Activity, 
  Check, 
  RotateCcw, 
  FileText, 
  Sliders, 
  Printer, 
  Coins, 
  ShieldAlert, 
  Lock, 
  ChevronRight,
  Info,
  ClipboardCheck,
  Flame,
  MousePointerClick,
  CalendarDays,
  CheckSquare
} from 'lucide-react';
import { Teacher, TeacherPayroll, TeacherAttendance } from '../App';

interface PayrollRegisterProps {
  teachers: Teacher[];
  onSaveTeacher: (updatedTeacher: Teacher) => Promise<void>;
  currentSimulatedRole: string;
  defaultViewTab?: 'attendanceMatrix' | 'salaryLedger';
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

const MONTHS_CONFIG: { [key: string]: { year: number; monthIndex: number; days: number; startIdx: string } } = {
  "June 2026": { year: 2026, monthIndex: 5, days: 30, startIdx: "2026-06" },
  "July 2026": { year: 2026, monthIndex: 6, days: 31, startIdx: "2026-07" },
  "August 2026": { year: 2026, monthIndex: 7, days: 31, startIdx: "2026-08" },
  "September 2026": { year: 2026, monthIndex: 8, days: 30, startIdx: "2026-09" },
};

export default function PayrollRegister({ 
  teachers, 
  onSaveTeacher, 
  currentSimulatedRole,
  defaultViewTab = 'salaryLedger',
  loans,
  setLoans,
  advanceSalaries,
  setAdvanceSalaries,
  bonuses,
  setBonuses
}: PayrollRegisterProps) {
  // Filters & State
  const [selectedMonth, setSelectedMonth] = useState<string>("June 2026");
  const [selectedRole, setSelectedRole] = useState<'all' | 'teaching' | 'non-teaching' | 'management'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeViewTab, setActiveViewTab] = useState<'attendanceMatrix' | 'salaryLedger'>(defaultViewTab);
  
  useEffect(() => {
    if (defaultViewTab) {
      setActiveViewTab(defaultViewTab);
    }
  }, [defaultViewTab]);
  const [activeLoanSetupTeacher, setActiveLoanSetupTeacher] = useState<Teacher | null>(null);
  
  // Custom salary overrides with persistence
  const [overrideSalaries, setOverrideSalaries] = useState<{ [teacherId: string]: string }>(() => {
    const saved = localStorage.getItem('sams_payroll_override_salaries');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('sams_payroll_override_salaries', JSON.stringify(overrideSalaries));
  }, [overrideSalaries]);

  // Holiday and Break configurations per month
  const [holidaySettings, setHolidaySettings] = useState<{ [month: string]: { [dayNum: number]: 'holiday' | 'break' | undefined } }>(() => {
    const saved = localStorage.getItem('sams_payroll_holidays');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      "June 2026": { 15: "holiday", 16: "break" },
      "July 2026": { 4: "holiday", 20: "break" },
      "August 2026": { 10: "holiday" },
      "September 2026": { 7: "holiday", 21: "break" }
    };
  });

  // Save holidays to localStorage on transition
  useEffect(() => {
    localStorage.setItem('sams_payroll_holidays', JSON.stringify(holidaySettings));
  }, [holidaySettings]);

  // Confirmation state per month and role
  const [confirmedStaff, setConfirmedStaff] = useState<{ [teacherId: string]: boolean }>(() => {
    const saved = localStorage.getItem(`sams_payroll_confirmed_staff_${selectedMonth}_${selectedRole}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Re-load key confirmation when month or role changes
  useEffect(() => {
    const saved = localStorage.getItem(`sams_payroll_confirmed_staff_${selectedMonth}_${selectedRole}`);
    if (saved) {
      try {
        setConfirmedStaff(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    setConfirmedStaff({});
  }, [selectedMonth, selectedRole]);

  const toggleConfirmStaff = (teacherId: string) => {
    const next = { ...confirmedStaff, [teacherId]: !confirmedStaff[teacherId] };
    setConfirmedStaff(next);
    localStorage.setItem(`sams_payroll_confirmed_staff_${selectedMonth}_${selectedRole}`, JSON.stringify(next));
  };

  const confirmAllFiltered = () => {
    const next = { ...confirmedStaff };
    filteredTeacherList.forEach(t => {
      next[t.id] = true;
    });
    setConfirmedStaff(next);
    localStorage.setItem(`sams_payroll_confirmed_staff_${selectedMonth}_${selectedRole}`, JSON.stringify(next));
  };

  const unconfirmAllFiltered = () => {
    const next = { ...confirmedStaff };
    filteredTeacherList.forEach(t => {
      delete next[t.id];
    });
    setConfirmedStaff(next);
    localStorage.setItem(`sams_payroll_confirmed_staff_${selectedMonth}_${selectedRole}`, JSON.stringify(next));
  };

  // Slips receipt modal
  const [selectedSlipReceipt, setSelectedSlipReceipt] = useState<{
    teacher: Teacher;
    month: string;
    basic: number;
    present: number;
    absent: number;
    onLeave: number;
    sick: number;
    halfDay: number;
    netPay: number;
    status: 'Paid' | 'Unpaid';
    receiptId: string;
  } | null>(null);

  const monthConfig = useMemo(() => MONTHS_CONFIG[selectedMonth], [selectedMonth]);

  // Approval Flow Key
  const approvalStorageKey = `sams_payroll_reg_matrix_status_${selectedMonth.replace(' ', '_')}_${selectedRole}`;
  const [registerApprovalStatus, setRegisterApprovalStatus] = useState<'Draft' | 'Submitted' | 'Approved'>(() => {
    return (localStorage.getItem(approvalStorageKey) as any) || 'Draft';
  });

  useEffect(() => {
    const saved = localStorage.getItem(approvalStorageKey) as any;
    setRegisterApprovalStatus(saved || 'Draft');
  }, [selectedMonth, selectedRole, approvalStorageKey]);

  const updateApprovalStatus = (status: 'Draft' | 'Submitted' | 'Approved') => {
    setRegisterApprovalStatus(status);
    localStorage.setItem(approvalStorageKey, status);
  };

  // -------------------------------------------------------------
  // CALCULATIONS & FORMULAS
  // -------------------------------------------------------------
  const getFormattedDate = (dayNum: number): string => {
    return `${monthConfig.startIdx}-${String(dayNum).padStart(2, '0')}`;
  };

  const resolveBaseSalary = (teacher: Teacher): number => {
    if (overrideSalaries[teacher.id] !== undefined) {
      const parsed = parseFloat(overrideSalaries[teacher.id]);
      return isNaN(parsed) ? 3200 : parsed;
    }
    if (teacher.payroll && teacher.payroll.length > 0) {
      return teacher.payroll[0].basic;
    }
    if (teacher.role === 'management') return 4800;
    if (teacher.role === 'teaching') return 3500;
    return 2600; 
  };

  const filteredTeacherList = useMemo(() => {
    return teachers.filter(t => {
      if (selectedRole !== 'all' && t.role !== selectedRole) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.qualification || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [teachers, selectedRole, searchQuery]);

  const unconfirmedCount = useMemo(() => {
    return filteredTeacherList.filter(t => !confirmedStaff[t.id]).length;
  }, [filteredTeacherList, confirmedStaff]);

  // Helper to evaluate every day's dynamic status according to weekend, sick, holiday, and term breaks
  const getMonthStatuses = (teacher: Teacher) => {
    const statuses: { [day: number]: 'Present' | 'Absent' | 'On Leave' | 'Sick' | 'Half Day' | 'Sick-Paid' | 'Sick-Absent' | 'Weekend-Present' | 'Weekend-Absent' | 'Holiday-Present' | 'Break-Present' } = {};
    const logs = teacher.attendance || [];
    const currentMonthHolidays = holidaySettings[selectedMonth] || {};

    // Pass 1: raw status, holidays, & progressive Sick counts
    let sickCount = 0;
    for (let d = 1; d <= monthConfig.days; d++) {
      // Check if day is declared as Holiday or Term Break
      const hType = currentMonthHolidays[d];
      if (hType === 'holiday') {
        statuses[d] = 'Holiday-Present';
        continue;
      } else if (hType === 'break') {
        statuses[d] = 'Break-Present';
        continue;
      }

      const dStr = getFormattedDate(d);
      const log = logs.find(l => l.date === dStr);
      const rawStatus = log ? log.status : 'Present'; // Implicit default is Present

      if (rawStatus === 'Sick') {
        sickCount++;
        if (sickCount <= 2) {
          statuses[d] = 'Sick-Paid';
        } else {
          statuses[d] = 'Sick-Absent';
        }
      } else {
        statuses[d] = rawStatus as any;
      }
    }

    // Helper: is a status considered "effectively Present"?
    const isEffectivelyPresent = (status: string) => {
      return status === 'Present' || status === 'Sick-Paid' || status === 'On Leave' || status === 'Half Day' || status === 'Holiday-Present' || status === 'Break-Present';
    };

    // Pass 2: Handle weekends
    for (let d = 1; d <= monthConfig.days; d++) {
      const date = new Date(monthConfig.year, monthConfig.monthIndex, d);
      const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // If Saturday or Sunday is itself declared as Holiday/Break, it maintains Holiday/Break Present status
        const hType = currentMonthHolidays[d];
        if (hType === 'holiday') {
          statuses[d] = 'Holiday-Present';
          continue;
        } else if (hType === 'break') {
          statuses[d] = 'Break-Present';
          continue;
        }

        let friDay = d;
        let monDay = d;
        if (dayOfWeek === 6) { // Sat
          friDay = d - 1;
          monDay = d + 2;
        } else { // Sun
          friDay = d - 2;
          monDay = d + 1;
        }

        const getPass1Status = (dayNum: number): string => {
          if (dayNum < 1 || dayNum > monthConfig.days) return 'Present'; // default out-of-bounds is Present
          return statuses[dayNum];
        };

        const friStatus = getPass1Status(friDay);
        const monStatus = getPass1Status(monDay);

        if (isEffectivelyPresent(friStatus) || isEffectivelyPresent(monStatus)) {
          statuses[d] = 'Weekend-Present';
        } else {
          statuses[d] = 'Weekend-Absent';
        }
      }
    }

    return statuses;
  };

  // Aggregate stats per teacher for monthConfig.days count
  const computeAttendanceStats = (teacher: Teacher) => {
    const statuses = getMonthStatuses(teacher);
    let present = 0;
    let absent = 0;
    let onLeave = 0;
    let sickPaid = 0;
    let sickAbsent = 0;
    let halfDay = 0;
    let weekendPresent = 0;
    let weekendAbsent = 0;
    let holidayPresent = 0;
    let breakPresent = 0;

    for (let d = 1; d <= monthConfig.days; d++) {
      const status = statuses[d];
      if (status === 'Present') {
        present++;
      } else if (status === 'Weekend-Present') {
        weekendPresent++;
      } else if (status === 'Weekend-Absent') {
        weekendAbsent++;
      } else if (status === 'Sick-Paid') {
        sickPaid++;
      } else if (status === 'Sick-Absent') {
        sickAbsent++;
      } else if (status === 'Absent') {
        absent++;
      } else if (status === 'On Leave') {
        onLeave++;
      } else if (status === 'Half Day') {
        halfDay++;
      } else if (status === 'Holiday-Present') {
        holidayPresent++;
      } else if (status === 'Break-Present') {
        breakPresent++;
      }
    }

    return {
      // Classic counters
      present: present + weekendPresent + sickPaid + holidayPresent + breakPresent, // counted as present/fully paid
      absent: absent + weekendAbsent + sickAbsent,  // counted as absent/unpaid
      onLeave,
      sick: sickPaid + sickAbsent, // actual total sick
      halfDay,
      
      // Detailed diagnostics for receipt slips & columns
      sickPaid,
      sickAbsent,
      weekendPresent,
      weekendAbsent,
      holidayPresent,
      breakPresent,
      rawPresent: present
    };
  };

  // Helper to retrieve loan installment information for a month
  const getLoanInstallmentDetailsForMonth = (loan: { totalAmount: number; installments: number; startMonth: string }, monthKey: string) => {
    const startConf = MONTHS_CONFIG[loan.startMonth];
    const currentConf = MONTHS_CONFIG[monthKey];
    if (!startConf || !currentConf) {
      return { isActive: false, installmentIndex: -1, deduction: 0 };
    }
    const startAbs = startConf.year * 12 + startConf.monthIndex;
    const currentAbs = currentConf.year * 12 + currentConf.monthIndex;
    const diff = currentAbs - startAbs;
    if (diff >= 0 && diff < loan.installments) {
      const deductionValue = Math.ceil(loan.totalAmount / loan.installments);
      return {
        isActive: true,
        installmentIndex: diff + 1, // 1-indexed installment number, e.g. "Installment 2"
        deduction: deductionValue
      };
    }
    return { isActive: false, installmentIndex: -1, deduction: 0 };
  };

  const getTeacherDeductionsForMonth = (teacherId: string, monthKey: string) => {
    const teacherLoans = loans[teacherId] || [];
    let totalLoanDeductionResult = 0;
    const activeLoansWithDetails: { loanId: string; totalAmount: number; currentInstallment: number; totalInstallments: number; deduction: number }[] = [];

    teacherLoans.forEach(loan => {
      const details = getLoanInstallmentDetailsForMonth(loan, monthKey);
      if (details.isActive) {
        totalLoanDeductionResult += details.deduction;
        activeLoansWithDetails.push({
          loanId: loan.id,
          totalAmount: loan.totalAmount,
          currentInstallment: details.installmentIndex,
          totalInstallments: loan.installments,
          deduction: details.deduction
        });
      }
    });

    const advanceKey = `${teacherId}_${monthKey}`;
    const advanceDeduction = advanceSalaries[advanceKey] || 0;
    
    return {
      totalLoanDeduction: totalLoanDeductionResult,
      activeLoans: activeLoansWithDetails,
      advanceDeduction,
      totalDeductions: totalLoanDeductionResult + advanceDeduction
    };
  };

  const getTeacherBonusForMonth = (teacherId: string, monthKey: string): number => {
    const bonusKey = `${teacherId}_${monthKey}`;
    return bonuses[bonusKey] || 0;
  };

  const handleUpdateBonus = (teacherId: string, value: string) => {
    const parsed = parseFloat(value);
    const key = `${teacherId}_${selectedMonth}`;
    setBonuses(prev => {
      const next = { ...prev };
      if (isNaN(parsed) || parsed <= 0) {
        delete next[key];
      } else {
        next[key] = parsed;
      }
      return next;
    });
  };

  const handleUpdateAdvance = (teacherId: string, value: string) => {
    const parsed = parseFloat(value);
    const key = `${teacherId}_${selectedMonth}`;
    setAdvanceSalaries(prev => {
      const next = { ...prev };
      if (isNaN(parsed) || parsed <= 0) {
        delete next[key];
      } else {
        next[key] = parsed;
      }
      return next;
    });
  };

  const computeNetWage = (teacher: Teacher) => {
    const base = resolveBaseSalary(teacher);
    const stats = computeAttendanceStats(teacher);
    
    const dailyRate = base / monthConfig.days;
    // Calculation: Present(100%), On Leave(100% paid), Sick-Paid(100% paid), HalfDay(50%), Absent(0%)
    const paidDaysFraction = stats.present + stats.onLeave + (stats.halfDay * 0.5);
    const calculatedPay = dailyRate * paidDaysFraction;

    const { totalLoanDeduction, activeLoans, advanceDeduction, totalDeductions } = getTeacherDeductionsForMonth(teacher.id, selectedMonth);
    const bonusValue = getTeacherBonusForMonth(teacher.id, selectedMonth);

    const netPayBeforeSub = calculatedPay + bonusValue - totalDeductions;
    const finalNetPay = Math.max(0, Math.round(netPayBeforeSub));

    return {
      base,
      dailyRate,
      paidDaysFraction,
      present: stats.present,
      absent: stats.absent,
      onLeave: stats.onLeave,
      sick: stats.sick,
      halfDay: stats.halfDay,
      stats, // attach raw detailed stats object
      // Deductions & additions extras
      loanDeduction: totalLoanDeduction,
      activeLoans,
      advanceDeduction,
      bonus: bonusValue,
      totalDeductions,
      payoutBeforeRounding: netPayBeforeSub,
      netPay: finalNetPay
    };
  };

  const isSecurityOfficer = useMemo(() => {
    return ['Super Admin', 'Branch Admin', 'Accountant'].includes(currentSimulatedRole);
  }, [currentSimulatedRole]);

  // -------------------------------------------------------------
  // SAVE / INTERACTION HANDLERS
  // -------------------------------------------------------------
  const setDayAttendanceStatus = async (
    teacher: Teacher, 
    dayNum: number, 
    status: 'Present' | 'Absent' | 'On Leave' | 'Sick' | 'Half Day'
  ) => {
    const dStr = getFormattedDate(dayNum);
    const currentAttendance = [...(teacher.attendance || [])];
    
    const idx = currentAttendance.findIndex(a => a.date === dStr);
    if (idx >= 0) {
      currentAttendance[idx] = { ...currentAttendance[idx], status };
    } else {
      currentAttendance.push({ date: dStr, status });
    }

    const updated: Teacher = {
      ...teacher,
      attendance: currentAttendance
    };

    await onSaveTeacher(updated);
  };

  // Bulk populate whole row to Present
  const handleBulkMarkRowPresent = async (teacher: Teacher) => {
    const currentAttendance = [...(teacher.attendance || [])];
    for (let d = 1; d <= monthConfig.days; d++) {
      const dStr = getFormattedDate(d);
      const idx = currentAttendance.findIndex(a => a.date === dStr);
      if (idx >= 0) {
        currentAttendance[idx] = { ...currentAttendance[idx], status: 'Present' };
      } else {
        currentAttendance.push({ date: dStr, status: 'Present' });
      }
    }
    const updated: Teacher = {
      ...teacher,
      attendance: currentAttendance
    };
    await onSaveTeacher(updated);
  };

  // Reset row calendar data
  const handleResetRow = async (teacher: Teacher) => {
    const currentAttendance = (teacher.attendance || []).filter(a => !a.date.startsWith(monthConfig.startIdx));
    const updated: Teacher = {
      ...teacher,
      attendance: currentAttendance
    };
    await onSaveTeacher(updated);
  };

  const handleTogglePaymentStatus = async (teacher: Teacher, isChecked: boolean) => {
    const payrollList = [...(teacher.payroll || [])];
    const { base, netPay, present, absent, onLeave, sick, halfDay, bonus, totalDeductions } = computeNetWage(teacher);
    const existingIdx = payrollList.findIndex(p => p.month.toLowerCase() === selectedMonth.toLowerCase());
    
    if (isChecked) {
      const slip: TeacherPayroll = {
        id: existingIdx >= 0 ? payrollList[existingIdx].id : "pay-" + Math.floor(Math.random() * 100000),
        month: selectedMonth,
        basic: base,
        bonus: bonus,
        deductions: totalDeductions,
        net: netPay,
        status: 'Paid',
        datePaid: new Date().toISOString().split('T')[0]
      };

      if (existingIdx >= 0) {
        payrollList[existingIdx] = slip;
      } else {
        payrollList.push(slip);
      }

      await onSaveTeacher({
        ...teacher,
        payroll: payrollList
      });

      setSelectedSlipReceipt({
        teacher,
        month: selectedMonth,
        basic: base,
        present,
        absent,
        onLeave,
        sick,
        halfDay,
        netPay,
        status: 'Paid',
        receiptId: slip.id
      });
    } else {
      if (existingIdx >= 0) {
        payrollList[existingIdx] = {
          ...payrollList[existingIdx],
          status: 'Unpaid',
          datePaid: undefined
        };
      } else {
        payrollList.push({
          id: "pay-" + Math.floor(Math.random() * 100000),
          month: selectedMonth,
          basic: base,
          bonus: bonus,
          deductions: totalDeductions,
          net: netPay,
          status: 'Unpaid',
          datePaid: undefined
        });
      }

      await onSaveTeacher({
        ...teacher,
        payroll: payrollList
      });
    }
  };

  const isTeacherPaidThisMonth = (teacher: Teacher): boolean => {
    const slip = (teacher.payroll || []).find(p => p.month.toLowerCase() === selectedMonth.toLowerCase());
    return slip?.status === 'Paid';
  };

  // Status mapping colors for high contrast select
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold';
      case 'Half Day': return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'On Leave': return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-medium';
      case 'Sick': return 'bg-amber-100 text-amber-900 border-amber-300 font-medium';
      case 'Absent': return 'bg-rose-100 text-rose-950 border-rose-400 font-extrabold';
      default: return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  // Quick Action: Set Day status code for everyone currently matching filters
  const handleBulkSetColumnDay = async (dayNum: number, status: 'Present' | 'Absent' | 'On Leave' | 'Sick' | 'Half Day') => {
    if (filteredTeacherList.length === 0) return;
    if (!confirm(`Are you sure you want to mark Day ${dayNum} of ${selectedMonth} as "${status}" for all ${filteredTeacherList.length} filtered staff members?`)) {
      return;
    }
    
    for (const t of filteredTeacherList) {
      const dStr = getFormattedDate(dayNum);
      const currentAttendance = [...(t.attendance || [])];
      const idx = currentAttendance.findIndex(a => a.date === dStr);
      if (idx >= 0) {
        currentAttendance[idx] = { ...currentAttendance[idx], status };
      } else {
        currentAttendance.push({ date: dStr, status });
      }
      await onSaveTeacher({
        ...t,
        attendance: currentAttendance
      });
    }
    alert(`Day ${dayNum} marked as "${status}" for all active filter matches.`);
  };

  const handleCycleDayHoliday = (dayNum: number) => {
    if (registerApprovalStatus === 'Approved') return;
    const currentMonthHolidays = holidaySettings[selectedMonth] || {};
    const existing = currentMonthHolidays[dayNum];
    let next: 'holiday' | 'break' | undefined;
    if (!existing) {
      next = 'holiday';
    } else if (existing === 'holiday') {
      next = 'break';
    } else {
      next = undefined;
    }

    setHolidaySettings(prev => ({
      ...prev,
      [selectedMonth]: {
        ...(prev[selectedMonth] || {}),
        [dayNum]: next
      }
    }));
  };

  return (
    <div id="payroll-register-dashboard" className="space-y-6">
      
      {/* ----------------- INTENSE HEADER & MANUAL INFO PANEL ----------------- */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-900/50 via-transparent to-transparent opacity-40 pointer-events-none" />
        <div className="space-y-2 max-w-2xl z-10">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Flame className="w-5 h-5 shrink-0 animate-bounce" />
            <span className="text-xs font-black tracking-widest uppercase bg-indigo-500/15 border border-indigo-500/30 px-3 py-0.5 rounded-full">
              SAMS Live Ledger Module
            </span>
          </div>
          <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">Interactive Calendar Matrix &amp; Automated Payroll</h3>
          <p className="text-slate-305 text-xs leading-relaxed font-sans font-medium">
            Review, edit, and audit daily attendance codes <strong>directly inside the scheduling matrix</strong>.
            Double-click or interact with any cell's drop-down parameter to dynamically recalculate absolute net dues. 
            Staff members are listed on the left, dates are plotted on top.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 z-10 self-stretch lg:self-auto justify-end">
          <div className="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-2xl text-center">
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">REGISTRY MONTH</span>
            <span className="text-xs font-extrabold text-indigo-300 mt-1 block">{selectedMonth}</span>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-2xl text-center">
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">FILTERED PERSONNEL</span>
            <span className="text-xs font-extrabold text-emerald-400 mt-1 block">{filteredTeacherList.length} STAFF</span>
          </div>
        </div>
      </div>

      {/* ----------------- LEDGER SETTINGS, SEARCH & THE EXECUTIVE SIGN-OFF CARD ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Filter tools */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-indigo-650" />
              <span>Matrix Alignment Controls</span>
            </span>
            <span className="text-[9px] font-mono tracking-widest font-black text-slate-400">SHEET SYNCHRONIZER</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ledger sheet month select */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Ledger Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {Object.keys(MONTHS_CONFIG).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Department Level Role filtering */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Department Filter</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">📂 All Department Groups</option>
                <option value="teaching">🍎 Academic Teachers ('teaching')</option>
                <option value="non-teaching">🛠️ Support &amp; Contractors ('non-teaching')</option>
                <option value="management">📈 Directors &amp; Executive ('management')</option>
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1.5">Search Staff</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-405 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Filter name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Sub-controls: Holiday List & Verification tracker */}
          <div className="pt-3.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* Holiday Status Panel */}
            <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-150 space-y-1.5">
              <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider flex items-center space-x-1">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-550" />
                <span>Month Declared Holidays &amp; Term Breaks</span>
              </span>
              <div className="text-[10px] text-slate-500 leading-tight">
                Click any numeric Day header in the matrix below to toggle Public Holidays or Semester Breaks.
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(holidaySettings[selectedMonth] || {}).filter(([_, type]) => !!type).length === 0 ? (
                  <span className="text-[10px] text-slate-400 font-medium italic">No custom public holidays set for {selectedMonth}.</span>
                ) : (
                  Object.entries(holidaySettings[selectedMonth] || {}).map(([dayNum, type]) => {
                    const isHoliday = type === 'holiday';
                    return (
                      <span 
                        key={dayNum} 
                        onClick={() => handleCycleDayHoliday(parseInt(dayNum))}
                        className={`px-2 py-0.5 rounded-md text-[8.5px] font-extrabold cursor-pointer border hover:translate-y-[-1px] active:translate-y-[1px] transition-transform flex items-center space-x-1 ${
                          isHoliday 
                            ? 'bg-red-50 border-red-250 text-red-700' 
                            : 'bg-sky-50 border-sky-200 text-sky-700'
                        }`}
                        title="Click to remove or cycle"
                      >
                        <span>D{dayNum} ({isHoliday ? 'Holiday' : 'Break'})</span>
                        <span className="font-extrabold text-[8px] ml-1 opacity-60">×</span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Verification Stats Controller */}
            <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-150 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider flex items-center space-x-1">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-650" />
                  <span>Computation Verification Ledger</span>
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold text-slate-600">
                    Verified: {filteredTeacherList.length - unconfirmedCount} / {filteredTeacherList.length} staff
                  </span>
                  <span className="text-[10px] font-mono font-black text-slate-450">
                    {filteredTeacherList.length > 0 
                      ? Math.round(((filteredTeacherList.length - unconfirmedCount) / filteredTeacherList.length) * 100)
                      : 0}% Complete
                  </span>
                </div>
                {/* Slim simple progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1 mx-auto">
                  <div 
                    className="bg-emerald-600 h-1.5 transition-all duration-300" 
                    style={{ width: `${filteredTeacherList.length > 0 ? ((filteredTeacherList.length - unconfirmedCount) / filteredTeacherList.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  disabled={registerApprovalStatus === 'Approved'}
                  onClick={confirmAllFiltered}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold border-none py-1 px-2.5 rounded-lg text-[9px] transition-colors cursor-pointer select-none disabled:opacity-50"
                >
                  Verify All Matches ✅
                </button>
                <button
                  type="button"
                  disabled={registerApprovalStatus === 'Approved'}
                  onClick={unconfirmAllFiltered}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold border border-slate-200 py-1 px-2.5 rounded-lg text-[9px] transition-colors cursor-pointer select-none disabled:opacity-50"
                >
                  Reset Matches
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Approval Clearance Board */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-105">
            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <ClipboardCheck className="w-4 h-4 text-emerald-650" />
              <span>Approval Clearance Board</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              registerApprovalStatus === 'Approved' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : registerApprovalStatus === 'Submitted'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}>
              {registerApprovalStatus}
            </span>
          </div>

          <div className="py-2.5 text-[11px] text-slate-550 leading-relaxed font-sans">
            {registerApprovalStatus === 'Draft' && (
              <p>State: <strong>Draft Register</strong>. Update days at a role level directly below. Submit to trigger automatic final computation and lock direct deposits.</p>
            )}
            {registerApprovalStatus === 'Submitted' && (
              <p className="text-amber-800 bg-amber-50/60 p-2 rounded-xl border border-amber-100 font-medium">
                📄 Status: Submitted. Requires Super Admin/Officer to sign off.
              </p>
            )}
            {registerApprovalStatus === 'Approved' && (
              <p className="text-emerald-850 bg-emerald-50/70 p-2 rounded-xl border border-emerald-150 font-medium">
                🏛️ <strong>Disbursement Released!</strong> Sincere payroll direct deposits and voucher printers are now unlocked.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            {registerApprovalStatus === 'Draft' ? (
              <button
                onClick={() => {
                  if (unconfirmedCount > 0) {
                    if (confirm(`There are still ${unconfirmedCount} staff members whose attendance details are not yet confirmed.\n\nDo you want to automatically verify and confirm all ${unconfirmedCount} staff right now, then submit for Board review?`)) {
                      confirmAllFiltered();
                    } else {
                      return;
                    }
                  }
                  updateApprovalStatus('Submitted');
                  alert(`Register successfully locked and submitted for executive board sign-off!`);
                }}
                className="w-full bg-slate-900 hover:bg-slate-805 text-white font-bold py-2 rounded-xl text-center text-xs transition-all shadow-sm cursor-pointer"
              >
                Submit Matrix for Board Review
              </button>
            ) : registerApprovalStatus === 'Submitted' ? (
              isSecurityOfficer ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateApprovalStatus('Approved');
                      alert(`Successfully approved and released monthly payroll register! Paid toggles are unlocked.`);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-xl text-center text-xs cursor-pointer shadow-xs"
                  >
                    Confirm &amp; Approve
                  </button>
                  <button
                    onClick={() => {
                      updateApprovalStatus('Draft');
                      alert(`Register reverted of submission. Editing is unlocked.`);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 rounded-xl text-center text-xs cursor-pointer border border-rose-200"
                  >
                    Reject (Unlock)
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 font-sans italic text-center">
                  🔒 Sign-off requires Accountant / Super Admin privileges.
                </div>
              )
            ) : (
              isSecurityOfficer ? (
                <button
                  onClick={() => {
                    if (confirm("Unlock approved matrix register and return to editable Draft?")) {
                      updateApprovalStatus('Draft');
                    }
                  }}
                  className="w-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-705 font-bold py-1.5 rounded-xl text-center text-[11px] cursor-pointer"
                >
                  Unlock Ledger Verification
                </button>
              ) : (
                <div className="text-[10px] text-emerald-650 font-sans italic text-center flex items-center justify-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping" />
                  <span>Approved Register Locked • Direct Deposit Active</span>
                </div>
              )
            )}
          </div>
        </div>

      </div>

      {/* ----------------- CORE VIEW TAB NAVIGATION SWITCHER ----------------- */}
      <div id="payroll-view-selector" className="bg-slate-150/80 p-1 rounded-2xl flex max-w-xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveViewTab('attendanceMatrix')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black tracking-wide cursor-pointer transition-all flex items-center justify-center space-x-2 ${
            activeViewTab === 'attendanceMatrix'
              ? 'bg-white text-indigo-950 border border-slate-250/50 shadow-xs'
              : 'text-slate-505 hover:text-slate-850'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span>1. Attendance Matrix Grid</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveViewTab('salaryLedger')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black tracking-wide cursor-pointer transition-all flex items-center justify-center space-x-2 ${
            activeViewTab === 'salaryLedger'
              ? 'bg-white text-indigo-950 border border-slate-250/50 shadow-xs'
              : 'text-slate-550 hover:text-slate-855'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span>2. Salary Ledger &amp; Approvals</span>
          <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded-full font-sans font-bold">Live</span>
        </button>
      </div>

      {activeViewTab === 'attendanceMatrix' ? (
        <>
          {/* ----------------- LEGEND CODES EXPLANATIONS PANEL ----------------- */}
          <div className="bg-white border border-slate-200 p-4 rounded-3xl space-y-2.5">
        <span className="text-[10px] font-black uppercase text-slate-450 tracking-widest block">Interactive Attendance Matriculate Keys</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold text-slate-600">
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-emerald-500 rounded text-white text-[8px] flex items-center justify-center font-mono">P</span>
            <span>Present (100% Day Rate)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-purple-500 rounded text-white text-[8px] flex items-center justify-center font-mono font-bold">H</span>
            <span>Half Day (50% Day Rate deduction)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-indigo-500 rounded text-white text-[8px] flex items-center justify-center font-mono">L</span>
            <span>On Leave (100% Paid Holiday)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-amber-500 rounded text-white text-[8px] flex items-center justify-center font-mono">S</span>
            <span>Sick Day (100% Paid Sick)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-rose-500 rounded text-white text-[8px] flex items-center justify-center font-black">A</span>
            <span>Absent (0% No Pay deduction)</span>
          </div>
          <div className="ml-auto flex items-center space-x-1.5 text-slate-400 text-[10px] italic">
            <MousePointerClick className="w-3 h-3 text-indigo-505" />
            <span>Click any day cell inside the grid below to update status code</span>
          </div>
        </div>
      </div>

      {/* ----------------- MATRIX CALENDAR SHEET IN ONE COMPACT VIEW ----------------- */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        
        {/* Bulk Column Header Action Tools */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Payroll Attendance Matrix Registry</h4>
            <p className="text-[10px] text-slate-450 mt-0.5">Left panel is locked vertically. Scroll horizontally to populate Day 1 through Day {monthConfig.days} days.</p>
          </div>
          
          {/* Quick Column Broadcaster Tool */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <span className="text-[9px] font-black text-indigo-600 block uppercase tracking-wider shrink-0">Column Injector:</span>
            <select
              id="bulk-target-day"
              className="text-[10.5px] font-bold bg-slate-50 border px-1.5 py-0.5 rounded outline-none"
              defaultValue="1"
            >
              {Array.from({ length: monthConfig.days }).map((_, dNo) => (
                <option key={dNo} value={dNo + 1}>Day {dNo + 1}</option>
              ))}
            </select>
            <span className="text-[10px] text-slate-450">to:</span>
            <select
              id="bulk-target-status"
              className="text-[10.5px] font-extrabold bg-slate-50 border px-1.5 py-0.5 rounded outline-none"
              defaultValue="Present"
            >
              <option value="Present">P (Present)</option>
              <option value="Half Day">H (Half Day)</option>
              <option value="On Leave">L (On Leave)</option>
              <option value="Sick">S (Sick)</option>
              <option value="Absent">A (Absent)</option>
            </select>
            <button
              onClick={() => {
                const dayInput = (document.getElementById('bulk-target-day') as HTMLSelectElement)?.value;
                const statusInput = (document.getElementById('bulk-target-status') as HTMLSelectElement)?.value;
                if (dayInput && statusInput) {
                  handleBulkSetColumnDay(parseInt(dayInput), statusInput as any);
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-2.5 py-1 rounded cursor-pointer transition-colors"
            >
              Apply Broadcast
            </button>
          </div>
        </div>

        {/* Horizontal scroll container with left-sticky columns */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse table-fixed min-w-[3100px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-[9px] text-slate-405 uppercase tracking-widest">
                
                {/* 1. Left sticky staff header columns */}
                <th className="sticky left-0 bg-slate-50 z-20 py-3.5 px-4 font-bold border-r border-slate-200 w-[240px]">
                  Staff Personnel Details
                </th>
                
                {/* 2. Scrollable Calendar Columns (Day 1 to 30) */}
                {Array.from({ length: monthConfig.days }).map((_, dIdx) => {
                  const dayNum = dIdx + 1;
                  const getOrdinal = (n: number) => {
                    const s = ["th", "st", "nd", "rd"];
                    const v = n % 100;
                    return n + (s[(v - 20) % 10] || s[v] || s[0]);
                  };
                  const dateObj = new Date(monthConfig.year, monthConfig.monthIndex, dayNum);
                  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const isWE = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                  // Check if day is declared as holiday or break
                  const currentMonthHolidays = holidaySettings[selectedMonth] || {};
                  const hType = currentMonthHolidays[dayNum];

                  let thClass = isWE ? 'bg-slate-100/60 text-slate-500' : 'text-slate-700';
                  let statusLabel = weekday;
                  if (hType === 'holiday') {
                    thClass = 'bg-red-50 text-red-955 border-red-200';
                    statusLabel = 'HOLIDAY';
                  } else if (hType === 'break') {
                    thClass = 'bg-sky-50 text-sky-955 border-sky-200';
                    statusLabel = 'SEMESTER BRK';
                  }

                  return (
                    <th 
                      key={dIdx} 
                      className={`py-2 px-1 text-center font-bold tracking-tight border-l border-slate-100 w-[85px] shrink-0 cursor-pointer select-none transition-all hover:bg-slate-100/80 ${thClass}`}
                      onClick={() => handleCycleDayHoliday(dayNum)}
                      title="Click to cycle: Regular Workday ⇆ Public Holiday ⇆ Semester Break"
                    >
                      <div className="text-[10px] font-extrabold font-sans leading-tight">
                        {getOrdinal(dayNum)}
                      </div>
                      <div className="text-[7.5px] uppercase tracking-wide font-mono font-black truncate mt-0.5">
                        {statusLabel}
                      </div>
                    </th>
                  );
                })}

                {/* 3. Right Ending Header Columns */}
                <th className="py-3 px-3 font-bold w-[180px] text-center border-l bg-slate-50/50">Computed Days</th>
                <th className="py-3 px-3 font-bold w-[140px] text-center border-l bg-slate-50/50">Verification Status</th>
                <th className="py-3 px-3 font-bold w-[110px] text-center border-l bg-slate-50/50 text-indigo-755">Payout Ledger</th>
                <th className="py-3 px-3 font-bold w-[115px] text-center border-l bg-slate-50/50">Row Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeacherList.map(teacher => {
                const { base, present, absent, onLeave, sick, halfDay, netPay, stats } = computeNetWage(teacher);
                const isPaid = isTeacherPaidThisMonth(teacher);
                const isConfirmed = !!confirmedStaff[teacher.id];

                return (
                  <tr key={teacher.id} className="hover:bg-slate-50/70 transition-all text-xs">
                    
                    {/* Left Sticky Personnel metadata card */}
                    <td className="sticky left-0 bg-white hover:bg-slate-50 z-10 py-3.5 px-4 font-extrabold text-slate-900 border-r border-slate-250 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      <div className="font-extrabold truncate text-slate-900 text-[12px]" title={teacher.name}>{teacher.name}</div>
                      <div className="text-[9px] text-slate-400 mt-1 font-mono font-normal">
                        ID: <span className="text-indigo-600 font-semibold">{teacher.id}</span> | {(teacher.role || 'Teacher')}
                      </div>
                    </td>

                    {/* The Day-By-Day attendance code matrix cells (Day 1 to monthConfig.days) */}
                    {Array.from({ length: monthConfig.days }).map((_, dIdx) => {
                      const dayNumber = dIdx + 1;
                      const dateString = getFormattedDate(dayNumber);
                      const attendanceRecord = (teacher.attendance || []).find(a => a.date === dateString);
                      const rawStatus = attendanceRecord ? attendanceRecord.status : 'Present';

                      const dateObj = new Date(monthConfig.year, monthConfig.monthIndex, dayNumber);
                      const isWE = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                      // Get evaluated status
                      const monthStatuses = getMonthStatuses(teacher);
                      const evalStatus = monthStatuses[dayNumber];

                      const currentMonthHolidays = holidaySettings[selectedMonth] || {};
                      const hType = currentMonthHolidays[dayNumber];

                      if (hType === 'holiday') {
                        return (
                          <td key={dIdx} className="py-2 px-1 text-center border-l border-slate-100 bg-red-50/20 w-[85px] shrink-0">
                            <div 
                              className="w-full py-1.5 rounded-lg text-[10px] border border-red-200 bg-red-50 text-red-800 font-extrabold shadow-3xs"
                              title="Public Holiday: School Closed, Day Fully Paid automatically"
                            >
                              <span className="font-sans text-[10.5px]">HOL</span>
                              <span style={{ fontSize: '7px' }} className="block font-sans font-black text-red-400 uppercase tracking-widest leading-none mt-0.5">CLOSED</span>
                            </div>
                          </td>
                        );
                      }

                      if (hType === 'break') {
                        return (
                          <td key={dIdx} className="py-2 px-1 text-center border-l border-slate-100 bg-sky-50/20 w-[85px] shrink-0">
                            <div 
                              className="w-full py-1.5 rounded-lg text-[10px] border border-sky-200 bg-sky-50 text-sky-800 font-extrabold shadow-3xs"
                              title="Term Break: No Classes, Day Fully Paid automatically"
                            >
                              <span className="font-sans text-[10.5px]">BRK</span>
                              <span style={{ fontSize: '7px' }} className="block font-sans font-black text-sky-400 uppercase tracking-widest leading-none mt-0.5">BREAK</span>
                            </div>
                          </td>
                        );
                      }

                      if (isWE) {
                        const displayChar = evalStatus === 'Weekend-Present' ? 'P' : 'A';
                        const displayClass = evalStatus === 'Weekend-Present' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-250 font-black shadow-3xs' 
                          : 'bg-rose-50 text-rose-955 border-rose-300 font-extrabold shadow-3xs';
                        return (
                          <td key={dIdx} className="py-2 px-1 text-center border-l border-slate-100 bg-slate-50/40 w-[85px] shrink-0">
                            <div 
                              className={`w-full py-1 rounded-lg text-[10.5px] border select-none ${displayClass}`} 
                              title={evalStatus === 'Weekend-Present' 
                                ? "Weekend automatically Present because either Friday or Monday are marked Present!" 
                                : "Weekend automatically Absent because both adjacent Friday and Monday are absent."
                              }
                            >
                              <span className="font-mono text-[11px]">{displayChar}</span>
                              <span style={{ fontSize: '7.5px' }} className="block font-sans font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">W/E</span>
                            </div>
                          </td>
                        );
                      }

                      // If it's a weekday, show standard dropdown but stylized for evaluated sick limit if needed
                      let statusClass = getStatusClass(rawStatus);
                      let tooltip = "";
                      let sickBadgeText = "";
                      if (evalStatus === 'Sick-Paid') {
                        statusClass = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-extrabold';
                        tooltip = "Sick Day 1 or 2: Fully paid and considered Present.";
                        sickBadgeText = "PAID";
                      } else if (evalStatus === 'Sick-Absent') {
                        statusClass = 'bg-rose-105/90 text-rose-950 border-rose-450 font-extrabold';
                        tooltip = "Sick Day 3 or greater: Unpaid and considered Absent.";
                        sickBadgeText = "UNPD";
                      }

                      return (
                        <td key={dIdx} className="py-2 px-1 text-center border-l border-slate-100 w-[85px] shrink-0">
                          <div className="relative">
                            <select
                                value={rawStatus}
                                disabled={registerApprovalStatus === 'Approved'}
                                onChange={(e) => setDayAttendanceStatus(teacher, dayNumber, e.target.value as any)}
                              className={`w-full text-center border p-1 rounded-md text-[10.8px] cursor-pointer outline-none ${statusClass}`}
                              title={tooltip}
                            >
                              <option value="Present">P</option>
                              <option value="Half Day">H</option>
                              <option value="On Leave">L</option>
                              <option value="Sick">S</option>
                              <option value="Absent">A</option>
                            </select>
                            {sickBadgeText && (
                              <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black px-1 rounded-full select-none ${
                                sickBadgeText === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                              }`}>
                                {sickBadgeText}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* 1. Computed Days Stats Column */}
                    <td className="py-3.5 px-3 border-l border-slate-100 bg-slate-50/30 text-center w-[180px]">
                      <div className="font-extrabold text-slate-800 font-mono text-xs">
                        {(stats.present + stats.onLeave + (stats.halfDay * 0.5))} / {monthConfig.days} Days Paid
                      </div>
                      <div className="text-[8.5px] text-slate-450 font-mono font-normal mt-1 leading-tight flex flex-col space-y-0.5 whitespace-nowrap">
                        <div className="flex justify-between px-1">
                          <span>Present:</span>
                          <span className="font-bold text-slate-700">{stats.rawPresent}d</span>
                        </div>
                        <div className="flex justify-between px-1">
                          <span>Weekends:</span>
                          <span className="font-bold text-slate-700">+{stats.weekendPresent}d</span>
                        </div>
                        <div className="flex justify-between px-1">
                          <span>Leave:</span>
                          <span className="font-bold text-indigo-650">+{stats.onLeave}d</span>
                        </div>
                        <div className="flex justify-between px-1">
                          <span>Paid Sick:</span>
                          <span className="font-bold text-emerald-650">+{stats.sickPaid}d</span>
                        </div>
                        {stats.sickAbsent > 0 && (
                          <div className="flex justify-between px-1 text-rose-600">
                            <span>Unpaid Sick:</span>
                            <span className="font-extrabold">-{stats.sickAbsent}d</span>
                          </div>
                        )}
                        {(stats.holidayPresent > 0 || stats.breakPresent > 0) && (
                          <div className="flex justify-between px-1 text-indigo-700 font-extrabold bg-indigo-50/50 rounded">
                            <span>Holiday/Break:</span>
                            <span>+{stats.holidayPresent + stats.breakPresent}d</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 2. Verification status interactive badge */}
                    <td className="py-3.5 px-3 border-l border-slate-100 text-center w-[140px]">
                      {registerApprovalStatus === 'Approved' ? (
                        <div className="inline-flex items-center space-x-1.5 text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-1 rounded-lg text-[10px] font-bold">
                          <Check className="w-3 h-3" />
                          <span>Verified Lock 🔒</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleConfirmStaff(teacher.id)}
                          className={`w-full py-1.5 px-2 rounded-xl text-[10px] font-black tracking-wide border cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-1 ${
                            isConfirmed 
                              ? 'bg-emerald-50 border-emerald-250 text-emerald-800 hover:bg-emerald-100' 
                              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/80'
                          }`}
                        >
                          {isConfirmed ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Confirmed ✅</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span>Confirm Days</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>

                    {/* 3. Payout Ledger Status */}
                    <td className="py-3.5 px-3 border-l border-slate-100 text-center w-[110px]">
                      <div className="flex items-center justify-center">
                        {registerApprovalStatus !== 'Approved' ? (
                          <div className="text-[8.5px] text-slate-400 bg-slate-100/80 border px-1.5 py-1 rounded-lg select-none font-mono">
                            Awaiting Sign-off
                          </div>
                        ) : (
                          <label className="inline-flex items-center space-x-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-full border border-slate-200 transition-all select-none">
                            <input 
                              type="checkbox"
                              checked={isPaid}
                              onChange={(e) => handleTogglePaymentStatus(teacher, e.target.checked)}
                              className="w-3 h-3 accent-indigo-600 text-indigo-600 cursor-pointer"
                            />
                            <span className={`text-[8.5px] font-black uppercase tracking-wide ${
                              isPaid ? 'text-emerald-700' : 'text-slate-500'
                            }`}>
                              {isPaid ? 'Paid ✅' : 'Unpaid'}
                            </span>
                          </label>
                        )}
                      </div>
                    </td>

                    {/* 4. Row Tools Actions */}
                    <td className="py-3.5 px-3 text-center border-l w-[115px]">
                      <div className="flex flex-col space-y-1 items-center justify-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleBulkMarkRowPresent(teacher)}
                            disabled={registerApprovalStatus === 'Approved'}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-850 text-[8.5px] border border-emerald-250 font-black px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-50"
                            title="Mark full month Present"
                          >
                            All P
                          </button>
                          <button
                            onClick={() => handleResetRow(teacher)}
                            disabled={registerApprovalStatus === 'Approved'}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-650 text-[8.5px] border border-slate-205 font-medium px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-50"
                            title="Clear current month attendance"
                          >
                            Reset
                          </button>
                        </div>
                        {isPaid && (
                          <button
                            onClick={() => {
                              const slip = (teacher.payroll || []).find(p => p.month.toLowerCase() === selectedMonth.toLowerCase());
                              if (slip) {
                                setSelectedSlipReceipt({
                                  teacher,
                                  month: selectedMonth,
                                  basic: base,
                                  present,
                                  absent,
                                  onLeave,
                                  sick,
                                  halfDay,
                                  netPay,
                                  status: 'Paid',
                                  receiptId: slip.id
                                });
                              }
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[8.5px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1 cursor-pointer mt-0.5 w-full justify-center"
                          >
                            <Printer className="w-2.5 h-2.5" />
                            <span>Voucher Slip</span>
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTeacherList.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs bg-white">
            No registered staff matching active query parameters inside SAMS ledger.
          </div>
        )}
      </div>
    </>
  ) : (
    /* ----------------- EXECUTIVE SALARY COMPUTATION LEDGER ----------------- */
    <div id="salary-computation-ledger-view" className="space-y-6 animate-fade-in shadow-xs">
      
      {/* Ledger Table Action Tools */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>Executive Payroll Computation Ledger</span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal font-sans font-medium">
              Verify automated calculations, adjust baseline base salary corrections, grant monthly bonuses, configure dynamic loan repayments, record salary advances, and click to approve individual salaries for disbursement.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = { ...confirmedStaff };
                filteredTeacherList.forEach(t => {
                  next[t.id] = true;
                });
                setConfirmedStaff(next);
                localStorage.setItem(`sams_payroll_confirmed_staff_${selectedMonth}_${selectedRole}`, JSON.stringify(next));
                alert('All visible personnel attendance verified and approved on the computation ledger!');
              }}
              disabled={registerApprovalStatus === 'Approved'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-xs transition-all disabled:opacity-55"
            >
              Approve All Filtered Salaries ✅
            </button>
          </div>
        </div>

        {/* Responsive table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-205">
                <th className="p-3.5 w-[220px]">Beneficiary Detail</th>
                <th className="p-3.5 text-right w-[150px]">Baseline Salary (₦)</th>
                <th className="p-3.5 text-center w-[160px]">Attendance Ratio</th>
                <th className="p-3.5 text-right w-[120px]">Attendance Pay (₦)</th>
                <th className="p-3.5 text-right w-[130px]">Bonuses (+) (₦)</th>
                <th className="p-3.5 text-right w-[150px]">Salary Advance (-) (₦)</th>
                <th className="p-3.5 text-center w-[205px]">Loans &amp; Repayments (-)</th>
                <th className="p-3.5 text-right w-[150px]">Net Disbursed Pay</th>
                <th className="p-3.5 text-center w-[120px]">Verify Ledger</th>
                <th className="p-3.5 text-center w-[110px]">Sign-off Paid</th>
                <th className="p-3.5 text-center w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-105 text-[11px] font-medium text-slate-705">
              {filteredTeacherList.map(teacher => {
                const wage = computeNetWage(teacher);
                const isConfirmed = !!confirmedStaff[teacher.id];
                const isPaid = isTeacherPaidThisMonth(teacher);
                
                // Calculated base pay or custom input overrides
                const overrideVal = overrideSalaries[teacher.id] ?? '';

                const bonusVal = getTeacherBonusForMonth(teacher.id, selectedMonth);
                const advanceVal = getTeacherDeductionsForMonth(teacher.id, selectedMonth).advanceDeduction;

                // Retrieve active loans
                const loanInfo = getTeacherDeductionsForMonth(teacher.id, selectedMonth);

                return (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* 1. Beneficiary */}
                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800 text-xs truncate" title={teacher.name}>{teacher.name}</span>
                        <span className="text-[9.5px] text-slate-400 font-mono">ID: {teacher.id} | {teacher.qualification ?? 'Faculty'}</span>
                        <span className="text-[8.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase w-fit mt-1">
                          {teacher.role}
                        </span>
                      </div>
                    </td>

                    {/* 2. Baseline Salary (inline correction override) */}
                    <td className="p-3.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center space-x-1 justify-end">
                          <span className="text-xs text-slate-400">₦</span>
                          <input
                            type="number"
                            value={overrideVal}
                            placeholder={resolveBaseSalary(teacher).toString()}
                            disabled={registerApprovalStatus === 'Approved'}
                            onChange={(e) => {
                              const nextOverrides = { ...overrideSalaries, [teacher.id]: e.target.value };
                              setOverrideSalaries(nextOverrides);
                            }}
                            className="w-24 bg-slate-50 border border-slate-205 rounded-lg px-2 py-1 text-right text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                            title="Enter numeric value to override baseline salary"
                          />
                        </div>
                        {overrideSalaries[teacher.id] !== undefined && (
                          <button
                            onClick={() => {
                              const next = { ...overrideSalaries };
                              delete next[teacher.id];
                              setOverrideSalaries(next);
                            }}
                            className="text-[8.5px] text-rose-600 hover:underline font-bold"
                          >
                            Reset to Default
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 3. Attendance Ratio */}
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-extrabold text-slate-800">
                          {wage.paidDaysFraction} / {monthConfig.days} Days
                        </span>
                        <span className="text-[9.5px] text-slate-405">
                          (P: {wage.stats.present} | H: {wage.stats.halfDay} | A: {wage.stats.absent})
                        </span>
                      </div>
                    </td>

                    {/* 4. Computed Attendance Pay ($) */}
                    <td className="p-3.5 text-right font-mono font-extrabold text-slate-800">
                      ₦{Math.round(wage.base * (wage.paidDaysFraction / monthConfig.days)).toLocaleString()}
                    </td>

                    {/* 5. Performance Bonuses Added ($) */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center space-x-1 justify-end">
                        <span className="text-xs text-slate-400">+ ₦</span>
                        <input
                          type="number"
                          value={bonusVal === 0 ? '' : bonusVal}
                          placeholder="0"
                          disabled={registerApprovalStatus === 'Approved'}
                          onChange={(e) => {
                            handleUpdateBonus(teacher.id, e.target.value);
                          }}
                          className="w-20 bg-slate-50 border border-slate-205 rounded-lg px-2 py-1 text-right text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-55"
                        />
                      </div>
                    </td>

                    {/* 6. Salary Advance Deduction ($) */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center space-x-1 justify-end">
                        <span className="text-xs text-slate-405">- ₦</span>
                        <input
                          type="number"
                          value={advanceVal === 0 ? '' : advanceVal}
                          placeholder="0"
                          disabled={registerApprovalStatus === 'Approved'}
                          onChange={(e) => {
                            handleUpdateAdvance(teacher.id, e.target.value);
                          }}
                          className="w-20 bg-slate-50 border border-slate-205 rounded-lg px-2 py-1 text-right text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-55"
                        />
                      </div>
                    </td>

                    {/* 7. Loan Repayments (-) Details */}
                    <td className="p-3.5">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        {loanInfo.activeLoans.length > 0 ? (
                          <div className="text-center">
                            <span className="text-[10px] font-extrabold text-rose-600 block font-mono">
                              -${loanInfo.totalLoanDeduction.toLocaleString()} Demanded
                            </span>
                            <span className="text-[8px] text-slate-400 block font-sans">
                              {loanInfo.activeLoans.map(al => `Inst ${al.currentInstallment}/${al.totalInstallments}`).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9.5px] text-slate-400 italic block mb-0.5">No active repayments</span>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => setActiveLoanSetupTeacher(teacher)}
                          className="text-[8.5px] font-black bg-indigo-50 border border-indigo-200 text-indigo-705 px-2 py-1 rounded-md hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                          {loans[teacher.id]?.length > 0 ? '💼 Manage Loans' : '➕ Grant Loan'}
                        </button>
                      </div>
                    </td>

                    {/* 8. Net Disbursed Pay */}
                    <td className="p-3.5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-250">
                          ₦{wage.netPay.toLocaleString()}
                        </span>
                        <span className="text-[8px] text-slate-400 block tracking-tight font-mono whitespace-nowrap mt-0.5">
                          Base ₦{wage.base.toLocaleString()} + B: ₦{wage.bonus} - D: ₦{wage.loanDeduction + wage.advanceDeduction}
                        </span>
                      </div>
                    </td>

                    {/* 9. Verify Ledger */}
                    <td className="p-3.5 text-center">
                      {registerApprovalStatus === 'Approved' ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>Approved ✅</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleConfirmStaff(teacher.id)}
                          className={`py-1 px-2.5 rounded-xl text-[10px] font-black tracking-wide border cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-1 mx-auto ${
                            isConfirmed 
                              ? 'bg-emerald-50 border-emerald-250 text-emerald-800 hover:bg-emerald-100' 
                              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/80'
                          }`}
                        >
                          {isConfirmed ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Approved CPM ✅</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-650 animate-pulse" />
                              <span>Click to Confirm</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>

                    {/* 10. Sign-off Paid checklist */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center">
                        {registerApprovalStatus !== 'Approved' ? (
                          <div className="text-[8.5px] text-slate-400 bg-slate-100 border px-2 py-1 rounded-lg select-none font-sans whitespace-nowrap">
                            No approval release
                          </div>
                        ) : (
                          <label className="inline-flex items-center space-x-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-full border border-slate-205 transition-all select-none">
                            <input 
                              type="checkbox"
                              checked={isPaid}
                              onChange={(e) => handleTogglePaymentStatus(teacher, e.target.checked)}
                              className="w-3.5 h-3.5 accent-indigo-600 text-indigo-600 cursor-pointer"
                            />
                            <span className={`text-[8.5px] font-black uppercase tracking-wide ${
                              isPaid ? 'text-emerald-700 font-extrabold' : 'text-slate-505 font-bold'
                            }`}>
                              {isPaid ? 'Paid ✅' : 'Unpaid'}
                            </span>
                          </label>
                        )}
                      </div>
                    </td>

                    {/* 11. Actions */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedSlipReceipt({
                            teacher,
                            month: selectedMonth,
                            basic: wage.base,
                            present: wage.present,
                            absent: wage.absent,
                            onLeave: wage.onLeave,
                            sick: wage.sick,
                            halfDay: wage.halfDay,
                            netPay: wage.netPay,
                            status: isPaid ? 'Paid' : 'Unpaid',
                            receiptId: "pay-" + teacher.id + "-" + selectedMonth.replace(' ', '')
                          });
                        }}
                        className="inline-flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold border border-indigo-200 px-2 py-1 rounded-xl cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Payslip</span>
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Grid empty state fallback */}
        {filteredTeacherList.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs bg-white">
            No registered staff matching active query parameters inside SAMS ledger.
          </div>
        )}
      </div>
    </div>
  )}

  {/* ----------------- DYNAMIC STAFF LOAN SETUP MANAGER MODAL ----------------- */}
  {activeLoanSetupTeacher && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white border text-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full relative space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
              SAMS Loan Account Ledger
            </span>
            <h4 className="text-base font-extrabold text-slate-900 mt-2">Manage Loans: {activeLoanSetupTeacher.name}</h4>
            <p className="text-[10px] text-slate-400 font-medium">Configure principal borrowings, installment rates, and starting amortization months.</p>
          </div>
          <button 
            onClick={() => setActiveLoanSetupTeacher(null)}
            className="text-slate-405 hover:text-slate-605 p-1 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer border border-slate-200 transition-colors"
          >
            <XCircle className="w-5 h-5 text-slate-505" />
          </button>
        </div>

        {/* List of active loans */}
        <div className="space-y-3">
          <h5 className="text-[10px] uppercase font-black tracking-widest text-slate-400">Active Amortizations ({loans[activeLoanSetupTeacher.id]?.length ?? 0})</h5>
          {(!loans[activeLoanSetupTeacher.id] || loans[activeLoanSetupTeacher.id].length === 0) ? (
            <div className="text-[10.5px] text-slate-400 border border-dashed rounded-xl p-4 text-center italic bg-slate-50/50">
              No active loans recorded for this employee. Use the form below to grant a loan.
            </div>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {loans[activeLoanSetupTeacher.id].map((loan) => {
                const monthlyInst = Math.ceil(loan.totalAmount / loan.installments);
                return (
                  <div key={loan.id} className="bg-slate-50 border border-slate-200/85 p-3 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-slate-800">
                        Principal: ₦{loan.totalAmount.toLocaleString()} ({loan.installments} Months)
                      </p>
                      <p className="text-[9.5px] text-slate-505">
                        Amortization: <strong className="text-slate-700">₦{monthlyInst}/mo</strong> starting {loan.startMonth}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to completely cancel and delete this ₦${loan.totalAmount} loan account?`)) {
                          setLoans(prev => {
                            const list = prev[activeLoanSetupTeacher.id] || [];
                            const nextList = list.filter(l => l.id !== loan.id);
                            return {
                              ...prev,
                              [activeLoanSetupTeacher.id]: nextList
                            };
                          });
                        }
                      }}
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-black px-2 py-1 rounded-lg cursor-pointer"
                    >
                      Cancel Loan
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New Amortization Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const amtElem = form.elements.namedItem('loanAmount') as HTMLInputElement;
            const instElem = form.elements.namedItem('loanInstallments') as HTMLSelectElement;
            const stMonthElem = form.elements.namedItem('loanStartMonth') as HTMLSelectElement;

            const amt = parseFloat(amtElem.value);
            const inst = parseInt(instElem.value);
            const stMonth = stMonthElem.value;

            if (isNaN(amt) || amt <= 0) {
              alert('Please input a valid positive borrowing principal amount!');
              return;
            }

            const newLoan = {
              id: 'loan-' + Date.now(),
              totalAmount: amt,
              installments: inst,
              startMonth: stMonth
            };

            setLoans(prev => {
              const curr = prev[activeLoanSetupTeacher.id] || [];
              return {
                ...prev,
                [activeLoanSetupTeacher.id]: [...curr, newLoan]
              };
            });

            form.reset();
            alert(`Dynamic loan setup established! Monthly repayments will start from "${stMonth}" automatically.`);
          }}
          className="space-y-3.5 border-t border-slate-100 pt-4"
        >
          <h5 className="text-[10px] uppercase font-black tracking-widest text-indigo-650">Grant / Establish New Loan</h5>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-extrabold text-slate-550 uppercase block mb-1">Loan Principal Amt (₦)</label>
              <input
                type="number"
                name="loanAmount"
                placeholder="e.g. 5000"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="text-[9px] font-extrabold text-slate-550 uppercase block mb-1">Installment Count</label>
              <select
                name="loanInstallments"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="1">1 Month Amortization</option>
                <option value="2">2 Months (Bi-Installment)</option>
                <option value="3">3 Months (Quarterly)</option>
                <option value="4">4 Months Amortization</option>
                <option value="5">5 Months Amortization</option>
                <option value="6">6 Months Amortization</option>
                <option value="12">12 Months (Annual)</option>
                <option value="24">24 Months (Biannual)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-extrabold text-slate-550 uppercase block mb-1">Repayment Starts In</label>
            <select
              name="loanStartMonth"
              defaultValue={selectedMonth}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {Object.keys(MONTHS_CONFIG).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 rounded-xl cursor-pointer transition-colors"
          >
            Approve &amp; Activate Loan Account
          </button>
        </form>

      </div>
    </div>
  )}

      {/* ----------------- SELECTION SLIP RECEIPT PREVIEW DIALOG MODAL ----------------- */}
      {selectedSlipReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border text-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full relative space-y-6">
            
            {/* Header Voucher */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                  SAMS Certified Payslip
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-2">Direct Deposit Voucher</h4>
                <p className="text-[10px] text-slate-400 font-mono">Reference Voucher Slip ID: {selectedSlipReceipt.receiptId}</p>
              </div>
              <button 
                onClick={() => setSelectedSlipReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Details Body */}
            <div className="space-y-4">
              
              {/* Employee ID details card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block">Beneficiary Detail</span>
                <p className="font-extrabold text-slate-800 text-xs">{selectedSlipReceipt.teacher.name}</p>
                <p className="text-[9.5px] text-slate-500 font-mono">ID: {selectedSlipReceipt.teacher.id} | {selectedSlipReceipt.teacher.email}</p>
                <span className="inline-block text-[9px] bg-slate-205 px-2 py-0.5 rounded-full text-slate-700 font-semibold mt-1.5 uppercase">
                  {selectedSlipReceipt.teacher.role || 'Personnel'}
                </span>
              </div>

              {/* Attendance metrics */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attendance Summary ({selectedSlipReceipt.month})</span>
                <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
                  <div className="bg-emerald-50 border border-emerald-100 p-1.5 rounded-lg">
                    <span className="text-emerald-700 block font-bold">{selectedSlipReceipt.present}</span>
                    <span className="text-[8px] text-slate-400">Present</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-1.5 rounded-lg">
                    <span className="text-amber-700 block font-bold">{selectedSlipReceipt.sick}</span>
                    <span className="text-[8px] text-slate-400">Sick</span>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 p-1.5 rounded-lg">
                    <span className="text-indigo-700 block font-bold">{selectedSlipReceipt.onLeave}</span>
                    <span className="text-[8px] text-slate-400 font-medium">Leave</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 p-1.5 rounded-lg">
                    <span className="text-purple-700 block font-bold">{selectedSlipReceipt.halfDay}</span>
                    <span className="text-[8px] text-slate-400">Half</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 p-1.5 rounded-lg">
                    <span className="text-rose-700 block font-bold">{selectedSlipReceipt.absent}</span>
                    <span className="text-[8px] text-slate-400">Absent</span>
                  </div>
                </div>
              </div>

              {/* Computation breakdown */}
              {(() => {
                const w = computeNetWage(selectedSlipReceipt.teacher);
                return (
                  <div className="border-t border-dashed border-slate-200 pt-3 space-y-2 font-mono text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Baseline Base Salary:</span>
                      <span className="font-bold text-slate-800">₦{w.base.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attendance Base Pay:</span>
                      <span className="font-bold text-slate-800">
                        ₦{Math.round(w.base * (w.paidDaysFraction / monthConfig.days)).toLocaleString()} ({w.paidDaysFraction} paid days)
                      </span>
                    </div>
                    {w.bonus > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Staff Performance Bonus (+):</span>
                        <span className="font-bold">+₦{w.bonus.toLocaleString()}</span>
                      </div>
                    )}
                    {w.advanceDeduction > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>Salary Advance Issued (-):</span>
                        <span className="font-bold">-₦{w.advanceDeduction.toLocaleString()}</span>
                      </div>
                    )}
                    {w.loanDeduction > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>Active Loan Repayment (-):</span>
                        <span className="font-bold">-₦{w.loanDeduction.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-100 pt-1.5 text-slate-900 font-extrabold text-xs">
                      <span className="font-sans font-black">NET DISBURSED SALARY:</span>
                      <span className="text-indigo-700 font-mono font-black">₦{w.netPay.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Certification info with Custom Policies */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-[10px] text-slate-600">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">SAMS Active Board Policies Applied:</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Surround Weekend Rule:</strong> Saturdays &amp; Sundays are computed as Present if <em>either</em> Friday or subsequent Monday is marked Present. Otherwise, if both are absent, they are treated as Absent.</li>
                  <li><strong>Sick Leave Threshold:</strong> Maximum 2 Sick days are paid at 100%. From the 3rd Sick day, they are treated as Absent.</li>
                </ul>
              </div>

              {/* Certification info */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-start space-x-2.5 text-[9.5px] text-indigo-850">
                <Info className="w-4 h-4 text-indigo-550 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-sans font-medium">
                  Direct deposit was signed off and executed digitally. Verified against localized clocking telemetry and synchronized live on SAMS Cloud databases.
                </p>
              </div>

            </div>

            {/* Print trigger button action */}
            <div className="grid grid-cols-1">
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Voucher Slip</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
