import { useState } from 'react'
import { Page, Container, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'
import { useCart, setQty, removeFromCart, setShipping, SHIPPING_METHODS } from '../cart'

const DESTINATIONS = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Netherlands', 'China', 'Japan', 'Australia']

export default function CartPage() {
  const { navigate } = useNav()
  const { items, subtotal, shipping, shippingId, delivery, total } = useCart()
  const [destination, setDestination] = useState(DESTINATIONS[0])

  if (items.length === 0) {
    return (
      <Page>
        <Container style={{ paddingTop: 56 }}>
          <p style={kicker}>Cart</p>
          <h1 style={{ fontSize: 40, fontWeight: 400, marginBottom: 24 }}>Your Cart</h1>
          <p style={{ marginBottom: 20, color: C.gray, fontSize: 14 }}>Your cart is empty.</p>
          <button onClick={() => navigate('shop')} style={ghostBtn}>BROWSE SHOP →</button>
        </Container>
      </Page>
    )
  }

  return (
    <Page>
      <Container style={{ paddingTop: 56 }}>
        <p style={kicker}>Cart</p>
        <h1 style={{ fontSize: 40, fontWeight: 400, marginBottom: 40 }}>Your Cart</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 64, alignItems: 'start' }}>

          {/* ── Left: products + shipping ── */}
          <div>
            <div style={{ borderTop: `1px solid ${C.lightGray}` }}>
              {items.map(it => (
                <div key={it.slug} style={{
                  display: 'flex', gap: 20, padding: '24px 0',
                  borderBottom: `1px solid ${C.lightGray}`,
                }}>
                  <div style={{
                    width: 96, height: 96, flexShrink: 0, background: C.bgGray,
                    border: `1px solid ${C.lightGray}`, overflow: 'hidden',
                  }}>
                    {it.image && (
                      <img src={it.image} alt={it.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, marginBottom: 6 }}>{it.name}</div>
                    {it.material && <Spec label="Material" value={it.material} />}
                    {it.size && <Spec label="Size" value={it.size} />}
                    {it.weight && <Spec label="Weight" value={it.weight} />}
                    <div style={{ fontSize: 13, color: C.gray, marginTop: 6 }}>Unit price €{it.price}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Stepper onClick={() => setQty(it.slug, it.qty - 1)}>−</Stepper>
                        <span style={{ fontSize: 14, width: 22, textAlign: 'center' }}>{it.qty}</span>
                        <Stepper onClick={() => setQty(it.slug, it.qty + 1)}>+</Stepper>
                      </div>
                      <span
                        onClick={() => removeFromCart(it.slug)}
                        style={{ fontSize: 12, color: C.gray, cursor: 'pointer', textDecoration: 'underline' }}
                      >Remove</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 16, width: 80, textAlign: 'right' }}>€{it.price * it.qty}</div>
                </div>
              ))}
            </div>

            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: 14, color: C.gray }}>Subtotal</span>
              <span style={{ fontSize: 20 }}>€{subtotal}</span>
            </div>

            {/* Shipping destination */}
            <div style={{ marginTop: 24 }}>
              <p style={{ ...kicker, marginBottom: 12 }}>Shipping destination</p>
              <select
                value={destination}
                onChange={e => setDestination(e.target.value)}
                style={{
                  width: '100%', maxWidth: 360, padding: '12px 14px', fontSize: 14,
                  border: `1px solid ${C.border}`, background: C.bg, boxSizing: 'border-box',
                }}
              >
                {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Shipping method cards */}
            <div style={{ marginTop: 28 }}>
              <p style={{ ...kicker, marginBottom: 12 }}>Shipping method</p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {SHIPPING_METHODS.map(m => {
                  const active = shippingId === m.id
                  return (
                    <div
                      key={m.id}
                      onClick={() => { setShipping(m.id); track('checkout_start', { step: 'shipping_method', method: m.id }) }}
                      style={{
                        flex: '1 1 200px', padding: '16px 18px', cursor: 'pointer',
                        border: `1px solid ${active ? C.black : C.border}`,
                        background: C.bg,
                        outline: active ? `1px solid ${C.black}` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 14 }}>{m.label}</span>
                        <span style={{ fontSize: 14 }}>€{m.price}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.gray, marginTop: 6 }}>{m.eta}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Right: order summary (gated on shipping method) ── */}
          <div style={{ border: `1px solid ${C.lightGray}`, padding: 28 }}>
            <p style={{ ...kicker, marginBottom: 20 }}>Order summary</p>

            <Row label="Subtotal" value={`€${subtotal}`} />
            <Row label="Shipping" value={shipping ? `€${delivery}` : '—'} />

            {!shippingId ? (
              <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, marginTop: 20 }}>
                Please select a shipping method to continue.
              </p>
            ) : (
              <>
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16 }}>
                  <Row label="Estimated Total" value={`€${total}`} bold />
                </div>
                <button
                  onClick={() => { track('checkout_start', { total, lines: items.length, method: shippingId }); navigate('checkout') }}
                  style={{
                    width: '100%', marginTop: 24, padding: '14px', background: C.black, color: C.bg,
                    border: 'none', fontSize: 12, letterSpacing: 2, cursor: 'pointer',
                  }}
                >
                  CHECKOUT →
                </button>
              </>
            )}

            <div
              onClick={() => navigate('shop')}
              style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: C.gray, cursor: 'pointer' }}
            >
              Continue shopping
            </div>

            <p style={{ fontSize: 11, color: C.gray, lineHeight: 1.7, marginTop: 22 }}>
              Custom color, size, and texture options will be available in a future version.
            </p>
          </div>
        </div>
      </Container>
    </Page>
  )
}

function Spec({ label, value }) {
  return (
    <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>
      <span style={{ display: 'inline-block', width: 64 }}>{label}</span>{value}
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: bold ? 0 : 10 }}>
      <span style={{ fontSize: bold ? 15 : 13, color: bold ? C.black : C.gray }}>{label}</span>
      <span style={{ fontSize: bold ? 20 : 14, fontWeight: bold ? 600 : 400 }}>{value}</span>
    </div>
  )
}

function Stepper({ children, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        width: 28, height: 28, border: `1px solid ${C.border}`, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        userSelect: 'none',
      }}
    >
      {children}
    </span>
  )
}

const ghostBtn = {
  border: `1px solid ${C.black}`, background: C.bg, color: C.black,
  padding: '12px 24px', fontSize: 12, letterSpacing: 2, cursor: 'pointer',
}
