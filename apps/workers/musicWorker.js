/**
 * Background worker for music generation jobs.
 * Polls for queued music-generation jobs, processes via ACE-Step adapter,
 * downloads artifacts, and updates job state.
 */

import { getAdapter } from './models/ace-step/src/adapter.js';
import { applyTransition } from '../../packages/shared/src/jobs/mediaJobState.js';
import { makeMusicArtifact } from '../../packages/shared/src/types/music.js';
import { writeArtifact } from '../api/src/storage/local.js';
import * as db from '../api/src/db/repository.js';

const POLL_INTERVAL = process.env.WORKER_POLL_INTERVAL_MS ?? 5000;
const BATCH_SIZE = process.env.WORKER_BATCH_SIZE ?? 5;

/**
 * Fetch music jobs that are queued and ready to process
 */
async function getQueuedMusicJobs() {
  const allJobs = await db.jobs.list();
  return allJobs.filter(job =>
    job.type === 'music-generation' &&
    job.status === 'queued'
  ).slice(0, BATCH_SIZE);
}

/**
 * Download audio from provider response
 */
async function downloadAudio(audioData, jobId, format = 'mp3') {
  if (!audioData) throw new Error('No audio data provided');

  const buffer = Buffer.isBuffer(audioData)
    ? audioData
    : Buffer.from(audioData);

  const relPath = `artifacts/jobs/${jobId}/output.${format}`;
  const { storagePath, sha256, sizeBytes } = await writeArtifact(relPath, buffer);

  return { storagePath, sha256, sizeBytes };
}

/**
 * Process a single music generation job
 */
async function processJob(job) {
  const jobId = job.id;
  const input = job.input;

  try {
    // Transition to running
    const running = applyTransition(job, 'running', {
      stage: 'music-generation-processing',
      message: 'Processing with ' + (job.providerRoute?.provider ?? 'unknown'),
      progress: 10,
    });
    await db.jobs.put(jobId, running);

    // Get provider adapter
    const providerName = job.providerRoute?.provider ?? 'ace-step';
    const adapter = getAdapter(providerName);
    if (!adapter) {
      throw new Error(`Provider adapter not found: ${providerName}`);
    }

    // Call adapter based on mode
    let result;
    switch (input.mode) {
      case 'simple':
        result = await adapter.generateSong(input);
        break;
      case 'instrumental':
        result = await adapter.generateInstrumental(input);
        break;
      case 'lyrics':
        result = await adapter.generateWithLyrics(input);
        break;
      case 'cover':
        result = await adapter.generateCover(input);
        break;
      case 'repaint':
        result = await adapter.repaintSection(input);
        break;
      case 'stem-extraction':
        result = await adapter.extractStems(input);
        break;
      default:
        throw new Error(`Unknown music generation mode: ${input.mode}`);
    }

    // Normalize result
    const artifact = adapter.normalizeArtifact(result, {
      jobId: jobId,
      projectId: job.projectId,
      createdByUserId: job.ownerUserId,
      providerId: job.providerRoute?.provider,
      modelId: job.providerRoute?.modelId,
      kind: input.mode === 'instrumental' ? 'instrumental' : 'song',
      prompt: input.prompt,
      lyrics: input.lyrics ?? '',
      bpm: input.bpm ?? null,
      key: input.key ?? null,
    });

    // Download audio artifact
    const audioData = artifact.audioData || result.audio;
    if (!audioData) {
      throw new Error('No audio data in provider response');
    }

    const { storagePath, sha256, sizeBytes } = await downloadAudio(
      audioData,
      jobId,
      'mp3'
    );

    // Create artifact record
    const musicArtifact = makeMusicArtifact({
      id: artifact.id,
      jobId: jobId,
      projectId: job.projectId,
      createdByUserId: job.ownerUserId,
      providerId: artifact.provider,
      modelId: artifact.modelId,
      kind: artifact.kind ?? 'song',
      title: input.prompt?.substring(0, 100) ?? '',
      prompt: input.prompt,
      lyrics: input.lyrics ?? '',
      durationSeconds: artifact.durationSeconds,
      bpm: input.bpm ?? null,
      key: input.key ?? null,
      storagePath,
      metadata: {
        sha256,
        sizeBytes,
        provider: artifact.provider,
        modelId: artifact.modelId,
      },
    });

    // Persist artifact
    await db.artifacts.put(musicArtifact.id, musicArtifact);

    // Transition through stitching (required by state machine) to succeeded
    const stitching = applyTransition(running, 'stitching', {
      stage: 'music-generation-stitching',
      message: 'Finalizing audio',
      progress: 95,
    });
    await db.jobs.put(jobId, stitching);

    const succeeded = applyTransition(stitching, 'succeeded', {
      stage: 'music-generation-succeeded',
      message: 'Music generated successfully',
      progress: 100,
      artifacts: [musicArtifact.id],
    });
    await db.jobs.put(jobId, succeeded);

    console.log(`[music-worker] ✓ Job ${jobId} succeeded`);
    return { success: true, jobId };

  } catch (err) {
    const adapter = getAdapter(job.providerRoute?.provider ?? 'ace-step');
    const normalizedError = adapter?.normalizeError(err) ?? {
      message: String(err.message),
      code: 'unknown_error',
    };

    console.error(`[music-worker] ✗ Job ${jobId} failed:`, normalizedError.message);

    try {
      const failed = applyTransition(job, 'failed', {
        stage: 'music-generation-failed',
        message: normalizedError.message,
        error: {
          code: normalizedError.code,
          message: normalizedError.message,
        },
      });
      await db.jobs.put(jobId, failed);
    } catch (updateErr) {
      console.error(`[music-worker] Failed to update job ${jobId}:`, updateErr.message);
    }

    return { success: false, jobId, error: normalizedError.message };
  }
}

/**
 * Main worker loop
 */
async function run() {
  console.log('[music-worker] Starting music job processor');
  console.log(`[music-worker] Poll interval: ${POLL_INTERVAL}ms, batch size: ${BATCH_SIZE}`);

  while (true) {
    try {
      const jobs = await getQueuedMusicJobs();

      if (jobs.length > 0) {
        console.log(`[music-worker] Processing ${jobs.length} queued jobs`);
        const results = await Promise.allSettled(jobs.map(processJob));

        results.forEach((result, idx) => {
          if (result.status === 'rejected') {
            console.error(`[music-worker] Job processing error:`, result.reason);
          }
        });
      }

      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    } catch (err) {
      console.error('[music-worker] Fatal error:', err.message);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(err => {
    console.error('[music-worker] Startup error:', err);
    process.exit(1);
  });
}

export { processJob, getQueuedMusicJobs };
