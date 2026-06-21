// Thin Vercel adapter: reads { code } from the request (POST body or GET query,
// exactly as before) and delegates to the shared redeem core. The same core is
// reused by the future Tencent Cloud Express backend.
import { redeem } from '../lib/redeem.core.js'

export default async function handler(req, res) {
  const code = req.method === 'POST' ? req.body?.code : req.query?.code
  const { status, body } = await redeem({ code })
  return res.status(status).json(body)
}
