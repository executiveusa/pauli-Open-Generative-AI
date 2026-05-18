/**
 * Supercomputer Model Router
 * Central registry and intelligent routing for all AI generation providers.
 * Pure module — no side effects, no env reads at import time.
 */

// ─── Speed / cost / quality tier ordering (lower index = better for that axis) ─
const SPEED_ORDER  = { instant: 0, fast: 1, normal: 2, slow: 3 };
const COST_ORDER   = { free: 0, low: 1, medium: 2, high: 3 };
const QUALITY_ORDER = { draft: 0, standard: 1, premium: 2 };

// ─── Model Registry ─────────────────────────────────────────────────────────────

export const MODEL_REGISTRY = [
  {
    provider: 'mock',
    modelId: 'mock-cinematic-v1',
    displayName: 'Mock Cinematic',
    displayNameEs: 'Cinemático Mock',
    modality: ['image', 'video'],
    supportsTextToImage: true,
    supportsImageToVideo: true,
    supportsTextToVideo: true,
    supportsCharacterConsistency: true,
    supportsMock: true,
    costTier: 'free',
    speedTier: 'instant',
    qualityTier: 'draft',
    supportsServerKey: false,
    supportsBYOK: false,
    regionAvailability: ['all'],
  },
  {
    provider: 'openai',
    modelId: 'dall-e-3',
    displayName: 'OpenAI DALL-E 3',
    displayNameEs: 'OpenAI DALL-E 3',
    modality: ['image'],
    supportsTextToImage: true,
    supportsReferenceImages: false,
    supportsBYOK: true,
    supportsServerKey: true,
    costTier: 'medium',
    speedTier: 'fast',
    qualityTier: 'premium',
    regionAvailability: ['us', 'eu', 'latam'],
    notes: 'Requires OPENAI_API_KEY',
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o-image',
    displayName: 'OpenAI GPT-4o Image',
    displayNameEs: 'OpenAI GPT-4o Imagen',
    modality: ['image'],
    supportsTextToImage: true,
    supportsReferenceImages: true,
    supportsBYOK: true,
    supportsServerKey: true,
    costTier: 'high',
    speedTier: 'fast',
    qualityTier: 'premium',
    regionAvailability: ['us', 'eu'],
  },
  {
    provider: 'openai',
    modelId: 'sora-placeholder',
    displayName: 'OpenAI Sora (Placeholder)',
    displayNameEs: 'OpenAI Sora (Placeholder)',
    modality: ['video'],
    supportsTextToVideo: true,
    supportsBYOK: true,
    supportsServerKey: true,
    supportsMock: true,
    costTier: 'high',
    speedTier: 'slow',
    qualityTier: 'premium',
    regionAvailability: ['us'],
    notes: 'Sora API placeholder - not yet available',
  },
  {
    provider: 'google',
    modelId: 'veo-2-placeholder',
    displayName: 'Google Veo 2 (Placeholder)',
    displayNameEs: 'Google Veo 2 (Placeholder)',
    modality: ['video'],
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsBYOK: false,
    supportsServerKey: true,
    supportsMock: true,
    costTier: 'high',
    speedTier: 'normal',
    qualityTier: 'premium',
    regionAvailability: ['us', 'eu'],
  },
  {
    provider: 'runway',
    modelId: 'gen3-alpha-turbo',
    displayName: 'Runway Gen-3 Alpha Turbo',
    displayNameEs: 'Runway Gen-3 Alpha Turbo',
    modality: ['video'],
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsStartEndFrames: true,
    supportsBYOK: true,
    supportsServerKey: true,
    supportsMock: true,
    costTier: 'medium',
    speedTier: 'fast',
    qualityTier: 'premium',
    regionAvailability: ['us', 'eu', 'latam'],
  },
  {
    provider: 'kling',
    modelId: 'kling-1.6-pro',
    displayName: 'Kling 1.6 Pro',
    displayNameEs: 'Kling 1.6 Pro',
    modality: ['video'],
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsStartEndFrames: true,
    supportsBYOK: true,
    supportsMock: true,
    costTier: 'medium',
    speedTier: 'normal',
    qualityTier: 'premium',
    regionAvailability: ['us', 'eu', 'latam', 'apac'],
  },
  {
    provider: 'seedance',
    modelId: 'seedance-1-pro',
    displayName: 'Seedance 1 Pro',
    displayNameEs: 'Seedance 1 Pro',
    modality: ['video', 'image'],
    supportsTextToVideo: true,
    supportsTextToImage: true,
    supportsImageToVideo: true,
    supportsCharacterConsistency: true,
    supportsBYOK: true,
    supportsMock: true,
    costTier: 'medium',
    speedTier: 'normal',
    qualityTier: 'premium',
    regionAvailability: ['us', 'eu', 'latam', 'apac'],
  },
  {
    provider: 'wan',
    modelId: 'wan-2.1',
    displayName: 'Wan 2.1',
    displayNameEs: 'Wan 2.1',
    modality: ['video'],
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsBYOK: true,
    supportsMock: true,
    costTier: 'low',
    speedTier: 'slow',
    qualityTier: 'standard',
    regionAvailability: ['all'],
  },
  {
    provider: 'muapi',
    modelId: 'muapi-default',
    displayName: 'MuAPI (Multi-Model)',
    displayNameEs: 'MuAPI (Multi-Modelo)',
    modality: ['image', 'video', 'audio'],
    supportsTextToImage: true,
    supportsTextToVideo: true,
    supportsLipSync: true,
    supportsServerKey: true,
    supportsBYOK: true,
    costTier: 'medium',
    speedTier: 'fast',
    qualityTier: 'standard',
    regionAvailability: ['all'],
  },
  {
    provider: 'fal',
    modelId: 'fal-wan-t2v',
    displayName: 'FAL Wan T2V',
    displayNameEs: 'FAL Wan T2V',
    modality: ['video'],
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsServerKey: true,
    supportsBYOK: true,
    costTier: 'low',
    speedTier: 'normal',
    qualityTier: 'standard',
    regionAvailability: ['us', 'eu'],
  },
  {
    provider: 'huggingface',
    modelId: 'hf-animatediff',
    displayName: 'HuggingFace AnimateDiff',
    displayNameEs: 'HuggingFace AnimateDiff',
    modality: ['video', 'image'],
    supportsTextToImage: true,
    supportsTextToVideo: true,
    supportsServerKey: true,
    supportsBYOK: true,
    costTier: 'free',
    speedTier: 'slow',
    qualityTier: 'draft',
    regionAvailability: ['all'],
  },
  {
    provider: 'local',
    modelId: 'wan2gp-local',
    displayName: 'Local Wan2GP',
    displayNameEs: 'Wan2GP Local',
    modality: ['video'],
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsBYOK: false,
    supportsServerKey: false,
    costTier: 'free',
    speedTier: 'slow',
    qualityTier: 'standard',
    regionAvailability: ['all'],
    notes: 'Requires local GPU',
  },
  {
    provider: 'stub',
    modelId: 'stub-all',
    displayName: 'Stub (Development)',
    displayNameEs: 'Stub (Desarrollo)',
    modality: ['image', 'video', 'audio'],
    supportsTextToImage: true,
    supportsTextToVideo: true,
    supportsLipSync: true,
    supportsMock: true,
    costTier: 'free',
    speedTier: 'instant',
    qualityTier: 'draft',
    regionAvailability: ['all'],
  },
];

// ─── Routing Modes ───────────────────────────────────────────────────────────────

export const ROUTING_MODES = [
  {
    id: 'auto-best',
    displayName: 'Auto Best',
    displayNameEs: 'Auto Mejor',
    description: 'Selects best available model for the task',
    descriptionEs: 'Selecciona el mejor modelo disponible para la tarea',
  },
  {
    id: 'fast-draft',
    displayName: 'Fast Draft',
    displayNameEs: 'Borrador Rápido',
    description: 'Fastest available model, lower quality',
    descriptionEs: 'Modelo más rápido disponible, menor calidad',
  },
  {
    id: 'cheapest',
    displayName: 'Cheapest',
    displayNameEs: 'Más Económico',
    description: 'Lowest cost model',
    descriptionEs: 'Modelo de menor costo',
  },
  {
    id: 'highest-quality',
    displayName: 'Highest Quality',
    displayNameEs: 'Máxima Calidad',
    description: 'Best quality regardless of cost',
    descriptionEs: 'Mejor calidad sin importar el costo',
  },
  {
    id: 'best-character-consistency',
    displayName: 'Best Character Consistency',
    displayNameEs: 'Mejor Consistencia de Personaje',
    description: 'Optimized for consistent character appearance',
    descriptionEs: 'Optimizado para apariencia consistente del personaje',
  },
  {
    id: 'best-latam-output',
    displayName: 'Best LatAm Output',
    displayNameEs: 'Mejor Salida LatAm',
    description: 'Optimized for Spanish/LatAm content',
    descriptionEs: 'Optimizado para contenido en español/LatAm',
  },
  {
    id: 'byok-only',
    displayName: 'BYOK Only',
    displayNameEs: 'Solo Tu Clave',
    description: 'Only use models with your own API key',
    descriptionEs: 'Solo usa modelos con tu propia clave API',
  },
  {
    id: 'cynthia-gateway',
    displayName: 'Cynthia Gateway',
    displayNameEs: 'Cynthia Gateway',
    description: 'Route through Cynthia Gateway',
    descriptionEs: 'Enrutar a través de Cynthia Gateway',
  },
  {
    id: 'local-only',
    displayName: 'Local Only',
    displayNameEs: 'Solo Local',
    description: 'GPU local models only',
    descriptionEs: 'Solo modelos GPU locales',
  },
  {
    id: 'compare',
    displayName: 'Compare Models',
    displayNameEs: 'Comparar Modelos',
    description: 'Generate with multiple models simultaneously',
    descriptionEs: 'Genera con múltiples modelos simultáneamente',
  },
];

// ─── Internal helpers ────────────────────────────────────────────────────────────

function isAvailable(model, availableProviders) {
  // Mock and stub are always available
  if (model.supportsMock || model.provider === 'stub' || model.provider === 'mock') return true;
  // Local models are available if local provider is listed
  if (model.provider === 'local') return availableProviders.has('local');
  // Server-keyed models are available if that provider has a configured server key
  if (model.supportsServerKey) return true;
  // BYOK models: available if provider in availableProviders
  if (model.supportsBYOK && availableProviders.has(model.provider)) return true;
  return false;
}

function filterByModality(models, modality) {
  if (!modality) return models;
  return models.filter(m => m.modality.includes(modality));
}

function sortByCost(models) {
  return [...models].sort((a, b) => COST_ORDER[a.costTier] - COST_ORDER[b.costTier]);
}

function sortBySpeed(models) {
  return [...models].sort((a, b) => SPEED_ORDER[a.speedTier] - SPEED_ORDER[b.speedTier]);
}

function sortByQuality(models) {
  return [...models].sort((a, b) => QUALITY_ORDER[b.qualityTier] - QUALITY_ORDER[a.qualityTier]);
}

function fallbackToMock(modality) {
  return MODEL_REGISTRY.find(m => m.provider === 'mock' && (!modality || m.modality.includes(modality)))
    || MODEL_REGISTRY.find(m => m.provider === 'stub');
}

// ─── Main routing function ───────────────────────────────────────────────────────

/**
 * Routes a generation request to the best available model.
 *
 * @param {object} request
 * @param {string} [request.modality] - 'image' | 'video' | 'audio'
 * @param {boolean} [request.needsCharacterConsistency]
 * @param {boolean} [request.needsLipSync]
 * @param {boolean} [request.needsStartEndFrames]
 * @param {boolean} [request.preferBYOK]
 * @param {boolean} [request.preferLocal]
 * @param {Set<string>} availableProviders - provider IDs that have keys configured
 * @param {string} mode - routing mode id
 * @returns {{ primary: object, alternatives: object[], reason: string, reasonEs: string }}
 */
export function routeGeneration(request = {}, availableProviders = new Set(), mode = 'auto-best') {
  const {
    modality,
    needsCharacterConsistency = false,
    needsLipSync = false,
    needsStartEndFrames = false,
    preferBYOK = false,
    preferLocal = false,
  } = request;

  // Ensure availableProviders is a Set
  const providerSet = availableProviders instanceof Set
    ? availableProviders
    : new Set(Array.isArray(availableProviders) ? availableProviders : []);

  // Start with modality filter
  let candidates = filterByModality(MODEL_REGISTRY, modality);

  // Apply capability filters
  if (needsCharacterConsistency) {
    const cc = candidates.filter(m => m.supportsCharacterConsistency);
    if (cc.length > 0) candidates = cc;
  }
  if (needsLipSync) {
    const ls = candidates.filter(m => m.supportsLipSync);
    if (ls.length > 0) candidates = ls;
  }
  if (needsStartEndFrames) {
    const sef = candidates.filter(m => m.supportsStartEndFrames);
    if (sef.length > 0) candidates = sef;
  }

  let primary = null;
  let alternatives = [];
  let reason = '';
  let reasonEs = '';

  // ─── Mode-specific routing ────────────────────────────────────────────────────

  if (mode === 'local-only') {
    const local = candidates.filter(m => m.provider === 'local');
    if (local.length > 0) {
      primary = local[0];
      alternatives = local.slice(1);
      reason = 'Local GPU model selected';
      reasonEs = 'Modelo GPU local seleccionado';
    } else {
      primary = MODEL_REGISTRY.find(m => m.provider === 'stub') ?? fallbackToMock(modality);
      alternatives = [];
      reason = 'No local model available — stub fallback';
      reasonEs = 'No hay modelo local disponible — respaldo stub';
    }
    return { primary, alternatives, reason, reasonEs };
  }

  if (mode === 'byok-only') {
    const byok = candidates.filter(m =>
      m.supportsBYOK && (providerSet.has(m.provider) || m.supportsMock)
    );
    if (byok.length > 0) {
      const sorted = sortByQuality(byok);
      primary = sorted[0];
      alternatives = sorted.slice(1, 4);
      reason = `BYOK model selected: ${primary.displayName}`;
      reasonEs = `Modelo BYOK seleccionado: ${primary.displayNameEs}`;
    } else {
      primary = fallbackToMock(modality);
      alternatives = [];
      reason = 'No BYOK model with key available — mock fallback';
      reasonEs = 'No hay modelo BYOK con clave disponible — respaldo mock';
    }
    return { primary, alternatives, reason, reasonEs };
  }

  if (mode === 'fast-draft') {
    const available = candidates.filter(m => isAvailable(m, providerSet));
    if (available.length > 0) {
      const sorted = sortBySpeed(available);
      primary = sorted[0];
      alternatives = sorted.slice(1, 4);
      reason = `Fastest available model: ${primary.displayName} (${primary.speedTier})`;
      reasonEs = `Modelo más rápido disponible: ${primary.displayNameEs} (${primary.speedTier})`;
    } else {
      primary = fallbackToMock(modality);
      alternatives = [];
      reason = 'No model available — mock fallback';
      reasonEs = 'Ningún modelo disponible — respaldo mock';
    }
    return { primary, alternatives, reason, reasonEs };
  }

  if (mode === 'cheapest') {
    const available = candidates.filter(m => isAvailable(m, providerSet));
    if (available.length > 0) {
      const sorted = sortByCost(available);
      primary = sorted[0];
      alternatives = sorted.slice(1, 4);
      reason = `Cheapest model: ${primary.displayName} (${primary.costTier})`;
      reasonEs = `Modelo más económico: ${primary.displayNameEs} (${primary.costTier})`;
    } else {
      primary = fallbackToMock(modality);
      alternatives = [];
      reason = 'No model available — mock fallback';
      reasonEs = 'Ningún modelo disponible — respaldo mock';
    }
    return { primary, alternatives, reason, reasonEs };
  }

  if (mode === 'highest-quality') {
    const available = candidates.filter(m => isAvailable(m, providerSet));
    if (available.length > 0) {
      const sorted = sortByQuality(available);
      primary = sorted[0];
      alternatives = sorted.slice(1, 4);
      reason = `Highest quality model: ${primary.displayName} (${primary.qualityTier})`;
      reasonEs = `Modelo de mayor calidad: ${primary.displayNameEs} (${primary.qualityTier})`;
    } else {
      primary = fallbackToMock(modality);
      alternatives = [];
      reason = 'No model available — mock fallback';
      reasonEs = 'Ningún modelo disponible — respaldo mock';
    }
    return { primary, alternatives, reason, reasonEs };
  }

  if (mode === 'best-character-consistency') {
    const ccModels = candidates.filter(m => m.supportsCharacterConsistency && isAvailable(m, providerSet));
    if (ccModels.length > 0) {
      const sorted = sortByQuality(ccModels);
      primary = sorted[0];
      alternatives = sorted.slice(1, 4);
      reason = `Best character consistency model: ${primary.displayName}`;
      reasonEs = `Mejor modelo para consistencia de personaje: ${primary.displayNameEs}`;
    } else {
      const available = candidates.filter(m => isAvailable(m, providerSet));
      const sorted = sortByQuality(available.length > 0 ? available : candidates);
      primary = sorted[0] ?? fallbackToMock(modality);
      alternatives = sorted.slice(1, 4);
      reason = 'No character consistency model — best available selected';
      reasonEs = 'Sin modelo de consistencia — se seleccionó el mejor disponible';
    }
    return { primary, alternatives, reason, reasonEs };
  }

  if (mode === 'best-latam-output') {
    // Prefer models with latam in regionAvailability and premium quality
    const latam = candidates.filter(m =>
      (m.regionAvailability?.includes('latam') || m.regionAvailability?.includes('all'))
      && isAvailable(m, providerSet)
    );
    const sorted = sortByQuality(latam.length > 0 ? latam : candidates.filter(m => isAvailable(m, providerSet)));
    primary = sorted[0] ?? fallbackToMock(modality);
    alternatives = sorted.slice(1, 4);
    reason = `LatAm-optimized model: ${primary.displayName}`;
    reasonEs = `Modelo optimizado para LatAm: ${primary.displayNameEs}`;
    return { primary, alternatives, reason, reasonEs };
  }

  if (mode === 'compare') {
    // Return top 4 across different providers
    const available = candidates.filter(m => isAvailable(m, providerSet));
    const sorted = sortByQuality(available.length > 0 ? available : candidates);
    const seen = new Set();
    const top4 = [];
    for (const m of sorted) {
      if (!seen.has(m.provider)) {
        seen.add(m.provider);
        top4.push(m);
      }
      if (top4.length >= 4) break;
    }
    if (top4.length === 0) top4.push(fallbackToMock(modality));
    primary = top4[0];
    alternatives = top4.slice(1);
    reason = `Compare mode: ${top4.length} models across ${top4.length} providers`;
    reasonEs = `Modo comparación: ${top4.length} modelos en ${top4.length} proveedores`;
    return { primary, alternatives, reason, reasonEs };
  }

  if (mode === 'cynthia-gateway') {
    // Route through server-key models preferring premium quality
    const serverKey = candidates.filter(m => m.supportsServerKey && isAvailable(m, providerSet));
    const sorted = sortByQuality(serverKey.length > 0 ? serverKey : candidates.filter(m => isAvailable(m, providerSet)));
    primary = sorted[0] ?? fallbackToMock(modality);
    alternatives = sorted.slice(1, 4);
    reason = `Cynthia Gateway: ${primary.displayName}`;
    reasonEs = `Cynthia Gateway: ${primary.displayNameEs}`;
    return { primary, alternatives, reason, reasonEs };
  }

  // ─── Default: auto-best ───────────────────────────────────────────────────────
  {
    // Prefer available + highest quality, then speed as tiebreak
    const available = candidates.filter(m => isAvailable(m, providerSet));
    const pool = available.length > 0 ? available : candidates;

    // Score: quality desc, then speed asc
    const scored = [...pool].sort((a, b) => {
      const qDiff = QUALITY_ORDER[b.qualityTier] - QUALITY_ORDER[a.qualityTier];
      if (qDiff !== 0) return qDiff;
      return SPEED_ORDER[a.speedTier] - SPEED_ORDER[b.speedTier];
    });

    // Prefer providers that are explicitly available
    const withKey = scored.filter(m => providerSet.has(m.provider) || m.supportsServerKey || m.supportsMock);
    const finalPool = withKey.length > 0 ? withKey : scored;

    primary = finalPool[0] ?? fallbackToMock(modality);
    alternatives = finalPool.slice(1, 4);
    reason = `Auto-best: ${primary.displayName} (quality: ${primary.qualityTier}, speed: ${primary.speedTier})`;
    reasonEs = `Auto mejor: ${primary.displayNameEs} (calidad: ${primary.qualityTier}, velocidad: ${primary.speedTier})`;
  }

  // Final fallback guard
  if (!primary) {
    primary = fallbackToMock(modality);
    reason = 'Fallback to mock — no suitable model found';
    reasonEs = 'Respaldo a mock — no se encontró modelo adecuado';
  }

  return { primary, alternatives, reason, reasonEs };
}

// ─── Utility functions ────────────────────────────────────────────────────────────

/**
 * Returns all models for a given provider.
 * @param {string} provider
 * @returns {object[]}
 */
export function getModelsByProvider(provider) {
  return MODEL_REGISTRY.filter(m => m.provider === provider);
}

/**
 * Returns all models that support a given modality.
 * @param {string} modality - 'image' | 'video' | 'audio'
 * @returns {object[]}
 */
export function getModelsByModality(modality) {
  return MODEL_REGISTRY.filter(m => m.modality.includes(modality));
}

/**
 * Returns capability badge strings for a model.
 * @param {object} model
 * @returns {string[]}
 */
export function getCapabilityBadges(model) {
  const badges = [];
  if (model.supportsTextToVideo)          badges.push('T2V');
  if (model.supportsImageToVideo)         badges.push('I2V');
  if (model.supportsTextToImage)          badges.push('T2I');
  if (model.supportsLipSync)              badges.push('Lipsync');
  if (model.supportsBYOK)                 badges.push('BYOK');
  if (model.supportsCharacterConsistency) badges.push('ConsistencyLock');
  if (model.regionAvailability?.includes('latam') || model.regionAvailability?.includes('all')) {
    badges.push('LatAm');
  }
  if (model.supportsMock)                 badges.push('Mock');
  return badges;
}
