// Persisted "last saved design" for the Scene Lab landing preview.
// Stored in localStorage so the landing page can show the user's most recent
// finished design across reloads. DEMO-safe: only image paths + light metadata,
// no API calls. (Blob/object URLs from a custom upload won't survive a reload —
// preset scene paths and product asset urls do, which covers the demo flow.)
const KEY = 'sw_saved_design_v1'

export function saveDesign(design) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...design, ts: Date.now() }))
  } catch { /* ignore quota / private mode */ }
}

export function loadSavedDesign() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearSavedDesign() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
