import { spawn } from 'node:child_process';
import { redact } from './redact.js';

export async function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('close', (code) => resolve({ ok: code === 0, command: [command, ...args], stdout: redact(stdout), stderr: redact(stderr), outputPaths: [], error: code === 0 ? undefined : { code: 'ffmpeg_failed', message: `exit ${code}` } }));
  });
}
