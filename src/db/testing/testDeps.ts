import type { RepositoryDeps } from '../deps';

export interface TestDeps extends RepositoryDeps {
  /** Moves the fake clock. */
  advance(ms: number): void;
}

/** Deterministic ids (`id-1`, `id-2`, …) and a manually advanced clock. */
export function createTestDeps(start = Date.UTC(2026, 9, 15, 9, 0)): TestDeps {
  let time = start;
  let counter = 0;
  return {
    now: () => time,
    newId: () => `id-${++counter}`,
    advance: (ms) => {
      time += ms;
    },
  };
}
