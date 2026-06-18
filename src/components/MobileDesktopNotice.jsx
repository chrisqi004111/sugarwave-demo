import Navbar from './Navbar'

const C = { bg: '#fff', black: '#000', gray: '#888' }

// Shown in place of the canvas-heavy desktop interactions (AI Clean, Product
// Placement) when viewed on a phone. Keeps the demo flowing via "Continue Demo"
// instead of presenting a broken canvas. Minimal sugarwave styling.
export default function MobileDesktopNotice({ onContinue, label = 'Continue Demo' }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingTop: 64, display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 11, letterSpacing: 3, color: C.gray, marginBottom: 14 }}>SCENE LAB</p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: C.black, marginBottom: 8 }}>
            This interaction is optimized for desktop.
          </p>
          <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, marginBottom: 28 }}>
            Continue with the demo result, or open this demo on desktop for the full hands-on experience.
          </p>
          <button onClick={onContinue} style={{
            width: '100%', padding: '14px', background: C.black, color: C.bg,
            border: 'none', fontSize: 12, letterSpacing: 2, cursor: 'pointer',
          }}>{label.toUpperCase()}</button>
        </div>
      </div>
    </div>
  )
}
