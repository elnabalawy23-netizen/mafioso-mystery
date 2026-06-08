import type { Plugin } from 'vite';
/**
 * Serves the room API under POST /api/room during `vite dev`, backed by an
 * in-memory store. Production uses the same handler from a serverless function
 * with a Redis-backed store. Keeping both on `handleRoom` means the dev and
 * prod behaviour stay identical.
 */
export declare function roomApiDev(): Plugin;
