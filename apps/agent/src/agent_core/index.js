export function planFromPrompt(prompt) {
  const p = (prompt || '').toLowerCase();
  if (p.includes('visualizer')) return { intent: 'visualizer', steps: ['upload-audio','create-job','track-job'] };
  if (p.includes('master')) return { intent: 'mix-master', steps: ['upload-audio','create-job','track-job'] };
  return { intent: 'music-video', steps: ['upload-song','analyze','scene-plan','render'] };
}
