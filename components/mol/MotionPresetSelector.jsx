'use client';

export const MOTION_PRESETS = [
  {
    id: 'subtle-breathing',
    en: { label: 'Subtle Breathing', desc: 'Gentle chest rise and fall, lifelike stillness with micro-movement' },
    es: { label: 'Respiración Sutil', desc: 'Suave subida y bajada del pecho, quietud realista con micro-movimiento' },
  },
  {
    id: 'natural-walk',
    en: { label: 'Natural Walk', desc: 'Realistic walking gait, full body locomotion at a natural pace' },
    es: { label: 'Caminata Natural', desc: 'Marcha caminando realista, locomoción de cuerpo completo a ritmo natural' },
  },
  {
    id: 'dramatic-reveal',
    en: { label: 'Dramatic Reveal', desc: 'Slow turn or lift of head/body for maximum cinematic impact' },
    es: { label: 'Revelación Dramática', desc: 'Giro lento o levantamiento de cabeza/cuerpo para máximo impacto cinematográfico' },
  },
  {
    id: 'slow-emotional-turn',
    en: { label: 'Slow Emotional Turn', desc: 'Character turns with weight and emotional presence' },
    es: { label: 'Giro Emocional Lento', desc: 'El personaje gira con peso y presencia emocional' },
  },
  {
    id: 'action-chase',
    en: { label: 'Action Chase', desc: 'High-energy running, dodging, and fast directional movement' },
    es: { label: 'Persecución de Acción', desc: 'Carrera de alta energía, esquivas y movimiento direccional rápido' },
  },
  {
    id: 'romantic-pause',
    en: { label: 'Romantic Pause', desc: 'Soft, suspended moment — longing gaze or gentle touch' },
    es: { label: 'Pausa Romántica', desc: 'Momento suave y suspendido — mirada de anhelo o toque delicado' },
  },
  {
    id: 'product-reveal',
    en: { label: 'Product Reveal', desc: 'Clean, deliberate motion to showcase a product or detail' },
    es: { label: 'Revelación de Producto', desc: 'Movimiento limpio y deliberado para exhibir un producto o detalle' },
  },
  {
    id: 'dialogue-delivery',
    en: { label: 'Dialogue Delivery', desc: 'Natural speaking gestures, lip sync-ready motion' },
    es: { label: 'Entrega de Diálogo', desc: 'Gestos naturales al hablar, movimiento listo para sincronización labial' },
  },
  {
    id: 'crowd-movement',
    en: { label: 'Crowd Movement', desc: 'Background figures with organic group motion and flow' },
    es: { label: 'Movimiento de Multitud', desc: 'Figuras de fondo con movimiento grupal orgánico y fluido' },
  },
  {
    id: 'cinematic-transition',
    en: { label: 'Cinematic Transition', desc: 'Sweeping motion designed to cut or dissolve into next shot' },
    es: { label: 'Transición Cinematográfica', desc: 'Movimiento amplio diseñado para cortar o disolver hacia la siguiente toma' },
  },
];

/**
 * MotionPresetSelector — pill-based or dropdown motion preset picker.
 * @param {{ selected: string, onSelect: (id: string) => void, locale?: 'en'|'es', variant?: 'pills'|'dropdown' }} props
 */
export default function MotionPresetSelector({ selected, onSelect, locale = 'en', variant = 'pills' }) {
  if (variant === 'dropdown') {
    const currentPreset = MOTION_PRESETS.find(p => p.id === selected);
    const currentCopy = currentPreset?.[locale] ?? currentPreset?.en;

    return (
      <div className="flex flex-col gap-2">
        <select
          value={selected}
          onChange={e => onSelect(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-violet-500 transition-colors"
        >
          {MOTION_PRESETS.map(p => {
            const copy = p[locale] ?? p.en;
            return (
              <option key={p.id} value={p.id}>{copy.label}</option>
            );
          })}
        </select>
        {currentCopy && (
          <p className="text-[11px] text-zinc-500 leading-relaxed px-1">{currentCopy.desc}</p>
        )}
      </div>
    );
  }

  // Pills variant (default)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {MOTION_PRESETS.map(preset => {
          const copy = preset[locale] ?? preset.en;
          const isSelected = selected === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.id)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                isSelected
                  ? 'bg-violet-600 border-violet-500 text-white shadow-violet-900/30 shadow-md'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
              ].join(' ')}
            >
              {copy.label}
            </button>
          );
        })}
      </div>
      {/* Description of selected */}
      {selected && (() => {
        const preset = MOTION_PRESETS.find(p => p.id === selected);
        const copy = preset?.[locale] ?? preset?.en;
        return copy ? (
          <p className="text-[11px] text-zinc-500 leading-relaxed px-1">{copy.desc}</p>
        ) : null;
      })()}
    </div>
  );
}
