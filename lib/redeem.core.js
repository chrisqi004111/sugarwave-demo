// Platform-neutral redeem logic. Takes a plain { code } and returns
// { status, body } — no req/res — so it can be wrapped by both the Vercel
// Function (api/redeem.js) and the future Tencent Cloud Express route.
//
// Validates a code and returns its remaining quotas. Does NOT consume anything
// (that happens in clean/render); used by the frontend to unlock the live tools
// and show "X cleans / Y renders left".
import { getCode } from './kv.js'

export async function redeem({ code }) {
  const info = await getCode(code)
  if (!info) return { status: 404, body: { ok: false, error: 'invalid code' } }
  return { status: 200, body: { ok: true, clean: info.clean, render: info.render } }
}
