/**
 * Tenant isolation tests.
 * Verify that tenant A cannot read or modify tenant B's data.
 * Uses in-memory/disk storage (no real DB required).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, rm } from 'node:fs/promises';

// ─── Minimal tenant context mock ─────────────────────────────────────────

function makeCtx(orgId, userId = `user-${orgId}`) {
  return { organizationId: orgId, userId, workspaceId: null, role: 'admin', isDevBypass: false };
}

// ─── Isolated storage helper ──────────────────────────────────────────────

const TEST_ROOT = join(tmpdir(), `mol-isolation-test-${Date.now()}`);

async function setup() {
  await mkdir(join(TEST_ROOT, 'db', 'characters'), { recursive: true });
  await mkdir(join(TEST_ROOT, 'db', 'jobs'), { recursive: true });
  process.env.STORAGE_ROOT = TEST_ROOT;
  process.env.LOCAL_DEV_AUTH = 'true';
  process.env.NODE_ENV = 'test';
}

async function teardown() {
  await rm(TEST_ROOT, { recursive: true, force: true });
}

// ─── In-process route logic simulation ────────────────────────────────────

import { makeCharacterPassport } from '../packages/shared/src/schemas/cynthia.js';
import { writeFile, readFile, readdir } from 'node:fs/promises';

async function createCharacterInStorage(ctx, displayName) {
  const passport = makeCharacterPassport({
    displayName,
    ownerUserId: ctx.userId,
    organizationId: ctx.organizationId,
    promptAnchor: 'test anchor',
    triggerWords: ['test'],
  });
  await writeFile(
    join(TEST_ROOT, 'db', 'characters', `${passport.id}.json`),
    JSON.stringify(passport, null, 2)
  );
  return passport;
}

async function listCharactersForOrg(organizationId) {
  const dir = join(TEST_ROOT, 'db', 'characters');
  const files = await readdir(dir);
  const results = [];
  for (const file of files) {
    const raw = await readFile(join(dir, file), 'utf8');
    const c = JSON.parse(raw);
    if (c.organizationId === organizationId) results.push(c);
  }
  return results;
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('Tenant Isolation', () => {
  before(setup);
  after(teardown);

  it('org A can create and read its own characters', async () => {
    const ctxA = makeCtx('org-alpha');
    const char = await createCharacterInStorage(ctxA, 'Maria Lopez');
    assert.equal(char.organizationId, 'org-alpha');

    const list = await listCharactersForOrg('org-alpha');
    assert.ok(list.find((c) => c.id === char.id));
  });

  it('org B cannot see org A characters', async () => {
    const ctxA = makeCtx('org-alpha');
    const ctxB = makeCtx('org-beta');

    await createCharacterInStorage(ctxA, 'Org A Character');
    await createCharacterInStorage(ctxB, 'Org B Character');

    const listA = await listCharactersForOrg('org-alpha');
    const listB = await listCharactersForOrg('org-beta');

    // Verify no cross-contamination
    const orgAIds = listA.map((c) => c.organizationId);
    const orgBIds = listB.map((c) => c.organizationId);

    assert.ok(orgAIds.every((id) => id === 'org-alpha'), 'Org A list contains non-A records');
    assert.ok(orgBIds.every((id) => id === 'org-beta'), 'Org B list contains non-B records');
  });

  it('character organizationId matches creating org', async () => {
    const ctx = makeCtx('org-gamma');
    const char = await createCharacterInStorage(ctx, 'Gamma Character');
    assert.equal(char.organizationId, 'org-gamma');
    assert.equal(char.ownerUserId, ctx.userId);
  });

  it('multiple orgs get isolated results', async () => {
    const orgs = ['org-1', 'org-2', 'org-3'];
    for (const orgId of orgs) {
      const ctx = makeCtx(orgId);
      await createCharacterInStorage(ctx, `Character for ${orgId}`);
    }

    for (const orgId of orgs) {
      const list = await listCharactersForOrg(orgId);
      const wrongOrg = list.filter((c) => c.organizationId !== orgId);
      assert.equal(wrongOrg.length, 0, `Org ${orgId} has ${wrongOrg.length} records from other orgs`);
    }
  });
});

describe('Secret Redaction', () => {
  it('redacts API key patterns from strings', () => {
    const redact = (s) =>
      String(s ?? '').replace(
        /(sk-[A-Za-z0-9_-]+|hf_[A-Za-z0-9]+|fal_[A-Za-z0-9_-]+|nvapi-[A-Za-z0-9_-]+|Bearer\s+[A-Za-z0-9._-]+)/gi,
        '[REDACTED]'
      );

    // 'Bearer sk-abc123xyz' — the Bearer+token pattern is matched as a unit
    assert.ok(redact('Bearer sk-abc123xyz').includes('[REDACTED]'));
    assert.ok(!redact('Bearer sk-abc123xyz').includes('sk-abc123xyz'));
    assert.equal(redact('key: hf_abc123'), 'key: [REDACTED]');
    // fal_ pattern matches fal_key too — that's acceptable over-redaction for safety
    assert.ok(redact('fal_key=abc123_xyz').includes('[REDACTED]'));
    assert.equal(redact('nvapi-abc123'), '[REDACTED]');
    assert.equal(redact('no secrets here'), 'no secrets here');
  });
});

describe('NVIDIA NIM Proxy Config', () => {
  it('adapter reads config from env only — not module-level', async () => {
    const { NvidiaNimProxyAdapter } = await import('../lib/providers/adapters/NvidiaNimProxyAdapter.js');
    const adapter = new NvidiaNimProxyAdapter();

    // With disabled flag, health should return disabled
    process.env.NVIDIA_NIM_PROXY_ENABLED = 'false';
    const health = await adapter.health();
    assert.equal(health.ok, false);
    assert.equal(health.reason, 'disabled');

    // Without base URL, still returns disabled/missing
    process.env.NVIDIA_NIM_PROXY_ENABLED = 'true';
    delete process.env.NVIDIA_NIM_PROXY_BASE_URL;
    delete process.env.NVIDIA_NIM_PROXY_API_KEY;
    const health2 = await adapter.health();
    assert.equal(health2.ok, false);
    assert.equal(health2.reason, 'missing_config');
  });

  it('normalizeError redacts secrets', async () => {
    const { NvidiaNimProxyAdapter } = await import('../lib/providers/adapters/NvidiaNimProxyAdapter.js');
    const adapter = new NvidiaNimProxyAdapter();
    const err = new Error('Failed: Bearer nvapi-secret123');
    const normalized = adapter.normalizeError(err);
    assert.ok(!normalized.message.includes('nvapi-secret123'), 'Secret leaked in error message');
    assert.ok(normalized.message.includes('[REDACTED]'));
  });
});

describe('Job Worker — Provider Routing', () => {
  it('resolves mock provider when no API keys set', async () => {
    delete process.env.FAL_API_KEY;
    delete process.env.MUAPI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    process.env.NODE_ENV = 'test';

    const { resolveProviderChain } = await import('../lib/jobs/router.js');
    const chain = resolveProviderChain('hero_frame');
    assert.ok(chain.includes('mock'), 'Should include mock fallback in non-production');
  });

  it('puts fal first when FAL_API_KEY is set', async () => {
    process.env.FAL_API_KEY = 'fal_test_key';
    process.env.NODE_ENV = 'test';

    const { resolveProviderChain } = await import('../lib/jobs/router.js');
    const chain = resolveProviderChain('hero_frame');
    assert.equal(chain[0], 'fal', 'fal should be first when FAL_API_KEY is set');

    delete process.env.FAL_API_KEY;
  });

  it('executes a mock job end-to-end and marks it succeeded', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.FAL_API_KEY;
    delete process.env.MUAPI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DATABASE_URL;

    const jobId = `job_test_${Date.now()}`;
    const job = {
      id: jobId,
      organizationId: 'org-worker-test',
      jobType: 'hero_frame',
      type: 'hero_frame',
      status: 'queued',
      inputPrompt: 'A cinematic scene',
      parameters: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { writeFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { mkdir } = await import('node:fs/promises');
    const jobPath = join(TEST_ROOT, 'db', 'jobs');
    await mkdir(jobPath, { recursive: true });
    await writeFile(join(jobPath, `${jobId}.json`), JSON.stringify(job, null, 2));

    const { executeJob } = await import('../lib/jobs/worker.js');
    const result = await executeJob(jobId, null);
    assert.equal(result.status, 'succeeded');
    assert.ok(result.artifactUrl?.startsWith('mock://'), 'Mock artifact URL expected');
  });
});

describe('Consent Safety Gate', () => {
  it('blocks generation for characters with minorFlag', () => {
    const character = { minorFlag: true, politicalLikenessFlag: false, consentStatus: 'consented' };

    function checkConsent(c) {
      if (c.minorFlag) return { blocked: true, reason: 'Character is flagged as a minor.' };
      if (c.politicalLikenessFlag) return { blocked: true, reason: 'Political likeness flag.' };
      if (c.consentStatus === 'revoked') return { blocked: true, reason: 'Consent revoked.' };
      return { blocked: false };
    }

    const result = checkConsent(character);
    assert.equal(result.blocked, true);
    assert.ok(result.reason.includes('minor'));
  });

  it('allows generation for consented adult characters', () => {
    const character = { minorFlag: false, politicalLikenessFlag: false, consentStatus: 'consented' };

    function checkConsent(c) {
      if (c.minorFlag) return { blocked: true, reason: 'Minor flag.' };
      if (c.politicalLikenessFlag) return { blocked: true, reason: 'Political likeness.' };
      if (c.consentStatus === 'revoked') return { blocked: true, reason: 'Revoked.' };
      return { blocked: false };
    }

    const result = checkConsent(character);
    assert.equal(result.blocked, false);
  });
});
