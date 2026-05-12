export const ffmpegCmd = (...args) => ['ffmpeg', ...args];
export const probeCmd = (input) => ['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', input];
export const waveformCmd = ({ input, output, width = 1080, height = 1920 }) => ffmpegCmd('-y','-i',input,'-filter_complex',`showwaves=s=${width}x${height}:mode=line:colors=0x00e5ff`,'-pix_fmt','yuv420p',output);
export const spectrumCmd = ({ input, output, width = 1080, height = 1920 }) => ffmpegCmd('-y','-i',input,'-filter_complex',`showspectrum=s=${width}x${height}:mode=combined:color=rainbow`,'-pix_fmt','yuv420p',output);
export const muxCmd = ({ video, audio, output }) => ffmpegCmd('-y','-i',video,'-i',audio,'-c:v','copy','-c:a','aac','-shortest',output);
