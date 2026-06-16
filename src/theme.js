// Shared design tokens — mirrors sugarwavestudio.com.
// Palette: black/white + grays. Fonts via Typekit (loaded in index.css).
export const C = {
  bg: '#ffffff',
  bgGray: '#eeeeee',     // .background-light-gray on the live site
  bgMedium: '#e0e0e0',   // .background-medium-gray
  black: '#000000',
  gray: '#7a7a7a',       // site text-gray / button hover
  lightGray: '#e0e0e0',
  border: '#cccccc',
}

export const FONTS = {
  heading: 'corbel, sans-serif',   // h1 / h2 / h3
  body: 'nobel, sans-serif',       // body copy (light, weight 200)
  nav: 'myriad-pro, sans-serif',   // navigation + small labels
  serif: 'minion-pro, serif',      // editorial / press
}

export const NAV_HEIGHT = 64       // kept at 64 so the existing try-on flow
                                   // pages (which hardcode a 64px offset) stay intact
export const PAGE_WIDTH = 1000     // .page-width max-width
export const PAGE_PAD = 100        // .page-width side padding

// Small label / eyebrow above section headings. Word-case (no all-caps),
// Myriad Pro, muted gray — matching the live site's clean treatment.
export const kicker = {
  fontSize: 14,
  fontFamily: FONTS.nav,
  fontWeight: 400,
  color: C.gray,
  marginBottom: 14,
}
