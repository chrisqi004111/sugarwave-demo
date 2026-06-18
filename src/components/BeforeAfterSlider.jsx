import { useRef, useState, useCallback } from 'react'

// Minimal Before / After comparison slider (sugarwave style: thin white divider,
// small dark handle, subtle labels — no colourful chrome).
//
// Alignment: a single hidden "sizing" copy of the BEFORE image (height:100%,
// width:auto) sets the box size. Both the AFTER layer (base) and the BEFORE
// layer (clipped) then fill that exact box with `inset:0`, so the two images
// share one stage size and never shift. The BEFORE layer is revealed on the
// left via clip-path up to the handle position.
//
// Props:
//   beforeSrc — image url for the BEFORE (cleaned) scene; also drives box size.
//   after     — ReactNode for the AFTER view (an <img>, or scene + product
//               overlay). Rendered full-size; falls back gracefully if empty.
//   fill      — when true the slider fills its parent box (objectFit:contain,
//               for the landing). Default false = self-size to the before image
//               (tight fit, used on the Your Design page).
export default function BeforeAfterSlider({ beforeSrc, after, labels = true, fill = false }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(50) // 0..100, divider position from left

  const update = useCallback((clientX) => {
    const el = ref.current
    if (!el || clientX == null) return
    const r = el.getBoundingClientRect()
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)))
  }, [])

  const start = (e) => {
    e.preventDefault()
    const point = (ev) => (ev.touches ? ev.touches[0]?.clientX : ev.clientX)
    update(point(e))
    const move = (ev) => { if (ev.cancelable) ev.preventDefault(); update(point(ev)) }
    const end = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', end)
  }

  const LINE = 'rgba(255,255,255,0.92)'
  const tag = (side) => ({
    position: 'absolute', bottom: 14, [side]: 14, zIndex: 4,
    fontSize: 10, letterSpacing: 1.5, color: '#fff',
    background: 'rgba(0,0,0,0.42)', padding: '4px 10px', pointerEvents: 'none',
  })
  const imgFill = { width: '100%', height: '100%', objectFit: 'contain', display: 'block' }
  // Inline styles aren't auto-prefixed — iOS Safari needs -webkit-clip-path or
  // the BEFORE layer never clips (you'd only ever see "before"). Set both.
  const clip = `inset(0 ${100 - pos}% 0 0)`

  return (
    <div
      ref={ref}
      onMouseDown={start}
      onTouchStart={start}
      style={{
        position: 'relative', userSelect: 'none', cursor: 'ew-resize', touchAction: 'none',
        ...(fill ? { width: '100%', height: '100%' } : { height: '100%' }),
      }}
    >
      {/* Sizing element — fixes the stage to the scene image's display size.
          Skipped in fill mode (the parent box defines the size instead). */}
      {!fill && (
        <img src={beforeSrc} alt="" draggable={false}
          style={{ display: 'block', height: '100%', width: 'auto', visibility: 'hidden' }} />
      )}

      {/* AFTER (base, full) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>{after}</div>

      {/* BEFORE (clipped — shown on the left up to the handle) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, clipPath: clip, WebkitClipPath: clip }}>
        <img src={beforeSrc} alt="before" draggable={false} style={imgFill} />
      </div>

      {/* Divider line */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 1,
        background: LINE, zIndex: 3, transform: 'translateX(-0.5px)', pointerEvents: 'none',
      }} />
      {/* Handle */}
      <div style={{
        position: 'absolute', top: '50%', left: `${pos}%`, zIndex: 3,
        width: 26, height: 26, marginLeft: -13, marginTop: -13,
        borderRadius: '50%', border: `1px solid ${LINE}`, background: 'rgba(0,0,0,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 11, letterSpacing: -2, pointerEvents: 'none',
      }}>‹ ›</div>

      {labels && (
        <>
          <span style={tag('left')}>BEFORE</span>
          <span style={tag('right')}>AFTER</span>
        </>
      )}
    </div>
  )
}
