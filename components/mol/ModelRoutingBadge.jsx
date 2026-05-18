'use client';

/**
 * ModelRoutingBadge — small colored badge for model capability display.
 * Props: badge (string), size ('sm' | 'xs' | 'md')
 */

const BADGE_COLORS = {
  T2V:             'bg-blue-900 text-blue-300 border border-blue-700',
  I2V:             'bg-purple-900 text-purple-300 border border-purple-700',
  T2I:             'bg-green-900 text-green-300 border border-green-700',
  Lipsync:         'bg-pink-900 text-pink-300 border border-pink-700',
  BYOK:            'bg-yellow-900 text-yellow-300 border border-yellow-700',
  Mock:            'bg-zinc-700 text-zinc-300 border border-zinc-600',
  ConsistencyLock: 'bg-teal-900 text-teal-300 border border-teal-700',
  LatAm:           'bg-orange-900 text-orange-300 border border-orange-700',
};

const SIZE_CLASSES = {
  xs: 'text-[10px] px-1 py-0 rounded',
  sm: 'text-xs px-1.5 py-0.5 rounded',
  md: 'text-sm px-2 py-1 rounded-md',
};

/**
 * @param {{ badge: string, size?: 'xs'|'sm'|'md' }} props
 */
export default function ModelRoutingBadge({ badge, size = 'sm' }) {
  const colorClass = BADGE_COLORS[badge] ?? 'bg-zinc-700 text-zinc-300 border border-zinc-600';
  const sizeClass  = SIZE_CLASSES[size] ?? SIZE_CLASSES.sm;

  return (
    <span className={`inline-flex items-center font-medium whitespace-nowrap ${colorClass} ${sizeClass}`}>
      {badge}
    </span>
  );
}
