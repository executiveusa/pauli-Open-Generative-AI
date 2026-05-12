/**
 * Audio visualizer generation via FFmpeg.
 * Produces MP4 visualizer from an audio file.
 */

import { runFfmpeg } from './index.js';

/**
 * Generates a waveform visualizer video.
 * @param {{ audioPath: string, outputPath: string, width?: number, height?: number, color?: string }} opts
 */
export async function generateWaveform({ audioPath, outputPath, width = 1080, height = 1920, color = '0x7c3aed' }) {
  return runFfmpeg([
    '-y',
    '-i', audioPath,
    '-filter_complex',
    `[0:a]showwaves=s=${width}x${height}:mode=cline:colors=${color}:scale=lin[v]`,
    '-map', '[v]',
    '-map', '0:a',
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-shortest',
    outputPath,
  ]);
}

/**
 * Generates a spectrum (frequency) visualizer video.
 * @param {{ audioPath: string, outputPath: string, width?: number, height?: number, color?: string }} opts
 */
export async function generateSpectrum({ audioPath, outputPath, width = 1080, height = 1920, color = 'intensity' }) {
  return runFfmpeg([
    '-y',
    '-i', audioPath,
    '-filter_complex',
    `[0:a]showspectrum=s=${width}x${height}:color=${color}:mode=separate:scale=log[v]`,
    '-map', '[v]',
    '-map', '0:a',
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-shortest',
    outputPath,
  ]);
}

/**
 * Generates a frequency band (equalizer-bar) visualizer.
 * @param {{ audioPath: string, outputPath: string, width?: number, height?: number }} opts
 */
export async function generateEqBars({ audioPath, outputPath, width = 1080, height = 1920 }) {
  return runFfmpeg([
    '-y',
    '-i', audioPath,
    '-filter_complex',
    `[0:a]showfreqs=s=${width}x${height}:mode=bar:cmode=combined:fscale=log[v]`,
    '-map', '[v]',
    '-map', '0:a',
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-shortest',
    outputPath,
  ]);
}

/**
 * Overlays a caption/lyrics text onto a video.
 * @param {{ videoPath: string, outputPath: string, text: string, fontSize?: number }} opts
 */
export async function overlayCaption({ videoPath, outputPath, text, fontSize = 48, color = 'white' }) {
  const safe = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
  return runFfmpeg([
    '-y', '-i', videoPath,
    '-vf', `drawtext=text='${safe}':fontcolor=${color}:fontsize=${fontSize}:x=(w-text_w)/2:y=h-text_h-40:shadowcolor=black:shadowx=2:shadowy=2`,
    '-c:a', 'copy',
    outputPath,
  ]);
}

/**
 * Dispatches visualizer generation based on mode.
 * @param {{ audioPath: string, outputPath: string, mode: string, width?: number, height?: number, primaryColor?: string }} opts
 */
export async function generateVisualizer({ audioPath, outputPath, mode, width = 1080, height = 1920, primaryColor = '0x7c3aed' }) {
  switch (mode) {
    case 'waveform':   return generateWaveform({ audioPath, outputPath, width, height, color: primaryColor });
    case 'spectrum':   return generateSpectrum({ audioPath, outputPath, width, height });
    case 'eq-bars':    return generateEqBars({ audioPath, outputPath, width, height });
    default:           return generateSpectrum({ audioPath, outputPath, width, height });
  }
}
