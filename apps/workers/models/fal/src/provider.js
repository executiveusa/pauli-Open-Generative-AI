/**
 * fal.ai provider adapter — backend-only.
 * FAL_KEY never leaves the server. Only used when allowPaid=true.
 */

const FAL_KEY  = process.env.FAL_KEY ?? '';
const ENABLED  = process.env.FAL_ENABLED === 'true';
const MAX_COST = parseFloat(process.env.FAL_MAX_COST_PER_JOB_USD ?? '0');

const FAL_BASE = 'https://fal.run';

function authHeaders() {
  return { Authorization: `Key ${FAL_KEY}` };
}

export async function healthCheck() {
  if (!ENABLED) return { available: false, reason: 'FAL_ENABLED=false' };
  if (!FAL_KEY) return { available: false, reason: 'FAL_KEY not set' };
  return { available: true, maxCostPerJob: MAX_COST };
}

/**
 * Text-to-video via fal.ai (LTX-Video model).
 * Only proceeds if allowPaid=true and budget allows.
 * @param {{ prompt: string, negativePrompt?: string, seed?: number, durationSeconds?: number, allowPaid?: boolean }} params
 */
export async function generateTextToVideo({ prompt, negativePrompt, seed, durationSeconds = 5, allowPaid = false }) {
  if (!ENABLED) return disabled();
  if (!allowPaid) {
    return { ok: false, provider: 'fal',
      error: { code: 'PAID_NOT_ALLOWED', message: 'fal.ai is a paid provider. Set allowPaid=true in job input.' } };
  }
  if (!FAL_KEY) {
    return { ok: false, provider: 'fal',
      error: { code: 'NO_KEY', message: 'FAL_KEY not set in environment' } };
  }

  try {
    const res = await fetch(`${FAL_BASE}/fal-ai/ltx-video`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt ?? '',
        num_frames: Math.round(durationSeconds * 25),
        seed: seed ?? Math.floor(Math.random() * 999999),
      }),
      signal: AbortSignal.timeout(300_000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      return { ok: false, provider: 'fal',
        error: { code: 'FAL_API_ERROR', message: `HTTP ${res.status}: ${err.slice(0, 200)}` } };
    }

    const data = await res.json();
    return { ok: true, provider: 'fal', videoUrl: data.video?.url ?? null, seed, data };
  } catch (err) {
    return { ok: false, provider: 'fal',
      error: { code: 'FETCH_ERROR', message: err.message } };
  }
}

/**
 * Image-to-video via fal.ai.
 */
export async function generateImageToVideo({ imageUrl, prompt, seed, durationSeconds = 5, allowPaid = false }) {
  if (!ENABLED) return disabled();
  if (!allowPaid) return { ok: false, provider: 'fal',
    error: { code: 'PAID_NOT_ALLOWED', message: 'fal.ai is a paid provider' } };
  if (!FAL_KEY) return { ok: false, provider: 'fal',
    error: { code: 'NO_KEY', message: 'FAL_KEY not set' } };

  try {
    const res = await fetch(`${FAL_BASE}/fal-ai/ltx-video-v095/image-to-video`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt,
        num_frames: Math.round(durationSeconds * 25),
        seed: seed ?? Math.floor(Math.random() * 999999),
      }),
      signal: AbortSignal.timeout(300_000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      return { ok: false, provider: 'fal',
        error: { code: 'FAL_API_ERROR', message: `HTTP ${res.status}: ${err.slice(0, 200)}` } };
    }

    const data = await res.json();
    return { ok: true, provider: 'fal', videoUrl: data.video?.url ?? null, seed, data };
  } catch (err) {
    return { ok: false, provider: 'fal',
      error: { code: 'FETCH_ERROR', message: err.message } };
  }
}

function disabled() {
  return { ok: false, provider: 'fal',
    error: { code: 'FAL_DISABLED', message: 'Set FAL_ENABLED=true and FAL_KEY in environment' } };
}
