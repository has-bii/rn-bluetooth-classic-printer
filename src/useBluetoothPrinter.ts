import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import * as RnBluetoothClassicPrinter from "./index";
import type { BluetoothDevice } from "./index";

/**
 * Custom hook for Bluetooth Classic ESC/POS Printer
 *
 * Provides state management and functions for Bluetooth operations including:
 * - Bluetooth status (enabled/disabled)
 * - Device scanning and discovery
 * - Connection management
 * - Paired devices
 *
 * @example
 * ```tsx
 * const {
 *   isEnabled,
 *   pairedDevices,
 *   discoveredDevices,
 *   connectedDevice,
 *   isScanning,
 *   isLoading,
 *   message,
 *   checkBluetoothStatus,
 *   requestEnableBluetooth,
 *   startScanning,
 *   stopScanning,
 *   loadPairedDevices,
 *   connectDevice,
 *   disconnect,
 *   printRaw,
 * } = useBluetoothPrinter();
 * ```
 */
export function useBluetoothPrinter() {
  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<BluetoothDevice[]>(
    [],
  );
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null);

  // Store subscription ref for cleanup
  const scanningSubscriptionRef = useRef<ReturnType<
    typeof RnBluetoothClassicPrinter.startScanning
  > | null>(null);

  // ==========================================================================
  // PERMISSIONS
  // ==========================================================================

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      return true;
    }

    try {
      const requests = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      const granted =
        requests["android.permission.BLUETOOTH_SCAN"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        requests["android.permission.BLUETOOTH_CONNECT"] ===
          PermissionsAndroid.RESULTS.GRANTED;

      return granted;
    } catch {
      return false;
    }
  }, []);

  // ==========================================================================
  // BLUETOOTH STATUS
  // ==========================================================================

  const checkBluetoothStatus = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setMessage("Bluetooth permissions not granted");
        setIsLoading(false);
        return;
      }

      const enabled = RnBluetoothClassicPrinter.isBluetoothEnabled();
      setIsEnabled(enabled);
      setMessage(enabled ? "Bluetooth is enabled" : "Bluetooth is disabled");
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [requestPermissions]);

  const requestEnableBluetooth = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setMessage("Bluetooth permissions not granted");
        setIsLoading(false);
        return;
      }

      const result = await RnBluetoothClassicPrinter.requestEnableBluetooth();
      setIsEnabled(result);
      setMessage(
        result
          ? "Bluetooth enabled successfully"
          : "Bluetooth enable request denied",
      );
      return result;
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [requestPermissions]);

  // ==========================================================================
  // PAIRED DEVICES
  // ==========================================================================

  const loadPairedDevices = useCallback(async () => {
    setIsLoading(true);
    setMessage("Loading paired devices...");
    try {
      const devices = await RnBluetoothClassicPrinter.getPairedDevices();
      setPairedDevices(devices);
      setMessage(`Found ${devices.length} paired device(s)`);
      return devices;
    } catch (error: any) {
      setMessage(`Failed to load paired devices: ${error.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==========================================================================
  // DEVICE DISCOVERY
  // ==========================================================================

  const startScanning = useCallback(() => {
    setDiscoveredDevices([]);
    setMessage("Starting device scan...");
    setIsScanning(true);

    const subscription = RnBluetoothClassicPrinter.startScanning((device) => {
      setDiscoveredDevices((prev) => {
        // Avoid duplicates
        if (prev.some((d) => d.id === device.id)) {
          return prev;
        }
        return [...prev, device];
      });
    });

    scanningSubscriptionRef.current = subscription;
  }, []);

  // Internal cleanup without setState (for unmount)
  const cleanupScanningInternal = useCallback(() => {
    if (scanningSubscriptionRef.current) {
      scanningSubscriptionRef.current.remove();
      scanningSubscriptionRef.current = null;
    }
    RnBluetoothClassicPrinter.stopScanning();
  }, []);

  const stopScanning = useCallback(() => {
    cleanupScanningInternal();
    setIsScanning(false);
    setMessage("Scan stopped");
  }, [cleanupScanningInternal]);

  // ==========================================================================
  // CONNECTION
  // ==========================================================================

  const connectDevice = useCallback(async (device: BluetoothDevice) => {
    setIsLoading(true);
    setMessage(`Connecting to ${device.name}...`);
    try {
      const result = await RnBluetoothClassicPrinter.connectDevice(device.id);
      if (result) {
        setConnectedDevice(device);
        setMessage(`Connected to ${device.name}`);
        return true;
      }
      return false;
    } catch (error: any) {
      setMessage(`Connection failed: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setMessage("Disconnecting...");
    try {
      await RnBluetoothClassicPrinter.disconnect();
      setConnectedDevice(null);
      setMessage("Disconnected");
      return true;
    } catch (error: any) {
      setMessage(`Disconnect failed: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==========================================================================
  // PRINTING
  // ==========================================================================

  const printRaw = useCallback(
    async (base64Data: string): Promise<boolean> => {
      if (!connectedDevice) {
        setMessage("Not connected to any device");
        return false;
      }
      setIsLoading(true);
      try {
        await RnBluetoothClassicPrinter.printRaw(base64Data);
        setMessage("Print sent successfully");
        return true;
      } catch (error: any) {
        setMessage(`Print failed: ${error.message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [connectedDevice],
  );

  // ==========================================================================
  // INITIALIZATION & CLEANUP
  // ==========================================================================

  useEffect(() => {
    // Initialize on mount
    requestPermissions().then((granted) => {
      if (granted) {
        checkBluetoothStatus();
        loadPairedDevices();
        // Check for existing connection
        const connected = RnBluetoothClassicPrinter.getConnectedDevice();
        if (connected) {
          setConnectedDevice(connected);
          setMessage(`Reconnected to ${connected.name}`);
        }
      }
    });

    // Cleanup on unmount - use internal cleanup without setState
    return cleanupScanningInternal;
  }, [
    requestPermissions,
    checkBluetoothStatus,
    loadPairedDevices,
    cleanupScanningInternal,
  ]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    isEnabled,
    isLoading,
    message,
    pairedDevices,
    discoveredDevices,
    isScanning,
    connectedDevice,

    // Actions
    checkBluetoothStatus,
    requestEnableBluetooth,
    loadPairedDevices,
    startScanning,
    stopScanning,
    connectDevice,
    disconnect,
    printRaw,

    // Setters for message (for custom messages)
    setMessage,
  };
}
