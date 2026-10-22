import type { Photo } from '../../db/photos';
import { groupByDay } from '../grouping';
import { buildFrames, estimateDuration, formatDuration, sortChronologically } from '../video';

const photo = (id: number, day: string): Photo => ({
  id,
  day,
  fileName: `${id}.jpg`,
  width: null,
  height: null,
  createdAt: 0,
});

// Added out of order: a past photo (id 4) was added after newer ones.
const photos = [photo(1, '2026-03-02'), photo(2, '2026-03-05'), photo(3, '2026-03-02'), photo(4, '2026-02-28')];

describe('sortChronologically', () => {
  it('orders by day, then by the order photos were added', () => {
    expect(sortChronologically(photos).map((p) => p.id)).toEqual([4, 1, 3, 2]);
  });
});

describe('buildFrames', () => {
  it('goes from the first day to the last with day numbers', () => {
    const frames = buildFrames(photos, true, (p) => `file:///photos/${p.fileName}`);
    expect(frames).toEqual([
      { uri: 'file:///photos/4.jpg', label: 'Gün 1 · 28.02.2026' },
      { uri: 'file:///photos/1.jpg', label: 'Gün 3 · 02.03.2026' },
      { uri: 'file:///photos/3.jpg', label: 'Gün 3 · 02.03.2026' },
      { uri: 'file:///photos/2.jpg', label: 'Gün 6 · 05.03.2026' },
    ]);
  });

  it('omits labels when disabled', () => {
    expect(buildFrames(photos, false, (p) => p.fileName).every((f) => f.label === null)).toBe(true);
  });

  it('handles no photos', () => {
    expect(buildFrames([], true, (p) => p.fileName)).toEqual([]);
  });
});

describe('estimateDuration', () => {
  it('rounds each photo to whole frames at 30 fps', () => {
    expect(estimateDuration(10, 0.4)).toBeCloseTo(4);
    expect(estimateDuration(3, 0.01)).toBeCloseTo(0.1);
  });

  it('formats durations', () => {
    expect(formatDuration(42.4)).toBe('42 sn');
    expect(formatDuration(125)).toBe('2 dk 5 sn');
  });
});

describe('groupByDay', () => {
  it('groups newest day first with day numbers from the first photo', () => {
    const groups = groupByDay(photos);
    expect(groups.map((g) => [g.day, g.dayNumber, g.photos.map((p) => p.id)])).toEqual([
      ['2026-03-05', 6, [2]],
      ['2026-03-02', 3, [1, 3]],
      ['2026-02-28', 1, [4]],
    ]);
  });
});
