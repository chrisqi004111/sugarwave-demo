import { useState } from 'react'
import { Page, Container, Btn, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'
import { useCart, clearCart } from '../cart'

const field = {
  width: '100%', padding: '12px 14px', fontSize: 14, marginBottom: 14,
  border: `1px solid ${C.border}`, background: C.bg, boxSizing: 'border-box',
}

export default function CheckoutPage() {
  const { navigate } = useNav()
  const { items, total } = useCart()
  const [placed, setPlaced] = useState(false)

  function placeOrder(e) {
    e.preventDefault()
    track('purchase', { total, lines: items.length })
    clearCart()
    setPlaced(true)
    window.scrollTo(0, 0)
  }

  if (placed) {
    return (
      <Page>
        <Container style={{ paddingTop: 80, textAlign: 'center', maxWidth: 520 }}>
          <p style={kicker}>Order confirmed</p>
          <h1 style={{ fontSize: 40, fontWeight: 400, margin: '12px 0 16px' }}>Thank you.</h1>
          <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.8, marginBottom: 32 }}>
            Your order is in production. We'll email tracking when it ships.
          </p>
          <Btn onClick={() => navigate('shop')}>Continue shopping →</Btn>
        </Container>
      </Page>
    )
  }

  return (
    <Page>
      <Container style={{ paddingTop: 56 }}>
        <p style={kicker}>Checkout</p>
        <h1 style={{ fontSize: 40, fontWeight: 400, marginBottom: 32 }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 56, alignItems: 'start' }}>
          <form onSubmit={placeOrder}>
            <p style={{ ...kicker, marginBottom: 16 }}>Contact & shipping</p>
            <input style={field} placeholder="Email" type="email" required />
            <input style={field} placeholder="Full name" required />
            <input style={field} placeholder="Address" required />
            <div style={{ display: 'flex', gap: 14 }}>
              <input style={field} placeholder="City" required />
              <input style={field} placeholder="Postcode" required />
            </div>
            <p style={{ ...kicker, margin: '24px 0 16px' }}>Payment</p>
            <input style={field} placeholder="Card number" required />
            <div style={{ display: 'flex', gap: 14 }}>
              <input style={field} placeholder="MM / YY" required />
              <input style={field} placeholder="CVC" required />
            </div>
            <button type="submit" style={{
              background: C.black, color: C.bg, border: 'none', width: '100%',
              padding: '14px', fontSize: 16, cursor: 'pointer', marginTop: 12,
            }}>
              Place order · ${total}
            </button>
          </form>

          <div style={{ background: C.bgGray, padding: 28 }}>
            <p style={{ ...kicker, marginBottom: 20 }}>Order summary</p>
            {items.length === 0 && <p style={{ fontSize: 13, color: C.gray }}>No items.</p>}
            {items.map(it => (
              <div key={it.slug} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12 }}>
                <span>{it.name} × {it.qty}</span>
                <span style={{ color: C.gray }}>${it.price * it.qty}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14 }}>Total</span>
              <span style={{ fontSize: 18 }}>${total}</span>
            </div>
          </div>
        </div>
      </Container>
    </Page>
  )
}
