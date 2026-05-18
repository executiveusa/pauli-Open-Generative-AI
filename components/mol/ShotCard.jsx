'use client';

const CAMERA_LABELS = {
  'close-up': { en: 'Close-Up', es: 'Primer Plano' },
  'medium-shot': { en: 'Medium Shot', es: 'Plano Medio' },
  'wide-shot': { en: 'Wide Shot', es: 'Plano General' },
  'handheld-documentary': { en: 'Handheld Doc', es: 'Doc en Mano' },
  'dolly-in': { en: 'Dolly In', es: 'Dolly Entrada' },
  'dolly-out': { en: 'Dolly Out', es: 'Dolly Salida' },
  'orbit': { en: 'Orbit', es: 'Órbita' },
  'crane-up': { en: 'Crane Up', es: 'Grúa Arriba' },
  'tracking-shot': { en: 'Tracking Shot', es: 'Seguimiento' },
  'over-the-shoulder': { en: 'OTS', es: 'Sobre Hombro' },
  'telenovela-dramatic-push-in': { en: 'Telenovela Push', es: 'Push Telenovela' },
  'music-video-handheld': { en: 'MV Handheld', es: 'VM en Mano' },
  'social-ad-product-reveal': { en: 'Product Reveal', es: 'Reveal Producto' },
  'documentary-street-realism': { en: 'Doc Street', es: 'Doc Callejero' },
};

/**
 * ShotCard — displays a single shot in the shot list.
 * @param {{
 *   shot: object,
 *   isSelected: boolean,
 *   onClick: () => void,
 *   index: number,
 *   locale?: 'en'|'es'
 * }} props
 */
export default function ShotCard({ shot, isSelected, onClick, index, locale = 'en' }) {
  const cameraLabel = CAMERA_LABELS[shot.cameraPreset]?.[locale] ?? shot.cameraPreset ?? '—';
  const actionPreview = (shot.action ?? '').slice(0, 60) + ((shot.action ?? '').length > 60 ? '…' : '');
  const emotionalBeat = shot.emotionalBeat ?? null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full flex gap-3 items-start px-4 py-3 rounded-xl border text-left transition-all duration-150',
        isSelected
          ? 'bg-violet-900/30 border-violet-600/60 shadow-violet-900/20 shadow-md'
          : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/70 hover:border-zinc-700',
      ].join(' ')}
    >
      {/* Shot number */}
      <span className={[
        'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
        isSelected ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400',
      ].join(' ')}>
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        {/* Action preview */}
        {actionPreview ? (
          <p className={`text-xs leading-snug truncate ${isSelected ? 'text-violet-100' : 'text-zinc-300'}`}>
            {actionPreview}
          </p>
        ) : (
          <p className="text-xs text-zinc-600 italic">
            {locale === 'es' ? 'Sin descripción' : 'No action set'}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {/* Camera preset badge */}
          <span className={[
            'text-[10px] px-1.5 py-0.5 rounded font-medium',
            isSelected ? 'bg-violet-700/50 text-violet-200' : 'bg-zinc-800 text-zinc-500',
          ].join(' ')}>
            {cameraLabel}
          </span>

          {/* Emotional beat */}
          {emotionalBeat && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400">
              {emotionalBeat.slice(0, 20)}{emotionalBeat.length > 20 ? '…' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Drag hint */}
      <span className="shrink-0 text-zinc-700 group-hover:text-zinc-500 transition-colors text-sm select-none" title="Drag to reorder">
        ⠿
      </span>
    </button>
  );
}
