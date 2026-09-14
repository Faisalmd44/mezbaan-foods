export type PaymentMode = 'CASH' | 'UPI' | 'OTHER';
export type StaffRole = 'ADMIN' | 'CASHIER';
export type ViewMode = 'GRID' | 'LIST';
export type PaperWidth = 'MM80' | 'MM58';
export type AppScreen = 'POS' | 'SALES' | 'MENU' | 'STAFF' | 'SETTINGS';

export interface Category {
  id: number;
  name: string;
  displayOrder: number;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  sortOrder: number;
  stockQuantity?: number;
  imageUrl?: string;
}

export interface Staff {
  id: number;
  name: string;
  pin: string;
  role: StaffRole;
  isActive: boolean;
}

export interface CartLine {
  itemId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  isVeg: boolean;
  lineTotal: number;
}

export interface Bill {
  id: number;
  billNumber: string;
  timestamp: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  cashReceived: number | null;
  changeGiven: number | null;
  staffName: string;
  itemCount: number;
  gstin?: string;
}

export interface BillItem {
  id: number;
  billId: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BillWithItems {
  bill: Bill;
  items: BillItem[];
}

export interface ReceiptLineItem {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptData {
  billNumber: string;
  timestampMillis: number;
  lines: ReceiptLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMode: PaymentMode;
  cashReceived: number | null;
  changeGiven: number | null;
  staffName: string;
  gstin?: string;
}
