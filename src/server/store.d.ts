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
export declare class MemoryStore implements RoomStore {
    private rooms;
    private readonly ttlMs;
    get(code: string): Promise<RoomState | null>;
    save(state: RoomState): Promise<void>;
}
