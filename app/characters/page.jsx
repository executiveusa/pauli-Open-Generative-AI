'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CharacterCard from '@/components/mol/CharacterCard';

const LABELS = {
  en: {
    title: 'Characters',
    subtitle: 'Manage your character passports',
    create: 'New Character',
    loading: 'Loading characters…',
    empty: 'No characters yet. Create your first character passport.',
    created: 'Created',
  },
  es: {
    title: 'Personajes',
    subtitle: 'Gestiona tus pasaportes de personajes',
    create: 'Nuevo Personaje',
    loading: 'Cargando personajes…',
    empty: 'Sin personajes aún. Crea tu primer pasaporte de personaje.',
    created: 'Creado',
  },
};

export default function CharactersPage() {
  const [locale, setLocale] = useState('en');
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const t = LABELS[locale];

  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/characters')
      .then(r => r.json())
      .then(d => { setCharacters(d.items ?? []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{t.subtitle}</p>
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
            href="/characters/new"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <span className="text-lg leading-none">+</span>
            {t.create}
          </Link>
        </div>
      </div>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 animate-pulse h-56" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && characters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="text-5xl">👤</span>
            <p className="text-zinc-500 text-sm max-w-xs">{t.empty}</p>
            <Link
              href="/characters/new"
              className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
            >
              {t.create}
            </Link>
          </div>
        )}

        {!loading && !error && characters.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map(char => (
              <CharacterCard key={char.id} character={char} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
