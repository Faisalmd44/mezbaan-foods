import { ReceiptData, PaperWidth } from '../types';
import { formatPrice, formatDateTime } from './format';
import { ESCPOS_LOGO_58, ESCPOS_LOGO_80 } from './thermalLogo';
import BluetoothSppPlugin, { isBluetoothPluginAvailable } from '../plugins/BluetoothSppPlugin';

export interface BluetoothPrinter {
  id: string;
  name: string;
  address: string;
  paperWidth: PaperWidth;
  isConnected: boolean;
  isPaired: boolean;
  lastConnected?: number;
}

export interface PrinterServiceState {
  activePrinter: BluetoothPrinter | null;
  savedPrinters: BluetoothPrinter[];
  autoPrintOnOrder: boolean;
  defaultPaperWidth: PaperWidth;
}

const STORAGE_KEYS = {
  ACTIVE_PRINTER_ID: 'mezbaan_active_printer_id',
  AUTO_PRINT: 'mezbaan_auto_print_order',
  DEFAULT_WIDTH: 'mezbaan_default_paper_width'
};

function getPlugin(): any {
  if (isBluetoothPluginAvailable()) {
    return BluetoothSppPlugin;
  }
  return null;
}

class BluetoothPrinterService {
  private activePrinter: BluetoothPrinter | null = null;
  private savedPrinters: BluetoothPrinter[] = [];
  private autoPrintOnOrder: boolean = false;
  private defaultPaperWidth: PaperWidth = 'MM58';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const autoPrint = localStorage.getItem(STORAGE_KEYS.AUTO_PRINT);
      this.autoPrintOnOrder = autoPrint === 'true';

      const width = localStorage.getItem(STORAGE_KEYS.DEFAULT_WIDTH) as PaperWidth;
      if (width === 'MM58' || width === 'MM80') {
        this.defaultPaperWidth = width;
      }
    } catch {
      // ignore
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getState(): PrinterServiceState {
    return {
      activePrinter: this.activePrinter,
      savedPrinters: this.savedPrinters,
      autoPrintOnOrder: this.autoPrintOnOrder,
      defaultPaperWidth: this.defaultPaperWidth
    };
  }

  public isNativeAvailable(): boolean {
    return getPlugin() !== null;
  }

  public async checkPermissions(): Promise<{ granted: boolean; denied: string[] }> {
    const plugin = getPlugin();
    if (!plugin) return { granted: false, denied: ['NATIVE_PLUGIN_UNAVAILABLE'] };
    return plugin.checkPermissions();
  }

  public async requestPermissions(): Promise<{ granted: boolean; denied: string[] }> {
    const plugin = getPlugin();
    if (!plugin) return { granted: false, denied: ['NATIVE_PLUGIN_UNAVAILABLE'] };
    return plugin.requestPermissions();
  }

  public async isBluetoothEnabled(): Promise<boolean> {
    const plugin = getPlugin();
    if (!plugin) return false;
    const res = await plugin.isBluetoothEnabled();
    return res.enabled;
  }

  public async enableBluetooth(): Promise<boolean> {
    const plugin = getPlugin();
    if (!plugin) return false;
    const res = await plugin.enableBluetooth();
    return res.enabled;
  }

  public async discoverPairedDevices(): Promise<BluetoothPrinter[]> {
    const plugin = getPlugin();
    if (!plugin) throw new Error('Bluetooth plugin not available. Run on Android device.');

    const permRes = await plugin.requestPermissions();
    if (!permRes.granted) {
      throw new Error('Bluetooth permissions denied. Grant BLUETOOTH_SCAN and BLUETOOTH_CONNECT in Settings.');
    }

    const enabled = await plugin.isBluetoothEnabled();
    if (!enabled) {
      await plugin.enableBluetooth();
      const recheck = await plugin.isBluetoothEnabled();
      if (!recheck) {
        throw new Error('Bluetooth is turned off. Turn on Bluetooth and try again.');
      }
    }

    const res = await plugin.getPairedDevices();
    this.savedPrinters = (res.devices || []).map((d: any) => ({
      id: d.address,
      name: d.name,
      address: d.address,
      paperWidth: this.defaultPaperWidth,
      isConnected: false,
      isPaired: true
    }));

    // Check if currently connected printer is still in the list
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRINTER_ID);
    if (activeId) {
      const found = this.savedPrinters.find(p => p.id === activeId);
      if (found) {
        const connRes = await plugin.isConnected();
        found.isConnected = connRes.connected;
        this.activePrinter = found;
      }
    }

    this.notify();
    return this.savedPrinters;
  }

  public async connectPrinter(address: string): Promise<{ success: boolean; message: string }> {
    const plugin = getPlugin();
    if (!plugin) throw new Error('Bluetooth plugin not available. Run on Android device.');

    const res = await plugin.connect({ address });
    if (res.connected) {
      const printer = this.savedPrinters.find(p => p.address === address);
      if (printer) {
        this.savedPrinters = this.savedPrinters.map(p => ({
          ...p,
          isConnected: p.address === address
        }));
        this.activePrinter = { ...printer, isConnected: true, lastConnected: Date.now() };
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PRINTER_ID, printer.id);
        this.notify();
      }
      return { success: true, message: res.message };
    }
    return { success: false, message: 'Connection failed' };
  }

  public async disconnectPrinter(): Promise<void> {
    const plugin = getPlugin();
    if (plugin) {
      await plugin.disconnect();
    }
    if (this.activePrinter) {
      this.savedPrinters = this.savedPrinters.map(p => ({
        ...p,
        isConnected: false
      }));
      this.activePrinter = { ...this.activePrinter, isConnected: false };
      this.notify();
    }
  }

  public setActivePrinter(printerId: string): void {
    const found = this.savedPrinters.find(p => p.id === printerId);
    if (found) {
      this.activePrinter = { ...found, lastConnected: Date.now() };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PRINTER_ID, printerId);
      this.notify();
    }
  }

  public setPaperWidth(width: PaperWidth): void {
    this.defaultPaperWidth = width;
    localStorage.setItem(STORAGE_KEYS.DEFAULT_WIDTH, width);
    if (this.activePrinter) {
      this.activePrinter.paperWidth = width;
      this.savedPrinters = this.savedPrinters.map(p =>
        p.id === this.activePrinter?.id ? { ...p, paperWidth: width } : p
      );
    }
    this.notify();
  }

  public setAutoPrint(enabled: boolean): void {
    this.autoPrintOnOrder = enabled;
    localStorage.setItem(STORAGE_KEYS.AUTO_PRINT, enabled.toString());
    this.notify();
  }

  public buildEscPosReceipt(receipt: ReceiptData, paperWidth: PaperWidth): Uint8Array {
    const is58 = paperWidth === 'MM58';
    const cols = is58 ? 32 : 48;
    const separator = '-'.repeat(cols);
    const doubleSep = '='.repeat(cols);

    const encoder = new TextEncoder();
    const chunks: number[] = [];

    const addBytes = (...bytes: number[]) => chunks.push(...bytes);
    const addText = (text: string) => {
      const bytes = encoder.encode(text);
      for (let i = 0; i < bytes.length; i++) chunks.push(bytes[i]);
    };
    const addLine = (text: string = '') => addText(text + '\n');

    const formatCols = (left: string, right: string, maxLen: number = cols) => {
      const spaceNeeded = maxLen - left.length - right.length;
      if (spaceNeeded <= 0) {
        return left.substring(0, maxLen - right.length - 1) + ' ' + right;
      }
      return left + ' '.repeat(spaceNeeded) + right;
    };

    addBytes(0x1B, 0x40);
    addBytes(0x1B, 0x61, 0x01);
    const logoBytes = is58 ? ESCPOS_LOGO_58 : ESCPOS_LOGO_80;
    for (let i = 0; i < logoBytes.length; i++) chunks.push(logoBytes[i]);
    addLine('');
    addLine('Fast Food & Quick Bites');
    const gstinPrint = receipt.gstin !== undefined ? receipt.gstin.trim() : '07AAAAA0000A1Z5';
    if (gstinPrint) {
      addLine(`GSTIN: ${gstinPrint}`);
    }
    addLine(doubleSep);

    addBytes(0x1B, 0x61, 0x00);
    addLine(formatCols(`Bill No: ${receipt.billNumber}`, formatDateTime(receipt.timestampMillis)));
    addLine(formatCols(`Cashier: ${receipt.staffName}`, `Mode: ${receipt.paymentMode}`));
    addLine(separator);

    addBytes(0x1B, 0x45, 0x01);
    if (is58) {
      addLine(formatCols('Item (Qty)', 'Amount'));
    } else {
      const colHead = 'Item'.padEnd(24) + 'Qty'.padEnd(6) + 'Rate'.padEnd(8) + 'Amount'.padStart(10);
      addLine(colHead);
    }
    addBytes(0x1B, 0x45, 0x00);
    addLine(separator);

    receipt.lines.forEach(item => {
      const priceStr = `Rs.${formatPrice(item.lineTotal)}`;
      if (is58) {
        const title = `${item.name} x${item.qty}`;
        addLine(formatCols(title, priceStr));
      } else {
        const itemCol = item.name.substring(0, 22).padEnd(24);
        const qtyCol = item.qty.toString().padEnd(6);
        const rateCol = formatPrice(item.unitPrice).padEnd(8);
        const amtCol = priceStr.padStart(10);
        addLine(itemCol + qtyCol + rateCol + amtCol);
      }
    });

    addLine(separator);
    addLine(formatCols('Subtotal:', `Rs.${formatPrice(receipt.subtotal)}`));
    if (receipt.discountAmount > 0) {
      addLine(formatCols('Discount:', `-Rs.${formatPrice(receipt.discountAmount)}`));
    }
    if (receipt.taxRate > 0 && receipt.taxAmount > 0) {
      addLine(formatCols(`GST (${receipt.taxRate}%):`, `Rs.${formatPrice(receipt.taxAmount)}`));
    } else {
      addLine(formatCols('GST (0%):', 'Rs.0.00'));
    }
    addLine(doubleSep);

    addBytes(0x1B, 0x45, 0x01);
    addBytes(0x1B, 0x21, 0x10);
    addLine(formatCols('TOTAL AMOUNT:', `Rs.${formatPrice(receipt.total)}`));
    addBytes(0x1B, 0x21, 0x00);
    addBytes(0x1B, 0x45, 0x00);

    if (receipt.paymentMode === 'CASH') {
      if (receipt.cashReceived != null) {
        addLine(formatCols('Cash Tendered:', `Rs.${formatPrice(receipt.cashReceived)}`));
      }
      if (receipt.changeGiven != null) {
        addLine(formatCols('Change Returned:', `Rs.${formatPrice(receipt.changeGiven)}`));
      }
    }

    addLine(separator);

    addBytes(0x1B, 0x61, 0x01);
    addLine('Thank you for dining with MEZBAAN!');
    addLine('* * * HAVE A GREAT DAY * * *');

    addBytes(0x1B, 0x64, 0x04);
    addBytes(0x1D, 0x56, 0x41, 0x00);

    return new Uint8Array(chunks);
  }

  public async printReceipt(receipt: ReceiptData, paperWidth?: PaperWidth): Promise<{ success: boolean; message: string }> {
    const width = paperWidth || this.activePrinter?.paperWidth || this.defaultPaperWidth;
    const printerName = this.activePrinter ? this.activePrinter.name : 'Thermal Bluetooth Printer';
    const escposBytes = this.buildEscPosReceipt(receipt, width);

    const plugin = getPlugin();
    if (!plugin) {
      throw new Error('Bluetooth printing requires the Android app. Run on a device with Bluetooth.');
    }

    if (!this.activePrinter) {
      throw new Error('No printer selected. Connect a printer first.');
    }

    const connCheck = await plugin.isConnected();
    if (!connCheck.connected) {
      const connRes = await plugin.connect({ address: this.activePrinter.address });
      if (!connRes.connected) {
        throw new Error(`Failed to connect to ${printerName}: ${connRes.message || ''}`);
      }
    }

    const data = Array.from(escposBytes);
    const res = await plugin.printData({ data });
    return {
      success: res.success,
      message: res.success
        ? `Printed to ${printerName} (${width === 'MM58' ? '58mm' : '80mm'})`
        : `Print failed: ${res.message}`
    };
  }

  public async printTestReceipt(): Promise<{ success: boolean; message: string }> {
    const mockReceipt: ReceiptData = {
      billNumber: 'TEST-0001',
      timestampMillis: Date.now(),
      lines: [
        { name: 'Chicken Biryani', qty: 1, unitPrice: 220, lineTotal: 220 },
        { name: 'Garlic Naan', qty: 2, unitPrice: 45, lineTotal: 90 },
        { name: 'Fresh Mint Lime', qty: 1, unitPrice: 60, lineTotal: 60 }
      ],
      subtotal: 370,
      taxRate: 5,
      taxAmount: 18.5,
      discountAmount: 0,
      total: 388.5,
      paymentMode: 'CASH',
      cashReceived: 500,
      changeGiven: 111.5,
      staffName: 'Admin'
    };

    return this.printReceipt(mockReceipt);
  }
}

export const bluetoothPrinterService = new BluetoothPrinterService();
