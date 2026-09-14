import React, { useState } from 'react';
import { Staff } from '../types';
import {
  Percent,
  Sliders,
  Printer,
  RotateCcw,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  getLowStockThreshold,
  saveLowStockThreshold,
  getGstEnabled,
  saveGstEnabled,
  getGstRate,
  saveGstRate,
  getRestaurantGstin,
  saveRestaurantGstin
} from '../data/storage';
import { bluetoothPrinterService } from '../utils/bluetoothPrinterService';

interface SettingsScreenProps {
  currentStaff: Staff;
  onOpenPrinterModal: () => void;
  onResetOfficialMenu: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentStaff,
  onOpenPrinterModal,
  onResetOfficialMenu
}) => {
  const [gstEnabled, setGstEnabledState] = useState<boolean>(() => getGstEnabled());
  const [gstRate, setGstRateState] = useState<number>(() => getGstRate());
  const [gstRateInput, setGstRateInput] = useState<string>(() => getGstRate().toString());
  const [gstin, setGstin] = useState<string>(() => getRestaurantGstin());
  const [gstinInput, setGstinInput] = useState<string>(() => getRestaurantGstin());
  const [gstinError, setGstinError] = useState<string | null>(null);
  const [lowStockThreshold, setLowStockThresholdState] = useState<number>(() => getLowStockThreshold());
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const printerState = bluetoothPrinterService.getState();

  const handleToggleGst = () => {
    const next = !gstEnabled;
    setGstEnabledState(next);
    saveGstEnabled(next);
    localStorage.setItem('mezban_apply_gst', String(next));
    showFeedback(next ? `GST (${gstRate}%) calculation enabled` : 'GST disabled (0%)');
  };

  const handleGstRateChange = (val: string) => {
    setGstRateInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      setGstRateState(parsed);
      saveGstRate(parsed);
    }
  };

  const handleGstRateBlur = () => {
    const parsed = parseFloat(gstRateInput);
    if (isNaN(parsed) || parsed < 0) {
      setGstRateInput(gstRate.toString());
    } else {
      const clamped = Math.max(0, Math.min(100, Math.round(parsed * 100) / 100));
      setGstRateState(clamped);
      setGstRateInput(clamped.toString());
      saveGstRate(clamped);
      showFeedback(`GST rate updated to ${clamped}%`);
    }
  };

  const handleGstRatePreset = (preset: number) => {
    setGstRateState(preset);
    setGstRateInput(preset.toString());
    saveGstRate(preset);
    showFeedback(`GST rate set to ${preset}%`);
  };

  const handleThresholdChange = (newVal: number) => {
    const clamped = Math.max(1, Math.min(100, newVal));
    setLowStockThresholdState(clamped);
    saveLowStockThreshold(clamped);
    showFeedback(`Low stock warning threshold set to ${clamped} units`);
  };

  const handleSaveGstin = () => {
    if (currentStaff.role !== 'ADMIN') return;
    const trimmed = gstinInput.trim().toUpperCase();

    // Basic 15-character GSTIN validation if not blank
    if (trimmed !== '') {
      const is15AlphaNum = /^[0-9A-Z]{15}$/.test(trimmed);
      if (!is15AlphaNum) {
        setGstinError('GSTIN must be 15 alphanumeric characters (or left blank)');
        return;
      }
    }

    setGstinError(null);
    setGstin(trimmed);
    setGstinInput(trimmed);
    saveRestaurantGstin(trimmed);
    showFeedback(trimmed ? `GSTIN updated to ${trimmed}` : 'GSTIN cleared');
  };

  const handleGstinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveGstin();
    }
  };

  const showFeedback = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => {
      setSavedFeedback(null);
    }, 2800);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full pb-24">
      {/* Screen Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E1E24] tracking-tight">Settings</h2>
          <p className="text-xs text-[#6B6B75] mt-0.5">
            Configure taxes, stock warnings, thermal printers, and restaurant defaults
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E1E24]/5 border border-[#E2E4E8] text-xs font-semibold text-[#1E1E24]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{currentStaff.role} Mode</span>
        </div>
      </div>

      {/* Floating feedback toast */}
      {savedFeedback && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{savedFeedback}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* 1. Tax & Billing Settings */}
        <div className="bg-white rounded-2xl border border-[#E2E4E8] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#E2E4E8]">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35]">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1E24]">Tax & Billing Policy</h3>
              <p className="text-[11px] text-[#6B6B75]">Goods and Services Tax computation on bills</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="max-w-[75%]">
              <span className="text-xs font-bold text-[#1E1E24] block">
                Enable GST Calculation
              </span>
              <p className="text-[11px] text-[#6B6B75] mt-0.5">
                Automatically compute configured GST ({gstRate}%) on taxable food subtotal. When disabled, bills calculate at 0% tax.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={gstEnabled}
              onClick={handleToggleGst}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                gstEnabled ? 'bg-[#1E1E24]' : 'bg-neutral-300'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  gstEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Editable GST Percentage */}
          <div className="pt-3 mt-3 border-t border-[#E2E4E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label htmlFor="gst-percentage-input" className="text-xs font-bold text-[#1E1E24] block cursor-pointer">
                GST Rate Percentage (%)
              </label>
              <p className="text-[11px] text-[#6B6B75] mt-0.5">
                Configured tax rate applied across billing calculations and printed thermal receipts.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl px-2.5 py-1 focus-within:border-[#1E1E24] focus-within:bg-white transition-colors">
                <input
                  id="gst-percentage-input"
                  name="gstPercentage"
                  aria-label="GST Percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={gstRateInput}
                  onChange={(e) => handleGstRateChange(e.target.value)}
                  onBlur={handleGstRateBlur}
                  className="w-14 bg-transparent text-sm font-bold text-[#1E1E24] text-right focus:outline-hidden"
                  placeholder="5"
                />
                <span className="text-xs font-bold text-[#6B6B75] ml-1">%</span>
              </div>

              <div className="flex gap-1">
                {[0, 5, 12, 18].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleGstRatePreset(preset)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      gstRate === preset
                        ? 'bg-[#1E1E24] text-white'
                        : 'bg-[#F8F9FA] text-[#6B6B75] border border-[#E2E4E8] hover:bg-neutral-100'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Stock & Inventory Warning Settings */}
        <div className="bg-white rounded-2xl border border-[#E2E4E8] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#E2E4E8]">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1E24]">Stock Alert Threshold</h3>
              <p className="text-[11px] text-[#6B6B75]">Low inventory warning level for kitchen items</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#1E1E24] block">
                Warning Threshold
              </span>
              <p className="text-[11px] text-[#6B6B75] mt-0.5">
                Items with stock equal to or less than this quantity will trigger amber warning badges in Billing & Menu screens.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleThresholdChange(lowStockThreshold - 1)}
                  disabled={lowStockThreshold <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[#1E1E24] disabled:opacity-30 transition-colors"
                >
                  -
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
                >
                  +
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

        {/* 3. Thermal Receipt Printer Configuration */}
        <div className="bg-white rounded-2xl border border-[#E2E4E8] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2E4E8]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E1E24]">Thermal Printers</h3>
                <p className="text-[11px] text-[#6B6B75]">Bluetooth ESC/POS roll & device manager</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPrinterModal}
              className="py-1.5 px-3 rounded-xl bg-[#1E1E24] text-white text-xs font-semibold hover:bg-black transition-all flex items-center gap-1 shadow-2xs"
            >
              <span>Manage Printers</span>
            </button>
          </div>

          <div className="bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  printerState.activePrinter?.isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <div>
                <span className="font-bold text-[#1E1E24] block">
                  {printerState.activePrinter?.name || 'Standard Thermal Printer (Paired)'}
                </span>
                <span className="text-[11px] text-[#6B6B75]">
                  Paper: {printerState.defaultPaperWidth === 'MM80' ? '80mm Roll' : '58mm Roll'} • Auto-print:{' '}
                  {printerState.autoPrintOnOrder ? 'Enabled' : 'Off'}
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-white border border-[#E2E4E8] text-[#1E1E24]">
              {printerState.defaultPaperWidth}
            </span>
          </div>
        </div>

        {/* 4. Restaurant Profile & Room Database Maintenance */}
        <div className="bg-white rounded-2xl border border-[#E2E4E8] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#E2E4E8]">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-[#1E1E24]">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1E24]">Restaurant Profile & Reset</h3>
              <p className="text-[11px] text-[#6B6B75]">MEZBAAN outlet info and database restoration</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-[#6B6B75] mb-4">
            <div className="flex justify-between py-1 border-b border-[#E2E4E8]/60">
              <span>Restaurant Name:</span>
              <span className="font-bold text-[#1E1E24]">MEZBAAN Quick Service</span>
            </div>
            <div className="py-1.5 border-b border-[#E2E4E8]/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="restaurant-gstin-input" className="text-xs text-[#6B6B75] font-medium cursor-pointer">
                    GSTIN Number:
                  </label>
                  {currentStaff.role !== 'ADMIN' && (
                    <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-medium">
                      Admin only
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex items-center bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl px-2.5 py-1 focus-within:border-[#1E1E24] focus-within:bg-white transition-colors">
                    <input
                      id="restaurant-gstin-input"
                      name="restaurantGstin"
                      aria-label="Restaurant GSTIN Number"
                      type="text"
                      maxLength={15}
                      disabled={currentStaff.role !== 'ADMIN'}
                      value={gstinInput}
                      onChange={(e) => {
                        setGstinInput(e.target.value.toUpperCase());
                        if (gstinError) setGstinError(null);
                      }}
                      onKeyDown={handleGstinKeyDown}
                      placeholder="07AAAAA0000A1Z5"
                      className="w-36 sm:w-40 bg-transparent text-xs font-mono font-bold text-[#1E1E24] focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {currentStaff.role === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={handleSaveGstin}
                      disabled={gstinInput.trim().toUpperCase() === gstin}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                        gstinInput.trim().toUpperCase() !== gstin
                          ? 'bg-[#1E1E24] text-white hover:bg-black active:scale-95 cursor-pointer'
                          : 'bg-[#F8F9FA] text-[#A0A3BD] border border-[#E2E4E8] cursor-not-allowed'
                      }`}
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>

              {gstinError && (
                <p className="text-[11px] text-red-600 mt-1 font-medium sm:text-right">{gstinError}</p>
              )}
            </div>
            <div className="flex justify-between py-1 border-b border-[#E2E4E8]/60">
              <span>Menu Items:</span>
              <span className="font-bold text-[#1E1E24]">31 Items across 7 Categories</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Local Storage Engine:</span>
              <span className="font-bold text-emerald-700">Offline-First Room DB (v6)</span>
            </div>
          </div>

          {/* Reset Official Menu Action */}
          <div className="pt-2 border-t border-[#E2E4E8]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#1E1E24] block">
                  Restore Baseline Official Menu
                </span>
                <p className="text-[11px] text-[#6B6B75] mt-0.5">
                  Re-seeds the entire 31-item official MEZBAAN catalog with matched photography and categories.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Restore official MEZBAAN menu baseline? This ensures all 31 items and photo mappings are freshly synchronized.'
                    )
                  ) {
                    onResetOfficialMenu();
                    showFeedback('Official MEZBAAN menu successfully restored!');
                  }
                }}
                className="py-2 px-3.5 rounded-xl border border-[#E2E4E8] bg-[#F8F9FA] text-[#1E1E24] hover:bg-neutral-100 transition-all font-semibold text-xs flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                <span>Restore Menu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
