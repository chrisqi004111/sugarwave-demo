import { Page, Container, Placeholder, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'
import { WORKS } from '../data'

// Works = non-standard project case studies: sculpture, exhibition,
// installation, brand collaboration, case-by-case custom work.
// (Product series live in Shop → Collections, NOT here.)
export default function WorksPage() {
  const { navigate } = useNav()

  return (
    <Page>
      <Container style={{ paddingTop: 64 }}>
        <p style={kicker}>Works</p>
        <h1 style={{ fontSize: 44, fontWeight: 400, marginBottom: 12 }}>Selected Works</h1>
        <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.8, maxWidth: 560, marginBottom: 48 }}>
          Sculpture, exhibitions, installations and brand collaborations — non-standard,
          case-by-case projects from the studio.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
          {WORKS.map(w => (
            <div
              key={w.slug}
              onClick={() => {
                track('works_card_click', { slug: w.slug, type: w.type })
                navigate('case', { slug: w.slug })
              }}
              style={{ cursor: 'pointer' }}
            >
              <Placeholder label={w.name} ratio="4/3" />
              <p style={{ ...kicker, marginTop: 16, marginBottom: 6 }}>{w.type} · {w.client}</p>
              <p style={{ fontSize: 17 }}>{w.name}</p>
            </div>
          ))}
        </div>
      </Container>
    </Page>
  )
}
