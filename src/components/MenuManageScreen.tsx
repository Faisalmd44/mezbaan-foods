import React, { useState } from 'react';
import { Category, MenuItem } from '../types';
import { formatPrice } from '../utils/format';
import { FoodItemImage } from './FoodItemImage';
import {
  getLowStockThreshold,
  saveLowStockThreshold
} from '../data/storage';
import {
  Plus,
  Minus,
  X,
  Utensils,
  AlertCircle,
  AlertTriangle,
  Sliders,
  Package,
  Layers,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface MenuManageScreenProps {
  categories: Category[];
  menuItems: MenuItem[];
  onToggleAvailability: (itemId: number) => void;
  onAddItem: (categoryId: number, name: string, price: number, isVeg: boolean, stockQuantity?: number, imageUrl?: string) => void;
  onUpdateStock?: (itemId: number, newStock: number) => void;
  onResetOfficialMenu?: () => void;
}

type StockFilter = 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export const MenuManageScreen: React.FC<MenuManageScreenProps> = ({
  categories,
  menuItems,
  onToggleAvailability,
  onAddItem,
  onUpdateStock,
  onResetOfficialMenu
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StockFilter>('ALL');

  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => getLowStockThreshold());
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  const [name, setName] = useState('');
  const [priceText, setPriceText] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [isVeg, setIsVeg] = useState(true);
  const [initialStockText, setInitialStockText] = useState('20');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleThresholdChange = (newVal: number) => {
    const clamped = Math.max(1, Math.min(100, newVal));
    setLowStockThreshold(clamped);
    saveLowStockThreshold(clamped);
  };

  const lowStockItems = menuItems.filter(item => {
    const qty = item.stockQuantity ?? 15;
    return item.isAvailable && qty <= lowStockThreshold && qty > 0;
  });

  const outOfStockItems = menuItems.filter(item => {
    const qty = item.stockQuantity ?? 15;
    return !item.isAvailable || qty === 0;
  });

  const filteredItems = menuItems.filter(item => {
    const qty = item.stockQuantity ?? 15;
    const isOut = !item.isAvailable || qty === 0;
    const isLow = item.isAvailable && qty <= lowStockThreshold && qty > 0;

    if (selectedCategoryFilter !== null && item.categoryId !== selectedCategoryFilter) {
      return false;
    }

    if (statusFilter === 'LOW_STOCK' && !isLow) {
      return false;
    }
    if (statusFilter === 'OUT_OF_STOCK' && !isOut) {
      return false;
    }

    return true;
  });

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an item name');
      return;
    }
    const p = parseFloat(priceText);
    if (isNaN(p) || p <= 0) {
      setError('Please provide a valid price');
      return;
    }

    const stock = parseInt(initialStockText, 10);
    const validStock = isNaN(stock) || stock < 0 ? 20 : stock;

    onAddItem(categoryId, name.trim(), p, isVeg, validStock, imageUrl.trim() || undefined);
    setShowAddDialog(false);
    setName('');
    setPriceText('');
    setInitialStockText('20');
    setImageUrl('');
    setError(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full pb-safe-nav">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E1E24] tracking-tight">Menu Stock & Inventory</h2>
          <p className="text-xs text-[#6B6B75] mt-0.5">
            Monitor real-time kitchen inventory, stock warnings, and availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onResetOfficialMenu && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset database to strictly MEZBAAN official menu (31 items across 7 categories)?')) {
                  onResetOfficialMenu();
                }
              }}
              className="py-2 px-3 rounded-xl text-xs font-semibold border border-[#E2E4E8] bg-white text-[#1E1E24] hover:bg-neutral-50 transition-all flex items-center gap-1.5 shadow-2xs"
              title="Reset to official MEZBAAN menu (Destructive Room DB Re-seed)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span>Reset Official Menu</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowThresholdConfig(!showThresholdConfig)}
            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              showThresholdConfig
                ? 'bg-[#1E1E24] text-white border-[#1E1E24]'
                : 'bg-white text-[#1E1E24] border-[#E2E4E8] hover:bg-[#F8F9FA]'
            }`}
            title="Configure Low Stock Warning Threshold"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Alert Threshold ({lowStockThreshold} units)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddDialog(true)}
            className="py-2 px-3.5 bg-[#FF6B35] text-white rounded-xl text-xs font-bold hover:bg-[#E55A2B] transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Item</span>
          </button>
        </div>
      </div>

      {showThresholdConfig && (
        <div className="mb-4 p-4 bg-white rounded-2xl border border-[#E2E4E8] shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E1E24]">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Configurable 'Low Stock' Warning Threshold</span>
              </div>
              <p className="text-xs text-[#6B6B75] mt-0.5">
                Items with stock quantity equal to or below this threshold display the warning badge and row highlight.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleThresholdChange(lowStockThreshold - 1)}
                  disabled={lowStockThreshold <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[#1E1E24] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Decrease threshold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="px-3 text-center">
                  <span className="text-sm font-bold text-[#1E1E24]">{lowStockThreshold}</span>
                  <span className="text-[10px] text-[#6B6B75] ml-1 font-medium">units</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleThresholdChange(lowStockThreshold + 1)}
                  disabled={lowStockThreshold >= 100}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[#1E1E24] disabled:opacity-30 transition-colors"
                  title="Increase threshold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-1">
                {[3, 5, 8, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleThresholdChange(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      lowStockThreshold === preset
                        ? 'bg-[#1E1E24] text-white'
                        : 'bg-[#F8F9FA] text-[#6B6B75] border border-[#E2E4E8] hover:bg-neutral-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5 mb-3.5">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'bg-[#1E1E24] text-white border-[#1E1E24] shadow-xs'
              : 'bg-white text-[#1E1E24] border-[#E2E4E8] hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${statusFilter === 'ALL' ? 'text-white/80' : 'text-[#6B6B75]'}`}>
              Total Items
            </span>
            <Layers className={`w-3.5 h-3.5 ${statusFilter === 'ALL' ? 'text-white/60' : 'text-[#6B6B75]'}`} />
          </div>
          <p className="text-lg font-bold mt-0.5">{menuItems.length}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('LOW_STOCK')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'LOW_STOCK'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : lowStockItems.length > 0
              ? 'bg-amber-50/70 border-amber-300 text-amber-900 hover:bg-amber-100/70'
              : 'bg-white text-[#1E1E24] border-[#E2E4E8] hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${statusFilter === 'LOW_STOCK' ? 'text-white' : 'text-amber-800'}`}>
              Low Stock (≤{lowStockThreshold})
            </span>
            <AlertTriangle className={`w-3.5 h-3.5 ${statusFilter === 'LOW_STOCK' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <p className="text-lg font-bold mt-0.5">{lowStockItems.length}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('OUT_OF_STOCK')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'OUT_OF_STOCK'
              ? 'bg-[#C62828] text-white border-[#C62828] shadow-xs'
              : outOfStockItems.length > 0
              ? 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100'
              : 'bg-white text-[#1E1E24] border-[#E2E4E8] hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${statusFilter === 'OUT_OF_STOCK' ? 'text-white' : 'text-red-700'}`}>
              Out of Stock
            </span>
            <AlertCircle className={`w-3.5 h-3.5 ${statusFilter === 'OUT_OF_STOCK' ? 'text-white' : 'text-red-600'}`} />
          </div>
          <p className="text-lg font-bold mt-0.5">{outOfStockItems.length}</p>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategoryFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategoryFilter === null
              ? 'bg-[#1E1E24] text-white'
              : 'bg-white text-[#6B6B75] border border-[#E2E4E8] hover:bg-[#F8F9FA]'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => {
          const count = menuItems.filter(i => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoryFilter === cat.id
                  ? 'bg-[#1E1E24] text-white'
                  : 'bg-white text-[#6B6B75] border border-[#E2E4E8] hover:bg-[#F8F9FA]'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {(statusFilter !== 'ALL' || selectedCategoryFilter !== null) && (
        <div className="flex items-center justify-between mb-3 px-2 text-xs text-[#6B6B75]">
          <span>
            Showing <strong className="text-[#1E1E24]">{filteredItems.length}</strong> {statusFilter === 'LOW_STOCK' ? 'low stock' : statusFilter === 'OUT_OF_STOCK' ? 'out of stock' : ''} items
          </span>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setSelectedCategoryFilter(null);
            }}
            className="text-[#FF6B35] font-semibold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E4E8] p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#2E7D32] mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-[#1E1E24]">No items found</h4>
            <p className="text-xs text-[#6B6B75] mt-1">
              {statusFilter === 'LOW_STOCK'
                ? `All items currently have healthy inventory (> ${lowStockThreshold} units).`
                : statusFilter === 'OUT_OF_STOCK'
                ? 'No items are currently out of stock.'
                : 'No items match your selected filter.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const categoryName = categories.find((c) => c.id === item.categoryId)?.name || '';
            const quantity = item.stockQuantity ?? 15;
            const isOutOfStock = !item.isAvailable || quantity === 0;
            const isLowStock = !isOutOfStock && quantity <= lowStockThreshold;

            return (
              <div
                key={item.id}
                className={`rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isLowStock
                    ? 'bg-amber-50/70 border border-amber-300 ring-1 ring-amber-200/70 shadow-xs hover:border-amber-400'
                    : isOutOfStock
                    ? 'bg-red-50/40 border border-red-200/80 hover:border-red-300 opacity-90'
                    : 'bg-white border border-[#E2E4E8] hover:border-neutral-300 shadow-xs'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <FoodItemImage
                    name={item.name}
                    isVeg={item.isVeg}
                    categoryId={item.categoryId}
                    imageUrl={item.imageUrl}
                    aspectRatio="thumb"
                    className="w-12 h-12 rounded-lg border border-[#E2E4E8] shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-[#1E1E24] truncate">{item.name}</h4>
                      <span className="text-[10px] text-[#6B6B75] bg-[#F8F9FA] px-2 py-0.5 rounded-md border border-[#E2E4E8]">
                        {categoryName}
                      </span>

                      {isLowStock && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300/80 shadow-2xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Low Stock ({quantity} left)</span>
                        </span>
                      )}

                      {isOutOfStock && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>Out of Stock</span>
                        </span>
                      )}

                      {!isLowStock && !isOutOfStock && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-[#6B6B75] bg-[#F8F9FA] border border-[#E2E4E8]">
                          <Package className="w-3 h-3 text-[#6B6B75]" />
                          <span>{quantity} units</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-bold text-[#FF6B35]">
                        ₹{formatPrice(item.price)}
                      </span>
                      {isLowStock && (
                        <span className="text-[11px] text-amber-700 font-medium">
                          Requires restocking soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2E4E8]/60 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#6B6B75] font-semibold hidden md:inline">Stock:</span>
                    <div className="flex items-center bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateStock?.(item.id, Math.max(0, quantity - 1))}
                        disabled={quantity <= 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[#1E1E24] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Reduce stock by 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-9 text-center">
                        <span className={`text-xs font-bold ${isLowStock ? 'text-amber-800' : isOutOfStock ? 'text-red-600' : 'text-[#1E1E24]'}`}>
                          {quantity}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onUpdateStock?.(item.id, quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[#1E1E24] transition-colors"
                        title="Add 1 to stock"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2 border-l border-[#E2E4E8]">
                    <span
                      className={`text-xs font-semibold ${
                        item.isAvailable && quantity > 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'
                      }`}
                    >
                      {item.isAvailable && quantity > 0 ? 'Available' : 'Disabled'}
                    </span>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isAvailable && quantity > 0}
                        onChange={() => onToggleAvailability(item.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E1E24]"></div>
                    </label>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#E2E4E8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#FF6B35]" />
                <h3 className="font-bold text-[#1E1E24] text-base">Add Quick Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDialog(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-4 space-y-3.5">
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1E1E24] mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Crispy Paneer Wrap"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl text-sm text-[#1E1E24] focus:outline-hidden focus:border-[#1E1E24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1E1E24] mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                    placeholder="99"
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl text-sm text-[#1E1E24] focus:outline-hidden focus:border-[#1E1E24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E1E24] mb-1">
                    Initial Stock (units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialStockText}
                    onChange={(e) => setInitialStockText(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl text-sm text-[#1E1E24] focus:outline-hidden focus:border-[#1E1E24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1E24] mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl text-sm text-[#1E1E24] focus:outline-hidden focus:border-[#1E1E24]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1E24] mb-1">
                  Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVeg(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      isVeg
                        ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                        : 'bg-[#F8F9FA] text-[#6B6B75] border-[#E2E4E8]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>Vegetarian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVeg(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      !isVeg
                        ? 'bg-[#C62828] text-white border-[#C62828]'
                        : 'bg-[#F8F9FA] text-[#6B6B75] border-[#E2E4E8]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1E24] mb-1">
                  Photo URL <span className="text-[#6B6B75] font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (or leave blank to auto-detect)"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl text-xs text-[#1E1E24] placeholder:text-[#6B6B75] focus:outline-hidden focus:border-[#1E1E24]"
                />
                <p className="text-[11px] text-[#6B6B75] mt-1">
                  Leave blank to auto-match high-res food photo based on item name.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E2E4E8] text-xs font-semibold text-[#6B6B75] hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1E1E24] text-white text-xs font-bold hover:bg-black"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
