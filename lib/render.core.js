// Platform-neutral render logic. Takes { code, space, mask, products, prompt,
// width, height } (data URLs) and returns { status, body } — no req/res — so it
// is reused by both the Vercel Function (api/render.js) and the Tencent Express
// route.
//
// Consumes one "render" use, then produces the image. quality='low' keeps a
// single render comfortably under the 60s function limit. Refunds the use on any
// failure.
//
// OpenAI blocks some regions (e.g. Hong Kong). When RENDER_RELAY_URL is set (on
// the Tencent HK backend), the actual OpenAI call is forwarded to that URL — a
// Vercel "image-only" endpoint (api/render-relay.js) running in an OpenAI-
// supported region. Quota is still consumed locally (once), so codes/quota stay
// shared via the one Upstash KV. On Vercel itself RENDER_RELAY_URL is unset, so
// it calls OpenAI directly exactly as before.
import { consume, refund } from './kv.js'

// data:<mime>;base64,<data>  ->  Blob (Node fetch can't open data: URLs, so parse by hand)
function dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(',')
  const meta = dataUrl.slice(0, comma)
  const b64 = dataUrl.slice(comma + 1)
  const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/png'
  return new Blob([Buffer.from(b64, 'base64')], { type: mime })
}

// Pure OpenAI image edit (gpt-image-2). NO quota. Returns { status, body }.
// Reused by render() (direct path) and by the Vercel relay endpoint.
export async function generateRenderImage({ space, mask, products = [], prompt, width, height }) {
  if (!space || !mask || !prompt) return { status: 400, body: { error: 'missing space/mask/prompt' } }

  try {
    const form = new FormData()
    form.append('image[]', dataUrlToBlob(space), 'space.png')          // edited image (mask aligns to this)
    for (let i = 0; i < products.length; i++) {
      form.append('image[]', dataUrlToBlob(products[i]), `product-${i}.png`) // product reference(s)
    }
    form.append('mask', dataUrlToBlob(mask), 'mask.png')
    form.append('prompt', prompt)
    form.append('model', 'gpt-image-2')
    form.append('n', '1')
    if (width && height) form.append('size', `${width}x${height}`)
    form.append('quality', 'low')

    const r = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_KEY}` },
      body: form,
    })
    const data = await r.json()
    if (!r.ok) return { status: 502, body: { error: 'openai error', detail: data } }
    const b64 = data.data?.[0]?.b64_json
    if (!b64) return { status: 502, body: { error: 'no image returned', detail: data } }
    return { status: 200, body: { image: `data:image/png;base64,${b64}` } }
  } catch (e) {
    return { status: 502, body: { error: String(e) } }
  }
}

// Forward the image generation to the Vercel relay (OpenAI-supported region)
// instead of calling OpenAI directly. Returns { status, body } in the same shape
// as generateRenderImage.
async function callRelay({ space, mask, products = [], prompt, width, height }) {
  try {
    const r = await fetch(process.env.RENDER_RELAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-relay-secret': process.env.RENDER_RELAY_SECRET || '',
      },
      body: JSON.stringify({ space, mask, products, prompt, width, height }),
    })
    const data = await r.json().catch(() => ({}))
    return { status: r.status, body: data }
  } catch (e) {
    return { status: 502, body: { error: 'relay error', detail: String(e) } }
  }
}

export async function render({ code, space, mask, products = [], prompt, width, height }) {
  if (!space || !mask || !prompt) return { status: 400, body: { error: 'missing space/mask/prompt' } }

  const used = await consume(code, 'render')
  if (!used.ok) return { status: used.status, body: { error: used.error } }

  // HK backend → relay via Vercel; Vercel/local → call OpenAI directly (unchanged).
  const input = { space, mask, products, prompt, width, height }
  const result = process.env.RENDER_RELAY_URL
    ? await callRelay(input)
    : await generateRenderImage(input)

  if (result.status === 200 && result.body?.image) {
    return { status: 200, body: { image: result.body.image, left: used.left } }
  }
  // any failure → refund the use, pass the provider/relay error through unchanged
  await refund(code, 'render')
  return { status: result.status || 502, body: result.body || { error: 'render failed' } }
}
