import { formatPlaceName } from '@/features/capture/placeName';

describe('formatPlaceName', () => {
  it('uses neighbourhood and district', () => {
    expect(
      formatPlaceName({
        district: 'Caferağa Mahallesi',
        subregion: 'Kadıköy',
        city: 'İstanbul',
        region: 'İstanbul',
        country: 'Türkiye',
      }),
    ).toBe('Caferağa, Kadıköy');
  });

  it('keeps names without a neighbourhood suffix', () => {
    expect(formatPlaceName({ district: 'Moda', subregion: 'Kadıköy' })).toBe('Moda, Kadıköy');
    expect(formatPlaceName({ district: 'Bebek Mah.', subregion: 'Beşiktaş' })).toBe(
      'Bebek, Beşiktaş',
    );
  });

  it('falls back to broader areas', () => {
    expect(formatPlaceName({ city: 'Ankara', region: 'Ankara' })).toBe('Ankara');
    expect(formatPlaceName({ district: 'Alsancak', region: 'İzmir' })).toBe('Alsancak, İzmir');
  });

  it('uses the place name when there is no area at all', () => {
    expect(formatPlaceName({ name: 'Ağrı Dağı', country: 'Türkiye' })).toBe('Ağrı Dağı');
  });

  it('returns null for empty addresses', () => {
    expect(formatPlaceName({})).toBeNull();
    expect(formatPlaceName({ district: '  ', city: '' })).toBeNull();
  });
});
