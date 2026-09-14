import React, { useState, useEffect } from 'react';
import { AppScreen, Staff } from '../types';
import { Utensils, ReceiptText, BookOpen, Users, CircleDot, Printer, Settings as SettingsIcon } from 'lucide-react';
import { bluetoothPrinterService } from '../utils/bluetoothPrinterService';

interface NavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  currentStaff: Staff;
  onOpenPrinterModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onNavigate,
  currentStaff,
  onOpenPrinterModal
}) => {
  const [activePrinter, setActivePrinter] = useState(
    bluetoothPrinterService.getState().activePrinter
  );

  useEffect(() => {
    const unsub = bluetoothPrinterService.subscribe(() => {
      setActivePrinter(bluetoothPrinterService.getState().activePrinter);
    });
    return () => unsub();
  }, []);

  const navItems: { screen: AppScreen; label: string; icon: React.FC<{ className?: string }> }[] = [
    { screen: 'POS', label: 'Billing', icon: Utensils },
    { screen: 'SALES', label: 'Sales', icon: ReceiptText },
    { screen: 'MENU', label: 'Menu', icon: BookOpen },
    { screen: 'STAFF', label: 'Staff', icon: Users },
    { screen: 'SETTINGS', label: 'Settings', icon: SettingsIcon }
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E2E4E8] px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Mezbaan"
            className="w-8 h-8 rounded-lg object-contain bg-[#1E1E24] p-1"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[#1E1E24] text-base leading-tight tracking-tight">
                MEZBAAN
              </h1>
              <span className="text-[10px] uppercase font-bold bg-[#FF6B35]/10 text-[#FF6B35] px-1.5 py-0.5 rounded-sm">
                POS
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B75] hidden sm:block">
              Fast Food & Quick Service
            </p>
          </div>
        </div>

        {/* Top Right: Printer Status, Staff badge, & Settings */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Bluetooth Printer Status & Quick Connect Button */}
          <button
            type="button"
            onClick={onOpenPrinterModal}
            title={
              activePrinter
                ? `Bluetooth Printer: ${activePrinter.name} (${activePrinter.paperWidth === 'MM58' ? '58mm' : '80mm'})`
                : 'Connect Bluetooth Thermal Printer'
            }
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F8F9FA] border border-[#E2E4E8] hover:border-neutral-400 text-xs font-semibold text-[#1E1E24] transition-all hover:bg-neutral-100 active:scale-95"
          >
            <div className="relative flex items-center justify-center">
              <Printer className="w-4 h-4 text-[#1E1E24]" />
              <span
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${
                  activePrinter?.isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
            <span className="hidden md:inline text-[11px] text-[#6B6B75] font-normal truncate max-w-[110px]">
              {activePrinter ? activePrinter.name.split(' ')[0] : 'Printer'}
            </span>
            <span className="text-[10px] bg-neutral-200 text-[#1E1E24] px-1 py-0.2 rounded-xs font-bold">
              {activePrinter?.paperWidth === 'MM80' ? '80mm' : '58mm'}
            </span>
          </button>

          {/* Staff badge & Switch shortcut */}
          <button
            type="button"
            onClick={() => onNavigate('STAFF')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8F9FA] border border-[#E2E4E8] text-xs hover:border-neutral-400 transition-colors"
          >
            <CircleDot className="w-3 h-3 text-emerald-600" />
            <span className="text-[#6B6B75] hidden sm:inline">Cashier:</span>
            <span className="font-semibold text-[#1E1E24]">{currentStaff.name}</span>
            <span className="text-[10px] text-[#6B6B75] bg-neutral-200 px-1 rounded-sm ml-0.5">
              {currentStaff.role}
            </span>
          </button>

          {/* Settings shortcut button */}
          <button
            type="button"
            onClick={() => onNavigate('SETTINGS')}
            title="POS Settings"
            className={`p-2 rounded-xl border transition-all ${
              currentScreen === 'SETTINGS'
                ? 'bg-[#1E1E24] text-white border-[#1E1E24]'
                : 'bg-[#F8F9FA] text-[#6B6B75] border-[#E2E4E8] hover:text-[#1E1E24] hover:bg-neutral-100'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E4E8] py-2 px-4 flex justify-around items-center shadow-lg sm:max-w-lg sm:mx-auto sm:bottom-4 sm:rounded-2xl sm:border">
        {navItems.map(({ screen, label, icon: Icon }) => {
          const isSelected = currentScreen === screen;
          return (
            <button
              key={screen}
              type="button"
              onClick={() => onNavigate(screen)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 sm:px-3 rounded-xl transition-all ${
                isSelected
                  ? 'text-[#1E1E24] font-bold scale-105'
                  : 'text-[#6B6B75] font-medium hover:text-[#1E1E24]'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isSelected ? 'text-[#FF6B35]' : 'text-[#6B6B75]'
                }`}
              />
              <span className="text-[11px] sm:text-xs">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
