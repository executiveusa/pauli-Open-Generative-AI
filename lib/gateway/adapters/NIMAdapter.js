/**
 * NIM Adapter — Free NVIDIA NIM proxy for chat/text inference.
 * Endpoint: http://31.220.58.212:8082 (OpenAI-compatible, $0, 40 req/min)
 * Used for: scene prompts, lyrics analysis, character passports, scripts.
 */

const DEFAULT_BASE_URL = 'http://31.220.58.212:8082';
const DEFAULT_MODEL = 'moonshotai/kimi-k2-thinking';
const RATE_LIMIT_DELAY_MS = 1600; // 40 req/min = 1 req/1.5s, use 1.6s for safety
const RETRY_DELAY_MS = 3000;

export class NIMAdapter {
  constructor(config = {}) {
    this.baseURL = config.baseURL || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL;
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || 'dummy';
    this.model = config.model || process.env.OPENAI_MODEL || DEFAULT_MODEL;
    this._lastCallAt = 0;
  }

  /** Enforce ≥1.6s between calls to stay under 40 req/min */
  async _rateLimit() {
    const now = Date.now();
    const elapsed = now - this._lastCallAt;
    if (elapsed < RATE_LIMIT_DELAY_MS) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS - elapsed));
    }
    this._lastCallAt = Date.now();
  }

  /**
   * Core chat completions call.
   * @param {Array} messages - OpenAI messages array
   * @param {object} opts - { maxTokens, temperature, model }
   * @returns {Promise<string>} text content
   */
  async chat(messages, opts = {}) {
    await this._rateLimit();

    const body = {
      model: opts.model || this.model,
      messages,
      max_tokens: opts.maxTokens || 1000,
      temperature: opts.temperature ?? 0.7,
    };

    console.log(`[NIM] base_url=${this.baseURL} model=${body.model}`);

    let res;
    try {
      res = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      throw new Error(`NIM connection failed: ${err.message}`);
    }

    // 429 → retry once after RETRY_DELAY_MS
    if (res.status === 429) {
      console.warn('[NIM] rate limited — retrying after 3s');
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      res = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`NIM HTTP ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  /** Health check — returns true if proxy is reachable */
  async isHealthy() {
    try {
      const res = await fetch(`${this.baseURL}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Batch multiple prompts with rate-limit spacing.
   * @param {string[]} prompts - Array of user prompts
   * @param {string} systemPrompt - Shared system prompt
   * @param {object} opts - { maxTokens, temperature }
   * @returns {Promise<string[]>} Array of responses
   */
  async batchChat(prompts, systemPrompt = '', opts = {}) {
    const results = [];
    for (const prompt of prompts) {
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });
      results.push(await this.chat(messages, opts));
    }
    return results;
  }

  // ── Gateway adapter interface ────────────────────────────────────────────

  async generate(params) {
    const messages = [{ role: 'user', content: params.prompt }];
    if (params.systemPrompt) messages.unshift({ role: 'system', content: params.systemPrompt });

    const text = await this.chat(messages, {
      maxTokens: params.maxTokens || 1000,
      temperature: params.temperature,
    });

    return {
      jobId: `nim-${Date.now()}`,
      status: 'succeeded',
      provider: 'nim',
      artifact: { type: 'text', content: text },
      metadata: { model: this.model, provider: 'nim', createdAt: new Date().toISOString() },
    };
  }

  async getJob(jobId) {
    return { jobId, status: 'succeeded', provider: 'nim' };
  }

  async listModels() {
    return [{ id: this.model, name: 'Kimi K2 Thinking (NIM)', type: 'text', capabilities: ['chat', 'generation'], costPer1kTokens: 0 }];
  }

  async testKey() {
    const healthy = await this.isHealthy();
    return healthy
      ? { valid: true, message: 'NIM proxy is reachable and responding' }
      : { valid: false, message: `NIM proxy unreachable at ${this.baseURL}` };
  }

  setConfig(config) {
    if (config.baseURL) this.baseURL = config.baseURL;
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.model) this.model = config.model;
  }
}

export default NIMAdapter;
