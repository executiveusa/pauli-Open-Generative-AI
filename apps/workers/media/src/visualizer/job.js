import fs from 'node:fs';
import path from 'node:path';
import { waveformCmd, spectrumCmd } from '../ffmpeg/commands.js';

export function buildVisualizerCommand({ mode = 'waveform', inputAudioPath, outputVideoPath, width = 1080, height = 1920 }) {
  if (!inputAudioPath || !outputVideoPath) throw new Error('inputAudioPath and outputVideoPath are required');
  if (mode === 'spectrum') return spectrumCmd({ input: inputAudioPath, output: outputVideoPath, width, height });
  return waveformCmd({ input: inputAudioPath, output: outputVideoPath, width, height });
}

export function persistVisualizerPlan({ storageRoot, projectId, jobId, config }) {
  const planPath = path.join(storageRoot, 'projects', projectId, 'jobs', jobId, 'plan.json');
  fs.mkdirSync(path.dirname(planPath), { recursive: true });
  fs.writeFileSync(planPath, JSON.stringify({ type: 'visualizer', config, createdAt: new Date().toISOString() }, null, 2));
  return planPath;
}
