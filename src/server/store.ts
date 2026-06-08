import type { RoomState } from './roomEngine';

/** Storage for room state. Swappable: in-memory for dev, Redis for production. */
export interface RoomStore {
  get(code: string): Promise<RoomState | null>;
  save(state: RoomState): Promise<void>;
}

/**
 * In-memory store for local development (`vite dev`). A module-level Map lives
 * for the lifetime of the dev server process, so rooms persist across requests.
 * Production uses a Redis-backed store instead (added at deploy time).
 */
export class MemoryStore implements RoomStore {
  private rooms = new Map<string, RoomState>();
  private readonly ttlMs = 1000 * 60 * 60 * 6; // 6h

  async get(code: string): Promise<RoomState | null> {
    const s = this.rooms.get(code);
    if (!s) return null;
    if (Date.now() - s.updatedAt > this.ttlMs) {
      this.rooms.delete(code);
      return null;
    }
    return s;
  }

  async save(state: RoomState): Promise<void> {
    this.rooms.set(state.code, state);
  }
}
