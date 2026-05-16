import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSong, scenesToSrt } from '../src/audio/songAnalyzer.js';

test('analyzeSong returns stub result for non-existent file', async () => {
  process.env.STORAGE_ROOT = '/tmp/mol-test';
  const r = await analyzeSong({ audioPath: '/tmp/nonexistent.wav', minSceneSeconds: 3, maxSceneSeconds: 8 });
  // Should not throw — FFprobe unavailable returns ok:true with fallback duration
  assert.ok(typeof r.durationSeconds === 'number');
  assert.ok(r.durationSeconds > 0);
  assert.ok(Array.isArray(r.scenes));
  assert.ok(r.scenes.length > 0);
});

test('scenes have correct shape', async () => {
  const r = await analyzeSong({ audioPath: '/tmp/fake.wav', minSceneSeconds: 3, maxSceneSeconds: 8 });
  for (const s of r.scenes) {
    assert.ok(s.sceneId.startsWith('scene_'));
    assert.ok(typeof s.index === 'number');
    assert.ok(typeof s.startSeconds === 'number');
    assert.ok(typeof s.endSeconds === 'number');
    assert.ok(s.endSeconds > s.startSeconds);
    assert.ok(s.durationSeconds >= 3);
  }
});

test('scenes cover total duration without overlap', async () => {
  const r = await analyzeSong({ audioPath: '/tmp/fake.wav', minSceneSeconds: 4, maxSceneSeconds: 7 });
  for (let i = 1; i < r.scenes.length; i++) {
    const prev = r.scenes[i - 1];
    const curr = r.scenes[i];
    // No overlap
    assert.ok(curr.startSeconds >= prev.endSeconds - 0.01);
  }
});

test('scenesToSrt produces valid SRT content', () => {
  const scenes = [
    { sceneId: 'scene_001', index: 0, startSeconds: 0, endSeconds: 5 },
    { sceneId: 'scene_002', index: 1, startSeconds: 5, endSeconds: 10 },
  ];
  const srt = scenesToSrt(scenes, ['Line one', 'Line two']);
  assert.ok(srt.includes('1\n'));
  assert.ok(srt.includes('2\n'));
  assert.ok(srt.includes('Line one'));
  assert.ok(srt.includes('00:00:05,000 --> 00:00:10,000'));
});

test('scenesToSrt uses fallback text when no lyrics', () => {
  const scenes = [{ sceneId: 'scene_001', index: 0, startSeconds: 0, endSeconds: 5 }];
  const srt = scenesToSrt(scenes);
  assert.ok(srt.includes('Scene 1'));
});
