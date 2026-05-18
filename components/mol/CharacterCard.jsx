'use client';

import Link from 'next/link';
import ConsentBadge from './ConsentBadge';

const LABELS = {
  en: {
    created: 'Created',
    lastUpdated: 'Updated',
  },
  es: {
    created: 'Creado',
    lastUpdated: 'Actualizado',
  },
};

/**
 * CharacterCard — displays character preview with consent badge.
 * @param {{
 *   character: object,
 *   locale?: 'en'|'es'
 * }} props
 */
export default function CharacterCard({ character, locale = 'en' }) {
  const t = LABELS[locale];
  const createdDate = new Date(character.createdAt).toLocaleDateString(locale);

  return (
    <Link href={`/characters/${character.id}`}>
      <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 p-5 transition-all duration-200 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-violet-300 transition-colors truncate">
              {character.publicName || 'Untitled Character'}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">{character.locale || 'es-MX'}</p>
          </div>
          <ConsentBadge
            isMinor={character.rights?.isMinor}
            isPolitical={character.rights?.isPoliticalFigure}
            consentStatus={character.rights}
          />
        </div>

        {/* Archetype badge */}
        {character.archetype && (
          <div className="mb-3">
            <span className="inline-flex px-2.5 py-1 rounded-full bg-violet-900/40 text-violet-300 text-xs font-medium uppercase tracking-wide">
              {character.archetype}
            </span>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-zinc-500 space-y-1">
          <p>{t.created}: {createdDate}</p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-600 font-mono">{character.id.slice(0, 8)}…</span>
          <span className="text-violet-400 text-xs group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}
