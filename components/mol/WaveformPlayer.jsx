'use client';

import { useRef, useState, useEffect } from 'react';

const LABELS = {
  en: {
    play: 'Play',
    pause: 'Pause',
    download: 'Download',
  },
  es: {
    play: 'Reproducir',
    pause: 'Pausar',
    download: 'Descargar',
  },
};

export default function WaveformPlayer({ artifact, locale = 'en' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const t = LABELS[locale];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnd = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
    };
  }, []);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSliderChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <audio ref={audioRef} src={artifact.audioUrl} crossOrigin="anonymous" />

      {/* Waveform visualization placeholder */}
      <div className="w-full h-16 bg-slate-700/50 border border-purple-500/20 rounded flex items-center justify-center">
        <div className="flex items-end gap-1 h-8 opacity-60">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-purple-600 rounded-sm"
              style={{
                height: `${30 + Math.random() * 40}%`,
                animation: isPlaying ? `pulse 0.3s ease-in-out ${i * 0.05}s infinite` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSliderChange}
          className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-purple-300">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={togglePlayPause}
          className="flex-1 py-2 px-4 rounded bg-purple-600 hover:bg-purple-700 text-white font-medium transition flex items-center justify-center gap-2"
        >
          {isPlaying ? (
            <>
              <span>⏸</span> {t.pause}
            </>
          ) : (
            <>
              <span>▶</span> {t.play}
            </>
          )}
        </button>
        <a
          href={artifact.audioUrl}
          download={artifact.filename || 'music.wav'}
          className="py-2 px-4 rounded bg-slate-700/50 hover:bg-slate-700 text-purple-200 font-medium transition"
          title={t.download}
        >
          ⬇
        </a>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
