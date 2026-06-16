# AI Furniture Placement Demo

上传一张空间照片，AI 清理场景、推荐产品，并把产品**真实地渲染进你的空间**（Scene Lab）。
React + Vite + Konva 前端；图像生成走 OpenAI `gpt-image-2`，两条通道可选。

---

## 快速开始

```bash
npm install
npm run dev          # 必须用 dev server 跑（代理 + codex 桥都在 vite.config.js 里）
```

打开终端打印的 `http://localhost:5173/`。

> ⚠️ 改了 `vite.config.js`（代理 / codex 桥）后**必须重启** dev server（`Ctrl+C` 再 `npm run dev`）；
> 改 `src/` 下的文件则有 HMR 热更新，刷新页面即可。

### 环境变量（`.env`）

| 变量 | 用途 |
|---|---|
| `VITE_OPENAI_KEY` | OpenAI key（API 通道出图 / Gemini 之外的图像编辑），由 vite 代理注入 Authorization |
| `VITE_GEMINI_KEY` | 空间分析 + 产品推荐 |
| `VITE_REPLICATE_TOKEN` | 备用图像通道 |

> 本机出网走本地代理 `http://127.0.0.1:59527`（见 `vite.config.js` 的 `proxyAgent`）。换了代理端口要同步改。

---

## 渲染管线（Scene Lab → TRY → 点位置）

### 两条出图通道（顶栏 ENGINE 按钮切换）

- **`ENGINE: CODEX`（默认）** — 本地 Codex CLI，走 ChatGPT **订阅额度**，不按 API 计费。
  由 `vite.config.js` 的 `/api/codex/place` 中间件桥接。
- **`ENGINE: API`** — 直连 OpenAI `gpt-image-2` 图像编辑接口，**按 API 计费**。

### 关键实现要点 / 踩过的坑

1. **输出比例跟随「原始上传照片」，不再压瘪。**
   画布是 16:9，但 mask 按**原图尺寸**生成，点击位置从画布坐标换算回原图坐标（照片在画布里是 contain 居中、四周可能留边）。
   `openai.js` 据 mask 原始尺寸推出目标尺寸（保持原图比例、最长边 1024、宽高对齐到 16 的倍数 —— `gpt-image-2` 要求宽高均可被 16 整除）。
   → 传竖图出竖图、4:3 出 4:3、16:9 出 16:9。

2. **Codex 桥（`/api/codex/place`）的三个必需修复：**
   - **prompt 走 stdin**，不作为 `cmd.exe` 参数 —— 多行字符串当参数会被 cmd.exe 的换行截断，导致 `--skip-git-repo-check`/`-i` 丢失、报“不在受信任目录”。
   - **绕过沙箱** `--dangerously-bypass-approvals-and-sandbox` —— 本机 codex 的 Windows 受限令牌沙箱已损坏（"sandbox setup is missing or out of date"），`workspace-write` 会挡住所有命令执行，codex 无法落盘 `output.png`。
   - **`-c model_reasoning_effort="low"` + 超时 420s** —— 默认 high 思考开销太大；一次完整出图约 1.5–3 分钟。

3. **强制走 AI 生成，禁止手工贴图。** instruction 明确要求用 `gpt-image-2` 出图，并禁止用 Python/PIL、PowerShell/.NET System.Drawing 手工合成（否则只是把产品图硬贴进去，没有光照/透视）。

4. **多角度参考图 + 尺寸一起发给 codex。** 见下节。

---

## 产品参考图（多角度）与尺寸

让 AI 更准确理解产品的 **3D 形状** 与 **比例**，有两个来源，渲染时**自动合并**（最多取 6 张，含基准图）：

### A. 文件夹（持久）—— `src/assets/products/<产品id>/`

把某产品的多角度照片丢进它的文件夹即可，**文件名任意**，支持 `png/jpg/jpeg/webp`。
Vite 用 `import.meta.glob` 在构建时自动收集，无需改代码（丢进去 → HMR 自动生效）。

已建好的文件夹（产品 id 见 `src/pages/TrialPage.jsx` 的 `PRODUCTS`）：

```
src/assets/products/
├── boop/        # Boop      18×18×16 cm
├── lianlian/    # Lianlian  22×22×35 cm
├── forest/      # Forest    25×25×160 cm
└── scratch/     # Scratch   15×15×20 cm
```

### B. UI 临时上传（当次会话）—— 产品行的 `+ REF` 按钮

点 `+ REF` 选图，徽标显示 `REF n`（文件夹张数 + 本次上传张数之和）；`✕` 只清除本次上传，不影响文件夹图。

### 尺寸如何参与渲染

每个产品在 `PRODUCTS` 里写好 `dimensions`（如 `'22cm × 22cm × 35cm'`），渲染时**随参考图一并注入 prompt**：

> `Its real-world physical dimensions are <dimensions> (width × depth × height). SIZE IS CRITICAL: scale the product so it truly matches these real dimensions relative to the room…`

prompt 还给了房间里常见参照物（沙发座面≈45cm、桌面≈75cm、门≈200cm、地砖≈30–60cm）帮助校准比例。
要调整某产品的尺寸表现，改它在 `PRODUCTS` 里的 `dimensions` 即可。

---

## 代码地图

| 文件 | 职责 |
|---|---|
| `src/pages/SceneLabPage.jsx` | 上传/选择空间照片、构图 |
| `src/pages/TrialPage.jsx` | 画布、放置模式、参考图上传、调用渲染 |
| `src/services/openai.js` | 组装尺寸/prompt/参考图，分发到 codex 或 API 通道 |
| `src/services/gemini.js` | 空间分析 + 产品推荐 |
| `vite.config.js` | 出网代理 + `/api/codex/place` 本地 Codex 桥 |

---

## 常见问题

- **渲染失败 `Codex failed: …`** —— 报错里带 codex 退出码 + stdout/stderr 尾部；同时看 dev server 终端的 `[codex] …` 日志。常见：超时（出图>420s）、沙箱报错、未生成 `output.png`。
- **比例不对 / 被压扁** —— 确认改动后**重启了 dev server**；输出比例跟随原图，不是画布。
- **产品偏大/偏小** —— 调该产品 `PRODUCTS.dimensions`，或补几张带清晰比例的参考图。
- **安全提示** —— codex 桥用了 `--dangerously-bypass-approvals-and-sandbox`（无沙箱执行 codex 生成的命令）。仅限本机本地 dev 使用，**切勿把 dev server 暴露到公网**。
