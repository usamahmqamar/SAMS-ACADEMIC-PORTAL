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

export const defaultTeachingRecords: TeachingRecord[] = [
  {
    id: 'tr-1',
    branch: 'GN',
    academicSession: '2025/2026',
    term: 'First Term',
    classId: 'Primary 5 - Gold',
    subject: 'Primary Mathematics',
    week: 5,
    date: '2026-06-25',
    time: '08:30 AM - 09:15 AM',
    teacherId: 'staff-1',
    teacherName: 'Aisha Garba',
    topic: 'Fractions and Mixed Numbers',
    subTopic: 'Converting Improper Fractions to Mixed Numbers',
    lessonTitle: 'Improper Fraction Division & Mixed Representation',
    whatWasTaught: 'Taught students the definition of improper fractions (where numerator > denominator) versus mixed numbers. Demonstrated the conversion formula: divide numerator by denominator; quotient becomes the whole number, remainder becomes the new numerator over the original divisor. Guided students through visual pizza slice representations.',
    boardWork: 'Heading: FRACTIONS (CONVERSION)\nRule: Mixed Number = Whole Number + (Remainder / Divisor)\nExample 1: 11 / 4 = 2 whole and 3/4 remainder\nExample 2: 17 / 5 = 3 2/5\nExample 3: 25 / 6 = 4 1/6\nDiagram: 3 whole circles shaded + 1 half circle shaded = 7/2 = 3 1/2.',
    studentNotebookWork: 'Students copied the conversion rule definition, copied 3 solved examples from the board into their mathematics ruled exercise books, and drew the fraction circle diagrams for 7/2 and 9/4.',
    pagesCovered: 'Nigeria Primary Mathematics Book 5, pp. 42–44; Workbook Exercise 5B, p. 19.',
    classwork: 'Pupils completed 6 conversion exercises in class: 13/3, 19/4, 23/5, 31/6, 17/2, and 29/8.',
    homework: 'Page 44, Questions 1 through 8 in the standard textbook. Due next morning before morning assembly.',
    teachingActivities: '1. Warm-up mental math on multiplication tables (3 & 4).\n2. Demonstration on board using magnetic fraction disks.\n3. Pair-share exercise where pupils solved conversion problems on mini-slates.\n4. Roving individual checking and marking during classwork.',
    teacherRemarks: 'Most pupils (27/30) grasped the conversion division method. 3 pupils were flagged for extra remedial assist on Friday.',
    
    // Coverage Tracking
    totalStudentsInClass: 30,
    completedWorkCount: 27,
    partiallyCompletedCount: 2,
    notCompletedCount: 1,
    absentCount: 0,
    workCoveragePercentage: 90, // 27/30 = 90%
    flaggedStudents: [
      {
        studentId: 'std-101',
        studentName: 'Musa Ibrahim',
        admissionNumber: 'ADM-GN-2025-014',
        classId: 'Primary 5 - Gold',
        category: 'Needs Support',
        notes: 'Struggles with dividing remainders into fraction numerators. Needs concrete apparatus guidance.',
        interventionPlan: '15-minute remedial drill during Friday math clinic.'
      },
      {
        studentId: 'std-102',
        studentName: 'Fatima Abubakar',
        admissionNumber: 'ADM-GN-2025-022',
        classId: 'Primary 5 - Gold',
        category: 'Needs Support',
        notes: 'Needs additional practice on times tables 6 & 7 to complete division steps smoothly.',
        interventionPlan: 'Assigned multiplication practice flashcards.'
      },
      {
        studentId: 'std-103',
        studentName: 'Zainab Danladi',
        admissionNumber: 'ADM-GN-2025-045',
        classId: 'Primary 5 - Gold',
        category: 'Not Completed',
        notes: 'Exercise book was filled up; could not write out questions 5 and 6.',
        interventionPlan: 'New exercise book issued; work to be completed before next lesson.'
      }
    ],

    evidence: [
      {
        id: 'ev-1',
        type: 'board',
        title: 'Chalkboard Board Summary',
        url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
        fileName: 'board_maths_week5.jpg',
        fileSize: '1.4 MB',
        uploadedAt: '2026-06-25T09:20:00Z',
        notes: 'Clear board layout with examples and highlighted conversion rule.'
      },
      {
        id: 'ev-2',
        type: 'notebook',
        title: 'Pupil Notebook Sample (Zarah Bello)',
        url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
        fileName: 'notebook_zarah_bello.jpg',
        fileSize: '2.1 MB',
        uploadedAt: '2026-06-25T09:22:00Z',
        notes: 'Neat handwriting with shaded circular diagrams.'
      },
      {
        id: 'ev-3',
        type: 'classwork',
        title: 'Classwork Grading Sample',
        url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
        fileName: 'classwork_sample.jpg',
        fileSize: '1.8 MB',
        uploadedAt: '2026-06-25T09:25:00Z',
        notes: 'Marked classwork showing 6/6 correct answers.'
      }
    ],
    status: 'Reviewed',
    reviewedBy: 'Malam Sanusi (VP Academics)',
    reviewedAt: '2026-06-25T14:15:00Z',
    reviewerFeedback: 'Excellent teaching record. 90% student work coverage verified. 3 students flagged for remedial math clinic noted.',
    createdAt: '2026-06-25T09:30:00Z',
    updatedAt: '2026-06-25T14:15:00Z',
    submittedAt: '2026-06-25T10:00:00Z'
  },
  {
    id: 'tr-2',
    branch: 'GN',
    academicSession: '2025/2026',
    term: 'First Term',
    classId: 'Junior Sec 1 - Alpha',
    subject: 'Junior Secondary Science',
    week: 5,
    date: '2026-06-26',
    time: '10:00 AM - 10:45 AM',
    teacherId: 'staff-2',
    teacherName: 'Musa Abdullahi',
    topic: 'Physical and Chemical Changes',
    subTopic: 'Reversible vs Irreversible Reactions',
    lessonTitle: 'Observing Chemical Changes & Gas Evolution',
    whatWasTaught: 'Introduced the distinguishing features of physical changes (no new substance formed, easily reversible like melting ice) versus chemical changes (new substance formed, energy change, irreversible like burning magnesium or wood). Conducted classroom test-tube demonstration of vinegar and baking soda.',
    boardWork: 'Table of Comparison:\n[Physical Change | Chemical Change]\n1. No new substance | 1. New substance formed\n2. Reversible | 2. Generally irreversible\n3. No chemical bond change | 3. Chemical bonds broken & formed\nDemonstration Observation: Vinegar (Acetic Acid) + Baking Soda (Sodium Bicarbonate) -> CO2 gas bubbles + Water.',
    studentNotebookWork: 'Students drew the comparative two-column table and recorded observation results from the live vinegar + baking soda test tube reaction.',
    pagesCovered: 'Basic Science for Junior Secondary Schools, Book 1, pp. 58–61.',
    classwork: 'Classify 8 everyday processes into Physical or Chemical: Rusting of iron, boiling water, baking bread, dissolving salt, rotting apple, melting candle wax, burning match, shredding paper.',
    homework: 'Find 3 chemical changes and 3 physical changes occurring in your kitchen at home. Write them down with brief reasons.',
    teachingActivities: '1. Visual demonstration using vinegar and baking soda in conical flask with balloon inflation.\n2. Interactive Q&A on melting vs burning.\n3. Guided group discussion and classification exercise.',
    teacherRemarks: 'High participation. 28/32 completed the full table in class.',
    
    // Coverage Tracking
    totalStudentsInClass: 32,
    completedWorkCount: 28,
    partiallyCompletedCount: 2,
    notCompletedCount: 1,
    absentCount: 1,
    workCoveragePercentage: 88,
    flaggedStudents: [
      {
        studentId: 'std-201',
        studentName: 'Aliyu Bello',
        admissionNumber: 'ADM-GN-2025-089',
        classId: 'Junior Sec 1 - Alpha',
        category: 'Absent',
        notes: 'Absent due to mild fever (school clinic permit verified).',
        interventionPlan: 'Will copy classmate notebook notes upon return.'
      },
      {
        studentId: 'std-202',
        studentName: 'Maryam Sani',
        admissionNumber: 'ADM-GN-2025-091',
        classId: 'Junior Sec 1 - Alpha',
        category: 'Not Completed',
        notes: 'Incomplete classification table (missed items 7 & 8).',
        interventionPlan: 'To be reviewed during prep hour.'
      }
    ],

    evidence: [
      {
        id: 'ev-4',
        type: 'board',
        title: 'Science Board Summary',
        url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
        fileName: 'science_board_wk5.jpg',
        fileSize: '1.2 MB',
        uploadedAt: '2026-06-26T11:00:00Z',
        notes: 'Comparison table and chemical reaction equations.'
      },
      {
        id: 'ev-5',
        type: 'homework',
        title: 'Homework Sheet Handout',
        url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
        fileName: 'hw_sheet_science.jpg',
        fileSize: '1.5 MB',
        uploadedAt: '2026-06-26T11:02:00Z',
        notes: 'Printed worksheet instructions.'
      }
    ],
    status: 'Submitted',
    createdAt: '2026-06-26T11:15:00Z',
    updatedAt: '2026-06-26T11:20:00Z',
    submittedAt: '2026-06-26T11:20:00Z'
  },
  {
    id: 'tr-3',
    branch: 'RS',
    academicSession: '2025/2026',
    term: 'First Term',
    classId: 'Nursery 2 - Rose',
    subject: 'Nursery Literacy',
    week: 6,
    date: '2026-06-27',
    time: '09:00 AM - 09:35 AM',
    teacherId: 'staff-3',
    teacherName: 'Fatima Umar',
    topic: 'Phonics & CVC Words',
    subTopic: 'Short Vowel /a/ Sound CVC Words',
    lessonTitle: 'Reading and Writing CAT, BAT, HAT, MAT',
    whatWasTaught: 'Taught pupils how to blend three letter sounds: /c/-/a/-/t/ -> cat, /b/-/a/-/t/ -> bat, /h/-/a/-/t/ -> hat, /m/-/a/-/t/ -> mat. Used phonics flashcards and real objects (toy bat, hat, toy cat).',
    boardWork: 'Large dotted line drawings on the board:\nC - A - T = [Cat Picture]\nB - A - T = [Bat Picture]\nH - A - T = [Hat Picture]\nM - A - T = [Mat Picture]\nPractice: Underline the middle sound /a/ in red chalk.',
    studentNotebookWork: 'Pupils traced the four CVC words three times each across double lines and colored the cat and hat illustrations.',
    pagesCovered: 'Early Years Phonics Starter, pp. 24–25.',
    classwork: 'Tracing exercise: 4 rows of CVC words with correct pencil grip.',
    homework: 'Coloring and letter matching worksheet page 26.',
    teachingActivities: '1. Phonics action song for /a/ (ants on my arm).\n2. Flashcard sounding game in a circle.\n3. Guided pencil tracing at tables with individual teacher assist.',
    teacherRemarks: 'Pupils enjoyed the phonics song. Hand coordination on curved letter "c" needs practice for 2 pupils.',
    
    // Coverage Tracking
    totalStudentsInClass: 25,
    completedWorkCount: 22,
    partiallyCompletedCount: 3,
    notCompletedCount: 0,
    absentCount: 0,
    workCoveragePercentage: 88,
    flaggedStudents: [
      {
        studentId: 'std-301',
        studentName: 'Amina Kabir',
        admissionNumber: 'ADM-RS-2025-110',
        classId: 'Nursery 2 - Rose',
        category: 'Needs Support',
        notes: 'Needs pencil grip assistance for writing curved letters.',
        interventionPlan: 'Hand-over-hand tracing support during fine-motor play period.'
      }
    ],

    evidence: [
      {
        id: 'ev-6',
        type: 'notebook',
        title: 'Pupil Handwriting Sample',
        url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
        fileName: 'nursery_writing.jpg',
        fileSize: '1.9 MB',
        uploadedAt: '2026-06-27T10:00:00Z',
        notes: 'Sample of pupil tracing and colored picture.'
      }
    ],
    status: 'Draft',
    createdAt: '2026-06-27T10:15:00Z',
    updatedAt: '2026-06-27T10:15:00Z'
  },
  {
    id: 'tr-4',
    branch: 'GN',
    academicSession: '2025/2026',
    term: 'First Term',
    classId: 'Primary 4 - Diamond',
    subject: 'Basic English & Grammar',
    week: 5,
    date: '2026-06-24',
    time: '11:15 AM - 12:00 PM',
    teacherId: 'staff-4',
    teacherName: 'Aliyu Usman',
    topic: 'Parts of Speech',
    subTopic: 'Action Verbs and Past Tense Forms',
    lessonTitle: 'Regular vs Irregular Past Tense Verbs',
    whatWasTaught: 'Explained that verbs describe actions. Demonstrated standard past tense by adding -ed (walk -> walked, play -> played) and irregular forms (go -> went, eat -> ate, write -> wrote).',
    boardWork: 'VERBS: PRESENT & PAST TENSE\nRegular:\nwalk -> walked\njump -> jumped\nplay -> played\n\nIrregular:\ngo -> went\neate -> ate\nsee -> saw',
    studentNotebookWork: 'Copy the list of 10 verbs and their past tense forms into notebook.',
    pagesCovered: 'Brighter Grammar Book 4, pp. 31–33.',
    classwork: 'Fill in the blanks with the correct past tense form for 5 sentences.',
    homework: 'Write 5 original sentences using irregular past tense verbs.',
    teachingActivities: 'Mime action game, board substitution drills, sentence formation.',
    teacherRemarks: 'Spelling error on board was caught during review.',
    
    // Coverage Tracking
    totalStudentsInClass: 28,
    completedWorkCount: 20,
    partiallyCompletedCount: 5,
    notCompletedCount: 3,
    absentCount: 0,
    workCoveragePercentage: 71,
    flaggedStudents: [
      {
        studentId: 'std-401',
        studentName: 'Usman Faruk',
        admissionNumber: 'ADM-GN-2025-055',
        classId: 'Primary 4 - Diamond',
        category: 'Needs Support',
        notes: 'Confuses irregular verbs with -ed endings (wrote "goed" instead of "went").',
        interventionPlan: 'Irregular verb flashcard pair drilling.'
      }
    ],

    evidence: [],
    status: 'Correction Required',
    reviewedBy: 'Malam Sanusi (VP Academics)',
    reviewedAt: '2026-06-24T15:00:00Z',
    reviewerFeedback: 'Please check the board notes: "eate" was written instead of "eat". Please attach board photograph or student book evidence as required by academic standards.',
    correctionInstructions: '1. Fix spelling of "eat" in the board notes log.\n2. Upload at least one supporting photo evidence (chalkboard or pupil notebook sample).\n3. Re-submit for final approval.',
    createdAt: '2026-06-24T12:15:00Z',
    updatedAt: '2026-06-24T15:00:00Z',
    submittedAt: '2026-06-24T12:30:00Z'
  },
  {
    id: 'tr-5',
    branch: 'GN',
    academicSession: '2025/2026',
    term: 'First Term',
    classId: 'Primary 5 - Gold',
    subject: 'Primary Mathematics',
    week: 7, // Taught in Week 7, but Scheme of Work Planned topic for Week 6 -> BEHIND SCHEDULE
    schemeMilestoneWeek: 6,
    date: '2026-07-08',
    time: '08:30 AM - 09:15 AM',
    teacherId: 'staff-1',
    teacherName: 'Aisha Garba',
    topic: 'Decimals and Percentages',
    subTopic: 'Relating Tenths and Hundredths to Fraction Notation',
    lessonTitle: 'Decimal Place Values & Simple Percentage Conversions',
    whatWasTaught: 'Introduced tenths and hundredths as fractions with denominators 10 and 100. Demonstrated how 3/10 = 0.3 and 45/100 = 0.45 = 45%. Conducted grid shading exercises with 10x10 squares.',
    boardWork: 'DECIMAL NUMBERS & PERCENTAGES\n1/10 = 0.1 = 10%\n1/2 = 5/10 = 0.5 = 50%\n3/4 = 75/100 = 0.75 = 75%\nShaded 100-grid diagrams for 25% and 80%.',
    studentNotebookWork: 'Pupils drew two 10x10 grids, shaded 35 squares and 60 squares, and wrote decimal equivalents (0.35 and 0.60) below each.',
    pagesCovered: 'Nigeria Primary Mathematics Book 5, pp. 48–51.',
    classwork: 'Convert 6 fraction items into decimals: 7/10, 19/100, 4/5, 9/100, 3/10, 12/25.',
    homework: 'Page 52 Exercise 6A, Questions 1 through 12.',
    teachingActivities: '10x10 grid shading paper activity, board demonstration, flashcard conversion drills.',
    teacherRemarks: 'Topic was delayed from Week 6 due to extended revision required on mixed fractions. Pace has now caught up.',
    
    // Coverage Tracking
    totalStudentsInClass: 30,
    completedWorkCount: 26,
    partiallyCompletedCount: 3,
    notCompletedCount: 1,
    absentCount: 0,
    workCoveragePercentage: 87,
    flaggedStudents: [
      {
        studentId: 'std-104',
        studentName: 'Hauwa Garba',
        admissionNumber: 'ADM-GN-2025-031',
        classId: 'Primary 5 - Gold',
        category: 'Needs Support',
        notes: 'Needs help shading 100-square grids for decimals over 0.50.',
        interventionPlan: 'Visual grid shading exercises during remedial slot.'
      }
    ],

    evidence: [
      {
        id: 'ev-7',
        type: 'board',
        title: 'Decimals Board Photo',
        url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
        fileName: 'decimals_board.jpg',
        fileSize: '1.3 MB',
        uploadedAt: '2026-07-08T09:30:00Z',
        notes: 'Clear board work of grid representations and decimal fractions.'
      },
      {
        id: 'ev-8',
        type: 'notebook',
        title: 'Pupil Decimal Shading Grid (Umar Faruk)',
        url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
        fileName: 'pupil_decimal_grid.jpg',
        fileSize: '2.0 MB',
        uploadedAt: '2026-07-08T09:32:00Z',
        notes: 'Clean 100-square shading with 35% and 60% marked correctly.'
      }
    ],
    status: 'Submitted',
    createdAt: '2026-07-08T09:40:00Z',
    updatedAt: '2026-07-08T09:45:00Z',
    submittedAt: '2026-07-08T09:45:00Z'
  },
  {
    id: 'tr-6',
    branch: 'GN',
    academicSession: '2025/2026',
    term: 'First Term',
    classId: 'Junior Sec 1 - Alpha',
    subject: 'Junior Secondary Science',
    week: 5, // Taught early in Week 5, but Scheme of Work Planned for Week 6 -> AHEAD
    schemeMilestoneWeek: 6,
    date: '2026-06-27',
    time: '11:30 AM - 12:15 PM',
    teacherId: 'staff-2',
    teacherName: 'Musa Abdullahi',
    topic: 'Forces and Movement Mechanics',
    subTopic: 'Types of Forces (Contact vs Non-Contact Forces)',
    lessonTitle: 'Frictional, Gravitational, and Magnetic Forces',
    whatWasTaught: 'Introduced concept of force as a push or pull measured in Newtons. Illustrated friction as a resistance force and gravity as downward pull of Earth (9.8 m/s²). Demonstrated spring balances pulling wooden blocks across smooth and rough sandpaper surfaces.',
    boardWork: 'FORCES & MOVEMENT\nForce = Push or Pull (Unit: Newton [N])\n1. Contact Forces: Friction, Tension, Normal Force\n2. Non-Contact Forces: Gravity, Magnetism, Electrostatic\nFriction Formula / Concept: Friction opposes motion.',
    studentNotebookWork: 'Pupils copied force definitions, drew spring balance diagram, and recorded table of pulling forces measured on smooth wood (1.2 N) vs rough sandpaper (3.8 N).',
    pagesCovered: 'Basic Science Book 1, pp. 64–67.',
    classwork: 'Answer 5 concept questions on friction in daily life (car brakes, shoe soles, machinery oiling).',
    homework: 'Identify 4 examples of useful friction and 2 examples where friction causes unwanted wear in your household.',
    teachingActivities: 'Live spring balance pull demo, student volunteer readings, interactive forces classification.',
    teacherRemarks: 'Class covered chemical changes faster than planned, so we moved ahead into forces to give more buffer for practical laboratory tests.',
    
    // Coverage Tracking
    totalStudentsInClass: 32,
    completedWorkCount: 30,
    partiallyCompletedCount: 2,
    notCompletedCount: 0,
    absentCount: 0,
    workCoveragePercentage: 94,
    flaggedStudents: [],

    evidence: [
      {
        id: 'ev-9',
        type: 'board',
        title: 'Forces Board Breakdown',
        url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
        fileName: 'forces_board.jpg',
        fileSize: '1.4 MB',
        uploadedAt: '2026-06-27T12:20:00Z',
        notes: 'Spring balance diagrams and contact vs non-contact force classifications.'
      }
    ],
    status: 'Reviewed',
    reviewedBy: 'Malam Sanusi (VP Academics)',
    reviewedAt: '2026-06-27T16:00:00Z',
    reviewerFeedback: 'Commendable initiative moving ahead into Week 6 mechanics syllabus. High student engagement on the friction demonstration.',
    createdAt: '2026-06-27T12:30:00Z',
    updatedAt: '2026-06-27T16:00:00Z',
    submittedAt: '2026-06-27T12:45:00Z'
  },
  {
    id: 'tr-7',
    branch: 'GN',
    academicSession: '2025/2026',
    term: 'First Term',
    classId: 'Primary 5 - Gold',
    subject: 'Primary Mathematics',
    week: 1, // Planned Week 1, Taught Week 1, Reviewed & Full Evidence -> COMPLETED
    schemeMilestoneWeek: 1,
    date: '2026-06-03',
    time: '08:30 AM - 09:15 AM',
    teacherId: 'staff-1',
    teacherName: 'Aisha Garba',
    topic: 'Numbers and Place Values',
    subTopic: 'Reading & Writing Numbers up to 1,000,000',
    lessonTitle: 'Mastery of Place Value Charts & Expanded Notation',
    whatWasTaught: 'Taught students how to group digits into periods of thousands and units using commas. Practiced reading seven-digit figures and converting standard numeral form into expanded sum notation.',
    boardWork: 'PLACE VALUE CHART\n[ Millions | Hundred Thousands | Ten Thousands | Thousands | Hundreds | Tens | Units ]\nExample: 845,219 = 800,000 + 40,000 + 5,000 + 200 + 10 + 9\nIn Words: Eight hundred forty-five thousand, two hundred and nineteen.',
    studentNotebookWork: 'Pupils copied place value chart structure and completed 5 expanded notation problems in exercise books.',
    pagesCovered: 'Nigeria Primary Mathematics Book 5, pp. 2–6.',
    classwork: 'Write in words and expanded notation: 354,890, 712,045, and 905,302.',
    homework: 'Page 7 Exercise 1C, Questions 1 through 10.',
    teachingActivities: 'Place value abacus demonstration, choral number chanting, pair-checking of exercise books.',
    teacherRemarks: 'All 30 pupils demonstrated strong competence in reading 6-digit values. Syllabus week completed successfully.',
    
    // Coverage Tracking
    totalStudentsInClass: 30,
    completedWorkCount: 30,
    partiallyCompletedCount: 0,
    notCompletedCount: 0,
    absentCount: 0,
    workCoveragePercentage: 100,
    flaggedStudents: [],

    evidence: [
      {
        id: 'ev-10',
        type: 'board',
        title: 'Place Value Board Notes',
        url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
        fileName: 'place_value_board.jpg',
        fileSize: '1.1 MB',
        uploadedAt: '2026-06-03T09:20:00Z',
        notes: 'Chalkboard abacus and expanded notation formulas.'
      },
      {
        id: 'ev-11',
        type: 'notebook',
        title: 'Marked Exercise Book Sample',
        url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
        fileName: 'notebook_p5_wk1.jpg',
        fileSize: '1.8 MB',
        uploadedAt: '2026-06-03T09:25:00Z',
        notes: 'Complete notes and graded classwork 5/5.'
      }
    ],
    status: 'Reviewed',
    reviewedBy: 'Malam Sanusi (VP Academics)',
    reviewedAt: '2026-06-03T15:00:00Z',
    reviewerFeedback: 'Full syllabus compliance for Week 1. 100% notebook completion recorded.',
    createdAt: '2026-06-03T09:30:00Z',
    updatedAt: '2026-06-03T15:00:00Z',
    submittedAt: '2026-06-03T10:00:00Z'
  },
  {
    id: 'tr-8',
    branch: 'GN',
    academicSession: '2025/2026',
    term: 'First Term',
    classId: 'Primary 5 - Gold',
    subject: 'Islamic Studies',
    week: 4, // Planned Week 4, Taught Week 4 -> ON SCHEDULE
    schemeMilestoneWeek: 4,
    date: '2026-06-22',
    time: '10:00 AM - 10:45 AM',
    teacherId: 'staff-5',
    teacherName: 'Malam Sanusi',
    topic: 'Daily Salat (Five Prescribed Prayers)',
    subTopic: 'Rak\'ah Counts and Prayer Times',
    lessonTitle: 'Fajr, Dhuhr, Asr, Maghrib, and Isha Requirements',
    whatWasTaught: 'Taught the obligatory nature of the five daily prayers, the specific number of rak\'at for each prayer, and the conditions of prayer (Niyyah, Taharah, Qiblah, Timing).',
    boardWork: 'THE FIVE DAILY PRAYERS\n1. Fajr - 2 Rak\'ah (Dawn)\n2. Dhuhr - 4 Rak\'ah (Early Afternoon)\n3. Asr - 4 Rak\'ah (Late Afternoon)\n4. Maghrib - 3 Rak\'ah (Sunset)\n5. Isha - 4 Rak\'ah (Night)\nTotal Daily Obligatory Rak\'ah = 17.',
    studentNotebookWork: 'Pupils drew the 5-prayer summary chart with rak\'ah counts and timing in their Islamic Studies notebooks.',
    pagesCovered: 'Islamic Studies for Primary Schools Book 5, pp. 28–31.',
    classwork: 'Match the prayer name to its correct rak\'ah count and time period.',
    homework: 'Memorize the Tashahhud wording and recite to parent.',
    teachingActivities: 'Choral recitation of prayer names, mock prayer demonstration, notebook diagram inspection.',
    teacherRemarks: 'Pupils demonstrated good foundational knowledge. Practical prayer posture practice scheduled for assembly ground on Thursday.',
    
    // Coverage Tracking
    totalStudentsInClass: 30,
    completedWorkCount: 29,
    partiallyCompletedCount: 1,
    notCompletedCount: 0,
    absentCount: 0,
    workCoveragePercentage: 97,
    flaggedStudents: [],

    evidence: [
      {
        id: 'ev-12',
        type: 'board',
        title: 'Daily Salat Board Summary',
        url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
        fileName: 'salat_board.jpg',
        fileSize: '1.2 MB',
        uploadedAt: '2026-06-22T11:00:00Z',
        notes: 'Table of prayers and rak\'ah counts.'
      }
    ],
    status: 'Submitted',
    createdAt: '2026-06-22T11:15:00Z',
    updatedAt: '2026-06-22T11:15:00Z',
    submittedAt: '2026-06-22T11:15:00Z'
  }
];
