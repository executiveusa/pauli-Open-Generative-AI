'use client';

import { useState } from 'react';
import Link from 'next/link';
import { t, SUPPORTED_LOCALES } from '@/lib/i18n/index.js';

const LOCALE_LABELS = {
  en: 'English',
  es: 'Español',
  'es-MX': 'Español (México)',
  'es-CO': 'Español (Colombia)',
  'es-AR': 'Español (Argentina)',
  'es-CL': 'Español (Chile)',
  'es-PE': 'Español (Perú)',
  'es-US': 'Español (USA)',
};

export default function LandingPage() {
  const [locale, setLocale] = useState('en');
  const [isLocaleOpen, setIsLocaleOpen] = useState(false);

  const tr = (key) => t(locale, `landing.${key}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      {/* Header with locale switcher */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Cynthia Studio
            </span>
            <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-300 rounded-full">
              LatAm
            </span>
          </div>

          {/* Locale Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsLocaleOpen(!isLocaleOpen)}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              {LOCALE_LABELS[locale]} ▼
            </button>

            {isLocaleOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl">
                {SUPPORTED_LOCALES.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setLocale(loc);
                      setIsLocaleOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      locale === loc
                        ? 'bg-purple-900/50 text-purple-300'
                        : 'hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {LOCALE_LABELS[loc]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-40 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-pulse">
            {tr('hero_title')}
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
            {tr('hero_subtitle')}
          </p>
          <Link href="/characters/new">
            <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/50">
              {tr('hero_cta')}
            </button>
          </Link>
        </div>
      </section>

      {/* Character Passport Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 p-8 rounded-lg border border-blue-800/30">
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-2xl font-bold text-blue-300 mb-4">
              {tr('character_section_title')}
            </h2>
            <p className="text-zinc-400">
              {tr('character_section_body')}
            </p>
          </div>
          <div className="space-y-4 text-zinc-300 text-sm">
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-blue-300">Face & Identity:</strong> Detailed facial descriptions with reference images
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-blue-300">Voice & Speech:</strong> Voice profiles, dialects, and personality traits
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-blue-300">Continuity Locks:</strong> Ensure consistency across all generations
            </div>
          </div>
        </div>
      </section>

      {/* Cine Studio Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 space-y-4 text-zinc-300 text-sm">
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-purple-300">Camera Control:</strong> Professional camera presets and full manual control
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-purple-300">Bilingual Prompts:</strong> English and Spanish prompts in one generation
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-purple-300">LatAm Optimization:</strong> Regional models and cultural settings
            </div>
          </div>
          <div className="order-1 md:order-2 bg-gradient-to-br from-purple-900/30 to-purple-800/10 p-8 rounded-lg border border-purple-800/30">
            <div className="text-4xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-purple-300 mb-4">
              {tr('cine_section_title')}
            </h2>
            <p className="text-zinc-400">
              {tr('cine_section_body')}
            </p>
          </div>
        </div>
      </section>

      {/* Supercomputer Router Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/10 p-8 rounded-lg border border-cyan-800/30">
            <div className="text-4xl mb-4">🧠</div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-4">
              {tr('supercomputer_section_title')}
            </h2>
            <p className="text-zinc-400">
              {tr('supercomputer_section_body')}
            </p>
          </div>
          <div className="space-y-4 text-zinc-300 text-sm">
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-cyan-300">Smart Routing:</strong> Automatically selects best model for cost/quality
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-cyan-300">Multi-Provider:</strong> OpenAI, Google, Runway, Kling, and more
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-cyan-300">Fallback Logic:</strong> Automatic retry with alternative providers
            </div>
          </div>
        </div>
      </section>

      {/* BYOK + Gateway Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 space-y-4 text-zinc-300 text-sm">
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-amber-300">Secure Storage:</strong> Keys stored server-side, never exposed
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-amber-300">Cost Control:</strong> Use your own keys to control spending
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-amber-300">Enterprise Ready:</strong> Cynthia Gateway for managed deployments
            </div>
          </div>
          <div className="order-1 md:order-2 bg-gradient-to-br from-amber-900/30 to-amber-800/10 p-8 rounded-lg border border-amber-800/30">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-amber-300 mb-4">
              {tr('byok_section_title')}
            </h2>
            <p className="text-zinc-400">
              {tr('byok_section_body')}
            </p>
          </div>
        </div>
      </section>

      {/* Talking Characters Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 p-8 rounded-lg border border-green-800/30">
            <div className="text-4xl mb-4">🎤</div>
            <h2 className="text-2xl font-bold text-green-300 mb-4">
              {tr('talking_section_title')}
            </h2>
            <p className="text-zinc-400">
              {tr('talking_section_body')}
            </p>
          </div>
          <div className="space-y-4 text-zinc-300 text-sm">
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-green-300">Audio Support:</strong> Upload or record audio for lip sync
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-green-300">Voice Cloning:</strong> Optional voice cloning with consent validation
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-green-300">Real-time Preview:</strong> See results instantly with adjustments
            </div>
          </div>
        </div>
      </section>

      {/* Storyboards Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 space-y-4 text-zinc-300 text-sm">
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-rose-300">Multi-Shot Planning:</strong> Plan entire scenes with continuity locks
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-rose-300">Export to Video:</strong> Generate complete videos with subtitles
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-rose-300">Bilingual Subtitles:</strong> Auto-generated Spanish and English captions
            </div>
          </div>
          <div className="order-1 md:order-2 bg-gradient-to-br from-rose-900/30 to-rose-800/10 p-8 rounded-lg border border-rose-800/30">
            <div className="text-4xl mb-4">🎞️</div>
            <h2 className="text-2xl font-bold text-rose-300 mb-4">
              {tr('storyboard_section_title')}
            </h2>
            <p className="text-zinc-400">
              {tr('storyboard_section_body')}
            </p>
          </div>
        </div>
      </section>

      {/* Rights & Safety Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/10 p-8 rounded-lg border border-indigo-800/30">
            <div className="text-4xl mb-4">⚖️</div>
            <h2 className="text-2xl font-bold text-indigo-300 mb-4">
              {tr('rights_section_title')}
            </h2>
            <p className="text-zinc-400">
              {tr('rights_section_body')}
            </p>
          </div>
          <div className="space-y-4 text-zinc-300 text-sm">
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-indigo-300">Consent Management:</strong> Track and enforce identity and voice consent
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-indigo-300">Commercial Licenses:</strong> Manage commercial use rights per character
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <strong className="text-indigo-300">Safety Flags:</strong> Block generation for minors and political figures
            </div>
          </div>
        </div>
      </section>

      {/* Spanish-First Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block bg-gradient-to-r from-red-900/30 to-yellow-900/30 p-8 rounded-lg border border-red-800/30 w-full">
            <div className="text-5xl mb-4">🌟</div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-300 to-yellow-300 bg-clip-text text-transparent">
              Built for LatAm, First
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Native Spanish support across all features. Cultural settings, regional models, and LatAm-specific workflows.
              Not an afterthought—built from the ground up for Latin American creators.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32 bg-gradient-to-t from-purple-950/30 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-zinc-100">
            {tr('cta_title')}
          </h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of creators in LatAm building with Cynthia Studio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/characters/new">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/50 text-lg">
                {tr('cta_button')}
              </button>
            </Link>
            <Link href="/settings/providers">
              <button className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-all text-lg border border-zinc-700">
                Configure Providers
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 text-zinc-400 text-sm mb-8">
          <div>
            <h3 className="font-semibold text-zinc-200 mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/characters" className="hover:text-zinc-200">Characters</Link></li>
              <li><Link href="/studio" className="hover:text-zinc-200">Cine Studio</Link></li>
              <li><Link href="/storyboards" className="hover:text-zinc-200">Storyboards</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-200 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-zinc-200">Documentation</a></li>
              <li><a href="#" className="hover:text-zinc-200">API Reference</a></li>
              <li><a href="#" className="hover:text-zinc-200">Examples</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-200 mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-zinc-200">About</a></li>
              <li><a href="#" className="hover:text-zinc-200">Blog</a></li>
              <li><a href="#" className="hover:text-zinc-200">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-200 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-zinc-200">Privacy</a></li>
              <li><a href="#" className="hover:text-zinc-200">Terms</a></li>
              <li><a href="#" className="hover:text-zinc-200">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-8 text-center text-zinc-500 text-sm">
          <p>© 2026 Cynthia Studio. Built for Latin American creators, everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
