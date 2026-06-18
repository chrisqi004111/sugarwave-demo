// ── Scene Lab 共享布局比例 ───────────────────────────────────────────
// 各 Scene Lab 子页面统一为「左侧主预览工作区(flex:1) + 右侧固定宽度控制面板」。
// 以「产品选择 / AI 推荐」页（TrialPage）为基准，统一右侧栏宽度，从而让三页的
// 主预览区宽度（= 视口宽 - 侧栏宽）保持一致、对齐顶部操作区。
//
// 用法：右侧栏样式里展开 sceneLabSidebar，并按需追加 padding / 内容样式：
//   <div style={{ ...sceneLabSidebar, padding: 24 }}> ... </div>

// 右侧控制面板宽度（唯一来源，改这里即可同步三页）。
export const SCENE_LAB_SIDEBAR_WIDTH = 320

// 右侧栏统一的水平内距（左右相等）——所有分区（顶部操作按钮、搜索、Tab、筛选、
// 产品列表、底部按钮）都对齐到同一条内栅格：左缘 = 边 + PAD，右缘 = 右边 - PAD。
export const SCENE_LAB_SIDEBAR_PAD = 14

// 右侧控制面板通用外框：固定宽度、不被压缩、左侧分隔线、白底。
export const sceneLabSidebar = {
  width: SCENE_LAB_SIDEBAR_WIDTH,
  maxWidth: '100%',
  flexShrink: 0,
  boxSizing: 'border-box',   // 任何分区追加的 padding 都算进 320 之内，不会把侧栏撑宽
  borderLeft: '1px solid #e0e0e0',
  background: '#ffffff',
}
