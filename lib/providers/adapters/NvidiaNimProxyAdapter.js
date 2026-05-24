/**
 * NVIDIA NIM Proxy Adapter — OpenAI-compatible REST client.
 *
 * Configuration via environment variables ONLY:
 *   NVIDIA_NIM_PROXY_ENABLED
 *   NVIDIA_NIM_PROXY_BASE_URL
 *   NVIDIA_NIM_PROXY_API_KEY
 *   NVIDIA_NIM_PROXY_MODEL
 *   NVIDIA_NIM_PROXY_RPM
 *   NVIDIA_NIM_PROXY_TIMEOUT_MS
 *
 * Never reads these at import time — always reads at call time so
 * the module is safe to import in any context.
 */

const RETRY_DELAY_MS = 2000;
const SECRET_PATTERN =
  /(sk-[A-Za-z0-9_-]+|hf_[A-Za-z0-9]+|fal_[A-Za-z0-9_-]+|nvapi-[A-Za-z0-9_-]+|Bearer\s+[A-Za-z0-9._-]+)/gi;

function redact(s) {
  return String(s ?? '').replace(SECRET_PATTERN, '[REDACTED]');
}

function getConfig() {
  return {
    enabled: process.env.NVIDIA_NIM_PROXY_ENABLED === 'true',
    baseUrl: process.env.NVIDIA_NIM_PROXY_BASE_URL,
    apiKey: process.env.NVIDIA_NIM_PROXY_API_KEY,
    model: process.env.NVIDIA_NIM_PROXY_MODEL ?? 'moonshotai/kimi-k2-thinking',
    rpm: parseInt(process.env.NVIDIA_NIM_PROXY_RPM ?? '40', 10),
    timeoutMs: parseInt(process.env.NVIDIA_NIM_PROXY_TIMEOUT_MS ?? '120000', 10),
  };
}

// Per-process rate limiter (tokens reset each minute)
let _rpmTokens = null;
let _rpmWindowStart = 0;

function checkRateLimit() {
  const cfg = getConfig();
  const now = Date.now();
  if (now - _rpmWindowStart > 60_000) {
    _rpmTokens = cfg.rpm;
    _rpmWindowStart = now;
  }
  if (_rpmTokens <= 0) {
    const waitMs = 60_000 - (now - _rpmWindowStart);
    const err = new Error(`NVIDIA NIM proxy rate limit reached. Retry in ${Math.ceil(waitMs / 1000)}s`);
    err.code = 'rate_limited';
    err.statusCode = 429;
    throw err;
  }
  _rpmTokens -= 1;
}

async function callWithRetry(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }

  // On 429 retry once after 2 seconds
  if (response.status === 429) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), timeoutMs);
    try {
      response = await fetch(url, { ...init, signal: controller2.signal });
    } finally {
      clearTimeout(timer2);
    }
  }

  return response;
}

export class NvidiaNimProxyAdapter {
  get providerId() {
    return 'nvidia-nim-proxy';
  }

  async health() {
    const cfg = getConfig();
    if (!cfg.enabled) return { ok: false, reason: 'disabled' };
    if (!cfg.baseUrl || !cfg.apiKey) return { ok: false, reason: 'missing_config' };

    try {
      const res = await callWithRetry(
        `${cfg.baseUrl}/models`,
        {
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
        cfg.timeoutMs
      );
      return { ok: res.ok, status: res.status };
    } catch (err) {
      return { ok: false, reason: redact(err.message) };
    }
  }

  async listModels() {
    const cfg = getConfig();
    if (!cfg.enabled || !cfg.baseUrl || !cfg.apiKey) return [];

    const res = await callWithRetry(
      `${cfg.baseUrl}/models`,
      {
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
      cfg.timeoutMs
    );

    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []).map((m) => ({ modelId: m.id, displayName: m.id }));
  }

  /**
   * Chat completion — used for prompt compilation, translation, storyboard expansion, evaluation.
   *
   * @param {{ messages: Array<{role,content}>, model?: string, temperature?: number, max_tokens?: number }} params
   * @returns {Promise<{ text: string, usage: object, model: string }>}
   */
  async chat(params) {
    const cfg = getConfig();

    if (!cfg.enabled) {
      throw Object.assign(new Error('NVIDIA NIM proxy is disabled'), { code: 'disabled', statusCode: 503 });
    }
    if (!cfg.baseUrl || !cfg.apiKey) {
      throw Object.assign(
        new Error('NVIDIA NIM proxy not configured (missing NVIDIA_NIM_PROXY_BASE_URL or NVIDIA_NIM_PROXY_API_KEY)'),
        { code: 'missing_config', statusCode: 503 }
      );
    }

    checkRateLimit();

    const body = {
      model: params.model ?? cfg.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 2048,
      stream: false,
    };

    const res = await callWithRetry(
      `${cfg.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      cfg.timeoutMs
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw Object.assign(
        new Error(`NVIDIA NIM proxy error ${res.status}: ${redact(text)}`),
        { code: 'provider_error', statusCode: res.status }
      );
    }

    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      usage: data.usage ?? {},
      model: data.model ?? cfg.model,
    };
  }

  /**
   * Compile/translate a cinematic prompt via the proxy.
   * Used by the prompt harness for Spanish/English bilingual output.
   */
  async compilePrompt({ promptEn, characterAnchor, cameraPreset, motionPreset, style, locale = 'en' }) {
    const systemPrompt = locale === 'es'
      ? `Eres un director de fotografía y escritor de prompts para IA cinematográfica. Genera prompts en inglés técnico para generación de video/imagen, con traducción al español. Sé específico, cinematográfico y consistente con el personaje.`
      : `You are a cinematographer and AI prompt writer for cinematic video/image generation. Generate precise, technical English prompts optimized for AI video generation, with Spanish translation. Be specific, cinematic, and character-consistent.`;

    const userPrompt = [
      characterAnchor ? `Character: ${characterAnchor}` : '',
      cameraPreset ? `Camera: ${cameraPreset}` : '',
      motionPreset ? `Motion: ${motionPreset}` : '',
      style ? `Style: ${style}` : '',
      `Base prompt: ${promptEn}`,
      '',
      'Return JSON: { "promptEn": "...", "promptEs": "...", "negativePrompt": "..." }',
    ].filter(Boolean).join('\n');

    const result = await this.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1024,
    });

    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {
      // fall through to raw text response
    }

    return { promptEn: result.text, promptEs: '', negativePrompt: '' };
  }

  /**
   * Detect proxy capabilities (text-only vs multimodal).
   * Returns { supportsChat, supportsImage, supportsVideo }
   */
  async detectCapabilities() {
    const models = await this.listModels();
    const ids = models.map((m) => m.modelId.toLowerCase());
    return {
      supportsChat: models.length > 0,
      supportsImage: ids.some((id) => id.includes('image') || id.includes('vision')),
      supportsVideo: ids.some((id) => id.includes('video') || id.includes('sora')),
    };
  }

  /**
   * Normalize provider error — never expose raw API keys in output.
   */
  normalizeError(err) {
    return {
      code: err.code ?? 'provider_error',
      message: redact(err.message),
      retryable: err.statusCode === 429 || err.statusCode >= 500,
    };
  }
}

export default NvidiaNimProxyAdapter;
