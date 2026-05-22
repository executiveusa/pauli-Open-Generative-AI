/**
 * POST /api/v1/llm/analyze-lyrics
 * Body: { lyrics: string }
 * Returns: structured lyrics analysis JSON via NIM proxy
 */
import { NextResponse } from 'next/server';
import { analyzeLyrics } from '@/lib/llm/index.js';

export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const { lyrics } = body;
  if (!lyrics?.trim()) {
    return NextResponse.json({ error: 'lyrics is required' }, { status: 400 });
  }

  try {
    const analysis = await analyzeLyrics(lyrics);
    return NextResponse.json({ analysis, provider: 'nim', free: true });
  } catch (err) {
    console.error('[analyze-lyrics]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
