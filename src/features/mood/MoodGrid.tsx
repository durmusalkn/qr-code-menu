import { Pressable, Text, View } from 'react-native';

import { MOOD_VALUES, moodEmoji, type MoodValue } from './scale';

interface MoodGridProps {
  onSelect: (value: MoodValue) => void;
}

/** 1–10 emoji picker, two rows of five. */
export function MoodGrid({ onSelect }: MoodGridProps) {
  return (
    <View className="flex-row flex-wrap justify-center">
      {MOOD_VALUES.map((value) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityLabel={String(value)}
          onPress={() => onSelect(value)}
          className="m-1 w-[18%] items-center rounded-2xl bg-neutral-50 py-3 active:bg-neutral-200"
        >
          <Text className="text-4xl">{moodEmoji(value)}</Text>
          <Text className="mt-1 text-xs text-neutral-400">{value}</Text>
        </Pressable>
      ))}
    </View>
  );
}
