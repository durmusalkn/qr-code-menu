import { createTestDatabase, type TestDatabase } from '@/db/testing/createTestDatabase';
import { createTestDeps, type TestDeps } from '@/db/testing/testDeps';
import { createBackupLogRepository, type BackupLogRepository } from '@/features/backup/repository';

describe('backup log repository', () => {
  let t: TestDatabase;
  let deps: TestDeps;
  let repo: BackupLogRepository;

  beforeEach(async () => {
    t = await createTestDatabase();
    deps = createTestDeps();
    repo = createBackupLogRepository(t.db, deps);
  });

  afterEach(() => t.raw.close());

  it('records a successful run', () => {
    const entry = repo.start();
    expect(entry).toMatchObject({ status: 'running', filesCopied: 0, bytesCopied: 0 });

    deps.advance(5_000);
    const done = repo.succeed(entry.id, { filesCopied: 3, bytesCopied: 4096 });

    expect(done).toMatchObject({
      status: 'success',
      filesCopied: 3,
      bytesCopied: 4096,
      finishedAt: entry.startedAt + 5_000,
      error: null,
    });
  });

  it('distinguishes the latest run from the latest successful one', () => {
    const ok = repo.start();
    repo.succeed(ok.id, { filesCopied: 1, bytesCopied: 1 });
    deps.advance(86_400_000);
    const failed = repo.start();
    repo.fail(failed.id, 'Klasöre erişilemedi', { filesCopied: 1 });

    expect(repo.latest()).toMatchObject({ id: failed.id, status: 'error', filesCopied: 1 });
    expect(repo.latestSuccessful()?.id).toBe(ok.id);
  });

  it('is empty before the first backup', () => {
    expect(repo.latest()).toBeUndefined();
    expect(repo.latestSuccessful()).toBeUndefined();
  });
});
