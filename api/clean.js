// Thin Vercel adapter for the clean (object-removal) route. Keeps the method
// guard + maxDuration config, reads { code, image, mask } from the body, and
// delegates to the shared clean core (reused by the future Tencent Express route).
import { clean } from '../lib/clean.core.js'

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  const { code, image, mask } = req.body || {}
  const { status, body } = await clean({ code, image, mask })
  return res.status(status).json(body)
}
