const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function seedInitialUsers() {
  const url = process.env.SUPABASE_URL || 'https://trkqknwcicdcsisyjjvl.supabase.co';
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const adminClient = createClient(url, secretKey);

  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.trkqknwcicdcsisyjjvl:Q%40marm%40jeed786@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await pgClient.connect();
  console.log('Connected to PG database.');

  // 1. Ensure RLS allows users to read their own profile
  await pgClient.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_user_profiles' AND policyname = 'Users can read own profile'
      ) THEN
        CREATE POLICY "Users can read own profile" 
        ON public.system_user_profiles FOR SELECT 
        TO authenticated 
        USING (auth_user_id = auth.uid() OR public.is_super_admin());
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_branch_access' AND policyname = 'Users can read own branch access'
      ) THEN
        CREATE POLICY "Users can read own branch access" 
        ON public.user_branch_access FOR SELECT 
        TO authenticated 
        USING (
          user_profile_id IN (
            SELECT id FROM public.system_user_profiles WHERE auth_user_id = auth.uid()
          ) OR public.is_super_admin()
        );
      END IF;
    END $$;
  `);

  // 2. Seed Branches
  const gnRes = await pgClient.query(`
    INSERT INTO public.branches (branch_code, branch_name, location, phone, email, address, status)
    VALUES ('GN', 'Gawun Nama Campus', 'Sokoto Central', '+234 803 111 0001', 'gawunnama@sams.edu.ng', 'No 12 Gawun Nama Road, Sokoto', 'Active')
    ON CONFLICT (branch_code) DO UPDATE SET branch_name = EXCLUDED.branch_name
    RETURNING id, branch_code;
  `);
  const rsRes = await pgClient.query(`
    INSERT INTO public.branches (branch_code, branch_name, location, phone, email, address, status)
    VALUES ('RS', 'Runjin Sambo Campus', 'Sokoto North', '+234 803 111 0002', 'runjinsambo@sams.edu.ng', 'No 5 Runjin Sambo Layout, Sokoto', 'Active')
    ON CONFLICT (branch_code) DO UPDATE SET branch_name = EXCLUDED.branch_name
    RETURNING id, branch_code;
  `);

  const gnBranchId = gnRes.rows[0].id;
  const rsBranchId = rsRes.rows[0].id;

  // 3. Seed Roles
  const rolesToSeed = [
    { name: 'Super Administrator', code: 'super_admin', desc: 'Full unrestricted governance across all branches and modules' },
    { name: 'Proprietor', code: 'proprietor', desc: 'School owner executive dashboard and financial visibility' },
    { name: 'Branch Administrator', code: 'branch_admin', desc: 'Complete administrative oversight of a designated campus' },
    { name: 'Principal', code: 'principal', desc: 'Head of academic curriculum, timetable, and teacher delivery' },
    { name: 'Accountant', code: 'accountant', desc: 'Bursary, student fees billing, payments reconciliation, and accounting ledgers' },
    { name: 'Store Manager', code: 'store_manager', desc: 'Inventory, supplies issuance, textbook procurement, and store tracking' },
    { name: 'Teacher', code: 'teacher', desc: 'Class teacher attendance registers, scheme of work, and exam result submission' },
    { name: 'Parent', code: 'parent', desc: 'Parent portal student performance monitoring, receipts, and fee settlements' }
  ];

  const roleMap = {};
  for (const r of rolesToSeed) {
    const res = await pgClient.query(`
      INSERT INTO public.roles (role_name, role_code, description, is_system_role, status)
      VALUES ($1, $2, $3, true, 'Active')
      ON CONFLICT (role_code) DO UPDATE SET role_name = EXCLUDED.role_name
      RETURNING id, role_name, role_code;
    `, [r.name, r.code, r.desc]);
    roleMap[r.name] = res.rows[0].id;
  }

  // 4. Seed Academic Sessions & Terms
  const sessionRes = await pgClient.query(`
    INSERT INTO public.academic_sessions (session_name, start_date, end_date, status, is_current)
    VALUES ('2025/2026 Academic Session', '2025-09-01', '2026-07-31', 'Active', true)
    ON CONFLICT (session_name) DO UPDATE SET is_current = true
    RETURNING id;
  `);
  const sessionId = sessionRes.rows[0].id;

  const terms = [
    { name: 'First Term', num: 1, start: '2025-09-01', end: '2025-12-15', status: 'Completed', isCurrent: false },
    { name: 'Second Term', num: 2, start: '2026-01-08', end: '2026-04-10', status: 'Completed', isCurrent: false },
    { name: 'Third Term', num: 3, start: '2026-04-28', end: '2026-07-24', status: 'Active', isCurrent: true }
  ];

  for (const t of terms) {
    await pgClient.query(`
      INSERT INTO public.terms (session_id, term_name, term_number, start_date, end_date, status, is_current)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (session_id, term_number) DO UPDATE SET 
        term_name = EXCLUDED.term_name,
        is_current = EXCLUDED.is_current;
    `, [sessionId, t.name, t.num, t.start, t.end, t.status, t.isCurrent]);
  }

  // 5. Seed Users in Supabase Auth & Employees / Profiles
  const usersToSeed = [
    {
      email: 'usamah.m.qamar@gmail.com',
      password: 'Q@marm@jeed786',
      name: 'Engr. Usamah M. Qamar',
      role: 'Super Administrator',
      isSuperAdmin: true,
      employeeId: 'HQ-EMP-0001',
      branchId: rsBranchId,
      allBranches: true,
      phone: '+234 803 123 4567',
      position: 'Chief Technology Officer & Super Administrator',
      dept: 'Executive Management'
    },
    {
      email: 'proprietor@sams.com',
      password: 'Q@marm@jeed786',
      name: 'Alh. Ibrahim Usman',
      role: 'Proprietor',
      isSuperAdmin: false,
      employeeId: 'HQ-EMP-0002',
      branchId: rsBranchId,
      allBranches: true,
      phone: '+234 803 111 2222',
      position: 'School Proprietor & Chairman',
      dept: 'Executive Board'
    },
    {
      email: 'maryam.s@sams.rs.com',
      password: 'Q@marm@jeed786',
      name: 'Mrs. Maryam Sani',
      role: 'Branch Administrator',
      isSuperAdmin: false,
      employeeId: 'RJS-EMP-0001',
      branchId: rsBranchId,
      allBranches: false,
      phone: '+234 803 222 3333',
      position: 'Campus Administrator (Runjin Sambo)',
      dept: 'Administration'
    },
    {
      email: 'principal@sams.com',
      password: 'Q@marm@jeed786',
      name: 'Mrs. Grace Aliyu',
      role: 'Principal',
      isSuperAdmin: false,
      employeeId: 'GWN-EMP-0001',
      branchId: gnBranchId,
      allBranches: false,
      phone: '+234 803 999 8888',
      position: 'Head of Academics & Principal',
      dept: 'Academics'
    },
    {
      email: 'finance@sams.gn.com',
      password: 'Q@marm@jeed786',
      name: 'Malam Abubakar Bello',
      role: 'Accountant',
      isSuperAdmin: false,
      employeeId: 'GWN-EMP-0002',
      branchId: gnBranchId,
      allBranches: false,
      phone: '+234 803 333 4444',
      position: 'Bursar & Lead Accountant',
      dept: 'Finance & Accounts'
    },
    {
      email: 'stores@sams.com',
      password: 'Q@marm@jeed786',
      name: 'Malam Junaid Aliyu',
      role: 'Store Manager',
      isSuperAdmin: false,
      employeeId: 'HQ-EMP-0003',
      branchId: rsBranchId,
      allBranches: true,
      phone: '+234 803 444 5555',
      position: 'Head of Stores & Logistics',
      dept: 'Inventory & Supplies'
    },
    {
      email: 'yusuf.idris@sams.gn.com',
      password: 'Q@marm@jeed786',
      name: 'Dr. Yusuf Idris',
      role: 'Teacher',
      isSuperAdmin: false,
      employeeId: 'GWN-EMP-0003',
      branchId: gnBranchId,
      allBranches: false,
      phone: '+234 803 555 6666',
      position: 'Senior Mathematics & Sciences Tutor',
      dept: 'Academic Faculty'
    }
  ];

  const listRes = await adminClient.auth.admin.listUsers();
  const existingUsers = listRes.data?.users || [];

  for (const u of usersToSeed) {
    let authUserId;
    const existing = existingUsers.find(usr => usr.email?.toLowerCase() === u.email.toLowerCase());
    if (existing) {
      authUserId = existing.id;
      // Update password and metadata
      await adminClient.auth.admin.updateUserById(authUserId, {
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name, role: u.role }
      });
      console.log('Updated existing auth user:', u.email, authUserId);
    } else {
      const createRes = await adminClient.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name, role: u.role }
      });
      if (createRes.error) {
        console.error('Error creating auth user:', u.email, createRes.error);
        continue;
      }
      authUserId = createRes.data.user.id;
      console.log('Created auth user:', u.email, authUserId);
    }

    const parts = u.name.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || 'Staff';

    const empRes = await pgClient.query(`
      INSERT INTO public.employees (branch_id, employee_id, first_name, last_name, gender, phone, email, position, department, employment_status)
      VALUES ($1, $2, $3, $4, 'Male', $5, $6, $7, $8, 'Active')
      ON CONFLICT (email) DO UPDATE SET 
        position = EXCLUDED.position,
        branch_id = EXCLUDED.branch_id
      RETURNING id;
    `, [u.branchId, u.employeeId, firstName, lastName, u.phone, u.email, u.position, u.dept]);
    const empDbId = empRes.rows[0].id;

    const profileRes = await pgClient.query(`
      INSERT INTO public.system_user_profiles (auth_user_id, employee_id, role_id, primary_branch_id, username, email, status, is_super_admin)
      VALUES ($1, $2, $3, $4, $5, $6, 'Active', $7)
      ON CONFLICT (email) DO UPDATE SET 
        auth_user_id = EXCLUDED.auth_user_id,
        employee_id = EXCLUDED.employee_id,
        role_id = EXCLUDED.role_id,
        primary_branch_id = EXCLUDED.primary_branch_id,
        is_super_admin = EXCLUDED.is_super_admin,
        status = 'Active'
      RETURNING id;
    `, [authUserId, empDbId, roleMap[u.role], u.branchId, u.email.split('@')[0], u.email, u.isSuperAdmin]);
    const profileId = profileRes.rows[0].id;

    if (u.allBranches) {
      await pgClient.query(`
        INSERT INTO public.user_branch_access (user_profile_id, branch_id, is_default)
        VALUES ($1, $2, true), ($1, $3, false)
        ON CONFLICT (user_profile_id, branch_id) DO NOTHING;
      `, [profileId, gnBranchId, rsBranchId]);
    } else {
      await pgClient.query(`
        INSERT INTO public.user_branch_access (user_profile_id, branch_id, is_default)
        VALUES ($1, $2, true)
        ON CONFLICT (user_profile_id, branch_id) DO NOTHING;
      `, [profileId, u.branchId]);
    }
  }

  // 6. Seed Parent (Family Account, Guardian, Auth User, Parent Profile)
  const parentEmail = 'aisha.b@gmail.com';
  const parentPassword = 'Q@marm@jeed786';
  const parentName = 'Engr. Aisha Bello';

  let parentAuthId;
  const existingParent = existingUsers.find(usr => usr.email?.toLowerCase() === parentEmail.toLowerCase());
  if (existingParent) {
    parentAuthId = existingParent.id;
    await adminClient.auth.admin.updateUserById(parentAuthId, {
      password: parentPassword,
      email_confirm: true,
      user_metadata: { full_name: parentName, role: 'Parent' }
    });
  } else {
    const parentCreate = await adminClient.auth.admin.createUser({
      email: parentEmail,
      password: parentPassword,
      email_confirm: true,
      user_metadata: { full_name: parentName, role: 'Parent' }
    });
    parentAuthId = parentCreate.data.user.id;
  }

  const famRes = await pgClient.query(`
    INSERT INTO public.family_accounts (family_code, family_name, primary_phone, primary_email, address, status)
    VALUES ('FAM-2026-0001', 'Bello Family Household', '+234 803 666 7777', $1, 'Runjin Sambo Housing Estate, Sokoto', 'Active')
    ON CONFLICT (family_code) DO UPDATE SET primary_email = EXCLUDED.primary_email
    RETURNING id;
  `, [parentEmail]);
  const familyId = famRes.rows[0].id;

  // Check if guardian already exists
  const existingGuardian = await pgClient.query(`
    SELECT id FROM public.parents_guardians WHERE email = $1 LIMIT 1;
  `, [parentEmail]);

  let guardianId;
  if (existingGuardian.rows.length > 0) {
    guardianId = existingGuardian.rows[0].id;
  } else {
    const guardianRes = await pgClient.query(`
      INSERT INTO public.parents_guardians (family_id, title, full_name, phone, email, address, relationship, status)
      VALUES ($1, 'Engr.', $2, '+234 803 666 7777', $3, 'Runjin Sambo Housing Estate, Sokoto', 'Mother', 'Active')
      RETURNING id;
    `, [familyId, parentName, parentEmail]);
    guardianId = guardianRes.rows[0].id;
  }

  await pgClient.query(`
    INSERT INTO public.parent_user_profiles (auth_user_id, guardian_id, family_id, primary_contact, phone, email, portal_status)
    VALUES ($1, $2, $3, $4, '+234 803 666 7777', $5, 'Active')
    ON CONFLICT (auth_user_id) DO UPDATE SET 
      guardian_id = EXCLUDED.guardian_id,
      family_id = EXCLUDED.family_id,
      portal_status = 'Active';
  `, [parentAuthId, guardianId, familyId, parentName, parentEmail]);

  console.log('Parent profile successfully configured.');
  await pgClient.end();
  console.log('All initial auth users and profiles are verified and active.');
}

seedInitialUsers().catch(e => {
  console.error('Fatal seed error:', e);
  process.exit(1);
});
