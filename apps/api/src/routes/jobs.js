import { json, apiError, readJson } from '../middleware.js';
import { makeMediaJob } from '../../../../packages/shared/src/types/core.js';
import { canTransition, applyTransition } from '../../../../packages/shared/src/jobs/mediaJobState.js';
import * as db from '../db/repository.js';

const JOB_TYPES = {
  'music-video':    'music-video',
  'visualizer':     'visualizer',
  'mix-master':     'mix-master',
  'autotune':       'autotune',
};

export function registerJobs(router) {
  // POST /v1/jobs/:type  (create job)
  for (const [slug, type] of Object.entries(JOB_TYPES)) {
    router.post(`/v1/jobs/${slug}`, async (req, res) => {
      let body;
      try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }

      if (!body.projectId) return apiError(res, 400, 'validation_error', 'projectId is required');

      const project = await db.projects.get(body.projectId);
      if (!project) return apiError(res, 404, 'not_found', `Project ${body.projectId} not found`);

      const job = makeMediaJob({ projectId: body.projectId, ownerUserId: project.ownerUserId, type, input: body });
      await db.jobs.put(job.id, job);

      // Enqueue (stub: immediately transition to queued)
      const queued = applyTransition(job, 'queued', { stage: 'enqueued', message: 'Job queued' });
      await db.jobs.put(queued.id, queued);

      json(res, 202, queued);
    });
  }

  // POST /v1/jobs/music-video/:id/generate-scenes
  router.post('/v1/jobs/music-video/:id/generate-scenes', async (req, res, params) => {
    const job = await db.jobs.get(params.id);
    if (!job) return apiError(res, 404, 'not_found', 'Job not found');
    if (job.type !== 'music-video') return apiError(res, 400, 'type_mismatch', 'Not a music-video job');
    const body = await readJson(req).catch(() => ({}));
    const updated = await db.jobs.patch(params.id, {
      stage: 'scene-generation',
      message: 'Scene generation requested',
      sceneGenerationInput: body,
    });
    json(res, 202, updated);
  });

  // POST /v1/jobs/music-video/:id/render
  router.post('/v1/jobs/music-video/:id/render', async (req, res, params) => {
    const job = await db.jobs.get(params.id);
    if (!job) return apiError(res, 404, 'not_found', 'Job not found');
    const updated = await db.jobs.patch(params.id, {
      stage: 'render-requested',
      message: 'Render requested',
    });
    json(res, 202, updated);
  });

  // GET /v1/jobs/:id
  router.get('/v1/jobs/:id', async (req, res, params) => {
    const job = await db.jobs.get(params.id);
    if (!job) return apiError(res, 404, 'not_found', 'Job not found');
    json(res, 200, job);
  });

  // GET /v1/jobs/:id/events  (SSE stream)
  router.get('/v1/jobs/:id/events', async (req, res, params) => {
    const job = await db.jobs.get(params.id);
    if (!job) return apiError(res, 404, 'not_found', 'Job not found');

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    if (typeof res.flushHeaders === 'function') res.flushHeaders();
    send('status', job);

    let closed = false;
    let timer = null;
    req.on('close', () => { closed = true; if (timer) clearTimeout(timer); });

    // Self-rescheduling poll — avoids unhandled rejection and tick overlap
    const tick = async () => {
      if (closed) return;
      try {
        const current = await db.jobs.get(params.id);
        if (!current || closed) { res.end(); return; }
        send('status', current);
        if (['succeeded', 'failed', 'cancelled'].includes(current.status)) {
          send('done', { jobId: current.id, status: current.status });
          res.end();
          return;
        }
      } catch (err) {
        if (!closed) res.write(`: poll error ${String(err.message)}\n\n`);
      }
      if (!closed) timer = setTimeout(tick, 2000);
    };
    // SSE keepalive comment every 15s so proxies don't drop the connection
    const heartbeat = setInterval(() => { if (!closed) res.write(': heartbeat\n\n'); }, 15000);
    req.on('close', () => clearInterval(heartbeat));

    timer = setTimeout(tick, 2000);
  });

  // POST /v1/jobs/:id/cancel
  router.post('/v1/jobs/:id/cancel', async (req, res, params) => {
    const job = await db.jobs.get(params.id);
    if (!job) return apiError(res, 404, 'not_found', 'Job not found');
    if (!canTransition(job.status, 'cancelled')) {
      return apiError(res, 409, 'invalid_transition', `Cannot cancel job in state '${job.status}'`);
    }
    const updated = applyTransition(job, 'cancelled', { message: 'Cancelled by user' });
    await db.jobs.put(updated.id, updated);
    json(res, 200, updated);
  });

  // POST /v1/jobs/:id/remake
  router.post('/v1/jobs/:id/remake', async (req, res, params) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }
    const job = await db.jobs.get(params.id);
    if (!job) return apiError(res, 404, 'not_found', 'Job not found');

    const remakeJob = makeMediaJob({
      projectId: job.projectId,
      ownerUserId: job.ownerUserId,
      type: 'scene-generation',
      input: { parentJobId: params.id, sceneIds: body.sceneIds ?? [], changes: body.changes ?? {} },
    });
    const queued = applyTransition(remakeJob, 'queued', { stage: 'remake-queued' });
    await db.jobs.put(queued.id, queued);
    json(res, 202, queued);
  });

  // GET /v1/providers (stub list)
  router.get('/v1/providers', (_req, res) => {
    json(res, 200, {
      providers: [
        { id: 'local', enabled: false, capabilities: ['text-to-video', 'image-to-video'] },
        { id: 'huggingface', enabled: process.env.HF_ENABLED === 'true', capabilities: ['text-to-image', 'text-to-video'] },
        { id: 'fal', enabled: process.env.FAL_ENABLED === 'true', capabilities: ['text-to-video', 'image-to-video'] },
        { id: 'muapi', enabled: process.env.MUAPI_ENABLED === 'true', capabilities: ['text-to-image', 'text-to-video', 'lipsync'] },
        { id: 'stub', enabled: true, capabilities: ['text-to-video', 'image-to-video', 'visualizer', 'mix-master'] },
      ],
    });
  });
}
