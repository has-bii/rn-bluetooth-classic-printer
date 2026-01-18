import * as React from "react";
import * as RnBluetoothClassicPrinter from "rn-bluetooth-classic-printer";
import type { BluetoothDevice } from "rn-bluetooth-classic-printer";
import { EscPos } from "rn-bluetooth-classic-printer";
import { Platform, PermissionsAndroid } from "react-native";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ReactNode } from "react";

function Wrapper({ children }: { children: ReactNode }) {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}

export default function App() {
  const [isEnabled, setIsEnabled] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string>("");

  // Device states
  const [discoveredDevices, setDiscoveredDevices] = React.useState<
    BluetoothDevice[]
  >([]);
  const [isScanning, setIsScanning] = React.useState(false);
  const [connectedDevice, setConnectedDevice] =
    React.useState<BluetoothDevice | null>(null);
  const [scanningSubscription, setScanningSubscription] =
    React.useState<ReturnType<
      typeof RnBluetoothClassicPrinter.startScanning
    > | null>(null);

  const requestPermissions = async () => {
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
    } catch (error) {
      console.warn("Permission request error:", error);
      return false;
    }
  };

  const checkBluetoothStatus = async () => {
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
  };

  const requestEnableBluetooth = async () => {
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
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startDiscovery = () => {
    setDiscoveredDevices([]);
    setMessage("Starting device scan...");
    console.log("Starting device scan...");
    setIsScanning(true);

    const subscription = RnBluetoothClassicPrinter.startScanning((device) => {
      console.log("Device found:", device.name, device.id);
      setDiscoveredDevices((prev) => {
        // Avoid duplicates
        if (prev.some((d) => d.id === device.id)) {
          return prev;
        }
        return [...prev, device];
      });
    });

    setScanningSubscription(subscription);
  };

  const stopDiscovery = () => {
    if (scanningSubscription) {
      scanningSubscription.remove();
      setScanningSubscription(null);
    }
    RnBluetoothClassicPrinter.stopScanning();
    setIsScanning(false);
    setMessage("Scan stopped");
  };

  const connectDevice = async (device: BluetoothDevice) => {
    setIsLoading(true);
    setMessage(`Connecting to ${device.name}...`);
    try {
      const result = await RnBluetoothClassicPrinter.connectDevice(device.id);
      if (result) {
        setConnectedDevice(device);
        setMessage(`Connected to ${device.name}`);
      }
    } catch (error: any) {
      setMessage(`Connection failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectDevice = async () => {
    setIsLoading(true);
    setMessage("Disconnecting...");
    try {
      await RnBluetoothClassicPrinter.disconnect();
      setConnectedDevice(null);
      setMessage("Disconnected");
    } catch (error: any) {
      setMessage(`Disconnect failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Text Formatting Demo - All text styles, alignments, sizes
  const printTextFormattingDemo = async () => {
    if (!connectedDevice) {
      setMessage("Not connected to any device");
      return;
    }
    setIsLoading(true);
    setMessage("Printing text formatting demo...");
    try {
      const commands = EscPos.combineCommands(
        EscPos.INIT,
        // Header
        EscPos.textCenter("=== TEXT FORMATTING ===\n"),
        EscPos.newLine(2),

        // Normal text
        EscPos.text("1. Normal Text\n"),
        EscPos.newLine(),

        // Bold text
        EscPos.BOLD_ON,
        EscPos.text("2. Bold Text\n"),
        EscPos.BOLD_OFF,
        EscPos.newLine(),

        // Underline styles
        EscPos.UNDERLINE_ON,
        EscPos.text("3. Single Underline\n"),
        EscPos.UNDERLINE_DOUBLE,
        EscPos.text("4. Double Underline\n"),
        EscPos.UNDERLINE_OFF,
        EscPos.newLine(),

        // Reverse mode
        EscPos.REVERSE_ON,
        EscPos.text("5. Reverse Mode\n"),
        EscPos.REVERSE_OFF,
        EscPos.newLine(),

        // Text sizes
        EscPos.text("6. Text Sizes:\n"),
        EscPos.setTextSize(EscPos.TextSize.DOUBLE_HEIGHT),
        EscPos.text("DOUBLE HEIGHT\n"),
        EscPos.setTextSize(EscPos.TextSize.DOUBLE_WIDTH),
        EscPos.text("DOUBLE WIDTH\n"),
        EscPos.setTextSize(EscPos.TextSize.DOUBLE_BOTH),
        EscPos.text("DOUBLE BOTH\n"),
        EscPos.setTextSize(EscPos.TextSize.NORMAL),
        EscPos.text("Normal\n"),
        EscPos.newLine(2),

        // Alignment
        EscPos.text("7. Alignment:\n"),
        EscPos.textLeft("LEFT aligned\n"),
        EscPos.textCenter("CENTER aligned\n"),
        EscPos.textRight("RIGHT aligned\n"),
        EscPos.newLine(2),

        // Horizontal lines
        EscPos.text("8. Horizontal Lines:\n"),
        EscPos.horizontalLine("normal"),
        EscPos.newLine(),
        EscPos.horizontalLine("dashed"),
        EscPos.newLine(),
        EscPos.horizontalLine("double"),
        EscPos.newLine(2),

        // New lines
        EscPos.text("9. New Lines (3x):\n"),
        EscPos.newLine(3),
        EscPos.text("After 3 new lines!\n"),
        EscPos.newLine(2),

        EscPos.cut(EscPos.CutType.PARTIAL),
      );
      await RnBluetoothClassicPrinter.printRaw(commands);
      setMessage("Text formatting demo printed!");
    } catch (error: any) {
      setMessage(`Print failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Receipt Demo - Using helper functions
  const printReceiptDemo = async () => {
    if (!connectedDevice) {
      setMessage("Not connected to any device");
      return;
    }
    setIsLoading(true);
    setMessage("Printing receipt demo...");
    try {
      const commands = EscPos.combineCommands(
        // Header with manual commands
        EscPos.setAlign(EscPos.Align.CENTER),
        EscPos.setTextSize(EscPos.TextSize.DOUBLE_BOTH),
        EscPos.BOLD_ON,
        EscPos.text("COFFEE SHOP\n"),
        EscPos.BOLD_OFF,
        EscPos.setTextSize(EscPos.TextSize.NORMAL),
        EscPos.text("123 Main St\nTel: 555-1234\n"),
        EscPos.LF,
        EscPos.setAlign(EscPos.Align.LEFT),

        // Order info
        EscPos.textLeft(`Date: ${new Date().toLocaleDateString()}\n`),
        EscPos.textLeft(`Time: ${new Date().toLocaleTimeString()}\n`),
        EscPos.textLeft(`Order #: 12345\n`),
        EscPos.LF,

        // Line separator
        EscPos.horizontalLine("normal"),
        EscPos.LF,

        // Line items
        EscPos.printLineItem("Latte", 2, 4.5, 9.0),
        EscPos.printLineItem("Croissant", 1, 3.75, 3.75),
        EscPos.printLineItem("Muffin", 3, 2.5, 7.5),
        EscPos.LF,

        // Separator
        EscPos.horizontalLine("double"),
        EscPos.LF,

        // Footer with total
        EscPos.setAlign(EscPos.Align.RIGHT),
        EscPos.setTextSize(EscPos.TextSize.DOUBLE_HEIGHT),
        EscPos.BOLD_ON,
        EscPos.text(`TOTAL: $${(20.25).toFixed(2)}\n`),
        EscPos.BOLD_OFF,
        EscPos.setTextSize(EscPos.TextSize.NORMAL),
        EscPos.setAlign(EscPos.Align.LEFT),
        EscPos.newLine(2),
        EscPos.cut(EscPos.CutType.PARTIAL),
      );
      await RnBluetoothClassicPrinter.printRaw(commands);
      setMessage("Receipt demo printed!");
    } catch (error: any) {
      setMessage(`Print failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Paper Operations Demo - Cut, feed, form feed
  const printPaperOperationsDemo = async () => {
    if (!connectedDevice) {
      setMessage("Not connected to any device");
      return;
    }
    setIsLoading(true);
    setMessage("Printing paper operations demo...");
    try {
      const commands = EscPos.combineCommands(
        EscPos.INIT,
        EscPos.textCenter("=== PAPER OPERATIONS ===\n"),
        EscPos.newLine(2),

        EscPos.text("1. Line Feed (LF):\n"),
        EscPos.LF,
        EscPos.LF,
        EscPos.LF,
        EscPos.text("After 3 line feeds\n"),
        EscPos.newLine(2),

        EscPos.text("2. New Lines (5 lines):\n"),
        EscPos.newLine(5),
        EscPos.text("After 5 new lines\n"),
        EscPos.newLine(2),

        EscPos.text("3. Form Feed (eject paper):\n"),
        EscPos.FF,
        EscPos.text("After form feed\n"),
        EscPos.newLine(2),

        EscPos.text("4. Partial Cut:\n"),
        EscPos.newLine(3),
        EscPos.cut(EscPos.CutType.PARTIAL),
        EscPos.text("This is after partial cut!\n"),
        EscPos.newLine(3),

        EscPos.text("5. Full Cut:\n"),
        EscPos.newLine(3),
        EscPos.cut(EscPos.CutType.FULL),
        EscPos.text("This is after full cut!\n"),
        EscPos.newLine(2),

        EscPos.cut(EscPos.CutType.PARTIAL),
      );
      await RnBluetoothClassicPrinter.printRaw(commands);
      setMessage("Paper operations demo printed!");
    } catch (error: any) {
      setMessage(`Print failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Complete Demo - All features in one receipt
  const printCompleteDemo = async () => {
    if (!connectedDevice) {
      setMessage("Not connected to any device");
      return;
    }
    setIsLoading(true);
    setMessage("Printing complete demo...");
    try {
      const commands = EscPos.combineCommands(
        // Initialize
        EscPos.INIT,

        // Header with styling
        EscPos.setAlign(EscPos.Align.CENTER),
        EscPos.setTextSize(EscPos.TextSize.DOUBLE_BOTH),
        EscPos.BOLD_ON,
        EscPos.text("MY STORE\n"),
        EscPos.BOLD_OFF,
        EscPos.setTextSize(EscPos.TextSize.NORMAL),
        EscPos.text("Complete ESC/POS Demo\n"),
        EscPos.horizontalLine("normal"),
        EscPos.setAlign(EscPos.Align.LEFT),
        EscPos.LF,

        // Text formatting examples
        EscPos.BOLD_ON,
        EscPos.text("TEXT FORMATTING:\n"),
        EscPos.BOLD_OFF,
        EscPos.UNDERLINE_ON,
        EscPos.text("Normal, Underline, "),
        EscPos.UNDERLINE_OFF,
        EscPos.BOLD_ON,
        EscPos.text("Bold\n"),
        EscPos.BOLD_OFF,
        EscPos.LF,

        // Alignment examples
        EscPos.textLeft("Left Align\n"),
        EscPos.textCenter("Center Align\n"),
        EscPos.textRight("Right Align\n"),
        EscPos.LF,

        // Horizontal lines
        EscPos.horizontalLine("normal"),
        EscPos.horizontalLine("dashed"),
        EscPos.horizontalLine("double"),
        EscPos.LF,

        // Receipt items
        EscPos.horizontalLine("normal"),
        EscPos.LF,
        EscPos.setAlign(EscPos.Align.LEFT),
        EscPos.printLineItem("Demo Item 1", 2, 5.0, 10.0),
        EscPos.printLineItem("Demo Item 2", 1, 15.0, 15.0),
        EscPos.printLineItem("Demo Item 3", 3, 2.5, 7.5),
        EscPos.LF,

        // Test
        EscPos.textLeft("Grimaxone 4 x $5.00"),
        EscPos.textRight("$20.00"),
        EscPos.LF,

        // Total
        EscPos.horizontalLine("double"),
        EscPos.LF,
        EscPos.setAlign(EscPos.Align.RIGHT),
        EscPos.setTextSize(EscPos.TextSize.DOUBLE_HEIGHT),
        EscPos.BOLD_ON,
        EscPos.text("TOTAL: $32.50\n"),
        EscPos.BOLD_OFF,
        EscPos.setTextSize(EscPos.TextSize.NORMAL),
        EscPos.setAlign(EscPos.Align.LEFT),
        EscPos.LF,
        EscPos.LF,

        // Thank you message
        EscPos.setAlign(EscPos.Align.CENTER),
        EscPos.text("Thank you for your purchase!\n"),
        EscPos.newLine(2),

        // Cut
        EscPos.cut(EscPos.CutType.PARTIAL),
      );
      await RnBluetoothClassicPrinter.printRaw(commands);
      setMessage("Complete demo printed!");
    } catch (error: any) {
      setMessage(`Print failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Print QR
  const printQr = async () => {
    if (!connectedDevice) {
      setMessage("Not connected to any device");
      return;
    }
    setIsLoading(true);
    setMessage("Printing complete demo...");
    try {
      const commands = EscPos.combineCommands(
        // Initialize
        EscPos.INIT,
        EscPos.LF,
        EscPos.printQRCode("https://example.com", 11),
        EscPos.LF,
        EscPos.printQRCode("https://example.com", 12),
        EscPos.LF,
        EscPos.printQRCode("https://example.com", 13),
        EscPos.LF,
        EscPos.printQRCode("https://example.com", 14),
        EscPos.LF,
        EscPos.printQRCode("https://example.com", 15),
        EscPos.LF,
        EscPos.printQRCode("https://example.com", 16),
        EscPos.LF,
      );
      await RnBluetoothClassicPrinter.printRaw(commands);
      setMessage("Complete demo printed!");
    } catch (error: any) {
      setMessage(`Print failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    requestPermissions().then(() => {
      checkBluetoothStatus();
    });

    return () => {
      if (scanningSubscription) {
        scanningSubscription.remove();
      }
    };
  }, []);

  const renderDevice = (device: BluetoothDevice) => (
    <TouchableOpacity
      key={device.id}
      style={[
        styles.deviceItem,
        connectedDevice?.id === device.id && styles.deviceItemConnected,
      ]}
      onPress={() => connectDevice(device)}
    >
      <View style={styles.deviceInfo}>
        <View style={styles.deviceNameRow}>
          <Text style={styles.deviceName}>{device.name}</Text>
        </View>
        <Text style={styles.deviceAddress}>ID: {device.id}</Text>
        {device.rssi !== undefined && (
          <Text style={styles.deviceRssi}>RSSI: {device.rssi} dBm</Text>
        )}
      </View>
      {connectedDevice?.id === device.id && (
        <View style={styles.connectedBadge}>
          <Text style={styles.connectedBadgeText}>Connected</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Wrapper>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bluetooth Classic Printer</Text>
            <Text style={styles.subtitle}>
              Test and debug Bluetooth functionality
            </Text>
          </View>

          {/* Status Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bluetooth Status</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor:
                      isEnabled === true
                        ? "#4CAF50"
                        : isEnabled === false
                          ? "#F44336"
                          : "#9E9E9E",
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {isEnabled === true
                  ? "Enabled"
                  : isEnabled === false
                    ? "Disabled"
                    : "Unknown"}
              </Text>
            </View>
          </View>

          {/* Actions Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actions</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.halfButton, styles.primaryButton]}
                onPress={checkBluetoothStatus}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Check Status</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.halfButton,
                  styles.secondaryButton,
                ]}
                onPress={requestEnableBluetooth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#2196F3" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Enable</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.halfButton,
                  isScanning ? styles.dangerButton : styles.primaryButton,
                ]}
                onPress={isScanning ? stopDiscovery : startDiscovery}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isScanning ? "Stop Scan" : "Start Scan"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.halfButton,
                  connectedDevice
                    ? styles.dangerButton
                    : styles.secondaryButton,
                ]}
                onPress={connectedDevice ? disconnectDevice : () => {}}
                disabled={!connectedDevice || isLoading}
              >
                <Text
                  style={
                    connectedDevice
                      ? styles.buttonText
                      : styles.secondaryButtonText
                  }
                >
                  Disconnect
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Discovered Devices Card */}
          {discoveredDevices.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Discovered Devices ({discoveredDevices.length})
              </Text>
              {discoveredDevices.map((device) => renderDevice(device))}
            </View>
          )}

          {/* Print Card */}
          {connectedDevice && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Print to {connectedDevice.name}
              </Text>

              {/* ESC/POS Demo Prints */}
              <View style={styles.printSection}>
                <Text style={styles.printSectionTitle}>1. Text Formatting</Text>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={printTextFormattingDemo}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#2196F3" />
                  ) : (
                    <Text style={styles.secondaryButtonText}>
                      Text Formatting
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.printSection}>
                <Text style={styles.printSectionTitle}>2. Receipt Example</Text>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={printReceiptDemo}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#2196F3" />
                  ) : (
                    <Text style={styles.secondaryButtonText}>Receipt Demo</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.printSection}>
                <Text style={styles.printSectionTitle}>
                  3. Paper Operations
                </Text>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={printPaperOperationsDemo}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#2196F3" />
                  ) : (
                    <Text style={styles.secondaryButtonText}>
                      Paper Operations
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.printSection}>
                <Text style={styles.printSectionTitle}>4. Print QR Code</Text>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={printQr}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#2196F3" />
                  ) : (
                    <Text style={styles.secondaryButtonText}>
                      Print QR Code
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.printSection}>
                <Text style={styles.printSectionTitle}>5. Complete Demo</Text>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={printCompleteDemo}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Complete Demo (All Features)
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Message Card */}
          {message ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Message</Text>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212121",
  },
  subtitle: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    color: "#424242",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  halfButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#2196F3",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  dangerButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "600",
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  deviceItemConnected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  deviceAddress: {
    fontSize: 11,
    color: "#757575",
    marginTop: 2,
  },
  deviceRssi: {
    fontSize: 11,
    color: "#757575",
    marginTop: 2,
  },
  connectedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  printSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 8,
  },
  printSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 20,
  },
});
