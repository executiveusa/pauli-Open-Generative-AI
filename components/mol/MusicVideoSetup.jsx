'use client';

import { useState, useEffect } from 'react';
import {
  buildVideoPromptFromMusic,
  suggestVisualStyles,
  getColorPalettes,
  getCameraPresets,
  validateSessionSetup,
} from '@/packages/shared/src/music/musicVideoSession.js';

const LABELS = {
  en: {
    title: 'Music Video Setup',
    subtitle: 'Create a video for your music',
    videoTitle: 'Video Title',
    prompt: 'Video Concept',
    autoGenerate: 'Auto-generate from music',
    style: 'Visual Style',
    palette: 'Color Palette',
    camera: 'Camera Movement',
    beatSync: 'Sync to Beat',
    intensity: 'Sync Intensity',
    aspectRatio: '16:9 (Default)',
    fps: 'Frame Rate (30 fps)',
    create: 'Create Video',
    generating: 'Generating...',
  },
  es: {
    title: 'Configuración de Video Musical',
    subtitle: 'Crea un video para tu música',
    videoTitle: 'Título del Video',
    prompt: 'Concepto del Video',
    autoGenerate: 'Generar automáticamente desde la música',
    style: 'Estilo Visual',
    palette: 'Paleta de Colores',
    camera: 'Movimiento de Cámara',
    beatSync: 'Sincronizar al Ritmo',
    intensity: 'Intensidad de Sincronización',
    aspectRatio: '16:9 (Predeterminado)',
    fps: 'Velocidad de Fotogramas (30 fps)',
    create: 'Crear Video',
    generating: 'Generando...',
  },
};

export default function MusicVideoSetup({ artifact, onCreate, locale = 'en' }) {
  const t = LABELS[locale];
  const [isGenerating, setIsGenerating] = useState(false);
  const [session, setSession] = useState({
    videoTitle: '',
    videoPrompt: buildVideoPromptFromMusic(artifact, locale),
    videoStyle: 'cinematic',
    colorPalette: [],
    cameraMovement: 'dynamic',
    beatSync: true,
    beatSyncIntensity: 0.7,
  });

  const visualStyles = suggestVisualStyles(artifact);
  const colorPalettes = getColorPalettes();
  const cameraPresets = getCameraPresets();

  const validation = validateSessionSetup(session);

  const handleCreate = async () => {
    if (!validation.valid) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/v1/music-video/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musicArtifactId: artifact.id,
          ...session,
        }),
      });

      if (!response.ok) throw new Error('Failed to create session');

      const data = await response.json();
      onCreate(data);
    } catch (err) {
      console.error('Failed to create video session:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">{t.title}</h2>
        <p className="text-purple-200">{t.subtitle}</p>
      </div>

      {/* Video Title */}
      <div>
        <label className="block text-sm font-medium text-purple-300 mb-2">{t.videoTitle}</label>
        <input
          type="text"
          placeholder={`${artifact.title} Video`}
          value={session.videoTitle}
          onChange={e => setSession(s => ({ ...s, videoTitle: e.target.value }))}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500/60"
        />
      </div>

      {/* Video Prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-purple-300">{t.prompt}</label>
          <button
            onClick={() => setSession(s => ({
              ...s,
              videoPrompt: buildVideoPromptFromMusic(artifact, locale),
            }))}
            className="text-xs text-purple-400 hover:text-purple-200"
          >
            {t.autoGenerate}
          </button>
        </div>
        <textarea
          value={session.videoPrompt}
          onChange={e => setSession(s => ({ ...s, videoPrompt: e.target.value }))}
          rows={3}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500/60 resize-none"
        />
      </div>

      {/* Visual Style */}
      <div>
        <label className="block text-sm font-medium text-purple-300 mb-2">{t.style}</label>
        <div className="flex flex-wrap gap-2">
          {visualStyles.slice(0, 4).map(style => (
            <button
              key={style}
              onClick={() => setSession(s => ({ ...s, videoStyle: style }))}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                session.videoStyle === style
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700/50 text-purple-200 hover:bg-slate-700'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <label className="block text-sm font-medium text-purple-300 mb-3">{t.palette}</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(colorPalettes).map(([key, palette]) => (
            <button
              key={key}
              onClick={() => setSession(s => ({ ...s, colorPalette: palette.colors }))}
              className="p-3 rounded border-2 transition"
              style={{
                borderColor: session.colorPalette === palette.colors ? '#a855f7' : 'rgba(139, 92, 246, 0.2)',
                backgroundColor: 'rgba(30, 31, 46, 0.5)',
              }}
            >
              <div className="flex gap-1 mb-2">
                {palette.colors.slice(0, 3).map((color, i) => (
                  <div key={i} className="flex-1 h-4 rounded" style={{ backgroundColor: color }} />
                ))}
              </div>
              <p className="text-xs text-white font-medium">{palette.name}</p>
              <p className="text-xs text-purple-300">{palette.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Camera Movement */}
      <div>
        <label className="block text-sm font-medium text-purple-300 mb-2">{t.camera}</label>
        <select
          value={session.cameraMovement}
          onChange={e => setSession(s => ({ ...s, cameraMovement: e.target.value }))}
          className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500/60"
        >
          {Object.entries(cameraPresets).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.name} — {preset.description}
            </option>
          ))}
        </select>
      </div>

      {/* Beat Sync */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={session.beatSync}
            onChange={e => setSession(s => ({ ...s, beatSync: e.target.checked }))}
            className="w-4 h-4 accent-purple-600"
          />
          <span className="text-sm text-purple-300">{t.beatSync}</span>
        </label>

        {session.beatSync && (
          <div>
            <label className="block text-xs text-purple-300 mb-2">{t.intensity}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={session.beatSyncIntensity}
              onChange={e => setSession(s => ({ ...s, beatSyncIntensity: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-slate-700 rounded accent-purple-600"
            />
            <span className="text-xs text-purple-300">{(session.beatSyncIntensity * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {!validation.valid && (
        <div className="p-3 bg-red-900/30 border border-red-500/30 rounded">
          <p className="text-sm text-red-300 font-medium mb-2">⚠ Issues to fix:</p>
          <ul className="text-xs text-red-200 space-y-1">
            {validation.errors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!validation.valid || isGenerating}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${
          !validation.valid || isGenerating
            ? 'bg-purple-900/50 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
        }`}
      >
        {isGenerating ? t.generating : t.create}
      </button>
    </div>
  );
}
