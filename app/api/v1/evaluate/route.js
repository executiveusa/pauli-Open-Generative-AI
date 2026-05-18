import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { makeEvaluationResult, validateEvaluationResult } from '@/packages/shared/src/schemas/cynthia.js';

const STORAGE_ROOT = process.env.STORAGE_ROOT
  ? process.env.STORAGE_ROOT
  : join(process.cwd(), 'apps', 'api', 'storage');

const EVALS_DIR = join(STORAGE_ROOT, 'db', 'evaluations');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function saveEvaluation(evaluation) {
  await ensureDir(EVALS_DIR);
  const path = join(EVALS_DIR, `${evaluation.id}.json`);
  await fs.writeFile(path, JSON.stringify(evaluation, null, 2));
  return evaluation;
}

/**
 * Mock rule-based evaluation function
 */
function runMockRuleBasedEvaluation(jobId, artifactId, characterId) {
  return {
    id: `eval_${Date.now()}`,
    jobId,
    artifactId,
    evaluatorType: 'rule-based',
    scores: {
      identityConsistency: 0.85,
      wardrobeConsistency: 0.88,
      locationConsistency: 0.82,
      lightingCoherence: 0.90,
      cameraAdherence: 0.87,
      motionQuality: 0.84,
      lipSyncQuality: 0.80,
      spanishLocalizationQuality: 0.89,
      latAmCulturalFit: 0.91,
      rightsComplianceCompleteness: 1.0,
    },
    overallScore: 0.867,
    passed: true,
    reviewerNotes: 'High-quality generation with excellent cultural fit.',
    createdAt: new Date().toISOString(),
  };
}

/**
 * POST /api/v1/evaluate
 * Runs evaluation on a generation result.
 * Body: { jobId, artifactId, characterId? }
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const { jobId, artifactId, characterId } = body;

  // Validate required fields
  if (!jobId) {
    return NextResponse.json(
      { error: 'validation_error', message: 'jobId is required', errors: ['missing jobId'] },
      { status: 400 }
    );
  }

  if (!artifactId) {
    return NextResponse.json(
      { error: 'validation_error', message: 'artifactId is required', errors: ['missing artifactId'] },
      { status: 400 }
    );
  }

  // Run mock evaluation (in production, this could be rule-based or AI-based)
  const evaluation = runMockRuleBasedEvaluation(jobId, artifactId, characterId);

  // Build EvaluationResult with proper schema
  let result;
  try {
    result = makeEvaluationResult(evaluation);
  } catch (err) {
    return NextResponse.json({ error: 'schema_error', message: err.message }, { status: 400 });
  }

  // Validate result
  const validation = validateEvaluationResult(result);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Invalid evaluation result', errors: validation.errors },
      { status: 400 }
    );
  }

  try {
    await saveEvaluation(result);
  } catch (err) {
    console.error('[evaluate POST] save error:', err);
    return NextResponse.json({ error: 'storage_error', message: 'Failed to save evaluation' }, { status: 500 });
  }

  return NextResponse.json(result, { status: 201 });
}
