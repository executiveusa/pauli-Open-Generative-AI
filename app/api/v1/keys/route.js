import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { makeProviderCredential } from '@/packages/shared/src/schemas/cynthia.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const KEYS_DIR = join(STORAGE_ROOT, 'db', 'keys');
const PROVIDERS = ['openai', 'anthropic', 'runwayml', 'replicate', 'elevenlabs', 'google', 'together', 'mistral'];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readKey(provider) {
  try {
    const raw = await fs.readFile(join(KEYS_DIR, `${provider}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveKey(provider, isConfigured, lastTestedAt) {
  await ensureDir(KEYS_DIR);
  const credential = makeProviderCredential({
    provider,
    isConfigured,
    lastTestedAt,
    ownerUserId: 'local-user',
  });
  const path = join(KEYS_DIR, `${provider}.json`);
  await fs.writeFile(path, JSON.stringify(credential, null, 2));
  return credential;
}

async function deleteKey(provider) {
  try {
    await fs.unlink(join(KEYS_DIR, `${provider}.json`));
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

/**
 * GET /api/v1/keys
 * Returns status of all provider keys (never expose actual keys).
 */
export async function GET() {
  const status = {};
  for (const provider of PROVIDERS) {
    const credential = await readKey(provider);
    status[provider] = {
      isConfigured: credential?.isConfigured ?? false,
      lastTested: credential?.lastTestedAt ?? null,
      testStatus: credential?.testStatus ?? 'untested',
    };
  }
  return NextResponse.json({ providers: status });
}

/**
 * POST /api/v1/keys
 * Saves a provider key.
 * Body: { provider, key }
 * NEVER stores actual key, NEVER logs key.
 * Returns success message without key exposure.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const { provider, key } = body;

  // Validate required fields
  if (!provider) {
    return NextResponse.json(
      { error: 'validation_error', message: 'provider is required', errors: ['missing provider'] },
      { status: 400 }
    );
  }

  if (!PROVIDERS.includes(provider)) {
    return NextResponse.json(
      { error: 'validation_error', message: `Invalid provider: ${provider}`, errors: ['invalid provider'] },
      { status: 400 }
    );
  }

  if (!key) {
    return NextResponse.json(
      { error: 'validation_error', message: 'key is required', errors: ['missing key'] },
      { status: 400 }
    );
  }

  // IMPORTANT: Never log actual key - use placeholder
  console.log(`[keys POST] Saving key for provider: ${provider} [REDACTED]`);

  try {
    await saveKey(provider, true, new Date().toISOString());
  } catch (err) {
    console.error('[keys POST] save error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to save key' }, { status: 500 });
  }

  // Return success WITHOUT exposing key
  return NextResponse.json(
    {
      provider,
      isConfigured: true,
      message: 'Key saved successfully',
    },
    { status: 201 }
  );
}

/**
 * DELETE /api/v1/keys
 * Removes a provider key.
 * Body: { provider }
 */
export async function DELETE(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const { provider } = body;

  // Validate required fields
  if (!provider) {
    return NextResponse.json(
      { error: 'validation_error', message: 'provider is required', errors: ['missing provider'] },
      { status: 400 }
    );
  }

  if (!PROVIDERS.includes(provider)) {
    return NextResponse.json(
      { error: 'validation_error', message: `Invalid provider: ${provider}`, errors: ['invalid provider'] },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteKey(provider);
    if (!deleted) {
      return NextResponse.json(
        { error: 'not_found', message: `No key configured for provider: ${provider}` },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error('[keys DELETE] error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to delete key' }, { status: 500 });
  }

  return NextResponse.json({
    deleted: true,
    provider,
    message: 'Key removed successfully',
  });
}
