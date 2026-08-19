import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Search,
  Layers,
  User,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText,
  Camera,
  Eye,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  Info,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { 
  TeachingRecord, 
  CurriculumPacingStatus, 
  CurriculumComparisonItem 
} from '../data/teachingRecordData';
import { WeeklyMilestone, defaultChecklists } from '../data/curriculumData';

interface CurriculumComparisonViewProps {
  teachingRecords: TeachingRecord[];
  classes: any[];
  subjects: any[];
  teachers: any[];
  selectedBranch: string;
  curriculumChecklists?: Record<string, WeeklyMilestone[]>;
  onSelectRecord?: (record: TeachingRecord) => void;
  onCreateRecordForMilestone?: (milestone: WeeklyMilestone, subjectName: string, classId: string) => void;
}

export const CurriculumComparisonView: React.FC<CurriculumComparisonViewProps> = ({
  teachingRecords,
  classes,
  subjects,
  teachers,
  selectedBranch,
  curriculumChecklists = defaultChecklists,
  onSelectRecord,
  onCreateRecordForMilestone
}) => {
  // Branch classes
  const branchClasses = useMemo(() => {
    if (!selectedBranch || selectedBranch === 'All') return classes;
    return classes.filter(c => c.branch === selectedBranch || !c.branch);
  }, [classes, selectedBranch]);

  // Primary filters
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return branchClasses[0]?.name || branchClasses[0]?.id || 'Primary 5 - Gold';
  });

  const selectedClass = useMemo(() => {
    return branchClasses.find(c => c.name === selectedClassId || c.id === selectedClassId) || branchClasses[0] || null;
  }, [branchClasses, selectedClassId]);

  // Filter subjects based on class level
  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return subjects;
    const classLevel = selectedClass.level || (selectedClass.name?.toLowerCase().includes('primary') ? 'primary' : 'secondary');
    return subjects.filter(sub => sub.level === classLevel || !sub.level);
  }, [selectedClass, subjects]);

  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(() => {
    return filteredSubjects[0]?.name || 'Primary Mathematics';
  });

  const [selectedTerm, setSelectedTerm] = useState<string>('First Term');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | CurriculumPacingStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected comparison item for side-by-side audit modal
  const [activeModalItem, setActiveModalItem] = useState<CurriculumComparisonItem | null>(null);

  // Retrieve Scheme of Work milestones for this subject & class
  const schemeMilestones: WeeklyMilestone[] = useMemo(() => {
    // 1. Try class-subject key
    const classSubjectKey = `${selectedClassId}-${selectedSubjectName}`;
    if (curriculumChecklists[classSubjectKey]) {
      return curriculumChecklists[classSubjectKey];
    }
    // 2. Try subject key
    if (curriculumChecklists[selectedSubjectName]) {
      return curriculumChecklists[selectedSubjectName];
    }
    // 3. Fallback to defaultChecklists
    if (defaultChecklists[selectedSubjectName]) {
      return defaultChecklists[selectedSubjectName];
    }
    // 4. Generate default 10-week milestones for unknown subjects
    return Array.from({ length: 10 }, (_, i) => ({
      week: i + 1,
      topic: `${selectedSubjectName} - Unit ${i + 1} Principles`,
      objectives: `Master foundational unit concepts and practical textbook exercises for Week ${i + 1}.`,
      status: i < 4 ? 'Completed' : i === 4 ? 'In Progress' : 'Not Started'
    }));
  }, [curriculumChecklists, selectedClassId, selectedSubjectName]);

  // Current simulated term week for pacing comparisons (default Week 6)
  const currentAcademicWeek = 6;

  // Build the side-by-side comparison list
  const comparisonItems: CurriculumComparisonItem[] = useMemo(() => {
    return schemeMilestones.map(milestone => {
      // Find matching teaching records for this subject, class, and term
      const matchingRecords = teachingRecords.filter(r => {
        // Match subject
        const subjectMatch = r.subject.toLowerCase() === selectedSubjectName.toLowerCase();
        if (!subjectMatch) return false;

        // Match branch if filtered
        if (selectedBranch && selectedBranch !== 'All') {
          const bMatch = r.branch === selectedBranch || 
            (selectedBranch === 'GN' && (r.branch === 'Gawun Nama' || r.branch === 'GN')) ||
            (selectedBranch === 'RS' && (r.branch === 'Runjin Sambo' || r.branch === 'RS'));
          if (!bMatch) return false;
        }

        // Match term if filtered
        if (selectedTerm && r.term && r.term !== selectedTerm) return false;

        // Match class if filtered
        if (selectedClassId && selectedClassId !== 'All') {
          const cMatch = r.classId === selectedClassId || (selectedClass && r.classId === selectedClass.name);
          if (!cMatch) return false;
        }

        // Match teacher if filtered
        if (selectedTeacherId !== 'All' && r.teacherId !== selectedTeacherId) {
          return false;
        }

        // Match milestone by explicit link or week or topic title
        const explicitMatch = r.schemeMilestoneWeek === milestone.week;
        const weekMatch = r.week === milestone.week;
        const topicMatch = r.topic.toLowerCase().includes(milestone.topic.toLowerCase()) ||
          milestone.topic.toLowerCase().includes(r.topic.toLowerCase());

        return explicitMatch || (weekMatch && (explicitMatch || topicMatch || r.week === milestone.week));
      });

      // Pick the best primary record
      const primaryRecord = matchingRecords[0];

      // Determine Pacing Status
      let status: CurriculumPacingStatus = 'Not Started';
      let statusReason = '';

      if (!primaryRecord) {
        if (milestone.week < currentAcademicWeek) {
          status = 'Behind Schedule';
          statusReason = `Topic was scheduled for Week ${milestone.week}, but no teaching record has been filed yet.`;
        } else {
          status = 'Not Started';
          statusReason = `Scheduled for Week ${milestone.week}.`;
        }
      } else {
        const taughtWeek = primaryRecord.week;
        const plannedWeek = primaryRecord.schemeMilestoneWeek || milestone.week;

        if (taughtWeek < plannedWeek) {
          status = 'Ahead';
          statusReason = `Planned for Week ${plannedWeek}, recorded as taught early in Week ${taughtWeek} (${plannedWeek - taughtWeek} week(s) ahead).`;
        } else if (taughtWeek > plannedWeek) {
          status = 'Behind Schedule';
          statusReason = `Planned for Week ${plannedWeek}, recorded as taught in Week ${taughtWeek} (${taughtWeek - plannedWeek} week(s) behind schedule).`;
        } else {
          // Same week
          if (primaryRecord.status === 'Draft' || primaryRecord.status === 'Correction Required' || !primaryRecord.studentNotebookWork?.trim()) {
            status = 'Partially Completed';
            statusReason = `Taught in Week ${taughtWeek}, but record is currently in "${primaryRecord.status}" status or student notebook work is incomplete.`;
          } else if (primaryRecord.status === 'Reviewed') {
            status = 'Completed';
            statusReason = `Taught on schedule in Week ${taughtWeek}. Student book work verified and reviewed by supervisor.`;
          } else {
            status = 'On Schedule';
            statusReason = `Taught on schedule in Week ${taughtWeek}. Teaching record and student work submitted.`;
          }
        }
      }

      // Extract notebook evidence
      const notebookEvidence = primaryRecord?.evidence?.find(e => e.type === 'notebook' || e.type === 'classwork');

      return {
        week: milestone.week,
        plannedTopic: milestone.topic,
        plannedObjectives: milestone.objectives,
        actualRecord: primaryRecord,
        taughtTopic: primaryRecord?.topic,
        taughtDate: primaryRecord?.date,
        taughtWeek: primaryRecord?.week,
        whatWasTaught: primaryRecord?.whatWasTaught,
        studentNotebookWork: primaryRecord?.studentNotebookWork,
        pagesCovered: primaryRecord?.pagesCovered,
        classwork: primaryRecord?.classwork,
        homework: primaryRecord?.homework,
        hasNotebookEvidence: Boolean(notebookEvidence),
        notebookEvidenceUrl: notebookEvidence?.url,
        totalStudentsInClass: primaryRecord?.totalStudentsInClass || 30,
        completedWorkCount: primaryRecord?.completedWorkCount || (primaryRecord ? 27 : 0),
        workCoveragePercentage: primaryRecord?.workCoveragePercentage || (primaryRecord ? 90 : 0),
        flaggedStudentsCount: primaryRecord?.flaggedStudents?.length || 0,
        status,
        statusReason,
        classId: selectedClassId,
        subject: selectedSubjectName,
        term: selectedTerm,
        branch: selectedBranch,
        teacherName: primaryRecord?.teacherName || (teachers[0]?.name || 'Assigned Teacher')
      };
    });
  }, [
    schemeMilestones, 
    teachingRecords, 
    selectedSubjectName, 
    selectedBranch, 
    selectedTerm, 
    selectedClassId, 
    selectedClass, 
    selectedTeacherId,
    currentAcademicWeek,
    teachers
  ]);

  // Filter items by status and search query
  const filteredComparisonItems = useMemo(() => {
    return comparisonItems.filter(item => {
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          item.plannedTopic.toLowerCase().includes(q) ||
          (item.taughtTopic && item.taughtTopic.toLowerCase().includes(q)) ||
          (item.whatWasTaught && item.whatWasTaught.toLowerCase().includes(q)) ||
          (item.studentNotebookWork && item.studentNotebookWork.toLowerCase().includes(q)) ||
          item.status.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [comparisonItems, statusFilter, searchQuery]);

  // Aggregate statistics for this curriculum selection
  const stats = useMemo(() => {
    const total = comparisonItems.length;
    const onSchedule = comparisonItems.filter(i => i.status === 'On Schedule').length;
    const ahead = comparisonItems.filter(i => i.status === 'Ahead').length;
    const behind = comparisonItems.filter(i => i.status === 'Behind Schedule').length;
    const partial = comparisonItems.filter(i => i.status === 'Partially Completed').length;
    const completed = comparisonItems.filter(i => i.status === 'Completed').length;
    const notStarted = comparisonItems.filter(i => i.status === 'Not Started').length;

    const coveredPct = total > 0 ? Math.round(((completed + onSchedule + ahead + partial * 0.5) / total) * 100) : 0;

    return { total, onSchedule, ahead, behind, partial, completed, notStarted, coveredPct };
  }, [comparisonItems]);

  // Render Status Badge
  const renderStatusBadge = (status: CurriculumPacingStatus) => {
    switch (status) {
      case 'On Schedule':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>On Schedule</span>
          </span>
        );
      case 'Ahead':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            <span>Ahead</span>
          </span>
        );
      case 'Behind Schedule':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Behind Schedule</span>
          </span>
        );
      case 'Partially Completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Partially Completed</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Completed</span>
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Pacing &amp; Curriculum Verification
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                Live Audit Active
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Scheme of Work vs. Actual Teaching Records
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Compare what was <strong className="text-indigo-300 font-semibold">PLANNED</strong> in the Scheme of Work against what the teacher actually <strong className="text-emerald-300 font-semibold">TAUGHT</strong> in class and what was <strong className="text-cyan-300 font-semibold">COVERED</strong> in pupils' exercise books.
            </p>
          </div>

          {/* Quick Pacing Gauge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px] text-center shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Curriculum Health
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {stats.coveredPct}%
            </div>
            <div className="text-[11px] text-indigo-200 mt-1">
              {stats.completed + stats.onSchedule} of {stats.total} Weeks on Track
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.coveredPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status KPI Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => setStatusFilter('On Schedule')}
            className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
              statusFilter === 'On Schedule'
                ? 'bg-emerald-500/30 border-emerald-400 ring-2 ring-emerald-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-emerald-300 flex items-center justify-between">
              <span>On Schedule</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{stats.onSchedule}</div>
            <div className="text-[10px] text-emerald-200/80 mt-0.5">Matched planned week</div>
          </button>

          <button
            onClick={() => setStatusFilter('Ahead')}
            className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
              statusFilter === 'Ahead'
                ? 'bg-purple-500/30 border-purple-400 ring-2 ring-purple-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-purple-300 flex items-center justify-between">
              <span>Ahead</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{stats.ahead}</div>
            <div className="text-[10px] text-purple-200/80 mt-0.5">Taught early</div>
          </button>

          <button
            onClick={() => setStatusFilter('Behind Schedule')}
            className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
              statusFilter === 'Behind Schedule'
                ? 'bg-rose-500/30 border-rose-400 ring-2 ring-rose-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-rose-300 flex items-center justify-between">
              <span>Behind Schedule</span>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{stats.behind}</div>
            <div className="text-[10px] text-rose-200/80 mt-0.5">Lagging planned week</div>
          </button>

          <button
            onClick={() => setStatusFilter('Partially Completed')}
            className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
              statusFilter === 'Partially Completed'
                ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-amber-300 flex items-center justify-between">
              <span>Partial</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{stats.partial}</div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">In draft or partial</div>
          </button>

          <button
            onClick={() => setStatusFilter('Completed')}
            className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
              statusFilter === 'Completed'
                ? 'bg-blue-500/30 border-blue-400 ring-2 ring-blue-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-blue-300 flex items-center justify-between">
              <span>Completed</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{stats.completed}</div>
            <div className="text-[10px] text-blue-200/80 mt-0.5">Reviewed &amp; verified</div>
          </button>

          <button
            onClick={() => setStatusFilter('Not Started')}
            className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
              statusFilter === 'Not Started'
                ? 'bg-slate-500/30 border-slate-400 ring-2 ring-slate-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-slate-300 flex items-center justify-between">
              <span>Not Started</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{stats.notStarted}</div>
            <div className="text-[10px] text-slate-300/80 mt-0.5">Upcoming weeks</div>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Target Class
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              {branchClasses.map(c => (
                <option key={c.id || c.name} value={c.name || c.id}>
                  {c.name || c.id} ({c.level || 'Class'})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Subject Syllabus
            </label>
            <select
              value={selectedSubjectName}
              onChange={e => setSelectedSubjectName(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              {filteredSubjects.map(s => (
                <option key={s.id || s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Term Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Academic Term
            </label>
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>

          {/* Teacher Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Teacher Filter
            </label>
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              <option value="All">All Subject Teachers</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter bar & Quick Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search planned topics, taught lessons, book notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] text-slate-500 font-bold uppercase shrink-0">Status:</span>
            {(['All', 'On Schedule', 'Ahead', 'Behind Schedule', 'Partially Completed', 'Completed', 'Not Started'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The 3 Pillars Legend Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            🎯
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              1. PLANNED (Scheme of Work)
            </div>
            <p className="text-[11px] text-indigo-700/90 leading-relaxed mt-0.5">
              The official curriculum syllabus schedule indicating what topic and objectives should be taught each week.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            👨‍🏫
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              2. TAUGHT (Teacher's Record)
            </div>
            <p className="text-[11px] text-emerald-700/90 leading-relaxed mt-0.5">
              The factual log of what was actually taught in class, date, teaching methods, and chalkboard explanations.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-cyan-50/70 border border-cyan-100 rounded-2xl flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            📖
          </div>
          <div>
            <div className="text-xs font-bold text-cyan-900 uppercase tracking-wider">
              3. COVERED (Pupils' Books)
            </div>
            <p className="text-[11px] text-cyan-700/90 leading-relaxed mt-0.5">
              What students were expected to write in notebooks, textbook pages completed, classwork, and photographic evidence.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Feed / Matrix */}
      <div className="space-y-4">
        {filteredComparisonItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No matching curriculum items</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No milestones match your current filters. Try changing your status or search query.
            </p>
            <button
              onClick={() => {
                setStatusFilter('All');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredComparisonItems.map(item => {
            const hasTaught = Boolean(item.actualRecord);

            return (
              <div
                key={`comp-wk-${item.week}`}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md ${
                  item.status === 'Behind Schedule'
                    ? 'border-rose-200 bg-rose-50/10'
                    : item.status === 'Ahead'
                    ? 'border-purple-200 bg-purple-50/10'
                    : item.status === 'On Schedule'
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : item.status === 'Completed'
                    ? 'border-blue-200 bg-blue-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Header with Week, Status, and Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm font-mono shadow-sm">
                      W{item.week}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          Week {item.week}: {item.plannedTopic}
                        </h4>
                        {renderStatusBadge(item.status)}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.statusReason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {hasTaught && item.actualRecord && (
                      <button
                        onClick={() => onSelectRecord && onSelectRecord(item.actualRecord!)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer"
                        title="View Full Teaching Record"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Record</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveModalItem(item)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Compare Audit</span>
                    </button>
                  </div>
                </div>

                {/* 3-Column Comparative Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. PLANNED */}
                  <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                        🎯 PLANNED (Week {item.week})
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.plannedTopic}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                        {item.plannedObjectives}
                      </p>
                    </div>
                  </div>

                  {/* 2. TAUGHT */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    hasTaught ? 'bg-emerald-50/50 border-emerald-100/80' : 'bg-slate-50/70 border-dashed border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        hasTaught ? 'bg-emerald-100/80 text-emerald-900' : 'bg-slate-200 text-slate-600'
                      }`}>
                        👨‍🏫 TAUGHT {hasTaught ? `(Week ${item.taughtWeek})` : '(Pending)'}
                      </span>
                      {hasTaught && item.taughtDate && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.taughtDate}
                        </span>
                      )}
                    </div>
                    {hasTaught ? (
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                          <span>{item.taughtTopic}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                          {item.whatWasTaught}
                        </p>
                        <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Teacher: {item.actualRecord?.teacherName}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-2">
                        <p className="text-[11px] text-slate-400 italic">
                          No teaching record filed for this milestone yet.
                        </p>
                        {onCreateRecordForMilestone && (
                          <button
                            onClick={() => onCreateRecordForMilestone({
                              week: item.week,
                              topic: item.plannedTopic,
                              objectives: item.plannedObjectives,
                              status: 'Not Started'
                            }, selectedSubjectName, selectedClassId)}
                            className="inline-flex items-center space-x-1 text-[11px] text-indigo-600 font-bold hover:underline"
                          >
                            <span>+ Log Teaching for Week {item.week}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. COVERED */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    hasTaught ? 'bg-cyan-50/50 border-cyan-100/80' : 'bg-slate-50/70 border-dashed border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        hasTaught ? 'bg-cyan-100/80 text-cyan-900' : 'bg-slate-200 text-slate-600'
                      }`}>
                        📖 COVERED IN BOOKS
                      </span>
                      {item.hasNotebookEvidence && (
                        <span className="inline-flex items-center text-[10px] text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded font-medium">
                          <Camera className="w-2.5 h-2.5 mr-1" /> Photo Verified
                        </span>
                      )}
                    </div>
                    {hasTaught ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-800">
                          {item.pagesCovered ? (
                            <span className="font-bold text-cyan-950">{item.pagesCovered}</span>
                          ) : (
                            <span className="text-slate-500 italic">Pages not specified</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {item.studentNotebookWork || 'Notebook work instructions recorded.'}
                        </p>
                        {item.classwork && (
                          <div className="text-[10px] text-slate-500">
                            <strong>Classwork:</strong> {item.classwork}
                          </div>
                        )}

                        {/* Student Work Coverage Progress */}
                        <div className="pt-2 border-t border-cyan-200/60 mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-cyan-900 uppercase tracking-tight">Work Coverage:</span>
                            <span className="font-mono font-bold text-cyan-950">
                              {item.workCoveragePercentage ?? 90}% ({item.completedWorkCount ?? 27}/{item.totalStudentsInClass ?? 30})
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-cyan-200/70 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-600 rounded-full"
                              style={{ width: `${item.workCoveragePercentage ?? 90}%` }}
                            />
                          </div>
                          {item.flaggedStudentsCount && item.flaggedStudentsCount > 0 ? (
                            <div className="text-[9.5px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                              <span>💡 {item.flaggedStudentsCount} student(s) identified for support/incomplete</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[11px] text-slate-400 italic">
                          Awaiting teacher delivery &amp; pupil book coverage.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Side-by-Side Audit Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                    Week {activeModalItem.week} Audit
                  </span>
                  {renderStatusBadge(activeModalItem.status)}
                </div>
                <h3 className="text-lg font-bold text-white">
                  Curriculum Alignment Breakdown
                </h3>
                <p className="text-xs text-slate-300">
                  {selectedClassId} • {selectedSubjectName} • {selectedTerm}
                </p>
              </div>

              <button
                onClick={() => setActiveModalItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* Rationale Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start space-x-3 text-xs text-indigo-950">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Pacing Status Rationale:</div>
                  <p className="mt-0.5 leading-relaxed">{activeModalItem.statusReason}</p>
                </div>
              </div>

              {/* 3 Pillars Comparison Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PLANNED Column */}
                <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 space-y-4">
                  <div className="flex items-center space-x-2 text-indigo-900 border-b border-indigo-200/60 pb-2">
                    <span className="text-base">🎯</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      PLANNED (Scheme of Work)
                    </h4>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target Week</label>
                    <div className="text-sm font-bold text-slate-900 font-mono">Week {activeModalItem.week}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Planned Topic</label>
                    <div className="text-xs font-bold text-indigo-950 mt-0.5">{activeModalItem.plannedTopic}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Learning Objectives</label>
                    <div className="text-xs text-slate-700 mt-1 leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-100">
                      {activeModalItem.plannedObjectives}
                    </div>
                  </div>
                </div>

                {/* TAUGHT Column */}
                <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-900 border-b border-emerald-200/60 pb-2">
                    <span className="text-base">👨‍🏫</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      TAUGHT (Teacher Delivery)
                    </h4>
                  </div>
                  {activeModalItem.actualRecord ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Taught Week</label>
                          <div className="text-sm font-bold text-slate-900 font-mono">Week {activeModalItem.taughtWeek}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                          <div className="text-xs font-semibold text-slate-800 font-mono">{activeModalItem.taughtDate}</div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Topic Logged</label>
                        <div className="text-xs font-bold text-emerald-950 mt-0.5">{activeModalItem.taughtTopic}</div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">What Was Taught</label>
                        <div className="text-xs text-slate-700 mt-1 leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-100">
                          {activeModalItem.whatWasTaught}
                        </div>
                      </div>
                      {activeModalItem.actualRecord.boardWork && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Board Work / Formulas</label>
                          <div className="text-xs text-slate-700 mt-1 font-mono bg-slate-900 text-slate-100 p-3 rounded-xl whitespace-pre-wrap">
                            {activeModalItem.actualRecord.boardWork}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-400 italic text-xs">
                      No teaching record filed yet.
                    </div>
                  )}
                </div>

                {/* COVERED Column */}
                <div className="bg-cyan-50/60 rounded-2xl p-5 border border-cyan-100 space-y-4">
                  <div className="flex items-center space-x-2 text-cyan-900 border-b border-cyan-200/60 pb-2">
                    <span className="text-base">📖</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      COVERED (Pupils' Books)
                    </h4>
                  </div>
                  {activeModalItem.actualRecord ? (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Pages Covered</label>
                        <div className="text-xs font-bold text-cyan-950 mt-0.5">
                          {activeModalItem.pagesCovered || 'Not recorded'}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Expected Notebook Notes</label>
                        <div className="text-xs text-slate-700 mt-1 leading-relaxed bg-white/80 p-3 rounded-xl border border-cyan-100">
                          {activeModalItem.studentNotebookWork || 'Notebook work instructions recorded.'}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Classwork &amp; Homework</label>
                        <div className="text-xs text-slate-700 mt-1 bg-white/80 p-3 rounded-xl border border-cyan-100 space-y-1">
                          <div><strong>CW:</strong> {activeModalItem.classwork || 'Standard class exercises.'}</div>
                          <div><strong>HW:</strong> {activeModalItem.homework || 'Take-home assignment.'}</div>
                        </div>
                      </div>
                      {activeModalItem.hasNotebookEvidence && activeModalItem.notebookEvidenceUrl && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Book Evidence Photo</label>
                          <div className="mt-1 rounded-xl overflow-hidden border border-cyan-200">
                            <img
                              src={activeModalItem.notebookEvidenceUrl}
                              alt="Student book evidence"
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-400 italic text-xs">
                      No pupil book coverage recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: STUDENT BOOK & CLASSWORK COVERAGE AUDIT */}
              {activeModalItem.actualRecord && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Student Book &amp; Classwork Coverage (Pedagogical Indicator)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Tracks exercise book delivery and individual learner completion rates (not examination marks).
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-xl border border-slate-300 text-slate-900 shadow-2xs">
                        Coverage: {activeModalItem.actualRecord.workCoveragePercentage ?? 90}%
                      </span>
                    </div>
                  </div>

                  {/* Coverage Headcount Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Total Enrolled</div>
                      <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                        {activeModalItem.actualRecord.totalStudentsInClass || 30}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200">
                      <div className="text-[10px] uppercase font-bold text-emerald-700">Completed Work</div>
                      <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                        {activeModalItem.actualRecord.completedWorkCount ?? 27}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-amber-200">
                      <div className="text-[10px] uppercase font-bold text-amber-700">Partially Completed</div>
                      <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
                        {activeModalItem.actualRecord.partiallyCompletedCount ?? 2}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-rose-200">
                      <div className="text-[10px] uppercase font-bold text-rose-700">Not Completed</div>
                      <div className="text-lg font-bold font-mono text-rose-700 mt-0.5">
                        {activeModalItem.actualRecord.notCompletedCount ?? 1}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-600">Absent from Class</div>
                      <div className="text-lg font-bold font-mono text-slate-700 mt-0.5">
                        {activeModalItem.actualRecord.absentCount ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Flagged Students List if any */}
                  {activeModalItem.actualRecord.flaggedStudents && activeModalItem.actualRecord.flaggedStudents.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Identified Individual Learners Requiring Follow-Up ({activeModalItem.actualRecord.flaggedStudents.length})</span>
                      </div>
                      <div className="space-y-1.5 divide-y divide-slate-100">
                        {activeModalItem.actualRecord.flaggedStudents.map((flag, idx) => (
                          <div key={idx} className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                            <div>
                              <span className="font-bold text-slate-900">{flag.studentName}</span>
                              {flag.admissionNumber && <span className="text-slate-400 font-mono ml-1.5">({flag.admissionNumber})</span>}
                              <span className={`ml-2 text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                                flag.category === 'Needs Support'
                                  ? 'bg-amber-100 text-amber-800'
                                  : flag.category === 'Not Completed'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {flag.category}
                              </span>
                              {flag.notes && <p className="text-slate-600 mt-0.5">{flag.notes}</p>}
                            </div>
                            {flag.interventionPlan && (
                              <div className="text-indigo-900 bg-indigo-50 px-2 py-1 rounded text-[10px] font-medium shrink-0">
                                <strong>Plan:</strong> {flag.interventionPlan}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500">
                Scheme of Work directives remain untouched and authoritative.
              </div>
              <div className="flex items-center space-x-2">
                {activeModalItem.actualRecord && onSelectRecord && (
                  <button
                    onClick={() => {
                      const rec = activeModalItem.actualRecord;
                      setActiveModalItem(null);
                      if (rec) onSelectRecord(rec);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Open Teaching Record Docket
                  </button>
                )}
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
