import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Award, 
  Check, 
  CheckCircle, 
  RotateCcw, 
  Info, 
  Users, 
  AlertTriangle,
  Save,
  ChevronRight
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  level: 'nursery' | 'primary' | 'secondary' | 'islamia';
  grade: string;
  classSection: string;
  grades: Record<string, number>;
  milestones: Record<string, string>;
  gradesStatus?: Record<string, 'Draft' | 'Submitted' | 'Approved'>;
  milestonesStatus?: Record<string, 'Draft' | 'Submitted' | 'Approved'>;
  resultsApproved?: boolean;
  terminalRank?: number;
  terminalPercentile?: number;
  terminalRankCalculatedAt?: string;
  parentEmail: string;
  islamiaClassId?: string;
  branch?: string;
}

interface ClassRecord {
  id: string;
  name: string;
  level: 'nursery' | 'primary' | 'secondary' | 'islamia';
  branch: string;
  subjects: string[];
  isScoreMatrixLocked?: boolean;
}

interface TerminalGradesControlProps {
  currentSimulatedRole: string;
  classes: ClassRecord[];
  students: Student[];
  selectedBranch: string;
  scoreEntryClass: string;
  setScoreEntryClass: (val: string) => void;
  saveStudentChanges: (student: any) => Promise<void>;
  handleUpdateClassDetails: (classId: string, updatedFields: Partial<ClassRecord>) => Promise<void>;
  calculateGPA: (studentGrades: Record<string, number>) => { avg: number; letter: string };
  getSecularGrades: (studentGrades: Record<string, number>) => Record<string, number>;
}

export default function TerminalGradesControl({
  currentSimulatedRole,
  classes,
  students,
  selectedBranch,
  scoreEntryClass,
  setScoreEntryClass,
  saveStudentChanges,
  handleUpdateClassDetails,
  calculateGPA,
  getSecularGrades
}: TerminalGradesControlProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [previewList, setPreviewList] = useState<Array<{
    id: string;
    name: string;
    avg: number;
    rank: number;
    percentile: number;
    student: Student;
  }>>([]);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<'lock' | 'rank' | 'release' | null>(null);

  // Check if simulated role is an administrator
  const isUserAdmin = 
    currentSimulatedRole === 'Super Administrator' || 
    currentSimulatedRole === 'Super Admin' || 
    currentSimulatedRole === 'Proprietor' || 
    currentSimulatedRole === 'Branch Administrator' || 
    currentSimulatedRole === 'Branch Admin';

  if (!isUserAdmin) {
    return null;
  }

  // Find class from name or ID
  const activeClass = classes.find(c => c.name === scoreEntryClass || c.id === selectedClassId);

  // Filter students belonging to this class
  const classStudents = activeClass
    ? students.filter(s => 
        (activeClass.level === 'islamia' ? s.islamiaClassId === activeClass.id : s.grade === activeClass.name) &&
        (s.branch === selectedBranch || !s.branch)
      )
    : [];

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classes.find(c => c.id === classId);
    if (cls) {
      setScoreEntryClass(cls.name);
    } else {
      setScoreEntryClass('');
    }
    setPreviewList([]);
  };

  // Helper to determine performance value (average or mastered milestones)
  const getPerformanceValue = (s: Student) => {
    if (s.level === 'nursery') {
      return Object.values(s.milestones || {}).filter(v => v === 'Mastered').length;
    } else {
      const secular = getSecularGrades(s.grades || {});
      return calculateGPA(secular).avg;
    }
  };

  // Run auto-assign and percentile ranking algorithm
  const handleCalculateRankings = () => {
    if (!activeClass || classStudents.length === 0) return;

    const computed = classStudents.map(s => {
      const val = getPerformanceValue(s);
      return {
        id: s.id,
        name: s.name,
        avg: val,
        student: s
      };
    });

    // Sort descending of score
    computed.sort((a, b) => b.avg - a.avg);

    // Standard competition ranking (handles ties gracefully: e.g. 1, 2, 2, 4)
    const N = computed.length;
    let rank = 1;
    let prevVal = -1;

    const listWithRank = computed.map((item, idx) => {
      if (idx > 0 && item.avg !== prevVal) {
        rank = idx + 1;
      }
      prevVal = item.avg;

      // Percentile formula: ((N - rank) / (N - 1 || 1)) * 100
      let percentile = 100;
      if (N > 1) {
        // Count students with score strictly below current student
        const strictlyLower = computed.filter(item2 => item2.avg < item.avg).length;
        percentile = Math.round((strictlyLower / (N - 1)) * 100);
      }

      return {
        ...item,
        rank,
        percentile
      };
    });

    setPreviewList(listWithRank);
  };

  // Commit and write rankings & percentiles to database
  const handleCommitRankings = async () => {
    if (previewList.length === 0) return;

    const confirmCommit = window.confirm(`Commit computed terminal rankings & percentiles for ${previewList.length} students in ${activeClass?.name}? This will persist results permanently to their academic records.`);
    if (!confirmCommit) return;

    setIsUpdating(true);
    try {
      for (const item of previewList) {
        const updatedStudent = {
          ...item.student,
          terminalRank: item.rank,
          terminalPercentile: item.percentile,
          terminalRankCalculatedAt: new Date().toISOString()
        };
        await saveStudentChanges(updatedStudent);
      }
      alert(`✅ Successfully saved & locked terminal rankings and percentiles for ${previewList.length} students in Class ${activeClass?.name}!`);
      setPreviewList([]);
    } catch (err) {
      console.error(err);
      alert("Error writing ranking updates to SAMS database.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle secure matrix locking
  const handleToggleMatrixLock = async () => {
    if (!activeClass) return;
    const nextLockState = !activeClass.isScoreMatrixLocked;
    const confirmLock = window.confirm(
      nextLockState 
        ? `⚠️ SECURE LOCK SCORE MATRIX?\n\nThis will restrict all teacher and non-admin entries for Class "${activeClass.name}". All scores and milestone updates will be locked immediately.`
        : `🔓 UNLOCK SCORE MATRIX?\n\nThis will restore write-privileges for teachers and assessors to modify continuous assessment ratings for Class "${activeClass.name}".`
    );
    if (!confirmLock) return;

    setIsUpdating(true);
    try {
      await handleUpdateClassDetails(activeClass.id, {
        ...activeClass,
        isScoreMatrixLocked: nextLockState
      });
      alert(`✅ Score matrix entry for "${activeClass.name}" has been securely ${nextLockState ? 'LOCKED' : 'UNLOCKED'}!`);
    } catch (err) {
      console.error(err);
      alert("Error modifying class lock configuration.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Bulk publish report cards to parents
  const handleBulkReleaseToParents = async (releaseState: boolean) => {
    if (!activeClass || classStudents.length === 0) return;
    const confirmAction = window.confirm(
      releaseState 
        ? `🌍 RELEASE REPORT CARDS TO PARENT PORTAL?\n\nThis certifies and releases computed final results and terminal evaluations of Class "${activeClass.name}" to registered parent accounts instantly.`
        : `🛑 RESTRICT PARENT ACCESS (AUDIT MODE)?\n\nThis will withdraw parent-visible report cards for Class "${activeClass.name}" and display a "Results Under moderation" audit warning instead.`
    );
    if (!confirmAction) return;

    setIsUpdating(true);
    try {
      for (const std of classStudents) {
        const updatedMilestonesStatus: Record<string, 'Approved'> = {};
        const updatedGradesStatus: Record<string, 'Approved'> = {};
        
        if (releaseState) {
          activeClass.subjects?.forEach(sub => {
            updatedMilestonesStatus[sub] = 'Approved';
            updatedGradesStatus[sub] = 'Approved';
          });
        }

        const updated = {
          ...std,
          resultsApproved: releaseState,
          ...(releaseState ? {
            milestonesStatus: {
              ...(std.milestonesStatus || {}),
              ...updatedMilestonesStatus
            },
            gradesStatus: {
              ...(std.gradesStatus || {}),
              ...updatedGradesStatus
            }
          } : {})
        };
        await saveStudentChanges(updated);
      }
      alert(`✅ Successfully ${releaseState ? 'released' : 'restricted'} report cards to parent accounts for Class "${activeClass.name}"!`);
    } catch (err) {
      console.error(err);
      alert("Error changing parent release configuration.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Statistics for active class
  const releasedCount = classStudents.filter(s => s.resultsApproved === true).length;
  const rankedCount = classStudents.filter(s => s.terminalRank !== undefined).length;
  const isMatrixLocked = activeClass?.isScoreMatrixLocked || false;

  return (
    <div id="secure-terminal-grades-controller" className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-xl space-y-6">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4.5 h-4.5" />
            <span>🔐 Secure SAMS Administrative Terminal</span>
          </div>
          <h3 className="text-base font-extrabold tracking-tight">Terminal Ranking, Percentiles &amp; Lock Mechanism</h3>
          <p className="text-[11px] text-slate-400 max-w-xl">
            Authorize exam results, lock marks entry against teachers, auto-assign percentiles, and release authenticated records to parents.
          </p>
        </div>
        
        {/* Class Selection inside Admin Panel */}
        <div className="space-y-1 w-full sm:w-56">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Selected Class</label>
          <select
            value={activeClass?.id || ''}
            onChange={(e) => handleClassSelect(e.target.value)}
            className="w-full text-slate-200 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs cursor-pointer"
          >
            <option value="">-- Select Class --</option>
            {classes.filter(c => !c.branch || c.branch === selectedBranch).map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.level.toUpperCase()})</option>
            ))}
          </select>
        </div>
      </div>

      {!activeClass ? (
        <div className="p-6 bg-slate-950/45 border border-slate-800/50 rounded-2xl text-center space-y-2">
          <Info className="w-8 h-8 text-indigo-400 mx-auto opacity-75" />
          <h4 className="font-bold text-slate-300 text-xs">Select Class to Initialize Admin Gateway</h4>
          <p className="text-[10.5px] text-slate-500 max-w-sm mx-auto leading-relaxed">
            Please choose a class group from the administrative selector above or the primary exam desk filter to mount lock states and calculate student percentiles.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Class Info Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl">
              <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">Total Students</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-base font-bold font-mono">{classStudents.length}</span>
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl">
              <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">Matrix Lock State</span>
              <div className="flex items-center gap-1.5 mt-1">
                {isMatrixLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs font-bold text-rose-450 uppercase tracking-wide">Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-450 uppercase tracking-wide">Open (Editable)</span>
                  </>
                )}
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl">
              <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">Ranked &amp; Percentiles</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-base font-bold font-mono text-amber-400">{rankedCount} / {classStudents.length}</span>
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl">
              <span className="text-[9.5px] text-slate-500 uppercase font-semibold block">Released to Parents</span>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-base font-bold font-mono text-indigo-300">{releasedCount} / {classStudents.length}</span>
              </div>
            </div>
          </div>

          {/* Operation Tabs/Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* OPERATION 1: MATRIX LOCK */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>1. Lock Score Matrices</span>
                </div>
                <p className="text-[11px] text-slate-450 leading-relaxed">
                  Freeze grading sheets. Locking blocks teachers from making changes to scores, while unlocking restores write access.
                </p>
                <div className="pt-1.5">
                  <span className={`inline-block text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                    isMatrixLocked ? 'bg-rose-950 border border-rose-800 text-rose-400' : 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                  }`}>
                    {isMatrixLocked ? '🔒 Secure Lock Active' : '✏️ Draft Edit Allowed'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isUpdating}
                onClick={handleToggleMatrixLock}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isMatrixLocked 
                    ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700' 
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                } disabled:opacity-45`}
              >
                {isMatrixLocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Authorize Unlock Matrix</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Apply Secure Matrix Lock</span>
                  </>
                )}
              </button>
            </div>

            {/* OPERATION 2: AUTO-ASSIGN PERCENTILES */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300">
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>2. Terminal Rank &amp; Percentile</span>
                </div>
                <p className="text-[11px] text-slate-450 leading-relaxed">
                  Auto-calculate class-wide standing. Analyzes cumulative GPA performance and maps exact ranks and mathematical percentiles.
                </p>
                <div className="pt-1.5 text-[10px] text-slate-400 font-mono">
                  {rankedCount > 0 ? (
                    <span className="text-emerald-400">✓ Ranks compiled successfully</span>
                  ) : (
                    <span>⚠ Needs compilation for term</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={isUpdating || classStudents.length === 0}
                onClick={handleCalculateRankings}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-45"
              >
                <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Calculate &amp; Preview standings</span>
              </button>
            </div>

            {/* OPERATION 3: PARENT RELEASE GATEWAY */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>3. Parent Release Gateway</span>
                </div>
                <p className="text-[11px] text-slate-450 leading-relaxed">
                  Approve and release reports. Certified results publish instantly to families; unreleased status displays moderation message.
                </p>
                <div className="pt-1.5">
                  <span className={`inline-block text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                    releasedCount === classStudents.length && classStudents.length > 0 
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' 
                      : 'bg-amber-950 border border-amber-800 text-amber-400'
                  }`}>
                    {releasedCount === classStudents.length && classStudents.length > 0 ? '✓ Released to Parents' : '🔒 Restructured / Under Moderation'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isUpdating || classStudents.length === 0}
                  onClick={() => handleBulkReleaseToParents(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-2 rounded-xl text-[10px] font-bold shadow flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-45"
                >
                  <Check className="w-3 h-3" />
                  <span>Release All</span>
                </button>
                <button
                  type="button"
                  disabled={isUpdating || classStudents.length === 0}
                  onClick={() => handleBulkReleaseToParents(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-500 border border-slate-700 py-2 px-2 rounded-xl text-[10px] font-bold shadow flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-45"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Audit Mode</span>
                </button>
              </div>
            </div>

          </div>

          {/* Ranking & Percentile Preview Section */}
          {previewList.length > 0 && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Terminal Ranking &amp; Percentile Compiled standings ({activeClass.name})</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Please review the calculated rankings before committing and writing to database records.</p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setPreviewList([])}
                  className="text-slate-400 hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-850">
                <table className="w-full text-left border-collapse table-fixed text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-850 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="p-2.5 w-16 text-center">Rank</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5 text-center w-24">Performance Value</th>
                      <th className="p-2.5 text-center w-28">Academic Percentile</th>
                      <th className="p-2.5 text-center w-24">Grade Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {previewList.map((item, idx) => {
                      const letter = activeClass.level === 'nursery' ? 'Milestone' : calculateGPA({ temp: item.avg }).letter;
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-2.5 text-center font-bold">
                            <span className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] ${
                              item.rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-550/35' :
                              item.rank === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-500/35' :
                              item.rank === 3 ? 'bg-amber-700/20 text-amber-600 border border-amber-750/35' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              #{item.rank}
                            </span>
                          </td>
                          <td className="p-2.5 font-semibold text-white">
                            {item.name}
                          </td>
                          <td className="p-2.5 text-center font-bold font-mono">
                            {item.avg}{activeClass.level === 'nursery' ? ' Mastered' : '%'}
                          </td>
                          <td className="p-2.5 text-center font-extrabold font-mono text-indigo-400">
                            {item.percentile}th <span className="text-[9px] font-normal text-slate-500 font-sans">Percentile</span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] ${
                              activeClass.level === 'nursery' 
                                ? 'bg-slate-800 text-slate-300' 
                                : item.avg >= 90 ? 'bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono' :
                                  item.avg >= 80 ? 'bg-teal-950 border border-teal-800 text-teal-400 font-mono' :
                                  item.avg >= 70 ? 'bg-amber-950 border border-amber-800 text-amber-400 font-mono' : 'bg-rose-950 border border-rose-800 text-rose-400 font-mono'
                            }`}>
                              {activeClass.level === 'nursery' ? `${item.avg} Mastered` : `Grade ${letter}`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Commit Action Row */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 border-slate-850 border rounded-xl p-3.5 gap-4">
                <p className="text-[10.5px] text-slate-450 leading-relaxed max-w-md">
                  <strong>Database Integrity Rule:</strong> Committing standings write-locks rankings and percentiles into student profiles. Ranks are then automatically rendered on parental report card monitors.
                </p>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleCommitRankings}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-45"
                >
                  <Save className="w-4 h-4" />
                  <span>Commit &amp; Lock Standings</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
