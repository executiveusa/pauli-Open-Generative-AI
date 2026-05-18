'use client';

import { useState } from 'react';

const LABELS = {
  en: {
    title: 'Consent Management',
    identity: 'Identity Use',
    identityDesc: 'Character identity can be used in generated content',
    voice: 'Voice Cloning',
    voiceDesc: 'Character voice can be synthesized and cloned',
    commercial: 'Commercial Use',
    commercialDesc: 'Generated content can be used commercially',
    training: 'Training Data',
    trainingDesc: 'Likeness and voice can be used for model training',
    minorWarning: 'This is a minor — special consent rules apply',
    politicalWarning: 'Political figure detected — ensure compliance',
    submit: 'Save Consent',
    cancel: 'Cancel',
  },
  es: {
    title: 'Gestión de Consentimiento',
    identity: 'Uso de Identidad',
    identityDesc: 'La identidad del personaje puede usarse en contenido generado',
    voice: 'Clonación de Voz',
    voiceDesc: 'La voz del personaje puede sintetizarse y clonarse',
    commercial: 'Uso Comercial',
    commercialDesc: 'El contenido generado puede usarse comercialmente',
    training: 'Datos de Entrenamiento',
    trainingDesc: 'La semejanza y voz pueden usarse para entrenar modelos',
    minorWarning: 'Este es un menor de edad — aplican reglas especiales de consentimiento',
    politicalWarning: 'Figura política detectada — asegure cumplimiento normativo',
    submit: 'Guardar Consentimiento',
    cancel: 'Cancelar',
  },
};

/**
 * ConsentModal — comprehensive consent form with validation.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (consents: object) => Promise<void>,
 *   isMinor?: boolean,
 *   isPolitical?: boolean,
 *   initialConsents?: object,
 *   locale?: 'en'|'es'
 * }} props
 */
export default function ConsentModal({
  isOpen = false,
  onClose,
  onSubmit,
  isMinor = false,
  isPolitical = false,
  initialConsents = {},
  locale = 'en',
}) {
  const t = LABELS[locale];
  const [consents, setConsents] = useState(initialConsents || {
    identity: false,
    voice: false,
    commercial: false,
    training: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key) => {
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(consents);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const canConsent = !isMinor;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-zinc-100 mb-2">{t.title}</h2>

        {/* Warnings */}
        {isMinor && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-900/40">
            <p className="text-xs text-red-400">{t.minorWarning}</p>
          </div>
        )}

        {isPolitical && (
          <div className="mb-4 p-3 rounded-lg bg-orange-950/40 border border-orange-900/40">
            <p className="text-xs text-orange-400">{t.politicalWarning}</p>
          </div>
        )}

        {!canConsent && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-900/40">
            <p className="text-xs text-red-300 font-medium">
              {locale === 'es'
                ? 'Menores de edad no pueden otorgar consentimiento sin supervisión de adulto'
                : 'Minors cannot consent without adult supervision'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Consent checkboxes */}
          {canConsent && (
            <>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={consents.identity || false}
                  onChange={() => handleChange('identity')}
                  className="mt-1 w-4 h-4 rounded border border-zinc-600 bg-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{t.identity}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.identityDesc}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={consents.voice || false}
                  onChange={() => handleChange('voice')}
                  className="mt-1 w-4 h-4 rounded border border-zinc-600 bg-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{t.voice}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.voiceDesc}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={consents.commercial || false}
                  onChange={() => handleChange('commercial')}
                  className="mt-1 w-4 h-4 rounded border border-zinc-600 bg-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{t.commercial}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.commercialDesc}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={consents.training || false}
                  onChange={() => handleChange('training')}
                  className="mt-1 w-4 h-4 rounded border border-zinc-600 bg-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{t.training}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.trainingDesc}</p>
                </div>
              </label>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-zinc-100 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || !canConsent}
              className="flex-1 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 text-white text-sm font-medium transition-colors"
            >
              {submitting ? '…' : t.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
