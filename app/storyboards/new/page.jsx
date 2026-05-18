'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5', '2.39:1', '4:3', '21:9'];
const CONTINUITY_MODES = ['strict', 'loose', 'free'];
const LOCALES = [
  { value: 'es-MX', label: 'México (es-MX)' },
  { value: 'es-CO', label: 'Colombia (es-CO)' },
  { value: 'es-AR', label: 'Argentina (es-AR)' },
  { value: 'es-CL', label: 'Chile (es-CL)' },
  { value: 'es-PE', label: 'Perú (es-PE)' },
  { value: 'es-US', label: 'US Latino (es-US)' },
  { value: 'en-US', label: 'English US (en-US)' },
  { value: 'pt-BR', label: 'Brasil (pt-BR)' },
];

const LABELS = {
  en: {
    title: 'New Storyboard',
    back: '← Back to Storyboards',
    create: 'Create Storyboard',
    creating: 'Creating…',
    fields: {
      title: 'Title',
      titlePlaceholder: 'My Cinematic Project',
      language: 'Production Language',
      locale: 'Region / Locale',
      aspectRatio: 'Target Aspect Ratio',
      continuityMode: 'Continuity Mode',
      continuityDesc: {
        strict: 'Strict — character and location must match exactly across all shots',
        loose: 'Loose — allow minor costume and lighting variations',
        free: 'Free — each shot is independent',
      },
    },
  },
  es: {
    title: 'Nuevo Guion Gráfico',
    back: '← Volver a Guiones',
    create: 'Crear Guion Gráfico',
    creating: 'Creando…',
    fields: {
      title: 'Título',
      titlePlaceholder: 'Mi Proyecto Cinematográfico',
      language: 'Idioma de Producción',
      locale: 'Región / Variante',
      aspectRatio: 'Proporción de Pantalla',
      continuityMode: 'Modo de Continuidad',
      continuityDesc: {
        strict: 'Estricto — personaje y locación deben coincidir exactamente en todas las tomas',
        loose: 'Flexible — se permiten variaciones menores de vestuario e iluminación',
        free: 'Libre — cada toma es independiente',
      },
    },
  },
};

const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors';
const selectCls = inputCls;

export default function NewStoryboardPage() {
  const router = useRouter();
  const [locale, setLocale] = useState('en');
  const t = LABELS[locale];

  const [form, setForm] = useState({
    title: '',
    language: 'es',
    locale: 'es-MX',
    targetAspectRatio: '16:9',
    continuityMode: 'loose',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function field(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/storyboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? `Error ${res.status}`);
      router.push(`/storyboards/${data.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
        <Link href="/storyboards" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
          {t.back}
        </Link>
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
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight mb-8">{t.title}</h1>

        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 tracking-wide">{t.fields.title}</label>
            <input
              value={form.title}
              onChange={field('title')}
              placeholder={t.fields.titlePlaceholder}
              required
              className={inputCls}
            />
          </div>

          {/* Language */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 tracking-wide">{t.fields.language}</label>
            <select value={form.language} onChange={field('language')} className={selectCls}>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>

          {/* Locale */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 tracking-wide">{t.fields.locale}</label>
            <select value={form.locale} onChange={field('locale')} className={selectCls}>
              {LOCALES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 tracking-wide">{t.fields.aspectRatio}</label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map(ar => (
                <button
                  key={ar}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, targetAspectRatio: ar }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                    form.targetAspectRatio === ar
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Continuity Mode */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 tracking-wide">{t.fields.continuityMode}</label>
            <div className="grid gap-2">
              {CONTINUITY_MODES.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, continuityMode: m }))}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                    form.continuityMode === m
                      ? 'bg-violet-900/30 border-violet-700/60 text-violet-100'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className={`w-3 h-3 mt-0.5 rounded-full border-2 shrink-0 ${
                    form.continuityMode === m ? 'border-violet-400 bg-violet-400' : 'border-zinc-600'
                  }`} />
                  <span className="text-xs leading-relaxed">{t.fields.continuityDesc[m]}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !form.title.trim()}
            className="mt-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            {submitting ? t.creating : t.create}
          </button>
        </form>
      </div>
    </div>
  );
}
