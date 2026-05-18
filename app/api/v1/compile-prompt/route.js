import { NextResponse } from 'next/server';

/**
 * Helper: heroFrameCompiler - Generates prompts for hero frame from character and location data
 * This is a basic implementation. In production, this would leverage AI or template engines.
 */
function heroFrameCompiler(characterId, locationId, aspectRatio, cameraPreset, language) {
  // Basic prompt compilation - in production this would be much more sophisticated
  const basePrompt = `A character portrait in ${aspectRatio} aspect ratio, ${cameraPreset} camera preset, ${language} context`;

  return {
    englishPrompt: basePrompt,
    spanishPrompt: `Un retrato de personaje en relación de aspecto ${aspectRatio}, ajuste de cámara ${cameraPreset}, contexto en ${language}`,
    providerPrompt: basePrompt,
    negativePrompt: 'blurry, low quality, distorted',
    negativePromptEs: 'borroso, baja calidad, distorsionado',
  };
}

/**
 * POST /api/v1/compile-prompt
 * Compiles hero frame prompts from character and location profiles.
 * Body: { characterPassportId, locationProfileId, aspectRatio, cameraPreset, language }
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const { characterPassportId, locationProfileId, aspectRatio, cameraPreset, language } = body;

  // Validate required fields
  if (!characterPassportId) {
    return NextResponse.json(
      { error: 'validation_error', message: 'characterPassportId is required', errors: ['missing characterPassportId'] },
      { status: 400 }
    );
  }

  if (!aspectRatio) {
    return NextResponse.json(
      { error: 'validation_error', message: 'aspectRatio is required', errors: ['missing aspectRatio'] },
      { status: 400 }
    );
  }

  if (!cameraPreset) {
    return NextResponse.json(
      { error: 'validation_error', message: 'cameraPreset is required', errors: ['missing cameraPreset'] },
      { status: 400 }
    );
  }

  const lang = language ?? 'es';

  // Compile prompts
  const prompts = heroFrameCompiler(characterPassportId, locationProfileId, aspectRatio, cameraPreset, lang);

  return NextResponse.json(prompts, { status: 200 });
}
