/**
 * GET  /api/v1/jobs/:id/artifacts — list artifacts for a job (tenant-scoped)
 * POST /api/v1/jobs/:id/artifacts — attach an artifact to a job
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { withTenantContext } from '@/lib/tenant/context.js';

const STORAGE_ROOT  = process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage');
const JOBS_DIR      = join(STORAGE_ROOT, 'db', 'jobs');
const ARTIFACTS_DIR = join(STORAGE_ROOT, 'db', 'artifacts');

const VALID_TYPES = ['image', 'video', 'audio', 'text', 'json', 'other'];

function newId(prefix = 'artifact') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function getPrisma() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    const { prisma } = await import('@/lib/db/client.js');
    return prisma;
  }
  return null;
}

async function getJobOrgDisk(id) {
  try {
    const raw = await fs.readFile(join(JOBS_DIR, `${id}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch { return null; }
}

// ─── GET ──────────────────────────────────────────────────────────────────

async function handleGet(_request, ctx, { id }) {
  const db = await getPrisma();

  if (db) {
    const job = await db.generationJob.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const artifacts = await db.artifact.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ artifacts });
  }

  const job = await getJobOrgDisk(id);
  if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (job.organizationId && job.organizationId !== ctx.organizationId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const files = await fs.readdir(ARTIFACTS_DIR).catch(() => []);
  const artifacts = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(join(ARTIFACTS_DIR, f), 'utf-8');
      const a = JSON.parse(raw);
      if (a.jobId === id) artifacts.push(a);
    } catch { /* skip */ }
  }
  return NextResponse.json({ artifacts });
}

// ─── POST ─────────────────────────────────────────────────────────────────

async function handlePost(request, ctx, { id }) {

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_body' }, { status: 400 }); }

  const type = body.type ?? 'other';
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'invalid_type', message: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }

  const db = await getPrisma();

  if (db) {
    const job = await db.generationJob.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const artifact = await db.artifact.create({
      data: {
        organizationId: ctx.organizationId,
        jobId: id,
        type,
        url: body.url ?? null,
        storagePath: body.storagePath ?? null,
        mimeType: body.mimeType ?? null,
        isFinal: body.isFinal ?? false,
        metadata: body.metadata ?? undefined,
      },
    });
    return NextResponse.json(artifact, { status: 201 });
  }

  const job = await getJobOrgDisk(id);
  if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (job.organizationId && job.organizationId !== ctx.organizationId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const artifact = {
    id: newId('artifact'),
    organizationId: ctx.organizationId,
    jobId: id,
    type,
    url: body.url ?? null,
    storagePath: body.storagePath ?? null,
    mimeType: body.mimeType ?? null,
    isFinal: body.isFinal ?? false,
    metadata: body.metadata ?? null,
    createdAt: new Date().toISOString(),
  };
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.writeFile(join(ARTIFACTS_DIR, `${artifact.id}.json`), JSON.stringify(artifact, null, 2));
  return NextResponse.json(artifact, { status: 201 });
}

export const GET  = withTenantContext(handleGet);
export const POST = withTenantContext(handlePost);
