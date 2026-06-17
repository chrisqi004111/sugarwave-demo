// POST { code, space, mask, products[], prompt, width, height } → consume one
// "render" use, then call OpenAI's image edit (gpt-image-2) to place the product
// into the masked area. All images are data URLs built/resized client-side.
// quality='low' keeps a single render comfortably under the 60s function limit.
import { consume, refund } from './_kv.js'

export const config = { maxDuration: 60 }

// data:<mime>;base64,<data>  ->  Blob (Node fetch can't open data: URLs, so parse by hand)
function dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(',')
  const meta = dataUrl.slice(0, comma)
  const b64 = dataUrl.slice(comma + 1)
  const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/png'
  return new Blob([Buffer.from(b64, 'base64')], { type: mime })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  const { code, space, mask, products = [], prompt, width, height } = req.body || {}
  if (!space || !mask || !prompt) return res.status(400).json({ error: 'missing space/mask/prompt' })

  const used = await consume(code, 'render')
  if (!used.ok) return res.status(used.status).json({ error: used.error })

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
      return res.status(502).json({ error: 'openai error', detail: data })
    }
    const b64 = data.data?.[0]?.b64_json
    if (!b64) {
      await refund(code, 'render')
      return res.status(502).json({ error: 'no image returned', detail: data })
    }
    return res.status(200).json({ image: `data:image/png;base64,${b64}`, left: used.left })
  } catch (e) {
    await refund(code, 'render')
    return res.status(502).json({ error: String(e) })
  }
}
