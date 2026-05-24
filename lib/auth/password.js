/**
 * Password hashing using Node.js built-in crypto (scrypt).
 * No external bcrypt dependency needed.
 */

import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [salt, storedHash] = stored.split(':');
  const hash = await scryptAsync(password, salt, 64);
  const storedBuf = Buffer.from(storedHash, 'hex');
  return timingSafeEqual(hash, storedBuf);
}
