/**
 * Validation schemas for music domain.
 * Each schema defines required fields and type constraints.
 */

/**
 * Validates MusicGenerationRequest.
 * @param {object} req
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMusicGenerationRequest(req) {
  const errors = [];

  if (!req || typeof req !== 'object') {
    return { valid: false, errors: ['request must be an object'] };
  }

  // Required fields
  if (!req.projectId) errors.push('projectId is required');
  if (!req.createdByUserId) errors.push('createdByUserId is required');
  if (!req.prompt && req.mode !== 'stem-extraction') {
    errors.push('prompt is required (except for stem-extraction mode)');
  }
  if (!req.mode) errors.push('mode is required');

  // Mode validation
  const validModes = [
    'simple', 'custom', 'instrumental', 'lyrics', 'cover', 'repaint', 'stem-extraction'
  ];
  if (req.mode && !validModes.includes(req.mode)) {
    errors.push(`mode must be one of: ${validModes.join(', ')}`);
  }

  // Language validation
  if (req.language && !['en', 'es', 'pt'].includes(req.language)) {
    errors.push('language must be en, es, or pt');
  }

  // Numeric validations
  if (req.bpm !== undefined && (req.bpm < 30 || req.bpm > 240)) {
    errors.push('bpm must be between 30 and 240');
  }

  if (req.durationSeconds !== undefined && (req.durationSeconds < 5 || req.durationSeconds > 600)) {
    errors.push('durationSeconds must be between 5 and 600');
  }

  if (req.inferenceSteps !== undefined && (req.inferenceSteps < 10 || req.inferenceSteps > 100)) {
    errors.push('inferenceSteps must be between 10 and 100');
  }

  if (req.batchSize !== undefined && (req.batchSize < 1 || req.batchSize > 5)) {
    errors.push('batchSize must be between 1 and 5');
  }

  // RightsIntent validation
  if (req.rightsIntent && !['original', 'cover', 'remix', 'clone'].includes(req.rightsIntent)) {
    errors.push('rightsIntent must be original, cover, remix, or clone');
  }

  // Lyrics requirement for 'lyrics' mode
  if (req.mode === 'lyrics' && !req.lyrics) {
    errors.push('lyrics is required for mode=lyrics');
  }

  // Reference audio requirement for 'cover' or 'repaint'
  if ((req.mode === 'cover' || req.mode === 'repaint') && !req.sourceAudioAssetId) {
    errors.push(`sourceAudioAssetId is required for mode=${req.mode}`);
  }

  // Repaint range validation
  if (req.mode === 'repaint' && req.repaintRange) {
    if (!req.repaintRange.startSec || req.repaintRange.startSec < 0) {
      errors.push('repaintRange.startSec must be >= 0');
    }
    if (!req.repaintRange.endSec || req.repaintRange.endSec <= req.repaintRange.startSec) {
      errors.push('repaintRange.endSec must be > startSec');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates MusicArtifact.
 * @param {object} artifact
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMusicArtifact(artifact) {
  const errors = [];

  if (!artifact || typeof artifact !== 'object') {
    return { valid: false, errors: ['artifact must be an object'] };
  }

  // Required fields
  if (!artifact.id) errors.push('id is required');
  if (!artifact.projectId) errors.push('projectId is required');
  if (!artifact.jobId) errors.push('jobId is required');
  if (!artifact.kind) errors.push('kind is required');

  // Kind validation
  const validKinds = [
    'song', 'instrumental', 'vocal', 'stem', 'edited-audio',
    'cover', 'waveform', 'music-video', 'lyrics', 'prompt'
  ];
  if (artifact.kind && !validKinds.includes(artifact.kind)) {
    errors.push(`kind must be one of: ${validKinds.join(', ')}`);
  }

  // RightsStatus validation
  if (artifact.rightsStatus && !['owned', 'licensed', 'generated', 'unknown'].includes(artifact.rightsStatus)) {
    errors.push('rightsStatus must be owned, licensed, generated, or unknown');
  }

  // Duration validation (if provided)
  if (artifact.durationSeconds !== null && artifact.durationSeconds !== undefined) {
    if (artifact.durationSeconds < 0) {
      errors.push('durationSeconds must be >= 0');
    }
  }

  // Storage path required for audio artifacts
  if (['song', 'instrumental', 'vocal', 'stem', 'edited-audio', 'cover'].includes(artifact.kind)) {
    if (!artifact.storagePath) {
      errors.push('storagePath is required for audio artifacts');
    }
  }

  // Stem validation
  if (artifact.stems && Array.isArray(artifact.stems)) {
    const validStemKinds = ['vocals', 'drums', 'bass', 'other'];
    artifact.stems.forEach((stem, idx) => {
      if (!stem.kind || !validStemKinds.includes(stem.kind)) {
        errors.push(`stems[${idx}].kind must be one of: ${validStemKinds.join(', ')}`);
      }
      if (!stem.storagePath) {
        errors.push(`stems[${idx}].storagePath is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates MusicRightsRecord.
 * @param {object} record
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMusicRightsRecord(record) {
  const errors = [];

  if (!record || typeof record !== 'object') {
    return { valid: false, errors: ['record must be an object'] };
  }

  if (!record.organizationId) errors.push('organizationId is required');
  if (!record.projectId) errors.push('projectId is required');
  if (!record.assetId) errors.push('assetId is required');

  if (record.rightsStatus && !['owned', 'licensed', 'generated', 'unknown'].includes(record.rightsStatus)) {
    errors.push('rightsStatus must be owned, licensed, generated, or unknown');
  }

  if (record.sourceType && !['original', 'user-upload', 'reference', 'licensed'].includes(record.sourceType)) {
    errors.push('sourceType must be original, user-upload, reference, or licensed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates safety constraints for music generation request.
 * Checks for artist imitation, voice cloning, copyrighted songs, etc.
 * @param {object} req
 * @returns {{ safe: boolean, warnings: string[], blocks: string[], suggestions: string[] }}
 */
export function validateMusicSafety(req) {
  const warnings = [];
  const blocks = [];
  const suggestions = [];

  if (!req || !req.prompt) {
    return { safe: true, warnings: [], blocks: [], suggestions: [] };
  }

  const prompt = req.prompt.toLowerCase();

  // Block: Living artist voice imitation
  const artistPatterns = [
    /sound(s?) (like|exactly like|just like)\s+\w+/i,
    /use\s+\w+['s]*\s+voice/i,
    /clone\s+(this\s+)?(singer|vocalist)/i,
    /mimic\s+\w+/i,
    /impersonate\s+\w+/i,
  ];

  for (const pattern of artistPatterns) {
    if (pattern.test(prompt)) {
      blocks.push('Artist imitation detected: voice cloning not allowed');
      suggestions.push('Try: "female vocal lead" or "soulful vocal style" instead');
      break;
    }
  }

  // Block: Living artist "in the style of"
  const livingArtistPattern = /in\s+the\s+style\s+of\s+\w+|style\s+of\s+\w+/i;
  if (livingArtistPattern.test(prompt)) {
    const match = prompt.match(livingArtistPattern);
    if (match) {
      blocks.push(`Style reference to artist detected: "${match[0]}"`);
      suggestions.push('Try: "reggaetón style" or "80s pop aesthetic" instead');
    }
  }

  // Block: Copyrighted song continuation/cover intent
  if (req.rightsIntent === 'cover' || req.rightsIntent === 'clone') {
    if (!req.sourceAudioAssetId) {
      blocks.push('Cover/clone mode requires source audio asset');
      suggestions.push('Upload reference audio or use mode=original');
    }
  }

  // Warn: Unknown source audio for commercial use
  if (req.mode === 'cover' && req.sourceAudioAssetId) {
    warnings.push('Audio cover generated: verify rights before commercial use');
  }

  // Warn: Long duration with voice (potential deepfake concern)
  if (req.durationSeconds > 180 && req.vocalStyle) {
    warnings.push('Long duration with vocal: ensure commercial rights are verified');
  }

  return {
    safe: blocks.length === 0,
    warnings,
    blocks,
    suggestions,
  };
}

/**
 * Validates style tags for LatAm cultural appropriateness.
 * Flags stereotypes or insensitive patterns.
 * @param {string[]} tags
 * @returns {{ appropriate: boolean, issues: string[], suggestions: string[] }}
 */
export function validateStyleTags(tags) {
  const issues = [];
  const suggestions = [];

  if (!Array.isArray(tags)) {
    return { appropriate: true, issues: [], suggestions: [] };
  }

  // Stereotypical tags to warn about
  const stereotypeWarnings = {
    'spicy': 'Avoid stereotypical "spicy" tag; use "energetic" or "percussive"',
    'tropical': 'Be specific: "cumbia", "salsa", "reggaetón"',
    'latin': 'Too vague; specify region: "LatAm", "Caribbean", "Mexican"',
    'exotic': 'Avoid "exotic"; use specific genre names',
  };

  tags.forEach(tag => {
    if (stereotypeWarnings[tag.toLowerCase()]) {
      issues.push(stereotypeWarnings[tag.toLowerCase()]);
      suggestions.push(`Use specific LatAm genre/mood instead`);
    }
  });

  return {
    appropriate: issues.length === 0,
    issues,
    suggestions,
  };
}
