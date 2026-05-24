import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdapter, resetAdapter } from '../src/adapter.js';
import { redactSecrets } from '../src/normalize.js';

test('Adapter — mock mode enabled', async () => {
  const adapter = createAdapter({ mockMode: true });
  assert.equal(adapter.mockMode, true);
  resetAdapter();
});

test('Adapter — health check in mock mode', async () => {
  const adapter = createAdapter({ mockMode: true, apiUrl: 'http://localhost:7860' });
  const health = await adapter.health();
  assert(health.healthy === false, 'mock should report unhealthy (no real server)');
  resetAdapter();
});

test('Adapter — list models in mock mode', async () => {
  const adapter = createAdapter({ mockMode: true });
  const models = await adapter.listModels();
  assert(Array.isArray(models));
  assert(models.length > 0);
  assert.equal(models[0].id, 'ace-step-1.5');
  resetAdapter();
});

test('Adapter — generate song in mock mode', async () => {
  const adapter = createAdapter({ mockMode: true });
  const result = await adapter.generateSong({
    prompt: 'upbeat reggaetón',
    mode: 'simple',
    durationSeconds: 60,
  });
  assert(result);
  assert(result.stub === true, 'should be marked as stub');
  assert.equal(result.provider, 'ace-step');
  resetAdapter();
});

test('Adapter — generate instrumental in mock mode', async () => {
  const adapter = createAdapter({ mockMode: true });
  const result = await adapter.generateInstrumental({
    prompt: 'cinematic underscore',
    durationSeconds: 120,
  });
  assert(result);
  assert(result.stub === true);
  resetAdapter();
});

test('Adapter — list capabilities', async () => {
  const adapter = createAdapter({ mockMode: true });
  const caps = await adapter.listCapabilities();
  assert(caps);
  assert.equal(caps.providerId, 'ace-step');
  assert.equal(caps.modelId, 'ace-step-1.5');
  assert(caps.supportsTextToMusic === true);
  resetAdapter();
});

test('Adapter — generateWithLyrics requires lyrics', async () => {
  const adapter = createAdapter({ mockMode: true });
  try {
    await adapter.generateWithLyrics({
      prompt: 'test',
      // no lyrics
    });
    assert.fail('should throw error');
  } catch (err) {
    assert(err.message.includes('lyrics'));
  }
  resetAdapter();
});

test('Adapter — generateCover requires sourceAudioAssetId', async () => {
  const adapter = createAdapter({ mockMode: true });
  try {
    await adapter.generateCover({
      prompt: 'new style',
      // no sourceAudioAssetId
    });
    assert.fail('should throw error');
  } catch (err) {
    assert(err.message.includes('sourceAudioAssetId'));
  }
  resetAdapter();
});

test('Adapter — normalize artifact', async () => {
  const adapter = createAdapter();
  const normalized = await adapter.normalizeArtifact(
    {
      audio_path: '/tmp/output.mp3',
      duration_seconds: 90,
      bpm: 120,
      key: 'Cm',
    },
    {
      prompt: 'test song',
      durationSeconds: 90,
      mode: 'simple',
      language: 'es',
    }
  );
  assert(normalized);
  assert.equal(normalized.providerId, 'ace-step');
  assert.equal(normalized.durationSeconds, 90);
  assert.equal(normalized.bpm, 120);
  assert.equal(normalized.key, 'Cm');
  resetAdapter();
});

test('Error handling — redact secrets', () => {
  const url = 'https://api.example.com/v1/endpoint?key=nvapi-abc123xyz';
  const redacted = redactSecrets(url);
  assert(!redacted.includes('nvapi-'), 'should redact nvapi key');
  assert(redacted.includes('[REDACTED]'));
});

test('Error handling — redact file paths', () => {
  const msg = 'Error in /tmp/temp_file_2024.mp3';
  const redacted = redactSecrets(msg);
  assert(!redacted.includes('/tmp/temp_file'), 'should redact file path');
});

test('Error handling — redact Hugging Face token', () => {
  const msg = 'Using token hf_abcdefghijklmnopqrstuv';
  const redacted = redactSecrets(msg);
  assert(!redacted.includes('hf_'), 'should redact HF token');
});

test('Error handling — preserves other content', () => {
  const msg = 'Connection error: timeout after 30 seconds';
  const redacted = redactSecrets(msg);
  assert(redacted.includes('Connection error'));
  assert(redacted.includes('timeout'));
});

test('Mock generation — returns artifact shape', async () => {
  const adapter = createAdapter({ mockMode: true });
  const result = await adapter._generateMock({
    prompt: 'test',
    durationSeconds: 60,
    bpm: 120,
    key: 'C',
  });
  assert(result);
  assert(result.stub === true);
  assert(result.provider === 'ace-step');
  assert(result.durationSeconds === 60);
  assert(result.bpm === 120);
  resetAdapter();
});
