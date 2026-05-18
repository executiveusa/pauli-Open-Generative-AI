'use client';

import { useState, useEffect } from 'react';
import SupercomputerPanel from '@/components/mol/SupercomputerPanel';

const LABELS = {
  en: { title: 'Cine Studio', subtitle: 'Advanced cinematic generation interface' },
  es: { title: 'Estudio Cine', subtitle: 'Interfaz avanzada de generación cinematográfica' },
};

export default function CineStudioPage() {
  const [locale, setLocale] = useState('en');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedStoryboard, setSelectedStoryboard] = useState(null);
  const [cameraPreset, setCameraPreset] = useState('close-up');
  const [motionPreset, setMotionPreset] = useState('subtle-breathing');
  const [selectedModel, setSelectedModel] = useState('mock-cinematic-v1');
  const [isGenerating, setIsGenerating] = useState(false);
  const labels = LABELS[locale];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">{labels.title}</h1>
        <p className="text-zinc-400 mb-6">{labels.subtitle}</p>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column: Character/Storyboard Selection */}
          <div className="space-y-4">
            <div className="bg-zinc-900 p-4 rounded-lg">
              <h2 className="font-semibold mb-3">Characters</h2>
              <button className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors">
                {selectedCharacter ? selectedCharacter.name : 'Select Character…'}
              </button>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <h2 className="font-semibold mb-3">Storyboards</h2>
              <button className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors">
                {selectedStoryboard ? selectedStoryboard.name : 'Select Storyboard…'}
              </button>
            </div>
          </div>

          {/* Middle Column: Controls */}
          <div className="space-y-4">
            <div className="bg-zinc-900 p-4 rounded-lg">
              <h2 className="font-semibold mb-3">Camera</h2>
              <select
                value={cameraPreset}
                onChange={(e) => setCameraPreset(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100"
              >
                <option>close-up</option>
                <option>medium-shot</option>
                <option>wide-shot</option>
              </select>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <h2 className="font-semibold mb-3">Motion</h2>
              <select
                value={motionPreset}
                onChange={(e) => setMotionPreset(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100"
              >
                <option>subtle-breathing</option>
                <option>natural-walk</option>
                <option>dramatic-reveal</option>
              </select>
            </div>
            <SupercomputerPanel onSelect={setSelectedModel} />
          </div>

          {/* Right Column: Results */}
          <div className="bg-zinc-900 p-4 rounded-lg">
            <h2 className="font-semibold mb-3">Preview</h2>
            <div className="aspect-video bg-zinc-800 rounded flex items-center justify-center text-zinc-500">
              {isGenerating ? 'Generating…' : 'No artifact'}
            </div>
            <button
              onClick={() => setIsGenerating(!isGenerating)}
              className="w-full mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
              disabled={!selectedCharacter}
            >
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
