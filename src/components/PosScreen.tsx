import React, { useState, useMemo, useEffect } from 'react';
import { Category, MenuItem, CartLine, PaymentMode, ViewMode, Staff, ReceiptData } from '../types';
import { formatPrice } from '../utils/format';
import { FoodItemImage } from './FoodItemImage';
import { getGstEnabled, saveGstEnabled, getGstRate } from '../data/storage';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  UtensilsCrossed,
  ArrowRight
} from 'lucide-react';

interface PosScreenProps {
  categories: Category[];
  menuItems: MenuItem[];
  currentStaff: Staff;
  onOrderPlaced: (receipt: ReceiptData) => void;
  createOrderTransaction: (
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
  ) => ReceiptData;
}

export const PosScreen: React.FC<PosScreenProps> = ({
  categories,
  menuItems,
  currentStaff,
  onOrderPlaced,
  createOrderTransaction
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('GRID');
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [cashReceivedText, setCashReceivedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Flexible GST Toggle (persisted across sessions) and editable GST rate
  const [applyGst, setApplyGst] = useState<boolean>(() => getGstEnabled());
  const [gstRate, setGstRate] = useState<number>(() => getGstRate());

  useEffect(() => {
    const handleSyncGst = () => {
      setApplyGst(getGstEnabled());
      setGstRate(getGstRate());
    };

    window.addEventListener('storage', handleSyncGst);
    window.addEventListener('mezban_gst_rate_changed', handleSyncGst);
    window.addEventListener('mezban_gst_enabled_changed', handleSyncGst);

    return () => {
      window.removeEventListener('storage', handleSyncGst);
      window.removeEventListener('mezban_gst_rate_changed', handleSyncGst);
      window.removeEventListener('mezban_gst_enabled_changed', handleSyncGst);
    };
  }, []);

  const handleOpenCheckout = () => {
    setApplyGst(getGstEnabled());
    setGstRate(getGstRate());
    setIsCheckoutOpen(true);
  };

  const handleToggleGst = (enabled: boolean) => {
    setApplyGst(enabled);
    saveGstEnabled(enabled);
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (selectedCategoryId !== null) {
      items = items.filter(item => item.categoryId === selectedCategoryId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(item => item.name.toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, selectedCategoryId, searchQuery]);

  // Cart calculations
  const cartLines = useMemo(() => {
    return Object.values(cart).sort((a, b) => a.name.localeCompare(b.name));
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cartLines.reduce((sum, line) => sum + line.quantity, 0);
  }, [cartLines]);

  const subtotal = useMemo(() => {
    return cartLines.reduce((sum, line) => sum + line.lineTotal, 0);
  }, [cartLines]);

  const discountAmount = useMemo(() => {
    return subtotal * (discountPercent / 100);
  }, [subtotal, discountPercent]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = applyGst ? gstRate : 0.0;
  const taxAmount = applyGst ? taxableAmount * (taxRate / 100) : 0.0;
  const total = Math.max(0, taxableAmount + taxAmount);

  const cashReceived = parseFloat(cashReceivedText) || null;
  const changeDue = paymentMode === 'CASH' && cashReceived !== null
    ? Math.max(0, cashReceived - total)
    : null;

  const canPlaceOrder = useMemo(() => {
    if (cartLines.length === 0) return false;
    if (paymentMode === 'CASH') {
      if (cashReceived === null) return false;
      return cashReceived >= total;
    }
    return true;
  }, [cartLines.length, paymentMode, cashReceived, total]);

  // Quick cash suggestion amounts
  const quickCashOptions = useMemo(() => {
    if (total <= 0) return [];
    const rounded = Math.ceil(total / 10) * 10;
    const list = [total, rounded, rounded + 50, rounded + 100];
    return Array.from(new Set(list)).slice(0, 4);
  }, [total]);

  // Cart Handlers
  const handleIncrementItem = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart(prev => {
      const existing = prev[item.id];
      if (existing) {
        return {
          ...prev,
          [item.id]: {
            ...existing,
            quantity: existing.quantity + 1,
            lineTotal: (existing.quantity + 1) * existing.unitPrice
          }
        };
      }
      return {
        ...prev,
        [item.id]: {
          itemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
          isVeg: item.isVeg,
          lineTotal: item.price
        }
      };
    });
  };

  const handleDecrementItem = (itemId: number) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity: existing.quantity - 1,
          lineTotal: (existing.quantity - 1) * existing.unitPrice
        }
      };
    });
  };

  const handleClearCart = () => {
    setCart({});
    setDiscountPercent(0);
    setCashReceivedText('');
    setPaymentMode('CASH');
  };

  const handlePlaceOrder = () => {
    if (!canPlaceOrder || isProcessing) return;
    setIsProcessing(true);
    try {
      const receipt = createOrderTransaction(
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        total,
        paymentMode,
        cashReceived,
        changeDue,
        currentStaff.name,
        cartLines
      );
      handleClearCart();
      setIsCheckoutOpen(false);
      onOrderPlaced(receipt);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-115px)] lg:h-[calc(100vh-56px)] overflow-hidden">
      {/* LEFT SECTION: MENU & ITEMS (65% width on desktop) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FA]">
        {/* Search and View Mode Toggle */}
        <div className="p-3 sm:p-4 bg-white border-b border-[#E2E4E8] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B75]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu items..."
              className="w-full pl-9.5 pr-4 py-2 bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl text-sm text-[#1E1E24] placeholder:text-[#6B6B75] focus:outline-hidden focus:border-[#1E1E24] transition-colors"
            />
          </div>

          <div className="flex items-center bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              title="Grid View"
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'GRID'
                  ? 'bg-[#1E1E24] text-white'
                  : 'text-[#6B6B75] hover:text-[#1E1E24]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              title="List View"
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'LIST'
                  ? 'bg-[#1E1E24] text-white'
                  : 'text-[#6B6B75] hover:text-[#1E1E24]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills Row */}
        <div className="px-3 sm:px-4 py-2.5 bg-white border-b border-[#E2E4E8] overflow-x-auto no-scrollbar flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryId === null
                ? 'bg-[#1E1E24] text-white shadow-xs'
                : 'bg-[#F8F9FA] text-[#6B6B75] border border-[#E2E4E8] hover:border-neutral-400'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#1E1E24] text-white shadow-xs'
                    : 'bg-[#F8F9FA] text-[#6B6B75] border border-[#E2E4E8] hover:border-neutral-400'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Menu Items Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-36 sm:pb-40">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <UtensilsCrossed className="w-12 h-12 text-[#6B6B75]/40 mb-3" />
              <p className="text-base font-semibold text-[#1E1E24]">No items found</p>
              <p className="text-xs text-[#6B6B75] mt-1">Try another category or search query</p>
            </div>
          ) : viewMode === 'GRID' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const qty = cart[item.id]?.quantity || 0;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border border-[#E2E4E8] overflow-hidden flex flex-col transition-all hover:shadow-md ${
                      !item.isAvailable ? 'opacity-50 grayscale' : ''
                    }`}
                  >
                    {/* Item Card Minimalist Color-Card Banner */}
                    <div className="relative group overflow-hidden">
                      <FoodItemImage
                        name={item.name}
                        isVeg={item.isVeg}
                        categoryId={item.categoryId}
                        imageUrl={item.imageUrl}
                        aspectRatio="banner"
                      />

                      {/* Availability badge */}
                      {!item.isAvailable ? (
                        <span className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs z-10">
                          Out of Stock
                        </span>
                      ) : (item.stockQuantity !== undefined && item.stockQuantity <= 5) ? (
                        <span className="absolute top-2 right-2 bg-amber-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs z-10">
                          {item.stockQuantity} left
                        </span>
                      ) : null}

                      {/* Stepper on banner bottom right */}
                      {item.isAvailable && (
                        <div className="absolute bottom-2 right-2 z-10">
                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleIncrementItem(item)}
                              className="w-8 h-8 rounded-full bg-[#1E1E24]/90 backdrop-blur-xs text-white flex items-center justify-center hover:bg-black active:scale-90 transition-all shadow-md"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex items-center bg-[#1E1E24]/95 backdrop-blur-xs rounded-full text-white px-1 shadow-md h-8 border border-white/10">
                              <button
                                type="button"
                                onClick={() => handleDecrementItem(item.id)}
                                className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-full"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold px-1.5">{qty}</span>
                              <button
                                type="button"
                                onClick={() => handleIncrementItem(item)}
                                className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-full"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#1E1E24] line-clamp-2 leading-tight">
                        {item.name}
                      </h4>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm sm:text-base font-bold text-[#FF6B35]">
                          ₹{formatPrice(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const qty = cart[item.id]?.quantity || 0;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border border-[#E2E4E8] p-3 flex items-center justify-between gap-3 ${
                      !item.isAvailable ? 'opacity-50 grayscale' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FoodItemImage
                        name={item.name}
                        isVeg={item.isVeg}
                        categoryId={item.categoryId}
                        imageUrl={item.imageUrl}
                        aspectRatio="thumb"
                        className="rounded-lg shadow-2xs"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-semibold text-[#1E1E24] truncate">
                            {item.name}
                          </h4>
                          {!item.isAvailable ? (
                            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded-sm">
                              Out
                            </span>
                          ) : (item.stockQuantity !== undefined && item.stockQuantity <= 5) ? (
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">
                              {item.stockQuantity} left
                            </span>
                          ) : null}
                        </div>
                        <span className="text-sm font-bold text-[#FF6B35]">
                          ₹{formatPrice(item.price)}
                        </span>
                      </div>
                    </div>

                    {item.isAvailable && (
                      <div className="shrink-0">
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleIncrementItem(item)}
                            className="px-3 py-1.5 rounded-lg bg-[#1E1E24] text-white text-xs font-semibold hover:bg-black transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        ) : (
                          <div className="flex items-center bg-[#1E1E24] rounded-lg text-white px-1 h-8">
                            <button
                              type="button"
                              onClick={() => handleDecrementItem(item.id)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-md"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold px-2">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleIncrementItem(item)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-md"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PERSISTENT ELEVATED FLOATING CART BAR (Immediately above Bottom Navigation Bar) */}
        {cartItemCount > 0 && (
          <div
            onClick={handleOpenCheckout}
            className="fixed z-45 bottom-[62px] sm:bottom-[76px] left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md lg:hidden bg-white/95 backdrop-blur-md border border-[#E2E4E8] rounded-2xl p-2.5 sm:p-3 shadow-2xl ring-1 ring-black/10 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            {/* Left side: "X Items • ₹Total" */}
            <div className="flex items-center gap-2.5 min-w-0 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-[#1E1E24] truncate">
                  {cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'} • <span className="text-[#FF6B35]">₹{formatPrice(total)}</span>
                </span>
                <span className="text-[10px] text-[#6B6B75] hidden xs:inline">
                  Tap to review order
                </span>
              </div>
            </div>

            {/* Right side: "View Cart / Checkout →" button (dark slate #1A1B20 with white text) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCheckout();
              }}
              className="py-2 px-3.5 sm:px-4 rounded-xl bg-[#1A1B20] text-white font-bold text-xs sm:text-sm hover:bg-black active:scale-95 transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <span>View Cart / Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SECTION: CART PANEL (Desktop 35% width) */}
      <div className="hidden lg:flex w-96 flex-col bg-white border-l border-[#E2E4E8] h-full">
        {/* Cart Header */}
        <div className="p-4 border-b border-[#E2E4E8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#1E1E24]" />
            <h3 className="font-bold text-[#1E1E24] text-base">Current Order</h3>
            {cartItemCount > 0 && (
              <span className="bg-[#1E1E24] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {cartItemCount}
              </span>
            )}
          </div>
          {cartItemCount > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="text-xs font-semibold text-[#C62828] hover:bg-red-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cartLines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#6B6B75] p-6">
              <ShoppingCart className="w-12 h-12 text-[#6B6B75]/30 mb-2" />
              <p className="font-semibold text-sm text-[#1E1E24]">Cart is empty</p>
              <p className="text-xs text-[#6B6B75] mt-1">Tap items from the menu to build an order</p>
            </div>
          ) : (
            cartLines.map((line) => (
              <div
                key={line.itemId}
                className="bg-[#F8F9FA] rounded-xl p-3 border border-[#E2E4E8] flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="font-semibold text-xs text-[#1E1E24] truncate">
                    {line.name}
                  </h5>
                  <p className="text-[11px] text-[#6B6B75] mt-0.5">
                    ₹{formatPrice(line.unitPrice)} × {line.quantity}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#FF6B35]">
                  ₹{formatPrice(line.lineTotal)}
                </span>
                <div className="flex items-center bg-white border border-[#E2E4E8] rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleDecrementItem(line.itemId)}
                    className="w-6 h-6 flex items-center justify-center text-[#1E1E24] hover:bg-neutral-100 rounded-l-lg"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold px-1.5">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleIncrementItem({
                      id: line.itemId,
                      categoryId: 0,
                      name: line.name,
                      price: line.unitPrice,
                      isVeg: line.isVeg,
                      isAvailable: true,
                      sortOrder: 0
                    })}
                    className="w-6 h-6 flex items-center justify-center text-[#1E1E24] hover:bg-neutral-100 rounded-r-lg"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary & Pay Button */}
        {cartLines.length > 0 && (
          <div className="p-4 border-t border-[#E2E4E8] bg-white space-y-2.5">
            {/* Discount Selector */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6B6B75] font-medium">Discount %</span>
              <div className="flex gap-1.5">
                {[0, 5, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      discountPercent === pct
                        ? 'bg-[#1E1E24] text-white'
                        : 'bg-[#F8F9FA] text-[#6B6B75] border border-[#E2E4E8] hover:border-neutral-400'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Flexible GST Toggle */}
            <div className="flex items-center justify-between text-xs py-1.5 border-t border-dashed border-[#E2E4E8]">
              <div className="flex items-center gap-1.5">
                <span className="text-[#1E1E24] font-medium">Apply GST ({gstRate}%)</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm transition-colors ${
                    applyGst
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {applyGst ? 'ON' : 'OFF'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={applyGst}
                onClick={() => handleToggleGst(!applyGst)}
                title={applyGst ? `Disable ${gstRate}% GST` : `Enable ${gstRate}% GST`}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  applyGst ? 'bg-[#1E1E24]' : 'bg-neutral-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    applyGst ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-[#6B6B75]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#1E1E24] font-medium">₹{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#C62828]">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-₹{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST ({taxRate}%)</span>
                <span className={`font-medium ${applyGst ? 'text-[#1E1E24]' : 'text-neutral-400'}`}>
                  ₹{formatPrice(taxAmount)}
                </span>
              </div>
              <div className="border-t border-[#E2E4E8] pt-2 flex justify-between items-center text-sm font-bold text-[#1E1E24]">
                <span>Total Amount</span>
                <span className="text-base text-[#FF6B35]">₹{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCheckout}
              className="w-full py-3 bg-[#1E1E24] text-white rounded-xl font-bold text-sm hover:bg-black active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Proceed to Pay • ₹{formatPrice(total)}</span>
            </button>
          </div>
        )}
      </div>

      {/* CHECKOUT MODAL / BOTTOM SHEET */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-[#E2E4E8] flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#1E1E24]">Complete Checkout</h3>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-[#6B6B75] hover:text-[#1E1E24] text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Order breakdown */}
              <div className="bg-[#F8F9FA] rounded-xl p-3.5 border border-[#E2E4E8] space-y-1.5 text-xs text-[#6B6B75]">
                <div className="flex justify-between">
                  <span>Items ({cartItemCount})</span>
                  <span className="text-[#1E1E24] font-medium">₹{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#C62828]">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-₹{formatPrice(discountAmount)}</span>
                  </div>
                )}
                {/* Interactive GST Toggle Switch */}
                <div className="py-2.5 px-3 bg-white rounded-lg border border-[#E2E4E8] flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#1E1E24]">Apply GST ({gstRate}%)</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                          applyGst
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {applyGst ? `ON (${gstRate}% applied)` : 'OFF (₹0.00 tax)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6B75] mt-0.5">
                      {applyGst ? `Standard ${gstRate}% restaurant GST added to total` : 'Amount payable excludes GST'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={applyGst}
                    onClick={() => handleToggleGst(!applyGst)}
                    title={applyGst ? `Disable ${gstRate}% GST` : `Enable ${gstRate}% GST`}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      applyGst ? 'bg-[#1E1E24]' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        applyGst ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex justify-between">
                  <span>GST ({taxRate}%)</span>
                  <span className={`font-medium ${applyGst ? 'text-[#1E1E24]' : 'text-neutral-400'}`}>
                    ₹{formatPrice(taxAmount)}
                  </span>
                </div>
                <div className="border-t border-[#E2E4E8] pt-2 flex justify-between items-center text-sm font-bold text-[#1E1E24]">
                  <span>Amount Payable</span>
                  <span className="text-base text-[#FF6B35]">₹{formatPrice(total)}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-[#1E1E24] uppercase tracking-wider mb-2">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'UPI', 'OTHER'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setPaymentMode(mode);
                        if (mode !== 'CASH') setCashReceivedText('');
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        paymentMode === mode
                          ? 'bg-[#1E1E24] text-white shadow-md'
                          : 'bg-[#F8F9FA] text-[#6B6B75] border border-[#E2E4E8] hover:border-neutral-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Calculator */}
              {paymentMode === 'CASH' && (
                <div className="space-y-3 bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E2E4E8]">
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B75] mb-1">
                      Cash Received (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1E1E24]">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={cashReceivedText}
                        onChange={(e) => setCashReceivedText(e.target.value)}
                        placeholder={total.toString()}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-[#E2E4E8] rounded-lg text-base font-bold text-[#1E1E24] focus:outline-hidden focus:border-[#1E1E24]"
                      />
                    </div>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickCashOptions.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setCashReceivedText(amount.toString())}
                        className="px-2.5 py-1 rounded-md bg-white border border-[#E2E4E8] text-xs font-semibold text-[#1E1E24] hover:bg-neutral-100 transition-colors"
                      >
                        ₹{formatPrice(amount)}
                      </button>
                    ))}
                  </div>

                  {/* Change Due */}
                  {changeDue !== null && (
                    <div className="pt-2 border-t border-[#E2E4E8] flex justify-between items-center text-xs">
                      <span className="text-[#6B6B75] font-medium">Change to return:</span>
                      <span className="text-sm font-bold text-[#FF6B35]">
                        ₹{formatPrice(changeDue)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-[#E2E4E8] bg-white">
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder || isProcessing}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  canPlaceOrder && !isProcessing
                    ? 'bg-[#1E1E24] text-white hover:bg-black active:scale-[0.99]'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <span>Generating Bill...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Place Order • ₹{formatPrice(total)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
