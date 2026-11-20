import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { BatchItem } from 'drizzle-orm/batch'
import { z } from 'zod'
import type { AppEnv } from './env'
import { requireAdmin } from './auth'
import * as t from './db/schema'
import { pruneImages } from './images'

export const portfolioRoutes = new Hono<AppEnv>()

// ── validation ──
const str = (max: number) => z.string().max(max)
const opt = (max: number) => str(max).nullish()
const imageUrl = str(2048).refine(
  (v) => v === '' || /^https?:\/\//.test(v) || v.startsWith('/api/img/'),
  'Images must be uploaded through /api/upload (or be an http(s) URL), not embedded as data: URLs',
)
// old /api/uploads/ paths pointed at a disk that no longer exists: drop them silently (old server did too)
const imageList = z
  .array(z.string())
  .transform((a) => a.filter((i) => !/\/api\/uploads\//i.test(i)))
  .pipe(z.array(imageUrl).max(20))
const textList = z.array(str(1024)).max(50).optional()

const saveSchema = z.object({
  profile: z
    .object({
      name: opt(256),
      title: opt(256),
      location: opt(256),
      headline: opt(256),
      subtext: opt(5000),
      availableForWork: z.boolean().optional(),
      avatarUrl: imageUrl.nullish(),
    })
    .optional(),
  goals: textList,
  audience: textList,
  futureEnhancements: textList,
  bioPoints: z.array(z.object({ icon: opt(32), label: opt(128), value: opt(256) })).max(50).optional(),
  projectCards: z
    .array(
      z.object({
        title: str(256).min(1),
        description: opt(5000),
        tag: opt(128),
        link: opt(1024),
        images: imageList.optional(),
        showOnHome: z.boolean().optional(),
      }),
    )
    .max(50)
    .optional(),
  skillLevels: z.array(z.object({ label: str(128).min(1), value: z.number().int().min(0).max(100) })).max(100).optional(),
  technicalMastery: z
    .array(z.object({ title: str(256).min(1), icon: opt(64), skills: z.array(str(128)).max(100).optional() }))
    .max(50)
    .optional(),
  socials: z.array(z.object({ label: opt(128), href: opt(1024), platform: opt(64) })).max(50).optional(),
  stats: z.array(z.object({ value: opt(64), label: opt(256) })).max(50).optional(),
})

// ── helpers ──
const parseList = (v: string | null): unknown[] => {
  try {
    const p = JSON.parse(v ?? '[]')
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

// D1 allows at most 100 bound parameters per statement, so insert in chunks.
const PARAM_BUDGET = 90

// Content version: a random id rewritten on every save. It is the ETag of /api/load.
const VERSION_KEY = 'portfolioVersion'

// ── GET /api/load (public) ──
// Cache-Control: no-cache = browsers must revalidate every time, so the admin never edits stale data.
// Revalidation is cheap: if the ETag still matches we answer 304 after reading a single row.
portfolioRoutes.get('/load', async (c) => {
  const db = drizzle(c.env.DB)
  c.header('Cache-Control', 'no-cache')

  const [ver] = await db.select().from(t.settings).where(eq(t.settings.key, VERSION_KEY))
  if (ver?.value) {
    const etag = `"${ver.value}"`
    c.header('ETag', etag)
    const sent = (c.req.header('If-None-Match') ?? '').split(',').map((s) => s.trim().replace(/^W\//, ''))
    if (sent.includes(etag)) return c.body(null, 304)
  }

  const [profile, goals, audience, bio, projects, skills, mastery, future, socials, stats] = await db.batch([
    db.select().from(t.profile).limit(1),
    db.select().from(t.goals).orderBy(t.goals.position, t.goals.id),
    db.select().from(t.audience).orderBy(t.audience.position, t.audience.id),
    db.select().from(t.bioPoints).orderBy(t.bioPoints.position, t.bioPoints.id),
    db.select().from(t.projects).orderBy(t.projects.position, t.projects.id),
    db.select().from(t.skillLevels).orderBy(t.skillLevels.position, t.skillLevels.id),
    db.select().from(t.technicalMastery).orderBy(t.technicalMastery.position, t.technicalMastery.id),
    db.select().from(t.futureEnhancements).orderBy(t.futureEnhancements.position, t.futureEnhancements.id),
    db.select().from(t.socials).orderBy(t.socials.position, t.socials.id),
    db.select().from(t.stats).orderBy(t.stats.position, t.stats.id),
  ])

  // Nothing saved yet: let each frontend use its own built-in defaults.
  if (profile.length === 0) return c.json({ ok: true, data: null })

  const { updatedAt: _u, ...profileOut } = profile[0]
  return c.json({
    ok: true,
    data: {
      profile: profileOut,
      goals: goals.map((r) => r.text),
      audience: audience.map((r) => r.text),
      bioPoints: bio.map(({ id, icon, label, value }) => ({ id, icon, label, value })),
      projectCards: projects.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        tag: r.tag,
        link: r.link,
        images: parseList(r.images),
        showOnHome: r.showOnHome,
      })),
      skillLevels: skills.map(({ id, label, value }) => ({ id, label, value })),
      technicalMastery: mastery.map((r) => ({ id: r.id, title: r.title, icon: r.icon, skills: parseList(r.skills) })),
      futureEnhancements: future.map((r) => r.text),
      socials: socials.map(({ id, label, href, platform }) => ({ id, label, href, platform })),
      stats: stats.map(({ id, value, label }) => ({ id, value, label })),
    },
  })
})

// ── POST /api/save (admin) — whole document, applied atomically in one D1 batch ──
portfolioRoutes.post('/save', requireAdmin, bodyLimit({ maxSize: 1024 * 1024, onError: (c) => c.json({ ok: false, error: 'Payload too large' }, 413) }), async (c) => {
  const parsed = saveSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    const i = parsed.error.issues[0]
    return c.json({ ok: false, error: `${i.path.join('.') || 'body'}: ${i.message}` }, 400)
  }
  const d = parsed.data
  const db = drizzle(c.env.DB)
  const ops: BatchItem<'sqlite'>[] = []

  // Profile row doubles as the "has ever been saved" marker, so it is always upserted.
  const p = d.profile ?? {}
  ops.push(
    db
      .insert(t.profile)
      .values({ id: 1, ...p })
      .onConflictDoUpdate({ target: t.profile.id, set: { ...p, updatedAt: sql`datetime('now')` } }),
  )

  // New content version => every cached /api/load copy is revalidated.
  const version = crypto.randomUUID()
  ops.push(
    db
      .insert(t.settings)
      .values({ key: VERSION_KEY, value: version })
      .onConflictDoUpdate({ target: t.settings.key, set: { value: version, updatedAt: sql`datetime('now')` } }),
  )

  // Replace a whole list table (only when the client sent that list).
  const replace = <T extends SQLiteTable>(table: T, rows: Record<string, unknown>[] | undefined, columns: number) => {
    if (!rows) return
    ops.push(db.delete(table))
    const size = Math.max(1, Math.floor(PARAM_BUDGET / columns))
    const withPos = rows.map((r, position) => ({ ...r, position }))
    for (let i = 0; i < withPos.length; i += size) {
      ops.push(db.insert(table).values(withPos.slice(i, i + size) as T['$inferInsert'][]))
    }
  }

  replace(t.goals, d.goals?.map((text) => ({ text })), 2)
  replace(t.audience, d.audience?.map((text) => ({ text })), 2)
  replace(t.futureEnhancements, d.futureEnhancements?.map((text) => ({ text })), 2)
  replace(t.bioPoints, d.bioPoints, 4)
  replace(
    t.projects,
    d.projectCards?.map((r, i) => ({
      ...r,
      images: JSON.stringify(r.images ?? []),
      showOnHome: r.showOnHome ?? i < 3,
    })),
    7,
  )
  replace(t.skillLevels, d.skillLevels, 3)
  replace(
    t.technicalMastery,
    d.technicalMastery?.map((r) => ({ ...r, skills: JSON.stringify(r.skills ?? []) })),
    4,
  )
  replace(t.socials, d.socials, 4)
  replace(t.stats, d.stats, 3)

  await db.batch(ops as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])

  // Only a full document (images live in projects + avatar) can tell us what is unreferenced.
  if (d.projectCards && d.profile?.avatarUrl !== undefined) {
    const used = new Set(
      [...d.projectCards.flatMap((p) => p.images ?? []), d.profile.avatarUrl ?? '']
        .map((u) => u.match(/\/api\/img\/([0-9a-f-]{36})/)?.[1])
        .filter((id): id is string => !!id),
    )
    c.executionCtx.waitUntil(pruneImages(c.env.IMAGES, used).catch((e) => console.error('prune failed', e)))
  }
  return c.json({ ok: true })
})
