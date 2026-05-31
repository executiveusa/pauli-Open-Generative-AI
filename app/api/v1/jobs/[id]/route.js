/**
 * app/api/v1/jobs/[id]/route.js
 * GET   /api/v1/jobs/:id — read a single job (tenant-scoped)
 * PATCH /api/v1/jobs/:id — update job status (operator/admin only)
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { withTenantContext } from '@/lib/tenant/context.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage');
const JOBS_DIR = join(STORAGE_ROOT, 'db', 'jobs');

const ALLOWED_STATUSES = [
  'draft', 'queued', 'running', 'succeeded', 'failed', 'cancelled',
  'needs_key', 'blocked_by_rights', 'blocked_by_safety', 'stitching',
];

async function getPrisma() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    const { prisma } = await import('@/lib/db/client.js');
    return prisma;
  }
  return null;
}

async function getJobFromDisk(id) {
  try {
    const raw = await fs.readFile(join(JOBS_DIR, `${id}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch { return null; }
}

async function writeJobToDisk(job) {
  await fs.mkdir(JOBS_DIR, { recursive: true });
  await fs.writeFile(join(JOBS_DIR, `${job.id}.json`), JSON.stringify(job, null, 2));
}

// ─── GET ──────────────────────────────────────────────────────────────────

async function handleGet(_request, ctx, { id }) {
  const db = await getPrisma();

  if (db) {
    const job = await db.generationJob.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: { artifacts: { select: { id: true, type: true, url: true, isFinal: true, createdAt: true } } },
    });
    if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(job);
  }

  const job = await getJobFromDisk(id);
  if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  // Tenant scope check for disk mode
  if (job.organizationId && job.organizationId !== ctx.organizationId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json(job);
}

// ─── PATCH ────────────────────────────────────────────────────────────────

async function handlePatch(request, ctx, { id }) {

  if (!['admin', 'operator', 'owner'].includes(ctx.role)) {
    return NextResponse.json({ error: 'insufficient_role' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  if (!body.status || !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: 'validation_error', message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const db = await getPrisma();
  const ts = new Date();

  if (db) {
    const job = await db.generationJob.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const updated = await db.generationJob.update({
      where: { id },
      data: { status: body.status, updatedAt: ts, ...(body.failureReason ? { failureReason: body.failureReason } : {}) },
    });
    return NextResponse.json(updated);
  }

  const job = await getJobFromDisk(id);
  if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (job.organizationId && job.organizationId !== ctx.organizationId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const isoTs = ts.toISOString();
  const updated = {
    ...job,
    status: body.status,
    updatedAt: isoTs,
    statusHistory: [...(job.statusHistory ?? []), { status: body.status, at: isoTs }],
  };
  if (body.failureReason) updated.failureReason = body.failureReason;
  await writeJobToDisk(updated);
  return NextResponse.json(updated);
}

export const GET   = withTenantContext(handleGet);
export const PATCH = withTenantContext(handlePatch);
