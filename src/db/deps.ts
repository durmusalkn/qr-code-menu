import { newId } from '@/lib/id';

/** Injected into repositories so tests can control ids and time. */
export interface RepositoryDeps {
  now(): number;
  newId(): string;
}

export const defaultDeps: RepositoryDeps = {
  now: () => Date.now(),
  newId,
};
