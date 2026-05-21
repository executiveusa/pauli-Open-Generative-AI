import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { makeGenerationJob, validateGenerationJob } from '@/packages/shared/src/schemas/cynthia.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const JOBS_DIR = join(STORAGE_ROOT, 'db', 'jobs');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function saveJob(job) {
  await ensureDir(JOBS_DIR);
  const path = join(JOBS_DIR, `${job.id}.json`);
  await fs.writeFile(path, JSON.stringify(job, null, 2));
  return job;
}

/**
 * POST /api/v1/generate
 * Starts a generation job.
 * Body: { type, characterPassportId, prompts, routingMode, parameters }
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const { type, characterPassportId, prompts, routingMode, parameters } = body;

  // Validate required fields
  if (!type) {
    return NextResponse.json(
      { error: 'validation_error', message: 'type is required', errors: ['missing type'] },
      { status: 400 }
    );
  }

  if (!characterPassportId) {
    return NextResponse.json(
      { error: 'validation_error', message: 'characterPassportId is required', errors: ['missing characterPassportId'] },
      { status: 400 }
    );
  }

  // Build generation job
  let job;
  try {
    job = makeGenerationJob({
      jobType: type,
      characterPassportId,
      inputPrompt: prompts?.englishPrompt ?? '',
      inputNegativePrompt: prompts?.negativePrompt ?? '',
      inputSpanishPrompt: prompts?.spanishPrompt ?? '',
      inputSpanishNegativePrompt: prompts?.negativePromptEs ?? '',
      modelRoute: {
        routingMode: routingMode ?? 'auto-best',
      },
      parameters: parameters ?? {},
      status: 'queued',
      ownerUserId: body.ownerUserId ?? 'local-user',
    });
  } catch (err) {
    return NextResponse.json({ error: 'schema_error', message: err.message }, { status: 400 });
  }

  // Validate job
  const validation = validateGenerationJob(job);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Invalid generation job', errors: validation.errors },
      { status: 400 }
    );
  }

  try {
    await saveJob(job);
  } catch (err) {
    console.error('[generate POST] save error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to save generation job' }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: job.id,
      status: job.status,
      characterPassportId: job.characterPassportId,
      jobType: job.jobType,
      createdAt: job.createdAt,
      message: 'Generation job queued',
    },
    { status: 201 }
  );
}
