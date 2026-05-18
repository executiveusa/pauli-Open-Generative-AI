/**
 * Stub model provider — used in test mode and local dev without GPU.
 * Returns placeholder artifacts that have the correct shape for downstream stitching.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? './storage';

/**
 * Stub text-to-video generation.
 * Creates a placeholder MP4 (actually a tiny valid file or empty).
 */
export async function generateTextToVideo({ prompt, seed, durationSeconds, outputPath, sceneId }) {
  await mkdir(dirname(outputPath), { recursive: true });

  // Write a stub JSON artifact (real implementation writes MP4)
  const meta = {
    stub: true,
    provider: 'stub',
    sceneId: sceneId ?? 'unknown',
    prompt: prompt?.slice(0, 200) ?? '',
    seed: seed ?? 1,
    durationSeconds: durationSeconds ?? 5,
    outputPath,
    generatedAt: new Date().toISOString(),
  };

  // Write stub metadata
  const metaPath = outputPath.replace(/\.\w+$/, '.stub.json');
  await writeFile(metaPath, JSON.stringify(meta, null, 2));

  return {
    ok: true,
    provider: 'stub',
    outputPath,
    metaPath,
    durationSeconds: durationSeconds ?? 5,
    seed: seed ?? 1,
    note: 'Stub output — no real video generated. Enable LTX or ComfyUI for real generation.',
  };
}

/**
 * Stub image-to-video generation.
 */
export async function generateImageToVideo({ referenceImagePath, prompt, seed, durationSeconds, outputPath, sceneId }) {
  return generateTextToVideo({ prompt, seed, durationSeconds, outputPath, sceneId });
}

/**
 * Stub visualizer generation (no FFmpeg needed).
 */
export async function generateVisualizerStub({ audioPath, outputPath, mode }) {
  await mkdir(dirname(outputPath), { recursive: true });
  const meta = {
    stub: true, provider: 'stub', audioPath, mode,
    outputPath, generatedAt: new Date().toISOString(),
    note: 'Stub — install FFmpeg for real visualizer output.',
  };
  await writeFile(outputPath.replace(/\.\w+$/, '.stub.json'), JSON.stringify(meta, null, 2));
  return { ok: true, provider: 'stub', outputPath };
}

/**
 * Stub mix-master job (no FFmpeg needed).
 */
export async function mixMasterStub({ audioPath, outputPath, preset }) {
  await mkdir(dirname(outputPath), { recursive: true });
  const meta = {
    stub: true, provider: 'stub', audioPath, preset,
    outputPath, generatedAt: new Date().toISOString(),
  };
  await writeFile(outputPath.replace(/\.\w+$/, '.stub.json'), JSON.stringify(meta, null, 2));
  return { ok: true, provider: 'stub', outputPath };
}
