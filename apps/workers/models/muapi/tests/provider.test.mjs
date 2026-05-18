import test from 'node:test';
import assert from 'node:assert/strict';

test('healthCheck returns unavailable when MUAPI_ENABLED not set', async () => {
  delete process.env.MUAPI_ENABLED;
  delete process.env.MUAPI_KEY;
  const { healthCheck } = await import('../src/provider.js');
  const r = await healthCheck();
  assert.equal(r.available, false);
  assert.ok(r.reason);
});

test('textToImage returns MUAPI_DISABLED when not enabled at import time', async () => {
  const { textToImage } = await import('../src/provider.js');
  const r = await textToImage({ modelId: 'sdxl', prompt: 'a forest' });
  assert.equal(r.ok, false);
  assert.equal(r.provider, 'muapi');
  assert.equal(r.error.code, 'MUAPI_DISABLED');
});

test('textToVideo returns MUAPI_DISABLED when not enabled at import time', async () => {
  const { textToVideo } = await import('../src/provider.js');
  const r = await textToVideo({ modelId: 'svd', prompt: 'city lights', durationSeconds: 5 });
  assert.equal(r.ok, false);
  assert.equal(r.provider, 'muapi');
  assert.equal(r.error.code, 'MUAPI_DISABLED');
});

test('lipSync returns MUAPI_DISABLED when not enabled at import time', async () => {
  const { lipSync } = await import('../src/provider.js');
  const r = await lipSync({ videoUrl: 'https://example.com/v.mp4', audioUrl: 'https://example.com/a.mp3' });
  assert.equal(r.ok, false);
  assert.equal(r.provider, 'muapi');
  assert.equal(r.error.code, 'MUAPI_DISABLED');
});

test('healthCheck reason is MUAPI_ENABLED=false when disabled', async () => {
  const { healthCheck } = await import('../src/provider.js');
  const r = await healthCheck();
  assert.ok(r.reason.includes('MUAPI_ENABLED'));
});
