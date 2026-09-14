import React, { useState, useEffect } from 'react';
import { ReceiptData, PaperWidth } from '../types';
import { ReceiptView } from './ReceiptView';
import { Printer, Share2, Check, X, FileText, ChevronDown } from 'lucide-react';
import { formatPrice } from '../utils/format';
import {
  bluetoothPrinterService,
  BluetoothPrinter
} from '../utils/bluetoothPrinterService';

interface ReceiptModalProps {
  receipt: ReceiptData;
  onDismiss: () => void;
  onNewSale?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  onDismiss,
  onNewSale
}) => {
  const [printerState, setPrinterState] = useState(
    bluetoothPrinterService.getState()
  );
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(
    printerState.defaultPaperWidth || 'MM58'
  );
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [showPrinterSelect, setShowPrinterSelect] = useState(false);

  useEffect(() => {
    const unsub = bluetoothPrinterService.subscribe(() => {
      setPrinterState(bluetoothPrinterService.getState());
    });
    return () => unsub();
  }, []);

  // Auto-print on order completion if enabled
  useEffect(() => {
    if (printerState.autoPrintOnOrder) {
      handleBluetoothPrint();
    }
  }, []);

  const handleBluetoothPrint = async () => {
    setIsPrinting(true);
    setPrintStatus(null);
    try {
      const res = await bluetoothPrinterService.printReceipt(receipt, paperWidth);
      setPrintStatus(res.message);
      // Also trigger browser print dialog as fallback/visual if desired
      setTimeout(() => {
        setPrintStatus(null);
      }, 4000);
    } catch {
      setPrintStatus('Failed to send print command.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDoneNewSale = () => {
    if (onNewSale) {
      onNewSale();
    }
    onDismiss();
  };

  const buildShareText = (): string => {
    const gstinText = receipt.gstin !== undefined ? receipt.gstin.trim() : '07AAAAA0000A1Z5';
    const lines = [
      "MEZBAAN",
      "Fast Food & Quick Bites",
      ...(gstinText ? [`GSTIN: ${gstinText}`] : []),
      `Bill No: ${receipt.billNumber}`,
      "--------------------------------",
      ...receipt.lines.map(
        line => `${line.name}  x${line.qty}  Rs.${formatPrice(line.lineTotal)}`
      ),
      "--------------------------------",
      `Subtotal: Rs.${formatPrice(receipt.subtotal)}`,
      ...(receipt.discountAmount > 0
        ? [`Discount: -Rs.${formatPrice(receipt.discountAmount)}`]
        : []),
      ...(receipt.taxRate > 0 && receipt.taxAmount > 0
        ? [`GST (${receipt.taxRate}%): Rs.${formatPrice(receipt.taxAmount)}`]
        : [`GST (0%): Rs.0.00`]),
      `TOTAL: Rs.${formatPrice(receipt.total)}`,
      `Payment: ${receipt.paymentMode}`,
      ...(receipt.paymentMode === 'CASH' && receipt.cashReceived != null
        ? [`Cash Received: Rs.${formatPrice(receipt.cashReceived)}`]
        : []),
      ...(receipt.paymentMode === 'CASH' && receipt.changeGiven != null
        ? [`Change Returned: Rs.${formatPrice(receipt.changeGiven)}`]
        : []),
      "--------------------------------",
      "Thank you for visiting MEZBAAN!"
    ];
    return lines.join('\n');
  };

  const handleCopyOrShare = async () => {
    const text = buildShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mezbaan Bill ${receipt.billNumber}`,
          text: text
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const activePrinterName = printerState.activePrinter
    ? printerState.activePrinter.name
    : 'Thermal BT Printer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#F8F9FA] rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#E2E4E8] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-white border-b border-[#E2E4E8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF6B35]" />
            <div>
              <h3 className="font-bold text-[#1E1E24] text-base leading-tight">Order Receipt</h3>
              <span className="text-[11px] text-[#6B6B75]">{receipt.billNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Share / Copy quick button */}
            <button
              type="button"
              onClick={handleCopyOrShare}
              title="Share or copy receipt text"
              className="p-1.5 rounded-lg border border-[#E2E4E8] text-[#1E1E24] hover:bg-neutral-100 transition-colors flex items-center gap-1 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600 text-[11px] font-semibold hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="text-[11px] text-[#6B6B75] hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {/* Paper Width Selector */}
            <div className="flex items-center bg-[#F8F9FA] rounded-lg p-0.5 border border-[#E2E4E8] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaperWidth('MM58')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  paperWidth === 'MM58'
                    ? 'bg-[#1E1E24] text-white shadow-xs'
                    : 'text-[#6B6B75] hover:text-[#1E1E24]'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('MM80')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  paperWidth === 'MM80'
                    ? 'bg-[#1E1E24] text-white shadow-xs'
                    : 'text-[#6B6B75] hover:text-[#1E1E24]'
                }`}
              >
                80mm
              </button>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected Bluetooth Printer Quick Switcher Banner */}
        <div className="px-4 py-2 bg-neutral-50 border-b border-[#E2E4E8] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#1E1E24] truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[#6B6B75]">Printer:</span>
            <span className="font-bold truncate">{activePrinterName}</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPrinterSelect(!showPrinterSelect)}
              className="text-[11px] font-semibold text-[#FF6B35] hover:underline flex items-center gap-0.5"
            >
              <span>Change</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showPrinterSelect && (
              <div className="absolute right-0 top-6 z-50 w-64 bg-white rounded-xl shadow-xl border border-[#E2E4E8] p-1.5 space-y-1">
                <span className="block px-2 py-1 text-[10px] font-bold text-[#6B6B75] uppercase">
                  Select Paired Thermal Printer
                </span>
                {printerState.savedPrinters.map((p: BluetoothPrinter) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      bluetoothPrinterService.setActivePrinter(p.id);
                      setPaperWidth(p.paperWidth);
                      setShowPrinterSelect(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      printerState.activePrinter?.id === p.id
                        ? 'bg-[#1E1E24] text-white font-bold'
                        : 'hover:bg-neutral-100 text-[#1E1E24]'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] opacity-80 shrink-0 ml-1">
                      {p.paperWidth === 'MM58' ? '58mm' : '80mm'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Print Feedback Notification */}
        {printStatus && (
          <div className="mx-4 mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{printStatus}</span>
          </div>
        )}

        {/* Receipt Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-neutral-100/70">
          <ReceiptView receipt={receipt} paperWidth={paperWidth} />
        </div>

        {/* Modal Footer: Two clear buttons side-by-side */}
        <div className="p-4 bg-white border-t border-[#E2E4E8] flex gap-3">
          {/* Button 1: Print Receipt via Bluetooth (Primary Button) */}
          <button
            type="button"
            onClick={handleBluetoothPrint}
            disabled={isPrinting}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#FF6B35] text-white font-bold text-sm hover:bg-[#e85d29] active:scale-[0.98] transition-all shadow-md"
          >
            <Printer className={`w-4 h-4 ${isPrinting ? 'animate-pulse' : ''}`} />
            <span>{isPrinting ? 'Printing...' : 'Print Receipt'}</span>
          </button>

          {/* Button 2: Done / New Sale (Closes dialog and resets cart) */}
          <button
            type="button"
            onClick={handleDoneNewSale}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-[#1A1B20] text-white font-bold text-sm hover:bg-black active:scale-[0.98] transition-all shadow-md"
          >
            <span>Done / New Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
};

