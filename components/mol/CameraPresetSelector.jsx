'use client';

export const CAMERA_PRESETS = [
  {
    id: 'close-up',
    icon: '👤',
    en: { label: 'Close-Up', desc: 'Tight frame on face or subject, intimate and emotional' },
    es: { label: 'Primer Plano', desc: 'Encuadre cerrado en rostro o sujeto, íntimo y emocional' },
  },
  {
    id: 'medium-shot',
    icon: '🧍',
    en: { label: 'Medium Shot', desc: 'Waist-up framing, natural conversational distance' },
    es: { label: 'Plano Medio', desc: 'Encuadre de cintura hacia arriba, distancia conversacional natural' },
  },
  {
    id: 'wide-shot',
    icon: '🌄',
    en: { label: 'Wide Shot', desc: 'Full scene in frame, shows environment and scale' },
    es: { label: 'Plano General', desc: 'Escena completa en cuadro, muestra entorno y escala' },
  },
  {
    id: 'handheld-documentary',
    icon: '📹',
    en: { label: 'Handheld Documentary', desc: 'Organic camera movement, raw and authentic feel' },
    es: { label: 'Documental en Mano', desc: 'Movimiento de cámara orgánico, sensación cruda y auténtica' },
  },
  {
    id: 'dolly-in',
    icon: '➡️',
    en: { label: 'Dolly In', desc: 'Camera pushes toward subject, builds tension and focus' },
    es: { label: 'Dolly Entrada', desc: 'La cámara avanza hacia el sujeto, genera tensión y enfoque' },
  },
  {
    id: 'dolly-out',
    icon: '⬅️',
    en: { label: 'Dolly Out', desc: 'Camera pulls back, reveals context and scale' },
    es: { label: 'Dolly Salida', desc: 'La cámara retrocede, revela contexto y escala' },
  },
  {
    id: 'orbit',
    icon: '🔄',
    en: { label: 'Orbit', desc: 'Camera circles subject, dynamic 360-degree reveal' },
    es: { label: 'Órbita', desc: 'La cámara circula al sujeto, revelación dinámica de 360 grados' },
  },
  {
    id: 'crane-up',
    icon: '⬆️',
    en: { label: 'Crane Up', desc: 'Camera rises vertically, epic and majestic perspective' },
    es: { label: 'Grúa Arriba', desc: 'La cámara sube verticalmente, perspectiva épica y majestuosa' },
  },
  {
    id: 'tracking-shot',
    icon: '🎯',
    en: { label: 'Tracking Shot', desc: 'Camera follows subject laterally, dynamic parallel motion' },
    es: { label: 'Toma de Seguimiento', desc: 'La cámara sigue al sujeto lateralmente, movimiento paralelo dinámico' },
  },
  {
    id: 'over-the-shoulder',
    icon: '👥',
    en: { label: 'Over-the-Shoulder', desc: 'Classic dialogue framing, subject in foreground' },
    es: { label: 'Sobre el Hombro', desc: 'Encuadre clásico de diálogo, sujeto en primer plano' },
  },
  {
    id: 'telenovela-dramatic-push-in',
    icon: '💥',
    en: { label: 'Telenovela Dramatic Push-In', desc: 'Intense zoom into face for emotional revelation moments' },
    es: { label: 'Push-In Dramático Telenovela', desc: 'Zoom intenso al rostro para momentos de revelación emocional' },
  },
  {
    id: 'music-video-handheld',
    icon: '🎵',
    en: { label: 'Music Video Handheld', desc: 'Energetic handheld with rhythmic camera movement' },
    es: { label: 'Video Musical en Mano', desc: 'Cámara en mano energética con movimiento rítmico' },
  },
  {
    id: 'social-ad-product-reveal',
    icon: '✨',
    en: { label: 'Social Ad Product Reveal', desc: 'Clean, polished reveal optimized for vertical social formats' },
    es: { label: 'Reveal de Producto Social', desc: 'Revelación limpia y pulida optimizada para formatos sociales verticales' },
  },
  {
    id: 'documentary-street-realism',
    icon: '🏙️',
    en: { label: 'Documentary Street Realism', desc: 'Gritty urban documentary style, natural light and movement' },
    es: { label: 'Realismo Callejero Documental', desc: 'Estilo documental urbano crudo, luz natural y movimiento auténtico' },
  },
];

/**
 * CameraPresetSelector — grid of camera preset cards.
 * @param {{ selected: string, onSelect: (id: string) => void, locale?: 'en'|'es' }} props
 */
export default function CameraPresetSelector({ selected, onSelect, locale = 'en' }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {CAMERA_PRESETS.map(preset => {
        const copy = preset[locale] ?? preset.en;
        const isSelected = selected === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={[
              'flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all duration-150',
              isSelected
                ? 'bg-violet-900/40 border-violet-600/70 shadow-violet-900/30 shadow-lg'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60',
            ].join(' ')}
          >
            <span className="text-xl leading-none">{preset.icon}</span>
            <span className={`text-xs font-medium leading-snug ${isSelected ? 'text-violet-200' : 'text-zinc-300'}`}>
              {copy.label}
            </span>
            <span className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">
              {copy.desc}
            </span>
            {isSelected && (
              <span className="mt-auto text-[9px] uppercase tracking-widest text-violet-400 font-semibold">
                {locale === 'es' ? 'Seleccionado' : 'Selected'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
