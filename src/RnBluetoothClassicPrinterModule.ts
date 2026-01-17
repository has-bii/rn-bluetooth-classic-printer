import { NativeModule, requireNativeModule } from 'expo';

import { RnBluetoothClassicPrinterModuleEvents } from './RnBluetoothClassicPrinter.types';

declare class RnBluetoothClassicPrinterModule extends NativeModule<RnBluetoothClassicPrinterModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<RnBluetoothClassicPrinterModule>('RnBluetoothClassicPrinter');
