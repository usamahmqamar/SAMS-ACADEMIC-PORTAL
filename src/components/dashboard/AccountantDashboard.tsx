import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  UserCheck,
  PlusCircle,
  FileSpreadsheet,
  Users,
  ChevronRight
} from 'lucide-react';

export interface AccountantDashboardData {
  expectedRevenue: number;
  amountCollected: number;
  outstandingFees: number;
  todayPaymentsTotal: number;
  todayPaymentsCount: number;
  currentTermCollection: number;
  previousTermArrears: number;
  expenseSummaryTotal: number;
  cashierSessionStatus: 'Open' | 'Closed' | 'Reconciled' | 'None';
  cashierSessionCode?: string;
  recentReceipts: {
    id: string;
    receiptNumber: string;
    payerName: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
  }[];
}

interface AccountantDashboardProps {
  data: AccountantDashboardData | null;
  loading: boolean;
  branchName: string;
  onNavigateTab: (tab: string, submenu?: string) => void;
  onOpenReceivePayment: () => void;
  onOpenIssueReceipt: () => void;
  onOpenFamilyBilling: () => void;
  onOpenOutstandingReport: () => void;
}

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({
  data,
  loading,
  branchName,
  onNavigateTab,
  onOpenReceivePayment,
  onOpenIssueReceipt,
  onOpenFamilyBilling,
  onOpenOutstandingReport
}) => {
  const formatNaira = (val?: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(Number(val || 0));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50" />
          ))}
        </div>
      </div>
    );
  }

  const d = data || {
    expectedRevenue: 0,
    amountCollected: 0,
    outstandingFees: 0,
    todayPaymentsTotal: 0,
    todayPaymentsCount: 0,
    currentTermCollection: 0,
    previousTermArrears: 0,
    expenseSummaryTotal: 0,
    cashierSessionStatus: 'None',
    recentReceipts: []
  };

  return (
    <div className="space-y-6">
      {/* Quick Financial Action Toolbar */}
      <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-800 rounded-xl">
            <DollarSign className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Accountant Treasury Desk</h3>
            <p className="text-[11px] text-indigo-200">
              Campus: <span className="font-semibold text-white">{branchName}</span> | Cashier Session:{' '}
              <span className="font-mono bg-indigo-800/80 px-1.5 py-0.2 rounded text-[10px]">
                {d.cashierSessionStatus === 'Open' ? `ACTIVE (${d.cashierSessionCode || 'SES-01'})` : d.cashierSessionStatus}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenReceivePayment}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Receive Payment</span>
          </button>

          <button
            type="button"
            onClick={onOpenIssueReceipt}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Issue Receipt</span>
          </button>

          <button
            type="button"
            onClick={onOpenFamilyBilling}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Family Accounts</span>
          </button>

          <button
            type="button"
            onClick={onOpenOutstandingReport}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Outstanding Fees</span>
          </button>
        </div>
      </div>

      {/* Financial Core Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fees Collected</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatNaira(d.amountCollected)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Current Academic Term</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Expected Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expected Revenue</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatNaira(d.expectedRevenue)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Billed Tuition & Levies</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {formatNaira(d.outstandingFees)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Prior Arrears: <span className="font-bold">{formatNaira(d.previousTermArrears)}</span>
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Inflow */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Collections</p>
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {formatNaira(d.todayPaymentsTotal)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Transactions: <span className="font-bold text-slate-800 dark:text-slate-200">{d.todayPaymentsCount} receipts</span>
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Recent Receipts & Expense Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payment Receipts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent Payment Receipts</h3>
              <p className="text-xs text-slate-500">Live transaction stream logged in SAMS Ledger</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('financial_settings', 'financial_payments')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Register</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Payer / Family</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {d.recentReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No payment receipts logged yet for this billing cycle.
                    </td>
                  </tr>
                ) : (
                  d.recentReceipts.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {rec.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {rec.payerName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                          {rec.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">
                        {rec.paymentDate}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatNaira(rec.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Summary & Reconciliation */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Treasury Reconciliation</h3>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Total Term Expenses:</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">
                {formatNaira(d.expenseSummaryTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700">
              <span className="text-slate-500">Net Operating Position:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {formatNaira(d.amountCollected - d.expenseSummaryTotal)}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('financial_settings', 'financial_expenses')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
            >
              Open Expense Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
