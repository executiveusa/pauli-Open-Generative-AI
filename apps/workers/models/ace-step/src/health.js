/**
 * Health check for ACE-Step Gradio API
 * Validates that the Gradio server is running and has the required endpoints
 */

import { getApiInfo } from './client.js';

/**
 * Check if ACE-Step Gradio API is healthy
 * @param {string} apiUrl Base URL of ACE-Step Gradio API
 * @returns {Promise<{healthy: boolean, message: string, lastCheckAt: string}>}
 */
export async function checkHealth(apiUrl) {
  const timestamp = new Date().toISOString();

  if (!apiUrl) {
    return {
      healthy: false,
      message: 'ACESTEP_API_URL not configured',
      lastCheckAt: timestamp,
    };
  }

  try {
    const info = await getApiInfo(apiUrl);

    // Validate that response has expected structure
    if (!info || typeof info !== 'object') {
      return {
        healthy: false,
        message: 'Invalid API response structure',
        lastCheckAt: timestamp,
      };
    }

    return {
      healthy: true,
      message: 'ACE-Step Gradio API is healthy',
      lastCheckAt: timestamp,
      version: info.version ?? 'unknown',
    };
  } catch (error) {
    const message = error.message ?? String(error);
    const friendlyMessage = message.includes('ECONNREFUSED')
      ? 'Cannot connect to ACE-Step Gradio API - is it running?'
      : message.includes('timeout')
        ? 'ACE-Step Gradio API not responding (timeout)'
        : `ACE-Step Gradio API error: ${message.slice(0, 100)}`;

    return {
      healthy: false,
      message: friendlyMessage,
      lastCheckAt: timestamp,
      error: message,
    };
  }
}

/**
 * Get list of capabilities based on Gradio API info
 * @param {string} apiUrl Base URL of ACE-Step Gradio API
 * @returns {Promise<object>} Capabilities object
 */
export async function getCapabilities(apiUrl) {
  const health = await checkHealth(apiUrl);

  return {
    providerId: 'ace-step',
    modelId: 'ace-step-1.5',
    displayName: 'ACE-Step Local Music',
    displayNameEs: 'Música ACE-Step Local',
    healthy: health.healthy,

    supportsTextToMusic: true,
    supportsLyricsToSong: true,
    supportsInstrumental: true,
    supportsReferenceAudio: false, // Placeholder
    supportsAudioToAudio: false, // Placeholder
    supportsRepainting: false, // Placeholder
    supportsStemExtraction: false, // Future
    supportsLocal: true,
    supportsFreeMode: true,

    maxDurationSeconds: 240,
    defaultInferenceSteps: 27,
    allowReferenceAudio: false,
    allowAudioCover: false,
    allowRepainting: false,
    allowVoiceClone: false,

    costTier: 'free',
    speedTier: 'normal', // Depends on GPU
    qualityTier: 'high',
    regionAvailability: ['local'],

    lastHealthCheckAt: health.lastCheckAt,
  };
}
