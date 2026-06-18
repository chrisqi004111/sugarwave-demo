import { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Image as KonvaImage, Transformer, Circle } from 'react-konva'
import Navbar from '../components/Navbar'
import { useNav } from '../nav'
import { useIsMobile } from '../useIsMobile'
import MobileDesktopNotice from '../components/MobileDesktopNotice'
import { sceneLabSidebar, SCENE_LAB_SIDEBAR_WIDTH, SCENE_LAB_SIDEBAR_PAD } from '../sceneLabLayout'
import { DEMO_MODE } from '../services/replicate'
import { useAccessCode, updateQuota } from '../accessCode'
import AccessCodeEntry from '../components/AccessCodeEntry'
import PRODUCT_META from '../assets/catalog/meta.json'

// ── Scene Lab catalogue (auto-discovered) ──────────────────────────
// Drop a product cut-out into   src/assets/catalog/<category>/<id>.png
// and it appears automatically:
//   • folder name  = category   (must be one of CATEGORIES keys below)
//   • file name    = product id ('ripple-side-table' → "Ripple Side Table")
// Vite collects the images at build time via import.meta.glob (src/ only).
// Name / price / dimensions / tags come from meta.json, which is generated
// from product-catalog.xlsx by  tools/sync_catalog.py  (run after edits).
// Unlisted products still work (name from the file name, price 0).
const CATALOG_MODULES = import.meta.glob(
  '../assets/catalog/*/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}',
  { eager: true }
)

const prettify = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const PRODUCTS = Object.entries(CATALOG_MODULES)
  .map(([path, mod]) => {
    const [, category, id] = path.match(/catalog\/([^/]+)\/([^/]+)\.\w+$/)
    const meta = PRODUCT_META[id] || {}
    return {
      id,
      category,
      name: meta.name || prettify(id),
      price: meta.price ?? 0,
      tags: meta.tags || [],
      dimensions: meta.dimensions || 'standard size',
      aiPick: meta.aiPick ?? false,
      img: mod.default,
    }
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

// Preset AI-recommendation pool: neutral-toned products only (transparent /
// black-white / marble), flagged aiPick in the catalogue. The demo scenes are
// cream / earth-toned, so vibrant pieces are kept out of AI picks (they still
// appear in the full Product Library). Every aiRecommended assignment is run
// through this pool so AI never surfaces a vibrant product.
const AI_POOL = PRODUCTS.filter((p) => p.aiPick).map((p) => p.id)
const toAiPool = (ids) => {
  const picked = (ids || []).filter((id) => AI_POOL.includes(id))
  return picked.length ? picked : AI_POOL
}

// 分类筛选：key = 内部稳定标识（过滤逻辑用）；label = 顶部按钮显示文案。
// 5 个分类，3+2 两行排列。产品按 category(key) 归类；当前 4 件产品都归 Lighting，
// Table / Object / Container 暂无对应产品（待相应产品加入后自动出现在对应筛选下）。
const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'table', label: 'Table' },
  { key: 'object', label: 'Object' },
  { key: 'container', label: 'Container' },
]

const C = { bg: '#fff', black: '#000', gray: '#888', lightGray: '#e0e0e0', border: '#d0d0d0' }

// ── 预设「已渲染」成片映射 ───────────────────────────────────────────
// DEMO_MODE 下的 Generate AI Render，以及 LIVE 模式接口失败兜底，都用这里的成片。
// 资产来自 public/scenes/（产品在真实房间里的成片）。没有匹配项时回退 DEFAULT。
const PRESET_RENDERS = {
  boop: '/scenes/boop.jpg',
}
const DEFAULT_PRESET_RENDER = '/scenes/boop.jpg'
const presetRenderFor = (productId) => PRESET_RENDERS[productId] || DEFAULT_PRESET_RENDER

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

export default function TrialPage({ image, onDone, mode, defaultTab, onSaveToLibrary, resume }) {
  const { navigate } = useNav()
  const isMobile = useIsMobile()
  // 有有效访问码 + 还有渲染次数 → 走真实 OpenAI 渲染（即便 DEMO_MODE）。
  const activeCode = useAccessCode()
  const liveRender = !DEMO_MODE || !!(activeCode && activeCode.render > 0)
  const [savedToLibrary, setSavedToLibrary] = useState(false)

  // SAVE TO LIBRARY：把当前场景图 + 工作进度（已放置叠层 / 手动摆放 / 进入模式）一起存到 App。
  // 回到 Scene Lab 首页时右侧展示该场景；点击「Continue」可直接回到 Try 页面，
  // 还原停下时的摆放（比如放好的 Boop 仍在原位）。
  function handleSaveToLibrary() {
    if (!imageUrl) return
    onSaveToLibrary?.({
      sceneUrl: imageUrl,
      image,
      mode, defaultTab,
      placedItems,
      items,
    })
    setSavedToLibrary(true)
    setTimeout(() => setSavedToLibrary(false), 1800)
  }
  const [bgImage, setBgImage] = useState(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 450 })
  const [items, setItems] = useState(() => resume?.items ?? [])   // 手动摆放：从保存的会话还原（若有）
  const [selectedId, setSelectedId] = useState(null)
  // 右侧栏默认标签由上一页（SelectPage）选择的 mode/defaultTab 决定：
  // 'manual' / 'product-library' → Product Library；其余（含未传值）默认 AI Recommendation。
  const [activeTab, setActiveTab] = useState(
    defaultTab === 'product-library' || mode === 'manual' ? 'Product Library' : 'AI Recommendation'
  )
  const [activeFilter, setActiveFilter] = useState('all')
  const [prompt, setPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRecommended, setAiRecommended] = useState(AI_POOL)  // 预设推荐 = 中性色产品池
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
  const [renderedProducts, setRenderedProducts] = useState([]) // 访问码渲染：当前成片包含的产品（用于结算清单）
  const [renderError, setRenderError] = useState(null)         // 渲染错误提示（横幅）
  const [renderNotice, setRenderNotice] = useState(false)      // 无码时点 Generate AI Render 的「需要 access code」提示卡
  const [placedItems, setPlacedItems] = useState(() => resume?.placedItems ?? [])  // DEMO_MODE：已放置的产品叠层 [{ id, product, x, y, width, rotation, opacity }]；从保存的会话还原（若有）
  const [selectedPlacedId, setSelectedPlacedId] = useState(null) // 当前选中的「TRY 放置」叠层
  const [aiEngine, setAiEngine] = useState('codex')            // 'codex' = 本地 Codex 订阅(默认) / 'api' = gpt-image-2 接口

  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const imageFileRef = useRef(null)  // 保存原始 File 对象

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
        // 以「可用高度」为基准做最大化：舞台 = 图片原始比例，高度铺满工作区（上下不留边）。
        // 较窄的图片左右留白由全幅毛玻璃填充；放置坐标与原图 1:1 对应，渲染逻辑不变。
        const ch = containerRef.current.offsetHeight
        const aspect = img.naturalWidth / img.naturalHeight
        setStageSize({ width: ch * aspect, height: ch })
      }
      if (image instanceof File) {
        setTimeout(() => {
          import('../services/gemini').then(({ analyzeSpaceAndRecommend }) => {
            setAiLoading(true)
            analyzeSpaceAndRecommend(image)
              .then(result => {
                setAiRecommended(toAiPool(result.recommended))
                setAiReason(result.reason || '')
                setAiStyle(result.style || '')
              })
              .catch(() => {
                setAiRecommended(AI_POOL)
              })
              .finally(() => setAiLoading(false))
          })
        }, 500)
      }
    }
  }, [image])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && bgImage) {
        const ch = containerRef.current.offsetHeight
        const aspect = bgImage.width / bgImage.height
        setStageSize({ width: ch * aspect, height: ch })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [bgImage])

  // ── 点击 TRY：进入 AI 放置模式 ───────────────────────────────────
  function handleTryProduct(product) {
    setPlacingProduct(product)  // product 已包含 dimensions
    setSelectedId(null)
    setPlaceCursor(null)
    // 不清除已放置的产品：再 TRY 另一个产品时，之前放置的依然保留（累加）
  }

  // ── 取消放置模式 ─────────────────────────────────────────────────
  function cancelPlacing() {
    setPlacingProduct(null)
    setPlaceCursor(null)
  }

  // ── 无可用渲染码：不再生成预设假图，弹提示告诉用户这是 demo、真实渲染需要 access code ──
  function handleGenerateRender() {
    if (!placedItems.length) return
    setPlacingProduct(null)
    setPlaceCursor(null)
    setRenderNotice(true)
  }

  // ── 点击 DONE：进入下一页（结算/Your Design）──────────────────────
  function handleDone() {
    setSelectedId(null)
    setSelectedPlacedId(null)

    // 原始工作状态：传给上层存起来，从 Summary「← BACK TO SCENE」返回时还原，
    // 不会丢掉已摆放/已添加的产品（reuse 与 SAVE TO LIBRARY 相同的 resume 结构）。
    const session = { items, placedItems, mode, defaultTab }

    // ── 访问码真实渲染：用 OpenAI 成片作为 after，渲染过的产品并入结算清单 ──
    if (renderedImage && renderedProducts.length) {
      const renderItems = renderedProducts.map((p, i) => ({
        id: `rendered-${p.id}-${i}`, productId: p.id, name: p.name,
        price: p.price, src: p.img, category: p.category, dimensions: p.dimensions,
      }))
      onDone({ sceneDataUrl: renderedImage, items: [...items, ...renderItems], session })
      return
    }

    // ── DEMO_MODE：保留放置结果，绝不调用图像接口 ──
    if (DEMO_MODE) {
      console.log('DEMO_MODE done: preserving placement preview')

      // 把放置坐标存成「相对舞台的比例」，下一页按图片显示尺寸等比还原叠层
      const overlay = placedItems.map(it => ({
        src: it.product.img,
        name: it.product.name,
        xRatio: stageSize.width ? it.x / stageSize.width : 0.5,
        yRatio: stageSize.height ? it.y / stageSize.height : 0.5,
        wRatio: stageSize.width ? (it.width || 140) / stageSize.width : 0.3,
        rotation: it.rotation || 0,
        opacity: it.opacity ?? 1,
      }))

      // 始终用「场景图 + 透明产品 PNG 叠层」合成：点击 DONE 后，把 TRY 页面放置的
      // 透明背景产品 PNG 按位置/缩放/旋转叠加到清理后的场景图上（不替换成预设成片）。
      console.log('DEMO_MODE render: compositing placed product PNG overlay onto scene')
      const demoAfter = null

      // 把 TRY 放置的产品并入清单，结算页能列出并计价
      const placedAsItems = placedItems.map((it, i) => ({
        id: `placed-${it.id}-${i}`, productId: it.product.id, name: it.product.name,
        price: it.product.price, src: it.product.img, category: it.product.category,
        dimensions: it.product.dimensions,
      }))

      onDone({
        sceneDataUrl: null,
        items: [...items, ...placedAsItems],
        demoAfter,
        placement: { items: overlay },
        session,
      })
      return
    }

    // ── LIVE：行为不变（Konva 画布截图）──
    setTimeout(() => {
      if (stageRef.current) {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })
        onDone({ sceneDataUrl: dataUrl, items, session })
      } else {
        onDone({ sceneDataUrl: null, items, session })
      }
    }, 50)
  }

  // ── DEMO_MODE：拖拽已放置的产品叠层（按 delta 更新位置，无跳变）──
  function startDragItem(e, item) {
    if (placingProduct) return        // 正在放置新产品时不拖拽，让点击落到画布上
    e.preventDefault()
    e.stopPropagation()
    setSelectedPlacedId(item.id)      // 点击即选中（再次点击可在右侧调整）
    setSelectedId(null)               // 与手动 Konva 选择互斥
    const startX = e.clientX
    const startY = e.clientY
    const origX = item.x
    const origY = item.y
    const onMove = (ev) => {
      const nx = origX + (ev.clientX - startX)
      const ny = origY + (ev.clientY - startY)
      setPlacedItems(prev => prev.map(it => it.id === item.id ? { ...it, x: nx, y: ny } : it))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Stage 鼠标移动：放置模式下显示预览圆 ─────────────────────────
  function handleStageMouseMove(e) {
    if (!placingProduct) return
    const pos = e.target.getStage().getPointerPosition()
    setPlaceCursor(pos)
  }

  // ── Stage 点击：放置模式下生成 mask 并调用 AI ────────────────────
  async function handleStageClick(e) {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()

    // ── DEMO_MODE（且无可用渲染码）：点击把当前产品「累加」到场景，绝不调用接口 ──
    if (DEMO_MODE && !liveRender && placingProduct) {
      if (!pos) return
      console.log('DEMO_MODE placement: using product overlay preview')
      // 保留之前放置的产品，把当前产品加到点击位置
      setPlacedItems(prev => [
        ...prev,
        { id: `${placingProduct.id}-${Date.now()}`, addedAt: Date.now(), product: placingProduct, x: pos.x, y: pos.y, width: 140, rotation: 0, opacity: 1 },
      ])
      setPlacingProduct(null)
      setPlaceCursor(null)
      setShowRendered(false)
      setRenderedImage(null)
      return
    }

    if (!placingProduct) {
      if (e.target === e.target.getStage()) { setSelectedId(null); setSelectedPlacedId(null) }
      return
    }
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

    const product = placingProduct   // 渲染期间会清空 placingProduct，先留一份
    const usingCode = !!(activeCode && activeCode.render > 0)
    setRendering(true)
    setRenderError(null)
    setPlacingProduct(null)
    setPlaceCursor(null)

    try {
      // 获取空间图 File
      const spaceFile = await getSpaceImageFile()

      // 产品参考图 = 目录基准图 + 文件夹补充图(src/assets/products/<id>/)。
      const baseFile = await urlToFileSafe(product.img, product.name + '.png')
      const folderUrls = FOLDER_REFS[product.id] || []
      const folderFiles = (await Promise.all(
        folderUrls.map((u, i) => urlToFileSafe(u, `${product.id}-folder-${i}.png`))
      )).filter(Boolean)
      const productFiles = [baseFile, ...folderFiles].filter(Boolean).slice(0, 6)
      if (productFiles.length === 0) {
        throw new Error(`No reference image for "${product.name}".`)
      }

      if (usingCode) {
        // 访问码：走后端 OpenAI 渲染，扣 1 次并同步剩余次数
        const { placeProductInSpaceViaCode } = await import('../services/openai')
        const r = await placeProductInSpaceViaCode(
          spaceFile, mask, productFiles, product.name, product.dimensions || 'standard size', activeCode.code,
        )
        updateQuota('render', r.left)
        setRenderedImage(r.image)
        setRenderedProducts([product])   // 单产品成片：成片即包含该产品
        setShowRendered(true)
      } else {
        // 本地 dev（非 DEMO，走 vite 代理）
        const { placeProductInSpace } = await import('../services/openai')
        const resultUrl = await placeProductInSpace(
          spaceFile, mask, productFiles, product.name, product.dimensions || 'standard size', aiEngine,
        )
        setRenderedImage(resultUrl)
        setRenderedProducts([product])
        setShowRendered(true)
      }
    } catch (err) {
      console.error('AI render error:', err)
      if (usingCode) {
        // 访问码渲染失败：后端已退还次数，给出明确提示（不放预设成片误导）
        setRenderError(err.message || 'Render failed')
      } else {
        setRenderedImage(presetRenderFor(product.id))
        setRenderedProducts([product])
        setShowRendered(true)
      }
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
      id: `${product.id}-${Date.now()}`,
      addedAt: Date.now(),       // 供 UNDO 判断「谁最后添加」
      productId: product.id,
      name: product.name,
      price: product.price,
      src: product.img,
      dimensions: product.dimensions,
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

  // 更新 TRY 放置叠层（缩放/旋转/透明度）
  function updatePlacedItem(id, changes) {
    setPlacedItems(prev => prev.map(it => it.id === id ? { ...it, ...changes } : it))
  }

  function deleteSelected() {
    if (selectedPlacedId) {
      setPlacedItems(prev => prev.filter(it => it.id !== selectedPlacedId))
      setSelectedPlacedId(null)
      return
    }
    setItems(prev => prev.filter(item => item.id !== selectedId))
    setSelectedId(null)
  }

  // UNDO：撤销最近添加的一个产品（TRY 放置或手动摆放都算）
  function handleUndo() {
    const lastItem = items[items.length - 1]
    const lastPlaced = placedItems[placedItems.length - 1]
    if (!lastItem && !lastPlaced) return
    const itemTime = lastItem ? lastItem.addedAt ?? 0 : -Infinity
    const placedTime = lastPlaced ? lastPlaced.addedAt ?? 0 : -Infinity
    if (placedTime >= itemTime) {
      setPlacedItems(prev => prev.slice(0, -1))
    } else {
      setItems(prev => prev.slice(0, -1))
    }
    setSelectedId(null)
  }

  const selected = items.find(i => i.id === selectedId)
  const selectedPlaced = placedItems.find(it => it.id === selectedPlacedId)

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
        setAiRecommended(toAiPool(recommended.map(p => p.id)))
        setAiReason(recommended.length > 0 ? 'Based on your description, we recommend these products.' : 'Here are our most popular pieces for your space.')
      } else if (image) {
        const { analyzeSpaceAndRecommend } = await import('../services/gemini')
        const result = await analyzeSpaceAndRecommend(image)
        setAiRecommended(toAiPool(result.recommended))
        setAiReason(result.reason || '')
        setAiStyle(result.style || '')
      }
    } catch (err) {
      console.error('AI error:', err)
      setAiRecommended(AI_POOL)
      setAiReason('Unable to analyze. Showing popular items.')
    }
    setAiLoading(false)
  }

  const filteredProducts = PRODUCTS.filter(p => {
    if (activeFilter !== 'all' && p.category !== activeFilter) return false
    if (activeTab === 'AI Recommendation' && aiRecommended.length > 0) return aiRecommended.includes(p.id)
    return true
  })

  // 合并：手动摆放(items) + TRY 放置(placedItems) 一起计入数量与总价
  const placedValue = placedItems.reduce((s, it) => s + (it.product.price || 0), 0)
  const totalValue = items.reduce((s, i) => s + i.price, 0) + placedValue
  const totalCount = items.length + placedItems.length

  // Mobile: the Konva placement canvas isn't usable on a phone — skip to Your
  // Design with a PLACEMENT OVERLAY demo (cleaned scene + one product PNG), NOT
  // an unrelated preset render. No AI render image is invented here.
  if (isMobile) {
    const p = PRODUCTS[0]
    return (
      <MobileDesktopNotice onContinue={() => onDone({
        sceneDataUrl: null,
        demoAfter: null,
        placement: p ? { items: [{ src: p.img, name: p.name, xRatio: 0.5, yRatio: 0.62, wRatio: 0.3, rotation: 0, opacity: 1 }] } : null,
        items: p ? [{ id: `demo-${p.id}`, productId: p.id, name: p.name, price: p.price, src: p.img, category: p.category, dimensions: p.dimensions }] : [],
        session: { items: [], placedItems: [], mode, defaultTab },
      })} />
    )
  }

  return (
    <div style={{ height: '100vh', boxSizing: 'border-box', background: C.bg, paddingTop: 64, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <Navbar activePage="SCENE LAB" />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0 8px 20px', borderBottom: `1px solid ${C.lightGray}`,
        minHeight: 44, flexShrink: 0, boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            onClick={() => navigate('scene-lab')}
            style={{ fontSize: 10, color: C.gray, letterSpacing: 1, cursor: 'pointer' }}
          >← EXIT</span>
          <span style={{ fontSize: 11, letterSpacing: 2, fontWeight: 500 }}>SCENE LAB</span>
          {/* Dev-only debug toggles (grid overlay + AI engine) — hidden in production build */}
          {import.meta.env.DEV && (
            <>
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
            </>
          )}
        </div>
        {/* 右侧操作组 = 与右侧栏同宽、贴紧页面右缘的列；左右内距 = 侧栏统一内距，
            space-between 让 UNDO 左缘对齐侧栏内容左缘、SAVE 右缘对齐侧栏内容右缘。
            所有按钮 nowrap + flexShrink:0，图标文字一行、各按钮等高 */}
        <div style={{ width: SCENE_LAB_SIDEBAR_WIDTH, maxWidth: '100%', flexShrink: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6, rowGap: 6, paddingLeft: SCENE_LAB_SIDEBAR_PAD, paddingRight: SCENE_LAB_SIDEBAR_PAD }}>
          <button onClick={handleUndo} style={{ flexShrink: 0, whiteSpace: 'nowrap', border: `1px solid ${C.border}`, background: C.bg, padding: '5px 10px', fontSize: 10, letterSpacing: 0.5, cursor: 'pointer' }}>
            ↩ UNDO
          </button>
          {(selectedId || selectedPlacedId) && (
            <button onClick={deleteSelected} style={{ flexShrink: 0, whiteSpace: 'nowrap', border: '1px solid #e00', background: C.bg, color: '#e00', padding: '5px 10px', fontSize: 10, letterSpacing: 0.5, cursor: 'pointer' }}>
              DELETE
            </button>
          )}
          <button style={{ flexShrink: 0, whiteSpace: 'nowrap', border: `1px solid ${C.border}`, background: C.bg, padding: '5px 10px', fontSize: 10, letterSpacing: 0.5, cursor: 'pointer' }}>SHARE</button>
          <button onClick={handleSaveToLibrary} style={{ flexShrink: 0, whiteSpace: 'nowrap', border: 'none', background: savedToLibrary ? '#2d7a2d' : C.black, color: C.bg, padding: '5px 10px', fontSize: 10, letterSpacing: 0.5, cursor: 'pointer' }}>{savedToLibrary ? 'SAVED ✓' : 'SAVE TO LIBRARY'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div ref={containerRef} style={{
          flex: 1, overflow: 'hidden', position: 'relative', background: '#f2f2f2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>

          {/* 全幅毛玻璃背景：充满整个画布区，与结算页一致 */}
          {imageUrl && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(28px) brightness(0.92)', transform: 'scale(1.12)',
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

          {/* ── 放置区域大小调节（LIVE / 访问码渲染：对应真实 mask 半径）── */}
          {liveRender && placingProduct && (
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

          {/* ── DEMO_MODE：Placement Preview 提示 + Generate AI Render（产品叠层在舞台内渲染）── */}
          {DEMO_MODE && !liveRender && placedItems.length > 0 && !placingProduct && !rendering && !showRendered && (
            <>
              <div style={{
                position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                zIndex: 10, background: 'rgba(0,0,0,0.7)', color: C.bg,
                padding: '6px 16px', fontSize: 11, letterSpacing: 1.5,
              }}>
                PLACEMENT PREVIEW · {placedItems.length} ITEM{placedItems.length > 1 ? 'S' : ''}
              </div>
              <div style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <button onClick={handleGenerateRender} style={{
                  background: C.bg, color: C.black, border: 'none',
                  padding: '10px 24px', fontSize: 12, letterSpacing: 1.5, cursor: 'pointer',
                }}>GENERATE AI RENDER →</button>
                <span style={{ fontSize: 10, color: C.bg, letterSpacing: 1, opacity: 0.8 }}>
                  Click the scene to reposition
                </span>
              </div>
            </>
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
              <p style={{ color: C.bg, fontSize: 14, letterSpacing: 2 }}>
                {liveRender ? 'AI IS RENDERING...' : 'Generating AI-rendered preview...'}
              </p>
              <p style={{ color: C.gray, fontSize: 11 }}>
                {liveRender ? 'Placing your product · up to ~60s' : 'Preset portfolio render · ~2s'}
              </p>
            </div>
          )}

          {/* ── 渲染失败提示（访问码渲染；次数已退还）── */}
          {renderError && !rendering && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 21,
              maxWidth: '80%', background: '#fee', border: '1px solid #fcc', color: '#c00',
              padding: '8px 16px', fontSize: 11, lineHeight: 1.5, display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <span>Render failed (your render credit was refunded): {renderError}</span>
              <span onClick={() => setRenderError(null)} style={{ cursor: 'pointer', color: C.gray }}>✕</span>
            </div>
          )}

          {/* ── 无渲染码提示卡：不生成假图，告知这是 demo + 可输入 access code 解锁 ── */}
          {renderNotice && !rendering && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 22, background: 'rgba(255,255,255,0.94)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}>
              <div style={{
                maxWidth: 460, textAlign: 'center', border: `1px solid ${C.lightGray}`,
                borderRadius: 6, padding: '32px 36px', background: C.bg, boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>✦</div>
                <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5, marginBottom: 12 }}>
                  Demo · live render locked
                </p>
                <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, marginBottom: 20 }}>
                  This is a portfolio demo, so no AI image is generated here. To run a real AI
                  render of your scene, enter an access (promo) code below.
                </p>
                <div style={{ marginBottom: 16 }}><AccessCodeEntry /></div>
                <button onClick={() => setRenderNotice(false)} style={{
                  width: '100%', padding: '10px', background: 'none',
                  border: `1px solid ${C.border}`, fontSize: 11, letterSpacing: 1.5,
                  color: C.black, cursor: 'pointer',
                }}>BACK</button>
              </div>
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
                position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                background: C.black, color: C.bg, padding: '6px 16px',
                fontSize: 11, letterSpacing: 1.5,
              }}>AI RENDER RESULT</div>
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

          {/* 舞台外层：固定 16:9，被容器 flex 居中，毛玻璃模糊背景 + 细边框（与 Summary 统一）。
              产品叠层预览放在这层内部，用 Stage 像素坐标即可与画面对齐。*/}
          <div style={{
            position: 'relative', zIndex: 1, flexShrink: 0,
            width: stageSize.width, height: stageSize.height,
            overflow: 'hidden',
          }}>
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
                  onSelect={() => !placingProduct && (setSelectedId(item.id), setSelectedPlacedId(null))}
                  onChange={changes => updateItem(item.id, changes)}
                />
              ))}

              {/* 放置模式预览圆（仅 LIVE：对应真实 mask 区域）*/}
              {liveRender && placingProduct && placeCursor && (
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

          {/* DEMO 产品叠层预览：在舞台层内，用 Stage 坐标定位，随舞台居中而对齐。
              多个产品累加显示，CLEAR 一次清空。*/}
          {DEMO_MODE && !liveRender && !rendering && !showRendered && placedItems.map(it => (
            <img
              key={it.id}
              src={it.product.img}
              alt={it.product.name}
              draggable={false}
              onError={e => { e.currentTarget.style.display = 'none' }}
              onMouseDown={e => startDragItem(e, it)}
              style={{
                position: 'absolute', zIndex: selectedPlacedId === it.id ? 6 : 5,
                left: it.x, top: it.y,
                transform: `translate(-50%, -50%) rotate(${it.rotation || 0}deg)`,
                width: it.width || 140, height: 'auto',
                opacity: it.opacity ?? 1,
                // 放置新产品时关掉指针事件，点击落到画布；否则可拖动/选中
                pointerEvents: placingProduct ? 'none' : 'auto',
                cursor: placingProduct ? 'default' : 'grab',
                outline: selectedPlacedId === it.id ? '2px dashed #fff' : 'none',
                outlineOffset: 3,
                filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.4))',
                userSelect: 'none',
              }}
            />
          ))}
          </div>
        </div>

        {/* ── 右侧工具栏 ── */}
        <div style={{ ...sceneLabSidebar, display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.lightGray}` }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAIRecommend()}
                placeholder="e.g. minimal table lamp..."
                style={{ flex: 1, border: `1px solid ${C.border}`, padding: '9px 12px', fontSize: 14, outline: 'none', background: '#f9f9f9' }}
              />
              <button onClick={handleAIRecommend} style={{
                background: C.black, color: C.bg, border: 'none',
                padding: '9px 14px', fontSize: 14, cursor: 'pointer',
              }}>
                {aiLoading ? '...' : '✦'}
              </button>
            </div>
            {aiLoading && <p style={{ fontSize: 10, color: C.gray, marginTop: 6, letterSpacing: 0.5 }}>✦ AI is analyzing your space...</p>}
            {!aiLoading && aiStyle && <p style={{ fontSize: 10, color: '#2d7a2d', marginTop: 6, letterSpacing: 0.5 }}>Detected style: <strong>{aiStyle}</strong></p>}
            {!aiLoading && aiReason && <p style={{ fontSize: 10, color: C.gray, marginTop: 4, lineHeight: 1.5 }}>{aiReason}</p>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: `0 ${SCENE_LAB_SIDEBAR_PAD}px`, borderBottom: `1px solid ${C.lightGray}` }}>
            {['AI Recommendation', 'Product Library'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 0', border: 'none', background: 'none',
                fontSize: 10, letterSpacing: 1, cursor: 'pointer', whiteSpace: 'nowrap',
                color: activeTab === tab ? C.black : C.gray,
                borderBottom: `2px solid ${activeTab === tab ? C.black : 'transparent'}`,
                marginBottom: -1,
              }}>{tab.toUpperCase()}</button>
            ))}
          </div>

          {/* 3 列网格 → 上面 3 个、下面 2 个；按钮等宽对齐 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '10px 14px', borderBottom: `1px solid ${C.lightGray}` }}>
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setActiveFilter(cat.key)} style={{
                padding: '4px 6px', fontSize: 10, letterSpacing: 0.5, whiteSpace: 'nowrap',
                border: `1px solid ${activeFilter === cat.key ? C.black : C.border}`,
                background: activeFilter === cat.key ? C.black : C.bg,
                color: activeFilter === cat.key ? C.bg : C.black, cursor: 'pointer',
              }}>{cat.label.toUpperCase()}</button>
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
                    <p style={{ fontSize: 11, marginTop: 2 }}>€{p.price}</p>
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

          {/* TRY 放置叠层的调整面板（缩放 / 旋转 / 透明度）*/}
          {selectedPlaced && (
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.lightGray}`, background: '#f9f9f9' }}>
              <p style={{ fontSize: 10, letterSpacing: 1.5, color: C.gray, marginBottom: 10 }}>{selectedPlaced.product.name.toUpperCase()}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.gray }}>Scale</span>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{Math.round(selectedPlaced.width || 140)}px</span>
              </div>
              <input type="range" min="40" max="400" value={selectedPlaced.width || 140}
                onChange={e => updatePlacedItem(selectedPlacedId, { width: parseInt(e.target.value) })}
                style={{ width: '100%', marginBottom: 10 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.gray }}>Rotation</span>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{Math.round(selectedPlaced.rotation || 0)}°</span>
              </div>
              <input type="range" min="0" max="360" value={selectedPlaced.rotation || 0}
                onChange={e => updatePlacedItem(selectedPlacedId, { rotation: parseInt(e.target.value) })}
                style={{ width: '100%', marginBottom: 10 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.gray }}>Opacity</span>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{Math.round((selectedPlaced.opacity ?? 1) * 100)}%</span>
              </div>
              <input type="range" min="10" max="100" value={Math.round((selectedPlaced.opacity ?? 1) * 100)}
                onChange={e => updatePlacedItem(selectedPlacedId, { opacity: e.target.value / 100 })}
                style={{ width: '100%' }} />
            </div>
          )}

          <div style={{
            padding: '10px 14px', borderTop: `1px solid ${C.lightGray}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: 10, color: C.gray, letterSpacing: 1 }}>SCENE ITEMS {totalCount}</p>
              <p style={{ fontSize: 13, fontWeight: 500 }}>Total  €{totalValue}</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { setItems([]); setSelectedId(null); setPlacedItems([]); setSelectedPlacedId(null); setPlacingProduct(null); setPlaceCursor(null) }} style={{
                border: `1px solid ${C.border}`, background: C.bg,
                padding: '6px 10px', fontSize: 10, cursor: 'pointer',
              }}>CLEAR</button>
              <button onClick={handleDone} style={{
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
