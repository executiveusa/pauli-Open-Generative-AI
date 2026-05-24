/**
 * GET  /api/v1/characters — list tenant-scoped characters
 * POST /api/v1/characters — create a character passport
 *
 * All queries are tenant-scoped: organizationId from session.
 * When LOCAL_DEV_AUTH=true, falls back to JSON file storage for local dev.
 */

import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/tenant/context.js';
import { makeCharacterPassport } from '@/packages/shared/src/schemas/cynthia.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

// ─── Storage helpers (dev fallback) ──────────────────────────────────────

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage');
const CHARS_DIR = join(STORAGE_ROOT, 'db', 'characters');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listCharactersFromDisk(organizationId) {
  await ensureDir(CHARS_DIR);
  let files;
  try { files = await fs.readdir(CHARS_DIR); } catch { return []; }
  const results = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(join(CHARS_DIR, file), 'utf8');
      const c = JSON.parse(raw);
      if (!organizationId || c.organizationId === organizationId) results.push(c);
    } catch { /* skip */ }
  }
  return results;
}

async function saveCharacterToDisk(character) {
  await ensureDir(CHARS_DIR);
  await fs.writeFile(join(CHARS_DIR, `${character.id}.json`), JSON.stringify(character, null, 2));
  return character;
}

// ─── Prisma helper ───────────────────────────────────────────────────────

async function getPrisma() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    const { prisma } = await import('@/lib/db/client.js');
    return prisma;
  }
  return null;
}

// ─── Handlers ────────────────────────────────────────────────────────────

async function handleGet(request, ctx) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  const db = await getPrisma();

  if (db) {
    const where = {
      organizationId: ctx.organizationId,
      deletedAt: null,
      ...(projectId && { projectId }),
    };
    const items = await db.characterPassport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ items, total: items.length });
  }

  // Dev fallback
  const items = await listCharactersFromDisk(ctx.organizationId);
  const filtered = projectId ? items.filter((c) => c.projectId === projectId) : items;
  return NextResponse.json({ items: filtered, total: filtered.length });
}

async function handlePost(request, ctx) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 }); }

  if (!body.displayName) {
    return NextResponse.json(
      { error: 'validation_error', message: 'displayName is required' },
      { status: 400 }
    );
  }

  // Block creation if character involves a minor without explicit flag
  if (body.ageBand === 'child' && !body.minorFlag) {
    return NextResponse.json(
      { error: 'safety_blocked', message: 'Characters with ageBand=child require minorFlag=true' },
      { status: 422 }
    );
  }

  const passport = makeCharacterPassport({
    ...body,
    ownerUserId: ctx.userId,
    organizationId: ctx.organizationId,
    workspaceId: ctx.workspaceId ?? body.workspaceId ?? null,
    createdByUserId: ctx.userId,
  });

  const db = await getPrisma();

  if (db) {
    const created = await db.characterPassport.create({
      data: {
        id: passport.id,
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId ?? null,
        projectId: body.projectId ?? null,
        createdByUserId: ctx.userId,
        displayName: passport.displayName,
        internalName: body.internalName ?? null,
        locale: body.locale ?? 'en',
        ageBand: body.ageBand ?? null,
        archetype: body.archetype ?? null,
        promptAnchor: passport.promptAnchor,
        negativePromptAnchor: passport.negativePromptAnchor,
        triggerWords: passport.triggerWords,
        loras: passport.loras ?? undefined,
        seedPolicy: passport.seedPolicy ?? undefined,
        continuityRules: passport.continuityRules ?? undefined,
        consentStatus: body.consentStatus ?? 'unknown',
        minorFlag: body.minorFlag ?? false,
        politicalLikenessFlag: body.politicalLikenessFlag ?? false,
      },
    });
    return NextResponse.json(created, { status: 201 });
  }

  // Dev fallback
  await saveCharacterToDisk(passport);
  return NextResponse.json(passport, { status: 201 });
}

export const GET = withTenantContext(handleGet);
export const POST = withTenantContext(handlePost);
