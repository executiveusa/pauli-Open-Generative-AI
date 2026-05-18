/**
 * app/api/v1/jobs/[id]/cancel/route.js
 * POST /api/v1/jobs/:id/cancel — cancel a queued or running job.
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'apps/api/storage/db/jobs');

async function readJob(id) {
  try {
    const raw = await fs.readFile(path.join(DB_DIR, `${id}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJob(job) {
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(path.join(DB_DIR, `${job.id}.json`), JSON.stringify(job, null, 2), 'utf-8');
  return job;
}

const TERMINAL = new Set(['succeeded', 'failed', 'cancelled', 'blocked_by_rights', 'blocked_by_safety']);

export async function POST(request, { params }) {
  const { id } = await params;

  const job = await readJob(id);
  if (!job) {
    return NextResponse.json({ error: 'not_found', message: `Job ${id} not found` }, { status: 404 });
  }

  if (TERMINAL.has(job.status)) {
    return NextResponse.json(
      { error: 'already_terminal', message: `Job is already in terminal state: ${job.status}` },
      { status: 409 }
    );
  }

  const updated = { ...job, status: 'cancelled', cancelledAt: new Date().toISOString() };
  await writeJob(updated);

  return NextResponse.json(updated);
}
