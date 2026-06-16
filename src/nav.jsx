import { createContext, useContext } from 'react'

// Maps each top-level page key to the URL the production site should use.
// Shown in the UI so the engineer can read the intended IA / routing.
export const ROUTES = {
  home: '/',
  shop: '/shop',
  product: '/shop/:slug',
  cart: '/cart',
  checkout: '/checkout',
  'scene-lab': '/scene-lab',
  'try-on': '/scene-lab/furniture-try-on',
  'brand-space': '/scene-lab/brand-space',
  brief: '/scene-lab/brand-space/start',
  'lead-success': '/scene-lab/brand-space/success',
  works: '/works',
  case: '/works/:slug',
  studio: '/studio',
  new: '/new',
  contact: '/contact',
}

// Which top-level nav item is "active" for a given page key.
export const TOP_LEVEL = {
  shop: 'shop', product: 'shop', cart: 'shop', checkout: 'shop',
  'scene-lab': 'scene-lab', 'try-on': 'scene-lab', 'brand-space': 'scene-lab',
  brief: 'scene-lab', 'lead-success': 'scene-lab',
  loading: 'scene-lab', clean: 'scene-lab', select: 'scene-lab',
  trial: 'scene-lab', summary: 'scene-lab',
  works: 'works', case: 'works',
  studio: 'studio', new: 'new', contact: 'contact', home: 'home',
}

export const NavContext = createContext({
  page: 'home',
  params: {},
  navigate: () => {},
})

export const useNav = () => useContext(NavContext)
