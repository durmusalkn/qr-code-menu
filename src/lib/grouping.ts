import type { Photo } from '../db/photos';
import { daysBetween, DayKey } from './dates';

export type DayGroup = { day: DayKey; dayNumber: number; photos: Photo[] };

/** Groups photos per day, newest day first. Day 1 is the day of the earliest photo. */
export function groupByDay(photos: Photo[]): DayGroup[] {
  const byDay = new Map<DayKey, Photo[]>();
  for (const photo of photos) {
    const list = byDay.get(photo.day);
    if (list) list.push(photo);
    else byDay.set(photo.day, [photo]);
  }
  const days = [...byDay.keys()].sort();
  if (days.length === 0) return [];
  const firstDay = days[0];
  return days.reverse().map((day) => ({
    day,
    dayNumber: daysBetween(firstDay, day) + 1,
    photos: byDay.get(day)!.sort((a, b) => a.id - b.id),
  }));
}
