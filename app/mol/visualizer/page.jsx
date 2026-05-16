'use client';
import { useState } from 'react';
import FileUploader from '@/components/mol/FileUploader';
import JobMonitor from '@/components/mol/JobMonitor';
import { createProject, createVisualizerJob } from '@/lib/apiClient';

const MODES = ['waveform','spectrum','lyrics kinetic typography','album-art parallax','character reactive portrait','scene loop visualizer','shorts template'];

export default function VisualizerPage() {
  const [projectId, setProjectId] = useState(null);
  const [songAsset, setSongAsset] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    mode: 'spectrum',
    aspectRatio: '9:16',
    captionMode: 'none',
    primaryColor: '#7c3aed',
    secondaryColor: '#3b82f6',
    background: 'dark neon',
  });

  const field = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function ensureProject() {
    if (projectId) return projectId;
    const p = await createProject('My Visualizer');
    setProjectId(p.id);
    return p.id;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!songAsset) { setError('Upload a song first'); return; }
    setSubmitting(true); setError(null);
    try {
      const pid = await ensureProject();
      const job = await createVisualizerJob({ projectId: pid, songAssetId: songAsset.id, ...form });
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
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-zinc-100">Visualizer</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <FileUploader
          projectId={projectId ?? '__pending__'}
          accept="audio/*"
          label="Drop your song here"
          onUploaded={async a => {
            setSongAsset(a);
            if (!projectId) {
              const p = await createProject('Visualizer Project');
              setProjectId(p.id);
            }
          }}
        />

        {/* Mode picker */}
        <div>
          <p className="text-xs text-zinc-500 tracking-wide mb-3">Visualizer mode</p>
          <div className="flex flex-wrap gap-2">
            {MODES.map(m => (
              <button type="button" key={m} onClick={() => setForm(f => ({ ...f, mode: m }))}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  form.mode === m
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500">Aspect ratio</label>
            <select value={form.aspectRatio} onChange={field('aspectRatio')}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-violet-500">
              {['9:16','16:9','1:1'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500">Captions</label>
            <select value={form.captionMode} onChange={field('captionMode')}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-violet-500">
              {['none','lyrics','auto'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500">Primary color</label>
            <input type="color" value={form.primaryColor} onChange={field('primaryColor')}
              className="h-10 w-full rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500">Secondary color</label>
            <input type="color" value={form.secondaryColor} onChange={field('secondaryColor')}
              className="h-10 w-full rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer" />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={submitting || !songAsset}
          className="px-6 py-3 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors w-fit">
          {submitting ? 'Creating…' : 'Generate Visualizer'}
        </button>
      </form>

      {jobId && (
        <div className="mt-10">
          <p className="text-xs text-zinc-500 mb-3 tracking-widest uppercase">Job Status</p>
          <JobMonitor jobId={jobId} />
        </div>
      )}
    </div>
  );
}
