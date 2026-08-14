import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  BookOpen, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  RotateCcw, 
  Check, 
  BrainCircuit, 
  Info, 
  ArrowUpRight, 
  Award, 
  Calendar, 
  ShieldAlert,
  Download,
  FileText
} from 'lucide-react';

interface MetricBreakdown {
  studentGrades: number;
  attendance: number;
  teacherPerformance: number;
  curriculumCompliance: number;
  feeCollection?: number;
  budgetVariance?: number;
  payrollCompliance?: number;
  readinessRate?: number;
  stockHealth?: number;
  taskCompletion?: number;
  deadlineCompliance?: number;
  admissionTurnaround?: number;
  schedulingCoverage?: number;
}

interface CategoryData {
  score: number;
  breakdown: MetricBreakdown;
}

interface HealthData {
  branch: string;
  date: string;
  compositeScore: number;
  categories: {
    academic: CategoryData;
    financial: CategoryData;
    inventory: CategoryData;
    operational: CategoryData;
  };
  trendHistory: Array<{
    month: string;
    academic: number;
    financial: number;
    inventory: number;
    operational: number;
    composite: number;
  }>;
}

export default function ExecutiveHealthDashboard({ activeBranch }: { activeBranch: 'GN' | 'RS' }) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Custom Weighting System (sums up to 100%)
  const [weights, setWeights] = useState({
    academic: 25,
    financial: 25,
    inventory: 25,
    operational: 25
  });

  // Selected Category filter for Trend Chart
  const [selectedTrendMetric, setSelectedTrendMetric] = useState<'composite' | 'academic' | 'financial' | 'inventory' | 'operational'>('composite');

  // AI-Generated Executive Briefing State
  const [briefText, setBriefText] = useState<string>('');
  const [generatingBrief, setGeneratingBrief] = useState<boolean>(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  // What-If Scenario Planning Simulator State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedLevers, setSimulatedLevers] = useState({
    studentGrades: 80,
    attendance: 85,
    feeCollection: 80,
    taskCompletion: 80
  });

  // Last Synced Timestamp
  const [lastSynced, setLastSynced] = useState<string>('');

  // -------------------------------------------------------------
  // SELECTORS / DERIVED STATE (LEXICALLY TOP)
  // -------------------------------------------------------------

  // Dynamic calculations based on simulated levers vs actual values
  const currentCategories = useMemo(() => {
    if (!data) return null;
    if (!isSimulating) return data.categories;

    // Recalculate dimensions based on what-if inputs
    const academicScore = Math.round(
      0.40 * simulatedLevers.studentGrades +
      0.30 * simulatedLevers.attendance +
      0.20 * data.categories.academic.breakdown.teacherPerformance +
      0.10 * data.categories.academic.breakdown.curriculumCompliance
    );

    const financialScore = Math.round(
      0.40 * simulatedLevers.feeCollection +
      0.40 * (data.categories.financial.breakdown.budgetVariance ?? 85) +
      0.20 * (data.categories.financial.breakdown.payrollCompliance ?? 90)
    );

    const operationalScore = Math.round(
      0.40 * simulatedLevers.taskCompletion +
      0.30 * (data.categories.operational.breakdown.deadlineCompliance ?? 85) +
      0.20 * (data.categories.operational.breakdown.admissionTurnaround ?? 80) +
      0.10 * (data.categories.operational.breakdown.schedulingCoverage ?? 90)
    );

    return {
      academic: {
        score: academicScore,
        breakdown: {
          ...data.categories.academic.breakdown,
          studentGrades: simulatedLevers.studentGrades,
          attendance: simulatedLevers.attendance
        }
      },
      financial: {
        score: financialScore,
        breakdown: {
          ...data.categories.financial.breakdown,
          feeCollection: simulatedLevers.feeCollection
        }
      },
      inventory: data.categories.inventory, // inventory remains same in simulation
      operational: {
        score: operationalScore,
        breakdown: {
          ...data.categories.operational.breakdown,
          taskCompletion: simulatedLevers.taskCompletion
        }
      }
    };
  }, [data, isSimulating, simulatedLevers]);

  // Recalculate Composite Score on-the-fly using customized weights
  const currentCompositeScore = useMemo(() => {
    if (!currentCategories) return 0;
    
    const weightedSum = (
      (weights.academic / 100) * currentCategories.academic.score +
      (weights.financial / 100) * currentCategories.financial.score +
      (weights.inventory / 100) * currentCategories.inventory.score +
      (weights.operational / 100) * currentCategories.operational.score
    );
    return Math.round(weightedSum);
  }, [currentCategories, weights]);

  // Visual status feedback text and classes
  const healthStatusInfo = useMemo(() => {
    const score = currentCompositeScore;
    if (score >= 90) {
      return { 
        label: "Outstanding Performance", 
        desc: "All dimensions demonstrate exemplary administrative, compliance, and fiscal discipline.",
        colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200",
        ringClass: "stroke-emerald-500",
        bgCircle: "fill-emerald-50/40"
      };
    } else if (score >= 80) {
      return { 
        label: "Good Standing", 
        desc: "School operations are stable and compliance indexes remain safely above historical benchmarks.",
        colorClass: "text-indigo-600 bg-indigo-50 border-indigo-200",
        ringClass: "stroke-indigo-500",
        bgCircle: "fill-indigo-50/40"
      };
    } else if (score >= 70) {
      return { 
        label: "Moderate Alert", 
        desc: "Minor structural issues identified. Academic averages or financial variances require review.",
        colorClass: "text-amber-600 bg-amber-50 border-amber-200",
        ringClass: "stroke-amber-500",
        bgCircle: "fill-amber-50/40"
      };
    } else {
      return { 
        label: "Critical Action Required", 
        desc: "Institutional health below safety threshold. Active remedial drives must be launched immediately.",
        colorClass: "text-rose-600 bg-rose-50 border-rose-200",
        ringClass: "stroke-rose-500",
        bgCircle: "fill-rose-50/40"
      };
    }
  }, [currentCompositeScore]);

  // Render SVG Gauges Circle Params
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useMemo(() => {
    return circumference - (currentCompositeScore / 100) * circumference;
  }, [currentCompositeScore, circumference]);

  // -------------------------------------------------------------
  // MEMOIZED HANDLERS & API ACTIONS
  // -------------------------------------------------------------

  // Fetch Health Data from Score Engine API
  const fetchHealthScores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/operations/health?branch=${activeBranch}`);
      if (!res.ok) {
        throw new Error("Could not resolve real-time institutional health variables");
      }
      const json: HealthData = await res.json();
      setData(json);
      
      // Initialize what-if levers with live database stats
      setSimulatedLevers({
        studentGrades: json.categories.academic.breakdown.studentGrades,
        attendance: json.categories.academic.breakdown.attendance,
        feeCollection: json.categories.financial.breakdown.feeCollection || 80,
        taskCompletion: json.categories.operational.breakdown.taskCompletion || 80
      });

      const now = new Date();
      setLastSynced(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error(err);
      setError("The Health Score engine is temporarily offline. Please verify API bindings.");
    } finally {
      setLoading(false);
    }
  }, [activeBranch]);

  // Request AI-Generated Briefing from Gemini based on weights and categories
  const handleGenerateBrief = useCallback(async () => {
    if (!data || !currentCategories) return;
    try {
      setGeneratingBrief(true);
      setBriefError(null);
      setBriefText('');

      const res = await fetch('/api/operations/health/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositeScore: currentCompositeScore,
          categories: currentCategories,
          branch: activeBranch
        })
      });

      if (!res.ok) {
        throw new Error("Gemini AI Briefing service returned a fault state.");
      }
      const result = await res.json();
      setBriefText(result.brief);
    } catch (err: any) {
      console.error(err);
      setBriefError(err.message || "Failed to generate AI executive summary.");
    } finally {
      setGeneratingBrief(false);
    }
  }, [data, currentCategories, currentCompositeScore, activeBranch]);

  // Handle Weight Shifting with Smart Re-balancing Check
  const handleWeightChange = useCallback((category: 'academic' | 'financial' | 'inventory' | 'operational', value: number) => {
    const diff = value - weights[category];
    const otherCategories = (['academic', 'financial', 'inventory', 'operational'] as const).filter(c => c !== category);
    
    // Proportionally distribute opposite change to other variables to preserve 100% total
    const totalOthers = otherCategories.reduce((acc: number, c) => acc + weights[c], 0);
    
    let nextWeights = { ...weights, [category]: value };
    
    if (totalOthers > 0) {
      otherCategories.forEach(c => {
        const proportion = weights[c] / totalOthers;
        const reduction = Math.round(diff * proportion);
        nextWeights[c] = Math.max(0, weights[c] - reduction);
      });
    } else {
      // equal fallback
      const splitVal = Math.floor((100 - value) / 3);
      otherCategories.forEach((c, idx) => {
        nextWeights[c] = idx === 2 ? (100 - value - splitVal * 2) : splitVal;
      });
    }

    // Force total exactly to 100
    const currentSum = (Object.values(nextWeights) as number[]).reduce((a: number, b: number) => a + b, 0);
    if (currentSum !== 100) {
      const difference = 100 - currentSum;
      nextWeights[otherCategories[0]] = Math.max(0, nextWeights[otherCategories[0]] + difference);
    }

    setWeights(nextWeights);
  }, [weights]);

  // Reset Weights to equal distribution (25% each)
  const handleResetWeights = useCallback(() => {
    setWeights({
      academic: 25,
      financial: 25,
      inventory: 25,
      operational: 25
    });
  }, []);

  // Reset Simulator levers to live DB values
  const handleResetSimulator = useCallback(() => {
    if (data) {
      setSimulatedLevers({
        studentGrades: data.categories.academic.breakdown.studentGrades,
        attendance: data.categories.academic.breakdown.attendance,
        feeCollection: data.categories.financial.breakdown.feeCollection || 80,
        taskCompletion: data.categories.operational.breakdown.taskCompletion || 80
      });
    }
    setIsSimulating(false);
  }, [data]);

  // Trigger Local PDF/Print Preview
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // -------------------------------------------------------------
  // SIDE EFFECTS / REACT LIFECYCLES
  // -------------------------------------------------------------

  // Run initial fetch on branch changes
  useEffect(() => {
    fetchHealthScores();
  }, [fetchHealthScores]);

  // Auto-generate briefing once data initially loads (only when active branch or database sync loads new data)
  useEffect(() => {
    if (data) {
      handleGenerateBrief();
    }
    // We intentionally omit currentCategories/currentCompositeScore/handleGenerateBrief from the auto-run effect
    // to prevent continuous API calls while actively dragging the weight/scenario simulation sliders.
    // Users can click "Refresh Strategic Advice" to update advice dynamically after tweaking inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Calculating institutional parameters...</p>
      </div>
    );
  }

  if (error || !data || !currentCategories) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-rose-800 max-w-2xl mx-auto my-12 shadow-sm">
        <AlertTriangle className="w-12 h-12 mx-auto text-rose-500 mb-4 animate-bounce" />
        <h3 className="font-bold text-lg mb-2">Health Engine Offline</h3>
        <p className="text-sm text-rose-600/90 mb-4">{error || "Data integrity check failed."}</p>
        <button 
          onClick={fetchHealthScores}
          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors inline-flex items-center space-x-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Rerun Calculations</span>
        </button>
      </div>
    );
  }

  return (
    <div id="school-health-root" className="space-y-6">
      
      {/* =========================================================
          HEALTH SYSTEM HEADER BAR
          ========================================================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Health Score System</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Institutional visibility index for Gawun Nama &amp; Runjin Sambo campuses. Last computed: <span className="font-semibold text-slate-700">{lastSynced || "Just now"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchHealthScores}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recalculate Indices</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-300" />
            <span>Print Executive Report</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          EXECUTIVE SUMMARY GRID (CENTRAL WIDGET)
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* composite Gauge Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Institutional Composite Health</h3>
              <TrendingUp className="text-slate-400 w-4 h-4 shrink-0" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Weighted average of academic, financial, inventory, and operational metrics</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4 relative">
            {/* SVG Ring Gauge */}
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-100 fill-none"
                strokeWidth={strokeWidth}
              />
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                className={`fill-none ${healthStatusInfo.ringClass}`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>

            {/* Centered Score text */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900 tracking-tight">{currentCompositeScore}</span>
              <span className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">Index Rating</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${healthStatusInfo.colorClass} space-y-1`}>
            <div className="flex items-center space-x-1.5 font-bold text-xs uppercase tracking-wider">
              {currentCompositeScore >= 70 ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0" />
              )}
              <span>{healthStatusInfo.label}</span>
              {isSimulating && (
                <span className="text-[9px] bg-indigo-200/50 text-indigo-800 px-1.5 py-0.5 rounded ml-auto font-mono">SIMULATED</span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">{healthStatusInfo.desc}</p>
          </div>
        </div>

        {/* Weights & Customizer Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Dynamic Weighting Matrix</h3>
              <Sliders className="text-slate-400 w-4 h-4 shrink-0" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Adjust sliders to redefine index significance. Total weight must sum to 100%.</p>
          </div>

          <div className="space-y-4 py-2">
            {/* Slider 1: Academic */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Academic Quality</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">{weights.academic}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={weights.academic}
                onChange={(e) => handleWeightChange('academic', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Slider 2: Financial */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Fiscal Stability</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono">{weights.financial}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={weights.financial}
                onChange={(e) => handleWeightChange('financial', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Slider 3: Inventory */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Inventory &amp; Readiness</span>
                <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-mono">{weights.inventory}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={weights.inventory}
                onChange={(e) => handleWeightChange('inventory', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
            </div>

            {/* Slider 4: Operational */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Operational Efficacy</span>
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-mono">{weights.operational}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={weights.operational}
                onChange={(e) => handleWeightChange('operational', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Auto-balanced matrix configuration</span>
            <button
              onClick={handleResetWeights}
              className="text-[11px] text-slate-500 hover:text-slate-900 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Equal 25%</span>
            </button>
          </div>
        </div>

        {/* AI Advisor Briefing Widget */}
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="text-amber-400 w-4 h-4 shrink-0 animate-pulse" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-150">Gemini Executive Advisor</h3>
              </div>
              <BrainCircuit className="text-indigo-400 w-4 h-4 shrink-0" />
            </div>
            <p className="text-xs text-indigo-300 mt-1">Real-time strategic synthesis of institutional parameters</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[170px] pr-1 space-y-2">
            {generatingBrief ? (
              <div className="space-y-2 pt-2 animate-pulse">
                <div className="h-2.5 bg-indigo-800/60 rounded w-3/4" />
                <div className="h-2.5 bg-indigo-800/60 rounded w-5/6" />
                <div className="h-2.5 bg-indigo-800/60 rounded w-2/3" />
                <div className="h-2.5 bg-indigo-800/60 rounded w-4/5" />
                <div className="h-2.5 bg-indigo-800/60 rounded w-1/2" />
              </div>
            ) : briefError ? (
              <div className="p-3 rounded-lg bg-indigo-900/40 border border-indigo-800/60 text-xs text-indigo-200 mt-2">
                <Info className="w-4 h-4 inline mr-1 text-indigo-400" />
                <span>{briefError}</span>
              </div>
            ) : briefText ? (
              <div className="prose prose-sm prose-invert text-slate-300 text-xs leading-relaxed font-sans whitespace-pre-line pt-1">
                {briefText}
              </div>
            ) : (
              <p className="text-xs text-indigo-300/60 italic pt-4">No health advice synthesized. Click generate below.</p>
            )}
          </div>

          <button
            onClick={handleGenerateBrief}
            disabled={generatingBrief}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 shrink-0" />
            <span>{generatingBrief ? "Synthesizing Brief..." : "Refresh Strategic Advice"}</span>
          </button>
        </div>

      </div>

      {/* =========================================================
          DIMENSIONAL HEALTH BREAKDOWN (THE 4 CORE QUADRANTS)
          ========================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Operational Health Dimensions</h3>
          <span className="text-[11px] text-slate-400 font-medium">Real-time variables from current databases</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Quadrant 1: Academic */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <BookOpen className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Academic Quality</span>
                </div>
                <span className={`text-base font-black px-2.5 py-1 rounded-xl font-mono ${
                  currentCategories.academic.score >= 85 ? 'text-emerald-700 bg-emerald-50' : 'text-indigo-700 bg-indigo-50'
                }`}>
                  {currentCategories.academic.score}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">Measures grading indices, curriculum completion, and student/faculty retention curves.</p>
            </div>

            {/* sub-metrics bars */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* metric 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Student Grades Avg</span>
                  <span className="font-bold text-slate-900">{currentCategories.academic.breakdown.studentGrades}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${currentCategories.academic.breakdown.studentGrades}%` }} />
                </div>
              </div>

              {/* metric 2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Student Attendance</span>
                  <span className="font-bold text-slate-900">{currentCategories.academic.breakdown.attendance}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${currentCategories.academic.breakdown.attendance}%` }} />
                </div>
              </div>

              {/* metric 3 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Teacher Reviews Avg</span>
                  <span className="font-bold text-slate-900">{currentCategories.academic.breakdown.teacherPerformance}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${currentCategories.academic.breakdown.teacherPerformance}%` }} />
                </div>
              </div>

              {/* metric 4 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Curriculum Compliance</span>
                  <span className="font-bold text-slate-900">{currentCategories.academic.breakdown.curriculumCompliance}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${currentCategories.academic.breakdown.curriculumCompliance}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quadrant 2: Financial */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                    <DollarSign className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Fiscal Stability</span>
                </div>
                <span className={`text-base font-black px-2.5 py-1 rounded-xl font-mono ${
                  currentCategories.financial.score >= 85 ? 'text-emerald-700 bg-emerald-50' : 'text-indigo-700 bg-indigo-50'
                }`}>
                  {currentCategories.financial.score}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">Evaluates fee collection ratios, budget constraints, and operational liabilities.</p>
            </div>

            {/* sub-metrics bars */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* metric 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Fee Collection Rate</span>
                  <span className="font-bold text-slate-900">{currentCategories.financial.breakdown.feeCollection}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${currentCategories.financial.breakdown.feeCollection}%` }} />
                </div>
              </div>

              {/* metric 2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Budget Control Ratio</span>
                  <span className="font-bold text-slate-900">{currentCategories.financial.breakdown.budgetVariance}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${currentCategories.financial.breakdown.budgetVariance}%` }} />
                </div>
              </div>

              {/* metric 3 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Payroll Compliance</span>
                  <span className="font-bold text-slate-900">{currentCategories.financial.breakdown.payrollCompliance}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${currentCategories.financial.breakdown.payrollCompliance}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quadrant 3: Inventory */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                    <Layers className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Inventory Readiness</span>
                </div>
                <span className={`text-base font-black px-2.5 py-1 rounded-xl font-mono ${
                  currentCategories.inventory.score >= 85 ? 'text-emerald-700 bg-emerald-50' : 'text-indigo-700 bg-indigo-50'
                }`}>
                  {currentCategories.inventory.score}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">Monitors logistics checks, upcoming event gear shortages, and stock thresholds.</p>
            </div>

            {/* sub-metrics bars */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* metric 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Logistics Readiness Checks</span>
                  <span className="font-bold text-slate-900">{currentCategories.inventory.breakdown.readinessRate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${currentCategories.inventory.breakdown.readinessRate}%` }} />
                </div>
              </div>

              {/* metric 2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Healthy Stock Ratios</span>
                  <span className="font-bold text-slate-900">{currentCategories.inventory.breakdown.stockHealth}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${currentCategories.inventory.breakdown.stockHealth}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quadrant 4: Operational */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-rose-50 p-2 rounded-lg text-rose-600">
                    <Activity className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Operational Efficacy</span>
                </div>
                <span className={`text-base font-black px-2.5 py-1 rounded-xl font-mono ${
                  currentCategories.operational.score >= 85 ? 'text-emerald-700 bg-emerald-50' : 'text-indigo-700 bg-indigo-50'
                }`}>
                  {currentCategories.operational.score}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">Measures task compliance, deadline completion speed, admissions reviews, and coverage schedules.</p>
            </div>

            {/* sub-metrics bars */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* metric 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Task Completion Ratio</span>
                  <span className="font-bold text-slate-900">{currentCategories.operational.breakdown.taskCompletion}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${currentCategories.operational.breakdown.taskCompletion}%` }} />
                </div>
              </div>

              {/* metric 2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Deadline Compliance</span>
                  <span className="font-bold text-slate-900">{currentCategories.operational.breakdown.deadlineCompliance}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${currentCategories.operational.breakdown.deadlineCompliance}%` }} />
                </div>
              </div>

              {/* metric 3 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Admission Reviews rate</span>
                  <span className="font-bold text-slate-900">{currentCategories.operational.breakdown.admissionTurnaround}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${currentCategories.operational.breakdown.admissionTurnaround}%` }} />
                </div>
              </div>

              {/* metric 4 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Class Timetable Coverage</span>
                  <span className="font-bold text-slate-900">{currentCategories.operational.breakdown.schedulingCoverage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${currentCategories.operational.breakdown.schedulingCoverage}%` }} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================
          TREND TRACKING & SCENARIO PLANNING BLOCK
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend line Chart Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Historical Trend Analysis</h3>
                <p className="text-xs text-slate-500 mt-0.5">Track institutional index progression over the current academic session</p>
              </div>

              {/* Filter selections */}
              <div className="flex flex-wrap bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                {(['composite', 'academic', 'financial', 'inventory', 'operational'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedTrendMetric(m)}
                    className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${
                      selectedTrendMetric === m 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full h-64 pt-4 relative">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" className="stroke-slate-100 stroke-1" strokeDasharray="4 4" />
              <line x1="40" y1="60" x2="480" y2="60" className="stroke-slate-100 stroke-1" strokeDasharray="4 4" />
              <line x1="40" y1="100" x2="480" y2="100" className="stroke-slate-100 stroke-1" strokeDasharray="4 4" />
              <line x1="40" y1="140" x2="480" y2="140" className="stroke-slate-100 stroke-1" strokeDasharray="4 4" />
              <line x1="40" y1="180" x2="480" y2="180" className="stroke-slate-200 stroke-1" />

              {/* Y-Axis Labels */}
              <text x="30" y="24" className="text-[10px] font-bold fill-slate-400 text-right">100</text>
              <text x="30" y="64" className="text-[10px] font-bold fill-slate-400 text-right">80</text>
              <text x="30" y="104" className="text-[10px] font-bold fill-slate-400 text-right">60</text>
              <text x="30" y="144" className="text-[10px] font-bold fill-slate-400 text-right">40</text>
              <text x="30" y="184" className="text-[10px] font-bold fill-slate-400 text-right">20</text>

              {/* Draw Data Line */}
              {(() => {
                const points = data.trendHistory.map((item, idx) => {
                  const x = 40 + idx * (440 / (data.trendHistory.length - 1));
                  const score = idx === data.trendHistory.length - 1 
                    ? (selectedTrendMetric === 'composite' ? currentCompositeScore : currentCategories[selectedTrendMetric].score)
                    : item[selectedTrendMetric];
                  // map score (0-100) to y (180 to 20)
                  const y = 180 - (score / 100) * 160;
                  return { x, y, score, item };
                });

                const pathString = points.reduce((acc, p, idx) => {
                  return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                }, "");

                // Chart colors based on chosen category
                const colorHex = 
                  selectedTrendMetric === 'composite' ? '#4F46E5' : // Indigo
                  selectedTrendMetric === 'academic' ? '#3B82F6' :  // Blue
                  selectedTrendMetric === 'financial' ? '#10B981' : // Emerald
                  selectedTrendMetric === 'inventory' ? '#F59E0B' : // Amber
                  '#EF4444'; // Rose

                return (
                  <>
                    {/* Glowing Area under line */}
                    <path
                      d={`${pathString} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`}
                      fill={`url(#area-gradient-${selectedTrendMetric})`}
                      opacity="0.15"
                    />

                    <defs>
                      <linearGradient id={`area-gradient-${selectedTrendMetric}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colorHex} />
                        <stop offset="100%" stopColor={colorHex} stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Smooth curve line */}
                    <motion.path
                      d={pathString}
                      fill="none"
                      stroke={colorHex}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />

                    {/* Points Circles */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="5.5"
                          className="fill-white stroke-2"
                          stroke={colorHex}
                        />
                        {/* Hover Tooltip or Value indicator */}
                        <text
                          x={p.x}
                          y={p.y - 12}
                          className="text-[10px] font-black font-mono fill-slate-800 text-center"
                          textAnchor="middle"
                        >
                          {p.score}
                        </text>
                        {/* X Axis Labels */}
                        <text
                          x={p.x}
                          y="196"
                          className="text-[10px] font-bold fill-slate-400"
                          textAnchor="middle"
                        >
                          {p.item.month}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* What-If Simulation Panel */}
        <div className="bg-slate-50 border border-slate-250 p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">What-If Scenario Planner</h3>
              <Sparkles className="text-amber-500 w-4 h-4 shrink-0 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Simulate operational actions to predict their positive impact on combined health parameters.</p>
          </div>

          <div className="space-y-4 py-2">
            
            {/* Lever 1: Attendance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600">Simulate Target Attendance</span>
                <span className="font-mono font-bold text-slate-900">{simulatedLevers.attendance}%</span>
              </div>
              <input 
                type="range"
                min="50"
                max="100"
                value={simulatedLevers.attendance}
                onChange={(e) => {
                  setIsSimulating(true);
                  setSimulatedLevers(prev => ({ ...prev, attendance: Number(e.target.value) }));
                }}
                className="w-full h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Lever 2: Grades */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600">Simulate Exam Grades Avg</span>
                <span className="font-mono font-bold text-slate-900">{simulatedLevers.studentGrades}%</span>
              </div>
              <input 
                type="range"
                min="50"
                max="100"
                value={simulatedLevers.studentGrades}
                onChange={(e) => {
                  setIsSimulating(true);
                  setSimulatedLevers(prev => ({ ...prev, studentGrades: Number(e.target.value) }));
                }}
                className="w-full h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Lever 3: Fee Collection */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600">Simulate Fee Collection</span>
                <span className="font-mono font-bold text-slate-900">{simulatedLevers.feeCollection}%</span>
              </div>
              <input 
                type="range"
                min="50"
                max="100"
                value={simulatedLevers.feeCollection}
                onChange={(e) => {
                  setIsSimulating(true);
                  setSimulatedLevers(prev => ({ ...prev, feeCollection: Number(e.target.value) }));
                }}
                className="w-full h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Lever 4: Task Completion */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600">Simulate Task Completion</span>
                <span className="font-mono font-bold text-slate-900">{simulatedLevers.taskCompletion}%</span>
              </div>
              <input 
                type="range"
                min="50"
                max="100"
                value={simulatedLevers.taskCompletion}
                onChange={(e) => {
                  setIsSimulating(true);
                  setSimulatedLevers(prev => ({ ...prev, taskCompletion: Number(e.target.value) }));
                }}
                className="w-full h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

          </div>

          <div className="pt-2 border-t border-slate-200 flex flex-col space-y-2">
            {isSimulating ? (
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded animate-pulse">
                  Simulation Overlay Active
                </span>
                <button
                  onClick={handleResetSimulator}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore Live Metrics</span>
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 italic">Adjust sliders to test dynamic predictive health variables</span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
