// Platform-neutral clean (object-removal) logic. Takes { code, image, mask }
// (full data URLs) and returns { status, body } — no req/res — so it is reused
// by both the Vercel Function (api/clean.js) and the future Tencent Express route.
//
// Consumes one "clean" use, then runs the real lama-cleaner (Replicate). Replicate
// is async: with Prefer: wait=30 we either return the finished output, or a
// prediction id the client polls via /api/clean-status. Refunds the use on any
// provider failure so a failed clean isn't charged.
import { consume, refund } from './kv.js'

// lama-cleaner model version (same one used by the original dev proxy).
const MODEL_VERSION = 'cdac78a1bec5b23c07fd29692fb70baa513ea403a39e643c48ec5edadb15fe72'

export async function clean({ code, image, mask }) {
  if (!image || !mask) return { status: 400, body: { error: 'missing image or mask' } }

  const used = await consume(code, 'clean')
  if (!used.ok) return { status: used.status, body: { error: used.error } }

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
      return { status: 502, body: { error: 'replicate error', detail: data } }
    }
    if (data.status === 'succeeded' && data.output) {
      return { status: 200, body: { status: 'succeeded', output: data.output, left: used.left } }
    }
    if (data.id) {
      return { status: 200, body: { status: data.status || 'processing', id: data.id, left: used.left } }
    }
    await refund(code, 'clean')
    return { status: 502, body: { error: 'no prediction id', detail: data } }
  } catch (e) {
    await refund(code, 'clean')
    return { status: 502, body: { error: String(e) } }
  }
}
