import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  UserCheck, 
  Users, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  ArrowLeftRight, 
  Search, 
  Filter, 
  Plus, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  UserPlus, 
  Sparkles, 
  Eye, 
  Clock, 
  Calendar, 
  Layers, 
  Sliders, 
  X, 
  RotateCcw,
  FileSpreadsheet,
  AlertTriangle,
  BadgeCheck,
  ChevronRight,
  School,
  Mail,
  Phone,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { 
  EmployeeBranchHistory, 
  EmployeeIdConfig, 
  EmployeeAuditLogEntry, 
  EmploymentStatus, 
  UserAccountStatus 
} from '../types/employeeIdentity';
import { 
  generateNextEmployeeId, 
  generateNextUserId, 
  logEmployeeAuditEvent, 
  loadEmployeeAuditLogs, 
  loadEmployeeIdConfigs, 
  saveEmployeeIdConfigs,
  formatBranchName,
  getAuthorizedBranches
} from '../utils/employeeIdentityUtils';

interface EmployeeUserAccountsConsoleProps {
  teachers: any[];
  setTeachers: React.Dispatch<React.SetStateAction<any[]>>;
  systemUsers: any[];
  setSystemUsers: React.Dispatch<React.SetStateAction<any[]>>;
  currentSimulatedRole: string;
  setCurrentSimulatedRole: (role: string) => void;
  selectedBranch: 'GN' | 'RS' | 'All';
  setSelectedBranch: (branch: any) => void;
  addAuditLog: (user: string, action: string, details: string, status?: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO') => void;
  onSelectTeacherForView?: (teacher: any) => void;
}

export const EmployeeUserAccountsConsole: React.FC<EmployeeUserAccountsConsoleProps> = ({
  teachers,
  setTeachers,
  systemUsers,
  setSystemUsers,
  currentSimulatedRole,
  setCurrentSimulatedRole,
  selectedBranch,
  setSelectedBranch,
  addAuditLog,
  onSelectTeacherForView
}) => {
  // Navigation sub-tabs within Employee Accounts Console
  const [activeConsoleTab, setActiveConsoleTab] = useState<'employees' | 'transfers' | 'id_config' | 'audit_trail'>('employees');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<'ALL' | 'GN' | 'RS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showIdConfigModal, setShowIdConfigModal] = useState(false);

  // Selected employee for modal operations
  const [activeEmployee, setActiveEmployee] = useState<any | null>(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<EmployeeAuditLogEntry[]>(() => loadEmployeeAuditLogs());

  // ID Config state
  const [idConfigs, setIdConfigs] = useState<EmployeeIdConfig[]>(() => loadEmployeeIdConfigs());

  // Form states
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    email: '',
    phone: '',
    branch: 'RS',
    position: 'Academic Teacher',
    department: 'Science & Mathematics',
    qualification: 'B.Ed / B.Sc Education',
    level: ['primary'] as string[],
    role: 'Teacher',
    createAccount: true,
    accountRole: 'Teacher',
    multiBranch: false,
    additionalBranches: [] as string[],
    password: 'sams123'
  });

  const [transferForm, setTransferForm] = useState({
    targetBranch: 'GN',
    transferDate: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    transferReason: 'Departmental Faculty Reallocation',
    authorizedBy: 'Engr. Usamah M. Qamar (Super Administrator)',
    notes: 'Approved during Q3 Administrative Review'
  });

  const [statusForm, setStatusForm] = useState({
    status: 'Active' as EmploymentStatus,
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    authorizedBy: 'Super Administrator'
  });

  const [accountForm, setAccountForm] = useState({
    email: '',
    role: 'Teacher',
    status: 'Active' as UserAccountStatus,
    primaryBranch: 'RS',
    additionalBranches: [] as string[],
    password: 'sams123'
  });

  // Reload audit logs helper
  const refreshAuditLogs = () => {
    setAuditLogs(loadEmployeeAuditLogs());
  };

  // Helper to get linked user account for an employee
  const getLinkedUser = (teacher: any) => {
    if (!teacher) return null;
    return systemUsers.find(u => 
      (teacher.employeeId && u.employeeId === teacher.employeeId) || 
      (teacher.userId && u.id === teacher.userId) || 
      (teacher.email && u.email.toLowerCase() === teacher.email.toLowerCase())
    ) || null;
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return teachers.filter(emp => {
      // Branch filter
      if (branchFilter !== 'ALL' && emp.branch !== branchFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL') {
        const empStatus = emp.employmentStatus || emp.status || 'Active';
        if (empStatus !== statusFilter) return false;
      }
      // Role filter
      if (roleFilter !== 'ALL') {
        const linked = getLinkedUser(emp);
        const userRole = linked?.role || emp.role || 'Teacher';
        if (userRole !== roleFilter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empId = (emp.employeeId || emp.id || '').toLowerCase();
        const name = (emp.name || '').toLowerCase();
        const email = (emp.email || '').toLowerCase();
        const dept = (emp.department || '').toLowerCase();
        const pos = (emp.position || '').toLowerCase();
        const branch = (emp.branch || '').toLowerCase();
        if (!empId.includes(q) && !name.includes(q) && !email.includes(q) && !dept.includes(q) && !pos.includes(q) && !branch.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [teachers, branchFilter, statusFilter, roleFilter, searchQuery, systemUsers]);

  // Handle Onboard New Employee
  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardForm.name.trim() || !onboardForm.email.trim()) {
      alert('Please provide Employee Full Name and Official Email.');
      return;
    }

    // 1. Generate unique branch-based Employee ID
    const { employeeId, updatedConfigs } = generateNextEmployeeId(onboardForm.branch, teachers);
    setIdConfigs(updatedConfigs);

    // 2. Generate linked User ID if account requested
    let linkedUserId: string | undefined = undefined;
    if (onboardForm.createAccount) {
      linkedUserId = generateNextUserId(systemUsers);
      
      const newAccount = {
        id: linkedUserId,
        employeeId: employeeId,
        name: onboardForm.name,
        email: onboardForm.email.toLowerCase().trim(),
        role: onboardForm.accountRole,
        branch: onboardForm.multiBranch ? 'All' : onboardForm.branch,
        primaryBranch: onboardForm.branch,
        additionalBranches: onboardForm.multiBranch ? ['GN', 'RS'] : onboardForm.additionalBranches,
        status: 'Active',
        phone: onboardForm.phone,
        password: onboardForm.password || 'sams123',
        accessCount: 0,
        createdAt: new Date().toISOString()
      };

      setSystemUsers(prev => [...prev, newAccount]);

      logEmployeeAuditEvent({
        user: 'Super Administrator',
        userRole: 'Super Administrator',
        employeeId: employeeId,
        employeeName: onboardForm.name,
        userId: linkedUserId,
        action: 'USER_ACCOUNT_CREATED',
        authorizedBy: 'Super Administrator',
        branch: onboardForm.branch,
        newValue: `${newAccount.email} (${newAccount.role})`,
        details: `Created new linked login account ${linkedUserId} with role "${newAccount.role}" for employee ${employeeId}.`
      });
    }

    // 3. Create Employee entity
    const newEmployee = {
      id: `tch-${Date.now()}`,
      employeeId: employeeId,
      name: onboardForm.name,
      email: onboardForm.email.toLowerCase().trim(),
      phone: onboardForm.phone,
      branch: onboardForm.branch,
      department: onboardForm.department,
      position: onboardForm.position,
      qualification: onboardForm.qualification,
      level: onboardForm.level,
      status: 'Active',
      employmentStatus: 'Active' as EmploymentStatus,
      joiningDate: new Date().toISOString().split('T')[0],
      userId: linkedUserId,
      role: onboardForm.role === 'Teacher' ? 'teaching' : 'management',
      accessControl: onboardForm.accountRole === 'Super Administrator' ? 'Admin' : 'Staff/Teacher',
      subjects: ['General Curriculum'],
      classesAssigned: [],
      branchHistory: [
        {
          id: `hist-init-${Date.now()}`,
          previousBranch: 'N/A (Initial Appointment)',
          newBranch: onboardForm.branch,
          transferDate: new Date().toISOString().split('T')[0],
          effectiveDate: new Date().toISOString().split('T')[0],
          transferReason: 'Initial Campus Appointment & Onboarding',
          authorizedBy: 'Super Administrator',
          timestamp: new Date().toISOString()
        }
      ],
      attendance: [],
      leaves: [],
      payroll: [],
      performance: []
    };

    setTeachers(prev => [newEmployee, ...prev]);

    // 4. Log Audit Event
    logEmployeeAuditEvent({
      user: 'Super Administrator',
      userRole: 'Super Administrator',
      employeeId: employeeId,
      employeeName: newEmployee.name,
      userId: linkedUserId,
      action: 'EMPLOYEE_CREATED',
      authorizedBy: 'Super Administrator',
      branch: onboardForm.branch,
      newValue: `${newEmployee.name} (${newEmployee.position})`,
      details: `Onboarded employee with permanent ID ${employeeId} at ${formatBranchName(onboardForm.branch)}.`
    });

    addAuditLog('Super Administrator', 'EMPLOYEE_IAM', `Created branch employee ${employeeId} (${newEmployee.name}) at ${newEmployee.branch}.`, 'SUCCESS');
    refreshAuditLogs();

    setShowOnboardModal(false);
    setOnboardForm({
      name: '',
      email: '',
      phone: '',
      branch: 'RS',
      position: 'Academic Teacher',
      department: 'Science & Mathematics',
      qualification: 'B.Ed / B.Sc Education',
      level: ['primary'],
      role: 'Teacher',
      createAccount: true,
      accountRole: 'Teacher',
      multiBranch: false,
      additionalBranches: [],
      password: 'sams123'
    });

    alert(`✨ SUCCESS: Employee "${newEmployee.name}" successfully onboarded with Employee ID: ${employeeId} at ${formatBranchName(newEmployee.branch)}.`);
  };

  // Handle Employee Transfer
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;

    const sourceBranch = activeEmployee.branch || 'GN';
    const targetBranch = transferForm.targetBranch;

    if (sourceBranch === targetBranch) {
      alert('Target branch must be different from the employee\'s current branch.');
      return;
    }

    const historyEntry: EmployeeBranchHistory = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      previousBranch: sourceBranch,
      newBranch: targetBranch,
      transferDate: transferForm.transferDate,
      effectiveDate: transferForm.effectiveDate,
      transferReason: transferForm.transferReason,
      authorizedBy: transferForm.authorizedBy,
      notes: transferForm.notes,
      timestamp: new Date().toISOString()
    };

    // Update Employee record
    const updatedEmployees = teachers.map(emp => {
      if (emp.id === activeEmployee.id || emp.employeeId === activeEmployee.employeeId) {
        const history = emp.branchHistory ? [...emp.branchHistory] : [];
        history.unshift(historyEntry);
        return {
          ...emp,
          branch: targetBranch,
          employmentStatus: 'Active',
          status: 'Active',
          branchHistory: history
        };
      }
      return emp;
    });

    setTeachers(updatedEmployees);

    // Synchronize linked user account branch
    const linkedUser = getLinkedUser(activeEmployee);
    if (linkedUser) {
      setSystemUsers(prev => prev.map(u => {
        if (u.id === linkedUser.id) {
          return {
            ...u,
            branch: targetBranch,
            primaryBranch: targetBranch
          };
        }
        return u;
      }));
    }

    // Log audit events
    logEmployeeAuditEvent({
      user: 'Super Administrator',
      userRole: 'Super Administrator',
      employeeId: activeEmployee.employeeId || activeEmployee.id,
      employeeName: activeEmployee.name,
      userId: linkedUser?.id,
      action: 'EMPLOYEE_TRANSFERRED',
      previousValue: sourceBranch,
      newValue: targetBranch,
      authorizedBy: transferForm.authorizedBy,
      branch: targetBranch,
      details: `Transferred employee ${activeEmployee.name} (${activeEmployee.employeeId}) from ${formatBranchName(sourceBranch)} to ${formatBranchName(targetBranch)}. Reason: ${transferForm.transferReason}. Effective Date: ${transferForm.effectiveDate}.`
    });

    addAuditLog('Super Administrator', 'TRANSFER', `Transferred employee ${activeEmployee.employeeId} to ${targetBranch}.`, 'SUCCESS');
    refreshAuditLogs();

    setShowTransferModal(false);
    setActiveEmployee(null);

    alert(`🔄 TRANSFER RECORDED:\nEmployee ${activeEmployee.name} (${activeEmployee.employeeId}) has been successfully transferred to ${formatBranchName(targetBranch)}.\nHistorical records at ${formatBranchName(sourceBranch)} remain intact.`);
  };

  // Handle Employee Status Change
  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;

    const prevStatus = activeEmployee.employmentStatus || activeEmployee.status || 'Active';
    const newStatus = statusForm.status;

    // Update Employee
    const updatedEmployees = teachers.map(emp => {
      if (emp.id === activeEmployee.id || emp.employeeId === activeEmployee.employeeId) {
        return {
          ...emp,
          status: newStatus,
          employmentStatus: newStatus,
          statusChangeReason: statusForm.reason || undefined
        };
      }
      return emp;
    });
    setTeachers(updatedEmployees);

    // If status is Inactive, Suspended, Terminated, or Resigned -> disable linked User Account immediately
    const linkedUser = getLinkedUser(activeEmployee);
    const shouldDisableAccount = ['Suspended', 'Terminated', 'Resigned', 'Inactive'].includes(newStatus);

    if (linkedUser) {
      const newUserAccountStatus: UserAccountStatus = shouldDisableAccount ? (newStatus === 'Suspended' ? 'Suspended' : 'Disabled') : 'Active';
      setSystemUsers(prev => prev.map(u => {
        if (u.id === linkedUser.id) {
          return {
            ...u,
            status: newUserAccountStatus
          };
        }
        return u;
      }));

      logEmployeeAuditEvent({
        user: 'Super Administrator',
        userRole: 'Super Administrator',
        employeeId: activeEmployee.employeeId || activeEmployee.id,
        employeeName: activeEmployee.name,
        userId: linkedUser.id,
        action: shouldDisableAccount ? 'ACCOUNT_DISABLED' : 'ACCOUNT_ACTIVATED',
        previousValue: linkedUser.status,
        newValue: newUserAccountStatus,
        authorizedBy: statusForm.authorizedBy,
        branch: activeEmployee.branch,
        details: `Synchronized user account status to "${newUserAccountStatus}" due to employee employment status changing to "${newStatus}".`
      });
    }

    logEmployeeAuditEvent({
      user: 'Super Administrator',
      userRole: 'Super Administrator',
      employeeId: activeEmployee.employeeId || activeEmployee.id,
      employeeName: activeEmployee.name,
      userId: linkedUser?.id,
      action: 'STATUS_CHANGED',
      previousValue: prevStatus,
      newValue: newStatus,
      authorizedBy: statusForm.authorizedBy,
      branch: activeEmployee.branch,
      details: `Updated employment status of ${activeEmployee.name} to "${newStatus}". Reason: ${statusForm.reason || 'Not specified'}.`
    });

    addAuditLog('Super Administrator', 'STATUS_CHANGE', `Employee ${activeEmployee.employeeId} status set to ${newStatus}.`, 'SUCCESS');
    refreshAuditLogs();

    setShowStatusModal(false);
    setActiveEmployee(null);

    alert(`🛡️ STATUS UPDATED:\nEmployee "${activeEmployee.name}" is now marked as "${newStatus}".\nLinked user account status automatically updated.`);
  };

  // Handle Account Link / Role / Permissions Update
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;

    const existingUser = getLinkedUser(activeEmployee);
    const targetEmail = accountForm.email.toLowerCase().trim();

    if (existingUser) {
      // Update existing account
      setSystemUsers(prev => prev.map(u => {
        if (u.id === existingUser.id) {
          return {
            ...u,
            email: targetEmail,
            role: accountForm.role,
            status: accountForm.status,
            primaryBranch: accountForm.primaryBranch,
            additionalBranches: accountForm.additionalBranches,
            branch: accountForm.additionalBranches.length > 1 || accountForm.primaryBranch === 'All' ? 'All' : accountForm.primaryBranch,
            password: accountForm.password || u.password || 'sams123'
          };
        }
        return u;
      }));

      logEmployeeAuditEvent({
        user: 'Super Administrator',
        userRole: 'Super Administrator',
        employeeId: activeEmployee.employeeId || activeEmployee.id,
        employeeName: activeEmployee.name,
        userId: existingUser.id,
        action: 'PERMISSION_CHANGED',
        previousValue: `${existingUser.role} [${existingUser.status}]`,
        newValue: `${accountForm.role} [${accountForm.status}]`,
        authorizedBy: 'Super Administrator',
        branch: activeEmployee.branch,
        details: `Updated user account credentials and multi-branch privileges for ${activeEmployee.name}.`
      });
    } else {
      // Create new linked account
      const newUserId = generateNextUserId(systemUsers);
      const newAccount = {
        id: newUserId,
        employeeId: activeEmployee.employeeId || activeEmployee.id,
        name: activeEmployee.name,
        email: targetEmail,
        role: accountForm.role,
        branch: accountForm.additionalBranches.length > 1 || accountForm.primaryBranch === 'All' ? 'All' : accountForm.primaryBranch,
        primaryBranch: accountForm.primaryBranch,
        additionalBranches: accountForm.additionalBranches,
        status: accountForm.status,
        phone: activeEmployee.phone,
        password: accountForm.password || 'sams123',
        accessCount: 0,
        createdAt: new Date().toISOString()
      };

      setSystemUsers(prev => [...prev, newAccount]);

      // Link to teacher
      setTeachers(prev => prev.map(t => {
        if (t.id === activeEmployee.id) {
          return { ...t, userId: newUserId };
        }
        return t;
      }));

      logEmployeeAuditEvent({
        user: 'Super Administrator',
        userRole: 'Super Administrator',
        employeeId: activeEmployee.employeeId || activeEmployee.id,
        employeeName: activeEmployee.name,
        userId: newUserId,
        action: 'USER_ACCOUNT_CREATED',
        authorizedBy: 'Super Administrator',
        branch: activeEmployee.branch,
        newValue: `${newAccount.email} (${newAccount.role})`,
        details: `Created new linked user account ${newUserId} for ${activeEmployee.name}.`
      });
    }

    addAuditLog('Super Administrator', 'IAM', `Configured user account credentials for employee ${activeEmployee.employeeId}.`, 'SUCCESS');
    refreshAuditLogs();

    setShowAccountModal(false);
    setActiveEmployee(null);

    alert(`🔑 USER ACCOUNT CONFIGURED: Credentials and multi-branch authorization successfully saved for ${activeEmployee.name}.`);
  };

  // Open Transfer Modal
  const openTransferModal = (emp: any) => {
    setActiveEmployee(emp);
    const curr = emp.branch || 'RS';
    const target = curr === 'RS' ? 'GN' : 'RS';
    setTransferForm({
      targetBranch: target,
      transferDate: new Date().toISOString().split('T')[0],
      effectiveDate: new Date().toISOString().split('T')[0],
      transferReason: 'Campus Expansion & Faculty Reallocation',
      authorizedBy: 'Engr. Usamah M. Qamar (Super Administrator)',
      notes: 'Executed per central administration directive'
    });
    setShowTransferModal(true);
  };

  // Open Status Modal
  const openStatusModal = (emp: any) => {
    setActiveEmployee(emp);
    setStatusForm({
      status: (emp.employmentStatus || emp.status || 'Active') as EmploymentStatus,
      reason: emp.statusChangeReason || '',
      effectiveDate: new Date().toISOString().split('T')[0],
      authorizedBy: 'Super Administrator'
    });
    setShowStatusModal(true);
  };

  // Open Account Modal
  const openAccountModal = (emp: any) => {
    setActiveEmployee(emp);
    const linked = getLinkedUser(emp);
    if (linked) {
      setAccountForm({
        email: linked.email,
        role: linked.role,
        status: (linked.status || 'Active') as UserAccountStatus,
        primaryBranch: linked.primaryBranch || emp.branch || 'RS',
        additionalBranches: linked.additionalBranches || [emp.branch || 'RS'],
        password: linked.password || 'sams123'
      });
    } else {
      setAccountForm({
        email: emp.email || '',
        role: emp.role === 'management' ? 'Principal' : 'Teacher',
        status: 'Active',
        primaryBranch: emp.branch || 'RS',
        additionalBranches: [emp.branch || 'RS'],
        password: 'sams123'
      });
    }
    setShowAccountModal(true);
  };

  // Open History Modal
  const openHistoryModal = (emp: any) => {
    setActiveEmployee(emp);
    setShowHistoryModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* ========================================================
          TOP HEADER: BRANCH-BASED IDENTITY HIERARCHY BANNER
          ======================================================== */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-400/20">
                Core Identity Engine
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-emerald-400 text-xs font-mono font-semibold">
                Multi-Branch IAM Active
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-indigo-400" />
              <span>Employee User Accounts &amp; Branch Identity</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Enforce structural integrity: <strong className="text-white font-mono">BRANCH ↓ EMPLOYEE ↓ EMPLOYEE ID ↓ USER ACCOUNT ↓ ROLE ↓ PERMISSIONS</strong>. 
              Manage permanent IDs, branch assignments, historical transfers, and synchronized login credentials.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowOnboardModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard New Employee</span>
            </button>

            <button
              type="button"
              onClick={() => setShowIdConfigModal(true)}
              className="bg-white/10 hover:bg-white/20 text-slate-200 font-semibold px-3.5 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 transition-all border border-white/10 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-indigo-300" />
              <span>ID Generation Rules</span>
            </button>
          </div>
        </div>

        {/* Identity Hierarchy Visual Breadcrumb */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-xl">
            <School className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-white font-bold">1. BRANCH</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-xl">
            <Users className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-white font-bold">2. EMPLOYEE</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex items-center space-x-1.5 bg-indigo-500/30 border border-indigo-400/40 px-2.5 py-1 rounded-xl">
            <BadgeCheck className="w-3.5 h-3.5 text-indigo-200" />
            <span className="text-indigo-200 font-extrabold">3. EMPLOYEE ID</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-xl">
            <KeyRound className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-white font-bold">4. USER ACCOUNT</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-white font-bold">5. ROLE &amp; PERMISSIONS</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          SUB-TAB NAVIGATION
          ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveConsoleTab('employees')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeConsoleTab === 'employees'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-800'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Employee Accounts Registry</span>
            <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono">
              {filteredEmployees.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveConsoleTab('transfers')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeConsoleTab === 'transfers'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-800'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
            <span>Branch Transfer Log</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveConsoleTab('audit_trail')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeConsoleTab === 'audit_trail'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-800'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-rose-500" />
            <span>Identity Audit Trail</span>
            <span className="px-1.5 py-0.2 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-mono">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* Global Branch Filter Pill */}
        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/40 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2 font-mono">Campus Filter:</span>
          {(['ALL', 'RS', 'GN'] as const).map(b => (
            <button
              key={b}
              type="button"
              onClick={() => setBranchFilter(b)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                branchFilter === b
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
              }`}
            >
              {b === 'ALL' ? '🌐 All' : b === 'RS' ? 'Runjin Sambo (RS)' : 'Gawon Nama (GN)'}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          TAB 1: EMPLOYEE ACCOUNTS REGISTRY
          ======================================================== */}
      {activeConsoleTab === 'employees' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by Employee ID, Name, Email, or Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Quick Status & Role Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="Super Administrator">Super Administrator</option>
                  <option value="Proprietor">Proprietor</option>
                  <option value="Branch Administrator">Branch Administrator</option>
                  <option value="Principal">Principal</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Store Manager">Store Manager</option>
                  <option value="Teacher">Teacher</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employee Directory Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider font-mono">
                    <th className="p-4">Employee Profile</th>
                    <th className="p-4">Permanent ID</th>
                    <th className="p-4 text-center">Assigned Branch</th>
                    <th className="p-4 text-center">Employment Status</th>
                    <th className="p-4">User Account &amp; Role</th>
                    <th className="p-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 dark:text-slate-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">No employee identity records matched the criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const linkedUser = getLinkedUser(emp);
                      const empStatus = emp.employmentStatus || emp.status || 'Active';
                      const formattedEmpId = emp.employeeId || emp.userId || `EMP-${emp.id.replace('tch-', '').slice(0, 4)}`;
                      const isSingleBranch = !linkedUser || (linkedUser.branch !== 'All' && (!linkedUser.additionalBranches || linkedUser.additionalBranches.length <= 1));

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          {/* 1. Profile */}
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              {emp.photoUrl ? (
                                <img
                                  src={emp.photoUrl}
                                  alt={emp.name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shadow-2xs border border-indigo-200 dark:border-indigo-800 shrink-0">
                                  {emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 dark:text-white leading-snug truncate">
                                  {emp.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                  {emp.position || 'Faculty Member'} • <span className="font-sans text-slate-400">{emp.department || 'General Academic'}</span>
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Employee ID */}
                          <td className="p-4 font-mono">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] border border-indigo-200 dark:border-indigo-800/60 shadow-3xs">
                              {formattedEmpId}
                            </span>
                            <span className="block text-[9px] text-slate-400 mt-0.5">Permanent</span>
                          </td>

                          {/* 3. Branch Assignment */}
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[10.5px] font-bold border ${
                              emp.branch === 'RS'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : emp.branch === 'GN'
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            }`}>
                              <School className="w-3 h-3" />
                              <span>{emp.branch === 'RS' ? 'Runjin Sambo' : emp.branch === 'GN' ? 'Gawon Nama' : 'Central HQ'}</span>
                            </span>
                          </td>

                          {/* 4. Status */}
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              empStatus === 'Active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : empStatus === 'On Leave'
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : empStatus === 'Transferred'
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse'
                            }`}>
                              ● {empStatus}
                            </span>
                          </td>

                          {/* 5. User Account & Role */}
                          <td className="p-4">
                            {linkedUser ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                                    {linkedUser.role}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                    linkedUser.status === 'Active' 
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                                  }`}>
                                    {linkedUser.status}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                                  <span>UID: {linkedUser.id}</span>
                                  <span>•</span>
                                  <span>{isSingleBranch ? `Branch: ${emp.branch}` : 'Multi-Campus Access 🌐'}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>No User Account</span>
                              </div>
                            )}
                          </td>

                          {/* 6. Administrative Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Simulate Login button */}
                              {linkedUser && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (linkedUser.status !== 'Active') {
                                      alert(`❌ ACCESS BLOCKED: User account is "${linkedUser.status}". Cannot initiate session.`);
                                      return;
                                    }
                                    setCurrentSimulatedRole(linkedUser.role);
                                    if (emp.branch && emp.branch !== 'All') {
                                      setSelectedBranch(emp.branch as any);
                                    }
                                    addAuditLog(linkedUser.name, 'SIMULATION', `Assumed session for ${linkedUser.name} (${linkedUser.role}) at ${emp.branch}.`, 'SUCCESS');
                                    alert(`🔑 SIMULATION ACTIVE:\nLogged in as "${linkedUser.name}" (${linkedUser.role}) assigned to ${formatBranchName(emp.branch)}.`);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-950 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                  title="Simulate this employee's active session"
                                >
                                  <KeyRound className="w-3 h-3" />
                                  <span className="hidden xl:inline">Login</span>
                                </button>
                              )}

                              {/* Transfer Branch button */}
                              <button
                                type="button"
                                onClick={() => openTransferModal(emp)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                                title="Transfer employee to another campus"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                                <span className="hidden xl:inline">Transfer</span>
                              </button>

                              {/* Manage Account & Permissions */}
                              <button
                                type="button"
                                onClick={() => openAccountModal(emp)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                                title="Configure user account credentials and role"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span className="hidden xl:inline">Account</span>
                              </button>

                              {/* Status Control */}
                              <button
                                type="button"
                                onClick={() => openStatusModal(emp)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-amber-200 dark:border-amber-800 transition-all cursor-pointer"
                                title="Change employment status"
                              >
                                <Sliders className="w-3 h-3" />
                                <span className="hidden xl:inline">Status</span>
                              </button>

                              {/* View Full Profile / History */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectTeacherForView) {
                                    onSelectTeacherForView(emp);
                                  } else {
                                    openHistoryModal(emp);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="View employee details and transfer history"
                              >
                                <History className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: BRANCH TRANSFERS LOG
          ======================================================== */}
      {activeConsoleTab === 'transfers' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                  <span>Campus Transfer Timeline &amp; History</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanent audit record of all employee branch reallocations. Historical records remain permanently tied to original branches.
                </p>
              </div>
            </div>

            {/* List all branch histories from all teachers */}
            {(() => {
              const allTransfers: any[] = [];
              teachers.forEach(t => {
                if (Array.isArray(t.branchHistory)) {
                  t.branchHistory.forEach((h: any) => {
                    allTransfers.push({
                      ...h,
                      employeeName: t.name,
                      employeeId: t.employeeId || t.id,
                      currentBranch: t.branch
                    });
                  });
                }
              });

              if (allTransfers.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                    No campus transfers recorded yet.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 font-mono">
                        <th className="p-3.5">Effective Date</th>
                        <th className="p-3.5">Employee</th>
                        <th className="p-3.5">Previous Campus</th>
                        <th className="p-3.5">New Campus</th>
                        <th className="p-3.5">Transfer Reason</th>
                        <th className="p-3.5">Authorized By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allTransfers.map((tr, idx) => (
                        <tr key={tr.id || idx} className="hover:bg-slate-50/50">
                          <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {tr.effectiveDate || tr.transferDate || 'N/A'}
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-slate-900 dark:text-white">{tr.employeeName}</p>
                            <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">{tr.employeeId}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10.5px] font-bold">
                              {formatBranchName(tr.previousBranch)}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-bold">
                              {formatBranchName(tr.newBranch)}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-400">
                            {tr.transferReason || 'Standard Reallocation'}
                          </td>
                          <td className="p-3.5 font-mono text-[10px] text-slate-500">
                            {tr.authorizedBy || 'Super Administrator'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: IDENTITY AUDIT TRAIL
          ======================================================== */}
      {activeConsoleTab === 'audit_trail' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <History className="w-4 h-4 text-rose-600" />
                  <span>Immutable Identity &amp; Access Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive audit logs of all ID generations, branch assignments, role modifications, and credential updates.
                </p>
              </div>
              <button
                type="button"
                onClick={refreshAuditLogs}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Log</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 font-mono">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Target Employee / UID</th>
                    <th className="p-3.5">Action Event</th>
                    <th className="p-3.5">Campus</th>
                    <th className="p-3.5">Details &amp; State Changes</th>
                    <th className="p-3.5">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">No identity audit records logged yet.</td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 text-slate-400 whitespace-nowrap">
                          {log.date} {log.time}
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-800 dark:text-slate-200 font-sans">{log.employeeName || 'N/A'}</p>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">{log.employeeId || log.userId || ''}</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            log.action.includes('CREATED') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' :
                            log.action.includes('TRANSFERRED') ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200' :
                            log.action.includes('DISABLED') || log.action.includes('SUSPENDED') ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' :
                            'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                          {log.branch || 'Global'}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-md font-sans text-xs">
                          <p>{log.details}</p>
                          {log.previousValue && log.newValue && (
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {log.previousValue} → <strong className="text-slate-700 dark:text-slate-200">{log.newValue}</strong>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">
                          {log.authorizedBy}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: ONBOARD NEW EMPLOYEE (WITH BRANCH & ID GENERATION)
          ======================================================== */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Onboard New Staff &amp; Employee
                  </h3>
                  <p className="text-xs text-slate-400">
                    Assign branch, generate permanent Employee ID, and initialize user account credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs font-sans">
              {/* Branch Selection & ID Preview */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <School className="w-4 h-4 text-indigo-600" />
                    <span>1. Select Primary School Branch</span>
                  </label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">Identity Anchor</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOnboardForm(f => ({ ...f, branch: 'RS' }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      onboardForm.branch === 'RS'
                        ? 'bg-white dark:bg-slate-800 border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">Runjin Sambo Campus</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Prefix: RJS-EMP-xxxx</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnboardForm(f => ({ ...f, branch: 'GN' }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      onboardForm.branch === 'GN'
                        ? 'bg-white dark:bg-slate-800 border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">Gawon Nama Campus</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Prefix: GWN-EMP-xxxx</p>
                  </button>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmed Musa"
                    value={onboardForm.name}
                    onChange={(e) => setOnboardForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ahmed.musa@sams.edu"
                    value={onboardForm.email}
                    onChange={(e) => setOnboardForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+234 803 123 4567"
                    value={onboardForm.phone}
                    onChange={(e) => setOnboardForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Position / Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Physics Teacher"
                    value={onboardForm.position}
                    onChange={(e) => setOnboardForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Department</label>
                  <select
                    value={onboardForm.department}
                    onChange={(e) => setOnboardForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Science & Mathematics">Science &amp; Mathematics</option>
                    <option value="Humanities & Languages">Humanities &amp; Languages</option>
                    <option value="Early Years & Nursery">Early Years &amp; Nursery</option>
                    <option value="Finance & Accounts">Finance &amp; Accounts</option>
                    <option value="School Administration">School Administration</option>
                    <option value="Inventory & Stores">Inventory &amp; Stores</option>
                    <option value="Student Welfare & Health">Student Welfare &amp; Health</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Ed, M.Sc Education"
                    value={onboardForm.qualification}
                    onChange={(e) => setOnboardForm(f => ({ ...f, qualification: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* User Account Option */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onboardForm.createAccount}
                    onChange={(e) => setOnboardForm(f => ({ ...f, createAccount: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                      Create Linked User Login Account
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Provision credentials to authenticate into the SAMS ERP with assigned role permissions.
                    </span>
                  </div>
                </label>

                {onboardForm.createAccount && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Assigned System Role</label>
                      <select
                        value={onboardForm.accountRole}
                        onChange={(e) => setOnboardForm(f => ({ ...f, accountRole: e.target.value }))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Teacher">Teacher</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Principal">Principal</option>
                        <option value="Branch Administrator">Branch Administrator</option>
                        <option value="Store Manager">Store Manager</option>
                        <option value="Proprietor">Proprietor (Multi-Branch)</option>
                        <option value="Super Administrator">Super Administrator (Multi-Branch)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Initial Password</label>
                      <input
                        type="text"
                        value={onboardForm.password}
                        onChange={(e) => setOnboardForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Commit Onboarding</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: EMPLOYEE TRANSFER WORKFLOW
          ======================================================== */}
      {showTransferModal && activeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Transfer Employee to Another Branch
                  </h3>
                  <p className="text-xs text-slate-400">
                    Maintains immutable branch history while reallocating active operations.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs font-sans">
              {/* Employee Summary Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white text-xs">{activeEmployee.name}</p>
                  <p className="text-[10px] text-indigo-600 font-mono">{activeEmployee.employeeId || activeEmployee.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Current Campus</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                    {formatBranchName(activeEmployee.branch || 'RS')}
                  </span>
                </div>
              </div>

              {/* Target Branch */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Destination Campus</label>
                <select
                  value={transferForm.targetBranch}
                  onChange={(e) => setTransferForm(f => ({ ...f, targetBranch: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="GN">Gawon Nama Campus (GN)</option>
                  <option value="RS">Runjin Sambo Campus (RS)</option>
                </select>
              </div>

              {/* Effective Date & Filing Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={transferForm.transferDate}
                    onChange={(e) => setTransferForm(f => ({ ...f, transferDate: e.target.value }))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={transferForm.effectiveDate}
                    onChange={(e) => setTransferForm(f => ({ ...f, effectiveDate: e.target.value }))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Transfer Reason</label>
                <select
                  value={transferForm.transferReason}
                  onChange={(e) => setTransferForm(f => ({ ...f, transferReason: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                >
                  <option value="Departmental Faculty Reallocation">Departmental Faculty Reallocation</option>
                  <option value="Campus Expansion Support">Campus Expansion Support</option>
                  <option value="Promotion to Branch Coordinator">Promotion to Branch Coordinator</option>
                  <option value="Subject Specialist Load Balance">Subject Specialist Load Balance</option>
                  <option value="Staff Personal Request">Staff Personal Request</option>
                  <option value="Administrative Rotation Directive">Administrative Rotation Directive</option>
                </select>
              </div>

              {/* Authorized By */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Authorized By</label>
                <input
                  type="text"
                  required
                  value={transferForm.authorizedBy}
                  onChange={(e) => setTransferForm(f => ({ ...f, authorizedBy: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[10.5px] text-emerald-900 dark:text-emerald-200">
                <span className="font-bold block">Historical Integrity Protection:</span>
                <p className="mt-0.5">Past payroll, attendance, and grading records at {formatBranchName(activeEmployee.branch || 'RS')} will remain linked to that campus permanently.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Execute Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: EMPLOYEE STATUS & ACCESS CONTROL
          ======================================================== */}
      {showStatusModal && activeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Employee Status Lifecycle
                  </h3>
                  <p className="text-xs text-slate-400">
                    Transition employment status and synchronize authentication access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs font-sans">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{activeEmployee.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">{activeEmployee.employeeId || activeEmployee.id}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-bold text-[10px]">
                  Current: {activeEmployee.employmentStatus || activeEmployee.status || 'Active'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">New Employment Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm(f => ({ ...f, status: e.target.value as EmploymentStatus }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                >
                  <option value="Active">Active (Full Operating Access)</option>
                  <option value="On Leave">On Leave (Temporary Leave)</option>
                  <option value="Suspended">Suspended (Access Revoked Immediately)</option>
                  <option value="Transferred">Transferred (Archived at Previous Branch)</option>
                  <option value="Resigned">Resigned (Formal Departure - Login Disabled)</option>
                  <option value="Terminated">Terminated (Contract Ended - Login Disabled)</option>
                  <option value="Inactive">Inactive (Dormant - Login Disabled)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reason / Documentation Notes</label>
                <textarea
                  rows={3}
                  placeholder="Provide reason for this status change..."
                  value={statusForm.reason}
                  onChange={(e) => setStatusForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              {['Suspended', 'Terminated', 'Resigned', 'Inactive'].includes(statusForm.status) && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-[10.5px] text-rose-800 dark:text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold block">Automatic Login Account Lock:</span>
                    <p className="mt-0.5">The linked user account will be set to Disabled/Suspended. The employee will no longer be able to log in. Historical data remains intact.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: USER ACCOUNT & MULTI-BRANCH ACCESS
          ======================================================== */}
      {showAccountModal && activeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    User Account &amp; Multi-Branch Permissions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Linked to Employee ID: <span className="font-mono font-bold text-indigo-600">{activeEmployee.employeeId || activeEmployee.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Login Username / Email</label>
                <input
                  type="email"
                  required
                  value={accountForm.email}
                  onChange={(e) => setAccountForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">System Role</label>
                  <select
                    value={accountForm.role}
                    onChange={(e) => setAccountForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Principal">Principal</option>
                    <option value="Branch Administrator">Branch Administrator</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Proprietor">Proprietor</option>
                    <option value="Super Administrator">Super Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Account Status</label>
                  <select
                    value={accountForm.status}
                    onChange={(e) => setAccountForm(f => ({ ...f, status: e.target.value as UserAccountStatus }))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="Active">Active (Permitted)</option>
                    <option value="Suspended">Suspended (Blocked)</option>
                    <option value="Disabled">Disabled (Revoked)</option>
                  </select>
                </div>
              </div>

              {/* Multi-Branch Access Configuration */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-500 block">
                  Campus Authorization Vectors
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accountForm.additionalBranches.includes('RS')}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...accountForm.additionalBranches, 'RS']
                          : accountForm.additionalBranches.filter(b => b !== 'RS');
                        setAccountForm(f => ({ ...f, additionalBranches: next }));
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span>Runjin Sambo (RS)</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accountForm.additionalBranches.includes('GN')}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...accountForm.additionalBranches, 'GN']
                          : accountForm.additionalBranches.filter(b => b !== 'GN');
                        setAccountForm(f => ({ ...f, additionalBranches: next }));
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span>Gawon Nama (GN)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reset Password</label>
                <input
                  type="text"
                  value={accountForm.password}
                  onChange={(e) => setAccountForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: ID GENERATION RULES CONFIG
          ======================================================== */}
      {showIdConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Branch Employee ID Generation Rules
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure branch prefixes, digit sequence lengths, and counter values.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIdConfigModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {idConfigs.map((cfg, index) => (
                <div key={cfg.branchCode} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {cfg.branchName} ({cfg.branchCode})
                    </span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                      Next: {cfg.prefix}{String(cfg.nextSequence).padStart(cfg.digitPadding, '0')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Prefix</label>
                      <input
                        type="text"
                        value={cfg.prefix}
                        onChange={(e) => {
                          const val = e.target.value;
                          setIdConfigs(prev => prev.map((c, i) => i === index ? { ...c, prefix: val } : c));
                        }}
                        className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Digit Padding</label>
                      <input
                        type="number"
                        min={3}
                        max={6}
                        value={cfg.digitPadding}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 4;
                          setIdConfigs(prev => prev.map((c, i) => i === index ? { ...c, digitPadding: val } : c));
                        }}
                        className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  saveEmployeeIdConfigs(idConfigs);
                  setShowIdConfigModal(false);
                  alert('ID Generation configurations saved.');
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md cursor-pointer"
              >
                Save ID Configurations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: EMPLOYEE TRANSFER & BRANCH HISTORY
          ======================================================== */}
      {showHistoryModal && activeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {activeEmployee.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {activeEmployee.employeeId || activeEmployee.id} • Current Campus: {formatBranchName(activeEmployee.branch || 'RS')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-[10px] tracking-wider font-mono">
                Historical Campus Timeline
              </span>
              {(!activeEmployee.branchHistory || activeEmployee.branchHistory.length === 0) ? (
                <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl">
                  No historical transfers recorded. Initial branch: {formatBranchName(activeEmployee.branch || 'RS')}.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeEmployee.branchHistory.map((h: any, i: number) => (
                    <div key={h.id || i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-slate-400">{h.effectiveDate || h.transferDate}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[9.5px] font-bold">
                          {h.previousBranch} → {h.newBranch}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{h.transferReason}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Authorized: {h.authorizedBy}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl uppercase text-xs cursor-pointer"
            >
              Close History View
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
