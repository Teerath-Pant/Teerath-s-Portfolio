import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { desc } from 'drizzle-orm'
import { z } from 'zod'
import type { AppEnv } from './env'
import { requireAdmin } from './auth'
import { tooMany } from './util'
import { feedback } from './db/schema'

export const feedbackRoutes = new Hono<AppEnv>()

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).nullish(),
  name: z.string().max(100).nullish(),
})

// Public: visitors leave a review (3 per minute per IP).
feedbackRoutes.post('/', async (c) => {
  if (await tooMany(c.env.FEEDBACK_LIMITER, c)) return c.json({ ok: false, error: 'Too many submissions. Try again later.' }, 429)
  const body = feedbackSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ ok: false, error: 'Invalid rating' }, 400)

  await drizzle(c.env.DB).insert(feedback).values({
    rating: body.data.rating,
    comment: body.data.comment || null,
    name: body.data.name || null,
    date: new Date().toISOString(),
  })
  return c.json({ ok: true })
})

// Admin: newest 500 (private, never cached).
feedbackRoutes.get('/', requireAdmin, async (c) => {
  const rows = await drizzle(c.env.DB)
    .select({ id: feedback.id, rating: feedback.rating, comment: feedback.comment, name: feedback.name, date: feedback.date })
    .from(feedback)
    .orderBy(desc(feedback.id))
    .limit(500)
  c.header('Cache-Control', 'no-store')
  return c.json({ ok: true, data: rows })
})

feedbackRoutes.delete('/', requireAdmin, async (c) => {
  await drizzle(c.env.DB).delete(feedback)
  return c.json({ ok: true })
})
