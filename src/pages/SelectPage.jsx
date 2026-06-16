import Navbar from '../components/Navbar'

export default function SelectPage({ onSelect }) {
  const C = { bg: '#fff', black: '#000', gray: '#888', lightGray: '#e0e0e0', border: '#d0d0d0' }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="SCENE LAB" />
      <div style={{ flex: 1, display: 'flex', paddingTop: 64 }}>
        {[
          { label: 'AI RECOMMENDATION', sub: 'Let AI suggest products that match your space style', btn: 'START WITH AI' },
          { label: 'MANUAL SELECTION', sub: 'Browse the full product library yourself', btn: 'START WITH SCRATCH' },
        ].map((item, i) => (
          <div key={i}
            onClick={onSelect}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              borderRight: i === 0 ? `1px solid ${C.lightGray}` : 'none',
              padding: 60, cursor: 'pointer', transition: 'background 0.2s', gap: 24,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
            onMouseLeave={e => e.currentTarget.style.background = C.bg}
          >
            <div style={{ width: '100%', maxWidth: 280, aspectRatio: '4/3', background: '#f2f2f2' }} />
            <p style={{ fontSize: 11, letterSpacing: 3, color: C.gray }}>{item.label}</p>
            <p style={{ fontSize: 14, color: C.black, textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>
              {item.sub}
            </p>
            <button style={{
              border: `1px solid ${C.black}`, padding: '12px 32px',
              fontSize: 11, letterSpacing: 2, cursor: 'pointer',
              background: C.bg, color: C.black, transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.black; e.currentTarget.style.color = C.bg }}
              onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.black }}
            >
              {item.btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}