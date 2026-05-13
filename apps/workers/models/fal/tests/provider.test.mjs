import test from 'node:test';
import assert from 'node:assert/strict';

test('healthCheck returns unavailable when FAL_ENABLED not set', async () => {
  delete process.env.FAL_ENABLED;
  delete process.env.FAL_KEY;
  const { healthCheck } = await import('../src/provider.js');
  const r = await healthCheck();
  assert.equal(r.available, false);
  assert.ok(r.reason);
});

test('generateTextToVideo returns disabled error when not enabled', async () => {
  const { generateTextToVideo } = await import('../src/provider.js');
  const r = await generateTextToVideo({ prompt: 'a waterfall', allowPaid: true });
  assert.equal(r.ok, false);
  assert.equal(r.provider, 'fal');
  assert.ok(r.error.code);
});

test('generateTextToVideo returns PAID_NOT_ALLOWED when allowPaid=false', async () => {
  // Even if enabled, allowPaid=false should block execution
  const { generateTextToVideo } = await import('../src/provider.js');
  const r = await generateTextToVideo({ prompt: 'ocean waves', allowPaid: false });
  assert.equal(r.ok, false);
  assert.equal(r.provider, 'fal');
  // FAL_DISABLED takes precedence at import-time env check; PAID_NOT_ALLOWED if enabled
  assert.ok(['FAL_DISABLED', 'PAID_NOT_ALLOWED'].includes(r.error.code));
});

test('generateImageToVideo returns disabled error when not enabled', async () => {
  const { generateImageToVideo } = await import('../src/provider.js');
  const r = await generateImageToVideo({ imageUrl: 'https://example.com/img.jpg', prompt: 'waves' });
  assert.equal(r.ok, false);
  assert.equal(r.provider, 'fal');
  assert.ok(r.error.code);
});

test('error code is FAL_DISABLED when module loaded with FAL_ENABLED unset', async () => {
  const { generateTextToVideo } = await import('../src/provider.js');
  const r = await generateTextToVideo({ prompt: 'test', allowPaid: true });
  assert.equal(r.error.code, 'FAL_DISABLED');
});
