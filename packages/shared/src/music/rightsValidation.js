/**
 * Music rights and consent validation system.
 * Enforces legal compliance for generated music and voice synthesis.
 */

export const RIGHTS_STATUSES = {
  OWNED: 'owned',
  LICENSED: 'licensed',
  GENERATED: 'generated',
  UNKNOWN: 'unknown',
};

export const RIGHTS_INTENTS = {
  ORIGINAL: 'original',
  COVER: 'cover',
  REMIX: 'remix',
  CLONE: 'clone',
};

/**
 * Validate music generation request against rights constraints
 */
export function validateMusicRights(request, rightsRecord = null) {
  const violations = [];
  const warnings = [];

  const { mode, rightsIntent, sourceAudioAssetId, vocalStyle } = request;

  // Cover mode requires rights verification
  if (mode === 'cover') {
    if (!sourceAudioAssetId) {
      violations.push({
        field: 'sourceAudioAssetId',
        message: 'Cover mode requires reference audio file',
        severity: 'error',
      });
    }
    if (rightsIntent !== RIGHTS_INTENTS.COVER) {
      warnings.push({
        field: 'rightsIntent',
        message: 'Ensure you have rights to create a cover of the source material',
        severity: 'warning',
      });
    }
  }

  // Repaint/remix modes require licensing
  if (mode === 'repaint' || mode === 'remix') {
    warnings.push({
      field: 'mode',
      message: 'Repaint/remix may require licensing from original artist/label',
      severity: 'warning',
    });
  }

  // Voice style (potential voice clone)
  if (vocalStyle && ['clone', 'impersonation'].some(s => vocalStyle.includes(s))) {
    violations.push({
      field: 'vocalStyle',
      message: 'Voice cloning requires explicit voice consent from subject',
      severity: 'error',
      consentRequired: 'voice_consent',
    });
  }

  // Rights record constraints
  if (rightsRecord) {
    if (!rightsRecord.commercialUseAllowed && isCommercialUse(request)) {
      violations.push({
        field: 'rightsRecord',
        message: 'Commercial use not allowed for this audio',
        severity: 'error',
      });
    }

    if (rightsRecord.voiceConsentRequired && !rightsRecord.voiceConsentRecordId) {
      violations.push({
        field: 'voiceConsent',
        message: 'Voice consent record required but not provided',
        severity: 'error',
      });
    }

    if (rightsRecord.expiresAt && new Date(rightsRecord.expiresAt) < new Date()) {
      violations.push({
        field: 'rightsRecord',
        message: 'Rights have expired',
        severity: 'error',
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    warnings,
    requiresConsent: violations.some(v => v.consentRequired),
  };
}

/**
 * Check if request appears to be for commercial use
 */
function isCommercialUse(request) {
  const { mode, metadata = {} } = request;
  return (
    mode === 'cover' ||
    mode === 'remix' ||
    metadata.commercial === true ||
    metadata.monetized === true
  );
}

/**
 * Get required consent types for a generation request
 */
export function getRequiredConsents(request, rightsRecord = null) {
  const consents = [];

  const { vocalStyle, mode } = request;

  // Voice consent
  if (vocalStyle?.includes('clone') || mode === 'clone') {
    consents.push({
      type: 'voice_consent',
      label: 'Voice Consent',
      description: 'I have permission to clone this voice',
      required: true,
      documentation: 'voice_consent_form.pdf',
    });
  }

  // Commercial use consent
  if (mode === 'cover' || mode === 'remix') {
    consents.push({
      type: 'commercial_consent',
      label: 'Commercial Use Rights',
      description: 'I have rights to use this audio commercially',
      required: true,
      documentation: 'commercial_license.pdf',
    });
  }

  // Artist credit
  if (mode === 'cover') {
    consents.push({
      type: 'artist_credit',
      label: 'Artist Attribution',
      description: 'I will properly credit the original artist',
      required: true,
      documentation: 'attribution_guidelines.pdf',
    });
  }

  // Generated content disclosure
  consents.push({
    type: 'generated_content_disclosure',
    label: 'AI-Generated Disclosure',
    description: 'I will disclose that this music was AI-generated',
    required: false,
    documentation: 'disclosure_guidelines.pdf',
  });

  return consents;
}

/**
 * Validate consent record
 */
export function validateConsent(consent, requiredConsents = []) {
  const required = requiredConsents.find(c => c.type === consent.type);
  if (!required) {
    return { valid: false, error: 'Consent type not recognized' };
  }

  if (required.required && !consent.accepted) {
    return { valid: false, error: `${required.label} is required` };
  }

  if (!consent.acceptedAt) {
    return { valid: false, error: 'Consent must include timestamp' };
  }

  if (consent.acceptedByUserId === undefined) {
    return { valid: false, error: 'Consent must be tracked to user' };
  }

  return { valid: true };
}

/**
 * Build disclosure text for generated music
 */
export function buildDisclosureText(artifact, locale = 'en') {
  const labels = {
    en: {
      generated: 'This music was generated using AI technology.',
      model: 'Generated with',
      date: 'Created on',
      rights: 'Respect original artist rights if this is a cover or remix.',
    },
    es: {
      generated: 'Esta música fue generada usando tecnología de IA.',
      model: 'Generado con',
      date: 'Creado el',
      rights: 'Respeta los derechos del artista original si es un cover o remix.',
    },
  };

  const t = labels[locale] || labels.en;
  const date = new Date(artifact.createdAt).toLocaleDateString();

  return `${t.generated} ${t.model} ${artifact.modelId}. ${t.date} ${date}. ${t.rights}`;
}

/**
 * Check if artifact needs explicit disclosure
 */
export function requiresDisclosure(artifact) {
  return (
    artifact.rightsStatus === RIGHTS_STATUSES.GENERATED ||
    artifact.kind === 'song' ||
    artifact.kind === 'cover'
  );
}

/**
 * Get rights recommendations for usage intent
 */
export function getRightsRecommendations(usageIntent, locale = 'en') {
  const recommendations = {
    en: {
      original: [
        'You own full rights to this AI-generated music',
        'Can be used commercially and shared freely',
        'No artist attribution needed (it\'s AI-generated)',
        'Consider adding AI-generated disclosure for transparency',
      ],
      cover: [
        'Requires license from original artist/label',
        'Must provide artist attribution',
        'Commercial use may be restricted',
        'Get explicit permission before distribution',
      ],
      remix: [
        'Requires derivative rights from original',
        'Must credit the original artist',
        'Commercial use likely restricted',
        'Check original license (Creative Commons, etc.)',
      ],
      clone: [
        'REQUIRES explicit voice consent from subject',
        'May violate publicity/personality rights',
        'Legal restrictions vary by jurisdiction',
        'Consider professional legal review',
      ],
    },
    es: {
      original: [
        'Tienes derechos totales sobre esta música generada por IA',
        'Puede usarse comercialmente y compartirse libremente',
        'No se necesita atribución de artista (es generada por IA)',
        'Considera añadir divulgación de IA para transparencia',
      ],
      cover: [
        'Requiere licencia del artista/sello original',
        'Debe acreditar al artista original',
        'El uso comercial puede ser restringido',
        'Obtén permiso explícito antes de distribuir',
      ],
      remix: [
        'Requiere derechos de derivación del original',
        'Debes acreditar al artista original',
        'El uso comercial probablemente esté restringido',
        'Comprueba la licencia original (Creative Commons, etc.)',
      ],
      clone: [
        'REQUIERE consentimiento explícito de la voz',
        'Puede violar derechos de personalidad/publicidad',
        'Las restricciones legales varían por jurisdicción',
        'Considera una revisión legal profesional',
      ],
    },
  };

  const recs = recommendations[locale] || recommendations.en;
  return recs[usageIntent] || recs.original;
}
