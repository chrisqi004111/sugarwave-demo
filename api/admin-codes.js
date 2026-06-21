// Admin endpoint to mint / inspect access codes. Protected by ?key=<ADMIN_SECRET>.
//
//   Generate 10 codes (3 cleans + 3 renders each):
//     /api/admin-codes?key=SECRET&action=gen&n=10&clean=3&render=3
//   Inspect one code's remaining uses:
//     /api/admin-codes?key=SECRET&action=status&code=ABCD2345
//
// ADMIN_SECRET is a Vercel env var you set (a long random string only you know).
import { redis, getCode } from '../lib/kv.js'

// Crockford-ish alphabet: no 0/O/1/I to avoid confusion when read aloud.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function randomCode(len = 8) {
  let s = ''
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return s
}

export default async function handler(req, res) {
  const q = req.query || {}
  if (!process.env.ADMIN_SECRET || q.key !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'forbidden' })
  }

  const action = q.action || 'gen'

  if (action === 'status') {
    const info = await getCode(q.code)
    if (!info) return res.status(404).json({ error: 'not found' })
    return res.status(200).json({ code: String(q.code).trim().toUpperCase(), ...info })
  }

  if (action === 'gen') {
    const n = Math.min(Math.max(parseInt(q.n) || 1, 1), 200)
    const clean = Math.max(parseInt(q.clean) || 3, 0)
    const render = Math.max(parseInt(q.render) || 3, 0)
    const note = q.note || ''
    const codes = []
    for (let i = 0; i < n; i++) {
      const code = randomCode()
      await redis.hset(`code:${code}`, { clean, render, note, created: new Date().toISOString() })
      codes.push(code)
    }
    return res.status(200).json({ ok: true, count: codes.length, clean, render, codes })
  }

  return res.status(400).json({ error: 'unknown action' })
}
