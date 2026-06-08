import { defineConfig, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

/** Serves POST /api/room during `vite dev`, backed by an in-memory store. */
function roomApiDev() {
  return {
    name: 'room-api-dev',
    configureServer(server: ViteDevServer) {
      // req/res are loosely typed to avoid pulling Node types into this config.
      server.middlewares.use('/api/room', (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next();
        let raw = '';
        req.on('data', (chunk: any) => (raw += chunk));
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const payload = raw ? JSON.parse(raw) : {};
            const { handle } = await server.ssrLoadModule('/src/server/devEntry.ts');
            const result = await handle(payload);
            res.statusCode = result.status;
            res.end(JSON.stringify(result.body));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'JSON غلط' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), roomApiDev()],
  server: {
    host: true,
    port: 5173,
  },
});
