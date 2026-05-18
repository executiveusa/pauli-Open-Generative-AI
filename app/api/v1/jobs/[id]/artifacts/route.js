/**
 * app/api/v1/jobs/[id]/artifacts/route.js
 * GET: list artifacts for a job
 * POST: attach artifact to a job
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const ARTIFACTS_DIR = path.join(process.cwd(), 'apps/api/storage/db/artifacts');
const JOBS_DIR = path.join(process.cwd(), 'apps/api/storage/db/jobs');

function newId(prefix = 'artifact') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowTs() {
  return new Date().toISOString();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

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

async function saveJob(job) {
  await ensureDir(JOBS_DIR);
  const filePath = path.join(JOBS_DIR, `${job.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(job, null, 2), 'utf-8');
  return job;
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const job = await readJob(id);
    if (!job) {
      return NextResponse.json(
        { error: { message: `Job ${id} not found`, code: 'not_found' } },
        { status: 404 }
      );
    }

    const all = await readAllArtifacts();
    const artifacts = all.filter(a => a.jobId === id);
    artifacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ artifacts, total: artifacts.length }, { status: 200 });
  } catch (err) {
    console.error('[job artifacts GET]', err.message);
    return NextResponse.json(
      { error: { message: 'Failed to list artifacts', code: 'internal_error' } },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const job = await readJob(id);
    if (!job) {
      return NextResponse.json(
        { error: { message: `Job ${id} not found`, code: 'not_found' } },
        { status: 404 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { message: 'Invalid JSON body', code: 'invalid_body' } },
        { status: 400 }
      );
    }

    const ts = nowTs();
    const artifact = {
      id: body.id ?? newId('artifact'),
      jobId: id,
      projectId: body.projectId ?? job.projectId ?? null,
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

    // Also add artifact reference to job
    const updatedJob = {
      ...job,
      artifacts: [...(job.artifacts ?? []), { id: artifact.id, artifactType: artifact.artifactType, url: artifact.url, filename: artifact.filename }],
      updatedAt: ts,
    };
    await saveJob(updatedJob);

    return NextResponse.json(artifact, { status: 201 });
  } catch (err) {
    console.error('[job artifacts POST]', err.message);
    return NextResponse.json(
      { error: { message: 'Failed to attach artifact', code: 'internal_error' } },
      { status: 500 }
    );
  }
}
