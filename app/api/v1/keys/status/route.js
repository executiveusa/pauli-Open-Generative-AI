import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const KEYS_DIR = join(STORAGE_ROOT, 'db', 'keys');
const PROVIDERS = ['openai', 'anthropic', 'runwayml', 'replicate', 'elevenlabs', 'google', 'together', 'mistral'];

async function readKey(provider) {
  try {
    const raw = await fs.readFile(join(KEYS_DIR, `${provider}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * GET /api/v1/keys/status
 * Returns status of all provider keys.
 * Returns: { provider: { isConfigured: boolean, lastTested?: timestamp, testStatus?: string } }
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
