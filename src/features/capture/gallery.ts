import { Album, Asset } from 'expo-media-library';

import { db } from '@/db/client';
import { createSettingsRepository } from '@/features/settings/repository';

export const GALLERY_ALBUM_NAME = 'Anılarım';

const settings = createSettingsRepository(db);

/**
 * Writes a copy of a photo/video to the gallery album "Anılarım" (Pictures/Anılarım). The app's
 * own copy stays the master. Needs no permission on Android 11+: the app only touches entries it
 * created itself, so no gallery read permission is involved.
 *
 * Returns the gallery asset id when known. The very first copy creates the album and its id is
 * not reported by the API, so that one returns null.
 */
export async function copyToGallery(fileUri: string): Promise<string | null> {
  const albumId = settings.get('galleryAlbumId');
  if (albumId) {
    try {
      const asset = await Asset.create(fileUri, new Album(albumId));
      return asset.id;
    } catch {
      // The album no longer exists (deleted, or created by a previous install): recreate it.
    }
  }
  const album = await Album.create(GALLERY_ALBUM_NAME, [fileUri]);
  settings.set('galleryAlbumId', album.id);
  return null;
}
