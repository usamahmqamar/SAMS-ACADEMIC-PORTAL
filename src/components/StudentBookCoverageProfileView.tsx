import React, { useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  FileText,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  HelpCircle
} from 'lucide-react';
import { TeachingRecord, FlaggedStudentRecord } from '../data/teachingRecordData';

interface StudentBookCoverageProfileViewProps {
  student: any;
  teachingRecords: TeachingRecord[];
  onSelectTeachingRecord?: (record: TeachingRecord) => void;
}

export const StudentBookCoverageProfileView: React.FC<StudentBookCoverageProfileViewProps> = ({
  student,
  teachingRecords,
  onSelectTeachingRecord
}) => {
  // Normalize student class matching
  const studentClassRecords = useMemo(() => {
    if (!student) return [];
    const studentGrade = (student.grade || '').toLowerCase();
    const studentSection = (student.classSection || '').toLowerCase();
    const studentBranch = student.branch || 'GN';

    return teachingRecords.filter(record => {
      // Check branch
      if (record.branch && record.branch !== studentBranch && 
          !(studentBranch === 'GN' && (record.branch === 'Gawun Nama' || record.branch === 'GN')) &&
          !(studentBranch === 'RS' && (record.branch === 'Runjin Sambo' || record.branch === 'RS'))) {
        return false;
      }

      const recClass = record.classId.toLowerCase();
      // Match by grade or full class name
      if (studentGrade && recClass.includes(studentGrade)) return true;
      if (student.classId && recClass.includes(student.classId.toLowerCase())) return true;
      return false;
    });
  }, [student, teachingRecords]);

  // Aggregate statistics for this student
  const studentMetrics = useMemo(() => {
    const totalLessons = studentClassRecords.length;
    let completedCount = 0;
    let incompleteCount = 0;
    let absentCount = 0;
    let needsSupportCount = 0;

    const flaggedList: { record: TeachingRecord; flag: FlaggedStudentRecord }[] = [];

    studentClassRecords.forEach(record => {
      const match = record.flaggedStudents?.find(
        f => f.studentId === student.id || 
             (f.studentName && f.studentName.toLowerCase() === student.name?.toLowerCase()) ||
             (f.admissionNumber && student.enrollmentNo && f.admissionNumber === student.enrollmentNo)
      );

      if (match) {
        flaggedList.push({ record, flag: match });
        if (match.category === 'Needs Support') {
          needsSupportCount++;
          completedCount++; // Still attempted/in class
        } else if (match.category === 'Not Completed') {
          incompleteCount++;
        } else if (match.category === 'Absent') {
          absentCount++;
        }
      } else {
        // Not flagged negatively means completed on schedule
        completedCount++;
      }
    });

    const completionRate = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 100;

    return {
      totalLessons,
      completedCount,
      incompleteCount,
      absentCount,
      needsSupportCount,
      completionRate,
      flaggedList
    };
  }, [studentClassRecords, student]);

  return (
    <div className="space-y-6 text-xs text-slate-800 animate-fade-in">
      {/* PEDAGOGICAL POLICY NOTICE BANNER */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start space-x-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold text-sm flex items-center gap-2">
            <span>Pedagogical Learning &amp; Book Coverage Progress Tracker</span>
            <span className="text-[10px] uppercase font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
              Formative Indicator
            </span>
          </div>
          <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
            This module connects this student's individual profile directly with the teacher's daily <strong>Teaching Records</strong>. 
            Book and classwork coverage measures day-to-day curriculum interaction, exercise completion, and remedial support needs. 
            <strong className="block mt-0.5 text-amber-950">Notice: This data serves strictly as a teaching and learning progress indicator and is NEVER treated as examination or terminal assessment marks.</strong>
          </p>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Recorded Lessons
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {studentMetrics.totalLessons}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">In {student.grade || 'assigned class'}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center justify-between">
            <span>Work Completion</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {studentMetrics.completionRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {studentMetrics.completedCount} of {studentMetrics.totalLessons} completed
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center justify-between">
            <span>Needs Support Logs</span>
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {studentMetrics.needsSupportCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Remedial sessions flagged</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center justify-between">
            <span>Incomplete / Missed</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
            {studentMetrics.incompleteCount + studentMetrics.absentCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {studentMetrics.incompleteCount} incomplete • {studentMetrics.absentCount} absent
          </div>
        </div>
      </div>

      {/* FLAGGED INTERVENTIONS LIST (IF ANY) */}
      {studentMetrics.flaggedList.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-indigo-600" />
            <span>Teacher Identified Pedagogical Flags &amp; Remedial Interventions</span>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
              {studentMetrics.flaggedList.length} Active Notes
            </span>
          </h4>

          <div className="space-y-2.5">
            {studentMetrics.flaggedList.map(({ record, flag }) => (
              <div
                key={record.id + flag.category}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{record.subject}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">Week {record.week}: {record.topic}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      flag.category === 'Needs Support'
                        ? 'bg-amber-100 text-amber-800'
                        : flag.category === 'Not Completed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {flag.category}
                    </span>
                  </div>

                  {flag.notes && (
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                      <strong>Teacher Observation:</strong> {flag.notes}
                    </p>
                  )}

                  {flag.interventionPlan && (
                    <p className="text-[11px] text-indigo-900 bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                      <strong>Support Action:</strong> {flag.interventionPlan}
                    </p>
                  )}
                </div>

                {onSelectTeachingRecord && (
                  <button
                    onClick={() => onSelectTeachingRecord(record)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Lesson Docket</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHRONOLOGICAL LESSON COVERAGE HISTORY */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900">
              Classwork &amp; Exercise Book Delivery History
            </h4>
            <p className="text-[11px] text-slate-500">
              Daily teaching logs and student work coverage recorded for {student.grade || 'this grade'}.
            </p>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Class Coverage: <strong className="text-slate-800">{studentClassRecords.length} Lessons</strong>
          </div>
        </div>

        {studentClassRecords.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border border-dashed rounded-xl space-y-1">
            <BookOpen className="w-6 h-6 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No teaching records logged for {student.grade || 'this class'} yet.</p>
            <p className="text-[10px]">When teachers record daily lessons under Academics, book coverage will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {studentClassRecords.map(record => {
              const studentFlag = record.flaggedStudents?.find(
                f => f.studentId === student.id || 
                     (f.studentName && f.studentName.toLowerCase() === student.name?.toLowerCase()) ||
                     (f.admissionNumber && student.enrollmentNo && f.admissionNumber === student.enrollmentNo)
              );

              return (
                <div
                  key={record.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold font-mono text-xs flex items-center justify-center">
                        W{record.week}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span>{record.topic}</span>
                          <span className="text-indigo-600 font-semibold">• {record.subject}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {record.date} • Instructor: {record.teacherName} • Class: {record.classId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Student individual status badge */}
                      {studentFlag ? (
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          studentFlag.category === 'Needs Support'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : studentFlag.category === 'Not Completed'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {studentFlag.category === 'Needs Support' && '💡 Needs Remedial Support'}
                          {studentFlag.category === 'Not Completed' && '❌ Work Incomplete'}
                          {studentFlag.category === 'Absent' && '🚫 Absent From Lesson'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Work Completed</span>
                        </span>
                      )}

                      {onSelectTeachingRecord && (
                        <button
                          onClick={() => onSelectTeachingRecord(record)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          Docket
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Coverage Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Classwork Assigned:</span>
                      <p className="text-slate-700 line-clamp-1">{record.classwork || 'Standard classwork exercises'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Pages Covered in Book:</span>
                      <p className="text-slate-700 font-semibold">{record.pagesCovered || 'Exercise book notes'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Class Work Coverage:</span>
                      <p className="font-bold text-slate-800">
                        {record.workCoveragePercentage || 90}% ({record.completedWorkCount || 27}/{record.totalStudentsInClass || 30} students)
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
