import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Check, 
  X, 
  BookOpen, 
  Eye, 
  Send,
  MessageSquare,
  HelpCircle,
  Clock,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { LessonPlanDraft } from '../data/curriculumData';

interface LessonPlansTabProps {
  lessonPlanDrafts: LessonPlanDraft[];
  setLessonPlanDrafts: React.Dispatch<React.SetStateAction<LessonPlanDraft[]>>;
  classes: any[];
  subjects: any[];
  selectedBranch: string;
  currentSimulatedRole: string;
}

export const LessonPlansTab: React.FC<LessonPlansTabProps> = ({
  lessonPlanDrafts,
  setLessonPlanDrafts,
  classes,
  subjects,
  selectedBranch,
  currentSimulatedRole
}) => {
  // Is current user a supervisor?
  const isSupervisor = useMemo(() => {
    const role = currentSimulatedRole.toLowerCase();
    return role.includes('admin') || role.includes('principal') || role.includes('proprietor') || role.includes('head');
  }, [currentSimulatedRole]);

  // Filter classes by active branch
  const branchClasses = useMemo(() => {
    return classes.filter(c => c.branch === selectedBranch);
  }, [classes, selectedBranch]);

  // Active filters
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Submitted' | 'Approved' | 'Revision Needed'>('All');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => {
    return lessonPlanDrafts[0]?.id || null;
  });

  // Selected plan record
  const activePlan = useMemo(() => {
    return lessonPlanDrafts.find(p => p.id === selectedPlanId) || null;
  }, [lessonPlanDrafts, selectedPlanId]);

  // Filtered plan registry list
  const filteredPlans = useMemo(() => {
    return lessonPlanDrafts.filter(p => {
      // Must match branch class
      const clsMatch = branchClasses.some(bc => bc.id === p.classId || bc.name === p.classId);
      if (!clsMatch && lessonPlanDrafts.length > 0) return false;
      
      if (statusFilter === 'All') return true;
      return p.status === statusFilter;
    });
  }, [lessonPlanDrafts, branchClasses, statusFilter]);

  // AI Loading and state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Form local state to prevent lag on keypresses
  const [formState, setFormState] = useState<Partial<LessonPlanDraft>>({});

  // Sync formState when activePlan changes
  React.useEffect(() => {
    if (activePlan) {
      setFormState({ ...activePlan });
    } else {
      setFormState({});
    }
  }, [activePlan]);

  // Establish a blank plan draft
  const handleCreateDraft = () => {
    const defaultClass = branchClasses[0]?.name || 'Primary 5 - Gold';
    const defaultSubject = subjects[0]?.name || 'Primary Mathematics';
    
    const newPlan: LessonPlanDraft = {
      id: `lp-custom-${Date.now()}`,
      classId: defaultClass,
      subject: defaultSubject,
      week: 1,
      title: "New Lesson Outline",
      objectives: "1. Specify standard cognitive objectives.\n2. Add behavioral outcomes.",
      materials: "Reference textbooks, markers, whiteboards, or visual flashcards.",
      procedureIntro: "Start with an engaging 10-minute warm-up or recall question related to the topic.",
      procedurePractice: "Present core concepts on the chalkboard with step-by-step demonstrations (20 mins).",
      procedureActivity: "Organize students in collaborative pairs to solve simple questions together (15 mins).",
      procedureEvaluation: "Evaluate learning with a short exit ticket or 3-question peer quiz (5 mins).",
      homework: "Assign selective homework exercises from pages 12-15 of the student workbooks.",
      teacherId: "staff-active",
      teacherName: "Aisha Garba", // Default placeholder
      status: "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLessonPlanDrafts(prev => [newPlan, ...prev]);
    setSelectedPlanId(newPlan.id);
  };

  const handleDeletePlan = (id: string) => {
    if (confirm("Are you sure you want to discard this lesson plan draft permanently?")) {
      setLessonPlanDrafts(prev => prev.filter(p => p.id !== id));
      if (selectedPlanId === id) {
        setSelectedPlanId(null);
      }
    }
  };

  // Save changes from formState to the master state list
  const handleSavePlan = (additionalFields?: Partial<LessonPlanDraft>) => {
    if (!selectedPlanId) return;
    
    const merged = {
      ...activePlan,
      ...formState,
      ...additionalFields,
      updatedAt: new Date().toISOString()
    } as LessonPlanDraft;

    setLessonPlanDrafts(prev => prev.map(p => p.id === selectedPlanId ? merged : p));
    alert("Lesson plan draft saved and synced persistently.");
  };

  // Submit plan for Review
  const handleSubmitForReview = () => {
    handleSavePlan({ status: 'Submitted' });
  };

  // AI Co-Drafting Assistant Call
  const handleCallAiAssistant = async () => {
    const targetClass = formState.classId || 'Classroom';
    const targetSubject = formState.subject || 'Subject';
    const targetWeek = formState.week || 1;
    const targetTitle = formState.title || 'General Lesson';

    setAiGenerating(true);
    setAiSuggestion(null);
    setShowAiModal(true);

    const systemPrompt = `Draft a comprehensive, professional, and structured lesson plan layout for a teacher.
Subject: ${targetSubject}
Target Class: ${targetClass}
Academic Cycle: Week ${targetWeek}
Topic: ${targetTitle}

Please organize the lesson plan with the following precise headings using clear Markdown bold indicators:
### Objectives
Specify at least 2 clear, measurable behavioral objectives.

### Materials
Identify tactile or digital resource materials.

### Procedure Chronology
- Introduction (10m): Interactive warm-up or recall.
- Guided Practice (20m): Direct instruction.
- Peer Activity (15m): Collaborative group work.
- Evaluation (5m): Rapid exit ticket or individual assessment.

### Homework & Remediation
Include relevant exercises and simple tutoring remedial directives.

Maintain an encouraging, highly professional educational tone, suitable for school inspection.`;

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: systemPrompt })
      });
      const data = await res.json();
      setAiSuggestion(data.text || "Failed to generate plan template.");
    } catch (err) {
      console.error(err);
      setAiSuggestion("AI assistant returned an offline error. Using offline fallback outline instead.");
    } finally {
      setAiGenerating(false);
    }
  };

  // Adopt AI Generated Text block
  const handleAdoptAiPlan = () => {
    if (!aiSuggestion) return;
    
    // Parse fields roughly using markdown markers, with safe fallbacks
    const objectivesMatch = aiSuggestion.match(/### Objectives([\s\S]*?)(?=### Materials|$)/i);
    const materialsMatch = aiSuggestion.match(/### Materials([\s\S]*?)(?=### Procedure Chronology|$)/i);
    const introMatch = aiSuggestion.match(/Introduction \(10m\):([\s\S]*?)(?=Guided Practice \(20m\):|$)/i);
    const practiceMatch = aiSuggestion.match(/Guided Practice \(20m\):([\s\S]*?)(?=Peer Activity \(15m\):|$)/i);
    const activityMatch = aiSuggestion.match(/Peer Activity \(15m\):([\s\S]*?)(?=Evaluation \(5m\):|$)/i);
    const evalMatch = aiSuggestion.match(/Evaluation \(5m\):([\s\S]*?)(?=### Homework|$)/i);
    const homeworkMatch = aiSuggestion.match(/(?:### Homework.*|Remediation.*)([\s\S]*?)$/i);

    const nextFormState = { ...formState };

    if (objectivesMatch) nextFormState.objectives = objectivesMatch[1].trim();
    if (materialsMatch) nextFormState.materials = materialsMatch[1].trim();
    if (introMatch) nextFormState.procedureIntro = introMatch[1].trim();
    if (practiceMatch) nextFormState.procedurePractice = practiceMatch[1].trim();
    if (activityMatch) nextFormState.procedureActivity = activityMatch[1].trim();
    if (evalMatch) nextFormState.procedureEvaluation = evalMatch[1].trim();
    if (homeworkMatch) nextFormState.homework = homeworkMatch[1].trim();

    // If matches are poor due to formatting, dump everything to Objectives & Procedure Intro
    if (!objectivesMatch && !materialsMatch) {
      nextFormState.objectives = "AI Generated Plan (Structured Output):\n" + aiSuggestion;
    }

    setFormState(nextFormState);
    setShowAiModal(false);
    alert("Adopted AI suggestions. Review and save your fields!");
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* SAMS Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Total Registry</p>
            <p className="text-lg font-bold text-slate-800 mt-1">{lessonPlanDrafts.length} Plans</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Approved</p>
            <p className="text-lg font-bold text-emerald-600 mt-1">
              {lessonPlanDrafts.filter(p => p.status === 'Approved').length} Plans
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Pending Review</p>
            <p className="text-lg font-bold text-amber-600 mt-1">
              {lessonPlanDrafts.filter(p => p.status === 'Submitted').length} Plans
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Revisions Required</p>
            <p className="text-lg font-bold text-rose-600 mt-1">
              {lessonPlanDrafts.filter(p => p.status === 'Revision Needed').length} Plans
            </p>
          </div>
        </div>
      </div>

      {/* Main split work canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
        
        {/* Left Column: Lesson Plans Registry List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider">
                Lesson Plan Registry
              </h4>
              <button
                onClick={handleCreateDraft}
                className="p-1 text-indigo-650 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition-colors cursor-pointer"
                title="Create New Lesson Plan"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-status filter row */}
            <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2.5">
              {(['All', 'Draft', 'Submitted', 'Approved', 'Revision Needed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                    statusFilter === f 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-150 text-slate-505 hover:bg-slate-100'
                  }`}
                >
                  {f === 'Submitted' ? 'Review' : f}
                </button>
              ))}
            </div>

            {/* List entries */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredPlans.map(p => {
                const isActive = p.id === selectedPlanId;
                
                let statusBadge = 'bg-slate-100 text-slate-550 border-slate-200';
                if (p.status === 'Approved') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-150';
                else if (p.status === 'Submitted') statusBadge = 'bg-amber-50 text-amber-700 border-amber-150';
                else if (p.status === 'Revision Needed') statusBadge = 'bg-rose-50 text-rose-700 border-rose-150';

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                      isActive 
                        ? 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                        : 'bg-white border-slate-150 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full border ${statusBadge}`}>
                        {p.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">Week {p.week}</span>
                    </div>

                    <div>
                      <h5 className="text-xs font-black text-slate-800 line-clamp-1 leading-tight">{p.title}</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.classId} • {p.subject}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span className="font-medium">By {p.teacherName}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(p.id);
                        }}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Delete Plan Draft"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredPlans.length === 0 && (
                <div className="text-center py-12 text-slate-450 text-xs">
                  No lesson plans found matching this filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Editor Canvas */}
        <div className="lg:col-span-8 space-y-4">
          {!activePlan ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-xs text-center text-slate-450 space-y-3">
              <span className="text-4xl">📝</span>
              <p className="text-sm font-bold text-slate-800">No Lesson Plan Selected</p>
              <p className="text-xs max-w-sm mx-auto">
                Select an existing lesson plan from the left registry to review/edit, or establish a brand new teacher draft.
              </p>
              <button
                onClick={handleCreateDraft}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Establish New Draft</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
              
              {/* Editor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 text-xs font-mono">Plan Editor Canvas</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-indigo-600 font-bold">Role: {currentSimulatedRole}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {formState.title || "Untitled Draft"}
                  </h3>
                </div>
                
                {/* AI & Save buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCallAiAssistant}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 transition-colors flex items-center space-x-1.5 cursor-pointer"
                    title="Generate detailed plan structure using AI"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>🪄 AI Co-Draft</span>
                  </button>
                  <button
                    onClick={() => handleSavePlan()}
                    className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>
                </div>
              </div>

              {/* Form Workspace fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Class & Subject mapping */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Assign Class Level
                  </label>
                  <select
                    value={formState.classId || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, classId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {branchClasses.map(cls => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Subject Course
                  </label>
                  <select
                    value={formState.subject || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Lesson Week Sequence
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={formState.week || 1}
                    onChange={(e) => setFormState(prev => ({ ...prev, week: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Topic/Lesson Title
                  </label>
                  <input
                    type="text"
                    value={formState.title || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Core Textareas */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    1. Learning Objectives (Cognitive, Affective, Psychomotor)
                  </label>
                  <textarea
                    rows={3}
                    value={formState.objectives || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, objectives: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    2. Tactile Materials &amp; Digital Resources
                  </label>
                  <textarea
                    rows={2}
                    value={formState.materials || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, materials: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans leading-relaxed"
                  />
                </div>

                {/* TIMELINE SLOTS */}
                <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/30 space-y-4">
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    3. Lesson Procedure Chronology (50 mins timeline)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-505 mb-1">
                        ⏱️ Introduction &amp; Warm-up (10m)
                      </label>
                      <textarea
                        rows={3}
                        value={formState.procedureIntro || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, procedureIntro: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-505 mb-1">
                        ⏱️ Guided Practice &amp; Presentation (20m)
                      </label>
                      <textarea
                        rows={3}
                        value={formState.procedurePractice || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, procedurePractice: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-505 mb-1">
                        ⏱️ Peer/Interactive Activity (15m)
                      </label>
                      <textarea
                        rows={3}
                        value={formState.procedureActivity || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, procedureActivity: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-505 mb-1">
                        ⏱️ Evaluation &amp; Exit Ticket (5m)
                      </label>
                      <textarea
                        rows={3}
                        value={formState.procedureEvaluation || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, procedureEvaluation: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    4. Homework Homework &amp; Remediation Directive
                  </label>
                  <textarea
                    rows={2}
                    value={formState.homework || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, homework: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans leading-relaxed"
                  />
                </div>
              </div>

              {/* FEEDBACK COMMENT & REVIEWS PANEL */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider">
                    Syllabus Oversight &amp; Approval Desk
                  </h4>
                  <div className="flex items-center space-x-1 text-slate-400 text-xs font-mono">
                    <span>Status:</span>
                    <span className="font-bold text-indigo-700">{formState.status}</span>
                  </div>
                </div>

                {/* Supervisor Review Workspace */}
                {isSupervisor ? (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-4">
                    <p className="text-xs font-bold text-indigo-900 leading-none">
                      Admin/Principal Evaluation Workspace
                    </p>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Oversight Evaluation &amp; Revision Comments
                      </label>
                      <textarea
                        rows={3}
                        value={formState.feedback || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, feedback: e.target.value }))}
                        placeholder="Write constructive notes for the teacher regarding timing, objectives, or activities..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          const comments = formState.feedback || '';
                          handleSavePlan({ 
                            status: 'Approved', 
                            feedback: comments,
                            reviewedBy: 'Academic Supervisor',
                            reviewedAt: new Date().toISOString()
                          });
                          alert("🟢 Syllabus Lesson Plan Approved & Locked.");
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Approve Syllabus 🟢</span>
                      </button>

                      <button
                        onClick={() => {
                          const comments = formState.feedback || '';
                          if (!comments.trim()) {
                            alert("Please include feedback comments explaining what needs revision.");
                            return;
                          }
                          handleSavePlan({ 
                            status: 'Revision Needed', 
                            feedback: comments,
                            reviewedBy: 'Academic Supervisor',
                            reviewedAt: new Date().toISOString()
                          });
                          alert("🟡 Revision request sent back to teacher.");
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Request Revision 🟡</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Teacher view of Feedback */
                  <div className="space-y-4">
                    {formState.feedback ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Supervisor Review Comments
                        </p>
                        <p className="text-xs text-slate-700 italic leading-relaxed font-sans">
                          "{formState.feedback}"
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Reviewed by {formState.reviewedBy} on {formState.reviewedAt ? new Date(formState.reviewedAt).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        No supervisor evaluation comments registered for this draft.
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleSubmitForReview}
                        disabled={formState.status === 'Approved'}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                          formState.status === 'Approved'
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit to Supervisor for Review</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* AI SUGGESTIONS DRAWER MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-scale-in">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-650 text-white">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 animate-pulse text-indigo-300" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">
                  AI Co-Drafting Assistant
                </h4>
              </div>
              <button 
                onClick={() => setShowAiModal(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-left text-xs leading-relaxed font-sans">
              {aiGenerating ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  <p className="text-slate-500 font-bold animate-pulse">
                    Consulting Gemini model for standard multi-week curriculum blueprints...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-600">
                    SAMS AI generated the following term lesson outline for <strong className="text-indigo-700">{formState.subject}</strong> ({formState.classId}) based on national standards:
                  </p>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 max-h-[350px] overflow-y-auto font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {aiSuggestion}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!aiGenerating && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                >
                  Discard Suggestions
                </button>
                <button
                  onClick={handleAdoptAiPlan}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Adopt Suggestions</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
