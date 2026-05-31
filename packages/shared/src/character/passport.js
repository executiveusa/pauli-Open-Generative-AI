import { ConsentStatuses } from '../types/core.js';

/**
 * Character Passport — schema and validation.
 * Injected into every scene prompt for consistent characters.
 */

/**
 * Creates a default CharacterPassport object.
 * @param {object} partial
 * @returns {object} CharacterPassport
 */
export function makeCharacterPassport(partial = {}) {
  const ts = new Date().toISOString();
  return {
    id: partial.id ?? `character_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    displayName: partial.displayName ?? '',
    ownerUserId: partial.ownerUserId ?? '',
    organizationId: partial.organizationId ?? null,
    workspaceId: partial.workspaceId ?? null,
    createdByUserId: partial.createdByUserId ?? partial.ownerUserId ?? null,
    projectId: partial.projectId ?? null,
    consentStatus: partial.consentStatus ?? 'unknown',
    minorFlag: partial.minorFlag ?? false,
    politicalLikenessFlag: partial.politicalLikenessFlag ?? false,
    referenceImages: partial.referenceImages ?? [],
    referenceVideo: partial.referenceVideo ?? null,
    promptAnchor: partial.promptAnchor ?? '',
    negativePromptAnchor: partial.negativePromptAnchor ?? '',
    triggerWords: partial.triggerWords ?? [],
    loras: (partial.loras ?? []).map(normalizeLora),
    seedPolicy: partial.seedPolicy ?? {
      baseSeed: 42,
      sceneSeedStrategy: 'hash-scene',
    },
    continuityRules: partial.continuityRules ?? {
      face: '',
      hair: null,
      wardrobe: '',
      colors: [],
      bodyType: null,
      locationAnchors: [],
      forbiddenChanges: [],
    },
    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

function normalizeLora(l) {
  return {
    provider: l.provider ?? 'other',
    assetId: l.assetId ?? '',
    triggerWord: l.triggerWord ?? null,
    defaultStrength: l.defaultStrength ?? 0.8,
    firstPassStrength: l.firstPassStrength ?? null,
    secondPassStrength: l.secondPassStrength ?? null,
    notes: l.notes ?? null,
  };
}

/**
 * Validates a CharacterPassport has the minimum required fields.
 * @param {object} passport
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassport(passport) {
  const errors = [];
  if (!passport || typeof passport !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!passport.id) errors.push('missing id');
  if (!passport.displayName) errors.push('missing displayName');
  if (!passport.ownerUserId) errors.push('missing ownerUserId');
  if (!ConsentStatuses.includes(passport.consentStatus)) {
    errors.push(`invalid consentStatus: ${passport.consentStatus}`);
  }
  if (!passport.promptAnchor) errors.push('missing promptAnchor');
  if (!Array.isArray(passport.triggerWords)) errors.push('triggerWords must be array');
  if (!passport.seedPolicy?.sceneSeedStrategy) errors.push('missing seedPolicy.sceneSeedStrategy');
  return { valid: errors.length === 0, errors };
}

/**
 * Derives a deterministic scene seed from a character's base seed and scene ID.
 * @param {object} passport
 * @param {string} sceneId
 * @returns {number}
 */
export function deriveSeed(passport, sceneId) {
  const { baseSeed, sceneSeedStrategy } = passport.seedPolicy ?? {};
  if (sceneSeedStrategy === 'fixed') return baseSeed ?? 42;
  if (sceneSeedStrategy === 'random-with-lock') return Math.floor(Math.random() * 999999);

  // hash-scene: deterministic from baseSeed + sceneId string
  let hash = (baseSeed ?? 42);
  for (let i = 0; i < (sceneId ?? '').length; i++) {
    hash = ((hash << 5) - hash) + sceneId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 999999;
}

/**
 * Builds the character portion of a scene prompt from a passport.
 * @param {object} passport
 * @returns {{ anchor: string, triggers: string, negative: string }}
 */
export function passportToPromptFragments(passport) {
  const triggers = (passport.triggerWords ?? []).filter(Boolean).join(', ');
  const anchor = [passport.promptAnchor, triggers].filter(Boolean).join(', ');
  return {
    anchor,
    triggers,
    negative: passport.negativePromptAnchor ?? '',
  };
}
