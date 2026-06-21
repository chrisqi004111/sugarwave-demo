// Thin Vercel adapter for the render route. Keeps the method guard + maxDuration
// config, reads the render inputs from the body, and delegates to the shared
// render core (reused by the future Tencent Express route).
import { render } from '../lib/render.core.js'

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  const { code, space, mask, products, prompt, width, height } = req.body || {}
  const { status, body } = await render({ code, space, mask, products, prompt, width, height })
  return res.status(status).json(body)
}
