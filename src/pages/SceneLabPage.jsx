import { useState, useRef, useCallback } from 'react'
import Navbar from '../components/Navbar'

const CANVAS_RATIO = 16 / 9

export default function SceneLabPage({ onUpload }) {
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
        onUpload(file)
      })
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingTop: 64 }}>
      <Navbar activePage="SCENE LAB" />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>

        {/* ── Left Panel ── */}
        <div style={{
          width: 340, flexShrink: 0, padding: '60px 40px',
          borderRight: `1px solid ${C.lightGray}`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
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
            fontSize: 14, color: C.gray, lineHeight: 1.8, marginBottom: 40,
          }}>
            Upload a photo of your space. AI cleans the scene and recommends products that fit your style.
          </p>

          <label style={{
            display: 'block', border: `1px solid ${C.black}`,
            padding: '13px 24px', textAlign: 'center',
            fontSize: 12, letterSpacing: 2, cursor: 'pointer',
            background: C.black, color: C.bg, marginBottom: 12,
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            UPLOAD A PHOTO
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
          </label>

          {previewUrl && (
            <>
              {isLandscape && (
                <p style={{
                  fontSize: 11, color: C.gray, marginBottom: 12,
                  textAlign: 'center', letterSpacing: 0.5,
                }}>
                  ← Drag image to reframe →
                </p>
              )}
              <button onClick={() => onUpload(imageFile)} style={{
                background: C.black, color: C.bg, border: 'none',
                padding: '13px 24px', fontSize: 12, letterSpacing: 2,
                cursor: 'pointer', transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                CONTINUE →
              </button>
            </>
          )}
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
            flex: 1, position: 'relative', overflow: 'hidden',
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
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: 480,
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
      <div style={{ padding: '72px 40px', borderTop: `1px solid ${C.lightGray}` }}>
        <p style={{ fontSize: 11, letterSpacing: 3, color: C.gray, marginBottom: 8 }}>
          NO PHOTO?
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 8 }}>
          Start with a Scene
        </h2>
        <p style={{ fontSize: 14, color: C.gray, marginBottom: 32 }}>
          Try one of our spaces.
        </p>

        <div style={{ display: 'flex', gap: 16 }}>
          {presetScenes.map(scene => (
            <div
              key={scene.name}
              onClick={() => handlePresetClick(scene.img)}
              style={{
                flex: 1, aspectRatio: '16/9', cursor: 'pointer',
                position: 'relative', overflow: 'hidden', background: C.bgGray,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <img
                src={scene.img}
                alt={scene.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '32px 14px 12px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.45))',
              }}>
                <span style={{ fontSize: 12, letterSpacing: 1, color: '#fff' }}>
                  {scene.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}