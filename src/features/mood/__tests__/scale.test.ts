import {
  MOOD_EMOJI,
  MOOD_VALUES,
  QUICK_MOOD_OPTIONS,
  isMoodValue,
  moodEmoji,
  quickMoodValue,
} from '@/features/mood/scale';

describe('mood scale', () => {
  it('maps 1–10 to the agreed emoji', () => {
    expect(MOOD_VALUES.map(moodEmoji).join(' ')).toBe('😭 😢 😞 🙁 😐 🙂 😊 😄 😁 🤩');
  });

  it('has an emoji for every value and no extra keys', () => {
    expect(Object.keys(MOOD_EMOJI).map(Number)).toEqual([...MOOD_VALUES]);
  });

  it.each([1, 5, 10])('accepts %p', (value) => {
    expect(isMoodValue(value)).toBe(true);
  });

  it.each([0, 11, 5.5, -1, NaN, '5', null, undefined])('rejects %p', (value) => {
    expect(isMoodValue(value)).toBe(false);
  });

  it('stores 2 / 5 / 8 for the notification buttons', () => {
    expect(QUICK_MOOD_OPTIONS.map((o) => [o.emoji, o.value])).toEqual([
      ['😞', 2],
      ['😐', 5],
      ['😄', 8],
    ]);
    expect(quickMoodValue('low')).toBe(2);
    expect(quickMoodValue('neutral')).toBe(5);
    expect(quickMoodValue('high')).toBe(8);
    expect(quickMoodValue('unknown')).toBeUndefined();
  });
});
