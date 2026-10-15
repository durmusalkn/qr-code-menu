import { Link, Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  CameraPermissionError,
  captureWithCamera,
  recoverPendingCameraResult,
} from '@/features/capture/captureService';
import { useCaptureFeedback } from '@/features/capture/feedback';
import { isOnboardingCompleted } from '@/features/onboarding/onboardingState';
import { usePermissionStatuses } from '@/features/onboarding/permissionStore';
import { missingPermissions } from '@/features/onboarding/permissions';
import { tr } from '@/i18n/tr';

const SAVED_BADGE_MS = 2500;

function CaptureTile({
  emoji,
  label,
  onPress,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="m-1 aspect-square w-[30%] items-center justify-center rounded-3xl bg-neutral-50 active:bg-neutral-200"
    >
      <Text className="text-4xl">{emoji}</Text>
      <Text className="mt-2 text-sm text-neutral-700">{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const statuses = usePermissionStatuses();
  const lastSavedAt = useCaptureFeedback((s) => s.lastSavedAt);
  const [now, setNow] = useState(() => Date.now());
  const [cameraError, setCameraError] = useState<string | null>(null);

  // A photo taken while Android killed the app is delivered on the next start.
  useEffect(() => {
    void recoverPendingCameraResult().catch(() => {});
  }, []);

  // Hide the "saved" badge after a moment.
  useEffect(() => {
    if (!lastSavedAt) return;
    const timer = setTimeout(() => setNow(Date.now()), SAVED_BADGE_MS);
    return () => clearTimeout(timer);
  }, [lastSavedAt]);

  if (!isOnboardingCompleted()) {
    return <Redirect href="/onboarding" />;
  }

  const missing = statuses ? missingPermissions(statuses).length : 0;
  const showSaved = lastSavedAt !== null && lastSavedAt > now - SAVED_BADGE_MS;

  async function camera(kind: 'photo' | 'video') {
    setCameraError(null);
    try {
      await captureWithCamera(kind);
    } catch (error) {
      setCameraError(
        error instanceof CameraPermissionError
          ? tr.capture.cameraPermission
          : tr.capture.cameraFailed,
      );
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="flex-grow justify-center px-4 py-8">
        <Text className="text-center text-3xl font-semibold text-neutral-900">{tr.home.title}</Text>
        <Text className="mt-2 text-center text-base text-neutral-500">{tr.home.subtitle}</Text>

        <View className="mt-10 flex-row flex-wrap justify-center">
          <CaptureTile
            emoji="📝"
            label={tr.capture.actions.note}
            onPress={() => router.push('/capture/note')}
          />
          <CaptureTile
            emoji="😊"
            label={tr.capture.actions.mood}
            onPress={() => router.push('/capture/mood')}
          />
          <CaptureTile
            emoji="🎙️"
            label={tr.capture.actions.audio}
            onPress={() => router.push({ pathname: '/capture/note', params: { record: '1' } })}
          />
          <CaptureTile
            emoji="📷"
            label={tr.capture.actions.photo}
            onPress={() => void camera('photo')}
          />
          <CaptureTile
            emoji="🎥"
            label={tr.capture.actions.video}
            onPress={() => void camera('video')}
          />
        </View>

        <View className="mt-6 h-6 items-center">
          {showSaved && <Text className="text-sm text-green-700">✓ {tr.capture.saved}</Text>}
          {cameraError && <Text className="text-sm text-red-600">{cameraError}</Text>}
        </View>

        <View className="mt-6 items-center">
          <Link href="/permissions" className="py-2">
            <Text className={`text-base ${missing > 0 ? 'text-red-600' : 'text-neutral-400'}`}>
              {missing > 0 ? tr.home.missingPermissions(missing) : tr.home.permissionsLink}
            </Text>
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}
