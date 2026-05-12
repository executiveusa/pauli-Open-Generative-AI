/**
 * Local filesystem storage adapter.
 * All artifacts stored under STORAGE_ROOT/{projects,jobs,...}/
 * Interface designed so S3/R2 can replace this later.
 */

import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? './storage';

/**
 * Returns an absolute path for a storage key.
 */
export function storagePath(...parts) {
  return join(STORAGE_ROOT, ...parts);
}

/**
 * Writes a buffer to storage and returns the path + sha256.
 */
export async function writeArtifact(relPath, buffer) {
  const abs = storagePath(relPath);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  return { storagePath: relPath, sha256, sizeBytes: buffer.length };
}

/**
 * Reads a stored artifact buffer.
 */
export async function readArtifact(relPath) {
  return readFile(storagePath(relPath));
}

/**
 * Writes a JSON document.
 */
export async function writeJson(relPath, data) {
  const abs = storagePath(relPath);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, JSON.stringify(data, null, 2));
}

/**
 * Reads a JSON document, returns null if not found.
 */
export async function readJson(relPath) {
  try {
    const raw = await readFile(storagePath(relPath), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Checks if a path exists in storage.
 */
export async function exists(relPath) {
  try {
    await stat(storagePath(relPath));
    return true;
  } catch {
    return false;
  }
}

export { STORAGE_ROOT };
