import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';
import Toast from './Toast';

interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Term {
  id: string;
  sessionId: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface SchoolClass {
  id: string;
  name: string;
  level: string;
  branch: string;
  sectionId?: string;
}

interface Student {
  id: string;
  name: string;
  level: 'nursery' | 'primary' | 'secondary' | 'islamia';
  grade: string;
  branch?: 'GN' | 'RS';
  enrollmentNo?: string;
}

interface OptionalCharge {
  id: string;
  name: string;
  description: string;
  amount: number;
  isActive: boolean;
}

interface StudentFeeItem {
  id?: string;
  ledgerId?: string;
  type: 'term_fee' | 'optional_charge' | 'discount' | 'scholarship' | 'carry_forward';
  referenceId: string;
  name: string;
  amount: number;
}

interface StudentFeeLedger {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  sectionId: string;
  branch: 'GN' | 'RS';
  sessionId: string;
  termId: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partially Paid';
  baseTermFee: number;
  optionalChargesFee: number;
  discountAmount: number;
  scholarshipAmount: number;
  carryForward: number;
  outstanding: number;
  grandTotal: number;
  billingDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
  items?: StudentFeeItem[];
}

// Preset discounts and scholarships
const PRESET_DISCOUNTS = [
  { name: "Sibling Discount (10%)", value: 10, mode: "percent" },
  { name: "Sibling Discount (15%)", value: 15, mode: "percent" },
  { name: "Staff Child Discount (50%)", value: 50, mode: "percent" },
  { name: "Early Bird Discount (5%)", value: 5, mode: "percent" },
  { name: "Custom Flat Discount", value: 0, mode: "flat" }
];

const PRESET_SCHOLARSHIPS = [
  { name: "Full Academic Scholarship (100%)", value: 100, mode: "percent" },
  { name: "Half Academic Scholarship (50%)", value: 50, mode: "percent" },
  { name: "Sports Merit Scholarship (25%)", value: 25, mode: "percent" },
  { name: "Custom Flat Scholarship", value: 0, mode: "flat" }
];

export default function StudentBilling() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [ledgers, setLedgers] = useState<StudentFeeLedger[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [optionalCharges, setOptionalCharges] = useState<OptionalCharge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedClassId, setSelectedClassId] = useState<string>('All');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('All');
  const [selectedTermId, setSelectedTermId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk Generator Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState<boolean>(false);
  const [genSessionId, setGenSessionId] = useState<string>('');
  const [genTermId, setGenTermId] = useState<string>('');
  const [genBranch, setGenBranch] = useState<string>('All');
  const [genClassId, setGenClassId] = useState<string>('All');
  const [genRecreate, setGenRecreate] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [genResult, setGenResult] = useState<{ countGenerated: number; totalValue: number } | null>(null);

  // Inspector Modal / Details state
  const [inspectLedger, setInspectLedger] = useState<StudentFeeLedger | null>(null);
  const [inspectItems, setInspectItems] = useState<StudentFeeItem[]>([]);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);

  // Inspector edit/adjustment state
  const [editedStatus, setEditedStatus] = useState<'Draft' | 'Sent' | 'Paid' | 'Partially Paid'>('Draft');
  const [editedCarryForward, setEditedCarryForward] = useState<number>(0);
  const [editedBillingDate, setEditedBillingDate] = useState<string>('');
  const [editedDueDate, setEditedDueDate] = useState<string>('');

  // Dropdown UI states inside Inspector
  const [selectedOptionalChargeId, setSelectedOptionalChargeId] = useState<string>('');
  const [customOptionalChargeName, setCustomOptionalChargeName] = useState<string>('');
  const [customOptionalChargeAmount, setCustomOptionalChargeAmount] = useState<string>('');

  const [selectedDiscountIndex, setSelectedDiscountIndex] = useState<string>('');
  const [customDiscountName, setCustomDiscountName] = useState<string>('');
  const [customDiscountAmount, setCustomDiscountAmount] = useState<string>('');

  const [selectedScholarshipIndex, setSelectedScholarshipIndex] = useState<string>('');
  const [customScholarshipName, setCustomScholarshipName] = useState<string>('');
  const [customScholarshipAmount, setCustomScholarshipAmount] = useState<string>('');

  // Manual create bill modal
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualStudentId, setManualStudentId] = useState<string>('');
  const [manualSessionId, setManualSessionId] = useState<string>('');
  const [manualTermId, setManualTermId] = useState<string>('');
  const [manualSaving, setManualSaving] = useState<boolean>(false);

  // Timeline & Parent Alert States
  const [currentSimulatedDate, setCurrentSimulatedDate] = useState<string>("2026-07-04");
  const [transitions, setTransitions] = useState<any[]>([]);
  const [parentNotifications, setParentNotifications] = useState<any[]>([]);
  const [showTimelinePanel, setShowTimelinePanel] = useState<boolean>(true);
  const [timelineLogTab, setTimelineLogTab] = useState<'transitions' | 'notifications'>('transitions');

  // Load baseline configurations
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ledgersRes, sessionsRes, termsRes, classesRes, studentsRes, optionalRes, timelineRes, parentNotificationsRes] = await Promise.all([
        fetch('/api/student_fee_ledgers'),
        fetch('/api/academic-sessions'),
        fetch('/api/terms'),
        fetch('/api/classes'),
        fetch('/api/students'),
        fetch('/api/optional_charges'),
        fetch('/api/timeline'),
        fetch('/api/parent_notifications')
      ]);

      if (!ledgersRes.ok || !sessionsRes.ok || !termsRes.ok || !classesRes.ok || !studentsRes.ok || !optionalRes.ok) {
        throw new Error("One or more network requests failed to load SAMS records.");
      }

      const [ledgersData, sessionsData, termsData, classesData, studentsData, optionalData, timelineData, notificationsData] = await Promise.all([
        ledgersRes.json(),
        sessionsRes.json(),
        termsRes.json(),
        classesRes.json(),
        studentsRes.json(),
        optionalRes.json(),
        timelineRes.ok ? timelineRes.json() : Promise.resolve({ currentSimulatedDate: "2026-07-04", transitions: [] }),
        parentNotificationsRes.ok ? parentNotificationsRes.json() : Promise.resolve([])
      ]);

      setLedgers(ledgersData);
      setSessions(sessionsData);
      setTerms(termsData);
      setClasses(classesData);
      setStudents(studentsData);
      setOptionalCharges(optionalData.filter((oc: any) => oc.isActive));
      
      if (timelineData) {
        setCurrentSimulatedDate(timelineData.currentSimulatedDate || "2026-07-04");
        setTransitions(timelineData.transitions || []);
      }
      if (notificationsData) {
        setParentNotifications(notificationsData);
      }

      // Auto pick default active sessions/terms for generators
      const activeSes = sessionsData.find((s: any) => s.status === 'active') || sessionsData[0];
      if (activeSes) {
        setGenSessionId(activeSes.id);
        const relatedTerms = termsData.filter((t: any) => t.sessionId === activeSes.id);
        if (relatedTerms.length > 0) {
          setGenTermId(relatedTerms[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load academic and billing datasets.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSimulatedDate = async (newDate: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/timeline/set-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentSimulatedDate(data.currentSimulatedDate);
        setTransitions(data.transitions || []);
        
        // Refresh ledgers and parent notifications
        const [ledgersRes, notificationsRes] = await Promise.all([
          fetch('/api/student_fee_ledgers'),
          fetch('/api/parent_notifications')
        ]);
        if (ledgersRes.ok) setLedgers(await ledgersRes.ok ? await ledgersRes.json() : []);
        if (notificationsRes.ok) setParentNotifications(await notificationsRes.ok ? await notificationsRes.json() : []);
      }
    } catch (err: any) {
      console.error("Error setting timeline date:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTransitions = async () => {
    try {
      setLoading(true);
      await fetch('/api/term_transitions/clear', { method: 'POST' });
      setTransitions([]);
      // Reset the timeline date to a pre-term value so they can restart simulation
      await handleUpdateSimulatedDate('2025-08-15');
    } catch (err) {
      console.error("Error clearing transitions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/parent_notifications/${id}/read`, {
        method: 'POST'
      });
      if (response.ok) {
        setParentNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error("Error reading notification:", err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/parent_notifications/mark-all-read', {
        method: 'POST'
      });
      if (response.ok) {
        setParentNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("Error reading all notifications:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync terms when generator session changes
  useEffect(() => {
    if (genSessionId) {
      const filtered = terms.filter(t => t.sessionId === genSessionId);
      if (filtered.length > 0) {
        setGenTermId(filtered[0].id);
      } else {
        setGenTermId('');
      }
    }
  }, [genSessionId, terms]);

  // Sync terms for manual bill
  useEffect(() => {
    if (manualSessionId) {
      const filtered = terms.filter(t => t.sessionId === manualSessionId);
      if (filtered.length > 0) {
        setManualTermId(filtered[0].id);
      } else {
        setManualTermId('');
      }
    }
  }, [manualSessionId, terms]);

  // Run bulk billing generator
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genSessionId || !genTermId) {
      setToast({ message: "Please ensure both an Academic Session and Academic Term are selected.", type: "warning" });
      return;
    }

    try {
      setGenerating(true);
      setGenResult(null);
      const response = await fetch('/api/billing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: genSessionId,
          termId: genTermId,
          branch: genBranch,
          classId: genClassId,
          recreate: genRecreate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to trigger SAMS billing generator engine.");
      }

      const data = await response.json();
      setGenResult(data);
      // Refresh list
      const ledgersRes = await fetch('/api/student_fee_ledgers');
      if (ledgersRes.ok) {
        const ledgersData = await ledgersRes.json();
        setLedgers(ledgersData);
      }
      setToast({ message: "SAMS Billing generation completed successfully!", type: "success" });
    } catch (err: any) {
      setToast({ message: `Error generating bills: ${err.message}`, type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  // Delete ledger entry
  const handleDeleteLedger = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the student fee bill for "${name}"?\nThis cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/student_fee_ledgers/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error("Failed to delete ledger entry.");
      }

      setLedgers(prev => prev.filter(l => l.id !== id));
      if (inspectLedger?.id === id) {
        setInspectLedger(null);
      }
      setToast({ message: `Student fee bill for "${name}" successfully deleted.`, type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to delete student fee bill.", type: "error" });
    }
  };

  // Inspect student fee ledger details
  const handleInspectLedger = async (ledger: StudentFeeLedger) => {
    try {
      setInspectLoading(true);
      setInspectLedger(ledger);
      
      const response = await fetch(`/api/student_fee_ledgers/${ledger.id}`);
      if (!response.ok) {
        throw new Error("Failed to load invoice items.");
      }
      const data = await response.json();
      setInspectItems(data.items || []);

      // Seed editing inputs
      setEditedStatus(data.status);
      setEditedCarryForward(data.carryForward || 0);
      setEditedBillingDate(data.billingDate || '');
      setEditedDueDate(data.dueDate || '');

      // Reset inputs
      setSelectedOptionalChargeId('');
      setCustomOptionalChargeName('');
      setCustomOptionalChargeAmount('');
      setSelectedDiscountIndex('');
      setCustomDiscountName('');
      setCustomDiscountAmount('');
      setSelectedScholarshipIndex('');
      setCustomScholarshipName('');
      setCustomScholarshipAmount('');
    } catch (err: any) {
      setToast({ message: `Error loading ledger breakdown: ${err.message}`, type: "error" });
    } finally {
      setInspectLoading(false);
    }
  };

  // Save Manual Bill Creation
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId || !manualSessionId || !manualTermId) {
      setToast({ message: "Please fill in all manual creation fields.", type: "warning" });
      return;
    }

    const selectedStudent = students.find(s => s.id === manualStudentId);
    if (!selectedStudent) return;

    try {
      setManualSaving(true);
      // Let's create it in Draft status. The server generate API can also do it, but here we can generate single via API or post custom.
      // To keep it clean and let server do base fee calculation automatically, we can trigger standard generator with recreate=false but filtered to this student's class and branch!
      // Wait, we can just trigger /api/billing/generate with student class, which will safely build or we can post a manual blank ledger!
      // To be accurate and robust, we will post a manual ledger through standard generator first, or we can use our POST endpoint! Let's use our bulk generator mapped to standard but for that specific student's class, then fetch ledgers. Let's do that or post a custom initialized ledger.
      // Let's generate a ledger using generator, but filtered. Wait! The generator handles students. We can run the generator for student's class to auto-populate.
      // Let's just run generator for this student's class.
      const studentClass = classes.find(c => c.name === selectedStudent.grade && c.branch === selectedStudent.branch);
      if (!studentClass) {
        throw new Error("The selected student is not associated with an active section class.");
      }

      const response = await fetch('/api/billing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: manualSessionId,
          termId: manualTermId,
          branch: selectedStudent.branch,
          classId: studentClass.id,
          recreate: false
        })
      });

      if (!response.ok) {
        throw new Error("SAMS Billing engine failed to initialize ledger.");
      }

      // Refresh
      const ledgersRes = await fetch('/api/student_fee_ledgers');
      if (ledgersRes.ok) {
        const ledgersData = await ledgersRes.json();
        setLedgers(ledgersData);
        
        // Find the newly generated ledger for this student and inspect it immediately!
        const found = ledgersData.find((l: any) => 
          l.studentId === selectedStudent.id && 
          l.sessionId === manualSessionId && 
          l.termId === manualTermId
        );
        if (found) {
          handleInspectLedger(found);
          setToast({ message: "Student bill successfully initialized!", type: "success" });
        } else {
          setToast({
            message: "Student bill successfully initialized! (Note: if no bill appeared, check if a fee template exists for this section, branch, and term).",
            type: "warning"
          });
        }
      }

      setIsManualModalOpen(false);
      setManualStudentId('');
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setManualSaving(false);
    }
  };

  // Calculations inside Inspector
  const computedBaseTermFee = useMemo(() => {
    return inspectItems
      .filter(i => i.type === 'term_fee')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [inspectItems]);

  const computedOptionalChargesFee = useMemo(() => {
    return inspectItems
      .filter(i => i.type === 'optional_charge')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [inspectItems]);

  const computedDiscountAmount = useMemo(() => {
    return inspectItems
      .filter(i => i.type === 'discount')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [inspectItems]);

  const computedScholarshipAmount = useMemo(() => {
    return inspectItems
      .filter(i => i.type === 'scholarship')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [inspectItems]);

  const computedGrandTotal = useMemo(() => {
    const charge = computedBaseTermFee + computedOptionalChargesFee + Number(editedCarryForward);
    const credit = computedDiscountAmount + computedScholarshipAmount;
    return Math.max(0, charge - credit);
  }, [computedBaseTermFee, computedOptionalChargesFee, editedCarryForward, computedDiscountAmount, computedScholarshipAmount]);

  // Save inspected ledger adjustments
  const handleSaveInspectAdjustments = async () => {
    if (!inspectLedger) return;

    try {
      const payload = {
        status: editedStatus,
        baseTermFee: computedBaseTermFee,
        optionalChargesFee: computedOptionalChargesFee,
        discountAmount: computedDiscountAmount,
        scholarshipAmount: computedScholarshipAmount,
        carryForward: Number(editedCarryForward),
        outstanding: computedGrandTotal, // Outstanding is grand total initially
        grandTotal: computedGrandTotal,
        billingDate: editedBillingDate,
        dueDate: editedDueDate,
        items: inspectItems
      };

      const response = await fetch(`/api/student_fee_ledgers/${inspectLedger.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to save changes to student ledger.");
      }

      const updated = await response.json();
      
      // Update local ledgers list
      setLedgers(prev => prev.map(l => l.id === inspectLedger.id ? { ...l, ...updated } : l));
      setInspectLedger({ ...inspectLedger, ...updated });
      setToast({ message: "🎓 Student bill adjustments successfully saved & recalculated!", type: "success" });
    } catch (err: any) {
      setToast({ message: `Error: ${err.message}`, type: "error" });
    }
  };

  // Add Item actions inside inspector
  const handleAddOptionalCharge = () => {
    if (selectedOptionalChargeId) {
      const ocObj = optionalCharges.find(oc => oc.id === selectedOptionalChargeId);
      if (ocObj) {
        // Avoid duplicate optional charge of same blueprint
        if (inspectItems.some(i => i.type === 'optional_charge' && i.referenceId === ocObj.id)) {
          setToast({ message: "This optional charge is already applied to this student's ledger.", type: "warning" });
          return;
        }

        const newItem: StudentFeeItem = {
          type: 'optional_charge',
          referenceId: ocObj.id,
          name: ocObj.name,
          amount: ocObj.amount
        };
        setInspectItems(prev => [...prev, newItem]);
        setSelectedOptionalChargeId('');
      }
    } else if (customOptionalChargeName && customOptionalChargeAmount) {
      const newItem: StudentFeeItem = {
        type: 'optional_charge',
        referenceId: `custom-oc-${Date.now()}`,
        name: customOptionalChargeName,
        amount: Number(customOptionalChargeAmount) || 0
      };
      setInspectItems(prev => [...prev, newItem]);
      setCustomOptionalChargeName('');
      setCustomOptionalChargeAmount('');
    } else {
      setToast({ message: "Please select an optional charge or enter custom charge details.", type: "warning" });
    }
  };

  const handleAddDiscount = () => {
    if (selectedDiscountIndex !== '') {
      const idx = Number(selectedDiscountIndex);
      const preset = PRESET_DISCOUNTS[idx];
      let amount = 0;
      if (preset.mode === 'percent') {
        amount = Math.round((computedBaseTermFee * preset.value) / 100);
      } else {
        amount = Number(customDiscountAmount) || 0;
      }

      if (amount <= 0 && preset.mode === 'flat') {
        setToast({ message: "Please enter a flat discount amount.", type: "warning" });
        return;
      }

      const newItem: StudentFeeItem = {
        type: 'discount',
        referenceId: `dsc-${Date.now()}`,
        name: preset.mode === 'percent' ? preset.name : (customDiscountName || "Custom Discount"),
        amount
      };
      setInspectItems(prev => [...prev, newItem]);
      setSelectedDiscountIndex('');
      setCustomDiscountName('');
      setCustomDiscountAmount('');
    }
  };

  const handleAddScholarship = () => {
    if (selectedScholarshipIndex !== '') {
      const idx = Number(selectedScholarshipIndex);
      const preset = PRESET_SCHOLARSHIPS[idx];
      let amount = 0;
      if (preset.mode === 'percent') {
        amount = Math.round((computedBaseTermFee * preset.value) / 100);
      } else {
        amount = Number(customScholarshipAmount) || 0;
      }

      if (amount <= 0 && preset.mode === 'flat') {
        setToast({ message: "Please enter a flat scholarship amount.", type: "warning" });
        return;
      }

      const newItem: StudentFeeItem = {
        type: 'scholarship',
        referenceId: `sch-${Date.now()}`,
        name: preset.mode === 'percent' ? preset.name : (customScholarshipName || "Custom Scholarship"),
        amount
      };
      setInspectItems(prev => [...prev, newItem]);
      setSelectedScholarshipIndex('');
      setCustomScholarshipName('');
      setCustomScholarshipAmount('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setInspectItems(prev => prev.filter((_, i) => i !== index));
  };

  // Filtering ledger lists
  const filteredLedgers = useMemo(() => {
    return ledgers.filter(l => {
      const matchesBranch = selectedBranch === 'All' || l.branch === selectedBranch;
      const matchesClass = selectedClassId === 'All' || l.classId === selectedClassId;
      const matchesSession = selectedSessionId === 'All' || l.sessionId === selectedSessionId;
      const matchesTerm = selectedTermId === 'All' || l.termId === selectedTermId;
      const matchesStatus = selectedStatus === 'All' || l.status === selectedStatus;
      const matchesSearch = searchQuery === '' || 
        (l.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesBranch && matchesClass && matchesSession && matchesTerm && matchesStatus && matchesSearch;
    });
  }, [ledgers, selectedBranch, selectedClassId, selectedSessionId, selectedTermId, selectedStatus, searchQuery]);

  // Financial aggregates
  const financialsSummary = useMemo(() => {
    let totalBilled = 0;
    let totalOutstanding = 0;
    let totalDiscounts = 0;
    let totalScholarships = 0;
    let draftCount = 0;
    let sentCount = 0;
    let paidCount = 0;

    filteredLedgers.forEach(l => {
      totalBilled += l.grandTotal || 0;
      totalOutstanding += l.outstanding || 0;
      totalDiscounts += l.discountAmount || 0;
      totalScholarships += l.scholarshipAmount || 0;
      
      if (l.status === 'Draft') draftCount++;
      else if (l.status === 'Sent') sentCount++;
      else if (l.status === 'Paid') paidCount++;
    });

    return {
      totalBilled,
      totalOutstanding,
      totalDiscounts,
      totalScholarships,
      draftCount,
      sentCount,
      paidCount,
      count: filteredLedgers.length
    };
  }, [filteredLedgers]);

  const activeSimulatedTerm = useMemo(() => {
    return terms.find(t => currentSimulatedDate >= t.startDate && currentSimulatedDate <= t.endDate);
  }, [terms, currentSimulatedDate]);

  // Resolve helper names
  const getSessionName = (id: string) => sessions.find(s => s.id === id)?.name || id;
  const getTermName = (id: string) => terms.find(t => t.id === id)?.name || id;
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || id;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Lucide.Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-semibold">Contacting SAMS Billing Engine...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving ledgers, templates, and student portfolios</p>
      </div>
    );
  }

  return (
    <div id="student-billing-workspace" className="space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Lucide.Coins className="w-7 h-7 text-indigo-600 mr-2.5" />
            Student Billing Ledgers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automate and manage term charges, scholarships, active optional items, and custom sibling discounts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1"
          >
            <Lucide.UserPlus className="w-4 h-4 text-slate-500" />
            <span>Initialize Bill Manually</span>
          </button>
          <button
            onClick={() => {
              setGenResult(null);
              setIsGenModalOpen(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Lucide.Sparkles className="w-4 h-4" />
            <span>Automatic Billing Service</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-150 rounded-xl p-4 text-xs font-semibold text-rose-700 flex items-center space-x-2">
          <Lucide.AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TIMELINE & AUTOMATION CENTER */}
      <div id="timeline-automation-center" className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl mt-1 shrink-0">
              <Lucide.CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <span>Timeline & SAMS Billing Automation Center</span>
                <span className="ml-2 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-full flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1 animate-pulse"></span>
                  Interactive
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                Simulate academic milestones. Changing dates automatically generates term ledgers, carries previous unpaid dues, starts the 14-day due date countdown, and notifies parents.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleClearTransitions}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              title="Reset Simulated Date to 2025-08-15 & Wipe Logs"
            >
              <Lucide.RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Simulator</span>
            </button>
            <button
              onClick={() => setShowTimelinePanel(!showTimelinePanel)}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span>{showTimelinePanel ? "Hide Details" : "Show Details"}</span>
              <Lucide.ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTimelinePanel ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {showTimelinePanel && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* DATE CONTROLS */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-150/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Simulated School Date</label>
                  <div className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[11px] font-extrabold rounded-lg">
                    {currentSimulatedDate}
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <input
                    type="date"
                    value={currentSimulatedDate}
                    onChange={(e) => handleUpdateSimulatedDate(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-150 outline-none"
                  />
                </div>

                {/* ACTIVE TERM DISPLAY */}
                <div className="bg-white p-3 rounded-xl border border-slate-150 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Academic Status</span>
                    <p className="text-xs font-black text-slate-800">
                      {activeSimulatedTerm ? activeSimulatedTerm.name : "Academic Break / Holiday"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {activeSimulatedTerm ? (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md uppercase">
                        In Session
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded-md uppercase">
                        Vacation
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* TIMELINE MILESTONE PRESETS */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jump to Academic Milestone</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateSimulatedDate("2025-08-15")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      currentSimulatedDate === "2025-08-15"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Phase 0: Setup</span>
                    <span className="text-xs font-bold mt-1">Pre-Term 1 Info</span>
                    <span className="text-[10px] font-mono mt-1 block opacity-90">Aug 15, 2025</span>
                  </button>

                  <button
                    onClick={() => handleUpdateSimulatedDate("2025-09-02")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      currentSimulatedDate === "2025-09-02"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Phase 1: Term 1 Start</span>
                    <span className="text-xs font-bold mt-1">Auto-Bill T1 Fees</span>
                    <span className="text-[10px] font-mono mt-1 block opacity-90">Sep 02, 2025</span>
                  </button>

                  <button
                    onClick={() => handleUpdateSimulatedDate("2025-12-19")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      currentSimulatedDate === "2025-12-19"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Phase 2: Term 1 End</span>
                    <span className="text-xs font-bold mt-1">Carry Outstanding</span>
                    <span className="text-[10px] font-mono mt-1 block opacity-90">Dec 19, 2025</span>
                  </button>

                  <button
                    onClick={() => handleUpdateSimulatedDate("2026-01-06")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      currentSimulatedDate === "2026-01-06"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Phase 3: Term 2 Start</span>
                    <span className="text-xs font-bold mt-1">Auto-Bill T2 + Carry</span>
                    <span className="text-[10px] font-mono mt-1 block opacity-90">Jan 06, 2026</span>
                  </button>

                  <button
                    onClick={() => handleUpdateSimulatedDate("2026-04-04")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      currentSimulatedDate === "2026-04-04"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Phase 4: Term 2 End</span>
                    <span className="text-xs font-bold mt-1">Carry Forward</span>
                    <span className="text-[10px] font-mono mt-1 block opacity-90">Apr 04, 2026</span>
                  </button>

                  <button
                    onClick={() => handleUpdateSimulatedDate("2026-04-21")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      currentSimulatedDate === "2026-04-21"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Phase 5: Term 3 Start</span>
                    <span className="text-xs font-bold mt-1">Auto-Bill T3 + Carry</span>
                    <span className="text-[10px] font-mono mt-1 block opacity-90">Apr 21, 2026</span>
                  </button>
                </div>
              </div>
            </div>

            {/* LOGS PANEL */}
            <div className="lg:col-span-7 flex flex-col bg-slate-50/50 rounded-xl border border-slate-150 p-4 space-y-4 min-h-[300px]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTimelineLogTab('transitions')}
                    className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                      timelineLogTab === 'transitions'
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Lucide.History className="w-3.5 h-3.5" />
                    <span>Automation Log ({transitions.length})</span>
                  </button>
                  <button
                    onClick={() => setTimelineLogTab('notifications')}
                    className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                      timelineLogTab === 'notifications'
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Lucide.Bell className="w-3.5 h-3.5" />
                    <span>Parent Alerts ({parentNotifications.length})</span>
                    {parentNotifications.some(n => !n.read) && (
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    )}
                  </button>
                </div>

                {timelineLogTab === 'notifications' && parentNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsAsRead}
                    className="text-[10px] text-indigo-600 font-extrabold hover:underline"
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              {/* TAB CONTENTS */}
              <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3 pr-1">
                {timelineLogTab === 'transitions' ? (
                  transitions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                      <Lucide.FolderOpen className="w-8 h-8 text-slate-300" />
                      <p className="text-xs text-slate-500 font-medium">No timeline events have run yet.</p>
                      <p className="text-[10px] text-slate-400">Jump to a Term Start date above to watch automation run!</p>
                    </div>
                  ) : (
                    [...transitions].reverse().map((t: any) => (
                      <div key={t.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1.5 animate-fadeIn">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            t.type === 'begun' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            Term {t.type === 'begun' ? 'Begun' : 'Ended'}: {t.termName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.date}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {t.details}
                        </p>
                      </div>
                    ))
                  )
                ) : (
                  parentNotifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                      <Lucide.BellOff className="w-8 h-8 text-slate-300" />
                      <p className="text-xs text-slate-500 font-medium">No parent alerts have been dispatched.</p>
                      <p className="text-[10px] text-slate-400">Parent alerts generate dynamically with fee ledgers.</p>
                    </div>
                  ) : (
                    [...parentNotifications].reverse().map((n: any) => (
                      <div key={n.id} className={`p-3.5 rounded-xl border transition-all shadow-xs space-y-1.5 ${
                        n.read ? 'bg-white/85 border-slate-150' : 'bg-white border-indigo-200 ring-1 ring-indigo-50'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center">
                              {!n.read && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-1.5 shrink-0"></span>}
                              {n.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold">Student: <span className="text-indigo-600">{n.studentName}</span></p>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{n.date}</span>
                            {!n.read && (
                              <button
                                onClick={() => handleMarkNotificationAsRead(n.id)}
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800"
                                title="Mark read"
                              >
                                <Lucide.Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Billings Billed</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            ₦{financialsSummary.totalBilled.toLocaleString()}
          </h3>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
            <span>Active records: {financialsSummary.count}</span>
            <span className="font-bold text-indigo-600">Total Billed</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding Balances</p>
          <h3 className="text-xl font-black text-amber-700 mt-1">
            ₦{financialsSummary.totalOutstanding.toLocaleString()}
          </h3>
          <div className="flex justify-between text-[10px] mt-1.5">
            <span className="text-slate-500">Draft Status: {financialsSummary.draftCount}</span>
            <span className="font-extrabold text-amber-600 uppercase">Awaiting Collection</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discounts Extended</p>
          <h3 className="text-xl font-black text-rose-700 mt-1">
            ₦{financialsSummary.totalDiscounts.toLocaleString()}
          </h3>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
            <span>Sibling &amp; Staff support</span>
            <span className="text-rose-600 font-bold">Total Deductions</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scholarships Awarded</p>
          <h3 className="text-xl font-black text-emerald-700 mt-1">
            ₦{financialsSummary.totalScholarships.toLocaleString()}
          </h3>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
            <span>Merit, sports, sponsor trust</span>
            <span className="text-emerald-600 font-bold">Total Grants</span>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
          <Lucide.Filter className="w-4 h-4 text-slate-500" />
          <span>Faceted Search &amp; Filter Controls</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Branch Campus</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="All">All Locations</option>
              <option value="GN">Gawun Nama (GN)</option>
              <option value="RS">Runjin Sambo (RS)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Session</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="All">All Sessions</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.status === 'active' ? '(Current)' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Term</label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="All">All Terms</option>
              {terms.filter(t => selectedSessionId === 'All' || t.sessionId === selectedSessionId).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="All">All Classes</option>
              {classes.filter(c => selectedBranch === 'All' || c.branch === selectedBranch).map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.branch})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Billing Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Student</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 pl-8 pr-3 py-2 outline-none focus:border-indigo-500"
              />
              <Lucide.Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* BILLING LEDGER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Student Portfolios</th>
                <th className="px-6 py-4">Branch &amp; Class</th>
                <th className="px-6 py-4">Session / Term</th>
                <th className="px-6 py-4 text-right">Term Charge</th>
                <th className="px-6 py-4 text-right">Addons (Opt)</th>
                <th className="px-6 py-4 text-right">Grants/Discounts</th>
                <th className="px-6 py-4 text-right">Balance Due</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-400 font-bold">
                    <Lucide.FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    No SAMS Student Fee Ledgers found for the selected criteria.
                    <p className="text-[11px] text-slate-400 font-normal mt-1">
                      Try adjusting filters or trigger the Automatic Billing Service above.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLedgers.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900">{l.studentName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {l.studentId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold mr-1.5 uppercase">
                        {l.branch}
                      </span>
                      <span>{getClassName(l.classId)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-semibold">{getSessionName(l.sessionId)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{getTermName(l.termId)}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      ₦{(l.baseTermFee || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-amber-700 font-semibold">
                      {l.optionalChargesFee > 0 ? `+₦${l.optionalChargesFee.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-rose-700 font-semibold">
                      {l.discountAmount + l.scholarshipAmount > 0 ? `-₦${(l.discountAmount + l.scholarshipAmount).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-indigo-950 font-black text-sm">
                      ₦{(l.grandTotal || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        l.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        l.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        l.status === 'Sent' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleInspectLedger(l)}
                          className="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 rounded-lg transition-colors cursor-pointer"
                          title="Inspect Invoice Breakdown"
                        >
                          <Lucide.Sliders className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLedger(l.id, l.studentName)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-lg transition-colors cursor-pointer"
                          title="Discard Invoice Record"
                        >
                          <Lucide.Trash2 className="w-4.5 h-4.5" />
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

      {/* BULK GENERATOR MODAL */}
      <AnimatePresence>
        {isGenModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg border border-slate-200/80 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
              >
                <Lucide.X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                  <Lucide.Sparkles className="w-5.5 h-5.5 text-indigo-600 mr-2" />
                  Automatic Term Billing Service
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Query the active Fee Templates and apply specific overrides to build student bill records instantly.
                </p>
              </div>

              {!genResult ? (
                <form onSubmit={handleBulkGenerate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Session *</label>
                      <select
                        value={genSessionId}
                        onChange={(e) => setGenSessionId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none"
                        required
                      >
                        {sessions.map(s => (
                          <option key={s.id} value={s.id}>{s.name} {s.status === 'active' ? '(Current)' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Term *</label>
                      <select
                        value={genTermId}
                        onChange={(e) => setGenTermId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none"
                        required
                      >
                        <option value="">-- Choose Term --</option>
                        {terms.filter(t => t.sessionId === genSessionId).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Branch Scope</label>
                      <select
                        value={genBranch}
                        onChange={(e) => setGenBranch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none"
                      >
                        <option value="All">All Campuses</option>
                        <option value="GN">Gawun Nama (GN)</option>
                        <option value="RS">Runjin Sambo (RS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class Scope</label>
                      <select
                        value={genClassId}
                        onChange={(e) => setGenClassId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none"
                      >
                        <option value="All">All Classes</option>
                        {classes.filter(c => genBranch === 'All' || c.branch === genBranch).map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.branch})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                    <input
                      type="checkbox"
                      id="genRecreate"
                      checked={genRecreate}
                      onChange={(e) => setGenRecreate(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded outline-none"
                    />
                    <label htmlFor="genRecreate" className="text-xs text-indigo-950 font-bold select-none cursor-pointer">
                      Regenerate bills (recalculates over pre-existing drafts)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {generating ? 'Engine processing ledger portfolios...' : 'Compile Automatic Bills Now'}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-150 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                    <Lucide.CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-950">Billing Compiled Successfully</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Standard pricing configurations and structural overrides were checked and applied.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 max-w-xs mx-auto text-left text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bills Created:</span>
                      <strong className="text-slate-900">{genResult.countGenerated} students</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-bold">
                      <span className="text-slate-500">Aggregate Value:</span>
                      <span className="text-indigo-700">₦{genResult.totalValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsGenModalOpen(false);
                      setGenResult(null);
                    }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Close &amp; View Portfolios
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL INITIALIZE MODAL */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg border border-slate-200/80 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
              >
                <Lucide.X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                  <Lucide.UserPlus className="w-5.5 h-5.5 text-indigo-600 mr-2" />
                  Manual Bill Initialization
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Start a blank billing worksheet for an individual student portfolio.
                </p>
              </div>

              <form onSubmit={handleManualSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Student *</label>
                  <select
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none"
                    required
                  >
                    <option value="">-- Choose Student Portfolio --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.grade} - {s.branch})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Session *</label>
                    <select
                      value={manualSessionId}
                      onChange={(e) => setManualSessionId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none"
                      required
                    >
                      <option value="">-- Choose Session --</option>
                      {sessions.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Term *</label>
                    <select
                      value={manualTermId}
                      onChange={(e) => setManualTermId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none"
                      required
                    >
                      <option value="">-- Choose Term --</option>
                      {terms.filter(t => t.sessionId === manualSessionId).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={manualSaving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:bg-slate-300 disabled:shadow-none"
                >
                  {manualSaving ? 'Saving single worksheet record...' : 'Initialize Student Ledger'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INSPECTOR / ADJUSTMENTS DRAWER-MODAL */}
      <AnimatePresence>
        {inspectLedger && (
          <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-end z-50">
            <motion.div
              initial={{ x: '100%', opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-2xl h-full flex flex-col border-l border-slate-200 shadow-2xl relative"
            >
              
              {/* DRAWER HEADER */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-black text-slate-950 flex items-center">
                    <Lucide.FileText className="w-5.5 h-5.5 text-indigo-600 mr-2" />
                    Ledger Sheet Worksheet
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Configure custom adjustments, scholarships, discounts, and optional micro-billings.
                  </p>
                </div>
                <button
                  onClick={() => setInspectLedger(null)}
                  className="p-1.5 hover:bg-slate-200/60 rounded-full cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Lucide.X className="w-5.5 h-5.5" />
                </button>
              </div>

              {inspectLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold">
                  <Lucide.Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                  Loading student ledger line items...
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* PORTFOLIO CARD */}
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-inner space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-black tracking-tight">{inspectLedger.studentName}</h4>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">STUDENT REF ID: {inspectLedger.studentId}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-500 text-white tracking-wider">
                        {inspectLedger.branch}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px] pt-2.5 border-t border-slate-800">
                      <div>
                        <span className="text-slate-400 block">Class:</span>
                        <strong className="text-slate-200">{getClassName(inspectLedger.classId)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Session:</span>
                        <strong className="text-slate-200">{getSessionName(inspectLedger.sessionId)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Term:</span>
                        <strong className="text-slate-200">{getTermName(inspectLedger.termId)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* ITEMIZATION SECTION */}
                  <div className="space-y-4">
                    <div className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Itemized Line Breakdown</span>
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold lowercase">
                        computed automatically
                      </span>
                    </div>

                    {/* BILL ITEMS TABLE */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20 text-xs">
                      <div className="grid grid-cols-12 bg-slate-150/40 px-3 py-2 font-bold text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <span className="col-span-7">Description / Particulars</span>
                        <span className="col-span-2">Type</span>
                        <span className="col-span-2 text-right">Amount</span>
                        <span className="col-span-1 text-center">X</span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {inspectItems.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 px-3 py-2.5 items-center">
                            <span className="col-span-7 font-semibold text-slate-900">{item.name}</span>
                            <span className="col-span-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                item.type === 'term_fee' ? 'bg-indigo-50 text-indigo-700' :
                                item.type === 'optional_charge' ? 'bg-amber-50 text-amber-700' :
                                item.type === 'discount' ? 'bg-rose-50 text-rose-700' :
                                'bg-emerald-50 text-emerald-700'
                              }`}>
                                {item.type === 'term_fee' ? 'Core' : item.type === 'optional_charge' ? 'Addon' : item.type === 'discount' ? 'Deduct' : 'Grant'}
                              </span>
                            </span>
                            <span className={`col-span-2 text-right font-bold ${
                              item.type === 'discount' || item.type === 'scholarship' ? 'text-rose-600' : 'text-slate-800'
                            }`}>
                              {item.type === 'discount' || item.type === 'scholarship' ? '-' : ''}₦{item.amount.toLocaleString()}
                            </span>
                            <span className="col-span-1 text-center">
                              {/* Only allow removing discounts, scholarships, and optional charges */}
                              {item.type !== 'term_fee' ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                                >
                                  <Lucide.Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              ) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ACTION BAR: ADD OTHERS */}
                  <div className="bg-slate-50/50 p-4 border border-slate-200/80 rounded-2xl space-y-4">
                    <div className="font-bold text-xs text-slate-800 flex items-center space-x-1">
                      <Lucide.Plus className="w-4 h-4 text-slate-500" />
                      <span>Incorporate Add-ons &amp; Deductions</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-xs">
                      
                      {/* OPTIONAL CHARGE SELECTOR */}
                      <div className="border-t border-slate-200/60 pt-3 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Optional Blueprint Item</label>
                        <div className="flex gap-2">
                          <select
                            value={selectedOptionalChargeId}
                            onChange={(e) => {
                              setSelectedOptionalChargeId(e.target.value);
                              if (e.target.value) {
                                setCustomOptionalChargeName('');
                                setCustomOptionalChargeAmount('');
                              }
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-1.5 outline-none"
                          >
                            <option value="">-- Apply Active SAMS Optional Item --</option>
                            {optionalCharges.map(oc => (
                              <option key={oc.id} value={oc.id}>{oc.name} (₦{oc.amount.toLocaleString()})</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddOptionalCharge}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
                          >
                            Add Add-on
                          </button>
                        </div>
                        
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Or Custom:</span>
                          <input
                            type="text"
                            placeholder="Add-on Name..."
                            value={customOptionalChargeName}
                            onChange={(e) => {
                              setCustomOptionalChargeName(e.target.value);
                              setSelectedOptionalChargeId('');
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 outline-none"
                          />
                          <input
                            type="number"
                            placeholder="₦ Amount..."
                            value={customOptionalChargeAmount}
                            onChange={(e) => {
                              setCustomOptionalChargeAmount(e.target.value);
                              setSelectedOptionalChargeId('');
                            }}
                            className="w-24 bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 outline-none"
                          />
                        </div>
                      </div>

                      {/* DISCOUNT SELECTOR */}
                      <div className="border-t border-slate-200/60 pt-3 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Preset SAMS Discount</label>
                        <div className="flex gap-2">
                          <select
                            value={selectedDiscountIndex}
                            onChange={(e) => {
                              setSelectedDiscountIndex(e.target.value);
                              if (e.target.value) {
                                const preset = PRESET_DISCOUNTS[Number(e.target.value)];
                                setCustomDiscountName(preset.name);
                                setCustomDiscountAmount('');
                              }
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-1.5 outline-none"
                          >
                            <option value="">-- Apply Discount Preset --</option>
                            {PRESET_DISCOUNTS.map((d, i) => (
                              <option key={i} value={i}>{d.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddDiscount}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
                          >
                            Add Discount
                          </button>
                        </div>

                        {selectedDiscountIndex !== '' && PRESET_DISCOUNTS[Number(selectedDiscountIndex)].mode === 'flat' && (
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Discount Name..."
                              value={customDiscountName}
                              onChange={(e) => setCustomDiscountName(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 outline-none"
                            />
                            <input
                              type="number"
                              placeholder="₦ Amount..."
                              value={customDiscountAmount}
                              onChange={(e) => setCustomDiscountAmount(e.target.value)}
                              className="w-24 bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* SCHOLARSHIP SELECTOR */}
                      <div className="border-t border-slate-200/60 pt-3 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Preset SAMS Scholarship</label>
                        <div className="flex gap-2">
                          <select
                            value={selectedScholarshipIndex}
                            onChange={(e) => {
                              setSelectedScholarshipIndex(e.target.value);
                              if (e.target.value) {
                                const preset = PRESET_SCHOLARSHIPS[Number(e.target.value)];
                                setCustomScholarshipName(preset.name);
                                setCustomScholarshipAmount('');
                              }
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-1.5 outline-none"
                          >
                            <option value="">-- Apply Scholarship Preset --</option>
                            {PRESET_SCHOLARSHIPS.map((s, i) => (
                              <option key={i} value={i}>{s.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddScholarship}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
                          >
                            Add Grant
                          </button>
                        </div>

                        {selectedScholarshipIndex !== '' && PRESET_SCHOLARSHIPS[Number(selectedScholarshipIndex)].mode === 'flat' && (
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Grant Name..."
                              value={customScholarshipName}
                              onChange={(e) => setCustomScholarshipName(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 outline-none"
                            />
                            <input
                              type="number"
                              placeholder="₦ Amount..."
                              value={customScholarshipAmount}
                              onChange={(e) => setCustomScholarshipAmount(e.target.value)}
                              className="w-24 bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 outline-none"
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* FINANCIAL METRIC & DETAILS */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Carry Forward / Debt</label>
                      <input
                        type="number"
                        placeholder="₦ 0"
                        value={editedCarryForward}
                        onChange={(e) => setEditedCarryForward(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bill Status</label>
                      <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Paid">Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Billing Date</label>
                      <input
                        type="date"
                        value={editedBillingDate}
                        onChange={(e) => setEditedBillingDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grace Payment Due Date</label>
                      <input
                        type="date"
                        value={editedDueDate}
                        onChange={(e) => setEditedDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-3 py-2 outline-none"
                      />
                    </div>
                  </div>

                  {/* SUMMARY SECTION */}
                  <div className="bg-indigo-950 text-slate-100 rounded-2xl p-5 space-y-3.5">
                    <div className="flex justify-between text-xs text-indigo-300">
                      <span>Term core charges:</span>
                      <strong className="text-white">₦{computedBaseTermFee.toLocaleString()}</strong>
                    </div>
                    {computedOptionalChargesFee > 0 && (
                      <div className="flex justify-between text-xs text-indigo-300">
                        <span>Associated optional extras:</span>
                        <strong className="text-white">+₦{computedOptionalChargesFee.toLocaleString()}</strong>
                      </div>
                    )}
                    {editedCarryForward > 0 && (
                      <div className="flex justify-between text-xs text-indigo-300">
                        <span>Pre-existing outstanding balance:</span>
                        <strong className="text-white">+₦{editedCarryForward.toLocaleString()}</strong>
                      </div>
                    )}
                    {(computedDiscountAmount + computedScholarshipAmount) > 0 && (
                      <div className="flex justify-between text-xs text-indigo-300">
                        <span>Active Sibling/Grants deducted:</span>
                        <strong className="text-rose-300">-₦{(computedDiscountAmount + computedScholarshipAmount).toLocaleString()}</strong>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-indigo-900 pt-3 font-bold text-sm">
                      <span className="text-indigo-200 uppercase tracking-wider">Worksheet Net Total Due:</span>
                      <span className="text-white text-base font-black">₦{computedGrandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                </div>
              )}

              {/* DRAWER FOOTER ACTIONS */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setInspectLedger(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  disabled={inspectLoading}
                  onClick={handleSaveInspectAdjustments}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  Save Worksheet &amp; Recalculate
                </button>
              </div>

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
