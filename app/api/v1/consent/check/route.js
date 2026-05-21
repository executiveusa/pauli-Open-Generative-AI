import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  checkConsentForGeneration,
  checkConsentForLipSync,
  checkConsentForCommercialUse,
  checkConsentForTraining,
} from '@/lib/consent/index.js';

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
 * POST /api/v1/consent/check
 * Checks consent status for a character action.
 * Body: { characterId, action }
 * Returns: {blocked: boolean, blockerCode?: string, message?: string}
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const { characterId, action } = body;

  // Validate required fields
  if (!characterId) {
    return NextResponse.json(
      { error: 'validation_error', message: 'characterId is required', errors: ['missing characterId'] },
      { status: 400 }
    );
  }

  if (!action) {
    return NextResponse.json(
      { error: 'validation_error', message: 'action is required', errors: ['missing action'] },
      { status: 400 }
    );
  }

  // Load character
  const character = await readCharacter(characterId);
  if (!character) {
    return NextResponse.json(
      { error: 'not_found', message: `Character ${characterId} not found` },
      { status: 404 }
    );
  }

  // Check consent based on action
  let result;
  switch (action) {
    case 'generation':
      result = checkConsentForGeneration(character);
      break;
    case 'lipSync':
      result = checkConsentForLipSync(character);
      break;
    case 'commercial':
      result = checkConsentForCommercialUse(character);
      break;
    case 'training':
      result = checkConsentForTraining(character);
      break;
    default:
      return NextResponse.json(
        { error: 'validation_error', message: `Invalid action: ${action}`, errors: ['invalid action'] },
        { status: 400 }
      );
  }

  return NextResponse.json(result, { status: 200 });
}
