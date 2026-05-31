/**
 * POST /api/v1/jobs/:id/retry — re-queue a failed job (tenant-scoped).
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { withTenantContext } from '@/lib/tenant/context.js';

const JOBS_DIR = join(
  process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage'),
  'db', 'jobs'
);

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

async function handlePost(_request, ctx, { id }) {
  const db = await getPrisma();

  if (db) {
    const original = await db.generationJob.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!original) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (!['failed', 'cancelled'].includes(original.status)) {
      return NextResponse.json({ error: 'not_retryable', message: `Job status is '${original.status}'. Only failed or cancelled jobs can be retried.` }, { status: 409 });
    }
    const retry = await db.generationJob.create({
      data: {
        organizationId: original.organizationId,
        workspaceId: original.workspaceId,
        projectId: original.projectId,
        shotId: original.shotId,
        characterPassportId: original.characterPassportId,
        createdByUserId: ctx.userId,
        jobType: original.jobType,
        status: 'queued',
        inputPrompt: original.inputPrompt,
        inputNegativePrompt: original.inputNegativePrompt,
        inputSpanishPrompt: original.inputSpanishPrompt,
        routingMode: original.routingMode,
        parameters: original.parameters ?? undefined,
      },
    });
    return NextResponse.json(retry, { status: 202 });
  }

  // Disk mode
  try {
    const raw = await fs.readFile(join(JOBS_DIR, `${id}.json`), 'utf-8');
    const original = JSON.parse(raw);
    if (original.organizationId && original.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    const ts = new Date().toISOString();
    const retry = {
      ...original,
      id: newId('job'),
      status: 'queued',
      retriedFromJobId: id,
      createdByUserId: ctx.userId,
      artifacts: [],
      statusHistory: [{ status: 'queued', at: ts, message: `Retry of ${id}` }],
      createdAt: ts,
      updatedAt: ts,
    };
    await fs.mkdir(JOBS_DIR, { recursive: true });
    await fs.writeFile(join(JOBS_DIR, `${retry.id}.json`), JSON.stringify(retry, null, 2));
    return NextResponse.json(retry, { status: 202 });
  } catch {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
}

export const POST = withTenantContext(handlePost);
