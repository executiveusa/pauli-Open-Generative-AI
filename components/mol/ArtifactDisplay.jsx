'use client';

import { useState } from 'react';

/**
 * ArtifactDisplay — displays single image or video artifact with metadata.
 * @param {{
 *   artifact: object,
 *   locale?: 'en'|'es'
 * }} props
 */
export default function ArtifactDisplay({ artifact, locale = 'en' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (!artifact) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-zinc-500">
          {locale === 'es' ? 'Sin artefacto' : 'No artifact'}
        </p>
      </div>
    );
  }

  const isVideo = artifact.type === 'video' || artifact.mimeType?.includes('video');
  const contentUrl = artifact.url || `/api/artifacts/${artifact.id}`;
  const dimensions = artifact.metadata?.dimensions || {};
  const duration = artifact.metadata?.duration;
  const quality = artifact.metadata?.quality;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col">
      {/* Media container */}
      <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {isVideo ? (
              <video
                src={contentUrl}
                controls
                onLoadStart={() => setLoading(true)}
                onLoadedData={() => setLoading(false)}
                onError={(e) => setError(e.target?.error?.message || 'Failed to load video')}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={contentUrl}
                alt={artifact.filename || 'Artifact'}
                onLoad={() => setLoading(false)}
                onError={(e) => setError('Failed to load image')}
                className="w-full h-full object-cover"
              />
            )}
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-zinc-400 text-sm">Loading…</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Metadata */}
      <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/70 space-y-3">
        {artifact.filename && (
          <div>
            <p className="text-xs text-zinc-500 mb-1">
              {locale === 'es' ? 'Nombre de archivo' : 'Filename'}
            </p>
            <p className="text-sm text-zinc-300 font-mono break-all">{artifact.filename}</p>
          </div>
        )}

        {dimensions.width && dimensions.height && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 mb-1">
                {locale === 'es' ? 'Dimensiones' : 'Dimensions'}
              </p>
              <p className="text-sm text-zinc-300">
                {dimensions.width} × {dimensions.height}
              </p>
            </div>
            {duration && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">
                  {locale === 'es' ? 'Duración' : 'Duration'}
                </p>
                <p className="text-sm text-zinc-300">
                  {Math.round(duration * 100) / 100}s
                </p>
              </div>
            )}
          </div>
        )}

        {quality && (
          <div>
            <p className="text-xs text-zinc-500 mb-1">
              {locale === 'es' ? 'Puntuación de Calidad' : 'Quality Score'}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
                  style={{ width: `${Math.min(quality * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm text-zinc-400 font-mono">
                {(quality * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {artifact.id && (
          <p className="text-xs text-zinc-600 font-mono">
            ID: {artifact.id.slice(0, 12)}…
          </p>
        )}
      </div>
    </div>
  );
}
