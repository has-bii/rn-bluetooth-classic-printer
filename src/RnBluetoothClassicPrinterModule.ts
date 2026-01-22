import { NativeModule, requireNativeModule } from "expo";

import { BluetoothDevice, RnBluetoothClassicPrinterModuleEvents } from "./RnBluetoothClassicPrinter.types";

/**
 * React Native module for Bluetooth Classic ESC/POS thermal printers
 */
declare class RnBluetoothClassicPrinterModule extends NativeModule<RnBluetoothClassicPrinterModuleEvents> {
  /**
   * Check if Bluetooth is enabled
   * @returns true if Bluetooth is enabled
   */
  isBluetoothEnabled: () => boolean;

  /**
   * Request to enable Bluetooth (shows system dialog)
   * @returns Promise that resolves to true if request was sent
   */
  requestEnableBluetooth: () => Promise<boolean>;

  /**
   * Start scanning for Bluetooth devices
   * Emits "onDeviceFound" events as devices are discovered
   * @returns Promise that resolves to true if scanning started
   */
  startScanning: () => Promise<boolean>;

  /**
   * Stop scanning for Bluetooth devices
   * @returns true if stopped successfully
   */
  stopScanning: () => boolean;

  /**
   * Get paired/bonded Bluetooth devices
   * @returns Promise that resolves to array of paired devices
   */
  getPairedDevices: () => Promise<BluetoothDevice[]>;

  /**
   * Connect to a Bluetooth device by MAC address
   * @param deviceId - MAC address of the device
   * @returns Promise that resolves to true if connected
   */
  connectDevice: (deviceId: string) => Promise<boolean>;

  /**
   * Disconnect from the current device
   * @returns Promise that resolves to true if disconnected
   */
  disconnect: () => Promise<boolean>;

  /**
   * Get the currently connected device
   * @returns Connected device or null if not connected
   */
  getConnectedDevice: () => BluetoothDevice | null;

  /**
   * Print raw ESC/POS commands (base64 encoded)
   * Use with EscPos.ts commands
   * @param base64Data - Base64 encoded ESC/POS commands
   * @returns Promise that resolves to true if sent successfully
   */
  printRaw: (base64Data: string) => Promise<boolean>;
}

export default requireNativeModule<RnBluetoothClassicPrinterModule>(
  "RnBluetoothClassicPrinter",
);
