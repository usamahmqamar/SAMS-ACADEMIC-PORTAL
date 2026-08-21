export type UnitOfMeasurement = 'Piece' | 'Meter' | 'Yard' | 'Pair' | 'Set' | 'Pack';
export type ItemSetting = 'School Issue Only' | 'Sell to Parent' | 'Both';
export type ItemCategory = 'Uniforms' | 'Stationery' | 'Textbooks' | 'Sports' | 'Lab Equipment' | 'Academic' | 'General';
export type ItemStatus = 'Active' | 'Inactive';

export interface StoreInventoryItem {
  id: string;
  itemCode: string; // SKU code e.g. MAT-MET-01
  name: string;
  category: ItemCategory | string;
  branch: string;
  store: string;
  unit: UnitOfMeasurement;
  sellingPrice: number;
  costPrice: number;
  currentStock: number; // Decimals supported e.g. 145.5
  minimumStockLevel: number;
  status: ItemStatus;
  setting: ItemSetting;
  location: string;
  bin: string;
}

export interface SaleLineItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: UnitOfMeasurement;
  quantity: number; // Supports decimal e.g. 2.5
  unitPrice: number;
  subtotal: number;
}

export interface DiscountDetail {
  permitted: boolean;
  type: 'percentage' | 'fixed';
  rate?: number; // e.g. 5, 10
  amount: number;
  reason?: string;
  authorizedBy?: string;
}

export interface StoreSaleRecord {
  id: string; // Unique transaction ID e.g. STR-TXN-2026-080124
  transactionNo?: string;
  receiptNumber?: string;
  schoolName?: string;
  saleDate: string;
  time: string;
  branch: string;
  store: string;
  customerType: 'Student' | 'Parent' | 'Staff' | 'Walk-in';
  studentId?: string;
  admissionNo?: string;
  studentName?: string;
  parentName: string;
  parentPhone?: string;
  parentEmail?: string;
  grade?: string;
  items: SaleLineItem[];
  subtotal: number;
  discountAmount: number;
  discountDetail?: DiscountDetail;
  totalAmount: number;
  amountPaid?: number;
  balanceDue?: number;
  cashTendered?: number;
  changeGiven?: number;
  paymentMethod: 'Cash' | 'POS Card' | 'Bank Transfer' | 'Student Wallet';
  referenceNo: string;
  cashierId?: string;
  cashierName: string;
  notes?: string;
  ledgerCategory?: 'Store Materials Purchase';
  schoolFeeIsolated?: boolean; // Guarantees store purchase is isolated from tuition fee balance
  reprintCount?: number;
  lastReprintedAt?: string;
  lastReprintedBy?: string;
  lastReprintReason?: string;
  emailDispatchedTo?: string[];
  whatsAppDispatchedTo?: string[];
  createdAt: string;
}

export interface StudentSearchResult {
  id: string;
  admissionNo: string; // Enrollment / Admission number
  name: string;
  grade: string;
  classSection?: string;
  branch: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  familyAccountId?: string;
  schoolFeesBalance: number; // For information / transparency, strictly untouched
  storePurchasesCount: number;
  storeTotalSpent: number;
}

export interface StoreAuditItemSnapshot {
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: UnitOfMeasurement;
  qtySold: number;
  stockBefore: number;
  stockAfter: number;
  unitPrice: number;
  total: number;
}

export interface StoreAuditLog {
  id: string;
  transactionId: string;
  timestamp: string;
  date: string;
  time: string;
  cashierId: string;
  cashierName: string;
  actionType: 'STORE_DIRECT_SALE' | 'REPRINT_RECEIPT' | 'SEND_EMAIL' | 'SHARE_WHATSAPP' | 'DOWNLOAD_PDF' | 'INVENTORY_RESTOCK' | 'MANUAL_ADJUSTMENT' | 'PRICE_CHANGE';
  studentId?: string;
  admissionNo?: string;
  studentName?: string;
  parentName: string;
  parentPhone?: string;
  items?: StoreAuditItemSnapshot[];
  subtotal?: number;
  discount?: DiscountDetail;
  totalAmount?: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentMethod?: string;
  referenceNo?: string;
  branch?: string;
  store?: string;
  notes?: string;
  reprintReason?: string;
  reprintCount?: number;
  recipientEmail?: string;
  recipientPhone?: string;
  actionDetails?: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'Preferred' | 'Active' | 'Under Review';
}

export interface CargoShipment {
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

