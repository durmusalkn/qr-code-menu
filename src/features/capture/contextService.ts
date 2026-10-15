import * as Location from 'expo-location';

import { db } from '@/db/client';
import { createMomentsRepository } from '@/features/moments/repository';

import { collectContext, type ContextSources } from './context';
import { formatPlaceName } from './placeName';
import { fetchWeather } from './weather';

const moments = createMomentsRepository(db);

/** A recent fix is good enough; otherwise ask for a fresh one. */
const LAST_KNOWN_MAX_AGE_MS = 2 * 60_000;
const LAST_KNOWN_REQUIRED_ACCURACY_M = 100;

const nativeSources: ContextSources = {
  async getPosition() {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const position =
      (await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
        requiredAccuracy: LAST_KNOWN_REQUIRED_ACCURACY_M,
      })) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }));
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  },

  async getPlaceName(lat, lng) {
    const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    return address ? formatPlaceName(address) : null;
  },

  getWeather: (lat, lng) => fetchWeather(lat, lng),
};

/**
 * Attaches location, place name and weather to a saved moment. Runs after the moment is saved,
 * so capturing never waits for GPS or the network; missing parts simply stay empty.
 */
export async function enrichMomentContext(momentId: string): Promise<void> {
  const context = await collectContext(nativeSources);
  if (Object.keys(context).length > 0) {
    moments.update(momentId, context);
  }
}
