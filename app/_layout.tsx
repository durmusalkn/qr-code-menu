import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import { useDatabase } from '@/db/migrate';
import { tr } from '@/i18n/tr';

export default function RootLayout() {
  const database = useDatabase();

  if (database.state === 'migrating') {
    return null;
  }

  if (database.state === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold text-neutral-900">{tr.database.errorTitle}</Text>
        <Text className="mt-2 text-center text-sm text-neutral-500">{database.error.message}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="permissions"
          options={{ headerShown: true, title: tr.permissions.title }}
        />
        <Stack.Screen
          name="capture/note"
          options={{ headerShown: true, title: tr.capture.note.title }}
        />
        <Stack.Screen
          name="capture/mood"
          options={{ headerShown: true, title: tr.capture.mood.title }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
