import { useEffect } from 'react'
import { Page, Container, Btn, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'

export default function LeadSuccessPage() {
  const { navigate } = useNav()

  // Conversion event for the project line.
  useEffect(() => {
    track('lead_submit_success')
  }, [])

  return (
    <Page>
      <Container style={{ paddingTop: 96, paddingBottom: 64, maxWidth: 560, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', border: `1px solid ${C.black}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px', fontSize: 22,
        }}>
          ✓
        </div>
        <p style={kicker}>Brief received</p>
        <h1 style={{ fontSize: 40, fontWeight: 400, margin: '12px 0 16px' }}>
          Thanks — we've got it.
        </h1>
        <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.8, marginBottom: 36 }}>
          Our studio will review your project and get back to you within two business days.
          In the meantime, take a look at recent works.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Btn onClick={() => navigate('works')}>View works →</Btn>
          <Btn variant="secondary" onClick={() => navigate('home')}>Back to home</Btn>
        </div>
      </Container>
    </Page>
  )
}
