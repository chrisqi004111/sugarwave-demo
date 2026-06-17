// Single source of truth for the product catalogue, shared by Scene Lab (Try)
// and the Shop. Auto-discovered from src/assets/catalog/<category>/<id>.<ext>
// (folder = category, file name = product id). Name / price / dimensions /
// aiPick come from meta.json, generated from product-catalog.xlsx by
// tools/sync_catalog.py. Drop an image into a category folder → it shows up.
import META from './assets/catalog/meta.json'

const MODULES = import.meta.glob(
  './assets/catalog/*/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}',
  { eager: true }
)

const prettify = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export const CATALOG = Object.entries(MODULES)
  .map(([path, mod]) => {
    const [, category, id] = path.match(/catalog\/([^/]+)\/([^/]+)\.\w+$/)
    const m = META[id] || {}
    return {
      id,
      category,
      name: m.name || prettify(id),
      price: m.price ?? 0,
      dimensions: m.dimensions || 'standard size',
      aiPick: m.aiPick ?? false,
      img: mod.default,
    }
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

// Distinct categories present in the catalogue, in a sensible display order.
const ORDER = ['lighting', 'table', 'object', 'container']
export const CATEGORIES = Array.from(new Set(CATALOG.map((p) => p.category)))
  .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
