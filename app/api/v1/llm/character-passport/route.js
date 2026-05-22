/**
 * POST /api/v1/llm/character-passport
 * Body: { description: string, genre?: string, mood?: string }
 * Returns: character passport JSON (cached after first call)
 */
import { NextResponse } from 'next/server';
import { generateCharacterPassport } from '@/lib/llm/index.js';

export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const { description, genre, mood } = body;
  if (!description?.trim()) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }

  try {
    const passport = await generateCharacterPassport({ description, genre, mood });
    return NextResponse.json({ passport, provider: 'nim', free: true });
  } catch (err) {
    console.error('[character-passport]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
