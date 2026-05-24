/**
 * app/api/v1/jobs/route.js
 * GET  /api/v1/jobs — list jobs for the authenticated tenant
 * POST /api/v1/jobs — create a job (prefer /api/v1/generate for generation jobs)
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { withTenantContext } from '@/lib/tenant/context.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage');
const JOBS_DIR = join(STORAGE_ROOT, 'db', 'jobs');

const FORBIDDEN_BODY_FIELDS = ['byokKey', 'apiKey', 'providerKey', 'secretKey'];

function newId(prefix = 'job') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function getPrisma() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    const { prisma } = await import('@/lib/db/client.js');
    return prisma;
  }
  return null;
}

async function listJobsDisk(organizationId, filters) {
  await fs.mkdir(JOBS_DIR, { recursive: true }).catch(() => {});
  const files = await fs.readdir(JOBS_DIR).catch(() => []);
  const jobs = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(join(JOBS_DIR, f), 'utf-8');
      const j = JSON.parse(raw);
      // Tenant scope: only return jobs belonging to this org
      if (j.organizationId && j.organizationId !== organizationId) continue;
      if (filters.status && j.status !== filters.status) continue;
      if (filters.type && j.type !== filters.type) continue;
      jobs.push(j);
    } catch { /* skip corrupt */ }
  }
  return jobs;
}

// ─── GET ──────────────────────────────────────────────────────────────────

async function handleGet(request, ctx) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const typeFilter   = searchParams.get('type');
  const limit        = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

  const db = await getPrisma();

  if (db) {
    const where = {
      organizationId: ctx.organizationId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(typeFilter   ? { jobType: typeFilter }  : {}),
    };
    const [total, jobs] = await Promise.all([
      db.generationJob.count({ where }),
      db.generationJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true, jobType: true, status: true,
          inputPrompt: true, createdAt: true, updatedAt: true,
          failureReason: true, organizationId: true,
        },
      }),
    ]);
    return NextResponse.json({ jobs, total }, { status: 200 });
  }

  // Dev disk fallback — scoped to org
  let jobs = await listJobsDisk(ctx.organizationId, { status: statusFilter, type: typeFilter });
  jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = jobs.length;
  jobs = jobs.slice(0, limit);
  return NextResponse.json({ jobs, total }, { status: 200 });
}

// ─── POST ─────────────────────────────────────────────────────────────────

async function handlePost(request, ctx) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: { message: 'Invalid JSON body', code: 'invalid_body' } }, { status: 400 }); }

  for (const field of FORBIDDEN_BODY_FIELDS) {
    if (body[field] !== undefined) {
      return NextResponse.json(
        { error: { message: `Field '${field}' is not allowed. Configure API keys via /api/v1/keys.`, code: 'forbidden_field' } },
        { status: 400 }
      );
    }
  }

  if (!body.type) {
    return NextResponse.json({ error: { message: 'type is required', code: 'validation_error' } }, { status: 400 });
  }

  const ts = new Date().toISOString();
  const db = await getPrisma();

  if (db) {
    const job = await db.generationJob.create({
      data: {
        organizationId: ctx.organizationId,
        workspaceId:    ctx.workspaceId ?? null,
        createdByUserId: ctx.userId,
        jobType: body.type.replace(/-/g, '_'),
        status: 'queued',
        inputPrompt: body.inputPrompt ?? '',
        inputNegativePrompt: body.inputNegativePrompt ?? '',
        inputSpanishPrompt: body.inputSpanishPrompt ?? '',
        routingMode: (body.routingMode ?? 'auto_best').replace(/-/g, '_'),
        parameters: body.parameters ?? undefined,
        projectId: body.projectId ?? null,
        shotId: body.shotId ?? null,
        characterPassportId: body.characterPassportId ?? null,
      },
    });
    return NextResponse.json(job, { status: 202 });
  }

  // Disk fallback
  const job = {
    id: newId('job'),
    organizationId: ctx.organizationId,
    type: body.type,
    status: 'queued',
    projectId: body.projectId ?? null,
    shotId: body.shotId ?? null,
    characterPassportId: body.characterPassportId ?? null,
    routingMode: body.routingMode ?? 'auto',
    inputPrompt: body.inputPrompt ?? null,
    inputNegativePrompt: body.inputNegativePrompt ?? null,
    inputSpanishPrompt: body.inputSpanishPrompt ?? null,
    parameters: body.parameters ?? {},
    artifacts: [],
    statusHistory: [{ status: 'queued', at: ts }],
    createdAt: ts,
    updatedAt: ts,
  };

  await fs.mkdir(JOBS_DIR, { recursive: true });
  await fs.writeFile(join(JOBS_DIR, `${job.id}.json`), JSON.stringify(job, null, 2));
  return NextResponse.json(job, { status: 202 });
}

export const GET  = withTenantContext(handleGet);
export const POST = withTenantContext(handlePost);
