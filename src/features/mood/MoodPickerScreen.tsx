import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { saveMoment } from '@/features/capture/captureService';
import { parseCaptureOrigin } from '@/features/capture/origin';
import { tr } from '@/i18n/tr';
import { leaveScreen } from '@/lib/navigation';

import { MoodGrid } from './MoodGrid';

/** One tap saves the mood as a new moment and closes the screen. */
export function MoodPickerScreen() {
  const params = useLocalSearchParams<{ source?: string; promptId?: string }>();
  const origin = useMemo(
    () => parseCaptureOrigin({ source: params.source, promptId: params.promptId }),
    [params.source, params.promptId],
  );

  return (
    <Screen edges={['bottom']}>
      <View className="flex-1 justify-center px-4">
        <Text className="mb-8 text-center text-2xl font-semibold text-neutral-900">
          {tr.capture.mood.question}
        </Text>
        <MoodGrid
          onSelect={(mood) => {
            saveMoment(origin, { mood });
            leaveScreen();
          }}
        />
      </View>
    </Screen>
  );
}
