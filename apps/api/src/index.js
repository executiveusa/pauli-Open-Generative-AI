import http from 'node:http';
import { Router } from './router.js';
import { json, apiError, CORS_HEADERS } from './middleware.js';
import { registerHealth }     from './routes/health.js';
import { registerProjects }   from './routes/projects.js';
import { registerAssets }     from './routes/assets.js';
import { registerCharacters } from './routes/characters.js';
import { registerJobs }       from './routes/jobs.js';
import { registerMusic }      from './routes/music.js';

const router = new Router();

registerHealth(router);
registerProjects(router);
registerAssets(router);
registerCharacters(router);
registerJobs(router);
registerMusic(router);

const server = http.createServer(async (req, res) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost`);
  const match = router.match(req.method, url.pathname);

  if (!match) {
    return apiError(res, 404, 'not_found', `${req.method} ${url.pathname} not found`);
  }

  try {
    await match.handler(req, res, match.params);
  } catch (err) {
    const redact = s => String(s ?? '').replace(
      /(sk-[A-Za-z0-9_-]+|hf_[A-Za-z0-9]+|fal_[A-Za-z0-9_-]+|nvapi-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9]+|AKIA[0-9A-Z]{16}|Bearer\s+[A-Za-z0-9._-]+)/gi,
      '[REDACTED]',
    );
    console.error('[api error]', redact(err.stack ?? err.message ?? String(err)));
    apiError(res, 500, 'internal_error', redact(err.message));
  }
});

const port = Number(process.env.API_PORT ?? 8000);
server.listen(port, () => {
  console.log(`[more-of-less api] listening on http://localhost:${port}`);
  console.log(`[more-of-less api] HF=${process.env.HF_ENABLED ?? 'false'} FAL=${process.env.FAL_ENABLED ?? 'false'} MUAPI=${process.env.MUAPI_ENABLED ?? 'false'}`);
});

export { server };
