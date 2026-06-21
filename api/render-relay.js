// Internal "image-only" render endpoint for the China (HK) backend.
//
// OpenAI blocks the HK server's region, so the HK backend consumes the user's
// quota LOCALLY (shared Upstash KV) and then forwards just the OpenAI image call
// to this endpoint, which runs in a Vercel region OpenAI supports. It does NOT
// touch quota (the HK side already consumed once) — so a render is charged
// exactly once. Guarded by a shared secret so randoms can't burn the OpenAI key.
//
// Vercel's own /api/render does NOT use this (its RENDER_RELAY_URL is unset) and
// is unaffected.
import { generateRenderImage } from '../lib/render.core.js'

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!process.env.RENDER_RELAY_SECRET || req.headers['x-relay-secret'] !== process.env.RENDER_RELAY_SECRET) {
    return res.status(403).json({ error: 'forbidden' })
  }
  const { space, mask, products, prompt, width, height } = req.body || {}
  const { status, body } = await generateRenderImage({ space, mask, products, prompt, width, height })
  return res.status(status).json(body)
}
