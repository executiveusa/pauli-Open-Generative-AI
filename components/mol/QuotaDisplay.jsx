'use client';

import { getRemainingQuota, buildUpgradeOffer } from '@/packages/shared/src/music/freeTierLimits.js';

const LABELS = {
  en: {
    quota: 'Monthly Quota',
    generationsLeft: 'Generations left',
    minutesLeft: 'Minutes left',
    unlimited: 'Unlimited',
    upgrade: 'Upgrade',
    modeNotAvailable: 'This mode requires premium',
    localeNotAvailable: 'This locale requires premium',
  },
  es: {
    quota: 'Cuota Mensual',
    generationsLeft: 'Generaciones restantes',
    minutesLeft: 'Minutos restantes',
    unlimited: 'Ilimitado',
    upgrade: 'Actualizar',
    modeNotAvailable: 'Este modo requiere premium',
    localeNotAvailable: 'Esta región requiere premium',
  },
};

export default function QuotaDisplay({
  usage = null,
  tier = 'free',
  onUpgrade,
  compact = false,
  locale = 'en',
}) {
  const t = LABELS[locale];

  if (!usage) {
    return null;
  }

  const quota = getRemainingQuota(usage, tier);
  const isPremium = tier === 'premium';

  if (compact) {
    return (
      <div className="text-xs text-purple-300 flex items-center gap-2">
        {isPremium ? (
          <span>✓ Premium</span>
        ) : (
          <>
            <span>{quota.generationsRemaining}/{quota.generationsLimit} {t.generationsLeft}</span>
            {quota.generationsRemaining === 0 && (
              <button
                onClick={onUpgrade}
                className="text-pink-400 hover:text-pink-300 font-medium"
              >
                {t.upgrade}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-3">{t.quota}</h3>

      {isPremium ? (
        <div className="text-center py-4">
          <p className="text-lg font-bold text-green-400">✓ {t.unlimited}</p>
          <p className="text-xs text-purple-300 mt-1">Premium subscriber</p>
        </div>
      ) : (
        <>
          {/* Generations */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-purple-300">{t.generationsLeft}</span>
              <span className="text-xs font-medium text-white">
                {quota.generationsRemaining}/{quota.generationsLimit}
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  quota.percentUsed > 80 ? 'bg-red-600' : 'bg-purple-600'
                }`}
                style={{ width: `${quota.percentUsed}%` }}
              />
            </div>
          </div>

          {/* Minutes */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-purple-300">{t.minutesLeft}</span>
              <span className="text-xs font-medium text-white">
                {Math.round(quota.minutesRemaining)}m / {quota.minutesLimit}m
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-pink-600 transition-all"
                style={{ width: `${Math.round((quota.minutesUsed / quota.minutesLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Upgrade CTA */}
          {quota.generationsRemaining < 3 && (
            <button
              onClick={onUpgrade}
              className="w-full py-2 px-4 rounded bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium transition"
            >
              {t.upgrade} →
            </button>
          )}
        </>
      )}
    </div>
  );
}
