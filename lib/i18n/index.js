/**
 * Internationalization (i18n) factory for Cynthia Studio.
 * Provides dictionary access, translation functions, and locale management.
 */

import { en } from './en.js';
import { es } from './es.js';

// Default configuration
export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = [
  'en',
  'es',
  'es-MX',
  'es-CO',
  'es-AR',
  'es-CL',
  'es-PE',
  'es-US',
];

// Dictionary registry
const DICTIONARIES = {
  en,
  es,
};

// Import regional locales
import esMX from './locales/es-MX.js';
import esCO from './locales/es-CO.js';
import esAR from './locales/es-AR.js';
import esCL from './locales/es-CL.js';
import esPE from './locales/es-PE.js';
import esUS from './locales/es-US.js';

DICTIONARIES['es-MX'] = esMX;
DICTIONARIES['es-CO'] = esCO;
DICTIONARIES['es-AR'] = esAR;
DICTIONARIES['es-CL'] = esCL;
DICTIONARIES['es-PE'] = esPE;
DICTIONARIES['es-US'] = esUS;

/**
 * Retrieves the dictionary for a given locale.
 * Falls back to parent locale if specific region is not found.
 * @param {string} locale - Locale code (e.g., 'es-MX', 'en')
 * @returns {object} Dictionary object
 */
export function getDict(locale = DEFAULT_LOCALE) {
  if (DICTIONARIES[locale]) {
    return DICTIONARIES[locale];
  }

  // Fallback to base language if regional variant not found
  const baseLocale = locale.split('-')[0];
  if (DICTIONARIES[baseLocale]) {
    return DICTIONARIES[baseLocale];
  }

  // Ultimate fallback to English
  return DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * Translation function with nested key support.
 * Usage: t('es', 'nav.dashboard') -> 'Panel de Control'
 * @param {string} locale - Locale code
 * @param {string} key - Dot-separated key path (e.g., 'nav.dashboard')
 * @param {object} params - Optional parameters for interpolation (not yet implemented)
 * @returns {string} Translated string or key if not found
 */
export function t(locale = DEFAULT_LOCALE, key, params = {}) {
  const dict = getDict(locale);
  const keys = key.split('.');
  let value = dict;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return the key if translation not found
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Returns all available locales.
 * @returns {string[]} Array of supported locale codes
 */
export function getAvailableLocales() {
  return SUPPORTED_LOCALES;
}

/**
 * Checks if a locale is supported.
 * @param {string} locale - Locale code
 * @returns {boolean} True if locale is supported
 */
export function isSupportedLocale(locale) {
  return SUPPORTED_LOCALES.includes(locale);
}

/**
 * Gets the base language from a locale code.
 * @param {string} locale - Locale code (e.g., 'es-MX')
 * @returns {string} Base language (e.g., 'es')
 */
export function getBaseLanguage(locale) {
  return locale.split('-')[0];
}

export default {
  getDict,
  t,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getAvailableLocales,
  isSupportedLocale,
  getBaseLanguage,
};
