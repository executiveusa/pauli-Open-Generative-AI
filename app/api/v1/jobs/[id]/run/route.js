/**
 * POST /api/v1/jobs/:id/run
 * Manually trigger execution of a queued job.
 * Requires admin or operator role.
 */

import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/tenant/context.js';
import { executeJob } from '@/lib/jobs/worker.js';

async function handlePost(request, ctx, { id }) {
  if (!id) {
    return NextResponse.json({ error: 'job id is required' }, { status: 400 });
  }

  if (!['admin', 'operator', 'owner'].includes(ctx.role)) {
    return NextResponse.json({ error: 'insufficient_role', message: 'admin or operator role required' }, { status: 403 });
  }

  let db = null;
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    const { prisma } = await import('@/lib/db/client.js');
    db = prisma;
  }

  try {
    const result = await executeJob(id, db);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'execution_failed', message: err.message },
      { status: 500 }
    );
  }
}

export const POST = withTenantContext(handlePost);
