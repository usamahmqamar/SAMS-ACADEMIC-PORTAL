import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Briefcase, 
  Layers, 
  ClipboardCheck, 
  Pencil, 
  Coins, 
  Package, 
  Calendar, 
  TrendingUp, 
  MessageSquare, 
  Sliders,
  ShieldCheck,
  Building2,
  ChevronDown, 
  Menu, 
  X, 
  Info,
  Sparkles,
  Lock,
  ChevronRight,
  Search,
  Compass,
  Star,
  History,
  Zap,
  Activity,
  CheckSquare,
  AlertCircle,
  Bell,
  Clock,
  UserCheck,
  CheckCircle2,
  MousePointerClick
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Structure of a submenu item under a primary module
export interface SubmenuItem {
  id: string;
  name: string;
  description: string;
  mappedTab: string;
}

// Structure of a primary module in our navigation architecture
export interface PrimaryModule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  displayOrder: number;
  submenu: SubmenuItem[];
}

export const ROLE_VISIBILITY: Record<string, {
  modules?: string[];
  submenus?: string[];
}> = {
  'Super Administrator': {
    // Full access to all modules and submenus
  },
  'Super Admin': {
    // Full access to all modules and submenus
  },
  'Proprietor': {
    submenus: [
      'dashboard_exec', 'dashboard_health',
      'students_directory', 'students_coverage',
      'admissions_hub',
      'staff_directory', 'staff_payroll',
      'academics_curriculum', 'academics_timetable',
      'attendance_student', 'attendance_staff',
      'results_entry', 'results_cards', 'results_analysis',
      'financial_structures', 'financial_billing_hub', 'financial_expenses_reports',
      'inventory_stores', 'inventory_issuance', 'inventory_reports',
      'ops_dashboard', 'ops_calendar',
      'reports_academic', 'reports_financial', 'reports_executive',
      'comm_notices', 'comm_parent_notif',
      'admin_users', 'admin_roles', 'admin_audit', 'admin_backup',
      'admin_branches', 'admin_sessions', 'admin_csv', 'admin_settings'
    ]
  },
  'Branch Administrator': {
    submenus: [
      'dashboard_exec', 'dashboard_health',
      'students_directory', 'students_coverage',
      'admissions_hub',
      'staff_directory', 'staff_payroll',
      'academics_curriculum', 'academics_timetable',
      'attendance_student', 'attendance_staff',
      'results_entry', 'results_cards', 'results_analysis',
      'financial_structures', 'financial_billing_hub', 'financial_expenses_reports',
      'inventory_stores', 'inventory_issuance', 'inventory_reports',
      'ops_dashboard', 'ops_calendar',
      'reports_academic', 'reports_financial', 'reports_executive',
      'comm_notices', 'comm_parent_notif',
      'admin_branches', 'admin_sessions', 'admin_csv'
    ]
  },
  'Branch Admin': {
    submenus: [
      'dashboard_exec', 'dashboard_health',
      'students_directory', 'students_coverage',
      'admissions_hub',
      'staff_directory', 'staff_payroll',
      'academics_curriculum', 'academics_timetable',
      'attendance_student', 'attendance_staff',
      'results_entry', 'results_cards', 'results_analysis',
      'financial_structures', 'financial_billing_hub', 'financial_expenses_reports',
      'inventory_stores', 'inventory_issuance', 'inventory_reports',
      'ops_dashboard', 'ops_calendar',
      'reports_academic', 'reports_financial', 'reports_executive',
      'comm_notices', 'comm_parent_notif',
      'admin_branches', 'admin_sessions', 'admin_csv'
    ]
  },
  'Principal': {
    modules: ['dashboard', 'students', 'admissions', 'staff', 'academics', 'attendance', 'results', 'calendar_ops', 'reports', 'communication'],
    submenus: [
      'dashboard_exec', 'dashboard_health',
      'students_directory', 'students_coverage',
      'admissions_hub',
      'staff_directory', 'staff_payroll',
      'academics_curriculum', 'academics_timetable',
      'attendance_student', 'attendance_staff',
      'results_entry', 'results_cards', 'results_analysis',
      'ops_dashboard', 'ops_calendar',
      'reports_academic', 'reports_executive',
      'comm_notices', 'comm_parent_notif'
    ]
  },
  'Accountant': {
    modules: ['dashboard', 'students', 'staff', 'financial', 'reports', 'communication'],
    submenus: [
      'dashboard_exec', 'dashboard_health',
      'students_directory',
      'staff_directory', 'staff_payroll',
      'financial_structures', 'financial_billing_hub', 'financial_expenses_reports',
      'reports_financial',
      'comm_notices', 'comm_parent_notif'
    ]
  },
  'Teacher': {
    modules: ['dashboard', 'students', 'academics', 'attendance', 'results', 'calendar_ops', 'reports', 'communication'],
    submenus: [
      'dashboard_exec',
      'students_directory', 'students_coverage',
      'academics_curriculum', 'academics_timetable',
      'attendance_student', 'attendance_staff',
      'results_entry', 'results_cards', 'results_analysis',
      'ops_calendar',
      'reports_academic',
      'comm_notices', 'comm_parent_notif'
    ]
  },
  'Store Manager': {
    modules: ['dashboard', 'inventory', 'calendar_ops', 'reports'],
    submenus: [
      'dashboard_exec',
      'inventory_stores', 'inventory_issuance', 'inventory_reports',
      'ops_dashboard',
      'reports_inventory'
    ]
  },
  'Parent': {
    modules: ['dashboard', 'students', 'attendance', 'results', 'calendar_ops', 'communication'],
    submenus: [
      'dashboard_health',
      'students_directory',
      'attendance_student',
      'results_cards',
      'ops_calendar',
      'comm_notices', 'comm_parent_notif'
    ]
  }
};

export const standardizeRole = (role: string): string => {
  if (role === 'Super Admin') return 'Super Administrator';
  if (role === 'Branch Admin') return 'Branch Administrator';
  return role;
};

export const SAMS_MODULES: PrimaryModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'SAMS executive stats, indexes, and real-time summaries',
    icon: LayoutDashboard,
    displayOrder: 1,
    submenu: [
      { id: 'dashboard_exec', name: 'Executive Overview', description: 'Institutional health, statistics, and high-level summaries', mappedTab: 'overview' },
      { id: 'dashboard_health', name: 'School Health Score', description: 'Core academic, financial, and attendance ratings', mappedTab: 'health' }
    ]
  },
  {
    id: 'students',
    name: 'Students',
    description: 'Centralized directory, student records, and custom profiles',
    icon: Users,
    displayOrder: 2,
    submenu: [
      { id: 'students_directory', name: 'Student Directory', description: 'Interactive student search, status sheets, and ledger links', mappedTab: 'students' },
      { id: 'students_coverage', name: 'Book & Work Coverage', description: 'Audit individual student exercise book completion and remedial support flags', mappedTab: 'students' }
    ]
  },
  {
    id: 'admissions',
    name: 'Admissions',
    description: 'Prospect registry, applications workflow, and onboarding portals',
    icon: FileText,
    displayOrder: 3,
    submenu: [
      { id: 'admissions_hub', name: 'Admissions Hub', description: 'Interactive multi-stage admission clearing and enrollment desk', mappedTab: 'admission' }
    ]
  },
  {
    id: 'staff',
    name: 'Staff & HR',
    description: 'Faculty registry, teacher profiles, and monthly payroll registers',
    icon: Briefcase,
    displayOrder: 4,
    submenu: [
      { id: 'staff_directory', name: 'Staff & Teachers', description: 'Central staff registry, profiles, and employee accounts', mappedTab: 'teachers' },
      { id: 'staff_payroll', name: 'Payroll Register', description: 'Monthly attendance matrix, salary logs, loans, and slips', mappedTab: 'teachers' }
    ]
  },
  {
    id: 'academics',
    name: 'Academics',
    description: 'Classrooms, sections mapping, subjects, and curricula',
    icon: Layers,
    displayOrder: 5,
    submenu: [
      { id: 'academics_curriculum', name: 'Academics & Curricula', description: 'Sections, classes, subjects, Islamic studies, and lesson schemes', mappedTab: 'classes' },
      { id: 'academics_timetable', name: 'Timetable / Scheduler', description: 'Interactive visual timetable of class periods & allocations', mappedTab: 'scheduler' }
    ]
  },
  {
    id: 'attendance',
    name: 'Attendance',
    description: 'Daily registry desk and historic logging tools',
    icon: ClipboardCheck,
    displayOrder: 6,
    submenu: [
      { id: 'attendance_student', name: 'Student Attendance', description: 'Daily classroom attendance register and session audits', mappedTab: 'attendance_desk' },
      { id: 'attendance_staff', name: 'Staff Monthly Attendance', description: 'Staff & faculty monthly attendance matrix & clock-in grid', mappedTab: 'attendance_desk' }
    ]
  },
  {
    id: 'results',
    name: 'Results',
    description: 'SAMS examination control, score sheets, and marks logging',
    icon: Pencil,
    displayOrder: 7,
    submenu: [
      { id: 'results_entry', name: 'Result Entry Ledger', description: 'Continuous assessments and terminal exam marks entry', mappedTab: 'grades' },
      { id: 'results_cards', name: 'Report Cards & Publishing', description: 'Compile individual report cards and release to Parent Portal', mappedTab: 'grades' },
      { id: 'results_analysis', name: 'Academic Analysis & Ranking', description: 'Class rankings, subject GPAs, and cohort performance', mappedTab: 'grades' }
    ]
  },
  {
    id: 'financial',
    name: 'Financial Management',
    description: 'Tuition collections, template builders, and expense logs',
    icon: Coins,
    displayOrder: 8,
    submenu: [
      { id: 'financial_structures', name: 'Fee Structures & Setup', description: 'Fee heads, class templates, overrides, and discounts', mappedTab: 'financial_settings' },
      { id: 'financial_billing_hub', name: 'Billing & Collections', description: 'Student invoices, family accounts, and payment intake', mappedTab: 'financial_settings' },
      { id: 'financial_expenses_reports', name: 'Expenses & Reports', description: 'Operational expenses, balance sheets, and audit reports', mappedTab: 'financial_settings' }
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'School asset tracking, books registries, and supplies logs',
    icon: Package,
    displayOrder: 9,
    submenu: [
      { id: 'inventory_stores', name: 'Stores & Stock Levels', description: 'Store bins, textbook stocks, and safe threshold alerts', mappedTab: 'inventory' },
      { id: 'inventory_issuance', name: 'Material Issuance & Orders', description: 'Stock transfers, book orders, and supplies handover', mappedTab: 'inventory' },
      { id: 'inventory_reports', name: 'Inventory Reports & Audits', description: 'Depletion audit trails, supplier logs, and store valuation', mappedTab: 'inventory' }
    ]
  },
  {
    id: 'calendar_ops',
    name: 'Calendar & Operations',
    description: 'Schedules, class timetables, and operations indexes',
    icon: Calendar,
    displayOrder: 10,
    submenu: [
      { id: 'ops_dashboard', name: 'Operations Console', description: 'Administrative operations timeline, tasks, and readiness', mappedTab: 'operations' },
      { id: 'ops_calendar', name: 'Academic Calendar & Events', description: 'Term dates, exams timelines, holidays, and school events', mappedTab: 'calendar' }
    ]
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Centralized audits, financial boards, and insights',
    icon: TrendingUp,
    displayOrder: 11,
    submenu: [
      { id: 'reports_academic', name: 'Academic Reports', description: 'Cohort grading statistics, averages, and student performance', mappedTab: 'analytics_reports' },
      { id: 'reports_financial', name: 'Financial Reports & Consolidation', description: 'Interactive consolidations, corporate audits, and invoices', mappedTab: 'consolidation' },
      { id: 'reports_executive', name: 'Executive & Compliance Reports', description: 'Consolidated branch KPI overview, indices, and ratings', mappedTab: 'analytics_reports' }
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'SMS notification pipelines, parents letters, and broadcasts',
    icon: MessageSquare,
    displayOrder: 12,
    submenu: [
      { id: 'comm_notices', name: 'Notice Board & Letters', description: 'Draft general notices, letters, and digital board papers', mappedTab: 'parent' },
      { id: 'comm_parent_notif', name: 'Parent & Staff Broadcasts', description: 'Class updates, fee reminders, and urgent broadcasts', mappedTab: 'parent' }
    ]
  },
  {
    id: 'security',
    name: 'System & Security',
    description: 'IAM user management, roles matrix, audit logs, and backups',
    icon: ShieldCheck,
    displayOrder: 13,
    submenu: [
      { id: 'admin_users', name: 'User Management', description: 'Onboard administrators, teachers, and assign accounts', mappedTab: 'security' },
      { id: 'admin_roles', name: 'Roles & Access Control', description: 'Manage role templates and permissions matrix', mappedTab: 'security' },
      { id: 'admin_audit', name: 'Audit Logs Ledger', description: 'Immutable ledger tracking user actions and updates', mappedTab: 'security' },
      { id: 'admin_backup', name: 'Backup & Recovery', description: 'Generate and restore offline database snapshots', mappedTab: 'security' }
    ]
  },
  {
    id: 'school_setup',
    name: 'School Setup & Config',
    description: 'Campus branches, academic sessions, CSV tools, and branding',
    icon: Building2,
    displayOrder: 14,
    submenu: [
      { id: 'admin_branches', name: 'Campus Branches', description: 'Register school branch records, contacts, and meta tags', mappedTab: 'school_setup' },
      { id: 'admin_sessions', name: 'Academic Sessions & Terms', description: 'Manage active academic years, timelines, and terms', mappedTab: 'school_setup' },
      { id: 'admin_csv', name: 'Data Import & Export', description: 'Bulk CSV import/export for students and staff data', mappedTab: 'school_setup' },
      { id: 'admin_settings', name: 'System Branding & Settings', description: 'ERP branding logos, currency, and global settings', mappedTab: 'school_setup' }
    ]
  }
].sort((a, b) => a.displayOrder - b.displayOrder);

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentSimulatedRole?: string;
  currentUserRole?: string;
  isTabRestricted: (tab: string, role: string) => boolean;
  systemUsersCount: number;
  securityLockdownMode: boolean;
  onForceReset: () => void;
  favourites: string[];
  toggleFavourite: (id: string) => void;
  recentlyVisited: string[];
  onOpenPersonalization: () => void;
  quickShortcuts: string[];
  onSubmenuSelect?: (subId: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentSimulatedRole,
  currentUserRole,
  isTabRestricted,
  systemUsersCount,
  securityLockdownMode,
  onForceReset,
  favourites,
  toggleFavourite,
  recentlyVisited,
  onOpenPersonalization,
  quickShortcuts,
  onSubmenuSelect
}) => {
  // Effective role
  const effectiveRole = currentUserRole || currentSimulatedRole || 'Super Administrator';
  // Collapsed sidebar state on desktop/tablet
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Automatically collapse sidebar on small/medium screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active sub-navigation view mode inside the sidebar
  const [activeSidebarTab, setActiveSidebarTab] = useState<'modules' | 'assistant'>('modules');
  
  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Search query to filter the huge navigation tree easily
  const [searchQuery, setSearchQuery] = useState<string>('');

  // SAMS 13 Primary Modules and all of their requested ERP sub-functions
  const modules = SAMS_MODULES;

  // Expanded submenu state for each of the 13 primary modules
  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>(() => {
    const activeMod = (modules || []).find(m => (m.submenu || []).some(sub => sub.mappedTab === activeTab));
    return activeMod ? [activeMod.id] : ['dashboard'];
  });

  // Track the custom sub-menu item selected state
  const [selectedSubmenuId, setSelectedSubmenuId] = useState<string>(() => {
    const activeMod = (modules || []).find(m => (m.submenu || []).some(sub => sub.mappedTab === activeTab));
    if (activeMod && Array.isArray(activeMod.submenu)) {
      const match = activeMod.submenu.find(sub => sub.mappedTab === activeTab);
      return match ? match.id : '';
    }
    return '';
  });

  // Synchronize navigation selected state if tab is changed externally (e.g. from global search)
  useEffect(() => {
    const activeMod = (modules || []).find(m => (m.submenu || []).some(sub => sub.mappedTab === activeTab));
    if (activeMod && Array.isArray(activeMod.submenu)) {
      const match = activeMod.submenu.find(sub => sub.mappedTab === activeTab);
      if (match) {
        setSelectedSubmenuId(match.id);
        setExpandedModuleIds(prev => prev.includes(activeMod.id) ? prev : [...prev, activeMod.id]);
      }
    }
  }, [activeTab, modules]);

  // Expand all modules
  const handleExpandAll = () => {
    setExpandedModuleIds(filteredModules.map(m => m.id));
  };

  // Collapse all modules
  const handleCollapseAll = () => {
    setExpandedModuleIds([]);
  };

  // Filter modules and submenus dynamically according to role visibility and search criteria
  const filteredModules = useMemo(() => {
    // 1. First filter by current role's visible modules and submenus
    const roleRules = ROLE_VISIBILITY[effectiveRole] || ROLE_VISIBILITY[standardizeRole(effectiveRole)] || {};
    
    let visibleMods = modules;

    // Filter top-level modules if role restricts them
    if (roleRules.modules) {
      visibleMods = visibleMods.filter(mod => roleRules.modules?.includes(mod.id));
    }

    // Filter submenu items inside each module
    visibleMods = visibleMods.map(mod => {
      let filteredSub = mod.submenu;
      if (roleRules.submenus) {
        filteredSub = filteredSub.filter(sub => roleRules.submenus?.includes(sub.id));
      }
      return {
        ...mod,
        submenu: filteredSub
      };
    }).filter(mod => mod.submenu.length > 0); // Hide modules if no submenus are visible

    // 2. Next apply search query if there is any
    if (!searchQuery.trim()) return visibleMods;
    const query = searchQuery.toLowerCase();
    return visibleMods.map(mod => {
      const isModMatch = mod.name.toLowerCase().includes(query) || mod.description.toLowerCase().includes(query);
      const matchingSubmenu = mod.submenu.filter(sub => 
        sub.name.toLowerCase().includes(query) || sub.description.toLowerCase().includes(query)
      );
      if (isModMatch || matchingSubmenu.length > 0) {
        return {
          ...mod,
          submenu: matchingSubmenu.length > 0 ? matchingSubmenu : mod.submenu
        };
      }
      return null;
    }).filter(Boolean) as PrimaryModule[];
  }, [searchQuery, modules, effectiveRole]);

  // --- SMART OPERATIONAL ASSISTANT DATA ENG & TELEMETRY ---
  const handleAssistantAction = (mappedTab: string, subId?: string) => {
    if (subId) {
      let foundSub: SubmenuItem | null = null;
      for (const m of modules) {
        const s = m.submenu.find(sub => sub.id === subId);
        if (s) {
          foundSub = s;
          break;
        }
      }
      if (foundSub) {
        handleSubmenuClick(foundSub);
        return;
      }
    }
    
    if (isTabRestricted(mappedTab, effectiveRole)) {
      alert(`🔒 ACCESS RESTRICTED: Your authenticated role "${effectiveRole}" does not have privileges to access this view.`);
      return;
    }
    setActiveTab(mappedTab);
  };

  const assistantData = useMemo(() => {
    // 1. Recent Activities from actual system audit log
    let recentActivities = [
      { id: 'act-1', title: 'Session initialized & verified securely.', category: 'IAM', status: 'SUCCESS', time: 'Just now' },
      { id: 'act-2', title: 'Centralized database sync complete.', category: 'SYSTEM', status: 'INFO', time: '3m ago' },
      { id: 'act-3', title: 'Daily attendance ledger submitted.', category: 'ATTENDANCE', status: 'SUCCESS', time: '12m ago' }
    ];
    try {
      const logs = localStorage.getItem('sams_security_audit_logs');
      if (logs) {
        const parsed = JSON.parse(logs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          recentActivities = parsed.slice(0, 5).map((log: any, idx) => ({
            id: log.id || `act-log-${idx}`,
            title: log.message || 'Audit event triggered',
            category: log.category || 'IAM',
            status: log.status || 'INFO',
            time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
          }));
        }
      }
    } catch (e) {}

    // 2. Pending Approvals tailored by role
    let pendingApprovals = [
      { id: 'app-1', title: 'Teacher Medical Leave', description: 'Adeyemi T. (3 Days)', targetTab: 'teachers', subId: 'staff_directory' },
      { id: 'app-2', title: 'New Admissions Intake', description: 'Amina Bello (Grade 10)', targetTab: 'admission', subId: 'admissions_hub' },
      { id: 'app-3', title: 'Grade Moderation Release', description: 'Term 1 CA Results Review', targetTab: 'grades', subId: 'results_cards' }
    ];
    if (effectiveRole === 'Teacher') {
      pendingApprovals = [
        { id: 'app-t1', title: 'Homework Grading Verification', description: 'Grade 10 Physics homework', targetTab: 'grades', subId: 'results_entry' },
        { id: 'app-t2', title: 'Class attendance waiver review', description: 'Student absent request approval', targetTab: 'attendance_desk', subId: 'attendance_student' }
      ];
    } else if (effectiveRole === 'Accountant') {
      pendingApprovals = [
        { id: 'app-a1', title: 'Tuition Fee Discount Claim', description: 'SAMS-ADM-924 Waiver Application', targetTab: 'financial_settings', subId: 'financial_structures' },
        { id: 'app-a2', title: 'Restock Voucher Authorization', description: 'Laboratory equipment procurement', targetTab: 'financial_settings', subId: 'financial_expenses_reports' }
      ];
    } else if (effectiveRole === 'Parent') {
      pendingApprovals = [
        { id: 'app-p1', title: 'Sign Enrollment Contract', description: 'Academic terms of service', targetTab: 'parent', subId: 'comm_notices' }
      ];
    }

    // 3. Overdue Tasks tailored by role
    let overdueTasks = [
      { id: 'tsk-1', title: 'Verify Term 2 syllabus readiness', category: 'ACADEMICS', targetTab: 'classes', subId: 'academics_curriculum', days: '2d overdue' },
      { id: 'tsk-2', title: 'Reconcile weekly cash log entries', category: 'FINANCIAL', targetTab: 'financial_settings', subId: 'financial_billing_hub', days: '1d overdue' },
      { id: 'tsk-3', title: 'Uniform inventory threshold update', category: 'INVENTORY', targetTab: 'inventory', subId: 'inventory_stores', days: '3d overdue' }
    ];
    if (effectiveRole === 'Teacher') {
      overdueTasks = [
        { id: 'tsk-t1', title: 'Upload weekly lesson structure', category: 'ACADEMICS', targetTab: 'classes', subId: 'academics_curriculum', days: '1d overdue' },
        { id: 'tsk-t2', title: 'Grade Grade 12 Mock Test results', category: 'GRADES', targetTab: 'grades', subId: 'results_entry', days: '4d overdue' }
      ];
    } else if (effectiveRole === 'Accountant') {
      overdueTasks = [
        { id: 'tsk-a1', title: 'Submit quarterly branch payroll audit', category: 'FINANCIAL', targetTab: 'teachers', subId: 'staff_payroll', days: '2d overdue' },
        { id: 'tsk-a2', title: 'Outstanding fee collection follow-up', category: 'FINANCIAL', targetTab: 'financial_settings', subId: 'financial_billing_hub', days: '1d overdue' }
      ];
    } else if (effectiveRole === 'Parent') {
      overdueTasks = [
        { id: 'tsk-p1', title: 'Submit childhood immunisation chart', category: 'MEDICAL', targetTab: 'parent', subId: 'comm_notices', days: '5d overdue' },
        { id: 'tsk-p2', title: 'Clear outstanding balance installment', category: 'PARENT', targetTab: 'parent', subId: 'comm_notices', days: '3d overdue' }
      ];
    }

    // 4. Upcoming Events
    const upcomingEvents = [
      { id: 'evt-1', title: 'SAMS Central Board Examination', date: 'Jul 21', time: '09:00 AM' },
      { id: 'evt-2', title: 'Proprietor & Principal Progress Review', date: 'Jul 22', time: '11:30 AM' },
      { id: 'evt-3', title: 'PTA General Term Assembly', date: 'Jul 25', time: '03:00 PM' }
    ];

    // 5. Financial Alerts
    let financialAlerts = [
      { id: 'fin-1', type: 'CRITICAL', msg: '₦12,450,000 outstanding across active branches.' },
      { id: 'fin-2', type: 'WARNING', msg: 'Supplier invoice #SUP-492 exceeded 30-day term.' },
      { id: 'fin-3', type: 'INFO', msg: 'June tax ledger generated awaiting board export.' }
    ];
    if (effectiveRole === 'Parent') {
      financialAlerts = [
        { id: 'fin-p1', type: 'CRITICAL', msg: 'Tuition installment overdue: ₦250,000 balance.' },
        { id: 'fin-p2', type: 'INFO', msg: 'Optional school bus transport invoice available.' }
      ];
    }

    // 6. Attendance Alerts
    let attendanceAlerts = [
      { id: 'att-1', type: 'CRITICAL', msg: 'Grade 10 Math attendance outlier: 14% absentee spike today.' },
      { id: 'att-2', type: 'WARNING', msg: '3 Teacher late sign-ins logged without class cover.' }
    ];
    if (effectiveRole === 'Parent') {
      attendanceAlerts = [
        { id: 'att-p1', type: 'WARNING', msg: 'Late sign-in logged for student on Jul 18 (08:24 AM).' }
      ];
    }

    // 7. Low Stock Alerts
    const lowStockAlerts = [
      { id: 'stk-1', item: 'Introductory Chemistry Kit', stock: 12, threshold: 15, unit: 'kits' },
      { id: 'stk-2', item: 'Secondary School Blazer (Navy, M)', stock: 8, threshold: 10, unit: 'units' },
      { id: 'stk-3', item: 'SAMS Custom Embossed Notebooks', stock: 45, threshold: 50, unit: 'packs' }
    ];

    // 8. Unread Notifications
    const unreadNotifications = [
      { id: 'ntf-1', text: 'Parent Request: Requesting boarding installment schedule adjustments.', source: 'Parent Portal' },
      { id: 'ntf-2', text: 'Infrastructure verification: Port 3000 container healthy and responsive.', source: 'System Core' },
      { id: 'ntf-3', text: 'Academic readiness alert: Syllabus compliance at 92% complete.', source: 'Head Teacher' }
    ];

    // 9. Frequently Used Modules (from persistent click stats)
    const frequentlyUsedList: string[] = [];
    try {
      const topList: { id: string; count: number }[] = [];
      for (const m of modules) {
        for (const s of m.submenu) {
          const key = `sams_module_click_count_${s.id}`;
          const count = parseInt(localStorage.getItem(key) || '0', 10);
          if (count > 0) {
            topList.push({ id: s.id, count });
          }
        }
      }
      topList.sort((a, b) => b.count - a.count);
      
      // Fallback defaults based on role if no modules have been clicked yet
      if (topList.length === 0) {
        if (effectiveRole.includes('Admin') || effectiveRole === 'Proprietor') {
          frequentlyUsedList.push('dashboard_exec', 'admin_audit', 'ops_dashboard');
        } else if (effectiveRole === 'Teacher') {
          frequentlyUsedList.push('results_entry', 'academics_curriculum');
        } else if (effectiveRole === 'Accountant') {
          frequentlyUsedList.push('financial_billing_hub', 'financial_structures');
        } else {
          frequentlyUsedList.push('dashboard_exec', 'students_directory');
        }
      } else {
        topList.slice(0, 3).forEach(item => frequentlyUsedList.push(item.id));
      }
    } catch (e) {}

    return {
      recentActivities,
      pendingApprovals,
      overdueTasks,
      upcomingEvents,
      financialAlerts,
      attendanceAlerts,
      lowStockAlerts,
      unreadNotifications,
      frequentlyUsed: frequentlyUsedList
    };
  }, [effectiveRole, modules]);

  // Auto-expand modules when search query is entered in sidebar
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedModuleIds(filteredModules.map(m => m.id));
    }
  }, [searchQuery, filteredModules]);

  // Handle module header clicks (expand accordion)
  const handleModuleClick = (mod: PrimaryModule) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedModuleIds([mod.id]);
      return;
    }

    setExpandedModuleIds(prev => 
      prev.includes(mod.id) 
        ? prev.filter(id => id !== mod.id) 
        : [...prev, mod.id]
    );
  };

  // Handle specific submenu item click
  const handleSubmenuClick = (sub: SubmenuItem) => {
    // Check if view is locked for current role
    if (isTabRestricted(sub.mappedTab, effectiveRole)) {
      alert(`🔒 ACCESS RESTRICTED: Your authenticated role "${effectiveRole}" does not have privileges to access the "${sub.name}" sub-function.\n\nPlease contact the School Administrator to update access permissions.`);
      return;
    }

    // Click count tracking for Smart Operational Assistant
    try {
      const countKey = `sams_module_click_count_${sub.id}`;
      const currentCount = parseInt(localStorage.getItem(countKey) || '0', 10);
      localStorage.setItem(countKey, (currentCount + 1).toString());
    } catch (e) {}

    // Apply states
    setSelectedSubmenuId(sub.id);
    setActiveTab(sub.mappedTab);
    if (onSubmenuSelect) {
      onSubmenuSelect(sub.id);
    }
    
    // Close mobile drawer on item select
    setIsMobileOpen(false);
  };

  // Render main body of sidebar
  const renderSidebarElements = () => (
    <div className="flex flex-col h-full bg-white text-slate-800 font-sans relative">
      
      {/* SAMS BRAND HEADER */}
      <div className={`p-4 md:p-5 border-b border-slate-100 flex items-center justify-between ${isCollapsed ? 'justify-center px-1' : ''}`}>
        {!isCollapsed ? (
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/15 shrink-0">
              <span className="font-black text-white text-base">S</span>
            </div>
            <div className="truncate">
              <h2 className="text-sm font-black tracking-tight text-slate-950 uppercase leading-none">SAMS PORTAL</h2>
              <span className="text-[9px] text-slate-400 font-bold tracking-wider block mt-1 uppercase font-mono">Multi-Branch SaaS</span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <span className="font-black text-white text-base">S</span>
          </div>
        )}
      </div>

      {/* SIDEBAR VIEW SELECTOR TABS */}
      {!isCollapsed ? (
        <div className="flex px-4 py-2 border-b border-slate-150 dark:border-slate-800 space-x-1 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
          <button
            type="button"
            onClick={() => setActiveSidebarTab('modules')}
            className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer ${
              activeSidebarTab === 'modules'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-indigo-950/40'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 mr-1.5 text-indigo-500 shrink-0" />
            Modules
          </button>
          <button
            type="button"
            onClick={() => setActiveSidebarTab('assistant')}
            className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all relative cursor-pointer ${
              activeSidebarTab === 'assistant'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-indigo-950/40'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-500 shrink-0 animate-pulse" />
            Assistant
            <span className="absolute top-1 right-1.5 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
            </span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-2.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/40 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsCollapsed(false);
              setActiveSidebarTab('modules');
            }}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              activeSidebarTab === 'modules'
                ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Switch to ERP Modules"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCollapsed(false);
              setActiveSidebarTab('assistant');
            }}
            className={`p-1.5 rounded-lg transition-all relative cursor-pointer ${
              activeSidebarTab === 'assistant'
                ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Switch to Smart Assistant"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="absolute top-0.5 right-0.5 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
            </span>
          </button>
        </div>
      )}

      {/* QUICK TREE SEARCH (Hidden if collapsed or in assistant tab) */}
      {!isCollapsed && activeSidebarTab === 'modules' && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ERP tree..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/60 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 13 MODULES ACCORDION LIST */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-100 dark:scrollbar-thumb-slate-800">
        
        {activeSidebarTab === 'assistant' ? (
          /* ========================================================
             🤖 SAMS SMART OPERATIONAL ASSISTANT WORKSPACE
             ======================================================== */
          <div className="space-y-4 px-1.5 pb-6">
            
            {/* COGNITIVE CONTEXT SPEECH BUBBLE */}
            <div className="bg-gradient-to-br from-indigo-500/15 via-purple-500/5 to-transparent rounded-2xl p-3 border border-indigo-500/20 dark:border-indigo-500/10 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-950 dark:text-slate-100 leading-tight">SAMS Operational Copilot</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal mt-1 font-medium">
                    Welcome, <span className="font-bold text-indigo-600 dark:text-indigo-400">{effectiveRole}</span>! This automated control room summarizes the institutional events requiring your attention today.
                  </p>
                </div>
              </div>
            </div>

            {/* CATEGORY 1: 🚨 CRITICAL ALERTS */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1 px-1 text-[9px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400/90">
                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                <span>Priority Indicators &amp; Alerts</span>
              </div>

              {/* Financial Alerts */}
              {assistantData.financialAlerts.map(alert => (
                <div 
                  key={alert.id}
                  onClick={() => handleAssistantAction(effectiveRole === 'Parent' ? 'parent' : 'students', effectiveRole === 'Parent' ? 'students_financial' : 'financial_payments')}
                  className="p-2.5 rounded-xl bg-rose-50/45 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 border border-rose-100/70 dark:border-rose-900/30 text-[10px] flex items-start space-x-2 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-rose-800 dark:text-rose-400 flex items-center">
                      <span className="px-1 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-mono text-[7px] font-bold uppercase tracking-wider mr-1 shrink-0">Financial</span>
                      {alert.type}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-normal mt-0.5">{alert.msg}</p>
                  </div>
                </div>
              ))}

              {/* Attendance Alerts */}
              {assistantData.attendanceAlerts.map(alert => (
                <div 
                  key={alert.id}
                  onClick={() => handleAssistantAction(effectiveRole === 'Parent' ? 'parent' : 'attendance_desk', effectiveRole === 'Parent' ? 'students_profile' : 'attendance_student')}
                  className="p-2.5 rounded-xl bg-amber-50/45 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 border border-amber-100/70 dark:border-amber-900/30 text-[10px] flex items-start space-x-2 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-amber-800 dark:text-amber-400 flex items-center">
                      <span className="px-1 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-mono text-[7px] font-bold uppercase tracking-wider mr-1 shrink-0">Attendance</span>
                      {alert.type}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-normal mt-0.5">{alert.msg}</p>
                  </div>
                </div>
              ))}

              {/* Low Stock Alerts */}
              {(effectiveRole.includes('Admin') || effectiveRole === 'Store Manager' || effectiveRole === 'Accountant' || effectiveRole === 'Proprietor') && (
                <div className="space-y-1.5">
                  {assistantData.lowStockAlerts.map(alert => (
                    <div 
                      key={alert.id}
                      onClick={() => handleAssistantAction('inventory', 'inventory_levels')}
                      className="p-2.5 rounded-xl bg-orange-50/40 hover:bg-orange-50 dark:bg-orange-950/10 dark:hover:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 text-[10px] flex items-start space-x-2 transition-all cursor-pointer hover:scale-[1.01]"
                    >
                      <Package className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-orange-800 dark:text-orange-400 flex items-center">
                          <span className="px-1 py-0.5 rounded bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 font-mono text-[7px] font-bold uppercase tracking-wider mr-1 shrink-0">Low Stock</span>
                          REORDER LIST
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 font-medium leading-normal mt-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{alert.item}</span>: <span className="font-black text-rose-600 dark:text-rose-400">{alert.stock}</span> {alert.unit} remaining (Min: {alert.threshold}).
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Unread Notifications */}
              <div className="space-y-1.5">
                {assistantData.unreadNotifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => handleAssistantAction(effectiveRole === 'Parent' ? 'parent' : 'communication', effectiveRole === 'Parent' ? 'students_profile' : 'comm_parent_notif')}
                    className="p-2.5 rounded-xl bg-blue-50/40 hover:bg-blue-50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[10px] flex items-start space-x-2 transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    <Bell className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5 animate-bounce" />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-blue-800 dark:text-blue-400 flex items-center justify-between">
                        <span>UNREAD NOTIFICATION</span>
                        <span className="text-[7px] text-blue-500 dark:text-blue-400 font-mono uppercase tracking-wider font-bold">{notif.source}</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 font-medium leading-normal mt-0.5 truncate">{notif.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CATEGORY 2: 📋 OPERATIONS & CHECKS */}
            <div className="space-y-2 pt-1.5 border-t border-slate-150 dark:border-slate-800">
              <div className="flex items-center space-x-1 px-1 text-[9px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400/90">
                <CheckSquare className="w-3 h-3 text-indigo-500" />
                <span>Operational Action Queue</span>
              </div>

              {/* Pending Approvals */}
              <div className="space-y-1.5">
                <p className="px-1 text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Awaiting Your Approval</p>
                {assistantData.pendingApprovals.map(app => (
                  <div 
                    key={app.id}
                    onClick={() => handleAssistantAction(app.targetTab, app.subId)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/60 dark:bg-slate-900/20 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-900/40 border border-slate-200 dark:border-slate-800 text-[10px] flex items-start space-x-2 transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200">{app.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-medium leading-normal mt-0.5">{app.description}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-450 shrink-0 self-center" />
                  </div>
                ))}
              </div>

              {/* Overdue Tasks */}
              <div className="space-y-1.5">
                <p className="px-1 text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overdue Tasks</p>
                {assistantData.overdueTasks.map(tsk => (
                  <div 
                    key={tsk.id}
                    onClick={() => handleAssistantAction(tsk.targetTab, tsk.subId)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50/40 dark:bg-slate-900/20 dark:hover:bg-rose-950/10 hover:border-rose-200 dark:hover:border-rose-900/40 border border-slate-200 dark:border-slate-800 text-[10px] flex items-start space-x-2 transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>{tsk.title}</span>
                        <span className="px-1 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-mono text-[7px] font-extrabold uppercase shrink-0 ml-1">{tsk.days}</span>
                      </p>
                      <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mt-0.5">{tsk.category}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming Events */}
              <div className="space-y-1.5">
                <p className="px-1 text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Upcoming Schedule</p>
                {assistantData.upcomingEvents.map(evt => (
                  <div 
                    key={evt.id}
                    onClick={() => handleAssistantAction(effectiveRole === 'Parent' ? 'parent' : 'calendar', 'ops_calendar')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/20 dark:hover:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[10px] flex items-start space-x-2 transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200">{evt.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-medium leading-normal mt-0.5 flex items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300 mr-1.5">{evt.date}</span>
                        <span className="text-[9px] text-slate-400">•</span>
                        <span className="ml-1.5 text-slate-400">{evt.time}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CATEGORY 3: 🕒 ACTIVITY & TELEMETRY */}
            <div className="space-y-2 pt-1.5 border-t border-slate-150 dark:border-slate-800">
              <div className="flex items-center space-x-1 px-1 text-[9px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400/90">
                <Activity className="w-3 h-3 text-emerald-500" />
                <span>Operational Telemetry</span>
              </div>

              {/* Frequently Used Modules */}
              <div className="space-y-1">
                <p className="px-1 text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
                  <MousePointerClick className="w-2.5 h-2.5 text-slate-450 mr-1 shrink-0" />
                  Frequently Used Modules
                </p>
                <div className="space-y-0.5">
                  {assistantData.frequentlyUsed.map(id => {
                    let foundSub: SubmenuItem | null = null;
                    let foundMod: PrimaryModule | null = null;
                    for (const m of modules) {
                      const s = m.submenu.find(sub => sub.id === id);
                      if (s) {
                        foundSub = s;
                        foundMod = m;
                        break;
                      }
                    }
                    if (!foundSub || !foundMod) return null;
                    const isSubActive = selectedSubmenuId === foundSub.id;
                    
                    return (
                      <button
                        key={`frequent-assistant-${foundSub.id}`}
                        type="button"
                        onClick={() => handleSubmenuClick(foundSub!)}
                        className={`w-full flex items-center justify-between rounded-lg py-1.5 px-2 text-left text-xs transition-all duration-150 cursor-pointer ${
                          isSubActive
                            ? 'bg-indigo-50/80 text-indigo-700 font-extrabold border-r-2 border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                            : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/40 hover:text-slate-950 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 flex flex-col text-left">
                          <span className="whitespace-normal break-words leading-tight font-semibold text-slate-700 dark:text-slate-200">{foundSub.name}</span>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5 font-medium whitespace-normal break-words">{foundMod.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recently Opened Pages */}
              {recentlyVisited.length > 0 && (
                <div className="space-y-1">
                  <p className="px-1 text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
                    <History className="w-2.5 h-2.5 text-slate-450 mr-1 shrink-0" />
                    Recently Opened Pages
                  </p>
                  <div className="space-y-0.5">
                    {recentlyVisited.map(id => {
                      let foundSub: SubmenuItem | null = null;
                      let foundMod: PrimaryModule | null = null;
                      for (const m of modules) {
                        const s = m.submenu.find(sub => sub.id === id);
                        if (s) {
                          foundSub = s;
                          foundMod = m;
                          break;
                        }
                      }
                      if (!foundSub || !foundMod) return null;
                      const isSubActive = selectedSubmenuId === foundSub.id;

                      return (
                        <button
                          key={`recent-assistant-visited-${foundSub.id}`}
                          type="button"
                          onClick={() => handleSubmenuClick(foundSub!)}
                          className={`w-full flex items-center justify-between rounded-lg py-1.5 px-2 text-left text-xs transition-all duration-150 cursor-pointer ${
                            isSubActive
                              ? 'bg-indigo-50/80 text-indigo-700 font-extrabold border-r-2 border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                              : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/40 hover:text-slate-950 dark:hover:text-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1 flex flex-col text-left">
                            <span className="whitespace-normal break-words leading-tight font-semibold text-slate-700 dark:text-slate-200">{foundSub.name}</span>
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5 font-medium whitespace-normal break-words">{foundMod.name}</span>
                          </div>
                          <History className="w-3 h-3 text-slate-400 dark:text-slate-550 shrink-0 ml-1.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Activities Feed */}
              <div className="space-y-1.5">
                <p className="px-1 text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Live Activity Feed</p>
                <div className="space-y-1.5">
                  {assistantData.recentActivities.map(act => (
                    <div key={act.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800 text-[9px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`px-1 py-0.5 rounded text-[6px] font-bold uppercase tracking-wider ${
                          act.status === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400' :
                          act.status === 'WARNING' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400' :
                          act.status === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400' : 'bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>{act.category}</span>
                        <span className="text-slate-400 dark:text-slate-550 font-mono text-[7px]">{act.time}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-medium leading-tight">{act.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================
             🧭 STANDARD ERP MODULES DIRECTORY MAP
             ======================================================== */
          <>
            {/* ⭐ PERSONALIZATION TRIGGER FOR SIDEBAR */}
        {isCollapsed ? (
          <div className="flex justify-center pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <button
              type="button"
              onClick={onOpenPersonalization}
              className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all cursor-pointer border border-indigo-150/40 dark:border-indigo-900/30 shadow-xs"
              title="Personalize Workspace"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenPersonalization}
            className="w-full flex items-center justify-between rounded-xl p-2.5 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 hover:from-indigo-100/80 hover:to-purple-100/80 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-150/40 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer mb-3"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse shrink-0" />
              <div className="text-left min-w-0">
                <p className="leading-none text-slate-800 dark:text-slate-200 font-extrabold text-xs">Personalize Nav</p>
                <p className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-1 truncate">Themes, pins & shortcuts</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          </button>
        )}

        {/* EXPAND ALL / COLLAPSE ALL CONTROLS */}
        {!isCollapsed && (
          <div className="px-2 pb-2.5 mb-1.5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wide uppercase">
            <span>SAMS Navigation Map</span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleExpandAll}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold border-none! shadow-none! bg-transparent! p-0 cursor-pointer"
                title="Expand all accordions"
              >
                Expand All
              </button>
              <span className="text-slate-200 dark:text-slate-800">|</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold border-none! shadow-none! bg-transparent! p-0 cursor-pointer"
                title="Collapse all accordions"
              >
                Collapse All
              </button>
            </div>
          </div>
        )}

        {/* ⭐ STARRED FAVORITES SECTION */}
        {favourites.length > 0 && !isCollapsed && (
          <div className="pb-3 mb-2 border-b border-slate-150 dark:border-slate-800 space-y-1">
            <div className="px-2 text-[10px] font-extrabold text-amber-500 dark:text-amber-400/80 uppercase tracking-widest flex items-center space-x-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500 animate-pulse" />
              <span>Favourites ({favourites.length})</span>
            </div>
            <div className="space-y-0.5">
              {favourites.map(id => {
                let foundSub: SubmenuItem | null = null;
                let foundMod: PrimaryModule | null = null;
                for (const m of modules) {
                  const s = m.submenu.find(sub => sub.id === id);
                  if (s) {
                    foundSub = s;
                    foundMod = m;
                    break;
                  }
                }
                if (!foundSub || !foundMod) return null;
                const isSubActive = selectedSubmenuId === foundSub.id;
                
                return (
                  <button
                    key={`fav-sidebar-${foundSub.id}`}
                    type="button"
                    onClick={() => handleSubmenuClick(foundSub!)}
                    className={`w-full flex items-center justify-between rounded-lg py-1.5 px-2 text-left text-xs transition-all duration-150 cursor-pointer ${
                      isSubActive
                        ? 'bg-amber-50/80 text-amber-700 font-extrabold border-r-2 border-amber-500 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex flex-col text-left">
                      <span className="whitespace-normal break-words leading-tight font-semibold text-slate-700 dark:text-slate-200">{foundSub.name}</span>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5 font-medium whitespace-normal break-words">{foundMod.name}</span>
                    </div>
                    <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0 ml-1.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ⚡ QUICK SHORTCUTS SIDEBAR SECTION */}
        {quickShortcuts && quickShortcuts.length > 0 && !isCollapsed && (
          <div className="pb-3 mb-2 border-b border-slate-150 dark:border-slate-800 space-y-1">
            <div className="px-2 text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400/80 uppercase tracking-widest flex items-center space-x-1">
              <Zap className="w-3 h-3 text-indigo-500 fill-indigo-400" />
              <span>Quick Shortcuts ({quickShortcuts.length})</span>
            </div>
            <div className="space-y-0.5">
              {quickShortcuts.map(id => {
                let foundSub: SubmenuItem | null = null;
                let foundMod: PrimaryModule | null = null;
                for (const m of SAMS_MODULES) {
                  const s = m.submenu.find(sub => sub.id === id);
                  if (s) {
                    foundSub = s;
                    foundMod = m;
                    break;
                  }
                }
                if (!foundSub || !foundMod) return null;
                const isSubActive = selectedSubmenuId === foundSub.id;
                
                return (
                  <button
                    key={`shortcut-sidebar-${foundSub.id}`}
                    type="button"
                    onClick={() => handleSubmenuClick(foundSub!)}
                    className={`w-full flex items-center justify-between rounded-lg py-1.5 px-2 text-left text-xs transition-all duration-150 cursor-pointer ${
                      isSubActive
                        ? 'bg-indigo-50/80 text-indigo-700 font-extrabold border-r-2 border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex flex-col text-left">
                      <span className="whitespace-normal break-words leading-tight font-semibold text-slate-700 dark:text-slate-200">{foundSub.name}</span>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5 font-medium whitespace-normal break-words">{foundMod.name}</span>
                    </div>
                    <Zap className="w-3 h-3 text-indigo-500 fill-indigo-400 shrink-0 ml-1.5 animate-pulse" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 🕒 RECENTLY NAVIGATED SECTION */}
        {recentlyVisited.length > 0 && !isCollapsed && (
          <div className="pb-3 mb-2 border-b border-slate-150 dark:border-slate-800 space-y-1">
            <div className="px-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center space-x-1">
              <History className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span>Recently Visited</span>
            </div>
            <div className="space-y-0.5">
              {recentlyVisited.map(id => {
                let foundSub: SubmenuItem | null = null;
                let foundMod: PrimaryModule | null = null;
                for (const m of modules) {
                  const s = m.submenu.find(sub => sub.id === id);
                  if (s) {
                    foundSub = s;
                    foundMod = m;
                    break;
                  }
                }
                if (!foundSub || !foundMod) return null;
                const isSubActive = selectedSubmenuId === foundSub.id;

                return (
                  <button
                    key={`rec-sidebar-${foundSub.id}`}
                    type="button"
                    onClick={() => handleSubmenuClick(foundSub!)}
                    className={`w-full flex items-center justify-between rounded-lg py-1.5 px-2 text-left text-xs transition-all duration-150 cursor-pointer ${
                      isSubActive
                        ? 'bg-indigo-50/80 text-indigo-600 font-extrabold border-r-2 border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex flex-col text-left">
                      <span className="whitespace-normal break-words leading-tight font-semibold text-slate-700 dark:text-slate-200">{foundSub.name}</span>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5 font-medium whitespace-normal break-words">{foundMod.name}</span>
                    </div>
                    <History className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0 ml-1.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filteredModules.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-slate-400">
            No active ERP modules match query.
          </div>
        ) : (
          filteredModules.map((mod) => {
            const IconComponent = mod.icon;
            // A primary module is active/selected if any of its submenu items are active
            const isModuleSelected = mod.submenu.some(sub => sub.id === selectedSubmenuId);
            const isExpanded = expandedModuleIds.includes(mod.id) && !isCollapsed;

            return (
              <div key={mod.id} className="space-y-0.5" id={`module-group-${mod.id}`}>
                
                {/* PRIMARY MODULE ACCORDION HEADER */}
                <button
                  type="button"
                  onClick={() => handleModuleClick(mod)}
                  className={`w-full flex items-center justify-between rounded-xl p-2.5 text-left transition-all duration-200 group relative cursor-pointer ${
                    isModuleSelected 
                      ? 'bg-indigo-600 text-indigo-700 font-bold' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={mod.name}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isModuleSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                      <IconComponent className="w-4.5 h-4.5 shrink-0" />
                    </div>
                    {!isCollapsed && (
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-200">{mod.name}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-550 leading-normal mt-0.5 font-medium whitespace-normal break-words">{mod.description}</p>
                      </div>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="shrink-0 flex items-center space-x-1 text-slate-400 pl-1">
                      {isModuleSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse mr-0.5" />
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'transform rotate-180 text-indigo-500' : ''}`} />
                    </div>
                  )}

                  {/* MINI COLLAPSED TOOLTIP WITH SUBMENU LIST OUTLINE */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 bg-slate-900 text-white text-xs p-4 rounded-2xl border border-slate-800 shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none whitespace-nowrap z-50 min-w-56">
                      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 mb-2">
                        <div className="p-1.5 bg-slate-800 rounded-lg text-indigo-400">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-black text-white text-sm">{mod.name}</div>
                          <div className="text-[9px] text-slate-500 font-medium">{mod.description}</div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Sub-functions ({mod.submenu.length}):</p>
                        {mod.submenu.slice(0, 5).map(sub => (
                          <div key={sub.id} className="flex items-center space-x-1.5 text-[10px] text-slate-300">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                            <span className="font-semibold">{sub.name}</span>
                          </div>
                        ))}
                        {mod.submenu.length > 5 && (
                          <p className="text-[9px] text-slate-500 italic pl-2.5">and {mod.submenu.length - 5} more functions</p>
                        )}
                      </div>
                    </div>
                  )}
                </button>

                {/* DETAILED SUBMENU LIST */}
                {!isCollapsed && (
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-5 pr-2 py-0.5 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 ml-4"
                      >
                        {mod.submenu.map((sub) => {
                          const isSubActive = selectedSubmenuId === sub.id;
                          const isLocked = isTabRestricted(sub.mappedTab, effectiveRole);
                          const isFav = favourites.includes(sub.id);

                          return (
                            <div
                              key={sub.id}
                              className={`group/sub w-full flex items-center justify-between rounded-lg py-1.5 px-2.5 text-left text-xs transition-all duration-150 cursor-pointer ${
                                isSubActive
                                  ? 'bg-indigo-50/80 text-indigo-600 font-extrabold border-r-2 border-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800/40'
                              }`}
                              onClick={() => handleSubmenuClick(sub)}
                            >
                              <div className="min-w-0 flex flex-col flex-1 py-0.5">
                                <span className="whitespace-normal break-words leading-tight font-bold text-slate-700 dark:text-slate-200">{sub.name}</span>
                                <span className="text-[9.5px] text-slate-400 dark:text-slate-550 leading-normal mt-0.5 font-medium whitespace-normal break-words">{sub.description}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavourite(sub.id);
                                  }}
                                  className={`p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-all cursor-pointer m-0! shadow-none! border-none! bg-transparent! ${
                                    isFav ? 'opacity-100 text-amber-500' : 'opacity-0 group-hover/sub:opacity-100'
                                  }`}
                                  title={isFav ? "Remove from Favourites" : "Add to Favourites"}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                                </button>
                                
                                {isLocked ? (
                                  <Lock className="w-3 h-3 text-rose-500 shrink-0" />
                                ) : (
                                  isSubActive && <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

              </div>
            );
          })
        )}
          </>
        )}
      </div>

      {/* FOOTER RESET CONTROL */}
      <div className="p-3 border-t border-slate-150/50 bg-slate-50/30">
        {!isCollapsed && (
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-slate-600">Storage Synced</span>
            </div>
            <button 
              id="btn-reset-db"
              type="button"
              onClick={onForceReset}
              className="text-[9px] text-slate-400 hover:text-indigo-600 underline font-mono cursor-pointer bg-transparent border-none p-0 shadow-none hover:bg-transparent!"
              title="Factory reset database to original demo state"
            >
              Reset
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="text-[10px] text-slate-400 font-medium px-1">
              <p className="font-mono">{systemUsersCount} roles active</p>
            </div>
          )}
          
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ml-auto shadow-none! border-none!"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Sliders className="w-3 h-3 transform rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE BAR (Top-pinned on smaller devices) */}
      <div className="md:hidden bg-white text-slate-800 px-4 py-3.5 flex items-center justify-between border-b border-slate-200 shadow-xs shrink-0 select-none">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <span className="font-extrabold text-white text-base">S</span>
          </div>
          <div>
            <h2 className="text-xs font-black tracking-tight text-slate-900 uppercase leading-none">SAMS Portal</h2>
            <span className="text-[8px] text-slate-400 font-mono tracking-wider uppercase block mt-0.5">SaaS Framework</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Drawer Body */}
          <div className="relative w-80 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-fade-in">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer z-20"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1 h-full overflow-hidden">
              {renderSidebarElements()}
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP/TABLET STATIC SIDEBAR */}
      <nav 
        id="erp-sidebar" 
        className={`hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out shrink-0 select-none ${
          isCollapsed ? 'collapsed' : ''
        }`}
      >
        <div className="flex-1 h-full overflow-hidden">
          {renderSidebarElements()}
        </div>
      </nav>
    </>
  );
};
