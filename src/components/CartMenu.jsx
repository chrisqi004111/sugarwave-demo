import { useState } from 'react'
import { C, FONTS } from '../theme'
import { useNav } from '../nav'
import { useCart } from '../cart'
import { track } from '../analytics'

// Top-nav cart: icon + live item count, with a hover mini-cart dropdown.
// Clicking the icon opens the full Cart page; the dropdown's two CTAs jump to
// Cart / Checkout. All numbers come from the shared cart store (live updates).
export default function CartMenu() {
  const { navigate } = useNav()
  const { items, count, subtotal, delivery, total } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Cart icon + count */}
      <div
        onClick={() => { track('nav_click', { item: 'Cart' }); navigate('cart') }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          fontFamily: FONTS.nav, color: C.black, userSelect: 'none',
        }}
      >
        <CartIcon />
        <span style={{ fontSize: 16, minWidth: 14, fontWeight: count ? 700 : 400 }}>{count}</span>
      </div>

      {/* Hover mini-cart */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, width: 330,
          background: C.bg, border: `1px solid ${C.border}`,
          boxShadow: '0 6px 18px rgba(0,0,0,0.06)', padding: 16, zIndex: 200,
          fontFamily: FONTS.nav,
        }}>
          {items.length === 0 ? (
            <p style={{ fontSize: 13, color: C.gray, padding: '14px 4px', textAlign: 'center', letterSpacing: 0.5 }}>
              Your cart is empty.
            </p>
          ) : (
            <>
              <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                {items.map(it => (
                  <div key={it.slug} style={{
                    display: 'flex', gap: 12, padding: '10px 0',
                    borderBottom: `1px solid ${C.lightGray}`,
                  }}>
                    <div style={{
                      width: 44, height: 44, flexShrink: 0, background: C.bgGray,
                      border: `1px solid ${C.lightGray}`, overflow: 'hidden',
                    }}>
                      {it.image && (
                        <img src={it.image} alt={it.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.currentTarget.style.display = 'none' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: C.black }}>{it.name}</div>
                      <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Qty {it.qty} · €{it.price}</div>
                    </div>
                    <div style={{ fontSize: 13, color: C.black }}>€{it.price * it.qty}</div>
                  </div>
                ))}
              </div>

              <Row label="Subtotal" value={`€${subtotal}`} />
              <Row label="Delivery & Setup" value={`€${delivery}`} />
              <Row label="Estimated Total" value={`€${total}`} bold />

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => navigate('cart')} style={secBtn}>VIEW CART</button>
                <button
                  onClick={() => { track('checkout_start', { total, lines: items.length }); navigate('checkout') }}
                  style={priBtn}
                >CHECKOUT</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      marginTop: bold ? 10 : 8,
      paddingTop: bold ? 10 : 0,
      borderTop: bold ? `1px solid ${C.lightGray}` : 'none',
    }}>
      <span style={{ fontSize: 12, color: bold ? C.black : C.gray }}>{label}</span>
      <span style={{ fontSize: bold ? 14 : 12, fontWeight: bold ? 600 : 400 }}>{value}</span>
    </div>
  )
}

const baseBtn = {
  flex: 1, padding: '9px 0', fontSize: 10, letterSpacing: 1.5,
  cursor: 'pointer', textAlign: 'center', border: `1px solid ${C.black}`,
}
const priBtn = { ...baseBtn, background: C.black, color: C.bg }
const secBtn = { ...baseBtn, background: C.bg, color: C.black }

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
      <path d="M2 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" />
    </svg>
  )
}
