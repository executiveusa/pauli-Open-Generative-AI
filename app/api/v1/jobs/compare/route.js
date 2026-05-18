/**
 * app/api/v1/jobs/compare/route.js
 * POST: compare multiple jobs side by side with their artifacts and evaluations
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const JOBS_DIR = path.join(process.cwd(), 'apps/api/storage/db/jobs');
const ARTIFACTS_DIR = path.join(process.cwd(), 'apps/api/storage/db/artifacts');
const EVALUATIONS_DIR = path.join(process.cwd(), 'apps/api/storage/db/evaluations');

async function readJob(id) {
  const filePath = path.join(JOBS_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readAllArtifacts() {
  try {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    const files = await fs.readdir(ARTIFACTS_DIR);
    const artifacts = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(ARTIFACTS_DIR, file), 'utf-8');
        artifacts.push(JSON.parse(raw));
      } catch { /* skip */ }
    }
    return artifacts;
  } catch {
    return [];
  }
}

async function readEvaluation(jobId) {
  const filePath = path.join(EVALUATIONS_DIR, `${jobId}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { message: 'Invalid JSON body', code: 'invalid_body' } },
        { status: 400 }
      );
    }

    const { jobIds } = body;
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: { message: 'jobIds must be a non-empty array', code: 'validation_error' } },
        { status: 400 }
      );
    }

    if (jobIds.length > 10) {
      return NextResponse.json(
        { error: { message: 'Cannot compare more than 10 jobs at once', code: 'validation_error' } },
        { status: 400 }
      );
    }

    const allArtifacts = await readAllArtifacts();

    const results = await Promise.all(
      jobIds.map(async (id) => {
        const job = await readJob(id);
        if (!job) {
          return { id, found: false, error: `Job ${id} not found` };
        }
        const artifacts = allArtifacts.filter(a => a.jobId === id);
        const evaluation = await readEvaluation(id);
        return { id, found: true, job, artifacts, evaluation };
      })
    );

    return NextResponse.json(
      {
        comparison: results,
        total: results.length,
        foundCount: results.filter(r => r.found).length,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[jobs compare POST]', err.message);
    return NextResponse.json(
      { error: { message: 'Failed to compare jobs', code: 'internal_error' } },
      { status: 500 }
    );
  }
}
