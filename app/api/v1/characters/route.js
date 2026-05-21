import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { makeCharacterPassport } from '@/packages/shared/src/schemas/cynthia.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const CHARS_DIR = join(STORAGE_ROOT, 'db', 'characters');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listCharacters() {
  await ensureDir(CHARS_DIR);
  let files;
  try {
    files = await fs.readdir(CHARS_DIR);
  } catch {
    return [];
  }
  const results = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(join(CHARS_DIR, file), 'utf8');
      results.push(JSON.parse(raw));
    } catch {
      // skip corrupt files
    }
  }
  return results;
}

async function saveCharacter(character) {
  await ensureDir(CHARS_DIR);
  const path = join(CHARS_DIR, `${character.id}.json`);
  await fs.writeFile(path, JSON.stringify(character, null, 2));
  return character;
}

/**
 * GET /api/v1/characters
 * Returns list of all character passports.
 */
export async function GET() {
  try {
    const items = await listCharacters();
    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    console.error('[characters GET]', err);
    return NextResponse.json({ error: 'storage_error', message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/characters
 * Creates a new character passport.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  // Build passport — ownerUserId defaults to 'local-user' for single-user installs
  let passport;
  try {
    passport = makeCharacterPassport({
      ...body,
      ownerUserId: body.ownerUserId ?? 'local-user',
    });
  } catch (err) {
    return NextResponse.json({ error: 'schema_error', message: err.message }, { status: 400 });
  }

  // Basic validation
  if (!passport.publicName && !passport.displayName) {
    return NextResponse.json(
      { error: 'validation_error', message: 'publicName is required', errors: ['missing publicName'] },
      { status: 400 }
    );
  }

  try {
    await saveCharacter(passport);
  } catch (err) {
    console.error('[characters POST] save error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to save character' }, { status: 500 });
  }

  return NextResponse.json(passport, { status: 201 });
}
