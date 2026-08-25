import { supabase } from '../lib/supabaseClient';

export interface DbEmployee {
  id: string;
  branch_id: string;
  employee_id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  gender: 'Male' | 'Female';
  date_of_birth?: string | null;
  phone: string;
  email: string;
  address?: string | null;
  position: string;
  department: string;
  employment_date: string;
  employment_status: 'Active' | 'On Leave' | 'Suspended' | 'Transferred' | 'Resigned' | 'Terminated' | 'Inactive';
  qualification?: string | null;
  profile_photo_url?: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  branches?: {
    id: string;
    branch_name: string;
    branch_code: string;
  };
  employee_branch_history?: Array<{
    id: string;
    previous_branch_id: string;
    new_branch_id: string;
    effective_date: string;
    reason?: string;
    created_at: string;
    prev_branch?: { branch_name: string; branch_code: string };
    new_branch?: { branch_name: string; branch_code: string };
  }>;
  teacher_subject_assignments?: Array<{
    id: string;
    class_id: string;
    section_id?: string;
    subject_id: string;
    periods_per_week?: number;
    classes?: { id: string; name: string; grade_level?: string };
    subjects?: { id: string; subject_name: string; subject_code?: string };
  }>;
  employee_bank_accounts?: Array<{
    id: string;
    bank_name: string;
    account_number: string;
    account_name: string;
    is_primary: boolean;
  }>;
  system_user_profiles?: Array<{
    id: string;
    username: string;
    email: string;
    status: string;
    is_super_admin: boolean;
    roles?: {
      role_name: string;
      role_code: string;
    };
  }>;
}

export interface StaffFilterOptions {
  branchCode?: string; // 'All' | 'GN' | 'RS'
  branchId?: string;
  searchQuery?: string;
  department?: string;
  position?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const staffService = {
  /**
   * Fetch paginated and filtered employees from Supabase
   */
  async getEmployees(options: StaffFilterOptions = {}) {
    try {
      let query = supabase
        .from('employees')
        .select(`
          *,
          branches:branch_id (id, branch_name, branch_code),
          employee_branch_history (
            id, previous_branch_id, new_branch_id, effective_date, reason, created_at,
            prev_branch:previous_branch_id (branch_name, branch_code),
            new_branch:new_branch_id (branch_name, branch_code)
          ),
          teacher_subject_assignments (
            id, class_id, section_id, subject_id, periods_per_week,
            classes:class_id (id, name, grade_level),
            subjects:subject_id (id, subject_name, subject_code)
          ),
          employee_bank_accounts (
            id, bank_name, account_number, account_name, is_primary
          ),
          system_user_profiles (
            id, username, email, status, is_super_admin,
            roles:role_id (role_name, role_code)
          )
        `, { count: 'exact' });

      // Branch filter
      if (options.branchCode && options.branchCode !== 'All') {
        const { data: branchData } = await supabase
          .from('branches')
          .select('id')
          .eq('branch_code', options.branchCode)
          .maybeSingle();

        if (branchData?.id) {
          query = query.eq('branch_id', branchData.id);
        }
      } else if (options.branchId) {
        query = query.eq('branch_id', options.branchId);
      }

      // Department filter
      if (options.department && options.department !== 'All') {
        query = query.eq('department', options.department);
      }

      // Status filter
      if (options.status && options.status !== 'All') {
        query = query.eq('employment_status', options.status);
      }

      // Search Query
      if (options.searchQuery && options.searchQuery.trim()) {
        const q = options.searchQuery.trim();
        query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,employee_id.ilike.%${q}%,position.ilike.%${q}%,department.ilike.%${q}%,email.ilike.%${q}%`);
      }

      // Order by last_name, first_name
      query = query.order('last_name', { ascending: true });

      // Pagination
      const page = options.page || 1;
      const pageSize = options.pageSize || 50;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) {
        console.warn('Supabase getEmployees notice:', error.message);
        return { data: [] as DbEmployee[], count: 0, error };
      }

      return { data: (data as DbEmployee[]) || [], count: count || 0, error: null };
    } catch (err: any) {
      console.error('Exception fetching employees:', err);
      return { data: [] as DbEmployee[], count: 0, error: err };
    }
  },

  /**
   * Fetch single employee by ID
   */
  async getEmployeeById(employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          branches:branch_id (id, branch_name, branch_code),
          employee_branch_history (
            id, previous_branch_id, new_branch_id, effective_date, reason, created_at,
            prev_branch:previous_branch_id (branch_name, branch_code),
            new_branch:new_branch_id (branch_name, branch_code)
          ),
          teacher_subject_assignments (
            id, class_id, section_id, subject_id, periods_per_week,
            classes:class_id (id, name, grade_level),
            subjects:subject_id (id, subject_name, subject_code)
          ),
          employee_bank_accounts (
            id, bank_name, account_number, account_name, is_primary
          ),
          system_user_profiles (
            id, username, email, status, is_super_admin,
            roles:role_id (role_name, role_code)
          )
        `)
        .eq('id', employeeId)
        .maybeSingle();

      if (error) throw error;
      return { data: data as DbEmployee | null, error: null };
    } catch (err: any) {
      console.error('Exception fetching employee by ID:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Fetch staff attendance history
   */
  async getStaffAttendance(employeeId: string, limit = 60) {
    try {
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .order('attendance_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Exception fetching staff attendance:', err);
      return { data: [], error: err };
    }
  },

  /**
   * Save or update employee details and bank accounts
   */
  async saveEmployee(employeeData: Partial<DbEmployee> & { id: string }, bankData?: any) {
    try {
      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };
      if (employeeData.first_name) updatePayload.first_name = employeeData.first_name;
      if (employeeData.last_name) updatePayload.last_name = employeeData.last_name;
      if (employeeData.middle_name !== undefined) updatePayload.middle_name = employeeData.middle_name;
      if (employeeData.phone) updatePayload.phone = employeeData.phone;
      if (employeeData.email) updatePayload.email = employeeData.email;
      if (employeeData.position) updatePayload.position = employeeData.position;
      if (employeeData.department) updatePayload.department = employeeData.department;
      if (employeeData.qualification !== undefined) updatePayload.qualification = employeeData.qualification;
      if (employeeData.address !== undefined) updatePayload.address = employeeData.address;
      if (employeeData.employment_status) updatePayload.employment_status = employeeData.employment_status;
      if (employeeData.profile_photo_url !== undefined) updatePayload.profile_photo_url = employeeData.profile_photo_url;
      if (employeeData.branch_id) updatePayload.branch_id = employeeData.branch_id;

      const { data: updatedEmployee, error: updateErr } = await supabase
        .from('employees')
        .update(updatePayload)
        .eq('id', employeeData.id)
        .select()
        .maybeSingle();

      if (updateErr) throw updateErr;

      // Upsert bank account if provided
      if (bankData?.bank_name && bankData?.account_number) {
        const { error: bankErr } = await supabase
          .from('employee_bank_accounts')
          .upsert({
            employee_id: employeeData.id,
            bank_name: bankData.bank_name || bankData.bankName,
            account_number: bankData.account_number || bankData.bankAccountNo,
            account_name: bankData.account_name || bankData.bankAccountName || `${employeeData.first_name} ${employeeData.last_name}`,
            is_primary: true
          }, { onConflict: 'employee_id' });

        if (bankErr) console.warn('Bank account upsert notice:', bankErr.message);
      }

      return { data: updatedEmployee, error: null };
    } catch (err: any) {
      console.error('Exception saving employee:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Transfer employee to another branch and log history
   */
  async transferEmployee(
    employeeId: string,
    previousBranchId: string,
    newBranchId: string,
    reason: string,
    authorizedByEmployeeId?: string
  ) {
    try {
      // 1. Update employee branch
      const { data: updatedEmployee, error: empErr } = await supabase
        .from('employees')
        .update({
          branch_id: newBranchId,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .select()
        .maybeSingle();

      if (empErr) throw empErr;

      // 2. Insert into employee_branch_history
      const { error: histErr } = await supabase
        .from('employee_branch_history')
        .insert({
          employee_id: employeeId,
          previous_branch_id: previousBranchId,
          new_branch_id: newBranchId,
          effective_date: new Date().toISOString().split('T')[0],
          reason: reason || 'Campus Deployment',
          authorized_by_employee_id: authorizedByEmployeeId || null
        });

      if (histErr) console.warn('Branch history insert notice:', histErr.message);

      return { data: updatedEmployee, error: null };
    } catch (err: any) {
      console.error('Exception transferring employee:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Create or Link IAM User Account for an Employee
   */
  async createEmployeeUserAccount(
    employee: DbEmployee,
    roleName: string,
    authorizedByUserId?: string
  ) {
    try {
      // 1. Lookup role id
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', roleName)
        .maybeSingle();

      let roleId = roleData?.id;
      if (!roleId) {
        const { data: fallbackRole } = await supabase
          .from('roles')
          .select('id')
          .limit(1)
          .maybeSingle();
        roleId = fallbackRole?.id;
      }

      // 2. Create system_user_profile
      const { data: newProfile, error: profileErr } = await supabase
        .from('system_user_profiles')
        .insert({
          employee_id: employee.id,
          username: employee.email.split('@')[0] || employee.employee_id.toLowerCase(),
          email: employee.email,
          role_id: roleId,
          status: 'Active',
          is_super_admin: roleName === 'Super Administrator'
        })
        .select()
        .maybeSingle();

      if (profileErr) throw profileErr;

      // 3. Grant user_branch_access
      if (newProfile?.id && employee.branch_id) {
        await supabase
          .from('user_branch_access')
          .insert({
            user_id: newProfile.id,
            branch_id: employee.branch_id,
            is_default: true,
            granted_by: authorizedByUserId || null
          });
      }

      return { data: newProfile, error: null };
    } catch (err: any) {
      console.error('Exception creating employee user account:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Fetch or generate Digital Employee ID Card
   */
  async getOrGenerateIdCard(employeeId: string, branchId: string) {
    try {
      const { data: existingCard } = await supabase
        .from('employee_id_cards')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'Active')
        .maybeSingle();

      if (existingCard) {
        return { data: existingCard, error: null };
      }

      const cardNum = `SAMS-EMP-${new Date().getFullYear()}-${employeeId.substring(0, 6).toUpperCase()}`;
      const qrCode = `SAMS://VERIFY/EMP/${employeeId}/${Date.now()}`;
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 2);

      if (branchId) {
        const { data: newCard, error: insertErr } = await supabase
          .from('employee_id_cards')
          .insert({
            employee_id: employeeId,
            branch_id: branchId,
            card_number: cardNum,
            template_code: 'STAFF_CARD_V1',
            qr_verification_code: qrCode,
            issue_date: new Date().toISOString().split('T')[0],
            expiry_date: expiry.toISOString().split('T')[0],
            status: 'Active'
          })
          .select()
          .maybeSingle();

        if (insertErr) console.warn('Employee card insert notice:', insertErr.message);
        return { data: newCard || null, error: null };
      }

      return { data: null, error: null };
    } catch (err: any) {
      console.error('Exception with employee ID card:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Helper to map DbEmployee to application Teacher interface
   */
  mapDbEmployeeToTeacher(db: DbEmployee): any {
    const subjects = db.teacher_subject_assignments?.map(a => a.subjects?.subject_name).filter(Boolean) as string[] || [];
    const classes = db.teacher_subject_assignments?.map(a => a.classes?.name).filter(Boolean) as string[] || [];
    const primaryBank = db.employee_bank_accounts?.find(b => b.is_primary) || db.employee_bank_accounts?.[0];

    const branchHistory = db.employee_branch_history?.map(h => ({
      id: h.id,
      previousBranchId: h.previous_branch_id,
      newBranchId: h.new_branch_id,
      effectiveDate: h.effective_date,
      reason: h.reason,
      prevBranchCode: h.prev_branch?.branch_code,
      newBranchCode: h.new_branch?.branch_code
    })) || [];

    return {
      id: db.id,
      employeeId: db.employee_id,
      name: `${db.first_name || ''} ${db.last_name || ''}`.trim(),
      email: db.email,
      phone: db.phone,
      level: ['primary', 'secondary'],
      subjects: subjects.length > 0 ? subjects : ['General Education'],
      classesAssigned: classes.length > 0 ? classes : ['Grade 1'],
      joiningDate: db.employment_date,
      qualification: db.qualification || 'B.Ed / NCE',
      status: db.employment_status,
      employmentStatus: db.employment_status,
      department: db.department,
      position: db.position,
      branch: db.branches?.branch_code || 'GN',
      address: db.address || '',
      photoUrl: db.profile_photo_url || '',
      bankName: primaryBank?.bank_name || '',
      bankAccountName: primaryBank?.account_name || `${db.first_name} ${db.last_name}`,
      bankAccountNo: primaryBank?.account_number || '',
      branchHistory: branchHistory,
      attendance: [
        { date: '2026-03-01', status: 'Present' },
        { date: '2026-03-02', status: 'Present' }
      ],
      leaves: [],
      payroll: [
        { id: `PAY-${db.id.substring(0, 4)}`, month: 'February 2026', basic: 120000, bonus: 5000, deductions: 2500, net: 122500, status: 'Paid' }
      ],
      performanceScore: 92
    };
  }
};
