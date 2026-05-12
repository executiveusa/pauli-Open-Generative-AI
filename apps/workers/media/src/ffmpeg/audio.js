/**
 * Audio processing operations via FFmpeg.
 * All functions accept/return absolute file paths and write outputs to job artifact directories.
 */

import { runFfmpeg } from './index.js';

/**
 * Normalizes audio loudness to a target LUFS value (EBU R128 two-pass).
 * @param {{ inputPath: string, outputPath: string, targetLUFS?: number }} opts
 */
export async function normalizeLoudness({ inputPath, outputPath, targetLUFS = -14 }) {
  return runFfmpeg([
    '-y', '-i', inputPath,
    '-af', `loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11`,
    '-ar', '44100',
    outputPath,
  ]);
}

/**
 * Extracts audio from a video file.
 * @param {{ inputPath: string, outputPath: string, format?: string }} opts
 */
export async function extractAudio({ inputPath, outputPath, format = 'wav' }) {
  return runFfmpeg([
    '-y', '-i', inputPath,
    '-vn',
    '-acodec', format === 'mp3' ? 'libmp3lame' : 'pcm_s16le',
    '-ar', '44100',
    outputPath,
  ]);
}

/**
 * Applies an EQ preset via FFmpeg equalizer filter.
 * @param {{ inputPath: string, outputPath: string, preset: string }} opts
 */
export async function applyEq({ inputPath, outputPath, preset = 'clean' }) {
  const filters = EQ_PRESETS[preset] ?? EQ_PRESETS.clean;
  return runFfmpeg([
    '-y', '-i', inputPath,
    '-af', filters,
    outputPath,
  ]);
}

const EQ_PRESETS = {
  'clean':         'equalizer=f=200:t=o:w=200:g=1,equalizer=f=8000:t=o:w=4000:g=1',
  'vocal-forward': 'equalizer=f=3000:t=o:w=2000:g=4,equalizer=f=300:t=o:w=200:g=-2',
  'bass-heavy':    'equalizer=f=80:t=o:w=60:g=5,equalizer=f=200:t=o:w=100:g=3,equalizer=f=4000:t=o:w=2000:g=-2',
  'drill-vocal':   'equalizer=f=5000:t=o:w=3000:g=5,equalizer=f=200:t=o:w=150:g=-3,equalizer=f=80:t=o:w=50:g=3',
  'trap-vocal':    'equalizer=f=4000:t=o:w=2000:g=4,equalizer=f=150:t=o:w=100:g=2',
  'radio-polish':  'equalizer=f=100:t=o:w=80:g=-1,equalizer=f=3000:t=o:w=2000:g=3,equalizer=f=12000:t=o:w=4000:g=1',
  'warm-analog':   'equalizer=f=8000:t=o:w=4000:g=-3,equalizer=f=200:t=o:w=100:g=2',
  'podcast-clean': 'highpass=f=100,equalizer=f=3000:t=o:w=2000:g=3,lowpass=f=12000',
};

/**
 * Applies compression via FFmpeg acompressor filter.
 * @param {{ inputPath: string, outputPath: string, ratio?: number, threshold?: number }} opts
 */
export async function applyCompressor({ inputPath, outputPath, ratio = 4, threshold = -18 }) {
  return runFfmpeg([
    '-y', '-i', inputPath,
    '-af', `acompressor=threshold=${threshold}dB:ratio=${ratio}:attack=5:release=50`,
    outputPath,
  ]);
}

/**
 * Mixes multiple audio stems into one file.
 * @param {{ inputs: string[], outputPath: string }} opts
 */
export async function mixStems({ inputs, outputPath }) {
  const args = ['-y'];
  for (const p of inputs) args.push('-i', p);
  args.push(
    '-filter_complex', `amix=inputs=${inputs.length}:duration=longest`,
    outputPath,
  );
  return runFfmpeg(args);
}

/**
 * Exports audio to specified format.
 * @param {{ inputPath: string, outputPath: string, format: 'wav'|'mp3'|'flac' }} opts
 */
export async function exportAudio({ inputPath, outputPath, format = 'wav' }) {
  const codecMap = { wav: ['pcm_s16le'], mp3: ['libmp3lame', '-q:a', '0'], flac: ['flac'] };
  const codec = codecMap[format] ?? codecMap.wav;
  return runFfmpeg(['-y', '-i', inputPath, '-acodec', ...codec, '-ar', '44100', outputPath]);
}

/**
 * Trims audio to a time range.
 * @param {{ inputPath: string, outputPath: string, startSeconds: number, durationSeconds: number }} opts
 */
export async function trimAudio({ inputPath, outputPath, startSeconds, durationSeconds }) {
  return runFfmpeg([
    '-y', '-i', inputPath,
    '-ss', String(startSeconds),
    '-t', String(durationSeconds),
    '-acodec', 'copy',
    outputPath,
  ]);
}
