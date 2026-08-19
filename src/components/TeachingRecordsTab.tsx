import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Save,
  Trash2,
  Edit3,
  Eye,
  Camera,
  Upload,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  Printer,
  ChevronDown,
  Calendar,
  Layers,
  Sparkles,
  School,
  User,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Download,
  Info,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  CheckSquare,
  Users,
  Award,
  History,
  Smartphone
} from 'lucide-react';
import { 
  TeachingRecord, 
  TeachingRecordStatus, 
  SupportingEvidence, 
  EvidenceType,
  SAMPLE_EVIDENCE_PRESETS,
  CurriculumPacingStatus
} from '../data/teachingRecordData';
import { WeeklyMilestone, defaultChecklists } from '../data/curriculumData';
import { CurriculumComparisonView } from './CurriculumComparisonView';
import { PacingProgressDashboard } from './PacingProgressDashboard';
import { TeacherComplianceDashboard } from './TeacherComplianceDashboard';
import { TeachingProgressDashboard } from './TeachingProgressDashboard';
import { TeacherPerformanceEvaluation } from './TeacherPerformanceEvaluation';
import { TeacherReviewWorkflow } from './TeacherReviewWorkflow';
import { TeacherPersonalDashboard } from './TeacherPersonalDashboard';
import { ManagementTeachingDashboard } from './ManagementTeachingDashboard';
import { TeachingPerformanceReports } from './TeachingPerformanceReports';

interface TeachingRecordsTabProps {
  teachingRecords: TeachingRecord[];
  setTeachingRecords: React.Dispatch<React.SetStateAction<TeachingRecord[]>>;
  classes: any[];
  subjects: any[];
  teachers: any[];
  selectedBranch: string;
  currentSimulatedRole: string;
  academicSessions?: any[];
  terms?: any[];
  curriculumChecklists?: Record<string, WeeklyMilestone[]>;
  students?: any[];
  lessonPlanDrafts?: any[];
  onViewStudentProfile?: (student: any) => void;
  onNavigateToTab?: (tab: string, subTab?: string) => void;
}

type SubViewType = 'teacherDashboard' | 'managementDashboard' | 'records' | 'comparison' | 'analytics' | 'compliance' | 'evaluation' | 'reviewWorkflow' | 'reports';

export const TeachingRecordsTab: React.FC<TeachingRecordsTabProps> = ({
  teachingRecords,
  setTeachingRecords,
  classes,
  subjects,
  teachers,
  selectedBranch,
  currentSimulatedRole,
  academicSessions = [],
  terms = [],
  curriculumChecklists = defaultChecklists,
  students = [],
  lessonPlanDrafts = [],
  onViewStudentProfile,
  onNavigateToTab
}) => {
  // Active Main SubView
  const [activeSubView, setActiveSubView] = useState<SubViewType>('records');

  // Supervisor verification check
  const isSupervisor = useMemo(() => {
    const role = (currentSimulatedRole || '').toLowerCase();
    return role.includes('admin') || role.includes('principal') || role.includes('proprietor') || role.includes('head') || role.includes('super');
  }, [currentSimulatedRole]);

  // Current logged in teacher identity
  const currentTeacher = useMemo(() => {
    if (teachers && teachers.length > 0) {
      return teachers[0];
    }
    return {
      id: 'staff-1',
      name: 'Aisha Garba',
      email: 'aisha.garba@sams.edu.ng'
    };
  }, [teachers]);

  // Branch classes
  const branchClasses = useMemo(() => {
    if (!selectedBranch || selectedBranch === 'All') return classes;
    return classes.filter(c => c.branch === selectedBranch || !c.branch);
  }, [classes, selectedBranch]);

  // Active filters for Records View
  const [statusFilter, setStatusFilter] = useState<'All' | TeachingRecordStatus>('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Record ID for detail view / editing
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  
  // Operations Timeline Deadlines state (Single Source of Truth)
  const [eventTasks, setEventTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const fetchTimelineTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await fetch('/api/event_tasks');
      if (res.ok) {
        const data = await res.json();
        setEventTasks(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch event tasks for timeline sync:', e);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTimelineTasks();
  }, []);

  // UI Modal / View states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeEvidenceLightbox, setActiveEvidenceLightbox] = useState<SupportingEvidence | null>(null);

  // Form State for editing or creating a teaching record
  const [formData, setFormData] = useState<Partial<TeachingRecord>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Reviewer Form State
  const [reviewAction, setReviewAction] = useState<'Reviewed' | 'Correction Required'>('Reviewed');
  const [reviewerFeedback, setReviewerFeedback] = useState('');
  const [correctionInstructions, setCorrectionInstructions] = useState('');

  // Evidence upload helper state
  const [activeEvidenceType, setActiveEvidenceType] = useState<EvidenceType>('board');
  const [evidenceNoteInput, setEvidenceNoteInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Flagged Student input state within editor
  const [selectedStudentForFlag, setSelectedStudentForFlag] = useState<string>('');
  const [customStudentNameForFlag, setCustomStudentNameForFlag] = useState<string>('');
  const [flagCategory, setFlagCategory] = useState<'Not Completed' | 'Absent' | 'Needs Support'>('Not Completed');
  const [flagNotes, setFlagNotes] = useState<string>('');
  const [flagInterventionPlan, setFlagInterventionPlan] = useState<string>('');

  // Enrolled students in the currently selected class in the editor form
  const currentClassStudents = useMemo(() => {
    const targetClass = formData.classId || '';
    if (!students || students.length === 0) return [];
    return students.filter(s => {
      if (!targetClass) return true;
      return s.grade === targetClass || s.classId === targetClass || s.className === targetClass ||
        (targetClass.includes('Primary 5') && (s.grade?.includes('Primary 5') || s.grade?.includes('Grade 5') || s.classId?.includes('P5')));
    });
  }, [students, formData.classId]);

  // Live computed work coverage percentage in editor
  const liveCoveragePercentage = useMemo(() => {
    const total = Number(formData.totalStudentsInClass) || 0;
    const completed = Number(formData.completedWorkCount) || 0;
    if (total <= 0) return 0;
    return Math.round((completed / total) * 100);
  }, [formData.totalStudentsInClass, formData.completedWorkCount]);

  // Filtered Teaching Records
  const filteredRecords = useMemo(() => {
    return teachingRecords.filter(record => {
      // Branch filter
      if (selectedBranch && selectedBranch !== 'All') {
        const branchMatch = record.branch === selectedBranch || 
          (selectedBranch === 'GN' && (record.branch === 'Gawun Nama' || record.branch === 'GN')) ||
          (selectedBranch === 'RS' && (record.branch === 'Runjin Sambo' || record.branch === 'RS'));
        if (!branchMatch) return false;
      }

      // Status filter
      if (statusFilter !== 'All' && record.status !== statusFilter) {
        return false;
      }

      // Class filter
      if (selectedClassFilter !== 'All' && record.classId !== selectedClassFilter) {
        return false;
      }

      // Subject filter
      if (selectedSubjectFilter !== 'All' && record.subject !== selectedSubjectFilter) {
        return false;
      }

      // Week filter
      if (selectedWeekFilter !== 'All' && record.week.toString() !== selectedWeekFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          record.topic.toLowerCase().includes(q) ||
          record.subTopic.toLowerCase().includes(q) ||
          record.lessonTitle.toLowerCase().includes(q) ||
          record.classId.toLowerCase().includes(q) ||
          record.subject.toLowerCase().includes(q) ||
          record.teacherName.toLowerCase().includes(q) ||
          record.whatWasTaught.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [teachingRecords, selectedBranch, statusFilter, selectedClassFilter, selectedSubjectFilter, selectedWeekFilter, searchQuery]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = teachingRecords.length;
    const drafts = teachingRecords.filter(r => r.status === 'Draft').length;
    const submitted = teachingRecords.filter(r => r.status === 'Submitted').length;
    const reviewed = teachingRecords.filter(r => r.status === 'Reviewed').length;
    const correctionRequired = teachingRecords.filter(r => r.status === 'Correction Required').length;
    return { total, drafts, submitted, reviewed, correctionRequired };
  }, [teachingRecords]);

  // Selected Record Object
  const selectedRecord = useMemo(() => {
    return teachingRecords.find(r => r.id === selectedRecordId) || null;
  }, [teachingRecords, selectedRecordId]);

  // Available Scheme of Work milestones for the currently selected Subject & Class in form
  const availableFormMilestones = useMemo(() => {
    const sub = formData.subject || 'Primary Mathematics';
    const classId = formData.classId || 'Primary 5 - Gold';
    const key = `${classId}-${sub}`;
    if (curriculumChecklists[key]) return curriculumChecklists[key];
    if (curriculumChecklists[sub]) return curriculumChecklists[sub];
    if (defaultChecklists[sub]) return defaultChecklists[sub];
    return Array.from({ length: 10 }, (_, i) => ({
      week: i + 1,
      topic: `${sub} - Week ${i + 1} Module`,
      objectives: `Standard syllabus objectives for Week ${i + 1}`,
      status: 'Not Started'
    }));
  }, [formData.subject, formData.classId, curriculumChecklists]);

  // Real-time pacing preview inside record editor
  const formPacingPreview = useMemo(() => {
    if (!formData.week) return null;
    const taughtWeek = Number(formData.week);
    const plannedWeek = Number(formData.schemeMilestoneWeek) || taughtWeek;

    if (taughtWeek < plannedWeek) {
      return {
        status: 'Ahead' as CurriculumPacingStatus,
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
        text: `🚀 Ahead of Schedule: Logging for Week ${taughtWeek} against Week ${plannedWeek} milestone (${plannedWeek - taughtWeek} week(s) in advance).`
      };
    } else if (taughtWeek > plannedWeek) {
      return {
        status: 'Behind Schedule' as CurriculumPacingStatus,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        text: `⚠️ Behind Schedule: Logging for Week ${taughtWeek} against Week ${plannedWeek} milestone (${taughtWeek - plannedWeek} week(s) behind).`
      };
    } else {
      return {
        status: 'On Schedule' as CurriculumPacingStatus,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        text: `✅ On Schedule: Logging for Week ${taughtWeek} matching Scheme of Work Week ${plannedWeek}.`
      };
    }
  }, [formData.week, formData.schemeMilestoneWeek]);

  // Initialize a new record
  const handleOpenCreateNew = (prefillMilestone?: WeeklyMilestone, prefillSubject?: string, prefillClass?: string) => {
    const defaultBranch = selectedBranch && selectedBranch !== 'All' ? selectedBranch : 'GN';
    const defaultClass = prefillClass || branchClasses[0]?.name || 'Primary 5 - Gold';
    const defaultSubject = prefillSubject || subjects[0]?.name || 'Primary Mathematics';
    const today = new Date().toISOString().split('T')[0];

    // Compute expected class count from enrolled students
    const matchingStudents = students?.filter(s => s.grade === defaultClass || s.classId === defaultClass) || [];
    const initialTotal = matchingStudents.length > 0 ? matchingStudents.length : 30;

    setFormData({
      id: `tr-${Date.now()}`,
      branch: defaultBranch,
      academicSession: '2025/2026',
      term: 'First Term',
      classId: defaultClass,
      subject: defaultSubject,
      week: prefillMilestone ? prefillMilestone.week : 5,
      schemeMilestoneWeek: prefillMilestone ? prefillMilestone.week : 5,
      date: today,
      time: '08:30 AM - 09:15 AM',
      teacherId: currentTeacher?.id || 'staff-1',
      teacherName: currentTeacher?.name || 'Aisha Garba',
      topic: prefillMilestone ? prefillMilestone.topic : '',
      subTopic: '',
      lessonTitle: prefillMilestone ? prefillMilestone.topic : '',
      whatWasTaught: prefillMilestone ? `Delivered classroom instruction for: ${prefillMilestone.topic}. ` : '',
      boardWork: '',
      studentNotebookWork: '',
      pagesCovered: '',
      classwork: '',
      homework: '',
      teachingActivities: '',
      teacherRemarks: '',
      evidence: [],
      // Student Book & Classwork Coverage Tracking
      totalStudentsInClass: initialTotal,
      completedWorkCount: Math.max(0, initialTotal - 3),
      partiallyCompletedCount: 2,
      notCompletedCount: 1,
      absentCount: 0,
      workCoveragePercentage: Math.round(((initialTotal - 3) / initialTotal) * 100),
      flaggedStudents: [],
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setValidationErrors({});
    setSelectedStudentForFlag('');
    setCustomStudentNameForFlag('');
    setFlagCategory('Not Completed');
    setFlagNotes('');
    setFlagInterventionPlan('');
    setIsEditorOpen(true);
  };

  // Open existing record for editing
  const handleOpenEdit = (record: TeachingRecord) => {
    setFormData({ 
      ...record,
      totalStudentsInClass: record.totalStudentsInClass ?? 30,
      completedWorkCount: record.completedWorkCount ?? 27,
      partiallyCompletedCount: record.partiallyCompletedCount ?? 2,
      notCompletedCount: record.notCompletedCount ?? 1,
      absentCount: record.absentCount ?? 0,
      workCoveragePercentage: record.workCoveragePercentage ?? 90,
      flaggedStudents: record.flaggedStudents ? [...record.flaggedStudents] : []
    });
    setValidationErrors({});
    setSelectedStudentForFlag('');
    setCustomStudentNameForFlag('');
    setFlagCategory('Not Completed');
    setFlagNotes('');
    setFlagInterventionPlan('');
    setIsEditorOpen(true);
  };

  // Open detail modal
  const handleOpenDetail = (record: TeachingRecord) => {
    setSelectedRecordId(record.id);
    setIsDetailModalOpen(true);
  };

  // Open supervisor review modal
  const handleOpenReview = (record: TeachingRecord) => {
    setSelectedRecordId(record.id);
    setReviewAction('Reviewed');
    setReviewerFeedback(record.reviewerFeedback || '');
    setCorrectionInstructions(record.correctionInstructions || '');
    setIsReviewModalOpen(true);
  };

  // Add a flagged student in the editor
  const handleAddFlaggedStudent = () => {
    let studentId = selectedStudentForFlag;
    let studentName = customStudentNameForFlag.trim();
    let admissionNumber = '';

    if (studentId) {
      const found = students.find(s => s.id === studentId);
      if (found) {
        studentName = found.fullName || `${found.firstName} ${found.lastName}` || found.name;
        admissionNumber = found.admissionNumber || found.id;
      }
    }

    if (!studentName) {
      alert('⚠️ Please select a student from the class roster or type the student name.');
      return;
    }

    const newFlag = {
      studentId: studentId || `stu-flag-${Date.now()}`,
      studentName,
      admissionNumber: admissionNumber || undefined,
      classId: formData.classId || 'Primary 5 - Gold',
      category: flagCategory,
      notes: flagNotes.trim() || undefined,
      interventionPlan: flagInterventionPlan.trim() || undefined
    };

    const updatedFlagged = [...(formData.flaggedStudents || []), newFlag];
    setFormData({
      ...formData,
      flaggedStudents: updatedFlagged
    });

    // Reset inputs
    setSelectedStudentForFlag('');
    setCustomStudentNameForFlag('');
    setFlagNotes('');
    setFlagInterventionPlan('');
  };

  // Remove a flagged student
  const handleRemoveFlaggedStudent = (index: number) => {
    const updated = (formData.flaggedStudents || []).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      flaggedStudents: updated
    });
  };

  // Save as Draft or Submit
  const handleSaveRecord = (targetStatus: 'Draft' | 'Submitted') => {
    // Validate required fields when submitting
    const errors: Record<string, string> = {};
    if (!formData.topic?.trim()) errors.topic = 'Topic taught is required';
    if (!formData.whatWasTaught?.trim()) errors.whatWasTaught = 'Summary of what was taught is required';
    if (!formData.boardWork?.trim()) errors.boardWork = 'Board notes & layout description are required';
    if (!formData.studentNotebookWork?.trim()) errors.studentNotebookWork = 'Notebook work instructions are required';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.classId) errors.classId = 'Class is required';
    if (!formData.subject) errors.subject = 'Subject is required';

    if (targetStatus === 'Submitted' && Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      alert('⚠️ Please fill in all mandatory teaching details before submitting.');
      return;
    }

    const totalStudents = Number(formData.totalStudentsInClass) || 30;
    const completedCount = Number(formData.completedWorkCount) || 0;
    const partialCount = Number(formData.partiallyCompletedCount) || 0;
    const notCompletedCount = Number(formData.notCompletedCount) || 0;
    const absentCount = Number(formData.absentCount) || 0;
    const computedPercentage = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;

    const timestamp = new Date().toISOString();
    const updatedRecord: TeachingRecord = {
      id: formData.id || `tr-${Date.now()}`,
      branch: formData.branch || selectedBranch || 'GN',
      academicSession: formData.academicSession || '2025/2026',
      term: formData.term || 'First Term',
      classId: formData.classId || branchClasses[0]?.name || 'Primary 5 - Gold',
      subject: formData.subject || subjects[0]?.name || 'Primary Mathematics',
      week: Number(formData.week) || 1,
      schemeMilestoneWeek: formData.schemeMilestoneWeek ? Number(formData.schemeMilestoneWeek) : Number(formData.week) || 1,
      date: formData.date || new Date().toISOString().split('T')[0],
      time: formData.time || '08:30 AM - 09:15 AM',
      teacherId: formData.teacherId || currentTeacher?.id || 'staff-1',
      teacherName: formData.teacherName || currentTeacher?.name || 'Aisha Garba',
      topic: formData.topic || '',
      subTopic: formData.subTopic || '',
      lessonTitle: formData.lessonTitle || formData.topic || '',
      whatWasTaught: formData.whatWasTaught || '',
      boardWork: formData.boardWork || '',
      studentNotebookWork: formData.studentNotebookWork || '',
      pagesCovered: formData.pagesCovered || '',
      classwork: formData.classwork || '',
      homework: formData.homework || '',
      teachingActivities: formData.teachingActivities || '',
      teacherRemarks: formData.teacherRemarks || '',
      evidence: formData.evidence || [],
      // Coverage tracking
      totalStudentsInClass: totalStudents,
      completedWorkCount: completedCount,
      partiallyCompletedCount: partialCount,
      notCompletedCount: notCompletedCount,
      absentCount: absentCount,
      workCoveragePercentage: computedPercentage,
      flaggedStudents: formData.flaggedStudents || [],
      status: targetStatus,
      reviewedBy: targetStatus === 'Draft' ? undefined : formData.reviewedBy,
      reviewedAt: targetStatus === 'Draft' ? undefined : formData.reviewedAt,
      reviewerFeedback: targetStatus === 'Draft' ? undefined : formData.reviewerFeedback,
      correctionInstructions: targetStatus === 'Draft' ? undefined : formData.correctionInstructions,
      createdAt: formData.createdAt || timestamp,
      updatedAt: timestamp,
      submittedAt: targetStatus === 'Submitted' ? timestamp : formData.submittedAt
    };

    setTeachingRecords(prev => {
      const exists = prev.some(r => r.id === updatedRecord.id);
      if (exists) {
        return prev.map(r => r.id === updatedRecord.id ? updatedRecord : r);
      }
      return [updatedRecord, ...prev];
    });

    // Timeline Single Source of Truth Synchronization
    if (targetStatus === 'Submitted') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Find matching teaching deadline task
      const targetTask = eventTasks.find(t => 
        (t.taskType === 'teaching_record' && (t.week === updatedRecord.week || !t.week)) ||
        t.id === 'tsk-td-1'
      );

      if (targetTask) {
        let isLate = false;
        let diffDays = 0;
        if (targetTask.dueDate) {
          const dueDateTime = new Date(`${targetTask.dueDate}T${targetTask.dueTime || '17:00'}:00`);
          if (now > dueDateTime) {
            isLate = true;
            diffDays = Math.max(1, Math.ceil((now.getTime() - dueDateTime.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }

        const updatedTaskPayload = {
          ...targetTask,
          status: 'Completed',
          submissionDate: todayStr,
          submissionTime: timeStr,
          submissionStatus: isLate ? 'Submitted Late' : 'Submitted On Time',
          daysLate: isLate ? diffDays : 0,
          linkedTeachingRecordId: updatedRecord.id
        };

        // Persist to timeline API
        fetch(`/api/event_tasks/${targetTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTaskPayload)
        }).then(res => {
          if (res.ok) {
            fetchTimelineTasks();
          }
        }).catch(err => {
          console.error('Failed to sync teaching record submission with timeline:', err);
        });
      }
    }

    setIsEditorOpen(false);
    setSelectedRecordId(updatedRecord.id);
  };

  // Submit Supervisor Review
  const handleSubmitReview = () => {
    if (!selectedRecord) return;

    if (reviewAction === 'Correction Required' && !correctionInstructions.trim()) {
      alert('⚠️ Please specify correction instructions for the teacher.');
      return;
    }

    const timestamp = new Date().toISOString();
    const reviewerName = currentSimulatedRole || 'Academic Supervisor';

    const updatedRecord: TeachingRecord = {
      ...selectedRecord,
      status: reviewAction,
      reviewedBy: reviewerName,
      reviewedAt: timestamp,
      reviewerFeedback: reviewerFeedback.trim() || undefined,
      correctionInstructions: reviewAction === 'Correction Required' ? correctionInstructions.trim() : undefined,
      updatedAt: timestamp
    };

    setTeachingRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    setIsReviewModalOpen(false);
  };

  // Delete a record
  const handleDeleteRecord = (id: string) => {
    if (confirm('Are you sure you want to delete this teaching record? This action cannot be undone.')) {
      setTeachingRecords(prev => prev.filter(r => r.id !== id));
      if (selectedRecordId === id) {
        setSelectedRecordId(null);
        setIsDetailModalOpen(false);
      }
    }
  };

  // Handle file upload from disk or camera
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      const newEvidence: SupportingEvidence = {
        id: `ev-${Date.now()}`,
        type: activeEvidenceType,
        title: getEvidenceTypeLabel(activeEvidenceType),
        url: result,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString(),
        notes: evidenceNoteInput.trim() || undefined
      };

      setFormData(prev => ({
        ...prev,
        evidence: [...(prev.evidence || []), newEvidence]
      }));

      setEvidenceNoteInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  // Quick Preset Sample Evidence attacher
  const handleAttachPresetEvidence = (preset: typeof SAMPLE_EVIDENCE_PRESETS[0]) => {
    const newEvidence: SupportingEvidence = {
      id: `ev-${Date.now()}`,
      type: preset.type,
      title: preset.title,
      url: preset.defaultUrl,
      fileName: `${preset.type}_sample_${Date.now().toString().slice(-4)}.jpg`,
      fileSize: '1.5 MB',
      uploadedAt: new Date().toISOString(),
      notes: evidenceNoteInput.trim() || `Verified ${preset.label} documentation.`
    };

    setFormData(prev => ({
      ...prev,
      evidence: [...(prev.evidence || []), newEvidence]
    }));

    setEvidenceNoteInput('');
  };

  // Remove evidence
  const handleRemoveEvidence = (evidenceId: string) => {
    setFormData(prev => ({
      ...prev,
      evidence: (prev.evidence || []).filter(e => e.id !== evidenceId)
    }));
  };

  // Helper labels & icons
  const getEvidenceTypeLabel = (type: EvidenceType) => {
    switch (type) {
      case 'board': return 'Board Photograph';
      case 'notebook': return 'Notebook / Sample Book Photograph';
      case 'classwork': return 'Classwork Photograph';
      case 'homework': return 'Homework Evidence';
      case 'document': return 'Supporting Document';
      default: return 'Evidence';
    }
  };

  const getStatusBadge = (status: TeachingRecordStatus) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            Draft
          </span>
        );
      case 'Submitted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3 text-blue-600" />
            Submitted
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Reviewed &amp; Verified
          </span>
        );
      case 'Correction Required':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Correction Required
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 3-View Header Sub-Navigation */}
      <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveSubView('teacherDashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeSubView === 'teacherDashboard'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100 border border-indigo-200/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Teacher Dashboard</span>
          </button>

          <button
            onClick={() => setActiveSubView('managementDashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              activeSubView === 'managementDashboard'
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-700/30'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300/60'
            }`}
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Management Dashboard</span>
          </button>

          <button
            onClick={() => setActiveSubView('records')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeSubView === 'records'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Daily Teaching Records</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeSubView === 'records' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveSubView('comparison')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeSubView === 'comparison'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Scheme of Work Alignment (PLANNED vs TAUGHT vs COVERED)</span>
          </button>

          <button
            onClick={() => setActiveSubView('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeSubView === 'analytics'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>Teaching Progress Dashboard</span>
          </button>

          <button
            onClick={() => setActiveSubView('compliance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeSubView === 'compliance'
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-indigo-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Teacher Compliance Tracking</span>
          </button>

          <button
            onClick={() => setActiveSubView('evaluation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeSubView === 'evaluation'
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-amber-500/30'
                : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Teacher Performance Evaluation</span>
          </button>

          <button
            onClick={() => setActiveSubView('reviewWorkflow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeSubView === 'reviewWorkflow'
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-emerald-500/30'
                : 'bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <History className="w-4 h-4 text-emerald-500" />
            <span>Review &amp; Follow-Up Workflow</span>
          </button>

          <button
            onClick={() => setActiveSubView('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              activeSubView === 'reports'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                : 'bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100 border border-indigo-200/70'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>📑 Statutory Reports &amp; Exports</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
              activeSubView === 'reports' ? 'bg-white/25 text-white' : 'bg-indigo-200 text-indigo-900'
            }`}>
              13
            </span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleOpenCreateNew()}
          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-100 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Today's Teaching</span>
        </button>
      </div>

      {/* SUBVIEW 0A: TEACHER PERSONAL DASHBOARD (Mobile-first) */}
      {activeSubView === 'teacherDashboard' && (
        <TeacherPersonalDashboard
          teachingRecords={teachingRecords}
          setTeachingRecords={setTeachingRecords}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          selectedBranch={selectedBranch}
          currentSimulatedRole={currentSimulatedRole}
          academicSessions={academicSessions}
          terms={terms}
          curriculumChecklists={curriculumChecklists}
          onOpenCreateRecord={(milestone, sub, cls) => handleOpenCreateNew(milestone, sub, cls)}
          onOpenRecordDetail={(rec) => handleOpenDetail(rec)}
        />
      )}

      {/* SUBVIEW 0B: MANAGEMENT DASHBOARD (Institutional Oversight) */}
      {activeSubView === 'managementDashboard' && (
        <ManagementTeachingDashboard
          teachingRecords={teachingRecords}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          selectedBranch={selectedBranch}
          currentSimulatedRole={currentSimulatedRole}
          academicSessions={academicSessions}
          terms={terms}
          curriculumChecklists={curriculumChecklists}
          onSelectTeacher={(teacherId) => {
            setActiveSubView('teacherDashboard');
          }}
          onNavigateToReviewWorkflow={() => setActiveSubView('reviewWorkflow')}
        />
      )}

      {/* SUBVIEW 1: SCHEME OF WORK ALIGNMENT */}
      {activeSubView === 'comparison' && (
        <CurriculumComparisonView
          teachingRecords={teachingRecords}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          selectedBranch={selectedBranch}
          curriculumChecklists={curriculumChecklists}
          onSelectRecord={record => handleOpenDetail(record)}
          onCreateRecordForMilestone={(milestone, sub, cls) => handleOpenCreateNew(milestone, sub, cls)}
        />
      )}

      {/* SUBVIEW 2: TEACHING PROGRESS DASHBOARD (Planned vs Actual vs Student Coverage) */}
      {activeSubView === 'analytics' && (
        <TeachingProgressDashboard
          teachingRecords={teachingRecords}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          selectedBranch={selectedBranch}
          curriculumChecklists={curriculumChecklists}
          academicSessions={academicSessions}
          terms={terms}
          onSelectTeachingRecord={record => handleOpenDetail(record)}
          onFilterToComparison={(filterType, val) => {
            setActiveSubView('comparison');
          }}
        />
      )}

      {/* SUBVIEW 4: TEACHER COMPLIANCE TRACKING DASHBOARD */}
      {activeSubView === 'compliance' && (
        <TeacherComplianceDashboard
          teachingRecords={teachingRecords}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          selectedBranch={selectedBranch}
          currentSimulatedRole={currentSimulatedRole}
          academicSessions={academicSessions}
          terms={terms}
          onSelectTeachingRecord={recordId => {
            const r = teachingRecords.find(item => item.id === recordId);
            if (r) {
              handleOpenDetail(r);
            }
          }}
          onNavigateToRecordEditor={teacherId => {
            handleOpenCreateNew();
          }}
        />
      )}

      {/* SUBVIEW 5: TEACHER PERFORMANCE EVALUATION SYSTEM */}
      {activeSubView === 'evaluation' && (
        <TeacherPerformanceEvaluation
          teachingRecords={teachingRecords}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          selectedBranch={selectedBranch}
          curriculumChecklists={curriculumChecklists}
          academicSessions={academicSessions}
          terms={terms}
          onNavigateToReviewWorkflow={() => setActiveSubView('reviewWorkflow')}
        />
      )}

      {/* SUBVIEW 6: TEACHER REVIEW & FOLLOW-UP WORKFLOW */}
      {activeSubView === 'reviewWorkflow' && (
        <TeacherReviewWorkflow
          teachingRecords={teachingRecords}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          selectedBranch={selectedBranch}
          currentSimulatedRole={currentSimulatedRole}
          academicSessions={academicSessions}
          terms={terms}
          curriculumChecklists={curriculumChecklists}
        />
      )}

      {/* SUBVIEW 7: STATUTORY TEACHING & PERFORMANCE REPORTS SUITE */}
      {activeSubView === 'reports' && (
        <TeachingPerformanceReports
          teachingRecords={teachingRecords}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          selectedBranch={selectedBranch}
          currentSimulatedRole={currentSimulatedRole}
          academicSessions={academicSessions}
          terms={terms}
          curriculumChecklists={curriculumChecklists}
        />
      )}

      {/* SUBVIEW 3: DAILY TEACHING RECORDS LOG */}
      {activeSubView === 'records' && (
        <div className="space-y-6">
          {/* Operations Timeline Single Source of Truth - Teaching Deadlines Strip */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-700/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/70">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm text-white tracking-tight">
                      Operations Timeline • Teaching Deadlines
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                      Single Source of Truth
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Synchronized live with School Operations Calendar &amp; Management Deadlines
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button
                  onClick={() => setActiveSubView('compliance')}
                  className="px-2.5 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-bold transition-all border border-indigo-400/40 flex items-center space-x-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>View Compliance Tracking</span>
                </button>
                <button
                  onClick={fetchTimelineTasks}
                  disabled={loadingTasks}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-all border border-slate-600 flex items-center space-x-1 cursor-pointer"
                  title="Refresh Timeline Tasks"
                >
                  <RotateCcw className={`w-3 h-3 ${loadingTasks ? 'animate-spin' : ''}`} />
                  <span>Refresh Sync</span>
                </button>
              </div>
            </div>

            {/* Teaching Deadlines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3.5">
              {/* Filter teaching deadline tasks or fallback to default core 4 */}
              {(eventTasks.filter(t => ['teaching_record', 'lesson_plan', 'curriculum_progress', 'scheme_review', 'Teaching Follow-Up'].includes(t.taskType) || t.id?.startsWith('tsk-td-') || t.id?.startsWith('task-followup-')).length > 0
                ? eventTasks.filter(t => ['teaching_record', 'lesson_plan', 'curriculum_progress', 'scheme_review', 'Teaching Follow-Up'].includes(t.taskType) || t.id?.startsWith('tsk-td-') || t.id?.startsWith('task-followup-'))
                : [
                    {
                      id: 'tsk-td-1',
                      title: 'Weekly Teaching Record',
                      dueDate: '2026-07-10',
                      dueTime: '17:00',
                      status: 'In Progress',
                      taskType: 'teaching_record',
                      reminderNotice: 'Due Friday at 5:00 PM. Please attach photos of classroom board and notebook samples.',
                      submissionStatus: 'Pending'
                    },
                    {
                      id: 'tsk-td-2',
                      title: 'Weekly Lesson Plan',
                      dueDate: '2026-07-06',
                      dueTime: '08:00',
                      status: 'Pending',
                      taskType: 'lesson_plan',
                      reminderNotice: 'Due Monday at 8:00 AM before first period assembly.',
                      submissionStatus: 'Pending'
                    },
                    {
                      id: 'tsk-td-3',
                      title: 'Monthly Curriculum Progress',
                      dueDate: '2026-07-31',
                      dueTime: '16:00',
                      status: 'Pending',
                      taskType: 'curriculum_progress',
                      reminderNotice: 'Due at the end of the month. Compare planned topics vs taught topics.',
                      submissionStatus: 'Pending'
                    },
                    {
                      id: 'tsk-td-4',
                      title: 'Scheme of Work Review',
                      dueDate: '2026-07-17',
                      dueTime: '15:00',
                      status: 'Pending',
                      taskType: 'scheme_review',
                      reminderNotice: 'Due Week 4 Friday. Review milestone pacing and student work coverage.',
                      submissionStatus: 'Pending'
                    }
                  ]
              ).map((task) => {
                const isCompleted = task.status === 'Completed' || task.submissionStatus === 'Submitted On Time' || task.submissionStatus === 'Submitted Late';
                const isLate = task.submissionStatus === 'Submitted Late' || task.daysLate > 0;
                const isOverdue = task.status === 'Overdue' || (!isCompleted && new Date() > new Date(`${task.dueDate}T${task.dueTime || '17:00'}:00`));

                return (
                  <div 
                    key={task.id}
                    className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-3 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                          task.taskType === 'teaching_record' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                          task.taskType === 'lesson_plan' ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' :
                          task.taskType === 'curriculum_progress' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' :
                          task.taskType === 'Teaching Follow-Up' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        }`}>
                          {task.taskType ? task.taskType.replace('_', ' ') : 'Deadline'}
                        </span>

                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isCompleted
                            ? isLate ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isOverdue ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {isCompleted ? (isLate ? 'Submitted Late' : 'Submitted On Time') : (isOverdue ? 'Not Submitted • Overdue' : 'Pending')}
                        </span>
                      </div>

                      <h5 className="font-bold text-xs text-white leading-snug">{task.title}</h5>

                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-300 mt-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Due: {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}</span>
                      </div>

                      {task.reminderNotice && (
                        <div className="mt-2 p-1.5 bg-amber-950/40 border border-amber-600/30 rounded-lg text-[10px] text-amber-200 leading-tight flex items-start space-x-1">
                          <span className="shrink-0 text-amber-400 font-bold">🔔</span>
                          <span className="line-clamp-2">{task.reminderNotice}</span>
                        </div>
                      )}

                      {task.submissionDate && (
                        <div className="mt-2 p-1.5 bg-emerald-950/40 border border-emerald-600/30 rounded-lg text-[9px] text-emerald-200 flex justify-between items-center font-mono">
                          <span>Logged: {task.submissionDate} {task.submissionTime ? `@ ${task.submissionTime}` : ''}</span>
                          {task.daysLate ? <span className="text-amber-300 font-bold">({task.daysLate}d late)</span> : <span className="text-emerald-300 font-bold">On Time</span>}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {task.assignedUser || 'All Teachers'}
                      </span>
                      {task.taskType === 'teaching_record' && (
                        <button
                          onClick={() => handleOpenCreateNew()}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Log Record
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setStatusFilter('All')}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total Logs</div>
              <div className="text-2xl font-bold font-mono mt-1">{stats.total}</div>
              <div className="text-[11px] opacity-80 mt-0.5">All academic records</div>
            </button>

            <button
              onClick={() => setStatusFilter('Draft')}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                statusFilter === 'Draft'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Drafts (In Progress)</div>
              <div className="text-2xl font-bold font-mono mt-1 text-slate-700">{stats.drafts}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Editable before submission</div>
            </button>

            <button
              onClick={() => setStatusFilter('Submitted')}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                statusFilter === 'Submitted'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Submitted</div>
              <div className="text-2xl font-bold font-mono mt-1 text-blue-600">{stats.submitted}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Pending supervisor review</div>
            </button>

            <button
              onClick={() => setStatusFilter('Reviewed')}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                statusFilter === 'Reviewed'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Reviewed &amp; Verified</div>
              <div className="text-2xl font-bold font-mono mt-1 text-emerald-600">{stats.reviewed}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Academic standard verified</div>
            </button>
          </div>

          {/* Records Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Class Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Class Filter
                </label>
                <select
                  value={selectedClassFilter}
                  onChange={e => setSelectedClassFilter(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="All">All Classes</option>
                  {branchClasses.map(c => (
                    <option key={c.id || c.name} value={c.name || c.id}>
                      {c.name || c.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubjectFilter}
                  onChange={e => setSelectedSubjectFilter(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="All">All Subjects</option>
                  {subjects.map(s => (
                    <option key={s.id || s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Week Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Term Week
                </label>
                <select
                  value={selectedWeekFilter}
                  onChange={e => setSelectedWeekFilter(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="All">All Weeks (1 - 12)</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>
                      Week {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Quick Search
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search topics, board notes, remarks..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Records List / Card Feed */}
          <div className="space-y-4">
            {filteredRecords.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No teaching records found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No records match your selected filters. Create a new record or reset your filters.
                </p>
                <button
                  onClick={() => handleOpenCreateNew()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Teaching Record</span>
                </button>
              </div>
            ) : (
              filteredRecords.map(record => {
                const isEditable = record.status === 'Draft' || record.status === 'Correction Required' || isSupervisor;
                const plannedWeek = record.schemeMilestoneWeek || record.week;
                const isAhead = record.week < plannedWeek;
                const isBehind = record.week > plannedWeek;

                return (
                  <div
                    key={record.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm font-mono shadow-sm">
                          W{record.week}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-900">{record.topic}</h4>
                            {getStatusBadge(record.status)}
                            {isAhead && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                🚀 Ahead of Scheme
                              </span>
                            )}
                            {isBehind && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                ⚠️ Behind Scheme
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="font-semibold text-slate-700">{record.classId}</span>
                            <span>•</span>
                            <span className="font-semibold text-indigo-700">{record.subject}</span>
                            <span>•</span>
                            <span>{record.date}</span>
                            <span>•</span>
                            <span>{record.time}</span>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">Instructor: {record.teacherName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleOpenDetail(record)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Docket</span>
                        </button>

                        {isEditable && (
                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center space-x-1 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Draft</span>
                          </button>
                        )}

                        {isSupervisor && record.status === 'Submitted' && (
                          <button
                            onClick={() => handleOpenReview(record)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Supervisor Review</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content Summary (TAUGHT & COVERED) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          👨‍🏫 What Was Taught
                        </span>
                        <p className="text-slate-700 line-clamp-3 leading-relaxed">
                          {record.whatWasTaught}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          📖 Pupil Book Coverage
                        </span>
                        <div className="font-semibold text-slate-800">
                          {record.pagesCovered || 'Pages not specified'}
                        </div>
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">
                          {record.studentNotebookWork}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                          <span>Evidence Uploads ({record.evidence.length})</span>
                          <Camera className="w-3 h-3 text-slate-400" />
                        </span>
                        {record.evidence.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No photographic evidence attached.</p>
                        ) : (
                          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                            {record.evidence.map(ev => (
                              <button
                                key={ev.id}
                                onClick={() => setActiveEvidenceLightbox(ev)}
                                className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 group cursor-pointer"
                              >
                                {ev.url ? (
                                  <img
                                    src={ev.url}
                                    alt={ev.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                                    DOC
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student Book & Classwork Coverage Bar */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-50/70 to-indigo-50/50 border border-cyan-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-cyan-950 flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Student Work Coverage:</span>
                            <span className="font-mono text-cyan-800 bg-white px-2 py-0.5 rounded border border-cyan-200 shadow-3xs">
                              {record.workCoveragePercentage ?? 90}%
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {record.completedWorkCount ?? 27} of {record.totalStudentsInClass ?? 30} students completed
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-cyan-200/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-600 rounded-full"
                            style={{ width: `${record.workCoveragePercentage ?? 90}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="text-emerald-700 font-semibold">✓ {record.completedWorkCount ?? 27} Completed</span>
                          <span>•</span>
                          <span className="text-amber-700 font-semibold">◐ {record.partiallyCompletedCount ?? 2} Partial</span>
                          <span>•</span>
                          <span className="text-rose-700 font-semibold">✕ {record.notCompletedCount ?? 1} Not Done</span>
                          {record.absentCount ? (
                            <>
                              <span>•</span>
                              <span className="text-slate-600">🚫 {record.absentCount} Absent</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {record.flaggedStudents && record.flaggedStudents.length > 0 && (
                        <div className="sm:border-l sm:border-cyan-200 sm:pl-3 shrink-0 flex flex-col justify-center">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-indigo-600" />
                            <span>Follow-Up Required ({record.flaggedStudents.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {record.flaggedStudents.slice(0, 2).map((fs, idx) => (
                              <span
                                key={idx}
                                className="bg-white text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[9.5px] font-medium"
                              >
                                {fs.studentName.split(' ')[0]}: <strong className="text-indigo-700">{fs.category}</strong>
                              </span>
                            ))}
                            {record.flaggedStudents.length > 2 && (
                              <span className="text-[9.5px] font-bold text-indigo-600 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                                +{record.flaggedStudents.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Correction / Supervisor Feedback Banner if any */}
                    {record.reviewerFeedback && (
                      <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                        record.status === 'Correction Required'
                          ? 'bg-rose-50 border border-rose-200 text-rose-900'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      }`}>
                        <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-bold">
                            Supervisor Feedback ({record.reviewedBy || 'Academic Supervisor'}):
                          </div>
                          <p className="leading-relaxed">{record.reviewerFeedback}</p>
                          {record.correctionInstructions && (
                            <div className="mt-1 pt-1 border-t border-rose-200 font-semibold text-rose-950">
                              Instructions: {record.correctionInstructions}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TEACHING RECORD EDITOR DRAWER / MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            {/* Drawer Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-500/30 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {formData.id?.startsWith('tr-') ? 'Teaching Record Log' : 'New Entry'}
                  </span>
                  {formData.status && getStatusBadge(formData.status)}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {formData.status === 'Draft' ? 'Edit Teaching Record Draft' : 'Record Classroom Instruction'}
                </h3>
              </div>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Form */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
              {/* SECTION 1: MANDATORY SELECTORS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-600" />
                  1. Classroom &amp; Session Identification
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Branch</label>
                    <select
                      value={formData.branch || 'GN'}
                      onChange={e => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2"
                    >
                      <option value="GN">Gawun Nama (GN)</option>
                      <option value="RS">Runjin Sambo (RS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Academic Session</label>
                    <select
                      value={formData.academicSession || '2025/2026'}
                      onChange={e => setFormData({ ...formData, academicSession: e.target.value })}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2"
                    >
                      <option value="2025/2026">2025/2026</option>
                      <option value="2024/2025">2024/2025</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Term</label>
                    <select
                      value={formData.term || 'First Term'}
                      onChange={e => setFormData({ ...formData, term: e.target.value })}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2"
                    >
                      <option value="First Term">First Term</option>
                      <option value="Second Term">Second Term</option>
                      <option value="Third Term">Third Term</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Class</label>
                    <select
                      value={formData.classId || branchClasses[0]?.name}
                      onChange={e => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2"
                    >
                      {branchClasses.map(c => (
                        <option key={c.id || c.name} value={c.name || c.id}>
                          {c.name || c.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Subject</label>
                    <select
                      value={formData.subject || subjects[0]?.name}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2"
                    >
                      {subjects.map(s => (
                        <option key={s.id || s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Taught Week</label>
                    <select
                      value={formData.week || 5}
                      onChange={e => setFormData({ ...formData, week: Number(e.target.value) })}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Week {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2"
                    />
                  </div>
                </div>
              </div>

              {/* SCHEME OF WORK LINKAGE & PACING PREVIEW */}
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Scheme of Work Milestone Linkage
                  </h4>
                  <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-medium">
                    Curriculum Sync
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Planned Scheme of Work Milestone
                  </label>
                  <select
                    value={formData.schemeMilestoneWeek || formData.week || 5}
                    onChange={e => {
                      const w = Number(e.target.value);
                      const matched = availableFormMilestones.find(m => m.week === w);
                      setFormData({
                        ...formData,
                        schemeMilestoneWeek: w,
                        topic: matched?.topic || formData.topic,
                        lessonTitle: matched?.topic || formData.lessonTitle
                      });
                    }}
                    className="w-full text-xs font-semibold bg-white border border-indigo-300 rounded-xl p-2 text-slate-800"
                  >
                    {availableFormMilestones.map(m => (
                      <option key={m.week} value={m.week}>
                        Week {m.week}: {m.topic}
                      </option>
                    ))}
                  </select>
                </div>

                {formPacingPreview && (
                  <div className={`p-2.5 rounded-xl border text-[11px] font-semibold ${formPacingPreview.badgeClass}`}>
                    {formPacingPreview.text}
                  </div>
                )}
              </div>

              {/* LESSON PLAN LINKAGE & AUTO-SYNC */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Lesson Plan Linkage &amp; Auto-Population
                  </h4>
                  {onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('curriculumChecklist', 'lesson_plans')}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 underline font-semibold cursor-pointer"
                    >
                      View All Lesson Plans →
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Link Approved Lesson Plan
                    </label>
                    <select
                      onChange={e => {
                        const lpId = e.target.value;
                        if (!lpId) return;
                        const matchedLp = lessonPlanDrafts.find(lp => lp.id === lpId || lp.title === lpId);
                        if (matchedLp) {
                          setFormData(prev => ({
                            ...prev,
                            topic: matchedLp.topic || matchedLp.title || prev.topic,
                            subTopic: matchedLp.subTopic || prev.subTopic,
                            whatWasTaught: prev.whatWasTaught || matchedLp.behavioralObjectives || matchedLp.contentSummary || `Delivered lesson on ${matchedLp.topic}.`,
                            boardWork: prev.boardWork || matchedLp.instructionalMaterials || matchedLp.coreDefinitions || '',
                            teachingActivities: prev.teachingActivities || matchedLp.teacherActivities || '',
                            classwork: prev.classwork || matchedLp.evaluationActivities || '',
                            homework: prev.homework || matchedLp.assignment || ''
                          }));
                        }
                      }}
                      className="w-full text-xs font-semibold bg-white border border-emerald-300 rounded-xl p-2 text-slate-800"
                    >
                      <option value="">-- Select Lesson Plan to auto-fill --</option>
                      {lessonPlanDrafts.map((lp: any) => (
                        <option key={lp.id} value={lp.id}>
                          {lp.week ? `W${lp.week}: ` : ''}{lp.topic || lp.title} ({lp.subject || 'General'} - {lp.status || 'Draft'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center text-[11px] text-emerald-800 bg-white/70 p-2.5 rounded-xl border border-emerald-150">
                    <span>💡 Selecting an approved Lesson Plan automatically populates behavioral objectives, learning points, and classwork exercises without duplicate typing.</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: WHAT WAS TAUGHT (TAUGHT) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  2. What Was Taught (Instructional Delivery)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Topic Taught *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fractions and Mixed Numbers"
                      value={formData.topic || ''}
                      onChange={e => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2"
                    />
                    {validationErrors.topic && <p className="text-[10px] text-rose-600 mt-0.5">{validationErrors.topic}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Sub-Topic &amp; Lesson Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Converting Improper Fractions"
                      value={formData.subTopic || ''}
                      onChange={e => setFormData({ ...formData, subTopic: e.target.value })}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    What Was Taught (Summary of Concept Delivery) *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe concepts explained, theorems introduced, or core principles taught..."
                    value={formData.whatWasTaught || ''}
                    onChange={e => setFormData({ ...formData, whatWasTaught: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                  />
                  {validationErrors.whatWasTaught && <p className="text-[10px] text-rose-600 mt-0.5">{validationErrors.whatWasTaught}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    What Was Written / Explained on the Board *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Formulas, diagrams, definitions, chalkboard layouts written for pupils..."
                    value={formData.boardWork || ''}
                    onChange={e => setFormData({ ...formData, boardWork: e.target.value })}
                    className="w-full text-xs font-mono bg-slate-900 text-slate-100 rounded-xl p-2.5"
                  />
                  {validationErrors.boardWork && <p className="text-[10px] text-rose-600 mt-0.5">{validationErrors.boardWork}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Teaching Activities &amp; Methods Used
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Group drills, apparatus handling, demonstration, interactive games..."
                    value={formData.teachingActivities || ''}
                    onChange={e => setFormData({ ...formData, teachingActivities: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>

              {/* SECTION 3: PUPIL BOOK COVERAGE (COVERED) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
                  3. Pupil Book Coverage (COVERED)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Textbook / Workbook Pages Covered
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Primary Maths Book 5, pp. 42–45"
                      value={formData.pagesCovered || ''}
                      onChange={e => setFormData({ ...formData, pagesCovered: e.target.value })}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Classwork Assigned
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Exercise 5B, Questions 1 through 8"
                      value={formData.classwork || ''}
                      onChange={e => setFormData({ ...formData, classwork: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    What Students Were Expected to Write in Notebooks *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Notes copied from board, solved examples, summary tables in pupils' books..."
                    value={formData.studentNotebookWork || ''}
                    onChange={e => setFormData({ ...formData, studentNotebookWork: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                  />
                  {validationErrors.studentNotebookWork && <p className="text-[10px] text-rose-600 mt-0.5">{validationErrors.studentNotebookWork}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Homework Assigned
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Workbook Page 19 Ex 5C"
                      value={formData.homework || ''}
                      onChange={e => setFormData({ ...formData, homework: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Teacher's Remarks / Observations
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 24/28 students mastered conversion"
                      value={formData.teacherRemarks || ''}
                      onChange={e => setFormData({ ...formData, teacherRemarks: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: STUDENT BOOK & CLASSWORK COVERAGE TRACKING */}
              <div className="bg-gradient-to-br from-cyan-50/70 via-white to-indigo-50/60 p-4 rounded-2xl border border-cyan-200 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-cyan-100 pb-2.5">
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                      4. Student Book &amp; Classwork Coverage Tracking
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Record student exercise book completion and identify individual learners needing support.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-xl bg-white border border-cyan-300 text-cyan-900 shadow-2xs">
                      Coverage: {liveCoveragePercentage}%
                    </span>
                  </div>
                </div>

                {/* Important Pedagogical Policy Reminder */}
                <div className="p-2.5 bg-amber-50/90 rounded-xl border border-amber-200 text-[10.5px] text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong>Formative Progress Indicator:</strong> Student book coverage is tracked as a teaching and learning progress indicator. It is <strong>NOT</strong> treated as terminal examination marks.
                  </div>
                </div>

                {/* Coverage Headcount Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Total in Class *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={formData.totalStudentsInClass ?? 30}
                      onChange={e => {
                        const total = Math.max(1, Number(e.target.value) || 0);
                        const completed = Math.min(total, Number(formData.completedWorkCount) || 0);
                        setFormData({
                          ...formData,
                          totalStudentsInClass: total,
                          completedWorkCount: completed,
                          workCoveragePercentage: Math.round((completed / total) * 100)
                        });
                      }}
                      className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl p-2 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                      Completed Work *
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={formData.totalStudentsInClass ?? 30}
                      value={formData.completedWorkCount ?? 27}
                      onChange={e => {
                        const completed = Math.max(0, Number(e.target.value) || 0);
                        const total = Number(formData.totalStudentsInClass) || 30;
                        setFormData({
                          ...formData,
                          completedWorkCount: completed,
                          workCoveragePercentage: total > 0 ? Math.round((completed / total) * 100) : 0
                        });
                      }}
                      className="w-full text-xs font-mono font-bold bg-emerald-50/60 border border-emerald-300 text-emerald-900 rounded-xl p-2 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                      Partially Done
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={formData.totalStudentsInClass ?? 30}
                      value={formData.partiallyCompletedCount ?? 2}
                      onChange={e => setFormData({ ...formData, partiallyCompletedCount: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full text-xs font-mono font-bold bg-amber-50/60 border border-amber-300 text-amber-900 rounded-xl p-2 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-rose-700 mb-1">
                      Not Completed
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={formData.totalStudentsInClass ?? 30}
                      value={formData.notCompletedCount ?? 1}
                      onChange={e => setFormData({ ...formData, notCompletedCount: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full text-xs font-mono font-bold bg-rose-50/60 border border-rose-300 text-rose-900 rounded-xl p-2 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Absent from Class
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={formData.totalStudentsInClass ?? 30}
                      value={formData.absentCount ?? 0}
                      onChange={e => setFormData({ ...formData, absentCount: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 text-slate-700 rounded-xl p-2 text-center"
                    />
                  </div>
                </div>

                {/* Calculation breakdown pill */}
                <div className="bg-white p-3 rounded-xl border border-cyan-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Calculated Student Work Coverage:</span>
                    <span className="font-mono font-black text-cyan-900 text-sm">
                      {liveCoveragePercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-cyan-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 rounded-full transition-all duration-300"
                      style={{ width: `${liveCoveragePercentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Formula: ({formData.completedWorkCount ?? 27} completed ÷ {formData.totalStudentsInClass ?? 30} total) × 100 = <strong>{liveCoveragePercentage}%</strong>
                  </div>
                </div>

                {/* Individual Student Flagging (Did Not Complete, Absent, Needs Support) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Identify Individual Learners Requiring Follow-Up
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      {formData.flaggedStudents?.length || 0} student(s) identified
                    </span>
                  </div>

                  {/* Flag Builder Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {/* Student Selection */}
                    <div>
                      <label className="block text-[9.5px] font-bold uppercase text-slate-500 mb-1">
                        Select Student
                      </label>
                      {currentClassStudents.length > 0 ? (
                        <select
                          value={selectedStudentForFlag}
                          onChange={e => {
                            setSelectedStudentForFlag(e.target.value);
                            setCustomStudentNameForFlag('');
                          }}
                          className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2"
                        >
                          <option value="">-- Choose from Class Roster --</option>
                          {currentClassStudents.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.fullName || `${s.firstName} ${s.lastName}`} ({s.admissionNumber || s.id})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Type student name..."
                          value={customStudentNameForFlag}
                          onChange={e => setCustomStudentNameForFlag(e.target.value)}
                          className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2"
                        />
                      )}
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block text-[9.5px] font-bold uppercase text-slate-500 mb-1">
                        Category Flag *
                      </label>
                      <select
                        value={flagCategory}
                        onChange={e => setFlagCategory(e.target.value as any)}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2"
                      >
                        <option value="Not Completed">❌ Did Not Complete Work</option>
                        <option value="Absent">🚫 Was Absent from Class</option>
                        <option value="Needs Support">💡 Needs Additional Support</option>
                      </select>
                    </div>

                    {/* Observation Note */}
                    <div>
                      <label className="block text-[9.5px] font-bold uppercase text-slate-500 mb-1">
                        Teacher Observation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Left book at home, struggled with remainders..."
                        value={flagNotes}
                        onChange={e => setFlagNotes(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      placeholder="Intervention / Support Plan (e.g. 15-min remedial drill on Friday, complete at prep)..."
                      value={flagInterventionPlan}
                      onChange={e => setFlagInterventionPlan(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddFlaggedStudent}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Flag Learner</span>
                    </button>
                  </div>

                  {/* Flagged Students List Table / Badges */}
                  {formData.flaggedStudents && formData.flaggedStudents.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Identified Learners for Follow-Up ({formData.flaggedStudents.length})
                      </div>
                      <div className="space-y-1.5">
                        {formData.flaggedStudents.map((flag, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{flag.studentName}</span>
                                {flag.admissionNumber && (
                                  <span className="text-slate-400 font-mono text-[10px]">({flag.admissionNumber})</span>
                                )}
                                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                                  flag.category === 'Needs Support'
                                    ? 'bg-amber-100 text-amber-800'
                                    : flag.category === 'Not Completed'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {flag.category}
                                </span>
                              </div>
                              {flag.notes && <div className="text-[11px] text-slate-600">{flag.notes}</div>}
                              {flag.interventionPlan && (
                                <div className="text-[10.5px] text-indigo-700 font-medium">
                                  <strong>Plan:</strong> {flag.interventionPlan}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFlaggedStudent(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Remove Flag"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5: SUPPORTING EVIDENCE UPLOADS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    5. Supporting Photographic Evidence
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Board, Pupil Notebooks, Classwork
                  </span>
                </h4>

                {/* Evidence Type Selector */}
                <div className="flex flex-wrap gap-1.5">
                  {(['board', 'notebook', 'classwork', 'homework', 'document'] as EvidenceType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActiveEvidenceType(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        activeEvidenceType === t
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {getEvidenceTypeLabel(t)}
                    </button>
                  ))}
                </div>

                {/* File Upload Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Device Photo / Document</span>
                    </button>
                  </div>

                  {/* Preset Helper */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Or attach realistic classroom preset:</div>
                    <div className="flex flex-wrap gap-1">
                      {SAMPLE_EVIDENCE_PRESETS.map(preset => (
                        <button
                          key={preset.type}
                          type="button"
                          onClick={() => handleAttachPresetEvidence(preset)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Attached Evidence List */}
                {formData.evidence && formData.evidence.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      Attached Evidence ({formData.evidence.length})
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {formData.evidence.map(ev => (
                        <div
                          key={ev.id}
                          className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {ev.url ? (
                              <img src={ev.url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0">
                                DOC
                              </div>
                            )}
                            <div className="truncate">
                              <div className="font-bold text-[11px] truncate text-slate-800">{ev.title}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{ev.fileSize || 'Image'}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidence(ev.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSaveRecord('Draft')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveRecord('Submitted')}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit for Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD DETAIL & PRINTABLE DOCKET MODAL */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                    Week {selectedRecord.week}
                  </span>
                  {getStatusBadge(selectedRecord.status)}
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedRecord.topic}
                </h3>
                <p className="text-xs text-slate-300">
                  {selectedRecord.classId} • {selectedRecord.subject} • {selectedRecord.date}
                </p>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
              {/* Metadata row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Instructor</div>
                  <div className="font-bold text-slate-900">{selectedRecord.teacherName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Branch</div>
                  <div className="font-bold text-slate-900">{selectedRecord.branch}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Academic Term</div>
                  <div className="font-bold text-slate-900">{selectedRecord.term}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Time Schedule</div>
                  <div className="font-bold text-slate-900">{selectedRecord.time}</div>
                </div>
              </div>

              {/* Taught vs Covered */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                  <h4 className="font-bold text-emerald-950 uppercase text-[11px]">
                    👨‍🏫 What Was Taught
                  </h4>
                  <div>
                    <div className="font-bold text-slate-800">{selectedRecord.lessonTitle}</div>
                    <p className="text-slate-700 mt-1 leading-relaxed">{selectedRecord.whatWasTaught}</p>
                  </div>
                  {selectedRecord.boardWork && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Board Work:</div>
                      <pre className="mt-1 font-mono text-[11px] bg-slate-900 text-slate-100 p-2.5 rounded-xl whitespace-pre-wrap">
                        {selectedRecord.boardWork}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-cyan-50/50 rounded-2xl border border-cyan-100 space-y-3">
                  <h4 className="font-bold text-cyan-950 uppercase text-[11px]">
                    📖 Pupil Book Coverage
                  </h4>
                  <div>
                    <div className="font-bold text-slate-800">
                      {selectedRecord.pagesCovered || 'Pages recorded in exercise book'}
                    </div>
                    <p className="text-slate-700 mt-1 leading-relaxed">{selectedRecord.studentNotebookWork}</p>
                  </div>
                  <div className="space-y-1 bg-white/80 p-2.5 rounded-xl border border-cyan-100">
                    <div><strong>Classwork:</strong> {selectedRecord.classwork || 'Standard class exercises.'}</div>
                    <div><strong>Homework:</strong> {selectedRecord.homework || 'Assigned exercises.'}</div>
                  </div>
                </div>
              </div>

              {/* Student Book & Classwork Coverage Report */}
              <div className="p-5 bg-gradient-to-br from-cyan-50/60 via-slate-50 to-indigo-50/40 rounded-2xl border border-cyan-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-100/80 pb-3">
                  <div>
                    <h4 className="font-bold text-cyan-950 uppercase text-[11px] flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-cyan-700" />
                      <span>Student Book &amp; Classwork Coverage Report</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Formative indicator tracking individual learner engagement and exercise completion.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-white border border-cyan-300 text-cyan-900 shadow-sm">
                      {selectedRecord.workCoveragePercentage ?? 90}% Coverage Rate
                    </span>
                  </div>
                </div>

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Class Enrolment</div>
                    <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                      {selectedRecord.totalStudentsInClass ?? 30}
                    </div>
                    <div className="text-[9.5px] text-slate-400">Total in class</div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-center">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase">Completed Work</div>
                    <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">
                      {selectedRecord.completedWorkCount ?? 27}
                    </div>
                    <div className="text-[9.5px] text-emerald-600 font-medium">Fully done</div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-center">
                    <div className="text-[10px] font-bold text-amber-700 uppercase">Partially Done</div>
                    <div className="text-lg font-black text-amber-800 font-mono mt-0.5">
                      {selectedRecord.partiallyCompletedCount ?? 2}
                    </div>
                    <div className="text-[9.5px] text-amber-600 font-medium">Incomplete exercises</div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-rose-200 text-center">
                    <div className="text-[10px] font-bold text-rose-700 uppercase">Not Completed</div>
                    <div className="text-lg font-black text-rose-800 font-mono mt-0.5">
                      {selectedRecord.notCompletedCount ?? 1}
                    </div>
                    <div className="text-[9.5px] text-rose-600 font-medium">
                      {selectedRecord.absentCount ? `+ ${selectedRecord.absentCount} absent` : 'Needs follow-up'}
                    </div>
                  </div>
                </div>

                {/* Coverage Visual Bar */}
                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Classwork &amp; Exercise Book Completion</span>
                    <span className="font-mono font-bold text-cyan-800">
                      {selectedRecord.completedWorkCount ?? 27}/{selectedRecord.totalStudentsInClass ?? 30} Learners ({selectedRecord.workCoveragePercentage ?? 90}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 rounded-full transition-all"
                      style={{ width: `${selectedRecord.workCoveragePercentage ?? 90}%` }}
                    />
                  </div>
                </div>

                {/* Flagged Students List */}
                {selectedRecord.flaggedStudents && selectedRecord.flaggedStudents.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Identified Individual Learners ({selectedRecord.flaggedStudents.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Click student to view cumulative progress indicator</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedRecord.flaggedStudents.map((flag, idx) => {
                        const matchingStudent = students?.find(
                          s => s.id === flag.studentId || 
                          s.admissionNumber === flag.admissionNumber ||
                          s.fullName?.toLowerCase() === flag.studentName.toLowerCase() ||
                          `${s.firstName} ${s.lastName}`.toLowerCase() === flag.studentName.toLowerCase()
                        );

                        return (
                          <div
                            key={idx}
                            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-2 shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span>{flag.studentName}</span>
                                  {flag.admissionNumber && (
                                    <span className="text-slate-400 font-mono text-[9.5px]">({flag.admissionNumber})</span>
                                  )}
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  flag.category === 'Needs Support'
                                    ? 'bg-amber-100 text-amber-800'
                                    : flag.category === 'Not Completed'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {flag.category}
                                </span>
                              </div>

                              {flag.notes && (
                                <p className="text-[10.5px] text-slate-600 mt-1 leading-relaxed">
                                  <strong>Observation:</strong> {flag.notes}
                                </p>
                              )}

                              {flag.interventionPlan && (
                                <p className="text-[10.5px] text-indigo-700 mt-0.5 leading-relaxed font-medium">
                                  <strong>Action:</strong> {flag.interventionPlan}
                                </p>
                              )}
                            </div>

                            {onViewStudentProfile && (
                              <button
                                onClick={() => {
                                  setIsDetailModalOpen(false);
                                  if (matchingStudent) {
                                    onViewStudentProfile(matchingStudent);
                                  } else {
                                    onViewStudentProfile({
                                      id: flag.studentId,
                                      fullName: flag.studentName,
                                      grade: flag.classId,
                                      branch: selectedRecord.branch,
                                      gender: 'Other',
                                      admissionNumber: flag.admissionNumber || 'ADM-NEW'
                                    });
                                  }
                                }}
                                className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer"
                              >
                                <Users className="w-3 h-3" />
                                <span>Open Student Profile →</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-500">
                    ✨ No individual learning flags recorded. All attendees completed class exercises satisfactorily.
                  </div>
                )}
              </div>

              {/* Evidence Gallery */}
              {selectedRecord.evidence.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase text-[11px]">
                    Supporting Photo Evidence ({selectedRecord.evidence.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedRecord.evidence.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => setActiveEvidenceLightbox(ev)}
                        className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer group"
                      >
                        {ev.url ? (
                          <img
                            src={ev.url}
                            alt={ev.title}
                            className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-28 flex items-center justify-center font-bold text-slate-400">
                            DOCUMENT
                          </div>
                        )}
                        <div className="p-2">
                          <div className="font-bold text-[11px] text-slate-800 truncate">{ev.title}</div>
                          <div className="text-[10px] text-slate-400">{ev.notes || 'Evidence verified'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Docket</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPERVISOR REVIEW MODAL */}
      {isReviewModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Supervisor Academic Review</h3>
                <p className="text-xs text-slate-300">
                  {selectedRecord.topic} • {selectedRecord.teacherName}
                </p>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Review Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('Reviewed')}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      reviewAction === 'Reviewed'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve &amp; Verify</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('Correction Required')}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      reviewAction === 'Correction Required'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Correction Required</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Feedback to Instructor
                </label>
                <textarea
                  rows={3}
                  placeholder="Commendations or pedagogical observations..."
                  value={reviewerFeedback}
                  onChange={e => setReviewerFeedback(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              {reviewAction === 'Correction Required' && (
                <div>
                  <label className="block text-[10px] font-bold text-rose-700 uppercase mb-1">
                    Specific Required Corrections *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="List required revisions (e.g. fix board calculation error, upload missing notebook photo)..."
                    value={correctionInstructions}
                    onChange={e => setCorrectionInstructions(e.target.value)}
                    className="w-full text-xs bg-rose-50 border border-rose-300 rounded-xl p-2.5 text-rose-950 font-medium"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR EVIDENCE PHOTOS */}
      {activeEvidenceLightbox && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold">{activeEvidenceLightbox.title}</h4>
                <div className="text-xs text-slate-400">{activeEvidenceLightbox.notes || 'Teaching verification evidence'}</div>
              </div>
              <button
                onClick={() => setActiveEvidenceLightbox(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-black overflow-hidden flex-1">
              {activeEvidenceLightbox.url ? (
                <img
                  src={activeEvidenceLightbox.url}
                  alt={activeEvidenceLightbox.title}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-slate-400 text-xs">No image preview available for this document.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
