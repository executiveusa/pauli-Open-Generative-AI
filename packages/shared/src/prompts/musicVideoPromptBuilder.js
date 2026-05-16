import { passportToPromptFragments, deriveSeed } from '../character/passport.js';

/**
 * Builds deterministic prompts for a music video scene.
 * Injects Character Passport anchors, triggers, location, motion, and emotion.
 *
 * @param {object} params
 * @param {object} params.scene
 * @param {object[]} params.characterPassports
 * @param {object} [params.stylePack]
 * @param {object} [params.advancedSettings]
 * @param {object} [params.providerRoute]
 * @returns {{ positivePrompt: string, negativePrompt: string, seed: number, providerHints: object }}
 */
export function buildScenePrompt({ scene, characterPassports = [], stylePack = {}, advancedSettings = {}, providerRoute = null }) {
  const parts = [];
  const negativeParts = [];

  if (scene.visualPrompt) parts.push(scene.visualPrompt);
  if (stylePack.style) parts.push(stylePack.style);
  if (stylePack.theme) parts.push(stylePack.theme);
  if (stylePack.mood) parts.push(stylePack.mood);
  if (scene.location) parts.push(`location: ${scene.location}`);
  if (scene.cameraMotion) parts.push(`camera: ${scene.cameraMotion}`);
  if (scene.characterMotion) parts.push(`motion: ${scene.characterMotion}`);
  if (scene.emotion) parts.push(`emotion: ${scene.emotion}`);
  if (scene.lyricsFragment) parts.push(`mood: "${scene.lyricsFragment}"`);

  for (const passport of characterPassports) {
    const { anchor, negative } = passportToPromptFragments(passport);
    if (anchor) parts.push(anchor);
    if (negative) negativeParts.push(negative);
  }

  if (scene.negativePrompt) negativeParts.push(scene.negativePrompt);
  if (advancedSettings.negativeBase) negativeParts.push(advancedSettings.negativeBase);
  negativeParts.push('blurry, distorted, watermark, low quality, jpeg artifacts');

  let seed = scene.seed ?? 1;
  if (characterPassports.length > 0 && seed === 1) {
    seed = deriveSeed(characterPassports[0], scene.sceneId ?? 'scene');
  }

  const providerHints = {
    sceneId: scene.sceneId ?? null,
    index: scene.index ?? null,
    startSeconds: scene.startSeconds ?? null,
    endSeconds: scene.endSeconds ?? null,
    durationSeconds: scene.durationSeconds ?? null,
  };
  if (providerRoute) {
    providerHints.provider = providerRoute.provider;
    providerHints.modelId = providerRoute.modelId;
  }

  return {
    positivePrompt: parts.filter(Boolean).join(', '),
    negativePrompt: negativeParts.filter(Boolean).join(', '),
    seed,
    providerHints,
  };
}

/**
 * Validates scene+passport continuity, returns warnings.
 * @param {object} scene
 * @param {object[]} passports
 * @returns {string[]} warnings
 */
export function continuityCCheck(scene, passports) {
  const warnings = [];
  if (!scene.sceneId) warnings.push('scene missing sceneId');
  if (!scene.visualPrompt) warnings.push('scene missing visualPrompt');
  if ((scene.characterIds ?? []).length === 0) warnings.push('scene has no characterIds');
  if (!scene.seed) warnings.push('scene missing seed');
  for (const p of passports) {
    if (!p.promptAnchor) warnings.push(`character '${p.displayName}' missing promptAnchor`);
    if ((p.triggerWords ?? []).length === 0) warnings.push(`character '${p.displayName}' has no triggerWords`);
  }
  return warnings;
}
