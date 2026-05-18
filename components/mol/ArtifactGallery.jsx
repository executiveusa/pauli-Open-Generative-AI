'use client';

import { useState } from 'react';
import ArtifactDisplay from './ArtifactDisplay';

const LABELS = {
  en: {
    allTypes: 'All Types',
    imageType: 'Images',
    videoType: 'Videos',
    noArtifacts: 'No artifacts found',
  },
  es: {
    allTypes: 'Todos los Tipos',
    imageType: 'Imágenes',
    videoType: 'Videos',
    noArtifacts: 'No se encontraron artefactos',
  },
};

/**
 * ArtifactGallery — displays filterable grid of artifact thumbnails.
 * @param {{
 *   artifacts: array,
 *   onSelect?: (artifact: object) => void,
 *   locale?: 'en'|'es'
 * }} props
 */
export default function ArtifactGallery({ artifacts = [], onSelect, locale = 'en' }) {
  const t = LABELS[locale];
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = artifacts.filter(a => {
    if (filter === 'all') return true;
    return a.type === filter || a.mimeType?.startsWith(filter);
  });

  const handleSelect = (artifact) => {
    setSelectedArtifact(artifact);
    onSelect?.(artifact);
  };

  // If an artifact is selected, show full display
  if (selectedArtifact) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedArtifact(null)}
          className="text-sm text-violet-400 hover:text-violet-300 font-medium"
        >
          ← {locale === 'es' ? 'Volver a la Galería' : 'Back to Gallery'}
        </button>
        <ArtifactDisplay artifact={selectedArtifact} locale={locale} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'image', 'video'].map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === f
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            ].join(' ')}
          >
            {t[f === 'all' ? 'allTypes' : f === 'image' ? 'imageType' : 'videoType']}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-sm text-zinc-500">{t.noArtifacts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(artifact => {
            const isVideo = artifact.type === 'video' || artifact.mimeType?.includes('video');
            const thumbnailUrl = artifact.thumbnailUrl || artifact.url || `/api/artifacts/${artifact.id}`;

            return (
              <button
                key={artifact.id}
                type="button"
                onClick={() => handleSelect(artifact)}
                className="group relative rounded-xl overflow-hidden border border-zinc-800 hover:border-violet-600 bg-zinc-900/50 aspect-square transition-all duration-200"
              >
                <img
                  src={thumbnailUrl}
                  alt={artifact.filename || 'Artifact'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3C/svg%3E`;
                  }}
                />

                {/* Type badge */}
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                    {isVideo ? '▶️' : '🖼️'}
                  </span>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    ↗
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
