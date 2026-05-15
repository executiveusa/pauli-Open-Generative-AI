import { ffmpegCmd } from '../ffmpeg/commands.js';

export function buildMixMasterCommand({ inputAudioPath, outputAudioPath, preset = 'clean-master' }) {
  if (!inputAudioPath || !outputAudioPath) throw new Error('inputAudioPath and outputAudioPath are required');
  const chainByPreset = {
    'clean-master': 'loudnorm=I=-14:TP=-1.5:LRA=11',
    'club-loud': 'acompressor=threshold=-14dB:ratio=4,loudnorm=I=-9:TP=-1.0:LRA=8',
    'vocal-forward': 'equalizer=f=3000:t=q:w=1:g=3,loudnorm=I=-12:TP=-1.2:LRA=9'
  };
  const filters = chainByPreset[preset] || chainByPreset['clean-master'];
  return ffmpegCmd('-y', '-i', inputAudioPath, '-af', filters, outputAudioPath);
}
