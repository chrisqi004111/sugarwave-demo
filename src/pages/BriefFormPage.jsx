import { useState, useRef } from 'react'
import { Page, Container, track } from '../components/Layout'
import { C, kicker } from '../theme'
import { useNav } from '../nav'

const field = {
  width: '100%', padding: '12px 14px', fontSize: 14, marginBottom: 16,
  border: `1px solid ${C.border}`, background: C.bg, boxSizing: 'border-box',
  fontFamily: 'inherit',
}
const label = { fontSize: 12, color: C.gray, letterSpacing: 0.5, marginBottom: 6, display: 'block' }

const PROJECT_TYPES = ['Brand Space', 'Installation', 'Custom Furniture', 'Other / Not sure']

export default function BriefFormPage() {
  const { navigate } = useNav()
  const started = useRef(false)
  const [assets, setAssets] = useState([])
  const [type, setType] = useState('')

  // Fire brief_form_start exactly once, on first interaction with the form.
  function markStart() {
    if (started.current) return
    started.current = true
    track('brief_form_start')
  }

  function submit(e) {
    e.preventDefault()
    track('brief_form_submit', { projectType: type, assets: assets.length })
    navigate('lead-success')
  }

  return (
    <Page footer={false}>
      <Container style={{ paddingTop: 56, maxWidth: 720, paddingBottom: 80 }}>
        <p
          onClick={() => navigate('brand-space')}
          style={{ fontSize: 12, color: C.gray, cursor: 'pointer', marginBottom: 24 }}
        >
          ← Brand Space
        </p>
        <p style={kicker}>Start a project</p>
        <h1 style={{ fontSize: 40, fontWeight: 400, margin: '8px 0 12px' }}>Tell us about it</h1>
        <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.8, marginBottom: 36 }}>
          A few details and any references — we'll come back within two business days.
        </p>

        <form onSubmit={submit} onFocusCapture={markStart} onChange={markStart}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <span style={label}>Name</span>
              <input style={field} required />
            </div>
            <div style={{ flex: 1 }}>
              <span style={label}>Email</span>
              <input style={field} type="email" required />
            </div>
          </div>

          <span style={label}>Company / Brand (optional)</span>
          <input style={field} />

          <span style={label}>Project type</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            {PROJECT_TYPES.map(t => {
              const active = type === t
              return (
                <span
                  key={t}
                  onClick={() => { markStart(); setType(t) }}
                  style={{
                    fontSize: 13, padding: '9px 16px', cursor: 'pointer',
                    border: `1px solid ${active ? C.black : C.border}`,
                    background: active ? C.black : C.bg, color: active ? C.bg : C.black,
                  }}
                >
                  {t}
                </span>
              )
            })}
          </div>

          <span style={label}>Brief — goals, space, timeline, budget</span>
          <textarea style={{ ...field, minHeight: 120, resize: 'vertical' }} required />

          {/* Upload assets */}
          <span style={label}>Reference assets (optional)</span>
          <label style={{
            display: 'block', border: `1px dashed ${C.border}`, padding: '24px',
            textAlign: 'center', fontSize: 13, color: C.gray, cursor: 'pointer', marginBottom: 28,
          }}>
            {assets.length ? `${assets.length} file(s) attached` : '+ Upload images, PDFs or drawings'}
            <input
              type="file" multiple style={{ display: 'none' }}
              onChange={e => { markStart(); setAssets(Array.from(e.target.files)) }}
            />
          </label>

          <button type="submit" style={{
            background: C.black, color: C.bg, border: 'none',
            padding: '13px 32px', fontSize: 16, cursor: 'pointer',
          }}>
            Submit brief →
          </button>
        </form>
      </Container>
    </Page>
  )
}
