'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CharacterPassportForm from '@/components/mol/CharacterPassportForm';

const LABELS = {
  en: {
    title: 'Edit Character',
    subtitle: 'Update character passport',
    back: 'Back',
    loading: 'Loading character…',
    updating: 'Updating character…',
    success: 'Character updated successfully',
  },
  es: {
    title: 'Editar Personaje',
    subtitle: 'Actualiza el pasaporte del personaje',
    back: 'Volver',
    loading: 'Cargando personaje…',
    updating: 'Actualizando personaje…',
    success: 'Personaje actualizado exitosamente',
  },
};

export default function EditCharacterPage() {
  const [locale, setLocale] = useState('en');
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const params = useParams();
  const router = useRouter();
  const t = LABELS[locale];

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    fetch(`/api/v1/characters/${params.id}`)
      .then(r => r.json())
      .then(d => { setCharacter(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [params.id]);

  async function handleSubmit(formData) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/characters/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update character');
      }

      router.push(`/characters/${params.id}`);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 pb-20 flex items-center justify-center">
        <p className="text-zinc-500">{t.loading}</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 pb-20">
        <div className="px-6 py-8">
          <Link href="/characters" className="text-violet-400">← {t.back}</Link>
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
            href={`/characters/${character.id}`}
            className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors"
          >
            ← {t.back}
          </Link>
        </div>
      </div>

      <div className="px-6 py-8 max-w-4xl mx-auto">
        {error && (
          <div className="mb-6 rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <CharacterPassportForm
          initialData={character}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel={submitting ? t.updating : 'Update Character'}
          locale={locale}
        />
      </div>
    </div>
  );
}
