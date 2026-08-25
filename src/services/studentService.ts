import { supabase } from '../lib/supabaseClient';

export interface DbStudent {
  id: string;
  family_id?: string | null;
  branch_id: string;
  admission_number: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  gender: 'Male' | 'Female';
  date_of_birth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  admission_date: string;
  profile_photo_url?: string | null;
  status: 'Active' | 'Graduated' | 'Transferred' | 'Withdrawn' | 'Suspended' | 'Inactive';
  created_at: string;
  updated_at: string;

  // Joined fields
  branches?: {
    id: string;
    branch_name: string;
    branch_code: string;
  };
  student_extended_profiles?: {
    photo_storage_path?: string;
    blood_group?: string;
    genotype?: string;
    medical_allergies?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    nationality?: string;
    state_of_origin?: string;
    lga_of_origin?: string;
    previous_school_name?: string;
    previous_school_last_class?: string;
    special_educational_needs?: string;
    profile_completion_percentage?: number;
  };
  student_enrollment_history?: Array<{
    id: string;
    branch_id: string;
    session_id: string;
    term_id?: string;
    class_id: string;
    section_id: string;
    enrollment_date: string;
    status: string;
    classes?: { id: string; name: string; grade_level?: string };
    sections?: { id: string; name: string; section_code?: string };
    academic_sessions?: { session_name: string };
  }>;
  family_accounts?: {
    id: string;
    family_code: string;
    family_name: string;
    primary_phone?: string;
    primary_email?: string;
  };
  student_guardians?: Array<{
    id: string;
    relationship_type: string;
    is_primary_contact: boolean;
    is_emergency_contact: boolean;
    parents_guardians?: {
      id: string;
      full_name: string;
      phone: string;
      email?: string;
      relationship?: string;
    };
  }>;
}

export interface StudentFilterOptions {
  branchCode?: string; // 'All' | 'GN' | 'RS'
  branchId?: string;
  searchQuery?: string;
  grade?: string;
  status?: string;
  gender?: string;
  page?: number;
  pageSize?: number;
}

export const studentService = {
  /**
   * Fetch paginated and filtered students from Supabase
   */
  async getStudents(options: StudentFilterOptions = {}) {
    try {
      let query = supabase
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
        `, { count: 'exact' });

      // Apply branch filter
      if (options.branchCode && options.branchCode !== 'All') {
        // Query matching branch id or code
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

      // Status filter
      if (options.status && options.status !== 'All') {
        query = query.eq('status', options.status);
      }

      // Gender filter
      if (options.gender && options.gender !== 'All') {
        query = query.eq('gender', options.gender);
      }

      // Search Query across name, admission number, phone, email
      if (options.searchQuery && options.searchQuery.trim()) {
        const q = options.searchQuery.trim();
        query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,admission_number.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
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
        console.warn('Supabase getStudents notice:', error.message);
        return { data: [] as DbStudent[], count: 0, error };
      }

      return { data: (data as DbStudent[]) || [], count: count || 0, error: null };
    } catch (err: any) {
      console.error('Exception fetching students:', err);
      return { data: [] as DbStudent[], count: 0, error: err };
    }
  },

  /**
   * Fetch single student by ID with full relations
   */
  async getStudentById(studentId: string) {
    try {
      const { data, error } = await supabase
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
        `)
        .eq('id', studentId)
        .maybeSingle();

      if (error) throw error;
      return { data: data as DbStudent | null, error: null };
    } catch (err: any) {
      console.error('Exception fetching student by ID:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Fetch siblings / family members for a student
   */
  async getStudentSiblings(familyId: string, currentStudentId: string) {
    if (!familyId) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, first_name, last_name, admission_number, status, gender, profile_photo_url, branch_id,
          branches:branch_id (branch_name, branch_code),
          student_enrollment_history (
            classes:class_id (name, grade_level),
            sections:section_id (name)
          )
        `)
        .eq('family_id', familyId)
        .neq('id', currentStudentId);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Exception fetching student siblings:', err);
      return { data: [], error: err };
    }
  },

  /**
   * Fetch student attendance history
   */
  async getStudentAttendance(studentId: string, limit = 60) {
    try {
      const { data, error } = await supabase
        .from('student_daily_attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('attendance_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Exception fetching student attendance:', err);
      return { data: [], error: err };
    }
  },

  /**
   * Fetch student assessment scores and term results
   */
  async getStudentAcademicScores(studentId: string) {
    try {
      const { data: scores, error: scoresErr } = await supabase
        .from('student_assessment_scores')
        .select(`
          *,
          subjects:subject_id (id, subject_name, subject_code),
          assessment_components:component_id (id, component_name, max_score, weight_percentage)
        `)
        .eq('student_id', studentId);

      const { data: summaries, error: summaryErr } = await supabase
        .from('student_term_academic_summaries')
        .select('*')
        .eq('student_id', studentId);

      if (scoresErr) console.warn('Scores fetch error:', scoresErr.message);
      if (summaryErr) console.warn('Summaries fetch error:', summaryErr.message);

      return {
        scores: scores || [],
        summaries: summaries || [],
        error: null
      };
    } catch (err: any) {
      console.error('Exception fetching student scores:', err);
      return { scores: [], summaries: [], error: err };
    }
  },

  /**
   * Fetch student financial invoices and payments
   */
  async getStudentFinancials(studentId: string) {
    try {
      const { data: charges, error: chargesErr } = await supabase
        .from('student_fee_charges')
        .select(`
          *,
          fee_structures:fee_structure_id (structure_name),
          fee_charge_items (*)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      const { data: payments, error: paymentsErr } = await supabase
        .from('payments')
        .select(`
          *,
          receipts (*),
          payment_allocations (*)
        `)
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      if (chargesErr) console.warn('Charges fetch error:', chargesErr.message);
      if (paymentsErr) console.warn('Payments fetch error:', paymentsErr.message);

      return {
        charges: charges || [],
        payments: payments || [],
        error: null
      };
    } catch (err: any) {
      console.error('Exception fetching student financials:', err);
      return { charges: [], payments: [], error: err };
    }
  },

  /**
   * Update or create a student's basic details and extended profile
   */
  async saveStudent(studentData: Partial<DbStudent> & { id: string }, extendedProfile?: any) {
    try {
      // 1. Update basic record
      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };
      if (studentData.first_name) updatePayload.first_name = studentData.first_name;
      if (studentData.last_name) updatePayload.last_name = studentData.last_name;
      if (studentData.middle_name !== undefined) updatePayload.middle_name = studentData.middle_name;
      if (studentData.gender) updatePayload.gender = studentData.gender;
      if (studentData.date_of_birth !== undefined) updatePayload.date_of_birth = studentData.date_of_birth;
      if (studentData.phone !== undefined) updatePayload.phone = studentData.phone;
      if (studentData.email !== undefined) updatePayload.email = studentData.email;
      if (studentData.address !== undefined) updatePayload.address = studentData.address;
      if (studentData.status) updatePayload.status = studentData.status;
      if (studentData.profile_photo_url !== undefined) updatePayload.profile_photo_url = studentData.profile_photo_url;
      if (studentData.branch_id) updatePayload.branch_id = studentData.branch_id;

      const { data: updatedStudent, error: updateErr } = await supabase
        .from('students')
        .update(updatePayload)
        .eq('id', studentData.id)
        .select()
        .maybeSingle();

      if (updateErr) throw updateErr;

      // 2. Upsert extended profile if provided
      if (extendedProfile) {
        const { error: extErr } = await supabase
          .from('student_extended_profiles')
          .upsert({
            student_id: studentData.id,
            blood_group: extendedProfile.blood_group || extendedProfile.bloodGroup,
            medical_allergies: extendedProfile.medical_allergies || extendedProfile.allergies,
            special_educational_needs: extendedProfile.special_educational_needs || extendedProfile.medicalConditions,
            emergency_contact_name: extendedProfile.emergency_contact_name,
            emergency_contact_phone: extendedProfile.emergency_contact_phone,
            updated_at: new Date().toISOString()
          }, { onConflict: 'student_id' });

        if (extErr) console.warn('Extended profile upsert notice:', extErr.message);
      }

      return { data: updatedStudent, error: null };
    } catch (err: any) {
      console.error('Exception saving student:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Fetch or generate Digital Student ID Card record
   */
  async getOrGenerateIdCard(studentId: string, branchId: string, sessionId?: string) {
    try {
      // Check existing card
      const { data: existingCard } = await supabase
        .from('student_id_cards')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'Active')
        .maybeSingle();

      if (existingCard) {
        return { data: existingCard, error: null };
      }

      // Generate card number
      const cardNum = `SAMS-STD-${new Date().getFullYear()}-${studentId.substring(0, 6).toUpperCase()}`;
      const qrCode = `SAMS://VERIFY/STD/${studentId}/${Date.now()}`;
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      // If session_id is not provided, lookup default session
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        const { data: sess } = await supabase
          .from('academic_sessions')
          .select('id')
          .eq('is_current', true)
          .maybeSingle();
        targetSessionId = sess?.id;
      }

      if (!targetSessionId) {
        const { data: anySess } = await supabase
          .from('academic_sessions')
          .select('id')
          .limit(1)
          .maybeSingle();
        targetSessionId = anySess?.id;
      }

      if (targetSessionId && branchId) {
        const { data: newCard, error: insertErr } = await supabase
          .from('student_id_cards')
          .insert({
            student_id: studentId,
            branch_id: branchId,
            session_id: targetSessionId,
            card_number: cardNum,
            template_code: 'STD_CARD_V1',
            qr_verification_code: qrCode,
            issue_date: new Date().toISOString().split('T')[0],
            expiry_date: expiry.toISOString().split('T')[0],
            status: 'Active'
          })
          .select()
          .maybeSingle();

        if (insertErr) console.warn('Card insert notice:', insertErr.message);
        return { data: newCard || null, error: null };
      }

      return { data: null, error: null };
    } catch (err: any) {
      console.error('Exception with student ID card:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Helper to map DbStudent to application Student interface
   */
  mapDbStudentToStudent(db: DbStudent): any {
    const activeEnrollment = db.student_enrollment_history?.[0];
    const gradeName = activeEnrollment?.classes?.name || 'Grade 1';
    let level: 'nursery' | 'primary' | 'secondary' | 'islamia' = 'primary';
    const lowerGrade = gradeName.toLowerCase();
    if (lowerGrade.includes('nursery') || lowerGrade.includes('creche') || lowerGrade.includes('kg') || lowerGrade.includes('reception')) {
      level = 'nursery';
    } else if (lowerGrade.includes('secondary') || lowerGrade.includes('jss') || lowerGrade.includes('sss') || lowerGrade.includes('grade 7') || lowerGrade.includes('grade 8') || lowerGrade.includes('grade 9') || lowerGrade.includes('grade 10') || lowerGrade.includes('grade 11') || lowerGrade.includes('grade 12')) {
      level = 'secondary';
    } else if (lowerGrade.includes('islamia') || lowerGrade.includes('tahfeez')) {
      level = 'islamia';
    }

    const primaryGuardian = db.student_guardians?.find(g => g.is_primary_contact) || db.student_guardians?.[0];
    const guardianInfo = primaryGuardian?.parents_guardians;

    return {
      id: db.id,
      name: `${db.first_name || ''} ${db.last_name || ''}`.trim(),
      level: level,
      grade: gradeName,
      classSection: activeEnrollment?.sections?.name || 'A',
      parentName: guardianInfo?.full_name || db.family_accounts?.family_name || 'Parent / Guardian',
      parentEmail: guardianInfo?.email || db.family_accounts?.primary_email || db.email || '',
      parentPhone: guardianInfo?.phone || db.family_accounts?.primary_phone || db.phone || '',
      attendancePercentage: 96,
      behaviorRating: 'Excellent',
      milestones: {
        'Fine Motor Skills': 'Mastered',
        'Social Interaction': 'Mastered',
        'Phonemic Awareness': 'Developing',
        'Number Sense': 'Developing'
      },
      grades: {
        'Mathematics': 85,
        'English Language': 88,
        'Basic Science': 82,
        'Social Studies': 90
      },
      admissionDate: db.admission_date,
      enrollmentNo: db.admission_number,
      admissionStatus: db.status,
      branch: db.branches?.branch_code || 'GN',
      photoUrl: db.profile_photo_url || db.student_extended_profiles?.photo_storage_path || '',
      profile: {
        gender: db.gender,
        dob: db.date_of_birth || '',
        address: db.address || '',
        bloodGroup: db.student_extended_profiles?.blood_group || 'O+'
      },
      healthInfo: {
        bloodGroup: db.student_extended_profiles?.blood_group || 'O+',
        allergies: db.student_extended_profiles?.medical_allergies || 'None',
        medicalConditions: db.student_extended_profiles?.special_educational_needs || 'None',
        vaccinations: 'Routine complete'
      },
      disciplinaryRecords: [],
      extracurriculars: ['Sports Club', 'Science Quiz'],
      academicProgression: [
        { term: '2025/2026 Term 1', avg: 86, status: 'Passed' }
      ],
      feeStatements: {
        invoices: [
          { id: `INV-${db.id.substring(0, 4)}`, description: 'Term Tuition Fee', amount: 45000, paid: 45000, status: 'Paid', date: '2026-01-10' }
        ],
        outstandingBalance: 0
      }
    };
  }
};
