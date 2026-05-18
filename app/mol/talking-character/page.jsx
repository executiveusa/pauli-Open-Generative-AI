'use client';

import { useState, useEffect } from 'react';
import JobTracker from '@/components/mol/JobTracker';
import ConsentModal from '@/components/mol/ConsentModal';

const LABELS = {
  en: {
    title: 'Talking Character',
    subtitle: 'Generate character voice and dialogue',
    selectCharacter: 'Select Character',
    dialogue: 'Dialogue',
    voiceLocale: 'Voice Locale',
    model: 'Voice Model',
    generate: 'Generate',
    generating: 'Generating…',
    selectCharacterMsg: 'Choose a character',
    blockedMinor: 'Voice generation not allowed for minors',
    blockedVoiceCloning: 'Voice cloning not allowed for this character',
    consentRequired: 'Consent Required',
    manageConsent: 'Manage Consent',
    dialoguePlaceholder: 'Enter character dialogue…',
  },
  es: {
    title: 'Personaje Hablante',
    subtitle: 'Genera voz y diálogo de personaje',
    selectCharacter: 'Seleccionar Personaje',
    dialogue: 'Diálogo',
    voiceLocale: 'Idioma de Voz',
    model: 'Modelo de Voz',
    generate: 'Generar',
    generating: 'Generando…',
    selectCharacterMsg: 'Elige un personaje',
    blockedMinor: 'Generación de voz no permitida para menores',
    blockedVoiceCloning: 'Clonación de voz no permitida para este personaje',
    consentRequired: 'Consentimiento Requerido',
    manageConsent: 'Administrar Consentimiento',
    dialoguePlaceholder: 'Ingresa el diálogo del personaje…',
  },
};

const VOICE_MODELS = ['openai-tts', 'google-tts', 'azure-tts', 'elevenlabs'];
const VOICE_LOCALES = ['es-MX', 'es-CO', 'es-AR', 'es-CL', 'es-PE', 'es-US', 'en-US'];

export default function TalkingCharacterPage() {
  const [locale, setLocale] = useState('en');
  const [characters, setCharacters] = useState([]);
  const [loadingChars, setLoadingChars] = useState(true);
  const [jobId, setJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  const [form, setForm] = useState({
    characterId: '',
    dialogue: '',
    voiceLocale: 'es-MX',
    model: 'openai-tts',
  });

  const t = LABELS[locale];

  useEffect(() => {
    setLoadingChars(true);
    fetch('/api/v1/characters')
      .then(r => r.json())
      .then(d => { setCharacters(d.items ?? []); setLoadingChars(false); })
      .catch(e => { console.error(e); setLoadingChars(false); });
  }, []);

  const currentCharacter = characters.find(c => c.id === form.characterId);
  const canGenerate = currentCharacter && !currentCharacter.rights?.isMinor && currentCharacter.rights?.voiceCloningAllowed;

  async function handleGenerate() {
    if (!form.characterId) {
      setError(t.selectCharacterMsg);
      return;
    }

    if (currentCharacter?.rights?.isMinor) {
      setError(t.blockedMinor);
      return;
    }

    if (!currentCharacter?.rights?.voiceCloningAllowed) {
      setError(t.blockedVoiceCloning);
      setConsentModalOpen(true);
      return;
    }

    if (!form.dialogue.trim()) {
      setError('Please enter some dialogue');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'voice-generation',
          characterId: form.characterId,
          dialogue: form.dialogue,
          voiceLocale: form.voiceLocale,
          model: form.model,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to generate voice');
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
        <div className="max-w-2xl mx-auto space-y-6">
          {error && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Character selection */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm font-semibold text-zinc-200 mb-3">{t.selectCharacter}</p>
            {loadingChars ? (
              <p className="text-xs text-zinc-500">{t.selectCharacterMsg}</p>
            ) : (
              <select
                value={form.characterId}
                onChange={e => setForm(f => ({ ...f, characterId: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">{t.selectCharacterMsg}</option>
                {characters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.publicName}
                  </option>
                ))}
              </select>
            )}

            {/* Character status warning */}
            {currentCharacter && (
              <div className="mt-4 p-3 rounded-lg bg-zinc-800/50">
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-zinc-400">
                    {currentCharacter.rights?.isMinor ? (
                      <span className="text-red-400">🚫 {t.blockedMinor}</span>
                    ) : !currentCharacter.rights?.voiceCloningAllowed ? (
                      <span className="text-orange-400">⚠️ {t.blockedVoiceCloning}</span>
                    ) : (
                      <span className="text-emerald-400">✅ Voice generation allowed</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dialogue input */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm font-semibold text-zinc-200 mb-3">{t.dialogue}</p>
            <textarea
              value={form.dialogue}
              onChange={e => setForm(f => ({ ...f, dialogue: e.target.value }))}
              placeholder={t.dialoguePlaceholder}
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
            <p className="text-xs text-zinc-500 mt-2">
              {form.dialogue.length} characters
            </p>
          </div>

          {/* Voice settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voice locale */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm font-semibold text-zinc-200 mb-3">{t.voiceLocale}</p>
              <select
                value={form.voiceLocale}
                onChange={e => setForm(f => ({ ...f, voiceLocale: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {VOICE_LOCALES.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Model selection */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm font-semibold text-zinc-200 mb-3">{t.model}</p>
              <select
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {VOICE_MODELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={submitting || !canGenerate}
            className="w-full px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white text-sm font-medium transition-colors"
          >
            {submitting ? t.generating : t.generate}
          </button>

          {/* Job tracker */}
          {jobId && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 mb-3 tracking-widest uppercase">Generation Status</p>
              <JobTracker
                jobId={jobId}
                onComplete={job => console.log('Voice generated:', job)}
                locale={locale}
              />
            </div>
          )}
        </div>
      </div>

      {/* Consent modal */}
      <ConsentModal
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onSubmit={async (consents) => {
          // Submit consent update to server
          try {
            await fetch(`/api/v1/characters/${form.characterId}/consent`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(consents),
            });
          } catch (e) {
            console.error('Failed to update consent:', e);
          }
        }}
        isMinor={currentCharacter?.rights?.isMinor}
        isPolitical={currentCharacter?.rights?.isPoliticalFigure}
        initialConsents={{
          voice: currentCharacter?.rights?.voiceCloningAllowed,
        }}
        locale={locale}
      />
    </div>
  );
}
