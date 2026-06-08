import { Redis } from '@upstash/redis';
import type { RoomStore } from './store';
import type { RoomState } from './roomEngine';

const TTL_SECONDS = 60 * 60 * 6; // rooms expire after 6h of inactivity

/**
 * Production room store backed by Upstash Redis (REST). Reads its connection
 * from the standard env vars set by the Vercel ↔ Upstash integration
 * (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). The @upstash/redis
 * client serializes/deserializes JSON automatically.
 */
export class RedisStore implements RoomStore {
  private redis: Redis;

  constructor() {
    this.redis = Redis.fromEnv();
  }

  async get(code: string): Promise<RoomState | null> {
    return (await this.redis.get<RoomState>(`room:${code}`)) ?? null;
  }

  async save(state: RoomState): Promise<void> {
    await this.redis.set(`room:${state.code}`, state, { ex: TTL_SECONDS });
  }
}
