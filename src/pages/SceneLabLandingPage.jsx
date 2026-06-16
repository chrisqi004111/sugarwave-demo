import { Page, Container, Placeholder, Btn, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'

// Scene Lab landing — two entries per spec:
//   1. Furniture Try-On      → existing AI try-on sub-flow ('try-on')
//   2. Brand Space / Custom  → commercial custom project line ('brand-space')
// Absorbs former Service content: 定制 / 项目咨询.
const ENTRIES = [
  {
    service: 'furniture-try-on',
    route: 'try-on',
    kicker: 'For your home',
    title: 'Furniture Try-On',
    body: 'Upload a photo of your room. AI clears the scene and places our pieces so you can see the fit before you buy.',
    cta: 'Try it on →',
  },
  {
    service: 'brand-space',
    route: 'brand-space',
    kicker: 'For brands & spaces',
    title: 'Brand Space / Commercial Custom',
    body: 'Custom furniture, installations and brand spaces — case-by-case. Project consulting from brief to delivery.',
    cta: 'Start a project →',
  },
]

export default function SceneLabLandingPage() {
  const { navigate } = useNav()

  function select(entry) {
    track('scene_lab_service_select', { service: entry.service })
    navigate(entry.route)
  }

  return (
    <Page>
      <Container style={{ paddingTop: 64, paddingBottom: 16 }}>
        <p style={kicker}>Scene Lab</p>
        <h1 style={{ fontSize: 48, fontWeight: 400, lineHeight: 1.15, maxWidth: 680, margin: '8px 0 16px' }}>
          See it in your space before it exists.
        </h1>
        <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.8, maxWidth: 560, marginBottom: 48 }}>
          Two ways in — visualize our products in your own room, or commission a custom
          piece, installation or brand space with our studio.
        </p>
      </Container>

      <Container style={{ paddingBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
          {ENTRIES.map(e => (
            <div
              key={e.service}
              onClick={() => select(e)}
              style={{ border: `1px solid ${C.lightGray}`, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={ev => (ev.currentTarget.style.borderColor = C.black)}
              onMouseLeave={ev => (ev.currentTarget.style.borderColor = C.lightGray)}
            >
              <Placeholder label={e.title} ratio="16/10" style={{ aspectRatio: '16/10' }} />
              <div style={{ padding: 28 }}>
                <p style={kicker}>{e.kicker}</p>
                <h2 style={{ fontSize: 24, fontWeight: 400, margin: '6px 0 12px' }}>{e.title}</h2>
                <p style={{ fontSize: 16, color: C.gray, lineHeight: 1.5, marginBottom: 20 }}>{e.body}</p>
                <span style={{ fontSize: 16 }}>{e.cta}</span>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Custom / project consulting note (moved from former Service) */}
      <Container>
        <div style={{ background: C.bgGray, padding: '40px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 520 }}>
            <p style={kicker}>Custom & project consulting</p>
            <p style={{ fontSize: 16, lineHeight: 1.5, marginTop: 8 }}>
              Not sure which way to go? Tell us about your project and we'll route it to the
              right team — product, custom build or full space.
            </p>
          </div>
          <Btn onClick={() => { track('scene_lab_service_select', { service: 'brand-space', from: 'consult' }); navigate('brand-space') }}>
            Talk to the studio →
          </Btn>
        </div>
      </Container>
    </Page>
  )
}
