/**
 * Model provider routing type constants and helpers.
 */

export const ProviderPriority = [
  'local', 'huggingface', 'comfyui', 'fal', 'muapi', 'stub'
];

export const Capabilities = [
  'text-to-image', 'image-to-image', 'text-to-video', 'image-to-video',
  'lipsync', 'audio-analysis', 'mix-master', 'autotune', 'visualizer'
];

export const Providers = ['local', 'huggingface', 'comfyui', 'fal', 'muapi', 'stub'];

/**
 * Creates a stub provider route for testing/fallback.
 * @param {string} capability
 * @returns {object} ProviderRoute
 */
export function makeStubRoute(capability) {
  return {
    id: `stub-${capability}`,
    capability,
    provider: 'stub',
    modelId: 'stub-model',
    requiresGpu: false,
    estimatedCost: 'free',
    maxDurationSeconds: null,
    supportsReferenceImages: true,
    supportsLoRA: false,
    supportsSeed: true,
    supportsAudioInput: false,
    enabled: true,
  };
}

/**
 * Validates a ProviderRoute object has required fields.
 * @param {object} route
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRoute(route) {
  const errors = [];
  if (!route || typeof route !== 'object') return { valid: false, errors: ['must be object'] };
  for (const key of ['id', 'capability', 'provider', 'modelId']) {
    if (!route[key]) errors.push(`missing: ${key}`);
  }
  if (route.provider && !Providers.includes(route.provider)) {
    errors.push(`unknown provider: ${route.provider}`);
  }
  if (route.capability && !Capabilities.includes(route.capability)) {
    errors.push(`unknown capability: ${route.capability}`);
  }
  return { valid: errors.length === 0, errors };
}
