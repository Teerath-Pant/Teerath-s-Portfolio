import type { Context } from 'hono'
import type { AppEnv } from './env'

export const clientIp = (c: Context<AppEnv>) => c.req.header('cf-connecting-ip') ?? 'local'

/** true when this IP has exceeded the limiter. A missing binding means "no limit". */
export async function tooMany(limiter: RateLimit | undefined, c: Context<AppEnv>) {
  return !!limiter && !(await limiter.limit({ key: clientIp(c) })).success
}
