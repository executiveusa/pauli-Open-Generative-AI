'use client';

import { useEffect, useRef } from 'react';

const LABELS = {
  en: {
    title: 'Lyrics',
    placeholder: 'Write your lyrics here. Use [Verse], [Chorus], [Bridge] for structure...',
    hint: 'Structure your lyrics with section markers for better results',
  },
  es: {
    title: 'Letras',
    placeholder: 'Escribe tus letras aquí. Usa [Verse], [Chorus], [Bridge] para estructura...',
    hint: 'Estructura tus letras con marcadores de sección para mejores resultados',
  },
};

export default function LyricsEditor({ value, onChange, locale = 'en' }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 300) + 'px';
    }
  }, [value]);

  const t = LABELS[locale];

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">{t.title}</h2>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={t.placeholder}
        className="w-full bg-slate-700/50 border border-purple-500/30 rounded px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 resize-none font-mono text-sm"
        rows={6}
      />

      <p className="text-xs text-purple-300 mt-3">{t.hint}</p>

      <div className="mt-4 text-xs text-purple-300/70 space-y-1">
        <p>
          {locale === 'es' ? 'Ejemplo:' : 'Example:'}
        </p>
        <code className="block bg-slate-900/50 p-2 rounded border border-purple-500/10">
          {`[Verse]\nYour first verse here...\n[Chorus]\nYour chorus here...\n[Verse]\nSecond verse here...`}
        </code>
      </div>
    </div>
  );
}
