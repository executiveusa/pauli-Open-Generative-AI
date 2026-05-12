/**
 * FFmpeg availability detection.
 * All FFmpeg operations fail gracefully when binary is not present.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

let _available = null;
let _version = null;
let _ffmpegPath = process.env.FFMPEG_PATH ?? 'ffmpeg';
let _ffprobePath = process.env.FFPROBE_PATH ?? 'ffprobe';

/**
 * Checks if FFmpeg is available. Cached after first call.
 * @returns {Promise<{ available: boolean, version: string|null }>}
 */
export async function checkFfmpeg() {
  if (_available !== null) return { available: _available, version: _version };
  try {
    const { stdout } = await execFileP(_ffmpegPath, ['-version'], { timeout: 5000 });
    _version = (stdout.match(/ffmpeg version (\S+)/) ?? [])[1] ?? 'unknown';
    _available = true;
  } catch {
    _available = false;
    _version = null;
  }
  return { available: _available, version: _version };
}

/**
 * Runs an FFmpeg command with argument array (never shell string).
 * @param {string[]} args
 * @param {{ timeout?: number, cwd?: string }} opts
 * @returns {Promise<{ ok: boolean, command: string[], stdout: string, stderr: string, outputPaths: string[], error?: object }>}
 */
export async function runFfmpeg(args, opts = {}) {
  const command = [_ffmpegPath, ...args];
  // Redact any secrets (paths with known patterns)
  const safeCommand = command.map(a =>
    /\/(sk-|hf_|fal_|nvapi-)/i.test(a) ? '[REDACTED]' : a
  );

  const { available } = await checkFfmpeg();
  if (!available) {
    return {
      ok: false, command: safeCommand, stdout: '', stderr: '',
      outputPaths: [],
      error: { code: 'FFMPEG_NOT_FOUND', message: 'FFmpeg binary not found. Set FFMPEG_PATH or install ffmpeg.' },
    };
  }

  try {
    const { stdout, stderr } = await execFileP(_ffmpegPath, args, {
      timeout: opts.timeout ?? 300_000,
      cwd: opts.cwd,
      maxBuffer: 50 * 1024 * 1024,
    });
    return { ok: true, command: safeCommand, stdout, stderr, outputPaths: [] };
  } catch (err) {
    return {
      ok: false, command: safeCommand,
      stdout: err.stdout ?? '', stderr: err.stderr ?? '',
      outputPaths: [],
      error: { code: 'FFMPEG_ERROR', message: String(err.message ?? err) },
    };
  }
}

/**
 * Runs ffprobe for media analysis.
 */
export async function runFfprobe(args, opts = {}) {
  const { available } = await checkFfmpeg();
  if (!available) {
    return {
      ok: false, stdout: '', stderr: '',
      error: { code: 'FFMPEG_NOT_FOUND', message: 'FFprobe not found.' },
    };
  }
  try {
    const { stdout, stderr } = await execFileP(_ffprobePath, args, {
      timeout: opts.timeout ?? 30_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { ok: true, stdout, stderr };
  } catch (err) {
    return { ok: false, stdout: err.stdout ?? '', stderr: err.stderr ?? '',
      error: { code: 'FFPROBE_ERROR', message: String(err.message) } };
  }
}

export { _ffmpegPath, _ffprobePath };
