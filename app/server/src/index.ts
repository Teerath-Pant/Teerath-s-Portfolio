import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from './db/schema'

config()

const app = express()
const PORT = process.env.PORT || 5001

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
app.use(express.json())

// ── Database ──
const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'Backend is running 🚀' })
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

    const data = {
      profile,
      goals:               goalRows.map(r => r.text),
      audience:            audienceRows.map(r => r.text),
      bioPoints:           bioRows,
      projectCards:        projectRows.map(r => ({
        ...r,
        images: r.images ? JSON.parse(r.images) : [],
      })),
      skillLevels:         skillRows,
      technicalMastery:    masteryRows.map(r => ({
        ...r,
        skills: r.skills ? JSON.parse(r.skills) : [],
      })),
      futureEnhancements:  enhancementRows.map(r => r.text),
      socials:             socialRows,
      stats:               statRows,
    }

    res.json({ ok: true, data })
  } catch (err) {
    console.error('Load error:', err)
    res.status(500).json({ ok: false, error: 'Failed to load data' })
  }
})

// ─────────────────────────────────────────────
// PORTFOLIO: SAVE
// POST /api/save
// ─────────────────────────────────────────────
app.post('/api/save', async (req, res) => {
  const data = req.body
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
            images: p.images ? JSON.stringify(p.images) : null,
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
app.get('/api/feedback', async (_req, res) => {
  try {
    const rows = await db.select().from(schema.feedback)
      .orderBy(schema.feedback.createdAt)
    res.json({ ok: true, data: rows })
  } catch (err) {
    console.error('Feedback fetch error:', err)
    res.status(500).json({ ok: false, error: 'Failed to fetch feedback' })
  }
})

// ─────────────────────────────────────────────
// ANALYTICS: TRACK
// POST /api/track
// ─────────────────────────────────────────────
app.post('/api/track', async (req, res) => {
  const { event, page, session, project, platform } = req.body
  const today = new Date().toISOString().slice(0, 10)

  try {
    if (event === 'pageview') {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
      const hashedIp = Buffer.from(ip.toString()).toString('base64').slice(0, 64)
      await db.insert(schema.visits).values({
        date: today,
        hashedIp,
        session: session || 'unknown',
        page: page || '/',
      })
    } else if (event === 'project_view' || event === 'contact_click') {
      await db.insert(schema.events).values({
        type: event,
        project: project || null,
        platform: platform || null,
        session: session || 'unknown',
        date: today,
      })
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('Track error:', err)
    res.status(500).json({ ok: false, error: 'Failed to track event' })
  }
})

// GET /api/analytics — for admin panel
app.get('/api/analytics', async (_req, res) => {
  try {
    const [visitRows, eventRows] = await Promise.all([
      db.select().from(schema.visits).orderBy(schema.visits.createdAt),
      db.select().from(schema.events).orderBy(schema.events.createdAt),
    ])
    res.json({ ok: true, visits: visitRows, events: eventRows })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ ok: false, error: 'Failed to fetch analytics' })
  }
})

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})