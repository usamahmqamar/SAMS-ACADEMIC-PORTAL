import React, { useState, useMemo, useRef } from 'react';
import {
  Pencil,
  FileText,
  TrendingUp,
  Award,
  Lock,
  Unlock,
  Check,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Printer,
  Sparkles,
  Save,
  Users,
  Search,
  Filter,
  Eye,
  ChevronRight,
  ShieldCheck,
  Sliders,
  Calendar,
  Layers,
  BookOpen,
  UserCheck,
  Star,
  RefreshCw,
  CheckSquare,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

export interface Student {
  id: string;
  name: string;
  level: 'nursery' | 'primary' | 'secondary' | 'islamia';
  grade: string;
  classSection: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  attendancePercentage: number;
  behaviorRating?: 'Excellent' | 'Good' | 'Needs Improvement';
  milestones?: Record<string, string>;
  grades?: Record<string, number>;
  gradesStatus?: Record<string, 'Draft' | 'Submitted' | 'Approved'>;
  milestonesStatus?: Record<string, 'Draft' | 'Submitted' | 'Approved'>;
  resultsApproved?: boolean;
  reportComment?: string;
  principalRemark?: string;
  terminalRank?: number;
  terminalPercentile?: number;
  terminalRankCalculatedAt?: string;
  islamiaClassId?: string;
  sessionYear?: string;
  photoUrl?: string;
  enrollmentNo?: string;
  branch?: string;
  caScores?: Record<string, { ca1?: number; ca2?: number; exam?: number; remark?: string }>;
  affectiveScores?: Record<string, number>;
  psychomotorScores?: Record<string, number>;
  attendanceSummary?: { daysOpened: number; daysPresent: number; daysAbsent: number };
  feeStatements?: { outstandingBalance: number };
}

export interface ClassRecord {
  id: string;
  name: string;
  level: 'nursery' | 'primary' | 'secondary' | 'islamia';
  branch: string;
  subjects: string[];
  isScoreMatrixLocked?: boolean;
  classTeacher?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects?: string[];
  classesAssigned?: string[];
  classTeacherOf?: string;
  position?: string;
  role?: string;
  branch?: string;
  subjectAllocations?: Array<{ classId?: string; className?: string; subject: string }>;
}

export interface Subject {
  id: string;
  name: string;
  level: 'nursery' | 'primary' | 'secondary' | 'islamia';
  requirement?: 'compulsory' | 'optional';
}

interface ResultsManagementModuleProps {
  activeSubTab: 'entry' | 'cards' | 'analysis';
  setActiveSubTab: (tab: 'entry' | 'cards' | 'analysis') => void;
  classes: ClassRecord[];
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  selectedBranch: string;
  currentActiveUser: any;
  currentSimulatedRole?: string;
  currentUserRole?: string;
  saveStudentChanges: (student: any) => Promise<void>;
  handleUpdateClassDetails: (classId: string, updatedFields: Partial<ClassRecord>) => Promise<void>;
  calculateGPA: (studentGrades: Record<string, number>) => { avg: number; letter: string };
  getSecularGrades: (studentGrades: Record<string, number>) => Record<string, number>;
  getIslamiaGrades: (studentGrades: Record<string, number>) => Record<string, number>;
  addAuditLog?: (user: string, action: string, details: string, status?: string) => void;
  academicSessions?: any[];
  activeAcademicSessionName?: string;
}

// Assessment weight presets
const DEFAULT_CA1_MAX = 20;
const DEFAULT_CA2_MAX = 20;
const DEFAULT_EXAM_MAX = 60;

// Standard non-cognitive traits
const AFFECTIVE_TRAITS = [
  { key: 'punctuality', label: 'Punctuality & Attendance' },
  { key: 'neatness', label: 'Neatness & Personal Hygiene' },
  { key: 'politeness', label: 'Politeness & Courtesy' },
  { key: 'honesty', label: 'Honesty & Reliability' },
  { key: 'leadership', label: 'Leadership & Initiative' },
  { key: 'peerRelation', label: 'Relationship with Peers' }
];

const PSYCHOMOTOR_TRAITS = [
  { key: 'handwriting', label: 'Handwriting & Legibility' },
  { key: 'verbalFluency', label: 'Verbal Fluency & Speaking' },
  { key: 'sports', label: 'Sports & Physical Games' },
  { key: 'crafts', label: 'Arts, Crafts & Dexterity' },
  { key: 'music', label: 'Musical & Creative Expression' }
];

export default function ResultsManagementModule({
  activeSubTab,
  setActiveSubTab,
  classes,
  students,
  teachers,
  subjects,
  selectedBranch,
  currentActiveUser,
  currentSimulatedRole,
  currentUserRole,
  saveStudentChanges,
  handleUpdateClassDetails,
  calculateGPA,
  getSecularGrades,
  getIslamiaGrades,
  addAuditLog,
  academicSessions = [],
  activeAcademicSessionName
}: ResultsManagementModuleProps) {
  // Effective role & active teacher identification
  const effectiveRole = currentUserRole || currentSimulatedRole || 'Super Administrator';
  const isAdmin = 
    effectiveRole === 'Super Administrator' ||
    effectiveRole === 'Super Admin' ||
    effectiveRole === 'Proprietor' ||
    effectiveRole === 'Branch Administrator' ||
    effectiveRole === 'Branch Admin' ||
    effectiveRole === 'Principal';

  // Identify current teacher record if applicable
  const matchedTeacher = useMemo(() => {
    if (!currentActiveUser) return null;
    return teachers.find(t => 
      t.email?.toLowerCase() === currentActiveUser.email?.toLowerCase() ||
      t.id === currentActiveUser.id ||
      t.name?.toLowerCase() === currentActiveUser.name?.toLowerCase()
    ) || null;
  }, [currentActiveUser, teachers]);

  // Operational Mode inside Result Entry Ledger: 'subject_teacher' vs 'class_teacher_broadsheet'
  const [entryMode, setEntryMode] = useState<'subject_teacher' | 'class_teacher_broadsheet'>('subject_teacher');

  // Academic Term & Session Filter
  const [selectedSession, setSelectedSession] = useState<string>(activeAcademicSessionName || '2026/2027');
  const [selectedTerm, setSelectedTerm] = useState<string>('First Term');

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [activeStudentForCard, setActiveStudentForCard] = useState<Student | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // CSV Import / Export states
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [csvRawContent, setCsvRawContent] = useState<string>('');
  const [csvParsedRows, setCsvParsedRows] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // AI Generation states
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiFocusPrompt, setAiFocusPrompt] = useState<string>('');
  const [aiGenError, setAiGenError] = useState<string | null>(null);

  // Batch print view mode
  const [isBatchPrintMode, setIsBatchPrintMode] = useState<boolean>(false);

  // Publishing & Financial Clearance Restriction toggle
  const [enforceFeeClearance, setEnforceFeeClearance] = useState<boolean>(true);
  const [isProcessingPublish, setIsProcessingPublish] = useState<boolean>(false);

  // Filter classes by active branch
  const branchClasses = useMemo(() => {
    return classes.filter(c => !c.branch || c.branch === selectedBranch);
  }, [classes, selectedBranch]);

  // Set default class if not selected
  const activeClass = useMemo(() => {
    if (selectedClassId) {
      return branchClasses.find(c => c.id === selectedClassId || c.name === selectedClassId) || branchClasses[0] || null;
    }
    return branchClasses[0] || null;
  }, [selectedClassId, branchClasses]);

  // Filter students belonging to the active class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return students.filter(s => 
      (activeClass.level === 'islamia' ? s.islamiaClassId === activeClass.id : s.grade === activeClass.name) &&
      (s.branch === selectedBranch || !s.branch)
    );
  }, [activeClass, students, selectedBranch]);

  // Auto-select first student for report card if none selected
  const currentCardStudent = useMemo(() => {
    if (activeStudentForCard) {
      const refreshed = students.find(s => s.id === activeStudentForCard.id);
      return refreshed || activeStudentForCard;
    }
    return classStudents[0] || students[0] || null;
  }, [activeStudentForCard, classStudents, students]);

  // Available subjects for the active class
  const classSubjects = useMemo(() => {
    if (!activeClass) return [];
    return activeClass.subjects || [];
  }, [activeClass]);

  // Active subject selection
  const activeSubject = useMemo(() => {
    if (selectedSubject && classSubjects.includes(selectedSubject)) {
      return selectedSubject;
    }
    return classSubjects[0] || '';
  }, [selectedSubject, classSubjects]);

  // Subject Teacher Status Tracker for Active Subject
  const subjectStatus = useMemo(() => {
    if (!activeSubject || classStudents.length === 0) return 'Draft';
    const firstStudent = classStudents[0];
    if (activeClass?.level === 'nursery') {
      return firstStudent.milestonesStatus?.[activeSubject] || 'Draft';
    }
    return firstStudent.gradesStatus?.[activeSubject] || 'Draft';
  }, [activeSubject, classStudents, activeClass]);

  const isSubjectLocked = useMemo(() => {
    if (isAdmin) return false;
    const isMatrixLocked = activeClass?.isScoreMatrixLocked || false;
    return subjectStatus === 'Submitted' || subjectStatus === 'Approved' || isMatrixLocked;
  }, [isAdmin, activeClass, subjectStatus]);

  // Calculate Class Position and Ranking Engine
  const classRankings = useMemo(() => {
    if (classStudents.length === 0) return new Map<string, { rank: number; total: number; avg: number; totalScore: number }>();
    
    const computed = classStudents.map(s => {
      const secular = getSecularGrades(s.grades || {});
      const gpa = calculateGPA(secular);
      const scores = Object.values(s.grades || {});
      const totalScore = scores.reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
      return {
        id: s.id,
        avg: gpa.avg,
        totalScore,
        student: s
      };
    });

    // Sort descending by average & total score
    computed.sort((a, b) => {
      if (b.avg !== a.avg) return b.avg - a.avg;
      return b.totalScore - a.totalScore;
    });

    const rankMap = new Map<string, { rank: number; total: number; avg: number; totalScore: number }>();
    const totalCount = computed.length;

    let currentRank = 1;
    computed.forEach((item, idx) => {
      if (idx > 0) {
        const prev = computed[idx - 1];
        if (item.avg === prev.avg && item.totalScore === prev.totalScore) {
          // Tie maintains same rank
          const prevRank = rankMap.get(prev.id)?.rank || currentRank;
          rankMap.set(item.id, { rank: prevRank, total: totalCount, avg: item.avg, totalScore: item.totalScore });
          return;
        } else {
          currentRank = idx + 1;
        }
      }
      rankMap.set(item.id, { rank: currentRank, total: totalCount, avg: item.avg, totalScore: item.totalScore });
    });

    return rankMap;
  }, [classStudents, calculateGPA, getSecularGrades]);

  // Helper: Get student grade breakdown for a subject (CA1, CA2, Exam)
  const getStudentScoreBreakdown = (student: Student, subj: string) => {
    const existingBreakdown = student.caScores?.[subj];
    if (existingBreakdown) {
      const ca1 = existingBreakdown.ca1 ?? 0;
      const ca2 = existingBreakdown.ca2 ?? 0;
      const exam = existingBreakdown.exam ?? 0;
      const total = ca1 + ca2 + exam;
      return { ca1, ca2, exam, total, remark: existingBreakdown.remark || '' };
    }
    // Fallback from single total grade
    const total = student.grades?.[subj] ?? 0;
    // Standard approximate decomposition (CA1: 20%, CA2: 20%, Exam: 60%)
    const ca1 = Math.round(total * 0.2);
    const ca2 = Math.round(total * 0.2);
    const exam = total - (ca1 + ca2);
    return { ca1, ca2, exam, total, remark: '' };
  };

  // Update a student's CA score component
  const handleUpdateScoreComponent = async (
    student: Student,
    subj: string,
    component: 'ca1' | 'ca2' | 'exam',
    value: number
  ) => {
    const current = getStudentScoreBreakdown(student, subj);
    const updatedComp = { ...current, [component]: value };
    const newTotal = Math.min(100, Math.max(0, updatedComp.ca1 + updatedComp.ca2 + updatedComp.exam));

    const updatedStudent: Student = {
      ...student,
      grades: {
        ...(student.grades || {}),
        [subj]: newTotal
      },
      caScores: {
        ...(student.caScores || {}),
        [subj]: {
          ca1: updatedComp.ca1,
          ca2: updatedComp.ca2,
          exam: updatedComp.exam,
          remark: updatedComp.remark
        }
      }
    };

    await saveStudentChanges(updatedStudent);
  };

  // Update subject remark
  const handleUpdateSubjectRemark = async (student: Student, subj: string, remark: string) => {
    const current = getStudentScoreBreakdown(student, subj);
    const updatedStudent: Student = {
      ...student,
      caScores: {
        ...(student.caScores || {}),
        [subj]: {
          ...current,
          remark
        }
      }
    };
    await saveStudentChanges(updatedStudent);
  };

  // Submit Subject Marks to Board
  const handleSubmitSubjectScores = async () => {
    if (!activeClass || !activeSubject || classStudents.length === 0) return;
    const confirm = window.confirm(
      `Submit all ${activeSubject} scores for ${activeClass.name} to the Moderation Board? This locks your score sheet until reviewed.`
    );
    if (!confirm) return;

    for (const std of classStudents) {
      const updatedGradesStatus = {
        ...(std.gradesStatus || {}),
        [activeSubject]: 'Submitted' as const
      };
      const updatedMilestonesStatus = {
        ...(std.milestonesStatus || {}),
        [activeSubject]: 'Submitted' as const
      };
      await saveStudentChanges({
        ...std,
        gradesStatus: updatedGradesStatus,
        milestonesStatus: updatedMilestonesStatus
      });
    }

    if (addAuditLog) {
      addAuditLog(
        currentActiveUser?.name || 'Subject Teacher',
        'SUBMIT_SUBJECT_SCORES',
        `Submitted ${activeSubject} score ledger for class ${activeClass.name} (${classStudents.length} students).`,
        'SUCCESS'
      );
    }
    alert(`✅ Subject ${activeSubject} scores submitted for Board Moderation successfully!`);
  };

  // Class Teacher: Update Affective Trait
  const handleUpdateAffectiveTrait = async (student: Student, traitKey: string, score: number) => {
    const updated = {
      ...student,
      affectiveScores: {
        ...(student.affectiveScores || {}),
        [traitKey]: score
      }
    };
    await saveStudentChanges(updated);
  };

  // Class Teacher: Update Psychomotor Trait
  const handleUpdatePsychomotorTrait = async (student: Student, traitKey: string, score: number) => {
    const updated = {
      ...student,
      psychomotorScores: {
        ...(student.psychomotorScores || {}),
        [traitKey]: score
      }
    };
    await saveStudentChanges(updated);
  };

  // Class Teacher: Update Term Attendance Summary
  const handleUpdateAttendanceSummary = async (
    student: Student,
    daysOpened: number,
    daysPresent: number,
    daysAbsent: number
  ) => {
    const pct = daysOpened > 0 ? Math.round((daysPresent / daysOpened) * 100) : 100;
    const updated = {
      ...student,
      attendancePercentage: pct,
      attendanceSummary: {
        daysOpened,
        daysPresent,
        daysAbsent
      }
    };
    await saveStudentChanges(updated);
  };

  // Class Teacher: Update General Term Remark
  const handleUpdateClassTeacherRemark = async (student: Student, remark: string) => {
    const updated = {
      ...student,
      reportComment: remark
    };
    await saveStudentChanges(updated);
  };

  // Class Teacher: Update Principal Remark
  const handleUpdatePrincipalRemark = async (student: Student, remark: string) => {
    const updated = {
      ...student,
      principalRemark: remark
    };
    await saveStudentChanges(updated);
  };

  // Submit Full Class Dossier for Certification
  const handleSubmitClassDossier = async () => {
    if (!activeClass || classStudents.length === 0) return;
    const confirm = window.confirm(
      `Submit completed term dossier for ${activeClass.name} to the Principal / Academic Board for final endorsement and publishing?`
    );
    if (!confirm) return;

    for (const std of classStudents) {
      // Mark all subjects submitted
      const newGradesStatus: Record<string, 'Submitted'> = {};
      activeClass.subjects?.forEach(subj => {
        newGradesStatus[subj] = 'Submitted';
      });
      await saveStudentChanges({
        ...std,
        gradesStatus: {
          ...(std.gradesStatus || {}),
          ...newGradesStatus
        }
      });
    }

    if (addAuditLog) {
      addAuditLog(
        currentActiveUser?.name || 'Class Teacher',
        'SUBMIT_CLASS_DOSSIER',
        `Class Teacher submitted full term result dossier for ${activeClass.name}.`,
        'SUCCESS'
      );
    }
    alert(`🎉 Class dossier for ${activeClass.name} submitted to the Academic Board successfully!`);
  };

  // Admin / Exam Officer: Bulk Approve and Publish Results
  const handleBulkApproveAndPublish = async (shouldPublish: boolean) => {
    if (!activeClass || classStudents.length === 0) return;
    const actionName = shouldPublish ? 'Certify & Publish' : 'Unpublish / Return to Draft';
    const confirm = window.confirm(
      `Are you sure you want to ${actionName} results for ${activeClass.name}? ${
        shouldPublish
          ? 'Results will immediately become accessible on the Parent & Student Portal.'
          : 'Results will be hidden from the Parent Portal for further revisions.'
      }`
    );
    if (!confirm) return;

    setIsProcessingPublish(true);
    try {
      for (const std of classStudents) {
        const approvedGradesStatus: Record<string, 'Approved' | 'Draft'> = {};
        activeClass.subjects?.forEach(sub => {
          approvedGradesStatus[sub] = shouldPublish ? 'Approved' : 'Draft';
        });

        // Compute and store terminal rank snapshot
        const rankInfo = classRankings.get(std.id);

        await saveStudentChanges({
          ...std,
          resultsApproved: shouldPublish,
          terminalRank: rankInfo?.rank,
          terminalPercentile: rankInfo ? Math.round(((rankInfo.total - rankInfo.rank + 1) / rankInfo.total) * 100) : undefined,
          terminalRankCalculatedAt: new Date().toISOString(),
          gradesStatus: {
            ...(std.gradesStatus || {}),
            ...approvedGradesStatus
          }
        });
      }

      if (addAuditLog) {
        addAuditLog(
          currentActiveUser?.name || 'Academic Administrator',
          shouldPublish ? 'PUBLISH_RESULTS' : 'UNPUBLISH_RESULTS',
          `${actionName} term results for ${activeClass.name} (${classStudents.length} students).`,
          'SUCCESS'
        );
      }
      alert(`✅ Results for ${activeClass.name} successfully ${shouldPublish ? 'PUBLISHED to Parent Portal' : 'returned to draft'}!`);
    } finally {
      setIsProcessingPublish(false);
    }
  };

  // AI Gemini Report Card Comment Generator
  const handleGenerateAiComment = async () => {
    if (!currentCardStudent) return;
    setIsGeneratingAi(true);
    setAiGenError(null);

    try {
      const response = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentCardStudent.name,
          level: currentCardStudent.level,
          grade: currentCardStudent.grade,
          grades: currentCardStudent.grades,
          milestones: currentCardStudent.milestones,
          behaviorRating: currentCardStudent.behaviorRating || 'Good',
          customFocus: aiFocusPrompt
        })
      });

      const data = await response.json();
      if (response.ok && data.comment) {
        const revised = {
          ...currentCardStudent,
          reportComment: data.comment
        };
        await saveStudentChanges(revised);
        setActiveStudentForCard(revised);
        setAiFocusPrompt('');
      } else {
        setAiGenError(data.error || 'Failed to generate AI comment.');
      }
    } catch (err: any) {
      console.error('AI comment error:', err);
      setAiGenError('Network error connecting to Gemini API server.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Download Subject CSV Template
  const handleDownloadSubjectCsvTemplate = () => {
    if (!activeClass || !activeSubject) return;
    const headers = ['AdmissionNo', 'StudentName', 'CA1_Max20', 'CA2_Max20', 'Exam_Max60', 'TeacherRemark'];
    const rows = classStudents.map(s => {
      const bk = getStudentScoreBreakdown(s, activeSubject);
      const adm = s.enrollmentNo || `ADM-${s.id.slice(-4)}`;
      return `"${adm}","${s.name}",${bk.ca1},${bk.ca2},${bk.exam},"${bk.remark}"`;
    });

    const csvData = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SAMS_${activeClass.name}_${activeSubject}_ScoreTemplate.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download Class Broadsheet CSV
  const handleDownloadBroadsheetCsv = () => {
    if (!activeClass) return;
    const subjs = activeClass.subjects || [];
    const headers = ['AdmissionNo', 'StudentName', ...subjs, 'TotalScore', 'Average', 'Rank', 'DaysPresent', 'ClassTeacherRemark'];
    const rows = classStudents.map(s => {
      const adm = s.enrollmentNo || `ADM-${s.id.slice(-4)}`;
      const subjScores = subjs.map(sub => s.grades?.[sub] ?? 0);
      const total = subjScores.reduce((sum, v) => sum + v, 0);
      const avg = subjs.length > 0 ? Math.round(total / subjs.length) : 0;
      const rank = classRankings.get(s.id)?.rank || '-';
      const days = s.attendanceSummary?.daysPresent ?? s.attendancePercentage;
      const remark = (s.reportComment || '').replace(/"/g, '""');
      return `"${adm}","${s.name}",${subjScores.join(',')},${total},${avg},"${rank}",${days},"${remark}"`;
    });

    const csvData = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SAMS_${activeClass.name}_Master_Broadsheet.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV File Handler
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setCsvRawContent(text);
        parseCsvData(text);
      } catch (err: any) {
        setCsvError('Failed to parse uploaded CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const parseCsvData = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      setCsvError('The CSV file does not contain enough data rows.');
      return;
    }

    const header = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
    const parsedRows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Regex for CSV with quoted strings
      const rowVals: string[] = [];
      let inQuotes = false;
      let currVal = '';
      for (const ch of lines[i]) {
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          rowVals.push(currVal.trim());
          currVal = '';
        } else {
          currVal += ch;
        }
      }
      rowVals.push(currVal.trim());

      const rowObj: Record<string, string> = {};
      header.forEach((h, idx) => {
        rowObj[h] = rowVals[idx]?.replace(/^["']|["']$/g, '') || '';
      });

      // Match student
      const admNo = rowObj['AdmissionNo'] || rowObj['AdmNo'] || rowObj['ID'];
      const stdName = rowObj['StudentName'] || rowObj['Name'];
      const matchedStudent = classStudents.find(s => 
        (admNo && (s.enrollmentNo === admNo || s.id.includes(admNo))) ||
        (stdName && s.name.toLowerCase() === stdName.toLowerCase())
      );

      parsedRows.push({
        raw: rowObj,
        matchedStudent,
        status: matchedStudent ? 'VALID' : 'UNMATCHED'
      });
    }

    setCsvParsedRows(parsedRows);
    setIsCsvModalOpen(true);
  };

  // Commit Parsed CSV Scores
  const handleCommitCsvScores = async () => {
    if (!activeSubject || csvParsedRows.length === 0) return;
    setIsImporting(true);
    try {
      for (const row of csvParsedRows) {
        if (row.matchedStudent && row.status === 'VALID') {
          const ca1 = Math.min(20, Math.max(0, parseInt(row.raw['CA1_Max20'] || row.raw['CA1']) || 0));
          const ca2 = Math.min(20, Math.max(0, parseInt(row.raw['CA2_Max20'] || row.raw['CA2']) || 0));
          const exam = Math.min(60, Math.max(0, parseInt(row.raw['Exam_Max60'] || row.raw['Exam']) || 0));
          const total = ca1 + ca2 + exam;
          const remark = row.raw['TeacherRemark'] || row.raw['Remark'] || '';

          const updated: Student = {
            ...row.matchedStudent,
            grades: {
              ...(row.matchedStudent.grades || {}),
              [activeSubject]: total
            },
            caScores: {
              ...(row.matchedStudent.caScores || {}),
              [activeSubject]: { ca1, ca2, exam, remark }
            }
          };

          await saveStudentChanges(updated);
        }
      }

      setIsCsvModalOpen(false);
      setCsvParsedRows([]);
      setCsvRawContent('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert(`🎉 Successfully imported scores for ${activeSubject}!`);
    } catch (err: any) {
      setCsvError('Failed committing scores: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div id="erp-results-management-hub" className="space-y-6 animate-fade-in text-xs font-sans">
      {/* ========================================================
          1. HEADER & TOP-LEVEL RESULT WORKBENCH NAVIGATION
          ======================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Pencil className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-indigo-300 bg-indigo-900/40 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Academic Grading &amp; Certification Desk
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Results, Broadsheets &amp; Report Cards</h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Unified examination management center: Continuous assessment ledger, whole-class broadsheets, non-cognitive domains, authentic report card compilation, and Parent Portal release controls.
            </p>
          </div>

          {/* Active Teacher / User Role Badge */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-2xl p-3 text-right shrink-0">
            <span className="text-[9px] uppercase font-bold text-indigo-300 tracking-wider block">Active Session &amp; Term</span>
            <div className="flex items-center justify-end space-x-1.5 mt-0.5">
              <span className="font-bold text-white text-xs">{selectedSession}</span>
              <span className="text-slate-400">•</span>
              <span className="font-bold text-emerald-400 text-xs">{selectedTerm}</span>
            </div>
            <p className="text-[10px] text-slate-300 mt-1">
              Role: <strong className="text-white">{effectiveRole}</strong>
            </p>
          </div>
        </div>

        {/* 3 Main Result Sub-Module Navigation Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveSubTab('entry')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeSubTab === 'entry'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <Pencil className="w-4 h-4 text-indigo-300" />
            <span>1. Result Entry Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('cards')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeSubTab === 'cards'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>2. Report Cards &amp; Printing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('analysis')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeSubTab === 'analysis'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-300" />
            <span>3. Academic Analysis &amp; Publishing Hub</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. WORKFLOW HELPER & QUICK CLASS/TERM SELECTOR
          ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Class Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Class</label>
          <select
            value={selectedClassId || activeClass?.id || ''}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSubject('');
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {branchClasses.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Academic Session */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {academicSessions && academicSessions.length > 0 ? (
              academicSessions.map((s: any) => {
                const cleanName = s.name.match(/(\d{4}\/\d{4})/)?.[1] || s.name.replace(/ Academic Session/gi, '').trim();
                const isActive = s.status === 'active' || s.isCurrent;
                return (
                  <option key={s.id || s.name} value={cleanName}>
                    {cleanName} Academic Session {isActive ? '(Active)' : ''}
                  </option>
                );
              })
            ) : (
              <>
                <option value="2026/2027">2026/2027 Academic Session (Active)</option>
                <option value="2025/2026">2025/2026 Academic Session</option>
                <option value="2024/2025">2024/2025 Academic Session</option>
              </>
            )}
          </select>
        </div>

        {/* Term Cycle */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Term Period</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="First Term">First Term (Autumn)</option>
            <option value="Second Term">Second Term (Spring)</option>
            <option value="Third Term">Third Term (Summer / Annual)</option>
          </select>
        </div>

        {/* Class Overview Stats */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-indigo-700 tracking-wider block">Class Roster</span>
            <span className="text-sm font-black text-indigo-950">{classStudents.length} Students</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Subjects</span>
            <span className="text-sm font-black text-slate-700">{classSubjects.length} Registered</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          SUB-TAB 1: RESULT ENTRY LEDGER
          ======================================================== */}
      {activeSubTab === 'entry' && (
        <div className="space-y-6 animate-fade-in">
          {/* Mode Switcher: Subject Teacher Assessment vs Class Teacher Broadsheet */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setEntryMode('subject_teacher')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                entryMode === 'subject_teacher'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Subject Teacher Mode (Single Subject CA &amp; Exam Score Entry)</span>
            </button>

            <button
              type="button"
              onClick={() => setEntryMode('class_teacher_broadsheet')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                entryMode === 'class_teacher_broadsheet'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Class Teacher Mode (Broadsheet, Affective/Psychomotor Traits &amp; Attendance)</span>
            </button>
          </div>

          {/* -------------------------------------------------------------
              A. SUBJECT TEACHER SCORE ENTRY WORKSPACE
              ------------------------------------------------------------- */}
          {entryMode === 'subject_teacher' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Subject Selector & Actions Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-150 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Subject to Enter Marks:</label>
                    {subjectStatus === 'Approved' ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                        ✅ Approved &amp; Published
                      </span>
                    ) : subjectStatus === 'Submitted' ? (
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                        🔒 Submitted (Under Moderation)
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                        ✏️ Editable Draft
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={activeSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[200px]"
                    >
                      {classSubjects.map(subj => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-500">
                      Assessment Weight: <strong>1st CA ({DEFAULT_CA1_MAX})</strong> + <strong>2nd CA ({DEFAULT_CA2_MAX})</strong> + <strong>Exam ({DEFAULT_EXAM_MAX})</strong> = <strong>100%</strong>
                    </span>
                  </div>
                </div>

                {/* CSV Template Download & Upload Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleDownloadSubjectCsvTemplate}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Download pre-filled CSV template for this subject"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download CSV Template</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubjectLocked}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 border border-indigo-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Upload filled scores CSV"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Scores CSV</span>
                  </button>
                </div>
              </div>

              {/* Interactive Score Entry Grid */}
              {classStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No students are currently enrolled in {activeClass?.name}.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <th className="p-3.5 w-12 text-center">#</th>
                        <th className="p-3.5">Student Name &amp; ID</th>
                        <th className="p-3.5 text-center w-24">1st CA ({DEFAULT_CA1_MAX})</th>
                        <th className="p-3.5 text-center w-24">2nd CA ({DEFAULT_CA2_MAX})</th>
                        <th className="p-3.5 text-center w-24">Exam ({DEFAULT_EXAM_MAX})</th>
                        <th className="p-3.5 text-center w-24 bg-indigo-50/50">Total (100)</th>
                        <th className="p-3.5 text-center w-16 bg-indigo-50/50">Grade</th>
                        <th className="p-3.5">Subject Teacher Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {classStudents.map((s, idx) => {
                        const bk = getStudentScoreBreakdown(s, activeSubject);
                        const letterGrade = calculateGPA({ [activeSubject]: bk.total }).letter;

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 text-center text-[11px] font-mono text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900 text-xs">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {s.enrollmentNo || `ADM-${s.id.slice(-4)}`} • Room {s.classSection || 'A'}
                              </p>
                            </td>

                            {/* 1st CA input */}
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max={DEFAULT_CA1_MAX}
                                value={bk.ca1}
                                disabled={isSubjectLocked}
                                onChange={(e) => {
                                  const val = Math.min(DEFAULT_CA1_MAX, Math.max(0, parseInt(e.target.value) || 0));
                                  handleUpdateScoreComponent(s, activeSubject, 'ca1', val);
                                }}
                                className="w-16 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </td>

                            {/* 2nd CA input */}
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max={DEFAULT_CA2_MAX}
                                value={bk.ca2}
                                disabled={isSubjectLocked}
                                onChange={(e) => {
                                  const val = Math.min(DEFAULT_CA2_MAX, Math.max(0, parseInt(e.target.value) || 0));
                                  handleUpdateScoreComponent(s, activeSubject, 'ca2', val);
                                }}
                                className="w-16 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </td>

                            {/* Exam input */}
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max={DEFAULT_EXAM_MAX}
                                value={bk.exam}
                                disabled={isSubjectLocked}
                                onChange={(e) => {
                                  const val = Math.min(DEFAULT_EXAM_MAX, Math.max(0, parseInt(e.target.value) || 0));
                                  handleUpdateScoreComponent(s, activeSubject, 'exam', val);
                                }}
                                className="w-16 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </td>

                            {/* Auto Total */}
                            <td className="p-2 text-center bg-indigo-50/30">
                              <span className="font-mono font-black text-sm text-indigo-700">{bk.total}</span>
                            </td>

                            {/* Letter Grade */}
                            <td className="p-2 text-center bg-indigo-50/30">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                bk.total >= 70 ? 'bg-emerald-100 text-emerald-800' :
                                bk.total >= 50 ? 'bg-indigo-100 text-indigo-800' :
                                bk.total >= 40 ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {letterGrade}
                              </span>
                            </td>

                            {/* Subject Teacher Remark */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={bk.remark}
                                disabled={isSubjectLocked}
                                placeholder="e.g. Excellent grasp of topics, keep it up"
                                onChange={(e) => handleUpdateSubjectRemark(s, activeSubject, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Subject Submit Action Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4 gap-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Subject Assessment Verification</h4>
                  <p className="text-[11px] text-slate-500">
                    Once scores are complete, submit them to the Moderation Board for class broadsheet compilation.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={isSubjectLocked}
                    onClick={handleSubmitSubjectScores}
                    className="bg-indigo-600 hover:bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Submit {activeSubject} Scores to Board</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              B. CLASS TEACHER BROADSHEET & TRAITS WORKSPACE
              ------------------------------------------------------------- */}
          {entryMode === 'class_teacher_broadsheet' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Header Info & Broadsheet Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-150 pb-5">
                <div>
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full inline-block">
                    Class Teacher Master Broadsheet
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    Whole-Class Score Ledger &amp; Non-Cognitive Domains for {activeClass?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review all subject scores across the roster, rate affective and psychomotor domains, record attendance, and compile term remarks.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadBroadsheetCsv}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export Class Broadsheet CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitClassDossier}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Submit Class Dossier for Approval</span>
                  </button>
                </div>
              </div>

              {/* Master Broadsheet Table with Student Rows and All Subject Columns */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 min-w-[160px]">Student Name</th>
                      {classSubjects.map(subj => (
                        <th key={subj} className="p-3 text-center min-w-[70px]">
                          {subj}
                        </th>
                      ))}
                      <th className="p-3 text-center bg-indigo-50 font-black text-indigo-900">Total</th>
                      <th className="p-3 text-center bg-indigo-50 font-black text-indigo-900">Average</th>
                      <th className="p-3 text-center bg-amber-50 font-black text-amber-900">Rank</th>
                      <th className="p-3 text-center min-w-[100px]">Days Present / Opened</th>
                      <th className="p-3 min-w-[200px]">Class Teacher Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {classStudents.map((s, idx) => {
                      const rankInfo = classRankings.get(s.id);
                      const scores = classSubjects.map(sub => s.grades?.[sub] ?? 0);
                      const totalSum = scores.reduce((a, b) => a + b, 0);
                      const avg = classSubjects.length > 0 ? Math.round(totalSum / classSubjects.length) : 0;
                      const attendance = s.attendanceSummary || {
                        daysOpened: 110,
                        daysPresent: Math.round((s.attendancePercentage || 95) * 1.1),
                        daysAbsent: 110 - Math.round((s.attendancePercentage || 95) * 1.1)
                      };

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{s.enrollmentNo || `ADM-${s.id.slice(-4)}`}</p>
                          </td>

                          {/* Subject Scores */}
                          {classSubjects.map(subj => {
                            const score = s.grades?.[subj] ?? 0;
                            return (
                              <td key={subj} className="p-3 text-center font-mono font-bold">
                                <span className={score >= 70 ? 'text-emerald-700' : score >= 50 ? 'text-slate-800' : 'text-rose-600'}>
                                  {score}
                                </span>
                              </td>
                            );
                          })}

                          {/* Computed Total, Average, Rank */}
                          <td className="p-3 text-center bg-indigo-50/40 font-mono font-black text-indigo-900">{totalSum}</td>
                          <td className="p-3 text-center bg-indigo-50/40 font-mono font-black text-indigo-700">{avg}%</td>
                          <td className="p-3 text-center bg-amber-50/40 font-mono font-black text-amber-800">
                            #{rankInfo?.rank || idx + 1}
                          </td>

                          {/* Attendance input */}
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <input
                                type="number"
                                min="0"
                                max={attendance.daysOpened || 110}
                                value={attendance.daysPresent}
                                onChange={(e) => {
                                  const pres = parseInt(e.target.value) || 0;
                                  const opened = attendance.daysOpened || 110;
                                  handleUpdateAttendanceSummary(s, opened, pres, opened - pres);
                                }}
                                className="w-12 bg-slate-50 border border-slate-200 rounded p-1 text-center font-mono text-xs font-bold"
                              />
                              <span className="text-slate-400 font-mono">/ {attendance.daysOpened || 110}</span>
                            </div>
                          </td>

                          {/* Class Teacher Remark */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={s.reportComment || ''}
                              placeholder="General term remark..."
                              onChange={(e) => handleUpdateClassTeacherRemark(s, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Affective & Psychomotor Traits Quick Assessment Drawer */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Non-Cognitive Domain Assessment Form (Affective &amp; Psychomotor Ratings)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Scale: 1 (Poor) to 5 (Excellent)</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Select Student for Behavioral Domain Scoring */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Select Student to Rate Behavioral Traits:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                      {classStudents.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setActiveStudentForCard(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentCardStudent?.id === s.id
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>

                    {currentCardStudent && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                        <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">
                          Affective Traits: {currentCardStudent.name}
                        </span>
                        <div className="space-y-2">
                          {AFFECTIVE_TRAITS.map(trait => {
                            const score = currentCardStudent.affectiveScores?.[trait.key] || 4;
                            return (
                              <div key={trait.key} className="flex items-center justify-between text-xs">
                                <span className="text-slate-700 font-medium">{trait.label}</span>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => handleUpdateAffectiveTrait(currentCardStudent, trait.key, star)}
                                      className={`w-6 h-6 rounded font-bold text-[10px] transition-all cursor-pointer ${
                                        score >= star
                                          ? 'bg-amber-400 text-slate-950 font-black'
                                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                      }`}
                                    >
                                      {star}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Psychomotor Skills Rating Form */}
                  {currentCardStudent && (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 h-full">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                          Psychomotor Skills: {currentCardStudent.name}
                        </span>
                        <div className="space-y-2">
                          {PSYCHOMOTOR_TRAITS.map(trait => {
                            const score = currentCardStudent.psychomotorScores?.[trait.key] || 4;
                            return (
                              <div key={trait.key} className="flex items-center justify-between text-xs">
                                <span className="text-slate-700 font-medium">{trait.label}</span>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => handleUpdatePsychomotorTrait(currentCardStudent, trait.key, star)}
                                      className={`w-6 h-6 rounded font-bold text-[10px] transition-all cursor-pointer ${
                                        score >= star
                                          ? 'bg-emerald-500 text-white font-black'
                                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                      }`}
                                    >
                                      {star}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Principal Endorsement Note */}
                        <div className="pt-2 border-t border-slate-150 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Principal / Head Teacher Endorsement Remark:
                          </label>
                          <input
                            type="text"
                            value={currentCardStudent.principalRemark || ''}
                            placeholder="e.g. Approved for promotion with commendation."
                            onChange={(e) => handleUpdatePrincipalRemark(currentCardStudent, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: REPORT CARDS & PRINTING DESK
          ======================================================== */}
      {activeSubTab === 'cards' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Controls Bar: Student Selector & Batch Print */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Student:</label>
              <select
                value={currentCardStudent?.id || ''}
                onChange={(e) => {
                  const std = classStudents.find(s => s.id === e.target.value);
                  if (std) setActiveStudentForCard(std);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[220px]"
              >
                {classStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.enrollmentNo || `ADM-${s.id.slice(-4)}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Single Report Card</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsBatchPrintMode(true);
                  setTimeout(() => window.print(), 300);
                }}
                className="bg-slate-800 hover:bg-slate-950 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-300" />
                <span>Batch Print All Class Report Cards</span>
              </button>
            </div>
          </div>

          {/* AI Gemini Comment Generator Assistant */}
          {currentCardStudent && (
            <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50 border border-indigo-100 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 fill-indigo-100 animate-pulse" />
                  <h4 className="font-extrabold text-slate-900 text-xs">AI-Assisted Term Comment Generator (Gemini 3.5)</h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-full">
                  Student: {currentCardStudent.name}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={aiFocusPrompt}
                  onChange={(e) => setAiFocusPrompt(e.target.value)}
                  placeholder="Optional guidance (e.g. 'Commend outstanding math skills and encourage consistent reading habits')"
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateAiComment}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      <span>Drafting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Draft Report Comment</span>
                    </>
                  )}
                </button>
              </div>
              {aiGenError && (
                <p className="text-[11px] text-rose-600 font-medium">{aiGenError}</p>
              )}
            </div>
          )}

          {/* ========================================================
              AUTHENTIC OFFICIAL PRINTABLE REPORT CARD TEMPLATE
              ======================================================== */}
          {currentCardStudent ? (() => {
            const rankInfo = classRankings.get(currentCardStudent.id);
            const secularGrades = getSecularGrades(currentCardStudent.grades || {});
            const gpa = calculateGPA(secularGrades);
            const totalScore = Object.values(currentCardStudent.grades || {}).reduce((a: number, b: any) => (Number(a) || 0) + (Number(b) || 0), 0);
            const attendance = currentCardStudent.attendanceSummary || {
              daysOpened: 110,
              daysPresent: Math.round((currentCardStudent.attendancePercentage || 95) * 1.1),
              daysAbsent: 110 - Math.round((currentCardStudent.attendancePercentage || 95) * 1.1)
            };

            return (
              <div className="bg-white border-2 border-slate-300 rounded-3xl p-8 shadow-md max-w-4xl mx-auto space-y-6 text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:m-0">
                {/* 1. Header & School Crest */}
                <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-5">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-900 flex items-center justify-center text-white font-black text-xl shadow">
                      B
                    </div>
                    <div>
                      <h1 className="font-serif font-black text-xl uppercase tracking-widest text-slate-950">
                        Beacon Academy International
                      </h1>
                      <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">
                        Directorate of Academic Evaluations &amp; Student Certification
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Plot 148 Academic Crescent, Garki District • Email: registrar@beacon.edu
                      </p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full inline-block">
                      Official Term Progress Report Card
                    </span>
                  </div>
                </div>

                {/* 2. Candidate Biodata & Placement Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Candidate Name</span>
                    <strong className="text-slate-900 text-sm">{currentCardStudent.name}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Admission / Roll No</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {currentCardStudent.enrollmentNo || `ADM-${currentCardStudent.id.slice(-4)}`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Class &amp; Division</span>
                    <strong className="text-slate-900 text-sm">
                      {currentCardStudent.grade} (Room {currentCardStudent.classSection || 'A'})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Term &amp; Session</span>
                    <strong className="text-slate-900 text-sm">{selectedTerm} • {selectedSession}</strong>
                  </div>
                </div>

                {/* 3. Subject-by-Subject Assessment Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 border-b pb-1">
                    Scholastic Performance Breakdown
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[9px] uppercase font-bold text-slate-600 tracking-wider">
                          <th className="p-2.5">Subject</th>
                          <th className="p-2.5 text-center">1st CA (20)</th>
                          <th className="p-2.5 text-center">2nd CA (20)</th>
                          <th className="p-2.5 text-center">Exam (60)</th>
                          <th className="p-2.5 text-center font-black bg-indigo-50 text-indigo-900">Total (100)</th>
                          <th className="p-2.5 text-center font-black bg-indigo-50 text-indigo-900">Grade</th>
                          <th className="p-2.5">Teacher Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classSubjects.map(subj => {
                          const bk = getStudentScoreBreakdown(currentCardStudent, subj);
                          const gradeLetter = calculateGPA({ [subj]: bk.total }).letter;

                          return (
                            <tr key={subj} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-900">{subj}</td>
                              <td className="p-2.5 text-center font-mono">{bk.ca1}</td>
                              <td className="p-2.5 text-center font-mono">{bk.ca2}</td>
                              <td className="p-2.5 text-center font-mono">{bk.exam}</td>
                              <td className="p-2.5 text-center font-mono font-black text-indigo-700 bg-indigo-50/40">
                                {bk.total}
                              </td>
                              <td className="p-2.5 text-center font-black bg-indigo-50/40">
                                <span className={`px-2 py-0.5 rounded text-[9px] ${
                                  bk.total >= 70 ? 'bg-emerald-100 text-emerald-800' :
                                  bk.total >= 50 ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {gradeLetter}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-600 italic text-[11px]">
                                {bk.remark || 'Satisfactory achievement in coursework.'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Term Summary Performance & Attendance Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Marks</span>
                    <strong className="text-base font-black text-indigo-900 font-mono">{totalScore}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Term Average &amp; GPA</span>
                    <strong className="text-base font-black text-indigo-900 font-mono">
                      {gpa.avg}% ({gpa.letter})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Class Position</span>
                    <strong className="text-base font-black text-amber-900 font-mono">
                      #{rankInfo?.rank || 1} of {classStudents.length}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Attendance Rate</span>
                    <strong className="text-base font-black text-emerald-800 font-mono">
                      {attendance.daysPresent} / {attendance.daysOpened} ({currentCardStudent.attendancePercentage || 95}%)
                    </strong>
                  </div>
                </div>

                {/* 5. Affective & Psychomotor Traits Grids */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Affective Traits */}
                  <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 block border-b pb-1">
                      Affective Domain Rating (1 - 5)
                    </span>
                    <div className="space-y-1 text-[11px]">
                      {AFFECTIVE_TRAITS.map(t => (
                        <div key={t.key} className="flex justify-between items-center">
                          <span className="text-slate-600">{t.label}</span>
                          <span className="font-mono font-bold text-indigo-700">
                            {'★'.repeat(currentCardStudent.affectiveScores?.[t.key] || 4)}
                            <span className="text-slate-200">{'★'.repeat(5 - (currentCardStudent.affectiveScores?.[t.key] || 4))}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Psychomotor Skills */}
                  <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 block border-b pb-1">
                      Psychomotor Skills Rating (1 - 5)
                    </span>
                    <div className="space-y-1 text-[11px]">
                      {PSYCHOMOTOR_TRAITS.map(t => (
                        <div key={t.key} className="flex justify-between items-center">
                          <span className="text-slate-600">{t.label}</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {'★'.repeat(currentCardStudent.psychomotorScores?.[t.key] || 4)}
                            <span className="text-slate-200">{'★'.repeat(5 - (currentCardStudent.psychomotorScores?.[t.key] || 4))}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. Formal Remarks & Principal Seal */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Class Teacher's Term Remark:</span>
                    <p className="text-xs italic text-slate-800 font-serif leading-relaxed mt-0.5">
                      "{currentCardStudent.reportComment || 'A dedicated and polite student who consistently demonstrates high scholastic competence and positive civic leadership.'}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Principal's Formal Endorsement:</span>
                    <p className="text-xs italic text-slate-800 font-serif leading-relaxed mt-0.5">
                      "{currentCardStudent.principalRemark || 'Commendable performance this academic session. Results certified and approved for next term enrollment.'}"
                    </p>
                  </div>
                </div>

                {/* 7. Official Sign-off and Resumption Date */}
                <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                  <div className="space-y-6">
                    <div className="h-0.5 bg-slate-300 w-28 mx-auto" />
                    <span>Class Teacher Signature</span>
                  </div>
                  <div className="space-y-6">
                    <div className="h-0.5 bg-slate-300 w-28 mx-auto" />
                    <span>Academic Registrar Seal</span>
                  </div>
                  <div className="space-y-6">
                    <div className="h-0.5 bg-slate-300 w-28 mx-auto" />
                    <span>Principal Signature</span>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    Next Term Resumption Date: <strong>Monday, 15th September 2026</strong> • Verification ID: {currentCardStudent.id}
                  </span>
                </div>
              </div>
            );
          })() : (
            <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-3xl border">
              Select a student to view their formal report card.
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: ACADEMIC ANALYSIS, RANKING & PUBLISHING HUB
          ======================================================== */}
      {activeSubTab === 'analysis' && (
        <div className="space-y-6 animate-fade-in">
          {/* Moderation & Parent Portal Publishing Control Box */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="bg-indigo-600/40 text-indigo-300 text-[10px] uppercase font-mono font-bold tracking-widest px-3 py-1 rounded-full border border-indigo-500/30 inline-block">
                  Academic Moderation &amp; Publishing Engine
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Certify &amp; Release Results for {activeClass?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Review class-wide rankings, enforce fee clearance restrictions, and authorize the digital release of report cards to the Parent Portal.
                </p>
              </div>

              {/* Publish / Unpublish Action Button */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessingPublish}
                  onClick={() => handleBulkApproveAndPublish(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Publish to Parent Portal</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessingPublish}
                  onClick={() => handleBulkApproveAndPublish(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl border border-slate-700 text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Revoke / Return to Draft</span>
                </button>
              </div>
            </div>

            {/* Financial Clearance Restriction Toggle */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-white text-xs">Fee Clearance Security Gate</span>
                  <span className="bg-amber-900/50 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Policy Rule
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  When enabled, parents with overdue tuition balances will see a financial clearance alert instead of their ward's report card.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEnforceFeeClearance(!enforceFeeClearance)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  enforceFeeClearance
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {enforceFeeClearance ? 'Enforce Fee Clearance (ON)' : 'Allow All Parents (OFF)'}
              </button>
            </div>
          </div>

          {/* Class Ranking & Performance Leaderboard */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Class Ranking &amp; Performance Leaderboard ({activeClass?.name})</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Standard Competition Ranking (Ties Handled)
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="p-3.5 text-center w-16">Position</th>
                    <th className="p-3.5">Student Name &amp; ID</th>
                    <th className="p-3.5 text-center">Average %</th>
                    <th className="p-3.5 text-center">Letter Grade</th>
                    <th className="p-3.5 text-center">Total Score</th>
                    <th className="p-3.5 text-center">Portal Status</th>
                    <th className="p-3.5 text-center">Financial Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from(classRankings.entries())
                    .sort((a, b) => a[1].rank - b[1].rank)
                    .map(([studentId, info]) => {
                      const s = classStudents.find(std => std.id === studentId);
                      if (!s) return null;
                      const letter = calculateGPA(getSecularGrades(s.grades || {})).letter;
                      const hasFeeDebt = (s.feeStatements?.outstandingBalance || 0) > 0;
                      const isPublished = s.resultsApproved === true;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 text-center">
                            <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center font-black text-xs ${
                              info.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs' :
                              info.rank === 2 ? 'bg-slate-200 text-slate-800' :
                              info.rank === 3 ? 'bg-amber-50 text-amber-800' :
                              'text-slate-500 font-mono'
                            }`}>
                              #{info.rank}
                            </span>
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{s.enrollmentNo || `ADM-${s.id.slice(-4)}`}</p>
                          </td>
                          <td className="p-3 text-center font-mono font-black text-indigo-700 text-sm">
                            {info.avg}%
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 font-black px-2 py-0.5 rounded text-[10px]">
                              {letter}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700">
                            {info.totalScore}
                          </td>
                          <td className="p-3 text-center">
                            {isPublished ? (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                                🟢 Published
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 border border-slate-300 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                                ⚪ Draft / Hidden
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {hasFeeDebt ? (
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                ⚠️ Fee Debt (${s.feeStatements?.outstandingBalance})
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                ✅ Cleared
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CSV PREVIEW & COMMIT MODAL
          ======================================================== */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Verify Uploaded Scores for {activeSubject}</h3>
                <p className="text-[11px] text-slate-500">Review mapped student scores before committing to ledger.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-2">Student Name</th>
                    <th className="p-2 text-center">1st CA</th>
                    <th className="p-2 text-center">2nd CA</th>
                    <th className="p-2 text-center">Exam</th>
                    <th className="p-2 text-center">Total</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {csvParsedRows.map((r, idx) => {
                    const ca1 = parseInt(r.raw['CA1_Max20'] || r.raw['CA1']) || 0;
                    const ca2 = parseInt(r.raw['CA2_Max20'] || r.raw['CA2']) || 0;
                    const exam = parseInt(r.raw['Exam_Max60'] || r.raw['Exam']) || 0;
                    const total = ca1 + ca2 + exam;

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-800">
                          {r.matchedStudent ? r.matchedStudent.name : r.raw['StudentName'] || 'Unknown'}
                        </td>
                        <td className="p-2 text-center font-mono">{ca1}</td>
                        <td className="p-2 text-center font-mono">{ca2}</td>
                        <td className="p-2 text-center font-mono">{exam}</td>
                        <td className="p-2 text-center font-mono font-black text-indigo-700">{total}</td>
                        <td className="p-2 text-center">
                          {r.status === 'VALID' ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold">
                              ✓ Mapped
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[9px] font-bold">
                              ✕ Unmatched
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={handleCommitCsvScores}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                    <span>Committing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Commit Scores to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
