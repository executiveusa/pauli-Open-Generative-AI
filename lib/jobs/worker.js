/**
 * lib/jobs/worker.js
 * Job execution engine.
 *
 * executeJob(jobId, db?) — loads job, dispatches to provider, saves artifact, updates status
 * pickAndRun(db?)        — finds oldest queued job, executes it (for cron use)
 *
 * All API keys read from env vars at call time via resolveProviderKey().
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { routeJob } from './router.js';

const STORAGE_ROOT  = process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage');
const JOBS_DIR      = join(STORAGE_ROOT, 'db', 'jobs');
const ARTIFACTS_DIR = join(STORAGE_ROOT, 'db', 'artifacts');
const JOB_TIMEOUT   = Number(process.env.JOB_TIMEOUT_MS ?? 120_000);

const SECRET_RE = /(sk-[A-Za-z0-9_-]+|hf_[A-Za-z0-9]+|fal_[A-Za-z0-9_-]+|nvapi-[A-Za-z0-9_-]+|Bearer\s+[A-Za-z0-9._-]+)/gi;
const redact = (s) => String(s).replace(SECRET_RE, '[REDACTED]');

// ─── Disk helpers (dev) ────────────────────────────────────────────────────

async function diskReadJob(id) {
  try {
    const raw = await fs.readFile(join(JOBS_DIR, `${id}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch { return null; }
}

async function diskWriteJob(job) {
  await fs.mkdir(JOBS_DIR, { recursive: true });
  await fs.writeFile(join(JOBS_DIR, `${job.id}.json`), JSON.stringify(job, null, 2));
}

async function diskWriteArtifact(artifact) {
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.writeFile(join(ARTIFACTS_DIR, `${artifact.id}.json`), JSON.stringify(artifact, null, 2));
}

function artifactId() {
  return `art_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Provider dispatch ─────────────────────────────────────────────────────

async function callFal(job) {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) throw new Error('FAL_API_KEY not set');

  const endpoint = process.env.FAL_ENDPOINT ?? 'https://queue.fal.run';
  const isVideo  = ['video', 'lipsync', 'music_video'].includes(job.jobType ?? job.type);
  const model    = job.modelId
    ?? (isVideo ? (process.env.FAL_VIDEO_MODEL ?? 'fal-ai/fast-svd') : (process.env.FAL_IMAGE_MODEL ?? 'fal-ai/flux/schnell'));

  const body = {
    prompt: job.inputPrompt || job.compiledPrompt || '',
    negative_prompt: job.inputNegativePrompt ?? '',
    ...(job.parameters ?? {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JOB_TIMEOUT);

  try {
    const res = await fetch(`${endpoint}/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(redact(err?.detail ?? err?.message ?? `HTTP ${res.status}`));
    }

    const data = await res.json();

    // fal returns { images: [{ url }] } or { video: { url } }
    const url = data?.images?.[0]?.url ?? data?.video?.url ?? data?.url ?? null;
    const type = isVideo ? 'video' : 'image';

    return { url, type, providerJobId: data?.request_id ?? null, raw: data };
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(job) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const isText = ['prompt_compile', 'evaluation'].includes(job.jobType ?? job.type);
  const endpoint = isText ? 'https://api.openai.com/v1/chat/completions' : 'https://api.openai.com/v1/images/generations';
  const model = job.modelId ?? (isText ? (process.env.OPENAI_TEXT_MODEL ?? 'gpt-4o-mini') : (process.env.OPENAI_IMAGE_MODEL ?? 'dall-e-3'));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JOB_TIMEOUT);

  try {
    let reqBody;
    if (isText) {
      reqBody = {
        model,
        messages: [{ role: 'user', content: job.inputPrompt || '' }],
        max_tokens: 1024,
      };
    } else {
      reqBody = {
        model,
        prompt: job.inputPrompt || '',
        n: 1,
        size: '1024x1024',
        response_format: 'url',
      };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(reqBody),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(redact(err?.error?.message ?? `HTTP ${res.status}`));
    }

    const data = await res.json();
    if (isText) {
      const text = data?.choices?.[0]?.message?.content ?? '';
      return { url: null, type: 'text', content: text, raw: data };
    }
    const url = data?.data?.[0]?.url ?? null;
    return { url, type: 'image', raw: data };
  } finally {
    clearTimeout(timer);
  }
}

async function callNvidiaNim(job) {
  const { NvidiaNimProxyAdapter } = await import('../providers/adapters/NvidiaNimProxyAdapter.js');
  const nim = new NvidiaNimProxyAdapter();
  const result = await nim.compilePrompt({
    promptEn: job.inputPrompt || '',
    locale: 'en',
  });
  return { url: null, type: 'text', content: JSON.stringify(result), raw: result };
}

function mockResult(job) {
  const type = ['video', 'lipsync', 'music_video'].includes(job.jobType ?? job.type) ? 'video' : 'image';
  return {
    url: `mock://artifacts/${job.id}/${type}`,
    type,
    raw: { mock: true, jobId: job.id },
  };
}

async function dispatch(providerId, job) {
  switch (providerId) {
    case 'fal':        return callFal(job);
    case 'openai':     return callOpenAI(job);
    case 'nvidia_nim': return callNvidiaNim(job);
    case 'muapi': {
      // muapi: forward to MuAPI gateway if key present
      const apiKey = process.env.MUAPI_API_KEY;
      if (!apiKey) throw new Error('MUAPI_API_KEY not set');
      const endpoint = process.env.MUAPI_ENDPOINT ?? 'https://api.muapi.ai/v1';
      const res = await fetch(`${endpoint}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ prompt: job.inputPrompt, type: job.jobType ?? 'image' }),
      });
      if (!res.ok) throw new Error(redact(`MuAPI HTTP ${res.status}`));
      const data = await res.json();
      return { url: data?.artifact?.url ?? null, type: 'image', raw: data };
    }
    default:
      return mockResult(job);
  }
}

// ─── Core execution ────────────────────────────────────────────────────────

/**
 * Execute a single job by ID.
 *
 * @param {string} jobId
 * @param {import('@prisma/client').PrismaClient|null} db
 * @returns {Promise<{id: string, status: string, artifactUrl?: string}>}
 */
export async function executeJob(jobId, db) {
  // ── 1. Load job ──────────────────────────────────────────────────────────
  let job = null;
  if (db) {
    try {
      job = await db.generationJob.findUnique({ where: { id: jobId } });
    } catch { /* fall to disk */ }
  }
  if (!job) job = await diskReadJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  if (!['queued', 'failed'].includes(job.status)) {
    return { id: job.id, status: job.status, message: 'Job is not in an executable state' };
  }

  // ── 2. Mark running (optimistic lock) ────────────────────────────────────
  const ts = new Date().toISOString();
  if (db) {
    try {
      await db.generationJob.update({
        where: { id: jobId, status: { in: ['queued', 'failed'] } },
        data: { status: 'running', updatedAt: new Date() },
      });
    } catch {
      return { id: jobId, status: 'conflict', message: 'Job was claimed by another worker' };
    }
  } else {
    await diskWriteJob({ ...job, status: 'running', updatedAt: ts });
  }

  // ── 3. Route ─────────────────────────────────────────────────────────────
  const { providerId, fallbackChain } = await routeJob(job, db);

  // ── 4. Dispatch with fallback chain ──────────────────────────────────────
  let result = null;
  let lastErr = null;
  for (const pid of [providerId, ...fallbackChain]) {
    try {
      result = await dispatch(pid, job);
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`[worker] ${jobId} provider=${pid} failed: ${redact(err.message)}`);
    }
  }

  // ── 5. Handle failure ─────────────────────────────────────────────────────
  if (!result) {
    const reason = redact(lastErr?.message ?? 'All providers failed');
    if (db) {
      await db.generationJob.update({
        where: { id: jobId },
        data: { status: 'failed', failureReason: reason, updatedAt: new Date() },
      }).catch(() => {});
    } else {
      const fresh = await diskReadJob(jobId);
      if (fresh) await diskWriteJob({ ...fresh, status: 'failed', failureReason: reason, updatedAt: new Date().toISOString() });
    }
    throw new Error(reason);
  }

  // ── 6. Save artifact ──────────────────────────────────────────────────────
  const artifactData = {
    id: artifactId(),
    organizationId: job.organizationId ?? 'unknown',
    jobId: job.id,
    type: result.type === 'video' ? 'video' : result.type === 'text' ? 'other' : 'image',
    url: result.url ?? null,
    storagePath: null,
    isFinal: true,
    createdAt: new Date().toISOString(),
    ...(result.content ? { metadata: { content: result.content } } : {}),
  };

  if (db) {
    try {
      await db.artifact.create({
        data: {
          id: artifactData.id,
          organizationId: artifactData.organizationId,
          jobId: job.id,
          type: result.type === 'video' ? 'video' : result.type === 'text' ? 'other' : 'image',
          url: result.url ?? null,
          isFinal: true,
          metadata: result.content ? { content: result.content } : undefined,
        },
      });
    } catch (err) {
      console.warn('[worker] artifact save failed:', err.message);
    }
  } else {
    await diskWriteArtifact(artifactData);
  }

  // ── 7. Mark succeeded ────────────────────────────────────────────────────
  if (db) {
    await db.generationJob.update({
      where: { id: jobId },
      data: { status: 'succeeded', updatedAt: new Date() },
    }).catch(() => {});
  } else {
    const fresh = await diskReadJob(jobId);
    if (fresh) await diskWriteJob({ ...fresh, status: 'succeeded', updatedAt: new Date().toISOString() });
  }

  return { id: jobId, status: 'succeeded', artifactUrl: result.url ?? null };
}

/**
 * Cron cycle: find the oldest queued job across all orgs and run it.
 * Returns null if no jobs are queued.
 */
export async function pickAndRun(db) {
  if (db) {
    const next = await db.generationJob.findFirst({
      where: { status: 'queued' },
      orderBy: { createdAt: 'asc' },
    });
    if (!next) return null;
    return executeJob(next.id, db);
  }

  // Disk mode: scan JOBS_DIR
  try {
    const files = await fs.readdir(JOBS_DIR).catch(() => []);
    const jobs = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(join(JOBS_DIR, f), 'utf-8');
        const j = JSON.parse(raw);
        if (j.status === 'queued') jobs.push(j);
      } catch { /* skip */ }
    }
    if (!jobs.length) return null;
    jobs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return executeJob(jobs[0].id, null);
  } catch { return null; }
}
