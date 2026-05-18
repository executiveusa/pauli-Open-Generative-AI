import { NextResponse } from 'next/server';
import { routeGeneration } from '@/packages/shared/src/model-routing/supercomputer.js';

/**
 * POST /api/v1/route
 * Routes a generation request to the best available model.
 *
 * Body: { modality, routingMode, availableProviders?, needsCharacterConsistency?, needsLipSync?, needsStartEndFrames?, preferBYOK? }
 * Returns: { primary, alternatives, reason, reasonEs }
 * Security: never echoes back API keys
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const {
    modality,
    routingMode = 'auto-best',
    availableProviders = [],
    needsCharacterConsistency = false,
    needsLipSync = false,
    needsStartEndFrames = false,
    preferBYOK = false,
    preferLocal = false,
  } = body;

  // Security: strip any keys that might have been sent accidentally
  // We only pass provider IDs (strings), never API keys
  const safeProviders = (Array.isArray(availableProviders) ? availableProviders : [])
    .filter(p => typeof p === 'string' && p.length < 64);

  const providerSet = new Set(safeProviders);

  const routeRequest = {
    modality,
    needsCharacterConsistency: Boolean(needsCharacterConsistency),
    needsLipSync: Boolean(needsLipSync),
    needsStartEndFrames: Boolean(needsStartEndFrames),
    preferBYOK: Boolean(preferBYOK),
    preferLocal: Boolean(preferLocal),
  };

  let result;
  try {
    result = routeGeneration(routeRequest, providerSet, routingMode);
  } catch (err) {
    console.error('[route] routeGeneration error:', err.message);
    return NextResponse.json({ error: 'routing_error', message: 'Failed to route generation request' }, { status: 500 });
  }

  return NextResponse.json({
    primary: result.primary,
    alternatives: result.alternatives,
    reason: result.reason,
    reasonEs: result.reasonEs,
  });
}
