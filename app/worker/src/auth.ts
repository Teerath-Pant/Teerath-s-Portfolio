import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { sign, verify } from 'hono/jwt'
import { z } from 'zod'
import type { AppEnv } from './env'
import { tooMany } from './util'

const TOKEN_TTL_SECONDS = 12 * 60 * 60
const enc = new TextEncoder()

const fromHex = (h: string) => Uint8Array.from(h.match(/../g) ?? [], (b) => parseInt(b, 16))

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256))
}

// Stored format (made by scripts/set-password.mjs): pbkdf2:<iterations>:<saltHex>:<hashHex>
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iters, saltHex, hashHex] = (stored || '').split(':')
  const iterations = Number(iters)
  if (scheme !== 'pbkdf2' || !Number.isInteger(iterations) || iterations < 1 || !saltHex || !hashHex) return false
  const expected = fromHex(hashHex)
  const actual = await pbkdf2(password, fromHex(saltHex), iterations)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = c.req.header('Authorization')?.replace(/^Bearer /, '')
  try {
    if (!token || !c.env.AUTH_SECRET) throw new Error('no token')
    await verify(token, c.env.AUTH_SECRET, 'HS256') // also checks `exp`
  } catch {
    return c.json({ ok: false, error: 'Unauthorized' }, 401)
  }
  await next()
}

export const authRoutes = new Hono<AppEnv>()

authRoutes.post('/login', async (c) => {
  if (!c.env.AUTH_SECRET || !c.env.ADMIN_PASSWORD_HASH) {
    return c.json({ ok: false, error: 'Admin login is not configured' }, 500)
  }

  // Per-IP throttle (Cloudflare rate limit binding). Skipped if the binding is absent.
  if (await tooMany(c.env.LOGIN_LIMITER, c)) {
    return c.json({ ok: false, error: 'Too many attempts. Try again in a minute.' }, 429)
  }

  const body = z.object({ password: z.string().min(1).max(256) }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ ok: false, error: 'Password is required' }, 400)

  if (!(await verifyPassword(body.data.password, c.env.ADMIN_PASSWORD_HASH))) {
    return c.json({ ok: false, error: 'Incorrect password' }, 401)
  }

  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  return c.json({ ok: true, token: await sign({ sub: 'admin', exp }, c.env.AUTH_SECRET, 'HS256') })
})
