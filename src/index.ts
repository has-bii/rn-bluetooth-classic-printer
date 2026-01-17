// Reexport the native module. On web, it will be resolved to RnBluetoothClassicPrinterModule.web.ts
// and on native platforms to RnBluetoothClassicPrinterModule.ts
export { default } from './RnBluetoothClassicPrinterModule';
export { default as RnBluetoothClassicPrinterView } from './RnBluetoothClassicPrinterView';
export * from  './RnBluetoothClassicPrinter.types';
