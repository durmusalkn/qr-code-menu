/**
 * Current weather from Open-Meteo (free, no API key). Weather codes are WMO codes as returned by
 * the API; they are stored raw and only translated for display.
 */
export interface Weather {
  weatherCode: number;
  temperatureC: number;
}

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

export function buildWeatherUrl(lat: number, lng: number): string {
  const params = [
    `latitude=${lat.toFixed(4)}`,
    `longitude=${lng.toFixed(4)}`,
    'current=temperature_2m,weather_code',
    'timezone=UTC',
  ];
  return `${ENDPOINT}?${params.join('&')}`;
}

export function parseWeatherResponse(json: unknown): Weather | null {
  if (!json || typeof json !== 'object') return null;
  const current = (json as { current?: unknown }).current;
  if (!current || typeof current !== 'object') return null;
  const { temperature_2m: temperature, weather_code: code } = current as Record<string, unknown>;
  if (typeof temperature !== 'number' || !Number.isFinite(temperature)) return null;
  if (typeof code !== 'number' || !Number.isInteger(code)) return null;
  return { weatherCode: code, temperatureC: temperature };
}

export async function fetchWeather(
  lat: number,
  lng: number,
  fetchFn: typeof fetch = fetch,
): Promise<Weather | null> {
  const response = await fetchFn(buildWeatherUrl(lat, lng));
  if (!response.ok) return null;
  return parseWeatherResponse(await response.json());
}
