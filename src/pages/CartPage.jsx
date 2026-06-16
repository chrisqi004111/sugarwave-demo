import { Page, Container, Btn, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'
import { useCart, setQty } from '../cart'

export default function CartPage() {
  const { navigate } = useNav()
  const { items, total } = useCart()

  return (
    <Page>
      <Container style={{ paddingTop: 56 }}>
        <p style={kicker}>Cart</p>
        <h1 style={{ fontSize: 40, fontWeight: 400, marginBottom: 32 }}>Your Cart</h1>

        {items.length === 0 ? (
          <div style={{ color: C.gray, fontSize: 14 }}>
            <p style={{ marginBottom: 20 }}>Your cart is empty.</p>
            <Btn variant="secondary" onClick={() => navigate('shop')}>Browse shop →</Btn>
          </div>
        ) : (
          <>
            <div style={{ borderTop: `1px solid ${C.lightGray}` }}>
              {items.map(it => (
                <div
                  key={it.slug}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 0', borderBottom: `1px solid ${C.lightGray}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15 }}>{it.name}</div>
                    <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>${it.price}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Stepper onClick={() => setQty(it.slug, it.qty - 1)}>−</Stepper>
                      <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{it.qty}</span>
                      <Stepper onClick={() => setQty(it.slug, it.qty + 1)}>+</Stepper>
                    </div>
                    <span style={{ fontSize: 15, width: 70, textAlign: 'right' }}>${it.price * it.qty}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
              <span style={{ fontSize: 14, color: C.gray }}>Subtotal</span>
              <span style={{ fontSize: 22 }}>${total}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 28 }}>
              <Btn variant="secondary" onClick={() => navigate('shop')}>Continue shopping</Btn>
              <Btn
                onClick={() => {
                  track('checkout_start', { total, lines: items.length })
                  navigate('checkout')
                }}
              >
                Checkout →
              </Btn>
            </div>
          </>
        )}
      </Container>
    </Page>
  )
}

function Stepper({ children, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        width: 28, height: 28, border: `1px solid ${C.border}`, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}
    >
      {children}
    </span>
  )
}
