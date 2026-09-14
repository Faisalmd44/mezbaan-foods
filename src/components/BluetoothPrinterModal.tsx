import React, { useState, useEffect } from 'react';
import {
  bluetoothPrinterService
} from '../utils/bluetoothPrinterService';
import { PaperWidth } from '../types';
import {
  Printer,
  CheckCircle2,
  CircleDot,
  Radio,
  RefreshCw,
  Zap,
  Sliders,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({
  isOpen,
  onClose
}) => {
  const [state, setState] = useState(bluetoothPrinterService.getState());
  const [isScanning, setIsScanning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = bluetoothPrinterService.subscribe(() => {
      setState(bluetoothPrinterService.getState());
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSelectPrinter = async (printerId: string) => {
    const printer = state.savedPrinters.find((p) => p.id === printerId);
    if (!printer) return;
    bluetoothPrinterService.setActivePrinter(printerId);
    setIsConnecting(true);
    try {
      await bluetoothPrinterService.connectPrinter(printer.address);
    } catch {
      // Connection error is non-fatal here; user can retry
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePaperWidthChange = (width: PaperWidth) => {
    bluetoothPrinterService.setPaperWidth(width);
  };

  const handleAutoPrintToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    bluetoothPrinterService.setAutoPrint(e.target.checked);
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const devices = await bluetoothPrinterService.discoverPairedDevices();
      if (devices.length > 0) {
        setScanMessage(`Found ${devices.length} paired Bluetooth printer${devices.length === 1 ? '' : 's'}.`);
      } else {
        setScanMessage('No paired printers found. Pair your thermal printer in Android Bluetooth Settings first.');
      }
    } catch (err: any) {
      setScanMessage(err?.message || 'Bluetooth scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await bluetoothPrinterService.printTestReceipt();
      setTestResult(res.message);
    } catch {
      setTestResult('Test print failed.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#E2E4E8] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E4E8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1E1E24] text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E1E24]">Thermal Printers</h3>
              <p className="text-xs text-[#6B6B75]">Bluetooth ESC/POS Device Manager</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#6B6B75] hover:text-[#1E1E24] hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Active Printer Banner */}
          <div className="bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Printer className="w-6 h-6 text-[#1E1E24]" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#6B6B75] uppercase tracking-wider block">
                  Active Printer
                </span>
                <span className="text-sm font-bold text-[#1E1E24]">
                  {state.activePrinter?.name || 'No printer selected'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              Ready
            </span>
          </div>

          {/* Quick Settings: Auto-Print & Paper Width */}
          <div className="bg-white border border-[#E2E4E8] rounded-xl p-3.5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#FF6B35]" />
                <div>
                  <span className="text-xs font-bold text-[#1E1E24] block">
                    Paper Roll Size
                  </span>
                  <span className="text-[11px] text-[#6B6B75]">
                    Width for layout & character wrap
                  </span>
                </div>
              </div>
              <div className="flex bg-[#F8F9FA] p-1 rounded-lg border border-[#E2E4E8] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handlePaperWidthChange('MM58')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    state.defaultPaperWidth === 'MM58'
                      ? 'bg-[#1E1E24] text-white shadow-xs'
                      : 'text-[#6B6B75] hover:text-[#1E1E24]'
                  }`}
                >
                  58mm
                </button>
                <button
                  type="button"
                  onClick={() => handlePaperWidthChange('MM80')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    state.defaultPaperWidth === 'MM80'
                      ? 'bg-[#1E1E24] text-white shadow-xs'
                      : 'text-[#6B6B75] hover:text-[#1E1E24]'
                  }`}
                >
                  80mm
                </button>
              </div>
            </div>

            <div className="border-t border-[#E2E4E8] pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <div>
                  <label htmlFor="auto-print-switch" className="text-xs font-bold text-[#1E1E24] block cursor-pointer">
                    Auto-print on Order Completion
                  </label>
                  <span className="text-[11px] text-[#6B6B75]">
                    Trigger Bluetooth print immediately when placed
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="auto-print-switch"
                  type="checkbox"
                  checked={state.autoPrintOnOrder}
                  onChange={handleAutoPrintToggle}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF6B35]" />
              </label>
            </div>
          </div>

          {/* Paired Printers List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B6B75]">
                Paired Thermal Printers
              </span>
              <button
                type="button"
                onClick={handleScan}
                disabled={isScanning}
                className="text-xs font-semibold text-[#FF6B35] hover:text-[#e85d29] flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Scan / Pair'}</span>
              </button>
            </div>

            {scanMessage && (
              <div className="mb-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{scanMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              {state.savedPrinters.map((printer) => {
                const isSelected = state.activePrinter?.id === printer.id;
                return (
                  <div
                    key={printer.id}
                    onClick={() => handleSelectPrinter(printer.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#1E1E24] bg-neutral-50/70 shadow-xs'
                        : 'border-[#E2E4E8] bg-white hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-[#1E1E24] text-white' : 'bg-[#F8F9FA] text-[#6B6B75]'
                        }`}
                      >
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#1E1E24]">{printer.name}</h4>
                          <span className="text-[10px] bg-neutral-200 text-[#1E1E24] px-1.5 py-0.2 rounded-sm font-semibold">
                            {printer.paperWidth === 'MM58' ? '58mm' : '80mm'}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#6B6B75] block mt-0.5">
                          Bluetooth ESC/POS • {printer.address || 'Paired Device'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <CircleDot className="w-4 h-4 text-neutral-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test print feedback */}
          {testResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testResult}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#E2E4E8] flex gap-2">
          <button
            type="button"
            onClick={handleTestPrint}
            disabled={isTesting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#E2E4E8] bg-[#F8F9FA] text-[#1E1E24] font-semibold text-xs hover:bg-neutral-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isTesting ? 'Sending...' : 'Test Print (MEZBAAN)'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-[#1E1E24] text-white font-semibold text-xs hover:bg-black active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
