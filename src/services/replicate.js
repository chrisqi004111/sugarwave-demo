// src/services/replicate.js
//
// Authorization 由 vite.config.js 的代理层统一注入，这里不传。
// 使用 FLUX.1 Fill [dev] 官方模型，无需 version hash，直接用模型路径调用。
// 请求路径：/api/replicate/v1/models/... → https://api.replicate.com/v1/models/...

const BASE = '/api/replicate/v1'

// lama-cleaner — 专门做 object removal，效果稳定
// 费用约 $0.002/次，$10 约可测试 5000 次
const MODEL_VERSION = 'cdac78a1bec5b23c07fd29692fb70baa513ea403a39e643c48ec5edadb15fe72'
const MODEL_ENDPOINT = `${BASE}/predictions`

// ── DEMO_MODE ──────────────────────────────────────────────────────
// 当 VITE_DEMO_MODE=true 时，跳过真实 Lamar(lama-cleaner) API，不消耗额度。
// UX 由 CleanPage 控制：预设场景直接返回「已清理」的预设图；用户自定义上传
// 则提示「自定义清理需要 Live API」并引导改用 demo 场景（见 CleanPage）。
// 这里的 cleanImage() 仍保留一个安全兜底分支，避免任何遗漏调用换错图。
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

// demo 模式下，自定义上传无法真实清理时统一引导到的预设「已清理」场景。
export const DEMO_FALLBACK_SCENE = '/spaces/living-room.jpg'

// File/Blob → 可直接 <img src> 的 URL；已经是 URL 字符串则原样返回。
function toUsableUrl(image) {
  if (image instanceof File || image instanceof Blob) return URL.createObjectURL(image)
  return image
}

/**
 * Public entry — keeps the real Lamar behaviour, adds a safe demo path.
 *
 * @param {File} imageFile   - 原始图片 File 对象
 * @param {string} maskDataUrl - 黑底白色 mask，data:image/png;base64,...
 * @returns {Promise<string>} - 清理后的图片 URL
 */
export async function cleanImage(imageFile, maskDataUrl) {
  if (DEMO_MODE) {
    console.log('DEMO_MODE cleanup: returning original image (skipping Lamar API)')
    return toUsableUrl(imageFile)
  }

  console.log('LIVE cleanup: calling Lamar API')
  try {
    return await cleanImageLive(imageFile, maskDataUrl)
  } catch (err) {
    console.warn('LIVE cleanup failed: keeping original image', err)
    return toUsableUrl(imageFile)
  }
}

/**
 * 真实 Lamar (lama-cleaner) API 调用 —— 逻辑保持不变。
 *
 * @param {File} imageFile
 * @param {string} maskDataUrl
 * @returns {Promise<string>}
 */
async function cleanImageLive(imageFile, maskDataUrl) {
  const imageBase64 = await fileToBase64(imageFile)
  const maskBase64 = maskDataUrl.split(',')[1]

  // ── 创建 prediction ──────────────────────────────────────────────
  const createRes = await fetch(MODEL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // ✅ 不传 Authorization：vite proxy 已在代理层注入，重复传会导致 401
      'Prefer': 'wait=30',
    },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: {
        image: `data:${imageFile.type || 'image/jpeg'};base64,${imageBase64}`,
        mask:  `data:image/png;base64,${maskBase64}`,
      },
    }),
  })

  if (!createRes.ok) {
    const errText = await createRes.text()
    if (createRes.status === 401) throw new Error('Invalid Replicate token. Check VITE_REPLICATE_TOKEN in .env')
    if (createRes.status === 422) throw new Error('Invalid input format. Check image/mask data URLs.')
    throw new Error(`Replicate API error ${createRes.status}: ${errText}`)
  }

  const prediction = await createRes.json()

  // Prefer: wait=30 有时直接返回结果
  if (prediction.status === 'succeeded' && prediction.output) {
    return prediction.output
  }

  // 否则轮询
  if (prediction.id) {
    return await pollPrediction(prediction.id)
  }

  throw new Error('No prediction ID returned: ' + JSON.stringify(prediction))
}

// ── 轮询 prediction 结果 ──────────────────────────────────────────
async function pollPrediction(id) {
  const maxAttempts = 40   // 最多等 80s
  const interval = 2000

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, interval))

    const res = await fetch(`${BASE}/predictions/${id}`)
    // ✅ 不传 Authorization：vite proxy 统一处理

    if (!res.ok) {
      throw new Error(`Poll error ${res.status}: ${await res.text()}`)
    }

    const data = await res.json()
    console.log(`[replicate] poll ${i + 1}: status=${data.status}`)

    if (data.status === 'succeeded') {
      return data.output
    }
    if (data.status === 'failed') {
      throw new Error('Prediction failed: ' + (data.error || 'unknown error'))
    }
    if (data.status === 'canceled') {
      throw new Error('Prediction was canceled')
    }
    // starting / processing → 继续等
  }

  throw new Error('Timed out after 80 seconds')
}

// ── 经访问码走后端真实清理（生产环境）────────────────────────────────
// 后端 /api/clean 校验码并扣 1 次 clean，再调用 Replicate。把图片+mask 缩到
// 最长边 1024（控制请求体大小/时长），异步时轮询 /api/clean-status。
// 返回 { url, left }（left = 该码剩余清理次数）。
export async function cleanImageViaCode(imageFile, maskDataUrl, code) {
  const { url: image, w, h } = await fileToScaledJpegDataUrl(imageFile, 1024)
  const mask = await maskToScaledPngDataUrl(maskDataUrl, w, h)
  const res = await fetch('/api/clean', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, image, mask }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `clean failed (${res.status})`)
  let output = data.output
  if (data.status !== 'succeeded' || !output) {
    output = await pollCleanStatus(data.id)
  }
  const url = Array.isArray(output) ? output[0] : output
  if (!url) throw new Error('clean returned no image')
  return { url, left: data.left }
}

async function pollCleanStatus(id, maxAttempts = 40, interval = 2000) {
  if (!id) throw new Error('no prediction id')
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, interval))
    const res = await fetch(`/api/clean-status?id=${encodeURIComponent(id)}`)
    const data = await res.json().catch(() => ({}))
    if (data.status === 'succeeded') return data.output
    if (data.status === 'failed' || data.status === 'canceled') throw new Error('clean ' + data.status)
  }
  throw new Error('clean timed out')
}

// File → JPEG dataURL，最长边 = maxSide（保持比例）；返回 { url, w, h }
function fileToScaledJpegDataUrl(file, maxSide) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const c = document.createElement('canvas'); c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve({ url: c.toDataURL('image/jpeg', 0.92), w, h })
    }
    img.onerror = reject
    img.src = url
  })
}

// mask dataURL → PNG dataURL，缩到 w×h（与缩放后的图同尺寸，白=待清理区）
function maskToScaledPngDataUrl(maskDataUrl, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = maskDataUrl
  })
}

// ── File → base64 string（不含 data:xxx;base64, 前缀）────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
