// POST or GET { code } → validate a code and return its remaining quotas.
// Does NOT consume anything — used by the frontend to unlock the live tools
// and show "X cleans / Y renders left".
import { getCode } from './_kv.js'

export default async function handler(req, res) {
  const code = req.method === 'POST' ? req.body?.code : req.query?.code
  const info = await getCode(code)
  if (!info) return res.status(404).json({ ok: false, error: 'invalid code' })
  return res.status(200).json({ ok: true, clean: info.clean, render: info.render })
}
