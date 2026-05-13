import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { createHash } from 'crypto'
import mysql from 'mysql2/promise'
import * as dotenv from 'dotenv'

// Load environment variables from the server directory
dotenv.config({ path: resolve(__dirname, '../server/.env') })

const pool = mysql.createPool(process.env.DATABASE_URL || 'mysql://root:@localhost:3306/portfolio_db')

// ── Hash an IP address (SHA-256, first 16 chars — irreversible) ──
function hashIp(ip) {
  return createHash('sha256').update(ip + 'portfolio_salt_2026').digest('hex').slice(0, 16)
}

// ── Extract real client IP ──
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '0.0.0.0'
}

// ── Free geo-lookup via ip-api.com (45 req/min, no key needed) ──
async function getCountry(ip) {
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'LOCAL'
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,status`, { signal: AbortSignal.timeout(2000) })
    const json = await res.json()
    return json.status === 'success' ? (json.countryCode || 'XX') : 'XX'
  } catch {
    return 'XX'
  }
}

// ── Today's date string YYYY-MM-DD ──
function today() {
  return new Date().toISOString().slice(0, 10)
}

// ── CORS headers helper ──
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')
}

// ── JSON body parser helper ──
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')) }
      catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

// ── Custom plugin: analytics + feedback + portfolio save ──
function portfolioWriterPlugin() {
  return {
    name: 'portfolio-writer',
    configureServer(server) {

      server.middlewares.use('/api', (req, res, next) => {
        if (req.method === 'OPTIONS') {
          setCors(res)
          res.statusCode = 204
          res.end()
          return
        }
        next()
      })

      // ─────────────────────────────────────────────────────────
      // ANALYTICS: POST /api/track
      // ─────────────────────────────────────────────────────────
      server.middlewares.use('/api/track', async (req, res, next) => {
        const pathOnly = req.url.split('?')[0]
        if (pathOnly !== '/' && pathOnly !== '') return next()
        if (req.method !== 'POST') return next()

        setCors(res)
        const body = await parseBody(req)
        const { event = 'pageview', page = '/', session, project, platform } = body

        const rawIp = getClientIp(req)
        const hashedIp = hashIp(rawIp)

        try {
          // Check self-filter
          const [settings] = await pool.execute('SELECT value FROM settings WHERE `key` = ?', ['ignoredIpHash'])
          const ignoredIpHash = settings[0]?.value

          if (ignoredIpHash && ignoredIpHash === hashedIp) {
            res.end(JSON.stringify({ ok: true, filtered: true }))
            return
          }

          const dateStr = today()

          if (event === 'pageview') {
            // Deduplicate: same session + same page on same day
            const [existing] = await pool.execute(
              'SELECT id FROM visits WHERE session = ? AND page = ? AND date = ?',
              [session, page, dateStr]
            )
            if (existing.length === 0) {
              const country = await getCountry(rawIp)
              await pool.execute(
                'INSERT INTO visits (date, hashed_ip, session, country, page) VALUES (?, ?, ?, ?, ?)',
                [dateStr, hashedIp, session, country, page]
              )
            }
          } else if (event === 'project_view') {
            await pool.execute(
              'INSERT INTO events (type, project, session, date) VALUES (?, ?, ?, ?)',
              ['project_view', project, session, dateStr]
            )
          } else if (event === 'contact_click') {
            await pool.execute(
              'INSERT INTO events (type, platform, session, date) VALUES (?, ?, ?, ?)',
              ['contact_click', platform, session, dateStr]
            )
          }
          res.end(JSON.stringify({ ok: true }))
        } catch (err) {
          console.error(err)
          res.end(JSON.stringify({ ok: false, error: String(err) }))
        }
      })

      // ─────────────────────────────────────────────────────────
      // ANALYTICS: GET & DELETE /api/analytics
      // ─────────────────────────────────────────────────────────
      server.middlewares.use('/api/analytics', async (req, res, next) => {
        const pathOnly = req.url.split('?')[0]
        if (pathOnly !== '/' && pathOnly !== '') return next()

        setCors(res)

        if (req.method === 'DELETE') {
          try {
            await pool.execute('TRUNCATE TABLE visits')
            await pool.execute('TRUNCATE TABLE events')
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
          return
        }

        if (req.method === 'GET') {
          try {
            const url = new URL(req.url || '/', 'http://localhost')
            const range = url.searchParams.get('range') || 'all'

            let dateFilter = ''
            let params = []
            if (range === 'today') {
              dateFilter = 'WHERE date >= ?'
              params = [today()]
            } else if (range === '7d') {
              dateFilter = 'WHERE date >= ?'
              const d = new Date()
              d.setDate(d.getDate() - 7)
              params = [d.toISOString().slice(0, 10)]
            }

            const [visitsData] = await pool.execute(`SELECT date, hashed_ip, country, page FROM visits ${dateFilter}`, params)
            const [eventsData] = await pool.execute(`SELECT type, project, platform, date FROM events ${dateFilter}`, params)
            const [settings] = await pool.execute('SELECT value FROM settings WHERE `key` = ?', ['ignoredIpHash'])

            const totalVisits = visitsData.length
            const uniqueVisitors = new Set(visitsData.map(v => v.hashed_ip)).size

            const countryCounts = {}
            const pageCounts = {}
            visitsData.forEach(v => {
              countryCounts[v.country] = (countryCounts[v.country] || 0) + 1
              pageCounts[v.page] = (pageCounts[v.page] || 0) + 1
            })

            const topCountries = Object.entries(countryCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([country, count]) => ({ country, count }))

            const pageViews = Object.entries(pageCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([page, count]) => ({ page, count }))

            const projectCounts = {}
            const contactCounts = {}
            eventsData.forEach(e => {
              if (e.type === 'project_view') projectCounts[e.project] = (projectCounts[e.project] || 0) + 1
              if (e.type === 'contact_click') contactCounts[e.platform] = (contactCounts[e.platform] || 0) + 1
            })

            const projectsViewed = Object.entries(projectCounts).sort((a, b) => b[1] - a[1]).map(([project, count]) => ({ project, count }))
            const contactClicks = Object.entries(contactCounts).sort((a, b) => b[1] - a[1]).map(([platform, count]) => ({ platform, count }))

            const daily = {}
            for (let i = 6; i >= 0; i--) {
              const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
              daily[d] = 0
            }
            visitsData.forEach(v => { if (daily[v.date] !== undefined) daily[v.date]++ })
            const dailyChart = Object.entries(daily).map(([date, count]) => ({ date, count }))

            res.end(JSON.stringify({
              ok: true,
              data: {
                totalVisits, uniqueVisitors, topCountries, projectsViewed, contactClicks, pageViews, dailyChart,
                selfFiltered: !!settings[0]?.value
              }
            }))
          } catch (err) {
            console.error(err)
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
          return
        }
        next()
      })

      // ─────────────────────────────────────────────────────────
      // SELF-FILTER: GET /api/analytics/myip
      // ─────────────────────────────────────────────────────────
      server.middlewares.use('/api/analytics/myip', async (req, res, next) => {
        if (req.method !== 'GET') return next()
        setCors(res)
        const rawIp = getClientIp(req)
        const hashedIp = hashIp(rawIp)
        try {
          const [settings] = await pool.execute('SELECT value FROM settings WHERE `key` = ?', ['ignoredIpHash'])
          const isIgnored = settings[0]?.value === hashedIp
          res.end(JSON.stringify({ ok: true, hashedIp, isIgnored }))
        } catch (err) {
          res.end(JSON.stringify({ ok: false, error: String(err) }))
        }
      })

      // ─────────────────────────────────────────────────────────
      // SELF-FILTER: POST /api/analytics/ignore-self
      // ─────────────────────────────────────────────────────────
      server.middlewares.use('/api/analytics/ignore-self', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        setCors(res)
        const body = await parseBody(req)
        const rawIp = getClientIp(req)
        const hashedIp = hashIp(rawIp)

        try {
          if (body.action === 'ignore') {
            await pool.execute('INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?', ['ignoredIpHash', hashedIp, hashedIp])
          } else {
            await pool.execute('DELETE FROM settings WHERE `key` = ?', ['ignoredIpHash'])
          }
          res.end(JSON.stringify({ ok: true }))
        } catch (err) {
          res.end(JSON.stringify({ ok: false, error: String(err) }))
        }
      })

      // ─────────────────────────────────────────────────────────
      // FEEDBACK: POST, GET, DELETE /api/feedback
      // ─────────────────────────────────────────────────────────
      server.middlewares.use('/api/feedback', async (req, res, next) => {
        setCors(res)

        if (req.method === 'DELETE') {
          try {
            await pool.execute('TRUNCATE TABLE feedback')
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
          return
        }

        if (req.method === 'POST') {
          try {
            const body = await parseBody(req)
            const { rating, comment, name } = body
            await pool.execute(
              'INSERT INTO feedback (rating, comment, name, date) VALUES (?, ?, ?, ?)',
              [Number(rating) || 0, comment || '', name || 'Anonymous', new Date().toISOString()]
            )
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
          return
        }

        if (req.method === 'GET') {
          try {
            const [feedback] = await pool.execute('SELECT id, rating, comment, name, date FROM feedback ORDER BY id DESC')
            res.end(JSON.stringify({ ok: true, data: feedback }))
          } catch (err) {
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
          return
        }

        next()
      })

      // ─────────────────────────────────────────────────────────
      // PORTFOLIO SAVE: POST /api/save
      // ─────────────────────────────────────────────────────────
      server.middlewares.use('/api/save', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        const body = await parseBody(req)
        try {
          const conn = await pool.getConnection()
          try {
            await conn.beginTransaction()

            await conn.execute('TRUNCATE TABLE portfolio_profile')
            if (body.profile) {
              await conn.execute('INSERT INTO portfolio_profile (name, title, location, headline, subtext, available_for_work) VALUES (?, ?, ?, ?, ?, ?)', [body.profile.name, body.profile.title, body.profile.location, body.profile.headline, body.profile.subtext, body.profile.availableForWork ? 1 : 0])
            }

            await conn.execute('TRUNCATE TABLE portfolio_goals')
            if (body.goals) {
              for (const g of body.goals) await conn.execute('INSERT INTO portfolio_goals (text) VALUES (?)', [g])
            }

            await conn.execute('TRUNCATE TABLE portfolio_audience')
            if (body.audience) {
              for (const a of body.audience) await conn.execute('INSERT INTO portfolio_audience (text) VALUES (?)', [a])
            }

            await conn.execute('TRUNCATE TABLE portfolio_bio_points')
            if (body.bioPoints) {
              for (const bp of body.bioPoints) await conn.execute('INSERT INTO portfolio_bio_points (icon, label, value) VALUES (?, ?, ?)', [bp.icon, bp.label, bp.value])
            }

            await conn.execute('TRUNCATE TABLE portfolio_projects')
            if (body.projectCards) {
              for (const p of body.projectCards) await conn.execute('INSERT INTO portfolio_projects (title, description, tag, link) VALUES (?, ?, ?, ?)', [p.title, p.description, p.tag, p.link])
            }

            await conn.execute('TRUNCATE TABLE portfolio_skill_levels')
            if (body.skillLevels) {
              for (const s of body.skillLevels) await conn.execute('INSERT INTO portfolio_skill_levels (label, value) VALUES (?, ?)', [s.label, s.value])
            }

            await conn.execute('TRUNCATE TABLE portfolio_technical_mastery')
            if (body.technicalMastery) {
              for (const tm of body.technicalMastery) await conn.execute('INSERT INTO portfolio_technical_mastery (title, icon, skills) VALUES (?, ?, ?)', [tm.title, tm.icon, JSON.stringify(tm.skills || [])])
            }

            await conn.execute('TRUNCATE TABLE portfolio_future_enhancements')
            if (body.futureEnhancements) {
              for (const fe of body.futureEnhancements) await conn.execute('INSERT INTO portfolio_future_enhancements (text) VALUES (?)', [fe])
            }

            await conn.execute('TRUNCATE TABLE portfolio_socials')
            if (body.socials) {
              for (const s of body.socials) await conn.execute('INSERT INTO portfolio_socials (label, href, platform) VALUES (?, ?, ?)', [s.label, s.href, s.platform])
            }

            await conn.execute('TRUNCATE TABLE portfolio_stats')
            if (body.stats) {
              for (const s of body.stats) await conn.execute('INSERT INTO portfolio_stats (value, label) VALUES (?, ?)', [s.value, s.label])
            }

            await conn.commit()
          } catch (e) {
            await conn.rollback()
            throw e
          } finally {
            conn.release()
          }

          const outputPath = resolve(__dirname, '../web/src/data/portfolioData.js')
          const fileContent = generatePortfolioData(body)
          writeFileSync(outputPath, fileContent, 'utf-8')
          setCors(res)
          res.end(JSON.stringify({ ok: true }))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: String(err) }))
        }
      })

      // ─────────────────────────────────────────────────────────
      // PORTFOLIO LOAD: GET /api/load
      // ─────────────────────────────────────────────────────────
      server.middlewares.use('/api/load', async (req, res) => {
        setCors(res)
        try {
          const [profiles] = await pool.execute('SELECT * FROM portfolio_profile LIMIT 1')
          if (profiles.length === 0) {
            return res.end(JSON.stringify({ ok: true, data: null, message: 'use client-side defaults' }))
          }
          
          const profile = { ...profiles[0], availableForWork: !!profiles[0].available_for_work }
          const [goalsRows] = await pool.execute('SELECT text FROM portfolio_goals')
          const [audienceRows] = await pool.execute('SELECT text FROM portfolio_audience')
          const [bioPointsRows] = await pool.execute('SELECT icon, label, value FROM portfolio_bio_points')
          const [projectCardsRows] = await pool.execute('SELECT title, description, tag, link FROM portfolio_projects')
          const [skillLevelsRows] = await pool.execute('SELECT label, value FROM portfolio_skill_levels')
          const [techMasteryRows] = await pool.execute('SELECT title, icon, skills FROM portfolio_technical_mastery')
          const [feRows] = await pool.execute('SELECT text FROM portfolio_future_enhancements')
          const [socialsRows] = await pool.execute('SELECT label, href, platform FROM portfolio_socials')
          const [statsRows] = await pool.execute('SELECT value, label FROM portfolio_stats')

          const data = {
            profile,
            goals: goalsRows.map(r => r.text),
            audience: audienceRows.map(r => r.text),
            bioPoints: bioPointsRows,
            projectCards: projectCardsRows,
            skillLevels: skillLevelsRows,
            technicalMastery: techMasteryRows.map(r => ({ ...r, skills: r.skills ? JSON.parse(r.skills) : [] })),
            futureEnhancements: feRows.map(r => r.text),
            socials: socialsRows,
            stats: statsRows
          }

          res.end(JSON.stringify({ ok: true, data }))
        } catch (err) {
          res.end(JSON.stringify({ ok: false, error: String(err) }))
        }
      })
    },
  }
}

function generatePortfolioData(d) {
  return `// ── Auto-generated by Portfolio Admin ── DO NOT EDIT MANUALLY ──
// Last updated: ${new Date().toISOString()}

export const profile = ${JSON.stringify(d.profile, null, 2)}

export const goals = ${JSON.stringify(d.goals, null, 2)}

export const audience = ${JSON.stringify(d.audience, null, 2)}

export const bioPoints = ${JSON.stringify(d.bioPoints, null, 2)}

export const projectCards = ${JSON.stringify(d.projectCards, null, 2)}

export const skillLevels = ${JSON.stringify(d.skillLevels, null, 2)}

export const technicalMastery = ${JSON.stringify(d.technicalMastery || [], null, 2)}

export const futureEnhancements = ${JSON.stringify(d.futureEnhancements, null, 2)}

export const socials = ${JSON.stringify(d.socials, null, 2)}

export const stats = ${JSON.stringify(d.stats, null, 2)}
`
}

export default defineConfig({
  plugins: [react(), portfolioWriterPlugin()],
  server: {
    port: 5001,
    cors: true,
  },
})
