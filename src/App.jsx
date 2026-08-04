import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react'
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
 * Where the reader was on each history entry.
 *
 * Keyed by the router's per-entry key, which is stable across a route component
 * being unmounted and rebuilt — which is exactly what happens when you open a
 * ride from My Garage and come back. Module scope, not state: this is per-tab
 * session memory, nothing renders from it, and writing to it must never cost a
 * render (it happens on every scroll event).
 */
const scrollPositions = new Map()

/**
 * How long to keep asking for a scroll position the page can't honour yet.
 * My Garage holds its content behind a frame preloader, so for the first
 * moments after a back navigation the document is one viewport tall and a
 * scrollTo(0, 4000) silently lands at 0. ~3s at 60fps.
 */
const SETTLE_FRAMES = 180

/**
 * Scroll behaviour on navigation:
 *
 *   back / forward  → back to where the reader left that entry
 *   #hash in the URL → scroll to that element
 *   anything else   → top of the page
 *
 * WHY THIS ISN'T LEFT TO THE BROWSER
 *   It used to be — POP returned early and native scroll restoration was meant
 *   to handle it. It can't. The browser restores at its own moment, which for a
 *   lazy-loaded route is always before the page component has mounted and long
 *   before My Garage has revealed the ~10,000px of scroll track the position
 *   refers to. There is nothing to scroll to yet, so it restores to the top and
 *   the reader lands at the beginning of the page they were halfway down.
 *
 *   So restoration is taken over here: remember the position per entry, and on
 *   the way back keep asking for it until the page is tall enough to give it.
 */
function ScrollManager() {
  const { pathname, hash, key } = useLocation()
  const navType = useNavigationType()

  /* Off, or it restores to the top first and we fight it for a frame. */
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
      return () => { window.history.scrollRestoration = 'auto' }
    }
  }, [])

  /* Keep a running note of where this entry is. One Map write per scroll event
     — no state, no re-render.
     A LAYOUT effect, and the ordering matters. Leaving a long page for a short
     one makes the document shrink, and the browser clamps scrollY to the new
     bottom the moment it does: read the position after that and you record
     where the reader was dragged to, not where they were. Restoring 4292 for a
     reader who left at 5013 was exactly this. A layout cleanup runs in the same
     commit but ahead of the outgoing page's nodes being removed, so the
     document is still its old height here. The listener comes off at the same
     moment, so the clamp that follows has nothing left to write through. */
  useLayoutEffect(() => {
    const save = () => scrollPositions.set(key, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })
    return () => { save(); window.removeEventListener('scroll', save) }
  }, [key])

  useEffect(() => {
    let raf, tries = 0
    const cancel = () => cancelAnimationFrame(raf)

    /* Coming back. Ask for the remembered position every frame until the page
       has grown enough to honour it — see SETTLE_FRAMES. */
    const y = navType === 'POP' ? scrollPositions.get(key) : undefined
    if (y) {
      const settle = () => {
        const reach = document.documentElement.scrollHeight - window.innerHeight
        if (reach >= y - 2) { window.scrollTo(0, y); return }
        if (tries++ < SETTLE_FRAMES) raf = requestAnimationFrame(settle)
        else window.scrollTo(0, Math.max(0, reach))   // as close as it will go
      }
      raf = requestAnimationFrame(settle)
      return cancel
    }

    /* A fresh arrival. Pages are lazy-loaded, so a hash target usually isn't
       mounted on the first pass; retry for a short while rather than giving up
       on frame one. */
    if (!hash) { window.scrollTo(0, 0); return }

    const find = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) { el.scrollIntoView({ block: 'start' }); return }
      if (tries++ < 60) raf = requestAnimationFrame(find)   // ~1s of retries
      else window.scrollTo(0, 0)
    }
    raf = requestAnimationFrame(find)
    return cancel
  }, [pathname, hash, key, navType])

  return null
}

function AppRoutes() {
  return (
    <PageWrapper>
      <ScrollManager />
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
