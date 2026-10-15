/**
 * Mood scale: stored as an integer 1–10, shown to the user as an emoji.
 * This is the single source of truth for the mapping.
 */
export const MOOD_MIN = 1;
export const MOOD_MAX = 10;

export type MoodValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const MOOD_EMOJI: Readonly<Record<MoodValue, string>> = {
  1: '😭',
  2: '😢',
  3: '😞',
  4: '🙁',
  5: '😐',
  6: '🙂',
  7: '😊',
  8: '😄',
  9: '😁',
  10: '🤩',
};

export const MOOD_VALUES: readonly MoodValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Action buttons on the mood prompt notification. The emoji are the ones shown on the buttons;
 * the stored value is fixed by the product spec (😞 → 2, 😐 → 5, 😄 → 8).
 */
export const QUICK_MOOD_OPTIONS = [
  { id: 'low', emoji: '😞', value: 2 },
  { id: 'neutral', emoji: '😐', value: 5 },
  { id: 'high', emoji: '😄', value: 8 },
] as const satisfies readonly { id: string; emoji: string; value: MoodValue }[];

export type QuickMoodId = (typeof QUICK_MOOD_OPTIONS)[number]['id'];

export function isMoodValue(value: unknown): value is MoodValue {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= MOOD_MIN && value <= MOOD_MAX
  );
}

export function moodEmoji(value: MoodValue): string {
  return MOOD_EMOJI[value];
}

export function quickMoodValue(id: string): MoodValue | undefined {
  return QUICK_MOOD_OPTIONS.find((option) => option.id === id)?.value;
}
