import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Context } from 'hono'
import type { AppEnv } from './env'
import { authRoutes } from './auth'
import { portfolioRoutes } from './portfolio'
import { feedbackRoutes } from './feedback'
import { analyticsRoutes } from './analytics'
import { imageRoutes } from './images'

const app = new Hono<AppEnv>()

// CORS: only the origins listed in ALLOWED_ORIGINS get Access-Control-Allow-Origin.
// (Browser-only protection; admin routes are protected by the bearer token.)
app.use(
  '/api/*',
  cors({
    origin: (origin, c: Context<AppEnv>) =>
      c.env.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim()).includes(origin) ? origin : null,
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86400,
  }),
)

app.get('/', (c) => c.json({ ok: true, message: 'Portfolio API' }))
app.route('/api/admin', authRoutes)
app.route('/api/feedback', feedbackRoutes)
app.route('/api', portfolioRoutes)
app.route('/api', analyticsRoutes)
app.route('/api', imageRoutes)

app.notFound((c) => c.json({ ok: false, error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ ok: false, error: 'Internal server error' }, 500)
})

export default app
