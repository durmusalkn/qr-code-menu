import { daysBetween, formatDayShort } from './dates';
import type { Photo } from '../db/photos';

export type Resolution = '720p' | '1080p';

export type VideoSettings = {
  secondsPerPhoto: number;
  resolution: Resolution;
  showDateLabel: boolean;
};

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  secondsPerPhoto: 0.4,
  resolution: '1080p',
  showDateLabel: true,
};

export const SPEED_OPTIONS = [0.2, 0.4, 0.7, 1] as const;

export const VIDEO_FPS = 30;

const RESOLUTIONS: Record<Resolution, { width: number; height: number; bitRate: number }> = {
  '720p': { width: 720, height: 1280, bitRate: 5_000_000 },
  '1080p': { width: 1080, height: 1920, bitRate: 10_000_000 },
};

export function resolutionSize(resolution: Resolution) {
  return RESOLUTIONS[resolution];
}

/** Photos from the first day to the last; photos of the same day keep the order they were added in. */
export function sortChronologically(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => (a.day === b.day ? a.id - b.id : a.day < b.day ? -1 : 1));
}

/** "Gün 12 · 05.03.2026", counting the first photo's day as day 1. */
export function frameLabel(day: string, firstDay: string): string {
  return `Gün ${daysBetween(firstDay, day) + 1} · ${formatDayShort(day)}`;
}

export function buildFrames(
  photos: Photo[],
  showDateLabel: boolean,
  uriOf: (photo: Photo) => string
): { uri: string; label: string | null }[] {
  const ordered = sortChronologically(photos);
  if (ordered.length === 0) return [];
  const firstDay = ordered[0].day;
  return ordered.map((photo) => ({
    uri: uriOf(photo),
    label: showDateLabel ? frameLabel(photo.day, firstDay) : null,
  }));
}

/** Video length in seconds, matching how the encoder rounds each photo to whole frames. */
export function estimateDuration(photoCount: number, secondsPerPhoto: number): number {
  const framesPerPhoto = Math.max(1, Math.round(secondsPerPhoto * VIDEO_FPS));
  return (photoCount * framesPerPhoto) / VIDEO_FPS;
}

export function formatDuration(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return minutes > 0 ? `${minutes} dk ${seconds} sn` : `${seconds} sn`;
}
