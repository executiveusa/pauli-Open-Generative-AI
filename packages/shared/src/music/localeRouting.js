/**
 * Locale-aware provider routing and fallback logic.
 * Routes requests to optimal providers based on locale, language, and model availability.
 */

import {
  getLocalePreset,
  getProviderChain,
  getBpmRange,
  getCulturalInstruments,
} from './localePresets.js';

/**
 * Build optimal provider route for a music generation request
 */
export function buildProviderRoute(request, availableProviders = []) {
  const { locale = 'en-US', providerRoute = 'auto', language = 'en' } = request;

  // If user explicitly set provider, respect it
  if (providerRoute !== 'auto' && providerRoute !== 'best' && availableProviders.includes(providerRoute)) {
    return {
      primary: providerRoute,
      fallbacks: [],
      reason: 'user_selected',
    };
  }

  // Get optimal chain for locale
  const chain = getProviderChain(locale, availableProviders);

  return {
    primary: chain[0] || availableProviders[0] || 'ace-step',
    fallbacks: chain.slice(1),
    reason: 'locale_optimized',
    locale,
    language,
  };
}

/**
 * Validate and adjust request parameters for locale constraints
 */
export function validateLocaleRequest(request) {
  const locale = request.locale || 'en-US';
  const preset = getLocalePreset(locale);

  const [minBpm, maxBpm] = preset.bpmRange || [60, 200];
  const adjustedBpm = Math.max(minBpm, Math.min(maxBpm, request.bpm || preset.defaultBpm));

  const violations = [];

  // Check BPM constraints
  if (request.bpm < minBpm || request.bpm > maxBpm) {
    violations.push({
      field: 'bpm',
      constraint: `must be between ${minBpm} and ${maxBpm}`,
      adjusted: adjustedBpm,
    });
  }

  // Check mode support
  if (!preset.supportedModes?.includes(request.mode)) {
    violations.push({
      field: 'mode',
      constraint: `mode '${request.mode}' not supported for locale '${locale}'`,
      supportedModes: preset.supportedModes,
    });
  }

  // Check language match
  if (request.language && request.language !== preset.language) {
    violations.push({
      field: 'language',
      warning: `language '${request.language}' mismatches locale language '${preset.language}'`,
    });
  }

  return {
    valid: violations.length === 0,
    violations,
    adjusted: {
      ...request,
      bpm: adjustedBpm,
    },
  };
}

/**
 * Get locale-specific prompt enhancement hints
 */
export function getPromptHints(locale) {
  const preset = getLocalePreset(locale);
  const instruments = getCulturalInstruments(locale);

  return {
    locale,
    language: preset.language,
    suggestedGenres: preset.genres || [],
    suggestedMoods: preset.moods || [],
    culturalInstruments: instruments,
    hints: buildPromptHints(locale, preset),
  };
}

function buildPromptHints(locale, preset) {
  const hints = [];

  if (locale.startsWith('es-')) {
    hints.push('Include regional instruments or musical styles for authentic Latin American sound');
    hints.push('Specify language preference (Spanish dialect varies by region)');
  }

  if (locale === 'pt-BR') {
    hints.push('Brazilian Portuguese has distinct musical traditions (samba, bossa nova, forró)');
    hints.push('Specify rhythm and percussion for authentic Brazilian flavor');
  }

  if (preset.culturalInstruments?.length > 0) {
    hints.push(`Try mentioning traditional instruments: ${preset.culturalInstruments.slice(0, 3).join(', ')}`);
  }

  return hints;
}

/**
 * Get locale-specific URI/path preferences for API calls
 */
export function getLocaleApiConfig(locale) {
  const preset = getLocalePreset(locale);

  return {
    locale,
    language: preset.language,
    headers: {
      'Accept-Language': `${preset.language}-${locale.split('-')[1] || 'US'}`,
      'X-Music-Locale': locale,
    },
    params: {
      locale,
      language: preset.language,
    },
  };
}

/**
 * Get fallback locale if primary is unavailable
 */
export function getFallbackLocale(locale) {
  const [language] = locale.split('-');

  const fallbacks = {
    'es-MX': 'es-US',
    'es-CO': 'es-MX',
    'es-AR': 'es-US',
    'es-CL': 'es-MX',
    'es-PE': 'es-MX',
    'es-US': 'es-MX',
    'pt-BR': 'en-US',
  };

  return fallbacks[locale] || 'en-US';
}
