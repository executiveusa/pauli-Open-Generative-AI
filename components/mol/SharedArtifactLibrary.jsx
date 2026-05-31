'use client';

import { useState, useEffect } from 'react';

const LABELS = {
  en: {
    title: 'Explore Music',
    featured: 'Featured',
    trending: 'Trending',
    category: 'Category',
    allCategories: 'All',
    views: 'views',
    remixes: 'remixes',
    share: 'Share',
    remix: 'Remix',
    loading: 'Loading...',
    empty: 'No artifacts found',
  },
  es: {
    title: 'Explorar Música',
    featured: 'Destacado',
    trending: 'Tendencia',
    category: 'Categoría',
    allCategories: 'Todo',
    views: 'vistas',
    remixes: 'remixes',
    share: 'Compartir',
    remix: 'Remixar',
    loading: 'Cargando...',
    empty: 'No se encontraron artefactos',
  },
};

const CATEGORIES = {
  en: ['All', 'Electronic', 'Hip-Hop', 'Ambient', 'Jazz', 'Pop'],
  es: ['Todo', 'Electrónico', 'Hip-Hop', 'Ambient', 'Jazz', 'Pop'],
};

export default function SharedArtifactLibrary({ onSelect, onRemix, locale = 'en' }) {
  const t = LABELS[locale];
  const [artifacts, setArtifacts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [view, setView] = useState('featured');

  useEffect(() => {
    const loadArtifacts = async () => {
      try {
        const response = await fetch('/api/v1/music/library/shared');
        if (response.ok) {
          const data = await response.json();
          setFeatured(data.featured || []);
          setArtifacts(data.trending || []);
        }
      } catch (err) {
        console.error('Failed to load shared artifacts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtifacts();
  }, []);

  const categories = CATEGORIES[locale] || CATEGORIES.en;
  const displayArtifacts = view === 'featured' ? featured : artifacts;
  const filtered = selectedCategory === (locale === 'en' ? 'All' : 'Todo')
    ? displayArtifacts
    : displayArtifacts.filter(a => {
        const category = a.category || '';
        const selected = selectedCategory.toLowerCase();
        return category.toLowerCase().includes(selected);
      });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-purple-300">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{t.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('featured')}
            className={`px-4 py-2 rounded font-medium transition ${
              view === 'featured'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700/50 text-purple-200 hover:bg-slate-700'
            }`}
          >
            {t.featured}
          </button>
          <button
            onClick={() => setView('trending')}
            className={`px-4 py-2 rounded font-medium transition ${
              view === 'trending'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700/50 text-purple-200 hover:bg-slate-700'
            }`}
          >
            {t.trending}
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700/50 text-purple-200 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Artifacts Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-purple-300">{t.empty}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(artifact => (
            <div
              key={artifact.id}
              className="group bg-slate-800/50 border border-purple-500/20 rounded-lg overflow-hidden hover:border-purple-500/60 transition cursor-pointer"
              onClick={() => onSelect(artifact)}
            >
              {/* Thumbnail placeholder */}
              <div className="w-full h-32 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center relative overflow-hidden">
                <div className="text-4xl text-purple-300/30">♪</div>
                {artifact.featured && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-xs px-2 py-1 rounded font-semibold">
                    ⭐
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-white truncate group-hover:text-purple-300 transition">
                  {artifact.title}
                </h3>
                <p className="text-xs text-purple-300 mb-3">{artifact.category}</p>

                {/* Stats */}
                <div className="flex justify-between text-xs text-purple-400 mb-3">
                  <span>{artifact.viewCount} {t.views}</span>
                  <span>{artifact.remixCount} {t.remixes}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 px-3 rounded bg-purple-600/50 hover:bg-purple-600 text-white text-xs font-medium transition"
                    onClick={e => {
                      e.stopPropagation();
                      onSelect(artifact);
                    }}
                  >
                    {t.share}
                  </button>
                  <button
                    className="flex-1 py-2 px-3 rounded bg-pink-600/50 hover:bg-pink-600 text-white text-xs font-medium transition"
                    onClick={e => {
                      e.stopPropagation();
                      onRemix(artifact);
                    }}
                  >
                    {t.remix}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
