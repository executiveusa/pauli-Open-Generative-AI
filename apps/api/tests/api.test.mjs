/**
 * Phase 3 integration tests — spin up real HTTP server, test endpoints.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// STORAGE_ROOT must be set BEFORE importing any route modules because
// apps/api/src/storage/local.js captures it at module-load time.
const TEST_STORAGE_ROOT = mkdtempSync(join(tmpdir(), 'mol-api-test-'));
process.env.STORAGE_ROOT = TEST_STORAGE_ROOT;

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const { Router } = await import('../src/router.js');
const { apiError, CORS_HEADERS } = await import('../src/middleware.js');
const { registerHealth }     = await import('../src/routes/health.js');
const { registerProjects }   = await import('../src/routes/projects.js');
const { registerCharacters } = await import('../src/routes/characters.js');
const { registerJobs }       = await import('../src/routes/jobs.js');

// ── Test server ──────────────────────────────────────────────────────────────

function buildServer() {
  const router = new Router();
  registerHealth(router);
  registerProjects(router);
  registerCharacters(router);
  registerJobs(router);

  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS_HEADERS); res.end(); return; }
    const url = new URL(req.url, 'http://localhost');
    const match = router.match(req.method, url.pathname);
    if (!match) return apiError(res, 404, 'not_found', 'not found');
    try { await match.handler(req, res, match.params); }
    catch (err) { apiError(res, 500, 'internal_error', err.message); }
  });
}

function request(server, method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const opts = {
      hostname: '127.0.0.1',
      port: addr.port,
      path,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Start server on random port
let server;
let projectId;
let characterId;
let jobId;

test.before(async () => {
  server = buildServer();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
});

test.after(async () => {
  await new Promise(r => server.close(r));
  rmSync(TEST_STORAGE_ROOT, { recursive: true, force: true });
});

// ── Health ───────────────────────────────────────────────────────────────────

test('GET /health returns ok', async () => {
  const r = await request(server, 'GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  assert.equal(r.body.service, 'more-of-less-api');
});

// ── Projects ─────────────────────────────────────────────────────────────────

test('POST /v1/projects creates project', async () => {
  const r = await request(server, 'POST', '/v1/projects', { name: 'Test Project' });
  assert.equal(r.status, 201);
  assert.ok(r.body.id.startsWith('project_'));
  assert.equal(r.body.name, 'Test Project');
  projectId = r.body.id;
});

test('POST /v1/projects requires name', async () => {
  const r = await request(server, 'POST', '/v1/projects', {});
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'validation_error');
});

test('GET /v1/projects returns list', async () => {
  const r = await request(server, 'GET', '/v1/projects');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.items));
  assert.ok(r.body.items.some(p => p.id === projectId));
});

test('GET /v1/projects/:id returns project', async () => {
  const r = await request(server, 'GET', `/v1/projects/${projectId}`);
  assert.equal(r.status, 200);
  assert.equal(r.body.id, projectId);
});

test('GET /v1/projects/:id 404 for unknown', async () => {
  const r = await request(server, 'GET', '/v1/projects/project_doesnotexist');
  assert.equal(r.status, 404);
});

// ── Characters ───────────────────────────────────────────────────────────────

test('POST /v1/characters creates passport', async () => {
  const r = await request(server, 'POST', '/v1/characters', {
    displayName: 'Test Artist',
    ownerUserId: 'u1',
    projectId,
    promptAnchor: 'same young artist, dark skin, dreads',
    triggerWords: ['mol_artist01'],
    consentStatus: 'owned',
  });
  assert.equal(r.status, 201);
  assert.ok(r.body.id.startsWith('character_'));
  assert.equal(r.body.displayName, 'Test Artist');
  characterId = r.body.id;
});

test('GET /v1/characters/:id returns passport', async () => {
  const r = await request(server, 'GET', `/v1/characters/${characterId}`);
  assert.equal(r.status, 200);
  assert.equal(r.body.id, characterId);
});

test('GET /v1/projects/:id/characters returns list', async () => {
  const r = await request(server, 'GET', `/v1/projects/${projectId}/characters`);
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.items));
});

// ── Jobs ─────────────────────────────────────────────────────────────────────

test('POST /v1/jobs/music-video creates job', async () => {
  const r = await request(server, 'POST', '/v1/jobs/music-video', {
    projectId,
    style: 'cinematic drill',
    characterIds: [characterId],
  });
  assert.equal(r.status, 202);
  assert.equal(r.body.type, 'music-video');
  assert.equal(r.body.status, 'queued');
  jobId = r.body.id;
});

test('POST /v1/jobs/music-video requires projectId', async () => {
  const r = await request(server, 'POST', '/v1/jobs/music-video', {});
  assert.equal(r.status, 400);
});

test('GET /v1/jobs/:id returns job', async () => {
  const r = await request(server, 'GET', `/v1/jobs/${jobId}`);
  assert.equal(r.status, 200);
  assert.equal(r.body.id, jobId);
});

test('GET /v1/jobs/:id 404 for unknown', async () => {
  const r = await request(server, 'GET', '/v1/jobs/job_doesnotexist');
  assert.equal(r.status, 404);
});

test('POST /v1/jobs/:id/cancel cancels job', async () => {
  const r = await request(server, 'POST', `/v1/jobs/${jobId}/cancel`);
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 'cancelled');
});

test('POST /v1/jobs/:id/cancel fails on terminal job', async () => {
  const r = await request(server, 'POST', `/v1/jobs/${jobId}/cancel`);
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, 'invalid_transition');
});

test('POST /v1/jobs/:id/remake creates child job', async () => {
  // Create a fresh job first
  const create = await request(server, 'POST', '/v1/jobs/music-video', { projectId });
  const r = await request(server, 'POST', `/v1/jobs/${create.body.id}/remake`, {
    sceneIds: ['scene_004'],
    changes: { promptDelta: 'darker, rain', seed: 99999 },
  });
  assert.equal(r.status, 202);
  assert.equal(r.body.type, 'scene-generation');
  assert.equal(r.body.input.parentJobId, create.body.id);
});

test('GET /v1/providers returns provider list', async () => {
  const r = await request(server, 'GET', '/v1/providers');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.providers));
  assert.ok(r.body.providers.some(p => p.id === 'stub'));
});

test('CORS preflight returns 204', async () => {
  const r = await request(server, 'OPTIONS', '/v1/projects', null, {});
  assert.equal(r.status, 204);
});
