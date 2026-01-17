import { requireNativeView } from 'expo';
import * as React from 'react';

import { RnBluetoothClassicPrinterViewProps } from './RnBluetoothClassicPrinter.types';

const NativeView: React.ComponentType<RnBluetoothClassicPrinterViewProps> =
  requireNativeView('RnBluetoothClassicPrinter');

export default function RnBluetoothClassicPrinterView(props: RnBluetoothClassicPrinterViewProps) {
  return <NativeView {...props} />;
}
