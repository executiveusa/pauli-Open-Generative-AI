export function buildScenePrompt({scene,characterPassports}) {
  const anchors = characterPassports.map(c=>c.promptAnchor).filter(Boolean).join(', ');
  const triggers = characterPassports.flatMap(c=>c.triggerWords||[]).filter(Boolean).join(', ');
  const positive = [scene.visualPrompt, scene.location, scene.cameraMotion, anchors, triggers].filter(Boolean).join(', ');
  const negative = [scene.negativePrompt, ...characterPassports.map(c=>c.negativePromptAnchor).filter(Boolean)].join(', ');
  return { positivePrompt: positive, negativePrompt: negative, seed: scene.seed ?? 1, providerHints: { sceneId: scene.sceneId } };
}
