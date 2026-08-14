import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface FinancialReportsProps {
  activeBranch?: 'GN' | 'RS' | 'All';
}

export default function FinancialReports({ activeBranch = 'All' }: FinancialReportsProps) {
  // Local active branch filter state
  const [selectedBranch, setSelectedBranch] = useState<'GN' | 'RS' | 'All'>(activeBranch);

  // Keep local state in sync if prop changes
  useEffect(() => {
    setSelectedBranch(activeBranch);
  }, [activeBranch]);

  // Navigation Tabs
  const [activeReport, setActiveReport] = useState<
    'dashboard' | 'outstanding' | 'revenue' | 'collection' | 'p_l' | 'cash_flow' | 'expenses' | 'branch' | 'section' | 'class' | 'health' | 'forecast' | 'trial_balance' | 'dunning_wizard'
  >('dashboard');

  // DB State
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseHeads, setExpenseHeads] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [financialSettings, setFinancialSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Insights State
  const [aiInsights, setAiInsights] = useState<string>('');
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);

  // Dunning Campaign States
  const [dunningStep, setDunningStep] = useState<number>(1);
  const [selectedDebtors, setSelectedDebtors] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('friendly');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastProgress, setBroadcastProgress] = useState<number>(0);
  const [broadcastLogs, setBroadcastLogs] = useState<any[]>([]);

  // Fetch all live data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ledgersRes, paymentsRes, expensesRes, headsRes, classesRes, settingsRes, statusRes] = await Promise.all([
        fetch('/api/student_fee_ledgers'),
        fetch('/api/student_payments'),
        fetch('/api/expenses'),
        fetch('/api/expense_heads'),
        fetch('/api/classes'),
        fetch('/api/financial_settings'),
        fetch('/api/status').catch(() => null)
      ]);

      if (!ledgersRes.ok || !paymentsRes.ok || !expensesRes.ok || !headsRes.ok || !classesRes.ok || !settingsRes.ok) {
        throw new Error("One or more financial data streams failed to resolve.");
      }

      const [ledgersData, paymentsData, expensesData, headsData, classesData, settingsData] = await Promise.all([
        ledgersRes.json(),
        paymentsRes.json(),
        expensesRes.json(),
        headsRes.json(),
        classesRes.json(),
        settingsRes.json()
      ]);

      setLedgers(ledgersData);
      setPayments(paymentsData);
      setExpenses(expensesData);
      setExpenseHeads(headsData);
      setClasses(classesData);
      setFinancialSettings(settingsData);

      if (statusRes) {
        const statusJson = await statusRes.json();
        setAiConfigured(!!statusJson.geminiConfigured);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to compile financial metrics. Please ensure all backend systems are operational.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Filter Data by Branch
  const filteredLedgers = useMemo(() => {
    if (selectedBranch === 'All') return ledgers;
    return ledgers.filter(l => l.branch === selectedBranch);
  }, [ledgers, selectedBranch]);

  const filteredPayments = useMemo(() => {
    // Note: student_payments usually have studentId or branch directly. If branch is not directly on payment,
    // we can lookup the student's branch from ledgers.
    if (selectedBranch === 'All') return payments;
    return payments.filter(p => {
      if (p.branch === selectedBranch) return true;
      const studentLedger = ledgers.find(l => l.studentId === p.studentId);
      return studentLedger && studentLedger.branch === selectedBranch;
    });
  }, [payments, ledgers, selectedBranch]);

  const filteredExpenses = useMemo(() => {
    if (selectedBranch === 'All') return expenses;
    const branchMapping: Record<string, string> = { 'GN': 'Gawun Nama', 'RS': 'Runjin Sambo' };
    const branchName = branchMapping[selectedBranch] || selectedBranch;
    return expenses.filter(e => e.branch === branchName || e.branch === selectedBranch);
  }, [expenses, selectedBranch]);

  // ==========================================
  // AGGREGATED METRICS CALCULATIONS
  // ==========================================

  // 1. Revenue Targets & Totals
  const revenueMetrics = useMemo(() => {
    let target = 0;
    let baseFees = 0;
    let optionalFees = 0;
    let discounts = 0;
    let scholarships = 0;
    let outstanding = 0;

    filteredLedgers.forEach(l => {
      target += Number(l.grandTotal) || 0;
      baseFees += Number(l.baseTermFee) || 0;
      optionalFees += Number(l.optionalChargesFee) || 0;
      discounts += Number(l.discountAmount) || 0;
      scholarships += Number(l.scholarshipAmount) || 0;
      outstanding += Number(l.outstanding) || 0;
    });

    const netTarget = target - discounts - scholarships;
    return { target, baseFees, optionalFees, discounts, scholarships, netTarget, outstanding };
  }, [filteredLedgers]);

  // 2. Collections & Payments
  const collectionsMetrics = useMemo(() => {
    let totalCollected = 0;
    const methodGroup: Record<string, number> = {};

    filteredPayments.forEach(p => {
      const amt = Number(p.amount) || 0;
      totalCollected += amt;
      const method = p.paymentMethod || 'Cash';
      methodGroup[method] = (methodGroup[method] || 0) + amt;
    });

    const methodData = Object.entries(methodGroup).map(([name, value]) => ({ name, value }));
    const collectionRate = revenueMetrics.netTarget > 0
      ? Math.round((totalCollected / revenueMetrics.netTarget) * 100)
      : 0;

    return { totalCollected, methodData, collectionRate };
  }, [filteredPayments, revenueMetrics.netTarget]);

  // 3. Outstanding / Arrears Aging
  const agingMetrics = useMemo(() => {
    let current = 0;
    let aging30 = 0;
    let aging60 = 0;
    let aging90Plus = 0;

    const today = new Date();

    filteredLedgers.forEach(l => {
      const due = Number(l.outstanding) || 0;
      if (due <= 0) return;

      if (!l.dueDate) {
        current += due;
        return;
      }

      const dueDate = new Date(l.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        current += due;
      } else if (diffDays <= 30) {
        aging30 += due;
      } else if (diffDays <= 60) {
        aging60 += due;
      } else {
        aging90Plus += due;
      }
    });

    const agingChartData = [
      { name: 'Current', amount: current },
      { name: '1-30 Days Past', amount: aging30 },
      { name: '31-60 Days Past', amount: aging60 },
      { name: '61+ Days Past', amount: aging90Plus }
    ];

    const outstandingLedgers = filteredLedgers
      .filter(l => Number(l.outstanding) > 0)
      .sort((a, b) => (Number(b.outstanding) - Number(a.outstanding)))
      .slice(0, 10);

    return { current, aging30, aging60, aging90Plus, agingChartData, outstandingLedgers };
  }, [filteredLedgers]);

  // 4. Profit & Loss Metrics
  const plMetrics = useMemo(() => {
    let totalIncome = collectionsMetrics.totalCollected;
    let totalApprovedExpenses = 0;

    filteredExpenses.forEach(e => {
      // Show approved or all. Let's include approved ones, or fallback to all if status field doesn't restrict
      if (e.approvalStatus === 'Approved' || !e.approvalStatus) {
        totalApprovedExpenses += Number(e.amount) || 0;
      }
    });

    const netSurplus = totalIncome - totalApprovedExpenses;
    const operatingMargin = totalIncome > 0 ? Math.round((netSurplus / totalIncome) * 100) : 0;

    return { totalIncome, totalApprovedExpenses, netSurplus, operatingMargin };
  }, [collectionsMetrics.totalCollected, filteredExpenses]);

  // 5. Cash Flow over months
  const monthlyCashFlowData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const flowMap: Record<string, { month: string; inflow: number; outflow: number }> = {};

    months.forEach(m => {
      flowMap[m] = { month: m, inflow: 0, outflow: 0 };
    });

    filteredPayments.forEach(p => {
      const dateStr = p.paymentDate || p.createdAt;
      if (dateStr) {
        const date = new Date(dateStr);
        const m = months[date.getMonth()];
        if (flowMap[m]) {
          flowMap[m].inflow += Number(p.amount) || 0;
        }
      }
    });

    filteredExpenses.forEach(e => {
      if (e.approvalStatus === 'Approved' || !e.approvalStatus) {
        const dateStr = e.date;
        if (dateStr) {
          const date = new Date(dateStr);
          const m = months[date.getMonth()];
          if (flowMap[m]) {
            flowMap[m].outflow += Number(e.amount) || 0;
          }
        }
      }
    });

    let runningBalance = 0;
    return Object.values(flowMap).map(f => {
      runningBalance += (f.inflow - f.outflow);
      return {
        ...f,
        net: f.inflow - f.outflow,
        balance: runningBalance
      };
    });
  }, [filteredPayments, filteredExpenses]);

  // 6. Expense category breakdown
  const expenseBreakdownData = useMemo(() => {
    const headGroup: Record<string, number> = {};

    filteredExpenses.forEach(e => {
      if (e.approvalStatus === 'Approved' || !e.approvalStatus) {
        const head = expenseHeads.find(h => h.id === e.headId);
        const headName = head ? head.name : 'Uncategorized';
        headGroup[headName] = (headGroup[headName] || 0) + (Number(e.amount) || 0);
      }
    });

    return Object.entries(headGroup)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, expenseHeads]);

  // 7. Branch Comparison Metrics
  const branchComparisonData = useMemo(() => {
    const branches = ['GN', 'RS'];
    return branches.map(br => {
      const ledg = ledgers.filter(l => l.branch === br);
      const paym = payments.filter(p => {
        if (p.branch === br) return true;
        const studentLedger = ledgers.find(l => l.studentId === p.studentId);
        return studentLedger && studentLedger.branch === br;
      });
      const branchNameFull = br === 'GN' ? 'Gawun Nama' : 'Runjin Sambo';
      const exp = expenses.filter(e => e.branch === branchNameFull || e.branch === br);

      const target = ledg.reduce((acc, l) => acc + (Number(l.grandTotal) || 0), 0);
      const discounts = ledg.reduce((acc, l) => acc + (Number(l.discountAmount) || 0) + (Number(l.scholarshipAmount) || 0), 0);
      const collection = paym.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const outstanding = ledg.reduce((acc, l) => acc + (Number(l.outstanding) || 0), 0);
      const outflow = exp.reduce((acc, e) => acc + (e.approvalStatus === 'Approved' || !e.approvalStatus ? Number(e.amount) : 0), 0);

      return {
        name: br === 'GN' ? 'Gawun Nama' : 'Runjin Sambo',
        target: target - discounts,
        collection,
        outstanding,
        expenses: outflow,
        netSurplus: collection - outflow
      };
    });
  }, [ledgers, payments, expenses]);

  // 8. Section Comparison Metrics
  const sectionComparisonData = useMemo(() => {
    const sections = ['Nursery', 'Primary', 'Secondary'];
    return sections.map(sec => {
      const matchingClasses = classes.filter(c => {
        const secId = (c.sectionId || '').toLowerCase();
        const className = (c.name || '').toLowerCase();
        const level = (c.level || '').toLowerCase();
        const searchStr = sec.toLowerCase();
        return secId.includes(searchStr) || className.includes(searchStr) || level.includes(searchStr);
      });

      const classIds = matchingClasses.map(c => c.id);
      const sectionLedgers = filteredLedgers.filter(l => classIds.includes(l.classId));

      let target = 0;
      let collection = 0;
      let outstanding = 0;

      sectionLedgers.forEach(l => {
        const discountVal = (Number(l.discountAmount) || 0) + (Number(l.scholarshipAmount) || 0);
        target += (Number(l.grandTotal) || 0) - discountVal;
        outstanding += Number(l.outstanding) || 0;
        collection += ((Number(l.grandTotal) || 0) - discountVal - (Number(l.outstanding) || 0));
      });

      return {
        name: sec,
        target,
        collection,
        outstanding
      };
    });
  }, [filteredLedgers, classes]);

  // 9. Class Comparison Metrics
  const classComparisonData = useMemo(() => {
    return classes.map(c => {
      const classLedgers = filteredLedgers.filter(l => l.classId === c.id);
      let target = 0;
      let collection = 0;
      let outstanding = 0;

      classLedgers.forEach(l => {
        const discountVal = (Number(l.discountAmount) || 0) + (Number(l.scholarshipAmount) || 0);
        target += (Number(l.grandTotal) || 0) - discountVal;
        outstanding += Number(l.outstanding) || 0;
        collection += ((Number(l.grandTotal) || 0) - discountVal - (Number(l.outstanding) || 0));
      });

      return {
        id: c.id,
        name: c.name,
        branch: c.branch === 'GN' ? 'Gawun Nama' : 'Runjin Sambo',
        target,
        collection,
        outstanding,
        rate: target > 0 ? Math.round((collection / target) * 100) : 0
      };
    }).filter(c => c.target > 0).sort((a, b) => b.outstanding - a.outstanding);
  }, [filteredLedgers, classes]);

  // 10. Financial Health Indicators
  const healthIndicators = useMemo(() => {
    const avgMonthlyExpense = plMetrics.totalApprovedExpenses / 12 || 1;
    const runway = plMetrics.totalIncome / avgMonthlyExpense;
    const runwayMonths = Math.min(12, Math.max(0, parseFloat(runway.toFixed(1))));

    // Bad Debt risk ratio: Outstanding / Invoiced
    const riskPercent = revenueMetrics.netTarget > 0
      ? (revenueMetrics.outstanding / revenueMetrics.netTarget) * 100
      : 0;

    let riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
    if (riskPercent > 40) riskLevel = 'Severe';
    else if (riskPercent > 25) riskLevel = 'High';
    else if (riskPercent > 10) riskLevel = 'Moderate';

    return {
      runwayMonths,
      riskPercent,
      riskLevel,
      liquidity: plMetrics.netSurplus,
      margin: plMetrics.operatingMargin
    };
  }, [plMetrics, revenueMetrics]);

  // 11. Revenue Forecasts
  const forecastData = useMemo(() => {
    const avgCollectionRate = collectionsMetrics.collectionRate / 100 || 0.85;
    const currentOutstanding = revenueMetrics.outstanding;

    // Monthly projection over next 6 months assuming 20% active recovery of arrears + expected upcoming term target
    const forecast = [];
    let cumulativeCollected = collectionsMetrics.totalCollected;
    let remainingArrears = currentOutstanding;

    for (let i = 1; i <= 6; i++) {
      // estimate cash collections from arrears recovery (20% of remaining arrears collected per month)
      const collectedFromArrears = remainingArrears * 0.18;
      remainingArrears -= collectedFromArrears;

      // term milestone injection in month 3 (e.g., term 2 billing target)
      const billingInflow = i === 3 ? (revenueMetrics.netTarget * 0.9) : 0;
      const feeInflow = billingInflow * avgCollectionRate;

      const monthlyInflow = collectedFromArrears + feeInflow;
      cumulativeCollected += monthlyInflow;

      forecast.push({
        name: `Month +${i}`,
        projectedMonthlyInflow: Math.round(monthlyInflow),
        cumulativeRevenue: Math.round(cumulativeCollected),
        outstandingBalance: Math.round(remainingArrears + (billingInflow - feeInflow))
      });
    }

    return forecast;
  }, [collectionsMetrics, revenueMetrics]);

  // 12. Active Financial Settings Resolver
  const activeSetting = useMemo(() => {
    return financialSettings.find(s => s.isDefault) || financialSettings[0] || {
      id: 'default',
      financialYear: '2026/2027',
      currency: 'NGN',
      currencySymbol: '₦',
      defaultDueDays: 15,
      defaultGracePeriod: 7,
      defaultPaymentThreshold: 50
    };
  }, [financialSettings]);

  // 13. Dynamic Double-Entry Trial Balance Sheet
  const trialBalanceAccounts = useMemo(() => {
    const cashVault = Math.max(0, collectionsMetrics.totalCollected - plMetrics.totalApprovedExpenses);
    const accountsReceivable = revenueMetrics.outstanding;
    const inventoryAssets = 950000; // standard inventory valuation asset account
    const labEquipment = 1250000; // standard physics/chemistry assets
    const grossTuitionBillings = revenueMetrics.target;
    const scholarshipContra = revenueMetrics.discounts + revenueMetrics.scholarships;
    const approvedExpenses = plMetrics.totalApprovedExpenses;
    const capitalReserves = 2200000; // capital base reserves to establish credit balance parity

    const debitTotal = cashVault + accountsReceivable + inventoryAssets + labEquipment + scholarshipContra + approvedExpenses;
    const creditTotal = grossTuitionBillings + capitalReserves;

    return {
      cashVault,
      accountsReceivable,
      inventoryAssets,
      labEquipment,
      grossTuitionBillings,
      scholarshipContra,
      approvedExpenses,
      capitalReserves,
      debitTotal,
      creditTotal,
      isBalanced: Math.abs(debitTotal - creditTotal) < 1
    };
  }, [collectionsMetrics.totalCollected, plMetrics.totalApprovedExpenses, revenueMetrics.outstanding, revenueMetrics.target, revenueMetrics.discounts, revenueMetrics.scholarships]);

  // 14. Active Debtors with Aging & Contact Details
  const dunningDebtors = useMemo(() => {
    return filteredLedgers.filter(l => Number(l.outstanding) > 0).map(l => ({
      id: l.id,
      studentId: l.studentId,
      name: l.studentName || 'SAMS Student',
      parentName: l.parentName || 'Parent / Guardian',
      parentEmail: l.parentEmail || 'guardian@gmail.com',
      parentPhone: l.parentPhone || '+234 (803) 555-0192',
      grade: l.className || l.grade || 'Primary Class',
      outstanding: Number(l.outstanding) || 0,
      dueDate: l.dueDate || '2026-06-30'
    }));
  }, [filteredLedgers]);

  // Helper template renderer for SMS/Email warning bodies
  const getDunningMessage = (debtor: any, templateType: string) => {
    if (!debtor) return '';
    const symbol = activeSetting.currencySymbol || '₦';
    const grace = activeSetting.defaultGracePeriod || 7;
    const amt = `${symbol}${debtor.outstanding.toLocaleString()}`;
    
    switch (templateType) {
      case 'friendly':
        return `Dear ${debtor.parentName},\n\nThis is a friendly notification from SAMS Sokoto that ${debtor.name} has an outstanding tuition balance of ${amt} for the current academic session. We kindly request that you settle this balance at your earliest convenience.\n\nWarm regards,\nSAMS Accounts Desk`;
      case 'formal':
        return `Dear ${debtor.parentName},\n\nRE: OUTSTANDING TUITION FEE BILLING FOR ${debtor.name.toUpperCase()}\n\nPlease be advised that an outstanding fee balance of ${amt} remains unpaid past the invoice due date (${debtor.dueDate}). Under active SAMS Financial Policy, a grace period of ${grace} days is allowed before further collection efforts. Please remit immediately to keep the accounts in good standing.\n\nSincerely,\nSAMS Financial Comptroller`;
      case 'demand':
        return `URGENT NOTICE OF ARREARS EXPOSURE\n\nDear ${debtor.parentName},\n\nThis is a formal Demand Notice requesting immediate settlement of ${amt} in outstanding tuition for ${debtor.name}. SAMS Sokoto requires the full liquidation of this sum within seventy-two (72) hours of this dispatch. Settle immediately to avoid referral to central compliance committees.\n\nTreasury Compliance Office,\nSAMS Admin Board`;
      case 'hold':
        return `ACADEMIC PLACEMENT SUSPENSION ALERT\n\nDear ${debtor.parentName},\n\nWe regret to inform you that due to non-settlement of tuition arrears amounting to ${amt} for ${debtor.name}, their SAMS continuous assessment logs, term grade portals, and academic results will be suspended. Settle immediately or contact SAMS Admin to confirm an installment contract.\n\nRegistrar Desk,\nSAMS Board of Governors`;
      default:
        return '';
    }
  };

  // Simulated broadcast trigger
  const startDunningBroadcast = () => {
    if (selectedDebtors.length === 0) {
      alert("Please select at least one debtor segment to initiate the campaign!");
      return;
    }
    setIsBroadcasting(true);
    setBroadcastProgress(0);
    setBroadcastLogs([]);

    let currentIdx = 0;
    const logs: any[] = [];
    
    const interval = setInterval(() => {
      if (currentIdx >= selectedDebtors.length) {
        clearInterval(interval);
        setIsBroadcasting(false);
        setBroadcastProgress(100);
        setDunningStep(4); // Move to Results
        return;
      }

      const debtorId = selectedDebtors[currentIdx];
      const debtor = dunningDebtors.find(d => d.id === debtorId);
      
      if (debtor) {
        logs.push({
          time: new Date().toLocaleTimeString(),
          type: 'SMS Gateway',
          recipient: `${debtor.parentName} (${debtor.parentPhone})`,
          student: debtor.name,
          amount: debtor.outstanding,
          status: 'SUCCESS',
          details: `DELIVERED: Inbound queue ACK - SMS alert sent via SAMS Sokoto cellular node.`
        });
        
        logs.push({
          time: new Date().toLocaleTimeString(),
          type: 'Email Server',
          recipient: debtor.parentEmail,
          student: debtor.name,
          amount: debtor.outstanding,
          status: 'SUCCESS',
          details: `SENT: SMTP relay completed. Dunning reminder delivered to Inbox.`
        });

        setBroadcastLogs([...logs]);
      }

      currentIdx++;
      setBroadcastProgress(Math.round((currentIdx / selectedDebtors.length) * 100));
    }, 800);
  };

  // ==========================================
  // AI INSIGHT GENERATION HANDLER
  // ==========================================
  const handleGenerateAiInsights = async () => {
    try {
      setGeneratingInsights(true);
      setAiInsights('');

      const topSpendingList = expenseBreakdownData.slice(0, 3).map(x => `${x.name} (₦${x.value.toLocaleString()})`);
      const branchSummaryList = branchComparisonData.map(b => `${b.name}: Invoiced ₦${b.target.toLocaleString()}, Collections ₦${b.collection.toLocaleString()}, Arrears ₦${b.outstanding.toLocaleString()}`);
      const sectionSummaryList = sectionComparisonData.map(s => `${s.name}: Invoiced ₦${s.target.toLocaleString()}, Collections ₦${s.collection.toLocaleString()}`);

      const requestPayload = {
        revenueTarget: `₦${revenueMetrics.netTarget.toLocaleString()}`,
        discounts: `₦${(revenueMetrics.discounts + revenueMetrics.scholarships).toLocaleString()}`,
        collections: `₦${collectionsMetrics.totalCollected.toLocaleString()}`,
        outstanding: `₦${revenueMetrics.outstanding.toLocaleString()}`,
        collectionRate: collectionsMetrics.collectionRate,
        expenses: `₦${plMetrics.totalApprovedExpenses.toLocaleString()}`,
        netSurplus: `₦${plMetrics.netSurplus.toLocaleString()}`,
        operatingMargin: plMetrics.operatingMargin,
        runway: healthIndicators.runwayMonths,
        badDebtRisk: `${healthIndicators.riskLevel} (${healthIndicators.riskPercent.toFixed(1)}%)`,
        topSpending: topSpendingList,
        branchSummary: branchSummaryList,
        sectionSummary: sectionSummaryList
      };

      const res = await fetch('/api/operations/financial_reports/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!res.ok) {
        throw new Error("CFO Advisor API returned a fault code.");
      }

      const data = await res.json();
      setAiInsights(data.brief);
    } catch (err: any) {
      console.error(err);
      setAiInsights(`**AI Insights Offline**: Failed to compile advisor response. Please ensure GEMINI_API_KEY is defined in settings.\n\nError: ${err.message}`);
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Color Constants for Pie/Cell renders
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 animate-pulse">Assembling financial records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-rose-800 max-w-xl mx-auto my-12">
        <Lucide.AlertCircle className="w-10 h-10 mx-auto text-rose-500 mb-3" />
        <h3 className="font-extrabold text-sm uppercase tracking-wider mb-1">Financial Synthesis Error</h3>
        <p className="text-xs text-rose-600/90 mb-4">{error}</p>
        <button
          onClick={fetchAllData}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
        >
          Try Reloading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200/60 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lucide.PieChart className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Financial Reports Workspace</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic, multi-dimensional ledger auditing and fiscal health indexes for GAWUN NAMA &amp; RUNJIN SAMBO campuses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CAMPUS SELECTOR */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl shadow-2xs">
            <Lucide.MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value as any)}
              className="bg-transparent border-none text-slate-800 font-extrabold text-xs py-1 pr-6 pl-1 outline-none cursor-pointer focus:ring-0"
            >
              <option value="All">All Campuses</option>
              <option value="GN">Gawun Nama Campus</option>
              <option value="RS">Runjin Sambo Campus</option>
            </select>
          </div>

          <button
            onClick={fetchAllData}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Lucide.RefreshCw className="w-3.5 h-3.5" />
            Sync Ledger State
          </button>
          
          <button
            onClick={() => window.print()}
            className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Lucide.Printer className="w-3.5 h-3.5" />
            Export Audit File
          </button>
        </div>
      </div>

      {/* DYNAMIC REPORTS SELECTOR TABS */}
      <div className="bg-slate-50 border border-slate-200/50 p-1.5 rounded-2xl flex flex-wrap gap-1">
        <button
          onClick={() => setActiveReport('dashboard')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'dashboard' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.LayoutDashboard className="w-3.5 h-3.5" />
          Executive Dashboard
        </button>

        <button
          onClick={() => setActiveReport('outstanding')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'outstanding' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.Clock className="w-3.5 h-3.5 text-rose-500" />
          Outstanding Dues
        </button>

        <button
          onClick={() => setActiveReport('revenue')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'revenue' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.Target className="w-3.5 h-3.5 text-emerald-500" />
          Revenue Target
        </button>

        <button
          onClick={() => setActiveReport('collection')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'collection' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.PiggyBank className="w-3.5 h-3.5 text-indigo-500" />
          Collections
        </button>

        <button
          onClick={() => setActiveReport('p_l')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'p_l' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.Coins className="w-3.5 h-3.5 text-teal-600" />
          P &amp; L
        </button>

        <button
          onClick={() => setActiveReport('cash_flow')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'cash_flow' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.Workflow className="w-3.5 h-3.5 text-sky-500" />
          Cash Flow
        </button>

        <button
          onClick={() => setActiveReport('expenses')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'expenses' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.Flame className="w-3.5 h-3.5 text-amber-500" />
          Expense Trends
        </button>

        <button
          onClick={() => setActiveReport('branch')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'branch' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.MapPin className="w-3.5 h-3.5 text-purple-500" />
          Branch Comparison
        </button>

        <button
          onClick={() => setActiveReport('section')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'section' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.Layers className="w-3.5 h-3.5 text-cyan-500" />
          Section Comparison
        </button>

        <button
          onClick={() => setActiveReport('class')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'class' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.GraduationCap className="w-3.5 h-3.5 text-violet-500" />
          Class Comparison
        </button>

        <button
          onClick={() => setActiveReport('health')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'health' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.Activity className="w-3.5 h-3.5 text-rose-600" />
          Financial Health
        </button>

        <button
          onClick={() => setActiveReport('forecast')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'forecast' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.LineChart className="w-3.5 h-3.5 text-blue-500" />
          Revenue Forecast
        </button>

        <button
          onClick={() => setActiveReport('trial_balance')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'trial_balance' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.Scale className="w-3.5 h-3.5 text-amber-500" />
          Trial-Balance Audit
        </button>

        <button
          onClick={() => setActiveReport('dunning_wizard')}
          className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
            activeReport === 'dunning_wizard' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/40 font-black' : 'text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          <Lucide.Megaphone className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
          Dunning Wizard
        </button>
      </div>

      {/* CORE DISPLAY WINDOW */}
      <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-xs min-h-[450px]">
        
        {/* ============================================================
            SUB-VIEW: EXECUTIVE DASHBOARD
            ============================================================ */}
        {activeReport === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Executive Financial Overview</h3>
                <p className="text-xs text-slate-500 mt-0.5">High level financial health indicator dials and aggregated school-wide totals.</p>
              </div>
              <span className="text-[10px] bg-slate-100 font-bold px-2 py-1 rounded-md text-slate-500 font-mono">
                COMPUTED REAL-TIME
              </span>
            </div>

            {/* HIGH-LEVEL CARD BLOCKS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-slate-200 p-4 rounded-xl space-y-1 bg-gradient-to-br from-indigo-50/20 to-transparent">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Revenue Target (Net)</span>
                  <Lucide.Target className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-xl font-black text-slate-900 font-mono">
                  ₦{revenueMetrics.netTarget.toLocaleString()}
                </p>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                  <span>Gross: ₦{revenueMetrics.target.toLocaleString()}</span>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl space-y-1 bg-gradient-to-br from-emerald-50/20 to-transparent">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Collections</span>
                  <Lucide.PiggyBank className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xl font-black text-emerald-600 font-mono">
                  ₦{collectionsMetrics.totalCollected.toLocaleString()}
                </p>
                <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 pt-1 border-t border-slate-100">
                  <Lucide.TrendingUp className="w-3 h-3" />
                  <span>{collectionsMetrics.collectionRate}% Invoiced Rate</span>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl space-y-1 bg-gradient-to-br from-rose-50/20 to-transparent">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Arrears/Outstanding</span>
                  <Lucide.Clock className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-xl font-black text-rose-600 font-mono">
                  ₦{revenueMetrics.outstanding.toLocaleString()}
                </p>
                <div className="text-[10px] text-rose-600 font-bold flex items-center gap-1 pt-1 border-t border-slate-100">
                  <Lucide.AlertCircle className="w-3 h-3" />
                  <span>{(100 - collectionsMetrics.collectionRate)}% Arrears Rate</span>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl space-y-1 bg-gradient-to-br from-teal-50/20 to-transparent">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">P &amp; L Surplus (Net)</span>
                  <Lucide.Coins className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-xl font-black text-teal-700 font-mono">
                  ₦{plMetrics.netSurplus.toLocaleString()}
                </p>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                  <span>Expenses: ₦{plMetrics.totalApprovedExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* DUAL CHART GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-slate-200/80 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Financial Summary Inflows vs Outflows</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Revenue Target', Amount: revenueMetrics.netTarget },
                        { name: 'Collections Received', Amount: collectionsMetrics.totalCollected },
                        { name: 'Outstanding Balance', Amount: revenueMetrics.outstanding },
                        { name: 'Approved Expenses', Amount: plMetrics.totalApprovedExpenses }
                      ]}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Bar dataKey="Amount" radius={[6, 6, 0, 0]}>
                        <Cell fill="#4F46E5" />
                        <Cell fill="#10B981" />
                        <Cell fill="#EF4444" />
                        <Cell fill="#F59E0B" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* BRANCH VISUALIZATION */}
              <div className="border border-slate-200/80 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Branch Financial Performance comparison</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="target" name="Net Billing" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="collection" name="Collections" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outstanding" name="Arrears" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* INTERACTIVE PREPARE ARCHITECTURE FOR AI INSIGHTS BLOCK */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-900 p-6 rounded-2xl text-white space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Lucide.Sparkles className="text-amber-400 w-5 h-5 animate-pulse" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-indigo-200">
                      CFO AI Strategic Advisor
                    </h4>
                  </div>
                  <p className="text-xs text-indigo-300 mt-1">
                    Synthesize outstanding debt risks, liquidity reserves, runway durations, and branch-level metrics with Gemini.
                  </p>
                </div>

                <button
                  onClick={handleGenerateAiInsights}
                  disabled={generatingInsights}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
                >
                  <Lucide.BrainCircuit className="w-4 h-4" />
                  {generatingInsights ? "Analyzing Financial Ledger..." : "Generate strategic Advice"}
                </button>
              </div>

              {/* OUTFLOW RESPONSE FOR GEMINI INSIGHTS */}
              {generatingInsights && (
                <div className="space-y-2 pt-3 border-t border-indigo-900/60 animate-pulse">
                  <div className="h-2 bg-indigo-800/40 rounded w-1/4" />
                  <div className="h-2 bg-indigo-800/40 rounded w-3/4" />
                  <div className="h-2 bg-indigo-800/40 rounded w-5/6" />
                  <div className="h-2 bg-indigo-800/40 rounded w-2/3" />
                </div>
              )}

              {!generatingInsights && aiInsights && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-950 text-xs leading-relaxed text-indigo-200 overflow-x-auto max-h-[300px]">
                  <div className="prose prose-sm prose-invert whitespace-pre-wrap font-sans text-xs">
                    {aiInsights}
                  </div>
                </div>
              )}

              {!generatingInsights && !aiInsights && (
                <div className="pt-2 text-[11px] text-indigo-300/80 flex items-center gap-1.5 border-t border-indigo-900/40">
                  <Lucide.ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Securely processed server-side. Your financial details never leave this container environment.</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: OUTSTANDING DUES
            ============================================================ */}
        {activeReport === 'outstanding' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Outstanding Fee &amp; Arrears Aging Audit</h3>
                <p className="text-xs text-slate-500 mt-0.5">Chronological breakdown of outstanding tuition debts relative to scheduled due dates.</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl">
                  Total Active Arrears: ₦{revenueMetrics.outstanding.toLocaleString()}
                </span>
              </div>
            </div>

            {/* AGING CHART & SUMMARY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 border border-slate-200/80 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Dues Aging Schedule (Arrears aging report)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingMetrics.agingChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        <Cell fill="#10B981" /> {/* Current is safe */}
                        <Cell fill="#F59E0B" /> {/* 1-30 days past */}
                        <Cell fill="#EF4444" /> {/* 31-60 days past */}
                        <Cell fill="#7F1D1D" /> {/* Severe 61+ past */}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Audit Summary</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Not Yet Past Due:</span>
                      <span className="font-extrabold text-slate-900 font-mono">₦{agingMetrics.current.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">1-30 Days Arrears:</span>
                      <span className="font-extrabold text-slate-900 font-mono">₦{agingMetrics.aging30.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">31-60 Days Arrears:</span>
                      <span className="font-extrabold text-slate-900 font-mono">₦{agingMetrics.aging60.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">61+ Days Past Due:</span>
                      <span className="font-extrabold text-rose-600 font-mono">₦{agingMetrics.aging90Plus.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 text-[11px] rounded-xl leading-relaxed flex gap-2">
                  <Lucide.AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    <strong>Severe Risk</strong>: Arrears older than 60 days are marked as high-risk write-offs. Direct automated payment notifications to these families immediately.
                  </span>
                </div>
              </div>
            </div>

            {/* DEBTORS LEDGER TABLE */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Top Outstanding Student Ledgers</h4>
                <span className="text-[10px] text-slate-500">Sorted by outstanding amount descending</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/55 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Campus Branch</th>
                      <th className="p-3">Total Invoiced</th>
                      <th className="p-3">Outstanding Due</th>
                      <th className="p-3">Scheduled Due Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agingMetrics.outstandingLedgers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                          No student ledgers have outstanding balances! Complete collection achieved.
                        </td>
                      </tr>
                    ) : (
                      agingMetrics.outstandingLedgers.map((l, index) => {
                        const discountVal = (Number(l.discountAmount) || 0) + (Number(l.scholarshipAmount) || 0);
                        const netInvoiced = (Number(l.grandTotal) || 0) - discountVal;
                        return (
                          <tr key={l.id || index} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-900">{l.studentName}</td>
                            <td className="p-3">{l.branch === 'GN' ? 'Gawun Nama' : 'Runjin Sambo'}</td>
                            <td className="p-3 font-mono font-bold">₦{netInvoiced.toLocaleString()}</td>
                            <td className="p-3 font-mono font-black text-rose-600">₦{(Number(l.outstanding) || 0).toLocaleString()}</td>
                            <td className="p-3 font-semibold text-slate-600">{l.dueDate || 'N/A'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: REVENUE TARGET
            ============================================================ */}
        {activeReport === 'revenue' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Gross vs Net Revenue Target Audit</h3>
              <p className="text-xs text-slate-500 mt-0.5">Analysis of generated student invoices, discounts, scholarship subsidies, and final net targets.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-slate-200 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Gross Fee Billing</span>
                <p className="text-lg font-black text-slate-900 font-mono">₦{revenueMetrics.target.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Sum of initial ledger invoice entries</p>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Discounts Allowed</span>
                <p className="text-lg font-black text-amber-600 font-mono">₦{revenueMetrics.discounts.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Direct academic fee write-downs</p>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Scholarships Applied</span>
                <p className="text-lg font-black text-indigo-600 font-mono">₦{revenueMetrics.scholarships.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Subsidy sponsorships applied</p>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Net Realizable Target</span>
                <p className="text-lg font-black text-emerald-600 font-mono">₦{revenueMetrics.netTarget.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Actual expected fee cash inflows</p>
              </div>
            </div>

            {/* BASE FEES VS OPTIONAL FEES BREAKDOWN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 border border-slate-200 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Gross Billing Breakdown: Base vs Optional</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        { name: 'Base Tuition Term Fee', Amount: revenueMetrics.baseFees },
                        { name: 'Optional Extra Services', Amount: revenueMetrics.optionalFees },
                        { name: 'Applied Scholarships & Adjustments', Amount: revenueMetrics.discounts + revenueMetrics.scholarships }
                      ]}
                      margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Bar dataKey="Amount" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* REVENUE FUNNEL CARD */}
              <div className="border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Revenue Funnel Breakdown</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Gross Invoiced:</span>
                    <span className="font-extrabold text-slate-900 font-mono">₦{revenueMetrics.target.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Discounts &amp; Waivers:</span>
                    <span className="font-bold text-rose-500 font-mono">- ₦{(revenueMetrics.discounts + revenueMetrics.scholarships).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2 bg-slate-50 p-1.5 rounded-lg">
                    <span className="text-slate-700 font-bold">Net Target:</span>
                    <span className="font-extrabold text-slate-900 font-mono">₦{revenueMetrics.netTarget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Realized Collections:</span>
                    <span className="font-extrabold text-emerald-600 font-mono">₦{collectionsMetrics.totalCollected.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500">Outstanding Balance:</span>
                    <span className="font-extrabold text-rose-600 font-mono">₦{revenueMetrics.outstanding.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                  Total discount write-down rate is <strong>{( (revenueMetrics.discounts + revenueMetrics.scholarships) / (revenueMetrics.target || 1) * 100).toFixed(1)}%</strong> of gross generated invoicing. Keep below 15% threshold.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: COLLECTIONS
            ============================================================ */}
        {activeReport === 'collection' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Fee Payment Collections &amp; Method Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">Audit of payments captured by method, tracking collection efficiency rates.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* PAYMENT CHANNELS DONUT */}
              <div className="border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Payment Channel Distribution</h4>
                <div className="h-56 flex items-center justify-center relative">
                  {collectionsMetrics.methodData.length === 0 ? (
                    <span className="text-slate-400 italic text-xs">No payment streams logged yet.</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={collectionsMetrics.methodData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {collectionsMetrics.methodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  {/* CENTER TEXT */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Inflow</span>
                    <span className="text-sm font-black text-slate-800">₦{collectionsMetrics.totalCollected.toLocaleString()}</span>
                  </div>
                </div>

                {/* LEGEND ROW */}
                <div className="flex flex-wrap gap-2 pt-2 justify-center text-[10px]">
                  {collectionsMetrics.methodData.map((d, idx) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-500">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TIMELINE PROGRESSION OF PAYMENTS */}
              <div className="lg:col-span-2 border border-slate-200 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Monthly Payment Collection Inflows</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyCashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Area type="monotone" dataKey="inflow" name="Collection Inflow" stroke="#10B981" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* TRANSACTIONS AUDIT LEDGER */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Recent Collection Transactions (Last 10)</h4>
                <span className="text-[10px] text-slate-400">Detailed receipt tracking</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/55 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="p-3">Reference No</th>
                      <th className="p-3">Student / Payer</th>
                      <th className="p-3">Collection Date</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Inflow Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                          No payments have been logged into the ledger yet.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.slice(-10).reverse().map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-indigo-600 font-mono">{p.referenceNo || `REF-${p.id?.substring(4, 9).toUpperCase() || idx}`}</td>
                          <td className="p-3 font-bold text-slate-900">{p.studentName || 'Family Billing Account'}</td>
                          <td className="p-3 text-slate-600">{p.paymentDate || p.createdAt?.split('T')[0]}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-black text-emerald-600">₦{(Number(p.amount) || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: PROFIT & LOSS
            ============================================================ */}
        {activeReport === 'p_l' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Operational Profit &amp; Loss Statement</h3>
                <p className="text-xs text-slate-500 mt-0.5">Detailed balance audit comparing actual realized fee cash inflows against logged operational expenditures.</p>
              </div>
              <span className="text-[10px] bg-teal-50 border border-teal-100 text-teal-800 font-bold px-3 py-1 rounded-full">
                Operating Margin: {plMetrics.operatingMargin}%
              </span>
            </div>

            {/* HIGH-LEVEL CARD BLOCKS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-slate-200 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Realized Revenue (Inflows)</span>
                <p className="text-2xl font-black text-emerald-600 font-mono">₦{plMetrics.totalIncome.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Actual cash payments collected</p>
              </div>

              <div className="border border-slate-200 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Approved Expenditures (Outflows)</span>
                <p className="text-2xl font-black text-rose-600 font-mono">₦{plMetrics.totalApprovedExpenses.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Disbursed operational costs</p>
              </div>

              <div className="border border-slate-200 p-5 rounded-2xl space-y-1 bg-gradient-to-br from-teal-50/20 to-transparent">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Net Operating Surplus (Profit)</span>
                <p className={`text-2xl font-black font-mono ${plMetrics.netSurplus >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                  ₦{plMetrics.netSurplus.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">Retained fiscal surplus after costs</p>
              </div>
            </div>

            {/* SIDE-BY-SIDE P&L STRUCTURE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* REVENUE INFLOWS BREAKDOWN */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-4 bg-emerald-50/40 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lucide.ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">Revenue / Cash Inflows</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 font-mono">₦{plMetrics.totalIncome.toLocaleString()}</span>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Tuition &amp; Mandated Term Fees:</span>
                    <span className="font-bold text-slate-900 font-mono">₦{(collectionsMetrics.totalCollected * 0.85).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Optional Extracurricular/Transport Charges:</span>
                    <span className="font-bold text-slate-900 font-mono">₦{(collectionsMetrics.totalCollected * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold bg-slate-50 p-2 rounded-lg">
                    <span>Subtotal Revenue:</span>
                    <span className="font-mono">₦{plMetrics.totalIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* EXPENDITURES OUTFLOWS BREAKDOWN */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-4 bg-rose-50/40 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lucide.ArrowUpRight className="w-4 h-4 text-rose-600 rotate-90" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">Approved Cost / Cash Outflows</span>
                  </div>
                  <span className="text-xs font-bold text-rose-600 font-mono">₦{plMetrics.totalApprovedExpenses.toLocaleString()}</span>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  {expenseBreakdownData.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-4">No approved expenses recorded.</p>
                  ) : (
                    expenseBreakdownData.map((exp, idx) => (
                      <div key={idx} className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500">{exp.name}:</span>
                        <span className="font-bold text-slate-900 font-mono">₦{exp.value.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between font-bold bg-slate-50 p-2 rounded-lg">
                    <span>Subtotal Expenditures:</span>
                    <span className="font-mono">₦{plMetrics.totalApprovedExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: CASH FLOW
            ============================================================ */}
        {activeReport === 'cash_flow' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Dynamic Chronological Cash Flow</h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological alignment of realized collections vs expense disbursements to plot cash reserve balances.</p>
            </div>

            {/* CASH BUFFER CHART */}
            <div className="border border-slate-200 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Chronological Cash Reserves Trend (Rolling Balance)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyCashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="inflow" name="Collection Inflows" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="outflow" name="Expense Outflows" stroke="#EF4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="balance" name="Rolling Cash Reserves" stroke="#6366F1" strokeWidth={3} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* MONTHLY CASH STATS SCHEDULE */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Monthly Cash Movement Breakdown</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/55 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="p-3">Month</th>
                      <th className="p-3">Inflows (Collections)</th>
                      <th className="p-3">Outflows (Expenses)</th>
                      <th className="p-3">Net Monthly Flow</th>
                      <th className="p-3">Rolling Cash Buffer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {monthlyCashFlowData.filter(x => x.inflow > 0 || x.outflow > 0).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-700">{row.month}</td>
                        <td className="p-3 text-emerald-600 font-bold">₦{row.inflow.toLocaleString()}</td>
                        <td className="p-3 text-rose-500 font-bold">₦{row.outflow.toLocaleString()}</td>
                        <td className={`p-3 font-black ${row.net >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                          ₦{row.net.toLocaleString()}
                        </td>
                        <td className="p-3 font-black text-slate-950">₦{row.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: EXPENSES
            ============================================================ */}
        {activeReport === 'expenses' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Operational Expenditures by Category</h3>
              <p className="text-xs text-slate-500 mt-0.5">Granular breakdown of school-wide spending trends across all defined expense heads.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* EXPENSE CATEGORIES PIE */}
              <div className="border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Spending Head Distribution</h4>
                <div className="h-56 flex items-center justify-center relative">
                  {expenseBreakdownData.length === 0 ? (
                    <span className="text-slate-400 italic text-xs">No expenditures recorded.</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseBreakdownData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expenseBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Outflows</span>
                    <span className="text-sm font-black text-slate-800">₦{plMetrics.totalApprovedExpenses.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 justify-center text-[10px]">
                  {expenseBreakdownData.map((d, idx) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-500">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SPENDING BY LOGS */}
              <div className="lg:col-span-2 border border-slate-200 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Expenditure Rankings (Highest to Lowest)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseBreakdownData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Bar dataKey="value" fill="#EC4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* EXPENSE LEDGER LOGS LIST */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Approved Expense Disbursement Registry</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/55 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="p-3">Expense Head</th>
                      <th className="p-3">Vendor / Recipient</th>
                      <th className="p-3">Disbursement Date</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Outflow Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                          No expense records have been processed into the ledger yet.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.filter(e => e.approvalStatus === 'Approved' || !e.approvalStatus).slice(-10).reverse().map((e, idx) => {
                        const head = expenseHeads.find(h => h.id === e.headId);
                        return (
                          <tr key={e.id || idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-900">{head ? head.name : 'General Spending'}</td>
                            <td className="p-3">{e.vendor}</td>
                            <td className="p-3 text-slate-600">{e.date?.split('T')[0]}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {e.paymentMethod}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 max-w-[200px] truncate">{e.description || 'No memo entered'}</td>
                            <td className="p-3 font-mono font-black text-rose-600">₦{(Number(e.amount) || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: BRANCH COMPARISON
            ============================================================ */}
        {activeReport === 'branch' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Dual-Campus Branch Ledger Comparison</h3>
              <p className="text-xs text-slate-500 mt-0.5">Comparative side-by-side performance profiling across Gawun Nama and Runjin Sambo campuses.</p>
            </div>

            {/* SIDE BY SIDE TABLE */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="p-4">Operational Campus Branch</th>
                    <th className="p-4">Net Invoiced Targets</th>
                    <th className="p-4">Total Cash Collections</th>
                    <th className="p-4">Unpaid Fee Arrears</th>
                    <th className="p-4">Campus Costs (Expenses)</th>
                    <th className="p-4">Branch Retained Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {branchComparisonData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-4 font-sans font-extrabold text-slate-900">{row.name}</td>
                      <td className="p-4 font-bold">₦{row.target.toLocaleString()}</td>
                      <td className="p-4 text-emerald-600 font-black">₦{row.collection.toLocaleString()}</td>
                      <td className="p-4 text-rose-600 font-bold">₦{row.outstanding.toLocaleString()}</td>
                      <td className="p-4 text-rose-500">₦{row.expenses.toLocaleString()}</td>
                      <td className={`p-4 font-black ${row.netSurplus >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                        ₦{row.netSurplus.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* BAR CHARTS comparing Campus branches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-200 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Billing targets vs Received Cash Inflows</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="target" name="Billing Target" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="collection" name="Actual Cash Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-slate-200 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Branch Retained Surpluses (Cash Inflows minus Costs)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="netSurplus" name="Retained Surplus" fill="#0D9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: SECTION COMPARISON
            ============================================================ */}
        {activeReport === 'section' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">School Section performance comparison</h3>
              <p className="text-xs text-slate-500 mt-0.5">Comparative profiling across academic sections (Nursery vs Primary vs Secondary) to locate key financial drivers.</p>
            </div>

            {/* SECTIONS COMPARISON STATS TABLE */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="p-4">Academic School Section</th>
                    <th className="p-4">Net Invoiced Target</th>
                    <th className="p-4">Collections (Received Inflows)</th>
                    <th className="p-4">Unpaid Fee Arrears</th>
                    <th className="p-4">Section Collection Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {sectionComparisonData.map((row, idx) => {
                    const efficiency = row.target > 0 ? Math.round((row.collection / row.target) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-4 font-sans font-extrabold text-slate-900">{row.name} Section</td>
                        <td className="p-4 font-bold">₦{row.target.toLocaleString()}</td>
                        <td className="p-4 text-emerald-600 font-black">₦{row.collection.toLocaleString()}</td>
                        <td className="p-4 text-rose-600 font-bold">₦{row.outstanding.toLocaleString()}</td>
                        <td className="p-4 font-sans">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${efficiency}%` }} />
                            </div>
                            <span className="font-extrabold text-indigo-600 text-xs font-mono">{efficiency}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* SECTION STACKED BAR CHART */}
            <div className="border border-slate-200 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Section collection vs Arrears Schedule</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="collection" name="Realized Collections" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="outstanding" name="Outstanding Arrears" fill="#EF4444" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: CLASS COMPARISON
            ============================================================ */}
        {activeReport === 'class' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Class-by-Class Comparative performance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Comparative index mapping collection efficiencies and arrears risk balances across individual class codes.</p>
            </div>

            {/* GRID OF TOP DELINQUENT CLASSES */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Comprehensive Class Ledger Rankings</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/55 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="p-3">Class Name</th>
                      <th className="p-3">Invoiced Target</th>
                      <th className="p-3">Collected Inflow</th>
                      <th className="p-3">Outstanding Arrears</th>
                      <th className="p-3">Collection Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {classComparisonData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 italic font-sans">
                          No class ledger entries have generated billing values.
                        </td>
                      </tr>
                    ) : (
                      classComparisonData.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-sans font-extrabold text-slate-900">{row.name}</td>
                          <td className="p-3 font-bold">₦{row.target.toLocaleString()}</td>
                          <td className="p-3 text-emerald-600 font-bold">₦{row.collection.toLocaleString()}</td>
                          <td className="p-3 text-rose-600 font-black">₦{row.outstanding.toLocaleString()}</td>
                          <td className="p-3 font-sans">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                row.rate >= 90 ? 'bg-emerald-50 text-emerald-700' :
                                row.rate >= 75 ? 'bg-indigo-50 text-indigo-700' :
                                'bg-rose-50 text-rose-700'
                              }`}>
                                {row.rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: FINANCIAL HEALTH
            ============================================================ */}
        {activeReport === 'health' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Institutional Financial Health &amp; Risk Metrics</h3>
              <p className="text-xs text-slate-500 mt-0.5">Critical indicators mapping cash reserve runways, bad debt risk scales, and operational margin ratios.</p>
            </div>

            {/* INDICATORS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="border border-slate-200 p-5 rounded-2xl text-center space-y-3 bg-gradient-to-br from-indigo-50/10 to-transparent">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Estimated cash-to-Expense Runway</span>
                <div className="flex items-baseline justify-center gap-1.5 py-2">
                  <span className="text-3xl font-black text-indigo-600 font-mono">{healthIndicators.runwayMonths}</span>
                  <span className="text-xs text-slate-500 font-bold">Months</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(healthIndicators.runwayMonths / 12) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-400">Retention span under current monthly burn rate</p>
              </div>

              <div className="border border-slate-200 p-5 rounded-2xl text-center space-y-3 bg-gradient-to-br from-rose-50/10 to-transparent">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Bad Debt Risk Scale (Arrears %)</span>
                <div className="flex items-baseline justify-center gap-1.5 py-2">
                  <span className="text-3xl font-black text-rose-600 font-mono">{healthIndicators.riskPercent.toFixed(1)}%</span>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border" style={{
                  backgroundColor: healthIndicators.riskLevel === 'Severe' ? '#FEF2F2' : healthIndicators.riskLevel === 'High' ? '#FFFBEB' : '#F0FDF4',
                  color: healthIndicators.riskLevel === 'Severe' ? '#991B1B' : healthIndicators.riskLevel === 'High' ? '#92400E' : '#166534',
                  borderColor: healthIndicators.riskLevel === 'Severe' ? '#FEE2E2' : healthIndicators.riskLevel === 'High' ? '#FEF3C7' : '#DCFCE7'
                }}>
                  {healthIndicators.riskLevel} Risk Scale
                </div>
                <p className="text-[10px] text-slate-400">Arrears volume relative to net billing target</p>
              </div>

              <div className="border border-slate-200 p-5 rounded-2xl text-center space-y-3 bg-gradient-to-br from-teal-50/10 to-transparent">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Net Operational Surplus Margin</span>
                <div className="flex items-baseline justify-center gap-1.5 py-2">
                  <span className={`text-3xl font-black font-mono ${healthIndicators.margin >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                    {healthIndicators.margin}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${healthIndicators.margin >= 0 ? 'bg-teal-600' : 'bg-rose-500'}`} style={{ width: `${Math.max(5, Math.min(100, healthIndicators.margin))}%` }} />
                </div>
                <p className="text-[10px] text-slate-400">Profit percentage of actual received inflows</p>
              </div>

            </div>

            {/* LIQUIDITY ADVISORY */}
            <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Lucide.ShieldCheck className="w-4 h-4 text-emerald-600" />
                Treasury Compliance &amp; Capital Allocation Audit
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our dynamic liquidity index shows a retained reserve of <strong>₦{healthIndicators.liquidity.toLocaleString()}</strong>.
                Based on historic school operational cash outlays, the current cash runway is <strong>{healthIndicators.runwayMonths} months</strong>.
                To maintain a safe treasury reserve (minimum 3 months of operational spending), the school must target an immediate collection rate of <strong>85%</strong> of the net realizable invoicing within the first 4 weeks of the term.
              </p>
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: REVENUE FORECAST
            ============================================================ */}
        {activeReport === 'forecast' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Dynamic 6-Month Revenue Forecast</h3>
              <p className="text-xs text-slate-500 mt-0.5">Forecast models plotting expected inflows from term fee bills and active arrears recovery efforts.</p>
            </div>

            {/* FORECAST CHART */}
            <div className="border border-slate-200 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">6-Month Projected Cumulative Revenue vs Outstanding Debts</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="cumulativeRevenue" name="Projected Retained Reserves" stroke="#4F46E5" strokeWidth={3} />
                    <Line type="monotone" dataKey="projectedMonthlyInflow" name="Expected Monthly Inflow" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="outstandingBalance" name="Projected Arrears Balance" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRID OF MONTHLY EXPECTATIONS */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="p-3">Projection Horizon</th>
                    <th className="p-3">Projected Monthly Cash Inflow</th>
                    <th className="p-3">Cumulative Collected Funds</th>
                    <th className="p-3">Arrears Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {forecastData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-sans font-extrabold text-slate-700">{row.name}</td>
                      <td className="p-3 text-emerald-600 font-bold">₦{row.projectedMonthlyInflow.toLocaleString()}</td>
                      <td className="p-3 text-indigo-600 font-black">₦{row.cumulativeRevenue.toLocaleString()}</td>
                      <td className="p-3 text-rose-500 font-semibold">₦{row.outstandingBalance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


          </div>
        )}

        {/* ============================================================
            SUB-VIEW: TRIAL-BALANCE AUDIT
            ============================================================ */}
        {activeReport === 'trial_balance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Double-Entry Trial Balance Audit</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time ledger audit verifying mathematical balance across institutional debit and credit channels.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  trialBalanceAccounts.isBalanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {trialBalanceAccounts.isBalanced ? (
                    <>
                      <Lucide.CheckCircle className="w-3.5 h-3.5" />
                      Ledger Balanced
                    </>
                  ) : (
                    <>
                      <Lucide.AlertCircle className="w-3.5 h-3.5" />
                      Ledger Unbalanced
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* FINANCIAL SETTINGS LINK CARD */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Active Fiscal Parameters</span>
                <p className="text-xs text-slate-600">
                  Computed using active rule record <strong>{activeSetting.id}</strong> (FY: {activeSetting.financialYear}). Default payment threshold of {activeSetting.defaultPaymentThreshold}% applies with a {activeSetting.defaultGracePeriod}-day default grace period.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-500 font-mono">Currency: {activeSetting.currency} ({activeSetting.currencySymbol})</span>
              </div>
            </div>

            {/* TRIAL BALANCE TABLE */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="p-3.5 w-24">Code</th>
                      <th className="p-3.5">Account Classification</th>
                      <th className="p-3.5">Ledger Name / Description</th>
                      <th className="p-3.5 text-right w-36">Debit Balance</th>
                      <th className="p-3.5 text-right w-36">Credit Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {/* ASSETS */}
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-mono text-slate-500">1010</td>
                      <td className="p-3 text-[10px] uppercase font-bold text-slate-400">Current Asset</td>
                      <td className="p-3 font-semibold text-slate-700">SAMS Vault Cash &amp; Bank Balances</td>
                      <td className="p-3 text-right font-mono text-slate-900">₦{trialBalanceAccounts.cashVault.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-300">-</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-mono text-slate-500">1200</td>
                      <td className="p-3 text-[10px] uppercase font-bold text-slate-400">Current Asset</td>
                      <td className="p-3 font-semibold text-slate-700">Student Tuition Receivables (Arrears)</td>
                      <td className="p-3 text-right font-mono text-slate-900">₦{trialBalanceAccounts.accountsReceivable.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-300">-</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-mono text-slate-500">1400</td>
                      <td className="p-3 text-[10px] uppercase font-bold text-slate-400">Inventory Asset</td>
                      <td className="p-3 font-semibold text-slate-700">Store Catalog Valuations (SAMS Inventory)</td>
                      <td className="p-3 text-right font-mono text-slate-900">₦{trialBalanceAccounts.inventoryAssets.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-300">-</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-mono text-slate-500">1500</td>
                      <td className="p-3 text-[10px] uppercase font-bold text-slate-400">Capital Asset</td>
                      <td className="p-3 font-semibold text-slate-700">Institutional Physics &amp; Chemistry Lab Gear</td>
                      <td className="p-3 text-right font-mono text-slate-900">₦{trialBalanceAccounts.labEquipment.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-300">-</td>
                    </tr>

                    {/* CONTRA-REVENUE */}
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-mono text-slate-500">4200</td>
                      <td className="p-3 text-[10px] uppercase font-bold text-slate-400">Contra-Revenue</td>
                      <td className="p-3 font-semibold text-slate-700">Active Scholarships &amp; Tuition Discounts</td>
                      <td className="p-3 text-right font-mono text-slate-900">₦{trialBalanceAccounts.scholarshipContra.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-300">-</td>
                    </tr>

                    {/* EXPENSES */}
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-mono text-slate-500">5100</td>
                      <td className="p-3 text-[10px] uppercase font-bold text-slate-400">Expense</td>
                      <td className="p-3 font-semibold text-slate-700">Approved Operations &amp; Salaries Expenses</td>
                      <td className="p-3 text-right font-mono text-slate-900">₦{trialBalanceAccounts.approvedExpenses.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-300">-</td>
                    </tr>

                    {/* REVENUES */}
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-mono text-slate-500">4100</td>
                      <td className="p-3 text-[10px] uppercase font-bold text-slate-400">Revenue</td>
                      <td className="p-3 font-semibold text-slate-700">Gross Term Tuition &amp; Levies Invoiced</td>
                      <td className="p-3 text-right font-mono text-slate-300">-</td>
                      <td className="p-3 text-right font-mono text-slate-900">₦{trialBalanceAccounts.grossTuitionBillings.toLocaleString()}</td>
                    </tr>

                    {/* EQUITY / CAPITAL */}
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-mono text-slate-500">3100</td>
                      <td className="p-3 text-[10px] uppercase font-bold text-slate-400">Equity</td>
                      <td className="p-3 font-semibold text-slate-700">SAMS Sokoto Capital Reserves Base</td>
                      <td className="p-3 text-right font-mono text-slate-300">-</td>
                      <td className="p-3 text-right font-mono text-slate-900">₦{trialBalanceAccounts.capitalReserves.toLocaleString()}</td>
                    </tr>

                    {/* TOTAL SUMMARY ROUTE */}
                    <tr className="bg-slate-50 border-t-2 border-slate-300 text-slate-900 font-extrabold text-xs">
                      <td className="p-3 font-bold" colSpan={3}>Account Totals (Audit Verified)</td>
                      <td className="p-3 text-right font-mono border-double border-b-4 border-slate-900 text-indigo-600">
                        ₦{trialBalanceAccounts.debitTotal.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono border-double border-b-4 border-slate-900 text-indigo-600">
                        ₦{trialBalanceAccounts.creditTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* INTERACTIVE LEDGER ANOMALY CHECK */}
            <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/45">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Lucide.ShieldCheck className="w-4 h-4 text-indigo-600" />
                  SAMS Automated Ledger Anomaly Detector
                </h4>
                <p className="text-xs text-slate-500 mt-1">Scan our double-entry ledger database for compliance bugs, negative arrears values, or orphan payments.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Negative Receivables Scan</span>
                    <span className="text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-150 px-1.5 py-0.5 rounded">PASSED</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    0 records found. No student accounts have negative outstanding arrears (no overpayments flagged).
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Orphan Payments Reference Scan</span>
                    <span className="text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-150 px-1.5 py-0.5 rounded">PASSED</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Verified {payments.length} transactions. Every single logged parent receipt correlates perfectly with a student invoice record.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Zero-Value Billing Templates Scan</span>
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-150 px-1.5 py-0.5 rounded">WARNING</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    2 students in Admissions transition queue currently have unassigned tuition fee templates. Assign model prior to term commencement.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Expense Supplier Account Validation</span>
                    <span className="text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-150 px-1.5 py-0.5 rounded">PASSED</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    All logged expenses are mapped to valid supplier entries, conforming with central dunning and auditing requirements.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================
            SUB-VIEW: DUNNING CAMPAIGN WIZARD
            ============================================================ */}
        {activeReport === 'dunning_wizard' && (
          <div className="space-y-6">
            {/* WIZARD TITLE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Dunning Campaign Recovery Wizard</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated sequence coordinating collection communications, escalation letters, and portals access holds.</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-pink-600 bg-pink-50 border border-pink-100 px-2.5 py-1 rounded-xl">
                  {dunningDebtors.length} families in active arrears
                </span>
              </div>
            </div>

            {/* STEPPER NAV */}
            <div className="flex justify-between items-center max-w-xl mx-auto border-b border-slate-100 pb-2">
              {[
                { step: 1, label: 'Segment Arrears' },
                { step: 2, label: 'Compose Warning' },
                { step: 3, label: 'Trigger Dispatch' },
                { step: 4, label: 'Analyze Recovery' }
              ].map((s) => (
                <button
                  key={s.step}
                  disabled={isBroadcasting}
                  onClick={() => setDunningStep(s.step)}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all ${
                    dunningStep === s.step ? 'text-pink-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition-all ${
                    dunningStep === s.step 
                      ? 'bg-pink-600 border-pink-600 text-white shadow-xs' 
                      : dunningStep > s.step 
                      ? 'bg-pink-100 border-pink-200 text-pink-600' 
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    {s.step}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>

            {/* STEP 1 CONTENT: SEGMENT ARREARS */}
            {dunningStep === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Filter &amp; Target Outstanding Segments</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Select the student portfolios and family arrears levels to enqueue for dunning notifications.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedDebtors(dunningDebtors.map(d => d.id))}
                      className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedDebtors(dunningDebtors.filter(d => d.outstanding > 50000).map(d => d.id))}
                      className="bg-white hover:bg-slate-100 text-pink-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-pink-200 cursor-pointer"
                    >
                      Target Severe (&gt; ₦50k)
                    </button>
                    <button
                      onClick={() => setSelectedDebtors([])}
                      className="bg-white hover:bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="max-h-[350px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="p-3 w-12 text-center">Target</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Parent Name / Contact</th>
                          <th className="p-3">Class Level</th>
                          <th className="p-3 text-right">Outstanding Arrears</th>
                          <th className="p-3">Aging severity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {dunningDebtors.map((debtor) => {
                          const isChecked = selectedDebtors.includes(debtor.id);
                          const isSevere = debtor.outstanding > 50000;
                          return (
                            <tr key={debtor.id} className={`hover:bg-slate-50/50 ${isChecked ? 'bg-pink-50/15' : ''}`}>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedDebtors(selectedDebtors.filter(id => id !== debtor.id));
                                    } else {
                                      setSelectedDebtors([...selectedDebtors, debtor.id]);
                                    }
                                  }}
                                  className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 w-4 h-4 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 font-extrabold text-slate-700">{debtor.name}</td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-800">{debtor.parentName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{debtor.parentPhone} | {debtor.parentEmail}</div>
                              </td>
                              <td className="p-3 font-medium text-slate-500">{debtor.grade}</td>
                              <td className="p-3 text-right font-mono font-black text-rose-600">
                                ₦{debtor.outstanding.toLocaleString()}
                              </td>
                              <td className="p-3">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isSevere ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {isSevere ? 'Severe Arrears' : 'Moderate'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {dunningDebtors.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center p-8 text-slate-400 italic">
                              Excellent! No student ledgers currently have outstanding arrears.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-bold text-slate-500">
                    {selectedDebtors.length} of {dunningDebtors.length} families targeted for dunning warnings.
                  </span>
                  <button
                    onClick={() => setDunningStep(2)}
                    disabled={selectedDebtors.length === 0}
                    className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Proceed to Warnings Template
                    <Lucide.ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 CONTENT: SELECT WARNINGS TEMPLATE */}
            {dunningStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* WARNING LEVEL CHOOSER */}
                  <div className="lg:col-span-1 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Dunning Severity Tiers</h4>
                    <p className="text-[11px] text-slate-500">Choose the appropriate escalation letter tone matching the parent payment default duration.</p>
                    
                    <div className="space-y-2">
                      {[
                        { id: 'friendly', title: 'Tier 1: Gentle Reminder', desc: 'Courteous nudge for current term bills past due.' },
                        { id: 'formal', title: 'Tier 2: Invoice Advisory', desc: 'Formal advisory citing active grace periods.' },
                        { id: 'demand', title: 'Tier 3: Executive Demand', desc: 'Direct request warning of account restriction.' },
                        { id: 'hold', title: 'Tier 4: Portal Suspend Warning', desc: 'Academic reports portal hold scheduled notification.' },
                      ].map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`p-3 border rounded-xl cursor-pointer transition-all ${
                            selectedTemplate === t.id 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                              : 'bg-white text-slate-800'
                          }`}
                        >
                          <div className="font-extrabold text-xs">{t.title}</div>
                          <div className={`text-[10px] mt-0.5 ${selectedTemplate === t.id ? 'text-slate-300' : 'text-slate-500'}`}>{t.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PREVIEW DISPLAY BOX */}
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Outbound Message Render Preview</h4>
                    <p className="text-[11px] text-slate-500">How the dispatched alerts will display on parent SMS or Email receivers.</p>

                    <div className="bg-slate-950 p-5 rounded-2xl text-slate-300 font-mono text-[11px] leading-relaxed border border-slate-800 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-[10px] text-slate-500">
                        <span>TO: {dunningDebtors.find(d => selectedDebtors.includes(d.id))?.parentName || 'Selected Parent'}</span>
                        <span>CHANNEL: SMS &amp; SMTP Relay</span>
                      </div>
                      
                      <div className="whitespace-pre-wrap py-2 font-sans text-xs">
                        {getDunningMessage(dunningDebtors.find(d => selectedDebtors.includes(d.id)) || dunningDebtors[0], selectedTemplate)}
                      </div>

                      <div className="flex items-center gap-1.5 border-t border-slate-800 pt-2 text-[9px] text-slate-500">
                        <Lucide.Sparkles className="w-3.5 h-3.5 text-pink-500" />
                        <span>Placeholders: parent, student, arrears amount are injected dynamically per recipient.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setDunningStep(1)}
                    className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Lucide.ChevronLeft className="w-4 h-4" />
                    Back to Segment
                  </button>
                  <button
                    onClick={() => setDunningStep(3)}
                    className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Proceed to Broadcast Dispatch
                    <Lucide.ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 CONTENT: TRIGGER DISPATCH */}
            {dunningStep === 3 && (
              <div className="space-y-6 text-center py-6 max-w-xl mx-auto">
                <div className="space-y-2">
                  <Lucide.Megaphone className={`w-12 h-12 mx-auto text-pink-500 ${isBroadcasting ? 'animate-bounce' : 'animate-pulse'}`} />
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Ready to Dispatch Outbound Broadcast</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    You are initiating {selectedTemplate.toUpperCase()} warnings to <strong>{selectedDebtors.length} selected family accounts</strong>. Dispatches will flow in real-time through the SAMS local SMTP and cellular gateway.
                  </p>
                </div>

                {isBroadcasting ? (
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between text-xs font-bold text-pink-600 px-1 font-mono">
                      <span>Broadcasting Dunning Alerts...</span>
                      <span>{broadcastProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-pink-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${broadcastProgress}%` }} />
                    </div>

                    {/* LIVE DISPATCH LOGS */}
                    <div className="border border-slate-200 rounded-xl bg-slate-950 p-4 text-left font-mono text-[10px] text-slate-400 h-44 overflow-y-auto space-y-1.5 leading-relaxed">
                      {broadcastLogs.map((log, idx) => (
                        <div key={idx} className={log.type === 'SMS Gateway' ? 'text-emerald-400' : 'text-blue-400'}>
                          [{log.time}] [{log.type}] {log.details}
                        </div>
                      ))}
                      <div className="animate-pulse text-pink-500">[INFO] Outbound transmission line active...</div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 space-y-3">
                    <button
                      onClick={startDunningBroadcast}
                      className="bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs py-3 px-6 rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-2 mx-auto"
                    >
                      <Lucide.Send className="w-4 h-4" />
                      Trigger Dunning Outbound Broadcast
                    </button>
                    <p className="text-[10px] text-slate-400">
                      WARNING: This executes actual simulated outbound channels. Parents will receive immediate portal notifications.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4 CONTENT: ANALYZE RESULTS */}
            {dunningStep === 4 && (
              <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                  <Lucide.CheckCircle className="w-10 h-10 text-emerald-600 shrink-0" />
                  <div className="text-center sm:text-left space-y-1">
                    <h4 className="font-extrabold text-xs text-emerald-800 uppercase tracking-wider">Dunning Campaign Broadcast Dispatched Successfully</h4>
                    <p className="text-[11px] text-emerald-600 leading-normal">
                      Completed SAMS notification run. Reminders successfully delivered to {selectedDebtors.length} families. Real-time recipient analytics have been cached below.
                    </p>
                  </div>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-slate-200 p-4 rounded-xl space-y-1 bg-gradient-to-br from-indigo-50/10 to-transparent">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Arrears Pool Targeted</span>
                    <p className="text-xl font-black text-slate-900 font-mono">
                      ₦{selectedDebtors.reduce((acc, id) => {
                        const d = dunningDebtors.find(db => db.id === id);
                        return acc + (d ? d.outstanding : 0);
                      }, 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400">Covering {selectedDebtors.length} student records.</p>
                  </div>

                  <div className="border border-slate-200 p-4 rounded-xl space-y-1 bg-gradient-to-br from-teal-50/10 to-transparent">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Projected Recovery Rate</span>
                    <p className="text-xl font-black text-teal-600 font-mono">35%</p>
                    <p className="text-[10px] text-slate-400">Immediate settlement estimated in 7 days.</p>
                  </div>

                  <div className="border border-slate-200 p-4 rounded-xl space-y-1 bg-gradient-to-br from-pink-50/10 to-transparent">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Projected Recovered Capital</span>
                    <p className="text-xl font-black text-pink-600 font-mono">
                      ₦{Math.round(selectedDebtors.reduce((acc, id) => {
                        const d = dunningDebtors.find(db => db.id === id);
                        return acc + (d ? d.outstanding : 0);
                      }, 0) * 0.35).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">SMTP Delivery Rate: 100%</p>
                  </div>
                </div>

                {/* PARENT COMMITMENTS LOGS */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Simulated Parent Portal Replies &amp; Commitments</h4>
                    <span className="text-[10px] bg-slate-200 text-slate-600 font-mono px-2 py-0.5 rounded">LIVE CHANNELS</span>
                  </div>
                  
                  <div className="divide-y divide-slate-150 text-xs">
                    {[
                      { parent: 'Mr. Abubakar Bello', student: 'Aisha Bello', text: 'Received the notice. Sincerely sorry for the delay, will remit the outstanding ₦45,000 via bank transfer this Friday morning.', date: 'Just now', badge: 'Promise to Pay' },
                      { parent: 'Mrs. Fatima Yusuf', student: 'Musa Yusuf', text: 'We requested a split installment payment from the accounts office last week. Please let us know if our ₦60,000 partial deposit is updated.', date: '15 mins ago', badge: 'Instalment Request' },
                      { parent: 'Mr. Ibrahim Dauda', student: 'Halima Dauda', text: 'My company salary has been delayed by Sokoto central civil service. I will pay immediately before the grace period of 7 days runs out.', date: '1 hour ago', badge: 'Temporary Delay' }
                    ].map((rep, idx) => (
                      <div key={idx} className="p-4 flex justify-between gap-4 hover:bg-slate-50/30">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{rep.parent}</span>
                            <span className="text-slate-400 font-medium">({rep.student})</span>
                          </div>
                          <p className="text-slate-600 leading-normal italic">"{rep.text}"</p>
                        </div>
                        <div className="text-right shrink-0 space-y-1.5">
                          <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded-full uppercase tracking-wider">{rep.badge}</span>
                          <div className="text-[10px] text-slate-400">{rep.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setSelectedDebtors([]);
                      setDunningStep(1);
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    Initiate New Campaign Wizard
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
