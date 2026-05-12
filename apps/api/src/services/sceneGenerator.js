/**
 * Scene generation orchestrator — Phase B of music-video workflow.
 * Selects provider, builds prompts, generates scenes, checks continuity.
 */

import { buildScenePrompt, continuityCCheck } from '../../../../packages/shared/src/prompts/musicVideoPromptBuilder.js';
import { selectProvider } from '../../../../packages/shared/src/model-routing/selectProvider.js';
import { writeJson } from '../storage/local.js';
import * as db from '../db/repository.js';

// Provider adapters — imported lazily so disabled providers don't require setup
async function getProvider(providerId) {
  switch (providerId) {
    case 'ltx': {
      const { generateTextToVideo, generateImageToVideo } = await import('../../../../apps/workers/models/ltx/src/provider.js');
      return { generateTextToVideo, generateImageToVideo };
    }
    case 'stub':
    default: {
      const { generateTextToVideo, generateImageToVideo } = await import('../../../../apps/workers/models/stub/src/provider.js');
      return { generateTextToVideo, generateImageToVideo };
    }
  }
}

/**
 * Generates all scenes for a music-video job.
 * Updates job status/progress in the DB as it proceeds.
 *
 * @param {object} job - MediaJob
 * @param {object} plan - job plan from analyzeSong
 * @param {object[]} characterPassports - CharacterPassport[]
 * @param {object} opts
 * @returns {Promise<{ ok: boolean, sceneResults: object[] }>}
 */
export async function generateScenes(job, plan, characterPassports, opts = {}) {
  const {
    mode = 'text-to-video',
    stylePack = {},
    enabledProviders = ['stub'],
    allowPaid = false,
    hasLocalGpu = false,
  } = opts;

  const scenes = plan.scenes ?? [];
  const sceneResults = [];

  // Available routes (minimal for now — in Phase 10 these come from DB/config)
  const availableRoutes = buildAvailableRoutes(enabledProviders);

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    // Build prompt
    const { positivePrompt, negativePrompt, seed, providerHints } = buildScenePrompt({
      scene: { ...scene, characterIds: characterPassports.map(p => p.id) },
      characterPassports,
      stylePack,
    });

    // Continuity check
    const warnings = continuityCCheck(
      { ...scene, characterIds: characterPassports.map(p => p.id), seed },
      characterPassports,
    );

    // Select provider
    const { route } = selectProvider(availableRoutes, {
      capability: mode === 'image-to-video' ? 'image-to-video' : 'text-to-video',
      allowPaid,
      enabledProviders,
      hasLocalGpu,
    });

    // Generate
    const outputPath = `projects/${job.projectId}/jobs/${job.id}/artifacts/video/${scene.sceneId}.mp4`;
    const provider = await getProvider(route.provider);
    let result;

    if (mode === 'image-to-video' && provider.generateImageToVideo) {
      result = await provider.generateImageToVideo({ prompt: positivePrompt, seed, durationSeconds: scene.durationSeconds, outputPath, sceneId: scene.sceneId });
    } else {
      result = await provider.generateTextToVideo({ prompt: positivePrompt, seed, durationSeconds: scene.durationSeconds, outputPath, sceneId: scene.sceneId });
    }

    const sceneResult = {
      sceneId: scene.sceneId,
      index: i,
      ok: result.ok,
      positivePrompt,
      negativePrompt,
      seed,
      provider: route.provider,
      outputPath: result.ok ? outputPath : null,
      warnings,
      error: result.ok ? null : result.error,
    };

    sceneResults.push(sceneResult);

    // Persist scene result
    await writeJson(`projects/${job.projectId}/jobs/${job.id}/artifacts/prompts/${scene.sceneId}.json`, sceneResult);

    // Update job progress
    const progress = (i + 1) / scenes.length;
    await db.jobs.patch(job.id, {
      progress,
      stage: `scene-generation`,
      message: `Generating scene ${i + 1} of ${scenes.length} (${scene.sceneId})`,
    });
  }

  // Write scene manifest
  await writeJson(`projects/${job.projectId}/jobs/${job.id}/artifacts/scene_results.json`, sceneResults);

  return { ok: true, sceneResults };
}

function buildAvailableRoutes(enabledProviders) {
  const routes = [
    { id: 'stub-t2v', capability: 'text-to-video', provider: 'stub', modelId: 'stub', requiresGpu: false, estimatedCost: 'free', enabled: true, supportsReferenceImages: true, supportsLoRA: false, supportsSeed: true },
    { id: 'stub-i2v', capability: 'image-to-video', provider: 'stub', modelId: 'stub', requiresGpu: false, estimatedCost: 'free', enabled: true, supportsReferenceImages: true, supportsLoRA: false, supportsSeed: true },
    { id: 'ltx-t2v', capability: 'text-to-video', provider: 'ltx', modelId: 'ltx-video', requiresGpu: true, estimatedCost: 'free', enabled: enabledProviders.includes('ltx'), supportsReferenceImages: false, supportsLoRA: true, supportsSeed: true, maxDurationSeconds: 10 },
    { id: 'ltx-i2v', capability: 'image-to-video', provider: 'ltx', modelId: 'ltx-video', requiresGpu: true, estimatedCost: 'free', enabled: enabledProviders.includes('ltx'), supportsReferenceImages: true, supportsLoRA: true, supportsSeed: true, maxDurationSeconds: 10 },
    { id: 'fal-t2v', capability: 'text-to-video', provider: 'fal', modelId: 'fal-ai/ltx-video', requiresGpu: false, estimatedCost: 'medium', enabled: enabledProviders.includes('fal'), supportsReferenceImages: false, supportsLoRA: false, supportsSeed: true },
  ];
  return routes;
}
