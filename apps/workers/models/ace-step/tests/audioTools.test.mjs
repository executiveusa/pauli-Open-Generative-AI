import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkFfmpeg,
  checkDemucs,
  probeAudio,
  generateWaveformPreview,
  extractStems,
  measureLoudness,
} from '../src/utils/audioTools.js';

test('audioTools — checkFfmpeg detects FFmpeg availability', async () => {
  const result = await checkFfmpeg();
  assert(typeof result.available === 'boolean');
  if (!result.available) {
    assert(result.error);
    assert(result.message);
  }
});

test('audioTools — checkDemucs detects Demucs availability', async () => {
  const result = await checkDemucs();
  assert(typeof result.available === 'boolean');
});

test('audioTools — probeAudio returns null values gracefully when file missing', async () => {
  const result = await probeAudio('/nonexistent/file.mp3');
  assert.equal(result.ok, false);
  assert(result.error);
  assert.equal(result.durationSeconds, null);
});

test('audioTools — extractStems returns error when Demucs unavailable', async () => {
  const demucs = await checkDemucs();
  if (!demucs.available) {
    const result = await extractStems('/fake/audio.mp3', '/tmp');
    assert.equal(result.ok, false);
    assert.equal(result.error, 'DEMUCS_NOT_AVAILABLE');
    assert(result.message);
  }
});

test('audioTools — measureLoudness handles missing file gracefully', async () => {
  const result = await measureLoudness('/nonexistent/file.mp3');
  assert.equal(result.ok, false);
  assert.equal(result.integratedLoudness, null);
  assert(result.error);
});

test('audioTools — checkFfmpeg returns proper structure', async () => {
  const result = await checkFfmpeg();
  assert(Object.hasOwn(result, 'available'));
  assert(typeof result.available === 'boolean');
});

test('audioTools — checkDemucs returns proper structure', async () => {
  const result = await checkDemucs();
  assert(Object.hasOwn(result, 'available'));
  assert(typeof result.available === 'boolean');
});

test('audioTools — probeAudio returns structure on missing file', async () => {
  const result = await probeAudio('/fake/path.mp3');
  assert.equal(result.ok, false);
  assert(result.error);
  assert('durationSeconds' in result);
  assert.equal(result.durationSeconds, null);
});

test('audioTools — generateWaveformPreview returns error structure when file missing', async () => {
  const result = await generateWaveformPreview('/fake/input.mp3', '/tmp/output.png');
  assert.equal(result.ok, false);
  assert(result.error);
  assert.equal(result.path, null);
});

test('audioTools — extractStems returns proper error structure', async () => {
  const result = await extractStems('/fake/audio.mp3', '/tmp');
  assert(typeof result.ok === 'boolean');
  if (!result.ok) {
    assert(result.error);
  }
});

test('audioTools — measureLoudness returns loudness metrics structure', async () => {
  const result = await measureLoudness('/fake/file.mp3');
  assert(Object.hasOwn(result, 'ok'));
  assert('integratedLoudness' in result);
  // On error, only ok, integratedLoudness, and error are present
  if (result.ok) {
    assert('truePeak' in result);
  }
});
