'use client';

import { useState } from 'react';
import {
  getRequiredConsents,
  getRightsRecommendations,
  validateMusicRights,
} from '@/packages/shared/src/music/rightsValidation.js';

const LABELS = {
  en: {
    title: 'Rights & Consent',
    subtitle: 'Ensure legal compliance for your music',
    intent: 'Usage Intent',
    recommendations: 'Recommendations',
    consents: 'Required Consents',
    accepted: 'I accept these terms',
    warning: 'Some rights restrictions apply to your selection',
    error: 'Rights violation detected',
  },
  es: {
    title: 'Derechos y Consentimiento',
    subtitle: 'Asegura cumplimiento legal para tu música',
    intent: 'Intención de Uso',
    recommendations: 'Recomendaciones',
    consents: 'Consentimientos Requeridos',
    accepted: 'Acepto estos términos',
    warning: 'Se aplican algunas restricciones de derechos a tu selección',
    error: 'Violación de derechos detectada',
  },
};

export default function RightsConsentPanel({ request, onConsent, locale = 'en' }) {
  const t = LABELS[locale];
  const [consents, setConsents] = useState({});
  const [expanded, setExpanded] = useState(false);

  const validation = validateMusicRights(request);
  const requiredConsents = getRequiredConsents(request);
  const recommendations = getRightsRecommendations(request.rightsIntent || 'original', locale);

  const handleConsentChange = (type, value) => {
    const updated = { ...consents, [type]: value };
    setConsents(updated);

    // Check if all required consents met
    const allAccepted = requiredConsents.every(c =>
      !c.required || updated[c.type]
    );

    if (allAccepted && onConsent) {
      onConsent(updated);
    }
  };

  if (!expanded && validation.violations.length === 0 && requiredConsents.length === 0) {
    return null;
  }

  const hasErrors = validation.violations.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  return (
    <div className={`border rounded-lg p-4 ${
      hasErrors
        ? 'bg-red-900/20 border-red-500/30'
        : hasWarnings
        ? 'bg-yellow-900/20 border-yellow-500/30'
        : 'bg-slate-800/50 border-purple-500/20'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-center justify-between"
      >
        <div>
          <h3 className="font-semibold text-white">{t.title}</h3>
          <p className="text-sm text-purple-300">{t.subtitle}</p>
        </div>
        <span className="text-white">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Violations */}
          {hasErrors && (
            <div className="p-3 bg-red-900/40 border border-red-500/30 rounded">
              <p className="text-sm font-semibold text-red-300 mb-2">⚠ {t.error}</p>
              <ul className="text-xs text-red-200 space-y-1">
                {validation.violations.map((v, i) => (
                  <li key={i}>• {v.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && !hasErrors && (
            <div className="p-3 bg-yellow-900/40 border border-yellow-500/30 rounded">
              <p className="text-sm font-semibold text-yellow-300 mb-2">ℹ {t.warning}</p>
              <ul className="text-xs text-yellow-200 space-y-1">
                {validation.warnings.map((w, i) => (
                  <li key={i}>• {w.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded">
              <p className="text-sm font-semibold text-blue-300 mb-2">💡 {t.recommendations}</p>
              <ul className="text-xs text-blue-200 space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Required Consents */}
          {requiredConsents.length > 0 && (
            <div className="space-y-3 p-3 bg-slate-700/30 rounded">
              <p className="text-sm font-semibold text-white">{t.consents}</p>
              {requiredConsents.map(consent => (
                <label
                  key={consent.type}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={consents[consent.type] || false}
                    onChange={e => handleConsentChange(consent.type, e.target.checked)}
                    className="mt-1 w-4 h-4 accent-purple-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      {consent.label}
                      {consent.required && <span className="text-red-400 ml-1">*</span>}
                    </p>
                    <p className="text-xs text-purple-300">{consent.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* AI-Generated Disclosure */}
          {locale === 'en' && (
            <div className="p-3 bg-slate-700/30 rounded text-xs text-purple-300 italic">
              All music generated by our platform will include AI-generated disclosure in metadata.
              Additional labeling may be required for distribution on certain platforms.
            </div>
          )}
          {locale === 'es' && (
            <div className="p-3 bg-slate-700/30 rounded text-xs text-purple-300 italic">
              Toda la música generada por nuestra plataforma incluirá divulgación de IA generada en metadatos.
              Se puede requerir etiquetado adicional para distribución en ciertas plataformas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
