'use client';

import { useState, useRef, useEffect } from 'react';

const SUGGESTIONS = {
  en: [
    'Upbeat electronic dance track with synths',
    'Calm ambient meditation music',
    'Energetic hip-hop beat with drums',
    'Smooth jazz piano composition',
    'Lo-fi chill hop instrumental',
    'Epic orchestral film score',
  ],
  es: [
    'Canción upbeat de electrónica y síntesis',
    'Música ambiente tranquila y meditativa',
    'Hip-hop energético con batería',
    'Composición suave de jazz y piano',
    'Hip-hop lo-fi relajante',
    'Partitura orquestal épica para película',
  ],
};

export default function MusicPromptComposer({ value, onChange, locale = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [value]);

  const handleSuggestion = (suggestion) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          {locale === 'es' ? 'Descripción Musical' : 'Music Description'}
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-purple-300 hover:text-purple-100 text-sm"
        >
          {locale === 'es' ? 'Sugerencias' : 'Suggestions'}
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={locale === 'es'
          ? 'Describe la música que deseas crear...'
          : 'Describe the music you want to create...'}
        className="w-full bg-slate-700/50 border border-purple-500/30 rounded px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 resize-none"
        rows={3}
      />

      {isOpen && (
        <div className="mt-4 p-3 bg-slate-700/30 border border-purple-500/20 rounded">
          <p className="text-xs text-purple-300 mb-3">
            {locale === 'es' ? 'Ejemplos de sugerencias:' : 'Suggested prompts:'}
          </p>
          <div className="space-y-2">
            {SUGGESTIONS[locale].map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestion(suggestion)}
                className="w-full text-left px-3 py-2 rounded bg-slate-600/40 hover:bg-slate-600/60 text-purple-200 text-sm transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-purple-300 mt-3">
        {locale === 'es'
          ? 'Sé específico: género, tempo, instrumentos, estado de ánimo...'
          : 'Be specific: genre, tempo, instruments, mood...'}
      </p>
    </div>
  );
}
