/**
 * Provider Credential Vault
 *
 * Abstracts provider key storage. In production, encryptedSecretRef points
 * to a KMS-managed secret. In dev, keys come from env vars only.
 *
 * SECURITY RULES:
 * - Raw keys are NEVER returned from any public API.
 * - Keys are read only on the server at execution time.
 * - Encryption stub is in place; production MUST wire a real KMS.
 *
 * TODO (production): Replace encryptDecrypt stub with AWS KMS / GCP KMS / Vault.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ENCRYPTION_KEY_HEX = process.env.CREDENTIAL_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

// ─── Encryption stub ──────────────────────────────────────────────────────

function getEncryptionKey() {
  if (!ENCRYPTION_KEY_HEX) {
    // Dev fallback — deterministic, NOT secure for production
    console.warn('[vault] CREDENTIAL_ENCRYPTION_KEY not set — using insecure dev key');
    return Buffer.alloc(32, 'dev-key-not-secure');
  }
  return Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
}

export function encryptSecret(plaintext) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${tag.toString('hex')}.${encrypted.toString('hex')}`;
}

export function decryptSecret(cipherRef) {
  const key = getEncryptionKey();
  const parts = cipherRef.split('.');
  if (parts.length !== 3) throw new Error('Invalid cipher ref format');
  const [ivHex, tagHex, encHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

// ─── Env-var fallback (server-side only) ─────────────────────────────────

const ENV_KEY_MAP = {
  openai: 'OPENAI_API_KEY',
  'nvidia-nim-proxy': null, // Handled by NvidiaNimProxyAdapter directly
  fal: 'FAL_KEY',
  muapi: 'MUAPI_KEY',
  huggingface: 'HF_TOKEN',
  'cynthia-gateway': 'CYNTHIA_GATEWAY_API_KEY',
  comfyui: null, // URL-based, no key
  local: null,
  mock: null,
};

/**
 * Resolve an API key for a provider, given an optional DB credential record.
 * NEVER returns the key to the client — call only in server-side code.
 *
 * Priority:
 * 1. DB credential (decrypted)
 * 2. Env var fallback
 * 3. null (key not available)
 *
 * @param {string} providerId
 * @param {object|null} dbCredential - ProviderCredential row from Prisma (may be null)
 * @returns {string|null}
 */
export function resolveProviderKey(providerId, dbCredential) {
  // 1. DB-stored encrypted credential
  if (dbCredential?.encryptedSecretRef) {
    try {
      return decryptSecret(dbCredential.encryptedSecretRef);
    } catch (err) {
      console.error(`[vault] failed to decrypt credential for ${providerId}:`, err.message);
    }
  }

  // 2. Env var fallback
  const envKey = ENV_KEY_MAP[providerId];
  if (envKey && process.env[envKey]) {
    return process.env[envKey];
  }

  return null;
}

/**
 * Check if a provider key is available (without returning the key itself).
 */
export function hasProviderKey(providerId, dbCredential) {
  return resolveProviderKey(providerId, dbCredential) !== null;
}

/**
 * Sanitize a ProviderCredential for client response — NEVER include the key.
 */
export function sanitizeCredential(cred) {
  if (!cred) return null;
  const { encryptedSecretRef: _secret, ...safe } = cred;
  return {
    ...safe,
    hasKey: !!_secret,
  };
}
