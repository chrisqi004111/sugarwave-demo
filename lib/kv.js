// Shared KV helpers for the access-code system (Upstash Redis via Vercel KV).
// Platform-neutral: lives in lib/ (outside api/) so it is NOT a route, and is
// imported by both the Vercel Functions (api/*) and the future Tencent Cloud
// Express backend. Env: KV_REST_API_URL + KV_REST_API_TOKEN (auto-injected by
// the connected Upstash database on Vercel; set the same values on Tencent).
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

export const keyFor = (code) => `code:${String(code || '').trim().toUpperCase()}`

// Read a code's remaining quotas. Returns null if the code does not exist.
export async function getCode(code) {
  if (!code) return null
  const data = await redis.hgetall(keyFor(code))
  if (!data || Object.keys(data).length === 0) return null
  return {
    clean: Number(data.clean) || 0,
    render: Number(data.render) || 0,
    note: data.note || '',
  }
}

// Atomically consume one use of `field` ('clean' | 'render').
// Decrement first, refund if it went negative — avoids a check-then-act race.
// Returns { ok:true, left } or { ok:false, status, error }.
export async function consume(code, field) {
  if (!code) return { ok: false, status: 400, error: 'missing code' }
  const key = keyFor(code)
  const exists = await redis.exists(key)
  if (!exists) return { ok: false, status: 403, error: 'invalid code' }
  const left = await redis.hincrby(key, field, -1)
  if (left < 0) {
    await redis.hincrby(key, field, 1) // refund — nothing was used
    return { ok: false, status: 403, error: `no ${field} uses left` }
  }
  return { ok: true, left }
}

// Give back one use of `field` — called when the provider call failed, so the
// user isn't charged for a render/clean that never produced a result.
export async function refund(code, field) {
  try { await redis.hincrby(keyFor(code), field, 1) } catch { /* ignore */ }
}
