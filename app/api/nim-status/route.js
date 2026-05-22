/**
 * GET /api/nim-status
 * Returns health status of the free NVIDIA NIM proxy.
 * Used by the FREE MODE badge in the UI.
 */
import { NextResponse } from 'next/server';
import { nimHealthCheck } from '@/lib/llm/index.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseURL = process.env.OPENAI_BASE_URL || 'http://31.220.58.212:8082';
  const model = process.env.OPENAI_MODEL || 'moonshotai/kimi-k2-thinking';

  const healthy = await nimHealthCheck();

  return NextResponse.json({
    status: healthy ? 'ok' : 'unreachable',
    provider: 'NVIDIA NIM',
    baseURL,
    model,
    costPerCall: 0,
    rateLimit: '40 req/min',
    free: true,
  }, { status: healthy ? 200 : 503 });
}
