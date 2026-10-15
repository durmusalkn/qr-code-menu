import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { tr } from '@/i18n/tr';

import { completeOnboarding } from './onboardingState';
import { usePermissionStatuses, usePermissionStore } from './permissionStore';
import { ONBOARDING_STEPS, isGranted, nextStepIndex } from './permissions';

export function OnboardingScreen() {
  const statuses = usePermissionStatuses();
  const resolve = usePermissionStore((s) => s.resolve);
  // Index of the last step the user skipped. The current step is derived from it, so a step that
  // gets done (also after returning from system settings) advances the flow on its own.
  const [skippedThrough, setSkippedThrough] = useState(-1);
  const [busy, setBusy] = useState(false);

  if (!statuses) return <Screen>{null}</Screen>;

  const index = nextStepIndex(ONBOARDING_STEPS, statuses, skippedThrough);

  if (index === -1) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6">
          <Text className="text-3xl font-semibold text-neutral-900">{tr.onboarding.doneTitle}</Text>
          <Text className="mt-4 text-base leading-6 text-neutral-600">
            {tr.onboarding.doneBody}
          </Text>
        </View>
        <View className="px-6 pb-6">
          <Button
            label={tr.onboarding.finish}
            onPress={() => {
              completeOnboarding();
              router.replace('/');
            }}
          />
        </View>
      </Screen>
    );
  }

  const step = ONBOARDING_STEPS[index]!;
  const text = tr.onboarding.steps[step.id];

  async function grant() {
    setBusy(true);
    try {
      // Ask one by one (camera, then microphone) so each system dialog is shown.
      for (const key of step.permissions) {
        const latest = usePermissionStore.getState().statuses;
        if (!latest || !isGranted(latest[key])) await resolve(key);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-8">
        <Text className="text-sm text-neutral-400">
          {tr.onboarding.progress(index + 1, ONBOARDING_STEPS.length)}
        </Text>
        <Text className="mt-2 text-3xl font-semibold text-neutral-900">{text.title}</Text>
        <Text className="mt-4 text-base leading-6 text-neutral-600">{text.body}</Text>
      </ScrollView>
      <View className="gap-2 px-6 pb-6">
        <Button label={text.action} onPress={grant} disabled={busy} />
        <Button
          label={tr.common.skip}
          variant="secondary"
          disabled={busy}
          onPress={() => setSkippedThrough(index)}
        />
      </View>
    </Screen>
  );
}
