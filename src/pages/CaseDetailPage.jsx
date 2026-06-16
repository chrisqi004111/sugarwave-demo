import { Page, Container, Placeholder, Btn, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'
import { WORKS } from '../data'

export default function CaseDetailPage() {
  const { params, navigate } = useNav()
  const work = WORKS.find(w => w.slug === params.slug) || WORKS[0]

  return (
    <Page>
      <Container style={{ paddingTop: 56 }}>
        <p
          onClick={() => navigate('works')}
          style={{ fontSize: 12, color: C.gray, cursor: 'pointer', marginBottom: 32 }}
        >
          ← Works
        </p>

        <p style={kicker}>{work.type} · {work.client}</p>
        <h1 style={{ fontSize: 38, fontWeight: 400, lineHeight: 1.2, maxWidth: 720, margin: '8px 0 32px' }}>
          {work.name}
        </h1>

        <Placeholder label={work.name} ratio="16/9" style={{ marginBottom: 40 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48, marginBottom: 56 }}>
          <div>
            <p style={{ ...kicker, marginBottom: 16 }}>Project</p>
            <div style={{ fontSize: 14, color: C.gray, lineHeight: 2 }}>
              <div><span style={{ color: C.black }}>Client</span> — {work.client}</div>
              <div><span style={{ color: C.black }}>Type</span> — {work.type}</div>
              <div><span style={{ color: C.black }}>Process</span> — Robotic print</div>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: C.black, marginBottom: 20 }}>
              A case-by-case commission developed end-to-end with the studio — from brief
              and concept through robotic fabrication and on-site install.
            </p>
            <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.9 }}>
              Each work is non-standard: scoped to the space, the brand and the brief.
              Materials are recycled and recyclable, in keeping with our studio process.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 64 }}>
          <Placeholder label="Detail" ratio="4/3" />
          <Placeholder label="Detail" ratio="4/3" />
        </div>

        <div style={{ background: C.bgGray, padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 6 }}>Have a similar project?</h2>
            <p style={{ fontSize: 14, color: C.gray }}>Let's scope it together.</p>
          </div>
          <Btn
            onClick={() => {
              track('work_case_contact_click', { slug: work.slug })
              navigate('contact')
            }}
          >
            Get in touch →
          </Btn>
        </div>
      </Container>
    </Page>
  )
}
