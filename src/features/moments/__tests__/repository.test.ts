import { media } from '@/db/schema';
import { createTestDatabase, type TestDatabase } from '@/db/testing/createTestDatabase';
import { createTestDeps, type TestDeps } from '@/db/testing/testDeps';
import { createMomentsRepository, type MomentsRepository } from '@/features/moments/repository';

const PHOTO = {
  kind: 'photo',
  relPath: 'media/2026/10/15/p.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 1000,
} as const;

describe('moments repository', () => {
  let t: TestDatabase;
  let deps: TestDeps;
  let repo: MomentsRepository;

  beforeEach(async () => {
    t = await createTestDatabase();
    deps = createTestDeps();
    repo = createMomentsRepository(t.db, deps);
  });

  afterEach(() => t.raw.close());

  it('creates a moment with defaults', () => {
    const moment = repo.create({ source: 'in_app', note: 'Moda' });

    expect(moment).toEqual({
      id: 'id-1',
      createdAt: deps.now(),
      updatedAt: deps.now(),
      note: 'Moda',
      mood: null,
      starred: false,
      source: 'in_app',
      promptId: null,
      lat: null,
      lng: null,
      accuracy: null,
      placeName: null,
      weatherCode: null,
      temperatureC: null,
    });
    expect(repo.getById('id-1')).toEqual(moment);
  });

  it('saves a moment even when context is missing', () => {
    const moment = repo.create({ source: 'prompt', mood: 7, lat: 40.98, lng: 29.03 });

    expect(moment).toMatchObject({ mood: 7, lat: 40.98, lng: 29.03, placeName: null });
  });

  it('rejects moods outside 1–10 before touching the database', () => {
    expect(() => repo.create({ source: 'in_app', mood: 0 })).toThrow(RangeError);
    expect(() => repo.create({ source: 'in_app', mood: 11 })).toThrow(RangeError);
    expect(() => repo.create({ source: 'in_app', mood: 4.5 })).toThrow(RangeError);
    expect(repo.listBetween(0, Number.MAX_SAFE_INTEGER)).toEqual([]);
  });

  it('enforces the mood range in the database too', () => {
    expect(() =>
      t.raw.exec(
        "INSERT INTO moments (id, created_at, updated_at, source, mood) VALUES ('x', 1, 1, 'in_app', 11)",
      ),
    ).toThrow(/CHECK constraint failed/);
  });

  it('updates fields and bumps updated_at', () => {
    const { id, createdAt } = repo.create({ source: 'in_app' });
    deps.advance(60_000);

    const updated = repo.update(id, { note: 'Kahve', mood: 6, starred: true });

    expect(updated).toMatchObject({ note: 'Kahve', mood: 6, starred: true, createdAt });
    expect(updated?.updatedAt).toBe(createdAt + 60_000);
    expect(repo.update('missing', { note: 'x' })).toBeUndefined();
  });

  it('can clear a mood', () => {
    const { id } = repo.create({ source: 'in_app', mood: 5 });

    expect(repo.update(id, { mood: null })?.mood).toBeNull();
  });

  it('lists moments in a half-open time range, oldest first', () => {
    const base = deps.now();
    repo.create({ source: 'in_app', createdAt: base + 2 });
    repo.create({ source: 'in_app', createdAt: base });
    repo.create({ source: 'in_app', createdAt: base + 10 });

    expect(repo.listBetween(base, base + 10).map((m) => m.createdAt)).toEqual([base, base + 2]);
  });

  it('attaches multiple media to a moment', () => {
    const { id } = repo.create({ source: 'quick_capture' });
    repo.addMedia(id, PHOTO);
    deps.advance(1);
    repo.addMedia(id, {
      kind: 'audio',
      relPath: 'media/2026/10/15/a.m4a',
      mimeType: 'audio/mp4',
      sizeBytes: 500,
      durationMs: 12_000,
    });

    const result = repo.getWithMedia(id);

    expect(result?.media.map((m) => m.kind)).toEqual(['photo', 'audio']);
    expect(result?.media[1]).toMatchObject({ momentId: id, durationMs: 12_000, width: null });
  });

  it('refuses absolute media paths', () => {
    const { id } = repo.create({ source: 'in_app' });

    expect(() => repo.addMedia(id, { ...PHOTO, relPath: '/storage/emulated/0/x.jpg' })).toThrow();
    expect(() => repo.addMedia(id, { ...PHOTO, thumbnailRelPath: '../x.jpg' })).toThrow();
  });

  it('refuses media for an unknown moment', () => {
    expect(() => repo.addMedia('missing', PHOTO)).toThrow(/FOREIGN KEY/);
  });

  it('deletes a moment with its media and returns the media for file cleanup', () => {
    const { id } = repo.create({ source: 'in_app' });
    repo.addMedia(id, PHOTO);
    const other = repo.create({ source: 'in_app' });
    repo.addMedia(other.id, { ...PHOTO, relPath: 'media/2026/10/15/q.jpg' });

    const removed = repo.delete(id);

    expect(removed.map((m) => m.relPath)).toEqual([PHOTO.relPath]);
    expect(repo.getById(id)).toBeUndefined();
    expect(
      t.db
        .select()
        .from(media)
        .all()
        .map((m) => m.momentId),
    ).toEqual([other.id]);
  });

  it('creates a moment with its media atomically', () => {
    const { moment, media: rows } = repo.createWithMedia({ source: 'in_app' }, [
      { ...PHOTO, id: 'file-uuid' },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'file-uuid', momentId: moment.id });
    expect(repo.getWithMedia(moment.id)?.media).toHaveLength(1);
  });

  it('leaves nothing behind when a media row is invalid', () => {
    repo.create({ source: 'in_app' });
    const existing = repo.addMedia('id-1', PHOTO);

    // Same rel_path violates the unique index.
    expect(() => repo.createWithMedia({ source: 'in_app' }, [{ ...PHOTO }])).toThrow(/UNIQUE/);

    expect(repo.listBetween(0, Number.MAX_SAFE_INTEGER)).toHaveLength(1);
    expect(t.db.select().from(media).all()).toEqual([existing]);
  });

  it('records the gallery copy of a media file', () => {
    const { media: rows } = repo.createWithMedia({ source: 'in_app' }, [PHOTO]);

    repo.setGalleryAssetId(rows[0]!.id, '1234');

    expect(repo.listMedia(rows[0]!.momentId)[0]?.galleryAssetId).toBe('1234');
  });

  it('returns no media when deleting an unknown moment', () => {
    expect(repo.delete('missing')).toEqual([]);
  });
});
