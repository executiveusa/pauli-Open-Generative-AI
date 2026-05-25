/**
 * ACE-Step Provider Adapter
 * Main adapter for interfacing with ACE-Step Gradio API
 * Supports mock mode for testing without a real Gradio server
 */

import { makeRequest, submitSongGeneration, downloadFile } from './client.js';
import { checkHealth, getCapabilities } from './health.js';
import { normalizeArtifact, normalizeError } from './normalize.js';

/**
 * Create an adapter instance
 * @param {object} config Configuration
 * @returns {object} Adapter with methods
 */
export function createAdapter(config = {}) {
  const {
    apiUrl = process.env.ACESTEP_API_URL || 'http://localhost:7860',
    mockMode = process.env.ACESTEP_MOCK_MODE === 'true',
    timeout = parseInt(process.env.ACESTEP_TIMEOUT_MS ?? '600000'),
  } = config;

  const adapter = {
    apiUrl,
    mockMode,
    timeout,

    /**
     * Check provider health
     */
    async health() {
      return checkHealth(apiUrl);
    },

    /**
     * Get provider capabilities
     */
    async listCapabilities() {
      return getCapabilities(apiUrl);
    },

    /**
     * List available models
     */
    async listModels() {
      if (mockMode) {
        return [
          {
            id: 'ace-step-1.5',
            name: 'ACE-Step 1.5',
            description: 'ACE-Step 1.5 music generation model',
          },
        ];
      }

      const health = await checkHealth(apiUrl);
      if (!health.healthy) {
        throw new Error(`Provider unhealthy: ${health.message}`);
      }

      return [
        {
          id: 'ace-step-1.5',
          name: 'ACE-Step 1.5',
          description: 'ACE-Step 1.5 music generation model',
        },
      ];
    },

    /**
     * Generate a song
     */
    async generateSong(request) {
      if (mockMode) {
        return adapter._generateMock(request, 'song');
      }

      const health = await checkHealth(apiUrl);
      if (!health.healthy) {
        throw new Error(`Provider unhealthy: ${health.message}`);
      }

      try {
        const params = {
          mode: request.mode || 'simple',
          prompt: request.prompt,
          language: request.language || 'en',
          bpm: request.bpm || 120,
          key: request.key || 'C',
          duration_seconds: request.durationSeconds || 60,
          seed: request.seed || 42,
          inference_steps: request.inferenceSteps || 27,
        };

        const jobResponse = await submitSongGeneration(apiUrl, params);
        const jobHash = jobResponse.hash || jobResponse.jobId;

        if (!jobHash) {
          throw new Error('No job hash returned from Gradio API');
        }

        // For mock: return immediately; for real: would poll status
        // This is a simplified version - full implementation would poll status
        return {
          status: 'queued',
          jobHash,
          message: 'Job submitted to ACE-Step',
        };
      } catch (error) {
        throw normalizeError(error);
      }
    },

    /**
     * Generate instrumental track
     */
    async generateInstrumental(request) {
      if (mockMode) {
        return adapter._generateMock(request, 'instrumental');
      }

      return adapter.generateSong({
        ...request,
        mode: 'instrumental',
      });
    },

    /**
     * Generate song with provided lyrics
     */
    async generateWithLyrics(request) {
      if (!request.lyrics) {
        throw new Error('lyrics is required for generateWithLyrics');
      }

      if (mockMode) {
        return adapter._generateMock(request, 'song');
      }

      return adapter.generateSong({
        ...request,
        mode: 'lyrics',
      });
    },

    /**
     * Generate audio cover (reference audio → new style)
     */
    async generateCover(request) {
      if (!request.sourceAudioAssetId) {
        throw new Error('sourceAudioAssetId is required for generateCover');
      }

      if (mockMode) {
        return adapter._generateMock(request, 'cover');
      }

      // Note: Full implementation would download reference audio first
      return adapter.generateSong({
        ...request,
        mode: 'cover',
      });
    },

    /**
     * Repaint section of existing song
     */
    async repaintSection(request) {
      if (mockMode) {
        return adapter._generateMock(request, 'song');
      }

      throw new Error('Repaint mode not yet implemented');
    },

    /**
     * Extract stems from audio (Demucs)
     */
    async extractStems(request) {
      throw new Error('Stem extraction not yet implemented');
    },

    /**
     * Get job status and results
     */
    async getJob(jobHash) {
      if (mockMode) {
        // Simulate job completion
        return {
          status: 'succeeded',
          jobHash,
          outputPath: `/tmp/mock_output_${jobHash}.mp3`,
          durationSeconds: 60,
          metadata: { bpm: 120, key: 'C' },
        };
      }

      throw new Error('Job polling not yet fully implemented');
    },

    /**
     * Cancel a running job
     */
    async cancelJob(jobHash) {
      // Gradio doesn't have a standard cancel endpoint
      // This is a placeholder
      return { status: 'cancelled', jobHash };
    },

    /**
     * Normalize Gradio response to MusicArtifact
     */
    normalizeArtifact,

    /**
     * Normalize errors for user display
     */
    normalizeError,

    /**
     * Mock generation for testing
     */
    async _generateMock(request, kind = 'song') {
      return {
        provider: 'ace-step',
        mode: request.mode || 'simple',
        stub: true,
        durationSeconds: request.durationSeconds || 60,
        bpm: request.bpm || 120,
        key: request.key || 'C',
        outputPath: `/tmp/mock_output_${Date.now()}.mp3`,
        message: 'Mock mode - no real audio generated',
      };
    },
  };

  return adapter;
}

/**
 * Singleton adapter instance
 */
let singletonAdapter = null;

export function getAdapter(config) {
  if (!singletonAdapter) {
    singletonAdapter = createAdapter(config);
  }
  return singletonAdapter;
}

export function resetAdapter() {
  singletonAdapter = null;
}
