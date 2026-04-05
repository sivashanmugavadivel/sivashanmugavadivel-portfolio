import { Routes, Route, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from './hooks/useTheme'
import { usePageLoad } from './hooks/usePageLoad'
import { motion } from 'framer-motion'
import FeedbackPanel from './components/FeedbackPanel'
import SmartToast from './components/SmartToast'
import EasterEgg from './components/EasterEgg'

import LoadingScreen from './components/LoadingScreen'
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
import NotFound from './pages/NotFound'
import PrivacyPolicy from './pages/PrivacyPolicy'
import BlogDesignShowcase from './pages/BlogDesignShowcase'
import BlogPostDesignShowcase from './pages/BlogPostDesignShowcase'
import AboutSectionPicker from './pages/AboutSectionPicker'

import './App.css'

function AppRoutes() {
  return (
    <PageWrapper>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/blog-design-picker" element={<BlogDesignShowcase />} />
        <Route path="/blog-post-design-picker" element={<BlogPostDesignShowcase />} />
        <Route path="/about-section-picker" element={<AboutSectionPicker />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageWrapper>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  const isLoading = usePageLoad()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const location = useLocation()
  const showFeedback = location.pathname !== '/contact'

  return (
    <>
      <LoadingScreen isVisible={isLoading} />
      <ScrollProgress />
      <Navbar theme={theme} onToggleTheme={toggle} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppRoutes />
      </main>
      <Footer />

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
      <SmartToast />
      <EasterEgg />
    </>
  )
}
