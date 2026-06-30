import { Routes, Route, useLocation } from 'react-router-dom'
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
      V8:              lazy(() => import('./pages/GarageV8')),
      AccessoryDetail: lazy(() => import('./pages/GarageAccessoryDetail')),
    }
  : null

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
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

          {/* Public garage route — always the Coming Soon page */}
          <Route path="/garage" element={<GarageComingSoon />} />

          {/* Garage design variants — only registered in local dev */}
          {DEV_GARAGE && (
            <>
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
              <Route path="/garage/v8" element={<DEV_GARAGE.V8 />} />
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
                top: '50%',
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
        </>
      )}
    </>
  )
}
