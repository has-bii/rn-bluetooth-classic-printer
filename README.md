# rn-bluetooth-classic-printer

A React Native/Expo module for printing to Bluetooth Classic thermal printers using ESC/POS commands.

## Features

- Scan and connect to Bluetooth Classic devices
- Print to thermal printers (58mm, 80mm)
- Built-in ESC/POS command library
- Text formatting (align, size, bold, underline)
- QR code printing
- Receipt helpers (line items, horizontal lines)
- TypeScript support
- Works with Expo and bare React Native projects

## Installation

```bash
npm install rn-bluetooth-classic-printer
```

For Expo managed projects, add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": ["rn-bluetooth-classic-printer"]
  }
}
```

For bare React Native projects, follow the [Expo modules setup guide](https://docs.expo.dev/modules/).

## Permissions

### Android

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### iOS

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth to connect to thermal printers.</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app uses Bluetooth to connect to thermal printers.</string>
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

### Connection

| Method | Description |
|--------|-------------|
| `connectDevice(deviceId)` | Connect to a device by MAC address |
| `disconnect()` | Disconnect from current device |

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
| `UNDERLINE_ON / UNDERLINE_OFF` | Toggle underline |
| `cut(type)` | Cut paper (FULL, PARTIAL) |
| `text(data)` | Create text command |
| `textLeft(str)` | Print left-aligned text |
| `textCenter(str)` | Print centered text |
| `textRight(str)` | Print right-aligned text |
| `newLine(count)` | Print new lines |
| `horizontalLine(style)` | Print horizontal line |
| `printLineItem(name, qty, price, total)` | Print formatted line item |
| `printQRCode(data, size)` | Print QR code |
| `combineCommands(...commands)` | Combine multiple commands |

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
