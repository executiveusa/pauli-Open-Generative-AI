export async function runMuapiJob(input, env = process.env) {
  if (env.MUAPI_ENABLED !== 'true') return { ok: false, code: 'muapi_disabled' };
  return { ok: true, provider: 'muapi', endpoint: input.endpoint || 'stub', metadata: { mock: true } };
}
