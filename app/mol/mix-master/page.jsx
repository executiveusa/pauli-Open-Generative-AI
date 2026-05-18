'use client';
import { useState } from 'react';
import FileUploader from '@/components/mol/FileUploader';
import JobMonitor from '@/components/mol/JobMonitor';
import { createProject, createMixMasterJob } from '@/lib/apiClient';

const PRESETS = ['clean-master','club-loud','vocal-forward','bass-heavy','radio-polish','warm-analog','drill-vocal','trap-vocal','podcast-clean'];

export default function MixMasterPage() {
  const [projectId, setProjectId] = useState(null);
  const [songAsset, setSongAsset] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    preset: 'clean-master',
    loudnessTarget: -14,
    autotune: false,
    autotuneKey: 'C',
    exportFormat: 'wav',
    vocalBrightness: 5,
    bassWeight: 5,
    compression: 5,
  });

  const field = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!songAsset) { setError('Upload a track first'); return; }
    setSubmitting(true); setError(null);
    try {
      let pid = projectId;
      if (!pid) {
        const p = await createProject('Mix & Master');
        setProjectId(p.id);
        pid = p.id;
      }
      const job = await createMixMasterJob({ projectId: pid, songAssetId: songAsset.id, ...form });
      setJobId(job.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto">
      <div className="mb-12">
        <p className="text-xs tracking-widest text-zinc-500 uppercase mb-3">Studio</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-zinc-100">Mix & Master</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <FileUploader
          projectId={projectId ?? '__pending__'}
          accept="audio/*"
          label="Drop your track or stems here"
          onUploaded={async a => {
            setSongAsset(a);
            if (!projectId) {
              const p = await createProject('Mix Project');
              setProjectId(p.id);
            }
          }}
        />

        {/* Preset chips */}
        <div>
          <p className="text-xs text-zinc-500 tracking-wide mb-3">Mastering preset</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button type="button" key={p} onClick={() => setForm(f => ({ ...f, preset: p }))}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  form.preset === p
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}>{p}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SliderField label={`Vocal brightness: ${form.vocalBrightness}`} value={form.vocalBrightness} onChange={field('vocalBrightness')} min={1} max={10} />
          <SliderField label={`Bass weight: ${form.bassWeight}`} value={form.bassWeight} onChange={field('bassWeight')} min={1} max={10} />
          <SliderField label={`Compression: ${form.compression}`} value={form.compression} onChange={field('compression')} min={1} max={10} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500">Loudness target (LUFS)</label>
            <input type="number" value={form.loudnessTarget} onChange={field('loudnessTarget')} min={-24} max={-6}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500">Export format</label>
            <select value={form.exportFormat} onChange={field('exportFormat')}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm">
              <option value="wav">WAV (lossless)</option>
              <option value="mp3">MP3 (320kbps)</option>
              <option value="flac">FLAC</option>
            </select>
          </div>
        </div>

        {/* Autotune toggle — keyboard accessible via native checkbox */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.autotune}
            onChange={e => setForm(f => ({ ...f, autotune: e.target.checked }))}
            className="sr-only peer"
          />
          <div className={`w-10 h-6 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-violet-500 ${form.autotune ? 'bg-violet-600' : 'bg-zinc-700'}`}>
            <div className={`w-4 h-4 m-1 rounded-full bg-white transition-transform ${form.autotune ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-sm text-zinc-300">Autotune vocals</span>
          {form.autotune && (
            <select value={form.autotuneKey} onChange={field('autotuneKey')}
              className="ml-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs">
              {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(k => <option key={k}>{k}</option>)}
            </select>
          )}
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={submitting || !songAsset}
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 transition-colors w-fit">
          {submitting ? 'Processing…' : 'Mix & Master Track'}
        </button>
      </form>

      {jobId && <div className="mt-10"><JobMonitor jobId={jobId} /></div>}
    </div>
  );
}

function SliderField({ label, value, onChange, min, max }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-zinc-500">{label}</label>
      <input type="range" value={value} onChange={onChange} min={min} max={max}
        className="w-full accent-emerald-500" />
    </div>
  );
}
