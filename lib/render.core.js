// Platform-neutral render logic. Takes { code, space, mask, products, prompt,
// width, height } (data URLs) and returns { status, body } — no req/res — so it
// is reused by both the Vercel Function (api/render.js) and the future Tencent
// Express route.
//
// Consumes one "render" use, then calls OpenAI's image edit (gpt-image-2) to place
// the product into the masked area. quality='low' keeps a single render comfortably
// under the 60s function limit. Refunds the use on any provider failure.
import { consume, refund } from './kv.js'

// data:<mime>;base64,<data>  ->  Blob (Node fetch can't open data: URLs, so parse by hand)
function dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(',')
  const meta = dataUrl.slice(0, comma)
  const b64 = dataUrl.slice(comma + 1)
  const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/png'
  return new Blob([Buffer.from(b64, 'base64')], { type: mime })
}

export async function render({ code, space, mask, products = [], prompt, width, height }) {
  if (!space || !mask || !prompt) return { status: 400, body: { error: 'missing space/mask/prompt' } }

  const used = await consume(code, 'render')
  if (!used.ok) return { status: used.status, body: { error: used.error } }

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
    if (!r.ok) {
      await refund(code, 'render')
      return { status: 502, body: { error: 'openai error', detail: data } }
    }
    const b64 = data.data?.[0]?.b64_json
    if (!b64) {
      await refund(code, 'render')
      return { status: 502, body: { error: 'no image returned', detail: data } }
    }
    return { status: 200, body: { image: `data:image/png;base64,${b64}`, left: used.left } }
  } catch (e) {
    await refund(code, 'render')
    return { status: 502, body: { error: String(e) } }
  }
}
