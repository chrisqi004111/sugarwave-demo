import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import BeforeAfterSlider from '../components/BeforeAfterSlider'
import { sceneLabSidebar } from '../sceneLabLayout'
import { useNav } from '../nav'
import { useIsMobile } from '../useIsMobile'
import { addToCart } from '../cart'
import { saveDesign } from '../savedDesign'
import { track } from '../analytics'

const C = { bg: '#fff', black: '#000', gray: '#888', lightGray: '#e0e0e0', border: '#d0d0d0' }

export default function SummaryPage({ beforeImage, afterImage, placement, items = [], onBack }) {
  const { navigate } = useNav()
  const isMobile = useIsMobile()
  const [saved, setSaved] = useState(false)

  // AFTER 兜底链（绝不显示无关图）：
  //   render  → afterImage（AI 成片 / 截图）
  //   overlay → 清理后场景 + 放置叠层（产品 PNG）
  //   scene   → 仅清理后场景
  const afterSource = afterImage ? 'render' : (placement?.items?.length ? 'overlay' : 'scene')
  const overlayItems = afterSource === 'overlay' ? placement.items : null
  const bgImage = afterImage || beforeImage  // 毛玻璃背景跟随 AFTER 图

  useEffect(() => {
    if (afterSource === 'render') console.log('Your Design: using AI render result')
    else if (afterSource === 'overlay') console.log('Your Design: using placement overlay fallback')
    else console.log('Your Design: no render or overlay found, using cleaned scene')
  }, [afterSource])

  // 移动端：把预览舞台比例设成「当前 AFTER 图」的真实比例 —— contain 不留黑边、
  // 产品叠层按比例对齐、不溢出、不变形。
  const [sceneAspect, setSceneAspect] = useState(null)
  useEffect(() => {
    if (!bgImage) { setSceneAspect(null); return }
    const img = new Image()
    img.onload = () => setSceneAspect(
      img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null,
    )
    img.src = bgImage
  }, [bgImage])

  const imgFill = { width: '100%', height: '100%', objectFit: 'contain', display: 'block' }
  // AFTER 图层内容：成片 / 场景图 + 产品叠层 / 仅场景图（都不破页）。
  const afterNode = afterImage ? (
    <img src={afterImage} alt="after" draggable={false} style={imgFill} />
  ) : (
    <>
      <img src={beforeImage} alt="after" draggable={false} style={imgFill} />
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
            opacity: o.opacity ?? 1, pointerEvents: 'none',
            filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.35))',
          }}
        />
      ))}
    </>
  )

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

  // SAVE：把当前「最终设计」存到 localStorage，回到 Scene Lab 首页右侧自动展示。
  function handleSave() {
    saveDesign({
      beforeImage,                     // 清理后的场景图
      afterImage: afterImage || null,  // 成片（若有）
      placement: placement || null,    // 产品叠层（无成片时用于合成预览）
      items,                           // 选中产品（含图/价/名）
      total,                           // 预估总价
      productCount: productList.length,
    })
    track('save_design', { from: 'scene_lab_summary', lines: productList.length, total })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingTop: 64 }}>
      <Navbar activePage="SCENE LAB" />

      {/* Action bar — desktop: Back | title | Share/Save on one row.
          Mobile: Back … Share/Save (no overlap), title on its own row below. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: isMobile ? '10px 16px' : '10px 24px',
        borderBottom: isMobile ? 'none' : `1px solid ${C.lightGray}`,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: `1px solid ${C.border}`, flexShrink: 0,
          padding: '6px 16px', fontSize: 11, letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>← BACK TO SCENE</button>
        {!isMobile && <h2 style={{ fontSize: 13, letterSpacing: 3, fontWeight: 500 }}>YOUR DESIGN</h2>}
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          <button style={{ border: `1px solid ${C.border}`, background: C.bg, padding: '6px 16px', fontSize: 11, letterSpacing: 1, cursor: 'pointer' }}>SHARE</button>
          <button onClick={handleSave} style={{ border: `1px solid ${C.black}`, background: saved ? '#2d7a2d' : C.black, color: C.bg, padding: '6px 16px', fontSize: 11, letterSpacing: 1, cursor: 'pointer', borderColor: saved ? '#2d7a2d' : C.black }}>{saved ? 'SAVED ✓' : 'SAVE'}</button>
        </div>
      </div>
      {isMobile && (
        <div style={{ padding: '6px 16px 12px', borderBottom: `1px solid ${C.lightGray}` }}>
          <h2 style={{ fontSize: 13, letterSpacing: 3, fontWeight: 500 }}>YOUR DESIGN</h2>
        </div>
      )}

      <div style={{
        display: 'flex',
        ...(isMobile ? { flexDirection: 'column', height: 'auto' } : { height: 'calc(100vh - 112px)' }),
      }}>

        {/* ── 左侧图片区：图片以「可用高度」为基准最大化（上下不留边），
            剩余左右留白用全幅毛玻璃填充；overflow:hidden 兜底，不溢出到右侧 cart / 导航。*/}
        <div style={{
          ...(isMobile
            ? { width: '100%', aspectRatio: sceneAspect ? String(sceneAspect) : '4 / 3', flexShrink: 0 }
            : { flex: 1 }),
          background: '#f2f2f2', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {/* 全幅毛玻璃背景：被本区域 overflow:hidden 裁出清晰边界，跟随 AFTER 图 */}
          {bgImage && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(24px) brightness(0.92)', transform: 'scale(1.1)',
            }} />
          )}
          {/* Before / After 拖拽对比滑块：左 Before(清理后场景)、右 After(成片或场景+叠层)。
              两层共用同一舞台尺寸，容器尺寸稳定、不跳变。 */}
          {beforeImage ? (
            <div style={{ position: 'relative', zIndex: 1, height: '100%', ...(isMobile ? { width: '100%' } : {}) }}>
              {/* Mobile: fill mode (fit width, no overflow); desktop: tight self-size */}
              <BeforeAfterSlider fill={isMobile} beforeSrc={beforeImage} after={afterNode} />
            </div>
          ) : (
            <p style={{ position: 'relative', zIndex: 1, color: C.gray, fontSize: 13, letterSpacing: 1 }}>FINAL SCENE</p>
          )}
        </div>

        {/* ── 右侧产品清单 ── */}
        <div style={{ ...sceneLabSidebar, ...(isMobile ? { width: '100%' } : {}), display: 'flex', flexDirection: 'column' }}>

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

          <div style={{
            padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8,
            paddingBottom: isMobile ? 'calc(40px + env(safe-area-inset-bottom, 0px))' : 16,
          }}>
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
