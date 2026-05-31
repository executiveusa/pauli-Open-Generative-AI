/**
 * Free tier limits and usage tracking for music generation.
 * Enforces quotas and provides upgrade paths for users.
 */

import { now } from '../types/core.js';

export const FREE_TIER_LIMITS = {
  generationsPerMonth: 10,
  maxDurationSeconds: 60,
  maxMonthlyMinutes: 30,
  supportedModes: ['simple', 'instrumental'],
  allowedLanguages: ['en'],
  allowedLocales: ['en-US'],
  allowRemixing: false,
  allowPublicSharing: false,
  allowMultiTenantAccess: false,
  watermarkRequired: true,
  priorityLevel: 'low',
  queuePosition: 'standard',
};

export const PREMIUM_TIER_LIMITS = {
  generationsPerMonth: 100,
  maxDurationSeconds: 300,
  maxMonthlyMinutes: 300,
  supportedModes: ['simple', 'instrumental', 'lyrics', 'cover', 'repaint', 'stem-extraction'],
  allowedLanguages: ['en', 'es', 'pt'],
  allowedLocales: [
    'en-US', 'es-MX', 'es-CO', 'es-AR', 'es-CL', 'es-PE', 'es-US', 'pt-BR'
  ],
  allowRemixing: true,
  allowPublicSharing: true,
  allowMultiTenantAccess: true,
  watermarkRequired: false,
  priorityLevel: 'high',
  queuePosition: 'priority',
};

/**
 * Get tier limits for user
 */
export function getTierLimits(tier = 'free') {
  return tier === 'premium' ? PREMIUM_TIER_LIMITS : FREE_TIER_LIMITS;
}

/**
 * Create a usage tracker record
 */
export function makeUsageTracker(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? '',
    userId: partial.userId ?? '',
    tier: partial.tier ?? 'free',
    billingMonth: partial.billingMonth ?? getCurrentMonthKey(),

    generationsUsed: partial.generationsUsed ?? 0,
    minutesUsed: partial.minutesUsed ?? 0,
    remixesUsed: partial.remixesUsed ?? 0,

    lastGenerationAt: partial.lastGenerationAt ?? null,
    lastUpgradePromptAt: partial.lastUpgradePromptAt ?? null,

    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * Check if user can generate music in free tier
 */
export function canGenerateInFreeTier(usage, request) {
  const limits = FREE_TIER_LIMITS;

  // Check generation count
  if (usage.generationsUsed >= limits.generationsPerMonth) {
    return {
      allowed: false,
      reason: 'monthly_limit_exceeded',
      message: `Monthly generation limit (${limits.generationsPerMonth}) reached. Upgrade to continue.`,
    };
  }

  // Check duration
  if (request.durationSeconds > limits.maxDurationSeconds) {
    return {
      allowed: false,
      reason: 'duration_limit_exceeded',
      message: `Max duration: ${limits.maxDurationSeconds}s. Upgrade for longer tracks.`,
    };
  }

  // Check monthly minutes
  const requestMinutes = request.durationSeconds / 60;
  if (usage.minutesUsed + requestMinutes > limits.maxMonthlyMinutes) {
    return {
      allowed: false,
      reason: 'monthly_minutes_exceeded',
      message: `Monthly minutes limit (${limits.maxMonthlyMinutes}m) would be exceeded.`,
    };
  }

  // Check mode support
  if (!limits.supportedModes.includes(request.mode)) {
    return {
      allowed: false,
      reason: 'mode_not_supported',
      message: `Mode '${request.mode}' only available in premium tier.`,
    };
  }

  // Check language support
  if (!limits.allowedLanguages.includes(request.language)) {
    return {
      allowed: false,
      reason: 'language_not_supported',
      message: `Language '${request.language}' only available in premium tier.`,
    };
  }

  return {
    allowed: true,
    reason: 'ok',
  };
}

/**
 * Calculate usage after generation
 */
export function calculateUsageAfter(usage, request) {
  return {
    ...usage,
    generationsUsed: usage.generationsUsed + 1,
    minutesUsed: usage.minutesUsed + (request.durationSeconds / 60),
    lastGenerationAt: now(),
  };
}

/**
 * Get remaining quota for user
 */
export function getRemainingQuota(usage, tier = 'free') {
  const limits = getTierLimits(tier);

  return {
    generationsRemaining: Math.max(0, limits.generationsPerMonth - usage.generationsUsed),
    minutesRemaining: Math.max(0, limits.maxMonthlyMinutes - usage.minutesUsed),
    generationsUsed: usage.generationsUsed,
    generationsLimit: limits.generationsPerMonth,
    minutesUsed: usage.minutesUsed,
    minutesLimit: limits.maxMonthlyMinutes,
    percentUsed: Math.round((usage.generationsUsed / limits.generationsPerMonth) * 100),
  };
}

/**
 * Get tier upgrade path
 */
export function getUpgradePath(currentTier = 'free') {
  const paths = {
    free: {
      currentTier: 'free',
      nextTier: 'premium',
      benefits: [
        'Unlimited generations (100+/month)',
        'All music modes (lyrics, cover, repaint, stems)',
        'Extended duration (up to 5 minutes)',
        'All languages and locales',
        'No watermark',
        'Priority queue',
        'Remix and sharing features',
        'Collaboration tools',
      ],
      pricing: {
        monthly: '$9.99',
        annual: '$99.99',
      },
      cta: 'Upgrade to Premium',
    },
    premium: {
      currentTier: 'premium',
      benefits: [
        '✓ Unlimited generations',
        '✓ All music modes',
        '✓ Extended duration',
        '✓ All languages',
        '✓ Priority queue',
        '✓ Remix and sharing',
      ],
      cta: 'You are subscribed',
    },
  };

  return paths[currentTier] || paths.free;
}

/**
 * Get current month key (YYYY-MM)
 */
export function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Check if usage tracker needs reset (new month)
 */
export function needsMonthlyReset(usage) {
  return usage.billingMonth !== getCurrentMonthKey();
}

/**
 * Reset monthly usage to zero
 */
export function resetMonthlyUsage(usage) {
  return {
    ...usage,
    generationsUsed: 0,
    minutesUsed: 0,
    billingMonth: getCurrentMonthKey(),
  };
}

/**
 * Build upgrade offer message
 */
export function buildUpgradeOffer(usage, tier = 'free', locale = 'en') {
  const quota = getRemainingQuota(usage, tier);
  const messages = {
    en: {
      heading: '✨ Unlock More Music',
      subheading: 'You\'ve used {{used}}/{{limit}} generations this month',
      cta: 'Upgrade to Premium',
      benefit1: 'Unlimited generations',
      benefit2: 'All music modes (lyrics, cover, remixes)',
      benefit3: 'Extended duration (up to 5 minutes)',
    },
    es: {
      heading: '✨ Desbloquea Más Música',
      subheading: 'Has usado {{used}}/{{limit}} generaciones este mes',
      cta: 'Actualizar a Premium',
      benefit1: 'Generaciones ilimitadas',
      benefit2: 'Todos los modos (letras, cover, remixes)',
      benefit3: 'Duración extendida (hasta 5 minutos)',
    },
  };

  const msg = messages[locale] || messages.en;
  return {
    ...msg,
    subheading: msg.subheading
      .replace('{{used}}', quota.generationsUsed)
      .replace('{{limit}}', quota.generationsLimit),
  };
}
