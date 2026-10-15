import { buildWeatherUrl, fetchWeather, parseWeatherResponse } from '@/features/capture/weather';

const SAMPLE = {
  latitude: 40.98,
  longitude: 29.03,
  current_units: { temperature_2m: '°C', weather_code: 'wmo code' },
  current: { time: '2026-10-15T09:00', interval: 900, temperature_2m: 18.4, weather_code: 3 },
};

describe('weather', () => {
  it('asks Open-Meteo for current temperature and weather code', () => {
    expect(buildWeatherUrl(40.98123456, 29.0321)).toBe(
      'https://api.open-meteo.com/v1/forecast?latitude=40.9812&longitude=29.0321&current=temperature_2m,weather_code&timezone=UTC',
    );
  });

  it('parses the current block', () => {
    expect(parseWeatherResponse(SAMPLE)).toEqual({ weatherCode: 3, temperatureC: 18.4 });
  });

  it.each([
    null,
    'x',
    {},
    { current: null },
    { current: { temperature_2m: '18', weather_code: 3 } },
    { current: { temperature_2m: 18, weather_code: 3.5 } },
    { current: { temperature_2m: NaN, weather_code: 3 } },
    { error: true, reason: 'Latitude must be in range' },
  ])('rejects %j', (json) => {
    expect(parseWeatherResponse(json)).toBeNull();
  });

  it('returns null on HTTP errors', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: false, json: async () => SAMPLE });
    await expect(fetchWeather(1, 2, fetchFn as unknown as typeof fetch)).resolves.toBeNull();
  });

  it('fetches and parses', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: true, json: async () => SAMPLE });
    await expect(fetchWeather(40.98, 29.03, fetchFn as unknown as typeof fetch)).resolves.toEqual({
      weatherCode: 3,
      temperatureC: 18.4,
    });
  });
});
