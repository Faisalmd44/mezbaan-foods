import { registerPlugin, Capacitor } from '@capacitor/core';

export interface PairedDevice {
  address: string;
  name: string;
}

export interface BluetoothSppPluginInterface {
  checkPermissions(): Promise<{ granted: boolean; denied: string[] }>;
  requestPermissions(): Promise<{ granted: boolean; denied: string[] }>;

  isBluetoothEnabled(): Promise<{ enabled: boolean }>;
  enableBluetooth(): Promise<{ enabled: boolean }>;

  getPairedDevices(): Promise<{ devices: PairedDevice[] }>;
  startDiscovery(): Promise<{ started: boolean }>;
  cancelDiscovery(): Promise<{ cancelled: boolean }>;

  connect(address: string): Promise<{ connected: boolean; message: string }>;
  disconnect(): Promise<{ disconnected: boolean }>;
  isConnected(): Promise<{ connected: boolean }>;

  printData(data: number[]): Promise<{ success: boolean; message: string }>;
}

const BluetoothSppPlugin = registerPlugin<BluetoothSppPluginInterface>('BluetoothSppPlugin');

export const isBluetoothPluginAvailable = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export default BluetoothSppPlugin;
