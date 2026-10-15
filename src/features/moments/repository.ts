import { and, asc, eq, gte, lt } from 'drizzle-orm';

import { defaultDeps, type RepositoryDeps } from '@/db/deps';
import {
  media,
  moments,
  type Media,
  type MediaKind,
  type Moment,
  type MomentSource,
} from '@/db/schema';
import type { AppDatabase } from '@/db/types';
import { isMoodValue } from '@/features/mood/scale';
import { isSafeRelPath } from '@/lib/paths';

export interface MomentContext {
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  placeName?: string | null;
  weatherCode?: number | null;
  temperatureC?: number | null;
}

export interface CreateMomentInput extends MomentContext {
  source: MomentSource;
  note?: string | null;
  mood?: number | null;
  starred?: boolean;
  promptId?: string | null;
  /** Defaults to now. */
  createdAt?: number;
}

export type MomentPatch = Partial<Pick<Moment, 'note' | 'mood' | 'starred'>> & MomentContext;

export interface AddMediaInput {
  /** Defaults to a new id. Callers that name the file after the media id pass it here. */
  id?: string;
  kind: MediaKind;
  relPath: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
  thumbnailRelPath?: string | null;
  galleryAssetId?: string | null;
}

export interface MomentWithMedia {
  moment: Moment;
  media: Media[];
}

function assertMood(mood: number | null | undefined): void {
  if (mood != null && !isMoodValue(mood)) {
    throw new RangeError(`Mood must be an integer between 1 and 10, got ${mood}`);
  }
}

function assertRelPath(relPath: string | null | undefined): void {
  if (relPath != null && !isSafeRelPath(relPath)) {
    throw new Error(`Media paths must be relative, got ${relPath}`);
  }
}

function mediaValues(
  momentId: string,
  input: AddMediaInput,
  deps: RepositoryDeps,
): typeof media.$inferInsert {
  assertRelPath(input.relPath);
  assertRelPath(input.thumbnailRelPath);
  return {
    id: input.id ?? deps.newId(),
    momentId,
    kind: input.kind,
    relPath: input.relPath,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    durationMs: input.durationMs ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    thumbnailRelPath: input.thumbnailRelPath ?? null,
    galleryAssetId: input.galleryAssetId ?? null,
    createdAt: deps.now(),
  };
}

export function createMomentsRepository(db: AppDatabase, deps: RepositoryDeps = defaultDeps) {
  function getById(id: string): Moment | undefined {
    return db.select().from(moments).where(eq(moments.id, id)).get();
  }

  function insertMoment(target: Pick<AppDatabase, 'insert'>, input: CreateMomentInput): Moment {
    assertMood(input.mood);
    const createdAt = input.createdAt ?? deps.now();
    return target
      .insert(moments)
      .values({
        id: deps.newId(),
        createdAt,
        updatedAt: createdAt,
        source: input.source,
        note: input.note ?? null,
        mood: input.mood ?? null,
        starred: input.starred ?? false,
        promptId: input.promptId ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        accuracy: input.accuracy ?? null,
        placeName: input.placeName ?? null,
        weatherCode: input.weatherCode ?? null,
        temperatureC: input.temperatureC ?? null,
      })
      .returning()
      .get();
  }

  function listMedia(momentId: string): Media[] {
    return db
      .select()
      .from(media)
      .where(eq(media.momentId, momentId))
      .orderBy(asc(media.createdAt))
      .all();
  }

  return {
    create(input: CreateMomentInput): Moment {
      return insertMoment(db, input);
    },

    /** Creates a moment together with its media in one transaction: both or neither. */
    createWithMedia(
      input: CreateMomentInput,
      mediaInputs: readonly AddMediaInput[],
    ): MomentWithMedia {
      return db.transaction((tx) => {
        const moment = insertMoment(tx, input);
        const rows = mediaInputs.map((m) =>
          tx
            .insert(media)
            .values(mediaValues(moment.id, m, deps))
            .returning()
            .get(),
        );
        return { moment, media: rows };
      });
    },

    getById,

    getWithMedia(id: string): MomentWithMedia | undefined {
      const moment = getById(id);
      return moment && { moment, media: listMedia(id) };
    },

    /** Moments with `from <= created_at < to`, oldest first. */
    listBetween(from: number, to: number): Moment[] {
      return db
        .select()
        .from(moments)
        .where(and(gte(moments.createdAt, from), lt(moments.createdAt, to)))
        .orderBy(asc(moments.createdAt))
        .all();
    },

    update(id: string, patch: MomentPatch): Moment | undefined {
      assertMood(patch.mood);
      return db
        .update(moments)
        .set({ ...patch, updatedAt: deps.now() })
        .where(eq(moments.id, id))
        .returning()
        .get();
    },

    /**
     * Deletes the moment and its media rows. Returns the removed media so the caller can delete
     * the files (the database never owns file lifetimes).
     */
    delete(id: string): Media[] {
      return db.transaction((tx) => {
        const removed = tx.select().from(media).where(eq(media.momentId, id)).all();
        tx.delete(moments).where(eq(moments.id, id)).run();
        return removed;
      });
    },

    addMedia(momentId: string, input: AddMediaInput): Media {
      return db
        .insert(media)
        .values(mediaValues(momentId, input, deps))
        .returning()
        .get();
    },

    setGalleryAssetId(mediaId: string, galleryAssetId: string): void {
      db.update(media).set({ galleryAssetId }).where(eq(media.id, mediaId)).run();
    },

    listMedia,
  };
}

export type MomentsRepository = ReturnType<typeof createMomentsRepository>;
