import { join, basename } from 'node:path';
import { json, apiError, readBuffer } from '../middleware.js';
import { makeAsset } from '../../../../packages/shared/src/types/core.js';
import * as db from '../db/repository.js';
import { writeArtifact } from '../storage/local.js';

const ALLOWED_AUDIO = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB

function mimeToKind(mime) {
  if (ALLOWED_AUDIO.includes(mime)) return 'audio';
  if (ALLOWED_VIDEO.includes(mime)) return 'video';
  if (ALLOWED_IMAGE.includes(mime)) return 'image';
  if (mime === 'application/json') return 'json';
  return 'other';
}

function sanitizeFilename(raw) {
  // Take only basename, strip path separators, allow only safe chars
  const base = basename(raw.replace(/\\/g, '/'));
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255) || 'upload';
}

export function registerAssets(router) {
  // POST /v1/assets/upload  (raw body upload with headers)
  router.post('/v1/assets/upload', async (req, res) => {
    const projectId = req.headers['x-project-id'];
    const filename  = sanitizeFilename(req.headers['x-filename'] ?? 'upload');
    const mimeType  = req.headers['content-type']?.split(';')[0]?.trim() ?? 'application/octet-stream';

    if (!projectId) return apiError(res, 400, 'validation_error', 'x-project-id header required');

    // Reject oversized uploads before buffering
    const contentLength = Number(req.headers['content-length'] ?? 0);
    if (contentLength > MAX_UPLOAD_BYTES) {
      return apiError(res, 413, 'payload_too_large', `Upload exceeds ${MAX_UPLOAD_BYTES} bytes`);
    }

    const project = await db.projects.get(projectId);
    if (!project) return apiError(res, 404, 'not_found', `Project ${projectId} not found`);

    let buffer;
    try { buffer = await readBuffer(req, MAX_UPLOAD_BYTES); } catch (e) { return apiError(res, 400, 'read_error', e.message); }

    if (!buffer.length) return apiError(res, 400, 'validation_error', 'Empty upload body');
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return apiError(res, 413, 'payload_too_large', 'Upload exceeds maximum allowed size');
    }

    const asset = makeAsset({
      projectId,
      ownerUserId: project.ownerUserId,
      kind: mimeToKind(mimeType),
      originalFilename: filename,
      mimeType,
      provenance: { source: 'user-upload', rightsStatus: 'owned' },
    });

    const relPath = `projects/${projectId}/assets/original/${asset.id}_${filename}`;
    const { sha256, sizeBytes } = await writeArtifact(relPath, buffer);
    asset.storagePath = relPath;
    asset.sha256 = sha256;

    await db.assets.put(asset.id, asset);
    json(res, 201, asset);
  });

  // GET /v1/assets/:id
  router.get('/v1/assets/:id', async (req, res, params) => {
    const asset = await db.assets.get(params.id);
    if (!asset) return apiError(res, 404, 'not_found', `Asset ${params.id} not found`);
    json(res, 200, asset);
  });

  // GET /v1/projects/:id/assets
  router.get('/v1/projects/:id/assets', async (req, res, params) => {
    const items = await db.assets.list(a => a.projectId === params.id);
    json(res, 200, { items, total: items.length });
  });
}
