/**
 * Core domain types for More-of-Less.
 * All entities are plain JS objects validated at system boundaries.
 */

export const MediaJobStatuses = [
  'created', 'queued', 'running', 'waiting_for_provider',
  'stitching', 'succeeded', 'failed', 'cancelled'
];

export const MediaJobTypes = [
  'music-video', 'visualizer', 'mix-master', 'autotune',
  'scene-generation', 'stitch-render'
];

export const AssetKinds = [
  'audio', 'video', 'image', 'subtitle', 'json',
  'model', 'lora', 'other'
];

export const ProvenanceSources = [
  'user-upload', 'generated', 'external-provider', 'stock', 'system'
];

export const RightsStatuses = ['owned', 'licensed', 'unknown', 'generated'];

export const ConsentStatuses = ['owned', 'licensed', 'consented', 'unknown'];

export const ProviderIds = ['local', 'huggingface', 'comfyui', 'fal', 'muapi', 'stub'];

export const Capabilities = [
  'text-to-image', 'image-to-image', 'text-to-video', 'image-to-video',
  'lipsync', 'audio-analysis', 'mix-master', 'autotune', 'visualizer'
];

/** @returns {string} */
export function newId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** @returns {string} ISO timestamp */
export function now() {
  return new Date().toISOString();
}

/**
 * Validates a plain object has all required string keys non-empty.
 * @param {object} obj
 * @param {string[]} required
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validate(obj, required) {
  const errors = [];
  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['value must be an object'] };
  }
  for (const key of required) {
    if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
      errors.push(`missing required field: ${key}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * @param {object} partial
 * @returns {object} Project
 */
export function makeProject(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('project'),
    ownerUserId: partial.ownerUserId ?? '',
    name: partial.name ?? 'Untitled Project',
    brandId: partial.brandId ?? null,
    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} partial
 * @returns {object} Asset
 */
export function makeAsset(partial = {}) {
  return {
    id: partial.id ?? newId('asset'),
    projectId: partial.projectId ?? '',
    ownerUserId: partial.ownerUserId ?? '',
    kind: partial.kind ?? 'other',
    originalFilename: partial.originalFilename ?? '',
    mimeType: partial.mimeType ?? 'application/octet-stream',
    storagePath: partial.storagePath ?? '',
    sha256: partial.sha256 ?? '',
    durationSeconds: partial.durationSeconds ?? null,
    width: partial.width ?? null,
    height: partial.height ?? null,
    createdAt: partial.createdAt ?? now(),
    provenance: {
      source: partial.provenance?.source ?? 'user-upload',
      rightsStatus: partial.provenance?.rightsStatus ?? 'unknown',
      notes: partial.provenance?.notes ?? null,
    },
  };
}

/**
 * @param {object} partial
 * @returns {object} MediaJob
 */
export function makeMediaJob(partial = {}) {
  const ts = now();
  return {
    id: partial.id ?? newId('job'),
    projectId: partial.projectId ?? '',
    ownerUserId: partial.ownerUserId ?? '',
    type: partial.type ?? 'music-video',
    status: partial.status ?? 'created',
    input: partial.input ?? {},
    plan: partial.plan ?? null,
    progress: partial.progress ?? 0,
    stage: partial.stage ?? null,
    message: partial.message ?? null,
    artifacts: partial.artifacts ?? [],
    providerRoute: partial.providerRoute ?? null,
    costEstimate: partial.costEstimate ?? null,
    error: partial.error ?? null,
    createdAt: partial.createdAt ?? ts,
    updatedAt: partial.updatedAt ?? ts,
  };
}

/**
 * @param {object} partial
 * @returns {object} JobArtifact
 */
export function makeJobArtifact(partial = {}) {
  return {
    id: partial.id ?? newId('artifact'),
    jobId: partial.jobId ?? '',
    projectId: partial.projectId ?? '',
    kind: partial.kind ?? 'other',
    filename: partial.filename ?? '',
    storagePath: partial.storagePath ?? '',
    mimeType: partial.mimeType ?? 'application/octet-stream',
    sizeBytes: partial.sizeBytes ?? null,
    metadata: partial.metadata ?? {},
    createdAt: partial.createdAt ?? now(),
  };
}
