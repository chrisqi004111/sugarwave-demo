// GET ?id=<predictionId> → poll a Replicate prediction's status/result.
// No quota is consumed here (the consume happened in /api/clean); this just
// reports progress so the client can wait without exposing the token.
export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  const id = req.query?.id
  if (!id) return res.status(400).json({ error: 'missing id' })

  try {
    const r = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_TOKEN}` },
    })
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: 'poll error', detail: data })
    return res.status(200).json({ status: data.status, output: data.output, error: data.error })
  } catch (e) {
    return res.status(502).json({ error: String(e) })
  }
}
