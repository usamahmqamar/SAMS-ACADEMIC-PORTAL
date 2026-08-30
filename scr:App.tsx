import React, { useState, useEffect, useMemo } from 'react';
import { 
  School, 
  CreditCard,
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
  UserCheck, 
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
import StudentBulkImportModal from './components/StudentBulkImportModal';
import ResultsManagementModule from './components/ResultsManagementModule';
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

interface FamilyAccount {
  id: string;
  familyName: string;
  primaryParentName: string;
  primaryParentEmail: string;
  primaryParentPhone: string;
  memberCount?: number;
  childrenNames?: string;
  totalBilled?: number;
  totalOutstanding?: number;
  totalPaid?: number;
  students?: Array<{ id: string; name: string; grade: string; branch: string; enrollmentNo?: string; classSection?: string }>;
  createdAt?: string;
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
  interviewScorecard?: {
    parentPunctuality: number;
    parentEngagement: number;
    studentResponsiveness: number;
    academicReadiness: number;
    totalScore: number;
  };
  familyAccountId?: string;
  familyHeadName?: string;
  isExistingFamily?: boolean;

  // Chairman approval details
  chairmanNotes?: string;
  allocatedSection?: string;
  chairmanApprovedDate?: string;
  feeTemplateId?: string;
  autoClassFee?: number;
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
  const currencySymbol = '₦';

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

  const [resultsSubTab, setResultsSubTab] = useState<'entry' | 'cards' | 'analysis'>('entry');
  const [classesSubTab, setClassesSubTab] = useState<'classes' | 'subjects' | 'curriculum_checklists' | 'lesson_plans' | 'teaching_records'>('classes');

  const [attendanceDeskTab, setAttendanceDeskTab] = useState<'student_daily' | 'staff_matrix'>('student_daily');

  const handleSubmenuSelect = (subId: string) => {
    // 1. Staff & HR
    if (subId === 'staff_directory') {
      setHrSubTab('personnel');
    } else if (subId === 'staff_payroll') {
      setHrSubTab('payrollRegister');
    }
    // 2. Attendance Desk
    else if (subId === 'attendance_student') {
      setAttendanceDeskTab('student_daily');
    } else if (subId === 'attendance_staff') {
      setAttendanceDeskTab('staff_matrix');
    }
    // 3. Academics Hub
    else if (subId === 'academics_curriculum' || subId === 'academics_classes' || subId === 'academics_sections' || subId === 'academics_islamia') {
      setClassesSubTab('classes');
    } else if (subId === 'academics_subjects') {
      setClassesSubTab('subjects');
    } else if (subId === 'academics_scheme') {
      setClassesSubTab('curriculum_checklists');
    } else if (subId === 'academics_lessons') {
      setClassesSubTab('lesson_plans');
    } else if (subId === 'academics_teaching_records') {
      setClassesSubTab('teaching_records');
    }
    // 4. Students Directory & Dossiers
    else if (subId === 'students_directory') {
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
    }
    // 5. Financial Management (Consolidated Hubs)
    else if (subId === 'financial_structures') {
      setFinancialActiveSection('fee_heads');
    } else if (subId === 'financial_billing_hub') {
      setFinancialActiveSection('student_billing');
    } else if (subId === 'financial_expenses_reports') {
      setFinancialActiveSection('expense_management');
    } else if (subId === 'financial_discounts' || subId === 'financial_sibling_relief') {
      setFinancialActiveSection('sibling_discounts');
    } else if (subId === 'financial_heads') {
      setFinancialActiveSection('fee_heads');
    } else if (subId === 'financial_templates' || subId === 'financial_overrides') {
      setFinancialActiveSection('fee_templates');
    } else if (subId === 'financial_optional') {
      setFinancialActiveSection('optional_charges');
    } else if (subId === 'financial_billing') {
      setFinancialActiveSection('student_billing');
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
    // 7. Results Management & Certification Hub
    else if (subId === 'results_entry') {
      setResultsSubTab('entry');
    } else if (subId === 'results_cards') {
      setResultsSubTab('cards');
    } else if (subId === 'results_analysis') {
      setResultsSubTab('analysis');
    }
    // 6. Security Hub
    else if (subId === 'admin_users') {
      setSecuritySubTab('users');
    } else if (subId === 'admin_roles') {
      setSecuritySubTab('permissions');
    } else if (subId === 'admin_audit') {
      setSecuritySubTab('audit');
    } else if (subId === 'admin_backup') {
      setSecuritySubTab('settings');
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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    targetName?: string;
    badge?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
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
  const [idCardValidity, setIdCardValidity] = useState<string>('2026/2027');
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
  const [familyAccounts, setFamilyAccounts] = useState<FamilyAccount[]>([]);
  const [selectedHtFamilyId, setSelectedHtFamilyId] = useState('');
  const [htFamilyMode, setHtFamilyMode] = useState<'existing' | 'new'>('new');

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
          // Keep only Super Admin and user-created custom accounts, strip mock demo accounts
          const cleaned = parsed.filter((usr: any) => 
            usr.email?.toLowerCase() === 'usamah.m.qamar@gmail.com' ||
            (!['proprietor@sams.com', 'maryam.s@sams.rs.com', 'principal@sams.com', 'finance@sams.gn.com', 'stores@sams.com', 'yusuf.idris@sams.gn.com', 'aisha.b@gmail.com', 'admin@sams.com'].includes(usr.email?.toLowerCase()) && !['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-6', 'usr-principal'].includes(usr.id))
          );
          if (cleaned.length > 0) {
            return cleaned.map((usr: any) => {
              if (usr.id === 'usr-admin' || usr.role === 'Super Administrator' || usr.role === 'Super Admin' || usr.email?.toLowerCase() === 'usamah.m.qamar@gmail.com') {
                usr.name = 'Engr. Usamah M. Qamar';
                usr.email = 'usamah.m.qamar@gmail.com';
                usr.password = 'Q@marm@jeed786';
                usr.role = 'Super Administrator';
                usr.branch = 'All';
                usr.primaryBranch = 'All';
                usr.additionalBranches = ['RS', 'GN'];
              }
              return usr;
            });
          }
        }
      } catch (e) {}
    }
    return [
      { id: 'usr-admin', name: 'Engr. Usamah M. Qamar', email: 'usamah.m.qamar@gmail.com', password: 'Q@marm@jeed786', role: 'Super Administrator', branch: 'All', status: 'Active', employeeId: 'HQ-EMP-0001', primaryBranch: 'All', additionalBranches: ['RS', 'GN'], phone: '+234 803 123 4567', accessCount: 257 }
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

      alert(`⚡ SUCCESS!\n\nSuccessfully seeded ${newStudents.length} Students, ${newTeachers.length} Staff, ${newClasses.length} Class records, and ${mappedSubjects.length} Curriculum subjects custom-tailored for "${sch.name}".\n\nAll interfaces are now fully populated with active demo data!`);
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

  const renderSaaSSchoolLogo = (logoType: SaasSchoolConfig['logoType'], shortCode: string, customLogoUrl?: string) => {
    if (customLogoUrl || activeSaaSSchool?.customLogoUrl) {
      return (
        <img
          src={customLogoUrl || activeSaaSSchool?.customLogoUrl}
          alt={activeSaaSSchool?.name || "School Logo"}
          className="max-h-full max-w-full object-contain rounded-lg"
        />
      );
    }
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
                if (Array.isArray(data.familyAccounts)) setFamilyAccounts(data.familyAccounts);

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
              fetchJsonSafe('/api/fee_templates'),
              fetchJsonSafe('/api/family_accounts')
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
            const r15 = getVal(results[15]); if (r15 && Array.isArray(r15)) { setFamilyAccounts(r15); }

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

  const handleDeleteClass = (clsOrId: string | ClassRecord) => {
    const cls = typeof clsOrId === 'string' 
      ? classes.find(c => c.id === clsOrId) || { id: clsOrId, name: 'Selected Class', level: 'primary' as const, branch: 'GN', subjects: [] }
      : clsOrId;
      
    setDeleteModal({
      isOpen: true,
      title: 'Delete Academic Class',
      badge: `${cls.level.toUpperCase()} WING`,
      targetName: cls.name,
      description: 'Are you sure you want to permanently delete this class from the Allocation Hub? Associated students, teachers, and logs will remain preserved in the institutional database, but their class assignment will be unlinked.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/classes/${cls.id}`, { method: 'DELETE' });
          if (res.ok) {
            setClasses(prev => prev.filter(c => c.id !== cls.id));
            if (selectedClass?.id === cls.id) {
              setSelectedClass(null);
            }
            await fetchDatabase();
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
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

  const handleDeleteSubject = (subOrId: string | Subject) => {
    const sub = typeof subOrId === 'string'
      ? subjects.find(s => s.id === subOrId) || { id: subOrId, name: 'Selected Subject', level: 'primary' as const, requirement: 'compulsory' as const }
      : subOrId;

    setDeleteModal({
      isOpen: true,
      title: 'Delete Master Syllabus Subject',
      badge: `${sub.level.toUpperCase()}`,
      targetName: sub.name,
      description: 'Are you sure you want to delete this master syllabus subject? Existing report records will be preserved, but it will be removed from future course selection dropdowns.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/subjects/${sub.id}`, { method: 'DELETE' });
          if (res.ok) {
            setSubjects(prev => prev.filter(s => s.id !== sub.id));
            await fetchDatabase();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
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

  // Helper to determine automated class fee for candidate preview
  const getAutoClassFeeInfo = (application: AdmissionApplication | undefined) => {
    if (!application) return { totalFee: 155000, templateName: "Primary School Fee Schedule", items: [{ name: "Tuition Fee", amount: 120000 }, { name: "Books & Study Materials", amount: 25000 }, { name: "ICT & Assessment Levy", amount: 10000 }] };
    const grade = (application.grade || "").toLowerCase();
    const level = (application.level || "").toLowerCase();
    const branch = application.branch || "GN";

    let sectionId = "";
    if (level === 'nursery' || grade.includes('k1') || grade.includes('k2') || grade.includes('nursery') || grade.includes('reception') || grade.includes('preschool')) {
      sectionId = branch === 'RS' ? 'sec-nursery-rs' : 'sec-nursery';
    } else if (level === 'secondary' || grade.includes('jss') || grade.includes('ss') || grade.includes('grade 7') || grade.includes('grade 8') || grade.includes('grade 9')) {
      sectionId = branch === 'RS' ? 'sec-junior-secondary-rs' : 'sec-junior-secondary';
    } else if (level === 'islamia' || grade.includes('islamia') || grade.includes('tahfeez')) {
      sectionId = branch === 'RS' ? 'sec-islamia-rs' : 'sec-islamia';
    } else {
      sectionId = branch === 'RS' ? 'sec-primary-rs' : 'sec-primary';
    }

    const matchingTemplate = feeTemplates.find((t: any) => 
      t.branch === branch && (t.sectionId === sectionId || t.sectionId === sectionId.replace('-rs', ''))
    ) || feeTemplates.find((t: any) => t.branch === branch) || feeTemplates[0];

    if (matchingTemplate && matchingTemplate.totalFee) {
      return {
        totalFee: matchingTemplate.totalFee,
        templateName: `${matchingTemplate.branch === 'RS' ? 'Runjin Sambo' : 'Gawun Nama'} Term Fee Schedule (${matchingTemplate.sectionId || sectionId})`,
        items: [
          { name: "Tuition Fee", amount: Math.round(matchingTemplate.totalFee * 0.75) },
          { name: "Textbooks & Learning Material Kits", amount: Math.round(matchingTemplate.totalFee * 0.15) },
          { name: "Institutional Development & ICT", amount: Math.round(matchingTemplate.totalFee * 0.10) }
        ]
      };
    }

    if (sectionId.includes('nursery')) {
      return {
        totalFee: 150000,
        templateName: "Nursery / Kindergarten Fee Schedule",
        items: [
          { name: "Tuition Fee", amount: 115000 },
          { name: "Textbooks & Montessori Activity Kits", amount: 25000 },
          { name: "Activity & Development Levy", amount: 10000 }
        ]
      };
    } else if (sectionId.includes('secondary')) {
      return {
        totalFee: 165000,
        templateName: "Junior Secondary Fee Schedule",
        items: [
          { name: "Tuition Fee", amount: 130000 },
          { name: "Textbooks & Science Lab Kits", amount: 25000 },
          { name: "ICT & Assessment Levy", amount: 10000 }
        ]
      };
    } else if (sectionId.includes('islamia')) {
      return {
        totalFee: 75000,
        templateName: "Islamia / Tahfeez Fee Schedule",
        items: [
          { name: "Tuition Fee", amount: 60000 },
          { name: "Quranic & Arabic Study Materials", amount: 15000 }
        ]
      };
    } else {
      return {
        totalFee: 155000,
        templateName: "Primary School Fee Schedule",
        items: [
          { name: "Tuition Fee", amount: 120000 },
          { name: "Core Textbooks & Workbooks", amount: 25000 },
          { name: "ICT & Assessment Levy", amount: 10000 }
        ]
      };
    }
  };

  // Helper to compile candidate family dossier and enrolled siblings
  const getCandidateFamilyDossier = (cand: AdmissionApplication | undefined) => {
    if (!cand) return null;
    const pEmail = (cand.parentEmail || '').trim().toLowerCase();
    const pPhone = (cand.parentPhone || '').trim();
    const pName = (cand.parentName || '').trim().toLowerCase();

    let targetFamily = cand.familyAccountId 
      ? familyAccounts.find(f => f.id === cand.familyAccountId) 
      : undefined;

    if (!targetFamily) {
      targetFamily = familyAccounts.find(f => {
        const fe = (f.primaryParentEmail || '').trim().toLowerCase();
        const fp = (f.primaryParentPhone || '').trim();
        const fn = (f.primaryParentName || '').trim().toLowerCase();
        return (pEmail && fe && fe === pEmail) ||
               (pPhone && fp && fp === pPhone) ||
               (pName && fn && (fn === pName || fn.includes(pName) || pName.includes(fn)));
      });
    }

    const enrolledSiblings = students.filter(s => {
      if (s.name.toLowerCase() === cand.name.toLowerCase()) return false;
      if (targetFamily && s.familyId === targetFamily.id) return true;
      const se = (s.parentEmail || '').trim().toLowerCase();
      const sp = (s.parentPhone || '').trim();
      const sn = (s.parentName || '').trim().toLowerCase();
      return (pEmail && se && se === pEmail) ||
             (pPhone && sp && sp === pPhone) ||
             (pName && sn && (sn === pName || sn.includes(pName) || pName.includes(sn)));
    });

    return {
      family: targetFamily,
      familyHeadName: cand.familyHeadName || targetFamily?.primaryParentName || cand.parentName || "Parent / Guardian",
      familyName: targetFamily?.familyName || `${(cand.parentName || 'Parent').split(' ')[0]} Family`,
      primaryPhone: targetFamily?.primaryParentPhone || cand.parentPhone,
      primaryEmail: targetFamily?.primaryParentEmail || cand.parentEmail,
      enrolledSiblings,
      isExistingFamily: enrolledSiblings.length > 0 || !!targetFamily
    };
  };

  // Auto-detect matching family when candidate is chosen by Head Teacher
  useEffect(() => {
    if (!selectedAdmissionId) return;
    const cand = admissions.find(a => a.id === selectedAdmissionId);
    if (!cand) return;

    if (cand.familyAccountId) {
      setSelectedHtFamilyId(cand.familyAccountId);
      setHtFamilyMode('existing');
      return;
    }

    const dossier = getCandidateFamilyDossier(cand);
    if (dossier && dossier.family) {
      setSelectedHtFamilyId(dossier.family.id);
      setHtFamilyMode('existing');
    } else if (dossier && dossier.enrolledSiblings.length > 0 && dossier.enrolledSiblings[0].familyId) {
      setSelectedHtFamilyId(dossier.enrolledSiblings[0].familyId);
      setHtFamilyMode('existing');
    } else {
      setHtFamilyMode('new');
      setSelectedHtFamilyId('');
    }
  }, [selectedAdmissionId, admissions, familyAccounts, students]);

  const handleHTReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionId) {
      showAdmissionsFeedback('error', "Please select a candidate file to evaluate!");
      return;
    }
    const currentApp = admissions.find(a => a.id === selectedAdmissionId);
    const chosenFamily = familyAccounts.find(f => f.id === selectedHtFamilyId);
    const familyHead = htFamilyMode === 'existing' && chosenFamily 
      ? chosenFamily.primaryParentName 
      : (currentApp?.parentName || "Parent / Guardian");

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
          },
          familyAccountId: htFamilyMode === 'existing' ? selectedHtFamilyId : undefined,
          familyHeadName: familyHead,
          isExistingFamily: htFamilyMode === 'existing'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAdmissions(prev => prev.map(a => a.id === data.id ? data : a));
        const familyMsg = htFamilyMode === 'existing' && chosenFamily 
          ? ` Linked to Family Portfolio "${chosenFamily.familyName}" (${familyHead}).` 
          : ` Grouped under Family Head (${familyHead}).`;
        showAdmissionsFeedback('success', `Principal's evaluation score for ${data.name} submitted successfully! SAMS Scorecard: ${parentPunctuality + parentEngagement + studentResponsiveness + academicReadiness}/40.${familyMsg} Forwarded to Chairman Boardroom. Click Stage 4 to proceed with enrollment authorization!`);
        setSelectedAdmissionId('');
        setHtReviewNotes('');
        setSelectedHtFamilyId('');
        setHtFamilyMode('new');
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
          allocatedSection
        })
      });
      if (res.ok) {
        const result = await res.json();
        setAdmissions(prev => prev.map(a => a.id === result.application.id ? result.application : a));
        setStudents(prev => [...prev, result.student]);

        try {
          const famRes = await fetch('/api/family_accounts');
          if (famRes.ok) {
            const famData = await famRes.json();
            if (Array.isArray(famData)) setFamilyAccounts(famData);
          }
        } catch (_) {}

        const feeFormatted = result.student?.feeStatements?.outstandingBalance 
          ? `₦${result.student.feeStatements.outstandingBalance.toLocaleString()}`
          : '₦150,000';
        showAdmissionsFeedback('success', `Congratulations! SAMS Board Chairman has signed the enrollment deed! Candidate is officially admitted. SAMS Permanent Roll Number: ${result.student.enrollmentNo}. Class Section: ${allocatedSection}. Auto-allocated Class Fee: ${feeFormatted} automatically assigned and posted to student & family ledger.`);
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
  const handleDeleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    setDeleteModal({
      isOpen: true,
      title: 'Dismiss Student Record',
      badge: student?.grade || 'STUDENT',
      targetName: student?.name || 'Selected Student',
      description: 'Are you sure you want to dismiss this student record from active rosters? Continuous assessments and logs will be unlinked from active views.',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
          if (response.ok) {
            setStudents(prev => prev.filter(s => s.id !== id));
            if (selectedStudent?.id === id) setSelectedStudent(null);
            if (reportStudent?.id === id) setReportStudent(null);
            await fetchDatabase();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
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
  const handleDeleteTeacher = (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    setDeleteModal({
      isOpen: true,
      title: 'Dismiss Staff Profile',
      badge: teacher?.department || 'STAFF',
      targetName: teacher?.name || 'Selected Teacher',
      description: 'Are you sure you want to dismiss this staff profile from the institutional directory?',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
          if (response.ok) {
            setTeachers(prev => prev.filter(t => t.id !== id));
            if (selectedTeacher?.id === id) setSelectedTeacher(null);
            await fetchDatabase();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
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
        logs.push(`✓ ${req.subject} taught by ${req.teacherName} is already fully timetabled (${req.totalRequired} units)`);
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
        logs.push(`★ Auto-assigned ${allocatedForThisReq} slots for ${req.subject} (${req.teacherName})`);
      } else if (remaining > 0) {
        logs.push(`⚠️ Could not find enough free slots/availability for ${req.subject} by ${req.teacherName} (Missing ${remaining} units)`);
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
      alert(`🔐 ACCESS RESTRICTED\n\nUnder school security guidelines, your role "${activeRole}" does not have privileges to access the "${tab.toUpperCase()}" module.\n\nPlease contact your School Administrator if you require additional permissions.`);
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
        activeSchoolConfig={activeSaaSSchool}
        schoolLogoUrl={activeSaaSSchool?.customLogoUrl}
        onOpenSchoolSettings={() => setActiveTab('school_setup')}
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

              {/* ⭐ Mount the Navigation Personalization Modal Dialogue */}
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
                if (attendanceDeskTab === 'staff_matrix') {
                  return (
                    <div id="erp-view-attendance-desk" className="space-y-6">
                      {/* Title and Top Alerts */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-indigo-200">
                              Attendance Operations
                            </span>
                            <span className="text-slate-500 text-xs font-mono">• Active Campus: {selectedBranch === 'GN' ? 'Gawun Nama (GN)' : 'Runjin Sambo (RS)'}</span>
                          </div>
                          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-1">
                            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                            Staff &amp; Faculty Monthly Attendance Matrix
                          </h2>
                          <p className="text-xs text-slate-500 font-medium">
                            Comprehensive monthly clock-in calendar, daily status toggles (Present, Absent, Sick, Leave), and faculty attendance summaries.
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setAttendanceDeskTab('student_daily')}
                          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-all cursor-pointer shadow-sm"
                        >
                          <UserCheck className="w-4 h-4 text-indigo-600" />
                          <span>Switch to Student Daily Attendance</span>
                        </button>
                      </div>

                      {/* In-Page Horizontal Tab Bar */}
                      <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none">
                        <button
                          type="button"
                          onClick={() => setAttendanceDeskTab('student_daily')}
                          className="px-6 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
                        >
                          <UserCheck className="w-4 h-4 text-slate-400" />
                          <span>👨‍🎓 Student Daily Attendance Register</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendanceDeskTab('staff_matrix')}
                          className="px-6 py-3 text-sm font-bold border-b-2 border-indigo-600 text-indigo-700 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
                        >
                          <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                          <span>👨‍🏫 Staff Monthly Attendance Matrix</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono px-2 py-0.5 rounded-full font-bold">
                            {teachers.length} Faculty
                          </span>
                        </button>
                      </div>

                      {/* Embedded Staff Monthly Attendance Matrix */}
                      <PayrollRegister
                        teachers={teachers}
                        onSaveTeacher={saveTeacherChanges}
                        currentSimulatedRole={currentSimulatedRole}
                        defaultViewTab="attendanceMatrix"
                        loans={loans}
                        setLoans={setLoans}
                        advanceSalaries={advanceSalaries}
                        setAdvanceSalaries={setAdvanceSalaries}
                        bonuses={bonuses}
                        setBonuses={setBonuses}
                      />
                    </div>
                  );
                }
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
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-indigo-200">
                            Attendance Operations
                          </span>
                          <span className="text-slate-500 text-xs font-mono">• Active Campus: {attendanceBranch === 'GN' ? 'Gawun Nama (GN)' : 'Runjin Sambo (RS)'}</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-1">
                          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                          Student Daily Attendance Desk
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Take or modify student attendance sessions. Note cutoff guidelines and Super Admin delays auditing rules.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAttendanceDeskTab('staff_matrix')}
                        className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-all cursor-pointer shadow-sm"
                      >
                        <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                        <span>Switch to Staff Monthly Attendance Matrix</span>
                      </button>
                    </div>

                    {/* In-Page Horizontal Tab Bar */}
                    <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setAttendanceDeskTab('student_daily')}
                        className="px-6 py-3 text-sm font-bold border-b-2 border-indigo-600 text-indigo-700 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
                      >
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        <span>👨‍🎓 Student Daily Attendance Register</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceDeskTab('staff_matrix')}
                        className="px-6 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
                      >
                        <ClipboardCheck className="w-4 h-4 text-slate-400" />
                        <span>👨‍🏫 Staff Monthly Attendance Matrix</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono px-2 py-0.5 rounded-full font-bold">
                          {teachers.length} Faculty
                        </span>
                      </button>
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
                                          alert("🔓 Late entry authorized. Teachers/Admins can now fill the student attendance sheet for this session.");
                                        }}
                                        className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2 px-3 rounded-lg text-[10px] transition-all flex items-center justify-center space-x-1 uppercase tracking-wider cursor-pointer shadow-sm"
                                      >
                                        <span>🔓 Permit Late Entry &amp; Flag Delay</span>
                                      </button>
                                    ) : (
                                      <div className="bg-slate-100 p-2.5 border rounded-lg text-center text-[10px] text-slate-500 font-medium">
                                        🔒 Locked. Switch role to Super Admin in the top-right header to simulate late override authority.
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
                                All Present ✅
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

                                    alert(`🎉 Attendance committed successfully! Saved records for ${filteredStds.length} students.${(isLateEntryCommit && !isAttendanceAlreadyTaken) ? '\n\n🚩 Warning: A delayed attendance entry flag has been logged against the Branch Admin & Class Teacher.' : ''}`);
                                    
                                  } catch (err) {
                                    console.error(err);
                                    alert("An error occurred while saving school attendance.");
                                  }
                                }}
                                className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md text-xs uppercase tracking-wider ${
                                  isLocked ? 'opacity-50 cursor-not-allowed bg-slate-400' : ''
                                }`}
                              >
                                {isLocked ? '🔒 Attendance Window Locked' : '💾 Commit & Save Attendance Records'}
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
                            <h3 className="font-bold text-slate-900 text-sm">🚨 Delay Flags &amp; Institutional Audit Ledger</h3>
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
                          🟢 Excellent! No delayed calling flags logged in the registry. All sessions were taken on-time.
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
                                      <span className="text-rose-600 font-extrabold">🚩</span>
                                      <span className="font-semibold text-slate-700">{flag.branchAdmin}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      <span className="text-rose-600 font-extrabold">🚩</span>
                                      <span className="font-semibold text-slate-700">{flag.classTeacher}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border border-rose-200">
                                      🚨 DELAY FLAGGED
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
                      📋 Student Directory & Folders
                    </button>
                    <button
                      onClick={() => { setStudentsSubTab('promotion'); setStudentSelectionPrompt(null); }}
                      className={`px-4 py-2 text-xs font-semibold -mb-px border-b-2 transition-all cursor-pointer uppercase tracking-wider text-[10px] ${
                        studentsSubTab === 'promotion'
                          ? 'border-indigo-600 text-indigo-600 font-black bg-indigo-50/20'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ⚡ Academic Promotion Board
                    </button>
                    <button
                      onClick={() => { setStudentsSubTab('transfer'); setStudentSelectionPrompt(null); }}
                      className={`px-4 py-2 text-xs font-semibold -mb-px border-b-2 transition-all cursor-pointer uppercase tracking-wider text-[10px] ${
                        studentsSubTab === 'transfer'
                          ? 'border-indigo-600 text-indigo-600 font-black bg-indigo-50/20'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🔄 Branch Transfer & Offboarding
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
                            ✕
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
                              Class Placement Category: <span className="font-extrabold text-indigo-700 uppercase tracking-wide">{selectedStudent.level}</span> ({selectedStudent.grade} • Room {selectedStudent.classSection})
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
                            {tab === 'profile' && '📋 Student Profile'}
                            {tab === 'coverage' && '📖 Book & Work Coverage'}
                            {tab === 'conduct' && '⚖️ Discipline & Conduct'}
                            {tab === 'health' && '🩺 Medical Record'}
                            {tab === 'finance' && '📊 Financial Timeline'}
                            {tab === 'docs' && '📁 Student Document'}
                            {tab === 'id' && '🪪 Student ID Card'}
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
                                    🌙 Islamia Wing Section (Optional Program)
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
                                            ✕
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
                                            ✕
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
                                        <span>❌ Promotion Restricted by Billing Rules</span>
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
                                      ⚡ Promote Student to Next Grade
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
                                  <span>⚠️ Active Policy Restrictions Due to Overdue Balance</span>
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
                                          <div className="text-[10px] text-slate-400 font-medium">Post Date: {inv.date || 'May 20, 2026'} • Amount: ${inv.amount}</div>
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
                                            ✕
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
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Billing Amount (₦ NGN)</label>
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
                                        <span>✓</span> {newDocFileMockName} (Ready to save)
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
                                              ✕
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
                                      <span>🖨️</span> Print Identity Badge
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
                                  💡 Design conforms to SAMS multi-branch corporate identity standards. Front elements adapt dynamically.
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
                                            Blocked (₦{outstanding} Overdue)
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
                                          ⚡ Promote
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
                              <span>⚡</span> Bulk Promote All Eligible Cohort Students
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
                                    {s.name} ({s.grade} • Branch {s.branch || 'GN'})
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
                              🚀 Reassign Campus Branch
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
                                <span className="font-bold block">📌 Exit Comments / Status Reason:</span>
                                <p className="font-medium font-sans mt-0.5">{selectedTeacher.statusChangeReason}</p>
                              </div>
                            )}
                            <p className="text-xs text-slate-500">
                              Faculty ID: <span className="font-mono font-semibold text-indigo-600">{selectedTeacher.id}</span> • Specialised in {selectedTeacher.subjects?.join(', ') || 'General subjects'}
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
                            <span className="text-amber-500">★</span>
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
                          <span>Branch &amp; IAM Identity 🏢</span>
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
                                        🔓 Super Admin: Editable
                                      </span>
                                    ) : (
                                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 select-none">
                                        🔒 Locked (Super Admin Only)
                                      </span>
                                    )}
                                  </div>

                                  {currentSimulatedRole !== 'Super Admin' && (
                                    <p className="text-[10.5px] text-amber-700 bg-amber-50/50 border border-amber-200/40 rounded-lg p-2.5 font-medium">
                                      ⚠️ Bank details are sensitive payroll attributes. For financial audit and data safety compliance, edits can only be committed by an authorized <strong>Super Admin</strong>.
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
                                  <span>📚 Class &amp; Subject Units Allocations (Teacher Load)</span>
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
                                      <p className="font-bold text-rose-900">🚨 Critical Path Warning: Personnel Overloaded</p>
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
                                      <p className="font-bold text-amber-900">💡 Resource Under-Utilization Detected</p>
                                      <p>This faculty member currently teaches {currentLoad} weekly units compared to their capacity of {maxCap}. There is an expansion opportunity here to leverage their expertise for supplementary tutorial periods, academic tutoring, or continuous assessment grading without adding exhaustion.</p>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div className="bg-emerald-50 border border-emerald-200/50 p-4 rounded-2xl text-xs text-emerald-800 flex items-start space-x-3">
                                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <p className="font-bold text-emerald-950">✅ Perfect Load Balancing</p>
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
                                    {selectedTeacher.position || 'Faculty Member'} • Department of {selectedTeacher.department || 'Academic Faculty'}
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

                                      alert(`✅ Employee transfer committed: ${selectedTeacher.name} is now posted to ${formatBranchName(nextBranch)}.`);
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
                                            alert(`🔑 Password updated successfully for ${linkedUser.name}.`);
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
                                              {hist.previousBranch} → {hist.newBranch}
                                            </span>
                                            <span className="font-bold text-slate-900">{hist.transferReason}</span>
                                          </div>
                                          <p className="text-[11px] text-slate-500">
                                            Authorized by: <strong className="text-slate-700">{hist.authorizedBy}</strong> • Effective: <span className="font-mono">{hist.effectiveDate || hist.transferDate}</span>
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
                                    <span className="text-lg font-bold font-mono text-emerald-700">₦{overallPaidTotal.toLocaleString()}</span>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Sum of all released direct deposit slips</p>
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm">
                                  <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl border border-rose-100 shrink-0">
                                    <DollarSign className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Remaining Balance to be Paid</span>
                                    <span className="text-lg font-bold font-mono text-rose-700">₦{overallBalanceTotal.toLocaleString()}</span>
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
                                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Baseline Salary Setup (₦ NGN / Month)</label>
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
                                            <option value="Paid">Mark as Paid (Released) ✅</option>
                                            <option value="Unpaid">Mark as Unpaid (Balance Due) ⏳</option>
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
                                      <option value="5">★★★★★ Outstanding (5)</option>
                                      <option value="4">★★★★☆ Competent (4)</option>
                                      <option value="3">★★★☆☆ Satisfactory (3)</option>
                                      <option value="2">★★☆☆☆ Needs training (2)</option>
                                      <option value="1">★☆☆☆☆ Unprofessional (1)</option>
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
           x��}[sIv޻E14F�ƅɁL� HbE�0܉cb��+��euUm]�b�/�pؒ��*lK�c���#��P��o�'��?�y�R�u?�� �!*v����<y��!��
�G���p�x���Z��hxz,��7��f��ҟ���^�$����d�\�^�Q��g��e������tS�/"W�7D4������!�Y�|rwdyg42m�Ƈ�����c�ŝ�Ed�Kø����D��� �Ø��������>�b����NȆ뇓����+�MC׊�CkL�g]:�����ǫ�d�dĢ}��}Ӌ�{>rbJN}/�|�&����� �E�	�ĳ��u�Ľ&a���gc�!�F�ퟳZ��� L�����H:���?[$q�{m/z�b;�o��4�s��U�92r"��ΐ��!���e�8��j�y鞱WVN���m6��n�2j��<^%Aw#]��7[֐v'�G��0z���/p4�(A|�_��Q˩K/��8��X|����ַ����N�^y�Hl���_d�l���d�{����،Z�c��LE����V8y��oi���Öuf+�yP�v=�ّ_��4��s�w����Y]"ߐN��
[r�@���\#��z=R��Q���wa���	U��(9"�G�q��K{l?zv2�����uI�#J\zx���O�,��)F���!�Hc�;�~�� +;u�O�V�jv���ֱi��V���Kdk�Ѵ��d�28�9�Ua���X���r�ȲJ��Z>�����o�_$��N��S����N�0F7,���-7g�/y��x�s�#h�\�aa[n��d��d*��
������~m5����Cx�ƾ����n	¸����^�py��1e�Uc���֤w���%|h���Z�d�ZT��e����v�O6�����?���4_��%�h�<�ҽ�q��Iu/\�������f` 0�RH�]�X�%;s�e���Ե.�	a��
�;�V\��	�,�`k��Z%ɖ���k�q���������;�}�������_�7
���8_0�B�k��E�FS�ɗ_6n�"�:���Cߍ�kdlof�3+�>n!�Va�5�	\�Fl�A8���k�����m@�Z[����d�#���L5Vӿ�3��"�Q�~�W���ɀ�[�ʹ�eki/`���=zj%n�A(��)�<���	{�/�`�|��?p�K�~���Q�tlJT��g�
�i�����4NB����.a����y���:EA�MG�$��n��W�{A�:�	r�M������zL����3d���%�Y[�ki�b$���J��i�,�lZx�%|�y8�U-<�W����|,����7~���Ͽ�4`sA7�4Ⱦ�w�V�D�dL L#���
}�k�o�;�.2���2a��u��ٙK�Z�q;y�͂$�6��F�r7 ��3Y&���O��){?���; g�,>���G9�O�hJ��=.i���Ԛ8��v��5ťɐ["���d8d��&�;y�μ��*�|�p�Υ�u����ܟ�ր�e���:���0\o&�`ԉO?[��!_�xA7��Oٹ�#l��t�%ݭ�;��Сސ��ŕ��H�}GʋLvy��G�M��e��Ս|O�Tj�c�[��{��h4��L��ڨ�b���v��{���B��|9�f����_޻�Q�8���bH�>�N�������ۄ��i�L�G#?����h�D�	�p�R�{���**���V��T4n@���֑m?�C�Qn*!�J�}C�(	)�/&g�#��q�Y$��{�7��9�p&�OA�w�4��&l̾g���O��+��5�u��d��G69
?��n¤ޏ���Ă�vb�F�$�i��k��Xg��lϞ��hDi�h��OO�r~�D�Ja����hF�����E�"d��lÇ�1�v�'h�y�풺�g~a&�&�BcӉ�D��W�)_ψ�1�]��ʛ��E��Ȃ�U���P�u=�B��<>��7�b�Z{�Y��d�x㈼���O����2؈7��'�M3�AlQsb�ۛ��u�}�V��uȩ`L��7�B�p��"I�7��"j��z#ފ�1E�4�Jg7	��!8��#�sJ�8�|��6#�	�dǶ�����;�5�x�'����pk�O�����cN�4�[������4����%e�3��N�Uu�����>�喐���I���-��{1����xe����7V���
["�|�]U�*dϬ�Y`^4Zl�ơ5� G���}���&L�,F�j�\@E2aaN���W��K����o~O��Y�tq�FT��Zܹ������	ͮ3��dfd�H��bჶ�܉M��X�	�2��7dq\ՋDwv�RB�����#������,8�������QH>̆�=��r�Ϗ�b��&䊍00|27&�����f�P�]3�iM͚d�]����$��Ua�n�/.skt���+P�Bٕm����^W�Y1�J6]Ü��t�/Lwi�~4�lkyO�\��6
����bS�m��MEn�q��7���=fK���ښ���31?�x�wb���3��,0aʧ���Y�e�fdl����
�p&㏁搡��55�[(�n Ŀ�HȯAw-c�![ ,�`��C�G]���{l1b��Q�I3���I�����)�!w����Zc��{�,�݂e��m��W������8���A��,�C��P��7�c'o����kj�d��M�?��JQ9!���Z��ORՆ�N����_�s5�+M�)")�;y)�Si�X��B��&�,�K�I�z�N��/��I������?&/�w�_�/����������O���۷��do���Ӥ�ľ��;�f}>�6����O g��۠ho���2Yy�97�'��5��<}�f�A�-ʷ�X�^���[�)�H��ԉ�v1c`|r5�i��!D������d=�b�Fw'Ċc�%� �x!�|P3���t��e�q�Ԉ�X�-q�K���09l�r�4��҂Z�٫Bz����#Hؙ0)��8r�<*Q
h��ub��ܦ��v�*0��K�_1k��o]��oI�*W�,�@(Jƞz��^��'�Zoj� �J�v�]jf�ua6�
�$ڔ�T�H���u<��|��E]��@F a��3Iڶ�32K�~��Z	gRt�V/��f��"~E�6赸,�<�Q8"�)�,@��<+ZX��[�V�2����!��|��2���~ۖ\S��3~Z�f{$�Ϊ�R�i���a�������H8 ;.�ł���G�~��]�)��u�@)B�H�Bp³pVx�������>nXؿ"儉��W6���ۘKsk������4��6�f��5p�� �Ɓ�bB=�X<�t��e�\2��GM����������l�z������{��<R��Ka&�N�اڤ���GR-fj�8�Mr��p߸D�L�__�[���!���X��	�����Yn*�	Ϛ�e3�]	��q��N�:B�Ѓ����$-��Q���)��9ݟXч�w����ǩ��
f$n/�qg	'WR�ډXR����1�C�xw].��}e����Qem�x�;��6�e��L�}����7�/��k����ԜP��X����fK��_�����X�^�nff=^�� �/��Oi�N�������:gIȗ�����������;�g6Ia2�v��g���/.k&�*�9�i�����Ђ5�PO��*lw���d���K�'�sv�(�sT��[Du�Tc���V�Y#6��酀�}uqq/5or�Z��Գ1o�VX��h}����q =8�q�X=������q`��gm!�e�K�͠�
�F��O��42b�%^4rN㎾�K��4`�7��!)6�3��S���)�a��B@�Hn����/,H���ߧ�� e^��QZ:�2��w����n����U��z���V+���Ow��u�O�Sv`�d,c���n׻����6vXo���1M���YxP{�]+���N���z�x��DD�ӈ�7$J���y@��DZY�C�e�}b�c'!�Ӄ�$�8���G=An1G��܉�����' Ms����F�y?�����E��iq����� �P����:���>g�&���\�W�Cq}�z7a?�Y5�f������ɿy����3���L�������{��m~����g��.�߶���3����J�J�%��ԾF�Wb[x5WhFg�Oa��J��m��s���@֭�79uBP*�����X�]�ZG���6ӗ�A�|j��g�ms\�CBt��N�}���YR��.;.���b�_�U��w�叵�|nlz~*Gv��-lw�dw��lmD�B�kz6�|�Cw�Ct�g(�s�s����n^ɨ�8A���A�琲�IՍ���I�H����e�[a>�~�+�3�����h\g�gQYb���(��=�E�"�S�80���|��<u�j	��kb�w^R߿��$���m��!:^��ؔƱ�m-�������veb�d2=�0���]D3��B��j�`�eFK<'&M�q�f��(�P�qR��jF"���6ymA���.ʙ�a���
#�����S�4���m�Îju����W<#�����j6�Yi���+�f������AK�[>m�����eL�z�g+�_"�T�~��1�Y��(��cE���d���O�$#<�X�Z;� ������w���F�^^-a��Y��KV��`�%�#=�%��ls��6�At}Sn��N��(3�t�Q[FXAt��ٲqis3�����_�I.��Bypݞ���t:_��kY�"���.G�ԙ�MM�6Z����g����G�?�9��9�S��}r���r�3�����]?�#���"{?;�ys�K����N~FNv��7��^Ch��.�������J�9�dH4�����5�F�>�Pw+N<l���,��"�}�Z���2���������WɘɃ�4�pHU���R"G~[n#͏���p��f ��|��<��s'Nd2�S1iЎ�l*�.d��?� qR����J�x)4�1@r�{�8���5"X����Q��T���^����v����{ka{�X�v-����Q3{-h��4��w��)[��|p>
�)������΅Ơ�2�
X��/��BɟAM�����E4��Y�F��}�����������~l���#E�qD��W��5Wo�Xnor S����蜉F�L�����d!9ky$+ &��Ӽ.D��*�^M���
�0�ۚ���E^�m�Ѷp�ё�u����n]a��(��͠�P�$0��-8��.�ƵK��
(�I\_C<K�VM�4�6n"�Ʌm��[97���A��ņ'�B�?�8����{�f���ןP�N|F�qtwi�4�ϗ�'�:e��ld�/'���Na���Cv�0�򷿿+;���X����c���Ȼ�*Gc��5��Ml�e�P��li|����y(���e�߂<��#[�T�z�{IԎ���Xܐ�cM ��X�V��Q��^PX�7w(lL�؜83S䙊�O�..+��3N�=��w)�IY���8񄽓��/N���؋����pܦRxո-���ȝ�#1"��]�2��V��F`��Ԟ�m}����S(/pf���v�3<$Bx�������#j��S԰�o�Q�V�N�.JG`�~8�p���H�#(P�;��8�P�Q��[0���/g��C�b��ŐҢ�4֢z�i�P�#��1>Դ���.�R�QӦ`��$}@�����r��=�}hyO?�X�s�l���eOF</;_��c'�M���"x�����u<�k�;{�]d��y�#����N?	؞۱ǎ����Rc�A�B'�J����|O���/��D����7"+���VJ/b:x^���i�0�������k�G\��u����� ��6�g�m�����n��2��Z�w{��)��
��Ί]��g~8� 'MfX�t=���\�oCVpv�`�6���v�6c�$�GE�Y����.U��פ�n ��n�v=��d�MbQL��A�t�V�I��|~&��B���' U~V+	�rg.nO���qCm��-��&
��0L2�O���O-�-�*��ІiT��n�D�^��e�8T)��L̃�Oȋ����OLNh�T6�.�!�O#�[;�xd�
��]irд���-kv�Q]-�e�_�dƖ�(c�Wm�@����Z���7�D}�n��V��������_~K��捎���l�&��ț엖���xx|l�Rz���<j��	��7W8����� ��hInC���{=�~}K\Q��B�}G<�t
�x����*S�טJ\�շ�C�8%p�lk2՜��)��s�����x�������*�����T��R�Ŧ�k����p�7i�?�DbD��H�Ż���m�a�>I%�rH�q�1�MBE]��V%�{�s�1�R������b�H-�ii��s�P�;BW]0=.�u�A}�����$���js++dh�C��o"	D9��R������S�q`? :��nd=�PxF��_���V�UC+!�I�N'J��b@�I��OI���t��=>z�������j�R�^���vKj_�G-Q�l%T�#b���2�`l�O�<Jn;a{�M���m<@n^���]�o�'�G*�7�
�v���9�"T��h���?�/ҏC�<v���f�*��Z�O*�|���I*Ћ�k*6��Z\B�<g|,Hܨm^ez~���6�G@������~7�����]ObG���Z��R]�s5�DX[�����bnC��?�%yn����k6�Sֈȧ�٘�O`6�pCy
�4ĝiV�zn�Ӹ�z���Hfi�@�@j��B���ڀ��+��_T�CfPH�u�����@dM�Y!��\�I�-����,�y��(@ʫ>�Yj�N]v�ȱmꑼɭhP�Yc�f�DιɈZ0)�;g�}F[���{��&���fՌ�T�/��"]�S���
斒�Ӭh��p����V�L��u�uqO|�׼�.�ր���4~-E��dw��̹Z��h�ռC���	D�{��1+}�,�@�s��ĕ��e�Ap���徣�;�`�ͺ+??��+��Ò�e>��\�C!�!'��o3}���FX%z7�$n���>@���z�X�f0�$u�+�-�Cێ�u�z���=���V*�����7G�/tIĠ����5�l������b
�U��5���An�6ɏ��$�a��"ٜ��9c�|�pby�������k�4���R��c�˖y�-�&�k��>�+����T�q�����6��&�-�2�p�2��G�X"���� ?��xy(N��~�I�/���o[��ix�2E^��=Ni�"O��4��+s1*��r^P��Q�Ҷ������TU�N���
��K/�M�"m�k1đhZ��dsq/YF%3�l\ 	��g��rܶ���UE����0�C�}�xH+O*Q�״��ʚ��r�9��U�/�
̩J�#=���\4��T&d?iƹ�E`;�;n��wEX�68�O�S�D��i����"|������ჿ�䠺qJ:���� J�٣�AKO�������t�����[ħ�WB���X�ub��5��7Jd�ٛ��LNن�>#�7���b�D4��aC��.P-:Mk���&�i/d���Yg�v������<��'�Mm���h�>B6��f���v��H��}��ԙ0�r%�*�}��:3�C�U��$��c�N6;>*aM*1덟y��%�ȿ+� �R �h$mU�Ǧ�D��i�O�z|@[�K�*�őb̀b���'�b��aKJ�p��F>�Im^V�h&а��Hkb��#4���Z�ض�Tt�E���@�P���m���j�Q��C[^��!~��ƔZ�πѦ6���RX�oK�w½�F̨ؓv�X��kN\L����2��"+��;�D����߄ך�ӧ_�=��k�1�?�f�
j%�Y��o�_�Tt�nM�#ǥ���7���a�����u��"0��wg/B���pv�zXA��E�s���>j��r�`_*��ɣԸ���$#�zm��?���m���Wǐ�'�b.�F���}P�( \�q>��q����_@��X7�0^&�n;q��Z ۹��D�;�X|2�5a�Ӕ ��6C���j@iȶZ�E�ۊ0KYXi �!��k��j	��k�Q���qT3LU��7_��̩���@���CNTS�=1��O�Q�
ͼ�Z���w�2�CK@�M�ס�3�ִ1��0�B���Y��-��3�����f��.��4��b���,�W��Y�sA)��xO]<���K¨?m�￸�E��La빬G�Ȉk^�|��O��;鶯Ih�K[��ݖ�Uڐ-��CJn���ZL�S�js���Lnz��N�C��m��_t-(8�D*b�Բi��2ϝAv�yw�1���D����U��i�DNن�NE�Qu5Es"�k���u�i�_��x�z2���۶D��cs�UUM�A�;���uq����(��Z�Dz,a�~������h^zh��?�PѾ;!�"-g�V�&�ŕ�E�4��l���j̐)
ۧ/1�>R��m�ίD.ՐMD�x�?:��'��M9o�sє��"dW)��㔗����e"q��!�I�D��u����2p^�E�g
!��g﹍Yy�``7��[�
"� 5�\P���7�S+����NA���
����'[s�_�r�2���`��z�k�I���j�믿+e�(�p�k��x���o�S@"4AA[mO'.���&C�W��dv�j_n��{}ƚR��(� ��?Z��LA�\��ܺ�����6�kq����^K@_�-�Њ����o�)>\�����@�ܺ�4�鹺9������_��f%$k����E��5��Sf��K<�϶���5Y�Z��fq�R<T�q�uc�;�i菳�:�]Y�،������H B�_�K�O�|�T]���)�)	���Rn�>SQ��Iif���14�.��b79[�n�c����\�ҬanGh�Da�>�Ho���B0�Յ6ջ>�tfq��d��W췆�����h���ď�ضR�B~�J��b��3&5
�/�D��@O�w�G���o�y����UMs�L�4ʎQ�Y-�P��`�q\R�Rx3�u��	�_}��`J�Q�X_}�]_}����IT؏\7�����Fd�n`����(��Ð�Nd��Lb����������N�f���&5d[�`:Q^T���ٰ�a֝��;�K˄5k�.$*��(��~e�
��y+�'\��8��X�kd���3�'<R�zr>#r��(D�O����3���y������[�T7�f*|{O�n�R-�jF�V������� f��)h��Y<]]ܪ!O��Q�O7�x�� 6�炚k���Lg�����2�~��ܦ�>v����д�+k�h��׬�bc7�.�8��s����Ҫ`������V�9�٧��,�pJ:�(]4��Bz�XZ��za�+�� f_����d��,VS�f��Xe�-����׹��p�L�27�g�U���M2��
���Y�Ч�Y-�78K\���u��c�����oӜ�V2���L��H3��d���H�v��0�ǐ|^uz�w���jMo#u�WB�;�5ޣ�3;�'?��/x��Ec�����O�+�[�J��\�W�b�F����rU��d�9y���$��w���>���;>>�}����f�p�����Ó�Gg�JE ץ�da ��}55�0���4�������d�Pey\4�U_a+���0�:��Xz%0j�W�f�<Z����Z#OW	�ݤ^q���>�d>�%%�U.����Q��Q�P˸%Ī	F�V	ۑ��6�ԝ!#��3$�!vqzUC��n������%�X� �6I�Ԅ�a/9��K�<�k�"���K��'�/�����'���R[Z37��\��/]�3�i���X���&�w,�Rg8���AS�i��-3�c�b��Q�`�JD�_��G.>?Z#��>d�'��HXo8�O�a�0��l�e��+�����2�U�f��>�J�0'��:�F�8� �u'���*tͺՙ�j���ŭ�y�d��T 	��(v�F����˝*ê p�� WV��M�W�(<l��O��5��!�ؖ��0( ���<�n���%݅AV�Zrc�o��+NqS�p��̐Nt9�Rv�'Ф;C0�e�@��^T(�W��3�a~�Cd�"7�\�P&�'n4���}+i\���E���pO�%W�p�ěcN�M�#��ݭ$� s�(=Rݾ)Z���F�z�0]H�5 �?��b`�� ��3HI��I��r�y�o"ݪ|�����F B���
e���7�<�A�r���AYj5�e�5_�����t����7�7��ieʆܗ�>��Y��j�▓�W�(��ʹ%>�����6)@_�S�8����Ts�%��v�*9M����0#q)���O]�H>/����1�z/��A0ϸឪ9�rj��o���ώ�:�Wp��1Q�40�OD��7�|s�m��W�����K�&qc�8d7�����'#;�F���<p-�G@m��|fD���k>��=ٵ��Vv����ј���9c�l�~tV�gFk�)���h�� �|;�b�-��+9�K��z�x�ץZD9%
�j���-�A��, +~�:1�x"�����n��ה���f�_HX�[=-�_�b�z��	�}{x�sp��)�1�	�X�L���XR�9�hZ��Q�\]��P�5�ON+յ!`��f�kP�r��vwE$|�	M1��:��97�e+�EPm�Ql�|3"��k�s�l<�amMa���|.��%��o]�ɹT���s�������#v/ؚ���
6�2�c<���_u�B2��Rh��
[K�x��[L�����	۬�sq�j�=�US1M%�C�y�*�r�w�+�s�Kp��'mcn@��X-n;Lys�g��I3P�\�Q^[�\~���6J��OC�8�4�o�z�lO���z�wnS��3"��j*��[��6�`�����y����y �"����G�@�/~׋(����=v�P���t�.����8�K� �v������;��b�nI]U��O�CJto��w+u�Tu,�Q����f��0;VU�Oп��r >�t����!.����A1��T3�%�f�O�}�8Α�}�q�%3��RN�u�u>μV��0,��3='���z'!�i���Q���$���D�2Hm��>R�Z���Ħ����DVB�U��a���gqA�i d�s�h��N�?�೬�!F��/!�rs����V?�k(�e�2]!�ڒ�`V/�B����I{5��U�-�T�nA���z=�{�(��Π6\Ȳ��t�U[���07���5��	��U�YrC<,���V[A�
�FT���1�����4�K5��Ճ��Pku�*.cP��5F�TSIK}ظY��"��F��k���������_Ii�ʕ�yHJA�!�`��0&��`�� &�9D�W�XVYU��aB�yj��h.=m����ٽ��A��S����
�v�ǖ�����V�q\��U*����\�Ej-���K"j!��I�fVN���8��h`Ȝ.���{Ʋ��fb�0����$c?wS�kkR���ߥ����n�٣��q.��]�sMbWs�e�O@!k�����PN��ܧ�Z�$��ݪ�9�� q`�9�
�g�sq��XG��#���뼟���Q%`{��}�&���N�h=��gqV��4�:0�-�:4V�V��"��(1"	U;�j�-��`���
X TL�ƈz��R�36�������&	�2�$P��M�l��@/�Ū�8����2�{1G�,|N������M_1G�J_@�.E���L������	��'e|��ǚ���ޏz=�� N}-s��&'L����׸��o�u��·��N��;��>u�� wN*��U!�v��۵|�t��a9t1B�s��Њ��Z%��,x�v[k��>���vM���^�8��be�擆�s���9�i�iMi��e�^�[J���H�Ł�m	V�h�	6��{	�^����%ؚ�%X���`�%���Ê�{Q6+��$��Ǧ�A�m*��$Ц��z��
x��D[�ݖi���
�V��{��^�����ښ��Z���k����r��^..^2-�ӯ���-�D���1��Fa�!�8(��K�(1y�4aI���6
��H��^aZ���D����O�撮��� �fC��r?)wN�톙l{/��K��m���D�)KR�k�o $�|��Ji�(4Cw�����r\r�$u`��h)OkE��9��(�F��:k�,S���-_���؄j󔁱�uG��l�2��#���H�݀������Xk):Qg�JϦ5oȗ3Yi��)%�g�G5�0����U�IB��i�NOJ�y�2z�����i%�C/)�R�DO�O����v�*x|P"��`�d�1$�Cm��:� 2VC�[6��HX_������TK������:Jh*�ܚD��V�)�!�%$ÊȈZvmq����p�ǍL%e
�Ŵe��h�fG�w������Q}io�r>_E��O���<�ˋht���~����[���z)I��
Y�P�/�6"�U�܈�:{Z-�v�ǰ�E� �,��ܲIF(�1�`i��)��)�)4�T�R��{<Δ�*����Y@o8����k5�֕�8���D���hL,uU�
����c����B��K��P
r{5l#f�[�iCH��=y��XJ��6
gJ]��֍ ���H�($-u5��,�Z��*ŷ�j��]/,��ݻAx���z�0U���Ue���qoF���?IB'��!�/}�=����dE-ɹpY�ԍ��¾yy��]���n��Z<�/l��g��y{pJݣ^C�P{2A��z�j-)�8���9Pvn�4�Ω�FX!U7����o��s��h�������X-!��`TŅ#�]��aA�edB�~���@{�S`z1�
:K&�c�Kø�p�R� D������i��@E`n�K�[0�	@;�+y��9�l�-�Z���a�``���j6��mpå�������`���C������}n�T��a���x�$n���&�8���J��Hgv�q[oi*���N�k�a�{��qV5���Z5}��l����	�mT`�l�l3��^�B�W�,�!O��?�p@�APJ����/W)���i�r!]:����	���L�|⊞0Mb#EЦ	Ԍ����p��x��JM|���CV*�s w
��I0�V݄R6���v@Z]I֯E����s6���]n�2J���F��S������NH�e�aUOٞԍ�
�
4d�`ɯ	��f/(hLq��G<u���a+I]��O7t߿::��(fEamM��ܳ
(�vAlJۈ���^I[H�s�:���q�2�:���d8%���JUÈ)�?�jJ��8��t�5�#e�וVD�m�[� 'Q�����}~��LR�-��P(�w^��US����� 5�����a}�Z��f�:H�%�B֞�Q�3I�?yXӇu!��(��򴖊��'~%���f�j.���R�U��\6�`��d΁�W�H����]qh#�*Pd�#�;�Բ�6�&��"��o�r�~��a������_~Y�R+PQ&�;I$����(�d��>_�e5�R/��R�˛��C�P�H�d��VNI�G;�'dm������?&;�_���99x{ؿ��2�v1�p���q9�@l7G!�dJBA�����ZA^����$o���)wza7�hL���ʭr�U���o���E�R�����l���?���� ��y_%I�~�&�"`]`��D[0�"�ȑq�DFz4�s�q�7���V!cPA!y�#{���S)LY[^Xn��mXn3���+���\쵩���SƎ���u&�Ǖ����R�y�%�p��ָ7Y�N�YE����jB�fX;�R��}i���Qz�/ƗN��(���_��7�}���SmAFȢIG���V�mO�2��]��_H�J��CmTr0+Ked�.ٲEL�1����/B,���K.W)���aMԛ��SQ��)sD�&X�V��V�ɨ���Y�P����g��;�e11u��nn4�U��U�K�	�ųΤ(c,]��G�#y6��C]���n�T5�٣�2J_P�ôw�	ԏCj����́a�
A���&�2�(t.0pSYE�T>:���4�2���48������r"�¹�/�>\�B���Uģ��<�4*�=}8�MO-F�?��IW��] ���m�++����TS��i;������6�;��r����&MhF\/�Q��'��j^��.�\��R�KBS��Ec!6� i�;��K�������K�Tu�� K��1΋溠.SW�ɡC��'�MR�/�=�X���u٫F�$-, �*�����n!�%!B.Y�{���6�	9u�(F��b0*8!ϥ�@��N���y	������^�[Q�yڷ�7I������ov�m�3ض�������i��s:!�>�eud3���,�'�Y$�0LՌL_8�@��J9�ݮ��Ɲ�$�f��X�u�s�;�1\�F���`-r��ζ?�&;��4��C^�x���`Bv�?f,^F��0NB=�9�u���a�6�W�Mmn�fO�X�������N��!�3nX�
4��2�gZi�F���2�$�)SL��<ҥ�B|'ʭuD@\H20F|Ӳo��+�o��}jD�rJf��a�05*�>���������ۊ��z����1���db07�IR��Lg�b0[�>��9�!Xʤ<�Ǐ�y��r��#��c� ����T�I<�ԡ�%19�r���g-�,�Tf��bT�+Ih)���K+�E� ���i~�oh:4�[b�+��^C�p�V���]��� ���RjC�FD9M�5:�7�����'�|hhq�}�n�	4���a����r�ԕ1^�����=��n�e
�U�25�D�0Z&;!��{�S�r��ݬB�òD~
bb�0'[��s�2[+��hBf��m¬�!X�X����A`�x�V��Z���r
�uXnH-{�`��^+��ƕ��ġ��u�������;Q��F�u�������l��aL"��R���?��Q <vd�.|�嗭g���>�w�d5�pbp7[�sˉ�)�����8+j&M@*��x�ۛd��m�d�.�@}�6�%Y�e��Qv�����9+��K�����ɕY�ߞl��������)M��)��f�N�7*h´%M\`�2��  �\���������sĴ�Ԩ���@��H���liߥ=�~�Y V!�"B�wj9.e���LLҁ��43�P���z���z ���"�A7��P�m�!
���P�"��8
y#B��|�ژ>����R��+��&韼��?<!���?�w%ֹ	P��:>rl��ǽ?{�j
��WLSve�'9��<ՙC�����{��OW��Pf�䠞����!/�-�D��_�k�鹶$�G7�d�I�#��n�(�	ӹ�pm��E1�g��i;ʖ��sp�ZKnb��)���=kzͺvv�ט;+�6�mW��<a<�IK�Mʘ��5�f��X�[ƍ�uf܈yޱ��τ�CSL&�hC��]ʴ1H'k-o����rm.��W����q�:�&����k�:�S�䠗�ƳqDx���*<S��e��.;T甆#H�*���"k�X�(<�*�*���hEE��9id��6uЂ�]�����2~�h���G���H�ٱm})�x�d�idܻ�p��>���CD�翦D�c*2�A�Ms�Ժ�
d��~8`�݋`�:�GNǏ!�G�{��t5�8ݥ���e�(
Ŷ+���z�Ac������~�A���S��g��Ӷ�oC�OA���9?�)��d�/?�ğ{��R��a/��X�����7���\���6qmj[�F���)��dpb�f��_��k˟Na���<p��A\�a�����ѱ�*#~ь�A67�844ݼ�>�3	���*�7!�OWj~�$%I#`�.r#��v}U�udw)=����� m�D�����=�SnN�~�ƜF��)����v�_�2|�xp�H�ڦ�A:�6����ƞ�������	�k]P��d��ق�#q��&�����2�J{Y�Ї�iY��[�M� ��Y��y'#�8�OH#b*cEΐ�H�;�!���d!�\����h9r\60񺱘��S�k�FݨRN]�^�3�/yn5����}d̾J�c����W;���f-����q�C�yV�s���)�PZ@gY>�t�N��wb�������ښ����[?�u!�iy���f)
uD��h˔k�ʙ|>kQU0u�롴���$-�:�%i>�ZO�L;}�����aij�8��/N6�nHA��2��x�b�y��Uֳ{�Q���74uV�X\cGJE\U�8�.\)�v�AU�F[�Fct��A��M�o�"��J�C(��yR15|j�_7"<>��U"���s�t+m��ƅ{��ƞ����=6)c'޺�9���D]Ui��ny\hE%	��q�ȢN�����C��)�u�� �V�3��l�9`��sxJ؁��z��ߦ�140V7e��"*C���WN��NT�+N�c��s���6JŖR�N�V!�����cZ�C�/�T����f������/�%��Av�������i�{qi���'[�k���s�e6������2��FN³�4V�� ]���H�D��Pv@�47үʳ��PF�6=u �0�[�Zw�����_������ׯw����H�C'2%b�8��
����ږ��z+t)�w}זS�O�kj�d'��rv-�u�B+Mp�r�y&�9��T
4�hBJ�sA��-�Mʐa�"�,m��0�\�811��D���6�˛ E�ji�ؐ�EȬ,s��u��?>���Z���uLU��yn�ȵ&�Kk�;�=H�5
�)�I�����0�<�4���5���&v���;l�ǎ���?��ɰQ�}���������r���u9��5V��~����b�d���k��������6���,������HV�>���~�����:����$4���������X
��L���n�O?D�+���eNZc�x�f�ٓ��'�����ک0�D"x�8���<f��`=e%]ۊF &)[,��>]��"e;�O�FŶ�q��?��oȱ8v:��}k�V��-�T%�U�$�����1�l��� L�-'Jl�\���� �p����#	��n�?q3���{2��Ɛ1--����6ߞ��biqN�m|j,dH��"�qf'	y�p4�=(��%9M�4ZXV�6�轜ǦяL,XO��}+dq�@>�pr�/�J��]���;�A'A�+PAӭ�a�  ���}moɖ�_��̵��H���he�$�ʵ%E����a\����&���iY��_� �{���Y�bvY ߒ/��_3 �rN�uU�V5I�3��#��U��r�S�y^>�����1L��`)�&�>$�s��pm�vcǲ5��!E�5�"�J��(ʹ18~1Yu鱖F��K�51e�2g��3�� `pOm**
��oH}�Ռ��]�",\B�F�^ύ"Tfo�oj1����.r����*����8Ǖ�&��H쮬Nm��1ב��#�#�`=͕%�P�������F�&\E4��L-*�/J1x���F.��pb�nj�SV��Yn����i[�E�s�=w�>��G�Eh��R����=��u�xH��S&��Ք�Ϫ�gUᳪ`u�2UqF�YUX�����)T��FUH��5r��賦�{���4�1y�K�G��59�Zܖ��q�3�]��;c��N�=��A<.�垹GgX��Y;��|���Y�v�9���&,GM��?	5!���(�;�5'k�
���T�7W���ݞ3�����0s���n'`,���y�/�Qz�u��?,����R֏�%W�����4�(��I�d#=w�oyạ����d����qEƤ���ҥ3z���0�8���3L���������=��;W�{���n��g5񳚈�g5��=�TJ�@>��KR�TD��FAdZ�a*���C��?������g�/wS�
;��p��2�bj�F�?,�I��Ȃ�l��K~�Y$\'�a�}J�"Kx\1Mn~t0���i
]F�;��
�t6��su�Ej��D�|6�Ӽ��AÌ"�M�k;��1�U����(��;Ͻ!P@���-c[bԸ�Li��ʎ]�Y�`)'����%J'-����C�� =��. �x���Rjc���J�=�(ƥp�2.�B;j5�w�A"�;��c��T�m�$8��{�o�ȯ�,V,"b�Q��M��S����,<�r��Yɞ���٦j�	�tE�?������[e�ˁ�'�_L����$���jA��a0�qX����wrU-�G%A)�GUQ+L�eF�Ֆ��(4燈8>�[���*Mr�0
����D�[��!
���"�:�;�Y�pWX����^����VX%0Z������~a2�)��e��^t��H@�_���h�s���Z���`u����^J���}��!��Y�T�ڂ2����1��fv�3�>�,k"^ rh���D�N�E�e=65f�Μ����@B�&<g���0��?�<e�ӫtV���"u��Un��NGm
n3�$���N��0n8l��H��o�
V�%���Ɓ��ؘDB\���?-C�K͡�k�V)ԓ�'SG�*��fm�/f���]jZ]�}5g�����kI�f�d�x�u�!���t������~3J����*��і�)�I�^��-��L��/ �S��u�)#vq}��o��$�w�������&�Er�/�8(��^A^X��.��u�M�r�݆9F\63�&&ݎ�������:e��;%O,bI�6�M��9Hk�k��.Pr6f<�g/�I혗� ���*ɪ�XfG�E�#�����ȟ���Ȯܜ��0	��TG����O#�S��q�'f��4�AW�/�_��s4���PÒ��ͼ�w���`;S�.C'�S@ܴ�a��_#�[�8�����\�b��*��(aW�MdbԩQ凤޻�=��0E!�H�����`!0"�M"�K+�˦�)�b~6&���գ"V�C���6��8��1�&69K��0�����[r4��zT�"Ϧ^���v�\�ԃ�u$IDB� ;�+�R �)�g�Q�|7t�ĉc�7Do�|,χ�&�I��7�lX#�)MgB��IA��-#��O`�s�`ZXD_ j���!M6"2rI���K0	�wx{ω������7$MJH������{��7�A=�{A@]��~�8���v�^!�Yz��X2�f̷S���Q_A _���Z%������$��)���~(�����ѣY޷E� r�#<:������D��'�#�-ns�=��(��L�9����|�`UE��w4O������m�c�˛C��8�Mɘ��<���=lv�L��FGu�:4��v)�I�'�߅T�*�K~/S�JF5�o|4K}Q2���G��}�����{"�xV4hi���wG���e�Sr�Ը�#���;�K�`|���U��I0�`�_�a�O�&�]�4�[�jU���q���-Lv�J�O�u=�R+[P�N+c���goD5�5ϕӜ����K��w�����z�<9?�^<?:��@x�19?:;=�$��������{yz�S�\m˱f�� l�ib�"9�w�FS?��u˗A�9�dŲ�4�s�c�@ʙ*��/Ϋ2�fK�L��V{a�E"�o#7�R2��乚�߇�k&u>n��R؛�90����S�*�]ޓ��
�C�q<?�b��侓��h��uᅔOyw׆w�u��)x�C����o�r�����/��bɇ�{km{l�u�;�a���u�y�u.e���Ov�����y�98=�8}q|ؽ<>=���$!9?=}I�OO��ŷg�G/�H�����E�cfق�[�cd�E�*^�Q�'-�������ӫ�Q��\�G���"��JB���+�A�h�B��otR�tc�ۆOI��9����%@.w��$'�������z%�T��
x�N��s�h%4��p=�q��K�� �7�A0�<���$��J�!厳�$�I�@�A��4�lڌb<r� 'k(k#����Ilyy����;<Sdc����WF��q9ȃ��<W��Wm�Z��S�)?k��<����k�rH�Խ���T�wi.jvܩ���	|)^��J��%ޭ2�
����[�����:��������:��$�Mť�����л�!�WN��V�aŁQ�h�*�|c��
����ŕ�{�J�7e�a��z"��� �e���GC�2{��^�m)�K�z?�]�l��PgCF�'Ǎ�ػ��]Y�zv���NG=C����޽)���~	��Y���`��e���7~���y�"?#;%8���<��K����4:�k�"���k���D����9Mn���ߝ���~
��%TP=�������]NL�0�n����=����i^+o���O�����W�j�r1��ə�r��xH���wA�Y�?��v�;����f/������x���X����l>���*�`v���"����oԃW�YM`�F��|�c�\nrs}�	��c�i����p
�����3��bsw>H�.�}B}����{�=<zy|@ΎΟ������I��o/�𘆝�\��h�#}�r���0� �N�ۘ��T��*���/�I�o����ѝQ/�� �t1-�!Y�(�f4Ky&%�3@�Y��dr+���)u�U�ѪQ�����T��^=����Z] س��c��� �b���
�4�t'G��>=�i}�E.�|B�1}�0%�M!6i��)Lr��^�"*�S��SL7��G� ����iQv���	�1�!��d���oa��B��d���\�.�D�t������*�1���ѐ�l�?-:U�������$�j����p��{�rG�̪�-d�m=�
��n��ߤ	�{m�O�a^mz�q�4(���A�"*s<���D��h~��Mg�Z�h�dlB�J`�
�:�T�Q�8`/@o���ew�WꝖ_���{��k��W��Y�be'�x������Y�1⨕���n��h�O�C���w-������u-'�X1-��	�.�j����O6�0������q�W��<�[]m;�aZ��8��l�G馴C0z.���0$�i�p�ׄ
���
x7 X�M�Ц�l�};r�77�2�Y--��d��Ɂ��3a�CV�"^ �bH�Z�tT�O�߻�`�@��&�Is�0�˫���X��u��&�>?�r|�6��������N��� �a�
B�������ʖ�e�2���1�z\�X�	�e��I$�ځ�$>�G�����9��E�F9�!���L���G�_�W�ۯD��b�s,��;V(�o�*0���h�8y�4���w5m���֪v!FJ�Gʰ�d���+�"�e���h�Vt����ҋ�,Y����S�z_m^W(v]��U�'�����ӈ9�,�k.�a3�v'���`)e�/�W/}*-��q|H�Wms%�3�)Ɔvcʉ�P�B����d� a^��a(��V�B�r"Xr�FoM^�8�3/3�`��� �9���,��u�1��nY���g�M�jfp�t���h+C;���i�ϤFb�8��ơ��K�z^m�&�׎���l�xq}���xظo`7m�}���l�f�����uVq;���df=&�Ȃ���(1��R�$J��9���1�����K���bOM�Ĕ"d�����h1� �vW$�0c=�A��YҮ�)�i��;�1�sM٤����;sN��g�ڶ�:`Z���D��^�2~tj����b�}3r��NXHɕ�zquŦW��Ĝ����]�K�*�����%m4�����o�ZT���(Ƃ񝐁�F꼸Z/��U�6�����b�+)���I�kÖ��1`ȕ{0����Y��ǿ$G��]�ƈ.|e�#CW����b�!퉫����&gH7�ϸr_�x(_>Ё�,^�(w��H!�gH�sh���D�1TEs�e���Ø��n�B��F:2F�a�Cz�OD<g�NV�?0���n��μd���#�AC��',|6m�.
��hJyj�������
��Q��1G=͍VQ���,~QJ[n'HŊ5����y����U�kǏ~ºZ�\�ykj�Y�YO� z�?�5sxN_A��'DlXT@�S �C�9u3	щ�~*�y�yd�f��ܥ�sB!��U�OT1���M�a�>�&r2Ũ�&W�`M�f㈎�����!�=��]a��|a�S;�tu6Vwk����(?�V/T�<ɓfҠU��J������p�`"[�j�����7*Pt�m
�c)�X��\������U6.�1����S�?�y~:H��S�&#���?"�4#-��j˛��a��ڬ�E�����{g�T�Ғ���m���Z����C�4����x��^Z�njD��`G���%o��!�D���V�ȫ���~$H��vI�>�$�Ig�q"���I
��q⁇�!���'��s���`1��I�����<�z��>$o��.]i�(��;^F�k�/D���@�Lz��;�-�MG��1yD}�r���rÄB!Q�w��r(9zaU��7�G��NC� �ȕ�C��݄�+�j�q���eDZ�Zz1���n���j����h��R82�}���{�/��PP%Քn"�xAC!	������ӕK��MY�֚���ŗdKJ�k�K/�-n�����@V��NJ�J�d���l� U��#�3/����q�2��(�eB��䢠�2�3�f�-O�v��ō}�З}����A.�������������tk��T6�@�蜢�S���i��+�@WN 2�}���Yj%�t�<O�h:���@m�f�P���l��jK~e�Z*�FB�J����56�����Sf���3��6��_�zKͻ5{3a��k�?(�h
�o��%�u��΂?��ohyCM��<�g��b�gx;���hK�H��[�L1�i�����Y�0Z�w�'����D.�n.�Ț��m���A�m���h7��`�&ٔ�v��=L�Vf�7C�noy[Z.�Zc�<`iϽ?��t�š���Sgy��;"�0�5�;�C��.b��AJ��"��t��Ŭ,�h��1Eo�����_�f��&ݭF�k/�yz�`�2"�hb-x~dpDi��5K�ݑuR  l�C��͇�Y�/b���K��e-Q��d��C���t�ټ���(5	��g���@cK�L�K`_��A�Ny�Dw�}�rz�S��X�8 ���V[�y�@�>���s�~��Z����v�$ə�C�������%'2߸���t4M<�Q�:�H��G%��fV����ym�6��{5�Q�ߞy"r��V�� �c�E�:�����넁7�&�١����QΒx��4I�$�`�"����Ra�+���:8�<�S> �#�٤�k�?�Œ���3V'U�W�Yp,���X}�?�w;u�`n�f���#�]ɐ1t�3lb�զ�f1Y*�2���dSF�;a���(4�ޞQ[M�ds�����tp�y���\�J<�����oZ��K;w
��ٔ���R�?�6��G���u�kdk����>�ͯi���29��0�4�3;�Ղ�3�U��{��cX�k��ܻG�Pt�B�0��Be���"_3ӢVs�Ko�t�����W�Ժ;ؾ{�����%a�}���2��:�SsĬS�V?�>�Cw�M��=j��E���L��I²Үܑ�⿒n��|"x�;F�w���2����l}E7�v4񽸹�ZYmO�	��7w֯`-L-����*ߡU����Ҝ���^S�����i��'��� �1���B��9QoV�{\ҹ/
|��2�غX��ӶPŏ��@����)�f\C���uY�ƜZh��܈�>[��K����C�5C�:S��v-�Sgy������5�[����B�c,����`N����^3Eۨ��(W�ϳ���y0��J!ۇ7F�]�wK�y����߿V��[ry}�O�;�Z�!��jY�c�2�rߎ�M���z��3��0r@i���0LO8c
q�=��n��\���q�2vA����b��zi�����ڨe�傧�X5}T�|��Oy�P�<.u�I��0�8,(�f��:��S����5Wܸzi�<SK}�
W&>V1�kh��O���F�-ƸX��+F�9�٭����_Il��E����ZL8��#1� �I�GI&&�'�pJPgV�չK�T�3R��}��G�Q�� �*�VPtՐٚ����&:�ӤɄ!����z�객랕�!3ϝ7Ӽ�+?����/����ߕZºn�ۭ�@��X#��q����sj�x�n��s9���Y�ڡ�n������7�R��93I��X�VE��nĳ~�Q�[���l���%->��cةr�g�����B�p�19!�R�̽�a��O�L�f�6ܑ�`��_�9��(^&Q���j*�5�� �>G�����d��W�y�*���czdu��&.�,϶�W!Խz!�(���s��ig���F����:����f;��zf���ګ���կ���ֶ^�k1vLrշh�+����5-����HB�z��t���}�s�:���i�%��9�m�Z9Ay>*Sz�t0��C�电g�MW}�&���S&'�ho�'ﭳ�X�!n�����~��*'K�}�����X�r�n	5 #⪵�lx=5Oǖ����(
Մ!�Ċ%]C��XdҰI���z�&-��x��w���D�k���v*�G^���F;�BA'�zMJ�6���2��4����f� N�Q:6'���Z�����t�vN6e A-TR[�|���	H�uk����ƅ��Cv���Ί��X����4�Dy>Sړ�7��^_�羟����S���`B��J$����?�����,N������[k���F���.���~rΤȌ��7�L�1��1Ԙr��W�y�G��9�p�?j`$�\�pS5���g�,�h�x�N���`�a#b��q�b-�Ms2A�V�A
�|L�Y��+:!��=:-��,hiCk9w���ع��%�s�Қ1}��M�E����lk���<�OYPOd/�(��Dcd�GU7~
6���}`F�S'Œ2�L�d�� #U!>�x�;��1�"�<s��¥z���g!z���Q�|�x����\a Z��Ua/8���X���!��Fy���*ͣ �8Q࿯�0,EM��L|��H�톏�C����T|B.K��_a��L9�A)����|Ʃ���(z�"#lH-9�)���LID&k���7�v1����<H�@��5l�z���jh0�[D~�S���Z�p]&^��0�Z/� <t�^1�@m��1y#	��������Ĩ���7_��ޱ��7_�Fwċ��wwoV��ɺ�FVV���n�.y#콜6i�o���F�w�tԻCm8ղ�6�\:	ݾ�YX�[�Q�鐠�mF����8n�V�֩y���ڋ�?"�Xr��W�m�כ�<������;�B��I��1�X#N��=��x
���Dތ���A���!�n}߹B��:2��$�؞�Gz
�%Bb�5�B�g����=BL٦��^����CT~ϙ8W���֏<�ڳ�.9�Hw��eu���u�'z����	,B��w9S���!q�#/���1��S3�a��дI�ߧxd������^J�ѱ�8!�8:P�7N�aĩ�7r��$Z��`㌜k�����q�@��N2a�4Pt-��,���2Pa�G���$���5�=��0�$����#�����$�D�X����� �PlG���Ar#|�yO�2�~��Cw@����H'6ҫ���-����R��}?��b�YW<ڋh{�x䎳�7�y���$�)�@�'|]x�!t��ި���tY��a0��t�p���&|����lS�����:�^Ha�������J��qR�����1GW�;�\�cx>�p���F�n���̥�FY��͖p�5`�\WrH0�E�|M�įYuMwl>P��I����^U~H�}�1���{I�VIB��e&H_�|�ƙ�ޡ�cv�Ӟh~���`�T��?���b|A��I�i�`-�\A��Av�ÞvK���s�S��^bvU�I��0�[N*9���C��M��+��t�	e�d���.��=`<�O�]ySe��TyKIc�V�,��g<y
ˆ<CH�d]P�x�ʥ�s��F� �gF��j[e�%�/��l(USi��x�B�b���͵�̭��0a��%���LP��'Z��{xyt�ݴ^=�y��b��(R���Kc\�,��~e�-��:�6�i��R�C���{��fq5+���\�޴�r��[��Y��.��J`��_L�"��J!�L�5eA���j�#��أNL�ե|\�YpWXMm4��� ������e���]�T؍�QՖ/z�+��{C�vʿ)]+Ō��'�+��:�9Z��E��`��-���FP��z2=x���'3j�tq��^���@E��2׬���+�������vO�c����q6�)�2)ʸ6�=��4ʯV*3���X�O�jjҋ��� ��Q�ֽ�O1&�4�f����'����k��H��co<���W�i1m�U�*c�3�����plH�mC���m!kr愚y|+��P���R�c����:MWH��X�D�\LPg[���n4�IH��
5Y�����iFE�ҤICMV��}�E.��I���2�Vj��HD1,w�E�L��%��L�h��%g;�&%YБNF�+Gˮn��ܱ��l6�uMn61ZbFhq7�ݣϣ9�
t�]9�d[�����r��JG��[9�`��y��<K�
*S��u�8�ڝ�[�i٢䈬��[�L�p�S�A@Kb_�!D�7�AJ�5�����,�2����a�8���AQ�/�`z�nh<'�lF��" o?��5~Z�.4��w��ޘ��t=	��\�4��Y,ŝ��'�ca��L���%�'��+Rui�9�e6��&�Kҋ4�*V=F40��N%�Ng�Y�6��ۋ�i_B���t(�z�f>6�qV�:+���K2*%G �5t�0A�Pت
���>Q��HH�F�k�MF��9k�SeǠII�_J���h�6���\c:RCU��sO@�lk��2���<,�����#L�����Yx��W3E��]����"e���2%���G��޺g�ل>���g콎���Ḗ��.w7�*~v��i��6��'�x������Q��H�29����hHGC�ܴ�Q�T��/''Џ���a��yp�vg1������� ^�X�\����긔�ٕ�Tq�Z؎�� �xٍC�Ͻ��`\rDj�kyK�xܩ�x4�Eڢ�He���%����L�����Eo�8_#�VWK��9��4���-)|hvV�����f�1����Y��Tsz�5J���6��j�Ł�I7<؊h��[aF�
�O񴻹�z����V����BQT��O�wx|���xb0�嫸���y?!��<���0���Z"
���X$�֖B�����ȓ��W�7dsc��,�յ�/d�A�g�����L�IL�q�F���p#!/���Ow�P�4]'��P����0b��w�@��r����Π3�#��E��=G����m���������Ӱ�Wt�1|�x��S�c����ݑ�a�]�й��єwZ�t6� 0ow���1�P�~;@S��IU����irw�q�G�Ln���ep������$��XЅy��^A��"77:�3��L2����|2�B�9��Q�V�cl<�fƈZ�gs:�K�UԹ<ܮlUN��L�;]DO�.�r���(� ��D
Q�u�v�`�!�!k#�s5U��4�9�'@Vx?�za��Aa�c]��]3�!���dpV��{s ���T�8K�78�F��'J	i>�����7s��)ɂ�H'��ӎK� ��������m�!�[PGԙ���Q��ƼEmʢ6M�2#B�\�Մ8���q�B(�/�o$/R:d�h3p��qܷt!)�w����La�@����v.��ya��NsƂ����g���t=-�P�����g�q��I�����
QU �&�}�1辔+'A�����il�1%qH�ġ|����3����<�)�l��|�ܥq$ҕe��q���MI>&+�
�3~�]���Z�Ql���w�J�>���_��P�ᵈ#�6�&�k�뿧�Ybi��6��f�&���Ȇ@��fP3��}Iv��ʳ�bq��>F�p��$�6X���!0J"�S����6�=U������Zi��#_n�?[�":vs!���/�m	�E�ܚ�u[i]�3�[�ȗ�
�F%}I���dӚ)�� l䒖Y�2(;M*���eHŦU�0�l/_`�E�ˎ��R[Z���"w}��(w�2N,:�/	5��!S�Ab�X妕��s�+�4�������,�F�B3���ۀ'�W`���l�����{ �iJQ��YF^��<�,7o:���L�k�X[X\��>Eh��
1�n
�)%�J�(A�d_���h�w��U�����j(5��*]#�,V:sn}����鉻�z�e�aǇ�0�~�C�{�H�����Ӕ��@�<,�"��t��IN�켿i]{��B�E��/�=o[t�ΰ�6A�ˤj�J�D�19�����x@�G�㥢��.�a*�-��r��E�F*[��<�>:}(%�2{r��1.Ԡ�Yj��գņ�&��3k.I��h��.3�D�[��0	�n>	$P	�"9�	�yRfʈ�$�a@��M��h ͆�S�V�O���4>��s� ����>�6�A����=`�~����g�T68I6?GV8r�<<8#
?��4����U��:Ɏ�Xh�W+�	t)]]���=υN�?��ߋ��3L���砇a�xl��'^��[�� 
Br��lxa��EjM��.e��~`IaJ�#��C�& X�E�ơ��Y��BHS���P��[����5��5��V����=ST����+����LR}��XiUѠOt8���a�ٚ�_~��A����pe�-q���d��Q!��Z�K���%�iA�T`���.0�)�<oڃ��${��7��",	NU�"��,?��خJwp:+j����v�<�z}
Ԯ0�x��P���QX�)s�XOUVy皼5K{�I��H�8��˾3�/F�3#7^?RO�:Uޘ�����
�|�*6��(/��}�J������Q�S�L��Ȳ�� r�0�Ay.��.�vJ�b^=�|�\�ZL�:V�n�ʛ��>	���%]�653��A�7F����Υ�7������~���������E�3$:k�F�I�����*���jtpC��
����S�� 	C�Ҫ�1�x�������hE�<e�h�S��G�L�*Be�������^LD$���[:��M&��+a�(�)���z�>n����4~SHW���W���:aǰ�Af�`X-@�5L/���bxqZCIÍ?\�\�i����o[��߮��z��È�(�����3�t�dL�0��	+w"��+���w�s���;���#���)�p2����UP��� J�/��,1���ȱi�&/�ʭ�o�s��LƲ�0�E�$�Q�P�Uf���U����Ŀ����_wY��Bɮ[�kl����S�+�O��e����D��a_�>iθ�z�*A�:M��{�MÊ��ʀ�Q?Pbc{��/�~.r.���ׇ�Z�Z�@!Ӕ�)�+�̢8�b+� ,|�,]:��L�������"Q�"(v����^m��Q��QԊ	�Ţl,�U��^β;*bŖq�"�,��:v��#�򚯒�����7���k��#�159
�4�ʱ4`U/A��6D��C�u���G��yĠ�������/h*}9CFC��	[��ف�A9�e���dw�򗶇i�������Y�:y��[�j��٠Sň��J$���ݖ�V�ѭ ip���0�ˈ&a	���{��&���Qe�+��@�����6���p�.����_�;(ޡ���LC�#e��0�l�%�����ݝ׫�����!�����/����R1�m�[r��%}#[���$�;��m<�Ý���B'g�T�8ԝ�Y�4'��0��h�և;U��%r�|s���>[)
��"BA1���X"��H�>�529������v�8�Wu�st�+)�̱6E��R)eb�O�f�cm�j����j��R�n���a�ҭ��0��9G�M�vء>���U荲R�˜u�q!v��ڞ��^b��)�NeC�#��Ǒ�M��3��.�^�X�y"�1�Wf�����#u,3 dsC䤈G�9Sv��W^iy�|�q5�u� 롩F�Z���Sm���Ӕ�Xb�N~�@)��y�*�=�����K-Ms��4�H�N���ZW��<�wiطP�l�Yn�IL�aZ����ҽ���Nڲ~S�S�r��o���nml�_5ާ*��$�L�V��A�ƒ
d���+�ݱ�ª7��b༬�wU�Z�7�oYb�-=��0ynKI�H��B��*��
񝳤�������8�����Ǽ�b�h����Oz�~�{���F0�~�.]�����#?w.ӭy��&^|��\v���]rv~����ₜ���_������G�O�s|�m��^\�/�N./ȋ�ge�����Ll�ӫK�-?��~�s�~�RuQ��NF ]C� C
�E	"E�^��� $��9s� >j Qv��P�N�o�+�J6݄�����':�$mAh�UUlI4�`�*;�-�Pd.ǋ�C�!��9�ۈ���dQ�����TT����݂j߷��W;��)]8�,�t�A�r�V<,��x�ʕb��	D���TV�jk+1a���@�F]�iЛF��T��b�;
� |�Z�P%V�M�1�f6��$�3;T��rD�Y4M��<�S+V���M���	�N\���ļ]�(L�U��b(�a'���*O/jI8����H�*�	ࣾՒc��A�O ������Uc�*u�̓U���u]�2e�H&ʹ/k��f�FU|��V>���� ��5$�C��_�v�c�~{��H�
��0���b��6�S�;'{27B�y@�xb�xٷ��9,կz����Lj.����v�`����$1tU��`P���o���ޟC�5B�-���i�&�fh��F^�9}#�;l'����:��S�(V�7�P�U��7Ɠۖ��D��M��D�_�Av��ኤ�$A"���Q�q+'ӑ˜�,_:�N'D�|F��^��[
�fik%{�F���D�
Z��c�C�)�[t_\at2f��{h��Fis�]F�/���dƭ�c��-a&5%��yo�d��wщp�йb;DJL�w'��`*��O�`�-H9uڄZA84���n�{��Dz|k�z���f= ����D�f�4$��B4�\�����!R�N��Uv��
��e��/���-���(&s�����(@K�I5��&���N_����X[�iu�=k�Zm 0t����lm�"�O/�'��T+�с�_�f�)NX����u�J��+���]uS]�e�I_,b't�y��1;�%�n���V��D���jm�Ŋ��FBP@����k�`;5�C�~e|_|ty���@% d�*�.�0�;�Ҙ-�*��H�MS.�<�c��"�fv3��غ���������}(��vl��R���V�UO6E�Ɇ�/��~8��[;����ȕ�M_���u�~=ũ's ��I�e���Uk�M���	EYR����fmX(����Д�����蟗L�G,�^E��\�CM#ϡ.(��Х�Q��u|c���EP���m�a�k����B�G�N}��J]bJR�#�c����_�v��xod�z��G��Ǫ5챟VL�4&G��^�O���)m3/8�2���O�,��-�s����t8|�@���G+���j�S��mi��ݎe��-9͟�N�=�(��ܲ<�f$��(d灂���B��_'u���9hH�Y�L~(u��K����2�Yx�T�
��f��z<��}a��:�B�a�X��ox�n�P%Vmq�<TȾ���ǺwjR���GLU�'S�l���\1�)�5��A��ꅭ�;�Ə�5�����/��idG뒽��2q�ȥ�0�LО�$O9�Mo:���H@��Z�)񩸬؉�B�U��kMWnS�w���U��`�ğ��N�
p|IJk8���I���|;��~ә{A}/�u�ك����$�����)�I(%�����T̓��F��.��3��Lc�zR-��U,��e}���ۍ�u��g�\���p��}x�\�ǐ�B��&�6����=h�;���Ls�I���\"&!�� e��NI���W]T�U��`������Y�iz).c��1s�^���և]]���4��{��~Q�-��i�f���Th�72��:�G�����c��b��x̸4Ż!����y�`�
�d/�����a�&
��;�����iDƸģ�0
Qc�4�ƽ`Ju�ׇ�Dy�P��$�ƃj�q����%ݨ������zpe�F����E���愮��q����(�G��	'La�(�'�(�xI?t�Q聆�:�?�&C'��Wvb���w.�^��%~��$W�tA�A�\�)�y�$� �)[�+��[17�{jhE�>�1R3�){���V�N�C:Ê�8�Tu�D}���9��ܺ��֫�s�91s5�E[�	��2xi��oT�,E43�S!����la�.�-ۑ�A�4Ļ�\5�ȏ����p�s��b�?_�6ݯ�k5��5ePY�"f��Tf����=I�����>c��v=�>8`��D��{RF��Ĉ�օ�b�S�K��6`Q�hK?c�b6̩�\,�
m�7S2��$�K�-o�P�q�����Q=VF;]o��p�.]��ˢ	�Z�����E�O��"�����-J��qM����v:Q�W%1!�w[q��<��y��ƺ���C�`P�QS{Ic	=c-f��1ļ'QAb��*m��ZUe�f��zj�).��p�B�������<��z
�
�R�e�%�
�tO�yʢ��X$�����fX�8�2�m�&�0����+/w�>��|�����{:�;��׻��[{��T��R�=������;���5|؞Vh�(Q`u�'�/J�jS�1uM��-	�j;	�Ҕm4���`������=/�w��]�l(�R�Ch-�vø0㣇B�:���)�;T�V	ы=�[��67�ۑ\�
���k+T(¼X����Ǧ��*e�2��?{�zz|x�����Mv]�D/9���G�"��Ϋ��4mS��>f-���T�T�D���Ҫb�v�m\�	*G�(sc���=�|��ϳ8R�M������ �!7����d�d�^_{4ˮ��ʔ^�M0C4/VB��^���0� |��3�No��X��c@�s�l��d��D+LmM7���M{2*n�8N�s-MX�>��z��T��bW I��������88~����s�aϰ���L��`~���'-k�6��!"׫�Ίd$�0������v�Y����ޯD�D����=e�2�O�7�-�T���Uj�_=��*O��*if�Ʀ$"�ΆB4Pp&Ks�Q�'��S0�' 7����e�c�����0|����&�NB�K2IE1��.演���Q':�,Yz�C���L�e�h��ʄ$0�v�t"#*ML
� M�("L'�(ʬ�a�������7Z	����Î6�sf[�U�I���g�:��@�Q�e74y�b�{�1��u�D�b�v^%�{� F?�2S 2
�D����?�~=>$�{�r�}���nu�H����I���7Ђ8�NRDgm�ߎ&�7WZ+��I0����rH(����T���1`$o?ǎ���r�D��f���y5��Z�hL�F����6ݥ�R����j3/�#J�"_��� r>��棧�o�Su��.����4�@���vEX�N������$u�H��Vʑ2�e�SaSy�E`��������)�~^�Q`�-��n4�c+��W.5�5�etW��(L��@	��w�]�3&b�{c�ϥ��%<�[]��J�8 ̮�����tQ��h1��@�\��t���߆���8���[rSN1|IuB�;84m��tȧsEա��f����D� �̳�͔zm�R��[��*�gں�z����Ä�<	v	�ZQ��8���xG��*�m��e�Ql��r�2:���^�5b��׭�H�����6�k �kvBcy�t�V��n���o�3���.�o]�yC'[N���DL��s1c���f�2��i�H�-���ؿ�n`f_K��Љ�"MM��>���oy⪡��D�)]/D	���)�o��n��\�Qs<�y#L#���sSB�@�D��SFt6�v@N��%�yL��C�������"��w�u���ΧhbC�>7u�&W��a�*�ű���߼�
�C�ǒ����H���ԢL��*�g�pՋ��(�,Ƌ)'�\1c�I�h{C��K�_��*{�*�KS��/_-��1�� E/��"&.��Z�n\�o�ض�4�R�Sd�.BG6֒Uz���IS��+�Җ��e+B���eZ����)ڝtǎ�l�J����D������
v�Qoq�	M��J*�5`~%6�`�D���8NtXD.���Zql��K�)efNڦ�9�^	���&Љ���f6l�Ŕf���y�!kE��tlT����&W1��efW�,���fE*��J�F�
�lAi+��D�Ot�QG9w�o?��S��-&◳�����E��_�#IZm#�����x�<r�O\�y�`��g���g2I2z}�J�趏H����N�XG�(4����AY���W������<�ȅ���Ohں_��F��Ť�!߆x?Zc��e:�+�Sa�ң��a0�d�����;A4�k�Ě$DE>YK�ڏ��ݿ�� 阦>�� ��C��.9z�s}��"I5�[�YH"X��-��o��MFn���h9m��j쥱��dz[����E�{:!$���g�����W:�����K���林���B'��M��$`����}ϳ��#t;e�A�	r�7��r�j�w3�`Y �`�"�B5�IxD�{P_,��I����D.-�L|�����í���(�g���δ�K���E�y1�<W�&'��}�­l�"��T��,�z}5J	)���R�2�"��¿%Ё�$e� ���� �v��������yPCD!^���`g��y��YWѰ+d�q1�T@є2,&W��y�{C�������sV$nŬc;�mDz�=�m��3	�\8X_��|E2�"^?�c\_/���G�5v���L���E�H�h�:����CLdnhH��u��ޒ�F���<̖ι�d�]��8�4�P��PʟnWHT1�X�����.�
��z�C��6I��.���*u0g���r��f�D<w��.3h{!�����8B��8 ���H)�/����	�Jx-2� ��O"�9��z��o�CYޚ�*h�ŷO�e�	��%ߞ�|��ۗ��E������G�;=�������xqzн<>=)(k��lA3a�\L�.�+�
����M��S]�vӻ��t�.�-��k +��^9!�/�i��Ľ!�ș�E����:sP
W��e�Q���$Ny���(��i4���k@9AHz�*��X�M�3N�����+�:S���A�J3K�]�RG���&����/5���{x�F�1�o�ZFTGn�w ��kg���ғ�4��7؃D�s�\]��$p*�3��R�"��2��rh�b%���S�{2��n��̀&
zY#���D̗���EO���n(���q9M��:F��q�-��Vise������GR/�|���>^(`��'�d2��h��wt;�!�rǿ-ɻ�<q�-x,*"����`��!�� ʈ�F1��.))a�/�pmo�V\�80�q�W(M��L��UfU_��-]qYq�h�
):�ts̆¨�r"��Լ��gFy����Vk{�س�'�*��   ���}�r�H��di�G�D�F_��jhI�5m�Q�]G�DB$� �@�l�"�6&v���D����G����}��s�L �� )Y�6��,Q@"��������n�����K[�~��I�vvD��BʹE3텚���lm.�Жlh˯!j��ް�~���@�z��I��a��:�r�"�wg!"��bD�G2���k�L z�]��$qԨʋ�t���:VK��Y�?s}Uq:���'���n�+�E��ŏ�:��Z>S�'��7��+C$m�@�,�(n�$�/�7��v|�Gؗާ��^�r���/��$I!fĥ �Du�E4��:Ō��0_7� U�RUzH��7�L��-��6��Cιfc����-�g�v�ۭĘ/#�,��Wq�nʶ���U�خ�	�h���An#90�����U�\��=�ª�G�z�L�I���Y/@���[�{G���@Rׇj�����=T:Z�E���+�&���&�az.��7�Ze�̒x
���
 �Eݧ�@e4��e�da��S���^��������g�ޟU����(�t��Q&?�����D~�y.�[�6���K�p��JAH����=�����R&���ѐ��	HE��	�n$|�4k��Y`�F�,"��f{{����#5�M����>?K�E��~�v»�����B�D���#/jTO�F�RQ&�����&9U� -�g��� �𯗏��.
g��|�3D�W��U-7$q��$��/���,�S�{U7Y���
/�n�ܜ���̳��a]z�^�w�-*�:c�XT�� ź�o� �ۅ�+2+��}q�.�����[`���#5pG˨y*_��*���S_o���Q2B�9)É�H�����/�=�myWj�t��]�ӂ�,�m<��4��0�[�~-�jяb�#�1��^�B��Y)��l�]0�}�WA�]����`�k{QiSӄ�J�m��٣؇qGK'p��G���Sͮ���;_��bY����_ջ�Z�CV��ag��h����u˖�Ő6�6�P��D�!��ņ��E�ONp�RLte�����Ëĥ
4�e��vi-l�$�ɭ�4>���M�b]9�侳��}J�X0�#ƻ�q�*�N�k�_<XJ����-�����z�%\����O O�`�PڔR ͡Zն�D�e� �X�S_I�բ �&x)d�d������Rl��@��V�U�[��$t(�1b�X�����?���|�p3�t@�a����b~��ś=i�� �\��[+��[e��f��]^w'NlNc{������>n�*�8�_%Ty�1(��� Č�	��r/ �����[���ە�k����H�L�K$5���z�Mj���Ng�*JGk+�	F�!O�1zl���Wa<��j�DMp~&,���O+Na�a@��0�گ���S�[��GinXNH���8�Vq��0@`�!���x1F��KW)�N���8�ǿ	�����~)�E^x!�(����g�r���X�YN!#��F��4v�,VDVA3/F��r)����QC]���Q���� (�]=���!�&���D�"��5$7�>+������ֻ�P#��N�m
P;I�2'3�:��h�u�FN�f�
�Cۿ�D�vr�p�f�u���~��5�FUC~R�F��G�'��}	������J��|M��:�e�g�U�"�+Ϧ�l�Gx��'A������ch�t�(S��s`�\um\u���L�1���������Wc�;��CUk�a��ւ^o��P�?�I�E����[�j�0bK�(�'&����o�waX�u�7��(�e0��*bFGm�4:&5M)�`�i��X<3��8�	�1�����؈��g�֬v��`�GW�!��h��n�z��iJC���|���%����*�N��Ļ9�g�m�[M��m���&�Q�	O�����8 3�U4�R��"��]�3�xy�-Z�a_5,�LƘ<CV$�A�O��bw�a������b�-9�v���^���ۣ���kZ��l��K0ʖ���{��<ܕ�@��NG_+�v.O��H�=����XlЖ�y�{�CzDH�^��T
$*�C-WtD]���Q#��F�-"��x�����E�q��8��
��S��F�_�q?���\x�5�%1�~+�s����i]g���Ԉ�E?�$��l�.� JǓ �������I�/��ʫ���%+&(bՔ�5.�R�� �<&���ѻK���>g�R�l��`�'������,I�$��{ʰ��1WY�*���7����E꜔��ǿ����9�z3A9���h~�>��b�|lUiX��8	�-M-$�\��G���3E�r�d�K^�`�4[�Ѝ(�������55�����=%��aE�~��3��7��Y>��TY�ܮa�reM4O3X�eӄȑ�T�f�.y�kgҁq�Y�h͓��hY>���f�̃[�jA>�8�?1$<C��7x;.!�Z>���G0I[ �
��ą��4k���ƅ�������@�O�2���@�;(��C}|���V��Ki6�ß�亂7�ӀB�^����S�7
�K� �L�ˌ\D� �n�ys��!�"Ĝo"�̬�B$�z��4�f$˺�g���^���SW�����uJ�Agp���1D#1�:Ar�\�jdamylz�� :Bw�f�@��_�p*b���JM�O<x9��ݬb�CƊ@ɓ�o}Dn3̸��:�ᗹ�G�{0@p؛
ޔ2FB-8@��`՞��#�X1ݷRYE�Zp�m#p��S��XV�y5���FW�]�!�J)MGA���A`)���`$X�^-���QY� �o�ؓ��kK0�f�s�GO�F�u� ߫�R������d�+p�8��%\�U��E�
���9=��	�u~�z�{�����f���x�B	�-#�����m?5�Yi~h�@�|R�.�HW9an�/Y�p�܄�����.,;<�(Ұ� $5�V*�#�Ƴ�T��Hf-���:S��X�	 �:*-8Ɍ��\e�����ߵ����h%�?��uA�鍝�`��2���+�WR��l�,�\*�윢l'k��������Di/u7R��g h��a�qԵ#*�a�V�g��γf~�0��)]U�2]Oo�V/��Kc��"L�Q�s���s���ky �j��3~:����XA�W#��L�`Z���#�`��L�	r�K=�GW�o�����u�[�|�8ee�	�� ��˘v"O�ecqG��N�Q���x��(/��n��7Rn����w��y��u�c���K��;"���G�Ϗ��5-�X9�c��<i�ͱ�5�:�l�GZj�-���'
hQ�l1Ԁj�$K�m��lF�@b���c)}�� �ϗ�x*w��x���?�^%�0��������_�[ �����%��^�����5G�i�'�����"Gv0�´E>L|��9ȝ �%���ceK�欓�A�P�Ce�\V2�'�
S�g�d�T���\_\��/r�j�	�8İ�g��1���a�T�	��#)O=���򑲎�K�����A��$�������|�`s�pau�+L,慛-����y3,ؠ���+#ktq?Z��I�>�@6�a����q�G�+R�1�\�/�ˤ?S��^�Nr�u�Dbّx:���7C6:��F�Z�ӟ�������e/5U�}��y�<;�^���<<��Se�)��J�)��Φ�laިC����5�s��«�Ho?�N���xj@2:��W�ѧ62J ���
��7� H����K�K³��[�_�D�	�A�P��6y�#��M����G�����o����/r�h��g��da��x�o�����'��T��'ʴ�3�m ^5��M�V�yC�R�{�����zmR���J�����:���ߥ���K���wi��������4�[i�Pv�-����+���F���ɬ�9��}��*c��Y�,��x˒#�Q��� YH�x
��(�ER�p�h�l�����l�e����M}�>حb��P�RWp�[���}Z-��*z����RrE����P�ņ������ULr,�pls�������FXD��Cu+��N�dx#��ɦ��T�?]�OTFH��*��T���gcv��-a�M
$4�2R�I�6x��FQ.��82�*��.zk{j�E�l�4^\��."�<zq|rD|wD����t�V��e>o$sS�<�]�DI�_���d�s^o�;VL:s���+�t�QJ�(#�l�q~��p��ͺ�s�V!��8�$�
-��i��Y"�Bv	����g{�!�]@�~�y�A��u2
���o�4IF���?mD
�S��^6�����5��5V��E�9�(��=�T���2�+�=V�V�&����C�9}0Am�D��`�)�GjN�C�f�Hӥ���֙*~�E�:�-v6v��k��9+J���!�#���ءm��m�ts���)B�@�0-����@��
sq��H�jr��IJ΀&�N�wWT}󕀨C�[A<��<}�?� V�_%�'qFu�$�c`�;T�Ɠtob��Td�""3��z`�9�"�O�`F�1��Wv`S�&1:�����d�P�Y�B�i�ZW�6�Wr�[7��R����Z���Z��z���k���Ջi���c��Ő�5���T�П~A|Dߏ5Z�ODF�o��o���}��\�zo�Kw��� ��;�|��kw�>^��틭u��Nv���:i��'l�O�X���'�b��˵�	��<����$7k��#���lm������*�#����[5�}�����<��]rg�c�v�b ��'��<ǋ��l��$��ыf�I��U�%Oٝ,^Y�傹�X���n�_���o[�)�t+��I17~��F؃�!��hȑ��!��/*Q<0���?n�������
N����|�QN�%���_���(^L�a�iE���}�/�)/d��[��<aB����q�@�)
������i2��%q�㪡_*kȜa�U���`�jS[{ZpJ$��#C&�(���*��EǪȼ�W�.U�?�S\4@�"�i2���a1�?���&�� `�6��a!c�wk�cV�rHt���v�b���gr>�r�!���=oυ�%|�;X'��$���L���K(�c>�� �A���7����X&��T�9֊��[�BK�H�[T�,���5�˻`Μ�bA�R�Q(�+Ecp��R����F��Z��2���8hW#T�	`��ɳI؋��ɨ�#�pve�:�,�d|Eo�I/��F�����!�;WҰX���P���A!�ZGF �$���b���\�jݡ�Z��lcp�8�{��y��A�����L<W����^n^��%=Jd^h��u�Y7��NO!��r��G�1�9����n�գrv@��,5%�oҨ_±AVe��Q4޸���d�"�����8f��{G������i\�\�~g�j�n��4�ۻ��R��f���x��1��/���-R��=�`�W���,oL��Ǥ��H�8����}J�aL�bc���:�RV�/� ��d-\��
��`�c������P&vO֛5���k���d���m�|H��w���z�p_1}}��
�F��u@O�IA�8QL��(� κ-cgT�8����R�7�96D�ʪ�W�=���%�Q���W�dw��� �,T�cd�4T�W��io�z�������/���0��Y���T�F�QU�h������F�������-2�5����U��O��`;��1:|��r(S
��F�b/����*F��(Yi�U�6' )R0���	?d���,-�_�I�Z�6��,��a��)k#��0�ۡiO��?��	���%[��P��5w@t*�i���Y��ø�t�ӷnI�V�i����3k��bQ�[=����|FW0_��8.���Q��1"�ȓ�{M)`�H�\����^�o(�.Rz�m����p��Jy�����7�^��n��L�)s���3���/_;�'q�s�9<:9> �vz�9'K�G�����.���Ù���FҋZ�@zqÊ��$���=���ƳZ�3E?5�/:��Lz��Br�1����M��R�¼S����n����?��_���O��I�z�������R���X����� �:_ޔ��}�Q���w�'�9�W����۾�I��ݣ��oM���ז ��O;�ǝw��/�O�t���|8<� �O/�߿3��Χv}0�EA��tr�x� y놸����k��.�Y̵p@�� uYl��|ˎ����d��,p t`^{����,y�G:�tun��{A�O/>_��b���^tN/�����ţ��p!2	����z�w,7���P�0���I[t"��S�
b�/C~N�O��yZ~YZ�O��Aw�R���B�X���~g�jQ���	��0s�Y_��A�YJ�t�������AN�渢o]�����B�p�&�I��Z!���Q�����`Fz�G���?��>�VCJ"�d0�qNq2I&�\��K`��P�t���^!��k �([�t���g{׋gL�~��5_�M��ћ wy���k+t$�8$�9�Ma��7�� O�C��S�����h�@f����I���>C�*'j��㚮��&����l�jAژS��rPb���|�]�+�}�
�Hq�1c�ƽ"��L_1�?���,�V[!�Pr��.��]/��4���=S��;�Jr��C ��d N�P�H���C�4��t��	��c�f�e5����D ~��Hjj_���*�}�m�u���+��r����W&�/��4�Y�Ju*��/$��e��S:��d�c7t������)���RխƔ�6ϴHM%���z%����l���6 ]�px�S1j}_��c[�r�;|�^��pf��} �
�����U.�PF\���>a�Hk�xn�3�������!����rą���N�D<
��{<���d�R\�X���F�e���e�u9Y�ݘ �D�����?��onhZi3���4���Ȫ�+�qt�;�{������>�7���^o||���/��0�/t���_�qӪ�NP��srp�4a?�q{F��1v��`���\83N�y�TД�m��DWh8��6�&�E��R~C�4 ���v���2'�qW�6�w�߯���1�j&�#D㾿��z��~���3�ۥ���O�p��L��g�����^�qK�oX89��c}Yѷ(�<
.�E�b(XU&��a.?^$\d�h,�:p}���beoxb���M�}��/k�*N��F���	�V���^H�'��t��T�0��V֬Y�T��V}��}S��lߊ?T�3�U��S������be�ta��D��zv�fJ<�����XC�g���؛)**�-�g�#�&n����s ��UʹI�+��%�ʥ)'�V1m]1yn'�'\{�zXӎ)���7�_ϖ?�����\���#Wk�2NV���L��LU�V�}��]�o��E��e����3�I[E�;;�^>�7��a��� OP�c-�;�I�~��L52�ρs�O%H�v��t�BH���א�A�B�	L���)���8��fJ%����9�}}k��t�t�>�������9{~�y�B��W�'e������6Z�Ń��b�l��Y- �����Vr�G)�tY����1�gW�$Xb^�\��E1U
��|q�j��e�/�+���i>L��@��=�%��C"iʊ� �2C*)�Ø�\�<@s���Ԁ�4��M�a�D�E�Xm����4������ /Ǫ~�����h|����U�[`��4I]��hx�d�j�	�t&Uo���j�o��X0/�E�F8���u0�b���@Z���	F�˂������rB*ɚ�p�Ɉ�yb�6���,Not�s�^eG�`������;rdC��|`�z�IF��F;AG5O��됿�T�K/Z��(�Z1�n�
���]i�f�����IB
��iE�2�ó�ϗx�ףo��n4o��P�����\ d�h�=��S)�yx��B�B]%P�Z5ĩ������k��B����8�߀!���(F��R���d�O�1���5������}�f,2u�;�J���*l�W���R~�#�����+��O�B�0�`L��͙�_q�֬Hy�o�;�¸0��dP�J�ړ������7�L�м��Ս�6̓
�J�
Z�b�yHa��E���x�o���7a^'�dJթ1Gl����*�q�ZЫ�ء})��\~t��h
m>�a ����a
��`ڏ@���cKvd{׺��-D�*��q��UǪ���l���'Aߕ��{t�x�O��s�����R�����Y���E���Xtg%���6��+�ޤ�қ[l5��^�P5
1�����J����Q�D�Շ���'�+C=��=U���ۍ�76�����z<�8������&�k ���J ��x�Jd,����pƆ�G����_�b�(��'-���
��s}Vn-O��!m����K+)�튇-c]U11n�v��W��lK�{�(��p�'j���f1J��	`Al�q��u�E��6s�1�3�P05K���g���bY����>��&P~��{��L��2/^��j���}�Q��~���`�
�S��YQs'H%��^�r;��UݤF	)3Z
`ֽ�R-��`T�w��+��?���A@闫S�G�����Պ:�u"�n�)�Z����<��P�*��� �T�I��֊�.�ל������LWSc:JBQU��V��K���.��G|4IRe�Wzi�k�C�8�!��9���&�J�&SQ�����^��aib-�c�`��mJ�r�5AN�l0
��Q�����������[�T���b��s���G���/��I����\ ���Z:c�\��r"�8�zO����e:z�����[5��P����#�l�2ͳ�[a!�|��G;V��s�oG�z
�y��ֶ^|k���k��[�*�x	o� ��F�q.Kj�k�{?�1/\y�Qi�H�;�[��UgZ�Cs��`Y3�KЗ~��腥M3ʮ��ڨ�+��0��h��(��QܧK�$�{�#��>�j>	F���f�k9����B�c)��{��fփ�����|1��j ���#�8�S&��KM�o@����:&�}�0�q���}0��A�"�
~D��%u�Fc{�^jQ�='�/d�(Yo����Sj��h����$�ٺ�Jm����R����6�fu�{����׵R����Nܻq�*���!UM"΢��ȫ ����U���e������b��s����01�A��h���Ь!�� Ok�B[,W��M�Gl��"�ݠ\���m���Hqm���]�Z����/������?�������49���ׯC�=��T8���/w���x�#��hB;���8�����G-���A��n�C��04�$���R��I�q�W~	��$Z�7ZTI�X�0��2��)���#&YV���7#)�3���(i��0f�	z�0�:\��6 Z��)�z�`��3��t���\��܃B�$JZ���t�h�9"8�bYV~����
�PJ����s�ԄsN���Qx���K�k�g{G�"���=:��f�ǖ(�ῡ��=��e,��+�"Ԡξ��{]�@��:�5վ�L�Q� �����~��:~,���j�^� .�.["f�T�rf]H�2fK1YUfQ�݆:VW~��a�?'p�W6^��O܁�u���TY�# B��%�-@�m��[Z{�9�\�
t�`�/,s�)f��4�� ��0L��g��TF-�(E��7�V���ʾpG�A Y�P8p��ב� t	.����}�U��MIn\D�@Pj�?pٞ��Yӫ���0���EΓddL�i�S�+^{4N�~>Bԗ��� ���r(�9M ��9<��c��Ɠݝ�Uѿ��UWg�sۚ2gn�؞5��gU���kj���>�\v+�֥V�G�sC ���G�T�}V�8�	��
$�B�Uz��ֵ�a}�aNy�0 ˙�#r�7�	�v|W���@L
?��Ʀ��e�Sҝ&³����+�kB�3��g���v�Js���?�%���wNN��y�OI-"x�4��<��;|�i`eS*��ʗ��Gf�9��݌�f�����fr3?�r��k`���KUʆPX|z�<C����l��h� ij*\�h��c����鲷�#x�]�PJ�)P�),��%�%�������	�~�C>��|�;���WDM�0}|n��b�c��T��O��z~�B�O)���ԅ��M[�qH9�4u���=�������ߟ��W(��ħ/��cSq����T! 793]�|쎉�dK���+�>�I�J�Ԫ:�ǘw�{��	��rF��0$�.sN�M��Q&��w
#�" BP�7�L�(��%�	��w�N"b~�d
J��q�4L�j֢�_S�x��a��o]�ۤ��<�],Ng};�rRd��R�[�_�8�:�IJiN�T�Ϭ�5ޱL��9���*��|b�2qa���"D�9
�~C;I�q�/EՕ&�� �A�Х͑Q�d�&�������Bخ,(	l�R �8�p���g�jG��h[����%r��x��� 0� ���w',3!���E���_�>&��.&T�p�%2����a�:1r�bƘ���zZ-K �+=O7���PМ�b�K
f^�Q�ưg�֛�X[�E_*x��^y��<Ӄ���7�$���~��!�_��̕q@Dm@���iVy������{��/-m�3n~��ITˠQ�gy�O�����T�%�9��3y8ȯ��W���{�!l�dB��x�<�4�F��xT�Ԡ.Qط�hT@���
����zhR�ӫ<�g���|��>*�����x�W<Nm�8ثK~�rC�tL\���$Ő�
Ӎ
[8�V�O�1�V���[[EG5sW/�UV��< J��6����k���lǟzXz#�Տ�8`%j��ʒ��f�O2��p��tD^��K�3�7����>,�y�n�r@_���Nj�n~(�w��^�������ӌ�8�%���L+�����tj��=��.T��݈�r��.��:bh-t���T��Hg��\��/��Mo�Š�4SY��~&���A,��T��_/�ȧ�^*RES*��Y�n��M";�__�OC�	>7ՉdGI�[i��W�?>U�x�/zF�(9\�W���|O4^I���)��<j���ˁ�`����LP��al�T:��E��C���k�F���T��F���c
����ke�`��f�>ys�!�f�pQ�o�$@/�N�.��ґPZ��􂸇�l����Q+�<��-Y󿁕��5��y��2���\�Ϳ�E�Ot�!�*�c�AG�|V0;�v�Z��%������ïc�r����
gǇ1��~���<*�S�0)�\�qFFq��&���h�-������߬u�H=�RF��9�'o�������������/@[�`�{��
�m��x�]�0]W��}��eBq�m>���hX`J�j_y_��t����O}u����� �ċ��2Z�c��{5+����мR$�b��j��Ҋ�1oÎp����m,��/g6B�I��~n��ħĂ�'�V��$����Ϭ�����]1lՠn�1��6��j��]P���r�㈄zdz8���Ʉ'�8ʬU����������V�~��-�x#�4�hF99A�����g�#׌ A�ڦ��%"&��\�nX�d��
�](n*v���g��Or?"��?�xA���{�i�3�29[�^{������y�u%�U2bۿ�ձ�H�|�V��-FYjըZ8h�IC����胕�����S����NXi�ڈ�����X�aG�E/}�ߩ����.T6dzO�����?��C{������r�ӌ.�&B�3����l��M���dj�/���A���ρ1��X��l������˟F��������5yI>�Z-�cU=,?����o���>�=�0�1��6����^	��w��}�`3{cˏ�V�t�#m���BA��Ŧٞ�~o�u�YD���t�G�:�%ô���6�WAt�yȂ�!o��Ngs6 ��ڊT���yF���%r��G�,>΂��hQ7�����s�m�~���N�#����CV|��v����]�u��3����"�T��:H��i/g4f����5�	�I��Y�LFJ��yl��X�A�QPv�kS��,8{E�����!i�6x��Fخ(���ya�{Ҩk]UyM����vgyI,k��<c����{������Ͷn[򲧽8����Uׁ�f%s �)
+e�3w��`��uѼ�uN�g�4�lэj%���0�h�x>��h�ê�,y���p�RɝBtI����Q�'�B��Q
�MN����I�m�Ɔ��[|v�"�d�!�4��k�c�9S�q*�|��v����;�[�9������f��@Nq����j0�⡿4��Л�.�s���̲S�Ɩ\CE�o���;�Z���MP�ո�)+D��wq�X�V�qh��K#����X�GmT7왐�	�0�0�*pì6r�,��PX��;{�Q7�N��o�]���ͯF�B�`R}.gAĲk4������/Wa)�G�ZTw2��6�KNyѴ9�3�2%WW��'��s��vI�I�O6��0.ԯڂu���m6�:��]��-_Yѵ<�U���D�"^��ć���3�Ra�P�~&�c���:,DQ�j�q���_���U0��߳Rf�����S^r�x���u��+�Ag{dwkk�<��T���~�{�Eߡ���f빟���y{҆
���C��<�������=� ���.��c?ʂ�8쿼��	pwP�̩����DJ�~���=����s�^�S�*Ǽ��h�	Zk]�qZ"�����اO�7�{_/]�L]
2��L�}{���<o�����>��@��0��צh�QxEL�����0{d��~_U�;P����#�=}ę�浵������qm��|�?H~^��듌]G�̳X&�.F�:���I{ssӳ��u���y�W��Uƫ�ik�g%$4X����*�qtH�g*(�}��(Eu�X��7��-@�$*C�`����iQ"C�h���fbX`a������>�����V��<��_&T3��9s#� ���y��|��
��́!+M�viv7Y���x���9���������0�x�3�ڙ%��r���xH�~��(
�hL��$�G�Z)sZ�_Ъ׉}�^2��Z��fmT���WisA:}D���L9H�X��;�	G���	?�?/'���nk���EJD�@� �)m�R�I��>P�Ebbx�>�?7FЛxS�VQ�7|�=��곔�w��bC��AZ֕}�<��)ӑ��
@�.F1�[�#}�����q_�-�)��8R0/�q�;H�X�k�y��{1�4���z��)��PbcL�d�ԍ�r�-;u+ F��R7NB�&C�{V�	æ,x�Y�ֶ���,IkE!z����D% \	�*�t^���D�3�� ��m�O@D����0
sO��[T#��iYR�d�q����S+�=�P�
ӄ��7�o8�KT=�	[���0
c:��Ҧ�Ȟ�����	#Vr�� ;uSr�F#,'I�LH��e̎����4]B��P96��y����E��]�F�q�GF�M��L��vEa@*���
��&�@�HOк��皡���=�1�K���(��m�}�)%�xq����x\2
p<cӪك'Q�a:ـk������tG�i�
�!�%��.�m|�6|j�E2߬5�+�K�H#��J�g�����[y���Y٠�/��%�
c��&Z٢�t���+�GW�y��nsD�ۥL����:��OQ�+W�fz�4�
Ri�������I��g���X�y;���p��ډ0��Җk��:���i�'�8�6�X{K@�E���n�K�sT����z� JGb�x�����TkRZ�G��ו~�S`�d6�|�*�b�I����t�H�\t�b���C!�&��S��+�-�7�ިXN�戰B���M΢I���n0�%���Zi^?��Y���!ئ��AL�Q��:���������6�,/��
7����d�G��R�n~-�����LE�v�͍<�Γ�]���4l*xċ"I�Y�]b��|���l\S��&�F7�j��H�dr���eM[.��]���fM���a'�P+�����@�d�37�Q�i���}�*9��$�(�G��؞Y�z��}Ԋڤ�c�m�Q�����fV~(˻��~e�����7��<�U���
_=�zD�٪\���2_'��.��k����6o�Aڏh+����6�Vx?gk��*߫;����Ӽح����_��Pَx��+�$��y~��ص�u�>,7���|j��oZac~߱|��γck-·�g�^���)� ���S���Lx8�DF'J'��1ӷyx������˺�Q�"(.����͡�i�m?)HI@��]�9n>��m!�43X�I\�1���LR*��a��N�ޞ��1���%���Y�f�Q�"U� ⮒�:P�������
X�!��	ߙ�`_!�Yꓨ���#M�1t+�ƽh�Cj�]*������`_�R��I�ٻBvW�&�+�x�$ʐ)����sX4��)-	Ռ�`y9�NXF�1�,R�vD[w�r�!t�CfC�4���¼��k�	\;��˩�������U�}��%���n�Ǐ	{��1_��C��4w�jz� �1��>/��æ��AE�L�q4��|�T xy��Gu���f"�%!8}�é�s���7g��ۼ���g�O��K�&цgm�m���h�~-<I�8>�$��~l�j��cƐJ�ar�V��`USV�V�ܶ~uvˎl��`)*������jzV�Y=�/mq����՚K��hSl�6��
v)�?-��� Q2f�ϗ�iE����Wf�(�;E0��M
C��]p*:#K*���"i�vE�ڿZ��,�.��y���*⬿��w�U�Ьiɔ��*�6Q�� X���Ix֎���;ڎ�O���Mg��e�gT ��@��/�����aKzlf��h�r�d�YK�ՋQ�Yb������77$��/�g{ds���By�@�V��-��z[�%ʛ?Lw���ǔ�� b/)�v1T��3��s,W�� �ڃ� �v�q��mk�{�~�i��^���Բ~�Z���3������-��%yŞmzҝ6�i�]�5.�K��r��yκ�[HV��0�=��xZ]vW�-�� _�K�X���+{�����q"{/$��N�~�pW�o�z��jq�|G���Lɪ�CF��^#�fJM=H�<�8�w� �	,��2��� O�3�x�FtT��՞�vء���
��"%���7�oò����rv^EY�ɒ�=�	��uZ��g���5����|M�nUфj��������~&��C���ݣw���
�)(���m��>�Ⱦ3�j�3,��:f�?���ĩrgi�dkڵ/q��3�߅���d�'����=iG\Y9^� $c�&yy3��&\���K�|�Z����7���ҏ9Xf~���G�Y<�L'&d���)�>��cr���Sg9�a>)�Pm��
J��1�6�?�,A��tD)q�!$�G�ÌL���w�Io�X�z�o!z�*ɇ�̺���&��L�9Ae��sfD6+��m�׵)c�T;���5�UMcT�kCi+�9�ڋ�ؼ�(ڜ��&4ni��i�zp�f�ut�@���"�7��~��#����v�H����j�@{{$lQ�?�>�����H�^C�FȔ�Q�w�B<o`MԴK�y������M�= ����R�鸺�r2yd��w�JnZ�E6���a�9�$�w���N`袏�y]e���ݓ�N�~�a�kN�B^�7E���1�I�t�J�DV',��Bzc~��b�釟߰��쉠b�'P�w[d�33�����y�|6��5��V�ykӳ�R���N0��Wt֓<n~ګ�"`9�T/��+n�O���)��C�_<f���"��"1t���2
��ƭ�x�6㝤~~]�t���
�G=U�5YSٕ^t+��"�X��N�C�o�yNy���.��%T�`H�t &-�7va^B��&[��M��k�.��6oiw���6���:�\9U�����Ѿ��Xhɱ6�Ec�KhlG4����vEc�Kh�-k��n��_�~y.����֦�}��h������[r;o5���8<�@���E��͹��y ӧ�MOU��
�B�hu	^���E��4k��~Hn���I}�e/���(�|]I��{�����/�c�KX򬵿@s�^2����*�����0EIo\�ا�glv	����]��ls��q�!��l������+�z�p-���i++��.�2u�k(s ȡu��H@�1�x��	��B�]z�`y���U=���cx�en=�be�Ad��)2λ�~��ɞQ������̵O<VN�X:�7���Z��7��l��λ+����Dc�F�	Y;�z��gw݁���<PcI2�Y���:m��]-�W�<��i�ղ��7+�;Ƭ(�*W���1G
d�u�9$JRY�*��<�x���1��F/M��b5�EN�%S��mh�$�{��O�e����\͒��XS���^ʘj�!�ɵM�T˦�6Ou�>-��	r���m%� O�a�r��h�;�κV�q�M�*� 野QwW�q!:��6��@��>66�y�l����s$�G}d�_�i0A	�*bl�����=>T���B���|���u��7Gb���5�ǩ�]�3�a�p�Z�HYK��($C�s���9�L@�2�(	��pܛ����>ut���܅�!�hklE�h�X�N�'���fմ��t[S~���65"�֠E:ggP	|�ɖO�R�D�[�m]�-*���/Nw�"�u��cS��Z����2�mL���8�z�x�>H��a<A*me  �5�@��U���*�� +�ZPF�h��t@��� aqY�U+��yb��O-�9����h ��r��}&�>Lz�o���T���<�rUT�G)�Q�Hj�K�oV#��B��.T�Xh]Q��w&ͫ�r~��v�������[=�i���W��/$f�0�朚?K_}��;�:�禎��Xƙ�!X�*��O��~i���Ö���%=���E�٢akr�
3�ǿ��۝����G�fU�+M��j�8���/���ި��H�*�Pu��A���Xy��xK��%�]�ktjmC���E��_���䊼��|�v�S������#��^�y���˹��XY�R��6��=ĸ�S��&��oBpK�]�������/3֬)4:�.�;I'8	�pe�� ��u8�fؿ_��`�~�<�"H����]���Y�����f
X�����%����g"3�-x�� ��n�)�f�Y�|��=����@s������u4S�v�9X��0(�@>����ʾ-yG��_��:�5��}�z!O�y��aC=��}0L�1���p�\�E��fy�/a}w�|8
 s�PC�6Kύ0ﵾ���^ۦ��w�\R�lQat�k�hx�Ez?6Bc(��W�ߓ����C��aL�I� ��ԡMvd�s7�6�j�f�o����`�f:НN��|5��_��Y~��i&�@�9����t^NxY�,��ƗpR���M*Y���0�~Z����N�4�xU��/��4M��4RV'���F�SK^��e���I�_q�N�� ��i�tNjY�L���װ����
,��d�X��R��u�|��΢�6Gzr���z�;׆}Eg��g�F��e���Z՗9`�o/X��@�E��Z�ڳ(�#SX.�~����|��Sf��NV����(�u�����B��viأ�!#�,4DFaN�]@|�u=g�`�e��:E�`#k�%ˢK(��=bQ�� � �$����ex�9��]:Z����Ѣ�w�U��T)��C����Ш���Q>��9V��> �(��r����C��qS&��x�~B'
�Vc:7�o-j^P�!��CF�/� K��t��<��܌�0W��-���4�:�a�Q��}�#]�#]Km�%"]UHk��� i�\��0\!�h�]�ARZ�@�xZ�@I^S
=ғb�&#�_�GÒѰ~�.!&��nkݽ�m7í��f����O�t�����gy�K��^�C~j�$T��Of���Z�_����I����F���tX^�_�m�n2���  ���}�Ivޫ� �l����s9�dS 䴦oj4g<^M,���F-�
vo/#��~�+�gwe��UP�^ɲ���#�?ͼ��|���ʬ{fMr����4�����̓����ߩ+,H�W�֥�����t��������Z������C�4�w���?�_�A,?��F_牺�a���r��D�ŇMw�áۏ�z��/`K*�q+��F����_�#V5M.ڔ�k��Q��%Ŋ�S�=��eh3�.Ꙗ��N�"o,R8�Q?�v�r�/wK+��#�(��S��'Y;vo���!�{��o��ԏ����]�<���@�lUr5���o��0A�d��i"�W�(�����֒u���2�D�3�+ D�����
gy	t�b�� �KZ��d�`8S���<��
����+�
~��%:1A��R���ė�n�;	"'{�'�w���^��omz.:ҷ�&�C-�V�k���C�|
4$w���p��x�աϿU�Ҫ�X��E~k[&V�x����Šg��3�ڑ���!y��
�\����w7��=q�����IT���9�=�mX����_řm��1���2�NNHϛgZ��X��,�5���>g6[����z�Ӽ�������4�ץ�N��E�8��YZ5~p+?
1g[�J!3����7��7E�O�ͫ_�U�Q���"�y���ّ�B�ҧcoZX(R?�b&�\�-M����>�w�<N#{~�L{��z��i�X�SJ��]�pfzL��q�-����G������큅T[d�.�n69�V��v�=��T���s7>���dCO<���o�E'it�M�,z)E{=\VM��DO�0��(Xn���������r����N#|BY]��5n9R���o)v���o�Y8��a���GE�<?�� vٲ���_9a������C�]�LN��}�0r��B�3�ng�@VgS�CI����nk��G�<�!��W��.]Ճ�Ru �D��Z�Rx��g4il�oI*;{��V���B�����B��7��h��S�7W� �7p�nn;&A�7ϴ�����m����tHD��N[k�|j��3UTAr��O~���&!�W�͍�Z�)�f���[Q��i*��w*���6՘f��~l��ʸn�A�)`#�4̐��ڊ�ST	���"�r���\�(M-=^�<�fr����g�!��XX�9�(�u(_��$���=,M�.*�8����!�r�`�oV��:�m��h!���Ƿ^�⻝G�ک�)y���T����ף�k�����M�;�E�����c��py��2�h0Jæ���.C�OQ�m�uz���U�̭52�(�O���݈E.�9|�Q�E;�Zq`F�<��������»k�X"����V�Ftآ��<8{%7�<E�{M[#��c	yqH�ZDz�$��|���)��x��6�=�}�e�3�Ѱ�)���
�������4�	&
>��-�F�C-����_ʕ >ڍ!?�Z�`G`�oh�Ci�M�}�'��S���}w#��N���9�l��R���T�B�ٺ=���yiRu��6�n�bQɍr��0�0�����+����D��]�1��z3M)�mF��6Kw,.ѣ}d�ZS�&+a	��ɇ�5�K�PQ�}.˨���(	0/����XѠD0C��%*�Z�8ׂV�x��a�m%]c��8��V����u�	�Gfw�~�^��b���8�&.���u������&k^wio��M�2:L��h����Q4Ҩ�,dP�$��x���+_˯�Wi\����W���)x�K�l�(���$���1�����Qm�+��
�ɶZ�r51)�U�kM+���Va͗g�d��$�ߓ�ב����L�S�cT��ߤ��~������eJ��(�swFl��6p;/�xx�A�`���c�]X{�K�~%����zY��ݓ��)@,sTdݞ�='�sZ�R� Qcu[s��$A�Y��H��V���h���MC�ﷇ��܇��Fg�)��v��٤2Z,f�gkwq���"��)K�s��p�C�=����ܳ��/ǜ�Q��6�S��׻=g��:L�e#)i*��u�T ��!l�˩�`4��ǧ�z���;g�����sQ����XRԺ`Y�]D�u2D7��?l�+��l�H����h�qOYꆚo%̎��0�#[��4�<�E��	e����ad��\D�/��5E�_z�g��t���Z02�������'�]bu��1�L���:�rB�j�򒭲�5�ǰ����eh}|iy��u��+8�" �p�Gϸ�|G��:� taNF_,4�t��̉�X�0��*U$^�ҁu堙hZ���!q��ϗŽ$9Y����A�U���?A���՝��;��n���lC�b{�x�=̻= {��ҹ��gФ��շskPO�~g09b;�6x�Tko˾���0�� +z�����޾��`�X��}��?l����]�`��/q*�߶B�CNc���ۄ�!�[�#8�^��j���q�Ɓ����W����%��Nu�����m��6�9��-W��l��]��m�#&���o&��$ң7��J6�~s�����E����G�θ�m�'����w���h���N��XF�e!�(Y�'C�K���k���#>[,A(v.�4n�(��v,�> ���B7Ȏx�N�ۄ�*����ϐ�	̌��:`���s���IS�.S������X�Gm�4�>-yJO�%��k����ه�{�kX?�]�IS z2݅E	��f��WET�n̩p�L�MFo�4؟���+���b!+zX-R,v��)+�þǒ�(�*����;�sR������~B���8v�mY(��(����g��u\Y�sM0��x�o�;,�m��ls�=d�o^���&��>>��5�c&�o�g[�g_�9;u{�hDE�h���b���������*cu|q��]�}��?g`�y��\�����aǭ-[fR)����
��2��}#��n�;�	~k�1e�%�y�:FT��8��>��1x��5u"c`�WP0�`Y&@�C�̾X5���N���M��.Y���0{�6D�֏�b�ih����:�p��(pGN�<l6
N�H�/�7�&�_P��,���Y
���S�l�&M�**64������\��������"��&�6Zs�ƅV2�j%�昃�&׆��m��x!�����X}���>�lĲn�И�����ү�����o�s����1��C�l�3ύ4U޲u�ϋ��i���]����.��j�ɳ�f�������#C�W���Tˬ�����_����ZR��"	sI�Mzh��[�Z\zB���z��s����*���t��O]]O�0�Ǽn�^6��ݿU5{�ϕ
��nM&����0�R�;�ܡYލ�Q�a��bL�VT�����?���9��9�$�`Gy=��uYk8�ym�R�wU��s��0^�ËhUxER9���0hZ<Z�-���`��9r�JnU���:|HPit]Qa�,����	�����'*
,���U����k|Ƥ�=wM`5މ�,xK���,�,����+^�_ڧ^�d��<�����o��[8>�ޗ��$��D�$��\�M��;��#�ED��#8�B��@���7�T~Ik��õ$�/�z��������E��E��o/�$z�x�	���ȫ�z��W�>Qp��l��}_�7~|'�����?��y�h���<��f5ZҪy%�9bZ?��;,��;!�Y���UK��^MI;/�v'�"���U1#_sѝ�����t�����&Ӆ�)��-��lcC'y� ��0%R�h���"�qi�7^�J��͂��1�h`�M��hL�\�c�|��o���#�M��-\��js��ՕBV�:l�֙�w�+WC��^&�-=�<�;�5.�{63����K,Ds��f,�mgw�#�y@���|~�*<b~g2Y��:[�jA�eCT�U���;�`Ẃ.�"��\7c�^8m�t�Y�~-�9L�4{�V�q0E�t_z!�7jS5�`Q�A5<Ga��"�2]�,�ư��b?����ԍ>�ߏ��=�����}g|�l�r/�(�'���/&�
%~ƜhN}Xy���=���a�o��H��̩8Qy�2�~�5��5�v5@�\�(߯�Fo+����z#
��v��4̻�>�o��r.�k/&��x��$7����R�
����L�e�w��C�<�*xKe�ZV�2�R/5nb�H�"��p�x&��a,:~ϊ�����8�է!2�f��th��J��m�R�<�e�Lyħ891��VU�xU��|��y4C����b�dUu �kUyn^q�~8|x��ŀf<=^w$�gt�.��,U���Q��z��XӲ�H�Z�DDEK�m?Q�ľ6�[!��>�g�|�����ε�,*��C셲r�e�v��dG�]~��u�}����!>k�K4�y�V5go��F��׿�GU� ���ڵM	�L�%_��L.�uz��K/���߼���ԫ�F����)��fJ9�Ѳ� z}.Wm~��#�R��P�i.d-Q �%q2O����Ԓ����h�O����Ty��V[SlyM[��-����b� /Ʃ��C�v_�f�4�j���D�&#ȋ;K&��qm+�i�j��m�Bٲ�������#��r�(z��"QQ���d����턱���^%�%�_����	˨�|��S��~(�XUU��Be!B�[rK5�S�9���f�r\-Z��Y��`�BUƆA�秨v�=���)��^Xt��{H��f��,�F���E��_ ��M} ��CO	lb0L��3<����@E���N���T����f�Kl���+��Gc���k$@0z�/����zL��������$X�B~
um
^a�Ȫo���?{�q3@��f�3_BT���e�S��lK�!`�3l�қ2��-��]��(�#�0Ko�K�����c|xd���~P��a :�V�([���ݚZgV��v�5ہ���m��97��o�wS�X�RYsVe����w�:��q{�?��/��T$�����q�/����?.f��Ltdf-��׬/�,��JJ.������8X^��F���-��s�h2��\�=�Ĭ�_���'0�� ^"���F��3x]8s�8��p3��Yo_���@yK�N�>�N��n�ż%\ߏ�yN��*ٷ	�܆�;�]!b�i� OA�\a^�j��c��pm�����<�Q&DEW�b��V%~&�4("�x��y���{���Ҡ.8#�#ӫ�zq[)�v�c�)����H��,P8�[�g�_��O�-��� ���a�Q&�S��{�$�VB�uq�]��~�u��^��LƁa���\n(���s0t0�-�t�������N�s�gA)Ӂ?���W8H�O�q�B�aa'�6Y�J����iq�m����J<+�	v���@o%7��Py
�����\��3�=/?g���?�e��kD�;����7����|t\`��E�Y�~0
9C����!�WX��g [��E�΍7MԹfFԩl��]�����|���dp����t�*��|��q�Zɤ��+��h��"{<��b5����fp��5����-$#��o�x�f��G��G��B*�1�q	�i���o���\��p k�����'�o�1��A���\#�mZ��f�K������R��B����k"�3'�
@�r�r-#)v[̊Q�PE�o�W���x^L�6g�j���g%�D	�I���s�x���5������jf��W�91
w����k�]�cx>̗:6� S�i6�	�i�DܶB:��3�P�}[�tl�Lm���D��O�\䖼Ya�c'�/�n�ΰ�$)����6\���e��V�`No�M�>z�'�u,%���R%��j�(�m�	g�޴|�Xn%o��׶/sK�]�="����vgé� ���d_��K��I�A�v��\@����+d��ԝ4ί��
�~���evIIOA��F����<g���6��Bi�����d�����Kf����J��/t��$ֹ�+�4�	Hr~b�����D$U���%�c�ɚ�N������I֚L����=��z^\{�C_����1�%���>ϝ��810���옙�)?@V5���g�aTڟ�Q���G�[��c���f3N/P�J�,��׌$0A��Cx�n���-_�B�Xc<l*�kx]�#='��Bp�/���ޡw��{�ݭ&K�
�A���/��r���a����KU0S�q�
o�L��J$o�C���z�ӈ�2%ܛ�oE�k��m���[z�/��i���a'�'����;�<�~�>;>��{�jwr4�ܪ�&�*}J�+��37A�LΤyZlK���&$�*?2DbG�r�Ϡ�<J���]�9�y��8	�}�$a��nP0C�h�3�iܻ����+����),��ԃ��\�\I��o�� �� ����(hC�4";{T��Ñ _�o�ݒӵuK ��\�>hĽL��/�fo+jfl\c��},���'�g�l�u�z��v��X��JCTK���>����j�_�0]�n����n�^D�@@��I薚��� ��µ:rh	��e��R�	�V���)]K���Qז�>Z��A�vec{��U�9@C��2䬪ܗ'3�"<h<u�Y�vbD��'ބ�=	�KTёQuZ����Ѡ	�=(RJf���߿ֻ K
dD㚉?�`��j��;e
�X��;� VB�[���>����?���2>���8mEPa�>�u�Il��v� t�@�B�#a(��d	��]���f��_����)֧��lF���So��X�F,a����YZ)n�U#D���̪�s�`Ӳ��V|�,�N��70����T�[j��P�l�W>�
>Y�ϲ�]xY�_�V���XШ/���1��M��ͪ�k�g��)�����J���j��L���7ߍMz�"\����5���$��`�2Iڡ!���^��$r���$�E��I#���6�%���ɛs���繛T� *y�t�'� +�U�^�C�|2&C���
��,n��#�2r�&,�7e������W��G�S��!��k��-����O�1���l��Mc����w�7t���wt;r�U�c䁻�Z�[�7�3�(ή������MMw�y�YV1�8��q���@S�H)�[]�<93Ȗ�wh�E]h�����%�t<��+�g�9��ۛ��:�N#��^�A�&��yA-k�˜��@��hI/*
eg!�X�[��̟�3o:�R]>�9�q.on!Ȕ��̾-w����.Q���K��!z�����k�}d�s�RCy})�LT���\#��S^D���lXRF����P�4�"�k��!s�0Q%̤�C/ġ34���)oe�_l侤r�욵g��͗3�E� ���"�ݜ���0�/��9F\����^�~F;�ɵɜYߛ��舞��������l��We��\]�����-�b�DKT�*�U�����4(-a%�J��*G� � ���`�Lz����44�qC�5��_cKi��՝����K&��)i���}|�������d<�z����o4��ܷpyr��t?�u��q����;��}�7������8�szº�!����HG,��a�!4H�%��n�u��fGq�Arr|z��6נuJYb�cr�拺�HC�9�4��G>l��Q���)���ˤ�e��޸�_.=~ƻ�sp;A+���.n���XG}��y,�|�$��7b���Ps�"^���n��|ޅU}W��ڀ���à���]�"�vӨ�d��v@N\��޵X�L��^d�n�+�иGQ 	Er�G$E��0h�����X�S��p�b,aJ|�8G>�I�&;Ù��@фu�J���һ�X�Y&���Z�L�
_����{�Y=N���TE3�X���¬@��o��r�_�
k]���}�����ﴟ��}������KR����<�C�z���&^�}�nw�ݥ��ڨ׾y��w����r�9=�?j�u�vX4Up�� ˂}e�(�M�~]3����߬ܷ�Rg0$3X�kR�Tk��-��J/*p7�>��H�³��"M)o��O��U�5�ͫ_�*w���s�@6���CZ�L�PTo�)r�Z�	EV~��f��?7D�ź��}�Ü��t��Y/1'�%W���W�g�ʁ�D�sGr�0��n؃3�:�"�F�)?�y;,$�K��2�r��S.HH��u�{e���cq�f�1#KLu�G,}���ɻp{׽���:�F�j�5������D��)v�6#�YW����ZmiOB#S�.Bխ���3�zK�"+-�+��Or������DP�7T]i	М<i�_2�~�3�ީ�QJZ���I�������5Vr�ٱ�����b��x���=�v�AkC1�F-�S_P�uZH�Y��C1��yaQ�J���vg� `�t�נnV�LYg�q5^���HE	T�,�[��r�#����E�4cS��?JE4��fQGVL�YK�mbcæ�����C~�fs��|$eE��p���A�6�C��4�y&騺wI.wZ�E���N﹬­��q\qQ��8($	J��m�����ɔR�ʬ� n�V���Rl-w�>:k=b�㣳���Ó���;���A��m�u����p^�� L|��23vhc3:���7P�措��O�P��e���A(���&�س�t�C�J��+ԇ�{tc�>sn�����&ˌ)�o�W���Q��n0�&���6��_��^���3���i茜;l�?�?V�lRi�k�kb������t�|�`�/K�������z�<�)^=�UģF�M9���{���-��<����x.ya1�R4�x[}I>O�	JW}E�����a�U�/%׸�q�T���"������� -f����u�i����um$�0x��U�0�j�"J�(s�Z�vO| ��Nd^����Z���ɽ,���Y�����=4��R�)dpK�['��<du	ص�N4�
"@rc��?����m G���)���+�Db&Ȇ�<:�B��5�A������ ʡ�fg�T�0�ҀA8�ĺ�u'F9�EF��5�T�,���0�P��<PUɛ�I�1^
��r+���p�4Q��L�0H�*^Q���	%����|�ɰ��
�q�� A�j�a�=D*'BD�\`ay:B^�q|ek6���S�zk�jZ䕝�!��	Y���9~f�������̻X�*M��=3O�HŃ̡�1����Y��F�������v͛xK`s�KA�덂}Z� ��ز�����x#���]5��}��Ueܖ��.���U� ��P� ��^^΃��K��PG��f�. rR!4S�t�~"����p��ctC�4�Ŧ�(��4h��v1�)�tA�FW&�ª��w����1�6w�e$s
�fU-j(���5���?��j۽,P�Z9��<��R>��^�7�~��Y����[�'O����x��)~2�]�v	K�	g~J0&Q`v�0�@PIF?R%�����b��NL+��5�%D/��5��_��OH>zo�J��_Q��A*Hn��2�Q�0�&,R�@��>��A��7yplг�������t����{�9�C\�Bw%�)���� AcN�j�S��d'C՝@�b���U%D{|�|V�*N�;�c�kl�|#�wF��.�,���7#��R�۾�7ϵ/�U�����e3 :~M�05����㣥�L�r��s�sX��}�9�O�K4���P�+�>E~)v�g�ضT��|��կ�b��l�h�l_��t$w4����I�9�C�1�ɢ��;�_уԬ�u8.yd��>��R/u�-5J�βUdM;a�!�D7����GG���3�,B}q�&�2�l����4���\�V��;��ABS�`f'���#�^���u;���j�E���Z�}���O��Ir�]˥���mw=�7w4���zr��˹+��f�#?^�	WmgX!� q����$�z������"D)���Q:E%����cq_Y�*�>���V}�,�G�.^Z�}/�T�z��
h��Y�ڧ��[���q��?����?c�L���Si#��:c^a>p����"�"�Q��8�5����*��r�ב��߼�����x}�8�z[�ԲM�Ij����u��?2���Z�G�GO�t�H�ӂ[�m��K��\jT0����K�G6-Z��W�(�x�Bf�Ŕ�[3
����+˕��S��	űt���3����ϼIa�ƌ���o7��E���v*Q09�g���
�{f�����������ͫ_���B�h������P&!5>�Np�u"^4d�Q����Ժ��z?�t<&3�TgH٭"��6�{h�G�3L$UPl�H�05}���)6zq�F.v})�]!G�0������.��.�Q>�������Pb!bA�T��̽�'�� o��x���;Eo�L��*�O���W@�E@�ؠq�y=KP�"���F�n�ל�I*ܱCy�Y����Z!�N��0�[�g�>ۓ 5�,N
�ڴayFu�'���7t/�*eރ�1����h�i�Y���i�ڤ��AXnsϽpf�i�DUBE�����I�kNoJ7������?���"U��/Ppxġ�+��\aJ)?L��Ż;>c|z߹�B�{R�,EJ9i"��Tz�<	�5���
��({	jV�����픥-8����|�/Y=�%�5��\�)/Ry��M�y5�M�|�t��7��D�v�\ \�䃐�x��Xnq�d{�\�~�d��1&��#�;h,��zF����z���&���w��r{S���H�)W~>߳�<�q����&�:c��z�����b!�@��/��',��ZY���ľӋ�Qwa��0����Zze�vi�lZ�k��ܽA\�N�ե'G��J社}��/��%�b�h�G �,V)Y\n�e�9�gˬ�������(�4R9n �D8�����U���'�i����weN����̃�T6-��n����&�|�.�~?�Jk
���)RrYV�[}�^����0�pa��VÝ�.4��QEf��*)f[Xvľ���4�%�(�e>�I��ڬ���)��?�Qؼ7{~.'�<2f?#/t�����1�s�\��Uq�c��P֏��2k{{Bz�ocs��[�d����.&<��/t�e����;�-��ZyDs#��L�;w�OAt�����& w�V�}� �?K�����W�9Q1>�e���ͫ��b��V�O��$�'�窦�[ԓ6�n��w,�������_�J�WlOe~`����L}!
AV�i,���?��w��-�������9��?C�E�V�k��%�~j��$]��?�����U.N���Vd�F����'��fUI{^B�;Y+��mkH��c�Y��uCV�I�yF�r��䨶�Un�?9Zf ��)l\���nm7V+�~�Ŷ?�Y˟����KV������׾�k��b�b�������W\��~'�(�<��W]��Y8q��_�o}��9�����ۿ�u5�668��$��&t,��W��(;<ee�����>�'.���0�a���e0�6!~�6�a���	�� �����E�3E��2�H�:#�31;����xS����yʡ�mx��l��� �F�/��� eO����*9q������D��D����T9����(%;I!����N:�ucx��yÙ��z��*b*����n����O�gǇ�y�]L�;l����;j�u1��߂ׁ����j���_�aw7agL�9'��Vu*�[��X�*���׺��9���ITs#^����(9���SD�`O=j��j�UB&I�"D��PշR�A��@W�B��P�uH���+���`�"�x��y��z4ʈ�eډ'��+\c~
�{5�-���� �%�g�Y�W�R�&�~@���k��r�{�����T��R]���ک���s��yl���,U{�s�e�L�@B}z㼊Yج@ 9�K�~�U�0yňv���;X�O�t�;��+NV�{�\�֊��K4�]��
>�_0=]Dr�~�/ίx���:�B�^��%�3t�|�=��<�_��%�81�cK�)�Zԏ��ϗ�(Wm��C��ck$HE���?�i�L:gEJ�E��IK�n�6��e�����2��*.�B�^��%� q'�Vw=��Ѝ9U�8�qI�!/����'n�?�#!2N��B2R��F��
A�4�y�����24O{L�9��
X]�ܼ�k_�R5�)h 0���b&[v��R���.�=,�vą�9S����v)W�	=�[M�Ia����U�M`�Qh����Vm�N�u��@+��ɱ�J5��jZ	������mi��j���}|�N�`J%y�S����b'�k���F���g�Ư�ǳs����2�^��_`V������[u,�ݨ��������z��ޭM�?e]�U��v���g�-��h+R��A����}̿�h)S�S����f���G������k��o�O���W��_��4i餱YBU��D%�y��!j]9�m0�)���]�d�R�SQ������b�q!�L��h"��3����=��c�_�@)���F�)������$+Z$i"�D*6��<�čcЌ�n�P�? %SӜ����T�~a�H�4�l���n���p�n�m��mH�	�WL���PJm��-ET��a0��{d�������.ls�Ɍ��1Wo[�T�͛�l��Y"E;�	ȩ[��6�� �1M`�U�F���ě'�tx,Ľ��Ĭy+׉n��<2bC2x(.�F~ߜ5HJ�轁�H�b�C�6�1����J� �P��OiS<�~p�,9���+s�&���n���>� D�ueCL��B���j-� >vLL|R�ǂ	a�Wv�F~"�k�-�1����g�Sc�ު즆X��lQl�)K7�� �ʷ��A~y>d�dX�����%�L�nNf��bI��0�;}Yѿ���W��z!�	�1��j���
'C����+	���f�����l�)d�h��j;ZBg)lԤd,���p����ڇ(l�S�):m�N�֗_��8!/��c>�a�H� *���Yg��t>=��~�܆�92�ϩċf�J/�����
���6c�dw	��N�I�0�i���Ԩ��ӃW 
�t���iC�>����Z�\j]x���a�xv���}Y
5�6+�ަ�������wi|�c�6QP�@���R��I����Z��,�>k�ْMLhKB�8�yYeD��Ұd�1��:0�A��ݳ'3�F\�sV���I$8�
��C�|���e�]cT%�$�ؘ[�hP�M�A<����BN\2#����y��:���_���%��E������S�Q�i�FV��0���� n�6�O'�����)#M�����=1Oxi�����h�z�5�/
+7�"(ls���a�N��)�ln=��?cg���T��[�E�Ӆ�-��c"We�`V��'���C6�ܡ������ )*ɮe[�e�	 �B�:�-�v,	����:���i2;��:u�aQT�jg<z(Cj��<P��Z��WO�;��s�1:���%I�;)�W�����	-떘��������8K��P�0b�\+��)��C��T��d�޴���x�M��T�M��xn����=vy�"N�v^4�7b���ϫ�9'iO�����.�������l�Ԉ��r̅��w�&ٜO�$���yȓi<�4e/���y��s��_����ín��+���ؼ�]���5�i�T⡄ �%���LT���6iJ�o-p�t�e]��.��U	w���A��$?z|L)���៕�n��o��T�%YS@$-ʏ���yA�ɀ���������Z�����������z'��`6�h�[yƾ�_�� 2��h�c��v���!5*o]�҅�����r&T��_������Eo�Fq�,XO�!���%���o���}
]��t�A�^�V�!��9�#4�)�r($���!���Q_~�Ļ�W:�9Mg�I��7���]��9��e����w��_'�Ԣ�.;�-� �O�{5�)w�����e"2�t5��,�.d��Y�$̓�V��I��(���W���B�%��o�芥���/��d;7
���TrMf��sW����΁���k�<�K���XŤ�f�QֈȡNHɺI<�����:��g+�uN��d��q���rs��w��l�/���Ċ�	a'�6��йt)�&�7Tv��p��9���Cu�2hί���K�_!
���9��۰ �%^2��k��_�µ�_�nBX����-��3�*р��3��p/���M���5�9{��ܨ�I�b���mEz �5�3$h��@@�W�!�M����#��L'H�U�A����q���s�������&P���Z%���Bo�6��gF��U ����g���M��io��¡���wh������D(���ڌ�BE2��ʃɱ��	l�O�H=����_b�Z޲+�3�ɒ��V�];��VX�wW}e�2�N�H9EeA����g��_�'b9�aw��l'0��i��Į1o
�W/���0�Ǐ#_��d�a������'��@,�	z$F��C��r��C��N���
��hoZr� 5a ����x��AЩ����q����T"U}�d�g�4���ù�A�x�D�E�����"�S(���T�woİ�4�ܤ�7��IP��3Y�uMi�zY��]�Ш��]ⱃ%�H���&K��uYY�v�Rs�]���ڂZŻ����s�<�(�ͥ�7�r�?19���݋������1���H,ŜJq+�f1���|��"~���)n�*kc�U�̽|@�����%5J Q��*��vo���b,��@�4ed�Ǵ�&HJoL�(N��:���C*\-_����a?Z���h�F_q�i�S�rq���LI��ݏ>�y��������(>j��X�5[�j�F^-�M*O��[Mfl����(���[`]�����[;�s�9}�9jθ:�eǟvNO��:6��(�@xx}���?.l��QG}� �|w��Kwܻ&4.��@g�>r����[M���a�����q팓kNW3z���d����ȕV/#�C�Y��=�?�Ϲ�L�h�GDb��Z��:�*�	`r+�<�~���B��HS�"�Gl����!�!�`.���r�oV�?^��geg�3�t.�0��O!ۑ�(�zӐ30����H�?^S����Õx�	�,����RX�A ���S�ozE��v�Q�L�b �MaO����#�l#6�64�y���2ŗ�l^8�z!������N쨱)�<x1�C$��F9%�5]�X�������ڿ�!�6O6S⟻w̴#O�4��4h���^�}W��׳����l,MŎ��t�2��H���)�Zt����t��*����.���_������N��r	����XNot��l�&lW�qB�?񃬡,wj���zԴ��� ;S��N?�~0vp��d���#|�'�����Z}ΎO:������"�HF������ v�`����"n�f�f��[3-�+��TS�C&A(��C���K�>]��VS�N�mD\�'xN�,�:-���c���uQd�R��K0���^Af�b����Qx�%���j����O�60�U��2�y#�N��R��Ĥ���hV�R9F�.��bv�"�hBD[D)g|Le��S�-�Q�[��c�y��j���j�(h�w��_����}.��!��Z'�������W�{7��؈����6>���&Έ}�K��w������@(
߾�y|Nt� 0^>Z\�0Cϡ��HnB2Tz�I��7oj�dr���=>�����=�Orˇ���%��`�G����b��� �;�$<lƽI���R�X��N�֤ �߿D�P�*�dU�a_4��|m�'z��ڦ�7����/���
oM���OY�eK���ےTez�\K ��9��q�t�����aekU޲k�����F�A����t���3�G�t>7��g��ʌ���~�fgg�1����^����E^&�ow��݃u�ڧ������[������+
�}+FC�����N�O��MOH�#��m����Kؤ����ؔ�
�+�V?es2O�O��:Q	��>��hc�C����3�_�����z�����V�Y���)k�vZg������׆���2kϳ������FFGg���7!�5p��=�J-"(�ư�7��v������5R���?�@q@�۔�,���?mh���`V��O,9\�/�LG�U�EcԗI��~@6���U��qC-���#%#���Eb?'�
�jLّ�"z��y��QQ��I�����]U��������
Ґ+�D�@�=Q)�]7s!
�bZ-Hx�m���^c�L>)ܴ�t��t�J8bꥂ ]%�%=Kex�t�����e�����,}�>�K�G�R�7ݡۦ�O��	H�^!,lW�~���9�L9U
��ꊢ�@�� �����C��\n��|B�b������ �/Q�xΈ���(��]���5P^,͙��)��]����k|�U�ͬ�[�R3��TI��q�D���H�<�Vk	��� �v,@���]�Bcc�E�ً��g�3f��[�T�x�ī�)�li<��^b?cK� 6Y�w�}��秎��"
2d��� �%j�![�d��[ȅ���ZF�dtVtǇ�Ōm�ǒ����{�%D#G7ZaDۼ��˼<���"�Y�D��l��bLk�G��/&_H�!F��{����F47�����_�:ϙ�f�7/[r"������nS� �U��-hF������>�+��➓7�5
����Y.����hl.�DO[�W�h8&�j����Mm�k��ؔ��dTx_f��35)�~��;WmW�a9=�U��J�o��7+]�%/ߪt���|{���~������|]Uz��k�T_�րZ+��z�Z�K�K�K��l�wɂ�L�S�a�ǮȂ)��,��L�٭���0=�衡ET���&����2��'#R�v�Ώ܁����Lj���h�� ���FS3�		��&&Fe��s�s�Cx��n�������� ^�_�ˎ\����$�$�	l��Ws���_&����1���>��sX�G�dݐ/� Q��a�������[����)ތ�!���U��/�����
����Qѱ�������:���c�+r�ף;	л?Z�xy���u���=�����q�ƛ�ˉZ�^Z�n�H�}/QH@'�dH�&s9�WWm��@^
���-9�f*��(Z]7��Y�J�44=מnF���j��缦��~Ƣ��<>	�>/����?t$��ʔ�L\=bj��>�	�O�=��*��H���X��޶=M���Cd��+Q���D�9_<��[����<{��4�����c�k�� ��AS'��x�	8���=̂��v�'���2��{)������xЯ6�My �@n��E<��b6����꽲4���q�RJb&Û�ֶ���j��G %�3��O4��y�	#K@��3W�em���W&r-�6M�.�!P��U��Em��]'7��Z�km�m�W��Jy/��Y�e�o�ƽ�����Xgu��k��ɍuje[ِ��[��A�l`+����V6��MleK�b���آV���mي��vc�Z��V��Vʜ��V�R+w����V�����E=�v��t��d�=�Xt�����yv��gt/�ͳ�l��od�f��g=�^9W  H�:�hW��#j��D����i����`�Y[f�c��iy�M��@���J8��q�c^(t�_Bl�G���=��y9����uvK�9��a�芏US��
3s%�,���j3�?�K*0����9�[�"Ri%/S��ç�.&RaD��1͖$N����x�$�,g��<�%�*p�֞�^~X�i�I w�$X7ޗ.��m�ߙ�,É�r�`y���H[��V_�4Z^nN�~������jk��<�����m���o��O� �`=R/\M2�tVfGypK'�g�z�y旆�X�6��4�r���C�Rl�M����'30�<hQ��i%p�&��N�li��)�����rg��L_V���9�R����y5���_��]5���=G�*(���dg�x��=�@Qu��<ͦpn&f����W�^h���rjE���jaڧ��[������j���S2�d ��w��D�i��uV���^fk�`�W�o�4�o��w}�͡��B�780��O׫�<�ܔ�r���IVń�Y		�Q"� ��� ���AXZ$�崉?�����e���jH)Y��kbFC���%�,�q!5|cIag�ʋ�e��YC�nV��d毬bK,U+>�c��Yi�M�h6|�gDE�xzZ�0�?p(��=�/8-˙{(���a��Uu�񗻜Li��E��6qC�;�R{/<����V�U�����Q�f,�
y�Ɨ���ȩ��%腸� is�B�#��mQ�	zD��f�`7�=� !��� �������d��#�u�n)8�&�Rk6�UD�j�=zz�ɏ�1�>>��?.E��la��CQ��eBh��f�O�u�t&�ײ0S�ي���u[���f���&;s�K�a��)#���s!ss!��{��f��5;t����L�Vz�c�|ݞ��b��.�%b]Ra$W�kȅ��˅Ͻ�\HC'��H����-I�$7�:c������2�{���]��$G�φ4���1`�{s��|+�^��}���m��Y��O��n�+�zºv.����l���-� ��~�y{��ԛro����P{�P���<�J�l��;R�g��΁��m�)!ڝ:,*�ʐ?vn�>א�{AS�z�(y�i���-@`aݧ8@p������k��#)�j�>���(�>��*��,Q�oz���n�GD��B�/�����Icccm�F�c��l�{�%�{/��+���T�]���%D��s�6�����U1^r_�>C+�MnQɊ�ų:},C���7���?{`4��6�_37�b�qd��sÆ�U����-�L��!O�?C�5R
�L����"8+�����c�\�oy�������29� j���`a�G��	q�K��wo����yZ�T���9�V�V�16N��6��;��PϏ!�����<�3?x>��56a�C�=�e�~�ϋ��E �3��  �� �]>Px��\Oo���SL���/II�,+�E��,�2zHx�;$'^�lgwEъn�(�KQ Ao���=��������.��̒t�8Iy���ٙy���[�~B��l"|����;d����?W�O��M�f���&�
9�L�����ѭ�)�Lh0��l����g�)�#�ݾ!�Ngt�dd:d��:1�cw�6���m1קQtF��5sF���ؙMx��PH 2�ǉ|3g��#R$��<����&1���눌D;C`I��9��v�h_�`�l/x��p����{�#�탮ǯ�>2�?��B�3w�[�y`�O��/>��,���8�#I2�҈iJ���ׯ�w͓>�d��m��8��8`y̯x�Et�B�MT6=��5�;�vXvN�͗A"#&���F(���sE���kв���+�(�yr.�e��|[���4r\Ġ	�ζ:}-�M��؂A����%y&1iAH<a���ۡ��Y���Q̫Y���\?�X���ڀ����q8�⍳��!ɭ.��ْ�-f�l�|a�a�/�hj_/[�>"�t{�j�N�Dŝ�3�@�8��|�Zx_O5�>�I�G*|���!�
�g���I�?}�d��b/h|���o����:�]�^Í�љe�������<�>�ZG�,�8�>G��!���Soj�a7������� ~��8"���xs�J�锂A�T�Po���6z �{p]�@��.|1��''��Q,���dq7ZD)y���� By�}R�w	zVx�s?����D��9,�Њz���"���}�LR fM��j��XGK��JUt�ۛd߀ت�4R������6�م�Bg'���ϔu+WV=xx�l��*ZG����"g"p�d�A�4�c6�H^�t�������s9�	� P�Ȍ�X�!<@�:;�.�	���#>�B�Ch V���x)�&TYn&���[�$!�K������c�9p�o�$ރ	as�`�,�2X�Ww���2�Ho�ީ*�0v���N�����&�ۙl�.o���0�c ��u�3��&������6���D̎=/����4�bY7�����br?�����<[��!d>$�ĭ����z�3B�)@$�
��I��Ν�x}��4Cރ�XA�L�,���s~��f�.�ƌ~�фzb�L��b��`(���S�&~<_��({��#/����ra7�O�N�����)�t4"O�yL��E�D�Dz�O����D�����w���"�S���4�_�9� ���\5��مk���3��
�D8���2�}���^a�x(�o�6\K<���B������ڙa�Jcj�ȇg&��XPqei�w E6�/i`*g'y��crm��ïN,IFRL��P����g�P�X8ٱ /�z`î
	s�L8�c�ɸ�d��[�h���s�" �:y�N�ϴ���i������z�+�b�/��S�J=:�B�<VY����
�Y䂃�_���UK�0ؚ`B�1�Ye%��ji�)uhL�=�R!��)R����k�\�K[Y\��`f3{��ZXNΜ=P���>��5��x],���O5�����gW����c�9.��.\I��T�h��B�x�z̦
m�2v���^S\�m���36	�X"%�ҋ�z��r?�*�ȱ��?�A"��cZ����R`1P������Wϟ���O��A�1Ny�5]AS����x��	������ً'g�?����7ߐ�	m|h���O�����S<�(R�[�^&ڹ���=yuq�%@���:$߼YH�ʉ��CL� ,�.�T�Yx��E}b+��kK-�˱�+����0���g|N6�;B>,��9�ʮ+��2����5L����.��� MK���Z��ť;S�x�#$U���n�@�����V�A����~?[%�����}sk=[�%���V`�?�
������o�bJ
=��`>scr�k)ZE�E�mG�6sL�H���e��� !~L OU
����b���)��,AEς��9n��2���E4-��n�zA!e+����B����N��UR�N����9�,։m�ED]ą��T�l�V�7�_'!l�2��!HB��֑ft���p�/�r��K�_��جGL��%V��~)p���"��M&�g�\���.,f��_������Ѭ'�8�� z)�,[�Ƙ�X[�����Vr�b*�_VF�7m+��y�M���z��Y.�������
�����9{���*>)T.$�F�\0�@�Po�t��u��W��	,�޼��E�㭣O�di=�?�Y�dԸe)f��͎ٷ�N�U��hN�hı_�HMm[�\	?	bl�,�R��'C���#�z W��QD=x�p`v�	�{x�M�N�,�Ս��Zr5SK�zN�����`��.�4V;�M��~�����Q�g�2�}d�'���oS��djf�d�M@���GÙ�{�Z�Є��9�q-L�؃����z�z�S<�[�;��ubs[��������A����������VM�=�pVy���ɳ|��^G6�	4-�2��6m��U������f��(m�P��c7R� 0Nx@�/��qc��Jw&���&���.M�%2�RmjQ� �X( t�0���}��9��� K�Y_p��o�G0=��q�DCK-��eI1T煹�b���� �5�+�Lu�`�����?ZIN.N/OO�����ӗg�7�g�gϾ
�
�%#s��(I��(�7$̘�Ul��8Qlv�Fu\���9Q�6���a���B2�����ޗ7�m����j��-*�ֶ�u�gV=ď���z��)PRu��C�z�T~ǲ���+'�%<��M��؇-=�ey_�a�@@+�~���s����1�Z3�Ɨ>l	�GW������
e�h,�PM9�O$:�?r���
`���i���B����:�)�|����eHh�W��i5���_���^d٧�%�a�^/��AD��ǖ�+$I�)�pH�����ږ:t`yg`:��6���O�u�a���-#9�bZHQa��2x��d�&�n���QL�������~r��J��"��5k���cxw�敢t�~�9���8��V�L|�!@����"�`�B2��j]�`�툅��^��9�hH|����z������hZ�I\�T�w'�V��~�<L�A=Ҕ8՗mK��V����o)���9IX�F@�� F"�\�R��M;�
ъI�Mg�x��h	�[��-��R�h�].쒉�k�/4k��bc����JG�x��,�����G9"�</��|<�[GE��(@zk�{,�GgH!94W	���4��Uhi���M yѦ�ɡ����k��u;u&K�A�ŪX�<�1�PS��˶��K�C��[�W3VnӖb�MU��K5�T}���J��^:*V��ŨoU�R�E��!Ƃ����%�v�^|�c�u���f�]���m�di�R�Z �J�J%��*��rNc8�ZD��.�*fLi�o4�0n�h�Ğ�h�=
 ]u��P���\��i�Q�s��nz^�����P����,!��e���^c��Q��Y�?XI�� ��>���F]�M���<��n쮶�h��O�@Z�H'�(*�Ƀ���Ȭo��T���-��O}Pr���f�x����i��~��od���K�����\�wȉ/o��υ���NQ�N��&/�Q���*c|Q6"�E�(�M�Uʘ���nZ�ĉ��9|���$�D����w�]�_]B��:���G�  �� �?�