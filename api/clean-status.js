// Thin Vercel adapter for the Replicate poll. Keeps the maxDuration config,
// reads ?id= from the query, and delegates to the shared cleanStatus core
// (reused by the future Tencent Express route).
import { cleanStatus } from '../lib/cleanStatus.core.js'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  const id = req.query?.id
  const { status, body } = await cleanStatus({ id })
  return res.status(status).json(body)
}
