# catalog/ — Scene Lab 产品库（按类目自动扫描）

把产品图放进对应**类目文件夹**，Try 页面的产品库会自动收录，不用改代码。

```
src/assets/catalog/
├── lighting/      ← 灯具
├── table/         ← 桌几
├── object/        ← 摆件 / 凳子 / 花瓶等
└── container/     ← 容器 / 收纳
```

## 规则

- **类目 = 文件夹名**，只能是上面 4 个之一：`lighting` / `table` / `object` / `container`。
- **产品 id = 文件名**（去掉扩展名）。文件名会自动转成显示名：
  `ripple-side-table.png` → "Ripple Side Table"。
- 一个文件 = 一个产品。

## 图片要求

| 项目 | 要求 |
|------|------|
| 格式 | **PNG，透明背景**（会被叠加到房间场景上，带投影；jpg/带背景会露出方块） |
| 构图 | 产品居中、四周留白、不裁切 |
| 比例 | 尽量接近正方形（缩略图是 48×48 `cover` 裁切） |
| 分辨率 | 长边约 1000–1500px |
| 大小 | 建议 < 1–2MB |
| 命名 | 全小写、用连字符，**不要空格**：`glow-lamp.png`、`woven-basket.png` |

## 价格 / 尺寸（可选）

文件名只决定显示名和类目。价格、尺寸、标签写在
`src/pages/TrialPage.jsx` 的 `PRODUCT_META`（按 id 索引）。
没写也能用：显示名取自文件名，价格默认 0 —— 把详情发我，我来补。
