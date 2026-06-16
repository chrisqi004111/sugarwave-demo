import { useEffect, useState } from 'react'
import { ROUTES, useNav } from '../nav'

// On-screen analytics console. Every track() call appears here so the
// structure + 埋点 spec is visible while clicking through the prototype.
export default function EventLog() {
  const [events, setEvents] = useState([])
  const [open, setOpen] = useState(true)
  const { page } = useNav()

  useEffect(() => {
    const onTrack = (e) => setEvents((prev) => [e.detail, ...prev].slice(0, 40))
    window.addEventListener('sw-track', onTrack)
    return () => window.removeEventListener('sw-track', onTrack)
  }, [])

  const fmt = (ts) => new Date(ts).toLocaleTimeString('en-GB')

  return (
    <div style={{
      position: 'fixed', bottom: 0, right: 0, zIndex: 9999,
      width: open ? 320 : 'auto', fontFamily: 'monospace',
    }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, background: '#111', color: '#0f0', cursor: 'pointer',
          padding: '8px 12px', fontSize: 11, letterSpacing: 1,
        }}
      >
        <span>● ANALYTICS{events.length ? ` · ${events.length}` : ''}</span>
        <span style={{ color: '#888' }}>{ROUTES[page] || ''}</span>
        <span style={{ color: '#888' }}>{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <div style={{
          background: '#0b0b0b', color: '#ccc', maxHeight: 280,
          overflowY: 'auto', borderTop: '1px solid #222',
        }}>
          {events.length === 0 && (
            <div style={{ padding: 12, fontSize: 11, color: '#666' }}>
              Click around — events fire here.
            </div>
          )}
          {events.map((e) => (
            <div key={e.id} style={{
              padding: '7px 12px', borderBottom: '1px solid #1a1a1a', fontSize: 11,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#0f0' }}>{e.event}</span>
                <span style={{ color: '#555' }}>{fmt(e.ts)}</span>
              </div>
              {Object.keys(e.payload).length > 0 && (
                <div style={{ color: '#789', marginTop: 2, wordBreak: 'break-all' }}>
                  {JSON.stringify(e.payload)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
