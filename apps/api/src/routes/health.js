import { json } from '../middleware.js';

export function registerHealth(router) {
  router.get('/health', (_req, res) => {
    json(res, 200, {
      ok: true,
      service: 'more-of-less-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    });
  });
}
