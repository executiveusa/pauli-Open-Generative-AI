/**
 * Muapi/Open-Generative-AI provider adapter — backend-only.
 * Wraps the existing Muapi capabilities but moves secrets to backend.
 * MUAPI_KEY never leaves the server.
 */

const MUAPI_KEY = process.env.MUAPI_KEY ?? '';
const ENABLED   = process.env.MUAPI_ENABLED === 'true';
const MUAPI_BASE = process.env.MUAPI_BASE_URL ?? 'https://api.muapi.ai';

function authHeaders() {
  return { 'x-api-key': MUAPI_KEY };
}

export async function healthCheck() {
  if (!ENABLED) return { available: false, reason: 'MUAPI_ENABLED=false' };
  if (!MUAPI_KEY) return { available: false, reason: 'MUAPI_KEY not set' };
  try {
    const res = await fetch(`${MUAPI_BASE}/v1/balance`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      return { available: true, balance: data.balance ?? null };
    }
    return { available: false, reason: `HTTP ${res.status}` };
  } catch (e) {
    return { available: false, reason: e.message };
  }
}

/**
 * Text-to-image via Muapi.
 */
export async function textToImage({ modelId, prompt, negativePrompt, seed, width = 1024, height = 1024 }) {
  if (!ENABLED) return disabled();
  if (!MUAPI_KEY) return noKey();

  try {
    const res = await fetch(`${MUAPI_BASE}/v1/image/generate`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId, prompt, negative_prompt: negativePrompt ?? '', seed, width, height }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, provider: 'muapi',
        error: { code: 'MUAPI_ERROR', message: err.message ?? `HTTP ${res.status}` } };
    }
    const data = await res.json();
    return { ok: true, provider: 'muapi', imageUrl: data.url ?? data.image_url, data };
  } catch (err) {
    return { ok: false, provider: 'muapi', error: { code: 'FETCH_ERROR', message: err.message } };
  }
}

/**
 * Text-to-video via Muapi.
 */
export async function textToVideo({ modelId, prompt, negativePrompt, seed, durationSeconds = 5 }) {
  if (!ENABLED) return disabled();
  if (!MUAPI_KEY) return noKey();

  try {
    const res = await fetch(`${MUAPI_BASE}/v1/video/generate`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId, prompt, negative_prompt: negativePrompt ?? '', seed, duration: durationSeconds }),
      signal: AbortSignal.timeout(300_000),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, provider: 'muapi',
        error: { code: 'MUAPI_ERROR', message: err.message ?? `HTTP ${res.status}` } };
    }
    const data = await res.json();
    return { ok: true, provider: 'muapi', videoUrl: data.url ?? data.video_url, data };
  } catch (err) {
    return { ok: false, provider: 'muapi', error: { code: 'FETCH_ERROR', message: err.message } };
  }
}

/**
 * Lip-sync via Muapi.
 */
export async function lipSync({ videoUrl, audioUrl }) {
  if (!ENABLED) return disabled();
  if (!MUAPI_KEY) return noKey();

  try {
    const res = await fetch(`${MUAPI_BASE}/v1/lipsync`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: videoUrl, audio_url: audioUrl }),
      signal: AbortSignal.timeout(300_000),
    });
    if (!res.ok) {
      return { ok: false, provider: 'muapi', error: { code: 'MUAPI_ERROR', message: `HTTP ${res.status}` } };
    }
    const data = await res.json();
    return { ok: true, provider: 'muapi', videoUrl: data.url ?? data.video_url, data };
  } catch (err) {
    return { ok: false, provider: 'muapi', error: { code: 'FETCH_ERROR', message: err.message } };
  }
}

function disabled() {
  return { ok: false, provider: 'muapi',
    error: { code: 'MUAPI_DISABLED', message: 'Set MUAPI_ENABLED=true and MUAPI_KEY in environment' } };
}

function noKey() {
  return { ok: false, provider: 'muapi',
    error: { code: 'NO_KEY', message: 'MUAPI_KEY not set in environment' } };
}
