// POST { code, image, mask } → consume one "clean" use, then run the real
// lama-cleaner (Replicate) object-removal. image/mask are full data URLs
// (data:...;base64,...) built client-side. Replicate is async: we create the
// prediction (Prefer: wait=30) and either return the result, or a prediction
// id the client polls via /api/clean-status.
import { consume, refund } from '../lib/kv.js'

// lama-cleaner model version (same one used by the original dev proxy).
const MODEL_VERSION = 'cdac78a1bec5b23c07fd29692fb70baa513ea403a39e643c48ec5edadb15fe72'

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  const { code, image, mask } = req.body || {}
  if (!image || !mask) return res.status(400).json({ error: 'missing image or mask' })

  const used = await consume(code, 'clean')
  if (!used.ok) return res.status(used.status).json({ error: used.error })

  try {
    const r = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=30',
      },
      body: JSON.stringify({ version: MODEL_VERSION, input: { image, mask } }),
    })
    const data = await r.json()
    if (!r.ok) {
      await refund(code, 'clean')
      return res.status(502).json({ error: 'replicate error', detail: data })
    }
    if (data.status === 'succeeded' && data.output) {
      return res.status(200).json({ status: 'succeeded', output: data.output, left: used.left })
    }
    if (data.id) {
      return res.status(200).json({ status: data.status || 'processing', id: data.id, left: used.left })
    }
    await refund(code, 'clean')
    return res.status(502).json({ error: 'no prediction id', detail: data })
  } catch (e) {
    await refund(code, 'clean')
    return res.status(502).json({ error: String(e) })
  }
}
