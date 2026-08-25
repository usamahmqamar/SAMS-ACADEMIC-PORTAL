import React from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  UploadCloud,
  FileCheck,
  GraduationCap,
  PlusCircle,
  Camera,
  Layers,
  ChevronRight
} from 'lucide-react';

export interface TeacherDashboardData {
  assignedClassesCount: number;
  todayClasses: {
    id: string;
    period: string;
    subject: string;
    className: string;
    time: string;
    status: 'Upcoming' | 'In Progress' | 'Completed';
  }[];
  pendingLessonRecordsCount: number;
  pendingEvidenceCount: number;
  curriculumProgressPct: number;
  pendingResultSubmissionsCount: number;
  dailyAttendanceMarked: boolean;
  upcomingDeadlines: { id: string; title: string; dueDate: string }[];
}

interface TeacherDashboardProps {
  data: TeacherDashboardData | null;
  loading: boolean;
  teacherName: string;
  onNavigateTab: (tab: string, submenu?: string) => void;
  onRecordLesson: () => void;
  onUploadEvidence: () => void;
  onMarkAttendance: () => void;
  onEnterResults: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  data,
  loading,
  teacherName,
  onNavigateTab,
  onRecordLesson,
  onUploadEvidence,
  onMarkAttendance,
  onEnterResults
}) => {
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
    assignedClassesCount: 0,
    todayClasses: [],
    pendingLessonRecordsCount: 0,
    pendingEvidenceCount: 0,
    curriculumProgressPct: 0,
    pendingResultSubmissionsCount: 0,
    dailyAttendanceMarked: false,
    upcomingDeadlines: []
  };

  return (
    <div className="space-y-6">
      {/* Teacher Action Banner */}
      <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-800 rounded-xl">
            <GraduationCap className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Faculty Academic Portal</h3>
            <p className="text-[11px] text-emerald-200">
              Assigned Instructor: <span className="font-semibold text-white">{teacherName}</span>
            </p>
          </div>
        </div>

        {/* Quick Academic Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRecordLesson}
            className="flex items-center gap-1.5 bg-white text-emerald-900 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>Record Lesson</span>
          </button>

          <button
            type="button"
            onClick={onUploadEvidence}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Upload Evidence</span>
          </button>

          <button
            type="button"
            onClick={onMarkAttendance}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>

          <button
            type="button"
            onClick={onEnterResults}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Enter Results</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Teaching Periods */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Class Periods</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{d.todayClasses.length}</p>
            <p className="text-[11px] text-slate-500 font-medium">Scheduled Timetable Slots</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Lesson Records */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Lesson Notes</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{d.pendingLessonRecordsCount}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Awaiting Submission</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Board & Notebook Evidence */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Board/Book Evidence</p>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{d.pendingEvidenceCount}</p>
            <p className="text-[11px] text-slate-500 font-medium">Artifacts to Upload</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <UploadCloud className="w-6 h-6" />
          </div>
        </div>

        {/* Scheme & Curriculum Coverage */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheme of Work Pacing</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {d.curriculumProgressPct > 0 ? `${d.curriculumProgressPct}%` : 'On Track'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Term Milestone Progress</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Timetable & Lesson Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Today's Class Schedule</h3>
              <p className="text-xs text-slate-500">Live lecture allocations and subject timetable</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('academics', 'academics_timetable')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Weekly Timetable</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {d.todayClasses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No active timetable periods assigned for your profile today.
              </div>
            ) : (
              d.todayClasses.map(cls => (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {cls.period}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{cls.subject}</p>
                      <p className="text-[10.5px] text-slate-400">Class: {cls.className} | Time: {cls.time}</p>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                    {cls.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deadlines & Result Entry Desk */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Academic Deadlines</h3>

          <div className="space-y-2">
            {d.upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No pending CA or exam score deadlines.</p>
            ) : (
              d.upcomingDeadlines.map(dl => (
                <div key={dl.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{dl.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{dl.dueDate}</span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('academics', 'academics_teaching_records')}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
            >
              My Teaching Logs & Lesson History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
