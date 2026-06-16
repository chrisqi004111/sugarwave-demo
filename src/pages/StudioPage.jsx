import { Page, Container, SectionHead, Placeholder, Btn } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'

// Studio absorbs former Service content: robotic printing, materials,
// sustainability and process / craft explanations.
const PILLARS = [
  ['Robotic Printing', 'Large-format robotic 3D printing lets us make complex, single-piece structures with almost no waste — and reprint on demand.'],
  ['Materials', 'Recycled PETG, bio-PLA and other recyclable polymers. Pieces can be returned, ground down and remade.'],
  ['Sustainability', 'Made-to-order means no dead stock. Local production shortens supply chains and cuts shipping.'],
  ['Craft & Finish', 'Print paths are designed as surface texture. Each piece is hand-finished and quality-checked in studio.'],
]

export default function StudioPage() {
  const { navigate } = useNav()

  return (
    <Page>
      <Container style={{ paddingTop: 64 }}>
        <p style={kicker}>Studio</p>
        <h1 style={{ fontSize: 48, fontWeight: 400, lineHeight: 1.15, maxWidth: 700, margin: '8px 0 16px' }}>
          Robotic printing, recycled materials, made to be remade.
        </h1>
        <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.8, maxWidth: 560, marginBottom: 48 }}>
          How we make things — the process, materials and sustainability principles
          behind every product and custom project.
        </p>
        <Placeholder label="The studio" ratio="16/9" style={{ marginBottom: 72 }} />
      </Container>

      <Container>
        <SectionHead kicker="Process & materials" title="How it's made" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
          {PILLARS.map(([t, d]) => (
            <div key={t} style={{ borderTop: `1px solid ${C.black}`, paddingTop: 20 }}>
              <h3 style={{ fontSize: 19, fontWeight: 400, marginBottom: 10 }}>{t}</h3>
              <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.8 }}>{d}</p>
            </div>
          ))}
        </div>
      </Container>

      <div style={{ background: C.bgGray, padding: '56px 0', marginTop: 80 }}>
        <Container style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 6 }}>Want this for a project?</h2>
            <p style={{ fontSize: 14, color: C.gray }}>Custom work and brand spaces run through Scene Lab.</p>
          </div>
          <Btn onClick={() => navigate('brand-space')}>Commission custom →</Btn>
        </Container>
      </div>
    </Page>
  )
}
