import { useState } from 'react'
import Navbar from '../components/Navbar'
import { sceneLabSidebar } from '../sceneLabLayout'
import { useNav } from '../nav'
import { addToCart } from '../cart'
import { track } from '../analytics'

const C = { bg: '#fff', black: '#000', gray: '#888', lightGray: '#e0e0e0', border: '#d0d0d0' }

export default function SummaryPage({ beforeImage, afterImage, placement, items = [], onBack }) {
  const { navigate } = useNav()
  const [showBefore, setShowBefore] = useState(false)

  // After 视图兜底：① 有成片(afterImage：预设/实时截图) → 直接显示；
  // ② 否则若有 DEMO 放置叠层 → 用「清理后场景 + 产品 PNG 叠层」还原；③ 都没有 → 只显示清理后场景。
  const overlayItems = (!showBefore && !afterImage && placement?.items?.length) ? placement.items : null
  const displayImage = showBefore ? beforeImage : (afterImage || beforeImage)

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

  // ADD TO CART：把「Your Design」里选中的产品加入共享购物车，顶部购物车数量即时更新。
  function handleAddToCart() {
    if (productList.length === 0) return
    productList.forEach(item =>
      addToCart({ slug: item.productId, name: item.name, price: item.price, image: item.src, dimensions: item.dimensions }, item.qty)
    )
    track('add_to_cart', { from: 'scene_lab_summary', lines: productList.length, total: subtotal })
    navigate('cart')
  }

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

        {/* ── 左侧图片区：图片以「可用高度」为基准最大化（上下不留边），
            剩余左右留白用全幅毛玻璃填充；overflow:hidden 兜底，不溢出到右侧 cart / 导航。*/}
        <div style={{
          flex: 1, background: '#f2f2f2', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {/* 全幅毛玻璃背景：被本区域 overflow:hidden 裁出清晰边界，跟随 Before/After 当前图 */}
          {displayImage && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              backgroundImage: `url(${displayImage})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(24px) brightness(0.92)', transform: 'scale(1.1)',
            }} />
          )}
          {/* 图片填满工作区高度、保持原比例、不裁切；左右留白显示毛玻璃。
              DEMO 无成片时，在场景图上按比例还原放置的产品 PNG 叠层。*/}
          {displayImage ? (
            <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
              <img
                src={displayImage}
                alt={showBefore ? 'before' : 'after'}
                style={{ display: 'block', height: '100%', width: 'auto', objectFit: 'contain' }}
              />
              {overlayItems && overlayItems.map((o, i) => (
                <img
                  key={i}
                  src={o.src}
                  alt={o.name || 'product'}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                  style={{
                    position: 'absolute',
                    left: `${o.xRatio * 100}%`, top: `${o.yRatio * 100}%`,
                    width: `${o.wRatio * 100}%`, height: 'auto',
                    transform: `translate(-50%, -50%) rotate(${o.rotation || 0}deg)`,
                    opacity: o.opacity ?? 1,
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.35))',
                  }}
                />
              ))}
            </div>
          ) : (
            <p style={{ position: 'relative', zIndex: 1, color: C.gray, fontSize: 13, letterSpacing: 1 }}>FINAL SCENE</p>
          )}

          {/* Before / After 切换 */}
          <div style={{
            position: 'absolute', zIndex: 2, bottom: 20, left: '50%', transform: 'translateX(-50%)',
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
        <div style={{ ...sceneLabSidebar, display: 'flex', flexDirection: 'column' }}>

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
                    <p style={{ fontSize: 12 }}>€{item.price}{item.qty > 1 ? ` × ${item.qty} = €${item.price * item.qty}` : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 费用明细 */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.lightGray}` }}>
            {[
              ['Subtotal', `€${subtotal}`],
              ['Customization Fee', '€0'],
              ['Delivery & Setup', `€${delivery}`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.gray }}>{label}</span>
                <span style={{ fontSize: 11 }}>{val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.lightGray}` }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Estimated Total</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>€{total}</span>
            </div>
          </div>

          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleAddToCart}
              disabled={productList.length === 0}
              style={{
                width: '100%', padding: '12px', background: C.black, color: C.bg, border: 'none',
                fontSize: 11, letterSpacing: 2, cursor: productList.length === 0 ? 'not-allowed' : 'pointer',
                opacity: productList.length === 0 ? 0.4 : 1,
              }}>
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
