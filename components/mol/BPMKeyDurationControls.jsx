'use client';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const LABELS = {
  en: {
    title: 'Parameters',
    bpm: 'BPM',
    key: 'Key',
    duration: 'Duration (seconds)',
  },
  es: {
    title: 'Parámetros',
    bpm: 'BPM',
    key: 'Tonalidad',
    duration: 'Duración (segundos)',
  },
};

export default function BPMKeyDurationControls({
  bpm,
  onBpmChange,
  key,
  onKeyChange,
  duration,
  onDurationChange,
  bpmRange = [40, 200],
  locale = 'en',
}) {
  const t = LABELS[locale];
  const [minBpm, maxBpm] = bpmRange;

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">{t.title}</h2>

      <div className="grid grid-cols-3 gap-4">
        {/* BPM */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">{t.bpm}</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={minBpm}
              max={maxBpm}
              value={bpm}
              onChange={e => onBpmChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-purple-600"
            />
            <input
              type="number"
              min={minBpm}
              max={maxBpm}
              value={bpm}
              onChange={e => onBpmChange(parseInt(e.target.value) || 120)}
              className="w-16 px-2 py-1 bg-slate-700/50 border border-purple-500/30 rounded text-white text-sm focus:outline-none focus:border-purple-500/60"
            />
          </div>
        </div>

        {/* Key */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">{t.key}</label>
          <select
            value={key}
            onChange={e => onKeyChange(e.target.value)}
            className="w-full px-3 py-1 bg-slate-700/50 border border-purple-500/30 rounded text-white text-sm focus:outline-none focus:border-purple-500/60"
          >
            {KEYS.map(k => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">{t.duration}</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={duration}
              onChange={e => onDurationChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-purple-600"
            />
            <input
              type="number"
              min="10"
              max="300"
              step="5"
              value={duration}
              onChange={e => onDurationChange(parseInt(e.target.value) || 60)}
              className="w-16 px-2 py-1 bg-slate-700/50 border border-purple-500/30 rounded text-white text-sm focus:outline-none focus:border-purple-500/60"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
