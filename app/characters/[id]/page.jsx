'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ConsentBadge from '@/components/mol/ConsentBadge';

const LABELS = {
  en: {
    title: 'Character Details',
    loading: 'Loading character…',
    error: 'Error loading character',
    edit: 'Edit',
    delete: 'Delete',
    identity: 'Identity',
    appearance: 'Appearance',
    wardrobe: 'Wardrobe',
    voice: 'Voice',
    archetype: 'Archetype',
    locale: 'Locale',
    publicName: 'Public Name',
    description: 'Description',
    triggerWords: 'Trigger Words',
    promptAnchor: 'Prompt Anchor',
    continuity: 'Continuity',
    consent: 'Consent Status',
    back: 'Back to Characters',
  },
  es: {
    title: 'Detalles del Personaje',
    loading: 'Cargando personaje…',
    error: 'Error al cargar personaje',
    edit: 'Editar',
    delete: 'Eliminar',
    identity: 'Identidad',
    appearance: 'Apariencia',
    wardrobe: 'Guardarropa',
    voice: 'Voz',
    archetype: 'Arquetipo',
    locale: 'Idioma',
    publicName: 'Nombre Público',
    description: 'Descripción',
    triggerWords: 'Palabras Clave',
    promptAnchor: 'Ancla de Prompts',
    continuity: 'Continuidad',
    consent: 'Estado de Consentimiento',
    back: 'Volver a Personajes',
  },
};

export default function CharacterDetailPage() {
  const [locale, setLocale] = useState('en');
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const t = LABELS[locale];

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    fetch(`/api/v1/characters/${params.id}`)
      .then(r => r.json())
      .then(d => { setCharacter(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 pb-20 flex items-center justify-center">
        <p className="text-zinc-500">{t.loading}</p>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 pb-20">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
          <h1 className="text-xl font-semibold">{t.error}</h1>
          <Link href="/characters" className="px-4 py-2 rounded-xl border border-zinc-800 text-sm">
            ← {t.back}
          </Link>
        </div>
        <div className="px-6 py-8">
          <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{character.publicName}</p>
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
          <Link
            href={`/characters/${character.id}/edit`}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
          >
            ✏️ {t.edit}
          </Link>
          <Link
            href="/characters"
            className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors"
          >
            ← {t.back}
          </Link>
        </div>
      </div>

      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* Hero section */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 mb-8">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-zinc-100 mb-2">{character.publicName}</h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs px-3 py-1.5 rounded-full bg-violet-900/40 text-violet-300 uppercase font-semibold">
                  {character.archetype || 'character'}
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400">
                  {character.locale || 'en-US'}
                </span>
                <ConsentBadge
                  isMinor={character.isMinor}
                  isPolitical={character.isPolitical}
                  consentStatus={{
                    identityAllowed: character.consentStatus?.identityAllowed,
                    voiceCloningAllowed: character.consentStatus?.voiceCloningAllowed,
                    commercialAllowed: character.consentStatus?.commercialAllowed,
                    trainingAllowed: character.consentStatus?.trainingAllowed,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {character.promptAnchor && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">{t.promptAnchor}</p>
                <p className="text-sm text-zinc-300">{character.promptAnchor}</p>
              </div>
            )}
            {character.triggerWords?.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">{t.triggerWords}</p>
                <div className="flex flex-wrap gap-2">
                  {character.triggerWords.map(word => (
                    <span key={word} className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 font-mono">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details sections */}
        {character.continuityRules && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">{t.continuity}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {character.continuityRules.face && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">{t.appearance}</p>
                  <p className="text-sm text-zinc-300">{character.continuityRules.face}</p>
                </div>
              )}
              {character.continuityRules.wardrobe && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">{t.wardrobe}</p>
                  <p className="text-sm text-zinc-300">{character.continuityRules.wardrobe}</p>
                </div>
              )}
              {character.continuityRules.colors?.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Color Palette</p>
                  <div className="flex gap-2">
                    {character.continuityRules.colors.map(color => (
                      <div
                        key={color}
                        className="w-8 h-8 rounded border border-zinc-700"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voice info */}
        {character.voiceLocale && (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">{t.voice}</h3>
            <p className="text-sm text-zinc-300">{character.voiceLocale}</p>
          </div>
        )}

        {/* Metadata footer */}
        <div className="mt-8 text-xs text-zinc-600 space-y-1">
          <p>ID: <code className="font-mono">{character.id}</code></p>
          <p>Created: {new Date(character.createdAt).toLocaleString()}</p>
          {character.updatedAt && <p>Updated: {new Date(character.updatedAt).toLocaleString()}</p>}
        </div>
      </div>
    </div>
  );
}
