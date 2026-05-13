/**
 * Hugging Face provider adapter — backend-only.
 * HF_TOKEN never leaves the server.
 */

const HF_TOKEN  = process.env.HF_TOKEN ?? '';
const ENABLED   = process.env.HF_ENABLED === 'true';
const PREFER_FREE = process.env.HF_PREFER_FREE !== 'false';

const HF_INFERENCE_URL = 'https://api-inference.huggingface.co/models';

function authHeaders() {
  return HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {};
}

export async function healthCheck() {
  if (!ENABLED) return { available: false, reason: 'HF_ENABLED=false' };
  if (!HF_TOKEN) return { available: false, reason: 'HF_TOKEN not set' };
  try {
    const res = await fetch('https://huggingface.co/api/whoami', {
      headers: authHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const user = await res.json();
      return { available: true, user: user.name };
    }
    return { available: false, reason: `HTTP ${res.status}` };
  } catch (e) {
    return { available: false, reason: e.message };
  }
}

/**
 * Text-to-image via HF Inference API.
 * @param {{ modelId: string, prompt: string, negativePrompt?: string, seed?: number }} params
 * @returns {Promise<{ ok: boolean, imageBuffer?: Buffer, error?: object }>}
 */
export async function textToImage({ modelId, prompt, negativePrompt, seed }) {
  if (!ENABLED) return disabled();
  if (!HF_TOKEN) return { ok: false, provider: 'huggingface',
    error: { code: 'NO_TOKEN', message: 'HF_TOKEN not set in environment' } };

  try {
    const body = { inputs: prompt };
    if (negativePrompt) body.parameters = { negative_prompt: negativePrompt };
    if (seed !== undefined) body.parameters = { ...(body.parameters ?? {}), seed };

    const res = await fetch(`${HF_INFERENCE_URL}/${modelId}`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      return { ok: false, provider: 'huggingface',
        error: { code: 'HF_API_ERROR', message: `HTTP ${res.status}: ${err.slice(0, 200)}` } };
    }

    const imageBuffer = Buffer.from(await res.arrayBuffer());
    return { ok: true, provider: 'huggingface', imageBuffer, modelId };
  } catch (err) {
    return { ok: false, provider: 'huggingface',
      error: { code: 'FETCH_ERROR', message: err.message } };
  }
}

/**
 * Text classification / embedding (for mood/style analysis).
 */
export async function classify({ modelId, inputs }) {
  if (!ENABLED) return disabled();
  if (!HF_TOKEN) return { ok: false, error: { code: 'NO_TOKEN', message: 'HF_TOKEN not set' } };

  try {
    const res = await fetch(`${HF_INFERENCE_URL}/${modelId}`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { ok: false, error: { code: 'HF_API_ERROR', message: `HTTP ${res.status}` } };
    return { ok: true, provider: 'huggingface', result: await res.json() };
  } catch (err) {
    return { ok: false, error: { code: 'FETCH_ERROR', message: err.message } };
  }
}

function disabled() {
  return { ok: false, provider: 'huggingface',
    error: { code: 'HF_DISABLED', message: 'Set HF_ENABLED=true and HF_TOKEN in environment' } };
}
