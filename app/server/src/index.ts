import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, ne, and, gte, sql, count, countDistinct, desc, inArray } from 'drizzle-orm'
import crypto from 'crypto'
import * as schema from './db/schema'
import fs from 'fs'
import path from 'path'
import { hashPassword, verifyPassword, signToken, verifyToken } from './db/auth'

config({ path: path.resolve(__dirname, '../.env') })

function logError(message: string, err: any) {
  console.error(message, err);
  try {
    const logFilePath = path.join(__dirname, '../error.log');
    const logMessage = `[${new Date().toISOString()}] ${message} ${err instanceof Error ? err.stack : JSON.stringify(err)}\n`;
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
  } catch (e) {
    // ignore
  }
}

const app = express()
const PORT = process.env.PORT || 5002
const AUTH_SECRET = process.env.AUTH_SECRET
app.set('trust proxy', 1) // ponytail: assumes exactly 1 proxy hop (Render/Railway); adjust if deployment differs
if (!AUTH_SECRET || AUTH_SECRET.length < 32) {
  throw new Error('AUTH_SECRET must be set (min 32 chars) in server/.env')
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  if (!verifyToken(token, AUTH_SECRET!)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
  next()
}

// ponytail: in-memory per-process limiter (resets on restart); use a shared store if multi-instance
const loginFails = new Map<string, { n: number; until: number }>()

// ── Middleware ──
app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://localhost:5001',
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL || '',
    process.env.ADMIN_URL  || '',
  ].filter(Boolean),
  credentials: true,
}))
app.use(express.json({ limit: '35mb' }))

// ── File Uploads Setup ──
const UPLOADS_DIR = path.join(__dirname, '../uploads')
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}
app.use('/api/uploads', express.static(UPLOADS_DIR))

// ── Database ──
const client = postgres(process.env.DATABASE_URL!, { max: 10 })
const db = drizzle(client, { schema })

function parseJsonArray(value: string | null) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function isLegacyUploadImage(value: unknown) {
  return typeof value === 'string' && /\/api\/uploads\//i.test(value)
}

function sanitizeImageList(images: unknown) {
  if (!Array.isArray(images)) return []
  return images.filter((image) => typeof image === 'string' && !isLegacyUploadImage(image))
}

function sanitizeProjectCard(project: any, index = 0) {
  return {
    ...project,
    showOnHome: typeof project?.showOnHome === 'boolean' ? project.showOnHome : index < 3,
    images: sanitizeImageList(project?.images),
  }
}

function sanitizePortfolioPayload(data: any) {
  return {
    ...data,
    projectCards: Array.isArray(data?.projectCards)
      ? data.projectCards.map((project: any, index: number) => sanitizeProjectCard(project, index))
      : [],
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'Backend is running 🚀' })
})

// ─────────────────────────────────────────────
// ADMIN LOGIN
// POST /api/admin/login
// ─────────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
  try {
    const ip = req.ip || 'unknown'
    const fail = loginFails.get(ip)
    if (fail && fail.n >= 5 && fail.until > Date.now()) {
      return res.status(429).json({ ok: false, error: 'Too many attempts. Try again later.' })
    }
    const { password } = req.body
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ ok: false, error: 'Password is required' })
    }

    // Find the admin user with username 'admin'
    const adminRows = await db.select().from(schema.admins)
      .where(eq(schema.admins.username, 'admin'))
      .limit(1)

    if (adminRows.length === 0) {
      return res.status(401).json({ ok: false, error: 'No admin user configured' })
    }

    const admin = adminRows[0]
    const isMatch = verifyPassword(password, admin.password)
    if (isMatch) {
      loginFails.delete(ip)
      return res.json({ ok: true, token: signToken(AUTH_SECRET!) })
    } else {
      loginFails.set(ip, { n: (fail && fail.until > Date.now() ? fail.n : 0) + 1, until: Date.now() + 15 * 60 * 1000 })
      return res.status(401).json({ ok: false, error: 'Incorrect password' })
    }
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ ok: false, error: 'Failed to verify password' })
  }
})


// ─────────────────────────────────────────────
// FILE UPLOAD
// POST /api/upload
// ─────────────────────────────────────────────
app.post('/api/upload', requireAdmin, async (req, res) => {
  try {
    const { filename, data } = req.body
    if (!filename || !data) {
      return res.status(400).json({ ok: false, error: 'Missing filename or data' })
    }

    // Parse base64 data
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ ok: false, error: 'Invalid base64 data format' })
    }

    const fileBuffer = Buffer.from(matches[2], 'base64')
    
    // Generate unique name
    const ext = path.extname(filename) || '.png'
    const nameWithoutExt = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, '_')
    const uniqueFilename = `${nameWithoutExt}_${Date.now()}${ext}`
    
    const destPath = path.join(UPLOADS_DIR, uniqueFilename)
    
    await fs.promises.writeFile(destPath, fileBuffer)
    
    res.json({
      ok: true,
      url: `/api/uploads/${uniqueFilename}`
    })
  } catch (err: any) {
    console.error('Upload error:', err)
    res.status(500).json({ ok: false, error: 'Failed to process file upload' })
  }
})

// ─────────────────────────────────────────────
// PORTFOLIO: LOAD
// GET /api/load
// ─────────────────────────────────────────────
app.get('/api/load', async (_req, res) => {
  try {
    const [
      profileRows,
      goalRows,
      audienceRows,
      bioRows,
      projectRows,
      skillRows,
      masteryRows,
      enhancementRows,
      socialRows,
      statRows,
    ] = await Promise.all([
      db.select().from(schema.portfolioProfile),
      db.select().from(schema.portfolioGoals),
      db.select().from(schema.portfolioAudience),
      db.select().from(schema.portfolioBioPoints),
      db.select().from(schema.portfolioProjects),
      db.select().from(schema.portfolioSkillLevels),
      db.select().from(schema.portfolioTechnicalMastery),
      db.select().from(schema.portfolioFutureEnhancements),
      db.select().from(schema.portfolioSocials),
      db.select().from(schema.portfolioStats),
    ])

    const profile = profileRows[0] || null

    const data = sanitizePortfolioPayload({
      profile,
      goals:               goalRows.map(r => r.text),
      audience:            audienceRows.map(r => r.text),
      bioPoints:           bioRows,
      projectCards:        projectRows.map(r => ({
        ...r,
        images: parseJsonArray(r.images),
      })),
      skillLevels:         skillRows,
      technicalMastery:    masteryRows.map(r => ({
        ...r,
        skills: parseJsonArray(r.skills),
      })),
      futureEnhancements:  enhancementRows.map(r => r.text),
      socials:             socialRows,
      stats:               statRows,
    })

    res.json({ ok: true, data })
  } catch (err) {
    logError('Load error:', err)
    res.status(500).json({ ok: false, error: 'Failed to load data' })
  }
})

// ─────────────────────────────────────────────
// PORTFOLIO: SAVE
// POST /api/save
// ─────────────────────────────────────────────
app.post('/api/save', requireAdmin, async (req, res) => {
  const data = sanitizePortfolioPayload(req.body)
  try {
    // ── Profile ──
    if (data.profile) {
      const existing = await db.select().from(schema.portfolioProfile).limit(1)
      if (existing.length > 0) {
        await db.update(schema.portfolioProfile)
          .set(data.profile)
          .where(eq(schema.portfolioProfile.id, existing[0].id))
      } else {
        await db.insert(schema.portfolioProfile).values(data.profile)
      }
    }

    // ── Goals ──
    if (data.goals) {
      await db.delete(schema.portfolioGoals)
      if (data.goals.length > 0) {
        await db.insert(schema.portfolioGoals)
          .values(data.goals.map((text: string) => ({ text })))
      }
    }

    // ── Audience ──
    if (data.audience) {
      await db.delete(schema.portfolioAudience)
      if (data.audience.length > 0) {
        await db.insert(schema.portfolioAudience)
          .values(data.audience.map((text: string) => ({ text })))
      }
    }

    // ── Bio Points ──
    if (data.bioPoints) {
      await db.delete(schema.portfolioBioPoints)
      if (data.bioPoints.length > 0) {
        await db.insert(schema.portfolioBioPoints).values(data.bioPoints)
      }
    }

    // ── Projects ──
    if (data.projectCards) {
      await db.delete(schema.portfolioProjects)
      if (data.projectCards.length > 0) {
        await db.insert(schema.portfolioProjects).values(
          data.projectCards.map((p: any) => ({
            ...p,
            images: p.images.length > 0 ? JSON.stringify(p.images) : null,
          }))
        )
      }
    }

    // ── Skill Levels ──
    if (data.skillLevels) {
      await db.delete(schema.portfolioSkillLevels)
      if (data.skillLevels.length > 0) {
        await db.insert(schema.portfolioSkillLevels).values(data.skillLevels)
      }
    }

    // ── Technical Mastery ──
    if (data.technicalMastery) {
      await db.delete(schema.portfolioTechnicalMastery)
      if (data.technicalMastery.length > 0) {
        await db.insert(schema.portfolioTechnicalMastery).values(
          data.technicalMastery.map((m: any) => ({
            ...m,
            skills: m.skills ? JSON.stringify(m.skills) : null,
          }))
        )
      }
    }

    // ── Future Enhancements ──
    if (data.futureEnhancements) {
      await db.delete(schema.portfolioFutureEnhancements)
      if (data.futureEnhancements.length > 0) {
        await db.insert(schema.portfolioFutureEnhancements)
          .values(data.futureEnhancements.map((text: string) => ({ text })))
      }
    }

    // ── Socials ──
    if (data.socials) {
      await db.delete(schema.portfolioSocials)
      if (data.socials.length > 0) {
        await db.insert(schema.portfolioSocials).values(data.socials)
      }
    }

    // ── Stats ──
    if (data.stats) {
      await db.delete(schema.portfolioStats)
      if (data.stats.length > 0) {
        await db.insert(schema.portfolioStats).values(data.stats)
      }
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Save error:', err)
    res.status(500).json({ ok: false, error: 'Failed to save data' })
  }
})

// ─────────────────────────────────────────────
// FEEDBACK
// POST /api/feedback
// ─────────────────────────────────────────────
app.post('/api/feedback', async (req, res) => {
  const { rating, comment, name } = req.body
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ ok: false, error: 'Invalid rating' })
  }
  try {
    await db.insert(schema.feedback).values({
      rating,
      comment: comment || null,
      name: name || null,
      date: new Date().toISOString(),
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('Feedback error:', err)
    res.status(500).json({ ok: false, error: 'Failed to save feedback' })
  }
})

// GET /api/feedback — for admin panel
app.get('/api/feedback', requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(schema.feedback)
      .orderBy(schema.feedback.createdAt)
    res.json({ ok: true, data: rows })
  } catch (err) {
    console.error('Feedback fetch error:', err)
    res.status(500).json({ ok: false, error: 'Failed to fetch feedback' })
  }
})

app.delete('/api/feedback', requireAdmin, async (_req, res) => {
  try {
    await db.delete(schema.feedback)
    res.json({ ok: true })
  } catch (err) {
    console.error('Feedback delete error:', err)
    res.status(500).json({ ok: false, error: 'Failed to delete feedback' })
  }
})

// Keyed hash so stored values can't be reversed back to an IP without AUTH_SECRET.
function hashIp(req: Request) {
  return crypto.createHmac('sha256', AUTH_SECRET!).update('ip:' + (req.ip || 'unknown')).digest('hex')
}

// Country from a CDN/proxy header (Cloudflare / Vercel). null if none present.
function countryOf(req: Request) {
  const c = String(req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || '').toUpperCase()
  return /^[A-Z]{2}$/.test(c) ? c : null
}

const clip = (v: unknown, n: number) => (typeof v === 'string' && v ? v.slice(0, n) : null)

// ─────────────────────────────────────────────
// ANALYTICS: TRACK
// POST /api/track
// ─────────────────────────────────────────────
app.post('/api/track', async (req, res) => {
  const { event, page, session, project, platform } = req.body ?? {}
  const today = new Date().toISOString().slice(0, 10)

  try {
    if (event === 'pageview') {
      await db.insert(schema.visits).values({
        date: today,
        hashedIp: hashIp(req),
        session: clip(session, 64) || 'unknown',
        country: countryOf(req),
        page: clip(page, 256) || '/',
      })
    } else if (event === 'project_view' || event === 'contact_click') {
      await db.insert(schema.events).values({
        type: event,
        project: clip(project, 256),
        platform: clip(platform, 64),
        session: clip(session, 64) || 'unknown',
        date: today,
      })
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('Track error:', err)
    res.status(500).json({ ok: false, error: 'Failed to track event' })
  }
})

// GET /api/analytics — for admin panel (aggregated in SQL)
app.get('/api/analytics', requireAdmin, async (req, res) => {
  try {
    const range = (req.query.range as string) || '7d'
    const day = (offset: number) => new Date(Date.now() - offset * 864e5).toISOString().slice(0, 10)
    const cutoff = range === 'today' ? day(0) : range === '7d' ? day(6) : '2000-01-01'

    const myHash = hashIp(req)
    const ignored = await db.select().from(schema.settings).where(eq(schema.settings.key, 'ignoredIpHash'))
    const selfFiltered = ignored.some(r => r.value === myHash)

    const V = schema.visits
    const E = schema.events
    const visitWhere = and(gte(V.date, cutoff), selfFiltered ? ne(V.hashedIp, myHash) : undefined)
    // events carry no IP; when self-filtering, keep only sessions that have a counted visit
    const validSessions = db.select({ s: V.session }).from(V).where(visitWhere)
    const eventWhere = (type: string) =>
      and(gte(E.date, cutoff), sql`${E.type} = ${type}`, selfFiltered ? inArray(E.session, validSessions) : undefined)

    const [[totals], topCountries, pageViews, dailyChart, projectsViewed, contactClicks] = await Promise.all([
      db.select({ totalVisits: count(), uniqueVisitors: countDistinct(V.hashedIp) }).from(V).where(visitWhere),
      db.select({ country: sql<string>`coalesce(${V.country}, 'XX')`, count: count() })
        .from(V).where(visitWhere).groupBy(sql`1`).orderBy(desc(count())),
      db.select({ page: V.page, count: count() })
        .from(V).where(visitWhere).groupBy(V.page).orderBy(desc(count())),
      db.select({ date: V.date, count: count() })
        .from(V).where(visitWhere).groupBy(V.date).orderBy(V.date),
      db.select({ project: E.project, count: count() })
        .from(E).where(and(eventWhere('project_view'), sql`${E.project} is not null`)).groupBy(E.project).orderBy(desc(count())),
      db.select({ platform: E.platform, count: count() })
        .from(E).where(and(eventWhere('contact_click'), sql`${E.platform} is not null`)).groupBy(E.platform).orderBy(desc(count())),
    ])

    res.json({
      ok: true,
      data: {
        selfFiltered,
        totalVisits: totals.totalVisits,
        uniqueVisitors: totals.uniqueVisitors,
        topCountries,
        pageViews,
        projectsViewed,
        contactClicks,
        dailyChart,
      },
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ ok: false, error: 'Failed to fetch analytics' })
  }
})

// POST /api/analytics/ignore-self
app.post('/api/analytics/ignore-self', requireAdmin, async (req, res) => {
  try {
    const { action } = req.body
    const myHashedIp = hashIp(req)

    if (action === 'ignore') {
      const existing = await db.select().from(schema.settings).where(eq(schema.settings.key, 'ignoredIpHash'))
      if (existing.length > 0) {
        await db.update(schema.settings).set({ value: myHashedIp }).where(eq(schema.settings.key, 'ignoredIpHash'))
      } else {
        await db.insert(schema.settings).values({ key: 'ignoredIpHash', value: myHashedIp })
      }
    } else {
      await db.delete(schema.settings).where(eq(schema.settings.key, 'ignoredIpHash'))
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('Ignore self error:', err)
    res.status(500).json({ ok: false, error: 'Failed to update ignore status' })
  }
})

// DELETE /api/analytics
app.delete('/api/analytics', requireAdmin, async (_req, res) => {
  try {
    await db.delete(schema.visits)
    await db.delete(schema.events)
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete analytics error:', err)
    res.status(500).json({ ok: false, error: 'Failed to delete analytics' })
  }
})

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
async function seedAdmin() {
  // Admin password comes from ADMIN_PASSWORD env only. Set/changed there => hash is upserted on boot.
  const pw = process.env.ADMIN_PASSWORD
  try {
    const existing = await db.select().from(schema.admins).where(eq(schema.admins.username, 'admin')).limit(1)
    if (!pw) {
      if (existing.length === 0) console.warn('⚠️ No admin user and ADMIN_PASSWORD not set — login disabled.')
      return
    }
    if (pw.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters')
    if (existing.length > 0 && verifyPassword(pw, existing[0].password)) return
    const password = hashPassword(pw)
    if (existing.length > 0) {
      await db.update(schema.admins).set({ password, updatedAt: new Date() }).where(eq(schema.admins.id, existing[0].id))
    } else {
      await db.insert(schema.admins).values({ username: 'admin', password })
    }
    console.log('✅ Admin password set from ADMIN_PASSWORD.')
  } catch (err) {
    console.error('Failed to set admin password:', err)
  }
}

seedAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
  })
})
