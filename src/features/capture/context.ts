import type { MomentContext } from '@/features/moments/repository';
import { withTimeout } from '@/lib/async';

import type { Weather } from './weather';

export interface Position {
  lat: number;
  lng: number;
  accuracy: number | null;
}

/** Native/network lookups, injected so the orchestration can be tested. */
export interface ContextSources {
  getPosition(): Promise<Position | null>;
  getPlaceName(lat: number, lng: number): Promise<string | null>;
  getWeather(lat: number, lng: number): Promise<Weather | null>;
}

export const CONTEXT_TIMEOUTS = {
  positionMs: 20_000,
  placeNameMs: 10_000,
  weatherMs: 10_000,
};

/**
 * Collects location, place name and weather for a moment. Every part is optional: whatever
 * fails or times out is simply left out.
 */
export async function collectContext(
  sources: ContextSources,
  timeouts = CONTEXT_TIMEOUTS,
): Promise<MomentContext> {
  const position = await withTimeout(sources.getPosition(), timeouts.positionMs);
  if (!position) return {};

  const [placeName, weather] = await Promise.all([
    withTimeout(sources.getPlaceName(position.lat, position.lng), timeouts.placeNameMs),
    withTimeout(sources.getWeather(position.lat, position.lng), timeouts.weatherMs),
  ]);

  return {
    lat: position.lat,
    lng: position.lng,
    accuracy: position.accuracy,
    ...(placeName ? { placeName } : {}),
    ...(weather ?? {}),
  };
}
