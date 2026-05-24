import { json, apiError, readJson } from '../middleware.js';
import { makeMediaJob } from '../../../../packages/shared/src/types/core.js';
import { canTransition, applyTransition } from '../../../../packages/shared/src/jobs/mediaJobState.js';
import { makeMusicGenerationRequest } from '../../../../packages/shared/src/types/music.js';
import { validateMusicGenerationRequest, validateMusicSafety } from '../../../../packages/shared/src/music/schemas.js';
import { routeMusic } from '../../../../packages/shared/src/model-routing/supercomputer.js';
import * as db from '../db/repository.js';

const MUSIC_MODES = {
  'simple': 'simple',
  'instrumental': 'instrumental',
  'lyrics': 'lyrics',
  'cover': 'cover',
  'repaint': 'repaint',
  'stems': 'stems',
};

/**
 * Register music generation routes
 * POST /v1/music/generate — Create full song generation job
 * POST /v1/music/instrumental — Create instrumental-only job
 * POST /v1/music/lyrics — Create song with provided lyrics
 * POST /v1/music/cover — Create audio cover from reference
 * POST /v1/music/repaint — Repaint section of existing song
 * POST /v1/music/stems — Extract stems from audio
 * GET /v1/music/providers — List available music providers + health
 * GET /v1/music/jobs/:id — Get music job status
 * POST /v1/music/jobs/:id/cancel — Cancel music job
 */
export function registerMusic(router) {
  // POST /v1/music/generate — Create song generation job
  router.post('/v1/music/generate', async (req, res) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }

    if (!body.projectId) return apiError(res, 400, 'validation_error', 'projectId is required');

    const project = await db.projects.get(body.projectId);
    if (!project) return apiError(res, 404, 'not_found', `Project ${body.projectId} not found`);

    // Create music generation request from input
    const request = makeMusicGenerationRequest({
      prompt: body.prompt,
      mode: 'simple',
      durationSeconds: body.durationSeconds ?? 60,
      bpm: body.bpm,
      key: body.key,
      seed: body.seed,
      language: body.language ?? 'en',
      locale: body.locale ?? 'en',
    });

    // Validate request structure
    const validation = validateMusicGenerationRequest(request);
    if (!validation.valid) {
      return apiError(res, 400, 'validation_error', validation.errors.join(', '));
    }

    // Check safety (artist imitation, voice cloning, etc.)
    const safetyCheck = validateMusicSafety(request);
    if (!safetyCheck.safe) {
      return apiError(res, 400, 'safety_violation', safetyCheck.reason);
    }

    // Route to best available provider
    const availableProviders = new Set(['ace-step']); // TODO: check health
    const routing = routeMusic({ mode: 'simple', locale: request.locale }, availableProviders);

    // Create job
    const job = makeMediaJob({
      projectId: body.projectId,
      ownerUserId: project.ownerUserId,
      type: 'music-generation',
      input: request,
      providerRoute: {
        provider: routing.primary.provider,
        modelId: routing.primary.modelId,
        reason: routing.reason,
      },
    });

    // Save and queue job
    await db.jobs.put(job.id, job);
    const queued = applyTransition(job, 'queued', {
      stage: 'music-generation-queued',
      message: `Routed to ${routing.primary.displayName}`,
    });
    await db.jobs.put(queued.id, queued);

    json(res, 202, {
      jobId: queued.id,
      status: queued.status,
      provider: routing.primary.provider,
      modelId: routing.primary.modelId,
      message: routing.reason,
    });
  });

  // POST /v1/music/instrumental — Create instrumental-only job
  router.post('/v1/music/instrumental', async (req, res) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }

    if (!body.projectId) return apiError(res, 400, 'validation_error', 'projectId is required');

    const project = await db.projects.get(body.projectId);
    if (!project) return apiError(res, 404, 'not_found', `Project ${body.projectId} not found`);

    const request = makeMusicGenerationRequest({
      prompt: body.prompt,
      mode: 'instrumental',
      durationSeconds: body.durationSeconds ?? 60,
      bpm: body.bpm,
      key: body.key,
      seed: body.seed,
      language: body.language ?? 'en',
      locale: body.locale ?? 'en',
    });

    const validation = validateMusicGenerationRequest(request);
    if (!validation.valid) {
      return apiError(res, 400, 'validation_error', validation.errors.join(', '));
    }

    const availableProviders = new Set(['ace-step']);
    const routing = routeMusic({ mode: 'instrumental', locale: request.locale }, availableProviders);

    const job = makeMediaJob({
      projectId: body.projectId,
      ownerUserId: project.ownerUserId,
      type: 'music-generation',
      input: request,
      providerRoute: {
        provider: routing.primary.provider,
        modelId: routing.primary.modelId,
        reason: routing.reason,
      },
    });

    await db.jobs.put(job.id, job);
    const queued = applyTransition(job, 'queued', {
      stage: 'music-generation-queued',
      message: `Instrumental routed to ${routing.primary.displayName}`,
    });
    await db.jobs.put(queued.id, queued);

    json(res, 202, {
      jobId: queued.id,
      status: queued.status,
      provider: routing.primary.provider,
      modelId: routing.primary.modelId,
      message: routing.reason,
    });
  });

  // POST /v1/music/lyrics — Create song with provided lyrics
  router.post('/v1/music/lyrics', async (req, res) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }

    if (!body.projectId) return apiError(res, 400, 'validation_error', 'projectId is required');
    if (!body.lyrics) return apiError(res, 400, 'validation_error', 'lyrics is required for lyrics mode');

    const project = await db.projects.get(body.projectId);
    if (!project) return apiError(res, 404, 'not_found', `Project ${body.projectId} not found`);

    const request = makeMusicGenerationRequest({
      prompt: body.prompt,
      lyrics: body.lyrics,
      mode: 'lyrics',
      durationSeconds: body.durationSeconds ?? 60,
      bpm: body.bpm,
      key: body.key,
      seed: body.seed,
      language: body.language ?? 'en',
      locale: body.locale ?? 'en',
    });

    const validation = validateMusicGenerationRequest(request);
    if (!validation.valid) {
      return apiError(res, 400, 'validation_error', validation.errors.join(', '));
    }

    const safetyCheck = validateMusicSafety(request);
    if (!safetyCheck.safe) {
      return apiError(res, 400, 'safety_violation', safetyCheck.reason);
    }

    const availableProviders = new Set(['ace-step']);
    const routing = routeMusic({ mode: 'lyrics', locale: request.locale }, availableProviders);

    const job = makeMediaJob({
      projectId: body.projectId,
      ownerUserId: project.ownerUserId,
      type: 'music-generation',
      input: request,
      providerRoute: {
        provider: routing.primary.provider,
        modelId: routing.primary.modelId,
        reason: routing.reason,
      },
    });

    await db.jobs.put(job.id, job);
    const queued = applyTransition(job, 'queued', {
      stage: 'music-generation-queued',
      message: `Lyrics mode routed to ${routing.primary.displayName}`,
    });
    await db.jobs.put(queued.id, queued);

    json(res, 202, {
      jobId: queued.id,
      status: queued.status,
      provider: routing.primary.provider,
      modelId: routing.primary.modelId,
      message: routing.reason,
    });
  });

  // POST /v1/music/cover — Create audio cover from reference
  router.post('/v1/music/cover', async (req, res) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }

    if (!body.projectId) return apiError(res, 400, 'validation_error', 'projectId is required');
    if (!body.sourceAudioAssetId) return apiError(res, 400, 'validation_error', 'sourceAudioAssetId is required for cover mode');

    const project = await db.projects.get(body.projectId);
    if (!project) return apiError(res, 404, 'not_found', `Project ${body.projectId} not found`);

    const request = makeMusicGenerationRequest({
      prompt: body.prompt,
      mode: 'cover',
      sourceAudioAssetId: body.sourceAudioAssetId,
      durationSeconds: body.durationSeconds ?? 60,
      bpm: body.bpm,
      key: body.key,
      seed: body.seed,
      language: body.language ?? 'en',
      locale: body.locale ?? 'en',
    });

    const validation = validateMusicGenerationRequest(request);
    if (!validation.valid) {
      return apiError(res, 400, 'validation_error', validation.errors.join(', '));
    }

    const safetyCheck = validateMusicSafety(request);
    if (!safetyCheck.safe) {
      return apiError(res, 400, 'safety_violation', safetyCheck.reason);
    }

    const availableProviders = new Set(['ace-step']);
    const routing = routeMusic({ mode: 'cover', locale: request.locale }, availableProviders);

    const job = makeMediaJob({
      projectId: body.projectId,
      ownerUserId: project.ownerUserId,
      type: 'music-generation',
      input: request,
      providerRoute: {
        provider: routing.primary.provider,
        modelId: routing.primary.modelId,
        reason: routing.reason,
      },
    });

    await db.jobs.put(job.id, job);
    const queued = applyTransition(job, 'queued', {
      stage: 'music-generation-queued',
      message: `Cover mode routed to ${routing.primary.displayName}`,
    });
    await db.jobs.put(queued.id, queued);

    json(res, 202, {
      jobId: queued.id,
      status: queued.status,
      provider: routing.primary.provider,
      modelId: routing.primary.modelId,
      message: routing.reason,
    });
  });

  // POST /v1/music/repaint — Repaint section of existing song
  router.post('/v1/music/repaint', async (req, res) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }

    if (!body.projectId) return apiError(res, 400, 'validation_error', 'projectId is required');
    if (!body.sourceAudioAssetId) return apiError(res, 400, 'validation_error', 'sourceAudioAssetId is required');

    const project = await db.projects.get(body.projectId);
    if (!project) return apiError(res, 404, 'not_found', `Project ${body.projectId} not found`);

    const request = makeMusicGenerationRequest({
      prompt: body.prompt,
      mode: 'repaint',
      sourceAudioAssetId: body.sourceAudioAssetId,
      startSeconds: body.startSeconds ?? 0,
      endSeconds: body.endSeconds ?? null,
      language: body.language ?? 'en',
      locale: body.locale ?? 'en',
    });

    const validation = validateMusicGenerationRequest(request);
    if (!validation.valid) {
      return apiError(res, 400, 'validation_error', validation.errors.join(', '));
    }

    const availableProviders = new Set(['ace-step']);
    const routing = routeMusic({ mode: 'repaint', locale: request.locale }, availableProviders);

    const job = makeMediaJob({
      projectId: body.projectId,
      ownerUserId: project.ownerUserId,
      type: 'music-generation',
      input: request,
      providerRoute: {
        provider: routing.primary.provider,
        modelId: routing.primary.modelId,
        reason: routing.reason,
      },
    });

    await db.jobs.put(job.id, job);
    const queued = applyTransition(job, 'queued', {
      stage: 'music-generation-queued',
      message: `Repaint routed to ${routing.primary.displayName}`,
    });
    await db.jobs.put(queued.id, queued);

    json(res, 202, {
      jobId: queued.id,
      status: queued.status,
      provider: routing.primary.provider,
      modelId: routing.primary.modelId,
      message: routing.reason,
    });
  });

  // POST /v1/music/stems — Extract stems from audio
  router.post('/v1/music/stems', async (req, res) => {
    let body;
    try { body = await readJson(req); } catch { return apiError(res, 400, 'invalid_body', 'Invalid JSON'); }

    if (!body.projectId) return apiError(res, 400, 'validation_error', 'projectId is required');
    if (!body.sourceAudioAssetId) return apiError(res, 400, 'validation_error', 'sourceAudioAssetId is required for stem extraction');

    const project = await db.projects.get(body.projectId);
    if (!project) return apiError(res, 404, 'not_found', `Project ${body.projectId} not found`);

    const request = makeMusicGenerationRequest({
      mode: 'stems',
      sourceAudioAssetId: body.sourceAudioAssetId,
      language: 'en',
      locale: 'en',
    });

    const validation = validateMusicGenerationRequest(request);
    if (!validation.valid) {
      return apiError(res, 400, 'validation_error', validation.errors.join(', '));
    }

    const availableProviders = new Set(['ace-step']);
    const routing = routeMusic({ mode: 'stems' }, availableProviders);

    const job = makeMediaJob({
      projectId: body.projectId,
      ownerUserId: project.ownerUserId,
      type: 'music-generation',
      input: request,
      providerRoute: {
        provider: routing.primary.provider,
        modelId: routing.primary.modelId,
        reason: routing.reason,
      },
    });

    await db.jobs.put(job.id, job);
    const queued = applyTransition(job, 'queued', {
      stage: 'music-generation-queued',
      message: `Stem extraction routed to ${routing.primary.displayName}`,
    });
    await db.jobs.put(queued.id, queued);

    json(res, 202, {
      jobId: queued.id,
      status: queued.status,
      provider: routing.primary.provider,
      modelId: routing.primary.modelId,
      message: routing.reason,
    });
  });

  // GET /v1/music/providers — List available music providers
  router.get('/v1/music/providers', (_req, res) => {
    const aceStep = {
      id: 'ace-step',
      modelId: 'ace-step-1.5',
      displayName: 'ACE-Step 1.5',
      displayNameEs: 'ACE-Step 1.5',
      enabled: process.env.ACESTEP_MOCK_MODE === 'true',
      capabilities: ['text-to-music', 'instrumental', 'lyrics'],
      costTier: 'free',
      speedTier: 'normal',
      qualityTier: 'high',
    };

    json(res, 200, {
      providers: [aceStep],
      message: 'Music providers listed',
    });
  });

  // GET /v1/music/jobs/:id — Get music job status
  router.get('/v1/music/jobs/:id', async (req, res, params) => {
    const job = await db.jobs.get(params.id);
    if (!job) return apiError(res, 404, 'not_found', 'Job not found');
    if (job.type !== 'music-generation') return apiError(res, 400, 'type_mismatch', 'Not a music generation job');
    json(res, 200, job);
  });

  // POST /v1/music/jobs/:id/cancel — Cancel music job
  router.post('/v1/music/jobs/:id/cancel', async (req, res, params) => {
    const job = await db.jobs.get(params.id);
    if (!job) return apiError(res, 404, 'not_found', 'Job not found');
    if (job.type !== 'music-generation') return apiError(res, 400, 'type_mismatch', 'Not a music generation job');
    if (!canTransition(job.status, 'cancelled')) {
      return apiError(res, 409, 'invalid_transition', `Cannot cancel job in state '${job.status}'`);
    }
    const updated = applyTransition(job, 'cancelled', { message: 'Cancelled by user' });
    await db.jobs.put(updated.id, updated);
    json(res, 200, updated);
  });
}
