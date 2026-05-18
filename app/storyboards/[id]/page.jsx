'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ShotCard from '@/components/mol/ShotCard';
import CameraPresetSelector from '@/components/mol/CameraPresetSelector';
import MotionPresetSelector from '@/components/mol/MotionPresetSelector';

// ── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  en: {
    back: '← Storyboards',
    addShot: '+ Add Shot',
    generateAll: 'Generate All',
    noShotSelected: 'Select a shot to edit',
    noShotHint: 'Click any shot in the list, or add a new one.',
    saveShot: 'Save Shot',
    deleteShot: 'Delete Shot',
    saving: 'Saving…',
    deleting: 'Deleting…',
    shotEditor: 'Shot Editor',
    fields: {
      action: 'Action / Scene Description',
      character: 'Character',
      location: 'Location',
      camera: 'Camera Preset',
      motion: 'Motion Preset',
      lens: 'Lens',
      focalLength: 'Focal Length (mm)',
      emotionalBeat: 'Emotional Beat',
      dialogue: 'Dialogue',
      subtitleText: 'Subtitle Text',
      modelPref: 'Model Preference',
      heroFrameStart: 'Set Start Frame',
      heroFrameEnd: 'Set End Frame',
      promptPreview: 'Prompt Preview',
    },
    shots: 'shots',
    selectCharacter: 'Select character…',
    noCharacters: 'No characters found',
    generating: 'Generating…',
    dragHint: 'Drag to reorder (coming soon)',
  },
  es: {
    back: '← Guiones',
    addShot: '+ Agregar Toma',
    generateAll: 'Generar Todo',
    noShotSelected: 'Selecciona una toma para editar',
    noShotHint: 'Haz clic en cualquier toma de la lista o agrega una nueva.',
    saveShot: 'Guardar Toma',
    deleteShot: 'Eliminar Toma',
    saving: 'Guardando…',
    deleting: 'Eliminando…',
    shotEditor: 'Editor de Toma',
    fields: {
      action: 'Acción / Descripción de Escena',
      character: 'Personaje',
      location: 'Locación',
      camera: 'Preset de Cámara',
      motion: 'Preset de Movimiento',
      lens: 'Lente',
      focalLength: 'Longitud Focal (mm)',
      emotionalBeat: 'Registro Emocional',
      dialogue: 'Diálogo',
      subtitleText: 'Texto de Subtítulo',
      modelPref: 'Preferencia de Modelo',
      heroFrameStart: 'Establecer Cuadro Inicial',
      heroFrameEnd: 'Establecer Cuadro Final',
      promptPreview: 'Vista Previa de Prompt',
    },
    shots: 'tomas',
    selectCharacter: 'Seleccionar personaje…',
    noCharacters: 'Sin personajes',
    generating: 'Generando…',
    dragHint: 'Arrastrar para reordenar (próximamente)',
  },
};

// ── Input components ──────────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors';

function Field({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-zinc-500 tracking-wide font-medium uppercase">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-zinc-600">{hint}</p>}
    </div>
  );
}

// ── Prompt compiler (local) ───────────────────────────────────────────────────
function compilePromptLocally(shot, character) {
  const parts = [];
  if (character?.promptAnchor) parts.push(character.promptAnchor);
  if (character?.triggerWords?.length) parts.push(character.triggerWords.join(', '));
  if (shot.action) parts.push(shot.action);
  if (shot.location) parts.push(`Location: ${shot.location}`);
  if (shot.cameraPreset) parts.push(`Camera: ${shot.cameraPreset}`);
  if (shot.motionPreset) parts.push(`Motion: ${shot.motionPreset}`);
  if (shot.emotionalBeat) parts.push(`Emotional tone: ${shot.emotionalBeat}`);
  if (shot.lens) parts.push(`Lens: ${shot.lens}`);
  if (shot.focalLength) parts.push(`${shot.focalLength}mm`);
  return parts.join(', ');
}

function compileSpanishPromptLocally(shot, character) {
  const parts = [];
  if (character?.promptAnchor) parts.push(character.promptAnchor);
  if (shot.action) parts.push(shot.action);
  if (shot.location) parts.push(`Locación: ${shot.location}`);
  if (shot.emotionalBeat) parts.push(`Tono emocional: ${shot.emotionalBeat}`);
  return parts.join(', ');
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StoryboardEditorPage() {
  const params = useParams();
  const id = params.id;

  const [locale, setLocale] = useState('en');
  const t = T[locale];

  const [storyboard, setStoryboard] = useState(null);
  const [shots, setShots] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [selectedShot, setSelectedShot] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch storyboard and shots
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/v1/storyboards/${id}`).then(r => r.json()),
      fetch(`/api/v1/storyboards/${id}/shots`).then(r => r.json()),
      fetch(`/api/v1/characters`).then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([sb, shotsData, chars]) => {
      setStoryboard(sb);
      setShots(shotsData.items ?? []);
      setCharacters(chars.items ?? []);
      setLoading(false);
    }).catch(e => {
      setError(e.message);
      setLoading(false);
    });
  }, [id]);

  // Select shot → populate editFields
  function selectShot(shot) {
    setSelectedShot(shot);
    setEditFields({ ...shot });
    setSaveMsg(null);
  }

  function fieldChange(key) {
    return e => setEditFields(f => ({ ...f, [key]: e.target.value }));
  }

  function fieldSet(key, value) {
    setEditFields(f => ({ ...f, [key]: value }));
  }

  // Add shot
  async function handleAddShot() {
    try {
      const res = await fetch(`/api/v1/storyboards/${id}/shots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: shots.length }),
      });
      const newShot = await res.json();
      if (!res.ok) throw new Error(newShot?.error?.message ?? 'Error creating shot');
      const updated = [...shots, newShot];
      setShots(updated);
      selectShot(newShot);
    } catch (e) {
      setError(e.message);
    }
  }

  // Save shot
  async function handleSaveShot() {
    if (!selectedShot) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/v1/storyboards/${id}/shots/${selectedShot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFields),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.error?.message ?? 'Error saving');
      setShots(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelectedShot(updated);
      setSaveMsg(locale === 'es' ? '✓ Toma guardada' : '✓ Shot saved');
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  // Delete shot
  async function handleDeleteShot() {
    if (!selectedShot) return;
    if (!confirm(locale === 'es' ? '¿Eliminar esta toma?' : 'Delete this shot?')) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/v1/storyboards/${id}/shots/${selectedShot.id}`, { method: 'DELETE' });
      setShots(prev => prev.filter(s => s.id !== selectedShot.id));
      setSelectedShot(null);
      setEditFields({});
    } catch (e) {
      setError(e.message);
    } finally {
      setIsDeleting(false);
    }
  }

  // Generate all
  async function handleGenerateAll() {
    setIsGenerating(true);
    try {
      await fetch(`/api/v1/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyboardId: id, mode: 'all' }),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  }

  const selectedCharacter = characters.find(c => c.id === editFields.characterIds?.[0]) ?? null;
  const promptEn = compilePromptLocally(editFields, selectedCharacter);
  const promptEs = compileSpanishPromptLocally(editFields, selectedCharacter);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
        <Link href="/storyboards" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
          {t.back}
        </Link>
        <div className="h-4 w-px bg-zinc-800" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-zinc-100 truncate">{storyboard?.title ?? '—'}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-zinc-600 font-mono">{storyboard?.targetAspectRatio}</span>
            <span className="text-[10px] text-zinc-600">{shots.length} {t.shots}</span>
            {storyboard?.language && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 uppercase tracking-wider">
                {storyboard.language}
              </span>
            )}
          </div>
        </div>
        {/* Language toggle */}
        <div className="flex rounded-lg border border-zinc-800 overflow-hidden text-xs shrink-0">
          {['en', 'es'].map(l => (
            <button key={l} onClick={() => setLocale(l)}
              className={`px-3 py-1.5 transition-colors ${locale === l ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-400 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400">✕</button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column — shot list */}
        <aside className="w-full md:w-72 shrink-0 flex flex-col border-r border-zinc-900 overflow-y-auto">
          <div className="p-3 flex flex-col gap-2">
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleAddShot}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                {t.addShot}
              </button>
              <button
                onClick={handleGenerateAll}
                disabled={isGenerating || shots.length === 0}
                className="flex-1 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
              >
                {isGenerating ? t.generating : t.generateAll}
              </button>
            </div>

            {shots.length === 0 && (
              <p className="text-xs text-zinc-600 italic text-center py-4">
                {locale === 'es' ? 'Sin tomas. Agrega la primera.' : 'No shots. Add the first one.'}
              </p>
            )}

            {/* Shot list */}
            <div className="flex flex-col gap-1.5">
              {shots.map((shot, i) => (
                <ShotCard
                  key={shot.id}
                  shot={shot}
                  index={i}
                  isSelected={selectedShot?.id === shot.id}
                  onClick={() => selectShot(shot)}
                  locale={locale}
                />
              ))}
            </div>

            {shots.length > 1 && (
              <p className="text-[10px] text-zinc-700 text-center pt-1">{t.dragHint}</p>
            )}
          </div>
        </aside>

        {/* Right column — shot editor */}
        <main className="flex-1 overflow-y-auto">
          {!selectedShot ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <span className="text-5xl">🎬</span>
              <p className="text-zinc-400 font-medium">{t.noShotSelected}</p>
              <p className="text-sm text-zinc-600">{t.noShotHint}</p>
            </div>
          ) : (
            <div className="p-5 max-w-3xl mx-auto grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">{t.shotEditor}</h2>
                <span className="text-xs text-zinc-600 font-mono">{selectedShot.id.slice(0, 20)}…</span>
              </div>

              {/* Action */}
              <Field label={t.fields.action}>
                <textarea
                  value={editFields.action ?? ''}
                  onChange={fieldChange('action')}
                  rows={3}
                  placeholder={locale === 'es' ? 'Describe la acción de esta toma…' : 'Describe what happens in this shot…'}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {/* Character + Location */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t.fields.character}>
                  <select
                    value={editFields.characterIds?.[0] ?? ''}
                    onChange={e => fieldSet('characterIds', e.target.value ? [e.target.value] : [])}
                    className={inputCls}
                  >
                    <option value="">{t.selectCharacter}</option>
                    {characters.length === 0 && <option disabled>{t.noCharacters}</option>}
                    {characters.map(c => (
                      <option key={c.id} value={c.id}>{c.displayName}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t.fields.location}>
                  <input
                    value={editFields.location ?? ''}
                    onChange={fieldChange('location')}
                    placeholder={locale === 'es' ? 'ej. Azotea al atardecer, Ciudad de México' : 'e.g. Rooftop at sunset, Mexico City'}
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Camera preset */}
              <Field label={t.fields.camera}>
                <CameraPresetSelector
                  selected={editFields.cameraPreset ?? 'medium-shot'}
                  onSelect={val => fieldSet('cameraPreset', val)}
                  locale={locale}
                />
              </Field>

              {/* Motion preset */}
              <Field label={t.fields.motion}>
                <MotionPresetSelector
                  selected={editFields.motionPreset ?? 'subtle-breathing'}
                  onSelect={val => fieldSet('motionPreset', val)}
                  locale={locale}
                  variant="pills"
                />
              </Field>

              {/* Lens + Focal Length + Emotional Beat */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label={t.fields.lens}>
                  <input
                    value={editFields.lens ?? ''}
                    onChange={fieldChange('lens')}
                    placeholder={locale === 'es' ? 'ej. 50mm prime' : 'e.g. 50mm prime'}
                    className={inputCls}
                  />
                </Field>
                <Field label={t.fields.focalLength}>
                  <input
                    type="number"
                    value={editFields.focalLength ?? ''}
                    onChange={fieldChange('focalLength')}
                    placeholder="50"
                    min={8}
                    max={1200}
                    className={inputCls}
                  />
                </Field>
                <Field label={t.fields.emotionalBeat}>
                  <input
                    value={editFields.emotionalBeat ?? ''}
                    onChange={fieldChange('emotionalBeat')}
                    placeholder={locale === 'es' ? 'ej. nostalgia, tensión' : 'e.g. nostalgia, tension'}
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Dialogue + Subtitle */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t.fields.dialogue}>
                  <textarea
                    value={editFields.dialogue ?? ''}
                    onChange={fieldChange('dialogue')}
                    rows={2}
                    placeholder={locale === 'es' ? '"¿Por qué tardaste tanto?"' : '"Why did you take so long?"'}
                    className={`${inputCls} resize-none`}
                  />
                </Field>
                <Field label={t.fields.subtitleText}>
                  <textarea
                    value={editFields.subtitleText ?? ''}
                    onChange={fieldChange('subtitleText')}
                    rows={2}
                    placeholder={locale === 'es' ? 'Texto de subtítulo…' : 'Subtitle text…'}
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </div>

              {/* Model preference */}
              <Field label={t.fields.modelPref} hint={locale === 'es' ? 'Deja vacío para usar el modelo predeterminado del router' : 'Leave blank to use the router default model'}>
                <input
                  value={editFields.modelPreference ?? ''}
                  onChange={fieldChange('modelPreference')}
                  placeholder="e.g. wan2-1, cogvideox, mock"
                  className={inputCls}
                />
              </Field>

              {/* Hero Frame slot */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-zinc-500 tracking-wide font-medium uppercase">
                  Hero Frame
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800/40 text-zinc-400 text-xs hover:border-zinc-600 hover:text-zinc-200 transition-colors"
                    onClick={() => fieldSet('heroFrameStart', Date.now())}
                  >
                    {t.fields.heroFrameStart}
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800/40 text-zinc-400 text-xs hover:border-zinc-600 hover:text-zinc-200 transition-colors"
                    onClick={() => fieldSet('heroFrameEnd', Date.now())}
                  >
                    {t.fields.heroFrameEnd}
                  </button>
                </div>
                {(editFields.heroFrameStart || editFields.heroFrameEnd) && (
                  <p className="text-[10px] text-zinc-600 font-mono">
                    {editFields.heroFrameStart && `Start: ${editFields.heroFrameStart}`}
                    {editFields.heroFrameStart && editFields.heroFrameEnd && ' · '}
                    {editFields.heroFrameEnd && `End: ${editFields.heroFrameEnd}`}
                  </p>
                )}
              </div>

              {/* Prompt Preview accordion */}
              <PromptPreview promptEn={promptEn} promptEs={promptEs} locale={locale} label={t.fields.promptPreview} />

              {/* Save / Delete */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                <button
                  onClick={handleDeleteShot}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-red-900/50 text-red-400 text-xs hover:bg-red-950/30 disabled:opacity-40 transition-colors"
                >
                  {isDeleting ? t.deleting : t.deleteShot}
                </button>
                <div className="flex items-center gap-3">
                  {saveMsg && <span className="text-xs text-emerald-400">{saveMsg}</span>}
                  <button
                    onClick={handleSaveShot}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                  >
                    {isSaving ? t.saving : t.saveShot}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function PromptPreview({ promptEn, promptEs, locale, label }) {
  const [open, setOpen] = useState(false);
  const negPrompt = 'blurry, low quality, deformed, extra limbs, watermark, text overlay';
  const negPromptEs = 'borroso, baja calidad, deformado, extremidades extra, marca de agua, texto superpuesto';

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
      >
        <span className="font-medium uppercase tracking-widest">{label}</span>
        <span className="text-zinc-600">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid gap-4 border-t border-zinc-800 pt-4">
          <PromptBlock label={locale === 'es' ? 'Prompt en Inglés' : 'English Prompt'} text={promptEn} />
          <PromptBlock label={locale === 'es' ? 'Prompt en Español' : 'Spanish Prompt'} text={promptEs} />
          <PromptBlock label={locale === 'es' ? 'Prompt Negativo' : 'Negative Prompt'} text={negPrompt} />
          <PromptBlock label={locale === 'es' ? 'Negativo en Español' : 'Spanish Negative'} text={negPromptEs} />
        </div>
      )}
    </div>
  );
}

function PromptBlock({ label, text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{label}</span>
        <button onClick={copy} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 whitespace-pre-wrap break-words leading-relaxed min-h-[36px]">
        {text || <span className="italic text-zinc-700">—</span>}
      </pre>
    </div>
  );
}
