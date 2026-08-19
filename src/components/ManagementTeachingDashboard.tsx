import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  BookOpen,
  Filter,
  Search,
  School,
  FileCheck,
  Camera,
  ChevronRight,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  History
} from 'lucide-react';
import { 
  TeachingRecord, 
  CurriculumPacingStatus
} from '../data/teachingRecordData';
import { WeeklyMilestone, defaultChecklists } from '../data/curriculumData';

interface ManagementTeachingDashboardProps {
  teachingRecords: TeachingRecord[];
  classes: any[];
  subjects: any[];
  teachers: any[];
  selectedBranch: string;
  currentSimulatedRole?: string;
  academicSessions?: any[];
  terms?: any[];
  curriculumChecklists?: Record<string, WeeklyMilestone[]>;
  onSelectTeacher?: (teacherId: string) => void;
  onNavigateToReviewWorkflow?: () => void;
}

export const ManagementTeachingDashboard: React.FC<ManagementTeachingDashboardProps> = ({
  teachingRecords,
  classes = [],
  subjects = [],
  teachers = [],
  selectedBranch,
  currentSimulatedRole = 'Administrator',
  academicSessions = [],
  terms = [],
  curriculumChecklists = defaultChecklists,
  onSelectTeacher,
  onNavigateToReviewWorkflow
}) => {
  // Filter States
  const [filterBranch, setFilterBranch] = useState<string>(selectedBranch || 'All');
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterTeacher, setFilterTeacher] = useState<string>('All');
  const [filterTerm, setFilterTerm] = useState<string>('First Term');
  const [filterSession, setFilterSession] = useState<string>('2025/2026');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Tab for Drill-downs
  const [activeDrilldown, setActiveDrilldown] = useState<'teachers' | 'subjects' | 'classes' | 'trends'>('teachers');

  // Timeline Tasks for submission timeliness
  const [timelineTasks, setTimelineTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTimelineTasks();
  }, []);

  useEffect(() => {
    if (selectedBranch && selectedBranch !== 'All') {
      setFilterBranch(selectedBranch);
    }
  }, [selectedBranch]);

  const fetchTimelineTasks = async () => {
    try {
      const res = await fetch('/api/event_tasks');
      if (res.ok) {
        const data = await res.json();
        setTimelineTasks(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Section helper
  const inferSection = (className: string): string => {
    const cn = (className || '').toLowerCase();
    if (cn.includes('nursery') || cn.includes('playgroup') || cn.includes('reception') || cn.includes('kg')) return 'Nursery';
    if (cn.includes('primary') || cn.includes('pri') || cn.includes('grade')) return 'Primary';
    if (cn.includes('junior') || cn.includes('jss') || cn.includes('sec') || cn.includes('senior') || cn.includes('sss')) return 'Junior Secondary';
    if (cn.includes('tahfeez') || cn.includes('islam') || cn.includes('hifz') || cn.includes('quran')) return 'Islamia & Tahfeez';
    return 'Primary';
  };

  // Active Teachers list
  const activeTeachers = useMemo(() => {
    if (teachers && teachers.length > 0) return teachers;
    return [
      { id: 'staff-1', name: 'Aisha Garba', branch: 'GN', section: 'Primary', subjects: ['Primary Mathematics'], classesAssigned: ['Primary 5 - Gold'] },
      { id: 'staff-2', name: 'Musa Abdullahi', branch: 'GN', section: 'Junior Secondary', subjects: ['Junior Secondary Science'], classesAssigned: ['Junior Sec 1 - Alpha'] },
      { id: 'staff-3', name: 'Fatima Umar', branch: 'RS', section: 'Nursery', subjects: ['Nursery Literacy'], classesAssigned: ['Nursery 2 - Rose'] },
      { id: 'staff-4', name: 'Aliyu Usman', branch: 'GN', section: 'Primary', subjects: ['Basic English & Grammar'], classesAssigned: ['Primary 4 - Diamond'] },
      { id: 'staff-5', name: 'Zainab Danfulani', branch: 'RS', section: 'Islamia & Tahfeez', subjects: ['Islamic Studies & Arabic'], classesAssigned: ['Primary 3 - Emerald'] },
      { id: 'staff-6', name: 'Ibrahim Kangiwa', branch: 'GN', section: 'Primary', subjects: ['Social Studies & Civics'], classesAssigned: ['Primary 6 - Silver'] }
    ];
  }, [teachers]);

  // Master Filtered Records
  const filteredRecords = useMemo(() => {
    return teachingRecords.filter(r => {
      if (filterBranch !== 'All') {
        const matchBranch = r.branch === filterBranch ||
          (filterBranch === 'GN' && (r.branch === 'Gawun Nama' || r.branch === 'GN')) ||
          (filterBranch === 'RS' && (r.branch === 'Runjin Sambo' || r.branch === 'RS'));
        if (!matchBranch) return false;
      }

      if (filterSection !== 'All') {
        const sec = inferSection(r.classId);
        if (sec !== filterSection) return false;
      }

      if (filterClass !== 'All' && r.classId !== filterClass) return false;
      if (filterSubject !== 'All' && r.subject !== filterSubject && !r.subject.includes(filterSubject)) return false;
      if (filterTeacher !== 'All' && r.teacherId !== filterTeacher && r.teacherName !== filterTeacher) return false;

      return true;
    });
  }, [teachingRecords, filterBranch, filterSection, filterClass, filterSubject, filterTeacher]);

  // 1. Teacher Status: On Schedule vs Behind Schedule
  const teacherPerformanceList = useMemo(() => {
    return activeTeachers.map(teacher => {
      const records = teachingRecords.filter(r => 
        r.teacherId === teacher.id || 
        r.teacherName === teacher.name ||
        (teacher.subjects && teacher.subjects.includes(r.subject))
      );

      const totalExpected = 10;
      const totalLogged = records.length;
      const onTrackRecords = records.filter(r => r.pacingStatus === 'On Track' || r.pacingStatus === 'Ahead of Schedule').length;
      const behindRecords = records.filter(r => r.pacingStatus === 'Behind Schedule').length;
      
      const onSchedule = behindRecords === 0 || (onTrackRecords >= behindRecords);
      const pacingPct = Math.min(100, Math.round((Math.max(onTrackRecords, totalLogged) / 10) * 100));

      const bookCoverages = records.map(r => r.studentBookCoveragePercentage || 80);
      const avgBookCoverage = Math.round(bookCoverages.reduce((a, b) => a + b, 0) / (bookCoverages.length || 1));

      const evidenceCount = records.filter(r => r.supportingEvidence && r.supportingEvidence.length > 0).length;
      const evidencePct = Math.round((evidenceCount / (totalLogged || 1)) * 100);

      const missingCount = Math.max(0, totalExpected - totalLogged);
      const lateCount = records.filter(r => r.submissionStatus === 'Submitted Late').length;

      return {
        ...teacher,
        section: teacher.section || inferSection(teacher.classesAssigned ? teacher.classesAssigned[0] : ''),
        totalLogged,
        totalExpected,
        onSchedule,
        pacingPct,
        avgBookCoverage,
        evidencePct,
        missingCount,
        lateCount,
        records
      };
    }).filter(t => {
      if (filterBranch !== 'All' && t.branch !== filterBranch) return false;
      if (filterSection !== 'All' && t.section !== filterSection) return false;
      if (filterTeacher !== 'All' && t.id !== filterTeacher && t.name !== filterTeacher) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = t.name.toLowerCase().includes(q) || 
          (t.subjects && t.subjects.some(s => s.toLowerCase().includes(q))) ||
          (t.classesAssigned && t.classesAssigned.some(c => c.toLowerCase().includes(q)));
        if (!match) return false;
      }
      return true;
    });
  }, [activeTeachers, teachingRecords, filterBranch, filterSection, filterTeacher, searchQuery]);

  const teachersOnSchedule = useMemo(() => teacherPerformanceList.filter(t => t.onSchedule), [teacherPerformanceList]);
  const teachersBehindSchedule = useMemo(() => teacherPerformanceList.filter(t => !t.onSchedule), [teacherPerformanceList]);

  // 2. High-Level KPI Aggregates
  const kpis = useMemo(() => {
    const totalTeachers = teacherPerformanceList.length;
    const onScheduleCount = teachersOnSchedule.length;
    const behindCount = teachersBehindSchedule.length;
    
    const missingSubmissions = teacherPerformanceList.reduce((acc, t) => acc + t.missingCount, 0);
    const lateSubmissions = teacherPerformanceList.reduce((acc, t) => acc + t.lateCount, 0);

    const avgPacing = Math.round(teacherPerformanceList.reduce((acc, t) => acc + t.pacingPct, 0) / (totalTeachers || 1));
    const avgBookCoverage = Math.round(teacherPerformanceList.reduce((acc, t) => acc + t.avgBookCoverage, 0) / (totalTeachers || 1));
    const avgEvidence = Math.round(teacherPerformanceList.reduce((acc, t) => acc + t.evidencePct, 0) / (totalTeachers || 1));

    return {
      totalTeachers,
      onScheduleCount,
      behindCount,
      missingSubmissions,
      lateSubmissions,
      avgPacing,
      avgBookCoverage,
      avgEvidence
    };
  }, [teacherPerformanceList, teachersOnSchedule, teachersBehindSchedule]);

  // 3. Subjects Behind Schedule Breakdown
  const subjectBreakdown = useMemo(() => {
    const subjectList = [
      { name: 'Primary Mathematics', plannedMilestones: 8, completedMilestones: 6, status: 'Behind Schedule', laggingWeeks: 1.5, classesLagging: ['Primary 5 - Gold', 'Primary 4 - Diamond'], primaryTeacher: 'Aisha Garba' },
      { name: 'Junior Secondary Science', plannedMilestones: 8, completedMilestones: 8, status: 'On Schedule', laggingWeeks: 0, classesLagging: [], primaryTeacher: 'Musa Abdullahi' },
      { name: 'Basic English & Grammar', plannedMilestones: 8, completedMilestones: 7, status: 'Behind Schedule', laggingWeeks: 0.8, classesLagging: ['Primary 4 - Diamond'], primaryTeacher: 'Aliyu Usman' },
      { name: 'Nursery Literacy', plannedMilestones: 8, completedMilestones: 8, status: 'On Schedule', laggingWeeks: 0, classesLagging: [], primaryTeacher: 'Fatima Umar' },
      { name: 'Islamic Studies & Arabic', plannedMilestones: 8, completedMilestones: 8, status: 'On Schedule', laggingWeeks: 0, classesLagging: [], primaryTeacher: 'Zainab Danfulani' },
      { name: 'Social Studies & Civics', plannedMilestones: 8, completedMilestones: 8, status: 'On Schedule', laggingWeeks: 0, classesLagging: [], primaryTeacher: 'Ibrahim Kangiwa' }
    ];

    if (filterSubject !== 'All') {
      return subjectList.filter(s => s.name === filterSubject || s.name.includes(filterSubject));
    }
    return subjectList;
  }, [filterSubject]);

  // 4. Classes Behind Schedule Breakdown
  const classBreakdown = useMemo(() => {
    const list = [
      { className: 'Primary 5 - Gold', section: 'Primary', branch: 'GN', topicsTaught: 18, topicsPlanned: 22, laggingSubjects: ['Primary Mathematics'], avgMarkingCoverage: 82, status: 'Behind Schedule' },
      { className: 'Primary 4 - Diamond', section: 'Primary', branch: 'GN', topicsTaught: 19, topicsPlanned: 22, laggingSubjects: ['Basic English & Grammar'], avgMarkingCoverage: 74, status: 'Behind Schedule' },
      { className: 'Junior Sec 1 - Alpha', section: 'Junior Secondary', branch: 'GN', topicsTaught: 24, topicsPlanned: 24, laggingSubjects: [], avgMarkingCoverage: 91, status: 'On Schedule' },
      { className: 'Nursery 2 - Rose', section: 'Nursery', branch: 'RS', topicsTaught: 16, topicsPlanned: 16, laggingSubjects: [], avgMarkingCoverage: 95, status: 'On Schedule' },
      { className: 'Primary 3 - Emerald', section: 'Primary', branch: 'RS', topicsTaught: 20, topicsPlanned: 20, laggingSubjects: [], avgMarkingCoverage: 88, status: 'On Schedule' }
    ];

    return list.filter(c => {
      if (filterBranch !== 'All' && c.branch !== filterBranch) return false;
      if (filterSection !== 'All' && c.section !== filterSection) return false;
      if (filterClass !== 'All' && c.className !== filterClass) return false;
      return true;
    });
  }, [filterBranch, filterSection, filterClass]);

  // 5. Performance Trends Over Weeks (1 to 8)
  const performanceTrends = [
    { week: 'Week 1', onTimeRate: 95, pacingRate: 98, bookMarking: 88 },
    { week: 'Week 2', onTimeRate: 92, pacingRate: 96, bookMarking: 89 },
    { week: 'Week 3', onTimeRate: 88, pacingRate: 90, bookMarking: 84 },
    { week: 'Week 4', onTimeRate: 85, pacingRate: 88, bookMarking: 82 },
    { week: 'Week 5', onTimeRate: 82, pacingRate: 84, bookMarking: 80 },
    { week: 'Week 6', onTimeRate: 84, pacingRate: 85, bookMarking: 83 },
    { week: 'Week 7', onTimeRate: 86, pacingRate: 87, bookMarking: 85 }
  ];

  return (
    <div id="management-academic-dashboard" className="space-y-6">
      {/* 👔 EXECUTIVE HERO HEADER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300 font-extrabold shadow-inner">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Academic Management Dashboard
                </h2>
                <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-400/30">
                  Institutional Oversight
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Comprehensive supervision across branches, sections, curriculum pacing, student work verification, and compliance trends.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onNavigateToReviewWorkflow && (
              <button
                onClick={onNavigateToReviewWorkflow}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <History className="w-4 h-4" />
                <span>Review &amp; Follow-Up Workflow</span>
              </button>
            )}
          </div>
        </div>

        {/* 📊 6-KPI EXECUTIVE SUMMARY STRIP */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
          <div className="bg-slate-800/50 p-2.5 rounded-2xl border border-slate-700/60">
            <div className="text-[10px] text-emerald-400 font-bold uppercase">On Schedule</div>
            <div className="text-lg font-extrabold text-emerald-300 font-mono">{kpis.onScheduleCount} Teachers</div>
            <div className="text-[9px] text-slate-400">Pacing aligned</div>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-2xl border border-slate-700/60">
            <div className="text-[10px] text-rose-400 font-bold uppercase">Behind Schedule</div>
            <div className="text-lg font-extrabold text-rose-300 font-mono">{kpis.behindCount} Teachers</div>
            <div className="text-[9px] text-slate-400">Target revision required</div>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-2xl border border-slate-700/60">
            <div className="text-[10px] text-amber-400 font-bold uppercase">Missing Submissions</div>
            <div className="text-lg font-extrabold text-amber-300 font-mono">{kpis.missingSubmissions}</div>
            <div className="text-[9px] text-slate-400">Records pending</div>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-2xl border border-slate-700/60">
            <div className="text-[10px] text-orange-400 font-bold uppercase">Late Submissions</div>
            <div className="text-lg font-extrabold text-orange-300 font-mono">{kpis.lateSubmissions}</div>
            <div className="text-[9px] text-slate-400">Past timeline deadline</div>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-2xl border border-slate-700/60">
            <div className="text-[10px] text-blue-400 font-bold uppercase">Book Coverage</div>
            <div className="text-lg font-extrabold text-blue-300 font-mono">{kpis.avgBookCoverage}%</div>
            <div className="text-[9px] text-slate-400">Pupil exercise marked</div>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-2xl border border-slate-700/60">
            <div className="text-[10px] text-purple-400 font-bold uppercase">Evidence Rate</div>
            <div className="text-lg font-extrabold text-purple-300 font-mono">{kpis.avgEvidence}%</div>
            <div className="text-[9px] text-slate-400">Photos attached</div>
          </div>
        </div>
      </div>

      {/* 🔍 COMPREHENSIVE MULTI-SCOPE FILTERS */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
              Multi-Scope Institutional Filters
            </h4>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teacher, subject, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Branch */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Branch
            </label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Branches</option>
              <option value="GN">Gawun Nama (GN)</option>
              <option value="RS">Runjin Sambo (RS)</option>
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Sections</option>
              <option value="Nursery">Nursery</option>
              <option value="Primary">Primary</option>
              <option value="Junior Secondary">Junior Sec</option>
              <option value="Islamia & Tahfeez">Islamia / Tahfeez</option>
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Classes</option>
              <option value="Primary 5 - Gold">Primary 5 - Gold</option>
              <option value="Primary 4 - Diamond">Primary 4 - Diamond</option>
              <option value="Junior Sec 1 - Alpha">Junior Sec 1 - Alpha</option>
              <option value="Nursery 2 - Rose">Nursery 2 - Rose</option>
              <option value="Primary 3 - Emerald">Primary 3 - Emerald</option>
              <option value="Primary 6 - Silver">Primary 6 - Silver</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Subject
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Subjects</option>
              <option value="Primary Mathematics">Mathematics</option>
              <option value="Junior Secondary Science">Basic Science</option>
              <option value="Basic English & Grammar">English Grammar</option>
              <option value="Nursery Literacy">Nursery Literacy</option>
              <option value="Islamic Studies & Arabic">Islamic Studies</option>
              <option value="Social Studies & Civics">Social Studies</option>
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Teacher
            </label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Teachers</option>
              {activeTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Term
            </label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
              <option value="All">All Terms</option>
            </select>
          </div>

          {/* Session */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Session
            </label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="All">All Sessions</option>
            </select>
          </div>
        </div>
      </div>

      {/* 📑 DRILL-DOWN SUBVIEWS TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveDrilldown('teachers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeDrilldown === 'teachers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teachers Roster Pacing ({teacherPerformanceList.length})</span>
        </button>

        <button
          onClick={() => setActiveDrilldown('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeDrilldown === 'subjects'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>Subjects Behind Schedule</span>
        </button>

        <button
          onClick={() => setActiveDrilldown('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeDrilldown === 'classes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <School className="w-4 h-4 text-emerald-500" />
          <span>Classes Behind Schedule</span>
        </button>

        <button
          onClick={() => setActiveDrilldown('trends')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeDrilldown === 'trends'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <span>Weekly Performance Trends</span>
        </button>
      </div>

      {/* =========================================================
          VIEW 1: TEACHERS PACING MATRIX (On Schedule vs Behind)
          ========================================================= */}
      {activeDrilldown === 'teachers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800">
              Teacher Teaching &amp; Pacing Roster
            </h3>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 font-bold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>{teachersOnSchedule.length} On Schedule</span>
              </span>
              <span className="flex items-center space-x-1 font-bold text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>{teachersBehindSchedule.length} Behind Schedule</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Teacher &amp; Assignment</th>
                  <th className="py-3 px-3 text-center">Pacing Status</th>
                  <th className="py-3 px-3 text-center">Syllabus Progress</th>
                  <th className="py-3 px-3 text-center">Student Work Coverage</th>
                  <th className="py-3 px-3 text-center">Evidence Rate</th>
                  <th className="py-3 px-3 text-center">Missing / Late</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {teacherPerformanceList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{t.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {t.subjects?.join(', ')} • {t.classesAssigned?.join(', ')}
                      </div>
                      <div className="text-[10px] text-indigo-700 font-bold">
                        {t.branch} Campus • {t.section}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                        t.onSchedule
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border-rose-300'
                      }`}>
                        {t.onSchedule ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        <span>{t.onSchedule ? 'On Schedule' : 'Behind Schedule'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="font-mono font-bold text-xs text-slate-800">{t.pacingPct}%</div>
                      <div className="w-20 mx-auto bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${t.pacingPct}%` }} />
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="font-mono font-bold text-xs text-emerald-800">{t.avgBookCoverage}%</div>
                      <div className="text-[10px] text-slate-400">Notebooks verified</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="font-mono font-bold text-xs text-blue-800">{t.evidencePct}%</div>
                      <div className="text-[10px] text-slate-400">Photos attached</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="space-y-0.5">
                        {t.missingCount > 0 ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {t.missingCount} Missing
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-bold">0 Missing</span>
                        )}
                        {t.lateCount > 0 && (
                          <div className="text-[10px] font-bold text-amber-700">{t.lateCount} Late</div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {onNavigateToReviewWorkflow && (
                        <button
                          onClick={onNavigateToReviewWorkflow}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 2: SUBJECTS BEHIND SCHEDULE
          ========================================================= */}
      {activeDrilldown === 'subjects' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-800">
              Subject Pacing &amp; Syllabus Coverage Analysis
            </h3>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
              {subjectBreakdown.filter(s => s.status === 'Behind Schedule').length} Subjects Lagging
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectBreakdown.map((subj, idx) => {
              const isBehind = subj.status === 'Behind Schedule';
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isBehind
                      ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{subj.name}</h4>
                      <div className="text-xs text-slate-500 font-medium">Lead Teacher: {subj.primaryTeacher}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                      isBehind
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}>
                      {subj.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase">Planned</div>
                      <div className="font-bold text-slate-800">{subj.plannedMilestones} Wks</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase">Completed</div>
                      <div className="font-bold text-slate-800">{subj.completedMilestones} Wks</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase">Lag Index</div>
                      <div className={`font-bold font-mono ${isBehind ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {subj.laggingWeeks > 0 ? `-${subj.laggingWeeks} Wk` : 'On Track'}
                      </div>
                    </div>
                  </div>

                  {subj.classesLagging.length > 0 && (
                    <div className="mt-2 text-[11px] text-rose-900 bg-rose-100/60 p-2 rounded-xl">
                      <strong>Lagging Classes:</strong> {subj.classesLagging.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 3: CLASSES BEHIND SCHEDULE
          ========================================================= */}
      {activeDrilldown === 'classes' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-800">
              Class Pacing &amp; Exercise Book Marking Breakdown
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {classBreakdown.length} Classes Monitored
            </span>
          </div>

          <div className="space-y-3">
            {classBreakdown.map((cls, idx) => {
              const isBehind = cls.status === 'Behind Schedule';
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isBehind
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{cls.className}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {cls.branch} Campus • {cls.section}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Topics Taught: <strong>{cls.topicsTaught} / {cls.topicsPlanned}</strong> • Student Book Marking: <strong>{cls.avgMarkingCoverage}%</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {cls.laggingSubjects.length > 0 && (
                      <div className="text-xs text-rose-800 font-bold bg-rose-100 px-2.5 py-1 rounded-xl">
                        Behind in: {cls.laggingSubjects.join(', ')}
                      </div>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                      isBehind
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}>
                      {cls.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 4: WEEKLY PERFORMANCE TRENDS
          ========================================================= */}
      {activeDrilldown === 'trends' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-800">
              Institutional Performance &amp; Compliance Velocity
            </h3>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
              Weeks 1 to 7 Overview
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trend Metric 1 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase">On-Time Submission Rate</div>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono">86%</div>
              <p className="text-[11px] text-slate-500">
                Weekly teacher log submission punctuality before Friday 5:00 PM cutoff.
              </p>
            </div>

            {/* Trend Metric 2 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase">Curriculum Pacing Alignment</div>
              <div className="text-2xl font-extrabold text-blue-700 font-mono">87%</div>
              <p className="text-[11px] text-slate-500">
                Proportion of syllabus weekly milestones delivered on or ahead of time.
              </p>
            </div>

            {/* Trend Metric 3 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase">Student Book Marking</div>
              <div className="text-2xl font-extrabold text-purple-700 font-mono">85%</div>
              <p className="text-[11px] text-slate-500">
                Proportion of student notebooks marked, stamped, and signed by subject teachers.
              </p>
            </div>
          </div>

          {/* Weekly Tabular Trend Strip */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-extrabold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Term Week</th>
                  <th className="py-2.5 px-3 text-center">Submission Punctuality</th>
                  <th className="py-2.5 px-3 text-center">Pacing Alignment</th>
                  <th className="py-2.5 px-3 text-center">Student Work Marking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {performanceTrends.map((tr, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800">{tr.week}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">{tr.onTimeRate}%</td>
                    <td className="py-2.5 px-3 text-center text-blue-700 font-bold">{tr.pacingRate}%</td>
                    <td className="py-2.5 px-3 text-center text-purple-700 font-bold">{tr.bookMarking}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
