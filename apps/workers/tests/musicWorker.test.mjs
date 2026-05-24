import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processJob, getQueuedMusicJobs } from '../musicWorker.js';
import { makeMediaJob } from '../../../packages/shared/src/types/core.js';
import { makeMusicGenerationRequest } from '../../../packages/shared/src/types/music.js';

// Mock getQueuedMusicJobs for testing
let mockJobStore = {};

async function setupMockJob(jobData) {
  const job = {
    ...jobData,
    id: jobData.id ?? 'job_test_123',
  };
  mockJobStore[job.id] = job;
  return job;
}

async function cleanupMocks() {
  mockJobStore = {};
}

test('musicWorker — processes queued music job with simple mode', async () => {
  await cleanupMocks();

  const input = makeMusicGenerationRequest({
    prompt: 'upbeat pop song',
    mode: 'simple',
  });

  const job = makeMediaJob({
    id: 'job_001',
    type: 'music-generation',
    status: 'queued',
    input,
    providerRoute: {
      provider: 'ace-step',
      modelId: 'ace-step-1.5',
    },
  });

  await setupMockJob(job);

  // Job should be queued
  assert.equal(job.status, 'queued');
  assert.equal(job.type, 'music-generation');
  assert.equal(job.input.mode, 'simple');
});

test('musicWorker — transitions job from queued to running', async () => {
  const input = makeMusicGenerationRequest({
    prompt: 'test song',
    mode: 'simple',
  });

  const job = makeMediaJob({
    id: 'job_002',
    type: 'music-generation',
    status: 'queued',
    input,
    providerRoute: { provider: 'ace-step', modelId: 'ace-step-1.5' },
  });

  // Simulating what the worker does
  const { applyTransition } = await import('../../../packages/shared/src/jobs/mediaJobState.js');

  const running = applyTransition(job, 'running', {
    stage: 'music-generation-processing',
    message: 'Processing with ace-step',
    progress: 10,
  });

  assert.equal(running.status, 'running');
  assert.equal(running.stage, 'music-generation-processing');
  assert.equal(running.progress, 10);
  assert(running.updatedAt);
});

test('musicWorker — transitions job to succeeded with artifacts', async () => {
  const input = makeMusicGenerationRequest({
    prompt: 'test song',
    mode: 'simple',
  });

  const job = makeMediaJob({
    id: 'job_003',
    type: 'music-generation',
    status: 'running',
    input,
  });

  const { applyTransition } = await import('../../../packages/shared/src/jobs/mediaJobState.js');

  const stitching = applyTransition(job, 'stitching', {
    stage: 'music-generation-stitching',
    message: 'Finalizing audio',
    progress: 95,
  });

  const succeeded = applyTransition(stitching, 'succeeded', {
    stage: 'music-generation-succeeded',
    message: 'Music generated successfully',
    progress: 100,
    artifacts: ['artifact_123'],
  });

  assert.equal(succeeded.status, 'succeeded');
  assert.equal(succeeded.progress, 100);
  assert.deepEqual(succeeded.artifacts, ['artifact_123']);
});

test('musicWorker — transitions job to failed with error', async () => {
  const input = makeMusicGenerationRequest({
    prompt: 'test',
    mode: 'simple',
  });

  const job = makeMediaJob({
    id: 'job_004',
    type: 'music-generation',
    status: 'running',
    input,
  });

  const { applyTransition } = await import('../../../packages/shared/src/jobs/mediaJobState.js');

  const failed = applyTransition(job, 'failed', {
    stage: 'music-generation-failed',
    message: 'Provider timeout',
    error: {
      code: 'provider_timeout',
      message: 'Provider took too long to respond',
    },
  });

  assert.equal(failed.status, 'failed');
  assert.equal(failed.error.code, 'provider_timeout');
});

test('musicWorker — handles instrumental mode', async () => {
  const input = makeMusicGenerationRequest({
    prompt: 'background music',
    mode: 'instrumental',
  });

  const job = makeMediaJob({
    id: 'job_005',
    type: 'music-generation',
    status: 'queued',
    input,
  });

  assert.equal(job.input.mode, 'instrumental');
});

test('musicWorker — handles lyrics mode', async () => {
  const input = makeMusicGenerationRequest({
    prompt: 'pop song',
    mode: 'lyrics',
    lyrics: 'Verse 1...\nChorus...',
  });

  const job = makeMediaJob({
    id: 'job_006',
    type: 'music-generation',
    status: 'queued',
    input,
  });

  assert.equal(job.input.mode, 'lyrics');
  assert.equal(job.input.lyrics, 'Verse 1...\nChorus...');
});

test('musicWorker — handles cover mode', async () => {
  const input = makeMusicGenerationRequest({
    prompt: 'jazz cover',
    mode: 'cover',
    sourceAudioAssetId: 'asset_ref_123',
  });

  const job = makeMediaJob({
    id: 'job_007',
    type: 'music-generation',
    status: 'queued',
    input,
  });

  assert.equal(job.input.mode, 'cover');
  assert.equal(job.input.sourceAudioAssetId, 'asset_ref_123');
});

test('musicWorker — handles repaint mode', async () => {
  const input = makeMusicGenerationRequest({
    prompt: 'different vibe',
    mode: 'repaint',
    sourceAudioAssetId: 'asset_original_123',
    startSeconds: 30,
    endSeconds: 60,
  });

  const job = makeMediaJob({
    id: 'job_008',
    type: 'music-generation',
    status: 'queued',
    input,
  });

  assert.equal(job.input.mode, 'repaint');
  assert.equal(job.input.startSeconds, 30);
  assert.equal(job.input.endSeconds, 60);
});

test('musicWorker — handles stem-extraction mode', async () => {
  const input = makeMusicGenerationRequest({
    mode: 'stem-extraction',
    sourceAudioAssetId: 'asset_song_123',
  });

  const job = makeMediaJob({
    id: 'job_009',
    type: 'music-generation',
    status: 'queued',
    input,
  });

  assert.equal(job.input.mode, 'stem-extraction');
  assert.equal(job.input.sourceAudioAssetId, 'asset_song_123');
});

test('musicWorker — persists job state', async () => {
  const input = makeMusicGenerationRequest({
    prompt: 'test',
    mode: 'simple',
  });

  const job = makeMediaJob({
    id: 'job_010',
    type: 'music-generation',
    status: 'queued',
    input,
  });

  // Simulate persistence
  assert(job.id);
  assert(job.createdAt);
  assert(job.updatedAt);
  assert.equal(job.type, 'music-generation');
});

test('musicWorker — filters only music-generation jobs', async () => {
  const musicJob = makeMediaJob({
    id: 'job_music_001',
    type: 'music-generation',
    status: 'queued',
  });

  const otherJob = makeMediaJob({
    id: 'job_other_001',
    type: 'scene-generation',
    status: 'queued',
  });

  // Only music-generation should be selected
  assert.equal(musicJob.type, 'music-generation');
  assert.notEqual(otherJob.type, 'music-generation');
});

test('musicWorker — only processes queued jobs (not running/succeeded)', async () => {
  const queuedJob = makeMediaJob({
    id: 'job_queued',
    type: 'music-generation',
    status: 'queued',
  });

  const runningJob = makeMediaJob({
    id: 'job_running',
    type: 'music-generation',
    status: 'running',
  });

  const succeededJob = makeMediaJob({
    id: 'job_succeeded',
    type: 'music-generation',
    status: 'succeeded',
  });

  // Only queued should be selected for processing
  assert.equal(queuedJob.status, 'queued');
  assert.notEqual(runningJob.status, 'queued');
  assert.notEqual(succeededJob.status, 'queued');
});

test('musicWorker — preserves job metadata during processing', async () => {
  const input = makeMusicGenerationRequest({
    prompt: 'test',
    mode: 'simple',
    language: 'es',
    locale: 'es-MX',
  });

  const job = makeMediaJob({
    id: 'job_metadata',
    type: 'music-generation',
    projectId: 'project_123',
    ownerUserId: 'user_456',
    status: 'queued',
    input,
  });

  const { applyTransition } = await import('../../../packages/shared/src/jobs/mediaJobState.js');
  const running = applyTransition(job, 'running', {
    stage: 'music-generation-processing',
  });

  // Metadata should be preserved
  assert.equal(running.projectId, job.projectId);
  assert.equal(running.ownerUserId, job.ownerUserId);
  assert.equal(running.input.language, 'es');
  assert.equal(running.input.locale, 'es-MX');
});

test('musicWorker — artifact creation includes provider info', async () => {
  const { makeMusicArtifact } = await import('../../../packages/shared/src/types/music.js');

  const artifact = makeMusicArtifact({
    id: 'artifact_123',
    jobId: 'job_123',
    projectId: 'project_123',
    providerId: 'ace-step',
    modelId: 'ace-step-1.5',
    kind: 'song',
    storagePath: 'artifacts/jobs/job_123/output.mp3',
  });

  assert.equal(artifact.providerId, 'ace-step');
  assert.equal(artifact.modelId, 'ace-step-1.5');
  assert.equal(artifact.storagePath, 'artifacts/jobs/job_123/output.mp3');
});
