import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, count, desc, eq, gte, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { AppEnv, Env } from './env'
import { requireAdmin } from './auth'
import { tooMany } from './util'
import { contactMessages } from './db/schema'
import { renderContactEmail, renderVisitorEmail } from './emailTemplate'
import { sendResend, sendSmtp, smtpConfigured, type Mail } from './mail'

export const contactRoutes = new Hono<AppEnv>()

// Stay well under the mail providers' daily quotas and never let a flood fill the inbox.
// Messages above the cap are still saved and shown in the admin panel, just not emailed.
const MAX_EMAILED_MESSAGES_PER_DAY = 30

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().pipe(z.email().max(200)),
  message: z.string().trim().min(1).max(5000),
})

type Saved = { id: number; name: string; email: string; message: string }

// Runs after the response: emails the owner, and (SMTP only) confirms to the visitor.
// Results are stored on the row so the admin panel shows what happened. Never throws.
async function notify(env: Env, db: ReturnType<typeof drizzle>, m: Saved) {
  const [today] = await db.select({ n: count() }).from(contactMessages).where(gte(contactMessages.createdAt, sql`date('now')`))
  if (today.n > MAX_EMAILED_MESSAGES_PER_DAY) {
    await db.update(contactMessages).set({ notified: 'skipped: daily email cap reached' }).where(eq(contactMessages.id, m.id))
    return
  }

  const owner = env.CONTACT_TO_EMAIL
  if (!owner) {
    await db.update(contactMessages).set({ notified: 'skipped: email not configured' }).where(eq(contactMessages.id, m.id))
    return
  }

  const ownerMail: Mail = {
    to: owner,
    replyTo: m.email, // pressing Reply answers the visitor
    ...renderContactEmail({ ...m, receivedAt: new Date(), adminUrl: env.ADMIN_URL }),
  }

  if (!smtpConfigured(env)) {
    // No SMTP: owner notification via Resend if configured; visitors cannot be emailed this way.
    const status = await sendResend(env, ownerMail)
    await db.update(contactMessages).set({ notified: status, confirmation: 'skipped: smtp not configured' }).where(eq(contactMessages.id, m.id))
    return
  }

  // At most one confirmation per visitor address per day, so the form cannot be used to keep mailing someone else.
  const [recent] = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(
      and(
        eq(contactMessages.email, m.email),
        ne(contactMessages.id, m.id),
        eq(contactMessages.confirmation, 'sent'),
        gte(contactMessages.createdAt, sql`datetime('now', '-1 day')`),
      ),
    )
  const confirm = recent.n === 0
  const mails: Mail[] = [ownerMail]
  if (confirm) {
    // Reply goes to the owner's real inbox, even if SMTP sends from a separate mailbox.
    mails.push({ to: m.email, replyTo: owner, ...renderVisitorEmail({ name: m.name, siteUrl: env.SITE_URL }) })
  }

  const [ownerStatus, confirmStatus] = await sendSmtp(env, mails)
  await db
    .update(contactMessages)
    .set({ notified: ownerStatus, confirmation: confirm ? confirmStatus : 'skipped: already confirmed in the last 24h' })
    .where(eq(contactMessages.id, m.id))
}

// Public: visitors send a message (3 per minute per IP).
contactRoutes.post('/', async (c) => {
  if (await tooMany(c.env.CONTACT_LIMITER, c)) {
    return c.json({ ok: false, error: 'Too many messages. Please try again in a minute.' }, 429)
  }
  const body = contactSchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    const field = String(body.error.issues[0]?.path[0] ?? 'message')
    return c.json({ ok: false, error: `Please check your ${field}.` }, 400)
  }

  const db = drizzle(c.env.DB)
  const [saved] = await db.insert(contactMessages).values(body.data).returning({ id: contactMessages.id })

  // Email after responding, so a slow or failing mail service never blocks or fails the visitor's submit.
  c.executionCtx.waitUntil(notify(c.env, db, { id: saved.id, ...body.data }).catch((e) => console.error('contact notify failed', e)))
  return c.json({ ok: true })
})

// Admin: newest 200 (private, never cached).
contactRoutes.get('/', requireAdmin, async (c) => {
  const rows = await drizzle(c.env.DB).select().from(contactMessages).orderBy(desc(contactMessages.id)).limit(200)
  c.header('Cache-Control', 'no-store')
  return c.json({ ok: true, data: rows })
})

contactRoutes.post('/:id/read', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  const body = z.object({ read: z.boolean() }).safeParse(await c.req.json().catch(() => null))
  if (!Number.isInteger(id) || !body.success) return c.json({ ok: false, error: 'Invalid request' }, 400)
  await drizzle(c.env.DB).update(contactMessages).set({ read: body.data.read }).where(eq(contactMessages.id, id))
  return c.json({ ok: true })
})

contactRoutes.delete('/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ ok: false, error: 'Invalid id' }, 400)
  await drizzle(c.env.DB).delete(contactMessages).where(eq(contactMessages.id, id))
  return c.json({ ok: true })
})
