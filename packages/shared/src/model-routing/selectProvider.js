import { ProviderPriority, makeStubRoute } from './types.js';

/**
 * Selects the best provider route for a given capability and constraints.
 *
 * Priority order: local → huggingface → comfyui → fal (paid only) → muapi → stub
 *
 * @param {object[]} routes - ProviderRoute[]
 * @param {object} input - ProviderSelectionInput
 * @returns {{ route: object, reason: string, fallbacks: object[] }}
 */
export function selectProvider(routes, input) {
  const {
    capability,
    allowPaid = false,
    enabledProviders = [],
    requiresReferenceImages = false,
    requiresLoRA = false,
    requiresSeed = false,
    durationSeconds = null,
    hasLocalGpu = false,
  } = input;

  const eligible = routes.filter(route => {
    if (!route.enabled) return false;
    if (!enabledProviders.includes(route.provider)) return false;
    if (route.capability !== capability) return false;
    if (route.provider === 'fal' && !allowPaid) return false;
    if (requiresReferenceImages && route.supportsReferenceImages === false) return false;
    if (requiresLoRA && route.supportsLoRA === false) return false;
    if (requiresSeed && route.supportsSeed === false) return false;
    if (route.requiresGpu && !hasLocalGpu && route.provider === 'local') return false;
    if (durationSeconds != null && route.maxDurationSeconds != null) {
      if (durationSeconds > route.maxDurationSeconds) return false;
    }
    return true;
  });

  eligible.sort((a, b) =>
    ProviderPriority.indexOf(a.provider) - ProviderPriority.indexOf(b.provider)
  );

  const route = eligible[0] ?? makeStubRoute(capability);
  const fallbacks = eligible.slice(1);
  const isStubFallback = eligible.length === 0;

  return {
    route,
    reason: isStubFallback
      ? `no eligible provider for '${capability}' — stub fallback`
      : `selected '${route.provider}' (${route.modelId}) by priority`,
    fallbacks,
  };
}
