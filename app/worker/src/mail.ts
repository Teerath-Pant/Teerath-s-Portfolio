import { WorkerMailer } from 'worker-mailer'
import type { Env } from './env'
import { cleanCredentials, credentialHint } from './smtpCredentials'

export type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string }

/** SMTP (e.g. Gmail) is used when a username and app password are configured. */
export const smtpConfigured = (env: Env) => !!(env.SMTP_USER && env.SMTP_PASS)

const short = (e: unknown) => (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').slice(0, 150)

/**
 * Sends the mails over ONE SMTP connection. Never throws: returns one status string per mail
 * ('sent' or 'failed: ...'). Defaults are Gmail over implicit TLS (smtp.gmail.com:465).
 * Credentials never appear in the returned text.
 */
export async function sendSmtp(env: Env, mails: Mail[]): Promise<string[]> {
  const host = env.SMTP_HOST || 'smtp.gmail.com'
  const { user, pass } = cleanCredentials(host, env.SMTP_USER!, env.SMTP_PASS!)
  let mailer: WorkerMailer
  try {
    mailer = await WorkerMailer.connect({
      host,
      port: Number(env.SMTP_PORT) || 465,
      secure: (env.SMTP_SECURE ?? 'true') !== 'false', // implicit TLS on 465
      startTls: false,
      credentials: { username: user, password: pass },
      authType: 'plain',
    })
  } catch (e) {
    const failure = `failed: smtp connect: ${short(e)}${credentialHint(host, env.SMTP_USER!, env.SMTP_PASS!)}`
    return mails.map(() => failure)
  }

  const results: string[] = []
  for (const m of mails) {
    try {
      await mailer.send({
        from: { name: env.CONTACT_FROM_NAME || 'Portfolio', email: user },
        to: m.to,
        reply: m.replyTo,
        subject: m.subject,
        html: m.html,
        text: m.text,
      })
      results.push('sent')
    } catch (e) {
      results.push(`failed: smtp send: ${short(e)}`)
    }
  }
  await mailer.close().catch(() => {})
  return results
}

/** Fallback when SMTP is not configured: Resend (can only deliver to the Resend account's own address on the test sender). */
export async function sendResend(env: Env, m: Mail): Promise<string> {
  if (!env.RESEND_API_KEY) return 'skipped: email not configured'
  try {
    const res = await fetch(env.RESEND_API_URL ?? 'https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'portfolio-worker/1.0', // Resend rejects requests without one
      },
      body: JSON.stringify({
        from: 'Portfolio <onboarding@resend.dev>',
        to: [m.to],
        reply_to: m.replyTo,
        subject: m.subject,
        html: m.html,
        text: m.text,
      }),
    })
    if (res.ok) return 'sent'
    return `failed: HTTP ${res.status} ${(await res.text()).slice(0, 150)}`
  } catch {
    return 'failed: network error'
  }
}
