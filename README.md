# rn-bluetooth-classic-printer

A React Native module for printing to Bluetooth Classic thermal printers (58mm) using ESC/POS commands.

> **Note:** This library only works on Android. iOS is not supported because it doesn't allow direct connections to Bluetooth Classic devices from apps.

## Features

- Scan and connect to Bluetooth Classic devices
- Get paired and connected devices
- Print to 58mm thermal printers
- Built-in ESC/POS command library
- Text formatting (align, size, bold, underline, reverse)
- QR code printing
- Receipt helpers (line items, horizontal lines, justified text)
- React hook for easy state management
- TypeScript support
- Works with Expo and bare React Native projects

## Installation

```bash
npm install rn-bluetooth-classic-printer
```

For bare React Native projects, follow the [Expo modules setup guide](https://docs.expo.dev/modules/).

## Permissions

### Android (Bare React Native)

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />
```

### Expo (app.json / app.config.js)

Add the permissions to your Expo config within the `android` property:

```json
{
  "expo": {
    "android": {
      "permissions": [
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN"
      ]
    }
  }
}
```

## Usage

### Basic Example

```typescript
import RnBluetoothClassicPrinter, { EscPos } from 'rn-bluetooth-classic-printer';

// Check if Bluetooth is enabled
const isEnabled = RnBluetoothClassicPrinter.isBluetoothEnabled();

// Request to enable Bluetooth (shows system dialog)
if (!isEnabled) {
  await RnBluetoothClassicPrinter.requestEnableBluetooth();
}

// Scan for devices
const subscription = RnBluetoothClassicPrinter.startScanning((device) => {
  console.log('Found device:', device.name, device.id);
});

// Stop scanning after 10 seconds
setTimeout(() => {
  subscription.remove();
  RnBluetoothClassicPrinter.stopScanning();
}, 10000);

// Connect to a printer
await RnBluetoothClassicPrinter.connectDevice('00:11:22:33:44:55');

// Print a receipt
const receipt = EscPos.combineCommands(
  EscPos.INIT,
  EscPos.textCenter('MY STORE\n'),
  EscPos.newLine(),
  EscPos.textLeft('Item 1         $10.00\n'),
  EscPos.textLeft('Item 2         $15.00\n'),
  EscPos.horizontalLine('normal'),
  EscPos.text('TOTAL:           $25.00\n'),
  EscPos.newLine(3),
  EscPos.cut()
);

await RnBluetoothClassicPrinter.printRaw(receipt);

// Disconnect when done
await RnBluetoothClassicPrinter.disconnect();
```

### Text Formatting

```typescript
import { EscPos } from 'rn-bluetooth-classic-printer';

const formattedText = EscPos.combineCommands(
  EscPos.INIT,
  EscPos.BOLD_ON,
  EscPos.textCenter('HEADER\n'),
  EscPos.BOLD_OFF,
  EscPos.newLine(),
  EscPos.setTextSize(EscPos.TextSize.DOUBLE_WIDTH),
  EscPos.text('Large Text\n'),
  EscPos.setTextSize(EscPos.TextSize.NORMAL),
  EscPos.textLeft('Left aligned\n'),
  EscPos.textCenter('Center aligned\n'),
  EscPos.textRight('Right aligned\n'),
  EscPos.UNDERLINE_ON,
  EscPos.text('Underlined text\n'),
  EscPos.UNDERLINE_OFF
);
```

### Print Line Items

```typescript
import { EscPos } from 'rn-bluetooth-classic-printer';

const lineItems = EscPos.combineCommands(
  EscPos.INIT,
  EscPos.textLeft('Coffee Shop\n'),
  EscPos.newLine(),
  EscPos.printLineItem('Latte', 2, 4.50, 9.00),
  EscPos.printLineItem('Croissant', 1, 3.00, 3.00),
  EscPos.horizontalLine('dashed'),
  EscPos.textRight('TOTAL: $12.00\n'),
  EscPos.newLine(3)
);
```

### QR Code

```typescript
import { EscPos } from 'rn-bluetooth-classic-printer';

const qrCode = EscPos.combineCommands(
  EscPos.INIT,
  EscPos.textCenter('Scan for receipt\n'),
  EscPos.newLine(),
  EscPos.printQRCode('https://example.com/receipt/12345', 8),
  EscPos.newLine(3)
);
```

### Print Justified Text

```typescript
import { EscPos } from 'rn-bluetooth-classic-printer';

const justified = EscPos.combineCommands(
  EscPos.INIT,
  EscPos.printJustify('Coffee', '$3.50'),                              // "Coffee                   $3.50"
  EscPos.printJustify('Coffee', '$3.50', 2),                           // "Coffee                 $3.50"
  EscPos.printJustify('Very Long Item Name', '$9.99'),                 // "Very Long Item...       $9.99"
  EscPos.newLine()
);
```

### Using the React Hook

The `useBluetoothPrinter` hook provides state management and functions for Bluetooth printer operations:

```typescript
import { useBluetoothPrinter, EscPos } from 'rn-bluetooth-classic-printer';

function PrinterComponent() {
  const {
    isEnabled,
    pairedDevices,
    discoveredDevices,
    connectedDevice,
    isScanning,
    isLoading,
    message,
    checkBluetoothStatus,
    requestEnableBluetooth,
    startScanning,
    stopScanning,
    loadPairedDevices,
    connectDevice,
    disconnect,
    printRaw,
  } = useBluetoothPrinter();

  // Connect to a paired device
  const handleConnect = async (device) => {
    await connectDevice(device);
  };

  // Print a receipt
  const handlePrint = async () => {
    const receipt = EscPos.combineCommands(
      EscPos.INIT,
      EscPos.textCenter('MY STORE\n'),
      EscPos.newLine(),
      EscPos.printJustify('Item 1', '$10.00'),
      EscPos.printJustify('Item 2', '$15.00'),
      EscPos.horizontalLine('normal'),
      EscPos.text('TOTAL:           $25.00\n'),
      EscPos.newLine(3),
      EscPos.cut()
    );
    await printRaw(receipt);
  };

  return (
    <View>
      <Text>{message}</Text>
      <Button title="Load Paired Devices" onPress={loadPairedDevices} />
      <Button title="Start Scanning" onPress={startScanning} />
      <Button title="Stop Scanning" onPress={stopScanning} />
    </View>
  );
}
```

## API Reference

### Bluetooth Status

| Method | Description |
|--------|-------------|
| `isBluetoothEnabled()` | Check if Bluetooth is enabled |
| `requestEnableBluetooth()` | Request to enable Bluetooth (shows system dialog) |

### Device Discovery

| Method | Description |
|--------|-------------|
| `startScanning(listener)` | Start scanning for devices. Returns EventSubscription |
| `stopScanning()` | Stop scanning for devices |
| `getPairedDevices()` | Get paired/bonded Bluetooth devices (Promise) |

### Connection

| Method | Description |
|--------|-------------|
| `connectDevice(deviceId)` | Connect to a device by MAC address |
| `disconnect()` | Disconnect from current device |
| `getConnectedDevice()` | Get the currently connected device |

### Printing

| Method | Description |
|--------|-------------|
| `printRaw(base64Data)` | Print raw ESC/POS commands (base64 encoded) |

### Events

| Event | Payload |
|-------|---------|
| `onDeviceFound` | `BluetoothDevice { id, name, rssi? }` |

### ESC/POS Commands

| Constant/Function | Description |
|-------------------|-------------|
| `INIT` | Initialize printer |
| `LF` | Line feed |
| `FF` | Form feed (eject paper) |
| `setAlign(align)` | Set text alignment (LEFT, CENTER, RIGHT) |
| `setTextSize(size)` | Set text size (NORMAL, DOUBLE_HEIGHT, DOUBLE_WIDTH, DOUBLE_BOTH) |
| `BOLD_ON / BOLD_OFF` | Toggle bold text |
| `UNDERLINE_ON / UNDERLINE_OFF / UNDERLINE_DOUBLE` | Toggle underline |
| `REVERSE_ON / REVERSE_OFF` | Toggle reverse mode |
| `cut(type)` | Cut paper (FULL, PARTIAL) |
| `text(data)` | Create text command |
| `textLeft(str)` | Print left-aligned text |
| `textCenter(str)` | Print centered text |
| `textRight(str)` | Print right-aligned text |
| `newLine(count)` | Print new lines |
| `horizontalLine(style)` | Print horizontal line |
| `printJustify(left, right, gap?, width?)` | Print justified text (left + right aligned) |
| `printLineItem(name, qty, price, total)` | Print formatted line item |
| `printQRCode(data, size)` | Print QR code |
| `combineCommands(...commands)` | Combine multiple commands |

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
