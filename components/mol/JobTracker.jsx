'use client';

import { useState, useEffect, useRef } from 'react';

const LABELS = {
  en: {
    status: 'Status',
    stage: 'Current Stage',
    progress: 'Progress',
    cancel: 'Cancel Job',
    message: 'Message',
  },
  es: {
    status: 'Estado',
    stage: 'Etapa Actual',
    progress: 'Progreso',
    cancel: 'Cancelar Trabajo',
    message: 'Mensaje',
  },
};

const STATUS_META = {
  created: { label: 'Created', labelEs: 'Creado', color: 'bg-zinc-700', pulse: false },
  queued: { label: 'Queued', labelEs: 'En Cola', color: 'bg-amber-500', pulse: true },
  running: { label: 'Running', labelEs: 'Ejecutándose', color: 'bg-blue-500', pulse: true },
  waiting_for_provider: { label: 'Waiting…', labelEs: 'Esperando…', color: 'bg-indigo-500', pulse: true },
  stitching: { label: 'Stitching', labelEs: 'Cosiendo', color: 'bg-violet-500', pulse: true },
  succeeded: { label: 'Complete', labelEs: 'Completado', color: 'bg-emerald-500', pulse: false },
  failed: { label: 'Failed', labelEs: 'Falló', color: 'bg-red-500', pulse: false },
  cancelled: { label: 'Cancelled', labelEs: 'Cancelado', color: 'bg-zinc-500', pulse: false },
};

/**
 * JobTracker — polls job status every 2 seconds, displays progress.
 * @param {{
 *   jobId: string,
 *   onComplete?: (job: object) => void,
 *   onError?: (error: Error) => void,
 *   locale?: 'en'|'es'
 * }} props
 */
export default function JobTracker({ jobId, onComplete, onError, locale = 'en' }) {
  const t = LABELS[locale];
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Fetch job status
  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}`);
      if (!res.ok) throw new Error(`Job fetch failed: ${res.status}`);
      const data = await res.json();

      if (!isMountedRef.current) return;

      setJob(data);
      setError(null);
      setLoading(false);

      // Check if job is done
      if (['succeeded', 'failed', 'cancelled'].includes(data.status)) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        onComplete?.(data);
      }
    } catch (e) {
      if (!isMountedRef.current) return;
      setError(e.message);
      setLoading(false);
      onError?.(e);
    }
  };

  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchJob();

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(fetchJob, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [jobId]);

  const handleCancel = async () => {
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error('Cancel failed');
      const data = await res.json();
      setJob(data);
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 w-24 bg-zinc-800 rounded" />
          <div className="h-2 w-full bg-zinc-800 rounded" />
          <div className="h-3 w-32 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-400">
        {error || 'Job not found'}
      </div>
    );
  }

  const meta = STATUS_META[job.status] || STATUS_META.created;
  const statusLabel = locale === 'es' ? meta.labelEs : meta.label;
  const progress = job.progress ?? 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <p className="text-xs text-zinc-500 font-mono mb-1">{jobId}</p>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white ${meta.color}`}
            >
              {meta.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${meta.color}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${meta.color}`} />
                </span>
              )}
              {!meta.pulse && <span className="h-2 w-2 rounded-full bg-current opacity-80" />}
              {statusLabel}
            </span>
          </div>
        </div>

        {!['succeeded', 'failed', 'cancelled'].includes(job.status) && (
          <button
            onClick={handleCancel}
            className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg hover:bg-red-950/30 transition-colors"
          >
            {t.cancel}
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="px-6 py-4 border-b border-zinc-800 space-y-2">
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{job.stage || '—'}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
      </div>

      {/* Message */}
      {job.message && (
        <div className="px-6 py-3 border-b border-zinc-800 text-sm text-zinc-300">
          {job.message}
        </div>
      )}

      {/* Error */}
      {job.error && (
        <div className="mx-6 my-4 rounded-lg bg-red-950/40 border border-red-900/40 px-4 py-3 text-sm text-red-300">
          {job.error.message || String(job.error)}
        </div>
      )}

      {/* Artifacts */}
      {job.artifacts?.length > 0 && (
        <div className="px-6 py-4">
          <p className="text-xs text-zinc-500 mb-3">Artifacts</p>
          <div className="space-y-2">
            {job.artifacts.map(artifact => (
              <a
                key={artifact.id}
                href={`/api/artifacts/${artifact.id}`}
                download={artifact.filename}
                className="flex items-center gap-3 rounded-lg bg-zinc-800/60 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <span className="text-xs font-mono text-zinc-500">{artifact.kind || 'file'}</span>
                <span className="flex-1 truncate">{artifact.filename}</span>
                <span className="text-xs text-violet-400">↓</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
