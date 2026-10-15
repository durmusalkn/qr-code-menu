import { randomUUID } from 'expo-crypto';

/** New primary key (UUID v4). */
export function newId(): string {
  return randomUUID();
}
