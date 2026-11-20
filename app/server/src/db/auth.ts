import crypto from 'crypto';

/**
 * Hash password using PBKDF2 with SHA-512 and a unique salt.
 * Stored format: `salt:iterations:hash`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 210000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `${salt}:${iterations}:${hash}`;
}

/**
 * Verify a plain text password against a stored PBKDF2 hash (constant-time compare).
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  const parts = (storedValue || '').split(':');
  if (parts.length !== 3) return false;

  const [salt, iterationsStr, originalHash] = parts;
  const iterations = parseInt(iterationsStr, 10);
  if (isNaN(iterations)) return false;

  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
  const original = Buffer.from(originalHash, 'hex');
  return hash.length === original.length && crypto.timingSafeEqual(hash, original);
}

/** Signed, expiring admin token: `base64url(payload).base64url(hmac)` */
export function signToken(secret: string, ttlMs = 12 * 60 * 60 * 1000): string {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + ttlMs })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: string, secret: string): boolean {
  const [body, sig] = (token || '').split('.');
  if (!body || !sig) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return false;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}
