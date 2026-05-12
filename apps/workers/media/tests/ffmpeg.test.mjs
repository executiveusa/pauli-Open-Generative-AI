import test from 'node:test';
import assert from 'node:assert/strict';
import { waveformCmd, spectrumCmd, muxCmd } from '../src/ffmpeg/commands.js';
import { redact } from '../src/ffmpeg/redact.js';

test('build waveform command', ()=>{ const c = waveformCmd({ input:'a.wav', output:'o.mp4' }); assert.equal(c[0], 'ffmpeg'); assert.match(c.join(' '), /showwaves/); });
test('build spectrum command', ()=>{ const c = spectrumCmd({ input:'a.wav', output:'o.mp4' }); assert.match(c.join(' '), /showspectrum/); });
test('build mux command', ()=>{ const c = muxCmd({ video:'v.mp4', audio:'a.wav', output:'o.mp4' }); assert.match(c.join(' '), /-shortest/); });
test('redact secrets', ()=>{ assert.equal(redact('token sk-abc123'), 'token [REDACTED]'); });
