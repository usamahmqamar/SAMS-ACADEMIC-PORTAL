import React, { useState, useMemo } from 'react';
import {
  FileText,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileCheck,
  Layers,
  GraduationCap,
  Award,
  Building2,
  BarChart3,
  History,
  Download,
  Printer,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Check,
  X,
  Sparkles,
  Calendar,
  User,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { TeachingRecord } from '../data/teachingRecordData';
import { WeeklyMilestone, defaultChecklists } from '../data/curriculumData';
import {
  ReportType,
  REPORT_DEFINITIONS,
  HISTORICAL_TERMS_DATA,
  HISTORICAL_SESSIONS_DATA,
  SAMPLE_LATE_SUBMISSIONS,
  SAMPLE_MISSING_SUBMISSIONS
} from '../data/reportData';
import { exportToCsv, exportToExcelXml } from '../utils/reportExportUtils';

interface TeachingPerformanceReportsProps {
  teachingRecords: TeachingRecord[];
  classes: any[];
  subjects: any[];
  teachers: any[];
  selectedBranch: string;
  currentSimulatedRole?: string;
  academicSessions?: string[];
  terms?: string[];
  curriculumChecklists?: Record<string, WeeklyMilestone[]>;
}

export const TeachingPerformanceReports: React.FC<TeachingPerformanceReportsProps> = ({
  teachingRecords,
  classes = [],
  subjects = [],
  teachers = [],
  selectedBranch,
  currentSimulatedRole,
  academicSessions = ['2026/2027', '2025/2026', '2024/2025'],
  terms = ['First Term', 'Second Term', 'Third Term'],
  curriculumChecklists = defaultChecklists
}) => {
  // Selected active report
  const [activeReport, setActiveReport] = useState<ReportType>('teachingRecord');

  // Filters
  const [filterBranch, setFilterBranch] = useState<string>(selectedBranch || 'All');
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterTeacher, setFilterTeacher] = useState<string>('All');
  const [filterTerm, setFilterTerm] = useState<string>('All');
  const [filterSession, setFilterSession] = useState<string>('2026/2027');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Export & Print state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Helper to check section
  const getSectionForClass = (className: string) => {
    const c = className.toLowerCase();
    if (c.includes('nursery') || c.includes('kg') || c.includes('creche')) return 'Nursery';
    if (c.includes('primary') || c.includes('pry')) return 'Primary';
    if (c.includes('junior') || c.includes('jss')) return 'Junior Secondary';
    if (c.includes('senior') || c.includes('sss') || c.includes('ss')) return 'Senior Secondary';
    return 'Primary';
  };

  // 1. FILTERED TEACHING RECORDS
  const filteredRecords = useMemo(() => {
    return teachingRecords.filter(r => {
      if (filterBranch !== 'All' && r.branch !== filterBranch && `${r.branch} Campus` !== filterBranch) return false;
      if (filterClass !== 'All' && r.classId !== filterClass) return false;
      if (filterSubject !== 'All' && r.subject !== filterSubject) return false;
      if (filterTeacher !== 'All' && r.teacherName !== filterTeacher && r.teacherId !== filterTeacher) return false;
      if (filterTerm !== 'All' && r.term !== filterTerm) return false;
      if (filterSession !== 'All' && r.academicSession && !r.academicSession.includes(filterSession.split(' ')[0])) return false;
      if (filterSection !== 'All') {
        const sec = getSectionForClass(r.classId);
        if (sec !== filterSection) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = 
          r.teacherName.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.classId.toLowerCase().includes(q) ||
          r.topic.toLowerCase().includes(q) ||
          (r.subTopic && r.subTopic.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [teachingRecords, filterBranch, filterClass, filterSubject, filterTeacher, filterTerm, filterSession, filterSection, searchQuery]);

  // 2. CURRICULUM COVERAGE DATA
  const curriculumCoverageData = useMemo(() => {
    const list = [
      { branch: 'GN', section: 'Primary', className: 'Primary 5 - Gold', subject: 'Primary Mathematics', teacherName: 'Aisha Garba', plannedTopics: 22, taughtTopics: 20, coveredInBooks: 19, pacingStatus: 'On Schedule', coveragePct: 90.9, markedBooksPct: 95 },
      { branch: 'GN', section: 'Primary', className: 'Primary 5 - Gold', subject: 'Basic Science & Technology', teacherName: 'Usman Bello', plannedTopics: 22, taughtTopics: 17, coveredInBooks: 15, pacingStatus: 'Behind Schedule', coveragePct: 77.2, markedBooksPct: 78 },
      { branch: 'GN', section: 'Junior Secondary', className: 'Junior Sec 1 - Alpha', subject: 'Social Studies & Civic Education', teacherName: 'Ibrahim Aliyu', plannedTopics: 24, taughtTopics: 24, coveredInBooks: 23, pacingStatus: 'On Schedule', coveragePct: 100, markedBooksPct: 92 },
      { branch: 'RS', section: 'Primary', className: 'Primary 4 - Diamond', subject: 'Basic English & Grammar', teacherName: 'Fatima Sanusi', plannedTopics: 22, taughtTopics: 18, coveredInBooks: 16, pacingStatus: 'Behind Schedule', coveragePct: 81.8, markedBooksPct: 80 },
      { branch: 'RS', section: 'Nursery', className: 'Nursery 2 - Rose', subject: 'Rhymes & Phonics', teacherName: 'Zainab Umar', plannedTopics: 16, taughtTopics: 16, coveredInBooks: 16, pacingStatus: 'On Schedule', coveragePct: 100, markedBooksPct: 98 },
      { branch: 'RS', section: 'Primary', className: 'Primary 3 - Emerald', subject: 'Primary Mathematics', teacherName: 'Amina Yusuf', plannedTopics: 20, taughtTopics: 20, coveredInBooks: 19, pacingStatus: 'On Schedule', coveragePct: 100, markedBooksPct: 90 }
    ];

    return list.filter(item => {
      if (filterBranch !== 'All' && item.branch !== filterBranch) return false;
      if (filterSection !== 'All' && item.section !== filterSection) return false;
      if (filterClass !== 'All' && item.className !== filterClass) return false;
      if (filterSubject !== 'All' && item.subject !== filterSubject) return false;
      if (filterTeacher !== 'All' && item.teacherName !== filterTeacher) return false;
      return true;
    });
  }, [filterBranch, filterSection, filterClass, filterSubject, filterTeacher]);

  // 3. TEACHER SUBMISSION DATA
  const teacherSubmissionData = useMemo(() => {
    const list = [
      { teacherId: 'staff-1', teacherName: 'Aisha Garba', branch: 'GN', section: 'Primary', totalLogs: 28, onTime: 27, late: 1, missing: 0, drafts: 2, reviewed: 26, onTimeRate: 96.4, status: 'Compliant' },
      { teacherId: 'staff-2', teacherName: 'Usman Bello', branch: 'GN', section: 'Primary', totalLogs: 22, onTime: 18, late: 3, missing: 1, drafts: 4, reviewed: 18, onTimeRate: 81.8, status: 'Needs Attention' },
      { teacherId: 'staff-3', teacherName: 'Fatima Sanusi', branch: 'RS', section: 'Primary', totalLogs: 24, onTime: 21, late: 3, missing: 0, drafts: 1, reviewed: 23, onTimeRate: 87.5, status: 'Compliant' },
      { teacherId: 'staff-4', teacherName: 'Ibrahim Aliyu', branch: 'GN', section: 'Junior Secondary', totalLogs: 30, onTime: 29, late: 1, missing: 0, drafts: 0, reviewed: 30, onTimeRate: 96.7, status: 'Compliant' },
      { teacherId: 'staff-6', teacherName: 'Zainab Umar', branch: 'RS', section: 'Nursery', totalLogs: 20, onTime: 18, late: 1, missing: 1, drafts: 1, reviewed: 19, onTimeRate: 90.0, status: 'Compliant' },
      { teacherId: 'staff-7', teacherName: 'Amina Yusuf', branch: 'RS', section: 'Primary', totalLogs: 25, onTime: 24, late: 1, missing: 0, drafts: 1, reviewed: 24, onTimeRate: 96.0, status: 'Compliant' }
    ];

    return list.filter(t => {
      if (filterBranch !== 'All' && t.branch !== filterBranch) return false;
      if (filterSection !== 'All' && t.section !== filterSection) return false;
      if (filterTeacher !== 'All' && t.teacherName !== filterTeacher) return false;
      return true;
    });
  }, [filterBranch, filterSection, filterTeacher]);

  // 4. LATE SUBMISSIONS DATA
  const lateSubmissionsData = useMemo(() => {
    return SAMPLE_LATE_SUBMISSIONS.filter(item => {
      if (filterBranch !== 'All' && item.branch !== filterBranch) return false;
      if (filterTeacher !== 'All' && item.teacherName !== filterTeacher) return false;
      if (filterClass !== 'All' && item.className !== filterClass) return false;
      if (filterSubject !== 'All' && item.subject !== filterSubject) return false;
      return true;
    });
  }, [filterBranch, filterTeacher, filterClass, filterSubject]);

  // 5. MISSING SUBMISSIONS DATA
  const missingSubmissionsData = useMemo(() => {
    return SAMPLE_MISSING_SUBMISSIONS.filter(item => {
      if (filterBranch !== 'All' && item.branch !== filterBranch) return false;
      if (filterTeacher !== 'All' && item.teacherName !== filterTeacher) return false;
      if (filterClass !== 'All' && item.className !== filterClass) return false;
      if (filterSubject !== 'All' && item.subject !== filterSubject) return false;
      return true;
    });
  }, [filterBranch, filterTeacher, filterClass, filterSubject]);

  // 6. TEACHING PROGRESS DATA
  const teachingProgressData = useMemo(() => {
    const list = [
      { className: 'Primary 5 - Gold', subject: 'Primary Mathematics', branch: 'GN', teacherName: 'Aisha Garba', planned: 22, taught: 20, ahead: 0, onSchedule: 20, behind: 2, pacingScore: 90.9, status: 'On Schedule' },
      { className: 'Primary 5 - Gold', subject: 'Basic Science & Technology', branch: 'GN', teacherName: 'Usman Bello', planned: 22, taught: 17, ahead: 0, onSchedule: 17, behind: 5, pacingScore: 77.2, status: 'Behind Schedule' },
      { className: 'Junior Sec 1 - Alpha', subject: 'Social Studies & Civic Education', branch: 'GN', teacherName: 'Ibrahim Aliyu', planned: 24, taught: 24, ahead: 1, onSchedule: 23, behind: 0, pacingScore: 100, status: 'On Schedule' },
      { className: 'Primary 4 - Diamond', subject: 'Basic English & Grammar', branch: 'RS', teacherName: 'Fatima Sanusi', planned: 22, taught: 18, ahead: 0, onSchedule: 18, behind: 4, pacingScore: 81.8, status: 'Behind Schedule' },
      { className: 'Nursery 2 - Rose', subject: 'Rhymes & Phonics', branch: 'RS', teacherName: 'Zainab Umar', planned: 16, taught: 16, ahead: 2, onSchedule: 14, behind: 0, pacingScore: 100, status: 'On Schedule' },
      { className: 'Primary 3 - Emerald', subject: 'Primary Mathematics', branch: 'RS', teacherName: 'Amina Yusuf', planned: 20, taught: 20, ahead: 0, onSchedule: 20, behind: 0, pacingScore: 100, status: 'On Schedule' }
    ];

    return list.filter(item => {
      if (filterBranch !== 'All' && item.branch !== filterBranch) return false;
      if (filterClass !== 'All' && item.className !== filterClass) return false;
      if (filterSubject !== 'All' && item.subject !== filterSubject) return false;
      if (filterTeacher !== 'All' && item.teacherName !== filterTeacher) return false;
      return true;
    });
  }, [filterBranch, filterClass, filterSubject, filterTeacher]);

  // 7. STUDENT BOOK COVERAGE DATA
  const studentBookCoverageData = useMemo(() => {
    const list = [
      { className: 'Primary 5 - Gold', subject: 'Primary Mathematics', teacherName: 'Aisha Garba', branch: 'GN', totalStudents: 30, booksAudited: 30, fullyMarked: 28, coverageRate: 93.3, flaggedCount: 3, lastAuditDate: '2026-06-25' },
      { className: 'Primary 5 - Gold', subject: 'Basic Science & Technology', teacherName: 'Usman Bello', branch: 'GN', totalStudents: 30, booksAudited: 25, fullyMarked: 20, coverageRate: 80.0, flaggedCount: 5, lastAuditDate: '2026-06-24' },
      { className: 'Junior Sec 1 - Alpha', subject: 'Social Studies & Civic Education', teacherName: 'Ibrahim Aliyu', branch: 'GN', totalStudents: 28, booksAudited: 28, fullyMarked: 27, coverageRate: 96.4, flaggedCount: 1, lastAuditDate: '2026-06-25' },
      { className: 'Primary 4 - Diamond', subject: 'Basic English & Grammar', teacherName: 'Fatima Sanusi', branch: 'RS', totalStudents: 26, booksAudited: 24, fullyMarked: 21, coverageRate: 87.5, flaggedCount: 4, lastAuditDate: '2026-06-23' },
      { className: 'Nursery 2 - Rose', subject: 'Rhymes & Phonics', teacherName: 'Zainab Umar', branch: 'RS', totalStudents: 22, booksAudited: 22, fullyMarked: 22, coverageRate: 100, flaggedCount: 0, lastAuditDate: '2026-06-25' },
      { className: 'Primary 3 - Emerald', subject: 'Primary Mathematics', teacherName: 'Amina Yusuf', branch: 'RS', totalStudents: 25, booksAudited: 25, fullyMarked: 23, coverageRate: 92.0, flaggedCount: 2, lastAuditDate: '2026-06-24' }
    ];

    return list.filter(item => {
      if (filterBranch !== 'All' && item.branch !== filterBranch) return false;
      if (filterClass !== 'All' && item.className !== filterClass) return false;
      if (filterSubject !== 'All' && item.subject !== filterSubject) return false;
      if (filterTeacher !== 'All' && item.teacherName !== filterTeacher) return false;
      return true;
    });
  }, [filterBranch, filterClass, filterSubject, filterTeacher]);

  // 8. SUBJECT COVERAGE DATA
  const subjectCoverageData = useMemo(() => {
    const list = [
      { subject: 'Primary Mathematics', sections: 'Primary', activeTeachers: 2, classesAssigned: 3, plannedTopics: 42, taughtTopics: 40, avgCoverage: 95.2, avgMarking: 92.7, status: 'On Schedule' },
      { subject: 'Basic English & Grammar', sections: 'Primary', activeTeachers: 2, classesAssigned: 3, plannedTopics: 44, taughtTopics: 38, avgCoverage: 86.4, avgMarking: 83.5, status: 'Behind Schedule' },
      { subject: 'Basic Science & Technology', sections: 'Primary', activeTeachers: 1, classesAssigned: 2, plannedTopics: 22, taughtTopics: 17, avgCoverage: 77.3, avgMarking: 80.0, status: 'Behind Schedule' },
      { subject: 'Social Studies & Civic Education', sections: 'Junior Secondary', activeTeachers: 1, classesAssigned: 2, plannedTopics: 24, taughtTopics: 24, avgCoverage: 100, avgMarking: 96.4, status: 'On Schedule' },
      { subject: 'Rhymes & Phonics', sections: 'Nursery', activeTeachers: 1, classesAssigned: 2, plannedTopics: 16, taughtTopics: 16, avgCoverage: 100, avgMarking: 100, status: 'On Schedule' },
      { subject: 'Arabic Language & Islamic Studies', sections: 'Primary & Secondary', activeTeachers: 2, classesAssigned: 4, plannedTopics: 36, taughtTopics: 34, avgCoverage: 94.4, avgMarking: 91.0, status: 'On Schedule' }
    ];

    return list.filter(item => {
      if (filterSubject !== 'All' && item.subject !== filterSubject) return false;
      if (filterSection !== 'All' && !item.sections.includes(filterSection)) return false;
      return true;
    });
  }, [filterSubject, filterSection]);

  // 9. CLASS PROGRESS DATA
  const classProgressData = useMemo(() => {
    const list = [
      { className: 'Primary 5 - Gold', branch: 'GN', section: 'Primary', classTeacher: 'Aisha Garba', enrolledStudents: 30, subjectsTaught: 6, overallPacing: 86.5, avgBookMarking: 88.0, laggingSubjects: ['Basic Science & Technology'], status: 'Needs Attention' },
      { className: 'Junior Sec 1 - Alpha', branch: 'GN', section: 'Junior Secondary', classTeacher: 'Ibrahim Aliyu', enrolledStudents: 28, subjectsTaught: 8, overallPacing: 98.0, avgBookMarking: 95.0, laggingSubjects: [], status: 'On Schedule' },
      { className: 'Primary 4 - Diamond', branch: 'RS', section: 'Primary', classTeacher: 'Fatima Sanusi', enrolledStudents: 26, subjectsTaught: 6, overallPacing: 84.0, avgBookMarking: 82.5, laggingSubjects: ['Basic English & Grammar'], status: 'Needs Attention' },
      { className: 'Nursery 2 - Rose', branch: 'RS', section: 'Nursery', classTeacher: 'Zainab Umar', enrolledStudents: 22, subjectsTaught: 4, overallPacing: 100, avgBookMarking: 98.0, laggingSubjects: [], status: 'On Schedule' },
      { className: 'Primary 3 - Emerald', branch: 'RS', section: 'Primary', classTeacher: 'Amina Yusuf', enrolledStudents: 25, subjectsTaught: 6, overallPacing: 96.0, avgBookMarking: 92.0, laggingSubjects: [], status: 'On Schedule' }
    ];

    return list.filter(c => {
      if (filterBranch !== 'All' && c.branch !== filterBranch) return false;
      if (filterSection !== 'All' && c.section !== filterSection) return false;
      if (filterClass !== 'All' && c.className !== filterClass) return false;
      return true;
    });
  }, [filterBranch, filterSection, filterClass]);

  // 10. TEACHER PERFORMANCE DATA
  const teacherPerformanceData = useMemo(() => {
    const list = [
      { teacherId: 'staff-1', teacherName: 'Aisha Garba', branch: 'GN', section: 'Primary', subjects: 'Primary Mathematics', submissionScore: 96.4, progressScore: 90.9, coverageScore: 93.3, evidenceScore: 95.0, reviewScore: 92.0, overallScore: 93.1, band: 'Excellent', color: 'emerald' },
      { teacherId: 'staff-4', teacherName: 'Ibrahim Aliyu', branch: 'GN', section: 'Junior Secondary', subjects: 'Social Studies & Civic Education', submissionScore: 96.7, progressScore: 100, coverageScore: 96.4, evidenceScore: 90.0, reviewScore: 94.0, overallScore: 96.2, band: 'Excellent', color: 'emerald' },
      { teacherId: 'staff-7', teacherName: 'Amina Yusuf', branch: 'RS', section: 'Primary', subjects: 'Primary Mathematics', submissionScore: 96.0, progressScore: 100, coverageScore: 92.0, evidenceScore: 85.0, reviewScore: 90.0, overallScore: 93.5, band: 'Excellent', color: 'emerald' },
      { teacherId: 'staff-6', teacherName: 'Zainab Umar', branch: 'RS', section: 'Nursery', subjects: 'Rhymes & Phonics', submissionScore: 90.0, progressScore: 100, coverageScore: 100, evidenceScore: 90.0, reviewScore: 88.0, overallScore: 93.8, band: 'Excellent', color: 'emerald' },
      { teacherId: 'staff-3', teacherName: 'Fatima Sanusi', branch: 'RS', section: 'Primary', subjects: 'Basic English & Grammar', submissionScore: 87.5, progressScore: 81.8, coverageScore: 87.5, evidenceScore: 80.0, reviewScore: 85.0, overallScore: 84.1, band: 'Very Good', color: 'blue' },
      { teacherId: 'staff-2', teacherName: 'Usman Bello', branch: 'GN', section: 'Primary', subjects: 'Basic Science & Technology', submissionScore: 81.8, progressScore: 77.2, coverageScore: 80.0, evidenceScore: 70.0, reviewScore: 80.0, overallScore: 77.9, band: 'Good', color: 'indigo' }
    ];

    return list.filter(t => {
      if (filterBranch !== 'All' && t.branch !== filterBranch) return false;
      if (filterSection !== 'All' && t.section !== filterSection) return false;
      if (filterTeacher !== 'All' && t.teacherName !== filterTeacher) return false;
      return true;
    });
  }, [filterBranch, filterSection, filterTeacher]);

  // 11. BRANCH TEACHER PERFORMANCE DATA
  const branchPerformanceData = useMemo(() => {
    return [
      {
        branchId: 'GN',
        branchName: 'Gawun Nama Campus (GN)',
        totalTeachers: 9,
        activeClasses: 12,
        avgSubmissionCompliance: 92.1,
        avgTeachingProgress: 89.4,
        avgStudentWorkCoverage: 89.9,
        avgEvidenceCompletion: 85.0,
        avgManagementReview: 88.7,
        compositeScore: 89.3,
        teachersOnSchedule: 7,
        teachersBehindSchedule: 2,
        flaggedStudentsCount: 10
      },
      {
        branchId: 'RS',
        branchName: 'Runjin Sambo Campus (RS)',
        totalTeachers: 7,
        activeClasses: 8,
        avgSubmissionCompliance: 94.6,
        avgTeachingProgress: 94.2,
        avgStudentWorkCoverage: 91.8,
        avgEvidenceCompletion: 88.0,
        avgManagementReview: 91.5,
        compositeScore: 92.4,
        teachersOnSchedule: 6,
        teachersBehindSchedule: 1,
        flaggedStudentsCount: 6
      }
    ].filter(b => filterBranch === 'All' || b.branchId === filterBranch);
  }, [filterBranch]);

  // 12. TERM HISTORICAL COMPARISON DATA (Term 1 vs Term 2 vs Term 3)
  const currentSessionTerms = useMemo(() => {
    return HISTORICAL_TERMS_DATA[filterSession] || HISTORICAL_TERMS_DATA['2026/2027'] || HISTORICAL_TERMS_DATA['2025/2026'];
  }, [filterSession]);

  // 13. ANNUAL SESSION COMPARISON DATA (Session vs Previous Sessions)
  const sessionComparisonData = useMemo(() => {
    return HISTORICAL_SESSIONS_DATA;
  }, []);

  // Active Report Definition
  const currentReportDef = useMemo(() => {
    return REPORT_DEFINITIONS.find(r => r.id === activeReport) || REPORT_DEFINITIONS[0];
  }, [activeReport]);

  // HANDLE CSV EXPORT
  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      let headers: string[] = [];
      let rows: (string | number)[][] = [];
      const reportTitle = currentReportDef.title.replace(/[^a-zA-Z0-9]/g, '_');

      switch (activeReport) {
        case 'teachingRecord':
          headers = ['Record ID', 'Date', 'Branch', 'Class', 'Subject', 'Teacher', 'Week', 'Topic', 'Pages Covered', 'Homework', 'Status'];
          rows = filteredRecords.map(r => [
            r.id, r.date, r.branch, r.classId, r.subject, r.teacherName, r.week, r.topic, r.pagesCovered || 'N/A', r.homework || 'N/A', r.status
          ]);
          break;

        case 'curriculumCoverage':
          headers = ['Branch', 'Class', 'Subject', 'Teacher', 'Planned Topics', 'Taught Topics', 'Covered in Books', 'Coverage %', 'Marking %', 'Pacing Status'];
          rows = curriculumCoverageData.map(c => [
            c.branch, c.className, c.subject, c.teacherName, c.plannedTopics, c.taughtTopics, c.coveredInBooks, c.coveragePct, c.markedBooksPct, c.pacingStatus
          ]);
          break;

        case 'teacherSubmission':
          headers = ['Teacher Name', 'Branch', 'Section', 'Total Logs', 'On-Time Logs', 'Late Logs', 'Missing Logs', 'Drafts', 'Reviewed', 'On-Time Rate %', 'Status'];
          rows = teacherSubmissionData.map(t => [
            t.teacherName, t.branch, t.section, t.totalLogs, t.onTime, t.late, t.missing, t.drafts, t.reviewed, t.onTimeRate, t.status
          ]);
          break;

        case 'lateSubmission':
          headers = ['Teacher Name', 'Branch', 'Class', 'Subject', 'Lesson Date', 'Submitted Date', 'Delay (Hours)', 'Reason', 'Supervisor Action'];
          rows = lateSubmissionsData.map(l => [
            l.teacherName, l.branch, l.className, l.subject, l.lessonDate, l.submittedDate, l.delayHours, l.reason, l.supervisorAction
          ]);
          break;

        case 'missingSubmission':
          headers = ['Teacher Name', 'Branch', 'Class', 'Subject', 'Scheduled Date', 'Period', 'Days Overdue', 'Status'];
          rows = missingSubmissionsData.map(m => [
            m.teacherName, m.branch, m.className, m.subject, m.scheduledDate, m.period, m.daysOverdue, m.status
          ]);
          break;

        case 'teachingProgress':
          headers = ['Class', 'Subject', 'Branch', 'Teacher', 'Planned', 'Taught', 'Ahead', 'On Schedule', 'Behind', 'Pacing Score %', 'Status'];
          rows = teachingProgressData.map(p => [
            p.className, p.subject, p.branch, p.teacherName, p.planned, p.taught, p.ahead, p.onSchedule, p.behind, p.pacingScore, p.status
          ]);
          break;

        case 'studentBookCoverage':
          headers = ['Class', 'Subject', 'Teacher', 'Branch', 'Total Students', 'Books Audited', 'Fully Marked', 'Coverage Rate %', 'Flagged Students', 'Last Audit Date'];
          rows = studentBookCoverageData.map(s => [
            s.className, s.subject, s.teacherName, s.branch, s.totalStudents, s.booksAudited, s.fullyMarked, s.coverageRate, s.flaggedCount, s.lastAuditDate
          ]);
          break;

        case 'subjectCoverage':
          headers = ['Subject', 'Sections', 'Active Teachers', 'Classes Assigned', 'Planned Topics', 'Taught Topics', 'Avg Coverage %', 'Avg Marking %', 'Status'];
          rows = subjectCoverageData.map(s => [
            s.subject, s.sections, s.activeTeachers, s.classesAssigned, s.plannedTopics, s.taughtTopics, s.avgCoverage, s.avgMarking, s.status
          ]);
          break;

        case 'classProgress':
          headers = ['Class', 'Branch', 'Section', 'Class Teacher', 'Enrolled Students', 'Subjects Taught', 'Overall Pacing %', 'Avg Marking %', 'Lagging Subjects', 'Status'];
          rows = classProgressData.map(c => [
            c.className, c.branch, c.section, c.classTeacher, c.enrolledStudents, c.subjectsTaught, c.overallPacing, c.avgBookMarking, c.laggingSubjects.join('; ') || 'None', c.status
          ]);
          break;

        case 'teacherPerformance':
          headers = ['Teacher Name', 'Branch', 'Section', 'Subject', 'Submission %', 'Progress %', 'Coverage %', 'Evidence %', 'Review %', 'Composite Score', 'Rating Band'];
          rows = teacherPerformanceData.map(t => [
            t.teacherName, t.branch, t.section, t.subjects, t.submissionScore, t.progressScore, t.coverageScore, t.evidenceScore, t.reviewScore, t.overallScore, t.band
          ]);
          break;

        case 'branchTeacherPerformance':
          headers = ['Branch', 'Total Teachers', 'Active Classes', 'Submission %', 'Progress %', 'Coverage %', 'Evidence %', 'Review %', 'Composite Score', 'On Schedule', 'Behind Schedule'];
          rows = branchPerformanceData.map(b => [
            b.branchName, b.totalTeachers, b.activeClasses, b.avgSubmissionCompliance, b.avgTeachingProgress, b.avgStudentWorkCoverage, b.avgEvidenceCompletion, b.avgManagementReview, b.compositeScore, b.teachersOnSchedule, b.teachersBehindSchedule
          ]);
          break;

        case 'termPerformance':
          headers = ['Term', 'Academic Session', 'Total Records', 'On-Time Submission %', 'Syllabus Coverage %', 'Book Coverage %', 'Evidence %', 'Review Avg %', 'Overall Performance Score'];
          rows = currentSessionTerms.map(t => [
            t.term, t.academicSession, t.totalRecords, t.onTimeSubmissionPct, t.syllabusCoveragePct, t.studentBookCoveragePct, t.evidenceCompletionPct, t.managementReviewAvg, t.overallPerformanceScore
          ]);
          break;

        case 'sessionPerformance':
          headers = ['Academic Session', 'Total Records', 'Submission %', 'Progress %', 'Coverage %', 'Evidence %', 'Review %', 'Composite Score', 'Teachers', 'Pass Rate %', 'Completion %'];
          rows = sessionComparisonData.map(s => [
            s.academicSession, s.totalRecordsSubmitted, s.avgSubmissionCompliance, s.avgTeachingProgress, s.avgStudentWorkCoverage, s.avgEvidenceCompletion, s.avgManagementReview, s.compositePerformanceScore, s.activeTeachers, s.studentPassRatePct, s.curriculumCompletionRatePct
          ]);
          break;
      }

      exportToCsv(`SAMS_${reportTitle}_${filterSession.replace('/', '_')}`, headers, rows);
      setIsExporting(false);
    }, 500);
  };

  // HANDLE EXCEL EXPORT
  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      let headers: string[] = [];
      let rows: (string | number)[][] = [];
      const reportTitle = currentReportDef.title;

      switch (activeReport) {
        case 'teachingRecord':
          headers = ['Record ID', 'Date', 'Branch', 'Class', 'Subject', 'Teacher', 'Week', 'Topic', 'Pages Covered', 'Homework', 'Status'];
          rows = filteredRecords.map(r => [
            r.id, r.date, r.branch, r.classId, r.subject, r.teacherName, r.week, r.topic, r.pagesCovered || 'N/A', r.homework || 'N/A', r.status
          ]);
          break;

        case 'curriculumCoverage':
          headers = ['Branch', 'Class', 'Subject', 'Teacher', 'Planned Topics', 'Taught Topics', 'Covered in Books', 'Coverage %', 'Marking %', 'Pacing Status'];
          rows = curriculumCoverageData.map(c => [
            c.branch, c.className, c.subject, c.teacherName, c.plannedTopics, c.taughtTopics, c.coveredInBooks, c.coveragePct, c.markedBooksPct, c.pacingStatus
          ]);
          break;

        case 'teacherSubmission':
          headers = ['Teacher Name', 'Branch', 'Section', 'Total Logs', 'On-Time Logs', 'Late Logs', 'Missing Logs', 'Drafts', 'Reviewed', 'On-Time Rate %', 'Status'];
          rows = teacherSubmissionData.map(t => [
            t.teacherName, t.branch, t.section, t.totalLogs, t.onTime, t.late, t.missing, t.drafts, t.reviewed, t.onTimeRate, t.status
          ]);
          break;

        case 'lateSubmission':
          headers = ['Teacher Name', 'Branch', 'Class', 'Subject', 'Lesson Date', 'Submitted Date', 'Delay (Hours)', 'Reason', 'Supervisor Action'];
          rows = lateSubmissionsData.map(l => [
            l.teacherName, l.branch, l.className, l.subject, l.lessonDate, l.submittedDate, l.delayHours, l.reason, l.supervisorAction
          ]);
          break;

        case 'missingSubmission':
          headers = ['Teacher Name', 'Branch', 'Class', 'Subject', 'Scheduled Date', 'Period', 'Days Overdue', 'Status'];
          rows = missingSubmissionsData.map(m => [
            m.teacherName, m.branch, m.className, m.subject, m.scheduledDate, m.period, m.daysOverdue, m.status
          ]);
          break;

        case 'teachingProgress':
          headers = ['Class', 'Subject', 'Branch', 'Teacher', 'Planned', 'Taught', 'Ahead', 'On Schedule', 'Behind', 'Pacing Score %', 'Status'];
          rows = teachingProgressData.map(p => [
            p.className, p.subject, p.branch, p.teacherName, p.planned, p.taught, p.ahead, p.onSchedule, p.behind, p.pacingScore, p.status
          ]);
          break;

        case 'studentBookCoverage':
          headers = ['Class', 'Subject', 'Teacher', 'Branch', 'Total Students', 'Books Audited', 'Fully Marked', 'Coverage Rate %', 'Flagged Students', 'Last Audit Date'];
          rows = studentBookCoverageData.map(s => [
            s.className, s.subject, s.teacherName, s.branch, s.totalStudents, s.booksAudited, s.fullyMarked, s.coverageRate, s.flaggedCount, s.lastAuditDate
          ]);
          break;

        case 'subjectCoverage':
          headers = ['Subject', 'Sections', 'Active Teachers', 'Classes Assigned', 'Planned Topics', 'Taught Topics', 'Avg Coverage %', 'Avg Marking %', 'Status'];
          rows = subjectCoverageData.map(s => [
            s.subject, s.sections, s.activeTeachers, s.classesAssigned, s.plannedTopics, s.taughtTopics, s.avgCoverage, s.avgMarking, s.status
          ]);
          break;

        case 'classProgress':
          headers = ['Class', 'Branch', 'Section', 'Class Teacher', 'Enrolled Students', 'Subjects Taught', 'Overall Pacing %', 'Avg Marking %', 'Lagging Subjects', 'Status'];
          rows = classProgressData.map(c => [
            c.className, c.branch, c.section, c.classTeacher, c.enrolledStudents, c.subjectsTaught, c.overallPacing, c.avgBookMarking, c.laggingSubjects.join('; ') || 'None', c.status
          ]);
          break;

        case 'teacherPerformance':
          headers = ['Teacher Name', 'Branch', 'Section', 'Subject', 'Submission %', 'Progress %', 'Coverage %', 'Evidence %', 'Review %', 'Composite Score', 'Rating Band'];
          rows = teacherPerformanceData.map(t => [
            t.teacherName, t.branch, t.section, t.subjects, t.submissionScore, t.progressScore, t.coverageScore, t.evidenceScore, t.reviewScore, t.overallScore, t.band
          ]);
          break;

        case 'branchTeacherPerformance':
          headers = ['Branch', 'Total Teachers', 'Active Classes', 'Submission %', 'Progress %', 'Coverage %', 'Evidence %', 'Review %', 'Composite Score', 'On Schedule', 'Behind Schedule'];
          rows = branchPerformanceData.map(b => [
            b.branchName, b.totalTeachers, b.activeClasses, b.avgSubmissionCompliance, b.avgTeachingProgress, b.avgStudentWorkCoverage, b.avgEvidenceCompletion, b.avgManagementReview, b.compositeScore, b.teachersOnSchedule, b.teachersBehindSchedule
          ]);
          break;

        case 'termPerformance':
          headers = ['Term', 'Academic Session', 'Total Records', 'On-Time Submission %', 'Syllabus Coverage %', 'Book Coverage %', 'Evidence %', 'Review Avg %', 'Overall Performance Score'];
          rows = currentSessionTerms.map(t => [
            t.term, t.academicSession, t.totalRecords, t.onTimeSubmissionPct, t.syllabusCoveragePct, t.studentBookCoveragePct, t.evidenceCompletionPct, t.managementReviewAvg, t.overallPerformanceScore
          ]);
          break;

        case 'sessionPerformance':
          headers = ['Academic Session', 'Total Records', 'Submission %', 'Progress %', 'Coverage %', 'Evidence %', 'Review %', 'Composite Score', 'Teachers', 'Pass Rate %', 'Completion %'];
          rows = sessionComparisonData.map(s => [
            s.academicSession, s.totalRecordsSubmitted, s.avgSubmissionCompliance, s.avgTeachingProgress, s.avgStudentWorkCoverage, s.avgEvidenceCompletion, s.avgManagementReview, s.compositePerformanceScore, s.activeTeachers, s.studentPassRatePct, s.curriculumCompletionRatePct
          ]);
          break;
      }

      exportToExcelXml(
        `SAMS_${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${filterSession.replace('/', '_')}`,
        reportTitle,
        headers,
        rows
      );
      setIsExporting(false);
    }, 600);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterBranch(selectedBranch || 'All');
    setFilterSection('All');
    setFilterClass('All');
    setFilterSubject('All');
    setFilterTeacher('All');
    setFilterTerm('All');
    setFilterSession('2026/2027');
    setSearchQuery('');
  };

  return (
    <div id="erp-teaching-performance-reports" className="space-y-6">
      {/* 1. TOP HEADER & EXPORT SUITE */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Teaching &amp; Performance Reports</h1>
              <span className="bg-indigo-50 text-indigo-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-100">
                13 Official Reports
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Multi-dimensional academic audits, curriculum pacing trajectories, teacher compliance, and historical longitudinal analytics.
            </p>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Print / PDF View</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Excel (.xls)</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. REPORT CATALOG TABS */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Select Report Type
          </span>
          <span className="text-[11px] font-bold text-indigo-600">
            Active: {currentReportDef.title}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {REPORT_DEFINITIONS.map(rep => {
            const isSelected = activeReport === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setActiveReport(rep.id)}
                className={`p-2.5 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {rep.badgeText}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="font-bold text-[11px] leading-snug line-clamp-2">
                  {rep.title.replace(' Report', '')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MULTI-LEVEL FILTER CONTROL BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Report Parameters &amp; Filter Criteria
            </span>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset All Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-1">
          {/* Branch */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:border-indigo-500 outline-none text-slate-700"
            >
              <option value="All">All Branches</option>
              <option value="GN">Gawun Nama (GN)</option>
              <option value="RS">Runjin Sambo (RS)</option>
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:border-indigo-500 outline-none text-slate-700"
            >
              <option value="All">All Sections</option>
              <option value="Nursery">Nursery / Early Years</option>
              <option value="Primary">Primary</option>
              <option value="Junior Secondary">Junior Secondary</option>
              <option value="Senior Secondary">Senior Secondary</option>
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:border-indigo-500 outline-none text-slate-700"
            >
              <option value="All">All Classes</option>
              <option value="Primary 5 - Gold">Primary 5 - Gold</option>
              <option value="Primary 4 - Diamond">Primary 4 - Diamond</option>
              <option value="Primary 3 - Emerald">Primary 3 - Emerald</option>
              <option value="Junior Sec 1 - Alpha">Junior Sec 1 - Alpha</option>
              <option value="Nursery 2 - Rose">Nursery 2 - Rose</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:border-indigo-500 outline-none text-slate-700"
            >
              <option value="All">All Subjects</option>
              <option value="Primary Mathematics">Primary Mathematics</option>
              <option value="Basic English & Grammar">Basic English &amp; Grammar</option>
              <option value="Basic Science & Technology">Basic Science &amp; Tech</option>
              <option value="Social Studies & Civic Education">Social Studies &amp; Civic</option>
              <option value="Rhymes & Phonics">Rhymes &amp; Phonics</option>
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Teacher</label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:border-indigo-500 outline-none text-slate-700"
            >
              <option value="All">All Teachers</option>
              <option value="Aisha Garba">Aisha Garba</option>
              <option value="Usman Bello">Usman Bello</option>
              <option value="Fatima Sanusi">Fatima Sanusi</option>
              <option value="Ibrahim Aliyu">Ibrahim Aliyu</option>
              <option value="Zainab Umar">Zainab Umar</option>
              <option value="Amina Yusuf">Amina Yusuf</option>
            </select>
          </div>

          {/* Term */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Term</label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:border-indigo-500 outline-none text-slate-700"
            >
              <option value="All">All Terms</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>

          {/* Academic Session */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Session</label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full text-xs font-bold bg-indigo-50/60 border border-indigo-200 rounded-xl p-2 focus:bg-white focus:border-indigo-500 outline-none text-indigo-950 font-mono"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
            </select>
          </div>
        </div>

        {/* In-table Search Filter */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search within report rows (e.g. teacher name, subject, topic, class)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* 4. ACTIVE REPORT DISPLAY CONTENT */}

      {/* 4A. REPORT 1: TEACHING RECORD REPORT */}
      {activeReport === 'teachingRecord' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Teaching Record Report</h2>
              <p className="text-xs text-slate-500">Comprehensive log of itemized lesson delivery entries</p>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
              {filteredRecords.length} Records Found
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Date / Time</th>
                  <th className="p-3">Class &amp; Branch</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Teacher</th>
                  <th className="p-3">Week / Topic</th>
                  <th className="p-3">Pages / Homework</th>
                  <th className="p-3">Evidence</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{r.date}</div>
                      <div className="text-[10px] text-slate-400">{r.time}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{r.classId}</div>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600">
                        {r.branch} Campus
                      </span>
                    </td>
                    <td className="p-3 font-bold text-indigo-700">{r.subject}</td>
                    <td className="p-3 font-medium text-slate-800">{r.teacherName}</td>
                    <td className="p-3 max-w-xs">
                      <div className="font-bold text-slate-900">Week {r.week}: {r.topic}</div>
                      {r.subTopic && <div className="text-[11px] text-slate-500">{r.subTopic}</div>}
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="text-[11px] text-slate-700">{r.pagesCovered || '—'}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{r.homework || 'No HW'}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-700">
                        📸 {(r.supportingEvidence || []).length} items
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        r.status === 'Reviewed' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'Submitted' ? 'bg-indigo-100 text-indigo-800' :
                        r.status === 'Correction Required' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4B. REPORT 2: CURRICULUM COVERAGE REPORT */}
      {activeReport === 'curriculumCoverage' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Curriculum Coverage Report</h2>
              <p className="text-xs text-slate-500">Scheme of Work alignment comparing planned vs taught vs student work</p>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
              {curriculumCoverageData.length} Subjects Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Class &amp; Branch</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Teacher</th>
                  <th className="p-3 text-center">Planned Topics</th>
                  <th className="p-3 text-center">Taught Topics</th>
                  <th className="p-3 text-center">Covered in Books</th>
                  <th className="p-3 text-center">Coverage Rate</th>
                  <th className="p-3 text-center">Marking Diligence</th>
                  <th className="p-3 text-right">Pacing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {curriculumCoverageData.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{c.className}</div>
                      <span className="text-[10px] font-mono text-slate-500">{c.branch} Campus ({c.section})</span>
                    </td>
                    <td className="p-3 font-bold text-indigo-700">{c.subject}</td>
                    <td className="p-3 font-medium text-slate-800">{c.teacherName}</td>
                    <td className="p-3 text-center font-bold">{c.plannedTopics}</td>
                    <td className="p-3 text-center font-bold text-indigo-600">{c.taughtTopics}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{c.coveredInBooks}</td>
                    <td className="p-3 text-center">
                      <span className="font-extrabold text-slate-900">{c.coveragePct}%</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-extrabold text-slate-900">{c.markedBooksPct}%</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        c.pacingStatus === 'On Schedule' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {c.pacingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4C. REPORT 3: TEACHER SUBMISSION REPORT */}
      {activeReport === 'teacherSubmission' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Teacher Submission Compliance Report</h2>
              <p className="text-xs text-slate-500">Log timeliness, draft counts, and supervisor review completion rates</p>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
              {teacherSubmissionData.length} Teachers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Teacher</th>
                  <th className="p-3">Branch / Section</th>
                  <th className="p-3 text-center">Total Logs</th>
                  <th className="p-3 text-center">On-Time</th>
                  <th className="p-3 text-center">Late Logs</th>
                  <th className="p-3 text-center">Missing</th>
                  <th className="p-3 text-center">Drafts</th>
                  <th className="p-3 text-center">Reviewed</th>
                  <th className="p-3 text-center">Punctuality %</th>
                  <th className="p-3 text-right">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {teacherSubmissionData.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{t.teacherName}</td>
                    <td className="p-3 text-slate-500">{t.branch} ({t.section})</td>
                    <td className="p-3 text-center font-bold">{t.totalLogs}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{t.onTime}</td>
                    <td className="p-3 text-center font-bold text-amber-600">{t.late}</td>
                    <td className="p-3 text-center font-bold text-rose-600">{t.missing}</td>
                    <td className="p-3 text-center font-bold text-slate-500">{t.drafts}</td>
                    <td className="p-3 text-center font-bold text-indigo-600">{t.reviewed}</td>
                    <td className="p-3 text-center font-extrabold text-slate-900">{t.onTimeRate}%</td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        t.status === 'Compliant' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4D. REPORT 4: LATE SUBMISSION REPORT */}
      {activeReport === 'lateSubmission' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Late Submission Audit Report</h2>
              <p className="text-xs text-slate-500">Itemized audit of teaching logs submitted beyond cutoff windows</p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
              {lateSubmissionsData.length} Late Instances
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Teacher</th>
                  <th className="p-3">Class &amp; Branch</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Lesson Date</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3 text-center">Delay</th>
                  <th className="p-3">Recorded Reason</th>
                  <th className="p-3 text-right">Supervisor Follow-Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {lateSubmissionsData.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{l.teacherName}</td>
                    <td className="p-3 text-slate-700">{l.className} ({l.branch})</td>
                    <td className="p-3 font-bold text-indigo-700">{l.subject}</td>
                    <td className="p-3 text-slate-800">{l.lessonDate}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{l.submittedDate}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        +{l.delayHours} hrs
                      </span>
                    </td>
                    <td className="p-3 max-w-xs text-[11px] text-slate-600">{l.reason}</td>
                    <td className="p-3 text-right text-[11px] font-medium text-indigo-900">{l.supervisorAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4E. REPORT 5: MISSING SUBMISSION REPORT */}
      {activeReport === 'missingSubmission' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Missing Submission Gap Analysis Report</h2>
              <p className="text-xs text-slate-500">Unrecorded timetable periods and pending teaching logs</p>
            </div>
            <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg">
              {missingSubmissionsData.length} Missing Logs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Teacher</th>
                  <th className="p-3">Class &amp; Branch</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Scheduled Date</th>
                  <th className="p-3">Timetable Period</th>
                  <th className="p-3 text-center">Days Overdue</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {missingSubmissionsData.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{m.teacherName}</td>
                    <td className="p-3 text-slate-700">{m.className} ({m.branch})</td>
                    <td className="p-3 font-bold text-indigo-700">{m.subject}</td>
                    <td className="p-3 text-slate-800 font-bold">{m.scheduledDate}</td>
                    <td className="p-3 text-slate-600">{m.period}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        {m.daysOverdue} days
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4F. REPORT 6: TEACHING PROGRESS REPORT */}
      {activeReport === 'teachingProgress' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Teaching Progress &amp; Pacing Report</h2>
              <p className="text-xs text-slate-500">Green: On Schedule | Yellow: Needs Attention | Red: Behind Schedule</p>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
              {teachingProgressData.length} Subjects Assessed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Class &amp; Branch</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Teacher</th>
                  <th className="p-3 text-center">Planned Topics</th>
                  <th className="p-3 text-center">Taught</th>
                  <th className="p-3 text-center">Ahead</th>
                  <th className="p-3 text-center">On Schedule</th>
                  <th className="p-3 text-center">Behind</th>
                  <th className="p-3 text-center">Pacing %</th>
                  <th className="p-3 text-right">Indicator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {teachingProgressData.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{p.className} ({p.branch})</td>
                    <td className="p-3 font-bold text-indigo-700">{p.subject}</td>
                    <td className="p-3 text-slate-800">{p.teacherName}</td>
                    <td className="p-3 text-center font-bold">{p.planned}</td>
                    <td className="p-3 text-center font-bold text-indigo-600">{p.taught}</td>
                    <td className="p-3 text-center font-bold text-blue-600">{p.ahead}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{p.onSchedule}</td>
                    <td className="p-3 text-center font-bold text-rose-600">{p.behind}</td>
                    <td className="p-3 text-center font-extrabold text-slate-900">{p.pacingScore}%</td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center space-x-1 ${
                        p.status === 'On Schedule' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'On Schedule' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        <span>{p.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4G. REPORT 7: STUDENT BOOK COVERAGE REPORT */}
      {activeReport === 'studentBookCoverage' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Student Book Coverage &amp; Exercise Marking Report</h2>
              <p className="text-xs text-slate-500">Student exercise book audit scores, marking completeness, and remedial flags</p>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
              {studentBookCoverageData.length} Audits
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Class &amp; Branch</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Teacher</th>
                  <th className="p-3 text-center">Cohort Size</th>
                  <th className="p-3 text-center">Books Audited</th>
                  <th className="p-3 text-center">Fully Marked</th>
                  <th className="p-3 text-center">Coverage Rate %</th>
                  <th className="p-3 text-center">Flagged Students</th>
                  <th className="p-3 text-right">Last Audit Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {studentBookCoverageData.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{s.className} ({s.branch})</td>
                    <td className="p-3 font-bold text-indigo-700">{s.subject}</td>
                    <td className="p-3 text-slate-800">{s.teacherName}</td>
                    <td className="p-3 text-center font-bold">{s.totalStudents}</td>
                    <td className="p-3 text-center font-bold">{s.booksAudited}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{s.fullyMarked}</td>
                    <td className="p-3 text-center font-extrabold text-slate-900">{s.coverageRate}%</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        s.flaggedCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.flaggedCount} students
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-500 font-mono text-[11px]">{s.lastAuditDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4H. REPORT 8: SUBJECT COVERAGE REPORT */}
      {activeReport === 'subjectCoverage' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Subject Coverage &amp; Departmental Progress Report</h2>
              <p className="text-xs text-slate-500">Cross-campus departmental syllabus coverage index</p>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
              {subjectCoverageData.length} Departments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Subject Name</th>
                  <th className="p-3">Sections Covered</th>
                  <th className="p-3 text-center">Active Teachers</th>
                  <th className="p-3 text-center">Classes Assigned</th>
                  <th className="p-3 text-center">Planned Topics</th>
                  <th className="p-3 text-center">Taught Topics</th>
                  <th className="p-3 text-center">Avg Coverage %</th>
                  <th className="p-3 text-center">Avg Marking %</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {subjectCoverageData.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{s.subject}</td>
                    <td className="p-3 text-slate-500">{s.sections}</td>
                    <td className="p-3 text-center font-bold">{s.activeTeachers}</td>
                    <td className="p-3 text-center font-bold">{s.classesAssigned}</td>
                    <td className="p-3 text-center font-bold">{s.plannedTopics}</td>
                    <td className="p-3 text-center font-bold text-indigo-600">{s.taughtTopics}</td>
                    <td className="p-3 text-center font-extrabold text-slate-900">{s.avgCoverage}%</td>
                    <td className="p-3 text-center font-extrabold text-slate-900">{s.avgMarking}%</td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        s.status === 'On Schedule' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4I. REPORT 9: CLASS PROGRESS REPORT */}
      {activeReport === 'classProgress' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Class Progress &amp; Cohort Pacing Report</h2>
              <p className="text-xs text-slate-500">Holistic classroom pacing across all enrolled subjects</p>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
              {classProgressData.length} Classes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Class Name</th>
                  <th className="p-3">Branch &amp; Section</th>
                  <th className="p-3">Class Teacher</th>
                  <th className="p-3 text-center">Enrollment</th>
                  <th className="p-3 text-center">Subjects</th>
                  <th className="p-3 text-center">Overall Pacing %</th>
                  <th className="p-3 text-center">Avg Marking %</th>
                  <th className="p-3">Lagging Subjects</th>
                  <th className="p-3 text-right">Cohort Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {classProgressData.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{c.className}</td>
                    <td className="p-3 text-slate-500">{c.branch} ({c.section})</td>
                    <td className="p-3 font-medium text-slate-800">{c.classTeacher}</td>
                    <td className="p-3 text-center font-bold">{c.enrolledStudents}</td>
                    <td className="p-3 text-center font-bold">{c.subjectsTaught}</td>
                    <td className="p-3 text-center font-extrabold text-slate-900">{c.overallPacing}%</td>
                    <td className="p-3 text-center font-extrabold text-slate-900">{c.avgBookMarking}%</td>
                    <td className="p-3">
                      {c.laggingSubjects.length > 0 ? (
                        <span className="text-rose-700 font-bold text-[11px]">
                          ⚠️ {c.laggingSubjects.join(', ')}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px]">✓ All on track</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        c.status === 'On Schedule' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4J. REPORT 10: TEACHER PERFORMANCE REPORT */}
      {activeReport === 'teacherPerformance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Teacher Performance Evaluation Scorecard</h2>
              <p className="text-xs text-slate-500">5 Weighted Dimensions: Compliance (20%), Progress (35%), Work Coverage (20%), Evidence (10%), Review (15%)</p>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
              {teacherPerformanceData.length} Teachers Rated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Teacher</th>
                  <th className="p-3">Branch / Section</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Submission (20%)</th>
                  <th className="p-3 text-center">Progress (35%)</th>
                  <th className="p-3 text-center">Work Coverage (20%)</th>
                  <th className="p-3 text-center">Evidence (10%)</th>
                  <th className="p-3 text-center">Mgmt Review (15%)</th>
                  <th className="p-3 text-center">Composite Score</th>
                  <th className="p-3 text-right">Performance Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {teacherPerformanceData.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{t.teacherName}</td>
                    <td className="p-3 text-slate-500">{t.branch} ({t.section})</td>
                    <td className="p-3 font-medium text-indigo-700">{t.subjects}</td>
                    <td className="p-3 text-center font-bold">{t.submissionScore}%</td>
                    <td className="p-3 text-center font-bold">{t.progressScore}%</td>
                    <td className="p-3 text-center font-bold">{t.coverageScore}%</td>
                    <td className="p-3 text-center font-bold">{t.evidenceScore}%</td>
                    <td className="p-3 text-center font-bold">{t.reviewScore}%</td>
                    <td className="p-3 text-center font-black text-indigo-950 text-sm">{t.overallScore}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        t.band === 'Excellent' ? 'bg-emerald-100 text-emerald-800' :
                        t.band === 'Very Good' ? 'bg-blue-100 text-blue-800' :
                        t.band === 'Good' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {t.band}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4K. REPORT 11: BRANCH TEACHER PERFORMANCE REPORT */}
      {activeReport === 'branchTeacherPerformance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">Branch Teacher Performance Comparison</h2>
                <p className="text-xs text-slate-500">Cross-campus comparative scorecard across Gawun Nama and Runjin Sambo</p>
              </div>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
                2 Campuses
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Campus</th>
                    <th className="p-3 text-center">Faculty</th>
                    <th className="p-3 text-center">Classes</th>
                    <th className="p-3 text-center">Submission %</th>
                    <th className="p-3 text-center">Progress %</th>
                    <th className="p-3 text-center">Coverage %</th>
                    <th className="p-3 text-center">Evidence %</th>
                    <th className="p-3 text-center">Review %</th>
                    <th className="p-3 text-center">Composite Score</th>
                    <th className="p-3 text-center">On Schedule</th>
                    <th className="p-3 text-right">Behind Schedule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {branchPerformanceData.map(b => (
                    <tr key={b.branchId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-black text-slate-900">{b.branchName}</td>
                      <td className="p-3 text-center font-bold">{b.totalTeachers}</td>
                      <td className="p-3 text-center font-bold">{b.activeClasses}</td>
                      <td className="p-3 text-center font-bold">{b.avgSubmissionCompliance}%</td>
                      <td className="p-3 text-center font-bold">{b.avgTeachingProgress}%</td>
                      <td className="p-3 text-center font-bold">{b.avgStudentWorkCoverage}%</td>
                      <td className="p-3 text-center font-bold">{b.avgEvidenceCompletion}%</td>
                      <td className="p-3 text-center font-bold">{b.avgManagementReview}%</td>
                      <td className="p-3 text-center font-black text-indigo-900 text-sm">{b.compositeScore}</td>
                      <td className="p-3 text-center font-bold text-emerald-600">{b.teachersOnSchedule}</td>
                      <td className="p-3 text-right font-bold text-rose-600">{b.teachersBehindSchedule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4L. REPORT 12: TERM PERFORMANCE REPORT (Term 1 vs Term 2 vs Term 3) */}
      {activeReport === 'termPerformance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Term Performance Matrix: Term 1 vs Term 2 vs Term 3</h2>
                <p className="text-xs text-slate-500">Historical longitudinal tracking for Academic Session: {filterSession}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500">Session:</span>
                <select
                  value={filterSession}
                  onChange={(e) => setFilterSession(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-300 rounded-lg p-1.5 font-mono"
                >
                  <option value="2025/2026">2025/2026</option>
                  <option value="2024/2025">2024/2025</option>
                  <option value="2023/2024">2023/2024</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Academic Term</th>
                    <th className="p-3 text-center">Total Logs</th>
                    <th className="p-3 text-center">On-Time Submissions</th>
                    <th className="p-3 text-center">Syllabus Coverage</th>
                    <th className="p-3 text-center">Student Book Work</th>
                    <th className="p-3 text-center">Evidence Stamped</th>
                    <th className="p-3 text-center">Supervisor Review</th>
                    <th className="p-3 text-center">Composite Score</th>
                    <th className="p-3 text-center">Teachers on Schedule</th>
                    <th className="p-3 text-right">Term Growth Trajectory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {currentSessionTerms.map((t, idx) => {
                    const prevTerm = idx > 0 ? currentSessionTerms[idx - 1] : null;
                    const diff = prevTerm ? (t.overallPerformanceScore - prevTerm.overallPerformanceScore).toFixed(1) : null;
                    return (
                      <tr key={t.term} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="font-black text-slate-900 text-sm">{t.term}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.academicSession}</div>
                        </td>
                        <td className="p-3 text-center font-bold">{t.totalRecords}</td>
                        <td className="p-3 text-center font-bold text-slate-800">{t.onTimeSubmissionPct}%</td>
                        <td className="p-3 text-center font-bold text-indigo-700">{t.syllabusCoveragePct}%</td>
                        <td className="p-3 text-center font-bold text-slate-800">{t.studentBookCoveragePct}%</td>
                        <td className="p-3 text-center font-bold text-slate-800">{t.evidenceCompletionPct}%</td>
                        <td className="p-3 text-center font-bold text-slate-800">{t.managementReviewAvg}%</td>
                        <td className="p-3 text-center font-black text-indigo-950 text-sm">{t.overallPerformanceScore}</td>
                        <td className="p-3 text-center font-bold text-emerald-700">
                          {t.teachersOnSchedule} / {t.teachersEvaluated}
                        </td>
                        <td className="p-3 text-right">
                          {diff !== null ? (
                            <span className={`inline-flex items-center text-xs font-black px-2 py-0.5 rounded-full ${
                              Number(diff) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {Number(diff) >= 0 ? `▲ +${diff} pts` : `▼ ${diff} pts`}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400">Baseline</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphical Term Progression Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentSessionTerms.map((t, idx) => (
              <div key={t.term} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Term Phase {idx + 1}
                    </span>
                    <h3 className="text-base font-black text-slate-900">{t.term}</h3>
                  </div>
                  <span className="text-lg font-black text-indigo-600">{t.overallPerformanceScore}</span>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Syllabus Coverage</span>
                      <span>{t.syllabusCoveragePct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${t.syllabusCoveragePct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Student Book Marking</span>
                      <span>{t.studentBookCoveragePct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${t.studentBookCoveragePct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Punctual Submissions</span>
                      <span>{t.onTimeSubmissionPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${t.onTimeSubmissionPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4M. REPORT 13: SESSION PERFORMANCE REPORT (Session vs Previous Session) */}
      {activeReport === 'sessionPerformance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">Session Performance Report: Session vs Previous Session</h2>
                <p className="text-xs text-slate-500">Multi-year annual institutional comparison across 2025/2026, 2024/2025, and 2023/2024</p>
              </div>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
                3 Academic Sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Academic Session</th>
                    <th className="p-3 text-center">Total Logs</th>
                    <th className="p-3 text-center">Submission %</th>
                    <th className="p-3 text-center">Teaching Progress %</th>
                    <th className="p-3 text-center">Book Coverage %</th>
                    <th className="p-3 text-center">Evidence %</th>
                    <th className="p-3 text-center">Mgmt Review %</th>
                    <th className="p-3 text-center">Composite Score</th>
                    <th className="p-3 text-center">Teachers</th>
                    <th className="p-3 text-center">Curriculum %</th>
                    <th className="p-3 text-right">YoY Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sessionComparisonData.map((s, idx) => {
                    const prevSession = idx < sessionComparisonData.length - 1 ? sessionComparisonData[idx + 1] : null;
                    const diff = prevSession ? (s.compositePerformanceScore - prevSession.compositePerformanceScore).toFixed(1) : null;
                    return (
                      <tr key={s.academicSession} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="font-black text-slate-900 text-sm">{s.academicSession}</div>
                          <div className="text-[10px] text-slate-400">Institutional Audit</div>
                        </td>
                        <td className="p-3 text-center font-bold">{s.totalRecordsSubmitted}</td>
                        <td className="p-3 text-center font-bold text-slate-800">{s.avgSubmissionCompliance}%</td>
                        <td className="p-3 text-center font-bold text-indigo-700">{s.avgTeachingProgress}%</td>
                        <td className="p-3 text-center font-bold text-slate-800">{s.avgStudentWorkCoverage}%</td>
                        <td className="p-3 text-center font-bold text-slate-800">{s.avgEvidenceCompletion}%</td>
                        <td className="p-3 text-center font-bold text-slate-800">{s.avgManagementReview}%</td>
                        <td className="p-3 text-center font-black text-indigo-950 text-sm">{s.compositePerformanceScore}</td>
                        <td className="p-3 text-center font-bold">{s.activeTeachers}</td>
                        <td className="p-3 text-center font-bold text-emerald-700">{s.curriculumCompletionRatePct}%</td>
                        <td className="p-3 text-right">
                          {diff !== null ? (
                            <span className="inline-flex items-center text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              ▲ +{diff} pts YoY
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400">Historical Base</span>
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

      {/* 5. PRINT / PDF PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Official Printable Statutory Report Preview</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 print:p-0">
              {/* Formal Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">School Academic Management System</h1>
                  <p className="text-xs text-slate-600 font-bold">Gawun Nama &amp; Runjin Sambo Campuses, Sokoto</p>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Official Directorate of Academic Planning &amp; Quality Assurance
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-indigo-900">STATUTORY AUDIT REPORT</div>
                  <div className="text-slate-500 font-mono text-[10px]">Doc Ref: SAMS-QA-{new Date().getFullYear()}-{activeReport.toUpperCase()}</div>
                  <div className="text-slate-500 text-[10px]">Generated: {new Date().toLocaleString()}</div>
                </div>
              </div>

              {/* Report Title & Metadata */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black text-slate-900">{currentReportDef.title}</h2>
                  <p className="text-xs text-slate-500">{currentReportDef.description}</p>
                </div>
                <div className="text-right text-xs space-y-0.5">
                  <div><span className="font-bold text-slate-500">Session:</span> <span className="font-black">{filterSession}</span></div>
                  <div><span className="font-bold text-slate-500">Term:</span> <span className="font-black">{filterTerm}</span></div>
                  <div><span className="font-bold text-slate-500">Branch:</span> <span className="font-black">{filterBranch}</span></div>
                </div>
              </div>

              {/* Preview Body based on active report */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-3 bg-slate-100 font-bold text-xs border-b border-slate-200">
                  Data Extract Snapshot ({filteredRecords.length} records in active scope)
                </div>
                <div className="p-4 text-xs space-y-2 text-slate-700">
                  <p className="font-medium">
                    This document summarizes verified instructional submissions, scheme of work coverage, and supervisor audit trail entries.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Logs Audited</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{filteredRecords.length}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Compliance Index</div>
                      <div className="text-lg font-black text-emerald-700 mt-1">94.2%</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Pacing Status</div>
                      <div className="text-lg font-black text-indigo-700 mt-1">On Schedule</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supervisor Signature Endorsement Block */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="h-12 border-b border-slate-400 w-48" />
                  <div className="font-bold text-slate-800 mt-1">Head of Academic Supervision</div>
                  <div className="text-[10px] text-slate-500">Signature &amp; Date Stamp</div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="h-12 border-b border-slate-400 w-48" />
                  <div className="font-bold text-slate-800 mt-1">Principal / School Proprietor</div>
                  <div className="text-[10px] text-slate-500">Official Seal &amp; Endorsement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
