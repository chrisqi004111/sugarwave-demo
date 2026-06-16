// Demo content for the prototype. Placeholder copy/prices — real data
// comes from the production CMS / commerce backend.

// Each product carries TWO images, in two separate /public folders:
//   `scene` → /public/scenes/<slug>.jpg   — real, vertical scene photo
//             (the product styled in a room). Used by the homepage slider.
//             ONLY set this once the file exists — the slider shows every
//             product that has a `scene`, so a missing file = broken image.
//   `image` → /public/products/<slug>.png  — the product on a transparent
//             background (cut-out). Used by the square product line-up.
// `headline`/`caption` = campaign-style copy for the slider (UPPERCASE
// headline + one elegant line), mirroring the reference layout.
export const PRODUCTS = [
  {
    slug: 'boop', name: 'Boop Stool', series: 'Seating', price: 280,
    blurb: 'Robotic-printed stool, recycled PETG.',
    headline: 'BOOP — SOFT BY DESIGN',
    caption: 'Rounded, robotic-printed forms in recycled PETG — a stool that softens every corner of the room.',
    scene: '/scenes/boop.jpg', image: '/products/boop.png',
  },
  {
    slug: 'lianlian', name: 'Lianlian Lamp', series: 'Lighting', price: 340,
    blurb: 'Translucent printed shade, warm LED.',
    headline: 'LIANLIAN — WARM GLOW',
    caption: 'A translucent printed shade that pools warm light, turning ordinary evenings into something gentler.',
    scene: '/scenes/lianlian.jpg', image: '/products/lianlian.png',
  },
  {
    slug: 'forest', name: 'Forest Side Table', series: 'Tables', price: 520,
    blurb: 'Organic lattice structure, single print.',
    headline: 'FOREST — GROWN IN ONE PRINT',
    caption: 'An organic lattice formed in a single robotic print — sculptural support for any corner.',
    // scene: '/scenes/forest.jpg',  // add once the scene photo is ready
    image: '/products/forest.png',
  },
  {
    slug: 'scratch', name: 'Scratch Vase', series: 'Objects', price: 120,
    blurb: 'Textured surface, food-safe liner.',
    headline: 'SCRATCH — TEXTURE IN FORM',
    caption: 'A tactile, textured surface wrapped around a food-safe liner — quiet character for shelf or table.',
    // scene: '/scenes/scratch.jpg',  // add once the scene photo is ready
    image: '/products/scratch.png',
  },
  // ── sugarwave collection (homepage grid) — real product cut-outs.
  // `collection: true` includes them in the homepage collection line-up;
  // `color` is the colour/pattern shown under the name. Prices in EUR.
  {
    slug: 'fluffy-red', name: 'Fluffy', series: 'Objects', color: 'Red', price: 180,
    blurb: 'Ribbed, robotic-printed vase.', collection: true,
    image: '/products/fluffy.png',
  },
  {
    slug: 'ripple-b-marble', name: 'Ripple Side Table B', series: 'Tables', color: 'Marble', price: 520,
    blurb: 'Robotic-printed side table, single continuous print.', collection: true,
    image: '/products/ripple-side-table-b-marble.png',
  },
  {
    slug: 'ripple-b-pomegranate', name: 'Ripple Side Table B', series: 'Tables', color: 'Pomegranate', price: 520,
    blurb: 'Robotic-printed side table, single continuous print.', collection: true,
    image: '/products/ripple-side-table-b-pomegranate-pattern.png',
  },
  {
    slug: 'ripple-b-vanilla-noir', name: 'Ripple Side Table B', series: 'Tables', color: 'Vanilla Noir', price: 520,
    blurb: 'Robotic-printed side table, single continuous print.', collection: true,
    image: '/products/ripple-side-table-b-vanilla-noir.png',
  },
]

// Product categories / series. `image` = a dedicated category photo in
// /public/categories/<slug>.jpg, used by the homepage collection cards.
export const COLLECTIONS = [
  { slug: 'seating', name: 'Seating', image: '/categories/seating.jpg' },
  { slug: 'lighting', name: 'Lighting', image: '/categories/lighting.jpg' },
  { slug: 'tables', name: 'Tables', image: '/categories/tables.jpg' },
  { slug: 'objects', name: 'Objects', image: '/categories/objects.jpg' },
]

// Works = non-standard project case studies (sculpture, exhibition,
// installation, brand collaboration, case-by-case custom work).
export const WORKS = [
  { slug: 'tide-installation', name: 'Tide — Lobby Installation', type: 'Installation', client: 'Aman Residences' },
  { slug: 'aurora-popup', name: 'Aurora Pop-up Space', type: 'Brand Space', client: 'Aurora Beauty' },
  { slug: 'reef-sculpture', name: 'Reef — Public Sculpture', type: 'Sculpture', client: 'City of Shenzhen' },
  { slug: 'museum-showcase', name: 'Recycled Futures Showcase', type: 'Exhibition', client: 'Design Museum' },
]

export const LAUNCHES = [
  { slug: 'boop-drop', kind: 'Launch', title: 'Boop Stool — Summer Drop', date: '2026-06-10' },
  { slug: 'material-pla', kind: 'News', title: 'New bio-PLA material now in production', date: '2026-05-28' },
  { slug: 'aurora-popup', kind: 'News', title: 'Aurora pop-up opens in Shanghai', date: '2026-05-12' },
]
