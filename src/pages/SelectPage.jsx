import Navbar from '../components/Navbar'
import { useIsMobile } from '../useIsMobile'

export default function SelectPage({ onSelect }) {
  const C = { bg: '#fff', black: '#000', gray: '#888', lightGray: '#e0e0e0', border: '#d0d0d0' }
  const isMobile = useIsMobile()

  // 两种进入模式：mode + defaultTab 一起传给下一页（TrialPage），决定右侧栏默认标签页。
  // img = 卡片插图，放在 public/select/（缺图时自动回退为灰色占位）
  const MODES = [
    {
      mode: 'ai', defaultTab: 'ai-recommendation',
      label: 'AI RECOMMENDATION',
      sub: 'Let AI suggest products that match your space.',
      btn: 'START WITH AI',
      img: '/select/ai-recommendation.jpg',
    },
    {
      mode: 'manual', defaultTab: 'product-library',
      label: 'MANUAL SELECTION',
      sub: 'Browse the full product library yourself.',
      btn: 'START FROM SCRATCH',
      img: '/select/start-from-scratch.jpg',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="SCENE LAB" />
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', paddingTop: 64 }}>
        {MODES.map((item, i) => (
          <div key={item.mode}
            onClick={() => onSelect({ mode: item.mode, defaultTab: item.defaultTab })}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              borderRight: !isMobile && i === 0 ? `1px solid ${C.lightGray}` : 'none',
              borderBottom: isMobile && i === 0 ? `1px solid ${C.lightGray}` : 'none',
              padding: isMobile ? '40px 24px' : 60, cursor: 'pointer', transition: 'background 0.2s', gap: 20,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
            onMouseLeave={e => e.currentTarget.style.background = C.bg}
          >
            <div style={{ width: '100%', maxWidth: 280, aspectRatio: '4/3', background: '#f2f2f2', overflow: 'hidden' }}>
              <img
                src={item.img}
                alt={item.label}
                onError={e => { e.currentTarget.style.display = 'none' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {/* 标题：保持单行 */}
            <p style={{ fontSize: 11, letterSpacing: 3, color: C.gray, whiteSpace: 'nowrap' }}>{item.label}</p>
            {/* 描述：放宽到 360px，短句尽量单行；必要时自然换行、居中、行距一致 */}
            <p style={{
              fontSize: 14, color: C.black, textAlign: 'center',
              maxWidth: 360, lineHeight: 1.6, margin: 0,
            }}>
              {item.sub}
            </p>
            <button style={{
              border: `1px solid ${C.black}`, padding: '12px 32px',
              fontSize: 11, letterSpacing: 2, cursor: 'pointer', whiteSpace: 'nowrap',
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
