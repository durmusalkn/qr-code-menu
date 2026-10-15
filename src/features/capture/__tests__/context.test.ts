import { collectContext, type ContextSources } from '@/features/capture/context';

const POSITION = { lat: 40.98, lng: 29.03, accuracy: 15 };

function sources(overrides: Partial<ContextSources> = {}): ContextSources {
  return {
    getPosition: async () => POSITION,
    getPlaceName: async () => 'Moda, Kadıköy',
    getWeather: async () => ({ weatherCode: 1, temperatureC: 21.5 }),
    ...overrides,
  };
}

const fast = { positionMs: 50, placeNameMs: 50, weatherMs: 50 };

describe('collectContext', () => {
  it('combines position, place and weather', async () => {
    await expect(collectContext(sources(), fast)).resolves.toEqual({
      lat: 40.98,
      lng: 29.03,
      accuracy: 15,
      placeName: 'Moda, Kadıköy',
      weatherCode: 1,
      temperatureC: 21.5,
    });
  });

  it('returns nothing without a position', async () => {
    const getWeather = jest.fn();
    await expect(
      collectContext(sources({ getPosition: async () => null, getWeather }), fast),
    ).resolves.toEqual({});
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('keeps the position when place and weather fail', async () => {
    await expect(
      collectContext(
        sources({
          getPlaceName: async () => {
            throw new Error('offline');
          },
          getWeather: () => new Promise(() => {}),
        }),
        fast,
      ),
    ).resolves.toEqual({ lat: 40.98, lng: 29.03, accuracy: 15 });
  });

  it('gives up on a position that never arrives', async () => {
    await expect(
      collectContext(sources({ getPosition: () => new Promise(() => {}) }), fast),
    ).resolves.toEqual({});
  });
});
