import { and, asc, desc, eq, gte, isNull, lt } from 'drizzle-orm';

import { defaultDeps, type RepositoryDeps } from '@/db/deps';
import { locationPoints, visits, type LocationPoint, type Visit } from '@/db/schema';
import type { AppDatabase } from '@/db/types';

const INSERT_CHUNK_SIZE = 500;

export type LocationPointInput = Omit<LocationPoint, 'id' | 'accuracy' | 'altitude' | 'speed'> &
  Partial<Pick<LocationPoint, 'accuracy' | 'altitude' | 'speed'>>;

export interface StartVisitInput {
  lat: number;
  lng: number;
  arrivedAt: number;
  placeName?: string | null;
}

export function createLocationRepository(db: AppDatabase, deps: RepositoryDeps = defaultDeps) {
  return {
    /** Inserts a batch (as delivered by the background location task) in one transaction. */
    addPoints(points: readonly LocationPointInput[]): void {
      if (points.length === 0) return;
      const rows = points.map((p) => ({
        id: deps.newId(),
        recordedAt: p.recordedAt,
        lat: p.lat,
        lng: p.lng,
        accuracy: p.accuracy ?? null,
        altitude: p.altitude ?? null,
        speed: p.speed ?? null,
      }));
      db.transaction((tx) => {
        // Stay well below SQLite's bound-parameter limit.
        for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
          tx.insert(locationPoints)
            .values(rows.slice(i, i + INSERT_CHUNK_SIZE))
            .run();
        }
      });
    },

    /** Points with `from <= recorded_at < to`, oldest first. */
    listPointsBetween(from: number, to: number): LocationPoint[] {
      return db
        .select()
        .from(locationPoints)
        .where(and(gte(locationPoints.recordedAt, from), lt(locationPoints.recordedAt, to)))
        .orderBy(asc(locationPoints.recordedAt))
        .all();
    },

    latestPoint(): LocationPoint | undefined {
      return db
        .select()
        .from(locationPoints)
        .orderBy(desc(locationPoints.recordedAt))
        .limit(1)
        .get();
    },

    startVisit(input: StartVisitInput): Visit {
      return db
        .insert(visits)
        .values({
          id: deps.newId(),
          lat: input.lat,
          lng: input.lng,
          arrivedAt: input.arrivedAt,
          placeName: input.placeName ?? null,
          departedAt: null,
        })
        .returning()
        .get();
    },

    endVisit(id: string, departedAt: number): Visit | undefined {
      return db.update(visits).set({ departedAt }).where(eq(visits.id, id)).returning().get();
    },

    setVisitPlaceName(id: string, placeName: string | null): void {
      db.update(visits).set({ placeName }).where(eq(visits.id, id)).run();
    },

    /** The visit still in progress, if any. */
    openVisit(): Visit | undefined {
      return db
        .select()
        .from(visits)
        .where(isNull(visits.departedAt))
        .orderBy(desc(visits.arrivedAt))
        .limit(1)
        .get();
    },

    /** Visits that started in `[from, to)`, oldest first. */
    listVisitsBetween(from: number, to: number): Visit[] {
      return db
        .select()
        .from(visits)
        .where(and(gte(visits.arrivedAt, from), lt(visits.arrivedAt, to)))
        .orderBy(asc(visits.arrivedAt))
        .all();
    },
  };
}

export type LocationRepository = ReturnType<typeof createLocationRepository>;
