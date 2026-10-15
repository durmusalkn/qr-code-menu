/**
 * Database schema.
 *
 * Conventions (see CLAUDE.md):
 * - Primary keys are UUID text, so archives from different devices merge without collisions.
 * - Times are UTC epoch milliseconds stored as integers.
 * - Media paths are relative to the app's document directory.
 *
 * After changing this file run `npm run db:generate` to create a migration.
 */
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const MOMENT_SOURCES = ['quick_capture', 'prompt', 'in_app'] as const;
export const MEDIA_KINDS = ['photo', 'video', 'audio'] as const;
export const PROMPT_KINDS = ['mood', 'activity', 'photo'] as const;
export const BACKUP_STATUSES = ['running', 'success', 'error'] as const;

export type MomentSource = (typeof MOMENT_SOURCES)[number];
export type MediaKind = (typeof MEDIA_KINDS)[number];
export type PromptKind = (typeof PROMPT_KINDS)[number];
export type BackupStatus = (typeof BACKUP_STATUSES)[number];

function inList(column: string, values: readonly string[]) {
  return sql.raw(`${column} IN (${values.map((v) => `'${v}'`).join(', ')})`);
}

export const moments = sqliteTable(
  'moments',
  {
    id: text('id').primaryKey(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    note: text('note'),
    mood: integer('mood'),
    starred: integer('starred', { mode: 'boolean' }).notNull().default(false),
    source: text('source', { enum: MOMENT_SOURCES }).notNull(),
    // No FK: prompts and moments reference each other, and import must be able to insert either
    // table first.
    promptId: text('prompt_id'),
    lat: real('lat'),
    lng: real('lng'),
    accuracy: real('accuracy'),
    placeName: text('place_name'),
    weatherCode: integer('weather_code'),
    temperatureC: real('temperature_c'),
  },
  (t) => [
    index('moments_created_at_idx').on(t.createdAt),
    check('moments_mood_range', sql.raw('mood IS NULL OR mood BETWEEN 1 AND 10')),
    check('moments_source_valid', inList('source', MOMENT_SOURCES)),
  ],
);

export const media = sqliteTable(
  'media',
  {
    id: text('id').primaryKey(),
    momentId: text('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: MEDIA_KINDS }).notNull(),
    relPath: text('rel_path').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    durationMs: integer('duration_ms'),
    width: integer('width'),
    height: integer('height'),
    thumbnailRelPath: text('thumbnail_rel_path'),
    galleryAssetId: text('gallery_asset_id'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    index('media_moment_id_idx').on(t.momentId),
    index('media_created_at_idx').on(t.createdAt),
    uniqueIndex('media_rel_path_unique').on(t.relPath),
    check('media_kind_valid', inList('kind', MEDIA_KINDS)),
  ],
);

export const locationPoints = sqliteTable(
  'location_points',
  {
    id: text('id').primaryKey(),
    recordedAt: integer('recorded_at').notNull(),
    lat: real('lat').notNull(),
    lng: real('lng').notNull(),
    accuracy: real('accuracy'),
    altitude: real('altitude'),
    speed: real('speed'),
  },
  (t) => [index('location_points_recorded_at_idx').on(t.recordedAt)],
);

export const visits = sqliteTable(
  'visits',
  {
    id: text('id').primaryKey(),
    lat: real('lat').notNull(),
    lng: real('lng').notNull(),
    placeName: text('place_name'),
    arrivedAt: integer('arrived_at').notNull(),
    // Null while the visit is still ongoing.
    departedAt: integer('departed_at'),
  },
  (t) => [index('visits_arrived_at_idx').on(t.arrivedAt)],
);

export const prompts = sqliteTable(
  'prompts',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: PROMPT_KINDS }).notNull(),
    scheduledFor: integer('scheduled_for').notNull(),
    // Identifier returned by the OS scheduler, needed to cancel a prompt when re-planning.
    notificationId: text('notification_id'),
    deliveredAt: integer('delivered_at'),
    respondedAt: integer('responded_at'),
    responseMomentId: text('response_moment_id'),
  },
  (t) => [
    index('prompts_scheduled_for_idx').on(t.scheduledFor),
    check('prompts_kind_valid', inList('kind', PROMPT_KINDS)),
  ],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  // JSON-encoded value.
  value: text('value').notNull(),
});

export const backupLog = sqliteTable(
  'backup_log',
  {
    id: text('id').primaryKey(),
    startedAt: integer('started_at').notNull(),
    finishedAt: integer('finished_at'),
    status: text('status', { enum: BACKUP_STATUSES }).notNull(),
    filesCopied: integer('files_copied').notNull().default(0),
    bytesCopied: integer('bytes_copied').notNull().default(0),
    error: text('error'),
  },
  (t) => [
    index('backup_log_started_at_idx').on(t.startedAt),
    check('backup_log_status_valid', inList('status', BACKUP_STATUSES)),
  ],
);

export type Moment = typeof moments.$inferSelect;
export type NewMoment = typeof moments.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type LocationPoint = typeof locationPoints.$inferSelect;
export type NewLocationPoint = typeof locationPoints.$inferInsert;
export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;
export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
export type BackupLogEntry = typeof backupLog.$inferSelect;
