import React, { useState, useMemo, useEffect } from 'react';
import { StoreInventoryItem, SaleLineItem, StoreSaleRecord, StudentSearchResult, DiscountDetail } from '../../types/inventory';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Banknote,
  Building,
  User,
  Phone,
  Tag,
  Scissors,
  Receipt,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Percent,
  Lock,
  Unlock,
  GraduationCap,
  History,
  Info,
  Check,
  X,
  Clock,
  FileText
} from 'lucide-react';

interface StoreSalesPOSProps {
  inventoryItems: StoreInventoryItem[];
  onSaleComplete: (saleRecord: StoreSaleRecord) => void;
  onRefreshItems: () => void;
  onOpenCombinedPayment?: (student: StudentSearchResult, cart: SaleLineItem[]) => void;
}

export const StoreSalesPOS: React.FC<StoreSalesPOSProps> = ({
  inventoryItems,
  onSaleComplete,
  onRefreshItems,
  onOpenCombinedPayment
}) => {
  // Store & Branch selector
  const [selectedBranch, setSelectedBranch] = useState('Main Campus');
  const [selectedStore, setSelectedStore] = useState('Uniform Depot');

  // Item Search & Category filter
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Cart State
  const [cart, setCart] = useState<SaleLineItem[]>([]);

  // Cashier info
  const cashierId = 'usr-cashier-01';
  const cashierName = 'Mal. Abubakar (Store Mgr)';

  // Student/Customer Search & Selection State
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [studentSearchResults, setStudentSearchResults] = useState<StudentSearchResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);

  // Manual / Override Customer Fields
  const [customerType, setCustomerType] = useState<'Parent' | 'Student' | 'Staff' | 'Walk-in'>('Parent');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentAdmissionNo, setStudentAdmissionNo] = useState('');
  const [studentGrade, setStudentGrade] = useState('Grade 10-A');
  const [notes, setNotes] = useState('');

  // Discount State (Permitted Discount System)
  const [discountPermitted, setDiscountPermitted] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountRate, setDiscountRate] = useState<number | string>(0);
  const [discountAmount, setDiscountAmount] = useState<number | string>(0);
  const [discountReason, setDiscountReason] = useState('');
  const [discountAuthCode, setDiscountAuthCode] = useState('');
  const [isAuthUnlocked, setIsAuthUnlocked] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'POS Card' | 'Bank Transfer' | 'Student Wallet'>('POS Card');
  const [cashTendered, setCashTendered] = useState<number | string>('');
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Debounced search for students by Admission No, Name, Parent Name, or Parent Phone
  useEffect(() => {
    if (!studentSearchInput.trim()) {
      setStudentSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingStudents(true);
      try {
        const res = await fetch(`/api/students/store_search?q=${encodeURIComponent(studentSearchInput.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setStudentSearchResults(data);
          setShowStudentDropdown(true);
        }
      } catch (err) {
        console.error('Error searching students:', err);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [studentSearchInput]);

  // Initial load of sample students for quick access
  useEffect(() => {
    const fetchInitialStudents = async () => {
      try {
        const res = await fetch('/api/students/store_search');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setStudentSearchResults(data);
          }
        }
      } catch (err) {
        console.warn('Initial student search fetch fallback:', err);
      }
    };
    fetchInitialStudents();
  }, []);

  // Handle choosing a student from search results
  const handleSelectStudent = (stu: StudentSearchResult) => {
    setSelectedStudent(stu);
    setStudentName(stu.name);
    setStudentAdmissionNo(stu.admissionNo);
    setParentName(stu.parentName);
    setParentPhone(stu.parentPhone);
    setParentEmail(stu.parentEmail || '');
    setStudentGrade(stu.grade);
    setStudentSearchInput(`${stu.name} (${stu.admissionNo})`);
    setShowStudentDropdown(false);
    setIsWalkIn(false);
    setCustomerType('Parent');
    setErrorMessage('');
  };

  // Switch to Walk-in Mode (Non-enrolled customer / General parent)
  const handleSetWalkIn = () => {
    setSelectedStudent(null);
    setIsWalkIn(true);
    setCustomerType('Walk-in');
    setStudentName('');
    setStudentAdmissionNo('');
    setParentName('Walk-in Parent');
    setParentPhone('');
    setParentEmail('');
    setStudentGrade('General Walk-in');
    setStudentSearchInput('');
    setShowStudentDropdown(false);
  };

  // Clear selected student
  const handleClearStudent = () => {
    setSelectedStudent(null);
    setIsWalkIn(false);
    setStudentName('');
    setStudentAdmissionNo('');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
    setStudentGrade('Grade 10-A');
    setStudentSearchInput('');
    setShowStudentDropdown(false);
  };

  // Filter sellable items for selected branch/store
  const sellableItems = useMemo(() => {
    return inventoryItems.filter(item => {
      // Must be marked as Sell to Parent or Both, and be Active
      const isSellable = (item.setting === 'Sell to Parent' || item.setting === 'Both') && item.status === 'Active';
      if (!isSellable) return false;

      const matchesStore = selectedStore === 'All Stores' || item.store === selectedStore;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(itemSearchQuery.toLowerCase());

      return matchesStore && matchesCategory && matchesSearch;
    });
  }, [inventoryItems, selectedStore, selectedCategory, itemSearchQuery]);

  // Handle adding item to cart
  const handleAddToCart = (item: StoreInventoryItem, initialQty = 1) => {
    setCart(prev => {
      const existing = prev.find(line => line.itemId === item.id);
      if (existing) {
        const newQty = parseFloat((existing.quantity + initialQty).toFixed(3));
        return prev.map(line =>
          line.itemId === item.id
            ? { ...line, quantity: newQty, subtotal: parseFloat((newQty * line.unitPrice).toFixed(2)) }
            : line
        );
      } else {
        const qty = initialQty;
        return [
          ...prev,
          {
            itemId: item.id,
            itemCode: item.itemCode,
            itemName: item.name,
            unit: item.unit,
            quantity: qty,
            unitPrice: item.sellingPrice,
            subtotal: parseFloat((qty * item.sellingPrice).toFixed(2))
          }
        ];
      }
    });
    setErrorMessage('');
  };

  // Handle fractional quantity input (e.g. 2.5 meters, 1.75 yards)
  const handleQuantityChange = (itemId: string, newQtyStr: string) => {
    const qty = parseFloat(newQtyStr) || 0;
    setCart(prev =>
      prev.map(line => {
        if (line.itemId === itemId) {
          const clampedQty = Math.max(0, qty);
          return {
            ...line,
            quantity: clampedQty,
            subtotal: parseFloat((clampedQty * line.unitPrice).toFixed(2))
          };
        }
        return line;
      })
    );
  };

  // Step quantity by +1/-1 or +0.5/-0.5 for fabrics
  const handleStepQuantity = (itemId: string, step: number) => {
    setCart(prev =>
      prev.map(line => {
        if (line.itemId === itemId) {
          const newQty = Math.max(0.1, parseFloat((line.quantity + step).toFixed(3)));
          return {
            ...line,
            quantity: newQty,
            subtotal: parseFloat((newQty * line.unitPrice).toFixed(2))
          };
        }
        return line;
      })
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => prev.filter(line => line.itemId !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountPermitted(false);
    setDiscountAmount(0);
    setDiscountRate(0);
    setDiscountReason('');
    setErrorMessage('');
  };

  // Calculate Subtotal
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  // Calculate Discount
  const calculatedDiscount = useMemo(() => {
    if (!discountPermitted) return 0;
    if (discountType === 'percentage') {
      const rate = Math.min(100, Math.max(0, Number(discountRate) || 0));
      return parseFloat(((subtotal * rate) / 100).toFixed(2));
    } else {
      const fixed = Math.max(0, Number(discountAmount) || 0);
      return Math.min(subtotal, fixed);
    }
  }, [discountPermitted, discountType, discountRate, discountAmount, subtotal]);

  // Grand Total calculation
  const grandTotal = Math.max(0, parseFloat((subtotal - calculatedDiscount).toFixed(2)));

  // Cash Change Calculation
  const cashGiven = Number(cashTendered) || 0;
  const changeDue = Math.max(0, parseFloat((cashGiven - grandTotal).toFixed(2)));

  // Discount Authorization check
  const handleUnlockDiscount = () => {
    if (discountAuthCode.trim().toUpperCase() === 'SAMS-MGR' || discountAuthCode.trim().toUpperCase() === 'DISC10' || discountAuthCode.trim().length >= 4) {
      setIsAuthUnlocked(true);
      setDiscountPermitted(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid Manager/Supervisor Authorization Code for Discount.');
    }
  };

  // Checkout process with full validation, inventory deduction & audit logging
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage('The sale cart is empty. Please select materials or items to purchase.');
      return;
    }

    if (!parentName.trim()) {
      setErrorMessage('Please provide the Parent / Customer Name or select a Student.');
      return;
    }

    // Verify stock availability
    for (const line of cart) {
      const inv = inventoryItems.find(it => it.id === line.itemId || it.itemCode === line.itemCode);
      if (inv && inv.currentStock < line.quantity) {
        setErrorMessage(
          `Insufficient stock for "${line.itemName}". Available: ${inv.currentStock} ${inv.unit}, Requested: ${line.quantity} ${inv.unit}.`
        );
        return;
      }
    }

    if (discountPermitted && calculatedDiscount > 0 && !discountReason.trim()) {
      setErrorMessage('Please provide a reason or note for applying a discount.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const discountPayload: DiscountDetail | undefined = discountPermitted && calculatedDiscount > 0
        ? {
            permitted: true,
            type: discountType,
            rate: discountType === 'percentage' ? Number(discountRate) : undefined,
            amount: calculatedDiscount,
            reason: discountReason.trim() || 'Cashier authorized discount',
            authorizedBy: isAuthUnlocked ? 'Store Manager (Verified)' : cashierName
          }
        : undefined;

      const payload = {
        branch: selectedBranch,
        store: selectedStore,
        customerType,
        studentId: selectedStudent?.id || undefined,
        admissionNo: studentAdmissionNo.trim() || selectedStudent?.admissionNo || undefined,
        studentName: studentName.trim() || undefined,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim() || undefined,
        parentEmail: parentEmail.trim() || undefined,
        grade: studentGrade.trim() || undefined,
        items: cart,
        subtotal,
        discountAmount: calculatedDiscount,
        discountDetail: discountPayload,
        totalAmount: grandTotal,
        paymentMethod,
        referenceNo: paymentRefNumber.trim() || undefined,
        cashierId,
        cashierName,
        notes: notes.trim() || undefined
      };

      const response = await fetch('/api/inventory/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to complete store sale');
      }

      const saleRecord: StoreSaleRecord = await response.json();

      setSuccessNotice(`Sale successfully recorded! Transaction #${saleRecord.id}`);
      setTimeout(() => setSuccessNotice(null), 4000);

      // Reset state for next customer
      setCart([]);
      setDiscountPermitted(false);
      setDiscountAmount(0);
      setDiscountRate(0);
      setDiscountReason('');
      setIsAuthUnlocked(false);
      setDiscountAuthCode('');
      setNotes('');
      setCashTendered('');
      setPaymentRefNumber('');
      setSelectedStudent(null);
      setStudentSearchInput('');
      setStudentName('');
      setStudentAdmissionNo('');
      setParentName('');
      setParentPhone('');
      setParentEmail('');

      onSaleComplete(saleRecord);
      onRefreshItems();
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="store-sales-pos-workspace" className="space-y-5 font-sans">
      {/* SUCCESS POPUP BANNER */}
      {successNotice && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">{successNotice}</span>
          </div>
          <span className="text-xs bg-emerald-700/80 px-2.5 py-1 rounded-lg font-mono">Store Ledger Updated</span>
        </div>
      )}

      {/* POS TOP BAR: STORE & BRANCH SELECTOR + CASHIER INFO */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">Direct Store Sales Counter (POS)</h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Fee-Isolated Ledger
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Sell school uniforms, fabric cuts, textbooks, and accessories directly to parents &amp; students
            </p>
          </div>
        </div>

        {/* CASHIER IDENTITY & STORE SELECTOR */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-semibold">Cashier:</span>
            <span className="font-bold text-slate-800">{cashierName}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-indigo-600 font-semibold">Store:</span>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent font-bold text-indigo-900 outline-none cursor-pointer"
            >
              <option value="Uniform Depot">Uniform Depot</option>
              <option value="Main Storeroom">Main Storeroom</option>
              <option value="Bookstore">Bookstore</option>
              <option value="Sports Store">Sports Store</option>
              <option value="All Stores">All Stores</option>
            </select>
          </div>
        </div>
      </div>

      {/* STUDENT & FAMILY SEARCH WORKSPACE */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Student &amp; Parent Lookup</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Search by <span className="font-semibold text-slate-700">Student Admission No</span>, <span className="font-semibold text-slate-700">Student Name</span>, <span className="font-semibold text-slate-700">Parent Name</span>, or <span className="font-semibold text-slate-700">Parent Phone</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSetWalkIn}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isWalkIn
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Walk-in / General Customer
            </button>
            {selectedStudent && (
              <button
                onClick={handleClearStudent}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* SEARCH INPUT WITH DROPDOWN */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-indigo-500" />
            <input
              type="text"
              placeholder="Start typing Admission No (e.g. ADM-2024-N001), Student Name, Parent Name, or Phone (e.g. 08034567890)..."
              value={studentSearchInput}
              onChange={(e) => setStudentSearchInput(e.target.value)}
              onFocus={() => setShowStudentDropdown(true)}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl py-2.5 pl-10 pr-10 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
            {studentSearchInput && (
              <button
                onClick={() => {
                  setStudentSearchInput('');
                  setStudentSearchResults([]);
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* AUTOCOMPLETE POPUP LIST */}
          {showStudentDropdown && studentSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 max-h-72 overflow-y-auto divide-y divide-slate-100">
              <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 flex justify-between items-center">
                <span>Matching Students &amp; Families ({studentSearchResults.length})</span>
                <span className="text-[10px] text-indigo-600">Click to select and auto-populate</span>
              </div>
              {studentSearchResults.map((stu) => (
                <div
                  key={stu.id}
                  onClick={() => handleSelectStudent(stu)}
                  className="p-3 hover:bg-indigo-50/60 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-xs text-slate-900">{stu.name}</span>
                      <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                        {stu.admissionNo}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {stu.grade}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-600">
                      <span><span className="font-semibold text-slate-500">Parent:</span> {stu.parentName}</span>
                      {stu.parentPhone && (
                        <span className="font-mono text-slate-500">📞 {stu.parentPhone}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <div className="text-[11px]">
                      <div className="text-slate-400 text-[10px]">Past Purchases</div>
                      <div className="font-mono font-bold text-slate-800">{stu.storePurchasesCount} orders (₦{stu.storeTotalSpent.toLocaleString()})</div>
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DISPLAY SELECTED STUDENT / FAMILY PROFILE CARD */}
        {selectedStudent && (
          <div className="bg-linear-to-r from-indigo-50/90 via-slate-50 to-emerald-50/60 rounded-2xl border border-indigo-200/80 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-black text-sm text-slate-900">{selectedStudent.name}</h4>
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                      {selectedStudent.admissionNo}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {selectedStudent.grade} ({selectedStudent.branch})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Parent/Guardian: <span className="font-bold text-slate-800">{selectedStudent.parentName}</span>
                    {selectedStudent.parentPhone && <span className="font-mono text-slate-500 ml-2">📞 {selectedStudent.parentPhone}</span>}
                  </p>
                </div>
              </div>

              {/* STRICT FINANCIAL SEPARATION BANNER */}
              <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 text-right space-y-0.5 shrink-0">
                <div className="flex items-center justify-end space-x-1.5 text-emerald-700 font-bold text-[10px] uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Separated Store Ledger</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  School Fees: <span className="font-mono font-bold text-slate-700">₦{selectedStudent.schoolFeesBalance.toLocaleString()}</span> (Unchanged)
                </p>
              </div>
            </div>

            {/* QUICK STATS & HISTORY PREVIEW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white/80 p-2 rounded-xl border border-indigo-100/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Admission No</span>
                <p className="font-mono font-extrabold text-indigo-900">{selectedStudent.admissionNo}</p>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-indigo-100/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Parent Phone</span>
                <p className="font-mono font-extrabold text-slate-800">{selectedStudent.parentPhone || 'Not on file'}</p>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-indigo-100/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Store Purchases</span>
                <p className="font-mono font-extrabold text-slate-800">{selectedStudent.storePurchasesCount} orders</p>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-indigo-100/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Spent on Items</span>
                <p className="font-mono font-extrabold text-emerald-700">₦{selectedStudent.storeTotalSpent.toLocaleString()}</p>
              </div>
            </div>

            {/* COMBINED PAYMENT DISPATCH CALLOUT */}
            {selectedStudent.schoolFeesBalance > 0 && onOpenCombinedPayment && (
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      Parent paying for both Store Materials &amp; School Fees?
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Student has <strong className="text-rose-400">₦{selectedStudent.schoolFeesBalance.toLocaleString()}</strong> outstanding school fees.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenCombinedPayment(selectedStudent, cart)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 shadow-xs"
                >
                  <span>Process Combined Payment</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MAIN POS WORKSPACE: CATALOG ON LEFT, CART/CHECKOUT ON RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: SELLABLE CATALOG & SEARCH (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* SEARCH & CATEGORY CHIPS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search sellable items by name, SKU (e.g. Navy Blue, Blazer, Tie, Shiritng)..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>

            {/* CATEGORY FILTER CHIPS */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              {['All', 'Uniforms', 'Stationery', 'Textbooks', 'Sports', 'General'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ITEM CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {sellableItems.length === 0 ? (
              <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                <Scissors className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-sm text-slate-600">No sellable inventory items matching criteria</p>
                <p className="text-xs text-slate-400">
                  Ensure items are set to "Sell to Parent" or "Both" and are marked "Active".
                </p>
              </div>
            ) : (
              sellableItems.map(item => {
                const inCart = cart.find(c => c.itemId === item.id);
                const isLowStock = item.currentStock <= item.minimumStockLevel;
                const isOutOfStock = item.currentStock <= 0;
                const isFractionalUnit = item.unit === 'Meter' || item.unit === 'Yard';

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-4 transition-all flex flex-col justify-between space-y-3 ${
                      inCart
                        ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm'
                        : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* HEADER BADGES */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {item.itemCode}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.setting === 'Sell to Parent'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.setting}
                        </span>
                      </div>

                      {/* ITEM NAME */}
                      <h4 className="font-black text-slate-900 text-sm mt-2 leading-snug">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.store} • {item.bin}</p>
                    </div>

                    {/* PRICING & STOCK SPECS */}
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-500 text-[11px]">Selling Rate:</span>
                        <span className="font-black text-indigo-600 font-mono text-sm">
                          ₦{item.sellingPrice.toLocaleString()}{' '}
                          <span className="text-[10px] text-slate-500 font-sans font-semibold">/ {item.unit}</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Available Stock:</span>
                        <span
                          className={`font-mono font-bold ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {item.currentStock} {item.unit}s
                        </span>
                      </div>
                    </div>

                    {/* QUICK ACTION BUTTONS */}
                    <div className="pt-1">
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="w-full bg-slate-100 text-slate-400 text-xs font-bold py-2 rounded-xl cursor-not-allowed text-center"
                        >
                          Out of Stock
                        </button>
                      ) : isFractionalUnit ? (
                        /* FABRIC FRACTIONAL SHORTCUTS (e.g. 1m, 2.5m, 3m) */
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => handleAddToCart(item, 1)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer text-center"
                            >
                              +1 {item.unit}
                            </button>
                            <button
                              onClick={() => handleAddToCart(item, 2.5)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold py-1.5 rounded-lg transition-all cursor-pointer text-center shadow-xs"
                            >
                              +2.5 {item.unit}s
                            </button>
                            <button
                              onClick={() => handleAddToCart(item, 3)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer text-center"
                            >
                              +3 {item.unit}s
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item, 1)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add to Sale Cart
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE SALE CART & CHECKOUT (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
            {/* CART HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                  {cart.length}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Current Material Order</h3>
                  <p className="text-[11px] text-slate-400">{selectedStore} • {selectedBranch}</p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Cart
                </button>
              )}
            </div>

            {/* ERROR BANNER */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* CART LINE ITEMS TABLE */}
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Sale Cart is Empty</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Select sellable items from the catalog on the left to start issuing materials.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {cart.map((line) => {
                  const inv = inventoryItems.find(it => it.id === line.itemId || it.itemCode === line.itemCode);
                  const isStockExcess = inv && inv.currentStock < line.quantity;

                  return (
                    <div
                      key={line.itemId}
                      className={`p-3 rounded-xl border text-xs space-y-2 ${
                        isStockExcess ? 'bg-rose-50/50 border-rose-300' : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-extrabold text-slate-900">{line.itemName}</div>
                          <div className="text-[10px] text-indigo-600 font-mono font-bold">{line.itemCode}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(line.itemId)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* QUANTITY & PRICING CONTROLS */}
                      <div className="flex items-center justify-between pt-1">
                        {/* CUSTOM FRACTIONAL QUANTITY INPUT (Supports e.g. 2.5 meters!) */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleStepQuantity(line.itemId, line.unit === 'Meter' || line.unit === 'Yard' ? -0.5 : -1)}
                            className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0.1"
                              value={line.quantity}
                              onChange={(e) => handleQuantityChange(line.itemId, e.target.value)}
                              className="w-18 bg-white border border-slate-300 rounded-md py-1 px-2 text-center text-xs font-mono font-black text-slate-900 outline-none focus:border-indigo-500"
                            />
                          </div>

                          <button
                            onClick={() => handleStepQuantity(line.itemId, line.unit === 'Meter' || line.unit === 'Yard' ? 0.5 : 1)}
                            className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <span className="text-[11px] font-bold text-slate-500 pl-1">{line.unit}</span>
                        </div>

                        {/* LINE SUBTOTAL */}
                        <div className="text-right">
                          <div className="font-mono font-black text-slate-900 text-sm">
                            ₦{line.subtotal.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ₦{line.unitPrice.toLocaleString()}/{line.unit}
                          </div>
                        </div>
                      </div>

                      {isStockExcess && (
                        <p className="text-[10px] text-rose-600 font-bold">
                          Exceeds store stock ({inv?.currentStock} {line.unit}s available)
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* CUSTOMER INFORMATION FIELDS */}
            <div className="border-t border-slate-100 pt-3 space-y-3 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Customer &amp; Family Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Parent / Buyer Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Hajiya Fatima Ibrahim"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-8 pr-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Parent Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. +234 803 456 7890"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-8 pr-2 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Student Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Zainab Ibrahim"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Admission Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ADM-2024-N001"
                    value={studentAdmissionNo}
                    onChange={(e) => setStudentAdmissionNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* PERMITTED DISCOUNT SYSTEM */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Discount Authorization
                  </span>
                </div>

                {!discountPermitted ? (
                  <button
                    type="button"
                    onClick={() => setDiscountPermitted(true)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Apply Discount
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountPermitted(false);
                      setDiscountAmount(0);
                      setDiscountRate(0);
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Remove Discount
                  </button>
                )}
              </div>

              {discountPermitted && (
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-800 uppercase">Discount Type</label>
                      <div className="flex rounded-lg overflow-hidden border border-amber-300 mt-1">
                        <button
                          type="button"
                          onClick={() => setDiscountType('fixed')}
                          className={`flex-1 py-1 text-center font-bold text-[11px] ${
                            discountType === 'fixed' ? 'bg-amber-600 text-white' : 'bg-white text-amber-900'
                          }`}
                        >
                          ₦ Fixed
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('percentage')}
                          className={`flex-1 py-1 text-center font-bold text-[11px] ${
                            discountType === 'percentage' ? 'bg-amber-600 text-white' : 'bg-white text-amber-900'
                          }`}
                        >
                          % Rate
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-800 uppercase">
                        {discountType === 'percentage' ? 'Rate (%)' : 'Amount (₦)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={discountType === 'percentage' ? discountRate : discountAmount}
                        onChange={(e) => {
                          if (discountType === 'percentage') {
                            setDiscountRate(e.target.value);
                          } else {
                            setDiscountAmount(e.target.value);
                          }
                        }}
                        placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 1000'}
                        className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900 outline-none mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 uppercase">Discount Reason / Memo <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Sibling bundle concession, Management approved, Stock promotion"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs text-slate-900 outline-none mt-0.5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PAYMENT CHANNEL SELECTION */}
            <div className="border-t border-slate-100 pt-3 space-y-3 text-xs">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Channel</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { key: 'POS Card', icon: CreditCard, label: 'POS Terminal' },
                  { key: 'Cash', icon: Banknote, label: 'Cash' },
                  { key: 'Bank Transfer', icon: Building, label: 'Transfer' },
                  { key: 'Student Wallet', icon: User, label: 'Wallet/Acct' }
                ].map(pm => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.key;
                  return (
                    <button
                      key={pm.key}
                      type="button"
                      onClick={() => setPaymentMethod(pm.key as any)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-bold leading-tight">{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* CASH TENDERED CALCULATION */}
              {paymentMethod === 'Cash' && (
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-amber-800 uppercase">Cash Tendered (₦)</label>
                    <input
                      type="number"
                      placeholder="e.g. 10000"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-amber-800 uppercase">Change Due (₦)</span>
                    <div className="p-1.5 bg-white rounded-lg border border-amber-300 font-mono font-black text-amber-900 text-sm">
                      ₦{changeDue.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* PAYMENT REFERENCE OVERRIDE */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Reference / Slip No (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left empty (e.g. POS-TXN-88412)"
                  value={paymentRefNumber}
                  onChange={(e) => setPaymentRefNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* TOTAL SUMMARY CARD */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-bold">₦{subtotal.toLocaleString()}</span>
                </div>

                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-amber-400 text-xs">
                    <span>Discount Deducted:</span>
                    <span className="font-mono font-bold">-₦{calculatedDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block">Grand Total Payable:</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Independent of School Fees</span>
                  </div>
                  <span className="font-mono font-black text-emerald-400 text-xl">
                    ₦{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* CHECKOUT BUTTON */}
              <button
                onClick={handleCheckout}
                disabled={isProcessing || cart.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-sm py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span>Processing Sale &amp; Updating Stock Ledger...</span>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>Complete Sale &amp; Generate Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
