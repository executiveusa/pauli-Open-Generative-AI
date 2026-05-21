import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { now } from '@/packages/shared/src/types/core.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const CHARS_DIR = join(STORAGE_ROOT, 'db', 'characters');

async function readCharacter(id) {
  try {
    const raw = await fs.readFile(join(CHARS_DIR, `${id}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeCharacter(character) {
  await fs.mkdir(CHARS_DIR, { recursive: true });
  await fs.writeFile(
    join(CHARS_DIR, `${character.id}.json`),
    JSON.stringify(character, null, 2)
  );
  return character;
}

async function deleteCharacter(id) {
  try {
    await fs.unlink(join(CHARS_DIR, `${id}.json`));
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

/**
 * GET /api/v1/characters/:id
 * Returns a single character passport.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const character = await readCharacter(id);
  if (!character) {
    return NextResponse.json({ error: 'not_found', message: `Character ${id} not found` }, { status: 404 });
  }
  return NextResponse.json(character);
}

/**
 * PUT /api/v1/characters/:id
 * Updates (merges) a character passport.
 */
export async function PUT(request, { params }) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const existing = await readCharacter(id);
  if (!existing) {
    return NextResponse.json({ error: 'not_found', message: `Character ${id} not found` }, { status: 404 });
  }

  // Deep merge top-level fields; protect id, ownerUserId, createdAt
  const updated = {
    ...existing,
    ...body,
    id: existing.id,
    ownerUserId: existing.ownerUserId,
    createdAt: existing.createdAt,
    updatedAt: now(),
    // Merge nested objects
    voiceProfile: { ...existing.voiceProfile, ...(body.voiceProfile ?? {}) },
    continuityLocks: { ...existing.continuityLocks, ...(body.continuityLocks ?? {}) },
    rights: { ...existing.rights, ...(body.rights ?? {}) },
  };

  try {
    await writeCharacter(updated);
  } catch (err) {
    console.error('[characters PUT] save error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to update character' }, { status: 500 });
  }

  return NextResponse.json(updated);
}

/**
 * DELETE /api/v1/characters/:id
 * Deletes a character passport.
 */
export async function DELETE(request, { params }) {
  const { id } = await params;
  const existed = await deleteCharacter(id);
  if (!existed) {
    return NextResponse.json({ error: 'not_found', message: `Character ${id} not found` }, { status: 404 });
  }
  return NextResponse.json({ deleted: true, id });
}
