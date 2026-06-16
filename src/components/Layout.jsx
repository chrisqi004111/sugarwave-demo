import Navbar from './Navbar'
import { C, FONTS, NAV_HEIGHT, PAGE_WIDTH, PAGE_PAD, kicker } from '../theme'
import { useNav } from '../nav'
import { track } from '../analytics'

// ── Shared page shell ──────────────────────────────────────────────
// Every top-level page renders its own Navbar (App.jsx does not), so we
// wrap that + a footer here to keep the new IA pages consistent & DRY.
// Visuals mirror sugarwavestudio.com (1000px column, 50px gutters).
export function Page({ children, footer = true }) {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingTop: NAV_HEIGHT, color: C.black }}>
      <Navbar />
      {children}
      {footer && <Footer />}
    </div>
  )
}

export function Container({ children, style }) {
  return (
    <div style={{ maxWidth: PAGE_WIDTH, margin: '0 auto', padding: `0 ${PAGE_PAD}px`, ...style }}>
      {children}
    </div>
  )
}

// Small eyebrow + heading at the top of sections.
export function SectionHead({ kicker: k, title, sub, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 32, flexWrap: 'wrap', gap: 12,
    }}>
      <div>
        {k && <p style={kicker}>{k}</p>}
        {title && <h2 style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.25 }}>{title}</h2>}
        {sub && <p style={{ fontSize: 16, color: C.gray, marginTop: 10, maxWidth: 560, lineHeight: 1.5 }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// Primary (filled, black) / secondary (outline) call-to-action.
// Square corners + #7a7a7a hover to match the live site's Ant buttons.
export function Btn({ children, onClick, variant = 'primary', style }) {
  const base = {
    display: 'inline-block', padding: '12px 26px', fontSize: 16,
    fontFamily: FONTS.body, cursor: 'pointer', border: `1px solid ${C.black}`,
    borderRadius: 0, transition: 'all 0.18s', textAlign: 'center', userSelect: 'none',
  }
  const variants = {
    primary: {
      background: C.black, color: C.bg,
      hoverBg: C.gray, hoverBorder: C.gray, hoverColor: C.bg,
    },
    secondary: {
      background: 'transparent', color: C.black,
      hoverBg: 'transparent', hoverBorder: C.black, hoverColor: C.gray,
    },
  }
  const v = variants[variant]
  return (
    <span
      onClick={onClick}
      style={{ ...base, background: v.background, color: v.color, ...style }}
      onMouseEnter={e => {
        e.currentTarget.style.background = v.hoverBg
        e.currentTarget.style.borderColor = v.hoverBorder
        e.currentTarget.style.color = v.hoverColor
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = v.background
        e.currentTarget.style.borderColor = C.black
        e.currentTarget.style.color = v.color
      }}
    >
      {children}
    </span>
  )
}

// Neutral placeholder tile — replace with real imagery once supplied.
export function Placeholder({ label, ratio = '4/3', src, style }) {
  if (src) {
    return (
      <div style={{ aspectRatio: ratio, width: '100%', overflow: 'hidden', background: C.bgGray, ...style }}>
        <img src={src} alt={label || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    )
  }
  return (
    <div style={{
      aspectRatio: ratio, background: C.bgGray, width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.gray, fontFamily: FONTS.nav, fontSize: 14, ...style,
    }}>
      {label}
    </div>
  )
}

function Footer() {
  const { navigate } = useNav()
  const cols = [
    { head: 'Shop', links: [['All Products', 'shop'], ['New', 'new']] },
    { head: 'Scene Lab', links: [['Furniture Try-On', 'scene-lab'], ['Brand Space', 'brand-space']] },
    { head: 'Studio', links: [['Process & Materials', 'studio'], ['Works', 'works']] },
    { head: 'Contact', links: [['Get in touch', 'contact']] },
  ]
  return (
    <footer style={{ borderTop: `1px solid ${C.lightGray}`, marginTop: 96, padding: '56px 0 40px' }}>
      <Container style={{ display: 'flex', flexWrap: 'wrap', gap: 48, justifyContent: 'space-between' }}>
        <div style={{ minWidth: 200 }}>
          <div style={{ fontFamily: FONTS.heading, fontSize: 22, marginBottom: 12 }}>Sugarwave</div>
          <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.6, maxWidth: 240 }}>
            Robotic-printed furniture & spaces. Made to last, designed to be remade.
          </p>
        </div>
        {cols.map(col => (
          <div key={col.head}>
            <p style={{ ...kicker, marginBottom: 16, color: C.black }}>{col.head}</p>
            {col.links.map(([label, route]) => (
              <div
                key={label}
                onClick={() => navigate(route)}
                style={{ fontFamily: FONTS.nav, fontSize: 15, color: C.gray, marginBottom: 10, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.black)}
                onMouseLeave={e => (e.currentTarget.style.color = C.gray)}
              >
                {label}
              </div>
            ))}
          </div>
        ))}
      </Container>
      <Container style={{ marginTop: 48, fontFamily: FONTS.nav, fontSize: 13, color: C.gray }}>
        © {new Date().getFullYear()} Sugarwave — Prototype IA. {/* events fire to the on-screen ANALYTICS panel */}
      </Container>
    </footer>
  )
}

// Re-export track so pages can pull UI + analytics from one module.
// eslint-disable-next-line react-refresh/only-export-components
export { track }
