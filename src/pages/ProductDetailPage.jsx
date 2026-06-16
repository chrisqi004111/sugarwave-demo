import { useEffect } from 'react'
import { Page, Container, Btn, Placeholder, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'
import { PRODUCTS } from '../data'
import { addToCart } from '../cart'

export default function ProductDetailPage() {
  const { params, navigate } = useNav()
  const product = PRODUCTS.find(p => p.slug === params.slug) || PRODUCTS[0]

  // Fire product_detail_view once the detail is shown.
  useEffect(() => {
    track('product_detail_view', { slug: product.slug, name: product.name })
  }, [product.slug, product.name])

  return (
    <Page>
      <Container style={{ paddingTop: 56 }}>
        <p
          onClick={() => navigate('shop')}
          style={{ fontSize: 12, color: C.gray, cursor: 'pointer', marginBottom: 32 }}
        >
          ← Shop
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'start' }}>
          <Placeholder src={product.image} label={product.name} ratio="1/1" />

          <div>
            <p style={kicker}>{product.series}</p>
            <h1 style={{ fontSize: 32, fontWeight: 400, margin: '6px 0 12px' }}>{product.name}</h1>
            <p style={{ fontSize: 20, color: C.black, marginBottom: 24 }}>${product.price}</p>
            <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.8, marginBottom: 32 }}>
              {product.blurb} Robotic-printed to order in recycled material — each piece
              is made on demand and can be returned to be remade.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
              <Btn
                onClick={() => {
                  track('add_to_cart', { slug: product.slug, name: product.name, price: product.price })
                  addToCart(product)
                  navigate('cart')
                }}
              >
                Add to cart
              </Btn>
              <Btn
                variant="secondary"
                onClick={() => {
                  track('scene_lab_cta_click', { from: 'product_detail', slug: product.slug })
                  navigate('scene-lab')
                }}
              >
                See it in your space →
              </Btn>
            </div>

            <div style={{ borderTop: `1px solid ${C.lightGray}`, paddingTop: 20, fontSize: 13, color: C.gray, lineHeight: 2 }}>
              <div>Made to order · 2–3 weeks</div>
              <div>Recycled / recyclable material</div>
              <div>Free returns for remake</div>
            </div>
          </div>
        </div>
      </Container>
    </Page>
  )
}
