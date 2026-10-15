import { createTestDatabase, type TestDatabase } from '@/db/testing/createTestDatabase';
import { createTestDeps, type TestDeps } from '@/db/testing/testDeps';
import {
  createPromptsRepository,
  type PromptsRepository,
} from '@/features/notifications/repository';

const HOUR = 3_600_000;

describe('prompts repository', () => {
  let t: TestDatabase;
  let deps: TestDeps;
  let repo: PromptsRepository;

  beforeEach(async () => {
    t = await createTestDatabase();
    deps = createTestDeps();
    repo = createPromptsRepository(t.db, deps);
  });

  afterEach(() => t.raw.close());

  it('stores a plan and lists pending prompts in order', () => {
    const now = deps.now();
    repo.addPlanned([
      { kind: 'photo', scheduledFor: now + 3 * HOUR },
      { kind: 'mood', scheduledFor: now + HOUR },
      { kind: 'activity', scheduledFor: now - HOUR },
    ]);

    expect(repo.listPending(now).map((p) => p.kind)).toEqual(['mood', 'photo']);
    expect(repo.listBetween(now - HOUR, now + HOUR)).toHaveLength(1);
  });

  it('replaces the pending plan but keeps delivered and past prompts', () => {
    const now = deps.now();
    const [past, delivered, pending] = repo.addPlanned([
      { kind: 'mood', scheduledFor: now - HOUR },
      { kind: 'mood', scheduledFor: now + HOUR },
      { kind: 'photo', scheduledFor: now + 2 * HOUR },
    ]);
    repo.setNotificationId(pending!.id, 'os-1');
    repo.markDelivered(delivered!.id);

    const removed = repo.removePending(now);

    expect(removed.map((p) => p.notificationId)).toEqual(['os-1']);
    expect(repo.getById(past!.id)).toBeDefined();
    expect(repo.getById(delivered!.id)?.deliveredAt).toBe(now);
    expect(repo.getById(pending!.id)).toBeUndefined();
  });

  it('keeps the first delivery time', () => {
    const [prompt] = repo.addPlanned([{ kind: 'mood', scheduledFor: deps.now() }]);
    repo.markDelivered(prompt!.id, 100);
    repo.markDelivered(prompt!.id, 200);

    expect(repo.getById(prompt!.id)?.deliveredAt).toBe(100);
  });

  it('records a response with the moment it produced', () => {
    const [prompt] = repo.addPlanned([{ kind: 'mood', scheduledFor: deps.now() }]);

    repo.markResponded(prompt!.id, 'moment-1');

    expect(repo.getById(prompt!.id)).toMatchObject({
      respondedAt: deps.now(),
      responseMomentId: 'moment-1',
    });
  });

  it('rejects unknown prompt kinds at the database level', () => {
    expect(() =>
      t.raw.exec("INSERT INTO prompts (id, kind, scheduled_for) VALUES ('x', 'weather', 1)"),
    ).toThrow(/CHECK constraint failed/);
  });
});
