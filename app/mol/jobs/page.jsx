'use client';
/**
 * app/mol/jobs/page.jsx
 * Jobs & History page — list, filter, detail panel for all Cynthia jobs.
 */

import { useState, useEffect, useCallback } from 'react';
import { listJobs, retryJob, cancelJob } from '@/lib/jobs/client';

const LOCALE_TEXT = {
  en: {
    title: 'Jobs & History',
    filterAll: 'All',
    colId: 'Job ID',
    colType: 'Type',
    colStatus: 'Status',
    colCreated: 'Created',
    colModel: 'Model',
    colPrompt: 'Prompt',
    colActions: 'Actions',
    view: 'View',
    retry: 'Retry',
    cancel: 'Cancel',
    noJobs: 'No jobs found.',
    loading: 'Loading jobs…',
    promptEn: 'English Prompt',
    promptEs: 'Spanish Prompt',
    negPromptEn: 'Negative Prompt (EN)',
    negPromptEs: 'Negative Prompt (ES)',
    provider: 'Provider Route',
    routingMode: 'Routing Mode',
    statusHistory: 'Status History',
    artifacts: 'Artifacts',
    evaluation: 'Evaluation',
    compare: 'Compare',
    close: 'Close',
    noArtifacts: 'No artifacts yet.',
    error: 'Error',
    retried: 'Retry job created',
    cancelled: 'Job cancelled',
  },
  es: {
    title: 'Tareas e Historial',
    filterAll: 'Todo',
    colId: 'ID de Tarea',
    colType: 'Tipo',
    colStatus: 'Estado',
    colCreated: 'Creado',
    colModel: 'Modelo',
    colPrompt: 'Prompt',
    colActions: 'Acciones',
    view: 'Ver',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    noJobs: 'No se encontraron tareas.',
    loading: 'Cargando tareas…',
    promptEn: 'Prompt en Inglés',
    promptEs: 'Prompt en Español',
    negPromptEn: 'Prompt Negativo (EN)',
    negPromptEs: 'Prompt Negativo (ES)',
    provider: 'Ruta de Proveedor',
    routingMode: 'Modo de Enrutamiento',
    statusHistory: 'Historial de Estados',
    artifacts: 'Artefactos',
    evaluation: 'Evaluación',
    compare: 'Comparar',
    close: 'Cerrar',
    noArtifacts: 'Sin artefactos aún.',
    error: 'Error',
    retried: 'Tarea de reintento creada',
    cancelled: 'Tarea cancelada',
  },
};

const STATUS_FILTERS = [
  'all', 'queued', 'running', 'succeeded', 'failed', 'cancelled',
  'needs_key', 'blocked_by_rights', 'blocked_by_safety',
];

const STATUS_BADGE = {
  draft:               { label: 'Draft',              bg: 'bg-zinc-700',       text: 'text-zinc-300',  icon: '',    pulse: false },
  queued:              { label: 'Queued',              bg: 'bg-blue-700',       text: 'text-blue-100',  icon: '',    pulse: false },
  running:             { label: 'Running',             bg: 'bg-yellow-600',     text: 'text-yellow-50', icon: '',    pulse: true  },
  succeeded:           { label: 'Succeeded',           bg: 'bg-emerald-700',    text: 'text-emerald-50',icon: '',    pulse: false },
  failed:              { label: 'Failed',              bg: 'bg-red-700',        text: 'text-red-100',   icon: '',    pulse: false },
  cancelled:           { label: 'Cancelled',           bg: 'bg-zinc-600',       text: 'text-zinc-200',  icon: '',    pulse: false },
  needs_key:           { label: 'Needs Key',           bg: 'bg-orange-700',     text: 'text-orange-50', icon: '',    pulse: false },
  blocked_by_rights:   { label: 'Rights Blocked',      bg: 'bg-red-800',        text: 'text-red-100',   icon: '⚠️',  pulse: false },
  blocked_by_safety:   { label: 'Safety Blocked',      bg: 'bg-red-900',        text: 'text-red-100',   icon: '🚫', pulse: false },
  created:             { label: 'Created',             bg: 'bg-zinc-700',       text: 'text-zinc-300',  icon: '',    pulse: false },
  waiting_for_provider:{ label: 'Waiting',             bg: 'bg-indigo-700',     text: 'text-indigo-100',icon: '',    pulse: true  },
  stitching:           { label: 'Stitching',           bg: 'bg-violet-700',     text: 'text-violet-100',icon: '',    pulse: true  },
};

const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'cancelled', 'blocked_by_rights', 'blocked_by_safety']);

function relativeTime(isoString, locale) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return locale === 'es' ? `hace ${seconds}s` : `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return locale === 'es' ? `hace ${minutes}m` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'es' ? `hace ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === 'es' ? `hace ${days}d` : `${days}d ago`;
}

function StatusBadge({ status }) {
  const meta = STATUS_BADGE[status] ?? { label: status, bg: 'bg-zinc-700', text: 'text-zinc-300', icon: '', pulse: false };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
      {meta.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current`} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {meta.icon && <span>{meta.icon}</span>}
      {meta.label}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-700 text-zinc-300 font-mono">
      {type ?? '—'}
    </span>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="mb-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

function JobDetailPanel({ job, locale, t, onClose, onRetry, onCancel }) {
  if (!job) return null;

  const isRunning = !TERMINAL_STATUSES.has(job.status) && job.status !== 'queued' && job.status !== 'draft';
  const isFailed = job.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pointer-events-none">
      <div className="pointer-events-auto w-full max-w-xl h-full bg-zinc-900 border-l border-zinc-800 overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
          <div>
            <p className="text-xs font-mono text-zinc-500 mb-1">{job.id}</p>
            <div className="flex items-center gap-2">
              <TypeBadge type={job.type} />
              <StatusBadge status={job.status} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFailed && (
              <button
                onClick={() => onRetry(job.id)}
                className="px-3 py-1.5 rounded-lg bg-orange-700 hover:bg-orange-600 text-white text-xs font-medium transition-colors"
              >
                {t.retry}
              </button>
            )}
            {(job.status === 'running' || job.status === 'queued') && (
              <button
                onClick={() => onCancel(job.id)}
                className="px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium transition-colors"
              >
                {t.cancel}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Progress */}
          {job.progress != null && (
            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>{job.stage ?? '—'}</span>
                <span>{Math.round((job.progress ?? 0) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${Math.round((job.progress ?? 0) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Message */}
          {job.message && (
            <div className="rounded-lg bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-300">
              {job.message}
            </div>
          )}

          {/* Error */}
          {job.error && (
            <div className="rounded-lg bg-red-950/40 border border-red-900/30 px-4 py-3">
              <p className="text-xs text-red-400 font-medium mb-1">{t.error}</p>
              <p className="text-sm text-red-300">
                {typeof job.error === 'string' ? job.error : job.error.message ?? JSON.stringify(job.error)}
              </p>
            </div>
          )}

          {/* Prompts */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 space-y-3">
            <DetailRow label={t.promptEn} value={job.inputPrompt} />
            <DetailRow label={t.promptEs} value={job.inputSpanishPrompt} />
            <DetailRow label={t.negPromptEn} value={job.inputNegativePrompt} />
            <DetailRow label={t.negPromptEs} value={job.inputSpanishNegativePrompt} />
          </div>

          {/* Provider info */}
          {(job.modelRoute || job.routingMode) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 space-y-2">
              {job.modelRoute && (
                <DetailRow label={t.provider} value={
                  typeof job.modelRoute === 'object'
                    ? `${job.modelRoute.provider ?? ''}${job.modelRoute.model ? ` / ${job.modelRoute.model}` : ''}`
                    : job.modelRoute
                } />
              )}
              <DetailRow label={t.routingMode} value={job.routingMode} />
            </div>
          )}

          {/* Status History */}
          {job.statusHistory?.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">{t.statusHistory}</p>
              <div className="space-y-1">
                {[...job.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <StatusBadge status={h.status} />
                    <span className="text-zinc-500">{relativeTime(h.at, locale)}</span>
                    {h.message && <span className="text-zinc-400 truncate">{h.message}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artifacts */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">{t.artifacts}</p>
            {job.artifacts?.length > 0 ? (
              <div className="grid gap-2">
                {job.artifacts.map((a, i) => (
                  <div key={a.id ?? i} className="flex items-center gap-3 rounded-lg bg-zinc-800/60 px-3 py-2 text-sm">
                    <span className="font-mono text-xs text-zinc-500">{a.artifactType ?? a.kind ?? 'file'}</span>
                    <span className="flex-1 truncate text-zinc-300">{a.filename || a.url || a.id}</span>
                    {(a.url || a.storagePath) && (
                      <a
                        href={a.url || a.storagePath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-violet-400 hover:text-violet-300"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">{t.noArtifacts}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [locale, setLocale] = useState('en');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const t = LOCALE_TEXT[locale] ?? LOCALE_TEXT.en;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filter !== 'all') filters.status = filter;
      filters.limit = 100;
      const result = await listJobs(filters);
      setJobs(result.jobs ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 5s if any jobs are running
  useEffect(() => {
    const hasActive = jobs.some(j => !TERMINAL_STATUSES.has(j.status) && j.status !== 'draft');
    if (!hasActive) return;
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [jobs, load]);

  async function handleRetry(id) {
    try {
      const newJob = await retryJob(id);
      setActionMsg(t.retried);
      await load();
      setSelectedJob(newJob);
    } catch (e) {
      setActionMsg(`Error: ${e.message}`);
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function handleCancel(id) {
    try {
      const updated = await cancelJob(id);
      setActionMsg(t.cancelled);
      if (selectedJob?.id === id) setSelectedJob(updated);
      await load();
    } catch (e) {
      setActionMsg(`Error: ${e.message}`);
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  const displayedJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="pt-20 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter text-zinc-100">
            {t.title}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {jobs.length} {locale === 'es' ? 'tareas en total' : 'total jobs'}
          </p>
        </div>
        <button
          onClick={() => setLocale(l => l === 'en' ? 'es' : 'en')}
          className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
        >
          {locale === 'en' ? 'ES' : 'EN'}
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200">
          {actionMsg}
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              filter === s
                ? 'bg-violet-700 border-violet-600 text-white'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600',
            ].join(' ')}
          >
            {s === 'all' ? t.filterAll : s}
          </button>
        ))}
      </div>

      {/* Job table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">{t.loading}</div>
      ) : displayedJobs.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">{t.noJobs}</div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{t.colId}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{t.colType}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{t.colStatus}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{t.colCreated}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{t.colModel}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{t.colPrompt}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {displayedJobs.map(job => {
                  const isFailed = job.status === 'failed';
                  const isActive = job.status === 'running' || job.status === 'queued';
                  const modelLabel = job.modelRoute
                    ? (typeof job.modelRoute === 'object'
                        ? (job.modelRoute.provider ?? job.modelRoute.model ?? '—')
                        : job.modelRoute)
                    : '—';
                  const promptPreview = (job.inputPrompt ?? job.inputSpanishPrompt ?? '').slice(0, 50);

                  return (
                    <tr
                      key={job.id}
                      className={[
                        'transition-colors hover:bg-zinc-800/40 cursor-pointer',
                        selectedJob?.id === job.id ? 'bg-zinc-800/60' : 'bg-zinc-900/40',
                      ].join(' ')}
                      onClick={() => setSelectedJob(job)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-zinc-400">
                          {job.id.slice(0, 20)}…
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={job.type} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {relativeTime(job.createdAt, locale)}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{modelLabel}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400 max-w-[200px] truncate">
                        {promptPreview || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs transition-colors"
                          >
                            {t.view}
                          </button>
                          {isFailed && (
                            <button
                              onClick={() => handleRetry(job.id)}
                              className="px-2 py-1 rounded bg-orange-800 hover:bg-orange-700 text-orange-100 text-xs transition-colors"
                            >
                              {t.retry}
                            </button>
                          )}
                          {isActive && (
                            <button
                              onClick={() => handleCancel(job.id)}
                              className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs transition-colors"
                            >
                              {t.cancel}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedJob && (
        <JobDetailPanel
          job={selectedJob}
          locale={locale}
          t={t}
          onClose={() => setSelectedJob(null)}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
