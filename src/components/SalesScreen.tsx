import React, { useMemo, useState } from 'react';
import { BillWithItems, ReceiptData, PaymentMode } from '../types';
import { formatPrice, formatTime } from '../utils/format';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  DollarSign,
  FileText,
  ArrowRight,
  Wallet,
  CreditCard,
  Printer,
  TrendingUp,
  Award,
  Calendar,
  Filter,
  RotateCcw
} from 'lucide-react';

interface SalesScreenProps {
  bills: BillWithItems[];
  onSelectReceipt: (receipt: ReceiptData) => void;
}

interface DayData {
  date: Date;
  dateKey: string;
  dayName: string;
  dayLabel: string;
  dateFormatted: string;
  fullDate: string;
  isToday: boolean;
  isFuture: boolean;
  revenue: number;
  billsCount: number;
  cashAmount: number;
  upiAmount: number;
  avgBill: number;
}

export const SalesScreen: React.FC<SalesScreenProps> = ({ bills, onSelectReceipt }) => {
  // Selected day filter: null means "All This Week" or specific dateKey (e.g., '2026-09-13')
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Helper to get local date key "YYYY-MM-DD"
  const getDateKey = (timestamp: number | Date) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayKey = useMemo(() => getDateKey(Date.now()), []);

  // Compute 7 days of the current week (Monday to Sunday)
  const currentWeekDays = useMemo<DayData[]>(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
    // In Monday-start: 1 -> 0 offset, 2 -> 1 offset, ..., 0 (Sun) -> 6 offset
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Map bills to date keys
    const billsByDateKey = new Map<string, BillWithItems[]>();
    for (const b of bills) {
      const k = getDateKey(b.bill.timestamp);
      const list = billsByDateKey.get(k) || [];
      list.push(b);
      billsByDateKey.set(k, list);
    }

    const days: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const k = getDateKey(d);
      const isToday = k === todayKey;
      const isFuture = d.getTime() > now.getTime() && !isToday;

      const dayBills = billsByDateKey.get(k) || [];
      const revenue = dayBills.reduce((acc, curr) => acc + curr.bill.totalAmount, 0);
      const billsCount = dayBills.length;
      const cashAmount = dayBills
        .filter((curr) => curr.bill.paymentMode === 'CASH')
        .reduce((acc, curr) => acc + curr.bill.totalAmount, 0);
      const upiAmount = dayBills
        .filter((curr) => curr.bill.paymentMode === 'UPI')
        .reduce((acc, curr) => acc + curr.bill.totalAmount, 0);
      const avgBill = billsCount > 0 ? revenue / billsCount : 0;

      days.push({
        date: d,
        dateKey: k,
        dayName: dayNames[i],
        dayLabel: `${dayNames[i]} ${d.getDate()}`,
        dateFormatted: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        fullDate: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        isToday,
        isFuture,
        revenue,
        billsCount,
        cashAmount,
        upiAmount,
        avgBill
      });
    }

    return days;
  }, [bills, todayKey]);

  // Weekly aggregate metrics
  const weekStats = useMemo(() => {
    const totalRevenue = currentWeekDays.reduce((acc, d) => acc + d.revenue, 0);
    const totalBills = currentWeekDays.reduce((acc, d) => acc + d.billsCount, 0);
    const daysWithSales = currentWeekDays.filter((d) => d.revenue > 0);
    const avgDailyRevenue = daysWithSales.length > 0 ? totalRevenue / daysWithSales.length : 0;

    // Peak day
    let peakDay: DayData | null = null;
    for (const d of currentWeekDays) {
      if (!peakDay || d.revenue > peakDay.revenue) {
        if (d.revenue > 0) peakDay = d;
      }
    }

    return {
      totalRevenue,
      totalBills,
      avgDailyRevenue,
      peakDay,
      dateRangeStr: `${currentWeekDays[0]?.dateFormatted} - ${currentWeekDays[6]?.dateFormatted}`
    };
  }, [currentWeekDays]);

  // Filter bills list based on selectedDayKey
  const displayedBills = useMemo(() => {
    if (!selectedDayKey) {
      // Show all bills for the current week
      const weekKeys = new Set(currentWeekDays.map((d) => d.dateKey));
      return bills.filter((b) => weekKeys.has(getDateKey(b.bill.timestamp)));
    }
    return bills.filter((b) => getDateKey(b.bill.timestamp) === selectedDayKey);
  }, [bills, selectedDayKey, currentWeekDays]);

  // Selected scope metrics
  const scopeMetrics = useMemo(() => {
    const total = displayedBills.reduce((acc, item) => acc + item.bill.totalAmount, 0);
    const cash = displayedBills
      .filter((item) => item.bill.paymentMode === 'CASH')
      .reduce((acc, item) => acc + item.bill.totalAmount, 0);
    const upi = displayedBills
      .filter((item) => item.bill.paymentMode === 'UPI')
      .reduce((acc, item) => acc + item.bill.totalAmount, 0);

    return {
      total,
      cash,
      upi,
      count: displayedBills.length
    };
  }, [displayedBills]);

  const selectedDayData = useMemo(() => {
    if (!selectedDayKey) return null;
    return currentWeekDays.find((d) => d.dateKey === selectedDayKey) || null;
  }, [selectedDayKey, currentWeekDays]);

  const handleBillClick = (item: BillWithItems) => {
    const b = item.bill;
    const receipt: ReceiptData = {
      billNumber: b.billNumber,
      timestampMillis: b.timestamp,
      lines: item.items.map((i) => ({
        name: i.itemName,
        qty: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal
      })),
      subtotal: b.subtotal,
      taxRate: b.taxRate,
      taxAmount: b.taxAmount,
      discountAmount: b.discountAmount,
      total: b.totalAmount,
      paymentMode: b.paymentMode as PaymentMode,
      cashReceived: b.cashReceived,
      changeGiven: b.changeGiven,
      staffName: b.staffName,
      gstin: b.gstin ?? '07AAAAA0000A1Z5'
    };
    onSelectReceipt(receipt);
  };

  // Custom Recharts Tooltip for Weekly Revenue
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d: DayData = payload[0].payload;

    return (
      <div className="bg-white/95 backdrop-blur-xs border border-[#E2E4E8] rounded-xl p-3 shadow-lg text-xs max-w-[220px]">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E2E4E8]/60 mb-2">
          <span className="font-bold text-[#1E1E24]">{d.fullDate}</span>
          {d.isToday && (
            <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-[#FF6B35]/15 text-[#FF6B35]">
              Today
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#6B6B75]">Revenue:</span>
            <span className="font-bold text-[#FF6B35] text-sm">₹{formatPrice(d.revenue)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#6B6B75]">Total Orders:</span>
            <span className="font-semibold text-[#1E1E24]">{d.billsCount} bills</span>
          </div>

          {d.billsCount > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B75]">Avg Order:</span>
                <span className="font-medium text-[#1E1E24]">₹{formatPrice(Math.round(d.avgBill))}</span>
              </div>
              <div className="pt-1.5 border-t border-[#E2E4E8]/40 flex items-center justify-between text-[11px] text-[#6B6B75]">
                <span>Cash: ₹{formatPrice(d.cashAmount)}</span>
                <span>UPI: ₹{formatPrice(d.upiAmount)}</span>
              </div>
            </>
          )}

          {d.revenue === 0 && !d.isFuture && (
            <p className="text-[11px] text-neutral-400 italic pt-1">No orders recorded</p>
          )}
        </div>

        <div className="mt-2 text-[10px] text-neutral-400 font-medium text-center">
          Tap bar to filter bills
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full pb-24">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E1E24] tracking-tight">Sales & Performance</h2>
          <p className="text-xs text-[#6B6B75] mt-0.5">
            Weekly revenue trends, daily breakdown, and transaction ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E4E8] text-xs font-semibold text-[#1E1E24] shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>This Week ({weekStats.dateRangeStr})</span>
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart Card: Revenue Per Day for Current Week */}
      <div className="bg-white rounded-2xl border border-[#E2E4E8] p-4 sm:p-5 shadow-xs mb-5">
        {/* Chart Header & High-Level Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E2E4E8]/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1E1E24]">Revenue Per Day (Current Week)</h3>
            </div>
            <p className="text-xs text-[#6B6B75] mt-1">
              Interactive daily revenue distribution for Monday through Sunday
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-[#F8F9FA] border border-[#E2E4E8] px-2.5 py-1 rounded-lg">
              <span className="text-[#6B6B75] text-[11px] block">Week Total</span>
              <span className="font-bold text-[#1E1E24]">₹{formatPrice(weekStats.totalRevenue)}</span>
            </div>

            <div className="bg-[#F8F9FA] border border-[#E2E4E8] px-2.5 py-1 rounded-lg">
              <span className="text-[#6B6B75] text-[11px] block">Daily Avg</span>
              <span className="font-bold text-[#1E1E24]">₹{formatPrice(Math.round(weekStats.avgDailyRevenue))}</span>
            </div>

            {weekStats.peakDay && (
              <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-900 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-amber-700 text-[11px] block">Peak Day</span>
                  <span className="font-bold">
                    {weekStats.peakDay.dayName} (₹{formatPrice(weekStats.peakDay.revenue)})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* The Recharts Bar Chart */}
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentWeekDays}
              margin={{ top: 12, right: 8, left: -12, bottom: 4 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const clickedDay: DayData = state.activePayload[0].payload;
                  setSelectedDayKey((prev) => (prev === clickedDay.dateKey ? null : clickedDay.dateKey));
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
              <XAxis
                dataKey="dayLabel"
                stroke="#6B6B75"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E4E8' }}
              />
              <YAxis
                stroke="#6B6B75"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k' : val}`}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255, 107, 53, 0.05)' }} />
              <Bar
                dataKey="revenue"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
                isAnimationActive={true}
                className="cursor-pointer"
              >
                {currentWeekDays.map((entry) => {
                  const isSelected = selectedDayKey === entry.dateKey;
                  let barFill = '#2E3440'; // Default past day with sales: Slate Charcoal

                  if (entry.isToday) {
                    barFill = '#FF6B35'; // Today: Brand Coral Orange
                  } else if (entry.revenue === 0) {
                    barFill = '#E2E4E8'; // Zero revenue
                  }

                  if (isSelected) {
                    barFill = entry.isToday ? '#E55A2B' : '#1E1E24';
                  }

                  return (
                    <Cell
                      key={`cell-${entry.dateKey}`}
                      fill={barFill}
                      stroke={isSelected ? '#1E1E24' : 'transparent'}
                      strokeWidth={isSelected ? 1.5 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend & Interactive Day Chips */}
        <div className="mt-3 pt-3 border-t border-[#E2E4E8]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-[#6B6B75]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#FF6B35]" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2E3440]" />
              <span>Past Days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#E2E4E8]" />
              <span>No Sales</span>
            </div>
          </div>

          {/* Quick Day Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedDayKey(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDayKey === null
                  ? 'bg-[#1E1E24] text-white'
                  : 'bg-[#F8F9FA] text-[#6B6B75] border border-[#E2E4E8] hover:bg-neutral-100'
              }`}
            >
              All Week
            </button>
            {currentWeekDays.map((d) => (
              <button
                key={d.dateKey}
                type="button"
                onClick={() => setSelectedDayKey(selectedDayKey === d.dateKey ? null : d.dateKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedDayKey === d.dateKey
                    ? 'bg-[#1E1E24] text-white'
                    : d.isToday
                    ? 'bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30'
                    : 'bg-[#F8F9FA] text-[#6B6B75] border border-[#E2E4E8] hover:bg-neutral-100'
                }`}
              >
                <span>{d.dayName}</span>
                {d.revenue > 0 && (
                  <span className={`text-[10px] ${selectedDayKey === d.dateKey ? 'text-white/80' : 'text-[#1E1E24]'}`}>
                    ₹{formatPrice(d.revenue)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Scope Summary Cards */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-[#1E1E24]">
              {selectedDayData
                ? `Summary for ${selectedDayData.fullDate}${selectedDayData.isToday ? ' (Today)' : ''}`
                : "This Week's Overview"}
            </h3>
          </div>
          {selectedDayKey && (
            <button
              type="button"
              onClick={() => setSelectedDayKey(null)}
              className="text-xs text-[#FF6B35] font-semibold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Show Entire Week</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Revenue */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E4E8] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-[#6B6B75] font-medium block">
                {selectedDayKey ? 'Day Revenue' : 'Weekly Revenue'}
              </span>
              <span className="text-xl font-bold text-[#1E1E24] mt-0.5 block">
                ₹{formatPrice(scopeMetrics.total)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Bills Count */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E4E8] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-[#6B6B75] font-medium block">Orders / Bills</span>
              <span className="text-xl font-bold text-[#1E1E24] mt-0.5 block">
                {scopeMetrics.count}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Cash / UPI Breakdown */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E4E8] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-[#6B6B75] font-medium block">Cash / UPI Breakdown</span>
              <span className="text-base font-bold text-[#1E1E24] mt-0.5 block">
                ₹{formatPrice(scopeMetrics.cash)}{' '}
                <span className="text-neutral-400 font-normal">/</span> ₹{formatPrice(scopeMetrics.upi)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Bills Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1E1E24]">
              {selectedDayData ? `Bills on ${selectedDayData.dayName}, ${selectedDayData.dateFormatted}` : 'Transaction Ledger'}
            </h3>
            <span className="text-xs text-[#6B6B75]">
              Showing {displayedBills.length} recorded {displayedBills.length === 1 ? 'bill' : 'bills'}
            </span>
          </div>
          <span className="text-xs text-[#6B6B75] hidden sm:inline">Tap to view receipt & reprint</span>
        </div>

        {displayedBills.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E4E8] p-8 text-center">
            <FileText className="w-12 h-12 text-[#6B6B75]/30 mx-auto mb-2" />
            <p className="font-semibold text-[#1E1E24] text-sm">No bills found for this selection</p>
            <p className="text-xs text-[#6B6B75] mt-1">
              {selectedDayKey
                ? 'Select another day or click "Show Entire Week" to view all records.'
                : 'Orders processed in the Billing tab will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedBills.map((item) => {
              const b = item.bill;
              return (
                <div
                  key={b.id}
                  onClick={() => handleBillClick(item)}
                  className="bg-white rounded-xl border border-[#E2E4E8] p-3.5 flex items-center justify-between hover:border-[#1E1E24] hover:shadow-xs cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#F8F9FA] border border-[#E2E4E8] flex items-center justify-center text-[#1E1E24]">
                      {b.paymentMode === 'CASH' ? (
                        <Wallet className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1E1E24]">{b.billNumber}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#F8F9FA] border border-[#E2E4E8] text-[#6B6B75]">
                          {b.itemCount} items
                        </span>
                      </div>
                      <span className="text-xs text-[#6B6B75] block mt-0.5">
                        {new Date(b.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                        • {formatTime(b.timestamp)} • By {b.staffName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-bold text-[#FF6B35] block">
                        ₹{formatPrice(b.totalAmount)}
                      </span>
                      <span className="text-[11px] font-medium text-[#1E1E24]">{b.paymentMode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBillClick(item);
                      }}
                      title="Reprint Receipt via Bluetooth"
                      className="p-2 rounded-lg bg-[#F8F9FA] hover:bg-[#1E1E24] text-[#6B6B75] hover:text-white border border-[#E2E4E8] transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-[#6B6B75]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
