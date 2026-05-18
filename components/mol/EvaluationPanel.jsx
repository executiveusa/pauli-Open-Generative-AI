'use client';

const DIMENSION_LABELS = {
  en: {
    characterConsistency: 'Character Consistency',
    facialRecognition: 'Facial Recognition',
    continuityAcrossShots: 'Continuity',
    clothingAccuracy: 'Clothing Accuracy',
    backgroundPlausibility: 'Background',
    lighting: 'Lighting',
    composition: 'Composition',
    colorAccuracy: 'Color Accuracy',
    temporalCoherence: 'Temporal Coherence',
    culturalAuthenticity: 'Cultural Authenticity',
  },
  es: {
    characterConsistency: 'Consistencia de Personaje',
    facialRecognition: 'Reconocimiento Facial',
    continuityAcrossShots: 'Continuidad',
    clothingAccuracy: 'Precisión de Ropa',
    backgroundPlausibility: 'Plausibilidad de Fondo',
    lighting: 'Iluminación',
    composition: 'Composición',
    colorAccuracy: 'Precisión de Color',
    temporalCoherence: 'Coherencia Temporal',
    culturalAuthenticity: 'Autenticidad Cultural',
  },
};

const DIMENSIONS = [
  'characterConsistency',
  'facialRecognition',
  'continuityAcrossShots',
  'clothingAccuracy',
  'backgroundPlausibility',
  'lighting',
  'composition',
  'colorAccuracy',
  'temporalCoherence',
  'culturalAuthenticity',
];

/**
 * EvaluationPanel — displays evaluation results with dimension scores.
 * @param {{
 *   evaluation: object,
 *   locale?: 'en'|'es'
 * }} props
 */
export default function EvaluationPanel({ evaluation, locale = 'en' }) {
  const labels = DIMENSION_LABELS[locale];

  if (!evaluation || !evaluation.dimensions) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-zinc-500">
          {locale === 'es' ? 'Sin resultados de evaluación' : 'No evaluation results'}
        </p>
      </div>
    );
  }

  const overallScore = evaluation.overallScore ?? 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/70">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-zinc-100">
            {locale === 'es' ? 'Evaluación' : 'Evaluation'}
          </h3>
          <div className="text-2xl font-bold text-violet-400">
            {(overallScore * 100).toFixed(0)}%
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
            style={{ width: `${overallScore * 100}%` }}
          />
        </div>
      </div>

      {/* Dimensions */}
      <div className="px-6 py-6 space-y-4">
        {DIMENSIONS.map(dim => {
          const score = evaluation.dimensions?.[dim] ?? 0;
          const label = labels[dim] || dim;

          return (
            <div key={dim}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-200">{label}</span>
                <span className="text-sm text-zinc-500 font-mono">
                  {(score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={[
                    'h-full transition-all duration-500',
                    score >= 0.8 ? 'bg-emerald-500' :
                    score >= 0.6 ? 'bg-amber-500' :
                    score >= 0.4 ? 'bg-orange-500' :
                    'bg-red-500'
                  ].join(' ')}
                  style={{ width: `${score * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Metadata */}
      {evaluation.metadata && (
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/30 text-xs text-zinc-500 space-y-1">
          {evaluation.metadata.model && (
            <p>Model: <code className="font-mono">{evaluation.metadata.model}</code></p>
          )}
          {evaluation.metadata.timestamp && (
            <p>Evaluated: {new Date(evaluation.metadata.timestamp).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
