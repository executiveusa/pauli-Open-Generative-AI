/**
 * GET    /api/v1/keys   — list provider key status (never returns raw keys)
 * POST   /api/v1/keys   — save a provider key (encrypted via vault)
 * DELETE /api/v1/keys   — remove a provider key
 * Tenant-scoped.
 */

import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/tenant/context.js';
import { encryptSecret, sanitizeCredential } from '@/lib/providers/vault.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { makeProviderCredential } from '@/packages/shared/src/schemas/cynthia.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? join(process.cwd(), 'apps', 'api', 'storage');
const KEYS_DIR = join(STORAGE_ROOT, 'db', 'keys');

const SUPPORTED_PROVIDERS = [
  'openai', 'anthropic', 'runway', 'replicate', 'elevenlabs', 'google',
  'together', 'mistral', 'kling', 'muapi', 'fal', 'huggingface',
  'cynthia-gateway', 'comfyui',
];

async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }

async function readKeyRecord(provider, organizationId) {
  try {
    const raw = await fs.readFile(join(KEYS_DIR, `${organizationId}_${provider}.json`), 'utf8');
    return JSON.parse(raw);
  } catch { return null; }
}

async function saveKeyRecord(provider, organizationId, record) {
  await ensureDir(KEYS_DIR);
  await fs.writeFile(
    join(KEYS_DIR, `${organizationId}_${provider}.json`),
    JSON.stringify(record, null, 2)
  );
  return record;
}

async function deleteKeyRecord(provider, organizationId) {
  try {
    await fs.unlink(join(KEYS_DIR, `${organizationId}_${provider}.json`));
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

async function handleGet(request, ctx) {
  const status = {};
  for (const provider of SUPPORTED_PROVIDERS) {
    const record = await readKeyRecord(provider, ctx.organizationId);
    status[provider] = {
      isConfigured: record?.isConfigured ?? false,
      lastTested: record?.lastTestedAt ?? null,
      testStatus: record?.testStatus ?? 'untested',
    };
  }
  return NextResponse.json({ providers: status });
}

async function handlePost(request, ctx) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json', message: 'Invalid JSON' }, { status: 400 }); }

  const { provider, key } = body;

  if (!provider || !SUPPORTED_PROVIDERS.includes(provider)) {
    return NextResponse.json(
      { error: 'validation_error', message: `Invalid or missing provider` },
      { status: 400 }
    );
  }
  if (!key) {
    return NextResponse.json({ error: 'validation_error', message: 'key is required' }, { status: 400 });
  }

  // Encrypt the key — never store plaintext
  const encryptedSecretRef = encryptSecret(key);

  const credential = makeProviderCredential({
    provider,
    isConfigured: true,
    lastTestedAt: new Date().toISOString(),
    ownerUserId: ctx.userId,
    organizationId: ctx.organizationId,
    encryptedSecretRef,
  });

  await saveKeyRecord(provider, ctx.organizationId, credential);

  // Return sanitized record — no raw key, no encrypted ref
  return NextResponse.json(
    { provider, isConfigured: true, message: 'Key saved successfully' },
    { status: 201 }
  );
}

async function handleDelete(request, ctx) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json', message: 'Invalid JSON' }, { status: 400 }); }

  const { provider } = body;
  if (!provider || !SUPPORTED_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'validation_error', message: 'Invalid or missing provider' }, { status: 400 });
  }

  const deleted = await deleteKeyRecord(provider, ctx.organizationId);
  if (!deleted) {
    return NextResponse.json({ error: 'not_found', message: `No key for ${provider}` }, { status: 404 });
  }

  return NextResponse.json({ deleted: true, provider });
}

export const GET = withTenantContext(handleGet);
export const POST = withTenantContext(handlePost);
export const DELETE = withTenantContext(handleDelete);
