import * as React from 'react';

import { RnBluetoothClassicPrinterViewProps } from './RnBluetoothClassicPrinter.types';

export default function RnBluetoothClassicPrinterView(props: RnBluetoothClassicPrinterViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
