import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Save, 
  Edit, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  Layers, 
  Briefcase, 
  GraduationCap, 
  TrendingUp, 
  Info, 
  RotateCcw,
  BookOpen,
  Shield,
  Sparkles,
  ClipboardList,
  DollarSign,
  Users,
  LayoutDashboard,
  CheckSquare,
  CheckCircle2
} from 'lucide-react';
import * as Lucide from 'lucide-react';

export function CategoryIcon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const IconComponent = (Lucide as any)[name] || Lucide.Calendar;
  return <IconComponent className={className} />;
}

interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'planned' | 'archived';
}

interface Term {
  id: string;
  sessionId: string;
  name: string;
  startDate: string;
  endDate: string;
  numberOfWeeks: number;
}

interface Holiday {
  id: string;
  sessionId: string;
  name: string;
  type: 'Public Holiday' | 'School Holiday' | 'Mid-Term Break';
  startDate: string;
  endDate: string;
}

interface EventCategory {
  id: string;
  parentGroup: 'ACADEMIC' | 'FINANCE' | 'STUDENT ACTIVITIES' | 'STAFF' | 'INVENTORY';
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface AcademicEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  categoryId: string;
  branchId: string; // 'All' | 'GN' | 'RS'
  sessionId: string;
  termId: string;
}

export interface EventTask {
  id: string;
  eventId: string;
  title: string;
  description: string;
  assignedUser: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  dueTime?: string;
  taskType?: 'teaching_record' | 'lesson_plan' | 'curriculum_progress' | 'scheme_review' | 'general';
  week?: number;
  subject?: string;
  classId?: string;
  term?: string;
  branch?: string;
  assignedRole?: string;
  submissionDate?: string;
  submissionTime?: string;
  submissionStatus?: 'Submitted On Time' | 'Submitted Late' | 'Not Submitted' | 'Pending';
  daysLate?: number;
  linkedTeachingRecordId?: string;
  reminderNotice?: string;
}

export interface EventAssignment {
  id: string;
  taskId: string;
  assignedUser: string;
  assignedRole: 'Teacher' | 'Accountant' | 'Administrator' | 'Store Manager';
  assignedDate: string;
  completionDate: string;
}

interface AcademicCalendarProps {
  academicSessions: AcademicSession[];
  setAcademicSessions: React.Dispatch<React.SetStateAction<AcademicSession[]>>;
  terms: Term[];
  setTerms: React.Dispatch<React.SetStateAction<Term[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  eventCategories: EventCategory[];
  setEventCategories: React.Dispatch<React.SetStateAction<EventCategory[]>>;
  events: AcademicEvent[];
  setEvents: React.Dispatch<React.SetStateAction<AcademicEvent[]>>;
  currentRole: string;
}

export default function AcademicCalendar({
  academicSessions,
  setAcademicSessions,
  terms,
  setTerms,
  holidays,
  setHolidays,
  eventCategories = [],
  setEventCategories,
  events = [],
  setEvents,
  currentRole
}: AcademicCalendarProps) {
  // Navigation inside Schedule Calendar
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'terms' | 'holidays' | 'event_categories' | 'events' | 'timeline' | 'event_tasks' | 'event_assignments' | 'progress_dashboard' | 'fee_campaign_planner' | 'event_templates' | 'ministry_compliance'>('sessions');

  // Group definitions to consolidate 12 subsections under 4 primary categories
  const groups = [
    {
      id: 'governance',
      title: 'Cycles & Governance',
      description: 'Session setups, term periods, and schedule guideline compliance',
      icon: Shield,
      subTabs: [
        { id: 'sessions', label: 'Academic Sessions', icon: BookOpen },
        { id: 'terms', label: 'Term Configurations', icon: CalendarDays },
        { id: 'holidays', label: 'Holiday Registry', icon: Calendar },
        { id: 'ministry_compliance', label: 'Schedule Compliance', icon: CheckSquare },
      ]
    },
    {
      id: 'events_planning',
      title: 'Events & Planning',
      description: 'Event categories, active event schedules, and annual templates',
      icon: Calendar,
      subTabs: [
        { id: 'event_categories', label: 'Event Categories', icon: Layers },
        { id: 'events', label: 'Scheduling Hub', icon: Plus },
        { id: 'timeline', label: 'Timeline Explorer', icon: Clock },
        { id: 'event_templates', label: 'Templates & Clone', icon: Sparkles },
      ]
    },
    {
      id: 'tasks_progress',
      title: 'Execution & Progress',
      description: 'Task trackers, staff assignments, and readiness dashboards',
      icon: ClipboardList,
      subTabs: [
        { id: 'progress_dashboard', label: 'Readiness Dashboard', icon: LayoutDashboard },
        { id: 'event_tasks', label: 'Event Task Tracker', icon: ClipboardList },
        { id: 'event_assignments', label: 'Task Assignments', icon: Users },
      ]
    },
    {
      id: 'fee_campaigns',
      title: 'Fee Campaigns',
      description: 'Payment schedules, collection windows, and planner',
      icon: DollarSign,
      subTabs: [
        { id: 'fee_campaign_planner', label: 'Campaign Planner', icon: DollarSign },
      ]
    }
  ];

  const handleGroupChange = (groupId: 'governance' | 'events_planning' | 'tasks_progress' | 'fee_campaigns') => {
    if (groupId === 'governance') {
      setActiveSubTab('sessions');
    } else if (groupId === 'events_planning') {
      setActiveSubTab('events');
    } else if (groupId === 'tasks_progress') {
      setActiveSubTab('progress_dashboard');
    } else if (groupId === 'fee_campaigns') {
      setActiveSubTab('fee_campaign_planner');
    }
  };

  const activeGroup = groups.find(g => g.subTabs.some(st => st.id === activeSubTab)) || groups[0];

  // Event templates / cloning wizard state
  const [cloneSourceSessionId, setCloneSourceSessionId] = useState<string>('');
  const [cloneTargetSessionId, setCloneTargetSessionId] = useState<string>('');
  const [cloneSelectedEventIds, setCloneSelectedEventIds] = useState<string[]>([]);
  const [isCloningEvents, setIsCloningEvents] = useState<boolean>(false);
  const [cloneStatusMsg, setCloneStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Compliance state
  const [requiredWeeksTarget, setRequiredWeeksTarget] = useState<number>(36);
  const [requiredDaysTarget, setRequiredDaysTarget] = useState<number>(180);

  // Fee Campaigns state
  interface FeeCampaign {
    id: string;
    name: string;
    week: string;
    startDate: string;
    endDate: string;
    targetCollection: number;
    actualCollection: number;
    defaulterCount: number;
  }
  const [feeCampaigns, setFeeCampaigns] = useState<FeeCampaign[]>([]);
  const [systemOutstandingFees, setSystemOutstandingFees] = useState<number>(0);
  const [systemDefaulterCount, setSystemDefaulterCount] = useState<number>(0);
  const [feeCampaignsLoading, setFeeCampaignsLoading] = useState<boolean>(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<FeeCampaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    week: 'Week 2',
    startDate: '',
    endDate: '',
    targetCollection: 0,
    actualCollection: 0,
    defaulterCount: 0
  });

  // Event Tasks state
  const [eventTasks, setEventTasks] = useState<EventTask[]>([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EventTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    eventId: '',
    title: '',
    description: '',
    assignedUser: '',
    dueDate: '',
    status: 'Pending' as 'Pending' | 'In Progress' | 'Completed' | 'Overdue',
    dueTime: '17:00',
    taskType: 'general' as 'teaching_record' | 'lesson_plan' | 'curriculum_progress' | 'scheme_review' | 'general',
    week: 1,
    assignedRole: 'Teacher',
    reminderNotice: '',
    submissionStatus: 'Pending' as 'Submitted On Time' | 'Submitted Late' | 'Not Submitted' | 'Pending',
    submissionDate: '',
    submissionTime: '',
    daysLate: 0
  });

  // Event Tasks Filter states
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilterEventId, setTaskFilterEventId] = useState('All');
  const [taskFilterStatus, setTaskFilterStatus] = useState('All');

  // Event Assignments state
  const [eventAssignments, setEventAssignments] = useState<EventAssignment[]>([]);
  const [asgModalOpen, setAsgModalOpen] = useState(false);
  const [editingAsg, setEditingAsg] = useState<EventAssignment | null>(null);
  const [asgForm, setAsgForm] = useState({
    taskId: '',
    assignedUser: '',
    assignedRole: 'Teacher' as 'Teacher' | 'Accountant' | 'Administrator' | 'Store Manager',
    assignedDate: '',
    completionDate: ''
  });

  // Event Assignments Filters
  const [asgSearch, setAsgSearch] = useState('');
  const [asgFilterRole, setAsgFilterRole] = useState('All');
  const [asgFilterTaskId, setAsgFilterTaskId] = useState('All');

  // Progress Dashboard states
  const [selectedDashboardEventId, setSelectedDashboardEventId] = useState<string>('');
  const [readinessChecklist, setReadinessChecklist] = useState<Record<string, {
    papersSubmitted: boolean;
    timetablePublished: boolean;
    invigilatorsAssigned: boolean;
    hallsConfigured: boolean;
    stationeryStocked: boolean;
  }>>({});

  // Fetch event tasks and assignments on load
  useEffect(() => {
    fetchEventTasks();
    fetchEventAssignments();
    fetchFeeCampaigns();
  }, []);

  const fetchFeeCampaigns = async () => {
    try {
      setFeeCampaignsLoading(true);
      const res = await fetch('/api/fee_campaigns');
      if (res.ok) {
        const data = await res.json();
        setFeeCampaigns(data.campaigns || []);
        if (data.stats) {
          setSystemOutstandingFees(data.stats.systemOutstandingFees || 0);
          setSystemDefaulterCount(data.stats.systemDefaulterCount || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch fee campaigns:", err);
    } finally {
      setFeeCampaignsLoading(false);
    }
  };

  const fetchEventTasks = async () => {
    try {
      const res = await fetch('/api/event_tasks');
      if (res.ok) {
        const data = await res.json();
        setEventTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch event tasks:", err);
    }
  };

  const fetchEventAssignments = async () => {
    try {
      const res = await fetch('/api/event_assignments');
      if (res.ok) {
        const data = await res.json();
        setEventAssignments(data);
      }
    } catch (err) {
      console.error("Failed to fetch event assignments:", err);
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name || !campaignForm.startDate || !campaignForm.endDate) {
      alert("Please fill in Campaign Name, Start Date, and End Date.");
      return;
    }

    try {
      if (editingCampaign) {
        // Update
        const res = await fetch(`/api/fee_campaigns/${editingCampaign.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaignForm)
        });
        if (!res.ok) throw new Error("Failed to update campaign.");
        const updated = await res.json();
        setFeeCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        // Create
        const res = await fetch('/api/fee_campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaignForm)
        });
        if (!res.ok) throw new Error("Failed to create campaign.");
        const created = await res.json();
        setFeeCampaigns(prev => [...prev, created]);
      }
      setCampaignModalOpen(false);
      setEditingCampaign(null);
      setCampaignForm({
        name: '',
        week: 'Week 2',
        startDate: '',
        endDate: '',
        targetCollection: 0,
        actualCollection: 0,
        defaulterCount: 0
      });
      // Refresh system totals too!
      fetchFeeCampaigns();
    } catch (err: any) {
      alert(err.message || "Failed to save campaign.");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Fee Collection Campaign?")) return;

    try {
      const res = await fetch(`/api/fee_campaigns/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to delete campaign.");
      setFeeCampaigns(prev => prev.filter(c => c.id !== id));
      fetchFeeCampaigns();
    } catch (err: any) {
      alert(err.message || "Failed to delete campaign.");
    }
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgForm.taskId || !asgForm.assignedUser || !asgForm.assignedRole || !asgForm.assignedDate) {
      setValidationError("Please fill in all required assignment fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);

      if (editingAsg) {
        // Update
        const res = await fetch(`/api/event_assignments/${editingAsg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(asgForm)
        });
        if (!res.ok) throw new Error("Failed to update assignment.");
        const updated = await res.json();
        setEventAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        // Create
        const res = await fetch('/api/event_assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(asgForm)
        });
        if (!res.ok) throw new Error("Failed to create assignment.");
        const created = await res.json();
        setEventAssignments(prev => [...prev, created]);
      }

      setAsgModalOpen(false);
      setEditingAsg(null);
      setAsgForm({
        taskId: '',
        assignedUser: '',
        assignedRole: 'Teacher',
        assignedDate: '',
        completionDate: ''
      });
    } catch (err: any) {
      setValidationError(err.message || "An error occurred while saving the assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      setValidationError(null);
      const res = await fetch(`/api/event_assignments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete assignment.");
      setEventAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      setValidationError(err.message || "Failed to delete assignment.");
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.eventId || !taskForm.title || !taskForm.assignedUser || !taskForm.dueDate || !taskForm.status) {
      setValidationError("Please fill in all required task fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);

      if (editingTask) {
        // Update
        const res = await fetch(`/api/event_tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskForm)
        });
        if (!res.ok) throw new Error("Failed to update task.");
        const updated = await res.json();
        setEventTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        // Create
        const res = await fetch('/api/event_tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskForm)
        });
        if (!res.ok) throw new Error("Failed to create task.");
        const created = await res.json();
        setEventTasks(prev => [...prev, created]);
      }

      setTaskModalOpen(false);
      setEditingTask(null);
      setTaskForm({
        eventId: '',
        title: '',
        description: '',
        assignedUser: '',
        dueDate: '',
        status: 'Pending'
      });
    } catch (err: any) {
      setValidationError(err.message || "An error occurred while saving the task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      setValidationError(null);
      const res = await fetch(`/api/event_tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete task.");
      setEventTasks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      setValidationError(err.message || "Failed to delete task.");
    }
  };

  // Selected session for viewing/configuring terms & holidays
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    const active = academicSessions.find(s => s.status === 'active');
    return active ? active.id : (academicSessions[0]?.id || '');
  });

  // Forms and Modals state
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [sessionForm, setSessionForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    status: 'planned' as 'active' | 'planned' | 'archived'
  });

  const [termModalOpen, setTermModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [termForm, setTermForm] = useState({
    name: 'First Term',
    startDate: '',
    endDate: '',
    numberOfWeeks: 12
  });

  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    type: 'Public Holiday' as 'Public Holiday' | 'School Holiday' | 'Mid-Term Break',
    startDate: '',
    endDate: ''
  });

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    parentGroup: 'ACADEMIC' as 'ACADEMIC' | 'FINANCE' | 'STUDENT ACTIVITIES' | 'STAFF' | 'INVENTORY',
    name: '',
    description: '',
    color: '#4F46E5',
    icon: 'BookOpen'
  });

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    categoryId: '',
    branchId: 'All',
    sessionId: '',
    termId: ''
  });

  // Event listing filter states
  const [eventSearch, setEventSearch] = useState('');
  const [eventFilterCategory, setEventFilterCategory] = useState('All');
  const [eventFilterBranch, setEventFilterBranch] = useState('All');
  const [eventFilterStatus, setEventFilterStatus] = useState('All');
  const [eventFilterSession, setEventFilterSession] = useState('All');
  const [eventFilterTerm, setEventFilterTerm] = useState('All');

  // Timeline view interactive states
  const [timelinePreset, setTimelinePreset] = useState<'year' | 'term' | 'month' | 'week' | 'agenda'>('agenda');
  const [timelineSessionId, setTimelineSessionId] = useState<string>('All');
  const [timelineTermId, setTimelineTermId] = useState<string>('All');
  const [timelineSearch, setTimelineSearch] = useState<string>('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: check if user is allowed to mutate data
  const isReadOnly = !['Super Admin', 'Branch Admin'].includes(currentRole);

  // Filter terms and holidays by selected academic year
  const activeSession = academicSessions.find(s => s.id === selectedSessionId);
  const filteredTerms = terms.filter(t => t.sessionId === selectedSessionId);
  const filteredHolidays = holidays.filter(h => h.sessionId === selectedSessionId);

  // Auto-fill terms generator
  const handleAutoGenerateTerms = async () => {
    if (!activeSession) return;
    if (confirm("This will automatically generate three terms for this session based on schedule guidelines. Existing terms for this session will be overwritten. Proceed?")) {
      try {
        setIsSubmitting(true);
        // Delete existing terms of this session first
        const deletePromises = filteredTerms.map(t => fetch(`/api/terms/${t.id}`, { method: 'DELETE' }));
        await Promise.all(deletePromises);

        const sDate = new Date(activeSession.startDate);
        const eDate = new Date(activeSession.endDate);
        const totalDurationDays = Math.floor((eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24));
        
        // Approximate 3 equal parts
        const partDays = Math.floor(totalDurationDays / 3);

        const termsData = [
          {
            name: "First Term",
            startDate: activeSession.startDate,
            endDate: addDaysToFormattedString(activeSession.startDate, Math.floor(partDays * 0.8)), // roughly 14-15 weeks
            numberOfWeeks: Math.floor((partDays * 0.8) / 7)
          },
          {
            name: "Second Term",
            startDate: addDaysToFormattedString(activeSession.startDate, Math.floor(partDays * 1.1)),
            endDate: addDaysToFormattedString(activeSession.startDate, Math.floor(partDays * 1.9)),
            numberOfWeeks: Math.floor((partDays * 0.8) / 7)
          },
          {
            name: "Third Term",
            startDate: addDaysToFormattedString(activeSession.startDate, Math.floor(partDays * 2.2)),
            endDate: activeSession.endDate,
            numberOfWeeks: Math.floor((partDays * 0.8) / 7)
          }
        ];

        const createdTerms: Term[] = [];
        for (const t of termsData) {
          const res = await fetch('/api/terms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: selectedSessionId,
              name: t.name,
              startDate: t.startDate,
              endDate: t.endDate,
              numberOfWeeks: t.numberOfWeeks
            })
          });
          if (res.ok) {
            createdTerms.push(await res.json());
          }
        }

        // Fetch refreshed database list
        const refreshedRes = await fetch('/api/terms');
        if (refreshedRes.ok) {
          const allTerms = await refreshedRes.json();
          setTerms(allTerms);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const addDaysToFormattedString = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Helper date overlap checkers
  const checkDateOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
    const sA = new Date(startA).getTime();
    const eA = new Date(endA).getTime();
    const sB = new Date(startB).getTime();
    const eB = new Date(endB).getTime();
    return sA <= eB && sB <= eA;
  };

  const calculateWeeksBetween = (start: string, end: string): number => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e.getTime() - s.getTime());
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24 * 7)));
  };

  // Academic Sessions Form submit
  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const { name, startDate, endDate, status } = sessionForm;
    if (!name || !startDate || !endDate) {
      setValidationError("Please fill out all fields.");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setValidationError("Start date must be strictly before end date.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSession) {
        // Edit Mode
        const res = await fetch(`/api/academic-sessions/${editingSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, startDate, endDate, status })
        });
        if (res.ok) {
          const updated = await res.json();
          setAcademicSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
          setSessionModalOpen(false);
          setEditingSession(null);
        } else {
          setValidationError("Could not update session.");
        }
      } else {
        // Create Mode
        const res = await fetch('/api/academic-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, startDate, endDate, status })
        });
        if (res.ok) {
          const created = await res.json();
          setAcademicSessions(prev => [...prev, created]);
          setSelectedSessionId(created.id);
          setSessionModalOpen(false);
        } else {
          setValidationError("Could not create academic session.");
        }
      }
      // Re-fetch everything to ensure cascade changes (like archiving other sessions) sync correctly
      const refreshedSes = await fetch('/api/academic-sessions');
      if (refreshedSes.ok) {
        setAcademicSessions(await refreshedSes.ok ? await refreshedSes.json() : []);
      }
    } catch (err) {
      console.error(err);
      setValidationError("A communication error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Terms Form submit
  const handleTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const { name, startDate, endDate, numberOfWeeks } = termForm;
    if (!startDate || !endDate) {
      setValidationError("Please select term start and end dates.");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setValidationError("Term start date must be before its end date.");
      return;
    }

    // Ensure terms fit within the selected academic session duration
    if (activeSession) {
      const sessStart = new Date(activeSession.startDate).getTime();
      const sessEnd = new Date(activeSession.endDate).getTime();
      const tStart = new Date(startDate).getTime();
      const tEnd = new Date(endDate).getTime();

      if (tStart < sessStart || tEnd > sessEnd) {
        setValidationError(`Term dates must lie inside the Academic Year range: ${activeSession.startDate} to ${activeSession.endDate}`);
        return;
      }
    }

    // Overlap checks across other terms of this session
    const otherTerms = filteredTerms.filter(t => editingTerm ? t.id !== editingTerm.id : true);
    for (const t of otherTerms) {
      if (checkDateOverlap(startDate, endDate, t.startDate, t.endDate)) {
        setValidationError(`Term dates overlap with existing ${t.name} (${t.startDate} to ${t.endDate})`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (editingTerm) {
        const res = await fetch(`/api/terms/${editingTerm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, startDate, endDate, numberOfWeeks })
        });
        if (res.ok) {
          const updated = await res.json();
          setTerms(prev => prev.map(t => t.id === updated.id ? updated : t));
          setTermModalOpen(false);
          setEditingTerm(null);
        } else {
          setValidationError("Could not update term.");
        }
      } else {
        const res = await fetch('/api/terms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: selectedSessionId, name, startDate, endDate, numberOfWeeks })
        });
        if (res.ok) {
          const created = await res.json();
          setTerms(prev => [...prev, created]);
          setTermModalOpen(false);
        } else {
          setValidationError("Could not register term.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Holidays Form submit
  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const { name, type, startDate, endDate } = holidayForm;
    if (!name || !startDate || !endDate) {
      setValidationError("Please fill out all holiday registry fields.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setValidationError("Start date cannot fall after end date.");
      return;
    }

    // Ensure holiday lies inside academic session bounds
    if (activeSession) {
      const sessStart = new Date(activeSession.startDate).getTime();
      const sessEnd = new Date(activeSession.endDate).getTime();
      const hStart = new Date(startDate).getTime();
      const hEnd = new Date(endDate).getTime();

      if (hStart < sessStart || hEnd > sessEnd) {
        setValidationError(`Holiday must fall within Academic Year range: ${activeSession.startDate} to ${activeSession.endDate}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (editingHoliday) {
        const res = await fetch(`/api/holidays/${editingHoliday.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, startDate, endDate })
        });
        if (res.ok) {
          const updated = await res.json();
          setHolidays(prev => prev.map(h => h.id === updated.id ? updated : h));
          setHolidayModalOpen(false);
          setEditingHoliday(null);
        } else {
          setValidationError("Could not update holiday registry.");
        }
      } else {
        const res = await fetch('/api/holidays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: selectedSessionId, name, type, startDate, endDate })
        });
        if (res.ok) {
          const created = await res.json();
          setHolidays(prev => [...prev, created]);
          setHolidayModalOpen(false);
        } else {
          setValidationError("Could not register holiday.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handlers
  const handleDeleteSession = async (id: string) => {
    if (confirm("Are you sure? This will permanently delete this Academic Session AND CASCADE delete all associated terms & holidays.")) {
      try {
        const res = await fetch(`/api/academic-sessions/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setAcademicSessions(prev => prev.filter(s => s.id !== id));
          if (selectedSessionId === id) {
            setSelectedSessionId(academicSessions.find(s => s.id !== id)?.id || '');
          }
          // Cascade delete terms & holidays in local state
          setTerms(prev => prev.filter(t => t.sessionId !== id));
          setHolidays(prev => prev.filter(h => h.sessionId !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (confirm("Permanent deletion of this term from the official calendar?")) {
      try {
        const res = await fetch(`/api/terms/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setTerms(prev => prev.filter(t => t.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (confirm("Remove this holiday record?")) {
      try {
        const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setHolidays(prev => prev.filter(h => h.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this event category? Any scheduled events of this category might lose their categorization badge.")) {
      try {
        const res = await fetch(`/api/event-categories/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setEventCategories(prev => prev.filter(c => c.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const { parentGroup, name, description, color, icon } = categoryForm;
    if (!parentGroup || !name) {
      setValidationError("Please fill out all required category fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        const res = await fetch(`/api/event-categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentGroup, name, description, color, icon })
        });
        if (res.ok) {
          const updated = await res.json();
          setEventCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
          setCategoryModalOpen(false);
          setEditingCategory(null);
        } else {
          setValidationError("Could not update event category.");
        }
      } else {
        const res = await fetch('/api/event-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentGroup, name, description, color, icon })
        });
        if (res.ok) {
          const created = await res.json();
          setEventCategories(prev => [...prev, created]);
          setCategoryModalOpen(false);
        } else {
          setValidationError("Could not register new event category.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      parentGroup: 'ACADEMIC',
      name: '',
      description: '',
      color: '#4F46E5',
      icon: 'BookOpen'
    });
    setValidationError(null);
    setCategoryModalOpen(true);
  };

  const openEditCategory = (cat: EventCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      parentGroup: cat.parentGroup,
      name: cat.name,
      description: cat.description,
      color: cat.color,
      icon: cat.icon
    });
    setValidationError(null);
    setCategoryModalOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this scheduled event?")) {
      try {
        const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setEvents(prev => prev.filter(e => e.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const { title, description, startDate, endDate, categoryId, branchId, sessionId, termId } = eventForm;
    if (!title || !startDate || !endDate || !categoryId || !branchId || !sessionId || !termId) {
      setValidationError("Please fill out all required event fields.");
      return;
    }

    if (startDate > endDate) {
      setValidationError("The event start date cannot fall after its end date.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingEvent) {
        const res = await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, startDate, endDate, categoryId, branchId, sessionId, termId })
        });
        if (res.ok) {
          const updated = await res.json();
          setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
          setEventModalOpen(false);
          setEditingEvent(null);
        } else {
          setValidationError("Could not update scheduled event.");
        }
      } else {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, startDate, endDate, categoryId, branchId, sessionId, termId })
        });
        if (res.ok) {
          const created = await res.json();
          setEvents(prev => [...prev, created]);
          setEventModalOpen(false);
        } else {
          setValidationError("Could not register new scheduled event.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      categoryId: eventCategories[0]?.id || '',
      branchId: 'All',
      sessionId: academicSessions.find(s => s.status === 'active')?.id || academicSessions[0]?.id || '',
      termId: terms[0]?.id || ''
    });
    setValidationError(null);
    setEventModalOpen(true);
  };

  const openEditEvent = (evt: AcademicEvent) => {
    setEditingEvent(evt);
    setEventForm({
      title: evt.title,
      description: evt.description,
      startDate: evt.startDate,
      endDate: evt.endDate,
      categoryId: evt.categoryId,
      branchId: evt.branchId,
      sessionId: evt.sessionId,
      termId: evt.termId
    });
    setValidationError(null);
    setEventModalOpen(true);
  };

  // Form open orchestrators
  const openAddSession = () => {
    setEditingSession(null);
    setSessionForm({
      name: '',
      startDate: '',
      endDate: '',
      status: 'planned'
    });
    setValidationError(null);
    setSessionModalOpen(true);
  };

  const openEditSession = (session: AcademicSession) => {
    setEditingSession(session);
    setSessionForm({
      name: session.name,
      startDate: session.startDate,
      endDate: session.endDate,
      status: session.status
    });
    setValidationError(null);
    setSessionModalOpen(true);
  };

  const openAddTerm = () => {
    setEditingTerm(null);
    setTermForm({
      name: filteredTerms.length === 0 ? 'First Term' : filteredTerms.length === 1 ? 'Second Term' : 'Third Term',
      startDate: activeSession ? activeSession.startDate : '',
      endDate: activeSession ? activeSession.endDate : '',
      numberOfWeeks: 12
    });
    setValidationError(null);
    setTermModalOpen(true);
  };

  const openEditTerm = (term: Term) => {
    setEditingTerm(term);
    setTermForm({
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
      numberOfWeeks: term.numberOfWeeks
    });
    setValidationError(null);
    setTermModalOpen(true);
  };

  const openAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({
      name: '',
      type: 'Public Holiday',
      startDate: activeSession ? activeSession.startDate : '',
      endDate: activeSession ? activeSession.startDate : ''
    });
    setValidationError(null);
    setHolidayModalOpen(true);
  };

  const openEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayForm({
      name: holiday.name,
      type: holiday.type,
      startDate: holiday.startDate,
      endDate: holiday.endDate
    });
    setValidationError(null);
    setHolidayModalOpen(true);
  };

  return (
    <div id="academic-calendar-wrapper" className="space-y-6">
      
      {/* Top Heading Workspace */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-indigo-100 pb-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700">
            <CalendarDays className="w-5 h-5 shrink-0" />
            <span className="text-xs uppercase tracking-widest font-mono font-bold">Schedule Calendar Setup</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Session &amp; Calendar Setup</h2>
          <p className="text-xs text-slate-500">Maintain session timelines, allocate term periods, and catalog standard holiday calendars.</p>
        </div>

        {/* Global Select Session Filter */}
        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-semibold text-slate-500">Selected Session:</span>
          <select
            id="global-session-select"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium shadow-sm focus:border-indigo-500 outline-none transition-all cursor-pointer"
          >
            {academicSessions.length === 0 && <option value="">No Sessions Registered</option>}
            {academicSessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.status === 'active' ? '(Active)' : s.status === 'archived' ? '(Archived)' : '(Planned)'}
              </option>
            ))}
          </select>
          
          {!isReadOnly && (
            <button
              id="btn-add-session-top"
              onClick={openAddSession}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Primary Operational Groups */}
      <div id="academic-calendar-groups" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => {
          const isSelected = activeGroup.id === group.id;
          const IconComp = group.icon;
          return (
            <button
              key={group.id}
              onClick={() => handleGroupChange(group.id as any)}
              className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden h-full ${
                isSelected 
                  ? 'bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/10 border-indigo-200 shadow-sm ring-1 ring-indigo-500/10' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 shadow-3xs'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2.5">
                <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <IconComp className="w-4.5 h-4.5" />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isSelected ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {group.subTabs.length} {group.subTabs.length === 1 ? 'Section' : 'Sections'}
                </span>
              </div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight mb-1">
                {group.title}
              </h3>
              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                {group.description}
              </p>
              
              {/* Active Indicator Bar */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 transition-all ${
                isSelected ? 'bg-indigo-600' : 'bg-transparent'
              }`} />
            </button>
          );
        })}
      </div>

      {/* Secondary Subsections Navigation */}
      <div id="academic-calendar-tabs" className="bg-slate-50 border border-slate-200/50 p-1.5 rounded-2xl flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2.5 select-none">
          Subsections:
        </span>
        {activeGroup.subTabs.map((subTab) => {
          const isSubSelected = activeSubTab === subTab.id;
          const SubIcon = subTab.icon;
          return (
            <button
              key={subTab.id}
              onClick={() => {
                if ((subTab.id === 'terms' || subTab.id === 'holidays') && academicSessions.length === 0) {
                  alert("Please register at least one Academic Session first.");
                  return;
                }
                setActiveSubTab(subTab.id as any);
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSubSelected 
                  ? 'bg-white text-indigo-700 shadow-3xs border border-slate-200/60' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <SubIcon className={`w-3.5 h-3.5 ${isSubSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{subTab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ----------------- SUB TAB 1: ACADEMIC SESSIONS LIST ----------------- */}
      {activeSubTab === 'sessions' && (
        <div id="subtab-sessions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {academicSessions.map(session => {
              const isActive = session.status === 'active';
              const isArchived = session.status === 'archived';
              
              return (
                <div 
                  key={session.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm relative flex flex-col justify-between transition-all ${
                    isActive ? 'border-indigo-200 ring-2 ring-indigo-50/50' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isActive ? 'bg-indigo-100 text-indigo-800' : isArchived ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {session.status}
                      </span>
                      
                      {!isReadOnly && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openEditSession(session)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Edit Session"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-tight mb-2">
                      {session.name}
                    </h3>
                    
                    {/* Session Range details */}
                    <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Start: <strong className="text-slate-800">{session.startDate}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>End: <strong className="text-slate-800">{session.endDate}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Active Selector Indicator */}
                  <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">ID: {session.id}</span>
                    <button
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all ${
                        selectedSessionId === session.id 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedSessionId === session.id ? 'Viewing This' : 'Select View'}
                    </button>
                  </div>
                </div>
              );
            })}

            {academicSessions.length === 0 && (
              <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-500">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 mb-1">No Academic Sessions Registered</h4>
                <p className="text-xs max-w-sm mx-auto text-slate-400">Initialize a new academic calendar year to coordinate school terms and student activities.</p>
                {!isReadOnly && (
                  <button
                    onClick={openAddSession}
                    className="mt-4 bg-indigo-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    Setup Initial Session
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SUB TAB 2: TERMS ALLOCATION ----------------- */}
      {activeSubTab === 'terms' && (
        <div id="subtab-terms" className="space-y-6">
          {activeSession && (
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/40 border border-indigo-100/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-700">
                  <BookOpen className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-950">Active Session Workspace: {activeSession.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Session Duration: {activeSession.startDate} to {activeSession.endDate}</p>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    id="btn-auto-gen-terms"
                    onClick={handleAutoGenerateTerms}
                    className="bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>✨ Auto-Allot 3 Terms</span>
                  </button>
                  <button
                    id="btn-add-term"
                    onClick={openAddTerm}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Term</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['First Term', 'Second Term', 'Third Term'].map(termName => {
              const term = filteredTerms.find(t => t.name.toLowerCase() === termName.toLowerCase());
              
              if (!term) {
                return (
                  <div key={termName} className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 flex flex-col justify-between min-h-[220px]">
                    <div className="my-auto space-y-2">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-sm">{termName}</h4>
                      <p className="text-[11px] text-slate-400 leading-normal max-w-xs mx-auto">Not allocated. Use the Auto-Allot or manual tools to generate dates.</p>
                    </div>
                    {!isReadOnly && (
                      <button
                        onClick={() => {
                          setEditingTerm(null);
                          setTermForm({
                            name: termName,
                            startDate: activeSession ? activeSession.startDate : '',
                            endDate: activeSession ? activeSession.endDate : '',
                            numberOfWeeks: 12
                          });
                          setValidationError(null);
                          setTermModalOpen(true);
                        }}
                        className="mt-3 text-indigo-600 hover:text-indigo-800 font-bold text-[11px] underline block mx-auto cursor-pointer"
                      >
                        Allot Dates Manually
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div key={term.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Schedule Guideline
                      </span>
                      {!isReadOnly && (
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => openEditTerm(term)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Edit Term"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTerm(term.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Term"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base tracking-tight mb-3">
                      {term.name}
                    </h3>

                    {/* Timeline range details */}
                    <div className="space-y-2 text-xs text-slate-500 font-medium mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Allotted Weeks:</span>
                        <strong className="text-slate-800 font-mono">{term.numberOfWeeks} Weeks</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Start Date:</span>
                        <strong className="text-slate-800">{term.startDate}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">End Date:</span>
                        <strong className="text-slate-800">{term.endDate}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Micro Visual Timeline Progress */}
                  <div className="border-t border-slate-100 pt-3.5">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                      <div 
                        className="bg-indigo-600 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, (term.numberOfWeeks / 16) * 100)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold uppercase">
                      <span>0 wks</span>
                      <span>16 wks max</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- SUB TAB 3: HOLIDAY REGISTRY ----------------- */}
      {activeSubTab === 'holidays' && (
        <div id="subtab-holidays" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-950 text-base leading-tight">National &amp; School Holidays</h3>
              <p className="text-[11px] text-slate-500">Registry of public off-days, internal mid-term recess, and term breaks.</p>
            </div>
            
            {!isReadOnly && (
              <button
                id="btn-add-holiday"
                onClick={openAddHoliday}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Holiday</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-4 font-bold tracking-wider uppercase text-[10px]">Holiday Name</th>
                  <th className="p-4 font-bold tracking-wider uppercase text-[10px]">Type</th>
                  <th className="p-4 font-bold tracking-wider uppercase text-[10px]">Start Date</th>
                  <th className="p-4 font-bold tracking-wider uppercase text-[10px]">End Date</th>
                  <th className="p-4 font-bold tracking-wider uppercase text-[10px]">Duration (Days)</th>
                  {!isReadOnly && <th className="p-4 text-right font-bold tracking-wider uppercase text-[10px]">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHolidays.map(holiday => {
                  const s = new Date(holiday.startDate);
                  const e = new Date(holiday.endDate);
                  const durationDays = Math.max(1, Math.floor((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1);

                  let badgeColor = "bg-rose-50 text-rose-700 border border-rose-100";
                  if (holiday.type === 'School Holiday') badgeColor = "bg-amber-50 text-amber-700 border border-amber-100";
                  if (holiday.type === 'Mid-Term Break') badgeColor = "bg-indigo-50 text-indigo-700 border border-indigo-100";

                  return (
                    <tr key={holiday.id} className="hover:bg-slate-50/40 transition-all font-medium">
                      <td className="p-4 text-slate-900 font-bold">{holiday.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                          {holiday.type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-800 font-mono">{holiday.startDate}</td>
                      <td className="p-4 text-slate-800 font-mono">{holiday.endDate}</td>
                      <td className="p-4 font-semibold text-slate-500 font-mono">{durationDays} Day{durationDays > 1 ? 's' : ''}</td>
                      {!isReadOnly && (
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => openEditHoliday(holiday)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {filteredHolidays.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 bg-slate-50/50">
                      <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700 text-xs">No Scheduled Holidays</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Use the "Register Holiday" trigger above to schedule academic days off.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- SUB TAB 4: EVENT CATEGORY MANAGEMENT ----------------- */}
      {activeSubTab === 'event_categories' && (
        <div id="subtab-event-categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-950 text-base leading-tight">School Event Categories</h3>
              <p className="text-[11px] text-slate-500">Categorize extra-curricular schedules, parent-teacher reviews, continuous assessment drives, and inventory distribution events.</p>
            </div>
            
            {!isReadOnly && (
              <button
                id="btn-add-category"
                onClick={openAddCategory}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
            )}
          </div>

          {/* Grouped view layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {['ACADEMIC', 'FINANCE', 'STUDENT ACTIVITIES', 'STAFF', 'INVENTORY'].map(group => {
              const categoriesInGroup = eventCategories.filter(c => c.parentGroup === group);
              
              // Define Group Header Colors/Styles
              let borderClass = "border-slate-200";

              if (group === 'ACADEMIC') borderClass = "border-indigo-200";
              else if (group === 'FINANCE') borderClass = "border-emerald-200";
              else if (group === 'STUDENT ACTIVITIES') borderClass = "border-pink-200";
              else if (group === 'STAFF') borderClass = "border-violet-200";
              else if (group === 'INVENTORY') borderClass = "border-orange-200";

              return (
                <div key={group} className={`bg-white rounded-2xl border ${borderClass} p-5 shadow-sm space-y-4`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        group === 'ACADEMIC' ? 'bg-indigo-500' :
                        group === 'FINANCE' ? 'bg-emerald-500' :
                        group === 'STUDENT ACTIVITIES' ? 'bg-pink-500' :
                        group === 'STAFF' ? 'bg-violet-500' : 'bg-orange-500'
                      }`} />
                      <h4 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">{group}</h4>
                    </div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {categoriesInGroup.length} items
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 space-y-3">
                    {categoriesInGroup.map(cat => (
                      <div key={cat.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4 group/item">
                        <div className="flex items-start space-x-3">
                          <div 
                            className="p-2 rounded-xl text-white shrink-0 flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: cat.color || '#4F46E5' }}
                          >
                            <CategoryIcon name={cat.icon || 'Calendar'} className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-800 text-xs leading-snug">{cat.name}</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">
                              {cat.description || "No specific guidelines provided for this category."}
                            </p>
                          </div>
                        </div>

                        {!isReadOnly && (
                          <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditCategory(cat)}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Edit Category"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {categoriesInGroup.length === 0 && (
                      <p className="text-[11px] text-slate-400 py-4 text-center">
                        No active sub-categories registered under {group}.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- SUB TAB 5: EVENT SCHEDULING HUB ----------------- */}
      {activeSubTab === 'events' && (
        <div id="subtab-events" className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-950 text-base leading-tight flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <span>School Events & Operational Deadlines</span>
              </h3>
              <p className="text-[11px] text-slate-500">Coordinate school calendars, outstanding payment drives, continuous evaluation intervals, and teacher workshops.</p>
            </div>
            
            {!isReadOnly && (
              <button
                id="btn-add-event"
                onClick={openAddEvent}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition-all flex items-center space-x-2 self-start lg:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Event</span>
              </button>
            )}
          </div>

          {/* Premium Filter Dashboard */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
            {/* Search Input */}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Keyword</label>
              <input
                type="text"
                placeholder="Search event title or guidelines..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Event Category</label>
              <select
                value={eventFilterCategory}
                onChange={(e) => setEventFilterCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="All">All Categories</option>
                {eventCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Branch Scope */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Branch Scope</label>
              <select
                value={eventFilterBranch}
                onChange={(e) => setEventFilterBranch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="All">All Branches</option>
                <option value="GN">Gawun Nama (GN)</option>
                <option value="RS">Runjin Sambo (RS)</option>
              </select>
            </div>

            {/* Computed Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              <select
                value={eventFilterStatus}
                onChange={(e) => setEventFilterStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Current">Current</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue Deadlines</option>
              </select>
            </div>

            {/* Academic Session Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Session</label>
              <select
                value={eventFilterSession}
                onChange={(e) => setEventFilterSession(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="All">All Sessions</option>
                {academicSessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Events Dynamic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.filter(event => {
              // Keyword filter
              const matchesSearch = event.title.toLowerCase().includes(eventSearch.toLowerCase()) || 
                                    event.description.toLowerCase().includes(eventSearch.toLowerCase());
              
              // Category filter
              const matchesCategory = eventFilterCategory === 'All' || event.categoryId === eventFilterCategory;
              
              // Branch filter
              const matchesBranch = eventFilterBranch === 'All' || event.branchId === eventFilterBranch;
              
              // Session filter
              const matchesSession = eventFilterSession === 'All' || event.sessionId === eventFilterSession;
              
              // Dynamic status calculation
              const today = '2026-07-03';
              let calculatedStatus = 'Upcoming';
              if (today < event.startDate) {
                calculatedStatus = 'Upcoming';
              } else if (today >= event.startDate && today <= event.endDate) {
                calculatedStatus = 'Current';
              } else {
                // Critical category checking for Overdue
                const isOperational = ['cat-fin-rem', 'cat-fin-drv', 'cat-inv-ord'].includes(event.categoryId);
                calculatedStatus = isOperational ? 'Overdue' : 'Completed';
              }

              const matchesStatus = eventFilterStatus === 'All' || calculatedStatus === eventFilterStatus;

              return matchesSearch && matchesCategory && matchesBranch && matchesSession && matchesStatus;
            }).map(event => {
              const matchedCat = eventCategories.find(c => c.id === event.categoryId);
              const matchedSession = academicSessions.find(s => s.id === event.sessionId);
              const matchedTerm = terms.find(t => t.id === event.termId);

              // Calculate status
              const today = '2026-07-03';
              let calculatedStatus = 'Upcoming';
              let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
              if (today < event.startDate) {
                calculatedStatus = 'Upcoming';
                badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
              } else if (today >= event.startDate && today <= event.endDate) {
                calculatedStatus = 'Current';
                badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              } else {
                const isOperational = ['cat-fin-rem', 'cat-fin-drv', 'cat-inv-ord'].includes(event.categoryId);
                if (isOperational) {
                  calculatedStatus = 'Overdue';
                  badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                } else {
                  calculatedStatus = 'Completed';
                  badgeColor = 'bg-slate-50 text-slate-600 border-slate-200';
                }
              }

              return (
                <div 
                  key={event.id} 
                  className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Category Badge & Status Badge */}
                    <div className="flex items-center justify-between">
                      {matchedCat ? (
                        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-xs" style={{ backgroundColor: matchedCat.color }}>
                          <CategoryIcon name={matchedCat.icon} className="w-3.5 h-3.5" />
                          <span>{matchedCat.name}</span>
                        </div>
                      ) : (
                        <div className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          General Calendar
                        </div>
                      )}

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                        {calculatedStatus}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-1">
                        {event.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                        {event.description || 'No additional instructions recorded.'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{event.startDate} to {event.endDate}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm uppercase tracking-wide text-[9px]">
                          Branch: {event.branchId === 'All' ? 'All Campuses' : event.branchId === 'GN' ? 'Gawun Nama' : 'Runjin Sambo'}
                        </span>
                        {matchedTerm && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm uppercase tracking-wide text-[9px]">
                            {matchedTerm.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => openEditEvent(event)}
                          className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-500 transition-colors cursor-pointer"
                          title="Modify Event"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-500 transition-colors cursor-pointer"
                          title="Remove Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {events.length === 0 && (
              <div className="col-span-full bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                <h5 className="font-extrabold text-slate-800 text-xs">No Scheduled Events Found</h5>
                <p className="text-[10px] text-slate-400 mt-1">Change your filters or create a new event category above to populate the operational agenda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SUB TAB 6: OPERATIONAL TIMELINE EXPLORER ----------------- */}
      {activeSubTab === 'timeline' && (() => {
        // Dynamic event state retriever helper
        const getEventStatusAndColor = (evt: AcademicEvent) => {
          const today = '2026-07-03';
          if (today < evt.startDate) {
            return { 
              status: 'Upcoming', 
              colorName: 'Yellow', 
              badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200', 
              borderClass: 'border-amber-400 focus:border-amber-500', 
              bgGradient: 'from-amber-50/30 to-white', 
              textClass: 'text-amber-700', 
              dotClass: 'bg-amber-500 ring-amber-200' 
            };
          } else if (today >= evt.startDate && today <= evt.endDate) {
            return { 
              status: 'Current', 
              colorName: 'Blue', 
              badgeClass: 'bg-blue-50 text-blue-800 border border-blue-200', 
              borderClass: 'border-blue-400 focus:border-blue-500', 
              bgGradient: 'from-blue-50/30 to-white', 
              textClass: 'text-blue-700', 
              dotClass: 'bg-blue-500 ring-blue-200' 
            };
          } else {
            const isOperational = ['cat-fin-rem', 'cat-fin-drv', 'cat-inv-ord'].includes(evt.categoryId);
            if (isOperational) {
              return { 
                status: 'Overdue', 
                colorName: 'Red', 
                badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200', 
                borderClass: 'border-rose-400 focus:border-rose-500', 
                bgGradient: 'from-rose-50/30 to-white', 
                textClass: 'text-rose-700', 
                dotClass: 'bg-rose-500 ring-rose-200' 
              };
            } else {
              return { 
                status: 'Completed', 
                colorName: 'Green', 
                badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200', 
                borderClass: 'border-emerald-400 focus:border-emerald-500', 
                bgGradient: 'from-emerald-50/30 to-white', 
                textClass: 'text-emerald-700', 
                dotClass: 'bg-emerald-500 ring-emerald-200' 
              };
            }
          }
        };

        const filteredTimelineEvents = events.filter(evt => {
          const matchesSearch = evt.title.toLowerCase().includes(timelineSearch.toLowerCase()) || 
                                evt.description.toLowerCase().includes(timelineSearch.toLowerCase());
          const matchesSession = timelineSessionId === 'All' || evt.sessionId === timelineSessionId;
          const matchesTerm = timelineTermId === 'All' || evt.termId === timelineTermId;
          return matchesSearch && matchesSession && matchesTerm;
        });

        const timelineStats = {
          total: filteredTimelineEvents.length,
          completed: filteredTimelineEvents.filter(e => getEventStatusAndColor(e).status === 'Completed').length,
          current: filteredTimelineEvents.filter(e => getEventStatusAndColor(e).status === 'Current').length,
          upcoming: filteredTimelineEvents.filter(e => getEventStatusAndColor(e).status === 'Upcoming').length,
          overdue: filteredTimelineEvents.filter(e => getEventStatusAndColor(e).status === 'Overdue').length,
        };

        return (
          <div id="subtab-timeline" className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base leading-tight flex items-center space-x-2">
                  <span>Operational Timeline Explorer</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold border border-indigo-200">
                    Active System Time: 2026-07-03
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Interactive operational flow mapped by Academic Year, Term, Month, and Week with color-coded tracking tags.
                </p>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'year', label: 'Year View', icon: 'Layers' },
                  { id: 'term', label: 'Term View', icon: 'Clock' },
                  { id: 'month', label: 'Month View', icon: 'CalendarDays' },
                  { id: 'week', label: 'Week View', icon: 'Calendar' },
                  { id: 'agenda', label: 'Agenda View', icon: 'BookOpen' }
                ].map(p => {
                  const Icon = (Lucide as any)[p.icon] || Lucide.Calendar;
                  const isSelected = timelinePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setTimelinePreset(p.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KPI TRACKING METRICS STRIP */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CURRENT */}
              <div className="bg-gradient-to-br from-blue-50/40 to-white rounded-2xl border border-blue-150 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Active / Current</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-slate-950">{timelineStats.current}</span>
                  <span className="text-[10px] font-bold text-slate-400">Events</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 font-semibold">Blue - Actively in progress today</p>
              </div>

              {/* UPCOMING */}
              <div className="bg-gradient-to-br from-amber-50/40 to-white rounded-2xl border border-amber-150 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Upcoming</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-slate-950">{timelineStats.upcoming}</span>
                  <span className="text-[10px] font-bold text-slate-400">Planned</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 font-semibold">Yellow - Scheduled future deadlines</p>
              </div>

              {/* OVERDUE */}
              <div className="bg-gradient-to-br from-rose-50/40 to-white rounded-2xl border border-rose-150 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Overdue Reminders</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-slate-950">{timelineStats.overdue}</span>
                  <span className="text-[10px] font-bold text-slate-400">Alerts</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 font-semibold">Red - Overdue financial/logistics campaigns</p>
              </div>

              {/* COMPLETED */}
              <div className="bg-gradient-to-br from-emerald-50/40 to-white rounded-2xl border border-emerald-150 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completed</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-slate-950">{timelineStats.completed}</span>
                  <span className="text-[10px] font-bold text-slate-400">Archived</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 font-semibold">Green - Successfully closed sessions</p>
              </div>
            </div>

            {/* INTERACTIVE CONTROLS BAR */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Keyword Search */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Keywords</label>
                <input
                  type="text"
                  placeholder="e.g. exams, uniform..."
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              {/* Session Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Session Scope</label>
                <select
                  value={timelineSessionId}
                  onChange={(e) => {
                    setTimelineSessionId(e.target.value);
                    setTimelineTermId('All'); // Reset term when session shifts
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="All">All Active & Planned Sessions</option>
                  {academicSessions.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.status.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              {/* Term Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Term Scope</label>
                <select
                  value={timelineTermId}
                  onChange={(e) => setTimelineTermId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="All">All Terms</option>
                  {terms.filter(t => timelineSessionId === 'All' || t.sessionId === timelineSessionId).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({academicSessions.find(s => s.id === t.sessionId)?.name || 'General'})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ----------------- RENDERER: 1. YEAR VIEW ----------------- */}
            {timelinePreset === 'year' && (
              <div className="space-y-6">
                {academicSessions.filter(s => timelineSessionId === 'All' || s.id === timelineSessionId).map(session => {
                  const sessionEvents = filteredTimelineEvents.filter(e => e.sessionId === session.id);
                  const sessionTerms = terms.filter(t => t.sessionId === session.id);

                  return (
                    <div key={session.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{session.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Duration: {session.startDate} to {session.endDate}</p>
                        </div>
                        <span className="text-[10px] font-bold font-mono px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 uppercase">
                          {session.status}
                        </span>
                      </div>

                      {/* Term columns inside session */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        {sessionTerms.map(term => {
                          const termEvents = sessionEvents.filter(e => e.termId === term.id);

                          return (
                            <div key={term.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 flex flex-col justify-between space-y-3">
                              <div>
                                <h5 className="font-extrabold text-slate-800 text-xs flex items-center justify-between">
                                  <span>{term.name}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                                    {termEvents.length} Evts
                                  </span>
                                </h5>
                                <p className="text-[9px] text-slate-400 mt-0.5">Term span: {term.startDate} to {term.endDate}</p>

                                <div className="space-y-2 mt-3.5">
                                  {termEvents.map(evt => {
                                    const { status, borderClass, textClass } = getEventStatusAndColor(evt);
                                    return (
                                      <div key={evt.id} className={`p-2 rounded-lg bg-white border-l-4 ${borderClass} shadow-3xs space-y-1`}>
                                        <div className="flex items-center justify-between">
                                          <span className="font-extrabold text-slate-800 text-[10px] truncate leading-tight w-2/3">
                                            {evt.title}
                                          </span>
                                          <span className={`text-[8px] font-extrabold uppercase ${textClass}`}>
                                            {status}
                                          </span>
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-mono leading-none">{evt.startDate}</p>
                                      </div>
                                    );
                                  })}

                                  {termEvents.length === 0 && (
                                    <p className="text-[10px] text-slate-400 italic py-3 text-center">No scheduled events.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {sessionTerms.length === 0 && (
                          <div className="col-span-full bg-slate-100 rounded-xl py-6 text-center text-slate-400 text-xs font-bold">
                            No terms registered for this session. Use "Terms Configuration" to auto-generate them.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ----------------- RENDERER: 2. TERM VIEW ----------------- */}
            {timelinePreset === 'term' && (
              <div className="space-y-6">
                {terms.filter(t => (timelineSessionId === 'All' || t.sessionId === timelineSessionId) && (timelineTermId === 'All' || t.id === timelineTermId)).map(term => {
                  const termEvents = filteredTimelineEvents.filter(e => e.termId === term.id);
                  const sName = academicSessions.find(s => s.id === term.sessionId)?.name || 'General';

                  return (
                    <div key={term.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                            <h4 className="font-extrabold text-slate-900 text-sm">{term.name} ({sName})</h4>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">Date span: {term.startDate} to {term.endDate}</p>
                        </div>

                        {/* Summary markers inside each term header */}
                        <div className="flex flex-wrap items-center gap-2">
                          {['Completed', 'Current', 'Upcoming', 'Overdue'].map(st => {
                            const count = termEvents.filter(e => getEventStatusAndColor(e).status === st).length;
                            let colorBadge = 'bg-slate-100 text-slate-600';
                            if (st === 'Completed') colorBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-150';
                            if (st === 'Current') colorBadge = 'bg-blue-50 text-blue-700 border border-blue-150';
                            if (st === 'Upcoming') colorBadge = 'bg-amber-50 text-amber-700 border border-amber-150';
                            if (st === 'Overdue') colorBadge = 'bg-rose-50 text-rose-700 border border-rose-150';

                            return (
                              <span key={st} className={`px-2 py-0.5 rounded text-[9px] font-bold ${colorBadge}`}>
                                {st}: {count}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Horizontal progress visualization pipeline */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                        {['Completed', 'Current', 'Upcoming', 'Overdue'].map(statusScope => {
                          const statusEvents = termEvents.filter(e => getEventStatusAndColor(e).status === statusScope);
                          
                          let bgClass = "bg-slate-50";
                          let borderAccent = "border-slate-200";
                          let textAccent = "text-slate-700";
                          let ringDot = "bg-slate-400";

                          if (statusScope === 'Completed') {
                            bgClass = "bg-emerald-50/20";
                            borderAccent = "border-emerald-100";
                            textAccent = "text-emerald-800";
                            ringDot = "bg-emerald-500";
                          } else if (statusScope === 'Current') {
                            bgClass = "bg-blue-50/20";
                            borderAccent = "border-blue-100";
                            textAccent = "text-blue-800";
                            ringDot = "bg-blue-500";
                          } else if (statusScope === 'Upcoming') {
                            bgClass = "bg-amber-50/20";
                            borderAccent = "border-amber-100";
                            textAccent = "text-amber-800";
                            ringDot = "bg-amber-500";
                          } else if (statusScope === 'Overdue') {
                            bgClass = "bg-rose-50/20";
                            borderAccent = "border-rose-100";
                            textAccent = "text-rose-800";
                            ringDot = "bg-rose-500";
                          }

                          return (
                            <div key={statusScope} className={`${bgClass} rounded-xl p-4 border ${borderAccent} space-y-3`}>
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${textAccent} flex items-center space-x-1.5`}>
                                  <span className={`w-2 h-2 rounded-full ${ringDot}`} />
                                  <span>{statusScope}</span>
                                </span>
                                <span className="text-[10px] font-black text-slate-500">{statusEvents.length}</span>
                              </div>

                              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                {statusEvents.map(evt => (
                                  <div key={evt.id} className="p-3 bg-white border border-slate-200/70 rounded-lg shadow-3xs space-y-1.5">
                                    <h5 className="font-bold text-slate-800 text-[11px] leading-tight">{evt.title}</h5>
                                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold font-mono">
                                      <span>{evt.startDate}</span>
                                      <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-500">{evt.branchId === 'All' ? 'All' : evt.branchId}</span>
                                    </div>
                                  </div>
                                ))}

                                {statusEvents.length === 0 && (
                                  <p className="text-[10px] text-slate-400 italic py-4 text-center">No active {statusScope} events.</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ----------------- RENDERER: 3. MONTH VIEW ----------------- */}
            {timelinePreset === 'month' && (() => {
              // Group items dynamically by month of start date
              const monthsMap: { [key: string]: AcademicEvent[] } = {};
              filteredTimelineEvents.forEach(evt => {
                let monthLabel = "General Academic Window";
                try {
                  if (evt.startDate) {
                    const dateObj = new Date(evt.startDate);
                    monthLabel = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                  }
                } catch (e) {}
                
                if (!monthsMap[monthLabel]) {
                  monthsMap[monthLabel] = [];
                }
                monthsMap[monthLabel].push(evt);
              });

              const sortedMonths = Object.keys(monthsMap).sort((a, b) => {
                // Approximate sort by turning label into date
                return new Date(a).getTime() - new Date(b).getTime();
              });

              return (
                <div className="space-y-6">
                  {sortedMonths.map(month => {
                    const monthEvents = monthsMap[month];

                    return (
                      <div key={month} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                            <CalendarDays className="w-4 h-4 text-indigo-600" />
                            <span>{month}</span>
                          </h4>
                          <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
                            {monthEvents.length} events
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {monthEvents.map(evt => {
                            const { status, borderClass, bgGradient, textClass } = getEventStatusAndColor(evt);
                            const matchedCat = eventCategories.find(c => c.id === evt.categoryId);

                            return (
                              <div key={evt.id} className={`p-4 bg-gradient-to-br ${bgGradient} border border-slate-200/80 rounded-xl shadow-3xs flex flex-col justify-between space-y-3`}>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-l-4 ${borderClass} bg-white shadow-3xs ${textClass}`}>
                                      {status}
                                    </span>
                                    {matchedCat && (
                                      <span className="text-[9px] text-slate-400 font-bold flex items-center space-x-1">
                                        <CategoryIcon name={matchedCat.icon} className="w-3 h-3 text-slate-400" />
                                        <span>{matchedCat.name}</span>
                                      </span>
                                    )}
                                  </div>

                                  <h5 className="font-extrabold text-slate-800 text-[11px] leading-snug pt-1">{evt.title}</h5>
                                  <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{evt.description || "No specific guidelines provided."}</p>
                                </div>

                                <div className="text-[9px] text-slate-400 font-bold flex items-center justify-between pt-2 border-t border-slate-100/60">
                                  <span>📅 {evt.startDate} to {evt.endDate}</span>
                                  <span className="bg-white/80 px-1.5 py-0.5 rounded text-slate-500 border border-slate-100 uppercase">{evt.branchId === 'All' ? 'All' : evt.branchId}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {sortedMonths.length === 0 && (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                      <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <h5 className="font-extrabold text-slate-700 text-xs">No Events Grouped By Month</h5>
                      <p className="text-[10px] text-slate-400">Verify your session/term selection filters or register events in the scheduling hub.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ----------------- RENDERER: 4. WEEK VIEW ----------------- */}
            {timelinePreset === 'week' && (() => {
              // Group events by Term name + calculated week number
              const weeksMap: { [key: string]: AcademicEvent[] } = {};
              filteredTimelineEvents.forEach(evt => {
                const termObj = terms.find(t => t.id === evt.termId);
                let weekLabel = "General Sprints";

                if (termObj && evt.startDate) {
                  try {
                    const termStart = new Date(termObj.startDate).getTime();
                    const evtStart = new Date(evt.startDate).getTime();
                    const diffDays = Math.floor((evtStart - termStart) / (1000 * 60 * 60 * 24));
                    const weekNum = Math.max(1, Math.ceil((diffDays + 1) / 7));
                    weekLabel = `${termObj.name} - Week ${weekNum}`;
                  } catch (e) {}
                }

                if (!weeksMap[weekLabel]) {
                  weeksMap[weekLabel] = [];
                }
                weeksMap[weekLabel].push(evt);
              });

              const sortedWeeks = Object.keys(weeksMap).sort();

              return (
                <div className="space-y-6">
                  {sortedWeeks.map(week => {
                    const weekEvents = weeksMap[week];

                    return (
                      <div key={week} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <h4 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span>{week}</span>
                          </h4>
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {weekEvents.length} active tasks
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100 space-y-3">
                          {weekEvents.map(evt => {
                            const { status, badgeClass, dotClass } = getEventStatusAndColor(evt);
                            const matchedCat = eventCategories.find(c => c.id === evt.categoryId);

                            return (
                              <div key={evt.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-start space-x-3">
                                  <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dotClass}`} />
                                  <div>
                                    <h5 className="font-bold text-slate-800 text-xs leading-snug">{evt.title}</h5>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{evt.description || "No remarks provided for this operational window."}</p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2.5 shrink-0 self-start sm:self-auto pl-5 sm:pl-0">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${badgeClass}`}>
                                    {status}
                                  </span>
                                  {matchedCat && (
                                    <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                                      <CategoryIcon name={matchedCat.icon} className="w-3 h-3 text-slate-500" />
                                      <span>{matchedCat.name}</span>
                                    </span>
                                  )}
                                  <span className="text-[9px] text-slate-400 font-bold font-mono">📅 {evt.startDate}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {sortedWeeks.length === 0 && (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <h5 className="font-extrabold text-slate-700 text-xs">No Events Grouped By Operational Sprints</h5>
                      <p className="text-[10px] text-slate-400">Check your search key filters or add events specifying standard term boundaries.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ----------------- RENDERER: 5. AGENDA VIEW ----------------- */}
            {timelinePreset === 'agenda' && (() => {
              // Sort events chronologically by startDate
              const chronEvents = [...filteredTimelineEvents].sort((a, b) => {
                return a.startDate.localeCompare(b.startDate);
              });

              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6">
                  <div className="pb-3 border-b border-slate-100">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-500">Chronological System Agenda</h4>
                  </div>

                  {/* Vertical interactive thread */}
                  <div className="relative pl-6 space-y-6 before:absolute before:top-1.5 before:bottom-1.5 before:left-2.5 before:w-0.5 before:bg-slate-150 before:border-dashed before:border-slate-200 animate-fade-in">
                    {chronEvents.map((evt) => {
                      const { status, dotClass, badgeClass } = getEventStatusAndColor(evt);
                      const matchedCat = eventCategories.find(c => c.id === evt.categoryId);
                      const matchedSession = academicSessions.find(s => s.id === evt.sessionId);
                      const matchedTerm = terms.find(t => t.id === evt.termId);

                      return (
                        <div key={evt.id} className="relative group/agenda">
                          {/* Chronological bullet marker */}
                          <div className={`absolute -left-[21.5px] top-1.5 w-3.5 h-3.5 rounded-full ring-4 bg-white transition-all group-hover/agenda:scale-125 ${dotClass}`} />

                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="space-y-1.5">
                              {/* Date & Tags Strip */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold font-mono text-indigo-600 text-[10px] bg-indigo-50 px-2 py-0.5 rounded">
                                  📅 {evt.startDate} to {evt.endDate}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badgeClass}`}>
                                  {status}
                                </span>
                                {matchedCat && (
                                  <span className="text-[9px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                                    <CategoryIcon name={matchedCat.icon} className="w-3 h-3 text-slate-400" />
                                    <span>{matchedCat.name}</span>
                                  </span>
                                )}
                              </div>

                              <h5 className="font-extrabold text-slate-900 text-xs">{evt.title}</h5>
                              <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl">{evt.description || "No specific guidelines recorded for this administrative segment."}</p>
                            </div>

                            {/* Session / Context labels */}
                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-1.5 text-[9px] font-bold text-slate-400 shrink-0 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                              <span className="uppercase tracking-wider">Branch: {evt.branchId === 'All' ? 'All Campuses' : evt.branchId === 'GN' ? 'Gawun Nama' : 'Runjin Sambo'}</span>
                              {matchedSession && <span className="text-slate-500 font-mono text-[8px]">{matchedSession.name}</span>}
                              {matchedTerm && <span className="text-indigo-600 font-semibold">{matchedTerm.name}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {chronEvents.length === 0 && (
                      <div className="py-12 text-center text-slate-400">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <h5 className="font-extrabold text-slate-700 text-xs">No Chronological Agenda Recorded</h5>
                        <p className="text-[10px] text-slate-400">Reset your filter criteria above or check the active academic sessions.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        );
      })()}

      {/* ----------------- SUB TAB 7: EVENT TASK TRACKER ----------------- */}
      {activeSubTab === 'event_tasks' && (() => {
        const getTaskStatusColor = (status: string) => {
          switch (status) {
            case 'Pending':
              return {
                badge: 'bg-slate-50 text-slate-700 border border-slate-200',
                dot: 'bg-slate-400',
                bg: 'bg-slate-50/40 border-slate-200'
              };
            case 'In Progress':
              return {
                badge: 'bg-blue-50 text-blue-700 border border-blue-200',
                dot: 'bg-blue-500 ring-blue-100',
                bg: 'bg-blue-50/20 border-blue-100'
              };
            case 'Completed':
              return {
                badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                dot: 'bg-emerald-500 ring-emerald-100',
                bg: 'bg-emerald-50/20 border-emerald-100'
              };
            case 'Overdue':
              return {
                badge: 'bg-rose-50 text-rose-700 border border-rose-200',
                dot: 'bg-rose-500 ring-rose-100',
                bg: 'bg-rose-50/20 border-rose-100'
              };
            default:
              return {
                badge: 'bg-slate-50 text-slate-600 border border-slate-200',
                dot: 'bg-slate-400',
                bg: 'bg-slate-50/20 border-slate-200'
              };
          }
        };

        const filteredTasks = eventTasks.filter(task => {
          const matchesSearch = task.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                                task.description.toLowerCase().includes(taskSearch.toLowerCase()) ||
                                task.assignedUser.toLowerCase().includes(taskSearch.toLowerCase());
          const matchesEvent = taskFilterEventId === 'All' || task.eventId === taskFilterEventId;
          const matchesStatus = taskFilterStatus === 'All' || task.status === taskFilterStatus;
          return matchesSearch && matchesEvent && matchesStatus;
        });

        const taskStats = {
          total: filteredTasks.length,
          pending: filteredTasks.filter(t => t.status === 'Pending').length,
          inProgress: filteredTasks.filter(t => t.status === 'In Progress').length,
          completed: filteredTasks.filter(t => t.status === 'Completed').length,
          overdue: filteredTasks.filter(t => t.status === 'Overdue').length,
        };

        const handleAddTaskClick = (presetType?: 'teaching_record' | 'lesson_plan' | 'curriculum_progress' | 'scheme_review') => {
          setEditingTask(null);
          setValidationError(null);
          
          if (presetType === 'teaching_record') {
            setTaskForm({
              eventId: events[0]?.id || 'evt-1',
              title: 'Weekly Teaching Record',
              description: 'Log classroom instruction topics, board work layout, student notebook instructions, and book work coverage counts.',
              assignedUser: 'All Teachers',
              dueDate: '2026-07-10',
              status: 'In Progress',
              dueTime: '17:00',
              taskType: 'teaching_record',
              week: 1,
              assignedRole: 'Teacher',
              reminderNotice: 'Due Friday at 5:00 PM. Please attach photos of classroom board and notebook samples.',
              submissionStatus: 'Pending',
              submissionDate: '',
              submissionTime: '',
              daysLate: 0
            });
          } else if (presetType === 'lesson_plan') {
            setTaskForm({
              eventId: events[0]?.id || 'evt-1',
              title: 'Weekly Lesson Plan',
              description: 'Submit structured weekly lesson plans, behavioral objectives, learning aids, and assessment strategies.',
              assignedUser: 'All Teachers',
              dueDate: '2026-07-06',
              status: 'Pending',
              dueTime: '08:00',
              taskType: 'lesson_plan',
              week: 2,
              assignedRole: 'Teacher',
              reminderNotice: 'Due Monday at 8:00 AM before first period assembly.',
              submissionStatus: 'Pending',
              submissionDate: '',
              submissionTime: '',
              daysLate: 0
            });
          } else if (presetType === 'curriculum_progress') {
            setTaskForm({
              eventId: events[0]?.id || 'evt-1',
              title: 'Monthly Curriculum Progress',
              description: 'Audit syllabus milestones coverage vs. scheme of work for the entire month across all assigned grades.',
              assignedUser: 'All Teachers',
              dueDate: '2026-07-31',
              status: 'Pending',
              dueTime: '16:00',
              taskType: 'curriculum_progress',
              week: 4,
              assignedRole: 'Teacher',
              reminderNotice: 'Due at the end of the month. Compare planned topics vs taught topics.',
              submissionStatus: 'Pending',
              submissionDate: '',
              submissionTime: '',
              daysLate: 0
            });
          } else if (presetType === 'scheme_review') {
            setTaskForm({
              eventId: events[0]?.id || 'evt-1',
              title: 'Scheme of Work Review',
              description: 'Departmental Scheme of Work progress audit, curriculum pace check, and remedial adjustment review.',
              assignedUser: 'All Teachers',
              dueDate: '2026-07-17',
              status: 'Pending',
              dueTime: '15:00',
              taskType: 'scheme_review',
              week: 4,
              assignedRole: 'Teacher',
              reminderNotice: 'Due Week 4 Friday. Review milestone pacing and student work coverage.',
              submissionStatus: 'Pending',
              submissionDate: '',
              submissionTime: '',
              daysLate: 0
            });
          } else {
            setTaskForm({
              eventId: events[0]?.id || '',
              title: '',
              description: '',
              assignedUser: '',
              dueDate: '',
              status: 'Pending',
              dueTime: '17:00',
              taskType: 'general',
              week: 1,
              assignedRole: 'Teacher',
              reminderNotice: '',
              submissionStatus: 'Pending',
              submissionDate: '',
              submissionTime: '',
              daysLate: 0
            });
          }
          setTaskModalOpen(true);
        };

        const handleEditTaskClick = (task: EventTask) => {
          setEditingTask(task);
          setValidationError(null);
          setTaskForm({
            eventId: task.eventId,
            title: task.title,
            description: task.description,
            assignedUser: task.assignedUser,
            dueDate: task.dueDate,
            status: task.status,
            dueTime: task.dueTime || '17:00',
            taskType: task.taskType || 'general',
            week: task.week || 1,
            assignedRole: task.assignedRole || 'Teacher',
            reminderNotice: task.reminderNotice || '',
            submissionStatus: task.submissionStatus || 'Pending',
            submissionDate: task.submissionDate || '',
            submissionTime: task.submissionTime || '',
            daysLate: task.daysLate || 0
          });
          setTaskModalOpen(true);
        };

        return (
          <div id="subtab-event-tasks" className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base leading-tight">
                  Event Task &amp; Teaching Deadlines Management
                </h3>
                <p className="text-[11px] text-slate-500">
                  Operational action items and teaching deadlines synced across Teacher Dashboard, Calendar, and Operations Timeline.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleAddTaskClick('teaching_record')}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Weekly Record (Fri)</span>
                </button>
                <button
                  onClick={() => handleAddTaskClick('lesson_plan')}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Lesson Plan (Mon)</span>
                </button>
                <button
                  onClick={() => handleAddTaskClick('curriculum_progress')}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Monthly Progress</span>
                </button>
                <button
                  onClick={() => handleAddTaskClick('scheme_review')}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Scheme Review</span>
                </button>
                <button
                  onClick={() => handleAddTaskClick()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Custom Task</span>
                </button>
              </div>
            </div>

            {/* KPI METRICS STRIP */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tasks</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-slate-900">{taskStats.total}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-50/40 to-white rounded-2xl border border-slate-200 p-4 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-slate-800">{taskStats.pending}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50/40 to-white rounded-2xl border border-blue-150 p-4 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">In Progress</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-blue-800">{taskStats.inProgress}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50/40 to-white rounded-2xl border border-emerald-150 p-4 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completed</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-emerald-800">{taskStats.completed}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-50/40 to-white rounded-2xl border border-rose-150 p-4 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Overdue</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-rose-800">{taskStats.overdue}</span>
                </div>
              </div>
            </div>

            {/* INTERACTIVE CONTROLS / FILTERS BAR */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search keywords */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Tasks or User</label>
                <input
                  type="text"
                  placeholder="Search title, details, assignees..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              {/* Filter by Parent Event */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parent Event Scope</label>
                <select
                  value={taskFilterEventId}
                  onChange={(e) => setTaskFilterEventId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="All">All Scheduled Events</option>
                  {events.map(evt => (
                    <option key={evt.id} value={evt.id}>{evt.title}</option>
                  ))}
                </select>
              </div>

              {/* Filter by Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Task Status Scope</label>
                <select
                  value={taskFilterStatus}
                  onChange={(e) => setTaskFilterStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* GRID OF TASKS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map(task => {
                const parentEvent = events.find(e => e.id === task.eventId);
                const colors = getTaskStatusColor(task.status);
                const UserIcon = (Lucide as any).User || Lucide.Calendar;

                const getTaskTypeBadge = (type?: string) => {
                  switch (type) {
                    case 'teaching_record':
                      return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">Teaching Record (Fri)</span>;
                    case 'lesson_plan':
                      return <span className="bg-teal-100 text-teal-800 border border-teal-200 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">Lesson Plan (Mon)</span>;
                    case 'curriculum_progress':
                      return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">Curriculum Progress</span>;
                    case 'scheme_review':
                      return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">Scheme Review</span>;
                    default:
                      return null;
                  }
                };

                return (
                  <div 
                    key={task.id} 
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-3xs flex flex-col justify-between space-y-4 hover:border-slate-350 hover:shadow-2xs transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${colors.badge} flex items-center space-x-1`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                            <span>{task.status}</span>
                          </span>
                          {getTaskTypeBadge(task.taskType)}
                        </div>
                        
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleEditTaskClick(task)}
                            className="p-1 rounded bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-slate-100 cursor-pointer transition-colors"
                            title="Edit Task"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100 border border-rose-100 cursor-pointer transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-xs leading-snug">{task.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-normal line-clamp-3 font-medium">
                          {task.description || "No specific guidelines provided."}
                        </p>
                      </div>

                      {/* Reminder Notice */}
                      {task.reminderNotice && (
                        <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2 flex items-start space-x-1.5 text-[10px] text-amber-800 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{task.reminderNotice}</span>
                        </div>
                      )}

                      {/* Submission Tracking Status */}
                      {task.submissionStatus && task.submissionStatus !== 'Pending' && (
                        <div className={`p-2 rounded-lg border text-[10px] font-semibold flex items-center justify-between ${
                          task.submissionStatus === 'Submitted On Time' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{task.submissionStatus}</span>
                          </div>
                          {task.submissionDate && (
                            <span className="text-[9px] font-mono text-slate-500">
                              {task.submissionDate} {task.submissionTime ? `@ ${task.submissionTime}` : ''}
                            </span>
                          )}
                        </div>
                      )}

                      {task.status === 'Overdue' && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-lg text-[10px] font-bold flex items-center space-x-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Not Submitted • Overdue</span>
                          {task.daysLate ? <span className="text-[9px] bg-rose-200 px-1.5 py-0.5 rounded font-mono">({task.daysLate} days late)</span> : null}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {/* Parent Event details */}
                      {parentEvent && (
                        <div className="flex items-center space-x-1 text-[10px] text-indigo-700 font-extrabold truncate bg-indigo-50/60 px-2.5 py-1 rounded border border-indigo-100">
                          <span className="uppercase tracking-wider text-[8px] text-indigo-500 shrink-0">Event:</span>
                          <span className="truncate">{parentEvent.title}</span>
                        </div>
                      )}

                      {/* Assignee & Due Date Row */}
                      <div className="flex items-center justify-between gap-2 text-[9px] text-slate-400 font-bold font-mono">
                        <div className="flex items-center space-x-1 text-slate-600 truncate max-w-[60%]">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{task.assignedUser}</span>
                        </div>
                        <span className="bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded text-slate-500 shrink-0">
                          📅 Due {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h5 className="font-extrabold text-slate-700 text-xs">No Scheduled Tasks Found</h5>
                  <p className="text-[10px] text-slate-400">Add operational deliverables by clicking "Create New Task" above.</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ----------------- SUB TAB 8: EVENT ASSIGNMENT MANAGEMENT ----------------- */}
      {activeSubTab === 'event_assignments' && (() => {
        const getRoleBadgeColor = (role: string) => {
          switch (role) {
            case 'Teacher':
              return 'bg-teal-50 text-teal-700 border-teal-200';
            case 'Accountant':
              return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Administrator':
              return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'Store Manager':
              return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            default:
              return 'bg-slate-50 text-slate-700 border-slate-200';
          }
        };

        const filteredAssignments = eventAssignments.filter(asg => {
          const matchesSearch = asg.assignedUser.toLowerCase().includes(asgSearch.toLowerCase());
          const matchesRole = asgFilterRole === 'All' || asg.assignedRole === asgFilterRole;
          const matchesTask = asgFilterTaskId === 'All' || asg.taskId === asgFilterTaskId;
          return matchesSearch && matchesRole && matchesTask;
        });

        // Compute analytics
        const totalAsgs = filteredAssignments.length;
        const completedAsgs = filteredAssignments.filter(a => !!a.completionDate).length;
        const pendingAsgs = totalAsgs - completedAsgs;
        
        const roleCounts = {
          Teacher: filteredAssignments.filter(a => a.assignedRole === 'Teacher').length,
          Accountant: filteredAssignments.filter(a => a.assignedRole === 'Accountant').length,
          Administrator: filteredAssignments.filter(a => a.assignedRole === 'Administrator').length,
          StoreManager: filteredAssignments.filter(a => a.assignedRole === 'Store Manager').length,
        };

        const handleAddAsgClick = () => {
          setEditingAsg(null);
          setValidationError(null);
          setAsgForm({
            taskId: eventTasks[0]?.id || '',
            assignedUser: '',
            assignedRole: 'Teacher',
            assignedDate: new Date().toISOString().split('T')[0],
            completionDate: ''
          });
          setAsgModalOpen(true);
        };

        const handleEditAsgClick = (asg: EventAssignment) => {
          setEditingAsg(asg);
          setValidationError(null);
          setAsgForm({
            taskId: asg.taskId,
            assignedUser: asg.assignedUser,
            assignedRole: asg.assignedRole,
            assignedDate: asg.assignedDate,
            completionDate: asg.completionDate || ''
          });
          setAsgModalOpen(true);
        };

        const toggleCompletion = async (asg: EventAssignment) => {
          try {
            const updatedDate = asg.completionDate ? "" : new Date().toISOString().split('T')[0];
            const updatedForm = {
              taskId: asg.taskId,
              assignedUser: asg.assignedUser,
              assignedRole: asg.assignedRole,
              assignedDate: asg.assignedDate,
              completionDate: updatedDate
            };
            const res = await fetch(`/api/event_assignments/${asg.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedForm)
            });
            if (!res.ok) throw new Error("Failed to change completion status.");
            const updated = await res.json();
            setEventAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
          } catch (err: any) {
            alert(err.message || "Failed to update completion status.");
          }
        };

        return (
          <div id="subtab-event-assignments" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base leading-tight">
                  Task Assignment & Role Management
                </h3>
                <p className="text-[11px] text-slate-500">
                  Assign administrative school tasks to Teachers, Accountants, Administrators, and Store Managers. Track active timelines and milestone sign-offs.
                </p>
              </div>

              <button
                onClick={handleAddAsgClick}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Staff Member</span>
              </button>
            </div>

            {/* KPI METRICS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Assignments</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-slate-900">{totalAsgs}</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  <span className="font-bold text-emerald-600">{completedAsgs} Done</span> • <span>{pendingAsgs} Active</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-teal-50/30 to-white rounded-2xl border border-teal-100 p-4 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Teachers Engaged</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-teal-800">{roleCounts.Teacher}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50/30 to-white rounded-2xl border border-amber-100 p-4 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Accountants Engaged</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-amber-800">{roleCounts.Accountant}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50/30 to-white rounded-2xl border border-purple-100 p-4 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Admins & Managers</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-purple-800">{roleCounts.Administrator + roleCounts.StoreManager}</span>
                </div>
              </div>
            </div>

            {/* FILTER CONTROLS BAR */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search assignee */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Staff Member</label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. Aisha Abubakar"
                  value={asgSearch}
                  onChange={(e) => setAsgSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              {/* Filter by Role */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Staff Role Filter</label>
                <select
                  value={asgFilterRole}
                  onChange={(e) => setAsgFilterRole(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="All">All Roles</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Store Manager">Store Manager</option>
                </select>
              </div>

              {/* Filter by Parent Task */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Linked Event Task</label>
                <select
                  value={asgFilterTaskId}
                  onChange={(e) => setAsgFilterTaskId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="All">All Tasks</option>
                  {eventTasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ASSIGNMENTS DISPLAY LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments.map(asg => {
                const matchedTask = eventTasks.find(t => t.id === asg.taskId);
                const matchedEvent = matchedTask ? events.find(e => e.id === matchedTask.eventId) : null;
                const badgeColor = getRoleBadgeColor(asg.assignedRole);
                const isCompleted = !!asg.completionDate;

                return (
                  <div 
                    key={asg.id}
                    className={`bg-white rounded-xl border p-4 shadow-3xs flex flex-col justify-between space-y-4 hover:shadow-2xs transition-all ${
                      isCompleted ? 'border-emerald-200 bg-emerald-50/5' : 'border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top status bar inside card */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {asg.assignedRole}
                        </span>

                        <div className="flex items-center space-x-1 shrink-0">
                          {/* Toggle Completion State */}
                          <button
                            onClick={() => toggleCompletion(asg)}
                            className={`p-1 rounded border cursor-pointer transition-colors ${
                              isCompleted 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                            }`}
                            title={isCompleted ? "Mark as Active" : "Sign-off Completion"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleEditAsgClick(asg)}
                            className="p-1 rounded bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-slate-150 cursor-pointer transition-colors"
                            title="Edit Assignment"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteAssignment(asg.id)}
                            className="p-1 rounded bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100 border border-rose-150 cursor-pointer transition-colors"
                            title="Delete Assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Staff Identity */}
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                          {asg.assignedUser}
                        </h4>
                        
                        {/* Parent Task Connection */}
                        {matchedTask && (
                          <div className="bg-slate-50 rounded border border-slate-150 p-2 text-[10px] space-y-1.5">
                            <div className="text-slate-500 font-bold leading-normal">
                              <span className="text-[8px] uppercase tracking-wider text-slate-400 block mb-0.5 font-mono">Linked Task:</span>
                              {matchedTask.title}
                            </div>
                            {matchedEvent && (
                              <span className="inline-block text-[8px] font-extrabold text-indigo-700 uppercase bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100">
                                📅 {matchedEvent.title}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline Tracker Strip */}
                    <div className="pt-3 border-t border-slate-100 text-[10px] font-mono font-bold text-slate-500 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block uppercase tracking-wider font-sans">Assigned Date</span>
                        <span>📅 {asg.assignedDate}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block uppercase tracking-wider font-sans">Completion Status</span>
                        {isCompleted ? (
                          <span className="text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center w-fit space-x-1 mt-0.5">
                            <span>✓ {asg.completionDate}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150 flex items-center w-fit space-x-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredAssignments.length === 0 && (
                <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h5 className="font-extrabold text-slate-700 text-xs">No Assignments Found</h5>
                  <p className="text-[10px] text-slate-400">Create an assignment above to allocate this task to school staff members.</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ----------------- SUB TAB 9: PROGRESS & READINESS DASHBOARD ----------------- */}
      {activeSubTab === 'progress_dashboard' && (() => {
        // Dynamic state mapping of all events with their completed tasks
        const computedEventsProgress = events.map(evt => {
          const tasks = eventTasks.filter(t => t.eventId === evt.id);
          const completedTasks = tasks.filter(t => t.status === 'Completed');
          const taskProgress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

          const taskIds = tasks.map(t => t.id);
          const asgs = eventAssignments.filter(a => taskIds.includes(a.taskId));
          const completedAsgs = asgs.filter(a => !!a.completionDate);
          
          const totalItems = tasks.length + asgs.length;
          const completedItems = completedTasks.length + completedAsgs.length;
          const readinessIndex = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

          return {
            ...evt,
            tasks,
            completedTasks,
            taskProgress,
            asgs,
            completedAsgs,
            readinessIndex,
            totalItems
          };
        });

        // Set default selected event for interactive readiness checklist if none is selected
        if (!selectedDashboardEventId && events.length > 0) {
          setSelectedDashboardEventId(events[0].id);
        }

        const activeEventDetails = computedEventsProgress.find(e => e.id === selectedDashboardEventId);

        // Calculate average school-wide readiness
        const eventsWithMetrics = computedEventsProgress.filter(e => e.totalItems > 0);
        const schoolWideReadiness = eventsWithMetrics.length > 0
          ? Math.round(eventsWithMetrics.reduce((acc, curr) => acc + curr.readinessIndex, 0) / eventsWithMetrics.length)
          : 0;

        const totalSchoolTasks = eventTasks.length;
        const completedSchoolTasks = eventTasks.filter(t => t.status === 'Completed').length;
        const taskCompletionRate = totalSchoolTasks > 0 ? Math.round((completedSchoolTasks / totalSchoolTasks) * 100) : 0;

        const totalSchoolAsgs = eventAssignments.length;
        const completedSchoolAsgs = eventAssignments.filter(a => !!a.completionDate).length;
        const asgSignOffRate = totalSchoolAsgs > 0 ? Math.round((completedSchoolAsgs / totalSchoolAsgs) * 100) : 0;

        // Interactive Checklist Setup for selected event
        const defaultChecklist = {
          papersSubmitted: false,
          timetablePublished: false,
          invigilatorsAssigned: false,
          hallsConfigured: false,
          stationeryStocked: false
        };

        const currentChecklist = readinessChecklist[selectedDashboardEventId] || defaultChecklist;

        const handleToggleChecklistFactor = (factorKey: keyof typeof defaultChecklist) => {
          setReadinessChecklist(prev => {
            const current = prev[selectedDashboardEventId] || { ...defaultChecklist };
            return {
              ...prev,
              [selectedDashboardEventId]: {
                ...current,
                [factorKey]: !current[factorKey]
              }
            };
          });
        };

        // Calculate interactive checklist readiness score
        const checklistCheckedCount = Object.values(currentChecklist).filter(Boolean).length;
        const checklistProgress = Math.round((checklistCheckedCount / 5) * 100);

        const handleQuickToggleTask = async (task: EventTask) => {
          try {
            const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
            const updatedForm = {
              eventId: task.eventId,
              title: task.title,
              description: task.description,
              assignedUser: task.assignedUser,
              dueDate: task.dueDate,
              status: nextStatus
            };
            const res = await fetch(`/api/event_tasks/${task.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedForm)
            });
            if (!res.ok) throw new Error("Failed to change task status.");
            const updated = await res.json();
            setEventTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
          } catch (err: any) {
            alert(err.message || "Failed to toggle task status.");
          }
        };

        return (
          <div id="subtab-progress-dashboard" className="space-y-6">
            
            {/* OPERATIONAL INTRODUCTION & FORMULA ALERT */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-400/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                    Operational Control Centre
                  </span>
                  <span className="text-[11px] text-slate-300 font-bold">• Formula-Driven Metrics</span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white">Progress & Readiness Dashboard</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  This system dynamically maps the completion status of registered **Event Tasks** and the sign-off rate of **Staff Assignments** to calculate institutional readiness in real time.
                </p>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-xs border border-slate-700/50 rounded-xl p-4 shrink-0 w-full md:w-80 space-y-2">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Quantitative Equations</span>
                <div className="text-[10px] space-y-1.5 font-mono text-slate-200">
                  <div className="flex justify-between border-b border-slate-700/40 pb-1">
                    <span className="text-indigo-300">Event Progress</span>
                    <span className="font-extrabold text-white">Tasks Completed %</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-300">Readiness Index</span>
                    <span className="font-extrabold text-white">Tasks + Staff Signed-Off %</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN STATS STRIP */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">School-Wide Readiness</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-indigo-950">{schoolWideReadiness}%</span>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Live DB</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${schoolWideReadiness}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-2">Weighted average across active scheduled events.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered Tasks</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-slate-900">{totalSchoolTasks}</span>
                  <span className="text-xs font-bold text-slate-500">({completedSchoolTasks} Done)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${taskCompletionRate}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-2">Task completion efficiency at **{taskCompletionRate}%**.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staff Assignments Status</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-slate-900">{totalSchoolAsgs}</span>
                  <span className="text-xs font-bold text-slate-500">({completedSchoolAsgs} Signed)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${asgSignOffRate}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-2">Assignment sign-off rate at **{asgSignOffRate}%**.</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50/20 to-white rounded-2xl border border-indigo-150 p-5 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Events with Action Items</span>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-indigo-900">{eventsWithMetrics.length}</span>
                  <span className="text-xs font-bold text-indigo-500">/ {events.length} Events</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${events.length > 0 ? Math.round((eventsWithMetrics.length / events.length) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-2">Events actively mapped to specific tasks.</p>
              </div>
            </div>

            {/* BENTO BLOCK: HIGH-STAKES EXAMINATION READINESS PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* INTERACTIVE READINESS CHECKLIST FOR SELECTED EVENT */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <h4 className="font-extrabold text-slate-950 text-sm leading-tight">High-Stakes Examination Readiness</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Select a scheduled exam or administrative event to manage and configure operational factors.
                  </p>
                </div>

                {/* Event Dropdown selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Academic Event</label>
                  <select
                    value={selectedDashboardEventId}
                    onChange={(e) => setSelectedDashboardEventId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer font-bold text-slate-700"
                  >
                    {events.map(evt => (
                      <option key={evt.id} value={evt.id}>{evt.title}</option>
                    ))}
                  </select>
                </div>

                {activeEventDetails ? (
                  <div className="space-y-4 pt-1">
                    {/* Visual Progress ring/meter */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Dynamic Checklist Readiness</span>
                        <div className="text-2xl font-black text-slate-900">{checklistProgress}%</div>
                        <p className="text-[9px] text-slate-400">Based on interactive operational factors below.</p>
                      </div>
                      <div className="relative w-14 h-14">
                        {/* Circle meter */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-rose-500 transition-all duration-500"
                            strokeWidth="3.5"
                            strokeDasharray={`${checklistProgress}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                          {checklistCheckedCount}/5
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE TOGGLE LIST */}
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-extrabold text-slate-400 tracking-widest block uppercase">Readiness Milestones Checklist</span>
                      
                      <div className="space-y-2">
                        {/* Milestones togglers */}
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistFactor('papersSubmitted')}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            currentChecklist.papersSubmitted 
                              ? 'bg-rose-50/50 border-rose-200/80 text-rose-950 font-bold' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              currentChecklist.papersSubmitted ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300'
                            }`}>
                              {currentChecklist.papersSubmitted && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-xs font-semibold">1. Question Papers Submitted & Moderated</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleChecklistFactor('timetablePublished')}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            currentChecklist.timetablePublished 
                              ? 'bg-rose-50/50 border-rose-200/80 text-rose-950 font-bold' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              currentChecklist.timetablePublished ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300'
                            }`}>
                              {currentChecklist.timetablePublished && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-xs font-semibold">2. Examination Timetable Published</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleChecklistFactor('invigilatorsAssigned')}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            currentChecklist.invigilatorsAssigned 
                              ? 'bg-rose-50/50 border-rose-200/80 text-rose-950 font-bold' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              currentChecklist.invigilatorsAssigned ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300'
                            }`}>
                              {currentChecklist.invigilatorsAssigned && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-xs font-semibold">3. Invigilators Appointed & Notified</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleChecklistFactor('hallsConfigured')}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            currentChecklist.hallsConfigured 
                              ? 'bg-rose-50/50 border-rose-200/80 text-rose-950 font-bold' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              currentChecklist.hallsConfigured ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300'
                            }`}>
                              {currentChecklist.hallsConfigured && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-xs font-semibold">4. Hall Capacity & Desk Setup Ready</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleChecklistFactor('stationeryStocked')}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            currentChecklist.stationeryStocked 
                              ? 'bg-rose-50/50 border-rose-200/80 text-rose-950 font-bold' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              currentChecklist.stationeryStocked ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300'
                            }`}>
                              {currentChecklist.stationeryStocked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-xs font-semibold">5. Stationery Stock Checked & Distributed</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    No active academic events found in database.
                  </div>
                )}
              </div>

              {/* DYNAMIC DATABASE ACTIONS TRACKER & PROGRESS TABLE */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="font-extrabold text-slate-950 text-sm leading-tight">Database Actions Controller</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Real-time interactive matrix showing task completion rates and assigned staff roles. Toggle tasks directly below to update indices immediately.
                    </p>
                  </div>

                  {activeEventDetails ? (
                    <div className="space-y-5">
                      {/* Active Event Selected Details */}
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Currently Analyzing:</span>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {activeEventDetails.title}
                          </div>
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 font-extrabold border border-indigo-100 rounded px-2 py-0.5">
                            Term ID: {activeEventDetails.termId}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic database progress indices */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-indigo-50/20 to-white rounded-xl border border-indigo-100 p-3">
                          <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-wider block">Completed Tasks Score</span>
                          <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                            {activeEventDetails.completedTasks.length} / {activeEventDetails.tasks.length}
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${activeEventDetails.taskProgress}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50/20 to-white rounded-xl border border-amber-100 p-3">
                          <span className="text-[8px] font-bold text-amber-600 uppercase tracking-wider block">Staff Assignments Signed</span>
                          <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                            {activeEventDetails.completedAsgs.length} / {activeEventDetails.asgs.length}
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${activeEventDetails.asgs.length > 0 ? Math.round((activeEventDetails.completedAsgs.length / activeEventDetails.asgs.length) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Interactive Tasks and Assignments table strip */}
                      <div className="space-y-3">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Interactive Task Controls</span>
                        
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/30">
                          {activeEventDetails.tasks.map(task => {
                            const taskAsgs = activeEventDetails.asgs.filter(a => a.taskId === task.id);
                            const isCompleted = task.status === 'Completed';

                            return (
                              <div 
                                key={task.id} 
                                className="bg-white border border-slate-150 rounded-lg p-2.5 flex items-center justify-between hover:border-slate-300 transition-all text-[11px]"
                              >
                                <div className="space-y-1 max-w-[70%]">
                                  <div className="font-bold text-slate-900 leading-snug truncate">
                                    {task.title}
                                  </div>
                                  <div className="flex items-center space-x-1.5 text-[9px] text-slate-500">
                                    <span className="font-medium text-slate-400">Assignee:</span>
                                    <span className="font-bold text-slate-700 truncate">{task.assignedUser}</span>
                                    <span>•</span>
                                    <span className="font-bold text-slate-500">{taskAsgs.length} Staff Assignment(s)</span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickToggleTask(task)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-extrabold cursor-pointer transition-all border ${
                                      isCompleted 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                                    }`}
                                  >
                                    {isCompleted ? '✓ Completed' : 'Mark Done'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {activeEventDetails.tasks.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-xs">
                              No tasks currently mapped to this event.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      Select an event to load database actions.
                    </div>
                  )}
                </div>

                {/* Holistic indices banner */}
                {activeEventDetails && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-[11px] font-medium text-slate-700 mt-4">
                    <span className="text-slate-500">Combined Readiness Score:</span>
                    <span className="font-black text-indigo-700 text-sm">
                      {activeEventDetails.readinessIndex}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* LIVE ACADEMIC EVENT PROGRESS GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-slate-950 text-sm">All Events Completion Matrix</h4>
                <span className="text-[10px] text-slate-500 font-mono font-bold">Real-Time Syncing</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {computedEventsProgress.map(evt => {
                  const hasMetrics = evt.totalItems > 0;
                  const progressColor = evt.readinessIndex > 70 
                    ? 'bg-emerald-500' 
                    : evt.readinessIndex > 30 
                      ? 'bg-amber-500' 
                      : 'bg-rose-500';

                  const badgeColors = evt.readinessIndex > 70
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : evt.readinessIndex > 30
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <div 
                      key={evt.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs hover:border-slate-350 hover:shadow-2xs transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2">
                            {evt.title}
                          </h5>
                          {hasMetrics ? (
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 border ${badgeColors}`}>
                              {evt.readinessIndex}% Ready
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 bg-slate-50 text-slate-500 border border-slate-200">
                              No Tasks
                            </span>
                          )}
                        </div>

                        {/* Status bar */}
                        {hasMetrics ? (
                          <div className="space-y-1">
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${progressColor}`} 
                                style={{ width: `${evt.readinessIndex}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-semibold font-mono">
                              <span>Tasks: {evt.completedTasks.length}/{evt.tasks.length}</span>
                              <span>Staff: {evt.completedAsgs.length}/{evt.asgs.length}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-400 font-medium italic">
                            No operational action items assigned.
                          </div>
                        )}
                      </div>

                      {/* Footer Actions inside Card */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono font-bold">
                        <span className="text-slate-400">Term Scope: {evt.termId}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDashboardEventId(evt.id);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer font-sans"
                        >
                          Configure Readiness &rarr;
                        </button>
                      </div>
                    </div>
                                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ----------------- SUB TAB 10: FEE COLLECTION CAMPAIGN PLANNER ----------------- */}
      {activeSubTab === 'fee_campaign_planner' && (() => {
        // Calculate totals across campaigns
        const totalExpected = feeCampaigns.reduce((acc, c) => acc + (c.targetCollection || 0), 0);
        const totalCollected = feeCampaigns.reduce((acc, c) => acc + (c.actualCollection || 0), 0);
        const overallPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
        const totalCampaignOutstanding = Math.max(0, totalExpected - totalCollected);
        const totalCampaignDefaulters = feeCampaigns.reduce((acc, c) => acc + (c.defaulterCount || 0), 0);

        // Pre-defined operational milestones map for standard 10-week cycle
        const milestones = [
          { week: 'Week 2', phase: 'Fee Reminder', action: 'Early communications, SMS dispatches & auto-billing', color: 'border-indigo-200 hover:border-indigo-500' },
          { week: 'Week 4', phase: 'Fee Drive Campaign', action: 'Classroom collections, parent calls & active push notifications', color: 'border-teal-200 hover:border-teal-500' },
          { week: 'Week 6', phase: 'Outstanding Fee Review', action: 'Accountant audits, direct mail alerts & parent accounts review', color: 'border-amber-200 hover:border-amber-500' },
          { week: 'Week 8', phase: 'Final Reminder', action: 'Pre-exam alerts, formal letters & late-fee calculations', color: 'border-rose-200 hover:border-rose-500' },
          { week: 'Week 10', phase: 'Management Escalation', action: 'Administrative follow-ups, payment plans & parent meetings', color: 'border-purple-200 hover:border-purple-500' }
        ];

        return (
          <div id="subtab-fee-campaign-planner" className="space-y-6">
            
            {/* EDUCATIONAL & EXPLANATORY BANNER */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-950 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-400/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                    Campaign Engine
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">• Operational Timeline Integration</span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white">Fee Collection Campaign Planner</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  We translate financial targets into standard weekly campaigns. This enables proactive collection drives rather than passive receipt logging.
                </p>
                <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>📊 <strong>Collection Rate:</strong> (Actual / Target) × 100</span>
                  <span>📉 <strong>Deficit Gap:</strong> Max(0, Target - Actual)</span>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shrink-0 w-full lg:w-96 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700/60">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Grounded Student Data</span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded font-bold">Dynamic Sync</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">Live Student Arrears</span>
                    <span className="font-extrabold text-white text-sm">₦{systemOutstandingFees.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">Student Defaulters</span>
                    <span className="font-extrabold text-white text-sm">{systemDefaulterCount} families</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ANALYTICS WIDGETS STRIP */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Collection</span>
                <div className="mt-2 text-2xl font-black text-slate-900">₦{totalExpected.toLocaleString()}</div>
                <p className="text-[9px] text-slate-500 mt-2">Aggregate of all registered campaign targets.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collected Amount</span>
                <div className="mt-2 text-2xl font-black text-emerald-700">₦{totalCollected.toLocaleString()}</div>
                <p className="text-[9px] text-emerald-600 mt-2 font-medium">Realized collection returns.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collection Percentage</span>
                <div className="mt-2 flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-indigo-950">{overallPercentage}%</span>
                  <span className="text-[10px] font-bold text-indigo-600">Avg</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${overallPercentage}%` }} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Fees</span>
                <div className="mt-2 text-2xl font-black text-rose-600">₦{totalCampaignOutstanding.toLocaleString()}</div>
                <p className="text-[9px] text-slate-500 mt-2">Campaign target collection gaps.</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50/20 to-white rounded-2xl border border-indigo-150 p-5 shadow-3xs col-span-2 lg:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Target Defaulter Count</span>
                <div className="mt-2 text-2xl font-black text-indigo-900">{totalCampaignDefaulters}</div>
                <p className="text-[9px] text-indigo-600 mt-2 font-medium">Accumulated campaign defaulter targets.</p>
              </div>
            </div>

            {/* OPERATIONAL JOURNEY PLANNER TIMELINE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-950 text-sm">10-Week Operational Journey Planner</h4>
                  <p className="text-[11px] text-slate-500">Scheduled sequence of collection activities to maximize returns.</p>
                </div>
                <span className="text-[10px] bg-slate-50 text-slate-500 font-mono font-bold px-2.5 py-1 rounded border border-slate-200">10-Week Framework</span>
              </div>

              {/* Grid of the 5 key weeks */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {milestones.map((milestone, idx) => {
                  // Find if there is a real database campaign associated with this week
                  const matchingCampaigns = feeCampaigns.filter(c => c.week.toLowerCase().replace(/\s+/g, '') === milestone.week.toLowerCase().replace(/\s+/g, ''));
                  const hasCampaign = matchingCampaigns.length > 0;
                  const activeCampaign = matchingCampaigns[0];

                  const isComplete = hasCampaign && activeCampaign.actualCollection >= activeCampaign.targetCollection;
                  const isStarted = hasCampaign && activeCampaign.actualCollection > 0;

                  return (
                    <div 
                      key={idx}
                      className={`rounded-2xl p-4 border-2 transition-all flex flex-col justify-between space-y-4 ${milestone.color} ${
                        hasCampaign ? 'bg-slate-55/30' : 'bg-slate-50/40 border-dashed'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">{milestone.week}</span>
                          {hasCampaign ? (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              isComplete 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : isStarted 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {isComplete ? 'Goal Met' : isStarted ? 'Active' : 'Planned'}
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-150 text-slate-400">
                              No Campaign
                            </span>
                          )}
                        </div>

                        <h5 className="font-black text-slate-900 text-xs">{milestone.phase}</h5>
                        <p className="text-[10px] text-slate-500 leading-snug font-medium">{milestone.action}</p>
                      </div>

                      {hasCampaign ? (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <div className="flex justify-between text-[9px] font-mono text-slate-400 font-bold">
                            <span>Expected: ₦{activeCampaign.targetCollection.toLocaleString()}</span>
                            <span>{Math.round((activeCampaign.actualCollection / activeCampaign.targetCollection) * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-150 h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all" 
                              style={{ width: `${Math.min(100, Math.round((activeCampaign.actualCollection / activeCampaign.targetCollection) * 100))}%` }} 
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCampaign(null);
                            setCampaignForm({
                              name: `Collection Phase: ${milestone.phase}`,
                              week: milestone.week,
                              startDate: new Date().toISOString().split('T')[0],
                              endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
                              targetCollection: 15000,
                              actualCollection: 0,
                              defaulterCount: 15
                            });
                            setCampaignModalOpen(true);
                          }}
                          className="w-full text-center py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          + Set Campaign
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CAMPAIGN MANAGEMENT CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-950 text-sm">Campaign Schedules & Analytics Widgets</h4>
                  <p className="text-[11px] text-slate-500">Review, add, or customize collection schedules, financial target quotas, and actual collections.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCampaign(null);
                    setCampaignForm({
                      name: '',
                      week: 'Week 2',
                      startDate: '',
                      endDate: '',
                      targetCollection: 0,
                      actualCollection: 0,
                      defaulterCount: 0
                    });
                    setCampaignModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Collection Campaign</span>
                </button>
              </div>

              {feeCampaignsLoading ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Loading fee campaigns database...
                </div>
              ) : feeCampaigns.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                  <p>No fee campaigns found.</p>
                  <button 
                    onClick={() => {
                      setEditingCampaign(null);
                      setCampaignForm({
                        name: 'Week 2 Fee Reminders',
                        week: 'Week 2',
                        startDate: '2026-06-01',
                        endDate: '2026-06-08',
                        targetCollection: 20000,
                        actualCollection: 16000,
                        defaulterCount: 30
                      });
                      setCampaignModalOpen(true);
                    }}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Create a sample campaign now
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                        <th className="py-3 px-4">Timeline Week</th>
                        <th className="py-3 px-4">Campaign Name</th>
                        <th className="py-3 px-4">Date Range</th>
                        <th className="py-3 px-4">Target Collection</th>
                        <th className="py-3 px-4">Actual Realized</th>
                        <th className="py-3 px-4">Deficit Gap</th>
                        <th className="py-3 px-4">Collection Progress</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {feeCampaigns.map(c => {
                        const collected = c.actualCollection || 0;
                        const target = c.targetCollection || 0;
                        const progress = target > 0 ? Math.round((collected / target) * 100) : 0;
                        const deficit = Math.max(0, target - collected);
                        
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-all">
                            <td className="py-3.5 px-4 font-black text-indigo-600">{c.week}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 leading-snug">{c.name}</div>
                              <div className="text-[10px] text-slate-400">Arrears Families: {c.defaulterCount}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                              {c.startDate} to {c.endDate}
                            </td>
                            <td className="py-3.5 px-4 text-slate-800 font-bold">₦{target.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-emerald-700 font-extrabold">₦{collected.toLocaleString()}</td>
                            <td className="py-3.5 px-4">
                              {deficit > 0 ? (
                                <span className="text-rose-600 font-bold">₦{deficit.toLocaleString()}</span>
                              ) : (
                                <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold">Full Returns</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1 w-32">
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold">
                                  <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      progress >= 90 ? 'bg-emerald-500' : progress >= 50 ? 'bg-indigo-600' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, progress)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCampaign(c);
                                    setCampaignForm({
                                      name: c.name,
                                      week: c.week,
                                      startDate: c.startDate,
                                      endDate: c.endDate,
                                      targetCollection: c.targetCollection,
                                      actualCollection: c.actualCollection,
                                      defaulterCount: c.defaulterCount
                                    });
                                    setCampaignModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Campaign"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCampaign(c.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Campaign"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ----------------- SUB TAB 11: SCHEDULE COMPLIANCE TRACKER ----------------- */}
      {activeSubTab === 'ministry_compliance' && (() => {
        const session = academicSessions.find(s => s.id === selectedSessionId);
        if (!session) {
          return (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-3xs">
              <Lucide.AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-extrabold text-slate-800 text-sm">No Academic Session Selected</h3>
              <p className="text-xs text-slate-500 mt-1">Please select or register an academic session to view compliance metrics.</p>
            </div>
          );
        }

        const sessionTerms = terms.filter(t => t.sessionId === selectedSessionId);
        const sessionHolidays = holidays.filter(h => h.sessionId === selectedSessionId);

        let totalWeeks = sessionTerms.reduce((sum, t) => sum + (t.numberOfWeeks || 0), 0);
        let totalInstructionalDays = 0;
        let totalHolidayDays = 0;
        let totalWeekendDays = 0;

        const termsBreakdown = sessionTerms.map(t => {
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          let instructional = 0;
          let weekend = 0;
          let holidayDays = 0;

          // Perform day-by-day calculation
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            const dateStr = d.toISOString().split('T')[0];

            if (dayOfWeek === 0 || dayOfWeek === 6) {
              weekend++;
              continue;
            }

            const isHoliday = sessionHolidays.some(h => {
              const hStart = new Date(h.startDate);
              const hEnd = new Date(h.endDate);
              const currentD = new Date(dateStr);
              return currentD >= hStart && currentD <= hEnd;
            });

            if (isHoliday) {
              holidayDays++;
            } else {
              instructional++;
            }
          }

          totalInstructionalDays += instructional;
          totalHolidayDays += holidayDays;
          totalWeekendDays += weekend;

          return {
            id: t.id,
            name: t.name,
            startDate: t.startDate,
            endDate: t.endDate,
            weeks: t.numberOfWeeks,
            instructionalDays: instructional,
            holidayDays,
            weekendDays: weekend
          };
        });

        const today = new Date('2026-07-04');
        const sessionStart = new Date(session.startDate);
        const diffMs = today.getTime() - sessionStart.getTime();
        const completedWeeks = Math.max(0, Math.min(totalWeeks, Math.floor(diffMs / (1000 * 3600 * 24 * 7))));

        const complianceWeeksPct = Math.round(Math.min(100, (totalWeeks / requiredWeeksTarget) * 100));
        const complianceDaysPct = Math.round(Math.min(100, (totalInstructionalDays / requiredDaysTarget) * 100));
        const overallPct = Math.round((complianceWeeksPct + complianceDaysPct) / 2);

        const publicHolidaysCount = sessionHolidays.filter(h => h.type === 'Public Holiday').length;

        // Determine Compliance Rating Description
        let complianceStatus = 'NON-COMPLIANT';
        let complianceColor = 'text-rose-600 bg-rose-50 border-rose-200';
        let statusDescription = 'Academic planning is below compliance thresholds. Add terms or reduce holiday periods.';
        
        if (overallPct >= 95) {
          complianceStatus = 'FULLY COMPLIANT';
          complianceColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
          statusDescription = 'All schedule guidelines and educational targets have been successfully met. Excellent calendar balance.';
        } else if (overallPct >= 80) {
          complianceStatus = 'BORDERLINE COMPLIANT';
          complianceColor = 'text-amber-700 bg-amber-50 border-amber-200';
          statusDescription = 'Plan is near compliance, but falls slightly short of standard targets. Review calendar periods.';
        }

        return (
          <div id="subtab-ministry-compliance" className="space-y-6">
            
            {/* INFORMATIVE EXPLANATION PANEL */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-950 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                    Schedule Audit
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">• Active Session: {session.name}</span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white">Schedule Compliance &amp; Calendar Auditor</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Standard regulatory guidelines suggest targets for academic calendars to ensure balanced pupil engagement. We compute active calendar metrics dynamically by evaluating weekdays against registered terms and holidays.
                </p>
                <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>📅 <strong>Required Weeks Target:</strong> {requiredWeeksTarget} weeks</span>
                  <span>🏫 <strong>Required Instructional Days Target:</strong> {requiredDaysTarget} days</span>
                </div>
              </div>

              {/* Target adjusters */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shrink-0 w-full lg:w-80 space-y-3">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-700/60">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Adjust Audit Baselines</span>
                  <span className="text-[9px] text-indigo-400 font-bold">Local Baseline</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase mb-1">Req. Weeks</label>
                    <input 
                      type="number" 
                      value={requiredWeeksTarget} 
                      onChange={(e) => setRequiredWeeksTarget(Math.max(1, parseInt(e.target.value) || 36))}
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block font-bold uppercase mb-1">Req. Days</label>
                    <input 
                      type="number" 
                      value={requiredDaysTarget} 
                      onChange={(e) => setRequiredDaysTarget(Math.max(1, parseInt(e.target.value) || 180))}
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* DASHBOARD GAUGES STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compliance Score</span>
                  <div className="mt-2 flex items-baseline space-x-1.5">
                    <span className="text-3xl font-black text-slate-900">{overallPct}%</span>
                    <span className="text-[10px] font-extrabold text-indigo-600">Overall</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        overallPct >= 95 ? 'bg-emerald-500' : overallPct >= 80 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} 
                      style={{ width: `${overallPct}%` }} 
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[9px] text-slate-400 font-bold">Threshold: 100%</span>
                    <span className="text-[9px] text-slate-500 font-bold">{overallPct >= 95 ? 'Passed' : 'Deficit'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Weeks</span>
                  <div className="mt-2 text-3xl font-black text-indigo-950">{totalWeeks} <span className="text-xs text-slate-400 font-bold">/ {requiredWeeksTarget}</span></div>
                  <p className="text-[9px] text-slate-500 mt-1">Sum of weeks registered across all terms.</p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 font-bold">Weeks Compliance:</span>
                  <span className="text-xs font-bold text-slate-800">{complianceWeeksPct}%</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instructional Days</span>
                  <div className="mt-2 text-3xl font-black text-emerald-700">{totalInstructionalDays} <span className="text-xs text-slate-400 font-bold">/ {requiredDaysTarget}</span></div>
                  <p className="text-[9px] text-slate-500 mt-1">Weekdays excluding registered holiday calendars.</p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 font-bold">Days Compliance:</span>
                  <span className="text-xs font-bold text-emerald-600">{complianceDaysPct}%</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress Track</span>
                  <div className="mt-2 text-3xl font-black text-indigo-900">{completedWeeks} <span className="text-xs text-slate-400 font-bold">weeks</span></div>
                  <p className="text-[9px] text-slate-500 mt-1">Completed weeks from start date to current audit date.</p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 font-bold">Active Public Holidays:</span>
                  <span className="text-xs font-bold text-slate-800">{publicHolidaysCount}</span>
                </div>
              </div>
            </div>

            {/* STATUS SUMMARY COMPLIANCE CARD */}
            <div className={`p-5 rounded-2xl border ${complianceColor} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs`}>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-xl shadow-3xs mt-0.5">
                  {overallPct >= 95 ? (
                    <Lucide.ShieldCheck className="w-6 h-6 text-emerald-600" />
                  ) : overallPct >= 80 ? (
                    <Lucide.AlertCircle className="w-6 h-6 text-amber-600" />
                  ) : (
                    <Lucide.XCircle className="w-6 h-6 text-rose-600" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest block opacity-75">Schedule Status Rating</span>
                  <h4 className="text-sm font-black tracking-tight mt-0.5">{complianceStatus}</h4>
                  <p className="text-xs mt-1 opacity-90 font-medium leading-relaxed">{statusDescription}</p>
                </div>
              </div>
              
              <button 
                onClick={() => window.print()}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold shadow-3xs transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap"
              >
                <Lucide.Printer className="w-3.5 h-3.5" />
                <span>Print Compliance Audit</span>
              </button>
            </div>

            {/* DETAILED ANALYSIS TABULAR REPORTS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Detailed Term-by-Term Instructional Breakdown</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Computed counts of school days and holidays for active calendar compliance reports.</p>
                </div>
                <span className="text-xs text-indigo-600 font-bold">{sessionTerms.length} Terms Registered</span>
              </div>

              {termsBreakdown.length === 0 ? (
                <div className="p-10 text-center">
                  <Lucide.Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">No terms configured for this Academic Session.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Generate terms in the Term Configuration tab to evaluate instructional days compliance.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-5">Term Name</th>
                        <th className="py-3 px-4">Term Duration Range</th>
                        <th className="py-3 px-4 text-center">Configured Weeks</th>
                        <th className="py-3 px-4 text-center text-indigo-700">Instructional Days</th>
                        <th className="py-3 px-4 text-center text-rose-600">Holiday Days</th>
                        <th className="py-3 px-4 text-center">Weekend Days</th>
                        <th className="py-3 px-5 text-right">Term Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {termsBreakdown.map(tb => {
                        const termCompPct = Math.round((tb.instructionalDays / (tb.weeks * 5)) * 100);
                        return (
                          <tr key={tb.id} className="hover:bg-slate-50/50 transition-colors font-medium">
                            <td className="py-4 px-5 font-bold text-slate-900">{tb.name}</td>
                            <td className="py-4 px-4 text-slate-500 text-[11px]">{tb.startDate} to {tb.endDate}</td>
                            <td className="py-4 px-4 text-center text-slate-800 font-bold">{tb.weeks} Weeks</td>
                            <td className="py-4 px-4 text-center text-indigo-700 font-extrabold text-sm">{tb.instructionalDays} Days</td>
                            <td className="py-4 px-4 text-center text-rose-600 font-semibold">{tb.holidayDays} Days</td>
                            <td className="py-4 px-4 text-center text-slate-400">{tb.weekendDays} Days</td>
                            <td className="py-4 px-5 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                termCompPct >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {termCompPct}% Balanced
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Table Footer Summary Totals */}
                      <tr className="bg-slate-50/80 font-bold text-slate-950 border-t border-slate-200">
                        <td className="py-4 px-5">Total Academic Calendar</td>
                        <td className="py-4 px-4">Cumulative Totals</td>
                        <td className="py-4 px-4 text-center text-indigo-950">{totalWeeks} Weeks</td>
                        <td className="py-4 px-4 text-center text-indigo-700 text-sm font-black">{totalInstructionalDays} Days</td>
                        <td className="py-4 px-4 text-center text-rose-600 font-black">{totalHolidayDays} Days</td>
                        <td className="py-4 px-4 text-center text-slate-500">{totalWeekendDays} Days</td>
                        <td className="py-4 px-5 text-right">
                          <span className="text-xs font-black text-slate-900">Req. Gap: {Math.max(0, requiredDaysTarget - totalInstructionalDays)} days</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* HOLIDAY RISK EVALUATOR PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3.5 lg:col-span-2">
                <h4 className="font-extrabold text-slate-950 text-sm flex items-center space-x-1.5 text-indigo-950">
                  <span>🏖️</span>
                  <span>Active Holiday Risk Impact Analyst</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Public holidays and term breaks scheduled on weekdays reduce overall instructional opportunities. Ensure public holidays do not trigger non-compliance.
                </p>

                {sessionHolidays.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-400 text-xs">
                    No holidays registered for this academic session.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {sessionHolidays.map(h => {
                      const startD = new Date(h.startDate);
                      const endD = new Date(h.endDate);
                      const totalDays = Math.round((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24)) + 1;
                      return (
                        <div key={h.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-start justify-between">
                          <div>
                            <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wide bg-indigo-50 px-2 py-0.5 rounded">{h.type}</span>
                            <h5 className="font-bold text-slate-900 text-xs mt-2">{h.name}</h5>
                            <p className="text-[10px] text-slate-500 mt-1">{h.startDate} to {h.endDate}</p>
                          </div>
                          <span className="text-xs font-extrabold text-rose-600 whitespace-nowrap bg-rose-50 px-2 py-1 rounded">{totalDays} days</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-950 text-xs uppercase tracking-wide text-slate-400">Compliance Calculations Formula</h4>
                  <div className="space-y-3.5 pt-2 text-[11px] text-slate-600 leading-relaxed font-medium">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <strong className="text-slate-900 block font-bold mb-0.5">📅 Weeks Compliance Formula:</strong>
                      <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50/60 p-1 rounded inline-block">Min(100, (Weeks / Target) × 100)</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <strong className="text-slate-900 block font-bold mb-0.5">🏫 Instructional Days Formula:</strong>
                      <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50/60 p-1 rounded inline-block">Mon-Fri Days − Holidays</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <strong className="text-slate-900 block font-bold mb-0.5">🛡️ Audit Threshold Levels:</strong>
                      <div className="flex flex-wrap gap-2 mt-1.5 text-[9px] font-extrabold">
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">95%+ Compliant</span>
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">80%-94% Borderline</span>
                        <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">&lt;80% Non-Compliant</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-950 flex items-start space-x-2">
                  <Lucide.Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed font-medium text-indigo-900">
                    Calculations are updated instantly whenever terms are rescheduled or holidays are created/modified.
                  </p>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* ----------------- SUB TAB 12: ANNUAL EVENT TEMPLATES & COPY WIZARD ----------------- */}
      {activeSubTab === 'event_templates' && (() => {
        const sourceSessions = academicSessions.filter(s => s.id !== selectedSessionId);
        
        // Find events in selected source session
        const sourceEvents = events.filter(e => e.sessionId === cloneSourceSessionId);

        // Pre-defined categories for grouping templates
        const examCategoryIds = eventCategories.filter(c => c.name.toLowerCase().includes('exam') || c.name.toLowerCase().includes('test') || c.name.toLowerCase().includes('assessment')).map(c => c.id);
        const activityCategoryIds = eventCategories.filter(c => c.parentGroup === 'STUDENT ACTIVITIES').map(c => c.id);
        const financeCategoryIds = eventCategories.filter(c => c.parentGroup === 'FINANCE').map(c => c.id);

        const examEvents = sourceEvents.filter(e => examCategoryIds.includes(e.categoryId));
        const extraCurricularEvents = sourceEvents.filter(e => activityCategoryIds.includes(e.categoryId));
        const financialEvents = sourceEvents.filter(e => financeCategoryIds.includes(e.categoryId));
        const generalEvents = sourceEvents.filter(e => !examCategoryIds.includes(e.categoryId) && !activityCategoryIds.includes(e.categoryId) && !financeCategoryIds.includes(e.categoryId));

        // Calculate offset details live if source and target are selected
        const sourceSessionObj = academicSessions.find(s => s.id === cloneSourceSessionId);
        const targetSessionObj = academicSessions.find(s => s.id === selectedSessionId);

        let liveDaysOffset = 0;
        if (sourceSessionObj && targetSessionObj) {
          const sStart = new Date(sourceSessionObj.startDate).getTime();
          const tStart = new Date(targetSessionObj.startDate).getTime();
          liveDaysOffset = Math.round((tStart - sStart) / (1000 * 3600 * 24));
        }

        const projectTargetDate = (sourceDateStr: string): string => {
          if (!liveDaysOffset) return sourceDateStr;
          const original = new Date(sourceDateStr);
          const rawTarget = new Date(original.getTime() + (liveDaysOffset * 24 * 3600 * 1000));
          
          // Align weekdays so events stay on the same relative weekday
          const origDay = original.getDay();
          const targetDay = rawTarget.getDay();
          let diff = origDay - targetDay;
          if (diff !== 0) {
            rawTarget.setDate(rawTarget.getDate() + diff);
          }
          return rawTarget.toISOString().split('T')[0];
        };

        const handleSelectAllGroup = (groupEvents: AcademicEvent[]) => {
          const groupIds = groupEvents.map(e => e.id);
          const allSelected = groupIds.every(id => cloneSelectedEventIds.includes(id));
          if (allSelected) {
            // Remove them
            setCloneSelectedEventIds(prev => prev.filter(id => !groupIds.includes(id)));
          } else {
            // Add remaining
            setCloneSelectedEventIds(prev => {
              const unique = new Set([...prev, ...groupIds]);
              return Array.from(unique);
            });
          }
        };

        const handleToggleSelectEvent = (id: string) => {
          setCloneSelectedEventIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
          );
        };

        const executeEventCloning = async () => {
          if (!cloneSourceSessionId) {
            alert("Please choose a source Academic Session first.");
            return;
          }
          if (cloneSelectedEventIds.length === 0) {
            alert("Please select at least one calendar event to clone.");
            return;
          }

          try {
            setIsCloningEvents(true);
            setCloneStatusMsg(null);

            const res = await fetch('/api/events/clone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sourceSessionId: cloneSourceSessionId,
                targetSessionId: selectedSessionId,
                eventIds: cloneSelectedEventIds
              })
            });

            if (!res.ok) {
              throw new Error("Failed to clone calendar events. Ensure sessions have correct date formats.");
            }

            const data = await res.json();
            if (data.success && data.events) {
              setEvents(prev => [...prev, ...data.events]);
              setCloneStatusMsg({
                type: 'success',
                text: `Successfully cloned and aligned ${data.clonedCount} calendar events into the ${targetSessionObj?.name || 'target session'}!`
              });
              setCloneSelectedEventIds([]);
            }
          } catch (err: any) {
            setCloneStatusMsg({
              type: 'error',
              text: err.message || "An unexpected database communication error occurred."
            });
          } finally {
            setIsCloningEvents(false);
          }
        };

        return (
          <div id="subtab-event-templates" className="space-y-6">
            
            {/* INFORMATIVE CLONING SERVICE BANNER */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-950 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                    Cloning Service
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">• Copy previous sessions calendar</span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white">Annual Event Template Cloning Service</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Skip manual entries by copying key events from previous years. The cloning wizard computes date offsets and automatically shifts events to the correct matching weekdays and corresponding terms.
                </p>
                <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>📅 <strong>CA / Exam Weeks</strong></span>
                  <span>🏆 <strong>Sports / Colour Day</strong></span>
                  <span>💰 <strong>Fee Collection Drives</strong></span>
                </div>
              </div>

              {/* Selection status */}
              <div className="bg-indigo-950/50 border border-indigo-800 rounded-2xl p-4 shrink-0 w-full lg:w-80 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Selections Queue</span>
                  <span className="text-xs font-black text-white">{cloneSelectedEventIds.length} Chosen</span>
                </div>
                <p className="text-[10px] text-indigo-200 leading-relaxed mb-3 font-medium">Copy wizard will target: <strong className="text-white">{targetSessionObj?.name}</strong></p>
                <button
                  onClick={executeEventCloning}
                  disabled={cloneSelectedEventIds.length === 0 || isCloningEvents}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                >
                  {isCloningEvents ? (
                    <>
                      <Lucide.RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Cloning Events...</span>
                    </>
                  ) : (
                    <>
                      <Lucide.Sparkles className="w-3.5 h-3.5" />
                      <span>Clone Selected Events</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* FEEDBACK STATUS MESSAGE */}
            {cloneStatusMsg && (
              <div className={`p-4 rounded-xl flex items-start space-x-2 text-xs font-medium border ${
                cloneStatusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 'bg-rose-50 text-rose-800 border-rose-150'
              }`}>
                {cloneStatusMsg.type === 'success' ? (
                  <Lucide.CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Lucide.AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{cloneStatusMsg.text}</span>
              </div>
            )}

            {/* SOURCE & TARGET ORCHESTRATION BAR */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs grid grid-cols-1 md:grid-cols-3 gap-5 items-center font-sans">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">1. Select Source Session (Copy From)</label>
                <select
                  value={cloneSourceSessionId}
                  onChange={(e) => {
                    setCloneSourceSessionId(e.target.value);
                    setCloneSelectedEventIds([]);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-3xs"
                >
                  <option value="">-- Choose Historical Session --</option>
                  {sourceSessions.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">2. Target Destination (Copy To)</label>
                <div className="bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-700 flex items-center justify-between">
                  <span>{targetSessionObj?.name || 'No Target Selected'}</span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Target</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Projected Time Shift (Offset)</label>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-indigo-950">
                  {cloneSourceSessionId ? (
                    <span>Calendar Shift: <strong className="text-indigo-600">+{liveDaysOffset} days</strong> (Weekday aligned)</span>
                  ) : (
                    <span className="text-slate-400">Select a source session to view time offset</span>
                  )}
                </div>
              </div>
            </div>

            {/* EVENT GROUPS GRID ACCORDION */}
            {!cloneSourceSessionId ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center font-sans">
                <Lucide.Copy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-extrabold text-slate-700 text-sm">Select Source Session to Load Templates</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Choose a previous academic session above. We will fetch and organize its calendar events into copyable template groups.
                </p>
              </div>
            ) : sourceEvents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-3xs font-sans">
                <Lucide.Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No events found in the selected historical session.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Choose another session or add some events to the source session first.</p>
              </div>
            ) : (
              <div className="space-y-6 font-sans">
                
                {/* 1. ACADEMIC WEEKS & EXAM WEEKS */}
                {examEvents.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">📝</span>
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">Continuous Assessment &amp; Exam Weeks Template</h4>
                      </div>
                      <button
                        onClick={() => handleSelectAllGroup(examEvents)}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-3xs cursor-pointer animate-all"
                      >
                        {examEvents.every(e => cloneSelectedEventIds.includes(e.id)) ? 'Deselect All' : 'Select All CA/Exams'}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100/50 text-[10px] font-bold text-slate-400 uppercase">
                          <tr>
                            <th className="py-2 px-5 w-12 text-center">Select</th>
                            <th className="py-2 px-4">Event Title</th>
                            <th className="py-2 px-4">Branch</th>
                            <th className="py-2 px-4 text-slate-400 border-l border-slate-100">Source Date</th>
                            <th className="py-2 px-5 text-indigo-700 border-l border-slate-100">Projected Target Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {examEvents.map(e => {
                            const isSel = cloneSelectedEventIds.includes(e.id);
                            return (
                              <tr key={e.id} className="hover:bg-slate-50/40 font-medium">
                                <td className="py-3 px-5 text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={isSel} 
                                    onChange={() => handleToggleSelectEvent(e.id)}
                                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800">{e.title}</td>
                                <td className="py-3 px-4 text-[10px] font-bold uppercase">{e.branchId === 'All' ? 'All Branches' : e.branchId}</td>
                                <td className="py-3 px-4 text-slate-400 border-l border-slate-100">{e.startDate}</td>
                                <td className="py-3 px-5 text-indigo-600 font-bold border-l border-slate-100">{projectTargetDate(e.startDate)} to {projectTargetDate(e.endDate)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. EXTRA CURRICULAR / SPORTS DAYS */}
                {extraCurricularEvents.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">🏆</span>
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">Sports, Colour Days &amp; Activity Templates</h4>
                      </div>
                      <button
                        onClick={() => handleSelectAllGroup(extraCurricularEvents)}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-3xs cursor-pointer animate-all"
                      >
                        {extraCurricularEvents.every(e => cloneSelectedEventIds.includes(e.id)) ? 'Deselect All' : 'Select All Activities'}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100/50 text-[10px] font-bold text-slate-400 uppercase">
                          <tr>
                            <th className="py-2 px-5 w-12 text-center">Select</th>
                            <th className="py-2 px-4">Event Title</th>
                            <th className="py-2 px-4">Branch</th>
                            <th className="py-2 px-4 text-slate-400 border-l border-slate-100">Source Date</th>
                            <th className="py-2 px-5 text-indigo-700 border-l border-slate-100">Projected Target Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {extraCurricularEvents.map(e => {
                            const isSel = cloneSelectedEventIds.includes(e.id);
                            return (
                              <tr key={e.id} className="hover:bg-slate-50/40 font-medium">
                                <td className="py-3 px-5 text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={isSel} 
                                    onChange={() => handleToggleSelectEvent(e.id)}
                                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800">{e.title}</td>
                                <td className="py-3 px-4 text-[10px] font-bold uppercase">{e.branchId === 'All' ? 'All Branches' : e.branchId}</td>
                                <td className="py-3 px-4 text-slate-400 border-l border-slate-100">{e.startDate}</td>
                                <td className="py-3 px-5 text-indigo-600 font-bold border-l border-slate-100">{projectTargetDate(e.startDate)} to {projectTargetDate(e.endDate)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. FINANCE & FEE DRIVES */}
                {financialEvents.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">💰</span>
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">Financial Campaigns &amp; Fee Drives Template</h4>
                      </div>
                      <button
                        onClick={() => handleSelectAllGroup(financialEvents)}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-3xs cursor-pointer animate-all"
                      >
                        {financialEvents.every(e => cloneSelectedEventIds.includes(e.id)) ? 'Deselect All' : 'Select All Fee Drives'}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100/50 text-[10px] font-bold text-slate-400 uppercase">
                          <tr>
                            <th className="py-2 px-5 w-12 text-center">Select</th>
                            <th className="py-2 px-4">Event Title</th>
                            <th className="py-2 px-4">Branch</th>
                            <th className="py-2 px-4 text-slate-400 border-l border-slate-100">Source Date</th>
                            <th className="py-2 px-5 text-indigo-700 border-l border-slate-100">Projected Target Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {financialEvents.map(e => {
                            const isSel = cloneSelectedEventIds.includes(e.id);
                            return (
                              <tr key={e.id} className="hover:bg-slate-50/40 font-medium">
                                <td className="py-3 px-5 text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={isSel} 
                                    onChange={() => handleToggleSelectEvent(e.id)}
                                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800">{e.title}</td>
                                <td className="py-3 px-4 text-[10px] font-bold uppercase">{e.branchId === 'All' ? 'All Branches' : e.branchId}</td>
                                <td className="py-3 px-4 text-slate-400 border-l border-slate-100">{e.startDate}</td>
                                <td className="py-3 px-5 text-indigo-600 font-bold border-l border-slate-100">{projectTargetDate(e.startDate)} to {projectTargetDate(e.endDate)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. OTHER / GENERAL EVENTS */}
                {generalEvents.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">🔔</span>
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">Other General Scheduled Events</h4>
                      </div>
                      <button
                        onClick={() => handleSelectAllGroup(generalEvents)}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-3xs cursor-pointer animate-all"
                      >
                        {generalEvents.every(e => cloneSelectedEventIds.includes(e.id)) ? 'Deselect All' : 'Select All General'}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100/50 text-[10px] font-bold text-slate-400 uppercase">
                          <tr>
                            <th className="py-2 px-5 w-12 text-center">Select</th>
                            <th className="py-2 px-4">Event Title</th>
                            <th className="py-2 px-4">Branch</th>
                            <th className="py-2 px-4 text-slate-400 border-l border-slate-100">Source Date</th>
                            <th className="py-2 px-5 text-indigo-700 border-l border-slate-100">Projected Target Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {generalEvents.map(e => {
                            const isSel = cloneSelectedEventIds.includes(e.id);
                            return (
                              <tr key={e.id} className="hover:bg-slate-50/40 font-medium">
                                <td className="py-3 px-5 text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={isSel} 
                                    onChange={() => handleToggleSelectEvent(e.id)}
                                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800">{e.title}</td>
                                <td className="py-3 px-4 text-[10px] font-bold uppercase">{e.branchId === 'All' ? 'All Branches' : e.branchId}</td>
                                <td className="py-3 px-4 text-slate-400 border-l border-slate-100">{e.startDate}</td>
                                <td className="py-3 px-5 text-indigo-600 font-bold border-l border-slate-100">{projectTargetDate(e.startDate)} to {projectTargetDate(e.endDate)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        );
      })()}

      {/* ----------------- MODAL: ACADEMIC SESSIONS FORM ----------------- */}
      <AnimatePresence>
        {sessionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {editingSession ? 'Modify Academic Session' : 'Create New Academic Session'}
                </h3>
                <button 
                  onClick={() => setSessionModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSessionSubmit} className="p-5 space-y-4">
                {validationError && (
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl flex items-start space-x-2 text-rose-800 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Academic Session Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2025/2026 Academic Year"
                    value={sessionForm.name}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="date"
                      required
                      value={sessionForm.startDate}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="date"
                      required
                      value={sessionForm.endDate}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Calendar Status</label>
                  <select
                    value={sessionForm.status}
                    onChange={(e: any) => setSessionForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="planned">Planned (Inactive)</option>
                    <option value="active">Active (Current Academic Term)</option>
                    <option value="archived">Archived (Historical records)</option>
                  </select>
                  {sessionForm.status === 'active' && (
                    <p className="text-[10px] text-indigo-600 mt-1.5 font-medium leading-relaxed">
                      💡 Activating this session will automatically transition other active sessions to archived.
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSessionModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Syncing...' : 'Save Session'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: TERMS FORM ----------------- */}
      <AnimatePresence>
        {termModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {editingTerm ? 'Modify Allotted Term' : 'Configure New Academic Term'}
                </h3>
                <button 
                  onClick={() => setTermModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTermSubmit} className="p-5 space-y-4">
                {validationError && (
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl flex items-start space-x-2 text-rose-800 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Term Selection</label>
                  <select
                    disabled={editingTerm !== null}
                    value={termForm.name}
                    onChange={(e) => setTermForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="date"
                      required
                      value={termForm.startDate}
                      onChange={(e) => {
                        const s = e.target.value;
                        setTermForm(prev => ({ 
                          ...prev, 
                          startDate: s,
                          numberOfWeeks: prev.endDate ? calculateWeeksBetween(s, prev.endDate) : prev.numberOfWeeks
                        }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="date"
                      required
                      value={termForm.endDate}
                      onChange={(e) => {
                        const end = e.target.value;
                        setTermForm(prev => ({ 
                          ...prev, 
                          endDate: end,
                          numberOfWeeks: prev.startDate ? calculateWeeksBetween(prev.startDate, end) : prev.numberOfWeeks
                        }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Number of Weeks Allotted</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={termForm.numberOfWeeks}
                    onChange={(e) => setTermForm(prev => ({ ...prev, numberOfWeeks: parseInt(e.target.value) || 12 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">
                    💡 This is computed automatically based on start and end dates selection, but can be customized manually to reflect holidays.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setTermModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Syncing...' : 'Save Term Dates'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: HOLIDAY REGISTRY FORM ----------------- */}
      <AnimatePresence>
        {holidayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {editingHoliday ? 'Modify Holiday registry' : 'Add Holiday to Official registry'}
                </h3>
                <button 
                  onClick={() => setHolidayModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleHolidaySubmit} className="p-5 space-y-4">
                {validationError && (
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl flex items-start space-x-2 text-rose-800 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Holiday Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eid al-Kabir, Easter Monday"
                    value={holidayForm.name}
                    onChange={(e) => setHolidayForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Holiday Classification</label>
                  <select
                    value={holidayForm.type}
                    onChange={(e: any) => setHolidayForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="Public Holiday">Public Holiday (Government mandated offday)</option>
                    <option value="School Holiday">School Holiday (Internal operational offday)</option>
                    <option value="Mid-Term Break">Mid-Term Break (Brief operational recess)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="date"
                      required
                      value={holidayForm.startDate}
                      onChange={(e) => setHolidayForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="date"
                      required
                      value={holidayForm.endDate}
                      onChange={(e) => setHolidayForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setHolidayModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Syncing...' : 'Save Holiday Registry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: EVENT CATEGORY REGISTRY FORM ----------------- */}
      <AnimatePresence>
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {editingCategory ? 'Modify Event Category' : 'Register New Event Category'}
                </h3>
                <button 
                  onClick={() => setCategoryModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {validationError && (
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl flex items-start space-x-2 text-rose-800 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sports Tournament"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Parent Group</label>
                    <select
                      value={categoryForm.parentGroup}
                      onChange={(e: any) => setCategoryForm(prev => ({ ...prev, parentGroup: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
                    >
                      <option value="ACADEMIC">ACADEMIC</option>
                      <option value="FINANCE">FINANCE</option>
                      <option value="STUDENT ACTIVITIES">STUDENT ACTIVITIES</option>
                      <option value="STAFF">STAFF</option>
                      <option value="INVENTORY">INVENTORY</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description Guidelines</label>
                  <textarea
                    placeholder="Provide explanatory remarks, target audiences or operational parameters for this category."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Category Color Accent
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {[
                      '#4F46E5', // Indigo
                      '#10B981', // Emerald
                      '#EC4899', // Pink
                      '#8B5CF6', // Purple
                      '#3B82F6', // Blue
                      '#F59E0B', // Amber
                      '#F97316', // Orange
                      '#EF4444', // Red
                      '#06B6D4', // Cyan
                      '#64748B'  // Slate
                    ].map(presetColor => (
                      <button
                        key={presetColor}
                        type="button"
                        onClick={() => setCategoryForm(prev => ({ ...prev, color: presetColor }))}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          categoryForm.color === presetColor ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: presetColor }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="#4F46E5"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Icon Association
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Current: <span className="font-bold text-slate-700">{categoryForm.icon}</span></span>
                  </div>
                  
                  {/* Grid of Lucide Icon Selection triggers */}
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 max-h-[120px] overflow-y-auto">
                    {[
                      'GraduationCap', 'BookOpen', 'FileSpreadsheet', 'RotateCcw', 'TrendingUp',
                      'Bell', 'Wallet', 'Award', 'Palette', 'Globe', 'Trophy', 'Compass',
                      'Users', 'Hammer', 'ShoppingBag', 'Truck', 'Package', 'Calendar',
                      'CheckSquare', 'FileText', 'HelpCircle', 'MessageSquare', 'Target', 'Activity'
                    ].map(iconName => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setCategoryForm(prev => ({ ...prev, icon: iconName }))}
                        className={`p-1.5 rounded-lg border flex flex-col items-center justify-center transition-all ${
                          categoryForm.icon === iconName 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                        }`}
                        title={iconName}
                      >
                        <CategoryIcon name={iconName} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Syncing...' : 'Save Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: EVENT REGISTRY / EDIT FORM ----------------- */}
      <AnimatePresence>
        {eventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {editingEvent ? 'Modify Scheduled Event' : 'Schedule New School Event'}
                </h3>
                <button 
                  onClick={() => setEventModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEventSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
                {validationError && (
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl flex items-start space-x-2 text-rose-800 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Third Term Examination Cycle"
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                  />
                </div>

                {/* Description / Guidelines */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Guidelines & Remarks</label>
                  <textarea
                    placeholder="Provide explanatory remarks, timetables, or administrative agendas for this event..."
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none font-medium"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="date"
                      required
                      value={eventForm.startDate}
                      onChange={(e) => setEventForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="date"
                      required
                      value={eventForm.endDate}
                      onChange={(e) => setEventForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Category & Branch */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category Association</label>
                    <select
                      required
                      value={eventForm.categoryId}
                      onChange={(e) => setEventForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer font-bold"
                    >
                      <option value="" disabled>Select a category</option>
                      {eventCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name} ({cat.parentGroup})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Branch Scope</label>
                    <select
                      value={eventForm.branchId}
                      onChange={(e) => setEventForm(prev => ({ ...prev, branchId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer font-bold"
                    >
                      <option value="All">All Branches</option>
                      <option value="GN">Gawun Nama (GN)</option>
                      <option value="RS">Runjin Sambo (RS)</option>
                    </select>
                  </div>
                </div>

                {/* Session & Term */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Academic Session</label>
                    <select
                      required
                      value={eventForm.sessionId}
                      onChange={(e) => setEventForm(prev => ({ ...prev, sessionId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select session</option>
                      {academicSessions.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Academic Term</label>
                    <select
                      required
                      value={eventForm.termId}
                      onChange={(e) => setEventForm(prev => ({ ...prev, termId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer font-bold"
                    >
                      <option value="" disabled>Select term</option>
                      {terms.filter(t => t.sessionId === eventForm.sessionId || !eventForm.sessionId).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3.5 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEventModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Syncing...' : 'Save Scheduled Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: EVENT TASK REGISTRY / EDIT FORM ----------------- */}
      <AnimatePresence>
        {taskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {editingTask ? 'Modify Event Task' : 'Register New Event Task'}
                </h3>
                <button 
                  onClick={() => setTaskModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
                {validationError && (
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl flex items-start space-x-2 text-rose-800 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Quick Teaching Deadline Presets */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quick Presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaskForm(prev => ({
                        ...prev,
                        title: 'Weekly Teaching Record',
                        description: 'Log classroom instruction topics, board work layout, student notebook instructions, and book work coverage counts.',
                        assignedUser: 'All Teachers',
                        dueDate: '2026-07-10',
                        dueTime: '17:00',
                        taskType: 'teaching_record',
                        reminderNotice: 'Due Friday at 5:00 PM. Please attach photos of classroom board and notebook samples.'
                      }))}
                      className="p-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-left transition-all cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-blue-900 block">Weekly Teaching Record</span>
                      <span className="text-[10px] text-blue-600 font-medium">Due Friday @ 5:00 PM</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaskForm(prev => ({
                        ...prev,
                        title: 'Weekly Lesson Plan',
                        description: 'Submit structured weekly lesson plans, behavioral objectives, learning aids, and assessment strategies.',
                        assignedUser: 'All Teachers',
                        dueDate: '2026-07-06',
                        dueTime: '08:00',
                        taskType: 'lesson_plan',
                        reminderNotice: 'Due Monday at 8:00 AM before first period assembly.'
                      }))}
                      className="p-2 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/70 text-left transition-all cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-teal-900 block">Weekly Lesson Plan</span>
                      <span className="text-[10px] text-teal-600 font-medium">Due Monday @ 8:00 AM</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaskForm(prev => ({
                        ...prev,
                        title: 'Monthly Curriculum Progress',
                        description: 'Audit syllabus milestones coverage vs. scheme of work for the entire month across all assigned grades.',
                        assignedUser: 'All Teachers',
                        dueDate: '2026-07-31',
                        dueTime: '16:00',
                        taskType: 'curriculum_progress',
                        reminderNotice: 'Due at the end of the month. Compare planned topics vs taught topics.'
                      }))}
                      className="p-2 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-left transition-all cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-purple-900 block">Monthly Progress</span>
                      <span className="text-[10px] text-purple-600 font-medium">Due End of Month</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaskForm(prev => ({
                        ...prev,
                        title: 'Scheme of Work Review',
                        description: 'Departmental Scheme of Work progress audit, curriculum pace check, and remedial adjustment review.',
                        assignedUser: 'All Teachers',
                        dueDate: '2026-07-17',
                        dueTime: '15:00',
                        taskType: 'scheme_review',
                        reminderNotice: 'Due Week 4 Friday. Review milestone pacing and student work coverage.'
                      }))}
                      className="p-2 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-left transition-all cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-amber-900 block">Scheme of Work Review</span>
                      <span className="text-[10px] text-amber-600 font-medium">Due Week 4 Friday</span>
                    </button>
                  </div>
                </div>

                {/* Parent Event Selection & Task Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Parent Event Scope</label>
                    <select
                      required
                      value={taskForm.eventId}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, eventId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer font-bold"
                    >
                      <option value="" disabled>Select scheduled event</option>
                      {events.map(evt => (
                        <option key={evt.id} value={evt.id}>{evt.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deadline / Task Type</label>
                    <select
                      value={taskForm.taskType}
                      onChange={(e: any) => setTaskForm(prev => ({ ...prev, taskType: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer font-bold text-slate-700"
                    >
                      <option value="teaching_record">Weekly Teaching Record</option>
                      <option value="lesson_plan">Weekly Lesson Plan</option>
                      <option value="curriculum_progress">Monthly Curriculum Progress</option>
                      <option value="scheme_review">Scheme of Work Review</option>
                      <option value="general">General Operations Task</option>
                    </select>
                  </div>
                </div>

                {/* Task Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Task Title / Activity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekly Teaching Record"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                  />
                </div>

                {/* Description Guidelines */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Guidelines & Expectations</label>
                  <textarea
                    placeholder="Formulate paper with 40 objectives & 5 structural questions based on term syllabus..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none font-medium"
                  />
                </div>

                {/* Assigned User & Due Date & Due Time */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assignee</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. All Teachers"
                      value={taskForm.assignedUser}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, assignedUser: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</label>
                    <input
                      type="date"
                      required
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Due Time</label>
                    <input
                      type="time"
                      value={taskForm.dueTime}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, dueTime: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Reminder Notice */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Automated Reminder Notice</label>
                  <input
                    type="text"
                    placeholder="e.g. Due Friday at 5:00 PM. Please attach photos of classroom board."
                    value={taskForm.reminderNotice}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, reminderNotice: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                  />
                </div>

                {/* Status & Submission Tracking */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select
                      required
                      value={taskForm.status}
                      onChange={(e: any) => setTaskForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer font-bold"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Submission Compliance</label>
                    <select
                      value={taskForm.submissionStatus}
                      onChange={(e: any) => setTaskForm(prev => ({ ...prev, submissionStatus: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer font-bold text-slate-700"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Submitted On Time">Submitted On Time</option>
                      <option value="Submitted Late">Submitted Late</option>
                      <option value="Not Submitted">Not Submitted</option>
                    </select>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-3.5 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setTaskModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Syncing...' : 'Save Task Association'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: EVENT ASSIGNMENT REGISTRY / EDIT FORM ----------------- */}
      <AnimatePresence>
        {asgModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {editingAsg ? 'Modify Task Assignment' : 'Register New Task Assignment'}
                </h3>
                <button 
                  onClick={() => setAsgModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAssignment} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
                {validationError && (
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl flex items-start space-x-2 text-rose-800 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Linked Task Scope */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Linked School Task</label>
                  <select
                    required
                    value={asgForm.taskId}
                    onChange={(e) => setAsgForm(prev => ({ ...prev, taskId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer font-bold text-slate-700"
                  >
                    <option value="" disabled>Select a scheduled operational task</option>
                    {eventTasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                {/* Staff Member Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Staff Member Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mrs. Aisha Abubakar"
                    value={asgForm.assignedUser}
                    onChange={(e) => setAsgForm(prev => ({ ...prev, assignedUser: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-semibold"
                  />
                </div>

                {/* Assigned Role & Assigned Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Professional Role</label>
                    <select
                      required
                      value={asgForm.assignedRole}
                      onChange={(e: any) => setAsgForm(prev => ({ ...prev, assignedRole: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer font-bold text-slate-700"
                    >
                      <option value="Teacher">Teacher</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Store Manager">Store Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Date</label>
                    <input
                      type="date"
                      required
                      value={asgForm.assignedDate}
                      onChange={(e) => setAsgForm(prev => ({ ...prev, assignedDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Completion Date (Optional/Manual sign-off) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Completion Date (Optional)</label>
                  <input
                    type="date"
                    value={asgForm.completionDate}
                    onChange={(e) => setAsgForm(prev => ({ ...prev, completionDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Leave empty if this task assignment is currently active/in progress.</p>
                </div>

                {/* Actions */}
                <div className="pt-3.5 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setAsgModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Syncing...' : 'Save Assignment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: REGISTER/EDIT COLLECTION CAMPAIGN ----------------- */}
      <AnimatePresence>
        {campaignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    {editingCampaign ? 'Modify Collection Campaign' : 'Register Collection Campaign'}
                  </h3>
                  <p className="text-[10px] text-slate-300">Set weekly operational targets and track progress</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setCampaignModalOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveCampaign} className="p-5 space-y-4">
                
                {/* Campaign Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Week 2 Early Bird Reminder"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Timeline Week */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Timeline Milestone *</label>
                    <select
                      value={campaignForm.week}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, week: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all animate-none"
                    >
                      <option value="Week 2">Week 2</option>
                      <option value="Week 4">Week 4</option>
                      <option value="Week 6">Week 6</option>
                      <option value="Week 8">Week 8</option>
                      <option value="Week 10">Week 10</option>
                      <option value="General">General Campaign</option>
                    </select>
                  </div>

                  {/* Defaulters Target Count */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Defaulter Target Count</label>
                    <input
                      type="number"
                      min="0"
                      value={campaignForm.defaulterCount}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, defaulterCount: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={campaignForm.startDate}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date *</label>
                    <input
                      type="date"
                      required
                      value={campaignForm.endDate}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Financial Quotas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Collection (₦)</label>
                    <input
                      type="number"
                      min="0"
                      value={campaignForm.targetCollection}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, targetCollection: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Actual Collected (₦)</label>
                    <input
                      type="number"
                      min="0"
                      value={campaignForm.actualCollection}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, actualCollection: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3.5 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setCampaignModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingCampaign ? 'Save Changes' : 'Register Campaign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
