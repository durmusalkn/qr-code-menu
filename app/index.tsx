import { Link, Redirect } from 'expo-router';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { isOnboardingCompleted } from '@/features/onboarding/onboardingState';
import { usePermissionStatuses } from '@/features/onboarding/permissionStore';
import { missingPermissions } from '@/features/onboarding/permissions';
import { tr } from '@/i18n/tr';

export default function HomeScreen() {
  const statuses = usePermissionStatuses();

  if (!isOnboardingCompleted()) {
    return <Redirect href="/onboarding" />;
  }

  const missing = statuses ? missingPermissions(statuses).length : 0;

  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-semibold text-neutral-900">{tr.home.title}</Text>
        <Text className="mt-2 text-base text-neutral-500">{tr.home.subtitle}</Text>
        <Text className="mt-8 text-center text-sm text-neutral-400">{tr.home.setupNotice}</Text>
        <Link href="/permissions" className="mt-8 py-2">
          <Text className={`text-base ${missing > 0 ? 'text-red-600' : 'text-neutral-500'}`}>
            {missing > 0 ? tr.home.missingPermissions(missing) : tr.home.permissionsLink}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
