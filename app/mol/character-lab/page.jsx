'use client';
import { useState } from 'react';
import { createProject, createCharacter, listProjectChars } from '@/lib/apiClient';

export default function CharacterLabPage() {
  const [projectId, setProjectId] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    displayName: '',
    promptAnchor: '',
    negativePromptAnchor: 'blurry face, distorted, extra fingers, bad anatomy',
    triggerWords: '',
    consentStatus: 'owned',
    seedStrategy: 'hash-scene',
    baseSeed: 42,
    face: '',
    wardrobe: '',
    colors: '',
  });

  const field = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true); setError(null); setSaved(null);
    try {
      let pid = projectId;
      if (!pid) {
        const p = await createProject('My Characters');
        setProjectId(p.id);
        pid = p.id;
      }
      const passport = await createCharacter({
        projectId: pid,
        displayName: form.displayName,
        promptAnchor: form.promptAnchor,
        negativePromptAnchor: form.negativePromptAnchor,
        triggerWords: form.triggerWords.split(',').map(t => t.trim()).filter(Boolean),
        consentStatus: form.consentStatus,
        seedPolicy: { baseSeed: Number(form.baseSeed), sceneSeedStrategy: form.seedStrategy },
        continuityRules: {
          face: form.face,
          wardrobe: form.wardrobe,
          colors: form.colors.split(',').map(c => c.trim()).filter(Boolean),
        },
      });
      setSaved(passport);
      const list = await listProjectChars(pid);
      setCharacters(list.items);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
      <div className="mb-12">
        <p className="text-xs tracking-widest text-zinc-500 uppercase mb-3">Studio</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-zinc-100">Character Lab</h1>
        <p className="text-sm text-zinc-400 mt-3 max-w-lg">Create a Character Passport to keep your characters consistent across every scene and video.</p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="md:col-span-3 grid gap-5">
          <F label="Character name" value={form.displayName} onChange={field('displayName')} placeholder="Artist, Hero, Protagonist…" required />
          <F label="Prompt anchor (core description)" value={form.promptAnchor} onChange={field('promptAnchor')} placeholder="young Black man, 20s, sharp jawline, dreads, confident expression" required textarea />
          <F label="Negative prompt anchor" value={form.negativePromptAnchor} onChange={field('negativePromptAnchor')} textarea />
          <F label="Trigger words (comma separated)" value={form.triggerWords} onChange={field('triggerWords')} placeholder="mol_artist01, mol_char_a" />
          <F label="Face description" value={form.face} onChange={field('face')} placeholder="sharp jawline, almond eyes, medium skin tone" />
          <F label="Wardrobe / style" value={form.wardrobe} onChange={field('wardrobe')} placeholder="black hoodie, gold chain, white sneakers" />
          <F label="Color palette (comma separated)" value={form.colors} onChange={field('colors')} placeholder="#1a1a1a, #c0a020, #ffffff" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500">Consent status</label>
              <select value={form.consentStatus} onChange={field('consentStatus')}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm">
                <option value="owned">I own this likeness</option>
                <option value="consented">Consent obtained</option>
                <option value="licensed">Licensed</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500">Seed strategy</label>
              <select value={form.seedStrategy} onChange={field('seedStrategy')}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm">
                <option value="hash-scene">Deterministic (hash)</option>
                <option value="fixed">Fixed seed</option>
                <option value="increment">Increment per scene</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {saved && <p className="text-sm text-emerald-400">✓ Character saved: {saved.id}</p>}

          <button type="submit" disabled={submitting}
            className="px-6 py-3 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-40 transition-colors w-fit">
            {submitting ? 'Saving…' : 'Save Character Passport'}
          </button>
        </form>

        {/* Saved characters list */}
        <div className="md:col-span-2">
          <p className="text-xs text-zinc-500 tracking-widest uppercase mb-4">Saved Characters</p>
          {characters.length === 0 ? (
            <p className="text-sm text-zinc-600 italic">No characters yet</p>
          ) : (
            <div className="grid gap-3">
              {characters.map(c => (
                <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="font-medium text-zinc-200 text-sm">{c.displayName}</p>
                  <p className="text-xs text-zinc-500 mt-1 truncate">{c.promptAnchor}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-zinc-600 font-mono">{c.id.slice(0, 16)}…</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.consentStatus === 'owned' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>{c.consentStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function F({ label, value, onChange, placeholder, required, textarea }) {
  const base = "w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors";
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-zinc-500 tracking-wide">{label}</label>
      {textarea
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} required={required} className={`${base} resize-none`} />
        : <input value={value} onChange={onChange} placeholder={placeholder} required={required} className={base} />
      }
    </div>
  );
}
