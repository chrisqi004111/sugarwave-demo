import { useState, useRef, useCallback, useEffect } from 'react'
import Navbar from '../components/Navbar'
import BeforeAfterSlider from '../components/BeforeAfterSlider'
import AccessCodeEntry from '../components/AccessCodeEntry'
import { useNav } from '../nav'
import { useIsMobile } from '../useIsMobile'
import { loadSavedDesign } from '../savedDesign'
import { DEMO_MODE } from '../services/replicate'

const CANVAS_RATIO = 16 / 9

// 首页默认范例：右侧 Before/After 滑块用的成对图（同一房间，前=空/后=摆好产品）。
// 放在 public/scene-lab/ 下；缺图时自动回退为上传拖放区，不破页。
const LANDING_BEFORE = '/scene-lab/before.png'
const LANDING_AFTER = '/scene-lab/after.png'

export default function SceneLabPage({ onUpload, savedScene, onContinueSaved }) {
  const { navigate } = useNav()
  const isMobile = useIsMobile()
  // 最近一次保存的「最终设计」（来自 Your Design 页的 SAVE，存在 localStorage）。
  const [savedDesign] = useState(() => loadSavedDesign())
  // 首页范例图是否存在：加载失败则回退为拖放上传区。
  const [landingArtOk, setLandingArtOk] = useState(true)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setLandingArtOk(true)
    img.onerror = () => setLandingArtOk(false)
    img.src = LANDING_BEFORE
  }, [])
  const [dragging, setDragging] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [imgNaturalSize, setImgNaturalSize] = useState(null)
  const [cropOffsetX, setCropOffsetX] = useState(0)
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartOffset, setDragStartOffset] = useState(0)
  const previewRef = useRef(null)

  const C = {
    bg: '#ffffff', bgGray: '#f2f2f2', black: '#000000',
    gray: '#888888', lightGray: '#e0e0e0', border: '#d0d0d0',
  }

  // 主/次 CTA 通用样式（按钮与 <label> 共用）
  const primaryBtn = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    border: `1px solid ${C.black}`, padding: '13px 24px', textAlign: 'center',
    fontSize: 12, letterSpacing: 2, cursor: 'pointer',
    background: C.black, color: C.bg, marginBottom: 12, transition: 'opacity 0.2s',
  }
  const secondaryBtn = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    border: `1px solid ${C.black}`, padding: '13px 24px', textAlign: 'center',
    fontSize: 12, letterSpacing: 2, cursor: 'pointer',
    background: C.bg, color: C.black, marginBottom: 12, transition: 'background 0.2s, color 0.2s',
  }
  const onPrimaryEnter = e => { e.currentTarget.style.opacity = '0.85' }
  const onPrimaryLeave = e => { e.currentTarget.style.opacity = '1' }
  const onSecondaryEnter = e => { e.currentTarget.style.background = C.black; e.currentTarget.style.color = C.bg }
  const onSecondaryLeave = e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.black }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setCropOffsetX(0)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    const img = new Image()
    img.onload = () => setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
  }

  const isLandscape = imgNaturalSize
    ? (imgNaturalSize.w / imgNaturalSize.h) >= CANVAS_RATIO
    : null

  // For landscape: calculate max drag range
  function getMaxOffset() {
    if (!previewRef.current || !imgNaturalSize || !isLandscape) return 0
    const containerW = previewRef.current.offsetWidth
    const containerH = previewRef.current.offsetHeight
    const renderedW = (imgNaturalSize.w / imgNaturalSize.h) * containerH
    return Math.max(0, (renderedW - containerW) / 2)
  }

  const onCropMouseDown = useCallback((e) => {
    if (!isLandscape) return
    setIsDraggingCrop(true)
    setDragStartX(e.clientX)
    setDragStartOffset(cropOffsetX)
  }, [isLandscape, cropOffsetX])

  const onCropMouseMove = useCallback((e) => {
    if (!isDraggingCrop) return
    const delta = e.clientX - dragStartX
    const max = getMaxOffset()
    const newOffset = Math.max(-max, Math.min(max, dragStartOffset + delta))
    setCropOffsetX(newOffset)
// eslint-disable-next-line react-hooks/exhaustive-deps    
  }, [isDraggingCrop, dragStartX, dragStartOffset])

  const onCropMouseUp = useCallback(() => {
    setIsDraggingCrop(false)
  }, [])

  const presetScenes = [
    { name: 'Living Room', img: '/spaces/living-room.jpg' },
    { name: 'Dining Room', img: '/spaces/dining-room.jpg' },
    { name: 'Bedroom', img: '/spaces/bedroom.jpg' },
    { name: 'Outdoor Space', img: '/spaces/outdoor-space.jpg' },
  ]

  function handlePresetClick(img) {
    fetch(img)
      .then(r => r.blob())
      .then(blob => {
        const file = new File([blob], 'preset.jpg', { type: 'image/jpeg' })
        // 预设场景：标记 isPreset，并带上「已清理」场景图（预设图本身就是干净的成片）。
        onUpload(file, { isPreset: true, presetCleanedUrl: img })
      })
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingTop: 64 }}>
      <Navbar activePage="SCENE LAB" />

      <div style={{
        display: 'flex', minHeight: 'calc(100vh - 64px)',
        flexDirection: isMobile ? 'column' : 'row',
      }}>

        {/* ── Left Panel ── */}
        <div style={{
          width: isMobile ? '100%' : 340, flexShrink: 0,
          padding: isMobile ? '28px 20px' : '60px 40px',
          borderRight: isMobile ? 'none' : `1px solid ${C.lightGray}`,
          borderBottom: isMobile ? `1px solid ${C.lightGray}` : 'none',
          display: 'flex', flexDirection: 'column',
          justifyContent: isMobile ? 'flex-start' : 'center',
        }}>
          {/* Mobile notice — guide to desktop for the full experience */}
          {isMobile && (
            <div style={{
              border: `1px solid ${C.lightGray}`, background: C.bgGray,
              padding: '10px 12px', marginBottom: 20,
              fontSize: 11, color: C.gray, lineHeight: 1.6,
            }}>
              For the full AI placement experience, please open this demo on desktop.
            </div>
          )}
          <p style={{ fontSize: 11, letterSpacing: 3, color: C.gray, marginBottom: 16 }}>
            SCENE LAB
          </p>
          <h1 style={{
            fontSize: 30, fontWeight: 400, lineHeight: 1.35,
            color: C.black, marginBottom: 16,
          }}>
            See it in your space<br />before it exists.
          </h1>
          <p style={{
            fontSize: 14, color: C.gray, lineHeight: 1.8, marginBottom: 24,
          }}>
            Upload a room photo or start with a demo scene. AI cleans the space,
            helps place sugarwave products, generates a rendered preview, and turns
            the visual decision into a custom quote request.
          </p>

          <p style={{
            fontSize: 11, color: C.gray, lineHeight: 1.8, letterSpacing: 0.5,
            marginBottom: 36,
          }}>
            Upload → AI Clean-up → Product Placement → AI Render → Quote Request
          </p>

          {!previewUrl ? (
            DEMO_MODE ? (
              <>
                {/* DEMO 模式：Try Demo Scene 为主 CTA，直接进入预设 Living Room 演示流程 */}
                <button
                  onClick={() => handlePresetClick(presetScenes[0].img)}
                  style={primaryBtn}
                  onMouseEnter={onPrimaryEnter}
                  onMouseLeave={onPrimaryLeave}
                >
                  TRY DEMO SCENE
                </button>
                {/* 上传仍保留，但降级为次 CTA */}
                <label style={secondaryBtn} onMouseEnter={onSecondaryEnter} onMouseLeave={onSecondaryLeave}>
                  UPLOAD A PHOTO
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])} />
                </label>
                <p style={{ fontSize: 11, color: C.gray, lineHeight: 1.7 }}>
                  Custom image cleanup requires Live API mode. The demo scene shows the full experience.
                </p>
              </>
            ) : (
              <>
                {/* LIVE 模式：上传为主 CTA（行为不变）*/}
                <label style={primaryBtn} onMouseEnter={onPrimaryEnter} onMouseLeave={onPrimaryLeave}>
                  UPLOAD A PHOTO
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])} />
                </label>
                <button
                  onClick={() => handlePresetClick(presetScenes[0].img)}
                  style={secondaryBtn}
                  onMouseEnter={onSecondaryEnter}
                  onMouseLeave={onSecondaryLeave}
                >
                  TRY DEMO SCENE
                </button>
              </>
            )
          ) : (
            <>
              {isLandscape && (
                <p style={{
                  fontSize: 11, color: C.gray, marginBottom: 12,
                  textAlign: 'center', letterSpacing: 0.5,
                }}>
                  ← Drag image to reframe →
                </p>
              )}

              {/* DEMO 模式上传路径：说明 + 「Continue with Demo Scene」主按钮 */}
              {DEMO_MODE && (
                <>
                  <div style={{
                    border: `1px solid ${C.lightGray}`, background: C.bgGray,
                    padding: '12px 14px', marginBottom: 12,
                    fontSize: 11, color: C.gray, lineHeight: 1.7,
                  }}>
                    Custom image cleanup requires <strong style={{ color: C.black }}>Live API mode</strong>.
                    For this portfolio demo, continue with a preset scene to experience the full flow.
                  </div>
                  <button
                    onClick={() => handlePresetClick(presetScenes[0].img)}
                    style={primaryBtn}
                    onMouseEnter={onPrimaryEnter}
                    onMouseLeave={onPrimaryLeave}
                  >
                    CONTINUE WITH DEMO SCENE →
                  </button>
                </>
              )}

              {/* 用上传的照片继续：LIVE 为主路径（真实 API 清理）；DEMO 为次路径 */}
              <button
                onClick={() => onUpload(imageFile, { isPreset: false })}
                style={DEMO_MODE ? secondaryBtn : primaryBtn}
                onMouseEnter={DEMO_MODE ? onSecondaryEnter : onPrimaryEnter}
                onMouseLeave={DEMO_MODE ? onSecondaryLeave : onPrimaryLeave}
              >
                {DEMO_MODE ? 'CONTINUE WITH MY PHOTO →' : 'CONTINUE →'}
              </button>
            </>
          )}

          {/* 访问码入口：输入有效码解锁真实 AI 清理 / 渲染（否则保持 DEMO） */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.lightGray}` }}>
            <AccessCodeEntry />
          </div>
        </div>

        {/* ── Right: Preview / Drop Zone ── */}
        <div
          ref={previewRef}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault(); setDragging(false)
            handleFile(e.dataTransfer.files[0])
          }}
          onMouseMove={onCropMouseMove}
          onMouseUp={onCropMouseUp}
          onMouseLeave={onCropMouseUp}
          style={{
            ...(isMobile ? { width: '100%', height: 300, flexShrink: 0 } : { flex: 1 }),
            position: 'relative', overflow: 'hidden',
            background: C.bgGray,
            border: dragging ? `2px dashed ${C.black}` : '2px dashed transparent',
            cursor: isLandscape ? (isDraggingCrop ? 'grabbing' : 'grab') : 'default',
            transition: 'border-color 0.2s',
          }}
        >
          {previewUrl ? (
            <>
              {/* Blurred background layer (for portrait images) */}
              {!isLandscape && (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${previewUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(24px) brightness(0.85)',
                  transform: 'scale(1.1)',
                }} />
              )}

              {/* Main image */}
              <img
                src={previewUrl}
                alt="uploaded space"
                onMouseDown={onCropMouseDown}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `calc(50% + ${cropOffsetX}px)`,
                  transform: 'translate(-50%, -50%)',
                  ...(isLandscape
                    ? { height: '100%', width: 'auto' }
                    : { height: '100%', width: 'auto', maxHeight: '100%' }
                  ),
                  display: 'block',
                  userSelect: 'none',
                  draggable: false,
                }}
              />

              {/* Reframe hint overlay */}
              {isLandscape && (
                <div style={{
                  position: 'absolute', bottom: 16, left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.45)', color: '#fff',
                  fontSize: 11, letterSpacing: 1.5,
                  padding: '6px 16px', borderRadius: 2,
                  pointerEvents: 'none',
                }}>
                  DRAG TO REFRAME
                </div>
              )}
            </>
          ) : savedDesign ? (
            /* 最近保存的「最终设计」：静态展示（非滑块），点击查看/继续。来自 Your Design 页 SAVE。 */
            <div style={{ width: '100%', height: '100%', minHeight: isMobile ? 280 : 480, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${savedDesign.afterImage || savedDesign.beforeImage})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(24px) brightness(0.9)', transform: 'scale(1.1)',
              }} />
              {/* 最终设计：成片，或 场景图 + 产品叠层 */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', height: '100%' }}>
                <img
                  src={savedDesign.afterImage || savedDesign.beforeImage}
                  alt="saved design"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                  style={{ height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block', userSelect: 'none' }}
                />
                {!savedDesign.afterImage && savedDesign.placement?.items?.map((o, i) => (
                  <img
                    key={i}
                    src={o.src}
                    alt=""
                    onError={e => { e.currentTarget.style.display = 'none' }}
                    style={{
                      position: 'absolute',
                      left: `${o.xRatio * 100}%`, top: `${o.yRatio * 100}%`,
                      width: `${o.wRatio * 100}%`, height: 'auto',
                      transform: `translate(-50%, -50%) rotate(${o.rotation || 0}deg)`,
                      opacity: o.opacity ?? 1, pointerEvents: 'none',
                      filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.3))',
                    }}
                  />
                ))}
              </div>
              <div style={{
                position: 'absolute', top: 16, left: 16,
                background: 'rgba(255,255,255,0.92)', color: C.black,
                fontSize: 10, letterSpacing: 1.5, padding: '5px 12px',
                border: `1px solid ${C.lightGray}`,
              }}>
                Last saved design
              </div>
              <div
                onClick={() => navigate('summary')}
                style={{
                  position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                  background: C.black, color: '#fff', fontSize: 11, letterSpacing: 1.5,
                  padding: '8px 18px', cursor: 'pointer',
                }}
              >
                VIEW SAVED DESIGN →
              </div>
            </div>
          ) : savedScene ? (
            /* SAVE TO LIBRARY 保存过场景：右侧默认展示「上次使用的照片」。点击可继续编辑该场景。*/
            <div
              onClick={() => onContinueSaved?.()}
              style={{
                width: '100%', height: '100%', minHeight: isMobile ? 280 : 480, position: 'relative',
                cursor: 'pointer', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${savedScene})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(24px) brightness(0.85)', transform: 'scale(1.1)',
              }} />
              <img
                src={savedScene}
                alt="saved scene"
                onError={e => { e.currentTarget.style.display = 'none' }}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain',
                  display: 'block', userSelect: 'none',
                }}
              />
              <div style={{
                position: 'absolute', top: 16, left: 16,
                background: 'rgba(0,0,0,0.55)', color: '#fff',
                fontSize: 10, letterSpacing: 2, padding: '5px 12px',
              }}>
                FROM YOUR LIBRARY
              </div>
              <div style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.55)', color: '#fff',
                fontSize: 11, letterSpacing: 1.5, padding: '6px 16px', pointerEvents: 'none',
              }}>
                CONTINUE WITH THIS SCENE →
              </div>
            </div>
          ) : landingArtOk ? (
            /* 默认：Before/After 范例滑块（无保存设计时展示，替代灰色空背景）。
               拖放上传仍可用（drop 处理在外层容器上）。*/
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: isMobile ? 280 : 480, overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${LANDING_AFTER})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(28px) brightness(0.9)', transform: 'scale(1.1)',
              }} />
              <div style={{ position: 'absolute', inset: 0 }}>
                <BeforeAfterSlider
                  fill
                  beforeSrc={LANDING_BEFORE}
                  after={<img src={LANDING_AFTER} alt="after" draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
                />
              </div>
            </div>
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: isMobile ? 280 : 480,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 36, opacity: 0.2 }}>↑</div>
              <p style={{ fontSize: 12, color: C.gray, letterSpacing: 2 }}>
                DRAG & DROP YOUR PHOTO HERE
              </p>
              <p style={{ fontSize: 11, color: C.lightGray, letterSpacing: 1 }}>
                JPG · PNG · WEBP
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Preset Scenes ── */}
      <div style={{ padding: isMobile ? '40px 20px' : '72px 40px', borderTop: `1px solid ${C.lightGray}` }}>
        <p style={{ fontSize: 11, letterSpacing: 3, color: C.gray, marginBottom: 8 }}>
          NO PHOTO?
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 8 }}>
          Start with a Scene
        </h2>
        <p style={{ fontSize: 14, color: C.gray, marginBottom: 32 }}>
          Try one of our spaces.
        </p>

        {/* Mobile: horizontal scroll list; desktop: equal-width row */}
        <div style={{
          display: 'flex', gap: 16,
          ...(isMobile ? { overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch' } : {}),
        }}>
          {presetScenes.map(scene => (
            <div
              key={scene.name}
              onClick={() => handlePresetClick(scene.img)}
              style={{
                ...(isMobile ? { flex: '0 0 78%' } : { flex: 1 }),
                cursor: 'pointer',
                border: `1px solid ${C.lightGray}`,
                background: C.bg, overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.black
                e.currentTarget.querySelector('[data-cta]').style.color = C.black
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.lightGray
                e.currentTarget.querySelector('[data-cta]').style.color = C.gray
              }}
            >
              <div style={{
                aspectRatio: '16/9', position: 'relative',
                overflow: 'hidden', background: C.bgGray,
              }}>
                <img
                  src={scene.img}
                  alt={scene.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              </div>
              <div style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, letterSpacing: 0.5, color: C.black }}>
                  {scene.name}
                </span>
                <span data-cta style={{ fontSize: 12, letterSpacing: 0.5, color: C.gray, transition: 'color 0.2s' }}>
                  Use this scene →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}