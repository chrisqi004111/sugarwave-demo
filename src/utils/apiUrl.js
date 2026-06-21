// Resolve an internal backend route to a full URL.
//
// Overseas (Vercel): VITE_API_BASE_URL is unset -> return the original relative
//   path (e.g. "/api/render"), so the frontend keeps calling its own same-origin
//   Vercel Functions exactly as before.
// China (Tencent COS static): VITE_API_BASE_URL="https://api.example.com" -> prefix
//   it (e.g. "https://api.example.com/api/render"), so the static site calls the
//   Tencent Cloud backend cross-origin (CORS handled server-side).
//
// Only used for our OWN backend routes (/api/render, /api/clean, /api/clean-status,
// /api/redeem). Provider URLs (OpenAI/Replicate) and the dev-only Vite proxy paths
// are NOT routed through here.

// Trailing slash on the base is stripped so both "https://api.example.com" and
// "https://api.example.com/" produce the same result. `path` is expected to start
// with "/" (e.g. "/api/render").
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export function apiUrl(path) {
  return BASE ? BASE + path : path
}
