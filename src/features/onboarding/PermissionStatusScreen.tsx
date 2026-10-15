import { Pressable, ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { tr } from '@/i18n/tr';

import { usePermissionStatuses, usePermissionStore } from './permissionStore';
import {
  PERMISSION_KEYS,
  missingPermissions,
  permissionAction,
  type PermissionState,
} from './permissions';

const DOT: Record<PermissionState, string> = {
  granted: 'bg-green-500',
  undetermined: 'bg-red-500',
  denied: 'bg-red-500',
  blocked: 'bg-red-500',
  unknown: 'bg-amber-400',
};

const LABEL: Record<PermissionState, string> = {
  granted: 'text-green-700',
  undetermined: 'text-red-600',
  denied: 'text-red-600',
  blocked: 'text-red-600',
  unknown: 'text-amber-600',
};

export function PermissionStatusScreen() {
  const statuses = usePermissionStatuses();
  const resolve = usePermissionStore((s) => s.resolve);

  if (!statuses) return <Screen edges={['bottom']}>{null}</Screen>;

  const allGranted = missingPermissions(statuses).length === 0;

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerClassName="px-4 py-4">
        <Text className="mb-4 px-2 text-sm text-neutral-500">
          {allGranted ? tr.permissions.allGranted : tr.permissions.subtitle}
        </Text>
        {PERMISSION_KEYS.map((key) => {
          const state = statuses[key];
          const action = permissionAction(key, state);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              onPress={() => void resolve(key)}
              className="mb-2 flex-row items-center rounded-2xl bg-neutral-50 px-4 py-4 active:opacity-70"
            >
              <View className={`mr-3 h-3 w-3 rounded-full ${DOT[state]}`} />
              <View className="flex-1">
                <Text className="text-base text-neutral-900">{tr.permissions.names[key]}</Text>
                {state !== 'granted' && (
                  <Text className="mt-1 text-xs text-neutral-400">
                    {tr.permissions.hints[action]}
                  </Text>
                )}
              </View>
              <Text className={`text-sm ${LABEL[state]}`}>{tr.permissions.states[state]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
