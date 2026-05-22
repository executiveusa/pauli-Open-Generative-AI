/**
 * POST /api/v1/llm/scene-prompt
 * Body: { section } | { sections }  (single or batch)
 * Returns: { prompt: string } | { prompts: string[] }
 */
import { NextResponse } from 'next/server';
import { generateScenePrompt, generateScenePromptBatch } from '@/lib/llm/index.js';

export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  try {
    if (Array.isArray(body.sections)) {
      const prompts = await generateScenePromptBatch(body.sections);
      return NextResponse.json({ prompts, count: prompts.length, provider: 'nim', free: true });
    }

    if (body.section) {
      const prompt = await generateScenePrompt(body.section);
      return NextResponse.json({ prompt, provider: 'nim', free: true });
    }

    return NextResponse.json({ error: 'section or sections required' }, { status: 400 });
  } catch (err) {
    console.error('[scene-prompt]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
