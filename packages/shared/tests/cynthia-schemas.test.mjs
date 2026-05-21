import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  makeCharacterPassport,
  validateCharacterPassport,
  makeStoryboard,
  validateStoryboard,
  makeShot,
  validateShot,
  makeConsentRecord,
  validateConsentRecord,
  CAMERA_PRESETS,
  MOTION_PRESETS,
  ROUTING_MODES,
  LATAM_LOCALES,
} from '../src/schemas/cynthia.js';

describe('CharacterPassport', () => {
  test('makeCharacterPassport creates a valid object with defaults', () => {
    const p = makeCharacterPassport({ publicName: 'Valentina', locale: 'es-MX', ownerUserId: 'u1' });
    assert.ok(p.id, 'id should be set');
    assert.equal(p.publicName, 'Valentina');
    assert.equal(p.locale, 'es-MX');
    assert.equal(p.ownerUserId, 'u1');
    assert.equal(p.archetype, 'protagonist');
    assert.equal(p.ageBand, 'adult');
    assert.equal(p.speechRegister, 'informal');
    assert.ok(Array.isArray(p.personalityTraits), 'personalityTraits should be array');
    assert.ok(Array.isArray(p.referenceAssets), 'referenceAssets should be array');
    assert.ok(Array.isArray(p.safetyFlags), 'safetyFlags should be array');
    assert.ok(typeof p.continuityLocks === 'object', 'continuityLocks should be object');
    assert.equal(p.continuityLocks.face, true);
    assert.ok(typeof p.rights === 'object', 'rights should be object');
    assert.equal(p.rights.isMinor, false);
    assert.ok(p.createdAt, 'createdAt should be set');
    assert.ok(p.updatedAt, 'updatedAt should be set');
  });

  test('makeCharacterPassport accepts partial overrides', () => {
    const p = makeCharacterPassport({
      publicName: 'Diego',
      locale: 'es-CO',
      ownerUserId: 'u2',
      archetype: 'villain',
      ageBand: 'teen',
      speechRegister: 'street',
      personalityTraits: ['cunning', 'sarcastic'],
      continuityLocks: { face: true, hair: false, wardrobe: true, bodyType: false },
      rights: { isMinor: true, isPoliticalFigure: false, consentStatus: 'unknown', commercialUse: false, likenessTrainingAllowed: false, voiceCloningAllowed: false, revocationContact: null, expiresAt: null },
    });
    assert.equal(p.archetype, 'villain');
    assert.equal(p.ageBand, 'teen');
    assert.equal(p.speechRegister, 'street');
    assert.deepEqual(p.personalityTraits, ['cunning', 'sarcastic']);
    assert.equal(p.continuityLocks.hair, false);
    assert.equal(p.rights.isMinor, true);
  });

  test('validateCharacterPassport passes a valid object', () => {
    const p = makeCharacterPassport({ publicName: 'Valentina', locale: 'es-MX', ownerUserId: 'u1' });
    const result = validateCharacterPassport(p);
    assert.equal(result.valid, true, `Should be valid. Errors: ${result.errors.join(', ')}`);
    assert.equal(result.errors.length, 0);
  });

  test('validateCharacterPassport fails when publicName missing', () => {
    const p = makeCharacterPassport({ ownerUserId: 'u1', locale: 'es-MX' });
    p.publicName = '';
    const result = validateCharacterPassport(p);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('publicName')), `Expected publicName error, got: ${result.errors.join(', ')}`);
  });

  test('validateCharacterPassport fails when ownerUserId missing', () => {
    const p = makeCharacterPassport({ publicName: 'Test', locale: 'es-MX' });
    p.ownerUserId = '';
    const result = validateCharacterPassport(p);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('ownerUserId')), `Expected ownerUserId error, got: ${result.errors.join(', ')}`);
  });

  test('validateCharacterPassport fails with invalid archetype', () => {
    const p = makeCharacterPassport({ publicName: 'Test', locale: 'es-MX', ownerUserId: 'u1' });
    p.archetype = 'not-a-real-archetype';
    const result = validateCharacterPassport(p);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('archetype')), `Expected archetype error, got: ${result.errors.join(', ')}`);
  });

  test('validateCharacterPassport fails when not an object', () => {
    const result = validateCharacterPassport(null);
    assert.equal(result.valid, false);
  });
});

describe('Storyboard', () => {
  test('makeStoryboard creates a valid object with defaults', () => {
    const s = makeStoryboard({ title: 'Spot 30s', ownerUserId: 'u1' });
    assert.ok(s.id, 'id should be set');
    assert.equal(s.title, 'Spot 30s');
    assert.equal(s.language, 'es');
    assert.equal(s.locale, 'es-MX');
    assert.equal(s.targetAspectRatio, '16:9');
    assert.equal(s.continuityMode, 'strict');
    assert.equal(s.status, 'draft');
    assert.ok(Array.isArray(s.characterIds));
    assert.ok(Array.isArray(s.locationIds));
    assert.ok(Array.isArray(s.shotIds));
  });

  test('validateStoryboard passes a valid object', () => {
    const s = makeStoryboard({ title: 'Test', ownerUserId: 'u1' });
    const result = validateStoryboard(s);
    assert.equal(result.valid, true, `Should be valid. Errors: ${result.errors.join(', ')}`);
  });

  test('validateStoryboard fails with invalid aspectRatio', () => {
    const s = makeStoryboard({ title: 'Test', ownerUserId: 'u1' });
    s.targetAspectRatio = '3:2';
    const result = validateStoryboard(s);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('targetAspectRatio')));
  });

  test('validateStoryboard fails with invalid language', () => {
    const s = makeStoryboard({ title: 'Test', ownerUserId: 'u1' });
    s.language = 'fr';
    const result = validateStoryboard(s);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('language')));
  });
});

describe('Shot', () => {
  test('makeShot creates a valid object with defaults', () => {
    const shot = makeShot({ storyboardId: 'sb1', order: 0 });
    assert.ok(shot.id, 'id should be set');
    assert.equal(shot.storyboardId, 'sb1');
    assert.equal(shot.order, 0);
    assert.equal(shot.cameraPreset, 'medium-shot');
    assert.equal(shot.motionPreset, 'subtle-breathing');
    assert.ok(Array.isArray(shot.characterIds));
    assert.ok(typeof shot.continuityLocks === 'object');
    assert.equal(shot.continuityLocks.face, true);
  });

  test('validateShot passes a valid object', () => {
    const shot = makeShot({ storyboardId: 'sb1', order: 0 });
    const result = validateShot(shot);
    assert.equal(result.valid, true, `Should be valid. Errors: ${result.errors.join(', ')}`);
  });

  test('validateShot fails when storyboardId missing', () => {
    const shot = makeShot({ order: 0 });
    shot.storyboardId = '';
    const result = validateShot(shot);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('storyboardId')));
  });

  test('validateShot fails with invalid cameraPreset', () => {
    const shot = makeShot({ storyboardId: 'sb1', order: 0 });
    shot.cameraPreset = 'not-real-preset';
    const result = validateShot(shot);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('cameraPreset')));
  });
});

describe('ConsentRecord', () => {
  test('makeConsentRecord creates a valid object with defaults', () => {
    const c = makeConsentRecord({ characterId: 'ch1', ownerUserId: 'u1' });
    assert.ok(c.id, 'id should be set');
    assert.equal(c.characterId, 'ch1');
    assert.equal(c.ownerUserId, 'u1');
    assert.equal(c.identityConsent, false);
    assert.equal(c.voiceConsent, false);
    assert.equal(c.commercialLicense, false);
    assert.equal(c.trainingAllowed, false);
    assert.equal(c.isMinor, false);
    assert.equal(c.isPoliticalFigure, false);
    assert.ok(c.createdAt);
  });

  test('validateConsentRecord passes a valid object', () => {
    const c = makeConsentRecord({ characterId: 'ch1', ownerUserId: 'u1' });
    const result = validateConsentRecord(c);
    assert.equal(result.valid, true, `Should be valid. Errors: ${result.errors.join(', ')}`);
  });

  test('validateConsentRecord fails when characterId missing', () => {
    const c = makeConsentRecord({ ownerUserId: 'u1' });
    c.characterId = '';
    const result = validateConsentRecord(c);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('characterId')));
  });

  test('validateConsentRecord fails when identityConsent is not boolean', () => {
    const c = makeConsentRecord({ characterId: 'ch1', ownerUserId: 'u1' });
    c.identityConsent = 'yes'; // invalid
    const result = validateConsentRecord(c);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('identityConsent')));
  });
});

describe('CAMERA_PRESETS', () => {
  test('has all 14 required presets', () => {
    const expectedKeys = [
      'close-up',
      'medium-shot',
      'wide-shot',
      'handheld-documentary',
      'dolly-in',
      'dolly-out',
      'orbit',
      'crane-up',
      'tracking-shot',
      'over-the-shoulder',
      'telenovela-dramatic-push-in',
      'music-video-handheld',
      'social-ad-product-reveal',
      'documentary-street-realism',
    ];
    assert.equal(Object.keys(CAMERA_PRESETS).length, 14, `Expected 14 presets, got ${Object.keys(CAMERA_PRESETS).length}`);
    for (const key of expectedKeys) {
      assert.ok(CAMERA_PRESETS[key], `Missing camera preset: ${key}`);
      assert.ok(CAMERA_PRESETS[key].displayName, `Missing displayName for: ${key}`);
      assert.ok(CAMERA_PRESETS[key].displayNameEs, `Missing displayNameEs for: ${key}`);
    }
  });
});

describe('MOTION_PRESETS', () => {
  test('has all 10 required presets', () => {
    const expectedKeys = [
      'subtle-breathing',
      'natural-walk',
      'dramatic-reveal',
      'slow-emotional-turn',
      'action-chase',
      'romantic-pause',
      'product-reveal',
      'dialogue-delivery',
      'crowd-movement',
      'cinematic-transition',
    ];
    assert.equal(Object.keys(MOTION_PRESETS).length, 10, `Expected 10 presets, got ${Object.keys(MOTION_PRESETS).length}`);
    for (const key of expectedKeys) {
      assert.ok(MOTION_PRESETS[key], `Missing motion preset: ${key}`);
      assert.ok(MOTION_PRESETS[key].displayName, `Missing displayName for: ${key}`);
      assert.ok(MOTION_PRESETS[key].displayNameEs, `Missing displayNameEs for: ${key}`);
    }
  });
});

describe('ROUTING_MODES', () => {
  test('has all 10 routing modes', () => {
    assert.equal(ROUTING_MODES.length, 10, `Expected 10 routing modes, got ${ROUTING_MODES.length}`);
    for (const mode of ROUTING_MODES) {
      assert.ok(mode.id, `Missing id in routing mode`);
      assert.ok(mode.name, `Missing name in routing mode ${mode.id}`);
      assert.ok(mode.nameEs, `Missing nameEs in routing mode ${mode.id}`);
    }
  });
});

describe('LATAM_LOCALES', () => {
  test('has 7 locale entries including disabled pt-BR', () => {
    assert.equal(LATAM_LOCALES.length, 7);
    const ptBR = LATAM_LOCALES.find(l => l.locale === 'pt-BR');
    assert.ok(ptBR, 'pt-BR should exist');
    assert.equal(ptBR.is_enabled, false, 'pt-BR should be disabled');

    const esMX = LATAM_LOCALES.find(l => l.locale === 'es-MX');
    assert.ok(esMX, 'es-MX should exist');
    assert.equal(esMX.is_enabled, true);
  });
});
