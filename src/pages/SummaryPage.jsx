import { useState } from 'react'
import Navbar from '../components/Navbar'

const C = { bg: '#fff', black: '#000', gray: '#888', lightGray: '#e0e0e0', border: '#d0d0d0' }

export default function SummaryPage({ beforeImage, afterImage, items = [], onBack }) {
  const [showBefore, setShowBefore] = useState(false)

  const displayImage = showBefore ? beforeImage : afterImage

  // 去重：同一产品可能被添加多次，合并计算数量
  const grouped = items.reduce((acc, item) => {
    const key = item.productId
    if (acc[key]) {
      acc[key].qty += 1
    } else {
      acc[key] = { ...item, qty: 1 }
    }
    return acc
  }, {})
  const productList = Object.values(grouped)
  const subtotal = productList.reduce((s, i) => s + i.price * i.qty, 0)
  const delivery = 55
  const total = subtotal + delivery

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingTop: 64 }}>
      <Navbar activePage="SCENE LAB" />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px', borderBottom: `1px solid ${C.lightGray}`,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: `1px solid ${C.border}`,
          padding: '6px 16px', fontSize: 11, letterSpacing: 1, cursor: 'pointer',
        }}>← BACK TO SCENE</button>
        <h2 style={{ fontSize: 13, letterSpacing: 3, fontWeight: 500 }}>YOUR DESIGN</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ border: `1px solid ${C.border}`, background: C.bg, padding: '6px 16px', fontSize: 11, letterSpacing: 1, cursor: 'pointer' }}>SHARE</button>
          <button style={{ border: `1px solid ${C.black}`, background: C.black, color: C.bg, padding: '6px 16px', fontSize: 11, letterSpacing: 1, cursor: 'pointer' }}>SAVE</button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 112px)' }}>

        {/* ── 左侧图片区 ── */}
        <div style={{ flex: 1, background: '#f2f2f2', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {displayImage ? (
            <img
              src={displayImage}
              alt={showBefore ? 'before' : 'after'}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <p style={{ color: C.gray, fontSize: 13, letterSpacing: 1 }}>FINAL SCENE</p>
          )}

          {/* Before / After 切换 */}
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', border: `1px solid ${C.border}`, background: C.bg,
          }}>
            {['Before', 'After'].map((label) => (
              <button
                key={label}
                onClick={() => setShowBefore(label === 'Before')}
                style={{
                  padding: '6px 20px', border: 'none', cursor: 'pointer',
                  background: (label === 'Before') === showBefore ? C.black : C.bg,
                  color: (label === 'Before') === showBefore ? C.bg : C.black,
                  fontSize: 11, letterSpacing: 1,
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* ── 右侧产品清单 ── */}
        <div style={{ width: 320, borderLeft: `1px solid ${C.lightGray}`, display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.lightGray}` }}>
            <div style={{ fontStyle: 'italic', fontSize: 16, letterSpacing: 2, marginBottom: 8 }}>sugarwave</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, letterSpacing: 2, color: C.gray }}>SELECTED ITEMS</span>
              <span style={{ fontSize: 10 }}>{productList.length} ITEMS</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {productList.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: C.gray }}>No products added</p>
              </div>
            ) : (
              productList.map((item) => (
                <div key={item.productId} style={{
                  display: 'flex', gap: 12, padding: '16px 24px',
                  borderBottom: `1px solid ${C.lightGray}`,
                }}>
                  {/* 产品图片 */}
                  <div style={{
                    width: 56, height: 56, background: '#f2f2f2',
                    flexShrink: 0, border: `1px solid ${C.lightGray}`,
                    overflow: 'hidden',
                  }}>
                    <img
                      src={item.src}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{item.name}</p>
                      {item.qty > 1 && (
                        <span style={{ fontSize: 10, color: C.gray }}>×{item.qty}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>{item.category || ''}</p>
                    <p style={{ fontSize: 12 }}>${item.price}{item.qty > 1 ? ` × ${item.qty} = $${item.price * item.qty}` : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 费用明细 */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.lightGray}` }}>
            {[
              ['Subtotal', `$${subtotal}`],
              ['Customization Fee', '$0'],
              ['Delivery & Setup', `$${delivery}`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.gray }}>{label}</span>
                <span style={{ fontSize: 11 }}>{val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.lightGray}` }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Estimated Total</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>${total}</span>
            </div>
          </div>

          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={{ width: '100%', padding: '12px', background: C.black, color: C.bg, border: 'none', fontSize: 11, letterSpacing: 2, cursor: 'pointer' }}>
              ADD TO CART
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '10px', border: `1px solid ${C.border}`, background: C.bg, fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>EXPORT</button>
              <button style={{ flex: 1, padding: '10px', border: `1px solid ${C.border}`, background: C.bg, fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>SPEC SHEET</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
