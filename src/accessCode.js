// Client-side access-code state for the live AI tools. Mirrors a redeemed code
// to localStorage so it survives reloads. The server (/api/*) is the source of
// truth for quota; we keep a local copy only to show "X cleans / Y renders left"
// and to gate the UI. Each successful backend call returns the new `left`, which
// we mirror via updateQuota().
import { useEffect, useReducer } from 'react'

const KEY = 'sw_access_code_v1'

let state = load()
const listeners = new Set()

function load() {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function persist() {
  try {
    if (state) localStorage.setItem(KEY, JSON.stringify(state))
    else localStorage.removeItem(KEY)
  } catch { /* ignore */ }
  listeners.forEach((l) => l())
}

// { code, clean, render } | null
export function getActiveCode() { return state }

// Validate a code against the backend and activate it locally.
export async function applyCode(code) {
  const c = String(code || '').trim().toUpperCase()
  if (!c) return { ok: false, error: 'empty' }
  let data = {}
  try {
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: c }),
    })
    data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) return { ok: false, error: data.error || 'invalid code' }
  } catch (e) {
    return { ok: false, error: 'network error' }
  }
  state = { code: c, clean: Number(data.clean) || 0, render: Number(data.render) || 0 }
  persist()
  return { ok: true, ...state }
}

// Mirror the server's remaining count after a successful clean/render call.
export function updateQuota(field, left) {
  if (!state) return
  state = { ...state, [field]: Math.max(0, Number(left) || 0) }
  persist()
}

export function clearCode() { state = null; persist() }

// React hook — re-renders subscribers when the active code changes.
export function useAccessCode() {
  const [, force] = useReducer((c) => c + 1, 0)
  useEffect(() => {
    listeners.add(force)
    return () => { listeners.delete(force) }
  }, [])
  return state
}
