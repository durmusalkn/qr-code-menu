/**
 * Media files live under the app's document directory. Only these relative paths are stored in
 * the database, so an archive can be moved to another device (or OS) unchanged.
 */
export const MEDIA_ROOT = 'media';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `media/YYYY/MM/DD` for the device-local calendar day of `timestamp` (epoch ms). */
export function mediaDayDir(timestamp: number): string {
  const date = new Date(timestamp);
  return `${MEDIA_ROOT}/${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

function normalizeExtension(extension: string): string {
  const ext = extension.replace(/^\./, '').toLowerCase();
  if (!/^[a-z0-9]+$/.test(ext)) {
    throw new Error(`Invalid file extension: ${extension}`);
  }
  return ext;
}

/** `media/YYYY/MM/DD/<id>.<ext>` */
export function mediaRelPath(timestamp: number, id: string, extension: string): string {
  return `${mediaDayDir(timestamp)}/${id}.${normalizeExtension(extension)}`;
}

/** `media/YYYY/MM/DD/<id>.thumb.jpg` */
export function thumbnailRelPath(timestamp: number, id: string): string {
  return `${mediaDayDir(timestamp)}/${id}.thumb.jpg`;
}

/** Guards against absolute paths and `..` segments before a relative path is joined to a root. */
export function isSafeRelPath(relPath: string): boolean {
  if (relPath.length === 0 || relPath.startsWith('/') || relPath.includes('\\')) return false;
  return relPath.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}
