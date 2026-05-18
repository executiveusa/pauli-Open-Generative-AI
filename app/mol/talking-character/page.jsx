'use client';

import { useState } from 'react';
import ConsentBadge from '@/components/mol/ConsentBadge';

const LABELS = {
  en: {
    title: 'Talking Character',
    subtitle: 'Generate voice and lip sync for characters',
    selectCharacter: 'Select Character',
    dialogue: 'Dialogue',
    voiceLocale: 'Voice Locale',
    model: 'Model',
    generate: 'Generate',
    noCharacterSelected: 'Please select a character first',
    minorBlocked: 'Cannot generate voice for minor characters',
    voiceCloningScopeLimited: 'Voice cloning not authorized for this character',
  },
  es: {
    title: 'Personaje Hablante',
    subtitle: 'Genera voz y sincronización labial para personajes',
    selectCharacter: 'Seleccionar Personaje',
    dialogue: 'Diálogo',
    voiceLocale: 'Idioma de Voz',
    model: 'Modelo',
    generate: 'Generar',
    noCharacterSelected: 'Por favor selecciona un personaje primero',
    minorBlocked: 'No se puede generar voz para personajes menores de edad',
    voiceCloningScopeLimited: 'La clonación de voz no está autorizada para este personaje',
  },
};

export default function TalkingCharacterPage() {
  const [locale, setLocale] = useState('en');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [dialogue, setDialogue] = useState('');
  const [voiceLocale, setVoiceLocale] = useState('es-MX');
  const [model, setModel] = useState('wav2lip');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const labels = LABELS[locale];

  const handleGenerate = async () => {
    setError(null);
    if (!selectedCharacter) {
      setError(labels.noCharacterSelected);
      return;
    }
    if (selectedCharacter.isMinor) {
      setError(labels.minorBlocked);
      return;
    }
    if (!selectedCharacter.voiceCloningAllowed) {
      setError(labels.voiceCloningScopeLimited);
      return;
    }
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">{labels.title}</h1>
        <p className="text-zinc-400 mb-6">{labels.subtitle}</p>

        <div className="space-y-6">
          {/* Character Selection */}
          <div className="bg-zinc-900 p-4 rounded-lg">
            <label className="block font-semibold mb-2">{labels.selectCharacter}</label>
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors">
                {selectedCharacter ? selectedCharacter.name : 'Select…'}
              </button>
              {selectedCharacter && <ConsentBadge status={selectedCharacter.consentStatus} />}
            </div>
          </div>

          {/* Dialogue Input */}
          <div className="bg-zinc-900 p-4 rounded-lg">
            <label className="block font-semibold mb-2">{labels.dialogue}</label>
            <textarea
              value={dialogue}
              onChange={(e) => setDialogue(e.target.value)}
              placeholder="Enter dialogue text…"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 placeholder-zinc-500 h-20"
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 p-4 rounded-lg">
              <label className="block font-semibold mb-2">{labels.voiceLocale}</label>
              <select
                value={voiceLocale}
                onChange={(e) => setVoiceLocale(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100"
              >
                <option>es-MX</option>
                <option>es-AR</option>
                <option>es-ES</option>
              </select>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <label className="block font-semibold mb-2">{labels.model}</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100"
              >
                <option>wav2lip</option>
                <option>musetalk</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 p-3 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedCharacter || !dialogue}
            className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            {isGenerating ? 'Generating…' : labels.generate}
          </button>
        </div>
      </div>
    </div>
  );
}
