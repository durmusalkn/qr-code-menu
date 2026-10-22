import { Directory, File, Paths } from 'expo-file-system';

/** Photos are copied here so they stay available even if they are removed from the gallery. */
export function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export function videosDir(): Directory {
  const dir = new Directory(Paths.document, 'videos');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export function photoFile(fileName: string): File {
  return new File(photosDir(), fileName);
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function extensionOf(uri: string): string {
  const match = /\.(jpe?g|png|heic|heif|webp)$/i.exec(uri.split('?')[0]);
  return match ? match[1].toLowerCase() : 'jpg';
}

/** Copies a picked or captured image into app storage and returns the new file name. */
export async function importPhotoFile(sourceUri: string): Promise<string> {
  const fileName = `${randomId()}.${extensionOf(sourceUri)}`;
  await new File(sourceUri).copy(photoFile(fileName));
  return fileName;
}

export function deletePhotoFile(fileName: string): void {
  const file = photoFile(fileName);
  if (file.exists) file.delete();
}

export function newVideoFile(): File {
  return new File(videosDir(), `gelisim-${randomId()}.mp4`);
}

/** Only the latest video is kept, to save space. */
export function deleteVideosExcept(keep: File): void {
  for (const entry of videosDir().list()) {
    if (entry instanceof File && entry.uri !== keep.uri) entry.delete();
  }
}

export function latestVideo(): File | null {
  const files = videosDir()
    .list()
    .filter((entry): entry is File => entry instanceof File && entry.name.endsWith('.mp4'));
  return files[0] ?? null;
}
