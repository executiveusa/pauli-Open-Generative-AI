'use client';

import { useState, useEffect } from 'react';
import MusicPromptComposer from '@/components/mol/MusicPromptComposer';
import StyleTagPicker from '@/components/mol/StyleTagPicker';
import BPMKeyDurationControls from '@/components/mol/BPMKeyDurationControls';
import LyricsEditor from '@/components/mol/LyricsEditor';
import ReferenceAudioUploader from '@/components/mol/ReferenceAudioUploader';
import ACEEngineStatusCard from '@/components/mol/ACEEngineStatusCard';
import MusicJobProgress from '@/components/mol/MusicJobProgress';
import WaveformPlayer from '@/components/mol/WaveformPlayer';
import MusicArtifactLibrary from '@/components/mol/MusicArtifactLibrary';
import MusicToVideoLauncher from '@/components/mol/MusicToVideoLauncher';
import JobTracker from '@/components/mol/JobTracker';
import {
  LOCALE_PRESETS,
  getLocalePreset,
  getGenreSuggestions,
  getMoodSuggestions,
  getDefaultLocale,
} from '@/packages/shared/src/music/localePresets.js';
import {
  buildProviderRoute,
  validateLocaleRequest,
  getPromptHints,
} from '@/packages/shared/src/music/localeRouting.js';

const LABELS = {
  en: {
    title: 'Music Studio',
    subtitle: 'Create original music with AI',
    simple: 'Simple',
    instrumental: 'Instrumental',
    lyrics: 'With Lyrics',
    cover: 'Audio Cover',
    repaint: 'Repaint Section',
    stems: 'Extract Stems',
    generate: 'Generate Music',
    generating: 'Generating…',
    language: 'Language',
    locale: 'Region',
    modeRequired: 'Please select a generation mode',
    promptRequired: 'Please enter a music prompt',
    lyricsRequired: 'Please enter lyrics for this mode',
    audioRequired: 'Please upload a reference audio file',
    noArtifacts: 'No music generated yet',
    library: 'My Music',
    toVideo: 'Create Music Video',
  },
  es: {
    title: 'Estudio de Música',
    subtitle: 'Crea música original con IA',
    simple: 'Simple',
    instrumental: 'Instrumental',
    lyrics: 'Con Letras',
    cover: 'Portada de Audio',
    repaint: 'Repintar Sección',
    stems: 'Extraer Stems',
    generate: 'Generar Música',
    generating: 'Generando…',
    language: 'Idioma',
    locale: 'Región',
    modeRequired: 'Selecciona un modo de generación',
    promptRequired: 'Ingresa una descripción musical',
    lyricsRequired: 'Ingresa letras para este modo',
    audioRequired: 'Sube un archivo de audio de referencia',
    noArtifacts: 'Sin música generada aún',
    library: 'Mi Música',
    toVideo: 'Crear Video Musical',
  },
};

export default function MusicStudioPage() {
  const [uiLocale, setUiLocale] = useState('en');
  const [selectedLocaleCode, setSelectedLocaleCode] = useState('en-US');
  const [mode, setMode] = useState('simple');
  const [jobId, setJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [currentArtifact, setCurrentArtifact] = useState(null);
  const [promptHints, setPromptHints] = useState([]);

  const localePreset = getLocalePreset(selectedLocaleCode);
  const [form, setForm] = useState({
    prompt: '',
    mode: 'simple',
    language: localePreset.language,
    locale: selectedLocaleCode,
    durationSeconds: 60,
    bpm: localePreset.defaultBpm,
    key: localePreset.defaultKey,
    seed: Math.floor(Math.random() * 2147483647),
    lyrics: '',
    sourceAudioAssetId: null,
  });

  const t = LABELS[uiLocale];

  useEffect(() => {
    const hints = getPromptHints(selectedLocaleCode);
    setPromptHints(hints.hints);
    setForm(prev => ({
      ...prev,
      language: localePreset.language,
      locale: selectedLocaleCode,
      bpm: localePreset.defaultBpm,
      key: localePreset.defaultKey,
    }));
  }, [selectedLocaleCode]);

  useEffect(() => {
    // Load artifacts from library
    fetch('/api/v1/music/library')
      .then(r => r.json())
      .then(d => { setArtifacts(d.items ?? []); })
      .catch(e => console.error('Failed to load music library:', e));
  }, []);

  async function handleGenerate() {
    setError(null);

    if (!form.prompt.trim()) {
      setError(t.promptRequired);
      return;
    }

    if (form.mode === 'lyrics' && !form.lyrics.trim()) {
      setError(t.lyricsRequired);
      return;
    }

    if ((form.mode === 'cover' || form.mode === 'repaint') && !form.sourceAudioAssetId) {
      setError(t.audioRequired);
      return;
    }

    // Validate locale constraints
    const validation = validateLocaleRequest(form);
    if (!validation.valid) {
      setError(validation.violations[0].constraint);
      return;
    }

    setSubmitting(true);

    try {
      const request = validation.adjusted;

      // Build optimal provider route for locale
      const route = buildProviderRoute(request);

      const endpoint = `/api/v1/music/${form.mode}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'default-project', // TODO: Get from context
          ...request,
          providerRoute: route.primary,
          fallbackProviders: route.fallbacks,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setJobId(data.jobId);
      setForm(prev => ({ ...prev, prompt: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-black/40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{t.title}</h1>
              <p className="text-purple-200">{t.subtitle}</p>
            </div>
            <div className="flex gap-3">
              <select
                value={uiLocale}
                onChange={e => setUiLocale(e.target.value)}
                className="bg-purple-900/50 text-white px-3 py-2 rounded border border-purple-500/30 hover:border-purple-500/60 text-sm"
                title="UI Language"
              >
                <option value="en">English UI</option>
                <option value="es">Español UI</option>
              </select>
              <select
                value={selectedLocaleCode}
                onChange={e => setSelectedLocaleCode(e.target.value)}
                className="bg-purple-900/50 text-white px-3 py-2 rounded border border-purple-500/30 hover:border-purple-500/60 text-sm"
                title="Music Generation Locale"
              >
                {Object.entries(LOCALE_PRESETS).map(([code, preset]) => (
                  <option key={code} value={code}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Generation Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Selection */}
            <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Generation Mode</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['simple', 'instrumental', 'lyrics', 'cover', 'repaint', 'stems'].map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setForm(prev => ({ ...prev, mode: m })); }}
                    className={`py-2 px-4 rounded font-medium transition ${
                      form.mode === m
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700/50 text-purple-200 hover:bg-slate-700'
                    }`}
                  >
                    {t[m] || m}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Composer */}
            <MusicPromptComposer
              value={form.prompt}
              onChange={prompt => setForm(prev => ({ ...prev, prompt }))}
              locale={uiLocale}
            />

            {/* Style Tags */}
            <StyleTagPicker
              onChange={tags => setForm(prev => ({ ...prev, styleTags: tags }))}
              locale={uiLocale}
            />

            {/* BPM, Key, Duration */}
            <BPMKeyDurationControls
              bpm={form.bpm}
              key={form.key}
              duration={form.durationSeconds}
              onBpmChange={bpm => setForm(prev => ({ ...prev, bpm }))}
              onKeyChange={key => setForm(prev => ({ ...prev, key }))}
              onDurationChange={dur => setForm(prev => ({ ...prev, durationSeconds: dur }))}
              bpmRange={localePreset.bpmRange}
              locale={uiLocale}
            />

            {/* Lyrics Editor (if mode === lyrics) */}
            {form.mode === 'lyrics' && (
              <LyricsEditor
                value={form.lyrics}
                onChange={lyrics => setForm(prev => ({ ...prev, lyrics }))}
                locale={uiLocale}
              />
            )}

            {/* Reference Audio Uploader (if mode requires it) */}
            {(form.mode === 'cover' || form.mode === 'repaint') && (
              <ReferenceAudioUploader
                onUpload={assetId => setForm(prev => ({ ...prev, sourceAudioAssetId: assetId }))}
                locale={uiLocale}
              />
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 text-red-200">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={submitting}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${
                submitting
                  ? 'bg-purple-900/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {submitting ? t.generating : t.generate}
            </button>
          </div>

          {/* Right: Status & Library */}
          <div className="space-y-6">
            {/* Engine Status */}
            <ACEEngineStatusCard locale={locale} />

            {/* Job Progress */}
            {jobId && <MusicJobProgress jobId={jobId} locale={locale} onComplete={artifact => {
              setCurrentArtifact(artifact);
              setArtifacts(prev => [artifact, ...prev]);
              setJobId(null);
            }} />}

            {/* Current Artifact Player */}
            {currentArtifact && (
              <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-4">Now Playing</h3>
                <WaveformPlayer artifact={currentArtifact} />
                <MusicToVideoLauncher artifact={currentArtifact} locale={locale} />
              </div>
            )}

            {/* Recent Artifacts */}
            {artifacts.length > 0 && (
              <MusicArtifactLibrary
                artifacts={artifacts.slice(0, 3)}
                onSelect={setCurrentArtifact}
                locale={uiLocale}
              />
            )}
          </div>
        </div>

        {/* Job Tracker */}
        {jobId && <JobTracker jobId={jobId} type="music-generation" />}
      </main>
    </div>
  );
}
