import { Page, Container, Placeholder, track } from '../components/Layout'
import { kicker } from '../theme'
import { useNav } from '../nav'
import { LAUNCHES, PRODUCTS, WORKS } from '../data'

// New = launches + news. Routes a launch to its product or work where possible.
export default function NewPage() {
  const { navigate } = useNav()

  function open(item) {
    const product = PRODUCTS.find(p => p.slug === item.slug)
    if (product) {
      track('featured_product_click', { slug: product.slug, from: 'new' })
      navigate('product', { slug: product.slug })
      return
    }
    const work = WORKS.find(w => w.slug === item.slug)
    if (work) {
      track('works_card_click', { slug: work.slug, from: 'new' })
      navigate('case', { slug: work.slug })
    }
  }

  const [feature, ...rest] = LAUNCHES

  return (
    <Page>
      <Container style={{ paddingTop: 64 }}>
        <p style={kicker}>New</p>
        <h1 style={{ fontSize: 44, fontWeight: 400, marginBottom: 40 }}>Launches & News</h1>

        {/* Featured launch */}
        <div onClick={() => open(feature)} style={{ cursor: 'pointer', marginBottom: 64 }}>
          <Placeholder label={feature.title} ratio="16/9" />
          <p style={{ ...kicker, marginTop: 18, marginBottom: 8 }}>{feature.kind} · {feature.date}</p>
          <h2 style={{ fontSize: 26, fontWeight: 400, maxWidth: 640 }}>{feature.title}</h2>
        </div>

        {/* Rest of the feed */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
          {rest.map(item => (
            <div key={item.slug} onClick={() => open(item)} style={{ cursor: 'pointer' }}>
              <Placeholder label={item.title} ratio="16/9" />
              <p style={{ ...kicker, marginTop: 16, marginBottom: 6 }}>{item.kind} · {item.date}</p>
              <p style={{ fontSize: 17 }}>{item.title}</p>
            </div>
          ))}
        </div>
      </Container>
    </Page>
  )
}
