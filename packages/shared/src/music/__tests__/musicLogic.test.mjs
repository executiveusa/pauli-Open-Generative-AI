import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLocalePreset,
  getBpmRange,
  getProviderChain,
} from '../localePresets.js';
import {
  buildProviderRoute,
  validateLocaleRequest,
} from '../localeRouting.js';
import {
  validateMusicRights,
  getRightsRecommendations,
  getRequiredConsents,
} from '../rightsValidation.js';
import {
  canGenerateInFreeTier,
  getRemainingQuota,
  calculateUsageAfter,
} from '../freeTierLimits.js';
import {
  buildVideoPromptFromMusic,
  suggestVisualStyles,
} from '../musicVideoSession.js';
import {
  checkArtifactAccess,
  filterArtifactsByTags,
  sortArtifacts,
} from '../multiTenantLibrary.js';

// Locale Presets Tests
test('localePresets — getLocalePreset returns valid presets', () => {
  const usPreset = getLocalePreset('en-US');
  assert(usPreset.language === 'en');
  assert(usPreset.defaultBpm > 0);
  assert(Array.isArray(usPreset.genres));

  const brPreset = getLocalePreset('pt-BR');
  assert(brPreset.language === 'pt');
  assert(brPreset.genres.includes('samba'));
});

test('localePresets — getBpmRange returns valid ranges', () => {
  const [min, max] = getBpmRange('en-US');
  assert(min < max);
  assert(min >= 40);
  assert(max <= 300);
});

test('localePresets — getProviderChain filters by availability', () => {
  const chain = getProviderChain('en-US', ['ace-step']);
  assert(chain[0] === 'ace-step');
  assert(!chain.includes('elevenlabs-music'));
});

// Routing Tests
test('localeRouting — buildProviderRoute selects primary provider', () => {
  const route = buildProviderRoute(
    { locale: 'es-MX' },
    ['ace-step', 'open-music']
  );
  assert(route.primary);
  assert(route.fallbacks);
  assert(route.reason === 'locale_optimized');
});

test('localeRouting — validateLocaleRequest detects BPM violations', () => {
  const request = {
    locale: 'pt-BR',
    bpm: 300, // Above pt-BR max of 170
    mode: 'simple',
  };
  const result = validateLocaleRequest(request);
  assert(!result.valid);
  assert(result.violations.some(v => v.field === 'bpm'));
});

test('localeRouting — validateLocaleRequest allows valid requests', () => {
  const request = {
    locale: 'en-US',
    bpm: 120,
    mode: 'simple',
  };
  const result = validateLocaleRequest(request);
  assert(result.valid);
});

// Rights Validation Tests
test('rightsValidation — validateMusicRights allows simple generation', () => {
  const request = { mode: 'simple', rightsIntent: 'original' };
  const result = validateMusicRights(request);
  assert(result.valid);
});

test('rightsValidation — validateMusicRights blocks voice clone without consent', () => {
  const request = { vocalStyle: 'clone' };
  const result = validateMusicRights(request);
  assert(!result.valid);
  assert(result.violations.some(v => v.field === 'vocalStyle'));
});

test('rightsValidation — getRequiredConsents for cover mode', () => {
  const request = { mode: 'cover' };
  const consents = getRequiredConsents(request);
  assert(consents.length > 0);
  assert(consents.some(c => c.type === 'commercial_consent'));
  assert(consents.some(c => c.type === 'artist_credit'));
});

test('rightsValidation — getRightsRecommendations differs by intent', () => {
  const recsOriginal = getRightsRecommendations('original');
  const recsCover = getRightsRecommendations('cover');
  assert(!recsOriginal.join(' ').includes('license'));
  assert(recsCover.join(' ').includes('license'));
});

// Free Tier Tests
test('freeTierLimits — canGenerateInFreeTier allows valid request', () => {
  const usage = { generationsUsed: 0, minutesUsed: 0 };
  const request = { durationSeconds: 30, mode: 'simple', language: 'en' };
  const result = canGenerateInFreeTier(usage, request);
  assert(result.allowed);
});

test('freeTierLimits — canGenerateInFreeTier blocks exceeded generations', () => {
  const usage = { generationsUsed: 10, minutesUsed: 30 };
  const request = { durationSeconds: 30, mode: 'simple', language: 'en' };
  const result = canGenerateInFreeTier(usage, request);
  assert(!result.allowed);
  assert(result.reason === 'monthly_limit_exceeded');
});

test('freeTierLimits — canGenerateInFreeTier blocks unsupported mode', () => {
  const usage = { generationsUsed: 0, minutesUsed: 0 };
  const request = { durationSeconds: 30, mode: 'remix', language: 'en' };
  const result = canGenerateInFreeTier(usage, request);
  assert(!result.allowed);
  assert(result.reason === 'mode_not_supported');
});

test('freeTierLimits — getRemainingQuota calculates correctly', () => {
  const usage = { generationsUsed: 3, minutesUsed: 15 };
  const quota = getRemainingQuota(usage);
  assert(quota.generationsRemaining === 7);
  assert(quota.percentUsed === 30);
});

test('freeTierLimits — calculateUsageAfter increments correctly', () => {
  const usage = { generationsUsed: 2, minutesUsed: 10 };
  const request = { durationSeconds: 60 };
  const updated = calculateUsageAfter(usage, request);
  assert(updated.generationsUsed === 3);
  assert(updated.minutesUsed === 11);
});

// Music Video Tests
test('musicVideoSession — buildVideoPromptFromMusic generates prompt', () => {
  const artifact = { prompt: 'upbeat electronic', bpm: 120, durationSeconds: 60 };
  const prompt = buildVideoPromptFromMusic(artifact, 'en');
  assert(prompt.includes('upbeat electronic'));
  assert(prompt.includes('60 seconds'));
});

test('musicVideoSession — suggestVisualStyles varies by genre', () => {
  const hiphop = { prompt: 'hip-hop beat' };
  const ambient = { prompt: 'ambient chill' };
  const stylesHiphop = suggestVisualStyles(hiphop);
  const stylesAmbient = suggestVisualStyles(ambient);
  assert(stylesHiphop.some(s => s.includes('urban')));
  assert(stylesAmbient.some(s => s.includes('ethereal')));
});

// Library Tests
test('multiTenantLibrary — checkArtifactAccess respects visibility', () => {
  const artifact = {};
  const privateEntry = { visibility: 'private', ownerId: 'user1', sharedWith: [] };
  const publicEntry = { visibility: 'public', ownerId: 'user1' };

  const privateAccess = checkArtifactAccess(artifact, privateEntry, 'user2');
  assert(!privateAccess.hasAccess);

  const publicAccess = checkArtifactAccess(artifact, publicEntry, 'user2');
  assert(publicAccess.hasAccess);
});

test('multiTenantLibrary — filterArtifactsByTags works correctly', () => {
  const artifacts = [
    { id: '1', tags: ['electronic', 'fast'] },
    { id: '2', tags: ['ambient', 'slow'] },
  ];
  const filtered = filterArtifactsByTags(artifacts, ['electronic']);
  assert(filtered.length === 1);
  assert(filtered[0].id === '1');
});

test('multiTenantLibrary — sortArtifacts by trending calculates score', () => {
  const artifacts = [
    { id: '1', viewCount: 10, remixCount: 0, favoriteCount: 0 },
    { id: '2', viewCount: 5, remixCount: 3, favoriteCount: 2 },
  ];
  const sorted = sortArtifacts(artifacts, 'trending');
  // Artifact 2: 5 + 3*2 + 2*3 = 17
  // Artifact 1: 10 + 0*2 + 0*3 = 10
  assert(sorted[0].id === '2');
});
