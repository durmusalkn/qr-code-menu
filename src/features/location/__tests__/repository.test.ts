import { createTestDatabase, type TestDatabase } from '@/db/testing/createTestDatabase';
import { createTestDeps } from '@/db/testing/testDeps';
import { createLocationRepository, type LocationRepository } from '@/features/location/repository';

describe('location repository', () => {
  let t: TestDatabase;
  let repo: LocationRepository;

  beforeEach(async () => {
    t = await createTestDatabase();
    repo = createLocationRepository(t.db, createTestDeps());
  });

  afterEach(() => t.raw.close());

  it('stores point batches and lists them by time', () => {
    repo.addPoints([
      { recordedAt: 30, lat: 41, lng: 29, accuracy: 12 },
      { recordedAt: 10, lat: 41.1, lng: 29.1, speed: 1.5 },
      { recordedAt: 20, lat: 41.2, lng: 29.2 },
    ]);

    expect(repo.listPointsBetween(10, 30).map((p) => p.recordedAt)).toEqual([10, 20]);
    expect(repo.latestPoint()).toMatchObject({ recordedAt: 30, accuracy: 12, altitude: null });
  });

  it('handles large batches and empty ones', () => {
    const points = Array.from({ length: 1234 }, (_, i) => ({ recordedAt: i, lat: 41, lng: 29 }));

    repo.addPoints(points);
    repo.addPoints([]);

    expect(repo.listPointsBetween(0, 10_000)).toHaveLength(1234);
  });

  it('tracks an open visit until it ends', () => {
    expect(repo.openVisit()).toBeUndefined();

    const visit = repo.startVisit({ lat: 40.98, lng: 29.03, arrivedAt: 1_000 });
    expect(repo.openVisit()?.id).toBe(visit.id);

    repo.setVisitPlaceName(visit.id, 'Moda');
    const ended = repo.endVisit(visit.id, 2_000);

    expect(ended).toMatchObject({ placeName: 'Moda', arrivedAt: 1_000, departedAt: 2_000 });
    expect(repo.openVisit()).toBeUndefined();
    expect(repo.listVisitsBetween(0, 5_000)).toHaveLength(1);
  });
});
