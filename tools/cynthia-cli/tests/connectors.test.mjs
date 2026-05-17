import test from 'node:test';
import assert from 'node:assert/strict';
import { getConnectorConfig, getFalFallbackRoute, supportedConnectors } from '../src/connectors.mjs';

test('fal fallback defaults', () => {
  const route = getFalFallbackRoute();
  assert.equal(route.provider, 'fal');
  assert.match(route.model, /fal-ai\//);
});

test('supported connectors include requested providers', () => {
  assert.deepEqual(supportedConnectors, ['openclip', 'gdrive', 'onedrive']);
});

test('connector config validates env vars', () => {
  process.env.OPENCLIP_TOKEN = 'x';
  const openclip = getConnectorConfig('openclip');
  assert.equal(openclip.connector, 'openclip');
  delete process.env.OPENCLIP_TOKEN;
  assert.throws(() => getConnectorConfig('openclip'));
});
