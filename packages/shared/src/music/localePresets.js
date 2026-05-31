/**
 * Locale-specific music generation presets and provider routing chains.
 * Optimizes model selection, BPM ranges, and provider preferences per region.
 */

export const LOCALE_PRESETS = {
  'en-US': {
    language: 'en',
    label: 'English (US)',
    bpmRange: [80, 180],
    defaultBpm: 120,
    defaultKey: 'C',
    genres: ['hip-hop', 'pop', 'rock', 'edm', 'country', 'jazz'],
    moods: ['energetic', 'calm', 'dark', 'happy', 'melancholic', 'cinematic'],
    providerChain: ['ace-step', 'open-music', 'elevenlabs-music'],
    supportedModes: ['simple', 'instrumental', 'lyrics', 'cover', 'repaint', 'stem-extraction'],
  },
  'es-MX': {
    language: 'es',
    label: 'Español (México)',
    bpmRange: [90, 160],
    defaultBpm: 110,
    defaultKey: 'G',
    genres: ['ranchero', 'banda', 'norteño', 'regional mexicano', 'son jarocho', 'cumbia'],
    moods: ['festivo', 'melancólico', 'romántico', 'energético', 'solemne'],
    providerChain: ['ace-step', 'open-music'],
    supportedModes: ['simple', 'instrumental', 'lyrics', 'cover'],
    culturalInstruments: ['guitarrón', 'vihuela', 'trompeta', 'trombone'],
  },
  'es-CO': {
    language: 'es',
    label: 'Español (Colombia)',
    bpmRange: [85, 170],
    defaultBpm: 115,
    defaultKey: 'A',
    genres: ['cumbia', 'salsa', 'vallenato', 'champeta', 'reggaeton', 'africana'],
    moods: ['festivo', 'sensual', 'energético', 'melancólico'],
    providerChain: ['ace-step', 'open-music'],
    supportedModes: ['simple', 'instrumental', 'lyrics', 'cover'],
    culturalInstruments: ['gaita', 'marimba', 'bongó', 'guiro'],
  },
  'es-AR': {
    language: 'es',
    label: 'Español (Argentina)',
    bpmRange: [70, 150],
    defaultBpm: 100,
    defaultKey: 'D',
    genres: ['tango', 'milonga', 'folklore argentino', 'chacarera', 'reggaeton'],
    moods: ['romántico', 'melancólico', 'nostálgico', 'festivo'],
    providerChain: ['ace-step', 'open-music'],
    supportedModes: ['simple', 'instrumental', 'lyrics', 'cover'],
    culturalInstruments: ['bandoneon', 'guitarrón', 'bajo sexto'],
  },
  'es-CL': {
    language: 'es',
    label: 'Español (Chile)',
    bpmRange: [80, 160],
    defaultBpm: 110,
    defaultKey: 'E',
    genres: ['cueca', 'tonada', 'nueva canción', 'reggaeton', 'folk'],
    moods: ['patriótico', 'melancólico', 'energético', 'festivo'],
    providerChain: ['ace-step', 'open-music'],
    supportedModes: ['simple', 'instrumental', 'lyrics', 'cover'],
    culturalInstruments: ['charango', 'quena', 'bombo'],
  },
  'es-PE': {
    language: 'es',
    label: 'Español (Perú)',
    bpmRange: [75, 155],
    defaultBpm: 105,
    defaultKey: 'F',
    genres: ['marinera', 'huayno', 'festejo', 'música afro-peruana', 'chicha'],
    moods: ['festivo', 'melancólico', 'sensual', 'energético'],
    providerChain: ['ace-step', 'open-music'],
    supportedModes: ['simple', 'instrumental', 'lyrics', 'cover'],
    culturalInstruments: ['charango', 'quena', 'cajón'],
  },
  'es-US': {
    language: 'es',
    label: 'Español (USA)',
    bpmRange: [85, 175],
    defaultBpm: 120,
    defaultKey: 'G',
    genres: ['reggaeton', 'trap latino', 'regional mexicano', 'salsa urbana', 'hip-hop latino'],
    moods: ['energético', 'festivo', 'sensual', 'melancólico'],
    providerChain: ['ace-step', 'open-music'],
    supportedModes: ['simple', 'instrumental', 'lyrics', 'cover', 'repaint'],
  },
  'pt-BR': {
    language: 'pt',
    label: 'Português (Brasil)',
    bpmRange: [90, 170],
    defaultBpm: 125,
    defaultKey: 'F#',
    genres: ['samba', 'bossa nova', 'forró', 'axé', 'funk carioca', 'tropicália'],
    moods: ['festivo', 'sensual', 'melancólico', 'energético', 'groovy'],
    providerChain: ['ace-step', 'open-music'],
    supportedModes: ['simple', 'instrumental', 'lyrics', 'cover', 'repaint'],
    culturalInstruments: ['berimbau', 'pandeiro', 'cavaquinho', 'surdo'],
  },
};

export const PROVIDER_CHAINS = {
  'ace-step': {
    name: 'ACE-Step',
    displayName: 'ACE-Step Music',
    priority: 1,
    supportsLanguages: ['en', 'es', 'pt'],
    costTier: 'standard',
    speedTier: 'fast',
    qualityTier: 'high',
  },
  'open-music': {
    name: 'Open-Music',
    displayName: 'Open Music Generator',
    priority: 2,
    supportsLanguages: ['en', 'es', 'pt'],
    costTier: 'free',
    speedTier: 'normal',
    qualityTier: 'standard',
  },
  'elevenlabs-music': {
    name: 'ElevenLabs',
    displayName: 'ElevenLabs Music AI',
    priority: 3,
    supportsLanguages: ['en'],
    costTier: 'premium',
    speedTier: 'fast',
    qualityTier: 'high',
  },
};

/**
 * Get locale preset for a given locale code
 */
export function getLocalePreset(locale) {
  return LOCALE_PRESETS[locale] || LOCALE_PRESETS['en-US'];
}

/**
 * Get default locale for a language
 */
export function getDefaultLocale(language) {
  const defaultLocales = {
    en: 'en-US',
    es: 'es-MX',
    pt: 'pt-BR',
  };
  return defaultLocales[language] || 'en-US';
}

/**
 * Get provider chain for locale, filtered by available providers
 */
export function getProviderChain(locale, availableProviders = []) {
  const preset = getLocalePreset(locale);
  if (availableProviders.length === 0) return preset.providerChain;
  return preset.providerChain.filter(p => availableProviders.includes(p));
}

/**
 * Get genre suggestions for locale
 */
export function getGenreSuggestions(locale) {
  const preset = getLocalePreset(locale);
  return preset.genres || [];
}

/**
 * Get mood suggestions for locale
 */
export function getMoodSuggestions(locale) {
  const preset = getLocalePreset(locale);
  return preset.moods || [];
}

/**
 * Get cultural instruments for locale
 */
export function getCulturalInstruments(locale) {
  const preset = getLocalePreset(locale);
  return preset.culturalInstruments || [];
}

/**
 * Get BPM range for locale
 */
export function getBpmRange(locale) {
  const preset = getLocalePreset(locale);
  return preset.bpmRange || [60, 200];
}

/**
 * Check if mode is supported in locale
 */
export function isModeSupported(locale, mode) {
  const preset = getLocalePreset(locale);
  return preset.supportedModes?.includes(mode) || false;
}

/**
 * Get all locales for a language
 */
export function getLocalesForLanguage(language) {
  return Object.entries(LOCALE_PRESETS)
    .filter(([, preset]) => preset.language === language)
    .map(([locale]) => locale);
}
