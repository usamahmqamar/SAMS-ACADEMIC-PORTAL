import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';
import Toast from './Toast';
import OptionalChargesManagement from './OptionalChargesManagement';
import SectionsClassesManagement from './SectionsClassesManagement';
import FeeTemplateBuilder from './FeeTemplateBuilder';
import StudentBilling from './StudentBilling';
import FamilyBilling from './FamilyBilling';
import PaymentCollection from './PaymentCollection';
import FinancialTimeline from './FinancialTimeline';
import ExpenseManagement from './ExpenseManagement';
import FinancialReports from './FinancialReports';
import SiblingDiscountManagement from './SiblingDiscountManagement';

interface FinancialSetting {
  id: string;
  financialYear: string;
  currency: string;
  currencySymbol: string;
  receiptPrefix: string;
  autoReceiptNumber: boolean;
  defaultDueDays: number;
  defaultGracePeriod: number;
  defaultPaymentThreshold: number;
  defaultReceiptFooter: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface FeeHeadCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface FeeHead {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  isMandatory: boolean;
  isActive: boolean;
  branchId: string;
  section: 'Nursery' | 'Primary' | 'Secondary' | 'All';
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

interface FinancialSettingsProps {
  currentRole: string;
  activeSection?: 'general' | 'fee_heads' | 'optional_charges' | 'sections_classes' | 'fee_templates' | 'student_billing' | 'family_accounts' | 'payment_collection' | 'financial_timeline' | 'expense_management' | 'financial_reports' | 'sibling_discounts' | 'discounts';
  onSectionChange?: (section: any) => void;
}

export default function FinancialSettings({ currentRole, activeSection: propActiveSection, onSectionChange }: FinancialSettingsProps) {
  // Navigation Tabs: 'general', 'fee_heads', 'optional_charges', 'sections_classes', 'fee_templates', 'student_billing', 'family_accounts', 'payment_collection', 'expense_management', 'sibling_discounts'
  const [localActiveSection, setLocalActiveSection] = useState<'general' | 'fee_heads' | 'optional_charges' | 'sections_classes' | 'fee_templates' | 'student_billing' | 'family_accounts' | 'payment_collection' | 'financial_timeline' | 'expense_management' | 'financial_reports' | 'sibling_discounts' | 'discounts'>('general');

  const activeSection = propActiveSection !== undefined ? propActiveSection : localActiveSection;
  const setActiveSection = (section: any) => {
    if (onSectionChange) {
      onSectionChange(section);
    } else {
      setLocalActiveSection(section);
    }
  };

  // --- STUDENT BILLING LEDGERS COUNT STATE ---
  const [billingCount, setBillingCount] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // --- FAMILY ACCOUNTS COUNT STATE ---
  const [familyCount, setFamilyCount] = useState<number>(0);

  // --- STUDENT PAYMENTS COUNT STATE ---
  const [paymentsCount, setPaymentsCount] = useState<number>(0);

  // --- OPTIONAL CHARGES COUNT STATE ---
  const [optionalChargesCount, setOptionalChargesCount] = useState<number>(0);

  // --- FEE TEMPLATES COUNT STATE ---
  const [feeTemplatesCount, setFeeTemplatesCount] = useState<number>(0);

  // --- SECTIONS & CLASSES COUNTS ---
  const [sectionsCount, setSectionsCount] = useState<number>(0);
  const [classesCount, setClassesCount] = useState<number>(0);

  // --- GENERAL FINANCIAL SETTINGS STATES ---
  const [settings, setSettings] = useState<FinancialSetting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSetting, setEditingSetting] = useState<FinancialSetting | null>(null);

  const [financialYear, setFinancialYear] = useState<string>('');
  const [currency, setCurrency] = useState<string>('NGN');
  const [currencySymbol, setCurrencySymbol] = useState<string>('₦');
  const [receiptPrefix, setReceiptPrefix] = useState<string>('REC-26-');
  const [autoReceiptNumber, setAutoReceiptNumber] = useState<boolean>(true);
  const [defaultDueDays, setDefaultDueDays] = useState<number>(15);
  const [defaultGracePeriod, setDefaultGracePeriod] = useState<number>(7);
  const [defaultPaymentThreshold, setDefaultPaymentThreshold] = useState<number>(50);
  const [defaultReceiptFooter, setDefaultReceiptFooter] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // --- FEE HEADS & CATEGORIES STATES ---
  const [feeCategories, setFeeCategories] = useState<FeeHeadCategory[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [feeLoading, setFeeLoading] = useState<boolean>(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Fee Head Category Form State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<FeeHeadCategory | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryDescription, setCategoryDescription] = useState<string>('');
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);

  // Fee Head Form State
  const [isFeeHeadModalOpen, setIsFeeHeadModalOpen] = useState<boolean>(false);
  const [editingFeeHead, setEditingFeeHead] = useState<FeeHead | null>(null);
  const [feeHeadCode, setFeeHeadCode] = useState<string>('');
  const [feeHeadName, setFeeHeadName] = useState<string>('');
  const [feeHeadDescription, setFeeHeadDescription] = useState<string>('');
  const [feeHeadCategoryId, setFeeHeadCategoryId] = useState<string>('');
  const [feeHeadIsMandatory, setFeeHeadIsMandatory] = useState<boolean>(true);
  const [feeHeadIsActive, setFeeHeadIsActive] = useState<boolean>(true);
  const [feeHeadBranchId, setFeeHeadBranchId] = useState<string>('All');
  const [feeHeadSection, setFeeHeadSection] = useState<'Nursery' | 'Primary' | 'Secondary' | 'All'>('All');
  const [feeHeadDisplayOrder, setFeeHeadDisplayOrder] = useState<number>(1);
  const [feeHeadFormError, setFeeHeadFormError] = useState<string | null>(null);

  // Filters & Searches for Fee Heads
  const [feeSearchQuery, setFeeSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterBranch, setFilterBranch] = useState<string>('All');
  const [filterMandatory, setFilterMandatory] = useState<string>('All');

  // --- FETCHING ACTIONS ---

  // Fetch all general financial settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/financial_settings');
      if (!res.ok) {
        throw new Error('Failed to load financial settings.');
      }
      const data = await res.json();
      setSettings(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while fetching settings.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch fee head categories and fee heads
  const fetchFeeData = async () => {
    try {
      setFeeLoading(true);
      setFeeError(null);
      const [catsRes, headsRes] = await Promise.all([
        fetch('/api/fee_head_categories'),
        fetch('/api/fee_heads')
      ]);

      if (!catsRes.ok || !headsRes.ok) {
        throw new Error('Failed to retrieve school fee ledger guidelines.');
      }

      const catsData = await catsRes.json();
      const headsData = await headsRes.json();

      setFeeCategories(catsData);
      setFeeHeads(headsData);
    } catch (err: any) {
      console.error(err);
      setFeeError(err.message || 'Error parsing fee blueprints.');
    } finally {
      setFeeLoading(false);
    }
  };

  const fetchOptionalChargesCount = async () => {
    try {
      const res = await fetch('/api/optional_charges');
      if (res.ok) {
        const data = await res.json();
        setOptionalChargesCount(data.length || 0);
      }
    } catch (err) {
      console.error('Error fetching optional charges count:', err);
    }
  };

  const fetchSectionsClassesCounts = async () => {
    try {
      const [secRes, classRes, tempRes, billingRes, familyRes, paymentsRes] = await Promise.all([
        fetch('/api/sections'),
        fetch('/api/classes'),
        fetch('/api/fee_templates'),
        fetch('/api/student_fee_ledgers'),
        fetch('/api/family_accounts'),
        fetch('/api/student_payments')
      ]);
      if (secRes.ok && classRes.ok) {
        const secData = await secRes.json();
        const classData = await classRes.json();
        setSectionsCount(secData.length || 0);
        setClassesCount(classData.length || 0);
      }
      if (tempRes && tempRes.ok) {
        const tempData = await tempRes.json();
        setFeeTemplatesCount(tempData.length || 0);
      }
      if (billingRes && billingRes.ok) {
        const billingData = await billingRes.json();
        setBillingCount(billingData.length || 0);
      }
      if (familyRes && familyRes.ok) {
        const familyData = await familyRes.json();
        setFamilyCount(familyData.length || 0);
      }
      if (paymentsRes && paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPaymentsCount(paymentsData.length || 0);
      }
    } catch (err) {
      console.error('Error fetching sections/classes/templates/billing/family/payments counts:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchFeeData();
    fetchOptionalChargesCount();
    fetchSectionsClassesCounts();
  }, [activeSection]);

  // --- GENERAL SETTINGS HANDLERS ---
  const openCreateModal = () => {
    setEditingSetting(null);
    setFinancialYear('');
    setCurrency('NGN');
    setCurrencySymbol('₦');
    setReceiptPrefix('REC-');
    setAutoReceiptNumber(true);
    setDefaultDueDays(15);
    setDefaultGracePeriod(7);
    setDefaultPaymentThreshold(50);
    setDefaultReceiptFooter('Thank you for choosing SAMS. For questions, contact billing@sams.edu');
    setIsDefault(false);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (setting: FinancialSetting) => {
    setEditingSetting(setting);
    setFinancialYear(setting.financialYear);
    setCurrency(setting.currency);
    setCurrencySymbol(setting.currencySymbol);
    setReceiptPrefix(setting.receiptPrefix);
    setAutoReceiptNumber(setting.autoReceiptNumber);
    setDefaultDueDays(setting.defaultDueDays);
    setDefaultGracePeriod(setting.defaultGracePeriod);
    setDefaultPaymentThreshold(setting.defaultPaymentThreshold);
    setDefaultReceiptFooter(setting.defaultReceiptFooter);
    setIsDefault(setting.isDefault);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSetDefault = async (setting: FinancialSetting) => {
    try {
      const res = await fetch(`/api/financial_settings/${setting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...setting,
          isDefault: true
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update configuration.');
      }

      await fetchSettings();
    } catch (err: any) {
      alert(err.message || 'Could not apply settings.');
    }
  };

  const handleDeleteSetting = async (setting: FinancialSetting) => {
    const confirmationMsg = setting.isDefault 
      ? `⚠️ WARNING: "${setting.financialYear}" is currently marked as the ACTIVE system default config.\n\nDeleting it will force SAMS to assign another year as default automatically. Are you sure you want to proceed?`
      : `Are you sure you want to delete the financial settings for Year "${setting.financialYear}"?`;

    if (!confirm(confirmationMsg)) {
      return;
    }

    try {
      const res = await fetch(`/api/financial_settings/${setting.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete setting.');
      }

      await fetchSettings();
    } catch (err: any) {
      alert(err.message || 'Could not delete configuration.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!financialYear.trim()) {
      setFormError('Financial Year is required.');
      return;
    }

    const yearRegex = /^\d{4}[\/\-]\d{2,4}$/;
    if (!yearRegex.test(financialYear.trim())) {
      setFormError('Financial Year format must be "YYYY/YYYY" or "YYYY-YY" (e.g., 2026/2027 or 2026-27).');
      return;
    }

    if (!currency.trim()) {
      setFormError('Currency code is required.');
      return;
    }

    if (!currencySymbol.trim()) {
      setFormError('Currency symbol is required.');
      return;
    }

    if (defaultDueDays < 0) {
      setFormError('Default due days cannot be negative.');
      return;
    }

    if (defaultGracePeriod < 0) {
      setFormError('Default grace period cannot be negative.');
      return;
    }

    if (defaultPaymentThreshold < 0 || defaultPaymentThreshold > 100) {
      setFormError('Default payment threshold must be a percentage between 0 and 100.');
      return;
    }

    const duplicate = settings.some(
      s => (!editingSetting || s.id !== editingSetting.id) &&
      s.financialYear.trim().toLowerCase() === financialYear.trim().toLowerCase()
    );

    if (duplicate) {
      setFormError(`A configuration for financial year "${financialYear}" already exists.`);
      return;
    }

    try {
      const payload = {
        financialYear,
        currency,
        currencySymbol,
        receiptPrefix,
        autoReceiptNumber,
        defaultDueDays,
        defaultGracePeriod,
        defaultPaymentThreshold,
        defaultReceiptFooter,
        isDefault
      };

      const url = editingSetting 
        ? `/api/financial_settings/${editingSetting.id}` 
        : '/api/financial_settings';
        
      const method = editingSetting ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server validation failed.');
      }

      setFormSuccess(editingSetting ? 'Configuration updated successfully.' : 'New configuration registered successfully.');
      await fetchSettings();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Could not save configuration settings.');
    }
  };

  const activeSetting = settings.find(s => s.isDefault);

  // --- FEE CATEGORIES ACTIONS ---
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setCategoryFormError(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: FeeHeadCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDescription(cat.description);
    setCategoryFormError(null);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFormError(null);

    if (!categoryName.trim()) {
      setCategoryFormError('Category name is required.');
      return;
    }

    // Client-side duplicate check
    const duplicate = feeCategories.some(
      c => (!editingCategory || c.id !== editingCategory.id) &&
      c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );

    if (duplicate) {
      setCategoryFormError(`A fee category named "${categoryName}" already exists.`);
      return;
    }

    try {
      const payload = {
        name: categoryName.trim(),
        description: categoryDescription.trim()
      };

      const url = editingCategory 
        ? `/api/fee_head_categories/${editingCategory.id}` 
        : '/api/fee_head_categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server rejected category update.');
      }

      await fetchFeeData();
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      setCategoryFormError(err.message || 'Could not register category.');
    }
  };

  const handleDeleteCategory = async (cat: FeeHeadCategory) => {
    // Check if any Fee Head is associated with this category
    const linkedHeads = feeHeads.filter(h => h.categoryId === cat.id);
    if (linkedHeads.length > 0) {
      alert(`❌ CANNOT DELETE CATEGORY\n\nThe category "${cat.name}" is currently in use by ${linkedHeads.length} Fee Head(s) (e.g. ${linkedHeads[0].name}).\n\nPlease reassign or delete these Fee Heads first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the fee category "${cat.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/fee_head_categories/${cat.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete category.');
      }

      await fetchFeeData();
    } catch (err: any) {
      alert(err.message || 'Error removing category.');
    }
  };

  // --- FEE HEADS ACTIONS ---
  const openCreateFeeHead = () => {
    setEditingFeeHead(null);
    setFeeHeadCode('');
    setFeeHeadName('');
    setFeeHeadDescription('');
    setFeeHeadCategoryId(feeCategories[0]?.id || '');
    setFeeHeadIsMandatory(true);
    setFeeHeadIsActive(true);
    setFeeHeadBranchId('All');
    setFeeHeadSection('All');
    setFeeHeadDisplayOrder(feeHeads.length + 1);
    setFeeHeadFormError(null);
    setIsFeeHeadModalOpen(true);
  };

  const openEditFeeHead = (head: FeeHead) => {
    setEditingFeeHead(head);
    setFeeHeadCode(head.code);
    setFeeHeadName(head.name);
    setFeeHeadDescription(head.description);
    setFeeHeadCategoryId(head.categoryId);
    setFeeHeadIsMandatory(head.isMandatory);
    setFeeHeadIsActive(head.isActive);
    setFeeHeadBranchId(head.branchId);
    setFeeHeadSection(head.section);
    setFeeHeadDisplayOrder(head.displayOrder);
    setFeeHeadFormError(null);
    setIsFeeHeadModalOpen(true);
  };

  const handleFeeHeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeeHeadFormError(null);

    // Form client-side validations
    if (!feeHeadCode.trim()) {
      setFeeHeadFormError('Fee Head Code is required.');
      return;
    }

    // Code code-formatting verification: alphanumeric, dashes or underscores
    const codeRegex = /^[A-Z0-9\-_]+$/i;
    if (!codeRegex.test(feeHeadCode.trim())) {
      setFeeHeadFormError('Fee Head Code must be alphanumeric and contain no spaces (hyphens/underscores allowed, e.g. TUIT-PRI).');
      return;
    }

    if (!feeHeadName.trim()) {
      setFeeHeadFormError('Fee Head Name is required.');
      return;
    }

    if (!feeHeadCategoryId) {
      setFeeHeadFormError('Please select a valid parent category.');
      return;
    }

    if (feeHeadDisplayOrder < 1) {
      setFeeHeadFormError('Display order must be a positive integer.');
      return;
    }

    // **STRICT VALIDATION: Duplicate Fee Head Code Check**
    const duplicate = feeHeads.some(
      h => (!editingFeeHead || h.id !== editingFeeHead.id) &&
      h.code.trim().toUpperCase() === feeHeadCode.trim().toUpperCase()
    );

    if (duplicate) {
      setFeeHeadFormError(`⚠️ DUPLICATE CODE ERROR\n\nA Fee Head with Code "${feeHeadCode.trim().toUpperCase()}" is already registered in SAMS.\n\nEach billing head must possess a unique system code.`);
      return;
    }

    try {
      const payload = {
        code: feeHeadCode.trim().toUpperCase(),
        name: feeHeadName.trim(),
        description: feeHeadDescription.trim(),
        categoryId: feeHeadCategoryId,
        isMandatory: feeHeadIsMandatory,
        isActive: feeHeadIsActive,
        branchId: feeHeadBranchId,
        section: feeHeadSection,
        displayOrder: Number(feeHeadDisplayOrder)
      };

      const url = editingFeeHead 
        ? `/api/fee_heads/${editingFeeHead.id}` 
        : '/api/fee_heads';
      const method = editingFeeHead ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server validation failed.');
      }

      await fetchFeeData();
      setIsFeeHeadModalOpen(false);
    } catch (err: any) {
      setFeeHeadFormError(err.message || 'Error writing Fee Head entry.');
    }
  };

  const handleDeleteFeeHead = async (head: FeeHead) => {
    if (!confirm(`Are you sure you want to permanently delete the SAMS billing head "${head.name}" (${head.code})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/fee_heads/${head.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete Fee Head.');
      }

      await fetchFeeData();
      setToast({ message: "Fee head deleted successfully.", type: "info" });
    } catch (err: any) {
      setToast({ message: err.message || 'Error discarding Fee Head.', type: "error" });
    }
  };

  // Helper mapping categoryId -> Category Name
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    feeCategories.forEach(c => {
      map[c.id] = c.name;
    });
    return map;
  }, [feeCategories]);

  // Filtering + Searching Fee Heads
  const filteredFeeHeads = useMemo(() => {
    return feeHeads.filter(head => {
      const matchesSearch = 
        head.name.toLowerCase().includes(feeSearchQuery.toLowerCase()) ||
        head.code.toLowerCase().includes(feeSearchQuery.toLowerCase()) ||
        head.description.toLowerCase().includes(feeSearchQuery.toLowerCase());

      const matchesCategory = filterCategory === 'All' || head.categoryId === filterCategory;
      const matchesSection = filterSection === 'All' || head.section === filterSection;
      const matchesBranch = filterBranch === 'All' || head.branchId === filterBranch;
      const matchesMandatory = 
        filterMandatory === 'All' || 
        (filterMandatory === 'Mandatory' && head.isMandatory) ||
        (filterMandatory === 'Optional' && !head.isMandatory);

      return matchesSearch && matchesCategory && matchesSection && matchesBranch && matchesMandatory;
    }).sort((a, b) => a.displayOrder - b.displayOrder);
  }, [feeHeads, feeSearchQuery, filterCategory, filterSection, filterBranch, filterMandatory]);

  // General counts for quick metrics
  const activeCount = useMemo(() => feeHeads.filter(h => h.isActive).length, [feeHeads]);
  const mandatoryCount = useMemo(() => feeHeads.filter(h => h.isMandatory).length, [feeHeads]);

  return (
    <div id="financial-settings-workspace" className="space-y-8">
      {/* Upper Navigation Row with Unified Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Lucide.Coins className="w-5.5 h-5.5" />
            </div>
            Institutional Financial Controls
          </h2>
          <p className="text-xs text-slate-500 mt-1">blueprints for institutional billing, currency settings, payment cycles, and reusable fee headers.</p>
        </div>
      </div>

      {/* Clean Category-Grouped Top Horizontal Navigation Bar (Replacing the nested Workspace Hub Control Panel) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-3">
        {/* Mobile Dropdown */}
        <div className="md:hidden w-full">
          <div className="relative">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <optgroup label="⚙️ SETUP & CONFIGURATION">
                <option value="general">General Parameters</option>
                <option value="sections_classes">Sections & Classes</option>
                <option value="fee_heads">Fee Head Blueprints</option>
                <option value="optional_charges">Optional Charges</option>
                <option value="fee_templates">Fee Template Builder</option>
              </optgroup>
              <optgroup label="💸 BILLING & OPERATIONS">
                <option value="student_billing">Student Billing</option>
                <option value="family_accounts">Family Portfolios</option>
                <option value="sibling_discounts">Sibling Relief (Discounts)</option>
                <option value="payment_collection">Payment Collection</option>
                <option value="expense_management">Expense Management</option>
              </optgroup>
              <optgroup label="📈 PERFORMANCE & ANALYTICS">
                <option value="financial_timeline">Financial Timeline</option>
                <option value="financial_reports">Financial Reports & AI Insights</option>
              </optgroup>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Lucide.ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Desktop Responsive Categorized Tabs */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Group 1: Setup */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Lucide.Settings className="w-3 h-3 text-indigo-500" />
              Setup:
            </span>
            <button
              onClick={() => setActiveSection('general')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'general'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.SlidersHorizontal className="w-3.5 h-3.5" />
              General
            </button>

            <button
              onClick={() => setActiveSection('sections_classes')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'sections_classes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.School className="w-3.5 h-3.5" />
              Sections & Classes
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeSection === 'sections_classes' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {sectionsCount}:{classesCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('fee_heads')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'fee_heads'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.Layers className="w-3.5 h-3.5" />
              Fee Heads
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeSection === 'fee_heads' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {feeHeads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('optional_charges')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'optional_charges'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.Receipt className="w-3.5 h-3.5" />
              Optional Charges
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeSection === 'optional_charges' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {optionalChargesCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('fee_templates')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'fee_templates'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.Coins className="w-3.5 h-3.5" />
              Fee Templates
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeSection === 'fee_templates' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {feeTemplatesCount}
              </span>
            </button>
          </div>

          {/* Group 2: Operations & Billing */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Lucide.Activity className="w-3 h-3 text-emerald-500" />
              Operations:
            </span>
            <button
              onClick={() => setActiveSection('student_billing')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'student_billing'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.Receipt className="w-3.5 h-3.5" />
              Student Billing
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeSection === 'student_billing' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {billingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('family_accounts')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'family_accounts'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.Users className="w-3.5 h-3.5" />
              Family Portfolios
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeSection === 'family_accounts' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {familyCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('sibling_discounts')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'sibling_discounts' || activeSection === 'discounts'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.BadgePercent className="w-3.5 h-3.5" />
              Sibling Relief
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeSection === 'sibling_discounts' || activeSection === 'discounts' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                Graduated
              </span>
            </button>

            <button
              onClick={() => setActiveSection('payment_collection')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'payment_collection'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.HandCoins className="w-3.5 h-3.5" />
              Collections
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${activeSection === 'payment_collection' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {paymentsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('expense_management')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'expense_management'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.DollarSign className="w-3.5 h-3.5" />
              Expenses
            </button>

            <button
              onClick={() => setActiveSection('financial_timeline')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'financial_timeline'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.History className="w-3.5 h-3.5" />
              Timeline
            </button>

            <button
              onClick={() => setActiveSection('financial_reports')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'financial_reports'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Lucide.PieChart className="w-3.5 h-3.5" />
              Reports & AI
            </button>
          </div>
        </div>
      </div>

      {/* Main Full-Width Content Container */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-8">

      {/* RENDER PHASE 6: STUDENT BILLING WORKSPACE */}
      {activeSection === 'student_billing' && (
        <StudentBilling />
      )}

      {/* RENDER PHASE 7: FAMILY FINANCIAL ACCOUNTS WORKSPACE */}
      {activeSection === 'family_accounts' && (
        <FamilyBilling />
      )}

      {/* RENDER PHASE 7B: SIBLING RELIEF / DISCOUNTS WORKSPACE */}
      {(activeSection === 'sibling_discounts' || activeSection === 'discounts') && (
        <SiblingDiscountManagement currentRole={currentRole} />
      )}

      {/* RENDER PHASE 8: PAYMENT COLLECTION WORKSPACE */}
      {activeSection === 'payment_collection' && (
        <PaymentCollection />
      )}

      {/* RENDER PHASE 9: FINANCIAL TIMELINE WORKSPACE */}
      {activeSection === 'financial_timeline' && (
        <FinancialTimeline />
      )}

      {/* RENDER PHASE 10: EXPENSE MANAGEMENT WORKSPACE */}
      {activeSection === 'expense_management' && (
        <ExpenseManagement />
      )}

      {/* RENDER PHASE 11: FINANCIAL REPORTS WORKSPACE */}
      {activeSection === 'financial_reports' && (
        <FinancialReports activeBranch={filterBranch === 'All' ? 'All' : (filterBranch as any)} />
      )}

      {/* RENDER PHASE 3: OPTIONAL CHARGES WORKSPACE */}
      {activeSection === 'optional_charges' && (
        <OptionalChargesManagement />
      )}

      {/* RENDER PHASE 4: SECTIONS & CLASSES WORKSPACE */}
      {activeSection === 'sections_classes' && (
        <SectionsClassesManagement />
      )}

      {/* RENDER PHASE 5: FEE TEMPLATE BUILDER WORKSPACE */}
      {activeSection === 'fee_templates' && (
        <FeeTemplateBuilder />
      )}

      {/* RENDER PHASE 1: GENERAL SYSTEM SETTINGS WORKSPACE */}
      {activeSection === 'general' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Institutional Fiscal Cycles</h3>
              <p className="text-[11px] text-slate-500">Configure global currencies, receipt serial formats, and overdue billing policy scopes.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lucide.Plus className="w-4 h-4" />
              Create Cycle Configuration
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
              <p className="text-xs font-semibold">Loading SAMS institutional monetary configurations...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 text-center text-rose-800">
              <Lucide.ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <p className="text-xs font-bold">{error}</p>
              <button onClick={fetchSettings} className="mt-3 text-xs text-indigo-600 font-bold underline">Try Reloading</button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Global State Summary Card */}
              {activeSetting && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-indigo-950 text-white rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-indigo-150"
                >
                  <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10">
                    <Lucide.Coins className="w-64 h-64" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Active System Configuration
                        </span>
                        <span className="bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded font-black uppercase">LIVE</span>
                      </div>
                      <h3 className="text-3xl font-black font-sans">{activeSetting.financialYear}</h3>
                      <p className="text-xs text-indigo-200 font-medium">This configuration is currently active across all invoicing, payroll, and collection modules.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                        <span className="block text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Currency</span>
                        <span className="text-sm font-extrabold">{activeSetting.currency} ({activeSetting.currencySymbol})</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                        <span className="block text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Receipt Prefix</span>
                        <span className="text-sm font-extrabold font-mono">{activeSetting.receiptPrefix || 'None'}</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                        <span className="block text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Terms Delay</span>
                        <span className="text-sm font-extrabold">{activeSetting.defaultDueDays} Days</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                        <span className="block text-[9px] text-indigo-300 font-bold uppercase tracking-wider">Threshold</span>
                        <span className="text-sm font-extrabold">{activeSetting.defaultPaymentThreshold}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Historical Configurations Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">All Fiscal Cycles ({settings.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {settings.map((setting) => (
                    <motion.div
                      key={setting.id}
                      layout
                      className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                        setting.isDefault ? 'border-indigo-500 shadow-sm ring-1 ring-indigo-50' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-slate-800">{setting.financialYear}</h4>
                            {setting.isDefault && (
                              <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[8.5px] px-2 py-0.5 rounded-full font-bold uppercase">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">Created on {new Date(setting.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-2xl font-black text-slate-400">{setting.currencySymbol}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs">
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Prefix</span>
                          <span className="font-mono font-bold text-slate-700">{setting.receiptPrefix || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Default Terms</span>
                          <span className="font-bold text-slate-700">{setting.defaultDueDays} Days</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Grace</span>
                          <span className="font-bold text-slate-700">+{setting.defaultGracePeriod} Days</span>
                        </div>
                      </div>

                      <div className="text-slate-600 text-[11px] leading-relaxed italic border-l-2 border-slate-200 pl-2.5">
                        "{setting.defaultReceiptFooter || 'No custom footer configured.'}"
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                        {!setting.isDefault ? (
                          <button
                            onClick={() => handleSetDefault(setting)}
                            className="text-[10.5px] text-indigo-600 hover:text-indigo-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Lucide.CheckCircle2 className="w-3.5 h-3.5" />
                            Set Active
                          </button>
                        ) : (
                          <span className="text-[10.5px] text-emerald-600 font-extrabold flex items-center gap-1">
                            <Lucide.Check className="w-3.5 h-3.5" />
                            Active Default
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(setting)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Edit Configuration"
                          >
                            <Lucide.Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSetting(setting)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Configuration"
                          >
                            <Lucide.Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER PHASE 2: REUSABLE FEE HEADS & CATEGORIES WORKSPACE */}
      {activeSection === 'fee_heads' && (
        <div className="space-y-6">
          {/* Quick Metrics Dashboard Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Lucide.Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Fee Heads</span>
                <span className="text-lg font-black text-slate-800">{feeHeads.length} Blueprint Entries</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Lucide.ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mandatory Fees</span>
                <span className="text-lg font-black text-slate-800">{mandatoryCount} Compulsory</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Lucide.CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Billing Heads</span>
                <span className="text-lg font-black text-slate-800">{activeCount} Operational</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Lucide.Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">ledger Categories</span>
                <span className="text-lg font-black text-slate-800">{feeCategories.length} Groupings</span>
              </div>
            </div>
          </div>

          {/* Double-Pane Bento Panel: Categories on Left, Fee Heads Listing on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT WORKSPACE PANEL: LEDGER CATEGORIES */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Lucide.Tag className="w-3.5 h-3.5 text-indigo-600" />
                    Ledger Groupings
                  </h4>
                  <p className="text-[10px] text-slate-500">Categorize school fee items</p>
                </div>
                <button
                  onClick={openCreateCategory}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  title="Add Category"
                >
                  <Lucide.Plus className="w-3 h-3" />
                  Add Group
                </button>
              </div>

              {feeLoading && feeCategories.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-indigo-600 mx-auto mb-2" />
                  Loading groupings...
                </div>
              ) : feeCategories.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-[11px] leading-relaxed">
                  No groups registered. Categories isolate and track fee heads in account books.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {feeCategories.map(cat => (
                    <div 
                      key={cat.id} 
                      className="group bg-slate-50 border border-slate-150/60 hover:border-slate-300 rounded-xl p-3 flex justify-between items-start transition-all"
                    >
                      <div className="space-y-1">
                        <span className="block text-xs font-bold text-slate-800 group-hover:text-slate-900">{cat.name}</span>
                        <p className="text-[10px] text-slate-400 leading-tight pr-4">{cat.description || 'No custom details added.'}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-all shrink-0">
                        <button
                          onClick={() => openEditCategory(cat)}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Lucide.Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Lucide.Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT WORKSPACE PANEL: INDIVIDUAL FEE HEADS BLUEPRINTS */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              
              {/* Controls bar: Search, filters and Create trigger */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Lucide.Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Reusable Fee Headers
                  </h4>
                  <p className="text-[10px] text-slate-500">Configure base templates for student bills</p>
                </div>
                <button
                  onClick={openCreateFeeHead}
                  disabled={feeCategories.length === 0}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    feeCategories.length === 0 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title={feeCategories.length === 0 ? 'Register at least one Ledger Grouping first!' : 'Register new billing template'}
                >
                  <Lucide.Plus className="w-3.5 h-3.5" />
                  Create Fee Head
                </button>
              </div>

              {/* Filtering Controls Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                {/* Search query */}
                <div className="sm:col-span-2 relative">
                  <Lucide.Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Code, Name, Details..."
                    value={feeSearchQuery}
                    onChange={(e) => setFeeSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Filter Category */}
                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] outline-none font-semibold text-slate-700"
                  >
                    <option value="All">All Categories</option>
                    {feeCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Section */}
                <div>
                  <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] outline-none font-semibold text-slate-700"
                  >
                    <option value="All">All Sections</option>
                    <option value="Nursery">Nursery Only</option>
                    <option value="Primary">Primary Only</option>
                    <option value="Secondary">Secondary Only</option>
                  </select>
                </div>

                {/* Filter Scope Branch / Compulsory status */}
                <div>
                  <select
                    value={filterMandatory}
                    onChange={(e) => setFilterMandatory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] outline-none font-semibold text-slate-700"
                  >
                    <option value="All">Compulsion</option>
                    <option value="Mandatory">Mandatory</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              {feeLoading && feeHeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
                  <p className="text-xs font-bold">Loading school billing heads...</p>
                </div>
              ) : feeHeads.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                  <Lucide.Layers className="w-12 h-12 mx-auto text-slate-350 mb-3 animate-pulse" />
                  <p className="text-xs font-extrabold text-slate-800">No Reusable Fee Heads Blueprint Registered</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">Create standard fee blueprints like Tuition, Books, Stationery, and Sports levies to easily generate student bills.</p>
                </div>
              ) : filteredFeeHeads.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <Lucide.Search className="w-8 h-8 mx-auto text-slate-350 mb-2" />
                  <p className="text-xs font-bold text-slate-800">No Matching Fee Blueprints Found</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Refine your search tags or clear selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-150">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150">
                        <th className="p-3 pl-4">Order</th>
                        <th className="p-3">Fee Code &amp; Name</th>
                        <th className="p-3">Category Group</th>
                        <th className="p-3">Section Target</th>
                        <th className="p-3">Branch Restrictions</th>
                        <th className="p-3">Invoicing Guideline</th>
                        <th className="p-3 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                      {filteredFeeHeads.map((head) => (
                        <tr key={head.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 pl-4 font-mono font-bold text-slate-400">
                            {head.displayOrder}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10.5px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded leading-none shrink-0 uppercase">
                                  {head.code}
                                </span>
                                <span className="font-extrabold text-slate-800 truncate max-w-[120px]">{head.name}</span>
                              </div>
                              {head.description && (
                                <span className="text-[9.5px] text-slate-450 mt-1 truncate max-w-[200px]" title={head.description}>
                                  {head.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {categoryMap[head.categoryId] || (
                              <span className="text-rose-500 font-bold italic">Unlinked Category</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 font-bold text-[9px] px-2 py-0.5 rounded-full ${
                              head.section === 'All' 
                                ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                                : head.section === 'Nursery'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200/50'
                                : head.section === 'Primary'
                                ? 'bg-blue-50 text-blue-750 border border-blue-200/50'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            }`}>
                              {head.section}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`font-bold text-[9px] px-2 py-0.5 rounded-full ${
                              head.branchId === 'All'
                                ? 'bg-slate-100 text-slate-650'
                                : head.branchId === 'GN'
                                ? 'bg-indigo-50 text-indigo-750 font-black border border-indigo-200/40'
                                : 'bg-amber-50 text-amber-700 font-black border border-amber-200/40'
                            }`}>
                              {head.branchId === 'All' 
                                ? 'All Branches' 
                                : head.branchId === 'GN' 
                                ? 'Gawun Nama (GN)' 
                                : 'Runjin Sambo (RS)'}
                            </span>
                          </td>
                          <td className="p-3 space-y-1">
                            <div className="flex items-center gap-1.5">
                              {head.isMandatory ? (
                                <span className="bg-rose-50 border border-rose-150 text-rose-700 text-[8.5px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                  Mandatory
                                </span>
                              ) : (
                                <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md uppercase">
                                  Optional
                                </span>
                              )}

                              {head.isActive ? (
                                <span className="bg-emerald-500 text-white text-[7.5px] font-black px-1 py-0.5 rounded uppercase">
                                  Active
                                </span>
                              ) : (
                                <span className="bg-slate-400 text-white text-[7.5px] font-black px-1 py-0.5 rounded uppercase">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditFeeHead(head)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                                title="Edit Fee Configuration"
                              >
                                <Lucide.Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFeeHead(head)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Fee Head Blueprint"
                              >
                                <Lucide.Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      </div>

      {/* --- FORM MODALS --- */}

      {/* 1. CYCLE CONFIGURATION CREATE/EDIT MODAL (PHASE 1) */}
      <AnimatePresence>
        {isModalOpen && activeSection === 'general' && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Lucide.Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editingSetting ? 'Edit Fiscal Configuration' : 'Register New Fiscal Year'}
                    </h3>
                    <p className="text-[10px] text-slate-400">Configure global parameters for billing cycles</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-150 text-rose-850 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                    <Lucide.AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-850 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Lucide.Check className="w-4 h-4 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Financial Year / Fiscal Cycle *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026/2027 or 2026-27"
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Format: YYYY/YYYY (must be unique per cycle).</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Currency Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NGN, USD, GBP"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Currency Symbol *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ₦, $, £"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Receipt Prefix</label>
                    <input
                      type="text"
                      placeholder="e.g. REC-26-"
                      value={receiptPrefix}
                      onChange={(e) => setReceiptPrefix(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="autoReceiptNumber"
                      checked={autoReceiptNumber}
                      onChange={(e) => setAutoReceiptNumber(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="autoReceiptNumber" className="text-xs text-slate-600 font-medium cursor-pointer">
                      Auto Receipt Serial
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Due Duration (Days)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={defaultDueDays}
                      onChange={(e) => setDefaultDueDays(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grace Period (Days)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={defaultGracePeriod}
                      onChange={(e) => setDefaultGracePeriod(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Min Threshold (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={defaultPaymentThreshold}
                      onChange={(e) => setDefaultPaymentThreshold(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Default Invoicing Footer Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Thank you for your payment. For fee inquiries, please visit our Accounts Unit."
                    value={defaultReceiptFooter}
                    onChange={(e) => setDefaultReceiptFooter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all font-sans"
                  />
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-3.5 border border-slate-100 rounded-2xl">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="cursor-pointer select-none">
                    <label htmlFor="isDefault" className="text-xs text-slate-800 font-bold block cursor-pointer">
                      Activate as Default Config
                    </label>
                    <span className="text-[9px] text-slate-400 block">Sets this setup as SAMS's primary active parameters. Previous defaults are deactivated automatically.</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingSetting ? 'Save Changes' : 'Register Configuration'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. LEDGER CATEGORIES CREATE/EDIT MODAL */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-md w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Lucide.Tag className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editingCategory ? 'Edit Ledger Grouping' : 'Register New Ledger Grouping'}
                    </h3>
                    <p className="text-[10px] text-slate-400">Classify billing items within account logs</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                {categoryFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-150 text-rose-850 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Lucide.AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{categoryFormError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Group Title / Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Academic Fees, Levies, Sports"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Must be unique (e.g. Tuition Fees vs Extracurricular).</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Explanatory Description</label>
                  <textarea
                    rows={2}
                    placeholder="Provide description details for this grouping class..."
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all font-sans"
                  />
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingCategory ? 'Save Changes' : 'Register Group'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. FEE HEADS TEMPLATE CREATE/EDIT MODAL */}
      <AnimatePresence>
        {isFeeHeadModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-in"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Lucide.Layers className="w-4 h-4 animate-bounce-slow" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editingFeeHead ? 'Edit Fee Head Blueprint' : 'Configure Reusable Fee Head'}
                    </h3>
                    <p className="text-[10px] text-slate-400">Establish reusable system billing blueprints</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFeeHeadModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFeeHeadSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {feeHeadFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-150 text-rose-850 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Lucide.AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{feeHeadFormError}</span>
                  </div>
                )}

                {/* Unique Code & Simple Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fee Head Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TUIT-PRI, BKS-ALL, ICT"
                      value={feeHeadCode}
                      onChange={(e) => setFeeHeadCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all uppercase"
                    />
                    <span className="text-[8.5px] text-slate-400 mt-0.5 block">Unique. No spacing (e.g. DEV-LVY).</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fee Head Name / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tuition, Books, Medical"
                      value={feeHeadName}
                      onChange={(e) => setFeeHeadName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                    <span className="text-[8.5px] text-slate-400 mt-0.5 block">e.g. Development Levy, Stationery.</span>
                  </div>
                </div>

                {/* Parent Ledger Category Class */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ledger Category Mapping *</label>
                  <select
                    required
                    value={feeHeadCategoryId}
                    onChange={(e) => setFeeHeadCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  >
                    <option value="" disabled>-- Select Ledger Group --</option>
                    {feeCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Scope Selection: Academic Section Target & SAMS Branch scope */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Academic Section *</label>
                    <select
                      value={feeHeadSection}
                      onChange={(e) => setFeeHeadSection(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="All">All Sections Scope</option>
                      <option value="Nursery">Nursery Section Only</option>
                      <option value="Primary">Primary Section Only</option>
                      <option value="Secondary">Secondary Section Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Branch Restrictions *</label>
                    <select
                      value={feeHeadBranchId}
                      onChange={(e) => setFeeHeadBranchId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="All">All SAMS Branches</option>
                      <option value="GN">Gawun Nama (GN)</option>
                      <option value="RS">Runjin Sambo (RS)</option>
                    </select>
                  </div>
                </div>

                {/* Display Order Position */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Display Order (Sequence Position) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={feeHeadDisplayOrder}
                    onChange={(e) => setFeeHeadDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-semibold focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                  <span className="text-[8.5px] text-slate-400 mt-0.5 block">Controls sequence position when rendering reports or receipt printouts.</span>
                </div>

                {/* Explanatory Billing Details */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Invoicing Remarks / Item Details</label>
                  <textarea
                    rows={2}
                    placeholder="Optional billing details that print directly under invoice line items..."
                    value={feeHeadDescription}
                    onChange={(e) => setFeeHeadDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all font-sans"
                  />
                </div>

                {/* Toggles: Mandatory Check & Active Billing Check */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2.5 bg-slate-50 p-3 border border-slate-150 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      id="feeHeadIsMandatory"
                      checked={feeHeadIsMandatory}
                      onChange={(e) => setFeeHeadIsMandatory(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="cursor-pointer select-none">
                      <label htmlFor="feeHeadIsMandatory" className="text-xs text-slate-800 font-bold block cursor-pointer">
                        Is Compulsory Fee
                      </label>
                      <span className="text-[8.5px] text-slate-400 block">Enforces auto-billing for all.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-slate-50 p-3 border border-slate-150 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      id="feeHeadIsActive"
                      checked={feeHeadIsActive}
                      onChange={(e) => setFeeHeadIsActive(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="cursor-pointer select-none">
                      <label htmlFor="feeHeadIsActive" className="text-xs text-slate-800 font-bold block cursor-pointer">
                        Mark as Active
                      </label>
                      <span className="text-[8.5px] text-slate-400 block">Available in invoicing templates.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFeeHeadModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingFeeHead ? 'Save Changes' : 'Register Fee Head'}
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
