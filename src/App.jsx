import { Routes, Route, useLocation } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { usePageLoad } from './hooks/usePageLoad'

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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageWrapper>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  const isLoading = usePageLoad()

  return (
    <>
      <LoadingScreen isVisible={isLoading} />
      <ScrollProgress />
      <Navbar theme={theme} onToggleTheme={toggle} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppRoutes />
      </main>
      <Footer />
    </>
  )
}
