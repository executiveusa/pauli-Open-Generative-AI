import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildVisualizerCommand, persistVisualizerPlan } from '../src/visualizer/job.js';
import { buildMixMasterCommand } from '../src/audio/mixMaster.js';

test('visualizer command waveform', ()=>{
  const cmd = buildVisualizerCommand({ mode:'waveform', inputAudioPath:'in.wav', outputVideoPath:'out.mp4' });
  assert.equal(cmd[0], 'ffmpeg');
  assert.match(cmd.join(' '), /showwaves/);
});

test('visualizer command spectrum', ()=>{
  const cmd = buildVisualizerCommand({ mode:'spectrum', inputAudioPath:'in.wav', outputVideoPath:'out.mp4' });
  assert.match(cmd.join(' '), /showspectrum/);
});

test('persist visualizer plan', ()=>{
  const p = persistVisualizerPlan({ storageRoot:'/tmp/mol-tests', projectId:'p1', jobId:'j1', config:{ mode:'waveform' } });
  assert.equal(fs.existsSync(p), true);
});

test('mix-master command', ()=>{
  const cmd = buildMixMasterCommand({ inputAudioPath:'in.wav', outputAudioPath:'out.wav', preset:'club-loud' });
  assert.match(cmd.join(' '), /acompressor/);
});
