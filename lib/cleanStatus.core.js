// Platform-neutral Replicate prediction poll. Takes { id } and returns
// { status, body } — no req/res — so it is reused by both the Vercel Function
// (api/clean-status.js) and the future Tencent Express route.
//
// No quota / KV is touched here (the consume happened in clean); this just
// reports progress so the client can wait without exposing the token.
export async function cleanStatus({ id }) {
  if (!id) return { status: 400, body: { error: 'missing id' } }

  try {
    const r = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_TOKEN}` },
    })
    const data = await r.json()
    if (!r.ok) return { status: 502, body: { error: 'poll error', detail: data } }
    return { status: 200, body: { status: data.status, output: data.output, error: data.error } }
  } catch (e) {
    return { status: 502, body: { error: String(e) } }
  }
}
