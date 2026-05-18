/**
 * app/api/v1/jobs/[id]/route.js
 * Next.js App Router API route for a single job.
 * GET: read job
 * PATCH: update job status
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'apps/api/storage/db/jobs');

async function readJob(id) {
  const filePath = path.join(DB_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJob(job) {
  await fs.mkdir(DB_DIR, { recursive: true });
  const filePath = path.join(DB_DIR, `${job.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(job, null, 2), 'utf-8');
  return job;
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const job = await readJob(id);
    if (!job) {
      return NextResponse.json({ error: { message: `Job ${id} not found`, code: 'not_found' } }, { status: 404 });
    }
    return NextResponse.json(job, { status: 200 });
  } catch (err) {
    console.error('[job GET]', err.message);
    return NextResponse.json({ error: { message: 'Failed to read job', code: 'internal_error' } }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: { message: 'Invalid JSON body', code: 'invalid_body' } }, { status: 400 });
    }

    const job = await readJob(id);
    if (!job) {
      return NextResponse.json({ error: { message: `Job ${id} not found`, code: 'not_found' } }, { status: 404 });
    }

    if (!body.status) {
      return NextResponse.json({ error: { message: 'status field is required', code: 'validation_error' } }, { status: 400 });
    }

    const ALLOWED_STATUSES = [
      'draft', 'queued', 'running', 'succeeded', 'failed', 'cancelled',
      'needs_key', 'blocked_by_rights', 'blocked_by_safety',
      'created', 'waiting_for_provider', 'stitching',
    ];

    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: { message: `Invalid status '${body.status}'`, code: 'validation_error' } },
        { status: 400 }
      );
    }

    const ts = new Date().toISOString();
    const updated = {
      ...job,
      status: body.status,
      updatedAt: ts,
      statusHistory: [
        ...(job.statusHistory ?? []),
        { status: body.status, at: ts, message: body.message ?? null },
      ],
    };

    if (body.progress != null) updated.progress = body.progress;
    if (body.stage != null) updated.stage = body.stage;
    if (body.message != null) updated.message = body.message;
    if (body.error != null) updated.error = body.error;

    await writeJob(updated);
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error('[job PATCH]', err.message);
    return NextResponse.json({ error: { message: 'Failed to update job', code: 'internal_error' } }, { status: 500 });
  }
}
