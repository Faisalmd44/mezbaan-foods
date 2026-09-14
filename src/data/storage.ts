import {
  Category,
  MenuItem,
  Staff,
  Bill,
  BillItem,
  BillWithItems,
  ReceiptData,
  PaymentMode,
  CartLine
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_STAFF } from './initialData';
import { formatDateForBillId } from '../utils/format';

const STORAGE_KEYS = {
  CATEGORIES: 'mezban_categories',
  MENU_ITEMS: 'mezban_menu_items',
  STAFF: 'mezban_staff',
  CURRENT_STAFF_ID: 'mezban_current_staff_id',
  BILLS: 'mezban_bills',
  DAILY_COUNTER_PREFIX: 'mezban_bill_seq_',
  LOW_STOCK_THRESHOLD: 'mezban_low_stock_threshold',
  GST_ENABLED: 'mezban_gst_enabled',
  GST_RATE: 'mezban_gst_rate',
  GSTIN: 'mezban_restaurant_gstin'
};

/**
 * Room Database Versioning:
 * Bumped to v7 to synchronize rounded whole ₹10 menu item prices
 * across the entire MEZBAAN catalog.
 */
export const ROOM_DB_VERSION = 7;
export const DB_VERSION_KEY = 'mezban_room_db_version';

/**
 * Room Database initial seeding:
 * Seeds strictly MEZBAAN's official menu with rounded whole ₹10 prices and high-res photography.
 */
export function seedMenu(destructive: boolean = false): {
  categories: Category[];
  menuItems: MenuItem[];
} {
  if (destructive) {
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.MENU_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.BILLS);
  }

  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
  localStorage.setItem(DB_VERSION_KEY, ROOM_DB_VERSION.toString());

  return {
    categories: INITIAL_CATEGORIES,
    menuItems: INITIAL_MENU_ITEMS
  };
}

/**
 * Fallback to destructive migration:
 * Triggered automatically when Room Database version bumps,
 * or when old schema/demo items are detected.
 */
export function fallbackToDestructiveMigration(): void {
  console.info('[Room DB] Executing fallbackToDestructiveMigration for MEZBAAN official menu with imageUrls and rounded prices...');
  seedMenu(true);
}

/**
 * Ensures database version is synchronized.
 * If outdated, missing, or contains old categories/items/missing imageUrls, applies fallbackToDestructiveMigration.
 */
export function checkAndMigrateDatabase(): void {
  const currentVersion = parseInt(localStorage.getItem(DB_VERSION_KEY) || '0', 10);
  const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '';
  const storedItems = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS) || '';

  const isOldVersion = currentVersion < 6;
  const hasOldComboCategory = storedCats.includes('Drinks & Combos');
  const hasOldDemoBurger = storedItems.includes('Aloo Tikki Burger');
  const missingNewItem = !storedItems.includes('American Chicken Burger') || !storedItems.includes('Campa Energy');
  const missingDrinksCategory = !storedCats.includes('"name":"Drinks"');
  const missingImageUrls = !storedItems.includes('imageUrl');

  if (isOldVersion || hasOldComboCategory || hasOldDemoBurger || missingNewItem || missingDrinksCategory || missingImageUrls) {
    fallbackToDestructiveMigration();
    return;
  }

  // Version 7 migration: Round all menu item prices to nearest whole ₹10
  if (currentVersion < 7) {
    if (storedItems) {
      try {
        const items: MenuItem[] = JSON.parse(storedItems);
        const updated = items.map((item) => ({
          ...item,
          price: Math.round(item.price / 10) * 10
        }));
        localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(updated));
      } catch (err) {
        console.error('[Room DB] Error rounding stored menu prices:', err);
      }
    }
    localStorage.setItem(DB_VERSION_KEY, ROOM_DB_VERSION.toString());
  }
}

export const DEFAULT_GST_RATE = 5.0;

export function getGstEnabled(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return true;
  const saved = localStorage.getItem(STORAGE_KEYS.GST_ENABLED) ?? localStorage.getItem('mezban_apply_gst');
  if (saved === null) return true; // Default to GST enabled
  return saved === 'true';
}

export function saveGstEnabled(enabled: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.setItem(STORAGE_KEYS.GST_ENABLED, enabled ? 'true' : 'false');
  localStorage.setItem('mezban_apply_gst', enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('mezban_gst_enabled_changed', { detail: { enabled } }));
}

export function getGstRate(): number {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_GST_RATE;
  const saved =
    localStorage.getItem(STORAGE_KEYS.GST_RATE) ??
    localStorage.getItem('mezban_gst_percentage') ??
    localStorage.getItem('gst_percentage') ??
    localStorage.getItem('gst_rate');
  if (saved === null) return DEFAULT_GST_RATE;
  const num = parseFloat(saved);
  return isNaN(num) || num < 0 ? DEFAULT_GST_RATE : num;
}

export function saveGstRate(rate: number): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const clamped = Math.max(0, Math.min(100, Math.round(rate * 100) / 100));
  localStorage.setItem(STORAGE_KEYS.GST_RATE, clamped.toString());
  localStorage.setItem('mezban_gst_percentage', clamped.toString());
  localStorage.setItem('gst_percentage', clamped.toString());
  localStorage.setItem('gst_rate', clamped.toString());
  window.dispatchEvent(new CustomEvent('mezban_gst_rate_changed', { detail: { rate: clamped } }));
}

export const DEFAULT_GSTIN = '07AAAAA0000A1Z5';

export function getRestaurantGstin(): string {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_GSTIN;
  const saved = localStorage.getItem(STORAGE_KEYS.GSTIN) ?? localStorage.getItem('mezban_gstin');
  return saved !== null ? saved : DEFAULT_GSTIN;
}

export function saveRestaurantGstin(gstin: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const trimmed = gstin.trim().toUpperCase();
  localStorage.setItem(STORAGE_KEYS.GSTIN, trimmed);
  localStorage.setItem('mezban_gstin', trimmed);
  window.dispatchEvent(new CustomEvent('mezban_gstin_changed', { detail: { gstin: trimmed } }));
}

export function getCategories(): Category[] {
  checkAndMigrateDatabase();
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  return JSON.parse(data);
}

export function getMenuItems(): MenuItem[] {
  checkAndMigrateDatabase();
  const data = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
    return INITIAL_MENU_ITEMS;
  }
  const parsed: MenuItem[] = JSON.parse(data);
  const initialMap = new Map(INITIAL_MENU_ITEMS.map((i) => [i.id, i.stockQuantity ?? 15]));
  let hasMissing = false;
  const validated = parsed.map((item) => {
    let updated = item;
    // Enforce nearest whole ₹10 rounding
    const roundedPrice = Math.round(item.price / 10) * 10;
    if (item.price !== roundedPrice) {
      hasMissing = true;
      updated = { ...updated, price: roundedPrice };
    }
    if (item.stockQuantity === undefined) {
      hasMissing = true;
      updated = {
        ...updated,
        stockQuantity: initialMap.get(item.id) ?? 15
      };
    }
    return updated;
  });
  if (hasMissing) {
    saveMenuItems(validated);
  }
  return validated;
}

export function saveMenuItems(items: MenuItem[]): void {
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
}

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export function getLowStockThreshold(): number {
  const val = localStorage.getItem(STORAGE_KEYS.LOW_STOCK_THRESHOLD);
  if (!val) return DEFAULT_LOW_STOCK_THRESHOLD;
  const num = parseInt(val, 10);
  return isNaN(num) || num < 1 ? DEFAULT_LOW_STOCK_THRESHOLD : num;
}

export function saveLowStockThreshold(threshold: number): void {
  localStorage.setItem(STORAGE_KEYS.LOW_STOCK_THRESHOLD, threshold.toString());
}

export function getStaffList(): Staff[] {
  const data = localStorage.getItem(STORAGE_KEYS.STAFF);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
    return INITIAL_STAFF;
  }
  return JSON.parse(data);
}

export function saveStaffList(staff: Staff[]): void {
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
}

export function getCurrentStaffId(): number {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_STAFF_ID);
  return data ? parseInt(data, 10) : 1;
}

export function saveCurrentStaffId(id: number): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_STAFF_ID, id.toString());
}

export function generateSampleWeeklyBills(): BillWithItems[] {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sampleBills: BillWithItems[] = [];
  const items = INITIAL_MENU_ITEMS;

  // Generate 2-4 orders per day from Monday up to today with valid MEZBAAN item IDs (1..31)
  const daysCount = currentDay === 0 ? 7 : currentDay;
  const dailyPlans = [
    { dayOffset: 0, orders: [{ items: [1, 21, 26], mode: 'CASH', staff: 'Cashier 1', hour: 12, min: 20 }, { items: [6, 25], mode: 'UPI', staff: 'Cashier 2', hour: 14, min: 45 }, { items: [11, 22, 26], mode: 'UPI', staff: 'Cashier 1', hour: 20, min: 10 }] },
    { dayOffset: 1, orders: [{ items: [3, 22, 27], mode: 'UPI', staff: 'Cashier 1', hour: 13, min: 15 }, { items: [9, 21, 25], mode: 'CASH', staff: 'Admin', hour: 16, min: 30 }, { items: [16, 23], mode: 'UPI', staff: 'Cashier 2', hour: 19, min: 50 }, { items: [17, 26], mode: 'CASH', staff: 'Cashier 1', hour: 21, min: 15 }] },
    { dayOffset: 2, orders: [{ items: [4, 21], mode: 'CASH', staff: 'Cashier 2', hour: 12, min: 30 }, { items: [7, 25], mode: 'UPI', staff: 'Cashier 1', hour: 15, min: 10 }, { items: [14, 22, 27], mode: 'UPI', staff: 'Cashier 2', hour: 19, min: 40 }] },
    { dayOffset: 3, orders: [{ items: [2, 21, 26], mode: 'UPI', staff: 'Cashier 1', hour: 13, min: 40 }, { items: [1, 28], mode: 'CASH', staff: 'Cashier 1', hour: 17, min: 25 }, { items: [10, 23, 31], mode: 'UPI', staff: 'Admin', hour: 20, min: 35 }] },
    { dayOffset: 4, orders: [{ items: [5, 22, 25], mode: 'CASH', staff: 'Cashier 2', hour: 13, min: 10 }, { items: [8, 26], mode: 'UPI', staff: 'Cashier 1', hour: 18, min: 20 }, { items: [13, 14, 30], mode: 'UPI', staff: 'Cashier 2', hour: 20, min: 50 }, { items: [18, 29], mode: 'CASH', staff: 'Admin', hour: 21, min: 40 }] },
    { dayOffset: 5, orders: [{ items: [9, 23, 26], mode: 'UPI', staff: 'Cashier 1', hour: 14, min: 15 }, { items: [1, 2, 21, 25], mode: 'CASH', staff: 'Cashier 1', hour: 18, min: 30 }, { items: [11, 15, 22, 26], mode: 'UPI', staff: 'Cashier 2', hour: 21, min: 10 }] },
    { dayOffset: 6, orders: [{ items: [4, 5, 26], mode: 'UPI', staff: 'Admin', hour: 13, min: 15 }, { items: [5, 23, 31], mode: 'CASH', staff: 'Cashier 2', hour: 18, min: 50 }] }
  ];

  let billCounter = 10;
  for (let d = 0; d < Math.min(daysCount, dailyPlans.length); d++) {
    const plan = dailyPlans[d];
    if (!plan) continue;
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + plan.dayOffset);

    for (const ord of plan.orders) {
      billCounter++;
      const orderDate = new Date(dayDate);
      orderDate.setHours(ord.hour, ord.min, 0, 0);
      const timestamp = orderDate.getTime();
      const billId = timestamp + billCounter;

      const orderItems: BillItem[] = ord.items.map((itId, idx) => {
        const found = items.find(i => i.id === itId) || items[0];
        return {
          id: billId + idx + 1,
          billId,
          itemId: found.id,
          itemName: found.name,
          quantity: 1,
          unitPrice: found.price,
          lineTotal: found.price
        };
      });

      const subtotal = orderItems.reduce((acc, i) => acc + i.lineTotal, 0);
      const taxRate = 5.0;
      const taxAmount = Math.round((subtotal * 0.05) * 100) / 100;
      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
      const paymentMode = ord.mode as PaymentMode;

      const dateStr = `${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}`;
      const bill: Bill = {
        id: billId,
        billNumber: `MZB-${dateStr}-${String(billCounter).padStart(4, '0')}`,
        timestamp,
        subtotal,
        taxRate,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        paymentMode,
        cashReceived: paymentMode === 'CASH' ? Math.ceil(totalAmount / 50) * 50 : null,
        changeGiven: paymentMode === 'CASH' ? (Math.ceil(totalAmount / 50) * 50) - totalAmount : null,
        staffName: ord.staff,
        itemCount: orderItems.length,
        gstin: DEFAULT_GSTIN
      };

      sampleBills.push({ bill, items: orderItems });
    }
  }

  sampleBills.sort((a, b) => b.bill.timestamp - a.bill.timestamp);
  return sampleBills;
}

export function getBills(): BillWithItems[] {
  const data = localStorage.getItem(STORAGE_KEYS.BILLS);
  if (!data) {
    const samples = generateSampleWeeklyBills();
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(samples));
    return samples;
  }
  const parsed: BillWithItems[] = JSON.parse(data);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    const samples = generateSampleWeeklyBills();
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(samples));
    return samples;
  }
  return parsed;
}

export function generateNextBillNumber(): string {
  const today = formatDateForBillId();
  const key = `${STORAGE_KEYS.DAILY_COUNTER_PREFIX}${today}`;
  const currentCount = parseInt(localStorage.getItem(key) || '0', 10);
  const nextCount = currentCount + 1;
  localStorage.setItem(key, nextCount.toString());
  return `MZB-${today}-${nextCount.toString().padStart(4, '0')}`;
}

export function createBillTransaction(
  subtotal: number,
  taxRate: number,
  taxAmount: number,
  discountAmount: number,
  totalAmount: number,
  paymentMode: PaymentMode,
  cashReceived: number | null,
  changeGiven: number | null,
  staffName: string,
  cartLines: CartLine[]
): ReceiptData {
  const billNumber = generateNextBillNumber();
  const timestamp = Date.now();
  const billId = timestamp;
  const currentGstin = getRestaurantGstin();

  const bill = {
    id: billId,
    billNumber,
    timestamp,
    subtotal,
    taxRate,
    taxAmount,
    discountAmount,
    totalAmount,
    paymentMode,
    cashReceived,
    changeGiven,
    staffName,
    itemCount: cartLines.reduce((acc, line) => acc + line.quantity, 0),
    gstin: currentGstin
  };

  const billItems = cartLines.map((line, index) => ({
    id: timestamp + index + 1,
    billId,
    itemId: line.itemId,
    itemName: line.name,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal
  }));

  const allBills = getBills();
  allBills.unshift({ bill, items: billItems });
  localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(allBills));

  return {
    billNumber,
    timestampMillis: timestamp,
    lines: cartLines.map(line => ({
      name: line.name,
      qty: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal
    })),
    subtotal,
    taxRate,
    taxAmount,
    discountAmount,
    total: totalAmount,
    paymentMode,
    cashReceived,
    changeGiven,
    staffName,
    gstin: currentGstin
  };
}
