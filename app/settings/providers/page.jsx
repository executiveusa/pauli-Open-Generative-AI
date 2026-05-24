'use client';

import { useState, useEffect } from 'react';
import FreeModeToggle from '@/components/mol/FreeModeToggle.jsx';
import ProviderHealthStrip from '@/components/mol/ProviderHealthStrip.jsx';

const PROVIDERS = [
  {
    id: 'nvidia-nim-proxy',
    name: 'NVIDIA NIM Proxy',
    nameEs: 'Proxy NVIDIA NIM',
    description: 'Free inference for prompts, scripts, storyboards, and evaluation (40 RPM)',
    descriptionEs: 'Inferencia gratuita para prompts, guiones, storyboards y evaluación (40 solicitudes/min)',
    envBased: true,
    icon: '⚡',
    free: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    nameEs: 'OpenAI',
    description: 'DALL-E and GPT models for image generation and prompt work',
    descriptionEs: 'Modelos DALL-E y GPT para generación de imágenes y prompts',
    icon: '🤖',
    free: false,
  },
  {
    id: 'fal',
    name: 'fal.ai',
    nameEs: 'fal.ai',
    description: 'High-quality image and video generation',
    descriptionEs: 'Generación de imágenes y videos de alta calidad',
    icon: '🌊',
    free: false,
  },
  {
    id: 'muapi',
    name: 'Muapi',
    nameEs: 'Muapi',
    description: 'Image, video, and lip-sync generation',
    descriptionEs: 'Generación de imágenes, videos y sincronización labial',
    icon: '🎬',
    free: false,
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    nameEs: 'Hugging Face',
    description: 'Open-source models and Inference API',
    descriptionEs: 'Modelos de código abierto y API de inferencia',
    icon: '🤗',
    free: false,
  },
  {
    id: 'comfyui',
    name: 'ComfyUI (Self-hosted)',
    nameEs: 'ComfyUI (Autohospedado)',
    description: 'Self-hosted local inference — no API costs',
    descriptionEs: 'Inferencia local autohospedada sin costos de API',
    icon: '🎨',
    free: true,
  },
  {
    id: 'cynthia-gateway',
    name: 'Cynthia Gateway',
    nameEs: 'Gateway Cynthia',
    description: 'Enterprise managed gateway for production deployments',
    descriptionEs: 'Gateway gestionado para despliegues en producción',
    icon: '✨',
    free: false,
  },
];

export default function ProvidersPage() {
  const [locale, setLocale] = useState('en');
  const [keys, setKeys] = useState({});
  const [loading, setLoading] = useState({});
  const [testResults, setTestResults] = useState({});

  const es = locale === 'es';

  const handleTest = async (providerId) => {
    const key = keys[providerId];
    if (!key) return;
    setLoading((l) => ({ ...l, [providerId]: true }));
    try {
      const res = await fetch('/api/v1/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, key }),
      });
      const data = await res.json();
      setTestResults((r) => ({ ...r, [providerId]: data }));
    } catch {
      setTestResults((r) => ({ ...r, [providerId]: { valid: false, message: 'Request failed' } }));
    } finally {
      setLoading((l) => ({ ...l, [providerId]: false }));
    }
  };

  const handleSave = async (providerId) => {
    const key = keys[providerId];
    if (!key) return;
    setLoading((l) => ({ ...l, [providerId]: true }));
    try {
      await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, key }),
      });
    } finally {
      setLoading((l) => ({ ...l, [providerId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {es ? 'Configurar Proveedores' : 'Provider Configuration'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {es ? 'Administra tus claves de API y el modo de enrutamiento' : 'Manage your API keys and routing mode'}
            </p>
          </div>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* Free Mode panel */}
        <section>
          <h2 className="text-base font-semibold text-zinc-200 mb-3">
            {es ? 'Modo Gratuito (NVIDIA NIM)' : 'Free Mode (NVIDIA NIM)'}
          </h2>
          <FreeModeToggle />
        </section>

        {/* Provider health */}
        <section>
          <h2 className="text-base font-semibold text-zinc-200 mb-3">
            {es ? 'Estado de Proveedores' : 'Provider Status'}
          </h2>
          <ProviderHealthStrip />
        </section>

        {/* Security notice */}
        <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-xl text-blue-300 text-sm">
          <p className="font-semibold mb-1">
            {es ? 'Seguridad' : 'Security'}
          </p>
          <p className="text-xs text-blue-400">
            {es
              ? 'Las claves de API se almacenan cifradas en el servidor y nunca se envían al navegador.'
              : 'API keys are encrypted server-side and never sent to the browser. BYOK keys are scoped to your organization.'}
          </p>
        </div>

        {/* Provider cards */}
        <section>
          <h2 className="text-base font-semibold text-zinc-200 mb-4">
            {es ? 'Proveedores BYOK' : 'BYOK Providers'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PROVIDERS.filter((p) => !p.envBased).map((provider) => {
              const testResult = testResults[provider.id];
              const isLoading = loading[provider.id];
              const hasKey = !!keys[provider.id];

              return (
                <div
                  key={provider.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-100">
                          {es ? provider.nameEs : provider.name}
                        </h3>
                        {provider.free && (
                          <span className="text-xs bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 rounded-full px-2 py-0.5">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {es ? provider.descriptionEs : provider.description}
                      </p>
                    </div>
                  </div>

                  {testResult && (
                    <p className={`text-xs px-3 py-2 rounded-lg border ${
                      testResult.valid
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        : 'bg-red-950/40 border-red-800 text-red-400'
                    }`}>
                      {testResult.valid ? '✓ ' : '✗ '}{testResult.message}
                    </p>
                  )}

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      {es ? 'Clave de API' : 'API Key'}
                    </label>
                    <input
                      type="password"
                      placeholder={es ? 'Pegue su clave...' : 'Paste your key...'}
                      value={keys[provider.id] ?? ''}
                      onChange={(e) => setKeys((k) => ({ ...k, [provider.id]: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTest(provider.id)}
                      disabled={isLoading || !hasKey}
                      className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg text-xs font-medium transition-colors"
                    >
                      {isLoading ? '…' : (es ? 'Probar' : 'Test')}
                    </button>
                    <button
                      onClick={() => handleSave(provider.id)}
                      disabled={isLoading || !hasKey}
                      className="flex-1 py-2 px-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-lg text-xs font-medium transition-colors text-white"
                    >
                      {isLoading ? '…' : (es ? 'Guardar' : 'Save')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* NVIDIA NIM env-based note */}
        <section className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚡</span>
            <h3 className="font-semibold text-zinc-100">
              {es ? 'Proxy NVIDIA NIM (Modo Gratuito)' : 'NVIDIA NIM Proxy (Free Mode)'}
            </h3>
          </div>
          <p className="text-sm text-zinc-400 mb-3">
            {es
              ? 'El modo gratuito se configura mediante variables de entorno del servidor, no mediante claves BYOK. Contacte al administrador para habilitar.'
              : 'Free Mode is configured via server-side environment variables, not BYOK keys. Contact your administrator to enable.'}
          </p>
          <code className="block text-xs bg-zinc-800 rounded-lg p-3 text-zinc-300 font-mono">
            NVIDIA_NIM_PROXY_ENABLED=true<br />
            NVIDIA_NIM_PROXY_BASE_URL=&lt;proxy-url&gt;<br />
            NVIDIA_NIM_PROXY_API_KEY=&lt;key&gt;<br />
            NVIDIA_NIM_PROXY_MODEL=moonshotai/kimi-k2-thinking<br />
            NVIDIA_NIM_PROXY_RPM=40
          </code>
        </section>
      </main>
    </div>
  );
}
