// Lightweight analytics stub for the prototype.
// Not wired to a real platform — it pushes to a dataLayer-style array,
// logs to the console, and dispatches a DOM event so the on-screen
// EventLog panel can visualize exactly which event fires on each action.
// This is the spec the full-stack engineer implements against.

// Canonical event names reserved for the key conversion paths.
export const EVENTS = [
  'nav_click',
  'hero_cta_click_shop',
  'hero_cta_click_scene_lab',
  'featured_product_click',
  'scene_lab_cta_click',
  'scene_lab_service_select',
  'product_detail_view',
  'add_to_cart',
  'start_project_click',
  'brief_form_start',
  'brief_form_submit',
  'lead_submit_success',
  // supporting events surfaced in the埋点 flowchart
  'works_card_click',
  'work_case_contact_click',
  'checkout_start',
  'purchase',
  'newsletter_subscribe',
]

let counter = 0

export function track(event, payload = {}) {
  counter += 1
  const entry = { id: counter, event, payload, ts: Date.now() }

  // GTM / GA4-style dataLayer push (what an engineer would tag against).
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...payload })

  // eslint-disable-next-line no-console
  console.log(`%c[track] ${event}`, 'color:#0a0', payload)

  // Feed the on-screen EventLog panel.
  window.dispatchEvent(new CustomEvent('sw-track', { detail: entry }))

  return entry
}
