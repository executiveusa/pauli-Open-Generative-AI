'use client';

import { useState, useEffect } from 'react';

/**
 * Free Mode toggle — shows NVIDIA NIM proxy status and lets users
 * understand what routes will flow through the free inference path.
 *
 * The actual switch is controlled server-side via NVIDIA_NIM_PROXY_ENABLED env var.
 * This component reads the live status and informs the user.
 */
export default function FreeModeToggle({ className = '' }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/providers/free-mode')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ enabled: false, configured: false }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-zinc-500 text-sm ${className}`}>
        <div className="w-4 h-4 rounded-full bg-zinc-700 animate-pulse" />
        Checking Free Mode…
      </div>
    );
  }

  const active = status?.enabled && status?.configured;

  return (
    <div className={`rounded-xl border p-4 ${active ? 'border-emerald-700 bg-emerald-950/30' : 'border-zinc-700 bg-zinc-900/50'} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          <div>
            <p className="font-semibold text-sm text-white">
              Free Mode{active ? ' — Active' : ' — Inactive'}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Route planning, prompt optimization, and free inference via NVIDIA NIM proxy.
            </p>
          </div>
        </div>

        {active && (
          <span className="text-xs bg-emerald-900/60 text-emerald-300 border border-emerald-700 rounded-full px-2 py-0.5">
            {status.rpm} RPM
          </span>
        )}
      </div>

      {active && status.useCases?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-800/50">
          <p className="text-xs text-zinc-400 mb-2">Routes through Free Mode:</p>
          <div className="flex flex-wrap gap-1">
            {status.useCases.map((uc) => (
              <span key={uc} className="text-xs bg-zinc-800 text-zinc-300 rounded px-2 py-0.5">
                {uc.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {!active && (
        <p className="mt-2 text-xs text-zinc-500">
          {!status?.configured
            ? 'Set NVIDIA_NIM_PROXY_ENABLED=true and configure proxy env vars to enable.'
            : 'Free Mode is disabled. Enable via environment variables.'}
        </p>
      )}

      {status?.videoNote && (
        <p className="mt-2 text-xs text-amber-400 bg-amber-950/30 border border-amber-800/50 rounded px-2 py-1">
          {status.videoNote}
        </p>
      )}
    </div>
  );
}
