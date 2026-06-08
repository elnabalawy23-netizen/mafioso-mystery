import { MemoryStore } from './store';
import { handleRoom, type ApiResult } from './handler';

/**
 * Dev-only entry: a single in-memory store for the whole `vite dev` session.
 * Loaded at runtime by the Vite plugin via ssrLoadModule, so it is type-checked
 * as ordinary app code (not dragged into the Node config project).
 */
const store = new MemoryStore();

export function handle(payload: Record<string, unknown>): Promise<ApiResult> {
  return handleRoom(store, payload);
}
