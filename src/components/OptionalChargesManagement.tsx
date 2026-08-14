import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Lucide from 'lucide-react';
import Toast from './Toast';

interface OptionalChargeCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

interface OptionalCharge {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  amount: number;
  quantity: number;
  separateReceipt: boolean;
  independentTracking: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function OptionalChargesManagement() {
  // Database States
  const [categories, setCategories] = useState<OptionalChargeCategory[]>([]);
  const [charges, setCharges] = useState<OptionalCharge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Category Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<OptionalChargeCategory | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryDescription, setCategoryDescription] = useState<string>('');
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);

  // Optional Charge Modal States
  const [isChargeModalOpen, setIsChargeModalOpen] = useState<boolean>(false);
  const [editingCharge, setEditingCharge] = useState<OptionalCharge | null>(null);
  const [chargeName, setChargeName] = useState<string>('');
  const [chargeDescription, setChargeDescription] = useState<string>('');
  const [chargeCategoryId, setChargeCategoryId] = useState<string>('');
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [chargeQuantity, setChargeQuantity] = useState<string>('1');
  const [chargeSeparateReceipt, setChargeSeparateReceipt] = useState<boolean>(false);
  const [chargeIndependentTracking, setChargeIndependentTracking] = useState<boolean>(false);
  const [chargeIsActive, setChargeIsActive] = useState<boolean>(true);
  const [chargeFormError, setChargeFormError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterReceipt, setFilterReceipt] = useState<string>('All');
  const [filterTracking, setFilterTracking] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Fetch Category & Charges Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catsRes, chargesRes] = await Promise.all([
        fetch('/api/optional_charge_categories'),
        fetch('/api/optional_charges')
      ]);

      if (!catsRes.ok || !chargesRes.ok) {
        throw new Error('Failed to load optional charge configurations.');
      }

      const catsData = await catsRes.json();
      const chargesData = await chargesRes.json();

      setCategories(catsData);
      setCharges(chargesData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while retrieving optional charge ledger details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category Actions
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setCategoryFormError(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: OptionalChargeCategory) => {
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

    const duplicate = categories.some(
      c => (!editingCategory || c.id !== editingCategory.id) &&
      c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );

    if (duplicate) {
      setCategoryFormError(`A category named "${categoryName}" already exists.`);
      return;
    }

    try {
      const payload = {
        name: categoryName.trim(),
        description: categoryDescription.trim()
      };

      const url = editingCategory 
        ? `/api/optional_charge_categories/${editingCategory.id}` 
        : '/api/optional_charge_categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server validation failed.');
      }

      await fetchData();
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      setCategoryFormError(err.message || 'Error saving optional charge category.');
    }
  };

  const handleDeleteCategory = async (cat: OptionalChargeCategory) => {
    const linkedCharges = charges.filter(c => c.categoryId === cat.id);
    if (linkedCharges.length > 0) {
      setToast({
        message: `❌ Cannot Delete Category: The category "${cat.name}" is currently in use by ${linkedCharges.length} optional charge(s) (e.g. ${linkedCharges[0].name}). Please reassign or delete these optional charges first.`,
        type: 'warning'
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete the optional charge category "${cat.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/optional_charge_categories/${cat.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete category.');
      }

      await fetchData();
      setToast({
        message: `Successfully deleted optional charge category "${cat.name}".`,
        type: 'success'
      });
    } catch (err: any) {
      setToast({
        message: err.message || 'Error removing category.',
        type: 'error'
      });
    }
  };

  // Optional Charge Actions
  const openCreateCharge = () => {
    setEditingCharge(null);
    setChargeName('');
    setChargeDescription('');
    setChargeCategoryId(categories[0]?.id || '');
    setChargeAmount('');
    setChargeQuantity('1');
    setChargeSeparateReceipt(false);
    setChargeIndependentTracking(false);
    setChargeIsActive(true);
    setChargeFormError(null);
    setIsChargeModalOpen(true);
  };

  const openEditCharge = (charge: OptionalCharge) => {
    setEditingCharge(charge);
    setChargeName(charge.name);
    setChargeDescription(charge.description);
    setChargeCategoryId(charge.categoryId);
    setChargeAmount(charge.amount.toString());
    setChargeQuantity(charge.quantity.toString());
    setChargeSeparateReceipt(charge.separateReceipt);
    setChargeIndependentTracking(charge.independentTracking);
    setChargeIsActive(charge.isActive);
    setChargeFormError(null);
    setIsChargeModalOpen(true);
  };

  const handleChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargeFormError(null);

    if (!chargeName.trim()) {
      setChargeFormError('Optional Charge Name is required.');
      return;
    }

    if (!chargeCategoryId) {
      setChargeFormError('Please select a valid parent category.');
      return;
    }

    const amt = parseFloat(chargeAmount);
    if (isNaN(amt) || amt < 0) {
      setChargeFormError('Amount must be a non-negative number.');
      return;
    }

    const qty = parseInt(chargeQuantity);
    if (isNaN(qty) || qty <= 0) {
      setChargeFormError('Quantity must be a positive integer.');
      return;
    }

    const duplicate = charges.some(
      c => (!editingCharge || c.id !== editingCharge.id) &&
      c.name.trim().toLowerCase() === chargeName.trim().toLowerCase()
    );

    if (duplicate) {
      setChargeFormError(`An Optional Charge with Name "${chargeName}" already exists.`);
      return;
    }

    try {
      const payload = {
        name: chargeName.trim(),
        description: chargeDescription.trim(),
        categoryId: chargeCategoryId,
        amount: amt,
        quantity: qty,
        separateReceipt: chargeSeparateReceipt,
        independentTracking: chargeIndependentTracking,
        isActive: chargeIsActive
      };

      const url = editingCharge 
        ? `/api/optional_charges/${editingCharge.id}` 
        : '/api/optional_charges';
      const method = editingCharge ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server validation failed.');
      }

      await fetchData();
      setIsChargeModalOpen(false);
    } catch (err: any) {
      setChargeFormError(err.message || 'Error saving Optional Charge.');
    }
  };

  const handleDeleteCharge = async (charge: OptionalCharge) => {
    if (!confirm(`Are you sure you want to permanently delete the optional billing item "${charge.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/optional_charges/${charge.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete Optional Charge.');
      }

      await fetchData();
      setToast({
        message: `Successfully deleted optional billing item "${charge.name}".`,
        type: 'success'
      });
    } catch (err: any) {
      setToast({
        message: err.message || 'Error discarding Optional Charge.',
        type: 'error'
      });
    }
  };

  // Helper mapping categoryId -> Category Name
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Filter & Search Optional Charges
  const filteredCharges = useMemo(() => {
    return charges.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = filterCategory === 'All' || c.categoryId === filterCategory;

      const matchesReceipt = 
        filterReceipt === 'All' || 
        (filterReceipt === 'Separate' && c.separateReceipt) ||
        (filterReceipt === 'Combined' && !c.separateReceipt);

      const matchesTracking = 
        filterTracking === 'All' || 
        (filterTracking === 'Independent' && c.independentTracking) ||
        (filterTracking === 'Standard' && !c.independentTracking);

      const matchesStatus = 
        filterStatus === 'All' || 
        (filterStatus === 'Active' && c.isActive) ||
        (filterStatus === 'Inactive' && !c.isActive);

      return matchesSearch && matchesCategory && matchesReceipt && matchesTracking && matchesStatus;
    });
  }, [charges, searchQuery, filterCategory, filterReceipt, filterTracking, filterStatus]);

  // Formatted Currency display helper
  const formatAmount = (num: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(num);
  };

  // Metrics calculators
  const totalItemsCount = charges.length;
  const separateReceiptCount = charges.filter(c => c.separateReceipt).length;
  const independentTrackingCount = charges.filter(c => c.independentTracking).length;
  const activeCount = charges.filter(c => c.isActive).length;

  if (loading) {
    return (
      <div id="optional-charges-loader" className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-xs font-semibold">Loading SAMS Optional Charges guidelines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div id="optional-charges-error" className="bg-rose-50 border border-rose-100 rounded-xl p-5 text-center text-rose-800">
        <Lucide.ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <p className="text-xs font-bold">{error}</p>
        <button onClick={fetchData} className="mt-3 text-xs text-indigo-600 font-bold underline">Try Reloading</button>
      </div>
    );
  }

  return (
    <div id="optional-charges-workspace" className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Lucide.LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Items</span>
            <span className="text-lg font-black text-slate-800">{totalItemsCount} Registered</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <Lucide.Receipt className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Separate Receipts</span>
            <span className="text-lg font-black text-slate-800">{separateReceiptCount} Segregated</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Lucide.Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Independent Tracking</span>
            <span className="text-lg font-black text-slate-800">{independentTrackingCount} Tracked</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Lucide.CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Options</span>
            <span className="text-lg font-black text-slate-800">{activeCount} Operational</span>
          </div>
        </div>
      </div>

      {/* Bento Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Categories Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Lucide.Tag className="w-3.5 h-3.5 text-amber-500" />
                Optional Categories
              </h4>
              <p className="text-[10px] text-slate-500">Group optional student fees</p>
            </div>
            <button
              onClick={openCreateCategory}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-amber-600 hover:text-amber-700 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
            >
              <Lucide.Plus className="w-3 h-3" />
              Add Group
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-[11px] leading-relaxed">
              No groupings found. Create categories to map uniforms, books, forms, or services.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className="group bg-slate-50 border border-slate-150/60 hover:border-slate-300 rounded-xl p-3 flex justify-between items-start transition-all"
                >
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-slate-800 group-hover:text-slate-900">{cat.name}</span>
                    <p className="text-[10px] text-slate-400 leading-tight pr-4">{cat.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-all shrink-0">
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="p-1 text-slate-500 hover:text-amber-600 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <Lucide.Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    >
                      <Lucide.Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Optional Charges Main Workspace */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Lucide.Coins className="w-4 h-4 text-emerald-500" />
                Optional Charge Blueprints
              </h4>
              <p className="text-[11px] text-slate-500">Configure separate, optional micro-billing items & quantities.</p>
            </div>
            <button
              onClick={openCreateCharge}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lucide.Plus className="w-4 h-4" />
              Register Optional Charge
            </button>
          </div>

          {/* Filtration Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <div className="relative md:col-span-2">
              <Lucide.Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-medium text-slate-700 placeholder-slate-400 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterReceipt}
                onChange={(e) => setFilterReceipt(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="All">All Receipts</option>
                <option value="Separate">Separate Receipt</option>
                <option value="Combined">Combined Receipt</option>
              </select>
            </div>

            <div>
              <select
                value={filterTracking}
                onChange={(e) => setFilterTracking(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="All">All Tracking</option>
                <option value="Independent">Independent Tracking</option>
                <option value="Standard">Standard Ledger</option>
              </select>
            </div>
          </div>

          {/* Charges Grid List */}
          {filteredCharges.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Lucide.ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
              <p className="text-xs font-bold">No optional charges match the criteria.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click "Register Optional Charge" to establish items like uniforms, bags, forms, or Islamia fees.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCharges.map(charge => (
                <div 
                  key={charge.id} 
                  className={`border rounded-2xl p-4 transition-all hover:shadow-sm ${
                    charge.isActive ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200/50 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-black uppercase tracking-wide">
                          {categoryMap[charge.categoryId] || 'Unassigned Group'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">{charge.name}</h4>
                        {!charge.isActive && (
                          <span className="bg-rose-50 text-rose-600 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">{charge.description || 'No detailed specifications entered.'}</p>
                      
                      {/* Badge features */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-1.5 text-[10px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200/50">
                          <Lucide.CheckSquare className="w-3 h-3" />
                          Quantity: {charge.quantity}
                        </div>
                        {charge.separateReceipt ? (
                          <div className="flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg border border-teal-200/50" title="Generates a distinct physical receipt invoice for audits">
                            <Lucide.FileText className="w-3 h-3" />
                            Separate Receipt
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-200/50">
                            Combined Receipt
                          </div>
                        )}
                        {charge.independentTracking ? (
                          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-200/50" title="Maintains isolated accounting balances & payment logs">
                            <Lucide.TrendingUp className="w-3 h-3" />
                            Independent Payment Tracking
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-200/50">
                            Standard Tracking
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-between items-end gap-3 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Base Amount</span>
                        <span className="text-base font-black text-slate-900">{formatAmount(charge.amount)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditCharge(charge)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="Edit blueprint details"
                        >
                          <Lucide.Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCharge(charge)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Permanently remove blueprint"
                        >
                          <Lucide.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {/* Category Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Lucide.Tag className="w-4 h-4 text-amber-500" />
                  {editingCategory ? 'Update Grouping' : 'Register Optional Category'}
                </h4>
                <button 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-4">
                {categoryFormError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-bold flex items-center gap-2">
                    <Lucide.AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{categoryFormError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Admission Form & Kit"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-amber-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Explanatory Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description mapping what optional costs are tracked under this container..."
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-700 focus:border-amber-500 focus:bg-white outline-none transition-all font-sans"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingCategory ? 'Save Changes' : 'Create Group'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Optional Charge Modal */}
        {isChargeModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Lucide.PlusCircle className="w-4 h-4 text-emerald-500" />
                  {editingCharge ? 'Modify Optional Charge' : 'Configure Optional Charge'}
                </h4>
                <button 
                  onClick={() => setIsChargeModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChargeSubmit} className="space-y-4">
                {chargeFormError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 font-bold flex items-center gap-2">
                    <Lucide.AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{chargeFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Optional Charge Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Admission Form"
                      value={chargeName}
                      onChange={(e) => setChargeName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parent Category *</label>
                    <select
                      required
                      value={chargeCategoryId}
                      onChange={(e) => setChargeCategoryId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="">Select Category Group</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Base Cost Amount (NGN) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="e.g. 5000"
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Default Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="1"
                      value={chargeQuantity}
                      onChange={(e) => setChargeQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Description / Billing Information</label>
                  <textarea
                    rows={2}
                    placeholder="Specific remarks about size, delivery timeframe, separate auditing terms, or instructions..."
                    value={chargeDescription}
                    onChange={(e) => setChargeDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all font-sans"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-2.5 bg-slate-50 p-3 border border-slate-150 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      id="chargeSeparateReceipt"
                      checked={chargeSeparateReceipt}
                      onChange={(e) => setChargeSeparateReceipt(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="cursor-pointer select-none">
                      <label htmlFor="chargeSeparateReceipt" className="text-xs text-slate-800 font-bold block cursor-pointer">
                        Issue Separate Receipt
                      </label>
                      <span className="text-[8.5px] text-slate-400 block">Generates distinct receipts and invoice logs separate from consolidated term fees.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-slate-50 p-3 border border-slate-150 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      id="chargeIndependentTracking"
                      checked={chargeIndependentTracking}
                      onChange={(e) => setChargeIndependentTracking(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="cursor-pointer select-none">
                      <label htmlFor="chargeIndependentTracking" className="text-xs text-slate-800 font-bold block cursor-pointer">
                        Independent Payment Tracking
                      </label>
                      <span className="text-[8.5px] text-slate-400 block">Enables independent balance auditing, partial payments, and standalone tracking logs.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-slate-50 p-3 border border-slate-150 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      id="chargeIsActive"
                      checked={chargeIsActive}
                      onChange={(e) => setChargeIsActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="cursor-pointer select-none">
                      <label htmlFor="chargeIsActive" className="text-xs text-slate-800 font-bold block cursor-pointer">
                        Mark as Active
                      </label>
                      <span className="text-[8.5px] text-slate-400 block">Available in optional micro-billing assignments.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChargeModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingCharge ? 'Save Changes' : 'Register Optional Item'}
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
