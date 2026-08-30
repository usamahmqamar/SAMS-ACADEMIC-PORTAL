export type ReportType = 
  | 'teachingRecord'
  | 'curriculumCoverage'
  | 'teacherSubmission'
  | 'lateSubmission'
  | 'missingSubmission'
  | 'teachingProgress'
  | 'studentBookCoverage'
  | 'subjectCoverage'
  | 'classProgress'
  | 'teacherPerformance'
  | 'branchTeacherPerformance'
  | 'termPerformance'
  | 'sessionPerformance';

export interface ReportDefinition {
  id: ReportType;
  title: string;
  category: 'Operational Logs' | 'Compliance & Submissions' | 'Pacing & Coverage' | 'Performance & Comparative';
  description: string;
  iconName: string;
  badgeText: string;
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'teachingRecord',
    title: 'Teaching Record Report',
    category: 'Operational Logs',
    description: 'Itemized log of all verified daily teaching entries, topics taught, board work, student notes, and homework assigned.',
    iconName: 'FileText',
    badgeText: 'Operational'
  },
  {
    id: 'curriculumCoverage',
    title: 'Curriculum Coverage Report',
    category: 'Pacing & Coverage',
    description: 'Detailed comparison of planned scheme of work milestones vs actual taught topics vs verified student notebook work.',
    iconName: 'BookOpen',
    badgeText: 'Curriculum'
  },
  {
    id: 'teacherSubmission',
    title: 'Teacher Submission Report',
    category: 'Compliance & Submissions',
    description: 'Teacher-by-teacher log volume, on-time delivery percentages, draft volumes, and supervisory approval rates.',
    iconName: 'CheckCircle2',
    badgeText: 'Compliance'
  },
  {
    id: 'lateSubmission',
    title: 'Late Submission Report',
    category: 'Compliance & Submissions',
    description: 'Audit log of records submitted after the standard cutoff window with recorded lag times and reasons.',
    iconName: 'Clock',
    badgeText: 'Audit'
  },
  {
    id: 'missingSubmission',
    title: 'Missing Submission Report',
    category: 'Compliance & Submissions',
    description: 'Timetable gap analysis identifying classes, subjects, and periods without logged teaching records.',
    iconName: 'AlertTriangle',
    badgeText: 'Audit'
  },
  {
    id: 'teachingProgress',
    title: 'Teaching Progress Report',
    category: 'Pacing & Coverage',
    description: 'Macro pacing status analysis classifying topics as On Schedule (Green), Needs Attention (Yellow), or Behind Schedule (Red).',
    iconName: 'TrendingUp',
    badgeText: 'Pacing'
  },
  {
    id: 'studentBookCoverage',
    title: 'Student Book Coverage Report',
    category: 'Pacing & Coverage',
    description: 'Student notebook audit summary including work completeness rate %, marking coverage, and flagged students.',
    iconName: 'FileCheck',
    badgeText: 'Quality'
  },
  {
    id: 'subjectCoverage',
    title: 'Subject Coverage Report',
    category: 'Pacing & Coverage',
    description: 'Departmental syllabus completion rates comparing subjects across junior, senior, and primary sections.',
    iconName: 'Layers',
    badgeText: 'Departmental'
  },
  {
    id: 'classProgress',
    title: 'Class Progress Report',
    category: 'Pacing & Coverage',
    description: 'Classroom-level diagnostic showing syllabus delivery across all subjects assigned to each class arm.',
    iconName: 'GraduationCap',
    badgeText: 'Cohort'
  },
  {
    id: 'teacherPerformance',
    title: 'Teacher Performance Report',
    category: 'Performance & Comparative',
    description: 'Multi-dimensional evaluation results with configurable weights across compliance, progress, coverage, evidence, and review.',
    iconName: 'Award',
    badgeText: 'Evaluation'
  },
  {
    id: 'branchTeacherPerformance',
    title: 'Branch Teacher Performance Report',
    category: 'Performance & Comparative',
    description: 'Cross-campus comparative scorecard comparing Gawun Nama and Runjin Sambo teacher performance metrics.',
    iconName: 'Building2',
    badgeText: 'Multi-Branch'
  },
  {
    id: 'termPerformance',
    title: 'Term Performance Report (Term 1 vs Term 2 vs Term 3)',
    category: 'Performance & Comparative',
    description: 'Term-over-term comparative matrix tracking syllabus velocity, marking diligence, and teacher score trajectories.',
    iconName: 'BarChart3',
    badgeText: 'Term Matrix'
  },
  {
    id: 'sessionPerformance',
    title: 'Session Performance Report (Session vs Previous Session)',
    category: 'Performance & Comparative',
    description: 'Annual longitudinal comparison comparing 2025/2026 against 2024/2025 and 2023/2024 historical baselines.',
    iconName: 'History',
    badgeText: 'Annual Audit'
  }
];

// Historical term performance dataset for Term 1, Term 2, Term 3 comparisons
export interface TermHistoricalMetric {
  term: 'First Term' | 'Second Term' | 'Third Term';
  academicSession: string;
  totalRecords: number;
  onTimeSubmissionPct: number;
  syllabusCoveragePct: number;
  studentBookCoveragePct: number;
  evidenceCompletionPct: number;
  managementReviewAvg: number;
  overallPerformanceScore: number;
  teachersEvaluated: number;
  teachersOnSchedule: number;
  teachersBehindSchedule: number;
  flaggedStudentsCount: number;
}

export const HISTORICAL_TERMS_DATA: Record<string, TermHistoricalMetric[]> = {
  '2026/2027': [
    {
      term: 'First Term',
      academicSession: '2026/2027',
      totalRecords: 156,
      onTimeSubmissionPct: 94.5,
      syllabusCoveragePct: 92.0,
      studentBookCoveragePct: 89.2,
      evidenceCompletionPct: 86.0,
      managementReviewAvg: 91.5,
      overallPerformanceScore: 91.2,
      teachersEvaluated: 18,
      teachersOnSchedule: 17,
      teachersBehindSchedule: 1,
      flaggedStudentsCount: 10
    },
    {
      term: 'Second Term',
      academicSession: '2026/2027',
      totalRecords: 142,
      onTimeSubmissionPct: 95.2,
      syllabusCoveragePct: 93.8,
      studentBookCoveragePct: 91.0,
      evidenceCompletionPct: 88.6,
      managementReviewAvg: 92.4,
      overallPerformanceScore: 92.3,
      teachersEvaluated: 18,
      teachersOnSchedule: 17,
      teachersBehindSchedule: 1,
      flaggedStudentsCount: 8
    },
    {
      term: 'Third Term',
      academicSession: '2026/2027',
      totalRecords: 138,
      onTimeSubmissionPct: 96.0,
      syllabusCoveragePct: 95.5,
      studentBookCoveragePct: 93.2,
      evidenceCompletionPct: 91.4,
      managementReviewAvg: 94.0,
      overallPerformanceScore: 94.1,
      teachersEvaluated: 18,
      teachersOnSchedule: 18,
      teachersBehindSchedule: 0,
      flaggedStudentsCount: 5
    }
  ],
  '2025/2026': [
    {
      term: 'First Term',
      academicSession: '2025/2026',
      totalRecords: 148,
      onTimeSubmissionPct: 91.2,
      syllabusCoveragePct: 88.5,
      studentBookCoveragePct: 86.4,
      evidenceCompletionPct: 82.0,
      managementReviewAvg: 88.0,
      overallPerformanceScore: 87.6,
      teachersEvaluated: 16,
      teachersOnSchedule: 14,
      teachersBehindSchedule: 2,
      flaggedStudentsCount: 18
    },
    {
      term: 'Second Term',
      academicSession: '2025/2026',
      totalRecords: 136,
      onTimeSubmissionPct: 93.8,
      syllabusCoveragePct: 92.1,
      studentBookCoveragePct: 89.7,
      evidenceCompletionPct: 87.5,
      managementReviewAvg: 90.2,
      overallPerformanceScore: 90.8,
      teachersEvaluated: 16,
      teachersOnSchedule: 15,
      teachersBehindSchedule: 1,
      flaggedStudentsCount: 12
    },
    {
      term: 'Third Term',
      academicSession: '2025/2026',
      totalRecords: 122,
      onTimeSubmissionPct: 94.6,
      syllabusCoveragePct: 94.8,
      studentBookCoveragePct: 91.5,
      evidenceCompletionPct: 90.0,
      managementReviewAvg: 92.5,
      overallPerformanceScore: 92.9,
      teachersEvaluated: 16,
      teachersOnSchedule: 16,
      teachersBehindSchedule: 0,
      flaggedStudentsCount: 8
    }
  ],
  '2024/2025': [
    {
      term: 'First Term',
      academicSession: '2024/2025',
      totalRecords: 130,
      onTimeSubmissionPct: 84.5,
      syllabusCoveragePct: 82.0,
      studentBookCoveragePct: 78.4,
      evidenceCompletionPct: 71.0,
      managementReviewAvg: 82.0,
      overallPerformanceScore: 80.2,
      teachersEvaluated: 14,
      teachersOnSchedule: 11,
      teachersBehindSchedule: 3,
      flaggedStudentsCount: 28
    },
    {
      term: 'Second Term',
      academicSession: '2024/2025',
      totalRecords: 135,
      onTimeSubmissionPct: 86.8,
      syllabusCoveragePct: 85.3,
      studentBookCoveragePct: 82.1,
      evidenceCompletionPct: 76.5,
      managementReviewAvg: 84.5,
      overallPerformanceScore: 83.7,
      teachersEvaluated: 14,
      teachersOnSchedule: 12,
      teachersBehindSchedule: 2,
      flaggedStudentsCount: 22
    },
    {
      term: 'Third Term',
      academicSession: '2024/2025',
      totalRecords: 140,
      onTimeSubmissionPct: 88.2,
      syllabusCoveragePct: 89.0,
      studentBookCoveragePct: 85.0,
      evidenceCompletionPct: 80.0,
      managementReviewAvg: 86.0,
      overallPerformanceScore: 86.1,
      teachersEvaluated: 14,
      teachersOnSchedule: 13,
      teachersBehindSchedule: 1,
      flaggedStudentsCount: 16
    }
  ],
  '2023/2024': [
    {
      term: 'First Term',
      academicSession: '2023/2024',
      totalRecords: 115,
      onTimeSubmissionPct: 78.0,
      syllabusCoveragePct: 76.5,
      studentBookCoveragePct: 72.0,
      evidenceCompletionPct: 62.0,
      managementReviewAvg: 77.0,
      overallPerformanceScore: 74.8,
      teachersEvaluated: 12,
      teachersOnSchedule: 9,
      teachersBehindSchedule: 3,
      flaggedStudentsCount: 35
    },
    {
      term: 'Second Term',
      academicSession: '2023/2024',
      totalRecords: 120,
      onTimeSubmissionPct: 81.5,
      syllabusCoveragePct: 80.0,
      studentBookCoveragePct: 75.5,
      evidenceCompletionPct: 68.0,
      managementReviewAvg: 80.0,
      overallPerformanceScore: 78.2,
      teachersEvaluated: 12,
      teachersOnSchedule: 10,
      teachersBehindSchedule: 2,
      flaggedStudentsCount: 30
    },
    {
      term: 'Third Term',
      academicSession: '2023/2024',
      totalRecords: 125,
      onTimeSubmissionPct: 83.0,
      syllabusCoveragePct: 82.5,
      studentBookCoveragePct: 78.0,
      evidenceCompletionPct: 72.0,
      managementReviewAvg: 81.5,
      overallPerformanceScore: 80.1,
      teachersEvaluated: 12,
      teachersOnSchedule: 11,
      teachersBehindSchedule: 1,
      flaggedStudentsCount: 24
    }
  ]
};

// Historical Annual Session Metric
export interface SessionHistoricalMetric {
  academicSession: string;
  totalRecordsSubmitted: number;
  avgSubmissionCompliance: number;
  avgTeachingProgress: number;
  avgStudentWorkCoverage: number;
  avgEvidenceCompletion: number;
  avgManagementReview: number;
  compositePerformanceScore: number;
  activeTeachers: number;
  studentPassRatePct: number;
  curriculumCompletionRatePct: number;
  punctualityIndex: number;
}

export const HISTORICAL_SESSIONS_DATA: SessionHistoricalMetric[] = [
  {
    academicSession: '2026/2027 (Active)',
    totalRecordsSubmitted: 436,
    avgSubmissionCompliance: 95.2,
    avgTeachingProgress: 93.8,
    avgStudentWorkCoverage: 91.1,
    avgEvidenceCompletion: 88.7,
    avgManagementReview: 92.6,
    compositePerformanceScore: 92.5,
    activeTeachers: 18,
    studentPassRatePct: 96.2,
    curriculumCompletionRatePct: 94.5,
    punctualityIndex: 95.8
  },
  {
    academicSession: '2025/2026 (Completed)',
    totalRecordsSubmitted: 406,
    avgSubmissionCompliance: 93.2,
    avgTeachingProgress: 91.8,
    avgStudentWorkCoverage: 89.2,
    avgEvidenceCompletion: 86.5,
    avgManagementReview: 90.2,
    compositePerformanceScore: 90.4,
    activeTeachers: 16,
    studentPassRatePct: 94.6,
    curriculumCompletionRatePct: 92.8,
    punctualityIndex: 94.1
  },
  {
    academicSession: '2024/2025',
    totalRecordsSubmitted: 405,
    avgSubmissionCompliance: 86.5,
    avgTeachingProgress: 85.4,
    avgStudentWorkCoverage: 81.8,
    avgEvidenceCompletion: 75.8,
    avgManagementReview: 84.2,
    compositePerformanceScore: 83.3,
    activeTeachers: 14,
    studentPassRatePct: 88.4,
    curriculumCompletionRatePct: 85.6,
    punctualityIndex: 87.2
  },
  {
    academicSession: '2023/2024',
    totalRecordsSubmitted: 360,
    avgSubmissionCompliance: 80.8,
    avgTeachingProgress: 79.7,
    avgStudentWorkCoverage: 75.2,
    avgEvidenceCompletion: 67.3,
    avgManagementReview: 79.5,
    compositePerformanceScore: 77.7,
    activeTeachers: 12,
    studentPassRatePct: 82.1,
    curriculumCompletionRatePct: 79.4,
    punctualityIndex: 81.0
  }
];

// Late submission audit sample records
export interface LateSubmissionAudit {
  id: string;
  teacherId: string;
  teacherName: string;
  branch: string;
  className: string;
  subject: string;
  lessonDate: string;
  submittedDate: string;
  delayHours: number;
  reason: string;
  supervisorAction: string;
}

export const SAMPLE_LATE_SUBMISSIONS: LateSubmissionAudit[] = [];

// Missing submission gaps
export interface MissingSubmissionAudit {
  id: string;
  teacherId: string;
  teacherName: string;
  branch: string;
  className: string;
  subject: string;
  scheduledDate: string;
  period: string;
  status: 'Pending Submission' | 'Teacher On Leave' | 'Class Activity Swapped';
  daysOverdue: number;
}

export const SAMPLE_MISSING_SUBMISSIONS: MissingSubmissionAudit[] = [];

