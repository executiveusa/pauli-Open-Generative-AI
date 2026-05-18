'use client';
import { useState } from 'react';
import FileUploader from '@/components/mol/FileUploader';
import JobMonitor from '@/components/mol/JobMonitor';
import { createProject, createMusicVideoJob } from '@/lib/apiClient';

export default function MusicVideoPage() {
  const [projectId, setProjectId] = useState(null);
  const [songAsset, setSongAsset] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    style: '',
    theme: '',
    storyIdea: '',
    fps: 24,
    minSceneSeconds: 3,
    maxSceneSeconds: 8,
    beatBias: 0.7,
    mode: 'image-to-video',
    aspectRatio: '9:16',
  });

  const field = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function ensureProject() {
    if (projectId) return projectId;
    const p = await createProject('My Music Video Project');
    setProjectId(p.id);
    return p.id;
  }

  async function handleSongUploaded(asset) {
    setSongAsset(asset);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!songAsset) { setError('Upload a song first'); return; }
    setSubmitting(true); setError(null);
    try {
      const pid = await ensureProject();
      const job = await createMusicVideoJob({
        projectId: pid,
        songAssetId: songAsset.id,
        ...form,
        fps: Number(form.fps),
        minSceneSeconds: Number(form.minSceneSeconds),
        maxSceneSeconds: Number(form.maxSceneSeconds),
        beatBias: Number(form.beatBias),
      });
      setJobId(job.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
      {/* Split-screen header — no centered hero */}
      <div className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-widest text-zinc-500 uppercase mb-3">Studio</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-zinc-100">Music Video</h1>
        </div>
        {songAsset && (
          <div className="text-right">
            <p className="text-xs text-zinc-500">Song loaded</p>
            <p className="text-sm text-emerald-400 font-medium">{songAsset.originalFilename}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8">
        {/* Upload zone */}
        {!projectId ? (
          <FileUploader
            projectId="__pending__"
            accept="audio/*"
            label="Drop your song here to start"
            onUploaded={async (asset) => {
              const pid = await ensureProject();
              setSongAsset(asset);
              setProjectId(pid);
            }}
          />
        ) : (
          <FileUploader projectId={projectId} accept="audio/*" label="Upload song" onUploaded={handleSongUploaded} />
        )}

        {/* Form grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Style / aesthetic" value={form.style} onChange={field('style')} placeholder="cinematic neon drill" />
          <FormField label="Theme / mood" value={form.theme} onChange={field('theme')} placeholder="redemption, motion, streetlights" />
          <FormField label="Story idea" value={form.storyIdea} onChange={field('storyIdea')} placeholder="artist moves from alley to rooftop to stage" className="md:col-span-2" />

          <SelectField label="Video mode" value={form.mode} onChange={field('mode')} options={[
            { value: 'image-to-video', label: 'Image-to-Video' },
            { value: 'text-to-video',  label: 'Text-to-Video' },
          ]} />
          <SelectField label="Aspect ratio" value={form.aspectRatio} onChange={field('aspectRatio')} options={[
            { value: '9:16',  label: '9:16 (Shorts/Reels)' },
            { value: '16:9',  label: '16:9 (YouTube)' },
            { value: '1:1',   label: '1:1 (Square)' },
          ]} />

          <RangeField label={`FPS: ${form.fps}`} value={form.fps} onChange={field('fps')} min={12} max={60} step={1} />
          <RangeField label={`Beat bias: ${form.beatBias}`} value={form.beatBias} onChange={field('beatBias')} min={0} max={1} step={0.05} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !songAsset}
            className="px-6 py-3 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating job…' : 'Generate Music Video'}
          </button>
        </div>
      </form>

      {/* Job monitor */}
      {jobId && (
        <div className="mt-10">
          <p className="text-xs text-zinc-500 mb-3 tracking-widest uppercase">Job Status</p>
          <JobMonitor jobId={jobId} onComplete={job => console.log('Job done:', job)} />
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs text-zinc-500 tracking-wide">{label}</label>
      <input
        value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-zinc-500 tracking-wide">{label}</label>
      <select
        value={value} onChange={onChange}
        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-violet-500 transition-colors"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function RangeField({ label, value, onChange, min, max, step }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-zinc-500 tracking-wide">{label}</label>
      <input type="range" value={value} onChange={onChange} min={min} max={max} step={step}
        className="w-full accent-violet-500" />
    </div>
  );
}
