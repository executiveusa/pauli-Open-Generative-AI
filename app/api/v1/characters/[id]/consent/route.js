import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { makeConsentRecord, validateConsentRecord } from '@/packages/shared/src/schemas/cynthia.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const CONSENT_DIR = join(STORAGE_ROOT, 'db', 'consent');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listConsentForCharacter(characterId) {
  await ensureDir(CONSENT_DIR);
  let files;
  try {
    files = await fs.readdir(CONSENT_DIR);
  } catch {
    return [];
  }
  const results = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(join(CONSENT_DIR, file), 'utf8');
      const record = JSON.parse(raw);
      if (record.characterId === characterId) {
        results.push(record);
      }
    } catch {
      // skip corrupt files
    }
  }
  return results;
}

async function saveConsentRecord(record) {
  await ensureDir(CONSENT_DIR);
  const path = join(CONSENT_DIR, `${record.id}.json`);
  await fs.writeFile(path, JSON.stringify(record, null, 2));
  return record;
}

/**
 * GET /api/v1/characters/:id/consent
 * Returns consent records for a character.
 */
export async function GET(request, { params }) {
  const { id: characterId } = await params;
  try {
    const items = await listConsentForCharacter(characterId);
    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    console.error('[consent GET]', err);
    return NextResponse.json({ error: 'storage_error', message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/characters/:id/consent
 * Saves a consent record for a character.
 */
export async function POST(request, { params }) {
  const { id: characterId } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  // Build consent record
  let record;
  try {
    record = makeConsentRecord({
      ...body,
      characterId,
      ownerUserId: body.ownerUserId ?? 'local-user',
    });
  } catch (err) {
    return NextResponse.json({ error: 'schema_error', message: err.message }, { status: 400 });
  }

  // Validate record
  const validation = validateConsentRecord(record);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Invalid consent record', errors: validation.errors },
      { status: 400 }
    );
  }

  try {
    await saveConsentRecord(record);
  } catch (err) {
    console.error('[consent POST] save error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to save consent record' }, { status: 500 });
  }

  return NextResponse.json(record, { status: 201 });
}
