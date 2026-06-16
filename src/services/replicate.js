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

/**
 * @param {File} imageFile   - 原始图片 File 对象
 * @param {string} maskDataUrl - 黑底白色 mask，data:image/png;base64,...
 * @returns {Promise<string>} - 清理后的图片 URL
 */
export async function cleanImage(imageFile, maskDataUrl) {
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

// ── File → base64 string（不含 data:xxx;base64, 前缀）────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
