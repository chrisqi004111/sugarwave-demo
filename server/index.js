// Tencent Cloud Hong Kong Lighthouse backend (China/HK deployment).
//
// Same-origin design: Nginx serves the built frontend (dist/) and reverse-proxies
// /api/* to this Express server on 127.0.0.1:PORT. No CORS needed — the browser
// only ever talks to one origin (https://scene.example.com).
//
// These routes are THIN adapters over the SAME shared cores the Vercel Functions
// use (../lib/*.core.js). No business logic lives here, so the overseas (Vercel)
// and China (Express) deployments cannot drift on quota / provider behavior; they
// share one Upstash KV via lib/kv.js. admin-codes is intentionally NOT exposed
// here — code minting stays Vercel-only.
import express from 'express'
import { redeem } from '../lib/redeem.core.js'
import { clean } from '../lib/clean.core.js'
import { cleanStatus } from '../lib/cleanStatus.core.js'
import { render } from '../lib/render.core.js'

const app = express()

// clean/render carry base64 data-URL images (several MB) — lift the default
// ~100KB JSON limit. Keep this in sync with Nginx's client_max_body_size.
app.use(express.json({ limit: '25mb' }))

// Liveness probe — no KV / provider. Used by the deploy checklist and monitors.
app.get('/api/health', (req, res) => res.status(200).json({ ok: true }))

// Validate an access code, return remaining quotas (no consume).
app.post('/api/redeem', async (req, res) => {
  const code = req.body?.code ?? req.query?.code
  const { status, body } = await redeem({ code })
  res.status(status).json(body)
})

// Consume one "clean" → lama-cleaner (Replicate). Async: may return an id to poll.
app.post('/api/clean', async (req, res) => {
  const { code, image, mask } = req.body || {}
  const { status, body } = await clean({ code, image, mask })
  res.status(status).json(body)
})

// Poll a Replicate prediction (no quota touched).
app.get('/api/clean-status', async (req, res) => {
  const { status, body } = await cleanStatus({ id: req.query?.id })
  res.status(status).json(body)
})

// Consume one "render" → OpenAI image edit (gpt-image-2).
app.post('/api/render', async (req, res) => {
  const { code, space, mask, products, prompt, width, height } = req.body || {}
  const { status, body } = await render({ code, space, mask, products, prompt, width, height })
  res.status(status).json(body)
})

// Bind to localhost only — Nginx is the public-facing TLS layer.
const PORT = process.env.PORT || 3000
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[server] listening on http://127.0.0.1:${PORT}`)
})
