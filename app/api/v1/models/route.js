import { NextResponse } from 'next/server';
import { MODEL_REGISTRY } from '@/packages/shared/src/model-routing/supercomputer.js';

/**
 * GET /api/v1/models
 * Returns the full model registry array.
 */
export async function GET() {
  return NextResponse.json(MODEL_REGISTRY);
}
