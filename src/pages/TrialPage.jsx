import { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Image as KonvaImage, Transformer, Circle } from 'react-konva'
import Navbar from '../components/Navbar'

const PRODUCTS = [
  { id: 'boop', name: 'Boop', category: 'Lighting', price: 185, tags: ['minimal', 'modern'], img: '/products/boop.png', dimensions: '18cm × 18cm × 16cm' },
  { id: 'lianlian', name: 'Lianlian', category: 'Lighting', price: 220, tags: ['organic', 'modern'], img: '/products/lianlian.png', dimensions: '22cm × 22cm × 35cm' },
  { id: 'forest', name: 'Forest', category: 'Lighting', price: 310, tags: ['nature', 'minimal'], img: '/products/forest.png', dimensions: '25cm × 25cm × 160cm' },
  { id: 'scratch', name: 'Scratch', category: 'Object', price: 165, tags: ['industrial', 'modern'], img: '/products/scratch.png', dimensions: '15cm × 15cm × 20cm' },
]

const C = { bg: '#fff', black: '#000', gray: '#888', lightGray: '#e0e0e0', border: '#d0d0d0' }

// 自动发现每个产品的「补充角度图」：把图片丢进 src/assets/products/<产品id>/ 即可（文件名任意）。
// Vite 在构建时用 import.meta.glob 收集；渲染时这些图会连同产品尺寸一起发给 codex。
const REF_MODULES = import.meta.glob('../assets/products/*/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}', { eager: true })
const FOLDER_REFS = {}  // { [productId]: url[] }
for (const [p, mod] of Object.entries(REF_MODULES)) {
  const m = p.match(/products\/([^/]+)\//)
  if (m) (FOLDER_REFS[m[1]] = FOLDER_REFS[m[1]] || []).push(mod.default)
}

function FurnitureItem({ item, isSelected, onSelect, onChange }) {
  const imgRef = useRef(null)
  const trRef = useRef(null)
  const [image, setImage] = useState(null)

  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = item.src
    img.onload = () => setImage(img)
  }, [item.src])

  useEffect(() => {
    if (isSelected && trRef.current && imgRef.current) {
      // 延迟一帧确保图片节点已完全挂载
      const timer = setTimeout(() => {
        if (trRef.current && imgRef.current) {
          trRef.current.nodes([imgRef.current])
          trRef.current.getLayer().batchDraw()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isSelected, image])

  if (!image) return null

  return (
    <>
      <KonvaImage
        ref={imgRef}
        image={image}
        x={item.x} y={item.y}
        width={item.width} height={item.height}
        rotation={item.rotation}
        opacity={item.opacity}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={e => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = imgRef.current
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()
          node.scaleX(1)
          node.scaleY(1)
          onChange({
            x: node.x(), y: node.y(),
            width: Math.max(20, node.width() * scaleX),
            height: Math.max(20, node.height() * scaleY),
            rotation: node.rotation(),
          })
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
          }
        />
      )}
    </>
  )
}

export default function TrialPage({ image, onDone }) {
  const [bgImage, setBgImage] = useState(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 450 })
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [activeTab, setActiveTab] = useState('AI Recommendation')
  const [activeFilter, setActiveFilter] = useState('All')
  const [prompt, setPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRecommended, setAiRecommended] = useState([])
  const [aiReason, setAiReason] = useState('')
  const [aiStyle, setAiStyle] = useState('')
  const [showGrid, setShowGrid] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)

  // ── AI 放置模式状态 ───────────────────────────────────────────────
  const [placingProduct, setPlacingProduct] = useState(null)  // 当前要放置的产品
  const [placingRadius, setPlacingRadius] = useState(80)       // 放置区域半径
  const [placeCursor, setPlaceCursor] = useState(null)         // 鼠标位置预览圆
  const [rendering, setRendering] = useState(false)            // AI 渲染中
  const [renderedImage, setRenderedImage] = useState(null)     // 渲染结果
  const [showRendered, setShowRendered] = useState(false)      // 显示渲染结果
  const [aiEngine, setAiEngine] = useState('codex')            // 'codex' = 本地 Codex 订阅(默认) / 'api' = gpt-image-2 接口
  const [productRefs, setProductRefs] = useState({})           // { [productId]: File[] } 用户上传的多角度参考图（最多 4 张/产品）

  const MAX_REFS = 4
  function handleAddRefs(productId, fileList) {
    const imgs = Array.from(fileList || []).filter(f => f.type.startsWith('image/'))
    if (!imgs.length) return
    setProductRefs(prev => {
      const merged = [...(prev[productId] || []), ...imgs].slice(0, MAX_REFS)
      return { ...prev, [productId]: merged }
    })
  }
  function clearRefs(productId) {
    setProductRefs(prev => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const imageFileRef = useRef(null)  // 保存原始 File 对象

  const isPortrait = bgImage
    ? (bgImage.width / bgImage.height) < (stageSize.width / stageSize.height)
    : false

  function calcDraw(img, sw, sh) {
    const imgRatio = img.width / img.height
    const stageRatio = sw / sh
    if (imgRatio > stageRatio) {
      const dw = sw
      const dh = dw / imgRatio
      return { dw, dh, dx: 0, dy: (sh - dh) / 2 }
    } else {
      const dh = sh
      const dw = dh * imgRatio
      return { dw, dh, dx: (sw - dw) / 2, dy: 0 }
    }
  }

  useEffect(() => {
    if (!image) return
    imageFileRef.current = image instanceof File ? image : null
    const url = image instanceof File ? URL.createObjectURL(image) : image
    setImageUrl(url)
    const img = new window.Image()
    img.src = url
    img.onload = () => {
      setBgImage(img)
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth
        const h = w * (9 / 16)
        setStageSize({ width: w, height: h })
      }
      if (image instanceof File) {
        setTimeout(() => {
          import('../services/gemini').then(({ analyzeSpaceAndRecommend }) => {
            setAiLoading(true)
            analyzeSpaceAndRecommend(image)
              .then(result => {
                setAiRecommended(result.recommended || [])
                setAiReason(result.reason || '')
                setAiStyle(result.style || '')
              })
              .catch(() => {
                setAiRecommended(PRODUCTS.slice(0, 2).map(p => p.id))
              })
              .finally(() => setAiLoading(false))
          })
        }, 500)
      }
    }
  }, [image])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth
        const h = w * (9 / 16)
        setStageSize({ width: w, height: h })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ── 点击 TRY：进入 AI 放置模式 ───────────────────────────────────
  function handleTryProduct(product) {
    setPlacingProduct(product)  // product 已包含 dimensions
    setSelectedId(null)
    setPlaceCursor(null)
  }

  // ── 取消放置模式 ─────────────────────────────────────────────────
  function cancelPlacing() {
    setPlacingProduct(null)
    setPlaceCursor(null)
  }

  // ── Stage 鼠标移动：放置模式下显示预览圆 ─────────────────────────
  function handleStageMouseMove(e) {
    if (!placingProduct) return
    const pos = e.target.getStage().getPointerPosition()
    setPlaceCursor(pos)
  }

  // ── Stage 点击：放置模式下生成 mask 并调用 AI ────────────────────
  async function handleStageClick(e) {
    if (!placingProduct) {
      if (e.target === e.target.getStage()) setSelectedId(null)
      return
    }

    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    if (!pos) return

    // 照片在 16:9 画布里是按原比例「contain」居中显示的（四周可能留边）。
    // 把点击位置和半径从画布坐标换算回「原始照片」像素坐标，并按原图尺寸生成 mask——
    // 这样 mask 与原图同尺寸同比例，渲染输出就和上传照片保持一致的比例，放置位置也对齐。
    const { dw, dx, dy } = calcDraw(bgImage, stageSize.width, stageSize.height)
    const scale = bgImage.width / dw   // 画布像素 → 原图像素（宽高同一缩放比）
    const maskCx = (pos.x - dx) * scale
    const maskCy = (pos.y - dy) * scale
    const maskR = placingRadius * scale
    const mask = generateMask(maskCx, maskCy, maskR, bgImage.width, bgImage.height)

    setRendering(true)
    setPlacingProduct(null)
    setPlaceCursor(null)

    try {
      const { placeProductInSpace } = await import('../services/openai')

      // 获取空间图 File
      const spaceFile = await getSpaceImageFile()

      // 产品参考图 = 目录基准图 + 文件夹补充图(src/assets/products/<id>/) + 本次会话上传图。
      // 基准图可能缺失(如 lianlian/forest/scratch 暂无 png)，用 urlToFileSafe 容错跳过，
      // 三者合并一并发给 codex（连同尺寸由 prompt 注入），最多取 6 张以控制渲染时长。
      const baseFile = await urlToFileSafe(placingProduct.img, placingProduct.name + '.png')
      const folderUrls = FOLDER_REFS[placingProduct.id] || []
      const folderFiles = (await Promise.all(
        folderUrls.map((u, i) => urlToFileSafe(u, `${placingProduct.id}-folder-${i}.png`))
      )).filter(Boolean)
      const sessionFiles = productRefs[placingProduct.id] || []
      const productFiles = [baseFile, ...folderFiles, ...sessionFiles].filter(Boolean).slice(0, 6)
      if (productFiles.length === 0) {
        throw new Error(`「${placingProduct.name}」暂无任何参考图。请在产品行点 + REF 上传，或把图放进 src/assets/products/${placingProduct.id}/`)
      }

      const resultUrl = await placeProductInSpace(
        spaceFile,
        mask,
        productFiles,
        placingProduct.name,
        placingProduct.dimensions || 'standard size',
        aiEngine
      )

      setRenderedImage(resultUrl)
      setShowRendered(true)
    } catch (err) {
      console.error('AI render error:', err)
      alert('AI rendering failed: ' + err.message)
    }

    setRendering(false)
  }

  // ── 生成圆形 mask（白色=放置区域，黑色=保留）────────────────────
  function generateMask(cx, cy, radius, width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
    return canvas.toDataURL('image/png')
  }

  // ── 获取空间图 File ───────────────────────────────────────────────
  async function getSpaceImageFile() {
    if (imageFileRef.current) return imageFileRef.current
    // 如果是 URL，fetch 转 File
    return urlToFile(imageUrl, 'space.jpg')
  }

  // ── URL → File ────────────────────────────────────────────────────
  async function urlToFile(url, filename) {
    const res = await fetch(url)
    const blob = await res.blob()
    const ext = blob.type.includes('png') ? 'png' : 'jpg'
    return new File([blob], filename || `file.${ext}`, { type: blob.type })
  }

  // 容错版：URL 不存在/非图片时返回 null（用于可能缺失的产品基准图与文件夹图）
  async function urlToFileSafe(url, filename) {
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) return null
      return new File([blob], filename, { type: blob.type })
    } catch {
      return null
    }
  }

  // ── 手动添加产品（保留原来的 Konva 模式）────────────────────────
  function addProduct(product) {
    const newItem = {
      id: `${product.id}-${items.length}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      src: product.img,
      x: stageSize.width / 2 - 75,
      y: stageSize.height / 2 - 75,
      width: 150, height: 150,
      rotation: 0, opacity: 1,
    }
    setItems(prev => [...prev, newItem])
    setSelectedId(newItem.id)
  }

  function updateItem(id, changes) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...changes } : item))
  }

  function deleteSelected() {
    setItems(prev => prev.filter(item => item.id !== selectedId))
    setSelectedId(null)
  }

  function handleUndo() {
    setItems(prev => prev.slice(0, -1))
    setSelectedId(null)
  }

  const selected = items.find(i => i.id === selectedId)

  async function handleAIRecommend() {
    setAiLoading(true)
    try {
      if (prompt.trim()) {
        const lower = prompt.toLowerCase()
        const recommended = PRODUCTS.filter(p =>
          p.tags.some(tag => lower.includes(tag)) ||
          p.category.toLowerCase().includes(lower) ||
          p.name.toLowerCase().includes(lower)
        )
        setAiRecommended(recommended.length > 0 ? recommended.map(p => p.id) : PRODUCTS.slice(0, 2).map(p => p.id))
        setAiReason(recommended.length > 0 ? 'Based on your description, we recommend these products.' : 'Here are our most popular pieces for your space.')
      } else if (image) {
        const { analyzeSpaceAndRecommend } = await import('../services/gemini')
        const result = await analyzeSpaceAndRecommend(image)
        setAiRecommended(result.recommended || [])
        setAiReason(result.reason || '')
        setAiStyle(result.style || '')
      }
    } catch (err) {
      console.error('AI error:', err)
      setAiRecommended(PRODUCTS.slice(0, 2).map(p => p.id))
      setAiReason('Unable to analyze. Showing popular items.')
    }
    setAiLoading(false)
  }

  const filteredProducts = PRODUCTS.filter(p => {
    if (activeFilter !== 'All' && p.category !== activeFilter) return false
    if (activeTab === 'AI Recommendation' && aiRecommended.length > 0) return aiRecommended.includes(p.id)
    return true
  })

  const totalValue = items.reduce((s, i) => s + i.price, 0)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingTop: 64 }}>
      <Navbar activePage="SCENE LAB" />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px', borderBottom: `1px solid ${C.lightGray}`, height: 44,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 10, color: C.gray, letterSpacing: 1, cursor: 'pointer' }}>← EXIT</span>
          <span style={{ fontSize: 11, letterSpacing: 2, fontWeight: 500 }}>SCENE LAB</span>
          <button onClick={() => setShowGrid(g => !g)} style={{
            fontSize: 10, letterSpacing: 1, padding: '3px 10px',
            border: `1px solid ${showGrid ? C.black : C.border}`,
            background: showGrid ? C.black : C.bg,
            color: showGrid ? C.bg : C.black, cursor: 'pointer',
          }}>
            {showGrid ? 'GRID ON' : 'GRID OFF'}
          </button>
          <button onClick={() => setAiEngine(e => e === 'api' ? 'codex' : 'api')} title="切换 AI 出图引擎" style={{
            fontSize: 10, letterSpacing: 1, padding: '3px 10px',
            border: `1px solid ${aiEngine === 'codex' ? '#2d7a2d' : C.border}`,
            background: aiEngine === 'codex' ? '#2d7a2d' : C.bg,
            color: aiEngine === 'codex' ? C.bg : C.black, cursor: 'pointer',
          }}>
            {aiEngine === 'codex' ? 'ENGINE: CODEX' : 'ENGINE: API'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleUndo} style={{ border: `1px solid ${C.border}`, background: C.bg, padding: '5px 14px', fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>
            ↩ UNDO
          </button>
          {selectedId && (
            <button onClick={deleteSelected} style={{ border: '1px solid #e00', background: C.bg, color: '#e00', padding: '5px 14px', fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>
              DELETE
            </button>
          )}
          <button style={{ border: `1px solid ${C.border}`, background: C.bg, padding: '5px 14px', fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>SHARE</button>
          <button style={{ border: 'none', background: C.black, color: C.bg, padding: '5px 14px', fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}>SAVE TO LIBRARY</button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 108px)' }}>
        <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#1a1a1a' }}>

          {bgImage && isPortrait && imageUrl && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(20px) brightness(0.6)', transform: 'scale(1.1)',
            }} />
          )}

          {/* ── 放置模式提示横幅 ── */}
          {placingProduct && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, background: C.black, color: C.bg,
              padding: '8px 20px', fontSize: 11, letterSpacing: 1.5,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span>CLICK WHERE TO PLACE <strong>{placingProduct.name.toUpperCase()}</strong></span>
              <button onClick={cancelPlacing} style={{
                background: 'none', border: `1px solid rgba(255,255,255,0.4)`,
                color: C.bg, padding: '2px 10px', fontSize: 10, cursor: 'pointer',
              }}>CANCEL</button>
            </div>
          )}

          {/* ── 放置区域大小调节（放置模式下显示）── */}
          {placingProduct && (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, background: 'rgba(0,0,0,0.7)', color: C.bg,
              padding: '8px 16px', fontSize: 10, letterSpacing: 1,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span>AREA SIZE</span>
              <input
                type="range" min="40" max="200" value={placingRadius}
                onChange={e => setPlacingRadius(parseInt(e.target.value))}
                style={{ width: 100 }}
              />
              <span>{placingRadius}px</span>
            </div>
          )}

          {/* ── AI 渲染中遮罩 ── */}
          {rendering && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 20,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 36 }}>✦</div>
              <p style={{ color: C.bg, fontSize: 14, letterSpacing: 2 }}>AI IS RENDERING...</p>
              <p style={{ color: C.gray, fontSize: 11 }}>
                {aiEngine === 'codex'
                  ? 'Local Codex · up to ~4 min'
                  : 'Matching perspective & lighting · 60–90s'}
              </p>
            </div>
          )}

          {/* ── 渲染结果展示 ── */}
          {showRendered && renderedImage && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src={renderedImage} alt="AI rendered"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              <div style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 8,
              }}>
                <button onClick={() => setShowRendered(false)} style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  padding: '8px 20px', fontSize: 11, letterSpacing: 1, cursor: 'pointer',
                }}>BACK TO CANVAS</button>
                <button onClick={() => {
                  const a = document.createElement('a')
                  a.href = renderedImage
                  a.download = 'ai-render.png'
                  a.click()
                }} style={{
                  background: C.black, color: C.bg, border: 'none',
                  padding: '8px 20px', fontSize: 11, letterSpacing: 1, cursor: 'pointer',
                }}>SAVE IMAGE</button>
              </div>
            </div>
          )}

          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            style={{
              position: 'relative', zIndex: 1,
              cursor: placingProduct ? 'crosshair' : 'default',
            }}
            onMouseMove={handleStageMouseMove}
            onMouseLeave={() => setPlaceCursor(null)}
            onClick={handleStageClick}
          >
            <Layer>
              {bgImage && (() => {
                const { dw, dh, dx, dy } = calcDraw(bgImage, stageSize.width, stageSize.height)
                return <KonvaImage image={bgImage} x={dx} y={dy} width={dw} height={dh} />
              })()}
            </Layer>

            <Layer>
              {items.map(item => (
                <FurnitureItem
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedId}
                  onSelect={() => !placingProduct && setSelectedId(item.id)}
                  onChange={changes => updateItem(item.id, changes)}
                />
              ))}

              {/* 放置模式预览圆 */}
              {placingProduct && placeCursor && (
                <Circle
                  x={placeCursor.x}
                  y={placeCursor.y}
                  radius={placingRadius}
                  fill="rgba(255, 255, 255, 0.25)"
                  stroke="white"
                  strokeWidth={1.5}
                  dash={[6, 4]}
                  listening={false}
                />
              )}
            </Layer>
          </Stage>
        </div>

        {/* ── 右侧工具栏 ── */}
        <div style={{ width: 270, borderLeft: `1px solid ${C.lightGray}`, display: 'flex', flexDirection: 'column', background: C.bg }}>

          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.lightGray}` }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAIRecommend()}
                placeholder="e.g. minimal table lamp..."
                style={{ flex: 1, border: `1px solid ${C.border}`, padding: '7px 10px', fontSize: 11, outline: 'none', background: '#f9f9f9' }}
              />
              <button onClick={handleAIRecommend} style={{
                background: C.black, color: C.bg, border: 'none',
                padding: '7px 12px', fontSize: 11, cursor: 'pointer',
              }}>
                {aiLoading ? '...' : '✦'}
              </button>
            </div>
            {aiLoading && <p style={{ fontSize: 10, color: C.gray, marginTop: 6, letterSpacing: 0.5 }}>✦ AI is analyzing your space...</p>}
            {!aiLoading && aiStyle && <p style={{ fontSize: 10, color: '#2d7a2d', marginTop: 6, letterSpacing: 0.5 }}>Detected style: <strong>{aiStyle}</strong></p>}
            {!aiLoading && aiReason && <p style={{ fontSize: 10, color: C.gray, marginTop: 4, lineHeight: 1.5 }}>{aiReason}</p>}
          </div>

          <div style={{ display: 'flex', borderBottom: `1px solid ${C.lightGray}` }}>
            {['AI Recommendation', 'Product Library'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '8px 4px', border: 'none', background: 'none',
                fontSize: 10, letterSpacing: 1, cursor: 'pointer',
                color: activeTab === tab ? C.black : C.gray,
                borderBottom: `2px solid ${activeTab === tab ? C.black : 'transparent'}`,
              }}>{tab.toUpperCase()}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, padding: '10px 14px', flexWrap: 'wrap', borderBottom: `1px solid ${C.lightGray}` }}>
            {['All', 'Lighting', 'Table', 'Object'].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '3px 10px', fontSize: 10, letterSpacing: 0.5,
                border: `1px solid ${activeFilter === f ? C.black : C.border}`,
                background: activeFilter === f ? C.black : C.bg,
                color: activeFilter === f ? C.bg : C.black, cursor: 'pointer',
              }}>{f.toUpperCase()}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredProducts.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: C.gray }}>No products found</p>
                <button onClick={() => setAiRecommended([])} style={{ marginTop: 12, fontSize: 11, color: C.black, background: 'none', border: `1px solid ${C.border}`, padding: '6px 14px', cursor: 'pointer' }}>Show all</button>
              </div>
            )}
            {filteredProducts.map(p => {
              const isAIPick = aiRecommended.includes(p.id)
              const isPlacing = placingProduct?.id === p.id
              const folderRefCount = (FOLDER_REFS[p.id] || []).length    // 文件夹里的持久参考图
              const sessionRefCount = (productRefs[p.id] || []).length   // 本次会话临时上传
              const refCount = folderRefCount + sessionRefCount
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderBottom: `1px solid ${C.lightGray}`,
                  background: isPlacing ? '#f0f0f0' : C.bg,
                  transition: 'background 0.15s', cursor: 'default',
                }}>
                  <div style={{
                    width: 48, height: 48, flexShrink: 0,
                    background: '#f2f2f2', border: `1px solid ${C.lightGray}`, overflow: 'hidden',
                  }}>
                    <img src={p.img} alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <p style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</p>
                      {isAIPick && <span style={{ fontSize: 9, padding: '1px 6px', background: '#f0faf0', color: '#2d7a2d', borderRadius: 10 }}>AI</span>}
                    </div>
                    <p style={{ fontSize: 10, color: C.gray, marginTop: 1 }}>{p.dimensions}</p>
                    <p style={{ fontSize: 11, marginTop: 2 }}>${p.price}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* TRY = AI 放置模式 */}
                    <button
                      onClick={() => isPlacing ? cancelPlacing() : handleTryProduct(p)}
                      style={{
                        fontSize: 9, letterSpacing: 0.5, padding: '3px 8px',
                        border: `1px solid ${isPlacing ? '#e00' : C.black}`,
                        background: isPlacing ? '#e00' : C.black,
                        color: C.bg, cursor: 'pointer',
                      }}
                    >
                      {isPlacing ? 'CANCEL' : 'TRY'}
                    </button>
                    {/* MANUAL = 原来的 Konva 手动摆放 */}
                    <button
                      onClick={() => addProduct(p)}
                      style={{
                        fontSize: 9, letterSpacing: 0.5, padding: '3px 8px',
                        border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer',
                      }}
                    >MANUAL</button>
                    {/* +REF = 上传多角度参考图，连同尺寸一起发给 AI，帮助理解产品形状与比例 */}
                    <div style={{ display: 'flex', gap: 3 }}>
                      <label
                        title={`${p.name} 参考图：文件夹 ${folderRefCount} 张 + 本次上传 ${sessionRefCount} 张。` +
                          `点此再加角度图（最多 ${MAX_REFS} 张/次会话）。文件夹图放在 src/assets/products/${p.id}/`}
                        style={{
                          flex: 1, textAlign: 'center', fontSize: 9, letterSpacing: 0.5, padding: '3px 6px',
                          border: `1px solid ${refCount ? '#2d7a2d' : C.border}`,
                          background: refCount ? '#f0faf0' : C.bg,
                          color: refCount ? '#2d7a2d' : C.black, cursor: 'pointer',
                        }}
                      >
                        {refCount ? `REF ${refCount}` : '+ REF'}
                        <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                          onChange={e => { handleAddRefs(p.id, e.target.files); e.target.value = '' }} />
                      </label>
                      {sessionRefCount > 0 && (
                        <button onClick={() => clearRefs(p.id)} title="清除本次会话上传的参考图（文件夹图不受影响）"
                          style={{ fontSize: 9, padding: '3px 6px', border: `1px solid ${C.border}`, background: C.bg, color: C.gray, cursor: 'pointer' }}>✕</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {selected && (
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.lightGray}`, background: '#f9f9f9' }}>
              <p style={{ fontSize: 10, letterSpacing: 1.5, color: C.gray, marginBottom: 10 }}>{selected.name.toUpperCase()}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.gray }}>Opacity</span>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{Math.round(selected.opacity * 100)}%</span>
              </div>
              <input type="range" min="10" max="100" value={Math.round(selected.opacity * 100)}
                onChange={e => updateItem(selectedId, { opacity: e.target.value / 100 })}
                style={{ width: '100%', marginBottom: 10 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.gray }}>Scale</span>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{Math.round(selected.width)}px</span>
              </div>
              <input type="range" min="30" max="500" value={selected.width}
                onChange={e => { const w = parseInt(e.target.value); updateItem(selectedId, { width: w, height: w }) }}
                style={{ width: '100%', marginBottom: 10 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.gray }}>Rotation</span>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{Math.round(selected.rotation)}°</span>
              </div>
              <input type="range" min="0" max="360" value={selected.rotation}
                onChange={e => updateItem(selectedId, { rotation: parseInt(e.target.value) })}
                style={{ width: '100%' }} />
            </div>
          )}

          <div style={{
            padding: '10px 14px', borderTop: `1px solid ${C.lightGray}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: 10, color: C.gray, letterSpacing: 1 }}>SCENE ITEMS {items.length}</p>
              <p style={{ fontSize: 13, fontWeight: 500 }}>Total  ${totalValue}</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { setItems([]); setSelectedId(null) }} style={{
                border: `1px solid ${C.border}`, background: C.bg,
                padding: '6px 10px', fontSize: 10, cursor: 'pointer',
              }}>CLEAR</button>
              <button onClick={() => {
                // 先取消选中（去掉 Transformer 边框），再截图
                setSelectedId(null)
                setTimeout(() => {
                  if (stageRef.current) {
                    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })
                    onDone({ sceneDataUrl: dataUrl, items })
                  } else {
                    onDone({ sceneDataUrl: null, items })
                  }
                }, 50)  // 等 Transformer 消失后再截图
              }} style={{
                border: 'none', background: C.black, color: C.bg,
                padding: '6px 14px', fontSize: 10, letterSpacing: 1, cursor: 'pointer',
              }}>DONE →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
