import { registerWebModule, NativeModule } from 'expo';

import { RnBluetoothClassicPrinterModuleEvents } from './RnBluetoothClassicPrinter.types';

class RnBluetoothClassicPrinterModule extends NativeModule<RnBluetoothClassicPrinterModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(RnBluetoothClassicPrinterModule, 'RnBluetoothClassicPrinterModule');
