import { useState, useCallback } from 'react'
import { NavContext } from './nav'
import EventLog from './components/EventLog'

// Top-level pages (new IA)
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import SceneLabLandingPage from './pages/SceneLabLandingPage'
import BrandSpacePage from './pages/BrandSpacePage'
import BriefFormPage from './pages/BriefFormPage'
import LeadSuccessPage from './pages/LeadSuccessPage'
import WorksPage from './pages/WorksPage'
import CaseDetailPage from './pages/CaseDetailPage'
import StudioPage from './pages/StudioPage'
import NewPage from './pages/NewPage'
import ContactPage from './pages/ContactPage'

// Existing Furniture Try-On sub-flow
import SceneLabPage from './pages/SceneLabPage'
import LoadingPage from './pages/LoadingPage'
import CleanPage from './pages/CleanPage'
import SelectPage from './pages/SelectPage'
import TrialPage from './pages/TrialPage'
import SummaryPage from './pages/SummaryPage'

export default function App() {
  const [page, setPage] = useState('home')
  const [params, setParams] = useState({})

  // Try-On flow state (unchanged behaviour, now reached via Scene Lab)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [cleanedImage, setCleanedImage] = useState(null)
  const [finalScene, setFinalScene] = useState(null)
  const [sceneItems, setSceneItems] = useState([])

  const navigate = useCallback((nextPage, nextParams = {}) => {
    setPage(nextPage)
    setParams(nextParams)
    window.scrollTo(0, 0)
  }, [])

  let content
  switch (page) {
    case 'home': content = <HomePage />; break
    case 'shop': content = <ShopPage />; break
    case 'product': content = <ProductDetailPage />; break
    case 'cart': content = <CartPage />; break
    case 'checkout': content = <CheckoutPage />; break
    case 'scene-lab': content = <SceneLabLandingPage />; break
    case 'brand-space': content = <BrandSpacePage />; break
    case 'brief': content = <BriefFormPage />; break
    case 'lead-success': content = <LeadSuccessPage />; break
    case 'works': content = <WorksPage />; break
    case 'case': content = <CaseDetailPage />; break
    case 'studio': content = <StudioPage />; break
    case 'new': content = <NewPage />; break
    case 'contact': content = <ContactPage />; break

    // ── Furniture Try-On sub-flow ──
    case 'try-on':
      content = (
        <SceneLabPage onUpload={(img) => { setUploadedImage(img); navigate('loading') }} />
      )
      break
    case 'loading':
      content = (
        <LoadingPage image={uploadedImage} onDone={(img) => { setCleanedImage(img); navigate('clean') }} />
      )
      break
    case 'clean':
      content = (
        <CleanPage image={uploadedImage} onDone={(img) => { setCleanedImage(img); navigate('select') }} />
      )
      break
    case 'select':
      content = <SelectPage onSelect={() => navigate('trial')} />
      break
    case 'trial':
      content = (
        <TrialPage
          image={cleanedImage || uploadedImage}
          onDone={({ sceneDataUrl, items }) => {
            setFinalScene(sceneDataUrl)
            setSceneItems(items)
            navigate('summary')
          }}
        />
      )
      break
    case 'summary':
      content = (
        <SummaryPage
          beforeImage={cleanedImage || uploadedImage}
          afterImage={finalScene}
          items={sceneItems}
          onBack={() => navigate('trial')}
        />
      )
      break

    default: content = <HomePage />
  }

  return (
    <NavContext.Provider value={{ page, params, navigate }}>
      {content}
      <EventLog />
    </NavContext.Provider>
  )
}
