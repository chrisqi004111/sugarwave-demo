import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '../components/Navbar'

export default function CleanPage({ image, onDone }) {
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const overlayRef = useRef(null)
  const maskRef = useRef(null)
  const isDrawingRef = useRef(false)
  const modeRef = useRef('select')
  const brushSizeRef = useRef(20)        // 实际画笔大小，不触发 re-render
  const brushDisplayRef = useRef(null)   // 直接操作 DOM 显示数字

  const savedOverlayRef = useRef(null)
  const savedMaskRef = useRef(null)

  const [mode, setMode] = useState('select')
  const [cleaning, setCleaning] = useState(false)
  const [cleaned, setCleaned] = useState(false)
  const [cleanedImageUrl, setCleanedImageUrl] = useState(null)
  const [error, setError] = useState(null)
  const [showComparison, setShowComparison] = useState(false)

  // ── 关键修复：useMemo 固定 imageUrl，避免每次 re-render 生成新 URL ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const imageUrl = useMemo(
    () => image instanceof File ? URL.createObjectURL(image) : image,
    [] // 故意空依赖：image prop 不会变，只需生成一次
  )

  const C = { bg: '#fff', black: '#000', gray: '#888', lightGray: '#e0e0e0', border: '#d0d0d0' }

  useEffect(() => { modeRef.current = mode }, [mode])

  // ── mode 切换时保存 & 恢复 canvas 内容 ───────────────────────────
  useEffect(() => {
    const overlay = overlayRef.current
    const mask = maskRef.current
    if (overlay && mask && savedOverlayRef.current && savedMaskRef.current) {
      overlay.getContext('2d').putImageData(savedOverlayRef.current, 0, 0)
      mask.getContext('2d').putImageData(savedMaskRef.current, 0, 0)
    }
    return () => {
      const ov = overlayRef.current
      const mk = maskRef.current
      if (ov && mk) {
        savedOverlayRef.current = ov.getContext('2d').getImageData(0, 0, ov.width, ov.height)
        savedMaskRef.current = mk.getContext('2d').getImageData(0, 0, mk.width, mk.height)
      }
    }
  }, [mode])

  // ── 图片加载后初始化 canvas 尺寸（只应执行一次）─────────────────
  const initCanvases = useCallback(() => {
    const img = imgRef.current
    const overlay = overlayRef.current
    const mask = maskRef.current
    if (!img || !overlay || !mask) return

    // 如果已经初始化过且尺寸一致，跳过（防止 re-render 触发重复初始化）
    if (overlay.width === img.naturalWidth && overlay.height === img.naturalHeight) return

    const { naturalWidth: w, naturalHeight: h } = img
    overlay.width = w
    overlay.height = h
    mask.width = w
    mask.height = h

    savedOverlayRef.current = null
    savedMaskRef.current = null
  }, [])

  // ── 坐标转换 ─────────────────────────────────────────────────────
  function getImagePos(e) {
    const img = imgRef.current
    const overlay = overlayRef.current
    if (!img || !overlay) return { x: 0, y: 0 }
    const rect = overlay.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (img.naturalWidth / rect.width),
      y: (e.clientY - rect.top) * (img.naturalHeight / rect.height),
    }
  }

  // ── 绘制 / 擦除 ───────────────────────────────────────────────────
  function paint(e) {
    const { x, y } = getImagePos(e)
    const size = brushSizeRef.current
    const currentMode = modeRef.current
    const overlay = overlayRef.current
    const mask = maskRef.current
    if (!overlay || !mask) return

    const oCtx = overlay.getContext('2d')
    const mCtx = mask.getContext('2d')

    if (currentMode === 'select') {
      oCtx.fillStyle = 'rgba(255, 200, 0, 0.5)'
      oCtx.beginPath()
      oCtx.arc(x, y, size, 0, Math.PI * 2)
      oCtx.fill()
      mCtx.fillStyle = 'white'
      mCtx.beginPath()
      mCtx.arc(x, y, size, 0, Math.PI * 2)
      mCtx.fill()
    } else {
      oCtx.clearRect(x - size, y - size, size * 2, size * 2)
      mCtx.clearRect(x - size, y - size, size * 2, size * 2)
    }
  }

  function onMouseDown(e) { isDrawingRef.current = true; paint(e) }
  function onMouseMove(e) { if (isDrawingRef.current) paint(e) }
  function onMouseUp() { isDrawingRef.current = false }

  // ── AUTO CLEAN ────────────────────────────────────────────────────
  async function handleAutoClean() {
    if (!image) return
    setError(null)
    const mask = maskRef.current
    if (!mask) return
    const data = mask.getContext('2d').getImageData(0, 0, mask.width, mask.height)
    const hasSelection = data.data.some(v => v > 0)
    if (!hasSelection) { setError('Please paint over objects to remove first'); return }

    setCleaning(true)
    try {
      const { cleanImage } = await import('../services/replicate')
      const maskCtx = mask.getContext('2d')
      const maskData = maskCtx.getImageData(0, 0, mask.width, mask.height)
      const finalMask = document.createElement('canvas')
      finalMask.width = mask.width
      finalMask.height = mask.height
      const ctx = finalMask.getContext('2d')
      const outData = ctx.createImageData(mask.width, mask.height)
      const src = maskData.data
      const dst = outData.data
      for (let i = 0; i < src.length; i += 4) {
        const painted = src[i + 3] > 10
        const val = painted ? 255 : 0
        dst[i] = dst[i+1] = dst[i+2] = val
        dst[i+3] = 255
      }
      ctx.putImageData(outData, 0, 0)

      const result = await cleanImage(image, finalMask.toDataURL('image/png'))
      const outputUrl = Array.isArray(result) ? result[0] : result
      setCleanedImageUrl(outputUrl + '?t=' + Date.now())
      setCleaned(true)
    } catch (err) {
      console.error(err)
      setError('AI cleaning failed: ' + err.message)
    }
    setCleaning(false)
  }

  // ── 重置 ──────────────────────────────────────────────────────────
  function clearMask() {
    const overlay = overlayRef.current
    const mask = maskRef.current
    if (overlay) overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height)
    if (mask) mask.getContext('2d').clearRect(0, 0, mask.width, mask.height)
    savedOverlayRef.current = null
    savedMaskRef.current = null
    setCleaned(false)
    setCleanedImageUrl(null)
    setError(null)
  }

  function switchMode(newMode) {
    if (newMode === mode) return
    setMode(newMode)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingTop: 64 }}>
      <Navbar activePage="SCENE LAB" />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px', borderBottom: `1px solid ${C.lightGray}`,
      }}>
        <span style={{ fontSize: 11, color: C.gray, letterSpacing: 1 }}>STEP 1 — CLEAN SCENE</span>
        <button onClick={() => onDone(cleanedImageUrl || imageUrl)} style={{
          background: 'none', border: `1px solid ${C.border}`,
          padding: '6px 20px', fontSize: 11, letterSpacing: 1.5, cursor: 'pointer',
        }}>EXIT</button>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 112px)' }}>
        <div ref={containerRef} style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: '#f2f2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {cleaned && cleanedImageUrl ? (
            <div style={{ width: '100%', height: '100%', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={showComparison ? imageUrl : cleanedImageUrl}
                alt="result"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
              <div style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', border: `1px solid ${C.border}`, background: C.bg,
              }}>
                {['Before', 'After'].map((label, i) => (
                  <button key={label} onClick={() => setShowComparison(label === 'Before')} style={{
                    padding: '6px 20px', border: 'none', cursor: 'pointer',
                    background: (i === 0) === showComparison ? C.black : C.bg,
                    color: (i === 0) === showComparison ? C.bg : C.black,
                    fontSize: 11, letterSpacing: 1,
                  }}>{label}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
              <img
                ref={imgRef}
                src={imageUrl}
                alt="space"
                onLoad={initCanvases}
                style={{
                  display: 'block', maxWidth: '100%',
                  maxHeight: 'calc(100vh - 112px)', objectFit: 'contain',
                }}
              />
              <canvas
                ref={overlayRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  cursor: mode === 'select' ? 'crosshair' : 'cell',
                }}
              />
              <canvas ref={maskRef} style={{ display: 'none' }} />
            </div>
          )}

          {cleaning && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 32 }}>✨</div>
              <p style={{ fontSize: 14, letterSpacing: 1 }}>AI is cleaning your space...</p>
              <p style={{ fontSize: 12, color: C.gray }}>This may take 15–30 seconds</p>
            </div>
          )}

          {error && (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              background: '#fee', border: '1px solid #fcc',
              padding: '8px 16px', fontSize: 12, color: '#c00',
              borderRadius: 4, maxWidth: '80%', textAlign: 'center',
            }}>{error}</div>
          )}
        </div>

        <div style={{
          width: 220, borderLeft: `1px solid ${C.lightGray}`,
          padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div style={{ fontStyle: 'italic', fontSize: 16, letterSpacing: 2 }}>sugarwave</div>

          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, color: C.gray, marginBottom: 10 }}>AI TOOLS</p>
            <button onClick={handleAutoClean} disabled={cleaning} style={{
              display: 'block', width: '100%', marginBottom: 8, padding: '10px',
              border: `1px solid ${C.border}`,
              background: cleaning ? C.lightGray : C.black,
              color: C.bg, fontSize: 11, letterSpacing: 1.5,
              cursor: cleaning ? 'not-allowed' : 'pointer',
            }}>
              {cleaning ? 'CLEANING...' : 'AUTO CLEAN'}
            </button>
            <button onClick={clearMask} style={{
              display: 'block', width: '100%', padding: '10px',
              border: `1px solid ${C.border}`, background: C.bg,
              fontSize: 11, letterSpacing: 1.5, cursor: 'pointer',
            }}>RESET</button>
          </div>

          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, color: C.gray, marginBottom: 10 }}>MANUAL EDIT</p>
            <p style={{ fontSize: 11, color: C.gray, marginBottom: 12, lineHeight: 1.6 }}>
              Paint over objects to remove, then click Auto Clean.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[{ key: 'select', label: 'Paint' }, { key: 'restore', label: 'Erase' }].map(m => (
                <button key={m.key} onClick={() => switchMode(m.key)} style={{
                  padding: '8px 4px',
                  border: `1px solid ${mode === m.key ? C.black : C.border}`,
                  background: mode === m.key ? C.black : C.bg,
                  color: mode === m.key ? C.bg : C.black,
                  fontSize: 10, letterSpacing: 1, cursor: 'pointer',
                }}>{m.label}</button>
              ))}
            </div>

            {/* ── 笔刷大小：完全不用 state，零 re-render ── */}
            <p ref={brushDisplayRef} style={{ fontSize: 10, color: C.gray, marginBottom: 6 }}>Brush: 20px</p>
            <input
              type="range" min="5" max="60" defaultValue={20}
              onInput={e => {
                const v = parseInt(e.target.value)
                brushSizeRef.current = v
                if (brushDisplayRef.current) brushDisplayRef.current.textContent = 'Brush: ' + v + 'px'
              }}
              style={{ width: '100%' }}
            />
          </div>

          {cleaned && (
            <div style={{ padding: '10px', background: '#f0faf0', border: '1px solid #d4e8d4', borderRadius: 4 }}>
              <p style={{ fontSize: 11, color: '#2d7a2d' }}>✓ Scene cleaned successfully</p>
            </div>
          )}

          <div style={{ marginTop: 'auto' }}>
            <button onClick={() => onDone(cleanedImageUrl || imageUrl)} style={{
              width: '100%', padding: '12px', background: C.black, color: C.bg,
              border: 'none', fontSize: 11, letterSpacing: 2, cursor: 'pointer',
            }}>DONE →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
