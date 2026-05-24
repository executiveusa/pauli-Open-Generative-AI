'use client';

import { useState } from 'react';

const LABELS = {
  en: {
    title: 'Recent Creations',
    empty: 'No music generated yet',
    mode: 'Mode',
    duration: 'Duration',
    bpm: 'BPM',
    createdAt: 'Created',
  },
  es: {
    title: 'Creaciones Recientes',
    empty: 'Sin música generada aún',
    mode: 'Modo',
    duration: 'Duración',
    bpm: 'BPM',
    createdAt: 'Creado',
  },
};

export default function MusicArtifactLibrary({ artifacts, onSelect, locale = 'en' }) {
  const t = LABELS[locale];
  const [hoveredId, setHoveredId] = useState(null);

  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4 text-center">
        <p className="text-purple-300 text-sm">{t.empty}</p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">{t.title}</h3>

      <div className="space-y-2">
        {artifacts.map((artifact) => (
          <button
            key={artifact.id}
            onClick={() => onSelect(artifact)}
            onMouseEnter={() => setHoveredId(artifact.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="w-full text-left p-3 rounded bg-slate-700/30 hover:bg-slate-700/60 border border-purple-500/10 hover:border-purple-500/30 transition"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-white font-medium text-sm truncate">
                  {artifact.prompt?.slice(0, 30)}...
                </p>
                <p className="text-xs text-purple-300 mt-1">
                  {t.mode}: <span className="text-purple-200">{artifact.mode}</span>
                </p>
              </div>
              {hoveredId === artifact.id && (
                <span className="text-purple-300 text-lg ml-2">▶</span>
              )}
            </div>

            <div className="flex justify-between text-xs text-purple-300">
              <span>{t.duration}: {artifact.durationSeconds}s</span>
              <span>{t.bpm}: {artifact.bpm}</span>
              <span>{formatDate(artifact.createdAt)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
