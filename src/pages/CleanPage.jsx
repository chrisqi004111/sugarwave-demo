import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '../components/Navbar'
import { useNav } from '../nav'
import { sceneLabSidebar } from '../sceneLabLayout'
import { cleanImage, cleanImageViaCode, DEMO_MODE, DEMO_FALLBACK_SCENE } from '../services/replicate'
import { getActiveCode, updateQuota } from '../accessCode'

export default function CleanPage({ image, isPreset, presetCleanedUrl, onDone }) {
  const { navigate } = useNav()
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
  // demo 模式下，用户自定义上传无法真实清理时显示的提示卡片
  const [demoUploadNotice, setDemoUploadNotice] = useState(false)

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

    // 有有效访问码 + 还有清理次数 → 走真实 Replicate 清理（即便 DEMO_MODE）
    const ac = getActiveCode()
    const useCode = !!(ac && ac.clean > 0)

    // ── DEMO MODE（且无可用码）：绝不调用 Lamar API ──────────────────
    if (DEMO_MODE && !useCode) {
      if (!isPreset) {
        // 用户自定义上传：真实清理需要 Live API，引导改用预设场景
        setDemoUploadNotice(true)
        return
      }
      // 预设场景：短暂 loading 后返回「已清理」的预设图（成片本身就是干净的）
      setCleaning(true)
      await new Promise(r => setTimeout(r, 1200))
      setCleanedImageUrl(presetCleanedUrl || DEMO_FALLBACK_SCENE)
      setCleaned(true)
      setCleaning(false)
      return
    }

    // ── LIVE MODE：真实 Lamar 清理（行为保持不变）──────────────────
    const mask = maskRef.current
    if (!mask) return
    const data = mask.getContext('2d').getImageData(0, 0, mask.width, mask.height)
    const hasSelection = data.data.some(v => v > 0)
    if (!hasSelection) { setError('Please paint over objects to remove first'); return }

    setCleaning(true)
    try {
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

      let outputUrl
      if (useCode) {
        // 经访问码走后端真实清理，扣 1 次并同步剩余次数
        const r = await cleanImageViaCode(image, finalMask.toDataURL('image/png'), ac.code)
        updateQuota('clean', r.left)
        outputUrl = r.url
      } else {
        const result = await cleanImage(image, finalMask.toDataURL('image/png'))
        outputUrl = Array.isArray(result) ? result[0] : result
      }
      // 缓存破坏只对远程 http(s) 结果有意义；blob:/data: URL 加 ?t= 会失效，原样使用。
      const finalUrl = /^https?:/.test(outputUrl) ? outputUrl + '?t=' + Date.now() : outputUrl
      setCleanedImageUrl(finalUrl)
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
        <button onClick={() => navigate('scene-lab')} style={{
          background: 'none', border: `1px solid ${C.border}`,
          padding: '6px 20px', fontSize: 11, letterSpacing: 1.5, cursor: 'pointer',
        }}>EXIT</button>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 112px)' }}>
        <div ref={containerRef} style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: '#f2f2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* 毛玻璃背景：仅存在于灰色工作区内，被容器的 overflow:hidden 裁出清晰边界，
              不影响右侧工具栏 / 顶部导航 / 按钮。填满图片未覆盖的留白处。*/}
          {(cleanedImageUrl || imageUrl) && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              backgroundImage: `url(${(cleaned && cleanedImageUrl) ? (showComparison ? imageUrl : cleanedImageUrl) : imageUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(24px) brightness(0.92)', transform: 'scale(1.1)',
            }} />
          )}

          {cleaned && cleanedImageUrl ? (
            // 以「可用高度」为基准：图片填满工作区高度，左右留白由毛玻璃填充
            <div style={{ position: 'relative', height: '100%' }}>
              <img
                src={showComparison ? imageUrl : cleanedImageUrl}
                alt="result"
                style={{ display: 'block', height: '100%', width: 'auto', objectFit: 'contain' }}
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
            // 画笔视图：图片以高度为基准填满工作区；overlay 画布始终 100%×100% 贴合图片
            <div style={{ position: 'relative', height: '100%' }}>
              <img
                ref={imgRef}
                src={imageUrl}
                alt="space"
                onLoad={initCanvases}
                style={{ display: 'block', height: '100%', width: 'auto', objectFit: 'contain' }}
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
              <p style={{ fontSize: 12, color: C.gray }}>
                {DEMO_MODE ? 'Preparing your scene...' : 'This may take 15–30 seconds'}
              </p>
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

          {/* ── DEMO 模式：自定义上传无法真实清理时的引导卡片 ── */}
          {demoUploadNotice && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.94)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}>
              <div style={{
                maxWidth: 460, textAlign: 'center',
                border: `1px solid ${C.lightGray}`, borderRadius: 6,
                padding: '32px 36px', background: C.bg,
                boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>✨</div>
                <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5, marginBottom: 12 }}>
                  Demo Mode
                </p>
                <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, marginBottom: 24 }}>
                  Custom image cleanup requires Live API mode. For this portfolio demo,
                  continue with a preset scene to experience the full flow.
                </p>
                <button onClick={() => onDone(DEMO_FALLBACK_SCENE)} style={{
                  width: '100%', padding: '12px', background: C.black, color: C.bg,
                  border: 'none', fontSize: 11, letterSpacing: 2, cursor: 'pointer',
                  marginBottom: 10,
                }}>
                  CONTINUE WITH DEMO SCENE →
                </button>
                <button onClick={() => setDemoUploadNotice(false)} style={{
                  width: '100%', padding: '10px', background: 'none',
                  border: `1px solid ${C.border}`, fontSize: 11, letterSpacing: 1.5,
                  color: C.black, cursor: 'pointer',
                }}>
                  BACK
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{
          ...sceneLabSidebar,
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
