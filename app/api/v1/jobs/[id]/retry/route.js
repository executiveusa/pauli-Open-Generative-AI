/**
 * app/api/v1/jobs/[id]/retry/route.js
 * POST: retry a failed job by creating a new job with same parameters
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const JOBS_DIR = path.join(process.cwd(), 'apps/api/storage/db/jobs');

function newId(prefix = 'job') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowTs() {
  return new Date().toISOString();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJob(id) {
  const filePath = path.join(JOBS_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveJob(job) {
  await ensureDir(JOBS_DIR);
  const filePath = path.join(JOBS_DIR, `${job.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(job, null, 2), 'utf-8');
  return job;
}

export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const original = await readJob(id);
    if (!original) {
      return NextResponse.json(
        { error: { message: `Job ${id} not found`, code: 'not_found' } },
        { status: 404 }
      );
    }

    const ts = nowTs();
    const retryJob = {
      id: newId('job'),
      type: original.type,
      status: 'queued',
      projectId: original.projectId ?? null,
      storyboardId: original.storyboardId ?? null,
      shotId: original.shotId ?? null,
      characterPassportId: original.characterPassportId ?? null,
      modelRoute: original.modelRoute ?? null,
      routingMode: original.routingMode ?? 'auto',
      inputPrompt: original.inputPrompt ?? null,
      inputNegativePrompt: original.inputNegativePrompt ?? null,
      inputSpanishPrompt: original.inputSpanishPrompt ?? null,
      inputSpanishNegativePrompt: original.inputSpanishNegativePrompt ?? null,
      parameters: original.parameters ?? {},
      progress: 0,
      stage: 'queued',
      message: `Retry of job ${id}`,
      artifacts: [],
      error: null,
      retriedFromJobId: id,
      statusHistory: [{ status: 'queued', at: ts, message: `Retry of job ${id}` }],
      createdAt: ts,
      updatedAt: ts,
    };

    await saveJob(retryJob);

    return NextResponse.json(retryJob, { status: 202 });
  } catch (err) {
    console.error('[job retry POST]', err.message);
    return NextResponse.json(
      { error: { message: 'Failed to retry job', code: 'internal_error' } },
      { status: 500 }
    );
  }
}
