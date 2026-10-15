import { formatDuration } from '@/lib/format';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [999, '0:00'],
    [5_000, '0:05'],
    [75_000, '1:15'],
    [3_600_000, '60:00'],
    [-10, '0:00'],
  ])('%p → %p', (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});
