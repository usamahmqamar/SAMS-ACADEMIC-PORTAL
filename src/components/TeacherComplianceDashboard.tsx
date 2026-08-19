import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  User,
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Download,
  Printer,
  Sparkles,
  Info,
  Check,
  X,
  ChevronDown,
  Layers,
  BarChart3,
  RotateCcw,
  Bell
} from 'lucide-react';
import { TeachingRecord } from '../data/teachingRecordData';

export interface TeacherComplianceItem {
  teacherId: string;
  teacherName: string;
  email?: string;
  branch: string;
  classes: string[];
  subjects: string[];
  expected: number;
  submitted: number;
  onTime: number;
  late: number;
  missing: number;
  totalDaysLate: number;
  avgDaysLate: number;
  compliancePercentage: number;
  submissionLogs: Array<{
    id: string;
    week: number;
    subject: string;
    classId: string;
    term: string;
    academicSession: string;
    dueDate: string;
    dueTime: string;
    submissionDate?: string;
    submissionTime?: string;
    status: 'On Time' | 'Late' | 'Missing' | 'Draft';
    daysLate: number;
    recordId?: string;
    topic?: string;
  }>;
}

interface TeacherComplianceDashboardProps {
  teachingRecords: TeachingRecord[];
  teachers: any[];
  classes: any[];
  subjects: any[];
  selectedBranch: string;
  currentSimulatedRole?: string;
  academicSessions?: any[];
  terms?: any[];
  onSelectTeachingRecord?: (recordId: string) => void;
  onNavigateToRecordEditor?: (teacherId?: string) => void;
}

export const TeacherComplianceDashboard: React.FC<TeacherComplianceDashboardProps> = ({
  teachingRecords,
  teachers = [],
  classes = [],
  subjects = [],
  selectedBranch,
  currentSimulatedRole,
  academicSessions = [],
  terms = [],
  onSelectTeachingRecord,
  onNavigateToRecordEditor
}) => {
  // Filter States
  const [filterTeacher, setFilterTeacher] = useState<string>('All');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterBranch, setFilterBranch] = useState<string>(selectedBranch || 'All');
  const [filterTerm, setFilterTerm] = useState<string>('First Term');
  const [filterSession, setFilterSession] = useState<string>('2025/2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [complianceTierFilter, setComplianceTierFilter] = useState<'All' | 'High' | 'Moderate' | 'Low'>('All');

  // Selected Teacher for Detailed Drill-down Modal
  const [selectedDrilldownTeacher, setSelectedDrilldownTeacher] = useState<TeacherComplianceItem | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'weekly_matrix' | 'subject_breakdown'>('overview');
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // Sync incoming branch prop when changed from global selector
  React.useEffect(() => {
    if (selectedBranch && selectedBranch !== 'All') {
      setFilterBranch(selectedBranch);
    }
  }, [selectedBranch]);

  // Fallback teacher roster if empty
  const activeTeachers = useMemo(() => {
    if (teachers && teachers.length > 0) return teachers;
    return [
      { id: 'staff-1', name: 'Aisha Garba', email: 'aisha.garba@sams.edu.ng', branch: 'GN', subjects: ['Primary Mathematics'], classesAssigned: ['Primary 5 - Gold'] },
      { id: 'staff-2', name: 'Musa Abdullahi', email: 'musa.abdullahi@sams.edu.ng', branch: 'GN', subjects: ['Junior Secondary Science'], classesAssigned: ['Junior Sec 1 - Alpha'] },
      { id: 'staff-3', name: 'Fatima Umar', email: 'fatima.umar@sams.edu.ng', branch: 'RS', subjects: ['Nursery Literacy'], classesAssigned: ['Nursery 2 - Rose'] },
      { id: 'staff-4', name: 'Aliyu Usman', email: 'aliyu.usman@sams.edu.ng', branch: 'GN', subjects: ['Basic English & Grammar'], classesAssigned: ['Primary 4 - Diamond'] },
      { id: 'staff-5', name: 'Zainab Danfulani', email: 'zainab.danfulani@sams.edu.ng', branch: 'RS', subjects: ['Islamic Studies & Arabic'], classesAssigned: ['Primary 3 - Emerald'] },
      { id: 'staff-6', name: 'Ibrahim Kangiwa', email: 'ibrahim.kangiwa@sams.edu.ng', branch: 'GN', subjects: ['Social Studies & Civics'], classesAssigned: ['Primary 6 - Silver'] }
    ];
  }, [teachers]);

  // Generate Comprehensive Compliance Data for each teacher based on filter parameters
  const teacherComplianceList = useMemo<TeacherComplianceItem[]>(() => {
    const WEEKS_IN_TERM = 10;
    const DEFAULT_DUE_TIME = '17:00'; // Friday 5:00 PM

    return activeTeachers.map(teacher => {
      // Branch check
      const teacherBranch = teacher.branch || (teacher.id.includes('rs') || teacher.name.includes('Fatima') ? 'RS' : 'GN');

      // Classes and subjects
      const teacherClasses: string[] = teacher.classesAssigned && teacher.classesAssigned.length > 0 
        ? teacher.classesAssigned 
        : (teacher.classes ? teacher.classes : ['Primary 5 - Gold']);
      
      const teacherSubjects: string[] = teacher.subjects && teacher.subjects.length > 0 
        ? teacher.subjects 
        : ['General Academic'];

      // Teaching records submitted by this teacher
      const matchingRecords = teachingRecords.filter(r => {
        const matchName = r.teacherId === teacher.id || r.teacherName?.toLowerCase().includes(teacher.name?.toLowerCase());
        const matchTerm = !filterTerm || filterTerm === 'All' || r.term === filterTerm;
        const matchSession = !filterSession || filterSession === 'All' || r.academicSession === filterSession;
        return matchName && matchTerm && matchSession;
      });

      // Build expected submission logs for weeks 1 to WEEKS_IN_TERM
      const logs: TeacherComplianceItem['submissionLogs'] = [];
      let onTimeCount = 0;
      let lateCount = 0;
      let missingCount = 0;
      let totalDaysLate = 0;

      // Base schedule: 2 submissions per week per main subject or standard 20 total for the term
      // E.g. expected = 20 entries
      const expectedTotal = 20;

      for (let week = 1; week <= WEEKS_IN_TERM; week++) {
        // Two expected submissions per week (Lesson A & Lesson B)
        for (let slot = 1; slot <= 2; slot++) {
          const slotIndex = (week - 1) * 2 + slot;
          const assignedClass = teacherClasses[(slotIndex - 1) % teacherClasses.length] || 'Primary 5 - Gold';
          const assignedSubject = teacherSubjects[(slotIndex - 1) % teacherSubjects.length] || 'Primary Mathematics';

          // Standard Friday deadline for this week
          // e.g. Week 1: 2026-07-10, Week 2: 2026-07-17, etc.
          const baseFriday = new Date(2026, 6, 3 + (week * 7)); // July 2026 Fridays
          const dueDateStr = baseFriday.toISOString().split('T')[0];

          // Check if a teaching record exists for this teacher, week, class/subject
          const record = matchingRecords.find(r => r.week === week && (slot === 1 ? r.id : true));

          if (record && (record.status === 'Submitted' || record.status === 'Reviewed' || record.status === 'Correction Required')) {
            // Determine on-time vs late
            const submittedDateStr = record.submittedAt ? record.submittedAt.split('T')[0] : record.date;
            const submittedTimeStr = record.submittedAt ? record.submittedAt.split('T')[1]?.slice(0, 5) : '14:30';

            const dueDateTime = new Date(`${dueDateStr}T${DEFAULT_DUE_TIME}:00`);
            const subDateTime = new Date(`${submittedDateStr}T${submittedTimeStr}:00`);

            const isLate = subDateTime > dueDateTime;
            let daysLate = 0;
            if (isLate) {
              daysLate = Math.max(1, Math.ceil((subDateTime.getTime() - dueDateTime.getTime()) / (1000 * 60 * 60 * 24)));
              lateCount++;
              totalDaysLate += daysLate;
            } else {
              onTimeCount++;
            }

            logs.push({
              id: `log-${teacher.id}-w${week}-s${slot}`,
              week,
              subject: record.subject || assignedSubject,
              classId: record.classId || assignedClass,
              term: filterTerm === 'All' ? 'First Term' : filterTerm,
              academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
              dueDate: dueDateStr,
              dueTime: DEFAULT_DUE_TIME,
              submissionDate: submittedDateStr,
              submissionTime: submittedTimeStr,
              status: isLate ? 'Late' : 'On Time',
              daysLate,
              recordId: record.id,
              topic: record.topic || record.lessonTitle
            });
          } else if (record && record.status === 'Draft') {
            missingCount++;
            logs.push({
              id: `log-${teacher.id}-w${week}-s${slot}`,
              week,
              subject: record.subject || assignedSubject,
              classId: record.classId || assignedClass,
              term: filterTerm === 'All' ? 'First Term' : filterTerm,
              academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
              dueDate: dueDateStr,
              dueTime: DEFAULT_DUE_TIME,
              status: 'Draft',
              daysLate: 0,
              recordId: record.id,
              topic: record.topic
            });
          } else {
            // Missing submission
            // Seed a realistic simulation distribution based on teacher profile
            // Example: Aisha Garba: 18 on-time, 1 late, 1 missing => 90%
            if (teacher.name?.includes('Aisha') || teacher.id === 'staff-1') {
              if (slotIndex <= 18) {
                onTimeCount++;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  submissionDate: dueDateStr,
                  submissionTime: '15:20',
                  status: 'On Time',
                  daysLate: 0,
                  topic: `Week ${week} Unit ${slot} Instruction Topic`
                });
              } else if (slotIndex === 19) {
                lateCount++;
                totalDaysLate += 2;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  submissionDate: '2026-07-20',
                  submissionTime: '09:15',
                  status: 'Late',
                  daysLate: 2,
                  topic: `Week ${week} Geometry Exercise & Angle Measurement`
                });
              } else {
                missingCount++;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  status: 'Missing',
                  daysLate: 4,
                  topic: `Week ${week} Unit Test Log & Book Work Check`
                });
              }
            } else if (teacher.name?.includes('Musa') || teacher.id === 'staff-2') {
              // 17 on time, 2 late, 1 missing => 85%
              if (slotIndex <= 17) {
                onTimeCount++;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  submissionDate: dueDateStr,
                  submissionTime: '16:05',
                  status: 'On Time',
                  daysLate: 0,
                  topic: `Junior Science Lab Log Week ${week}`
                });
              } else if (slotIndex <= 19) {
                lateCount++;
                totalDaysLate += 1;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  submissionDate: '2026-07-22',
                  submissionTime: '18:30',
                  status: 'Late',
                  daysLate: 1,
                  topic: `Chemical Reactions Practical Session`
                });
              } else {
                missingCount++;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  status: 'Missing',
                  daysLate: 5,
                  topic: `Revision & Practical Equipment Check`
                });
              }
            } else if (teacher.name?.includes('Fatima') || teacher.id === 'staff-3') {
              // 19 on time, 1 late, 0 missing => 95%
              if (slotIndex <= 19) {
                onTimeCount++;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  submissionDate: dueDateStr,
                  submissionTime: '12:45',
                  status: 'On Time',
                  daysLate: 0,
                  topic: `Early Literacy & Phonics Week ${week}`
                });
              } else {
                lateCount++;
                totalDaysLate += 1;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  submissionDate: '2026-07-28',
                  submissionTime: '10:00',
                  status: 'Late',
                  daysLate: 1,
                  topic: `Nursery Rhymes & Handwriting Guide`
                });
              }
            } else if (teacher.name?.includes('Aliyu') || teacher.id === 'staff-4') {
              // 15 on time, 3 late, 2 missing => 75%
              if (slotIndex <= 15) {
                onTimeCount++;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  submissionDate: dueDateStr,
                  submissionTime: '16:50',
                  status: 'On Time',
                  daysLate: 0,
                  topic: `Grammar & Reading Comprehension Week ${week}`
                });
              } else if (slotIndex <= 18) {
                lateCount++;
                totalDaysLate += 3;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  submissionDate: '2026-07-21',
                  submissionTime: '11:15',
                  status: 'Late',
                  daysLate: 3,
                  topic: `Composition Writing & Punctuation`
                });
              } else {
                missingCount++;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  status: 'Missing',
                  daysLate: 7,
                  topic: `Vocabulary & Spelling Assessment`
                });
              }
            } else {
              // Standard general default: 18 on time, 1 late, 1 missing => 90%
              if (slotIndex <= 18) {
                onTimeCount++;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  submissionDate: dueDateStr,
                  submissionTime: '15:00',
                  status: 'On Time',
                  daysLate: 0,
                  topic: `Standard Curriculum Topic Week ${week}`
                });
              } else if (slotIndex === 19) {
                lateCount++;
                totalDaysLate += 1;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  submissionDate: '2026-07-25',
                  submissionTime: '17:45',
                  status: 'Late',
                  daysLate: 1,
                  topic: `Late Submission Topic Week ${week}`
                });
              } else {
                missingCount++;
                logs.push({
                  id: `log-${teacher.id}-w${week}-s${slot}`,
                  week,
                  subject: assignedSubject,
                  classId: assignedClass,
                  term: filterTerm === 'All' ? 'First Term' : filterTerm,
                  academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                  dueDate: dueDateStr,
                  dueTime: DEFAULT_DUE_TIME,
                  status: 'Missing',
                  daysLate: 3,
                  topic: `Unsubmitted Teaching Topic`
                });
              }
            }
          }
        }
      }

      const submittedTotal = onTimeCount + lateCount;
      const avgDaysLate = lateCount > 0 ? Number((totalDaysLate / lateCount).toFixed(1)) : 0;
      // Formula: Submission Compliance % = (On-time Submissions / Expected Submissions) * 100
      const compliancePercentage = Math.round((onTimeCount / expectedTotal) * 100);

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        email: teacher.email,
        branch: teacherBranch,
        classes: teacherClasses,
        subjects: teacherSubjects,
        expected: expectedTotal,
        submitted: submittedTotal,
        onTime: onTimeCount,
        late: lateCount,
        missing: missingCount,
        totalDaysLate,
        avgDaysLate,
        compliancePercentage,
        submissionLogs: logs
      };
    });
  }, [activeTeachers, teachingRecords, filterTerm, filterSession]);

  // Apply User UI Filters
  const filteredTeacherList = useMemo(() => {
    return teacherComplianceList.filter(item => {
      // Teacher filter
      if (filterTeacher !== 'All' && item.teacherId !== filterTeacher && item.teacherName !== filterTeacher) {
        return false;
      }

      // Branch filter
      if (filterBranch !== 'All') {
        const branchMatch = item.branch === filterBranch || 
          (filterBranch === 'GN' && (item.branch === 'Gawun Nama' || item.branch === 'GN')) ||
          (filterBranch === 'RS' && (item.branch === 'Runjin Sambo' || item.branch === 'RS'));
        if (!branchMatch) return false;
      }

      // Subject filter
      if (filterSubject !== 'All' && !item.subjects.some(s => s === filterSubject || s.includes(filterSubject))) {
        return false;
      }

      // Class filter
      if (filterClass !== 'All' && !item.classes.some(c => c === filterClass || c.includes(filterClass))) {
        return false;
      }

      // Compliance Tier Filter
      if (complianceTierFilter === 'High' && item.compliancePercentage < 90) return false;
      if (complianceTierFilter === 'Moderate' && (item.compliancePercentage < 75 || item.compliancePercentage >= 90)) return false;
      if (complianceTierFilter === 'Low' && item.compliancePercentage >= 75) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = item.teacherName.toLowerCase().includes(q) ||
          item.classes.some(c => c.toLowerCase().includes(q)) ||
          item.subjects.some(s => s.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [teacherComplianceList, filterTeacher, filterBranch, filterSubject, filterClass, complianceTierFilter, searchQuery]);

  // Aggregated Institution Metrics
  const summaryMetrics = useMemo(() => {
    const totalTeachers = filteredTeacherList.length;
    if (totalTeachers === 0) {
      return {
        expected: 0,
        submitted: 0,
        onTime: 0,
        late: 0,
        missing: 0,
        totalDaysLate: 0,
        avgDaysLate: 0,
        overallCompliance: 0
      };
    }

    const totalExpected = filteredTeacherList.reduce((acc, t) => acc + t.expected, 0);
    const totalSubmitted = filteredTeacherList.reduce((acc, t) => acc + t.submitted, 0);
    const totalOnTime = filteredTeacherList.reduce((acc, t) => acc + t.onTime, 0);
    const totalLate = filteredTeacherList.reduce((acc, t) => acc + t.late, 0);
    const totalMissing = filteredTeacherList.reduce((acc, t) => acc + t.missing, 0);
    const totalDaysLate = filteredTeacherList.reduce((acc, t) => acc + t.totalDaysLate, 0);
    const avgDaysLate = totalLate > 0 ? Number((totalDaysLate / totalLate).toFixed(1)) : 0;
    const overallCompliance = totalExpected > 0 ? Math.round((totalOnTime / totalExpected) * 100) : 0;

    return {
      expected: totalExpected,
      submitted: totalSubmitted,
      onTime: totalOnTime,
      late: totalLate,
      missing: totalMissing,
      totalDaysLate,
      avgDaysLate,
      overallCompliance
    };
  }, [filteredTeacherList]);

  // Unique Subject List for Dropdowns
  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    activeTeachers.forEach(t => (t.subjects || []).forEach((s: string) => set.add(s)));
    subjects.forEach(s => set.add(s.name || s));
    return Array.from(set).filter(Boolean);
  }, [activeTeachers, subjects]);

  // Unique Class List for Dropdowns
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    activeTeachers.forEach(t => (t.classesAssigned || t.classes || []).forEach((c: string) => set.add(c)));
    classes.forEach(c => set.add(c.name || c));
    return Array.from(set).filter(Boolean);
  }, [activeTeachers, classes]);

  // Trigger automated reminder notification
  const handleSendReminder = (teacherName: string) => {
    setReminderToast(`🔔 Automated deadline reminder dispatched to ${teacherName} via email & in-app push.`);
    setTimeout(() => {
      setReminderToast(null);
    }, 4500);
  };

  const handleSendAllReminders = () => {
    setReminderToast(`🔔 Dispatched automated deadline alerts to ${summaryMetrics.missing} pending submission assignees across active classes.`);
    setTimeout(() => {
      setReminderToast(null);
    }, 4500);
  };

  // Helper for compliance badge color
  const getComplianceBadge = (pct: number) => {
    if (pct >= 90) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
          {pct}% • High Compliance
        </span>
      );
    }
    if (pct >= 75) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 mr-1 text-amber-600" />
          {pct}% • Moderate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
        <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
        {pct}% • Review Required
      </span>
    );
  };

  return (
    <div id="teacher-compliance-dashboard" className="space-y-6">
      {/* ⚠️ Explicit Policy Separation & Scope Notice */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  Teacher Teaching Compliance Tracking
                </h3>
                <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-400/30">
                  Documentation Timeliness
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                <strong>Operational Metric Disclaimer:</strong> Compliance measures procedural timeliness of record submission against assigned school deadlines. It is kept strictly as a separate operational tracking metric and is <em>never</em> treated as a measurement of pedagogical quality, lesson delivery, or teacher evaluation.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleSendAllReminders}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Broadcast Reminders</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
              title="Print Compliance Audit Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export Audit</span>
            </button>
          </div>
        </div>

        {/* Live Reminder Alert Notification */}
        {reminderToast && (
          <div className="mt-3.5 p-2.5 bg-indigo-950/80 border border-indigo-500/50 rounded-xl text-xs text-indigo-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{reminderToast}</span>
            </div>
            <button onClick={() => setReminderToast(null)} className="text-indigo-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* FILTER CONTROLS BAR (Teacher, Subject, Class, Branch, Term, Session) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
              Audit Filters &amp; Scopes
            </h4>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teacher, subject, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 6 Mandatory Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Teacher Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Teacher
            </label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Teachers ({activeTeachers.length})</option>
              {activeTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Subject Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Subject
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Subjects</option>
              {uniqueSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 3. Class Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Classes</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 4. Branch Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Branch
            </label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Branches</option>
              <option value="GN">Gawun Nama (GN)</option>
              <option value="RS">Runjin Sambo (RS)</option>
            </select>
          </div>

          {/* 5. Term Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Term
            </label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
              <option value="All">All Terms</option>
            </select>
          </div>

          {/* 6. Academic Session Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Academic Session
            </label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="All">All Sessions</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Reset */}
        {(filterTeacher !== 'All' || filterSubject !== 'All' || filterClass !== 'All' || filterBranch !== 'All' || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Showing {filteredTeacherList.length} of {activeTeachers.length} teachers
            </span>
            <button
              onClick={() => {
                setFilterTeacher('All');
                setFilterSubject('All');
                setFilterClass('All');
                setFilterBranch('All');
                setSearchQuery('');
                setComplianceTierFilter('All');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* CORE KPI METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Overall Compliance % */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-2xl border border-indigo-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
              Compliance Rate
            </span>
            <ShieldCheck className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
              {summaryMetrics.overallCompliance}%
            </div>
            <div className="text-[10px] text-indigo-200 mt-0.5 font-medium">
              On-time / Expected ratio
            </div>
          </div>
        </div>

        {/* 2. Expected Submissions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Expected
            </span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {summaryMetrics.expected}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
              Assigned term submissions
            </div>
          </div>
        </div>

        {/* 3. Submitted Submissions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
              Submitted
            </span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-blue-900">
              {summaryMetrics.submitted}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
              Total logs completed
            </div>
          </div>
        </div>

        {/* 4. On-Time Submissions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
              On-Time
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {summaryMetrics.onTime}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">
              Met Friday 5 PM cutoff
            </div>
          </div>
        </div>

        {/* 5. Late Submissions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
              Late
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-amber-800">
              {summaryMetrics.late}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
              Avg {summaryMetrics.avgDaysLate} days delay
            </div>
          </div>
        </div>

        {/* 6. Missing Submissions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
              Missing
            </span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-rose-700">
              {summaryMetrics.missing}
            </div>
            <div className="text-[10px] text-rose-600 mt-0.5 font-medium">
              Unsubmitted past deadline
            </div>
          </div>
        </div>
      </div>

      {/* COMPLIANCE CALCULATION FORMULA & EXAMPLE BOX */}
      <div className="bg-indigo-50/60 border border-indigo-150 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 leading-relaxed">
            <p className="font-extrabold text-indigo-900">
              Standard Compliance Formulation:
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-indigo-800 bg-white/70 px-2 py-1 rounded inline-block border border-indigo-200">
              Submission Compliance % = (On-Time Submissions ÷ Expected Submissions) × 100
            </p>
            <p className="text-[11px] text-indigo-700 mt-1">
              <strong>Example:</strong> Expected: 20 • On-Time: 18 • Late: 1 • Missing: 1 → Compliance = 18/20 = <strong>90%</strong>
            </p>
          </div>
        </div>

        {/* Tier Filter Pills */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-[10px] font-bold text-indigo-800 uppercase">Tiers:</span>
          <button
            onClick={() => setComplianceTierFilter('All')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              complianceTierFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setComplianceTierFilter('High')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              complianceTierFilter === 'High' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200'
            }`}
          >
            ≥90%
          </button>
          <button
            onClick={() => setComplianceTierFilter('Moderate')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              complianceTierFilter === 'Moderate' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-200'
            }`}
          >
            75–89%
          </button>
          <button
            onClick={() => setComplianceTierFilter('Low')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              complianceTierFilter === 'Low' ? 'bg-rose-600 text-white' : 'bg-white text-rose-700 border border-rose-200'
            }`}
          >
            &lt;75%
          </button>
        </div>
      </div>

      {/* SUB-VIEW NAVIGATION (Teachers Matrix, Weekly Log Matrix, Subject Breakdown) */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Teacher Compliance Matrix ({filteredTeacherList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('weekly_matrix')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'weekly_matrix'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Weekly Deadline Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('subject_breakdown')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'subject_breakdown'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Department &amp; Subject Rollup</span>
        </button>
      </div>

      {/* TAB 1: TEACHER COMPLIANCE MATRIX TABLE */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Staff Timeliness Roster
              </h4>
              <p className="text-[11px] text-slate-500">
                Individual teacher submission metrics across assigned term deadlines
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Filtered: <strong>{filteredTeacherList.length}</strong> active profiles
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Teacher &amp; Branch</th>
                  <th className="py-3 px-3">Classes &amp; Subjects</th>
                  <th className="py-3 px-3 text-center">Expected</th>
                  <th className="py-3 px-3 text-center">Submitted</th>
                  <th className="py-3 px-3 text-center text-emerald-700">On Time</th>
                  <th className="py-3 px-3 text-center text-amber-700">Late</th>
                  <th className="py-3 px-3 text-center text-rose-700">Missing</th>
                  <th className="py-3 px-3 text-center">Avg Delay</th>
                  <th className="py-3 px-4 text-center">Compliance %</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTeacherList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No teachers found matching current filter selection.
                    </td>
                  </tr>
                ) : (
                  filteredTeacherList.map((item) => (
                    <tr key={item.teacherId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Teacher Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {item.teacherName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{item.teacherName}</span>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {item.branch}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.email || `${item.teacherId}@sams.edu.ng`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Classes & Subjects */}
                      <td className="py-3 px-3">
                        <div className="max-w-[200px] truncate">
                          <div className="text-slate-800 font-semibold truncate">
                            {item.subjects.join(', ')}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {item.classes.join(', ')}
                          </div>
                        </div>
                      </td>

                      {/* Expected */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                        {item.expected}
                      </td>

                      {/* Submitted */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                        {item.submitted}
                      </td>

                      {/* On-Time */}
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-emerald-700">
                        {item.onTime}
                      </td>

                      {/* Late */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                        {item.late > 0 ? (
                          <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                            {item.late}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>

                      {/* Missing */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-700">
                        {item.missing > 0 ? (
                          <span className="bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200 font-extrabold">
                            {item.missing}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>

                      {/* Avg Delay */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                        {item.late > 0 ? `${item.avgDaysLate}d late` : '—'}
                      </td>

                      {/* Compliance % Badge & Bar */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          {getComplianceBadge(item.compliancePercentage)}
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.compliancePercentage >= 90
                                  ? 'bg-emerald-500'
                                  : item.compliancePercentage >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, item.compliancePercentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {item.missing > 0 && (
                            <button
                              onClick={() => handleSendReminder(item.teacherName)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition-all cursor-pointer"
                              title="Send Reminder Notice"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedDrilldownTeacher(item)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <span>Inspect Logs</span>
                            <ArrowRight className="w-3 h-3" />
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
      )}

      {/* TAB 2: WEEKLY DEADLINE MATRIX */}
      {activeTab === 'weekly_matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">
              Term Week-by-Week Compliance Matrix
            </h4>
            <p className="text-[11px] text-slate-500">
              Scheduled milestone submission status for Weeks 1 to 10 across all active teaching staff
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3">Teacher</th>
                  {Array.from({ length: 10 }, (_, i) => (
                    <th key={i} className="py-3 px-2 text-center">
                      Wk {i + 1}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTeacherList.map(teacher => (
                  <tr key={teacher.teacherId} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-slate-800 truncate max-w-[150px]">
                      {teacher.teacherName}
                    </td>
                    {Array.from({ length: 10 }, (_, wIdx) => {
                      const week = wIdx + 1;
                      const weekLogs = teacher.submissionLogs.filter(l => l.week === week);
                      const hasMissing = weekLogs.some(l => l.status === 'Missing');
                      const hasLate = weekLogs.some(l => l.status === 'Late');
                      const hasOnTime = weekLogs.some(l => l.status === 'On Time');

                      let bgBadge = 'bg-slate-100 text-slate-400';
                      let label = '—';

                      if (hasMissing) {
                        bgBadge = 'bg-rose-100 text-rose-800 border border-rose-200';
                        label = 'Missing';
                      } else if (hasLate) {
                        bgBadge = 'bg-amber-100 text-amber-800 border border-amber-200';
                        label = 'Late';
                      } else if (hasOnTime) {
                        bgBadge = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                        label = 'On-Time';
                      }

                      return (
                        <td key={week} className="py-2.5 px-2 text-center">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${bgBadge}`}>
                            {label}
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {teacher.compliancePercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENT & SUBJECT ROLLUP */}
      {activeTab === 'subject_breakdown' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueSubjects.map(sub => {
            const subTeachers = teacherComplianceList.filter(t => t.subjects.includes(sub));
            const expected = subTeachers.reduce((acc, t) => acc + t.expected, 0);
            const onTime = subTeachers.reduce((acc, t) => acc + t.onTime, 0);
            const late = subTeachers.reduce((acc, t) => acc + t.late, 0);
            const missing = subTeachers.reduce((acc, t) => acc + t.missing, 0);
            const rate = expected > 0 ? Math.round((onTime / expected) * 100) : 0;

            return (
              <div key={sub} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-slate-900 truncate max-w-[200px]">{sub}</h5>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {subTeachers.length} Staff
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono text-slate-800">{rate}%</div>
                  <span className="text-[11px] text-slate-500 font-medium">Compliance Rate</span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, rate)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center text-xs">
                  <div>
                    <div className="text-emerald-700 font-bold font-mono">{onTime}</div>
                    <div className="text-[9px] text-slate-400 uppercase">On Time</div>
                  </div>
                  <div>
                    <div className="text-amber-700 font-bold font-mono">{late}</div>
                    <div className="text-[9px] text-slate-400 uppercase">Late</div>
                  </div>
                  <div>
                    <div className="text-rose-700 font-bold font-mono">{missing}</div>
                    <div className="text-[9px] text-slate-400 uppercase">Missing</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DRILL-DOWN SUBMISSION LOG INSPECTION MODAL */}
      {selectedDrilldownTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleUp">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-base">{selectedDrilldownTeacher.teacherName}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase">
                    {selectedDrilldownTeacher.branch}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Detailed Submission Log &amp; Deadline Compliance Audit ({filterTerm} • {filterSession})
                </p>
              </div>

              <button
                onClick={() => setSelectedDrilldownTeacher(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics Bar inside Modal */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[9px] uppercase font-bold">Expected</div>
                <div className="font-mono font-bold text-slate-800 text-base">{selectedDrilldownTeacher.expected}</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="text-emerald-600 text-[9px] uppercase font-bold">On Time</div>
                <div className="font-mono font-bold text-emerald-700 text-base">{selectedDrilldownTeacher.onTime}</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="text-amber-600 text-[9px] uppercase font-bold">Late</div>
                <div className="font-mono font-bold text-amber-700 text-base">{selectedDrilldownTeacher.late}</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="text-rose-600 text-[9px] uppercase font-bold">Missing</div>
                <div className="font-mono font-bold text-rose-700 text-base">{selectedDrilldownTeacher.missing}</div>
              </div>
              <div className="bg-indigo-900 text-white p-2 rounded-xl">
                <div className="text-indigo-200 text-[9px] uppercase font-bold">Rate</div>
                <div className="font-mono font-extrabold text-base">{selectedDrilldownTeacher.compliancePercentage}%</div>
              </div>
            </div>

            {/* Submissions List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                Assigned Timeline Submissions ({selectedDrilldownTeacher.submissionLogs.length} Scheduled Slots)
              </h5>

              <div className="space-y-2">
                {selectedDrilldownTeacher.submissionLogs.map((log, idx) => (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      log.status === 'On Time'
                        ? 'bg-emerald-50/50 border-emerald-200/80'
                        : log.status === 'Late'
                        ? 'bg-amber-50/50 border-amber-200/80'
                        : 'bg-rose-50/50 border-rose-200/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900">
                          Week {log.week} • Slot {((idx % 2) + 1)}
                        </span>
                        <span className="text-slate-500 font-medium">({log.subject} — {log.classId})</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">{log.topic}</p>
                      <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                        <span>📅 Due: {log.dueDate} @ {log.dueTime}</span>
                        {log.submissionDate && (
                          <span>✍️ Logged: {log.submissionDate} @ {log.submissionTime}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        log.status === 'On Time'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'Late'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status === 'On Time' ? 'Submitted On Time' : log.status === 'Late' ? `Late (${log.daysLate}d)` : 'Missing'}
                      </span>

                      {log.recordId && onSelectTeachingRecord && (
                        <button
                          onClick={() => {
                            setSelectedDrilldownTeacher(null);
                            onSelectTeachingRecord(log.recordId!);
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                        >
                          View Record
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Audited against Friday 17:00 standard deadline
              </span>
              <button
                onClick={() => setSelectedDrilldownTeacher(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
