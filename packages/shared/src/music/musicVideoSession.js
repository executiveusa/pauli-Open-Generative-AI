/**
 * Music-to-video session management.
 * Tracks the workflow from music artifact to video generation.
 */

import { newId, now } from '../types/core.js';

export const MUSIC_VIDEO_SESSION_STATUSES = [
  'initialized',
  'setup',
  'style_selection',
  'prompt_generation',
  'ready',
  'generating',
  'completed',
  'failed',
];

/**
 * Create a new music-to-video session
 */
export function makeMusicVideoSession(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('mvsession'),
    organizationId: partial.organizationId ?? '',
    projectId: partial.projectId ?? '',
    createdByUserId: partial.createdByUserId ?? '',

    musicArtifactId: partial.musicArtifactId ?? '',
    status: partial.status ?? 'initialized',

    // Video parameters
    videoTitle: partial.videoTitle ?? '',
    videoPrompt: partial.videoPrompt ?? '',
    videoStyle: partial.videoStyle ?? 'cinematic',
    aspectRatio: partial.aspectRatio ?? '16:9',
    videoDurationSeconds: partial.videoDurationSeconds ?? null,
    fps: partial.fps ?? 30,

    // Styling
    colorPalette: partial.colorPalette ?? [],
    mood: partial.mood ?? '',
    visualStyle: partial.visualStyle ?? [],
    cameraMovement: partial.cameraMovement ?? 'dynamic',

    // Sync settings
    syncToMusic: partial.syncToMusic ?? true,
    beatSync: partial.beatSync ?? true,
    beatSyncIntensity: partial.beatSyncIntensity ?? 0.7,

    // Generated assets
    videoJobId: partial.videoJobId ?? null,
    generatedVideoUrl: partial.generatedVideoUrl ?? null,
    generatedVideoThumbnail: partial.generatedVideoThumbnail ?? null,

    // AI generation guidance
    autoPromptGeneration: partial.autoPromptGeneration ?? true,
    llmUsedForPrompt: partial.llmUsedForPrompt ?? null,

    metadata: partial.metadata ?? {},

    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
    completedAt: partial.completedAt ?? null,
  };
}

/**
 * Build video prompt from music metadata
 */
export function buildVideoPromptFromMusic(artifact, locale = 'en') {
  const { prompt, mood, bpm, durationSeconds } = artifact;

  // Use original music prompt as base
  let videoPrompt = prompt || 'Music video';

  // Add mood and energy
  if (mood) {
    videoPrompt += ` with ${mood} mood`;
  }

  // Add tempo suggestion
  if (bpm) {
    const tempoDescriptor = bpm < 100 ? 'slow, steady' :
                           bpm < 140 ? 'moderate' :
                           'fast, energetic';
    videoPrompt += ` and ${tempoDescriptor} pacing`;
  }

  // Add duration context
  if (durationSeconds) {
    videoPrompt += `. Duration: ${durationSeconds} seconds`;
  }

  if (locale === 'es') {
    videoPrompt = prompt || 'Video musical';
    if (mood) videoPrompt += ` con ambiente ${mood}`;
    if (bpm) {
      const tempoDescriptor = bpm < 100 ? 'lento y constante' :
                             bpm < 140 ? 'moderado' :
                             'rápido y energético';
      videoPrompt += ` y ritmo ${tempoDescriptor}`;
    }
    if (durationSeconds) {
      videoPrompt += `. Duración: ${durationSeconds} segundos`;
    }
  }

  return videoPrompt;
}

/**
 * Get suggested visual styles based on music genre/mood
 */
export function suggestVisualStyles(artifact) {
  const suggestions = [];
  const { mood = '', prompt = '' } = artifact;

  const promptLower = prompt.toLowerCase();

  // Genre-based suggestions
  if (promptLower.includes('hip-hop') || promptLower.includes('rap')) {
    suggestions.push('urban', 'street-art', 'graffiti', 'neon');
  }
  if (promptLower.includes('ambient') || promptLower.includes('chill')) {
    suggestions.push('dreamy', 'ethereal', 'minimalist', 'nature');
  }
  if (promptLower.includes('electronic') || promptLower.includes('edm')) {
    suggestions.push('abstract', 'psychedelic', 'geometric', 'futuristic');
  }
  if (promptLower.includes('jazz') || promptLower.includes('smooth')) {
    suggestions.push('elegant', 'vintage', 'classy', 'intimate');
  }
  if (promptLower.includes('rock')) {
    suggestions.push('energetic', 'cinematic', 'dark', 'rebellious');
  }

  // Mood-based suggestions
  if (mood.includes('melancholic') || mood.includes('sad')) {
    suggestions.push('dark', 'moody', 'introspective', 'atmospheric');
  }
  if (mood.includes('happy') || mood.includes('joyful')) {
    suggestions.push('bright', 'colorful', 'playful', 'uplifting');
  }
  if (mood.includes('energetic') || mood.includes('intense')) {
    suggestions.push('dynamic', 'fast-paced', 'action-packed', 'powerful');
  }

  return [...new Set(suggestions)];
}

/**
 * Get color palettes for different video styles
 */
export function getColorPalettes() {
  return {
    vibrant: {
      name: 'Vibrant',
      colors: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
      description: 'Bold, saturated colors for high-energy content',
    },
    moody: {
      name: 'Moody',
      colors: ['#1F1F2E', '#0F3460', '#16213E', '#533483', '#E94560'],
      description: 'Deep, atmospheric tones for introspective mood',
    },
    sunset: {
      name: 'Sunset',
      colors: ['#FF6B6B', '#FFA500', '#FFD93D', '#6BCB77', '#4D96FF'],
      description: 'Warm golden hour palette',
    },
    cyberpunk: {
      name: 'Cyberpunk',
      colors: ['#FF006E', '#00F5FF', '#0400FF', '#FFD700', '#39FF14'],
      description: 'Neon synthetic palette for futuristic feel',
    },
    vintage: {
      name: 'Vintage',
      colors: ['#C9A77C', '#A0826D', '#7A6E56', '#4A4238', '#8B4513'],
      description: 'Warm, retro color grading',
    },
    nature: {
      name: 'Nature',
      colors: ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D'],
      description: 'Organic greens and earth tones',
    },
  };
}

/**
 * Get camera movement presets
 */
export function getCameraPresets() {
  return {
    static: {
      name: 'Static',
      description: 'No camera movement - focus on content',
    },
    slow_pan: {
      name: 'Slow Pan',
      description: 'Gentle left-right panning',
    },
    zoom_in: {
      name: 'Zoom In',
      description: 'Gradual zoom toward focal point',
    },
    zoom_out: {
      name: 'Zoom Out',
      description: 'Gradual zoom away from center',
    },
    dynamic: {
      name: 'Dynamic',
      description: 'Mix of pans, zooms, and subtle movements',
    },
    cinematic: {
      name: 'Cinematic',
      description: 'Complex, artistic camera movements',
    },
  };
}

/**
 * Validate session setup before video generation
 */
export function validateSessionSetup(session) {
  const errors = [];
  const warnings = [];

  if (!session.musicArtifactId) {
    errors.push('Music artifact ID required');
  }

  if (!session.videoPrompt?.trim()) {
    errors.push('Video prompt required');
  }

  if (!session.videoStyle) {
    errors.push('Video style selection required');
  }

  if (session.beatSync && !session.beatSyncIntensity) {
    warnings.push('Beat sync enabled but intensity not set');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Build video generation request from music-to-video session
 */
export function buildVideoGenerationRequest(session, musicArtifact) {
  return {
    musicArtifactId: session.musicArtifactId,
    title: session.videoTitle || `Video: ${musicArtifact.title}`,
    prompt: session.videoPrompt,
    style: session.videoStyle,
    aspectRatio: session.aspectRatio,
    duration: session.videoDurationSeconds || musicArtifact.durationSeconds,
    fps: session.fps,

    // Styling
    colorPalette: session.colorPalette,
    mood: session.mood,
    visualStyle: session.visualStyle,
    cameraMovement: session.cameraMovement,

    // Sync settings
    syncToMusic: session.syncToMusic,
    beatSync: session.beatSync,
    beatSyncIntensity: session.beatSyncIntensity,

    metadata: {
      ...session.metadata,
      musicBpm: musicArtifact.bpm,
      musicKey: musicArtifact.key,
    },
  };
}
