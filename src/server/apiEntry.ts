// Source for the production serverless function. Bundled by `npm run build:api`
// into a self-contained api/room.js (no runtime relative imports — that avoids
// Vercel's ESM module-resolution failures and inlines cases.json + the Redis
// client). The dev server uses the same handleRoom via the Vite middleware.
import { handleRoom } from './handler';
import { RedisStore } from './redisStore';

let store: RedisStore | null = null;
function getStore(): RedisStore {
  if (!store) store = new RedisStore();
  return store;
}

async function readPayload(req: any): Promise<Record<string, unknown>> {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  }
  const raw = await new Promise<string>((resolve) => {
    let d = '';
    req.on('data', (c: any) => (d += c));
    req.on('end', () => resolve(d));
  });
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'POST only' }));
    return;
  }
  try {
    const payload = await readPayload(req);
    const result = await handleRoom(getStore(), payload);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'حصل خطأ في السيرفر', detail: (e as Error)?.message }));
  }
}
