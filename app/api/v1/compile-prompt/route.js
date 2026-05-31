/**
 * POST /api/v1/compile-prompt
 * Compiles cinematic prompts using NVIDIA NIM (kimi-k2-thinking).
 * Falls back to template if NIM is unavailable.
 *
 * Body:
 *   characterPassportId  — character ID or freeform description
 *   locationProfileId    — (optional) location/setting description
 *   aspectRatio          — e.g. "16:9", "1:1", "9:16"
 *   cameraPreset         — e.g. "close-up", "wide-shot", "cinematic"
 *   language             — "es" | "en" (default "es")
 *   promptAnchor         — (optional) additional style/mood text
 *   mode                 — "hero_frame" | "scene" | "storyboard" (default "hero_frame")
 */

import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a cinematic AI prompt engineer for a Latin American music video studio.
Your job is to turn character and scene descriptions into vivid, detailed image generation prompts.
Always respond with valid JSON only — no markdown, no explanation.
Output format:
{
  "englishPrompt": "...",
  "spanishPrompt": "...",
  "providerPrompt": "...",
  "negativePrompt": "...",
  "negativePromptEs": "..."
}
Prompts must be visual, specific, and cinematic. englishPrompt and spanishPrompt should describe the same scene.
providerPrompt is the final optimized English prompt for image generation (include style, lighting, camera angle).
negativePrompt should exclude common artifacts (blurry, low quality, distorted, text, watermark).`;

function templateFallback(characterId, locationId, aspectRatio, cameraPreset, lang) {
  const loc = locationId ? `, ${locationId}` : '';
  return {
    englishPrompt: `Cinematic portrait of character "${characterId}"${loc}, ${cameraPreset} shot, ${aspectRatio} aspect ratio`,
    spanishPrompt: `Retrato cinemático del personaje "${characterId}"${loc}, plano ${cameraPreset}, relación de aspecto ${aspectRatio}`,
    providerPrompt: `Cinematic portrait "${characterId}"${loc}, ${cameraPreset}, ${aspectRatio}, professional lighting, sharp focus, film grain, 4k`,
    negativePrompt: 'blurry, low quality, distorted, text, watermark, deformed',
    negativePromptEs: 'borroso, baja calidad, distorsionado, texto, marca de agua',
    source: 'template',
  };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const {
    characterPassportId,
    locationProfileId,
    aspectRatio,
    cameraPreset,
    language,
    promptAnchor,
    mode = 'hero_frame',
  } = body ?? {};

  if (!characterPassportId) {
    return NextResponse.json({ error: 'validation_error', message: 'characterPassportId is required' }, { status: 400 });
  }
  if (!aspectRatio) {
    return NextResponse.json({ error: 'validation_error', message: 'aspectRatio is required' }, { status: 400 });
  }
  if (!cameraPreset) {
    return NextResponse.json({ error: 'validation_error', message: 'cameraPreset is required' }, { status: 400 });
  }

  const lang = language ?? 'es';
  const fallback = templateFallback(characterPassportId, locationProfileId, aspectRatio, cameraPreset, lang);

  // Try NIM AI compilation
  try {
    const { nimChat } = await import('@/lib/nvidia-nim.js');

    const userMsg = `Generate cinematic image generation prompts for:
- Character: ${characterPassportId}
- Location: ${locationProfileId ?? 'unspecified'}
- Aspect ratio: ${aspectRatio}
- Camera preset: ${cameraPreset}
- Primary language: ${lang === 'es' ? 'Spanish (Latin American)' : 'English'}
- Mode: ${mode}
${promptAnchor ? `- Style anchor: ${promptAnchor}` : ''}

Return JSON only.`;

    const raw = await nimChat(
      [{ role: 'user', content: userMsg }],
      { systemPrompt: SYSTEM_PROMPT, maxTokens: 512, temperature: 0.7 }
    );

    // Extract JSON from response (model may wrap it)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in NIM response');

    const compiled = JSON.parse(jsonMatch[0]);

    return NextResponse.json(
      {
        ...fallback,
        ...compiled,
        source: 'nvidia_nim',
        model: process.env.NVIDIA_NIM_MODEL ?? process.env.NVIDIA_NIM_PROXY_MODEL ?? 'moonshotai/kimi-k2-thinking',
      },
      { status: 200 }
    );
  } catch (err) {
    // NIM unavailable — return template fallback with warning
    console.warn('[compile-prompt] NIM unavailable, using template:', err.message);
    return NextResponse.json(
      { ...fallback, nimWarning: err.message },
      { status: 200 }
    );
  }
}
