/**
 * Audio utilities for music generation.
 * Wraps FFmpeg/FFprobe for duration probing, loudness analysis, and waveform generation.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Check if FFmpeg/FFprobe is available
 */
export async function checkFfmpeg() {
  try {
    await execFileAsync('ffmpeg', ['-version']);
    return { available: true };
  } catch (err) {
    return {
      available: false,
      error: err.code || 'FFMPEG_NOT_FOUND',
      message: 'FFmpeg not installed or not in PATH',
    };
  }
}

/**
 * Probe audio file for duration and basic metadata
 */
export async function probeAudio(filePath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration,size,bit_rate',
      '-show_entries', 'stream=codec_type,sample_rate,channels',
      '-print_format', 'json',
      filePath,
    ]);

    const data = JSON.parse(stdout);
    const format = data.format || {};
    const audioStream = (data.streams || []).find(s => s.codec_type === 'audio');

    return {
      ok: true,
      durationSeconds: parseFloat(format.duration) || null,
      sizeBytes: parseInt(format.size, 10) || null,
      bitrate: parseInt(format.bit_rate, 10) || null,
      sampleRate: audioStream ? parseInt(audioStream.sample_rate, 10) : null,
      channels: audioStream ? audioStream.channels : null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      durationSeconds: null,
    };
  }
}

/**
 * Generate a waveform PNG preview from audio file
 */
export async function generateWaveformPreview(inputPath, outputPath) {
  try {
    await execFileAsync('ffmpeg', [
      '-i', inputPath,
      '-filter_complex', 'waveform=colors=0xFF00FF:size=1920x480:rate=30',
      '-frames:v', '1',
      outputPath,
    ]);

    return { ok: true, path: outputPath };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      path: null,
    };
  }
}

/**
 * Check if Demucs is available for stem extraction
 */
export async function checkDemucs() {
  try {
    const { stdout } = await execFileAsync('python', ['-c', 'import demucs; print("ok")']);
    return { available: stdout.includes('ok') };
  } catch {
    return { available: false };
  }
}

/**
 * Extract stems from audio file using Demucs (if available)
 */
export async function extractStems(audioPath, outputDir) {
  const demucs = await checkDemucs();
  if (!demucs.available) {
    return {
      ok: false,
      error: 'DEMUCS_NOT_AVAILABLE',
      message: 'Demucs not installed. Run: pip install demucs',
    };
  }

  try {
    await execFileAsync('python', [
      '-m', 'demucs',
      '--out', outputDir,
      '--two-stems=vocals',
      audioPath,
    ]);

    return {
      ok: true,
      vocalPath: `${outputDir}/vocals.wav`,
      backgroundPath: `${outputDir}/bass.wav`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    };
  }
}

/**
 * Measure loudness of audio file (integrated loudness in LUFS)
 */
export async function measureLoudness(filePath) {
  try {
    const { stderr } = await execFileAsync('ffmpeg', [
      '-i', filePath,
      '-af', 'loudnorm=print_format=json',
      '-f', 'null', '-',
    ]);

    const match = stderr.match(/\{[\s\S]*"input_i"[\s\S]*?\}/);
    if (!match) {
      return {
        ok: false,
        integratedLoudness: null,
        truePeak: null,
        error: 'Could not extract loudness data',
      };
    }

    const data = JSON.parse(match[0]);
    return {
      ok: true,
      integratedLoudness: parseFloat(data.input_i),
      truePeak: parseFloat(data.input_tp),
      range: parseFloat(data.input_lra),
    };
  } catch (err) {
    return {
      ok: false,
      integratedLoudness: null,
      error: err.message,
    };
  }
}
