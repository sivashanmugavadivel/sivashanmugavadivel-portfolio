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

/* My Garage — Bear 650 scroll-spin + showcase. This is what the "My Garage"
   item in the navbar points at, and the only garage there is: the earlier
   design studies (Garage, GarageNew, GaragePremium, V3–V8) have been removed
   now that this one is settled. /garage keeps showing Coming Soon.

   The ride list, ride detail, storefront and vlog pages all live under it.
   GarageV7RideDetail keeps its name for history's sake — it is what serves
   /mygarage/rides and /mygarage/rides/:id. */
const MyGarage = lazy(() => import('./pages/MyGarage'))
const MyGarageRides = lazy(() =>
  import('./pages/GarageV7RideDetail').then(m => ({ default: m.GarageV7AllRides })))
const MyGarageRideDetail = lazy(() => import('./pages/GarageV7RideDetail'))
const MyGarageStorefront = lazy(() => import('./pages/GarageStorefront'))
/* One vlog, at /mygarage/vlogs/<name>. Content comes from the per-vlog JSON
   files in public/mygarage/vlog/config — see src/data/vlogs.js. */
const MyGarageVlogDetail = lazy(() => import('./pages/MyGarageVlogDetail'))

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

          {/* the old address — kept so any existing link still lands somewhere */}
          <Route path="/garage" element={<GarageComingSoon />} />

          {/* My Garage: Bear 650 scroll-driven 360° parallax + showcase */}
          <Route path="/mygarage" element={<MyGarage />} />
          <Route path="/mygarage/rides" element={<MyGarageRides />} />
          <Route path="/mygarage/rides/:id" element={<MyGarageRideDetail />} />
          <Route path="/mygarage/storefront" element={<MyGarageStorefront />} />
          {/* The bare path opens the newest vlog; the "all vlogs" listing is
              the section design still to come. */}
          <Route path="/mygarage/vlogs" element={<MyGarageVlogDetail />} />
          <Route path="/mygarage/vlogs/:id" element={<MyGarageVlogDetail />} />

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
