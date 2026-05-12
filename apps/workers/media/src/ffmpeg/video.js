/**
 * Video processing operations via FFmpeg.
 */

import { runFfmpeg } from './index.js';

/**
 * Concatenates video clips in order.
 * @param {{ clips: string[], outputPath: string, crossfade?: boolean }} opts
 */
export async function concatClips({ clips, outputPath, crossfade = false }) {
  if (crossfade && clips.length >= 2) {
    return concatWithCrossfade({ clips, outputPath });
  }
  // Write concat manifest to temp
  const { writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const manifest = clips.map(p => `file '${p}'`).join('\n');
  const manifestPath = join(tmpdir(), `mol_concat_${Date.now()}.txt`);
  await writeFile(manifestPath, manifest);

  return runFfmpeg([
    '-y',
    '-f', 'concat', '-safe', '0',
    '-i', manifestPath,
    '-c', 'copy',
    outputPath,
  ]);
}

async function concatWithCrossfade({ clips, outputPath }) {
  // xfade filter for 2-clip crossfade (extend for N clips)
  const args = ['-y'];
  for (const clip of clips) args.push('-i', clip);
  const n = clips.length;
  let filter = '';
  // Build xfade chain
  for (let i = 0; i < n - 1; i++) {
    const prev = i === 0 ? `[0:v]` : `[xf${i - 1}]`;
    const next = `[${i + 1}:v]`;
    filter += `${prev}${next}xfade=transition=fade:duration=0.5:offset=3[xf${i}];`;
  }
  filter = filter.slice(0, -1); // remove trailing semicolon
  args.push('-filter_complex', filter, '-map', `[xf${n - 2}]`, outputPath);
  return runFfmpeg(args);
}

/**
 * Muxes video with audio track.
 * @param {{ videoPath: string, audioPath: string, outputPath: string }} opts
 */
export async function muxAudioVideo({ videoPath, audioPath, outputPath }) {
  return runFfmpeg([
    '-y',
    '-i', videoPath,
    '-i', audioPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    outputPath,
  ]);
}

/**
 * Burns subtitle/caption file onto video.
 * @param {{ videoPath: string, subtitlePath: string, outputPath: string }} opts
 */
export async function burnSubtitles({ videoPath, subtitlePath, outputPath }) {
  return runFfmpeg([
    '-y', '-i', videoPath,
    '-vf', `subtitles='${subtitlePath.replace(/'/g, "'\\''")}':force_style='FontSize=24,PrimaryColour=&Hffffff,Bold=1'`,
    '-c:a', 'copy',
    outputPath,
  ]);
}

/**
 * Creates a thumbnail image from a video at a given timestamp.
 * @param {{ videoPath: string, outputPath: string, seekSeconds?: number }} opts
 */
export async function extractThumbnail({ videoPath, outputPath, seekSeconds = 0 }) {
  return runFfmpeg([
    '-y', '-ss', String(seekSeconds),
    '-i', videoPath,
    '-vframes', '1',
    '-q:v', '2',
    outputPath,
  ]);
}

/**
 * Scales/pads video to a target aspect ratio.
 * @param {{ inputPath: string, outputPath: string, width: number, height: number }} opts
 */
export async function scaleVideo({ inputPath, outputPath, width, height }) {
  return runFfmpeg([
    '-y', '-i', inputPath,
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
    '-c:a', 'copy',
    outputPath,
  ]);
}

/**
 * Trims a video clip to duration.
 * @param {{ inputPath: string, outputPath: string, startSeconds: number, durationSeconds: number }} opts
 */
export async function trimVideo({ inputPath, outputPath, startSeconds, durationSeconds }) {
  return runFfmpeg([
    '-y', '-i', inputPath,
    '-ss', String(startSeconds),
    '-t', String(durationSeconds),
    '-c', 'copy',
    outputPath,
  ]);
}
