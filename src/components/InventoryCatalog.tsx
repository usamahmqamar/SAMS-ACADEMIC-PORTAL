import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, SlidersHorizontal, AlertTriangle, ArrowUpRight, CheckCircle, RotateCcw, Building, Truck, ShieldCheck, ClipboardCheck, X } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Textbooks' | 'Lab Equipment' | 'Stationery' | 'Uniforms' | 'General';
  stock: number;
  minThreshold: number;
  value: number;
  location: string;
  bin: string;
}

interface Supplier {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'Preferred' | 'Active' | 'Under Review';
}

interface CargoShipment {
  id: string;
  cargoRef: string;
  supplierName: string;
  itemName: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  status: 'Pending Verification' | 'Verified & Committed';
  dateArrived: string;
  physicalCheck: boolean;
  skuMatchCheck: boolean;
  countCheck: boolean;
}

export const InventoryCatalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'bins' | 'suppliers' | 'cargo'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // LIVE CORE INVENTORY STATE
  const [items, setItems] = useState<InventoryItem[]>([
    { id: '1', sku: 'SAMS-B-101', name: 'Grade 10 Mathematics Standard Textbook', category: 'Textbooks', stock: 120, minThreshold: 30, value: 4500, location: 'Main Storeroom', bin: 'Room A, Bin #12' },
    { id: '2', sku: 'SAMS-L-203', name: 'Introductory Chemistry Kit (Lab Set)', category: 'Lab Equipment', stock: 12, minThreshold: 15, value: 18500, location: 'Science Lab Storage', bin: 'Science Lab, Locker #03' },
    { id: '3', sku: 'SAMS-S-341', name: 'SAMS Custom Embossed Notebook (Pack of 50)', category: 'Stationery', stock: 45, minThreshold: 20, value: 3200, location: 'Main Storeroom', bin: 'Central Storeroom, Box #44' },
    { id: '4', sku: 'SAMS-U-012', name: 'Secondary School Blazer (Navy, Medium)', category: 'Uniforms', stock: 8, minThreshold: 10, value: 12000, location: 'Uniform Depot', bin: 'Uniform Locker #02' },
    { id: '5', sku: 'SAMS-B-105', name: 'Advanced Physics Reference Manual', category: 'Textbooks', stock: 85, minThreshold: 20, value: 6800, location: 'Main Storeroom', bin: 'Room A, Bin #14' },
    { id: '6', sku: 'SAMS-G-501', name: 'A-Grade Erasable Whiteboard Markers (Dozen)', category: 'General', stock: 60, minThreshold: 15, value: 1100, location: 'Staff Room Supplies', bin: 'Staff Room, Cabinet #B' }
  ]);

  // SUPPLIERS STATE
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: 'sup-1', name: 'Sokoto Educational Printers Ltd', category: 'Textbooks', contactPerson: 'Malam Aliyu Shehu', email: 'aliyu.shehu@sokotoprinters.com', phone: '+234 803 111 2222', status: 'Preferred' },
    { id: 'sup-2', name: 'Kaduna Textile Mills', category: 'Uniforms', contactPerson: 'Alhaji Bashir Sani', email: 'b.sani@kadunatextiles.com', phone: '+234 806 333 4444', status: 'Active' },
    { id: 'sup-3', name: 'Northern Science Lab Supplies', category: 'Lab Equipment', contactPerson: 'Dr. Amina Umar', email: 'a.umar@northscience.com', phone: '+234 809 555 6666', status: 'Preferred' },
    { id: 'sup-4', name: 'Crown Stationery Wholesalers', category: 'Stationery', contactPerson: 'Mr. Jude Okafor', email: 'jude@crownstationery.ng', phone: '+234 812 777 8888', status: 'Under Review' }
  ]);

  // INCOMING CARGO VERIFICATION STATE
  const [cargoShipments, setCargoShipments] = useState<CargoShipment[]>([
    { id: 'car-1', cargoRef: 'CRG-2026-901', supplierName: 'Sokoto Educational Printers Ltd', itemName: 'Grade 10 Mathematics Standard Textbook', sku: 'SAMS-B-101', quantityOrdered: 50, quantityReceived: 50, status: 'Pending Verification', dateArrived: '2026-07-22', physicalCheck: false, skuMatchCheck: false, countCheck: false },
    { id: 'car-2', cargoRef: 'CRG-2026-902', supplierName: 'Northern Science Lab Supplies', itemName: 'Introductory Chemistry Kit (Lab Set)', sku: 'SAMS-L-203', quantityOrdered: 10, quantityReceived: 10, status: 'Pending Verification', dateArrived: '2026-07-21', physicalCheck: false, skuMatchCheck: false, countCheck: false },
    { id: 'car-3', cargoRef: 'CRG-2026-903', supplierName: 'Kaduna Textile Mills', itemName: 'Secondary School Blazer (Navy, Medium)', sku: 'SAMS-U-012', quantityOrdered: 15, quantityReceived: 15, status: 'Verified & Committed', dateArrived: '2026-07-18', physicalCheck: true, skuMatchCheck: true, countCheck: true }
  ]);

  // ADD SUPPLIER STATE
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCategory, setNewSupplierCategory] = useState('Textbooks');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  
  // ADJUSTMENT STATE
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, items]);

  const stats = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.stock, 0);
    const totalValue = items.reduce((sum, item) => sum + (item.stock * item.value), 0);
    const criticalStock = items.filter(item => item.stock < item.minThreshold).length;
    return { totalItems, totalValue, criticalStock };
  }, [items]);

  const handleAdjustStock = () => {
    if (!adjustingItem) return;
    setItems(prev => prev.map(item => {
      if (item.id === adjustingItem.id) {
        const newStock = Math.max(0, item.stock + adjustmentAmount);
        return { ...item, stock: newStock };
      }
      return item;
    }));
    setAdjustingItem(null);
    setAdjustmentAmount(0);
  };

  const handleVerifyAndCommitCargo = (shipmentId: string) => {
    const shipment = cargoShipments.find(c => c.id === shipmentId);
    if (!shipment) return;
    
    if (!shipment.physicalCheck || !shipment.skuMatchCheck || !shipment.countCheck) {
      alert("Please complete the cargo audit checklist (Physical condition, SKU matching, and physical count verification) before committing!");
      return;
    }

    // Update cargo status
    setCargoShipments(prev => prev.map(c => {
      if (c.id === shipmentId) {
        return { ...c, status: 'Verified & Committed' };
      }
      return c;
    }));

    // Add to stock ledger
    setItems(prev => prev.map(item => {
      if (item.sku === shipment.sku) {
        return { ...item, stock: item.stock + shipment.quantityReceived };
      }
      return item;
    }));
  };

  const handleAddSupplier = () => {
    if (!newSupplierName || !newSupplierContact) {
      alert("Please provide at least a Supplier Name and Contact Person!");
      return;
    }
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupplierName,
      category: newSupplierCategory,
      contactPerson: newSupplierContact,
      email: newSupplierEmail || 'supplier@email.com',
      phone: newSupplierPhone || '+234 800 000 0000',
      status: 'Active'
    };
    setSuppliers([...suppliers, newSup]);
    setIsSupplierModalOpen(false);
    // Reset Form
    setNewSupplierName('');
    setNewSupplierContact('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
  };

  // ROOM STATS FOR BINS TAB
  const storageRooms = useMemo(() => {
    const roomsMap: { [key: string]: { name: string; totalItems: number; itemsCount: number; color: string } } = {
      'Main Storeroom': { name: 'Main Storeroom', totalItems: 0, itemsCount: 0, color: 'border-indigo-200 bg-indigo-50/10 text-indigo-700' },
      'Science Lab Storage': { name: 'Science Lab Storage', totalItems: 0, itemsCount: 0, color: 'border-emerald-200 bg-emerald-50/10 text-emerald-700' },
      'Staff Room Supplies': { name: 'Staff Room Supplies', totalItems: 0, itemsCount: 0, color: 'border-amber-200 bg-amber-50/10 text-amber-700' },
      'Uniform Depot': { name: 'Uniform Depot', totalItems: 0, itemsCount: 0, color: 'border-rose-200 bg-rose-50/10 text-rose-700' }
    };

    items.forEach(item => {
      const rm = item.location;
      if (roomsMap[rm]) {
        roomsMap[rm].totalItems += item.stock;
        roomsMap[rm].itemsCount += 1;
      }
    });

    return Object.values(roomsMap);
  }, [items]);

  return (
    <div id="erp-view-inventory" className="space-y-6">
      {/* MODULE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs border border-indigo-100">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Inventory & Assets Portal</h1>
            <p className="text-xs text-slate-500 font-medium font-sans">Digital supplies ledger, textbook allotments, and supplier logs for SAMS Sokoto</p>
          </div>
        </div>
        
        {/* TAB SWITCHERS */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'ledger' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Ledger
          </button>
          <button
            onClick={() => setActiveTab('bins')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'bins' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Storage Bins
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'suppliers' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => setActiveTab('cargo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'cargo' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Incoming Cargo
            {cargoShipments.filter(c => c.status === 'Pending Verification').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* STATS BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center space-x-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stock Count</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalItems} units</p>
            <p className="text-[10px] text-indigo-600 font-semibold mt-1">Across all branches & storerooms</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center space-x-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Valuation</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">₦{stats.totalValue.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">Capital asset portfolio valuation</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${stats.criticalStock > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Alerts</p>
            <p className={`text-2xl font-black mt-0.5 ${stats.criticalStock > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{stats.criticalStock} items</p>
            <p className="text-[10px] text-slate-400 mt-1">Requires immediate supplier reorders</p>
          </div>
        </div>
      </div>

      {/* VIEW PANEL: STOCK LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* FILTER CONTROLS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter catalog by SKU or item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all animate-none"
              />
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-slate-400 text-xs font-semibold uppercase shrink-0">Category:</span>
              {['All', 'Textbooks', 'Lab Equipment', 'Stationery', 'Uniforms', 'General'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* STOCK LEDGER TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-5 py-3">SKU Code</th>
                    <th className="px-5 py-3">Item Details</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Storage Location &amp; Bin</th>
                    <th className="px-5 py-3 text-center">Unit Value</th>
                    <th className="px-5 py-3 text-center">In Stock</th>
                    <th className="px-5 py-3 text-center">Threshold</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-sans">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                        No active assets cataloged matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => {
                      const isLow = item.stock < item.minThreshold;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">{item.sku}</td>
                          <td className="px-5 py-3.5 font-extrabold text-slate-800">{item.name}</td>
                          <td className="px-5 py-3.5">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-700">{item.location}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.bin}</div>
                          </td>
                          <td className="px-5 py-3.5 text-center font-mono font-bold">₦{item.value.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-center font-bold">
                            <span className={`px-2.5 py-0.5 rounded text-xs ${
                              isLow 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100 font-black' 
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {item.stock} units
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-400 font-mono font-semibold">{item.minThreshold}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setAdjustingItem(item);
                                setAdjustmentAmount(0);
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-extrabold cursor-pointer"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PANEL: STORAGE ROOM BINS */}
      {activeTab === 'bins' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl space-y-2">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">SAMS Spatial Storage Allocations</h3>
            <p className="text-xs text-slate-500">Visual mapping of active physical storage lockers, bins, and total inventory pieces allocated per school area.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {storageRooms.map((room) => (
              <div key={room.name} className="border border-slate-200 rounded-2xl bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Location Depot</span>
                    <h4 className="font-black text-sm text-slate-800">{room.name}</h4>
                  </div>
                  <Building className="w-5 h-5 text-slate-400" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cataloged SKUs:</span>
                    <span className="font-bold text-slate-800">{room.itemsCount} profiles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Pieces:</span>
                    <span className="font-black text-slate-950 font-mono">{room.totalItems} units</span>
                  </div>
                  
                  {/* UTILISED CAPACITY LEVEL INDICATOR */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>Bin Utilisation</span>
                      <span>{Math.min(100, Math.round((room.totalItems / 400) * 100))}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.round((room.totalItems / 400) * 100))}%` }} />
                    </div>
                  </div>
                </div>

                {/* ACTIVE ITEMS LIST IN THIS ROOM */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] max-h-[140px] overflow-y-auto">
                  <div className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Allocated Bin Shelf Tags</div>
                  {items.filter(i => i.location === room.name).map(i => (
                    <div key={i.id} className="flex justify-between font-mono py-0.5 border-b border-slate-100/50">
                      <span className="text-slate-600 font-sans truncate pr-2 w-2/3">{i.name}</span>
                      <span className="text-indigo-600 font-bold">{i.bin.split(', ')[1] || i.bin}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW PANEL: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Verified SAMS Supplier Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">Contact logs and procurement channels coordinating academic and logistical materials.</p>
            </div>
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Register Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {suppliers.map((sup) => (
              <div key={sup.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                      {sup.category}
                    </span>
                    <h4 className="font-black text-sm text-slate-900 mt-1">{sup.name}</h4>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    sup.status === 'Preferred' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {sup.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[9px] uppercase">Contact Person</span>
                    <p className="font-semibold text-slate-800">{sup.contactPerson}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[9px] uppercase">Assigned Phone</span>
                    <p className="font-semibold text-slate-800 font-mono">{sup.phone}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <span className="text-slate-400 font-bold text-[9px] uppercase">Corporate Email</span>
                    <p className="font-semibold text-slate-800 font-mono">{sup.email}</p>
                  </div>
                </div>

                {/* SUPPLIED ITEMS SHORTCUT */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Active Supply items:</span>
                  <div className="flex gap-1.5 overflow-x-auto max-w-full">
                    {items.filter(i => i.category === sup.category).map(i => (
                      <span key={i.id} className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">
                        {i.sku}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW PANEL: INCOMING CARGO VERIFICATION */}
      {activeTab === 'cargo' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl space-y-2">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Incoming Cargo &amp; Waybill Verification</h3>
            <p className="text-xs text-slate-500">Warehouse intake logs. Complete structured quality control checks prior to committing bulk parcels to stock ledger.</p>
          </div>

          <div className="space-y-4">
            {cargoShipments.map((cargo) => (
              <div key={cargo.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                {/* HEAD */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-xs text-slate-500 font-mono">{cargo.cargoRef}</span>
                      <span className="text-[10px] text-slate-400">| Arrived {cargo.dateArrived}</span>
                    </div>
                    <h4 className="font-black text-sm text-slate-800 mt-1">{cargo.itemName}</h4>
                  </div>
                  
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    cargo.status === 'Verified & Committed' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-amber-50 text-amber-700 border border-amber-150 animate-pulse'
                  }`}>
                    {cargo.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                  {/* CARGO DETAILS */}
                  <div className="space-y-3 lg:border-r lg:border-slate-100 lg:pr-6">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold text-[9px] uppercase">Consignee Supplier</span>
                      <p className="font-bold text-slate-800">{cargo.supplierName}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-slate-50 p-2.5 rounded-lg text-center">
                        <span className="text-slate-400 text-[9px] uppercase font-bold">Ordered Qty</span>
                        <p className="font-black text-slate-900 font-mono text-base">{cargo.quantityOrdered} pcs</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg text-center">
                        <span className="text-slate-400 text-[9px] uppercase font-bold">Invoiced Qty</span>
                        <p className="font-black text-slate-900 font-mono text-base">{cargo.quantityReceived} pcs</p>
                      </div>
                    </div>
                  </div>

                  {/* CARGO QUALITY CONTROL CHECKS */}
                  <div className="space-y-3 lg:col-span-2">
                    <span className="text-slate-400 font-bold text-[9px] uppercase">Warehouse Auditing Checklist</span>
                    
                    {cargo.status === 'Pending Verification' ? (
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 p-2 border border-slate-150 rounded-xl hover:bg-slate-50/50 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={cargo.physicalCheck}
                            onChange={(e) => {
                              setCargoShipments(prev => prev.map(c => {
                                if (c.id === cargo.id) return { ...c, physicalCheck: e.target.checked };
                                return c;
                              }));
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-[11px] text-slate-800">Physical Condition Verification</p>
                            <p className="text-[10px] text-slate-400">Cartons are completely intact with no wet damage or tear defects.</p>
                          </div>
                        </label>

                        <label className="flex items-center space-x-3 p-2 border border-slate-150 rounded-xl hover:bg-slate-50/50 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={cargo.skuMatchCheck}
                            onChange={(e) => {
                              setCargoShipments(prev => prev.map(c => {
                                if (c.id === cargo.id) return { ...c, skuMatchCheck: e.target.checked };
                                return c;
                              }));
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-[11px] text-slate-800">SKU Consistency Match</p>
                            <p className="text-[10px] text-slate-400">Verify waybill barcodes match the SAMS catalog reference <strong>{cargo.sku}</strong>.</p>
                          </div>
                        </label>

                        <label className="flex items-center space-x-3 p-2 border border-slate-150 rounded-xl hover:bg-slate-50/50 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={cargo.countCheck}
                            onChange={(e) => {
                              setCargoShipments(prev => prev.map(c => {
                                if (c.id === cargo.id) return { ...c, countCheck: e.target.checked };
                                return c;
                              }));
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-[11px] text-slate-800">Physical Piece Audit Count</p>
                            <p className="text-[10px] text-slate-400">Quantity inside is exactly {cargo.quantityReceived} units, confirming zero discrepancies.</p>
                          </div>
                        </label>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleVerifyAndCommitCargo(cargo.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Verify &amp; Commit to Stock
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/30 border border-emerald-150 p-4 rounded-2xl flex items-center space-x-3.5 text-emerald-800">
                        <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-[11px] uppercase tracking-wider">Quality Audits Green</p>
                          <p className="text-[11px] text-emerald-600">Committed to stock on July 20, 2026. SAMS Ledger records updated automatically (+{cargo.quantityReceived} units).</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT DIALOG (OVERLAY MODAL) */}
      {adjustingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-900">Adjust Supplies Inventory</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{adjustingItem.name} ({adjustingItem.sku})</p>
              </div>
              <button 
                onClick={() => setAdjustingItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Current Ledger:</span>
                <span className="font-bold text-slate-800">{adjustingItem.stock} units</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Min Safe Level:</span>
                <span className="font-semibold text-slate-700">{adjustingItem.minThreshold} units</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600">Adjustment Amount (Incremental):</label>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setAdjustmentAmount(prev => prev - 5)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 w-8 h-8 rounded-lg font-bold"
                >
                  -5
                </button>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                  className="w-full text-center border border-slate-200 bg-slate-50 py-1 rounded-lg text-sm font-bold"
                />
                <button 
                  onClick={() => setAdjustmentAmount(prev => prev + 5)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 w-8 h-8 rounded-lg font-bold"
                >
                  +5
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">Specify positive integer to add to stock, negative to subtract.</p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button 
                onClick={() => setAdjustingItem(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdjustStock}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Apply Stock Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER DIALOG (OVERLAY MODAL) */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Register SAMS Supplies Supplier</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define vendor entity for continuous asset procurement logs.</p>
              </div>
              <button 
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Supplier Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sokoto Educational Printers Ltd"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Primary Category</label>
                  <select
                    value={newSupplierCategory}
                    onChange={(e) => setNewSupplierCategory(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="Textbooks">Textbooks</option>
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Uniforms">Uniforms</option>
                    <option value="General">General Supplies</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Malam Aliyu Shehu"
                    value={newSupplierContact}
                    onChange={(e) => setNewSupplierContact(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="e.g. ali@sokotoprinters.com"
                    value={newSupplierEmail}
                    onChange={(e) => setNewSupplierEmail(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Corporate Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +234 803 111 2222"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button 
                onClick={() => setIsSupplierModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSupplier}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Supplier Entry
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
