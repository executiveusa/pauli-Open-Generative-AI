/**
 * POST /api/v1/jobs/:id/cancel — cancel a queued or running job (tenant-scoped).
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { withTenantContext } from '@/lib/tenant/context.js';

const JOBS_DIR = join(
  process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage'),
  'db', 'jobs'
);

const TERMINAL = new Set(['succeeded', 'failed', 'cancelled', 'blocked_by_rights', 'blocked_by_safety']);

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
    const job = await db.generationJob.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (TERMINAL.has(job.status)) {
      return NextResponse.json({ error: 'already_terminal', status: job.status }, { status: 409 });
    }
    const updated = await db.generationJob.update({
      where: { id },
      data: { status: 'cancelled', updatedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  // Disk mode
  try {
    const raw = await fs.readFile(join(JOBS_DIR, `${id}.json`), 'utf-8');
    const job = JSON.parse(raw);
    if (job.organizationId && job.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (TERMINAL.has(job.status)) {
      return NextResponse.json({ error: 'already_terminal', status: job.status }, { status: 409 });
    }
    const updated = { ...job, status: 'cancelled', cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await fs.mkdir(JOBS_DIR, { recursive: true });
    await fs.writeFile(join(JOBS_DIR, `${id}.json`), JSON.stringify(updated, null, 2));
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
}

export const POST = withTenantContext(handlePost);
