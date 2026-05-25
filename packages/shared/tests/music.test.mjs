import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMusicGenerationRequest,
  validateMusicArtifact,
  validateMusicRightsRecord,
  validateMusicSafety,
  validateStyleTags,
} from '../src/music/schemas.js';
import {
  makeMusicGenerationRequest,
  makeMusicArtifact,
  makeMusicRightsRecord,
  LATAM_MUSIC_PRESETS,
  getPresetById,
  getPresetsByLocale,
  getPresetsByGenre,
  presetToRequest,
} from '../src/music/index.js';

test('MusicGenerationRequest validation — valid simple request', () => {
  const req = makeMusicGenerationRequest({
    projectId: 'proj_123',
    createdByUserId: 'user_456',
    mode: 'simple',
    prompt: 'upbeat reggaetón',
  });

  const result = validateMusicGenerationRequest(req);
  assert.equal(result.valid, true, 'request should be valid');
  assert.equal(result.errors.length, 0, 'should have no errors');
});

test('MusicGenerationRequest validation — missing required fields', () => {
  const req = { mode: 'simple' };
  const result = validateMusicGenerationRequest(req);
  assert.equal(result.valid, false, 'request should be invalid');
  assert(result.errors.length > 0, 'should have errors');
  assert(result.errors.some(e => e.includes('projectId')), 'should mention projectId');
});

test('MusicGenerationRequest validation — invalid mode', () => {
  const req = makeMusicGenerationRequest({
    projectId: 'proj_123',
    createdByUserId: 'user_456',
    mode: 'invalid-mode',
  });
  const result = validateMusicGenerationRequest(req);
  assert.equal(result.valid, false, 'request should be invalid');
  assert(result.errors.some(e => e.includes('mode')), 'should mention mode');
});

test('MusicGenerationRequest validation — BPM out of range', () => {
  const req = makeMusicGenerationRequest({
    projectId: 'proj_123',
    createdByUserId: 'user_456',
    prompt: 'test',
    bpm: 300, // too high
  });
  const result = validateMusicGenerationRequest(req);
  assert.equal(result.valid, false, 'request should be invalid');
  assert(result.errors.some(e => e.includes('bpm')), 'should mention bpm');
});

test('MusicGenerationRequest validation — lyrics mode requires lyrics', () => {
  const req = makeMusicGenerationRequest({
    projectId: 'proj_123',
    createdByUserId: 'user_456',
    mode: 'lyrics',
    prompt: 'test',
    lyrics: '', // empty
  });
  const result = validateMusicGenerationRequest(req);
  assert.equal(result.valid, false, 'request should be invalid');
  assert(result.errors.some(e => e.includes('lyrics')), 'should mention lyrics');
});

test('MusicGenerationRequest validation — cover mode requires sourceAudioAssetId', () => {
  const req = makeMusicGenerationRequest({
    projectId: 'proj_123',
    createdByUserId: 'user_456',
    mode: 'cover',
    prompt: 'test',
  });
  const result = validateMusicGenerationRequest(req);
  assert.equal(result.valid, false, 'request should be invalid');
  assert(result.errors.some(e => e.includes('sourceAudioAssetId')), 'should mention sourceAudioAssetId');
});

test('MusicArtifact validation — valid artifact', () => {
  const artifact = makeMusicArtifact({
    id: 'artifact_123',
    projectId: 'proj_456',
    jobId: 'job_789',
    kind: 'song',
    storagePath: 'artifacts/song.mp3',
  });
  const result = validateMusicArtifact(artifact);
  assert.equal(result.valid, true, 'artifact should be valid');
});

test('MusicArtifact validation — audio artifact requires storagePath', () => {
  const artifact = makeMusicArtifact({
    id: 'artifact_123',
    projectId: 'proj_456',
    jobId: 'job_789',
    kind: 'song',
    storagePath: '', // empty
  });
  const result = validateMusicArtifact(artifact);
  assert.equal(result.valid, false, 'artifact should be invalid');
  assert(result.errors.some(e => e.includes('storagePath')), 'should mention storagePath');
});

test('MusicArtifact validation — stem artifact validation', () => {
  const artifact = makeMusicArtifact({
    id: 'artifact_123',
    projectId: 'proj_456',
    jobId: 'job_789',
    kind: 'song',
    storagePath: 'artifacts/song.mp3',
    stems: [
      { kind: 'vocals', storagePath: 'artifacts/vocals.mp3' },
      { kind: 'invalid-stem', storagePath: 'artifacts/invalid.mp3' },
    ],
  });
  const result = validateMusicArtifact(artifact);
  assert.equal(result.valid, false, 'artifact should be invalid');
  assert(result.errors.some(e => e.includes('stem')), 'should mention stem error');
});

test('MusicRightsRecord validation — valid record', () => {
  const record = makeMusicRightsRecord({
    organizationId: 'org_123',
    projectId: 'proj_456',
    assetId: 'artifact_789',
    rightsStatus: 'generated',
  });
  const result = validateMusicRightsRecord(record);
  assert.equal(result.valid, true, 'record should be valid');
});

test('MusicSafety validation — blocks artist imitation', () => {
  const req = {
    prompt: 'sound exactly like Shakira',
    rightsIntent: 'original',
  };
  const result = validateMusicSafety(req);
  assert.equal(result.safe, false, 'should not be safe');
  assert(result.blocks.length > 0, 'should have blocks');
  assert(result.blocks[0].includes('imitation'), 'should block artist imitation');
});

test('MusicSafety validation — blocks voice cloning', () => {
  const req = {
    prompt: 'clone this singer voice',
    rightsIntent: 'clone',
  };
  const result = validateMusicSafety(req);
  assert.equal(result.safe, false, 'should not be safe');
  assert(result.blocks.length > 0, 'should have blocks');
});

test('MusicSafety validation — allows original compositions', () => {
  const req = {
    prompt: 'upbeat reggaetón with energetic vibe',
    rightsIntent: 'original',
  };
  const result = validateMusicSafety(req);
  assert.equal(result.safe, true, 'should be safe');
});

test('MusicSafety validation — suggests alternatives for safe prompts', () => {
  const req = {
    prompt: 'sound exactly like reggaetón artist',
  };
  const result = validateMusicSafety(req);
  assert(result.suggestions.length > 0, 'should have suggestions');
});

test('StyleTags validation — flags stereotypes', () => {
  const result = validateStyleTags(['spicy', 'tropical', 'exotic']);
  assert.equal(result.appropriate, false, 'should flag stereotypes');
  assert(result.issues.length > 0, 'should have issues');
});

test('StyleTags validation — allows specific genres', () => {
  const result = validateStyleTags(['reggaetón', 'cumbia', 'salsa']);
  assert.equal(result.appropriate, true, 'should be appropriate');
});

test('LATAM presets — all presets are valid', () => {
  assert(LATAM_MUSIC_PRESETS.length > 0, 'should have presets');

  for (const preset of LATAM_MUSIC_PRESETS) {
    assert(preset.id, `preset should have id: ${JSON.stringify(preset)}`);
    assert(preset.nameEn, `preset ${preset.id} should have nameEn`);
    assert(preset.nameEs, `preset ${preset.id} should have nameEs`);
    assert(preset.genre, `preset ${preset.id} should have genre`);
    assert(preset.mood, `preset ${preset.id} should have mood`);
    assert(preset.promptTemplateEn, `preset ${preset.id} should have promptTemplateEn`);
    assert(preset.promptTemplateEs, `preset ${preset.id} should have promptTemplateEs`);
  }
});

test('Preset lookup — getPresetById returns correct preset', () => {
  const preset = getPresetById('reggaeton-cinematic');
  assert(preset, 'should find preset');
  assert.equal(preset.nameEn, 'Reggaetón Cinematic', 'should have correct name');
});

test('Preset lookup — getPresetsByLocale filters correctly', () => {
  const presets = getPresetsByLocale('es-MX');
  assert(presets.length > 0, 'should find presets for es-MX');
  assert(presets.every(p => p.locale.includes('es-MX')), 'all presets should support es-MX');
});

test('Preset lookup — getPresetsByGenre filters correctly', () => {
  const presets = getPresetsByGenre('reggaetón');
  assert(presets.length > 0, 'should find reggaetón presets');
  assert(presets.every(p => p.genre === 'reggaetón'), 'all presets should be reggaetón');
});

test('Preset conversion — presetToRequest returns valid request', () => {
  const req = presetToRequest('reggaeton-cinematic');
  assert(req, 'should convert preset to request');
  assert.equal(req.genre, 'reggaetón', 'should have correct genre');
  assert(req.prompt.length > 0, 'should have a non-empty prompt');
  assert(req.prompt.includes('cinemático') || req.prompt.includes('cinematic'), 'should have cinematic reference in prompt');
});

test('Preset conversion — presetToRequest with overrides', () => {
  const req = presetToRequest('reggaeton-cinematic', {
    title: 'My Custom Song',
    bpm: 100,
    language: 'en',
  });
  assert.equal(req.title, 'My Custom Song', 'should override title');
  assert.equal(req.bpm, 100, 'should override bpm');
  assert.equal(req.language, 'en', 'should override language');
  assert(req.prompt.length > 0, 'should have a prompt');
  assert(req.prompt.includes('reggaetón') || req.prompt.includes('cinematic'), 'should have relevant content in prompt');
});

test('Preset to request — validates generated request', () => {
  const req = presetToRequest('reggaeton-cinematic', {
    projectId: 'proj_123',
    createdByUserId: 'user_456',
  });
  assert(req, 'should generate request');
  const validation = validateMusicGenerationRequest(req);
  assert.equal(validation.valid, true, 'generated request should be valid');
});
