/**
 * GET  /api/v1/providers/free-mode — returns Free Mode status
 * POST /api/v1/providers/free-mode — not applicable (toggle is env-controlled server-side)
 *
 * Free Mode routes prompt generation, storyboard expansion, character review,
 * and eval through the NVIDIA NIM proxy at zero cost (40 RPM limit).
 *
 * Real video rendering still requires a configured video provider
 * (fal, muapi, comfyui, etc.).
 */

import { NextResponse } from 'next/server';
import { NvidiaNimProxyAdapter } from '@/lib/providers/adapters/NvidiaNimProxyAdapter.js';

const nim = new NvidiaNimProxyAdapter();

export async function GET() {
  const enabled = process.env.NVIDIA_NIM_PROXY_ENABLED === 'true';
  const hasConfig = !!(process.env.NVIDIA_NIM_PROXY_BASE_URL && process.env.NVIDIA_NIM_PROXY_API_KEY);

  let capabilities = null;
  if (enabled && hasConfig) {
    try {
      capabilities = await nim.detectCapabilities();
    } catch {
      capabilities = { supportsChat: false, supportsImage: false, supportsVideo: false };
    }
  }

  return NextResponse.json({
    enabled,
    configured: hasConfig,
    model: process.env.NVIDIA_NIM_PROXY_MODEL ?? null,
    rpm: parseInt(process.env.NVIDIA_NIM_PROXY_RPM ?? '40', 10),
    capabilities,
    useCases: enabled
      ? [
          'prompt_generation',
          'prompt_translation',
          'spanish_english_localization',
          'storyboard_expansion',
          'shot_planning',
          'character_consistency_review',
          'safety_eval_review',
          'website_inspection_summaries',
        ]
      : [],
    videoNote: capabilities?.supportsVideo === false
      ? 'This proxy supports text/chat only. Video jobs will be queued as needs_video_provider.'
      : null,
  });
}
