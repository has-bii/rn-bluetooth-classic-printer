import { EventSubscription } from "expo-modules-core";
import { BluetoothDevice } from "./RnBluetoothClassicPrinter.types";
import RnBluetoothClassicModule from "./RnBluetoothClassicPrinterModule";
import * as EscPos from "./EscPos";

export type {
  BluetoothError,
  RnBluetoothClassicPrinterModuleEvents,
  BluetoothDevice,
} from "./RnBluetoothClassicPrinter.types";

export default RnBluetoothClassicModule;

// ============================================================================
// BLUETOOTH STATUS
// ============================================================================

/**
 * Check if Bluetooth is enabled
 * @returns true if Bluetooth is enabled
 */
export function isBluetoothEnabled(): boolean {
  return RnBluetoothClassicModule.isBluetoothEnabled();
}

/**
 * Request to enable Bluetooth (shows system dialog)
 * @returns Promise that resolves to true if request was sent
 */
export function requestEnableBluetooth(): Promise<boolean> {
  return RnBluetoothClassicModule.requestEnableBluetooth();
}

// ============================================================================
// DEVICE DISCOVERY
// ============================================================================

/**
 * Start scanning for nearby Bluetooth devices
 * @param listener - Callback function called when a device is found
 * @returns EventSubscription - Call remove() to stop scanning and unsubscribe
 */
export function startScanning(
  listener: (device: BluetoothDevice) => void,
): EventSubscription {
  const subscription = RnBluetoothClassicModule.addListener(
    "onDeviceFound",
    listener,
  );
  RnBluetoothClassicModule.startScanning().catch((error) => {
    console.error("Failed to start scanning:", error);
  });
  return subscription;
}

/**
 * Stop scanning for Bluetooth devices
 * @returns true if stopped successfully
 */
export function stopScanning(): boolean {
  return RnBluetoothClassicModule.stopScanning();
}

// ============================================================================
// CONNECTION
// ============================================================================

/**
 * Connect to a Bluetooth device by MAC address
 * @param deviceId - MAC address of the device
 * @returns Promise that resolves to true if connected
 */
export function connectDevice(deviceId: string): Promise<boolean> {
  return RnBluetoothClassicModule.connectDevice(deviceId);
}

/**
 * Disconnect from the current device
 * @returns Promise that resolves to true if disconnected
 */
export function disconnect(): Promise<boolean> {
  return RnBluetoothClassicModule.disconnect();
}

// ============================================================================
// PRINTING
// ============================================================================

/**
 * Print raw ESC/POS commands (base64 encoded)
 * Use this with EscPos commands for full printer control
 * @param base64Data - Base64 encoded ESC/POS commands
 * @returns Promise that resolves to true if sent successfully
 */
export function printRaw(base64Data: string): Promise<boolean> {
  return RnBluetoothClassicModule.printRaw(base64Data);
}

// ============================================================================
// ESC/POS COMMANDS
// ============================================================================

export { EscPos };
