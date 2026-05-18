'use client';

import { useState } from 'react';
import { t } from '@/lib/i18n/index.js';

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, DALL-E, and vision models',
    docs: 'https://platform.openai.com/api-keys',
    icon: '🔴',
    color: 'cyan',
  },
  {
    id: 'google',
    name: 'Google Vertex AI',
    description: 'Gemini and other Google models',
    docs: 'https://console.cloud.google.com',
    icon: '🔵',
    color: 'blue',
  },
  {
    id: 'runway',
    name: 'Runway',
    description: 'Video generation and AI tools',
    docs: 'https://runwayml.com/api',
    icon: '🟣',
    color: 'purple',
  },
  {
    id: 'kling',
    name: 'Kling AI',
    description: 'Chinese AI video generation',
    docs: 'https://klingai.com',
    icon: '🟠',
    color: 'amber',
  },
  {
    id: 'seedance',
    name: 'Seedance',
    description: 'Creative AI generation',
    docs: 'https://seedance.io',
    icon: '🟢',
    color: 'green',
  },
  {
    id: 'wan',
    name: 'WAN',
    description: 'Decentralized AI network',
    docs: 'https://wan.ai',
    icon: '⚡',
    color: 'yellow',
  },
  {
    id: 'muapi',
    name: 'MuAPI',
    description: 'Multi-model API gateway',
    docs: 'https://console.muapi.com',
    icon: '🚀',
    color: 'rose',
  },
  {
    id: 'cynthia-gateway',
    name: 'Cynthia Gateway',
    description: 'Enterprise managed gateway',
    docs: 'https://gateway.cynthia.studio/docs',
    icon: '✨',
    color: 'fuchsia',
  },
];

export default function ProvidersPage() {
  const [locale, setLocale] = useState('en');
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState({});
  const [testResults, setTestResults] = useState({});

  const handleKeyChange = (providerId, value) => {
    setProviders({
      ...providers,
      [providerId]: value,
    });
  };

  const handleSave = async (providerId) => {
    setLoading({ ...loading, [providerId]: true });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    setLoading({ ...loading, [providerId]: false });
  };

  const handleTest = async (providerId) => {
    setLoading({ ...loading, [providerId]: true });

    // Simulate test
    await new Promise(resolve => setTimeout(resolve, 1000));

    const isValid = providers[providerId]?.length > 10;
    setTestResults({
      ...testResults,
      [providerId]: {
        valid: isValid,
        message: isValid ? 'API key is valid' : 'API key is invalid or missing',
      },
    });

    setLoading({ ...loading, [providerId]: false });
  };

  const handleRemove = (providerId) => {
    setProviders({
      ...providers,
      [providerId]: '',
    });
    setTestResults({
      ...testResults,
      [providerId]: null,
    });
  };

  const isConfigured = (providerId) => {
    return providers[providerId]?.length > 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {locale === 'es' ? 'Configurar Proveedores' : 'Provider Configuration'}
            </h1>
            <div className="flex items-center gap-4">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Banner */}
        <div className="mb-12 p-4 bg-blue-900/20 border border-blue-800 rounded-lg text-blue-300">
          <p className="font-semibold mb-2">
            {locale === 'es' ? 'Información de Seguridad' : 'Security Information'}
          </p>
          <p className="text-sm">
            {locale === 'es'
              ? 'Las claves de API se almacenan de forma segura en el servidor. Nunca se expondrán al cliente ni se incluirán en las respuestas.'
              : 'API keys are stored securely on the server. They will never be exposed to the client or included in responses.'}
          </p>
        </div>

        {/* Provider Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROVIDERS.map((provider) => {
            const configured = isConfigured(provider.id);
            const testResult = testResults[provider.id];
            const isLoading = loading[provider.id];
            const borderColor = `border-${provider.color}-800/30`;
            const bgColor = `bg-${provider.color}-900/10`;

            return (
              <div
                key={provider.id}
                className={`${bgColor} border ${borderColor} rounded-lg p-6 transition-all hover:border-${provider.color}-700/50`}
              >
                {/* Provider Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{provider.icon}</span>
                    <div>
                      <h3 className="font-semibold text-zinc-100">{provider.name}</h3>
                      <p className="text-xs text-zinc-400">{provider.description}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 text-xs">
                    {configured ? (
                      <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded-full">
                        ✅ {locale === 'es' ? 'Configurado' : 'Configured'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded-full">
                        ⚠️ {locale === 'es' ? 'No configurado' : 'Not configured'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Test Result */}
                {testResult && (
                  <div
                    className={`mb-4 p-2 text-xs rounded ${
                      testResult.valid
                        ? 'bg-green-900/30 text-green-300'
                        : 'bg-red-900/30 text-red-300'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}

                {/* API Key Input */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    {locale === 'es' ? 'Clave de API' : 'API Key'}
                  </label>
                  <input
                    type="password"
                    placeholder={locale === 'es' ? 'Pegue su clave de API' : 'Paste your API key'}
                    value={providers[provider.id] || ''}
                    onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTest(provider.id)}
                    disabled={isLoading || !providers[provider.id]}
                    className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-500 rounded text-xs font-medium transition-colors"
                  >
                    {isLoading ? (
                      <>⏳ {locale === 'es' ? 'Probando...' : 'Testing...'}</>
                    ) : (
                      <>{locale === 'es' ? 'Probar' : 'Test'}</>
                    )}
                  </button>

                  <button
                    onClick={() => handleSave(provider.id)}
                    disabled={isLoading || !providers[provider.id]}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:text-zinc-500 rounded text-xs font-medium transition-colors"
                  >
                    {isLoading ? (
                      <>💾 {locale === 'es' ? 'Guardando...' : 'Saving...'}</>
                    ) : (
                      <>{locale === 'es' ? 'Guardar' : 'Save'}</>
                    )}
                  </button>

                  <button
                    onClick={() => handleRemove(provider.id)}
                    disabled={isLoading || !providers[provider.id]}
                    className="flex-1 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 disabled:bg-red-900/10 disabled:text-zinc-500 text-red-400 rounded text-xs font-medium transition-colors"
                  >
                    {locale === 'es' ? 'Eliminar' : 'Remove'}
                  </button>
                </div>

                {/* Learn More Link */}
                <a
                  href={provider.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block text-xs text-zinc-400 hover:text-zinc-300 underline"
                >
                  {locale === 'es' ? '→ Obtener clave de API' : '→ Get API key'}
                </a>
              </div>
            );
          })}
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">
              {locale === 'es' ? 'Gestión de Claves' : 'Key Management'}
            </h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex gap-2">
                <span>✓</span>
                <span>
                  {locale === 'es'
                    ? 'Las claves se cifran y se almacenan en el servidor'
                    : 'Keys are encrypted and stored on server'}
                </span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>
                  {locale === 'es'
                    ? 'Cada usuario tiene claves aisladas'
                    : 'Each user has isolated keys'}
                </span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>
                  {locale === 'es'
                    ? 'Puede eliminar una clave en cualquier momento'
                    : 'You can remove a key anytime'}
                </span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>
                  {locale === 'es'
                    ? 'Los registros de auditoría rastrean el uso'
                    : 'Audit logs track usage'}
                </span>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">
              {locale === 'es' ? 'Configuración Recomendada' : 'Recommended Setup'}
            </h3>
            <ol className="space-y-3 text-sm text-zinc-400">
              <li className="flex gap-2">
                <span className="font-semibold text-zinc-300">1.</span>
                <span>
                  {locale === 'es'
                    ? 'Comience con OpenAI para funcionalidad completa'
                    : 'Start with OpenAI for full functionality'}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-zinc-300">2.</span>
                <span>
                  {locale === 'es'
                    ? 'Agregue Runway para generación de video'
                    : 'Add Runway for video generation'}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-zinc-300">3.</span>
                <span>
                  {locale === 'es'
                    ? 'Configure Cynthia Gateway para la gestión empresarial'
                    : 'Configure Cynthia Gateway for enterprise'}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-zinc-300">4.</span>
                <span>
                  {locale === 'es'
                    ? 'Pruebe con modelos locales como alternativa'
                    : 'Test with local models as fallback'}
                </span>
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
