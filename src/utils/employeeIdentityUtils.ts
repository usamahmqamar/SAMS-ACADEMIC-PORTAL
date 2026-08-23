import { 
  EmployeeBranchHistory, 
  EmployeeIdConfig, 
  EmployeeAuditLogEntry, 
  LinkedUserAccount, 
  EmploymentStatus, 
  UserAccountStatus 
} from '../types/employeeIdentity';

// Default Branch ID Generation Rules
export const DEFAULT_EMPLOYEE_ID_CONFIGS: EmployeeIdConfig[] = [
  {
    branchCode: 'RS',
    branchName: 'Runjin Sambo Campus',
    prefix: 'RJS-EMP-',
    digitPadding: 4,
    nextSequence: 10,
    sampleId: 'RJS-EMP-0010'
  },
  {
    branchCode: 'GN',
    branchName: 'Gawon Nama Campus',
    prefix: 'GWN-EMP-',
    digitPadding: 4,
    nextSequence: 15,
    sampleId: 'GWN-EMP-0015'
  },
  {
    branchCode: 'HQ',
    branchName: 'Central Headquarters / SAMS Group',
    prefix: 'HQ-EMP-',
    digitPadding: 4,
    nextSequence: 5,
    sampleId: 'HQ-EMP-0005'
  }
];

// Helper to get or initialize ID configs from localStorage
export const loadEmployeeIdConfigs = (): EmployeeIdConfig[] => {
  try {
    const saved = localStorage.getItem('sams_employee_id_configs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading employee ID configs:', e);
  }
  return DEFAULT_EMPLOYEE_ID_CONFIGS;
};

// Helper to save ID configs
export const saveEmployeeIdConfigs = (configs: EmployeeIdConfig[]): void => {
  try {
    localStorage.setItem('sams_employee_id_configs', JSON.stringify(configs));
  } catch (e) {
    console.error('Error saving employee ID configs:', e);
  }
};

// Generate next unique Employee ID for a given branch
export const generateNextEmployeeId = (
  branch: string, 
  existingEmployees: any[] = []
): { employeeId: string; updatedConfigs: EmployeeIdConfig[] } => {
  const configs = loadEmployeeIdConfigs();
  const normalizedBranch = branch === 'All' ? 'HQ' : (branch || 'GN');
  
  let configIndex = configs.findIndex(c => c.branchCode === normalizedBranch);
  if (configIndex === -1) {
    // Fallback config
    const prefix = `${normalizedBranch}-EMP-`;
    configs.push({
      branchCode: normalizedBranch,
      branchName: `${normalizedBranch} Branch`,
      prefix,
      digitPadding: 4,
      nextSequence: 1,
      sampleId: `${prefix}0001`
    });
    configIndex = configs.length - 1;
  }

  const config = configs[configIndex];
  let seq = config.nextSequence || 1;
  let candidateId = `${config.prefix}${String(seq).padStart(config.digitPadding, '0')}`;

  // Collect all currently existing and archived employee IDs to strictly prevent duplicates / reuse
  const existingIds = new Set<string>();
  existingEmployees.forEach(emp => {
    if (emp.employeeId) existingIds.add(emp.employeeId);
    if (emp.id && (emp.id.includes('-EMP-') || emp.id.startsWith('EMP-') || emp.id.startsWith('RJS-') || emp.id.startsWith('GWN-') || emp.id.startsWith('HQ-'))) {
      existingIds.add(emp.id);
    }
  });

  // Keep incrementing until an unused ID is found
  while (existingIds.has(candidateId)) {
    seq++;
    candidateId = `${config.prefix}${String(seq).padStart(config.digitPadding, '0')}`;
  }

  // Update sequence for next generation
  configs[configIndex].nextSequence = seq + 1;
  configs[configIndex].sampleId = `${config.prefix}${String(seq + 1).padStart(config.digitPadding, '0')}`;
  saveEmployeeIdConfigs(configs);

  return {
    employeeId: candidateId,
    updatedConfigs: configs
  };
};

// Generate next User ID (e.g. usr-12 or USR-0012)
export const generateNextUserId = (existingUsers: any[] = []): string => {
  const count = existingUsers.length + 1;
  const candidate = `usr-${count}`;
  if (!existingUsers.some(u => u.id === candidate)) {
    return candidate;
  }
  return `usr-${Date.now().toString().slice(-4)}`;
};

// Helper to record an immutable employee audit log
export const logEmployeeAuditEvent = (
  entry: Omit<EmployeeAuditLogEntry, 'id' | 'timestamp' | 'date' | 'time'>
): EmployeeAuditLogEntry => {
  const now = new Date();
  const fullEntry: EmployeeAuditLogEntry = {
    id: `emp-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ...entry
  };

  try {
    const raw = localStorage.getItem('sams_employee_audit_logs');
    const logs: EmployeeAuditLogEntry[] = raw ? JSON.parse(raw) : [];
    logs.unshift(fullEntry);
    // Keep last 500 audit logs
    if (logs.length > 500) logs.length = 500;
    localStorage.setItem('sams_employee_audit_logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Error recording employee audit log:', e);
  }

  return fullEntry;
};

// Load employee audit logs
export const loadEmployeeAuditLogs = (): EmployeeAuditLogEntry[] => {
  try {
    const raw = localStorage.getItem('sams_employee_audit_logs');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading employee audit logs:', e);
  }
  return [];
};

// Check if a user has access to a specific branch
export const hasBranchAccess = (
  user: { role?: string; branch?: string; primaryBranch?: string; additionalBranches?: string[] } | null | undefined,
  targetBranch: string
): boolean => {
  if (!user) return false;
  
  // Super Admin and Proprietor have global multi-branch access
  const role = user.role || '';
  if (role === 'Super Administrator' || role === 'Super Admin' || role === 'Proprietor') {
    return true;
  }

  const primary = user.primaryBranch || user.branch || '';
  if (primary === 'All' || primary === targetBranch) {
    return true;
  }

  if (Array.isArray(user.additionalBranches) && user.additionalBranches.includes(targetBranch)) {
    return true;
  }

  return false;
};

// Get list of authorized branches for a user
export const getAuthorizedBranches = (
  user: { role?: string; branch?: string; primaryBranch?: string; additionalBranches?: string[] } | null | undefined
): string[] => {
  if (!user) return ['GN'];

  const role = user.role || '';
  if (role === 'Super Administrator' || role === 'Super Admin' || role === 'Proprietor') {
    return ['GN', 'RS'];
  }

  const primary = user.primaryBranch || user.branch || 'GN';
  if (primary === 'All') {
    return ['GN', 'RS'];
  }

  const branches = new Set<string>();
  if (primary) branches.add(primary);
  if (Array.isArray(user.additionalBranches)) {
    user.additionalBranches.forEach(b => {
      if (b && b !== 'All') branches.add(b);
    });
  }

  return Array.from(branches);
};

// Human-readable branch name helper
export const formatBranchName = (branchCode: string): string => {
  switch (branchCode) {
    case 'RS':
      return 'Runjin Sambo Campus';
    case 'GN':
      return 'Gawon Nama Campus';
    case 'HQ':
    case 'All':
      return 'All Campuses (Consolidated HQ)';
    default:
      return `${branchCode} Campus`;
  }
};
