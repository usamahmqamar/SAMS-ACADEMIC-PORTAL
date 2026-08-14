import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Plus, 
  RotateCcw, 
  Trash2, 
  Save, 
  Check, 
  TrendingUp, 
  BookOpen, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { WeeklyMilestone, defaultChecklists } from '../data/curriculumData';

interface CurriculumChecklistTabProps {
  curriculumChecklists: Record<string, WeeklyMilestone[]>;
  setCurriculumChecklists: React.Dispatch<React.SetStateAction<Record<string, WeeklyMilestone[]>>>;
  classes: any[];
  subjects: any[];
  selectedBranch: string;
}

export const CurriculumChecklistTab: React.FC<CurriculumChecklistTabProps> = ({
  curriculumChecklists,
  setCurriculumChecklists,
  classes,
  subjects,
  selectedBranch
}) => {
  // Filter classes by active branch
  const branchClasses = useMemo(() => {
    return classes.filter(c => c.branch === selectedBranch);
  }, [classes, selectedBranch]);

  // Set default active class & subject
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return branchClasses[0]?.id || '';
  });

  const selectedClass = useMemo(() => {
    return branchClasses.find(c => c.id === selectedClassId) || branchClasses[0] || null;
  }, [branchClasses, selectedClassId]);

  // Filter subjects based on class level if class selected, otherwise show all
  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return subjects;
    return subjects.filter(sub => sub.level === selectedClass.level);
  }, [selectedClass, subjects]);

  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(() => {
    return filteredSubjects[0]?.name || '';
  });

  // Unique identifier for the checklist map
  const checklistKey = useMemo(() => {
    if (!selectedClass || !selectedSubjectName) return 'default-key';
    return `${selectedClass.id}-${selectedSubjectName}`;
  }, [selectedClass, selectedSubjectName]);

  // Resolve current milestones list or fallback/initialize
  const currentMilestones = useMemo(() => {
    if (curriculumChecklists[checklistKey]) {
      return curriculumChecklists[checklistKey];
    }
    
    // Attempt to match default checklists based on subject name keywords
    const subLower = selectedSubjectName.toLowerCase();
    let matchKey = '';
    if (subLower.includes('math') || subLower.includes('arithmetic')) {
      matchKey = 'Primary Mathematics';
    } else if (subLower.includes('sci') || subLower.includes('nature') || subLower.includes('int')) {
      matchKey = 'Junior Secondary Science';
    } else if (subLower.includes('lit') || subLower.includes('english') || subLower.includes('read') || subLower.includes('phon')) {
      matchKey = 'Nursery Literacy';
    }

    if (matchKey && defaultChecklists[matchKey]) {
      return defaultChecklists[matchKey];
    }

    // Default empty 10-week checklist
    const emptyChecklist: WeeklyMilestone[] = Array.from({ length: 10 }, (_, i) => ({
      week: i + 1,
      topic: `Topic Outline for Week ${i + 1}`,
      objectives: `Understand foundational principles, practical examples, and complete classwork.`,
      status: 'Not Started'
    }));
    return emptyChecklist;
  }, [curriculumChecklists, checklistKey, selectedSubjectName]);

  // Sync back if it doesn't exist yet
  React.useEffect(() => {
    if (checklistKey !== 'default-key' && !curriculumChecklists[checklistKey]) {
      setCurriculumChecklists(prev => ({
        ...prev,
        [checklistKey]: currentMilestones
      }));
    }
  }, [checklistKey, currentMilestones, curriculumChecklists, setCurriculumChecklists]);

  // Calculations for progress meters
  const stats = useMemo(() => {
    const total = currentMilestones.length;
    if (total === 0) return { pctCompleted: 0, pctInProgress: 0, pctNotStarted: 0, total, completedCount: 0 };
    const completedCount = currentMilestones.filter(m => m.status === 'Completed').length;
    const inProgressCount = currentMilestones.filter(m => m.status === 'In Progress').length;
    const notStartedCount = currentMilestones.filter(m => m.status === 'Not Started').length;

    return {
      total,
      completedCount,
      pctCompleted: Math.round((completedCount / total) * 100),
      pctInProgress: Math.round((inProgressCount / total) * 100),
      pctNotStarted: Math.round((notStartedCount / total) * 100)
    };
  }, [currentMilestones]);

  // Handlers for checklist item changes
  const updateMilestone = (weekNum: number, fields: Partial<WeeklyMilestone>) => {
    const updated = currentMilestones.map(m => {
      if (m.week === weekNum) {
        const next = { ...m, ...fields };
        // If status changes to Completed, append date
        if (fields.status === 'Completed' && m.status !== 'Completed') {
          next.completedDate = new Date().toISOString().split('T')[0];
        } else if (fields.status && fields.status !== 'Completed') {
          delete next.completedDate;
        }
        return next;
      }
      return m;
    });

    setCurriculumChecklists(prev => ({
      ...prev,
      [checklistKey]: updated
    }));
  };

  const addWeek = () => {
    const nextWeek = currentMilestones.length > 0 
      ? Math.max(...currentMilestones.map(m => m.week)) + 1 
      : 1;
    const newWeek: WeeklyMilestone = {
      week: nextWeek,
      topic: `Topic Outline for Week ${nextWeek}`,
      objectives: `Outline weekly learning outcomes and tactile homework materials.`,
      status: 'Not Started'
    };

    setCurriculumChecklists(prev => ({
      ...prev,
      [checklistKey]: [...currentMilestones, newWeek]
    }));
  };

  const deleteWeek = (weekNum: number) => {
    const filtered = currentMilestones.filter(m => m.week !== weekNum);
    // Renumber weeks to be sequential
    const renumbered = filtered.map((m, idx) => ({
      ...m,
      week: idx + 1
    }));

    setCurriculumChecklists(prev => ({
      ...prev,
      [checklistKey]: renumbered
    }));
  };

  const handleResetChecklist = () => {
    if (confirm("Are you sure you want to revert this syllabus checklist to its standardized template blueprint? All local edits for this class + subject will be refreshed.")) {
      const subLower = selectedSubjectName.toLowerCase();
      let matchKey = '';
      if (subLower.includes('math') || subLower.includes('arithmetic')) {
        matchKey = 'Primary Mathematics';
      } else if (subLower.includes('sci') || subLower.includes('nature') || subLower.includes('int')) {
        matchKey = 'Junior Secondary Science';
      } else if (subLower.includes('lit') || subLower.includes('english') || subLower.includes('read') || subLower.includes('phon')) {
        matchKey = 'Nursery Literacy';
      }

      const template = matchKey && defaultChecklists[matchKey] 
        ? defaultChecklists[matchKey]
        : Array.from({ length: 10 }, (_, i) => ({
            week: i + 1,
            topic: `Topic Outline for Week ${i + 1}`,
            objectives: `Understand foundational principles, practical examples, and complete classwork.`,
            status: 'Not Started' as const
          }));

      setCurriculumChecklists(prev => ({
        ...prev,
        [checklistKey]: template
      }));
    }
  };

  const handleMarkAllComplete = () => {
    const updated = currentMilestones.map(m => ({
      ...m,
      status: 'Completed' as const,
      completedDate: new Date().toISOString().split('T')[0]
    }));
    setCurriculumChecklists(prev => ({
      ...prev,
      [checklistKey]: updated
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Dynamic Header & Selectors Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Multi-Week Syllabus Progression Dashboard</span>
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Select an active class level and subject course to regulate weekly progress tracking, milestones compliance, and lesson syllabus checklists.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetChecklist}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold border border-slate-200 transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Template</span>
            </button>
            <button
              onClick={handleMarkAllComplete}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold border border-indigo-100 transition-colors flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark All Completed</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {/* Class Selector */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Active Class Section
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const cls = branchClasses.find(c => c.id === e.target.value);
                if (cls) {
                  // auto select first subject for that level
                  const matchingSubs = subjects.filter(s => s.level === cls.level);
                  if (matchingSubs.length > 0) {
                    setSelectedSubjectName(matchingSubs[0].name);
                  }
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {branchClasses.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.level.toUpperCase()})
                </option>
              ))}
              {branchClasses.length === 0 && (
                <option value="">No Classes in this Campus</option>
              )}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Active Course Subject
            </label>
            <select
              value={selectedSubjectName}
              onChange={(e) => setSelectedSubjectName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {filteredSubjects.map(sub => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
              {filteredSubjects.length === 0 && (
                <option value="">No Subjects Registered</option>
              )}
            </select>
          </div>

          {/* Core Info Display */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center space-x-3">
            <span className="text-xl">📊</span>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Curriculum Level</p>
              <p className="text-xs font-bold text-slate-800 capitalize mt-1">
                {selectedClass?.level || 'N/A'} Wing Syllabus
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Stats in Sidebar & Checklists Timeline in Main */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Left: Progression Progress Meters */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
            <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider">
              Syllabus Coverage Progress
            </h4>
            
            {/* Round Visual Indicator */}
            <div className="relative flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-3xl font-black text-indigo-650 font-mono">
                {stats.pctCompleted}%
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Completed
              </div>
              <p className="text-[11px] text-slate-500 text-center px-4 mt-3">
                {stats.completedCount} out of {stats.total} weekly milestones marked completed.
              </p>
            </div>

            {/* Split Progress Bars */}
            <div className="space-y-3 font-sans">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>🟢 Completed</span>
                  <span>{stats.pctCompleted}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${stats.pctCompleted}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>🟡 In Progress</span>
                  <span>{stats.pctInProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${stats.pctInProgress}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>⚪ Not Started</span>
                  <span>{stats.pctNotStarted}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-300 h-full transition-all duration-500" style={{ width: `${stats.pctNotStarted}%` }} />
                </div>
              </div>
            </div>

            {/* Next Milestone Quick Box */}
            {(() => {
              const activeWeek = currentMilestones.find(m => m.status === 'In Progress');
              const nextNotStarted = currentMilestones.find(m => m.status === 'Not Started');
              const target = activeWeek || nextNotStarted;
              
              return target ? (
                <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100/50 space-y-2">
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 uppercase font-extrabold px-2 py-0.5 rounded-full">
                    Active Milestone
                  </span>
                  <p className="text-xs font-bold text-indigo-900 mt-1">
                    Week {target.week}: {target.topic}
                  </p>
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    {target.objectives}
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-1">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 uppercase font-extrabold px-2 py-0.5 rounded-full">
                    Syllabus Completed
                  </span>
                  <p className="text-xs font-bold text-emerald-900 mt-1">
                    100% Term Ready!
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    All planned curriculum weeks are successfully delivered.
                  </p>
                </div>
              );
            })()}

            <button
              onClick={addWeek}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Week Milestone</span>
            </button>
          </div>

          {/* Info note */}
          <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl flex items-start space-x-3 text-xs text-amber-800 leading-relaxed">
            <span className="text-base shrink-0">💡</span>
            <div>
              <strong>Compliance Oversight Notice:</strong> School administrators can monitor syllabus completion rates here. Teachers should update these weekly targets to ensure compliance with the ministry's standardized curriculum requirements.
            </div>
          </div>
        </div>

        {/* Checklists Timeline - Right Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider">
                Weekly Checklist Timeline
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentMilestones.length} Milestones Scheduled
              </span>
            </div>

            {currentMilestones.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <p className="text-sm font-semibold">No syllabus objectives scheduled yet.</p>
                <p className="text-xs">Click the button below to add your first week milestone.</p>
                <button
                  onClick={addWeek}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl font-bold inline-flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Week 1</span>
                </button>
              </div>
            ) : (
              <div className="relative border-l border-slate-100 pl-4 space-y-6 pt-2 pb-2">
                {currentMilestones.map((m) => {
                  let badgeBg = 'bg-slate-100 text-slate-400';
                  let borderCol = 'border-slate-100';
                  let icon = <span className="text-[10px] font-bold font-mono">{m.week}</span>;

                  if (m.status === 'Completed') {
                    badgeBg = 'bg-emerald-50 text-emerald-600';
                    borderCol = 'border-emerald-200';
                    icon = <Check className="w-3.5 h-3.5" />;
                  } else if (m.status === 'In Progress') {
                    badgeBg = 'bg-amber-50 text-amber-600 ring-2 ring-amber-100 animate-pulse';
                    borderCol = 'border-amber-200';
                  }

                  return (
                    <div key={m.week} className="relative group">
                      
                      {/* Left circular marker */}
                      <span className={`absolute -left-[27px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full border ${badgeBg} ${borderCol} z-10 font-bold shadow-xs`}>
                        {icon}
                      </span>

                      {/* Content Card */}
                      <div className="bg-slate-50/55 hover:bg-slate-50 border border-slate-150 rounded-2xl p-4 transition-all duration-200 grid grid-cols-1 md:grid-cols-12 gap-4">
                        
                        {/* Middle Info */}
                        <div className="md:col-span-8 space-y-3">
                          {/* Topic Input */}
                          <div>
                            <input
                              type="text"
                              value={m.topic}
                              onChange={(e) => updateMilestone(m.week, { topic: e.target.value })}
                              placeholder="Topic outline title..."
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800 py-0.5"
                            />
                          </div>

                          {/* Objectives Input */}
                          <div>
                            <textarea
                              rows={2}
                              value={m.objectives}
                              onChange={(e) => updateMilestone(m.week, { objectives: e.target.value })}
                              placeholder="Syllabus learning objectives..."
                              className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-300 rounded-lg p-1.5 text-[11px] text-slate-600 focus:outline-none leading-relaxed resize-none"
                            />
                          </div>

                          {/* Date finished display */}
                          {m.status === 'Completed' && m.completedDate && (
                            <div className="flex items-center space-x-1.5 text-[10px] text-emerald-600 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed on {m.completedDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Status dropdown & operations */}
                        <div className="md:col-span-4 flex flex-col justify-between items-end gap-3 md:border-l md:border-slate-150 md:pl-4">
                          <div className="w-full">
                            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">
                              Milestone Status
                            </label>
                            <select
                              value={m.status}
                              onChange={(e) => updateMilestone(m.week, { status: e.target.value as any })}
                              className={`w-full text-xs font-bold px-2 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                                m.status === 'Completed' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                  : m.status === 'In Progress'
                                    ? 'bg-amber-50 text-amber-700 border-amber-250'
                                    : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => deleteWeek(m.week)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Milestone Week"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
