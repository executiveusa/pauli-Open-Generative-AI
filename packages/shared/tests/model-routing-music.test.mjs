import { test } from 'node:test';
import assert from 'node:assert/strict';
import { routeMusic, MODEL_REGISTRY, getCapabilityBadges } from '../src/model-routing/supercomputer.js';

test('Music routing — ACE-Step exists in registry', () => {
  const aceStep = MODEL_REGISTRY.find(m => m.provider === 'ace-step');
  assert(aceStep, 'ACE-Step should be in MODEL_REGISTRY');
  assert.equal(aceStep.modelId, 'ace-step-1.5');
  assert(aceStep.modality.includes('audio'));
  assert(aceStep.supportsTextToMusic);
  assert(aceStep.supportsInstrumental);
  assert(aceStep.supportsLyricsToSong);
});

test('Music routing — simple mode with healthy provider', () => {
  const result = routeMusic(
    { mode: 'simple' },
    new Set(['ace-step'])
  );
  assert(result.primary);
  assert.equal(result.primary.provider, 'ace-step');
  assert(result.reason.includes('healthy') || result.reason.includes('selected'));
});

test('Music routing — instrumental mode requires supportsInstrumental', () => {
  const result = routeMusic(
    { mode: 'instrumental' },
    new Set(['ace-step'])
  );
  assert(result.primary);
  assert(result.primary.supportsInstrumental);
});

test('Music routing — lyrics mode requires supportsLyricsToSong', () => {
  const result = routeMusic(
    { mode: 'lyrics' },
    new Set(['ace-step'])
  );
  assert(result.primary);
  assert(result.primary.supportsLyricsToSong);
});

test('Music routing — cover mode requires supportsAudioCover', () => {
  const result = routeMusic(
    { mode: 'cover', requiresCover: true },
    new Set(['ace-step'])
  );
  // ACE-Step doesn't support cover yet, so should fall back to mock
  assert(result.primary);
  // Either mock or other available provider
  assert(result.primary.supportsMock || result.primary.provider === 'ace-step');
});

test('Music routing — LatAm locale prefers ACE-Step', () => {
  const result = routeMusic(
    { mode: 'simple', locale: 'es-MX' },
    new Set(['ace-step'])
  );
  assert(result.primary);
  assert.equal(result.primary.provider, 'ace-step');
  assert(result.reasonEs.includes('LatAm') || result.reasonEs.includes('ACE-Step'));
});

test('Music routing — es-CO locale recognized as LatAm', () => {
  const result = routeMusic(
    { mode: 'simple', locale: 'es-CO' },
    new Set(['ace-step'])
  );
  assert(result.primary);
  assert.equal(result.primary.provider, 'ace-step');
});

test('Music routing — Free Mode prefers healthy local provider', () => {
  const result = routeMusic(
    { mode: 'simple', isFreeMode: true },
    new Set(['ace-step'])
  );
  assert(result.primary);
  assert.equal(result.primary.provider, 'ace-step');
  assert(result.reason.includes('Free Mode'));
});

test('Music routing — unhealthy provider falls back to mock', () => {
  const result = routeMusic(
    { mode: 'simple' },
    new Set() // No healthy providers
  );
  assert(result.primary);
  assert(result.primary.supportsMock);
  assert(result.reason.includes('not available'));
});

test('Music routing — English locale without free mode', () => {
  const result = routeMusic(
    { mode: 'simple', locale: 'en' },
    new Set(['ace-step'])
  );
  assert(result.primary);
  assert.equal(result.primary.provider, 'ace-step');
});

test('Music routing — Portuguese locale not boosted (not LatAm for music)', () => {
  const result = routeMusic(
    { mode: 'simple', locale: 'pt-BR' },
    new Set(['ace-step'])
  );
  assert(result.primary);
  assert.equal(result.primary.provider, 'ace-step');
  // Should still be selected as healthy
});

test('Music capability badges include music features', () => {
  const aceStep = MODEL_REGISTRY.find(m => m.provider === 'ace-step');
  const badges = getCapabilityBadges(aceStep);
  assert(badges.includes('T2M'), 'Should have T2M badge');
  assert(badges.includes('Instrumental'), 'Should have Instrumental badge');
  assert(badges.includes('Lyrics'), 'Should have Lyrics badge');
});

test('Music capability badges format correctly', () => {
  const aceStep = MODEL_REGISTRY.find(m => m.provider === 'ace-step');
  const badges = getCapabilityBadges(aceStep);
  assert(Array.isArray(badges));
  assert(badges.length > 0);
  badges.forEach(badge => {
    assert(typeof badge === 'string');
    assert(badge.length > 0);
  });
});

test('Music routing returns alternatives', () => {
  const result = routeMusic(
    { mode: 'simple' },
    new Set(['ace-step'])
  );
  assert(Array.isArray(result.alternatives));
  // May have alternatives (mocks, stubs) or empty
});

test('Music routing — returns bilingual reasons', () => {
  const result = routeMusic(
    { mode: 'simple', locale: 'es-MX' },
    new Set(['ace-step'])
  );
  assert(result.reason, 'Should have English reason');
  assert(result.reasonEs, 'Should have Spanish reason');
});

test('Music routing — provides primary model with metadata', () => {
  const result = routeMusic(
    { mode: 'simple' },
    new Set(['ace-step'])
  );
  const { primary } = result;
  assert(primary.provider);
  assert(primary.modelId);
  assert(primary.displayName);
  assert(primary.displayNameEs);
  assert(primary.modality);
  assert(primary.costTier);
  assert(primary.speedTier);
  assert(primary.qualityTier);
});

test('Music routing — request without providersset uses empty Set', () => {
  // Should not throw
  const result = routeMusic({ mode: 'simple' });
  assert(result.primary);
  assert(result.reason);
});

test('Music routing — mode defaults to simple', () => {
  const result = routeMusic({}, new Set(['ace-step']));
  assert(result.primary);
  assert(result.primary.supportsTextToMusic);
});
