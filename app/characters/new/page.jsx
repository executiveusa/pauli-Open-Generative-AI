'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CharacterPassportForm from '@/components/mol/CharacterPassportForm';

const LABELS = {
  en: {
    title: 'Create Character',
    subtitle: 'Build a new character passport',
    back: 'Back to Characters',
    creating: 'Creating character…',
    success: 'Character created successfully',
  },
  es: {
    title: 'Crear Personaje',
    subtitle: 'Construye un nuevo pasaporte de personaje',
    back: 'Volver a Personajes',
    creating: 'Creando personaje…',
    success: 'Personaje creado exitosamente',
  },
};

export default function NewCharacterPage() {
  const [locale, setLocale] = useState('en');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const t = LABELS[locale];

  async function handleSubmit(formData) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create character');
      }

      const character = await response.json();
      router.push(`/characters/${character.id}`);
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
            href="/characters"
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
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel={submitting ? t.creating : 'Create Character'}
          locale={locale}
        />
      </div>
    </div>
  );
}
