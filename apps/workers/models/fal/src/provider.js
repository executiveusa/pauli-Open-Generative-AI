export async function runFalJob(input, env = process.env) {
  if (env.FAL_ENABLED !== 'true') return { ok: false, code: 'fal_disabled' };
  if (!input.allowPaid) return { ok: false, code: 'paid_not_allowed' };
  return { ok: true, provider: 'fal', model: input.modelId || 'stub/fal', metadata: { mock: true } };
}
