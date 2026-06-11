import crypto from 'crypto';

/**
 * Hash password using PBKDF2 with SHA-512 and a unique salt.
 * Stored format: `salt:iterations:hash`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 10000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `${salt}:${iterations}:${hash}`;
}

/**
 * Verify a plain text password against a stored PBKDF2 hash.
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue) return false;
  
  const parts = storedValue.split(':');
  if (parts.length !== 3) {
    // If it's a legacy or unhashed string (e.g. if plain-text password was somehow in the DB), verify directly
    return password === storedValue;
  }
  
  const [salt, iterationsStr, originalHash] = parts;
  const iterations = parseInt(iterationsStr, 10);
  if (isNaN(iterations)) return false;

  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return hash === originalHash;
}
