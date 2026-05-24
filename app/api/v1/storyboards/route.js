/**
 * GET  /api/v1/storyboards — list tenant storyboards
 * POST /api/v1/storyboards — create storyboard
 * Tenant-scoped.
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { withTenantContext } from '@/lib/tenant/context.js';
import { makeStoryboard, validateStoryboard } from '@/packages/shared/src/schemas/cynthia.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage');
const STORYBOARDS_DIR = join(STORAGE_ROOT, 'db', 'storyboards');

async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }

async function listStoryboards(organizationId) {
  await ensureDir(STORYBOARDS_DIR);
  let files;
  try { files = await fs.readdir(STORYBOARDS_DIR); } catch { return []; }
  const results = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(join(STORYBOARDS_DIR, file), 'utf8');
      const sb = JSON.parse(raw);
      if (!organizationId || sb.organizationId === organizationId) results.push(sb);
    } catch { /* skip */ }
  }
  return results;
}

async function saveStoryboard(storyboard) {
  await ensureDir(STORYBOARDS_DIR);
  await fs.writeFile(join(STORYBOARDS_DIR, `${storyboard.id}.json`), JSON.stringify(storyboard, null, 2));
  return storyboard;
}

async function handleGet(request, ctx) {
  const items = await listStoryboards(ctx.organizationId);
  return NextResponse.json({ items, total: items.length });
}

async function handlePost(request, ctx) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 }); }

  let storyboard;
  try {
    storyboard = makeStoryboard({
      ...body,
      ownerUserId: ctx.userId,
      organizationId: ctx.organizationId,
      createdByUserId: ctx.userId,
    });
  } catch (err) {
    return NextResponse.json({ error: 'schema_error', message: err.message }, { status: 400 });
  }

  const validation = validateStoryboard(storyboard);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Invalid storyboard', errors: validation.errors },
      { status: 400 }
    );
  }

  if (!storyboard.title) {
    return NextResponse.json(
      { error: 'validation_error', message: 'title is required' },
      { status: 400 }
    );
  }

  await saveStoryboard(storyboard);
  return NextResponse.json(storyboard, { status: 201 });
}

export const GET = withTenantContext(handleGet);
export const POST = withTenantContext(handlePost);
