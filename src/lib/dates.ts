/** A calendar day in local time, formatted as `YYYY-MM-DD`. Sorts chronologically as a string. */
export type DayKey = string;

const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const WEEKDAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(): DayKey {
  return toDayKey(new Date());
}

/** Parses a day key into a local `Date` at midnight. */
export function fromDayKey(day: DayKey): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDayKey(fromDayKey(value)) === value;
}

/** Whole days from `from` to `to` (negative if `to` is earlier). Safe across DST changes. */
export function daysBetween(from: DayKey, to: DayKey): number {
  const a = fromDayKey(from);
  const b = fromDayKey(to);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/** "5 Mart 2026" */
export function formatDay(day: DayKey): string {
  const d = fromDayKey(day);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Perşembe" */
export function formatWeekday(day: DayKey): string {
  return WEEKDAYS_TR[fromDayKey(day).getDay()];
}

/** "05.03.2026" */
export function formatDayShort(day: DayKey): string {
  const d = fromDayKey(day);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/**
 * Reads the capture day from a photo's EXIF data (`DateTimeOriginal` is written as
 * `YYYY:MM:DD HH:MM:SS`). Returns null when the photo has no usable date.
 */
export function dayFromExif(exif: Record<string, unknown> | null | undefined): DayKey | null {
  if (!exif) return null;
  for (const tag of ['DateTimeOriginal', 'DateTimeDigitized', 'DateTime']) {
    const value = exif[tag];
    if (typeof value !== 'string') continue;
    const match = /^(\d{4})[:-](\d{2})[:-](\d{2})/.exec(value.trim());
    if (!match) continue;
    const day = `${match[1]}-${match[2]}-${match[3]}`;
    if (isValidDayKey(day) && day !== '0000-00-00') return day;
  }
  return null;
}
