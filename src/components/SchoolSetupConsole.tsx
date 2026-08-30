import React, { useState, useEffect } from 'react';
import {
  School,
  Building2,
  Users,
  BookOpen,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Layers,
  MapPin,
  Flame,
  Star,
  Globe,
  Phone,
  Mail,
  UserCheck,
  UploadCloud,
  Image as ImageIcon,
  X,
  Camera,
  ArrowRight,
  ArrowLeft,
  Settings,
  ChevronRight,
  Search,
  Sliders,
  CheckSquare,
  Award,
  Compass,
  FileCheck
} from 'lucide-react';

// Interfaces for School setup
export interface SaaSBranch {
  id: string;
  name: string;
  code: string;
  address: string;
  manager: string;
  phone: string;
}

export interface SaaSStaff {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Branch Admin' | 'Accountant' | 'Teacher' | 'Store Manager';
  branchId: string;
  assignedClasses: string[];
}

export interface SaasGradeScale {
  grade: string;
  minScore: number;
  maxScore: number;
  gpa: number;
  remarks: string;
}

export interface SaasSchoolConfig {
  id: string;
  name: string;
  shortCode: string;
  slogan: string;
  logoType: 'shield' | 'book' | 'star' | 'cap' | 'globe' | 'lamp' | 'initials' | 'custom';
  customLogoUrl?: string;
  brandColor: 'indigo' | 'teal' | 'emerald' | 'rose' | 'amber' | 'purple' | 'sky';
  address: string;
  phone: string;
  email: string;
  website: string;
  // Sections enabled
  sectionsEnabled: {
    nursery: boolean;
    primary: boolean;
    secondary: boolean;
    islamia: boolean;
  };
  // Setup Lists
  branches: SaaSBranch[];
  classes: string[];
  staff: SaaSStaff[];
  subjects: { name: string; level: 'nursery' | 'primary' | 'secondary' | 'islamia'; isCompulsory: boolean }[];
  // Exam parameters
  caWeight: number; // e.g., 40
  examWeight: number; // e.g., 60
  passingScore: number; // e.g., 40
  gradeScales: SaasGradeScale[];
}

interface SchoolSetupConsoleProps {
  onActivateSchool: (school: SaasSchoolConfig) => void;
  onSeedDemoData: (school: SaasSchoolConfig) => void;
  activeSchoolId: string;
}

// Preset Schools Available Out-of-the-box
export const PRESET_SCHOOLS: SaasSchoolConfig[] = [
  {
    id: "sams-default",
    name: "Sokoto Academic Model School (SAMS)",
    shortCode: "SAMS",
    slogan: "Knowledge, Discipline & Spiritual Excellence",
    logoType: "shield",
    brandColor: "indigo",
    address: "12 Gawun Nama Road, Sokoto, Sokoto State, Nigeria",
    phone: "+234 803 123 4567",
    email: "info@sams-edu.ng",
    website: "https://sams-edu.ng",
    sectionsEnabled: { nursery: true, primary: true, secondary: true, islamia: true },
    branches: [
      { id: "br-gn", name: "Gawun Nama Campus", code: "GN", address: "Gawun Nama Road, Sokoto", manager: "Aminu Bello", phone: "+234 803 000 1111" },
      { id: "br-rs", name: "Runjin Sambo Campus", code: "RS", address: "Runjin Sambo West, Sokoto", manager: "Fatima Yusuf", phone: "+234 803 000 2222" }
    ],
    classes: ["Nursery 1", "Nursery 2", "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "Secondary 1", "Secondary 2", "Secondary 3"],
    staff: [
      { id: "st-1", name: "Aminu Bello", email: "aminu.bello@sams.edu.ng", role: "Super Admin", branchId: "br-gn", assignedClasses: [] },
      { id: "st-2", name: "Fatima Yusuf", email: "fatima.yusuf@sams.edu.ng", role: "Branch Admin", branchId: "br-rs", assignedClasses: [] },
      { id: "st-3", name: "Ibrahim Mukhtar", email: "ibrahim@sams.edu.ng", role: "Teacher", branchId: "br-gn", assignedClasses: ["Primary 1", "Primary 2"] },
      { id: "st-4", name: "Zainab Aliyu", email: "zainab@sams.edu.ng", role: "Accountant", branchId: "br-gn", assignedClasses: [] }
    ],
    subjects: [
      { name: "Mathematics", level: "primary", isCompulsory: true },
      { name: "English Language", level: "primary", isCompulsory: true },
      { name: "Basic Science", level: "primary", isCompulsory: true },
      { name: "Islamic Studies", level: "islamia", isCompulsory: true },
      { name: "Arabic", level: "islamia", isCompulsory: true },
      { name: "Civic Education", level: "secondary", isCompulsory: true },
      { name: "Computer Science", level: "secondary", isCompulsory: true }
    ],
    caWeight: 40,
    examWeight: 60,
    passingScore: 40,
    gradeScales: [
      { grade: "A", minScore: 75, maxScore: 100, gpa: 4.0, remarks: "Excellent" },
      { grade: "B", minScore: 65, maxScore: 74, gpa: 3.0, remarks: "Very Good" },
      { grade: "C", minScore: 50, maxScore: 64, gpa: 2.0, remarks: "Credit" },
      { grade: "D", minScore: 45, maxScore: 49, gpa: 1.5, remarks: "Pass" },
      { grade: "E", minScore: 40, maxScore: 44, gpa: 1.0, remarks: "Weak Pass" },
      { grade: "F", minScore: 0, maxScore: 39, gpa: 0.0, remarks: "Fail" }
    ]
  },
  {
    id: "tenant-excel",
    name: "Excel Beacon International School",
    shortCode: "EBIS",
    slogan: "Nurturing Talents, Releasing Champions",
    logoType: "star",
    brandColor: "teal",
    address: "Block 4, Shehu Kangiwa Secretariat Way, Sokoto",
    phone: "+234 812 345 6789",
    email: "admissions@excelbeacon.com",
    website: "https://excelbeacon.com",
    sectionsEnabled: { nursery: true, primary: true, secondary: false, islamia: false },
    branches: [
      { id: "eb-main", name: "Excel Main Academy", code: "EMA", address: "Kangiwa Way, Sokoto", manager: "Dr. Aliyu Shehu", phone: "+234 812 000 1111" }
    ],
    classes: ["Nursery 1", "Nursery 2", "Primary 1", "Primary 2", "Primary 3", "Primary 4"],
    staff: [
      { id: "ebst-1", name: "Dr. Aliyu Shehu", email: "principal@excelbeacon.com", role: "Super Admin", branchId: "eb-main", assignedClasses: [] },
      { id: "ebst-2", name: "Mary Johnson", email: "mary@excelbeacon.com", role: "Teacher", branchId: "eb-main", assignedClasses: ["Nursery 1"] }
    ],
    subjects: [
      { name: "Literacy Skills", level: "nursery", isCompulsory: true },
      { name: "Numeracy", level: "nursery", isCompulsory: true },
      { name: "Quantitative Reasoning", level: "primary", isCompulsory: true },
      { name: "Verbal Reasoning", level: "primary", isCompulsory: true }
    ],
    caWeight: 30,
    examWeight: 70,
    passingScore: 50,
    gradeScales: [
      { grade: "Distinction", minScore: 80, maxScore: 100, gpa: 4.0, remarks: "Outstanding achievement" },
      { grade: "Merit", minScore: 60, maxScore: 79, gpa: 3.0, remarks: "Highly Satisfactory" },
      { grade: "Pass", minScore: 50, maxScore: 59, gpa: 2.0, remarks: "Satisfactory progress" },
      { grade: "Fail", minScore: 0, maxScore: 49, gpa: 0.0, remarks: "Needs improvement" }
    ]
  },
  {
    id: "tenant-sultan",
    name: "Sultan Science & Technology College",
    shortCode: "SSTC",
    slogan: "Innovation, Integrity and National Pride",
    logoType: "globe",
    brandColor: "emerald",
    address: "Airport Road, Gidan Dare Area, Sokoto",
    phone: "+234 905 987 6543",
    email: "contact@sultanscience.edu.ng",
    website: "https://sultanscience.edu.ng",
    sectionsEnabled: { nursery: false, primary: false, secondary: true, islamia: true },
    branches: [
      { id: "sst-main", name: "Science Hub Campus", code: "SHC", address: "Airport Road, Sokoto", manager: "Engr. Kabir Musa", phone: "+234 905 000 1111" }
    ],
    classes: ["Secondary 1", "Secondary 2", "Secondary 3"],
    staff: [
      { id: "sstst-1", name: "Engr. Kabir Musa", email: "kabir.musa@sultanscience.edu.ng", role: "Super Admin", branchId: "sst-main", assignedClasses: [] },
      { id: "sstst-2", name: "Mal. Bashir Bello", email: "bashir@sultanscience.edu.ng", role: "Teacher", branchId: "sst-main", assignedClasses: ["Secondary 2"] }
    ],
    subjects: [
      { name: "Physics", level: "secondary", isCompulsory: true },
      { name: "Chemistry", level: "secondary", isCompulsory: true },
      { name: "Biology", level: "secondary", isCompulsory: true },
      { name: "Further Mathematics", level: "secondary", isCompulsory: false },
      { name: "Computer Coding", level: "secondary", isCompulsory: true },
      { name: "Islamic History", level: "islamia", isCompulsory: true }
    ],
    caWeight: 50,
    examWeight: 50,
    passingScore: 45,
    gradeScales: [
      { grade: "A1", minScore: 80, maxScore: 100, gpa: 4.0, remarks: "Distinction" },
      { grade: "B2", minScore: 70, maxScore: 79, gpa: 3.5, remarks: "Very Good" },
      { grade: "C4", minScore: 60, maxScore: 69, gpa: 3.0, remarks: "Credit" },
      { grade: "C6", minScore: 50, maxScore: 59, gpa: 2.5, remarks: "Credit Pass" },
      { grade: "D7", minScore: 45, maxScore: 49, gpa: 2.0, remarks: "Pass" },
      { grade: "F9", minScore: 0, maxScore: 44, gpa: 0.0, remarks: "Fail" }
    ]
  }
];

export default function SchoolSetupConsole({
  onActivateSchool,
  onSeedDemoData,
  activeSchoolId
}: SchoolSetupConsoleProps) {
  // Load saved tenants from localStorage or fallback to defaults
  const [schools, setSchools] = useState<SaasSchoolConfig[]>(() => {
    try {
      const saved = localStorage.getItem('sams_saas_schools');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return PRESET_SCHOOLS;
  });

  // Active School currently being edited
  const [editingSchoolId, setEditingSchoolId] = useState<string>(activeSchoolId || PRESET_SCHOOLS[0].id);
  
  // Simplified Navigation Tabs: 'wizard' (Step-by-step) | 'profile' | 'branches_classes' | 'staff' | 'academics_grading' | 'tenants'
  const [activeTab, setActiveTab] = useState<'wizard' | 'profile' | 'branches_classes' | 'staff' | 'academics_grading' | 'tenants'>('profile');
  
  // Setup Wizard step: 1 = Identity & Brand, 2 = Campuses & Classes, 3 = Academics & Grading
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Quick form states for adding items
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolSlogan, setNewSchoolSlogan] = useState('');
  const [newSchoolShort, setNewSchoolShort] = useState('');
  const [newSchoolColor, setNewSchoolColor] = useState<SaasSchoolConfig['brandColor']>('indigo');
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);

  // Branch inline add
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchManager, setNewBranchManager] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');

  // Class inline add
  const [newClassName, setNewClassName] = useState('');

  // Subject inline add
  const [subName, setSubName] = useState('');
  const [subLvl, setSubLvl] = useState<'nursery' | 'primary' | 'secondary' | 'islamia'>('primary');
  const [subComp, setSubComp] = useState(true);
  const [subjectSearch, setSubjectSearch] = useState('');

  // Staff inline add
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<SaaSStaff['role']>('Teacher');
  const [staffBranch, setStaffBranch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');

  // Toast / notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Active editing school object
  const school = schools.find(s => s.id === editingSchoolId) || schools[0];

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('sams_saas_schools', JSON.stringify(schools));
  }, [schools]);

  // Helper to save current edited school changes
  const updateSchoolConfig = (updated: SaasSchoolConfig) => {
    const newSchools = schools.map(s => s.id === updated.id ? updated : s);
    setSchools(newSchools);
    if (updated.id === activeSchoolId) {
      onActivateSchool(updated);
    }
  };

  // Calculate completeness percentage
  const calculateCompleteness = (s: SaasSchoolConfig) => {
    let score = 0;
    if (s.name && s.shortCode) score += 20;
    if (s.address && s.phone) score += 15;
    if (s.branches && s.branches.length > 0) score += 20;
    if (s.classes && s.classes.length > 0) score += 15;
    if (s.staff && s.staff.length > 0) score += 15;
    if (s.subjects && s.subjects.length > 0) score += 15;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness(school);

  // Color mappings
  const getColorClasses = (c: SaasSchoolConfig['brandColor']) => {
    switch(c) {
      case 'indigo': return { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', hover: 'hover:bg-indigo-700', ring: 'focus:ring-indigo-500', pill: 'bg-indigo-50 border-indigo-100 text-indigo-700' };
      case 'teal': return { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-600', hover: 'hover:bg-teal-700', ring: 'focus:ring-teal-500', pill: 'bg-teal-50 border-teal-100 text-teal-700' };
      case 'emerald': return { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', hover: 'hover:bg-emerald-700', ring: 'focus:ring-emerald-500', pill: 'bg-emerald-50 border-emerald-100 text-emerald-700' };
      case 'rose': return { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', hover: 'hover:bg-rose-700', ring: 'focus:ring-rose-500', pill: 'bg-rose-50 border-rose-100 text-rose-700' };
      case 'amber': return { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600', hover: 'hover:bg-amber-700', ring: 'focus:ring-amber-500', pill: 'bg-amber-50 border-amber-100 text-amber-700' };
      case 'purple': return { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', hover: 'hover:bg-purple-700', ring: 'focus:ring-purple-500', pill: 'bg-purple-50 border-purple-100 text-purple-700' };
      case 'sky': return { bg: 'bg-sky-600', text: 'text-sky-600', border: 'border-sky-600', hover: 'hover:bg-sky-700', ring: 'focus:ring-sky-500', pill: 'bg-sky-50 border-sky-100 text-sky-700' };
    }
  };

  const currentTheme = getColorClasses(school?.brandColor || 'indigo');

  // Render logo icon preview
  const renderLogoIcon = (type: SaasSchoolConfig['logoType'], size = "w-6 h-6", customUrl?: string) => {
    if (type === 'custom' && customUrl) {
      return <img src={customUrl} alt="Logo" className={`${size} object-contain rounded`} />;
    }
    switch (type) {
      case 'shield': return <ShieldCheck className={size} />;
      case 'book': return <BookOpen className={size} />;
      case 'star': return <Star className={size} />;
      case 'cap': return <Award className={size} />;
      case 'globe': return <Globe className={size} />;
      case 'lamp': return <Sparkles className={size} />;
      default: return <span className="font-black text-xs">{school.shortCode || 'SCH'}</span>;
    }
  };

  // Add new branch handler
  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchCode.trim()) return;
    const newBr: SaaSBranch = {
      id: 'br-' + Date.now(),
      name: newBranchName.trim(),
      code: newBranchCode.trim().toUpperCase(),
      address: newBranchAddress.trim() || school.address,
      manager: newBranchManager.trim() || 'Branch Administrator',
      phone: newBranchPhone.trim() || school.phone
    };
    updateSchoolConfig({
      ...school,
      branches: [...school.branches, newBr]
    });
    setNewBranchName('');
    setNewBranchCode('');
    setNewBranchAddress('');
    setNewBranchManager('');
    setNewBranchPhone('');
    showToast("Branch campus added successfully!");
  };

  // Delete branch
  const handleDeleteBranch = (id: string) => {
    if (school.branches.length <= 1) {
      alert("A school must have at least one active campus branch.");
      return;
    }
    updateSchoolConfig({
      ...school,
      branches: school.branches.filter(b => b.id !== id)
    });
    showToast("Branch removed.");
  };

  // Add class cohort
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    if (school.classes.includes(newClassName.trim())) {
      alert("This class name already exists.");
      return;
    }
    updateSchoolConfig({
      ...school,
      classes: [...school.classes, newClassName.trim()]
    });
    setNewClassName('');
    showToast(`Added class: ${newClassName.trim()}`);
  };

  // Delete class cohort
  const handleDeleteClass = (cls: string) => {
    updateSchoolConfig({
      ...school,
      classes: school.classes.filter(c => c !== cls)
    });
  };

  // Quick class presets
  const handleAddClassPreset = (preset: 'nursery' | 'primary' | 'secondary') => {
    let toAdd: string[] = [];
    if (preset === 'nursery') toAdd = ['Nursery 1', 'Nursery 2', 'Nursery 3'];
    if (preset === 'primary') toAdd = ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
    if (preset === 'secondary') toAdd = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

    const combined = Array.from(new Set([...school.classes, ...toAdd]));
    updateSchoolConfig({
      ...school,
      classes: combined
    });
    showToast(`Added ${preset} class grade cohort pack.`);
  };

  // Add Subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    if (school.subjects.some(s => s.name.toLowerCase() === subName.trim().toLowerCase())) {
      alert("Subject already exists.");
      return;
    }
    updateSchoolConfig({
      ...school,
      subjects: [...school.subjects, { name: subName.trim(), level: subLvl, isCompulsory: subComp }]
    });
    setSubName('');
    showToast(`Added subject: ${subName.trim()}`);
  };

  // Delete Subject
  const handleDeleteSubject = (name: string) => {
    updateSchoolConfig({
      ...school,
      subjects: school.subjects.filter(s => s.name !== name)
    });
  };

  // Add Staff
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) return;
    const targetBranch = staffBranch || school.branches[0]?.id || '';
    const newSt: SaaSStaff = {
      id: 'st-' + Date.now(),
      name: staffName.trim(),
      email: staffEmail.trim().toLowerCase(),
      role: staffRole,
      branchId: targetBranch,
      assignedClasses: []
    };
    updateSchoolConfig({
      ...school,
      staff: [...school.staff, newSt]
    });
    setStaffName('');
    setStaffEmail('');
    showToast(`Added staff account for ${newSt.name}`);
  };

  // Delete Staff
  const handleDeleteStaff = (id: string) => {
    updateSchoolConfig({
      ...school,
      staff: school.staff.filter(s => s.id !== id)
    });
  };

  // Apply Grade Scale Preset
  const handleApplyGradePreset = (type: 'waec' | 'standard' | 'primary') => {
    let scales: SaasGradeScale[] = [];
    if (type === 'waec') {
      scales = [
        { grade: "A1", minScore: 75, maxScore: 100, gpa: 4.0, remarks: "Excellent" },
        { grade: "B2", minScore: 70, maxScore: 74, gpa: 3.5, remarks: "Very Good" },
        { grade: "B3", minScore: 65, maxScore: 69, gpa: 3.0, remarks: "Good" },
        { grade: "C4", minScore: 60, maxScore: 64, gpa: 2.5, remarks: "Credit" },
        { grade: "C5", minScore: 55, maxScore: 59, gpa: 2.0, remarks: "Credit" },
        { grade: "C6", minScore: 50, maxScore: 54, gpa: 1.5, remarks: "Credit Pass" },
        { grade: "D7", minScore: 45, maxScore: 49, gpa: 1.0, remarks: "Pass" },
        { grade: "E8", minScore: 40, maxScore: 44, gpa: 0.5, remarks: "Pass" },
        { grade: "F9", minScore: 0, maxScore: 39, gpa: 0.0, remarks: "Fail" }
      ];
    } else if (type === 'primary') {
      scales = [
        { grade: "Distinction", minScore: 80, maxScore: 100, gpa: 4.0, remarks: "Outstanding" },
        { grade: "Merit", minScore: 60, maxScore: 79, gpa: 3.0, remarks: "Very Good" },
        { grade: "Pass", minScore: 50, maxScore: 59, gpa: 2.0, remarks: "Satisfactory" },
        { grade: "Fail", minScore: 0, maxScore: 49, gpa: 0.0, remarks: "Needs Attention" }
      ];
    } else {
      scales = [
        { grade: "A", minScore: 75, maxScore: 100, gpa: 4.0, remarks: "Excellent" },
        { grade: "B", minScore: 65, maxScore: 74, gpa: 3.0, remarks: "Very Good" },
        { grade: "C", minScore: 50, maxScore: 64, gpa: 2.0, remarks: "Credit" },
        { grade: "D", minScore: 45, maxScore: 49, gpa: 1.5, remarks: "Pass" },
        { grade: "E", minScore: 40, maxScore: 44, gpa: 1.0, remarks: "Weak Pass" },
        { grade: "F", minScore: 0, maxScore: 39, gpa: 0.0, remarks: "Fail" }
      ];
    }

    updateSchoolConfig({
      ...school,
      gradeScales: scales
    });
    showToast(`Applied ${type.toUpperCase()} grading template.`);
  };

  // Create new tenant school
  const handleAddNewSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim() || !newSchoolShort.trim()) {
      alert("Please provide at least a School Name and Short Abbreviation.");
      return;
    }

    const newConfig: SaasSchoolConfig = {
      id: 'tenant-' + Date.now(),
      name: newSchoolName.trim(),
      shortCode: newSchoolShort.trim().toUpperCase(),
      slogan: newSchoolSlogan.trim() || "Knowledge, Discipline & Excellence",
      logoType: 'shield',
      brandColor: newSchoolColor,
      address: "Campus Headquarters, Sokoto",
      phone: "+234 800 000 0000",
      email: `admin@${newSchoolShort.toLowerCase().replace(/\s+/g, '')}.edu.ng`,
      website: `www.${newSchoolShort.toLowerCase().replace(/\s+/g, '')}.edu.ng`,
      sectionsEnabled: { nursery: true, primary: true, secondary: true, islamia: true },
      branches: [
        { id: 'br-' + Date.now(), name: "Main Campus", code: "MAIN", address: "Main Campus, Sokoto", manager: "Administrator", phone: "+234 800 111 2222" }
      ],
      classes: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"],
      staff: [
        { id: 'st-' + Date.now(), name: "System Administrator", email: `superadmin@${newSchoolShort.toLowerCase()}.edu.ng`, role: "Super Admin", branchId: 'br-' + Date.now(), assignedClasses: [] }
      ],
      subjects: [
        { name: "Mathematics", level: "primary", isCompulsory: true },
        { name: "English Language", level: "primary", isCompulsory: true },
        { name: "Basic Science", level: "primary", isCompulsory: true },
        { name: "Islamic Studies", level: "islamia", isCompulsory: true }
      ],
      caWeight: 40,
      examWeight: 60,
      passingScore: 40,
      gradeScales: [
        { grade: "A", minScore: 75, maxScore: 100, gpa: 4.0, remarks: "Excellent" },
        { grade: "B", minScore: 65, maxScore: 74, gpa: 3.0, remarks: "Very Good" },
        { grade: "C", minScore: 50, maxScore: 64, gpa: 2.0, remarks: "Credit" },
        { grade: "D", minScore: 45, maxScore: 49, gpa: 1.5, remarks: "Pass" },
        { grade: "F", minScore: 0, maxScore: 44, gpa: 0.0, remarks: "Fail" }
      ]
    };

    setSchools([...schools, newConfig]);
    setEditingSchoolId(newConfig.id);
    setShowAddSchoolModal(false);
    setNewSchoolName('');
    setNewSchoolShort('');
    setNewSchoolSlogan('');
    showToast(`New school workspace created: ${newConfig.name}`);
  };

  // Export JSON configuration
  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(school, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${school.shortCode.toLowerCase()}-config.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("School configuration exported as JSON.");
  };

  return (
    <div id="school-setup-console" className="space-y-6 max-w-7xl mx-auto">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Active School Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Active School Identity */}
          <div className="flex items-center gap-3.5">
            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 ${currentTheme.bg}`}>
              {renderLogoIcon(school.logoType, "w-7 h-7", school.customLogoUrl)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900">{school.name}</h1>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${currentTheme.pill}`}>
                  {school.shortCode}
                </span>
                {school.id === activeSchoolId && (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                    Active System
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{school.slogan}</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:self-end lg:self-center">
            {/* Quick School Switcher */}
            <select
              value={editingSchoolId}
              onChange={(e) => setEditingSchoolId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {schools.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.shortCode}) {s.id === activeSchoolId ? '★ Active' : ''}
                </option>
              ))}
            </select>

            {school.id !== activeSchoolId && (
              <button
                onClick={() => {
                  onActivateSchool(school);
                  showToast(`Activated ${school.name} as primary school.`);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Activate School</span>
              </button>
            )}

            <button
              onClick={() => onSeedDemoData(school)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Populate test classes, teachers, and subjects into database"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Seed Data</span>
            </button>

            <button
              onClick={handleExportConfig}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Download School Setup JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowAddSchoolModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New School</span>
            </button>
          </div>
        </div>

        {/* Completeness Progress Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Setup Readiness:</span>
            <span className={`font-bold ${completeness >= 80 ? 'text-emerald-600' : completeness >= 50 ? 'text-amber-600' : 'text-slate-600'}`}>
              {completeness}% Configured
            </span>
          </div>
          <div className="w-full sm:w-64 bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${completeness >= 80 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-200/80">
        <button
          onClick={() => setActiveTab('wizard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'wizard' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>3-Step Quick Setup Wizard</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <School className="w-4 h-4" />
          <span>School Profile &amp; Brand</span>
        </button>

        <button
          onClick={() => setActiveTab('branches_classes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'branches_classes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Campuses &amp; Classes ({school.branches.length}/{school.classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Accounts ({school.staff.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('academics_grading')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'academics_grading' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects &amp; Grading</span>
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ml-auto ${
            activeTab === 'tenants' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>All School Profiles ({schools.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: 3-STEP QUICK SETUP WIZARD
          ========================================================================= */}
      {activeTab === 'wizard' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          {/* Step Indicator Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 pb-5">
            <button
              onClick={() => setWizardStep(1)}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                wizardStep === 1 ? 'bg-indigo-50 border border-indigo-200 text-indigo-900' : 'bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${wizardStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                1
              </div>
              <div>
                <p className="text-xs font-bold">Step 1: Identity</p>
                <p className="text-[11px] text-slate-500">Name, Logo &amp; Theme</p>
              </div>
            </button>

            <button
              onClick={() => setWizardStep(2)}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                wizardStep === 2 ? 'bg-indigo-50 border border-indigo-200 text-indigo-900' : 'bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${wizardStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                2
              </div>
              <div>
                <p className="text-xs font-bold">Step 2: Campuses</p>
                <p className="text-[11px] text-slate-500">Branches &amp; Grade Cohorts</p>
              </div>
            </button>

            <button
              onClick={() => setWizardStep(3)}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                wizardStep === 3 ? 'bg-indigo-50 border border-indigo-200 text-indigo-900' : 'bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${wizardStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                3
              </div>
              <div>
                <p className="text-xs font-bold">Step 3: Academics</p>
                <p className="text-[11px] text-slate-500">Subjects &amp; Grade Scales</p>
              </div>
            </button>
          </div>

          {/* Wizard Step 1: Identity & Brand */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 1: School Identity &amp; Branding</h3>
                <p className="text-xs text-slate-500">Define the official institution name, motto, theme colors, and active educational levels.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Official School Name *</label>
                  <input
                    type="text"
                    value={school.name}
                    onChange={(e) => updateSchoolConfig({ ...school, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="e.g. SOKOTO ACADEMIC MODEL SCHOOL"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Short Code / Abbreviation *</label>
                  <input
                    type="text"
                    value={school.shortCode}
                    onChange={(e) => updateSchoolConfig({ ...school, shortCode: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="e.g. SAMS"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">School Motto / Slogan</label>
                  <input
                    type="text"
                    value={school.slogan}
                    onChange={(e) => updateSchoolConfig({ ...school, slogan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="e.g. Knowledge, Discipline & Excellence"
                  />
                </div>

                {/* Brand Color Picker */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Primary Brand Theme</label>
                  <div className="flex items-center gap-2">
                    {(['indigo', 'teal', 'emerald', 'rose', 'amber', 'purple', 'sky'] as const).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateSchoolConfig({ ...school, brandColor: color })}
                        className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                          color === 'indigo' ? 'bg-indigo-600' :
                          color === 'teal' ? 'bg-teal-600' :
                          color === 'emerald' ? 'bg-emerald-600' :
                          color === 'rose' ? 'bg-rose-600' :
                          color === 'amber' ? 'bg-amber-600' :
                          color === 'purple' ? 'bg-purple-600' : 'bg-sky-600'
                        } ${school.brandColor === color ? 'ring-2 ring-offset-2 ring-slate-900 border-white' : 'border-transparent opacity-80 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Logo Type Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">School Badge Icon</label>
                  <div className="flex items-center gap-2">
                    {(['shield', 'book', 'star', 'cap', 'globe', 'lamp'] as const).map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => updateSchoolConfig({ ...school, logoType: icon })}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                          school.logoType === icon ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {renderLogoIcon(icon, "w-4 h-4")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Education Stages */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Active Education Stages</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'nursery', label: 'Nursery / Pre-School' },
                    { key: 'primary', label: 'Primary School' },
                    { key: 'secondary', label: 'Secondary / High' },
                    { key: 'islamia', label: 'Islamia & Tahfeez' }
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={school.sectionsEnabled[item.key as keyof typeof school.sectionsEnabled]}
                        onChange={(e) => updateSchoolConfig({
                          ...school,
                          sectionsEnabled: {
                            ...school.sectionsEnabled,
                            [item.key]: e.target.checked
                          }
                        })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setWizardStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <span>Continue to Campuses &amp; Classes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Wizard Step 2: Campuses & Classes */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 2: Campus Branches &amp; Class Grade Cohorts</h3>
                <p className="text-xs text-slate-500">Configure physical school locations and grade cohorts.</p>
              </div>

              {/* Branches summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Campus Branches ({school.branches.length})</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {school.branches.map(br => (
                    <div key={br.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{br.name}</span>
                          <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-mono">{br.code}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{br.address}</p>
                        <p className="text-[11px] text-slate-600 font-semibold mt-0.5">Manager: {br.manager} • {br.phone}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteBranch(br.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-all cursor-pointer"
                        title="Remove branch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Class cohorts summary */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Class Grade Cohorts ({school.classes.length})</h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAddClassPreset('nursery')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg"
                    >
                      + Nursery Pack
                    </button>
                    <button
                      onClick={() => handleAddClassPreset('primary')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg"
                    >
                      + Primary Pack
                    </button>
                    <button
                      onClick={() => handleAddClassPreset('secondary')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg"
                    >
                      + Secondary Pack
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {school.classes.map(cls => (
                    <span key={cls} className="bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                      <span>{cls}</span>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddClass} className="flex gap-2">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Add custom class (e.g. Grade 1 Gold)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Add Class
                  </button>
                </form>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setWizardStep(1)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <span>Continue to Academics &amp; Grading</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Wizard Step 3: Academics & Grading */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 3: Curriculum Subjects &amp; Grading System</h3>
                <p className="text-xs text-slate-500">Configure CA vs Exam weight splits and grade scale benchmarks.</p>
              </div>

              {/* CA vs Exam Weight Slider */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Continuous Assessment (CA): {school.caWeight}%</span>
                  <span>Terminal Examination: {school.examWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={school.caWeight}
                  onChange={(e) => {
                    const ca = Number(e.target.value);
                    updateSchoolConfig({
                      ...school,
                      caWeight: ca,
                      examWeight: 100 - ca
                    });
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Passing Benchmark Score: <strong>{school.passingScore}%</strong></span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateSchoolConfig({ ...school, caWeight: 40, examWeight: 60 })}
                      className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-indigo-600"
                    >
                      40/60 Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSchoolConfig({ ...school, caWeight: 30, examWeight: 70 })}
                      className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-indigo-600"
                    >
                      30/70 Split
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSchoolConfig({ ...school, caWeight: 50, examWeight: 50 })}
                      className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-indigo-600"
                    >
                      50/50 Equal
                    </button>
                  </div>
                </div>
              </div>

              {/* Grading Templates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Grading Scale Template</h4>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleApplyGradePreset('standard')}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                    >
                      Standard (A-F)
                    </button>
                    <button
                      onClick={() => handleApplyGradePreset('waec')}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                    >
                      WAEC (A1-F9)
                    </button>
                    <button
                      onClick={() => handleApplyGradePreset('primary')}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                    >
                      Early Years (Distinction/Pass)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {school.gradeScales.map(gs => (
                    <div key={gs.grade} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                      <span className="text-sm font-black text-indigo-600 block">{gs.grade}</span>
                      <span className="text-[11px] text-slate-600 font-semibold">{gs.minScore}% - {gs.maxScore}%</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{gs.remarks}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setWizardStep(2)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => {
                    onActivateSchool(school);
                    showToast(`Setup completed! ${school.name} is now active.`);
                    setActiveTab('profile');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Finish &amp; Save School Setup</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: SCHOOL PROFILE & BRAND
          ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Institution Identity &amp; Contact</h3>
              <p className="text-xs text-slate-500">Official name, registration code, address, and online contact info.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Official School Name *</label>
                <input
                  type="text"
                  value={school.name}
                  onChange={(e) => updateSchoolConfig({ ...school, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">School Short Code *</label>
                <input
                  type="text"
                  value={school.shortCode}
                  onChange={(e) => updateSchoolConfig({ ...school, shortCode: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Brand Theme Color</label>
                <select
                  value={school.brandColor}
                  onChange={(e) => updateSchoolConfig({ ...school, brandColor: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="indigo">Indigo Blue</option>
                  <option value="teal">Teal Cyan</option>
                  <option value="emerald">Emerald Green</option>
                  <option value="rose">Rose Red</option>
                  <option value="amber">Amber Gold</option>
                  <option value="purple">Royal Purple</option>
                  <option value="sky">Sky Blue</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Motto / Tagline</label>
                <input
                  type="text"
                  value={school.slogan}
                  onChange={(e) => updateSchoolConfig({ ...school, slogan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Headquarters Address</label>
                <input
                  type="text"
                  value={school.address}
                  onChange={(e) => updateSchoolConfig({ ...school, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Telephone Line</label>
                <input
                  type="text"
                  value={school.phone}
                  onChange={(e) => updateSchoolConfig({ ...school, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Official Email</label>
                <input
                  type="email"
                  value={school.email}
                  onChange={(e) => updateSchoolConfig({ ...school, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">School Web Address</label>
                <input
                  type="text"
                  value={school.website}
                  onChange={(e) => updateSchoolConfig({ ...school, website: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Visual Preview Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Brand Preview</h4>
              
              {/* Sample Student Badge Mock */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs ${currentTheme.bg}`}>
                    {renderLogoIcon(school.logoType, "w-5 h-5", school.customLogoUrl)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-tight">{school.name}</h5>
                    <p className="text-[10px] text-slate-500">{school.slogan}</p>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-[10px] text-slate-600 space-y-1">
                  <p><strong>Campus:</strong> {school.branches[0]?.name || 'Main Campus'}</p>
                  <p><strong>Phone:</strong> {school.phone}</p>
                  <p><strong>Portal:</strong> {school.website}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Select Logo Badge Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {(['shield', 'book', 'star', 'cap', 'globe', 'lamp'] as const).map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => updateSchoolConfig({ ...school, logoType: icon })}
                      className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        school.logoType === icon ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {renderLogoIcon(icon, "w-4 h-4")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CAMPUSES & CLASSES
          ========================================================================= */}
      {activeTab === 'branches_classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campuses / Branches Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Campus Branches ({school.branches.length})</h3>
                <p className="text-xs text-slate-500">School physical locations and administrators.</p>
              </div>
            </div>

            <div className="space-y-3">
              {school.branches.map(br => (
                <div key={br.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{br.name}</span>
                      <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">{br.code}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{br.address}</p>
                    <p className="text-[11px] text-slate-600 font-semibold mt-0.5">Manager: {br.manager} • {br.phone}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteBranch(br.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Inline Add Branch Form */}
            <form onSubmit={handleAddBranch} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800">Add New Campus Branch</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Branch Name (e.g. West Wing Campus)"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Code (e.g. WW)"
                  value={newBranchCode}
                  onChange={(e) => setNewBranchCode(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Manager / Principal"
                  value={newBranchManager}
                  onChange={(e) => setNewBranchManager(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Phone Contact"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg transition-all cursor-pointer"
              >
                + Register Branch
              </button>
            </form>
          </div>

          {/* Classes / Grade Levels Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Class Grade Cohorts ({school.classes.length})</h3>
                <p className="text-xs text-slate-500">Registered grade levels across school sections.</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleAddClassPreset('nursery')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md"
                >
                  + Nursery
                </button>
                <button
                  onClick={() => handleAddClassPreset('primary')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md"
                >
                  + Primary
                </button>
                <button
                  onClick={() => handleAddClassPreset('secondary')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md"
                >
                  + Secondary
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
              {school.classes.map(cls => (
                <span key={cls} className="bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span>{cls}</span>
                  <button
                    onClick={() => handleDeleteClass(cls)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Inline Add Class Form */}
            <form onSubmit={handleAddClass} className="flex gap-2">
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Class name (e.g. Primary 1 Gold)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Add Class
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: STAFF ACCOUNTS & ROLES
          ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Staff Accounts &amp; Key Personnel ({school.staff.length})</h3>
              <p className="text-xs text-slate-500">Manage user roles, branch locations, and teacher assignments.</p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search staff..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Campus Branch</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {school.staff
                  .filter(st => !staffSearch || st.name.toLowerCase().includes(staffSearch.toLowerCase()) || st.email.toLowerCase().includes(staffSearch.toLowerCase()))
                  .map(st => {
                    const branch = school.branches.find(b => b.id === st.branchId);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{st.name}</td>
                        <td className="p-3 text-slate-600 font-mono text-[11px]">{st.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                            st.role === 'Accountant' ? 'bg-emerald-100 text-emerald-700' :
                            st.role === 'Branch Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {st.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{branch?.name || 'All Campuses'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteStaff(st.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Inline Add Staff Form */}
          <form onSubmit={handleAddStaff} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Add Staff Account</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none"
              />
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="Teacher">Teacher</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Branch Admin">Branch Admin</option>
                <option value="Accountant">Accountant</option>
                <option value="Store Manager">Store Manager</option>
              </select>
              <select
                value={staffBranch}
                onChange={(e) => setStaffBranch(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none cursor-pointer"
              >
                {school.branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
            >
              + Register Staff Member
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 5: SUBJECTS & GRADING
          ========================================================================= */}
      {activeTab === 'academics_grading' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subjects Directory */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Curriculum Subjects ({school.subjects.length})</h3>
                <p className="text-xs text-slate-500">Mapped academic disciplines by school tier.</p>
              </div>
              <input
                type="text"
                placeholder="Filter subjects..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold focus:bg-white outline-none"
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {school.subjects
                .filter(s => !subjectSearch || s.name.toLowerCase().includes(subjectSearch.toLowerCase()))
                .map(s => (
                  <div key={s.name} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded text-[10px] uppercase font-bold">
                        {s.level}
                      </span>
                      {s.isCompulsory && (
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded text-[10px] font-bold">
                          Core
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteSubject(s.name)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>

            {/* Inline Add Subject Form */}
            <form onSubmit={handleAddSubject} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-800">Add Academic Subject</h4>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Subject name"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="col-span-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-indigo-500 outline-none"
                />
                <select
                  value={subLvl}
                  onChange={(e) => setSubLvl(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold cursor-pointer"
                >
                  <option value="nursery">Nursery</option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="islamia">Islamia</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-1.5 rounded-lg transition-all cursor-pointer"
              >
                + Register Subject
              </button>
            </form>
          </div>

          {/* Assessment & Grading Scale */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grading System &amp; CA Weights</h3>
              <p className="text-xs text-slate-500">Assessment distribution and letter grade bands.</p>
            </div>

            {/* CA vs Exam Weight Slider */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Continuous Assessment: {school.caWeight}%</span>
                <span>Examination: {school.examWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={school.caWeight}
                onChange={(e) => {
                  const ca = Number(e.target.value);
                  updateSchoolConfig({
                    ...school,
                    caWeight: ca,
                    examWeight: 100 - ca
                  });
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Passing Score: <strong>{school.passingScore}%</strong></span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateSchoolConfig({ ...school, caWeight: 40, examWeight: 60 })}
                    className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-indigo-600"
                  >
                    40/60
                  </button>
                  <button
                    onClick={() => updateSchoolConfig({ ...school, caWeight: 30, examWeight: 70 })}
                    className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-indigo-600"
                  >
                    30/70
                  </button>
                </div>
              </div>
            </div>

            {/* Grading Scale Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">Grade Letter Boundaries</h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleApplyGradePreset('standard')}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded"
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => handleApplyGradePreset('waec')}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded"
                  >
                    WAEC
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {school.gradeScales.map(gs => (
                  <div key={gs.grade} className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                    <span className="text-sm font-black text-indigo-600 block">{gs.grade}</span>
                    <span className="text-[11px] font-semibold text-slate-700">{gs.minScore}% - {gs.maxScore}%</span>
                    <span className="text-[10px] text-slate-400 block">{gs.remarks}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: ALL SCHOOL PROFILES (MULTI-TENANT DIRECTORY)
          ========================================================================= */}
      {activeTab === 'tenants' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registered School Profiles ({schools.length})</h3>
              <p className="text-xs text-slate-500">Switch or manage institutional tenant configurations.</p>
            </div>
            <button
              onClick={() => setShowAddSchoolModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create School Profile</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schools.map(s => {
              const theme = getColorClasses(s.brandColor);
              const isActive = s.id === activeSchoolId;
              const isEditing = s.id === editingSchoolId;

              return (
                <div
                  key={s.id}
                  className={`rounded-2xl border p-5 space-y-4 transition-all ${
                    isActive ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/10' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs ${theme.bg}`}>
                      {renderLogoIcon(s.logoType, "w-5 h-5", s.customLogoUrl)}
                    </div>
                    {isActive ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        ★ Active System
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onActivateSchool(s);
                          showToast(`Activated ${s.name}`);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-bold cursor-pointer"
                      >
                        Activate
                      </button>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{s.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{s.slogan}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                    <p><strong>Branches:</strong> {s.branches.length} campuses</p>
                    <p><strong>Classes:</strong> {s.classes.length} grade levels</p>
                    <p><strong>Staff:</strong> {s.staff.length} accounts</p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setEditingSchoolId(s.id);
                        setActiveTab('profile');
                        showToast(`Editing ${s.name}`);
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-1.5 rounded-lg text-center cursor-pointer transition-all"
                    >
                      Edit Config
                    </button>
                    <button
                      onClick={() => onSeedDemoData(s)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                      title="Seed Demo Database"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW SCHOOL PROFILE
          ========================================================================= */}
      {showAddSchoolModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create New School Profile</h3>
              <button
                onClick={() => setShowAddSchoolModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewSchool} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOKOTO ACADEMIC MODEL SCHOOL"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Short Code / Tag *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAMS"
                  value={newSchoolShort}
                  onChange={(e) => setNewSchoolShort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motto / Slogan</label>
                <input
                  type="text"
                  placeholder="e.g. Knowledge, Discipline & Excellence"
                  value={newSchoolSlogan}
                  onChange={(e) => setNewSchoolSlogan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Brand Theme</label>
                <select
                  value={newSchoolColor}
                  onChange={(e) => setNewSchoolColor(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
                >
                  <option value="indigo">Indigo Blue</option>
                  <option value="teal">Teal Cyan</option>
                  <option value="emerald">Emerald Green</option>
                  <option value="rose">Rose Red</option>
                  <option value="amber">Amber Gold</option>
                  <option value="purple">Royal Purple</option>
                  <option value="sky">Sky Blue</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSchoolModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
