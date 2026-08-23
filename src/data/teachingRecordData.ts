export type TeachingRecordStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Correction Required';

export type CurriculumPacingStatus = 
  | 'Not Started' 
  | 'On Schedule' 
  | 'Partially Completed' 
  | 'Completed' 
  | 'Ahead' 
  | 'Behind Schedule';

export type EvidenceType = 'board' | 'notebook' | 'classwork' | 'homework' | 'document';

export interface SupportingEvidence {
  id: string;
  type: EvidenceType;
  title: string;
  url?: string;
  fileName?: string;
  fileSize?: string;
  uploadedAt: string;
  notes?: string;
}

export type FlaggedStudentCategory = 'Not Completed' | 'Absent' | 'Needs Support';

export interface FlaggedStudentRecord {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  classId?: string;
  category: FlaggedStudentCategory;
  notes?: string;
  interventionPlan?: string;
}

export interface StudentCoverageEntry {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  status: 'Completed' | 'Partially Completed' | 'Not Completed' | 'Absent';
  needsSupport?: boolean;
  notes?: string;
}

export interface TeachingRecord {
  id: string;
  
  // Selectors & Mandatory Identification
  branch: string;             // 'GN' | 'RS' | 'Gawun Nama' | 'Runjin Sambo'
  academicSession: string;    // e.g. '2025/2026'
  term: string;               // e.g. 'First Term' | 'Second Term' | 'Third Term'
  classId: string;            // e.g. 'Primary 5 - Gold'
  subject: string;            // e.g. 'Primary Mathematics'
  week: number;               // 1 - 14
  date: string;               // YYYY-MM-DD
  time: string;               // e.g. '08:30 AM - 09:15 AM'
  
  // Scheme of Work Linkage (Optional explicit milestone link)
  schemeMilestoneWeek?: number; // Corresponding planned week in the Scheme of Work
  
  // Teacher
  teacherId: string;          // e.g. 'staff-1'
  teacherName: string;        // e.g. 'Aisha Garba'
  
  // What was taught in class (TAUGHT)
  topic: string;              // Topic taught
  subTopic: string;           // Sub-topic
  lessonTitle: string;        // Lesson title
  whatWasTaught: string;      // What was taught (detailed explanation & summary)
  boardWork: string;          // What was written/explained on the board
  teachingActivities: string; // Teaching activities & methods used
  teacherRemarks: string;     // Teacher's remarks & observations
  
  // What students covered in their books (COVERED)
  studentNotebookWork: string;// What students were expected to write in their books
  pagesCovered: string;       // Pages covered (e.g. "Textbook pp. 42–45, Workbook p. 19")
  classwork: string;          // Classwork assigned and done in class
  homework: string;           // Homework assigned
  
  // Student Book and Classwork Coverage Tracking (Progress Indicator - NOT Exam Marks)
  totalStudentsInClass: number;     // e.g. 30
  completedWorkCount: number;       // e.g. 27
  partiallyCompletedCount: number;  // e.g. 2
  notCompletedCount: number;        // e.g. 1
  absentCount?: number;             // e.g. 0
  workCoveragePercentage: number;   // e.g. 90 (27 / 30 = 90%)
  flaggedStudents?: FlaggedStudentRecord[]; // Individual students who did not complete work, were absent, or need support
  studentRosterCoverage?: StudentCoverageEntry[];

  // Supporting Evidence Uploads
  evidence: SupportingEvidence[];
  
  // Status & Review Workflow
  status: TeachingRecordStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerFeedback?: string;
  correctionInstructions?: string;
  
  // System Metadata
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface CurriculumComparisonItem {
  week: number;
  plannedTopic: string;
  plannedObjectives: string;
  
  // TAUGHT
  actualRecord?: TeachingRecord;
  taughtTopic?: string;
  taughtDate?: string;
  taughtWeek?: number;
  whatWasTaught?: string;
  
  // COVERED
  studentNotebookWork?: string;
  pagesCovered?: string;
  classwork?: string;
  homework?: string;
  hasNotebookEvidence: boolean;
  notebookEvidenceUrl?: string;

  // Student Coverage Metrics
  totalStudentsInClass?: number;
  completedWorkCount?: number;
  workCoveragePercentage?: number;
  flaggedStudentsCount?: number;
  
  // STATUS & AUDIT
  status: CurriculumPacingStatus;
  statusReason: string;
  
  // METADATA
  classId: string;
  subject: string;
  term: string;
  branch: string;
  teacherName?: string;
}

export const SAMPLE_EVIDENCE_PRESETS: { type: EvidenceType; label: string; title: string; defaultUrl: string }[] = [
  {
    type: 'board',
    label: 'Board Photograph',
    title: 'Chalkboard / Whiteboard Note Layout',
    defaultUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80'
  },
  {
    type: 'notebook',
    label: 'Notebook / Sample Book Photograph',
    title: 'Sample Student Notebook Copy',
    defaultUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'
  },
  {
    type: 'classwork',
    label: 'Classwork Photograph',
    title: 'Graded Classwork Sheet',
    defaultUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80'
  },
  {
    type: 'homework',
    label: 'Homework Evidence',
    title: 'Assigned Homework Handout & Problems',
    defaultUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
  },
  {
    type: 'document',
    label: 'Supporting Document',
    title: 'Curriculum Worksheet / Lesson Guide',
    defaultUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80'
  }
];

export const defaultTeachingRecords: TeachingRecord[] = [];
