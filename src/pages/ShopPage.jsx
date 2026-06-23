import { useState } from 'react'
import { Page, Container } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'
import { CATALOG, CATEGORIES } from '../catalog'

const LABEL = { lighting: 'Lighting', table: 'Table', object: 'Object', container: 'Container' }

// 卡片内产品显示大小（占卡片比例）。默认 0.9；个别产品可单独微调。
const DEFAULT_SCALE = 0.9
const SHOP_SCALE = { fluffy: 0.81 }

// Buy line entry. Display-only in this demo — cards show image + name + price
// and are not clickable (no product detail page).
export default function ShopPage() {
  const { params } = useNav()
  const tabs = ['all', ...CATEGORIES]
  const initial = tabs.includes(params.collection) ? params.collection : 'all'
  const [collection, setCollection] = useState(initial)

  const filtered = collection === 'all'
    ? CATALOG
    : CATALOG.filter(p => p.category === collection)

  return (
    <Page>
      <Container style={{ paddingTop: 64 }}>
        <p style={kicker}>Shop</p>
        <h1 style={{ fontSize: 44, fontWeight: 400, marginBottom: 28 }}>Collections & Series</h1>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${C.lightGray}`, marginBottom: 40, flexWrap: 'wrap' }}>
          {tabs.map(slug => {
            const active = collection === slug
            return (
              <span
                key={slug}
                onClick={() => setCollection(slug)}
                style={{
                  fontSize: 13, letterSpacing: 1, cursor: 'pointer', paddingBottom: 14,
                  color: active ? C.black : C.gray,
                  borderBottom: active ? `2px solid ${C.black}` : '2px solid transparent',
                }}
              >
                {slug === 'all' ? 'All' : (LABEL[slug] || slug)}
              </span>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, marginBottom: 40 }}>
          {filtered.map(p => {
            const scale = `${(SHOP_SCALE[p.id] ?? DEFAULT_SCALE) * 100}%`
            return (
            <div key={p.id}>
              {/* 1:1 卡片，产品居中；scale 控制产品占卡片比例（个别产品可微调） */}
              <div style={{
                aspectRatio: '1 / 1', width: '100%', background: C.bgGray, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                  style={{ width: scale, height: scale, objectFit: 'contain', display: 'block' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: 16 }}>{p.name}</span>
                <span style={{ fontSize: 16, color: C.gray }}>€{p.price}</span>
              </div>
            </div>
            )
          })}
        </div>
        {filtered.length === 0 && (
          <p style={{ color: C.gray, fontSize: 14 }}>No products in this series yet.</p>
        )}
      </Container>
    </Page>
  )
}
