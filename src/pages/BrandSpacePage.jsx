import { Page, Container, SectionHead, Placeholder, Btn, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'

const CAPABILITIES = [
  ['Brand Spaces', 'Pop-ups, retail and showroom environments built around your brand.'],
  ['Installations', 'Site-specific sculptural pieces for lobbies, events and public space.'],
  ['Custom Furniture', 'Bespoke seating, tables and objects, robotic-printed to spec.'],
  ['Case-by-Case', 'One-off collaborations — we scope, prototype and deliver.'],
]

const STEPS = [
  ['01', 'Brief', 'Share goals, space, references and timeline.'],
  ['02', 'Concept', 'We propose direction, materials and budget.'],
  ['03', 'Make', 'Robotic printing and fabrication in-studio.'],
  ['04', 'Deliver', 'Install on site, handover and aftercare.'],
]

export default function BrandSpacePage() {
  const { navigate } = useNav()

  const startProject = () => {
    track('start_project_click', { from: 'brand_space' })
    navigate('brief')
  }

  return (
    <Page>
      <Container style={{ paddingTop: 64 }}>
        <p style={kicker}>Scene Lab · Commercial Custom</p>
        <h1 style={{ fontSize: 48, fontWeight: 400, lineHeight: 1.15, maxWidth: 680, margin: '8px 0 16px' }}>
          Brand spaces & custom work, made to order.
        </h1>
        <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.8, maxWidth: 560, marginBottom: 32 }}>
          We work with brands, studios and institutions on custom furniture, installations
          and full spaces — robotic-printed, sustainable, case-by-case.
        </p>
        <Btn onClick={startProject}>Start a project →</Btn>
      </Container>

      <Container style={{ marginTop: 80 }}>
        <SectionHead kicker="What we do" title="Capabilities" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {CAPABILITIES.map(([t, d]) => (
            <div key={t} style={{ border: `1px solid ${C.lightGray}`, padding: 28 }}>
              <h3 style={{ fontSize: 17, fontWeight: 400, marginBottom: 8 }}>{t}</h3>
              <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.7 }}>{d}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container style={{ marginTop: 80 }}>
        <SectionHead kicker="How it works" title="From brief to delivery" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {STEPS.map(([n, t, d]) => (
            <div key={n}>
              <div style={{ fontSize: 13, color: C.gray, marginBottom: 10 }}>{n}</div>
              <Placeholder label={t} ratio="4/3" />
              <h3 style={{ fontSize: 15, fontWeight: 400, margin: '14px 0 6px' }}>{t}</h3>
              <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.6 }}>{d}</p>
            </div>
          ))}
        </div>
      </Container>

      <div style={{ background: C.bgGray, padding: '56px 0', marginTop: 80 }}>
        <Container style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 26, fontWeight: 400, maxWidth: 520 }}>
            Have a project in mind?
          </h2>
          <Btn onClick={startProject}>Start a project →</Btn>
        </Container>
      </div>
    </Page>
  )
}
