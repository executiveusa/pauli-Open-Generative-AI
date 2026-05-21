/**
 * Cynthia Studio — Extended Domain Schemas
 * All entities are plain JS objects. No TypeScript. No Zod.
 * Factory functions: make*()
 * Validators: validate*() — return { valid: boolean, errors: string[] }
 */

import { newId, now } from '../types/core.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ARCHETYPES = ['protagonist', 'villain', 'comic', 'mentor', 'sidekick', 'love-interest', 'antagonist', 'narrator'];
export const AGE_BANDS = ['child', 'teen', 'adult', 'elder'];
export const SPEECH_REGISTERS = ['formal', 'informal', 'street', 'telenovela'];
export const STORYBOARD_STATUSES = ['draft', 'ready', 'generating', 'done'];
export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5', '2.39:1'];
export const CONTINUITY_MODES = ['strict', 'loose', 'none'];
export const LOCATION_TYPES = ['interior', 'exterior', 'urban', 'rural', 'studio'];
export const JOB_TYPES = ['hero-frame', 'scene', 'video', 'lipsync', 'storyboard', 'evaluation'];
export const JOB_STATUSES = ['draft', 'queued', 'running', 'succeeded', 'failed', 'cancelled', 'needs_key', 'blocked_by_rights', 'blocked_by_safety'];
export const ARTIFACT_TYPES = ['image', 'video', 'audio', 'prompt', 'storyboard', 'reference', 'evaluation'];
export const EVALUATOR_TYPES = ['manual', 'rule-based', 'ai'];
export const CREDENTIAL_TYPES = ['api-key', 'oauth', 'byok'];
export const TEST_STATUSES = ['untested', 'ok', 'failed'];
export const MODALITIES = ['image', 'video', 'audio', 'lip_sync', 'storyboard'];
export const COST_TIERS = ['free', 'low', 'medium', 'high'];
export const SPEED_TIERS = ['instant', 'fast', 'normal', 'slow'];
export const QUALITY_TIERS = ['draft', 'standard', 'premium'];
export const ROUTING_MODES_IDS = ['auto-best', 'fast-draft', 'cheapest', 'highest-quality', 'best-character-consistency', 'best-latam-output', 'byok-only', 'cynthia-gateway', 'local-only', 'compare'];

// ---------------------------------------------------------------------------
// CAMERA_PRESETS
// ---------------------------------------------------------------------------

export const CAMERA_PRESETS = {
  'close-up': {
    id: 'close-up',
    displayName: 'Close-Up',
    displayNameEs: 'Primer Plano',
    description: 'Tight framing on the subject\'s face or object',
    framingType: 'CU',
    movement: 'static',
    suggestedFocalLength: '85mm',
    notes: 'Great for emotional moments and character reveals',
  },
  'medium-shot': {
    id: 'medium-shot',
    displayName: 'Medium Shot',
    displayNameEs: 'Plano Medio',
    description: 'Waist-up framing, ideal for dialogue',
    framingType: 'MS',
    movement: 'static',
    suggestedFocalLength: '50mm',
    notes: 'Standard interview and conversation shot',
  },
  'wide-shot': {
    id: 'wide-shot',
    displayName: 'Wide Shot',
    displayNameEs: 'Plano General',
    description: 'Full body and environment visible',
    framingType: 'WS',
    movement: 'static',
    suggestedFocalLength: '24mm',
    notes: 'Establishes location and character in space',
  },
  'handheld-documentary': {
    id: 'handheld-documentary',
    displayName: 'Handheld Documentary',
    displayNameEs: 'Documental en Mano',
    description: 'Handheld, slightly shaky, intimate and raw feel',
    framingType: 'MS',
    movement: 'handheld',
    suggestedFocalLength: '35mm',
    notes: 'Used for street, social content, reality feel',
  },
  'dolly-in': {
    id: 'dolly-in',
    displayName: 'Dolly In',
    displayNameEs: 'Travelling de Acercamiento',
    description: 'Camera moves toward subject, building intensity',
    framingType: 'MS',
    movement: 'dolly-in',
    suggestedFocalLength: '50mm',
    notes: 'Classic reveal and confrontation movement',
  },
  'dolly-out': {
    id: 'dolly-out',
    displayName: 'Dolly Out',
    displayNameEs: 'Travelling de Alejamiento',
    description: 'Camera pulls back to reveal context',
    framingType: 'WS',
    movement: 'dolly-out',
    suggestedFocalLength: '50mm',
    notes: 'Used for dramatic reveals and isolation',
  },
  'orbit': {
    id: 'orbit',
    displayName: 'Orbit / Arc Shot',
    displayNameEs: 'Órbita / Toma en Arco',
    description: 'Camera circles around subject 180 or 360 degrees',
    framingType: 'MS',
    movement: 'orbit',
    suggestedFocalLength: '35mm',
    notes: 'Powerful for action and emotional peaks',
  },
  'crane-up': {
    id: 'crane-up',
    displayName: 'Crane Up',
    displayNameEs: 'Grúa Ascendente',
    description: 'Camera rises vertically, revealing scale',
    framingType: 'WS',
    movement: 'crane-up',
    suggestedFocalLength: '24mm',
    notes: 'Epic establishing shots and conclusions',
  },
  'tracking-shot': {
    id: 'tracking-shot',
    displayName: 'Tracking Shot',
    displayNameEs: 'Toma de Seguimiento',
    description: 'Camera follows subject laterally',
    framingType: 'MS',
    movement: 'tracking',
    suggestedFocalLength: '35mm',
    notes: 'Energy, movement, music videos',
  },
  'over-the-shoulder': {
    id: 'over-the-shoulder',
    displayName: 'Over The Shoulder',
    displayNameEs: 'Por Encima del Hombro',
    description: 'Framing over one character\'s shoulder to see another',
    framingType: 'OTS',
    movement: 'static',
    suggestedFocalLength: '85mm',
    notes: 'Standard dialogue and confrontation framing',
  },
  'telenovela-dramatic-push-in': {
    id: 'telenovela-dramatic-push-in',
    displayName: 'Telenovela Dramatic Push-In',
    displayNameEs: 'Acercamiento Dramático de Telenovela',
    description: 'Slow dramatic push into face, often with reaction cut',
    framingType: 'CU',
    movement: 'slow-push-in',
    suggestedFocalLength: '85mm',
    notes: 'Signature LatAm telenovela style for shock/revelation moments',
  },
  'music-video-handheld': {
    id: 'music-video-handheld',
    displayName: 'Music Video Handheld',
    displayNameEs: 'Video Musical en Mano',
    description: 'Fast, energetic handheld movement synced to music',
    framingType: 'CU',
    movement: 'handheld-fast',
    suggestedFocalLength: '35mm',
    notes: 'Urban, reggaeton, trap, cumbia video aesthetic',
  },
  'social-ad-product-reveal': {
    id: 'social-ad-product-reveal',
    displayName: 'Social Ad Product Reveal',
    displayNameEs: 'Revelación de Producto para Redes Sociales',
    description: 'Clean, centered reveal optimized for 9:16 social formats',
    framingType: 'CU',
    movement: 'slow-zoom-in',
    suggestedFocalLength: '50mm',
    notes: 'Instagram, TikTok, YouTube Shorts ads',
  },
  'documentary-street-realism': {
    id: 'documentary-street-realism',
    displayName: 'Documentary Street Realism',
    displayNameEs: 'Realismo Callejero Documental',
    description: 'Verité style, natural light, unscripted feel',
    framingType: 'MS',
    movement: 'handheld-natural',
    suggestedFocalLength: '28mm',
    notes: 'LatAm barrio, street, market documentary aesthetic',
  },
};

// ---------------------------------------------------------------------------
// MOTION_PRESETS
// ---------------------------------------------------------------------------

export const MOTION_PRESETS = {
  'subtle-breathing': {
    id: 'subtle-breathing',
    displayName: 'Subtle Breathing',
    displayNameEs: 'Respiración Sutil',
    description: 'Minimal movement, just natural breathing — portrait or hero frame',
    intensity: 'subtle',
    category: 'portrait',
  },
  'natural-walk': {
    id: 'natural-walk',
    displayName: 'Natural Walk',
    displayNameEs: 'Caminata Natural',
    description: 'Realistic walking movement at natural pace',
    intensity: 'medium',
    category: 'movement',
  },
  'dramatic-reveal': {
    id: 'dramatic-reveal',
    displayName: 'Dramatic Reveal',
    displayNameEs: 'Revelación Dramática',
    description: 'Slow turn or lift of head/body for dramatic impact',
    intensity: 'dramatic',
    category: 'narrative',
  },
  'slow-emotional-turn': {
    id: 'slow-emotional-turn',
    displayName: 'Slow Emotional Turn',
    displayNameEs: 'Giro Emocional Lento',
    description: 'Character slowly turns to camera with emotion',
    intensity: 'subtle',
    category: 'narrative',
  },
  'action-chase': {
    id: 'action-chase',
    displayName: 'Action Chase',
    displayNameEs: 'Persecución de Acción',
    description: 'Fast-paced running or chase movement',
    intensity: 'dramatic',
    category: 'action',
  },
  'romantic-pause': {
    id: 'romantic-pause',
    displayName: 'Romantic Pause',
    displayNameEs: 'Pausa Romántica',
    description: 'Soft, intimate stillness with gentle motion',
    intensity: 'subtle',
    category: 'romance',
  },
  'product-reveal': {
    id: 'product-reveal',
    displayName: 'Product Reveal',
    displayNameEs: 'Revelación de Producto',
    description: 'Clean product or item reveal motion',
    intensity: 'medium',
    category: 'commercial',
  },
  'dialogue-delivery': {
    id: 'dialogue-delivery',
    displayName: 'Dialogue Delivery',
    displayNameEs: 'Entrega de Diálogo',
    description: 'Natural lip sync and facial expression for spoken lines',
    intensity: 'medium',
    category: 'dialogue',
  },
  'crowd-movement': {
    id: 'crowd-movement',
    displayName: 'Crowd Movement',
    displayNameEs: 'Movimiento de Multitud',
    description: 'Background crowd energy, celebration or protest',
    intensity: 'medium',
    category: 'environment',
  },
  'cinematic-transition': {
    id: 'cinematic-transition',
    displayName: 'Cinematic Transition',
    displayNameEs: 'Transición Cinematográfica',
    description: 'Smooth scene transition with character motion',
    intensity: 'medium',
    category: 'transition',
  },
};

// ---------------------------------------------------------------------------
// ROUTING_MODES
// ---------------------------------------------------------------------------

export const ROUTING_MODES = [
  {
    id: 'auto-best',
    name: 'Auto Best',
    nameEs: 'Mejor Automático',
    description: 'Automatically selects the best available provider based on task type, quality, and key availability',
  },
  {
    id: 'fast-draft',
    name: 'Fast Draft',
    nameEs: 'Borrador Rápido',
    description: 'Prioritizes speed over quality — instant previews and iterations',
  },
  {
    id: 'cheapest',
    name: 'Cheapest',
    nameEs: 'Más Económico',
    description: 'Minimizes cost — uses free or lowest-cost providers',
  },
  {
    id: 'highest-quality',
    name: 'Highest Quality',
    nameEs: 'Máxima Calidad',
    description: 'Uses the best quality provider regardless of cost or speed',
  },
  {
    id: 'best-character-consistency',
    name: 'Best Character Consistency',
    nameEs: 'Mejor Consistencia de Personaje',
    description: 'Prioritizes providers with strong character identity preservation',
  },
  {
    id: 'best-latam-output',
    name: 'Best LatAm Output',
    nameEs: 'Mejor Resultado LatAm',
    description: 'Optimized for LatAm cultural aesthetics and Spanish-language prompts',
  },
  {
    id: 'byok-only',
    name: 'BYOK Only',
    nameEs: 'Solo Tu Clave',
    description: 'Uses only providers you have configured with your own API key',
  },
  {
    id: 'cynthia-gateway',
    name: 'Cynthia Gateway',
    nameEs: 'Cynthia Gateway',
    description: 'Routes through the Cynthia-hosted gateway — one key for all providers',
  },
  {
    id: 'local-only',
    name: 'Local Only',
    nameEs: 'Solo Local',
    description: 'Uses only locally-running inference (LTX Worker, ComfyUI)',
  },
  {
    id: 'compare',
    name: 'Compare Models',
    nameEs: 'Comparar Modelos',
    description: 'Runs the same prompt on multiple providers for side-by-side comparison',
  },
];

// ---------------------------------------------------------------------------
// LATAM_LOCALES
// ---------------------------------------------------------------------------

export const LATAM_LOCALES = [
  {
    locale: 'es-MX',
    language: 'es',
    region: 'MX',
    displayName: 'Español (México)',
    is_enabled: true,
    archetype_labels: {
      protagonist: 'Protagonista',
      villain: 'Villano',
      comic: 'Cómico',
      mentor: 'Mentor',
    },
    ui_labels: {
      create_character: 'Crear Personaje',
      generate_scene: 'Generar Escena',
    },
    sample_prompts: [
      'Una mujer joven en el mercado de Oaxaca, coloridas artesanías de fondo',
      'Hombre de negocios caminando por Reforma CDMX al amanecer',
      'Familia celebrando Día de Muertos con ofrendas y flores de cempasúchil',
    ],
  },
  {
    locale: 'es-CO',
    language: 'es',
    region: 'CO',
    displayName: 'Español (Colombia)',
    is_enabled: true,
    archetype_labels: {
      protagonist: 'Protagonista',
      villain: 'Villano',
      comic: 'Cómico',
      mentor: 'Mentor',
    },
    ui_labels: {
      create_character: 'Crear Personaje',
      generate_scene: 'Generar Escena',
    },
    sample_prompts: [
      'Una mujer paisa en el centro de Medellín con fondo de edificios modernos',
      'Hombre costeño bailando cumbia en el carnaval de Barranquilla',
      'Emprendedora bogotana en una startup con vista a los cerros',
    ],
  },
  {
    locale: 'es-AR',
    language: 'es',
    region: 'AR',
    displayName: 'Español (Argentina)',
    is_enabled: true,
    archetype_labels: {
      protagonist: 'Protagonista',
      villain: 'Villano',
      comic: 'Cómico',
      mentor: 'Mentor',
    },
    ui_labels: {
      create_character: 'Crear Personaje',
      generate_scene: 'Generar Escena',
    },
    sample_prompts: [
      'Joven porteño tomando mate en la costanera de Buenos Aires',
      'Pareja bailando tango en San Telmo a la noche',
      'Mujer en la Patagonia con paisaje de montañas y lago azul',
    ],
  },
  {
    locale: 'es-CL',
    language: 'es',
    region: 'CL',
    displayName: 'Español (Chile)',
    is_enabled: true,
    archetype_labels: {
      protagonist: 'Protagonista',
      villain: 'Villano',
      comic: 'Cómico',
      mentor: 'Mentor',
    },
    ui_labels: {
      create_character: 'Crear Personaje',
      generate_scene: 'Generar Escena',
    },
    sample_prompts: [
      'Hombre en el desierto de Atacama al atardecer con cielo estrellado',
      'Mujer joven en el barrio Bellavista de Santiago con grafitis coloridos',
      'Pescador en Valparaíso con casas de colores en el cerro de fondo',
    ],
  },
  {
    locale: 'es-PE',
    language: 'es',
    region: 'PE',
    displayName: 'Español (Perú)',
    is_enabled: true,
    archetype_labels: {
      protagonist: 'Protagonista',
      villain: 'Villano',
      comic: 'Cómico',
      mentor: 'Mentor',
    },
    ui_labels: {
      create_character: 'Crear Personaje',
      generate_scene: 'Generar Escena',
    },
    sample_prompts: [
      'Mujer andina en Cusco con traje tradicional y Machu Picchu de fondo',
      'Chef limeño preparando ceviche en restaurante moderno',
      'Joven en el Lago Titicaca navegando en una balsa de totora',
    ],
  },
  {
    locale: 'es-US',
    language: 'es',
    region: 'US',
    displayName: 'Español (EE.UU. / LatAm)',
    is_enabled: true,
    archetype_labels: {
      protagonist: 'Protagonista',
      villain: 'Villano',
      comic: 'Cómico',
      mentor: 'Mentor',
    },
    ui_labels: {
      create_character: 'Crear Personaje',
      generate_scene: 'Generar Escena',
    },
    sample_prompts: [
      'Emprendedora latina en Miami con skyline al atardecer',
      'DJ en Los Ángeles mezclando música urbana latina',
      'Familia latina celebrando quinceañera en salón decorado con flores',
    ],
  },
  {
    locale: 'pt-BR',
    language: 'pt',
    region: 'BR',
    displayName: 'Português (Brasil)',
    is_enabled: false,
    note: 'Future release',
    archetype_labels: {},
    ui_labels: {},
    sample_prompts: [],
  },
];

// ---------------------------------------------------------------------------
// 1. CharacterPassport (extended)
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} CharacterPassport
 */
export function makeCharacterPassport(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('character'),
    publicName: partial.publicName ?? '',
    locale: partial.locale ?? 'es-MX',
    archetype: partial.archetype ?? 'protagonist',
    ageBand: partial.ageBand ?? 'adult',
    bodyType: partial.bodyType ?? '',
    facialDescription: partial.facialDescription ?? '',
    hairDescription: partial.hairDescription ?? '',
    skinTone: partial.skinTone ?? '',
    wardrobeCore: partial.wardrobeCore ?? '',
    accessories: partial.accessories ?? '',
    backstory: partial.backstory ?? '',
    personalityTraits: Array.isArray(partial.personalityTraits) ? partial.personalityTraits : [],
    speechRegister: partial.speechRegister ?? 'informal',
    dialectAccent: partial.dialectAccent ?? '',
    voiceProfile: {
      provider: partial.voiceProfile?.provider ?? null,
      language: partial.voiceProfile?.language ?? 'es-MX',
      voice: partial.voiceProfile?.voice ?? null,
      speed: partial.voiceProfile?.speed ?? 1.0,
      pitch: partial.voiceProfile?.pitch ?? 0,
    },
    referenceAssets: Array.isArray(partial.referenceAssets) ? partial.referenceAssets : [],
    continuityLocks: {
      face: partial.continuityLocks?.face ?? true,
      hair: partial.continuityLocks?.hair ?? true,
      wardrobe: partial.continuityLocks?.wardrobe ?? false,
      bodyType: partial.continuityLocks?.bodyType ?? true,
    },
    rights: {
      consentStatus: partial.rights?.consentStatus ?? 'unknown',
      commercialUse: partial.rights?.commercialUse ?? false,
      likenessTrainingAllowed: partial.rights?.likenessTrainingAllowed ?? false,
      voiceCloningAllowed: partial.rights?.voiceCloningAllowed ?? false,
      isMinor: partial.rights?.isMinor ?? false,
      isPoliticalFigure: partial.rights?.isPoliticalFigure ?? false,
      revocationContact: partial.rights?.revocationContact ?? null,
      expiresAt: partial.rights?.expiresAt ?? null,
    },
    safetyFlags: Array.isArray(partial.safetyFlags) ? partial.safetyFlags : [],
    ownerUserId: partial.ownerUserId ?? '',
    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} passport
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCharacterPassport(passport) {
  const errors = [];
  if (!passport || typeof passport !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!passport.id) errors.push('missing id');
  if (!passport.publicName) errors.push('missing publicName');
  if (!passport.ownerUserId) errors.push('missing ownerUserId');
  if (!passport.locale) errors.push('missing locale');
  if (passport.archetype && !ARCHETYPES.includes(passport.archetype)) {
    errors.push(`invalid archetype: ${passport.archetype}. Must be one of: ${ARCHETYPES.join(', ')}`);
  }
  if (passport.ageBand && !AGE_BANDS.includes(passport.ageBand)) {
    errors.push(`invalid ageBand: ${passport.ageBand}. Must be one of: ${AGE_BANDS.join(', ')}`);
  }
  if (passport.speechRegister && !SPEECH_REGISTERS.includes(passport.speechRegister)) {
    errors.push(`invalid speechRegister: ${passport.speechRegister}`);
  }
  if (!Array.isArray(passport.personalityTraits)) {
    errors.push('personalityTraits must be an array');
  }
  if (!Array.isArray(passport.referenceAssets)) {
    errors.push('referenceAssets must be an array');
  }
  if (!Array.isArray(passport.safetyFlags)) {
    errors.push('safetyFlags must be an array');
  }
  if (!passport.continuityLocks || typeof passport.continuityLocks !== 'object') {
    errors.push('missing continuityLocks');
  }
  if (!passport.rights || typeof passport.rights !== 'object') {
    errors.push('missing rights');
  }
  if (!passport.createdAt) errors.push('missing createdAt');
  if (!passport.updatedAt) errors.push('missing updatedAt');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// 2. Storyboard
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} Storyboard
 */
export function makeStoryboard(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('storyboard'),
    title: partial.title ?? 'Untitled Storyboard',
    language: partial.language ?? 'es',
    locale: partial.locale ?? 'es-MX',
    ownerUserId: partial.ownerUserId ?? '',
    projectId: partial.projectId ?? null,
    characterIds: Array.isArray(partial.characterIds) ? partial.characterIds : [],
    locationIds: Array.isArray(partial.locationIds) ? partial.locationIds : [],
    shotIds: Array.isArray(partial.shotIds) ? partial.shotIds : [],
    targetAspectRatio: partial.targetAspectRatio ?? '16:9',
    durationSeconds: partial.durationSeconds ?? null,
    continuityMode: partial.continuityMode ?? 'strict',
    status: partial.status ?? 'draft',
    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} storyboard
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStoryboard(storyboard) {
  const errors = [];
  if (!storyboard || typeof storyboard !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!storyboard.id) errors.push('missing id');
  if (!storyboard.title) errors.push('missing title');
  if (!storyboard.ownerUserId) errors.push('missing ownerUserId');
  if (!['en', 'es'].includes(storyboard.language)) {
    errors.push(`invalid language: ${storyboard.language}. Must be 'en' or 'es'`);
  }
  if (!ASPECT_RATIOS.includes(storyboard.targetAspectRatio)) {
    errors.push(`invalid targetAspectRatio: ${storyboard.targetAspectRatio}. Must be one of: ${ASPECT_RATIOS.join(', ')}`);
  }
  if (!CONTINUITY_MODES.includes(storyboard.continuityMode)) {
    errors.push(`invalid continuityMode: ${storyboard.continuityMode}`);
  }
  if (!STORYBOARD_STATUSES.includes(storyboard.status)) {
    errors.push(`invalid status: ${storyboard.status}`);
  }
  if (!Array.isArray(storyboard.characterIds)) errors.push('characterIds must be an array');
  if (!Array.isArray(storyboard.locationIds)) errors.push('locationIds must be an array');
  if (!Array.isArray(storyboard.shotIds)) errors.push('shotIds must be an array');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// 3. Shot
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} Shot
 */
export function makeShot(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('shot'),
    storyboardId: partial.storyboardId ?? '',
    order: partial.order ?? 0,
    action: partial.action ?? '',
    cameraPreset: partial.cameraPreset ?? 'medium-shot',
    motionPreset: partial.motionPreset ?? 'subtle-breathing',
    lens: partial.lens ?? null,
    focalLength: partial.focalLength ?? null,
    aperture: partial.aperture ?? null,
    emotionalBeat: partial.emotionalBeat ?? '',
    dialogue: partial.dialogue ?? '',
    subtitleText: partial.subtitleText ?? '',
    startFrameArtifactId: partial.startFrameArtifactId ?? null,
    endFrameArtifactId: partial.endFrameArtifactId ?? null,
    continuityLocks: {
      face: partial.continuityLocks?.face ?? true,
      hair: partial.continuityLocks?.hair ?? true,
      wardrobe: partial.continuityLocks?.wardrobe ?? false,
      bodyType: partial.continuityLocks?.bodyType ?? true,
    },
    modelPreference: partial.modelPreference ?? null,
    characterIds: Array.isArray(partial.characterIds) ? partial.characterIds : [],
    locationId: partial.locationId ?? null,
    generatedPrompt: partial.generatedPrompt ?? null,
    generatedNegativePrompt: partial.generatedNegativePrompt ?? null,
    jobId: partial.jobId ?? null,
    artifactId: partial.artifactId ?? null,
    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} shot
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateShot(shot) {
  const errors = [];
  if (!shot || typeof shot !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!shot.id) errors.push('missing id');
  if (!shot.storyboardId) errors.push('missing storyboardId');
  if (typeof shot.order !== 'number') errors.push('order must be a number');
  if (shot.cameraPreset && !CAMERA_PRESETS[shot.cameraPreset]) {
    errors.push(`invalid cameraPreset: ${shot.cameraPreset}`);
  }
  if (shot.motionPreset && !MOTION_PRESETS[shot.motionPreset]) {
    errors.push(`invalid motionPreset: ${shot.motionPreset}`);
  }
  if (!Array.isArray(shot.characterIds)) errors.push('characterIds must be an array');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// 4. LocationProfile
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} LocationProfile
 */
export function makeLocationProfile(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('location'),
    name: partial.name ?? '',
    locale: partial.locale ?? 'es-MX',
    type: partial.type ?? 'exterior',
    description: partial.description ?? '',
    timeOfDay: partial.timeOfDay ?? 'day',
    weatherCondition: partial.weatherCondition ?? 'clear',
    colorPalette: partial.colorPalette ?? '',
    culturalContext: partial.culturalContext ?? '',
    country: partial.country ?? '',
    continuityAnchors: Array.isArray(partial.continuityAnchors) ? partial.continuityAnchors : [],
    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} location
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateLocationProfile(location) {
  const errors = [];
  if (!location || typeof location !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!location.id) errors.push('missing id');
  if (!location.name) errors.push('missing name');
  if (!LOCATION_TYPES.includes(location.type)) {
    errors.push(`invalid type: ${location.type}. Must be one of: ${LOCATION_TYPES.join(', ')}`);
  }
  if (!Array.isArray(location.continuityAnchors)) errors.push('continuityAnchors must be an array');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// 5. CameraPreset (factory for custom presets)
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} CameraPreset
 */
export function makeCameraPreset(partial = {}) {
  return {
    id: partial.id ?? newId('cam'),
    displayName: partial.displayName ?? '',
    displayNameEs: partial.displayNameEs ?? '',
    description: partial.description ?? '',
    framingType: partial.framingType ?? 'MS',
    movement: partial.movement ?? 'static',
    suggestedFocalLength: partial.suggestedFocalLength ?? '50mm',
    notes: partial.notes ?? '',
  };
}

// ---------------------------------------------------------------------------
// 6. MotionPreset (factory for custom presets)
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} MotionPreset
 */
export function makeMotionPreset(partial = {}) {
  return {
    id: partial.id ?? newId('motion'),
    displayName: partial.displayName ?? '',
    displayNameEs: partial.displayNameEs ?? '',
    description: partial.description ?? '',
    intensity: partial.intensity ?? 'medium',
    category: partial.category ?? 'general',
  };
}

// ---------------------------------------------------------------------------
// 7. ConsentRecord
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} ConsentRecord
 */
export function makeConsentRecord(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('consent'),
    characterId: partial.characterId ?? '',
    ownerUserId: partial.ownerUserId ?? '',
    identityConsent: partial.identityConsent ?? false,
    voiceConsent: partial.voiceConsent ?? false,
    commercialLicense: partial.commercialLicense ?? false,
    trainingAllowed: partial.trainingAllowed ?? false,
    isMinor: partial.isMinor ?? false,
    isPoliticalFigure: partial.isPoliticalFigure ?? false,
    sourceNotes: partial.sourceNotes ?? '',
    revocationContact: partial.revocationContact ?? null,
    expiresAt: partial.expiresAt ?? null,
    revokedAt: partial.revokedAt ?? null,
    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} record
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateConsentRecord(record) {
  const errors = [];
  if (!record || typeof record !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!record.id) errors.push('missing id');
  if (!record.characterId) errors.push('missing characterId');
  if (!record.ownerUserId) errors.push('missing ownerUserId');
  if (typeof record.identityConsent !== 'boolean') errors.push('identityConsent must be boolean');
  if (typeof record.voiceConsent !== 'boolean') errors.push('voiceConsent must be boolean');
  if (typeof record.commercialLicense !== 'boolean') errors.push('commercialLicense must be boolean');
  if (typeof record.trainingAllowed !== 'boolean') errors.push('trainingAllowed must be boolean');
  if (typeof record.isMinor !== 'boolean') errors.push('isMinor must be boolean');
  if (typeof record.isPoliticalFigure !== 'boolean') errors.push('isPoliticalFigure must be boolean');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// 8. ProviderCredential
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} ProviderCredential
 */
export function makeProviderCredential(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('credential'),
    ownerUserId: partial.ownerUserId ?? '',
    provider: partial.provider ?? '',
    credentialType: partial.credentialType ?? 'api-key',
    isConfigured: partial.isConfigured ?? false,
    // NOTE: actual key is NEVER stored in this object — only encrypted server-side
    testStatus: partial.testStatus ?? 'untested',
    lastTestedAt: partial.lastTestedAt ?? null,
    createdAt: partial.createdAt ?? ts,
  };
}

/**
 * @param {object} cred
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateProviderCredential(cred) {
  const errors = [];
  if (!cred || typeof cred !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!cred.id) errors.push('missing id');
  if (!cred.ownerUserId) errors.push('missing ownerUserId');
  if (!cred.provider) errors.push('missing provider');
  if (!CREDENTIAL_TYPES.includes(cred.credentialType)) {
    errors.push(`invalid credentialType: ${cred.credentialType}`);
  }
  if (!TEST_STATUSES.includes(cred.testStatus)) {
    errors.push(`invalid testStatus: ${cred.testStatus}`);
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// 9. ModelCapability
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} ModelCapability
 */
export function makeModelCapability(partial = {}) {
  return {
    provider: partial.provider ?? '',
    modelId: partial.modelId ?? '',
    displayName: partial.displayName ?? '',
    displayNameEs: partial.displayNameEs ?? '',
    modality: Array.isArray(partial.modality) ? partial.modality : [],
    supportsTextToImage: partial.supportsTextToImage ?? false,
    supportsImageToVideo: partial.supportsImageToVideo ?? false,
    supportsTextToVideo: partial.supportsTextToVideo ?? false,
    supportsVideoToVideo: partial.supportsVideoToVideo ?? false,
    supportsStartEndFrames: partial.supportsStartEndFrames ?? false,
    supportsReferenceImages: partial.supportsReferenceImages ?? false,
    supportsCharacterConsistency: partial.supportsCharacterConsistency ?? false,
    supportsLipSync: partial.supportsLipSync ?? false,
    supportsVoice: partial.supportsVoice ?? false,
    supportsCameraControl: partial.supportsCameraControl ?? false,
    supportsBYOK: partial.supportsBYOK ?? false,
    supportsServerKey: partial.supportsServerKey ?? false,
    supportsMock: partial.supportsMock ?? false,
    costTier: partial.costTier ?? 'medium',
    speedTier: partial.speedTier ?? 'normal',
    qualityTier: partial.qualityTier ?? 'standard',
    regionAvailability: Array.isArray(partial.regionAvailability) ? partial.regionAvailability : ['global'],
    notes: partial.notes ?? '',
  };
}

// ---------------------------------------------------------------------------
// 10. GenerationJob (Cynthia extended)
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} GenerationJob
 */
export function makeGenerationJob(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('job'),
    ownerUserId: partial.ownerUserId ?? '',
    projectId: partial.projectId ?? null,
    storyboardId: partial.storyboardId ?? null,
    shotId: partial.shotId ?? null,
    characterPassportId: partial.characterPassportId ?? null,
    jobType: partial.jobType ?? 'hero-frame',
    status: partial.status ?? 'draft',
    modelRoute: {
      provider: partial.modelRoute?.provider ?? null,
      modelId: partial.modelRoute?.modelId ?? null,
      routingMode: partial.modelRoute?.routingMode ?? 'auto-best',
    },
    inputPrompt: partial.inputPrompt ?? '',
    inputNegativePrompt: partial.inputNegativePrompt ?? '',
    inputSpanishPrompt: partial.inputSpanishPrompt ?? '',
    inputSpanishNegativePrompt: partial.inputSpanishNegativePrompt ?? '',
    parameters: partial.parameters ?? {},
    artifacts: Array.isArray(partial.artifacts) ? partial.artifacts : [],
    evaluation: partial.evaluation ?? null,
    consentChecked: partial.consentChecked ?? false,
    consentCheckLog: Array.isArray(partial.consentCheckLog) ? partial.consentCheckLog : [],
    error: partial.error ?? null,
    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} job
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateGenerationJob(job) {
  const errors = [];
  if (!job || typeof job !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!job.id) errors.push('missing id');
  if (!job.ownerUserId) errors.push('missing ownerUserId');
  if (!JOB_TYPES.includes(job.jobType)) {
    errors.push(`invalid jobType: ${job.jobType}. Must be one of: ${JOB_TYPES.join(', ')}`);
  }
  if (!JOB_STATUSES.includes(job.status)) {
    errors.push(`invalid status: ${job.status}`);
  }
  if (!job.modelRoute || typeof job.modelRoute !== 'object') {
    errors.push('missing modelRoute');
  }
  if (!Array.isArray(job.artifacts)) errors.push('artifacts must be an array');
  if (!Array.isArray(job.consentCheckLog)) errors.push('consentCheckLog must be an array');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// 11. Artifact
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} Artifact
 */
export function makeArtifact(partial = {}) {
  return {
    id: partial.id ?? newId('artifact'),
    jobId: partial.jobId ?? '',
    ownerUserId: partial.ownerUserId ?? '',
    projectId: partial.projectId ?? null,
    artifactType: partial.artifactType ?? 'image',
    url: partial.url ?? '',
    mimeType: partial.mimeType ?? 'image/jpeg',
    sizeBytes: partial.sizeBytes ?? null,
    width: partial.width ?? null,
    height: partial.height ?? null,
    durationSeconds: partial.durationSeconds ?? null,
    metadata: partial.metadata ?? {},
    isHeroFrame: partial.isHeroFrame ?? false,
    isCanonical: partial.isCanonical ?? false,
    createdAt: partial.createdAt ?? now(),
  };
}

/**
 * @param {object} artifact
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateArtifact(artifact) {
  const errors = [];
  if (!artifact || typeof artifact !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!artifact.id) errors.push('missing id');
  if (!artifact.jobId) errors.push('missing jobId');
  if (!artifact.ownerUserId) errors.push('missing ownerUserId');
  if (!ARTIFACT_TYPES.includes(artifact.artifactType)) {
    errors.push(`invalid artifactType: ${artifact.artifactType}`);
  }
  if (!artifact.url) errors.push('missing url');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// 12. EvaluationResult
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} EvaluationResult
 */
export function makeEvaluationResult(partial = {}) {
  return {
    id: partial.id ?? newId('eval'),
    jobId: partial.jobId ?? '',
    artifactId: partial.artifactId ?? '',
    evaluatorType: partial.evaluatorType ?? 'rule-based',
    scores: {
      identityConsistency: partial.scores?.identityConsistency ?? null,
      wardrobeConsistency: partial.scores?.wardrobeConsistency ?? null,
      locationConsistency: partial.scores?.locationConsistency ?? null,
      lightingCoherence: partial.scores?.lightingCoherence ?? null,
      cameraAdherence: partial.scores?.cameraAdherence ?? null,
      motionQuality: partial.scores?.motionQuality ?? null,
      lipSyncQuality: partial.scores?.lipSyncQuality ?? null,
      spanishLocalizationQuality: partial.scores?.spanishLocalizationQuality ?? null,
      latAmCulturalFit: partial.scores?.latAmCulturalFit ?? null,
      rightsComplianceCompleteness: partial.scores?.rightsComplianceCompleteness ?? null,
    },
    overallScore: partial.overallScore ?? null,
    passed: partial.passed ?? null,
    reviewerNotes: partial.reviewerNotes ?? '',
    createdAt: partial.createdAt ?? now(),
  };
}

/**
 * @param {object} result
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEvaluationResult(result) {
  const errors = [];
  if (!result || typeof result !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!result.id) errors.push('missing id');
  if (!result.jobId) errors.push('missing jobId');
  if (!result.artifactId) errors.push('missing artifactId');
  if (!EVALUATOR_TYPES.includes(result.evaluatorType)) {
    errors.push(`invalid evaluatorType: ${result.evaluatorType}`);
  }
  if (!result.scores || typeof result.scores !== 'object') {
    errors.push('missing scores');
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// 13. LocalePack
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} LocalePack
 */
export function makeLocalePack(partial = {}) {
  return {
    locale: partial.locale ?? 'es-MX',
    language: partial.language ?? 'es',
    region: partial.region ?? 'MX',
    displayName: partial.displayName ?? '',
    archetype_labels: partial.archetype_labels ?? {},
    ui_labels: partial.ui_labels ?? {},
    sample_prompts: Array.isArray(partial.sample_prompts) ? partial.sample_prompts : [],
    is_enabled: partial.is_enabled ?? true,
  };
}

// ---------------------------------------------------------------------------
// 14. ModelRoutePolicy
// ---------------------------------------------------------------------------

/**
 * @param {object} partial
 * @returns {object} ModelRoutePolicy
 */
export function makeModelRoutePolicy(partial = {}) {
  return {
    id: partial.id ?? newId('policy'),
    name: partial.name ?? '',
    nameEs: partial.nameEs ?? '',
    description: partial.description ?? '',
    modality: partial.modality ?? 'image',
    routingMode: partial.routingMode ?? 'auto-best',
    preferredProviders: Array.isArray(partial.preferredProviders) ? partial.preferredProviders : [],
    excludedProviders: Array.isArray(partial.excludedProviders) ? partial.excludedProviders : [],
    requireBYOK: partial.requireBYOK ?? false,
    requireServerKey: partial.requireServerKey ?? false,
  };
}

/**
 * @param {object} policy
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateModelRoutePolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== 'object') {
    return { valid: false, errors: ['must be an object'] };
  }
  if (!policy.id) errors.push('missing id');
  if (!policy.name) errors.push('missing name');
  if (!ROUTING_MODES_IDS.includes(policy.routingMode)) {
    errors.push(`invalid routingMode: ${policy.routingMode}. Must be one of: ${ROUTING_MODES_IDS.join(', ')}`);
  }
  if (!Array.isArray(policy.preferredProviders)) errors.push('preferredProviders must be an array');
  if (!Array.isArray(policy.excludedProviders)) errors.push('excludedProviders must be an array');
  return { valid: errors.length === 0, errors };
}
