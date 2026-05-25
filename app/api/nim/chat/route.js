/**
 * POST /api/nim/chat
 * Direct NIM proxy chat — no auth required for quick testing.
 * For production use, wrap with withTenantContext.
 *
 * Body: { message: string, systemPrompt?: string, maxTokens?: number, temperature?: number }
 * Response: { reply: string, model: string, latencyMs: number }
 */

import { NextResponse } from 'next/server';
import { nimChat, getNimConfig } from '@/lib/nvidia-nim.js';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { message, systemPrompt, maxTokens, temperature } = body ?? {};

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const { model } = getNimConfig();
  const start = Date.now();

  try {
    const reply = await nimChat(
      [{ role: 'user', content: message }],
      { systemPrompt, maxTokens, temperature }
    );

    return NextResponse.json({
      reply,
      model,
      latencyMs: Date.now() - start,
    });
  } catch (err) {
    const status = err.status ?? 500;
    return NextResponse.json(
      { error: err.code ?? 'nim_error', message: err.message },
      { status: status === 429 ? 429 : 500 }
    );
  }
}

// GET for simple browser test
export async function GET() {
  const { model, baseUrl } = getNimConfig();
  return NextResponse.json({
    endpoint: 'POST /api/nim/chat',
    model,
    baseUrl,
    usage: { body: '{ "message": "your prompt here", "systemPrompt": "(optional)" }' },
  });
}
