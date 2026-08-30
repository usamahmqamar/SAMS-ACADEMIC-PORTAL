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
          ? `‚Ç¶${result.student.feeStatements.outstandingBalance.toLocaleString()}`
          : '‚Ç¶150,000';
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
                            <span className="text-slate-500 text-xs font-mono">‚Ä¢ Active Campus: {selectedBranch === 'GN' ? 'Gawun Nama (GN)' : 'Runjin Sambo (RS)'}</span>
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
                          <span>üë®‚Äçüéì Student Daily Attendance Register</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendanceDeskTab('staff_matrix')}
                          className="px-6 py-3 text-sm font-bold border-b-2 border-indigo-600 text-indigo-700 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
                        >
                          <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                          <span>üë®‚Äçüè´ Staff Monthly Attendance Matrix</span>
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
                          <span className="text-slate-500 text-xs font-mono">‚Ä¢ Active Campus: {attendanceBranch === 'GN' ? 'Gawun Nama (GN)' : 'Runjin Sambo (RS)'}</span>
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
                        <span>üë®‚Äçüéì Student Daily Attendance Register</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceDeskTab('staff_matrix')}
                        className="px-6 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
                      >
                        <ClipboardCheck className="w-4 h-4 text-slate-400" />
                        <span>üë®‚Äçüè´ Staff Monthly Attendance Matrix</span>
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
           xúÏ}[sIvﬁªE14FË∆Ö…ÅLÄ HbEÇ0‹âcbß∫+ÅÆeuUm]Ùb±/äpÿí÷“*lKñcÏıã#¸ÍPË¡o˛'˚¥?¡yÚRïu?Ÿ› Å!*váËÓ™¨ºú<yÆﬂ!§ˆ
ÈGáû”pìxÙ¸ÑZ√èhxz,øˇ7ıèf◊’“ü°Ó˙^ì$∞≠ò⁄dã\í^ØQóŸg˘Úe∞◊˚·ÿÚÜtSˆ/"W∏7D4ÓÁ€Î»◊!ªY©|rwdyg42mÄ∆áπô‹ı«cÍ≈ù≈EdñK√∏≥∞°ÂDñÀÊ √ò≠–Ê˝≥â„≈>âbÎÙîÿN»ÜÎáìﬁ™˝´+ƒMC◊ä¢CkL∑g]:¶°Â⁄›«´´d‰dƒ¢}˘Ñ}”ã∏{>rbJN}/Ó|◊&¡§ª÷€ ¡E˜	˝ƒ≥©›uœƒΩ&a‰á›¿gc°!âFñÌü≥Zª∑ç L∫ì£åîH:ü≠è?[$qÏ{m/z∂b;õoí∑4ﬁsπÚU÷92r"∂öŒê˝≈!µ∆ƒeﬂ8ﬁ˘j•yÈû±WVN¨…¿m6≈‚ün‰2jÓÆØÆÆ<^%Aw#]úı7[÷êv'›G≠”0z®øñ/p4÷(A|√_˚îQÀ©K/Î◊8Í©X|˛Æ†ó÷∑±˜Ìú√N–^yŒHlƒ˛œ_dçlî´´d—{∑∑ΩìÿåZœcˇŸLE§üå«V8y∂¬oi•Ö—√ñuf+›yP‡v=çŸë_ˇö4¸‹s©wè»÷÷Y]"ﬂêN˚‡
[rΩ@∂ç®\#π⁄z=RªõQÑ¢ìwa˚–◊	UÑ•(9"÷GÀq≠ÅK{l?zv2åâÂãœuI«#J\zxºáÿOÑ,ëÕ)FÆ®˘!„HcÎ¢;Í~˝ò +;uπO∫V¬jv◊Ù«÷±iô∆V–ÈßKdk——¥≥ËdÎ28Ì9ˆUaãïÿX≠ﬁ«r√»≤J∑Ô∫Z>‘¿™¶éo◊_$åùN∫üSÍ…ÌÀN†0F7,ö∆ﬂ-7gÆ/yû‚x∂sÊ≥#hÉ\¯aa[n·¡dì¿d*ÈÊ
∑âﬂÕﬂ¯~m5∏¯Æ∏Cx∑∆æÁ∫±«n	¬∏®˝†›^µpyñò1eÉUcÙæÜ÷§w˙„Œ%|hì¿¸Z¸d∫ZTˇÛe‚ÿîüvùO6ﬂ¨Å´Ì?¸óø4_±•%åh”<¶“Ω∆qïèIu/\ˇêç®…ÏÊ†f` 0¶RH–]◊Xì%;s©e≥…ÓÜ‘µ.®	a¬∆
È;œV\˚Ë	¿,Ó`këÓZ%…ñ∑∞ˆkÙqèºﬁÔ˜ﬂí£◊;á}Úˆ¯ÂŒ·¡_Ï7
ûó±8_0ûB√k¿ÂìEóFSˆ…ó_6nô"œ:õ¿∫Cﬂç∫kdlofí3+Ë>n!ëVa˚5Ô	\êFl†A8ºÔÂkıæÁæˇ·m@ΩZ[ûªèçdÏ#üÈ˛L5V”øÎ3ê¬"ÃQ¬~∆W“˜˙…ÄÈ[ó πˆeki/`¬õÆ=zj%n‹A(”Œ)È<Ëπ–	{Ì/ò`í|˛á?pÜKà~§ÍˇQËtlJTìñgﬁ
±iÃ‰Í©Ôá4NBØ˝ŒÓ†.aæÅã»yﬂÎı:EAÿMG¡$ºˇnÈªˆWÛ{Aç:ò	rÏM≤‡›Úß‰çèzLÜ˜√ˇ3d”ƒÙ%ÚY[Öki—b$Êò€¿Jãâi‡,¥lZx¸%|áy8ÜU-<ÃWÛ∞œ˚Ë|,æ˝≠˙7~ÆÈñ∆œø≈4`sA7˜4»æ®w«VúDõdL L#≥… 
}¨kâoÄ;≥.2Î£˘·2aáåu«˛ŸôKâZßq;y≥ÕÇ$6˚§F„õr7 ¨ì3Y&≠í≠O≥˘){?¶èá; g∫,>ÃÈ∫G9ıO˜hJ˜”=.i˜∞‰‘ö8·±√v»œ5≈•…ê["Åû¢d8d∑û&Æ;y–ŒºØÆ*˙|ãpµŒ•©uî¿ç◊‹üπ÷Ä∫e≈˘Î:Ωôã0\o&„`‘âO?[·Õ!_ÌxA7ÀŸOŸπÏ#lâátƒ%›≠⁄;Îë˛–°ﬁê∂≠≈ï®ÄHÖ}G ãLvyŸÚGÀMË÷e’Ü’ç|OñTj™c¥[·ç{¸•h4§øLúê⁄®€b•Åívì‰{¬ÁÜÏB∑ù|9èfí“Ì§_ﬁªπQØ8èÓÌbH¸>ÏNòùæπÚä≤ŸË€Ñ∫çiªLŸG#?ˆ£âèh‰DÑ	ípˆRÑ{ÆÎ¢Û**ÁÛâ£√VÇ”T4n@·ïˇ÷ëm?†CÁîQn*!ﬁJ‚}C≠(	)Ò/&g‘#á≤qúY$ÉÅ{È7ùœ9—p&¡OA«wí4ò÷&lÃægπô€Où+§÷5—u◊ÎdöçG69
?Ün¬§ﬁè–˜«ƒÇÂvbáFÀ$äi¿˛kóÌXgû≈lœû˚·áhDiÒh¶ïOOØr~ÁD≠Ja¸Ù¥⁄hFøùöﬁ˛E¿"dè∫l√áÓ1Ωv°'h°yäÌí∫Ég~a&Ê&˚Bc”âüDñ·W”)_œà˚1ì]πò õ±°E∑©»ÇçU˝éÜP∑u=¯B¶…<>Öà7πb∂Z{éYÑ£d¿x„àº∞ÜâOîõñ±2ÿà7ØÃ'‰M3õAlQsbÍÇ€õå¡u¡}ƒV‡Ûu»©`L≥®7çB¿pπß"IØ7‚≠‡"j¯˘z#ﬁä‘1Eú4ıJg7	Äà!8óƒ#¶sJœ8£|ÿ◊6#É	„ød«∂ô†ìÿ±;ÏÑ5¿x¯'àÜì±pkÎOÁßØ†ÜcN«4à[Õ≈¡â¿∏4é˝ùÆ%e˜3©„N∆Uu•í√‡Ñ>≠Âñêªå´I∂∑∞-ñâ{1ßà≥´xe∫ƒ¿≥7Vı√ú
["¿|“]UÀ*dœ¨ÀY`^4Zl∑∆°5¸ GÁ£’}Ó¡ù&L–,FØj¥\@E2aaNåæÚWãæK˜ı˘√o~OÑ˘Y˝tqáFTé£Z‹π®µåñ≥ã	ÕÆ3¸¿dfdàH˛æb·É∂˚‹âM∂àX˘	°2Øˆ7dq\’ãDwv„RBäØïŒﬂ#ä—¿Åø·,8Äæâ©Ìå˜ÚQH>ÃÜ¿=‚¡rÍµœèﬂbˇÛ&‰äç00|27&ª¶’ÁfôPî]3ßiMÕödî]¬˝ΩÂ$Â…Uaˇní/.sktıΩ·+P˘BŸïmÔÀÔÉ^WÏY1ÌJ6]√úŸ˙t¶/Lwi√~4ﬁlkyOÍ\ Ú†6
Úà˙ÖùbSºmìøMEnÎq‹Â7âÔ·=fK˚Ω…⁄öÍó˙Ã31?õxìwbı“‹3üÍ,0a ßéÀËYeŒfdlˆûŒ¬
ıp&„èÅÊê°íŸ55”[(»n¬†ƒø˝H»ØAw-cá![ ,ˇ`©ıC§G]±ªÏ•{l1b™‘QπI3Ü“˙I»ÙÁıº)‚!w∞ˇ¢¨Zc∆˚{ö,‰›Çe•ïm°ÎÖW’á›ı¢ï8ßØÆAÚ«,˙CÉÊPßÙà£7¢c'oíÁ ≈kjÖdøºM‚°?¶—JQ9!‰˝⁄Z°ÉOR’Ü⁄NíÍëÈ¸_°s5¯+MË¢)")ã;y)õSi∆X”›BÜ—&‘,çKåI‚zêNÖœ/πÊIèúÏÔÏæ⁄?&/èwˆ_í/…¡·…˛ÒŒÓ…¡O˜……€∑Ø˚doøˇÁ”§€ƒæÔŒ;Ÿf}>…6Ø˜≠ÚO gÁÂ€†ho‹Ã‰2Yyæ97“'Ù•5˛å<}Àf«Aú- ∑‡Xá^öÿ¸[Ó)ÛΩãHü´‘âóv1c`|r5ÖiÇ™!D¿µè€ÿ¡d=∂b»Fw'ƒäcÿ%‹ ëx!ç|P3è®åtëâe≤q¿‘àúXﬂ-qÚK¿¶∞09lÛßÑr˜4ÌŸ“ÇZ≤Ÿ´BzÊÄÎä€˝#Hÿô0)åΩ8rŒ<*Q
hÙ†ubÉˆ‹¶Üúv›*0í…K‹_1kÅ‡o]¡ÃoI†*W ,Ä@(J∆ûz∂µ^ùœ'¬Zoj⁄ ’Jœvé]jfÛua6±
√$⁄î¨TÚH˜ìÿu<⁄ı|èƒE]Ü€@F aàí3I⁄∂•32K¡~Ê†Z	gRt•V/∫⁄fˇ∂"~EÀ6Ëµ∏,˘<≥Q8"˙)Í,@æÂ<+ZXÇ£[ıVÙ2˜˚∂ˆ!Ì˜|ª£2™∫¢~€ñ\SˆΩ3~ZΩf{$±Œ™˚R∫iª¯çaÔÿ…«˚ˆ£H8 ;.˚≈Ç·ﬂúGú~÷–]·Ä)¯»u≥@)BÏHëBp¬≥pVx¶ºê˝πˇπ>nXÿø"ÂÑâÚ”W6∑°ö€òKsk´™Ωµ’˘4∏ñ6∏f÷‡5pß€ ù∆ÅæbB=€X<îtˆ®e√\2é‘GM≠ä∫ø¿ıˆäè—l‚z≤°È¯û◊{òÒ<Rê∑Ka&‚NÜÿß⁄§ì≈⁄GR-fjﬁ8àMrıÊpﬂ∏DÎLÌ__ù[ƒ˝∑!ºãâX√–	∏ÇÎ˙ﬁYn*ñ	œö⁄e3¡]	¸Üq‚∆N‡:Bû–É¡ø¬$-ÚQ˜·„)¢Ò9›üX—áŸw¥Ú©£Ô—«©¸å
f$n/ùqg	'WRÑ⁄âXRÄÓƒœ1¿C˚xw].§—}eÖº‡ﬁQemâx«;√Ì6Óe™“Lç}’ƒÑñ7©/îñkîëˇ‚∂‘úPãúX°‚¡´fKı˝_––œ∆œX°^Ëªnff=^¸¢ Ö/ˆ»OiËúNàÿÇ˚¿¨ú:gI»óΩáèπÜıÂ‰Ã˚é;ﬂg6Ia2„vúÿgÛ‡í/.k&ı*õ9≈i¯ÜúÄù–Ç5ÜPOé¶*lw°Ä˜dì∞îKò'°sv∆(ÛúsT·®Ê[DuıTc•ë±VˆY#6Ç⁄ÈÖÄà}uqq/5orÏZã∂‘≥1o¶VX¯ëh}ÉÉÙåŒq =8îqÈX=∫·ﬂ∞∏Ïq`®¯gm!´eèK·Õ†ˇ
ÔF£ëO¢É42bË%^4rN„éæ¶KÑÑ4`Ô7¢ó!)6ç3âóSöŸ‘)›aëçB@‰∑HnÖÇ¯·/,HÜ»‹ﬂß¬‰ e^€ÂQZ:ß2ŸÌÉw°Åó•n¶¯˘íUõÇzóìüV+íü¶Ow™ÃuöOöSv`Ïd,cÑêÁn◊ªœŒé·6vXoπÿÏ1MÊﬁıYxP{¬Öì]+®ıÅNóÊ¥ÀzÌxâüDDÛ”à©7$JóÊ÷y@˜˘DZYóCﬁe¶}bÀc'!∏”É—$‚8‹Ù¬G=An1G∞’‹âÑ°äàÌ' MsŒêíôFóy?•¸≤»ƒEˆõiq˚óõﬂˇ ÆPÓÅµÜÏõÒ‰:˝öè>gØ&á´∞\ÁW‡Cq}—z7a?¬Y5ˇfæ±õ±Ôœ…øyÌ∆˝Ç3Ã‚·Lôèì˝ΩÕˇ{ÔÁºm~ŒÁéÔ˙gì .®ﬂ∂Âüõ3ìãΩ—JüJ≠%¸ô‘æF∂Wb[x5WhFg·OaıòJîÁm¯†s¶íÌ@÷≠Ë79uBP*§¶≈ä≠Xú¬Ü]„ZGü¿¢6”óÜA¨|j¯ÍgØms\˘CBtÚ¿N€}ø˙ùYRƒ°.;.Á–¥b»_ãU‰Áw‡Âèµı|nlz~*GvÅ≥-lwªdw‰˚lmD¨B∑kz6·|„CwÜCtË¶g(˚s˛sÔø˜çÔõ¢n^…®Ö8AÜ˚œA˝Áê≤ıI’ç™äœI˘Hô˙ç™eﬁ[a>π~∂+ó3ÔôÜˇúh\gâgQYbéÔ°î˛…(•Ö=‚±Eπ"¯S†80ó˘Ô|Â‘<uÒj	ﬂ›kb˛w^Rﬂø∞∆$˚ÊÄm»…!:^˘Õÿî∆±„m-†ç«÷≈÷¬veb˙d2=Ï0Ç£„]D3≤äB¸«j◊`ÄeFK<'&M˝qËfäÎ(ûP∆qR®ÜjF"•¿Áπ6ymAòªÑ. ô≈aé‰¿
#˙¬ı≠∏S†4Éêámƒ√éjuâ£â©W<#´πœ€‡j6ûYiÇá˛+ÇfèÁçÖ¸¥ AKŸ[>m¯åúÍÿeLÛzøg+≠_"ªTë~§Ø1ûY¥Æ(’ÛcEºéÂd¨Å—Oà$#<∏X…Z;´ û€ıÉâÚñw“Î…Fë^^-aΩÂYãÔKV˙Ô`≠%Ω#=·%‰‰lsøø6ÙAt}Sn±∞N˝⁄(3ÁætûQ[FXAtœóŸ≤qis3Û¡±ﬂ‰ú_˝I.©‡Byp›û¸©´t:_æòkYÖ"ÛÕﬁ.G˛‘ôﬂMM◊6ZË¯¨Æg∞ÖæÍG⁄?Ÿ9‹€9ﬁSôÍ}rºˇÚ†r¸3¯„›Î»]?ÿ#ﬂúº"{?;‹ys∞K˙˚ªÔéN~FNvû◊7çÔ^ChØì.¥∏Á±¥˛ﬁJ®9¯dH4ﬁ‰áå∫5¿F¯>ƒPw+N<lõ˙ı,èõ"Ñ}∑Zÿˇ∫2¨É„˝«˛ÓˇíW…ò…É«4ÚìpHU®˚èR"G~[n#Õè÷Çàpê¶f  ¡|º±<áËs'Nd2ÑS1i–éñl*ƒ.d°Ä?â qR‡éÂJêx)4ú1@rÃ{¬8µ»Ô5"X¥ÏÔÀQ»ÿTä¥¿^˘å¯‹v¥¡£ö{ka{›Xñv-€Ó∆√Q3{-hÄ∆4ÚœwÏå)[ı™|p>
å)±è™•µ¶ŒÖ∆††2Úë
X€Í/ŸÄB…üAM””¬ÓﬂE4¨√YàF°„}Ë∂«â∏¢∑ﬁ¿á¯æ~lùûí#EÌqDÌ«WÌ‚5Wo„Xnor SõÎ–˙ËúâF L¥é¶‚úÁ°d!9ky$+ &ã∞”º.DÌ—*Á^M†¬Ì
∑0â€ö®†ºE^…m‹—∂p„—ëu”±ñØn]a……(¢€Õ†Î∏Pã$0≈÷-8˚‘.ã∆µK∂—
(∏I\_C<K≠VM≠4Å6n"ÿ…Ömú¬ê•[97Ëˆ∞A±±≈Ü'¶B”?Ê8ÌÿËÌ{˚fàúé◊üP N|FìqtwiΩ4íœó‰ü'é:e˙ﬁldø/'ö®ôNaÉ¿ÁCvﬁ0—Ú∑øø+;‡‘ÒXøô§∏cÉœÂ»ªª*Gc∫î5‡ÈMl˝e©P©Óli|Í≤ÀÊy(‡É…eµﬂÇ<Ÿ˚#[àT£zÓ{I‘éëà∞X‹êcM èX¬V››QàÈ^PX 7w(lL±ÿú83S‰ôäëOÈ..+≤æ3N†=˚ÿw)‘IYÙŸ“8ÒÑΩì£Õ/NΩüˆÿã¨∞œÙp‹¶Rx’∏-ıÜ∆»ùê#1"¢≥]Ö2üïVÏŒF`’ä‘ûm}ÄÈÂÎS(/pfâÜñvû3<$BxÙ»¬ˆ¯˚ø#j»ÌS‘∞≥oÀQ∂VåNÔ.JG` ~8Ùçp˛¶ÎíH˚#(P∫;¢√8°P∞Q¸Å[0§ÖØ/g≤âCÁb÷∑≈ê“¢Ç4÷¢z¶i–P’#ªæ1>‘¥°ÑÒ.⁄RØQ”¶`˚Ë$}@˚–¯∑°rΩô=ì}hyO?˜XÓs„∂l∏Ô÷eOF</;_ÎÆc'¿Mí„˘"xΩíÎ√›u<Ëkﬂ;{‰]dç≠y”#ˇñ˝íN?	ÿû€±«é˙Ω˚·RcâAéB'⁄J„ë≈Á¶Á|Oö·Ëâ/ãÒDπ‘Ù—7"+Œ«˘VJ/b:x^¨‹˙i≥0Ù∏ßË˜†kãG\¸‚uÌÓ˝äí Ú—6ØgùmÆ˘π¶©n°÷2ª’Z˙w{£ò)¿‘
ô˙Œä]∂˙g~8ë 'MfXﬁt=¶¸£\™oCVpvº`Í6ªÕ∆vÊ6có$ñGEáY££™¯.Uèç◊§„n ·€nÒv=ìÛ´µd´MbQLèüA±t◊V÷Ió˝|~&¸ãB§£π' U~V+	ﬁrg.nOéÏ’qCmôÏ-§û&
µì0L2∂OÓ—¸O-∑-‰†*®Ô§–ÜiT™¨n©D£^ÿœe≤8T)îÓ®LÃÉÑO»ãÓÆÈ¥‹OLNhÛT6À.≠!“O#Ÿ[;Öxd∆
ÆÓ]ir–¥Ï§À˜-kv…Q]-ÆeÒê_®d∆ñÓ(cïWm·@≤ÂÂ’Z˙„˝7‰D}ènâ≠V∑≤µˇ˙ﬂˇı_~KŸœÊçéπì¨lπ&˜Ô»õÏóñ‡«Ôxx|l°Rz±±¶<jûµ	ÅÚ≠7W8ä¡µ¢ë ∏éhInCÑ‚ {=º~}K\QæﬂBå}G<çt
‡†xÚ ÷„*Sœ◊òJ\Ì’∑⁄C®8%pÚlk2’úº–)—¯sª„˙çÂx¿ïßçºÑú*º£ìÇ’TÕ‚R§≈¶Úk¡≠≠˙p±7iŒ?€DbDÅ·îHÎ≈ªöÚ≈m©aá>I%⁄rHÅq¸1‰úMBE]∏√V%¢{çs—1◊R≥∏¥úç b H-âiiâÂsÂPÈ;BW]0=.öuïA}Ò≠÷˚¯Œ$÷–˙js++dhπCÆêo"	D9¿ÖRŸÌô¡ÑπSˆq`? :çând=ìPxFœ˙_µÑÌVÎUC+!¿I“N'J∆Àb@‚∞I∆‰OIÁêÁÓt¯˜=>zßø∫¥Ã˛ﬂj÷RÀ^ÃÛ¿vKj_ëG-Q¬l%Tà#bÎÃÛô¢2î`lçO∫<Jn;a{îM˜¬üm<@n^¸Ï¡]àoÇ'ÀG*©7˝
ív⁄Ùå∂9©"Tı‹h˛¯√?˛/“èCà<v¢§Ûñùf–*µóZﬁO*»|∫µÔI*–ãœk*6ê›Z\B∞<g|,H‹®m^ez~Ïœƒ6ÌíG@Û˙ÓÁÂë‘~7üúø˚‰ù]ObG†ÒÏZ¡”R]»s5ÔDX[›»«–·ßbnC˛√?˝%ynπ‡„¥…k6¡S÷à»ß≤ŸòûO`6ÈpCy
‡4ƒùiV≈zn≈”∏Õz’¯≥Hfi◊@Ê@jíèB≤≠©⁄Äíœ+Ã‚_T÷CfPHõu•êÇ¡‡@dMË≤Y!°°\ÔIÍ∏-ôîòˆ,›yü‘(@ ´>¥YjÌÇN]v˜»±mÍëº…≠hPõYc¿fÉDŒπ…àZ0)Á;gñ}F[¡≥’{¡ˆ&∂¬˙f’åÆTå/†Œ"]èSå€ﬁ
Êñí˘”¨hΩp•ìßôV⁄LüñuñuqO|ÛÄ◊ºÊ.ã÷Äı Ê4~-Eºædw•€ÃπZπÿhÜ’ºC„«‹	D¸{‡Ô1+}≠,©@ísïÊƒïá¶eµAp≠ÍÎÂæ£È;Îá`ÖÕ∫+??Õ‰+˘Õ√íÑe>Ç≈\»C!¥!'µ§o3}—’˜FX%z7´$n∂µ>@–ÙﬁzûXåf0Â$uÅ+ò-—C€éöuºz˚ïô=ÿ€ÃV*âîÚ˚˝7G›/tIƒ†¸ºÈÚ5ÚÆl‰µíÜãŒ¬Ñób
÷UîÕ5„≤‹ŸAn¶6…èö‚$øa“»"Ÿú·’9cπ|˘pbyÈ´˘Ì≈¸≥ÒkÎ4ûç’RÿûcÚãÀñy◊-˘&Ékü‘>£+ëƒ√ÔTÅq√ÚóŸ‘¿6∏◊&Ÿ-ª2√pë2ﬁÔG°X"•©ì⁄ ?†ºxy(NØÊä~”Iˆ/ú¯ço[Æ“ixø2E^Ä =Ni´"O€»4∏Å+s1*éÅr^PÙË§Q´“∂ÉÖíâùÿTUûN”í–
Å·K/”Mˇ"m˘k1ƒëhZ´»dsq/YF%3Ûl\ 	ôÆg”ÿr‹∂†êÙUEú∏∏˚0ÁC◊}ÂxH+O*Q∞◊¥‡‘ öÙÿr’9Ù™Uä/—
Ã©J’#=»∂Â\Óäπ4‰õ≈T&d?i∆πüE`;Á;nî€wEX∞68èO€S…Dô∆iÒì∆›"|£Æ§ßîÈ·Éø€‰†∫qJ:¢·©é¡ JéŸ£◊AKOï¸íπÂÑtÉ¨ß¢Œ[ƒß´WBé©ÎX«ub∆ 5≠û7JdíŸõâÍLNŸÜ∏>#Ò7ç¥¥b˘D4ïºaC¨ò.P-:MkæíÖ&‡i/dåÄéYgåvª·˛ΩÓ…<∫Ê'òMmﬁ‡¢‡hÁ>B6á⁄fúÙ˙vóÌH∞ç}≠˛‘ô0‹r%Ω*”}–∆:3ÓCπUï‡$∂Çc¸N6;>*aM*1Îçüy´à%‹»ø+´ ÒR çh$mUÛ«¶ƒD˛–i≤Oëz|@[ÙKÈ*µ≈ëbÕÄbÂ›'¿bØ™aKJ£p» F>˙Im^V…h&–∞∑ÄHkbñ‰#4î„‡Z¬ÿ∂‹Tt©EíÇ¢@ŒPü≥Öm∆˜‰jÎQ…ÊÉC[^çŒ!~…Ô∆îZœœÄ—¶6ôí˘RX∞oKÈw¬Ω˚FÃ®ÿìvŸXìâkN\LÃ˝˜‰2çÓ∏"+‰‚;ÆD¸îëŸﬂÑ◊öê”ß_≈=Á£√k 1·?†f«
j%ÅY≠Äoˆ_—TtúnM”#«•©´ü7¸ã¸aìˇÈæ„uó…"0≤≈wg/B≤∫§pv◊zXA˝“E±s≈ÿÍ>jì¡rÏ`_*¡Å…£‘∏ÍùÏ⁄$#îzmœó?ÂÔŒmüÖÌW«êˇ'Ùb.¯FõÜ }Pò( \ q>ª—qÆ≤¨®_@πãX7˝0^&£n;qπ°Z €π˛ôD¥;£X|2ã5a˙”î ˇÉ6CŸÂ˙j@i»∂ZÔE„€ä0KYXi Ü!…•kî‡j	í”k‰Q”˛πqT3LUâÉ7_ÑÑÃ©≤Ê“@õ†ïCNTSë=1∑éO–QÈ
Õº†ZàúÅwÓ2œCK@éMˆ◊°≈3Ÿ÷¥1˛ã0ÒBæåîY¨á-ü™3Øœı•öf‰—.Î—4¶Œb≠±≠,åW¥®YøsA)è«xO]<ÅÑıK¬®?míÔø∏‰EÀ«LaÎπ¨GØ»àk^«|ÈÍOæ«;È∂ØIhòK[àõ›ñÂU⁄ê-´™CJnÜ™µZL©S«js¥˘ŸLnzö‹N√C≥¥mëÕ_t-(8ÊπD*b˛‘≤i◊Ò2œùAv˜ywÌ1∞§«Dã€œ˜Uƒ«iﬁDNŸÜ´NE˘Qu5Es"¯køàÚîuÎiﬁ_õéx¿z2§çˆ€∂Dµ„cs–UUMÏAÍ;™é˛uqö∆ŒŸ(Ü Z«Dz,a~∑Öë°ó¢h^zh‹Œ?ÛìP—æ;!ë"-gÃVÍ&ﬁ≈ïœEÆ4ª’lçÖÌÖjÃê)
€ß/1≤>R¬»m‰áŒØD.’êMD»xå?:Ùú'Ø…M9o°s—î¡÷"dW)Ú¬„îóﬁ⁄Áúıe"qÆ”!∞IÅDµàu‹‚˝∂2p^‹Eêg
!èågÔπçYy≥``7ì∂[ˆ
"õ 5©\PåÙ¢7√S+éòÉƒNAõä•
ªüÌÃ'[sÈ_îrü2òÃ‡∏`Ô◊z´kﬂI∏ı›jÔÎØø+e´(Êp±kÅúxË˚ço≥S@"4AA[mO'.∆åÄ&C§W˝‘dvîj_n“‰{}∆öR¨ü(˚ î‘?Z≈˙LAî\¿´‹∫‰ˇ‘ﬂ≈6”kq£˙´˛^K@_ˆ-◊–ä≠À¬çoŸ)>\˛Æ˛˘Å@Ÿ‹∫î4æÈπ∫9˚ªÓ˛™Æ_À‚f%$k≠®¯ÏE≈Ì5›¬SfëÒK<Ìœ∂ºÿ≈5Y⁄Zç°fq R<Tˇqÿucø;…iËè≥ÿ:ˆ]Y√ÿåƒ¬˛ÿﬁäH B¿_œK¯OÎ|ÑT]Ù◊Ÿ)ˇ)	˙›ıRnÆ>SQüùIifõ®…14¢.ªöb79[„n÷cò≈ıç\Á“¨anGhöDaü>ŸHo∞ìêB0º’Ö6’ª>åtfq≠Ädò¯WÏ∑Üì≤˘‡™àhöª¶ƒèäÿ∂R¥B~ÕJ†¢b˙í3&5
É/êD«‚Ä@OﬁwÈG˛π·¥o¡y¨– ÷UMs•L¬4 éQªY-´P≤î`Òq\R Rx3πuÁÓÑ	ˆ_}•„`JµQ»X_}≈]_}µõ’≈ITÿè\7Äùö ÅFd∂n`Üßˆ≤(ŸÂ√êæNdÏ€LbÎ’€õä∫ôŸ–¿N⁄f≠øÇ&5d[¡`:Q^T®Æ¿Ÿ∞Úa÷ù„Á;ªKÀÑ5kä.$*•∏(À¿~e‡
òòy+Å'\üÒö8§÷X˙kdÈ¶ 3Í'<Råzr>#rÊ˙(DƒO°ãÜå3Ö“ﬂy”Áê¨ªı⁄[√T7ªf*|{OãníR-¨jFﬂV¡¸⁄ÉõÌ“ fÂ)hÉÕY<]]‹™!O™⁄QÕO7öxÀŒ 6øÁÇökıŒ¬Lgë©˝‰Î2Ü~öõ‹¶Ü>v˝˙ï–¥ß+käh£Ó◊¨Ñbc7Ö. 8˘©sñÑ–È“™`Ûæ˚‘‹ÓV—9æŸßßÙ,ºpJ:Ø(]4ÖÀBz–XZ≤Âza±+èì f_ÌôËÂ≈d£á,VSÇf©©Xeå-Üû‰´ÿ◊π∫≥p›Lö27ªgÚUÆ•≤M2ã∏
ù ·Yã–ß´Y-¥78K\†Û”uÕœcÚ¥«ÊÊo”úºV2†ÉôLä¬H3˘¨dÔÅ–ÓHŒvıî0à«ê|^uzìwŒïæjMo#u∑WBÅ;æ5ﬁ£∂3;ª'?›Á/x˚‚EcﬂÙÎﬂËOÆ+æ[ÓJŸ˜\ôWŸb˘FàèÍŒrUÙ˘dÁ9yÿ€ÿ$ªØw˙˝˝>˘íÏæ;>>ÿ}˜˙›ÚfÁpÁÂ˛õ˝√ìäGgÍJE ◊••da ï†}55¸0Å˙ß4∫‡§Î ˚ª£d∞Pey\4äU_a+∑ò•0À:¯ËXz%0j©Wãfá<Z‘„⁄⁄Z#OW	Ñ›§^qù¡©>ëd>Ë%%£U.è£ò´QôïQåPÀ∏%ƒ™	FπV	€ëüﬂ6‘‘ù!#≥±3$œ!vqzUCåün—“ ˛õﬂ%ãX„ â6I°‘Ñÿa/9ﬁƒKÎ<Òk‹"ùóáKú≥'ﬁ/èÙ≠Ò¿'ù„˛R[Z37≠®\Ωû/]ù3©iÊÍ¸XÿﬁÂ¶&ïw,ÎRg8®ØíASıiî…-3©c¬bò¥QÌ`ÀJDˆ_Å—G.>?Z#Ä»>d⁄'À‰HXo8ˇOœaˇ0À˜lˆeè˝+éÑ—Ô«2ÎUêf»ÿ>ıJí0'±ê:·Fº8Ñ €u'Ïå£ù*tÕ∫’ôäjèÀ⁄≈≠¯yÌädÃÕT 	 „(vŸF®ÀúêÀù*√™ pØß WV©ûM’W¬(<lÖåO£›5ıµ!ÕÿñØÔ0( ˆ∑ˇ<Ànññ—%›ÖAVﬂZrcêo¡≥+NqSÛpûôÃêNt9‡Rv£'–§;C0ÆeÚâ@Ìù^T(¬W™Á3òa~∫Cdû"7©\¸P&Ú'n4˛€ˇ}+i\Ú¸ªE„“ÕpO„%W⁄pëƒõcN‡MÉ#ø˘›≠$¢ s∑(=R›æ)ZØ˝°Fîz–0]H±5 â?ù‰b`‚∫÷ â¥3HIãÔI©Éròyöo"›™|˚âù„˘F BÙ€¿
e©—ÍÅ7˙< Aör˙ïÀAYj5µe§5_…Ùπ‰◊t∞êÇù7Í7å‹ie Ü‹ó°>àºY£Åj¡‚ñìˇWË∂(Ã‘Õ¥%>Œ¿Ç¿‚é6)@_óSª8´Ç¬ÔíTsı%∏ˆvú*9Må≠Ÿı0#q)úâªO]ÈH>/Ú˙õﬂ1∂z/ŸıA0œ∏·û™9”rj∂îoÆÖÓœé£:–Wp◊‰1QÆ40óODÒÏ7ˇ|sóm¡˘WÎÛ⁄ø˚KÚ&qcß8d7ù≤õŒ»'#;óFëÔ˝<p-ÔG@mπ—|fDˆﬂ»k>˙Ó=ŸµºèVv†É±Ôì—ò ƒ˛9c¸lÆ~tV—gFkˇ)≠Î…hãœ È|;≤bÚ-£π+9≈K≥ÔôùµzÆx‡◊•ZD9%
‘jê”Ìû-≤A©«, +~‡:1Êx"Ø≠âüÄnâ≤◊îÃ¯Óôf∆_HXè[=-ï_Çb¸zˇ≈	Ÿ}{x≤sp∏º)‹1‡	ùX÷Láè©XRÏ9ÎhZÜÒQö\]üçPÛ5áON+’µ!`ô∞f©kP†r√™vwE$|â	M1ú„:ÉÃ97©e+∏EPm˚Qlò|3"á‡k‚s˛l<ÌamMa˙ıè|.‰È%É±o]é…πT¯˘€sÄÉòîåˆ®#v/ÿö£ò∏
6©2ôc<–ªï_uèB2±†Rh¸Ÿ
[KèxÛ∆[LäòáÙó	€¨ısq…j‰=ﬂUS1M%ÚCÌy”*‰πrÎ¥w÷+πs…Kp∏í'mcn@ÅŸX-n;Lysôg≥ÆI3Pµ\ØQ^[»\~Ø¯ç6J˝†OC€8˝4éo∆zÁülO§™‘zƒwnSàÄ3"Ê‹j*Ê»[û˚6”`íó®õÈÆyÖÿ—‹y ‚"˙ñ’ÔGæ@≤/~◊ã(è˛äˆ=væP˚õût˛.Å‹ÙÃ8ªKπ Óv¢ª∂ü≠à;∑€bÍnI]U∑‰O¬CJto‰ıw+uÆTu,˝Q¯∂ Ùf˙Ë0;VUÂO–øø˙r >ôtãâú‹!.ÿ€»ÒA1í⁄T3Î%Çf∆OÈ}„8ŒëÊ}Àqø%3‹ËRNÅu—u>ŒºV·µ¬0,˝ß3='–∆‹z'!»i¡¥ƒQ≤ìæ$í®ÓD‹2Hm≤ï>RäZÍû„›ƒ¶ºÄóõDVB£Uó§aÿÕﬁgqA£i d·s£hÇ…Nï?⁄‡≥¨Ï!F⁄’/!˘rsÙ¿ø¿V?Çk(ñeÎ2]!ƒ⁄íú`V/ BßÇÑÏI{5Ë‚•Uˆ-íTänAøﬁ˜z=¯{ô(⁄˙Œ†6\»≤Œ”t˛U[∫ﬂÒ07›¶˝5∏ç	ó∂UÚYrC<,∏ß¢V[A¿
€FT√‡ï1åÆë°4¯K5°∆’Éë∫Pku’*.cP»˘5FÈTSIK}ÿ∏Y˘Å"äÿF˛Äk“◊˙ïã à˝•_IiÒá° ïµyHJAõ!Á`∑ù0&Ç∆`âè &Æ9DËW—XVYUò«aB–yjı±h.=mµé‡ÍŸΩÙ©A∫ƒSπÌÀ–
√vÍ«ñ¨√ÏÄÊÏ¨Vôq\Û‰U*∏¯Ã·\¢Ej-É¥ïK"j!àÉIÛîfVNÕ¬Ÿ8ÀÌêh`»ú.ß¨€{∆≤ù°fbÌ0±í¯¿$c?wS˜kkRì∑Õﬂ•∞ä±÷nëŸ£¢±q. ÿ]ˇsMbWsúe√O@!kΩ‘©Ê°ÍµPNõÅ‹ß√Z≈$õì›™„9ÚË q`÷9◊
©g∫sq£æXG•˘#’Ù„Îºü≥°‰Q%`{Â«}¢&µé¶N≠h=á⁄gqVôß4Œ:0˛-Æ:4V’V ç"úË(1"	U;»j∏-œ“`Ç†ç
X TL‘∆àz∏≤R∆36ê°ãÆÜ≈Á&	÷2ò$PîÂM•lÚ·@/ë≈™Ù8ã◊Œœ2Î{1G·¢,|NâÂÈ„˘ÜM_1G¯J_@„.E¥ñÙLÆê£ÒÔ—	Úç'e|§µ«ö¿±Àﬁèz=ÆÇ N}-s¯¨&'LΩ±˙å◊∏‡öoÌuÙ√¬∑æ«N˙÷;ÇÃ>u˝Û wN*»U!¸v≈Í€µ|Ωt˘µa9t1BÏõs˝Ûì–äÚâ⁄Z%‘Î,xﬁv[kπ¬>⁄˙övM§ÿı^Í8ªóbe÷ÊìÜäsïŒ∆9±iÇiMiΩõe†^Ø[Jú¸±H∞≈Å›m	V¡hﬁ	6õŸ{	ˆ^Ç≠æÓ%ÿöÔ%X˝∫ó`Ô%ÿÚÏ√ä’{Q6+Ã”$…÷«¶ÕA§m*ü÷$–¶ª¯zÂŸ
xÑãD[⁄›ñi”Ò‹
©Vü›{πˆ^Æ≠æÓÂ⁄öÔÂZ˝∫ókÔÂ⁄ÚrÌ£^..^2-Ä”Ø°øÁ-‚Dúõª1µ‹Fa∑!÷8(≥∂Kπ(1y¬4aIòÊﬂ6
”¸Hóø^aZÊì¸¯DÈ‚¿ÆOêÊíÆ¢Æ€ ÁfCøór?)wN≤ÌÜôl{/—ﬁK¥˜mÆô°Dã)KR˘k”o $º|ïÉJiù(4Cw˘íÏ—ÿr\r¯$u`ÌÕh)OkEäÀ9û›(¥FÖã:kÎï,SÕ∫Ö-_£Ω ÿÑjÛîÅ±„uG›˜lè2È§ #üŸÛH¡›ÄÓ’‰Í‘ùXk):QgÆJœ¶5o»ó3Yi•Ï)%Ãg£G5ú0≈˚Õ‘UˇIB«˚i°NOJ¬y∂2z‘Ú“÷£i%¯C/)äR…DOàOâê”ûvö*x|P"Åı`ødÈ1$ØCm‰¿:˜ 2VCÙ[6—ØHX_Ùìè±•êTK¨¶üõ•Á:Jh*Â‹öD†÷V°)˘!Â%$√ä»àZvmqû∫Æ’pï«çL%e
Ì≈¥eˇùhﬂfG±w÷Œ˜ößQ}ioår>_Eõ◊Oæ¥◊<™Àãhtƒ˝·ü~˚ØˇÚ[®ì∆z)I·»
YªPı/ã6"¬U¡‹à“:{Z-˛v–«∞ØE  Û,Ö“‹≤IF(æ1—`i ¯)∑¬)å)4ÆT˙Rìå{<Œî∫*”µîøY@o8ëßÈ’k5π÷ï∏8ö‚ââDÇ“‘hL,uU°
ÌÎôÇc©´í•B◊»KÙ‡P
r{5l#f [öiCHÑö=yúìXJóÃ6
gJ]∑ü÷ç û≤´H˙($-u5“˛,êZ‚¬*≈∑éjÊÓ]/,’Ã›ªAx™ô˚zù0UÍ¬¿Ue˜Œ qoFπ“?IB'≤ù!ƒ/}˚=ìÖ´»dE-…πpY—‘ç∞Ÿ¬æyy∏∞]®ÄônòÈZ<Ó/lóÍgöµy{pJ›£^C§P{2A‚ÓzÍj-)ã8Âƒ¿9Pvn‰4ÏŒ©ÂFX!U7“…Ìàoïªs£÷hß˘∑Úõ≠‡‰ŸX-!»„`T≈Ö#†]∂ùaA‘edBü~Å∞Æ@{êS`z1ì
:K&–cñK√∏≥p‰R∞ DÇ≠¿Ç˝…iéﬁ@E`n„Kﬂ[0	@;¥+yü9ΩlÖ-çZù¢≠aŸ``§õ§j6ó—mp√•÷áÒèˇπˆº`ÙÿŸCÆ“·ñﬂÁè“}nÇT∑€aêÖÓx¸$nà¨—&ß8ûë«Jﬂ˙Hgv∫q[oi*√ö·†N¨kÇaÀ{à¢qV5ù˝›Z5}ΩŸlä±’’	ÃmT`Ñl±l3Ω¸^ºB÷WØ,†!O⁄È?™p@ÚAPJ•‹…Ê¨/W)úÚÂiör!]:óÆÃ‰	¸õµLë|‚äû0Mb#E–¶	‘åÎÊ¸®p™€xÖ˙JM|≠‚‚CV*ôs w
Ã√I0ÉV›ÑR6éÒ v@Z]I÷ØE†âÿ±s6ä°ﬁ]nÏ2J®©∆FÓÌS∆ÜïÏ€ÂNHÖeãaUOŸû‘çÛ
¡
4d–`…Ø	®ùf/(hLqò‡G<uàìÓa+I]˙∑O7tﬂø::÷Ú(fEamM”«‹≥
(∆vAlJ€àôÇï^I[Hsú:¢ﬁ–qÛ2‹:ó·÷d8%≈ÒÓJU√à)Œ?jJ˚Ñ8ﬂ¡t¶5Ï#eÂ•◊ïVD§mı[€ 'QóïÏÅ£«}~ÇñLR¸-òæP(»w^“˚USˆáŸ˜† 5µ… Ù€a}‘Z˙ﬁf˚:H˘%ªB÷ûíQé3IÕ?yX”áu!ø∆(ÕÖÚ¥ñä‰€'~%≈„ƒf„j.‘ﬁRïU¢‰\6¢`ª∫dŒÅÍW°H¬Ø™ƒ]qh#”*Pdå#‚;≤‘≤Ù6€&ºú"◊⁄o◊r´~©Âéaπ„ûÃÒ™¨˚_~Y˛R+PQ&â;I$çßÂÏ(˝déﬁ>_‡e5µR/∑ÖRÚÀõÇ–C™PπHõdı¶VNIçG;«'dmìúÏÔÏæ⁄?&;Ø_ø››99x{ÿøâ«2§v1Úpö∞ﬁq9¥@l7G!ödJBAæÑßÑÏZA^åû¶Ú$oìÀÕ)wza7ûhLìøÒ ≠r«UáÁ≥o©∆ÚE∆RºÂ∆¯ÛlÉ˘⁄?Ï™¶Ü ˚¢y_%I„á~∂&Ù"`]` ·D[0ü"Ò»ëq˙DFz4«sÛqœ7≥Ò˙V!cPA!yé#{®ΩÏS)LY[^Xn˝åmXn3éñÎ+ Ï÷\Ïµ©ÕÛÓS∆éûÏ‰u&Ì«ï¸≥êÀR‡ºyõ%⁄pƒ◊÷∏7Y·N‹YEáÇ¢ÌöjBΩ™fX;”R°Ø}iïîµQz’/∆óNù°(¥˚Î_ì≈7Ω}õÙ¡SmAF»¢IG¶’‰VºmO‰∏2Ïƒ]ï¥_H”JñôCmTr0+Ked….Ÿ≤EL¿1˚©‰”/B,≠µúK.W)¿¯ÇaM‘õ¶ùSQπø)sD•&XÖV∂Ú§®V‹…®‹ÌçˆY£P∏À›gÎ©;Ëe11uö∏nn4µU≤…U„K⁄	à≈≥Œ§(c,]Êè‰Gÿ#y6œ˚C]†ﬁ≈nñT5”Ÿ£¨2J_P˙√¥wÎ	‘èCjçŸ‚ÜÙÃÅaô
Aè≠ø&ñ2·(t.0pSYEöT>:À˝‹4˜2ÿ≈¿48ˆ÷Â˜ä‰ªr"ÿ¬π›/ >\∂BïÊç¸Uƒ£Ò»<Û4*°=}8ëMO-FÑ?≠Û©IWàí] ∂Ò∞ˆmô++Áæ◊ÎôÀTSóŒi; Íì» ﬂ6Î;∏˜r•´¡•&MhF\/íQÿ¸'ï‹j^åÍ.∆\ÜçR∆KBS˘ÛEc!6€ i–;£ÒæK·œÁìªÉﬂ‚K‡TuÚÊµ KŸŒ1ŒãÊ∫†.SWÊ…°CÑ∏'®MRÛâ/Ñ=’X•∏áuŸ´Fÿ$-, „*ÕÍÍÊ„n!Ö%!B.Yˆ{Ë∂Ó6±	9u¬(Fá‡b0*8!œ•À@ñÚNÙ∏Òy	∏òΩ¨§ƒ^ù[Qœy⁄∑◊7Iˇ›ÛüÏÔûêΩ∑ovÓm€3ÿ∂ü˚˛á∑ıÊi÷˛s:!ª>ˆeud3ß–‹,€'÷Y$∞0L’åL_8≠@ÜﬂJ9™›Æ˝†∆ùƒ$Äf“ıX™uõsñ;Ü1\ÎFœ◊‹`-r≥¢Œ∂?∂&;Ü†4ôÙC^”x¢öÿ`Bv£?f,^Fá…0NB=∏9˚uÕÚÄÑ’aü6°WêMmnÄfO∑Xüı®˝úö´NÅí!É3nX√
4∏Ú2¸gZi˝Fê€£2Ö$Á±)SLÜÉ<“•ñB|' ≠uD@\H20F|”≤o‘À+“oÙæ}jD∏rJf‹Óöa¢05*ˆ>ﬂ¿≈ˇ˜üëˆ≥€äË÷zÑΩ√1òœ◊db07ùIR˝¨Lg◊b0[ÿ>ÿ9¯!X §<≤«è®y⁄…rÜπ#∆¿c± ª¿Œ∆TãI<Á‘°Ï%19‹r˝≥ªg-ª,≤Tfó•bT≥+Ih)ô•—K+€Eí ˘∂îi~òoh:4õ[bŸ+¿Á^C˙p—V∑›Ìí]°œµ “ÌöüRjCûFD9Mõ5:¿7ö¡œƒ»'Õ|hhqÂ}ënËì	4€Í“aÖÙóârÀ‘ï1^¡ä‹Ò÷=ú¿n‰e
„UÅ25öDŒ0Z&;!≤ç{ñSœr¥˘›¨B«√≤D~
bb¶0'[—ƒs£2[+¶ÅhBf—„m¬¨º!XºXÜ˘µ™A`™xˇVÅŒZŒÿÙr
úuXnH-{¬`˝Ä^+¨Ú∆ï≤√ƒ°ÆÚuÇÄ˛∆‚±©;QƒÙF£u°¨°Ë¿ì≠l•íaL"Íî‚R±ˇ⁄?ß·ÆQ <vd±.|˚Âó≠gö…⁄>»wœd5„pbp7[˝sÀâ…)çá£Œ‚ä8+j&M@*‡”x‰€õdÒËmˇdè.ó@}ç6…%Y‹e¨àQv˜Ñùã¨9+Ä‡KÌ±Úã»˜…ïY„ﬂûlíüÙﬂˆÑâÅ)M≥±)∂ÙfÔN±7*h¬¥%M\`”2Ù«  Ìá\¢∏∫Æ∞ê∏ø˘sƒ¥«‘®ﬂ¯Æ@˘éH«¿ﬂliﬂ•=Ü~ÿY V!√"Bõwj9.eîπ∞LL“Å±Ê43±PΩÔızø‰˜z ¬À‚"÷A7ãœPÜm¯!
ÆïöPî"˛Ÿ8
y#B¡˜|Ó⁄ò>†£¸©RËÓ™+Ò·&Èüº€€?<!«ÏŸ?æw%÷π	PÓ©À:>rlõ∂«Ω?{ïj
ÃÊWLSveä'9ˆπ<’ôCÊÁ“ì™{Ä OW¶ÚPfı‰†û¿®˚˛!/ë-¬DòÏÇ_åkÜÈπ∂$õG7ùd…I–#°ñnø(Î	”π…pm∞ÉE1âg•È∞i; ñ„∆sp¶ZKnbäÌ)ºõ±=kzÕ∫vvÂ◊ò;+Òô6∆mWÂ‹<a<ÌIKöM òµ„ª5˜f¶åX≤[∆ç”uf‹àyﬁ±πöœÑ˘CSL&ÂáhCá˛] ¥1H'k-o¡î¡–rm.µÊWçëø˙q£:Û&ø„’ÕkÂ:ÙSÊ‰†ó„∆≥qDx¶‰ÿ*<S∞‘e≤¯.;TÁîÜ#H∫*Á±»√"kùXÍ(<ú*Å*Õ¿òhEE∆…9idÅò6u–ÇÓ]Ó¸µ‚‰2~ˆh◊¬∆GäÎÛHˆŸ±m})îx°d¶id‹ª±pÉ…>˚È¡CDáÁø¶Düc*2ŒAÍMs∫‘∫ã
dÓÑ‰~8`˛›ã`ò:ﬂGN«è!ﬂG´{øˆt5µ8›•Ïπ”eˇ(
≈∂+ı¨’zÆAcì∑üßıËæ~—A»◊ÂS∑ˇgùÛ”∂ÕoCŒOA®º€9?Íò)Á¸d•/?Øƒü{˛úRÅƒa/…ËXÒ€Õ¯ı7‘˛‘\Ö¥¶6qmj[´Fôºî)†˝dpböfÍ‰Ü_ÕÔkÀüNa´¥·<pÄõA\ﬂaê”ËÇË˝—±¥*#~—åïA67ª844›ºÑ>∂3	ù˝›*°7!›OWj~∞$%I#`º.r#°Óãv}UÁudw)=°Õ¬ “ m∫DÖ—Úø˘=ÈSnNÎ~À∆úFÅÓ)∂ﬁ˛‚vß_æ2|˛xpºH€⁄¶íA:≈6≠≥£ı∆û‘¡ÎŸÄÂù	©k]P≠∏d•ûŸÇÇ#qÖÜ&÷◊˘®‰2√J{Y√–á™iYïÃ[ÊMî ÒœY∑¢y'#’8‡OH#b*cEŒê…H¶;˚!§Å∆d!Ô\Ó¯˛áh9r\60Ò∫±ò‹ÿSÓk¨F›®RN]Û^ÿ3Í/yn5Åîò’}dÃæJﬁcÔ˘®ﬁW;∫’óf-î´∂ÔqÊC¢yVºsΩˇˇ)„PZ@gY>Åt»Nø¯wbûˇ¯√¸üπ⁄öÛùË‘⁄[?œu!Úiyé•œf)
uDÁª¢hÀîk° ô|>kQU0uÆÎ°¥∑ç©$-Ó:è%i>¶ZO˜L;}÷÷˘ÒÛ∏aij‡8±˚/N6…nHAûê2ê‘xöbìyøÿU÷≥{˙QÊ‘‘74uV◊X\cGJE\Uõ8è.\)îvóAUúF[ˇFctñëA˚»MÊo•"ÆÙJ•C(™¿yR15|jœ_7"<>…≈U"±æ‡sŒt+mì⁄∆Ö{µ˚∆ûù¬ﬁ=6)c'ﬁ∫÷9±ç‰D]Ui¨Ìny\hE%	’Íqç»¢NÂ˙…‹”C¥’)ÑuÊª‡ ﬁVÏ3®•l‚Ñ9`‚úsxJÿÅà∆z¨Ûﬂ¶ù140V7e∑"*C∂˛òWNëﬂNTÕ+N·c™çs≈‰∫ˆ6J≈ñR»NÿV!∏ï™∏úcZÙCÕ/ŸTù‘È‰óf˝ˇÙ◊ˇ˙/ø%ê÷Av≥¯„ø˚Ñßiâ{qiçÜı'[ÔkÌˇºs£e6áç∫πî’2è§FN¬≥Ê4VÄ‹ ]ßàÈHòD˛ΩPv@œ47“Ø ≥ñ˛PF“6=u é0µ[ßZwéé˜˜ˆ_ÓÔ˝ºˇ≥◊ØwûøÎøœHÅC'2%bª8√È
·È°ê⁄ñˇöz+t) w}◊ñS¨O¿kjπd'¥årv-◊uŒB+Mp≥rõy&È9Ø‹T
4ÓhBJùsAÕ¡-õM êa–"˛,mŒÀ0î\⁄811∑ãDâœ¸6ÇÀõ E∫jiÚïπÿêÂE»¨,sÔ˜uÏ∑‘?>ÔÛ˜Z¢ê§uLU˚œynÁ»µ&‰Kk¸;ë=Hñ5
∏)ºI⁄˛™îù0õ<›4öÂ©5´ŒÚ&v‚‘Ì;l˝«é≠ˇ’?êÒ…∞QÏÅ}˚˘õ“è≥ÃÍõ‡r⁄Î¶‚u9∂£5V√À~Ã≈Ù‰ûbÀdâˆ∞k˛˛ˇê›ÙãÃÚ6ıÜü,⁄˛·˜‰≠¸HV»>êóÛë~≤çâ¥Ú:‚Ê∂ˆ®$4√¯≠í˝ñöûêX
‹ L—”‚nµO?D‰+é˚“eNZc x∂fÕŸì¨ü'ÓÚ⁄Á±ï⁄©0¬D"x¿8ı∫¶<fµã`=e%]€äF &)[,⁄Ã>]¸≤"e;á¬âOŸF≈∂Éq˚è?¸„o»±8v:œœ}k˝VÈŒ-˜T%¨U†$™àèü÷1Ï©ló—â L‘-'Jl≈\¸ã•‘ ¥pÜâõå#	≤…nÉ?q3Ä«ˆ{2√˘∆ê1--ôò«6ﬂû¿§biqN¨m|j,dHÇ€"Ôqf'	y≥p4Ú=(«˝%9M∆4ZXVò6©ËΩú«¶—èL,XO˙∫}+dqò@>‚prÕ/ìJ¿À]˜∏î;ŸA'Aº+PA”≠ÿaˇ  ˇˇÏ}mo…ñﬁ_©·Ãµ®åHΩ“ˆhe¥$€ µ%E“‹¡Öa\∑»ŸÎ&õ∑ªiYó∞_Ÿ ª{ìΩ¡YÏbvY ﬂí/˘ê_3 ÛrNΩuUøV5I€3„∆#í›U’ırÍúSœy^>ò§∞∞∆1LÇì`)í&ü>$∏s»Øpm·vc«≤5…˚!E¥5±"◊J®µ(Õ¥18~1YuÈ±ñFçïKã51eá2gÜ¢3ÓÎØ `pOm**
ÒÊåoH}Ú’åæ¿]¬",\B¢F”^œç"Tfo€oj1Ò‰¡.ròÂÛ’*˙ı›Î8«ï™&®‰åHÏÆ¨NmÁ€1◊ë˛„#«#ä`=Õï%”PÒÍ∏˘îò·¯F∑&\E4äÕL-*¸/J1x‚¿ÜF.›ﬁpb†nj¬SV≤©Ynü›’„i[ËEœs«=w©>«‹G–EhÆ—R´í™¡=Ú‹u¸xHé˙S&÷Í’îíœ™¬gU·≥™`uœ2UqFYUXé™«ˇ)T—”FUH∂æ5rˆ¸Ë≥¶ê{…ÓÈ4å1y‡K˛Gñ‘59ÛZ‹ñö∑q◊3è]ˇ‘;cÃ¯N∫=∫¸A<.˘ÂûπGgX÷ÛY;¯¨|÷¨ÓY¶vê9‹ˇ¨&,GM¯€?	5!ÈÎ£(®;ﬂ5'kË
˜˝¨TÖ7W†£œ›û3ˆˆÊ•ÛÁ0s˙´ n'`,ã‹»yÕ/›QzêuØΩ?,ªÍÁ¡R÷è€%Wı‘˚˝ê4ß(Ù¢Iàd#=wŸoy·∫°ïüÖ¡dË∆ÏÌqE∆§Í˙˙“•3z˝‰≠¬0ù8ñˆÖ3LùÅª‘Ïæ˙ŒÔ…=“Ì;W…{≈ﬁÔßnçÏg5Ò≥öà◊g5±Œ=ÀTJâ@>´àKRÀTD—›FAdZ«a*¿ÇïC”Ã?˛éà≤Û„gœ/wSÍ
;¡ıpâ‘2‰bjÍF≠?,ÁIﬁ‹»ÇŒl„œK~¢Y$\'Ïaó}Jπ"Kx\1Mn~t0¨òçi
]Fô;πÇ
Öt6¨–suËEjì¬Dø|6ú”ºÛ‰ÄA√å"œM–k;¨ä1®UÑ©Ñà(ü—;œΩ!P@–Û˛-c[b‘∏åLiÄ± é]¡Yë`)'»Ç%J'-Ö˙Ô CÑª =Â¡. √xÚÄÌ©Rjc⁄Ä©Jß=ÿ(∆•p˙2.∏B;j5Úw˙A"⁄;Ö¿cõ†TÉm»$8¶â{√o∂»Ø∑,V,"bûQ∆€M®°SøÇ«√,<∆rø†Y…û˙È›Ÿ¶j∑	…tEÔ?˜»∑Ü≠˚[eâÀÅÒ'⁄_L∞À˘Œ$íò˝jA£Ìa0àqX∞∫◊ÔwrU-∫G%A)¬GUQ+LæeF–’ñ°å(4Ááà8>‹[èáã*Mr¿0
è≈¨ÖDÕ[¨ö!
™†ô"»:Õ;¥Y˘pWXΩç¶–^å∂®⁄VX%0Z∑ÑˇëËî⁄~a2™)´“eçú^t≤ƒH@È_¿Üˇh∂só°áZÚÆ¸§`uí¿–ƒ^JÄ‰æπ}Ì¶!•ÿY÷T ⁄Ç2ÛÙïÇ1•ûfv•3Ü>ƒ,k"^ rhòîåD®N˝Eªe=65f”Œúô†∆‹@Bá&<gÂÃ“0õ≥?Ä<eˆ”´tV±î˘"u®¥UnëàNGm
n3ë$ ÁËNÒﬂ0n8lÆÈHñ◊oÒ
V‚≤%öóñ∆ÅæÚÿòDB\¡¯â?-CÂìKÕ°Æk„V)‘ìã'SGÔ*˛èfm‡/fó˘ó]jZ]æ}5g§›∆ÏÍkI‚fÀd∆xŸu≥!¡ì∏tÜÆ©âÉ˘~3Jà˙õñ*ÒΩá—ñö)õI‰^ä¿-«ÊL≤‚/ ◊SÜëu∫)#vq}å’o¡Ú$Æw…˙Ì¢øì´&ÁErï/Ì8(◊Í∂^A^XÍÏ.ô€u¨M„r„›Ü9F\63Œ&&›é¢©†¸Ç®Ù:eõ”;%O,bIÎ6áMÉç9HkƒkÂ‰.Pr6f<Êg/»IÌòó§ ìﬂ—*…™∏XfG EÑ#ª∑µ Û»ü±Ãˆ»Æ‹úèá0	©«TGãÏéÏ O#∞Sê◊q¢'fî™4ΩAW£/˚_Í≈s4≤◊ÃP√íßîÕºÚwÀ€’`;Sˆ.C'“S@‹¥∂aéÒ_#∆[≠8´úé‚ª\∏b«Ã*ƒÀ(aWıMdb‘©QÂá§ﬁª˘=ë«0E!√Hù±≠è∞`!0"ˆM"©K+ˆÀ¶Œ)£b~6&Øÿƒ’£"VƒCÖË¿6µá8˛ª1‚&69Kã‚0ˆπ¸Ù‚[r4ÜøzTÎ"œ¶^ﬂ≈√vó\≈‘É¬u$IDBó ;Ú+§R ˝)Ég∏Qõ|7t«ƒâcß7Doº|,œá¥&ÚI‚Ô±7ÇlX#ì)MgBøîIA÷–-#¥„O`¬s”`ZXD_ jé°°!M6"2rIøáûK0	›wx{œâ∞¨ëçú∏7$MJH∏Áéˆàóå{Î7±A=Ú{A@]•ß~Ó8öÜËïvù^!ÆYz∞˙X2⁄fÃ∑SÓö€Q_A _ÚÎ≤Z%ÙøÉ¡ÏΩ≈$∞•)Æ‰‚~(¨†ÒΩÏÕ—£Yﬁ∑E¢ r„ú#<:Ã˝°®˛ÍèD÷«'˝#Èì-nsª=°â(ì≥Lˆ9ˇ©‹Ã|∞`UE¡¯w4OŸΩ†˜ù·m≈c„ÀõCÁﬂ8˝M…òº»<úÛÂß=lvÇLπFGuÄ:4À˚v)£IÂ'ôﬂÖT∑*—K~/S√JF5÷o|4K}Q2¶óÈG≥ﬂ}∏õ¯Î”{"äxV4hi˙õ‚wGÙ≈‡eÌõSrÚ‘∏–#¸Ø¢;ÎKÇ`|‚ºÛ–UóÃI0ü`Ô_√aÜO˛&ò]Ã4Ñ[Ò±jUÙ≥¢q•ƒŸ-Lv JπO˜u=äR+[P‘N+cëªëgoD5∫5œï”úÀÓ≤≥Kûùwèûúû˛zç<9?Ì^<?:∫º@x¯19?:;=ø$›Û√ÚÏË‰Ëº{yzûS÷\mÀ±féò l§ib∫"9πwÓFS?é»uÀóAÍª9Ìd≈≤±4ŸsÏcﬁ@ ô*ûÄ/Œ´2âfK‘LöâV{a…E"ÎÄo#7îR2˘™‰πöñﬂáÖk&u>náRÿõñ90Ç¨üôS˚*Û]ﬁì™ú
éC∞q<?ôb≤ø‰æì„˜hüùu·ÖîOyw◊ÜwÑu•ø)xäCíîß¥oÚûr˙˝Ó¥Ô≈/ÇÏb…á‹{km{l≈uı;ôaøµ±u˛yêu.e‰ÁâOv…¡—…Ây˜98=π8}q|ÿΩ<>=ë¯‰$!9?=}IöOOœ…≈∑gÁG/èH˜ÂÒ…EûcfŸÇè[ﬂcd“EÚ*^ˇQ√'-Ñº∂ƒ¿µÜ”´ÜQﬁ‚\ÔGû∫£"íèJB¯Á”+‰™AóhÓüBÇ–otR◊tcé€ÜOI„ÛÄö9ÂÿÎ≈%@.w˙î$'æø±±æùˆz%ÁT¯õ
xÿNπˇsÚh%4éíp=ãq©˜KÙì ù7ÁA0‚<ÍÍÙ$¥◊J‹!Âé≥º$¡IÜ@ﬂAÜÔú4¡l⁄åb<r¡ 'k(k#ÊÔ·ﬁIlyyÇ‡ Ïà;<Sdcü “ﬂWFïãq9»ÉåÅ<W∑äWmƒZ„Â°Sä)?kœÒ<ÿ˘ÇÎkèrHà‘Ω¡çT÷wi.jv‹©§ˆï	|)^¢üJ∞Ì%ﬁ≠2œ
ÄÁÔç‰[∞Ùπ•¿:¯¶–˚õª”Ë:òÎõ$çM≈•∑â°ì˜–ª†!¯WN»“Væa≈ÅQÍhà*É|c∆√
Ù¶ãÓ≈ïó{ÚJ≥7e…a·Ìz"ô•› ∑e–˙ÂGC‰´2{»—^àm)…Kïz?ì]Ìl§ƒPgCF·¨'«çòÿªº‰]Y≤zvØÆ±NG=Cì˘≈≈ﬁΩ)üí•~	ı‚Y¿∑˝`ä•eåÜ°7~€“ﬂyß"?#;%8É©ã< „ûK∫¢∑π4:ßk∂"ê¨ÍÄk˛ôÕD«Ô®Ë¯9MnÌΩÊùﬂùüˆ¸~
õ…%TP=ªŸÒòŸ‰Ó ]NLÈ≥0¿nëÏıè=≥ß—œi^+oıü’OÇ‡ÌÈƒWœjÅr1õ◊…ôírè«xH»Ê˜wA¯YÓ?˙‘vﬂ;£üï¥f/Ùü–éÔ‚©xıÑ¶X°ùé…l>Çû„Ç*Â`v†ø¥"ØƒÚÁo‘ÉW˝YM`˛Fø|·cË\nrs}É	ÏäcÙi¢æ∏çp
†ß·⁄Ã3Éﬁbsw>Hº.æ}B}ëõª§{–=<zy|@ŒéŒüûûøÏûëÓI˜≈o/èòÜù—\î¥hˇ#}Îr´±‰0ª ˇN∆€ò ‹TÜæ*¯ö¶/ÇIﬂoç›ÓÓ—ùQ/‹˛ ñt1-«!YÃ(°f4Ky&%Í3@§Y§œdr+å¶¢)uﬂUÉ—™QŒ‘˝“ÓTáÌ^=◊Ô”ÛZ] ÿ≥£Ïcä“¡ öbû† 
ù4ÂÑt'G£∆>=πi}ÁE.ÓÇ|B¶1}¢0%èM!6i™π)Lrô¶^“"*πSë“SL7¬¶Gö ÑéÇ˝iQv∏Öë	ù1÷!ôŒdÔˇÚoaæ‡´Bò£dÔ›Û\Ó.˛DÊátÔœ˙Ñ°„*ò1¿É–—êálé?-:U√¿è‡ﬁ¢$Éj¿îü†pØØ{¿rG°Ã™¶-d¡m=©
˘Èn˙¶ﬂ§	¥{mØOÖa^mzˇqø4(ÜíÄAÒ´"*s<ı˝≤DÉ†h~òâMg Z‡hÈdlB•J`È
Á:¿TˆQõ8`/@o¿€·ew·WÍùñ_≤∞º{˜ kã⁄WÙÿYãbe'—xÆ˚Ö¯ΩÍY›1‚®ï∂Ω˚nóh¬OâC°ı´w-®Ç©éï¢u-'ŸX1-ÇΩ	“.ËjŒ¿ïÛO6È0´ßÀÕÙ¡qìWÑΩ<ª[]m;ÔaZ¨˛8àˇlﬂGÈ¶¥C0z.Üè÷0$ài˜pÎ◊Ñ
ôçä
x7 X∑M∑–¶¨lù};rﬁ77◊2≥Y--˛Œdñ…Åùö3a CVı"^ ÅbHÿZ»tTˆOƒﬂª˙`Õ@è&ªIsÓ0÷À´ÆüˆXó u∑œ&π>?Ùr|–6∆·‘‰•ù∂æNûª˛ ‚aÒ†å
B∏ëØ¡„˛ó ñ„eè2¶á„1Ìz\•X‰	»eÄ´I$Â°⁄Åõ$>”G∞õ≈˝Ô9ÂëÚE§F9Ω!ç™∏L±˛¨G¨_÷Wè€ØDΩ∆b¿s,ú¢;V(™o•*0ì‚Ìhç8y≈4ë•Ωw5m¢Î√÷™v!FJ”G ∞∏d®™∏+ﬂ"åe¸ —hﬂVtñïöè“ãê,YÆÏÿÍ¢Sìz_m^W(v]ÆÿUî'û´ûÂ“”à9¢,Ôk.†a3ìv'±üå`)e’/ÜW/}*-öéq|H∂Wms%≠3‚)∆Üvc âÙPÇBæ…¡Ñdë a^¨®a(¸‰V∑Bør"XrËFoM^ÿ8˛3/3Ø`‰òùÖ ¡9¥¢¶,Øïu°1ÜènYªàıgùM¸jfpÉtïÒìÀh+C;îá˜iÏœ§Fb—8ì¬∆°ì≈Këz^m¿&‘◊é…Ø⁄lˆxq}Ωë·àxÿ∏o`7m˛}Ûç¯≠löf˚úõ⁄ËuVq;î¯Ë´df=&ó»ÇƒÔ‹(1¯πRß$J∆Ë9ÊÛùÇ∆1ˇ≤ã¢⁄Kà˝¶bOM˜ƒî"d˚îÉÆ–h1Á¶ ÂìvW$ï0c=ùAô¶Y“Æó)Öió«;Ô1ïsMŸ§˜°˝≥;sN≠ûgä⁄∂»:`Z‘˜„DØú^Ÿ2~tjèØâ™b®}3rèúNXH…ïûzqu≈¶WêÌƒú≥úêî]µKç*õ“˙˚Æ%m4∏ôµ∏µo”ZT¡§∞(∆ÇÒùêÅ∂FÍº∏Z¬ú/≠ŒUõ6üª¶”‹bí+)¢∏èIÒk√ñ≈Í≥1`»ï{0µÜﬁ«YÌ¯«ø$G„ÿ]Èª∆à.|eˇ#CW®†˜òbâ!Ìâ´∫ˇÖÈ&gH7îœ∏r_≤x(_>–ÅÍÖ,^≠(w˛†H!ÂgHÈsh˝î⁄D´1TEsŒe∂ëÑ√òÇÉnŒBπàF:2FÍ¶a¬CzÛOD<g€NV‰?0Öè©n©©Œºdìﬂê#≈ACìõ',|6mú.
ÓÏhJyj™Ä¨©üÜ»
•˝Q≠º1G=ÕçVQÆ∑’,~QJ[n'H≈ä5Æñæñyı˘˝‰Uµk«è~¬∫ZÓ\¯ykjôY˙YO˚ z⁄?˝5sxN_Aê°'DlXT@àS ÎºC¥9u3	—â”~*Ÿy„ydÔfµÏ‹•ásB!£“U÷OT1´£íM†aÁ>Î°&r2≈®Ü&WÀ`M‚f„àéÊªëúπ!é=∆Ã]aÀ‚|aÃS;®tu6Vwk§±≥—(?àV/T≠<…ìf“†UîÇJ˚ˆî®è´pô`"[ÂjÙ©Ì∆ƒ7*Ptm
èc)ãX∑è\≠Ü…Ÿı·U6.Ù1¸ö™˜S≤?∂y~:HÀ€SÁ&#§ﬂÓ?" 4#-≤ΩjÀõÕıaÔ˙⁄¨ïE´∞£˘Õ{gµTÀ“íëˇ˙m¢ÕÛZÄç˙äC¢4å÷⁄Ùxı◊^Z‹njDÏ `GÃË‹%oæö!∫D˘é¢VÓ»´ãÓÀ~$HœÕvI˜>–$ÜIg›q"˝ÜÍI
∞Ñq‚ÅáÔ!Í±˝˙'ï∑sõ≈÷`1É”IëÊâ‡•Å<˘züÒ>$oˇä.]i (©∫;^Fíkâ/DîèÍØ@ŒLzÚ∑;ò-»MG…¿1yD}…rø˚’r√ÑB!Q˘wü≤r(9zaUêØ7±GøﬁNCé ¢»ïÎCùò›Ñ˜+Ôj∏qË˙¸eDZ†Zz1Å∂¯nî£ïj∏É≠ähıÍR82õ}œËÏ{â/¸ãPP%’în"ÿxAC!	õ≈—˚âÉ”ïKà„æMYµ÷ö°Ä¥≈ódKJ•k·K/¡-nÊΩãôÓ@VÛ™˙NJﬂJædº¯Œlô U⁄”#ö3/ÙÆÆÇqè2≠∞(ÜeBÈµæ‰¢†Ω2Ç3Ÿfµ-OµvÖå≈ç}é–ó}Å·∂»¸A.Òˆ™®≈‚æ»¡üòëÚœtkÄöT6ñ@ÇËú¢ÂSÄÄ•iúÃ+ö@WN 2√}‹–÷Yj%åt√<Oπh:òÇ·@m¨fõPîü‡°lÖ¸jK~eÿZ*ìFBÊµJâßôø56ÒÌ§£‰Sf∏Ü≠3∫…6ÛŒ_ëzKÕª5{3a¥Êkì?(–h
±o†ó%ùu˜ÊŒÇ?ΩohyCMà≥<ÉgÌ≥bıgx;˙‚Ü˘hKÄHÛ‚[ÙL1âi√ËÏ≤¬ÛYÂ0Z·wπ'ºˇºÂD.€n.¿»ö‘ÿmò¬ˇA∞mÑ⁄Òh7˘»`≤&Ÿî v±‚=L¬Vfë7CÊnoy[Z.˚Zcˇ<`iœΩ?∏Ãt≠≈°ç„ã˘SgyÿÛ;"æ0ﬁ5ÎÅ;™CƒÙ.b¥‡AJõù"æôtçƒ≈¨,ÆhΩã1Eoæöâ¢ª_ëfÚâ≈&›≠Fk/Ùyz‰Æ`é2"Áhb-x~dpDiêŸ5K«›ëuR  lÍCœÛÕá∑Yû/b∏Ø„çK£ıe-Q˚ dìÇCØıâtæŸºæı∂(5	ÍÑÍgïì∏@cKÑLÊK`_ÙA¬NyîDwÛ}ﬂrzÔSø¡Xö8 Ã˚ÄV[ãy≠@ˇ>¬ÿısó~∂úZï˜ÂŒvª$…ôºC•˘éµ∞¸≈%'2ﬂ∏˝∂°t4M<◊Q≥:ΩHä∞G%Å†fVéöÃçym·6µë{5äQÆﬂûy"r´õVüõ ·ócÁEŒ:ﬂˆ˙ÜÎÎÑÅ7¡&Ÿ°£ÑáîQŒíxËƒ4Iî$â`§"ƒ¬‚°RaÜ+ﬁÙî:8⁄<ØS> ®#∑Ÿ§´k‘?Úö≈íÁè¬3V'UπW¶Yp,´¶éX}Û?ùw;uº`n„fãîº#ÿ]…ê1t£3lb¥’¶⁄f1Y*∞2∑µ≤dSF ;aôë—(4ÁôﬁûQ[MÌdsûﬂ◊ˆÜtp≥yçæÿ\§J<€Ù£©≤oZ»˛K;w
Ω˚Ÿîπï©Rπ?–6ô‰åG¢áñuõkdkµﬂ‚ƒ>ÄÕØiôÃ”29§Ë0Î4ò3;ˇ’Çú3íU´ü{ŸÏcX’kñ∑‹ªGæPtèBä0É¶Beïº„"_3”¢VsﬂKo∞tìß›¡∫WΩ‘∫;ÿæ{˙·èˇõ%a∆}òÅÚ2ÆÎ:›Ssƒ¨S€V?Â>íCwıMªì=jÏÉŒEÕòàL„ÂüI¬≤“Æ‹ë˛‚øín‰—|"x´;F“wÑúÄ2∑æÈæl}E7Àv4ÒΩ∏π“ZYmOÇ	¨˛7w÷Ø`-L-ÂâÚ™Ã*ﬂ°U¯„˛ú“úéÄÔ^S¶É∫©∞i¡˘'Äﬂ‰ Ê1øÑBöÄ9QoVÁ{\“π/
|ßˆ2Øÿ∫Xàú”∂P≈è®Ò@î¶˘Æ)©f\C¶©ﬁuY®∆úZhÑö‹àΩ>[•®K∑ì¯ÍCä5C≥:Sﬂ”v-∫Sgy÷Â›Íîº5£[¢öÍÀBˇc,¯çÁﬁ`N„ÿ¬Ø^3E€®≥Û(W™œ≥”«⁄y0óˇJ!€á7F∞]ãwKçyåµ¢ÏﬂøVØ◊[ry}ÕOÈ;öZñ!ª·jYÁcˆ2Ërﬂé±Mâ˚°zªñ3ó¶0r@iΩ⁄Ï0LO8c
q¬=Ë£˛nΩé\åË‡q±2vAöÉÍî˜b«˜zièºÏ⁄§⁄®eÄÂÇßœX5}T»|ËÌïOy˚Pº<.uÛÄIì≥0ò8,(‚f˛ä:Ê¨ SΩÏüÍ5W‹∏zi°<SK}≥
W&>V1ﬂkhÅ∫OÆ¬ËFﬁ-∆∏X•∂+Fœ9†Ÿ≠∫æù¬_Il˝ÑEó¢Ÿ‘ZL8¿„#1≥ €IÈGI&&É'ıpJPgVÍ’πKÎTÈ3Rö“}åüGÆQûÏ Ô*ŒVPt’êŸö¢πÚÁ&:¬”§…Ñ!±€ÅúzÆÍ∞ùÎûï©!3œù7”ºÔ+?¸˝ˇ¢/ˆ√ﬂˇﬂïZ¬∫nÀ€≠é@‰äX#∑Ôqçﬁˆ¨sjıx¸n¬ås9ˇüÕYâ⁄°ñn–êÅ¥˛◊7ÂRéÀ93IñÁXﬁVE”‚nƒ≥~∞Qù[¡Ï˝l∞ÁÂ%->î™cÿ©r◊g°ÔÂ¯˙B˚pË∫19!„R⁄ÃΩıaß¶OﬂL≥f…6‹ë«`¬“_¶9ô“(ÓÅó^&Qí∏Òj*‚5œ≈ Ä>G‡úëô‚d‰„W›yå*ö∆ØczduØ¢&.∫,œ∂”W!‘Ωz!”(éÇös›∆igÒ˝ŒFÉ°—Î:˛í˙Ëf;íÅzfÕ¯†⁄´∑…∂’Ø•Ò‚÷∂^ík1vLr’∑hí+ôÙ∂‰5- Ûãœ€HBËz‹≥tçÅÀ}sñ:œ¸®i≈%◊Ï9•mÛºZ9Ay>*Sz˙t0ç©CµÁîµgÔMW}˘&ò–”S&'âhoÏ'Ô≠≥ªX—!nÇ¡¥õ∆~Ú˜*'Kç}Ò◊¸ïÄXßrπn	5 #‚™µÓlx=5O«ñ¢íò∞ƒ(
’Ñ!µƒä%]C§ÜXd“∞Iëë’zà&-°ÕxÇ·w¶òÇD‘kœ°æv*ùG^≠öèF;ÛBA'˝zMJ¢6≥Ì“2É‰4åùıf… NµQ:6'’ÓıZöõ∂¿∑tïvN6e A-TR[ù|‰Éƒ‚	H‰ukëöÛÍ∆Ö∆ÎCvˆ§ÿŒäµöX◊ÏÜ˝4∆Dy>S⁄ìâ7ø˙^_ŒÁæü´¢πöSñ∫ñ`BñÕJ$ı¸˝√?ˇøˇÛ«,Nç∫ô€ÁÙâ[kß“ÛéF—Ãﬂ.õ∫„~rŒ§»åπÊ≠7ûLÁ1Íƒ1‘òr‘’WÒy„Gçç9Àpﬁ?j`$‘\•pS5µŸœgí,≈h’x⁄N¶£ﬂ`√a#bŸËºq∫b-…Ms2A›V£A
Ê|LÂçYúΩ+:!õø=:-Ï¬,hiCk9w±ÛÕÿπÕË%“sö“ö1}É∫MëEùﬁ¿Úlk∫ÉÁ<úOYPOd/£(‚©Dcd∆GU7~
6©˝È®}`FçS'≈í2∞L‚údüÿ #U!>üx’;Ò‚1¡"‚ò<s«•¬•z…„˚g!zÈ˙†Q|◊x⁄˚âû\a Z˝πUa/8°Î‘X◊‚¿!óÁ≥Fy’‡•*Õ£ •8Q‡øØ©0,EM®•L|ò´HûÌÜèóCóá´ÂT|B.Ké¥_a¸¸L9ÍA)≤È›ˆ|∆©é†©(zÏ"#lH-9¿)∏ê€LID&kûˇÎ†7çv1˙êïÚÉ<Hﬂ@ª¨5lΩzà”˛jh0π[D~⁄SïÚÄâÙZˆp]&^Û·0ÒZ/≈ <t£^1°@mÂÓ1y#	‚»«∞≠æöïƒ®ãÙ¬7_ç÷ﬁ±®Ù7_ÕFwƒã‡·wwoV€Ä…∫≤FVVÔﬁ‘nﬁ.y#ÏΩú6iÜoñÔ…F·wt‘ªCm8’≤∫6À\:	›æ◊YX≈[Ò∞ÉQÁÈê†∫mFóˇÄÈ8nˇVÊ÷©yÊ¿˝⁄ãÏ?"ﬂXréÎW∫mî◊õë<˜›ˆ˛˜Ω;ŸBªáI¶∆1ãX#Nåå=îäx
∫üáDﬁåÄ¬ÈÖAÇúı!ân}ﬂπB…É:2ä⁄$Ÿÿû–Gz
è%Bb–5ÆBœg‡§«ﬂ=BLŸ¶±ﬁ^‡˚Ó¿CT~œô8WûÔ≈÷è<Ì⁄≥Ì.9√Hw˘√euπ‡ÒÄuﬂ'zÉ°ãÌ	,BÁ w9SπÒ‚!q˙#/§ﬂ“1ôƒS3åa«¡–¥I∑ﬂßxd¯÷È¡™¡^JÈù—±õ8!ÏØ8:Pã7Nºaƒ©Î7r„È$ZÉÍ`„åúkÓõÑ¡ñ©ÿÒqî@ùËN2aô4Pt-•Û,≥ÛëÉ2Pa˜G¥À◊$◊ˆÿ5î=Ç∫0¬$‰›‡Ü#Æ•êÔÜË$∂DÿXı∑≠Ë˛ åPlGÅÔıAr#|ÑyOº2˝~äÈCw@◊ÆºïH'6“´ªÔ–-ËóÛ˜ıR˙‘}?ÙÆbãYW<⁄ãh{˘x‰é≥µ7âyÒÌÙ$ˆ)Ê@È'|]x—!t–ÿﬁ®¶¡ƒtYÁ≈a0¿åt˙pß€◊&|ËÚßáÿÒlSäÙ–Ò–:∫^HaÅ´ü®ùâ¢JÈ◊qRÛ¡ËÀÂ1GW◊;û\§cx>áp ‚—Fænü‘ÌÃ•˘FY∂ÑÕñpú5`‘\WrH0ÅEÉ|MÿƒØYuMwl>PºìIÉ∞ôâ^U~H√}≥1Ê…È{I¸VIBÑ≤e&H_ı|ô∆ôÓ´ﬁ°∫cvŒ”ûh~≠∫û`´Tôá?Éåôb|AÒıIúiå`-ı\A∏ÄAvü√ûvKó—›s∞S¥÷^bvUÁI±Î0Á[N*9„êÊCøÍM≤Ë+ûõtÆ	eˇdñÄ⁄.˚•=`<°OÏ]ySe€⁄TyKIcÔVë,´g<y
ÀÜ<CHËd]Púx∆ •ªs≥ÔFﬁ ıgF∞¸j[eá%≥/úúl(USióxﬂBÈbêÔ¢¬Õµ«Ã≠¨˚0a–·%¢˘ÈLPßƒ'Z◊ﬁ{xyt˘›¥^=Ëy‘ˆb‘Ë(R„∞¿úKc\Ã,À€~e€-≤Ω:Í6πiÌÏRÌCèÈﬁ{ÎÒ∞fq5+ıı÷\¬ﬁ¥òr°…[ëËYê∏.¨πJ`î†_L…"©òJ!ÿLÇ5eAΩ—ŸjÏ#—÷ÿ£NLÔ’•|\ëYpWXMm4’˜‚´ ¥•πÖîÕeåÊ—]åTÿç«Q’ñ/zÌ+ÿË{CÙv ø)]+≈åª˝'Ù+ÊÌô:ù9Z•¯Eò≤`˚Â-†ÑøFP≥ßz2=x˝ëÁ†'3jÛtq¶Ÿ^ƒ˜Æ@EÛØ®Õ2◊¨æ®∏+∞ßæøõ¿åvO÷cî˙∂áq6Ÿ)„û2) ∏6⁄=Çõ4 ØV*3ãú¶XÕO∞jj“ãÑÍÈ Ïñ‹Qˇ÷Ω’O1&ß4ÃfÁíÌ·'ô∂∞Ôk¥√HØíco<≤á≈Wèi1m∂Uµ*c≥3æï¡ÁËplHÏmC¯ÕÓm!krÊÑöy|+ãñPﬁÙÀR≤cãÈÀ«:MWHÒÃXìDÏ\LPg[≥ô∆n4∂IH«Á
5Y˘·ˇà¯iFEë“§ICMVçŒ}íE.´ïIæå™2∏Vj¡‡HD1,wÂìE‹LØ˝%ëÀL≤hòÜ%g;Ã&%Y–ëNFï+GÀÆnè®‹±Õﬂl6ÂuMn61ZbFhq7∂›£œ£9¶
tÃ]9æd[©€±Î¯ré–JG–œ[9˝`˚Êy ƒ<KÖ
*S»Ò∏uÿ8¢⁄ù†[ëiŸ¢‰à¨◊Ê[≥L p¿S±A@Kb_î!DÊ±7‘AJÙ5ªÇ¥å‹,å2˚±ÃÙaü8√»AQ•/¿`zînh<'‹lF”—" o?‹˙5~ZÉ.4´àwù†ﬁò¶¨t=	®ÿ\À4ÄóY,≈ùÖ⁄'≤caßÁL≥¶Ö%¢'⁄¬+Rui√9Ée6öÏ&∫K“ã4¡*V=F40±óN%ëNg–Yﬂ6ßﬁ€ã˚i_BÆ´Èt(ÕzÇf>6qV†:+Ú»ﬁK2*%G ¥5t¨0A‚Pÿ™
‚È≠>QñÓHH”FãkÇMFê¢9k≈Se«†IIﬂ_Jµ›ˆhÃ6êΩÑ\c:RCU¯∑sO@Î≥lkô˙2â˙¨<,˚Ã¸ƒ„#L¬Ù±∑˘YxÄÏW3E± ]ã±Øâ"eëÛ∆2%Ï«ËGÎ”ﬁ∫gºŸÑ>π…ÏgÏΩé˚ª‘·∏ñºÊ.w7Æ*~vÂﬁií˚6πÚ¢'“xá≥¢‰Á¸Q±≈Hœ29Íﬂ˚ähHGCß‹¥¢QöTÅì/''–èﬂˇÁøaŸÓypçvg1€ÌâÕÁª…˘ ^äXı\Å °Í∏îûŸï›Tq¢ZÿéÚ¿ öxŸçCÿœΩ´´`\rDjókyKÁx‹©‰x4çE⁄¢¡HeÜõÖ%ï™ÂåﬂL≠”‚»¯Eoæ8_#†VWKÈí¿9âÏ4Á°ŒØ-)|hvV˚¨òµ≥fÓ1êÄ™°Y†“TszΩ5J¨√¿6Ωÿjö≈ÅøI7<ÿäh≈Â[aFı
≠OÒ¥ªπ±z˜´äÖVΩÖñßBQTË£ﬂOΩwx|È¡îxb0ÙÂ´∏ÍÁü‰y?!Ùı<ÄÌ«0ãÒ«Z"
ë¡±X$Ëû÷ñB§ÆäÂÔ»ì©˘W˘7dsc„„,ù’µ±/d„ΩA¸g¯öø˙ºLÚñIL∞qüFòºãp#!/ºÒ€Ow©Pü4]'ˇæP—˙‹â0bÇ¯wå@ÅæréÂÛ Œ†3ﬂ#‡ÌÖE†…=G©˚ÈŒmıåöé¢å≤°Í”∞ÕWtÔ1|ßxè·Sõc†ˆÅˇ›ëÁaπ]≤–πÕ√—îwZÓt6∞ 0owÏ¯∑1˝P≈~;@S¸∑IU∫¿¬∞irwÓåq∫G‰LnÃÃ‡epŒ˘óæà$Ù™X–Öy≠˛^AóÂ£"77:¥3´ËL2©Ì∑≥|2£BÁ9Ò°€Q‡Vªcl<Ãf∆àZ˝gs:êKîU‘π<‹ÆlUN ŒL‰;]DO©.ƒrä”√(ˆ ÛÂ∞D
Q‚ÅuˇvÏ`¿!Ó®!k#ÒΩs5U‰„4¡9õ'@Vx?™zaŒ›Aaîc]√«]3ˇ!ÁØ∆dpVé±{s ¢å÷TÌ8K®78ÈF‰∆'J	i>≥Íçàî7sâî)…ÇíH'ïú”éKŸ ó™≥≥±ŸÉ¥mŒ!ú[PG‘ô≥†ÕQ“Ê∆ºEm ¢6Mã2#BÆ\õ’Ñ8–˝˘q˘B(Ñ/èo$/R:d h3pè¶q‹∑t!)¬wÑ∫†Laö@˜Ö v.ûÌya•‚Ns∆ÇœÁ¿‹gäÂá¸t=-¨P≈ÍÁ¿gÀq˛˘I˜ôºÅê
QU ˝&»}·ß1Ëæî+'A¿´õ©…il‘1%qH˘ƒ°|‰˘ÁÓ3∞≤ª‰õ<√)álªÚ¨|Ö‹•q$“ïeÉ¸qíâáMI>&+«
ﬂ3~≤]Üº·öZÖQl∑—˘w’J∞>◊»’_Æ⁄Pı·µà#˛6∫&ÍäkƒÎøßÖYbi·6Ì¨fˆ&ç´Ÿ»Ü@ìØfP3§Ò}IvØ≠ ≥ºbq¥ù>Fæpú“$Ë6XµπÛ!0J"«S‹Ôâ„¬6Á=U∑¸˛øˇ˚ZiÎË#_n⁄?[Œ":vs!¿õî/òm	–Eæ‹ößu[i]Ç3÷[˜»ó€
îF%}IÁ¯◊d”ö)˛É l‰íñY€2(;M*Õ∏”eH≈¶U∆0¨l/_`•EûÀéùËR[ZÑ“Ô"w}ÇÔ(wø2N,:Áã/	5•‡!SªAbíXÂ¶ïΩ„s+Õ4≤¬˜±¢®ã,ˆF¸B3ÕÓŒ€Ä'¢W`À⁄Èál’ÙÎ≈‘{ ÍïiJQó≠YF^¨<π,7o:Ø˛êL»k‹X[X\Í’>EhúÂ
1ˆn
˚)%ÕJ—(Aód_È¡ôh»wß≤Uœﬁ‹–◊j(5Í˘*]#Ã,V:sn}∏ëöﬁÈâªÅz™eéa«áõ0ô~⁄C»{˜HŒˆÒ≈‚”îØ∫@ä<,ñ"©åtíûINøÏºøi]{±≠B›E˛û/Ï•=o[t⁄·ø£ê6AœÀ§jÙJ≠D∫19˜¢∑§©x@éG∞„•¢†¢. a*é-ÏÔrïÉEáF*[–Òò<Ç>:}(%Ê2{rÒÍê1.‘†ÓYjß¿’£≈Üô&Èﬁ3k.IÅ¸hˆ‡.3üD∞[òô0	√n>	$P	Ÿ"9ï	íyRf à·$Ÿa@üÛ≤¥Má≈h ÕÜÔSÏVùOÙÊ4>ˇ–s„ ¢áÛÀ>Û6”A™èòÁ=`Ô~ÊÜ◊¯ gÜT68I6?GV8rô<<8#
?ö¿4¯¡íƒUú€:…éØXh≥W+à	t)]]Ñ¸’=œÖN¡?è∆ﬂãÜ‰Ö3L°ŸÙÁ†áa…xl‚πÙÅ'^‡É[¸Û 
Br˙·lxaôØEjM⁄Ô.e§ì~`IaJπ#í˛CÓ& XπEÚ∞∆°Á˜Yà©BHSπ¥ÕPò¬[˝ä∑Ë5Ω∆5“ÌVÔ˛âœ=ST•úΩÔ+öº¨¬LR}¸˛XiU—†Ot8˝Ãa◊Ÿö´_~óåAüØå≈peı-qøÉÁd∞≤Q!∆¶Z⁄Kàªº%∂iA√T`πï•.0‹)Û≠µ<o⁄Éçç${§ï7∞ƒ",	NU§"éŸ,?„–ÿÆJwp:+j™†“Îv§<£z}
‘Æ0Ìx¨œPô—ŒQXÕ)s÷XOUVyÁöº5K{–Iü⁄H≥8±ìÀæ3ˆ/FÒ≠3#7^?RO•:Uﬁò≤ÎÜ”…Ë∂
È|∑*6ê˜(/ﬂ”}ÅJ≠≤˜©ﬁÚQìSåLèô»≤∫æ rç0£Ay.ØÌ.çvJáb^=á|¢\îZL‰å:VÆnÂ õú£>	â°∆%]µ653¿…A“7F»€ù Œ•∂7ŸˇÒ˚ˇÒü~¯ãø˘Ò˚ø˝ºEµ3$:k¢F§I£æŸ¯’*¥å›jtpC†Ñ
‰¡Ô≈SëÒ 	C∂“™æ1¢x∏õˆéΩïhE˙<eÆh¸S§åG‘L˜*BeöÔ«ˆ∞£∂^LD$¸Ú¨[:õÔM&àó+aå(¸)•í™z·>nÏﬂ–ﬁ4~SHW≈œøW£†Î:a«∞ÖAf£`X-@—5L/ãÿ»bxqZCI√ç?\Óè\æióÍËÊo[ß≠ﬂÆÅzÔÛê√à˘(‡†Ñ∑ã3ˇtÑdLÊ0ÌÅﬁ	+w"Í˚+ÜÖ›wﬂs£◊È;Øèπ#§ﬂﬂ)…p2ö˙±◊¬îUP„Íôœ J•/Õ·∏,1ÔÀ«»±iê&/É ≠“oòsçìL∆≤©0ÇE¬$èQ¶PΩUfö¥Uƒü´ØƒøØÿ À_wYê·B…Æ[ºklÅÆ∞¸SΩ+≠OÅ∏eÜ≈ˇ»Dâa_Ê>iŒ∏°z∑*A∏:M∑“{•M√ä≥â ÄíQ?Pbc{ï˜/à~.r.∏ˆù◊áπZôZ’@!”îØ)Î∑+„®Ã¢8Ïb+∞ ,|˛,]:ô≠L≠ø¸∆¯ÉÇ"Qô"(vàî≠å^mˆâQÇQ‘ä	∑≈¢l,‹Uªû^Œ≤;*b≈ñq≈"Â,ÎÂ:vÍ“#‚ÇÚöØííÛ¢¸îÈ7äÈ…kï“#≥159
ê4∞ ±4`U/Aâ√6DŸØC„u¡≥«G∞òyƒ†Ùıµîπî©/h*}9CFCû≥	[Ä©ŸÅúA9Ûeµç±dwÂÚó∂áiΩπ≤òÖÛ¥ÉÚ∏Y∏:yÎ…[¡jöûŸ†S≈àº´J$Æë’›ñƒV›—≠ ipƒ“‡0úÀà&a	®ñ‰Ω{§Ú&ı¿’Qeë+¥≈@⁄ÃÕÅé6»√˘pÏ.Õøˇ”_°;(ﬁ°‚ÙìLC¶#eä√0Ûlï%úØÓ÷ƒ›ù◊´µ˙ÓÔ˛!üˆÑá/≤Ôó®R1ˇm[rÈç¡%}#[≠åá$à;—¿m<É√ùº∏˛B'g·TÑ8‘ùÄY«4'”¡0Ñèh˜÷á;Uç™%r≥|säÅí>[)
ò⁄"BA1âä˙X"±∫HÉ>û529∂¿ëÁç¯†vÿ8˚WuñstÉ+)‡∑Ã±6EÔ≥R)eb‰≤O€fÿcmÙj›∏§ãj´¥R˘nå¥Ûæãa¸“≠÷Ü0∞“9GïM„vÿ°>ç¡ªUËç≤RôÀúuÆq!vÜÆ⁄ûƒ˙^b÷‡Æ)≥NeC™#æ¯«ëòMé›3Ø◊.„^ÕXÖy"Ëª1¶Wf†ÇÙò¯#u,3 dsC‰§àGº9Svñ–W^iy‡|„q5æu’ Î°©FòZæË÷SmÔ‘“”î„XbºN~Ó@)˛Ëy¬*Ø=ÃÚç©Î£€ÑK-Ms–˜4ÒH˙NÏ–ÁZW∑Ù<¬wiÿ∑PÿlèYnëILÍ∂aZ¿π˜«“Ωë∑ÁõN⁄≤~SÓS£rµ˘oß†∫nml›_5ﬁß*ˆ $˛LüVß„AÄ∆í
d§…‡+Æ›±ﬁ¬™7Ø—b‡º¨±wUÓZÊ7±oYb„-=ñî0ynKIºH‹ÕBÏ¡*˛„
Òù≥§‘˚˝©çÏÌ8∏Ò›˛¿«º›béhü¯ÒßOz¬~£{¿éîF0ñ~‘.]Åµ∏õ˚#?w.”≠yÆÇ&^|˚Ñ\vüê≠]rv~˙Ï¸Ë‚Çúùùû_íÉÓ˘·πGéOès|¯m˜È^\¿/èN./»ã”geŒ’Œˇ¿Ll†”´KÁä-?∂†~◊s¬~¥RuQãNF ]CΩ C
•E	"Eü^–”ÿ $Á¡9s∆ >j Qv¢¬PäNÓo‰+∂J6›ÑœŸÌ —':∂$mAhôUUlI4û`π*;ﬂ-¨Pd.«ã‘Cã!¡Ω9·€à¿ı¿dQŒ¯ë∂ßTTâø¢æ›Çjﬂ∑Ü≠W;È÷)]8∑,˚t‘Aºr¬V<,ôÇx¬ ïb≥Ñ	D°‚∆TVájk+1a°Åá@˜F]Ôi–õFÕìTåòb¬;
√ |öZıP%VûMÒá1∏f6É∏$’3;Tõ§rD≥Y4Mµã<ÆS+V™í≈M˘Üæ	ìN\‰å˙‚Øƒº]Ô(L®UúÇb(Óa'…–¡*O/jI8ÿ◊€’HÍ*µ	‡£æ’íc±ËAÔ£O ÑåÏ≠ÇŸUcˇ*u¶ÃìUçﬁ‚u]„2eíH&Õ¥/k§ºf¸FU|˘·µV>§ÚÓ‘ ˇŸ5$¸Câì_«vÃcø~{ÿ H°
À⁄0ë•›bÑˇ6»S≥;'{27BÖy@ÖxbÇxŸ∑Íö∆9,’Øz¸…ÛÄLj.≠ù∂Ävè`§ëÅÎ$1tU·¡`Pä∞Œo¶¢›ﬁüCª5B„-ÅΩ•iƒ&ßfh¿øF^Ç9}#¶;l'ï°™£:Ô’SÃ(Vœ7§PäU•û7∆ì€ñçøDâ»M‘˘Dõ_‡Avæµ·ä§À$A"•åéQåq+'”ëÀú≥,_:íN'Dâ|Fõ–^õª[
¸fik%{éF·›–D∞
ZëÛcC∞)˝[t_\at2f«…{hê«Fis≈]FŒ/√œÒd∆≠íc‚§-a&5%ååyoúdë”w—âp‰Ñ–πb;DJL–w'–◊`*é·OËå`Ç-H9u⁄ÑZA84£†¬ÑïnÏé{ûôDz|k¯zÛ‰Íf= ¡Ü±èDøfß4$∂›B4\≤˙æÛ‚!RËN”’UvÍˇ
˙öe™Ç/„¯Ø-ˇ’„(&s˙ØûÈÔ(@KŸI5ØÓ&¡ìÃN_¿˙‡µÚX[ºiuö=kæZm 0tΩè¨álm¿"ƒO/∆'≤ÚT+å—ÅÔ_Ωf£)NXÕêøáuÆJºò+√Úî]uS]‚eÌI_,b'tﬂyëã1;ˆ%“n∑µÂ¥V£åD Ì÷jmÖ≈äØ”FBP@ºﬁÂÍkî`;5àC±~e|_|tyòµ¢@% d¶*‘.Ã0˙;π“ò-¥*É≈H°MS.≠<äc˚•"˜fv3˘Úÿ∫ú¶ä˝ê¨˚—…}(ßívlë¸Rõ¢àVçUO6EΩ…Ü∞/∂“~8Ö¢[;ùîôÅ»ï’M_…Û“u≤~=≈©'s ªÃIÿe≥≈·Uk„∞MÑãó	EYRæ¢ÒÕfmX(¡ÉÜß–î®•éòùËüóLÔèáÆG,”^EÃ‹\õCM#œ°.(≠º–•ÁQúÕu|cõ°ÜEPïòÍØm€a™k¯åÆ®BªGŒN}Ù⁄J]bJRµ#Ôcﬁ—„ô—_Œv¯’xodÂzë®G¥é«™5Ï±üVLã4&Góˇ^íOÈŒÊ)m3/8ø2àÔ—O∂,˜§ü-≈sööÌ∑t8|˚@∫∑ﬂG+∂ïÏjßSËè‘mi¯¶›éeÖÍ-9ÕüÑN«=«(†¨‹≤<ˆf$≠¡(dÁÅÇÕØíBÛ±…_'u“¯ 9hHÊYÒL~(u·ƒKôóè†2·Yx„T¨
˜‹f∆«z<‚}aﬂµ:ﬂB˜aïX…Òöox≠nïP%Vmqø<T»æá¨˙«∫wjRûõßGLUÁç'SÉlÖ˙≈\1„)⁄5∂ÆA≤ÅÍÖ≠≠;Ú∆è∂5éú˜èò/ŒﬁidGÎíΩòÊ2q¬»•ˆ0œLÓçõ–ûµ$O9¸Mo:«ÈéH@≥±Z√)Ò©∏¨ÿâıB‹U•ÍkMWnSØwÂ˝ÏΩU÷¶`¸ƒüÜÛ∫N¡
p|IJk8§ø‡IØÙ◊|;ˆŒ~”ô{A}/πuóŸÉüÏÍ¯$∞çõ÷Ê)ÁI(%§˜÷“êTÃìé∫FºÂ.ﬂ¿3 –Lc™zR-‹ÍU,“‡e}öÆÎ€ç˝uÿÎ§g≥\¥π›p≤‹}x◊\¨«ê‡B¯¿&°6ê≈‘=hÎÅ;ã°ÚLs˛I¡â \"&!ù¶ eˆÍNIöÇ§W]T‰U≠Ï`éÄÅùµêY†iz).c∏‹1s‡^ÄÊÙ÷á]]ìÉ€4£˛{Ì˘~Q∞-∆‡i©fÜ¥∆Thú72áΩ:µG†æè¡œcè±b∆ÎxÃ∏4≈ª!—ÒƒÌy◊`æ
∞d/Ñ±¡å£a–&
««;Ø¶å§èiD∆∏ƒ£∑0
Qcç4é∆Ω`Ju°◊á€Dy—P£µ$ﬁ∆Éj›qÑ¸ùÙ%›®±ä»ò¸ÙzpeêFïõ‹ƒEæá˝ÊÑÆÅ˜q‚√‘“(≤Gç”	'La‚(≤'∏(‡xI?tÆQËÅÜ≈:Û?å&C'¬ÅWvb§òÉw.Ω^ˇä%~†∞$WˆtAèAÌ\û)˚yî$ô Ò)[Ü+´’[17å{jhEı>ì1R3—){≤∫»V˘NûC:√äÇ8±TuƒD}Åπé9˜Ò‹∫™œ÷´·sé91s5ÂE[´	Ωä2xiøâoTÈ,E43ÜS!ô∑Ã‰laÚ.å-€ë˛AÈ¶4ƒª©\5Á»è¶€ﬂ‰pøs†£b∑?_Ë6›Øÿk5ˆï5ePY∞"f†õTfåû≤Ö=I®àÖæÔ>cÉ·v=Ê>8`Ç–DÅÌ{RFıÕƒàé÷Ö‰b©S¡K˘·6`Q„hK?c˙b6Ã©‰\,•
m…7S2÷Ô$ÅK«-oÂPôq„°®˝Ù‹Q=VF;]oúØpØ.]è–À¢	ÏÅZ˙–Î» E¬O¯"éÜª¢Õ-J¶–qMáÖÄ‚v:Q≤W%1!∞w[qµ¬<µ†yèÊ´∆∫º∂Ó§C‘`P•QS{Ic	=c-fÜ±1ƒº'QAb∂√*mÔñ¨∑Ô°ZUeôfêÛ°∂zjÈ).ï¬pêB⁄Í˙ôì™È<≥åz
œ
àRÚeö%Û
ÌtO≥y ¢å»X$ß´‹ä¢fXÏ8Â2§m¥&Â0π”‹¡+/wÄ>·Ã|äµúò◊{:È;±•◊ªæØ[{ø›Tä√Rå=Ωô”˛Æ¶;≥˛œ5|ÿûVhı(Q`uÀ'Â/JéjS—1uM§Õ-	Øj;	Ø“îm4æ… `±ç®ÔØÎœ=/®wÚ‰†]÷l(íR∏Ch-˝v√∏0„£áB•:´¡ö)⁄;T—V	—ã=â[äÀ67œ€ë\Ê
Üﬁ¯k+T(¬ºX®ò¿¢«¶Ñù*eé2˛û?{ﬁzz|xÙ‚¯Ú∑‰ùMv]¬D/9¿ìÉGâ"≤ûŒ´ù£4mS≠È>f-ô¥ÊTÖT€DßÉ≈“™bËvñm\í	*G´(sc®ﬂÌ=ı|˜Óœ≥8R˙M„˛î±ÎÀ Ûº!7¡≠ˆ›d“dû^_{4ÀÆûÒç î^ËM0C4/VBÜ›^£Ÿ‡0É |ü–3ªNoàËX◊Ìc@Æsêlª·ídã‹D+LmM7–Ò¡M{2*nö8NÚs-MXÓ>Î€zíãTÑ∆bW Iø¢íõâ≠…≈88~¸˛ÔˇsÓùaœ∞˘£´L¿è`~¿ûé'-k≈6ëß!"◊´≠Œäd$â0ë¥àÎõ©¸v˜YóéùÁﬁØDôD´˙‹Ë=e≠2êOï7–-¥T‹ı›Uj™_=˚Ú*O†Ã*ifÁ∆¶$"ÔìŒÜB4Pp&Ks≠QÕ'ÙÆS0Â' 7‡ıòºeúcáã¢ãﬁ0|≥≥⁄ò&îNBÂK2IE1óé.Êºî“˘úQ':∞,YzøC√†◊LŒe«h»Ê Ñ$0üvƒt"#*ML
˜ MÍ("L'æ( ¨•a®ÿ˘˚ïπ¿7Z	Ú¥’≈ˇ√é6úsf[≠UëIó•Âg€:á‰@ÌQôe74yËbè{Ã1◊Â∏uDøbâv^%ö{µ F?õ2S 2
Ú¢±DÆã”€?ô~=>$Î§{¯r±}õØ¸nu«Höà™◊IÄÿÂ7–Ç8∑NRDgmØﬂé&æ7WZ+´ÌI0ÕËÕœrH(êì–‰Tãç¸1`$o?«éº‡Ír°D∂«fΩ©†y5È”ZÑhLÚF∑±åÓ6›•ÏRÄ≤ò“j3/ì#Jÿ"_∏◊ÒÆ r>ÙﬁÊ£ßˆo§Suë».§Êè◊4⁄@ã√ÈvEXíNõÕõ†Ì $u©H≤ºV ë2õe™SaSyèE`µñÔˇ¯˝ü˛)Å~^Q`∫-’Án4ıc+¡ÑW.5’5ïetWôƒ(Lãí@	˚›wÉ]¢3&b§{c¶œ•Å«%<ª[]≠óJ≈8 ÃÆ‡öÁˆ≈tQä∂h1áƒ@ñ\©‡tΩ¯ÑﬂÜèâ 8•Ñ§[rSN1|IuB ;84môît»ßsE’°óıf∂∫ö˙D¯ èÃ≥ŸÕîzm√RÀ»[çÏ*ùg⁄∫∑z≈ˆµÁ√Ñ‡<	v	‚ZQÇ∏8ª¡¥xG¸ø*†mŸÿe€Ql÷ÒærÒ2:Ö‘Í≠^ª5bÆÀ◊≠∆H≤¿∞˜Î6Ÿk ≥kvBcyõtòVÔ¿nƒ£©o•3Ë”….—o]ÖyC'[N˙≤µDL≠às1cæõ€f⁄2∫’i…H√-åÊÈÿøÖn`f_K¯ˇ–âÑ"MMÀ„>‚¯ïoy‚™°öçDÇ)]/D	ó™∞)Øo©ânï‰†\µQs<Íy#L#ãã‹sSB™@üD⁄≠SFt6“v@NÊﬂ%öyL≈¡C∂¨‹Ó¯Îˇ"ßÚw–uÇ˝ÊŒßhbCà>7uú&Wæ≈a±*®≈±ƒ±Ωﬂº‡
ªCô«í»’⁄¯H∏¨Í‘¢L”ﬁ*Øgöp’ãﬂÎ±(ﬁ,∆ã)'Å\1c·IÆh{C∑áKø_ûÊ*{Ÿ*ƒKSâ£/_-ñä1≠ˆ E/Æ≈"&.˚˛Zên\•oöÿ∂µ4∆RπSdŸ.BG6÷íUz¶È…ISÆØ+◊“ñ≠Ùe+B§•ëeZ‰∫¥œ)⁄ùt«é≥lÛJ¿≈Ò∏èËD»ÃÎ¬÷¬
vÿQoq¶	M•≠J*ß5`~%6Ã`—D¨ªí8NtXD.¶£ëZql˚ÓK‘)efN⁄¶±9›^	≥Åè&–âÌÕ’f6lÛ≈îfÖ…»y‹!kE±ËtlTî“ıÅ&W1´áefWº,≥ªÊfE*…ÏJöF˜
…lAi+ëÌDﬂOt˙QG9w∆o?ﬁÙSèã-&‚ó≥ÑîäææE⁄“_À#IZm#ıÆ⁄ˆ‰xî<r∆O\ìyö`åÿg§¯ƒg2I2z}ôJÈË∂èHªü‹ÃNâXGæ(4ÿ—Œ¿AY≠®≥WË÷˜ı˘€<›»Ö¢£’Oh⁄∫_ï˜F†ß≈§á!ﬂÜx?Zcñ˜e:¸+•Saô“£ÜΩa0∆dˇ˘∆Œ¢;A4œk÷ƒö$DE>YK˜⁄èﬂˇ›øê≥ Èò¶>ïÉ ƒﬁCﬂ¯.9zﬂs}˝·"I5“[—YH"X‘–-∫éoô≠MFn¢Ü h9mãâjÏ•±Û–dz[≤é§ÿEä{:!$±ÁÃg◊ˇœ«W:õèÖ∞KûÜÓÔß¥≥ØÿB'ëÔM‰ëƒ$`·ò€Ÿ}œ≥∫·#t;eƒAƒ	rÛπ7ÀÈr√jåw3Ö`Y ä`Ï"◊B5ËåIxD∞{P_,ëˆIÊ≥òD.-“L|ıÂÊÊÊ√≠Ø•ï(ñgÚ˛∆Œ¥∆K¡ìÙâE¨y1<W‹&'π‹}´¬≠l≥"æ∂Tü‰,∆z}5J	)õ∆«RÑ2Ò"ë√¬ø%–ÅË$eå §Ô˘ﬁ üvØØ©òÛ∆¬ÂyPCD!^ƒøÛ`g•Êy©ØYW—∞+dÉq1“T@—î2,&WÓ–yÁ°{C£ΩÇèÃ¿®sV$n≈¨c;•mDz∑=ﬂmøπ3	˛\8X_ïı|E2Ê"^?Úc\_/∏ø≠G“5vü§µLÆ…ÊEÄHÔh·:≤”ä¡CLdnhH¬Ïu”⁄ﬁíÅF¶Å∂<ÃñŒπ„dŒ]¿ê8Ò4¥P®≠P ünWHT1∆Xëò†ø∏.‡
£˛zﬁC≠ñ6I´´.®¢ê*u0g„‚èr∂“f´D<w˚¿.3h{!ºÖ¡àÁ8BÓ∆8 …›√H)∆/»Œ¡Æ	˚Jx-2Ü € O"ã9– z®∞oÚãCYﬁöÁ*h‚≈∑O»e˜	Ÿﬁ%ﬂûü|˚‚€ó‰ÏE˜‰‰¯‰πGæ;=ˇıã”Ó·Èæxqz–Ω<>=)(kÆˆlA3aƒ\LØ.ù+Ê
≈˝ﬂÎM˝È®S]‡v”ª◊˝t“.É-ß‡k +πÔ^9!Ù/≤i∫‰ƒΩ!Ú»ôÔîEìñ¯ã:sP
WïîeÏQ°˙Â$Ny±ÿﬁ(ﬂ i4û˚¥k@9AHz¨*˛æXıM‹3NßË÷˜ù+‰â:SÚ–≈AçJ3Kô]˚RGƒ›Í&ﬂ˙Å”/5≠íí{xÜFÇ1ÃoêZFTGn˙w €›kgÍ«Õ“ìÔö4øª7ÿÉD–s‘\]≠¿$p*ó3ïàR‡"êÖ2»Úrh®b%°î›S¶{2⁄∆nøüÃÄ&
zY#˙ª±DÃó¡ƒÎEO¶◊◊n(Ô‡’q9M“˙:FÄ∏q…-ÎâVise•¥Ã‰ŸÉGR/“|ı∫Ù>^(`§Î'ïd2ΩÚΩh≥ßwt;Ó!Èær«ø-…ªª<q∞-x,*"ç™„ãˆ`∫æ!»»  à˘F1»ÿ.))aÒá/pmoùV\—80œqæW(Mú¯LùûUfU_ÒâÚº-]qYqöhÆ
):”tsÃÜ¬®ír"†º‘ºßËgFy≥ã÷ÙVk{£ÿ≥ﬂÓ≠≥'Õ*¯ˇ   ˇˇÏ}Îr€HñÊ´di∫GÚîDÎF_¥∂jhI∂5m…QÓö]G≈DB$∆ ¡@Àlµ"Ê6&v˜œ∆DÏ∆˛⁄GÿÁÈÿ}ÑÕsÚÇL ëô )YÓ6£ª,Q@"ëóìÁÚùÔ»¸nã∑±≥±K[÷~ù≥I∂vvDÎŒBÕ¥E3ÌÖöŸ⁄Ìlm.÷–ñlhÀØ!jü‡ﬁ∞Ó~∑•@‰Éz∞˘IØÇaåÃ:ÈrÈ"Ñwg!"®ÜbD„íG2˝£¬kÜL zª]Ø≥$q‘® ãÊãtÙèª‚Ìú:VK˛€Y€?s}Uq:››·'ıú÷n°+˝EÇê≈è¸:†äZ>SÊ'ÛÊ7úÔ+C$mÓáù˝@∏,¿(n≈$‚/˚7¬Âæv|∏Gÿóﬁß¶´^˜rŒ∞≤/¬—$I!fƒ• πDuŸE4ò÷:≈åπﬁ0_7˝ UÈRUzHı§7ˆL£Ø-≥√6π…CŒπfc¨ÌŸˆ-›g∫vΩ€≠ƒò/#Œ,ìêWqÜn ∂ôíÂìUÁïÿÆ§	åh≥Ü∂An#90≈Ó‚˚€Uú\”˚=â¬™›G‹zûL÷I‘ˇ‚Y/@ÍÙÆ[£{Gèµ°@R◊áj¯á¿ìÄ=T:ZìEé¯¸+ì&˛ôé&ﬁaz.å¨7¶ZeÏøÃíx
¥Ä…
 ÃE›ß‚@e4Ä¯eöda©¸Sôêª^›Ò“ˇ˘ﬂˇõgîﬁüUµÏ´ï(ìtÍà–Q&?í≠€Ù…D~¸y.∏[Ú6”¸ïKäpü»JAHæø¸ó=ˆÃ¬∑‰R&ÓÂ„—ê´‘	HE∂™	⁄n$|Ω4kíÊY`•F≈,"≥ˇf{{˚óí⁄#5…Mµ∫Ú >?K»Eî«~Üv¬ª∫≤ø¡üBıD·ÔÁ#/jTOŸFÛRQ&√ÈÌ¨ü&9UŒ -ÿgß≤ó ±Øóè†°.
gÚï„|Ñ3DÈWŒ‡U-7$qÆû$ôã/Òï˝£,ßSœ{U7Y◊Û‘
/≠nÏ‹úîéÕÃ≥¬Ôa]z’^ıw◊-*œ:cÀXTÔ¬ ≈∫Éoí æ€ÖÂ+2+ÀÍ}q¯.º∂ä∂Ê[`ö≈¡#5pGÀ®y*_ﬂ–*ıª»S_o¶©œQ2BÂ9)√âÓHü¯∞‘Êú/ñ=ÇmyWjÂtè®]´”Çä,Øm<Œ◊4ë˙0á[€~-™j—èb’#‚1í„^ÕB¨≥Y)∆l⁄]0√}òWAõ]ı±’¬`Ò∫k{QiS”Ñ¡J√mä∫Ÿ£ÿáqGK'p•ÿGπ∫ÓSÕÆ√˝é;_àùbY‰⁄ËÊ_’ª†ZÂäCVÕ⁄ag§≠hπóé˜uÀñÅ≈ê6Õ6èP…ÛDò!Ô¢Ã≈ÜèüEÈîONpüRLteàÑ∞è≈√ãƒ•
4˘eÆˇvi-lÎ•$Õ…≠’4>óëŸM†b]9•‰æ≥Ω§}JŒX0ü#∆ª≥qØ*≤Nók÷_<XJ›ﬂÌ”-≥≈…Ô£z˚%\≥È‘¯O OÒ`ØP⁄îR Õ°Z’∂›Dáe• ŒXäS_IÑ’¢ à&x)d¯d†Û¬«À—Rlêß@ÉÔ™V‚UÆ[É˜$t(¢1b£Xúæù∫‚Å?Ñîè|©p3…t@—aπµ∑åb~ßÛ≈õ=iªä ﬁ\“ﬂ[+„Î[eå≈f¥Ü]^w'NlNc{äã·›¿ù>n∑*»8°_%Tyì1(§®¡ ƒå≥	≠∂r/ ñ§•Òä†[á¯ï€ïŒkä¥ç®HÈL◊K$5ßªáz∆MjºÅ NgÏ*JGk+∆	FÚ!O¶1zl†ùöWa<„…j£DMp~&,ªÖŸO+NaÒa@æ√0¶⁄ØÇÂ„SÁ[π–GinXNHãÏÚ8ÅVq¢–0@`â!ÛŸ◊x1F†ÑKW)ÅNïå˙8ƒ«ø	∑∂˙ªœ~)ÎE^x!‚ö(ï…¡g˚r•ÀÊ∏X‚YN!#üòF°á4v„,VDVA3/FÛú◊r)¨ê≤≈QC]≥•ûQ‹ˇ∞© (ı]=˜Ç–!•&µàîD˝"∑ı5$7⁄>+˚¨Éú«Ï÷ªäP#ñ¢Nôm
P;I•2'3ë:¢≥hôuñFNπf˛
«C€øƒD©vr±p¢fƒuÏ∏Ç~ôè5ÁFUC~RïFê∑GËô'‡¸}	≥°∆Û’’J≤˙|Mÿº:Îe´gΩUç"ƒ+œ¶Øl—GxÖõ'AﬁÆ¿¯ûÖchótÿ(S˚ÿs`Ô§\um\uí≥¬êãLå1ıª∂Äã•”≥åWc˛;†ŒCUk•a⁄◊÷Ç^oùÙP„£?íIèEÂ◊…Ê£[Øjƒ0bKí(ô'&îÌ˝ÈoµwaXôuí7Ä (›e0µ„*bFGm©4:&5M)˝`‚i∆ÏÜX<3˝√8 	ˆ1¶ìâØ‡≥ÿàÙ¥g—÷¨vÅπ`µGWˆ!Ö›h∫‡n¬z‰ãﬂiJC±îÀ|∞÷Ï%ÎÀ›Ù*æN¡Îƒª9ägÍmë[M±ﬂmÀÏÿ&‰Qß	Oéã§ëê8 3¬U4òRÈ‘"Ø¶]Ò3∫xy™-Zëa_5,ôL∆ò<CV$ÌA€OúÛbw˚aÒÂÂÓÓë£Íúüb‚-9Èúvﬁùù^êÓ¡€£√ÔéŒkZ∏∑l‹K0 ññàª{â∏<‹ïÙ@çÒNG_+Ìv.Oı◊H¿=ÇôÖ Xl–ñïy´{ìCzDH—^õ¶T
$*ÈC-WtD]á‡òQ#®ﬂFﬁ-"¬‰xòÇ√‚˚EÚqØ¢8Ü∞
ÚÄSç¿F§_áq?ªØ§\xâ5ı%1Ÿ~+ísïïø“i]gÅ¯◊‘àÃE?„$„Ìlö.∏ J«ì ˝ƒ„ıõõÀIÊï/‡ó ´ºìÎ%+&(b’î’5.§RˇØ é<&ùãÿ—ªK≤ì”>göR±lñê`◊'¿ıè”Ëè‰,IÛ´$éí{ ∞˚û1WY¨*Ω®ñ7ŒÎ÷ﬁEÍúîú¨«øÇºÒÔ9ÿz3A9ÿÍÆ„h~–>Ä£b±|lUiX¯∏8	®-M-$è\ÇÔGƒ›È3E©ràdÿK^£`ˇ4[£–ç(‹˛ı‘≤º‹55ú°ü‡›=%ˇ£aE÷~˚»3˝¿7ı†Y>ãæTYß‹ÆaÀreM4O3XÓíe”Ñ»ëíTúfŒ.y≠kg“Åq„ÉYïhÕìòÛhY>ÜÖñf—ÃÉ[ûjA>8ß?1$<CÊ÷7x;.!¥Z>ÅÇßG0I[ „•
Û√ƒÖÔñ†ﬂÂ4kùâª∆Öã˛Ùô≥≤ƒ@´O„2Í’˘@·;(ºÅC}|®”√VÅñKi6⁄√ü”‰∫Ç7ß”ÄB¨^óøìﬂS¢7
¥K° ÙL˛Àå\D£ ˝nÑysåπ!È"ƒúo"˛Ã¨ôB$âz£Ò4ôf$À∫Ëåg˚úï^»ÛöSW©Æ˜´¢uJ∏Agpñ£∑1D#1È°:Arà\æjdamylzÈ˝ :Bwìf§@äÑ_àp*b‹˜ªJMÏO<x9π®›¨bÕC∆ä@…ì„o}Dn3Ã∏Ò£ï:˙·óπ·G¬{0@pÿõ
ﬁî2FB-8@·ÛÄ`’û…Ò¶#œX1›∑RYE‹Zpèm#p∫“SúäXV∞y5≤⁄ﬁFWÏ]Æ!íJ)MGA∑”ÙA`)ÜÄ˚`$XÄ^-¢∂‰QY⁄ ÔoºÿìÑÚ§kK0òf·s˜GO†FƒuÊ ﬂ´—R§ç¢’¯Ÿd›+p¯8¸À%\ÚÆU÷…EÌò
û†ù9=ë›	õu~äz–{ñó˜à°fΩœ‡xÃB	◊-#ã‡Á›√m?5®Yi~hÒ@˝|R›.∏HW9anø/YÈpÜ‹ÑäÇÎú¨.,;<≤(“∞é $5ãV*ﬂ#Ä∆≥öT¨ÊHf-“È˘:Sõ¶Xé	 ë:*-8…åÅ÷\e·¸®ÀÊæﬂµï¡™áh%º?∫»uAÆÈçùÕ`ïã2Ä°´+ÁWR⁄’lõ,“\*¶Ïú¢l'k˘¶Ø¬˛ãˇDi/u7Rõ—g hä÷aÔq‘µ#*·aåVígä›Œ≥f~Ê0π˜)]U¨2]Oo¶V/‹ÛKc—œ"L Q≠sΩ˛¢süàÚky æj“Œ3~:Ä¸˝ÜXA†W#±ÇLã`ZÖÇ˙#¡`êÜLÂ	rÿK=®GW≈o°ö´πÜu≥[Ù|‰8eeè	·Á çÇÀòv"O»ecqGô±N≤Qí‰√xÊ¬(/íÿn˝Û7RnÔ˘˝˚w‰ÕyÁÍuˇc˜‚Ë§KøÓº;"á«ÁGÔœèè∫5-›X9óc¥Ú<i‰Õ±À5ä:ˇlûGZjÏ-˚Øô'
hQ’l1‘Äjµ$KÅm⁄ÂlF¨@bÉÙÔc)}äß ‚œóx*w®›xÄ∫¢?¬^%Ô∞0Ω®ﬂç¢úÅÉ_¡[ ÙôÇ∂˘%õ≥^ı£úƒ…5GÙi˚'Äìùêê"Gv0è¬¥E>L|ôÆ9»ù â%™íùceKÚÊ¨ìëAúP˘Ceí\V2ß'Ω
SÌg∂déTá“¬íÈ\_\§«/rÒj∞	ì8ƒ∞—g–≤1´ä—aìT›	˙é#)O=£ëéÚë≤éπKØ¢˙¶ÆAÓ®ÿ$∂ª≥˝ı≈„|∏`sÔpauë+L,ÊÖõ-øÒôªy3,ÿ†úÅ√+#ktq?Z¬–Iè>›@6ıaòı“±qÓG–+R˚1Ì\Ä/ÚÀ§?SªÈ^ÙNrÙuÒDbŸëx:≠ìÃ7C6:ªÒF‡Z˘”ü˚ô˘•¥äïe/5U∞}‹”yø<;û^î ·Ñ<<»»SeÎ)ªÈJâ)•åŒ¶Ùlaﬁ®C„ÂÌ5ÜsáÙ¬´ÊHo?ÎñN”ÏÁxj@2:≠ÑW∞—ß62J ﬂƒ˚
¬¬7æ HäË”…KƒK¬≥◊Ëä[Áø_÷Dí	–AñP∞ó6y∆#ä«MÒ–Ô”G˘¢≤≈Òoâ∑Ò¡/rƒhì¥g˛≠da˛¶x¸o‘˚Öº¬'—TÑ≠' ¥í3Øm ^5˘®MûV’yCèRŸ{ô†ˆ¶ﬂzmR∏∑±J¢ñø•í:πìøﬂ•ëÌ£K£‡Àwi‰¯î§±Ô“Ëª4∫[i‘Pv‹-ñáìó+õ≠≠FÏÍä¬…¨¢9…’}•å*cî‰Yì,Ò›xÀí#∫QÜ§ô YHåx
ëø(‚ERˇp˜h„ÇlÀıˇ¿ΩlπeÔ•ˇ¥M}ˇ>ÿ≠b¨≤PáRWpê[ƒ‡Ä}Z-ÎÈ*zè€¡ÂRrE∂È˝‡P≤≈Ü–ˇ∫ØØƒULr,äplsÖ∫±âæòƒFXDÏüCu+ª N»dx#∂Ï…¶ıØT‰?]∆OTFHéã*»ùTﬁƒ÷gcvµ∫-aıM
$4ª2RÌäI£6xêåFQ.√¸82∂*∞÷.zk{jÅEõlÏ4^\Ω."¢<zq|rD|wD˛ñºÎtªV¶¶e>o$sS‚ù<Ó]ÚDIı_ÆÑÈd„s^o»;VL:sÜÖ·+ˇt∂QJÖ(#Ωl»q~‚≈pªÔãÕ∫ŸsàV!«Ê8‰$¿
-úÖiîÙY"çBv	¡∆Ì⁄g{Ñ!◊]@Ëã~äy®A‚≤u2
∆¡ÄoÊ4IF¨úÜ?mD
äS¡ƒ^6¥ÇñÄÍ5õ£5VÊ·Eê9µ( ˝=ªT·Ïµ2á+Ñ=V™V†&Ù¶ÑæC˛9}0AmÄD∞§`¯)´GjN™C€f›H”•Íã¸÷ô*~∑E÷:∫-v6v≠Ïkø∫9+Jçù•!Ø#¡Ÿﬁÿ°möæm‹ts¢êÖ)Bñ@≤0-àù§ˆ@≠ó
sq¯’H„ójr†¨IJŒÄ&“N÷wWT}ÛïÄ®Cû[A<÷Ã<}€?≥ Vˆ_%…'qFu„$∑c`Í;T‚∆ìtobÜÃTdÀ""3·Áz`“9‡"√O˝`Fÿ1É∞Wv`SÚ&1:ØÈËµË≥Êd·PõYªB¿iµZWÎÑ6∫Wrê[7πÓR≤…≈‰ZüÂÃZ¸∏zíåÈk¨Æì’ãiòÒ˚c˘À≈êÍ5¸Á◊T®–ü~A|Dﬂè5ZàODFÙo≈ıo˜Èˇ}©ô\£zoúKw≤∏å  È;ﬁ|“Ú∑kwØ>^ˆçÌã≠u≤ΩNv÷…Ó:iØì'l≈OÊXÒπ‚'∑b¢·Àµõ	˘ë<ª›€Ÿ$7k¯Û#≤ˇílmìü»ÍŸ…*Ÿ#´ùì’[5ã}˛≤˜ßÍ<ïÆ]rgƒc⁄v b ≥Ï'ﬁ<«ãïúlùú$†…—ãfÙI˜¬UÊµ%OŸù,^Y¶ÂÇπÓX À nÀ_ò≤Èo[Û)Ÿt+˚ßI17~‚ˆFÿÉ£!ü„h»ëÅœ!˛≤/*Q<0ôèå?nﬂïÒ«ƒ˜È
Nöü˘©|∏QN…%Ú˘‘_‡ï°(^LœaÅiE€”˛}à/¸)/dÄâ[´”<aBêÿ¬ËÖqâ@ƒ)
È‰Á…ï≥i2⁄¯%qò„™°_*k»úaÉUáîÚ£∞`ÿjS[{ZpJ$⁄‘#C&∆(∫ä*ƒıE«™»º˘W‚ã.U∫?ÅS\4@Òø"ˇi2ç≥–a1¶?ˇ˚ˇ&›ƒ `Ê6ÿ‘a!cÜwkÔcV›rHtÄ∞´vÍbéÇÀgr>°rÅ!ô©…=oœÖö%|ı;X'¡Á$¬»§üLÈ˛¶K(Åc>≥Â ˙A∞˛—7Ñ¨úõX&≥T◊9÷äÍË[ÜBKïH˝[T´,ô®¿5∆Àª`ŒúﬁbAèRÅQ(ä+Ecpß˚RπÇì¸F¶øZÊÕ2©á∏8hW#T◊	`ìÛ…≥IÿãÆ¢…®»#ôpve‰:Ç,õd|EoÀI/•„ìFÆ√Îåùü!π;W“∞Xû“ƒPïáµA!ÀZGF ∏$§—Úb±òä\ªj›°ﬁZÒœlcp⁄8à{•—yú≈A¸§πÉÿL<WÔﬁı‹^n^ã…%=Jd^h˘¯uﬂY7ÄùNO!ÖÁÖrÇ„øGÃ1∂9Í≈ËŒnã’£rv@é®,5%Éo“®_¬±AVeÈŒQ4ﬁ∏ﬁ¯¯dè"ø™∂∞‰8füÒ{Gï”∞¡Ãﬁi\Ω\Â~güjønã®4◊€ªˆÆR§∫fÚﬂ˛x„1èÃ/Ç¡™-RäÕ=¡`úW≠ÚîÓ,oL‰„«§©ÜHê8Ø¶íŒ}J◊aLÄbcÛÚÚ:“RVò/ã ¿ºd-\µÙ
¯ø`æc¸ﬁÃ©ïºP&vO÷õ5ñΩ«kî∫˜dèå©mÒ|H¨ºwí¯‡zºñp_1}}ﬂƒ
’F∫˘u@OŒIAê8QLú‚(’ Œ∫-cgT±8‹¯¯¥RÒ7˛96DŒ ™ W–=™îú%›QûÒËWÛdw‰›˝  ,T≈cd‰4TêWÔ€ioÆzøÿÌØæ”‰ó/ü≤¸0ì∆YùçäT‘F†QU£h¥˝Ÿ‡ÿÁF¨ˇ≤≥ı·¸-2ö5®ÉÀ≥Uã’OúÁ`;•”1:| ‹r(S
˛∂Fıb/¢çñ˝*F¥‚π(Yi‚Uÿ6' )R0ÇËÒ	?d√˜Ò,-À_†I’Z⁄6ïã,ãõaƒÎ)k#Ø”0‰€°iOçƒ?Êﬂ	ÁﬂÀ%[˛îPﬂÃ5w@t*Œiˆ∂†YÆ≥√∏…t÷”∑nI˙V¯iı˚ÄÖ3kÉãbQò[=î∫Ω£|FW0_©‚8.§›»Q‹‚∏1"ı»ì§{M)`’Hæ\¡—‚Ï^Óo(ö.Rz≤mó¸‡˝p∫ÔJy∏‚Ùè˜Ñ7ÿ^ùΩn≥ˆLó)sá§Â3¸≠Ó/_;ø'qÚ§s–9<:9> ¿vzÿ9'K∫G›ÓÒ˚”.˝·‚√ô°âªF“ãZﬁ@zq√ä—˘$§«Úà=äÙ…∆≥Z‘3E?5™/:úÌLzå´Br¢1ÇΩÏÂM˘ÛRÃ¬ºSπ’•˘n‡‰£◊„?µÌ_∞ãƒOÊÎÜI˛zù¯©∂Ω∑ÚRÂÛ’X’˜Äéı â:_ﬁîæ®}∆Q˘∆Íwñ'ä9⁄Wö≠πí€æÁI¨‡›£„ÉoM∑‰˙◊ñ ØèO;ß«ùw∞À/éOﬂtÈŒÔ|8<æ ÔO/Œﬂø3ﬁıŒßv}0ÓEA¸œtr»xÀ yÎÜ∏ıû§¡kÒ‡.ÆYÃµp@ä¿ uYl·Âç|Àé˙Ω˘÷dÃˇ,p t`^{ﬂˇ‡÷,y≤G:«tunúΩ{AéO/>_ˇûbÙºÍ^tN/»⁄¡€Œ≈£Ø∞p!2	¨´π˜zïw,7˘´∂Pú0ÇÀ∆I[t"é˙S∑
b“/C~N“O¯ıyZ~YZÄO¬ÕAw–Rû¢¬BΩXÉåí~gÎjQö†®	≥Ÿ0sÖY_‡èAéYJótò÷ƒıÍÜÜAN–Ê∏¢o]∏ó§éúBºpí&£IûÒZ!˜ú Qü¨±úƒ`FzπG∏¡ ?Í≈>™VCJ"åd0ûqNq2I&∞\â√K`œ∆PÏt¨Æ¿^!ÀËk ˜([ßtï‡âg{◊ãgL‚~îú5_÷MˇÇ—õ wyó™Ωk+t$¢8$Èá9›Maü¥7¿ÛØå OÖC÷÷S®†êŒËh¿@fü¢òéIé©Ÿ>C–*'jø¶„öÆìˆ&¸üæıl≈jA⁄òSÀÓrPb£÷ﬁ|º]Ú+õ}€
∏Hq“1c¨∆Ω"ÿÿL_1æ?√¯Ò,⁄V[!ÂPr⁄.Ø¬]/´√4†”–=SÅ¥;ÓJrîÛC •∑d N∏PœH¯ÖæCØ4ÇÌát„…	Ë’c‰f«e5ùÙí¢D ~ï©Hjj_∞“»*¸}Ò±èmÒuä¡Â+è°rè√ÎåœW&¯/¿≥4æYÚåJu*Â√/$à·e‡≤…S:¨„dÇc7tƒ¶Ùøà¸)ò§ºR’≠∆î˝6œ¥HM%†…«z%˚’∆Âl˛‘Õ6 ]Ωpx§S1j}_ëÏc[ër§;|ˆ^Àœpf£«}Óï∏ ∫
ï∆›¡ÄU.…PF\èˇÓ>a¡Hk¨xnº3ß†õÇÆàå!ﬁ¸´êrƒÖÑˇòNëD<
æ‡{<√˜ÄdÇR\πXı’ËFöeÔíßäeÉu9Y¢›ò ƒD∑ˆã‘»?Œ∆onhZi3≈Í4äëü»™¬+ÑqtÒ;Ú{¨⁄√ÿú∞>¯7ø¬‡^o||÷˛Ì/ïÇ0Â™/tÍƒò_Àq”™ûNPÜÇsrp≈4a?Íq{FÀ„1v˛›`±√Ë\83NËy•T–î†mì™DWh8¡¿6√&ÙE£√R~C˝4 ö‡ÔvµÙó2'äqW¬6„wÇﬂØ®°Ùãü1¸j&ç#D„æø∫äzÓ∫Ú~ü‡ò3‡•€•∏‘ÿO“pÉõLíÓgÜŸ≥˜≠^€qKœoX89áèc}Y—∑(©<
.œEÏb(XU&’Ò†a.?^$\dìh,Ö:p}Áó¿beoxbÿÒ…Mà}¨Å/k¶*NÅòFµ∆ÈÜ	≥V´Â≥‘^Hµ'ª≥t˘âTå0”◊V÷¨Y“T¥ºV}íì}Sìµlﬂä?Tı3‘UÖ”S˙¨Í§ôÙbeŒtaû»D«zv·fJ<Ì∞˝©úXCøgá…ıÿõ)**á-™g±#&nıë—Ãs §úUÕ¥I∂+„ú⁄%Ö •)'ˇV1m]1yn'Í¥'\{§zX”é)¶ñ§7Ù_œñ?˝â¸¿ó\ã⁄›#WkÛ2NV›—˙Lµ˘LU¨V—}•È]âo≠ÍûE’¬e•™¬ì3ÙI[Eµ;;’^>œ7•èa≤∞é OPıc-˛;ÌIœ~–ˇL52ÂœÅs§O%H˙v¶ÑtBHêÍƒ◊êíAˇBï	L¥Ç‘)íÕ‚8∏úfJ%√˙¥æ9À}}kêÚtètè>úë≥Œ˘—È9{~—y˜B•ÃWÎ'eóõÉ§ïÚ6Z¨≈Éß‰õb÷lîúY- Öõ∑÷ÿVr¨G)’tYäÊÛ‚1πgWì$Xb^∆\ó€E1U
¡˝|qÄjô’eÒ/ +™Î·ùi>L“Ëè@æç=†%„ C"i äˆ õ2C*)˙√òÎ\Ç<@s „Ë‘Ä˛4…ËMúaüDóE¥XmÆÉøΩ4Ì˛ªÍ√◊ /«™~—˚ÿÙÓh|¡ûµ’Uø[`‰è“4I]è±hx¶dÏ≠j≤	®t&UoßÍØjúo¥ÃX0/´E˝F8˙Â‰u0äb†‰√@ZÌ∞©	F›ÀÇç¯¡¥ÓÍrB*…öËpı…àÂyb»6©†∏,Notéså^eG÷`èÈ—À≈Æ;rdCñ|`ÀzÆIF–ÃF;AG5OíæÎêø∞TÌK/Zéπ(ÇZ1Än¬
°≠é]i¸fŸ˝Ñˆ¯IB
ó iEå2ô√≥≤œóxß◊£oüìn4oèóPõ∂‰ÿæ\ d¡h˙=îéS)Îyx˙¯B”B]%PÏZ5ƒ©≤ê”˚ê∏kòåB∞‹◊…8°ﬂÄ!±∆À(FÉ´Rì˙–dÁÆOã1ò˛÷5µÁúãñı}≥f,2uÆ;ÖJßÿ*lıWæ¬‰R~È#ª„–‡ı+¢èOÎ∂Bï0£`Lí¿ÕôÍ_q≠÷¨Hyóo≥;å¬∏0©÷dPÑJ˚⁄ìﬂÂˇ˝è˚7ÎL˚–º∏ú’ç√6Ãì
úJ∆
ZêbÍ¢yHaÌÈEñß…x∞oÜÃ“7a^'≥dJ’©1Gl—˝∆’*ÑqÒZ–´ôÿ°})⁄≥\~tçíh
m>ûa ëÑå¸a
¯ö`⁄è@˛ÕÕcKvd{◊∫°ˆ-Dä*≈»qàÀU«™°ò¥l∂≥ú'Aﬂïï≥{tΩxåOÛ‚¥s∏ÁÊ®¸√R¡≥Í˝Y‘”“E˙∑ÓXtg%Å´ê6˚»+”ﬁ§ê“õ[l5·Ô^âP5
1Ù√ÛˆÜJÆ¯∏¬QŒDﬁ’á∏∏™'˜+C=õ˚=Uî£µ€çô76»˚Ñ≤z<»8∆ÒÙﬁÿ&îk ŸÇôJ àøx—Jd,∑ó¨›p∆Ü€G‰œˇ˙_πbª(ã÷'-Ôﬁ…
Á˙s}Vn-Oº«!m£Ê™’∆K+)€Ìäá-c]U11n—vè«WâõlKÒã{á(œ“p£'j©Ù©f1J»˝	`Al£qùéu Eª›6sõ1ﬁ3«P05K—÷≈gÍ˙®bYãº¶Á>Äƒ&P~öÖ{ˆÒΩLΩ¥2/^µÁjâˆï}∂Q∑˛~ê‰√`‘
˚SÆπYQs'H%¨Û^˙r;ÇÊU›§F	)3Z
`÷ΩôR-ç™`TëwƒÌ+’ƒ?ã´†A@Èó´S‰GùîîâÊ’ä:Úu"´nÂ)∫Z˚°¸∫<ò◊P˜*îû∂ ÑTîIéÈ÷äó.≈◊úÑääÖ°¬LWSc:JBQUé›VûºKÆ√ÙÄ.˛µG|4IRe§Wzi∑kºC≠8Ú!∂æ9ˇàü&öJ…&SQã¡ÌÈƒ^µ˘aib-®có`ëÅmJ˜rä5AN•l0
Ü≠QÎÙﬂÙÔ¯Ê‘ˆÚö [∆TÜÃ˘bû˙s≠ÍŒG˘„Ê/À–¬óIòõÄ€\ Î˘ºZ:cÛ\«°r"ù8¥zOü§—œe:z¯ó ‡·∑[5ˆçP  ˝≥#˜lú2Õ≥Ï[a!Å|¬ÿG;V˛¿sﬂoGz
›yÓ¢¬÷∂^|k÷ÈÎk©«[Ì*Ôx	o§ Èî‚F¬q.Kjªk”{?å1/\yØQiµH€;®[ÀËUgZÿCs∞Ñ`Y3ñK–ó~‹˙ËÖ•M3 Æ£â⁄®ñ+∑“0»»hÁ—(†áQ‹ßK—$π{±#ƒ…>Ÿj>	FóÙÏ™fÏk9—‹ıÒBÅc)ë‚{çàf÷ÉÁœﬁ˛â|1∞Ñj üË‹#£8¸S&Ô≈KMÇo@Ñ®äÁ:&¬}Ã0∏q±˘∏}0öAá"∂
~DÁÂ%u¢Fc{ƒ^jQ•='¨/d©(YoØ«‡≈Sj¿àhÅùΩ¥$‡Ÿ∫•JmÚ÷¡˜RÖÑ‘Õ6Ífuª{˘î¢√◊µRº»‚ÏN‹ªqœ*©ÅÁ!UM"Œ¢èµ»´ §äá‘UÔ˝©eÔÈåÙß·‹bÚÒs≥§¨Õ01¬A¬Ïh‡¿í–¨!™Î Ok‰B[,WˆÎ≥MœGlá˜"•›†\åº√mÔ≤ıŒHqm®ìÁ]ÓZ„¸ÏÂ/¿óˇÁˇ˛?ˇÔˇ˘œ‰˝49÷˙‡©◊ØC™=ü‘T8§„Å/w®é≈xõ#›æhB;ò™˙8¨ˇ„≠¿“G-áÍˆAéånéCÑå04‡$ò±àRÀπI‚q™W~	°√$Z∫7ZTIƒX0®Ã2èÚ)ßı°#&YVêè°7#)À3ÅõÆ(iÅµ0fÌ	zΩ0„§:\Ò‰6 ZËÀ)õz¡`¡Ô∫3›ÕtÆÀÛ\ûì‹ÉBÿ$JZ¨ó∫t¡h˘9"8ÊóbYV~ÍˆÒÛ
™PJû¢ŒÀs˝‘ÑsN’Õ¬Qx•ï¥K÷kÜg{Gﬂ"Ï˚•=:œ˘fÉ«ñ(◊·ø°·„=Óe,ﬁÏ+ç"‘†Œæ•·{]¶@à¡:é5’æ÷LìQ¬ ◊ﬂŒù~ÉØ:~,óﬂ⁄j˝^Ê .ö.["f©TÊrf]HÕ2fK1YUfQó›Ü:VW~»°aè?'p¬ÔôóW6^€◊O‹ÅÒu¨å∑TY£# B»ﬂ%≥-@ÉmÊ∫∆[Z{œ9‘\µ
tã`‘/,s·)f–Î4á≤ ™©0L¡úgŒ TF-º(EèÃ7™V¡÷Ó æpGûA YÜP8pÑê◊ë≥ t	.‡‡•›¿}¥U¥åMIn\D´@PjŸ?pŸû˚Y”´ØÌ≈0˛◊ˇEŒìddLËi·Sù+^{4N©~>B‘óŸÛ¶Ú¶ ‡ƒÿr(€9M ‡Ω⁄9<°íc˚…∆ì›ùÌU—ø˘ÄUWgâs€ö2gn¢ÿû5¡œgU§ñ¿kjññÇ>À\v+ë¬ó÷•VüG’sC ≥í¸G˜Tƒ}V∆8õ	ﬁÌ
$¶BòUzﬂ˛÷µÛöa}ﬁaNyƒ0 Àôå#rÈ7∆	†v|WòÒÙ@L
?ÔÃ∆¶ãËeëS“ù&¬≥†ä‡ +˙kBﬁ3⁄›g§ùÊv«Jsü˙Ë?∞%ΩÆÚwNN˜»yëOI-"xÚ4õ∑<µÜ;|ÿi`eS*øÖ ó∂ÌëGfÌ9Îª÷›åßfÿûñÀÁfr3?’rÍÿk`é ¿KU ÜPX|z’<CÆç©l∂¬h§ ij*\‘h§‡cπΩä∆È≤∑´#xç]√PJã)PÀ),£Ö%µ%÷‘ ˛≈—˘	Ÿ~ºC>úü|†;ÆÅêWDM∑0}|nÓ‚bÜc¡ÛT˝˙O¥öz~ıBÕO)ò◊‘‘Ö¥ŒM[§qH9ì4u¿í˘=¸»’¿˚∑Äﬂü∑‚W(»‰ƒß/í•cSq‰◊Ì˚T! 793]Ó|ÏéâÕdKÇè±+Ô>ÀI¶J¶‘™:ø«òwò{úﬁ	ˆ¶rFâ¬0$.sN®Mù¸Q&˙òw
#”" BP˝7òL‚(ÏÎ%ß	òÛ¥wäN"b~∏d
J∆ûqÉ4L”j÷¢Ü_S x∞ıa¸òo]Â€§‘¸<],Ng};ürRdèòRŸ[¥_”8œ:ìIJiNâTÉœ¨ã5ﬁ±Líë9Ñª∑*ï‰´|bÈ2qa¢»‡"DÈ9
ú~C;IËqë/E’ï&®» ØAΩ–•ÕëQ»d“&ˆ¥¬ﬁÕÀ¯BÿÆ,(	l‹R ô8˙p´§¸gÃjGì≥h[úîôÔ%r‚Æ‡xÇ™∑ 0˙ √Ûw',3!úâÈπE Â_„>&πí.&T±pñ%2ú≤¿ﬁaí:1rƒb∆òÒ˝ØzZ-K ˙+=O7†∆˛P–ú‰íb†K
f^ÍQÖ∆∞g¡÷õ˜X[µE_*x≠ô^y∞◊<”Éáö∆7∑$µˆë~øé!Ò_ú‹Ãïq@Dm@´ÜûiVy„ﬂî¶ıœ{äË†/-m›3n~µáITÀ†Q˘gy∂Oñóµ ·T¬%¥9Ò˚3y8»Ø∂‰W´ƒ®{¯!làdB•êxº<≈4∞FªÑxT¨‘†.Qÿ∑ÂhT@⁄∫–
åöÍßŸzhR…”´<®gÉæÂ|Î‚>*çÈ˛äÁx‘W<NmÙ8ÿ´K~√rCètL\∞∂û$≈êÈ≤
”ç
[8áVˆO¢1ÈÇV§Õ [[EG5sW/±UVß·< Jç≠6π‘Û‰k◊˘Œl«üzXz#°’èœ8`%j¥„ í”Ûf„O2Ò·§pÎÈtD^˙ﬂK¿3√7è–Ìì«>,ßyÒn∆r@_‚∂˘÷NjÌên~(Àw©ô^É≠¨Û´á„”å—8˛%üùîL+˚ÌÕ«Ùtj™¯=–‰.T ˝›àµrª¨.‹¸:bh-t√‚¡TªﬂHgÅè\ˆ˚/…ÛMoï≈†π4SY œ~&ûùáA,åøTüä_/¸»ßõ^*RES*íY™n≤ÚM";“__ÇOCù	>7’âdGI∫[iˆ«WÂ?>U˛xÄ/zF◊(9\ıW…‡”|O4^I Ò)∂Æ<j÷ÄﬁÀÅΩ`Äˆ’„LP˜¢alôT:íÌEãÑCπî›käF∑˝úTº√F°™‡c
†öõêkeˇ`äƒf‡>ys÷!™fÉpQÎo•$@/ãNé.˛⁄“ëPZ˝‹ÙÇ∏áål¥◊›ÂQ+¯<∏˝-YÛøÅïãª5ïÛ≠y˘ª2ç¨Ò\≠ÕøÚE°OtË!ä*ıc≤AGè|V0;©vÁZ¿¶%òÛ˜Ä†«√Øc∆r®ó›˛
g«á1å√~£Û√<*‚SÕ0)£\ÇqFFq√˜&‡≠Àhƒ-à˛ï⁄ä®ﬂ¨u…H=·RFˆ9œ'oó©´ç•È ˘æ˝øÚˆ/@[Ü`Œ{ÿ˛
Ïm…†xÚ]‚0]W—£}ø⁄eBqÁm>ºŸº°hX`JÓj_y_ÍÎt¥∞®àO}uò˙üÜ£ ˝ƒã∞Ú2Zùcè≤{5+àÖ÷í–ºR$åb•ËjŸ‘“ä÷1o√ép¡º‰Ûm,ÑÇ/g6BÂIÆ‚~n¬ÜÂ”ƒßƒÇ∏'íVé≤$•ãÁ›œ¨ˆàÚ´Ò]1l’†nî1Ì†6¨ÙjÎÃ]PºáÔÜrµ„àÑzdz8†íø…Ñ'Ó¶8 ¨U·∞ıØÉó¸äË∆êV˜~éı-µx#√4 hF99Aˆ…∆¯Èg¥#◊å Aú⁄¶ÌÔ%"&¨é\ÆnXÓÜúÃdÈ«
ö](n*vö‰g…˚Or?"Ù…?˚xA¸˛À{¿i„3 29[·^{«ıãÄ¬yìu%úU2b€ø¬’±ÙHˇ|πV∂Ê-FYj’®Z8hÈICáñ‰¬ËÉï∫¿∫‰€Sú˚®“NXiÖ⁄àÄíæΩÃXË¥aGõE/}ãﬂ©®ï¨™.T6dzO“À˜ÙΩ?·ﬂC{°òÁ¸öér‰”å.†&Bò3∏á‘œl∆ÀMØë§dj„/§†™A¥¡œÅ1åùXÆŸlΩ¯¬¯´∫ÀüFéÂÁˆí…ÏÌ5yI>∂Z-£cU=,?˛ÚËˇoÒî®ˇÖ>Ç=Î0”1ˇ≤6ƒ˙üÇ^	Ö∞w¿Ç}Ä`3{cÀè®VÔtÈ#m‚⁄¡BA˘ä≈¶Ÿû∂~oõu±YDàç◊t“Gæ:ﬁ%√¥’ˆƒ6ÏWAt√y»Çœ!oÅ±Ngs6 √–⁄äT¡ÃƒyF‰êø%r˛‡G€,>ŒÇÍ«hQ7™´óôêsÛñm´~ö∏ÆNËê#ÿ¿°„CV|öóv°êÊÉ≈]ƒuíÉ3È¯Õ€"ÒTîÔ:H∆˝i/g4fÙ˜ﬂΩ5‚	›I¢†Y≈LFJ•îylíòX‘AıQPvˆkS—…,8{Eä¢≠úΩ!i™6x≥£FÿÆ(Ñû¶yaç{“®k]UyM€˝ôÕvgyI,k—Ò<c¶Å¿å{Âˆ˘®ùÌÕ∂n[Ú≤ßΩ8ÄíõËU◊Å®f%s Ú)
+eÆ3w˙≥`¿‚u—ºìuNógÀ4«l—çj%°˝”0◊h„x>∂ªh˝√™ƒ,yØ≠˙pä¬ÖR…ùBtIπúêìQï'πBªœQ
ŒMN„Ù§◊I∑mç∆Üë‘[|v "Édô!›4ª∏k§cÊó9S„q*∫|Ωîvπº∫±; [‘9ß∂—Ì§ëf‘Í@Nq∑ª…◊j0‡‚°ø4˜–õ .’sé‚√Ã≤Så∆ñ\CE±o≥õ¬;úZâ˝¶MP‚’∏ã)+DÊ¢ÒwqÑX¢VˆqhË‘K#¨ŸÂÔX∞GmT7ÏôêÁ	‘0ˇ0•*p√¨6r»,‡◊PX≤§;{ÅQ7ÉN°Áo]ÉÈãÌÕØF≥Bù`R}.gAƒ≤k4ß…éÃ‘Û/Wa)ïG˘ZTw2≥ﬁ6ÅKNy—¥9≤3™2%WW≈È'áÛsü“vI√IæO6ÁÀ0.‘Ø⁄Çu‘ÀÂèm6Ü:∂˚]ñˇ-_Y—µ<∂UΩ¶–Dß"^µ¡ƒá’ÉÒ3ÂµRa¿P¿~&–cø™Á£:,DQüjÇqπ¸¶_«˙·U0çÛﬂ≥Rf¶’ÃÏ¿S^r¯xÖÚÔuÆË+ÊAg{dwkkã<£†Tìˇ”~Ò{’Eﬂ°Œ˜ÚfÎπü§’∆y{“Ü
à€ÙCûÔ<€˝¶◊—”¯=´ àÖ¡.˜Èc? ÇÀ8Ïøºô§	pwPÅÃ©ãˇ∂œDJ◊~êÕ∆=“ƒ¡ÂsÃ^ÀSØ*«ºïãh“	Zk]‡qZ"£ö≤ÔÔÿßO£7≠{_/]¸L]
2ˆ˛LË}{§–Ú<oºı©»«>ï†@ì¡0ºÔ◊¶hØQxELßˇ√©™0{d”˚~_U‘;P≤§…Ç#ñ=}ƒôÔ¶Êµµ∆ÓâÖ¨qmÖÀ|Ä?H~^ÓÎÎìå]G¡Ã≥X&û.FÍ:Äæ÷I{ss”≥Ò€u≤µÌyµW‡«U∆´˜ik·g%$4X†®æ Â∫*·qtHìg*(◊}˙¯(Eu«XäË7ÊÙ-@˛$*C–`‰Í˜˚iQ"Càh≤¯ËfbX`aÖ·˚ºçÆ>Õﬁ¡¯ÅVÖ±<•‹_&T3Æ‡9s#ñ ö≈ƒyÚöòﬁ|ô¸
ÀçÕÅ!+M¬viv7Yùß÷x™∆‘9ÿÒÒ„¸˘ﬂˇã0Öx¢3»⁄ô%”ær¯êπxHÉ~Ø®(
ÛhLÖÒ$ÏGâZ)sZ€_–™◊â}÷^2†µZªﬁfmT∂ûêWisA:}DÇœƒL9H¡XÁÁ;©	Gå˘Í™	??/'ﬁ‡¿nkˆ°ÖEJD≈@Ï á)mÚRÓêIíÂ>PÿEbbx¿>°?7F–õxSÉVQÀ7|≠=∏åÍ≥îwÖ˚bCıòAZ÷ï}á<¢Ú∑)”ëÓÂ
@µ.F1ƒ[∞#}™ºõ¯Éq_ª-«)„‡8R0/˚q¯;H÷Xék‹yÅ„∏{1ï4¢ñúz›“)›‡PbcL«dÅ‘çár“-;u+ F˘ÏR7NB®&C˛{VÃ	√¶,xÊYÛ÷∂ÍÚ÷,IkE!z˜ÿ˘ÀD% \	ˇ*…t^™ß∏DÉ3Î· çêmóO@DèÓ«‰0
sOòâ[T#¿‰iYR◊dèq∑ÇûıS+ê=ÇPÓ
”Ñ¸Ã7¨o8◊KT=¸	[ŸõÊ0
c:†Ÿ“¶ß»ûÙòíÎÄ	#Vr¶Ê ;uSrñF#,'IüLHíŸeÃéë˝Íô◊4]BóﬁP96¡˘yˇ„òúEáø]èF”qÙGF‰M∫”L∆“vEa@*Äé≤
Ö &ß@˛HO–∫∏⁄Áö°œøî=ƒ1ËKú©Ö(˚ﬂm≠}¥)%ﬁxqı¬ñ£x\2
p<c”™ŸÉ'Q¿a:ŸÄkÚéì…˚ÑÍÜtG”iø
˙!ï%ñ†.–m|„í6|jËE2ﬂ¨5§+öK≠H#ìÀJ≠gµ≤õ≠í[y∑⁄ÍYŸ† /Ü€%à
c≠â&ZŸ¢¨tÆ‚Ò+’GW¨y™¢nsD˚€•Lˇ∂óÏ:ÜΩOQ⁄+W†fzØ4Ì
Riõ∂Î⁄«›ŒIóºg®˚éXôy;Ω¨›p√Ì⁄â0îÇ“ñkÂ¯:Ü·Áiø'”8è6∫X{K@≈Eè»ánØKÆsT‹Ò∞¶z√ JGb™xù˛‘ˆ¯TkRZ•GΩì◊ï~∑S` d6Ê|’*Ωb≈Iø•óπt˚Hú\t¯b≠Áï‹C!ä&” S∏≠+‹-˚7åﬁ®XNÇÊà∞B£¿äMŒ¢Ià´ãn0Ö%≥≠÷Zi^?âàYœÈÊ!ÿ¶éæALÜQè’:ıïÅÉ“∑Ÿ⁄œ6—,/ÏÌ
7†∆‡∫ÀdüGô∑RØn~-ä„“≤≠LE·v˚Õç<öŒìò]≠¶º4l*xƒã"I˙Y∞]bñú|Üÿ¬l\Sã&§F7‡j–ÀHﬂdr´±îeM[.ëÍ]”˜ŸfM∂∑ña'ÛæãP+º∑ı©Ó@ŒdÄ37–Q¥i∏ë }π*9…»$ƒ(ËúGãΩÿûY“z¡Ÿ}‘ä⁄§∫c“mÁQëÑ‰‚¬fV~(Àªﬁ˜~eß„˜Õ 7Îˆ<õUêıñ
_=‡≠zD˘Ÿ™\ó‰≈2_'ÈË.ˆÈk™ª∞¢6o¶A⁄èh+Ï¡ﬂ»6•Vx?gkﬂ˜*ﬂ´;ÛÏ’œ”ºÿ≠¸˜á±_ö∫PŸéxòÁ+¯$Áﬂy~äªÿµíuÕ>,7ö‰·|jˇ˝oZac~ﬂ±|«ÓŒ≥ck-Œá±gﬂ^†∞)› ≥á∞SÑü„Lx8ÓDF'J'¶Ê1”∑yx¥œƒŸòÈ∏À∫◊Qé"(.Î¬·∆Õ°ÒiÒm?)HI@ÄÅ]∑9n>÷‡m!˜43XËI\Ü1˝£∞LR*„«aº∫Nßﬁû™Ø1≥Ö˛%¢˜ÓëYòfÎQ±"U± ‚Æí€:PπÏê–Û´Ω·ö◊´
X—!°ú	ﬂôÏ`_!§YÍì®©Î”#M•1t+ç∆Ωh—Cjª]*éÇ¢£Ï†`_ìRﬂ¯IÔŸªBvWª&˜+éxû$ ê)õÄÇ≤sX4ª‘)-	’åÊ`y9ÍìNXFƒ1˝,RÚvD[w÷rÁ!tûCfC¢4¢Â ¬º£•k‚	\;ΩØÀ©”Â˝«˝µ’U«}¿ò%°ôƒnÚ¨«è	{§1_—ÕCÆ¢4w≥jzë ƒ1¡õ>/◊Ï√¶ì∂AEùL√q4Ó˚|ÆT xyˆîGu»˛Ïf"ª%!8}´√©Ós˜òÚ7g™Ó€º…ÀµgØOÛ·K´&—ÜgmÂmŒÙ‘h◊~-<I—8>Ö$‡•~lãjô≈c∆êJ≤arùV±ö`USVÅVΩ‹∂~uvÀél´ù`)*ŒÓ¡∞…ÏjzVÉY=÷/mqÖ«Í∂¸’öK£öhSlÅ6∫√
v)±?-·¬€ Q2f™œóÚiEΩ™ãúWfØ(…;E0¥ñM
CÖÓ]p*:#K*©™ä"i´vEÌü⁄øZ„£ﬁ,∞.∞«yº™ì*‚¨ø¡£w⁄U†–¨i…îå‰*á6QÌ X∏ëŸIx÷éûƒ√;⁄é≥OÆßöMgÆΩe∑gT ¢ß@¬ı/°≤Ö∂–aKzlf·∏÷h˚r£d≤YKˆ’ãQÇYb¥∑µçÈ¶‚ó77$°´/ g{dsù–ˇByã@·VÌ∆-º—z[¯% õ?Lwïòò«îÕƒ b/)Ãv1T€‰ó3ôœs,WÌŸ ï⁄É• ˚vŸqîmkì{ˆ~Öiö§^Ωµ˛‘≤~€Z§¿ß3Áëâ¥¨¢Õ-Í…%y≈ûmz“ù6îi“]˘5.‰KŸ¿r†ºyŒ∫≥[HVÈËñ0î=˙‰xZ]vWô-∆Ò _¶K»Xµè√+{ˆåÉÛ∆q"{/$ÄN˝~ÚÄpW¶oØzœ˚jq˚|Gé∆»L…™∂CFå^#ÚfJM=H¶<8ßw€ ≠	,ıπ2£ªÀ OÕ3◊x¸FtTÇÅ’û∑vÿ°Ö∏›
æÙ"%ØÇÍ7êo√≤Ë˝ÙÛrv^EY∫…íÜ=Å	®Ô§uZˇ©gÂÄÁŸ5™èÌ√|MçnU—ÑjÙ¨Œ¡≈ÒÔè»Ôèè~&ùÛC¯œ˚›£wûÓ◊
Æ)(∏¶≠mÙª>Ò»æ3´j¬3,É·:fÄ?ıì⁄ƒ©rgiﬂdk⁄µ/qÒÎ3“ﬂÖúº’d™'µ˚≥Œ=iG\Y9^‡ $cÊ&yy3∆˝&\ÄÏ¥¸Kø|ØZ‹Ô‰Ú7µñì“è9Xf~¥Á…G˙Y<ÕL'&dàâå)ÔÉ>¥—cr§ÒåSg9…a>)ìPmêü
J∂‘1≥6¢?Ü,Aò⁄tD)q±!$¸GŒ√åLÜ≥ìw˙Io X˜z†o!zˆ*…á°Ã∫ß˜Ç&ÃøL¿9AeëÎÄsfD6+úºmÜ◊µ)cπT;óö‰5ãUMcT”kCi+˚9–⁄ã«ÿº≥(⁄úû∆&4ni¯áiîzp‡f¨utµ@ºà˘"ù7—Ÿ~Ëâä#˚úµ∞v≈H≠ÄüÈjù@{{$lQÒ?Û>¯°‹œ–HË^CåF»îÜQ‹w¡B<o`M‘¥KÕy÷÷È›ËñÈM≥= ©”¨¸R∞È∏∫Îr2yd€ÿw€JnZÖE6”Ú∑”aÙ9¬$Äw‡˜‹N`Ë¢èÿy]e˘£ﬂ›ìƒNﬂ~¸aÃkNüB^ñ7Eêë’1’I√t∂J˛DV',ΩŒBzc~Û„èbèÈáüﬂ∞∫≈Ïâ†b»'PËw[d≠33≤≥±˚¨yï|6Ωä5±ÉV˚yk”≥µRáü∑N0¶±Wt÷ì<n~⁄´∆"`9‹T/‰†Ê+nÖOƒ ˛)˚ÅCé_<fóÕ—"ü¥"1t·Â≤√2
Ï«∆≠æxÃ6„ù§~~]ÈtÅ˚°
æG=U¸5YSŸï^t+ﬁ‚≠"‡X—ÎNˇCûo·yNy¯‹◊.ı≠%T⁄`H≥t &-∑7va^BÂ€&[≠ÚMØÏkø.÷6oiw£´ø6ûô˘:´\9UæØÚá∂ ˘—æ≤œXh…±6∂Ec€KhlG4∂≥Ñ∆vEcªKh¨-kﬂ›n˙æ_Ê~y.Ê˛˘“÷¶‹}õÀhÆÿÃÀÿÕ[r;o5⁄œ˙8<ó@⁄’ÃEµ˚Õπ®Ñy ”ßæMOUìö
˛B´hu	^´ì¥Eìì4k…¡~Hn´˚˜I}Õe/ó˚—(à|]Iç÷{ﬂıÇ«ﬁ/≈c≥KXÚ¨µø@s≠^2˙⁄ÎΩ»*˙æÚ…Ÿ0EIo\œÿßÂØglv	Î˘«Ìù]≤ˆlsÛØq≥!Î‹l¯ñª˘æ¬+˜zØp-Ñ´”i++æä.ï2uªk(s »°u¿œH@™1‰xÑñ	·ÓB‰]zÖ`yßæÎ∑U=ø“˛cx˝en=÷be◊Ad„Õ)2Œª´~õ∞…ûQ‡ìµõ¶éÃµO<VN…X:•7∏û¢Zêµ7ßúl•∂Œª+˚Á”ÒøDc“Fó	Y;Ôz∑Êgw›ÅΩ§Á<PcI2¬Yàπ·:m´”]-÷Wì<œ”ià’≤∏∑7+;∆¨(‡*WÖ«÷1G
d¿uÀ9$JRYü*ÑΩ<ûxôî¡1Óâ˛F/M¶ﬂb5¯ENÍ%S’Ùmh¨$ò{ˆÊOÙe¡±†ü\Õí≤ÂXSÆ¬Ÿ^ òjë!∆…µMçTÀ¶¬6Ou >-ø¸	rˆÎÃm%î Oça≠r§¸h…;ˆŒ∫V qñM√*È ÈáéQwW°q!:∞¨6≈√@ù…>66¢yÄlåµøªs$õG}dî_◊i0A	„*bl£´î◊‹=>TûŸÌB»ÒÃ|ëÑëuü»7GbÁ°‰«5Ü«©Ã]ó3ùap¸ZûHYK∑Ó($C˙síŒ÷9ˇL@Á2∆(	ôÉp‹õâ∫óÓ¢>ut˝Û◊‹Ö≤!ÙhklEïhëX©NÆ'°Òf’¥–˘t[S~©Æ—65"√÷†E:ggP	|„…ñO•R˝D≥[ãm]Ò-*îÍÍ/Nw±"®uÛƒcSú⁄ZÇì‰ªÂ2ËémLø˙ˇ8çzüxˆ>H£∑a<A*me  ’5ñ@√ÊUç⁄¿* » +”ZPFñhç‹t@Ûâò aqYˇU+üóyb‹«O-√9„˛ç„h „ãÂráé}&ã>LzÖoÅö¬T˜¢¬<ÜrUT–G)ÈQµHjœK®oV#•ëB¶’.TèXh]Qºπw&ÔöøÕ´˛r~Ë‘vÚ˚ÖüÒÀÌ[=≥iÄ˘ÊWÃ·/$f©0¢Êúö?K_}Õ ;‚:‡Ô©ìåïX∆ô’!X∆*â˝Oãƒ~i˚à”√ñîØü%=ø¯¯EíŸ¢akrπ
3¡«ø®¶€ù¥å∏±G˛fUæ+Mé´jÈ8ô≤Ê/ßâ‡ﬁ®Âß…Hô*ØPuïÄAèÜøXyÃˇxKËÖ¡%’]ΩktjmC”»‹E“«_‹éπ‰äºä“|Ëèv˜SæÖ‡áµ·#ˆπ^ÕyÙıìÀπ∞ÒXY¥RÚ”6Á≈=ƒ∏äSÎ˝&ÅŒoBpKﬁ]˙Ö≤∆¯®•/3÷¨)4:ÊΩ.∏;I'8	‚pe˛ª ﬁˇu8¬fÿø_‚ˇ`è~„<Ã"Höå†Ä]øüÜYˆ’„Î f
XóÊÛÉ‘Ó%ﬁÍ¢Îg"3ı-xÂ¯ ÆìnÚ)°fﬁYö|é∆=ôª§ì@sÜË«¡◊˜u4S¢væ9X¢®0(Î@>§çƒÎ æ-yGïõ_¬÷:Ö5ú§}¬z!OßyˆËØaC=¨≈}0Lì1ùÑ¢pÂ\›EÁÓfyÌ/a}w≤|8
 síPCñ6Kœç0ÔµæØÌ˚^€¶˙£wÉ\RñlQat…kµhxæEz?6Bc(—˚Wˆﬂì≥úóüC≤ˆaLˇI≥ ûù‘°Mvdìs7Ûä6ÛjÒfﬁo¿ûÜÉ`°f:–ùNÛ˛|5¥’_Å Y~éíi&Î@Ê9òÓ˝át^NxYó,ÄÙ∆ópR¢ﬁ«M*YÜÖ˝0˚~Zﬁ˜˙ÓNí4œxUç£/–ƒ4M£ﬁ4RV'ÃÚ•F¢SK^Ë≤›e≠Ò◊Ií_qºN√À «±i¿tNjYûL≥®˜◊∞‚ÁƒÏ
,ï∑díXπºR¬»uû|≥¯Œ¢“6Gzråß®zÌö;◊Ü}EgŸﬁg¯F¢’e˘¶ûZ’ó9`ûo/XÄÔ@œEÅûZ≠⁄≥(û#SX.È~Ë˘Â∞µ|é˙SfÎÅœNV∂‡ãª(ÌÉuëú Û†Bµ¬viÿ£À!#°,4DFaNè]@|“u=gè`ÙeÅˇ:EÒå`#kÄ%À¢K(õî=bQ˙‘   é$ã…“„ex—9¯é]:ZÙ˘ˆ≤—¢õwÅU≤„T)ÛÙCåæΩ∏–®≠Ëº»Q>æï9Vä¢> Ï(ÔÕr¡£¿ÈåC†‰qS¬è&¸èx—~B'
Vc:7„o-j^Pﬂ!£ÛCFÁ/„• KºÇtå<⁄¿‹å¬0WôÅ-ô†Ê4Ç:æaÊQ‡ã}æ#]ø#]Km˝%"]UHk≤äº iÖ\ØÉ0\!ìh¢]ùARZã@—xZÛ@I^S
=“ìbí&#∫_ÌG√í—∞~∆.!&ùÏnk›Ωàm7√≠è–f˜ìµåOït¯‰˘Î™˘gy∂Kº±^£C~jø$TüñOf÷ˇ€Zπ_û≠˜ÜIéπ°˜FËÙ∞tX^ï_‰mŒn2æ«ˇ  ˇˇÏ}ÎíIvﬁ´‰ ∆l¥∑Åæs9ΩdS ‰¥¶oj4g<^M,´ÅÍF-∂
vo/#éê~ÿ+≠gweÖ‰UPª^…≤Ù«∂#‰?ÕºÄÊ|Œ…Ã ¨{fMrÜ¨ò‡4Ä™¨¨¨ÃìÁÚùÔ‰ﬂ©+,H∏WÏ÷•À˛°§ÊètÇêåèÊÖËó®Zõÿ„ü˝å’Cù4ﬂwÏãÊ‘?_∏A,?ú…F_Áâ∫‚a¸íÂrÒ¢DΩ≈áMw¯√°€è∆z˘√/`K*≠q+è˚F∞«˘ï_ˆ#V5M.⁄î‚k†ÍQä´%≈äÄSê=‹eh3π.ÍôñÏÚN©"o,R8˙Q?Õv«r¸/wK+ÉË#ê(ñ∞S†ı'Y;voíã˛!ﬂ{Ö˛o¸¯‘è®†˙º]‡<ö’˙@´lUr5Õ€çoéÓ0A£d‹ùi"∑W‘(Æ¸•£’÷íuˇåÏ2ÌDÉ3—+ DªÛ˝øÓ
gy	t◊b±ü ÍKZ‰‡dÒ`8Sø∞–<Á√
°’ÔÉÏ+ü
~éÀ%:1AÇÎRä•ÚƒóÏnï;	"'{¢'´w◊–Ô^Óâ‘omz.:“∑å&ŒC-“VÒØkΩ¿¢C•|
4$w©êÆpïöx÷’°œøU°“™âXóµE~k[&VÜxÄ’¡ñ≈†g˘‹3¢⁄ëœ›‚!yÔ°
Û\ÀÚÂ˛w7Óï«=qîπ¶ ÍIT£ŒÊ9¬=ΩmX∆Á†Û√_≈ômÒ¡1óê¶2àNNHœõgZµﬁXÑí,Û5°î´>g6[ÿ·åÑ÷zà”º¢‡í¢•ÒÉÏ4≈◊•πNüÓEÊ8ˇºYZ5~p+?
1g[˙J!3≥…∆7üñ7EÉO˛Õ´_ˇU¥Q¿º’"øyı’ÔŸë˚BŒ“ßcoZX(R?Ãb&Ú\”-M‘¯õ¡>“wß<N#{~ËL{É‚z Õi÷XÍSJ©◊]€pfzL«Óãíàq‚©-ô∏æÆG˙áóÊ˛ÔÌÅÖT[d¿.÷n69°Vñ˜vé=Áæ˘Tóêßs7>´ˆƒdCO<ˇùÀoÅE'itÈM˘,z)E{=\VM÷ØDO∏0ë—(Xn˛ÿ˜∆ı•∂¥¸rô…”≈N#|BY]‚ˆ5n9RëÊÁòo)v´õüoßY8Ò˘aÔ ÁGE˜<?º› vŸ≤ëòØ_9a“€¯˝˘ÒíπCÿ]›LN¨Æ}Ò0r∫‹BÔ3Óßng˘@VgSCIÈ∫⁄ı¨nké‡Gñ<è!∫¯WπÄ.]’ÉÿRu ÆD‡ÇZ·RxÏ‘g4il‹oI*;{·¡V»«÷BòÜ‰˘∆B£ÿ7≠‘h«ÊS÷7W™ ‘7p∏nn;&Aπ7œ¥ΩñäÍÅ¨mœıÑƒtHDπ£N[k”|jÎ 3UTArÉˇO~π∫±&!âW°Õç¥ZÍ)˜f¥ÍËî[QÆçi*‰¡w*Ùí¯6’òfù˛~lÆ¶ ∏nˇAë)`#Ê4ÃêÑÂâ⁄ä“ST	éª¥"§rÓòèÇÖÊò\Ï(M-=^Ü<¬frÖœ¡‘gÈ!»ÚòXXÛ9Ω(ˆu(_ºá$˛ùÅ=,Mã.*÷8å¬ï§á◊!©rÄ`¨oVﬁô:mñ•h!æ£ô«∑^å‚ªùGÇ⁄©›)yã∑∑T¶≥˜•◊£øk‚ΩÚñ±ÊMã;¬EÑ˛∂≈˚cÇÑpyŒÌ2‹h0J√¶ê¯‹.C®OQÏm˘uzãñçUˇÃ≠52Ó∞(ÄO˘öÆå›àE.÷9|ÇQ‰ãE;ÏZq`F≠<ô…‰¶Êñµ≤∏î¬ªkøX"íÓË˘V”Ftÿ¢≤§<8{%7Ì<Eê{M[#Óıc	yqHΩZDzû$¯˙|‚‹Œ)ë xØÌ6¨=}òeô3ß—∞´)èõ¢
Ω≤ï˝Æ¡¡4ï	&
>ÿ˚-–F…C-Åü˘Õ_ ï >⁄ç!?ËZ˛`G`äoháCiÒMá}˝'ø¶SæÙéÙ}w#ß˙N¸Ãﬂ9ál¿‰µRﬂƒ»TöBåŸ∫=≠ñæyiRuÖ˘6än•bQ…çrèó0ﬁ0©ô¥µŸ+©ÁÈöDõ‹]À1•z3M)ÓÉmF¶›6Kw,.—£}dÅZSá&+a	È¿…áÈ5âKßPQ¥}.À®í∏™(	0/·Ø¬–‘X—†D0Cê˚%*ãZÂ8◊ÇV£x´Øa‘m%]c◊‰8ô¶V¢ñûÆuÇ	∆Gfw∆~¡^¬Œb™éõ8⁄&.Ûôì÷Èu©®¸òíñ&k^wioÙŒM¨2:Lê¥há¥≠˚Q4“®Å,dP™$Ω·xûåÃ+_ÀØòWi\¯Ê’Wˇ¿Ë)xŒKél˘(Àƒ¢$Ø”≈1ÀàØ‰ÕQmâ+÷È
ˇ…∂ZŸr51)ﬁUÂkM+‹«ÔVaÕógÍdﬁ $ìﬂì»◊ë§úó‰L‰S¶cTµŒﬂ§√ı~∂ø˜Ç¯°eJïÔ(œswFlÍÉÕ6p;/âxxªA∂`Àåªc´]X{˜KΩ~%™ˆÀÂzYÏµ›ì¿«)@,s¬ÄTd›û∏='ËsZàR∏ Qcu[s·Á$A√Y˜ÊÄHœéVŸÿh”›ˇMC¢Ô∑áﬁ‰‹á∑ŸFgø)Ô»våöŸ§2Z,f¯gkwqáã∏"ÏÁ)K∂s‰≥‹p‚èCË=ˇåâ¿‹≥‹Û/«úëQœÜ6‡æSÑö◊ª=g∫Ù:L¢e#)i*í˚uåT …·†!l°À©ï`4ª⁄«ß÷z∫∑∆;gß˚ÌÆ¡sQè©„•ñXR‘∫`Y¥]Dîu2D7ºÁ∂?l–+π∑l‰HÈæ˝ùûh¢qOYÍÜöo%Ãé°ú0á#[Øå4“<ˇEû≈	eÔ¿∑˜adÆò\Dí/–‹5E”_z˚g„ﬁtÍ€ÙZ02ùÓƒãö©”'©]buë„§1∫L¡‰ƒ:órBêjœÚí≠≤ı5ª«∞ã©Ÿ◊eh}|iy„µuãÛù+8ﬂ" £p‘Gœ∏Ö|G≠π:‹ taNF_,4ÛtËÃÃâ”X 0ì©*U$^¸“ÅuÂ†ôhZÆá∆!q£Âœó≈Ω$9YïÂÏ˚A•Uª€Íª?AÖ§⁄’ù´û;·‰n∑∂⁄lC“b{ÿxø=Ãª= {ﬂ¯“π§úg–§˚Ó’∑skPOÒ~g09b;É6xÿTkoÀæ∞˝ﬁ0àÿ +zÈﬁÒ‚úﬁæ ı`´Xïé}∑ø?læﬂ™Ô]™`Ì»/q*›ﬂ∂B‡CNcæó˜€Ñ…!±[ô#8◊^—ÕjÚ˝Üq˚∆Åˇ¢ö¨WØ™™Ú%¢ÂNu˚€ƒ÷˚m¢˙6ï9â»-WŸ—l‰¬]ÆømÖ#&⁄Èﬁo&áÿ$“£7◊—J6˜~s∏˝Õ·‘EÑ≤≠´GÈåŒ∏Ômë'ﬁ≈ÙˆwáÖùh∫€‡NÉ¬XFÃe!Ü(Yﬂ'CÁKÃıûkü≠˘#>[,A(v.≈4n≈(ˆ—v,ß> ﬂº’B7»éxÎªNå€Ñ™*…»¸®œêë	Ãåª¬óØ:`•∞îs˙√¬õ¸IS˚.S¯ˇã∆∆¨X¯Gm˜4à>-yJO§%€√k®œ◊¯Ÿáﬁ{”kX?µ]ÛIS z2›ÖE	ã•fµÕWET·nÃ©p˜LîMFoﬂ4ÿü˘§»+èœÈb!+zX-R,väØ)+ú√æ«íÆ(¯*”ÏÄÔ”;çsRˆïó˝Å∆~BºñÕ8vïmY(ÊÛ(ó‡ˇ◊gí—u\YôsM0 ‘xæoº;,¸m±›lsÉ=dµo^˝¸˚&Ö¶>>ˆ¶5∂c&ˇo£g[ºg_˝9;u{˛hDEﬂhó÷Ôbóæ˛õø˚◊˘Ö*cu|q·∆]´}˝∑?g`Öy†ﬁ\≥ÓÏÚ“a«≠-[fR)¡òö‹
∂à2Ëâ}#µ∑nË;õ	~k·1e…%ÖyÍ®:FT≠¿8©Ô>∂”1x˚∆5u"c`†WP0ô`Y&@ºCÖÃæX5ùœ‹N«ÿ‹M†≤.Y¯‹√0{¶6DÏ÷è˘bâih¨ï®ä:ñpêÎ(pGN<l6
N√H˙/¬7õ&ù_Pı¡,‡ˆ∂Y
¢™ÂS˛l•&M•**64∂Û˜§Îº\µ•˘©ÙΩﬁ‘"„÷&”6ZsÍé∆ÖV2ùj%±ÊòÉ¸&◊ÜˆˆmŒﬂx!ÉÓ™ÜÒÑX}ˇﬂ’>ﬂlƒ≤nó–ò∏Ö∂õ£“Ø∂ˆàâúoÚs›‰‘˝1Â‚Cølö3œç4Uﬁ≤u∫œã˙àiØ∂Î]éùÈÕ.ÛıjÓ…≥©fáá≈Óõ⁄›˛#C¥W—å≠TÀ¨èÌ¿ë÷_úŸ„ﬂZRæî"	sIﬂMzh‡À[∞Z\zB—ﬂŸzø€s’˚Ωù*ø≠Ÿt‡ﬁO]]OÁ0‹«ºn®^6¥‰›øU5{¢œï
˛ nM&º∆˜π0™RÒ∑;‹°YﬁçãQπaü®bL§VTÕˆ¶ˆæ?⁄—‘9µı9ç$„`Gy=ˆÿuYk8Ùym≠R…wU£ﬁs∂Ö0^´√ãhUxER9Òºƒº0hZ<Zƒ-ÀˇÆ`‚‚ò9rÖJnU˙óÛΩ:|HPit]Qa¯,¸ÿæØ	¸Œ÷ñí'*
,ø¯∂UéÑ ‚k|∆§≤=wM`5ﬁâó,xK™ÀÓ,∂,Õ‹á+^«_⁄ß^Ëd◊å<òé∫‰›oÏ€[8>üﬁóû≥$∞úD¢$∞–\˚Mˆô;Ï˘#öEDÎÀ#8◊Bó¯@´‘«7óT~IkÒ·ç√µ$∑/æz˘Œ’¸’Ù“˜Eé˜E©Ëo/‚$z·x¥	À¿ö»´…zø Wä>Qp„œlì¸}_Â7~|'´¸Ç˝µ?æy”h©∂Òù<Êﬂf5Z“™y%⁄9bZ?ΩÇ;,ö‰¨;!·Yı∫ìUK›ﬁ^MI;/åv'À"∫¬ÂU1#_s—ù·˛◊º…t˛∫∫Ÿ∫&”ÖÔ)úÛö-∑ÜlcC'y± Åä0%RÎ•hÛÙË"±qi±7^·ÆJÌ‚ÕÇ⁄≈1Íh`øM≠„hLﬂ\ôcí|Ïå‹o∞“Ò#⁄MÊÌÄ-\•ÆjsœÓ’ïBVÅ:ló÷ôﬂwÆ+WCÆ¥^&ú-=ñ<ë;Î5.´{63øúñ“K,DsÔΩˇf,ómgwö#Êy@ˇ¢„|~∫*<b~g2Y˝¸:[ƒjA€eCTüU±⁄Ù;–`·∫Ç.§"÷‚ä\7c‡°^8m∏t˘Yå~-Ûπ9LÃ4{‚Vñq0E¨t_z!¬7jS5˝`QîA5<GaÉ‘"›2]§,µ∆∞ë€b?¨∫†˝‘ç>’ﬂè‚÷=Âıö¨ }g|ﬂlôr/Æ(⁄'ÿ„Ê/&é
%~∆úhN}XyÙ±ê=µ∂ªaŒoØòHŒ˚Ã©8Qy¨2Ö~Ã5†•5’v5@ı\Ø(ﬂØôFo+óãÍ›z#
Œ˛vºê4Ãªı>‚©o˙ùr.ºk/&‚Õx≥Ô$7Ω˘ˆÍR›
¡±°”Lîe‡µwÔ§ÏC¡<ã*xKeßZVÓ•2ÕR/5nbâHµ"À˜pœx&œœa,:~œä√ÿÙÊÊ8≠’ß!2¶f¿ûthÆ«JÜõmÒÖRÊ<ﬁeÎLyƒß891≈ÏVUæxU·È|®≤y4C∂‰Ë¸b÷dUu ÇkUyn^qÂ~8|x‚‰≈Äf<=^w$úgtÌ.˚ô,UíÌ◊QÑ«z¡ÑX”≤¸HºZâDDEKÊm?Q∑ƒæ6¡[!Ó”>Òõgπ|“Äî·ıŒµÚ,*ŒÍCÏÖ≤rûeïvñàdG≤]~±´uËì}ΩŸ‰ﬁ!>kÕK4¥yÎV5goä∆F·Ÿ◊ø˘GUê ‚∑˙á⁄µM	ßL’%_òúL.ﬂuzÚÒÜK/óü·ﬂº˙≥ø‘´ÜF¢çá)®ûfJ9Ä—≤‚ z}.Wm~çŒ#∏R°⁄Pïi.d-Q ª%q2O©ò»·‘íÜ“ƒähÑOìˇØ°Tyı‡V[SlyM[Ñı-˘åóòb€ /∆©˝ÏCìv_ f∞4ìj»·≈D≠&#»ã;K&ñâqm+Ìi–j∞“mÎBŸ≤ÿ«¬Éõñ¡Áƒ#•¢rµ(zåº"QQ˘ÒıdµÒ’ıÌÑ±ùòõ^%·%∞_ˆÖˆÃ	À®§|Ö∫SÖ—~(ÜXUUò™Be!Bö[rK5ÂSª9ôﬁ¬fµr\-ZÎˆY≠Ü`ïBU∆ÜAÖÁß®vπ=†äç)ıø^XtÃ∆{H˚ôf¡Ûï,§F≥´äE˜Â¥_ Ø M} πåCO	lb0L¯„û3<öçŒ›@EØ´’N„˝™TÎÌµÕfÎKlòÍ¨∑+ˇñGcπöªk$@0zÄ/Ü∞“ÏzL∂öë§Ë¡àÂ$X¶B~
um
^aÆ»™o≤É˙?{Êq3@îüf∞3_BTÅÓ‹e“SÇ÷lKﬁ!`∑3lﬁ“õ2‘Ú-…Í]¢≠(ç#Ä0KoÀKçº±»„c|xdë‚ ~Pµùa :ßVπ([ˆùÌ›öZgVøˇv¯5€Å€˜¶mƒ‰97ı™oÅwSÛåXÓRYsVeñ≤˙øwü:„òq{Å?È˚/∆ÏT$¸ŸÏ‹ˆqÍ/®íìì?.fçÇLtdf-®‰◊¨/÷,Íê◊JJ.ÖÃÌœ¯¿8X^îÃF»¡Ï-ÛÚsŒh2≤€\ÍΩ=éƒ¨ê_¿âÁ'0ïË ^"ˆ¨ÌFûå3x]8s„ø8èÚp3ŸÁYo_ˇá∏@yKÅN√>ÏNë™n•≈º%\ﬂè◊yN¢°*Ÿ∑	Ω‹Ü≤;ç]!b∞i” OAˇ\a^ˇjŸŒc†ºpm¶´†å®<•Q&DEWÌbÈŸV%~&Ûª4("ÿxÛËyÓª≠ú{…˚„“†.8#‘#”´¬zq[)évöc•)ûªáëHãÂ,P8·[ògò_ˇÊO•-ø´î ©û˙aÿQ&¸S‘ﬁ{ò$äVB≠uq·]©¿~◊uÜµ^ò⁄L∆Åa•Ôı\n(ƒ˜ﬂs0t0ã-ÅtÅΩ˜¬∫¥•N†sÚgA)”Å?õ≤◊W8HâO˝q≥B–aa'ù6YËJîùäöiq‰ùm≤ÖÛçùJ<+¬	v≤ ˆ@o%7ﬁÌPy
ÜãûûŒ\ïü3û=/?g€É’?ÇeÑ kD£;·÷¯¨7•ı∏ó|t\`ì¿EY˙~0
9Cßã©ã!¨WXß‹g [†îE¢Œç7M‘πfF‘©l®©]⁄˜€ÂÏ|”ÎÏdp¢¿ñîtÍ*„—|Åìq Z…§˛ä+¨ïhß "{<úÙäb5¡†ÿıfp˘º5⁄˘‚ò-$#Ä’oÃxË≤fº—G™—G¨ﬁB*é1Øq	Áiæ≠öo≥˙©\Øûp kìåõß˝'îoÒ1®æA»É\#ÊmZêÉf∏Kí°ùø´ãRÑ·Bö¢ﬁÔk"◊3'⁄
@ÀrÉr-#)v[ÃäQÌPEËoÿWä¢°x^Lá6gÛâ•jõêùg%ØD	∞Iæûës’x±÷È5òå§˚øÂjf£ÜWß91
w¸˜§◊kÖ]∫cx>Ãó:6√ SÄi6Œ	°iŸD‹∂B:∏Ü3Ò£P‰ã}[Âtl∑Lm©≥†D·¸O÷\‰ñºYa∂c'È/ÏnŸŒ∞∑$)†ÿ√¯6\Úﬁ«e—ÍVî`No»MÇ>z¯'Ãu,%Â¬R%ÎÏjò(ﬁmÕ	g»ﬁ¥|≈Xn%oÁñÍ◊∂/sKä]ˇ="∂ÃÒì÷vg√©◊ —¨Ùd_˚›KºÏI˙A¡vÊÜ‹\@€Ñàœ+dºŒ‘ù4ŒØ¯ˇ
ñ~±‘œevIIOAô´F«»‚Î<g¨ﬁ€6ÙŒBiñ¥∂ªﬁdßëÈµÁÜœKf˛ÊíÙ´JÑ…/t˙Ö$÷πˆ+Í4†	Hr~bÆ¿Ä…“D$UßÁ˜%·cî…ö∑ÓçÅN‰Ú˜µ—òI÷öLÜûàñ=Ÿ¯z^\{‡C_ò£≈1Ü%Ó˜∞>œù†…810ÎÏıÏòô‰Ç)?@V5ßﬂƒgÚ¨aT⁄üÖQù¯∆Gø[¯ÓºcΩÄ”f3N/PèJƒ,øû◊å$0AüáCxãnÔ˘ﬁ-_¨B∏Xc<l* kx]È#='áøBp /êèµﬁ°w´È{µ›≠&K∏
èA…ÍïÂ®/ËÕrÖé≥a¬˚Ä◊KU0SñqË
oìLà—J$oõCÿ„z‹”à…2%‹õ€oE‘k’ﬂm¡è˘[z˛/ÑùiüÌ⁄a'˚'ùÉ˝£;Ì<ŸÔûù~Œ>;>˝§{“jwr4¿‹™¡& *}Jç+£é37AãLŒ§yZlKñ©é&$Ë*?2DbG¯rÈ¶œ†Â<JÙòÚ∏]ú9¿y€Ê8	≈}á$aΩÁnP0CãhÕ3ñi‹ª∂Ω∂≠+µÜ∆ˆ),ÿ∆‘É≠ˆ\Á\Iê¶oì  ò’ Ø˚≥°(hCã4";{Tå∫√ë _ oÛ›í”µuK ìú\ü>hƒΩL™û/«fo+jfl\cÛ»},ªÓÒ'«g«lØu÷z‘ÍvÑƒX§ÑJCTKı™Å>ï‹¬„jÀ_»0]ÜnÜªòÜnË^D’@@òùIËñöïÿË Ùì¬µ:rh	çóe‰ÒRﬂ	üVÎ¡–)]K∞Î†€Q◊ñ€>Zß”Aïvec{‡˚Uõ9@Cá≠2‰¨™‹ó'3–"<h<u∞YïvbDÌª'ﬁÑì=	¸KT—ëQuZπãíê—†	¯=(RJf‹˝Èπﬂø÷ª K
dD„öâ?î`à∂jøà;e
ßXö≠;ë VB≥[ÙòÚî>∏√Óƒ?∏π˚2>Æ˜“8mEPaœ>ÚuÁIl˚‡v∂ tö@ŸB√#a(Ñd	¸˛]˘ Êf∫«_˜ôÓ )÷ßÖ§lFò¿„SoäÄX¥F,aÑªÇíYZ)nÍU#DΩŸ‰Ã™ºs‘`”≤Â√V|ü,ÆN¡à70¨™∑®TÛ[jøÊP⁄l‘W>ã
>Yåœ≤⁄]xY˜_ÂVëñ´X–®/‰Ê≤Ëã1⁄ÁMΩ∑Õ™ÈkÃg¬≈)†é¨“¸J≤£õjùòLõøı7ﬂçMzî"\∆ØÁ≥5ÅÇÃ$ñï`§2I⁄°!◊é£^û‚$r‘‚≤$ÌE±˛I#˙∫ˇ6Ë%√“◊…õsß„î√ÁπõTˆ *yõtÅ'˙ +ƒUÔÑ^†C‹|2&C˚øü
¸ä,næè#ß2rÀ&,∆7e≥‡Œ∂ÙıWáŸGçSıΩ!ß—kÊ∑¯-À¯ë’O‹1Ö˛¯lπÍMcØïﬂÏw—7tØ®äwt;rÛUæc‰Åª≈Z£[ˇ7Ó3Ù(ŒÆüÿÁˇÅ—MMw†y≈YV1±8úƒq‡¬‹@S¡H)”[]§<93»ñ»whêE]h‰Á˛ê˙%ÛÇt<˚Ü+·gŒ9ü°€õﬁÙ:ßN#Ì’^ˇAÕ&ú£yA-køÀú±á@Ï∆hI/*
eg!Â∏X˜[áÏÃü∞3o:ƒR]>…9„q.on!»îú∆Ãæ-wâé˙Ÿ.Q¯æ≤K¥»!z∞ëˆ˙≥kÍ}d…sùRCy})¸LT◊—¸\#¨œS^DæÎ…lXRF†¨•ÃP‘4‹"ókôº!s√0Q%Ã§◊C/ƒ°34†¨Û)oeﬂ_l‰æ§rœÏöµgñ–Õó3ÅEã ıó¯"Ü›ú˙óó0È/á˛9F\¯√¿Ë^è~F;Å…µ…úYﬂõäòËàûò¡˝˚Á˛Ω—l»˝We±—\]÷∆©’Ìà-õbïDKTù*ÂáU±ëÇ‹⁄4(-a%´JÅ∫*G˜ ñ ¶ä˙`íLzÆ≥—‚ä44˛qCÆ5èá_cKi©®’ù§ÆñˆK&Á‰)iÖäŸ}|Œÿ¯Î¸˜ﬁd<≥z∞ª§äo4¸⁄‹∑pyráút?ÔûuŸ¡q˚ìŒ€;˛Ïà}˝7˜ØˇÚ∫®8¨sz¬∫◊!ŒÑ¨ŒHG,ÖôaÃ!4H‡%ãÁn¶uôˆfGqøArr|z∂√6◊†uJYb˚cr¿Êã∫≤HCÓ9˚4Ó—G>là“Q˛ôå)œ‚Ç≈À§§eÓÃﬁ∏≥_.=~∆ª‡sp;A+øã´.nªèòXG}ñ†y,Ø|É$ØÙ7b‚ÃˆPsÅ"^±∑Ünêà|ﬁÖU}WÌ¬⁄Ä…˛ù√†ı‹‚]π"ùv”®¸dÔ≠Ìv@N\∫„ﬁµX¡Læ¡^dèn–+¯–∏GQ 	Er‹G$Eÿ¯0hœÂ≈‰¸X“Sì˙pÍb,aJ|é8G>∆I√&;√ô›¬@—Ñu∑J◊ÿ˘“ªƒX¢Y&∞àÉZåLØ
_àÄ»˘{àY=NãäöTE3ΩXÎÃÈ¬¨@ßﬂo°™r‡_ 
k]Æü∏}ÑÅÆÄ¥Ô¥üûÓü}æ´πâëæKRƒÜ∫¶<˘Cﬂz‡ı›&^‹}⁄nw∫›•‚·⁄®◊æyıÍw¥¡–Ór÷9=‹?jùuˆvX4Upèô ÀÇ}eÁ(¬MÙ~]3êº–∑ﬂ¨‹∑†Rg0$3XèkR˘Tkˆû-Å«J/*p7à>ÃHÄ¬≥ì®"M)oÊ‰OÈΩËU©5˝Õ´_ˇ*wíÅΩsó@6Ñ∑•CZ§LﬂPToÜ)rÓòZé	EV~ç¡f¢˘?7D¢≈∫È˛}Û√ú±∏tõÚY/1'‰%WÂß•ÈWøg— Å·ΩD—sGrÖ0ˇ˚nÿÉ3ë:Ì"–Fë)?”y;,$ôKºŸ2˘r•∏S.HHˇ⁄u£{eˆÔøcq¢fô1#KLuëG,}¥úï…ªp{◊Ω°´˙:Â†F„éj´5ªèˇı∑†Däº)vù6#òYW™ÉßèZmiOB#Sÿ.B’≠•ΩÎ±3ÚzK•"+-ª+ø˙Or˚ìíïë†DPë7T]i	–ú<iË_2ê~Æ3“ﬁ©¯QJZ„πéIÙô£ııﬂ¸5Vr∑Ÿ±êπ™è—bø√xÑ˘Ì=≤vıAkC1›F-≥S_P»uZHíYñÇC1ÿÈyaQÈJõ£∂vgÁ `Ító◊†nVëLYg∞q5^Äò˝HE	Tì,ô[ΩÙrÎ#˘ˇ®üEÊ¶4cSıï?JE4∞ÎöfQGVL°YKÜmbc√¶∂íü¸ÄC~ΩfsàÔ|$eEˇàpÜúëA‹6ìCö–4ﬂy&È®∫wI.wZîEº¯ÜNÔπ¨¬≠Ä©q\qQîù8($	J•≤mí¥ïœ…îRÏ ¨¢ n±VíÕ¬Rl-wü>:k=bÌ„£≥ŒòÓù√ìÉ„œ;∂øüAÛ≈mÚ¥u‘˛ò‡p^˜¯ L|ìÒ23vhc3:·Œœ7PÂÊé™ÉºO∂P‚Ûe≠ÿ¿A(ãøÚ&àÿ≥ËtÌC¡JïÅ+‘á¬{tc≈>snπ†¡Ú‡&Àå)Ωo¿W∏ÆÄQÒÏn0≥&ö§Ù6≥⁄_Ê≈^âè∂3æöÏiËåú;l≤?Ç?V◊lRiπkÜkb†ﬂ¸´¸Òë∞tœ|ÒÇ`ã/Kåóíº∑»·z†<à)^=ïUƒ£FÒ°ßM9≈˜ø{ﬁ´Ûõ-óî<ßûèÅx.ya1ÁR4»x[}I>O±	JW}Eµ÷–è›aÒU˘/%◊∏ÃqÂT∞¨‚"å≠Éôº¯Ù -f∞¢üÏu—i∑èüùum$ó0xå≈Uä0Ëjò"J≈(sÖZûvO| öŸNd^…‘«Î≤Z…˛Í…Ω,ï˘±Yò˘±≠Ú=4≥‹R◊)dpKî['Ó”<du	ÿµúN4ë
"@rcü™?•¥ë’m G„ë™Ò)ú——+ÂDb&»Ü‚<:£Bí≤5‰AÀÜ¨ØÇæ  °Çfg£T‘0í“ÄA8Ûƒ∫·u'F9ŸEF¡˙5ëT“,êÿ’0˝PÆ´<PU…õΩI˚1^
ˇ±r+£è§på4Q„ÂñL≈0HÔ*^Q÷˘Â	%π¸¨º|å…∞°“
Û≥q‚À Aüjía£=D*'BD≠\`ay:B^õq|ek6¯Å˜SÓ¢zkãjZ‰ïù∫!∆˙	Yø®¶9~fﬁ÷óÆáµÃªXº*M÷‡=3OÿH≈ÉÃ°∆1ëÇæ®YòÒØF∏¢˛øπñvÕõxK`s’KA⁄ÎçÇ}Z  éÃÿ≤ãÂ¶ ·⁄x#◊®ç]5°¬}†âUe‹ñ†€.ú„ﬂUπ ò∏P‹ Æç^^ŒÉÿçKˆ·PG∆Úífˆ. rR!4S‹tÚ~"ûª·˘p€ÒctC˙4«≈¶Ê(Ñ∫4hé˚v1™)–tAüFW&¥¬™˜ÊwüÇæ«1Ú6wåe$s
©fU-j(ﬁ»Á5ïÊ…?ãŸj€Ω,PˆZ9çÑ<Ë±ıR>≠·ê^Ú7Ø~˛üYÎ‡Äµ[á'OªùÆ®xßŒ)~2™]˜v	Kå	g~J0&Q`v¢0ñ@PIF?R%Õ˙ù™ëb—¸NL+˘´5¡%D/πË5¯ı_˝ÇOH>zoﬂJ¥©_QËˆA*Hn™Ì2¨QÚ0Ø&,RÚ@Ø∂>–÷Aô”7ypl–≥ØˇˆÁËÀÏtª¨˚¥{“9⁄C\ßBw%Î)ÑÖáÌ AcN»jÍS™÷d'C’ù@¡bŒ›‹U%D{|Ÿ|V‚*NÅ;ùcõkl |#ßwF¯°.∑,´Œ 7#Ñ˛RË€æÕ7œµ/ΩUô¶Æ≠˙e3 :~M⁄05„ﬁÔ˝„£•ˆL·rÜËsÇsXâÆ}È9 O«K4éÏ˚PÈ+Ç>E~)vøg¶ÿ∂TÁ˘|˛Ê’Øøb™«lˇhˇl_Ä›t$w4ˆÂÏƒI˜9ÚßC™1’…¢´—;ê_—É‘¨¶u8.yd˘•>“˘R/uí-5J˙Œ≤UdM;aÁï!ÁîD7‡ÊÛÿGG∫©Ã3¿,B}qá&Íæ2ﬁl™˙ÒùŸ4âÅÓ\πVÆﬂ;∞ÏABS”`f'˚†Ö#˜^ãåãu;ÅáÀjáE‚∆ÍZÚ}ãÈOª´Ir€]À•øöˇmw=ﬂ7w4•÷ÓzrøÀπ+ÉÂfö#?^⁄	WmgX!Ó qÕ·éœ‰$‰z√˛ûêÎË"D)™âÊQ:E%˛˛—„cq_Yä*õ>í¢˘V}Ü,ùGí.^Z‚™}/ãTÃzºÿ
hªîY≈⁄ß†¥[Ï¥ÛÈqõÖ?ˇÒ∏⁄Íµ?c·L¸Ò¬Si#ƒ⁄:c^a>pøÙüß"î"ÖQü‰8È5Õ··≥Â*∫†r”◊ëüˇﬂº∞˛Çƒ”x}“8˘z[∂‘≤M˜Ij˙©á≈uø£?2ÆÏœZßG˚GOÏtπHõ”Ç[—mıÑKã¬\jT0“˛èƒK∂G6-Z÷ÁW“(”x·Bfœ≈î°[3
îá‡ +Àï∞àSÚô¯	≈±tÑ‹Ë3ª´íòœºIaÕ∆åƒ¿Ño7Ó‚E–Òˆv*Q09‰g£´™
ô{fÄåóÃ≥î≈Ó…˜ÙÕ´_˛÷±BßhÉÿÍâ•ÏP&!5>»Np≤u"^4d´Qó≤á¢‘∫Ÿ‘z?≈t<&3™TgHŸ≠"Ø≈6Ì{hıG’3L$UPl«HØ05}Çıú)6zq¡F.v})æ]!G∏0û∞…ŒÇﬂ.Ù˙.ÊQ>œï˚¥ÌçÂ„Pb!bA‹T†„ÃΩÇ'Ãÿ oáÁ∫xÌ· ;Eo„Lí˛*ÍOƒœ˘W@∑E@€ÿ†q·y=KP´"Ã –Fûn¢◊úÜI*‹±Cy…Yƒ¿˙”Z!ÀNæÃ0Æ[ãgø>€ì 5∫,N
ö⁄¥ayFu¢'Å˜•7t/±*eﬁÉ 1Á¥Õˇ”hãiÃYú¢íi≈⁄§ã‘AXnsœΩpf√iΩDUBE˘É±≤„IákNoJ7òó±ﬂ»‹?ñ´µ"U∏à/Ppxƒ°Ã+à◊\aJ)?L‹¡≈ª;>c|zﬂπ√BÕ{R˛,EJ9i"ç£Tz€<	ÂÜ5õÕŸ
˛´({	jVÆπõËÍÌî•-8Ø•Çû|…/Y=˛%˘5ó≠\±)/Ry∫¥M›y5ÜM±|¯t˙˙7ˇ»DˇvÙ\ \”‰Éê¢x≤«XnqŸd{…\Ë~Èd‡ˇ1&ÑÍ#¬;h,±Ô±zFÊÈ˜ÿzÈìÒˆ&Œı–w∞¡r{S˘˝ÀHÒ)W~>ﬂ≥€<ßq≠‰Ùó&Ø:c·¸zÖØ»«˛b!ã@ÒÈ/˜Ê',÷€ZYÛ∑»ƒæ”ã∑Qwaóæ0ú§ÖøZzeπvi©lZük˘â‹ΩA\ Nó’•'G•ÁJÔ©å}ñù/º•%“bóh°G ≥,V)Y\nÉe©9ıgÀ¨™¢ä≥˘Ä√(ñ4R9n ûD8˝«˚¿õUùΩÔç'≥iôëª±weNé¿˝…ÃÉµT6-ÙÇÃnÛ≤…ˆÇ&˚|Œ.ÿ~?Jk
ã˙∑)RrYVÌ[}©^óÖã±0„•paÆñV√ùØ.4ºÆQEf·ı*)f[Xvƒæ‰Ë€4Û%Ô(◊e>ÈIËﬁ⁄¨ø∆⁄)Ã¯?ùQÿº7{~.'ä<2f?#/t˙ã˝Ê€1ˇsò\ﬂ’UqËüc·≥äP÷è© 2k{{Bz⁄ocsã›[€d€€€Ï.&<á¡/t¬eÂ˝Ñœ;„-û≤ZyDs#íßLÊ;wÿOAtµ›‰ö˚Ç& wîVõ}© Œ?Kªùå§ÕW÷9Q1>Ée†∂˚Õ´ØæbøòVëO‹„$'ÅÁ™¶’[‘ì6Ùnˇ‚w,Îß ˝ºÓÿÙ_¸JÒºWlOe~`Éø¸üL}!
AVÌi,∑ˇ’?∞ÿw€Ü-Ω∂ˇÒıü¸9å?CØE•VÒk’—%Ü~j˙ü$]ˇ°?ˆåﬂ◊˝U.Næª¢VdíFí∂€Û'Ü÷fUI{^B¬;Y+›Ô•mkH≤Ûc‡Y¯ÎuCV¬I¬yFÓr≈ı‰®∂´Un¨?9Zf ﬁŸ)l\±Â”nm7V+≤~⁄≈∂?√YÀü‚˝íÂKV¶¨Û¿µÃ◊æÕkñÒb∑b•ÛÒ˝äÂﬁW\¥Ø~'˘(Íí<¿ÌW]´›Y8qÒ©±Â_ˇo}Ü∆9ä‡Ä∏ã€øùu5ô668∫≈$«Ë&t,≠≤W¬˛(;<ee≈¿û∏‘>∏'.¥îõ0¯a∆‡áe0É6!~ÿ6¯aﬁ‡á	Ó€ ¸ò»¿„E‰3Eö˙2˚Hë:#ü31;ìÉ¶íxSı‹‚•‰y °ÖmxìÓ∞lÕÅÀ àFü/˚ê eOó˘Æ¢*9q†Í˜◊“…DÒ∑ÑŸD∑ıûíT9•Ù‹¸(%;I!ö∫é¢N:·ucxππy√ôÃﬁzœÁ*b*„œœn∑±√⁄Oªg«áÏy·ª]Lö;lùùÓˇ;jªu1¡’ﬂÇ◊Å⁄’¸πjÙú†_õaw7agL˜9'ï‹Vu*π[˘•Xß*≤ Â◊∫¬⁄9€™ÖITs#^§ÿÂÀ(9¥Òà“SDÂ`O=jµãj÷UB&Iì"D°éP’∑RêA˘ë@WˇBñﬂP‰uH‡ƒÀ+Ä˘∏`‘"ÉxìÌyïƒz4 àˇe⁄â'°≥+\c~
‚{5Ã-Ø¿ãï Ê%◊gÀYÛíW®RÕ&å~@‡√Ìk≤±rÆ{†∆“›ÃTÅµR]ı§ü⁄©üì∞sâ˛ylÒ˙˙,U{»s·eÌLº@B}z„ºäYÿ¨@ 9≤K¥~¢U⁄0y≈àvÿó∞;XøO·tÜ;“œ+NV¯{‚\É÷äÏ˙K4˝]˙ñ
>”_0=]Dr¯~˜/ŒØxÖ•®:µB»^üº%ÙÖ3t±|˛=ÄÈ<‡_ﬁî%ÿ81ÓcK”)ûZ‘è‡˛œóæ(Wm„ÙCÔŒck$HE≠∫´?≤iﬂL:gEJˆEéÆIK“n¬6Ùóe˘ÜÙß´2≤¢*.ˆBç^‘Ë%ò q'”Vw=Ω‡≠–ç9UÑ8∆qI∂!/Ò´ﬂç'n»?¢#!2N ÀB2RªâFµ£
AÒ4Ωyêå¶¿ª24O{L¶9•Ì
X]†‹ºâk_ÖR5‡)h 0ˇêÒb&[v±ΩRº•ﬂ.¨=,„vƒÖá9S≤Ë»⁄v)Wó	=Ï[MõIa˙¢±µU€M`·Qhò≥∏ÊVm“N·u¥Õ@+ıÛ…±‘J5§ÌjZ	®øáÜƒ˜miªãjÎóˇè}| N¸`J%yåS´÷÷ˇb'‚kãñ‘Fßë˙g÷∆ØŸ«≥sõ∂¢ù2™^Ùõ_`V˚¸˛‹˜ü[u,°›®Ó˝˙óåóº∞zï⁄ﬁ≠Mä?e]ÒÉUﬂ‘vØµıg¨-ø∑h+RÜ¢A˚€ﬂ„†}Ãø∑h)S—S˝˚ßøfèÈ´G’’’÷ÔˇkÌ≥oËO≠”‘W’ÿ_¸ä4iÈ§±YBU“ßD%ÑyÆ‘!j]9Ám0Ü)Ü¢∫]îd∆R∫SQÂ…◊¿†ûbŸq!ØL¥ˇh"≤ƒ3Õ®û´=õÂc£_ @)°ˆßF¯)ƒœÄ¸†ô$+Z$i"¨D*6ÈúË¥<Œƒçc–å¸nˇP‰? %S”úàüø¿Tƒ~añHÂÖ4Ùl¢ΩënÙÃÿp’nÏm¯ÃmHµ	ÃWL©ΩΩPJmΩÂ-ETôa0äã{d÷À„ ÊÅ⁄.ls …å˚‰1Wo[®TÚ∏âÕõálâ≤Y"E;™	»©[„”6™œ ß1M`∞U˚FÑÆˆƒõ'®tx,ƒΩíÚñƒ¨y+◊ân˘«<2bC2x(.ÜF~ﬂú5HJéËΩÅ‡HºbåCù6‰ü1ñ¸¿•JÚ ÓP¥˜OiS<Ω~pœ,9úœ˝+s≤&∆˝ÿnˇ¡ç>å DıueCLŸ˜B¥Ú®¡j-§ >vLL|Rà«Ç	aƒWv‰F~"ôk◊-Ÿ1ôﬂ¸ÄgóSc•ﬁ™Ï¶ÜXÚÈÅlQlπ)K7ˆ› ¸ ∑·‰A~y>d∂dXÚÚ∞áÒ%∏LΩnNf·¿bI™√0Ÿ;}Y—øÇ›ÍªW«ïz!ÿ	†1§Új¨ãß
'CØÁ‚˜+	‰…√fç‡Ô¸©lÔ)dùh Ój;ZBg)l‘§d,Ö™ºpƒÓÅÓ“⁄á(lõSˇ):m⁄NË÷ó_÷€8!/áŒc>˚aﬁHÅ *¬ì”÷—YgèÛ¢t>=˛˛~â‹Ü⁄92Åœ©ƒãf¡J/ ˚¢±≈
¥◊Ó6c‰dw	úìNÙI∏0çi€˘ë‘®¸â”ÉW 
ötÜé˝iCÏ≥>Öÿ—ÛóZ—\j]xî©’a xv§…€}Y
5§6+Ò±ﬁ¶î˜¨Ñı¨úwi|·cŸ6QPú@ú°ÈRºÿIºÊ…ˆZäÂ,¬>k”ŸíMLhKB≥8ﬂyYeD∂˛“∞dÚÆ1˝ :0öAèÍ›≥'3∞F\ sVÀœ≈I$8·
è¬Cä|ÃÂ˝e¿]cT%¸$∑ÿò[≈hPÑM∂A<úˆ‡ƒBN\2#‚¡·Êyù“:≈…–_ê  %äÁEûãÂçñûS£QƒiñFV‡Ô0˚·ÁÈ n¶6ßO'ê≥ôåƒ)#M´âóµÁé=1OxiÎ∏çº∏hæz∏5‰É/
+7ﬂ"(lsáÏ⁄a›N˚È)÷ln=›€?cgß≠˝TòÉ[≥E¡”Ö™-†Íc"Weè`VöÀ'íÎ˘C6º‹°øˇÖ·£ﬁ )*…Æe[ïeô	 ≈B©:ô-¯v,	⁄Î¬„:£±Ωi2;é“:uùaQT∏jg<z(Cjà¡<P‹ Z—≈WO·;¯üsé1:á˚„%Ià;)∏Wµ≠†©Ê	-ÎñòòÛ¶…Ò±‘¯ÆÎ8K˝ÀP‘0b÷\+∞∏)ëÉCü∑T¨€d•ﬁ¥‘≈ıxíMâ¢T´MêÌxnçÙó¥=vy"Név^4∂7bì¥†œ´≈9'iO˙Ä∑·….˝‡∫‚êÀÀÁÙÇl¶‘àÀ¬rÃÖ≤ëwù&ŸúOΩ$∞üëy»ìi<◊4e/ë∏Ùy˜¨së˛_©âΩÏ√≠nß∂+ˇ™‘ÿºµ]¯á’5ªiæT‚°Ñ è%˛™÷LTíä˛6iJÂo-p©tÛe]¸Ó.˛¸U	wÇà¨AÒ©⁄$?z|L)Çˇá·üï⁄nÍÕoô¯T©%YS@$- èãõ·yAÊ…ÄñâÄ‹—˘„–ÉZá™’ˆı¶úë´¯˝z'ÄÚ`6Ωh‹[y∆æ¶_œÔª 2⁄˛h‚cÒÄ˙vèèö!5*o]⁄“Ö∫ÊÆ∞çr&T®ˆ_å»ﬁ£ºEoÜFqÏ,XOù!ô»ı%ß‹”o´â´}
]Ö·tÎµA‡^‘V¥!òØ9˘#4˘)∑r($ûﬁÏ!˝˜ÿQ_~ŸƒªñW:à9MgÇI≥ÌÅ7Ï◊„]±Ì9ô©eÏ¡©´w‰Èñ_'Û‘¢Óà.;˝-ç ‘Oô{5ÒÉ)w∆‚ÃÖˇe"2ªt5§Ï,Ò´.döùYü$ÕÉ£VîñI¸ç(£¬áÙõWø˙˚B—%¡§o´Ëä•Çà˙/üÌüd;7
´¿TrMf∞ÒsWó‡ÌèœŒÅá‡‹kë<¬K¨üËX≈§áf™Q÷à»°NH…∫I<üÉ∑û¡:âìg+îuNù—dá∏qÒ«˙rsÍÔwèπl´/Ø≤ËƒäÏ	a'∂6°µ–πt)ü&ß7Tvı≈p∞¿9»ﬁÿCuî2hŒØıºêKä_!
ë± 9Éã€∞ ˘%^2¸“kôï_ﬁ¬µˇ_∫nBXÙˇ˝ˇ-˙¸3Ê*—Ä˛£3ÚÂp/íÖÓM„—ﬂ5–9{—ÿ‹®ÌûIëbÇÆÃmEz ™5Ç3$hèú@@ﬂWŸ!óMïªµ”#ŒÊáL'H√U©A∑˙¢±qØ∂ãs˝¿˝“ñ∑¯&PßíøZ%ÌÛÓñBoÍ6∂ØgFñîU ãù°ŒgÑë·Méúio‡Ü¬°˘¿˙whä›ˆ√ˇÖD(¿âÊ⁄åüBE2ÔÅõ´˝ É…±ó´	l∫O´H=∆ÓÙÙ_bÁZﬁ≤+Í≥3Õ…íæùV≈];Ø¸VXØwÓ§ûW}e÷2ÇN¥H9EeAÏˇöâg˛ª_Êó'b9ãaw‚å‹l'0ÇÎiÄºƒÆ1o
⁄W/Ü¸›0ä«è#_©Ωdéa±ôêŸ¡‡'ªË@,Ó∞	z$Fª†C¡àr¡ÇC≠êN˙…Ã
´ÎhoZrﬁ 5a “»õÍáx¡—A–©•∞Ç”qÖ•©‰∏T"U}ôd‚gÒ4©¶Ø√π«Aßx„DŒEÜæïÑô"ƒS(Ù‰¸Tµwoƒ∞º4á‹§€7û–IP˘Õ3YÚuMi‡zY∆∏]Ëó–®î]‚±É%ƒH≈ ’&K”∆uYY√vÒRs‹]‰˝£⁄ÇZ≈ªÙ›˘˜sﬂ<≤(≈Õ•ù7ür∞?1¬ë9˚°Í›ãûÄπñ‘Ò1›ÒÉÂH,≈úJq+œf1≈¿Ω|ˆ“"~£èÖ)nŒ*kcéU¨ÃΩ|@¿ç¶¬Õ%5J Q∞•*±évo˚Í˜b,˘ã@—4edﬁ«¥Ã&HJoL¡(N˘˘:§¶¶C*\-_≠Ó»úa?ZÆÚÛΩhΩF_qÄiÂSŸrq◊Û·LI˙†›è>œy≥»∆ÔÁõåÓ(>j˜ﬂXﬁ5[jÕF^-æM*O™ﬂ[MflÆÚ∏¡¥(Ö≤™[`]´üå¡É[;¨sÿ9}“9jŒ∏:”e«üvNO˜˜:6Ë¡(Ã@xx}Üˇ†?.l¨≥QG}‹ —|w¡êKw‹ª&4.Üæ@gÁ>r≠¥Òü◊[M÷òΩaï†ÕÚ±ÿqÌåìkNW3zπÚÃd—ÀŸ»ïV/#€C‰ñYÚÍ=Õ?ñœπßLÍhñGDbıÙZæø:ÿ*È°	`r+ø<Ó~ÑÃˆBü HSÎ"GlÜúñ¶!€!Îó`.Ì¿ëräoV™?^¿Ògeg¨3æt.Ô0îÔO!€ëÈ(z”ê30πó≥°H“?^S∏ÆÚÊ√ïx—	¯,¿Ëó‡RXØA ·ôÓSÈozE¢ÓvìQ˝Lˆb øMaO¢‚⁄Á#ƒl#6Ò64ˇyà¡ˆ2≈ó¢l^8ız!õ†∑≥’NÏ®±)±<x1®C$ﬂ¯F9%•5]ßX©Â·çÃÏı‰⁄øã!£6O6S‚üªwÃ¥#Oè4ôá4hπÕ ^˙}W∑∂◊≥£ïë§l,M≈éŒ◊tÏ2˝œHÔª…Î)•Ztéû¥ûtˆÿ*€ÔÉ©.ÚÓ‡∑_±Ω˝Æ¸πNÖŒr	ÅØô™XNot∞£l∑&lWâqB¢?ÒÉ¨°,wj¿˝¬z‘¥ÅÛ— ;SÉ®N?î~0vp‹˛dÔ¯≥#|≠'≠≥ˆ«Z}ŒéO:ß≠≥„”ËΩ"ÁHF˜à¨€Ìˇ v¥`ÑË⁄¬"n∫fÚf¨«[3-Û+ÈÒTSƒC&A(è∂C¯ÑëK⁄>]Ú≥≤VS™NÆmD\ 'xN˚,ß:-¡ÔÛcá’ùuQd¥Rˇ®K0û•à^Af†b©®˜Qx‡%öÉ¿jÉ˚óõOÊÖ60ıUâ—2æy#ÖNÚ˚Rû´ƒ§™ÚŸhVÈR9FÎ.øÃbvÁ"›hBD[D)g|Le◊ÓSæ-ûQ [ó∑cÏy°ãjú´ˆj‹(h≠w¯÷_§ØÉ˙}.§Ã!˙€Z'˚Ï˜öù¯∞W¿{7–¸ÿàµäÉó6>ø≈Ê&Œà}⁄Kíæwú—‰òù÷@(
ﬂæµy|Nt„ 0^>Z\§0Cœ°ÁÓòHnB2Tz∏IÒº7oj∑drû˘»=>Ö±Ä¡¢=∆OrÀá†ï°%©∂`ûGÌ†é‡bˆ∫Ïø —;Ç$<l∆ΩI¢¢ßRÇXù√N–÷§ ¸ﬂøD∂Pï*ÀdU‹a_4ÿ¿|m∏'z∆¯⁄¶é7Ü˚∏„/Ω¿„º
oMÍ§§OYìeKﬂ»‚€íTez£\K ‰¨9¥Ô°qît§ó¶È„aekUﬁ≤k¨îõæ∂FµA∞à∂ût˜èˆ3ÔGüt>7ı gºÈ å¯˙Ø~‚çfggÁ1ŒŒ˙«^Ê˘≤°E^&Õowê∫›Éué⁄ßüü¥∏€§è[ççÌªÏÏ†+
∂}+FC≠˝£ŒÈèNéOœÊMOHŒ#¯âmÆ¡˚„Kÿ§åñ©—ÿî´
Û+âV?es2O÷Oºø:Q	Ô¯>ã hcûCªÒ·”3Ç_∞√„ΩÃ‘z˜ÏÈÜñVŸYßÜÚ)küvZgˆ¯¯Ù∞´◊Üô´§2kœ≥éÄµæ§°FFGg®©’7!®5pÇ¸=•J-"(˜∆∞Å7÷‘vˆ—⁄⁄Í›5Rá˙Å?¡@q@ò€îé,í¯à?mh¿ó¨`V©¢O,9\Ö/ÿLGŒU„Ec‘óIÓ∆~@6±åÛUıªqC-â¸Á#%#≤µÍEb?'¢
åjLŸë˚"z£ƒyêÕQQ¢ﬁIƒœΩ∂µ]U®Ôé¸À¿ôº¸
“ê+πD¥@î=Q)†]7s!
◊bZ-Hx—mõñ¢^c⁄L>)‹¥◊tüıt J8bÍ•Ç ]%Ó%=KexôtÛ§¯Îﬂ¸eÍ¡≥ÃÈ,}˛>÷KÉGÔRº7›°€¶îOÒ‹	H¨^!,lW˙~îûó9ÁL9U
ÀËÍä¢Æ@Êû ∆˛¿Ω©C¥ÿ\nΩ‹|Bêbê¿˝…Ãã „ß/QÅxŒàµê„(Ãˆ]´º‚5P^,ÕôÂå»)º´]ö®ΩÀk|öUﬁÕ¨∂[ÜR3›—TI–ﬂqÉDäµÙH•<ŸVk	æÅ≤ Æv,@ãû≥]›BccóEµŸãÿ≤g‘3f≤˝[∆TØxçƒ´…)ÂÑli<¿‚Ω^b?cKì 6YÒwË¬Ö}¸îÁßé’˙"
2d“ƒ˚ ¨%j˜![˙dù’[»Ö∂ŸÿZFèdtVt«áÇ≈åmí«íˇΩæñ{Û≤%D#G7ZaD€ºÔÈÀº<ìØ˚"óYñD…—l„‰bLkªG¸Ü/&_H¥!Fº∂{¬ˇ®“F47»ÙÁ¥ì_¢:œôıf◊7/[r"µôÇïùπnSÎ ‹U»Èí-hFÁ˘Ω≠∑±>Ã+Ωﬂ‚ûì7À5
„ÛÚÃY.ìπ∏Ÿhl.„DO[∆Wíh8&¿jª±è∂Mmàk∑€ÿî˛±dTx_fî‰û35)˚~ﬁÚ;WmW¸a9=¯UÚÚçJóo À7+]æ%/ﬂ™t˘∂º|{æ˘¸~™æñ©˙ë|]Uz€Îk—T_´÷ÄZ+’Àz¥Z÷KñK·åKøΩl≈w…ÇâLóSﬂaË«Æ»Ç)†„,£·LõŸ≠Ï≥◊0=≥Ë°°ET∂êı&Õ◊ÛÎ2∏≥'#Rˇv™Œè‹ÅÛ•Á—ËLj°ÜÒπhˇî ƒöÒFS3¬		•¸&&Feã±s’sáCx‹⁄nÙßï©˜ƒ˜˚ ^·_´Àé\∑≤˝—$ø$„	l÷‰Wsôäô_&æ≈‡∆1›¶·>Ê»sX€GÉd›ê/¸ QÓ“a±¥ª’ÕÌƒ[ç¬‰)ﬁåÛ!¸çóU¡â/¿èö€—
å…€Q—±å¡˝Ê’œˇ:èœ—cµ+rŸ◊£;	–ª?ZŒxyŒŸ‹uúΩä=ﬁ≤≥˜˚qù∆õúÀâZ¿^Z≤nßH◊}/QH@'’dHı&s9ƒWWm∑—@^
Ìµ≠-9¶f*†—(Z]7¢¶YÊJñ44=◊ûnFä±ÂâjÙöÁº¶‚œ~∆¢øÒ<>	‹>/π∏úû?t$èË îœL\=bj≥à>Ïä	ºO√=Ô≈*Î≈Hôå∞X™Íﬁ∂=MΩÀ¡CdŸ€+QºÉÀD—9_<Òõë»[Òá˛•á<{‚˝4ŸŸ¿ıÇc…k™€ ∆¸AS'‡≈xÅ	8≠ÁèŒ=ÃÇÈ¡võ'Â«‡2‰Ê©{)–’–¸Ñùx–Ø6ÇMy –@nÍËE<€‘b6∑√⁄⁄ÍΩ≤4ô“Úãq§RJb&√õ˜÷∂•∏åj«∆G %ç3ÂœO4ãóy®	#K@πÇ3WªemÉÙÓëW&r-ã6MË.Ø!P†´U≥¿EmÇœ]'7ŸﬂZ‘kmŒmçWóıJy/ê∞Yœe»oÄ∆Ω±∂±ù›Xguö•k∂û…çuje[Ÿê≠¨[∑≤A≠l`+õ≤ïÎV6©ïMleK∂bÌ∂›ÿ¢V∂∞ïmŸäµ«vcõZŸ∆VÓ V úµÈVÓR+w±ïÔÀVÓŒ·ÚÕE=ΩvÒÒtÏ˝dÊä=¢XtñÛ‡ÑÒyvÚÚgt/¬Õ≥÷lÍÔ∞od◊f‡ˆg=∑^9W  Hå:”hW¸ª#jΩÇD¬ﬁÚèƒi∑∂º¬`˜Y[fﬂcÎ˘iyÚMµ∂@ß˝ˆJ8ÇÁΩq™c^(t·_BlãGßä¥=™˘y9Ùœ·”uvKô9ƒ‘aíËäèUS†ª
3s%¯,øœ€j3Î?ﬂK*0±•ô¥9¶[Ÿ"Ri%/Sû∆√ßÅ.&RaD≥µ1Õñ$N¢í–Õxﬂ$∂,gö‹<É%≥*p¡÷û’^~X†i–I w·$X7ﬁó.ôÖmûﬂôé,√âÇrÆ`y≥á…H[Ï◊V_∏4Z^nNú~÷ˇ¥æπ¬jkµÂ<ïˇ¢å˜mé≈Òo†óOÆ ó`=R/\M2≠tVfGypK'Äg¯z¨yÊóÜﬁXŸ6ôÇ4“rõÑåCãRlåMñ ˛’'30Ò<hQÂÙi%pÚ&¡ºN‚liîë)•˜ê√˘rgÂÖL_V∏·©9™RÌÀ€·y5ˆ£à_Ö›]5¯ùè=G√*(ØïÊdg‰x√¬=Õ@Qu±ë<Õ¶pn&fÁ•Ë÷∏W÷^hˆ¸‹rjEììûja⁄ß÷Ê[Ï÷ˆô≤…jßﬁÚ¥S2˙d ˝ùwﬁÂDªi˜ΩuVﬂﬁﬁ^fkÎ`¥WòoÙ4ûo‘Êw}æÕ°ùÄB≤780øòO◊´Ã<–‹îäräñ IV≈Ñ‚Y		ﬁQ"Ø ãÏ“ ∞°¯AXZ$ÎÂ¥â?Öµ∏çÈe⁄‰îjH)YÉökbFC£ÂÓ%©,Ùq!5|cIagé ã„eœíYCßnVçÒòdÊØ¨bK,U+>Ûcó„YiÁMˆh6|ıgDEõxzZÛõ0ı?p(øì=˙/8-Àô{(“‘‹aüÇUu·ÒóªúLi√∆EõÒî6qCı;›R{/<û∏„âVÙUÄ«›ƒ¬QÁf,˜
y ∆ó‚Ó·É»©•ü%ËÖ∏¸ isÑBº#¸ÜmQ‘	zD¢ºf‰`7≈=Îì !˙ªÏá úÒÔî“‚“d¢˛#ûuãn)8á&ÌRk6¯UDäjü=zz…èˆ1·>>ÎÍå?.EÕ‡la‰˜CQì‡eBhíÜfπO§uﬁt&¬◊≤0SÛŸä†∞çu[√˘Øfœ¿ç&;s™K¡aóõ)#πëÔs!ss!Â˚{ÏÙf√È5;t—¡≤®L»Vzócÿ|›û¨Ùbˇ«.ë%b]Ra$W‚k»Ö”ùÀÖœΩ»\HC'—ÎHçîì˜-Ié$7 :cóÌ˘ô∫∞2ƒ{©í©]˙∂$GæœÜ4ö¶‰1`˚{s¡à|+Ê^ø˜}˜∏Ùm∫˝Yô∑Oü≠næ+≈z¬∫v.îÖŒŸl∂“Ï-Ú ¶æ~≥y{»÷‘õroãà±ºP{‰P˘˛›<áJˆlõ‰;R¨g€ƒŒÅÚÌümﬂ)!⁄ù:,*Ò∂ ê?vn‰º>◊ê≤{ASõz≥(yÀiñç¬-@`a›ß8@p£⁄Óô¯ã—k¥Ã#)ΩjË>Õ—ÿ(‚>¨Ì*ƒÚÜ,Q˜oz±¥¡nÙGD˙ÜBÆ/ø∂¶Œ·Icccm›Fÿc¡£l∞{Ö%»{/Óø•‚æ≈+†¬¬T»]†¥Á%D˚ös±6ﬂÀˇâ’U1^r_ï>C+¡MnQ…ää≈≥:},Cä∆Â7§¯†?{`4ÒíŒ6È_37úb‡qd´¨s√ÜŒUÚ˜∑ı-€Lˆ«!Oø?CÔ5R
ÛL¿π∂ì"8+º÷µúÕc‰\¡oyﬁÈ≠Ëﬁˆø±29‹ jÎˆ¸`a÷G¢Ÿ	qãKâÂwoá “√yZïT˚≤È9ÚV≈Ví16NÖ©6 À;öÊPœè!Ø∞ı∫Ø<Á3?x>Ù¨56aıCÁä=ÖeÆ~Ê∫œã¥ºE Õ3Áˇ  ˇˇ ·]>Pxú‰\Oo«øÁSLà¿¢/II¶,+íE˛∂,à2zHx∏;$'^ÓlgwE—änΩ(⁄KQ AoΩ˜–=ı£‰¥°ÔÕÏ.˜œÃítî8IyêπÀŸôyˇÔÕ[í~Bü∫l"|è…√Îå;dªﬂ˙à?W‘Oÿ·M¿fóå∫&ü
9ÌLÈı´Ä«—≠Â)úLh0Ü€lìëà≈g•)⁄#º›æ!ùNgtüdÓì≥d:d≤Õ:1ïcw‘6…ÌÊ¶m1◊ßQtFßÏ∞5sFâÔì·ÿôMxÃ»PH 2˝«â|3gªﬂ#R$Å«<«ì–Ÿ&1ªéùÎàåD;C`IÏÛÄ9Å‹vìh_Ú`Ïl/x‡Ò±p˙Ωûô{›#√ÌÉÆ«Øé>2˝?ââBì3w∂[¶y`ºOáÃ/>±ÿ,©˚˜8„#I2È“àiJø‹ÍÖ◊ØıwÕì>dË˜mÎË8ä¯8`yÃØxƒEt’BñMT6=ÚŸ5—;øvXvN»ÕóA"#&Á˜…F(˘îÍØsE‡·≈k–≤∞Ì≥+•(ñyr.ºeÛ√|[€Ë¡4r\ƒ†	ŸŒ∂:}-ÌàMπÊÿÇA†∂ç´%y&1iAH<a†ÌÓ€°∏∂Yó˛®QÃ´Yê√¸\?ÒXÑ¨∞⁄Ä˛‘ÃÓ¶q8¨‚ç≥ı…!…≠.ΩıŸíÁ-fΩlŸ|aŒa’/—hj_/[ë>"Ìt{õjÜNòD≈ùÂ3å@≤8ë…|èZx_O5‚>®I€G*|ÚÒ·!˛
ﬁg˘ÃˆIó?}ªdÁ∑Õb/h|Íÿ oß◊”Íù:¨]∏^√çÈè—ôeü∞´†∏óÜ<¶>«ZG ,∫8ƒ>G£ì!ƒÊ˝Soj˝a7ªıì∏Ÿ÷— ~Õ‹8"ÉêπxsÅJãÈîÇAÖT¬Po≥ŸÎ6z Ì{p]õ@Î‡.|1ûﬂ''àQ,·Î˘dq7ZD)yÉïÎŒ By⁄}R∆w	zVxs?ï∂û‡D†ü9,¯–äzÆ±Ÿ"œ‡ˆ}ÚLR fM¸Íj™ÓXGK≥˛JUt•€õdﬂÄÿ™™4Rƒ˙Çœô˙6êŸÖüBg'ßˆ⁄œîu+WV=xx“l°—*ZGˇ˝ˆˇ"g"pîdÅA›4†c6»H^èt√Âˆ¯±ª∂s9·	• P¡»å£XÁ!<@®:;Â.ô	˘÷‘#>üBˆCh V™îÜx)¸&TYn&∫Ø•[Â$!ùKì“ƒ„¯çc–9p†oÃ$ﬁÉ	asÜ`Ë,Ï2X–Ww£éë2≥Ho´ﬁ©*Œ0vÖ∏øN¢òèÊÏ&‹€ôl„≤.o±ˆ¡0âc —¿uÌ3ÙÔ&ı´ıπ˚å6≥Ÿ¡DÃé=/µ€ˆà4öbY7Û˝ëâ∏br?øµù¡©<[®§!d>$Ñƒ≠§∑íƒz–3B≠)@$§
é©IùìŒù†x}É»4CﬁÉìXAıLú,≥£Äs~§˜f—.´∆å~ç—ÑzbÊLΩ˜b¬À`(®Ù»SÍ&~<_ô¶({–Å#/é¨®Èra7›O…NáúÄ™ã)ƒt4"OÆyLÓ·EúD‰DzÍìOªô∆›D†èÍØΩwè∞Ï"’Sº∑°µ4õ_É9Û ‘€Èë\5ÅÁŸÖkàÛû°3Ù©
µD8≥—Ù2ç}áéò^a¶x(êo…6\K<ìÏŒB¥Õ∫¶Ù⁄ôa‡Jcj”»ág&‹ÛXPqei’w E6ÿ/i`*g'y»‚crm‡Å√ØN,IFRL”˘P£Ö˛ægPÊX8Ÿ± /‹z`√Æ
	sÿL8ÛΩcü…∏˙d‚Ù[ñh≠≤≠sà" ¶:yèN√œ¥û¶ÍiÀÀ∫ì√›z»+Üb≈/ÙòS–J=:∂B∫<VYâÙŒ¿
ÎY‰ÇÉ®_ë§ìUKÈ0ÿö`Bú1¿Ye%†òjiê)uhLô=åR!¢Ä)Rˇ™¥Œkß\àK[Y\™®`f3{º¬ZXNŒú=P¨ΩÂ>£Ñ5õ˝x],ﬂˇÂO5©òº∂—gWëá≥õcø9.ÖË∫.\IöˆT—h ŒBŸxºzÃ¶
mÉ2vˆ†ó^S\˚m©êô36	ŸX"%¢“ãÃz≥òr?≤*Ö»±‰¡?àA"à…cZ»Ã˛«R`1P∏ÑÆ÷—”Wœüì≥„Oö™A´1NyÂ5]ASπË©ºx˘¸	Èí„¡‡ÙŸŸã'gó?µàÏ…7ﬂêç	m|h“ó«Oüí”«ÎS<Å(Rº[Ù^&⁄π˜°â=yuq“%@ÙÂ´¡:$ﬂºYHô âÍÈCLî ,˜.πTùYxÜ‘E}b+µ∑kK-™À±Û+∂ÒÏ0ø≤üg|N6¿;B>,©Ô9‘ Æ+•û2ªµ›Ô5L∑øŒÊ.ôúÚ MKˆßÇZ∂π≈•;S◊xÚß#$U‹œ‡nò@¨∂Ø∞ØVÀA˘ÈÂ√~?[%ΩÉ‰ß∫}sk=[Å%∂¯öV`Ü?∆
§≠˙∏ÛﬁoØbJ
=Ç„`>scr©k)ZE≤Eû±mG«6sL”H√»ŒeıÖï !~L OU
´íæüb‡˝Ö)⁄Ñ,AEœÇÂ≤‘9nÊ2ß’ÂE4-†Ùn°zA!e+£ΩªÙBÔÈÑˆÍN®èURƒN€˙ü‹9ı,÷âmËED]ƒÖï¯T…l˚V£7‹_'!l«2Â∑˝!HBáê÷ëftì◊»p¯/…r√†Kä_ç˘ÿ¨GLë‚%VìÆ~)pÌÂôŒ"≤ïM&ãgø\ã˘Ó.,f¡È_õ’–’ˇá—¨'˚8π∑ z)÷,[ã∆òøX[˘„ﬂÔ¬VrØb*ı_VF¶7m+∂®y«MÑÕ√z±πY.ΩÁ˚∞ùƒ€
∑µì¯⁄9{û•ÿ*>)T.$¬F·\0â@’Po¨t“Ïu≥ãW∏‡	,ÿﬁºµËE¶„≠£Oõdi=¸?¿Y®d‘∏e)f—·ÕéŸ∑îN˝UõÃhNƒhƒ±_ÜHMm[µ\	?	blê,ÊR⁄ﬁ'Câ¥√#Ñz W¨ïQD=xÃp`v¢	ü{xÀM≥N˚,Ã’ç©€Zr5SK¡zNª∏í°≈`ôØ.Ù4V;ÎM≤ù~π≤™‘„QøgÌ2»}d•'¡±ÎoSÊÒdjfπdøM@¢û·G√ô«{ûZØ–ÑÄÖ9ûq-LøÿÉ∆˙åzäzÊS<¢[–;çÕubs[Ç°¸é˘¨•µAôÁ˜ø˚Á˛Ò˚‘VMÂ=¨pVyäÔŒ…≥|ä»^G6ˆ	4-˙2äí6mø‡´U√¬¬£“√f”ä(m¢Púîc7Rƒ 0Nx@«/ƒçqc˛ÄJw&Øèñ&‡Ñ‰.M€%2ÂRmjQ˝ ÒX( t§0¸ÉÀ}Æ›9á≠— KY_pé·oÑG0=¨Ô¨qµDCK-ŸŸeI1TÁÖπΩbª©Ω¬ ä5ª+ÃLuËä`ƒÂ¥˝Ê˚?ZIN.N/OOéüì„ìÀ”óg‰7«gßgœæ
æ
é%#sëê(IøÃ(7$ÃòÚUlÜ8QlvÅFu\´Ñ˛9Qù6∫πÜaò£ÿB2ÕÂ—ãÁãﬁó7Ëmú¨Á≥«jÕÃ-*–÷∂›u”gV=ƒè…”°zŸŸ)PRuäîC–zÈ¥T~«≤Ùñ•+'Ö%<”÷MöÛÿá-=“ey_ÿaò@@+ä~µûêsıÿ˘‚1ÉZ3¥∆ó>l	ÒGW£•à·Á–
eÀh,ÌPM9∆O$:ÙÅ?räÚÒ
`ÙÛ§iª¡’B±µ§›:Ë)Ñ|ÖÌ¡ÒÑeHh∫WÕ›i5º∞†_Ñ∞˝^dŸß€%«aû^/°ùADØÿ«ñÙ+$IË)†pHå∞Ÿ˛Ó⁄ñ:t`yg`:óï6˚Œ∞O’uÖaÎÒ∂-#9ÈbZHQaÕÁ2xì∑d‡&„nî®∆QLÊ˚ŸÒ¨Ç‰~rìéJ’Ô"Î5kˆÆ“cxw˛Êï¢t—~°9Ò„‘8Í˜VÔL|Êã!@›”¿õ"«`«B2çÜj]â`ÂÌàÖÀè^ÜÄ9◊hH|á∞†˜zµæ√ÊÓ≈hZÌI\‰TÎw'™V°È~Ë<L€A=“î8’ómKÁ‚V°¡ºüo)ÇåÇ9IX¡F@°˘ F"„\‘RÎÕM;ƒ
—äIÂMg≠x»–h	˘[ß°-Ô‡R“h≤].Ïíâ≥kË/4k∞Åbc∂⁄¿öJG§xïõ,≠ï¶„ÊG9"¡</Æ≈|<â[GE•Ô(@zkÓ{,€GgH!94W	’çı4›€Uhi¥’¸M y—¶©…°‹Î–kùñu;u&K≥Aô≈™XÖ<±1œPS»ﬁÀ∂º©KÌC†ﬁ[§W3Vn”ñb«MUÚﬁK5∫T}πë¨J¡ﬂ^:*VÎ ≈®oUâRèEÆ‰!∆Ç€ ˆ√%Ìñvß^|·cÀu∂ÅÔf‡]©„ÒÇm˚di»RïZ èJ◊J%ıŸ*∏ﬂrNc8¨ZD¨ .Î*fLi¨o4¸0n“h∏ƒû»hà=
 ]uû◊P¬“€\ìçiùQés∑◊nz^†Ω˙ˇ€PÄáô∑,!…‹eÅ¢ñ^cÅ£Q®©YÂ?XIÚ∆ å∆>¡ø∆F]—M•ë‚<≥◊nÏÆ∂ﬁhÄòOÖ@ZÛH'Í(*‡…Éë˛›»¨oÇ°T†”ﬁ-õﬂO}Pr˛Â”f¿xÍª≥Ê⁄iµ®~˝˚odª∑ΩKé≥∑Ùû\úw»â/oÅ¸œÖå˜…NQ°Ná∆&/øQìù¬*c|Q6"œEî(æMãU òòº‚nZ•ƒâáÖ9|≈ˇı$≈DÄóûÚw∫]ò_]BßÓ:ó‘ÌGˇ  ˇˇ ¬?À