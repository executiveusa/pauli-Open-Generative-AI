/**
 * Song analyzer — Phase 7 Phase A.
 * Extracts duration, BPM estimate, section timing, and generates scene cuts.
 * Uses FFprobe for duration; BPM is estimated deterministically from filename+duration when
 * full beat-detection is unavailable (no librosa/essentia in this env).
 */

import { probeMedia } from '../ffmpeg/probe.js';

/**
 * Analyzes a song and returns timing/metadata.
 * @param {{ audioPath: string, minSceneSeconds?: number, maxSceneSeconds?: number, beatBias?: number }} opts
 * @returns {Promise<object>} analysis result
 */
export async function analyzeSong({ audioPath, minSceneSeconds = 3, maxSceneSeconds = 8, beatBias = 0.7 }) {
  const probe = await probeMedia(audioPath);

  let durationSeconds = 30; // fallback
  if (probe.ok && probe.durationSeconds) {
    durationSeconds = probe.durationSeconds;
  }

  // Deterministic BPM estimate: in real system this would use essentia/aubio/madmom
  // MVP: derive a plausible BPM from audio metadata or use 120 BPM as baseline
  const bpmEstimate = probe.audio?.sampleRate
    ? estimateBpmFromSampleRate(probe.audio.sampleRate)
    : 120;

  const sections = detectSections(durationSeconds);
  const scenes = cutScenes({ durationSeconds, minSceneSeconds, maxSceneSeconds, beatBias, bpmEstimate });

  return {
    ok: true,
    audioPath,
    durationSeconds,
    bpmEstimate,
    sampleRate: probe.audio?.sampleRate ?? null,
    channels: probe.audio?.channels ?? null,
    codec: probe.audio?.codec ?? null,
    sections,
    scenes,
    analysisVersion: '1.0.0-stub',
    note: probe.ok
      ? 'FFprobe analysis complete'
      : 'FFprobe unavailable — using stub analysis. Install ffmpeg for real metadata.',
  };
}

function estimateBpmFromSampleRate(sampleRate) {
  // Simple heuristic: higher sample rates often indicate higher-energy music
  if (sampleRate >= 48000) return 128;
  if (sampleRate >= 44100) return 120;
  return 110;
}

function detectSections(durationSeconds) {
  // Naive section detection: intro, verse, chorus, bridge, outro
  const sections = [];
  const totalMinutes = durationSeconds / 60;
  if (totalMinutes < 1) {
    sections.push({ id: 'main', label: 'Main', startSeconds: 0, endSeconds: durationSeconds });
  } else {
    const sectionDuration = durationSeconds / 5;
    ['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro'].forEach((label, i) => {
      sections.push({
        id: label.toLowerCase(),
        label,
        startSeconds: Math.round(i * sectionDuration * 10) / 10,
        endSeconds: Math.round((i + 1) * sectionDuration * 10) / 10,
      });
    });
  }
  return sections;
}

/**
 * Cuts the timeline into scenes respecting min/max duration and beat bias.
 */
function cutScenes({ durationSeconds, minSceneSeconds, maxSceneSeconds, beatBias, bpmEstimate }) {
  const beatInterval = 60 / bpmEstimate; // seconds per beat
  const targetSceneDuration = minSceneSeconds + (maxSceneSeconds - minSceneSeconds) * (1 - beatBias);

  const scenes = [];
  let cursor = 0;
  let index = 0;

  while (cursor < durationSeconds - minSceneSeconds) {
    const remaining = durationSeconds - cursor;
    let duration = Math.min(targetSceneDuration, remaining);

    // Snap to nearest beat boundary if beatBias > 0
    if (beatBias > 0) {
      const beats = Math.round(duration / beatInterval);
      duration = Math.max(minSceneSeconds, Math.min(maxSceneSeconds, beats * beatInterval));
    }

    if (cursor + duration > durationSeconds) {
      duration = durationSeconds - cursor;
    }

    scenes.push({
      sceneId: `scene_${String(index + 1).padStart(3, '0')}`,
      index,
      startSeconds: Math.round(cursor * 100) / 100,
      endSeconds: Math.round((cursor + duration) * 100) / 100,
      durationSeconds: Math.round(duration * 100) / 100,
    });

    cursor += duration;
    index++;
  }

  // Ensure at least one scene for tracks shorter than minSceneSeconds
  if (scenes.length === 0 && durationSeconds > 0) {
    scenes.push({
      sceneId: 'scene_001',
      index: 0,
      startSeconds: 0,
      endSeconds: Math.round(durationSeconds * 100) / 100,
      durationSeconds: Math.round(durationSeconds * 100) / 100,
    });
  }

  return scenes;
}

/**
 * Generates SRT subtitle content from scene timings + optional lyrics.
 * @param {object[]} scenes
 * @param {string[]} [lyricsLines]
 * @returns {string} SRT content
 */
export function scenesToSrt(scenes, lyricsLines = []) {
  return scenes.map((s, i) => {
    const text = lyricsLines[i] ?? `Scene ${i + 1}`;
    return [
      i + 1,
      `${formatTime(s.startSeconds)} --> ${formatTime(s.endSeconds)}`,
      text,
      '',
    ].join('\n');
  }).join('\n');
}

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.round((totalSeconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, '0')}`;
}

function pad(n) { return String(n).padStart(2, '0'); }
