import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { useTheme } from './hooks/useTheme'
import { usePageLoad } from './hooks/usePageLoad'
import { motion } from 'framer-motion'
import FeedbackPanel from './components/FeedbackPanel'
import SmartToast from './components/SmartToast'
import EasterEgg from './components/EasterEgg'

import CustomCursor from './components/CustomCursor'
import WordIntro from './components/WordIntro'
import LoadingScreen from './components/LoadingScreen'
import BackToTop from './components/BackToTop'
import SocialFAB from './components/SocialFAB'
import WelcomeTour from './components/WelcomeTour'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import PageWrapper from './components/layout/PageWrapper'
import ScrollProgress from './components/ui/ScrollProgress'

import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Gallery from './pages/Gallery'
import Videos from './pages/Videos'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import GarageComingSoon from './pages/GarageComingSoon'
import NotFound from './pages/NotFound'
import PrivacyPolicy from './pages/PrivacyPolicy'
import BlogDesignShowcase from './pages/BlogDesignShowcase'
import BlogPostDesignShowcase from './pages/BlogPostDesignShowcase'
import AboutSectionPicker from './pages/AboutSectionPicker'

import './App.css'

/* Garage design variants — DEV-ONLY. Defined behind import.meta.env.DEV and
   lazy-loaded so they are completely excluded from the production build.
   The public /garage route always shows the Coming Soon page. */
const DEV_GARAGE = import.meta.env.DEV
  ? {
      Original:        lazy(() => import('./pages/Garage')),
      New:             lazy(() => import('./pages/GarageNew')),
      Premium:         lazy(() => import('./pages/GaragePremium')),
      V3:              lazy(() => import('./pages/GarageV3')),
      V4:              lazy(() => import('./pages/GarageV4')),
      V5:              lazy(() => import('./pages/GarageV5')),
      V6:              lazy(() => import('./pages/GarageV6')),
      V7:              lazy(() => import('./pages/GarageV7')),
      V7RideDetail:    lazy(() => import('./pages/GarageV7RideDetail')),
      V7AllRides:      lazy(() => import('./pages/GarageV7RideDetail').then(m => ({ default: m.GarageV7AllRides }))),
      AccessoryDetail: lazy(() => import('./pages/GarageAccessoryDetail')),
    }
  : null

/* Garage V8 preview — reachable in production ONLY via the direct address
   /garage/v8 (nothing links to it). /garage itself stays Coming Soon.
   Lazy-loaded so it's a separate chunk, fetched only when visited. */
const GarageV8Preview = lazy(() => import('./pages/GarageV8'))

/* My Garage — Bear 650 scroll-spin + showcase. This is what the "My Garage"
   item in the navbar points at; /garage is the older variant and stays
   Coming Soon on the live site.
   The ride list and ride detail pages live under it, so they ship in
   production too (the dev-only /garage/v7/* routes reuse the same
   components — they read the root off the URL and link back accordingly). */
const MyGarage = lazy(() => import('./pages/MyGarage'))
const MyGarageRides = lazy(() =>
  import('./pages/GarageV7RideDetail').then(m => ({ default: m.GarageV7AllRides })))
const MyGarageRideDetail = lazy(() => import('./pages/GarageV7RideDetail'))
const MyGarageStorefront = lazy(() => import('./pages/GarageStorefront'))

/**
 * Scroll behaviour on navigation:
 *
 *   back / forward  → leave it alone, so the browser restores where you were
 *   #hash in the URL → scroll to that element
 *   anything else   → top of the page
 *
 * Pages are lazy-loaded, so a hash target usually isn't mounted on the first
 * pass; we retry for a short while rather than giving up on frame one.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if (navType === 'POP') return          // browser handles back/forward

    if (!hash) { window.scrollTo(0, 0); return }

    let raf, tries = 0
    const find = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) { el.scrollIntoView({ block: 'start' }); return }
      if (tries++ < 60) raf = requestAnimationFrame(find)   // ~1s of retries
      else window.scrollTo(0, 0)
    }
    raf = requestAnimationFrame(find)
    return () => cancelAnimationFrame(raf)
  }, [pathname, hash, navType])

  return null
}

function AppRoutes() {
  return (
    <PageWrapper>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* /garage → real garage in dev, Coming Soon on the live/built site */}
          <Route
            path="/garage"
            element={import.meta.env.DEV ? <DEV_GARAGE.Original /> : <GarageComingSoon />}
          />

          {/* Direct-address-only V8 preview (works in production too) */}
          <Route path="/garage/v8" element={<GarageV8Preview />} />

          {/* My Garage: Bear 650 scroll-driven 360° parallax + showcase */}
          <Route path="/mygarage" element={<MyGarage />} />
          <Route path="/mygarage/rides" element={<MyGarageRides />} />
          <Route path="/mygarage/rides/:id" element={<MyGarageRideDetail />} />
          <Route path="/mygarage/storefront" element={<MyGarageStorefront />} />

          {/* Garage design variants — only registered in local dev */}
          {DEV_GARAGE && (
            <>
              <Route path="/garage/coming-soon" element={<GarageComingSoon />} />
              <Route path="/garage/v1" element={<DEV_GARAGE.Original />} />
              <Route path="/garage/new" element={<DEV_GARAGE.New />} />
              <Route path="/garage/premium" element={<DEV_GARAGE.Premium />} />
              <Route path="/garage/v3" element={<DEV_GARAGE.V3 />} />
              <Route path="/garage/v4" element={<DEV_GARAGE.V4 />} />
              <Route path="/garage/v5" element={<DEV_GARAGE.V5 />} />
              <Route path="/garage/v6" element={<DEV_GARAGE.V6 />} />
              <Route path="/garage/v7" element={<DEV_GARAGE.V7 />} />
              <Route path="/garage/v7/rides" element={<DEV_GARAGE.V7AllRides />} />
              <Route path="/garage/v7/rides/:id" element={<DEV_GARAGE.V7RideDetail />} />
              <Route path="/garage/accessories/:id" element={<DEV_GARAGE.AccessoryDetail />} />
            </>
          )}

          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/blog-design-picker" element={<BlogDesignShowcase />} />
          <Route path="/blog-post-design-picker" element={<BlogPostDesignShowcase />} />
          <Route path="/about-section-picker" element={<AboutSectionPicker />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </PageWrapper>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  const { isWordIntro, isLoading, contentReady, onWordIntroComplete, onLoadingExitComplete } = usePageLoad()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const location = useLocation()
  const showFeedback = location.pathname !== '/contact'

  return (
    <>
      <CustomCursor />
      <WordIntro isVisible={isWordIntro} onComplete={onWordIntroComplete} />
      <LoadingScreen isVisible={isLoading} onExitComplete={onLoadingExitComplete} />

      {/* Render page content when loading starts exit (panels sliding) so it's visible through the gap */}
      {((!isWordIntro && !isLoading) || contentReady) && (
        <>
          <ScrollProgress />
          <Navbar theme={theme} onToggleTheme={toggle} />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <AppRoutes />
          </main>
          <Footer />
        </>
      )}

      {/* UI overlays only after panels fully gone */}
      {contentReady && (
        <>
          {/* ── Floating Feedback Button ── */}
          {showFeedback && (
            <motion.button
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', scale: { duration: 0.35, ease: 'easeOut' }, x: { duration: 0.35, ease: 'easeOut' } }}
              whileHover={{ x: -8, scale: 1.15, transition: { duration: 0.2, ease: 'easeOut' } }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFeedbackOpen(true)}
              style={{
                position: 'fixed',
                right: -5,
                top: '42%',
                transform: 'translateX(55%) translateY(-50%)',
                zIndex: 90,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}fed-gif1.gif`}
                alt="Feedback"
                style={{ width: 'auto', height: '120px', display: 'block' }}
              />
            </motion.button>
          )}

          <FeedbackPanel open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
          {location.pathname === '/' && <SmartToast />}
          <EasterEgg />
          <BackToTop />
          <SocialFAB />
          {/* First-visit welcome tour — home page only, after the intro/loading
              (this block is gated by contentReady) and the hero has settled. */}
          {location.pathname === '/' && <WelcomeTour />}
        </>
      )}
    </>
  )
}
