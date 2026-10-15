import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { tr } from '@/i18n/tr';
import { formatDuration } from '@/lib/format';
import { leaveScreen } from '@/lib/navigation';

import { attachAudioRecording } from './captureService';
import { parseCaptureOrigin } from './origin';
import { useMomentDraft } from './useMomentDraft';
import { useVoiceRecorder } from './useVoiceRecorder';

/**
 * Note + voice recording for one moment. Everything is saved automatically: recordings as soon as
 * they stop, text when leaving the screen or when the app goes to the background.
 */
export function NoteScreen() {
  const params = useLocalSearchParams<{ source?: string; promptId?: string; record?: string }>();
  const origin = useMemo(
    () => parseCaptureOrigin({ source: params.source, promptId: params.promptId }),
    [params.source, params.promptId],
  );
  const autoRecord = params.record === '1';

  const navigation = useNavigation();
  const draft = useMomentDraft(origin);
  const voice = useVoiceRecorder();
  const [text, setText] = useState('');
  const [starred, setStarred] = useState(false);
  const [clips, setClips] = useState<number[]>([]);
  const [saveFailed, setSaveFailed] = useState(false);

  // Latest input for listeners that outlive a render.
  const latest = useRef({ text, starred });
  useEffect(() => {
    latest.current = { text, starred };
  }, [text, starred]);

  const finishRecording = useCallback(async () => {
    const recording = await voice.stop();
    if (!recording) return;
    try {
      const { text: currentText, starred: currentStarred } = latest.current;
      const momentId = draft.ensureMoment({
        note: currentText.trim() || null,
        starred: currentStarred,
      });
      await attachAudioRecording(momentId, recording.uri, recording.durationMs);
      setClips((existing) => [...existing, recording.durationMs]);
    } catch {
      setSaveFailed(true);
    }
  }, [voice, draft]);

  const flush = useCallback(async () => {
    await finishRecording();
    draft.saveText(latest.current.text, latest.current.starred);
  }, [finishRecording, draft]);

  // Save on every way out: header/back gesture, hardware back, or "Bitti".
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!voice.isRecordingNow()) {
          draft.saveText(latest.current.text, latest.current.starred);
          return;
        }
        event.preventDefault();
        void flush().finally(() => navigation.dispatch(event.data.action));
      }),
    [navigation, voice, draft, flush],
  );

  // The microphone is cut off in the background, so finish the recording there too.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void flush();
    });
    return () => subscription.remove();
  }, [flush]);

  const { start } = voice;
  useEffect(() => {
    if (autoRecord) void start();
  }, [autoRecord, start]);

  return (
    <Screen edges={['bottom']}>
      <View className="flex-1 px-4 pt-4">
        <TextInput
          className="min-h-40 flex-1 text-lg leading-7 text-neutral-900"
          placeholder={tr.capture.note.placeholder}
          placeholderTextColor="#a3a3a3"
          multiline
          autoFocus={!autoRecord}
          textAlignVertical="top"
          value={text}
          onChangeText={setText}
        />

        {clips.map((durationMs, i) => (
          <Text key={i} className="mb-1 text-sm text-neutral-500">
            {tr.capture.audio.saved(formatDuration(durationMs))}
          </Text>
        ))}
        {voice.error && (
          <Text className="mb-1 text-sm text-red-600">{tr.capture.audio.errors[voice.error]}</Text>
        )}
        {saveFailed && <Text className="mb-1 text-sm text-red-600">{tr.capture.saveFailed}</Text>}

        <View className="flex-row items-center gap-3 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => void (voice.isRecording ? finishRecording() : voice.start())}
            className={`flex-1 flex-row items-center justify-center rounded-2xl py-4 active:opacity-70 ${
              voice.isRecording ? 'bg-red-600' : 'bg-neutral-100'
            }`}
          >
            <Text className={`text-base ${voice.isRecording ? 'text-white' : 'text-neutral-900'}`}>
              {voice.isRecording
                ? tr.capture.audio.stop(formatDuration(voice.durationMs))
                : tr.capture.audio.start}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr.capture.star}
            onPress={() => setStarred((value) => !value)}
            className={`rounded-2xl px-5 py-4 active:opacity-70 ${
              starred ? 'bg-amber-100' : 'bg-neutral-100'
            }`}
          >
            <Text className="text-base">{starred ? '⭐' : '☆'}</Text>
          </Pressable>
        </View>

        <View className="pb-2">
          <Button label={tr.capture.done} onPress={() => void flush().then(leaveScreen)} />
        </View>
      </View>
    </Screen>
  );
}
