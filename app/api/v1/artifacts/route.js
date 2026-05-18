/**
 * app/api/v1/artifacts/route.js
 * GET: list all artifacts with optional filters
 * POST: create artifact record
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const ARTIFACTS_DIR = path.join(process.cwd(), 'apps/api/storage/db/artifacts');

function newId(prefix = 'artifact') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowTs() {
  return new Date().toISOString();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readAllArtifacts() {
  await ensureDir(ARTIFACTS_DIR);
  let files;
  try {
    files = await fs.readdir(ARTIFACTS_DIR);
  } catch {
    return [];
  }
  const artifacts = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(path.join(ARTIFACTS_DIR, file), 'utf-8');
      artifacts.push(JSON.parse(raw));
    } catch {
      // skip corrupt files
    }
  }
  return artifacts;
}

async function saveArtifact(artifact) {
  await ensureDir(ARTIFACTS_DIR);
  const filePath = path.join(ARTIFACTS_DIR, `${artifact.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(artifact, null, 2), 'utf-8');
  return artifact;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobIdFilter = searchParams.get('jobId');
    const typeFilter = searchParams.get('type') ?? searchParams.get('artifactType');
    const projectIdFilter = searchParams.get('projectId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500);

    let artifacts = await readAllArtifacts();

    if (jobIdFilter) {
      artifacts = artifacts.filter(a => a.jobId === jobIdFilter);
    }
    if (typeFilter) {
      artifacts = artifacts.filter(a => (a.artifactType ?? a.kind) === typeFilter);
    }
    if (projectIdFilter) {
      artifacts = artifacts.filter(a => a.projectId === projectIdFilter);
    }

    artifacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = artifacts.length;
    artifacts = artifacts.slice(0, limit);

    return NextResponse.json({ artifacts, total }, { status: 200 });
  } catch (err) {
    console.error('[artifacts GET]', err.message);
    return NextResponse.json(
      { error: { message: 'Failed to list artifacts', code: 'internal_error' } },
      { status: 500 }
    );
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

    if (!body.jobId) {
      return NextResponse.json(
        { error: { message: 'jobId is required', code: 'validation_error' } },
        { status: 400 }
      );
    }

    const ts = nowTs();
    const artifact = {
      id: body.id ?? newId('artifact'),
      jobId: body.jobId,
      projectId: body.projectId ?? null,
      artifactType: body.artifactType ?? body.kind ?? 'image',
      filename: body.filename ?? '',
      storagePath: body.storagePath ?? body.url ?? '',
      url: body.url ?? body.storagePath ?? '',
      mimeType: body.mimeType ?? 'application/octet-stream',
      sizeBytes: body.sizeBytes ?? null,
      width: body.width ?? null,
      height: body.height ?? null,
      durationSeconds: body.durationSeconds ?? null,
      metadata: body.metadata ?? {},
      createdAt: ts,
    };

    await saveArtifact(artifact);

    return NextResponse.json(artifact, { status: 201 });
  } catch (err) {
    console.error('[artifacts POST]', err.message);
    return NextResponse.json(
      { error: { message: 'Failed to create artifact', code: 'internal_error' } },
      { status: 500 }
    );
  }
}
