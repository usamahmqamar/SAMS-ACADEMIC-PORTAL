import React, { useState, useEffect } from 'react';
import { StoreInventoryItem, UnitOfMeasurement, ItemSetting, ItemCategory, ItemStatus } from '../../types/inventory';
import { X, Package, Tag, Layers, Building, DollarSign, AlertCircle } from 'lucide-react';

interface ItemFormModalProps {
  isOpen: boolean;
  itemToEdit: StoreInventoryItem | null;
  onClose: () => void;
  onSave: (itemData: Partial<StoreInventoryItem>) => Promise<void>;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  itemToEdit,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Uniforms');
  const [branch, setBranch] = useState('Main Campus');
  const [store, setStore] = useState('Uniform Depot');
  const [unit, setUnit] = useState<UnitOfMeasurement>('Meter');
  const [sellingPrice, setSellingPrice] = useState<number | string>(2500);
  const [costPrice, setCostPrice] = useState<number | string>(1700);
  const [currentStock, setCurrentStock] = useState<number | string>(100);
  const [minimumStockLevel, setMinimumStockLevel] = useState<number | string>(20);
  const [status, setStatus] = useState<ItemStatus>('Active');
  const [setting, setSetting] = useState<ItemSetting>('Sell to Parent');
  const [location, setLocation] = useState('Uniform Depot');
  const [bin, setBin] = useState('Rack B-01');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setItemCode(itemToEdit.itemCode || '');
      setCategory((itemToEdit.category as ItemCategory) || 'Uniforms');
      setBranch(itemToEdit.branch || 'Main Campus');
      setStore(itemToEdit.store || 'Uniform Depot');
      setUnit(itemToEdit.unit || 'Piece');
      setSellingPrice(itemToEdit.sellingPrice ?? 0);
      setCostPrice(itemToEdit.costPrice ?? 0);
      setCurrentStock(itemToEdit.currentStock ?? 0);
      setMinimumStockLevel(itemToEdit.minimumStockLevel ?? 10);
      setStatus(itemToEdit.status || 'Active');
      setSetting(itemToEdit.setting || 'Both');
      setLocation(itemToEdit.location || 'Uniform Depot');
      setBin(itemToEdit.bin || 'Rack B-01');
    } else {
      // Default new item template
      setName('');
      setItemCode(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory('Uniforms');
      setBranch('Main Campus');
      setStore('Uniform Depot');
      setUnit('Meter');
      setSellingPrice(2500);
      setCostPrice(1700);
      setCurrentStock(100);
      setMinimumStockLevel(20);
      setStatus('Active');
      setSetting('Sell to Parent');
      setLocation('Uniform Depot');
      setBin('Rack B-01 (Fabric Rolls)');
    }
    setErrorMsg('');
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a valid Item Name.');
      return;
    }
    if (!itemCode.trim()) {
      setErrorMsg('Please specify an Item Code (SKU).');
      return;
    }

    const sPrice = Number(sellingPrice) || 0;
    const cPrice = Number(costPrice) || 0;
    const stockVal = Number(currentStock) || 0;
    const minVal = Number(minimumStockLevel) || 0;

    if (setting !== 'School Issue Only' && sPrice <= 0) {
      setErrorMsg('Selling price must be greater than ₦0 for sellable items.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSave({
        name: name.trim(),
        itemCode: itemCode.trim().toUpperCase(),
        category,
        branch,
        store,
        unit,
        sellingPrice: sPrice,
        costPrice: cPrice,
        currentStock: stockVal,
        minimumStockLevel: minVal,
        status,
        setting,
        location: location || store,
        bin
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save inventory item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="item-form-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                {itemToEdit ? 'Edit Inventory Item' : 'Register New Inventory / Sellable Item'}
              </h3>
              <p className="text-xs text-slate-400">
                Define sellable settings, unit of measurement, pricing, and stock quotas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs font-sans">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ITEM NAME & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Uniform Material - Navy Blue (Terylene Wool)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Item Code (SKU) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MAT-MET-01"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-indigo-600 focus:bg-white focus:border-indigo-500 outline-none uppercase"
              />
            </div>
          </div>

          {/* CRITICAL SETTING: ISSUE MODE */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
            <label className="block text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider">
              Inventory Setting / Issue Policy <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  setting === 'Sell to Parent'
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="itemSetting"
                  value="Sell to Parent"
                  checked={setting === 'Sell to Parent'}
                  onChange={() => setSetting('Sell to Parent')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-xs">Sell to Parent</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Direct store retail sales to parents/students only</div>
                </div>
              </label>

              <label
                className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  setting === 'Both'
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="itemSetting"
                  value="Both"
                  checked={setting === 'Both'}
                  onChange={() => setSetting('Both')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-xs">Both</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Sold to parents &amp; available for school internal issue</div>
                </div>
              </label>

              <label
                className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  setting === 'School Issue Only'
                    ? 'bg-slate-200/80 border-slate-400 ring-2 ring-slate-400/20 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="itemSetting"
                  value="School Issue Only"
                  checked={setting === 'School Issue Only'}
                  onChange={() => setSetting('School Issue Only')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-xs">School Issue Only</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Internal school use only (not sold at store)</div>
                </div>
              </label>
            </div>
          </div>

          {/* CATEGORY, BRANCH, STORE, UNIT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="Uniforms">Uniforms</option>
                <option value="Stationery">Stationery</option>
                <option value="Textbooks">Textbooks</option>
                <option value="Sports">Sports</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Academic">Academic</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="Main Campus">Main Campus</option>
                <option value="Ikeja Branch">Ikeja Branch</option>
                <option value="Victoria Island Branch">Victoria Island Branch</option>
                <option value="All Branches">All Branches</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Store / Depot
              </label>
              <select
                value={store}
                onChange={(e) => {
                  setStore(e.target.value);
                  setLocation(e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="Uniform Depot">Uniform Depot</option>
                <option value="Main Storeroom">Main Storeroom</option>
                <option value="Bookstore">Bookstore</option>
                <option value="Sports Store">Sports Store</option>
                <option value="Science Lab Storage">Science Lab Storage</option>
                <option value="Staff Room Supplies">Staff Room Supplies</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Unit of Measurement <span className="text-rose-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitOfMeasurement)}
                className="w-full bg-indigo-50/60 border border-indigo-200 rounded-xl p-2.5 text-xs text-indigo-900 font-bold focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="Piece">Piece (pc)</option>
                <option value="Meter">Meter (m)</option>
                <option value="Yard">Yard (yd)</option>
                <option value="Pair">Pair (pr)</option>
                <option value="Set">Set</option>
                <option value="Pack">Pack (pk)</option>
              </select>
            </div>
          </div>

          {/* PRICING & STOCK CONTROLS */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Selling Price (₦ per {unit})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-mono">₦</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={setting === 'School Issue Only'}
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-7 pr-3 text-xs font-mono font-bold text-slate-900 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[9px] text-slate-400">Rate charged to parents</p>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Cost Price (₦ per {unit})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-mono">₦</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-7 pr-3 text-xs font-mono font-bold text-slate-700 focus:border-indigo-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[9px] text-slate-400">Procurement unit cost</p>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Current Stock ({unit}s)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono font-black text-indigo-700 focus:border-indigo-500 outline-none"
                placeholder="e.g. 145.5"
              />
              <p className="text-[9px] text-slate-400">Supports decimals (e.g. 2.5m)</p>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Min Stock Threshold
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minimumStockLevel}
                onChange={(e) => setMinimumStockLevel(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono font-bold text-slate-800 focus:border-indigo-500 outline-none"
                placeholder="10"
              />
              <p className="text-[9px] text-slate-400">Low stock alert trigger</p>
            </div>
          </div>

          {/* STATUS & STORAGE BIN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Item Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="Active">Active (Available for transactions)</option>
                <option value="Inactive">Inactive (Archived / Disabled)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Storage Location Area
              </label>
              <input
                type="text"
                placeholder="e.g. Uniform Depot"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Bin / Shelf Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Rack B-01 (Fabric Rolls)"
                value={bin}
                onChange={(e) => setBin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* EXAMPLE PREVIEW BOX */}
          {setting !== 'School Issue Only' && (
            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
              <div>
                <span className="font-bold">Store Sales Preview:</span> If a parent purchases{' '}
                <span className="font-bold">2.5 {unit}s</span> at{' '}
                <span className="font-bold">₦{Number(sellingPrice).toLocaleString()}</span> per {unit}, total will be{' '}
                <span className="font-bold font-mono text-emerald-700">
                  ₦{(2.5 * (Number(sellingPrice) || 0)).toLocaleString()}
                </span>
                . Stock will decrease by 2.5 {unit}s.
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Saving Item...' : itemToEdit ? 'Save Changes' : 'Register Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
