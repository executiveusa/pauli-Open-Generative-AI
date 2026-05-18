import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { makeStoryboard, validateStoryboard } from '@/packages/shared/src/schemas/cynthia.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const STORYBOARDS_DIR = join(STORAGE_ROOT, 'db', 'storyboards');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listStoryboards() {
  await ensureDir(STORYBOARDS_DIR);
  let files;
  try {
    files = await fs.readdir(STORYBOARDS_DIR);
  } catch {
    return [];
  }
  const results = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(join(STORYBOARDS_DIR, file), 'utf8');
      results.push(JSON.parse(raw));
    } catch {
      // skip corrupt files
    }
  }
  return results;
}

async function saveStoryboard(storyboard) {
  await ensureDir(STORYBOARDS_DIR);
  const path = join(STORYBOARDS_DIR, `${storyboard.id}.json`);
  await fs.writeFile(path, JSON.stringify(storyboard, null, 2));
  return storyboard;
}

/**
 * GET /api/v1/storyboards
 * Returns list of all storyboards.
 */
export async function GET() {
  try {
    const items = await listStoryboards();
    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    console.error('[storyboards GET]', err);
    return NextResponse.json({ error: 'storage_error', message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/storyboards
 * Creates a new storyboard.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  // Build storyboard
  let storyboard;
  try {
    storyboard = makeStoryboard({
      ...body,
      ownerUserId: body.ownerUserId ?? 'local-user',
    });
  } catch (err) {
    return NextResponse.json({ error: 'schema_error', message: err.message }, { status: 400 });
  }

  // Validate storyboard
  const validation = validateStoryboard(storyboard);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Invalid storyboard', errors: validation.errors },
      { status: 400 }
    );
  }

  // Basic validation
  if (!storyboard.title) {
    return NextResponse.json(
      { error: 'validation_error', message: 'title is required', errors: ['missing title'] },
      { status: 400 }
    );
  }

  try {
    await saveStoryboard(storyboard);
  } catch (err) {
    console.error('[storyboards POST] save error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to save storyboard' }, { status: 500 });
  }

  return NextResponse.json(storyboard, { status: 201 });
}
