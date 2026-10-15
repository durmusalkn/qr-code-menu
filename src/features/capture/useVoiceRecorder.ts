import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useRef, useState } from 'react';

import { AUDIO_RECORDING_OPTIONS } from './audio';

export interface FinishedRecording {
  uri: string;
  durationMs: number;
}

export type VoiceRecorderError = 'permission' | 'failed';

/** In-app voice recording (AAC, 48 kHz). */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(AUDIO_RECORDING_OPTIONS);
  const state = useAudioRecorderState(recorder, 250);
  const [error, setError] = useState<VoiceRecorderError | null>(null);
  const recordingRef = useRef(false);

  const start = useCallback(async () => {
    setError(null);
    try {
      let permission = await getRecordingPermissionsAsync();
      if (!permission.granted) permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('permission');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingRef.current = true;
    } catch {
      setError('failed');
    }
  }, [recorder]);

  /** Stops the recording; resolves to the finished file, or null if nothing was recording. */
  const stop = useCallback(async (): Promise<FinishedRecording | null> => {
    if (!recordingRef.current) return null;
    recordingRef.current = false;
    const durationMs = recorder.getStatus().durationMillis;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      setError('failed');
      return null;
    }
    return recorder.uri ? { uri: recorder.uri, durationMs } : null;
  }, [recorder]);

  return {
    isRecording: state.isRecording,
    durationMs: state.durationMillis,
    error,
    start,
    stop,
    /** Synchronous check usable from event handlers before state re-renders. */
    isRecordingNow: () => recordingRef.current,
  };
}
