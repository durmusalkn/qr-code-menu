import { NativeModule, requireNativeModule } from 'expo';

import { EncodeOptions, TimelapseEncoderModuleEvents } from './TimelapseEncoder.types';

declare class TimelapseEncoderModule extends NativeModule<TimelapseEncoderModuleEvents> {
  /** Renders the photos into an MP4 and resolves with its `file://` URI. */
  encodeAsync(options: EncodeOptions): Promise<string>;
  /** Stops a running `encodeAsync`, which then rejects with `ERR_CANCELLED`. */
  cancel(): void;
}

export default requireNativeModule<TimelapseEncoderModule>('TimelapseEncoder');
