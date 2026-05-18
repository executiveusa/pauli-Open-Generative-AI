import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { checkConsentForLipSync } from '@/lib/consent/index.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const CHARS_DIR = join(STORAGE_ROOT, 'db', 'characters');

async function readCharacter(characterId) {
  try {
    const raw = await fs.readFile(join(CHARS_DIR, `${characterId}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * POST /api/v1/lipsync
 * Generates lip sync for character dialogue.
 * Body: { character, dialogue, voiceLocale, model, characterPassportId? }
 * Runs consent checks FIRST.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const { character, dialogue, voiceLocale, model, characterPassportId } = body;

  // Validate required fields
  if (!character && !characterPassportId) {
    return NextResponse.json(
      { error: 'validation_error', message: 'character or characterPassportId is required', errors: ['missing character/characterPassportId'] },
      { status: 400 }
    );
  }

  if (!dialogue) {
    return NextResponse.json(
      { error: 'validation_error', message: 'dialogue is required', errors: ['missing dialogue'] },
      { status: 400 }
    );
  }

  // Load character if we have characterPassportId
  let charData = character;
  if (!charData && characterPassportId) {
    charData = await readCharacter(characterPassportId);
    if (!charData) {
      return NextResponse.json(
        { error: 'not_found', message: `Character ${characterPassportId} not found` },
        { status: 404 }
      );
    }
  }

  // Run consent checks FIRST
  const consentCheck = checkConsentForLipSync(charData);
  if (consentCheck.blocked) {
    // Return 403 with specific error code
    return NextResponse.json(
      {
        error: consentCheck.blockerCode === 'minor_character' ? 'blocked_by_safety' : 'blocked_by_rights',
        message: consentCheck.message,
      },
      { status: 403 }
    );
  }

  // Mock lip sync result
  const mockResult = {
    id: `lipsync_${Date.now()}`,
    characterId: characterPassportId || character?.id,
    dialogue,
    voiceLocale: voiceLocale ?? 'es-MX',
    model: model ?? 'default',
    keyframes: [
      { time: 0, phoneme: 'silence', blendShapes: {} },
      { time: 0.5, phoneme: 'a', blendShapes: { jawOpen: 0.3 } },
      { time: 1.0, phoneme: 'e', blendShapes: { jawOpen: 0.2 } },
      { time: 1.5, phoneme: 'i', blendShapes: { jawOpen: 0.1 } },
    ],
    duration: 2.0,
    confidence: 0.92,
  };

  return NextResponse.json(mockResult, { status: 200 });
}
