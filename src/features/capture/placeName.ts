/** Subset of expo-location's `LocationGeocodedAddress` used for place names. */
export interface GeocodedAddress {
  name?: string | null;
  street?: string | null;
  district?: string | null;
  subregion?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
}

const NEIGHBOURHOOD_SUFFIX = /\s+(Mahallesi|Mah\.?)$/i;

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * A short, human place name: neighbourhood and district ("Caferağa, Kadıköy"), falling back to
 * broader areas. "… Mahallesi" is shortened so it reads naturally in Turkish sentences.
 */
export function formatPlaceName(address: GeocodedAddress): string | null {
  const local = clean(address.district)?.replace(NEIGHBOURHOOD_SUFFIX, '') ?? null;
  const area = clean(address.subregion) ?? clean(address.city) ?? clean(address.region);
  const parts = [local, area].filter((part): part is string => part !== null);
  const unique = parts.filter((part, i) => parts.indexOf(part) === i);
  if (unique.length > 0) return unique.join(', ');
  return clean(address.name) ?? clean(address.street) ?? clean(address.country);
}
