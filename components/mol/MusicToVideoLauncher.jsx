'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LABELS = {
  en: {
    title: 'Create Music Video',
    launching: 'Launching...',
    description: 'Generate a music video using this track',
  },
  es: {
    title: 'Crear Video Musical',
    launching: 'Lanzando...',
    description: 'Genera un video musical usando esta pista',
  },
};

export default function MusicToVideoLauncher({ artifact, locale = 'en' }) {
  const router = useRouter();
  const [isLaunching, setIsLaunching] = useState(false);

  const t = LABELS[locale];

  const handleLaunch = async () => {
    setIsLaunching(true);

    try {
      // Create a music-to-video session with this artifact
      const response = await fetch('/api/v1/music-video/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musicArtifactId: artifact.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to create session');

      const data = await response.json();
      router.push(`/video/create?sessionId=${data.sessionId}`);
    } catch (err) {
      console.error('Failed to launch music-to-video:', err);
      setIsLaunching(false);
    }
  };

  return (
    <button
      onClick={handleLaunch}
      disabled={isLaunching}
      className={`w-full py-2 px-4 rounded font-medium transition text-white text-sm ${
        isLaunching
          ? 'bg-purple-900/50 cursor-not-allowed'
          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
      }`}
      title={t.description}
    >
      {isLaunching ? t.launching : t.title}
    </button>
  );
}
