/**
 * app/api/v1/jobs/route.js
 * Next.js App Router API route for Cynthia jobs.
 * GET: list jobs
 * POST: create job
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'apps/api/storage/db/jobs');

const ALLOWED_STATUSES = [
  'draft', 'queued', 'running', 'succeeded', 'failed', 'cancelled',
  'needs_key', 'blocked_by_rights', 'blocked_by_safety',
  // legacy statuses from core.js
  'created', 'waiting_for_provider', 'stitching',
];

const FORBIDDEN_BODY_FIELDS = ['byokKey', 'apiKey', 'providerKey', 'secretKey'];

function newId(prefix = 'job') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowTs() {
  return new Date().toISOString();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readAllJobs() {
  await ensureDir(DB_DIR);
  let files;
  try {
    files = await fs.readdir(DB_DIR);
  } catch {
    return [];
  }
  const jobs = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(path.join(DB_DIR, file), 'utf-8');
      jobs.push(JSON.parse(raw));
    } catch {
      // skip corrupt files
    }
  }
  return jobs;
}

async function saveJob(job) {
  await ensureDir(DB_DIR);
  const filePath = path.join(DB_DIR, `${job.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(job, null, 2), 'utf-8');
  return job;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const typeFilter = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

    let jobs = await readAllJobs();

    if (statusFilter) {
      jobs = jobs.filter(j => j.status === statusFilter);
    }
    if (typeFilter) {
      jobs = jobs.filter(j => j.type === typeFilter);
    }

    // Sort newest first
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = jobs.length;
    jobs = jobs.slice(0, limit);

    return NextResponse.json({ jobs, total }, { status: 200 });
  } catch (err) {
    console.error('[jobs GET]', err.message);
    return NextResponse.json({ error: { message: 'Failed to list jobs', code: 'internal_error' } }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: { message: 'Invalid JSON body', code: 'invalid_body' } }, { status: 400 });
    }

    // Security: reject if body contains any key-like fields
    for (const field of FORBIDDEN_BODY_FIELDS) {
      if (body[field] !== undefined) {
        return NextResponse.json(
          { error: { message: `Field '${field}' is not allowed in job creation. API keys must be configured via /api/v1/keys.`, code: 'forbidden_field' } },
          { status: 400 }
        );
      }
    }

    if (!body.type) {
      return NextResponse.json({ error: { message: 'type is required', code: 'validation_error' } }, { status: 400 });
    }

    const ts = nowTs();
    const job = {
      id: newId('job'),
      type: body.type,
      status: 'queued',
      projectId: body.projectId ?? null,
      storyboardId: body.storyboardId ?? null,
      shotId: body.shotId ?? null,
      characterPassportId: body.characterPassportId ?? null,
      modelRoute: body.modelRoute ?? null,
      routingMode: body.routingMode ?? 'auto',
      inputPrompt: body.inputPrompt ?? null,
      inputNegativePrompt: body.inputNegativePrompt ?? null,
      inputSpanishPrompt: body.inputSpanishPrompt ?? null,
      inputSpanishNegativePrompt: body.inputSpanishNegativePrompt ?? null,
      parameters: body.parameters ?? {},
      progress: 0,
      stage: 'queued',
      message: 'Job created and queued',
      artifacts: [],
      error: null,
      statusHistory: [{ status: 'queued', at: ts, message: 'Job created and queued' }],
      createdAt: ts,
      updatedAt: ts,
    };

    await saveJob(job);

    return NextResponse.json(job, { status: 202 });
  } catch (err) {
    console.error('[jobs POST]', err.message);
    return NextResponse.json({ error: { message: 'Failed to create job', code: 'internal_error' } }, { status: 500 });
  }
}
