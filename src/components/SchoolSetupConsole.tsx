import React, { useState, useEffect } from 'react';
import {
  School,
  Building2,
  Sliders,
  Users,
  BookOpen,
  Trophy,
  Award,
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
  FileSpreadsheet,
  Globe,
  Phone,
  Mail,
  UserCheck
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
  logoType: 'shield' | 'book' | 'star' | 'cap' | 'globe' | 'lamp' | 'initials';
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

// Preset Preset Schools for SaaS Demos
const PRESET_SCHOOLS: SaasSchoolConfig[] = [
  {
    id: "tenant-sams",
    name: "Sokoto Academic Management Group",
    shortCode: "SAMS",
    slogan: "Nursery, Primary & Secondary Division Academic Portal",
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
  // SaaS Clients State
  const [schools, setSchools] = useState<SaasSchoolConfig[]>(() => {
    const saved = localStorage.getItem('sams_saas_schools');
    return saved ? JSON.parse(saved) : PRESET_SCHOOLS;
  });

  // Active School currently being edited (can be activeSchoolId or a new workspace)
  const [editingSchoolId, setEditingSchoolId] = useState<string>(activeSchoolId || PRESET_SCHOOLS[0].id);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'clients' | 'details' | 'branches' | 'classes' | 'staff' | 'subjects' | 'grading'>('clients');

  // Form states for creating a new tenant school
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolSlogan, setNewSchoolSlogan] = useState('');
  const [newSchoolShort, setNewSchoolShort] = useState('');
  const [newSchoolColor, setNewSchoolColor] = useState<SaasSchoolConfig['brandColor']>('indigo');

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
    // If it is the currently activated app-wide school, propagate changes
    if (updated.id === activeSchoolId) {
      onActivateSchool(updated);
    }
  };

  // Create a new empty school profile
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
      slogan: newSchoolSlogan.trim() || "Empowering the Next Generation",
      logoType: 'shield',
      brandColor: newSchoolColor,
      address: "100 Innovation Way, Sokoto",
      phone: "+234 800 000 0000",
      email: `admin@${newSchoolShort.toLowerCase().replace(/\s+/g, '')}.edu.ng`,
      website: `www.${newSchoolShort.toLowerCase().replace(/\s+/g, '')}.edu.ng`,
      sectionsEnabled: { nursery: true, primary: true, secondary: true, islamia: true },
      branches: [
        { id: 'br-' + Date.now(), name: "Main Campus", code: "MAIN", address: "Campus Headquarters, Sokoto", manager: "Administrator", phone: "+234 800 111 2222" }
      ],
      classes: ["Grade 1", "Grade 2", "Grade 3"],
      staff: [
        { id: 'st-' + Date.now(), name: "System Administrator", email: `superadmin@${newSchoolShort.toLowerCase()}.edu.ng`, role: "Super Admin", branchId: 'br-' + Date.now(), assignedClasses: [] }
      ],
      subjects: [
        { name: "Mathematics", level: "primary", isCompulsory: true },
        { name: "English", level: "primary", isCompulsory: true }
      ],
      caWeight: 40,
      examWeight: 60,
      passingScore: 40,
      gradeScales: [
        { grade: "A", minScore: 75, maxScore: 100, gpa: 4.0, remarks: "Excellent" },
        { grade: "B", minScore: 60, maxScore: 74, gpa: 3.0, remarks: "Good" },
        { grade: "C", minScore: 50, maxScore: 59, gpa: 2.0, remarks: "Average" },
        { grade: "F", minScore: 0, maxScore: 49, gpa: 0.0, remarks: "Fail" }
      ]
    };

    const updatedSchools = [...schools, newConfig];
    setSchools(updatedSchools);
    setEditingSchoolId(newConfig.id);
    setNewSchoolName('');
    setNewSchoolSlogan('');
    setNewSchoolShort('');
    setActiveConsoleTab('details');
    alert(`🎉 Successfully created "${newConfig.name}"! Now let's configure its specific settings.`);
  };

  // Branch CRUD State Helpers
  const [bName, setBName] = useState('');
  const [bCode, setBCode] = useState('');
  const [bAddr, setBAddr] = useState('');
  const [bMgr, setBMgr] = useState('');
  const [bPhone, setBPhone] = useState('');

  const handleAddBranch = () => {
    if (!bName || !bCode) {
      alert("Branch Name and Branch Code are required!");
      return;
    }
    const nb: SaaSBranch = {
      id: 'br-' + Date.now(),
      name: bName,
      code: bCode.toUpperCase(),
      address: bAddr || "Sokoto, Nigeria",
      manager: bMgr || "Unassigned",
      phone: bPhone || ""
    };
    updateSchoolConfig({
      ...school,
      branches: [...school.branches, nb]
    });
    setBName(''); setBCode(''); setBAddr(''); setBMgr(''); setBPhone('');
  };

  // Staff CRUD State Helpers
  const [stName, setStName] = useState('');
  const [stEmail, setStEmail] = useState('');
  const [stRole, setStRole] = useState<'Super Admin' | 'Branch Admin' | 'Accountant' | 'Teacher' | 'Store Manager'>('Teacher');
  const [stBranchId, setStBranchId] = useState('');

  const handleAddStaff = () => {
    if (!stName || !stEmail) {
      alert("Staff Name and Email are required!");
      return;
    }
    const ns: SaaSStaff = {
      id: 'st-' + Date.now(),
      name: stName,
      email: stEmail,
      role: stRole,
      branchId: stBranchId || (school.branches[0]?.id || ''),
      assignedClasses: []
    };
    updateSchoolConfig({
      ...school,
      staff: [...school.staff, ns]
    });
    setStName(''); setStEmail('');
  };

  // Class setup helper
  const [newClassName, setNewClassName] = useState('');
  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    if (school.classes.includes(newClassName.trim())) {
      alert("This class is already setup!");
      return;
    }
    updateSchoolConfig({
      ...school,
      classes: [...school.classes, newClassName.trim()]
    });
    setNewClassName('');
  };

  // Subject helpers
  const [subName, setSubName] = useState('');
  const [subLvl, setSubLvl] = useState<'nursery' | 'primary' | 'secondary' | 'islamia'>('primary');
  const [subComp, setSubComp] = useState(true);

  const handleAddSubject = () => {
    if (!subName.trim()) return;
    updateSchoolConfig({
      ...school,
      subjects: [...school.subjects, { name: subName.trim(), level: subLvl, isCompulsory: subComp }]
    });
    setSubName('');
  };

  // Grading scale helpers
  const [grLetter, setGrLetter] = useState('');
  const [grMin, setGrMin] = useState(50);
  const [grMax, setGrMax] = useState(100);
  const [grGpa, setGrGpa] = useState(4.0);
  const [grRemark, setGrRemark] = useState('');

  const handleAddGradeScale = () => {
    if (!grLetter) return;
    const newGs: SaasGradeScale = {
      grade: grLetter.toUpperCase(),
      minScore: Number(grMin),
      maxScore: Number(grMax),
      gpa: Number(grGpa),
      remarks: grRemark || "Satisfactory"
    };
    // Ensure chronological order
    const copy = [...school.gradeScales].filter(g => g.grade !== newGs.grade);
    copy.push(newGs);
    copy.sort((a, b) => b.minScore - a.minScore);
    updateSchoolConfig({
      ...school,
      gradeScales: copy
    });
    setGrLetter(''); setGrRemark('');
  };

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

  return (
    <div id="saas-setup-workspace" className="space-y-6">
      {/* SaaS Promotional Hero Block */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
        
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            SAMS ERP SaaS Client Onboarding Console
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Offer High-Fidelity School ERP to Other Educational Clients
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            This module provides full multi-tenant configuration. You can register separate school profiles, toggle customized divisions, structure academic subjects, and establish unique grading tiers. **Activate any instance below to live-preview the complete, custom-branded system!**
          </p>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden p-4 space-y-3.5">
          <div className="px-2 py-1">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Configure Sections</h3>
            <p className="text-xs font-bold text-slate-700 mt-1 truncate">{school?.name}</p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveConsoleTab('clients')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeConsoleTab === 'clients' ? 'bg-slate-900 text-white font-extrabold' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>SaaS Clients Directory</span>
              <span className="ml-auto bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-mono">{schools.length}</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('details')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeConsoleTab === 'details' ? 'bg-slate-900 text-white font-extrabold' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <School className="w-4 h-4 shrink-0" />
              <span>School Identity &amp; Logo</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('branches')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeConsoleTab === 'branches' ? 'bg-slate-900 text-white font-extrabold' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Branches &amp; Divisions</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('classes')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeConsoleTab === 'classes' ? 'bg-slate-900 text-white font-extrabold' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Class Setup</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('staff')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeConsoleTab === 'staff' ? 'bg-slate-900 text-white font-extrabold' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Staff &amp; Credentials</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('subjects')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeConsoleTab === 'subjects' ? 'bg-slate-900 text-white font-extrabold' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Curriculum Subjects</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('grading')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeConsoleTab === 'grading' ? 'bg-slate-900 text-white font-extrabold' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>Exam Weights &amp; Grading</span>
            </button>
          </nav>

          <hr className="border-slate-100" />

          {/* Setup checklist / progress */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-2.5">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Onboarding Audit Checklist</h4>
            <div className="space-y-1.5 text-[10px] font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${school.name ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>School Brand identity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${school.branches.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Campus Branches ({school.branches.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${school.classes.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Class configuration ({school.classes.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${school.staff.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Staff &amp; Teachers ({school.staff.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${school.subjects.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Subjects mapped ({school.subjects.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${school.gradeScales.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Grading scale defined</span>
              </div>
            </div>
          </div>
        </div>

        {/* Console Workspace Workspace Panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 min-h-[500px]">
          
          {/* TAB 1: SAAS CLIENTS DIRECTORY */}
          {activeConsoleTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registered SaaS School Clients</h3>
                  <p className="text-xs text-slate-500 mt-1">Manage active tenants and click Activate to simulate branding and data mappings.</p>
                </div>
              </div>

              {/* Grid of registered clients */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schools.map(sch => {
                  const isActive = sch.id === activeSchoolId;
                  const theme = getColorClasses(sch.brandColor);
                  return (
                    <div 
                      key={sch.id} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isActive ? 'border-slate-900 bg-slate-50/50 shadow-md ring-2 ring-slate-900/5' : 'border-slate-200/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2.5 rounded-xl text-white ${theme.bg}`}>
                              {sch.logoType === 'shield' && <ShieldCheck className="w-5 h-5" />}
                              {sch.logoType === 'star' && <Star className="w-5 h-5" />}
                              {sch.logoType === 'book' && <BookOpen className="w-5 h-5" />}
                              {sch.logoType === 'globe' && <Globe className="w-5 h-5" />}
                              {sch.logoType === 'cap' && <Award className="w-5 h-5" />}
                              {sch.logoType === 'lamp' && <Flame className="w-5 h-5" />}
                              {sch.logoType === 'initials' && <span className="font-mono text-sm font-extrabold uppercase">{sch.shortCode}</span>}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-slate-800 text-sm">{sch.name}</h4>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 text-slate-500 font-bold">{sch.shortCode}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium italic">{sch.slogan}</p>
                            </div>
                          </div>
                          
                          {isActive && (
                            <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                              ACTIVE APP DEMO
                            </span>
                          )}
                        </div>

                        {/* Stats mini grid */}
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Branches</span>
                            <span className="text-xs font-extrabold text-slate-700">{sch.branches.length}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Staff</span>
                            <span className="text-xs font-extrabold text-slate-700">{sch.staff.length}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Classes</span>
                            <span className="text-xs font-extrabold text-slate-700">{sch.classes.length}</span>
                          </div>
                        </div>

                        {/* Location Details */}
                        <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{sch.address}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{sch.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-2.5">
                        <button
                          onClick={() => {
                            setEditingSchoolId(sch.id);
                            setActiveConsoleTab('details');
                          }}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all cursor-pointer"
                        >
                          ⚙️ Configure Details
                        </button>

                        <div className="flex items-center gap-1.5">
                          {isActive ? (
                            <button
                              onClick={() => {
                                if(confirm(`Would you like to seed mock demo students, attendances, classes, and marks for ${sch.name}?`)) {
                                  onSeedDemoData(sch);
                                }
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-1.5 px-3 rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Seed Demo Data</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onActivateSchool(sch)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-1.5 px-3.5 rounded-lg text-[10px] transition-all cursor-pointer uppercase tracking-wider shadow-sm flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Activate Demo</span>
                            </button>
                          )}

                          {schools.length > 1 && !isActive && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete client school "${sch.name}"?`)) {
                                  const filtered = schools.filter(s => s.id !== sch.id);
                                  setSchools(filtered);
                                  if (editingSchoolId === sch.id) setEditingSchoolId(schools[0].id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-all cursor-pointer"
                              title="Delete School Client"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Onboard New School Client Form */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-900 text-white p-2 rounded-xl">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Onboard New Tenant Client School</h4>
                    <p className="text-[11px] text-slate-400">Launch a brand new client instance configuration with customized branding.</p>
                  </div>
                </div>

                <form onSubmit={handleAddNewSchool} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block mb-1">School Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sokoto Academic Boarding College"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block mb-1">Short Abbr (Prefix)</label>
                    <input
                      type="text"
                      placeholder="e.g. SABC"
                      value={newSchoolShort}
                      onChange={(e) => setNewSchoolShort(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 uppercase outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block mb-1">Brand Palette Theme</label>
                    <select
                      value={newSchoolColor}
                      onChange={(e) => setNewSchoolColor(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer outline-none focus:border-slate-900"
                    >
                      <option value="indigo">Royal Indigo</option>
                      <option value="teal">Teal Trust</option>
                      <option value="emerald">Emerald Ivy</option>
                      <option value="rose">Crimson Academy</option>
                      <option value="amber">Sienna College</option>
                      <option value="purple">Amethyst Prep</option>
                      <option value="sky">Cosmic Sky</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block mb-1">Slogan or Mission Moto</label>
                    <input
                      type="text"
                      placeholder="e.g. Excellence in Character and Scientific Learning"
                      value={newSchoolSlogan}
                      onChange={(e) => setNewSchoolSlogan(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer h-[34px] flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Onboard School</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Point 4: Onboarding Blueprint Backup & Migration Desk */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-200">
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-50 text-indigo-700 p-2 rounded-xl">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-sans">Tenant Blueprint Backup Desk</h4>
                      <p className="text-[11px] text-slate-400 font-sans">Download complete SaaS setup database configurations for safe offline backup.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      Saves your multi-tenant school portfolio, configured class structures, branches, assigned subjects, and active staff rosters into a single standard portable JSON file.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(schools, null, 2));
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute("href", dataStr);
                        downloadAnchor.setAttribute("download", `sams-saas-blueprint-${Date.now()}.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                      }}
                      className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Export Tenant Blueprint JSON</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-50 text-indigo-700 p-2 rounded-xl">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-sans">Restore or Import Tenant Blueprint</h4>
                      <p className="text-[11px] text-slate-400 font-sans">Select an existing JSON configuration file to restore backup state.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="file"
                      id="saas-blueprint-upload-input"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const parsed = JSON.parse(event.target?.result as string);
                            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].name) {
                              setSchools(parsed);
                              // Auto activate the first school
                              onActivateSchool(parsed[0]);
                              alert("✨ SUCCESS: Multi-Tenant portfolio backup has been loaded and initialized successfully!");
                            } else {
                              alert("❌ VALIDATION ERROR: The selected file does not represent a valid SAMS SaaS client blueprint array.");
                            }
                          } catch (err) {
                            alert("❌ PARSING ERROR: Unable to parse the uploaded file. Verify it is a clean formatted JSON blueprint.");
                          }
                        };
                        reader.readAsText(file);
                      }}
                      className="hidden"
                    />
                    
                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      Upload an official `.json` backup. This overrides the current local tenant database configuration.
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('saas-blueprint-upload-input')?.click();
                      }}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>Upload Blueprint Backup</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Point 5: Dynamic Custom Branding Live Preview Desk */}
              <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-sans">Client Brand Persona Live Preview Desk</h4>
                    <p className="text-[11px] text-slate-400 font-sans">See in real-time how the school custom branding overrides layout parameters and elements.</p>
                  </div>
                </div>

                {school && (
                  <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-4 shadow-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-sans">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Sample Dynamic Workspace Header</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">Dynamic Rendering Ok</span>
                    </div>

                    {/* Virtual App Header Preview */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl gap-4">
                      <div className="flex items-center space-x-3 font-sans">
                        <div className={`p-2.5 rounded-xl text-white flex items-center justify-center ${
                          school.brandColor === 'indigo' ? 'bg-indigo-600' :
                          school.brandColor === 'teal' ? 'bg-teal-600' :
                          school.brandColor === 'emerald' ? 'bg-emerald-600' :
                          school.brandColor === 'rose' ? 'bg-rose-600' :
                          school.brandColor === 'amber' ? 'bg-amber-600' :
                          school.brandColor === 'purple' ? 'bg-purple-600' :
                          school.brandColor === 'sky' ? 'bg-sky-600' : 'bg-slate-600'
                        }`}>
                          {school.logoType === 'shield' && <ShieldCheck className="w-5 h-5" />}
                          {school.logoType === 'star' && <Star className="w-5 h-5" />}
                          {school.logoType === 'book' && <BookOpen className="w-5 h-5" />}
                          {school.logoType === 'globe' && <Globe className="w-5 h-5" />}
                          {school.logoType === 'cap' && <Award className="w-5 h-5" />}
                          {school.logoType === 'lamp' && <Flame className="w-5 h-5" />}
                          {school.logoType === 'initials' && <span className="font-mono text-xs font-black uppercase">{school.shortCode}</span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-extrabold text-xs text-slate-900">{school.name}</h5>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider ${
                              school.brandColor === 'indigo' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              school.brandColor === 'teal' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                              school.brandColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              school.brandColor === 'rose' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              school.brandColor === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              school.brandColor === 'purple' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                              school.brandColor === 'sky' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'bg-slate-50 text-slate-700'
                            }`}>{school.shortCode} ERP</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">{school.slogan}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 font-sans">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          school.brandColor === 'indigo' ? 'bg-indigo-50 text-indigo-700' :
                          school.brandColor === 'teal' ? 'bg-teal-50 text-teal-700' :
                          school.brandColor === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                          school.brandColor === 'rose' ? 'bg-rose-50 text-rose-700' :
                          school.brandColor === 'amber' ? 'bg-amber-50 text-amber-700' :
                          school.brandColor === 'purple' ? 'bg-purple-50 text-purple-700' :
                          school.brandColor === 'sky' ? 'bg-sky-50 text-sky-700' : 'bg-slate-50 text-slate-700'
                        }`}>Active Campus: MAIN</span>
                        
                        <button type="button" className={`px-3 py-1 rounded text-[10px] font-bold text-white shadow-xs ${
                          school.brandColor === 'indigo' ? 'bg-indigo-600' :
                          school.brandColor === 'teal' ? 'bg-teal-600' :
                          school.brandColor === 'emerald' ? 'bg-emerald-600' :
                          school.brandColor === 'rose' ? 'bg-rose-600' :
                          school.brandColor === 'amber' ? 'bg-amber-600' :
                          school.brandColor === 'purple' ? 'bg-purple-600' :
                          school.brandColor === 'sky' ? 'bg-sky-600' : 'bg-slate-600'
                        }`}>
                          Save Marks
                        </button>
                      </div>
                    </div>

                    {/* Quick Specs Overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs font-medium text-slate-600 font-sans">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase font-mono">Color Profile</span>
                        <span className="font-extrabold capitalize text-slate-800">{school.brandColor}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase font-mono">Active Pass Score</span>
                        <span className="font-extrabold text-slate-800">{school.passingScore || 40}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase font-mono">Assessment Weight</span>
                        <span className="font-extrabold text-slate-800">{school.caWeight || 40} CA : {school.examWeight || 60} Exam</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase font-mono">Grade Boundaries</span>
                        <span className="font-extrabold text-slate-800">{school.gradeScales?.length || 0} Levels</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCHOOL DETAILS & LOGO */}
          {activeConsoleTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <School className="w-5 h-5 text-indigo-600" />
                  School Identity, Brand &amp; Digital Logo Setup
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure user-facing brand identities. Changes reflect live on ERP headers and client-facing report sheets.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Brand Parameters Form */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Organizational Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1">Registered Institution Name</label>
                      <input
                        type="text"
                        value={school.name}
                        onChange={(e) => updateSchoolConfig({ ...school, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1">Brand Color Accent</label>
                      <select
                        value={school.brandColor}
                        onChange={(e) => updateSchoolConfig({ ...school, brandColor: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer outline-none focus:border-indigo-500"
                      >
                        <option value="indigo">Indigo Blue</option>
                        <option value="teal">Teal Green</option>
                        <option value="emerald">Emerald Forest</option>
                        <option value="rose">Crimson Rose</option>
                        <option value="amber">Sienna Amber</option>
                        <option value="purple">Amethyst Purple</option>
                        <option value="sky">Cosmic Sky</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1">Logo Emblem Type</label>
                      <select
                        value={school.logoType}
                        onChange={(e) => updateSchoolConfig({ ...school, logoType: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer outline-none focus:border-indigo-500"
                      >
                        <option value="shield">🛡️ Crest Shield</option>
                        <option value="star">⭐ Achievement Star</option>
                        <option value="book">📖 Wisdom Book</option>
                        <option value="globe">🌐 Global Academy</option>
                        <option value="cap">🎓 Honors Cap</option>
                        <option value="lamp">🔥 Flame of Learning</option>
                        <option value="initials">🔠 Abbreviation Initials</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1">Institution Slogan / Moto</label>
                      <input
                        type="text"
                        value={school.slogan}
                        onChange={(e) => updateSchoolConfig({ ...school, slogan: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider pt-2">Contact &amp; Directory Metadata</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1">Institutional Headquarters Address</label>
                      <input
                        type="text"
                        value={school.address}
                        onChange={(e) => updateSchoolConfig({ ...school, address: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1">Primary Hotline</label>
                      <input
                        type="text"
                        value={school.phone}
                        onChange={(e) => updateSchoolConfig({ ...school, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1">System Administration Email</label>
                      <input
                        type="email"
                        value={school.email}
                        onChange={(e) => updateSchoolConfig({ ...school, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 font-extrabold block mb-1">Official Website</label>
                      <input
                        type="text"
                        value={school.website}
                        onChange={(e) => updateSchoolConfig({ ...school, website: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Real-time Branding Preview */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Live Custom-Branded Preview (Header Sample)
                    </h4>
                    
                    {/* Simulated Header */}
                    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl text-white shadow-md ${currentTheme.bg}`}>
                          {school.logoType === 'shield' && <ShieldCheck className="w-6 h-6" />}
                          {school.logoType === 'star' && <Star className="w-6 h-6" />}
                          {school.logoType === 'book' && <BookOpen className="w-6 h-6" />}
                          {school.logoType === 'globe' && <Globe className="w-6 h-6" />}
                          {school.logoType === 'cap' && <Award className="w-6 h-6" />}
                          {school.logoType === 'lamp' && <Flame className="w-6 h-6" />}
                          {school.logoType === 'initials' && <span className="font-mono text-sm font-extrabold uppercase">{school.shortCode}</span>}
                        </div>
                        <div>
                          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center">
                            {school.name}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold border uppercase tracking-wider ${currentTheme.pill}`}>
                              {school.shortCode} ERP
                            </span>
                          </h1>
                          <p className="text-[10px] text-slate-400 italic font-medium">{school.slogan}</p>
                        </div>
                      </div>

                      {/* Mock statistics card with school brand color */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-lg border-l-4 ${currentTheme.border} bg-slate-50/50`}>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Institution ID</span>
                          <span className="text-xs font-mono font-extrabold text-slate-800">{school.shortCode}-CLIENT-81B</span>
                        </div>
                        <div className={`p-3 rounded-lg border-l-4 ${currentTheme.border} bg-slate-50/50`}>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">SaaS Active Node</span>
                          <span className="text-xs font-mono font-extrabold text-slate-800">CO-HOSTED</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                      <div className="text-[11px] text-indigo-700 leading-relaxed font-semibold">
                        Clicking the "Activate Demo" button on the Clients directory will immediately map these brand details to the top header and general interfaces of the school application!
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-200/50 p-4 rounded-xl text-center space-y-1 text-slate-500">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Institutional Database Key</p>
                    <p className="font-mono text-xs font-bold select-all truncate">{school.id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BRANCHES & SECTIONS */}
          {activeConsoleTab === 'branches' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Campus Branches &amp; Educational Division Config
                </h3>
                <p className="text-xs text-slate-500 mt-1">Manage physical campuses/locations, branch directors, and activate specific learning divisions.</p>
              </div>

              {/* Divisions Toggles */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  Divisions / Levels Setup
                </h4>
                
                <p className="text-xs text-slate-500">Enable or disable entire levels. When a level is disabled, its students and setups are temporarily restricted from general dashboard entries.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {(['nursery', 'primary', 'secondary', 'islamia'] as const).map(div => (
                    <label 
                      key={div} 
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer select-none transition-all ${
                        school.sectionsEnabled[div] 
                          ? `border-slate-800 bg-white shadow-sm ring-1 ring-slate-900/5 font-bold` 
                          : 'border-slate-200/60 bg-slate-50 text-slate-400'
                      }`}
                    >
                      <span className="capitalize text-xs uppercase tracking-wide font-extrabold">
                        {div === 'islamia' ? 'Islamia / Arabic' : `${div} Level`}
                      </span>
                      <input
                        type="checkbox"
                        checked={school.sectionsEnabled[div]}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updateSchoolConfig({
                            ...school,
                            sectionsEnabled: {
                              ...school.sectionsEnabled,
                              [div]: val
                            }
                          });
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Branches Table List */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Locations Directory</h4>
                
                <div className="border rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
                  {school.branches.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No branches added yet. Please add at least one branch.</div>
                  ) : (
                    school.branches.map(br => (
                      <div key={br.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${currentTheme.bg}`}></span>
                            <span className="font-extrabold text-slate-800 text-sm">{br.name}</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase">{br.code}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>{br.address}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-4">
                            <span>👩‍💼 Manager: <strong className="text-slate-600">{br.manager}</strong></span>
                            <span>📞 Hotline: <strong className="text-slate-600">{br.phone}</strong></span>
                          </div>
                        </div>

                        {school.branches.length > 1 && (
                          <button
                            onClick={() => {
                              const filtered = school.branches.filter(b => b.id !== br.id);
                              updateSchoolConfig({ ...school, branches: filtered });
                            }}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 cursor-pointer"
                            title="Delete Branch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Branch Creator */}
                <div className="bg-slate-50 p-4 border rounded-2xl space-y-3.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">🏢 Add Branch Location</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 items-end">
                    <div className="sm:col-span-2">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Branch Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sokoto Main Campus"
                        value={bName}
                        onChange={(e) => setBName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Abbr Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SMC"
                        value={bCode}
                        onChange={(e) => setBCode(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs uppercase font-mono font-bold outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Headquarter Admin / Manager</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Muhammad Junaid"
                        value={bMgr}
                        onChange={(e) => setBMgr(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Address Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Airport Road, Gidan Dare Sokoto"
                        value={bAddr}
                        onChange={(e) => setBAddr(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Contact Phone</label>
                      <input
                        type="text"
                        placeholder="e.g. +234 803 555 4444"
                        value={bPhone}
                        onChange={(e) => setBPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <button
                        onClick={handleAddBranch}
                        className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-2 px-3 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer h-[32px] flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Branch</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLASS SETUP */}
          {activeConsoleTab === 'classes' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Institutional Class/Grade Room Setup
                </h3>
                <p className="text-xs text-slate-500 mt-1">Register classroom registries. These populate class selections throughout the student admissions and grading modules.</p>
              </div>

              {/* Class setup list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Classroom Classes</h4>
                  
                  <div className="flex flex-wrap gap-2.5">
                    {school.classes.length === 0 ? (
                      <div className="text-xs text-slate-400 p-4 border border-dashed rounded-xl w-full text-center">No classrooms configured. Add classes below.</div>
                    ) : (
                      school.classes.map(cl => (
                        <div key={cl} className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-800 shadow-2xs">
                          <span>🚪 {cl}</span>
                          <button
                            onClick={() => {
                              const filtered = school.classes.filter(c => c !== cl);
                              updateSchoolConfig({ ...school, classes: filtered });
                            }}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer text-[10px]"
                            title="Remove Class"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Class Creator */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-3.5 self-start shadow-xs">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Configure New Room</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Class/Grade Name</label>
                      <input
                        type="text"
                        placeholder="e.g. SSS 1 Science"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      onClick={handleAddClass}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-2 px-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Room Registry</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STAFF SETUP */}
          {activeConsoleTab === 'staff' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Staff, Teachers &amp; Credentials setup
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure user accounts representing roles (Super Admins, Branch Directors, Accountants, Teachers) co-hosted in the school.</p>
              </div>

              {/* Staff Table */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Registered Personnel Roster</h4>
                
                <div className="overflow-x-auto border border-slate-200/60 rounded-2xl shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Login Email</th>
                        <th className="px-4 py-3">Role / Security Group</th>
                        <th className="px-4 py-3">Assigned Campus</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {school.staff.length === 0 ? (
                        <tr><td colSpan={5} className="p-6 text-center text-slate-400">No staff registered. Please add staff personnel below.</td></tr>
                      ) : (
                        school.staff.map(st => {
                          const br = school.branches.find(b => b.id === st.branchId);
                          return (
                            <tr key={st.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-bold text-slate-800">{st.name}</td>
                              <td className="px-4 py-3 font-mono text-slate-500">{st.email}</td>
                              <td className="px-4 py-3 font-semibold text-slate-600">
                                <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[9px] font-bold border">
                                  {st.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-medium">
                                {br ? `${br.name} (${br.code})` : "Global Headquarters"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {school.staff.length > 1 && (
                                  <button
                                    onClick={() => {
                                      const filtered = school.staff.filter(s => s.id !== st.id);
                                      updateSchoolConfig({ ...school, staff: filtered });
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                                    title="Revoke Staff Access"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Staff Creator form */}
                <div className="bg-slate-50 p-4 border rounded-2xl space-y-3.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">👤 Register Staff Personnel</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 items-end">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Mal. Ibrahim Gobir"
                        value={stName}
                        onChange={(e) => setStName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Login / Auth Email</label>
                      <input
                        type="email"
                        placeholder="e.g. gobir@school.edu.ng"
                        value={stEmail}
                        onChange={(e) => setStEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Access Role Permission</label>
                      <select
                        value={stRole}
                        onChange={(e) => setStRole(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-500"
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Branch Admin">Branch Admin</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Teacher">Teacher (Class Instructor)</option>
                        <option value="Store Manager">Store &amp; Inventory Mgr</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Campus Assignment</label>
                      <select
                        value={stBranchId}
                        onChange={(e) => setStBranchId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-500"
                      >
                        {school.branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4 text-right">
                      <button
                        onClick={handleAddStaff}
                        className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer h-[34px] flex items-center justify-center gap-1 shadow-sm"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Register &amp; Provision Staff</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SUBJECTS SETUP */}
          {activeConsoleTab === 'subjects' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Academic Curriculum Subjects Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-1">Design the general course catalog of study subjects offered by the school, mapped by educational divisions.</p>
              </div>

              {/* Subject mappings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Curriculum Subjects</h4>
                  
                  <div className="overflow-x-auto border border-slate-200/60 rounded-2xl shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          <th className="px-4 py-2.5">Subject Name</th>
                          <th className="px-4 py-2.5">Target Level Division</th>
                          <th className="px-4 py-2.5">Academic Status</th>
                          <th className="px-4 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {school.subjects.length === 0 ? (
                          <tr><td colSpan={4} className="p-4 text-center text-slate-400">No subjects offered. Configure catalog below.</td></tr>
                        ) : (
                          school.subjects.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-bold text-slate-800">{sub.name}</td>
                              <td className="px-4 py-2.5 text-slate-600 capitalize">{sub.level} Level</td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.isCompulsory ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'bg-slate-50 border text-slate-500'}`}>
                                  {sub.isCompulsory ? 'Compulsory' : 'Elective'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <button
                                  onClick={() => {
                                    const copy = [...school.subjects];
                                    copy.splice(idx, 1);
                                    updateSchoolConfig({ ...school, subjects: copy });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                  title="Delete Subject"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subject Creator form */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4 self-start shadow-xs">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Create Course Subject</h4>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Subject / Course Name</label>
                      <input
                        type="text"
                        placeholder="e.g. English Language"
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Level Division Mapping</label>
                      <select
                        value={subLvl}
                        onChange={(e) => setSubLvl(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-500"
                      >
                        <option value="nursery">Nursery Division</option>
                        <option value="primary">Primary Division</option>
                        <option value="secondary">Secondary Division</option>
                        <option value="islamia">Islamia / Arabic Section</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white border rounded-xl">
                      <span className="font-semibold text-slate-600 text-xs">Compulsory Subject</span>
                      <input
                        type="checkbox"
                        checked={subComp}
                        onChange={(e) => setSubComp(e.target.checked)}
                        className="rounded text-indigo-600 cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={handleAddSubject}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-2 px-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register Subject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: GRADING & WEIGHTS */}
          {activeConsoleTab === 'grading' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-indigo-600" />
                  Academic Exam Scoring &amp; Custom Grading scale Setup
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure weights for continuous assessment vs. exams, passing margins, and custom letter grading tiers.</p>
              </div>

              {/* Weights Setup */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Institutional Cumulative Weight Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">CA Weight % (SAMS/CA)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={school.caWeight}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value)));
                        updateSchoolConfig({ ...school, caWeight: val, examWeight: 100 - val });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Exam Weight % (SAMS/Exam)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={school.examWeight}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value)));
                        updateSchoolConfig({ ...school, examWeight: val, caWeight: 100 - val });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Passing Grade Score (Margin)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={school.passingScore}
                      onChange={(e) => updateSchoolConfig({ ...school, passingScore: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="bg-white p-3 border rounded-xl flex items-center justify-center gap-1 text-[10px] font-extrabold text-slate-400 text-center select-none">
                    <span>CA: {school.caWeight}% + EXAM: {school.examWeight}% = 100% ✅</span>
                  </div>
                </div>
              </div>

              {/* Grade Scaler Table */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Configured Letter Grading Ranges</h4>
                  
                  <div className="overflow-x-auto border border-slate-200/60 rounded-2xl shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          <th className="px-4 py-2.5 text-center">Grade</th>
                          <th className="px-4 py-2.5">Score Range</th>
                          <th className="px-4 py-2.5">GPA Point</th>
                          <th className="px-4 py-2.5">Remarks / Remarks</th>
                          <th className="px-4 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {school.gradeScales.map((scale, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 text-center">
                              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded text-[10px]">
                                {scale.grade}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">
                              {scale.minScore}% - {scale.maxScore}%
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[11.5px] text-slate-600">{scale.gpa.toFixed(1)}</td>
                            <td className="px-4 py-2.5 text-slate-600">{scale.remarks}</td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                onClick={() => {
                                  const filtered = school.gradeScales.filter(g => g.grade !== scale.grade);
                                  updateSchoolConfig({ ...school, gradeScales: filtered });
                                }}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                                title="Remove Grade Scale"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Range Creator */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4 self-start shadow-xs">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Add Grade Bracket</h4>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Letter Code</label>
                      <input
                        type="text"
                        placeholder="e.g. A1 or EX"
                        value={grLetter}
                        onChange={(e) => setGrLetter(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold uppercase outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Min Score %</label>
                        <input
                          type="number"
                          value={grMin}
                          onChange={(e) => setGrMin(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Max Score %</label>
                        <input
                          type="number"
                          value={grMax}
                          onChange={(e) => setGrMax(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">GPA Value Points</label>
                      <input
                        type="number"
                        step="0.1"
                        value={grGpa}
                        onChange={(e) => setGrGpa(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Grade Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. Pass with Distinction"
                        value={grRemark}
                        onChange={(e) => setGrRemark(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      onClick={handleAddGradeScale}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-2 px-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register Grade Scale</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
