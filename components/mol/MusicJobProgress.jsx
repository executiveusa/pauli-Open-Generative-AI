'use client';

import { useState, useEffect } from 'react';

const LABELS = {
  en: {
    title: 'Generating',
    queued: 'Queued',
    running: 'Processing',
    stitching: 'Finalizing',
    succeeded: 'Complete',
    failed: 'Failed',
  },
  es: {
    title: 'Generando',
    queued: 'En cola',
    running: 'Procesando',
    stitching: 'Finalizando',
    succeeded: 'Completado',
    failed: 'Falló',
  },
};

const STATUS_STAGES = ['queued', 'running', 'stitching', 'succeeded'];

export default function MusicJobProgress({ jobId, locale = 'en', onComplete }) {
  const [job, setJob] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isError, setIsError] = useState(false);

  const t = LABELS[locale];

  useEffect(() => {
    const pollJob = async () => {
      try {
        const response = await fetch(`/api/v1/music/jobs/${jobId}`);
        if (!response.ok) throw new Error('Failed to fetch job');

        const data = await response.json();
        setJob(data);

        const stage = STATUS_STAGES.indexOf(data.status);
        setProgress(stage >= 0 ? ((stage + 1) / STATUS_STAGES.length) * 100 : 0);

        if (data.status === 'succeeded' && data.artifact) {
          setTimeout(() => onComplete(data.artifact), 500);
        }

        if (data.status === 'failed') {
          setIsError(true);
        }
      } catch (err) {
        console.error('Job polling error:', err);
      }
    };

    const interval = setInterval(pollJob, 2000);
    pollJob();

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  if (!job) {
    return (
      <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
        <p className="text-purple-300 text-sm">{t.title}...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">{t.title}</h3>

      <div className="space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-purple-300">
              {t[job.status] || job.status}
            </span>
            <span className="text-sm text-purple-300">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                isError
                  ? 'bg-red-600'
                  : job.status === 'succeeded'
                  ? 'bg-green-600'
                  : 'bg-purple-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status details */}
        <div className="text-xs text-purple-300 space-y-1">
          <p>Job ID: <code className="text-purple-200">{jobId.slice(0, 12)}...</code></p>
          {job.errorMessage && (
            <p className="text-red-400">Error: {job.errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
