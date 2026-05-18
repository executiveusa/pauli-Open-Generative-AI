'use client';

import { useState, useEffect } from 'react';
import CameraPresetSelector from '@/components/mol/CameraPresetSelector';
import MotionPresetSelector from '@/components/mol/MotionPresetSelector';
import SupercomputerPanel from '@/components/mol/SupercomputerPanel';
import ArtifactDisplay from '@/components/mol/ArtifactDisplay';
import JobTracker from '@/components/mol/JobTracker';

const LABELS = {
  en: {
    title: 'Cine Studio',
    subtitle: 'Advanced video generation and editing',
    character: 'Character',
    camera: 'Camera Preset',
    motion: 'Motion Preset',
    duration: 'Duration (seconds)',
    aspectRatio: 'Aspect Ratio',
    model: 'Model',
    generate: 'Generate Video',
    generating: 'Generating…',
    selectCharacter: 'Select a character',
    noArtifacts: 'No artifacts yet',
  },
  es: {
    title: 'Estudio de Cine',
    subtitle: 'Generación y edición de video avanzada',
    character: 'Personaje',
    camera: 'Preset de Cámara',
    motion: 'Preset de Movimiento',
    duration: 'Duración (segundos)',
    aspectRatio: 'Relación de Aspecto',
    model: 'Modelo',
    generate: 'Generar Video',
    generating: 'Generando…',
    selectCharacter: 'Selecciona un personaje',
    noArtifacts: 'Sin artefactos aún',
  },
};

const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5', '2.39:1'];

export default function CineStudioPage() {
  const [locale, setLocale] = useState('en');
  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(true);
  const [jobId, setJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    characterId: '',
    cameraPreset: 'medium-shot',
    motionPreset: 'subtle-breathing',
    duration: '5',
    aspectRatio: '16:9',
    routingMode: 'auto-best',
  });

  const t = LABELS[locale];

  useEffect(() => {
    setLoadingChars(true);
    fetch('/api/v1/characters')
      .then(r => r.json())
      .then(d => { setCharacters(d.items ?? []); setLoadingChars(false); })
      .catch(e => { console.error(e); setLoadingChars(false); });
  }, []);

  async function handleGenerate() {
    if (!form.characterId) {
      setError(t.selectCharacter);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          characterId: form.characterId,
          cameraPreset: form.cameraPreset,
          motionPreset: form.motionPreset,
          duration: parseInt(form.duration),
          aspectRatio: form.aspectRatio,
          routingMode: form.routingMode,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to generate video');
      }

      const job = await response.json();
      setJobId(job.id);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{t.subtitle}</p>
        </div>
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

      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Character & Camera */}
          <div className="lg:col-span-1 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Character selector */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase">{t.character}</p>
              {loadingChars ? (
                <p className="text-xs text-zinc-500">{t.selectCharacter}</p>
              ) : (
                <select
                  value={form.characterId}
                  onChange={e => setForm(f => ({ ...f, characterId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">{t.selectCharacter}</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.publicName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Camera preset */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase">{t.camera}</p>
              <CameraPresetSelector
                selected={form.cameraPreset}
                onChange={id => setForm(f => ({ ...f, cameraPreset: id }))}
                locale={locale}
              />
            </div>
          </div>

          {/* Middle: Motion & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Motion preset */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase">{t.motion}</p>
              <MotionPresetSelector
                selected={form.motionPreset}
                onChange={id => setForm(f => ({ ...f, motionPreset: id }))}
                locale={locale}
              />
            </div>

            {/* Duration */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase">{t.duration}</p>
              <input
                type="number"
                min="1"
                max="60"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Aspect ratio */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase">{t.aspectRatio}</p>
              <select
                value={form.aspectRatio}
                onChange={e => setForm(f => ({ ...f, aspectRatio: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {ASPECT_RATIOS.map(ratio => (
                  <option key={ratio} value={ratio}>{ratio}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Model Routing & Results */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model routing */}
            <SupercomputerPanel
              selected={form.routingMode}
              onChange={mode => setForm(f => ({ ...f, routingMode: mode }))}
              locale={locale}
            />

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={submitting || !form.characterId}
              className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white text-sm font-medium transition-colors"
            >
              {submitting ? t.generating : t.generate}
            </button>

            {/* Job tracking */}
            {jobId && (
              <JobTracker
                jobId={jobId}
                onComplete={job => console.log('Video generated:', job)}
                locale={locale}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
