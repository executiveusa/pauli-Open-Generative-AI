'use client';

import { useState, useEffect } from 'react';

const LABELS = {
  en: {
    title: 'Engine Status',
    healthy: 'Ready',
    degraded: 'Degraded',
    unavailable: 'Unavailable',
    checking: 'Checking...',
  },
  es: {
    title: 'Estado del Motor',
    healthy: 'Listo',
    degraded: 'Degradado',
    unavailable: 'No disponible',
    checking: 'Verificando...',
  },
};

export default function ACEEngineStatusCard({ locale = 'en' }) {
  const [status, setStatus] = useState('checking');
  const [providers, setProviders] = useState([]);

  const t = LABELS[locale];

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/v1/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data.musicEngine?.status || 'healthy');
          setProviders(data.musicEngine?.providers || []);
        }
      } catch (err) {
        setStatus('unavailable');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    healthy: 'text-green-400 bg-green-900/20 border-green-500/30',
    degraded: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
    unavailable: 'text-red-400 bg-red-900/20 border-red-500/30',
    checking: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
  };

  const statusLabel = {
    healthy: t.healthy,
    degraded: t.degraded,
    unavailable: t.unavailable,
    checking: t.checking,
  };

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">{t.title}</h3>

      <div className={`px-3 py-2 rounded border ${statusColors[status]}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'healthy' ? 'bg-green-400' :
            status === 'degraded' ? 'bg-yellow-400' :
            status === 'unavailable' ? 'bg-red-400' :
            'bg-blue-400'
          }`} />
          <span className="text-sm font-medium">{statusLabel[status]}</span>
        </div>
      </div>

      {providers.length > 0 && (
        <div className="mt-3 text-xs space-y-1">
          {providers.map((provider) => (
            <div key={provider.name} className="flex justify-between text-purple-300">
              <span>{provider.name}</span>
              <span className={provider.available ? 'text-green-400' : 'text-red-400'}>
                {provider.available ? '●' : '○'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
