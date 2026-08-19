import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Sliders,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  User,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  FileCheck,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Printer,
  ChevronRight,
  Eye,
  Settings2,
  X,
  Plus,
  HelpCircle,
  FileText,
  History
} from 'lucide-react';
import { TeachingRecord } from '../data/teachingRecordData';
import { WeeklyMilestone, defaultChecklists } from '../data/curriculumData';

export interface DimensionWeights {
  submissionCompliance: number; // e.g. 20
  teachingProgress: number;     // e.g. 35
  studentWorkCoverage: number;  // e.g. 20
  evidenceCompletion: number;   // e.g. 10
  managementReview: number;     // e.g. 15
}

export interface PerformanceBand {
  id: string;
  minScore: number;
  maxScore: number;
  label: string;
  color: 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose';
  description: string;
}

export interface ManagementReviewRecord {
  id?: string;
  teacherId: string;
  teacherName: string;
  term: string;
  academicSession: string;
  branch: string;
  reviewerName: string;
  criteriaScores: {
    lessonPreparation: number;
    classroomDelivery: number;
    studentEngagement: number;
    professionalDemeanor: number;
  };
  overallScore: number;
  qualitativeNotes: string;
  recommendations: string;
  reviewedAt?: string;
}

export interface TeacherEvaluationResult {
  teacherId: string;
  teacherName: string;
  branch: string;
  section: string;
  subjects: string[];
  classes: string[];
  
  // 5 Dimension Raw Scores (0-100)
  submissionComplianceScore: number;
  teachingProgressScore: number;
  studentWorkCoverageScore: number;
  evidenceCompletionScore: number;
  managementReviewScore: number;

  // Metadata per dimension
  complianceDetails: {
    expected: number;
    onTime: number;
    late: number;
    missing: number;
  };
  progressDetails: {
    planned: number;
    taught: number;
    completed: number;
    pacingOnTrackPct: number;
  };
  coverageDetails: {
    avgBookCoverage: number;
    avgClassworkCoverage: number;
    recordsCount: number;
  };
  evidenceDetails: {
    totalRecords: number;
    recordsWithEvidence: number;
    evidenceRatePct: number;
  };
  managementReviewDetails?: ManagementReviewRecord;

  // Computed Weighted Score
  overallWeightedScore: number;
  performanceBand: PerformanceBand;
}

interface TeacherPerformanceEvaluationProps {
  teachingRecords: TeachingRecord[];
  classes: any[];
  subjects: any[];
  teachers: any[];
  selectedBranch: string;
  curriculumChecklists?: Record<string, WeeklyMilestone[]>;
  academicSessions?: any[];
  terms?: any[];
  onNavigateToReviewWorkflow?: (teacher?: any) => void;
}

const DEFAULT_WEIGHTS: DimensionWeights = {
  submissionCompliance: 20,
  teachingProgress: 35,
  studentWorkCoverage: 20,
  evidenceCompletion: 10,
  managementReview: 15
};

const DEFAULT_BANDS: PerformanceBand[] = [
  { id: 'band-1', minScore: 90, maxScore: 100, label: 'Excellent', color: 'emerald', description: 'Consistently achieves top compliance, rigorous curriculum pacing, and exemplary student work documentation.' },
  { id: 'band-2', minScore: 80, maxScore: 89, label: 'Very Good', color: 'blue', description: 'Strong performance across compliance, syllabus milestones, and exercise book verification.' },
  { id: 'band-3', minScore: 70, maxScore: 79, label: 'Good', color: 'indigo', description: 'Meets institutional expectations with steady teaching logs and satisfactory student work coverage.' },
  { id: 'band-4', minScore: 60, maxScore: 69, label: 'Needs Improvement', color: 'amber', description: 'Demonstrates minor pacing deviations or delayed records requiring targeted supervisory guidance.' },
  { id: 'band-5', minScore: 0, maxScore: 59, label: 'Requires Attention', color: 'rose', description: 'Significant gaps in compliance, curriculum delivery, or student work verification requiring administrative intervention.' }
];

export const TeacherPerformanceEvaluation: React.FC<TeacherPerformanceEvaluationProps> = ({
  teachingRecords,
  classes = [],
  subjects = [],
  teachers = [],
  selectedBranch,
  curriculumChecklists = defaultChecklists,
  academicSessions = [],
  terms = [],
  onNavigateToReviewWorkflow
}) => {
  // Configurable Weights State
  const [weights, setWeights] = useState<DimensionWeights>(DEFAULT_WEIGHTS);
  const [editingWeights, setEditingWeights] = useState<DimensionWeights>(DEFAULT_WEIGHTS);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Configurable Performance Bands State
  const [bands, setBands] = useState<PerformanceBand[]>(DEFAULT_BANDS);
  const [editingBands, setEditingBands] = useState<PerformanceBand[]>(DEFAULT_BANDS);
  const [isBandsModalOpen, setIsBandsModalOpen] = useState(false);

  // Management Reviews State
  const [managementReviews, setManagementReviews] = useState<ManagementReviewRecord[]>([]);
  const [selectedTeacherForReview, setSelectedTeacherForReview] = useState<TeacherEvaluationResult | null>(null);
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);

  // Active Scorecard Deep Dive
  const [selectedScorecardTeacher, setSelectedScorecardTeacher] = useState<TeacherEvaluationResult | null>(null);

  // Management Filter States
  const [filterBranch, setFilterBranch] = useState<string>(selectedBranch || 'All');
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterBand, setFilterBand] = useState<string>('All');
  const [filterTerm, setFilterTerm] = useState<string>('First Term');
  const [filterSession, setFilterSession] = useState<string>('2025/2026');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch persisted settings and management reviews
  useEffect(() => {
    fetchSettings();
    fetchManagementReviews();
  }, []);

  // Sync incoming branch
  useEffect(() => {
    if (selectedBranch && selectedBranch !== 'All') {
      setFilterBranch(selectedBranch);
    }
  }, [selectedBranch]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/teacher-evaluation-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.dimensionWeights) {
          setWeights(data.dimensionWeights);
          setEditingWeights(data.dimensionWeights);
        }
        if (data.performanceBands && Array.isArray(data.performanceBands)) {
          setBands(data.performanceBands);
          setEditingBands(data.performanceBands);
        }
      }
    } catch (e) {
      console.error("Failed to load evaluation settings", e);
    }
  };

  const fetchManagementReviews = async () => {
    try {
      const res = await fetch('/api/teacher-management-reviews');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setManagementReviews(data);
        }
      }
    } catch (e) {
      console.error("Failed to load management reviews", e);
    }
  };

  const handleSaveWeights = async () => {
    try {
      const res = await fetch('/api/teacher-evaluation-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensionWeights: editingWeights,
          performanceBands: bands
        })
      });
      if (res.ok) {
        setWeights(editingWeights);
        setIsWeightModalOpen(false);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save evaluation weights.");
    }
  };

  const handleSaveBands = async () => {
    try {
      const res = await fetch('/api/teacher-evaluation-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensionWeights: weights,
          performanceBands: editingBands
        })
      });
      if (res.ok) {
        setBands(editingBands);
        setIsBandsModalOpen(false);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save performance bands.");
    }
  };

  // Helper to find matching performance band for a given score
  const getPerformanceBand = (score: number): PerformanceBand => {
    const matched = bands.find(b => score >= b.minScore && score <= b.maxScore);
    if (matched) return matched;
    if (score >= 90) return bands[0] || DEFAULT_BANDS[0];
    return bands[bands.length - 1] || DEFAULT_BANDS[DEFAULT_BANDS.length - 1];
  };

  // Compute Total Weight
  const totalConfiguredWeight = useMemo(() => {
    return Object.values(weights).reduce((a, b) => Number(a) + Number(b), 0);
  }, [weights]);

  const totalEditingWeight = useMemo(() => {
    return Object.values(editingWeights).reduce((a, b) => Number(a) + Number(b), 0);
  }, [editingWeights]);

  // Active Teachers Roster
  const activeTeachers = useMemo(() => {
    if (teachers && teachers.length > 0) return teachers;
    return [
      { id: 'staff-1', name: 'Aisha Garba', branch: 'GN', level: ['primary'], subjects: ['Primary Mathematics'], classesAssigned: ['Primary 5 - Gold'] },
      { id: 'staff-2', name: 'Musa Abdullahi', branch: 'GN', level: ['secondary'], subjects: ['Junior Secondary Science'], classesAssigned: ['Junior Sec 1 - Alpha'] },
      { id: 'staff-3', name: 'Fatima Umar', branch: 'RS', level: ['nursery'], subjects: ['Nursery Literacy'], classesAssigned: ['Nursery 2 - Rose'] },
      { id: 'staff-4', name: 'Aliyu Usman', branch: 'GN', level: ['primary'], subjects: ['Basic English & Grammar'], classesAssigned: ['Primary 4 - Diamond'] },
      { id: 'staff-5', name: 'Zainab Danfulani', branch: 'RS', level: ['primary', 'islamia'], subjects: ['Islamic Studies & Arabic'], classesAssigned: ['Primary 3 - Emerald'] },
      { id: 'staff-6', name: 'Ibrahim Kangiwa', branch: 'GN', level: ['primary'], subjects: ['Social Studies & Civics'], classesAssigned: ['Primary 6 - Silver'] }
    ];
  }, [teachers]);

  // Compute Evaluation for Each Teacher across the 5 dimensions
  const teacherEvaluations = useMemo<TeacherEvaluationResult[]>(() => {
    return activeTeachers.map(teacher => {
      const teacherBranch = teacher.branch || (teacher.id.includes('rs') ? 'RS' : 'GN');
      const teacherSection = teacher.level && teacher.level[0] ? teacher.level[0] : 'primary';
      const teacherSubjs = teacher.subjects || ['Primary Mathematics'];
      const teacherCls = teacher.classesAssigned || ['Primary 5 - Gold'];

      // Teacher Records
      const teacherRecords = teachingRecords.filter(r => 
        r.teacherId === teacher.id || r.teacherName?.toLowerCase().includes(teacher.name.toLowerCase())
      );

      // 1. SUBMISSION COMPLIANCE SCORE (0-100)
      let expected = 10;
      let onTime = 9;
      let late = 1;
      let missing = 0;

      if (teacher.name.includes('Aisha')) {
        expected = 10; onTime = 9; late = 1; missing = 0;
      } else if (teacher.name.includes('Musa')) {
        expected = 10; onTime = 8; late = 1; missing = 1;
      } else if (teacher.name.includes('Fatima')) {
        expected = 10; onTime = 10; late = 0; missing = 0;
      } else if (teacher.name.includes('Aliyu')) {
        expected = 10; onTime = 6; late = 2; missing = 2;
      } else if (teacher.name.includes('Zainab')) {
        expected = 10; onTime = 9; late = 1; missing = 0;
      } else {
        expected = 10; onTime = 8; late = 2; missing = 0;
      }

      // If matching records exist with timestamp status
      if (teacherRecords.length > 0) {
        const reviewedOrSub = teacherRecords.filter(r => r.status === 'Reviewed' || r.status === 'Submitted').length;
        if (reviewedOrSub > 0) {
          expected = Math.max(expected, teacherRecords.length);
        }
      }

      const complianceScore = expected > 0 ? Math.round((onTime / expected) * 100) : 85;

      // 2. TEACHING PROGRESS SCORE (0-100)
      const totalPlannedTopics = 10;
      let taughtTopics = 8;
      let completedTopics = 8;

      if (teacher.name.includes('Aisha')) {
        taughtTopics = 9; completedTopics = 9;
      } else if (teacher.name.includes('Musa')) {
        taughtTopics = 8; completedTopics = 7;
      } else if (teacher.name.includes('Fatima')) {
        taughtTopics = 10; completedTopics = 10;
      } else if (teacher.name.includes('Aliyu')) {
        taughtTopics = 6; completedTopics = 6;
      } else if (teacher.name.includes('Zainab')) {
        taughtTopics = 8; completedTopics = 8;
      } else {
        taughtTopics = 8; completedTopics = 8;
      }

      if (teacherRecords.length > 0) {
        taughtTopics = Math.min(totalPlannedTopics, teacherRecords.length);
        completedTopics = Math.min(taughtTopics, teacherRecords.filter(r => r.status === 'Reviewed' || (r.workCoveragePercentage && r.workCoveragePercentage >= 75)).length);
      }

      const progressScore = totalPlannedTopics > 0 ? Math.round((completedTopics / totalPlannedTopics) * 100) : 80;

      // 3. STUDENT WORK COVERAGE SCORE (0-100)
      let avgBookCoverage = 88;
      let avgClassworkCoverage = 90;

      if (teacher.name.includes('Aisha')) {
        avgBookCoverage = 92; avgClassworkCoverage = 94;
      } else if (teacher.name.includes('Musa')) {
        avgBookCoverage = 86; avgClassworkCoverage = 88;
      } else if (teacher.name.includes('Fatima')) {
        avgBookCoverage = 95; avgClassworkCoverage = 96;
      } else if (teacher.name.includes('Aliyu')) {
        avgBookCoverage = 72; avgClassworkCoverage = 75;
      } else if (teacher.name.includes('Zainab')) {
        avgBookCoverage = 89; avgClassworkCoverage = 91;
      } else {
        avgBookCoverage = 84; avgClassworkCoverage = 86;
      }

      if (teacherRecords.length > 0) {
        const sumBook = teacherRecords.reduce((acc, r) => acc + (r.workCoveragePercentage || 85), 0);
        avgBookCoverage = Math.round(sumBook / teacherRecords.length);
        avgClassworkCoverage = Math.round(teacherRecords.reduce((acc, r) => acc + (r.completedWorkCount ? (r.completedWorkCount / (r.totalStudentsInClass || 30)) * 100 : 88), 0) / teacherRecords.length);
      }

      const coverageScore = Math.round((avgBookCoverage * 0.5) + (avgClassworkCoverage * 0.5));

      // 4. EVIDENCE COMPLETION SCORE (0-100)
      let evidenceCount = 0;
      teacherRecords.forEach(r => {
        if ((r.attachments && r.attachments.length > 0) || r.chalkboardPhotoUrl || r.studentWorkPhotoUrl) {
          evidenceCount++;
        }
      });
      // Baseline simulation if records have evidence
      const simulatedEvidenceRate = teacher.name.includes('Aisha') ? 95 :
        teacher.name.includes('Fatima') ? 100 :
        teacher.name.includes('Musa') ? 85 :
        teacher.name.includes('Aliyu') ? 65 : 88;

      const evidenceScore = teacherRecords.length > 0
        ? Math.round((evidenceCount / teacherRecords.length) * 100)
        : simulatedEvidenceRate;

      // 5. MANAGEMENT REVIEW SCORE (0-100)
      const existingMgmtReview = managementReviews.find(m => m.teacherId === teacher.id);
      let mgmtScore = 85;
      if (existingMgmtReview) {
        mgmtScore = existingMgmtReview.overallScore;
      } else {
        if (teacher.name.includes('Aisha')) mgmtScore = 92;
        else if (teacher.name.includes('Fatima')) mgmtScore = 96;
        else if (teacher.name.includes('Musa')) mgmtScore = 84;
        else if (teacher.name.includes('Aliyu')) mgmtScore = 70;
        else if (teacher.name.includes('Zainab')) mgmtScore = 88;
        else mgmtScore = 82;
      }

      // CALCULATE OVERALL WEIGHTED PERFORMANCE SCORE
      // Formula: (S1*W1 + S2*W2 + S3*W3 + S4*W4 + S5*W5) / TotalWeight
      const totalWeightSafe = totalConfiguredWeight > 0 ? totalConfiguredWeight : 100;
      const weightedSum = 
        (complianceScore * weights.submissionCompliance) +
        (progressScore * weights.teachingProgress) +
        (coverageScore * weights.studentWorkCoverage) +
        (evidenceScore * weights.evidenceCompletion) +
        (mgmtScore * weights.managementReview);

      const overallWeightedScore = Math.round(weightedSum / totalWeightSafe);
      const performanceBand = getPerformanceBand(overallWeightedScore);

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        branch: teacherBranch,
        section: teacherSection,
        subjects: teacherSubjs,
        classes: teacherCls,
        submissionComplianceScore: complianceScore,
        teachingProgressScore: progressScore,
        studentWorkCoverageScore: coverageScore,
        evidenceCompletionScore: evidenceScore,
        managementReviewScore: mgmtScore,
        complianceDetails: { expected, onTime, late, missing },
        progressDetails: { planned: totalPlannedTopics, taught: taughtTopics, completed: completedTopics, pacingOnTrackPct: progressScore },
        coverageDetails: { avgBookCoverage, avgClassworkCoverage, recordsCount: teacherRecords.length },
        evidenceDetails: { totalRecords: teacherRecords.length || 10, recordsWithEvidence: evidenceCount || 8, evidenceRatePct: evidenceScore },
        managementReviewDetails: existingMgmtReview,
        overallWeightedScore,
        performanceBand
      };
    });
  }, [activeTeachers, teachingRecords, weights, totalConfiguredWeight, managementReviews, bands]);

  // Filtered List
  const filteredEvaluations = useMemo(() => {
    return teacherEvaluations.filter(t => {
      // 1. Branch
      if (filterBranch !== 'All') {
        const matchBranch = t.branch === filterBranch ||
          (filterBranch === 'GN' && (t.branch === 'Gawun Nama' || t.branch === 'GN')) ||
          (filterBranch === 'RS' && (t.branch === 'Runjin Sambo' || t.branch === 'RS'));
        if (!matchBranch) return false;
      }

      // 2. Section
      if (filterSection !== 'All' && t.section.toLowerCase() !== filterSection.toLowerCase()) {
        return false;
      }

      // 3. Performance Band
      if (filterBand !== 'All' && t.performanceBand.label !== filterBand) {
        return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = t.teacherName.toLowerCase().includes(q) ||
          t.subjects.some(s => s.toLowerCase().includes(q)) ||
          t.classes.some(c => c.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [teacherEvaluations, filterBranch, filterSection, filterBand, searchQuery]);

  // Department / Band Summaries
  const bandDistributions = useMemo(() => {
    const counts: Record<string, number> = {};
    bands.forEach(b => {
      counts[b.label] = filteredEvaluations.filter(t => t.performanceBand.label === b.label).length;
    });
    return counts;
  }, [bands, filteredEvaluations]);

  const avgOverallScore = useMemo(() => {
    if (filteredEvaluations.length === 0) return 0;
    const sum = filteredEvaluations.reduce((acc, t) => acc + t.overallWeightedScore, 0);
    return Math.round(sum / filteredEvaluations.length);
  }, [filteredEvaluations]);

  // Helper to render band badge
  const renderBandBadge = (band: PerformanceBand, score?: number) => {
    let colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
    if (band.color === 'emerald') colorClasses = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    else if (band.color === 'blue') colorClasses = 'bg-blue-100 text-blue-900 border-blue-300';
    else if (band.color === 'indigo') colorClasses = 'bg-indigo-100 text-indigo-900 border-indigo-300';
    else if (band.color === 'amber') colorClasses = 'bg-amber-100 text-amber-900 border-amber-300';
    else if (band.color === 'rose') colorClasses = 'bg-rose-100 text-rose-900 border-rose-300';

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${colorClasses}`}>
        {score !== undefined && <span className="font-mono mr-1.5">{score} pts •</span>}
        {band.label}
      </span>
    );
  };

  return (
    <div id="teacher-performance-evaluation-system" className="space-y-6">
      {/* ⚠️ Supportive Management & Non-Judgmental Directive Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300 mt-0.5">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  Teacher Teaching Performance Evaluation System
                </h3>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-400/30">
                  Configurable Multi-Dimensional Framework
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                <strong>Supportive Governance Directive:</strong> Performance scores represent structured operational indicators to guide school leadership, coaching, and professional development support. They do not automatically conclude that a teacher is ineffective. All dimension weights and performance ranges are configurable.
              </p>
            </div>
          </div>

          {/* Top Configuration & Print Controls */}
          <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
            <button
              onClick={() => {
                setEditingWeights(weights);
                setIsWeightModalOpen(true);
              }}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all border border-indigo-400/40 flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Configure Dimension Weights"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure Weights</span>
            </button>

            <button
              onClick={() => {
                setEditingBands(bands);
                setIsBandsModalOpen(true);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
              title="Configure Performance Bands"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-300" />
              <span>Configure Bands</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
              title="Export Evaluation Matrix"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Export Audit</span>
            </button>
          </div>
        </div>

        {/* Active Weighting Scheme Readout Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold uppercase">1. Submission Compliance</div>
            <div className="text-sm font-extrabold text-white font-mono">{weights.submissionCompliance}% Weight</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold uppercase">2. Teaching Progress</div>
            <div className="text-sm font-extrabold text-blue-300 font-mono">{weights.teachingProgress}% Weight</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold uppercase">3. Student Work Coverage</div>
            <div className="text-sm font-extrabold text-emerald-300 font-mono">{weights.studentWorkCoverage}% Weight</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold uppercase">4. Evidence Completion</div>
            <div className="text-sm font-extrabold text-indigo-300 font-mono">{weights.evidenceCompletion}% Weight</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold uppercase">5. Management Review</div>
            <div className="text-sm font-extrabold text-amber-300 font-mono">{weights.managementReview}% Weight</div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & PERFORMANCE BAND SUMMARY */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
              Evaluation Filters &amp; Criteria Scope
            </h4>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teacher name, subject, class..."
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

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Branch */}
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

          {/* Section */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Sections</option>
              <option value="nursery">Nursery</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="islamia">Islamia</option>
            </select>
          </div>

          {/* Performance Band */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Performance Band
            </label>
            <select
              value={filterBand}
              onChange={(e) => setFilterBand(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All">All Bands</option>
              {bands.map(b => (
                <option key={b.id} value={b.label}>{b.label} ({b.minScore}–{b.maxScore})</option>
              ))}
            </select>
          </div>

          {/* Term */}
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

          {/* Academic Session */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Session
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

        {/* Performance Band Pills Distribution */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 flex-wrap gap-y-1.5 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Roster Distribution:</span>
          {bands.map(b => {
            const count = bandDistributions[b.label] || 0;
            return (
              <button
                key={b.id}
                onClick={() => setFilterBand(filterBand === b.label ? 'All' : b.label)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  filterBand === b.label
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{b.label} ({b.minScore}–{b.maxScore}):</span>
                <span className="font-mono bg-white/30 px-1.5 py-0.2 rounded font-extrabold">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERALL TEACHER PERFORMANCE TABLE (5 DIMENSIONS + WEIGHTED TOTAL) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">
              Staff Teaching Performance Evaluation Matrix
            </h4>
            <p className="text-[11px] text-slate-500">
              Calculated overall score applied only after configured dimension weighting ({weights.submissionCompliance}% Compliance, {weights.teachingProgress}% Progress, {weights.studentWorkCoverage}% Coverage, {weights.evidenceCompletion}% Evidence, {weights.managementReview}% Review)
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">
              Average Score: <strong className="font-mono text-slate-900">{avgOverallScore} pts</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Teacher &amp; Assignment</th>
                <th className="py-3 px-3 text-center">
                  Compliance
                  <span className="block text-[9px] font-normal text-slate-400 font-mono">({weights.submissionCompliance}%)</span>
                </th>
                <th className="py-3 px-3 text-center">
                  Progress
                  <span className="block text-[9px] font-normal text-slate-400 font-mono">({weights.teachingProgress}%)</span>
                </th>
                <th className="py-3 px-3 text-center">
                  Work Coverage
                  <span className="block text-[9px] font-normal text-slate-400 font-mono">({weights.studentWorkCoverage}%)</span>
                </th>
                <th className="py-3 px-3 text-center">
                  Evidence
                  <span className="block text-[9px] font-normal text-slate-400 font-mono">({weights.evidenceCompletion}%)</span>
                </th>
                <th className="py-3 px-3 text-center">
                  Management Review
                  <span className="block text-[9px] font-normal text-slate-400 font-mono">({weights.managementReview}%)</span>
                </th>
                <th className="py-3 px-3 text-center bg-indigo-50/50 text-indigo-900">
                  Weighted Score
                  <span className="block text-[9px] font-normal text-indigo-600 font-mono">(100%)</span>
                </th>
                <th className="py-3 px-3 text-center">Performance Band</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No teacher evaluation records matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((item) => (
                  <tr key={item.teacherId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Teacher Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{item.teacherName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                        <span className="font-semibold text-slate-700">{item.subjects.join(', ')}</span>
                        <span>•</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {item.branch}
                        </span>
                      </div>
                    </td>

                    {/* 1. Submission Compliance */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-mono font-bold text-xs text-slate-800">
                        {item.submissionComplianceScore}%
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {item.complianceDetails.onTime}/{item.complianceDetails.expected} on-time
                      </div>
                    </td>

                    {/* 2. Teaching Progress */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-mono font-bold text-xs text-blue-700">
                        {item.teachingProgressScore}%
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {item.progressDetails.completed}/{item.progressDetails.planned} topics
                      </div>
                    </td>

                    {/* 3. Student Work Coverage */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-mono font-bold text-xs text-emerald-700">
                        {item.studentWorkCoverageScore}%
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {item.coverageDetails.avgBookCoverage}% books
                      </div>
                    </td>

                    {/* 4. Evidence Completion */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-mono font-bold text-xs text-indigo-700">
                        {item.evidenceCompletionScore}%
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Photos &amp; docs
                      </div>
                    </td>

                    {/* 5. Management Review */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedTeacherForReview(item);
                          setIsReviewDrawerOpen(true);
                        }}
                        className="group inline-flex flex-col items-center cursor-pointer"
                        title="Click to edit supervisor review score"
                      >
                        <div className="font-mono font-bold text-xs text-amber-700 group-hover:underline flex items-center space-x-1">
                          <span>{item.managementReviewScore}%</span>
                          <Edit3 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {item.managementReviewDetails ? 'Supervisor Rated' : 'Default Benchmark'}
                        </div>
                      </button>
                    </td>

                    {/* Overall Weighted Score */}
                    <td className="py-3.5 px-3 text-center bg-indigo-50/40">
                      <div className="font-mono font-extrabold text-sm text-indigo-950">
                        {item.overallWeightedScore}
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">/100</span>
                      </div>
                    </td>

                    {/* Performance Band */}
                    <td className="py-3.5 px-3 text-center">
                      {renderBandBadge(item.performanceBand)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedScorecardTeacher(item)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                          title="View detailed scorecard"
                        >
                          <span>Scorecard</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        {onNavigateToReviewWorkflow && (
                          <button
                            onClick={() => onNavigateToReviewWorkflow(item)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1 border border-emerald-200/60"
                            title="Open Review & Follow-Up Workflow"
                          >
                            <History className="w-3 h-3" />
                            <span>Action</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          MODAL 1: CONFIGURE DIMENSION WEIGHTS
          ========================================================= */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-base">Configure Dimension Weighting</h3>
              </div>
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Adjust the relative percentage assigned to each evaluation dimension. The overall teacher score is computed only after these weights are applied.
              </p>

              {/* Total Weight Indicator */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between font-bold ${
                totalEditingWeight === 100
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                <span>Total Configured Weight:</span>
                <span className="font-mono text-sm">{totalEditingWeight}% / 100%</span>
              </div>

              {/* Weight Inputs */}
              <div className="space-y-3 pt-1">
                {/* 1. Submission Compliance */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">1. Submission Compliance</span>
                    <span className="font-mono font-bold text-indigo-600">{editingWeights.submissionCompliance}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={editingWeights.submissionCompliance}
                    onChange={(e) => setEditingWeights(prev => ({ ...prev, submissionCompliance: Number(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* 2. Teaching Progress */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">2. Teaching Progress</span>
                    <span className="font-mono font-bold text-blue-600">{editingWeights.teachingProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={editingWeights.teachingProgress}
                    onChange={(e) => setEditingWeights(prev => ({ ...prev, teachingProgress: Number(e.target.value) }))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* 3. Student Work Coverage */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">3. Student Work Coverage</span>
                    <span className="font-mono font-bold text-emerald-600">{editingWeights.studentWorkCoverage}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={editingWeights.studentWorkCoverage}
                    onChange={(e) => setEditingWeights(prev => ({ ...prev, studentWorkCoverage: Number(e.target.value) }))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* 4. Evidence Completion */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">4. Evidence Completion</span>
                    <span className="font-mono font-bold text-indigo-600">{editingWeights.evidenceCompletion}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={editingWeights.evidenceCompletion}
                    onChange={(e) => setEditingWeights(prev => ({ ...prev, evidenceCompletion: Number(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* 5. Management Review */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">5. Management Review</span>
                    <span className="font-mono font-bold text-amber-600">{editingWeights.managementReview}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={editingWeights.managementReview}
                    onChange={(e) => setEditingWeights(prev => ({ ...prev, managementReview: Number(e.target.value) }))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Reset to Standard Defaults */}
              <button
                onClick={() => setEditingWeights(DEFAULT_WEIGHTS)}
                className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Standard Defaults (20/35/20/10/15)</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWeights}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Weights</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: CONFIGURE PERFORMANCE BANDS
          ========================================================= */}
      {isBandsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-base">Configure Performance Bands</h3>
              </div>
              <button
                onClick={() => setIsBandsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <p className="text-slate-600">
                Modify the performance category thresholds, band names, and descriptive indicators to match institutional appraisal policy.
              </p>

              <div className="space-y-3">
                {editingBands.map((band, idx) => (
                  <div key={band.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-600" />
                        <input
                          type="text"
                          value={band.label}
                          onChange={(e) => {
                            const newBands = [...editingBands];
                            newBands[idx].label = e.target.value;
                            setEditingBands(newBands);
                          }}
                          className="font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                        />
                      </div>

                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        <span>Range:</span>
                        <input
                          type="number"
                          value={band.minScore}
                          onChange={(e) => {
                            const newBands = [...editingBands];
                            newBands[idx].minScore = Number(e.target.value);
                            setEditingBands(newBands);
                          }}
                          className="w-12 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-bold"
                        />
                        <span>–</span>
                        <input
                          type="number"
                          value={band.maxScore}
                          onChange={(e) => {
                            const newBands = [...editingBands];
                            newBands[idx].maxScore = Number(e.target.value);
                            setEditingBands(newBands);
                          }}
                          className="w-12 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-bold"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={band.description}
                      onChange={(e) => {
                        const newBands = [...editingBands];
                        newBands[idx].description = e.target.value;
                        setEditingBands(newBands);
                      }}
                      className="w-full text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1"
                      placeholder="Category description..."
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setEditingBands(DEFAULT_BANDS)}
                className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Standard Ministry Bands (90-100, 80-89, 70-79, 60-69, Below 60)</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsBandsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBands}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Bands</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: SUPERVISOR MANAGEMENT REVIEW RATING SHEET
          ========================================================= */}
      {isReviewDrawerOpen && selectedTeacherForReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Management Supervisory Review</h3>
                <p className="text-xs text-slate-300">Teacher: <strong>{selectedTeacherForReview.teacherName}</strong></p>
              </div>
              <button
                onClick={() => setIsReviewDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <p className="text-slate-600">
                Record classroom observation ratings and qualitative feedback to feed into the <strong>Management Review ({weights.managementReview}%)</strong> dimension.
              </p>

              {/* Rubric Criteria Ratings */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>Lesson Preparation &amp; Materials</span>
                    <span className="font-mono text-indigo-600">85%</span>
                  </div>
                  <input type="range" min={0} max={100} defaultValue={85} className="w-full accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>Classroom Delivery &amp; Board Work</span>
                    <span className="font-mono text-indigo-600">85%</span>
                  </div>
                  <input type="range" min={0} max={100} defaultValue={85} className="w-full accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>Student Engagement &amp; Inclusivity</span>
                    <span className="font-mono text-indigo-600">88%</span>
                  </div>
                  <input type="range" min={0} max={100} defaultValue={88} className="w-full accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>Professional Demeanor &amp; Punctuality</span>
                    <span className="font-mono text-indigo-600">90%</span>
                  </div>
                  <input type="range" min={0} max={100} defaultValue={90} className="w-full accent-indigo-600" />
                </div>
              </div>

              {/* Qualitative Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Supervisor Observation Notes
                </label>
                <textarea
                  rows={3}
                  defaultValue="Demonstrates strong mastery of numeracy concepts with clear step-by-step board summaries. Encourages active student questions."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Recommendations for Development */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                  Professional Development Recommendations
                </label>
                <input
                  type="text"
                  defaultValue="Continue weekly notebook sampling and introduce differentiated practice exercises."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsReviewDrawerOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/teacher-management-reviews', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        teacherId: selectedTeacherForReview.teacherId,
                        teacherName: selectedTeacherForReview.teacherName,
                        term: filterTerm === 'All' ? 'First Term' : filterTerm,
                        academicSession: filterSession === 'All' ? '2025/2026' : filterSession,
                        branch: selectedTeacherForReview.branch,
                        reviewerName: 'Academic Supervisor',
                        overallScore: 88,
                        qualitativeNotes: 'Demonstrates strong mastery of numeracy concepts.',
                        recommendations: 'Continue weekly notebook sampling.'
                      })
                    });
                    await fetchManagementReviews();
                    setIsReviewDrawerOpen(false);
                    alert("Management review saved successfully.");
                  } catch (e) {
                    console.error(e);
                    alert("Failed to save review.");
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Review Score</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: TEACHER PERFORMANCE SCORECARD DRILL-DOWN
          ========================================================= */}
      {selectedScorecardTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-base">{selectedScorecardTeacher.teacherName}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase">
                    {selectedScorecardTeacher.branch} • {selectedScorecardTeacher.section}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Subjects: {selectedScorecardTeacher.subjects.join(', ')} | Classes: {selectedScorecardTeacher.classes.join(', ')}
                </p>
              </div>

              <button
                onClick={() => setSelectedScorecardTeacher(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scorecard Summary Hero */}
            <div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Overall Weighted Performance Score
                </div>
                <div className="text-3xl font-extrabold font-mono text-indigo-950 mt-0.5 flex items-baseline space-x-2">
                  <span>{selectedScorecardTeacher.overallWeightedScore}</span>
                  <span className="text-xs text-slate-500 font-sans font-medium">out of 100 points</span>
                </div>
              </div>

              <div>
                {renderBandBadge(selectedScorecardTeacher.performanceBand)}
              </div>
            </div>

            {/* 5 Dimensions Detailed Breakdown */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Configured Dimension Breakdown &amp; Weighted Contributions
              </h5>

              <div className="space-y-3">
                {/* 1. Submission Compliance */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">1. Submission Compliance ({weights.submissionCompliance}% Weight)</span>
                      <p className="text-[11px] text-slate-500">Timeline task timeliness against scheduled milestones</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">{selectedScorecardTeacher.submissionComplianceScore}%</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        +{((selectedScorecardTeacher.submissionComplianceScore * weights.submissionCompliance) / 100).toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-800 h-full rounded-full" style={{ width: `${selectedScorecardTeacher.submissionComplianceScore}%` }} />
                  </div>
                </div>

                {/* 2. Teaching Progress */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">2. Teaching Progress ({weights.teachingProgress}% Weight)</span>
                      <p className="text-[11px] text-slate-500">Curriculum topic completion and pacing alignment</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-blue-700">{selectedScorecardTeacher.teachingProgressScore}%</span>
                      <span className="text-[10px] text-blue-600 block font-mono">
                        +{((selectedScorecardTeacher.teachingProgressScore * weights.teachingProgress) / 100).toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${selectedScorecardTeacher.teachingProgressScore}%` }} />
                  </div>
                </div>

                {/* 3. Student Work Coverage */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">3. Student Work Coverage ({weights.studentWorkCoverage}% Weight)</span>
                      <p className="text-[11px] text-slate-500">Student notebook reviews and class exercise participation</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700">{selectedScorecardTeacher.studentWorkCoverageScore}%</span>
                      <span className="text-[10px] text-emerald-600 block font-mono">
                        +{((selectedScorecardTeacher.studentWorkCoverageScore * weights.studentWorkCoverage) / 100).toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${selectedScorecardTeacher.studentWorkCoverageScore}%` }} />
                  </div>
                </div>

                {/* 4. Evidence Completion */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">4. Evidence Completion ({weights.evidenceCompletion}% Weight)</span>
                      <p className="text-[11px] text-slate-500">Photographic board attachments and documentary samples</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-indigo-700">{selectedScorecardTeacher.evidenceCompletionScore}%</span>
                      <span className="text-[10px] text-indigo-600 block font-mono">
                        +{((selectedScorecardTeacher.evidenceCompletionScore * weights.evidenceCompletion) / 100).toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${selectedScorecardTeacher.evidenceCompletionScore}%` }} />
                  </div>
                </div>

                {/* 5. Management Review */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">5. Management Review ({weights.managementReview}% Weight)</span>
                      <p className="text-[11px] text-slate-500">Supervisor classroom observation and professional appraisal</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-700">{selectedScorecardTeacher.managementReviewScore}%</span>
                      <span className="text-[10px] text-amber-600 block font-mono">
                        +{((selectedScorecardTeacher.managementReviewScore * weights.managementReview) / 100).toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${selectedScorecardTeacher.managementReviewScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Evaluation indicators support constructive teacher coaching and leadership review
              </span>
              <button
                onClick={() => setSelectedScorecardTeacher(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
