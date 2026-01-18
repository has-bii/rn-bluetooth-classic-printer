export type BluetoothError = {
  code: string;
  message: string;
};

export type BluetoothDevice = {
  id: string;
  name: string;
  rssi?: number;
};

export type RnBluetoothClassicPrinterModuleEvents = {
  onDeviceFound: (device: BluetoothDevice) => void;
};
