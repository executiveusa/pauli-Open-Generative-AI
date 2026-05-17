import test from 'node:test';
import assert from 'node:assert/strict';
import { getConnectorConfig, getFalFallbackRoute, supportedConnectors, verifyConnector } from '../src/connectors.mjs';

test('fal fallback defaults', () => {
  const route = getFalFallbackRoute();
  assert.equal(route.provider, 'fal');
  assert.match(route.model, /fal-ai\//);
});

test('supported connectors include requested providers', () => {
  assert.deepEqual(supportedConnectors, ['opusclip', 'gdrive', 'onedrive']);
});

test('opusclip connector config validates env vars', () => {
  process.env.OPUSCLIP_TOKEN = 'x';
  const opusclip = getConnectorConfig('opusclip');
  assert.equal(opusclip.connector, 'opusclip');
  delete process.env.OPUSCLIP_TOKEN;
  assert.throws(() => getConnectorConfig('opusclip'));
});

test('openclip legacy alias maps to opusclip', () => {
  process.env.OPUSCLIP_TOKEN = 'x';
  const legacy = getConnectorConfig('openclip');
  assert.equal(legacy.connector, 'opusclip');
  delete process.env.OPUSCLIP_TOKEN;
});

test('verify connector redacts sensitive values', async () => {
  process.env.OPUSCLIP_TOKEN = 'super-secret';
  const verified = await verifyConnector('opusclip');
  assert.equal(verified.connector, 'opusclip');
  assert.equal(verified.redacted.token, '***');
  delete process.env.OPUSCLIP_TOKEN;
});
