/**
 * AppStorage.d.ts
 * Type declarations for the vanilla JS AppStorage module (IndexedDB-backed).
 */

export interface ScopedStorage {
  ensure(key: string, defaultValue: unknown): Promise<void>;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

export default class AppStorage {
  location(company: unknown, location: unknown): ScopedStorage;
}
