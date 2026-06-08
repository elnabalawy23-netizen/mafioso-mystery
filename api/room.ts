// Vercel serverless function: POST /api/room (production).
// Mirrors the dev middleware in vite.config.ts, but with a Redis-backed store.
import { handleRoom } from '../src/server/handler';
import { RedisStore } from '../src/server/redisStore';

let store: RedisStore | null = null;
function getStore(): RedisStore {
  if (!store) store = new RedisStore();
  return store;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  try {
    const payload =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const result = await handleRoom(getStore(), payload);
    res.status(result.status).json(result.body);
  } catch (e) {
    res.status(500).json({ error: 'حصل خطأ في السيرفر', detail: (e as Error)?.message });
  }
}
