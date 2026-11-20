import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import type { AppEnv } from './env'
import { requireAdmin } from './auth'

export const imageRoutes = new Hono<AppEnv>()

const MAX_BYTES = 10 * 1024 * 1024 // KV allows 25 MiB per value; 10 MB is a sanity cap for a portfolio
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const GRACE_MS = 60 * 60 * 1000 // never prune an image uploaded in the last hour (admin may not have hit Save yet)

// Real type from the file's first bytes (the client's Content-Type is not trusted). SVG is deliberately not allowed.
function sniff(b: Uint8Array): string | null {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp'
  return null
}

// Admin: raw image bytes in the request body -> { url: '/api/img/<id>' }
imageRoutes.post(
  '/upload',
  requireAdmin,
  bodyLimit({ maxSize: MAX_BYTES, onError: (c) => c.json({ ok: false, error: 'Image too large (max 10 MB)' }, 413) }),
  async (c) => {
    const bytes = await c.req.arrayBuffer()
    const type = bytes.byteLength ? sniff(new Uint8Array(bytes, 0, Math.min(12, bytes.byteLength))) : null
    if (!type) return c.json({ ok: false, error: 'Only PNG, JPEG, GIF or WebP images are allowed' }, 400)

    const id = crypto.randomUUID()
    await c.env.IMAGES.put(id, bytes, { metadata: { type, uploadedAt: Date.now() } })
    return c.json({ ok: true, url: `/api/img/${id}` })
  },
)

// Public. Ids are random and never reused, so the response can be cached forever.
imageRoutes.get('/img/:id', async (c) => {
  const id = c.req.param('id')
  if (!ID_RE.test(id)) return c.json({ ok: false, error: 'Not found' }, 404)
  const { value, metadata } = await c.env.IMAGES.getWithMetadata<{ type: string }>(id, 'stream')
  if (!value || !metadata) return c.json({ ok: false, error: 'Not found' }, 404)
  return new Response(value, {
    headers: {
      'Content-Type': metadata.type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
})

/** Delete uploaded images that no saved content references any more (and are older than the grace period). */
export async function pruneImages(kv: KVNamespace, referenced: Set<string>) {
  let cursor: string | undefined
  do {
    const page = await kv.list<{ uploadedAt?: number }>({ cursor })
    for (const k of page.keys) {
      const at = k.metadata?.uploadedAt
      if (!referenced.has(k.name) && at && Date.now() - at > GRACE_MS) await kv.delete(k.name)
    }
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)
}
