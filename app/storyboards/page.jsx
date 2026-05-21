'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const LABELS = {
  en: {
    title: 'Storyboards',
    subtitle: 'Plan your cinematic shot sequences',
    create: 'New Storyboard',
    loading: 'Loading storyboards…',
    empty: 'No storyboards yet. Create your first one.',
    shots: 'shots',
    created: 'Created',
    status: {
      draft: 'Draft',
      in_progress: 'In Progress',
      complete: 'Complete',
      archived: 'Archived',
    },
  },
  es: {
    title: 'Guiones Gráficos',
    subtitle: 'Planifica tus secuencias de tomas cinematográficas',
    create: 'Nuevo Guion Gráfico',
    loading: 'Cargando guiones…',
    empty: 'Aún no hay guiones. Crea el primero.',
    shots: 'tomas',
    created: 'Creado',
    status: {
      draft: 'Borrador',
      in_progress: 'En Progreso',
      complete: 'Completo',
      archived: 'Archivado',
    },
  },
};

const STATUS_COLORS = {
  draft: 'bg-zinc-700 text-zinc-300',
  in_progress: 'bg-blue-900/50 text-blue-300',
  complete: 'bg-emerald-900/50 text-emerald-300',
  archived: 'bg-zinc-800 text-zinc-500',
};

const LANG_COLORS = {
  en: 'bg-sky-900/40 text-sky-300',
  es: 'bg-amber-900/40 text-amber-300',
  pt: 'bg-green-900/40 text-green-300',
};

function formatDate(iso, locale) {
  try {
    return new Date(iso).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return iso?.slice(0, 10) ?? '—';
  }
}

export default function StoryboardsPage() {
  const [locale, setLocale] = useState('en');
  const [storyboards, setStoryboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const t = LABELS[locale];

  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/storyboards')
      .then(r => r.json())
      .then(d => { setStoryboards(d.items ?? []); setLoading(false); })
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
            href="/storyboards/new"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
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
              <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 animate-pulse h-36" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && storyboards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="text-5xl">🎬</span>
            <p className="text-zinc-500 text-sm max-w-xs">{t.empty}</p>
            <Link
              href="/storyboards/new"
              className="mt-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              {t.create}
            </Link>
          </div>
        )}

        {!loading && !error && storyboards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {storyboards.map(sb => (
              <StoryboardCard key={sb.id} sb={sb} locale={locale} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StoryboardCard({ sb, locale, t }) {
  const statusLabel = t.status[sb.status] ?? sb.status;
  const statusColor = STATUS_COLORS[sb.status] ?? 'bg-zinc-700 text-zinc-300';
  const langColor = LANG_COLORS[sb.language] ?? 'bg-zinc-700 text-zinc-400';

  return (
    <Link
      href={`/storyboards/${sb.id}`}
      className="group flex flex-col gap-3 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 transition-all duration-200 hover:shadow-xl hover:shadow-black/30 hover:scale-[1.01]"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-medium text-zinc-100 text-sm leading-snug group-hover:text-white transition-colors line-clamp-2">
          {sb.title}
        </h2>
        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium uppercase tracking-wider ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-widest ${langColor}`}>
          {sb.language?.toUpperCase() ?? 'EN'}
        </span>
        {sb.targetAspectRatio && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
            {sb.targetAspectRatio}
          </span>
        )}
        {sb.locale && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
            {sb.locale}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto pt-2 border-t border-zinc-800/60">
        <span>{(sb.shotIds?.length ?? 0)} {t.shots}</span>
        <span>{t.created} {formatDate(sb.createdAt, locale)}</span>
      </div>
    </Link>
  );
}
