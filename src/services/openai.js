// src/services/openai.js
import { apiUrl } from '../utils/apiUrl'
// 两条通道：
//   engine='api'   → OpenAI gpt-image-2 图像编辑接口（按 API 计费，Authorization 由 vite 代理注入）
//   engine='codex' → 本地 Codex CLI（走 ChatGPT 订阅额度，由 vite.config.js 的 /api/codex/place 中间件桥接）

const SIZE = 1024              // 最长边目标分辨率
const MODEL = 'gpt-image-2'

// 由 mask 的原始尺寸（= 原始上传照片的宽高）推出目标尺寸：保持原图比例、最长边=SIZE、
// 宽高对齐到 16 的倍数（gpt-image-2 要求宽高均可被 16 整除）。
// 这样空间图和 mask 不再被强制压成正方形，输出比例与原图一致，避免“压瘪”/比例不符。
async function computeTargetSize(maskDataUrl) {
  const { w, h } = await imageSizeFromDataUrl(maskDataUrl)
  const ratio = w / h
  let tw, th
  if (ratio >= 1) { tw = SIZE; th = SIZE / ratio }
  else { th = SIZE; tw = SIZE * ratio }
  const round16 = n => Math.max(16, Math.round(n / 16) * 16)
  return { w: round16(tw), h: round16(th) }
}

// 渲染 prompt（各通道共用）
function buildRenderPrompt(refCount, productName, productDimensions) {
  const angleNote = refCount > 1
    ? `You are given ${refCount} reference photos of the SAME "${productName}" product shot from different angles — study all of them together to understand its true 3D shape, proportions and materials. `
    : `You are given a reference photo of the "${productName}" product. `
  return angleNote +
    `Place this exact product into the masked (white) area of the room. ` +
    `Its real-world physical dimensions are ${productDimensions} (read as width × depth × height). ` +
    `SIZE IS CRITICAL: scale the product so it truly matches these real dimensions relative to the room. ` +
    `Use visible references in the scene to judge scale — e.g. a sofa seat ≈ 45cm high, a dining/desk table ≈ 75cm high, ` +
    `a door ≈ 200cm high, a floor lamp ≈ 150cm, typical floor tiles ≈ 30–60cm. Do NOT make the product oversized or undersized. ` +
    `Preserve its exact shape, material, color and design — do not redesign or restyle it. ` +
    `Match the room's perspective, lighting, shadows and reflections so it sits naturally and contacts the surface correctly. ` +
    `Make it photorealistic. Keep everything outside the masked area completely unchanged.`
}

// ── 经访问码走后端真实渲染（生产环境，扣 1 次 render）────────────────────
// 复用同样的缩放/prompt 逻辑，但把空间图/mask/产品转成 dataURL 以 JSON 发给
// /api/render（后端校验码、调 OpenAI、扣次数）。返回 { image, left }。
export async function placeProductInSpaceViaCode(
  spaceImageFile, maskDataUrl, productImageFiles, productName, productDimensions, code,
) {
  const productFiles = Array.isArray(productImageFiles) ? productImageFiles : [productImageFiles]
  const { w: TW, h: TH } = await computeTargetSize(maskDataUrl)
  const spaceResized = await resizeImageFile(spaceImageFile, TW, TH)
  const maskResized = await resizeMaskDataUrl(maskDataUrl, TW, TH)
  const productResizedList = await Promise.all(
    productFiles.slice(0, 3).map(f => resizeProductToSquare(f, SIZE)),
  )

  const prompt = buildRenderPrompt(productResizedList.length, productName, productDimensions)

  // 空间图用 JPEG（更小），mask/产品用 PNG（mask 精度 / 产品透明背景）
  const [space, products] = await Promise.all([
    fileToJpegDataUrl(spaceResized, 0.9),
    Promise.all(productResizedList.map(fileToDataUrl)),
  ])

  const res = await fetch(apiUrl('/api/render'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, space, mask: maskResized, products, prompt, width: TW, height: TH }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = data.detail
      ? ' — ' + (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)).slice(0, 300)
      : ''
    throw new Error((data.error || `render failed (${res.status})`) + d)
  }
  if (!data.image) throw new Error('render returned no image')
  return { image: data.image, left: data.left }
}

// File → JPEG dataURL（把已缩放的空间图转成更小的 base64）
function fileToJpegDataUrl(file, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      c.getContext('2d').drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export async function placeProductInSpace(
  spaceImageFile, maskDataUrl, productImageFiles, productName, productDimensions,
  engine = 'api',
) {
  // 兼容单张：统一规整成数组
  const productFiles = Array.isArray(productImageFiles) ? productImageFiles : [productImageFiles]

  // 目标尺寸跟随画布比例（而非死正方形）
  const { w: TW, h: TH } = await computeTargetSize(maskDataUrl)
  // 空间图与 mask 缩到同一目标尺寸；产品图是参考图，比例无关，保持正方形即可
  const spaceResized = await resizeImageFile(spaceImageFile, TW, TH)
  const maskResized = await resizeMaskDataUrl(maskDataUrl, TW, TH)
  // 产品参考图统一成 1024×1024，但保持原比例居中（不拉伸），避免非正方形照片被压变形误导 AI
  const productResizedList = await Promise.all(productFiles.map(f => resizeProductToSquare(f, SIZE)))

  const prompt = buildRenderPrompt(productResizedList.length, productName, productDimensions)

  if (engine === 'codex') {
    return placeViaCodex(spaceResized, maskResized, productResizedList, prompt, TW, TH)
  }
  return placeViaApi(spaceResized, maskResized, productResizedList, prompt, TW, TH)
}

// ── 通道 A：OpenAI gpt-image-2 接口 ───────────────────────────────────
async function placeViaApi(spaceResized, maskResized, productResizedList, prompt, sizeW, sizeH) {
  const maskFile = await dataUrlToFile(maskResized, 'mask.png')

  const formData = new FormData()
  // gpt-image-2 支持 image[] 数组传多张参考图（最多 16 张）
  formData.append('image[]', spaceResized)              // 第一张：空间图（被编辑图，mask 对应它）
  for (const p of productResizedList) formData.append('image[]', p)  // 之后若干张：产品多角度参考图
  formData.append('mask', maskFile)
  formData.append('prompt', prompt)
  formData.append('model', MODEL)
  formData.append('n', '1')
  formData.append('size', `${sizeW}x${sizeH}`)
  formData.append('quality', 'medium')  // high≈173s 易超时；medium≈60-90s，画质/稳定性折中

  const res = await fetch('/api/openai/v1/images/edits', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    if (res.status === 401) throw new Error('Invalid OpenAI key')
    throw new Error(`Invalid input: ${err}`)
  }

  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error('No image returned from OpenAI')
  return `data:image/png;base64,${b64}`
}

// ── 通道 B：本地 Codex CLI（订阅额度，不按 API 计费）──────────────────
async function placeViaCodex(spaceResized, maskResized, productResizedList, prompt, width, height) {
  const [space, products] = await Promise.all([
    fileToDataUrl(spaceResized),
    Promise.all(productResizedList.map(fileToDataUrl)),
  ])

  const res = await fetch('/api/codex/place', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ space, products, mask: maskResized, prompt, width, height }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Codex failed: ${err}`)
  }

  const data = await res.json()
  if (!data.image) throw new Error('No image returned from Codex')
  return data.image
}

// ── 工具函数 ─────────────────────────────────────────────────────────
function imageSizeFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

// 产品参考图专用：保持原比例缩放后居中放到 size×size 透明画布（letterbox，不拉伸变形）
function resizeProductToSquare(file, size) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')  // 默认透明背景
      const scale = Math.min(size / img.width, size / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/png' })), 'image/png')
    }
    img.onerror = reject
    img.src = url
  })
}

function resizeImageFile(file, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        resolve(new File([blob], file.name, { type: 'image/png' }))
      }, 'image/png')
    }
    img.onerror = reject
    img.src = url
  })
}

function resizeMaskDataUrl(dataUrl, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

function dataUrlToFile(dataUrl, filename) {
  return fetch(dataUrl)
    .then(r => r.blob())
    .then(blob => new File([blob], filename, { type: 'image/png' }))
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
