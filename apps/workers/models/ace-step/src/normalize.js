/**
 * Response normalization and error handling for ACE-Step Gradio API
 */

/**
 * Redact sensitive strings from error messages
 * @param {string} text Text to redact
 * @returns {string} Text with secrets redacted
 */
export function redactSecrets(text) {
  if (!text || typeof text !== 'string') return text;

  return text
    // Redact API keys (common patterns)
    .replace(/nvapi-[a-zA-Z0-9-]+/g, '[REDACTED]')
    .replace(/sk-[a-zA-Z0-9_-]{20,}/g, '[REDACTED]')
    .replace(/hf_[a-zA-Z0-9_-]+/g, '[REDACTED]')
    .replace(/fal_[a-zA-Z0-9_-]+/g, '[REDACTED]')
    // Redact URLs to avoid leaking infrastructure
    .replace(/https?:\/\/[a-zA-Z0-9.-]+:?\d*\//g, '[URL]/')
    // Redact file paths
    .replace(/\/tmp\/[a-zA-Z0-9_/.-]+/g, '[FILEPATH]')
    .replace(/C:\\[a-zA-Z0-9_\\.-]+/g, '[FILEPATH]');
}

/**
 * Normalize Gradio API response to MusicArtifact shape
 * @param {object} gradioResponse Response from Gradio API
 * @param {object} request Original request
 * @returns {Promise<object>} Normalized artifact
 */
export async function normalizeArtifact(gradioResponse, request) {
  if (!gradioResponse) {
    throw new Error('No response from Gradio API');
  }

  const durationSeconds = gradioResponse.duration_seconds || gradioResponse.durationSeconds || request.durationSeconds || 60;
  const bpm = gradioResponse.bpm || request.bpm || 120;
  const key = gradioResponse.key || request.key || 'C';

  return {
    id: `artifact_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    kind: request.mode === 'instrumental' ? 'instrumental' : 'song',
    durationSeconds,
    bpm,
    key,
    prompt: request.prompt,
    lyrics: request.lyrics || '',
    storagePath: gradioResponse.audio_path || gradioResponse.outputPath || '',
    providerId: 'ace-step',
    modelId: 'ace-step-1.5',
    rightsStatus: 'generated',
    metadata: {
      provider: 'ace-step',
      model: 'ace-step-1.5',
      mode: request.mode,
      seed: request.seed,
      inferenceSteps: request.inferenceSteps,
      language: request.language,
      locale: request.locale,
      genre: request.genre,
      mood: request.mood,
      isAIGenerated: true,
    },
  };
}

/**
 * Normalize errors for user-facing display
 * @param {Error} error Error object
 * @returns {Error} Normalized error with redacted message
 */
export function normalizeError(error) {
  let userMessage = 'Generation failed';
  const originalMessage = error.message || String(error);

  if (originalMessage.includes('ECONNREFUSED')) {
    userMessage = 'Cannot connect to music generation service. Is ACE-Step running?';
  } else if (originalMessage.includes('timeout') || originalMessage.includes('ETIMEDOUT')) {
    userMessage = 'Music generation took too long. Try a shorter duration or fewer steps.';
  } else if (originalMessage.includes('memory') || originalMessage.includes('OOM')) {
    userMessage = 'Out of memory. Try a shorter duration or lower inference steps.';
  } else if (originalMessage.includes('CUDA') || originalMessage.includes('GPU')) {
    userMessage = 'GPU error. Check that your GPU has sufficient memory.';
  } else if (originalMessage.includes('invalid')) {
    userMessage = 'Invalid request parameters.';
  } else if (originalMessage.includes('permission') || originalMessage.includes('EACCES')) {
    userMessage = 'Permission denied. Check file permissions and storage access.';
  } else if (originalMessage.includes('disk')) {
    userMessage = 'Storage error. Check available disk space.';
  }

  const redacted = redactSecrets(originalMessage);
  const err = new Error(userMessage);
  err.original = redacted;
  err.statusCode = 500;

  return err;
}

/**
 * Validate Gradio API response structure
 * @param {object} response Response to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateResponse(response) {
  const errors = [];

  if (!response || typeof response !== 'object') {
    return { valid: false, errors: ['Response must be an object'] };
  }

  // Must have audio output
  if (!response.audio_path && !response.outputPath) {
    errors.push('Missing audio_path or outputPath in response');
  }

  // Should have duration
  if (!response.duration_seconds && !response.durationSeconds) {
    errors.push('Missing duration information');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if error is retryable
 * @param {Error} error Error to check
 * @returns {boolean}
 */
export function isRetryableError(error) {
  const message = error.message || '';

  // Retryable: timeout, connection, rate limit, server errors
  return (
    message.includes('timeout') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    message.includes('429') || // Rate limit
    message.includes('503') || // Service unavailable
    message.includes('502') || // Bad gateway
    message.includes('500')    // Server error
  );
}

/**
 * Format error for logging (with secrets redacted)
 * @param {Error} error Error to format
 * @returns {object} Formatted error object
 */
export function formatErrorForLogging(error) {
  return {
    message: redactSecrets(error.message || String(error)),
    code: error.code,
    statusCode: error.statusCode,
    retryable: isRetryableError(error),
    timestamp: new Date().toISOString(),
  };
}
