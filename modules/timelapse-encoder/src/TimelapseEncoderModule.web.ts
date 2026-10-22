import { registerWebModule, NativeModule } from 'expo';

import { EncodeOptions, TimelapseEncoderModuleEvents } from './TimelapseEncoder.types';

// Video encoding is only implemented on Android.
class TimelapseEncoderModule extends NativeModule<TimelapseEncoderModuleEvents> {
  async encodeAsync(_options: EncodeOptions): Promise<string> {
    throw new Error('Video oluşturma yalnızca Android cihazlarda desteklenir.');
  }

  cancel() {}
}

export default registerWebModule(TimelapseEncoderModule, 'TimelapseEncoderModule');
