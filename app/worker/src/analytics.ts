import { Hono } from 'hono'
import type { Context } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, count, countDistinct, desc, eq, gte, inArray, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { AppEnv } from './env'
import { requireAdmin } from './auth'
import { clientIp, tooMany } from './util'
import * as t from './db/schema'

export const analyticsRoutes = new Hono<AppEnv>()

const IGNORE_KEY = 'ignoredIpHash'
const enc = new TextEncoder()

// Keyed hash: stored values cannot be turned back into an IP without AUTH_SECRET.
async function hashIp(c: Context<AppEnv>) {
  const key = await crypto.subtle.importKey('raw', enc.encode(c.env.AUTH_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('ip:' + clientIp(c)))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

const trackSchema = z.object({
  event: z.enum(['pageview', 'project_view', 'contact_click']),
  page: z.string().max(256).optional(),
  session: z.string().max(64).optional(),
  project: z.string().max(256).nullish(),
  platform: z.string().max(64).nullish(),
})

// Public, fire-and-forget from the website (30 per minute per IP).
analyticsRoutes.post('/track', async (c) => {
  if (await tooMany(c.env.TRACK_LIMITER, c)) return c.json({ ok: false, error: 'Too many requests' }, 429)
  const body = trackSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ ok: false, error: 'Invalid event' }, 400)

  const { event, page, session, project, platform } = body.data
  const db = drizzle(c.env.DB)
  const date = new Date().toISOString().slice(0, 10)

  if (event === 'pageview') {
    await db.insert(t.visits).values({
      date,
      hashedIp: await hashIp(c),
      session: session || 'unknown',
      country: (c.req.raw.cf?.country as string | undefined) ?? null, // set by Cloudflare, absent in local dev
      page: page || '/',
    })
  } else {
    await db.insert(t.events).values({ type: event, project: project || null, platform: platform || null, session: session || 'unknown', date })
  }
  return c.json({ ok: true })
})

// Admin dashboard stats, aggregated in SQL.
analyticsRoutes.get('/analytics', requireAdmin, async (c) => {
  const db = drizzle(c.env.DB)
  const range = c.req.query('range') ?? '7d'
  const day = (offset: number) => new Date(Date.now() - offset * 864e5).toISOString().slice(0, 10)
  const cutoff = range === 'today' ? day(0) : range === '7d' ? day(6) : '2000-01-01'

  const myHash = await hashIp(c)
  const [ignored] = await db.select().from(t.settings).where(eq(t.settings.key, IGNORE_KEY))
  const selfFiltered = ignored?.value === myHash

  const V = t.visits
  const E = t.events
  const visitWhere = and(gte(V.date, cutoff), selfFiltered ? ne(V.hashedIp, myHash) : undefined)
  // events carry no IP: when self-filtering, keep only sessions that still have a counted visit
  const validSessions = db.select({ s: V.session }).from(V).where(visitWhere)
  const eventWhere = (type: string) =>
    and(gte(E.date, cutoff), eq(E.type, type), selfFiltered ? inArray(E.session, validSessions) : undefined)

  const [[totals], topCountries, pageViews, dailyChart, projectsViewed, contactClicks] = await db.batch([
    db.select({ totalVisits: count(), uniqueVisitors: countDistinct(V.hashedIp) }).from(V).where(visitWhere),
    db.select({ country: sql<string>`coalesce(${V.country}, 'XX')`, count: count() }).from(V).where(visitWhere).groupBy(sql`1`).orderBy(desc(count())),
    db.select({ page: V.page, count: count() }).from(V).where(visitWhere).groupBy(V.page).orderBy(desc(count())),
    db.select({ date: V.date, count: count() }).from(V).where(visitWhere).groupBy(V.date).orderBy(V.date),
    db.select({ project: E.project, count: count() }).from(E).where(and(eventWhere('project_view'), sql`${E.project} is not null`)).groupBy(E.project).orderBy(desc(count())),
    db.select({ platform: E.platform, count: count() }).from(E).where(and(eventWhere('contact_click'), sql`${E.platform} is not null`)).groupBy(E.platform).orderBy(desc(count())),
  ])

  c.header('Cache-Control', 'no-store')
  return c.json({
    ok: true,
    data: {
      selfFiltered,
      totalVisits: totals?.totalVisits ?? 0,
      uniqueVisitors: totals?.uniqueVisitors ?? 0,
      topCountries,
      pageViews,
      projectsViewed,
      contactClicks,
      dailyChart,
    },
  })
})

analyticsRoutes.post('/analytics/ignore-self', requireAdmin, async (c) => {
  const body = z.object({ action: z.enum(['ignore', 'allow']) }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ ok: false, error: 'Invalid action' }, 400)
  const db = drizzle(c.env.DB)

  if (body.data.action === 'ignore') {
    const value = await hashIp(c)
    await db
      .insert(t.settings)
      .values({ key: IGNORE_KEY, value })
      .onConflictDoUpdate({ target: t.settings.key, set: { value, updatedAt: sql`datetime('now')` } })
  } else {
    await db.delete(t.settings).where(eq(t.settings.key, IGNORE_KEY))
  }
  return c.json({ ok: true })
})

analyticsRoutes.delete('/analytics', requireAdmin, async (c) => {
  const db = drizzle(c.env.DB)
  await db.batch([db.delete(t.visits), db.delete(t.events)])
  return c.json({ ok: true })
})
