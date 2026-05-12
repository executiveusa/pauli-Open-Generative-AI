/**
 * Scene stitching and final render service — Phase 9.
 * Uses FFmpeg worker to concat clips, mux audio, burn captions, and export.
 */

import { concatClips, muxAudioVideo, burnSubtitles, extractThumbnail, scaleVideo } from '../../../../apps/workers/media/src/ffmpeg/video.js';
import { writeJson } from '../storage/local.js';
import * as db from '../db/repository.js';
import { storagePath } from '../storage/local.js';

/**
 * Stitches generated scene clips into a final music video.
 * @param {object} job - MediaJob
 * @param {object} plan - analysis plan with scenes
 * @param {object[]} sceneResults - from generateScenes
 * @param {object} opts
 */
export async function stitchAndRender(job, plan, sceneResults, opts = {}) {
  const {
    audioPath,
    aspectRatio = '9:16',
    burnCaptions = false,
    srtPath = null,
    exportFormats = ['mp4'],
  } = opts;

  const projectDir = `projects/${job.projectId}/jobs/${job.id}`;

  // 1. Collect valid clip paths
  const clips = sceneResults
    .filter(s => s.ok && s.outputPath)
    .sort((a, b) => a.index - b.index)
    .map(s => storagePath(s.outputPath));

  if (clips.length === 0) {
    return { ok: false, error: { code: 'NO_CLIPS', message: 'No scene clips available to stitch' } };
  }

  await db.jobs.patch(job.id, { stage: 'stitching', message: 'Concatenating scene clips', progress: 0.7 });

  // 2. Concatenate clips
  const concatPath = storagePath(`${projectDir}/artifacts/video/concat.mp4`);
  const concatResult = await concatClips({ clips, outputPath: concatPath });
  if (!concatResult.ok) {
    // In stub mode: FFmpeg not available, write stub metadata
    await writeJson(`${projectDir}/artifacts/video/concat.stub.json`, {
      stub: true, clips, note: 'FFmpeg unavailable — stub concat',
    });
  }

  await db.jobs.patch(job.id, { progress: 0.8, message: 'Muxing audio with video' });

  // 3. Mux audio
  const finalPath = storagePath(`${projectDir}/artifacts/video/final.mp4`);
  if (concatResult.ok && audioPath) {
    const muxResult = await muxAudioVideo({ videoPath: concatPath, audioPath, outputPath: finalPath });
    if (!muxResult.ok) {
      await writeJson(`${projectDir}/artifacts/video/final.stub.json`, { stub: true, note: 'Mux failed' });
    }
  } else {
    await writeJson(`${projectDir}/artifacts/video/final.stub.json`, {
      stub: true, clips: clips.length, audioPath, note: 'Stub final — FFmpeg not available',
    });
  }

  await db.jobs.patch(job.id, { progress: 0.9, message: 'Generating thumbnails' });

  // 4. Thumbnail
  const thumbPath = storagePath(`${projectDir}/artifacts/thumbnails/thumb.jpg`);
  if (concatResult.ok) {
    await extractThumbnail({ videoPath: concatPath, outputPath: thumbPath, seekSeconds: 3 });
  }

  // 5. Write completion record
  const completion = {
    ok: true,
    jobId: job.id,
    projectId: job.projectId,
    totalScenes: sceneResults.length,
    stitchedScenes: clips.length,
    finalPath: `${projectDir}/artifacts/video/final.mp4`,
    thumbnailPath: `${projectDir}/artifacts/thumbnails/thumb.jpg`,
    completedAt: new Date().toISOString(),
    ffmpegAvailable: concatResult.ok,
  };

  await writeJson(`${projectDir}/completion.json`, completion);
  await db.jobs.patch(job.id, { progress: 1, stage: 'done', message: 'Render complete', status: 'succeeded' });

  return completion;
}

/**
 * Remakes only selected scenes and re-stitches.
 * @param {object} parentJob - original job
 * @param {object} remakeJob - child job
 * @param {string[]} sceneIds - scene IDs to regenerate
 * @param {object} changes - { promptDelta, seed }
 * @param {object[]} existingSceneResults - from original job
 */
export async function remakeScenes(parentJob, remakeJob, sceneIds, changes, existingSceneResults) {
  const { generateScenes } = await import('./sceneGenerator.js');
  const parentPlan = await (await import('../storage/local.js')).readJson(
    `projects/${parentJob.projectId}/jobs/${parentJob.id}/artifacts/plan.json`
  );

  if (!parentPlan) {
    return { ok: false, error: { code: 'NO_PLAN', message: 'Parent job plan not found' } };
  }

  // Filter only the scenes to regenerate
  const scenesToRemake = (parentPlan.scenes ?? []).filter(s => sceneIds.includes(s.sceneId));

  if (scenesToRemake.length === 0) {
    return { ok: false, error: { code: 'NO_SCENES', message: 'No matching scenes found' } };
  }

  // Apply prompt delta if provided
  const modifiedScenes = scenesToRemake.map(s => ({
    ...s,
    visualPrompt: changes.promptDelta
      ? `${s.visualPrompt}, ${changes.promptDelta}`
      : s.visualPrompt,
    seed: changes.seed ?? s.seed,
  }));

  const modifiedPlan = { ...parentPlan, scenes: modifiedScenes };

  // Generate only modified scenes
  const { sceneResults: newResults } = await generateScenes(remakeJob, modifiedPlan, [], {});

  // Merge with existing results
  const merged = existingSceneResults.map(s => {
    const replaced = newResults.find(r => r.sceneId === s.sceneId);
    return replaced ?? s;
  });

  // Write merged results
  await writeJson(`projects/${parentJob.projectId}/jobs/${remakeJob.id}/artifacts/scene_results.json`, merged);

  return { ok: true, sceneResults: merged, remadeScenes: newResults.map(r => r.sceneId) };
}
