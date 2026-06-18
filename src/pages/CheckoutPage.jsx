import { useState } from 'react'
import { Page, Container, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'
import { useIsMobile } from '../useIsMobile'
import { useCart, clearCart, saveLastOrder } from '../cart'

const field = {
  width: '100%', padding: '12px 14px', fontSize: 14, marginBottom: 14,
  border: `1px solid ${C.border}`, background: C.bg, boxSizing: 'border-box',
}

export default function CheckoutPage() {
  const { navigate } = useNav()
  const isMobile = useIsMobile()
  const { items, subtotal, shipping, delivery, total } = useCart()
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    country: '', city: '', address: '', postal: '', notes: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function placeOrder(e) {
    e.preventDefault()
    // Simulate order submission locally — no backend / payment APIs.
    const order = {
      items, subtotal, delivery,
      shipping: shipping ? { id: shipping.id, label: shipping.label } : null,
      total, contact: form, ts: Date.now(),
    }
    saveLastOrder(order)
    track('purchase', { total, lines: items.length, method: shipping?.id })
    clearCart()
    navigate('order-success')
  }

  if (items.length === 0) {
    return (
      <Page>
        <Container style={{ paddingTop: 56 }}>
          <p style={kicker}>Checkout</p>
          <h1 style={{ fontSize: 40, fontWeight: 400, marginBottom: 24 }}>Checkout</h1>
          <p style={{ color: C.gray, fontSize: 14, marginBottom: 20 }}>Your cart is empty.</p>
          <span style={{ ...ghostBtn, cursor: 'default', display: 'inline-block' }}>BROWSE SHOP →</span>
        </Container>
      </Page>
    )
  }

  return (
    <Page>
      <Container style={{ paddingTop: 56 }}>
        <p style={kicker}>Checkout</p>
        <h1 style={{ fontSize: 40, fontWeight: 400, marginBottom: 40 }}>Checkout</h1>

        <form onSubmit={placeOrder} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: isMobile ? 32 : 64, alignItems: 'start' }}>

          {/* ── Left: contact + shipping address + payment ── */}
          <div>
            <p style={{ ...kicker, marginBottom: 16 }}>Contact information</p>
            <input style={field} placeholder="Name" value={form.name} onChange={set('name')} required />
            <input style={field} placeholder="Email" type="email" value={form.email} onChange={set('email')} required />
            <input style={field} placeholder="Phone" value={form.phone} onChange={set('phone')} required />

            <p style={{ ...kicker, margin: '28px 0 16px' }}>Shipping address</p>
            <input style={field} placeholder="Country / Region" value={form.country} onChange={set('country')} required />
            <div style={{ display: 'flex', gap: 14 }}>
              <input style={field} placeholder="City" value={form.city} onChange={set('city')} required />
              <input style={field} placeholder="Postal code" value={form.postal} onChange={set('postal')} required />
            </div>
            <input style={field} placeholder="Address" value={form.address} onChange={set('address')} required />
            <textarea
              style={{ ...field, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Delivery notes (optional)"
              value={form.notes} onChange={set('notes')}
            />

            <p style={{ ...kicker, margin: '28px 0 16px' }}>Payment method</p>
            <div style={{ border: `1px solid ${C.border}`, padding: '16px 18px', fontSize: 13, color: C.gray, lineHeight: 1.7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.black, fontSize: 14, marginBottom: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: `4px solid ${C.black}` }} />
                Mock payment (demo)
              </div>
              No real payment is processed. This portfolio demo simulates checkout locally.
            </div>

            <p style={{ fontSize: 11, color: C.gray, lineHeight: 1.7, marginTop: 18 }}>
              Custom color, size, and texture options will be available in a future version.
            </p>
          </div>

          {/* ── Right: order summary ── */}
          <div style={{ border: `1px solid ${C.lightGray}`, padding: 28 }}>
            <p style={{ ...kicker, marginBottom: 20 }}>Order summary</p>
            {items.map(it => (
              <div key={it.slug} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, flexShrink: 0, background: C.bgGray, border: `1px solid ${C.lightGray}`, overflow: 'hidden' }}>
                  {it.image && (
                    <img src={it.image} alt={it.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.currentTarget.style.display = 'none' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>{it.name}</div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Qty {it.qty}</div>
                </div>
                <div style={{ fontSize: 13 }}>€{it.price * it.qty}</div>
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${C.lightGray}`, marginTop: 8, paddingTop: 16 }}>
              <Row label="Subtotal" value={`€${subtotal}`} />
              <Row label={`Shipping${shipping ? ` · ${shipping.label}` : ''}`} value={`€${delivery}`} />
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12 }}>
                <Row label="Estimated Total" value={`€${total}`} bold />
              </div>
            </div>

            <button type="submit" style={{
              width: '100%', marginTop: 24, padding: '14px', background: C.black, color: C.bg,
              border: 'none', fontSize: 12, letterSpacing: 2, cursor: 'pointer',
            }}>
              PLACE ORDER
            </button>
          </div>
        </form>
      </Container>
    </Page>
  )
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: bold ? 0 : 10 }}>
      <span style={{ fontSize: bold ? 15 : 13, color: bold ? C.black : C.gray }}>{label}</span>
      <span style={{ fontSize: bold ? 18 : 14, fontWeight: bold ? 600 : 400 }}>{value}</span>
    </div>
  )
}

const ghostBtn = {
  border: `1px solid ${C.black}`, background: C.bg, color: C.black,
  padding: '12px 24px', fontSize: 12, letterSpacing: 2, cursor: 'pointer',
}
