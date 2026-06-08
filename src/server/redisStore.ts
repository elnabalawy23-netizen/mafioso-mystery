import { Redis } from '@upstash/redis';
import type { RoomStore } from './store';
import type { RoomState } from './roomEngine';

// This module only runs server-side (the Vercel function); declare `process`
// locally so it type-checks under the app's DOM tsconfig without @types/node.
declare const process: { env: Record<string, string | undefined> };

const TTL_SECONDS = 60 * 60 * 6; // rooms expire after 6h of inactivity

/**
 * Production room store backed by Upstash Redis (REST). Reads its connection
 * from the env vars set by the Vercel ↔ Upstash integration — the KV-style
 * names (KV_REST_API_URL / KV_REST_API_TOKEN), falling back to the classic
 * UPSTASH_REDIS_REST_* names. @upstash/redis (de)serializes JSON itself.
 */
export class RedisStore implements RoomStore {
  private redis: Redis;

  constructor() {
    const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error('Missing Redis env vars (KV_REST_API_URL / KV_REST_API_TOKEN)');
    }
    this.redis = new Redis({ url, token });
  }

  async get(code: string): Promise<RoomState | null> {
    return (await this.redis.get<RoomState>(`room:${code}`)) ?? null;
  }

  async save(state: RoomState): Promise<void> {
    await this.redis.set(`room:${state.code}`, state, { ex: TTL_SECONDS });
  }
}
