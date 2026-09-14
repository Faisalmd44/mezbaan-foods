import React from 'react';
import { ReceiptData, PaperWidth } from '../types';
import { formatPrice, formatDateTime } from '../utils/format';

interface ReceiptViewProps {
  receipt: ReceiptData;
  paperWidth?: PaperWidth;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({
  receipt,
  paperWidth = 'MM80'
}) => {
  const is58mm = paperWidth === 'MM58';
  const widthClass = is58mm ? 'w-[260px]' : 'w-[320px]';

  return (
    <div
      id="thermal-receipt"
      className={`${widthClass} bg-white text-[#111] p-4 border border-neutral-300 shadow-sm rounded-sm font-mono-thermal text-xs select-none`}
    >
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-neutral-400">
        <div className="flex justify-center mb-1">
          <img
            src="/receipt-logo.png"
            alt="MEZBAAN"
            className="h-9 sm:h-10 w-auto max-w-[170px] object-contain mx-auto"
          />
        </div>
        <p className="text-[10px] text-neutral-600">Fast Food & Quick Bites</p>
        {receipt.gstin !== undefined ? (
          receipt.gstin.trim() ? (
            <p className="text-[10px] text-neutral-500 mt-0.5">GSTIN: {receipt.gstin.trim()}</p>
          ) : null
        ) : (
          <p className="text-[10px] text-neutral-500 mt-0.5">GSTIN: 07AAAAA0000A1Z5</p>
        )}
      </div>

      {/* Bill Meta */}
      <div className="py-2 text-[11px] border-b border-dashed border-neutral-400 space-y-0.5">
        <div className="flex justify-between">
          <span>Bill No:</span>
          <span className="font-bold">{receipt.billNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDateTime(receipt.timestampMillis)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{receipt.staffName}</span>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="py-2 border-b border-dashed border-neutral-400">
        <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-neutral-300 text-neutral-600 uppercase">
          <span className="flex-1">Item</span>
          <span className="w-8 text-center">Qty</span>
          <span className="w-14 text-right">Price</span>
          <span className="w-16 text-right">Total</span>
        </div>
        <div className="pt-1.5 space-y-1">
          {receipt.lines.map((line, idx) => (
            <div key={idx} className="flex justify-between items-start text-[11px]">
              <span className="flex-1 pr-1 truncate font-medium">{line.name}</span>
              <span className="w-8 text-center text-neutral-600">{line.qty}</span>
              <span className="w-14 text-right text-neutral-600">{formatPrice(line.unitPrice)}</span>
              <span className="w-16 text-right font-semibold">{formatPrice(line.lineTotal)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals Calculation */}
      <div className="py-2 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal:</span>
          <span>₹{formatPrice(receipt.subtotal)}</span>
        </div>

        {receipt.discountAmount > 0 && (
          <div className="flex justify-between text-neutral-700">
            <span>Discount:</span>
            <span>-₹{formatPrice(receipt.discountAmount)}</span>
          </div>
        )}

        {receipt.taxRate > 0 && receipt.taxAmount > 0 ? (
          <div className="flex justify-between text-neutral-600">
            <span>GST ({receipt.taxRate}%):</span>
            <span>₹{formatPrice(receipt.taxAmount)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-neutral-400">
            <span>GST (0%):</span>
            <span>₹0.00</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-sm text-black pt-1 border-t border-dotted border-neutral-400">
          <span>TOTAL:</span>
          <span>₹{formatPrice(receipt.total)}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="py-2 border-b border-dashed border-neutral-400 space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Payment Mode:</span>
          <span className="font-bold">{receipt.paymentMode}</span>
        </div>
        {receipt.paymentMode === 'CASH' && receipt.cashReceived != null && (
          <div className="flex justify-between">
            <span>Cash Tendered:</span>
            <span>₹{formatPrice(receipt.cashReceived)}</span>
          </div>
        )}
        {receipt.paymentMode === 'CASH' && receipt.changeGiven != null && (
          <div className="flex justify-between">
            <span>Change Returned:</span>
            <span>₹{formatPrice(receipt.changeGiven)}</span>
          </div>
        )}
      </div>

      {/* Footer / Barcode decoration */}
      <div className="pt-3 text-center text-[10px] text-neutral-500 space-y-1">
        <p className="font-semibold text-neutral-700">Thank you for dining with MEZBAAN!</p>
        <div className="pt-1 tracking-widest text-[8px] opacity-70">
          * * * HAVE A GREAT DAY * * *
        </div>
      </div>
    </div>
  );
};
