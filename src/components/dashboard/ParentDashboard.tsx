import React from 'react';
import {
  Users,
  DollarSign,
  Receipt,
  GraduationCap,
  Calendar,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

export interface ParentDashboardData {
  familyAccountName: string;
  totalChildrenCount: number;
  children: {
    id: string;
    name: string;
    admissionNumber: string;
    className: string;
    campus: string;
    attendancePercentage: number;
    hasReportCardReady: boolean;
    photoUrl?: string;
  }[];
  currentTermFees: number;
  previousTermArrears: number;
  totalOutstandingFees: number;
  recentPayments: {
    id: string;
    receiptNumber: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    status: string;
  }[];
  announcements: {
    id: string;
    title: string;
    publishedDate: string;
    body: string;
  }[];
  upcomingSchoolEvents: {
    id: string;
    title: string;
    eventDate: string;
    location?: string;
  }[];
}

interface ParentDashboardProps {
  data: ParentDashboardData | null;
  loading: boolean;
  onNavigateTab: (tab: string, submenu?: string) => void;
  onViewReportCard?: (studentId: string) => void;
  onDownloadReceipt?: (receiptId: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  data,
  loading,
  onNavigateTab,
  onViewReportCard,
  onDownloadReceipt
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
    familyAccountName: 'Family Account',
    totalChildrenCount: 0,
    children: [],
    currentTermFees: 0,
    previousTermArrears: 0,
    totalOutstandingFees: 0,
    recentPayments: [],
    announcements: [],
    upcomingSchoolEvents: []
  };

  return (
    <div className="space-y-6">
      {/* Parent Welcome Greeting Banner */}
      <div className="bg-indigo-950 text-white p-6 rounded-2xl shadow-sm space-y-2 border border-indigo-900">
        <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Users className="w-4 h-4" />
          <span>SAMS Parent & Family Portal</span>
        </div>
        <h2 className="text-xl font-bold">{d.familyAccountName}</h2>
        <p className="text-xs text-indigo-200">
          Viewing live academic progress, term statement of accounts, attendance logs, and school notices.
        </p>
      </div>

      {/* Family Financial Standing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enrolled Children */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled Children</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{d.totalChildrenCount}</p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">Active Pupils</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Current Term Invoiced Fees */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Term Fees</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatNaira(d.currentTermFees)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Tuition & Facilities</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Previous Arrears */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prior Term Arrears</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {formatNaira(d.previousTermArrears)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Carried Forward Balance</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Outstanding Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</p>
            <p className={`text-2xl font-extrabold ${d.totalOutstandingFees > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatNaira(d.totalOutstandingFees)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {d.totalOutstandingFees === 0 ? 'Account Fully Settled' : 'Payment Due'}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${d.totalOutstandingFees > 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Children Academic Cards Grid */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Children Profiles & Reports</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {d.children.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No registered students currently linked to this parent account.
            </div>
          ) : (
            d.children.map(child => (
              <div
                key={child.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-base">
                      {child.photoUrl ? (
                        <img src={child.photoUrl} alt={child.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        child.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{child.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">Adm No: {child.admissionNumber}</p>
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        Class: {child.className} ({child.campus})
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
                    Attendance: {child.attendancePercentage}%
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {child.hasReportCardReady ? 'Term Report Card Available' : 'Grades Compilation in Progress'}
                  </span>

                  {child.hasReportCardReady && (
                    <button
                      type="button"
                      onClick={() => onViewReportCard?.(child.id)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Report Card</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Grid: Payment History & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payment Receipts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent Payment Receipts</h3>
            <Receipt className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-2">
            {d.recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No payment receipts logged yet.</p>
            ) : (
              d.recentPayments.map(pay => (
                <div
                  key={pay.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{pay.receiptNumber}</p>
                    <p className="text-[10.5px] text-slate-400">{pay.paymentDate} via {pay.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatNaira(pay.amount)}</p>
                    <button
                      type="button"
                      onClick={() => onDownloadReceipt?.(pay.id)}
                      className="text-[10.5px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 justify-end"
                    >
                      <Download className="w-3 h-3" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* School Announcements */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">School Announcements</h3>
            <Bell className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-3">
            {d.announcements.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No official announcements currently posted.</p>
            ) : (
              d.announcements.map(ann => (
                <div
                  key={ann.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{ann.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{ann.publishedDate}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{ann.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
