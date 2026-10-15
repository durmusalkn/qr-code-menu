import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tr } from '@/i18n/tr';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-semibold text-neutral-900">{tr.home.title}</Text>
        <Text className="mt-2 text-base text-neutral-500">{tr.home.subtitle}</Text>
        <Text className="mt-8 text-center text-sm text-neutral-400">{tr.home.setupNotice}</Text>
      </View>
    </SafeAreaView>
  );
}
