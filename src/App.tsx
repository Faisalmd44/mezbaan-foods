import { useState, useEffect } from 'react';
import {
  AppScreen,
  Category,
  MenuItem,
  Staff,
  BillWithItems,
  ReceiptData,
  PaymentMode,
  CartLine
} from './types';
import {
  getCategories,
  getMenuItems,
  saveMenuItems,
  getStaffList,
  saveStaffList,
  getCurrentStaffId,
  saveCurrentStaffId,
  getBills,
  createBillTransaction,
  seedMenu
} from './data/storage';
import { Navigation } from './components/Navigation';
import { PosScreen } from './components/PosScreen';
import { SalesScreen } from './components/SalesScreen';
import { MenuManageScreen } from './components/MenuManageScreen';
import { StaffScreen } from './components/StaffScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ReceiptModal } from './components/ReceiptModal';
import { BluetoothPrinterModal } from './components/BluetoothPrinterModal';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('POS');
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [currentStaffId, setCurrentStaffId] = useState<number>(1);
  const [bills, setBills] = useState<BillWithItems[]>([]);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState<boolean>(false);

  // Initialize data from storage
  useEffect(() => {
    const cats = getCategories();
    const items = getMenuItems();
    const staff = getStaffList();
    const staffId = getCurrentStaffId();
    const savedBills = getBills();

    setCategories(cats);
    setMenuItems(items);
    setStaffList(staff);
    setCurrentStaffId(staffId);
    setBills(savedBills);
  }, []);

  const currentStaff = staffList.find(s => s.id === currentStaffId) || {
    id: 1,
    name: 'Admin',
    pin: '1234',
    role: 'ADMIN',
    isActive: true
  };

  // Staff handlers
  const handleSwitchStaff = (staff: Staff) => {
    setCurrentStaffId(staff.id);
    saveCurrentStaffId(staff.id);
  };

  const handleAddStaff = (name: string, pin: string, role: 'ADMIN' | 'CASHIER') => {
    const newStaff: Staff = {
      id: Date.now(),
      name,
      pin,
      role,
      isActive: true
    };
    const updated = [...staffList, newStaff];
    setStaffList(updated);
    saveStaffList(updated);
  };

  // Menu item handlers
  const handleToggleAvailability = (itemId: number) => {
    const updated = menuItems.map(item => {
      if (item.id === itemId) {
        const nextAvail = !item.isAvailable;
        return {
          ...item,
          isAvailable: nextAvail,
          // If turning on availability but stock is 0, give it at least 5 units
          stockQuantity: nextAvail && (item.stockQuantity === 0 || item.stockQuantity === undefined)
            ? 5
            : item.stockQuantity
        };
      }
      return item;
    });
    setMenuItems(updated);
    saveMenuItems(updated);
  };

  const handleUpdateStock = (itemId: number, newStock: number) => {
    const clamped = Math.max(0, newStock);
    const updated = menuItems.map(item =>
      item.id === itemId
        ? {
            ...item,
            stockQuantity: clamped,
            isAvailable: clamped > 0 ? item.isAvailable : false
          }
        : item
    );
    setMenuItems(updated);
    saveMenuItems(updated);
  };

  const handleAddItem = (
    categoryId: number,
    name: string,
    price: number,
    isVeg: boolean,
    stockQuantity: number = 20,
    imageUrl?: string
  ) => {
    const newItem: MenuItem = {
      id: Date.now(),
      categoryId,
      name,
      price,
      isVeg,
      isAvailable: stockQuantity > 0,
      sortOrder: menuItems.length,
      stockQuantity,
      imageUrl: imageUrl?.trim() ? imageUrl.trim() : undefined
    };
    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    saveMenuItems(updated);
  };

  const handleResetOfficialMenu = () => {
    const seeded = seedMenu(true);
    setCategories(seeded.categories);
    setMenuItems(seeded.menuItems);
    setBills(getBills());
  };

  // Order transaction handler
  const handleCreateOrder = (
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
  ): ReceiptData => {
    const receipt = createBillTransaction(
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMode,
      cashReceived,
      changeGiven,
      staffName,
      cartLines
    );

    // Deduct stock for ordered items
    const updatedMenu = menuItems.map(item => {
      const line = cartLines.find(l => l.itemId === item.id);
      if (line) {
        const currentStock = item.stockQuantity ?? 15;
        const remaining = Math.max(0, currentStock - line.quantity);
        return {
          ...item,
          stockQuantity: remaining,
          isAvailable: remaining > 0 ? item.isAvailable : false
        };
      }
      return item;
    });
    setMenuItems(updatedMenu);
    saveMenuItems(updatedMenu);

    // Refresh bills list from storage
    setBills(getBills());
    return receipt;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      {/* Top Header & Bottom Navigation */}
      <Navigation
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        currentStaff={currentStaff}
        onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
      />

      {/* Screen Views */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentScreen === 'POS' && (
          <PosScreen
            categories={categories}
            menuItems={menuItems}
            currentStaff={currentStaff}
            onOrderPlaced={(receipt) => setLastReceipt(receipt)}
            createOrderTransaction={handleCreateOrder}
          />
        )}

        {currentScreen === 'SALES' && (
          <SalesScreen
            bills={bills}
            onSelectReceipt={(receipt) => setLastReceipt(receipt)}
          />
        )}

        {currentScreen === 'MENU' && (
          <MenuManageScreen
            categories={categories}
            menuItems={menuItems}
            onToggleAvailability={handleToggleAvailability}
            onAddItem={handleAddItem}
            onUpdateStock={handleUpdateStock}
            onResetOfficialMenu={handleResetOfficialMenu}
          />
        )}

        {currentScreen === 'STAFF' && (
          <StaffScreen
            staffList={staffList}
            currentStaff={currentStaff}
            onSwitchStaff={handleSwitchStaff}
            onAddStaff={handleAddStaff}
          />
        )}

        {currentScreen === 'SETTINGS' && (
          <SettingsScreen
            currentStaff={currentStaff}
            onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
            onResetOfficialMenu={handleResetOfficialMenu}
          />
        )}
      </main>

      {/* Thermal Receipt Modal */}
      {lastReceipt && (
        <ReceiptModal
          receipt={lastReceipt}
          onDismiss={() => setLastReceipt(null)}
          onNewSale={() => setLastReceipt(null)}
        />
      )}

      {/* Bluetooth Thermal Printer Manager Modal */}
      <BluetoothPrinterModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
      />
    </div>
  );
}

export default App;
