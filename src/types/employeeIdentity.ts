export type EmploymentStatus = 
  | 'Active' 
  | 'On Leave' 
  | 'Suspended' 
  | 'Transferred' 
  | 'Resigned' 
  | 'Terminated' 
  | 'Inactive';

export type UserAccountStatus = 'Active' | 'Suspended' | 'Disabled';

export type SchoolBranchCode = 'GN' | 'RS' | 'HQ' | 'All';

export interface EmployeeBranchHistory {
  id: string;
  previousBranch: string; // e.g. 'RS' | 'GN' | 'Runjin Sambo' | 'Gawon Nama'
  newBranch: string;      // e.g. 'GN' | 'RS' | 'Gawon Nama' | 'Runjin Sambo'
  transferDate: string;   // ISO date string
  effectiveDate: string;  // ISO date string
  transferReason: string; // e.g. "Departmental rotation", "Promoted to Branch Head", "Faculty rebalance"
  authorizedBy: string;   // Admin name or ID e.g. "Engr. Usamah M. Qamar (Super Administrator)"
  notes?: string;
  timestamp: string;
}

export interface EmployeeIdConfig {
  branchCode: string;
  branchName: string;
  prefix: string;         // e.g. 'RJS-EMP-' for Runjin Sambo, 'GWN-EMP-' for Gawon Nama, 'HQ-EMP-' for HQ
  digitPadding: number;   // e.g. 4 -> 0001
  nextSequence: number;   // e.g. 1
  sampleId: string;       // e.g. 'RJS-EMP-0001'
}

export interface EmployeeAuditLogEntry {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  user: string;           // Person who performed action e.g. "Super Admin"
  userRole: string;       // e.g. "Super Administrator"
  employeeId?: string;    // Target Employee ID e.g. "RJS-EMP-0001"
  employeeName?: string;  // Target Employee Name e.g. "Ahmed Musa"
  userId?: string;        // Target User ID e.g. "usr-3"
  action: 
    | 'EMPLOYEE_CREATED'
    | 'EMPLOYEE_ID_ASSIGNED'
    | 'BRANCH_ASSIGNED'
    | 'EMPLOYEE_TRANSFERRED'
    | 'STATUS_CHANGED'
    | 'ROLE_CHANGED'
    | 'PERMISSION_CHANGED'
    | 'USER_ACCOUNT_CREATED'
    | 'USER_ACCOUNT_LINKED'
    | 'ACCOUNT_ACTIVATED'
    | 'ACCOUNT_SUSPENDED'
    | 'ACCOUNT_DISABLED'
    | 'PASSWORD_RESET'
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGOUT';
  previousValue?: string;
  newValue?: string;
  authorizedBy: string;
  branch: string;
  details: string;
}

export interface LinkedUserAccount {
  id: string;             // User ID e.g. "usr-admin", "usr-3", "USR-0042"
  employeeId: string;     // Linked Employee ID e.g. "RJS-EMP-0001"
  email: string;          // Official Login Email e.g. "ahmed.musa@sams.rs.com"
  name: string;           // Full Name
  role: string;           // Role e.g. "Accountant", "Teacher", "Principal", "Super Administrator"
  status: UserAccountStatus; // 'Active' | 'Suspended' | 'Disabled'
  primaryBranch: string;  // 'RS' | 'GN' | 'All'
  additionalBranches?: string[]; // e.g. ['RS', 'GN'] for multi-branch access
  phone?: string;
  lastLogin?: string;     // Timestamp of last login
  password?: string;
  createdAt?: string;
}
