/**
 * lib/nvidia-nim.js
 * Thin OpenAI-SDK wrapper for the NVIDIA NIM proxy.
 *
 * Env vars (all optional — fall back to hardcoded proxy values):
 *   NVIDIA_NIM_BASE_URL   or  NVIDIA_NIM_PROXY_BASE_URL
 *   NVIDIA_NIM_API_KEY    or  NVIDIA_NIM_PROXY_API_KEY
 *   NVIDIA_NIM_MODEL      or  NVIDIA_NIM_PROXY_MODEL
 *   NVIDIA_NIM_RPM        or  NVIDIA_NIM_PROXY_RPM
 *   NVIDIA_NIM_TIMEOUT_MS or  NVIDIA_NIM_PROXY_TIMEOUT_MS
 */

import OpenAI from 'openai';

// ─── Config resolution (checked at call time, never at import) ──────────────

function cfg() {
  const baseUrl =
    process.env.NVIDIA_NIM_BASE_URL ??
    process.env.NVIDIA_NIM_PROXY_BASE_URL ??
    'http://31.220.58.212:8082';

  const apiKey =
    process.env.NVIDIA_NIM_API_KEY ??
    process.env.NVIDIA_NIM_PROXY_API_KEY ??
    'dummy';

  const model =
    process.env.NVIDIA_NIM_MODEL ??
    process.env.NVIDIA_NIM_PROXY_MODEL ??
    'moonshotai/kimi-k2-thinking';

  const rpm = parseInt(
    process.env.NVIDIA_NIM_RPM ?? process.env.NVIDIA_NIM_PROXY_RPM ?? '40',
    10
  );

  const timeoutMs = parseInt(
    process.env.NVIDIA_NIM_TIMEOUT_MS ??
    process.env.NVIDIA_NIM_PROXY_TIMEOUT_MS ??
    '120000',
    10
  );

  return { baseUrl, apiKey, model, rpm, timeoutMs };
}

// ─── RPM token bucket ───────────────────────────────────────────────────────

let _tokens = null;
let _windowStart = 0;

function consumeToken() {
  const { rpm } = cfg();
  const now = Date.now();
  if (now - _windowStart > 60_000) {
    _tokens = rpm;
    _windowStart = now;
  }
  if (_tokens <= 0) {
    const waitSec = Math.ceil((60_000 - (now - _windowStart)) / 1000);
    const err = new Error(`NIM rate limit — retry in ${waitSec}s`);
    err.code = 'rate_limited';
    err.status = 429;
    throw err;
  }
  _tokens -= 1;
}

// ─── nimChat ────────────────────────────────────────────────────────────────

/**
 * Send a chat completion request to the NIM proxy.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ model?: string, maxTokens?: number, temperature?: number, systemPrompt?: string }} opts
 * @returns {Promise<string>} assistant message content
 */
export async function nimChat(messages, opts = {}) {
  const { baseUrl, apiKey, model, timeoutMs } = cfg();

  consumeToken();

  const client = new OpenAI({
    baseURL: baseUrl,
    apiKey,
    timeout: timeoutMs,
    defaultHeaders: { 'User-Agent': 'cynthia-studio/1.0' },
  });

  const payload = {
    model: opts.model ?? model,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.7,
    messages: opts.systemPrompt
      ? [{ role: 'system', content: opts.systemPrompt }, ...messages]
      : messages,
  };

  const attempt = async () => client.chat.completions.create(payload);

  let res;
  try {
    res = await attempt();
  } catch (err) {
    if (err?.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      res = await attempt();
    } else {
      throw err;
    }
  }

  return res.choices[0]?.message?.content ?? '';
}

/**
 * Quick health check — returns { ok, latencyMs, model } or { ok: false, error }.
 */
export async function nimHealth() {
  const { model } = cfg();
  const start = Date.now();
  try {
    const reply = await nimChat(
      [{ role: 'user', content: 'Reply with only the word CONNECTED' }],
      { maxTokens: 10 }
    );
    return { ok: reply.includes('CONNECTED'), latencyMs: Date.now() - start, model, reply };
  } catch (err) {
    return { ok: false, error: err.message, model };
  }
}

export { cfg as getNimConfig };
