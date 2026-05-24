/**
 * POST /api/v1/generate
 * Creates and queues a generation job.
 * Tenant-scoped — requires authentication.
 *
 * Body: { type, characterPassportId?, prompts, routingMode, parameters, shotId?, projectId? }
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { withTenantContext } from '@/lib/tenant/context.js';
import { makeGenerationJob, validateGenerationJob } from '@/packages/shared/src/schemas/cynthia.js';
import { NvidiaNimProxyAdapter } from '@/lib/providers/adapters/NvidiaNimProxyAdapter.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage');
const JOBS_DIR = join(STORAGE_ROOT, 'db', 'jobs');

async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }

async function saveJobToDisk(job) {
  await ensureDir(JOBS_DIR);
  await fs.writeFile(join(JOBS_DIR, `${job.id}.json`), JSON.stringify(job, null, 2));
  return job;
}

async function getPrisma() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    const { prisma } = await import('@/lib/db/client.js');
    return prisma;
  }
  return null;
}

// ─── Consent check ────────────────────────────────────────────────────────

async function checkCharacterConsent(characterPassportId, organizationId, db) {
  if (!db || !characterPassportId) return { blocked: false };

  const character = await db.characterPassport.findFirst({
    where: { id: characterPassportId, organizationId, deletedAt: null },
    select: {
      consentStatus: true,
      minorFlag: true,
      politicalLikenessFlag: true,
      commercialUseAllowed: true,
      safetyFlags: true,
    },
  });

  if (!character) return { blocked: false };

  if (character.minorFlag) {
    return { blocked: true, reason: 'Character is flagged as a minor. Generation blocked.' };
  }
  if (character.politicalLikenessFlag) {
    return { blocked: true, reason: 'Character has political likeness flag. Generation requires safety review.' };
  }
  if (character.consentStatus === 'revoked') {
    return { blocked: true, reason: 'Consent for this character has been revoked.' };
  }

  return { blocked: false };
}

// ─── Main handler ─────────────────────────────────────────────────────────

async function handlePost(request, ctx) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 }); }

  const { type, characterPassportId, prompts, routingMode, parameters, shotId, projectId } = body;

  if (!type) {
    return NextResponse.json({ error: 'validation_error', message: 'type is required' }, { status: 400 });
  }

  const db = await getPrisma();

  // Consent gate
  const consentCheck = await checkCharacterConsent(characterPassportId, ctx.organizationId, db);
  if (consentCheck.blocked) {
    return NextResponse.json(
      { error: 'blocked_by_safety', message: consentCheck.reason },
      { status: 422 }
    );
  }

  // Optionally compile/translate prompt via Free Mode (NVIDIA NIM proxy)
  let compiledPromptEn = prompts?.englishPrompt ?? '';
  let compiledPromptEs = prompts?.spanishPrompt ?? '';

  if (process.env.NVIDIA_NIM_PROXY_ENABLED === 'true' && compiledPromptEn) {
    try {
      const nim = new NvidiaNimProxyAdapter();
      const compiled = await nim.compilePrompt({
        promptEn: compiledPromptEn,
        locale: 'en',
      });
      compiledPromptEn = compiled.promptEn || compiledPromptEn;
      compiledPromptEs = compiled.promptEs || compiledPromptEs;
    } catch (err) {
      // Non-fatal — continue with original prompt
      console.warn('[generate] NIM prompt compile skipped:', err.message);
    }
  }

  // Build job
  let job;
  try {
    job = makeGenerationJob({
      jobType: type,
      characterPassportId: characterPassportId ?? null,
      inputPrompt: compiledPromptEn,
      inputNegativePrompt: prompts?.negativePrompt ?? '',
      inputSpanishPrompt: compiledPromptEs,
      modelRoute: { routingMode: routingMode ?? 'auto-best' },
      parameters: parameters ?? {},
      status: 'queued',
      ownerUserId: ctx.userId,
      organizationId: ctx.organizationId,
      workspaceId: ctx.workspaceId ?? null,
      projectId: projectId ?? null,
      shotId: shotId ?? null,
      createdByUserId: ctx.userId,
    });
  } catch (err) {
    return NextResponse.json({ error: 'schema_error', message: err.message }, { status: 400 });
  }

  const validation = validateGenerationJob(job);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Invalid generation job', errors: validation.errors },
      { status: 400 }
    );
  }

  // Persist
  if (db) {
    const jobTypeMap = {
      'hero-frame': 'hero_frame',
      'hero_frame': 'hero_frame',
      scene: 'scene',
      video: 'video',
      lipsync: 'lipsync',
      storyboard: 'storyboard',
      evaluation: 'evaluation',
      'prompt-compile': 'prompt_compile',
      'music-video': 'music_video',
      visualizer: 'visualizer',
      'mix-master': 'mix_master',
    };

    const created = await db.generationJob.create({
      data: {
        id: job.id,
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId ?? null,
        projectId: projectId ?? null,
        shotId: shotId ?? null,
        characterPassportId: characterPassportId ?? null,
        createdByUserId: ctx.userId,
        jobType: jobTypeMap[type] ?? 'scene',
        status: 'queued',
        inputPrompt: compiledPromptEn,
        inputNegativePrompt: prompts?.negativePrompt ?? '',
        inputSpanishPrompt: compiledPromptEs,
        routingMode: (routingMode ?? 'auto_best').replace(/-/g, '_'),
        parameters: parameters ?? undefined,
      },
    });

    return NextResponse.json(
      { id: created.id, status: created.status, jobType: created.jobType, createdAt: created.createdAt, message: 'Generation job queued' },
      { status: 201 }
    );
  }

  // Dev disk fallback
  await saveJobToDisk(job);
  return NextResponse.json(
    { id: job.id, status: job.status, jobType: job.jobType, createdAt: job.createdAt, message: 'Generation job queued' },
    { status: 201 }
  );
}

export const POST = withTenantContext(handlePost);
