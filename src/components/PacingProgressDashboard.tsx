import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  User,
  BookOpen,
  School,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { TeachingRecord, CurriculumPacingStatus } from '../data/teachingRecordData';
import { WeeklyMilestone, defaultChecklists } from '../data/curriculumData';

interface PacingProgressDashboardProps {
  teachingRecords: TeachingRecord[];
  classes: any[];
  subjects: any[];
  teachers: any[];
  selectedBranch: string;
  curriculumChecklists?: Record<string, WeeklyMilestone[]>;
  onFilterToComparison?: (filterType: 'teacher' | 'subject' | 'class', value: string) => void;
}

export const PacingProgressDashboard: React.FC<PacingProgressDashboardProps> = ({
  teachingRecords,
  classes,
  subjects,
  teachers,
  selectedBranch,
  curriculumChecklists = defaultChecklists,
  onFilterToComparison
}) => {
  const [activeDimension, setActiveDimension] = useState<'teacher' | 'subject' | 'class' | 'term' | 'branch'>('teacher');
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('First Term');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(selectedBranch || 'All');
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize branch filter
  const branchFilteredRecords = useMemo(() => {
    return teachingRecords.filter(r => {
      if (selectedBranchFilter && selectedBranchFilter !== 'All') {
        const bMatch = r.branch === selectedBranchFilter || 
          (selectedBranchFilter === 'GN' && (r.branch === 'Gawun Nama' || r.branch === 'GN')) ||
          (selectedBranchFilter === 'RS' && (r.branch === 'Runjin Sambo' || r.branch === 'RS'));
        if (!bMatch) return false;
      }
      if (selectedTermFilter && selectedTermFilter !== 'All' && r.term && r.term !== selectedTermFilter) {
        return false;
      }
      return true;
    });
  }, [teachingRecords, selectedBranchFilter, selectedTermFilter]);

  // Overall Global Progress Stats
  const globalStats = useMemo(() => {
    const totalRecords = branchFilteredRecords.length;
    const reviewed = branchFilteredRecords.filter(r => r.status === 'Reviewed').length;
    const submitted = branchFilteredRecords.filter(r => r.status === 'Submitted').length;
    const drafts = branchFilteredRecords.filter(r => r.status === 'Draft').length;
    const corrections = branchFilteredRecords.filter(r => r.status === 'Correction Required').length;

    // Derived Pacing Counts from Records
    let aheadCount = 0;
    let onScheduleCount = 0;
    let behindCount = 0;

    branchFilteredRecords.forEach(r => {
      const plannedWk = r.schemeMilestoneWeek || r.week;
      if (r.week < plannedWk) aheadCount++;
      else if (r.week > plannedWk) behindCount++;
      else onScheduleCount++;
    });

    const onTrackPct = totalRecords > 0 ? Math.round(((onScheduleCount + aheadCount) / totalRecords) * 100) : 0;

    return {
      totalRecords,
      reviewed,
      submitted,
      drafts,
      corrections,
      aheadCount,
      onScheduleCount,
      behindCount,
      onTrackPct
    };
  }, [branchFilteredRecords]);

  // 1. PROGRESS BY TEACHER
  const teacherProgress = useMemo(() => {
    return teachers.map(teacher => {
      const teacherRecords = branchFilteredRecords.filter(
        r => r.teacherId === teacher.id || r.teacherName === teacher.name
      );

      const total = teacherRecords.length;
      const reviewed = teacherRecords.filter(r => r.status === 'Reviewed').length;
      const submitted = teacherRecords.filter(r => r.status === 'Submitted').length;
      const drafts = teacherRecords.filter(r => r.status === 'Draft').length;
      const corrections = teacherRecords.filter(r => r.status === 'Correction Required').length;

      let ahead = 0;
      let onSchedule = 0;
      let behind = 0;

      teacherRecords.forEach(r => {
        const plannedWk = r.schemeMilestoneWeek || r.week;
        if (r.week < plannedWk) ahead++;
        else if (r.week > plannedWk) behind++;
        else onSchedule++;
      });

      const complianceScore = total > 0 ? Math.round(((reviewed * 1.0 + submitted * 0.8 + drafts * 0.4) / (total * 1.0)) * 100) : 0;
      const pacingHealth = behind > 0 ? 'Lagging' : total >= 2 ? 'Optimal' : 'Standard';

      return {
        teacher,
        total,
        reviewed,
        submitted,
        drafts,
        corrections,
        ahead,
        onSchedule,
        behind,
        complianceScore,
        pacingHealth
      };
    }).filter(tp => {
      if (!searchQuery.trim()) return true;
      return tp.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             tp.teacher.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [teachers, branchFilteredRecords, searchQuery]);

  // 2. PROGRESS BY SUBJECT
  const subjectProgress = useMemo(() => {
    return subjects.map(subject => {
      const subjectRecords = branchFilteredRecords.filter(
        r => r.subject.toLowerCase() === subject.name.toLowerCase()
      );

      const milestones = defaultChecklists[subject.name] || Array.from({ length: 10 }, (_, i) => ({ week: i + 1 }));
      const totalMilestones = milestones.length;

      const coveredWeeks = new Set(subjectRecords.map(r => r.schemeMilestoneWeek || r.week));
      const completionPct = totalMilestones > 0 ? Math.round((coveredWeeks.size / totalMilestones) * 100) : 0;

      let ahead = 0;
      let onSchedule = 0;
      let behind = 0;

      subjectRecords.forEach(r => {
        const plannedWk = r.schemeMilestoneWeek || r.week;
        if (r.week < plannedWk) ahead++;
        else if (r.week > plannedWk) behind++;
        else onSchedule++;
      });

      return {
        subject,
        totalRecords: subjectRecords.length,
        totalMilestones,
        coveredMilestonesCount: coveredWeeks.size,
        completionPct,
        ahead,
        onSchedule,
        behind
      };
    }).filter(sp => {
      if (!searchQuery.trim()) return true;
      return sp.subject.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [subjects, branchFilteredRecords, searchQuery]);

  // 3. PROGRESS BY CLASS
  const classProgress = useMemo(() => {
    return classes.map(cls => {
      const classRecords = branchFilteredRecords.filter(
        r => r.classId === cls.name || r.classId === cls.id
      );

      const total = classRecords.length;
      let ahead = 0;
      let onSchedule = 0;
      let behind = 0;

      classRecords.forEach(r => {
        const plannedWk = r.schemeMilestoneWeek || r.week;
        if (r.week < plannedWk) ahead++;
        else if (r.week > plannedWk) behind++;
        else onSchedule++;
      });

      const paceRating = behind > 0 ? 'Needs Attention' : total >= 3 ? 'On Track' : 'Normal';

      return {
        cls,
        total,
        ahead,
        onSchedule,
        behind,
        paceRating,
        reviewedCount: classRecords.filter(r => r.status === 'Reviewed').length
      };
    }).filter(cp => {
      if (!searchQuery.trim()) return true;
      return cp.cls.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [classes, branchFilteredRecords, searchQuery]);

  // 4. PROGRESS BY BRANCH
  const branchBreakdown = useMemo(() => {
    const branches = [
      { id: 'GN', name: 'Gawun Nama Branch (Primary / Nursery)' },
      { id: 'RS', name: 'Runjin Sambo Branch (Secondary / Core)' }
    ];

    return branches.map(b => {
      const bRecords = teachingRecords.filter(r => 
        r.branch === b.id || (b.id === 'GN' && r.branch === 'Gawun Nama') || (b.id === 'RS' && r.branch === 'Runjin Sambo')
      );

      const total = bRecords.length;
      const reviewed = bRecords.filter(r => r.status === 'Reviewed').length;
      const submitted = bRecords.filter(r => r.status === 'Submitted').length;
      const drafts = bRecords.filter(r => r.status === 'Draft').length;

      let ahead = 0;
      let onSchedule = 0;
      let behind = 0;

      bRecords.forEach(r => {
        const plannedWk = r.schemeMilestoneWeek || r.week;
        if (r.week < plannedWk) ahead++;
        else if (r.week > plannedWk) behind++;
        else onSchedule++;
      });

      const onTrackPct = total > 0 ? Math.round(((onSchedule + ahead) / total) * 100) : 0;

      return {
        branch: b,
        total,
        reviewed,
        submitted,
        drafts,
        ahead,
        onSchedule,
        behind,
        onTrackPct
      };
    });
  }, [teachingRecords]);

  // 5. PROGRESS BY TERM
  const termBreakdown = useMemo(() => {
    const terms = ['First Term', 'Second Term', 'Third Term'];

    return terms.map(termName => {
      const termRecords = teachingRecords.filter(r => r.term === termName || (!r.term && termName === 'First Term'));
      const total = termRecords.length;
      const reviewed = termRecords.filter(r => r.status === 'Reviewed').length;

      let ahead = 0;
      let onSchedule = 0;
      let behind = 0;

      termRecords.forEach(r => {
        const plannedWk = r.schemeMilestoneWeek || r.week;
        if (r.week < plannedWk) ahead++;
        else if (r.week > plannedWk) behind++;
        else onSchedule++;
      });

      return {
        termName,
        total,
        reviewed,
        ahead,
        onSchedule,
        behind,
        isCurrent: termName === 'First Term'
      };
    });
  }, [teachingRecords]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Dimension Nav */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Dimension Selector Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-2 shrink-0">
              Breakdown By:
            </span>
            {[
              { id: 'teacher', label: '👨‍🏫 Teacher', icon: User },
              { id: 'subject', label: '📚 Subject', icon: BookOpen },
              { id: 'class', label: '🏫 Class', icon: School },
              { id: 'term', label: '📅 Term', icon: Calendar },
              { id: 'branch', label: '🏢 Branch', icon: Building2 }
            ].map(dim => (
              <button
                key={dim.id}
                onClick={() => setActiveDimension(dim.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                  activeDimension === dim.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{dim.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Filters for Branch and Term */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedBranchFilter}
              onChange={e => setSelectedBranchFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
            >
              <option value="All">All Branches</option>
              <option value="GN">Gawun Nama (GN)</option>
              <option value="RS">Runjin Sambo (RS)</option>
            </select>

            <select
              value={selectedTermFilter}
              onChange={e => setSelectedTermFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
            >
              <option value="All">All Terms</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${activeDimension}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
      </div>

      {/* Global Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Lessons Logged
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {globalStats.totalRecords}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {globalStats.reviewed} Verified by Supervisor
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
            📋
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              On-Track Rate
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
              {globalStats.onTrackPct}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              On Schedule + Ahead
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🎯
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ahead of Syllabus
            </div>
            <div className="text-2xl font-bold text-purple-700 font-mono mt-1">
              {globalStats.aheadCount}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">
              Accelerated Milestones
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
            🚀
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Behind Schedule
            </div>
            <div className="text-2xl font-bold text-rose-700 font-mono mt-1">
              {globalStats.behindCount}
            </div>
            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
              Require Pacing Buffer
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
            ⚠️
          </div>
        </div>
      </div>

      {/* DIMENSION VIEWS */}

      {/* 1. TEACHER PROGRESS TABLE */}
      {activeDimension === 'teacher' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Curriculum Delivery Progress by Teacher
              </h3>
              <p className="text-xs text-slate-500">
                Tracking lessons logged, verified books, and pacing health per instructor.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">
              {teacherProgress.length} Teachers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Subject &amp; Specialization</th>
                  <th className="py-3 px-4 text-center">Lessons Logged</th>
                  <th className="py-3 px-4 text-center">Pacing Status</th>
                  <th className="py-3 px-4 text-center">Reviewed Books</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teacherProgress.map(tp => (
                  <tr key={tp.teacher.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{tp.teacher.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {tp.teacher.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{tp.teacher.subject || 'All Subjects'}</div>
                      <div className="text-[10px] text-slate-500">{tp.teacher.role || 'Teacher'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {tp.total}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {tp.behind > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            {tp.behind} Behind
                          </span>
                        ) : null}
                        {tp.ahead > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            {tp.ahead} Ahead
                          </span>
                        ) : null}
                        {tp.onSchedule > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {tp.onSchedule} On Schedule
                          </span>
                        ) : null}
                        {tp.total === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">No logs yet</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-blue-700 font-mono">{tp.reviewed}</span>
                      <span className="text-slate-400 font-mono"> / {tp.total}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {onFilterToComparison && (
                        <button
                          onClick={() => onFilterToComparison('teacher', tp.teacher.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer"
                        >
                          View Alignment
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

      {/* 2. SUBJECT PROGRESS CARDS */}
      {activeDimension === 'subject' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectProgress.map(sp => (
            <div
              key={sp.subject.id || sp.subject.name}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{sp.subject.name}</h4>
                  <div className="text-[11px] text-slate-500 capitalize">{sp.subject.level || 'General Curriculum'}</div>
                </div>
                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                  {sp.coveredMilestonesCount} / {sp.totalMilestones} Weeks
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Syllabus Coverage</span>
                  <span className="font-mono">{sp.completionPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sp.completionPct}%` }}
                  />
                </div>
              </div>

              {/* Pacing Breakdown Badges */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {sp.onSchedule} On Schedule
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    {sp.ahead} Ahead
                  </span>
                  {sp.behind > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {sp.behind} Behind
                    </span>
                  )}
                </div>

                {onFilterToComparison && (
                  <button
                    onClick={() => onFilterToComparison('subject', sp.subject.name)}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center space-x-0.5"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. CLASS PROGRESS CARDS */}
      {activeDimension === 'class' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classProgress.map(cp => (
            <div
              key={cp.cls.id || cp.cls.name}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{cp.cls.name}</h4>
                  <div className="text-[11px] text-slate-500">{cp.cls.level || 'Class'} • {cp.cls.branch || 'Main'}</div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  cp.paceRating === 'Needs Attention'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {cp.paceRating}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 rounded-xl">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Logged</div>
                  <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{cp.total}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">On Track</div>
                  <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">{cp.onSchedule + cp.ahead}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Verified</div>
                  <div className="text-sm font-bold text-blue-700 font-mono mt-0.5">{cp.reviewedCount}</div>
                </div>
              </div>

              {onFilterToComparison && (
                <button
                  onClick={() => onFilterToComparison('class', cp.cls.name)}
                  className="w-full py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer text-center"
                >
                  View Class Matrix
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. TERM PROGRESS */}
      {activeDimension === 'term' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {termBreakdown.map(tb => (
            <div
              key={tb.termName}
              className={`bg-white p-5 rounded-2xl border shadow-sm space-y-4 ${
                tb.isCurrent ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{tb.termName}</h4>
                  {tb.isCurrent && (
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">
                      Current Active Term
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                  {tb.total} Logs
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Verified Teaching Records:</span>
                  <span className="font-bold text-blue-700 font-mono">{tb.reviewed}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>On Schedule Delivery:</span>
                  <span className="font-bold text-emerald-700 font-mono">{tb.onSchedule}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Ahead of Syllabus:</span>
                  <span className="font-bold text-purple-700 font-mono">{tb.ahead}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Behind Schedule:</span>
                  <span className="font-bold text-rose-700 font-mono">{tb.behind}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. BRANCH BREAKDOWN */}
      {activeDimension === 'branch' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branchBreakdown.map(bb => (
            <div
              key={bb.branch.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Branch Code: {bb.branch.id}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{bb.branch.name}</h4>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-indigo-900">{bb.onTrackPct}%</div>
                  <div className="text-[10px] text-slate-500">On Track Rate</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center py-2.5 bg-slate-50 rounded-xl text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total</div>
                  <div className="font-bold font-mono text-slate-900">{bb.total}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase">On Track</div>
                  <div className="font-bold font-mono text-emerald-700">{bb.onSchedule + bb.ahead}</div>
                </div>
                <div>
                  <div className="text-[10px] text-rose-600 font-bold uppercase">Behind</div>
                  <div className="font-bold font-mono text-rose-700">{bb.behind}</div>
                </div>
                <div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase">Verified</div>
                  <div className="font-bold font-mono text-blue-700">{bb.reviewed}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
