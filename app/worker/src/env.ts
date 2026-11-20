export type Env = {
  DB: D1Database
  // plain var (wrangler.jsonc): comma-separated list of allowed browser origins
  ALLOWED_ORIGINS: string
  // secrets (`wrangler secret put` in prod, `.dev.vars` locally)
  AUTH_SECRET: string
  ADMIN_PASSWORD_HASH: string
  IMAGES: KVNamespace
  // contact-form email (Resend). Without RESEND_API_KEY messages are still saved, just not emailed.
  CONTACT_TO_EMAIL?: string
  SITE_URL?: string // linked from the visitor's confirmation email
  CONTACT_FROM_NAME?: string
  // SMTP (e.g. Gmail). SMTP_USER and SMTP_PASS are secrets; with both set, SMTP is used instead of Resend.
  SMTP_USER?: string
  SMTP_PASS?: string // for Gmail: an app password, never the account password
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_SECURE?: string // 'false' only for local tests against a plain-text mock server
  ADMIN_URL?: string // linked from the notification email
  RESEND_API_KEY?: string // secret
  RESEND_API_URL?: string // only for tests (a local mock server)
  // rate limit bindings (wrangler.jsonc `ratelimits`); optional so the Worker still runs without them
  LOGIN_LIMITER?: RateLimit
  FEEDBACK_LIMITER?: RateLimit
  TRACK_LIMITER?: RateLimit
  CONTACT_LIMITER?: RateLimit
}

export type AppEnv = { Bindings: Env }
