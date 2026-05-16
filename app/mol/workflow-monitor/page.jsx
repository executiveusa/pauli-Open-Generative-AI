'use client';
import { useState, useEffect } from 'react';
import JobMonitor from '@/components/mol/JobMonitor';

export default function WorkflowMonitorPage() {
  const [jobIds, setJobIds] = useState([]);
  const [input, setInput] = useState('');

  // Persist watched jobs in session
  useEffect(() => {
    const stored = sessionStorage.getItem('mol_watched_jobs');
    if (stored) setJobIds(JSON.parse(stored));
  }, []);

  function addJob() {
    const id = input.trim();
    if (!id || jobIds.includes(id)) return;
    const next = [id, ...jobIds].slice(0, 20);
    setJobIds(next);
    sessionStorage.setItem('mol_watched_jobs', JSON.stringify(next));
    setInput('');
  }

  function removeJob(id) {
    const next = jobIds.filter(j => j !== id);
    setJobIds(next);
    sessionStorage.setItem('mol_watched_jobs', JSON.stringify(next));
  }

  return (
    <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto">
      <div className="mb-12">
        <p className="text-xs tracking-widest text-zinc-500 uppercase mb-3">Studio</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-zinc-100">Workflow Monitor</h1>
      </div>

      <div className="flex gap-3 mb-8">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addJob()}
          placeholder="Paste a job ID to watch…"
          className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
        />
        <button onClick={addJob}
          className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors">
          Watch
        </button>
      </div>

      {jobIds.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
          <p className="text-zinc-500 text-sm">No jobs being watched.</p>
          <p className="text-zinc-600 text-xs mt-1">Submit a job from any studio page and paste its ID here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobIds.map(id => (
            <div key={id} className="relative">
              <button onClick={() => removeJob(id)}
                className="absolute top-3 right-3 z-10 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                ✕
              </button>
              <JobMonitor jobId={id} compact={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
