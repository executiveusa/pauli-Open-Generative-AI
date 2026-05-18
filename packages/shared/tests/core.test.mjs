import test from 'node:test';
import assert from 'node:assert/strict';

import {
  makeProject, makeAsset, makeMediaJob, validate,
  newId, MediaJobStatuses
} from '../src/types/core.js';

import {
  canTransition, assertTransition, nextStates, isTerminal,
  applyTransition, ALL_STATUSES, TERMINAL_STATES
} from '../src/jobs/mediaJobState.js';

import { selectProvider } from '../src/model-routing/selectProvider.js';
import { makeStubRoute, validateRoute } from '../src/model-routing/types.js';

import {
  makeCharacterPassport, validatePassport, deriveSeed,
  passportToPromptFragments
} from '../src/character/passport.js';

import {
  buildScenePrompt, continuityCCheck
} from '../src/prompts/musicVideoPromptBuilder.js';

// ── Types ───────────────────────────────────────────────────────────────────

test('makeProject creates with defaults', () => {
  const p = makeProject({ ownerUserId: 'u1', name: 'Test' });
  assert.ok(p.id.startsWith('project_'));
  assert.equal(p.name, 'Test');
  assert.ok(p.createdAt);
});

test('makeAsset creates with provenance defaults', () => {
  const a = makeAsset({ projectId: 'p1', storagePath: '/s/f.mp3' });
  assert.equal(a.provenance.source, 'user-upload');
  assert.equal(a.provenance.rightsStatus, 'unknown');
});

test('makeMediaJob defaults to created status', () => {
  const j = makeMediaJob({ projectId: 'p1', type: 'mix-master' });
  assert.equal(j.status, 'created');
  assert.equal(j.progress, 0);
  assert.equal(j.type, 'mix-master');
});

test('validate returns errors for missing fields', () => {
  const r = validate({ name: 'ok' }, ['name', 'id']);
  assert.equal(r.valid, false);
  assert.ok(r.errors.some(e => e.includes('id')));
});

test('newId is unique per call', () => {
  const a = newId('test');
  const b = newId('test');
  assert.notEqual(a, b);
});

// ── State Machine ────────────────────────────────────────────────────────────

test('valid transitions return true', () => {
  assert.equal(canTransition('created', 'queued'), true);
  assert.equal(canTransition('queued', 'running'), true);
  assert.equal(canTransition('running', 'waiting_for_provider'), true);
  assert.equal(canTransition('waiting_for_provider', 'running'), true);
  assert.equal(canTransition('running', 'stitching'), true);
  assert.equal(canTransition('stitching', 'succeeded'), true);
  assert.equal(canTransition('running', 'failed'), true);
  assert.equal(canTransition('running', 'cancelled'), true);
});

test('invalid transitions return false', () => {
  assert.equal(canTransition('succeeded', 'running'), false);
  assert.equal(canTransition('failed', 'running'), false);
  assert.equal(canTransition('cancelled', 'queued'), false);
  assert.equal(canTransition('created', 'succeeded'), false);
});

test('assertTransition throws on invalid', () => {
  assert.throws(() => assertTransition('succeeded', 'running'), /Invalid job state/);
});

test('terminal states cannot transition', () => {
  for (const s of ['succeeded', 'failed', 'cancelled']) {
    assert.equal(nextStates(s).length, 0, `${s} should have no next states`);
    assert.equal(isTerminal(s), true);
  }
});

test('non-terminal states are not terminal', () => {
  assert.equal(isTerminal('running'), false);
  assert.equal(isTerminal('queued'), false);
});

test('applyTransition returns updated job without mutation', () => {
  const job = makeMediaJob({ projectId: 'p1' });
  const updated = applyTransition(job, 'queued', { message: 'now queued' });
  assert.equal(updated.status, 'queued');
  assert.equal(updated.message, 'now queued');
  assert.equal(job.status, 'created'); // original not mutated
});

test('all statuses covered in ALL_STATUSES', () => {
  for (const s of MediaJobStatuses) {
    assert.ok(ALL_STATUSES.includes(s), `missing: ${s}`);
  }
});

// ── Provider Routing ─────────────────────────────────────────────────────────

const sampleRoutes = [
  { id: 'local1', capability: 'text-to-video', provider: 'local', modelId: 'ltx-local',
    requiresGpu: true, estimatedCost: 'free', enabled: true,
    supportsReferenceImages: true, supportsLoRA: true, supportsSeed: true },
  { id: 'hf1', capability: 'text-to-video', provider: 'huggingface', modelId: 'hf-ltx',
    requiresGpu: false, estimatedCost: 'free', enabled: true,
    supportsReferenceImages: false, supportsLoRA: false, supportsSeed: true },
  { id: 'fal1', capability: 'text-to-video', provider: 'fal', modelId: 'fal-ltx',
    requiresGpu: false, estimatedCost: 'high', enabled: true,
    supportsReferenceImages: true, supportsLoRA: true, supportsSeed: true },
  { id: 'stub1', capability: 'text-to-video', provider: 'stub', modelId: 'stub',
    requiresGpu: false, estimatedCost: 'free', enabled: true,
    supportsReferenceImages: true, supportsLoRA: false, supportsSeed: true },
];

test('local preferred when GPU available', () => {
  const r = selectProvider(sampleRoutes, {
    capability: 'text-to-video', allowPaid: true,
    enabledProviders: ['local', 'huggingface', 'fal', 'stub'],
    hasLocalGpu: true,
  });
  assert.equal(r.route.provider, 'local');
});

test('local skipped without GPU', () => {
  const r = selectProvider(sampleRoutes, {
    capability: 'text-to-video', allowPaid: false,
    enabledProviders: ['local', 'huggingface', 'stub'],
    hasLocalGpu: false,
  });
  assert.equal(r.route.provider, 'huggingface');
});

test('fal blocked when allowPaid false', () => {
  const r = selectProvider(sampleRoutes, {
    capability: 'text-to-video', allowPaid: false,
    enabledProviders: ['fal', 'stub'],
    hasLocalGpu: false,
  });
  assert.equal(r.route.provider, 'stub');
});

test('fal used when allowPaid true', () => {
  const fal = sampleRoutes.find(r => r.provider === 'fal');
  const r = selectProvider([fal], {
    capability: 'text-to-video', allowPaid: true,
    enabledProviders: ['fal'],
    hasLocalGpu: false,
  });
  assert.equal(r.route.provider, 'fal');
});

test('stub fallback when no eligible providers', () => {
  const r = selectProvider([], {
    capability: 'text-to-video', allowPaid: false,
    enabledProviders: ['stub'],
    hasLocalGpu: false,
  });
  assert.equal(r.route.provider, 'stub');
  assert.match(r.reason, /stub fallback/);
});

test('disabled providers never selected', () => {
  const disabled = sampleRoutes.map(r => ({ ...r, enabled: r.provider !== 'stub' ? false : true }));
  const r = selectProvider(disabled, {
    capability: 'text-to-video', allowPaid: true,
    enabledProviders: ['local', 'huggingface', 'fal', 'stub'],
    hasLocalGpu: true,
  });
  assert.equal(r.route.provider, 'stub');
});

test('makeStubRoute returns valid stub', () => {
  const s = makeStubRoute('visualizer');
  assert.equal(s.provider, 'stub');
  assert.equal(s.capability, 'visualizer');
  assert.equal(s.enabled, true);
});

test('validateRoute catches missing fields', () => {
  const r = validateRoute({ id: 'x', capability: 'text-to-video' });
  assert.equal(r.valid, false);
  assert.ok(r.errors.some(e => e.includes('provider')));
});

test('LoRA filter excludes routes without LoRA support', () => {
  const r = selectProvider(sampleRoutes, {
    capability: 'text-to-video', allowPaid: false,
    enabledProviders: ['huggingface', 'stub'],
    requiresLoRA: true,
    hasLocalGpu: false,
  });
  // HF has supportsLoRA:false, stub has supportsLoRA:false → stub fallback
  assert.ok(['stub'].includes(r.route.provider));
});

// ── Character Passport ───────────────────────────────────────────────────────

test('makeCharacterPassport creates valid defaults', () => {
  const p = makeCharacterPassport({ displayName: 'Artist', ownerUserId: 'u1', promptAnchor: 'same face' });
  const { valid } = validatePassport(p);
  assert.equal(valid, true);
});

test('validatePassport rejects missing promptAnchor', () => {
  const p = makeCharacterPassport({ displayName: 'X', ownerUserId: 'u1' });
  p.promptAnchor = '';
  const { valid, errors } = validatePassport(p);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('promptAnchor')));
});

test('deriveSeed fixed strategy always same', () => {
  const p = makeCharacterPassport({ seedPolicy: { baseSeed: 100, sceneSeedStrategy: 'fixed' } });
  assert.equal(deriveSeed(p, 'scene_001'), 100);
  assert.equal(deriveSeed(p, 'scene_002'), 100);
});

test('deriveSeed hash-scene is deterministic', () => {
  const p = makeCharacterPassport({ seedPolicy: { baseSeed: 42, sceneSeedStrategy: 'hash-scene' } });
  const s1 = deriveSeed(p, 'scene_001');
  const s2 = deriveSeed(p, 'scene_001');
  assert.equal(s1, s2);
  const s3 = deriveSeed(p, 'scene_002');
  assert.notEqual(s1, s3); // different scenes → different seeds
});

test('passportToPromptFragments includes anchor and triggers', () => {
  const p = makeCharacterPassport({
    promptAnchor: 'young artist, dark skin',
    triggerWords: ['mol_artist01'],
    negativePromptAnchor: 'blurry face',
  });
  const f = passportToPromptFragments(p);
  assert.match(f.anchor, /young artist/);
  assert.match(f.anchor, /mol_artist01/);
  assert.equal(f.negative, 'blurry face');
});

// ── Prompt Builder ───────────────────────────────────────────────────────────

test('buildScenePrompt includes character anchor', () => {
  const out = buildScenePrompt({
    scene: { sceneId: 's1', visualPrompt: 'night city rooftop', seed: 12 },
    characterPassports: [{
      promptAnchor: 'same artist face, dark skin',
      triggerWords: ['mol_artist'],
      negativePromptAnchor: 'blurry',
      seedPolicy: { baseSeed: 42, sceneSeedStrategy: 'fixed' },
    }],
  });
  assert.match(out.positivePrompt, /night city rooftop/);
  assert.match(out.positivePrompt, /same artist face/);
  assert.match(out.positivePrompt, /mol_artist/);
  assert.match(out.negativePrompt, /blurry/);
  assert.equal(out.seed, 12);
});

test('buildScenePrompt seed defaults to derived from passport', () => {
  const passport = makeCharacterPassport({
    displayName: 'Test', ownerUserId: 'u1',
    promptAnchor: 'anchor',
    seedPolicy: { baseSeed: 999, sceneSeedStrategy: 'hash-scene' },
  });
  const out = buildScenePrompt({
    scene: { sceneId: 'scene_001', visualPrompt: 'close-up' },
    characterPassports: [passport],
  });
  assert.ok(out.seed > 0);
});

test('buildScenePrompt is deterministic with same inputs', () => {
  const passport = makeCharacterPassport({
    displayName: 'Test', ownerUserId: 'u1',
    promptAnchor: 'test anchor',
    triggerWords: ['tok1'],
    seedPolicy: { baseSeed: 42, sceneSeedStrategy: 'hash-scene' },
  });
  const scene = { sceneId: 'scene_003', visualPrompt: 'sunset', location: 'rooftop' };
  const a = buildScenePrompt({ scene, characterPassports: [passport] });
  const b = buildScenePrompt({ scene, characterPassports: [passport] });
  assert.equal(a.positivePrompt, b.positivePrompt);
  assert.equal(a.seed, b.seed);
});

test('buildScenePrompt includes location and camera motion', () => {
  const out = buildScenePrompt({
    scene: { sceneId: 's2', visualPrompt: 'stage', location: 'concert hall', cameraMotion: 'slow push-in' },
    characterPassports: [],
  });
  assert.match(out.positivePrompt, /concert hall/);
  assert.match(out.positivePrompt, /slow push-in/);
});

test('buildScenePrompt does not include undefined text', () => {
  const out = buildScenePrompt({
    scene: { sceneId: 's3', visualPrompt: 'alley' },
    characterPassports: [],
  });
  assert.ok(!out.positivePrompt.includes('undefined'));
  assert.ok(!out.negativePrompt.includes('undefined'));
  assert.ok(!out.positivePrompt.includes('null'));
});

test('continuityCCheck returns warnings for incomplete scene', () => {
  const warnings = continuityCCheck(
    { sceneId: 's1', visualPrompt: 'x', characterIds: [] },
    []
  );
  assert.ok(warnings.some(w => w.includes('characterIds')));
});

test('providerRoute info injected into providerHints', () => {
  const out = buildScenePrompt({
    scene: { sceneId: 's4', visualPrompt: 'x', seed: 1 },
    characterPassports: [],
    providerRoute: { provider: 'fal', modelId: 'fal-ltx' },
  });
  assert.equal(out.providerHints.provider, 'fal');
  assert.equal(out.providerHints.modelId, 'fal-ltx');
});
