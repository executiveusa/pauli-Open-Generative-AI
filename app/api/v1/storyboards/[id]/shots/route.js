import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { makeShot, validateShot } from '@/packages/shared/src/schemas/cynthia.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const SHOTS_DIR = join(STORAGE_ROOT, 'db', 'shots');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listShotsForStoryboard(storyboardId) {
  await ensureDir(SHOTS_DIR);
  let files;
  try {
    files = await fs.readdir(SHOTS_DIR);
  } catch {
    return [];
  }
  const results = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(join(SHOTS_DIR, file), 'utf8');
      const shot = JSON.parse(raw);
      if (shot.storyboardId === storyboardId) {
        results.push(shot);
      }
    } catch {
      // skip corrupt files
    }
  }
  // Sort by order
  results.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return results;
}

async function saveShot(shot) {
  await ensureDir(SHOTS_DIR);
  const path = join(SHOTS_DIR, `${shot.id}.json`);
  await fs.writeFile(path, JSON.stringify(shot, null, 2));
  return shot;
}

/**
 * GET /api/v1/storyboards/:id/shots
 * Returns list of shots for a storyboard.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const items = await listShotsForStoryboard(id);
    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    console.error('[shots GET]', err);
    return NextResponse.json({ error: 'storage_error', message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/storyboards/:id/shots
 * Creates a new shot in the storyboard.
 */
export async function POST(request, { params }) {
  const { id: storyboardId } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  // Build shot
  let shot;
  try {
    shot = makeShot({
      ...body,
      storyboardId,
    });
  } catch (err) {
    return NextResponse.json({ error: 'schema_error', message: err.message }, { status: 400 });
  }

  // Validate shot
  const validation = validateShot(shot);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Invalid shot', errors: validation.errors },
      { status: 400 }
    );
  }

  try {
    await saveShot(shot);
  } catch (err) {
    console.error('[shots POST] save error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to save shot' }, { status: 500 });
  }

  return NextResponse.json(shot, { status: 201 });
}
