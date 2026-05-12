/**
 * ComfyUI bridge — backend-only.
 * Submits workflow JSON to ComfyUI API, injects scene parameters, polls for output.
 */

const COMFY_BASE = process.env.COMFYUI_BASE_URL ?? 'http://localhost:8188';
const ENABLED     = process.env.COMFYUI_ENABLED === 'true';

export async function healthCheck() {
  if (!ENABLED) return { available: false, reason: 'COMFYUI_ENABLED=false' };
  try {
    const res = await fetch(`${COMFY_BASE}/system_stats`, { signal: AbortSignal.timeout(5000) });
    return res.ok ? { available: true } : { available: false, reason: `HTTP ${res.status}` };
  } catch {
    return { available: false, reason: 'ComfyUI unreachable' };
  }
}

/**
 * Submits a workflow to ComfyUI, injects prompt/seed/LoRA, polls until done.
 * @param {{ workflow: object, promptText: string, seed: number, loraConfig?: object[] }} params
 * @returns {Promise<object>}
 */
export async function submitWorkflow({ workflow, promptText, seed, loraConfig = [] }) {
  if (!ENABLED) {
    return { ok: false, provider: 'comfyui',
      error: { code: 'COMFYUI_DISABLED', message: 'Set COMFYUI_ENABLED=true and start ComfyUI' } };
  }

  // Inject prompt into the workflow (node index depends on workflow structure)
  const injectedWorkflow = injectParams(workflow, { promptText, seed, loraConfig });

  try {
    // Queue the prompt
    const queueRes = await fetch(`${COMFY_BASE}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: injectedWorkflow }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!queueRes.ok) {
      return { ok: false, provider: 'comfyui', error: { code: 'QUEUE_FAILED', message: `HTTP ${queueRes.status}` } };
    }
    const { prompt_id: promptId } = await queueRes.json();

    // Poll for completion
    const result = await pollComfyJob(promptId);
    return { ok: true, provider: 'comfyui', promptId, outputs: result.outputs ?? [] };
  } catch (err) {
    return { ok: false, provider: 'comfyui', error: { code: 'FETCH_ERROR', message: err.message } };
  }
}

async function pollComfyJob(promptId, maxAttempts = 120, intervalMs = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    try {
      const res = await fetch(`${COMFY_BASE}/history/${promptId}`, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) continue;
      const history = await res.json();
      if (history[promptId]) return { outputs: Object.values(history[promptId].outputs ?? {}) };
    } catch { /* retry */ }
  }
  return { outputs: [] };
}

function injectParams(workflow, { promptText, seed, loraConfig }) {
  // Deep clone to avoid mutating original
  const w = JSON.parse(JSON.stringify(workflow));
  for (const node of Object.values(w)) {
    if (node.class_type === 'CLIPTextEncode' && node.inputs?.text !== undefined) {
      node.inputs.text = promptText;
    }
    if (node.class_type === 'KSampler' && node.inputs?.seed !== undefined) {
      node.inputs.seed = seed;
    }
  }
  return w;
}
