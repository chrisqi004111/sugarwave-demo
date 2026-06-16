import { useState } from 'react'
import { Page, Container, Placeholder, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'
import { PRODUCTS, COLLECTIONS } from '../data'

// Buy line entry. Product series live HERE (Collections / Series) — NOT in Works.
export default function ShopPage() {
  const { params, navigate } = useNav()
  // Pre-select the series when arriving from a homepage category card.
  const [collection, setCollection] = useState(params.collection || 'all')

  const filtered = collection === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.series.toLowerCase() === collection)

  return (
    <Page>
      <Container style={{ paddingTop: 64 }}>
        <p style={kicker}>Shop</p>
        <h1 style={{ fontSize: 44, fontWeight: 400, marginBottom: 28 }}>Collections & Series</h1>

        {/* Collection / Series filter */}
        <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${C.lightGray}`, marginBottom: 40, flexWrap: 'wrap' }}>
          {[{ slug: 'all', name: 'All' }, ...COLLECTIONS].map(c => {
            const active = collection === c.slug
            return (
              <span
                key={c.slug}
                onClick={() => setCollection(c.slug)}
                style={{
                  fontSize: 13, letterSpacing: 1, cursor: 'pointer', paddingBottom: 14,
                  color: active ? C.black : C.gray,
                  borderBottom: active ? `2px solid ${C.black}` : '2px solid transparent',
                }}
              >
                {c.name}
              </span>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, marginBottom: 40 }}>
          {filtered.map(p => (
            <div
              key={p.slug}
              onClick={() => {
                track('featured_product_click', { slug: p.slug, name: p.name, from: 'shop' })
                navigate('product', { slug: p.slug })
              }}
              style={{ cursor: 'pointer' }}
            >
              <Placeholder src={p.image} label={p.name} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: 16 }}>{p.name}</span>
                <span style={{ fontSize: 16, color: C.gray }}>${p.price}</span>
              </div>
              <p style={{ fontSize: 14, color: C.gray, marginTop: 4 }}>{p.blurb}</p>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p style={{ color: C.gray, fontSize: 14 }}>No products in this series yet.</p>
        )}
      </Container>
    </Page>
  )
}
