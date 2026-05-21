/**
 * lib/jobs/client.js
 * Client-side job management utilities (browser-safe, no fs).
 * All functions call Next.js App Router API routes (/api/v1/jobs/...).
 */

const API_BASE = '/api/v1';

async function apiFetch(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message ?? data?.message ?? `API error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.code = data?.error?.code ?? data?.code;
    throw err;
  }
  return data;
}

/**
 * Create a new job.
 * @param {object} options - {type, projectId?, storyboardId?, shotId?, characterPassportId?,
 *   modelRoute, inputPrompt, inputNegativePrompt, inputSpanishPrompt, inputSpanishNegativePrompt,
 *   parameters, routingMode}
 * @returns {Promise<object>} created job
 */
export async function createJob(options) {
  if (!options || typeof options !== 'object') throw new Error('options must be an object');
  return apiFetch('POST', '/jobs', options);
}

/**
 * Get a single job by ID.
 * @param {string} id
 * @returns {Promise<object>} job
 */
export async function getJob(id) {
  if (!id) throw new Error('id is required');
  return apiFetch('GET', `/jobs/${id}`);
}

/**
 * List jobs with optional filters.
 * @param {{ status?: string, type?: string, limit?: number }} filters
 * @returns {Promise<{ jobs: object[], total: number }>}
 */
export async function listJobs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.limit != null) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return apiFetch('GET', `/jobs${qs ? `?${qs}` : ''}`);
}

/**
 * Update job status (and optionally additional data).
 * @param {string} id
 * @param {string} status
 * @param {object} [data]
 * @returns {Promise<object>} updated job
 */
export async function updateJobStatus(id, status, data = {}) {
  if (!id) throw new Error('id is required');
  if (!status) throw new Error('status is required');
  return apiFetch('PATCH', `/jobs/${id}`, { status, ...data });
}

/**
 * Attach an artifact to a job.
 * @param {string} jobId
 * @param {object} artifact
 * @returns {Promise<object>} artifact
 */
export async function attachArtifact(jobId, artifact) {
  if (!jobId) throw new Error('jobId is required');
  if (!artifact || typeof artifact !== 'object') throw new Error('artifact must be an object');
  return apiFetch('POST', `/jobs/${jobId}/artifacts`, artifact);
}

/**
 * Retry a failed job by creating a new job with the same parameters.
 * @param {string} id
 * @returns {Promise<object>} new job
 */
export async function retryJob(id) {
  if (!id) throw new Error('id is required');
  return apiFetch('POST', `/jobs/${id}/retry`, {});
}

/**
 * Cancel a running or queued job.
 * @param {string} id
 * @returns {Promise<object>} updated job
 */
export async function cancelJob(id) {
  if (!id) throw new Error('id is required');
  return apiFetch('POST', `/jobs/${id}/cancel`, {});
}

/**
 * Compare multiple jobs side by side.
 * @param {string[]} ids - array of job IDs
 * @returns {Promise<object>} comparison result
 */
export async function compareJobs(ids) {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids must be a non-empty array');
  return apiFetch('POST', '/jobs/compare', { jobIds: ids });
}

/**
 * Poll a job until it reaches a terminal state or timeout.
 * @param {string} id
 * @param {(job: object) => void} onUpdate - called with job on each poll
 * @param {number} maxWaitMs - maximum wait time in milliseconds (default 60000)
 * @returns {Promise<object>} final job state
 */
export async function pollJob(id, onUpdate, maxWaitMs = 60000) {
  if (!id) throw new Error('id is required');
  if (typeof onUpdate !== 'function') throw new Error('onUpdate must be a function');

  const TERMINAL = new Set(['succeeded', 'failed', 'cancelled', 'blocked_by_rights', 'blocked_by_safety']);
  const POLL_INTERVAL_MS = 2000;
  const started = Date.now();

  while (true) {
    const job = await getJob(id);
    onUpdate(job);

    if (TERMINAL.has(job.status)) {
      return job;
    }

    const elapsed = Date.now() - started;
    if (elapsed + POLL_INTERVAL_MS >= maxWaitMs) {
      // Return current state without throwing — caller can decide
      return job;
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}
