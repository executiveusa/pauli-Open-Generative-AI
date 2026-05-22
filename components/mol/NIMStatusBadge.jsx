'use client';

import { useState, useEffect } from 'react';

/**
 * NIMStatusBadge — shows FREE / NVIDIA NIM status in the studio header.
 * Polls /api/nim-status every 30s.
 */
export default function NIMStatusBadge() {
  const [status, setStatus] = useState(null); // null=loading, true=ok, false=down

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const res = await fetch('/api/nim-status');
        if (mounted) setStatus(res.ok);
      } catch {
        if (mounted) setStatus(false);
      }
    }

    check();
    const interval = setInterval(check, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (status === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse" />
        Checking NIM…
      </span>
    );
  }

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/60 border border-red-800/40 px-2.5 py-1 text-xs text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        NIM offline
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-700/40 px-2.5 py-1 text-xs text-emerald-400 font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      ⚡ FREE · NVIDIA NIM
    </span>
  );
}
