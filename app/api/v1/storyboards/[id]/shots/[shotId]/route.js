import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { now } from '@/packages/shared/src/types/core.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const SHOTS_DIR = join(STORAGE_ROOT, 'db', 'shots');

async function readShot(shotId) {
  try {
    const raw = await fs.readFile(join(SHOTS_DIR, `${shotId}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeShot(shot) {
  await fs.mkdir(SHOTS_DIR, { recursive: true });
  await fs.writeFile(
    join(SHOTS_DIR, `${shot.id}.json`),
    JSON.stringify(shot, null, 2)
  );
  return shot;
}

async function deleteShot(shotId) {
  try {
    await fs.unlink(join(SHOTS_DIR, `${shotId}.json`));
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

/**
 * GET /api/v1/storyboards/:id/shots/:shotId
 * Returns a single shot.
 */
export async function GET(request, { params }) {
  const { id: storyboardId, shotId } = await params;
  const shot = await readShot(shotId);
  if (!shot) {
    return NextResponse.json({ error: 'not_found', message: `Shot ${shotId} not found` }, { status: 404 });
  }
  if (shot.storyboardId !== storyboardId) {
    return NextResponse.json({ error: 'not_found', message: `Shot ${shotId} not found in storyboard ${storyboardId}` }, { status: 404 });
  }
  return NextResponse.json(shot);
}

/**
 * PUT /api/v1/storyboards/:id/shots/:shotId
 * Updates (merges) a shot.
 */
export async function PUT(request, { params }) {
  const { id: storyboardId, shotId } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const existing = await readShot(shotId);
  if (!existing) {
    return NextResponse.json({ error: 'not_found', message: `Shot ${shotId} not found` }, { status: 404 });
  }
  if (existing.storyboardId !== storyboardId) {
    return NextResponse.json({ error: 'not_found', message: `Shot ${shotId} not found in storyboard ${storyboardId}` }, { status: 404 });
  }

  // Deep merge: protect id, storyboardId, createdAt
  const updated = {
    ...existing,
    ...body,
    id: existing.id,
    storyboardId: existing.storyboardId,
    createdAt: existing.createdAt,
    updatedAt: now(),
    continuityLocks: { ...existing.continuityLocks, ...(body.continuityLocks ?? {}) },
  };

  try {
    await writeShot(updated);
  } catch (err) {
    console.error('[shots PUT] save error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to update shot' }, { status: 500 });
  }

  return NextResponse.json(updated);
}

/**
 * DELETE /api/v1/storyboards/:id/shots/:shotId
 * Deletes a shot.
 */
export async function DELETE(request, { params }) {
  const { id: storyboardId, shotId } = await params;
  const existing = await readShot(shotId);
  if (!existing) {
    return NextResponse.json({ error: 'not_found', message: `Shot ${shotId} not found` }, { status: 404 });
  }
  if (existing.storyboardId !== storyboardId) {
    return NextResponse.json({ error: 'not_found', message: `Shot ${shotId} not found in storyboard ${storyboardId}` }, { status: 404 });
  }

  const deleted = await deleteShot(shotId);
  if (!deleted) {
    return NextResponse.json({ error: 'not_found', message: `Shot ${shotId} not found` }, { status: 404 });
  }
  return NextResponse.json({ deleted: true, id: shotId });
}
