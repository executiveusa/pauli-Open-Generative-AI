/**
 * LTX-Video provider adapter.
 * Calls the LTX worker service (GPU-required, separate Docker container).
 * Falls back to stub when LTX_ENABLED=false.
 */

const LTX_BASE = process.env.LTX_WORKER_BASE_URL ?? 'http://localhost:8101';
const ENABLED   = process.env.LTX_ENABLED === 'true';

/**
 * Health check for LTX worker.
 */
export async function healthCheck() {
  if (!ENABLED) return { available: false, reason: 'LTX_ENABLED=false' };
  try {
    const res = await fetch(`${LTX_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return { available: data.ok === true, version: data.version ?? null };
  } catch {
    return { available: false, reason: 'LTX worker unreachable' };
  }
}

/**
 * Text-to-video via LTX worker.
 * @param {object} params - request body per Phase 8 spec
 */
export async function generateTextToVideo(params) {
  if (!ENABLED) {
    return { ok: false, provider: 'ltx',
      error: { code: 'LTX_DISABLED', message: 'Set LTX_ENABLED=true and start the LTX worker' } };
  }
  try {
    const res = await fetch(`${LTX_BASE}/generate/text-to-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(300_000),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, provider: 'ltx', error: data.error ?? { message: `HTTP ${res.status}` } };
    return { ok: true, provider: 'ltx', ...data };
  } catch (err) {
    return { ok: false, provider: 'ltx', error: { code: 'FETCH_ERROR', message: err.message } };
  }
}

/**
 * Image-to-video via LTX worker.
 */
export async function generateImageToVideo(params) {
  if (!ENABLED) {
    return { ok: false, provider: 'ltx',
      error: { code: 'LTX_DISABLED', message: 'Set LTX_ENABLED=true and start the LTX worker' } };
  }
  try {
    const res = await fetch(`${LTX_BASE}/generate/image-to-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(300_000),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, provider: 'ltx', error: data.error ?? { message: `HTTP ${res.status}` } };
    return { ok: true, provider: 'ltx', ...data };
  } catch (err) {
    return { ok: false, provider: 'ltx', error: { code: 'FETCH_ERROR', message: err.message } };
  }
}

/**
 * Remake a scene via LTX worker.
 */
export async function remakeScene(params) {
  if (!ENABLED) {
    return { ok: false, provider: 'ltx',
      error: { code: 'LTX_DISABLED', message: 'Set LTX_ENABLED=true' } };
  }
  try {
    const res = await fetch(`${LTX_BASE}/generate/remake-scene`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(300_000),
    });
    const data = await res.json();
    return res.ok
      ? { ok: true, provider: 'ltx', ...data }
      : { ok: false, provider: 'ltx', error: data.error ?? { message: `HTTP ${res.status}` } };
  } catch (err) {
    return { ok: false, provider: 'ltx', error: { code: 'FETCH_ERROR', message: err.message } };
  }
}
