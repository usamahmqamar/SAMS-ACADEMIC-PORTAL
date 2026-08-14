import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';
import Toast from './Toast';

interface Section {
  id: string;
  name: string;
  description: string;
  branch: string;
  session: string;
  createdAt: string;
  updatedAt?: string;
}

interface Class {
  id: string;
  name: string;
  level: string; // 'nursery' | 'primary' | 'secondary' | 'islamia'
  branch: string;
  subjects: string[];
  sectionId?: string;
  createdAt?: string;
}

interface AcademicSession {
  id: string;
  name: string;
  status: string;
}

export default function SectionsClassesManagement() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  // Database States
  const [sections, setSections] = useState<Section[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Pane Selection: 'sections' or 'classes'
  const [activePane, setActivePane] = useState<'sections' | 'classes'>('sections');

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedSession, setSelectedSession] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  // Section Modal States
  const [isSectionModalOpen, setIsSectionModalOpen] = useState<boolean>(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionName, setSectionName] = useState<string>('');
  const [sectionDescription, setSectionDescription] = useState<string>('');
  const [sectionBranch, setSectionBranch] = useState<string>('GN');
  const [sectionSession, setSectionSession] = useState<string>('');
  const [sectionFormError, setSectionFormError] = useState<string | null>(null);

  // Class Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [className, setClassName] = useState<string>('');
  const [classLevel, setClassLevel] = useState<string>('primary');
  const [classBranch, setClassBranch] = useState<string>('GN');
  const [classSectionId, setClassSectionId] = useState<string>('');
  const [classSubjectInput, setClassSubjectInput] = useState<string>('');
  const [classSubjects, setClassSubjects] = useState<string[]>([]);
  const [classFormError, setClassFormError] = useState<string | null>(null);

  // Fetch all state
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [secRes, classRes, sessRes] = await Promise.all([
        fetch('/api/sections'),
        fetch('/api/classes'),
        fetch('/api/academic-sessions')
      ]);

      if (!secRes.ok || !classRes.ok) {
        throw new Error('Failed to retrieve school structure details.');
      }

      const secData = await secRes.json();
      const classData = await classRes.json();
      const sessData = sessRes.ok ? await sessRes.json() : [];

      setSections(secData);
      setClasses(classData);
      setSessions(sessData);

      // Default the active session if available
      if (sessData.length > 0 && !sectionSession) {
        const active = sessData.find((s: any) => s.status === 'active') || sessData[0];
        setSectionSession(active.id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while loading Section and Class ledgers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Section CRUD Handlers
  const openCreateSection = () => {
    setEditingSection(null);
    setSectionName('');
    setSectionDescription('');
    setSectionBranch('GN');
    const active = sessions.find(s => s.status === 'active') || sessions[0];
    setSectionSession(active?.id || 'ses-2026');
    setSectionFormError(null);
    setIsSectionModalOpen(true);
  };

  const openEditSection = (sec: Section) => {
    setEditingSection(sec);
    setSectionName(sec.name);
    setSectionDescription(sec.description);
    setSectionBranch(sec.branch);
    setSectionSession(sec.session);
    setSectionFormError(null);
    setIsSectionModalOpen(true);
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSectionFormError(null);

    if (!sectionName.trim()) {
      setSectionFormError('Section Name is required.');
      return;
    }

    const b = sectionBranch || 'GN';
    const s = sectionSession || 'ses-2026';

    const duplicate = sections.some(
      sec => (!editingSection || sec.id !== editingSection.id) &&
      sec.name.trim().toLowerCase() === sectionName.trim().toLowerCase() &&
      sec.branch === b &&
      sec.session === s
    );

    if (duplicate) {
      setSectionFormError(`A section named "${sectionName}" already exists for this campus branch and session.`);
      return;
    }

    try {
      const payload = {
        name: sectionName.trim(),
        description: sectionDescription.trim(),
        branch: b,
        session: s
      };

      const url = editingSection ? `/api/sections/${editingSection.id}` : '/api/sections';
      const method = editingSection ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Validation failed.');
      }

      await fetchData();
      setIsSectionModalOpen(false);
    } catch (err: any) {
      setSectionFormError(err.message || 'Error saving Section.');
    }
  };

  const handleDeleteSection = async (sec: Section) => {
    const assignedClasses = classes.filter(c => c.sectionId === sec.id);
    if (assignedClasses.length > 0) {
      setToast({
        message: `Cannot delete section "${sec.name}" because it contains ${assignedClasses.length} active classes (e.g. ${assignedClasses[0].name}). Reassign or delete them first.`,
        type: 'warning'
      });
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete the section "${sec.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/sections/${sec.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove section.');
      }
      await fetchData();
      setToast({ message: `Section "${sec.name}" removed successfully.`, type: 'info' });
    } catch (err: any) {
      setToast({ message: err.message || 'Error deleting section.', type: 'error' });
    }
  };

  // Class CRUD Handlers
  const openCreateClass = () => {
    setEditingClass(null);
    setClassName('');
    setClassLevel('primary');
    setClassBranch('GN');
    setClassSectionId(sections[0]?.id || '');
    setClassSubjects([]);
    setClassSubjectInput('');
    setClassFormError(null);
    setIsClassModalOpen(true);
  };

  const openEditClass = (cls: Class) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setClassLevel(cls.level || 'primary');
    setClassBranch(cls.branch || 'GN');
    setClassSectionId(cls.sectionId || '');
    setClassSubjects(cls.subjects || []);
    setClassSubjectInput('');
    setClassFormError(null);
    setIsClassModalOpen(true);
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassFormError(null);

    if (!className.trim()) {
      setClassFormError('Class Name is required.');
      return;
    }

    if (!classSectionId) {
      setClassFormError('Please assign this class to a Section.');
      return;
    }

    const duplicate = classes.some(
      c => (!editingClass || c.id !== editingClass.id) &&
      c.name.trim().toLowerCase() === className.trim().toLowerCase() &&
      c.branch === classBranch
    );

    if (duplicate) {
      setClassFormError(`A class named "${className}" already exists on the selected branch.`);
      return;
    }

    try {
      const payload = {
        name: className.trim(),
        level: classLevel,
        branch: classBranch,
        sectionId: classSectionId,
        subjects: classSubjects
      };

      const url = editingClass ? `/api/classes/${editingClass.id}` : '/api/classes';
      const method = editingClass ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Validation failed.');
      }

      await fetchData();
      setIsClassModalOpen(false);
    } catch (err: any) {
      setClassFormError(err.message || 'Error saving Class.');
    }
  };

  const handleDeleteClass = async (cls: Class) => {
    if (!confirm(`Are you sure you want to permanently delete the class "${cls.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/classes/${cls.id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete class.');
      }
      await fetchData();
      setToast({ message: `Class "${cls.name}" deleted successfully.`, type: 'info' });
    } catch (err: any) {
      setToast({ message: err.message || 'Error discarding class.', type: 'error' });
    }
  };

  // Subject helpers inside modal
  const handleAddSubject = () => {
    const trimmed = classSubjectInput.trim();
    if (trimmed && !classSubjects.includes(trimmed)) {
      setClassSubjects([...classSubjects, trimmed]);
      setClassSubjectInput('');
    }
  };

  const handleRemoveSubject = (sub: string) => {
    setClassSubjects(classSubjects.filter(s => s !== sub));
  };

  // Helper mappings
  const sectionsMap = useMemo(() => {
    const map: Record<string, Section> = {};
    sections.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [sections]);

  const sessionsMap = useMemo(() => {
    const map: Record<string, string> = {};
    sessions.forEach(s => {
      map[s.id] = s.name;
    });
    return map;
  }, [sessions]);

  // Filter & Search Logic
  const filteredSections = useMemo(() => {
    return sections.filter(sec => {
      const matchesSearch = 
        sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBranch = selectedBranch === 'All' || sec.branch === selectedBranch;
      const matchesSession = selectedSession === 'All' || sec.session === selectedSession;

      return matchesSearch && matchesBranch && matchesSession;
    });
  }, [sections, searchQuery, selectedBranch, selectedSession]);

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const parentSection = sectionsMap[cls.sectionId || ''];
      const matchesSearch = 
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (parentSection?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBranch = selectedBranch === 'All' || cls.branch === selectedBranch;
      const matchesSection = selectedSection === 'All' || cls.sectionId === selectedSection;

      return matchesSearch && matchesBranch && matchesSection;
    });
  }, [classes, searchQuery, selectedBranch, selectedSection, sectionsMap]);

  // SAMS standard level labels
  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'nursery': return 'Nursery';
      case 'primary': return 'Primary';
      case 'secondary': return 'Junior Secondary';
      case 'islamia': return 'Islamia';
      default: return level;
    }
  };

  // Metrics
  const sectionsCount = sections.length;
  const classesCount = classes.length;
  const gnCount = classes.filter(c => c.branch === 'GN').length;
  const rsCount = classes.filter(c => c.branch === 'RS').length;

  if (loading) {
    return (
      <div id="section-class-loader" className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-xs font-semibold">Gathering school sections and classrooms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div id="section-class-error" className="bg-rose-50 border border-rose-100 rounded-xl p-5 text-center text-rose-800">
        <Lucide.ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <p className="text-xs font-bold">{error}</p>
        <button onClick={fetchData} className="mt-3 text-xs text-indigo-600 font-bold underline">Retry loading</button>
      </div>
    );
  }

  return (
    <div id="section-class-workspace" className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Lucide.School className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sections</span>
            <span className="text-lg font-black text-slate-800">{sectionsCount} Sections</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Lucide.Presentation className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Classes</span>
            <span className="text-lg font-black text-slate-800">{classesCount} Classes</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Lucide.MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gwarinpa (GN)</span>
            <span className="text-lg font-black text-slate-800">{gnCount} Rooms</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
            <Lucide.Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Road Safety (RS)</span>
            <span className="text-lg font-black text-slate-800">{rsCount} Rooms</span>
          </div>
        </div>
      </div>

      {/* Pane Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setActivePane('sections'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activePane === 'sections' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lucide.Layers className="w-3.5 h-3.5" />
            Manage Sections
          </button>
          <button
            onClick={() => { setActivePane('classes'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activePane === 'classes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lucide.GraduationCap className="w-3.5 h-3.5" />
            Manage Classes
          </button>
        </div>

        <div>
          {activePane === 'sections' ? (
            <button
              onClick={openCreateSection}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lucide.Plus className="w-4 h-4" />
              Create Section
            </button>
          ) : (
            <button
              onClick={openCreateClass}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lucide.Plus className="w-4 h-4" />
              Register Class
            </button>
          )}
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        
        {/* Search & Filtration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
          <div className="relative sm:col-span-2">
            <Lucide.Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={activePane === 'sections' ? "Search sections by name, remarks..." : "Search classes by name, section..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-medium text-slate-700 placeholder-slate-400 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="All">All Branches</option>
              <option value="GN">Gwarinpa Campus (GN)</option>
              <option value="RS">Road Safety Campus (RS)</option>
            </select>
          </div>

          {activePane === 'sections' ? (
            <div>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="All">All Sessions</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="All">All Sections</option>
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>{sec.name} ({sec.branch})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content Renderers */}
        {activePane === 'sections' ? (
          /* SECTIONS PANELS GRID */
          filteredSections.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Lucide.Layers className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
              <p className="text-xs font-bold">No sections found.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click "Create Section" to register standard sections: Nursery, Primary, Junior Secondary, Islamia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSections.map(sec => {
                const assigned = classes.filter(c => c.sectionId === sec.id);
                return (
                  <div key={sec.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/40 hover:bg-white hover:shadow-xs transition-all space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-wide">
                            {sec.branch === 'RS' ? 'Road Safety' : 'Gwarinpa'}
                          </span>
                          <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase">
                            {sessionsMap[sec.session] || '2025/2026 Academic Year'}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 pt-1">{sec.name} Section</h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditSection(sec)}
                          className="p-1.5 bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors cursor-pointer"
                          title="Edit section"
                        >
                          <Lucide.Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sec)}
                          className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="Delete section"
                        >
                          <Lucide.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-normal">{sec.description || 'No detailed description provided.'}</p>

                    <div className="pt-2 border-t border-slate-150 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Lucide.Notebook className="w-3.5 h-3.5 text-indigo-500" />
                        {assigned.length} Classes assigned
                      </span>
                      {assigned.length > 0 && (
                        <span className="text-slate-400 truncate max-w-[200px]" title={assigned.map(a => a.name).join(', ')}>
                          Classes: {assigned.map(a => a.name).slice(0, 3).join(', ')} {assigned.length > 3 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* CLASSES PANELS GRID */
          filteredClasses.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Lucide.GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
              <p className="text-xs font-bold">No classes found.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click "Register Class" to establish a classroom inside Nursery, Primary, Junior Secondary, or Islamia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClasses.map(cls => {
                const parentSection = sectionsMap[cls.sectionId || ''];
                return (
                  <div key={cls.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/40 hover:bg-white hover:shadow-xs transition-all space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] bg-emerald-50 border border-emerald-150 text-emerald-700 px-2 py-0.5 rounded font-black uppercase tracking-wide">
                            {parentSection?.name || getLevelLabel(cls.level)} Section
                          </span>
                          <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-semibold uppercase">
                            {cls.branch === 'RS' ? 'Road Safety' : 'Gwarinpa'}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 pt-1">{cls.name}</h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditClass(cls)}
                          className="p-1.5 bg-white hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          title="Edit class settings"
                        >
                          <Lucide.Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls)}
                          className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="Delete class"
                        >
                          <Lucide.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {cls.subjects && cls.subjects.length > 0 ? (
                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide">Academic Subjects</span>
                        <div className="flex flex-wrap gap-1">
                          {cls.subjects.map((sub, i) => (
                            <span key={i} className="text-[9px] bg-slate-100 text-slate-600 border border-slate-150 px-2 py-0.5 rounded-md font-medium">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No academic subject courses registered yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

      </div>

      {/* MODALS */}
      <AnimatePresence>
        {/* Section Modal */}
        {isSectionModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Lucide.Layers className="w-4 h-4 text-indigo-600" />
                  {editingSection ? 'Modify Section Info' : 'Establish School Section'}
                </h4>
                <button 
                  onClick={() => setIsSectionModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSectionSubmit} className="space-y-4">
                {sectionFormError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-bold flex items-center gap-2">
                    <Lucide.AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{sectionFormError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Section Name *</label>
                  <select
                    required
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  >
                    <option value="">Select standard name...</option>
                    <option value="Nursery">Nursery</option>
                    <option value="Primary">Primary</option>
                    <option value="Junior Secondary">Junior Secondary</option>
                    <option value="Islamia">Islamia</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Campus Branch *</label>
                    <select
                      required
                      value={sectionBranch}
                      onChange={(e) => setSectionBranch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="GN">Gwarinpa Campus (GN)</option>
                      <option value="RS">Road Safety Campus (RS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Session *</label>
                    <select
                      required
                      value={sectionSession}
                      onChange={(e) => setSectionSession(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    >
                      {sessions.length > 0 ? (
                        sessions.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))
                      ) : (
                        <option value="ses-2026">2025/2026 Academic Year</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Section Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific notes regarding syllabus level, age limits, or instructors..."
                    value={sectionDescription}
                    onChange={(e) => setSectionDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all font-sans"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSectionModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingSection ? 'Save Changes' : 'Create Section'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Class Modal */}
        {isClassModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Lucide.GraduationCap className="w-4 h-4 text-emerald-600" />
                  {editingClass ? 'Modify Class Blueprint' : 'Register New Class'}
                </h4>
                <button 
                  onClick={() => setIsClassModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleClassSubmit} className="space-y-4">
                {classFormError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-bold flex items-center gap-2">
                    <Lucide.AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{classFormError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Classroom Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Preschool (Ages 2-3) or Grade 1"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parent Section *</label>
                    <select
                      required
                      value={classSectionId}
                      onChange={(e) => setClassSectionId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="">Select section group...</option>
                      {sections.map(sec => (
                        <option key={sec.id} value={sec.id}>{sec.name} ({sec.branch})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Level *</label>
                    <select
                      required
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="nursery">Nursery</option>
                      <option value="primary">Primary</option>
                      <option value="secondary">Junior Secondary</option>
                      <option value="islamia">Islamia</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Campus Branch *</label>
                  <select
                    required
                    value={classBranch}
                    onChange={(e) => setClassBranch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  >
                    <option value="GN">Gwarinpa Campus (GN)</option>
                    <option value="RS">Road Safety Campus (RS)</option>
                  </select>
                </div>

                {/* Subjects dynamic list */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Subjects / Courses</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Mathematics"
                      value={classSubjectInput}
                      onChange={(e) => setClassSubjectInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); } }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-1">
                    {classSubjects.map((sub, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[9px] bg-slate-100 text-slate-700 border border-slate-200 pl-2 pr-1 py-0.5 rounded-md font-bold">
                        {sub}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub)}
                          className="text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Lucide.X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsClassModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingClass ? 'Save Changes' : 'Register Class'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
