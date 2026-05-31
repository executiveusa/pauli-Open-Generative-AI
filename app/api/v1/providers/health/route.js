/**
 * GET /api/v1/providers/health
 * Returns health status for all configured providers.
 * Never returns raw API keys.
 */

import { NextResponse } from 'next/server';
import { NvidiaNimProxyAdapter } from '@/lib/providers/adapters/NvidiaNimProxyAdapter.js';

const nim = new NvidiaNimProxyAdapter();

export async function GET() {
  const nimEnabled = process.env.NVIDIA_NIM_PROXY_ENABLED === 'true';

  const [nimHealth] = await Promise.allSettled([
    nimEnabled ? nim.health() : Promise.resolve({ ok: false, reason: 'disabled' }),
  ]);

  const providers = [
    {
      id: 'nvidia-nim-proxy',
      displayName: 'NVIDIA NIM Proxy (Free Mode)',
      enabled: nimEnabled,
      health: nimHealth.status === 'fulfilled' ? nimHealth.value : { ok: false, reason: 'error' },
      capabilities: nimEnabled ? ['chat', 'prompt-compile', 'storyboard', 'evaluation'] : [],
      freeMode: true,
    },
    {
      id: 'openai',
      displayName: 'OpenAI',
      enabled: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy',
      health: { ok: null, reason: 'not_tested' },
      capabilities: ['image', 'chat'],
      freeMode: false,
    },
    {
      id: 'fal',
      displayName: 'fal.ai',
      enabled: process.env.FAL_ENABLED === 'true' && !!process.env.FAL_KEY,
      health: { ok: null, reason: 'not_tested' },
      capabilities: ['image', 'video'],
      freeMode: false,
    },
    {
      id: 'muapi',
      displayName: 'Muapi',
      enabled: process.env.MUAPI_ENABLED === 'true' && !!process.env.MUAPI_KEY,
      health: { ok: null, reason: 'not_tested' },
      capabilities: ['image', 'video', 'lipsync'],
      freeMode: false,
    },
    {
      id: 'huggingface',
      displayName: 'Hugging Face',
      enabled: process.env.HF_ENABLED === 'true' && !!process.env.HF_TOKEN,
      health: { ok: null, reason: 'not_tested' },
      capabilities: ['image', 'text'],
      freeMode: false,
    },
    {
      id: 'comfyui',
      displayName: 'ComfyUI (Self-hosted)',
      enabled: process.env.COMFYUI_ENABLED === 'true' && !!process.env.COMFYUI_BASE_URL,
      health: { ok: null, reason: 'not_tested' },
      capabilities: ['image', 'video'],
      freeMode: true,
    },
    {
      id: 'mock',
      displayName: 'Mock (Dev)',
      enabled: process.env.NODE_ENV !== 'production',
      health: { ok: true },
      capabilities: ['image', 'video', 'audio', 'lipsync'],
      freeMode: true,
    },
  ];

  return NextResponse.json({ providers, checkedAt: new Date().toISOString() });
}
