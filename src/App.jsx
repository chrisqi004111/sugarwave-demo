import { useState, useCallback } from 'react'
import { NavContext } from './nav'
import { loadSavedDesign } from './savedDesign'

// Top-level pages (new IA)
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
// NOTE: SceneLabLandingPage (the original service-chooser landing) is intentionally
// not imported in this portfolio demo — `/` opens straight into the Scene Lab try-on
// flow. The file is kept for recoverability; re-import it to restore the old IA.
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
  // Portfolio demo: open directly into the Scene Lab experience (no Home page first).
  const [page, setPage] = useState('scene-lab')
  const [params, setParams] = useState({})

  // Hydrate the "Your Design" state from the last saved design (localStorage),
  // so the landing-page "View saved design" CTA can re-open the summary even
  // after a reload. A fresh Try-On flow overwrites all of this normally.
  const [bootSaved] = useState(loadSavedDesign)

  // Try-On flow state (unchanged behaviour, now reached via Scene Lab)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [sceneMeta, setSceneMeta] = useState({})   // { isPreset, presetCleanedUrl }
  const [cleanedImage, setCleanedImage] = useState(bootSaved?.beforeImage ?? null)
  const [finalScene, setFinalScene] = useState(null)
  const [sceneItems, setSceneItems] = useState(bootSaved?.items ?? [])
  const [scenePlacement, setScenePlacement] = useState(bootSaved?.placement ?? null)  // DEMO 放置叠层数据（比例）
  const [demoAfter, setDemoAfter] = useState(bootSaved?.afterImage ?? null)           // DEMO 预设成片（若有）
  const [trialMode, setTrialMode] = useState(null)           // SelectPage 选择的进入模式 { mode, defaultTab }
  const [savedSession, setSavedSession] = useState(null)     // SAVE TO LIBRARY 保存的完整会话（场景图 + 摆放进度）
  const [resumeSession, setResumeSession] = useState(null)   // 「Continue」时注入 TrialPage 的初始进度（null = 全新开始）

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
    case 'order-success': content = <OrderSuccessPage />; break
    case 'brand-space': content = <BrandSpacePage />; break
    case 'brief': content = <BriefFormPage />; break
    case 'lead-success': content = <LeadSuccessPage />; break
    case 'works': content = <WorksPage />; break
    case 'case': content = <CaseDetailPage />; break
    case 'studio': content = <StudioPage />; break
    case 'new': content = <NewPage />; break
    case 'contact': content = <ContactPage />; break

    // ── Scene Lab experience (portfolio demo entry) ──
    // Both 'scene-lab' (root) and 'try-on' open the upload / try-on landing directly.
    case 'scene-lab':
    case 'try-on':
      content = (
        <SceneLabPage
          savedScene={savedSession?.sceneUrl}
          onContinueSaved={() => {
            if (!savedSession) return
            // 直接跳回 Try 页面，并把保存的场景图 + 摆放进度注入（跳过 loading/clean/select）
            setCleanedImage(savedSession.image)
            setUploadedImage(savedSession.image)
            setTrialMode({ mode: savedSession.mode, defaultTab: savedSession.defaultTab })
            setResumeSession(savedSession)
            navigate('trial')
          }}
          onUpload={(img, meta = {}) => { setResumeSession(null); setUploadedImage(img); setSceneMeta(meta); navigate('loading') }}
        />
      )
      break
    case 'loading':
      content = (
        <LoadingPage image={uploadedImage} onDone={(img) => { setCleanedImage(img); navigate('clean') }} />
      )
      break
    case 'clean':
      content = (
        <CleanPage
          image={uploadedImage}
          isPreset={sceneMeta.isPreset}
          presetCleanedUrl={sceneMeta.presetCleanedUrl}
          onDone={(img) => { setCleanedImage(img); navigate('select') }}
        />
      )
      break
    case 'select':
      content = <SelectPage onSelect={(sel) => { setTrialMode(sel ?? null); navigate('trial') }} />
      break
    case 'trial':
      content = (
        <TrialPage
          image={cleanedImage || uploadedImage}
          mode={trialMode?.mode}
          defaultTab={trialMode?.defaultTab}
          resume={resumeSession}
          onSaveToLibrary={(session) => setSavedSession(session)}
          onDone={({ sceneDataUrl, items, demoAfter: da, placement, session }) => {
            setFinalScene(sceneDataUrl)
            setSceneItems(items)
            setDemoAfter(da ?? null)
            setScenePlacement(placement ?? null)
            // 记住本次的原始摆放，「← BACK TO SCENE」返回 Try 页时还原（不清空产品）
            setResumeSession(session ?? null)
            navigate('summary')
          }}
        />
      )
      break
    case 'summary':
      content = (
        <SummaryPage
          beforeImage={cleanedImage || uploadedImage}
          afterImage={demoAfter || finalScene}
          placement={scenePlacement}
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
    </NavContext.Provider>
  )
}
