'use client';
/**
 * JobMonitor — real-time job status display.
 * Design: Taste-Skill DESIGN_VARIANCE:8, Bento 2.0 motion paradigm.
 * Uses SSE subscription via apiClient.subscribeJobEvents.
 */

import { useState, useEffect, useRef } from 'react';
import { getJob, subscribeJobEvents } from '@/lib/apiClient';

const STATUS_META = {
  created:              { label: 'Created',         color: 'bg-zinc-700',    pulse: false },
  queued:               { label: 'Queued',           color: 'bg-amber-500',   pulse: true  },
  running:              { label: 'Running',          color: 'bg-blue-500',    pulse: true  },
  waiting_for_provider: { label: 'Waiting…',         color: 'bg-indigo-500',  pulse: true  },
  stitching:            { label: 'Stitching',        color: 'bg-violet-500',  pulse: true  },
  succeeded:            { label: 'Complete',         color: 'bg-emerald-500', pulse: false },
  failed:               { label: 'Failed',           color: 'bg-red-500',     pulse: false },
  cancelled:            { label: 'Cancelled',        color: 'bg-zinc-500',    pulse: false },
};

function StatusPip({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.created;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white ${meta.color}`}>
      {meta.pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${meta.color}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${meta.color}`} />
        </span>
      )}
      {!meta.pulse && <span className="h-2 w-2 rounded-full bg-current opacity-80" />}
      {meta.label}
    </span>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500 ease-out"
        style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
      />
    </div>
  );
}

/**
 * @param {{ jobId: string, onComplete?: (job: object) => void, compact?: boolean }} props
 */
export default function JobMonitor({ jobId, onComplete, compact = false }) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [connectionWarning, setConnectionWarning] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    getJob(jobId)
      .then(j => { if (!cancelled) setJob(j); })
      .catch(e => { if (!cancelled) setError(e.message); });

    const unsub = subscribeJobEvents(jobId, ({ type, data }) => {
      if (cancelled) return;
      if (type === 'status') { setConnectionWarning(null); setJob(data); }
      if (type === 'done') {
        setConnectionWarning(null);
        setJob(data);
        onComplete?.(data);
      }
      // SSE errors are transient — show a warning but don't break the UI
      if (type === 'error') setConnectionWarning('Connection interrupted — waiting for updates…');
    });
    unsubRef.current = unsub;

    return () => {
      cancelled = true;
      unsub();
    };
  }, [jobId, onComplete]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse">
        <div className="h-4 w-24 bg-zinc-800 rounded" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <StatusPip status={job.status} />
        {job.stage && <span className="text-xs text-zinc-400">{job.stage}</span>}
        <span className="ml-auto text-xs text-zinc-500 font-mono">{job.id.slice(0, 16)}…</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
      {connectionWarning && (
        <div className="px-5 py-2 bg-amber-950/40 border-b border-amber-900/30 text-xs text-amber-400">
          {connectionWarning}
        </div>
      )}
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500 font-mono">{job.id}</span>
          <span className="text-sm font-medium text-zinc-200 capitalize">{job.type.replace(/-/g, ' ')}</span>
        </div>
        <StatusPip status={job.status} />
      </div>

      {/* Progress */}
      <div className="px-5 py-3 space-y-2">
        <ProgressBar progress={job.progress} />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{job.stage ?? '—'}</span>
          <span>{Math.round((job.progress ?? 0) * 100)}%</span>
        </div>
      </div>

      {/* Message */}
      {job.message && (
        <div className="px-5 pb-4 text-sm text-zinc-400">{job.message}</div>
      )}

      {/* Error */}
      {job.error && (
        <div className="mx-5 mb-4 rounded-lg bg-red-950/40 border border-red-900/40 px-4 py-3 text-sm text-red-300">
          {job.error.message}
        </div>
      )}

      {/* Artifacts */}
      {job.artifacts?.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs text-zinc-500 mb-2">Artifacts</p>
          <div className="grid gap-2">
            {job.artifacts.map(a => (
              <a
                key={a.id}
                href={`/api/artifacts/${a.id}`}
                download={a.filename}
                className="flex items-center gap-3 rounded-lg bg-zinc-800/60 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <span className="font-mono text-xs text-zinc-500">{a.kind}</span>
                <span className="flex-1 truncate">{a.filename}</span>
                <span className="text-xs text-violet-400">↓</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
