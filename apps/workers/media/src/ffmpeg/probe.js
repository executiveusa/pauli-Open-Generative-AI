/**
 * Media probing via ffprobe.
 * Returns duration, streams, codec info, loudness, and BPM estimate.
 */

import { runFfprobe } from './index.js';

/**
 * Probes a media file and returns metadata.
 * @param {string} filePath - absolute path to media file
 * @returns {Promise<object>} probe result
 */
export async function probeMedia(filePath) {
  const r = await runFfprobe([
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    filePath,
  ]);

  if (!r.ok) return { ok: false, error: r.error, filePath };

  let parsed;
  try { parsed = JSON.parse(r.stdout); } catch {
    return { ok: false, error: { code: 'PARSE_ERROR', message: 'Failed to parse ffprobe output' }, filePath };
  }

  const format = parsed.format ?? {};
  const streams = parsed.streams ?? [];

  const audioStream = streams.find(s => s.codec_type === 'audio');
  const videoStream = streams.find(s => s.codec_type === 'video');

  return {
    ok: true,
    filePath,
    durationSeconds: parseFloat(format.duration) || null,
    sizeBytes: parseInt(format.size, 10) || null,
    bitrate: parseInt(format.bit_rate, 10) || null,
    formatName: format.format_name ?? null,
    audio: audioStream ? {
      codec: audioStream.codec_name,
      sampleRate: parseInt(audioStream.sample_rate, 10),
      channels: audioStream.channels,
      bitrate: parseInt(audioStream.bit_rate, 10) || null,
    } : null,
    video: videoStream ? {
      codec: videoStream.codec_name,
      width: videoStream.width,
      height: videoStream.height,
      fps: evalFrameRate(videoStream.r_frame_rate),
    } : null,
    raw: parsed,
  };
}

function evalFrameRate(str) {
  if (!str) return null;
  const [n, d] = str.split('/').map(Number);
  return d ? n / d : null;
}

/**
 * Measures loudness via ffmpeg EBU R128 loudnorm analysis pass.
 * @param {string} filePath
 * @returns {Promise<{ ok: boolean, integratedLoudness: number|null, truePeak: number|null }>}
 */
export async function measureLoudness(filePath) {
  const { runFfmpeg } = await import('./index.js');
  const r = await runFfmpeg([
    '-i', filePath,
    '-af', 'loudnorm=print_format=json',
    '-f', 'null', '-',
  ]);
  // ffmpeg writes loudnorm JSON to stderr
  if (!r.ok && r.error?.code !== 'FFMPEG_ERROR') return { ok: false, error: r.error };
  const match = r.stderr.match(/\{[\s\S]*"input_i"[\s\S]*?\}/);
  if (!match) return { ok: false, integratedLoudness: null, truePeak: null,
    error: { code: 'LOUDNORM_PARSE_FAIL', message: 'Could not extract loudnorm data' } };
  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return { ok: false, integratedLoudness: null, truePeak: null,
      error: { code: 'LOUDNORM_PARSE_FAIL', message: 'Invalid loudnorm JSON payload' } };
  }
  return {
    ok: true,
    integratedLoudness: parseFloat(parsed.input_i),
    truePeak: parseFloat(parsed.input_tp),
    range: parseFloat(parsed.input_lra),
    threshold: parseFloat(parsed.input_thresh),
  };
}
