import React from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

export interface ExecutiveDashboardData {
  totalStudents: number;
  studentsBySection: { sectionName: string; count: number }[];
  studentsByBranch: { branchCode: string; branchName: string; count: number }[];
  expectedFees: number;
  feesCollected: number;
  outstandingFees: number;
  collectionPercentage: number;
  totalExpenses: number;
  netPosition: number;
  totalStaff: number;
  teachingStaff: number;
  nonTeachingStaff: number;
  averagePerformance: number;
  averageAttendance: number;
  pendingResultsCount: number;
  todayEvents: { id: string; title: string; time?: string; location?: string }[];
  upcomingDeadlines: { id: string; title: string; dueDate: string; priority: string }[];
  totalStockValue: number;
  lowStockItemCount: number;
  pendingBookOrders: number;
}

interface ExecutiveDashboardProps {
  data: ExecutiveDashboardData | null;
  loading: boolean;
  selectedBranch: string;
  onNavigateTab: (tab: string, submenu?: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  data,
  loading,
  selectedBranch,
  onNavigateTab
}) => {
  const formatNaira = (val?: number) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl lg:col-span-2 border border-slate-200/50" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50" />
        </div>
      </div>
    );
  }

  const d = data || {
    totalStudents: 0,
    studentsBySection: [],
    studentsByBranch: [],
    expectedFees: 0,
    feesCollected: 0,
    outstandingFees: 0,
    collectionPercentage: 0,
    totalExpenses: 0,
    netPosition: 0,
    totalStaff: 0,
    teachingStaff: 0,
    nonTeachingStaff: 0,
    averagePerformance: 0,
    averageAttendance: 0,
    pendingResultsCount: 0,
    todayEvents: [],
    upcomingDeadlines: [],
    totalStockValue: 0,
    lowStockItemCount: 0,
    pendingBookOrders: 0
  };

  return (
    <div className="space-y-6">
      {/* Executive Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Students */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Enrollment</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{d.totalStudents}</p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
              <span>{selectedBranch === 'All' ? 'Across All Campuses' : `${selectedBranch} Campus`}</span>
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Fees Collected */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fees Collected</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatNaira(d.feesCollected)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Collection: <span className="font-bold text-slate-800 dark:text-slate-200">{d.collectionPercentage.toFixed(1)}%</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Fees</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {formatNaira(d.outstandingFees)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Expected: <span className="font-bold">{formatNaira(d.expectedFees)}</span>
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Net Fiscal Position */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Operating Surplus</p>
            <p className={`text-2xl font-extrabold ${d.netPosition >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatNaira(d.netPosition)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Expenses: <span className="font-bold text-rose-600 dark:text-rose-400">{formatNaira(d.totalExpenses)}</span>
            </p>
          </div>
          <div className={`p-3 rounded-xl ${d.netPosition >= 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'bg-rose-50 text-rose-600'}`}>
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Students Breakdown & Staff Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Section & Campus Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Academic Distribution & Capacity</h3>
              <p className="text-xs text-slate-500">Live student enrollment broken down by academic sections</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('students', 'students_directory')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {d.studentsBySection.length === 0 ? (
              <div className="col-span-3 py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No active section enrollments logged for the current term.
              </div>
            ) : (
              d.studentsBySection.map(sec => (
                <div key={sec.sectionName} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {sec.sectionName}
                    </span>
                    <Layers className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{sec.count}</p>
                  <p className="text-[10px] text-slate-400">Enrolled Pupils</p>
                </div>
              ))
            )}
          </div>

          {/* Campus Breakdown if All Branches selected */}
          {selectedBranch === 'All' && d.studentsByBranch.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Campus Distribution</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {d.studentsByBranch.map(b => (
                  <div key={b.branchCode} className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/30 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">{b.branchName}</p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">Campus Code: {b.branchCode}</p>
                    </div>
                    <span className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300">
                      {b.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Staff & Faculty Strength */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Human Resources</h3>
            <Briefcase className="w-5 h-5 text-slate-400" />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Staff Strength</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{d.totalStaff}</p>
            </div>
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/40 text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">Teaching Faculty</span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{d.teachingStaff}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/40 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-200">Non-Teaching & Admin</span>
              <span className="font-extrabold text-blue-700 dark:text-blue-400">{d.nonTeachingStaff}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('teachers', 'staff_directory')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
            >
              Open Staff Management
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Inventory & Operations / Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Summary */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Store & Logistics Status</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('inventory', 'inventory_levels')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Store Hub
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10.5px] font-bold text-slate-400 uppercase">Total Valuation</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">{formatNaira(d.totalStockValue)}</p>
            </div>

            <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <p className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 uppercase">Low Stock SKUs</p>
              <p className="text-lg font-extrabold text-amber-800 dark:text-amber-300 mt-1">{d.lowStockItemCount}</p>
            </div>

            <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-[10.5px] font-bold text-blue-700 dark:text-blue-400 uppercase">Pending Orders</p>
              <p className="text-lg font-extrabold text-blue-800 dark:text-blue-300 mt-1">{d.pendingBookOrders}</p>
            </div>
          </div>
        </div>

        {/* Academic Milestones & Deadlines */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Upcoming Academic Deadlines</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('operations', 'ops_calendar')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Full Calendar
            </button>
          </div>

          <div className="space-y-2.5">
            {d.upcomingDeadlines.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No urgent academic deadlines scheduled for this week.
              </div>
            ) : (
              d.upcomingDeadlines.slice(0, 3).map(dl => (
                <div key={dl.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <Clock className={`w-4 h-4 ${dl.priority === 'High' ? 'text-rose-500' : 'text-indigo-500'}`} />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{dl.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                    {dl.dueDate}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
