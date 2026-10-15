/**
 * Creates moments from captures. Every capture is saved right away without a confirmation step;
 * location, place and weather are attached in the background afterwards.
 */
import * as ImagePicker from 'expo-image-picker';
import { getThumbnailAsync } from 'expo-video-thumbnails';

import { db } from '@/db/client';
import type { Media, MediaKind, Moment } from '@/db/schema';
import { createMomentsRepository, type MomentPatch } from '@/features/moments/repository';
import { createPromptsRepository } from '@/features/notifications/repository';
import { newId } from '@/lib/id';
import { deleteMediaFile, mediaFile, moveIntoMedia } from '@/lib/mediaStorage';
import { mediaRelPath, thumbnailRelPath } from '@/lib/paths';

import { enrichMomentContext } from './contextService';
import { useCaptureFeedback } from './feedback';
import { copyToGallery } from './gallery';
import { describeMediaFile } from './mediaTypes';
import { IN_APP, type CaptureOrigin } from './origin';

const moments = createMomentsRepository(db);
const prompts = createPromptsRepository(db);

export interface MomentFields {
  note?: string | null;
  mood?: number | null;
  starred?: boolean;
}

function afterCreate(moment: Moment, origin: CaptureOrigin): void {
  if (origin.promptId) prompts.markResponded(origin.promptId, moment.id);
  useCaptureFeedback.getState().markSaved();
  void enrichMomentContext(moment.id).catch(() => {});
}

/** Saves a moment without media (note, mood or both). */
export function saveMoment(origin: CaptureOrigin, fields: MomentFields): Moment {
  const moment = moments.create({ ...fields, source: origin.source, promptId: origin.promptId });
  afterCreate(moment, origin);
  return moment;
}

export function updateMoment(id: string, patch: MomentPatch): void {
  moments.update(id, patch);
}

interface IncomingFile {
  kind: MediaKind;
  uri: string;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
}

/** Moves the file into app storage and returns the media row input. */
async function storeFile(file: IncomingFile, timestamp: number) {
  const id = newId();
  const { mimeType, extension } = describeMediaFile(file.kind, file.uri, file.mimeType);
  const relPath = mediaRelPath(timestamp, id, extension);
  const sizeBytes = await moveIntoMedia(file.uri, relPath);

  let thumbRelPath: string | null = null;
  if (file.kind === 'video') {
    try {
      const thumbnail = await getThumbnailAsync(mediaFile(relPath).uri, { time: 0, quality: 0.7 });
      thumbRelPath = thumbnailRelPath(timestamp, id);
      await moveIntoMedia(thumbnail.uri, thumbRelPath);
    } catch {
      thumbRelPath = null;
    }
  }

  return {
    id,
    kind: file.kind,
    relPath,
    mimeType,
    sizeBytes,
    width: file.width ?? null,
    height: file.height ?? null,
    durationMs: file.durationMs ?? null,
    thumbnailRelPath: thumbRelPath,
  };
}

function rollBackFiles(input: { relPath: string; thumbnailRelPath: string | null }): void {
  deleteMediaFile(input.relPath);
  if (input.thumbnailRelPath) deleteMediaFile(input.thumbnailRelPath);
}

function copyToGalleryInBackground(media: Media): void {
  if (media.kind === 'audio') return;
  void copyToGallery(mediaFile(media.relPath).uri)
    .then((assetId) => assetId && moments.setGalleryAssetId(media.id, assetId))
    .catch(() => {});
}

async function saveCapturedFile(file: IncomingFile, origin: CaptureOrigin): Promise<Moment> {
  const createdAt = Date.now();
  const input = await storeFile(file, createdAt);
  let saved;
  try {
    saved = moments.createWithMedia(
      { source: origin.source, promptId: origin.promptId, createdAt },
      [input],
    );
  } catch (error) {
    rollBackFiles(input);
    throw error;
  }
  afterCreate(saved.moment, origin);
  copyToGalleryInBackground(saved.media[0]!);
  return saved.moment;
}

function pickerAssetToFile(asset: ImagePicker.ImagePickerAsset): IncomingFile {
  return {
    kind: asset.type === 'video' ? 'video' : 'photo',
    uri: asset.uri,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    durationMs: asset.duration ?? null,
  };
}

/**
 * Opens the phone's own camera app (Samsung Camera) for a photo or a video and saves the result
 * as a new moment. Returns null when the user cancels.
 */
export async function captureWithCamera(
  kind: 'photo' | 'video',
  origin: CaptureOrigin = IN_APP,
): Promise<Moment | null> {
  const permission = await ImagePicker.getCameraPermissionsAsync();
  if (!permission.granted) {
    const requested = await ImagePicker.requestCameraPermissionsAsync();
    if (!requested.granted) throw new CameraPermissionError();
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: kind === 'photo' ? 'images' : 'videos',
    // 1 keeps the camera's original file instead of re-encoding it.
    quality: 1,
    exif: false,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  return saveCapturedFile(pickerAssetToFile(result.assets[0]), origin);
}

/**
 * Android may kill the app while the camera app is open. The result is then delivered on the next
 * start; save it as an in-app moment so the photo is not lost.
 */
export async function recoverPendingCameraResult(): Promise<Moment | null> {
  const pending = await ImagePicker.getPendingResultAsync();
  if (!pending || !('assets' in pending) || pending.canceled || !pending.assets[0]) return null;
  return saveCapturedFile(pickerAssetToFile(pending.assets[0]), IN_APP);
}

/** Attaches a finished voice recording to an existing moment. */
export async function attachAudioRecording(
  momentId: string,
  uri: string,
  durationMs: number,
): Promise<Media> {
  const input = await storeFile({ kind: 'audio', uri, durationMs }, Date.now());
  try {
    const media = moments.addMedia(momentId, input);
    useCaptureFeedback.getState().markSaved();
    return media;
  } catch (error) {
    rollBackFiles(input);
    throw error;
  }
}

export class CameraPermissionError extends Error {
  constructor() {
    super('Camera permission not granted');
    this.name = 'CameraPermissionError';
  }
}
