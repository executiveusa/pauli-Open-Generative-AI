'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import JobMonitor from '@/components/mol/JobMonitor';
import CameraPresetSelector from '@/components/mol/CameraPresetSelector';
import { ASPECT_RATIOS, CAMERA_PRESETS } from '@/packages/shared/src/schemas/cynthia.js';

const LABELS = {
  en: {
    title: 'Hero Frame',
    subtitle: '5-step hero frame generation wizard',
    step: 'Step',
    of: 'of',
    next: 'Next',
    back: 'Back',
    generate: 'Generate',
    selectCharacter: 'Select Character',
    selectAspectRatio: 'Aspect Ratio',
    selectCamera: 'Camera Preset',
    context: 'Context',
    review: 'Review & Generate',
    characterPlaceholder: 'Choose a character…',
    locationPlaceholder: 'Describe the location…',
    loadingCharacters: 'Loading characters…',
    generating: 'Generating hero frame…',
    characterRequired: 'Please select a character',
    locationRequired: 'Please describe the location',
  },
  es: {
    title: 'Marco Héroe',
    subtitle: 'Asistente de 5 pasos para generación de marco héroe',
    step: 'Paso',
    of: 'de',
    next: 'Siguiente',
    back: 'Atrás',
    generate: 'Generar',
    selectCharacter: 'Seleccionar Personaje',
    selectAspectRatio: 'Relación de Aspecto',
    selectCamera: 'Preset de Cámara',
    context: 'Contexto',
    review: 'Revisar y Generar',
    characterPlaceholder: 'Elige un personaje…',
    locationPlaceholder: 'Describe la ubicación…',
    loadingCharacters: 'Cargando personajes…',
    generating: 'Generando marco héroe…',
    characterRequired: 'Por favor selecciona un personaje',
    locationRequired: 'Por favor describe la ubicación',
  },
};

const STEP_TITLES = {
  en: ['Select Character', 'Choose Aspect Ratio', 'Pick Camera Preset', 'Add Context', 'Review & Generate'],
  es: ['Seleccionar Personaje', 'Elegir Relación de Aspecto', 'Elegir Preset de Cámara', 'Agregar Contexto', 'Revisar y Generar'],
};

export default function HeroFramePage() {
  const [locale, setLocale] = useState('en');
  const [step, setStep] = useState(1);
  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(true);
  const [jobId, setJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    characterId: '',
    aspectRatio: '16:9',
    cameraPresetId: 'close-up',
    location: '',
    language: locale,
  });

  const t = LABELS[locale];
  const stepTitle = STEP_TITLES[locale][step - 1];

  useEffect(() => {
    setLoadingChars(true);
    fetch('/api/v1/characters')
      .then(r => r.json())
      .then(d => { setCharacters(d.items ?? []); setLoadingChars(false); })
      .catch(e => { console.error(e); setLoadingChars(false); });
  }, []);

  async function handleGenerate() {
    if (!form.characterId) { setError(t.characterRequired); return; }
    if (!form.location.trim()) { setError(t.locationRequired); return; }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hero-frame',
          characterId: form.characterId,
          aspectRatio: form.aspectRatio,
          cameraPresetId: form.cameraPresetId,
          location: form.location,
          language: form.language,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create generation job');
      }

      const job = await response.json();
      setJobId(job.id);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  const currentCharacter = characters.find(c => c.id === form.characterId);
  const currentCamera = CAMERA_PRESETS[form.cameraPresetId];

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {t.step} {step} {t.of} 5 — {stepTitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex rounded-lg border border-zinc-800 overflow-hidden text-xs">
            {['en', 'es'].map(l => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`px-3 py-1.5 transition-colors ${locale === l ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* Step progress bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4, 5].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s === step ? 'bg-violet-500' : s < step ? 'bg-emerald-500' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Select Character */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400 mb-4">Select a character to feature in your hero frame</p>
            {loadingChars ? (
              <p className="text-zinc-500 text-sm">{t.loadingCharacters}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {characters.map(char => (
                  <button
                    key={char.id}
                    onClick={() => setForm(f => ({ ...f, characterId: char.id }))}
                    className={`p-4 rounded-xl text-left transition-all border ${
                      form.characterId === char.id
                        ? 'border-violet-500 bg-violet-900/20'
                        : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60'
                    }`}
                  >
                    <p className="font-medium text-zinc-100">{char.publicName}</p>
                    <p className="text-xs text-zinc-500 mt-1">{char.archetype}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{char.locale}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Aspect Ratio */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400 mb-4">Choose output aspect ratio</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ASPECT_RATIOS.map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setForm(f => ({ ...f, aspectRatio: ratio }))}
                  className={`p-4 rounded-xl text-center transition-all border ${
                    form.aspectRatio === ratio
                      ? 'border-violet-500 bg-violet-900/20'
                      : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60'
                  }`}
                >
                  <p className="font-mono font-medium text-zinc-100">{ratio}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Camera Preset */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400 mb-4">Choose a camera preset</p>
            <CameraPresetSelector
              selected={form.cameraPresetId}
              onChange={(id) => setForm(f => ({ ...f, cameraPresetId: id }))}
              locale={locale}
            />
          </div>
        )}

        {/* Step 4: Context */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400 mb-4">Describe the location and context for the shot</p>
            <textarea
              value={form.location}
              onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder={t.locationPlaceholder}
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-400 mb-4">Review your settings before generating</p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Character</p>
                  <p className="text-sm text-zinc-100">{currentCharacter?.publicName}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Aspect Ratio</p>
                  <p className="text-sm text-zinc-100">{form.aspectRatio}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Camera Preset</p>
                  <p className="text-sm text-zinc-100">{currentCamera?.displayName}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Language</p>
                  <p className="text-sm text-zinc-100 uppercase">{form.language}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Location</p>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{form.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* Job monitor */}
        {jobId && (
          <div className="mt-8 space-y-3">
            <p className="text-xs text-zinc-500 mb-3 tracking-widest uppercase">Generation Status</p>
            <JobMonitor jobId={jobId} onComplete={job => console.log('Generation done:', job)} />
          </div>
        )}

        {/* Navigation */}
        {!jobId && (
          <div className="mt-8 flex gap-3 justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-400 text-sm font-medium hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← {t.back}
            </button>

            {step < 5 ? (
              <button
                onClick={() => setStep(Math.min(5, step + 1))}
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                {t.next} →
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-40 transition-colors"
              >
                {submitting ? t.generating : t.generate}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
