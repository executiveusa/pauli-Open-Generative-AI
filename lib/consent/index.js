/**
 * Consent checking module for Cynthia Studio.
 * Enforces rights and consent validation for character generation.
 */

/**
 * Check consent for content generation
 * @param {object} character - Character object with consent properties
 * @returns {object} {blocked: boolean, blockerCode?: string, message?: string}
 */
export function checkConsentForGeneration(character) {
  if (!character) {
    return {
      blocked: false,
      message: 'No character provided',
    };
  }

  // Block if character is marked as minor
  if (character.safetyFlags?.isMinor) {
    return {
      blocked: true,
      blockerCode: 'minor_character',
      message: 'Generation blocked: Character is marked as a minor. Additional protections apply.',
    };
  }

  // Block if identity consent is revoked
  if (character.rights?.identityConsent === 'revoked') {
    return {
      blocked: true,
      blockerCode: 'consent_revoked',
      message: 'Generation blocked: Identity consent has been revoked.',
    };
  }

  // Warn if consent is expired
  if (character.rights?.consentExpiresAt) {
    const expiresAt = new Date(character.rights.consentExpiresAt);
    if (expiresAt < new Date()) {
      return {
        blocked: true,
        blockerCode: 'consent_expired',
        message: `Generation blocked: Consent expired on ${expiresAt.toLocaleDateString()}`,
      };
    }
  }

  // Block if political figure with commercial restrictions
  if (character.safetyFlags?.isPoliticalFigure && character.rights?.commercialLicense === false) {
    return {
      blocked: true,
      blockerCode: 'political_figure_commercial',
      message: 'Generation blocked: Political figures cannot be used commercially without explicit consent.',
    };
  }

  // Warn if consent is pending
  if (character.rights?.identityConsent === 'pending') {
    return {
      blocked: true,
      blockerCode: 'consent_pending',
      message: 'Generation blocked: Identity consent is pending. Please obtain consent before generating.',
    };
  }

  return {
    blocked: false,
    message: 'Consent granted for generation',
  };
}

/**
 * Check consent for voice cloning / lip sync generation
 * @param {object} character - Character object with voice consent properties
 * @returns {object} {blocked: boolean, blockerCode?: string, message?: string}
 */
export function checkConsentForLipSync(character) {
  if (!character) {
    return {
      blocked: false,
      message: 'No character provided',
    };
  }

  // Block if character is marked as minor
  if (character.safetyFlags?.isMinor) {
    return {
      blocked: true,
      blockerCode: 'minor_character',
      message: 'Voice cloning blocked: Character is marked as a minor.',
    };
  }

  // Block if voice consent is not granted
  if (character.rights?.voiceConsent !== 'granted') {
    return {
      blocked: true,
      blockerCode: 'voice_consent_required',
      message: 'Voice cloning blocked: Explicit voice consent is required.',
    };
  }

  // Block if voice cloning is explicitly disallowed
  if (character.rights?.voiceCloningAllowed === false) {
    return {
      blocked: true,
      blockerCode: 'voice_cloning_not_allowed',
      message: 'Voice cloning blocked: Character consent does not allow voice cloning.',
    };
  }

  // Warn if consent is expired
  if (character.rights?.consentExpiresAt) {
    const expiresAt = new Date(character.rights.consentExpiresAt);
    if (expiresAt < new Date()) {
      return {
        blocked: true,
        blockerCode: 'consent_expired',
        message: `Voice cloning blocked: Consent expired on ${expiresAt.toLocaleDateString()}`,
      };
    }
  }

  return {
    blocked: false,
    message: 'Consent granted for voice cloning',
  };
}

/**
 * Check consent for commercial use
 * @param {object} character - Character object with commercial license
 * @returns {object} {blocked: boolean, blockerCode?: string, message?: string}
 */
export function checkConsentForCommercialUse(character) {
  if (!character) {
    return {
      blocked: false,
      message: 'No character provided',
    };
  }

  // Block if commercial license is explicitly false
  if (character.rights?.commercialLicense === false) {
    return {
      blocked: true,
      blockerCode: 'commercial_license_denied',
      message: 'Commercial use blocked: Character does not have commercial license.',
    };
  }

  // Block for political figures without explicit commercial consent
  if (character.safetyFlags?.isPoliticalFigure && character.rights?.commercialLicense !== true) {
    return {
      blocked: true,
      blockerCode: 'political_figure_commercial',
      message: 'Commercial use blocked: Political figures require explicit commercial consent.',
    };
  }

  return {
    blocked: false,
    message: 'Consent granted for commercial use',
  };
}

/**
 * Check consent for training data use
 * @param {object} character - Character object
 * @returns {object} {blocked: boolean, blockerCode?: string, message?: string}
 */
export function checkConsentForTraining(character) {
  if (!character) {
    return {
      blocked: false,
      message: 'No character provided',
    };
  }

  // Block if character is marked as minor
  if (character.safetyFlags?.isMinor) {
    return {
      blocked: true,
      blockerCode: 'minor_character',
      message: 'Training use blocked: Character is marked as a minor.',
    };
  }

  // Block if training is explicitly disallowed
  if (character.rights?.trainingAllowed === false) {
    return {
      blocked: true,
      blockerCode: 'training_not_allowed',
      message: 'Training use blocked: Character consent does not allow training data use.',
    };
  }

  return {
    blocked: false,
    message: 'Consent granted for training data use',
  };
}

/**
 * Get comprehensive consent status for a character
 * @param {object} character - Character object
 * @returns {object} Detailed consent status object
 */
export function getConsentStatus(character) {
  return {
    generation: checkConsentForGeneration(character),
    lipSync: checkConsentForLipSync(character),
    commercial: checkConsentForCommercialUse(character),
    training: checkConsentForTraining(character),
    character: character?.publicName || 'Unknown',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate if a character can proceed with a specific task
 * @param {object} character - Character object
 * @param {string} taskType - Task type (generation, lipSync, commercial, training)
 * @returns {boolean} True if task is allowed
 */
export function isTaskAllowed(character, taskType) {
  switch (taskType) {
    case 'generation':
      return !checkConsentForGeneration(character).blocked;
    case 'lipSync':
      return !checkConsentForLipSync(character).blocked;
    case 'commercial':
      return !checkConsentForCommercialUse(character).blocked;
    case 'training':
      return !checkConsentForTraining(character).blocked;
    default:
      return false;
  }
}

export default {
  checkConsentForGeneration,
  checkConsentForLipSync,
  checkConsentForCommercialUse,
  checkConsentForTraining,
  getConsentStatus,
  isTaskAllowed,
};
