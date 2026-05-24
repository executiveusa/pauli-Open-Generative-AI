/**
 * POST /api/v1/worker
 * Cron-style endpoint: picks the oldest queued job and executes it.
 *
 * Authorization: Bearer <WORKER_SECRET>
 * Intended for Vercel Cron, GitHub Actions schedules, or external schedulers.
 *
 * To wire Vercel Cron, add to vercel.json:
 *   { "crons": [{ "path": "/api/v1/worker", "schedule": "* * * * *" }] }
 * and set WORKER_SECRET in environment variables.
 */

import { NextResponse } from 'next/server';

function verifyWorkerAuth(request) {
  const secret = process.env.WORKER_SECRET;
  if (!secret) {
    // If no secret configured, allow in dev only
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return true;
  }
  const auth = request.headers.get('authorization') ?? '';
  return auth === `Bearer ${secret}`;
}

export async function POST(request) {
  if (!verifyWorkerAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let db = null;
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    try {
      const { prisma } = await import('@/lib/db/client.js');
      db = prisma;
    } catch { /* fall to disk mode */ }
  }

  try {
    const { pickAndRun } = await import('@/lib/jobs/worker.js');
    const result = await pickAndRun(db);

    if (!result) {
      return NextResponse.json({ message: 'No queued jobs', processed: 0 }, { status: 200 });
    }

    return NextResponse.json({ message: 'Job processed', processed: 1, job: result }, { status: 200 });
  } catch (err) {
    console.error('[worker] cycle error:', err.message);
    return NextResponse.json(
      { error: 'worker_error', message: err.message },
      { status: 500 }
    );
  }
}

// Vercel Cron also sends GET for health checks
export async function GET(request) {
  if (!verifyWorkerAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ status: 'ok', worker: 'cynthia-job-runner' });
}
