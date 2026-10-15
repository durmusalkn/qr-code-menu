import { Directory, File, Paths } from 'expo-file-system';

/** The app-private file for a relative media path (under the document directory). */
export function mediaFile(relPath: string): File {
  return new File(Paths.document, relPath);
}

/**
 * Moves a captured file (usually in the cache directory) to its permanent relative path and
 * returns its size in bytes.
 */
export async function moveIntoMedia(sourceUri: string, relPath: string): Promise<number> {
  const destination = mediaFile(relPath);
  const parent = relPath.slice(0, relPath.lastIndexOf('/'));
  new Directory(Paths.document, parent).create({ intermediates: true, idempotent: true });
  const source = new File(sourceUri);
  await source.move(destination);
  return destination.size;
}

/** Best-effort removal, used to roll back files when saving a moment fails. */
export function deleteMediaFile(relPath: string): void {
  try {
    const file = mediaFile(relPath);
    if (file.exists) file.delete();
  } catch {
    // Nothing else to do; an orphaned file is harmless.
  }
}
