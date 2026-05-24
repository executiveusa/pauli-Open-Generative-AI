'use client';

import { useState, useEffect } from 'react';

const PROVIDER_ICONS = {
  'nvidia-nim-proxy': '⚡',
  openai: '🤖',
  fal: '🌊',
  muapi: '🎬',
  huggingface: '🤗',
  comfyui: '🎨',
  mock: '🔧',
};

export default function ProviderHealthStrip({ className = '' }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/v1/providers/health')
      .then((r) => r.json())
      .then(setData)
      .catch(() => null);
  }, []);

  if (!data) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {data.providers.filter((p) => p.enabled).map((provider) => {
        const ok = provider.health?.ok;
        const color =
          ok === true ? 'border-emerald-700 text-emerald-300' :
          ok === false ? 'border-red-800 text-red-400' :
          'border-zinc-700 text-zinc-400';

        return (
          <div
            key={provider.id}
            title={`${provider.displayName}: ${provider.health?.reason ?? (ok ? 'healthy' : 'unknown')}`}
            className={`flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1 bg-zinc-900/50 ${color}`}
          >
            <span>{PROVIDER_ICONS[provider.id] ?? '•'}</span>
            <span>{provider.displayName}</span>
            {provider.freeMode && (
              <span className="text-emerald-500 font-bold">FREE</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
