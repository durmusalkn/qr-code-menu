import { dayFromExif, daysBetween, formatDay, formatDayShort, formatWeekday, isValidDayKey, toDayKey } from '../dates';

describe('toDayKey', () => {
  it('uses local calendar fields with zero padding', () => {
    expect(toDayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDayKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });
});

describe('isValidDayKey', () => {
  it('accepts real days only', () => {
    expect(isValidDayKey('2024-02-29')).toBe(true);
    expect(isValidDayKey('2025-02-29')).toBe(false);
    expect(isValidDayKey('2025-13-01')).toBe(false);
    expect(isValidDayKey('2025-1-01')).toBe(false);
  });
});

describe('daysBetween', () => {
  it('counts calendar days, including across months and years', () => {
    expect(daysBetween('2026-03-01', '2026-03-01')).toBe(0);
    expect(daysBetween('2026-02-27', '2026-03-02')).toBe(3);
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
    expect(daysBetween('2026-03-10', '2026-03-01')).toBe(-9);
  });

  it('is not thrown off by daylight saving changes', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});

describe('formatting', () => {
  it('formats in Turkish', () => {
    expect(formatDay('2026-03-05')).toBe('5 Mart 2026');
    expect(formatDayShort('2026-03-05')).toBe('05.03.2026');
    expect(formatWeekday('2026-03-05')).toBe('Perşembe');
  });
});

describe('dayFromExif', () => {
  it('reads DateTimeOriginal first', () => {
    expect(dayFromExif({ DateTimeOriginal: '2025:11:02 07:15:00', DateTime: '2026:01:01 00:00:00' })).toBe(
      '2025-11-02'
    );
  });

  it('falls back to other date tags', () => {
    expect(dayFromExif({ DateTime: '2025:06:30 18:00:00' })).toBe('2025-06-30');
  });

  it('returns null when there is no usable date', () => {
    expect(dayFromExif(null)).toBeNull();
    expect(dayFromExif({})).toBeNull();
    expect(dayFromExif({ DateTimeOriginal: '0000:00:00 00:00:00' })).toBeNull();
    expect(dayFromExif({ DateTimeOriginal: 'garbage' })).toBeNull();
  });
});
