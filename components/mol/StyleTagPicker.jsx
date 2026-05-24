'use client';

import { useState } from 'react';

const TAGS = {
  en: {
    genres: ['Electronic', 'Hip-Hop', 'Jazz', 'Classical', 'Pop', 'Rock', 'Ambient', 'Lo-Fi'],
    moods: ['Energetic', 'Calm', 'Dark', 'Happy', 'Melancholic', 'Cinematic', 'Playful', 'Intense'],
  },
  es: {
    genres: ['Electrónico', 'Hip-Hop', 'Jazz', 'Clásico', 'Pop', 'Rock', 'Ambient', 'Lo-Fi'],
    moods: ['Energético', 'Tranquilo', 'Oscuro', 'Feliz', 'Melancólico', 'Cinemático', 'Juguetón', 'Intenso'],
  },
};

export default function StyleTagPicker({ onChange, locale = 'en' }) {
  const [selected, setSelected] = useState([]);
  const tags = TAGS[locale];

  const handleToggle = (tag) => {
    const newSelected = selected.includes(tag)
      ? selected.filter(t => t !== tag)
      : [...selected, tag];
    setSelected(newSelected);
    onChange(newSelected);
  };

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        {locale === 'es' ? 'Estilo' : 'Style Tags'}
      </h2>

      <div>
        <h3 className="text-sm font-medium text-purple-300 mb-3">
          {locale === 'es' ? 'Géneros' : 'Genres'}
        </h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.genres.map(tag => (
            <button
              key={tag}
              onClick={() => handleToggle(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                selected.includes(tag)
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700/50 text-purple-200 hover:bg-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-purple-300 mb-3">
          {locale === 'es' ? 'Estados de ánimo' : 'Moods'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.moods.map(tag => (
            <button
              key={tag}
              onClick={() => handleToggle(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                selected.includes(tag)
                  ? 'bg-pink-600 text-white'
                  : 'bg-slate-700/50 text-purple-200 hover:bg-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
