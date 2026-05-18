import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { now } from '@/packages/shared/src/types/core.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const STORYBOARDS_DIR = join(STORAGE_ROOT, 'db', 'storyboards');

async function readStoryboard(id) {
  try {
    const raw = await fs.readFile(join(STORYBOARDS_DIR, `${id}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeStoryboard(storyboard) {
  await fs.mkdir(STORYBOARDS_DIR, { recursive: true });
  await fs.writeFile(
    join(STORYBOARDS_DIR, `${storyboard.id}.json`),
    JSON.stringify(storyboard, null, 2)
  );
  return storyboard;
}

async function deleteStoryboard(id) {
  try {
    await fs.unlink(join(STORYBOARDS_DIR, `${id}.json`));
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

/**
 * GET /api/v1/storyboards/:id
 * Returns a single storyboard.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const storyboard = await readStoryboard(id);
  if (!storyboard) {
    return NextResponse.json({ error: 'not_found', message: `Storyboard ${id} not found` }, { status: 404 });
  }
  return NextResponse.json(storyboard);
}

/**
 * PUT /api/v1/storyboards/:id
 * Updates (merges) a storyboard.
 */
export async function PUT(request, { params }) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const existing = await readStoryboard(id);
  if (!existing) {
    return NextResponse.json({ error: 'not_found', message: `Storyboard ${id} not found` }, { status: 404 });
  }

  // Deep merge: protect id, ownerUserId, createdAt
  const updated = {
    ...existing,
    ...body,
    id: existing.id,
    ownerUserId: existing.ownerUserId,
    createdAt: existing.createdAt,
    updatedAt: now(),
  };

  try {
    await writeStoryboard(updated);
  } catch (err) {
    console.error('[storyboards PUT] save error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to update storyboard' }, { status: 500 });
  }

  return NextResponse.json(updated);
}

/**
 * DELETE /api/v1/storyboards/:id
 * Deletes a storyboard.
 */
export async function DELETE(request, { params }) {
  const { id } = await params;
  const existed = await deleteStoryboard(id);
  if (!existed) {
    return NextResponse.json({ error: 'not_found', message: `Storyboard ${id} not found` }, { status: 404 });
  }
  return NextResponse.json({ deleted: true, id });
}
