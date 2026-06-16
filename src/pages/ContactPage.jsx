import { useState } from 'react'
import { Page, Container, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'

const field = {
  width: '100%', padding: '12px 14px', fontSize: 14, marginBottom: 16,
  border: `1px solid ${C.border}`, background: C.bg, boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function ContactPage() {
  const { navigate } = useNav()
  const [subscribed, setSubscribed] = useState(false)

  function subscribe(e) {
    e.preventDefault()
    track('newsletter_subscribe')
    setSubscribed(true)
  }

  return (
    <Page>
      <Container style={{ paddingTop: 64, paddingBottom: 40 }}>
        <p style={kicker}>Contact</p>
        <h1 style={{ fontSize: 44, fontWeight: 400, marginBottom: 48 }}>Get in touch</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }}>
          {/* General contact */}
          <div>
            <p style={{ ...kicker, marginBottom: 16 }}>Say hello</p>
            <div style={{ fontSize: 15, lineHeight: 2.1, marginBottom: 32 }}>
              <div>General — hello@sugarwave.studio</div>
              <div>Press — press@sugarwave.studio</div>
              <div>Studio — Shenzhen, CN</div>
            </div>
            <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.8 }}>
              Working on a custom project or brand space?{' '}
              <span
                onClick={() => navigate('brand-space')}
                style={{ color: C.black, cursor: 'pointer', borderBottom: `1px solid ${C.black}` }}
              >
                Start a project in Scene Lab →
              </span>
            </p>
          </div>

          {/* Newsletter */}
          <div style={{ background: C.bgGray, padding: 36 }}>
            <p style={{ ...kicker, marginBottom: 12 }}>Newsletter</p>
            <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 10 }}>Stay in the loop</h2>
            {subscribed ? (
              <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.8 }}>
                ✓ You're subscribed. Welcome aboard.
              </p>
            ) : (
              <>
                <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.7, marginBottom: 20 }}>
                  New drops, works and studio notes. No noise.
                </p>
                <form onSubmit={subscribe}>
                  <input style={field} type="email" placeholder="Email address" required />
                  <button type="submit" style={{
                    background: C.black, color: C.bg, border: 'none', width: '100%',
                    padding: '13px', fontSize: 16, cursor: 'pointer',
                  }}>
                    Subscribe →
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </Container>
    </Page>
  )
}
