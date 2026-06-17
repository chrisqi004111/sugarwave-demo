import { useEffect, useReducer } from 'react'

// Minimal client-side cart store for the prototype's buy line.
// State is kept in module memory + mirrored to localStorage so the cart and
// the chosen shipping method survive reloads and are shared across the
// ecommerce + Scene Lab flows. No backend / payment APIs are involved (DEMO-safe).

const CART_KEY = 'sw_cart_v1'
const SHIP_KEY = 'sw_shipping_v1'
export const ORDER_KEY = 'sw_last_order_v1'

// Shipping methods shown on the Cart page. Selecting one unlocks checkout.
// `price` is the flat delivery & setup fee in EUR (consistent currency).
export const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard Shipping', eta: '3–5 weeks', price: 55 },
  { id: 'express', label: 'Express Shipping', eta: '1–2 weeks', price: 120 },
]

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

let items = (() => { const v = loadJSON(CART_KEY, []); return Array.isArray(v) ? v : [] })()
let shippingId = loadJSON(SHIP_KEY, null)

const listeners = new Set()

function emit() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)) } catch { /* ignore quota / private mode */ }
  try { localStorage.setItem(SHIP_KEY, JSON.stringify(shippingId)) } catch { /* ignore */ }
  listeners.forEach((l) => l())
}

// Accepts both ecommerce products ({ slug, image }) and Scene Lab products
// ({ id, img/src }). A stable `slug` key + thumbnail are derived from either.
// material / size / weight are captured only when the product carries them.
export function addToCart(product, qty = 1) {
  const key = product.key ?? product.slug ?? product.id
  if (key == null) return
  const image = product.image ?? product.img ?? product.src ?? null
  const existing = items.find((i) => i.slug === key)
  if (existing) {
    existing.qty += qty
  } else {
    items.push({
      slug: key, name: product.name, price: product.price, image, qty,
      material: product.material ?? null,
      size: product.size ?? product.dimensions ?? null,
      weight: product.weight ?? null,
    })
  }
  emit()
}

export function setQty(slug, qty) {
  const it = items.find((i) => i.slug === slug)
  if (!it) return
  it.qty = Math.max(0, qty)
  if (it.qty === 0) items = items.filter((i) => i.slug !== slug)
  emit()
}

export function removeFromCart(slug) {
  items = items.filter((i) => i.slug !== slug)
  emit()
}

export function clearCart() {
  items = []
  shippingId = null
  emit()
}

export function setShipping(id) {
  shippingId = id
  emit()
}

// Snapshot of the order at checkout time, persisted so the success page can
// render / export it after the cart itself is cleared.
export function saveLastOrder(order) {
  try { localStorage.setItem(ORDER_KEY, JSON.stringify(order)) } catch { /* ignore */ }
}

export function loadLastOrder() {
  return loadJSON(ORDER_KEY, null)
}

export function useCart() {
  const [, force] = useReducer((c) => c + 1, 0)
  useEffect(() => {
    listeners.add(force)
    return () => listeners.delete(force)
  }, [])

  const snapshot = items.map((i) => ({ ...i }))
  const count = snapshot.reduce((n, i) => n + i.qty, 0)
  const subtotal = snapshot.reduce((n, i) => n + i.qty * i.price, 0)
  const shipping = SHIPPING_METHODS.find((m) => m.id === shippingId) || null
  const delivery = shipping ? shipping.price : 0
  const total = subtotal + delivery
  return { items: snapshot, count, subtotal, shipping, shippingId, delivery, total }
}
