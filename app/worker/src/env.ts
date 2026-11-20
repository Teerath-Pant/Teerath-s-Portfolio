export type Env = {
  DB: D1Database
  // plain var (wrangler.jsonc): comma-separated list of allowed browser origins
  ALLOWED_ORIGINS: string
  // secrets (`wrangler secret put` in prod, `.dev.vars` locally)
  AUTH_SECRET: string
  ADMIN_PASSWORD_HASH: string
  IMAGES: KVNamespace
  // rate limit bindings (wrangler.jsonc `ratelimits`); optional so the Worker still runs without them
  LOGIN_LIMITER?: RateLimit
  FEEDBACK_LIMITER?: RateLimit
  TRACK_LIMITER?: RateLimit
}

export type AppEnv = { Bindings: Env }
