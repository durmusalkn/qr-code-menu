import { RecordingPresets, type RecordingOptions } from 'expo-audio';

/** High quality voice recordings: AAC in an MPEG-4 container (.m4a), 48 kHz. */
export const AUDIO_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 48_000,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    sampleRate: 48_000,
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
};
