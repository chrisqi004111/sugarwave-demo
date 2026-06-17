import { useState } from 'react'
import { useAccessCode, applyCode, clearCode } from '../accessCode'

const C = { black: '#000', bg: '#fff', gray: '#888', border: '#d0d0d0', green: '#2d7a2d' }

// Minimal access-code entry. When no code is active it shows an input; once a
// valid code is applied it shows the live-mode status + remaining quota.
export default function AccessCodeEntry() {
  const active = useAccessCode()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function apply() {
    setErr('')
    setBusy(true)
    const r = await applyCode(code)
    setBusy(false)
    if (!r.ok) setErr(r.error === 'invalid code' ? 'Invalid or used-up code' : (r.error || 'Failed'))
    else setCode('')
  }

  if (active) {
    return (
      <div style={{ border: `1px solid ${C.green}`, background: '#f0faf0', padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: C.green, fontSize: 11, letterSpacing: 0.5 }}>● LIVE MODE · {active.code}</span>
          <span onClick={clearCode} style={{ color: C.gray, cursor: 'pointer', fontSize: 10, letterSpacing: 0.5 }}>✕ EXIT</span>
        </div>
        <div style={{ color: C.gray, fontSize: 11, marginTop: 5 }}>
          {active.clean} cleans · {active.render} renders left
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && apply()}
          placeholder="ACCESS CODE"
          maxLength={12}
          style={{
            flex: 1, border: `1px solid ${C.border}`, padding: '9px 10px',
            fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
            outline: 'none', background: '#f9f9f9',
          }}
        />
        <button onClick={apply} disabled={busy} style={{
          background: C.black, color: C.bg, border: 'none', padding: '9px 16px',
          fontSize: 11, letterSpacing: 1, cursor: busy ? 'default' : 'pointer',
        }}>{busy ? '…' : 'APPLY'}</button>
      </div>
      {err && <p style={{ color: '#c00', fontSize: 10, marginTop: 5 }}>{err}</p>}
      <p style={{ color: C.gray, fontSize: 10, marginTop: 6, lineHeight: 1.5 }}>
        Have an access code? Unlock real AI clean-up &amp; render.
      </p>
    </div>
  )
}
