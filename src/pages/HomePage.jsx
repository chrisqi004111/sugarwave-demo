import { useState, useEffect, useCallback, useRef } from 'react'
import { Page, Container, SectionHead, Btn, Placeholder, track } from '../components/Layout'
import { C, FONTS, NAV_HEIGHT, PAGE_WIDTH, PAGE_PAD, kicker } from '../theme'
import { useNav } from '../nav'
import { PRODUCTS, WORKS, LAUNCHES, COLLECTIONS } from '../data'
import hero from '../assets/hero.png'

// Home serves BOTH conversion paths:
//   Buy line:     Home → Shop → Product Detail → Cart / Checkout
//   Project line: Home → Scene Lab → Start Project → Brief → Lead Success
// Section order per spec:
//   New/Launch · Featured Products · Scene Lab Banner · Selected Works
//   · Studio/Process · Contact/Newsletter
export default function HomePage() {
  const { navigate } = useNav()

  return (
    <Page>
      {/* ══ 1. Full-bleed banner — latest news & launches, auto-sliding ══ */}
      <HeroBanner navigate={navigate} />

      {/* ══ 2. Shop — featured product slider, front-and-center ══ */}
      <ShopSlider navigate={navigate} />

      {/* ══ Full-width product line-up — every product, like a collection ══ */}
      <ProductList navigate={navigate} />

      {/* ══ 3. Scene AI — before/after drag-to-reveal ══ */}
      <SceneAISection navigate={navigate} />

      {/* ── Intro — brand statement + two entry CTAs ── */}
      <Container style={{ paddingBottom: 72, maxWidth: '100%' }}>
        <p style={kicker}>Robotic-printed furniture & spaces</p>
        <h1 style={{ fontSize: 50, fontWeight: 400, lineHeight: 1.1, maxWidth: 760, margin: '6px 0 24px' }}>
          Objects that fit your space.<br />Spaces made to order.
        </h1>
        <p style={{ fontSize: 18, color: C.gray, lineHeight: 1.5, maxWidth: 540, marginBottom: 36 }}>
          Shop the collections, or bring us a space — Scene AI places our pieces in
          your room with AI, and takes on commercial custom projects end-to-end.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 56 }}>
          <Btn onClick={() => { track('hero_cta_click_shop'); navigate('shop') }}>
            Shop collections
          </Btn>
          <Btn
            variant="secondary"
            onClick={() => { track('hero_cta_click_scene_lab'); navigate('scene-lab') }}
          >
            Enter Scene AI
          </Btn>
        </div>
        <Placeholder src={hero} label="Sugarwave" ratio="16/7" />
      </Container>

      {/* ── Selected Works ── */}
      <Container style={{ marginBottom: 96, maxWidth: '100%' }}>
        <SectionHead
          kicker="Works"
          title="Selected Works"
          sub="Sculpture, exhibitions, installations and brand collaborations — non-standard, case-by-case."
          action={<Btn variant="secondary" onClick={() => navigate('works')}>All works →</Btn>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {WORKS.slice(0, 2).map(w => (
            <div
              key={w.slug}
              onClick={() => {
                track('works_card_click', { slug: w.slug, from: 'home' })
                navigate('case', { slug: w.slug })
              }}
              style={{ cursor: 'pointer' }}
            >
              <Placeholder label={w.name} ratio="16/9" />
              <p style={{ ...kicker, marginTop: 14, marginBottom: 6 }}>{w.type} · {w.client}</p>
              <p style={{ fontSize: 18 }}>{w.name}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* ── New / Launch Carousel ── */}
      <Container style={{ marginBottom: 96, maxWidth: '100%' }}>
        <SectionHead
          kicker="Just landed"
          title="New & Launches"
          action={<Btn variant="secondary" onClick={() => navigate('new')}>View all →</Btn>}
        />
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8 }}>
          {LAUNCHES.map(l => (
            <div
              key={l.slug}
              onClick={() => navigate('new')}
              style={{ minWidth: 300, flex: '0 0 300px', cursor: 'pointer' }}
            >
              <Placeholder label={l.kind} ratio="3/2" />
              <p style={{ ...kicker, marginTop: 14, marginBottom: 6 }}>{l.kind} · {l.date}</p>
              <p style={{ fontSize: 17 }}>{l.title}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* ── Studio / Process ── */}
      <Container style={{ marginBottom: 96, maxWidth: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <Placeholder label="Robotic printing" ratio="4/3" />
          <div>
            <p style={kicker}>Studio</p>
            <h2 style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.25, margin: '6px 0 14px' }}>
              Robotic printing, recycled materials, made to be remade.
            </h2>
            <p style={{ fontSize: 16, color: C.gray, lineHeight: 1.55, marginBottom: 28 }}>
              Our process, materials and sustainability commitments — and how we take
              custom work from brief to delivery.
            </p>
            <Btn variant="secondary" onClick={() => navigate('studio')}>About the studio →</Btn>
          </div>
        </div>
      </Container>

      {/* ── Contact / Newsletter ── */}
      <NewsletterStrip navigate={navigate} />
    </Page>
  )
}

// Full-bleed collection line-up — spans the full viewport width (same as the
// hero banner). Shows the product CATEGORIES (Lighting / Tables / Seating /
// Objects) as cover-image cards; clicking one opens Shop filtered to it.
function ProductList({ navigate }) {
  return (
    <section style={{
      position: 'relative', width: '100vw', left: '50%', right: '50%',
      marginLeft: '-50vw', marginRight: '-50vw',
      padding: '0 50px', marginBottom: 104, boxSizing: 'border-box',
    }}>
      <h2 style={{
        fontSize: 30, fontWeight: 400, lineHeight: 1.15,
        letterSpacing: 0.5, margin: '0 0 56px',
      }}>
        SUGARWAVE COLLECTION
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLLECTIONS.length}, 1fr)`, gap: 32,
      }}>
        {COLLECTIONS.map(c => (
          <div
            key={c.slug}
            onClick={() => {
              track('category_click', { slug: c.slug, name: c.name, from: 'home_collection' })
              navigate('shop', { collection: c.slug })
            }}
            style={{ cursor: 'pointer', textAlign: 'center' }}
          >
            {/* Dedicated category photo (/public/categories) — square, filled */}
            <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
              <CategoryThumb src={c.image} label={c.name} />
            </div>
            <p style={{
              marginTop: 10, fontSize: 13, lineHeight: 1.4,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {c.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// Category cover image with a graceful fallback tile if the file is absent.
function CategoryThumb({ src, label }) {
  const [ok, setOk] = useState(Boolean(src))
  return (
    <div style={{
      position: 'absolute', inset: 0, background: C.bgGray,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {ok && (
        <img
          src={src} alt={label} onError={() => setOk(false)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
      {!ok && <span style={{ color: C.gray, fontFamily: FONTS.nav, fontSize: 14 }}>{label}</span>}
    </div>
  )
}

// ── Scene AI — "design your own" before/after section ────────────────────
// Pitch: upload a room photo, AI clears it and places our pieces. The
// before/after slider lets you drag to compare an empty room vs. a furnished
// one. Photos go in /public/scene-ai (before.jpg / after.jpg); until then it
// falls back to two shaded tiles so the interaction still demos.
// Rounded "pill" button — matches the reference's Explore / configurate style
// (the site's default Btn is square-cornered, so this is local to Scene Lab).
function PillBtn({ children, onClick, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONTS.body, fontSize: small ? 14 : 16,
        padding: small ? '8px 24px' : '12px 32px',
        border: `1px solid ${C.black}`, borderRadius: 999,
        background: 'transparent', color: C.black, cursor: 'pointer',
        transition: 'all 0.18s', whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = C.black; e.currentTarget.style.color = '#fff' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.black }}
    >
      {children}
    </button>
  )
}

function SceneAISection({ navigate }) {
  // The 4 "classics" = the original signature products (non-collection items).
  const classics = PRODUCTS.filter(p => !p.collection).slice(0, 4)

  return (
    <div style={{
      // Full-bleed like the hero banner & collection — spans the whole viewport.
      position: 'relative', width: '100vw', left: '50%', right: '50%',
      marginLeft: '-50vw', marginRight: '-50vw',
      background: C.bgGray, padding: `80px ${PAGE_PAD}px 88px`,
      marginBottom: 96, boxSizing: 'border-box',
    }}>
      <div>
        {/* ── Block 1: Scene Lab hero — text left, before/after demo right ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '0.8fr 1.2fr',
          gap: 56, alignItems: 'center', marginBottom: 80,
        }}>
          <div>
            <h2 style={{ fontSize: 48, fontWeight: 400, lineHeight: 1.1, margin: '0 0 14px' }}>
              Scene Lab
            </h2>
            <p style={{ fontSize: 22, color: C.gray, lineHeight: 1.4, maxWidth: 380, marginBottom: 36 }}>
              See it in your space before it exists.
            </p>
            <PillBtn onClick={() => { track('scene_lab_cta_click', { from: 'home_scenelab' }); navigate('scene-lab') }}>
              Explore
            </PillBtn>
          </div>
          <BeforeAfter before="/scene-ai/before.jpg" after="/scene-ai/after.jpg" ratio="4/3" />
        </div>

        {/* ── Block 2: Customise your classic — 4 configurable products ── */}
        <div>
          <h3 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 28px' }}>
            Customise your classic!
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {classics.map(p => (
              <div key={p.slug} style={{ textAlign: 'center' }}>
                <div style={{
                  aspectRatio: '1/1', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {p.image ? (
                    <img
                      src={p.image} alt={p.name}
                      style={{ maxWidth: '82%', maxHeight: '82%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <span style={{ color: C.gray, fontFamily: FONTS.nav, fontSize: 13 }}>{p.name}</span>
                  )}
                </div>
                <div style={{ marginTop: 16 }}>
                  <PillBtn
                    small
                    onClick={() => { track('scene_lab_configure', { slug: p.slug, name: p.name }); navigate('scene-lab') }}
                  >
                    configurate
                  </PillBtn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// One image layer; falls back to a shaded, labelled tile if the file is absent.
function BAImageLayer({ src, label, shade }) {
  const [ok, setOk] = useState(Boolean(src))
  return (
    <div style={{
      position: 'absolute', inset: 0, background: shade,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {ok && (
        <img
          src={src} alt={label} draggable={false} onError={() => setOk(false)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
      {!ok && <span style={{ color: C.gray, fontFamily: FONTS.nav, fontSize: 14 }}>{label}</span>}
    </div>
  )
}

function BATag({ side, children }) {
  return (
    <span style={{
      position: 'absolute', top: 14, [side]: 14, zIndex: 3,
      background: 'rgba(0,0,0,0.55)', color: '#fff', fontFamily: FONTS.nav,
      fontSize: 12, letterSpacing: 0.5, padding: '5px 10px', pointerEvents: 'none',
    }}>{children}</span>
  )
}

function BeforeAfter({ before, after, ratio = '16/9' }) {
  const [pos, setPos] = useState(50)        // divider position, %
  const dragging = useRef(false)
  const ref = useRef(null)

  const update = (clientX) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const p = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.max(0, Math.min(100, p)))
  }

  return (
    <div
      ref={ref}
      onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); update(e.clientX) }}
      onPointerMove={(e) => { if (dragging.current) update(e.clientX) }}
      onPointerUp={() => { dragging.current = false }}
      onPointerCancel={() => { dragging.current = false }}
      style={{
        position: 'relative', width: '100%', aspectRatio: ratio,
        overflow: 'hidden', userSelect: 'none', touchAction: 'none',
        cursor: 'ew-resize', background: C.bgMedium,
      }}
    >
      {/* After (furnished) = base layer */}
      <BAImageLayer src={after} label="With Sugarwave" shade={C.bgMedium} />
      {/* Before (your room) = top layer, revealed on the left up to `pos` */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <BAImageLayer src={before} label="Your room" shade={C.bgGray} />
      </div>

      <BATag side="left">Before</BATag>
      <BATag side="right">After</BATag>

      {/* Divider + knob */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: `${pos}%`,
        width: 2, background: '#fff', transform: 'translateX(-1px)',
        boxShadow: '0 0 6px rgba(0,0,0,0.3)', pointerEvents: 'none', zIndex: 2,
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 46, height: 46, borderRadius: '50%', background: '#fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: C.black,
          fontSize: 18, letterSpacing: 2,
        }}>‹›</div>
      </div>
    </div>
  )
}

// Featured-product slider for the Shop section — one product at a time:
// big image on the left, a text panel (name · description · BUY NOW) on the
// right, with dots above and ‹ › arrows on the sides. Auto-advances, pauses
// on hover. Mirrors the reference layout (KABUKI-style feature carousel).
function ShopSlider({ navigate }) {
  // Only feature products whose real scene photo is ready.
  const products = PRODUCTS.filter(p => p.scene)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = products.length

  const go = useCallback((next) => setI(((next % n) + n) % n), [n])

  useEffect(() => {
    if (paused || n <= 1) return
    const t = setTimeout(() => go(i + 1), 6000)
    return () => clearTimeout(t)
  }, [i, paused, n, go])

  if (n === 0) return null
  const p = products[Math.min(i, n - 1)]

  const buy = () => {
    track('featured_product_click', { slug: p.slug, name: p.name, from: 'shop_slider' })
    navigate('product', { slug: p.slug })
  }

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        // Full-bleed: content is centred, but the ‹ › arrows reach the
        // viewport's left / right edges.
        position: 'relative', width: '100vw', left: '50%', right: '50%',
        marginLeft: '-50vw', marginRight: '-50vw',
        marginTop: 80, marginBottom: 104,
      }}
    >
      {/* Centred content — original 1000px proportions */}
      <div style={{
        maxWidth: PAGE_WIDTH, margin: '0 auto', padding: `0 ${PAGE_PAD}px`,
        display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) 1fr',
        gap: 56, alignItems: 'center',
      }}>
        {/* Real scene photo (/public/scenes) — vertical frame, filled
            for a full-bleed campaign look. */}
        <div onClick={buy} style={{ cursor: 'pointer' }}>
          <Placeholder src={p.scene} label={p.name} ratio="4/5" />
        </div>

        {/* Text panel */}
        <div>
          {/* Dots */}
          {n > 1 && (
            <div style={{ display: 'flex', gap: 9, marginBottom: 28 }}>
              {products.map((pr, idx) => (
                <button
                  key={pr.slug}
                  onClick={() => setI(idx)}
                  aria-label={`Show ${pr.name}`}
                  style={{
                    width: idx === i ? 26 : 9, height: 9, borderRadius: 5,
                    border: 'none', padding: 0, cursor: 'pointer',
                    background: idx === i ? C.black : C.lightGray,
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </div>
          )}

          {/* Headline — body font (nobel) to match the caption, sized to sit
              on one line where the column allows. */}
          <h2 style={{
            fontFamily: FONTS.body, fontSize: 26, fontWeight: 400, lineHeight: 1.2,
            textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 18px',
          }}>
            {p.headline || p.name}
          </h2>
          <p style={{ fontSize: 17, color: C.gray, lineHeight: 1.6, maxWidth: 400, marginBottom: 32 }}>
            {p.caption || p.blurb}
          </p>
          <Btn onClick={buy}>Buy now</Btn>
        </div>
      </div>

      {/* Arrows — at the viewport edges: left arrow at the page's left edge,
          right arrow at the page's right edge. */}
      {n > 1 && (
        <>
          <BannerArrow dir="prev" onClick={() => go(i - 1)} />
          <BannerArrow dir="next" onClick={() => go(i + 1)} />
        </>
      )}
    </section>
  )
}

// Full-screen-width carousel of the latest news/launches. Auto-advances
// every 5s, slides horizontally, pauses on hover, and exposes arrows + dots.
// Breaks out of the 1000px Container to span the full viewport width.
function HeroBanner({ navigate }) {
  const slides = LAUNCHES
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = slides.length

  const go = useCallback((next) => setI(((next % n) + n) % n), [n])

  // Auto-play — restarts whenever the index changes or pause toggles.
  useEffect(() => {
    if (paused || n <= 1) return
    const t = setTimeout(() => go(i + 1), 5000)
    return () => clearTimeout(t)
  }, [i, paused, n, go])

  const bannerH = `calc(100vh - ${NAV_HEIGHT}px)`

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: 'relative', width: '100vw', left: '50%', right: '50%',
        marginLeft: '-50vw', marginRight: '-50vw',
        height: bannerH, minHeight: 420, maxHeight: 760,
        overflow: 'hidden', background: C.bgGray,
      }}
    >
      {/* Sliding track */}
      <div
        style={{
          display: 'flex', height: '100%', width: `${n * 100}%`,
          transform: `translateX(-${i * (100 / n)}%)`,
          transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {slides.map((s) => (
          <button
            key={s.slug}
            onClick={() => { track('hero_banner_click', { slug: s.slug }); navigate('new') }}
            style={{
              position: 'relative', width: `${100 / n}%`, height: '100%',
              flex: '0 0 auto', border: 'none', padding: 0, cursor: 'pointer',
              background: C.bgMedium, textAlign: 'left',
            }}
          >
            <Placeholder
              label={`${s.kind} · ${s.title}`}
              ratio="auto"
              style={{ aspectRatio: 'auto', height: '100%' }}
            />
            {/* Caption — bottom-left over a gradient scrim */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'flex-end',
              background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0) 45%)',
            }}>
              <div style={{ padding: '0 50px 56px', maxWidth: 760 }}>
                <p style={{
                  fontFamily: FONTS.nav, fontSize: 14, letterSpacing: 0.5,
                  color: 'rgba(255,255,255,0.85)', marginBottom: 12,
                }}>
                  {s.kind} · {s.date}
                </p>
                <h2 style={{
                  fontFamily: FONTS.heading, fontSize: 44, fontWeight: 400,
                  lineHeight: 1.1, color: C.bg, margin: 0,
                }}>
                  {s.title}
                </h2>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Prev / next arrows */}
      {n > 1 && (
        <>
          <BannerArrow dir="prev" variant="ghost" onClick={() => go(i - 1)} />
          <BannerArrow dir="next" variant="ghost" onClick={() => go(i + 1)} />
        </>
      )}

      {/* Dots */}
      {n > 1 && (
        <div style={{
          position: 'absolute', bottom: 24, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 10,
        }}>
          {slides.map((s, idx) => (
            <button
              key={s.slug}
              onClick={() => setI(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              style={{
                width: idx === i ? 28 : 10, height: 10, borderRadius: 6,
                border: 'none', padding: 0, cursor: 'pointer',
                background: idx === i ? C.bg : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// variant 'solid' = white circle behind a dark chevron (Shop slider, on white).
// variant 'ghost' = bare white chevron, no circle (hero banner, over photos).
// The chevron is an SVG polyline so size & stroke thickness are independent:
// big arrow, thin line.
function BannerArrow({ dir, onClick, variant = 'solid', offset = 20 }) {
  const isPrev = dir === 'prev'
  const ghost = variant === 'ghost'
  const points = isPrev ? '24,6 8,32 24,58' : '8,6 24,32 8,58'
  return (
    <button
      onClick={onClick}
      aria-label={isPrev ? 'Previous slide' : 'Next slide'}
      style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        [isPrev ? 'left' : 'right']: offset, zIndex: 2,
        width: 72, height: 72, borderRadius: '50%', cursor: 'pointer',
        border: 'none', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: ghost ? 'transparent' : 'rgba(255,255,255,0.85)',
        color: ghost ? C.bg : C.black,
        opacity: ghost ? 0.9 : 1,
        transition: ghost ? 'opacity 0.2s' : 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        if (ghost) e.currentTarget.style.opacity = 1
        else e.currentTarget.style.background = C.bg
      }}
      onMouseLeave={(e) => {
        if (ghost) e.currentTarget.style.opacity = 0.9
        else e.currentTarget.style.background = 'rgba(255,255,255,0.85)'
      }}
    >
      <svg
        width="30" height="60" viewBox="0 0 32 64" fill="none"
        style={{ display: 'block', filter: ghost ? 'drop-shadow(0 1px 8px rgba(0,0,0,0.4))' : 'none' }}
      >
        <polyline
          points={points} stroke="currentColor" strokeWidth="1.4"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function NewsletterStrip({ navigate }) {
  return (
    <div style={{ background: C.black, color: C.bg, padding: '64px 0' }}>
      <Container style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32, flexWrap: 'wrap', maxWidth: '100%' }}>
        <div>
          <h2 style={{ fontSize: 30, fontWeight: 400, marginBottom: 8, color: C.bg }}>Stay in the loop.</h2>
          <p style={{ fontSize: 16, color: '#aaa' }}>New drops, works and studio notes — no noise.</p>
        </div>
        <div
          onClick={() => navigate('contact')}
          style={{
            border: `1px solid ${C.bg}`, padding: '12px 26px', fontSize: 16,
            fontFamily: FONTS.body, cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.black }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.bg }}
        >
          Contact & subscribe →
        </div>
      </Container>
    </div>
  )
}
