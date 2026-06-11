import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from './db/schema'
import fs from 'fs'
import path from 'path'

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

// Log loaded database URL
try {
  const bootLogPath = path.join(__dirname, '../boot.log');
  fs.writeFileSync(bootLogPath, `[${new Date().toISOString()}] Server starting. DATABASE_URL: ${process.env.DATABASE_URL}\n`, 'utf8');
} catch (e) {}

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
// FILE UPLOAD
// POST /api/upload
// ─────────────────────────────────────────────
app.post('/api/upload', async (req, res) => {
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

function writePortfolioDataFile(data: any) {
  const filePath = path.resolve(__dirname, '../../web/src/data/portfolioData.js')
  const content = `// ── Auto-generated by Portfolio Admin ── DO NOT EDIT MANUALLY ──
// Last updated: ${new Date().toISOString()}

export const profile = ${JSON.stringify(data.profile || {}, null, 2)}

export const goals = ${JSON.stringify(data.goals || [], null, 2)}

export const audience = ${JSON.stringify(data.audience || [], null, 2)}

export const bioPoints = ${JSON.stringify(data.bioPoints || [], null, 2)}

export const projectCards = ${JSON.stringify(data.projectCards || [], null, 2)}

export const skillLevels = ${JSON.stringify(data.skillLevels || [], null, 2)}

export const technicalMastery = ${JSON.stringify(data.technicalMastery || [], null, 2)}

export const futureEnhancements = ${JSON.stringify(data.futureEnhancements || [], null, 2)}

export const socials = ${JSON.stringify(data.socials || [], null, 2)}

export const stats = ${JSON.stringify(data.stats || [], null, 2)}
`
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ Statically generated portfolioData.js at ${filePath}`)
  } catch (err) {
    console.error('Failed to write portfolioData.js:', err)
  }
}

// ─────────────────────────────────────────────
// PORTFOLIO: SAVE
// POST /api/save
// ─────────────────────────────────────────────
app.post('/api/save', async (req, res) => {
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

    // Write statically generated portfolioData.js file for hot-reloads/static builds
    writePortfolioDataFile(data)

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
app.get('/api/analytics', async (req, res) => {
  try {
    const range = (req.query.range as string) || '7d'
    const cutoff = new Date()
    if (range === 'today') cutoff.setDate(cutoff.getDate() - 1)
    else if (range === '7d') cutoff.setDate(cutoff.getDate() - 7)
    else cutoff.setFullYear(2000)

    const [visitRows, eventRows, settingsRows] = await Promise.all([
      db.select().from(schema.visits),
      db.select().from(schema.events),
      db.select().from(schema.settings).where(eq(schema.settings.key, 'ignoredIpHash'))
    ])

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    const myHashedIp = Buffer.from(ip.toString()).toString('base64').slice(0, 64)

    const ignoredHashes = settingsRows.map((r: any) => r.value)
    const selfFiltered = ignoredHashes.includes(myHashedIp)

    let validVisits = visitRows.filter((v: any) => new Date(v.date) >= cutoff)
    let validEvents = eventRows.filter((e: any) => new Date(e.date) >= cutoff)

    if (selfFiltered) {
      validVisits = validVisits.filter((v: any) => !ignoredHashes.includes(v.hashedIp))
      const validSessions = new Set(validVisits.map((v: any) => v.session))
      validEvents = validEvents.filter((e: any) => validSessions.has(e.session))
    }

    const totalVisits = validVisits.length
    const uniqueVisitors = new Set(validVisits.map((v: any) => v.hashedIp)).size
    
    const countryCounts: Record<string, number> = {}
    const pageCounts: Record<string, number> = {}
    validVisits.forEach((v: any) => {
      const c = v.country || 'XX'
      countryCounts[c] = (countryCounts[c] || 0) + 1
      pageCounts[v.page] = (pageCounts[v.page] || 0) + 1
    })

    const topCountries = Object.entries(countryCounts).map(([country, count]) => ({ country, count })).sort((a,b) => b.count - a.count)
    const pageViews = Object.entries(pageCounts).map(([page, count]) => ({ page, count })).sort((a,b) => b.count - a.count)

    const projectCounts: Record<string, number> = {}
    const contactCounts: Record<string, number> = {}
    validEvents.forEach((e: any) => {
      if (e.type === 'project_view' && e.project) {
        projectCounts[e.project] = (projectCounts[e.project] || 0) + 1
      } else if (e.type === 'contact_click' && e.platform) {
        contactCounts[e.platform] = (contactCounts[e.platform] || 0) + 1
      }
    })

    const projectsViewed = Object.entries(projectCounts).map(([project, count]) => ({ project, count })).sort((a,b) => b.count - a.count)
    const contactClicks = Object.entries(contactCounts).map(([platform, count]) => ({ platform, count })).sort((a,b) => b.count - a.count)

    const dailyCounts: Record<string, number> = {}
    validVisits.forEach((v: any) => {
      dailyCounts[v.date] = (dailyCounts[v.date] || 0) + 1
    })
    const dailyChart = Object.entries(dailyCounts).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date))

    res.json({
      ok: true,
      data: {
        selfFiltered,
        totalVisits,
        uniqueVisitors,
        topCountries,
        pageViews,
        projectsViewed,
        contactClicks,
        dailyChart
      }
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ ok: false, error: 'Failed to fetch analytics' })
  }
})

// POST /api/analytics/ignore-self
app.post('/api/analytics/ignore-self', async (req, res) => {
  try {
    const { action } = req.body
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    const myHashedIp = Buffer.from(ip.toString()).toString('base64').slice(0, 64)

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
app.delete('/api/analytics', async (_req, res) => {
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
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})

