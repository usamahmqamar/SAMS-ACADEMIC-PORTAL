import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  SlidersHorizontal,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  RotateCcw,
  Building,
  Truck,
  ShieldCheck,
  ClipboardCheck,
  X,
  ShoppingCart,
  Receipt,
  Tag,
  Edit3,
  Filter,
  Check
} from 'lucide-react';
import { StoreInventoryItem, StoreSaleRecord, Supplier, CargoShipment, ItemSetting } from '../types/inventory';
import { StoreSalesPOS } from './inventory/StoreSalesPOS';
import { StoreSalesHistory } from './inventory/StoreSalesHistory';
import { StoreAuditTrail } from './inventory/StoreAuditTrail';
import { StoreSaleReceiptModal } from './inventory/StoreSaleReceiptModal';
import { ItemFormModal } from './inventory/ItemFormModal';
import { CombinedPaymentDesk } from './payment/CombinedPaymentDesk';
import { Layers } from 'lucide-react';

export const InventoryCatalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'combined' | 'sales-history' | 'audit-trail' | 'ledger' | 'bins' | 'suppliers' | 'cargo'>('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSettingFilter, setSelectedSettingFilter] = useState<string>('All');

  // CORE INVENTORY ITEMS STATE (with Sellable and School Issue items)
  const [items, setItems] = useState<StoreInventoryItem[]>([
    {
      id: 'item-1',
      itemCode: 'MAT-MET-01',
      name: 'Uniform Material - Navy Blue (Terylene Wool)',
      category: 'Uniforms',
      branch: 'Main Campus',
      store: 'Uniform Depot',
      unit: 'Meter',
      sellingPrice: 2500,
      costPrice: 1700,
      currentStock: 145.5,
      minimumStockLevel: 25,
      status: 'Active',
      setting: 'Sell to Parent',
      location: 'Uniform Depot',
      bin: 'Rack B-01 (Fabric Rolls)'
    },
    {
      id: 'item-2',
      itemCode: 'MAT-YRD-02',
      name: 'Uniform Material - White Shirting Fabric',
      category: 'Uniforms',
      branch: 'Main Campus',
      store: 'Uniform Depot',
      unit: 'Yard',
      sellingPrice: 2200,
      costPrice: 1500,
      currentStock: 98.0,
      minimumStockLevel: 20,
      status: 'Active',
      setting: 'Both',
      location: 'Uniform Depot',
      bin: 'Rack B-03 (Shirting Rolls)'
    },
    {
      id: 'item-3',
      itemCode: 'UNI-SHT-01',
      name: 'Ready-Made Short Sleeve Oxford Shirt (Size 14-16)',
      category: 'Uniforms',
      branch: 'Main Campus',
      store: 'Uniform Depot',
      unit: 'Piece',
      sellingPrice: 4500,
      costPrice: 3200,
      currentStock: 42,
      minimumStockLevel: 15,
      status: 'Active',
      setting: 'Both',
      location: 'Uniform Depot',
      bin: 'Locker #01 (Shirts)'
    },
    {
      id: 'item-4',
      itemCode: 'UNI-TRS-02',
      name: 'Senior School Grey Tailored Trousers',
      category: 'Uniforms',
      branch: 'Main Campus',
      store: 'Uniform Depot',
      unit: 'Piece',
      sellingPrice: 5800,
      costPrice: 4000,
      currentStock: 35,
      minimumStockLevel: 10,
      status: 'Active',
      setting: 'Both',
      location: 'Uniform Depot',
      bin: 'Locker #02 (Trousers)'
    },
    {
      id: 'item-5',
      itemCode: 'ACC-TIE-01',
      name: 'Official Woven School Crest Tie (Senior)',
      category: 'Uniforms',
      branch: 'Main Campus',
      store: 'Uniform Depot',
      unit: 'Piece',
      sellingPrice: 1800,
      costPrice: 1100,
      currentStock: 80,
      minimumStockLevel: 20,
      status: 'Active',
      setting: 'Both',
      location: 'Uniform Depot',
      bin: 'Cabinet C-01 (Accessories)'
    },
    {
      id: 'item-6',
      itemCode: 'ACC-BLT-01',
      name: 'Embossed Leather School Uniform Belt',
      category: 'Uniforms',
      branch: 'Main Campus',
      store: 'Uniform Depot',
      unit: 'Piece',
      sellingPrice: 2000,
      costPrice: 1200,
      currentStock: 55,
      minimumStockLevel: 15,
      status: 'Active',
      setting: 'Sell to Parent',
      location: 'Uniform Depot',
      bin: 'Cabinet C-02 (Accessories)'
    },
    {
      id: 'item-7',
      itemCode: 'UNI-BLZ-01',
      name: 'Secondary School Wool-Blend Blazer (Navy, Medium)',
      category: 'Uniforms',
      branch: 'Main Campus',
      store: 'Uniform Depot',
      unit: 'Piece',
      sellingPrice: 16500,
      costPrice: 12000,
      currentStock: 12,
      minimumStockLevel: 8,
      status: 'Active',
      setting: 'Both',
      location: 'Uniform Depot',
      bin: 'Uniform Locker #02'
    },
    {
      id: 'item-8',
      itemCode: 'SPT-SCK-01',
      name: 'Official Sport Striped Athletic Socks',
      category: 'Sports',
      branch: 'Main Campus',
      store: 'Sports Store',
      unit: 'Pair',
      sellingPrice: 1200,
      costPrice: 750,
      currentStock: 65,
      minimumStockLevel: 20,
      status: 'Active',
      setting: 'Sell to Parent',
      location: 'Sports Store',
      bin: 'Bin S-04'
    },
    {
      id: 'item-9',
      itemCode: 'SPT-TRK-01',
      name: 'Physical Education Tracksuit Set (Jacket + Pants)',
      category: 'Sports',
      branch: 'Main Campus',
      store: 'Sports Store',
      unit: 'Set',
      sellingPrice: 9500,
      costPrice: 6800,
      currentStock: 28,
      minimumStockLevel: 10,
      status: 'Active',
      setting: 'Both',
      location: 'Sports Store',
      bin: 'Bin S-02'
    },
    {
      id: 'item-10',
      itemCode: 'STA-MTH-01',
      name: 'Oxford Mathematical Instruments & Geometry Set',
      category: 'Stationery',
      branch: 'Main Campus',
      store: 'Main Storeroom',
      unit: 'Pack',
      sellingPrice: 2800,
      costPrice: 1900,
      currentStock: 48,
      minimumStockLevel: 15,
      status: 'Active',
      setting: 'Sell to Parent',
      location: 'Main Storeroom',
      bin: 'Shelf M-02'
    },
    {
      id: 'item-11',
      itemCode: 'STA-NBK-50',
      name: 'SAMS Custom Embossed Notebook (Pack of 50)',
      category: 'Stationery',
      branch: 'Main Campus',
      store: 'Main Storeroom',
      unit: 'Pack',
      sellingPrice: 7500,
      costPrice: 5200,
      currentStock: 45,
      minimumStockLevel: 20,
      status: 'Active',
      setting: 'Both',
      location: 'Main Storeroom',
      bin: 'Central Storeroom, Box #44'
    },
    {
      id: 'item-12',
      itemCode: 'TXT-MTH-10',
      name: 'Grade 10 Mathematics Standard Textbook',
      category: 'Textbooks',
      branch: 'Main Campus',
      store: 'Main Storeroom',
      unit: 'Piece',
      sellingPrice: 4500,
      costPrice: 3500,
      currentStock: 120,
      minimumStockLevel: 30,
      status: 'Active',
      setting: 'Both',
      location: 'Main Storeroom',
      bin: 'Room A, Bin #12'
    },
    {
      id: 'item-13',
      itemCode: 'ADM-ANS-01',
      name: 'Standard Terminal Answer Booklets (Pack of 500)',
      category: 'Academic',
      branch: 'Main Campus',
      store: 'Main Storeroom',
      unit: 'Pack',
      sellingPrice: 0,
      costPrice: 3500,
      currentStock: 80,
      minimumStockLevel: 25,
      status: 'Active',
      setting: 'School Issue Only',
      location: 'Main Storeroom',
      bin: 'Exam Vault, Shelf 1'
    },
    {
      id: 'item-14',
      itemCode: 'STA-MKR-12',
      name: 'Whiteboard Dry-Erase Markers (Box of 12)',
      category: 'Stationery',
      branch: 'Main Campus',
      store: 'Staff Room Supplies',
      unit: 'Pack',
      sellingPrice: 0,
      costPrice: 1100,
      currentStock: 18,
      minimumStockLevel: 15,
      status: 'Active',
      setting: 'School Issue Only',
      location: 'Staff Room Supplies',
      bin: 'Cabinet #B'
    }
  ]);

  // STORE SALES TRANSACTIONS STATE
  const [salesRecords, setSalesRecords] = useState<StoreSaleRecord[]>([
    {
      id: 'REC-STR-2026-001',
      saleDate: '2026-07-20',
      time: '10:30 AM',
      branch: 'Main Campus',
      store: 'Uniform Depot',
      customerType: 'Parent',
      studentId: 's-101',
      studentName: 'Zainab Ibrahim',
      parentName: 'Hajiya Fatima Ibrahim',
      parentPhone: '+234 803 456 7890',
      grade: 'Grade 10-A',
      items: [
        {
          itemId: 'item-1',
          itemCode: 'MAT-MET-01',
          itemName: 'Uniform Material - Navy Blue (Terylene Wool)',
          unit: 'Meter',
          quantity: 2.5,
          unitPrice: 2500,
          subtotal: 6250
        },
        {
          itemId: 'item-5',
          itemCode: 'ACC-TIE-01',
          itemName: 'Official Woven School Crest Tie (Senior)',
          unit: 'Piece',
          quantity: 1,
          unitPrice: 1800,
          subtotal: 1800
        }
      ],
      subtotal: 8050,
      discountAmount: 0,
      totalAmount: 8050,
      paymentMethod: 'POS Card',
      referenceNo: 'POS-TXN-88412',
      cashierName: 'Mal. Abubakar (Store Mgr)',
      notes: '2.5 meters fabric measured and cut for senior uniform tailoring',
      createdAt: '2026-07-20T10:30:00Z'
    },
    {
      id: 'REC-STR-2026-002',
      saleDate: '2026-07-21',
      time: '02:15 PM',
      branch: 'Main Campus',
      store: 'Uniform Depot',
      customerType: 'Parent',
      studentId: 's-102',
      studentName: 'Emmanuel Okafor',
      parentName: 'Dr. Chukwudi Okafor',
      parentPhone: '+234 802 333 4455',
      grade: 'Grade 11-B',
      items: [
        {
          itemId: 'item-7',
          itemCode: 'UNI-BLZ-01',
          itemName: 'Secondary School Wool-Blend Blazer (Navy, Medium)',
          unit: 'Piece',
          quantity: 1,
          unitPrice: 16500,
          subtotal: 16500
        },
        {
          itemId: 'item-3',
          itemCode: 'UNI-SHT-01',
          itemName: 'Ready-Made Short Sleeve Oxford Shirt (Size 14-16)',
          unit: 'Piece',
          quantity: 2,
          unitPrice: 4500,
          subtotal: 9000
        },
        {
          itemId: 'item-6',
          itemCode: 'ACC-BLT-01',
          itemName: 'Embossed Leather School Uniform Belt',
          unit: 'Piece',
          quantity: 1,
          unitPrice: 2000,
          subtotal: 2000
        }
      ],
      subtotal: 27500,
      discountAmount: 0,
      totalAmount: 27500,
      paymentMethod: 'Bank Transfer',
      referenceNo: 'GTB-TRF-991204',
      cashierName: 'Mal. Abubakar (Store Mgr)',
      notes: 'Full senior secondary kit purchased',
      createdAt: '2026-07-21T14:15:00Z'
    }
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
    { id: 'car-1', cargoRef: 'CRG-2026-901', supplierName: 'Sokoto Educational Printers Ltd', itemName: 'Grade 10 Mathematics Standard Textbook', sku: 'TXT-MTH-10', quantityOrdered: 50, quantityReceived: 50, status: 'Pending Verification', dateArrived: '2026-07-22', physicalCheck: false, skuMatchCheck: false, countCheck: false },
    { id: 'car-2', cargoRef: 'CRG-2026-902', supplierName: 'Northern Science Lab Supplies', itemName: 'Introductory Chemistry Kit (Lab Set)', sku: 'LAB-CHM-01', quantityOrdered: 10, quantityReceived: 10, status: 'Pending Verification', dateArrived: '2026-07-21', physicalCheck: false, skuMatchCheck: false, countCheck: false },
    { id: 'car-3', cargoRef: 'CRG-2026-903', supplierName: 'Kaduna Textile Mills', itemName: 'Secondary School Blazer (Navy, Medium)', sku: 'UNI-BLZ-01', quantityOrdered: 15, quantityReceived: 15, status: 'Verified & Committed', dateArrived: '2026-07-18', physicalCheck: true, skuMatchCheck: true, countCheck: true }
  ]);

  // MODAL STATES
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StoreInventoryItem | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<StoreSaleRecord | null>(null);

  // STOCK ADJUSTMENT MODAL
  const [adjustingItem, setAdjustingItem] = useState<StoreInventoryItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Store Restock');

  // ADD SUPPLIER MODAL STATE
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCategory, setNewSupplierCategory] = useState('Textbooks');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');

  // Fetch Items & Sales from Server API
  const fetchInventoryData = async () => {
    try {
      const itemsRes = await fetch('/api/inventory/items');
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        }
      }

      const salesRes = await fetch('/api/inventory/sales');
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        if (Array.isArray(salesData) && salesData.length > 0) {
          setSalesRecords(salesData);
        }
      }
    } catch (err) {
      console.warn('API sync warning (using local fallback state):', err);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Filtered Items for the Ledger View
  const filteredLedgerItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSetting = selectedSettingFilter === 'All' || item.setting === selectedSettingFilter;

      return matchesSearch && matchesCategory && matchesSetting;
    });
  }, [items, searchQuery, selectedCategory, selectedSettingFilter]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    const totalItemsCount = items.length;
    const totalUnits = items.reduce((sum, item) => sum + item.currentStock, 0);
    const totalValue = items.reduce((sum, item) => sum + item.currentStock * (item.sellingPrice || item.costPrice), 0);
    const criticalStock = items.filter(item => item.currentStock <= item.minimumStockLevel).length;
    const sellableCount = items.filter(item => item.setting === 'Sell to Parent' || item.setting === 'Both').length;
    return { totalItemsCount, totalUnits, totalValue, criticalStock, sellableCount };
  }, [items]);

  // Handle Save / Update Item
  const handleSaveItem = async (itemData: Partial<StoreInventoryItem>) => {
    if (itemToEdit) {
      // Edit existing item
      try {
        const res = await fetch(`/api/inventory/items/${itemToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
        if (res.ok) {
          const updated = await res.json();
          setItems(prev => prev.map(it => (it.id === itemToEdit.id ? updated : it)));
        } else {
          setItems(prev => prev.map(it => (it.id === itemToEdit.id ? { ...it, ...itemData } : it)));
        }
      } catch {
        setItems(prev => prev.map(it => (it.id === itemToEdit.id ? { ...it, ...itemData } : it)));
      }
    } else {
      // Create new item
      try {
        const res = await fetch('/api/inventory/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
        if (res.ok) {
          const created = await res.json();
          setItems(prev => [created, ...prev]);
        } else {
          const newItem: StoreInventoryItem = {
            id: `item-${Date.now()}`,
            itemCode: itemData.itemCode || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            name: itemData.name || 'New Item',
            category: itemData.category || 'Uniforms',
            branch: itemData.branch || 'Main Campus',
            store: itemData.store || 'Uniform Depot',
            unit: itemData.unit || 'Piece',
            sellingPrice: itemData.sellingPrice || 0,
            costPrice: itemData.costPrice || 0,
            currentStock: itemData.currentStock || 0,
            minimumStockLevel: itemData.minimumStockLevel || 10,
            status: itemData.status || 'Active',
            setting: itemData.setting || 'Both',
            location: itemData.location || 'Uniform Depot',
            bin: itemData.bin || 'Shelf 1'
          };
          setItems(prev => [newItem, ...prev]);
        }
      } catch {
        const newItem: StoreInventoryItem = {
          id: `item-${Date.now()}`,
          itemCode: itemData.itemCode || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          name: itemData.name || 'New Item',
          category: itemData.category || 'Uniforms',
          branch: itemData.branch || 'Main Campus',
          store: itemData.store || 'Uniform Depot',
          unit: itemData.unit || 'Piece',
          sellingPrice: itemData.sellingPrice || 0,
          costPrice: itemData.costPrice || 0,
          currentStock: itemData.currentStock || 0,
          minimumStockLevel: itemData.minimumStockLevel || 10,
          status: itemData.status || 'Active',
          setting: itemData.setting || 'Both',
          location: itemData.location || 'Uniform Depot',
          bin: itemData.bin || 'Shelf 1'
        };
        setItems(prev => [newItem, ...prev]);
      }
    }
    setItemToEdit(null);
  };

  // Handle stock adjustment
  const handleApplyAdjustment = async () => {
    if (!adjustingItem) return;
    const newStock = Math.max(0, parseFloat((adjustingItem.currentStock + adjustmentAmount).toFixed(3)));

    try {
      await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: adjustingItem.id,
          adjustmentAmount,
          reason: adjustmentReason
        })
      });
    } catch (e) {
      console.warn('Local adjustment fallback applied');
    }

    setItems(prev =>
      prev.map(it => (it.id === adjustingItem.id ? { ...it, currentStock: newStock } : it))
    );
    setAdjustingItem(null);
    setAdjustmentAmount(0);
  };

  // Handle cargo verification & commitment to stock
  const handleVerifyAndCommitCargo = (shipmentId: string) => {
    const shipment = cargoShipments.find(c => c.id === shipmentId);
    if (!shipment) return;

    if (!shipment.physicalCheck || !shipment.skuMatchCheck || !shipment.countCheck) {
      alert('Please complete the cargo audit checklist (Physical condition, SKU matching, and physical count verification) before committing!');
      return;
    }

    setCargoShipments(prev =>
      prev.map(c => (c.id === shipmentId ? { ...c, status: 'Verified & Committed' } : c))
    );

    setItems(prev =>
      prev.map(it => {
        if (it.itemCode === shipment.sku) {
          return { ...it, currentStock: it.currentStock + shipment.quantityReceived };
        }
        return it;
      })
    );
  };

  // Handle adding a supplier
  const handleAddSupplier = () => {
    if (!newSupplierName || !newSupplierContact) {
      alert('Please provide at least a Supplier Name and Contact Person!');
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
    setNewSupplierName('');
    setNewSupplierContact('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
  };

  // Room Stats for Bins tab
  const storageRooms = useMemo(() => {
    const roomsMap: { [key: string]: { name: string; totalItems: number; itemsCount: number } } = {
      'Uniform Depot': { name: 'Uniform Depot', totalItems: 0, itemsCount: 0 },
      'Main Storeroom': { name: 'Main Storeroom', totalItems: 0, itemsCount: 0 },
      'Sports Store': { name: 'Sports Store', totalItems: 0, itemsCount: 0 },
      'Staff Room Supplies': { name: 'Staff Room Supplies', totalItems: 0, itemsCount: 0 }
    };

    items.forEach(item => {
      const rm = item.store || item.location;
      if (roomsMap[rm]) {
        roomsMap[rm].totalItems += item.currentStock;
        roomsMap[rm].itemsCount += 1;
      }
    });

    return Object.values(roomsMap);
  }, [items]);

  return (
    <div id="erp-view-inventory" className="space-y-6 font-sans">
      {/* MODULE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Inventory &amp; Store Management
              </h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Sellable Items Enabled
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Direct counter retail sales to parents &amp; students, fabric meterage cuts, stock ledgers, and supplier allotments
            </p>
          </div>
        </div>

        {/* PRIMARY NAVIGATION TABS */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'pos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Store Sales (POS)
          </button>
          <button
            onClick={() => setActiveTab('combined')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'combined'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Combined Payment (Fees + Store)
          </button>
          <button
            onClick={() => setActiveTab('sales-history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'sales-history'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Sales Receipts ({salesRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('audit-trail')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'audit-trail'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Stock Ledger &amp; Catalog
          </button>
          <button
            onClick={() => setActiveTab('bins')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'bins' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Storage Bins
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'suppliers' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => setActiveTab('cargo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'cargo' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Incoming Cargo
            {cargoShipments.filter(c => c.status === 'Pending Verification').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* TOP INVENTORY & SALES METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cataloged Items</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalItemsCount} profiles</p>
            <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">{stats.sellableCount} sellable to parents</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inventory Valuation</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">₦{stats.totalValue.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Retail &amp; school asset capital</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Store Sales Count</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{salesRecords.length} sales</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
              ₦{salesRecords.reduce((acc, s) => acc + s.totalAmount, 0).toLocaleString()} collected
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stats.criticalStock > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Alerts</p>
            <p className={`text-xl font-black mt-0.5 ${stats.criticalStock > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {stats.criticalStock} items
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Below safe minimum threshold</p>
          </div>
        </div>
      </div>

      {/* TAB 1: STORE SALES POS VIEW */}
      {activeTab === 'pos' && (
        <StoreSalesPOS
          inventoryItems={items}
          onSaleComplete={(saleRecord) => {
            setActiveReceipt(saleRecord);
            fetchInventoryData();
          }}
          onRefreshItems={fetchInventoryData}
          onOpenCombinedPayment={() => {
            setActiveTab('combined');
          }}
        />
      )}

      {/* TAB 1.5: COMBINED PAYMENT DESK */}
      {activeTab === 'combined' && (
        <CombinedPaymentDesk
          onSessionComplete={() => {
            fetchInventoryData();
          }}
        />
      )}

      {/* TAB 2: STORE SALES HISTORY */}
      {activeTab === 'sales-history' && (
        <StoreSalesHistory
          salesRecords={salesRecords}
          onViewReceipt={(sale) => setActiveReceipt(sale)}
        />
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit-trail' && (
        <StoreAuditTrail
          onViewReceipt={(txnId) => {
            const found = salesRecords.find(s => s.id === txnId || s.transactionNo === txnId);
            if (found) {
              setActiveReceipt(found);
            }
          }}
        />
      )}

      {/* TAB 4: STOCK LEDGER & SELLABLE CATALOG VIEW */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* ACTION & FILTER CONTROLS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog by SKU, item name, fabric..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
              {/* SETTING FILTER: School Issue Only / Sell to Parent / Both */}
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <span className="text-slate-400 font-semibold">Setting:</span>
                <select
                  value={selectedSettingFilter}
                  onChange={(e) => setSelectedSettingFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="All">All Settings</option>
                  <option value="Sell to Parent">Sell to Parent</option>
                  <option value="Both">Both (Issue &amp; Sell)</option>
                  <option value="School Issue Only">School Issue Only</option>
                </select>
              </div>

              {/* CATEGORY FILTER */}
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <span className="text-slate-400 font-semibold">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Uniforms">Uniforms</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Textbooks">Textbooks</option>
                  <option value="Sports">Sports</option>
                  <option value="Lab Equipment">Lab Equipment</option>
                  <option value="Academic">Academic</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* REGISTER NEW ITEM BUTTON */}
              <button
                onClick={() => {
                  setItemToEdit(null);
                  setIsItemModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Register Item
              </button>
            </div>
          </div>

          {/* STOCK LEDGER TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5">Item Code</th>
                    <th className="px-4 py-3.5">Item Name &amp; Category</th>
                    <th className="px-4 py-3.5 text-center">Issue Setting</th>
                    <th className="px-4 py-3.5 text-center">Unit</th>
                    <th className="px-4 py-3.5 text-right">Selling Price</th>
                    <th className="px-4 py-3.5 text-right">Cost Price</th>
                    <th className="px-4 py-3.5 text-center">Current Stock</th>
                    <th className="px-4 py-3.5 text-center">Min Level</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                  {filteredLedgerItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400 font-medium">
                        No inventory items matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLedgerItems.map((item) => {
                      const isLow = item.currentStock <= item.minimumStockLevel;
                      const isOutOfStock = item.currentStock <= 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-indigo-600">
                            {item.itemCode}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-extrabold text-slate-900">{item.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-slate-600">{item.category}</span>
                              <span>•</span>
                              <span>{item.store}</span>
                              <span>•</span>
                              <span className="font-mono">{item.bin}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                                item.setting === 'Sell to Parent'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : item.setting === 'Both'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {item.setting}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="bg-indigo-50/80 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]">
                              {item.unit}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right font-mono font-bold">
                            {item.setting === 'School Issue Only' ? (
                              <span className="text-slate-400 font-normal text-[11px]">—</span>
                            ) : (
                              <span className="text-slate-900">₦{item.sellingPrice.toLocaleString()}</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right font-mono text-slate-500 font-medium">
                            ₦{item.costPrice.toLocaleString()}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {item.currentStock} {item.unit.toLowerCase()}s
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center font-mono text-slate-400 font-semibold">
                            {item.minimumStockLevel}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setItemToEdit(item);
                                  setIsItemModalOpen(true);
                                }}
                                className="text-xs text-slate-600 hover:text-indigo-600 font-bold p-1 cursor-pointer transition-colors"
                                title="Edit Item Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setAdjustingItem(item);
                                  setAdjustmentAmount(0);
                                  setAdjustmentReason('Store Restock');
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold hover:underline cursor-pointer"
                              >
                                Adjust
                              </button>
                            </div>
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

      {/* TAB 4: STORAGE ROOM BINS VIEW */}
      {activeTab === 'bins' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1.5 shadow-xs">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
              SAMS Spatial Storage Allocations
            </h3>
            <p className="text-xs text-slate-500">
              Physical storage mapping of uniform lockers, fabric rolls, textbooks, and stock pieces across campus storerooms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {storageRooms.map((room) => (
              <div key={room.name} className="border border-slate-200 rounded-2xl bg-white p-5 space-y-4 shadow-xs">
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
                    <span className="text-slate-500">Active Stock Volume:</span>
                    <span className="font-black text-slate-950 font-mono">{room.totalItems} units / meters</span>
                  </div>
                </div>

                {/* ACTIVE ITEMS LIST IN THIS ROOM */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] max-h-[160px] overflow-y-auto">
                  <div className="font-bold text-[9px] uppercase tracking-wider text-slate-400">
                    Allocated Bin Shelf Tags
                  </div>
                  {items
                    .filter(i => (i.store || i.location) === room.name)
                    .map(i => (
                      <div key={i.id} className="flex justify-between font-mono py-1 border-b border-slate-100/60">
                        <span className="text-slate-700 font-sans truncate pr-2 w-2/3">{i.name}</span>
                        <span className="text-indigo-600 font-bold">{i.bin}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                Verified SAMS Supplier Directory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vendor directory for fabric mills, book publishers, uniform manufacturers, and academic suppliers.
              </p>
            </div>
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Register Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((sup) => (
              <div key={sup.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{sup.name}</h4>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block">
                      {sup.category}
                    </span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {sup.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact:</span>
                    <span className="font-bold text-slate-800">{sup.contactPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-mono text-slate-700">{sup.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono text-slate-700 font-bold">{sup.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: INCOMING CARGO VERIFICATION */}
      {activeTab === 'cargo' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
              Inbound Shipment Audits &amp; Delivery Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify freight manifests, condition inspection, and physical counts before committing items to the stock ledger.
            </p>
          </div>

          <div className="space-y-4">
            {cargoShipments.map((cargo) => (
              <div key={cargo.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {cargo.cargoRef}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{cargo.itemName}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supplier: <span className="font-semibold text-slate-700">{cargo.supplierName}</span> • SKU: <span className="font-mono font-bold text-indigo-600">{cargo.sku}</span>
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                      cargo.status === 'Verified & Committed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {cargo.status}
                  </span>
                </div>

                {cargo.status === 'Pending Verification' ? (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      Freight Verification Checklist
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cargo.physicalCheck}
                          onChange={(e) => {
                            setCargoShipments(prev =>
                              prev.map(c => (c.id === cargo.id ? { ...c, physicalCheck: e.target.checked } : c))
                            );
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-slate-700 font-semibold">Physical Box Condition Intact</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cargo.skuMatchCheck}
                          onChange={(e) => {
                            setCargoShipments(prev =>
                              prev.map(c => (c.id === cargo.id ? { ...c, skuMatchCheck: e.target.checked } : c))
                            );
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-slate-700 font-semibold">SKU &amp; Barcode Match Spec</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cargo.countCheck}
                          onChange={(e) => {
                            setCargoShipments(prev =>
                              prev.map(c => (c.id === cargo.id ? { ...c, countCheck: e.target.checked } : c))
                            );
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-slate-700 font-semibold">Piece Audit Count ({cargo.quantityReceived} units)</span>
                      </label>
                    </div>

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
                  <div className="bg-emerald-50/40 border border-emerald-200 p-3.5 rounded-xl flex items-center space-x-3 text-emerald-800 text-xs">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Audit passed and quantity ({cargo.quantityReceived} units) added to active catalog ledger.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ITEM REGISTRATION & EDIT MODAL */}
      <ItemFormModal
        isOpen={isItemModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => {
          setIsItemModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
      />

      {/* MODAL 2: STORE SALE RECEIPT MODAL */}
      <StoreSaleReceiptModal
        sale={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        onReceiptUpdated={(updatedSale) => {
          setSalesRecords(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
          setActiveReceipt(updatedSale);
        }}
      />

      {/* MODAL 3: STOCK ADJUSTMENT DIALOG */}
      {adjustingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 font-sans">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Adjust Inventory Stock</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {adjustingItem.name} ({adjustingItem.itemCode})
                </p>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Current Ledger:</span>
                <span className="font-mono font-bold text-slate-800">
                  {adjustingItem.currentStock} {adjustingItem.unit}s
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Unit of Measurement:</span>
                <span className="font-semibold text-indigo-600">{adjustingItem.unit}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Min Safe Level:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {adjustingItem.minimumStockLevel} {adjustingItem.unit}s
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                Adjustment Amount ({adjustingItem.unit}s):
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAdjustmentAmount(prev => prev - 5)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-9 h-9 rounded-lg font-bold cursor-pointer"
                >
                  -5
                </button>
                <input
                  type="number"
                  step="any"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-center border border-slate-200 bg-slate-50 py-1.5 rounded-lg text-sm font-mono font-bold outline-none focus:border-indigo-500 focus:bg-white"
                />
                <button
                  onClick={() => setAdjustmentAmount(prev => prev + 5)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-9 h-9 rounded-lg font-bold cursor-pointer"
                >
                  +5
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Positive number to add to stock, negative to subtract (supports decimals e.g. -2.5m).
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-700">Adjustment Reason</label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="Store Restock">Store Restock / Fabric Delivery</option>
                <option value="Audit Adjustment">Audit Adjustment / Physical Recount</option>
                <option value="Damage / Wastage">Damage / Material Cutting Wastage</option>
                <option value="Direct Issue">Internal School Department Issue</option>
                <option value="Return / Restock">Parent Return &amp; Restock</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setAdjustingItem(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyAdjustment}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl space-y-4 font-sans">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                  Register SAMS Supplies Supplier
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define vendor entity for continuous fabric and asset procurement logs.
                </p>
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Supplier Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kaduna Textile Mills"
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
                    <option value="Uniforms">Uniforms &amp; Fabrics</option>
                    <option value="Textbooks">Textbooks</option>
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Sports">Sports</option>
                    <option value="General">General Supplies</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Alhaji Bashir Sani"
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
                    placeholder="e.g. sales@kadunatextiles.com"
                    value={newSupplierEmail}
                    onChange={(e) => setNewSupplierEmail(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Corporate Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +234 806 333 4444"
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
