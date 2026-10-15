import type { MediaKind } from '@/db/schema';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/3gpp': '3gp',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/aac': 'aac',
};

const DEFAULT_MIME: Record<MediaKind, string> = {
  photo: 'image/jpeg',
  video: 'video/mp4',
  audio: 'audio/mp4',
};

function extensionFromUri(uri: string): string | null {
  const match = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(uri);
  return match ? match[1]!.toLowerCase() : null;
}

/** Mime type and file extension for a captured file, preferring the reported mime type. */
export function describeMediaFile(
  kind: MediaKind,
  uri: string,
  reportedMimeType?: string | null,
): { mimeType: string; extension: string } {
  const mimeType = reportedMimeType?.toLowerCase() || DEFAULT_MIME[kind];
  const extension =
    EXTENSIONS[mimeType] ?? extensionFromUri(uri) ?? EXTENSIONS[DEFAULT_MIME[kind]]!;
  return { mimeType, extension };
}
