/**
 * Quality evaluation engine for Cynthia Studio.
 * Evaluates generated artifacts against multiple quality dimensions.
 */

/**
 * Evaluation dimensions for quality assessment.
 * Each dimension has label, description, and scoring range.
 */
export const EVALUATION_DIMENSIONS = [
  {
    id: 'identity_consistency',
    label: 'Identity Consistency',
    labelEs: 'Consistencia de Identidad',
    description: 'How well the generated character maintains facial features and identity across multiple shots',
    descriptionEs: 'Qué tan bien el personaje generado mantiene sus características faciales e identidad en múltiples tomas',
    min: 0,
    max: 1,
    weight: 0.15,
  },
  {
    id: 'wardrobe_consistency',
    label: 'Wardrobe Consistency',
    labelEs: 'Consistencia de Guardarropa',
    description: 'Adherence to the character\'s core wardrobe across scenes',
    descriptionEs: 'Adherencia al guardarropa base del personaje en todas las escenas',
    min: 0,
    max: 1,
    weight: 0.1,
  },
  {
    id: 'location_consistency',
    label: 'Location Consistency',
    labelEs: 'Consistencia de Ubicación',
    description: 'Environmental consistency and logical scene composition',
    descriptionEs: 'Consistencia ambiental y composición lógica de la escena',
    min: 0,
    max: 1,
    weight: 0.1,
  },
  {
    id: 'lighting_coherence',
    label: 'Lighting Coherence',
    labelEs: 'Coherencia de Iluminación',
    description: 'Quality of lighting, shadows, and overall visual coherence',
    descriptionEs: 'Calidad de la iluminación, sombras y coherencia visual general',
    min: 0,
    max: 1,
    weight: 0.1,
  },
  {
    id: 'camera_adherence',
    label: 'Camera Adherence',
    labelEs: 'Adherencia a Cámara',
    description: 'How well the generated shot matches the requested camera preset',
    descriptionEs: 'Qué tan bien la toma generada coincide con el preset de cámara solicitado',
    min: 0,
    max: 1,
    weight: 0.1,
  },
  {
    id: 'motion_quality',
    label: 'Motion Quality',
    labelEs: 'Calidad de Movimiento',
    description: 'Smoothness and naturalness of character motion and gestures',
    descriptionEs: 'Suavidad y naturalidad del movimiento del personaje y gestos',
    min: 0,
    max: 1,
    weight: 0.1,
  },
  {
    id: 'lip_sync_quality',
    label: 'Lip Sync Quality',
    labelEs: 'Calidad de Sincronización de Labios',
    description: 'Accuracy of lip synchronization with audio/dialogue',
    descriptionEs: 'Precisión de la sincronización de labios con audio/diálogo',
    min: 0,
    max: 1,
    weight: 0.1,
  },
  {
    id: 'spanish_localization',
    label: 'Spanish Localization Quality',
    labelEs: 'Calidad de Localización Española',
    description: 'Quality of Spanish dialogue, pronunciation, and cultural appropriateness',
    descriptionEs: 'Calidad del diálogo en español, pronunciación y idoneidad cultural',
    min: 0,
    max: 1,
    weight: 0.1,
  },
  {
    id: 'latam_cultural_fit',
    label: 'LatAm Cultural Fit',
    labelEs: 'Ajuste Cultural LatAm',
    description: 'Relevance and cultural resonance for Latin American audiences',
    descriptionEs: 'Relevancia y resonancia cultural para audiencias latinoamericanas',
    min: 0,
    max: 1,
    weight: 0.08,
  },
  {
    id: 'rights_compliance',
    label: 'Rights Compliance',
    labelEs: 'Cumplimiento de Derechos',
    description: 'Adherence to character rights and consent requirements',
    descriptionEs: 'Cumplimiento de derechos y requisitos de consentimiento del personaje',
    min: 0,
    max: 1,
    weight: 0.07,
  },
];

/**
 * Run rule-based evaluation on generated artifact.
 * Uses predetermined rules and heuristics based on job and artifact metadata.
 * @param {object} job - Job object with parameters and metadata
 * @param {object} artifact - Generated artifact to evaluate
 * @param {object} character - Optional character reference for consistency checks
 * @returns {object} EvaluationResult with scores and summary
 */
export function runRuleBasedEvaluation(job, artifact, character) {
  const scores = {};
  const recommendations = [];

  // Identity consistency: check artifact has face detection indicators
  if (artifact?.metadata?.hasFace) {
    scores.identity_consistency = 0.85 + Math.random() * 0.15;
  } else {
    scores.identity_consistency = 0.4;
    recommendations.push('No face detected in artifact. Ensure character is visible in frame.');
  }

  // Wardrobe consistency: check wardrobe metadata
  if (artifact?.metadata?.wardrobeMatches) {
    scores.wardrobe_consistency = 0.88 + Math.random() * 0.12;
  } else if (character?.wardrobeCore) {
    scores.wardrobe_consistency = 0.65 + Math.random() * 0.25;
  } else {
    scores.wardrobe_consistency = 0.5;
  }

  // Location consistency: check for environmental coherence
  if (artifact?.metadata?.location) {
    scores.location_consistency = 0.80 + Math.random() * 0.2;
  } else {
    scores.location_consistency = 0.6;
    recommendations.push('Specify location for better environmental consistency.');
  }

  // Lighting coherence: based on artifact format and metadata
  if (artifact?.metadata?.lighting) {
    scores.lighting_coherence = 0.82 + Math.random() * 0.18;
  } else {
    scores.lighting_coherence = 0.75 + Math.random() * 0.15;
  }

  // Camera adherence: check camera preset match
  if (job?.params?.camera && artifact?.metadata?.cameraUsed === job.params.camera) {
    scores.camera_adherence = 0.90 + Math.random() * 0.1;
  } else if (job?.params?.camera) {
    scores.camera_adherence = 0.70 + Math.random() * 0.2;
  } else {
    scores.camera_adherence = 0.75;
  }

  // Motion quality: based on video metadata if applicable
  if (artifact?.type === 'video') {
    scores.motion_quality = 0.78 + Math.random() * 0.2;
  } else {
    scores.motion_quality = 0.65; // Static images get lower motion scores
  }

  // Lip sync quality: only applicable to video with audio
  if (artifact?.type === 'video' && job?.params?.audio) {
    scores.lip_sync_quality = 0.75 + Math.random() * 0.2;
  } else if (artifact?.type === 'video') {
    scores.lip_sync_quality = 0.5;
  } else {
    scores.lip_sync_quality = 0.0; // N/A for non-video
  }

  // Spanish localization: check if Spanish prompt was used
  if (job?.params?.language === 'es' || job?.params?.bilingualPrompt?.includes('español')) {
    scores.spanish_localization = 0.82 + Math.random() * 0.18;
  } else {
    scores.spanish_localization = 0.6;
  }

  // LatAm cultural fit: check LatAm-specific parameters
  if (job?.params?.region?.startsWith('es-') || job?.params?.latamOptimized) {
    scores.latam_cultural_fit = 0.80 + Math.random() * 0.2;
  } else {
    scores.latam_cultural_fit = 0.65;
  }

  // Rights compliance: check character consent status
  if (character?.rights?.identityConsent === 'granted') {
    scores.rights_compliance = 0.95;
  } else if (character?.rights?.identityConsent === 'pending') {
    scores.rights_compliance = 0.0;
    recommendations.push('ERROR: Identity consent not granted. Cannot generate content.');
  } else {
    scores.rights_compliance = 0.7;
  }

  // Calculate overall score using weighted average
  let overallScore = 0;
  let totalWeight = 0;
  for (const dim of EVALUATION_DIMENSIONS) {
    if (dim.id in scores) {
      overallScore += scores[dim.id] * dim.weight;
      totalWeight += dim.weight;
    }
  }
  if (totalWeight > 0) {
    overallScore = overallScore / totalWeight;
  }

  // Determine if evaluation passed
  const passed = overallScore >= 0.70;

  return {
    jobId: job?.id,
    evaluationType: 'rule_based',
    timestamp: new Date().toISOString(),
    scores,
    overallScore: Math.round(overallScore * 100) / 100,
    passed,
    recommendations,
    metadata: {
      characterId: character?.id,
      artifactType: artifact?.type,
      provider: artifact?.metadata?.provider,
    },
  };
}

/**
 * Run mock AI-powered evaluation on generated artifact.
 * Simulates AI evaluation with randomized scores and realistic delay.
 * @param {object} job - Job object with parameters
 * @param {object} artifact - Generated artifact to evaluate
 * @returns {Promise<object>} EvaluationResult with scores
 */
export async function runMockAIEvaluation(job, artifact) {
  // Simulate AI processing delay (500ms)
  await new Promise(resolve => setTimeout(resolve, 500));

  const scores = {};

  // Generate randomized scores between 0.6 and 0.95 for each dimension
  for (const dim of EVALUATION_DIMENSIONS) {
    scores[dim.id] = 0.6 + Math.random() * 0.35;
  }

  // Calculate weighted overall score
  let overallScore = 0;
  let totalWeight = 0;
  for (const dim of EVALUATION_DIMENSIONS) {
    overallScore += scores[dim.id] * dim.weight;
    totalWeight += dim.weight;
  }
  overallScore = overallScore / totalWeight;

  const passed = overallScore >= 0.70;

  return {
    jobId: job?.id,
    evaluationType: 'mock_ai',
    timestamp: new Date().toISOString(),
    scores,
    overallScore: Math.round(overallScore * 100) / 100,
    passed,
    recommendations: passed
      ? ['Strong evaluation. Ready for publication.']
      : ['Consider regenerating for higher quality output.'],
    metadata: {
      model: 'mock-evaluation-v1',
      provider: 'mock',
    },
  };
}

/**
 * Get evaluation summary for display
 * @param {object} evaluationResult - Result from evaluation function
 * @returns {object} Formatted summary object
 */
export function getEvaluationSummary(evaluationResult) {
  if (!evaluationResult) {
    return {
      status: 'not_evaluated',
      overallScore: null,
      passed: false,
    };
  }

  return {
    status: evaluationResult.passed ? 'passed' : 'failed',
    overallScore: evaluationResult.overallScore,
    passed: evaluationResult.passed,
    scorePercentage: Math.round(evaluationResult.overallScore * 100),
    recommendationCount: evaluationResult.recommendations?.length || 0,
    evaluationType: evaluationResult.evaluationType,
  };
}

export default {
  EVALUATION_DIMENSIONS,
  runRuleBasedEvaluation,
  runMockAIEvaluation,
  getEvaluationSummary,
};
