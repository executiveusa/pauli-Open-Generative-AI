'use client';

import { useState } from 'react';
import Link from 'next/link';

const LABELS = {
  en: {
    title: 'Music Studio',
    subtitle: 'AI-Powered Music Generation for LatAm',
    hero_cta: 'Start Creating',
    hero_description: 'Generate professional music in any language, genre, and mood with full creative control.',

    features_title: 'Powerful Features',

    feature_locales: {
      title: '🌎 Multi-Locale Generation',
      desc: 'Create music for 8 Latin American markets with locale-specific presets, BPM ranges, and cultural instruments.',
      items: ['8 LatAm locales', 'Cultural instruments', 'Locale-optimized BPM ranges', 'Regional provider routing'],
    },

    feature_rights: {
      title: '⚖️ Rights & Compliance',
      desc: 'Built-in rights validation for original works, covers, remixes, and voice cloning with consent tracking.',
      items: ['Consent management', 'Commercial licensing', 'Voice clone protection', 'Legal compliance'],
    },

    feature_modes: {
      title: '🎵 Generation Modes',
      desc: 'From simple beats to complex arrangements with lyrics, covers, remixes, and stem extraction.',
      items: ['Simple generation', 'Instrumental', 'Lyrics mode', 'Cover mode', 'Remix', 'Stem extraction'],
    },

    feature_video: {
      title: '🎬 Music-to-Video',
      desc: 'Auto-generate video prompts from music metadata with visual style suggestions and beat synchronization.',
      items: ['Auto-generated prompts', 'Visual style matching', 'Beat synchronization', 'Camera presets'],
    },

    feature_library: {
      title: '🎨 Shared Artifact Library',
      desc: 'Browse, remix, and share music with multi-tenant access controls, trending scores, and collaboration tools.',
      items: ['Featured artifacts', 'Trending discovery', 'Tag-based filtering', 'Remix permissions'],
    },

    feature_quotas: {
      title: '💳 Free Tier & Premium',
      desc: 'Freemium model with transparent quotas, monthly resets, and upgrade paths to premium features.',
      items: ['10 free generations', 'Monthly quotas', 'Premium upgrade', 'Usage tracking'],
    },

    tier_section_title: 'Simple, Transparent Pricing',
    tier_section_desc: 'Start free, upgrade when you need more.',

    tier_free_title: 'Free',
    tier_free_price: 'Forever free',
    tier_free_items: [
      '10 generations/month',
      '60 second max duration',
      '30 minutes total/month',
      'Simple + Instrumental modes',
      'English language only',
      'Watermark included',
    ],

    tier_premium_title: 'Premium',
    tier_premium_price: '$9.99/month',
    tier_premium_items: [
      '100+ generations/month',
      '5 minute max duration',
      '300 minutes total/month',
      'All generation modes',
      'All languages & locales',
      'No watermark',
      'Priority queue',
      'Remix & sharing',
    ],

    workflow_title: 'Complete Workflow',
    workflow_1: {
      step: '1',
      title: 'Select Locale',
      desc: 'Choose your target market from 8 LatAm regions',
    },
    workflow_2: {
      step: '2',
      title: 'Configure Music',
      desc: 'Set BPM, mode, duration with locale validation',
    },
    workflow_3: {
      step: '3',
      title: 'Check Rights',
      desc: 'Validate consent and licensing requirements',
    },
    workflow_4: {
      step: '4',
      title: 'Generate & Share',
      desc: 'Create music and share with multi-tenant controls',
    },
    workflow_5: {
      step: '5',
      title: 'Video Integration',
      desc: 'Auto-generate videos synced to your beat',
    },

    tech_title: 'Built on Solid Technology',
    tech_1: {
      title: 'Provider Routing',
      desc: 'Intelligent fallback chains across Ace Step, OpenMusic, and ElevenLabs Music',
    },
    tech_2: {
      title: 'Comprehensive Testing',
      desc: '20+ test cases covering locale presets, rights validation, quotas, and library operations',
    },
    tech_3: {
      title: 'API-First Design',
      desc: 'RESTful APIs for all operations with proper error handling and validation',
    },

    cta_title: 'Ready to Create?',
    cta_description: 'Generate your first track today. No credit card required.',
    cta_button: 'Start Creating Music',
    cta_button_secondary: 'View Documentation',
  },

  es: {
    title: 'Estudio de Música',
    subtitle: 'Generación de Música Impulsada por IA para LatAm',
    hero_cta: 'Comienza a Crear',
    hero_description: 'Genera música profesional en cualquier idioma, género y estado de ánimo con control creativo total.',

    features_title: 'Características Poderosas',

    feature_locales: {
      title: '🌎 Generación Multi-Locale',
      desc: 'Crea música para 8 mercados latinoamericanos con presets específicos de región, rangos BPM e instrumentos culturales.',
      items: ['8 locales de LatAm', 'Instrumentos culturales', 'Rangos BPM optimizados', 'Enrutamiento regional'],
    },

    feature_rights: {
      title: '⚖️ Derechos y Cumplimiento',
      desc: 'Validación de derechos integrada para obras originales, covers, remixes y clonación de voz con seguimiento de consentimiento.',
      items: ['Gestión de consentimiento', 'Licencias comerciales', 'Protección de clonación', 'Cumplimiento legal'],
    },

    feature_modes: {
      title: '🎵 Modos de Generación',
      desc: 'Desde beats simples hasta arreglos complejos con letras, covers, remixes y extracción de stems.',
      items: ['Generación simple', 'Instrumental', 'Modo letras', 'Modo cover', 'Remix', 'Extracción stems'],
    },

    feature_video: {
      title: '🎬 Música a Video',
      desc: 'Auto-genera prompts de video desde metadatos de música con sugerencias de estilo visual y sincronización de ritmo.',
      items: ['Prompts auto-generados', 'Coincidencia de estilo', 'Sincronización de ritmo', 'Presets de cámara'],
    },

    feature_library: {
      title: '🎨 Librería de Artefactos Compartidos',
      desc: 'Explora, remixea y comparte música con controles de acceso multi-inquilino y herramientas de colaboración.',
      items: ['Artefactos destacados', 'Descubrimiento trending', 'Filtrado por etiquetas', 'Permisos remix'],
    },

    feature_quotas: {
      title: '💳 Tier Gratuito y Premium',
      desc: 'Modelo freemium con cuotas transparentes, resets mensuales y rutas de actualización a características premium.',
      items: ['10 generaciones gratis', 'Cuotas mensuales', 'Actualización premium', 'Seguimiento de uso'],
    },

    tier_section_title: 'Precios Simples y Transparentes',
    tier_section_desc: 'Comienza gratis, actualiza cuando necesites más.',

    tier_free_title: 'Gratuito',
    tier_free_price: 'Para siempre gratis',
    tier_free_items: [
      '10 generaciones/mes',
      '60 segundos de duración máxima',
      '30 minutos totales/mes',
      'Modos Simple e Instrumental',
      'Solo idioma inglés',
      'Marca de agua incluida',
    ],

    tier_premium_title: 'Premium',
    tier_premium_price: '$9.99/mes',
    tier_premium_items: [
      '100+ generaciones/mes',
      '5 minutos de duración máxima',
      '300 minutos totales/mes',
      'Todos los modos de generación',
      'Todos los idiomas y locales',
      'Sin marca de agua',
      'Cola prioritaria',
      'Remix y compartir',
    ],

    workflow_title: 'Flujo de Trabajo Completo',
    workflow_1: {
      step: '1',
      title: 'Selecciona Locale',
      desc: 'Elige tu mercado objetivo de 8 regiones LatAm',
    },
    workflow_2: {
      step: '2',
      title: 'Configura Música',
      desc: 'Establece BPM, modo, duración con validación',
    },
    workflow_3: {
      step: '3',
      title: 'Verifica Derechos',
      desc: 'Valida requisitos de consentimiento y licencias',
    },
    workflow_4: {
      step: '4',
      title: 'Genera y Comparte',
      desc: 'Crea música y comparte con controles multi-tenant',
    },
    workflow_5: {
      step: '5',
      title: 'Integración de Video',
      desc: 'Auto-genera videos sincronizados a tu ritmo',
    },

    tech_title: 'Construido sobre Tecnología Sólida',
    tech_1: {
      title: 'Enrutamiento de Proveedores',
      desc: 'Cadenas de respaldo inteligentes entre Ace Step, OpenMusic y ElevenLabs Music',
    },
    tech_2: {
      title: 'Pruebas Integrales',
      desc: '20+ casos de prueba cubriendo presets de locale, validación de derechos, cuotas y operaciones de librería',
    },
    tech_3: {
      title: 'Diseño API-First',
      desc: 'APIs RESTful para todas las operaciones con manejo de errores y validación adecuados',
    },

    cta_title: '¿Listo para Crear?',
    cta_description: 'Genera tu primer track hoy. Sin tarjeta de crédito requerida.',
    cta_button: 'Comienza a Crear Música',
    cta_button_secondary: 'Ver Documentación',
  },
};

export default function MusicStudioPage() {
  const [locale, setLocale] = useState('en');
  const t = LABELS[locale];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ♪ {t.title}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              {locale === 'en' ? 'ES' : 'EN'}
            </button>
            <Link href="/mol/music">
              <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">
                {locale === 'en' ? 'Create' : 'Crear'}
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-40 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-4 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            {t.hero_description}
          </p>
          <Link href="/mol/music">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/50">
              {t.hero_cta}
            </button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-100">{t.features_title}</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              t.feature_locales,
              t.feature_rights,
              t.feature_modes,
              t.feature_video,
              t.feature_library,
              t.feature_quotas,
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-colors"
              >
                <h3 className="text-xl font-semibold text-purple-300 mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{feature.desc}</p>
                <ul className="space-y-2">
                  {feature.items.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-purple-400 mt-1">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-slate-100">{t.tier_section_title}</h2>
            <p className="text-slate-400">{t.tier_section_desc}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-slate-100 mb-2">{t.tier_free_title}</h3>
              <p className="text-purple-400 font-semibold mb-6">{t.tier_free_price}</p>
              <ul className="space-y-3 mb-8">
                {t.tier_free_items.map((item, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/mol/music">
                <button className="w-full py-2 px-4 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium transition">
                  {locale === 'en' ? 'Get Started' : 'Comenzar'}
                </button>
              </Link>
            </div>

            {/* Premium Tier */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/50 rounded-lg p-8 relative">
              <div className="absolute -top-4 left-6 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 rounded-full text-white text-xs font-semibold">
                {locale === 'en' ? 'Most Popular' : 'Más Popular'}
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2">{t.tier_premium_title}</h3>
              <p className="text-purple-400 font-semibold mb-6">{t.tier_premium_price}</p>
              <ul className="space-y-3 mb-8">
                {t.tier_premium_items.map((item, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="text-pink-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2 px-4 rounded bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition">
                {locale === 'en' ? 'Upgrade Now' : 'Actualizar Ahora'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-100">{t.workflow_title}</h2>

          <div className="grid md:grid-cols-5 gap-4">
            {[t.workflow_1, t.workflow_2, t.workflow_3, t.workflow_4, t.workflow_5].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {step.step}
                  </div>
                  {idx < 4 && (
                    <div className="hidden md:block w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 ml-4"></div>
                  )}
                </div>
                <h3 className="font-semibold text-slate-100 mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-100">{t.tech_title}</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[t.tech_1, t.tech_2, t.tech_3].map((tech, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">{tech.title}</h3>
                <p className="text-slate-400 text-sm">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32 bg-gradient-to-t from-purple-950/30 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-slate-100">
            {t.cta_title}
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            {t.cta_description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/mol/music">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/50 text-lg">
                {t.cta_button}
              </button>
            </Link>
            <Link href="#docs">
              <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all text-lg border border-slate-700">
                {t.cta_button_secondary}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-slate-400 text-sm mb-8">
            <div>
              <h3 className="font-semibold text-slate-200 mb-4">{locale === 'en' ? 'Product' : 'Producto'}</h3>
              <ul className="space-y-2">
                <li><Link href="/mol/music" className="hover:text-slate-200">{locale === 'en' ? 'Create Music' : 'Crear Música'}</Link></li>
                <li><Link href="/mol/music-video" className="hover:text-slate-200">{locale === 'en' ? 'Music Video' : 'Video de Música'}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 mb-4">{locale === 'en' ? 'Resources' : 'Recursos'}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-slate-200">{locale === 'en' ? 'API Reference' : 'Referencia de API'}</a></li>
                <li><a href="#" className="hover:text-slate-200">{locale === 'en' ? 'Examples' : 'Ejemplos'}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 mb-4">{locale === 'en' ? 'Company' : 'Empresa'}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-slate-200">{locale === 'en' ? 'About' : 'Acerca de'}</a></li>
                <li><a href="#" className="hover:text-slate-200">{locale === 'en' ? 'Blog' : 'Blog'}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 mb-4">{locale === 'en' ? 'Legal' : 'Legal'}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-slate-200">{locale === 'en' ? 'Privacy' : 'Privacidad'}</a></li>
                <li><a href="#" className="hover:text-slate-200">{locale === 'en' ? 'Terms' : 'Términos'}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
            <p>© 2026 Music Studio. {locale === 'en' ? 'Built for Latin American creators.' : 'Construido para creadores latinoamericanos.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
