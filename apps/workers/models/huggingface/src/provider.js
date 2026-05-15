export async function runHfJob(input, env = process.env) {
  if (env.HF_ENABLED !== 'true') return { ok: false, code: 'hf_disabled' };
  return { ok: true, provider: 'huggingface', model: input.modelId || 'stub/hf', metadata: { mock: true } };
}
