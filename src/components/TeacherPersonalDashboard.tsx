import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Upload,
  Camera,
  Image as ImageIcon,
  Check,
  X,
  ChevronRight,
  Plus,
  Send,
  Target,
  MessageSquare,
  BookOpen,
  User,
  History,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  Filter,
  CheckSquare
} from 'lucide-react';
import { 
  TeachingRecord, 
  TeachingRecordStatus, 
  CurriculumPacingStatus,
  SupportingEvidence,
  EvidenceType,
  SAMPLE_EVIDENCE_PRESETS
} from '../data/teachingRecordData';
import { WeeklyMilestone, defaultChecklists } from '../data/curriculumData';

interface TeacherPersonalDashboardProps {
  teachingRecords: TeachingRecord[];
  setTeachingRecords: React.Dispatch<React.SetStateAction<TeachingRecord[]>>;
  classes: any[];
  subjects: any[];
  teachers: any[];
  selectedBranch: string;
  currentSimulatedRole?: string;
  academicSessions?: any[];
  terms?: any[];
  curriculumChecklists?: Record<string, WeeklyMilestone[]>;
  onOpenCreateRecord?: (milestone?: WeeklyMilestone, sub?: string, cls?: string) => void;
  onOpenRecordDetail?: (record: TeachingRecord) => void;
}

export const TeacherPersonalDashboard: React.FC<TeacherPersonalDashboardProps> = ({
  teachingRecords,
  setTeachingRecords,
  classes = [],
  subjects = [],
  teachers = [],
  selectedBranch,
  currentSimulatedRole = 'Teacher',
  academicSessions = [],
  terms = [],
  curriculumChecklists = defaultChecklists,
  onOpenCreateRecord,
  onOpenRecordDetail
}) => {
  // Active Teacher in view (defaults to primary teacher or selected)
  const defaultTeacherId = teachers.length > 0 ? teachers[0].id : 'staff-1';
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(defaultTeacherId);

  // Review & Follow-up records from backend
  const [reviews, setReviews] = useState<any[]>([]);
  const [timelineTasks, setTimelineTasks] = useState<any[]>([]);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedReviewForCompletion, setSelectedReviewForCompletion] = useState<any>(null);
  const [completionNotes, setCompletionNotes] = useState('Completed revision work and verified with classroom exercises.');

  // Quick Evidence Upload Modal
  const [evidenceUploadRecord, setEvidenceUploadRecord] = useState<TeachingRecord | null>(null);
  const [evidenceTitle, setEvidenceTitle] = useState('Classroom Whiteboard - Lesson Notes & Calculations');
  const [evidenceType, setEvidenceType] = useState<'board_photo' | 'student_notebook' | 'lesson_notes'>('board_photo');
  const [evidenceDescription, setEvidenceDescription] = useState('Clear photograph showing written lesson notes, exercise board questions, and date stamp.');

  useEffect(() => {
    fetchReviewsAndTimeline();
  }, []);

  const fetchReviewsAndTimeline = async () => {
    try {
      const [resRev, resTasks] = await Promise.all([
        fetch('/api/teacher-reviews'),
        fetch('/api/event_tasks')
      ]);
      if (resRev.ok) {
        const data = await resRev.json();
        setReviews(data);
      }
      if (resTasks.ok) {
        const data = await resTasks.json();
        setTimelineTasks(data);
      }
    } catch (e) {
      console.error("Failed fetching review/timeline data", e);
    }
  };

  const currentTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId) || {
      id: 'staff-1',
      name: 'Aisha Garba',
      branch: 'GN',
      subjects: ['Primary Mathematics'],
      classesAssigned: ['Primary 5 - Gold']
    };
  }, [teachers, selectedTeacherId]);

  // Current Teacher's Records
  const teacherRecords = useMemo(() => {
    return teachingRecords.filter(r => 
      r.teacherId === selectedTeacherId || 
      r.teacherName === currentTeacher.name ||
      (currentTeacher.subjects && currentTeacher.subjects.includes(r.subject))
    );
  }, [teachingRecords, selectedTeacherId, currentTeacher]);

  // 1. Today's Records
  const todayIso = new Date().toISOString().split('T')[0];
  const todayRecords = useMemo(() => {
    // Show records from today or latest 3 records
    const todays = teacherRecords.filter(r => r.date === todayIso);
    if (todays.length > 0) return todays;
    return teacherRecords.slice(0, 2);
  }, [teacherRecords, todayIso]);

  // 2. Current Topic & Scheme of Work Pacing
  const currentSchemeMilestones = useMemo(() => {
    const primarySubject = currentTeacher.subjects ? currentTeacher.subjects[0] : 'Mathematics';
    const primaryClass = currentTeacher.classesAssigned ? currentTeacher.classesAssigned[0] : 'Primary 5 - Gold';
    const key = Object.keys(curriculumChecklists).find(k => 
      k.toLowerCase().includes('math') || k.toLowerCase().includes(primarySubject.toLowerCase())
    ) || Object.keys(curriculumChecklists)[0];

    const milestones = curriculumChecklists[key] || [];
    return {
      key,
      primarySubject,
      primaryClass,
      milestones,
      currentMilestone: milestones.find(m => m.week === 7) || milestones[0],
      nextMilestone: milestones.find(m => m.week === 8) || milestones[1]
    };
  }, [currentTeacher, curriculumChecklists]);

  // 3. Upcoming Deadlines & Overdue Submissions
  const deadlines = useMemo(() => {
    const teacherTasks = timelineTasks.filter(t => 
      !t.assignedUser || 
      t.assignedUser === currentTeacher.name || 
      t.assignedUser === 'All Teachers' ||
      t.assignedRole === 'Teacher'
    );

    const now = new Date();
    const upcoming = teacherTasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) >= now);
    const overdue = teacherTasks.filter(t => t.status === 'Overdue' || (t.status !== 'Completed' && new Date(t.dueDate) < now));

    // Fallback realistic deadlines if none in timeline
    if (upcoming.length === 0 && overdue.length === 0) {
      return {
        upcoming: [
          { id: 'dl-1', title: 'Week 7 Daily Teaching Log Submission', dueDate: '2026-07-10', dueTime: '17:00', taskType: 'teaching_record' },
          { id: 'dl-2', title: 'Week 8 Lesson Plan & Schemes', dueDate: '2026-07-13', dueTime: '08:00', taskType: 'lesson_plan' }
        ],
        overdue: [
          { id: 'dl-ov-1', title: 'Mark & Record Primary 5 Mathematics Exercise Books', dueDate: '2026-06-25', daysLate: 2 }
        ]
      };
    }

    return { upcoming, overdue };
  }, [timelineTasks, currentTeacher]);

  // 4. Progress, Book Coverage & Evidence metrics
  const teacherStats = useMemo(() => {
    const total = teacherRecords.length || 10;
    const completedTopics = teacherRecords.filter(r => r.topicsTaughtCount && r.topicsTaughtCount >= 1).length;
    const recordsWithEvidence = teacherRecords.filter(r => r.supportingEvidence && r.supportingEvidence.length > 0).length;
    const missingEvidenceRecords = teacherRecords.filter(r => !r.supportingEvidence || r.supportingEvidence.length === 0);

    const bookCoverageValues = teacherRecords.map(r => r.studentBookCoveragePercentage || 85);
    const avgBookCoverage = Math.round(bookCoverageValues.reduce((a, b) => a + b, 0) / (bookCoverageValues.length || 1));

    return {
      total,
      completedTopics,
      progressPct: Math.min(100, Math.round((completedTopics / 12) * 100)),
      evidenceRate: Math.round((recordsWithEvidence / (total || 1)) * 100),
      missingEvidenceRecords,
      avgBookCoverage
    };
  }, [teacherRecords]);

  // 5. Management Feedback, Corrections Requested & Improvement Tasks
  const teacherFeedback = useMemo(() => {
    const teacherReviews = reviews.filter(r => 
      r.teacherId === selectedTeacherId || 
      r.teacherName === currentTeacher.name
    );

    const corrections = teacherReviews.filter(r => r.correctionsRequested && r.correctionsRequested.trim().length > 0);
    const improvementTasks = teacherReviews.filter(r => r.improvementTarget || r.followUpTaskTitle);
    const pendingFollowUps = teacherReviews.filter(r => r.status === 'Pending Follow-Up');

    return {
      reviews: teacherReviews,
      corrections,
      improvementTasks,
      pendingFollowUps
    };
  }, [reviews, selectedTeacherId, currentTeacher]);

  // Handle Quick Evidence Attach
  const handleAttachEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceUploadRecord) return;

    const newEvidence: SupportingEvidence = {
      id: `ev-${Date.now()}`,
      type: (evidenceType as EvidenceType) || 'board',
      title: evidenceTitle,
      url: SAMPLE_EVIDENCE_PRESETS[0]?.defaultUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800',
      notes: evidenceDescription,
      uploadedAt: new Date().toISOString()
    };

    setTeachingRecords(prev => prev.map(rec => {
      if (rec.id === evidenceUploadRecord.id) {
        return {
          ...rec,
          supportingEvidence: [...(rec.supportingEvidence || []), newEvidence]
        };
      }
      return rec;
    }));

    setEvidenceUploadRecord(null);
    alert("Supporting evidence successfully attached to teaching record!");
  };

  // Handle Quick Record Submit
  const handleQuickSubmit = (recordId: string) => {
    setTeachingRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          submissionStatus: 'Submitted On Time' as any,
          status: 'Submitted' as any
        };
      }
      return r;
    }));
    alert("Teaching record submitted to Academic Management for verification.");
  };

  // Handle Complete Follow-Up Target
  const handleConfirmFollowUpCompletion = async () => {
    if (!selectedReviewForCompletion) return;
    try {
      const res = await fetch(`/api/teacher-reviews/${selectedReviewForCompletion.id}/follow-up-complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionNotes,
          completedBy: currentTeacher.name
        })
      });
      if (res.ok) {
        await fetchReviewsAndTimeline();
        setIsFollowUpModalOpen(false);
        setSelectedReviewForCompletion(null);
        alert("Follow-up action marked as completed! Management audit trail updated.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to mark follow-up completed.");
    }
  };

  return (
    <div id="teacher-personal-mobile-dashboard" className="space-y-5">
      {/* 📱 MOBILE-FIRST HERO HEADER */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-indigo-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-extrabold text-lg shadow-inner">
              {currentTeacher.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {currentTeacher.name}
                </h2>
                <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-400/30">
                  {currentTeacher.branch} Campus • Teacher Workspace
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentTeacher.subjects?.join(', ') || 'Primary Mathematics'} • {currentTeacher.classesAssigned?.join(', ') || 'Primary 5 - Gold'}
              </p>
            </div>
          </div>

          {/* Teacher Selector for Admin/Management preview */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:inline">Simulate Teacher:</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400 transition-all cursor-pointer"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.branch})</option>
              ))}
            </select>
          </div>
        </div>

        {/* 🚀 QUICK ACTION BAR (Mobile-First Touch Friendly) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => onOpenCreateRecord ? onOpenCreateRecord() : null}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Teaching</span>
          </button>

          <button
            onClick={() => {
              if (teacherStats.missingEvidenceRecords.length > 0) {
                setEvidenceUploadRecord(teacherStats.missingEvidenceRecords[0]);
              } else if (teacherRecords.length > 0) {
                setEvidenceUploadRecord(teacherRecords[0]);
              }
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-2xl flex items-center justify-center space-x-2 border border-slate-700 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Upload Evidence</span>
          </button>

          <button
            onClick={() => {
              const pending = todayRecords.find(r => r.submissionStatus === 'Pending' || r.status === 'Draft');
              if (pending) handleQuickSubmit(pending.id);
              else alert("All current teaching records are already submitted!");
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-2xl flex items-center justify-center space-x-2 border border-slate-700 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-blue-400" />
            <span>Submit Record</span>
          </button>

          <button
            onClick={() => {
              const elem = document.getElementById('teacher-feedback-section');
              if (elem) elem.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-2xl flex items-center justify-center space-x-2 border border-slate-700 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>View Feedback ({teacherFeedback.pendingFollowUps.length})</span>
          </button>
        </div>
      </div>

      {/* ⚠️ CRITICAL ALERTS & OVERDUE NOTICES (If any) */}
      {deadlines.overdue.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start space-x-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-extrabold text-rose-900 uppercase tracking-wider text-[11px]">
              Overdue Submission Alert ({deadlines.overdue.length} Items)
            </div>
            <div className="text-rose-950 font-medium mt-0.5">
              {deadlines.overdue.map((ov, idx) => (
                <div key={ov.id || idx} className="flex items-center justify-between py-1 border-b border-rose-200/60 last:border-0">
                  <span>{ov.title} (Due: {ov.dueDate})</span>
                  <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[10px]">
                    {ov.daysLate ? `${ov.daysLate}d Late` : 'Action Required'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2-COLUMN MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* LEFT 2 COLS: TODAY'S RECORDS & ACTIVE TOPIC */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* SECTION 1: TODAY'S TEACHING RECORDS */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  Today's Teaching Records
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                📅 {todayIso}
              </span>
            </div>

            {todayRecords.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No teaching records logged for today yet.</p>
                <button
                  onClick={() => onOpenCreateRecord ? onOpenCreateRecord() : null}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-sm hover:bg-indigo-500 cursor-pointer"
                >
                  Record Today's Lesson
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayRecords.map((record) => {
                  const hasEvidence = record.supportingEvidence && record.supportingEvidence.length > 0;
                  const isSubmitted = record.submissionStatus === 'Submitted On Time' || record.submissionStatus === 'Submitted Late';

                  return (
                    <div
                      key={record.id}
                      className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-xs text-slate-900">
                              {record.subject}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {record.classId}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              Period {record.periodNumber || 2}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-indigo-950 mt-1">
                            Topic: {record.topicTaught || 'Decimals, Fractions & Conversion Exercises'}
                          </h4>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            isSubmitted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            {record.submissionStatus || 'Draft'}
                          </span>

                          <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold border ${
                            hasEvidence
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {hasEvidence ? `📷 ${record.supportingEvidence?.length} Evidences` : '⚠️ No Evidence'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Evidence & Submit Controls */}
                      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="text-[11px] text-slate-500">
                          Books marked: <strong>{record.studentBookCoveragePercentage || 85}%</strong> • Classwork exercises: <strong>{record.classworkExerciseCount || 3}</strong>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setEvidenceUploadRecord(record)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] transition-all flex items-center space-x-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3 text-indigo-600" />
                            <span>Add Photo</span>
                          </button>

                          {!isSubmitted && (
                            <button
                              onClick={() => handleQuickSubmit(record.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>Submit</span>
                            </button>
                          )}

                          <button
                            onClick={() => onOpenRecordDetail ? onOpenRecordDetail(record) : null}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[11px] transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: CURRENT TOPIC & SCHEME OF WORK PACING */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  Current Scheme of Work Target
                </h3>
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                Week 7 of 12
              </span>
            </div>

            <div className="bg-gradient-to-r from-amber-50/80 via-indigo-50/50 to-slate-50 p-4 rounded-2xl border border-amber-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider">
                  Active Milestone (Week 7):
                </span>
                <span className="font-extrabold text-indigo-700">
                  {currentSchemeMilestones.primarySubject} • {currentSchemeMilestones.primaryClass}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                {currentSchemeMilestones.currentMilestone?.topic || 'Decimals, Fractions and Percentage Conversions'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentSchemeMilestones.currentMilestone?.learningObjectives || 'Pupils should solve basic word problems involving tenths, hundredths, and real-life currency conversions.'}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs border-t border-amber-200/50">
                <span className="text-slate-500 text-[11px]">
                  Next Week (Week 8): <strong>{currentSchemeMilestones.nextMilestone?.topic || 'Simple Linear Equations'}</strong>
                </span>
                <button
                  onClick={() => onOpenCreateRecord ? onOpenCreateRecord(currentSchemeMilestones.currentMilestone, currentSchemeMilestones.primarySubject, currentSchemeMilestones.primaryClass) : null}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                >
                  Record This Topic
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: MANAGEMENT FEEDBACK & IMPROVEMENT TASKS */}
          <div id="teacher-feedback-section" className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  Management Feedback &amp; Improvement Tasks
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {teacherFeedback.pendingFollowUps.length} Pending Actions
              </span>
            </div>

            {teacherFeedback.reviews.length === 0 ? (
              <div className="p-5 text-center text-slate-400 bg-slate-50 rounded-2xl">
                No supervisor feedback records found.
              </div>
            ) : (
              <div className="space-y-3">
                {teacherFeedback.reviews.map((rev) => {
                  const isPending = rev.status === 'Pending Follow-Up';

                  return (
                    <div
                      key={rev.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900">{rev.reviewerName}</span>
                            <span className="text-[10px] text-slate-400">• 📅 {rev.reviewDate}</span>
                          </div>
                          <div className="text-xs font-extrabold text-indigo-700 mt-0.5">
                            Target: {rev.improvementTarget || rev.followUpTaskTitle || 'Complete scheduled curriculum milestones'}
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          rev.status === 'Follow-Up Completed'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : rev.status === 'Approved'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {rev.status}
                        </span>
                      </div>

                      {rev.comments && (
                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                          💬 <strong>Comments:</strong> {rev.comments}
                        </p>
                      )}

                      {rev.correctionsRequested && (
                        <div className="text-xs text-rose-900 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                          ⚠️ <strong>Corrections Requested:</strong> {rev.correctionsRequested}
                        </div>
                      )}

                      {/* Action Button */}
                      {isPending && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedReviewForCompletion(rev);
                              setIsFollowUpModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Follow-Up Completed</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 1 COL: METRICS, DEADLINES & MISSING EVIDENCE */}
        <div className="space-y-5">
          
          {/* TEACHER PROGRESS CARD */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
              Teaching Performance Summary
            </h3>

            {/* Pacing Progress Gauge */}
            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-950">Curriculum Pacing</span>
                <span className="font-mono font-extrabold text-indigo-700">{teacherStats.progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${teacherStats.progressPct}%` }} />
              </div>
              <div className="text-[10px] text-indigo-800">
                {teacherStats.completedTopics} of 12 syllabus milestone topics completed
              </div>
            </div>

            {/* Student Book Coverage */}
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-950">Student Book Coverage</span>
                <span className="font-mono font-extrabold text-emerald-700">{teacherStats.avgBookCoverage}%</span>
              </div>
              <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${teacherStats.avgBookCoverage}%` }} />
              </div>
              <div className="text-[10px] text-emerald-800">
                Average pupil exercise book marking and signature coverage
              </div>
            </div>

            {/* Evidence Rate */}
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-950">Evidence Attachments</span>
                <span className="font-mono font-extrabold text-blue-700">{teacherStats.evidenceRate}%</span>
              </div>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${teacherStats.evidenceRate}%` }} />
              </div>
              <div className="text-[10px] text-blue-800">
                Records with whiteboard photos or student exercise attachments
              </div>
            </div>
          </div>

          {/* UPCOMING DEADLINES CARD */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-slate-600" />
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  Upcoming Deadlines
                </h3>
              </div>
              <span className="text-[10px] font-bold text-indigo-600">Timeline Sync</span>
            </div>

            <div className="space-y-2.5">
              {deadlines.upcoming.map((dl) => (
                <div key={dl.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900">{dl.title}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>📅 Due: {dl.dueDate}</span>
                    {dl.dueTime && <span>⏰ {dl.dueTime}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MISSING EVIDENCE WATCHLIST */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  Evidence Watchlist
                </h3>
              </div>
              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                {teacherStats.missingEvidenceRecords.length} Missing
              </span>
            </div>

            {teacherStats.missingEvidenceRecords.length === 0 ? (
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All your logged records have photos attached!</span>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {teacherStats.missingEvidenceRecords.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-amber-950">{rec.subject} ({rec.classId})</div>
                      <div className="text-[10px] text-amber-800">📅 {rec.date} • {rec.topicTaught?.slice(0, 25)}...</div>
                    </div>
                    <button
                      onClick={() => setEvidenceUploadRecord(rec)}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                    >
                      Attach
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          MODAL: QUICK EVIDENCE UPLOAD
          ========================================================= */}
      {evidenceUploadRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base">Upload Teaching Evidence</h3>
              </div>
              <button
                onClick={() => setEvidenceUploadRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttachEvidence} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <div className="font-bold text-slate-800">{evidenceUploadRecord.subject} ({evidenceUploadRecord.classId})</div>
                <div className="text-[11px] text-slate-500">Topic: {evidenceUploadRecord.topicTaught} • 📅 {evidenceUploadRecord.date}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Evidence Category
                </label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                >
                  <option value="board_photo">📷 Classroom Whiteboard Photo</option>
                  <option value="student_notebook">📖 Student Notebook / Exercise Sample</option>
                  <option value="lesson_notes">📝 Teacher Lesson Plan &amp; Notes</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Evidence Title
                </label>
                <input
                  type="text"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Sample Photo Preview */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center space-x-3">
                <img
                  src={SAMPLE_EVIDENCE_PRESETS[0]?.defaultUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=300'}
                  alt="Evidence Preview"
                  className="w-16 h-12 object-cover rounded-lg border border-slate-300"
                />
                <div className="text-[11px] text-slate-600">
                  <span className="font-bold text-emerald-700">✓ Ready to attach.</span> Timestamp stamp and teacher signature remark will be stamped.
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEvidenceUploadRecord(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach Evidence</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: COMPLETE FOLLOW-UP ACTION
          ========================================================= */}
      {isFollowUpModalOpen && selectedReviewForCompletion && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base">Complete Follow-Up Target</h3>
              </div>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 space-y-1">
                <div className="text-[10px] font-bold text-indigo-800 uppercase">Improvement Target:</div>
                <div className="font-bold text-indigo-950">{selectedReviewForCompletion.improvementTarget || selectedReviewForCompletion.followUpTaskTitle}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Teacher Resolution Remarks
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                  placeholder="Describe how the target was completed..."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFollowUpCompletion}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark as Completed</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
