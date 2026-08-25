import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  FileCheck,
  ChevronRight
} from 'lucide-react';

export interface PrincipalDashboardData {
  studentPopulation: number;
  attendanceRate: number;
  averageAcademicScore: number;
  teacherAttendanceRate: number;
  teacherTasksPending: number;
  curriculumProgressPct: number;
  upcomingDeadlines: { id: string; title: string; dueDate: string; priority: string }[];
  feeCollectionTotal: number;
  feeOutstandingTotal: number;
  todayEvents: { id: string; title: string; location?: string; time?: string }[];
}

interface PrincipalDashboardProps {
  data: PrincipalDashboardData | null;
  loading: boolean;
  branchName: string;
  onNavigateTab: (tab: string, submenu?: string) => void;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({
  data,
  loading,
  branchName,
  onNavigateTab
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
    studentPopulation: 0,
    attendanceRate: 0,
    averageAcademicScore: 0,
    teacherAttendanceRate: 0,
    teacherTasksPending: 0,
    curriculumProgressPct: 0,
    upcomingDeadlines: [],
    feeCollectionTotal: 0,
    feeOutstandingTotal: 0,
    todayEvents: []
  };

  return (
    <div className="space-y-6">
      {/* Principal Academic Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campus Enrollment</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{d.studentPopulation}</p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{branchName}</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pupil Attendance</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {d.attendanceRate > 0 ? `${d.attendanceRate}%` : 'N/A'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Daily Register Status</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Curriculum Pacing</p>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {d.curriculumProgressPct > 0 ? `${d.curriculumProgressPct}%` : 'In Progress'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Term Scheme Coverage</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Teacher Tasks</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{d.teacherTasksPending}</p>
            <p className="text-[11px] text-slate-500 font-medium">Lesson Notes & CA Entries</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Academic Quality & Teacher Supervisory Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Academic Supervisory Metrics</h3>
              <p className="text-xs text-slate-500">Curriculum compliance, lesson note submissions and student progress</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('academics', 'academics_curriculum')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Curriculum Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Teacher Attendance Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {d.teacherAttendanceRate > 0 ? `${d.teacherAttendanceRate}%` : 'Active'}
              </p>
              <p className="text-[10.5px] text-slate-400">Recorded faculty presence at morning assembly</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Overall Academic Benchmark</span>
                <Award className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {d.averageAcademicScore > 0 ? `${d.averageAcademicScore}%` : 'Scores Pending'}
              </p>
              <p className="text-[10.5px] text-slate-400">Class continuous assessment averages</p>
            </div>
          </div>

          {/* Quick Academic Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('academics', 'academics_teaching_records')}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Verify Teaching Records
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('attendance', 'attendance_student')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Review Daily Register
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('results', 'results_ca')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Continuous Assessment (CA) Desk
            </button>
          </div>
        </div>

        {/* Branch Financial & Operations Brief */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Campus Fee Standing</h3>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div>
              <p className="text-xs text-slate-500">Collected Campus Fees</p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatNaira(d.feeCollectionTotal)}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
              <p className="text-xs text-slate-500">Outstanding Balances</p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {formatNaira(d.feeOutstandingTotal)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Deadlines</h4>
            {d.upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No pending deadlines logged.</p>
            ) : (
              d.upcomingDeadlines.slice(0, 2).map(dl => (
                <div key={dl.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{dl.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{dl.dueDate}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
