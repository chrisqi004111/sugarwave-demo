import { useEffect, useState } from 'react'

// Minimal client-side cart store for the prototype's buy line.
// Real implementation would live in the commerce backend / context.
let items = []
const listeners = new Set()

function emit() {
  listeners.forEach((l) => l([...items]))
}

export function addToCart(product, qty = 1) {
  const existing = items.find((i) => i.slug === product.slug)
  if (existing) existing.qty += qty
  else items.push({ slug: product.slug, name: product.name, price: product.price, qty })
  emit()
}

export function setQty(slug, qty) {
  const it = items.find((i) => i.slug === slug)
  if (!it) return
  it.qty = Math.max(0, qty)
  if (it.qty === 0) items = items.filter((i) => i.slug !== slug)
  emit()
}

export function clearCart() {
  items = []
  emit()
}

export function useCart() {
  const [snapshot, setSnapshot] = useState([...items])
  useEffect(() => {
    listeners.add(setSnapshot)
    return () => listeners.delete(setSnapshot)
  }, [])
  const count = snapshot.reduce((n, i) => n + i.qty, 0)
  const total = snapshot.reduce((n, i) => n + i.qty * i.price, 0)
  return { items: snapshot, count, total }
}
