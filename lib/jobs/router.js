/**
 * lib/jobs/router.js
 * Resolves which provider+model to use for a GenerationJob.
 * All config is read from env vars at call time — never at import time.
 *
 * Priority: org-level ProviderRoute in DB → env-var defaults → mock
 */

/** Maps a job type to a provider priority list (env-var driven). */
export function resolveProviderChain(jobType) {
  const enabled = [];

  const isImage = ['hero_frame', 'scene', 'storyboard', 'visualizer'].includes(jobType);
  const isVideo = ['video', 'lipsync', 'music_video', 'mix_master'].includes(jobType);
  const isText  = ['prompt_compile', 'evaluation'].includes(jobType);

  if (isImage || isVideo) {
    if (process.env.FAL_API_KEY)    enabled.push('fal');
    if (process.env.MUAPI_API_KEY)  enabled.push('muapi');
    if (process.env.OPENAI_API_KEY) enabled.push('openai');
  }

  if (isText || (!enabled.length && isImage)) {
    if (process.env.NVIDIA_NIM_PROXY_ENABLED === 'true') enabled.push('nvidia_nim');
    if (process.env.OPENAI_API_KEY) enabled.push('openai');
  }

  // Always fall back to mock in non-production
  if (process.env.NODE_ENV !== 'production') enabled.push('mock');

  return enabled;
}

/** Returns the resolved provider config for a job — checks DB route first, then env. */
export async function routeJob(job, db) {
  // Check for org-level route override
  if (db && job.organizationId) {
    try {
      const route = await db.providerRoute.findFirst({
        where: {
          organizationId: job.organizationId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (route?.primaryProvider) {
        return {
          providerId: route.primaryProvider,
          fallbackChain: route.fallbackChain ?? [],
          routeSource: 'db',
        };
      }
    } catch {
      // fall through to env-var routing
    }
  }

  const chain = resolveProviderChain(job.jobType ?? job.type ?? 'scene');
  return {
    providerId: chain[0] ?? 'mock',
    fallbackChain: chain.slice(1),
    routeSource: 'env',
  };
}
