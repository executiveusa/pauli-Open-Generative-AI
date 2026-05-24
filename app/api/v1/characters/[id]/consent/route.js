/**
 * GET  /api/v1/characters/:id/consent — list consent records
 * POST /api/v1/characters/:id/consent — add consent record
 * Tenant-scoped.
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { withTenantContext } from '@/lib/tenant/context.js';
import { makeConsentRecord, validateConsentRecord } from '@/packages/shared/src/schemas/cynthia.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage');
const CONSENT_DIR = join(STORAGE_ROOT, 'db', 'consent');

async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }

async function listConsentForCharacter(characterId, organizationId) {
  await ensureDir(CONSENT_DIR);
  let files;
  try { files = await fs.readdir(CONSENT_DIR); } catch { return []; }
  const results = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(join(CONSENT_DIR, file), 'utf8');
      const record = JSON.parse(raw);
      if (record.characterId === characterId && record.organizationId === organizationId) {
        results.push(record);
      }
    } catch { /* skip */ }
  }
  return results;
}

async function saveConsentRecord(record) {
  await ensureDir(CONSENT_DIR);
  await fs.writeFile(join(CONSENT_DIR, `${record.id}.json`), JSON.stringify(record, null, 2));
  return record;
}

async function handleGet(request, ctx, { id: characterId }) {
  const items = await listConsentForCharacter(characterId, ctx.organizationId);
  return NextResponse.json({ items, total: items.length });
}

async function handlePost(request, ctx, { id: characterId }) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 }); }

  let record;
  try {
    record = makeConsentRecord({
      ...body,
      characterId,
      ownerUserId: ctx.userId,
      organizationId: ctx.organizationId,
    });
  } catch (err) {
    return NextResponse.json({ error: 'schema_error', message: err.message }, { status: 400 });
  }

  const validation = validateConsentRecord(record);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Invalid consent record', errors: validation.errors },
      { status: 400 }
    );
  }

  await saveConsentRecord(record);
  return NextResponse.json(record, { status: 201 });
}

export const GET = withTenantContext(handleGet);
export const POST = withTenantContext(handlePost);
