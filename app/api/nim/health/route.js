/**
 * GET /api/nim/health
 * Live health check against the NIM proxy — sends a real request.
 */

import { NextResponse } from 'next/server';
import { nimHealth, getNimConfig } from '@/lib/nvidia-nim.js';

export async function GET() {
  const { baseUrl, model } = getNimConfig();
  const result = await nimHealth();
  return NextResponse.json(
    { ...result, baseUrl, model },
    { status: result.ok ? 200 : 503 }
  );
}
