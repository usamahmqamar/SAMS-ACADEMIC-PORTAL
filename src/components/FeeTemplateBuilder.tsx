import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';

interface FeeHead {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  isMandatory: boolean;
  isActive: boolean;
  branchId: string;
  section: string;
  displayOrder: number;
}

interface Section {
  id: string;
  name: string;
  description: string;
  branch: string;
  session: string;
}

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
  numberOfWeeks: number;
}

interface SchoolClass {
  id: string;
  name: string;
  level: string;
  branch: string;
  sectionId?: string;
}

interface FeeTemplateItem {
  feeHeadId: string;
  amount: number;
}

interface FeeTemplate {
  id: string;
  branch: string;
  session: string;
  term: string;
  sectionId: string;
  totalFee: number;
  items: FeeTemplateItem[];
  createdAt: string;
  updatedAt?: string;
  dueDateOffset?: number;
  gracePeriod?: number;
  reminderSchedule?: string;
  restrictions?: {
    blockReportCard: boolean;
    blockParentPortal: boolean;
    blockBooks: boolean;
    blockPromotion: boolean;
    blockRegistration: boolean;
  };
}

interface ClassFeeOverrideItem {
  feeHeadId: string;
  amount: number;
  isRemoved?: boolean;
}

interface ClassFeeOverride {
  id: string;
  templateId: string;
  classId: string;
  items: ClassFeeOverrideItem[];
  createdAt: string;
  updatedAt?: string;
}

export default function FeeTemplateBuilder() {
  // Navigation: 'templates' | 'overrides'
  const [activeTab, setActiveTab] = useState<'templates' | 'overrides'>('templates');

  // Master States
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classOverrides, setClassOverrides] = useState<ClassFeeOverride[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedSession, setSelectedSession] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedTerm, setSelectedTerm] = useState<string>('All');

  // --- BASE FEE TEMPLATE FORM MODAL STATES ---
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<FeeTemplate | null>(null);
  const [formBranch, setFormBranch] = useState<string>('GN');
  const [formSession, setFormSession] = useState<string>('');
  const [formTerm, setFormTerm] = useState<string>('');
  const [formSectionId, setFormSectionId] = useState<string>('');
  const [formAmounts, setFormAmounts] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Due Date Management fields
  const [formDueDateOffset, setFormDueDateOffset] = useState<number>(14);
  const [formGracePeriod, setFormGracePeriod] = useState<number>(3);
  const [formReminderSchedule, setFormReminderSchedule] = useState<string>('3 Days Before, On Due Date, 5 Days Overdue');
  const [formBlockReportCard, setFormBlockReportCard] = useState<boolean>(false);
  const [formBlockParentPortal, setFormBlockParentPortal] = useState<boolean>(false);
  const [formBlockBooks, setFormBlockBooks] = useState<boolean>(false);
  const [formBlockPromotion, setFormBlockPromotion] = useState<boolean>(false);
  const [formBlockRegistration, setFormBlockRegistration] = useState<boolean>(false);

  // --- CLASS OVERRIDE FORM MODAL STATES ---
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);
  const [editingOverride, setEditingOverride] = useState<ClassFeeOverride | null>(null);
  const [overrideTemplateId, setOverrideTemplateId] = useState<string>('');
  const [overrideClassId, setOverrideClassId] = useState<string>('');
  // key is feeHeadId, values are overrides
  const [overrideAmounts, setOverrideAmounts] = useState<Record<string, string>>({});
  const [overrideRemovedHeads, setOverrideRemovedHeads] = useState<Record<string, boolean>>({});
  
  // Custom added heads in the override (not in template)
  const [customOverrideHeads, setCustomOverrideHeads] = useState<{ feeHeadId: string; amount: number }[]>([]);
  const [selectedCustomHeadToAdd, setSelectedCustomHeadToAdd] = useState<string>('');
  const [customHeadAmountInput, setCustomHeadAmountInput] = useState<string>('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Fetch all databases
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tempRes, headsRes, secRes, sessRes, termsRes, classRes, overrideRes] = await Promise.all([
        fetch('/api/fee_templates'),
        fetch('/api/fee_heads'),
        fetch('/api/sections'),
        fetch('/api/academic-sessions'),
        fetch('/api/terms'),
        fetch('/api/classes'),
        fetch('/api/class_fee_overrides')
      ]);

      if (!tempRes.ok || !headsRes.ok || !secRes.ok || !sessRes.ok || !termsRes.ok || !classRes.ok || !overrideRes.ok) {
        throw new Error('Failed to retrieve financial and academic ledger parameters.');
      }

      const templatesData = await tempRes.json();
      const headsData = await headsRes.json();
      const sectionsData = await secRes.json();
      const sessionsData = await sessRes.json();
      const termsData = await termsRes.json();
      const classesData = await classRes.json();
      const overridesData = await overrideRes.json();

      setTemplates(templatesData);
      setFeeHeads(headsData);
      setSections(sectionsData);
      setAcademicSessions(sessionsData);
      setTerms(termsData);
      setClasses(classesData);
      setClassOverrides(overridesData);

      // Defaults for forms
      const activeSess = sessionsData.find((s: any) => s.status === 'active') || sessionsData[0];
      if (activeSess) {
        setFormSession(activeSess.id);
        const relatedTerms = termsData.filter((t: any) => t.sessionId === activeSess.id);
        if (relatedTerms.length > 0) {
          setFormTerm(relatedTerms[0].id);
        }
      }
      if (sectionsData.length > 0) {
        setFormSectionId(sectionsData[0].id);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // -------------------------------------------------------------
  // DICTIONARY MAPS FOR PERFORMANCE & COHESION
  // -------------------------------------------------------------
  const sessionsMap = useMemo(() => {
    const map: Record<string, AcademicSession> = {};
    academicSessions.forEach(s => { map[s.id] = s; });
    return map;
  }, [academicSessions]);

  const termsMap = useMemo(() => {
    const map: Record<string, Term> = {};
    terms.forEach(t => { map[t.id] = t; });
    return map;
  }, [terms]);

  const sectionsMap = useMemo(() => {
    const map: Record<string, Section> = {};
    sections.forEach(s => { map[s.id] = s; });
    return map;
  }, [sections]);

  const classesMap = useMemo(() => {
    const map: Record<string, SchoolClass> = {};
    classes.forEach(c => { map[c.id] = c; });
    return map;
  }, [classes]);

  const feeHeadsMap = useMemo(() => {
    const map: Record<string, FeeHead> = {};
    feeHeads.forEach(f => { map[f.id] = f; });
    return map;
  }, [feeHeads]);

  const templatesMap = useMemo(() => {
    const map: Record<string, FeeTemplate> = {};
    templates.forEach(t => { map[t.id] = t; });
    return map;
  }, [templates]);

  // -------------------------------------------------------------
  // BASE TEMPLATE COMPARISONS LOGIC
  // -------------------------------------------------------------
  const sortedSessions = useMemo(() => {
    return [...academicSessions].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [academicSessions]);

  const sortedTerms = useMemo(() => {
    return [...terms].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [terms]);

  const getTemplateComparisons = (template: FeeTemplate) => {
    const currentTotal = template.totalFee;
    const currentSectionObj = sectionsMap[template.sectionId];
    if (!currentSectionObj) return { prevTermDiff: null, prevSessDiff: null };

    // 1. Previous Term Comparison (Within same Academic Session)
    const sessionTerms = sortedTerms.filter(t => t.sessionId === template.session);
    const currentTermIdx = sessionTerms.findIndex(t => t.id === template.term);
    let prevTermDiff: number | null = null;

    if (currentTermIdx > 0) {
      const prevTermObj = sessionTerms[currentTermIdx - 1];
      const matchedPrevTemplate = templates.find(t => 
        t.branch === template.branch &&
        t.session === template.session &&
        t.term === prevTermObj.id &&
        sectionsMap[t.sectionId]?.name === currentSectionObj.name
      );
      if (matchedPrevTemplate) {
        prevTermDiff = currentTotal - matchedPrevTemplate.totalFee;
      }
    }

    // 2. Previous Academic Session Comparison (Same Term Name, e.g. "Term 1")
    const currentSessionIdx = sortedSessions.findIndex(s => s.id === template.session);
    let prevSessDiff: number | null = null;

    if (currentSessionIdx > 0) {
      const prevSessionObj = sortedSessions[currentSessionIdx - 1];
      const currentTermObj = termsMap[template.term];
      
      if (currentTermObj) {
        const matchedPrevSessionTerm = terms.find(t => 
          t.sessionId === prevSessionObj.id && 
          t.name.toLowerCase() === currentTermObj.name.toLowerCase()
        );

        if (matchedPrevSessionTerm) {
          const matchedPrevSessionSection = sections.find(s => 
            s.session === prevSessionObj.id &&
            s.branch === template.branch &&
            s.name.toLowerCase() === currentSectionObj.name.toLowerCase()
          );

          if (matchedPrevSessionSection) {
            const matchedPrevSessTemplate = templates.find(t => 
              t.branch === template.branch &&
              t.session === prevSessionObj.id &&
              t.term === matchedPrevSessionTerm.id &&
              t.sectionId === matchedPrevSessionSection.id
            );
            if (matchedPrevSessTemplate) {
              prevSessDiff = currentTotal - matchedPrevSessTemplate.totalFee;
            }
          }
        }
      }
    }

    return { prevTermDiff, prevSessDiff };
  };

  // -------------------------------------------------------------
  // DYNAMIC FILTERING & COMBINATIONS
  // -------------------------------------------------------------
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesBranch = selectedBranch === 'All' || t.branch === selectedBranch;
      const matchesSession = selectedSession === 'All' || t.session === selectedSession;
      const matchesSection = selectedSection === 'All' || t.sectionId === selectedSection;
      const matchesTerm = selectedTerm === 'All' || t.term === selectedTerm;

      const secObj = sectionsMap[t.sectionId];
      const termObj = termsMap[t.term];
      const matchesSearch = 
        (secObj?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (termObj?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.branch.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesBranch && matchesSession && matchesSection && matchesTerm && matchesSearch;
    });
  }, [templates, selectedBranch, selectedSession, selectedSection, selectedTerm, searchQuery, sectionsMap, termsMap]);

  const filteredOverrides = useMemo(() => {
    return classOverrides.filter(ov => {
      const parentTemplate = templatesMap[ov.templateId];
      if (!parentTemplate) return false;

      const matchesBranch = selectedBranch === 'All' || parentTemplate.branch === selectedBranch;
      const matchesSession = selectedSession === 'All' || parentTemplate.session === selectedSession;
      const matchesSection = selectedSection === 'All' || parentTemplate.sectionId === selectedSection;
      const matchesTerm = selectedTerm === 'All' || parentTemplate.term === selectedTerm;

      const classObj = classesMap[ov.classId];
      const matchesSearch = 
        (classObj?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        parentTemplate.branch.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesBranch && matchesSession && matchesSection && matchesTerm && matchesSearch;
    });
  }, [classOverrides, selectedBranch, selectedSession, selectedSection, selectedTerm, searchQuery, templatesMap, classesMap]);

  // -------------------------------------------------------------
  // FORM SELECTION CORRESPONDENCE
  // -------------------------------------------------------------
  const filteredTermsForForm = useMemo(() => {
    if (!formSession) return [];
    return terms.filter(t => t.sessionId === formSession);
  }, [terms, formSession]);

  const filteredSectionsForForm = useMemo(() => {
    if (!formBranch) return sections;
    return sections.filter(s => s.branch === formBranch);
  }, [sections, formBranch]);

  // Automatically adjust selected term when session changes
  useEffect(() => {
    if (filteredTermsForForm.length > 0) {
      setFormTerm(filteredTermsForForm[0].id);
    } else {
      setFormTerm('');
    }
  }, [formSession, filteredTermsForForm]);

  // Derive which fee heads fit based on form inputs (matching branch and section)
  const relevantFeeHeadsForForm = useMemo(() => {
    if (!formSectionId) return [];
    const selectedSecObj = sections.find(s => s.id === formSectionId);
    if (!selectedSecObj) return [];

    const targetSectionName = selectedSecObj.name.toLowerCase();

    return feeHeads.filter(head => {
      if (!head.isActive) return false;
      const branchMatches = head.branchId === 'All' || head.branchId === formBranch;
      
      let sectionMatches = false;
      if (head.section === 'All') {
        sectionMatches = true;
      } else {
        const headSecLower = head.section.toLowerCase();
        if (headSecLower === 'secondary' && targetSectionName === 'junior secondary') {
          sectionMatches = true;
        } else {
          sectionMatches = headSecLower === targetSectionName;
        }
      }
      return branchMatches && sectionMatches;
    });
  }, [feeHeads, formSectionId, formBranch, sections]);

  // Live total sum inside base template builder
  const computedFormTotal = useMemo(() => {
    let total = 0;
    relevantFeeHeadsForForm.forEach(head => {
      const val = parseFloat(formAmounts[head.id]);
      if (!isNaN(val) && val > 0) {
        total += val;
      }
    });
    return total;
  }, [relevantFeeHeadsForForm, formAmounts]);

  // Reset or map amounts on open template modal
  useEffect(() => {
    if (isTemplateModalOpen && !editingTemplate) {
      const initial: Record<string, string> = {};
      relevantFeeHeadsForForm.forEach(head => {
        initial[head.id] = '';
      });
      setFormAmounts(initial);
    }
  }, [relevantFeeHeadsForForm, isTemplateModalOpen, editingTemplate]);


  // -------------------------------------------------------------
  // DYNAMIC OVERRIDE MATHS & CORRESPONDENCE
  // -------------------------------------------------------------
  // Filter classes belonging to the selected override base template section
  const availableClassesForOverride = useMemo(() => {
    if (!overrideTemplateId) return [];
    const template = templatesMap[overrideTemplateId];
    if (!template) return [];

    // Filter classes matching sectionId and branch of the template
    return classes.filter(cls => 
      cls.sectionId === template.sectionId && 
      cls.branch === template.branch
    );
  }, [overrideTemplateId, templatesMap, classes]);

  // Set default class when override base template changes
  useEffect(() => {
    if (availableClassesForOverride.length > 0 && !editingOverride) {
      setOverrideClassId(availableClassesForOverride[0].id);
    } else if (!editingOverride) {
      setOverrideClassId('');
    }
  }, [overrideTemplateId, availableClassesForOverride, editingOverride]);

  // Get active template items
  const activeTemplateItems = useMemo(() => {
    if (!overrideTemplateId) return [];
    const template = templatesMap[overrideTemplateId];
    return template ? template.items : [];
  }, [overrideTemplateId, templatesMap]);

  // Live calculation of overridden class total fee
  const calculatedOverrideTotal = useMemo(() => {
    let total = 0;

    // 1. Calculate from base template items after applying edits or removals
    activeTemplateItems.forEach(item => {
      const isRemoved = overrideRemovedHeads[item.feeHeadId];
      if (!isRemoved) {
        const customAmtStr = overrideAmounts[item.feeHeadId];
        const amt = customAmtStr !== undefined && customAmtStr !== '' 
          ? parseFloat(customAmtStr) 
          : item.amount;
        
        if (!isNaN(amt) && amt > 0) {
          total += amt;
        }
      }
    });

    // 2. Add extra custom heads added
    customOverrideHeads.forEach(item => {
      total += item.amount;
    });

    return total;
  }, [activeTemplateItems, overrideAmounts, overrideRemovedHeads, customOverrideHeads]);

  // Available fee heads to add as extra (excluding those already in base template or custom heads)
  const feeHeadsAvailableForCustomAdd = useMemo(() => {
    if (!overrideTemplateId) return [];
    const template = templatesMap[overrideTemplateId];
    if (!template) return [];

    const baseHeadIds = new Set(template.items.map(i => i.feeHeadId));
    const customHeadIds = new Set(customOverrideHeads.map(i => i.feeHeadId));

    return feeHeads.filter(head => 
      head.isActive && 
      !baseHeadIds.has(head.id) && 
      !customHeadIds.has(head.id)
    );
  }, [overrideTemplateId, templatesMap, customOverrideHeads, feeHeads]);

  // Initializing selected extra custom head to add
  useEffect(() => {
    if (feeHeadsAvailableForCustomAdd.length > 0) {
      setSelectedCustomHeadToAdd(feeHeadsAvailableForCustomAdd[0].id);
    } else {
      setSelectedCustomHeadToAdd('');
    }
  }, [feeHeadsAvailableForCustomAdd]);

  // -------------------------------------------------------------
  // MODAL HANDLERS
  // -------------------------------------------------------------
  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setFormBranch('GN');
    const activeSess = academicSessions.find(s => s.status === 'active') || academicSessions[0];
    if (activeSess) {
      setFormSession(activeSess.id);
      const relatedTerms = terms.filter(t => t.sessionId === activeSess.id);
      if (relatedTerms.length > 0) {
        setFormTerm(relatedTerms[0].id);
      }
    }
    const branchSecs = sections.filter(s => s.branch === 'GN');
    if (branchSecs.length > 0) {
      setFormSectionId(branchSecs[0].id);
    } else if (sections.length > 0) {
      setFormSectionId(sections[0].id);
    }
    setFormAmounts({});
    setFormError(null);
    setFormDueDateOffset(14);
    setFormGracePeriod(3);
    setFormReminderSchedule('3 Days Before, On Due Date, 5 Days Overdue');
    setFormBlockReportCard(false);
    setFormBlockParentPortal(false);
    setFormBlockBooks(false);
    setFormBlockPromotion(false);
    setFormBlockRegistration(false);
    setIsTemplateModalOpen(true);
  };

  const openModifyTemplate = (temp: FeeTemplate) => {
    setEditingTemplate(temp);
    setFormBranch(temp.branch);
    setFormSession(temp.session);
    setFormTerm(temp.term);
    setFormSectionId(temp.sectionId);

    const amounts: Record<string, string> = {};
    temp.items.forEach(item => {
      amounts[item.feeHeadId] = item.amount.toString();
    });
    setFormAmounts(amounts);
    setFormError(null);
    setFormDueDateOffset(temp.dueDateOffset !== undefined ? temp.dueDateOffset : 14);
    setFormGracePeriod(temp.gracePeriod !== undefined ? temp.gracePeriod : 3);
    setFormReminderSchedule(temp.reminderSchedule || '3 Days Before, On Due Date, 5 Days Overdue');
    setFormBlockReportCard(temp.restrictions?.blockReportCard || false);
    setFormBlockParentPortal(temp.restrictions?.blockParentPortal || false);
    setFormBlockBooks(temp.restrictions?.blockBooks || false);
    setFormBlockPromotion(temp.restrictions?.blockPromotion || false);
    setFormBlockRegistration(temp.restrictions?.blockRegistration || false);
    setIsTemplateModalOpen(true);
  };

  const openCreateOverride = () => {
    setEditingOverride(null);
    setOverrideError(null);
    setOverrideAmounts({});
    setOverrideRemovedHeads({});
    setCustomOverrideHeads([]);
    setCustomHeadAmountInput('');

    if (templates.length > 0) {
      setOverrideTemplateId(templates[0].id);
    } else {
      setOverrideTemplateId('');
    }
    setIsOverrideModalOpen(true);
  };

  const openModifyOverride = (ov: ClassFeeOverride) => {
    setEditingOverride(ov);
    setOverrideError(null);
    setOverrideTemplateId(ov.templateId);
    setOverrideClassId(ov.classId);

    const baseTemplate = templatesMap[ov.templateId];
    const baseHeadIds = new Set(baseTemplate ? baseTemplate.items.map(i => i.feeHeadId) : []);

    const amounts: Record<string, string> = {};
    const removed: Record<string, boolean> = {};
    const customs: { feeHeadId: string; amount: number }[] = [];

    ov.items.forEach(item => {
      if (baseHeadIds.has(item.feeHeadId)) {
        if (item.isRemoved) {
          removed[item.feeHeadId] = true;
        } else {
          amounts[item.feeHeadId] = item.amount.toString();
        }
      } else {
        // Extra added head
        customs.push({
          feeHeadId: item.feeHeadId,
          amount: item.amount
        });
      }
    });

    setOverrideAmounts(amounts);
    setOverrideRemovedHeads(removed);
    setCustomOverrideHeads(customs);
    setCustomHeadAmountInput('');
    setIsOverrideModalOpen(true);
  };

  // -------------------------------------------------------------
  // POST / PUT SUBMISSIONS
  // -------------------------------------------------------------
  const submitTemplateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formBranch || !formSession || !formTerm || !formSectionId) {
      setFormError('Please select all required parameters.');
      return;
    }

    const items: FeeTemplateItem[] = [];
    relevantFeeHeadsForForm.forEach(head => {
      const val = parseFloat(formAmounts[head.id]);
      if (!isNaN(val) && val > 0) {
        items.push({
          feeHeadId: head.id,
          amount: val
        });
      }
    });

    if (items.length === 0) {
      setFormError('Please input a valid positive amount for at least one Fee Head.');
      return;
    }

    // Check duplicate combination
    const duplicate = templates.some(t => 
      (!editingTemplate || t.id !== editingTemplate.id) &&
      t.branch === formBranch &&
      t.session === formSession &&
      t.term === formTerm &&
      t.sectionId === formSectionId
    );

    if (duplicate) {
      setFormError('A fee template already exists with this identical Branch, Session, Term, and Section.');
      return;
    }

    try {
      const payload = {
        branch: formBranch,
        session: formSession,
        term: formTerm,
        sectionId: formSectionId,
        totalFee: computedFormTotal,
        items,
        dueDateOffset: formDueDateOffset,
        gracePeriod: formGracePeriod,
        reminderSchedule: formReminderSchedule,
        restrictions: {
          blockReportCard: formBlockReportCard,
          blockParentPortal: formBlockParentPortal,
          blockBooks: formBlockBooks,
          blockPromotion: formBlockPromotion,
          blockRegistration: formBlockRegistration
        }
      };

      const url = editingTemplate ? `/api/fee_templates/${editingTemplate.id}` : '/api/fee_templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to preserve fee template.');
      }

      await loadAllData();
      setIsTemplateModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving template.');
    }
  };

  const submitOverrideForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideError(null);

    if (!overrideTemplateId || !overrideClassId) {
      setOverrideError('Base fee template and class selection are mandatory.');
      return;
    }

    // Build the final overridden items payload list
    const items: ClassFeeOverrideItem[] = [];
    const baseTemplate = templatesMap[overrideTemplateId];
    if (!baseTemplate) return;

    // 1. Process base items
    baseTemplate.items.forEach(baseItem => {
      const isRemoved = overrideRemovedHeads[baseItem.feeHeadId];
      if (isRemoved) {
        items.push({
          feeHeadId: baseItem.feeHeadId,
          amount: 0,
          isRemoved: true
        });
      } else {
        const customAmtStr = overrideAmounts[baseItem.feeHeadId];
        if (customAmtStr !== undefined && customAmtStr !== '') {
          const amt = parseFloat(customAmtStr);
          if (!isNaN(amt) && amt >= 0) {
            // Only save if it differs from base amount
            if (amt !== baseItem.amount) {
              items.push({
                feeHeadId: baseItem.feeHeadId,
                amount: amt,
                isRemoved: false
              });
            }
          }
        }
      }
    });

    // 2. Process added items
    customOverrideHeads.forEach(customItem => {
      items.push({
        feeHeadId: customItem.feeHeadId,
        amount: customItem.amount,
        isRemoved: false
      });
    });

    if (items.length === 0) {
      setOverrideError('You must make at least one modification (edit, add, or remove a fee head) to establish an override.');
      return;
    }

    // Check duplicate override
    const isDuplicate = classOverrides.some(ov => 
      (!editingOverride || ov.id !== editingOverride.id) &&
      ov.templateId === overrideTemplateId &&
      ov.classId === overrideClassId
    );

    if (isDuplicate) {
      setOverrideError('A class-specific override has already been recorded for this class under this template.');
      return;
    }

    try {
      const payload = {
        templateId: overrideTemplateId,
        classId: overrideClassId,
        items
      };

      const url = editingOverride ? `/api/class_fee_overrides/${editingOverride.id}` : '/api/class_fee_overrides';
      const method = editingOverride ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save class-specific fee override.');
      }

      await loadAllData();
      setIsOverrideModalOpen(false);
    } catch (err: any) {
      setOverrideError(err.message || 'Error occurred while saving class-specific override.');
    }
  };

  // -------------------------------------------------------------
  // DELETION HANDLERS
  // -------------------------------------------------------------
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Fee Template permanently? This will also affect any associated class overrides.')) {
      return;
    }
    try {
      const res = await fetch(`/api/fee_templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete template.');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error deleting template.');
    }
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Class-Specific Fee Override permanently? The class will revert to the base template billing.')) {
      return;
    }
    try {
      const res = await fetch(`/api/class_fee_overrides/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete override.');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error deleting override.');
    }
  };

  // -------------------------------------------------------------
  // CUSTOM ADDED OVERRIDE ITEM HANDLERS (IN-MODAL)
  // -------------------------------------------------------------
  const handleAddCustomHeadToOverride = () => {
    if (!selectedCustomHeadToAdd) return;
    const amt = parseFloat(customHeadAmountInput);
    if (isNaN(amt) || amt <= 0) {
      alert('Please provide a valid positive amount.');
      return;
    }

    setCustomOverrideHeads([
      ...customOverrideHeads,
      { feeHeadId: selectedCustomHeadToAdd, amount: amt }
    ]);
    setCustomHeadAmountInput('');
  };

  const handleRemoveCustomHeadFromOverride = (headId: string) => {
    setCustomOverrideHeads(customOverrideHeads.filter(h => h.feeHeadId !== headId));
  };


  // -------------------------------------------------------------
  // RENDER HELPERS
  // -------------------------------------------------------------
  const formatCurrency = (amt: number) => {
    return `₦${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderBaseChangeBadge = (diff: number | null, label: string) => {
    if (diff === null) {
      return (
        <span className="text-[10px] text-slate-400 font-semibold italic bg-slate-100/60 px-2 py-0.5 rounded-md">
          {label}: N/A
        </span>
      );
    }
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md" title={label}>
          <Lucide.Minus className="w-3 h-3" />
          {label}: Stable
        </span>
      );
    }
    const isPositive = diff > 0;
    return (
      <span 
        className={`inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-md ${
          isPositive ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        }`}
      >
        {isPositive ? <Lucide.TrendingUp className="w-3 h-3 text-amber-600 shrink-0" /> : <Lucide.TrendingDown className="w-3 h-3 text-emerald-600 shrink-0" />}
        {label}: {isPositive ? '+' : '-'}{formatCurrency(Math.abs(diff))}
      </span>
    );
  };

  // Helper to compute class-specific final breakdown items
  const getClassBreakdownItems = (override: ClassFeeOverride) => {
    const parentTemplate = templatesMap[override.templateId];
    if (!parentTemplate) return [];

    const itemsMap: Record<string, { feeHeadId: string; amount: number; isRemoved: boolean; status: 'base' | 'modified' | 'added' }> = {};

    // 1. Seed base items
    parentTemplate.items.forEach(item => {
      itemsMap[item.feeHeadId] = {
        feeHeadId: item.feeHeadId,
        amount: item.amount,
        isRemoved: false,
        status: 'base'
      };
    });

    // 2. Apply override modifications
    override.items.forEach(overrideItem => {
      if (itemsMap[overrideItem.feeHeadId]) {
        if (overrideItem.isRemoved) {
          itemsMap[overrideItem.feeHeadId].isRemoved = true;
        } else {
          itemsMap[overrideItem.feeHeadId].amount = overrideItem.amount;
          itemsMap[overrideItem.feeHeadId].status = 'modified';
        }
      } else if (!overrideItem.isRemoved) {
        // Added item
        itemsMap[overrideItem.feeHeadId] = {
          feeHeadId: overrideItem.feeHeadId,
          amount: overrideItem.amount,
          isRemoved: false,
          status: 'added'
        };
      }
    });

    return Object.values(itemsMap);
  };

  if (loading) {
    return (
      <div id="template-loader" className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-xs font-semibold">Configuring Fee Template Builder dashboard...</p>
      </div>
    );
  }

  return (
    <div id="fee-template-workspace" className="space-y-6">
      
      {/* Dynamic Sub-header Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('templates'); setSearchQuery(''); }}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'templates' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lucide.Receipt className="w-4 h-4" />
          Base Term Fee Templates
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            {templates.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('overrides'); setSearchQuery(''); }}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'overrides' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lucide.Sliders className="w-4 h-4" />
          Class-Specific Fee Overrides
          <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
            {classOverrides.length}
          </span>
        </button>
      </div>

      {/* Stats Summary cards customized to current active tab */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {activeTab === 'templates' ? (
          <>
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Lucide.Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created Templates</span>
                <span className="text-lg font-black text-slate-800">{templates.length} Active Templates</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Lucide.Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Template Fee</span>
                <span className="text-lg font-black text-slate-800">
                  {templates.length > 0 
                    ? formatCurrency(templates.reduce((acc, t) => acc + t.totalFee, 0) / templates.length)
                    : '₦0.00'
                  }
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Lucide.Settings2 className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configured Fee Heads</span>
                <span className="text-lg font-black text-slate-800">
                  {feeHeads.filter(h => h.isActive).length} Categories
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <Lucide.Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Class Overrides</span>
                <span className="text-lg font-black text-amber-800">{classOverrides.length} Active Overrides</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                <Lucide.Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Affected Students Classes</span>
                <span className="text-lg font-black text-indigo-800">
                  {Array.from(new Set(classOverrides.map(o => o.classId))).length} Unique Classes
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <Lucide.PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Levies & Specialized Heads</span>
                <span className="text-lg font-black text-emerald-800">
                  {classOverrides.reduce((acc, o) => acc + o.items.length, 0)} Distinct Adjustments
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Filter & Control Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
        
        {/* Dynamic header and control based on active sub-view */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {activeTab === 'templates' ? (
            <div>
              <h3 className="text-base font-black text-slate-900">Termly Fee Templates</h3>
              <p className="text-[11px] text-slate-400 font-medium">Standardise base billing totals for each section per academic term.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-black text-slate-900">Class Fee Overrides Dashboard</h3>
              <p className="text-[11px] text-slate-400 font-medium">Record specific fee head deductions, increments, or extra levies for individual classes.</p>
            </div>
          )}

          {activeTab === 'templates' ? (
            <button
              onClick={openCreateTemplate}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Lucide.FilePlus2 className="w-4 h-4" />
              Build Fee Template
            </button>
          ) : (
            <button
              onClick={openCreateOverride}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Lucide.Sparkle className="w-4 h-4" />
              Record Class Override
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
          <div className="relative md:col-span-1">
            <Lucide.Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'templates' ? "Search templates..." : "Search overrides / class..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] font-semibold text-slate-700 placeholder-slate-400 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold text-slate-600 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="All">All Branches</option>
              <option value="GN">Gwarinpa Campus (GN)</option>
              <option value="RS">Road Safety Campus (RS)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold text-slate-600 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="All">All Sessions</option>
              {academicSessions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold text-slate-600 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="All">All Sections</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold text-slate-600 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="All">All Terms</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({sessionsMap[t.sessionId]?.name.split(' ')[0] || ''})</option>
              ))}
            </select>
          </div>
        </div>

        {/* LISTINGS CONTAINER */}
        {activeTab === 'templates' ? (
          /* TEMPLATE LIST VIEW */
          filteredTemplates.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Lucide.ReceiptText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-xs font-bold">No termly fee templates located.</p>
              <p className="text-[11px] text-slate-400 mt-1">Refine your filtration parameters or click "Build Fee Template" above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map(temp => {
                const secObj = sectionsMap[temp.sectionId];
                const sessObj = sessionsMap[temp.session];
                const termObj = termsMap[temp.term];
                const { prevTermDiff, prevSessDiff } = getTemplateComparisons(temp);

                return (
                  <div 
                    key={temp.id} 
                    className="border border-slate-200 rounded-2xl bg-slate-50/25 hover:bg-white hover:shadow-xs transition-all p-5 space-y-4"
                  >
                    {/* Top Row / Meta */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                            {temp.branch === 'RS' ? 'Road Safety' : 'Gwarinpa (GN)'}
                          </span>
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                            {sessObj?.name || 'Unknown Session'}
                          </span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">
                            {termObj?.name || 'Unknown Term'}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 pt-0.5">
                          {secObj?.name || 'Custom'} Section Fee Template
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Combined Fee</span>
                          <span className="text-base font-black text-slate-900">{formatCurrency(temp.totalFee)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openModifyTemplate(temp)}
                            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl transition-colors cursor-pointer"
                            title="Modify template settings"
                          >
                            <Lucide.Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(temp.id)}
                            className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-500 rounded-xl transition-colors cursor-pointer"
                            title="Delete template"
                          >
                            <Lucide.Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comparisons Row */}
                    <div className="flex flex-wrap gap-2 py-1">
                      {renderBaseChangeBadge(prevTermDiff, 'Vs Previous Term')}
                      {renderBaseChangeBadge(prevSessDiff, 'Vs Previous Academic Year')}
                    </div>

                    {/* Due Date & Restriction Rules policy row */}
                    <div className="bg-slate-100/50 rounded-xl p-3 border border-slate-200/40 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-700">
                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Due Policy</span>
                          <span className="font-bold flex items-center gap-1 text-slate-700">
                            <Lucide.Clock className="w-3.5 h-3.5 text-indigo-500" />
                            {temp.dueDateOffset !== undefined ? temp.dueDateOffset : 14} Days offset
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Grace Period</span>
                          <span className="font-bold text-slate-700">
                            +{temp.gracePeriod !== undefined ? temp.gracePeriod : 3} Days
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Alerts Schedule</span>
                          <span className="font-bold text-slate-600">
                            {temp.reminderSchedule || '3 Days Before, On Due Date, 5 Days Overdue'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4 space-y-1">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Active Overdue Penalties</span>
                        <div className="flex flex-wrap gap-1">
                          {temp.restrictions?.blockReportCard && (
                            <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded">Block Report Card</span>
                          )}
                          {temp.restrictions?.blockParentPortal && (
                            <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded">Restrict Parent Portal</span>
                          )}
                          {temp.restrictions?.blockBooks && (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-100 px-1.5 py-0.5 rounded">Block Books</span>
                          )}
                          {temp.restrictions?.blockPromotion && (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-100 px-1.5 py-0.5 rounded">Block Promotion</span>
                          )}
                          {temp.restrictions?.blockRegistration && (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-100 px-1.5 py-0.5 rounded">Block Registration</span>
                          )}
                          {!temp.restrictions?.blockReportCard && 
                           !temp.restrictions?.blockParentPortal && 
                           !temp.restrictions?.blockBooks && 
                           !temp.restrictions?.blockPromotion && 
                           !temp.restrictions?.blockRegistration && (
                            <span className="text-[9px] font-medium text-slate-400 italic">No restrictions configured</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fee Itemized Breakdown */}
                    <div className="bg-white/60 rounded-xl p-3 border border-slate-200/50">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Itemised Breakdown</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {temp.items.map((item, idx) => {
                          const head = feeHeadsMap[item.feeHeadId];
                          return (
                            <div key={idx} className="bg-slate-50/55 p-2 rounded-lg border border-slate-200/30">
                              <span className="block text-[10px] font-bold text-slate-700 truncate" title={head?.name || 'Custom Head'}>
                                {head?.name || 'Unmapped Fee Head'}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono mb-1">{head?.code || 'F-CODE'}</span>
                              <span className="text-xs font-black text-slate-900">{formatCurrency(item.amount)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* CLASS OVERRIDES VIEW (THE OVERRIDE SCREEN) */
          filteredOverrides.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Lucide.Scale className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-xs font-bold">No class-specific overrides recorded.</p>
              <p className="text-[11px] text-slate-400 mt-1">Click "Record Class Override" to define class-specific levy modifications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOverrides.map(ov => {
                const parentTemplate = templatesMap[ov.templateId];
                if (!parentTemplate) return null;

                const classObj = classesMap[ov.classId];
                const secObj = sectionsMap[parentTemplate.sectionId];
                const sessObj = sessionsMap[parentTemplate.session];
                const termObj = termsMap[parentTemplate.term];

                const baseTotal = parentTemplate.totalFee;
                
                // Get the final calculated sum and full item breakdown
                const fullBreakdown = getClassBreakdownItems(ov);
                const finalTotal = fullBreakdown.reduce((acc, i) => acc + (i.isRemoved ? 0 : i.amount), 0);
                const delta = finalTotal - baseTotal;

                return (
                  <div 
                    key={ov.id}
                    className="border border-amber-200/80 rounded-2xl bg-amber-50/5 hover:bg-white hover:shadow-xs transition-all p-5 space-y-4"
                  >
                    {/* Header bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-amber-100/50">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-black uppercase tracking-wider flex items-center gap-1">
                            <Lucide.Sparkles className="w-2.5 h-2.5" />
                            Class Override
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                            {sessObj?.name || 'Unknown Session'}
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                            {termObj?.name || 'Unknown Term'}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 pt-0.5 flex items-center gap-1.5">
                          <span className="text-indigo-600">{classObj?.name || 'Custom Class'}</span>
                          <span className="text-slate-400 text-xs font-normal">({secObj?.name || 'Primary'} Section)</span>
                        </h4>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overridden Total</span>
                          <span className="text-sm text-slate-500 line-through font-bold inline-block mr-1.5">{formatCurrency(baseTotal)}</span>
                          <span className="text-base font-black text-amber-700">{formatCurrency(finalTotal)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openModifyOverride(ov)}
                            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                            title="Modify override options"
                          >
                            <Lucide.Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOverride(ov.id)}
                            className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-500 rounded-xl transition-colors cursor-pointer"
                            title="Delete override"
                          >
                            <Lucide.Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Change delta vs Base template */}
                    <div className="flex items-center gap-2">
                      {delta === 0 ? (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-bold">
                          Equivalent to base template total
                        </span>
                      ) : delta > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-black px-2.5 py-0.5 rounded-md">
                          <Lucide.ArrowUpCircle className="w-3.5 h-3.5 text-amber-600" />
                          Levied override increment: +{formatCurrency(delta)} (vs base section fee)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-black px-2.5 py-0.5 rounded-md">
                          <Lucide.ArrowDownCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Reduced override decrement: -{formatCurrency(Math.abs(delta))} (vs base section fee)
                        </span>
                      )}
                    </div>

                    {/* Modification Log Highlights */}
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/50 space-y-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adjustment Ledger Details</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Added Heads */}
                        <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/40">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Added Items
                          </span>
                          <div className="space-y-1">
                            {fullBreakdown.filter(i => i.status === 'added').length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic block pt-1">None added</span>
                            ) : (
                              fullBreakdown.filter(i => i.status === 'added').map(item => {
                                const head = feeHeadsMap[item.feeHeadId];
                                return (
                                  <div key={item.feeHeadId} className="flex justify-between items-center text-[10px] text-slate-700">
                                    <span className="truncate pr-1 font-semibold">{head?.name || 'Special Levy'}</span>
                                    <span className="font-bold text-emerald-600">{formatCurrency(item.amount)}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* 2. Modified Base Items */}
                        <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/40">
                          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Modified Base Items
                          </span>
                          <div className="space-y-1">
                            {fullBreakdown.filter(i => i.status === 'modified').length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic block pt-1">No modified values</span>
                            ) : (
                              fullBreakdown.filter(i => i.status === 'modified').map(item => {
                                const head = feeHeadsMap[item.feeHeadId];
                                const baseItem = parentTemplate.items.find(bi => bi.feeHeadId === item.feeHeadId);
                                return (
                                  <div key={item.feeHeadId} className="space-y-0.5 text-[10px] text-slate-700">
                                    <div className="flex justify-between items-center">
                                      <span className="truncate pr-1 font-semibold">{head?.name || 'Modified item'}</span>
                                      <span className="font-bold text-amber-600">{formatCurrency(item.amount)}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 block font-medium">Was {formatCurrency(baseItem?.amount || 0)}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* 3. Removed Items */}
                        <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/40">
                          <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Excluded Items
                          </span>
                          <div className="space-y-1">
                            {fullBreakdown.filter(i => i.isRemoved).length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic block pt-1">No base items excluded</span>
                            ) : (
                              fullBreakdown.filter(i => i.isRemoved).map(item => {
                                const head = feeHeadsMap[item.feeHeadId];
                                return (
                                  <div key={item.feeHeadId} className="flex justify-between items-center text-[10px] text-slate-500 line-through">
                                    <span className="truncate pr-1 font-medium">{head?.name || 'Excluded Item'}</span>
                                    <span className="text-[9px] bg-rose-50 text-rose-600 font-bold px-1.5 rounded-md">Omitted</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Class's final detailed ledger list */}
                    <div className="border border-slate-200/40 p-3.5 rounded-xl bg-white/70">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resulting Class Ledger Billing Breakdown</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {fullBreakdown.filter(i => !i.isRemoved).map(item => {
                          const head = feeHeadsMap[item.feeHeadId];
                          return (
                            <div key={item.feeHeadId} className="bg-slate-50/50 p-2 rounded-lg border border-slate-200/20">
                              <span className="block text-[10px] font-bold text-slate-700 truncate" title={head?.name || 'Levy'}>
                                {head?.name || 'Levy Item'}
                              </span>
                              <span className="text-xs font-black text-slate-900 mt-1 block">{formatCurrency(item.amount)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ========================================================= */}
      {/* BASE FEE TEMPLATE MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 my-8"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Lucide.Coins className="w-4 h-4 text-indigo-600" />
                  {editingTemplate ? 'Modify Base Fee Template' : 'Establish Base Fee Template'}
                </h4>
                <button 
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submitTemplateForm} className="space-y-4">
                {formError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-bold flex items-center gap-2">
                    <Lucide.AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Campus Branch *</label>
                    <select
                      required
                      value={formBranch}
                      onChange={(e) => setFormBranch(e.target.value)}
                      disabled={!!editingTemplate}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all disabled:opacity-60"
                    >
                      <option value="GN">Gwarinpa Campus (GN)</option>
                      <option value="RS">Road Safety Campus (RS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Session *</label>
                    <select
                      required
                      value={formSession}
                      onChange={(e) => setFormSession(e.target.value)}
                      disabled={!!editingTemplate}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all disabled:opacity-60"
                    >
                      {academicSessions.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Term *</label>
                    <select
                      required
                      value={formTerm}
                      onChange={(e) => setFormTerm(e.target.value)}
                      disabled={!!editingTemplate}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all disabled:opacity-60"
                    >
                      {filteredTermsForForm.length > 0 ? (
                        filteredTermsForForm.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))
                      ) : (
                        <option value="">No terms generated for session</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Student Section *</label>
                    <select
                      required
                      value={formSectionId}
                      onChange={(e) => setFormSectionId(e.target.value)}
                      disabled={!!editingTemplate}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all disabled:opacity-60"
                    >
                      <option value="">Select section...</option>
                      {filteredSectionsForForm.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub-inputs of active Fee Heads */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter Fee Head Amounts (₦)</span>
                  
                  {relevantFeeHeadsForForm.length === 0 ? (
                    <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-2xl p-3.5 text-center text-[11px] font-semibold">
                      No active Fee Heads correspond to this selected Section & Campus Branch. Please establish Fee Heads in the master list first.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {relevantFeeHeadsForForm.map(head => (
                        <div key={head.id} className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200/50">
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs font-bold text-slate-800 truncate">{head.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono block">{head.code} • {head.isMandatory ? 'Mandatory' : 'Optional'}</span>
                          </div>
                          
                          <div className="relative w-36 shrink-0">
                            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₦</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={formAmounts[head.id] || ''}
                              onChange={(e) => setFormAmounts({ ...formAmounts, [head.id]: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2.5 py-2 text-xs font-black text-slate-850 focus:border-indigo-500 outline-none text-right"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Due Date & Overdue Restrictions Configuration */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Lucide.Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Due Date & Overdue Policy
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date (Days from Term Start)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formDueDateOffset}
                        onChange={(e) => setFormDueDateOffset(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grace Period (Days)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formGracePeriod}
                        onChange={(e) => setFormGracePeriod(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reminder Schedule Alerts</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. -3 Days, On Due Date, +5 Overdue"
                      value={formReminderSchedule}
                      onChange={(e) => setFormReminderSchedule(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="bg-slate-55/60 border border-slate-200/50 rounded-xl p-3 space-y-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Overdue Restriction Rules</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formBlockReportCard}
                          onChange={(e) => setFormBlockReportCard(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-3.5 h-3.5"
                        />
                        <span>Block Report Card</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formBlockParentPortal}
                          onChange={(e) => setFormBlockParentPortal(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-3.5 h-3.5"
                        />
                        <span>Restrict Parent Portal</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formBlockBooks}
                          onChange={(e) => setFormBlockBooks(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-3.5 h-3.5"
                        />
                        <span>Block Books Issuance</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formBlockPromotion}
                          onChange={(e) => setFormBlockPromotion(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-3.5 h-3.5"
                        />
                        <span>Block Promotion</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 col-span-1 sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={formBlockRegistration}
                          onChange={(e) => setFormBlockRegistration(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 w-3.5 h-3.5"
                        />
                        <span>Block Term/Course Registration</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Computed Total box */}
                <div className="bg-indigo-50 border border-indigo-100/50 rounded-2xl p-3.5 flex justify-between items-center text-indigo-950">
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-wider opacity-60">Computed Total Combined Fee</span>
                    <span className="text-[11px] font-medium italic opacity-80">{relevantFeeHeadsForForm.length} total active heads</span>
                  </div>
                  <span className="text-lg font-black text-indigo-900">{formatCurrency(computedFormTotal)}</span>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={relevantFeeHeadsForForm.length === 0}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-55"
                  >
                    {editingTemplate ? 'Save Template Changes' : 'Publish Fee Template'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* CLASS OVERRIDE BUILDER MODAL (OVERRIDE SCREEN) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isOverrideModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl border border-slate-100 my-8"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Lucide.Sparkles className="w-4 h-4 text-amber-600" />
                  {editingOverride ? 'Modify Class Fee Override' : 'Define Class Fee Override'}
                </h4>
                <button 
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submitOverrideForm} className="space-y-4">
                {overrideError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-bold flex items-center gap-2">
                    <Lucide.AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{overrideError}</span>
                  </div>
                )}

                {/* Base Template and target Class Selects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Base Fee Template *</label>
                    <select
                      required
                      value={overrideTemplateId}
                      onChange={(e) => {
                        setOverrideTemplateId(e.target.value);
                        setOverrideAmounts({});
                        setOverrideRemovedHeads({});
                        setCustomOverrideHeads([]);
                      }}
                      disabled={!!editingOverride}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all disabled:opacity-60"
                    >
                      <option value="">Select Base Fee Template...</option>
                      {templates.map(t => {
                        const secObj = sectionsMap[t.sectionId];
                        const termObj = termsMap[t.term];
                        const sessObj = sessionsMap[t.session];
                        return (
                          <option key={t.id} value={t.id}>
                            {t.branch} • {secObj?.name || 'Section'} • {termObj?.name || 'Term'} ({sessObj?.name || 'Year'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class Override Target *</label>
                    <select
                      required
                      value={overrideClassId}
                      onChange={(e) => setOverrideClassId(e.target.value)}
                      disabled={!!editingOverride || !overrideTemplateId}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all disabled:opacity-60"
                    >
                      <option value="">Select target class...</option>
                      {availableClassesForOverride.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.branch})
                        </option>
                      ))}
                    </select>
                    {availableClassesForOverride.length === 0 && overrideTemplateId && (
                      <span className="text-[10px] text-amber-600 font-semibold block mt-1">No classes match this template's section/branch.</span>
                    )}
                  </div>
                </div>

                {/* INTERACTIVE COMPONENT: ADJUST TEMPLATE FEE HEADS (Edit / Remove) */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjust Base Fee Heads</span>
                    <span className="text-[10px] text-slate-400 font-medium">Override amounts or exclude entirely.</span>
                  </div>

                  {!overrideTemplateId ? (
                    <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 text-center text-xs text-slate-400 italic">
                      Please select a Base Fee Template above to edit itemized heads.
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                      {activeTemplateItems.map(item => {
                        const head = feeHeadsMap[item.feeHeadId];
                        const isRemoved = overrideRemovedHeads[item.feeHeadId] || false;
                        const userVal = overrideAmounts[item.feeHeadId] || '';

                        return (
                          <div 
                            key={item.feeHeadId} 
                            className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                              isRemoved 
                                ? 'bg-rose-50/40 border-rose-100 opacity-70' 
                                : userVal !== '' 
                                  ? 'bg-amber-50/40 border-amber-200/80' 
                                  : 'bg-slate-50/50 border-slate-250/20'
                            }`}
                          >
                            {/* Head metadata */}
                            <div className="min-w-0 flex-1">
                              <span className={`block text-xs font-black truncate ${isRemoved ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {head?.name || 'Base Head'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono block">
                                Base: {formatCurrency(item.amount)}
                              </span>
                            </div>

                            {/* Inputs control */}
                            <div className="flex items-center gap-3 shrink-0">
                              {/* Override Checkbox */}
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isRemoved}
                                  onChange={(e) => {
                                    setOverrideRemovedHeads({
                                      ...overrideRemovedHeads,
                                      [item.feeHeadId]: e.target.checked
                                    });
                                  }}
                                  className="w-3.5 h-3.5 text-rose-600 rounded-sm focus:ring-rose-500 accent-rose-500"
                                />
                                <span className="text-[10px] text-rose-600 font-bold">Omit</span>
                              </label>

                              {/* Numeric overriding Input */}
                              <div className="relative w-28">
                                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₦</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  disabled={isRemoved}
                                  placeholder={item.amount.toString()}
                                  value={userVal}
                                  onChange={(e) => {
                                    setOverrideAmounts({
                                      ...overrideAmounts,
                                      [item.feeHeadId]: e.target.value
                                    });
                                  }}
                                  className="w-full bg-white disabled:bg-slate-100 border border-slate-200 rounded-lg pl-5 pr-2 py-1.5 text-xs font-bold text-slate-800 text-right focus:border-amber-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* INTERACTIVE COMPONENT: ADD EXTRA LEVIES (Add Fee Head) */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Levy Extra Class-Specific Fee Heads</span>
                  
                  {overrideTemplateId && feeHeadsAvailableForCustomAdd.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                      <div className="flex-1 min-w-0">
                        <select
                          value={selectedCustomHeadToAdd}
                          onChange={(e) => setSelectedCustomHeadToAdd(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 focus:border-amber-500 outline-none"
                        >
                          {feeHeadsAvailableForCustomAdd.map(head => (
                            <option key={head.id} value={head.id}>
                              {head.name} ({head.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative w-32 shrink-0">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₦</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Amount"
                          value={customHeadAmountInput}
                          onChange={(e) => setCustomHeadAmountInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-5 pr-2 py-1.5 text-xs font-bold text-slate-800 text-right focus:border-amber-500 outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCustomHeadToOverride}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Lucide.Plus className="w-3.5 h-3.5" />
                        Levy
                      </button>
                    </div>
                  )}

                  {/* List of customly added heads inside modal */}
                  {customOverrideHeads.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Extra levies listed for override</span>
                      <div className="space-y-1.5 max-h-24 overflow-y-auto">
                        {customOverrideHeads.map(item => {
                          const head = feeHeadsMap[item.feeHeadId];
                          return (
                            <div key={item.feeHeadId} className="flex justify-between items-center p-2 bg-emerald-50/40 border border-emerald-100 rounded-lg text-xs">
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-emerald-950 truncate block">{head?.name || 'Extra Levy'}</span>
                                <span className="text-[9px] text-emerald-600 font-mono block">{head?.code || 'LEVY'}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-black text-emerald-800">{formatCurrency(item.amount)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomHeadFromOverride(item.feeHeadId)}
                                  className="text-rose-500 hover:bg-rose-50 p-1 rounded-md cursor-pointer"
                                  title="Omit this levy"
                                >
                                  <Lucide.Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Live comparison total summary */}
                {overrideTemplateId && (
                  <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-amber-950">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-amber-800">Dynamic Live Comparison</span>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span>Base Section Fee:</span>
                        <span className="font-bold text-slate-600">{formatCurrency(templatesMap[overrideTemplateId]?.totalFee || 0)}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-amber-800">Overridden Fee</span>
                      <span className="text-lg font-black text-amber-900">{formatCurrency(calculatedOverrideTotal)}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOverrideModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!overrideTemplateId || !overrideClassId}
                    className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-55"
                  >
                    {editingOverride ? 'Save Override Changes' : 'Confirm Class Override'}
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
