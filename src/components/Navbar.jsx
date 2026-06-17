import { C, FONTS, NAV_HEIGHT } from '../theme'
import { useNav } from '../nav'
import { track } from '../analytics'
import CartMenu from './CartMenu'

// 顶栏左右内距 = Scene Lab 首页左面板的内距(40)，让 logo 左缘与下方「SCENE LAB」对齐
const NAV_PAD = 40

// Portfolio demo — 顶栏导航项多为「仅展示」，不做页面跳转。
// 高亮当前所在板块 Scene Lab；「Scene Lab」可点击回到 Scene Lab 首页，其余为静态文字。
const ITEMS = ['Shop', 'Scene Lab', 'Works', 'News', 'About']
const ACTIVE_ITEM = 'Scene Lab'

export default function Navbar() {
  const { navigate } = useNav()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: C.bg, borderBottom: `1px solid ${C.lightGray}`,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: `0 ${NAV_PAD}px`, height: NAV_HEIGHT,
    }}>
      <img
        src="/logo.png"
        alt="sugarwave"
        onClick={() => { track('nav_click', { item: 'Logo', route: 'scene-lab' }); navigate('scene-lab') }}
        style={{ height: 52, objectFit: 'contain', cursor: 'pointer', display: 'block' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        {ITEMS.map((label) => {
          const isActive = label === ACTIVE_ITEM
          // 「Scene Lab」在任意页面都可点击回到 Scene Lab 首页；其余导航项仅展示。
          const isSceneLab = label === 'Scene Lab'
          return (
            <span
              key={label}
              onClick={isSceneLab
                ? () => { track('nav_click', { item: 'Scene Lab', route: 'scene-lab' }); navigate('scene-lab') }
                : undefined}
              style={{
                fontFamily: FONTS.nav, fontSize: 18,
                textTransform: 'uppercase',
                color: isActive ? C.black : C.gray,
                fontWeight: isActive ? 700 : 400,
                cursor: isSceneLab ? 'pointer' : 'default', userSelect: 'none',
              }}
            >
              {label}
            </span>
          )
        })}
        {/* Account/user icon (display-only in this portfolio demo) */}
        <span title="Account" style={{ display: 'flex', alignItems: 'center', color: C.black, cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
          </svg>
        </span>
        <CartMenu />
      </div>
    </nav>
  )
}
