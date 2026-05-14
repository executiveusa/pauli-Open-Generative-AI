'use client';
/**
 * More-of-Less frontend API client.
 * ALL calls go to our backend — never directly to providers.
 * No provider secrets are stored or sent from the browser.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

async function req(method, path, body = null, extraHeaders = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message ?? `API error ${res.status}`;
    throw Object.assign(new Error(msg), { code: data?.error?.code, status: res.status });
  }
  return data;
}

// ── Projects ─────────────────────────────────────────────────────────────────
export const createProject  = (name, opts = {}) => req('POST', '/v1/projects', { name, ...opts });
export const listProjects   = () => req('GET', '/v1/projects');
export const getProject     = id => req('GET', `/v1/projects/${id}`);

// ── Assets ───────────────────────────────────────────────────────────────────
export async function uploadAsset(projectId, file) {
  const res = await fetch(`${BASE}/v1/assets/upload`, {
    method: 'POST',
    headers: {
      'x-project-id': projectId,
      'x-filename': file.name,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? 'Upload failed');
  return data;
}
export const getAsset           = id => req('GET', `/v1/assets/${id}`);
export const listProjectAssets  = id => req('GET', `/v1/projects/${id}/assets`);

// ── Characters ───────────────────────────────────────────────────────────────
export const createCharacter  = body => req('POST', '/v1/characters', body);
export const getCharacter     = id   => req('GET', `/v1/characters/${id}`);
export const patchCharacter   = (id, body) => req('PATCH', `/v1/characters/${id}`, body);
export const listProjectChars = id => req('GET', `/v1/projects/${id}/characters`);

// ── Jobs ─────────────────────────────────────────────────────────────────────
export const createMusicVideoJob = body => req('POST', '/v1/jobs/music-video', body);
export const createVisualizerJob = body => req('POST', '/v1/jobs/visualizer',  body);
export const createMixMasterJob  = body => req('POST', '/v1/jobs/mix-master',  body);
export const createAutotuneJob   = body => req('POST', '/v1/jobs/autotune',    body);
export const generateScenes      = id   => req('POST', `/v1/jobs/music-video/${id}/generate-scenes`, {});
export const renderVideo         = id   => req('POST', `/v1/jobs/music-video/${id}/render`, {});
export const getJob              = id   => req('GET',  `/v1/jobs/${id}`);
export const cancelJob           = id   => req('POST', `/v1/jobs/${id}/cancel`, {});
export const remakeJob           = (id, body) => req('POST', `/v1/jobs/${id}/remake`, body);

// ── Providers ─────────────────────────────────────────────────────────────────
export const listProviders = () => req('GET', '/v1/providers');

// ── Health ────────────────────────────────────────────────────────────────────
export const healthCheck = () => req('GET', '/health');

/**
 * Subscribe to SSE job events. Returns an unsubscribe function.
 * @param {string} jobId
 * @param {(event: { type: string, data: object }) => void} onEvent
 * @returns {() => void} unsubscribe
 */
export function subscribeJobEvents(jobId, onEvent) {
  const source = new EventSource(`${BASE}/v1/jobs/${jobId}/events`);
  const safeParse = raw => { try { return JSON.parse(raw); } catch { return null; } };
  source.addEventListener('status', e => {
    const data = safeParse(e.data);
    if (data) onEvent({ type: 'status', data });
    else onEvent({ type: 'error', data: { message: 'Invalid SSE payload' } });
  });
  source.addEventListener('done', e => {
    const data = safeParse(e.data);
    if (data) onEvent({ type: 'done', data });
    else onEvent({ type: 'error', data: { message: 'Invalid SSE payload' } });
  });
  source.onerror = () => onEvent({ type: 'error', data: { message: 'SSE connection error' } });
  return () => source.close();
}
