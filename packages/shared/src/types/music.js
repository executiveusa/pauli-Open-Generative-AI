/**
 * Music domain types for Music Studio.
 * All entities are plain JS objects validated at system boundaries.
 */

import { newId, now } from '../types/core.js';

export const MusicGenerationModes = [
  'simple', 'custom', 'instrumental', 'lyrics', 'cover', 'repaint', 'stem-extraction'
];

export const MusicLanguages = ['en', 'es', 'pt'];

export const MusicLocales = [
  'es-MX', 'es-CO', 'es-AR', 'es-CL', 'es-PE', 'es-US',
  'pt-BR', 'en-US'
];

export const MusicArtifactKinds = [
  'song', 'instrumental', 'vocal', 'stem', 'edited-audio',
  'cover', 'waveform', 'music-video', 'lyrics', 'prompt'
];

export const StemKinds = ['vocals', 'drums', 'bass', 'other'];

export const MusicRightsStatuses = ['owned', 'licensed', 'generated', 'unknown'];

export const RightsIntents = ['original', 'cover', 'remix', 'clone'];

export const VocalStyles = [
  'female_lead', 'male_lead', 'male_backing', 'female_backing',
  'choir', 'acoustic', 'rap', 'spoken'
];

/**
 * @param {object} partial
 * @returns {object} MusicGenerationRequest
 */
export function makeMusicGenerationRequest(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('musicgen'),
    organizationId: partial.organizationId ?? '',
    workspaceId: partial.workspaceId ?? '',
    clientId: partial.clientId ?? '',
    projectId: partial.projectId ?? '',
    createdByUserId: partial.createdByUserId ?? '',

    mode: partial.mode ?? 'simple',
    language: partial.language ?? 'en',
    locale: partial.locale ?? 'en-US',

    title: partial.title ?? 'Untitled',
    prompt: partial.prompt ?? '',
    lyrics: partial.lyrics ?? '',
    genre: partial.genre ?? '',
    mood: partial.mood ?? '',
    styleTags: partial.styleTags ?? [],
    culturalStyle: partial.culturalStyle ?? '',
    instruments: partial.instruments ?? [],

    bpm: partial.bpm ?? 120,
    key: partial.key ?? 'C',
    timeSignature: partial.timeSignature ?? '4/4',
    durationSeconds: partial.durationSeconds ?? 60,
    seed: partial.seed ?? Math.floor(Math.random() * 2147483647),
    inferenceSteps: partial.inferenceSteps ?? 27,
    batchSize: partial.batchSize ?? 1,

    referenceAudioAssetId: partial.referenceAudioAssetId ?? null,
    sourceAudioAssetId: partial.sourceAudioAssetId ?? null,
    repaintRange: partial.repaintRange ?? null,
    vocalStyle: partial.vocalStyle ?? null,

    rightsIntent: partial.rightsIntent ?? 'original',
    providerRoute: partial.providerRoute ?? 'auto',
    freeModeAllowed: partial.freeModeAllowed ?? true,

    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} partial
 * @returns {object} MusicJobInput
 */
export function makeMusicJobInput(partial = {}) {
  return {
    mode: partial.mode ?? 'simple',
    title: partial.title ?? 'Untitled',
    prompt: partial.prompt ?? '',
    lyrics: partial.lyrics ?? '',
    genre: partial.genre ?? '',
    mood: partial.mood ?? '',
    styleTags: partial.styleTags ?? [],
    culturalStyle: partial.culturalStyle ?? '',
    instruments: partial.instruments ?? [],

    bpm: partial.bpm ?? 120,
    key: partial.key ?? 'C',
    timeSignature: partial.timeSignature ?? '4/4',
    durationSeconds: partial.durationSeconds ?? 60,
    seed: partial.seed ?? Math.floor(Math.random() * 2147483647),
    inferenceSteps: partial.inferenceSteps ?? 27,
    language: partial.language ?? 'en',
    locale: partial.locale ?? 'en-US',

    referenceAudioAssetId: partial.referenceAudioAssetId ?? null,
    sourceAudioAssetId: partial.sourceAudioAssetId ?? null,
    repaintRange: partial.repaintRange ?? null,
    vocalStyle: partial.vocalStyle ?? null,

    rightsIntent: partial.rightsIntent ?? 'original',
  };
}

/**
 * @param {object} partial
 * @returns {object} MusicArtifact
 */
export function makeMusicArtifact(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('artifact'),
    organizationId: partial.organizationId ?? '',
    workspaceId: partial.workspaceId ?? '',
    clientId: partial.clientId ?? '',
    projectId: partial.projectId ?? '',
    jobId: partial.jobId ?? '',
    createdByUserId: partial.createdByUserId ?? '',

    kind: partial.kind ?? 'song',
    title: partial.title ?? '',
    durationSeconds: partial.durationSeconds ?? null,
    bpm: partial.bpm ?? null,
    key: partial.key ?? null,
    lyrics: partial.lyrics ?? '',
    prompt: partial.prompt ?? '',

    providerId: partial.providerId ?? '',
    modelId: partial.modelId ?? '',

    storagePath: partial.storagePath ?? '',
    waveformPath: partial.waveformPath ?? '',

    stems: partial.stems ?? [],

    rightsStatus: partial.rightsStatus ?? 'unknown',
    metadata: partial.metadata ?? {},

    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} partial
 * @returns {object} StemArtifact
 */
export function makeStemArtifact(partial = {}) {
  return {
    kind: partial.kind ?? 'vocals',
    storagePath: partial.storagePath ?? '',
    durationSeconds: partial.durationSeconds ?? null,
    metadata: partial.metadata ?? {},
  };
}

/**
 * @param {object} partial
 * @returns {object} MusicRightsRecord
 */
export function makeMusicRightsRecord(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('rights'),
    organizationId: partial.organizationId ?? '',
    projectId: partial.projectId ?? '',
    assetId: partial.assetId ?? '',

    rightsStatus: partial.rightsStatus ?? 'unknown',
    sourceType: partial.sourceType ?? 'original',

    commercialUseAllowed: partial.commercialUseAllowed ?? false,
    referenceUseAllowed: partial.referenceUseAllowed ?? true,
    coverUseAllowed: partial.coverUseAllowed ?? false,

    voiceConsentRequired: partial.voiceConsentRequired ?? false,
    voiceConsentRecordId: partial.voiceConsentRecordId ?? null,

    notes: partial.notes ?? '',
    expiresAt: partial.expiresAt ?? null,

    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} partial
 * @returns {object} MusicProviderCapability
 */
export function makeMusicProviderCapability(partial = {}) {
  return {
    providerId: partial.providerId ?? '',
    modelId: partial.modelId ?? '',
    displayName: partial.displayName ?? '',
    displayNameEs: partial.displayNameEs ?? '',

    modality: partial.modality ?? ['audio/music'],

    supportsTextToMusic: partial.supportsTextToMusic ?? false,
    supportsLyricsToSong: partial.supportsLyricsToSong ?? false,
    supportsInstrumental: partial.supportsInstrumental ?? false,
    supportsReferenceAudio: partial.supportsReferenceAudio ?? false,
    supportsAudioToAudio: partial.supportsAudioToAudio ?? false,
    supportsRepainting: partial.supportsRepainting ?? false,
    supportsStemExtraction: partial.supportsStemExtraction ?? false,

    supportsLocal: partial.supportsLocal ?? false,
    supportsFreeMode: partial.supportsFreeMode ?? false,
    supportsBYOK: partial.supportsBYOK ?? false,

    costTier: partial.costTier ?? 'free',
    speedTier: partial.speedTier ?? 'normal',
    qualityTier: partial.qualityTier ?? 'standard',
    regionAvailability: partial.regionAvailability ?? ['all'],

    maxDurationSeconds: partial.maxDurationSeconds ?? 240,
    defaultInferenceSteps: partial.defaultInferenceSteps ?? 27,

    allowReferenceAudio: partial.allowReferenceAudio ?? true,
    allowAudioCover: partial.allowAudioCover ?? true,
    allowRepainting: partial.allowRepainting ?? true,
    allowVoiceClone: partial.allowVoiceClone ?? false,

    rateLimitPerTenant: partial.rateLimitPerTenant ?? 5,
    timeoutMs: partial.timeoutMs ?? 600000,
    gpuProfile: partial.gpuProfile ?? 'unknown',

    health: partial.health ?? 'unknown',
    lastHealthCheckAt: partial.lastHealthCheckAt ?? null,
  };
}

/**
 * @param {object} partial
 * @returns {object} MusicEvaluationResult
 */
export function makeMusicEvaluationResult(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('eval'),
    artifactId: partial.artifactId ?? '',
    jobId: partial.jobId ?? '',

    promptAdherence: partial.promptAdherence ?? null,
    audioQuality: partial.audioQuality ?? null,
    musicalCoherence: partial.musicalCoherence ?? null,
    culturalAppropriate: partial.culturalAppropriate ?? null,

    flaggedIssues: partial.flaggedIssues ?? [],

    notes: partial.notes ?? '',

    createdAt: partial.createdAt ?? ts,
  };
}
