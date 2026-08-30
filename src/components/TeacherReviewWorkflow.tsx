import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Users,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  History,
  Check,
  X,
  MessageSquare,
  Target,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  BookOpen,
  School,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck,
  CheckSquare
} from 'lucide-react';
import { TeachingRecord } from '../data/teachingRecordData';
import { WeeklyMilestone, defaultChecklists } from '../data/curriculumData';

export interface TeacherReviewRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  classId: string;
  branch: string;
  term: string;
  academicSession: string;
  reviewerName: string;
  reviewDate: string;
  actionType: 'Approve Record' | 'Request Correction' | 'Set Improvement Target' | 'Follow-Up Created';
  status: 'Pending Follow-Up' | 'Follow-Up Completed' | 'Approved' | 'Correction Requested';
  performanceSummary?: string;
  comments: string;
  correctionsRequested?: string;
  improvementTarget?: string;
  followUpTaskTitle?: string;
  followUpDeadline?: string;
  followUpStatus?: 'Pending' | 'Completed' | 'Not Required';
  followUpCompletedDate?: string;
  followUpCompletedNotes?: string;
  timelineTaskId?: string;
  auditLogs: Array<{
    id: string;
    timestamp: string;
    action: string;
    actor: string;
    notes: string;
  }>;
}

interface TeacherReviewWorkflowProps {
  teachingRecords: TeachingRecord[];
  classes: any[];
  subjects: any[];
  teachers: any[];
  selectedBranch: string;
  currentSimulatedRole?: string;
  academicSessions?: any[];
  terms?: any[];
  curriculumChecklists?: Record<string, WeeklyMilestone[]>;
  onNavigateToTimeline?: () => void;
}

export const TeacherReviewWorkflow: React.FC<TeacherReviewWorkflowProps> = ({
  teachingRecords,
  classes = [],
  subjects = [],
  teachers = [],
  selectedBranch,
  currentSimulatedRole = 'Administrator',
  academicSessions = [],
  terms = [],
  curriculumChecklists = defaultChecklists,
  onNavigateToTimeline
}) => {
  // Reviews List State
  const [reviews, setReviews] = useState<TeacherReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter States
  const [filterBranch, setFilterBranch] = useState<string>(selectedBranch || 'All');
  const [filterTeacher, setFilterTeacher] = useState<string>('All');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterTerm, setFilterTerm] = useState<string>('First Term');
  const [filterSession, setFilterSession] = useState<string>('2026/2027');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReviewForHistory, setSelectedReviewForHistory] = useState<TeacherReviewRecord | null>(null);
  const [selectedReviewForCompletion, setSelectedReviewForCompletion] = useState<TeacherReviewRecord | null>(null);
  const [selectedReviewForComment, setSelectedReviewForComment] = useState<TeacherReviewRecord | null>(null);

  // Form State for Creating New Review & Follow-Up
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formSubject, setFormSubject] = useState<string>('');
  const [formClassId, setFormClassId] = useState<string>('');
  const [formBranch, setFormBranch] = useState<string>(selectedBranch || 'GN');
  const [formReviewerName, setFormReviewerName] = useState<string>('Academic Vice Principal');
  const [formActionType, setFormActionType] = useState<'Approve Record' | 'Request Correction' | 'Set Improvement Target' | 'Follow-Up Created'>('Set Improvement Target');
  const [formPerformanceSummary, setFormPerformanceSummary] = useState<string>('Teaching progress is behind schedule.');
  const [formComments, setFormComments] = useState<string>('Pacing is lagging planned milestone; revision and focused exercise exercises needed.');
  const [formCorrections, setFormCorrections] = useState<string>('Provide targeted remedial exercises for topics covered in weeks 4 to 6.');
  const [formImprovementTarget, setFormImprovementTarget] = useState<string>('Complete Fractions and Decimals revision by Week 8.');
  const [formCreateFollowUp, setFormCreateFollowUp] = useState<boolean>(true);
  const [formFollowUpTitle, setFormFollowUpTitle] = useState<string>('Complete Fractions and Decimals revision by Week 8');
  const [formFollowUpDeadline, setFormFollowUpDeadline] = useState<string>('2026-06-28');

  // Follow-Up Completion Form State
  const [completionNotes, setCompletionNotes] = useState<string>('Supervisor audited student work samples and verified completion of revision.');
  const [completedBy, setCompletedBy] = useState<string>('Academic Vice Principal');

  // Comment Addition Form State
  const [newCommentNote, setNewCommentNote] = useState<string>('');
  const [newCommentActor, setNewCommentActor] = useState<string>('Head of Department');

  // Expanded History Card Accordions
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(new Set(['rev-act-101']));

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (selectedBranch && selectedBranch !== 'All') {
      setFilterBranch(selectedBranch);
      setFormBranch(selectedBranch);
    }
  }, [selectedBranch]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teacher-reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error("Failed to fetch teacher reviews", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback teacher roster
  const activeTeachers = useMemo(() => {
    if (teachers && teachers.length > 0) return teachers;
    return [
      { id: 'staff-1', name: 'Aisha Garba', branch: 'GN', subjects: ['Primary Mathematics'], classesAssigned: ['Primary 5 - Gold'] },
      { id: 'staff-2', name: 'Musa Abdullahi', branch: 'GN', subjects: ['Junior Secondary Science'], classesAssigned: ['Junior Sec 1 - Alpha'] },
      { id: 'staff-3', name: 'Fatima Umar', branch: 'RS', subjects: ['Nursery Literacy'], classesAssigned: ['Nursery 2 - Rose'] },
      { id: 'staff-4', name: 'Aliyu Usman', branch: 'GN', subjects: ['Basic English & Grammar'], classesAssigned: ['Primary 4 - Diamond'] },
      { id: 'staff-5', name: 'Zainab Danfulani', branch: 'RS', subjects: ['Islamic Studies & Arabic'], classesAssigned: ['Primary 3 - Emerald'] },
      { id: 'staff-6', name: 'Ibrahim Kangiwa', branch: 'GN', subjects: ['Social Studies & Civics'], classesAssigned: ['Primary 6 - Silver'] }
    ];
  }, [teachers]);

  // Set default teacher in form on load
  useEffect(() => {
    if (!formTeacherId && activeTeachers.length > 0) {
      const t = activeTeachers[0];
      setFormTeacherId(t.id);
      setFormSubject(t.subjects ? t.subjects[0] : 'Primary Mathematics');
      setFormClassId(t.classesAssigned ? t.classesAssigned[0] : 'Primary 5 - Gold');
      setFormBranch(t.branch || 'GN');
    }
  }, [activeTeachers, formTeacherId]);

  // Handle teacher selection change in form
  const handleTeacherChangeInForm = (teacherId: string) => {
    setFormTeacherId(teacherId);
    const teacher = activeTeachers.find(t => t.id === teacherId);
    if (teacher) {
      setFormSubject(teacher.subjects ? teacher.subjects[0] : 'Primary Mathematics');
      setFormClassId(teacher.classesAssigned ? teacher.classesAssigned[0] : 'Primary 5 - Gold');
      setFormBranch(teacher.branch || 'GN');
    }
  };

  // Submit New Review & Follow-Up
  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = activeTeachers.find(t => t.id === formTeacherId);
    if (!teacher) {
      alert("Please select a valid teacher.");
      return;
    }

    try {
      const payload = {
        teacherId: formTeacherId,
        teacherName: teacher.name,
        subject: formSubject || 'Primary Mathematics',
        classId: formClassId || 'Primary 5 - Gold',
        branch: formBranch || 'GN',
        term: filterTerm === 'All' ? 'First Term' : filterTerm,
        academicSession: filterSession === 'All' ? '2026/2027' : filterSession,
        reviewerName: formReviewerName || 'Academic Supervisor',
        actionType: formActionType,
        performanceSummary: formPerformanceSummary,
        comments: formComments,
        correctionsRequested: formCorrections,
        improvementTarget: formImprovementTarget,
        followUpTaskTitle: formCreateFollowUp ? formFollowUpTitle : undefined,
        followUpDeadline: formCreateFollowUp ? formFollowUpDeadline : undefined
      };

      const res = await fetch('/api/teacher-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchReviews();
        setIsCreateModalOpen(false);
        alert("Teacher review and follow-up task recorded. The task is synchronized with the Calendar & Operations Timeline.");
      } else {
        alert("Failed to record review.");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting review.");
    }
  };

  // Mark Follow-Up Completed
  const handleCompleteFollowUp = async () => {
    if (!selectedReviewForCompletion) return;
    try {
      const res = await fetch(`/api/teacher-reviews/${selectedReviewForCompletion.id}/follow-up-complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionNotes,
          completedBy
        })
      });

      if (res.ok) {
        await fetchReviews();
        setSelectedReviewForCompletion(null);
        alert("Follow-up marked as Completed. Audit history and timeline updated.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to mark completion.");
    }
  };

  // Add Comment / Audit Entry
  const handleAddAuditEntry = async () => {
    if (!selectedReviewForComment || !newCommentNote.trim()) return;
    try {
      const res = await fetch(`/api/teacher-reviews/${selectedReviewForComment.id}/audit-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Management Follow-Up Note',
          actor: newCommentActor,
          notes: newCommentNote
        })
      });

      if (res.ok) {
        await fetchReviews();
        setSelectedReviewForComment(null);
        setNewCommentNote('');
      }
    } catch (e) {
      console.error(e);
      alert("Failed to add note.");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedReviewIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (filterBranch !== 'All') {
        const matchBranch = r.branch === filterBranch ||
          (filterBranch === 'GN' && (r.branch === 'Gawun Nama' || r.branch === 'GN')) ||
          (filterBranch === 'RS' && (r.branch === 'Runjin Sambo' || r.branch === 'RS'));
        if (!matchBranch) return false;
      }

      if (filterTeacher !== 'All' && r.teacherId !== filterTeacher && r.teacherName !== filterTeacher) {
        return false;
      }

      if (filterSubject !== 'All' && r.subject !== filterSubject && !r.subject.includes(filterSubject)) {
        return false;
      }

      if (filterClass !== 'All' && r.classId !== filterClass) {
        return false;
      }

      if (filterStatus !== 'All' && r.status !== filterStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = r.teacherName.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.classId.toLowerCase().includes(q) ||
          r.reviewerName.toLowerCase().includes(q) ||
          r.comments.toLowerCase().includes(q) ||
          (r.improvementTarget && r.improvementTarget.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [reviews, filterBranch, filterTeacher, filterSubject, filterClass, filterStatus, searchQuery]);

  // Status Metrics
  const reviewCounts = useMemo(() => {
    return {
      total: filteredReviews.length,
      pending: filteredReviews.filter(r => r.status === 'Pending Follow-Up').length,
      completed: filteredReviews.filter(r => r.status === 'Follow-Up Completed').length,
      approved: filteredReviews.filter(r => r.status === 'Approved').length,
      correction: filteredReviews.filter(r => r.status === 'Correction Requested').length
    };
  }, [filteredReviews]);

  return (
    <div id="teacher-review-followup-workflow" className="space-y-6">
      {/* ⚠️ Management Governance & Immutable Audit Header Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300 mt-0.5">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  Teacher Review &amp; Follow-Up Workflow
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-400/30">
                  Timeline Synced • Immutable Audit History
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                Authorized management can review performance data, approve records, request corrections, set improvement targets, and schedule follow-up tasks with deadlines. <strong>All historical reviews, comments, and resolutions are permanently preserved.</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Review / Follow-Up</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Follow-Ups</div>
            <div className="text-base font-extrabold text-amber-300 font-mono">{reviewCounts.pending} Actions</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Completed &amp; Verified</div>
            <div className="text-base font-extrabold text-emerald-300 font-mono">{reviewCounts.completed} Resolved</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Approved Records</div>
            <div className="text-base font-extrabold text-blue-300 font-mono">{reviewCounts.approved} Approved</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Corrections Requested</div>
            <div className="text-base font-extrabold text-rose-300 font-mono">{reviewCounts.correction} Items</div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
              Audit &amp; Workflow Filters
            </h4>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teacher, target, comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {/* Branch */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Branch
            </label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Branches</option>
              <option value="GN">Gawun Nama (GN)</option>
              <option value="RS">Runjin Sambo (RS)</option>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Teachers</option>
              {activeTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Subjects</option>
              <option value="Primary Mathematics">Primary Mathematics</option>
              <option value="Junior Secondary Science">Junior Secondary Science</option>
              <option value="Nursery Literacy">Nursery Literacy</option>
              <option value="Basic English & Grammar">Basic English & Grammar</option>
              <option value="Islamic Studies & Arabic">Islamic Studies & Arabic</option>
              <option value="Social Studies & Civics">Social Studies & Civics</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Follow-Up">Pending Follow-Up</option>
              <option value="Follow-Up Completed">Follow-Up Completed</option>
              <option value="Approved">Approved</option>
              <option value="Correction Requested">Correction Requested</option>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="2026/2027">2026/2027 (Active)</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
              <option value="All">All Sessions</option>
            </select>
          </div>
        </div>
      </div>

      {/* REVIEWS & FOLLOW-UP AUDIT LOGS LIST */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
            No management review records found matching the current filters.
          </div>
        ) : (
          filteredReviews.map((review) => {
            const isExpanded = expandedReviewIds.has(review.id);
            const isPendingFollowUp = review.status === 'Pending Follow-Up';

            return (
              <div
                key={review.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Header Card */}
                <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      review.status === 'Follow-Up Completed' || review.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : review.status === 'Pending Follow-Up'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {review.status === 'Follow-Up Completed' || review.status === 'Approved' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {review.teacherName}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          ({review.subject} • {review.classId})
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {review.branch}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5 flex-wrap">
                        <span>Reviewed by <strong>{review.reviewerName}</strong></span>
                        <span>•</span>
                        <span className="font-mono">📅 {review.reviewDate}</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-700">{review.actionType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges & Action Buttons */}
                  <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                      review.status === 'Follow-Up Completed'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : review.status === 'Approved'
                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                        : review.status === 'Pending Follow-Up'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-rose-100 text-rose-900 border-rose-300'
                    }`}>
                      {review.status}
                    </span>

                    {/* Mark Completed Button */}
                    {isPendingFollowUp && (
                      <button
                        onClick={() => setSelectedReviewForCompletion(review)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center space-x-1 cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}

                    {/* Add Note Button */}
                    <button
                      onClick={() => setSelectedReviewForComment(review)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl font-bold text-xs transition-all flex items-center space-x-1 cursor-pointer"
                      title="Add follow-up comment"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Add Comment</span>
                    </button>

                    {/* Expand/Collapse Accordion */}
                    <button
                      onClick={() => toggleExpand(review.id)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                      title={isExpanded ? "Collapse audit history" : "Expand audit history"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Review Body */}
                <div className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* Issue / Performance Context */}
                  {review.performanceSummary && (
                    <div className="bg-amber-50/70 border border-amber-200/70 p-3 rounded-xl flex items-start space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                          Identified Issue / Performance Observation:
                        </div>
                        <p className="text-amber-950 font-medium mt-0.5">{review.performanceSummary}</p>
                      </div>
                    </div>
                  )}

                  {/* Core Review Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Management Comments */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Management Comments &amp; Feedback:
                      </div>
                      <p className="text-slate-800 leading-relaxed font-sans">{review.comments || "None provided"}</p>
                    </div>

                    {/* Corrections Requested */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Corrections Requested:
                      </div>
                      <p className="text-slate-800 leading-relaxed font-sans">{review.correctionsRequested || "None requested"}</p>
                    </div>

                    {/* Improvement Target & Follow-Up Action */}
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1">
                      <div className="font-bold text-indigo-900 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                        <Target className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Improvement Target &amp; Action:</span>
                      </div>
                      <p className="text-indigo-950 font-bold leading-relaxed">{review.improvementTarget || "Standard curriculum alignment"}</p>
                      {review.followUpDeadline && (
                        <div className="pt-1 text-[11px] text-indigo-700 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Deadline: <strong>{review.followUpDeadline}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Follow-Up Completion Notice */}
                  {review.followUpStatus === 'Completed' && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-emerald-900 text-[11px] uppercase">
                          Follow-Up Resolution (Verified on {review.followUpCompletedDate}):
                        </div>
                        <p className="text-emerald-950 mt-0.5">{review.followUpCompletedNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Expandable Immutable Audit Trail */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h5 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                          <History className="w-3.5 h-3.5 text-slate-500" />
                          <span>Immutable Audit Trail &amp; Follow-Up Timeline</span>
                        </h5>
                        <span className="text-[10px] text-slate-400 italic">Historical records cannot be deleted</span>
                      </div>

                      <div className="space-y-2 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {review.auditLogs.map((log) => (
                          <div key={log.id} className="relative pl-3 space-y-0.5">
                            <div className="w-2 h-2 rounded-full bg-indigo-600 absolute -left-[14px] top-1.5 ring-2 ring-white" />
                            <div className="flex items-center space-x-2 text-[10px]">
                              <span className="font-bold text-slate-800">{log.action}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 font-medium">{log.actor}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-600 text-[11px]">{log.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================
          MODAL 1: INITIATE REVIEW, TARGET & FOLLOW-UP TASK
          ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-base">Initiate Teacher Review &amp; Follow-Up</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200/70 flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-indigo-900 leading-relaxed text-[11px]">
                  <strong>Operations Timeline Sync:</strong> Setting an improvement target or follow-up action will automatically publish a scheduled task into the <strong>Calendar &amp; Operations Timeline</strong> with the assigned deadline.
                </p>
              </div>

              {/* Teacher & Scope Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Select Teacher
                  </label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => handleTeacherChangeInForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none"
                    required
                  >
                    {activeTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.branch})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Subject &amp; Class
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:bg-white focus:border-indigo-500 outline-none"
                    />
                    <input
                      type="text"
                      value={formClassId}
                      onChange={(e) => setFormClassId(e.target.value)}
                      placeholder="Class"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:bg-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Type & Reviewer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Management Action Type
                  </label>
                  <select
                    value={formActionType}
                    onChange={(e) => setFormActionType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none"
                  >
                    <option value="Set Improvement Target">🎯 Set Improvement Target</option>
                    <option value="Request Correction">⚠️ Request Correction</option>
                    <option value="Follow-Up Created">📋 Create Follow-Up Task</option>
                    <option value="Approve Record">✅ Approve Teaching Record</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Reviewer Name / Title
                  </label>
                  <input
                    type="text"
                    value={formReviewerName}
                    onChange={(e) => setFormReviewerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Performance Summary / Issue */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Observed Performance Issue / Context
                </label>
                <input
                  type="text"
                  value={formPerformanceSummary}
                  onChange={(e) => setFormPerformanceSummary(e.target.value)}
                  placeholder="e.g. Teaching progress is behind schedule on Fractions unit."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Comments & Corrections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Management Comments
                  </label>
                  <textarea
                    rows={3}
                    value={formComments}
                    onChange={(e) => setFormComments(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="Provide constructive guidance..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Corrections Required (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formCorrections}
                    onChange={(e) => setFormCorrections(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="Specific corrections or revisions..."
                  />
                </div>
              </div>

              {/* Improvement Target & Follow-Up Task */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="block font-bold text-indigo-900 mb-1 uppercase tracking-wider text-[10px]">
                    Improvement Target
                  </label>
                  <input
                    type="text"
                    value={formImprovementTarget}
                    onChange={(e) => {
                      setFormImprovementTarget(e.target.value);
                      if (!formFollowUpTitle) setFormFollowUpTitle(e.target.value);
                    }}
                    placeholder="e.g. Complete Fractions and Decimals revision by Week 8."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      Follow-Up Task Title (Timeline)
                    </label>
                    <input
                      type="text"
                      value={formFollowUpTitle}
                      onChange={(e) => setFormFollowUpTitle(e.target.value)}
                      placeholder="Task title for Timeline..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      Follow-Up Deadline Date
                    </label>
                    <input
                      type="date"
                      value={formFollowUpDeadline}
                      onChange={(e) => setFormFollowUpDeadline(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Publish Review &amp; Timeline Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: MARK FOLLOW-UP AS COMPLETED
          ========================================================= */}
      {selectedReviewForCompletion && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base">Mark Follow-Up as Completed</h3>
              </div>
              <button
                onClick={() => setSelectedReviewForCompletion(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Target Action:</div>
                <div className="font-bold text-slate-900">{selectedReviewForCompletion.improvementTarget || selectedReviewForCompletion.followUpTaskTitle}</div>
                <div className="text-[11px] text-slate-500">Teacher: <strong>{selectedReviewForCompletion.teacherName}</strong> ({selectedReviewForCompletion.subject})</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Supervisor Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                  placeholder="Record verification notes (e.g. audited student exercise books, observed revision lesson)..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Verified By (Supervisor Name / Designation)
                </label>
                <input
                  type="text"
                  value={completedBy}
                  onChange={(e) => setCompletedBy(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedReviewForCompletion(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteFollowUp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm &amp; Update Timeline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: ADD MANAGEMENT COMMENT / AUDIT NOTE
          ========================================================= */}
      {selectedReviewForComment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-base">Add Management Audit Note</h3>
              </div>
              <button
                onClick={() => setSelectedReviewForComment(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Supervisor Name / Role
                </label>
                <input
                  type="text"
                  value={newCommentActor}
                  onChange={(e) => setNewCommentActor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Comment / Observation
                </label>
                <textarea
                  rows={4}
                  value={newCommentNote}
                  onChange={(e) => setNewCommentNote(e.target.value)}
                  placeholder="Type follow-up observation or feedback..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedReviewForComment(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAuditEntry}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save to Audit Trail</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
