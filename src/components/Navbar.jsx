import { C, FONTS, NAV_HEIGHT, PAGE_PAD } from '../theme'
import { TOP_LEVEL, useNav } from '../nav'
import { track } from '../analytics'

// New information architecture — 6 top-level items.
// Service is removed: 定制/项目咨询 → Scene Lab, 工艺/材料/可持续 → Studio.
// Projects → Works. Styling mirrors sugarwavestudio.com (Myriad Pro, word-case).
const ITEMS = [
  { label: 'Shop', route: 'shop' },
  { label: 'Scene Lab', route: 'scene-lab' },
  { label: 'News', route: 'new' },
  { label: 'Works', route: 'works' },
  { label: 'Studio', route: 'studio' },
  { label: 'About', route: 'contact' },
]

export default function Navbar() {
  const { page, navigate } = useNav()
  const active = TOP_LEVEL[page] || 'home'

  function go(item) {
    track('nav_click', { item: item.label, route: item.route })
    navigate(item.route)
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: C.bg, borderBottom: `1px solid ${C.lightGray}`,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: `0 ${PAGE_PAD}px`, height: NAV_HEIGHT,
    }}>
      <img
        src="/logo.png"
        alt="sugarwave"
        onClick={() => { track('nav_click', { item: 'Logo', route: 'home' }); navigate('home') }}
        style={{ height: 44, objectFit: 'contain', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', gap: 40 }}>
        {ITEMS.map((item) => {
          const isActive = item.route === active
          return (
            <span
              key={item.label}
              onClick={() => go(item)}
              style={{
                fontFamily: FONTS.nav, fontSize: 18, cursor: 'pointer',
                textTransform: 'uppercase',
                color: isActive ? C.black : C.gray,
                fontWeight: isActive ? 700 : 400,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = C.black)}
              onMouseLeave={e => (e.currentTarget.style.color = isActive ? C.black : C.gray)}
            >
              {item.label}
            </span>
          )
        })}
      </div>
    </nav>
  )
}
