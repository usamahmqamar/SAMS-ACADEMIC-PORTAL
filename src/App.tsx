import React, { useState, useEffect, useMemo } from 'react';
import { 
  School, 
  Users, 
  GraduationCap, 
  Calendar, 
  Award, 
  Sparkles, 
  Search, 
  Plus, 
  Trash2, 
  Save, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  UserPlus, 
  Settings, 
  AlertCircle, 
  AlertTriangle,
  FileText, 
  CheckCircle,
  Pencil,
  Briefcase,
  ShieldAlert,
  Mail,
  Phone,
  MessageSquare,
  Activity,
  Maximize2,
  CalendarDays,
  RotateCcw,
  Sliders,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Info,
  UploadCloud,
  Layers,
  ShieldCheck,
  Lock,
  Key,
  DollarSign,
  Coins,
  Camera,
  Building2,
  Check,
  ClipboardCheck,
  Star,
  Globe,
  Flame,
  X,
  LogOut
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { LoginScreen, SystemUser } from './components/LoginScreen';
import { supabase } from './lib/supabaseClient';

import { UnifiedDashboardRouter } from './components/dashboard/UnifiedDashboardRouter';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import PayrollRegister from './components/PayrollRegister';
import FinancialAdjustments from './components/FinancialAdjustments';
import AcademicCalendar from './components/AcademicCalendar';
import OperationsDashboard from './components/OperationsDashboard';
import ExecutiveHealthDashboard from './components/ExecutiveHealthDashboard';
import FinancialSettings from './components/FinancialSettings';
import SchoolSetupConsole, { SaasSchoolConfig } from './components/SchoolSetupConsole';
import { Navigation, SAMS_MODULES } from './components/Navigation';
import { defaultChecklists, defaultLessonPlans } from './data/curriculumData';
import { CurriculumChecklistTab } from './components/CurriculumChecklistTab';
import { LessonPlansTab } from './components/LessonPlansTab';
import { TeachingRecordsTab } from './components/TeachingRecordsTab';
import { TeachingRecord, defaultTeachingRecords } from './data/teachingRecordData';
import { StudentBookCoverageProfileView } from './components/StudentBookCoverageProfileView';
import { PersonalizationModal, UserPreferences } from './components/PersonalizationModal';
import { GlobalSearch } from './components/GlobalSearch';
import { InventoryCatalog } from './components/InventoryCatalog';
import { AnalyticsReports } from './components/AnalyticsReports';
import { QuickActionMenu } from './components/QuickActionMenu';
import TerminalGradesControl from './components/TerminalGradesControl';
import { DEFAULT_ACADEMIC_DB } from './data/defaultDatabase';
import { EmployeeUserAccountsConsole } from './components/EmployeeUserAccountsConsole';
import { EmployeeBranchHistory, EmploymentStatus, UserAccountStatus, EmployeeIdConfig } from './types/employeeIdentity';
import { generateNextEmployeeId, logEmployeeAuditEvent, formatBranchName, hasBranchAccess, getAuthorizedBranches } from './utils/employeeIdentityUtils';
import { studentService, DbStudent } from './services/studentService';
import { staffService, DbEmployee } from './services/staffService';

interface AttendanceLog {
  date: string;
  status: 'Present' | 'Absent';
  reason?: string;
}

interface DisciplinaryRecord {
  date: string;
  issue: string;
  action: string;
  status: string;
}

interface AcademicProgressTerm {
  term: string;
  avg: number;
  status: string;
}

interface HomeworkItem {
  id: string;
  subject: string;
  task: string;
  dueDate: string;
  status: 'Pending' | 'Completed';
}

interface Notice {
  id: string;
  date: string;
  title: string;
  content: string;
}

interface Invoice {
  id: string;
  description: string;
  amount: number;
  paid: number;
  status: 'Paid' | 'Unpaid';
  date: string;
}

interface FeeStatements {
  invoices: Invoice[];
  outstandingBalance: number;
}

interface Topic {
  name: string;
  hours: number;
  objectives: string;
}

interface CurriculumPlan {
  id: string;
  grade: string;
  subject: string;
  topics: Topic[];
  teacherId?: string;
  branch?: 'GN' | 'RS';
}

interface Exam {
  id: string;
  title: string;
  grade: string;
  subject: string;
  date: string;
  weightPercentage: number;
  totalMarks: number;
  branch?: 'GN' | 'RS';
}

interface Subject {
  id: string;
  name: string;
  level: 'nursery' | 'primary' | 'secondary' | 'islamia';
  requirement: 'compulsory' | 'optional';
}

interface WeeklyMilestone {
  week: number;
  topic: string;
  objectives: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  completedDate?: string;
}

interface LessonPlanDraft {
  id: string;
  classId: string;
  subject: string;
  week: number;
  title: string;
  objectives: string;
  materials: string;
  procedureIntro: string;
  procedurePractice: string;
  procedureActivity: string;
  procedureEvaluation: string;
  homework: string;
  teacherId: string;
  teacherName: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Revision Needed';
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClassRecord {
  id: string;
  name: string;
  level: 'nursery' | 'primary' | 'secondary' | 'islamia';
  branch: string;
  subjects: string[];
  isScoreMatrixLocked?: boolean;
}

interface GradeScale {
  id: string;
  grade: string;
  minScore: number;
  maxScore: number;
  gradePoints: number;
  description: string;
}

interface Student {
  id: string;
  name: string;
  level: 'nursery' | 'primary' | 'secondary' | 'islamia';
  grade: string;
  classSection: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  attendancePercentage: number;
  behaviorRating: 'Excellent' | 'Good' | 'Needs Improvement';
  milestones: Record<string, string>;
  grades: Record<string, number>;
  gradesStatus?: Record<string, 'Draft' | 'Submitted' | 'Approved'>;
  milestonesStatus?: Record<string, 'Draft' | 'Submitted' | 'Approved'>;
  resultsApproved?: boolean;
  reportComment?: string;
  terminalRank?: number;
  terminalPercentile?: number;
  terminalRankCalculatedAt?: string;
  islamiaClassId?: string;
  sessionYear?: string;
  photoUrl?: string;
  
  // New complete student records:
  admissionDate?: string;
  enrollmentNo?: string;
  admissionStatus?: string;
  profile?: {
    gender: 'Female' | 'Male';
    dob: string;
    address: string;
    bloodGroup: string;
  };
  attendanceLogs?: AttendanceLog[];
  disciplinaryRecords?: DisciplinaryRecord[];
  extracurriculars?: string[];
  healthInfo?: {
    allergies: string;
    medicalConditions: string;
    bloodGroup: string;
    vaccinations: string;
  };
  academicProgression?: AcademicProgressTerm[];
  homework?: HomeworkItem[];
  notices?: Notice[];
  feeStatements?: FeeStatements;
  branch?: string;
  serialNumber?: number | string;
}

export interface TeacherAttendance {
  date: string;
  status: 'Present' | 'Absent' | 'On Leave' | 'Sick' | 'Half Day';
  remarks?: string;
}

export interface TeacherLeave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface TeacherPayroll {
  id: string;
  month: string;
  basic: number;
  bonus: number;
  deductions: number;
  net: number;
  status: 'Paid' | 'Unpaid';
  datePaid?: string;
}

interface TeacherPerformance {
  id: string;
  date: string;
  rating: number;
  comment: string;
  reviewer: string;
}

interface LessonPlan {
  id: string;
  subject: string;
  grade: string;
  topic: string;
  objective: string;
  summary: string;
  date: string;
  status: 'Draft' | 'Approved';
}

interface StaffSubjectAllocation {
  classId: string;
  className: string;
  subject: string;
  units: number; // number of times this subject appears per week
}

export interface Teacher {
  id: string;
  employeeId?: string;
  name: string;
  email: string;
  phone: string;
  level: ('nursery' | 'primary' | 'secondary')[];
  subjects: string[];
  classesAssigned: string[];
  joiningDate?: string;
  qualification?: string;
  status?: string;
  employmentStatus?: EmploymentStatus;
  department?: string;
  position?: string;
  branchHistory?: EmployeeBranchHistory[];
  address?: string;
  attendance?: TeacherAttendance[];
  leaves?: TeacherLeave[];
  payroll?: TeacherPayroll[];
  performance?: TeacherPerformance[];
  lessonPlans?: LessonPlan[];
  branch?: string;
  role?: 'teaching' | 'non-teaching' | 'management';
  userId?: string;
  accessControl?: 'Admin' | 'Staff/Teacher' | 'Manager' | 'Guest';
  classTeacherOf?: string; // The class name they are the class teacher of
  subjectAllocations?: StaffSubjectAllocation[];
  maxUnits?: number;
  performanceScore?: number;
  notes?: string;
  photoUrl?: string;
  statusChangeReason?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankIban?: string;
}

interface ScheduleEntry {
  id: string;
  grade: string;
  day: string;
  period: number;
  subject: string;
  teacherId: string;
  branch?: 'GN' | 'RS';
}

interface AdmissionApplication {
  id: string;
  name: string;
  level: 'nursery' | 'primary' | 'secondary';
  grade: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  branch: 'GN' | 'RS';
  status: 'Pre-registered' | 'Submitted by Parent' | 'HT Reviewed' | 'Approved & Allocated';
  preRegDate: string;

  // Parent completed details
  dob?: string;
  gender?: 'Male' | 'Female';
  address?: string;
  medicalAllergies?: string;
  medicalConditions?: string;
  bloodGroup?: string;
  previousSchool?: string;
  interests?: string;
  parentSubmittedDate?: string;

  // HT Review details
  htNotes?: string;
  htEvaluation?: 'Recommended' | 'Conditional' | 'Rejected';
  htReviewedBy?: string;
  htReviewedDate?: string;

  // Chairman approval details
  chairmanNotes?: string;
  allocatedSection?: string;
  chairmanApprovedDate?: string;
}

// Client-side mapping functions
const getLiveClassCode = (grade: string): string => {
  const g = (grade || "").toLowerCase();
  if (g.includes("nursery 1") || g.includes("preschool")) return "01";
  if (g.includes("nursery 2") || g.includes("k1")) return "02";
  if (g.includes("nursery 3") || g.includes("k2")) return "03";
  if (g.includes("grade 1") || g.includes("primary 1")) return "04";
  if (g.includes("grade 2") || g.includes("primary 2")) return "05";
  if (g.includes("grade 3") || g.includes("primary 3")) return "06";
  if (g.includes("grade 4") || g.includes("primary 4")) return "07";
  if (g.includes("grade 5") || g.includes("primary 5")) return "08";
  if (g.includes("grade 6") || g.includes("primary 6")) return "09";
  if (g.includes("grade 7")) return "10";
  if (g.includes("grade 8")) return "11";
  if (g.includes("grade 9")) return "12";
  if (g.includes("grade 10")) return "13";
  if (g.includes("grade 11")) return "14";
  if (g.includes("grade 12")) return "15";
  return "01"; 
};

// Predefined course syllabus subjects to avoid typos and ensure uniformity
const PREDEFINED_SYLLABUS: Record<string, string[]> = {
  nursery: [
    "Phonics & Rhymes",
    "Early Numeracy",
    "Sensory Arts",
    "Physical Play",
    "Social Sharing & Interaction",
    "Pre-Writing Skills",
    "Storytelling"
  ],
  primary: [
    "Mathematics",
    "Science",
    "English Language",
    "Social Studies",
    "Creative Arts",
    "Basic Technology",
    "Agricultural Science",
    "Home Economics",
    "Physical & Health Education",
    "Computer Studies",
    "Civic Education"
  ],
  secondary: [
    "Advanced Mathematics",
    "Integrated Science",
    "English Literature",
    "Social Studies",
    "Business Studies",
    "Agricultural Science",
    "Basic Technology",
    "Computer Science",
    "Civic Education",
    "French Language",
    "Further Mathematics",
    "Economics",
    "Financial Accounting",
    "Geography"
  ],
  islamia: [
    "Qur'an Recitation (Tajweed)",
    "Qur'an Memorization (Tahfiz)",
    "Hadith Study",
    "Fiqh (Islamic Jurisprudence)",
    "Seerah (Prophetic Biography)",
    "Tauhid (Islamic Creed)",
    "Arabic Language",
    "Akhlaq & Adab (Islamic Etiquette)"
  ]
};

export default function App() {
  // Ensure local state is synchronized for fresh 2026-2027 Academic Session
  useEffect(() => {
    const CURRENT_SESSION_VERSION = '2026_2027_v1';
    const storedVer = localStorage.getItem('sams_academic_session_version');
    if (storedVer !== CURRENT_SESSION_VERSION) {
      const keysToReset = [
        'sams_curriculum_checklists',
        'sams_lesson_plan_drafts',
        'sams_teaching_records',
        'sams_transfer_logs',
        'sams_payroll_loans',
        'sams_payroll_advances',
        'sams_payroll_bonuses',
        'sams_attendance_late_permissions',
        'sams_attendance_delay_flags',
        'sams_teachers'
      ];
      keysToReset.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('sams_academic_session_version', CURRENT_SESSION_VERSION);
    }
  }, []);

  // Multi-branch selection
  const [selectedBranch, setSelectedBranch] = useState<'All' | 'GN' | 'RS'>(() => {
    const saved = localStorage.getItem('sams_selected_branch');
    if (saved === 'All' || saved === 'RS' || saved === 'GN') return saved;
    return 'GN';
  });

  const [availableBranches, setAvailableBranches] = useState<Array<{ id: string; branch_name: string; branch_code: string }>>([
    { id: 'br-gn', branch_name: 'Gawun Nama Campus', branch_code: 'GN' },
    { id: 'br-rs', branch_name: 'Runjin Sambo Campus', branch_code: 'RS' }
  ]);

  useEffect(() => {
    // Fetch branches from Supabase
    supabase.from('branches').select('id, branch_name, branch_code').then(({ data }) => {
      if (data && data.length > 0) {
        setAvailableBranches(data);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('sams_selected_branch', selectedBranch);
  }, [selectedBranch]);

  // Global Currency locked uniformly to NGN (Naira)
  const selectedCurrency = 'NGN';
  const currencySymbol = '‚Ç¶';

  // Navigation (extended to include secure Parent login portal view)
  const [activeTab, setActiveTab ] = useState<any>(() => {
    try {
      const activeId = localStorage.getItem('sams_current_user_id') || 'usr-admin';
      const savedPrefs = localStorage.getItem(`sams_user_prefs_${activeId}`);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.defaultLandingPage) return parsed.defaultLandingPage;
      }
    } catch (e) {}
    return 'operations';
  });
  
  // --- UX ENHANCEMENT STATES (Persisted in localStorage) ---
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sams_favourites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyVisited, setRecentlyVisited] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sams_recently_visited');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('sams_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem('sams_favourites', JSON.stringify(favourites));
  }, [favourites]);

  useEffect(() => {
    localStorage.setItem('sams_recently_visited', JSON.stringify(recentlyVisited));
  }, [recentlyVisited]);

  useEffect(() => {
    localStorage.setItem('sams_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Hook to track visited pages dynamically based on active tab changes
  useEffect(() => {
    const match = SAMS_MODULES.flatMap(m => m.submenu).find(sub => sub.mappedTab === activeTab);
    if (match) {
      setRecentlyVisited(prev => {
        const filtered = prev.filter(id => id !== match.id);
        return [match.id, ...filtered].slice(0, 5); // Hold last 5 visited entries
      });
    }
  }, [activeTab]);

  const toggleFavourite = (id: string) => {
    setFavourites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Breadcrumb trail based on current active tab
  const breadcrumbs = useMemo(() => {
    for (const mod of SAMS_MODULES) {
      const sub = mod.submenu.find(s => s.mappedTab === activeTab);
      if (sub) {
        return {
          parentName: mod.name,
          parentIcon: mod.icon,
          childName: sub.name,
          childDesc: sub.description
        };
      }
    }
    // Fallback if no matching submenu item exists
    return {
      parentName: 'ERP Workspace',
      parentIcon: School,
      childName: 'Dashboard Overview',
      childDesc: 'Executive branch metrics & real-time controls'
    };
  }, [activeTab]);

  const [classesSubTab, setClassesSubTab] = useState<'classes' | 'subjects' | 'curriculum_checklists' | 'lesson_plans' | 'teaching_records'>('classes');

  const handleSubmenuSelect = (subId: string) => {
    if (subId === 'academics_classes' || subId === 'academics_sections' || subId === 'academics_islamia') {
      setClassesSubTab('classes');
    } else if (subId === 'academics_subjects') {
      setClassesSubTab('subjects');
    } else if (subId === 'academics_curriculum' || subId === 'academics_scheme') {
      setClassesSubTab('curriculum_checklists');
    } else if (subId === 'academics_lessons') {
      setClassesSubTab('lesson_plans');
    } else if (subId === 'academics_teaching_records') {
      setClassesSubTab('teaching_records');
    } else if (subId === 'students_directory') {
      setStudentsSubTab('directory');
      setStudentSelectionPrompt(null);
    } else if (subId === 'students_coverage') {
      setStudentsSubTab('directory');
      setDrawerActiveTab('coverage');
      setStudentSelectionPrompt("Please select a student from the directory below to inspect their Lesson Book Coverage and Work Completion History.");
    } else if (subId === 'students_profile') {
      setStudentsSubTab('directory');
      setDrawerActiveTab('profile');
      setStudentSelectionPrompt("Please select a student from the directory below to view their Comprehensive Profile Folder.");
    } else if (subId === 'students_medical') {
      setStudentsSubTab('directory');
      setDrawerActiveTab('health');
      setStudentSelectionPrompt("Please select a student from the directory below to view or edit their Immunizations, Allergies, and Health Records.");
    } else if (subId === 'students_discipline') {
      setStudentsSubTab('directory');
      setDrawerActiveTab('conduct');
      setStudentSelectionPrompt("Please select a student from the directory below to view or file Conduct Violations or Extra-curricular activities.");
    } else if (subId === 'students_financial') {
      setStudentsSubTab('directory');
      setDrawerActiveTab('finance');
      setStudentSelectionPrompt("Please select a student from the directory below to view their Tuition Ledger, Invoices, and outstanding balances.");
    } else if (subId === 'students_docs') {
      setStudentsSubTab('directory');
      setDrawerActiveTab('docs');
      setStudentSelectionPrompt("Please select a student from the directory below to view and upload their birth certificates, transcripts, or personal documents.");
    } else if (subId === 'students_id') {
      setStudentsSubTab('directory');
      setDrawerActiveTab('id');
      setStudentSelectionPrompt("Please select a student from the directory below to generate and print their Digital Student ID Card.");
    } else if (subId === 'students_promotion') {
      setStudentsSubTab('promotion');
      setStudentSelectionPrompt(null);
    } else if (subId === 'students_transfer') {
      setStudentsSubTab('transfer');
      setStudentSelectionPrompt(null);
    } else if (subId === 'financial_discounts' || subId === 'financial_sibling_relief') {
      setFinancialActiveSection('sibling_discounts');
    } else if (subId === 'financial_heads') {
      setFinancialActiveSection('fee_heads');
    } else if (subId === 'financial_templates' || subId === 'financial_overrides') {
      setFinancialActiveSection('fee_templates');
    } else if (subId === 'financial_optional') {
      setFinancialActiveSection('optional_charges');
    } else if (subId === 'financial_billing' || subId === 'financial_billing_hub') {
      setFinancialActiveSection('student_billing');
    } else if (subId === 'financial_structures') {
      setFinancialActiveSection('fee_heads');
    } else if (subId === 'financial_family') {
      setFinancialActiveSection('family_accounts');
    } else if (subId === 'financial_payments') {
      setFinancialActiveSection('payment_collection');
    } else if (subId === 'financial_expenses') {
      setFinancialActiveSection('expense_management');
    } else if (subId === 'financial_reports' || subId === 'financial_analytics') {
      setFinancialActiveSection('financial_reports');
    } else if (subId === 'financial_settings_main') {
      setFinancialActiveSection('general');
    }
  };

  const [selectedSubLevel, setSelectedSubLevel] = useState<'nursery' | 'primary' | 'secondary' | 'islamia'>('primary');

  // DB States
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('sams_students');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return (DEFAULT_ACADEMIC_DB.students as any) || [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('sams_students', JSON.stringify(students));
    } catch (e) {}
  }, [students]);

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('sams_teachers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const raw = (DEFAULT_ACADEMIC_DB.teachers as any) || [];
    return raw.map((t: any, idx: number) => {
      const branch = t.branch || (idx % 2 === 0 ? 'RS' : 'GN');
      const prefix = branch === 'RS' ? 'RJS-EMP-' : 'GWN-EMP-';
      const empId = t.employeeId || `${prefix}${String(idx + 1).padStart(4, '0')}`;
      return {
        ...t,
        branch,
        employeeId: empId,
        employmentStatus: t.employmentStatus || t.status || 'Active',
        status: t.status || 'Active',
        position: t.position || (t.role === 'management' ? 'Administrative Faculty' : 'Class Teacher & Subject Specialist'),
        department: t.department || (t.level?.includes('nursery') ? 'Early Years & Nursery' : 'Science & Mathematics'),
        branchHistory: t.branchHistory || [
          {
            id: `hist-init-${idx + 1}`,
            previousBranch: 'N/A (Initial Appointment)',
            newBranch: branch,
            transferDate: t.joiningDate || '2022-09-01',
            effectiveDate: t.joiningDate || '2022-09-01',
            transferReason: 'Initial Campus Posting & Academic Allocation',
            authorizedBy: 'Engr. Usamah M. Qamar (Super Administrator)',
            timestamp: new Date().toISOString()
          }
        ]
      };
    });
  });

  useEffect(() => {
    try {
      localStorage.setItem('sams_teachers', JSON.stringify(teachers));
    } catch (e) {}
  }, [teachers]);
  const [classes, setClasses] = useState<ClassRecord[]>(() => (DEFAULT_ACADEMIC_DB.classes as any) || []);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(() => (DEFAULT_ACADEMIC_DB.schedules as any) || []);
  const [subjects, setSubjects] = useState<Subject[]>(() => (DEFAULT_ACADEMIC_DB.subjects as any) || []);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectLevel, setNewSubjectLevel] = useState<'nursery' | 'primary' | 'secondary' | 'islamia'>('primary');
  const [subjectInputMode, setSubjectInputMode] = useState<'preset' | 'custom'>('preset');
  const [newSubjectRequirement, setNewSubjectRequirement] = useState<'compulsory' | 'optional'>('compulsory');
  const [curriculums, setCurriculums] = useState<CurriculumPlan[]>(() => (DEFAULT_ACADEMIC_DB.curriculums as any) || []);
  const [exams, setExams] = useState<Exam[]>(() => (DEFAULT_ACADEMIC_DB.exams as any) || []);
  const [gradeScales, setGradeScales] = useState<GradeScale[]>(() => (DEFAULT_ACADEMIC_DB.gradeScales as any) || []);
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>(() => (DEFAULT_ACADEMIC_DB.admissions as any) || []);
  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Curriculum Checklists & Lesson Plans states
  const [curriculumChecklists, setCurriculumChecklists] = useState<Record<string, WeeklyMilestone[]>>(() => {
    try {
      const saved = localStorage.getItem('sams_curriculum_checklists');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultChecklists;
  });

  const [lessonPlanDrafts, setLessonPlanDrafts] = useState<LessonPlanDraft[]>(() => {
    try {
      const saved = localStorage.getItem('sams_lesson_plan_drafts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultLessonPlans;
  });

  const [teachingRecords, setTeachingRecords] = useState<TeachingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('sams_teaching_records');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultTeachingRecords;
  });

  useEffect(() => {
    localStorage.setItem('sams_curriculum_checklists', JSON.stringify(curriculumChecklists));
  }, [curriculumChecklists]);

  useEffect(() => {
    localStorage.setItem('sams_lesson_plan_drafts', JSON.stringify(lessonPlanDrafts));
  }, [lessonPlanDrafts]);

  useEffect(() => {
    localStorage.setItem('sams_teaching_records', JSON.stringify(teachingRecords));
  }, [teachingRecords]);

  // Multi-branch filtered subsets
  const branchStudents = useMemo(() => {
    if (selectedBranch === 'All') return students;
    return students.filter(s => s.branch === selectedBranch || (!s.branch && selectedBranch === 'GN'));
  }, [students, selectedBranch]);

  const branchTeachers = useMemo(() => {
    if (selectedBranch === 'All') return teachers;
    return teachers.filter(t => t.branch === selectedBranch || (!t.branch && selectedBranch === 'GN'));
  }, [teachers, selectedBranch]);

  const branchAdmissions = useMemo(() => {
    if (selectedBranch === 'All') return admissions;
    return admissions.filter(a => a.branch === selectedBranch || (!a.branch && selectedBranch === 'GN'));
  }, [admissions, selectedBranch]);

  const branchSchedules = useMemo(() => {
    if (selectedBranch === 'All') return schedules;
    return schedules.filter(sch => sch.branch === selectedBranch || (!sch.branch && selectedBranch === 'GN'));
  }, [schedules, selectedBranch]);

  const branchCurriculums = useMemo(() => {
    if (selectedBranch === 'All') return curriculums;
    return curriculums.filter(c => c.branch === selectedBranch || (!c.branch && selectedBranch === 'GN'));
  }, [curriculums, selectedBranch]);

  const branchExams = useMemo(() => {
    if (selectedBranch === 'All') return exams;
    return exams.filter(e => e.branch === selectedBranch || (!e.branch && selectedBranch === 'GN'));
  }, [exams, selectedBranch]);

  const branchClasses = useMemo(() => {
    if (selectedBranch === 'All') return classes;
    return classes.filter(c => c.branch === selectedBranch || (!c.branch && selectedBranch === 'GN'));
  }, [classes, selectedBranch]);

  // App Health / AI Readiness State
  const [aiConfigured, setAiConfigured] = useState<boolean>(false);

  // Active SaaS School Configuration State
  const [activeSaaSSchool, setActiveSaaSSchool] = useState<SaasSchoolConfig | null>(() => {
    const savedId = localStorage.getItem('sams_active_saas_school_id');
    const savedSchoolsStr = localStorage.getItem('sams_saas_schools');
    if (savedSchoolsStr) {
      try {
        const schools = JSON.parse(savedSchoolsStr);
        if (Array.isArray(schools) && schools.length > 0) {
          const activeId = savedId || schools[0]?.id;
          return schools.find((s: any) => s.id === activeId) || schools[0] || null;
        }
      } catch (e) {}
    }
    return null;
  });

  // Filters & Selected objects
  const [studentSearchUrl, setStudentSearchUrl] = useState('');
  const [studentLevelFilter, setStudentLevelFilter] = useState<'all' | 'nursery' | 'primary' | 'secondary'>('all');
  const [studentBranchFilter, setStudentBranchFilter] = useState<string>('All');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('All');
  const [studentSectionFilter, setStudentSectionFilter] = useState<string>('All');
  const [studentSessionFilter, setStudentSessionFilter] = useState<string>('All');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'profile' | 'coverage' | 'conduct' | 'health' | 'finance' | 'docs' | 'id'>('profile');
  const [studentsSubTab, setStudentsSubTab] = useState<'directory' | 'promotion' | 'transfer'>('directory');
  const [studentSelectionPrompt, setStudentSelectionPrompt] = useState<string | null>(null);
  const [idCardTheme, setIdCardTheme] = useState<'indigo' | 'emerald' | 'amber' | 'midnight'>('indigo');
  const [idCardValidity, setIdCardValidity] = useState<string>('2025/2026');
  const [idCardShowBarcode, setIdCardShowBarcode] = useState<boolean>(true);
  const [newDocTitle, setNewDocTitle] = useState<string>('');
  const [newDocCategory, setNewDocCategory] = useState<string>('Birth Certificate');
  const [newDocFileMockName, setNewDocFileMockName] = useState<string>('');
  const [promotionClassFilter, setPromotionClassFilter] = useState<string>('Grade 1');
  const [selectedTransferStudentId, setSelectedTransferStudentId] = useState<string>('');
  const [transferDestinationBranch, setTransferDestinationBranch] = useState<'GN' | 'RS'>('RS');
  const [transferReason, setTransferReason] = useState<string>('');
  const [transferLogs, setTransferLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('sams_transfer_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'tx-1', studentName: 'Fatima Abubakar', fromBranch: 'GN', toBranch: 'RS', date: '2025-11-10', reason: 'Family relocation to Runjin Sambo area' },
      { id: 'tx-2', studentName: 'Mustapha Bello', fromBranch: 'RS', toBranch: 'GN', date: '2026-01-14', reason: 'Class size adjustment & transport optimization' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('sams_transfer_logs', JSON.stringify(transferLogs));
  }, [transferLogs]);
  
  // Teachers states
  const [teacherSearchVal, setTeacherSearchVal] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherFolderTab, setTeacherFolderTab] = useState<'profile' | 'branchIdentity' | 'schedule' | 'attendance' | 'payroll' | 'performance' | 'lessons' | 'tools'>('profile');

  // Academic Sub tab state
  const [academicSubTab, setAcademicSubTab] = useState<'analytics' | 'report_cards' | 'curriculum' | 'exams' | 'scales'>('analytics');

  // Curriculum planning form states
  const [newCurrGrade, setNewCurrGrade] = useState<string>('Grade 10');
  const [newCurrSubject, setNewCurrSubject] = useState<string>('');
  const [newCurrTeacherId, setNewCurrTeacherId] = useState<string>('');
  const [newTopicName, setNewTopicName] = useState<string>('');
  const [newTopicHours, setNewTopicHours] = useState<string>('12');
  const [newTopicObjectives, setNewTopicObjectives] = useState<string>('');
  const [currTopicsBuffer, setCurrTopicsBuffer] = useState<Topic[]>([]);

  // Exam scheduling form states
  const [newExamTitle, setNewExamTitle] = useState<string>('');
  const [newExamGrade, setNewExamGrade] = useState<string>('Grade 10');
  const [newExamSubject, setNewExamSubject] = useState<string>('');
  const [newExamDate, setNewExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newExamWeight, setNewExamWeight] = useState<string>('30');
  const [newExamTotalMarks, setNewExamTotalMarks] = useState<string>('100');

  // Inline forms inside Teacher folder dashboard:
  const [newTeacherLogDate, setNewTeacherLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTeacherLogStatus, setNewTeacherLogStatus] = useState<'Present' | 'Absent' | 'On Leave'>('Present');
  const [newTeacherLogRemarks, setNewTeacherLogRemarks] = useState<string>('');

  const [newTeacherLeaveType, setNewTeacherLeaveType] = useState<string>('Sick Leave');
  const [newTeacherLeaveStart, setNewTeacherLeaveStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTeacherLeaveEnd, setNewTeacherLeaveEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTeacherLeaveReason, setNewTeacherLeaveReason] = useState<string>('');

  const [newTeacherPayMonth, setNewTeacherPayMonth] = useState<string>('June 2026');
  const [newTeacherPayBasic, setNewTeacherPayBasic] = useState<string>('3000');
  const [newTeacherPayBonus, setNewTeacherPayBonus] = useState<string>('0');
  const [newTeacherPayDeductions, setNewTeacherPayDeductions] = useState<string>('0');
  const [newTeacherPayStatus, setNewTeacherPayStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [showStaffExitModal, setShowStaffExitModal] = useState<boolean>(false);
  const [exitModalTeacher, setExitModalTeacher] = useState<Teacher | null>(null);

  const [newTeacherPerfRating, setNewTeacherPerfRating] = useState<number>(5);
  const [newTeacherPerfComment, setNewTeacherPerfComment] = useState<string>('');
  const [newTeacherPerfReviewer, setNewTeacherPerfReviewer] = useState<string>('Academic Director');

  const [newLessonPlanSubject, setNewLessonPlanSubject] = useState<string>('');
  const [newLessonPlanGrade, setNewLessonPlanGrade] = useState<string>('');
  const [newLessonPlanTopic, setNewLessonPlanTopic] = useState<string>('');
  const [newLessonPlanObjective, setNewLessonPlanObjective] = useState<string>('');
  const [newLessonPlanSummary, setNewLessonPlanSummary] = useState<string>('');
  const [newLessonPlanDate, setNewLessonPlanDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Homework publishing states inside Teacher Folder drawer
  const [newPubHwSubject, setNewPubHwSubject] = useState<string>('Mathematics');
  const [newPubHwGrade, setNewPubHwGrade] = useState<string>('Grade 3');
  const [newPubHwClassSection, setNewPubHwClassSection] = useState<string>('all');
  const [newPubHwTask, setNewPubHwTask] = useState<string>('');
  const [newPubHwDueDate, setNewPubHwDueDate] = useState<string>(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);

  // Result Grading desk states inside Teacher folder
  const [newGradingStudentId, setNewGradingStudentId] = useState<string>('');
  const [newGradingSubject, setNewGradingSubject] = useState<string>('Mathematics');
  const [newGradingScore, setNewGradingScore] = useState<string>('85');

  // Modals for CRUD creation
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);

  // Programmatic financial active section
  const [financialActiveSection, setFinancialActiveSection] = useState<'general' | 'fee_heads' | 'optional_charges' | 'sections_classes' | 'fee_templates' | 'student_billing' | 'family_accounts' | 'payment_collection' | 'financial_timeline' | 'expense_management' | 'financial_reports' | 'sibling_discounts' | 'discounts'>('general');

  // Bulk Student Import fields
  const [bulkImportNames, setBulkImportNames] = useState('');
  const [bulkImportBranch, setBulkImportBranch] = useState<'GN' | 'RS'>('GN');
  const [bulkImportSession, setBulkImportSession] = useState('20');
  const [bulkImportLevel, setBulkImportLevel] = useState<'nursery' | 'primary' | 'secondary'>('primary');
  const [bulkImportGrade, setBulkImportGrade] = useState('Grade 1');
  const [bulkImportSection, setBulkImportSection] = useState('A');
  const [bulkImportStartSerial, setBulkImportStartSerial] = useState('');

  // Create forms payload
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    level: 'primary' as 'nursery' | 'primary' | 'secondary',
    grade: 'Grade 3',
    classSection: 'A',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    behaviorRating: 'Good' as 'Excellent' | 'Good' | 'Needs Improvement',
    serialNumber: '',
    sessionYear: '26',
    islamiaClassId: ''
  });

  const [newTeacherForm, setNewTeacherForm] = useState({
    name: '',
    email: '',
    phone: '',
    level: [] as string[],
    subjectsString: '',
    classesString: '',
    role: 'teaching' as 'teaching' | 'non-teaching' | 'management',
    userId: '',
    accessControl: 'Staff/Teacher' as 'Admin' | 'Staff/Teacher' | 'Manager' | 'Guest',
    maxUnits: 20,
    performanceScore: 80
  });

  const [staffRoleFilter, setStaffRoleFilter] = useState<'all' | 'teaching' | 'non-teaching' | 'management'>('all');

  // Inline forms inside Student folder drawer:
  // 1. Attendance Log Form
  const [newLogDate, setNewLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newLogStatus, setNewLogStatus] = useState<'Present' | 'Absent'>('Present');
  const [newLogReason, setNewLogReason] = useState<string>('');

  // 2. Disciplinary Action Form
  const [newDiscDate, setNewDiscDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newDiscIssue, setNewDiscIssue] = useState<string>('');
  const [newDiscAction, setNewDiscAction] = useState<string>('');
  const [newDiscStatus, setNewDiscStatus] = useState<string>('Resolved');

  // 3. Extracurricular Add Form
  const [newExtraText, setNewExtraText] = useState<string>('');

  // 4. Homework Add Form
  const [newHwSubject, setNewHwSubject] = useState<string>('Mathematics');
  const [newHwTask, setNewHwTask] = useState<string>('');
  const [newHwDueDate, setNewHwDueDate] = useState<string>(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);

  // 5. Broad Bulletin Notice Form
  const [newNotTitle, setNewNotTitle] = useState<string>('');
  const [newNotContent, setNewNotContent] = useState<string>('');

  // 6. Fee Invoice Post Form
  const [newInvDesc, setNewInvDesc] = useState<string>('');
  const [newInvAmount, setNewInvAmount] = useState<string>('500');

  // 7. Secure Parent Portal Login UI state
  const [parentLoginId, setParentLoginId] = useState<string>('');
  const [parentLoginEmail, setParentLoginEmail] = useState<string>('');
  const [parentAuthError, setParentAuthError] = useState<string | null>(null);
  const [loggedParentStudent, setLoggedParentStudent] = useState<Student | null>(null);
  const [studentRestrictions, setStudentRestrictions] = useState<any>(null);

  const fetchStudentRestrictions = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students/${studentId}/restrictions`);
      if (res.ok) {
        const data = await res.json();
        setStudentRestrictions(data);
      }
    } catch (e) {
      console.error("Error fetching student restrictions:", e);
    }
  };

  useEffect(() => {
    if (loggedParentStudent) {
      fetchStudentRestrictions(loggedParentStudent.id);
    } else {
      setStudentRestrictions(null);
    }
  }, [loggedParentStudent]);

  const [selectedStudentRestrictions, setSelectedStudentRestrictions] = useState<any>(null);

  useEffect(() => {
    if (selectedStudent) {
      const fetchRestrictions = async () => {
        try {
          const res = await fetch(`/api/students/${selectedStudent.id}/restrictions`);
          if (res.ok) {
            const data = await res.json();
            setSelectedStudentRestrictions(data);
          }
        } catch (e) {
          console.error("Error fetching selected student restrictions:", e);
        }
      };
      fetchRestrictions();
    } else {
      setSelectedStudentRestrictions(null);
    }
  }, [selectedStudent?.id]);

  // Simulated parent payment state
  const [processingParentPayment, setProcessingParentPayment] = useState<boolean>(false);
  const [paymentSuccessReport, setPaymentSuccessReport] = useState<string | null>(null);

  // Report Card Generator state
  const [reportStudent, setReportStudent] = useState<Student | null>(() => (DEFAULT_ACADEMIC_DB.students[0] as any) || null);
  const [customAiFocus, setCustomAiFocus] = useState<string>('');
  const [generatingReportComment, setGeneratingReportComment] = useState<boolean>(false);
  const [aiErrorMsg, setAiErrorMsg] = useState<string | null>(null);

  // Exam Score Entry interactive selections
  const [scoreEntryClass, setScoreEntryClass] = useState<string>('');
  const [scoreEntrySubject, setScoreEntrySubject] = useState<string>('');

  // Consolidation Moderation board active review selection
  const [activeModerateCourse, setActiveModerateCourse] = useState<any | null>(null);
  const [moderationExpandedStudentId, setModerationExpandedStudentId] = useState<string | null>(null);

  // Scheduler Interactive entries
  const [currentScheduleGrade, setCurrentScheduleGrade] = useState<string>('Grade 3');
  const [newScheduleForm, setNewScheduleForm] = useState({
    day: 'Monday',
    period: 1,
    subject: '',
    teacherId: ''
  });

  // Admissions Interactive States
  const [admissionRole, setAdmissionRole] = useState<'registrar' | 'parent' | 'headteacher' | 'chairman'>('registrar');
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>('');
  
  // Registrar form
  const [regForm, setRegForm] = useState({
    name: '',
    level: 'primary' as 'nursery' | 'primary' | 'secondary',
    grade: 'Grade 3',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    branch: 'GN' as 'GN' | 'RS'
  });

  // Parent form
  const [parentForm, setParentForm] = useState({
    dob: '2018-05-15',
    gender: 'Female' as 'Male' | 'Female',
    address: '',
    medicalAllergies: 'None',
    medicalConditions: 'None',
    bloodGroup: 'O+',
    previousSchool: '',
    interests: ''
  });

  // HT form
  const [htReviewNotes, setHtReviewNotes] = useState('');
  const [htEvaluation, setHtEvaluation] = useState<'Recommended' | 'Conditional' | 'Rejected'>('Recommended');
  const [htReviewedBy, setHtReviewedBy] = useState('Principal Usman Sambo');
  const [parentPunctuality, setParentPunctuality] = useState(8);
  const [parentEngagement, setParentEngagement] = useState(8);
  const [studentResponsiveness, setStudentResponsiveness] = useState(8);
  const [academicReadiness, setAcademicReadiness] = useState(8);

  // Chairman form
  const [chairmanNotes, setChairmanNotes] = useState('');
  const [allocatedSection, setAllocatedSection] = useState('A');
  const [feeTemplates, setFeeTemplates] = useState<any[]>(() => (DEFAULT_ACADEMIC_DB as any).fee_templates || []);
  const [selectedFeeTemplateId, setSelectedFeeTemplateId] = useState('');

  // Admissions feedback state
  const [admissionsFeedback, setAdmissionsFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showAdmissionsFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setAdmissionsFeedback({ type, message });
    setTimeout(() => {
      const el = document.getElementById('erp-view-admission');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Class Management States
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState<'nursery' | 'primary' | 'secondary' | 'islamia'>('primary');
  const [newClassSubjectsString, setNewClassSubjectsString] = useState('Mathematics, Science');
  const [selectedNewClassSubjects, setSelectedNewClassSubjects] = useState<string[]>([]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [editClassName, setEditClassName] = useState('');
  const [editClassLevel, setEditClassLevel] = useState<'nursery' | 'primary' | 'secondary' | 'islamia'>('primary');
  const [editClassBranch, setEditClassBranch] = useState<'GN' | 'RS'>('GN');

  // Allocation Manager States
  const [allocClassId, setAllocClassId] = useState('');
  const [allocSubject, setAllocSubject] = useState('');
  const [allocUnits, setAllocUnits] = useState('4');

  // User Management & Roles Control States
  const [currentSimulatedRole, setCurrentSimulatedRole] = useState<string>(() => {
    const val = localStorage.getItem('sams_simulated_role');
    if (val === 'Super Admin') return 'Super Administrator';
    if (val === 'Branch Admin') return 'Branch Administrator';
    return val || 'Super Administrator';
  });

  const [systemUsers, setSystemUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('sams_system_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((usr: any) => {
            if (usr.id === 'usr-admin' || usr.role === 'Super Administrator' || usr.role === 'Super Admin' || usr.email === 'admin@sams.com') {
              usr.name = 'Engr. Usamah M. Qamar';
              usr.email = 'usamah.m.qamar@gmail.com';
              usr.password = 'Q@marm@jeed786';
              usr.role = 'Super Administrator';
            }
            if (usr.role === 'Super Admin') usr.role = 'Super Administrator';
            if (usr.role === 'Branch Admin') usr.role = 'Branch Administrator';
            if (!usr.primaryBranch) usr.primaryBranch = usr.branch || 'RS';
            if (!usr.additionalBranches) usr.additionalBranches = usr.branch === 'All' ? ['RS', 'GN'] : [usr.primaryBranch];
            return usr;
          });
        }
      } catch (e) {}
    }
    return [
      { id: 'usr-admin', name: 'Engr. Usamah M. Qamar', email: 'usamah.m.qamar@gmail.com', password: 'Q@marm@jeed786', role: 'Super Administrator', branch: 'All', status: 'Active', employeeId: 'HQ-EMP-0001', primaryBranch: 'All', additionalBranches: ['RS', 'GN'], phone: '+234 803 123 4567', accessCount: 257 },
      { id: 'usr-1', name: 'Alh. Ibrahim Usman', email: 'proprietor@sams.com', role: 'Proprietor', branch: 'All', status: 'Active', employeeId: 'HQ-EMP-0002', primaryBranch: 'All', additionalBranches: ['RS', 'GN'], phone: '+234 803 111 2222', accessCount: 142 },
      { id: 'usr-2', name: 'Mrs. Maryam Sani', email: 'maryam.s@sams.rs.com', role: 'Branch Administrator', branch: 'RS', status: 'Active', employeeId: 'RJS-EMP-0001', primaryBranch: 'RS', additionalBranches: ['RS'], phone: '+234 803 222 3333', accessCount: 88 },
      { id: 'usr-principal', name: 'Mrs. Grace Aliyu', email: 'principal@sams.com', role: 'Principal', branch: 'GN', status: 'Active', employeeId: 'GWN-EMP-0001', primaryBranch: 'GN', additionalBranches: ['GN'], phone: '+234 803 999 8888', accessCount: 112 },
      { id: 'usr-3', name: 'Malam Abubakar Bello', email: 'finance@sams.gn.com', role: 'Accountant', branch: 'GN', status: 'Active', employeeId: 'GWN-EMP-0002', primaryBranch: 'GN', additionalBranches: ['GN'], phone: '+234 803 333 4444', accessCount: 204 },
      { id: 'usr-4', name: 'Malam Junaid Aliyu', email: 'stores@sams.com', role: 'Store Manager', branch: 'All', status: 'Active', employeeId: 'HQ-EMP-0003', primaryBranch: 'All', additionalBranches: ['RS', 'GN'], phone: '+234 803 444 5555', accessCount: 51 },
      { id: 'usr-5', name: 'Dr. Yusuf Idris', email: 'yusuf.idris@sams.gn.com', role: 'Teacher', branch: 'GN', status: 'Active', employeeId: 'GWN-EMP-0003', primaryBranch: 'GN', additionalBranches: ['GN'], phone: '+234 803 555 6666', accessCount: 119 },
      { id: 'usr-6', name: 'Engr. Aisha Bello', email: 'aisha.b@gmail.com', role: 'Parent', branch: 'RS', status: 'Active', employeeId: 'RJS-PAR-0001', primaryBranch: 'RS', additionalBranches: ['RS'], phone: '+234 803 666 7777', accessCount: 37 }
    ];
  });

  // --- PERSONALIZATION DEFAULT DATABASE BY USER PROFILE ---
  const DEFAULT_PREFS_BY_USER: Record<string, UserPreferences> = useMemo(() => ({
    'usr-admin': {
      theme: 'light',
      defaultLandingPage: 'operations',
      favourites: ['dashboard_exec', 'admin_audit', 'ops_dashboard'],
      quickShortcuts: ['dashboard_exec', 'admin_audit', 'ops_dashboard', 'students_directory'],
      notifications: { emailAlerts: true, smsAlerts: true, systemSound: true, frequency: 'realtime' }
    },
    'usr-1': {
      theme: 'light',
      defaultLandingPage: 'overview',
      favourites: ['dashboard_exec', 'dashboard_financial'],
      quickShortcuts: ['dashboard_exec', 'dashboard_financial', 'school_setup'],
      notifications: { emailAlerts: true, smsAlerts: false, systemSound: true, frequency: 'daily' }
    },
    'usr-2': {
      theme: 'light',
      defaultLandingPage: 'overview',
      favourites: ['dashboard_branch', 'students_directory'],
      quickShortcuts: ['dashboard_branch', 'students_directory', 'attendance_student'],
      notifications: { emailAlerts: true, smsAlerts: false, systemSound: true, frequency: 'realtime' }
    },
    'usr-principal': {
      theme: 'light',
      defaultLandingPage: 'overview',
      favourites: ['dashboard_academic', 'staff_profiles'],
      quickShortcuts: ['dashboard_academic', 'staff_profiles', 'academics_timetable'],
      notifications: { emailAlerts: true, smsAlerts: false, systemSound: true, frequency: 'realtime' }
    },
    'usr-3': {
      theme: 'light',
      defaultLandingPage: 'students',
      favourites: ['dashboard_financial', 'students_financial'],
      quickShortcuts: ['dashboard_financial', 'students_financial'],
      notifications: { emailAlerts: true, smsAlerts: true, systemSound: true, frequency: 'realtime' }
    },
    'usr-4': {
      theme: 'light',
      defaultLandingPage: 'inventory',
      favourites: ['dashboard_inventory'],
      quickShortcuts: ['dashboard_inventory'],
      notifications: { emailAlerts: true, smsAlerts: false, systemSound: true, frequency: 'daily' }
    },
    'usr-5': {
      theme: 'light',
      defaultLandingPage: 'teachers',
      favourites: ['results_entry', 'academics_lessons'],
      quickShortcuts: ['results_entry', 'academics_lessons'],
      notifications: { emailAlerts: true, smsAlerts: false, systemSound: false, frequency: 'weekly' }
    },
    'usr-6': {
      theme: 'light',
      defaultLandingPage: 'parent',
      favourites: ['students_profile', 'students_financial'],
      quickShortcuts: ['students_profile', 'students_financial'],
      notifications: { emailAlerts: true, smsAlerts: true, systemSound: true, frequency: 'realtime' }
    }
  }), []);

  // Supabase Authentication & IAM State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Personalized states
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('sams_current_user_id') || 'usr-admin';
  });

  // Supabase Auth Session Management & Profile Resolution
  useEffect(() => {
    let isMounted = true;

    const resolveUserProfile = async (authUser: any) => {
      try {
        // 1. Check system_user_profiles
        const { data: profile } = await supabase
          .from('system_user_profiles')
          .select('*, roles(role_name, role_code), employees(*), user_branch_access(*, branches(*))')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        if (profile && isMounted) {
          if (profile.status !== 'Active') {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            setAuthLoading(false);
            return;
          }

          const roleName = profile.roles?.role_name || (profile.is_super_admin ? 'Super Administrator' : 'Staff');
          const branchCodes = profile.user_branch_access?.map((b: any) => b.branches?.branch_code).filter(Boolean) || [];
          const primaryBranch = branchCodes.length > 1 ? 'All' : (branchCodes[0] || 'GN');

          setSystemUsers(prev => {
            const idx = prev.findIndex(u => u.email?.toLowerCase() === profile.email?.toLowerCase() || u.id === profile.id);
            const mapped = {
              id: profile.id,
              name: profile.employees ? `${profile.employees.first_name} ${profile.employees.last_name}` : (profile.username || profile.email),
              email: profile.email,
              role: roleName,
              branch: primaryBranch,
              status: profile.status,
              employeeId: profile.employees?.employee_id || profile.employee_id,
              primaryBranch: primaryBranch,
              additionalBranches: branchCodes,
              phone: profile.employees?.phone,
              accessCount: 1
            };
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...mapped };
              return copy;
            }
            return [mapped, ...prev];
          });

          setCurrentUserId(profile.id);
          setCurrentSimulatedRole(roleName);
          if (primaryBranch && primaryBranch !== 'All') {
            setSelectedBranch(primaryBranch as "GN" | "RS");
          }
          setIsAuthenticated(true);
          setAuthLoading(false);
          return;
        }

        // 2. Check parent_user_profiles
        const { data: parentProfile } = await supabase
          .from('parent_user_profiles')
          .select('*, parents_guardians(*), family_accounts(*)')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        if (parentProfile && isMounted) {
          const mappedParent = {
            id: parentProfile.id,
            name: parentProfile.primary_contact || parentProfile.parents_guardians?.full_name || 'Parent User',
            email: parentProfile.email || authUser.email,
            role: 'Parent',
            branch: 'RS',
            status: parentProfile.portal_status || 'Active',
            primaryBranch: 'RS',
            additionalBranches: ['RS'],
            phone: parentProfile.phone,
            accessCount: 1
          };

          setSystemUsers(prev => {
            const idx = prev.findIndex(u => u.email?.toLowerCase() === mappedParent.email?.toLowerCase() || u.id === mappedParent.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...mappedParent };
              return copy;
            }
            return [mappedParent, ...prev];
          });

          setCurrentUserId(parentProfile.id);
          setCurrentSimulatedRole('Parent');
          setSelectedBranch('RS');
          setIsAuthenticated(true);
          setAuthLoading(false);
          return;
        }

        // 3. Fallback for Super Admin or local account
        if (isMounted) {
          const localMatch = systemUsers.find(u => u.email?.toLowerCase() === authUser.email?.toLowerCase());
          if (localMatch) {
            setCurrentUserId(localMatch.id);
            setCurrentSimulatedRole(localMatch.role);
            setIsAuthenticated(true);
          } else if (authUser.email === 'usamah.m.qamar@gmail.com') {
            setCurrentUserId('usr-admin');
            setCurrentSimulatedRole('Super Administrator');
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(true);
          }
          setAuthLoading(false);
        }
      } catch (e) {
        console.error('Session profile resolution error:', e);
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    // Initial session lookup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        resolveUserProfile(session.user);
      } else {
        if (isMounted) {
          setAuthLoading(false);
          setIsAuthenticated(false);
        }
      }
    });

    // Auth subscription listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthLoading(false);
        }
      } else if (session?.user) {
        await resolveUserProfile(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAuthenticated(false);
    setCurrentUserId('usr-admin');
    addAuditLog('IAM Session', 'LOGOUT', 'User signed out from Supabase Auth session.', 'INFO');
  };

  const [userPrefs, setUserPrefs] = useState<UserPreferences>(() => {
    const activeId = localStorage.getItem('sams_current_user_id') || 'usr-admin';
    const saved = localStorage.getItem(`sams_user_prefs_${activeId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Deep fallback
    const fallbackList: Record<string, any> = {
      'usr-admin': { theme: 'light', defaultLandingPage: 'operations', favourites: ['dashboard_exec'], quickShortcuts: ['dashboard_exec', 'ops_dashboard'], notifications: { emailAlerts: true, smsAlerts: true, systemSound: true, frequency: 'realtime' } },
      'usr-1': { theme: 'light', defaultLandingPage: 'overview', favourites: ['dashboard_exec'], quickShortcuts: ['dashboard_exec'], notifications: { emailAlerts: true, smsAlerts: false, systemSound: true, frequency: 'daily' } },
      'usr-2': { theme: 'light', defaultLandingPage: 'overview', favourites: ['dashboard_branch'], quickShortcuts: ['dashboard_branch'], notifications: { emailAlerts: true, smsAlerts: false, systemSound: true, frequency: 'realtime' } },
      'usr-principal': { theme: 'light', defaultLandingPage: 'overview', favourites: ['dashboard_academic'], quickShortcuts: ['dashboard_academic'], notifications: { emailAlerts: true, smsAlerts: false, systemSound: true, frequency: 'realtime' } },
      'usr-3': { theme: 'light', defaultLandingPage: 'students', favourites: ['dashboard_financial'], quickShortcuts: ['dashboard_financial'], notifications: { emailAlerts: true, smsAlerts: true, systemSound: true, frequency: 'realtime' } },
      'usr-4': { theme: 'light', defaultLandingPage: 'inventory', favourites: ['dashboard_inventory'], quickShortcuts: ['dashboard_inventory'], notifications: { emailAlerts: true, smsAlerts: false, systemSound: true, frequency: 'daily' } },
      'usr-5': { theme: 'light', defaultLandingPage: 'teachers', favourites: ['results_entry'], quickShortcuts: ['results_entry'], notifications: { emailAlerts: true, smsAlerts: false, systemSound: false, frequency: 'weekly' } },
      'usr-6': { theme: 'light', defaultLandingPage: 'parent', favourites: ['students_profile'], quickShortcuts: ['students_profile'], notifications: { emailAlerts: true, smsAlerts: true, systemSound: true, frequency: 'realtime' } }
    };
    return fallbackList[activeId] || fallbackList['usr-admin'];
  });

  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState<boolean>(false);

  // Sync user preferences whenever user switches
  useEffect(() => {
    localStorage.setItem('sams_current_user_id', currentUserId);
    const saved = localStorage.getItem(`sams_user_prefs_${currentUserId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserPrefs(parsed);
        if (parsed.theme) {
          setTheme(parsed.theme);
        }
        if (parsed.favourites) {
          setFavourites(parsed.favourites);
        }
        return;
      } catch (e) {}
    }
    // Fallback if none saved
    const def = DEFAULT_PREFS_BY_USER[currentUserId] || {
      theme: 'light',
      defaultLandingPage: 'overview',
      favourites: [],
      quickShortcuts: [],
      notifications: { emailAlerts: true, smsAlerts: false, systemSound: true, frequency: 'realtime' }
    };
    setUserPrefs(def as any);
    if (def.theme) {
      setTheme(def.theme);
    }
    if (def.favourites) {
      setFavourites(def.favourites);
    }
  }, [currentUserId, DEFAULT_PREFS_BY_USER]);

  // Update preferences helper
  const handleUpdatePrefs = (updated: Partial<UserPreferences>) => {
    setUserPrefs((prev: any) => {
      const next = { ...prev, ...updated };
      localStorage.setItem(`sams_user_prefs_${currentUserId}`, JSON.stringify(next));
      
      if (updated.theme) {
        setTheme(updated.theme);
      }
      if (updated.favourites) {
        setFavourites(updated.favourites);
      }
      return next;
    });
  };

  // Switch simulated account
  const handleSwitchUser = (userId: string) => {
    const user = systemUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      setCurrentSimulatedRole(user.role);
      addAuditLog('System Admin', 'SIMULATION', `Switched active user session to ${user.name} (${user.role}).`, 'SUCCESS');
      
      // Load target landing page
      const saved = localStorage.getItem(`sams_user_prefs_${userId}`);
      let landing = 'overview';
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.defaultLandingPage) {
            landing = parsed.defaultLandingPage;
          }
        } catch (e) {}
      } else {
        const def = DEFAULT_PREFS_BY_USER[userId];
        if (def && def.defaultLandingPage) {
          landing = def.defaultLandingPage;
        }
      }
      
      if (!isTabRestricted(landing, user.role)) {
        setActiveTab(landing as any);
      } else {
        if (user.role === 'Parent') {
          setActiveTab('parent');
        } else if (user.role === 'Teacher') {
          setActiveTab('teachers');
        } else if (user.role === 'Accountant') {
          setActiveTab('students');
        } else if (user.role === 'Store Manager') {
          setActiveTab('inventory');
        } else {
          setActiveTab('overview');
        }
      }
    }
  };

  // Active User compute
  const currentActiveUser = useMemo(() => {
    return systemUsers.find(u => u.id === currentUserId) || systemUsers[0];
  }, [currentUserId, systemUsers]);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'Teacher',
    branch: 'GN',
    status: 'Active',
    phone: ''
  });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);

  const [securityLockdownMode, setSecurityLockdownMode] = useState<boolean>(() => {
    return localStorage.getItem('sams_lockdown_mode') === 'true';
  });

  const [securityAuditLogs, setSecurityAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('sams_security_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), user: 'Super Admin', category: 'SYSTEM', message: 'SAMS enterprise instance loaded successfully on port 3000.', status: 'SUCCESS' },
      { id: 'log-2', timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(), user: 'Super Admin', category: 'DATABASE', message: 'Local multi-tenant database state initialized and validated against local schema.', status: 'SUCCESS' },
      { id: 'log-3', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), user: 'Super Admin', category: 'IAM', message: 'Role-Based Access Control (RBAC) permission vectors synchronized.', status: 'INFO' },
      { id: 'log-4', timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), user: 'Super Admin', category: 'SECURITY', message: 'System integrity audit: 128-bit key verified.', status: 'INFO' }
    ];
  });

  const addAuditLog = (user: string, category: string, message: string, status: 'SUCCESS' | 'INFO' | 'WARNING' | 'CRITICAL') => {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user,
      category,
      message,
      status
    };
    setSecurityAuditLogs(prev => [newLog, ...prev].slice(0, 500));
  };

  useEffect(() => {
    localStorage.setItem('sams_lockdown_mode', String(securityLockdownMode));
  }, [securityLockdownMode]);

  useEffect(() => {
    localStorage.setItem('sams_security_audit_logs', JSON.stringify(securityAuditLogs));
  }, [securityAuditLogs]);

   useEffect(() => {
    localStorage.setItem('sams_simulated_role', currentSimulatedRole);
  }, [currentSimulatedRole]);

  useEffect(() => {
    localStorage.setItem('sams_system_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('sams_role_permissions');
    const defaultPermissions = {
      'Super Administrator': ['operations', 'overview', 'students', 'teachers', 'payroll', 'classes', 'grades', 'scheduler', 'assistant', 'parent', 'admission', 'security', 'consolidation', 'calendar', 'health', 'financial_settings', 'attendance_desk', 'school_setup', 'inventory', 'analytics_reports'],
      'Super Admin': ['operations', 'overview', 'students', 'teachers', 'payroll', 'classes', 'grades', 'scheduler', 'assistant', 'parent', 'admission', 'security', 'consolidation', 'calendar', 'health', 'financial_settings', 'attendance_desk', 'school_setup', 'inventory', 'analytics_reports'],
      'Proprietor': ['operations', 'overview', 'students', 'teachers', 'payroll', 'classes', 'grades', 'scheduler', 'assistant', 'parent', 'admission', 'security', 'consolidation', 'calendar', 'health', 'financial_settings', 'attendance_desk', 'school_setup', 'inventory', 'analytics_reports'],
      'Branch Administrator': ['operations', 'overview', 'students', 'teachers', 'payroll', 'classes', 'grades', 'scheduler', 'assistant', 'parent', 'admission', 'security', 'consolidation', 'calendar', 'health', 'financial_settings', 'attendance_desk', 'school_setup', 'inventory', 'analytics_reports'],
      'Branch Admin': ['operations', 'overview', 'students', 'teachers', 'payroll', 'classes', 'grades', 'scheduler', 'assistant', 'parent', 'admission', 'security', 'consolidation', 'calendar', 'health', 'financial_settings', 'attendance_desk', 'school_setup', 'inventory', 'analytics_reports'],
      'Principal': ['overview', 'students', 'admission', 'teachers', 'classes', 'scheduler', 'attendance_desk', 'grades', 'calendar', 'operations', 'analytics_reports', 'parent', 'health'],
      'Accountant': ['overview', 'students', 'teachers', 'financial_settings', 'consolidation', 'health', 'analytics_reports', 'parent', 'payroll'],
      'Teacher': ['overview', 'students', 'classes', 'scheduler', 'attendance_desk', 'grades', 'calendar', 'operations', 'analytics_reports', 'parent'],
      'Store Manager': ['overview', 'inventory', 'operations', 'analytics_reports'],
      'Parent': ['overview', 'students', 'attendance_desk', 'grades', 'calendar', 'parent']
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure new roles are populated in the loaded config
        const rolesToEnsure = ['Super Administrator', 'Proprietor', 'Branch Administrator', 'Principal', 'Accountant', 'Teacher', 'Store Manager', 'Parent'];
        rolesToEnsure.forEach(r => {
          if (!parsed[r]) {
            parsed[r] = (defaultPermissions as any)[r];
          }
        });
        return parsed;
      } catch (e) {}
    }
    return defaultPermissions;
  });

  useEffect(() => {
    localStorage.setItem('sams_role_permissions', JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  const [hrSubTab, setHrSubTab] = useState<'personnel' | 'employeeAccounts' | 'payrollRegister' | 'security' | 'financialAdjustments'>('personnel');
  const [securitySubTab, setSecuritySubTab] = useState<'users' | 'employeeAccounts' | 'permissions' | 'audit' | 'settings'>('users');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState('All');
  const [auditStatus, setAuditStatus] = useState('All');

  // Lifted financial adjustments state
  const [loans, setLoans] = useState<{
    [teacherId: string]: {
      id: string;
      totalAmount: number;
      installments: number;
      startMonth: string;
    }[]
  }>(() => {
    const saved = localStorage.getItem('sams_payroll_loans');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      "T-001": [
        { id: "loan-1", totalAmount: 3000, installments: 6, startMonth: "June 2026" }
      ],
      "T-003": [
        { id: "loan-2", totalAmount: 1500, installments: 3, startMonth: "June 2026" }
      ]
    };
  });

  const [advanceSalaries, setAdvanceSalaries] = useState<{
    [teacherId_month: string]: number;
  }>(() => {
    const saved = localStorage.getItem('sams_payroll_advances');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      "T-002_June 2026": 400,
      "T-005_June 2026": 200
    };
  });

  const [bonuses, setBonuses] = useState<{
    [teacherId_month: string]: number;
  }>(() => {
    const saved = localStorage.getItem('sams_payroll_bonuses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      "T-001_June 2026": 500,
      "T-004_June 2026": 350
    };
  });

  useEffect(() => {
    localStorage.setItem('sams_payroll_loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('sams_payroll_advances', JSON.stringify(advanceSalaries));
  }, [advanceSalaries]);

  useEffect(() => {
    localStorage.setItem('sams_payroll_bonuses', JSON.stringify(bonuses));
  }, [bonuses]);

  const isTabRestricted = (tab: string, role: string): boolean => {
    const isSuper = role === 'Super Administrator' || role === 'Super Admin' || role === 'Proprietor';
    const isBranchAdmin = role === 'Branch Administrator' || role === 'Branch Admin';

    if (tab === 'security') {
      return !isSuper && !isBranchAdmin;
    }
    if (tab === 'operations') return false;
    if (securityLockdownMode && !isSuper) {
      // SAMS Lockdown Mode limits all other access to overview for non-Super Admin
      return tab !== 'overview';
    }
    if (tab === 'school_setup') {
      return !isSuper && !isBranchAdmin;
    }
    // Fail-safe override: Super Admin and Proprietor have access to all functionality and modules
    if (isSuper) {
      return false;
    }
    const normalizedRole = role === 'Super Admin' ? 'Super Administrator' : (role === 'Branch Admin' ? 'Branch Administrator' : role);
    const allowed = rolePermissions[normalizedRole] || rolePermissions[role] || [];
    return !allowed.includes(tab);
  };

  const handleActivateSaaSSchool = (sch: SaasSchoolConfig) => {
    localStorage.setItem('sams_active_saas_school_id', sch.id);
    setActiveSaaSSchool(sch);
    if (sch.branches && sch.branches.length > 0) {
      setSelectedBranch(sch.branches[0].code as "GN" | "RS");
    }
  };

  const handleSeedSaaSDemoData = async (sch: SaasSchoolConfig) => {
    // 1. Prepare classes list from school setup
    const newClasses: ClassRecord[] = sch.classes.map((clsName, idx) => ({
      id: `cls-${sch.shortCode.toLowerCase()}-${idx}`,
      name: clsName,
      branch: sch.branches[0]?.code || 'GN',
      level: (clsName.toLowerCase().includes('nursery') ? 'nursery' : clsName.toLowerCase().includes('secondary') ? 'secondary' : 'primary') as any,
      subjects: sch.subjects.map(s => s.name)
    }));

    // 2. Prepare teachers list from school setup
    const newTeachers: Teacher[] = sch.staff.map((st, idx) => ({
      id: `tch-${sch.shortCode.toLowerCase()}-${idx}`,
      name: st.name,
      email: st.email,
      phone: "+234 803 000 0000",
      level: ['primary', 'secondary'] as any,
      subjects: sch.subjects.filter(s => s.level === 'primary' || s.level === 'secondary').map(s => s.name),
      classesAssigned: sch.classes.slice(0, 3),
      joiningDate: "2024-09-01",
      qualification: "B.Ed. Education",
      status: "Active",
      address: "Sokoto, Nigeria",
      branch: (sch.branches.find(b => b.id === st.branchId)?.code || 'GN') as any,
      role: st.role === 'Teacher' ? 'teaching' : 'management',
      accessControl: st.role === 'Super Admin' ? 'Admin' : 'Staff/Teacher'
    }));

    // 3. Prepare students list
    const firstNames = ["Aliyu", "Balkisu", "Chidi", "Danjuma", "Emeka", "Fatima", "Garba", "Hassan", "Ibrahim", "Jamila", "Khadijah", "Lawan", "Musa", "Nura", "Oluwaseun", "Sani", "Umar", "Yusuf", "Zainab"];
    const lastNames = ["Abubakar", "Bello", "Chukwu", "Dogo", "Eze", "Gwandu", "Hashim", "Idris", "Junaid", "Kano", "Ladan", "Musa", "Nuhu", "Okonkwo", "Sokoto", "Tambuwal", "Usman", "Yari", "Zaki"];

    const newStudents: Student[] = [];
    let stdCounter = 1;

    // For each class and branch, let's make 2 students
    sch.branches.forEach(br => {
      sch.classes.forEach(cls => {
        for (let i = 0; i < 2; i++) {
          const fn = firstNames[(stdCounter * 7) % firstNames.length];
          const ln = lastNames[(stdCounter * 11) % lastNames.length];
          const name = `${fn} ${ln}`;
          const isNursery = cls.toLowerCase().includes('nursery');
          const isSecondary = cls.toLowerCase().includes('secondary');
          const level = isNursery ? 'nursery' : isSecondary ? 'secondary' : 'primary';

          // custom subject grades
          const studentGrades: Record<string, number> = {};
          sch.subjects.forEach(sub => {
            studentGrades[sub.name] = 50 + Math.floor(Math.random() * 45); // scores 50-95
          });

          newStudents.push({
            id: `std-${sch.shortCode.toLowerCase()}-${stdCounter}`,
            name,
            level,
            grade: cls,
            classSection: "A",
            parentName: `${ln} Senior`,
            parentEmail: `parent.${ln.toLowerCase()}@example.com`,
            parentPhone: `+234 803 555 ${1000 + stdCounter}`,
            attendancePercentage: 85 + Math.floor(Math.random() * 15),
            behaviorRating: 'Excellent',
            milestones: {
              "Class Participation": "Mastered",
              "Homework Completion": "Mastered",
              "Cognitive Skills": "Mastered"
            },
            grades: studentGrades,
            reportComment: `${fn} is an outstanding student who shows exceptional progress in all evaluated topics. Always eager to participate and demonstrates great leadership potential.`,
            admissionDate: "2025-09-10",
            enrollmentNo: `${sch.shortCode}-ADM-2025-${stdCounter.toString().padStart(4, '0')}`,
            admissionStatus: "Active",
            branch: br.code as any,
            profile: {
              gender: Math.random() > 0.5 ? 'Female' : 'Male',
              dob: "2018-05-20",
              address: `${br.name} staff quarters, Sokoto`,
              bloodGroup: "O+"
            },
            attendanceLogs: [
              {"date": "2026-06-01", "status": "Present"},
              {"date": "2026-06-02", "status": "Present"},
              {"date": "2026-06-03", "status": "Present"},
              {"date": "2026-06-04", "status": "Present"},
              {"date": "2026-06-05", "status": "Present"}
            ],
            disciplinaryRecords: [],
            extracurriculars: ["Robotics Club", "Young Farmers Association", "Debating Society"],
            healthInfo: {
              allergies: "None reported",
              medicalConditions: "None",
              bloodGroup: "O+",
              vaccinations: "All standard pediatric immunizations up-to-date"
            }
          });
          stdCounter++;
        }
      });
    });

    // Save state
    try {
      setStudents(newStudents);
      setTeachers(newTeachers);
      setClasses(newClasses);
      
      // Seed subjects also
      const mappedSubjects: Subject[] = sch.subjects.map((s, idx) => ({
        id: `sub-${sch.shortCode.toLowerCase()}-${idx}`,
        name: s.name,
        level: s.level as any,
        requirement: s.isCompulsory ? 'compulsory' : 'optional'
      }));
      setSubjects(mappedSubjects);

      alert(`‚ö° SUCCESS!\n\nSuccessfully seeded ${newStudents.length} Students, ${newTeachers.length} Staff, ${newClasses.length} Class records, and ${mappedSubjects.length} Curriculum subjects custom-tailored for "${sch.name}".\n\nAll interfaces are now fully populated with active demo data!`);
    } catch(err) {
      console.error(err);
      alert("Failed to seed database. Using in-memory state fallback.");
    }
  };

  const getSaaSSchoolColorBg = (c: SaasSchoolConfig['brandColor']) => {
    switch(c) {
      case 'indigo': return 'bg-indigo-600';
      case 'teal': return 'bg-teal-600';
      case 'emerald': return 'bg-emerald-600';
      case 'rose': return 'bg-rose-600';
      case 'amber': return 'bg-amber-600';
      case 'purple': return 'bg-purple-600';
      case 'sky': return 'bg-sky-600';
      default: return 'bg-indigo-600';
    }
  };

  const getSaaSSchoolColorText = (c: SaasSchoolConfig['brandColor']) => {
    switch(c) {
      case 'indigo': return 'text-indigo-600';
      case 'teal': return 'text-teal-600';
      case 'emerald': return 'text-emerald-600';
      case 'rose': return 'text-rose-600';
      case 'amber': return 'text-amber-600';
      case 'purple': return 'text-purple-600';
      case 'sky': return 'text-sky-600';
      default: return 'text-indigo-600';
    }
  };

  const getSaaSSchoolColorBorder = (c: SaasSchoolConfig['brandColor']) => {
    switch(c) {
      case 'indigo': return 'border-indigo-600';
      case 'teal': return 'border-teal-600';
      case 'emerald': return 'border-emerald-600';
      case 'rose': return 'border-rose-600';
      case 'amber': return 'border-amber-600';
      case 'purple': return 'border-purple-600';
      case 'sky': return 'border-sky-600';
      default: return 'border-indigo-600';
    }
  };

  const getSaaSSchoolColorPill = (c: SaasSchoolConfig['brandColor']) => {
    switch(c) {
      case 'indigo': return 'bg-indigo-50 border-indigo-100 text-indigo-700';
      case 'teal': return 'bg-teal-50 border-teal-100 text-teal-700';
      case 'emerald': return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      case 'rose': return 'bg-rose-50 border-rose-100 text-rose-700';
      case 'amber': return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'purple': return 'bg-purple-50 border-purple-100 text-purple-700';
      case 'sky': return 'bg-sky-50 border-sky-100 text-sky-700';
      default: return 'bg-indigo-50 border-indigo-100 text-indigo-700';
    }
  };

  const renderSaaSSchoolLogo = (logoType: SaasSchoolConfig['logoType'], shortCode: string) => {
    switch(logoType) {
      case 'shield': return <ShieldCheck className="w-6 h-6" />;
      case 'star': return <Star className="w-6 h-6" />;
      case 'book': return <BookOpen className="w-6 h-6" />;
      case 'globe': return <Globe className="w-6 h-6" />;
      case 'cap': return <Award className="w-6 h-6" />;
      case 'lamp': return <Flame className="w-6 h-6" />;
      case 'initials': return <span className="font-mono text-sm font-extrabold uppercase">{shortCode}</span>;
      default: return <School className="w-6 h-6" />;
    }
  };

  // Daily Attendance Desk States
  const [attendanceBranch, setAttendanceBranch] = useState<string>(selectedBranch);
  
  // Sync attendance branch when global branch changes
  useEffect(() => {
    setAttendanceBranch(selectedBranch);
  }, [selectedBranch]);

  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  
  const [attendanceGrade, setAttendanceGrade] = useState<string>('Primary 1');
  const [attendanceSection, setAttendanceSection] = useState<string>('A');
  const [attendanceCutoffTime, setAttendanceCutoffTime] = useState<string>('10:00');
  
  const [attendanceLatePermissions, setAttendanceLatePermissions] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sams_attendance_late_permissions');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('sams_attendance_late_permissions', JSON.stringify(attendanceLatePermissions));
  }, [attendanceLatePermissions]);

  const [attendanceDelayFlags, setAttendanceDelayFlags] = useState<any[]>(() => {
    const saved = localStorage.getItem('sams_attendance_delay_flags');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sams_attendance_delay_flags', JSON.stringify(attendanceDelayFlags));
  }, [attendanceDelayFlags]);

  const [attendanceStates, setAttendanceStates] = useState<Record<string, 'Present' | 'Absent' | 'Sick' | 'Left'>>({});
  const [attendanceReasons, setAttendanceReasons] = useState<Record<string, string>>({});

  // Educational Assistant states
  const [aiInput, setAiInput] = useState<string>('');
  const [assistantLogs, setAssistantLogs] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    { role: 'model', text: "Hello! Welcome to the Central ERP Educational Intelligence hub. I can help you draft continuous assessment worksheets, structure nursery milestone trackers, draft term schedule frameworks, or respond directly to parent emails. Try one of the quick suggestions below or formulate your custom academic request." }
  ]);
  const [submittingAssistant, setSubmittingAssistant] = useState<boolean>(false);

  // Schedule Calendar Academic Session states
  const [academicSessions, setAcademicSessions] = useState<any[]>(() => (DEFAULT_ACADEMIC_DB as any).academicSessions || []);
  const [terms, setTerms] = useState<any[]>(() => (DEFAULT_ACADEMIC_DB as any).terms || []);
  const [holidays, setHolidays] = useState<any[]>(() => (DEFAULT_ACADEMIC_DB as any).holidays || []);
  const [eventCategories, setEventCategories] = useState<any[]>(() => (DEFAULT_ACADEMIC_DB as any).eventCategories || []);
  const [events, setEvents] = useState<any[]>(() => (DEFAULT_ACADEMIC_DB as any).events || []);

  // Load All database sets from JSON REST API on init
  useEffect(() => {
    fetchDatabase();
    checkSystemStatus();

    // Background keepalive re-sync every 30 seconds
    const interval = setInterval(() => {
      fetchDatabase(0, true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDatabase = async (retryCount = 0, isBackground = false) => {
    try {
      if (!isBackground) {
        setLoadingDb(true);
      }

      // 1. Check genuine browser offline state
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setDbError("Offline: No internet connectivity detected. Serving local cached records.");
        setLoadingDb(false);
        return;
      }

      let directSuccess = false;

      // 2. Direct Supabase Client Connection & Query
      try {
        const { data: supaStudents, error: supaStudentError } = await supabase
          .from('students')
          .select(`
            *,
            branches:branch_id (id, branch_name, branch_code),
            student_extended_profiles (*),
            student_enrollment_history (
              id, branch_id, session_id, term_id, class_id, section_id, enrollment_date, status,
              classes:class_id (id, name, grade_level),
              sections:section_id (id, name, section_code),
              academic_sessions:session_id (session_name)
            ),
            family_accounts:family_id (id, family_code, family_name, primary_phone, primary_email),
            student_guardians (
              id, relationship_type, is_primary_contact, is_emergency_contact,
              parents_guardians:guardian_id (id, full_name, phone, email, relationship)
            )
          `);

        // If direct query succeeded without network/RLS errors
        if (!supaStudentError && Array.isArray(supaStudents)) {
          directSuccess = true;
          setDbError(null);

          const mappedStudents: Student[] = supaStudents.map((s: any) => {
            const enrollment = s.student_enrollment_history?.[0];
            const gradeLevel = enrollment?.classes?.grade_level || enrollment?.classes?.name || 'Primary 1';
            let level: 'nursery' | 'primary' | 'secondary' | 'islamia' = 'primary';
            const glLower = gradeLevel.toLowerCase();
            if (glLower.includes('nursery') || glLower.includes('early') || glLower.includes('reception') || glLower.includes('creche')) {
              level = 'nursery';
            } else if (glLower.includes('jss') || glLower.includes('sss') || glLower.includes('secondary') || glLower.includes('high')) {
              level = 'secondary';
            } else if (glLower.includes('islamia') || glLower.includes('tahfeez')) {
              level = 'islamia';
            }

            const primaryGuardian = s.student_guardians?.find((g: any) => g.is_primary_contact)?.parents_guardians 
              || s.student_guardians?.[0]?.parents_guardians;

            const extProfile = s.student_extended_profiles;

            return {
              id: s.id,
              name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student Record',
              level: level,
              grade: gradeLevel,
              classSection: enrollment?.sections?.section_code || enrollment?.sections?.name || 'A',
              parentName: primaryGuardian?.full_name || s.family_accounts?.family_name || 'Guardian',
              parentEmail: primaryGuardian?.email || s.family_accounts?.primary_email || s.email || '',
              parentPhone: primaryGuardian?.phone || s.family_accounts?.primary_phone || s.phone || '',
              attendancePercentage: 98,
              behaviorRating: 'Excellent',
              milestones: {},
              grades: {},
              admissionDate: s.admission_date,
              enrollmentNo: s.admission_number || `SAMS-${s.id.slice(0, 5)}`,
              admissionStatus: s.status || 'Active',
              branch: (s.branches?.branch_code as 'GN' | 'RS') || 'GN',
              profile: {
                gender: (s.gender === 'Male' ? 'Male' : 'Female'),
                dob: s.date_of_birth || '',
                address: s.address || '',
                bloodGroup: extProfile?.blood_group || 'O+'
              },
              academicProgression: [],
              homework: [],
              notices: []
            };
          });

          if (mappedStudents.length > 0) {
            setStudents(mappedStudents);
            setReportStudent((prev: any) => prev || mappedStudents[0]);
          }

          // Fetch other core tables directly in parallel from Supabase
          const [branchesRes, employeesRes, classesRes, sessionsRes, termsRes, eventsRes] = await Promise.allSettled([
            supabase.from('branches').select('id, branch_name, branch_code'),
            supabase.from('employees').select(`
              *,
              branches:branch_id (id, branch_name, branch_code),
              teacher_subject_assignments (
                id, class_id, section_id, subject_id, periods_per_week,
                classes:class_id (id, name, grade_level),
                subjects:subject_id (id, subject_name, subject_code)
              )
            `),
            supabase.from('classes').select('*, branches:branch_id (id, branch_name, branch_code)'),
            supabase.from('academic_sessions').select('*'),
            supabase.from('terms').select('*'),
            supabase.from('events').select('*')
          ]);

          if (branchesRes.status === 'fulfilled' && !branchesRes.value.error && Array.isArray(branchesRes.value.data) && branchesRes.value.data.length > 0) {
            setAvailableBranches(branchesRes.value.data);
          }
          if (employeesRes.status === 'fulfilled' && !employeesRes.value.error && Array.isArray(employeesRes.value.data) && employeesRes.value.data.length > 0) {
            const mappedTeachers = employeesRes.value.data.map((emp: any, idx: number) => {
              const branch = (emp.branches?.branch_code as 'GN' | 'RS') || (idx % 2 === 0 ? 'RS' : 'GN');
              return {
                id: emp.id,
                employeeId: emp.employee_id,
                name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                email: emp.email,
                phone: emp.phone,
                level: ['primary'],
                subjects: emp.teacher_subject_assignments?.map((a: any) => a.subjects?.subject_name).filter(Boolean) || ['General Studies'],
                classesAssigned: emp.teacher_subject_assignments?.map((a: any) => a.classes?.name).filter(Boolean) || [],
                qualification: emp.qualification || 'B.Ed',
                status: emp.employment_status || 'Active',
                employmentStatus: emp.employment_status || 'Active',
                department: emp.department || 'Academic Faculty',
                position: emp.position || 'Class Teacher',
                address: emp.address || '',
                branch: branch,
                role: (emp.position || '').toLowerCase().includes('admin') ? 'management' : 'teaching',
                salary: 150000,
                joiningDate: emp.employment_date || '2022-09-01',
                branchHistory: []
              };
            });
            setTeachers(mappedTeachers);
          }
          if (classesRes.status === 'fulfilled' && !classesRes.value.error && Array.isArray(classesRes.value.data) && classesRes.value.data.length > 0) {
            const mappedClasses = classesRes.value.data.map((c: any) => ({
              id: c.id,
              name: c.name,
              level: (c.grade_level?.toLowerCase().includes('nursery') ? 'nursery' :
                      c.grade_level?.toLowerCase().includes('secondary') ? 'secondary' :
                      c.grade_level?.toLowerCase().includes('islamia') ? 'islamia' : 'primary') as any,
              grade: c.grade_level || c.name,
              capacity: c.capacity || 30,
              enrolledCount: 0,
              room: c.room_number || 'Room 101',
              branch: (c.branches?.branch_code as 'GN' | 'RS') || 'GN',
              classTeacherId: c.class_teacher_id || 'tch-1'
            }));
            setClasses(mappedClasses);
          }
          if (sessionsRes.status === 'fulfilled' && !sessionsRes.value.error && Array.isArray(sessionsRes.value.data) && sessionsRes.value.data.length > 0) {
            setAcademicSessions(sessionsRes.value.data);
          }
          if (termsRes.status === 'fulfilled' && !termsRes.value.error && Array.isArray(termsRes.value.data) && termsRes.value.data.length > 0) {
            setTerms(termsRes.value.data);
          }
          if (eventsRes.status === 'fulfilled' && !eventsRes.value.error && Array.isArray(eventsRes.value.data) && eventsRes.value.data.length > 0) {
            setEvents(eventsRes.value.data);
          }
        }
      } catch (supaErr) {
        console.warn("Direct Supabase query notice:", supaErr);
      }

      // 3. Fallback to API endpoints only if Direct Supabase connection did not succeed
      if (!directSuccess) {
        let restSuccess = false;
        try {
          const unifiedRes = await fetch('/api/all_academic_data');
          if (unifiedRes.ok) {
            const contentType = unifiedRes.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await unifiedRes.json();
              if (data && typeof data === 'object') {
                if (Array.isArray(data.students) && data.students.length > 0) setStudents(data.students);
                if (Array.isArray(data.teachers) && data.teachers.length > 0) setTeachers(data.teachers);
                if (Array.isArray(data.classes) && data.classes.length > 0) setClasses(data.classes);
                if (Array.isArray(data.schedules)) setSchedules(data.schedules);
                if (Array.isArray(data.curriculums)) setCurriculums(data.curriculums);
                if (Array.isArray(data.exams)) setExams(data.exams);
                if (Array.isArray(data.gradeScales)) setGradeScales(data.gradeScales);
                if (Array.isArray(data.admissions)) setAdmissions(data.admissions);
                if (Array.isArray(data.subjects)) setSubjects(data.subjects);
                if (Array.isArray(data.academicSessions)) setAcademicSessions(data.academicSessions);
                if (Array.isArray(data.terms)) setTerms(data.terms);
                if (Array.isArray(data.holidays)) setHolidays(data.holidays);
                if (Array.isArray(data.eventCategories)) setEventCategories(data.eventCategories);
                if (Array.isArray(data.events)) setEvents(data.events);
                if (Array.isArray(data.feeTemplates)) setFeeTemplates(data.feeTemplates);

                if (Array.isArray(data.students) && data.students.length > 0) {
                  setReportStudent((prev: any) => prev || data.students[0]);
                }
                setDbError(null);
                restSuccess = true;
              }
            }
          }
        } catch (fastErr) {
          console.warn("REST API fallback notice:", fastErr);
        }

        if (!restSuccess) {
          // Individual endpoints fallback with Promise.allSettled
          const fetchJsonSafe = async (url: string) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) throw new Error(`Non-JSON response on ${url}`);
            return res.json();
          };

          try {
            const results = await Promise.allSettled([
              fetchJsonSafe('/api/students'),
              fetchJsonSafe('/api/teachers'),
              fetchJsonSafe('/api/classes'),
              fetchJsonSafe('/api/schedules'),
              fetchJsonSafe('/api/curriculums'),
              fetchJsonSafe('/api/exams'),
              fetchJsonSafe('/api/grade-scales'),
              fetchJsonSafe('/api/admissions'),
              fetchJsonSafe('/api/subjects'),
              fetchJsonSafe('/api/academic-sessions'),
              fetchJsonSafe('/api/terms'),
              fetchJsonSafe('/api/holidays'),
              fetchJsonSafe('/api/event-categories'),
              fetchJsonSafe('/api/events'),
              fetchJsonSafe('/api/fee_templates')
            ]);

            let successCount = 0;
            const getVal = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' ? r.value : null);

            const r0 = getVal(results[0]); if (r0 && Array.isArray(r0) && r0.length > 0) { setStudents(r0); successCount++; setReportStudent((p: any) => p || r0[0]); }
            const r1 = getVal(results[1]); if (r1 && Array.isArray(r1) && r1.length > 0) { setTeachers(r1); successCount++; }
            const r2 = getVal(results[2]); if (r2 && Array.isArray(r2) && r2.length > 0) { setClasses(r2); successCount++; }
            const r3 = getVal(results[3]); if (r3) { setSchedules(r3); successCount++; }
            const r4 = getVal(results[4]); if (r4) { setCurriculums(r4); successCount++; }
            const r5 = getVal(results[5]); if (r5) { setExams(r5); successCount++; }
            const r6 = getVal(results[6]); if (r6) { setGradeScales(r6); successCount++; }
            const r7 = getVal(results[7]); if (r7) { setAdmissions(r7); successCount++; }
            const r8 = getVal(results[8]); if (r8) { setSubjects(r8); successCount++; }
            const r9 = getVal(results[9]); if (r9) { setAcademicSessions(r9); successCount++; }
            const r10 = getVal(results[10]); if (r10) { setTerms(r10); successCount++; }
            const r11 = getVal(results[11]); if (r11) { setHolidays(r11); successCount++; }
            const r12 = getVal(results[12]); if (r12) { setEventCategories(r12); successCount++; }
            const r13 = getVal(results[13]); if (r13) { setEvents(r13); successCount++; }
            const r14 = getVal(results[14]); if (r14) { setFeeTemplates(r14); successCount++; }

            if (successCount > 0) {
              setDbError(null);
            } else {
              if (retryCount < 2) {
                setTimeout(() => fetchDatabase(retryCount + 1, isBackground), 1500);
                return;
              }
              setDbError("Operating in local offline cache mode.");
            }
          } catch (e) {
            if (retryCount < 2) {
              setTimeout(() => fetchDatabase(retryCount + 1, isBackground), 1500);
              return;
            }
            setDbError("Operating in local offline cache mode.");
          }
        }
      }
    } catch (err: any) {
      console.error("fetchDatabase error:", err);
      if (retryCount < 2) {
        setTimeout(() => fetchDatabase(retryCount + 1, isBackground), 1500);
        return;
      }
      setDbError(err?.message || "Academic database connection stream interrupted.");
    } finally {
      setLoadingDb(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setAiConfigured(data.geminiConfigured);
    } catch (e) {
      console.error("AI service offline status checks:", e);
    }
  };

  // Class Management Handlers
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClassName.trim(),
          level: newClassLevel,
          branch: selectedBranch,
          subjects: selectedNewClassSubjects.length > 0 ? selectedNewClassSubjects : []
        })
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(prev => [...prev, data]);
        setSelectedClass(data);
        setNewClassName('');
        setSelectedNewClassSubjects([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class? Associated students, teachers, and logs will remain but their Class assigned context will be unlinked.")) return;
    try {
      const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setClasses(prev => prev.filter(c => c.id !== id));
        if (selectedClass?.id === id) {
          setSelectedClass(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateClassSubjects = async (classId: string, updatedSubjects: string[]) => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects: updatedSubjects })
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(prev => prev.map(c => c.id === classId ? data : c));
        if (selectedClass?.id === classId) {
          setSelectedClass(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateClassDetails = async (classId: string, updatedFields: { name: string; level: 'nursery' | 'primary' | 'secondary' | 'islamia'; branch: 'GN' | 'RS' }) => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(prev => prev.map(c => c.id === classId ? data : c));
        if (selectedClass?.id === classId) {
          setSelectedClass(data);
        }
        setIsEditingClass(false);
        await fetchDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Central master subjects registry handlers
  const handleCreateSubject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubjectName.trim(),
          level: newSubjectLevel,
          requirement: newSubjectRequirement
        })
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(prev => [...prev, data]);
        setNewSubjectName('');
      } else {
        const errData = await response.json();
        alert(errData.error || "Failed to establish subject in master directory.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSubject = async (updated: Subject) => {
    try {
      const response = await fetch(`/api/subjects/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(prev => prev.map(s => s.id === updated.id ? data : s));
        await fetchDatabase();
      } else {
        const errData = await response.json();
        alert(errData.error || "Failed to update subject directory record.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this master syllabus subject? This will not remove the name from existing reports but will exclude it from future selections.")) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubjects(prev => prev.filter(s => s.id !== id));
        await fetchDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignStudentToClass = async (studentId: string, className: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: className })
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(prev => prev.map(s => s.id === studentId ? data : s));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTeacherToClass = async (teacherId: string, className: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    const currentClasses = teacher.classesAssigned || [];
    if (currentClasses.includes(className)) return;
    const updatedClasses = [...currentClasses, className];
    try {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classesAssigned: updatedClasses })
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(prev => prev.map(t => t.id === teacherId ? data : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTeacherFromClass = async (teacherId: string, className: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    const updatedClasses = (teacher.classesAssigned || []).filter((c: string) => c !== className);
    try {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classesAssigned: updatedClasses })
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(prev => prev.map(t => t.id === teacherId ? data : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // MUTATIONS / HANDLERS
  // -------------------------------------------------------------

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admissions/pre-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      if (res.ok) {
        const data = await res.json();
        setAdmissions(prev => [...prev, data]);
        setRegForm({
          name: '',
          level: 'primary',
          grade: 'Grade 3',
          parentName: '',
          parentEmail: '',
          parentPhone: '',
          branch: selectedBranch
        });
        showAdmissionsFeedback('success', `Early registration completed successfully! SAMS system generated applicant ID: ${data.id}. Please copy this code, click on Stage 2 (Parent Portal Form), and choose this candidate to continue the profiling!`);
      } else {
        const err = await res.json();
        showAdmissionsFeedback('error', err.error || "Pre-registration failed.");
      }
    } catch (err) {
      console.error(err);
      showAdmissionsFeedback('error', "Error establishing server connection for registration.");
    }
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionId) {
      showAdmissionsFeedback('error', "Please select or enter an active application code first!");
      return;
    }
    try {
      const res = await fetch('/api/admissions/parent-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedAdmissionId, ...parentForm })
      });
      if (res.ok) {
        const data = await res.json();
        setAdmissions(prev => prev.map(a => a.id === data.id ? data : a));
        showAdmissionsFeedback('success', `Online Parent Profile submitted successfully for candidate ${data.name}! The academic record is now locked and pushed to Principal Usman Sambo's Desk. Click Stage 3 to review the interview files!`);
        setSelectedAdmissionId('');
      } else {
        const err = await res.json();
        showAdmissionsFeedback('error', err.error || "Parent submission failed.");
      }
    } catch (err) {
      console.error(err);
      showAdmissionsFeedback('error', "Error submitting parent form.");
    }
  };

  const handleHTReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionId) {
      showAdmissionsFeedback('error', "Please select a candidate file to evaluate!");
      return;
    }
    try {
      const res = await fetch('/api/admissions/ht-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAdmissionId,
          htNotes: htReviewNotes,
          htEvaluation,
          htReviewedBy,
          interviewScorecard: {
            parentPunctuality,
            parentEngagement,
            studentResponsiveness,
            academicReadiness,
            totalScore: parentPunctuality + parentEngagement + studentResponsiveness + academicReadiness
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAdmissions(prev => prev.map(a => a.id === data.id ? data : a));
        showAdmissionsFeedback('success', `Principal's evaluation score for ${data.name} submitted successfully! SAMS Scorecard: ${parentPunctuality + parentEngagement + studentResponsiveness + academicReadiness}/40. This file has been forwarded to the SAMS Board Chairman Boardroom. Click Stage 4 to proceed with enrollment authorization!`);
        setSelectedAdmissionId('');
        setHtReviewNotes('');
        setParentPunctuality(8);
        setParentEngagement(8);
        setStudentResponsiveness(8);
        setAcademicReadiness(8);
      } else {
        const err = await res.json();
        showAdmissionsFeedback('error', err.error || "Evaluation review submission failed.");
      }
    } catch (err) {
      console.error(err);
      showAdmissionsFeedback('error', "Error writing interview files back to server.");
    }
  };

  const handleChairmanApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionId) {
      showAdmissionsFeedback('error', "Please select an approved file from the queue!");
      return;
    }
    try {
      const res = await fetch('/api/admissions/chairman-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAdmissionId,
          chairmanNotes,
          allocatedSection,
          feeTemplateId: selectedFeeTemplateId
        })
      });
      if (res.ok) {
        const result = await res.json();
        setAdmissions(prev => prev.map(a => a.id === result.application.id ? result.application : a));
        setStudents(prev => [...prev, result.student]);
        showAdmissionsFeedback('success', `Congratulations! SAMS Board Chairman has signed the enrollment deed! Candidate is officially admitted. SAMS Permanent Roll Number: ${result.student.enrollmentNo}. Auto-billing template and classroom space allocated in Section ${allocatedSection}.`);
        setSelectedAdmissionId('');
        setChairmanNotes('');
        setSelectedFeeTemplateId('');
      } else {
        const err = await res.json();
        showAdmissionsFeedback('error', err.error || "Chairman approval failed.");
      }
    } catch (err) {
      showAdmissionsFeedback('error', "Error committing Chairman seal.");
    }
  };

  // Save changes back to a student profile (Grades, Milestones, Comments, etc)
  const saveStudentChanges = async (updatedStudent: Student) => {
    try {
      // Optimistic local state update
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      if (selectedStudent?.id === updatedStudent.id) setSelectedStudent(updatedStudent);
      if (reportStudent?.id === updatedStudent.id) setReportStudent(updatedStudent);

      // 1. Supabase direct sync
      const names = (updatedStudent.name || '').trim().split(' ');
      const firstName = names[0] || 'Student';
      const lastName = names.slice(1).join(' ') || 'Learner';

      studentService.saveStudent({
        id: updatedStudent.id,
        first_name: firstName,
        last_name: lastName,
        gender: updatedStudent.profile?.gender || 'Female',
        date_of_birth: updatedStudent.profile?.dob || null,
        address: updatedStudent.profile?.address || null,
        status: (updatedStudent.admissionStatus as any) || 'Active',
        profile_photo_url: updatedStudent.photoUrl || null
      }, {
        blood_group: updatedStudent.healthInfo?.bloodGroup,
        medical_allergies: updatedStudent.healthInfo?.allergies,
        special_educational_needs: updatedStudent.healthInfo?.medicalConditions,
        emergency_contact_name: updatedStudent.parentName,
        emergency_contact_phone: updatedStudent.parentPhone
      }).catch(e => console.warn("Supabase student sync warning:", e));

      // 2. Server API sync
      const response = await fetch(`/api/students/${updatedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent)
      });
      if (response.ok) {
        const result = await response.json();
        setStudents(prev => prev.map(s => s.id === result.id ? result : s));
        if (selectedStudent?.id === result.id) setSelectedStudent(result);
        if (reportStudent?.id === result.id) setReportStudent(result);
      }
    } catch (e) {
      console.error("Error committing student write operations:", e);
    }
  };

  // Academic Curriculum mutations
  const handleAddCurriculum = async (grade: string, subject: string, topics: Topic[], teacherId: string) => {
    try {
      const res = await fetch('/api/curriculums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, subject, topics, teacherId, branch: selectedBranch })
      });
      if (res.ok) {
        const added = await res.json();
        setCurriculums(prev => [...prev, added]);
        return added;
      } else {
        alert("Could not save new course syllabus planning.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCurriculum = async (id: string) => {
    try {
      const res = await fetch(`/api/curriculums/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCurriculums(prev => prev.filter(c => c.id !== id));
      } else {
        alert("Syllabus deletion was aborted by the server.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCurriculum = async (updated: CurriculumPlan) => {
    try {
      const res = await fetch(`/api/curriculums/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const result = await res.json();
        setCurriculums(prev => prev.map(c => c.id === result.id ? result : c));
      } else {
        alert("Failed to update lessons objectives guidelines.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Exam mutations
  const handleAddExam = async (title: string, grade: string, subject: string, date: string, weightPercentage: number, totalMarks: number) => {
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, grade, subject, date, weightPercentage, totalMarks, branch: selectedBranch })
      });
      if (res.ok) {
        const added = await res.json();
        setExams(prev => [...prev, added]);
        return added;
      } else {
        alert("Failed to post examinations scheduling block.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExams(prev => prev.filter(e => e.id !== id));
      } else {
        alert("Failed to unschedule examinations block.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Grade Scale mutations
  const handleSaveGradeScales = async (scales: GradeScale[]) => {
    try {
      const res = await fetch('/api/grade-scales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scales })
      });
      if (res.ok) {
        const updated = await res.json();
        setGradeScales(updated);
        alert("School-wide grading scales have been committed successfully.");
      } else {
        alert("Failed to commit grading scale configurations.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add new student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name || !newStudentForm.grade) return;

    // Build initial payload
    const initialMilestones = newStudentForm.level === 'nursery' ? {
      "Fine Motor Skills (pencil grip, scissor cuts)": "Introduced",
      "Social Sharing & Interaction": "Introduced",
      "Count up to 10 & Pattern Recognition": "Introduced",
      "Expressive Communication & Vocabulary": "Introduced",
      "Listening & Task Completion": "Introduced"
    } : {};

    const initialGrades = newStudentForm.level !== 'nursery' ? {
      "Mathematics": 80,
      "Science": 80,
      "English Language": 80,
      "Social Studies": 80,
      "Creative Arts": 80
    } : {};

    const payload = {
      ...newStudentForm,
      milestones: initialMilestones,
      grades: initialGrades,
      admissionDate: new Date().toISOString().split('T')[0],
      admissionStatus: "Active",
      profile: {
        gender: "Female" as const,
        dob: "2018-05-15",
        address: selectedBranch === 'GN' ? "Gawun Nama Area, Kano Road, Sokoto" : "opp. Sambo Primary School, Runjin Sambo, Sokoto",
        bloodGroup: "O+"
      },
      attendanceLogs: [
        { date: new Date().toISOString().split('T')[0], status: "Present" }
      ],
      disciplinaryRecords: [],
      extracurriculars: ["Introductory Arts"],
      healthInfo: {
        allergies: "None",
        medicalConditions: "None",
        bloodGroup: "O+",
        vaccinations: "Routine vaccines completed"
      },
      academicProgression: [],
      homework: [
        { id: "hw-" + Math.floor(Math.random() * 1000000), subject: "General Orientation", task: "Complete school entry booklet and introduce to house captain.", dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: "Pending" as const }
      ],
      notices: [
        { id: "not-" + Math.floor(Math.random() * 1000000), date: new Date().toISOString().split('T')[0], title: "Welcome to SAMS SOKOTO ERP", content: `Your enrollment record has been securely created in our ${selectedBranch === 'GN' ? 'Gawun Nama' : 'Runjin Sambo'} campus file index.` }
      ],
      feeStatements: {
        invoices: [
          { id: "inv-" + Math.floor(Math.random() * 1000000), description: "Inaugural Term Tuition Fee", amount: 1500, paid: 0, status: "Unpaid" as const, date: new Date().toISOString().split('T')[0] }
        ],
        outstandingBalance: 1500
      },
      branch: selectedBranch
    };

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(prev => [...prev, data]);
        setShowAddStudent(false);
        // Reset form
        setNewStudentForm({
          name: '',
          level: 'primary',
          grade: 'Grade 3',
          classSection: 'A',
          parentName: '',
          parentEmail: '',
          parentPhone: '',
          behaviorRating: 'Good',
          serialNumber: '',
          sessionYear: '26',
          islamiaClassId: ''
        });
      } else {
        alert("Server failed to create student.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete student
  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to dismiss this student record? This clears all historical continuous assessments.")) return;
    try {
      const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setStudents(prev => prev.filter(s => s.id !== id));
        if (selectedStudent?.id === id) setSelectedStudent(null);
        if (reportStudent?.id === id) setReportStudent(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add new teacher / employee with branch identity and user account linkage
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherForm.name || !newTeacherForm.email) return;

    const subjects = newTeacherForm.subjectsString ? newTeacherForm.subjectsString.split(',').map(s => s.trim()) : [];
    const classesAssigned = newTeacherForm.classesString ? newTeacherForm.classesString.split(',').map(s => s.trim()) : [];
    
    const assignedBranch = selectedBranch === 'All' ? 'RS' : selectedBranch;
    const { employeeId: generatedEmpId } = generateNextEmployeeId(assignedBranch, teachers);
    const assignedUserId = newTeacherForm.userId.trim() || `usr-${Date.now().toString().slice(-4)}`;

    const initialHistory: EmployeeBranchHistory[] = [
      {
        id: `hist-${Date.now()}`,
        previousBranch: 'N/A (Initial Appointment)',
        newBranch: assignedBranch,
        transferDate: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
        transferReason: 'Initial Onboarding & Faculty Creation',
        authorizedBy: 'Engr. Usamah M. Qamar (Super Administrator)',
        timestamp: new Date().toISOString()
      }
    ];

    const newTeacherRecord: Teacher = {
      id: `tch-${Date.now()}`,
      employeeId: generatedEmpId,
      name: newTeacherForm.name.trim(),
      email: newTeacherForm.email.trim().toLowerCase(),
      phone: newTeacherForm.phone.trim(),
      level: newTeacherForm.level,
      subjects,
      classesAssigned,
      joiningDate: new Date().toISOString().split('T')[0],
      qualification: "B.Ed Certificate Degree",
      status: "Active",
      employmentStatus: 'Active',
      department: newTeacherForm.level?.includes('nursery') ? 'Early Years & Nursery' : 'Academic Faculty',
      position: newTeacherForm.role === 'management' ? 'Administrative Official' : 'Class Teacher & Subject Specialist',
      branchHistory: initialHistory,
      address: assignedBranch === 'GN' ? "Gawun Nama Area, Kano Road, Sokoto" : "opp. Sambo Primary School, Runjin Sambo, Sokoto",
      branch: assignedBranch,
      role: newTeacherForm.role,
      userId: assignedUserId,
      accessControl: newTeacherForm.accessControl,
      maxUnits: Number(newTeacherForm.maxUnits) || 20,
      performanceScore: Number(newTeacherForm.performanceScore) || 80,
      subjectAllocations: [] as StaffSubjectAllocation[]
    };

    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacherRecord)
      });

      if (response.ok) {
        const data = await response.json();
        setTeachers(prev => [...prev, { ...newTeacherRecord, ...data }]);
      } else {
        setTeachers(prev => [...prev, newTeacherRecord]);
      }
    } catch (err) {
      console.warn("Backend sync offline, persisting employee locally:", err);
      setTeachers(prev => [...prev, newTeacherRecord]);
    }

    // Auto-create/sync Linked System User Account
    const mappedRole = newTeacherForm.role === 'management' 
      ? 'Branch Administrator' 
      : newTeacherForm.accessControl === 'Admin' 
        ? 'Branch Administrator' 
        : 'Teacher';

    setSystemUsers(prev => {
      const existingIdx = prev.findIndex(u => u.email.toLowerCase() === newTeacherRecord.email.toLowerCase() || u.employeeId === generatedEmpId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          name: newTeacherRecord.name,
          employeeId: generatedEmpId,
          branch: assignedBranch,
          primaryBranch: assignedBranch,
          status: 'Active'
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: assignedUserId,
          employeeId: generatedEmpId,
          name: newTeacherRecord.name,
          email: newTeacherRecord.email,
          role: mappedRole,
          branch: assignedBranch,
          primaryBranch: assignedBranch,
          additionalBranches: [assignedBranch],
          status: 'Active',
          phone: newTeacherRecord.phone,
          accessCount: 0
        }
      ];
    });

    logEmployeeAuditEvent({
      user: 'Engr. Usamah M. Qamar (Super Administrator)',
      userRole: currentSimulatedRole,
      employeeId: generatedEmpId,
      employeeName: newTeacherRecord.name,
      action: 'EMPLOYEE_CREATED',
      authorizedBy: 'Engr. Usamah M. Qamar (Super Administrator)',
      branch: assignedBranch,
      details: `Created new employee profile ${generatedEmpId} and linked IAM user ${assignedUserId}`
    });

    setShowAddTeacher(false);
    setNewTeacherForm({
      name: '',
      email: '',
      phone: '',
      level: [],
      subjectsString: '',
      classesString: '',
      role: 'teaching',
      userId: '',
      accessControl: 'Staff/Teacher',
      maxUnits: 20,
      performanceScore: 80
    });
  };

  // Delete teacher
  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("Dismiss this teacher profile from directory?")) return;
    try {
      const response = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTeachers(prev => prev.filter(t => t.id !== id));
        if (selectedTeacher?.id === id) setSelectedTeacher(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save changes back to a teacher profile (leaves, payroll, lessonPlans, etc)
  const saveTeacherChanges = async (updatedTeacher: Teacher) => {
    try {
      // Optimistic local state update
      setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
      if (selectedTeacher?.id === updatedTeacher.id) setSelectedTeacher(updatedTeacher);

      // 1. Supabase direct sync
      const names = (updatedTeacher.name || '').trim().split(' ');
      const firstName = names[0] || 'Staff';
      const lastName = names.slice(1).join(' ') || 'Member';

      staffService.saveEmployee({
        id: updatedTeacher.id,
        first_name: firstName,
        last_name: lastName,
        phone: updatedTeacher.phone || '08000000000',
        email: updatedTeacher.email || `${updatedTeacher.id}@sams.edu.ng`,
        position: updatedTeacher.position || 'Educator',
        department: updatedTeacher.department || 'Academic',
        qualification: updatedTeacher.qualification || 'B.Ed',
        employment_status: (updatedTeacher.employmentStatus as any) || 'Active',
        profile_photo_url: updatedTeacher.photoUrl || null
      }, {
        bank_name: updatedTeacher.bankName,
        account_number: updatedTeacher.bankAccountNo,
        account_name: updatedTeacher.bankAccountName || updatedTeacher.name
      }).catch(e => console.warn("Supabase staff sync warning:", e));

      // 2. Server API sync
      const response = await fetch(`/api/teachers/${updatedTeacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTeacher)
      });
      if (response.ok) {
        const result = await response.json();
        setTeachers(prev => prev.map(t => t.id === result.id ? result : t));
        if (selectedTeacher?.id === result.id) setSelectedTeacher(result);
      }
    } catch (e) {
      console.error("Error committing teacher write operations:", e);
    }
  };

  // Interactive Scheduler Assignment
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleForm.subject) return;

    const payload = {
      grade: currentScheduleGrade,
      ...newScheduleForm,
      branch: selectedBranch
    };

    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        // Update local schedule state (overwrite if collision, or push)
        setSchedules(prev => {
          const idx = prev.findIndex(s => s.grade === data.grade && s.day === data.day && s.period === data.period && (s.branch === data.branch || (!s.branch && data.branch === 'GN')));
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = data;
            return copy;
          }
          return [...prev, data];
        });
        
        // Clear subject input
        setNewScheduleForm(f => ({ ...f, subject: '' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear single specific block
  const handleClearSchedulePeriod = async (day: string, period: number) => {
    try {
      const response = await fetch('/api/schedules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: currentScheduleGrade, day, period })
      });

      if (response.ok) {
        setSchedules(prev => prev.filter(s => !(s.grade === currentScheduleGrade && s.day === day && s.period === period)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Automated Timetable Scheduler Engine
  const handleAutoAssignAllSlots = async () => {
    let assignedCount = 0;
    let fallbackCount = 0;
    const logs: string[] = [];

    // Compile active class allocation mappings
    const activeRequirements: Array<{
      teacherId: string;
      teacherName: string;
      subject: string;
      totalRequired: number;
    }> = [];

    teachers.forEach(t => {
      if (t.subjectAllocations && t.subjectAllocations.length > 0) {
        t.subjectAllocations.forEach((alloc: any) => {
          if (alloc.className === currentScheduleGrade) {
            activeRequirements.push({
              teacherId: t.id,
              teacherName: t.name,
              subject: alloc.subject,
              totalRequired: alloc.units || 4
            });
          }
        });
      }
    });

    if (activeRequirements.length === 0) {
      alert(`No subject allocations found in the HR portal for ${currentScheduleGrade}. Please first allocate subjects and lessons to teachers under the Human Resources Portal.`);
      return;
    }

    // Days & Periods defined
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = [1, 2, 3, 4, 5, 6];

    // Read current schedules state to find occupied slots & teacher assignments
    let localSchedules = [...schedules];

    for (const req of activeRequirements) {
      // Find current assigned count
      const alreadyScheduled = localSchedules.filter(s => 
        s.grade === currentScheduleGrade && 
        s.subject === req.subject && 
        s.teacherId === req.teacherId
      ).length;

      let remaining = req.totalRequired - alreadyScheduled;
      if (remaining <= 0) {
        logs.push(`‚úì ${req.subject} taught by ${req.teacherName} is already fully timetabled (${req.totalRequired} units)`);
        continue;
      }

      // Find free slots and fill them
      let allocatedForThisReq = 0;
      
      for (const day of days) {
        for (const period of periods) {
          if (remaining <= 0) break;

          // Check if slot in current class is occupied
          const isClassSlotTaken = localSchedules.some(s => 
            s.grade === currentScheduleGrade && 
            s.day === day && 
            s.period === period
          );

          if (isClassSlotTaken) continue; // slot occupied, skip to next

          // Check if teacher is busy elsewhere at this exact day & period (Double-booking rule)
          const isTeacherBusy = localSchedules.some(s => 
            s.teacherId === req.teacherId && 
            s.day === day && 
            s.period === period
          );

          if (isTeacherBusy) continue; // teacher busy, skip to next

          // Both class and teacher are free! Assign!
          const payload = {
            grade: currentScheduleGrade,
            day,
            period,
            subject: req.subject,
            teacherId: req.teacherId,
            branch: selectedBranch
          };

          try {
            const response = await fetch('/api/schedules', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const data = await response.json();
              localSchedules.push(data);
              assignedCount++;
              allocatedForThisReq++;
              remaining--;
            } else {
              fallbackCount++;
            }
          } catch (err) {
            console.error("Failed to commit timetable slot:", err);
            fallbackCount++;
          }
        }
        if (remaining <= 0) break;
      }

      if (allocatedForThisReq > 0) {
        logs.push(`‚òÖ Auto-assigned ${allocatedForThisReq} slots for ${req.subject} (${req.teacherName})`);
      } else if (remaining > 0) {
        logs.push(`‚ö†Ô∏è Could not find enough free slots/availability for ${req.subject} by ${req.teacherName} (Missing ${remaining} units)`);
      }
    }

    // Refresh schedules local state
    setSchedules(localSchedules);

    if (assignedCount > 0) {
      alert(`Auto-Scheduler compiled successfully:\n\n${logs.join('\n')}\n\nTotal blocks mapped and persisted: ${assignedCount} units.`);
    } else {
      alert(`Auto-Scheduler finished:\n\n${logs.join('\n')}\n\nNo new blocks were added as requirements are satisfied or the timetable has no collision-free slots.`);
    }
  };

  // -------------------------------------------------------------
  // AI HANDLERS
  // -------------------------------------------------------------

  // Gemini Proxy for Report Card comments
  const handleGenerateAiReportComment = async () => {
    if (!reportStudent) return;
    setGeneratingReportComment(true);
    setAiErrorMsg(null);

    try {
      const response = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportStudent.name,
          level: reportStudent.level,
          grade: reportStudent.grade,
          grades: reportStudent.grades,
          milestones: reportStudent.milestones,
          behaviorRating: reportStudent.behaviorRating,
          customFocus: customAiFocus
        })
      });

      const data = await response.json();
      if (response.ok && data.comment) {
        // Update active student on client list
        const revisedStudent = {
          ...reportStudent,
          reportComment: data.comment
        };
        setReportStudent(revisedStudent);
        // Persist to database state instantly
        await saveStudentChanges(revisedStudent);
      } else {
        setAiErrorMsg(data.error || "A secure server connection failed of the Gemini integration.");
      }
    } catch (err: any) {
      console.error(err);
      setAiErrorMsg("An unexpected failure occurred while dispatching prompt to the Gemini API.");
    } finally {
      setGeneratingReportComment(false);
    }
  };

  // Gemini Custom Assistant Chat Workspace
  const handleAssistantSend = async (userPromptStr?: string) => {
    const activePrompt = userPromptStr || aiInput;
    if (!activePrompt.trim()) return;

    const userMessagePayload = { role: 'user' as const, text: activePrompt };
    setAssistantLogs(prev => [...prev, userMessagePayload]);
    if (!userPromptStr) setAiInput('');
    setSubmittingAssistant(true);

    try {
      // Keep only active system exchange to respect payload sizes
      const miniHistory = assistantLogs.slice(-6);

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          history: miniHistory
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setAssistantLogs(prev => [
          ...prev, 
          { role: 'model', text: data.text }
        ]);
      } else {
        setAssistantLogs(prev => [
          ...prev, 
          { role: 'model', text: `Failed to contact AI service. Error: ${data.error || 'Connection broken'}. Please verify your GEMINI_API_KEY in the Secrets panel.` }
        ]);
      }
    } catch (err) {
      console.error(err);
      setAssistantLogs(prev => [
        ...prev, 
        { role: 'model', text: "Error sending text to API. Please make sure the backend is active." }
      ]);
    } finally {
      setSubmittingAssistant(false);
    }
  };

  // -------------------------------------------------------------
  // HELPER DATA RENDERERS
  // -------------------------------------------------------------
  
  // Filter grades to secular-only or islamia-only
  const getSecularGrades = (studentGrades: Record<string, number>): Record<string, number> => {
    const res: Record<string, number> = {};
    if (!studentGrades) return res;
    for (const [subj, val] of Object.entries(studentGrades)) {
      const sObj = subjects.find(s => s.name === subj);
      if (!sObj || sObj.level !== 'islamia') {
        res[subj] = val;
      }
    }
    return res;
  };

  const getIslamiaGrades = (studentGrades: Record<string, number>): Record<string, number> => {
    const res: Record<string, number> = {};
    if (!studentGrades) return res;
    for (const [subj, val] of Object.entries(studentGrades)) {
      const sObj = subjects.find(s => s.name === subj);
      if (sObj && sObj.level === 'islamia') {
        res[subj] = val;
      }
    }
    return res;
  };

  const getStudentGradesWithSubj = (student: Student) => {
    const g = { ...(student.grades || {}) };
    // Find standard class subjects
    const sClass = classes.find(c => c.name === student.grade && (!c.branch || c.branch === student.branch));
    if (sClass && sClass.subjects) {
      sClass.subjects.forEach(subj => {
        if (g[subj] === undefined) {
          g[subj] = 0;
        }
      });
    }
    // Find Islamia class subjects
    if (student.islamiaClassId) {
      const iClass = classes.find(c => c.id === student.islamiaClassId);
      if (iClass && iClass.subjects) {
        iClass.subjects.forEach(subj => {
          if (g[subj] === undefined) {
            g[subj] = 0;
          }
        });
      }
    }
    return g;
  };

  const getStudentMilestonesWithSubj = (student: Student) => {
    const m = { ...(student.milestones || {}) };
    const sClass = classes.find(c => c.name === student.grade && (!c.branch || c.branch === student.branch));
    if (sClass && sClass.subjects) {
      sClass.subjects.forEach(subj => {
        if (m[subj] === undefined) {
          m[subj] = 'Introduced';
        }
      });
    }
    return m;
  };

  // Grade average compiler
  const calculateGPA = (studentGrades: Record<string, number>): { avg: number; letter: string } => {
    const scores = Object.values(studentGrades);
    if (scores.length === 0) return { avg: 0, letter: 'N/A' };
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    let letter = 'F';
    const scalesToUse = (activeSaaSSchool && activeSaaSSchool.gradeScales && activeSaaSSchool.gradeScales.length > 0)
      ? activeSaaSSchool.gradeScales
      : gradeScales;

    if (scalesToUse && scalesToUse.length > 0) {
      const sortedScales = [...scalesToUse].sort((a, b) => b.minScore - a.minScore);
      const match = sortedScales.find(scale => avg >= scale.minScore);
      if (match) {
        letter = match.grade;
      } else {
        letter = sortedScales[sortedScales.length - 1]?.grade || 'F';
      }
    } else {
      if (avg >= 90) letter = 'A';
      else if (avg >= 80) letter = 'B';
      else if (avg >= 70) letter = 'C';
      else if (avg >= 60) letter = 'D';
    }

    return { avg, letter };
  };

  // Dynamic student ranking calculation helper
  const getStudentClassRank = (studentId: string, gradeStr: string): { rank: number; total: number } => {
    const gradeStudents = students.filter(s => s.grade === gradeStr);
    if (gradeStudents.length === 0) return { rank: 1, total: 1 };
    
    // Sort students based on average score of secular grades only
    const sorted = [...gradeStudents].map(s => ({
      id: s.id,
      avg: s.level === 'nursery' ? 0 : calculateGPA(getSecularGrades(s.grades)).avg
    })).sort((a, b) => b.avg - a.avg);
    
    const index = sorted.findIndex(item => item.id === studentId);
    return {
      rank: index !== -1 ? index + 1 : 1,
      total: sorted.length
    };
  };

  // Dynamic unique options for filtering
  const studentGradesList = useMemo(() => {
    const gSet = new Set(students.map(s => s.grade).filter(Boolean));
    return Array.from(gSet).sort();
  }, [students]);

  const studentSectionsList = useMemo(() => {
    const sSet = new Set(students.map(s => s.classSection).filter(Boolean));
    return Array.from(sSet).sort();
  }, [students]);

  const studentSessionsList = useMemo(() => {
    const sesSet = new Set(students.map(s => s.sessionYear).filter(Boolean));
    return Array.from(sesSet).sort();
  }, [students]);

  const sessionLabels: Record<string, string> = {
    '20': '2020-2021',
    '21': '2021-2022',
    '22': '2022-2023',
    '23': '2023-2024',
    '24': '2024-2025',
    '25': '2025-2026',
    '26': '2026-2027',
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(studentSearchUrl.toLowerCase()) || 
                            s.grade.toLowerCase().includes(studentSearchUrl.toLowerCase());
      const matchesLevel = studentLevelFilter === 'all' || s.level === studentLevelFilter;
      
      const sBranch = s.branch || 'GN';
      const matchesBranch = studentBranchFilter === 'All' || sBranch === studentBranchFilter;
      
      const matchesClass = studentClassFilter === 'All' || s.grade === studentClassFilter;
      const matchesSection = studentSectionFilter === 'All' || s.classSection === studentSectionFilter;
      const matchesSession = studentSessionFilter === 'All' || s.sessionYear === studentSessionFilter;
      
      return matchesSearch && matchesLevel && matchesBranch && matchesClass && matchesSection && matchesSession;
    });
  }, [students, studentSearchUrl, studentLevelFilter, studentBranchFilter, studentClassFilter, studentSectionFilter, studentSessionFilter]);

  // Filter teachers
  const filteredTeachers = branchTeachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(teacherSearchVal.toLowerCase()) ||
                          t.subjects.some(sub => sub.toLowerCase().includes(teacherSearchVal.toLowerCase())) ||
                          t.email.toLowerCase().includes(teacherSearchVal.toLowerCase()) ||
                          (t.userId && t.userId.toLowerCase().includes(teacherSearchVal.toLowerCase()));
    const actualRole = t.role || 'teaching';
    const matchesStatus = staffRoleFilter === 'all' || actualRole === staffRoleFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectTab = (tab: string, submenu?: string) => {
    const activeRole = currentActiveUser?.role || currentSimulatedRole;
    if (isTabRestricted(tab as any, activeRole)) {
      alert(`üîê ACCESS RESTRICTED\n\nUnder school security guidelines, your role "${activeRole}" does not have privileges to access the "${tab.toUpperCase()}" module.\n\nPlease contact your School Administrator if you require additional permissions.`);
      return;
    }
    setActiveTab(tab);
  };

  // SaaS brand color definitions mapping
  const brandThemeHexes: Record<string, { primary: string; hover: string; light: string; text: string }> = {
    indigo: { primary: '#4f46e5', hover: '#4338ca', light: '#f5f3ff', text: '#4338ca' },
    teal: { primary: '#0d9488', hover: '#0f766e', light: '#f0fdfa', text: '#0f766e' },
    emerald: { primary: '#10b981', hover: '#059669', light: '#ecfdf5', text: '#059669' },
    rose: { primary: '#f43f5e', hover: '#e11d48', light: '#fff1f2', text: '#e11d48' },
    amber: { primary: '#f59e0b', hover: '#d97706', light: '#fefbeb', text: '#d97706' },
    purple: { primary: '#8b5cf6', hover: '#7c3aed', light: '#faf5ff', text: '#7c3aed' },
    sky: { primary: '#0ea5e9', hover: '#0284c7', light: '#f0f9ff', text: '#0284c7' },
  };

  const activeColorTheme = activeSaaSSchool ? (brandThemeHexes[activeSaaSSchool.brandColor] || brandThemeHexes.indigo) : brandThemeHexes.indigo;

  // Guard Unauthenticated Access - Render LoginScreen Gatekeeper
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-4 text-white font-sans">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Verifying secure SAMS authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen 
        systemUsers={systemUsers}
        onLoginSuccess={(user) => {
          setIsAuthenticated(true);
          setCurrentUserId(user.id);
          setCurrentSimulatedRole(user.role);
          if (user.branch && (user.branch === 'GN' || user.branch === 'RS')) {
            setSelectedBranch(user.branch as "GN" | "RS");
          }
          addAuditLog(user.name, 'AUTHENTICATION', `Successful Supabase Auth login as ${user.name} (${user.role}).`, 'SUCCESS');
        }}
        activeSaaSSchool={activeSaaSSchool}
      />
    );
  }

  return (
    <div id="school-erp-parent" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <style>{`
        :root {
          --brand-primary: ${activeColorTheme.primary};
          --brand-primary-hover: ${activeColorTheme.hover};
          --brand-primary-light: ${activeColorTheme.light};
          --brand-primary-text: ${activeColorTheme.text};
        }
        /* Overrides to map SAMS theme colors dynamically to the active onboarding client */
        .bg-indigo-600, .bg-indigo-650, .bg-indigo-500 { background-color: var(--brand-primary) !important; }
        .hover\\:bg-indigo-700:hover, .hover\\:bg-indigo-650:hover, .hover\\:bg-indigo-600:hover { background-color: var(--brand-primary-hover) !important; }
        .text-indigo-600, .text-indigo-700, .text-indigo-850 { color: var(--brand-primary-text) !important; }
        .border-indigo-600, .border-indigo-500 { border-color: var(--brand-primary) !important; }
        .bg-indigo-50, .bg-indigo-100\\/40, .bg-indigo-50\\/55 { background-color: var(--brand-primary-light) !important; }
        .border-indigo-100, .border-indigo-150 { border-color: var(--brand-primary-light) !important; }
        .text-indigo-900, .text-indigo-950 { color: var(--brand-primary-hover) !important; }
        .shadow-indigo-100 { --tw-shadow-color: var(--brand-primary-light) !important; }
      `}</style>
      
      {/* ----------------- CORE HEADER (Phase 10B SAMS DashboardHeader) ----------------- */}
      <DashboardHeader 
        currentActiveUser={currentActiveUser}
        currentUser={currentActiveUser}
        currentSimulatedRole={currentSimulatedRole}
        currentRole={currentSimulatedRole}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        availableBranches={availableBranches}
        userPermittedBranches={currentActiveUser?.authorizedBranches || (currentSimulatedRole === 'Super Administrator' || currentSimulatedRole === 'Super Admin' || currentSimulatedRole === 'Proprietor' ? ['All', 'GN', 'RS'] : [selectedBranch])}
        isSuperAdmin={currentSimulatedRole === 'Super Administrator' || currentSimulatedRole === 'Super Admin'}
        aiConfigured={aiConfigured}
        onBranchChange={(branch) => {
          setSelectedBranch(branch);
          setSelectedStudent(null);
          setSelectedTeacher(null);
        }}
        onRoleChange={(targetRole) => {
          const matchedUser = systemUsers.find(u => u.role === targetRole);
          if (matchedUser) {
            handleSwitchUser(matchedUser.id);
          } else {
            setCurrentSimulatedRole(targetRole);
            addAuditLog('System Admin', 'SIMULATION', `Simulated administrative role switched to ${targetRole}.`, 'INFO');
            if (targetRole === 'Parent') {
              setActiveTab('parent');
            } else if (targetRole === 'Teacher') {
              setActiveTab('teachers');
            } else if (targetRole === 'Accountant') {
              setActiveTab('students');
            } else if (targetRole === 'Store Manager') {
              setActiveTab('inventory');
            } else {
              setActiveTab('overview');
            }
          }
        }}
        onLogout={handleLogout}
        onProfileUpdated={() => {
          fetchDatabase(0, true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* ----------------- PRIMARY WORKSPACE LAYOUT ----------------- */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        <Navigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentSimulatedRole={currentSimulatedRole}
          isTabRestricted={isTabRestricted}
          systemUsersCount={systemUsers.length}
          securityLockdownMode={securityLockdownMode}
          onForceReset={async () => {
            if (confirm("Restore initial sample database records? Everything else will be cleared.")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          favourites={favourites}
          toggleFavourite={toggleFavourite}
          recentlyVisited={recentlyVisited}
          onOpenPersonalization={() => setIsPersonalizationOpen(true)}
          quickShortcuts={userPrefs.quickShortcuts || []}
          onSubmenuSelect={handleSubmenuSelect}
        />

        {/* ----- CONTENT CONTAINER ----- */}
        <main id="erp-content-panel" className="flex-1 p-3 md:p-4 overflow-y-auto max-w-7xl mx-auto w-full transition-all">
          
          {loadingDb && students.length === 0 && teachers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4" />
              <p className="font-medium text-slate-700">Syncing centralized academic data streams...</p>
              <p className="text-xs text-slate-400 mt-1">Contacting system container instances</p>
            </div>
          )}

          {dbError && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-amber-800 text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Working in offline/cached mode. Academic database sync status: {dbError}</span>
              </div>
              <button
                onClick={() => fetchDatabase(0)}
                disabled={loadingDb}
                className="underline font-semibold hover:text-amber-900 ml-3 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {loadingDb ? "Connecting..." : "Sync Now"}
              </button>
            </div>
          )}

          {/* --- TOP HEADER BAR: BREADCRUMBS, SEARCH, THEME TOGGLER --- */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200/60 dark:border-slate-800/80">
                {/* Breadcrumbs Navigation with literal human labels */}
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wide uppercase">
                    <div className="flex items-center space-x-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <School className="w-3 h-3" />
                      <span>SAMS Hub</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-800">/</span>
                    <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                      {React.createElement(breadcrumbs.parentIcon, { className: "w-3 h-3 shrink-0" })}
                      <span>{breadcrumbs.parentName}</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-800">/</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{breadcrumbs.childName}</span>
                  </div>
                  <h1 className="text-sm md:text-lg font-bold text-slate-950 dark:text-white tracking-tight mt-0.5 leading-none uppercase">
                    {breadcrumbs.childName}
                  </h1>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium italic">
                    {breadcrumbs.childDesc}
                  </p>
                </div>

                {/* Controls: Search Trigger and Theme Switcher */}
                <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
                  {/* Global Search Bar Trigger button */}
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center space-x-2.5 bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold shadow-xs transition-all cursor-pointer group"
                    title="Search modules and actions (Ctrl + K)"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    <span>Search SAMS ERP...</span>
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[8px] text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold shadow-xs">
                      Ctrl + K
                    </kbd>
                  </button>

                  {/* Dark Mode Theme Toggler */}
                  <button
                    type="button"
                    onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                    className="p-2 bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-all cursor-pointer hover:scale-105 shadow-xs"
                    title={`Toggle ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                  >
                    {theme === 'light' ? (
                      <svg className="w-4 h-4 text-slate-600 fill-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-amber-500 fill-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Mount the Global Search Modal Dialogue */}
              <GlobalSearch 
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                modules={SAMS_MODULES}
                currentSimulatedRole={currentSimulatedRole}
                isTabRestricted={isTabRestricted}
                setActiveTab={setActiveTab}
                onAddStudent={() => setShowAddStudent(true)}
                onAddTeacher={() => setShowAddTeacher(true)}
                onBulkImport={() => setShowBulkImport(true)}
                themeMode={theme}
                setThemeMode={setTheme}
                favourites={favourites}
                toggleFavourite={toggleFavourite}
                recentlyVisited={recentlyVisited}
              />

              {/* ‚≠ê Mount the Navigation Personalization Modal Dialogue */}
              <PersonalizationModal
                isOpen={isPersonalizationOpen}
                onClose={() => setIsPersonalizationOpen(false)}
                activeUser={currentActiveUser}
                systemUsers={systemUsers}
                userPrefs={userPrefs}
                onUpdatePrefs={handleUpdatePrefs}
                onSwitchUser={handleSwitchUser}
                modules={SAMS_MODULES}
              />

              {/* SAMS Floating Quick Actions Menu */}
              <QuickActionMenu 
                currentSimulatedRole={currentSimulatedRole}
                setActiveTab={setActiveTab}
                setFinancialActiveSection={setFinancialActiveSection}
                onAddStudent={() => setShowAddStudent(true)}
                onAddTeacher={() => setShowAddTeacher(true)}
              />

              {/* -------------------------------------------------------------
                  TAB: INVENTORY & STOCK LEDGER
                  ------------------------------------------------------------- */}
              {activeTab === 'inventory' && (
                <InventoryCatalog />
              )}

              {/* -------------------------------------------------------------
                  TAB: STATUTORY REPORTS & COHORT PERFORMANCE
                  ------------------------------------------------------------- */}
              {activeTab === 'analytics_reports' && (
                <AnalyticsReports />
              )}

              {/* -------------------------------------------------------------
                  TAB: SCHOOL OPERATIONS DASHBOARD (Phase 10B UnifiedDashboardRouter)
                  ------------------------------------------------------------- */}
              {activeTab === 'operations' && (
                <div id="erp-view-operations" className="space-y-6">
                  <UnifiedDashboardRouter 
                    currentRole={currentSimulatedRole}
                    currentSimulatedRole={currentSimulatedRole}
                    selectedBranch={selectedBranch}
                    activeUser={currentActiveUser}
                    currentActiveUser={currentActiveUser}
                    branches={availableBranches}
                    availableBranches={availableBranches}
                    onNavigateTab={(tab, sub) => handleSelectTab(tab as any, sub)}
                    onQuickAction={(action) => {
                      if (action === 'add_student') setShowAddStudent(true);
                      else if (action === 'add_teacher') setShowAddTeacher(true);
                      else if (action === 'bulk_import') setShowBulkImport(true);
                    }}
                    onAddStudent={() => setShowAddStudent(true)}
                    onAddStaff={() => setShowAddTeacher(true)}
                    onReceivePayment={() => handleSelectTab('finance_payments')}
                    onIssueReceipt={() => handleSelectTab('finance_payments')}
                    onFamilyBilling={() => handleSelectTab('finance_family_billing')}
                    onRecordLesson={() => handleSelectTab('academics_lessons')}
                    onUploadEvidence={() => handleSelectTab('teachers_notes')}
                    onMarkAttendance={() => handleSelectTab('attendance_student')}
                    onEnterResults={() => handleSelectTab('results_entry')}
                    onNewStoreSale={() => handleSelectTab('inventory_pos')}
                    onReceiveStock={() => handleSelectTab('inventory_purchase')}
                    onIssueMaterials={() => handleSelectTab('inventory_issuance')}
                    onInventoryCatalog={() => handleSelectTab('inventory_catalog')}
                  />
                </div>
              )}

              {/* -------------------------------------------------------------
                  TAB: INSTITUTIONAL HEALTH INDEX
                  ------------------------------------------------------------- */}
              {activeTab === 'health' && (
                <div id="erp-view-health" className="space-y-6">
                  <ExecutiveHealthDashboard activeBranch={selectedBranch} />
                </div>
              )}

              {/* -------------------------------------------------------------
                  TAB 1: SYSTEM OVERVIEW & BENTO STATS
                  ------------------------------------------------------------- */}
              {activeTab === 'overview' && (
                <div id="erp-view-overview" className="space-y-6">
                  
                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-4">
                      <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">All Enrolled</p>
                        <p className="text-2xl font-bold text-slate-900">{branchStudents.length}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Active Academic Records</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-4">
                      <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Faculty Strength</p>
                        <p className="text-2xl font-bold text-slate-900">{branchTeachers.length}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Assigned Subjects Coordinators</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-4">
                      <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Attendance Rate</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {Math.round(branchStudents.reduce((acc, current) => acc + current.attendancePercentage, 0) / (branchStudents.length || 1))}%
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Avg Institutional Attendance Ratio</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-4">
                      <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Schedules Logged</p>
                        <p className="text-2xl font-bold text-slate-900">{branchSchedules.length}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Assigned Academic Classes</p>
                      </div>
                    </div>
                  </div>

                  {/* Division Breakdown Block */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Level Cards Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-base text-slate-900">Academic Segments</h3>
                          <p className="text-xs text-slate-500">Milestone, grading and GPA definitions across curriculum levels</p>
                        </div>
                        <TrendingUp className="text-slate-400 w-5 h-5 shrink-0" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Nursery School info */}
                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/20 text-indigo-950 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            <h4 className="font-bold text-sm text-indigo-900">NURSERY</h4>
                          </div>
                          <p className="text-xs text-indigo-700/80 leading-relaxed">Early cognitive development focus. Progress structured around early childhood core milestone indices.</p>
                          <div className="pt-2 flex justify-between items-center text-xs border-t border-indigo-100/60">
                            <span className="text-indigo-800">Students Active:</span>
                            <span className="font-bold bg-indigo-100/60 px-2.5 py-0.5 rounded text-indigo-900">
                              {students.filter(s => s.level === 'nursery').length}
                            </span>
                          </div>
                        </div>

                        {/* Primary School info */}
                        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/20 text-amber-950 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <h4 className="font-bold text-sm text-amber-900">PRIMARY</h4>
                          </div>
                          <p className="text-xs text-amber-700/80 leading-relaxed">Continuous assessment tasks (CATs), classroom subject logs, letters profiles and grading averages from Grades 1-5.</p>
                          <div className="pt-2 flex justify-between items-center text-xs border-t border-amber-100/60">
                            <span className="text-amber-800">Students Active:</span>
                            <span className="font-bold bg-amber-100/60 px-2.5 py-0.5 rounded text-amber-900">
                              {students.filter(s => s.level === 'primary').length}
                            </span>
                          </div>
                        </div>

                        {/* Secondary School info */}
                        <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/20 text-rose-950 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <h4 className="font-bold text-sm text-rose-900">SECONDARY</h4>
                          </div>
                          <p className="text-xs text-rose-700/80 leading-relaxed">Rigorous academic periods, advanced semester grades, full High-School transcript GPA compiler from Grades 6-12.</p>
                          <div className="pt-2 flex justify-between items-center text-xs border-t border-rose-100/60">
                            <span className="text-rose-800">Students Active:</span>
                            <span className="font-bold bg-rose-100/60 px-2.5 py-0.5 rounded text-rose-900">
                              {students.filter(s => s.level === 'secondary').length}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Division level switcher previews */}
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">Quick Academic Reviewer</h4>
                          <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                            {(['nursery', 'primary', 'secondary'] as const).map(l => (
                              <button 
                                key={l}
                                onClick={() => setSelectedSubLevel(l)}
                                className={`px-2.5 py-1.5 rounded-md ${selectedSubLevel === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                              >
                                {l.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                          {selectedSubLevel === 'nursery' ? (
                            <div className="space-y-2">
                              <h5 className="font-bold text-xs text-indigo-900">Nursery Assessment Strategy</h5>
                              <p className="text-xs text-slate-600 leading-normal">Rather than using standard numeric grades, Nursery divisions use early child development milestones. This lets teachers benchmark tactile and behavioral curves:</p>
                              <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="text-xs bg-indigo-50 border border-indigo-100/50 p-2 rounded flex items-center justify-between">
                                  <span className="text-indigo-950 font-semibold">Fine Motor Skills</span>
                                  <span className="text-[10px] bg-emerald-100 font-bold px-1.5 py-0.5 rounded text-emerald-800">Mastered</span>
                                </div>
                                <div className="text-xs bg-indigo-50 border border-indigo-100/50 p-2 rounded flex items-center justify-between">
                                  <span className="text-indigo-950 font-semibold">Social Sharing &amp; Interaction</span>
                                  <span className="text-[10px] bg-amber-100 font-bold px-1.5 py-0.5 rounded text-amber-800">Developing</span>
                                </div>
                              </div>
                            </div>
                          ) : selectedSubLevel === 'primary' ? (
                            <div className="space-y-2">
                              <h5 className="font-bold text-xs text-amber-900">Primary Core Grading (Grades 1-5)</h5>
                              <p className="text-xs text-slate-600 leading-normal">Comprehensive testing blocks. Academic evaluation targets early comprehension and literacy:</p>
                              <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="text-xs bg-amber-50 border border-amber-100/50 p-2 rounded flex items-center justify-between">
                                  <span className="text-amber-950 font-semibold">Mathematics Score</span>
                                  <span className="font-bold text-slate-700">92/100</span>
                                </div>
                                <div className="text-xs bg-amber-50 border border-amber-100/50 p-2 rounded flex items-center justify-between">
                                  <span className="text-amber-950 font-semibold">Language &amp; Creative Arts</span>
                                  <span className="font-bold text-slate-700">88/100</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <h5 className="font-bold text-xs text-rose-900">Secondary Honors Track (Grades 6-12)</h5>
                              <p className="text-xs text-slate-600 leading-normal">Rigorous grade averages prepared for credits and GPA calculations. Focus is high-school transcript standards:</p>
                              <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="text-xs bg-rose-50 border border-rose-100/50 p-2 rounded flex items-center justify-between">
                                  <span className="text-rose-950 font-semibold">Biology, Physics, Chemistry</span>
                                  <span className="text-[10px] bg-slate-900 text-slate-300 font-mono px-2 py-0.5 rounded">Credit Enabled</span>
                                </div>
                                <div className="text-xs bg-rose-50 border border-rose-100/50 p-2 rounded flex items-center justify-between">
                                  <span className="text-rose-950 font-semibold">Averaging Standard GPA</span>
                                  <span className="font-bold text-slate-950">A (GPA 3.8 / 4.0)</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* ERP Announcement & System Config Bulletins */}
                    <div className="bg-slate-50 text-slate-700 p-6 rounded-2xl flex flex-col space-y-4 border border-slate-200/80">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">Central ERP Bulletin Board</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Institutional announcements &amp; academic operations dates</p>
                      </div>

                      <div className="flex-1 space-y-3 font-sans text-xs">
                        <div className="bg-white border border-slate-200/65 p-3 rounded-xl shadow-xs">
                          <p className="font-bold text-slate-800 text-xs mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-2" />
                            Academic Term Review Week
                          </p>
                          <p className="text-slate-550 leading-relaxed text-[11px]">Teachers should finalise continuous assessment gradebooks and milestones before report card review. High school final GPA compiler is now unlocked.</p>
                          <span className="text-[9px] text-indigo-600 font-bold block mt-1">Starting Tomorrow</span>
                        </div>

                        <div className="bg-white border border-slate-200/65 p-3 rounded-xl shadow-xs">
                          <p className="font-bold text-slate-800 text-xs mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2" />
                            AI Smart Reports Generator
                          </p>
                          <p className="text-slate-550 leading-relaxed text-[11px]">Report Card generator is fully active. Teachers can generate customized personal comments via the Gemini 3.5 AI interface directly inside the Gradebook portal.</p>
                        </div>

                        <div className="bg-white border border-slate-200/65 p-3 rounded-xl shadow-xs">
                          <p className="font-bold text-slate-800 text-xs mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-2" />
                            Primary Sensory Play Day
                          </p>
                          <p className="text-slate-550 leading-relaxed text-[11px]">Nursery and Preschool sensory activities schedule is locked on Wednesday Period 2. Mrs. Sarah Jenkins represents the lead coordinator.</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveTab('assistant')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl text-center flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                      >
                        <BrainCircuit className="w-4 h-4 shrink-0" />
                        <span>Consult AI Assistant</span>
                      </button>
                    </div>

                  </div>

                </div>
              )}

              {/* -------------------------------------------------------------
                  TAB: DAILY ATTENDANCE TAKE & AUDIT DESK
                  ------------------------------------------------------------- */}
              {activeTab === 'attendance_desk' && (() => {
                const gradesOptions = studentGradesList.length > 0 ? studentGradesList : ["Nursery 1", "Nursery 2", "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "Secondary 1", "Secondary 2", "Secondary 3"];
                const sectionsOptions = studentSectionsList.length > 0 ? studentSectionsList : ["A", "B", "C"];
                
                const filteredStds = students.filter(s => 
                  s.branch === attendanceBranch &&
                  s.grade === attendanceGrade &&
                  s.classSection === attendanceSection
                );

                const isAttendanceAlreadyTaken = filteredStds.length > 0 && filteredStds.some(s => s.attendanceLogs?.some(log => log.date === attendanceDate));

                const sessionTeacher = teachers.find(tch => tch.classTeacherOf === attendanceGrade) ||
                                       teachers.find(tch => tch.classesAssigned?.includes(attendanceGrade)) ||
                                       teachers.find(tch => tch.branch === attendanceBranch && tch.role === 'teaching');
                const sessionTeacherName = sessionTeacher ? sessionTeacher.name : "Unassigned Teacher";
                const sessionBranchAdmin = attendanceBranch === 'GN' ? "Aminu Bello (Gawun Nama)" : "Fatima Yusuf (Runjin Sambo)";

                const todayStr = (() => {
                  const d = new Date();
                  const offset = d.getTimezoneOffset();
                  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
                  return localDate.toISOString().split('T')[0];
                })();
                const isPastDate = attendanceDate < todayStr;
                const isTodayDate = attendanceDate === todayStr;
                
                const d = new Date();
                const currentHours = d.getHours();
                const currentMinutes = d.getMinutes();
                const [cutoffHours, cutoffMinutes] = attendanceCutoffTime.split(':').map(Number);
                const isPastCutoffTime = currentHours > cutoffHours || (currentHours === cutoffHours && currentMinutes >= cutoffMinutes);
                const isWindowClosed = isPastDate || (isTodayDate && isPastCutoffTime);
                
                const sessionKey = `${attendanceDate}-${attendanceBranch}-${attendanceGrade}-${attendanceSection}`;
                const isLatePermitted = attendanceLatePermissions[sessionKey] === true;

                return (
                  <div id="erp-view-attendance-desk" className="space-y-6">
                    {/* Title and Top Alerts */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                          Daily Attendance Taking &amp; Audit Desk
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Take or modify student attendance sessions. Note cutoff guidelines and Super Admin delays auditing rules.
                        </p>
                      </div>
                    </div>

                    {/* Top Panel: Config Filters and cutoff status */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Filter Card */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 lg:col-span-2">
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-slate-400" />
                          Target Session Parameters
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          {/* Branch */}
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Branch Campus</label>
                            <select
                              value={attendanceBranch}
                              onChange={(e) => setAttendanceBranch(e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              <option value="GN">Gawun Nama (GN)</option>
                              <option value="RS">Runjin Sambo (RS)</option>
                            </select>
                          </div>

                          {/* Date */}
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Attendance Date</label>
                            <input
                              type="date"
                              value={attendanceDate}
                              onChange={(e) => setAttendanceDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                            />
                          </div>

                          {/* Grade/Class */}
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Class Grade</label>
                            <select
                              value={attendanceGrade}
                              onChange={(e) => setAttendanceGrade(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              {gradesOptions.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>

                          {/* Section */}
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Section</label>
                            <select
                              value={attendanceSection}
                              onChange={(e) => setAttendanceSection(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              {sectionsOptions.map(s => (
                                <option key={s} value={s}>Section {s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Cutoff & Window Controls */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Window Policy &amp; Override
                        </h3>
                        <div className="space-y-3.5 text-xs">
                          {/* Cutoff Time Input */}
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Daily Cutoff Time (24h)</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={attendanceCutoffTime}
                                onChange={(e) => setAttendanceCutoffTime(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 flex-1 cursor-pointer"
                              />
                              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Default: 10:00 AM</span>
                            </div>
                          </div>

                          {/* Current Status Box */}
                          {(() => {
                            if (isAttendanceAlreadyTaken) {
                              return (
                                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                  <div>
                                    <p className="font-extrabold text-[11px]">Attendance Taken</p>
                                    <p className="text-[10px] text-emerald-600 font-mono">Records exist for {attendanceDate}. Changes can be reviewed and edited below.</p>
                                  </div>
                                </div>
                              );
                            }

                            if (isWindowClosed) {
                              if (isLatePermitted) {
                                return (
                                  <div className="bg-teal-50 border border-teal-150 text-teal-800 p-3 rounded-xl flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="font-extrabold text-[11px]">Late Entry Permitted</p>
                                      <p className="text-[10px] text-teal-600">Super Admin authorized late entry for this session. A delayed attendance record flag will be registered upon commit.</p>
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="space-y-2.5">
                                    <div className="bg-rose-50 border border-rose-150 text-rose-800 p-3 rounded-xl flex items-start gap-2">
                                      <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                                      <div>
                                        <p className="font-extrabold text-[11px]">Attendance Window Closed</p>
                                        <p className="text-[10px] text-rose-600 leading-relaxed">
                                          Cutoff time ({attendanceCutoffTime}) has passed or selected date is in the past. Only the **Super Admin** can authorize/permit late entry.
                                        </p>
                                      </div>
                                    </div>

                                    {currentSimulatedRole === 'Super Admin' ? (
                                      <button
                                        onClick={() => {
                                          setAttendanceLatePermissions(prev => ({ ...prev, [sessionKey]: true }));
                                          alert("üîì Late entry authorized. Teachers/Admins can now fill the student attendance sheet for this session.");
                                        }}
                                        className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2 px-3 rounded-lg text-[10px] transition-all flex items-center justify-center space-x-1 uppercase tracking-wider cursor-pointer shadow-sm"
                                      >
                                        <span>üîì Permit Late Entry &amp; Flag Delay</span>
                                      </button>
                                    ) : (
                                      <div className="bg-slate-100 p-2.5 border rounded-lg text-center text-[10px] text-slate-500 font-medium">
                                        üîí Locked. Switch role to Super Admin in the top-right header to simulate late override authority.
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            }

                            return (
                              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3 rounded-xl flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                  <p className="font-extrabold text-[11px]">Window Active</p>
                                  <p className="text-[10px] text-blue-600">You are within the permitted time. Teachers/Admins can record attendance normally.</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Attendance Taker Student Sheet Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            Attendance Sheet
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 font-mono">
                              {filteredStds.length} Students
                            </span>
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Select status and add reason for excused absences or left status.
                          </p>
                        </div>

                        {/* Bulk set all options */}
                        {(() => {
                          const isEditable = !isWindowClosed || isLatePermitted || isAttendanceAlreadyTaken;
                          if (!isEditable || filteredStds.length === 0) return null;

                          return (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Bulk Set:</span>
                              <button
                                onClick={() => {
                                  const bulk: Record<string, 'Present' | 'Absent' | 'Sick' | 'Left'> = {};
                                  filteredStds.forEach(s => { bulk[s.id] = 'Present'; });
                                  setAttendanceStates(prev => ({ ...prev, ...bulk }));
                                }}
                                className="bg-white border hover:bg-slate-50 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 shadow-sm cursor-pointer"
                              >
                                All Present ‚úÖ
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      {(() => {
                        if (filteredStds.length === 0) {
                          return (
                            <div className="p-12 text-center">
                              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                              <p className="font-extrabold text-slate-700 text-sm">No Students Found</p>
                              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                                There are currently no students registered in {attendanceBranch === 'GN' ? 'Gawun Nama' : 'Runjin Sambo'} branch under {attendanceGrade}, Section {attendanceSection}.
                              </p>
                            </div>
                          );
                        }

                        const isLocked = isWindowClosed && !isLatePermitted;

                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50/55 border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                  <th className="px-6 py-4">Student Info</th>
                                  <th className="px-6 py-4">Admission Details</th>
                                  <th className="px-6 py-4">Directory Metric</th>
                                  <th className="px-6 py-4 text-center">TICK ATTENDANCE STATUS</th>
                                  <th className="px-6 py-4">Excuse Reason / Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredStds.map(student => {
                                  const activeStatus = attendanceStates[student.id] || 'Present';
                                  return (
                                    <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                                      <td className="px-6 py-4 font-bold text-slate-800">
                                        <div className="flex flex-col">
                                          <span>{student.name}</span>
                                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {student.id}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 font-mono text-slate-500">
                                        <div className="flex flex-col gap-0.5">
                                          <div><span className="font-sans font-bold text-[9px] text-slate-400 uppercase">Adm No:</span> {student.enrollmentNo || 'N/A'}</div>
                                          <div><span className="font-sans font-bold text-[9px] text-slate-400 uppercase">Status:</span> {student.admissionStatus || 'Active'}</div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-mono font-bold text-slate-700">{student.attendancePercentage}%</span>
                                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full ${student.attendancePercentage >= 90 ? 'bg-emerald-500' : student.attendancePercentage >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                              style={{ width: `${student.attendancePercentage}%` }} 
                                            />
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                          {/* Present */}
                                          <button
                                            disabled={isLocked}
                                            onClick={() => setAttendanceStates(prev => ({ ...prev, [student.id]: 'Present' }))}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer select-none min-w-[72px] text-center ${
                                              activeStatus === 'Present'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          >
                                            Present
                                          </button>

                                          {/* Absent */}
                                          <button
                                            disabled={isLocked}
                                            onClick={() => setAttendanceStates(prev => ({ ...prev, [student.id]: 'Absent' }))}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer select-none min-w-[72px] text-center ${
                                              activeStatus === 'Absent'
                                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          >
                                            Absent
                                          </button>

                                          {/* Sick */}
                                          <button
                                            disabled={isLocked}
                                            onClick={() => setAttendanceStates(prev => ({ ...prev, [student.id]: 'Sick' }))}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer select-none min-w-[72px] text-center ${
                                              activeStatus === 'Sick'
                                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          >
                                            Sick
                                          </button>

                                          {/* Left */}
                                          <button
                                            disabled={isLocked}
                                            onClick={() => setAttendanceStates(prev => ({ ...prev, [student.id]: 'Left' }))}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer select-none min-w-[72px] text-center ${
                                              activeStatus === 'Left'
                                                ? 'bg-slate-600 text-white border-slate-600 shadow-xs'
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          >
                                            Left
                                          </button>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <input
                                          disabled={isLocked || activeStatus === 'Present'}
                                          type="text"
                                          placeholder={activeStatus === 'Present' ? 'N/A' : 'Enter excuse/reason...'}
                                          value={attendanceReasons[student.id] || ''}
                                          onChange={(e) => {
                                            const text = e.target.value;
                                            setAttendanceReasons(prev => ({ ...prev, [student.id]: text }));
                                          }}
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>

                            {/* Submit Actions Button */}
                            <div className="p-6 bg-slate-50 border-t border-slate-100 text-right">
                              <button
                                disabled={isLocked}
                                onClick={async () => {
                                  if (isLocked) return;

                                  // Confirm submit
                                  if (!confirm("Are you sure you want to commit these attendance records to the institutional database?")) {
                                    return;
                                  }

                                  try {
                                    const isLateEntryCommit = isPastDate || (isTodayDate && isPastCutoffTime);

                                    if (isLateEntryCommit && !isAttendanceAlreadyTaken) {
                                      // Registered late flag
                                      const flagObj = {
                                        id: Date.now().toString(),
                                        date: attendanceDate,
                                        branch: attendanceBranch,
                                        grade: attendanceGrade,
                                        classSection: attendanceSection,
                                        cutoffTime: attendanceCutoffTime,
                                        permittedBy: 'Super Admin',
                                        submittedAt: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(),
                                        branchAdmin: sessionBranchAdmin,
                                        classTeacher: sessionTeacherName
                                      };
                                      setAttendanceDelayFlags(prev => [flagObj, ...prev]);
                                    }

                                    // Iterate students and submit changes
                                    for (const std of filteredStds) {
                                      const chosenStatus = attendanceStates[std.id] || 'Present';
                                      const chosenReason = attendanceReasons[std.id] || '';

                                      // Filter out any existing log for this exact date to overwrite or avoid duplicate
                                      const updatedLogs = (std.attendanceLogs || []).filter(l => l.date !== attendanceDate);
                                      
                                      // Add the new/updated entry
                                      updatedLogs.push({
                                        date: attendanceDate,
                                        status: chosenStatus as any,
                                        reason: chosenStatus !== 'Present' ? chosenReason : undefined
                                      });

                                      // sort chronological
                                      updatedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                      // Recalculate percentage
                                      const validLogs = updatedLogs.filter(l => (l.status as string) !== 'Left');
                                      const positiveLogs = validLogs.filter(l => l.status === 'Present' || (l.status as string) === 'Sick');
                                      const rate = validLogs.length > 0 ? Math.round((positiveLogs.length / validLogs.length) * 100) : 100;

                                      const updatedStudent = {
                                        ...std,
                                        attendanceLogs: updatedLogs,
                                        attendancePercentage: rate
                                      };

                                      await saveStudentChanges(updatedStudent);
                                    }

                                    alert(`üéâ Attendance committed successfully! Saved records for ${filteredStds.length} students.${(isLateEntryCommit && !isAttendanceAlreadyTaken) ? '\n\nüö© Warning: A delayed attendance entry flag has been logged against the Branch Admin & Class Teacher.' : ''}`);
                                    
                                  } catch (err) {
                                    console.error(err);
                                    alert("An error occurred while saving school attendance.");
                                  }
                                }}
                                className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md text-xs uppercase tracking-wider ${
                                  isLocked ? 'opacity-50 cursor-not-allowed bg-slate-400' : ''
                                }`}
                              >
                                {isLocked ? 'üîí Attendance Window Locked' : 'üíæ Commit & Save Attendance Records'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Delayed Attendance Flags Registry Log */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">üö® Delay Flags &amp; Institutional Audit Ledger</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Automatic red flag logs on Branch Admins &amp; Class Teachers for delayed calling tasks.</p>
                          </div>
                        </div>
                        
                        {attendanceDelayFlags.length > 0 && (
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to clear the audit logs? This is a Super Admin privileged action.")) {
                                setAttendanceDelayFlags([]);
                              }
                            }}
                            className="text-[10px] text-rose-600 hover:text-rose-800 font-bold transition-all cursor-pointer"
                          >
                            Clear Audit Log
                          </button>
                        )}
                      </div>

                      {attendanceDelayFlags.length === 0 ? (
                        <div className="bg-slate-50 p-6 rounded-xl text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200">
                          üü¢ Excellent! No delayed calling flags logged in the registry. All sessions were taken on-time.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                <th className="px-4 py-2.5">Date / Session</th>
                                <th className="px-4 py-2.5">Cutoff</th>
                                <th className="px-4 py-2.5">Submitted At</th>
                                <th className="px-4 py-2.5">Delinquent Branch Admin</th>
                                <th className="px-4 py-2.5">Delinquent Class Teacher</th>
                                <th className="px-4 py-2.5">Delay Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {attendanceDelayFlags.map((flag: any) => (
                                <tr key={flag.id} className="hover:bg-rose-50/20 bg-rose-500/[0.01]">
                                  <td className="px-4 py-3 font-bold text-slate-800">
                                    {flag.date} <span className="text-[10px] font-medium text-slate-400">({flag.branch} - {flag.grade} {flag.classSection})</span>
                                  </td>
                                  <td className="px-4 py-3 font-mono font-bold text-slate-500">{flag.cutoffTime}</td>
                                  <td className="px-4 py-3 text-slate-600 font-mono text-[10px]">{flag.submittedAt}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      <span className="text-rose-600 font-extrabold">üö©</span>
                                      <span className="font-semibold text-slate-700">{flag.branchAdmin}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      <span className="text-rose-600 font-extrabold">üö©</span>
                                      <span className="font-semibold text-slate-700">{flag.classTeacher}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border border-rose-200">
                                      üö® DELAY FLAGGED
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* -------------------------------------------------------------
                  TAB: MULTI-TENANT SCHOOL SETUP & SAAS CLIENT CONSOLE
                  ------------------------------------------------------------- */}
              {activeTab === 'school_setup' && (
                <SchoolSetupConsole 
                  activeSchoolId={activeSaaSSchool?.id || ''}
                  onActivateSchool={handleActivateSaaSSchool}
                  onSeedDemoData={handleSeedSaaSDemoData}
                />
              )}

              {/* -------------------------------------------------------------
                  TAB 2: COMPREHENSIVE STUDENTS PORTAL (CRUD)
                  ------------------------------------------------------------- */}
              {activeTab === 'students' && (
                <div id="erp-view-students" className="space-y-6">
                  
                  {/* SAMS Student Module Sub-Tab Bar */}
                  <div className="flex border-b border-slate-200 gap-2 mb-2">
                    <button
                      onClick={() => { setStudentsSubTab('directory'); setStudentSelectionPrompt(null); }}
                      className={`px-4 py-2 text-xs font-semibold -mb-px border-b-2 transition-all cursor-pointer uppercase tracking-wider text-[10px] ${
                        studentsSubTab === 'directory'
                          ? 'border-indigo-600 text-indigo-600 font-black bg-indigo-50/20'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      üìã Student Directory & Folders
                    </button>
                    <button
                      onClick={() => { setStudentsSubTab('promotion'); setStudentSelectionPrompt(null); }}
                      className={`px-4 py-2 text-xs font-semibold -mb-px border-b-2 transition-all cursor-pointer uppercase tracking-wider text-[10px] ${
                        studentsSubTab === 'promotion'
                          ? 'border-indigo-600 text-indigo-600 font-black bg-indigo-50/20'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ‚ö° Academic Promotion Board
                    </button>
                    <button
                      onClick={() => { setStudentsSubTab('transfer'); setStudentSelectionPrompt(null); }}
                      className={`px-4 py-2 text-xs font-semibold -mb-px border-b-2 transition-all cursor-pointer uppercase tracking-wider text-[10px] ${
                        studentsSubTab === 'transfer'
                          ? 'border-indigo-600 text-indigo-600 font-black bg-indigo-50/20'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      üîÑ Branch Transfer & Offboarding
                    </button>
                  </div>

                  {studentsSubTab === 'directory' && (
                    <>
                      {/* Helper Alert Prompt */}
                      {studentSelectionPrompt && !selectedStudent && (
                        <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-3 text-indigo-950 font-medium text-xs flex items-center justify-between gap-2 animate-fade-in">
                          <div className="flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>{studentSelectionPrompt}</span>
                          </div>
                          <button 
                            onClick={() => setStudentSelectionPrompt(null)} 
                            className="text-indigo-400 hover:text-indigo-950 font-bold px-1.5"
                          >
                            ‚úï
                          </button>
                        </div>
                      )}

                      {/* Action Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Enrolled Student Directory</h2>
                      <p className="text-xs text-slate-500">Search and manage student folders, update milestones and grading credentials</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setShowBulkImport(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-md shadow-emerald-550/10 cursor-pointer"
                        title="Import list of students from previous portal with sequential serial configuration"
                      >
                        <UploadCloud className="w-4 h-4 shrink-0" />
                        <span>Previous Portal Bulk Import</span>
                      </button>
                      
                      <button 
                        id="btn-trigger-add-std"
                        onClick={() => setShowAddStudent(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-md shadow-indigo-100 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 shrink-0" />
                        <span>Admit New Student</span>
                      </button>
                    </div>
                  </div>

                  {/* Directory controls */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                      {/* Search bar */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 shrink-0" />
                        <input 
                          type="text"
                          placeholder="Search student by name, level, or grade..."
                          value={studentSearchUrl}
                          onChange={(e) => setStudentSearchUrl(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      {/* Level switches */}
                      <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold shrink-0">
                        {(['all', 'nursery', 'primary', 'secondary'] as const).map(lev => (
                          <button
                            key={lev}
                            onClick={() => setStudentLevelFilter(lev)}
                            className={`px-3 py-1.5 rounded-lg uppercase tracking-wide text-[10px] ${
                              studentLevelFilter === lev ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            {lev}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Additional Filters Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                      {/* Class Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class</label>
                        <select
                          value={studentClassFilter}
                          onChange={(e) => setStudentClassFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="All">All Classes</option>
                          {studentGradesList.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>

                      {/* Section Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Section</label>
                        <select
                          value={studentSectionFilter}
                          onChange={(e) => setStudentSectionFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="All">All Sections</option>
                          {studentSectionsList.map(section => (
                            <option key={section} value={section}>Section {section}</option>
                          ))}
                        </select>
                      </div>

                      {/* Session Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session</label>
                        <select
                          value={studentSessionFilter}
                          onChange={(e) => setStudentSessionFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="All">All Sessions</option>
                          {studentSessionsList.map(session => (
                            <option key={session} value={session}>
                              {sessionLabels[session] || `Session ${session}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Branch Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Branch</label>
                        <select
                          value={studentBranchFilter}
                          onChange={(e) => setStudentBranchFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="All">All Branches</option>
                          <option value="GN">Gawun Nama (GN)</option>
                          <option value="RS">Runjin Sambo (RS)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Main Directory Table list */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-widest font-bold text-[9px]">
                            <th className="px-6 py-4">Student Name</th>
                            <th className="px-6 py-4">Level</th>
                            <th className="px-6 py-4">Class Division</th>
                            <th className="px-6 py-4">Parent Guardian</th>
                            <th className="px-6 py-4">Attendance</th>
                            <th className="px-6 py-4">Status / Behavior</th>
                            <th className="px-6 py-4 text-right">Operational Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                                No student directories discovered with current filters. Click "Admit Student" to enroll.
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map(student => (
                              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setTimeout(() => {
                                        const el = document.getElementById('student-folder-drawer');
                                        if (el) {
                                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                      }, 80);
                                    }}
                                    className="font-bold text-indigo-700 hover:text-indigo-900 hover:underline text-left cursor-pointer transition-colors focus:outline-none block"
                                    title="Click to view full categorized student folders and admission files"
                                  >
                                    {student.name}
                                  </button>
                                  <div className="text-[10px] text-slate-400 font-mono text-left mt-1 flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-450 uppercase font-bold text-[8px] tracking-wider">Adm No:</span>
                                      <span className="text-indigo-700 font-extrabold font-mono bg-indigo-50/70 border border-indigo-100 rounded px-1.5 py-0.2">
                                        {student.enrollmentNo || `ADM-${student.id}`}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-slate-400">ID: {student.id}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 capitalize">
                                  <div className="flex flex-col gap-1.5 items-start">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                      student.level === 'nursery' ? 'bg-indigo-50 border border-indigo-100 text-indigo-705' :
                                      student.level === 'primary' ? 'bg-amber-50 border border-amber-100 text-amber-705' :
                                      'bg-rose-50 border border-rose-100 text-rose-705'
                                    }`}>
                                      {student.level}
                                    </span>
                                    <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded tracking-wider leading-none ${
                                      student.branch === 'RS' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}>
                                      {student.branch === 'RS' ? 'RS BRANCH' : 'GN BRANCH'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-800">{student.grade}</div>
                                  <div className="text-[10px] text-slate-400">Section {student.classSection}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-medium text-slate-800">{student.parentName || 'None Listed'}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{student.parentEmail || 'No email'}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-1.5">
                                    <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${student.attendancePercentage}%` }} />
                                    </div>
                                    <span className="font-mono font-bold text-slate-700">{student.attendancePercentage}%</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      (student.admissionStatus || 'Active') === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                      (student.admissionStatus || 'Active') === 'Deactivated' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                      (student.admissionStatus || 'Active') === 'Completed' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                                      (student.admissionStatus || 'Active') === 'Expelled' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                      (student.admissionStatus || 'Active') === 'Suspended' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                      'bg-indigo-50 text-indigo-800 border-indigo-200'
                                    }`}>
                                      {student.admissionStatus || 'Active'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                      student.behaviorRating === 'Excellent' ? 'bg-emerald-50 text-emerald-800 border-emerald-100/50' :
                                      student.behaviorRating === 'Good' ? 'bg-indigo-50 text-indigo-800 border-indigo-100/50' :
                                      'bg-rose-50 text-rose-800 border-rose-100/50'
                                    }`}>
                                      {student.behaviorRating} Rating
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end space-x-3">
                                    <select
                                      value={student.admissionStatus || 'Active'}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'Other') {
                                          const custom = prompt("Enter custom status or reason (e.g. Leave of absence, Transferred, etc.):");
                                          if (custom) {
                                            const updated = { ...student, admissionStatus: custom };
                                            saveStudentChanges(updated);
                                          }
                                        } else {
                                          const updated = { ...student, admissionStatus: val };
                                          saveStudentChanges(updated);
                                        }
                                      }}
                                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                      title="Change student status"
                                    >
                                      <option value="Active">Reactivate / Active</option>
                                      <option value="Deactivated">Deactivate</option>
                                      <option value="Completed">Completed (Graduated)</option>
                                      <option value="Expelled">Expelled</option>
                                      <option value="Suspended">Suspended</option>
                                      {student.admissionStatus && !['Active', 'Deactivated', 'Completed', 'Expelled', 'Suspended'].includes(student.admissionStatus) && (
                                        <option value={student.admissionStatus}>{student.admissionStatus}</option>
                                      )}
                                      <option value="Other">+ Custom Reason...</option>
                                    </select>

                                    <button 
                                      onClick={() => handleDeleteStudent(student.id)}
                                      className="text-rose-550 hover:text-rose-750 inline-block transition-colors shrink-0 cursor-pointer p-1.5 hover:bg-rose-50 rounded"
                                      title="Delete Student Record"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Selected Single Student Detail Drawer / Folder */}
                  {selectedStudent && (
                    <div id="student-folder-drawer" className="bg-white border border-indigo-200/80 rounded-2xl p-6 shadow-lg shadow-indigo-100/40 space-y-6">
                      
                      {/* Folder Title Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative group shrink-0">
                            {selectedStudent.photoUrl ? (
                              <img
                                src={selectedStudent.photoUrl}
                                alt={selectedStudent.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200/80 shadow-xs"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-[15px] shadow-xs border-2 ${
                                selectedStudent.level === 'nursery' ? 'bg-indigo-50 text-indigo-700 border-indigo-250' :
                                selectedStudent.level === 'primary' ? 'bg-amber-50 text-amber-700 border-amber-250' : 'bg-rose-50 text-rose-700 border-rose-250'
                              }`}>
                                {selectedStudent.name ? selectedStudent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-lg text-slate-950">{selectedStudent.name}</h3>
                              <span className="bg-slate-100 text-slate-700 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase" title="System ID">
                                ID: {selectedStudent.id}
                              </span>
                              <span className="bg-emerald-50 border border-emerald-150 text-emerald-800 font-mono text-[10px] px-2 py-0.5 rounded font-extrabold uppercase" title="Official admission registration number">
                                ADMISSION NO: {selectedStudent.enrollmentNo || `ADM-${selectedStudent.id}`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Class Placement Category: <span className="font-extrabold text-indigo-700 uppercase tracking-wide">{selectedStudent.level}</span> ({selectedStudent.grade} ‚Ä¢ Room {selectedStudent.classSection})
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedStudent(null)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 text-xs py-1.5 px-3 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          Close Folder
                        </button>
                      </div>

                      {/* Horizontal Tab Selector */}
                      <div className="flex border-b border-slate-200 text-xs overflow-x-auto gap-1">
                        {(['profile', 'coverage', 'conduct', 'health', 'finance', 'docs', 'id'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setDrawerActiveTab(tab)}
                            className={`px-4 py-2 font-semibold -mb-px border-b-2 uppercase tracking-wider text-[10px] whitespace-nowrap transition-all cursor-pointer ${
                              drawerActiveTab === tab ? 
                              'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/20' : 
                              'border-transparent text-slate-550 hover:text-slate-900 hover:border-slate-300'
                            }`}
                          >
                            {tab === 'profile' && 'üìã Student Profile'}
                            {tab === 'coverage' && 'üìñ Book & Work Coverage'}
                            {tab === 'conduct' && '‚öñÔ∏è Discipline & Conduct'}
                            {tab === 'health' && 'ü©∫ Medical Record'}
                            {tab === 'finance' && 'üìä Financial Timeline'}
                            {tab === 'docs' && 'üìÅ Student Document'}
                            {tab === 'id' && 'ü™™ Student ID Card'}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2">
                        {/* ----------------- TAB: PROFILE & ACADEMICS ----------------- */}
                        {drawerActiveTab === 'profile' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-xs">
                            
                            {/* Enrollment Admissions Metadata */}
                            <div className="space-y-4">
                              {/* Profile Photo Section */}
                              <div className="bg-white p-4 rounded-xl border border-indigo-150/70 shadow-2xs space-y-3">
                                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center">
                                  <Camera className="w-4 h-4 mr-1 text-indigo-600 shrink-0" />
                                  Student Profile Photo & Identity
                                </h4>
                                <div className="flex items-center space-x-4">
                                  {selectedStudent.photoUrl ? (
                                    <img 
                                      src={selectedStudent.photoUrl} 
                                      alt="Student Avatar" 
                                      className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-3xs"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border text-[10px] text-center p-1 uppercase shadow-3xs leading-none">
                                      No Photo
                                    </div>
                                  )}
                                  <div className="flex-1 space-y-2">
                                    <div>
                                      <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Image Destination URL / Base64</label>
                                      <input 
                                        type="text"
                                        placeholder="https://example.com/photo.jpg"
                                        value={selectedStudent.photoUrl || ''}
                                        onChange={(e) => {
                                          const updated = { ...selectedStudent, photoUrl: e.target.value };
                                          setSelectedStudent(updated);
                                        }}
                                        onBlur={() => saveStudentChanges(selectedStudent)}
                                        className="w-full bg-white border border-slate-205 rounded px-2.5 py-1 text-[11px] outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <label className="relative flex items-center justify-center px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded border border-indigo-200 cursor-pointer transition text-[10.5px]">
                                        <UploadCloud className="w-3.5 h-3.5 mr-1" />
                                        <span>Upload from Device</span>
                                        <input 
                                          type="file" 
                                          accept="image/*" 
                                          className="hidden" 
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                const base64String = reader.result as string;
                                                const updated = { ...selectedStudent, photoUrl: base64String };
                                                setSelectedStudent(updated);
                                                saveStudentChanges(updated);
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                        />
                                      </label>
                                      {selectedStudent.photoUrl && selectedStudent.photoUrl.startsWith('data:image') && (
                                        <span className="text-[9.5px] text-slate-500 font-medium">Local image loaded</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200/50">
                                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-black block">Click to select a dynamic student avatar/photo preset:</span>
                                  <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 scrollbar-thin">
                                    {[
                                      { name: 'Boy A', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex' },
                                      { name: 'Girl A', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
                                      { name: 'Boy B', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Caleb' },
                                      { name: 'Girl B', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya' },
                                      { name: 'Pixel B', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Retro' },
                                      { name: 'Pixel G', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Gamer' }
                                    ].map((preset) => (
                                      <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => {
                                          const updated = { ...selectedStudent, photoUrl: preset.url };
                                          setSelectedStudent(updated);
                                          saveStudentChanges(updated);
                                        }}
                                        className={`p-0.5 rounded-full border-2 transition-transform hover:scale-110 shrink-0 ${
                                          selectedStudent.photoUrl === preset.url ? 'border-indigo-600 ring-1 ring-indigo-500' : 'border-transparent'
                                        }`}
                                        title={preset.name}
                                      >
                                        <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded-full bg-white object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center">
                                <FileText className="w-4 h-4 mr-1 text-slate-500 shrink-0" />
                                Admissions &amp; Placement File
                              </h4>
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-3">
                                <div>
                                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Admission / Registration Date</label>
                                  <input 
                                    type="date"
                                    value={selectedStudent.admissionDate || ''}
                                    onChange={(e) => {
                                      const updated = { ...selectedStudent, admissionDate: e.target.value };
                                      setSelectedStudent(updated);
                                    }}
                                    onBlur={() => saveStudentChanges(selectedStudent)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 mt-1 outline-none font-mono focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                
                                <div className="p-2.5 bg-indigo-50 border border-indigo-150/80 rounded-lg">
                                  <label className="text-[10px] text-indigo-800 uppercase tracking-widest font-extrabold flex items-center mb-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 mr-1 animate-pulse" />
                                    Active Campus Branch
                                  </label>
                                  <select 
                                    value={selectedStudent.branch || 'GN'}
                                    onChange={(e) => {
                                      const updated = { ...selectedStudent, branch: e.target.value as 'GN' | 'RS' };
                                      setSelectedStudent(updated);
                                      saveStudentChanges(updated);
                                    }}
                                    className="w-full bg-white border border-indigo-200 rounded px-2 py-1 text-xs font-bold text-indigo-900 outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    <option value="GN">Gawun Nama (GN)</option>
                                    <option value="RS">Runjin Sambo (RS)</option>
                                  </select>
                                  <p className="text-[9px] text-slate-450 mt-1">
                                    Switching the branch immediately relocates the student's central academic records across campus registers.
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Enrollment / Admission No</label>
                                    <input 
                                      type="text"
                                      value={selectedStudent.enrollmentNo || ''}
                                      onChange={(e) => {
                                        const updated = { ...selectedStudent, enrollmentNo: e.target.value };
                                        setSelectedStudent(updated);
                                      }}
                                      onBlur={() => saveStudentChanges(selectedStudent)}
                                      className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 mt-1 outline-none font-mono focus:ring-1 focus:ring-indigo-500 font-bold text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Global Serial No</label>
                                    <input 
                                      type="number"
                                      value={selectedStudent.serialNumber || ''}
                                      onChange={(e) => {
                                        const updated = { ...selectedStudent, serialNumber: e.target.value };
                                        setSelectedStudent(updated);
                                      }}
                                      onBlur={() => saveStudentChanges(selectedStudent)}
                                      className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 mt-1 outline-none font-mono focus:ring-1 focus:ring-indigo-500 font-black text-indigo-750"
                                      title="Unique sequential serial allocated irrespective of class"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Admission File Status &amp; Onboarding State</label>
                                  <select 
                                    value={selectedStudent.admissionStatus || 'Active'}
                                    onChange={(e) => {
                                      const updated = { ...selectedStudent, admissionStatus: e.target.value };
                                      setSelectedStudent(updated);
                                      saveStudentChanges(updated);
                                    }}
                                    className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 mt-1 outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800"
                                  >
                                      <option value="Active">Active Student</option>
                                      <option value="Suspended">Suspended</option>
                                      <option value="Completed">Completed Graduate</option>
                                    </select>
                                  </div>

                                <div className="p-2.5 bg-emerald-50/50 border border-emerald-150 rounded-xl space-y-1">
                                  <label className="text-[10px] text-emerald-850 uppercase tracking-widest font-extrabold flex items-center">
                                    <Sparkles className="w-3.5 h-3.5 text-ethereum mr-1 shrink-0 animate-pulse" />
                                    üåô Islamia Wing Section (Optional Program)
                                  </label>
                                  <select 
                                    value={selectedStudent.islamiaClassId || ''}
                                    onChange={(e) => {
                                      const updated = { ...selectedStudent, islamiaClassId: e.target.value || undefined };
                                      setSelectedStudent(updated);
                                      saveStudentChanges(updated);
                                    }}
                                    className="w-full bg-white border border-slate-200 text-teal-800 rounded px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                  >
                                    <option value="">-- No Enrollment / Spectating Only --</option>
                                    {classes
                                      .filter(c => c.level === 'islamia' && (!c.branch || c.branch === selectedStudent.branch))
                                      .map(c => (
                                        <option key={c.id} value={c.id}>Islamia: {c.name} ({c.branch})</option>
                                      ))}
                                  </select>
                                  <p className="text-[9.5px] text-slate-455">
                                    Optional Islamia wing program. Allocates independent theology subjects to the student's unified term card.
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 border-t border-slate-250/50 pt-2">
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Gender</label>
                                    <select 
                                      value={selectedStudent.profile?.gender || 'Female'}
                                      onChange={(e) => {
                                        const prof = selectedStudent.profile || { gender: 'Female', dob: '', address: '', bloodGroup: 'O+' };
                                        const updated = { ...selectedStudent, profile: { ...prof, gender: e.target.value as any } };
                                        setSelectedStudent(updated);
                                        saveStudentChanges(updated);
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 mt-1 outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                      <option value="Female">Female</option>
                                      <option value="Male">Male</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Date of Birth</label>
                                    <input 
                                      type="date"
                                      value={selectedStudent.profile?.dob || ''}
                                      onChange={(e) => {
                                        const prof = selectedStudent.profile || { gender: 'Female', dob: '', address: '', bloodGroup: 'O+' };
                                        const updated = { ...selectedStudent, profile: { ...prof, dob: e.target.value } };
                                        setSelectedStudent(updated);
                                      }}
                                      onBlur={() => saveStudentChanges(selectedStudent)}
                                      className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 mt-1 outline-none font-mono focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Primary Home Address</label>
                                  <textarea 
                                    value={selectedStudent.profile?.address || ''}
                                    onChange={(e) => {
                                      const prof = selectedStudent.profile || { gender: 'Female', dob: '', address: '', bloodGroup: 'O+' };
                                      const updated = { ...selectedStudent, profile: { ...prof, address: e.target.value } };
                                      setSelectedStudent(updated);
                                    }}
                                    onBlur={() => saveStudentChanges(selectedStudent)}
                                    rows={2}
                                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 mt-1 outline-none text-[11px] focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 text-right font-medium italic">* Fields auto-save to cloud repository on blur.</p>
                              </div>

                              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center pt-2">
                                <Users className="w-4 h-4 mr-1 text-slate-550 shrink-0" />
                                Parent / Legal Guardian Contact
                              </h4>
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-3">
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Guardian / Primary Parent Name</p>
                                  <input 
                                    type="text"
                                    value={selectedStudent.parentName}
                                    onChange={(e) => {
                                      const updated = { ...selectedStudent, parentName: e.target.value };
                                      setSelectedStudent(updated);
                                    }}
                                    onBlur={() => saveStudentChanges(selectedStudent)}
                                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs mt-1 outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Guardian Email ID</p>
                                    <input 
                                      type="email"
                                      value={selectedStudent.parentEmail}
                                      onChange={(e) => {
                                        const updated = { ...selectedStudent, parentEmail: e.target.value };
                                        setSelectedStudent(updated);
                                      }}
                                      onBlur={() => saveStudentChanges(selectedStudent)}
                                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs mt-1 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Guardian Emergency Phone</p>
                                    <input 
                                      type="text"
                                      value={selectedStudent.parentPhone}
                                      onChange={(e) => {
                                        const updated = { ...selectedStudent, parentPhone: e.target.value };
                                        setSelectedStudent(updated);
                                      }}
                                      onBlur={() => saveStudentChanges(selectedStudent)}
                                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs mt-1 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Academic Milestones or Numerical Grades Tracker */}
                            <div className="space-y-4">
                              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center">
                                <Award className="w-4 h-4 mr-1 text-slate-550 shrink-0" />
                                Current Term Academic Records
                              </h4>

                              {selectedStudent.level === 'nursery' ? (
                                <div className="space-y-3 bg-indigo-50/10 border border-indigo-100/50 p-4 rounded-xl">
                                  <p className="text-slate-500 leading-normal">Configure early-childhood developmental milestones below:</p>
                                  <div className="space-y-2.5">
                                    {Object.entries(selectedStudent.milestones || {}).map(([mName, val]) => (
                                      <div key={mName} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-sm">
                                        <div className="font-semibold text-slate-800 pr-4">{mName}</div>
                                        <div className="flex space-x-1 font-bold text-[9px]">
                                          {(['Introduced', 'Developing', 'Mastered'] as const).map(milVal => (
                                            <button
                                              key={milVal}
                                              onClick={() => {
                                                const updatedMilestones = { ...selectedStudent.milestones, [mName]: milVal };
                                                const updated = { ...selectedStudent, milestones: updatedMilestones };
                                                setSelectedStudent(updated);
                                                saveStudentChanges(updated);
                                              }}
                                              className={`px-1.5 py-1 rounded transition-colors uppercase tracking-wider ${
                                                val === milVal ? 
                                                (milVal === 'Mastered' ? 'bg-emerald-600 text-white' : 
                                                 milVal === 'Developing' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white') : 
                                                'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                              }`}
                                            >
                                              {milVal}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                                  <p className="text-slate-500 leading-normal">Update continuous assessment term average (0 - 100) below:</p>
                                  <div className="space-y-2">
                                    {Object.entries(selectedStudent.grades || {}).map(([subject, score]) => (
                                      <div key={subject} className="p-2.5 bg-white border border-slate-200/60 rounded-lg flex items-center justify-between text-xs shadow-sm">
                                        <span className="font-semibold text-slate-700">{subject}</span>
                                        <div className="flex items-center space-x-2 shrink-0">
                                          <input 
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={score}
                                            onChange={(e) => {
                                              const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                              const updatedGrades = { ...selectedStudent.grades, [subject]: val };
                                              const updated = { ...selectedStudent, grades: updatedGrades };
                                              setSelectedStudent(updated);
                                            }}
                                            onBlur={() => saveStudentChanges(selectedStudent)}
                                            className="w-14 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-900"
                                          />
                                          <span className="font-semibold text-slate-400 text-right uppercase">/100</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="pt-2 flex justify-between items-center text-xs font-semibold bg-slate-900 text-slate-200 p-3 rounded-xl shadow-inner">
                                    <span>Cumulative Term GPA:</span>
                                    <span className="font-mono bg-indigo-600 px-3 py-1 rounded-lg text-white font-bold">
                                      Avg: {calculateGPA(selectedStudent.grades).avg}% ({calculateGPA(selectedStudent.grades).letter})
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        )}

                        {/* ----------------- TAB: STUDENT BOOK & WORK COVERAGE ----------------- */}
                        {drawerActiveTab === 'coverage' && (
                          <div className="animate-fade-in">
                            <StudentBookCoverageProfileView
                              student={selectedStudent}
                              teachingRecords={teachingRecords}
                              onSelectTeachingRecord={(record) => {
                                setActiveTab('classes');
                                setClassesSubTab('teaching_records');
                              }}
                            />
                          </div>
                        )}

                        {/* ----------------- TAB: CONDUCT & EXTRAS ----------------- */}
                        {drawerActiveTab === 'conduct' && (
                          <div className="space-y-6 animate-fade-in text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              
                              {/* Disciplinary filing system */}
                              <div className="space-y-4">
                                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest">Institutional Conduct Incident Log</h4>
                                <div className="bg-slate-50 p-4 border border-slate-200/50 rounded-xl space-y-3 shadow-sm">
                                  {(!selectedStudent.disciplinaryRecords || selectedStudent.disciplinaryRecords.length === 0) ? (
                                    <p className="text-slate-400 italic text-center py-4 bg-white border rounded-lg">Pristine standing: zero infractions registered.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {selectedStudent.disciplinaryRecords.map((rec, i) => (
                                        <div key={i} className="p-3 bg-white rounded-lg border space-y-2 relative shadow-inner">
                                          <div className="flex justify-between items-start">
                                            <span className="font-bold text-slate-900">{rec.date}</span>
                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded capitalize">
                                              {rec.status}
                                            </span>
                                          </div>
                                          <div>
                                            <p className="font-semibold text-slate-800">{rec.issue}</p>
                                            <p className="text-slate-500 mt-1">Proposed Resolution: {rec.action}</p>
                                          </div>
                                          <button 
                                            onClick={() => {
                                              const copy = [...(selectedStudent.disciplinaryRecords || [])];
                                              copy.splice(i, 1);
                                              const updated = { ...selectedStudent, disciplinaryRecords: copy };
                                              setSelectedStudent(updated);
                                              saveStudentChanges(updated);
                                            }}
                                            className="absolute top-1.5 right-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                          >
                                            ‚úï
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="border-t border-slate-250/50 pt-3 space-y-2">
                                    <p className="font-semibold text-slate-800">Record New Grievance Incident:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input 
                                        type="date"
                                        value={newDiscDate}
                                        onChange={(e) => setNewDiscDate(e.target.value)}
                                        className="bg-white border rounded px-1.5 py-1 text-slate-700 w-full"
                                      />
                                      <select 
                                        value={newDiscStatus}
                                        onChange={(e) => setNewDiscStatus(e.target.value)}
                                        className="bg-white border rounded px-1.5 py-1 text-slate-700 w-full"
                                      >
                                        <option value="Resolved">Resolved</option>
                                        <option value="Under Review">Under Review</option>
                                      </select>
                                    </div>
                                    <input 
                                      type="text"
                                      placeholder="Infraction Title..."
                                      value={newDiscIssue}
                                      onChange={(e) => setNewDiscIssue(e.target.value)}
                                      className="bg-white border rounded px-2.5 py-1 w-full text-slate-800"
                                    />
                                    <input 
                                      type="text"
                                      placeholder="Counseling action taken..."
                                      value={newDiscAction}
                                      onChange={(e) => setNewDiscAction(e.target.value)}
                                      className="bg-white border rounded px-2.5 py-1 w-full text-slate-800"
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        if(!newDiscIssue || !newDiscAction) return;
                                        const copy = [...(selectedStudent.disciplinaryRecords || [])];
                                        copy.push({
                                          date: newDiscDate,
                                          issue: newDiscIssue,
                                          action: newDiscAction,
                                          status: newDiscStatus
                                        });
                                        const updated = { ...selectedStudent, disciplinaryRecords: copy };
                                        setSelectedStudent(updated);
                                        saveStudentChanges(updated);
                                        setNewDiscIssue('');
                                        setNewDiscAction('');
                                        alert("Disciplinary grievance filed.");
                                      }}
                                      className="w-full bg-indigo-600 text-white py-1.5 font-bold rounded hover:bg-indigo-700 cursor-pointer"
                                    >
                                      File Incident Record
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Extracurriculars & Progression */}
                              <div className="space-y-4">
                                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest">Extracurricular Activities &amp; Clubs</h4>
                                <div className="bg-slate-50 p-4 border border-slate-200/50 rounded-xl space-y-3 hover:shadow shadow-sm">
                                  <div className="flex flex-wrap gap-1.5">
                                    {(!selectedStudent.extracurriculars || selectedStudent.extracurriculars.length === 0) ? (
                                      <p className="text-slate-400 italic text-center w-full py-2">No active extra-curricular enrollments.</p>
                                    ) : (
                                      selectedStudent.extracurriculars.map((tag, i) => (
                                        <span key={i} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-[5px] font-medium inline-flex items-center space-x-1.5">
                                          <span>{tag}</span>
                                          <button 
                                            onClick={() => {
                                              const copy = [...(selectedStudent.extracurriculars || [])];
                                              copy.splice(i, 1);
                                              const updated = { ...selectedStudent, extracurriculars: copy };
                                              setSelectedStudent(updated);
                                              saveStudentChanges(updated);
                                            }}
                                            className="text-slate-400 hover:text-rose-500 font-bold ml-1 cursor-pointer"
                                          >
                                            ‚úï
                                          </button>
                                        </span>
                                      ))
                                    )}
                                  </div>
                                  <div className="flex gap-1 pt-1.5">
                                    <input 
                                      type="text"
                                      placeholder="e.g. Volleyball, Robotics, Violin"
                                      value={newExtraText}
                                      onChange={(e) => setNewExtraText(e.target.value)}
                                      className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (!newExtraText.trim()) return;
                                          const copy = [...(selectedStudent.extracurriculars || [])];
                                          copy.push(newExtraText.trim());
                                          const updated = { ...selectedStudent, extracurriculars: copy };
                                          setSelectedStudent(updated);
                                          saveStudentChanges(updated);
                                          setNewExtraText('');
                                        }
                                      }}
                                    />
                                    <button 
                                      onClick={() => {
                                        if (!newExtraText.trim()) return;
                                        const copy = [...(selectedStudent.extracurriculars || [])];
                                        copy.push(newExtraText.trim());
                                        const updated = { ...selectedStudent, extracurriculars: copy };
                                        setSelectedStudent(updated);
                                        saveStudentChanges(updated);
                                        setNewExtraText('');
                                      }}
                                      className="bg-indigo-600 text-white font-bold py-1 px-3.5 rounded hover:bg-indigo-700"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest pt-2">Academic Progression Milestones</h4>
                                <div className="bg-slate-50 p-4 border border-slate-200/50 rounded-xl space-y-3 shadow-inner">
                                  {(!selectedStudent.academicProgression || selectedStudent.academicProgression.length === 0) ? (
                                    <p className="text-slate-400 italic text-center py-2">No historical promotional records stored.</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {selectedStudent.academicProgression.map((levelLog, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded-lg">
                                          <span className="font-bold text-slate-800">{levelLog.term}</span>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-[10px] text-slate-400 font-mono">Avg Score: {levelLog.avg}%</span>
                                            <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[9px] border border-emerald-100">
                                              {levelLog.status}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="pt-1 select-none">
                                    <p className="text-[10px] text-slate-400 leading-normal font-sans mb-3">
                                      * Promotional status is evaluated at the closure of the summer review term, matching continuous grading policies.
                                    </p>
                                  </div>

                                  {selectedStudentRestrictions?.activeRestrictions?.blockPromotion && (
                                    <div className="bg-rose-50 border border-rose-200/60 p-3 rounded-lg text-xs space-y-1 text-rose-800 font-sans">
                                      <p className="font-bold text-[11px] text-rose-950 flex items-center gap-1">
                                        <span>‚ùå Promotion Restricted by Billing Rules</span>
                                      </p>
                                      <p className="text-[10px] leading-normal text-rose-700">
                                        This student has outstanding overdue balances subject to active due-date template restriction rules. Academic promotion is locked until the ledger is settled.
                                      </p>
                                    </div>
                                  )}

                                  <div className="pt-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (selectedStudentRestrictions?.activeRestrictions?.blockPromotion) {
                                          alert("PROMOTION BLOCKED: Overdue fee restrictions prevent class promotion. Clear the outstanding balance first.");
                                          return;
                                        }
                                        const gradeStr = selectedStudent.grade || "Grade 1";
                                        const matches = gradeStr.match(/\d+/);
                                        const currentGradeNum = matches ? parseInt(matches[0]) : 1;
                                        const nextGrade = `Grade ${currentGradeNum + 1}`;
                                        
                                        const newLog = {
                                          term: `Term Promotion Review`,
                                          avg: 78,
                                          status: 'Promoted'
                                        };
                                        const updatedProgression = [...(selectedStudent.academicProgression || []), newLog];
                                        const updated = {
                                          ...selectedStudent,
                                          grade: nextGrade,
                                          academicProgression: updatedProgression
                                        };
                                        setSelectedStudent(updated);
                                        saveStudentChanges(updated);
                                        alert(`Academic Promotion Successful! Student has advanced to ${nextGrade}.`);
                                      }}
                                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-sans cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                                        selectedStudentRestrictions?.activeRestrictions?.blockPromotion
                                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                      }`}
                                    >
                                      ‚ö° Promote Student to Next Grade
                                    </button>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        )}

                        {/* ----------------- TAB: HEALTH RECORDS ----------------- */}
                        {drawerActiveTab === 'health' && (
                          <div className="space-y-4 animate-fade-in text-xs">
                            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest">Continuous School Heath &amp; Medical File</h4>
                            
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 max-w-2xl space-y-4 shadow-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Blood Group Category</label>
                                  <select 
                                    value={selectedStudent.healthInfo?.bloodGroup || selectedStudent.profile?.bloodGroup || 'O+'}
                                    onChange={(e) => {
                                      const info = selectedStudent.healthInfo || { allergies: 'None', medicalConditions: 'None', bloodGroup: 'O+', vaccinations: 'Routine complete' };
                                      const updated = { ...selectedStudent, healthInfo: { ...info, bloodGroup: e.target.value } };
                                      setSelectedStudent(updated);
                                      saveStudentChanges(updated);
                                    }}
                                    className="w-full bg-white border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 font-bold"
                                  >
                                    <option value="A+">A Positive (A+)</option>
                                    <option value="A-">A Negative (A-)</option>
                                    <option value="B+">B Positive (B+)</option>
                                    <option value="B-">B Negative (B-)</option>
                                    <option value="O+">O Positive (O+)</option>
                                    <option value="O-">O Negative (O-)</option>
                                    <option value="AB+">AB Positive (AB+)</option>
                                    <option value="AB-">AB Negative (AB-)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Immunization / Vaccinations Status</label>
                                  <input 
                                    type="text"
                                    value={selectedStudent.healthInfo?.vaccinations || ''}
                                    placeholder="e.g. Polio, MMR completed, HepB Booster up-to-date"
                                    onChange={(e) => {
                                      const info = selectedStudent.healthInfo || { allergies: 'None', medicalConditions: 'None', bloodGroup: 'O+', vaccinations: '' };
                                      const updated = { ...selectedStudent, healthInfo: { ...info, vaccinations: e.target.value } };
                                      setSelectedStudent(updated);
                                    }}
                                    onBlur={() => saveStudentChanges(selectedStudent)}
                                    className="w-full bg-white border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 text-slate-850"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Severe Allergies &amp; Dietary Restrictions</label>
                                <textarea 
                                  value={selectedStudent.healthInfo?.allergies || ''}
                                  placeholder="e.g. Severe Peanut hypersensitivity, Avoid eggs"
                                  onChange={(e) => {
                                    const info = selectedStudent.healthInfo || { allergies: '', medicalConditions: 'None', bloodGroup: 'O+', vaccinations: 'Routine complete' };
                                    const updated = { ...selectedStudent, healthInfo: { ...info, allergies: e.target.value } };
                                    setSelectedStudent(updated);
                                  }}
                                  onBlur={() => saveStudentChanges(selectedStudent)}
                                  rows={2}
                                  className="w-full bg-white border rounded px-2.5 py-1 text-slate-850 focus:ring-1 focus:ring-indigo-500 font-medium"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Other Active Medical Conditions / Notes</label>
                                <textarea 
                                  value={selectedStudent.healthInfo?.medicalConditions || ''}
                                  placeholder="e.g. Mild seasonal Asthma (Albuterol inhaler in backpack)"
                                  onChange={(e) => {
                                    const info = selectedStudent.healthInfo || { allergies: 'None', medicalConditions: '', bloodGroup: 'O+', vaccinations: 'Routine complete' };
                                    const updated = { ...selectedStudent, healthInfo: { ...info, medicalConditions: e.target.value } };
                                    setSelectedStudent(updated);
                                  }}
                                  onBlur={() => saveStudentChanges(selectedStudent)}
                                  rows={2}
                                  className="w-full bg-white border rounded px-2.5 py-1 text-slate-850 focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono italic">* Health modifications are synced to the parent portal instant dashboard securely.</p>
                            </div>
                          </div>
                        )}

                        {/* ----------------- TAB: ACCOUNT LEDGER ----------------- */}
                        {drawerActiveTab === 'finance' && (
                          <div className="space-y-5 animate-fade-in text-xs font-sans">
                            
                            {selectedStudentRestrictions?.isOverdue && (
                              <div className="bg-amber-50 border border-amber-200/85 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 text-amber-950 font-bold">
                                  <span>‚ö†Ô∏è Active Policy Restrictions Due to Overdue Balance</span>
                                </div>
                                <p className="text-[11px] text-amber-800 leading-normal">
                                  This student has overdue balances. The current Fee Template policy rules have automatically activated the following restrictions:
                                </p>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {selectedStudentRestrictions.activeRestrictions?.blockReportCard && (
                                    <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Report Card Locked</span>
                                  )}
                                  {selectedStudentRestrictions.activeRestrictions?.blockParentPortal && (
                                    <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Parent Portal Blocked</span>
                                  )}
                                  {selectedStudentRestrictions.activeRestrictions?.blockBooks && (
                                    <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Book Issuance Restricted</span>
                                  )}
                                  {selectedStudentRestrictions.activeRestrictions?.blockPromotion && (
                                    <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Promotion Locked</span>
                                  )}
                                  {selectedStudentRestrictions.activeRestrictions?.blockRegistration && (
                                    <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Registration Blocked</span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex flex-col md:flex-row gap-5">
                              
                              {/* Invoices List */}
                              <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest">Logged Invoices Ledger Status</h4>
                                  <span className="font-bold font-mono text-xs text-rose-600 bg-rose-50 px-2.5 py-1.5 border border-rose-100 rounded-lg">
                                    Total Outstanding: {currencySymbol}{selectedStudent.feeStatements?.outstandingBalance || 0}
                                  </span>
                                </div>

                                <div className="bg-white border rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm max-h-[300px] overflow-y-auto">
                                  {(!selectedStudent.feeStatements?.invoices || selectedStudent.feeStatements.invoices.length === 0) ? (
                                    <p className="py-8 text-center text-slate-400">No account ledger transactions registered.</p>
                                  ) : (
                                    selectedStudent.feeStatements.invoices.map((inv, i) => (
                                      <div key={inv.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between">
                                        <div className="space-y-1 pr-4">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-bold text-slate-900">{inv.description}</span>
                                            <span className="font-mono text-[9px] text-slate-400">({inv.id})</span>
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-medium">Post Date: {inv.date || 'May 20, 2026'} ‚Ä¢ Amount: ${inv.amount}</div>
                                        </div>

                                        <div className="flex items-center space-x-3 shrink-0">
                                          {inv.status === 'Unpaid' ? (
                                            <button
                                              onClick={() => {
                                                const invoices = [...(selectedStudent.feeStatements?.invoices || [])];
                                                const idx = invoices.findIndex(iv => iv.id === inv.id);
                                                if (idx !== -1) {
                                                  const targetInv = invoices[idx];
                                                  invoices[idx] = { ...targetInv, status: 'Paid', paid: targetInv.amount };
                                                }
                                                // re-evaluate balance:
                                                const outstanding = invoices.filter(iv => iv.status === 'Unpaid').reduce((acc, curr) => acc + (curr.amount - curr.paid), 0);
                                                const updated = {
                                                  ...selectedStudent,
                                                  feeStatements: { invoices, outstandingBalance: outstanding }
                                                };
                                                setSelectedStudent(updated);
                                                saveStudentChanges(updated);
                                                alert("Invoice settled successfully.");
                                              }}
                                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-950 font-bold text-[10px] px-2.5 py-1 rounded border border-emerald-100/50 transition-colors cursor-pointer"
                                            >
                                              Clear Balance
                                            </button>
                                          ) : (
                                            <span className="bg-slate-50 text-slate-450 border border-slate-200/50 px-2.5 py-1 text-[10px] font-bold rounded">
                                              Settled (${inv.paid})
                                            </span>
                                          )}

                                          <button 
                                            onClick={() => {
                                              const invoices = [...(selectedStudent.feeStatements?.invoices || [])].filter(iv => iv.id !== inv.id);
                                              const outstanding = invoices.filter(iv => iv.status === 'Unpaid').reduce((acc, curr) => acc + (curr.amount - curr.paid), 0);
                                              const updated = {
                                                ...selectedStudent,
                                                feeStatements: { invoices, outstandingBalance: outstanding }
                                              };
                                              setSelectedStudent(updated);
                                              saveStudentChanges(updated);
                                            }}
                                            className="text-slate-400 hover:text-rose-500 cursor-pointer"
                                          >
                                            ‚úï
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Form to Post Invoice */}
                              <div className="w-full md:w-80 bg-slate-50 p-4 border rounded-xl space-y-4 shadow-sm self-start">
                                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Issue New Assessment Bill</h4>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Invoice Description</label>
                                    <input 
                                      type="text"
                                      placeholder="e.g. Tuition Fee Term 3, Exam Lab Fee"
                                      value={newInvDesc}
                                      onChange={(e) => setNewInvDesc(e.target.value)}
                                      className="w-full bg-white border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-850"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Billing Amount (‚Ç¶ NGN)</label>
                                    <input 
                                      type="number"
                                      placeholder="500"
                                      value={newInvAmount}
                                      onChange={(e) => setNewInvAmount(e.target.value)}
                                      className="w-full bg-white border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-mono text-slate-850"
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (!newInvDesc.trim() || !newInvAmount) return;
                                      const amountNum = parseFloat(newInvAmount) || 0;
                                      
                                      const currentStatements = selectedStudent.feeStatements || { invoices: [], outstandingBalance: 0 };
                                      const currentInvoices = [...(currentStatements.invoices || [])];

                                      const createdInvoice: Invoice = {
                                        id: "inv-" + Math.floor(Math.random() * 1000000),
                                        description: newInvDesc,
                                        amount: amountNum,
                                        paid: 0,
                                        status: 'Unpaid',
                                        date: new Date().toISOString().split('T')[0]
                                      };

                                      currentInvoices.push(createdInvoice);
                                      const outstanding = currentInvoices.filter(iv => iv.status === 'Unpaid').reduce((acc, curr) => acc + (curr.amount - curr.paid), 0);

                                      const updated = {
                                        ...selectedStudent,
                                        feeStatements: {
                                          invoices: currentInvoices,
                                          outstandingBalance: outstanding
                                        }
                                      };

                                      setSelectedStudent(updated);
                                      saveStudentChanges(updated);
                                      setNewInvDesc('');
                                      alert("New student fee invoice generated.");
                                    }}
                                    className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer text-[11px]"
                                  >
                                    Post Assessment Bill
                                  </button>
                                </div>
                              </div>

                            </div>

                          </div>
                        )}

                        {drawerActiveTab === 'docs' && (
                          <div className="space-y-4 animate-fade-in text-xs">
                            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center">
                              <FileText className="w-4 h-4 mr-1 text-slate-500 shrink-0" />
                              Student Archive & Official Documents
                            </h4>
                            <p className="text-slate-500 leading-normal">
                              Upload and manage certified documents, birth certificates, and previous academic transcripts for this student record.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Left Side: Document Uploader */}
                              <div className="bg-slate-50 p-4 border rounded-xl space-y-4 shadow-sm self-start">
                                <h5 className="font-bold text-slate-800 uppercase tracking-wide">Upload New Document</h5>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Document Title</label>
                                    <input 
                                      type="text"
                                      placeholder="e.g. Birth Certificate, Transfer Certificate"
                                      value={newDocTitle}
                                      onChange={(e) => setNewDocTitle(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-850"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Document Category</label>
                                    <select 
                                      value={newDocCategory}
                                      onChange={(e) => setNewDocCategory(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800"
                                    >
                                      <option value="Birth Certificate">Birth Certificate</option>
                                      <option value="Transcript / Leaving Certificate">Transcript / Leaving Certificate</option>
                                      <option value="Medical Certificate">Medical Certificate</option>
                                      <option value="Parent Consent Form">Parent Consent Form</option>
                                      <option value="National ID / Passport">National ID / Passport</option>
                                      <option value="Other Document">Other Document</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Select File</label>
                                    <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-white hover:bg-slate-50/50 transition-colors cursor-pointer relative">
                                      <UploadCloud className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                                      <p className="text-[10px] text-slate-500 font-medium">Click to select file or drag & drop</p>
                                      <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            setNewDocFileMockName(file.name);
                                            if (!newDocTitle) setNewDocTitle(file.name.split('.')[0]);
                                          }
                                        }}
                                      />
                                    </div>
                                    {newDocFileMockName && (
                                      <p className="text-[10px] text-emerald-600 font-mono font-bold mt-1.5 flex items-center gap-1">
                                        <span>‚úì</span> {newDocFileMockName} (Ready to save)
                                      </p>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => {
                                      if (!newDocTitle.trim()) {
                                        alert("Please enter a document title.");
                                        return;
                                      }
                                      const mockId = "doc-" + Math.floor(Math.random() * 1000000);
                                      const newDoc = {
                                        id: mockId,
                                        title: newDocTitle,
                                        category: newDocCategory,
                                        fileName: newDocFileMockName || `${newDocTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
                                        uploadDate: new Date().toISOString().split('T')[0]
                                      };
                                      
                                      const currentDocs = (selectedStudent as any).documents || [
                                        { id: 'doc-1', title: 'Birth Certificate', category: 'Birth Certificate', fileName: 'birth_cert_official.pdf', uploadDate: '2025-09-12' },
                                        { id: 'doc-2', title: 'Primary School Transcript', category: 'Transcript / Leaving Certificate', fileName: 'leaving_cert_grade_3.pdf', uploadDate: '2025-10-18' }
                                      ];
                                      
                                      const updatedDocs = [...currentDocs, newDoc];
                                      const updated = {
                                        ...selectedStudent,
                                        documents: updatedDocs
                                      };
                                      
                                      setSelectedStudent(updated as any);
                                      saveStudentChanges(updated as any);
                                      setNewDocTitle('');
                                      setNewDocFileMockName('');
                                      alert("Document uploaded and archived successfully!");
                                    }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors shadow-sm cursor-pointer text-[11px]"
                                  >
                                    Save to Archive
                                  </button>
                                </div>
                              </div>
                              
                              {/* Right Side: Archived Documents Table */}
                              <div className="md:col-span-2 space-y-4 bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm">
                                <h5 className="font-bold text-slate-800 uppercase tracking-wide">Archived Document Vault</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-[11px]">
                                    <thead>
                                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                                        <th className="p-2.5">Document Title</th>
                                        <th className="p-2.5">Category</th>
                                        <th className="p-2.5">File Name</th>
                                        <th className="p-2.5">Upload Date</th>
                                        <th className="p-2.5 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {(((selectedStudent as any).documents || [
                                        { id: 'doc-1', title: 'Birth Certificate', category: 'Birth Certificate', fileName: 'birth_cert_official.pdf', uploadDate: '2025-09-12' },
                                        { id: 'doc-2', title: 'Primary School Transcript', category: 'Transcript / Leaving Certificate', fileName: 'leaving_cert_grade_3.pdf', uploadDate: '2025-10-18' }
                                      ]) as any[]).map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-50/50">
                                          <td className="p-2.5 font-bold text-slate-900">{doc.title}</td>
                                          <td className="p-2.5">
                                            <span className="bg-indigo-50 text-indigo-750 font-semibold px-2 py-0.5 rounded text-[9px] border border-indigo-100">
                                              {doc.category}
                                            </span>
                                          </td>
                                          <td className="p-2.5 font-mono text-slate-500">{doc.fileName}</td>
                                          <td className="p-2.5 text-slate-400 font-mono">{doc.uploadDate}</td>
                                          <td className="p-2.5 text-right space-x-2">
                                            <button
                                              onClick={() => alert(`Downloading document: ${doc.fileName}`)}
                                              className="text-indigo-600 hover:text-indigo-850 font-bold hover:underline cursor-pointer"
                                            >
                                              Download
                                            </button>
                                            <button
                                              onClick={() => {
                                                const currentDocs = (selectedStudent as any).documents || [
                                                  { id: 'doc-1', title: 'Birth Certificate', category: 'Birth Certificate', fileName: 'birth_cert_official.pdf', uploadDate: '2025-09-12' },
                                                  { id: 'doc-2', title: 'Primary School Transcript', category: 'Transcript / Leaving Certificate', fileName: 'leaving_cert_grade_3.pdf', uploadDate: '2025-10-18' }
                                                ];
                                                const updatedDocs = currentDocs.filter((d: any) => d.id !== doc.id);
                                                const updated = {
                                                  ...selectedStudent,
                                                  documents: updatedDocs
                                                };
                                                setSelectedStudent(updated as any);
                                                saveStudentChanges(updated as any);
                                              }}
                                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                              title="Delete Document"
                                            >
                                              ‚úï
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {drawerActiveTab === 'id' && (
                          <div className="space-y-4 animate-fade-in text-xs">
                            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center">
                              <Award className="w-4 h-4 mr-1 text-indigo-600 shrink-0" />
                              Digital Student ID Card Generator
                            </h4>
                            <p className="text-slate-500 leading-normal">
                              Format, customize, and print a beautifully rendered, double-sided, official SAMS Student Identity Badge complete with high-definition barcodes and principal signatures.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Left Side: ID Card Customization Panel */}
                              <div className="bg-slate-50 p-4 border rounded-xl space-y-4 shadow-sm self-start">
                                <h5 className="font-bold text-slate-800 uppercase tracking-wide">ID Badge Settings</h5>
                                
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Color Scheme Theme</label>
                                    <select 
                                      value={idCardTheme}
                                      onChange={(e) => setIdCardTheme(e.target.value as any)}
                                      className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 font-semibold text-slate-800"
                                    >
                                      <option value="indigo">SAMS Indigo Classic</option>
                                      <option value="emerald">SAMS Emerald Premium</option>
                                      <option value="amber">SAMS Amber Academic</option>
                                      <option value="midnight">SAMS Midnight Luxury</option>
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Validity Period / Academic Session</label>
                                    <input 
                                      type="text"
                                      value={idCardValidity}
                                      onChange={(e) => setIdCardValidity(e.target.value)}
                                      placeholder="e.g. 2025 / 2026 Academic Year"
                                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 outline-none font-medium"
                                    />
                                  </div>
                                  
                                  <div className="flex items-center justify-between p-1">
                                    <span className="font-semibold text-slate-700">Display Barcode ID</span>
                                    <input 
                                      type="checkbox"
                                      checked={idCardShowBarcode}
                                      onChange={(e) => setIdCardShowBarcode(e.target.checked)}
                                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded cursor-pointer"
                                    />
                                  </div>
                                  
                                  <div className="border-t border-slate-200 pt-3">
                                    <button
                                      onClick={() => {
                                        window.print();
                                      }}
                                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors shadow-sm cursor-pointer text-[11px] flex items-center justify-center gap-1.5"
                                    >
                                      <span>üñ®Ô∏è</span> Print Identity Badge
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right Side: Render Double-Sided ID Badge */}
                              <div className="md:col-span-2 space-y-6 flex flex-col items-center">
                                <div className="flex flex-col sm:flex-row gap-6">
                                  {/* Front Side of ID Card */}
                                  <div className="w-80 h-48 rounded-xl shadow-lg relative overflow-hidden flex flex-col text-white font-sans border border-slate-200" style={{
                                    background: idCardTheme === 'indigo' ? 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)' :
                                                idCardTheme === 'emerald' ? 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' :
                                                idCardTheme === 'amber' ? 'linear-gradient(135deg, #d97706 0%, #78350f 100%)' :
                                                'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                                  }}>
                                    {/* SAMS Branding Header */}
                                    <div className="px-4 py-2 bg-black/15 flex items-center justify-between border-b border-white/10">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded bg-white flex items-center justify-center">
                                          <span className="font-black text-[10px]" style={{
                                            color: idCardTheme === 'indigo' ? '#4f46e5' :
                                                   idCardTheme === 'emerald' ? '#059669' :
                                                   idCardTheme === 'amber' ? '#d97706' :
                                                   '#1e293b'
                                          }}>S</span>
                                        </div>
                                        <span className="font-black text-[10px] tracking-widest uppercase">SAMS MULTI-BRANCH</span>
                                      </div>
                                      <span className="text-[7.5px] font-bold font-mono tracking-widest bg-white/20 px-1 py-0.2 rounded">STUDENT ID</span>
                                    </div>
                                    
                                    {/* Card Content body */}
                                    <div className="flex-1 p-4 flex gap-4">
                                      {/* Student Photo */}
                                      <div className="w-16 h-20 rounded-lg bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                                        {selectedStudent.photoUrl ? (
                                          <img 
                                            src={selectedStudent.photoUrl} 
                                            alt={selectedStudent.name} 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="text-center p-1 uppercase font-bold text-[9px] text-white/70 leading-none">
                                            No Photo
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Student Details */}
                                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div className="space-y-1">
                                          <h6 className="font-black text-sm uppercase tracking-tight truncate leading-tight">{selectedStudent.name}</h6>
                                          <p className="text-[9.5px] font-bold text-white/80 leading-none">Grade Placement: <span className="font-black underline">{selectedStudent.grade}</span></p>
                                          <p className="text-[8.5px] text-white/70 font-mono">Admission No: {selectedStudent.enrollmentNo || `ADM-${selectedStudent.id}`}</p>
                                        </div>
                                        
                                        <div className="flex justify-between items-end">
                                          <div className="text-[8px] text-white/70 uppercase">
                                            <span className="font-bold block text-white/90 font-mono">Campus Branch</span>
                                            {selectedStudent.branch === 'RS' ? 'Runjin Sambo' : 'Gawun Nama'}
                                          </div>
                                          <div className="text-[8px] text-white/70 uppercase text-right">
                                            <span className="font-bold block text-white/90 font-mono">Validity Period</span>
                                            {idCardValidity}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Back Side of ID Card */}
                                  <div className="w-80 h-48 rounded-xl shadow-lg relative overflow-hidden flex flex-col text-slate-800 font-sans border border-slate-200 bg-white">
                                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                      <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">SOCIETY FOR ACADEMIC MONITORS SCHOOLS</span>
                                    </div>
                                    
                                    <div className="flex-1 p-3 flex flex-col justify-between text-[9px] leading-tight text-slate-600">
                                      <div className="space-y-1.5">
                                        <p className="font-semibold text-slate-500 text-[8px] uppercase tracking-wider">Emergency Guardian Contacts:</p>
                                        <div className="grid grid-cols-2 gap-2 text-[9px]">
                                          <div>
                                            <span className="font-bold block text-slate-400 text-[7px] uppercase leading-none">Primary Guardian</span>
                                            <span className="font-bold text-slate-800 truncate block">{selectedStudent.parentName || 'None Listed'}</span>
                                          </div>
                                          <div>
                                            <span className="font-bold block text-slate-400 text-[7px] uppercase leading-none">Emergency Phone</span>
                                            <span className="font-bold text-slate-800 font-mono block">{selectedStudent.parentPhone || 'No contact'}</span>
                                          </div>
                                          <div>
                                            <span className="font-bold block text-slate-400 text-[7px] uppercase leading-none">Blood Group</span>
                                            <span className="font-bold text-rose-700 block">{selectedStudent.healthInfo?.bloodGroup || selectedStudent.profile?.bloodGroup || 'O+'}</span>
                                          </div>
                                          <div>
                                            <span className="font-bold block text-slate-400 text-[7px] uppercase leading-none">Severe Allergies</span>
                                            <span className="font-bold text-amber-700 truncate block">{selectedStudent.healthInfo?.allergies || 'None'}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Barcode and Signature */}
                                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                                        {/* Mock Barcode display */}
                                        {idCardShowBarcode ? (
                                          <div className="flex flex-col items-start gap-0.5">
                                            <div className="flex items-center h-5 gap-0.5 shrink-0 bg-slate-100 px-1 py-0.5 rounded">
                                              {[1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1].map((width, idx) => (
                                                <div key={idx} className="bg-slate-900 h-full" style={{ width: `${width}px` }} />
                                              ))}
                                            </div>
                                            <span className="text-[7px] font-mono text-slate-400 tracking-wider">*{selectedStudent.id.substring(0, 8)}*</span>
                                          </div>
                                        ) : (
                                          <div />
                                        )}
                                        
                                        {/* Principal Signature */}
                                        <div className="text-right flex flex-col items-end">
                                          <div className="font-serif italic text-slate-500 font-semibold text-[10px] leading-none mb-0.5 relative pr-1">
                                            M. Bala Sani
                                            <div className="absolute top-1/2 left-0 w-full h-0.5 border-t border-indigo-300 -rotate-6 transform -translate-y-1/2 scale-110 opacity-70" />
                                          </div>
                                          <span className="font-bold text-slate-400 text-[6.5px] uppercase tracking-wider block">Authorized Signature</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-455 italic font-medium mt-1">
                                  üí° Design conforms to SAMS multi-branch corporate identity standards. Front elements adapt dynamically.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                    </>
                  )}

                  {/* PROMOTION SUBTAB VIEW */}
                  {studentsSubTab === 'promotion' && (
                    <div className="space-y-6 animate-fade-in text-xs font-sans">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Academic Promotion Matrix</h3>
                            <p className="text-slate-500 text-[11px]">Advance entire cohorts or individual students to the next class grade based on year-end continuous averages.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Class Cohort</label>
                            <select
                              value={promotionClassFilter}
                              onChange={(e) => setPromotionClassFilter(e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {studentGradesList.map(grade => (
                                <option key={grade} value={grade}>{grade}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Cohort list table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-455 font-bold uppercase tracking-wider">
                                <th className="p-3">Serial No</th>
                                <th className="p-3">Student Name</th>
                                <th className="p-3">Admission No</th>
                                <th className="p-3">Branch</th>
                                <th className="p-3 text-center">Academic Avg Score</th>
                                <th className="p-3">Current Grade</th>
                                <th className="p-3">Proposed Advancement</th>
                                <th className="p-3">Restriction Status</th>
                                <th className="p-3 text-right">Advancement Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {branchStudents.filter(s => s.grade === promotionClassFilter).length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                                    No student records registered in cohort "{promotionClassFilter}" for the selected {selectedBranch === 'RS' ? 'Runjin Sambo' : 'Gawun Nama'} branch.
                                  </td>
                                </tr>
                              ) : (
                                branchStudents.filter(s => s.grade === promotionClassFilter).map((std, idx) => {
                                  // calculate average score
                                  const scores = Object.values(std.grades || {}) as number[];
                                  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;
                                  
                                  // determine next grade
                                  const gradeStr = std.grade || "Grade 1";
                                  const matches = gradeStr.match(/\d+/);
                                  const currentGradeNum = matches ? parseInt(matches[0]) : 1;
                                  const nextGradeStr = `Grade ${currentGradeNum + 1}`;
                                  
                                  // check restrictions
                                  const outstanding = std.feeStatements?.outstandingBalance || 0;
                                  const isRestricted = outstanding > 0;
                                  
                                  return (
                                    <tr key={std.id} className="hover:bg-slate-50/50">
                                      <td className="p-3 font-mono font-bold text-slate-400">#{std.serialNumber || (idx + 1)}</td>
                                      <td className="p-3 font-bold text-slate-900">{std.name}</td>
                                      <td className="p-3 font-mono text-slate-500">{std.enrollmentNo || `ADM-${std.id}`}</td>
                                      <td className="p-3 font-semibold text-slate-600">{std.branch || 'GN'}</td>
                                      <td className="p-3 text-center">
                                        <span className={`font-bold font-mono px-2 py-1 rounded text-xs ${
                                          avgScore >= 75 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                          avgScore >= 50 ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                                          'bg-amber-50 text-amber-800 border border-amber-200'
                                        }`}>
                                          {avgScore}%
                                        </span>
                                      </td>
                                      <td className="p-3 font-semibold text-slate-700">{std.grade}</td>
                                      <td className="p-3 font-black text-indigo-700">{nextGradeStr}</td>
                                      <td className="p-3">
                                        {isRestricted ? (
                                          <span className="bg-rose-50 text-rose-800 border border-rose-100 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                            Blocked (‚Ç¶{outstanding} Overdue)
                                          </span>
                                        ) : (
                                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                            Clear
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3 text-right">
                                        <button
                                          disabled={isRestricted}
                                          onClick={() => {
                                            const updatedProgression = [...(std.academicProgression || []), {
                                              term: `Term Promotion Review`,
                                              avg: avgScore,
                                              status: 'Promoted'
                                            }];
                                            const updated = {
                                              ...std,
                                              grade: nextGradeStr,
                                              academicProgression: updatedProgression
                                            };
                                            const updatedStudentsList = students.map(s => s.id === std.id ? updated : s);
                                            setStudents(updatedStudentsList);
                                            saveStudentChanges(updated);
                                            alert(`Student "${std.name}" has been promoted to ${nextGradeStr} successfully!`);
                                          }}
                                          className={`py-1 px-3 rounded font-bold text-[10px] transition-all cursor-pointer ${
                                            isRestricted 
                                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                          }`}
                                        >
                                          ‚ö° Promote
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Bulk Promotion triggers */}
                        {branchStudents.filter(s => s.grade === promotionClassFilter && (s.feeStatements?.outstandingBalance || 0) === 0).length > 0 && (
                          <div className="flex justify-end pt-3 border-t border-slate-100">
                            <button
                              onClick={() => {
                                let promotedCount = 0;
                                const updatedStudentsList = students.map(std => {
                                  if (std.branch === selectedBranch && std.grade === promotionClassFilter) {
                                    const outstanding = std.feeStatements?.outstandingBalance || 0;
                                    if (outstanding === 0) {
                                      promotedCount++;
                                      const scores = Object.values(std.grades || {}) as number[];
                                      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;
                                      
                                      const gradeStr = std.grade || "Grade 1";
                                      const matches = gradeStr.match(/\d+/);
                                      const currentGradeNum = matches ? parseInt(matches[0]) : 1;
                                      const nextGradeStr = `Grade ${currentGradeNum + 1}`;
                                      
                                      const updatedProgression = [...(std.academicProgression || []), {
                                        term: `Term Promotion Review (Bulk)`,
                                        avg: avgScore,
                                        status: 'Promoted'
                                      }];
                                      
                                      const updatedStd = {
                                        ...std,
                                        grade: nextGradeStr,
                                        academicProgression: updatedProgression
                                      };
                                      saveStudentChanges(updatedStd);
                                      return updatedStd;
                                    }
                                  }
                                  return std;
                                });
                                
                                setStudents(updatedStudentsList);
                                alert(`Success! Bulk promotion executed for ${promotedCount} eligible students in cohort "${promotionClassFilter}".`);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-550/10 cursor-pointer"
                            >
                              <span>‚ö°</span> Bulk Promote All Eligible Cohort Students
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TRANSFER SUBTAB VIEW */}
                  {studentsSubTab === 'transfer' && (
                    <div className="space-y-6 animate-fade-in text-xs font-sans">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Transfer Form Box */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 self-start">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Execute Campus Branch Transfer</h3>
                          <p className="text-slate-500 text-[11px] leading-relaxed">
                            Officially relocate a student's administrative registry records between Gawun Nama (GN) and Runjin Sambo (RS) school campus systems.
                          </p>
                          
                          <div className="space-y-3 pt-2">
                            <div>
                              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Select Student to Relocate</label>
                              <select
                                value={selectedTransferStudentId}
                                onChange={(e) => setSelectedTransferStudentId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                              >
                                <option value="">-- Choose Student Record --</option>
                                {students.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.grade} ‚Ä¢ Branch {s.branch || 'GN'})
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Destination Campus Branch</label>
                              <select
                                value={transferDestinationBranch}
                                onChange={(e) => setTransferDestinationBranch(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                              >
                                <option value="RS">Runjin Sambo (RS) Campus</option>
                                <option value="GN">Gawun Nama (GN) Campus</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Official Transfer Reasoning / Memo</label>
                              <textarea
                                value={transferReason}
                                onChange={(e) => setTransferReason(e.target.value)}
                                rows={3}
                                placeholder="e.g. Parental housing relocation, optimal transport routing constraints, etc."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                              />
                            </div>
                            
                            <button
                              onClick={() => {
                                if (!selectedTransferStudentId) {
                                  alert("Please select a student record to transfer.");
                                  return;
                                }
                                const targetStudent = students.find(s => s.id === selectedTransferStudentId);
                                if (!targetStudent) return;
                                
                                const originalBranch = targetStudent.branch || 'GN';
                                if (originalBranch === transferDestinationBranch) {
                                  alert(`Relocation rejected: Student "${targetStudent.name}" is already registered on campus branch "${transferDestinationBranch}".`);
                                  return;
                                }
                                
                                const updatedStudent = {
                                  ...targetStudent,
                                  branch: transferDestinationBranch
                                };
                                
                                const updatedStudentsList = students.map(s => s.id === selectedTransferStudentId ? updatedStudent : s);
                                setStudents(updatedStudentsList);
                                saveStudentChanges(updatedStudent);
                                
                                const newLog = {
                                  id: 'tx-' + Math.floor(Math.random() * 1000000),
                                  studentName: targetStudent.name,
                                  fromBranch: originalBranch,
                                  toBranch: transferDestinationBranch,
                                  date: new Date().toISOString().split('T')[0],
                                  reason: transferReason || "General administrative reassignment."
                                };
                                
                                setTransferLogs([newLog, ...transferLogs]);
                                setTransferReason('');
                                setSelectedTransferStudentId('');
                                alert(`Campus Reassignment Complete! Student "${targetStudent.name}" has been transferred from "${originalBranch}" to "${transferDestinationBranch}".`);
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                            >
                              üöÄ Reassign Campus Branch
                            </button>
                          </div>
                        </div>

                        {/* Transfer History Table */}
                        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Campus Relocation & Reassignment Audit Registry</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-455 font-bold uppercase tracking-wider">
                                  <th className="p-3">Audit Date</th>
                                  <th className="p-3">Student Record</th>
                                  <th className="p-3">Transferred From</th>
                                  <th className="p-3">Destination Campus</th>
                                  <th className="p-3">relocation memo & reasoning</th>
                                  <th className="p-3 text-right">status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {transferLogs.map((log) => (
                                  <tr key={log.id} className="hover:bg-slate-50/50">
                                    <td className="p-3 font-mono font-bold text-slate-400">{log.date}</td>
                                    <td className="p-3 font-bold text-slate-900">{log.studentName}</td>
                                    <td className="p-3">
                                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold">
                                        Campus {log.fromBranch}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <span className="bg-indigo-50 text-indigo-800 border border-indigo-150 px-2 py-0.5 rounded text-[9px] font-bold">
                                        Campus {log.toBranch}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-500 italic max-w-xs truncate">{log.reason}</td>
                                    <td className="p-3 text-right">
                                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">
                                        ARCHIVED & SECURE
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* -------------------------------------------------------------
                  TAB 3: TEACHERS PORTAL (CRUD)
                  ------------------------------------------------------------- */}
              {activeTab === 'teachers' && (
                <div id="erp-view-teachers" className="space-y-6">
                  
                  {selectedTeacher ? (
                    <div className="bg-slate-50 border border-slate-200/85 rounded-3xl p-6 shadow-sm space-y-6">
                      {/* ==========================================
                         COMPREHENSIVE TEACHER DIRECTORY WORKSPACE
                         ========================================== */}
                      
                      {/* Sub-Header Back Navigation */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setSelectedTeacher(null)}
                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl p-2.5 transition-all flex items-center justify-center shadow-sm hover:shadow cursor-pointer shrink-0"
                            title="Back to Faculty Registry"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          
                          {/* Teacher Photo Header Placement */}
                          <div className="shrink-0">
                            {selectedTeacher.photoUrl ? (
                              <img
                                src={selectedTeacher.photoUrl}
                                alt={selectedTeacher.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200/50 shadow-3xs"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-3xs uppercase">
                                {selectedTeacher.name ? selectedTeacher.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <h2 className="text-xl font-bold text-slate-900">{selectedTeacher.name}</h2>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                (selectedTeacher.status || 'Active') === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-205' 
                                  : (selectedTeacher.status || 'Active') === 'Terminated'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse'
                                  : (selectedTeacher.status || 'Active') === 'Deactivated'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300 font-extrabold'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                              }`}>
                                {selectedTeacher.status || 'Active'}
                              </span>
                            </div>
                            {selectedTeacher.statusChangeReason && (
                              <div className="mt-1.5 bg-rose-50 border border-rose-200/60 rounded-xl p-2.5 text-xs text-rose-900">
                                <span className="font-bold block">üìå Exit Comments / Status Reason:</span>
                                <p className="font-medium font-sans mt-0.5">{selectedTeacher.statusChangeReason}</p>
                              </div>
                            )}
                            <p className="text-xs text-slate-500">
                              Faculty ID: <span className="font-mono font-semibold text-indigo-600">{selectedTeacher.id}</span> ‚Ä¢ Specialised in {selectedTeacher.subjects?.join(', ') || 'General subjects'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setExitModalTeacher({ ...selectedTeacher });
                              setShowStaffExitModal(true);
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            <span>Status Control / Exit</span>
                          </button>
                          <button
                            onClick={() => setSelectedTeacher(null)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Close Folder
                          </button>
                        </div>
                      </div>

                      {/* Highlight summary cards ribbon */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Qualification</span>
                          <span className="text-xs font-bold text-slate-800 block mt-1 truncate" title={selectedTeacher.qualification}>
                            {selectedTeacher.qualification || "Credentials Missing"}
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Grades</span>
                          <span className="text-xs font-bold text-slate-800 block mt-1">
                            {selectedTeacher.classesAssigned?.join(', ') || "None allocated"}
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Joining Date</span>
                          <span className="text-xs font-mono font-semibold text-slate-700 block mt-1">
                            {selectedTeacher.joiningDate || "N/A"}
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Performance Index</span>
                          <span className="text-xs font-bold text-slate-800 mt-1 flex items-center space-x-1">
                            <span className="text-amber-500">‚òÖ</span>
                            <span>
                              {selectedTeacher.performance && selectedTeacher.performance.length > 0
                                ? (selectedTeacher.performance.reduce((acc, curr) => acc + curr.rating, 0) / selectedTeacher.performance.length).toFixed(1)
                                : "N/A"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({selectedTeacher.performance?.length || 0} reviews)
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Folder Work Area Tabs Navigation */}
                      <div className="flex border-b border-slate-200/70 overflow-x-auto gap-1 pb-px scrollbar-thin">
                        <button
                          onClick={() => setTeacherFolderTab('profile')}
                          className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                            teacherFolderTab === 'profile'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>Profile &amp; Workloads</span>
                        </button>
                        <button
                          onClick={() => setTeacherFolderTab('branchIdentity')}
                          className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                            teacherFolderTab === 'branchIdentity'
                              ? 'border-indigo-600 text-indigo-600 font-bold'
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                          <span>Branch &amp; IAM Identity üè¢</span>
                        </button>
                        <button
                          onClick={() => setTeacherFolderTab('schedule')}
                          className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                            teacherFolderTab === 'schedule'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                          <span>Timetable Schedule</span>
                        </button>
                        <button
                          onClick={() => setTeacherFolderTab('attendance')}
                          className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                            teacherFolderTab === 'attendance'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Attendance &amp; Leaves</span>
                        </button>
                        <button
                          onClick={() => setTeacherFolderTab('payroll')}
                          className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                            teacherFolderTab === 'payroll'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5 shrink-0" />
                          <span>Payroll Desk</span>
                        </button>
                        <button
                          onClick={() => setTeacherFolderTab('performance')}
                          className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                            teacherFolderTab === 'performance'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                          <span>Performance Appraisal</span>
                        </button>
                        <button
                          onClick={() => setTeacherFolderTab('lessons')}
                          className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                            teacherFolderTab === 'lessons'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>Lesson Plans</span>
                        </button>
                        <button
                          onClick={() => setTeacherFolderTab('tools')}
                          className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                            teacherFolderTab === 'tools'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <GraduationCap className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                          <span className="text-indigo-600 font-bold">Grading &amp; Homework Desk</span>
                        </button>
                      </div>

                      {/* Tab Content Display Switcher */}
                      <div className="mt-4">
                        
                        {/* 1. PERSONAL PROFILE & WORKLOAD TAB */}
                        {teacherFolderTab === 'profile' && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Update Profile Form */}
                            <div className="md:col-span-2 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                                <Sliders className="w-4 h-4 text-indigo-600" />
                                <span>Modify Faculty Credentials &amp; Assignments</span>
                              </h3>
                              
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                saveTeacherChanges(selectedTeacher);
                                alert("Faculty credentials committed successfully.");
                              }} className="space-y-3.5 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Full Representative Name</label>
                                    <input
                                      type="text"
                                      value={selectedTeacher.name}
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, name: e.target.value })}
                                      className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Official Institutional Email</label>
                                    <input
                                      type="email"
                                      value={selectedTeacher.email}
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, email: e.target.value })}
                                      className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Contact Telephone Code</label>
                                    <input
                                      type="text"
                                      value={selectedTeacher.phone || ''}
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, phone: e.target.value })}
                                      className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Highest Earned Qualification</label>
                                    <input
                                      type="text"
                                      value={selectedTeacher.qualification || ''}
                                      placeholder="e.g. PhD in Organic Chemistry"
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, qualification: e.target.value })}
                                      className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Registry Commencement (Joining Date)</label>
                                    <input
                                      type="date"
                                      value={selectedTeacher.joiningDate || ''}
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, joiningDate: e.target.value })}
                                      className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Status Identifier</label>
                                    <select
                                      value={selectedTeacher.status || 'Active'}
                                      onChange={(e) => {
                                        const nextStatus = e.target.value;
                                        setSelectedTeacher({ 
                                          ...selectedTeacher, 
                                          status: nextStatus,
                                          statusChangeReason: (nextStatus === 'Deactivated' || nextStatus === 'Terminated') 
                                            ? (selectedTeacher.statusChangeReason || '') 
                                            : ''
                                        });
                                      }}
                                      className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-semibold"
                                    >
                                      <option value="Active">Active</option>
                                      <option value="On Leave">On Leave</option>
                                      <option value="Suspended">Suspended</option>
                                      <option value="Deactivated">Deactivated</option>
                                      <option value="Terminated">Terminated</option>
                                    </select>
                                  </div>
                                </div>

                                {((selectedTeacher.status === 'Deactivated') || (selectedTeacher.status === 'Terminated')) && (
                                  <div className="bg-rose-50 border border-rose-220 rounded-2xl p-4 space-y-1.5">
                                    <label className="text-[10px] text-rose-800 uppercase tracking-wider block font-bold">
                                      Reason for Deactivation / Termination <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                      rows={2}
                                      placeholder="Please spell out grounds of deactivation, termination packages, or transition details..."
                                      value={selectedTeacher.statusChangeReason || ''}
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, statusChangeReason: e.target.value })}
                                      className="w-full bg-white border border-rose-250 rounded-lg p-2.5 text-xs text-rose-900 placeholder-rose-300 focus:ring-1 focus:ring-rose-500 outline-none font-sans font-medium"
                                      required
                                    />
                                  </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                                  <div>
                                    <label className="text-[10px] text-indigo-700 uppercase tracking-wider block font-bold mb-1">HR Staff Role Category</label>
                                    <select
                                      value={selectedTeacher.role || 'teaching'}
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, role: e.target.value as any })}
                                      className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1 outline-none font-semibold"
                                    >
                                      <option value="teaching">Teaching Staff</option>
                                      <option value="non-teaching">Non-Teaching Staff</option>
                                      <option value="management">Management Staff</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">Personnel Employee ID</label>
                                    <input
                                      type="text"
                                      value={selectedTeacher.userId || ''}
                                      placeholder="e.g. EMP-2201"
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, userId: e.target.value })}
                                      className="w-full bg-white border border-slate-205 rounded-lg px-2 py-1 outline-none font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">Access Control Group</label>
                                    <select
                                      value={selectedTeacher.accessControl || 'Staff/Teacher'}
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, accessControl: e.target.value as any })}
                                      className="w-full bg-white border border-slate-205 rounded-lg px-2 py-1 outline-none"
                                    >
                                      <option value="Staff/Teacher">Staff / Teacher</option>
                                      <option value="Admin">Admin</option>
                                      <option value="Manager">Manager</option>
                                      <option value="Guest">Guest</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Weekly Unit Capacity Limit</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={selectedTeacher.maxUnits || 20}
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, maxUnits: Number(e.target.value) })}
                                      className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-mono font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Productivity / Reliability Index (%)</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={selectedTeacher.performanceScore || 80}
                                      onChange={(e) => setSelectedTeacher({ ...selectedTeacher, performanceScore: Number(e.target.value) })}
                                      className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-mono font-bold"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Residential Address</label>
                                  <input
                                    type="text"
                                    value={selectedTeacher.address || ''}
                                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, address: e.target.value })}
                                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                  />
                                </div>

                                <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl space-y-1.5">
                                  <label className="text-[10px] text-violet-800 uppercase tracking-widest block font-extrabold flex items-center">
                                    <Sparkles className="w-3.5 h-3.5 text-violet-600 mr-1 animate-pulse" />
                                    Active Campus Branch Allocation
                                  </label>
                                  <select
                                    value={selectedTeacher.branch || 'GN'}
                                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, branch: e.target.value as 'GN' | 'RS' })}
                                    className="w-full bg-white border border-violet-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-violet-900"
                                  >
                                    <option value="GN">Gawun Nama (GN)</option>
                                    <option value="RS">Runjin Sambo (RS)</option>
                                  </select>
                                  <span className="text-[10px] text-slate-400 block font-medium">
                                    Teachers can switch branches at any given time. This modifies classroom allocations and system access controls instantly.
                                  </span>
                                </div>

                                <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] text-indigo-700 uppercase tracking-wider block font-bold mb-1">Select Specialities from Syllabus</label>
                                    {subjects.length > 0 ? (
                                      <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1">
                                        {subjects.map(s => {
                                          const checked = selectedTeacher.subjects?.includes(s.name) || false;
                                          return (
                                            <label key={s.id} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer font-sans leading-none">
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                  let current = selectedTeacher.subjects || [];
                                                  if (e.target.checked) {
                                                    current = [...current, s.name];
                                                  } else {
                                                    current = current.filter(x => x !== s.name);
                                                  }
                                                  setSelectedTeacher({ ...selectedTeacher, subjects: current });
                                                }}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                                              />
                                              <span>{s.name} <span className="text-[9px] text-slate-400 capitalize font-mono">({s.level})</span></span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        placeholder="Sensory Play, Fine Motor Art, etc"
                                        value={selectedTeacher.subjects?.join(', ') || ''}
                                        onChange={(e) => {
                                          const arr = e.target.value.split(',').map(part => part.trim());
                                          setSelectedTeacher({ ...selectedTeacher, subjects: arr });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none focus:border-indigo-500 text-xs"
                                      />
                                    )}
                                    <span className="text-[10px] text-slate-400 block mt-1">Checked specialties map into learning portfolios and gradebooks.</span>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Allocated Grades (comma-separated)</label>
                                    <input
                                      type="text"
                                      placeholder="Grade 3, Grade 5, etc"
                                      value={selectedTeacher.classesAssigned?.join(', ') || ''}
                                      onChange={(e) => {
                                        const arr = e.target.value.split(',').map(part => part.trim());
                                        setSelectedTeacher({ ...selectedTeacher, classesAssigned: arr });
                                      }}
                                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-[10px] text-slate-400 block mt-1">Must align with school levels. Check spelling.</span>
                                  </div>
                                </div>

                                {/* Bank & Disbursement Details Segment (Staff/Teacher Only, editable ONLY by Super Admin) */}
                                <div className="border-t border-slate-100 pt-5 mt-5 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                      <Building2 className="w-4 h-4 text-emerald-600" />
                                      Banco &amp; Disbursement Ledger Details
                                    </h4>
                                    {currentSimulatedRole === 'Super Admin' ? (
                                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1 shadow-2xs">
                                        üîì Super Admin: Editable
                                      </span>
                                    ) : (
                                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 select-none">
                                        üîí Locked (Super Admin Only)
                                      </span>
                                    )}
                                  </div>

                                  {currentSimulatedRole !== 'Super Admin' && (
                                    <p className="text-[10.5px] text-amber-700 bg-amber-50/50 border border-amber-200/40 rounded-lg p-2.5 font-medium">
                                      ‚ö†Ô∏è Bank details are sensitive payroll attributes. For financial audit and data safety compliance, edits can only be committed by an authorized <strong>Super Admin</strong>.
                                    </p>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Bank Name</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Guarantee Trust Bank, Standard Chartered"
                                        value={selectedTeacher.bankName || ''}
                                        disabled={currentSimulatedRole !== 'Super Admin'}
                                        onChange={(e) => setSelectedTeacher({ ...selectedTeacher, bankName: e.target.value })}
                                        className="w-full bg-slate-50 disabled:bg-slate-50/50 disabled:text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800 outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Account Holder Name</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Dr. Jane Smith"
                                        value={selectedTeacher.bankAccountName || ''}
                                        disabled={currentSimulatedRole !== 'Super Admin'}
                                        onChange={(e) => setSelectedTeacher({ ...selectedTeacher, bankAccountName: e.target.value })}
                                        className="w-full bg-slate-50 disabled:bg-slate-50/50 disabled:text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800 outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Account Number</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 0123456789"
                                        value={selectedTeacher.bankAccountNo || ''}
                                        disabled={currentSimulatedRole !== 'Super Admin'}
                                        onChange={(e) => setSelectedTeacher({ ...selectedTeacher, bankAccountNo: e.target.value })}
                                        className="w-full bg-slate-50 disabled:bg-slate-50/50 disabled:text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 font-mono tracking-wider text-slate-800 outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Routing / IBAN / SWIFT Code</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. DE89370400440532013000"
                                        value={selectedTeacher.bankIban || ''}
                                        disabled={currentSimulatedRole !== 'Super Admin'}
                                        onChange={(e) => setSelectedTeacher({ ...selectedTeacher, bankIban: e.target.value })}
                                        className="w-full bg-slate-50 disabled:bg-slate-50/50 disabled:text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 font-mono tracking-wider text-slate-800 outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3 flex justify-end">
                                  <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save Profile &amp; Specialization Workspace</span>
                                  </button>
                                </div>
                              </form>
                            </div>

                            {/* Teacher Profile Picture Card */}
                            <div className="space-y-6">
                              <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                  <Camera className="w-4 h-4 text-indigo-600" />
                                  <span>Faculty Portrait Image</span>
                                </h3>

                                <div className="flex items-center space-x-4">
                                  {selectedTeacher.photoUrl ? (
                                    <img 
                                      src={selectedTeacher.photoUrl} 
                                      alt="Teacher Portrait" 
                                      className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-3xs"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 border text-[10px] uppercase shadow-3xs text-center leading-none p-1">
                                      NO IMAGE
                                    </div>
                                  )}
                                  <div className="flex-1 space-y-2">
                                    <div>
                                      <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Portrait URL / Base64</label>
                                      <input 
                                        type="text"
                                        placeholder="https://example.com/portrait.jpg"
                                        value={selectedTeacher.photoUrl || ''}
                                        onChange={(e) => {
                                          const updated = { ...selectedTeacher, photoUrl: e.target.value };
                                          setSelectedTeacher(updated);
                                        }}
                                        onBlur={() => saveTeacherChanges(selectedTeacher)}
                                        className="w-full bg-white border border-slate-205 rounded px-2.5 py-1 text-[11px] outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <label className="relative flex items-center justify-center px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded border border-indigo-200 cursor-pointer transition text-[10.5px]">
                                        <UploadCloud className="w-3.5 h-3.5 mr-1" />
                                        <span>Upload from Device</span>
                                        <input 
                                          type="file" 
                                          accept="image/*" 
                                          className="hidden" 
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                const base64String = reader.result as string;
                                                const updated = { ...selectedTeacher, photoUrl: base64String };
                                                setSelectedTeacher(updated);
                                                saveTeacherChanges(updated);
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                        />
                                      </label>
                                      {selectedTeacher.photoUrl && selectedTeacher.photoUrl.startsWith('data:image') && (
                                        <span className="text-[9.5px] text-slate-500 font-medium">Local image loaded</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200/50">
                                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block">Or select a quick professional avatar preset:</span>
                                  <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 scrollbar-thin">
                                    {[
                                      { name: 'Teacher M1', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120' },
                                      { name: 'Teacher F1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120' },
                                      { name: 'Teacher M2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120' },
                                      { name: 'Teacher F2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120' },
                                      { name: 'Avatar M', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherMale' },
                                      { name: 'Avatar F', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherFemale' }
                                    ].map((preset) => (
                                      <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => {
                                          const updated = { ...selectedTeacher, photoUrl: preset.url };
                                          setSelectedTeacher(updated);
                                          saveTeacherChanges(updated);
                                        }}
                                        className={`p-0.5 rounded-full border-2 transition-transform hover:scale-110 shrink-0 ${
                                          selectedTeacher.photoUrl === preset.url ? 'border-indigo-600 ring-1 ring-indigo-500' : 'border-transparent'
                                        }`}
                                        title={preset.name}
                                      >
                                        <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded-full bg-white object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Institutional Assignment Details Box */}
                              <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Division Allocations</h3>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Choose which divisions this faculty member is currently authorized to support. Toggle tags to assign dynamically.
                              </p>

                              <div className="space-y-2 text-xs">
                                {['nursery', 'primary', 'secondary'].map(lvl => {
                                  const exists = selectedTeacher.level.includes(lvl as any);
                                  return (
                                    <div
                                      key={lvl}
                                      onClick={() => {
                                        let copy = [...selectedTeacher.level];
                                        if (exists) {
                                          copy = copy.filter(item => item !== lvl);
                                        } else {
                                          copy.push(lvl as any);
                                        }
                                        const updated = { ...selectedTeacher, level: copy };
                                        setSelectedTeacher(updated);
                                        saveTeacherChanges(updated);
                                      }}
                                      className={`flex items-center justify-between p-3 rounded-xl border border-dashed transition-all cursor-pointer ${
                                        exists 
                                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-800 font-semibold' 
                                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                                      }`}
                                    >
                                      <span className="uppercase tracking-wider font-mono text-[10px]">{lvl} Division</span>
                                      <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${
                                        exists ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-400'
                                      }`}>
                                        {exists ? 'Allocated' : 'Unassigned'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-[11px] text-slate-500 space-y-2">
                                <span className="font-bold text-slate-700 block">Workloads Allocation Rules:</span>
                                <ul className="list-disc pl-4 space-y-1">
                                  <li>Faculty assigned to &gt;2 grade structures triggers internal heavy workload logs.</li>
                                  <li>Class groups listed here are dynamically synchronized with active course schedulers.</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                        </div>

                          {/* Class, Division & Subject Units Budget Allocation Dashboard */}
                          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-6 mt-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                              <div>
                                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                                  <BookOpen className="w-5 h-5 text-indigo-600" />
                                  <span>üìö Class &amp; Subject Units Allocations (Teacher Load)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                  Define active classes, subjects, and periods (timetable units of representation) to manage workload stress and optimize academic resource distribution.
                                </p>
                              </div>
                              <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 text-xs font-mono flex items-center space-x-4">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Weekly Load</span>
                                  <span className="font-extrabold text-slate-800 text-sm">
                                    {selectedTeacher.subjectAllocations?.reduce((sum, a) => sum + (Number(a.units) || 0), 0) || 0} units
                                  </span>
                                </div>
                                <div className="border-l border-slate-200 pl-4">
                                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Max Cap</span>
                                  <span className="font-extrabold text-emerald-600 text-sm">
                                    {selectedTeacher.maxUnits || 20} units
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Workload Status Warnings */}
                            {(() => {
                              const currentLoad = selectedTeacher.subjectAllocations?.reduce((sum, a) => sum + (Number(a.units) || 0), 0) || 0;
                              const maxCap = selectedTeacher.maxUnits || 20;
                              if (currentLoad > maxCap) {
                                return (
                                  <div className="bg-rose-50 border border-rose-200/60 p-4 rounded-2xl text-xs text-rose-800 flex items-start space-x-3 animate-pulse">
                                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                      <p className="font-bold text-rose-900">üö® Critical Path Warning: Personnel Overloaded</p>
                                      <p>This teacher is currently scheduled for {currentLoad} weekly lessons, exceeding their set threshold of {maxCap}. Overloading leads to high exhaustion risks, staff burnout, and lower instructional productivity. Consider reallocating some blocks to under-utilized resources.</p>
                                    </div>
                                  </div>
                                );
                              }
                              if (currentLoad < maxCap - 4 && (selectedTeacher.role || 'teaching') === 'teaching') {
                                return (
                                  <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl text-xs text-amber-800 flex items-start space-x-3">
                                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                      <p className="font-bold text-amber-900">üí° Resource Under-Utilization Detected</p>
                                      <p>This faculty member currently teaches {currentLoad} weekly units compared to their capacity of {maxCap}. There is an expansion opportunity here to leverage their expertise for supplementary tutorial periods, academic tutoring, or continuous assessment grading without adding exhaustion.</p>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div className="bg-emerald-50 border border-emerald-200/50 p-4 rounded-2xl text-xs text-emerald-800 flex items-start space-x-3">
                                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <p className="font-bold text-emerald-950">‚úÖ Perfect Load Balancing</p>
                                    <p>Workload is finely balanced at {currentLoad} units. This optimizes classroom coverage, guards mental ergonomics, and ensures optimal instructional productivity across active divisions.</p>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Allocation registry list */}
                              <div className="lg:col-span-2 space-y-3">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Assignments Registry</h4>
                                
                                {(!selectedTeacher.subjectAllocations || selectedTeacher.subjectAllocations.length === 0) ? (
                                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 text-center text-slate-400 text-xs">
                                    No subject allocation files found. Use the quick form to map class sectors.
                                  </div>
                                ) : (
                                  <div className="border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs bg-white">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-slate-550 bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                                          <th className="p-3">Class/Grade Scope</th>
                                          <th className="p-3">Assigned Subject</th>
                                          <th className="p-3">Weekly Units (Periods)</th>
                                          <th className="p-3 text-right">Action</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {selectedTeacher.subjectAllocations.map((alloc, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="p-3 font-semibold text-slate-800">{alloc.className}</td>
                                            <td className="p-3">
                                              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wide">
                                                {alloc.subject}
                                              </span>
                                            </td>
                                            <td className="p-3 font-mono font-bold text-slate-700">{alloc.units} lessons/week</td>
                                            <td className="p-3 text-right">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updatedAllocs = selectedTeacher.subjectAllocations.filter((_, i) => i !== idx);
                                                  const updatedTeacher = { ...selectedTeacher, subjectAllocations: updatedAllocs };
                                                  setSelectedTeacher(updatedTeacher);
                                                  saveTeacherChanges(updatedTeacher);
                                                }}
                                                className="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-1 rounded hover:bg-rose-50 transition-all cursor-pointer"
                                              >
                                                Remove
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              {/* Class Allocation Config form */}
                              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-4">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-sans">Allocate Class &amp; Subject</h4>
                                
                                <div className="space-y-3 text-xs">
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">1. Select Target Class</label>
                                    <select
                                      value={allocClassId}
                                      onChange={(e) => setAllocClassId(e.target.value)}
                                      className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-semibold"
                                    >
                                      <option value="">-- Choose Active Class --</option>
                                      {classes.map(cl => (
                                        <option key={cl.id} value={cl.id}>{cl.name} ({cl.level} branch)</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">2. Select Lesson Subject</label>
                                    <select
                                      value={allocSubject}
                                      onChange={(e) => setAllocSubject(e.target.value)}
                                      className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-700"
                                    >
                                      <option value="">-- Choose Subject Specialty --</option>
                                      {/* display subjects from selectedTeacher specialties */}
                                      {(selectedTeacher.subjects || ["Mathematics", "Science", "English Language", "Biology"]).map((s, idx) => (
                                        <option key={idx} value={s}>{s}</option>
                                      ))}
                                      <option value="General Studies">General Studies</option>
                                      <option value="Social Sciences">Social Studies</option>
                                      <option value="Fine Art">Fine Arts &amp; Sensory</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">3. Weekly Units (Workload Weight)</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="15"
                                      placeholder="e.g. 5"
                                      value={allocUnits}
                                      onChange={(e) => setAllocUnits(e.target.value)}
                                      className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 outline-none font-bold"
                                    />
                                    <span className="text-[9px] text-slate-400 block leading-tight">Specifies how many times this subject appears in the weekly timetable.</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!allocClassId || !allocSubject || !allocUnits) {
                                        alert("Please select a target class, allocated subject, and enter workload units first.");
                                        return;
                                      }
                                      const targetClass = classes.find(c => c.id === allocClassId);
                                      if (!targetClass) return;

                                      const newAlloc = {
                                        classId: allocClassId,
                                        className: targetClass.name,
                                        subject: allocSubject,
                                        units: Number(allocUnits) || 4
                                      };

                                      // add allocation
                                      const allocs = selectedTeacher.subjectAllocations || [];
                                      const updatedAllocs = [...allocs, newAlloc];
                                      
                                      const updatedTeacher = { ...selectedTeacher, subjectAllocations: updatedAllocs };
                                      setSelectedTeacher(updatedTeacher);
                                      saveTeacherChanges(updatedTeacher);
                                      
                                      // Reset inputs
                                      setAllocClassId('');
                                      setAllocSubject('');
                                      setAllocUnits('4');
                                      alert("Subject units allocation added and saved successfully!");
                                    }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer text-xs"
                                  >
                                    Confirm Allocation
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                        )}

                        {/* 1B. BRANCH IDENTITY & IAM USER ACCOUNT TAB */}
                        {teacherFolderTab === 'branchIdentity' && (() => {
                          const linkedUser = systemUsers.find(u => 
                            (selectedTeacher.employeeId && u.employeeId === selectedTeacher.employeeId) ||
                            (selectedTeacher.userId && u.id === selectedTeacher.userId) ||
                            u.email.toLowerCase() === selectedTeacher.email.toLowerCase()
                          );
                          const empId = selectedTeacher.employeeId || `EMP-${selectedTeacher.id}`;
                          const branchCode = selectedTeacher.branch || 'RS';
                          const branchHist = selectedTeacher.branchHistory || [];

                          return (
                            <div className="space-y-6 animate-fade-in font-sans">
                              {/* Top Core Identity Banner */}
                              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[11px] font-mono font-bold rounded-lg tracking-wider">
                                      {empId}
                                    </span>
                                    <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold rounded-md">
                                      {selectedTeacher.employmentStatus || selectedTeacher.status || 'Active'}
                                    </span>
                                    <span className="px-2.5 py-0.5 bg-white/10 text-slate-300 text-[10px] rounded-md font-medium">
                                      {formatBranchName(branchCode)}
                                    </span>
                                  </div>
                                  <h3 className="text-xl font-black tracking-tight">{selectedTeacher.name}</h3>
                                  <p className="text-xs text-slate-300">
                                    {selectedTeacher.position || 'Faculty Member'} ‚Ä¢ Department of {selectedTeacher.department || 'Academic Faculty'}
                                  </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextBranch = branchCode === 'RS' ? 'GN' : 'RS';
                                      const reason = prompt(`Enter reason for transferring ${selectedTeacher.name} from ${branchCode} to ${nextBranch}:`, "Inter-campus faculty re-allocation");
                                      if (!reason) return;

                                      const transferEntry: EmployeeBranchHistory = {
                                        id: `hist-${Date.now()}`,
                                        previousBranch: branchCode,
                                        newBranch: nextBranch,
                                        transferDate: new Date().toISOString().split('T')[0],
                                        effectiveDate: new Date().toISOString().split('T')[0],
                                        transferReason: reason,
                                        authorizedBy: `${currentSimulatedRole} (${systemUsers.find(u => u.role === currentSimulatedRole)?.name || 'Admin'})`,
                                        timestamp: new Date().toISOString()
                                      };

                                      const updatedTeacher: Teacher = {
                                        ...selectedTeacher,
                                        branch: nextBranch,
                                        branchHistory: [...branchHist, transferEntry]
                                      };

                                      // Update teacher
                                      setTeachers(prev => prev.map(t => t.id === selectedTeacher.id ? updatedTeacher : t));
                                      setSelectedTeacher(updatedTeacher);

                                      // Update linked user if present
                                      if (linkedUser) {
                                        setSystemUsers(prev => prev.map(u => u.id === linkedUser.id ? {
                                          ...u,
                                          branch: nextBranch,
                                          primaryBranch: nextBranch,
                                          additionalBranches: [nextBranch]
                                        } : u));
                                      }

                                      logEmployeeAuditEvent({
                                        user: systemUsers.find(u => u.role === currentSimulatedRole)?.name || 'Admin',
                                        userRole: currentSimulatedRole,
                                        employeeId: empId,
                                        employeeName: selectedTeacher.name,
                                        action: 'EMPLOYEE_TRANSFERRED',
                                        authorizedBy: `${currentSimulatedRole} (${systemUsers.find(u => u.role === currentSimulatedRole)?.name || 'Admin'})`,
                                        branch: nextBranch,
                                        details: `Transferred from ${formatBranchName(branchCode)} to ${formatBranchName(nextBranch)}. Reason: ${reason}`
                                      });

                                      alert(`‚úÖ Employee transfer committed: ${selectedTeacher.name} is now posted to ${formatBranchName(nextBranch)}.`);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-1.5"
                                  >
                                    <Building2 className="w-4 h-4" />
                                    <span>Transfer Branch ({branchCode === 'RS' ? 'To GN' : 'To RS'})</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setHrSubTab('employeeAccounts')}
                                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 border border-white/15"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Open Identity Console</span>
                                  </button>
                                </div>
                              </div>

                              {/* Two Columns: Linked Account & Branch Access */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* Column 1: Linked User Account Card */}
                                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                        <Lock className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-bold text-slate-900">Linked Portal Account</h4>
                                        <p className="text-[10px] text-slate-400">Authentication &amp; User Credentials</p>
                                      </div>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      linkedUser?.status === 'Active' 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {linkedUser ? linkedUser.status : 'No Account Linked'}
                                    </span>
                                  </div>

                                  {linkedUser ? (
                                    <div className="space-y-3 text-xs">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                          <span className="text-[10px] text-slate-400 font-bold uppercase block">IAM User ID</span>
                                          <span className="font-mono font-bold text-slate-800 block mt-0.5">{linkedUser.id}</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Role</span>
                                          <span className="font-bold text-indigo-600 block mt-0.5">{linkedUser.role}</span>
                                        </div>
                                      </div>

                                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Email</span>
                                        <span className="font-mono text-slate-700 block">{linkedUser.email}</span>
                                      </div>

                                      <div className="pt-2 flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newPass = prompt(`Set new password for ${linkedUser.name}:`, "sams123");
                                            if (!newPass) return;
                                            setSystemUsers(prev => prev.map(u => u.id === linkedUser.id ? { ...u, password: newPass } : u));
                                            logEmployeeAuditEvent({
                                              user: 'Super Administrator',
                                              userRole: currentSimulatedRole,
                                              employeeId: empId,
                                              employeeName: selectedTeacher.name,
                                              action: 'PASSWORD_RESET',
                                              authorizedBy: 'Super Administrator',
                                              branch: branchCode,
                                              details: `Password reset triggered by ${currentSimulatedRole}`
                                            });
                                            alert(`üîë Password updated successfully for ${linkedUser.name}.`);
                                          }}
                                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                                        >
                                          Reset Password
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextStatus = linkedUser.status === 'Active' ? 'Suspended' : 'Active';
                                            setSystemUsers(prev => prev.map(u => u.id === linkedUser.id ? { ...u, status: nextStatus } : u));
                                            logEmployeeAuditEvent({
                                              user: 'Super Administrator',
                                              userRole: currentSimulatedRole,
                                              employeeId: empId,
                                              employeeName: selectedTeacher.name,
                                              action: nextStatus === 'Active' ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_SUSPENDED',
                                              authorizedBy: 'Super Administrator',
                                              branch: branchCode,
                                              details: `User account status switched to ${nextStatus}`
                                            });
                                          }}
                                          className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                                            linkedUser.status === 'Active'
                                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                          }`}
                                        >
                                          {linkedUser.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-6 space-y-3">
                                      <p className="text-xs text-slate-500">This employee does not have an active login credential linked.</p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newUid = `usr-${Date.now().toString().slice(-4)}`;
                                          setSystemUsers(prev => [
                                            ...prev,
                                            {
                                              id: newUid,
                                              employeeId: empId,
                                              name: selectedTeacher.name,
                                              email: selectedTeacher.email,
                                              role: selectedTeacher.role === 'management' ? 'Branch Administrator' : 'Teacher',
                                              branch: branchCode,
                                              primaryBranch: branchCode,
                                              additionalBranches: [branchCode],
                                              status: 'Active',
                                              phone: selectedTeacher.phone,
                                              accessCount: 0
                                            }
                                          ]);
                                          alert(`Created user login (${newUid}) for ${selectedTeacher.name}!`);
                                        }}
                                        className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-sm hover:bg-indigo-700"
                                      >
                                        Create Portal Account
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Column 2: Branch Clearance & Access Vectors */}
                                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                        <Building2 className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-bold text-slate-900">Branch Access Clearance</h4>
                                        <p className="text-[10px] text-slate-400">Campus operational authority</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3 text-xs">
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Primary Home Campus</span>
                                      <div className="flex items-center space-x-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                        <span className="font-bold text-slate-800 text-sm">
                                          {formatBranchName(branchCode)}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500">
                                        All primary classes, attendance logs, and payroll liabilities are registered at this campus.
                                      </p>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Multi-Branch Permissions</span>
                                      <div className="flex flex-wrap gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                          branchCode === 'RS' || linkedUser?.branch === 'All'
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                                        }`}>
                                          Runjin Sambo (RS)
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                          branchCode === 'GN' || linkedUser?.branch === 'All'
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                                        }`}>
                                          Gawon Nama (GN)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                              </div>

                              {/* Branch Transfer History & Immutable Timeline */}
                              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                      <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-slate-900">Campus Transfer History &amp; Audit Trail</h4>
                                      <p className="text-[10px] text-slate-400">Chronological record of employee branch assignments</p>
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    {branchHist.length} recorded events
                                  </span>
                                </div>

                                {branchHist.length === 0 ? (
                                  <div className="p-6 text-center text-slate-400 text-xs">
                                    No transfer history entries recorded yet for this profile.
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {branchHist.map((hist, idx) => (
                                      <div key={hist.id || idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                                        <div className="space-y-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono">
                                              {hist.previousBranch} ‚Üí {hist.newBranch}
                                            </span>
                                            <span className="font-bold text-slate-900">{hist.transferReason}</span>
                                          </div>
                                          <p className="text-[11px] text-slate-500">
                                            Authorized by: <strong className="text-slate-700">{hist.authorizedBy}</strong> ‚Ä¢ Effective: <span className="font-mono">{hist.effectiveDate || hist.transferDate}</span>
                                          </p>
                                        </div>

                                        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                                          {hist.timestamp ? new Date(hist.timestamp).toLocaleString() : hist.transferDate}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                            </div>
                          );
                        })()}

                        {/* 2. TIMETABLE SCHEDULE TAB */}
                        {teacherFolderTab === 'schedule' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Schedule list */}
                            <div className="md:col-span-2 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-indigo-600" />
                                <span>Timetable Lessons assigned to {selectedTeacher.name}</span>
                              </h3>

                              <div className="space-y-3.5">
                                {schedules.filter(sch => sch.teacherId === selectedTeacher.id).length === 0 ? (
                                  <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                                    No lesson timetable blocks are currently allocated to this teacher. Use the scheduler tool or the sidebar to assign.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                      <thead>
                                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider">
                                          <th className="py-2">Lesson Day</th>
                                          <th className="py-2">Period Slot</th>
                                          <th className="py-2">Assigned Subject</th>
                                          <th className="py-2">Class Target</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {schedules.filter(sch => sch.teacherId === selectedTeacher.id).map(sch => (
                                          <tr key={sch.id} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-2.5 font-bold text-slate-705">{sch.day}</td>
                                            <td className="py-2.5 font-mono text-indigo-600 font-semibold">Period {sch.period}</td>
                                            <td className="py-2.5">{sch.subject}</td>
                                            <td className="py-2.5"><span className="bg-slate-100 border rounded px-1.5 py-0.5 font-semibold text-[10px] text-slate-700">{sch.grade}</span></td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Rapid Allocator Form */}
                            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Rapid Timetable Allocator</h3>
                              <p className="text-[11px] text-slate-500">
                                Allocate a new course block slot directly. This synchronizes automatically with the main academy scheduler.
                              </p>

                              <form onSubmit={async (e) => {
                                e.preventDefault();
                                const subVal = (e.currentTarget.elements.namedItem('schSub') as HTMLInputElement).value;
                                const grVal = (e.currentTarget.elements.namedItem('schGr') as HTMLInputElement).value;
                                const dVal = (e.currentTarget.elements.namedItem('schDay') as HTMLSelectElement).value;
                                const pVal = parseInt((e.currentTarget.elements.namedItem('schPer') as HTMLSelectElement).value);

                                if (!subVal || !grVal) return;

                                const payload = {
                                  grade: grVal,
                                  day: dVal,
                                  period: pVal,
                                  subject: subVal,
                                  teacherId: selectedTeacher.id
                                };

                                try {
                                  const response = await fetch('/api/schedules', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload)
                                  });

                                  if (response.ok) {
                                    const data = await response.json();
                                    setSchedules(prev => {
                                      const idx = prev.findIndex(s => s.grade === data.grade && s.day === data.day && s.period === data.period);
                                      if (idx !== -1) {
                                        const c = [...prev];
                                        c[idx] = data;
                                        return c;
                                      }
                                      return [...prev, data];
                                    });
                                    alert("Lesson scheduler block pinned successfully.");
                                    e.currentTarget.reset();
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }} className="space-y-3.5 text-xs">
                                <div>
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Target Subject specialty</label>
                                  <input 
                                    name="schSub" 
                                    type="text" 
                                    placeholder="e.g. Science" 
                                    className="w-full bg-slate-50 border rounded-lg px-2 py-1.5" 
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Target Grade Section</label>
                                  <input 
                                    name="schGr" 
                                    type="text" 
                                    placeholder="e.g. Grade 3" 
                                    className="w-full bg-slate-50 border rounded-lg px-2 py-1.5" 
                                    required
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Weekday</label>
                                    <select name="schDay" className="w-full bg-slate-50 border rounded-lg px-2 py-1.5">
                                      <option value="Monday">Monday</option>
                                      <option value="Tuesday">Tuesday</option>
                                      <option value="Wednesday">Wednesday</option>
                                      <option value="Thursday">Thursday</option>
                                      <option value="Friday">Friday</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Period Slot</label>
                                    <select name="schPer" className="w-full bg-slate-50 border rounded-lg px-2 py-1.5">
                                      <option value="1">Period 1</option>
                                      <option value="2">Period 2</option>
                                      <option value="3">Period 3</option>
                                      <option value="4">Period 4</option>
                                      <option value="5">Period 5</option>
                                      <option value="6">Period 6</option>
                                      <option value="7">Period 7</option>
                                      <option value="8">Period 8</option>
                                    </select>
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-center shadow-xs cursor-pointer block mt-1"
                                >
                                  Pin to Scheduler Timetable
                                </button>
                              </form>
                            </div>

                          </div>
                        )}

                        {/* 3. ATTENDANCE & LEAVES TAB */}
                        {teacherFolderTab === 'attendance' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Attendance Logger Box */}
                            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span>Faculty Attendance Ledger</span>
                              </h3>

                              {/* Form to log today/custom date attendance */}
                              <div className="bg-slate-50 p-4 border rounded-xl space-y-3 text-xs">
                                <div className="font-bold text-slate-700 block text-[11px]">Log Attendance Activity</div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Date</label>
                                    <input 
                                      type="date" 
                                      value={newTeacherLogDate} 
                                      onChange={(e) => setNewTeacherLogDate(e.target.value)} 
                                      className="w-full bg-white border rounded px-2 py-1 font-mono" 
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Status</label>
                                    <select 
                                      value={newTeacherLogStatus} 
                                      onChange={(e) => setNewTeacherLogStatus(e.target.value as any)} 
                                      className="w-full bg-white border rounded px-2 py-1"
                                    >
                                      <option value="Present">Present</option>
                                      <option value="Absent">Absent</option>
                                      <option value="On Leave">On Leave</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 font-bold block mb-1">Optional Remarks</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Sick, dentist appointment, perfect day" 
                                    value={newTeacherLogRemarks} 
                                    onChange={(e) => setNewTeacherLogRemarks(e.target.value)} 
                                    className="w-full bg-white border rounded px-2.5 py-1" 
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const logs = [...(selectedTeacher.attendance || [])];
                                    logs.push({
                                      date: newTeacherLogDate,
                                      status: newTeacherLogStatus,
                                      remarks: newTeacherLogRemarks || undefined
                                    });
                                    // sort descending dates
                                    logs.sort((a,b) => b.date.localeCompare(a.date));
                                    const updated = { ...selectedTeacher, attendance: logs };
                                    setSelectedTeacher(updated);
                                    saveTeacherChanges(updated);
                                    setNewTeacherLogRemarks('');
                                    alert(`Attendance log posted for ${newTeacherLogDate}.`);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer shadow-xs"
                                >
                                  Commit Attendance log
                                </button>
                              </div>

                              {/* Historic log list */}
                              <div className="space-y-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Past Attendance History</span>
                                {(!selectedTeacher.attendance || selectedTeacher.attendance.length === 0) ? (
                                  <div className="py-6 text-center text-slate-400 text-xs border border-dashed rounded-lg">No logged attendance yet.</div>
                                ) : (
                                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                                    {selectedTeacher.attendance.map((att, i) => (
                                      <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-bold text-slate-700">{att.date}</span>
                                          {att.remarks && <span className="text-slate-400 italic text-[11px]">({att.remarks})</span>}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                                          att.status === 'Present' 
                                            ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                                            : att.status === 'Absent' 
                                              ? 'bg-rose-50 text-rose-700 font-semibold' 
                                              : 'bg-amber-50 text-amber-700 font-semibold'
                                        }`}>
                                          {att.status}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Leaves Management Area */}
                            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                                <CalendarDays className="w-4 h-4 text-indigo-600" />
                                <span>Leave Application Planner &amp; approval</span>
                              </h3>

                              {/* Submit leave request form */}
                              <div className="bg-slate-50 p-4 border rounded-xl space-y-3 text-xs">
                                <div className="font-bold text-slate-700 block text-[11px]">File Leave Request</div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Leave Category</label>
                                    <select 
                                      value={newTeacherLeaveType} 
                                      onChange={(e) => setNewTeacherLeaveType(e.target.value)} 
                                      className="w-full bg-white border rounded px-2 py-1 font-semibold"
                                    >
                                      <option value="Sick Leave">Sick Leave</option>
                                      <option value="Casual Leave">Casual Leave</option>
                                      <option value="Maternity Leave">Maternity Leave</option>
                                      <option value="Earned Leave">Earned Leave</option>
                                      <option value="Unpaid Leave">Unpaid Leave</option>
                                    </select>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-bold block mb-1">Start</label>
                                      <input 
                                        type="date" 
                                        value={newTeacherLeaveStart} 
                                        onChange={(e) => setNewTeacherLeaveStart(e.target.value)} 
                                        className="w-full bg-white border rounded px-1 py-1 font-mono text-[10px]" 
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-bold block mb-1">End</label>
                                      <input 
                                        type="date" 
                                        value={newTeacherLeaveEnd} 
                                        onChange={(e) => setNewTeacherLeaveEnd(e.target.value)} 
                                        className="w-full bg-white border rounded px-1 py-1 font-mono text-[10px]" 
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] text-slate-400 font-bold block mb-1">Justification Reason</label>
                                  <input 
                                    type="text" 
                                    placeholder="Brief reason for filing leave claim" 
                                    value={newTeacherLeaveReason} 
                                    onChange={(e) => setNewTeacherLeaveReason(e.target.value)} 
                                    className="w-full bg-white border rounded px-2.5 py-1" 
                                    required
                                  />
                                </div>

                                <button
                                  onClick={() => {
                                    if (!newTeacherLeaveReason.trim()) return;
                                    const leaves = [...(selectedTeacher.leaves || [])];
                                    leaves.push({
                                      id: "lv-" + Math.floor(Math.random() * 100000),
                                      leaveType: newTeacherLeaveType,
                                      startDate: newTeacherLeaveStart,
                                      endDate: newTeacherLeaveEnd,
                                      reason: newTeacherLeaveReason,
                                      status: 'Pending'
                                    });
                                    const updated = { ...selectedTeacher, leaves };
                                    setSelectedTeacher(updated);
                                    saveTeacherChanges(updated);
                                    setNewTeacherLeaveReason('');
                                    alert("Leave application submitted (Status: Pending Review).");
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer shadow-xs"
                                >
                                  Submit Leave Application
                                </button>
                              </div>

                              {/* Interactive approval actions workflow */}
                              <div className="space-y-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Submitted Leave Claims Folder</span>
                                {(!selectedTeacher.leaves || selectedTeacher.leaves.length === 0) ? (
                                  <div className="py-6 text-center text-slate-400 text-xs border border-dashed rounded-lg">No leave claims submitted by this faculty member.</div>
                                ) : (
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {selectedTeacher.leaves.map((lv) => (
                                      <div key={lv.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col space-y-2 text-xs">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <span className="font-bold text-slate-800">{lv.leaveType}</span>
                                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{lv.startDate} to {lv.endDate}</span>
                                          </div>
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                                            lv.status === 'Approved'
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : lv.status === 'Rejected'
                                                ? 'bg-rose-50 text-rose-700'
                                                : 'bg-amber-50 text-amber-700 animate-pulse'
                                          }`}>
                                            {lv.status}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 italic">" {lv.reason} "</p>
                                        
                                        {/* Administrator Command triggers */}
                                        {lv.status === 'Pending' && (
                                          <div className="flex space-x-2 pt-1">
                                            <button
                                              onClick={() => {
                                                const updatedLeaves = selectedTeacher.leaves?.map(item => 
                                                  item.id === lv.id ? { ...item, status: 'Approved' as const } : item
                                                );
                                                const updated = { ...selectedTeacher, leaves: updatedLeaves };
                                                setSelectedTeacher(updated);
                                                saveTeacherChanges(updated);
                                                alert("Leave request has been Approved.");
                                              }}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                                            >
                                              Approve Request
                                            </button>
                                            <button
                                              onClick={() => {
                                                const updatedLeaves = selectedTeacher.leaves?.map(item => 
                                                  item.id === lv.id ? { ...item, status: 'Rejected' as const } : item
                                                );
                                                const updated = { ...selectedTeacher, leaves: updatedLeaves };
                                                setSelectedTeacher(updated);
                                                saveTeacherChanges(updated);
                                                alert("Leave request marks: Rejected.");
                                              }}
                                              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                                            >
                                              Reject Request
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                          {/* 4. PAYROLL DESK TAB */}
                        {teacherFolderTab === 'payroll' && (() => {
                          const payrollList = selectedTeacher.payroll || [];
                          const overallPaidTotal = payrollList
                            .filter(p => p.status === 'Paid')
                            .reduce((sum, p) => sum + (Number(p.net) || 0), 0);
                          const overallBalanceTotal = payrollList
                            .filter(p => p.status === 'Unpaid')
                            .reduce((sum, p) => sum + (Number(p.net) || 0), 0);

                          return (
                            <div className="space-y-6">
                              
                              {/* Total Paid Overall & Outstanding Balance Info Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-150 border border-slate-200/60 p-4 rounded-2xl">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm">
                                  <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100 shrink-0">
                                    <DollarSign className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Overall Paid Over Period of Service</span>
                                    <span className="text-lg font-bold font-mono text-emerald-700">‚Ç¶{overallPaidTotal.toLocaleString()}</span>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Sum of all released direct deposit slips</p>
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm">
                                  <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl border border-rose-100 shrink-0">
                                    <DollarSign className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Remaining Balance to be Paid</span>
                                    <span className="text-lg font-bold font-mono text-rose-700">‚Ç¶{overallBalanceTotal.toLocaleString()}</span>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Outstanding balance of unpaid salary slips</p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Salary Setup & Pay slips disbursals */}
                                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4 text-xs">
                                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                                    <Award className="w-4 h-4 text-amber-500" />
                                    <span>Disburse Monthly Salary Slip</span>
                                  </h3>

                                  <div className="bg-slate-50 p-4 border rounded-xl space-y-3">
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Baseline Salary Setup (‚Ç¶ NGN / Month)</label>
                                      <input 
                                        type="number" 
                                        className="w-full bg-white border rounded px-2.5 py-1.5 font-mono text-slate-700"
                                        value={newTeacherPayBasic}
                                        onChange={(e) => setNewTeacherPayBasic(e.target.value)}
                                      />
                                    </div>

                                    <div className="border-t border-slate-100 pr-0 pt-3">
                                      <span className="font-bold text-slate-700 block text-[11px] mb-2">New Slip Details</span>
                                      <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                          <label className="text-[9px] text-slate-400 font-bold block mb-1">Payment Month</label>
                                          <input 
                                            type="text" 
                                            placeholder="June 2026"
                                            className="w-full bg-white border rounded px-2 py-1 font-semibold"
                                            value={newTeacherPayMonth}
                                            onChange={(e) => setNewTeacherPayMonth(e.target.value)}
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] text-slate-400 font-bold block mb-1">Bonus Additions ($)</label>
                                          <input 
                                            type="number" 
                                            placeholder="0"
                                            className="w-full bg-white border rounded px-2 py-1 font-mono"
                                            value={newTeacherPayBonus}
                                            onChange={(e) => setNewTeacherPayBonus(e.target.value)}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                          <label className="text-[9px] text-slate-400 font-bold block mb-1">Tax / Deductions ($)</label>
                                          <input 
                                            type="number" 
                                            placeholder="0"
                                            className="w-full bg-white border rounded px-2 py-1 font-mono"
                                            value={newTeacherPayDeductions}
                                            onChange={(e) => setNewTeacherPayDeductions(e.target.value)}
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] text-slate-400 font-bold block mb-1">Disbursal Type</label>
                                          <select
                                            className="w-full bg-white border rounded px-2 py-1 font-bold text-slate-700"
                                            value={newTeacherPayStatus}
                                            onChange={(e) => setNewTeacherPayStatus(e.target.value as 'Paid' | 'Unpaid')}
                                          >
                                            <option value="Paid">Mark as Paid (Released) ‚úÖ</option>
                                            <option value="Unpaid">Mark as Unpaid (Balance Due) ‚è≥</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg font-mono text-[10px] space-y-1">
                                      <div>Base: ${newTeacherPayBasic}</div>
                                      <div>Bonus: +${newTeacherPayBonus || 0}</div>
                                      <div>Deduction: -${newTeacherPayDeductions || 0}</div>
                                      <div className="font-bold text-indigo-700 border-t border-indigo-200 pt-1 mt-1">
                                        Net NetPay: ${parseFloat(newTeacherPayBasic) + (parseFloat(newTeacherPayBonus) || 0) - (parseFloat(newTeacherPayDeductions) || 0)}
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => {
                                        const monthStr = newTeacherPayMonth.trim() || `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`;
                                        const basicVal = parseFloat(newTeacherPayBasic) || 0;
                                        const bonusVal = parseFloat(newTeacherPayBonus) || 0;
                                        const dedsVal = parseFloat(newTeacherPayDeductions) || 0;
                                        const netVal = basicVal + bonusVal - dedsVal;

                                        const pays = [...(selectedTeacher.payroll || [])];
                                        
                                        // check duplicates for month
                                        if (pays.some(p => p.month.toLowerCase() === monthStr.toLowerCase())) {
                                          if (!confirm(`A salary slip is already disbursed for ${monthStr}. Do you wish to override duplicate block?`)) return;
                                        }

                                        const filteredPays = pays.filter(p => p.month.toLowerCase() !== monthStr.toLowerCase());

                                        filteredPays.push({
                                          id: "pay-" + Math.floor(Math.random() * 100000),
                                          month: monthStr,
                                          basic: basicVal,
                                          bonus: bonusVal,
                                          deductions: dedsVal,
                                          net: netVal,
                                          status: newTeacherPayStatus,
                                          datePaid: newTeacherPayStatus === 'Paid' ? new Date().toISOString().split('T')[0] : undefined
                                        });

                                        const updated = { 
                                          ...selectedTeacher, 
                                          payroll: filteredPays,
                                          qualification: selectedTeacher.qualification || "M.Ed Education" // baseline edit backup
                                        };

                                        setSelectedTeacher(updated);
                                        saveTeacherChanges(updated);
                                        setNewTeacherPayBonus('0');
                                        setNewTeacherPayDeductions('0');
                                        alert(`Payroll check issued successfully for ${monthStr} as ${newTeacherPayStatus}!`);
                                      }}
                                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-center shadow-xs cursor-pointer block"
                                    >
                                      Disburse &amp; Release Salary Slip
                                    </button>
                                  </div>
                                </div>

                                {/* Salary Slip historic log ledger */}
                                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                                    <FileText className="w-4 h-4 text-slate-500" />
                                    <span>Historic Direct Deposit Ledger</span>
                                  </h3>

                                  {(!selectedTeacher.payroll || selectedTeacher.payroll.length === 0) ? (
                                    <div className="py-12 border border-dashed text-center text-slate-400 text-xs rounded-xl">No historical payroll disbursements have occurred. Use printer tool to initialize.</div>
                                  ) : (
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                      {selectedTeacher.payroll.map((pay) => (
                                        <div key={pay.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <span className="font-bold text-slate-800 text-xs block">{pay.month} Slip</span>
                                              <span className="text-[10px] text-slate-400 font-mono block">
                                                {pay.status === 'Paid' ? `Paid on: ${pay.datePaid || pay.month}` : 'Pending disbursal'}
                                              </span>
                                            </div>
                                            
                                            {pay.status === 'Paid' ? (
                                              <span className="bg-emerald-50 text-emerald-800 text-[9px] uppercase font-bold tracking-widest border border-emerald-200 px-2 py-0.5 rounded-full">
                                                Paid Direct Deposit
                                              </span>
                                            ) : (
                                              <div className="flex items-center space-x-1">
                                                <span className="bg-rose-50 text-rose-850 text-[9px] uppercase font-bold tracking-widest border border-rose-200 px-2 py-0.5 rounded-full">
                                                  Unpaid Balance
                                                </span>
                                                <button
                                                  onClick={() => {
                                                    const pays = [...(selectedTeacher.payroll || [])];
                                                    const updatedPays = pays.map(p => p.id === pay.id ? { 
                                                      ...p, 
                                                      status: 'Paid' as const, 
                                                      datePaid: new Date().toISOString().split('T')[0] 
                                                    } : p);
                                                    const updated = { ...selectedTeacher, payroll: updatedPays };
                                                    setSelectedTeacher(updated);
                                                    saveTeacherChanges(updated);
                                                    alert(`Disbursed balance funding of $${pay.net} for ${pay.month} successfully!`);
                                                  }}
                                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-0.5 rounded text-[9px] transition-all cursor-pointer font-sans"
                                                >
                                                  Pay Now
                                                </button>
                                              </div>
                                            )}
                                          </div>

                                          <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] text-slate-500 border-t border-slate-100 pt-2">
                                            <div>
                                              <span>Basic:</span>
                                              <span className="block font-bold text-slate-700">${pay.basic}</span>
                                            </div>
                                            <div>
                                              <span>Bonus:</span>
                                              <span className="block font-bold text-slate-700">+${pay.bonus}</span>
                                            </div>
                                            <div>
                                              <span>Deduction:</span>
                                              <span className="block font-bold text-[10px] text-slate-500">-${pay.deductions}</span>
                                            </div>
                                            <div>
                                              <span className="text-indigo-600 font-semibold">Net Pay Check:</span>
                                              <span className="block font-bold text-indigo-700 text-xs">${pay.net}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                              </div>
                            </div>
                          );
                        })()}

                        {/* 5. APPRAISALS & PERFORMANCE TAB */}
                        {teacherFolderTab === 'performance' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Appraiser Logger */}
                            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <span>Commit Faculty Appraisal</span>
                              </h3>

                              <div className="bg-slate-50 p-4 border rounded-xl space-y-3 text-xs">
                                <div className="font-semibold text-slate-700 block text-[11px]">New Professional evaluation</div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Performance Rating Stars (1-5)</label>
                                    <select
                                      value={newTeacherPerfRating}
                                      onChange={(e) => setNewTeacherPerfRating(parseInt(e.target.value))}
                                      className="w-full bg-white border rounded px-2.5 py-1.5"
                                    >
                                      <option value="5">‚òÖ‚òÖ‚òÖ‚òÖ‚òÖ Outstanding (5)</option>
                                      <option value="4">‚òÖ‚òÖ‚òÖ‚òÖ‚òÜ Competent (4)</option>
                                      <option value="3">‚òÖ‚òÖ‚òÖ‚òÜ‚òÜ Satisfactory (3)</option>
                                      <option value="2">‚òÖ‚òÖ‚òÜ‚òÜ‚òÜ Needs training (2)</option>
                                      <option value="1">‚òÖ‚òÜ‚òÜ‚òÜ‚òÜ Unprofessional (1)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Official Reviewer</label>
                                    <input 
                                      type="text" 
                                      value={newTeacherPerfReviewer} 
                                      onChange={(e) => setNewTeacherPerfReviewer(e.target.value)} 
                                      className="w-full bg-white border rounded px-2.5 py-1.5" 
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] text-slate-400 font-bold block mb-1">Appraisal Comments &amp; Recommendations</label>
                                  <textarea
                                    className="w-full bg-white border rounded px-2.5 py-1.5 h-20 placeholder-slate-400"
                                    placeholder="Summarize the supervisor's physical class audit notes, adherence to lesson prep material, etc..."
                                    value={newTeacherPerfComment}
                                    onChange={(e) => setNewTeacherPerfComment(e.target.value)}
                                  />
                                </div>

                                <button
                                  onClick={() => {
                                    if (!newTeacherPerfComment.trim()) return;
                                    const reviews = [...(selectedTeacher.performance || [])];
                                    reviews.push({
                                      id: "pf-" + Math.floor(Math.random() * 100000),
                                      date: new Date().toISOString().split('T')[0],
                                      rating: newTeacherPerfRating,
                                      comment: newTeacherPerfComment,
                                      reviewer: newTeacherPerfReviewer
                                    });
                                    const updated = { ...selectedTeacher, performance: reviews };
                                    setSelectedTeacher(updated);
                                    saveTeacherChanges(updated);
                                    setNewTeacherPerfComment('');
                                    alert("Appraisal report card saved into staff directory.");
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer shadow-xs"
                                >
                                  Commit Performance Appraisal
                                </button>
                              </div>
                            </div>

                            {/* Appraisal historical stream listing */}
                            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                                <Award className="w-4 h-4 text-amber-500" />
                                <span>Audit Review Records Summary</span>
                              </h3>

                              {(!selectedTeacher.performance || selectedTeacher.performance.length === 0) ? (
                                <div className="py-12 border border-dashed text-center text-slate-400 text-xs rounded-xl">No historical performance appraisals available. Conduct an audit using the left form.</div>
                              ) : (
                                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                                  {selectedTeacher.performance.map((pf) => (
                                    <div key={pf.id} className="bg-slate-50 border border-slate-250/60 p-3.5 rounded-xl space-y-2 text-xs">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <span className="font-bold text-indigo-705 block">Review by: {pf.reviewer}</span>
                                          <span className="text-[10px] text-slate-400 font-mono block">Review Date: {pf.date}</span>
                                        </div>
                                        <div className="flex text-amber-500 font-bold">
                                          {Array.from({ length: pf.rating }).map((_, idx) => (
                                            <span key={idx}>‚òÖ</span>
                                          ))}
                                          {Array.from({ length: 5 - pf.rating }).map((_, idx) => (
                                            <span key={idx} className="text-slate-200">‚òÖ</span>
                                          ))}
                                        </div>
                                      </div>
                                      <p className="text-slate-600 bg-white p-2.5 rounded-lg border leading-relaxed">
                                        {pf.comment}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                          </div>
                        )}

                        {/* 6. LESSON PLANS ORGANIZER */}
                        {teacherFolderTab === 'lessons' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Lesson plan adder form */}
                            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                                <BookOpen className="w-4 h-4 text-indigo-600" />
                                <span>Post New Lesson Courseplan</span>
                              </h3>

                              <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!newLessonPlanSubject || !newLessonPlanTopic) {
                                  alert("Provide Subject and Topic details.");
                                  return;
                                }

                                const plans = [...(selectedTeacher.lessonPlans || [])];
                                plans.push({
                                  id: "lp-" + Math.floor(Math.random() * 100000),
                                  subject: newLessonPlanSubject,
                                  grade: newLessonPlanGrade,
                                  topic: newLessonPlanTopic,
                                  objective: newLessonPlanObjective,
                                  summary: newLessonPlanSummary,
                                  date: newLessonPlanDate,
                                  status: 'Approved' // auto-approve for supervisor, or can toggle draft
                                });

                                const updated = { ...selectedTeacher, lessonPlans: plans };
                                setSelectedTeacher(updated);
                                saveTeacherChanges(updated);

                                // reset
                                setNewLessonPlanSubject('');
                                setNewLessonPlanGrade('');
                                setNewLessonPlanTopic('');
                                setNewLessonPlanObjective('');
                                setNewLessonPlanSummary('');
                                alert("Lesson planner course details committed successfully!");
                              }} className="space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Subject Name</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. Science"
                                      className="w-full bg-slate-50 border rounded p-1.5"
                                      value={newLessonPlanSubject}
                                      onChange={(e) => setNewLessonPlanSubject(e.target.value)}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Target Class</label>
                                    <input 
                                      type="text" 
                                      placeholder="e.g. Grade 10"
                                      className="w-full bg-slate-50 border rounded p-1.5"
                                      value={newLessonPlanGrade}
                                      onChange={(e) => setNewLessonPlanGrade(e.target.value)}
                                      required
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] text-slate-400 font-bold block mb-1">Topic Header</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Photosynthesis processes"
                                    className="w-full bg-slate-50 border rounded p-1.5"
                                    value={newLessonPlanTopic}
                                    onChange={(e) => setNewLessonPlanTopic(e.target.value)}
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] text-slate-400 font-bold block mb-1">Specific Objective</label>
                                  <input 
                                    type="text" 
                                    placeholder="Measure oxygen yield gas bubbles"
                                    className="w-full bg-slate-50 border rounded p-1.5"
                                    value={newLessonPlanObjective}
                                    onChange={(e) => setNewLessonPlanObjective(e.target.value)}
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] text-slate-400 font-bold block mb-1">Instructional Summary</label>
                                  <textarea
                                    className="w-full bg-slate-50 border rounded p-1.5 h-16 placeholder-slate-400"
                                    placeholder="Include classroom activities, steps, and diagnostic worksheets list..."
                                    value={newLessonPlanSummary}
                                    onChange={(e) => setNewLessonPlanSummary(e.target.value)}
                                  />
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Expected Delivery Date</label>
                                    <input 
                                      type="date" 
                                      className="w-full bg-slate-50 border rounded p-1.5 font-mono"
                                      value={newLessonPlanDate}
                                      onChange={(e) => setNewLessonPlanDate(e.target.value)}
                                    />
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  className="w-full bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 text-white font-bold py-2 rounded-xl text-center shadow-xs cursor-pointer block mt-1"
                                >
                                  Publish Faculty Lesson Plan
                                </button>
                              </form>
                            </div>

                            {/* Lesson plans roster */}
                            <div className="md:col-span-2 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                                <BookOpen className="w-4 h-4 text-emerald-500" />
                                <span>Lesson Planner Directory</span>
                              </h3>

                              {(!selectedTeacher.lessonPlans || selectedTeacher.lessonPlans.length === 0) ? (
                                <div className="py-12 border border-dashed border-slate-200 text-center text-slate-400 text-xs rounded-xl">No course lessons posted in this teacher folder index yet. Add study schedules on the left form.</div>
                              ) : (
                                <div className="space-y-3 max-h-128 overflow-y-auto pr-1">
                                  {selectedTeacher.lessonPlans.map((plan) => (
                                    <div key={plan.id} className="bg-slate-50 border border-slate-205 rounded-xl p-3.5 space-y-2.5 text-xs relative">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="flex items-center space-x-2">
                                            <span className="font-bold text-slate-800 text-sm">{plan.topic}</span>
                                            <span className="bg-slate-200/50 text-slate-600 rounded px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase tracking-wider">{plan.grade}</span>
                                          </div>
                                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">Subject: {plan.subject} ‚Ä¢ Target: {plan.date}</span>
                                        </div>
                                        
                                        <div className="flex items-center space-x-1.5">
                                          <button
                                            onClick={() => {
                                              const toggledStatus = plan.status === 'Approved' ? 'Draft' : 'Approved';
                                              const updatedPlans = selectedTeacher.lessonPlans?.map(p => 
                                                p.id === plan.id ? { ...p, status: toggledStatus as any } : p
                                              );
                                              const updated = { ...selectedTeacher, lessonPlans: updatedPlans };
                                              setSelectedTeacher(updated);
                                              saveTeacherChanges(updated);
                                              alert(`Lesson status toggled to: ${toggledStatus}`);
                                            }}
                                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest cursor-pointer ${
                                              plan.status === 'Approved' 
                                                ? 'bg-emerald-50 text-emerald-705 border border-emerald-200' 
                                                : 'bg-amber-50 text-amber-705 border border-amber-200'
                                            }`}
                                          >
                                            {plan.status || 'Approved'}
                                          </button>
                                          <button
                                            onClick={() => {
                                              const updatedPlans = selectedTeacher.lessonPlans?.filter(p => p.id !== plan.id);
                                              const updated = { ...selectedTeacher, lessonPlans: updatedPlans };
                                              setSelectedTeacher(updated);
                                              saveTeacherChanges(updated);
                                              alert("Lesson plan removed.");
                                            }}
                                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                            title="Delete course plan"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {plan.objective && (
                                        <div className="bg-white p-2 border rounded border-slate-100">
                                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Learning Outcomes</span>
                                          <p className="text-[11px] text-slate-700 font-medium">{plan.objective}</p>
                                        </div>
                                      )}

                                      {plan.summary && (
                                        <p className="text-slate-600 bg-white p-2 border border-slate-100 rounded leading-relaxed text-[11px]">
                                          {plan.summary}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                          </div>
                        )}

                        {/* 7. TEACHER GRADING & INTERACTIVE TOOLS DESK */}
                        {teacherFolderTab === 'tools' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Homework Publishing block */}
                            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4 text-xs">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                                <Plus className="w-4 h-4 text-indigo-600" />
                                <span>Publish &amp; Broadcast Homework Workspace</span>
                              </h3>
                              <p className="text-xs text-slate-500">
                                Homework published from this command launcher automatically attaches as unresolved 'Pending' homework cards into the active report profiles of every student currently registered inside your assigned classes!
                              </p>

                              <div className="space-y-3.5 bg-slate-50 p-4 border rounded-xl">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Assessment Subject</label>
                                    <select
                                      value={newPubHwSubject}
                                      onChange={(e) => setNewPubHwSubject(e.target.value)}
                                      className="w-full bg-white border rounded px-2.5 py-1.5 focus:border-indigo-500 outline-none font-semibold text-slate-750"
                                    >
                                      {selectedTeacher.subjects?.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                      {!selectedTeacher.subjects?.includes("Mathematics") && <option valuxúÏ}YoWñÊ˚¸ä+¬m&]Ã‰.…,ëER´%äMRe‘ÜôÃ+2"+ëiö@ø40òÈ.wW5f–==tıÀ ˝:Ù√ºÕ?©?–˛	sŒ]b_ŒÕÖí,`ãôq„.Áû{÷ÔX;/åp`ç–Óª©èVºQh{ÓÓÕ`§Î˙^`9V/¥ÃsÀË,øD›o·ã‡ãéÌˆú»¥Ç÷¬Yœ∂‹ûµ∞ƒ>˝î=Ø`o'≤v‚ﬂvÂsÍ¬°€wÏ`¿ûn?2˙Â})‹¥õˇF≥wèVDﬂv	w?Z1Ì∑§â˜¡ùé—µ÷så 86Ü0¬–∫
€Ø?]}≈¯üÅcÑV{suï]xnÿÓzé…∫é◊{√Ü›ˆ⁄¬Óπ·˜≠êÌclœÅ_˛£ﬁ2±bàÀ)ñ‚⁄µ.O¢Ó≥ÀßæaZTR‹˝,<ﬁ≤ñÿŒ.¨8›PÀÍÑ|D˛ö%j√©ºl_Dé√∫˝ˆÂ¿-÷ı|”ÚôÔEÆiôlt’^Ôl±—∏Ωˇ\xΩ(ÿ∑¥m◊¥˚^{&€ãB«v≠∂Îπñò˘¿⁄|ˆ˘≤»[¨Æ.êzH[ÿ+˘≠¬f{A`˜]À¸¢34F≠æès◊"∂…‚]Ù∆Ô\˜˝µÜÁ.˛/ﬁ4ƒó»Îí€ø|çŸ∆¬Æ¸C˜≈•Õm©Ê∂f“‹⁄™jomu6Æ≈ÆÈ58Ó$okæè Î¶Ê`áW#NÒÏô·ö∞±ÿ‹œZña‚\“`eèlw—¯X8A_MxmÁ∏ﬁAda7i€†éÎ…Ü&„{Z\o#·y∞Cœı“Îsü∆…V>D
{Ê≠Kœ√l7˝®á0`ü√—/Ÿ»˜Ü£0–!2|ß·[∆úñhù⁄Î´l‰=k CÅÉ) çVSèÓ,|È„ª@ƒÍ˘6∞û∑s<∑üôäefu˙∂3·X°ºa9°=rl!O0úø``Ya ‰ÃF i±çÕˆ∆˝Nß3—:7Ç7”Ôleí≠3K2ÓFaËπÑó¬@`:ﬂ¿8¯0ÆI£∑/XÎ^z“:°o[KKƒÁ3À['æ˜÷Ü3»2#±§Ü£à∂çœ@≈`!∂ø∞ÙKbÀæFæKª˚¶y&ÒZYaOl'ÑmÑ†∏–9xF∂€ßÌ6†Êû{x‰L5±√∫æ·ˆÍãŒG+‡‰‘ÈÛ√yggáeÑZ‚<‡
Âﬂÿq,∑xõ´∫KıÕ¥|/?∞fπæÁ8¿$`€‚"ä/~íì¬;Ï◊ño_åôÿÇ˚‡¨\ÿ˝»ÁÀﬁ˘Ê]Æ/'gﬁÿ˙Ê±ÔfœÄ%3∏|;Ñ≥–Éypÿ'◊ìzìLçúç¸4|¡Œ6LÆq £ Jóè¿áp› &a)ï0œ}ªﬂ º‰5°¿∑äÍÍ§∆
#ÉV°ëÃô3(j∑ÆÏ Ñ∆û]ùag†NªÔøgØø¢ÆµhK={Z√mˆ,ı	⁄¶vVŸ‹fÉÀˆ˚C„EÁ¬Ò<ø≈ˇÑçhz¿¿ÿg _Ûkiô‹∞4l«ıL|AoY\Ú82T˙≥¶ê’í«•¶—ˇ–Aﬂdã'(ênë¯‰ubËDn0∞/¬VzMó~âÑ<Ú≠º_ã2πõíbë˝A∏”Ãvö…å∑ñlTÛA+˚*"∑∫Y"n‰ºÙ∞∏H|ÉdŒ±0ŸçôWızV‹cJKÁT∆zÜo¬°¸¨Üó¡áëÖº¨¿«à¨˙Ü"Òî °“ä≤?¨‚[ÀﬂNæ{ ﬂq·Z»™â`Õ%T)≥∂ØqS∆Ñgˆ¿0ΩK÷ã¸¿Û€#œÊﬂrQºYH§»ﬁ…Å±ó∏åAûÇZ”kz4E4º^˘åù¡Yc1`QCzÀ≈f4ôœVÍ£ÙzÂi≠J¡˙ÍÍ }–⁄[Ò¢¨√™àïh_,Å2–∑7≈J]ç30ÿ(h[¡0E)•Î!*]éu≈†√ ¶˛Œ+‘6ﬂÔCjè∏p≤oå≤î∫	 êÏπ5¥|√1—<∑@‡°ÓÓ>Ù⁄v#/
êd`órí9µPo8ëKÛhÖﬂ›HÉç∆{FÖ…ÉUHMˆøπ˜á|"ç§À>Ô2h_›–∞ë«òëÖç„ î4∏Ø1:Ç‹Bd√Ã¥A‹	ù1∞!|0”ã∫(ÉvﬂF)4:`;¿üPˆóÚÀ"àãÃ¥∏˛Â¬f◊Ûﬁ0ÔnE…™ﬂ«˜ßk‘®@Ââ=!W {5a@ﬁõ9uXÖ¥r≠˜}€d¯øvœs`d}c‘ﬁ 4tªF˝≥ë’≥«˛ñπÁ7µî‰s+v}‹èxVâWNi€œ6v;ˆ˝i≠˚b}Êo‹O¸`h’áOSòı·ÈÿÆèÔÚˇœœ≤OÛÍ•˝òeΩèœœ˘ÿˆØ?.ÌÇ˙mW˛Ò±93πÿ¨úY“Dk¶eŒëÌÿ]ÕöQﬂˇ5Æ®DYﬁF’Ä∏ma/ÇcXÙõ]ÿ>*R”Ω °8Ö5ª∆µé3n öL_rd„P uñºvuÃ]xe	—…#3n˜ıÍW€‘Ë‘≥8.g–≤b»_KU‰gw‡eè5–Jè¿wÂ»Œq∂Ö›võÌ<÷Fƒ*¥€∫gÕ7ﬁs¶8D{N|Ü¬üª¯ø;ﬂ¯ùo<_ΩV±∆ÜÊvÚqCS…H∑Am‘M€Î§f¢~àsHŸ˙§âÍVU≈Ög§|ƒL˝V’è"Ô-1üÃüÌ ÂÃ∫@&·ø9'◊Y¬iTñŒˆDi·ü®ù·ÇG\Xî÷¬?π,s√p¿\~‰øÛïS_|ˇ=[‹[ºY¢wwNÃˇÉó‘Øå!–æ©«Ë:*D«çÜ]ÀßÌ∆Ü∂ª≥@‹SËáª⁄YX£ÓA°LLﬂFN&KáfBp§ŸTßcπ¯è’∂∆ ãåóxFLõöå¨Ω≥?‰o'Æ#Bi«uH°⁄pô—„·=9>œµ…πuPÓ∫(g«:íGÜXOœ[9J”π∞a#∑T´K»€„W<b´ôœªËj÷ûYiÇ«˛+B œg]+º¥,ﬁg∏&æÂ›Üœ»©ÕS±¯Ωﬂ5ï÷‚™åv)ê}Ó≈Ø—ûY¥Æ(’ıBEº∂ÀL#4∫F`ΩÛ@$·¡≈
Ùª|Khï]ü€˜FcÂ-o≈3÷ëçë^ﬂ,QΩÂIãØV˙Øp≠%Ω=·«æF|˜˚ÀÅPCD◊∑SC†-’©_E†Á‹óŒ3ÀîV›Û…u≤l\⁄‹N|põúÛõ?ÀD#Â\(˜ÊÌ…WŒ—å+_}˘~˙Ú≈\3°˝'æŸ˜Àëﬂ–»R%7©k∫≤—%∂]°K=™Í∆ÏêØÍëûùÔÏù∞Û√Ω˝gáßgÏÙÈ—Ÿ˘ÈoèWœ˜NŸ””£ˆÂ—˘3võ„ΩG˚ÏÏpˇ’È—˘oÿ˘ﬁ„Í¶È›´	ç¿qÓ	-Ó±·∫@ä’˜Ê≠(<@ˇá∑˘ﬂ>P∑àZ@$Ò˚L√∑Q⁄„∂:‚—ä≥YcÉiRø÷ãëNπ∞ˇyiXˆ†…
Ù”èøˇøÏY4y‘
º»ÔY*‘}èG)±œßñÊÎµ!D8HS≥·Jmfhôv4Düã°„}náëC∆p*êÕ`Z1xúT* æ∆Ü ˆ|9ºm8 [RhË±ëÂÀ`éÄôc‡‘·å;<
°z¨µ´v=ÅMù]./-¬+àœYDÁ]ù’Cj¨v≠lsg°∫ÌPñ∂”láΩA={Õi†bùºÀ=SY≈[°ﬂ®WeÉãËQ`†ƒnñJkçùµAA,ÙÅ2l\~‹íû®Ä•°©˛í= ë:w’MOªX˛âr|IåQ0m˜Mª9∂HƒΩtª∆˜ùÖ∆≈;QÑ—G‘||U.^˝qÖÚŸ©‹ﬁÏß
7◊±Ò÷Óã e≠Éâ8Á•oåíê\ïQ{-M ã¿i^¢∂π π◊ZˇlT∏ÖAH‹VG≈-ÚLn„Vj◊ÓëdÆø©&ÂıxG Q´…p˙eñúÑ‚1∫='V}R/{Wq°	Ë∂€ßrŒ>µÀÇaÂím≠6µøÕs\_è¨’™Æïõo™°v·NŒm„XÇˇø⁄ ôA7áäç-6¥81üΩ»	«píˆÌ Ù«Mªªyoﬂë[√ë„ç-N|†…0¯piΩ0íèó‰G∂É:Â˙\»˛PN4S3-∑¿cÓÛaG{/@¥¸·è ∏∞]Ë7Hä{& Ò\é¸pwAÈhtwÇ≤<ºç≠ê~Y,T™;üxáÏ√‹z0πÿœ=Ûd˜Ã∑∞±Fıÿs£¿
¶ﬂ∑%¸cÃ#«ôÂ∏"?›Ω`†OÒVÖ≠	ˆÃâ¿òAë#ü‚%\\∆˘Ûa-ŒÏaÑÌôßûc-·P=X;√;±kãÔßxë·üÅN€TbV©[Í∆¿≥1"¶≥YÖ“üïm]v©Ë_[Eè8,ô™=Y2ﬂØØff ôﬁH(∫∞/Vì}ë≤ä=√A;OÖô!<zda˜ßˇ˛˜Lπyäjvˆ˚rD¨–ÈáÀÖ‚Ë≤ﬂ¨€·>¸MÛíHœ∂Âò˚´˜Ü∆ xoÓ˘∑`HﬂôúiÃ&ˆÌ´i‹CJÉ
ÎYÕL)A5Tı»æÁ¿áÍ6î0ﬁ;◊ÍØ∫M˚Ë<~ ı°ˆnCÂz3<ì|hxœYÊ±ÃÁ⁄m+ÿ0rﬂùÎ2ûLx_"v~™ª¬è!7â:¿ÛEz)◊ˇÇªÎx–◊°€˜;ÏU`ç{—a¯¨uç`œÌôC€E˝ﬁ=i±ÆgÇÖN¥«#ãœuœyÆ4√YÁû\,‡âr©1Ë£1nD8k%¨√NL/b:x^®‹˙q≥8Ù∞£Ë˜(˜kÉG]¸‚uÕÓ}§ãll∂z¥…ÎYeõ´Æn™k|®ïL˝nïñ˛⁄›^+¶`
∞e¯†>£≥bVøÔ˘c	pRgÜÂMWec.d:’∑&+89^‚¥ Vµ€lh&n3¯ª ±lÊfµé™¸ª|˙çú~h\µπ@¯∂º]è‰¸¶Z2∫¿j#D1≤.B~Öﬁ®Ω∂≤Œ⁄¸ËÁÛ3Ê_‰"ı=<ö±ﬁ«£d%|Wìﬂ<∑'GˆÏ4àa›1Cé∂Ãéñôá“Om+ ¿0…ÿ>πˇEÛø6ú¶êÉ≤†æÛ\∫Q}•!q≤oAßù#dq6Úï;*Û0·Û¢€kÈ©‹OJNh˝T÷À.ç!“O#Ÿ¨ùB<“„9◊˜Æ‘9hv“ıÎÜ5ªÊ®.ã◊≤x»/|⁄É•;IXÂMS8êlDyyS-˝Ù„ﬂ¸éù´Ô…-¡jµK[˚ÔˇÛﬂˇÌv?Î7:‰Nj¥≤eö¸√b/í_Çø‚·Ò°AJÈ•∆öÚ®yhÂo.q£kE#Ap-—38ü∆ÑP‹¥.ñúüæ%Æ €o!∆àæû&:hP<YeÎ~ô©ÁÛzmK\u:ó∏öC®8%pÚljã2Uüº–)Q˚s≥„˙Öaª»ïßç=≈ú*∫£öíÇuøÜ^ã¥ÿX~Õ"∏’ Ä%Ωâs∂¯ŸÜªdΩËüj”ƒDZ-ﬁôF0∞Ã¬ŸÿîvÏ±X¢M á(«ˇ¿.aò/Mq	‡ﬁ!‡D@ÇÌ‘ŒECƒ\eàõ∏
Î¿Ÿ®¯@’í@KãÁî+áJﬂ∫"ÍÇÒqQØc®Í´/Sç¿«W."©@CÎ´ı¨¨∞û·Ù∏B 0ºâE¸QÂJe∑cds±kÙﬁ:Öçân$=ìP	xÄFœÍ_S	€ç÷´öV|Ñì¥Z≠ .ãâ√&≤_∞÷1œ›iÒÔ;|Ù<Nui˛k4k©eœÁ˘
`ª%5ÇœÿfCî0¨Ñ
1"6˙ÆäJOÇ±’>È(uºÌˆ(L˜¬6¢◊/~Ú‡>∆7·ì©Ä‹≠úÍAlWéø¬§ùf=°Ñ]N™U=3öü~¸«ˇ≈ŒB„OÌ‡kΩÑ”[µÃ•Ü˜≥írﬂV⁄⁄˜ Ë≈Á5w¯ó◊"EN–4Ø2Ω?;ˆGbõ∂Ÿ&“|z˜£*Ôw˝…˘˝?≥W.v=
mÅ∆≥oå&òÂ…;ü2NÑµ’≠l}*f6‰?˝”_±«ÜÉ>Nì=á	û`∞ZD>—êı∆Ùx<Bˆa≤7Ù±'® NB‹âfïßqìı™ˆgëÃ“¨3†ÃA‘$≈d[]µÅ$üóòˇƒø§¨áƒ†Ñ€>Ñ-P)B÷DZ6À%44ÅÎ=à∑ìÅ”6–"—ﬁí˜Içï°¨Íì@õ≈÷.|‡¬Åª∂iZ.Àö‹Úµ©5jÜ0J‰úõ,'Â“Üs∂kò}´º0yQ¡Xë∂◊±V7´ftïÑ3(€»¢ÊŒ¢¥ß∑ΩÂÃ-Û'Í0Ó˜_≈ìß— ì+~Zp™å∏'æπág¡wY4¨óˆ0£ÒßRƒ£h=úò∑ﬁ¥∞]Çñ ¢i©€Õπ©4r±—HörÂÜ∆èπså¯w—ﬂC≈—Uó∞ƒI∆UöW6( |ˆ⁄.ÌÎÅ≈}Gìw÷Û—
õtW~~ò»WÚõçÇÑ•?Ç≈L»C.¥!#µƒo”}—Õ7ZXzß&•„•ªµË>@–¯ﬁjûòèf–Â$UÅ+9òÅT¢Gj;¶¨„Â€W£7ål'+ ˘Õ·ãìˆ'iI§— ñ£ÊÚ’ÚÆd‰\Ãè1\“,Lx)&`]yŸ<e\ñ;{˘#'Qõ‰«î‚$øidëmOÒÍå±\æº76‹¯’¸CÍ≈¸≥ˆk´4û≠’BÿùchÚãÎÜyO[Úu◊<©g@W"-àáﬂ©)‚÷Üd/=≤'√ƒh›JkèíÏñ\âÜ°∏hÔ˜F'æ72DJS+¥ã@ﬁ»r—ûôä≈kêπíﬂ:…·ïæL√Q:œ·W¶»p@ô£«i"nU‰ÈQô70geŒGÖ·1PÃ√Â=:q‘™¥ÌP°dB;tUïß”ú	IhÖ·•çàÈC¶ç∂áâ¸ï‚ƒ ¥T´ƒdsq/YF%3Ûl\ÒA◊3≠–∞ù¶†ê¯Uyú∏∞ΩëÒ°ß}ÂxHäkxñ¢`Ø•ÇSÀt·µ-
lπÍy’J≈óÑhÊT©Í‰ªr.˜≈\jÚÕ|J≤‘„‹O#∞]Ú7»Ïª<¨Zló«'Ü›âd¢D„4¯å…	„næQW‚SJ˜°ﬂ≠sP›:%ùX˛ÖÁ—  N·—y–“C%£dÆA9<!^¡Q“SQgÒ·ÍÕü±SÀ±çÆÌÿ!ceN´ß«ëA≤bS±¡4ìS∂!ÆœÑD¸M---_>ëL%/`àU”9™%«¢•ö/%B°˙ëãx⁄	#∞Ü–≠›ÆπÁ=ô'D◊|≥ôöƒÔrQt¥Ûo±õmôzút~ªÀ¥%ÿ∆a™˛÷ô–‹rΩ*—}»∆*3ÓÜ‹™Js¨‡êæìıéèRXìR@Ãj„g÷ÍÜb	7ÚÔÀ*@º@-I”Dï∆¸¡îË»iCöÏSI§@:>†)˙•p⁄‚H±z@±r¯Ó`±7Â∞%ÖÄ—8de+õ˝†2/´`4®Ÿ[D§’1KÚj qx-—lõnJ∫‘ IaQ ªóû≥Ö]‡{rµ”Q…˙É#[^µŒ!~…Ô¶îZœŒÄ÷¶÷ôí)˘íüÛ∞Ô~iYoú1˜Ók1£|Oöe[dM:Æ9qÅò˚üŸu›q√Vÿ5∆w‹à¯)-≥øØ’!ßwøäˆ[õ◊î·dÈ+§ïDfŸ3F|≥g≈¢„dk9éı÷r“Áˇ"{ÿd˙÷≥›÷‚2[DF∂¯ ÂÏEHVÔ)Ã√ÓZ+òæ“¢ÿΩâb∞∫õM2X&É}ÌK80yîjWΩìù"õdÑRü⁄3¸Â˘ª3€ga˜Ÿ)Êˇ	Ωòæ¡∂¶r? M
é≈q>€—qÖÆ≤§®óCπ†õû.≥ ®€ån®¿vé◊óàv}ÀEãOb±f†üÅ¶Ñ¯V=î]¶ØîFl´Ò>T4æ,	≥ƒêeÅïÜbXì,I∫F!Æí 9ΩÊ@S⁄?7é¶LU‚‡ÕÁ!!3™¨æ4–$heê’‘Ï@Ã≠≠G¿ìtî∫B/h*DN√;wùÑÁëã%GI&˚yh±˘L∂µTÑˇEòxs!_Z ,’√ñM’à◊g˙íM”ÚhÁÉé”—4[∫Œ‚Tc;IØh1e˝^Ã•lj:éÈû∫på	Î◊®?l≥o>πÊEÀá É¿z.ß£éWdƒ5ØcætÛgﬂ–ùtªsf“·¶Z∑eMyï&dÀÚü™êíÎ!Å*≠@ÍT1Ñ mB~6»M≥Ä€qxhí∂-≤°°ë·U€¿ÅCûK§"Ê/”j€n‚π”»ÓælØ›Gñtü•‚ˆ≥}Òq)o"ßh√Uß¢¸®∫è¢>¸πóGy›zòı◊∆#ÓBOzV≠˝∂)Q≠¬¯XtUVª˚é „GÖ]ú¶°›ÑXYK‚òHè%ﬁã¬¶02‚rNÕJµ€˘7^‰+⁄w∆,P‰ü 3ï∫IwqesëKÕn[caw°3dAäÃÙ¨Äóço-‰6|˚;ëK’Éâπà≠m]Ú‰5π…1ÁÕ∑ØÍ2ÿÑÏ2E^xú≤“[ÛúC_∆Á:L
&™–qÉ˜€H¿IxqE@"ú…«<2ûΩÁ‘fÂMÉÅùﬂ0 m7ÏB63@jRô†ÈEØáßV1âÉ6ÂK)‰v?ÏÃ';Â“ø*‰>Ád0ô=¿q¡^ØuV◊æíp3Íª’ŒÁüU VQÃS‡bW9Ò–""ˆœÑS@"4aA€‘û<çä5ò MFH3.˚©Œ
˛Ë$+:Tæ\§…sœÄ5≈X?AÚA(©~¥åıÈÇ(9àWπsÕˇ©æ6”sq£˙´˙^C@_ûéÅ†;◊π/jﬂ≤ó∏¯]ıÛ]Å≤πs-ˇ®}”cusÚw’˝T]&æ≈ÕRH÷JQÒ—ìí€+∫Eß2 "”óx“ûny©ã´≥¥ïC≈‚•x¨˛c√µCØ›ıŸÖÔìÿ:¯Æ®·o‘#1°∞?4∑Gy$ !‡Øg%¸á’>A™.
˙Îpä·ˇ
Ç~{ΩêõõèÆ®gRúŸ&jrªµ®˘Æ∆ÿM∂k‹Nzå≥∏æïÈ\ú5ÃÌ®Msã)Ï”[Òf‰ÛCá∑∫–§zWáëÆ·,ÆÂêìø’úîıWU@D›‹’%~îƒ∂¢≤„®W+–óå1©VxÅL  ⁄¶zÚ°cΩÂükN˚ú«≠l]’‘—W $L£Ïòe÷´e%ä@í,>JYo&∑NÌ‹ùÉ`ˇŸgiL©6
Î≥œ∏À‡≥œˆì∫81Ä
¸»u£.⁄©-9 ‘àÎÜfxÀ\≈!€|“¡©É=$∂NµΩ±^°®öô≠ÿI”ÃêıW‘§z∞\¶ÂÖPÖjú#f›:}º∑ø¥Ã†Ÿ0•Ëb¢Råã≤åÏgÑ°\3oD¯Ñ„Ø	}ÀJç,›√–TŸ∑‹ﬁò°G
ò°+Á3`}«Îb!"~ä]‘Œ‰èŸŸﬁã3È›≠÷ﬁj¶∫ﬁ5S‚€{òwìjaï3˙¶
ÊsCÆ∑K£ò¡ó'ß÷gUtuqk
yR’é™∫÷ƒ[t¿¸^
jÆ‘;s3ùD∆ˆìœã˙qnrìzŸı∆¸ï–∏ß+k5äh≠ÓWØÑRc7Ö.
ú¸¬ÓGæÖËtqU∞ŸÄ¯‘é‹ÓΩ¢sz≤wOÈIx·Ñt^R∫h
óÖÙ∞±∏dÀ|a±KèìQ_ÓôËÂ˘d£	õRÇ¶©©XfåÕáûd´ÿWπ∫ìp›Dö“7;}˘*«PŸ&âE\ÖNe¨EË”Õ¥⁄[ú%.P°˘i^Ûsü=EÌ±æ˘˜iNû+ô—¡t&EaƒÄô|Ví˜`hw§gªÈî0å«ê|^u{ìuŒÁïærMo+v∑óB°;æ1ﬁ£≤3{˚ÁGø>‰/x˘‰Imﬂ‰Î_ÎOÆ*æ[ÏJ—˜\ôW⁄bÒFåèjOsïÙ˘|Ô1€Ëlm≥˝Á{ggágÏS∂ˇÍÙÙhˇ’ÛW/ÿãΩ„Ωßá/èœKù™+%\◊ÜíMÑÅTÇˆU‘√ÎüZ˛®çN∫∂ºø=à∫e∂ê˚y£XÈ±QÚµrpÉPZì¨É∑∂ëÆ‰Éf¡TÍ¡∆jﬁÏêEã∫_Y˚#’»√UFa◊©W\ep™N$ôzI¡hï…„»Ájîfe‰#‘nâ±jÇQÆï¬vdÁ∑	5uØd6¥{Ï1∆.Nn¢™âÒKõCRie˙À?2%ã√Ql≥\©	±√ûsºâß∆e‰2h‹`≠ß«Kú≥ûFÓ∑∂ÀŒåa◊c≠”≥•¶4¥znZRπz=[∫:cRKô´≥{`awüõöTﬁ±¨Kù‡†>ã∫u’ßI&∑ƒ§N	ãi£⁄—ñ”ìàÏﬂ°—G.>?ZÑ»>m¬Ú«ÀÏDXo8ˇØ"◊Ü@¡Ú\æÏ¿ü°Ú‡H]Ù~,CØFqÜåÈaPØ¥ 	s¸°‘	Ñ‚l◊√èF;UË∫Tôä*èÀ ≈≠¯yÌäh»ÕT	 „(ˆa#TÂ	N»LÂN•aU∏WäSê)´TÕ¶™+a∂B¬ßÚ—Ó)ıµ&M€ñüﬁaX ÏÔ˛œ4{∏^Z&ótŸÙ÷íÉ}âéò}qäÎöá≥Ãdät¢Î.gê≤Å&›Í°q•'ìOjèËÙ¢BæQ=ü¬[Û”DÊ1rSû ≈E"èq‚fA„?¸Î{I„íÁX4.›w4^†q•ÁIºN1Ê^∑04ˇ›ﬁKœ2•™€∑EÎï?TàR/GñÉ.D›–Ë¢ƒÔãNr1lÏ8F7
R%fàíﬂíRª≈0Û8ﬂD∫U˘ˆ;«ı8å@–√Ë∑Æ·ÀR£ÂØıyÉ4ÂÙ+óÉ≤TjÊjÀHkæíÈ3…ØÒ`1;k‘Ø…π‚ î5π/ΩÙ ≤fç™Eã[F˛ª_¢€í0S∑„ñ¯8GF Êw¥N˙™\ò ù¿Y~ó§ö©/¡µ∑”X…©clıÆá)âK·L|¯‘è‰„"Øﬂ˝ÿÍΩlﬂC¡<·Ü™ÊL√©ŸPæπ∫?9é™@_—]ì≈DπIÅπº#ä«``ª9—Î:ÃÿÇ?Ú/÷«µ˛WÏE‰Ñvq:ÿ~<#l?ûëwFvéû˚ı»1‹üµeFÛëŸˇ`œ˘Ë€'0z∂o∏oç‰@Gcﬂ;£1ïâ˝50~ò´üùFÙë—⁄çÎzmÒ`≠/F»æö;7¢˛ \öÓxOÏ¨ÂsU{¿ì øÆ’" (Q†RÉúl˜‘hë5∫H5fZÒGér`Å'Ú‹{Íñ${M¡åÔÙSf¸5ÅÑuø—”R˙%*∆œüú≥˝ó«Á{G«áß€¬Éû ‘âeÕt¸ÀÅï–!˘ûCG„2åõqruu6B≈◊>Q8≠T◊zàeÕZéFÅ )_§⁄›%ë&ò7≈‘p>äÎ3Áú®4î-Á!E¥°—˘f¿é—◊ƒÁ¸9⁄xö√⁄Í¬Ù´C¯\Ã”ã∫C;‹π …9ñÚ∑g ))ÕQGp/ÿö°å0qlRi2«∞õÏV~’ìâïb„èV¯€zƒ´ò◊ﬁ¢Sƒ‹∑~¡f≠ˆòãKV#w≠À}5ìT"?N=Ø[Ö<Sn›ÍÙ;w.{äWˆ†iÃ5(0[´˘mG)o.Ûl÷S“V-O◊(Ø,d.øW¸&5 ÙAá∂q˙©ﬂîıŒﬂŸûà#8T©ıÄÔ⁄¶zDÃπ’4TÃ»ë1µ<˜˚LÉI<HV¢Æßª˙Ç£πuOƒEú∆ŸYo‡	$˚¸wù¿‚—_¡°Áãe~—ëŒﬂ%îõy#Œ.≈R.»üÑªù•]€èVƒùªM1q∑§øÆ¨[Ú'·!eio‰¸ª;W :ˇ(|[Ez;}¥ÅÑá∂Q÷C˘ˆÔØˇÅâO:›ÒÉÛÇàv∂2|P@åƒ6’ƒzI`ÑâÒSzﬂ8ésêÚæe∏ﬂínt!ß¿∏j⁄˜Ø’Xx≠(ãGˇ•ô^ê&–Ê∆‹x'cƒi°¥ƒQ≤£.Ω$í®n‹2hôl'.|§µ‘€Ì9ëi¯^níXyàXåV]íÜ`7º	+Œ“ÇF„@»¬ÁVﬁìú$*¥∆gY⁄Cä¥õæÑ‰ÀÕ—]ÔäZ˝ØûXñùÎxÖtkrÇ^ΩL,≤'Õ’†ÛW™≤oû§ZXt˚ı∫”È‡ﬂÀL—÷Wµ±"ñuû§s¯Ø⁄¢ÿ5¸éˇãÄπÒ^–ÌØ∆›dL@ºR[%ë%7ƒFŒ¿u?µ|‹
),∑mD5^ÉN¡‰JÉøV™]=àp©ã¥V7ç‚2ÂêÄú_`Aï¥‘àçõî»£àme∏Ê ˝Tø2Q9±_†Ù+) .˛–Sπ≤&I…i3ÏÌ∂c`"$a
ˆó∏Ë`‚öA@˙ ÀJk£
Û8.Äè:O•#Õ±.≠#¥zvO=Djê.ÒXn˚‘7|øô˙©%Î(;†>;´QÊ%¡‹W?y•
.=s8ìhõDã m≈íà©Dä¡§~J+g ¬Y;ÀÕêhh»ú,ß≠€c`Ÿv/ebnÉX…| í±Äª©˚π1Æ»€ÊÔRX≈Tk∑»ÏQQä‘8eÏÆ˛π"±´>Œ≤Ê'§êµNl	¡TsﬂDıZ(ßı@Óìa≠RíÕÚ…nÂÒèy¥K80´åkπ‘≥¥sq´∫XG©˘à"UÙ„Û¨ü≥¶‰Q)`{È«}¢:µé&N≠h<áögÜpVÈß4N;0˛-≠:4V’VJç<\<nîFâI®©É¨Ç€Ú,ÂhT¿≥‘¡dôQèVVJ{f—“s»µ¬Ë†¯‹$-£IÇÙ@QﬁT &ˆíX¨*ß"`Òö˘Yb}œÁ(\Öœ	±¸ÉÙxæÄâ·ã!Êà^i@‡§∏K≠%>ìK‰®E˙{“ÄYá∆É">“ZÖècM‡ÿ%Ô'ΩûVAÄ¶æ9|Rìß^[}¶k\xÕ∂ˆ:˘a·[? Çìæıñ ≥w]ˇ|î9'x‰™~€‚	ıÌZ∂^∫¸Z≥∫ò!ˆÕ∏˛˘πoŸDÌT%‘y<o∫≠±\am|M≥&äRÏz'vú›I±2kÛAM≈πRg„Ñÿ8¡¥"ç¥ZÑM2PÁ+¡'.l~`∂´`4ﬂ	6ôŸ;	ˆNÇ-øÓ$ÿäÔ$ÿÙu'¡ﬁI∞≈%ÿçí’;Q6)ÃS'…V«¶Õ@§≠+üV'–∆ªxæÚl	<¬œE¢-Ì√ñi„ÒºRmzvÔ‰⁄;π∂¸∫ìk+ºìk”◊ù\{'◊/îk7;ô∏¸Y…¥NøF¸ûµà´qÆ#ÏÜñ·‘
ª5±.§¿Aôµ]»ï â…≥¶˘¬4ˇ∂VòÊw`∫¸|ÖiôOÚÛ•Ûõü Õ%]E]ÔÉúõ˝N ˝§‹…∂[z≤ÌùD{'—ﬁI¥ôf~Ü-•,IÈØuø°ê|zÙÙY*E§ur†–›ÂSv`ÖÜÌ∞ƒ'©kØGKyX)R\ﬂÀÏZŸ†1*\‘¡X[/eô≤‡hbòH[ÿ≤51ö´åçy†6O⁄n{–~{§ìF(èlfœf:wªWë´S]tb≠°ËDEúπ*=◊ºç0_Nd•ë≤'î06+8aå˜õ®/™˛ìÑé˜‚BúûîÑÛhe∞Ÿ“∆£q%¸#]Rî§íâû0)û2!+∆<Õ8UÒ¯∞DÑÎø$È!&Øcm‰ëqÈb60f¨˙.Í∑0—6ØHX]Ùìè±°êTC¨∫üÎ•Á*J®+Â‹òD†÷V°)yæ≈JHÜ∞Åeòï≈y™∫V¡UÓ◊2ïò)4”ñ˝∑ÉCéb∑ﬂÃ˜Íßp≥∫¥7E9ü≠ç¢…Î'_ZékTÂE‘:‚˛ÙO?¸˚ø˝Äu“†óíN⁄≈™'tY¥ÆÊFî÷9:H’“·oG}å˙Z¢2ÀR(ı-ÎdÑÚÁ5ñ¶Ñür+ú¬ò"„J≈/’…∏ß„L©´4-0ïÚ7Ë'Ú8Ωz≠"◊∫'•xRG"—Ñ∞45K]e®BáÈÜt¡±‘U…R°kÏ)yp$ÖÄ∏Ωj∂Å3Â-Mµ!$BÕÅ<ŒY-•KzõÉÑ3•Æ˜ü÷µ ûí+O˙$$-u’“˛4êZ‚¢*≈Ô)’‘›õ/,’‘›ªEx™©˚:Oò*uQ‡™í{ßÂ∏∑#xà\È_Eæòvè‚ø˝é…‚ïg≤¢ñ‰L∏¨hÍVÿlnﬂ<=^ÿÕU¿å7Ãd-ûû-ÏÍgÍµ9á=8°ÓQ≠!ZX{2AÖÌıÿ’ZPi âÜs†Ë‹: hÿ≠√	®Bj⁄H'∑"æïÓŒ≠J£] øï›l9'œ÷jAû£*.Ì√v™ÖQóñ	}Ú¢∫nuÏ^FÅÈÑ ¥ñt†««Ú√÷¬âc°!Y=¥∏?AëÊË]TÑÊ6æÙùÔê ¥#ªÇà˜	ü”´ë©∞£•Q´ï∑5,kÃétõïÕÊ2πn∏L5¬≈a˙„¬ûz^0zÍÏ◊ÖËpÀÓÛÕxüÎ† UÌˆ\dná€.?âk"k“ìœƒcÂÃxkMÌt„∂.ﬁ“DÜ72√!ùXsÇaÀzàÇaR5˛n¨öæ^o6•ÿÍ™Ê¶äáµ*0"∂X¥ô^ì
º"÷W/-†!O⁄…? p@≤A%P
•‹Ÿˆ¥/W)úÚÂqör.]:ìÆÚ˝Õã©Lël‚J:aõ§FäêM§OõË£¢Mh⁄6¿+‘ój‚ãdó≤RÍ(HúôS`NÇ)¥Í:î≤aHW∂K “™J≤~.MƒÜÌ˛ ƒzwô±À(°∫ô∑O#§"T∞o;≠!-Ü%T=a{R7Œ6(+‘êQÉeﬂ3T;ı^ê”òB?¢èx‚ß¥á≠ u•ø}∏ïˆ˝´£c-ãbñ÷÷R˙ò”/Åblƒ&¥ç»ê)úQÈï4Ö?„¿©ÀÌŸNVÜ[Á2‹∫Üß§8ﬁ]©jh1≈Ÿ^MhüÁ†‡;îŒ4Ü}ƒ¨ºP‚∫‘äHÄ¥-k‡§¶#Í∫î=cÙÙåü†ì?Fs¶/“JÚùïÙ~Só˝!BC],@môÏÖ˙mØ:j-~oΩá}•¸Çá=B÷úíQå3âÕ?YX”ç™ê_mîÊöBYZãEÚÖ›s/ƒí‚ad¬∏Íµ◊ºTEe(9ìMA(ÿÆ.ôs†˙ï+í–ÁUïê∏KmbZâåiD¸Å,µ,Ω€ÑóS‰Z˚˚µ‹™_jπC\Ó∞#3<Dº*tˇ”Oã_¶
TI‚É§	«”rv“Goüà/≤ö©R/Ô•dó7°ˇÇïˇ†rë∂ŸÍm≠˛åíOˆNœŸ⁄6;?‹€vx ˆû?πøw~ÙÚ¯Ï6bãê⁄˘»√I¬zá‰– ±]Ö®ì)â˘"û≤oå≤bÙ$ï'yõ\néπ”£9·8≈d)˘{Ø‹(Áp\u¨qé1˚Üza(_§-ıP¡[nç?Oó1ò≠˝ìÇ› ’‘dü7Ô´Ñ-i¸ÿK÷ƒ∫A@9ßÃ„≈áX8∞eú>ìëıÒ‹|‹≥Õlúﬂäb"dà*àF"$œqÑáöÀ>¬îSÀãÀù>ckñ[è£e˙J2ª’{≠kÛ≤˝ÿ—√úùº §}øîÊrYrú7k≥$é¯˙‡wz√ﬂ[´‰PP≤]SMΩWÂÏÄ™a«c∫!*Ùï/-ì≤∂
Ø˙m|È¬ÓâBªﬂœ_tMvÜûj3Bu:¢1≠:∑“mÀt"ßïa/!Ó≤§˝\öæ0ÿhP≤Ãj*†íÄ^Y*-Kv¡ñ-bN≠°˜÷í|˙âÔ•µñs…Â2ò^0¨éz„¥”|**˜7%é®ÿ´– V‰’äw2*w{≠}V+/˙rü¡:˚L*¡6yYtLù:Æõ[MGmî,Er≈xÃêvf¨3) hKóŸ#yìz$OÁyﬂ–—™]ÏzIUSù= *£Ù•?L™q7û@g°oCX\ﬂÍ€X ,Q!òÌ¬˙ßƒRé|˚äß1ëU§NÂì°≥∞Ëó∫πóq¿.¶¡6wÆøQ$ﬂñÁ¥?)˙pIÿ
eö71WOäGfôßV	Ì…√âLÎ¬ "¸µhùMM∫\îÏ3ÌÄáµÔ \Y9˜ùNG'X6ßöí∏tF€πWTw@"+~[ØÔ–ﬁÀï"™JÑóö4°qΩHFaÛ N*πU'ºò‘]äπå•LóÑ&ÚÁã:∆6¬Lÿi–È[·°c·üè«Gfãæ≈ó–©˛Ï¸≈sAñ≤öcúÕuP]∂ô'GI‚û†6IÕÁûˆTc•‚’eØÅIZX ∆UÍ’’Õ∆›b
KÄBÑ:\íÏwﬂôﬁ•À`b#va˚AH¡•0`RpBñKkñÅ,‰ù§„∆g%‡Rˆ≤í{ufE=giﬂ^ﬂfgØˇÍpˇúº|±wtg€û¬∂˝ÿÛﬁºYÓ,Õ⁄nçŸæáÅ}IŸƒ)43Àˆπ—ÜÆöëËóæ1í·∑Réj∂kﬂ´p'ÅPÔOöè•:msNr«(ÜÎ¥—Û —7Xã‹√§®≥ÈdGﬂB(Mê~ÿs+\ƒ®&å7zC`ÒÇ0Ç–èza‰[¡Ω€≥_W,JX-¯¥çΩ¬lj}4<›`}NGÌg‘\u
¸	úqÕñ†¡êi‡?¯8„JÎ∑Ç‹¶ï)$9¶L1ñÚàóZ
Ò≠ ≥÷ªáq!QWÒ-ï}£^^í~ìÓ€ªFÑ+f†$6—ë”^”^¶F≈ﬁg∏¯ˇ˛—~ˆæ"∫5aO<àÊ3‡ö s”ô$’è t6ÉŸ¬ÓëÁ–»Û—R&Âë~DÕ“Nñ1Ãù ∆b`vÅôå±πˆÖm¡/J,9‹pº˛ág-ªŒ≥Tfó§bî≥+Ihó(È•—K+Ï"…ééàå|[»4?Œ64öÕ{bŸÀ¡ÁŒ!}8o´€m∑Ÿæ–ÁÛZ k∑ıåO1µO-¢ú§Õ
‡ãî¡O«»'Õ|dhqe}A⁄–'hv’¨˘÷o#€Áñ©mºÇ%π”≠{4Å]»K∆´ej0Ï^∞Ãˆ|bw,ßöÂ§Êwªè ~˘)Ñâô¿úlc∑«Ùç ∞V†Å‰hBf—”m¬–
›,^,√¸’ 4Uº˛ä™à`gr-'l{9ŒÇ:«∑s0zﬁ»ö+¨Ò∆ï∂‚P[˘:Q@aø`*ÜvÄﬁ®µ.÷4π≤ïùX2Ï†IDùR<@*Ùû{óñøoY0√πo?˝¥ÒL”Y€{ŸÓÈ¨fËè5ÓÜ’ø4Ïê]Xao–Z\1FˆäöâEê
ºÜV8Ãm∂xÚÚÏ|ëé.Åó@}∂Ÿ5[‹Vî›>á”cö3F|…£=Væ<wë›Ë5ﬁıÃÒ6˚’ŸÀ„é01Ä“‘“õÇ·Ä•◊{wåΩQB∫-•ƒòñû7D hœ”≈’uCÄƒÕÙÕü!¶P£∫|s–∏AÂ´7`-^∏•=«ÍXæÔ˘≠d2,¬±yÜÌX@ôÀL'òjÓ!Û1’ÎNßì„ÒÀH~_ëP"º,.Rt”¯eÿÜÁ3°‡±	E)‚ç£ê7"|◊„Æç…:(ä¡/îB˜°∫7∂ŸŸ˘´É√„sv
«»·Èù+± ï»êr/Ë¯¿6M´9Ó˝—´†PS`:øbú≤+S<Ÿ©«Â©÷2?ófËòT›CT~ke"eROÎ	⁄Ø7xÒàd∆¬d7ÚÈ≈∏¶òûπ%ŸlﬁvíM '!…àµtì¯E!XèAÁf/–µã<b"◊à”a„v∫,«≠Á‡L¥ñ‹ƒöx7Cs⁄Ùöı‘Ÿ•ï_£Ô¨§g⁄h∑]ñsÛ x⁄ÉÜ4õò1ßéÔ∆‹õ©2np…~n7jLÛÃ∏Ûºgr5Ñ˘co[L¶≈‘ÜéΩ)”F#ù¨±º(Éæ·ò\jÕÆêø˙q´<Û&ª„’Õk≈:ÙÊ‰êó„÷≥qDx¶‰ÿ*<S∞‘e∂¯*9TgîÜ#H∫,Áæ»√"kïXÍ()x8UUöÅ)—ää0¥ìs‚»1mÍ†E#‹´Ã˘kÑ—2~¨∂Açè◊«ëÏ≥göÈ•P‚Öíô&ëq?‰àÖ[Lˆ9å&“p8<ˇú}N-ëqéRoú”•÷]T s∆,õ√Û?ºÜâÛ}‰t¸Ú}D±∫◊kWcã”áî˝#Wb≤Ï•Bëÿv©ûuØ\œ¢5®ÌÔØÛˆÛ¥û¥Ø_t≥ƒ”ÚÖÆ€ˇ£Œ˘i⁄ÊÔCŒON®¸∞s~‘1SÃ˘IJ_~\â?5ˆ¸•â√^í—;∞‚7õÒ´o®¸©æ
iEm‚ ˛T∂Vé2y-S@œ¢Óπ—hö±ìw|9øØ,:Å=¨D–∆Û¿FnÜq|áaN£É¢˜[€HUÒÚf¨≤πﬁ≈ëB”ÕJËC3ë–·ÔF	ΩÈ~≤íP≥É%)òHj„”"7Í>ØaWWu^' @&qó“Z/Ïê\ 5–Ê®Kî-ˇÙódg7ßµøÑ1«Q†ä≠7ø∏ŸÈó≠_Ç?ûœ”vjS… ù|[™≥Éı⁄ûT¡ß≥/À;„[éqeôd≈%)ıä>å»öX_˚;T…eÜï
ˆ2zæá5T“˛≤*ô∑Ãõ(@‚_B∑Ç{%#’m<OL#Xë›i∫√H`?¯÷»ÛC÷√êw.wv=ÔM∞úπèòx›PLnh-Ó´≠F]´RN\Û^ÿ3Í/{l‘ÅîË’›‘f_Ô±Ä˜‹¨Ñ˜§’ént¡≈YE¿jÅÌ{ö8«àhû%Ô\Ø¬ˇ|K§ôDíO ≤ì/˛1œ?˝¯∑ˇí©≠9€âé≠Ω’Û\"óÁX˙hñ"WGt∂K!ä∂L∏™ú…«≥eSg∫J{€öhA‚‚Æ≥Xí˙c™ÒÙq˙©”gmù?˜kñ¶Úé{¯‰|õÌ˚ RRÇOS¨3ÔÁª
=ã±ß7„0ß∫æë©≥º∆‚)%qUM‚<πp•TPö]eepjm˝[µ—YZÌ'öQºïä∏JgP*BQÕìJ©·S·x˛º·ÒA&Æb$Îs>ÁD∑JmrA€¥pØfﬂÿ£‹ûì2¥√ùkaù€HN‘Mô∆⁄ÏñßÖVîíp^≠Œ◊∞K,ÍT¨üÃ==,µ:π∞Æ‹|Á¿ªäù`cµîuú"L<@sO;Xa:÷˘ÖgZ≠!60T∑∑"*=Xo»+ß»o'™ÊßË1’⁄πbr];[ÖbK1d'n+›Je\Ã1Õ˚°fól™NÍxÚ≥˛ß˙õˇ∑¶u∞˝d~˙ÒˇÖÒ4Ìq/-≠Q≥˛d„}ç˝üun¥ÃÊ0I7≤ë@fë‘»Ix⁄ú∆ê¢ÎîP#ùì»øWJÕH‚ôfF˙ey÷“
$mZ6¬∆v+ÌTÎ÷…È·¡·ì£„√ÉØœ~Û¸˘ﬁ„WgØR‡–«_âBâÿÓçÏﬁ‰ Ö¯tÇP»?Ì uΩï?ªÂ}◊S¨œ—Åkj8lœ7∫@9˚Ü„ÿ}ﬂ∆¥Yyüy%È9´‹V
4Ìh"Jù3QÕ¿˜&•«ç0dë~
6ÁeJ.ÏöòòŸE¢ƒgvaÅ·éâ"]π4à˘ \lHÇÚbVñæ˜{˚-ˆèœ˙¸ùKí¥é¢©ÍÔ˛O÷Ç€:qå1˚‘é~	'≤ã…≤Z7π7I€_ôÅ≤ıgìßõ”º"∂fUYﬁƒNú∏}÷hÿ˙_ˇ;ü4•ÿÔ?S˙ÔiíY}\.ı∫âx]ÜÌ§´‡e?gé¢{rO∞eíD{‹5ˇøŸ~¸EbyõxCäOÜÉmˇ¯GˆR~d+Ï…À~kΩ≥çI¥Ú:‡Ê∂Ê(%4Õ¯≠Ç˝ñZ:!±∏ïò¢'≈›jû~å»W%Ù§À÷7.≈îÒhÕö”'Y?éú7Ïπ«cJµSaÑ	DÄvÍuEyÃr¡zÃJ⁄¶PLR∂X≤ô}≤¯#˛dI vÖìû≤MämG„ˆO?˛„_≤ScdõÒ<?ˆ<™ı[•;7‹Sñd∞VÇí®"^\ ,‰?çc8PŸ–0L‘) 'Jl≈L¸ã°‘¥∞{ë	≤	∑aã#o$‚fèÌ˜2dÜÚµ!)bZ2(·èMæ=ÅI=
)§•≈9©∂ÒâQ∞DêıH‹{M3;I»õÖìÅÁb9ÓOŸÈ`<¥ÇÖeÖiãﬁÀYlöÙëIÎâ_wh¯@«Ê#ˆ∆s~ôT
^nﬁ„Pvp≤£NBxW,êÇ¶Iÿa®§∞±‹à`ïÚ lE÷í‰√ºEC‘–¯÷7z([£≤r@[#-p≠Zã√LìÉ„gë5)<÷‹†±Ja±FTt(:2ß∏_¸bÜ	Ñ{&Ü¢©ﬂú»…dü\Û‹$(¬ ƒ†8jızV†0;Ó|Cx¡∆SvQÇ,_.V…†_«∫KL©ÈçòâﬁUî©ıl;tÈoˇÖy´öi),QS≈õÛÊs6`á ∫ee*‚Yl4±Lâï`ÿÄçù[ΩÅ—Oj RVs®iü{}.9ÜëGËYœ∂‹û5◊>√⁄á0EHÆ¡\_ãü≤gñ·ÑvhFÇ≠ﬁõJÓDÖ;Q·NT–∫gû¢ÇÚ‹â
Û~¯W%*®ôæQ!9˙ñŸ…≥√;I°Ùä∏'ëbÒ¿¸√ñ“j‚Ûö›ëZvpWøgΩ˛âÌ.V|g{=æ˝Å=ŒypO-OFghæÁN:∏ìÓ§≠{Ê)ú˚wb¬|ƒÑﬂ˝Aâ	…\ﬂé†ê>˘ñπ:9Å¨–pﬂœJT¯ã»_Ñâ>µzv(–€[Á∆∑@9ÊRÍ¥Sa,≥<»Âõ_XCœ∑øãﬂ=∏∞øõ˜´üaÊÄ£~åÁ¸™'ˆo¨%z¿Å|;˘6“≥Ê= 3ÀÚx˘âÔçVà…ﬁ∂d(Øû\^:7¢Åm&£ﬁ˜oÅúd,Ìs√ÌGFﬂöÎ ˜ﬁ„∑ÏS∂g›dúá°˝€»
C“ ﬁââwb"^wb‚$˜ÃSLTQör'"ŒIDƒhX!"™ÈæQHÀLà 3©ï9~Æ¸# Nèû>;ﬂŒ%®ß–yÓásÑñaO1¶f“¨ıáı8…k´≈†3›¸Ûöüx	À{8eüp,Ç@3<Æ&∑<;ˆ?PcBW@Êé∫øäB![´Z—sì$–´“&ïÖ~%5úÚ∫Ûl_ÑÜë2œ)—kõ‚.àUå0rp<£∑∂u…†ØgÚ[Å∂$†qò“,∆'v6 gUå•¿£ÄSö('ZÍøM‰1ƒwz*ì]Ä”x €œr≠L”^òöö¥´’q©òæÆ2å•ö¯w˛!éhﬂ™<÷IJ%Cî‰òûm"~≥Õ˛|]#aE##Ê)Gº]É7lM˛ÇÁ√Ã<Ür?£
Y…ô˙·›≈°™w≈ÂäÆ>˜–v€Éˆ}ç#É£ƒïÑÒ'“ü‹Lp 9∆(àcˆõ]à∫aCøbwØ‹ﬂ*µ¯ï$Â ”ÇZeÒ-@G8H˜%`ƒ@·5?Tf¿—¡£ïp0´÷b·1ªÜ3)Q”6õÆØ‡ï"ÿ
Ø'4≠}∏Àoﬁç$z¢.öÓ+Ï Öˆò…?ô2s^P®†≤*PNP”ão":Aà îŒ¯;◊õ7πzò)ﬁU^lí"0º∞W* ∆ææ}a˜#üCl˙¢j
eôÄuÃ‘ûÀ°ßÖ^i∏0áXeMÂ‡OOìä3öKÒiY		¨ÜFvtdÇ	hZúFñ≥(√LG ~*0Ï£næ™XN˝ã2T^+◊®ƒ…1CÇÇE$Eá 1∫s¯7ªK]…˙˜kA`B]∫@Í îq‡Cv… ÍÚ‹«N‰k¶ 'W∫ÜzV◊*°û\≤ò:ZWÒ^µALØÚØ∏“euÂÒ’∫fùVW_N
7k3∆Koöâ OÍ ä0|Oç¨˜[B“øejA%∂7rm≠ö≤ñdÓÂ ‹JtŒ§*é≤HI0ßióõ"°k®Î]Ï~î'uΩMˆØØó˝ù\b^$W˝F…∏ÉJµnÌ4„1É˝ê¶Ó⁄∆¨„◊+Ô:»1Í“°8ùút=à¶äˆ+≤“'iõÔî<1ã-ù’9t:L∆ ù 8Û¢í⁄©öçÖèÂ’JJ;ñ)(‘w‘*≤™.QŸëc—{˛Po¥ZuÂ3ö’≈UZÛÒ à0·zBt‘®Ó(ÆÚ2õuGŸ¬å±(Õo»ä—¨ó~âØÙ%k4äa†aŸL V˘@öÂıﬁ†K)èŒ}#»ñÄ∏lo çˇ$ƒ€LsZ5’3zµp5ÿM+ƒãT∞´˘&ò7j4Ÿ!πınzK‰êhﬂ1R«^®kÖDlƒæ≈ãHfπï¯e-ã)ìbƒ“7¶Ø:ƒ”Æ"—ƒ√–ÅniÂ˛˝?ì∞â)æ¥ Ù=∑ø+˘ßéŸ°ı∏‘≈ûF∂i°sF‹ÔbnAëÖ:í""æ≈Ò˙B)03·V–a_,óahÙhçè=&Î!-´zí¯{h¡ç¿ñŸ(‚ÂL¯óqQêe4À®Ì¯ËÑ\‰E„ç| Ê:ÍÛb#™"†‰Dªo[º#ﬂzã∑˜å €⁄¡–{÷‚ÄÑè¨·Ó∆KèV‡ol3Ä˜ƒﬂ´˛Î˜˙Yn˘hï∂Ü‡{¢ºh}¢
Ô3÷€©∑Mm®o êØ˘uU≠xçØa1{o∞lmâ´˝¯Å}u?4V—˘^ÒÊ`Á∫Ï€*VXa…tñ˛P’é˙éöÉ ˜I¢ﬂâm≤’=f∑«ºe‚ÀüÀü*=¡Ëãª*‹Øy)û∫5zŒÔ;¡€™◊∆âo:çq˛õö5y^x∏‰À˜{-uO9≥á"éÍ‘qË∫Ï€π¨&Áü¿dæˆπlUª¢ÁÚ^!Ü’¨jòΩqÁ:˜EÕöûÁ-~w{+™9 ¯Î˝Z{#…™h–”¸7’cÛá|`O]ˇ¶‰ú≤4.Ãà¸´ÍŒ…9ÅÁoÌ>L’π4	Íú˝À∏Ã©¡ﬁ‘%TC∏kÜQE∞hwJX<¬‚IY¨∑	„Ÿëﬁè™’∆TÕCÖ—äÃ JÚ‚ç(F∑ßπJ∫sæ˜òmn≥ßß{áè_æ¸så?bßá'/OœŸ˛ﬁÈ¡{zx|x∫w˛Ú¥‰Ò©∫S¢\ä&ƒ‚ÚZtU¨ëÎ∂π≥`˘£∂‰mÎ ∂·ô7¥RúYx¿*ß˛É«ûÒXg÷5\◊™*;G´›ô.L
v~æïÅ.ÃWÎî—âWyKç≤Æˇ   ˇˇÏ}[oIvÊ_âf˜4ã€dÒZíöñÿ(ëÏn⁄EêÏi¡JV%YieUñ3≥D—4øÎÏ¨«0∞Üç∂ªX?ÔæÏ√˛ö˛€?aœ9q…àºFd%uœ$0”™bVdd\NúÀwæ≥°PãUé•E†Ãü¯ìAöv:ZÈ=#‚∂S[•¶˚ZRÛ≈D`ÄÕPÊ€F∞±
N¿‡ÆoohE9<^Ùj}´WcÍ)íÎ
V%2X!Û÷|óº©TÊ´ç¬;¢∂.fË!ß≠YsLîsDàF$!gpzÉ≈Yç©ìá`Z’T¡¥≈TÊE-˙≠w’‹Äá|ëâ#iπŒ*å…Œ‰M<,É	=L≈.{1ÄÌçßËª¢gå`˙ N.	Ï√˘ÖßW¶∞@áp?\Dh]zS0˙ﬁzaóı/Öôf%û‹´ ÚÃ,Êr#∞Zm¥°°≥‰¨‰ê∆ùÊ¸ƒ÷2•Ÿ¨3ÎnêÕı0∑j+`f˝ÁΩ∆·<ê%æ´<:ïåõ›ÍMVdoÆ®ƒ[E·úCl—ÿ.Ìm*–»9´ƒÀ¨≥o`º¶Ï x‡
h†tn
Á…–n;⁄iÙîjwóSòØf√˘∫u7„◊“∑-)ËO9ΩXóâö·HHj6†nVÎG’ØXÅ˛Àbg:‚÷:Édc˝Q9á4»˘*∞ÌV)ÿVá˝ÂºÏRC∞Û∂◊§Fî}ŸE,Væ
˘¥)ˆ"-	
¢“-ü∫dÙ`aıo"ƒm"j¨ˆbTx G¨ÎîÏ…∞¸ã I›4˙w œÖª≥ ÒV|©è÷˘≈(Û¬Æ?71µ•ƒî,a-^N±YÿTxÕY<…"wˆ™TåXóó	˙àáOn?±ñëø8¢Fa7ÇÖ§7∞2≤ÔƒΩì(≈&¢kø2¯÷N‡òÀ JÊtö3˙9ÓK∏QˆCLÊœ$’d»Öó\0ô≥_{r	àb÷¯W]ÈE˙ä$≠éÊVÜ\£ﬂ(¡∆?Ìâˇ⁄@VVPÿN`9÷xV:Û	π ?T(òg˛ CÁRgÓ·øH,ÔQ(St„(´ÌW˘K «Hƒ˝•=ú◊èfÁ9¥ıeµÒÊñ†•÷VT¬»_zfı[Ô≠∆ﬂÉKU¸m·ªÚﬂÍx,zƒÅüzAò»¢•≈øTåªhnæ9È√‡kü Ôø¬4+º'Êk‚…m˛õ≤ﬂ≠W/Q(nR±nqFóØ«¸îPé}˛ÙA|ùÄ∫—D	˚Y£+RJUKÑ∫Œ·Éƒ*¿˛…≈n@ø+I'ÎÑ^ÍZ§+a5 §+>–˚ÈÌW`Ó¬M‰q+ˆ™á'’⁄& «O‰ﬂÀQ0∂5£rƒI*FENö§ó¨¸ßA¬K˙bí¸≥°ÍîâÚÅYq8êø”õÔé—ëÇ‚ê‘ïØ∫/+ˆoYuqá™m+}Úf`#ª6˝„~’y˙fŸÇÍW˘Ã√íªÙ¬ƒØ]A"[Y‹,.xÔg¯3xœΩ4ﬁ=„¿sÀ'$áçpûy£umÚõøé‚sÓváv;˙nÉV¥Y£O˙Sà&•LK‡Ô-]Æx±Üdï9]eJH Í™ﬁ∑O⁄/K‘ﬂ©…—ü^4∞4ä™;ã)ﬂ¨–ù:€WµôwÂóöΩ_™Ã∏1&‚‰%rüóX§v–[m≠Ÿ‰¬’¡hUü¸¢XæL˛eKFkx5πJ£æykÖ™˝Òüˇö©◊‰æ¸S8j·ÅÕµeÌ∆%äæã€éeÜ≈À·Í  {Ÿ(
‚}¯ÿ¡_cO`E(ß ¢l5¥?˝œ≤˜Ó|á5“ŸSädÅÉfÃ•˝0∑ÿ™$”zÇù˜µ<ã≈⁄	1¿:á√ÄpÄ≥&4ÎmÓ†´”œ.c¬Z´!¶Oèz˘¶ØùˆøπÜ]V∞
Yc∫Ü/‘kÚJ9¨mÓ‡#ƒpà0ˇ˝LèM5≠≤êc“ÿ¶û÷AêLCÔmÀ[√bâ”wÃüêd(≠,ò
Ç∫wq%‘\Mπˆ[qUå&4¿TÈå˛zq”¶{^¢∏ã)ŒﬁµÄ1YxSt≥†¿È.±]’öhÄRù≈”cüá•ÿå‰“4
É&û«º‹c“]jˇZˆöy9ù Fÿ*5ΩàÚﬁ‹™K/∑œ+ßlraI„¸e&Hbíaå˛ÅŸ‰‘É:òo√ 5	Ù&JÕ]ATu¯ãµÀ ·ÌHÈqΩˆÿoÔÅt£F«≠ÅÅ‰5JÙπõí∂„∆⁄6ª^€\ﬂ÷∆J=ô'∏tòá,√Ã,”[G˘@ê\ØÎs}T?Bq”aQ˚y∏9rèÄıÁüÂZ⁄€œ–‹√∑ŒN	≈Ò#Ï0‹»é…“Aüpî;æ˙ éU¥…IR∞—ÃsQŸÚzıá≥Å?\∂yÜCD∆qœÏ˘TNßºlSÂ®∑Zﬂ%÷	5Ø[N{◊HW˝D°;v{Zéy‹›äµ¬meâT£πÀW£p°ˇÂ_≤Â˛≤K∑ú≤ÿ
„]î;◊´íÿ”o∆ï4îZ ·Õ^˜ûÉ]≥ı`Ì¯3Z[]PÛÇ¥≥º∂º“ùF”Œ ›k€Õ≈Ω∂€;Âºv‹=™#%ã
AH»¢U®16îò Âπ¬éÈæáB©vy#«$_[ﬁ’~)–4€h⁄k/Ì√÷vÓ–«Ω‡√NÉÈöËnÔÇ—∫‹y©N´l˘ ;MA¯‚'ûìyÖà}:˚8§	NΩ_#ÂL†‰ΩZeç3~∆Ò«∫&ÜªVW»_Ü¶hÆ∫˜%ó ÔŒ®#ïê†1Œ–¶F‘"ˆ·˙ïÈ<ª-üMOÔË⁄û9∑w+Ì:ƒXâÍµÀ¯ri’¢˚º¬o\å*¬:bbù	ëú)] DÃÌÎÃÂªY¡g°1&àØñ'Å}÷fyHÌ§Á3zwvb?PG¥˛çñˇ¡QÂ—ø¶kóû§æÚ\µô]ó”ÿ)2/≥#bÕΩ„ˆ⁄õº\I&‡xi'Ø€–I‘¡[Àü·D?·¨
Ω7öw≤;yNfr=«¡‰…“ÜÛØºwOñ–πÊ¯;?Î∫åylœÕÓeı!Qú}ì…™¯‰ΩÎ¿øèiRÚ¯^<7VZã–⁄Í	‹›“VC‡˙oc.›†T3x€ÍPq?][®Tú’√´ΩeΩ+‚ûÎèz’æ!‹L‘∑‡i70ﬂ9?ê\Ü∆Y™æÕôû-¿ﬁÂó+3RÉIúçWÅauÉúUK{Î^ÃùüÀıÄ[ºimK√dSÁ}3,U˝πúsÇ_∂Â§ŸÏ4∫Æ%]*„Ì±ç¶X˙ºeKƒÜ,	eq!±—Õz-;µπäU›SqûÊHW—AúÖÒsº¶¶wx_§¶Ú0O8Â”`·òuÖs‹
vâ†˝.ÎOnò?0ÚôÀlïåùäΩÇ°öüP“lBÈß7SÜ.¢ﬁI≥æâ”gQŒ‰^ UŒßâÕYÏí8Õ„1LË?◊pÇD◊]Ò]Áu&Ë&ö1Ô"â¬Yä®‚™¬ÔÆ=Lèéd∆3íôVÇõz°>+¢Ì†¸%8·==_˙+vŒ9÷¡t¶5éeN¥UÂ0	åWo)ÅÒ6?µD°ÅPeã0‹-&«ª[Ô)µßôë2{”MóÕ£í›tŸºáKTVp◊eK5X0.}≥÷m⁄ˆñÍÎÛ.ıëÃöé¯n3c˙Ôë≥eqóó¥≈-Z—–$bŸPMîÿnt^ø±ƒ0Ç&≠:jU$í◊z¸Èáﬂ˝wï¨Y*ÔKÜµ ’ç˙èü‹K˝GÕãôs)~i:6çTYÌõ!~¿$Î…D\ÕR„—ºC7ÁÓ≠!µ)±–∂+,¥^o.ÕÌB0Ã9ÿn9€®Pˇz∞@~Ú1á¨IÉ≠¸]È:≈î⁄JÁgS˛áôÓa8¨Ñü_rózÇ gr9÷`5ºıQÛ
#oHÍ-^Qäi´‰&ûzW~ﬂL5„ß’ΩÔëTÏÈ.€?<>?Ì?c˚/éœ^<;:ËüΩ8fü≥ß/˙ßÏÙ≈ãÁ¨ÛıãSvˆ›…È·ÛC÷?x~t|Vøoû1CR⁄–ça—»5iE≠çfvtc•À®‰+ú§¸¸a∆6ı-XÇÏÿ{kOT*Ç´π≈≤ŒW∞åπpã)7¿xòπ‡ﬂµ’|Î≠˙˙,ßÑÃNV¡˘EÀsâ5±íUdIV–x”>ìBM4∑ÀN£h,Ú|L:´}µÍhê¯etb[µ|b⁄≤ßh∞cb/Â}‘∂∞Á’‰b‘á¢ã√,ßëπ7˙≥aêVÑ¥ûãçózÃ{‰søàP¡Wâ6ÏP˚.ÉA†¯ûÒ{¬Âc].‘E¡˘w$É^%—>ÊïdU˝∞oIØ[áÕ∑Q¸º72∏¡÷\õMÆº“mò\”dÆon∞<ùgúL/÷¶Ô`tÕu·≈ı…&MÓô∂Ñà?S*ßﬂ\Ü—oê†{π∆•™cÍ4<ÿx;åjz‘é¥IÂ0¿mÖz∑ÛÄ<„Ö¯ëíΩT≠NÖà C)PöCΩU«z=SÜë∞æÂ]’≤^˝FﬂcΩ^1Œøµ—´n∂:>_≥’œ·πË˝nj*ª;†ÍÓ¿πì7kÊ;◊sGJÕ˜ñ.Ú"`_é∂ åƒ=€PäΩIÎùes—Òß$:~Iã€xØy◊wÔÁΩæøÜ√‰–º∫y¬´›‚Ó´SN.Èì8∫Ç”.a˚8Ízeg¥Àø§u≠Ω’Ô˘™~Eo^L˝IÛ™ñÈvÎ:´⁄Ä)Iì	¶hÚı˝}øA€¯É/m¥≈Q“öø–Ô˘Çﬁ˜BÎ 4/hJÓﬁÈŸ¨f$S„ÇîÚ30;êù1˛–Î7¿´˛¢∞x£ﬂÛ|bík“ºÄ¡-≈1í∑€MÇK =ó¡’<+∏%i·¢}êxù}˜î|ëõª¨øﬂ?8|~¥œNOø~q˙ºº»˙«˝gø9?⁄?cüãíg--⁄ˇHo]o5÷îÉ© ™m[‹ ØäØqfê«m∏6ÒØÖª«tF=ÛáWïLíeΩ] S‚gqtL gÇºKPïñÏKÌ8óŒFÅ©‚Ie!UVRJã®“„—∂Ê…‡s¢†«⁄˜Ü;£>¡Œ-Æ‰Ò%ƒÕ„ı—ˆ¸ #õRäûW&”
ß"≈j¶ôaï ﬂ1ZCÂrSç$ö•≤}`‹E¶, ∞äˇ
oDYÅ´÷(ßË|·.î˛DÓáÙ>Õ«Ñ◊óªgvQ|QFö∆ôüv¿ô]Ñøxb4ÇD8÷£ys¬ÎÎã` ,kö‡JŒÄìSñ=Å';’Gÿ9¯»äé”ÏP{˛M~uéÙõeºõ¯%/l_I∏)û6Ì&ø™»7çÅë¸∞‘˜˛€+J≥¥Ω∞™íFMPÕo•óe◊ÑÑ{P/˙†´yW~R”)q;yÆ€|¿J◊{{’ ®‡œO£‘œ¿ˆ}íÔJ7ˆ1ﬂµ”If„UL‡⁄=‹˙#!≥— 1î∑AGhG=l=ÀÊÿ\-<òOH}"«ùÕ*ãµd¡tj`6ÒÃOS"ï¨òtTˆèÂøwÕ…∫¡?ûÓf›π[Å&∞ΩÊÁ”àIé=æ»Õı°Kú≤d¶;)Ù1çg˛ä”⁄A[_gﬂ˙·1∞yPF≤‚ÈˇKcœqâÚüråÿ—ÑûPÕ¥?√”§Lä	ª6‰e@xP/1Ô6l0¸Õ…ﬂÓ˜ƒ»i?©ﬂDÊdDÒ°7Ÿ·<3éçv%c`cÙ
wtôøcôXÓyS®b=—`s]1ﬂ˚ã/ö⁄! £ŸX›[…ÕîesŸT5˝‡Æ˛à∞ñÒÀá„iz”0hÿVnU<…oB!∞Tªj`õõŒ-Í=Ω{}©ÿıÖb◊–û¸]ÛZ®óûVÃ:ï∞éBîFÛëœñPˆì,•ÓÒÆ)¢˙vïÖïÎ˙q›n[¶ÿX^‚æZˆîÚaÃ9ëmTp>V A‚2ÆÀtZŒ–(≠n?Üq≈Z›TÃ¶∫»úÒ¬÷ZèG;≈å∞±Å	1Û]8AQkV<ïá∫–√çGG÷.&")r%˚≥¬‰VÚljÛß∂Q.+˛°Q§G·}ñˆnïF‚–90twlÿœ¨ñqÖ≥À∏–û∏≥ï¥Në¡ÀHìæ,UF¸≠Ïß≥çdD∆BınGd¬®ï%r\DÈz?…~°‘°' ıà1ÎœsüÔ,AÜPªºÙ,—’,∆i$òÎÇ(ü4\âR¬<ƒM{WuöfMøûíRx…Ë«\Â\’È=Ã¯vHA6ûÛçëF±∏g¿≤»ä	)Ω≥≥‹≤Í+Üµ«WÃ® .\“ßKa!-7jx˙Âú(„û¨ü≥´v…®ri`æ©fIQSã¬°ô;óg∂O5ZP≤ë˛“˙Zuya˚µkªÃ˘BÚÉö;Gà:nyü»¬2áì≥|•Ôk¢„[hÁÅò∏@}¿K8˘4Wı–*Aàzg◊ΩÚbF¶ê¸Ú°	T/Á|RjMπØ*)‘mÚÜl¥KU¥$.≥çâ=Vi=x—·,ï£÷Éï∫)„≥ø î;EP¸Å+|\uÀ-uÃvLÍ‰ı`SX¸>hÄ)‚Ñ]«∏ÿ" sˆcßM!úΩMΩ+/ò¥TyW?ê7J„—¨ºqG;ÕçQØ∑µl~QJ[È (≈äwÆïæVxı˘˝ËU5*ıÛ’’J◊¬/[S+¨“?ËiÔEO˚óø…¢1âC¸/hBËÇÄãó—Q =s€˙Ëi•ò)»à“ Ëõ_ÄJv•è\œ£ñù˙úì
IW9Y?S≈¨çJÜAprüP‰ÄB-Éc`<M;KT⁄ïùŸâ„‹cŒ‹˘éåÆóéﬂΩÍ≤ùT∫z+ªK´ligc…ûQU´ fÚ∏ìuàX	µ˛=÷"PV·≤¡0$Æ ’8íÌ∆≈7*PtÇKxÇÉ6Ö·ÿ±øI˙√!±2ZUû‡◊˚WŸÃ*Ê(p%À∂vÜº(:HÌ=÷◊è,5Ãˆû0mô±5∂Ω‚r¬dùÜÆ^Büç∂ËnDäeÔ¨∑ÍÿZ6Û_<°.∫¸ﬁApQ_qJ¥éQ∞÷eƒ[®ømàE%•®9#nmP≈>7:wŸk¨na|G®ÉÂ;ˆÚ¨ˇ¸LÑ)n∂À˙◊∆Á≥€l∞Óëæ!=Iñ`ƒêaÄ®«Ó´◊]0≈∆ùÊb}ŸÂ ZÏóá´tXNö4œ(ç‰)◊˚¨œ!Âx˚wtŸÑËJ”fIü–xxIF≥e¡ƒWƒ~ËQ‰n˜ê€8œ∆ŸƒqyD>élªﬂ˝Í~√2j≠“»«™Çj§!ºÏ
ˆ≈&éË€Ÿd®@‘ªCx&2≥àqC7é¸pä”ü®ñûM°/°üîh•Ó`´!õCø˙GÊ´ÔZ}œÒÖ/TJá*¬Ü;à ∂ﬁ––H∆fq¯nÍ·r‚hË“V´Ωf§Gh†Ñ^≠MÉÆWﬂzÂnq+˜XÃt9≠´Ê;-@Mêw~!ùÿôdˆÙD¿ãÉããhRs¨ aôeWC˝FƒñHËïú©îüπú6õ¸ Ú≥»·âî¥:UBÈ∂»¸¡ŒÒˆ¶¨≈Í±(¡üÿ’∏5≠2©\,Å\’ª
,∂iπY—∫ÜW 3¬—«ï%ó≥ Öô^≤{ñDsäí"K“Å∫¥RÏÇåır	◊YEÌ¨$π˙ ≤¥Tu&èÑ,Î'3Ë‘Zè¯€Ÿ@Uå-{guìSeB±~yq¬ŸÖ^õ–,5£))ÂM%ˆÙ≤l∞Ó^ﬂ9îÃo¸kjodqÇ∞¡¯∫Zk≠@=`è^|◊ïΩΩ–9YÊ—FÅ'ﬁƒFbÌBZ]Nx>'∂x;¬M>˘ü?œAyëÀèõ30≤¶-Nõ´8@3""ÿ6AÌxºõ}‰0Yõ∫óußXı¶a´∆¥ØÍ–∫¸@)˚⁄“ﬁ)UÍfg¡_8Î+<µûŒ]dŒ‡≥à=øcÚÎS≥∏ÛÁ:E\Ô)Fû§ºŸ)Ûõ9@◊J\‹÷Â≠˜1ßËıg∑2ÉËÓW¨ì}‚πIw+V•™˛∞< w∞@QuËh¡Î£Ä#zg[O¯6üˇu«÷ÀÀb‹I<æU≠”ÖÆ˚√G÷.óÒEL˜ıÇIm∂æzä%â.,6E!8
Ü<Y_ªXhª›•äûí~÷∏à+4∂\Bxï¡døTux≠Ó˘añ›-Œ}«ÂΩG~Üπ4iƒ∏˜≠∂5Óµ˝˚s◊O}˙Ï∏¥Ô+/Câ\ñµbÛS8]{‘»∞,”Úè5ó\Ï_º–k◊R:⁄÷√õ+î«≠Œ Q"ÏIM"®ùïc§&ãDcëG[yLm‰”^≠rî€˜gûå‹ÊÆ5ÁÁ'@˙Âx¸Ø Y«S„ª¡–2P∞æŒ8xlb	üyZzHÂ,KG^ <¨Ø#-hN
!S,^*ÕpiÖ√õæ GW‘b) uìhÏw:î±∫J˛ëW<óº4y~„©*Ω
›™Äc9uÕr∆⁄õˇ∞*Ó-∆/8ŸÜ√)y«p∫≤gËFgÿ‘Í®ÕıÕa6äT`unkmÀ|Eåƒ;ùJîZÂÄÊÛ<Û«3j´π–NŒØ«˝„l»'Áqõ◊∫„NEÍYzAöu¢cU€◊kŸ˛ówÓTz˜MñÏáµ*ΩëeÎÿQX‘<âZ‘≈J†[+›4˙ˆ>~ß•„\˛OòkœmÀ∂}©[êsf≤œ^6˜V˝∫-;>ˇú}¢ÈÖ˘j;òKï›‰éO-YVh—èöπÔï7Xπ…ÛÓ`”+å^j”Ï><x˝¯€ˇÕˆÂ¡ÃAy◊uõ·i9céª‘X∞ì∫´/©(gN±^⁄ùãÃXà\„üIÚ‹C’z˘é˝¯Wˇçıá≤< ‹ÍOêÙ!'†å√≠Ø˚œ◊>£√≤õL√ Ì,Ø-Øtß—vˇÎ;ÁWpñ∂ñãˆã˙UaóÔêC˛Ò`NiÆ*KbÉöÕ„ºº+"Ä_ñ ÀDƒ/£êf`N¥[’Âó≤≤∫%æSwôWm],DŒG®ÊG4x –JKÍÜ¬ã	ô*gõ
≤Tçµ–5π1}æKQVn'˘’˚kéeÊ’Ûƒ1ò∑k—ùz[f]ﬁ≠ºG…Î˛ wA‘R}Y»Ê?·åø¸kÜ6òÉ^øn5m£Õ&,£\iégÁ√⁄e0óˇJ%€G0°äﬁbXZ¨cL®ïc‡˛˛≠FΩ›ñ+k•ÔjYÅÏF®eΩ9 †À}7¡>e6Ï˚ÌVVÃ\ö¬ÿedÌÂfècz‚ŸdÄÖäÑ}<‹m7êã"/VÂ¿.Hs–ùÚAÍÖ¡ ÔëW„@Aä°çVX)x˙ÑW°—ÀG≈‹áﬁ]˛òèÕÀ„ìõLÚ4öûƒ—‘„Â†@∑ÛW¥1g]Pû˙Âé¯‘ØπÚ∆ıÀHÂ¡¸òVÍõ{RÄº
˘±ö˘ﬁ¢A‘}vUf7äa±∆≈j˝p›1fÕ√n5ıÌ˛J¡`€®∫4Õ¶’‘b¡ëâï¯IJôòJû4”)AùYn˜Ã]z¶Nüë”îò`¸2rç˙beWuµÇ™´ÖÃ6ÕÂoq=`°#å&-+&©àµêÿ∂‰‹Ôj†€•ÓYUäÅ2ã⁄y∑Ü˜}˘«¸_Ùb?˛„ˇ]nÂ!lÎFqº›)¢^PÊ˘√@0hfpfçEö”⁄@‰·!å¿8_ˇπƒJÙutÉñÄîıøæ©∂rZœô…
∞ºJÉÂm5T1≠FåıS¬Fsmª˜s¡û◊∑¥¯PÓ£^ìªæ}Ø«o‘√ëÔßÏ¡Îã#mÊ„ıQØ•OﬂN≥Ê≈6¸q¿a¬ _f8ôÚ(·ÅW^&QíπÒZ*‚-œ≈ Ä>G‡úôÖÊTÊÁ◊›yú*öÚèóè∞º≤∫7QW]é±Ì¸U	uoﬁ»Ã6ã£‚…•n„º≥¯Aocâ£—€:˛≤Á—a;íÅ<≥On≈§∫´∑Ÿ∂È◊ xÒ[[/Ÿµ;&ª⁄[4Ÿï-zWÚöäï˘≈ÁÌ$c¥w¡l]„ >¯9[ùg}¥¥‚≤ÎÏ9≠oÛºZ=Ay9*Szf:ö•‰PDÌ9gÌπ{‰’^æÄÑâ¶=Ârb)ÌK{ŸøØÛª¯†<£)h7K{ŸøÔ·A2≤¥¥'ˇ5ˇC@¨ì\n€B¿àºZmÇ;Òúñ—±{QIDNÿb•j¬ÇöZ‚DãíB¢ßXVT“p)ëQ~µ˙-°n<≈Ù;LSÃA"⁄uF‘ç–_;WŒ£Ï©Üè∆ày°†Sä~ª.eYõ≈~ïAJ:∆c=¢[*âSÔîâÕ…Dıíwã~›õõ∑¿∑LïvN6g ¡#÷PI]Îï#OB"Áx∂ë©9Øn\iº>‚±'Õv÷¨’Ã∫Êa˛ß	 π“û-º˘’˜ˆræÙ˝‘\Ì0√’ú≥‘ı¥◊≤ÚÎ∂vCíÁÔü˛ıˇ˝üﬂqj‰‰nüC–'nú=ú⁄pÃ;U+ªlÍOÜYúIìs≠€`2ùÕc‘…0‘Ñ8Í⁄+éxçÉ…ì•ç9€ﬁ=Y¬L®πZ¶jÓ∞üœ$π£’‡i;ûççáÉàW£&ä’¨6¸[ê	ö∂%)lÿÛ1’wfq6Ùb¨Ëå@l˛˛ò¥∞≥†ïmL‰‹ÕŒ∑bÁ6£ÔŸêû”î6åÈk‘m™,Í¸Vf[”	^í@h>Y‰@=Qº¨≤às§K{Î 3>®∫Òs∞I›££Óâ-¢
î'≈ã2ÌÛJ‚ÇdülêëàTà?Dº⁄EºDN∞LÖ8bﬂ¯Ñ“EÒΩΩTâÒΩìΩtC–(DΩkåˆ~§ë+LDkøV‡Q8
^Ï{-ˆµ8îÚ|∂ho°‹¢T•y§'Í¸˜-Ü{QZ)”÷*íg˚Òì•Ûë/“ãıäÚ™>!ó•@⁄/s˛SN–äÇl¿7É–áyj£*äôª»	r[.ºB»mÊ$	"ìœˇe4ò%ªò}HF•˙†Èhó≠ç÷^>BÅÈ˛-4ò“#¢ºÏ©Ny¿Ez+{∏-Ø˘pòx-ãâóf¯…†öP†µr˜{≠Çàq‰ì+∞≠>ª≠…Qó)8ËÖÔºØæÂYÈØ?ªﬂ± ÅøΩ{Ω“˝≥L÷ÂU∂ºr˜∫u˜vŸkiÔïÙ…0‹DD≤¸@u
ø∏É_'É;‘Üs=kk≥Ã5°”ÿêÖMºèzòuûO	j€gt˘_q«û√.√⁄:-c‹—oº»ﬁˆ•#Á∏yÂ˚Fºﬁú‰yËèq‰Ø	Ûﬂ˘cêÌ ¥XdjíÚ¸áUÊ•»ÿCTƒ3–˝$ÚÊﬁ é‰|YrÜﬁJˆ‘ëq“eŸÒ¿œÑ!“Sº‡´ÄÆq!ß 'êûx˜E0±M„sQ˙W¢Úﬁ‘ª¬ ˘»s–mΩ⁄Ó≤F~»›◊êKÿ˜CÊ±Qp5
o°=ÖMË]Ñæ`Jb◊A:bﬁpƒÙ-Õ…4ùyXa¶¶À˙√!·ë·[o ªvg)M“€ °πõz1úØ8;î`íx√åìÎ7Ò”Ÿ4YÖ«¡¡ôxó>‹7ç£)lö©‘qñ@ùéË$O£)õÚJ(∫ÓeﬁÁ‡#?1P·'4‰´äk˚Ï¢EOG†.\ç`äa„±–Rÿ˜£Ä&âo>WŒm+á?ä€ICêú—BDﬁ”`ÄÃB>√Úà±E{wﬁ §ÖçÙÍ˛;t˙r˛±æó1ıﬂçÇÑÿb’ïÄFmØCÓ∏Z3êIêﬁ¨¬H‚òÇ`é¥q¬◊Ö¡ ]ÉÌçj,Lü^Gì+XëﬁÓÙá∆Çè}ÒÎ<_¿Dë{Zß#?à	HX˝LÌÃU¢_«E-&c®∂«C›.<πH«|·ú≈cÃ|€1i;ò˜ÊÂ’ñ®Z¬Q—Ä—k]©)¡KÏ∆~ÀG∑t«ñ≈{Ö2õÖÏUÌy∏o1«<ãæ◊‰o’D €∞UeÇ¸’Œói]π‡ÅÓjÎ1Ê·pQˆƒkµı;ï:(¸¯„0»∏)&6îÿüÃõ•—ˆ“¿√Ñd˜)úi7¥ç¶ËûÉì¢ª‰Ï%ÊWs]êªwæïîQ+~e>Ã´›";É±µIÁZPÓøl√–⁄eo?∞^Pã'ˆnº©±o}jº•¶≥w+HñU˘gåå|€Ü}Éê&–…˙†8âäƒ•{÷Ê–OÇ+‘ü9¡Ú˜®m’Kn?ÒJ™°4%LÂ=\*¡„›JãznÆ«‹‹*∫3—"öüﬁuJ¸≈⁄e^]~◊k/ˆ¨<jèS‘Ë-(R”∏
¿\Jc\Õ,+˙~·:,™ø&Í6ª^€Ÿë§⁄◊ΩØß£ñÕ‘Dº’g‰≠9á≥i1ÌBó∑!—≥$q]Xwµƒ(I/æòñeQ50ïb∞ô$k ÇF£∑µ¥áD[ìÄú>Xﬁ´O|\â›#‡Æ∏ô⁄j©?N/"–¥ÓVR6◊Q0⁄gwqRa?ëGT[>t/‡†å–€©˛Mt≠Ñ˜áOÈ+Óÿ:ùZß¯Eò≤d˚= ¬_´®3–=ôº˛8–ìôt≈⁄@Çiv–ÒΩ+Q—‚+≤Y@Ê⁄=/©
©O‰ﬂm`Vß'1¢>á„aR,v πßlö≤~è‰&M ´OïùEN%VÀ¨⁄öÙ≤°Ä”R8Íﬂ¯7f‰@saqJÀä`n˛ ’(ÙÖﬂ¢Vzïö{Îôı,æyN´i≥ù´36{ìï|é«%ÖΩ]í~sâªE[»ôú9£fû‹®¶î7ˇ≤DvÏ∞|≈\Á©‚*)û9kÚÇàù´	Í\ülß±[Õmñ“ÒÃª¿MÕñ¸Áﬂ"~öSERöu(’d≈*Óìµ(kY-∑(Úeı(ã[P`Â6nÅL√v◊>9T¿-å⁄_3µÕãÜmZrq¿\Jíe0 Èdıp-TQ±Ì⁄éàŒ€)¿ÒÌVSŸ–40·£efÑëw„:<Ê:öc©¿¿ú`Ë €J€±H}/TkÑ>hAü∑J∆¡ıÕÀîây∂
	í)Ïh≤vGWpp$≠¡¥"Û≤E´ŸnÏèfUîa_î2‚)Ç.Ä^ƒæ™Bà™co©É‘Ëkn+ÑYòŒcUÈ√ΩpÜe»AS•œ¿`zíÔh<ò'‹È$≥Ò*" 9o?‹˙~ZÖ!¥{êJù oLG=t=K®ÿ\-tÄOó].≈ùÉ⁄'´c·†ó,≥éÉ%b⁄¬Ju”y€l<›Õ:tóï±ËÇSÆ"zå(1qê/%ë/g–[ﬂ∂ßﬁ{úÛæÑRW”óËP∫Hö˘‘¬«U˘ ›YQFˆ^SQ)PohÆ∞@‚Pÿ´‚È=>SñÓXLeì≈u¡•"H’öu‚©rc–$“˜ÁJmwçπ&≤◊0ÉLGz™ä¯ˆQi¥=À∂Q©ØP®œ)‡·8fˆè∞Û3ƒ‹ñWy	≤ü›j˙ãSÌZÃ}Õ)áö7é%a?ƒ8:G{€∆xã}JãŸﬂÚ˜:Óí√q5{Õ]·n\e$~v’ŸiS˚6ª ≤'Úxá≥™‚Á‚ß*bãìûj‘ø5—ê'#o]Ø%„<®'øüö@?˝«´›ã‰9#<Á∞⁄›ÇƒˆÎ›&>ÄóÖ"÷ºV‡aBh
óRÃÆÓ¶Üàje?ÍÉ®≤ü∆p<û—§&DÍVkyÀ‰x‹i‰x¥ÕE⁄¢d§û∂¬Ì“íjUÑz∆oÆ÷ydí ¸l0ä¢P∆◊®’ÕR∫&qN!;Ìy®ÀﬂkK	á∫]‘>VÌmß4$°Íü®2’º¡`ïàu8ÿf0 [Õ∞8o ∂"ZqÂVò’s•Ö÷M£Ø1⁄›ŸXπ˚U√Fk>BÎK°h*Ù·üœÇ∑x|¿íxj1ııª∏Èœ?À-Ú-¸	°Øß?ñUå?‘—®à,ˆà√&A˜¥±}ñøß"SÛÔˆÿÊ∆∆áŸ&´Î“ûîçü_•ÑØ˘´?lì≤m“l2§ì∑	$ÏY0yÛÒnÚI”>9#¸˚BEÎ∑¡’àÖ—&BLˇé(0Vûƒ±¸aW–IËMˆÃO–‰æE©˚ÒÆmıÃöçìÇ≤°Î≥∏ÀWLÔ1|ßyè·Sóí1P˚¿ˇ›±o„zªd°k[§£iÔtøÀŸ¬¿bº˝âﬁ§òÙCä˝vÄ°¯o≥¶rÅï¿Æq»›©7¡Âû∞œaqcÕ`G®ÉsŒøÖwE°W√ÜÆ¨£Ë\˜Ü¨ππ—£¡l¢_∞©§ˆx¥]‰ìW:œY√éG≤⁄aÁ9`∂0GdıüD‹È¿ŒQVësy¥›ÿ´ííùÖÃw⁄D_ì.ƒkäS0äˇê˚rx!Ö$ä1`=ºôxòpà'jÃ˚»¬ ¡ZMı8mpŒˆê5ﬁè¶QòÛt–Â¯–p≈q◊Œ(¯¡õ1Çïc‚_ÔÉ(£'5;Œ2ÍA∫ë¯È±÷Bûœ¨πE+"ÂÕR"e"Y–
È‰äs∫q)[‡RMa>7€rí∂Ì9ÑKÍ…Üzs6¥π![⁄‹ò∑©M’‘¶mSvD»ç{≥ôß∫??._* ïê·˚¬„[…ãúô3⁄,‹£y˜m$M¯‡â–^hL@˛}açÚìKT{^X´x“ú‰Û90˜ÖfEêüˆ”¬’¨Œx±]ôÁœ!ë5püÀXπU–oÉ‹ó~ã·Àπr2º~ò⁄Dc3†é(I@ ßÒëó«›o¡ æ⁄e_n`dó≤Ì™X˘2ªÀ„Hî+À˘„eªí}ÃvéæÁV˙…vvÜ´˙#¨rª≠‚ﬂ]T+¡˙\e§ø\t·Y‰√[cû¸∑ı‘uPW\e¡5Êà•¡w≈kÁ`5∑ØÛ∏öçb
4˚ÏûÃi¢F_V›kkÉxñóB€˘0ÚçÑ„‘Aw¡äË›ùÅQì9û„~œÆ5ÔI›˛ÈáˇÒ[ï≠£ü|∫È˛€6p9∞õﬁ‰|¡¸HÄÅ¯ˆÈ÷<Ω€ZHÔ2ú±Ÿªˇƒ>›~ÔP†<*ÈSZ„_∞Mg¶¯˜Ç∞Q[ZUm+†Ï©47‡Œî!õÒ0éaÂg˘ZÂπÏπâ.ΩßU(M˘Ô]‰Æ°_àÂÓW÷ÖEÁ|Ò{BMix»‹iêô$Nµi’ËÑ¸JïFñ≈9VïuQƒﬁ»øP•Ÿ›y;Tv‡Ã`ıt˙P|4}ΩòÁÓÀÁ™2%ö®+>Ye^,ã:πº6oæØ˘#Uê◊∫≥Æ∞∏‹´}å–8«bÌ‹îˆSJöì¢QÉ.≠®æ“ìÇ3”êÔ,¢≤Mæ}}MØ12Pj‰˘,ˇ<NXÿ¨¥Kn}¥ë[ﬁ˘ÖªÅz™eéa«˚[0Öqzå<êüŒJéèOò&æÍ
)Ú®Zä‰*“)z&µ¸äÎ˛zÌ2H]Í>Ú˜ÏÒ Ôy€¢eáˇ?é©f]&]£ÔµÎßÏ4Hﬁ∞éÊ9√fLÔΩuQMSunaØ˙îkú,öTvö†£	˚&äÜËÙ!JÃ˚…≈´C÷∏PãgﬂV†v*\=FnòmëÓ«v›")
œ`Äü‹>º+¨'YÏñG!M¬ròè#TB∂HAeÇdûƒLôpú$/K◊vZ¨&–n˙>¿nS|Bî7ß¸¸É¿ªöD	ÁÔ;ÊmßÉ4áòÁ0Àw?Ò„K¸
Â3G*[DíÌ„»Géßäá'gD£),„´0∫@í∏Üò±{–I|√Fª}πåò@üËÍ‰Ø>>
˛Ûpr…à=Û&W3Ë6˝9`Z2ÜMü~4à¬ËÍˇπ!π}8›$ÿÊ+YZì∆›¬•åt“¨(Lâ;"?‰é‡Ä∑€–§Hk·êßòjÑ4ç[€Ö)Ω’/Eè^—-∏1.ën∑˘Ùœ|ÓÖ¶=‡¸˝ƒXâ–Ïe5fíÊ˚WzJ´ﬁà}¢È–¿OÙY¿ÆãOn~˘]6}æ1?”ïı∑ƒÛ~ßíï≠±N05 ^‚D‹ïm±M¶
À≠ÆtÅÂIYn≠ïy”nld’#ùºÅ5aMr™&qŒn≥˘s1≠Ì™¸ Á´b†¶
*ΩiG™˝(ÇP ª¬v‡Òyñ åG·OŒô≥÷z™∂‰]jÚ∂lÌa/µQfqf'[∂}gÌ_L“õÊñ]√tDûJ}©º∂e∂2÷-óì’m“˘nE ÔP^æ£sÅ§V›˚4˘®…iFf@F&≤¨«~(âú«c¨hP_À´DªÀ£ùÚÈÑXW∆¨·üÇ(Wïñπ†é’´[•Ú¶$‘ß 1d\≤Ò≈⁄¶A‡8€œ∆∆
y[°Sππ‘O˜~˙·˛óˇÍÔ~˙·?ˇﬁâPÌâŒªË«	ÎP√óøZÅûÒ;@çéÆÄTÅ8„Ét&+d©a»V⁄4V2GÉèæÏÓH—€àV§7%seÁøF xDÕÙ/T°˚a˙GèzzÔÂBD¬Ø@¬:∞∑†≥Ö¡täxI∞&à¬üïT”+H˜Ò“ﬁÉá›MÎ∞Öt5¸π‚ÔÕ(Ëﬂ¯^ºÜs∏ÜˇbíÃF√∞:Ä¢[ò^πë’‚ºÜíá#~∏ﬁyˇ¶]n†;øY{±ˆõ&^ﬂ¿{¿:0b18®EÒÕ‚Ã?·Cìå≈f–;aÁNÂ≥¡~¡√∆˙ÔÑQÉ˚Ùm0ƒ⁄ ÔÅÔîU8œ¬4X√íMP„Êïœ!Jµ/-‡∏º0ÇÀØêc”¢L^ï€§ﬂp;Ê5ò0úeSc.ãDHß*Ã°zõÃ$4®ÒƒüÍØ$æo8 Î_˜æ √=Ñí]Æ%Æ©z∏¡ÚœçÆ≤>%‚ñ>ÑˇQÖ·√û™}“πÜÍ›ä·6Ë4M‹FÔï±bç	%„a1°ƒ≈ˆ™_˝B‰ú	=Ï˚`kµ±¥™ÖBf(_;J÷o7ÊQŸeq∏Â
dV`
X˙¸˜yπt&+[ŸZÂù	Ø
äL!‰ä†<!RP∂R0zç’#1$V…VeP‹œ≤qp4ù˛ez9ØÓ®âW∆áí≥|îKËÿ®K9<VƒıOæ»Z.ÀÚ”ñﬂ8•»Ôï÷+≥1∑8*ê4
∞*∞4`’lAÀ√∂DŸXÔK„u¡´«G∞òuƒ°ÙSëıu/k)„S_–R˙ÙEÕ&Ïf,‰Vrï¨óï.Êí›’À_Í◊zKe1ü"0
ÁÈÒ∏9∏∫x€…[…jö_Ÿ†S•àºk*$nêµ=ñ‰Q›3≠ ep§ ‡∞Lú+à&i	Ëñ‰Áü≥∆õÙ0Ä™£…"◊h-™3Äåï[òmPÜÛ´d‡ƒ∑‹ö?˝ªøAwPΩEƒ9Ë#6ïÜlg áaÁŸ™+8ﬂ<¨ôªªlT[ç›ﬂˇB00?Ì©H·_‰ÿ-Æ>P£b˛õË7Ï<sÇsz#W≠åá,â;”¿]<É£ù≤º˛J'gÂRêÑ8‰N¿™cÜìi√âÜ!⁄«Î£ù¶NµπEæ9Õ@…«V™¶∂òTPl≤¢>îHlníÚo–«≥ ¶Gn	8*ﬁà?4ÇçSy~5W9G7∏V~ÀkSÂﬁ∞0+µV¶V.˚ºmÜ#÷EØ÷ùÖK∫ÍiçV™8çëv>Ù1ç_π’—&V9ÁHŸ¥ÓáÍ”º€Ñﬁ®kïªÃ˘‡Z7‚f¯ó™ÌYÆÔ9VÓ€2Î4v§9„K|À’‰πÖò≈s›*ÓµÃUò'CÅﬁç3Ωr§œ8¬¬π ∞™ÄP¨QR"BÜx+j¶>Í›#@_{•˚Á[œ´ı≠+Um5¬‹ˆE∑ûn{Á∂û°,XÁ„uâ∏)
J¸Q<aïóV˘∆“ı…MBâóñ¶ÙC<≤°ózÙªµãäGÿ‡.-«÷
[1«#2ÀI›∂,8˜˘X{6ä˛|ŸÀ[6“o*|j$W;<’ukcÎ¡äı9’pVf˘gÊ≤z1πä–X“ÅåTﬁÚ¡≠°;ŒGXÛ·ï!Z,úó-ŒÆ∆S´‡¬¸r£'œ-Glº£«íìÔ√mÈ"ââªYà=ÿƒ‹ æK∂TÜzP!µqÅΩôD◊°?ºÚeòW†€c¨íÅ±0ÚÜl Ì7ÿW<§4ÜπìnÌl≈›\9Âµs—ò^õÁ™Ë‚ŸwOŸyˇ)€⁄e'ß/æ9=<;cßá'/NœŸ~ˇÙ‡å}Œééé~}t]ˇÎüù¡œèœœÿ≥ﬂT¥9W?+¸∑Ú =õ]ú{|˚Òıß/&À’Y≠ÔT“%<dH•¥®A§»ÈEc£òùF◊ÏƒõÄ¯hÅDAÿâC©ä.<ÿ(M5$l’∫ü≤€’£OLlIﬁÇ0*´Íÿíd2ªÇÌ™ù|'0µ∞Cëm∏/“-rà˜dÏ≈os4 ìDπp@‡GÍO≠hUcªè}∑6Z{πÛàéNÂ¬π·’ßìA˙‡ÖØ•£ö%àW%Ã†^)∂+¯êAnÃUuh∂∂
¯—>Ëû—∏|fIgŸ¶#ñò„8äü'WÜ6˝®	k&œÊ¯√8\≥XA\ãöïö√&π∆lMD•vÒ_5É©5+U´‚¶}Co¬•ì9„°¸WfﬁÆ˜4¶Tå¨úÉbhÓQ/´–¡û/E8¯◊€ÕHÍ&µ‡£Ω’Rb±òIÔíO"Ñ¨Ï„∑Øuç˝≥‘ô∂Nñu5zK`‘MçÀñeH!ô,4”fº¨ïÚZ5ÒYîß◊:˘êÍá” ¸˜êÙeN~€m±é-¸˙UÏaÀcç*¨h√$évã˛€¢RL]ŒÓúÏ…¬ïÊ	ÒÃg≤o‘5ÉsX©_Ì¯ìÁ·Ÿ<πˆÈ‘…HôÅÎ,3tu·g—’U-¬∫ºõöv˚`Ì÷
ç∑8ˆñ°€DÏ–Ä%~ç≤sÊAL'l/W°™ß;Ôı(fíÍÒÕ)îÅbu©L0rªÊ‚/—2r3u>”Ê».∑6|YtôeH§ú—1N1oÂx6ˆπsˆå◊KG“Èå(Q¨h⁄k{wKÖﬂ,o≠„hÔÜ.ÇU∞ñxo1?õ2ºA˜≈f7 cväôºul¥>7‹eÂ¸≤LÒ,Ov‹*%&^EŸ>`JS¬Ãòw÷E}-ÑC/Ü¡›«€Rb®dÇ°?Ö±SqˇÑ¡à¶∏¿—ÇTKßÀ»
¬©GC&dT˙©?~bì-hÈÒm·Î-ì´õÌÄ÷>Û∫}A)±]∂∆£ìÅÁ≤›˜}êéêB¿töÆ¨®ˇKk^©
æ¸µær˛Î·h¶˝◊c˙;Z ËSvr›´Åª)$˜ü”8^√‚ÿ„MßhˆmÁÂ2hqÑ©ÎCd%8‡{6!~zÓq>ëÂW†Zaé|ˇÚüMaµü@ÒŒµ*Ò‚Æ«(ø⁄ñ∫ƒÀŸ1íøx∆NÏøsv‹[`¨€Ì€iµEôî€m’ÍÖ√éo”G∆P@º⁄Í[¥‡∫4òC±y|_bv-yòç¶@%ê dÆ*¥nÃ2˚;ªÚò#µ™Ä≈»°Ms.≠2äc˜≠¢Œnvs˘Úïs;˚°$X3ˆ£W˙–¢ínlë‚“ª¢âVÉUOuEÚΩ©é/∂Ú~8ÖbZèzΩúôÅ»ïï]_.Û“ıä~=Õ©ß{ øÏI¯Ârƒ·’Í‡p-ÑãóEY÷æ¢ıÕv}X(¡ÉÜß“îh•éZòΩËüÁ\ÔOGæG<À^%‹‹î\ó¡ì∆ÅG.® ≠ºÿßxî‡_ÛΩ–⁄fha4’&˝µKπ∂JaµÜœÈä¥{‰Ã‘GØú‘%Æ$%t‰ù‚Ã;f>3˙À˘© µ>yªA"'Í	=„+›¯üñmõ¥&Gíóˇ^äOÈŒÂW∆a^ø≤»Ô1#[égx6Œé‚9OÕÉˆ[>ùæ}®\à€Ôíe◊áÏ—)ÙGö∂¥|”ÌƒrBı÷DÛß1&«∆≥…¿≥ ®k∑ÆÉªIO∞JŸy®a3Â´‰–||Ò∑)›Ä4æjZíy6ºWÜ)]8ÛRñUÄ√T!=´oúÀUû€¬¸8œ^b,‹á°’‡;Ë>¸!N@rºÊõ^ÁÑ[-Uâ?vÄ∏_ë*‰>BN„„<:-)œÌÀ#ÊL¶3ãjÖÊ≈]1ì⁄5ÆÆI≤ÅÍÖ´≠;&Oñ6\ü8ˆﬁ=Y¬zqÓN#7Zó‚≈5ó©'>Ÿ√¢2y0È@V≥:Âo∫ÈhíÊK8"Õ∆Jßƒ«‚≤‚ÎÖ∏´j’◊ñÆ*<¶^Ì™9˙≈{´úL—‰i8ãÁuùÇ‡Öäî÷rJèΩ6^Û-Ï2ÿ;ˇõ…‹Í{Õ≠ª‹¸hw«G·Ä]∫^€‹aı¸#•§ÜtﬁZ …Â<ô‡®Kƒ[Ób¯~£}– M—,%’ì¥pßWq(ˇÅós4›‘∑óˆ÷·lSûÕ-q—ÂvÀ≈r˜˛]s∞K>Ä3Èõ∆>ÿ@Aíb¬SˇH¢≠Ø¸	X4ïÁöÛœ
NTÁ±Åô49≥◊tJ⁄–d£Í£"«©j’ €pX ‹¨Ö¬Õ”K	#‰éù˜4ß7!úÍÜ‹¶ä2¯ˇóAV%€bûQjf…í÷òÑ∆It≠jÿ˚†Sû˜!¯yl‡1Nå¿xM8ó¶|7$:û˙É‡ÃW	ñƒ0◊1ò—`4\uŸ¡ÒÒŒãY 3bë	nÒ‰ÃB≤¥ ñ'ÉhFå∫0Í£Ñ"Kòy±§gk)ºM èı'	Úw“K˙…“
"k`Ò'H–¸ÖØí4ö‹‰6.Ú«8n^Ï[xß!,Ìeë=Yz1Ñ¡W3ÿÖx Í	>
8—E6åΩKz†aÒA√˙„È»KE‡ïΩ)¶„Ë≠O˜√Î_¬KÚ’Ë¡8‘Œïrqú«Yë	ñŒPêÚm∏º“|√x†ßV4ü3#µêùë≥'õõ¨aïÔï9§¨(à„ë€@WGl‘XÎòëÛ „÷Mc∂ﬁüÛT âù´©,€Z/ËUU¡À¸fæQm∞4—ÃN•dﬁ≤ì≥ï≈ª0∑lG˘$•õ÷!Ô∂r’û;†<√õé=q»·yÁ¡@•˛pæ‘m:Ø¯k-Ìi3jÀ†≤`EÃB7±xò5z ˆ§†N Ü°ˇüøp˜¡>Ñ6
Ï0Hê2j¯‰VŒË‰ πëR,u.y©<›Ã#2é∂Ã(◊ãiN5q±ú*¥•ﬁL´Xøì%.]È8nu´Ä L¢Éj†zk–3pGÛ\YeÏTΩuΩ¬«mÈz§^ñL·4 wÄ^«ÆQ.
~Ü«óy4¬moQrÖNh:<è”©VΩ*À	Å≥€â´¿™ˆ•ÌG¥\56ÂµÛ †É*ç^⁄ÎPô˜026ŸbvKÃ{ñ$W;ÏB–ˆnÿ:Ûá™UMñi9ªßï.ê„R©L©§≠n_9©ôŒ≥»®ßÒ¨Ä(u o—ñY∂Æ–A˜î5õßj äåEq∫™S†*kÜÁéó!ı—ôî√ÊN{#Ø≤⁄ÊÇ≥Û)∂8qØ˜l:ÙRGØw{_∑Ò~ªπñ≠X{z—ÒÆ∂;ªÒ/5|¯ôViıhY`èLÀ'Á/ BµπÏò∂&“ÊñççÑW≥ùÑWm…6 or2X\3⁄¿˚[√˙K„Ì"O⁄eù%MRJw=eÿ]≤nÃ:ÙP©T5X;E{ámùΩ⁄ì∏•πlãÄq˚∫ŸeØPaÍ]Öü±µBÖ",H•™Å,|I∏©Rˆ(„è00Ì—7ﬂÆ}}tp¯ÏË¸7ÏmêÃ4v]∆E/€«»Aãê@¶à¨ÁÎjó(M€§5=¿™%”µG%·Å¶îjól„|≤X^µB›Œ˝e◊TÇ Â—j \E¬ÍwèøBˇÓ/≥8r˙ïqˇö≥Î´$Û≤)∑K¡mˆ› dæ∏º® ÆYÒçd  ¶X!	∫ój!«nØR58¨  ﬂ¡'ÙÃ¶æ7!:÷˜áòêk«§˙nπ%˘&∑—
sG”5|t›ùÇåJ;V·C«Iy≠•)Ø›b}€,rëÀ¿\Ï∆ ÂW‘j3Ò=π«O?¸„øcÕΩæSTbµ¯Ãœ}8”1“Ç∞VÏ˚:F‰z≥’ŸPå$&äqc}s#WﬂÓA&ÎÚπÛ¬˚ï)ì»`uMøø#÷*˘‘x	†•‚©ÔH©i~ı‚ÀÎ<Å™™§ù\åÕID1&Ωçh†"&Kµ÷HÛâÉÀL˘)»x=.o8ß∆ƒ¢Ël0ä¢–.V[! ÛÑ“Y™|M%©$“—«öóJ:ürÍD∂%/Ôw@9,˙wÌ‰\qéFúaÓJ[ê÷”é\NlL“ƒ6ÄPyRGa&ÒEUe-ùCœ¿.?ØÏæ’N8S—Vˇ'ÿpﬁòm≠vE°\ñQümGÍZí,⁄©¢2+"n®xËb√=ˆòÎz\Ñ>yr\±E7Ø’^≠»—/ñÃîàåä∫hºêÎ‚Ùˆèf\èÿ:Î<_Ïÿf¬´|X˝	í&¢Íu!v˘5Ù`	ú◊ésDg›`ÿM¶aêvñ◊ñW∫”h
ö—Î_‰îêìQq™≈ŒF˘pí∑_‚@û	uπP◊pá›hÍ ®Òò|4Åöê}ÅEæ‘_∫è·∂=•‹JÄÚú“f3/õ%ëœ¸ÀtW9ÅÔ˜—”áÛÈT}$≤ã…\˘öVhu:›é¶+“iªµ‡í¥›X§.óIVV¬J)ÛU¶;6µ˜Xñ—Ë˘ﬁO?¸Ó_2ËÁôòÆ€¢Q}Í'≥0uLxïRS}bPS9fw’Iå ≤(îpiØˇˆjóôåâòi¿ﬂòÉÈKi‡qﬂﬁ≠¨¥+•bùÊ÷pÀ∏}5]î¶-:¨°1êeW.9›l>„∑s¢3Ni)Èé\E’îS_“\PÉxÁœ¶-#ìR˘|≠®6ÙRÚπÖ£Æ∆Ü&øÇLôy.ßôˆ\◊tGã“2ÍVkÑøj◊ô±Ôù^±{Ñ∞ OÇAÇºÓã(A^Ç›‡zº#˛W–Æl	¸r®
6	Á|_µy9ùBn˜6Ô›9◊ı˚÷`$Y`⁄{ã}õã-Ä˘u{Lπºö¶ï;∞Ò¿ËòGÈ-åÈtóô∑Æ¿∫JaêΩl+”*„‹EÃÿüÊÆï∂¨ÓEuZ1“£Ûbﬁ¿G◊∞≤/¸‰%Rë&”Úhà8~Ì[ëÜ∏b©f#ë`ŒB7[Q"§*ÏG‚ï=µ—≠≤î+.äaâGΩåb§ÇiƒÄbQòX÷~òõR7  ¯$Ú.hì2¢∑ë∑J*ˇﬁ£iP∆ÙQù<‰ * Ïéø˝Øj)#—&ŸoÓzä66Ñs[«ivï[ªÇ,é{◊˚Ìn∞;¥u¨à\ùçèåÀ™Ω¿A- ∂Ï≠ˆz∂WÉ‘Éœ‚-bº∏Rp©}êrÊQ‰ä˙˚‹˙√˙2W≈ÀU!æ7ïx1JÒ˝´≈J1¶G¿§È≈≠Xƒ‰Â>^“çõ¥„M€∂ï∆X´!˜™,€EË»÷Z≤Nœ¥ =˘i ÌuÂV⁄≤ìæÏDàtodô	˘ñ.ÌSBª≥˛ƒoR^m^K∏8öÇôy]ÿFZ¡ıVWö0T⁄¶¢rFÊWb„MÊ∫kÖ„‰Ä%Ïl6{±«ñµÔæ6†Nîô%eõ&ˆt{5ÃZ>öD'J¥∑Põ˘¥Õo`TSöU#y3 Ñú≈™Ëÿ∏™§ÎCCÆbU« Æx9Vw-≠äTSŸïu¨ÓïíŸÅ“U"ªâæüÈÚ#G;ı&o>‹Ú”√≈Ò”€åîä^ﬂ"ÔÆñë$≠tãz◊l{
<J9Á'å.Ÿ<›H#0F‹+R|‰+ôeΩ>åL%z:ˆi˜≥[Ÿ9Î©◊Ö⁄ªÚAP6Î˙Íï∫ıs˝vNb?Ò°ÈdÂ#ZÖÆÓWm¬É1Ëi)` ∑%ﬁèûXÜÑcôOˇ ÈTòF¶ç®ÂhXÃ1€{¬ætsÑòN√ÛZ4±¶YQïO÷—Ωˆ”ˇoÏ$B@:ñ©œfe?äqÙ–7æÀﬂ¸0D∏,RçÙV¥
YõÜ%a#ﬂ”—∑µŸÿOc‘Pybµ”uX®÷^7Ma¥ÎHé]§z§3BwŒ|~˝¯Oˇäp|m∞âxDlÑ]ˆuÏˇ˘å˚ÇotñÑ¡TÖ$¶O¿⁄Œ˛;Q’¿∞#"Nêõœøæü!∑‹†÷x7[ñ†xÊ.Ò√(÷ìŒ∏Ñ@kπm≈
iüUO±zÄMÊ“"Õƒóünnn>⁄z¯JYâr{fÔœaÏ\k<<Ÿò8‰öWœK≈m…Ó[n˝pCƒäƒﬁ“I|≤XåÛ˛Z™e$@§lKe$≤ÜEx√` —I Aÿ0É+¸µyIb.ò$óI	Aºò?y¿…JÊy©Ø˘PQ⁄2å¡<L¢i*†i¢KŸÖ?ÚﬁËﬁ0hØ‡#70#rŒ ¬≠X5cÇig†¥çŸ‡f˙›◊w6…üÎ´§≤A¢S∆|ƒÎ'¡’ÑEóóÓoõŸÅ¥«∞ºñ)4Ÿ≤Â≠‹Gnz@ï x‰Äâ,M…òΩÆ◊∂∑T¢ëm¢≠H≥•5wî≠π3ò/ù≈
µJ˘„
Ö*∆+vÙ˜nÑÑ¬¨øA0≈T´{[ñ$éÕç57‘–Hì:Xrà	ÒÅ°ú≠ºŸ™œ˝!&∞´
⁄Aå	oq45éêª1ç@r0SäÛÚÿ#ÿ5ÒPKØEF√d[}$≤ö≠nÑ*«¶º9îÂkÛ\]<˚Ó);Ô?e€ªlˇª””£˝Ôû}˜úù<Î√>gﬂø8˝ìg/˙g¨ˇÏŸã˝˛˘—ã„ä∂ÊÍ_≈t+çò≥Ÿ≈πw¡]°x˛ÉY8◊`™ì ¬´›¸Èı _¥À‚»©¯Z¶¿N˙^„ãlö>;ˆØŸæzvzuŸ§5˛¢ﬁî¬ç°í∫ä=:Tøûƒ©¨"∂€Á·{R9M&≥´•=Péc–≤k øØV}Û	˜ú”)π	CÔyb•«ï<tqê—A4≥ƒÏ:T:"ûV◊Q¸&åºa}™iìî|å14M`}É‘≤¢:Úª`–øŸv‡_z≥0Ì‘F˛ÉK÷˘d‚_„ûqAÃ˝qge•ì ®\N`V¢¿E 1»äv(U±ë–ÖÉÍÓ©”=9mc8ÃV@GºÅ^Vô˘nºÛy4…”ŸÂ•´;ÑEuTOì¥æé ~Zs¸ıÿxhgyπ∂ÕÏ™?ŸœΩHÁÂ´⁄üà˘B£\?ô®d”ŸE$#X≈∏ºìõ… I˜˝Xÿ8·MÌLﬁ›ïâÉm…c—êi‘ú_Ù6°ZÇå,≤å∏ˇ`¨É<ÅÌúHπœ?|Ü¡µ«ÎÙ‡ÜŒÅyéÎΩAiƒg˙Úl2´ ¯äèµﬂª“◊ëÁ±°ôÊ™ëb†3Õ4«\(å)'"‚•#µÑÓqnîw˙hMo≠mØ`{Ò€«Î¸óé¯ìM—∆ˆ⁄¥l|lŸ$_;€2âu{Æfz≤ôﬁ\Õln»v67ÊkhS5¥i◊ÿ'¥7jw≥•ë»˝`≥ìT0Ïˇ  ˇˇÏ}Îr‹Hñﬁ´‰pgñ‘6Y‚≠t°%ˆñHJ¢W§∏,jzmEá¨´∞Bj î(õ˚é€aá˘¸<Ûˆ#8œ…2ÅDf¢.’£äôYâºú<óÔ|«%ôt“Â“EÔŒBDP≈à∆%èd˙GÖ◊ô@"Ùvª^gA‚®QïÕÈËw≈€9u¨ñ¸∑≥∂‚˙™‚tZﬁ·'ıú9÷n°+˝¶A»‚«~PE-øQÊ'ÛÊ∑úÔ+C$mÓáù˝@∏,¿(Óƒ$‚/˚∑¬Âæv|∏Gÿóﬁß¶´^˜bŒ∞≤/¬—$I!fƒ• πDuŸE4ò÷:≈åπﬁ0_7˝ UÈRUzHı§7ˆL£Ø-≥√6π…CŒπn∆X€≥+Ï[∫œ&tÌz%∂[ˇà1;^FúY&!+Æ‚#‹ñm3% '	™Œ+±]I—6fmÉ0‹Fr0`ä›≈1ˆ∑´8π¶˜{ÖUªè∏ı<ô¨ì®ˇ≈≤^Ä‘È]wF˜ékCÅ§Æ‘$,Å'z®t¥&ã7¯W&M¸':öxGÑÈπ0≤ﬁòjï±ˇ2K‚)–&( 0uüäï— ‚óiíÖ•ÚOeF@nÏzu«7Hˇó˚oûQzV’≤#¨V¢L“®#BGô¸@∂ÓZT–'!¯ÒÁ!∏‡Ó»€PL≥W.)¬}"G(!˘˛Úü˜ÿ3‹ÇKô∏óèGCÆR' Ÿ™&h∏ëı“¨IvògÅï≥àÃ~¸õÌÌÌüKjè‘$7’Í +˚¸,!Q˚Jÿ	ÔÍ ˛|
’Öºüèº®Q=eÕKEôß∑7˝4Ÿ»©rh¡>;ïΩàÖΩ|< uQ8ìØÁ#ú!Jø™p>∏ ®jπ!âsı$…úâØÏe9ù2xﬁ´∫…∫û•VxiucÁf,††,plfñ~Î“´ˆ™o∏ªnQy÷[ƒ¢z)÷|ìÒrñØ»¨,´˜≈·;˜⁄*⁄ömÅiBèd‘¿,£Ê©|}C´‘Ô"O}Ωô¶>C…PîÁ§'∫#}‚√RõsæXˆ∂Â]©î”=¢v¡ØN*≤º∂˝Ò8_”DÍ#¿nm˚µT®™E?äUèà«Hé{uCbù›dêbœ¶›3‹gÅyÑ±ŸU[-ØÀ±∂áï65M»¨4‹¶» Øõ=ä}w¥tWä}î´Î>’Ï:‹Ô∏ÛÖ–)ñEÆçn˛UΩ™UÆ8d’¨v@⁄äñ{Èx_∑l˘Xi”lÛï<OÑÚ. lQl¯¯YîN˘‰·˜)¿DWÜH˚X<ºH\™A3ë_Ê˙oó÷¬∂^@“¸óë‹ZMC·sô›*÷ïCPJÓ;€K⁄ß‰åÛ9bº{3ÓïAE÷ÈrÕ˙ã« K©˚ª}∫e∂8˘c^ÔaøÑk6#ΩÄˇ…†‰)ÏJõR
†9T´⁄∂õË∞¨4 ƒKq™‡+â∞ö—/Öüt^¯x9ZäÚh]’Jº uk˛ÉÑE4Flã”ó†SW<ê·áêÚë/n&ô(:,∑ˆñQÃÔbæx≥'mW¿€K∫·{√bke‹c}ßå±ÿå÷0¢ÀÎÓƒâÕ¿ilOq1º∏≥¡«ÌVπ«#t„´Ñ*o2Ö5ÑÇòb6°’VÓ¿í¥4^— t£cÎørª“yMë∂)ùÈzâ§Ê¥b˜Pœ∏Iç7PŸÈå]EÈhmÂ√ò#¡H>‰…4!Fè¥S≥‡*åox≤⁄(Q\Äü	ÀnDaˆ„äCX|êÔ0å©ˆ´`˘¯‘˘V.ÙQöñ“‚ª<N†Uú(¥Xb»¸Bˆ5^å(·“UJ†S%£>ÒÒo¬≠≠˛Ó≥üÀzEë^à∏&J%|rŸæ\È≤9.VÉ8DS»»'¶QË!ç›8ÛëU–ÃÛ—≈<Áµ\
+§lq‘P◊l©g˜?l* J}Wœ˝≈Ñ‡¿t»_©I≠ C"%Qø»mƒ_G}…ç∂œ >Î Á1ªÛÆ"‘à•®ìAfõ‘NR©ÖÃ»LdÄéË,öFfùÖëS.Äôø¬Ò–ˆ/1Q™É‹FlÑú®±A˚Æ†ügcÕπU’êU•Ñ‰ÌzÊ	8_¬l®Ò|uµ“Ä¨æC6/ÜŒz√ÍYoE£Ñ1≈ ≥È+[Ù^·f«Iê˜Ü+0æg·⁄%6 ‘>ˆÿ•î´Æç´NrVrûâ1¶~◊pq°t∫añ±‚jÃ‘y®*„o≠4ÏO{·⁄Z–Î≠ìj|ÙGÚÈ±®¸:Ÿ|t«‚UçFlIÚ%ÛƒÑíÅ†Ω?˝≠ˆ.+≥NÚ„P•ª¶v\EÃË®-ïF«§¶)•L¸#Õ8É›ãß`¶G9¡æ#∆¡ta!Ò|ëû÷„,⁄ö’.0¨ˆË >D¢∞ÕA¸¡MXè|Ò;Mi(rôˆ√öΩd}π€^≈w¿)xùx7GÒL›¢-2b´)ˆªmô€Ñ<Í4·…që4'dF∏äS*ùZ‰’4¢+˛Ü.^ûjãVdÿWK&ì1&è≈êI{∆v∆ÁºX∆›~X|Cyπª{‰Ëü:'«ßòxKN:ßù7G'Gß§{ˆË√ª£ÛöÓ-7¸å≤Ö%‚Ó.#óÁ‡Çªí®1¡ÈËk•›Œ‰©˛	∏G0≥Pã⁄¢2ouoÚaHoÇ)⁄k”î™BÅ‰O%}®Âäé®Î3jı€»ªÖADòìCpX|?O>ÓU«VAæp™ÿàÙÎ0Óg˜ïî/±¶æ$&€¬oErÆÚ¢Ú˜C:≠Î,ˇöëπh„'úd£ùM”@Èx§üxº~ss1…ºÚ¸Ryïwr›†dÂ¬E¨ö≤∫∆ÖTÍˇ$‡¬¿ë«‰†s— ;∫º$;9Ì3¶)Àf	v}r|Qˇ8ç˛LŒí4øJ‚(πßªÔsï≈™“ãjy„ºnÌ2RÁ§‰úc=˛‰çœ¡÷õ˘Â`´ªé£¯A˚ éä˘Ú±U•aÓ„‚$†∂4µê<r	æÀ”gäR‰…∞ºF¡˛i∂F°s,P∏˝Î8®dyπkj8C	>¡ª{J˛G√ä¨˝·ëg˙ÅoÍA≥|}©≤Nπ]√ñÂ öhûf∞ÿ%À¶	ë#%%®8Õú]ÚZ◊Œ§‚∆≥*—ö'#0Á–≤,|s-Õ¢ô∑<‘Ç|‡qNbH$x*"ÜÃ¨o*v\Bhµ|9Nè`í∂@∆K8fáâﬂ-AøÀ+h÷:À∆Öã˛Ùô≥≤ƒ@´O„2Í’Ÿ@·;(ºÅC}|®”√VÅñKi6⁄√ü”‰∫Ç7ß”ÄB¨^óøìﬂS¢7
¥K° ÙL˛Àå\D£ ˝nÑysåπ!È"ƒúo"˛Ã¨ôB$âz£Ò4ôf$À∫Ëåg˚úï^»ÛöSW©Æ˜´¢uJ∏Agpñ£∑1D#1È°:Arà\æjdnmylzÈ˝ :Bwìf§@äÑ_àp*b‹˜ªJMÏO<x9π®›¨bÕC∆ä@…ì„o}Dn3Ã∏Ò£ï:˙·óô·G¬{0@pÿõ
ﬁî2FB-8@·ÛÄ`’û…Ò¶#œX1›∑RYE‹Zpèm#p∫“SúäXV∞y5≤⁄ﬁFWÏ≤ ◊ÜÅ…•Å¶£†€i˙ ∞îÖC¿˝
0,@ØQ[®Ãè mÄ˜7ﬁÏIBy“µ%L≥Üπ˚£'P#‚∫sêÔ’h)“F—j¸l≤Ó8|˛≈.yWâ*Î‰¢vLO–Œúû»ÓÑÕ:?E=Ë=ÀÀ{ƒP≥ﬁgp<f°ÑÎñëEÛÓ·6Çü‘¨4?¥x†~>©n\§Ö´Éú07åﬂÉÜ¨t8CnCE¡ıNVñYiX«
íöE+ïÔ@„YM*Vs$
≥ÈÙÅ|ù©MS,«ÄHïñ	úd∆@kÆ≤p~‘e3ﬂÔ⁄ `’C¥^Ü]‰∫ ◊åÙ∆ŒÉf∞ Eô?¿–’ïÛ+)Ìj∂Mñi.SvNQ∂ì5¯|”WaÅ≈ˇ¢¥á∫©MÜË3¥EÎ∞˜8Í⁄ï0F+…3≈nÁY3?qò‹˚îÆ*VçÆß7”´Ó˘•±Ëg&Â®÷π^—πOD˘µ< _µigÑ?@˛~
√	¨ –´ëXA¶E0≠BA˝ë`0H√¶Ú9Ï•TÇ£´‚PÕÄ’\√∫Ÿ-z>rú≤≤«ésêF¡eL;ë'‰2à±∏£ÃX'Ÿ(IÚa|„¬(œìÿn˝Û7RnÔ˘˝˚w‰ÕyÁÍuˇC˜‚Ë§KøÓº;"á«ÁGÔœèè∫5-›X9óc¥Ú,i‰Õ±À5ä:ˇlûGZjÏ-˚Øô'
hQ’l1‘Äjµ$KÅm⁄ÂlF¨@bÉÙÔc)}äß ‚œóx*w®›xÄ∫¢?√^%Ô∞0Ω®ﬂç¢úÅÉ_¡[ ÙôÇ∂˘%õ≥^ı£úƒ…5GÙi˚'Äìùêê"Gv0è¬¥E>L|ôÆ9»ù â%™íùceKÚÊ¨ìëAúP˘Ceí\V2ß'Ω
SÌol»©•Ö%”πæ∏Hè_‰8‚’`	&qàa£œ†d„¶zH(FáMLRu'Ë;é§<ıåF: G :Ê.ΩäÍõ∫π£bìÿÏﬁåËØ/Á√9õ{á´ã\ab1œ›l˘ç?¿»,Á!Ã∞`ÉrØå¨—≈˝hCs$=˙t? Ÿ8‘áa÷K#ƒ∆πAØHÌ«¥sæ»/ì˛ç⁄M˜¢wíÀ†Ô®ã'Àéƒ”iùdæí∞)–Ÿç7◊ Øøˆ3ÛKi+À^j™`˚∏ßÛ~yv<Ω(ï√	yxêëß ÷Sv”ïSJùMÈÿ¬ºUá∆À€·kÁÈÖWÕ>êﬁ~÷-ù¶ŸœÒ‘Ädt˛Z	Ø`£Omdî@æâ˜ÑÖo|Aê—ßìóàóÑgØ—∑Œæ¨â$†É,°4`/m>ÚåGèõ‚°ﬂßèÚEeãˇÏﬂo„#ÇüÂà—&iœ¸[…¬¸MÒ¯5ﬁ®˜yÖO‡£©[O*îi%g^€@ºjÚQõ<≠™ÛÜ*•≤?ˆ2AÌMøı⁄§pocïD9,ˇ@%u≤îøﬂ•ëÌ£K£‡Àwi‰¯î§±Ô“Ëª4ZÆ4j(;ñÀ¬üÂ·‰Â fk´ª∫¢p2´hFru_)£ %y÷$K|7ﬁ¢‰à.Eî!i&HÊ#ûB‰7%BºHÍÓm\–Ämπ~·∏ó-∑Ë˝°Ùü∂©ÔﬂªUåUÍPÍ
rã∞O´e=]e@Ôq;∏\JÆ»6ΩJ∂ÿ˙_„ıï∏äI.Ç•CémÆP76—ìÿã»†Å›‡s®.`eWŸ	ôloƒñ=Ÿt¢˛5ÄÄä¸ßÀ¯â i¡Ò`Q˘Øì õÿ˙lÃÆV∑%å°æIÅÑfWF™]1i‘í—( eòß@∆V÷⁄EomO-∞hìçÇù∆ã´.#" #°«'GÙ«wG‰o…¡ªN∑kejZt‡Û6@27%ﬁ…„ﬁ5!OîQˇÂJòN6>G·ıÜºc≈Ñ†3gXæÚOá–`•Tà2“ÀÜ∑·'^∑´Òæÿ¨õ=áhr<`éCŒ@¨–¬YòFIü%“(dól‹Æ}∂G®r›TÅæËßòá$n!['£`¯fNìdƒ Ÿ`¯—F§†8LÏµaC+∏`®^≥9Zaea^ôSã¢‹ﬂ≥KŒÆQ+s∏Bÿc•jj“AØaJË;0¥‡ü”g‘f∏@K
Üü≤z§∆‡§:¥m÷ç4]™Ó0±»où©‚∂»Zg@∑≈Œ∆Ó£ï}ÌW7gE©±≥4‰u$X#€;¥M”∑çõnN27E»»AÊ¶±Ç‘®ıRa&øÈ`¸RMÇ5I…–D⁄…˙ñE’7[	à:‰πƒcÕÃ”∑˝3¿aeˇUí|gT7Nr;¶æC%n<I˜&f»LE∂("2~v†&ù.2¸‘n;f6‡ lJﬁ$FÁ5Ω}÷å,j3kW∏%≠VÎjù–F˜JŒ rÁ&◊]H6πò\Î≥úYãWOí1}ç’u≤z13˛„Oa,πRΩÜˇ¸ö
˙”œàèË˚±FÒâ»à˛ùò°˛›>˝ø/5ìkTÔçsi)ªÅÀ†ú^Ú>ò‡ìøXª{ıÒ≤ol_l≠ìÌu≤≥Nv◊I{ù<a+~2√äü»?π_Æ›N»‰Ÿ›ﬁŒ&π]√üë˝ódkõ¸HVœNV…YÌú¨ﬁy®YÏÛ€ﬁ#ú™KT∫v…“à«¥ÌîÕ≈@fŸOº·Yé+9Ÿ:9I@ì£›–'›Wô◊ñ|0<eKYº≤LÀs,Y À nã_ò≤Èo[Û)Ÿt+˚ßI17~‚ˆVÿÉ£!ü·h»ëÅœ!˛≤/*Q<0ôèå?nﬂïÒ«ƒ˜È
NöüŸ©|∏QN…Ú˘‘_‡ï°(^LœaÅiE€”˛}à/¸)/dÄâ[´”<aBêÿ¬ËÖqâ@ƒ)
È‰Á…ï≥i2⁄¯%qò„™°_*k»úaÉUáîÚ£∞`ÿjS[{ZpJ$⁄‘#C&∆(∫ä*ƒıE«™»ºŸW‚ã.U∫?ÅS\4@Òø"ˇi2ç≥–a1¶ø¸€ˇ&›ƒ `Ê6ÿ‘a!cÜwkÔcV›rHtÄ∞´vÍbéÇÀgr>°rÅ!ô©…=oœÖö%|ı;X'¡Á$¬»§üLÈ˛¶K(Åc>≥Â ˙A∞˛—7Ñ¨úõX&≥T◊9÷äÍË[ÜBKïH˝[T´,ô®¿5∆Àª`∆úﬁbAèRÅQ(ä+Ecpß˚RπÇì¸F¶øZÊÕ2©á∏8hW#T◊	`ìÛ…≥IÿãÆ¢…®»#ôpve‰:Ç,õd|EoÀI/•„ìFÆ√Îåùü!π;W“∞Xû“ƒPïáµA!ÀZGF ∏$§—Úb±òä\ªj›°ﬁZÒOlcp⁄8à{•—yú≈A¸§πÉÿL<WÔﬁı‹^n^ã…%=Jd^h˘¯uﬂY7ÄùNO!ÖÁÖrÇ„øGÃ1∂Í≈ËŒnã’£rv@é®,5%Éo“®_¬±AVeÈŒQ4ﬁ∏ﬁ¯¯dè"ø™∂∞‰8n2>‚˜é*ßs:`É7xßqınpï˚ú}™˝∫-¢“\olÔÿªJëÍöuX»¯„≠GT¿«<2ø´∂H)6˜Éq~\µn»S∫≥º1ëèìn§"A‚ºZ`òJ:˜)]oÑ1äçÕÀÀgË<`HKYaæ,Ç Ûíµp’“+‡_¸Ç˘éÒ;x3OD§VÚ@ôÿ=Yo÷XˆØQÍﬁì=2¶∂≈øÛ!±ÚﬁI‚ÉÎ¡ÛZ¬}≈Ùı}+TÈˆó=9'A‚D1qä£TÉ8Î∂åùQƒ‚p„„”6H≈ﬂ˚Áÿ9+´*s\A˜®RrñtGy∆£#\Õì›ëw˜Él(≥Pèëë–PA^ΩoßΩπÍ˝bwø¯Nì_æ| Ú√Lgu6*RQÅFUTeå¢—bÙgÉcü[±2¸ÀŒ÷áÛ∑»Ë¶A\ﬁò≠Z¨~‚<€)ùé—·SÊñCôR∑5™[x}h¥ÏoP1¢œE…JØ¬∂¡8Ÿ IëÇD_àwH¯!æègiY˛M™÷“∂©$ògπX‹#^OY„yùÜ!ﬂM{j$˛1¯Nh8ˇ^.ŸÚßÑ˙fÆπ∫†SqN≥∑Õrù∆M¶≥ûæuK“∑¬O√®ﬂÙ(úY\ã¬‹Í°î–ÌÂ7tÛï*æÄ„B⁄ç≈-éª#“Qè<I∫◊îV˝ Å‰À-ŒÓ’‡˛Ü¢È"•'€v…ˇﬁß˚Æ‘êá+NˇxOxÉ·•—ŸÎ6kœtô2K¨ =/Gò·ou˘∫ÿ˘=âì'ùÉŒ·—…Òˆ∞”√Œ9˘[“=ÍvèﬂüvÈŒM,I/jxÈ≈+FÁìê;»#ˆ(“'œj}Pœ˝‘®vºËp∂3È0Æ
…â∆ˆ≤ó∑ÂoÃK1ÛNÂV√óÊªÅìè^èˇ‘∂¡.?ôØ&1¯#Ëu‚ß⁄ˆﬁ Kï_ÃWcUﬂ:÷$Í|y[˙¢ˆGÂ´ﬂYû(‰h_i∂ÊJn˚û'±ÇwèFåsæ5›fêÎ_[º>>Ìúwﬁ¡.ø8>}”•;øÛ·¯Çº?Ω8ˇŒD ∏ÏùOÌ˙`‹ãÇ¯?—i»! „-‰≠‚÷{íØ≈Éª¸πfq0”¬)‘e±Öó∑Ú-;Í˜Ê[ì1ˇ≥¿Å–ÅyÌ}ˇÉ[≥‰…È”’πqvÙÓ˝9>Ω¯p|q¸Gzà—Û™{—9Ω ko;èæ¬¬Ö»$∞ÆÊﬁÎUﬁ±ÿ‰ØrÿBq¬X.'m—â8ÍOY‹*àIGº˘)I?·K‘Ái˘ei>	7›9@KIxä
ıb]2J˙aú≠´EiÇ¢J$0Ãf√0Ã\d}Å?B9f)]“aZc◊´w9Aõ„äæuML‡^í:˛q
Ò¬Iöå&y∆kÖ‹s*G}≤∆b/ÄUËA‰"M‡+ˇ®˚®NX)â0í¡¯ÜsäìI2Åµ‡J^⁄ {6ÜbßcuˆäYF_∏GŸ:•´˜H|≥gqΩx∆¡$ÓG…YÛe›Ù/Ω	rów©⁄ª∂r@G"äCê~ò”›ˆI{<ˇ T8dm=Ö

È»ÏS”1…¬15€o¥ â⁄ØÈ∏¶Î$ÉΩ	ˇßo}≥bµ mÃ©ewπ(±åQko>ﬁ.˘ïÕæm\§8Èòá±V„^ëÜll¶Øﬂü`¸xÌ+é≠êr(9mxóWaŸÀÍ0Ë¥tœ≈T ≠√éªíÂ¸@È-Ä.‘3~°o«êA¿Îç`˚!›xrEzıπŸqYM'ΩdÑ(à_e*íöZ√¨t ≤
_|Ïc[|ùbp˘ £C®∆„:„Û’á	~¿,MÄoñ<£RùJ˘	‚Axô∏lÚîÎ8Ö‡ÿÕÒß)˝/"@
&)ØîGuÎÑ1eøçC¡3-RS	hÚ±^…ÅC¿~µqy≥ˇÍfÄÆ^8<“)ÉµæØHˆ±≠H9“>{ØÂàg8≥Qå„>ÛJú]ÖJ„àÓç`¿*ód(£øÆä«wü∞`§5V<3ﬁô”–MAWD∆o˛UH9‚B¬xLßH"_=û·{@2A)Æ\¨zãjt+Õ≤w…ÄSEè≤¡:âú,—nL ‚ ¢;˚Ej‰g„˜∑¥≠4â¯buö≈»èdU·¬8∫¯˘=VÌalNX¸€_`pØ7>>kˇ·ÁJAòr’:ub	ÃØÂ∏iUO'(C¡99∏bö∞ü
ı∏Ω	£ÂÒ;Ñn∞ÿ·t.ú'táºÉR*hJ–∂I’¢´4ú`‡ õa˙Ä¢—a)ø°~ÕwªZ˙Kô≈∏+·õqâ;¡ÔW‘ÇPã	˙≈œ˛5ì∆¢qﬂ_]E=w]yøOpÃ“ÌR\jlà'i∏¡M&I˜á3√ÏéŸ˚÷ ØÌ∏•Á∑,úúÖ√«±æ¨Ë[îTóg"v1¨*ìÍx–0ó/.≤I4ñèB∏æÄÛKx‡
±≤7<1Ï¯‰&ƒ>÷¿ó5Sß@L£Z„t√ÑY´’ÚYÍs/§⁄ì›Y∫¸D*FòÈk+k÷,i™Zx÷´>……æ©…Z∂o≈™˙ô
Í™¬È)}Vu“Lz±2g∫0Od¢cx=ªp3%ûvÿç˛TN¨°oìÎ±7S(TT[TœbG‡L‹Í#£ôÁ .8H9´öiìlW∆9µK&
ïKSN˛≠.b⁄∫bÚ‹N‘iO∏ˆHÙ∞¶SL-HoËø4û-ø˛J~«ó\ã⁄›#Wk≥2NV›—˙Lµ˘LU¨V—}•È]âo≠ÍûE’¬E•™¬ì3ÙI[Eµ;;’^>œ7•èa≤∞é OPıc-˛;ÌIœ~–ˇL52ÂœÅs§O%H˙v¶ÑtBHêÍƒ◊êíAˇBï	L¥Ç‘)í›ƒqp9ÕîJÜıi}3ñ˚˙÷ ?‰ÈÈ|8?"gùÛ£”rˆ˛¸¢ÛÓ+ÑJôØ÷;N .7I+Âˇl¥XÛO…7≈¨Ÿ(9≥Z@
7o≠±≠‰XèR™È≤ÕÊ≈crœÆ&I∞ƒ¨åπ.∂ãb™Ç˚˘‚ 1‘2´À‚üóWT◊√;”|ò§—üÅ|{@>J∆î'ÜD“î%ÏA6e4ÜTRÙá1◊πyÄÊî«!:–©˝i&í—€8¬>à./äh±⁄\zi⁄˝w’áØA^éU˝¢˜±;Ë›—¯Ç=k´´~∑¿»•ií∫c—L…ÿ[’dPÈL™ﬁN’^’08ﬂhô±`VVã˙çpÙ% …Î`≈@…áÅ¥⁄-`Så∫óÒ;”∫´À	©$k¢√q‘'#ñÁâI €§Ç‚≤8Ω—9ŒU0zïYÉ=¶G/∏Ó»aêY¬ÛÅ-Îπ&A3Ì’<I˙ÆC˛¬Rµ/Ωh9Ê¢jutƒ ∫	+Ñ∂:v•Òõe˜⁄„')\*ß1"»`dœ >_‚ù^èæ}N∫—`ºq<^@m⁄íc¯rYÄê£È˜P:6L•¨Á·È„CMuï@±k’ß BNÔC‚Æa2
¡r_'„Ñ~Ü<ƒ/£yÆBHMÍ@ìùπ>-∆`˙#X◊‘r\ú;p.Z÷˜Ìö	∞»‘πÓ*ùb√´`∞’_˘
ìK˘•èÏéCÉ◊Øà>>≠€
U¬åÇ1UH7g™≈µrX≥"Â]æÕÓ0
„˛¡0§ZìA*ÌkO~óˇ˜?˛ı_≠3ÌCÛ‚r˛U7€0O*p*+hAä©ãÊ y@Ñ!¥ßYû&„¡æ2KﬂÑ˝yù‹$S™Nç9bãÓ7ÆV!åã◊Ç^ÕƒÌK—˛òÂÚ£kîD#P‡hÛÒ∆ I»»ü¶ÄØ	¶˝‰ﬂÃ\1∂dG∞w≠jﬂB§®Råá∏\u¨äIÀf;Àyƒ]Y9ªG˜◊ã«¯4/N;á{nÜ ?,<À°ﬁüE=-]§ÎéEwV∏
i≥èº2ÌM
)Ωπ≈V˛ÓïU£C?<oo®‰äè+Â¨A‰]}àã´zrø2‘≥πﬂSE9Zª›ò)pcÉ øO(´«É\ÄcOÔçoAπVBêÕ@ ò©Ç¯ã≠D∆r{…⁄-gl∏{D˛Ú/ˇï+∂{pÅ≤h}“ÚÓù¨p¶?◊gÂ÷Úƒ{“6jÆZmº±í≤›Æxÿ2÷U£„m˜x|ï∏…∂ø∏wàÚ,7z¢ñJüj£Ñ–ü ∂ƒ6˙◊ÈXß\¥€m3∑„=sS≥m]Ïq¶Æ_Å*ñµ»kzÓHlı·ßY∏gﬂÀ‘K+Û‚U{Æñh_ŸguÎÔI>F≠∞?Âöêe5wÇt^¬:Ô•/ó±#h^’Mjîê2£Ö!† f›õ)’“®
Fµ9qG‹æÚPM¸„±∏
dë~π:E^q‘IIôhP≠®#_'≤ÍVû¢´µﬂï_óÛÍ^Ö“≥¬ÄÇêä2…1›ZÒ“•„œ¸öìPQ±0TòÈjjLGI(™ ±€ ìw…uò–≈øˆàè#I™åî·J/Ìvçw®á„A>ƒ÷7gÒ”DSâ Ÿd* a1∏=ùÇÅÿ´°6?,M¨uÏÚ ,2∞MÈ^N1£&»©îF¡∞5j˝â˛õ˛˝ ﬂú⁄^^SyG¬ò ê_ÃSÆU›˘(‹¸yZ¯Ç 	3põ`=üUK«cl6 ÇÎx‚"TN§áVÔÈì"˙πLGˇR<¸v´∆æJYπv‰ûçS¶yVÉ}+Ã%êó å}±cÂ?0<≥˝vØß–ùU‡Œ+lmÎ≈∑f≠ëææñzº’ÆÚéóF:íN)n$Á≤§∂ª6Ω˜√CÒ¬ï˜ïVã¥]BÕÿZFØ:”¬öÉ%Àö±\äÄæÙ„÷G/,mÚòQvÂH‘Fµ\πïÜAFF”8è&@=å‚>]ä∂ …Ú≈é'˚d´q¯$]“≥´rò±ØY‰Ds[‘«é•DäÔ84"öYûW<{˚'b≈¿™Å|¢sèåv‡Oôºs/5æ q¢(ûÎ4ò8˜1√‡.ƒ≈Ê„2Ù¡h¬äÿ*¯ùóó‘âaåÌy{©yDïBÙú∞æê•¢dΩΩÉO© ¢b,tˆ“íÄgÎZPî*µ…XﬂKR7€®õe‘ÌÓÂSä_◊JÒ"ã≥;qó„ûURœC™öDúEkêWH©´ﬁ˚c+ ﬁ”ÈO√ô≈‰„ÁfIYõabÑÇÑŸ—¿Å%°YC*T◊Aû÷»Ö∂XÆÏ◊gõû9éÿ0ÔEJ∫Aπxá€ﬁeÎùë‚⁄P'Œª::‹µ8∆˘Ÿ! _Ä/ˇ/ˇ˝˛ﬂˇÛü…˚ir¨ı¡SØ_áT{>®©pH∆)-^<Ó::P5ãÒ6G∫=|—Ñv0UıqXˇ)∆[Å'§èZ’ÌÉ› Üah¿Ip√R8 J-c‰&â«©^˘%Ñ˛ìhÈﬁhQ%c¡√P†60À< ßú÷áéòdYA>ÜﬁIYû	‹tï@I¨Öqì—éë†◊3N™√O@n†Öæú≤π°ÏÆ;”›LÁ∫<œÂ	?…=(ÑM¢§≈z©Kåñü#ÇÅa~)ñeÂßn?Ø†
•‰)Íº<◊OM8W·T›,ÃÖWZIªdΩfx∂wÙ-¬æ_⁄£Ûúo6xlâr˛>ﬁ„_∆‚Õæ“(BÍÏ[æw—e
Ñ¨„XSÌk-¿4%r˝Ì_—È◊q0¯™„«Çqi≠°÷ÔE‡ºÈ≤5 bñJe.`÷Ö‘,3a∂TìUeuŸm®cuÂá,ˆÒ¯s'¸ûy	qe„∞}˝»_« xKï5:–!Ñ¸]2€4(–fÆõaº•µ˜úCÕU´@∑F˝¬"0ûb∂ΩNs∏ †jë
„¡ÃyÊ¨Le‘¬ÄRÙ»|£jlÌÆÏw‰“QëeU`ÄGy9@óÄ·^⁄‹G[EÀÿî‰∆E¥
•ñ˝s óÌy?∞ü5Ω⁄^ÛÒó˘_‰<IF∆Ñû>E–π‚µG„îÍÁ#D}ô=o*o
Nå-á≤ù” ﬁ´ù√*9∂ül<Ÿ›Ÿ^˝õΩ XuuñË1∑≠)sÊ&äÌY¸|VEjiº¶Fai)Ë≥Ãe∑r)|i]jıyT=70+…tO•A‹guaå≥Yê‡ù—Æ@b⁄ ÑY•á›\;ØÈˆ–'·ÊTêWA≤ò)¿Ë0"ó~oú j«wÖOƒ§Sn¿ll∫à^Ê9%›i"<™Æº¢ø&‰]pCª€‡å¥”‹ÓXin·S˝∂§£◊¿U˛Ó√…È9/Ú)©EÑOûfÛñß÷pá;¨lJÂ∑P˘“∂=Ú»¨=g}◊∫õÒ‘;√”b9‡‹LnÊß:£BnB{ÃQxb©JŸ
ãOÔ†ög»µ1ûm¿÷Cç$ÌBMÖÇÀÄmÉºb,∑Wq¿8]ˆvuØ±kJi1E j9ÖeÙØ∞§∂ƒöZŸø8:?!€èw»¡áÛÛ„Ét«5 Úä®È¶èœÕ]\Ã∞a,xû™_ˇâVSœØ^®˘…"Ûöö∫ê÷π©bã4)gí¶X2øáπxˇÊ˚ÛV¸
ôú¯ÙE“†tl*é¸∫}ü*‡&g¶Àùè›1±ôlI1v≈‡›g9…TB…îZUÁ˜Ûsè”;¡ﬁTŒ(QÜÑ ﬁeŒ	ï!†©ì? ÑCÛNadZ‰ÄB
°ˇìIÖ}Ω‰4sûˆN—ID¨ √óLA…x ﬁ3nêÜÉ)cZÕZ‘aJØ∂†>å? Ûm¢´úaõî¿Åöügæã≈È¨oÁSNäÏS*{ãˆkÁYg2IÈ Õ(ëjôu±∆%À$âôA(±{´RIæ ∑!ñ.„@&ä.B$ëﬁê£¡ÈÁ1¥ìÑ˛˘BDP]iÇäÚ‘]⁄ÖL&abO+Ï›ºå/ÑÌ
¡ÇR`ê¿∆-2ëëâ£◊±˙A ∆¨v4)0ã∂≈Iô˘^"◊ Ó
é'®z£"?<w¬1√¬ôòû[§_ﬁ‡kº¬«$W“≈daÅ*Œ¢DÜSx¿;LR'FéXÃ¡3æˇUœB´e	@•ÁÈ‘∏¿
öÉ\RtI¡ÃK=™Ø¬ˆ,ÿz˚k´∂Ë´AØ5”+è ˆö'czP”¯ˆéÅ§÷>“Ô◊1$˛≥ìõπ2àà¢h’–¡!Õ*o¸[É“¥˛ô`O—ÅÙ••≠{∆Ì/ˆ0âj4*ˇ#œ‚I¿Ú≤V9úJx°Ñ6'~&˘’ñ¸jïÿ° u?ÑëL®èóßò÷hóèÍÉï‘%
˚∂‹ç
H˚O⁄@ÅÉQS˝4[M*yzïıl–∑úo]\¬G•1›_Òè˙ä«©ç'{u…oXaËëéâã÷÷¡¬ì§2]Va∫Q!bÁ– ˛I4&]–™É¥Yyck´Ë®fÓÍ∂ Í4ú@©—†’&ózû|Ì:ﬂôÌ¯SKo$¥˙Ò9¨Dçv¸AYrz˛¡l¸ÏI¶!>úTn=ùé»KBˇ{	xf¯Ê:†}R‚ÿáÂÔ4/ﬁÕXËK‹5ﬂ¿⁄I≠“ÕeŸ!„.5”+b∞ïuæaıp|ö1«_†‰≥ìíieøΩ˘òûNMıøö‹ÖJπø[±VÓ’Ö€_FÃ ≠ÖnX<òj˜È,ëÀ~ˇ%yæÈ≠≤4óf*K˘Ÿœƒ≥Û0àÂÉÒóÍSÒÎπ˘t”KE™hJBE>K’MVæIdG˙ÎKi®3¡Á∂:ëÏ(È@w´#Õ˛¯™¸«ß EœË%á´˛*|öÔâÜÇ√+I>>≈÷ïÁ/BÕ⁄–{9∞∑–æzú	ÍæC4åç"ìJG≤Ωhëp(ó≤{M—Ë∂üìäwÿ(T|LTsr≠ÏLëÿ‹'oŒ:§C’å`Œk˝≠îËe—â¬—≈√?@[:ÚJ´ü€^˜êëçˆ⁄¢ª<jüw k˛7∞rqw¶ræ5/ø,”»œ’⁄¸+_ƒ˙Dá"†®R?ˆ tÙ»g≥ìjw¶lZÇ9xz<¸Ú7f,ázŸ›/pv|C±¡8Ï7:?Ã”†">’ì2 %gd7|oÆ—∫åF‹ÇË_©›†à˙ÕZóå‘.e_aüÛ|BÒÒwô∫⁄hPöÆúÔ€ˇ+oˇÙ¿∞eÊºáÌØ¿ﬁ, ä!ø£K¶Î*c¥ÔªL(ÓºÀáKêœäÜ9¶dY˚ ˚R_ß£ÖEE|*Ë´ã0¿‘ˇ4È'^Ñïó—Í{î›´YA,¥vêå0ÄÊï"aå+EWÀ¶ñV‘∞é˘xvÑÊ%üoc!|9s∞*Or˜´p6,ü&> ƒ=ë¥˙sî%)]8Ô~fµG|ê_XçÔäa´u£<ài’(∞° `†W[gÓ˙Ä‚=|7î´G$‘#”√ïî¯M&<q7≈Qf≠
á≠º‰WD7æÄ¥∫˜ìp¨o©Ö¿¶QŒÄ@3 …π≤O6∆O8£)∏f·‚|–6m/1y`ul‡ru√r7‰‰Fñ~¨†ŸÖ‚&†bß	O~ñºˇ$áÒ#B?∞ë¸≥èƒ¿?‡ø∏∞ú6>—1£,ì≥Öé·µw\ø(Øë7YW¬Y%#∂˝+\èÙœñkeka÷bî•Vç™µÅÉñû4taIŒç>X©¨Kæ=≈πè*ÌÑïV®ç(È–ÀåÖNv¥YÙ“∑¯ùZÅZ…™ÍBeC¶w Òƒ!Ω|è@ﬂ˚”~Ò=¥ÁäyŒÆ©·(ÁA>Õ‡‚ j"Ñ9É{¯G˝Ãfå∞‹ÙIz@¶6˛B
:°D¸√ÿâ%‡öÕ÷ã/úÅø™õ±±¸iƒ‡X˛∞pn/ô‹ºΩ&/…«V´et¨™áÂ«ü˝Ï„-ûıø–G∞gaÜc:Ê_÷ÜXˇS–+°ˆX∞C„`fol˘’Í›É.}§M¸L;xKË (_1†ÿ4€”÷Ô]≥.6ã±ÒöN˙»W«ªdòñ¢˙œûò√Ü˝™!Ë‚èn8Y9‰-0÷Èl∆Ü`Z[ë*"òYÄ8œàúÚ∑DÓœﬂ˘—6ãè≥`Ö˙1Z‘çÍ¬™ƒe&‰‹¨e€™ü&Æ´:§≈6pË¯êÅüf≈Ö]Ë§˘`qÁ±@ù$ƒ‡L:~Û∂»C<Âªíq⁄Àç˝˝èAØGçxBwRÄ(hV1ìëR)eõ$&uP}Táù˝⁄Tt2Œ^ë¢h+goHö™^¿l≈®∂+
°ßi^X„û4jƒZWU^”¿vf≥›Yû@ÀZt<œòi 0„^π}>jg{≥≠€ñºÏi/†‰&z’u ™Y…Ä|ä¬JôÎÃù˛Ï∞x]4Ôdù”ÂŸ"Õ1[t£ZIhˇ4Ã5⁄8ûèÌ¡.Zˇ∞*1KﬁkkÖ>ú¢pÆTrß]P.'‰dGTÂIÆê¡Ós‘üÇsì”√8=Èu“m[£±a$ıüù≤» YfH7Õ.ÓÈ¡∏ÒÀú©Ò8ï]æ^çJª\^›ÿÂ-ÍúS€Ëv“H3ju ß∏€›‰k5pÒ–_ö{xËMeèÍ9GÒafŸ)FcKÆ°¢ÿ∑ŸM·N≠ƒ~”&(Òj‹≈î"s—¯ªä8B,Q+˚84Ù Í•÷ÏÚw,ÿ£å6™ˆL»Ûjò?•*p√¨6r»Ã·◊PX≤§;{éQ7ÉN°ÁÔÒ]ÉÈÛÌÌ/F≥Bù`R}.gAƒ≤k4ß…éÃ‘Û/Wa)ïG˘ZTKôYoõ¿%ßºh⁄úŸUôí´´‚ÙÇì√yÑπOiªÖ§·$ﬂ'õ≥eÍWm¡∫9ÍÂÚ«6C€˝.ÀˇñØ¨ËZ€™^Sh¢SØ⁄`‚√jÑ¡ã¯ôÚZ©0`(`?Ë±_s’ÛQ¢®O5¡∏\~”Øc˝*ò∆˘Y)3”jfv‡©/9|ºB˘˜:WÙÛ ä≥=≤ªµµEû—P™…ˇiø¯=ÉÍ¢ÔPÁ{yªı‹O“j„ºÇ=iCƒm˙!œwûÌ~”ÎhÅi¸ûUƒ¬`ó˚Ù±e¡eˆ_ﬁN“∏;®@Ê‘≈å€g"•k?»n∆=“ƒ¡ÂsÃ^ÀSØ*«ºïãh“	Zk]‡qZ"£ö≤ÔÔÿßO£7≠{_/]¸L]
2ˆ˛LË}{§–Ú<oºÛ©»«>ï†@ì¡0ºÔ◊¶hØQxELßˇ√©™0{d”˚~_U‘;P≤†…Ç#ñ=}ƒôÔ¶Êµµ∆ÓâÖ¨qmÖÀ|Äøì¸º‹◊◊'ªéÇœbô¸y∫©Î V¯Z'ÌÕÕMœ∆Ô÷…÷∂Á’^ÅWØr‹ß≠Öüïê–`¡É¢¯*óÎ™Ñƒ—Q Mû©†\˜È„£’K`)¢#‹ò–∑ ˘ì®AÉë´ﬂÔßEâ!<†…˛·£€âa}ÃÅÖÜÔÛ6∫˙4cx„Z∆ÚîrôPmÃ∏ÇÁÃçXÇhÁ…kbzÛEÚ+,"46Ü¨4	€•Iÿ›d8du4úZ„©PÁ`««èÛó˚/¬t‚àŒ kÁ&ô˛Ó+áô+Åá1Ë˜ää¢0è∆TO¬p$±ë®ï23†µ˝µ ≠zùÿgÌZ´µÎÕ`÷FeÎ	yï&A1§”G$¯çò)ái.ÎÏ|'5·à1_]5·˛Á≈ƒ\ ÿmÕ>¥∞Hâ®òàÑ„0•M^ 2I≤‹
;OlBÿ'ÙÁÊ¡zìoÍ`–*J`˘ÜØµóQ}ñí˛Æp_l®s HÀ∫≤è„êGT˛6b:“Ω\à¢÷≈(Üxv§œ@ïÀâ?x˜µ€rú“0æÄ#Û“∞á_B≤∆b\„Œ«›€0à©§µÃ‡‘ËñNÈác:&s§n<îìn—©X1 oñê∫qB5πÚü ÿ+p∞bN6eŒ3œö∑∂Uó∑fIZ+
—ª«Œ_&*‡J¯WI¶ÛR=Ω¿%*úYiÑlª|"zt?&áQò{¬L‹¢&OÀí∫&{làªÙ¨[ÅÏÑrˇcò&‰'æa}√π^¢Í·Oÿ æÿ4áQ0”Õ6=Eˆ§«îåX7 L±ís05‡ÿ˘´õí≥4aÒ∏8I˙å`BíÃ.bvåÏWœº¶È∫ÙÜ ±	Œœ˚¿‰Ã;¸Ì∞x4öé£?3"o“ùé`2∂+
RtîU(T69ÚGzzÄ÷≈’>◊}F¯m†Ï!éA_‡LÕ≠@Ÿˇn˚kÌ£M)Ò∆ã´ﬁ≤≈ã‡íaPÄ„≥òVÕ<â”…X€êw¨òLﬁ'T7§;öN˚U–©Ï(±\ uÅn„ó¥·+PC/íâ(¯f≠!]—\jEô\Vj=´ï›lï‹ ª’Vœ U~1‹ˆ(ATkM4— e•sè_©>∫bÕSuõ#⁄7ÿ.e˙∑Ωd◊¡0Ï}:à“^π5”{•iWêJ€¥]◊>ÓvN∫‰=C›wƒ Ã»€ÈeÌÜn◊NÑ°î∂\+«◊1?O˚=ô∆y¥—≈⁄[*.zD8t{]rù£‚éﬂÄ5’Q:S≈¿ËÙß∂«ßZì“*=ÍùºÆÙªùP&≥1Á´VÈ+N˙-ΩÃ•€G‚‰í†√k=Ø‰
Q4ô∆Pû¬m]·nŸøeÙF≈r4GÑVlrMB\uXtÉ),ômµ÷JÛ˙IDÃöxN7¡6%pÙ“`2åz¨÷©Øîv∏Õ÷~∂âfyaoW∏5◊]&˚< ºïzu˚K©PÔê.ême*
∑€ÔoÂ—tûƒåËj5Â•aS¡#^I“œÇÌÇ≥‰‰+0ƒ6f„öZÑ«0!5∫â WÉ^F˙&ì[ç•,£h⁄râTÔöæœ6k≤Ωµ;ô˜]ÑZ·Ω≠áHur&≥ úπÅé¢M√çTÓÀU…IF&!FAg<ZÏ≈ˆl–»í÷ŒË£V§¯–&’ìn;èä$Ã áñ0≥ÚCYﬁıæ˜+;øoVæY∑gŸ¨Ç¨∑T¯Ío’Î  »VÂ∫$/ñ˘:IGÀÿßØ©Ó¬ä⁄ºôi?¢≠∞#€îZ·˝úq¨}ﬂ´|ØÓÃ≤W?GtLÛb∑Úﬂ∆~-h6ËBe;‚aûØ‡êúÁ!¯)ñ±k%Îö}Xn˛4…√Ÿ‘˛˚ﬂ¥¬∆¸æc˘é›ùe«÷ZúcœæΩ‡@;`S∫An¬N=~é3··XäåNîNLÕc¶oÛhüâ≥%òÈ∏À∫◊Qé"(.Î¬·∆Õ°ÒiÒm?)HI@ÄÅ]∑9n?÷‡-m!˜43XËI\Ü1˝£∞LR*„«aº∫Nßﬁû™Ø1≥Ö˛%¢˜ÓëYòfÎQ±"U± ‚Æíª:PπÏê–Û´Ω·ö◊´
X—!°ú	ﬂôÏ`_!§YÍì®©Î”#M•1t+ç∆Ωh—Cjª]*éÇ¢£Ï†`_ìRﬂ¯IÔŸªBvWª&˜+éxû$ ê)õÄÇ≤sX4ª‘)-	’åÊ`y9ÍìNXFƒ1˝,RÚvD[w÷rÁ!tûCfC¢4¢Â ¬º£•k‚	\;ΩØÀ©”Â˝«˝µ’U«}¿ò%°ôƒnÚ¨«è	{§1_—ÕCÆ¢4w≥jzë ƒ1¡õ>/◊Ï√¶ì∂AEùL√q4Ó˚|ÆT xyˆîGu»˛Ïf"ª#!8}´√©Ós˜òÚ7g™Ó€º…ÀµgØOÛ·K´&—ÜgmÂmŒÙ‘h◊~)<I—8>Ö$‡•~lãjô≈c∆êJ≤arùV±ö`USVÅVΩ‹µ~qvÀél´ù`)*ŒÓ¡∞…ÏjzVÉY=÷/mqÖ«Í∂¸’öK£öhSlÅ6∫√
v)±?-·¬€ Q2f™œóÚiEΩ™ãúWfØ(…;E0¥ñM
CÖÓ]p*:#K*©™ä"i´vEÌü⁄øZ„£ﬁ,∞.∞«yº™ì*‚¨ø«£w⁄U†–¨i…îå‰*á6QÌ X∏ëŸIx÷éûƒ√;⁄é≥OÆßöMgÆΩe∑o®@DOÅ ÑÎ_Be;l°√ñÙÿÃ¬q/¨—ˆÂF…d≥ñÏ´£≥ƒhok&”Mƒ/ooIBW_îﬂÏëÕuBˇ5‰-ÖGXµ∑FÎm·ó(o˛0›UbbS6ÉlàΩ§0_ÿ≈Pul[ê_Œd>œ±\µgÉTjñÇÏ€e«¡sP∂≠MÓŸ˚¶iízıJ‘˙SÀ˙mkëüŒ8úG:$“V4∞^à6C¥®'ó‰{∂ÈIwbÿP¶IwÂ◊∏ê/eÀÅÚ~‰9ÎŒn!Y•£[¬PˆËì„iuŸ]e∂«É,|ô.!o8`‘>ØÏŸ3Œ«âÏΩê¿k :ı˚I»¬]ôæΩÍ=Ô´≈ÌG9#3%´⁄¡7‘ë7SjÍA2ÂÒÄ«9Ω€û iM`©œïÂ»ÿ]xjûπ∆„7¢£¨ˆºµ√-ƒÌV•)yTøÅ|ñEÔßüó≥Û* *–Mñ4Ï	L@}'≠”˙O58+<œÆQΩx\hÊkjt´ä&T£gu.éˇxD˛x|Ù9Ëú¬ﬁËΩÛtøVpMÒ@¡5mm£ﬂıâGˆùYUûaôÃè–1¸Ÿ®ü‘&Nï;K˚&kX”Æ}âã_üë&¯.‰‰≠&S=©›üuÓI;‚  	!37…À€a0Ó«0·dßÂ_˙Â{’‚~'óêø©≈∞úê~Ã¡2Û£=KÜ8“œ‚if:1!CLdLyú©†çì£ ço?uìÊì2	’˘©†dK3k#˙s»Ñ©M«AîB¬î·<Ã»dxìaÚN?ÈMÎ^Ù-Dœ^≈¡ #˘0îY˜‡t‚^–Ñô`·ó	8'®,rpŒå»fÖì∑≠¿∫6e,óJ`Á2Bìºf±™iåjzcm(meø#gZ{ÒõwvEõ””ÿÑ∆-ˇ4çR¸œåµéÆà1_§Û&z`#€=±Cqdü≥÷Æ©3]≠hoèÑ-*˛aﬁ¬ß?î˚	›kàq√àôÚ¡0ä˚Ó!òãÁÃ°âöv©9œ⁄:Ω›2Ωi∂ u∫Çï_
6Ww]N&èl˚Œb[…M´0œfZ¸v:å>Gò‚û€	]Ù;Ø´,Ùª{íÿÈ;¿è?åyÕÈS»ÀÚ¶2≤:¶:iòﬁ¨í_…ÍÑ•˜·œYHoÏ√o~¸QÏ1˝ÛV∑ò=T˘j˝√YÎ¬åÏlÏ>´G^%üMØbMÏ†Uƒ~ﬁ⁄ÙÏF≠T¿a∆Á≠åiÏùı$èõùˆ™±X7’ã9®˘ä[·±≤ ~‡ê„èŸe3¥»'≠HùªEπÏ∞å˚±q´/≥Õ∏î‘œØ+ù.pˇ"T¡˜®ßäø&k*ª“ãn≈[ºUã z›È»Û-<À)ü˚⁄•æµÑJª iñ¿§Âˆ∆Œ#ÃK®|€d´U£I„ï}Ì◊˘ﬁÊ-Ìn¥°aı◊F¬¡s#3_ßaï+ß ˜U˛–V9?⁄Wˆ˘s-9÷∆∂hl{çÌà∆v–ÿÆhlwçµEcÌÂÌ¶Ô˚ÂaÓóÁbÓü/`!mm ›∑πàÊäÕºà›º%∑ÛV£˝‹`°/Ä√s§]Õ\TªﬂúãJò2}Í€ÙT5©©‡/¥äV‡µ:I[‰19I≥ñÏá‰∂∫ü‘◊\ˆrπçÇ»◊ï‘hΩá–≤<ˆ~Ò+õ]¿íg≠˝˝ ökıí—◊^ÔEV—˜ïOŒÜ…¯+Jz„z∆>-~=c≥Xœ?lÔÏíµgõõèxçõYÁf√∑‹Õ˜^π◊{Ök!\ùN[YÒU$p©î©€5XCô@≠ ~FRç!«#¥Lw"Ô“+À;ı]ø≠Íi¯ïˆ√Î/rÎ±+ª"oN1êqﬁ]ı€ÑMˆåü¨›4uå`Æ}‚±rJ∆“)∏¡ı’ÍÄ¨Ω9m‡d+µuﬁ]Ÿ?üéˇ9ìn0∫L»⁄y◊ª5?ªk	ˆíûÛ@ç%…g!ÊÜÎ¥¨NwµX_ULÚ<Oß!VÀ‚ﬁﬁ¨¿Ô≥¢Ä´hD\[«l¸)ê◊,Áê(Ie}™ˆÚ¯Ü¿À§é¡pOÙè(0z¡h2Õ¯´¡ˇ+rR/ô™¶oCc%¿‹≥∞7§ˇ(é˝‰jñ‹ê-«örŒˆ*P∆Tã1NÆmj§Z6∂y™Sˆi˘ÂOê≥_gn+°yjkï£¿ ÂGKﬁ±w÷µRé≥lVÅHI?tå∫ª
ç—˘Äeµ)ÍLˆ±±Õdc¨•¯›“ëlıëQ~]ß¡%å´à±çÆR^≥||®4<≥€Öê„ô>¯8"	#Í>ëoéƒŒC…ékèSôª.oPtÑ¡√Òky"e-›∫£êÈœIz≥Œô¯ot.cåíêi0«ΩQ˜“]t√ßéÆ˛öªPˆ<Ñmçm£®-+’…ı$4~ ~¡¨ö:õnk /’5⁄¶Fdÿ¥HÁÏl*Åo<ŸÚ©T™ühvk±≠+æEÖR]˝≈È.Vµnûò`ljÇS[Kpí|∑\-Ÿ∆Ù´ØÒè”®˜âgÔÉ4z∆4 °“V–Q]c4l^’®¨¢å≤2≠edâ÷»M4këà	óı_Ö∞Úyô'∆}¸‘2ú3Óﬂ8éÄ1æQ.wËÿg≤Ë¡Ñ†WP¯®)Lu/*Ãc(WE}îíUã§ˆºÄ˙f5R)dZÌBÄπ÷Ö¿õ{W`ÚÆ˘€ºÍ/ÁÅÓ@m'ﬂ0±?QHÒ©ø¸—æ’3õòo¡˛Bbñ
#jŒ©Ÿ≥Ù’◊¨º#Æ˛û:…XâeúYÇe¨íÿˇ¥HÏó∂è8=lI˘ Y“Ûãè_$ô-Fp±&Wê´0|¸ãj∫›Iãà{‰oVÂª‚¡–‰∏J°ñéì)kNÒröÓçZ~öåü©Ú
UW	Ùh¯ãï«¸èwÑ^\RM—e—ªFß÷64çÃ2í>~pw8Êí+Ú*JÛ°?⁄›O˘Ç÷ÜèÿÁz53‰—[‘O.g¬∆cad—J…gL€ú#Ù„*N≠˜õ:ø	¡-πºÙeçQ_f¨YShtÃ{]pKI'8	‚pe˛;ﬁˇu8¬fÿø_‚ˇ`è~„<Ã"Höå†Ä]øüÜYˆ’„Î f
XófÛÉ‘Ó%ﬁÍ¢Îg"3ı-xÂ¯ ÆìnÚ)°fﬁYö|é∆=ôª†ì@sÜË«¡◊˜u4S¢væ9X¢®0(Î@>§çƒÎ æ-xGïõ_¿÷:Ö5ú§}¬z!OßyˆËØaC=¨≈}0Lì1ùÑ¢pÂ\›EÁñ≥ºãˆ∞æ;Y>Ä9I®!Kõ•ÁFò˜Zﬂ◊ˆ}ØmS˝—Â óî%[T]Z-ûmëﬁèç–JÙ˛áï˝˜‰,ÁÂÁê¨}”“,àgG'uhìŸ‰ÃÕº¢Õºöøô˜Çß· ò´ôtß”º?_mı[#P9K√œQ2Õd»<”ΩˇêŒÀ	Ô#Î‚Çêﬁ¯NJ‘˚∏I%À∞∞næüñ˜Ωæªì$Õ3^U„Ë41M”®7çÉî«	≥¸AiáëË‘Ç∫lwQk¸uí‰óAØì√2»±@ÏE0ùìZñ'”,Í˝5¨¯1ªK@Â-ô‰V.Øî0rù'ﬂ,æ≥®¥Õëû„)™^ªÊŒµaﬂA—Y∂˜æëhuYæ)ÑßVıeòÁ€V‡;–s^†ßV+«Öˆ,äÁ»ñK∫z~9,E-ü£˛îŸz‡≥ìï-¯‚.J˚`]$ßÚºT®Vÿ.{t9d$îÖÜ»(ÃÈ±õ≠#Jå^êM„ú˛ñPŸ:J@Æò""äæ	Æ0X/ﬂkÜÆ˝+ÉÜt¡w`Ë¬Å°œ∑›\0TIÑS ”o˙ˆb	¯P[ŸœYA¢||+s¨‘?} 0Qﬁõ≈‚D
,”G;…ì•MŒ°°˝ÑNJk:7„oj^Pﬂ—°≥£CgØÿ•`K≈∫ÇtåH<⁄√¿‹ÄÜ†í/Z2A%iπ&t|√Ã£ñ˚|µ~µñ⁄˙-ÇZUÙj≤‚ªÄ^Ö¥ÆÉ0\!ìh¢	ùA˛Yã@}xÛ@…SSj:“ìbí&#∫_ÌG√ÇÅØ~v-!&ùLlkâΩàm7√≠èÏÊππØ> e©îîxΩää‡£ÿÀ«hUë1ÍòF·UaéêC~ÊØı˝G{N3Õ4PÒ®_•˛"5∆ËgôÒÊ%÷¯=ãNT¶/ÿ7)^k‚G&¡∏Â5<ÿWY}˙æ∫…»	˜Û˝´=TS‰ÁËk?π$ø˛JV?å©í±:√‡¶5Mxp∆´˚ˇ  ˇˇÏ}ms#Irﬁ_©ÖVCPCÄ HŒŒf∏¬Ä.µ|3¡Ÿız4q”ö@ﬂ h\70$è«Ö#ÏˆIÁΩ;[!Yä’ùO≤-}qÑÌ;BøfˇÄ˜'83´™ª˙•∫´p^vâàù%ÄFuuUVVf÷ìO.`Ä£'N‘DÎæô	ùQ∂BÂ^›±Á"¨âN≤EÕÎ0‡‘Ó∏û›¡jŒz qÓ2ıﬁÍ¶RM„}¡U#,®§",ûêÔ∫QŒÑ∏˙†Ü°œ¸ëYÏíÆÎo´e\E X‰llñ∞&›¸ÑÒ÷Ê¶
q¶±Mö7ª2âj‚ÀL®ååº˛ÜŸr◊Èb9—U“ma€®·…`éa’CÔ˘{Ù@:X(Éu‹ﬁà£>T⁄Ä˚R}òr¸ÿu÷@àñ∑ÿS\˚H4#<
CQ|,l+Ú áºôZxÄ£àIWÛË§≈œwˆNŸAÎÙdØŸ6xn£òßA¿◊ »±5D9≠ç¢ã’e{ KÁπ)J^±áÀπj1≠ã–#•jV`Ì•§ÃÜ\…W†¸eÊ∑¡XP‘ü≠=ZØ˜t9JƒÍô)F2û;h√g…9ùM=πJ]1eÏ%0	Ü›z[h«„È®3ôÇü7πß>«û=6["±&ä0Sép/E£’™N¡{,
s◊™u=!Ä ≥‹∞U‚_.ÚÜ˙P\löÆ«_<Á·aÑY8_CgÙ§¥V‡zÎÆœ&ÑØLD=„ÙX•π2‹¿∑aé¥íà„+âÁ∞:∏l‘ì–XÃ´O&E`	ÆE	6,XWZ€¶)Å¸ehá.æ,&~_ŒÆÎÕ¥j∑]˚ßhêÃˆÎ÷e«Û‰[[mf[1)€C˝n{òw{@Ñ¿®gı(TÄÂsÌÀskü‚ng0yEve∞1Ñ≠Ω/˚¬Ê˜x_ÿ±'ûÈŒ¶›€†^\èCËg˘=¯*V•Uºâ€ﬂ÷ÔˆáŸ˜á∂®3€‚'2åÒ°Ì¢dÓI$ˆr∑Mòº$8+uÁ⁄+⁄iMﬁm∑øaÏª≥È˙p™f˚˝gNØ?∏bçŒ˚∏Wl‹ÌsÏn·4÷dÍÖq¶F◊O¨3#⁄ñaâ¨`œª€.L^bªHéﬁ\[E#ﬁ‹›6q˚€ƒSªÔåfÙ*=ª“è=wÏ93û›78òªp+;ÖÈAöaÉ∏Ì4z=≥†m~h)N¡√≥üç˘œ~6%¯(
‰ã!Ç¢µ Rœµ’m%íÎÄ8"q˙Ó"â»Y@¸ﬂ˘ >Ï;]∞Ûf:z≤Œ|w0Eå°;Æ‘òˆ√˛Q©◊`-¬?·Û=T0Ù¥ò	-I¬äø∆*·˚+|ÔBﬂa[ÇïQ⁄6M F°MVÙ∑Nt#Ópå	ÏBÃ=éÄ,ëg'2QjÚ‘ùfﬁÙ@?ıIÎ(*¯ú6&ƒFKVÑ;¡iJ;≤a˜Y<‹•∫yr)¢2≥k¢U7‘iYèBåVŸFÅ-ﬂ\é¥Ÿπ•?AØªÈ]òôjÀ|b¨˜>[l˚	[Ø≥OYÈªo~ÒC€ü¿ÎgŒ§ƒ∂ÃT˙mÙ¨æ¡{ˆıü≥ª„áD^Nª¥ˆ ªÙÌ_ˇ›ˇ˚?ø	à`¨éŒœmœ∏k•oˇˆ`yøq¿pπbÌiØáƒ››íâaTlõõ˚¢Y2ÓAßñ¯Üªf=tœﬁ	âgò∫‚öZa>$•BòS|bÎ òñ¡Ï'Ïf~_Mœòï4ö„Q8Q/ñ™˜•á€È€Çª	‰Uè˘Øù¡¿_áf“gTÎy®ÜÆXb
‚j%`c√¸πé<{hyØ˝j’Ä∏
F“Ωü\Øøkr‹Õ¥Ï@≈qM}&
æk÷\—|åªã_Æ “¸¬ˆ∫Ngbº8Ÿ,µ‡˚ìé≥óÇˇLi•úJ∂˚VÀøgì;ÛEÉÓöÜ±Í} ˛ø≠º°Ï” Å=Weve7G£?‹⁄ê>ﬂ‰Á∫…â˝ç„Cønß¸ª©ëû≠”=û1(ƒ¶∂ÌÙFØ4≠¥Kù2è—Iï«WÅ›7±ˇ⁄›ßÜàÆ¨[ôeˇçÌ¿Å’'ŒÏÒ°G2µHÃ]*Fo•[∞Yú{A÷ﬂ[ﬁ†ÕE‘Ö\0[Pc:ÈªûÛ3[µ”˘»3◊ª¿óâÀ`·9ﬁ– ∂˜å;®#˙<qê|`
ø±ÔòÉfgjêÂd’`9Dk–•ÑF}’∫¥;Sä’ ôB+ƒÈÿ¨¸ÃâZ'R¬πh?≈Düº<Í€)!);
;> úœŒ©ß><âg3_nÈTHFΩ¿…î¨-v∆=@L∏±∆§î¨Í6Éó˛¿∏Çæp|Îé&h4AC–'ü¨ARaAÚÉç#(Pãg
˙ÏîIÎxnÜ†pºcì,øxO8Çdw=∫%í NÅ3«7ö&¯‹|*blAÇ)(/Ù˝˛ÚE≈ÁéËÆZ‰±Œ±éÓ•Î0*tŒ˙÷¨®z~<ı˚ ∂l@·Q»tÈ…–%È>ª≤'˚ÊAõC¯q¢®‰[≠%˘}¢‘Y€‘RÍlÃB©≥H6”ˇåÕÊv7∂èßt˘˝îŒvm$L+Ògˆ\}¶√‚ù∆ZŸΩ¨Y$˛5‡∞„ÔÑà«y„`¨IÍ¢ê<¢µ≥wôˇíõL'Ì%‹*O¶£ü`9\kxÊ“æ∏k]LG(™÷-0ﬁ§ò«aäaàµ–ÓÇîF$Z∏7cÃàÓì¡8ΩVoü˛≈“¸º,g%˙Üä≤ÚŸ’<9ÍX6¡¬KæeéêIu vÛh˘ë~ÁÄë¡∆˜ ,Ûå˛∂·ïÊº01˜ã,ï|ŸJ˛&PS“±Î:˛x`q◊é¢Ñ°kÓ—ÙaZÁí¿
ªg` –≥'◊?«zá`√H œTbè†î69g L+:÷K’ÊÃ ˚÷’é+>π°gìß}=ÊA]cMÜãSss∏ ∏§∏T'.,yz{ìÖ˜-mØ–P„á)ÇMOõË‰—ˆÉ¿~›Æ;?‹%ó†¥≠`gûªÿ≠¬πÿi‘Ú≈|ˇß*Ñ†~@3ï§o¯˛OT¸ALVf&ıa∆Ç¯`≤¥9åãû(√“À„-Üó¡î ¥8‰xÅ6vãŸﬁx¬Ká,xñø vèhﬁé\‘JÏ»\‡¶⁄»‹‡¶;:wà\Où∆ﬁ∞B(º)x©»_ÓŸ=ﬁZß∑qÉb”ëCÄ∑'¨3ı'ÓêPx‚([†E[%^◊(ÒZQî∏"Ÿπ]ø]º¯ª^f«>“$¯H[úL7∑P}Â"@pôaÕÔaw≈Mg]`çX;≥¨±∑Äß)ä»©Æ"`æLÌh±r√óìÀ ñ3bO\†,s¢—ßa£OYπÅG»#û; ØÊiæ6ﬂdÂC.€ªZ=ˆú°Â]±&©Øy⁄ﬂ•¬g‡Ç{>√7R˛u6ù–J¢1ÖÅÜyÌ∞ßbØ8µá„•≈ﬂñvê&‚3€ñ73ÅIe•"çΩ/z"@Vö+äÙiy˚ﬁf°}oÜıT⁄ÆTXé1+˚Øˇam˚ˆdlôU*EVÎıy8]>!O ìÒ`Ÿzvè`"S<„óÚ%ﬁö∫@¡œÀÙwrnXû¨1˙¶fXıN«.W÷ño∂<<ˇ„q zü¬_˚.2†∑'81Âe#ƒ*ÛA3·Y†“∫-§¿‰ ﬁ	˝¶¶Ì√*û‡uåô9X-r
nTƒ>%ú‡|„p¥°uYπP‘*€èë2ˇ#Ó˘ .Ç`øRÉÒt≈∆Óx:‡åÿ w]:ƒB_V\Ï©ç5ƒ‡:U†[Ëoá*äu{00!G§"V|ÀâB\Õ¨HÄ>ÁJ≠‡ÕäPŸQl’úyÁÁŒeË’∂m∞º”î∞bπ!û3	Ô(√"k-á¯÷>Gµ¬ÛM	›séê ƒ˛[XWwz◊É^ïX´≥ÀAå&ÿtc≥1Ã¥úb$˚–Ì…“∂⁄Tò_Úp®ŸŸŸLÇYêV°9y*mLßB),«xπ;Öè≥k}W¯àÄaO±1∆ê“¬eÌò®sfè+gW¸ˇGK?[«kqT	]i¢µ62SHÏ÷£Î\#´7√¢;ŸY<Yhá∞|i{≠ NÇÿÀéÌøŒQò⁄≠$ WÚ#gühë˛B\íOü€µÇ% c@¥¿WÃ∂<‹8<ª"cDd!u‹Æù•˘3#O◊ºw3ÊπæÄô’´≤OC)ﬂ˜t„€ô∏fﬂÖæ¿ˆ≠Ä&=wHãZá	bgñWe<-çu˙û;7º0Ü€˛
ÏVC\∏]Oº«Èóe∂ñ,AH`ÃŒ´ÙAÎ’(∂ßÄOÛä-höO®(<#Xõ≥hw^`n˘b∞œFkø&\ˆ9Ç◊/˛M≈©ƒ/NVÑÅ]ÃºˇÕ≠bÔï∂7™qúO|;3À:ﬂïxaz)ÅœÜ¡Äe,≤Ò`REi7Xâa…hÊ_ç:8…dΩ[º.ò0‚}hv_/´vËÏsõÒ•~K◊CúÄÕ”Ω/ZÏxÔ∏µøwÿb'≠›ΩˆÈ…WÏÀ£ìœ€«çfKcj)iMå94˙B3.®mÓpf9òqg4€sÃ3MRp]¸ÓÒ3ƒShYóñ1sSr˜)óı√„_vä=¥Ω	Õ ≤MY¶—¯˙fmS5j]ÎX∞ïâ['Ïπ÷ô:í†M’Zæ‡7ciÇÈ@–©púp4Aã˙√ˇ OıÅöÖŸ⁄πI∂™¯†3fÑ<±5"ı[ß\§TÜhÕ¶},ªˆ—ÁGßGlßq⁄x⁄h∑Ñ∆X§ÜJC¿‰yY¡ä6%"‹¡Ùƒˆ‰d òÜn`ü\¨+1ñ°ıÃ˝Ó1ÏÔV7s≠N<M~«Í'µT'èSH«Jx*LÜ!(ËZSZ⁄V≠Â¶ãﬁÈ§?K;aUÂ&VêúµJ´`´<Ka÷Fvß`E8>–hb!	÷,ÌD≤é∑èe…cœÌ°âŒ⁄:6ô≠ãÇh«†	¯ﬁÀ2r$ÓÒ‰ÃÌ^©]Ä%:¢r≈ƒ°b∂Íêõ¶@:O0$RîQ©$)g=¶ºKì⁄ckÙ‰˙¡Mt\Fíﬁb¿)éù78q;t’‡Id˚‡~∂Ì¡˛¡sŸÑÖG ê?{èb=∑;Ì†+8gÄªÈüÓâ€µÆ≤´«”åf*ê<â0…$LÃù…¿”ù…†
£ì¯•(ÛêH	]5*iN3_Äi4ë@Õ&±„ÛN‰[ˆ}“pp<øo 2≈fΩ≈Lå”“˙≠˛ûi≤§Ù?|≤HÜ÷lw9∏òü´‹»≤rCÙ?ı%í€f2b¶±Ôjﬁ"¿P£Ö@ÍQöb†8N˘ê•)ÇRYVÛ¬÷[CÀò6Î3›çMzì“ÎWŒà‚π¥∆+G+#îéñ¥&.w√|Gï|·8‘‚≤$¡µ [Nû}wJ~Ω∞ı¯Á∞A//«oŒÉé»Øsv%¬§KQ
 ŸÖ0ÎÉ‰'õΩ*˝Ñ∏˘xÍç·Ÿèx˚I‚òW|Q‡ÊK—S„£åˆŸÑ¡‡Êï!⁄‡:O
Ó›cKﬂ~˝wXπr~nF/ëh=uö˘-~ÀRædÂcõv∫<ÎM#” oˆª‡∫W¿‹éìvÕz« w/8kn˝_xÃ–°Suı¬.¯èånj∫Õ´Œ“H±"KÆé=d]#$œ:DdIñÒòÃ _B– è:”…◊~ë¯&ı…ÛÏknÑüZg\8à}Õô\iXiØv∫OJ∂7Æ†åV‰Ji[¯fçú!N“9XI†£W¶í&ƒ∫◊8`ßÓòù:ìÅB⁄ÊB˛‘ç@7FWcqÅPO#1·F¨ö ∞õÖœgâfD˜Î…®ﬂ ù√°E¬û	3t,+"—©`å‘Fâsël*bºàúÎÒt‡gÁL?n˜{–m‚˘OZÃUf¨+nV»5Oﬂêáπá«JA≥N£÷H÷x(É<ÈVˆ„’~];I˘ëŸZ·»,•7Ù¶ã0‘op"x∫9q{=˙ﬁ¿=≥xµ+x}œÈ–◊Ë'0π6ô5Ì:q&:§'fpˇÓô{…|gà–)å_ÂùçjmŸ"»pAwgdŸdy∆Z"N®D6<…‡hÃ-8°dò´rt˜a	¿’£\≤°Á6-Æ¿B„oÎr≠ÒÛx¯6≤îñ≤Z›ä€j)–æà˘ˆPo§efèÒ9#„ØO||ù:Ã·É= ˚S|¢‡◊ñ‡æôÀõV∑ˆÌØ⁄ß≠∂‘¸ºµ√véæ<dºÚ
›L÷:9fÌ+eÅÌS≤≥ïF¶CfxÊ94àz≤©g°Ï¶zó…hvpÓó°HéèNN∑ÿz∫P&Ã-€Q VØÍÚN¥_hˆi‹£]ÿe†¸KÀQ¢’9à…dé/„ÅÈw˙Ùk	!RÊÇÀ‡¶∂vZ=Q<mûÌ~]*ë!’Øƒ0ëÉ	'n≈#hK æa¯˛çò8≥=‘úè6´áÿÖ€ãù|>ÄU˝ ‹Öïì˝;ÉAÎÿŸªr :¶±ÉZd‚º∑¥›=—≥Gù+±Çôúˇ†ˆlQtÉJ¥E„úI8`[Ñ˝Nﬂ9†=óaÍ`«Ç'=±¡;"”œB¶ƒ7`îi≤5Ü.ûì˙Uv4`·&ÑÅ¢ÊnåÆëı∆°rÅàfAT?bP≥ôägÖ/@d˝b∆6YÄ/íÚLíãµ|nÅLgRDZ›nMï}∑WÜ–…ns˚ƒÓ"t¥}´˘¸dÔÙ´%¯;îç@çtm“"ñp‘„…ı®é°ÁtÌ*˛∏˝ºŸlµ€KŸ¬µQ.}˜Õ7ø£Üvó”÷…¡ﬁa„¥µ≥≈Q¡=¶98˙…˛¸)	Fø∞¯ê=±ª’R∆}3¯1”Ä!±3Éµ®5!çœpm¡ﬁ≥A „aÓ’áy`1PxzÜT`)È$G/“;¡TÖk˙ªo~Ûk≠êgÅΩµK ¬M≈¢ië2p}}AE"rfôzé1CV~§;˘Xâ÷EZ≈öÈ˛}˝B3◊‡ÉÉm3ımœ_¬"?π…
£4¯‚ªoæ˛=VoUœ=tz†/‰øk˚∏≤	≤(Í¯Wæ¶Î∂òO:˜9ﬁGûFﬁ¨dw
Ûî‹+€Óï⁄ø_˛éµƒÖäg∆å<±∞ã¸3*ÜŸEEã≠≤ÅsnwÆ:;ÏÎÑÉç;™¨÷Ù>˛ÁﬂR˘>û~\ç•±=Á2Ï‡…”FS˙ì–»∂?Ï÷“Œ’»:ù•‹ëóñﬁï_ˇ{π˝IÕ HQ"®»Ñ]i–úºh‡ˆh?€*s*æîö÷x¿@Ø##wÍh}˚◊ÖÉﬂ≠}v$tnÿ«`±ﬂc<rßlº]u–ö–CLÓÅQKÌ‘K:rùúeù∑Ê•‡l∏≥L ‰ô6GelOœ@¡îÈ.°A’≠"ù≤ÜıΩ+†fÖ'Ç™â3’ŒNxÏG˙HÒ?Ígñª)›ÿ≠Ò£ƒ©Äv≠)u‡≈d∫µ‰ÿ∆66lj#éÒ—8ËiíÕ!æπîÌŸaÆ÷MÑB° “"28∑Mû…¡Væ∆èŸî
≥,§6Kısé‡¥bëw‚≈Ô0∞:Ø%˘uLç‚ä≥Nâ0ÅÉBö wPÚ €&È@±¯ú¨PÇΩ@ùïuàõmï§Á†f{ÀÌÁOOOYÛË¥uÆ{Î‡xˇË´VãÌÌ¿{∞|qõ<i6?£ 8\◊>⁄◊ÅâØS&3eá6v£c·|ΩÉ*7w4‰}ö∞eÄØ◊µb•,˛“+LP±ß¡Â õå_Ñ¶¸"|ìyèv‰Gë˜ ú{.Ë∞<πNscrä7‡+\5¿à?jäÃ¥Í…∫NiÌjfˆÛüÉè4ÍyUˆ‹∑ÜVüTŸøÄ?<VV|RÈe(Ú–∑ƒûƒ…«3∂≈C·Èû∫bÇ`ãìãÑﬁ9é$Ÿ2áÎIh‡—@L◊I§4ä=©Jﬂã}õÈÏ9Á¨Ão∂úSAaRœ%ò] IZ‰y[yI>O∂Jø˙ÃÜZ≠æ;ŸÉÏ_È'EÎ\jB93xVQ∆÷¿Mﬁ;xæè3x—ª{ámÙEöÕ£ÁáßÌ"öK8<∆Í*¡v9HTòNúQjïöŒ:Ü'ﬁÀl+pØdÍ„€«ƒ5=Onºøjroù%2?÷33?6Ê˙–-/hÎ)πÜ'§u≤:Ïö_è-ñ
!ãM;˚TP˝	£MîÜ1´Õ≈˘mE0:ò“}‚0A6‰WKõ%IY=5‰áñ+æòCΩ0á
öùßÜÅ÷ê4U‘¶ƒ∫¡U^ç¥|jã¢1◊L$ì4$&ão®ßaËJ™ ≠Dëàc‹à¯qV∆IÊ(Y¢∆À-ûäaêﬁïΩ¢
Ác‰'<‰‰b´t˘ÕP”
MKﬁ≈©M2lîáHA•¢ »•Õ¬òüüé†k3äØå÷X‹Ö©/™iëWvb˚x÷O»˙E5ÕÒ3Û∂Ê9Ω˛ÜÄ«√Ê]Ã^Â&kûô'l$ŒÉÃ°∆ïÇ±®©Ôô2¯E>¸ΩñÕõxs`sçâvÁ÷ˆ))82£BËÏ¬õ*ák„çÏ"@m|—Ø∆}$$K4Ìæè¥Ü∂‘ ›÷«YÄ¡◊Uπ òx†∏8\=]ŒÉÿç+π·PŒÚí‚ˆ.e rGh¶∏È¯˝ƒyF‰ÜgÉid{ƒ∑¡È›7õö"‘@ÉÊ∏oO5öŒKÇ„ìË òU8Î}Ö˚ùDƒ'†ÔQå|ë;F2‚9±‘„
~Öîçó4R_Eí£&“Õ∂ái†ÏZ>çÑ|—c´•§ÉMÚwﬂ¸‚?∞∆˛>k6éü∑[må5ø˙Xπ˛F|eT%Ò˝Rñ≤ •ÃO(∆8
¨ò*å$êîs£æ
%,åkò:.3„Ê∑"˙8‘øJ√\2fADÒíã^Éﬂ˛Â/π@Ú—{ˇV¢∞πg≤Ê"a§“) …M¥ùá5äøäW∫≈◊åµkÒÖ1^e|§¨Éº†o¸≈±AØæ˝€_`,≥’n≥ˆÛˆqÎpqAß}«gÆdùa· D€C–òÂ≥“«™Hï™Ïx`£π„Ö∞ò3˚wU	—ı™Ø+Ï ógO¶ﬁ®»oÃÑõøê‘?Â¯°,∑¨Bùï3#î˛GRÈù%6œ≠/µUô¶Æ
ı´»Ä®¯5È√ ‘åGø˜éóVÿ´ó3¿òtò√JB‡⁄«
„túò¥ pd∑ÿ«°=∞TwåÏ~ØL±mâŒsy˛Óõﬂ|Õ¬≥Ω√Ω”=vSël<–ÿï“âBç9ÚßC™!Í‰—ïh‰GÙ •BbmX<_iq©G*_j»LgKíæ”|‰BU¸º<‰\h)µG.ï(7|SÃ‘h"†ÓkSÂm\–ôøæ7{Ç¢10úÉ+∑–¬ÅﬂÔ˘-Xˆ†°©Åâ7-¶˚†ÖC˚ãåãÂb
ó’‘M°ﬂRÏÉˇò˛,ˆkèTí\«≈~Àµˇ5ˇªÿÔ˘æπ•µ≈~O·˛s ¡√r3Àëønä)WegXG<* Íö√_I!‰v√ﬁé–Î"D->ÃÉtä*j¸Ω√gGE‘˝ÃZ4ÙÈ-™˜ÍStÈ<ötÒ⁄WÌùzÃ~°a÷·’ñ¿⁄•Ã*÷<£†Ÿÿg'≠/éöd(¸ÈËOG∞VØ‹)Ûß‚è,Ié•ól$§¥ÈÑ“≥ﬂ∏Ø'î"ÖQrz≈r¯Ù’Ú,∂`¶/#,>=˛øzÓ`ïâßq∫dqÚı∂\– 6Y‹«âË&◊˝ñ˙»∏≤ølúÓÓ≥ÂkN9‹
n´&$Ù(Ãµ∆Ã
F˙ˇÅzIè»&UÀ⁄¸Fe/\…Ïÿò2t+jf¡á˘Gp˘u5rXƒ%z¶~AˆY:BnT…náIÃßŒ8≥0uJb`,∂Ò"Ëxs3ë(ò89‰Wc®j2˜‘2lò%ÔÏûbOﬂ}Û´ﬂ!VËe›7N«&ùÑ‘¯†;¿…ÖÒÇ![}TC–mﬁCQj›t‚`}rÙ!eFïÄÍ(ªU‰µ£öCÇ¡*£}Ω~xÃâÁéz€).<ˇéâÌ©‚CLM◊c} kÇçûü≥°ç]_änWà√aÃÅ'¨≤”æ¨E‚tmÃ-¢|û».ú¡ ⁄∂†mgà(ãbü£)à «cˆ%<a y;<◊ŸkWﬁ	F∑@H∫´h?K<{Í^ ∫-⁄∆˙ïs'+ÍôõÄ:+¬,m‰®ﬁ FÕiò§a¿;ëóúEº?U°e≤Ï‰·À¬ïJj—Ï◊Ãg€ı–¢K„§ —¶5ÀãúNeÏ9oúÅ›√≤;îy&«úb´ˇ”h≥iwƒYúÇähŸ÷§ç‘Ao`JvÏsk:òîsL%4î?Ö~<Ÿp’âÁ¡Ë˜2Úπ€‚À|≥V‰°äÒ9*á8îya#‚öÀL)Â/ìppˆÓéœÔ{˜Ç*∆¯>ˇY≤år“πZ!/ÊI(◊¨Z≠NW_e@Ÿ,®iæÂnb´7û∂‡ºñz|íoX9˙!≈5óÖbQ§¸ti9öjjõb˛ pq˙ˆo˛˝€RspMSBf¸ÅÍÎRà∑„zXoqû∞›0∫ü+‚?≈ÑP}Dx{ï%vüïS2OÔ≥µ‹'„Ìç≠´ÅkaÉ˘˛"¶6Ú˚Áê¢"ó=ﬂ≥õ<ß±ñs˘ç…Tß,ú–+¸{E>ˆÀÖ,ÇêOèàxy4?Ê±ﬁ÷ZHìO‹"c˚N'‚‹›Ö]˙‹PH3ø-ïÂqÿ••<±1◊¸yx5Ä∏‰].#™Kªáπ◊ Ë©<˚Ãª^DKs§Ÿ!—Ãà@jY¨\≤8mÉy©ö‚≤y^UV9Y=‡Pe√íF!Dé;à«Nˇ¬>&Fïe;£ÒtíD‰°CÏ]^ê√≥:u`-ÂâÖZë›Æˆ™l«´≤Ø¶˛ÙúÌu='∑∫™®Aö–!9?K+m´.’sB‚í°pæ"f¥»-»jn}–˘j‹ÇC√k‹ïdQØë∆WfŸë‚Fﬂ'…óº£‹ñ]∏–ì“Ω5©øBâÎ$˛è}kËW{£j«’r¢»WäÙs0ÚB≈_Ï7Ü¸kò\®´‚¿=√¬g«tBY>¢‚«T¨ÌÏ	I±ø__ﬂ`kÎlssì=Ä◊œaxa¨‹	ºÓä˜X‡è=ghyW!ÕçHû2ëw*(.Ç&ËÍb»-˜	 îŒ&}âC.î?Kª?IõØ¨≥,4œGπî¬2P⁄˛ÓõØøf)ﬂòwè›„ÿs«ûcáMáÃÿ¢ö¥°v˚óøci_Õ‹o¡ÎéMˇ≈ØCû˜€3?∞¡_˝~ 
AŒ⁄”Hn6˛Î`ëœflW8∂4mˇ˝€?˚s·Ç^ãJ≠‚€YGó˙©Èît˝Ó»1ûØ«´\ù|U≠»$4mª„éΩÕY5ÌYa”µ2Ïqßm“%òœ¬ß◊ˆYyóìÑÛå‹Â‘Óai[©‹Xﬁ=\fP ŒŸÈÿx∆ñO⁄•ÌH≠»ÚI€˛•ñ?≈›íÂKV¶¨ÛÉkôØ}õ+÷,„•ÿäï¡«ªÀ£Ø∏hø˘ù‰£(KÚ ª;ÎZmO˝±çOç-ˇÊ±‡=4ŒQ˚ƒ]lÿ˛Ì¨´Ò§RÁËì£Îƒ°cnïΩˆG˘*ÜßúG9„¡û¯iÒ√=Ò√‚Är”˛2>∆‡ØÇá¸U‰HÉøälóŸÒô‡æ¿è±<^D>d¶HR_∆Œ>§Œ»ÁLÃŒ∆‰†â$ﬁD=∑ÒíÛ<˘–¬&Ã§=»[≥F‡«< ¢—¬ÁÀﬁ'<Hﬁ”•ŒUP%'
T˝§ñL&äŒf›÷<≈©rrÈπ˘+óÏ$Åhj[!u“1Ø√Àm»ÕÀŒd6Îy<ü´à˝ôÅ~vª˙k>oü∞c‰Öo∑1iÓ†qz≤˜/ãP€Eÿ®≥	Ó®˛Lbh+TÛÁ≤“±ºniÑ›ÉTÑù1›ÁúTr≥S…›»/¡:5#´úæ÷÷ŒŸTPÌ®LÇö—B Ÿ!_F…°ïßƒêû *Íi£ôU≥n&Daú4)@·√˙V!dêC~$–’=óÂ7BÚ:$p‚Â¿˝ÒlpjëAº véJbeƒˇ˙2Ìƒë–ŸÜÆøÒΩ
ÊñW‡≈J ÛíÎ≥äÂ¨y…èK4©¶cFﬂz†·ˆàµÒŸ»=◊Ω=PcÓnfj¿2]’§ü“âØIÿÈa|û[L_óÉ%ÉjbüÚ\xY{/êPüfúW1Û´%$Gvâ÷èïJ& ØÒœ{±Ñ›¡˙ÖxÚ'S‹©ê~>‰dÖø«÷X≠»ÆøD‚o”ßTô˛Ò¥…Ì·¯ﬁ!º8ˇ•«À(,≈–©"@v∫-°¨ÅçÂCÔ>àÛ§èù;#0ñ`„¸q¿∏è-M&x-XQ?Ü˚ø^zôo⁄FÈá~8è≠ê e=tÿ]ıëM˚f“ë(+Rº/rtMZí~∂°NV¡RünñëUq±·ËçæÃi¿·à;ô≤∫À…_›®©"ƒ1éKB±xâßH˝Ph<qC¯Ò©xêqR^íë⁄ç›0®›Tä¶ÈÕÉd4ﬁÂ9†:Î1ÊòjJ€e∞∫∆(@π{µæ2=§ŸpÄ'|†√Û˜/fí±eg˚+Ÿ[˙ÌÚ¿gÅe‹è8w0gJ©mÊruô–√æ◊‰∞©¶ïçç“vèJ√ú≈U[µIπÑ‘Q6•‘œø£¿æüQ/(—ê≤´)%†˛ühKŸ]¬∂~ıœÏ≥vÏz*…c‹X∏±*m˝Ov,>.–R∏—)E§˛â5ÒcˆŸÙ¨H[¡NT/˙õ_bV˚.~~Ê∫Øu,f›Ñ›˚ÕØ/yQh*ïΩ[ä√⁄‚ãB}∑{•≠ÀöÚÛm∆P0h˚{¥œ¯ÁZJ5Ù¬˛˝„_±gtE°GUÕú∞≠ﬂˇ'÷ÿc«Œ¿ùjL1_√∆˛‚◊dIÀ MëU L%eqJTÇØ´pæD≠+Î¨	Œ∞!≈p_T∑¢≈YÜ±ÑîTÛ‰K‡PO∞lâ¯!ØL¥}k¢≤ƒ33Õ®ûg%z6À«F=æîÇRBÎ/D·ª4LøJ zç‚í¨(ß qa%0±˘§s¢”¸s&ÓÉe‰^ÿ›ë_¸ÑåL≈r~ÅÔ_b*‚ãófâTéOC@œ&⁄KÈœåk®v#ﬂ(√gñ∞XÑTõ¿|Ÿî⁄õ•‘V[ﬁâ*c1LFqqè‘öa:Æl(mÛ«6ßúLπèéπz≥ÄI%_◊π˘î-Q6K`h59ukTlÉ˙RåIÄ¡WÌ∫'ﬁ4∏–¿§√◊B¬+âhIƒõ/:Q=ˇHDFlH≈’––Ìö≥IÕÃ(éÿÉb¿Ë¯ÿ∞!ˇå±&‡/\™§‡Y{ü±Hõ‚È’èÃR¿˘ÃΩ4'kb<émwü\´√JT]WEà)ªéè^58[	àO1&&.‚±@ Ïè¯®πQJúHf√ÎñÏòÃo~¬≥À©±‹hUzS,˘ÙD∂(∂‹O)K7ÚŸKP~˘€p¸Eqy>dE…∞‰œ?¬Fó‡2ı∫:û˙˝K2|&{'_BWt/aƒD∑∫ˆÂ—˘LΩÏ–RyU÷ƒS˘„Å”±ÒÛÉÚ¯´»¡Wtﬁ˘SΩß–u¢©bø.FKX X
5K~X^8`˜¿piÈcT∂’â˚É6MÀ∑ÀÀ7%¡v√˙ñœÀ°Û3<˚a_KÖ &¬ÓI„¥µ√yQZ_}ﬂ ∑°rçL «kf‚E+¿J- {QŸ`˝¥µÓ÷#‰dúìLÙâÖ0çi€˘+nQπc´S öÜé‹IEÏ≥>Öÿ1âó¢π4¥∫ïsHæLœ¡è4ô›õ\‡®!µYNå=Û6πºg9¨g˘ºK{£sÀ∂âÇ‚‚Ùãë.EãùDkûl÷,gˆYodK6q°öE˘˛ÛÀ*#≤ıWÜ%ì∑Âà)ËW÷Ç—Ù:TÔûÌN¡ATp.œYˆYæ'„ÑÀ|<:
…«lﬁO_∏+åJ¢Ñü‰Òb´xöƒ(¸*€;'N	{∞"GN\3#‚¡‚Óyô“:≈≈–_– aHØ"À+
-=ßF£à”,â¨¿ÔA˙·ÎInn Vó.†`)2yàSFö4Vìµcè1OË9iÎx∏ç\Ùmt_‹Ù‡ãÃ Õ∑
[ﬂb˚{_¥Xª’|~Ç5õœwˆNŸÈIcoø*Ã¬≠π@¡”Ö™-†Í3"WeOA*ÕıiÜu‹Ù∂ËoœΩÍ¬üÄa‘È„7Y%ŸCDŸ∆Ãà≤‘êl•4;ô-¯f‰(¨1÷Ü«µÜb{Stv•ub[É
¢®p’N˘È°<RCñ‡Å‚^÷ä™>∏y
ü¡ˇ¨3<£≥x±?^íT¿ÅxêÇq~v•—¢4Cy! a¡∫%&Óºir|$5æm[J©€ÛÖBıfÕe≥õ98¥yKŸ∂MZÍM#¸q9ödìc(eû’∆»f4∑F9Ùó¥=≈Ú‡≈9µ?‹∫®l÷#Bö—Á’ÏúÉ¥'u¿õd=◊ªöq»ÂœÁÙål¶ƒàÀ¬rÃÖ±wï&ŸúO=Á`?%Ûê'“8∂i ^,qÈ´ˆiÎ 4"˝¶&v∞7⁄≠“∂¸k¶f¿Á-m√?¨¨‡ÿMÛ•b%l x,Ò◊lÕ%Y†°‡oì¶¬¸≠.ï∂Ab†^7—è∏ÀÑ?ˇ¨ãÑAD÷†x7õê>;¢¡ˇÕœô⁄aÍÕoôx7SK≤¶ÄHZîo'·yAÊ…Äy†Û'æ;≥M´'Ï⁄M[(ë´¯˘è:}ÀÉÚd:9Ø<\y≈ÓÉÎ◊qª6®å¶;ªX<†¸'Ì£√™OMÄ…[ñ>É·ÅÌÖ9Ç+¨ûœÑ* ’Ó≈ÅÏp˙¿¡{t¶ËW¡œÇı‘êã\^≤Ú#m—∂™∏⁄'–UNª\Í{ˆyiEÇ˘öì_BìØêr´"á¢BÍ©ÚÒı“è‹ãÚÚMÔö_È xt‰T≠1&Õ6˚Œ†[év•hœ…MÕcN¸ ≥áÓ;ˇgQ2OÂ‘—b«°ø•sAÑˆ)≥/«Æ7·¡Xî,0¯œQ'"√∞M@WC Œú∏Í‚A¶Èôıi@Ru6@iû∆o—à2ö>§ﬂ}ÛÎøœT]L˙æ™ÆH*à®ˇÚÂﬁqzp#≥
O•°∞–x
?u	ﬁ˛®tˆÁ^â‰ÓXb˝D«√*&tSç≤FDuLKñMŒÛ9xÎ¨ì®2yµBYG˛ƒé∑àø,/W'Ó^˚àÎ∂ÚÚä ãé≠»ép∂"kZÛ≠ûM˘ì¯Ù úŒ Ù´œSøèˆ(@VqFö£îAsv•ÊÂÄ÷X
˘Ç#ÉC¨|Œ‡Ï6
) }âóî∏tΩñZ˘Â=\˚œpö0t„√¢ˇØˇ◊h—ÎØò´D∆èN)ñ√£H¢pÔè˛Cù≥ã zΩ¥}*Uä	∫R€äå@Ã÷Ãê¢=¥<}_e\7Õ‹≠è(õ2ù ◊L™∏’ãJ˝aie}ﬂ~cÚ[|®S…_&ÌÛ‰BØÀE|^œå0,	Ø@;Cõœ#√õZìNﬂˆE@Ûâ	Ù	ÓPªÏá˚ÓÖDÑÄ%¥ΩÑädﬁ7◊‚7»?Lé<∏\M`S„{JEzË1vß£~π∂‡-€¢>;SÇ,…€)U‹ïÎÚo%Ä%—yΩw/Òº·Gf-#Ëƒ¿äî"*:`ˇk&6\ﬂ„¸c~y!ñ≥¥«÷Ë…ıf#∏VO‰% ∂∆ú	X_ùÚ∑nv(}∫°ŸKÓõÒyë~ÚÀ¿Äˆƒ‚ˆ´`G‚it»Ré"xph“E?ù⁄^fuÂ·MKŒ†&@©«¶ÍKLp  :-®¨‡r‹CaÈ&9.ï¿T_&]Ä¯YºLöÈ∆k∆Pˆ8ËoÀπH¬–7‚ê SÑxÖóœ∞ñ·ˆµñs»M≤}cÅéÉ Ø_…íØµ–WÀ2∆¿Ì¬æ, çJ(ﬂ%~v∞Ñ©Hπ⁄xi⁄®-+kÿn"^jéªÀCyˇ†∂†RÒ.yw˛˘‹7<JqsÈgE›'ˆ'B82g?¬z˜¢'‡ÓÉÁÙEºMˆF|Qp$ñ"A•®ç•ÛYL1p7ØnÃ!‚◊ÍXò‚Ê
emÃ±ä’Åy®\+&‹\Z#Ä∂ÃJ¨£‹[ ¬æ˛ΩK>h#ö¶åÃ˚ò≥	íä“—aß¸|ZS±!C\-_≠ˆ–ˆ¨A7XÆÚ˝√`ΩqÄÈÃ7¶≤Â‚ÆgÉi®!Ëçr?z?ÁÕÇpøüÎ·ŸdpGÒVπß¯§‡]”Ø“l’‚€Ù¿¢Ú§™ÚΩ5’d∆Ê*_∑°òePÊBuÀo¨[Ë+c‡∆k¥Nv[áÕØ7g⁄ÏËã÷……ﬁN´z0H3ˆ<ßÀå«˘ï56ÏnÖoÎ§ö,!ÿ“≥Gù+B„‚—ÿÏ~ˇÃEÆï&˛Ûv´… ¶oX9h3=;jùqíb%ËjF/◊@ûô4zπ"<rπ’ƒÛ»ˆπañº˙PâèÈ9˜Bó:êí£ÄH¨úî°Â«´˝çúö &7ÙÂq˜d∂„ªTFöN±Œ=w»F‡»)i±Ì#±~ˆ—Ä·≤8Rä¯˙Lı«38˛ä@ŸkçzVÒ9!≤ôé<ß3Ò9ì›õ,Oí˛Òö¬Â0oﬁ_âùÄ˜å	.Öe1è»tóJ”â∫€UFı3ŸEæõ¿2≈µ-ŒGàŸFÓt"Œ€–˝ÁG‰∂ó)æt Ê¯ß„≥1F;3ßv\åõÀ#/uà‰å◊Û))”uäïöºëöΩ_˚»®…ìÕBıœCç[fVáQ§Åü4ôX–rõïΩ>pª∂ÍmØ•üV*ê≤±;∏^±±ÛÏ?#ªÔZ◊SJµhÓ6v[;lïÌµè¿Uyw›ØŸŒ^[~]¶àBk9á¿◊ÃTÃßà7:£l/LÿV$FÅƒx‚GiCô8TÄÍÀA”¡GÉÏLFv˙Sc˚GÕœwéæ<ƒi=nú6?Éi}˙;:nù4NèN>¢yDŒÅéÓY∑›˝Ïhﬁ—¥Ö‹t’¯Õ$Xè∑fZÊW“„ÖMxü2	BIy¥-¬ü å\“ˆ©öüıëµö≤PUrΩ`#‚Z>∆s≤œr™”¸>m±°3É.äåVÍu	∆”£î —+Ë√Lû!Ù>88Cçf!∞⁄‡˛˘Óìy°L}’hﬂºëA'˘˝)œ√ƒ§Yı≥ëT©Z9BÎ.?LcvÁ*›H Ç-"ó3>b≤+˜…ﬂ2Ø»Â≠”Ì;éo£gá{5n¥÷[¸ãoé/“∑A˝>RÊ „mç„=ˆπ}≈é]ÿ+`ç˝0P˝ŸHa'/È|~¿Ó&Jƒmè¥Ô=k8˛fÁÅ7‡Å¬∑Ômù›8(å¡Gãã$Ùznèà‰∆'G•ÉõO¿{˜Æ¶ë√pK.Á©ã‹„,⁄c`¸$∑ºVzí·ÃÛ®-¥l<ÇÜΩÆ˚/hAÙé 	õÉqØí™ËÑ)A¨Ãa'Ëk“!¸ÆÎˆê-‘F#ï 2yï}{–V0_ÓâÑN€ƒrFp{Ù∆Ò‹ ïøxoRı  }°7ô∑Ùç<æIU¶c‰[	ÑÉ5á˛=4éöéÃ·‹4}|rÅï*oÈ5VÚ]ﬂ¢Nµ¡a?ÿ⁄mÏÓ˝$Ô«ü∑æ2ç ßº©∆å¯ˆ/	Íç§≥ç“yÑ“Y˛ÃÈÇú/z‰y⁄¸v©›ﬁˇqÎ∞yÚ’1Oãª≠A˙¨Q©o>`ß˚mQ∞ÌÉ<ZhÏ∂N~||tr:ﬂË(vBlpû¬WlΩ_Ïçz∞I-S£±…7Ê7}ïvòìz±z·„’!®˙@yG˜Y4F+Ûºî<?%¯;8⁄iÄ§ñ€ßœwhiïù∂‡(ü∞ÊI´q⁄bœéN⁄jmòπ∫@&≥Ú<kXÎJjdt¥äY}ÌÉY»Ô#ßTâ≈@ÂŒ6J-‹Œ’j´jdu=wå≈an6≤\H‚-rD¸¨¢ _“≥r}b…·&|∆f:¥.+ïaW&π˚>iÿÿ2÷õÍ¢é"z˙Á
#°#“≠ÍEl?#¢
<’ò∞C˚"ò—s‚<HÁ®»1Ô$‚
ágÇQ€“vX®k›ûgç˚N˛i¿ç\"Z  û†Pä≠õ∫Eh1iƒ"Ñ∂ãà•®◊òÙ„O«'ÖªˆäÌ≥ñLYÒá,úTP§´ƒΩ§f©zÒ0OrÄø˝õˇòx4w:Õûåı“‡—€T Ô…uFw`7)ÂS<w´Vã €C{?HœKï9SNïÃ2∫™°®êﬁƒÿÔ€=–:ƒ@ãÕiÎÂÍ	A≤i@<˚ßS<ÇîØ"º D≤ÔXC÷@é#?=v÷‡”@ex±4gZ0BSxW˘i¨ˆ.ØÒiVy7µ⁄nÓ1T(¡FD%Fcƒ(j…ëJD“Ω÷|4§\ã± -Zf€¸tG(9<Îe’fœboHó®fÃ§«∑å©^âW„"e˘li4ı¿„ΩZb?gKc6YÒ∑o√ª¯Nßé‘˙"
2d“ƒ˚ ¨%h˜S∂Ù˘+7êmΩ≤±å…‡™‡éü
3∂NK˛˜ZM{Ûº%D#G7ZaD€ºÌÈç.œDu_‰2K”(À6Jæ ∆¥¥}»ˇ«Ÿ‰±6ƒàó∂è˘≥¥»π˛¸OÉvÙ%™u¡¨wªæyŸíciÕd¨Ï‘uõXpW&ßK∫^ â÷≈Ωo7b}òWzø≈='˝‹LÎFÂÚ‹YÆìπ∫©W÷óQ–ìüÊÒïƒé(∞“v‰m—¶Í‚∑ïMlJ}õ≥3*º/3Jr◊»†¢eÔdñePÏ\•mÒGAÒ‡ø™Àü◊g˙˘∫¸˘˙L?ﬂê?ﬂòÈÁõÚÁõÛ…Ûù®æQ}$ßÎ—L≥ΩVDΩ6[·Zôm±¨´e-gπdJ\rˆ“#ﬂ'&p]N\wàGß8vYLgg“Õn§_òæÜÈôE=¢ºÖ¨6iæûﬂñ√ù68)'ıÔßÈ¸‘Ó[o◊≥àFè`RuåœD˚' ^ê<DMHÑÂJ˘]∆ÃcÎ≤c∏•Ì‡œBÆﬁÆÎvAΩ¬øÖ~vh€]üÌ«û˚Üú'Y„ÕÂ*¶~˚7éË Ü{0òC«bM2–uæS D⁄•√"iw´Îõ±Y¬)^èÚe!¸çóU¡â.¿G’Õ`¯‰Õ†ËX ‡~˜Õ/˛*è/—aµ+
ŸóÉ;ˆ0∫?\Nô]pVªé”W±√˚@~ˆ^w!°”hìsQ3ÿKs÷ÌÈ∫FNb–…PΩI]—’U⁄ÆTêóBô∂U¢%«‘BT*Y´ÎZ‘4K]…íÜ¶É„⁄Q›H1∂<QÌ£Nıå◊T¸˘œY7^«Ö¿ÓÚíãÀI˘°ª yD'´P¶|f‚jËSÉê"z≥-xûÜGﬁ≥T⁄ƒghôîc±D’ΩÕÙ4qz˝	ë•oØ|¢xõâ¢s>xÌ„'Cë∑‚‹ûÉ<{b~™Ï¥o;¡é±‰5’m g~Ñ†©±ÂÒ‚º¿\÷qágf¡t`ªMÇìÙgp)zÛƒÓ	t54a'Ù´â`S~ h†7UÙ"?<[Wb:∑C≠∂˙0/M&∑¸b©î–òÒ„ÕáµM©.É⁄±—@McM¯ÛÕbOáö0Ú¬PpÍj/X€ π{Ë D÷“h”‘ánÛ∂⁄l∏®Mïmiì˝´z•ÕπΩÒŸu}hºÁêe∞YœÂ»◊¡‚Æ◊Í5Ël}çïIJÎµ¢ë…˙µ≤Ü≠‘e+kÖ[©S+ule]∂R/‹ :µ≤é≠l»V
ámÎ‘ ∂≤)[)±≠oR+õÿ ŸJ^∞6Ÿ jÂ∂ÚâlÂ¡!_-ÍÈ≠´èÁ#ÁßS[ÏŸ™#≥úè å¶»≥£ÀüQ£◊Ø”âª≈>æñe\´û›ùvÏryh]ÇÇ 5r`M˙`m\Úœ©ı≤	{Àﬂß]myÖ¡ÓS[f˜Ÿö>MCßﬂ¬÷®‡¬F?\Ga›åSÛí ﬂÜ	±-ù*“v®Êgo‡û¡ª´ÙñR34ƒ4`¢tE«™*–]ôôπ|¶ﬂÔu[mj˝Ááq¶Yöqèëc∫C_D≠e“Y<\Ï¿	¥1ë:#önçÖ–l	A‚$*1€å˜MbÀ4br˝
ñxƒ´¿[⁄=,›|úai–E†w·"X7˚Œõ‹¬&œÔLû,√ÖÇr.cy≥O„'mëo∑Xy·⁄hyπ:∂∫mXˇìÚ˙
+’JÀ:•ü(„˝Bë±(˛ÏÚÒ%‡b¨G·ÑáB¶îŒJÌ(?\«“	‡¡NO·Eû˙°a¥VvÖç'†Ö∂úD’&!#≈–ÇcóeÊ¯ÍÓ\<Zs˙î8:!ò7HúÆçR2•‘r8üV*Á8Q»¿Ù•7 5ÁBU≤†}∫ûWc?‘@¸fÿ›√ø˜g∆ßa3Ø3…dkh9ÉÃ=Õ¿Pµ±ùeì)õ1ÈÏân˝±}iaÌÖj«’ñSÀNz™ÖYüJõÔ…a∑≤œ‰	k1ìñ≈.‘—«}ËÔºrßWà≈ƒÓ˛+onn.≥⁄8Ì3»=ÕÇÂç⁄¸æÀ€÷	$QáÛãπ∏^¶ÊÅjS*Ú)ZfN∫(TL(öï„%Ú
¢±H/äÎ˘π’A“&ßI¸)¨¡}L'Ö–FO|ê;®>•l§™÷≈ÜF…›ãSY®„Bfx}I·gÛã„•œíYC'vVçÒò§ÊØ¨bK$U+*˘ë∑À—¨¥≥*{:º˙≥7§¢M©Èix°¯˛{ûûÜ◊¶Áß≈úºº_yÒ®ˆ¶OãNÈê ©R4w˙>ÛÎJzB—,IlŸÜ?cE∂Ê¿ùv£˚gW˙ßQ“¥S†√ù˙Ï§$ådO»ˇH{‚3KbùJ-&£‚n¡Ò†›Ì°åy.zÛëá‡:Ueı§Ú"Fò ËÖÃx¯T∞Mêè}ŒœÆ¸â7%zÑTÊâEd„Ö´÷≤Òî§Ôwêéó‡lx.¬+^à)ô~ﬂﬁpÅÆ…5Ã5˛ôõçóE˘úÜ7—@S†1¶éHΩ’Ãú?}C°çêè,Ôà•ÌÔæ˘’o≈!*1>Óç∏T"ÚNªÆRÈQé-Ÿóÿ¿Ò'X˙\Æû‰Í≥2ûqlÄƒ`xŒn/”Y∫¬0‚ÙF>•0Ÿù)'âÆ£mÿU"´ƒc˚Æç?¢h4øàóP«i«'È`xö™ÁMqUÀ≠K\e<¬Í©Vyß©/Å8&”Åï§±N•ä—Ì+ßãTW#∆≈µG9wU±ó–t¡—Uª.Ω!Ÿ›√’ìˆÀ‚ôïÎÃg‚/ø|¡É}tÊ•~ºKA}	.‘Ú˙˝‡äí!(∑ÿ±ªxˆqÏ°®j6ºÂ∑ˆ;&ÛÆ÷*Î£KxÃÍÒYF<≤jk+¨Váˇ÷A˜lg˙§tWô©µ˙féªn¿7·øﬂ'+Ëue‹˛Ä}∂¡äÒ•»%x>ÑÍY∞˚Ò÷Ã√ÑOcø,ß§iÓRVÊI{È=ö!IK€ª÷≈î"¬ÎX†(A]ÔÊùÅGõ9ió∂O¶£üÄ5‘∂Ügn––I;≥°-˘0Å…aGÁ¨5ö`Ÿ¿≈à©hw9?5´ˇ3‘s 5F”¯r73’dBjbmÂAk2Å5±∂Ú 6ôöX[y0õLêM¨≠<∞M&‘&÷Vn~d‡&÷V6f!ËÛúmq˝}›»fÍö˝ë¡öBd(ã«‡itî –¶ñ8r9µ]V˚˝Ó8n≈d∏„;x|$HY\±UΩHöÉ≥®l9[ä/#”‰˝ÕÕ˝aS§äÿbXÓDÏé©‡=b*∏«;6Ç4©“>ﬂ3õ°-√‰ë Ó\Y	 Ô˛üå°‡„ÛGü)é˛¸›«Rä†]pˇ¿M≠AxV"ŒP’À\/<	j•¶~ò„fø-“J<*ê–lÀg˚¸ºñ†Çc'}Æ46fy∂ï2"û{·?πﬁHÅÑ“ΩMSßüFf"s	ÌΩ?X´˝®q6=≥^[{j.}ÙØ¨´ëu∆ûÉçFÔüZ~ﬂÒÿﬁôgıùT<„≠	Û¶Nòµ,·…jçı+ıá3SY"tE¢xÍ8TNZôí¯V'`ﬂñó”´ÄjAÍ9u3˜[@ê8+üˆË\"™Ïn4£Ñä|VN<π?8ìÚ“üéññeˆ˘%v$∆dπ:∞GΩIˇ&ÉÂ>Â44QJ·r 2v88f£ñ8æ◊¢ÉRƒ
Ê·q&F˛∂∞ë>)rê?ò;_∆„ÌÊt/ÎQ≥éÃ¨`OX"Ÿ"fÉjÉOº)ËàÕ˛â‹OS7D⁄Vo!&ª{A X–G•√˜iº≤‡pö‡¯Â–Ö&^}ú<ﬁ˚8Â(Â„Î`†√\¢Xè¢π<Kµ•ÂõW∫Ò∫ñZä!ıƒêÄ%Éu2rì”∆ûÊ,ní™/(¢≤Ç>Í‰MG¯ËÏ¢R_ÖÛÖVàÒM~›ÅtîuòçÊ©B”qOJÑ˙ï1®ëQ‰é|:∑ÿ\«fxñ'ãTõ‹LTõLvKÕ√R˚"Ï00<	±ŒÌef9]§yÓ$≠Xf8¨çÀ!æ÷7k¿È£óçû6(i©ÉÕ%á6%Äü∂’’ì Îı[XVóƒΩ¶y
…	ﬂq|?‰Í∫	{J,ûm¸ªéèµ·ªOÆ?J7¥íCLôÂ_ç:L?q¢˙(Y˝OX·˝;mÈ8Áåvt_ò:ÚÑèÔ iø–ˆÀ∑`ÿCﬂ£MZ€cázeÀ¥KÇæ_ºÑÓøxô÷ÿ¿û»˙†M,>÷ozÆiÔ–è‡èô:ˆ…˝˚ÀãJé1ı'⁄†øp^ä	NWç¬ıa•qõ,0P“ù’‰¸∂ùhˇE‘¢›Ö}b^≥'Ú§ÊFOFˇúëÉÈ≠àÜÜ5[|ÈáQ:≥∏Ù|Bv‡N@⁄Øùâ€£éÉdù14|ŸôN¸Â“+Ìç&ûã´£[Z—5⁄v;8≠ÌæÖC¿ÓQuBp©Pìö∂¡•yä>XO–∆1÷?˜∏ˇ‘9E⁄j]é±¬¬[õÓp6@G2:}ÀÜ]ô6∂Æú=‚œuj˘Ø±…1,£d“M∂≈Æo~î^/2¡$©iì˚ëÈ‰¢Œ≤)Ú‰C◊÷Ù÷q`“mºhS?ä£ﬁ¿Ò˚lﬂı¶VœŒiR» h«Œπ=ïr¡Ÿix~iÊ–•}óØ§é≠+LèÄÒ‘çØ7¢Ë4]áEUÖÿºËÆD…1§ª: ∆™*˙H˜35ç˙Uê‡Îûáaa Ÿ~ï˝{ëÊ˙äø´F~[ù∏˚ÓÖÌ5¡è,/√I!±ÚÍü˙˜W{†Ã@ó©ôª9w	é•˚ııVÖO˚Î˘¿uΩ2˙‚%?ù€u1*ÙG¥∑“kYwÉ8È“v.!8Ü‰A˜≥(ÕLDmÎ¢Po%ˆ›ØÜÅ‚ﬁJÍÚL!
¿uÉÓ‚ iøF)1‚3¸fm‚ÓµèƒŒ¥,M¥”•Âµóπça’Û)t°ƒk	j5§–1∫[±›T+<ªg+£Ê}œF∫Ç-Vvÿ≤:7±¿˙Å5∞KXƒ¸®:¯S+`ªgp]Ω∂ˆ∞R€¨¨mjÅäŸ„ñ°NÎ”ê€ëp»po»€ ∂¬>∑F.;5≥¬⁄ÓkÿV©gÓx\0]	ø·EsVòä·~£Ô÷,êÓ.÷váfèÓÎ“ïo¥ì	{Ë®ãü˚nûÓÖˆN◊¨[Dx–Ç„“Å‡d∫e∫ìWΩ§u@®áNáW˘Çj/Á\õ…Jﬂ;
lòüÏ8¢G˚≤ua9vnO:˝Ú“™5vV•±¥í!»C{“wª†óéè⁄ßK˙πÓ€¶Ú¿ö`KMpV°· )8{KSk£œçò’ü¯ÓhI?Â0Pn˜jã˝I˚Ë∞Í”ÏÅ€_éÓäÈÏ§»–≈‰–S√$:˜µŒEá$…
∆Ñ]÷9‘xÃ™éß~øåÕd¸HuÉÓﬂ◊]ó.ï77ûeMΩõõÌy∞IΩj·ˇDO—åo¥LCL˘4Ì3ç{Òˆ∂—9NÔ0ÜUƒï¡¸}ÉNÏãjµäS⁄K|ê_j˙J¸ïWm~_<†∫
&üZÈœ3q´Cı$oÇÙ4è~|ÙJs/ÛXê∏:~îfà¡µÍÅ≥Ê7ÃÜk∆ñ…“3∞ñ0ìÃ„¡Ç ;ÿx`ÙÓq~%´sÀ≤Áoú…UUs€‚A/5i9{©eÅ„ŸÛ—Ãyìƒ˘ –%√I[ÓÿÍ¿S`ú1¯L¸f‰N*
æH∫@…XXÎÌHû1åß81ªöÁîLFO¸∏rÀLu’~êë§_Ø≤£—ôF7;µ≠NLW>V~ˇNÚÛÔ ≈jÀ≈ ˘{fu¶É…;∞9Äg1≈bîhÀ¸±çN±Û3ò]zˆ–<Cù√ñ˙mîãb¯É++û{ëÂbSD]Uèï¬˚û‘è%¶π?±F6€qST!´íòóYÍ«*?}_Í«ﬁå5Sä6±Ωùπ`íÙsÊƒà?È∫ˆsÌ[µª”<BDUZm=€\aÅµã±Ã-Tf"≈≤§◊À¯Æ%›j´3·Ñtã ÌÍIÈ“9Á>y†„úKó∂±ûkÆ∞¥çãqÃ}¯“ˆΩR¢‡¬ûü≥&ºÔπ‡'≠≤w0’mU÷<hpA¢ÜMΩ€Bb≈,ΩP—º9ı ∏Qi˚T¸≈hea¬T¬Ü·›ç≠ë’ï…ÇøÛ*ò˛ÆK¸Fw»û˚0ï{;aq/=.}Å ûl·÷¡q•^Ø≠QˆSËnz=∞ñ oÏN›†ÍæAAV,:5e Ë¿y°⁄ﬁQ\jA2iÛNˇóH≠ÆäÒí[¯™åR‹à`qzúœ-@4Ω-∆¬µæ'’ø˝Ÿß©Ì´ê9µ˝	rãc©çU÷∫D∞é5`çi◊…iÎ€Lˆ¯<ÜÏNE4üq∞¡≠%¸¡¥>)i6è°u	ﬂÈ“Nì[—√Õ?,‰rÿëé:vª„zÛ>bÕnILe,Îá∑C•Ÿ·u ÕæÙ‹›™ÿà”ÚF∆)≥aÂNRYµãÆ≈≠FÖZ‰]}ÈzØ	ﬁ’¥∆¨|`]≤Á∞L˝’/m˚uñïóΩ0Õäqe-Œ¥XﬂÃßôW 8=LAéy˝⁄ì_s≈´jmf/9ö˜,πlÊ˘rõ.ÂãﬁEÇ:õt0dwŸNxÊì%´ÒÉB<!ì…˙¬Q/∏ËJH ≤¢íBΩ§l∫á	d$ZÒQ†T+∏¯&—ôhΩ/—3J¿“%K•ù©Dnôπ>˘ãØRêˆŒÎ3˜R∑∫¯ãÆ¬Ñàÿ*#Pg’u”ÆÌ˝înó1cWpg/Á˜WŸªƒGzhiñuﬁmC\˚¯
ÛPßMÕ(àæq"∫∑L-p(N9W¯"ÖHﬁì∫G`g©)q|?¿ß‡∞flWá’R_˙FÛ≠«4âÔ≥ß]ëxôp—xA™ër∞]@çÒW™2ìØD÷\«;:W.m”≤ÃœiÀP2ÈE¢˘œtΩÖ’Ï≠öjòT≥∑≈Ÿ˚ƒ±}iw8¥ÇÍ—›˘-Ñ¨j4I‡©É5ÆØVX≥Å.+Ï∏Â#Pøêi Qïπ0!⁄Ïª)∫˘>oKZõÇ÷:0ﬁµ†ú€l>^aí0™êê
≤ÓÀh§’Ô©à}úNΩïÇ¥≤–÷O˙∆¸„z-≠8}‹ƒ/∆TÏú†À8uUP	ÑfÍ©≈™rÓp‡"Ábj¡É–Ô/…Y⁄>Ì;æÃ#`NÎ’ô%¨ú]Hq‡ù(ÚJBÆDIÏåø¬gV‡ã±uÖiÃ¬x|"ÈEÖü◊A@où0e]˛DÎ„ü©ıFÙŸﬂ9aÎúXÖ®Pn£4V¿Ï*çï2eÔ=¨≈ï√ä!#çGc—ï∞÷´L„Ò∏yÎ“ô∞{åg%#©∏[˙^œøΩwèŸÚÕ;≈„ŒW/kΩ >6.#|nt∂í=\÷‡Ê’±‡«ò√Ê`Àƒ≠xTPF¥áÌÚø¶h®÷œR"È€VªÔÿÉnÒ˝)5¥≤KgQ1›ë=ê2yœéƒÂTàÁBkg—x©(„îûÒΩU‹πYZî˙üAÖÚÂ°eÓd|•px¶˛AãXŒ‡â.Íå<∏æ{àÚñBaÇëÇHhAπf¶#°aU>¡zòØ3"∂f∂W˚ˇ  ˇˇ é˛∫ßxú‰ZOoπøÁSºk9X˝uî8Æ≠@+€ÅÅƒkX6zË05CIl8√)…±¨z}ÎΩóˆRÿEoΩ˜–^˚QÚ⁄è–GŒå4#q,97»VÀ√·êÔÔÔ˝¯F ÊÛ˛/zÖœ~ck-¬Óì‚®œÆªOäc8'JùíÄT¢⁄sPÒhmV{öﬁË⁄çJæ'ö÷^4;ïÓÚvKã«È‰NÜB˙T¶_Èp«•àCü˙µˆá∑ 6mØ¨éÎ„Õ0ø¡HÑ∫6‹œKˆ¨âªq·ΩKı2∫˘5ƒQD•G-â˜éÖ„⁄î°$ïn?ñíÜŒÈò)-gpH5a\Ì7Ãn!ñîKÊÉ˘SÛWµ6åIÑSì9¥Hñpç;4\£W•{|˘Êúˆﬁï…ªπ·võÕJ˜ñﬁ0˝V¯Ñ_P‚M®¨á¯ƒ]˘Íi4=ÆñÁﬂæ9ÇÙÉì◊ßoèN/M[)8ÖÔøá≠c‚≈\œ∂>µÍÉãﬁÒ1ú>\„@Ñ"ØÒs\n
óÓÃˇ‘ ˆ/œœ—ªÄJ_\¢ÚÌ’¬À,‰,§µd˘Ë≥1ö’öıN6Èñ≠fRà˙Ú÷π!@u≈`J+.=O≥k∫µÛ+(Y	‡l!:“ÄJ¬}ÉèV§Ï˙E3Ã˘Pª”ºgπΩáwAe¿BtÇøµF>)ùg/ríŸk+â)ú!âµ>	Y`<≈\—ÚˆÏBípºÿ#Ω|—Èdª§#F}ÁRwWwÓ XUì‹πÉÎ°Y‡v’Ÿ’˙ëºù.xªK©‘j%¿A9ı4\9¶âÍFm~`m€Ijõª¶%L√iN=ã∞*Œ"ÏsÊΩ;∏≠båv°,’GK>≠ﬁBΩ^_ˆÙ◊ê∏zoëäw€øpê;Ú»°Ê)8dtŸ à”˚«ò¶Å™y»$p÷ob•Ÿhñ]f.n%JG1_B≈å;jÑsb©Ñ¨EÇŸªÖ>ÑvWA®ÉC“pßvÚ5ßfIvöOíË”	Z&‚ö Ω</\™O~ÿnvJìﬁ1˛ê"4D¿ØtˇÛ√˝)L")!ïnbË˚P#„·üSÊ‚Íe≈œ&} ≤«&L^„5YìÆN°pÌŒO:ã VLô¨û}æÛ„«»òÖ•nYìcWˇIÛP:Ÿ…—…›—Kπf1[é˘ŸÊ ˇ˛1ren‡MReıŒ∆ÃÙ∂Z -V–q€–ç˚ßÁ‚b{æ˙
™k˘Ê<hÎ´Õ%;üì!Â+ÊNOr≈SJY«'• πÉ∞”9Áî(‚4âv)”ì(Ã{®€u-.ÕÜ}‹∞∫}WYåW∫OÔÛ•’“yÀ¨B$%Në•ò™É€7∂DM;A}©<®"Í!VÄçò«ôh[•ıqÆèC‹fÜ√öI$y°˛Ü“Ëéè Ò—Ø¶WFÎÅH
-Ã˘¿Ã!!ŒÒD®g>1@ÉhπÌ·k¬cÑ∫„ˆ'¶P¶n0‹∂‰¨ÜPng"ñSÊÌ¸N{@Î⁄ûòÍV<ÑuX]ô÷F1ÇÈ∫ng;◊Ì‰c¿ÉTΩSÏ¨⁄xiO‘÷ãÄ≠¸≈#E¨mã#!MBY!∞'ˇ‘gq‡6π§øç—£æ„fcCÏ@{¨o˚í`àzØ"F<GÌw˝SŸr©ü#ô˚ÁrJ|´=Â‰Ü˙9}ÌÓGnTµ’≥P4Õy∂ÂÜõûÔˇœˇ„iÆ∫⁄/…4<\èF`¢Œ0Ωºékåã ˚»çhù‰π„|ﬁ&ªY/ı¥K¸V	}XÄ±	z≥vƒ8U0e&v©…uÇÚ‚}ä¥ÄÚ∞Ω∑1b<-àÙ&òÚ ¬‚!@HÊ!|êÿG’”‡2p°Ï¶…É‡”H È@?˙cCg(‚É«8K‡ŒP4ö|*>¿©πL·lÉ∞
^ﬂƒÑõı\l dÑiHıî“∞ëÆ=À¢V/ÛÜ¶+ÊJ˘Ë:6∫e#®¢ŸFL’´˜˛£˙Á''˝ﬁËı/Næ=Ö_ˆŒOON_~ˆ$ÖôàA≈È?SÇˆ’¢ÃÿË_kf,èkfuÑëÅu˙+∏0√√YÑF£¶Ã°C	Œ≥¿2˛QdDıÃ‡ΩñX ÍWXËÀ8$Ç¨œÈ°›3ÉeG∫Ñ1[.>òà©Mµ9æWGÑ+zﬂ3+• D¨.£ÂéQ'U/Çù%’±oëÊtµuZhøõ∂ÙéiK∑r0àU°¿gÓ#ÎÆH“LsÈXHè¶Æ≥y≈X–ÚÆ_}ÿÖ!gˆ±≥≈cé,=°9S.˘õO‹B|Ù0ZÀÊT°Ö1±tj1’±û5çEñEŒ39Ì|˘Ã≈
R1!’·‚&æ}§pî?ËåÒ?rù¡¿G>¢|±}U«ÇTÔÅ: ¬©‘’ ReÚ5“DZö1mS@SI<ªvΩR~Ü∂ÈXÜe˜WYˆi4†EàÙ…	(rMø(y¿wç''ﬂÖp“f∏ª¢ÌKÍgiíÆU™[π‰îÜƒº’p¯Mô»Fùt≥ƒI*∑Áß√Ä,ÆÊ?+»»Mf]{U f{ŸÎ‹≈®˚Âm:+ø;¨¨?kXË≥±∞h6ÈÿãmíJ°>uVPFMà/¶µ¿ˇàxsi5]¸¸"±ƒ„Ù8V«ñ-\.N:∑çßp,Ñ!ÜÉôBûˆàÆ‡i#≥ˇ˛(π_¥|bU7è4ÿô_◊†©üªtÀMç≈+Û≈ã˝b+P{ˆ)¶˜€Âœ~‘˝◊ﬂ†›l?áûG|,2ùü’°œEÏ/‹r&§ﬁÉù& ê‚÷X‚‚ı«≈Npó±Dqº¶¶O Ê†◊Sä
©a@Â5Û“#ƒ@«æaMûÃ©|IFD§Y¿~órÎÔ7ßú˚
S„Ó…  ˇˇ ˜(3M