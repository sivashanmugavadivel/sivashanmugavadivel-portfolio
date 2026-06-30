import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import AnimatedCounter from '../components/garage/AnimatedCounter'
import SpecCard from '../components/garage/SpecCard'
import CSSBarChart from '../components/garage/CSSBarChart'
import Button from '../components/ui/Button'
import {
  bike, accessories, recommendedAccessories, vlogs, routes,
  dreamGarage, wishlist, rideStats, costTracker, maintenance,
  garageGallery,
} from '../data/garage'
import cfg from '../data/config.json'

// ─── helpers ────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL
const img = (path) => path ? `${BASE}${path}` : null

function StarRating({ value, max = 5 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < Math.round(value) ? '#fbbf24' : 'var(--border)', fontSize: '0.85rem' }}>★</span>
      ))}
      <span style={{ marginLeft: 4, fontSize: '0.8rem', color: 'var(--text)' }}>{value}</span>
    </span>
  )
}

function SectionHeading({ label, title, light }) {
  return (
    <div style={{ marginBottom: 36 }}>
      {label && (
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>
          {label}
        </div>
      )}
      <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: light ? '#fff' : 'var(--text-h)', margin: 0, lineHeight: 1.15 }}>
        {title}
      </h2>
    </div>
  )
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '6px 16px',
            borderRadius: 999,
            border: active === tab ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: active === tab ? 'var(--accent-bg)' : 'transparent',
            color: active === tab ? 'var(--accent)' : 'var(--text)',
            fontSize: '0.82rem',
            fontWeight: active === tab ? 600 : 400,
            fontFamily: 'var(--sans)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ─── Section 01: Hero ───────────────────────────────────────────────────────
function HeroSection() {
  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const stats = [
    { value: 12547, suffix: ' KM', label: 'Ridden' },
    { value: 15, suffix: '', label: 'Accessories Installed' },
    { value: 24, suffix: '', label: 'Trips Completed' },
    { value: 50, suffix: '', label: 'Videos Created' },
  ]

  return (
    <section id="garage-hero" style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      overflow: 'hidden',
      paddingTop: 80,
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #0a0a12 0%, #12101a 40%, #1a1025 100%)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(40px, 6vw, 80px) clamp(20px, 5vw, 60px)' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)', marginBottom: 16, fontWeight: 600 }}>
            The Garage
          </div>
          <h1 style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 800, color: '#fff', lineHeight: 1.05, margin: '0 0 20px' }}>
            Machines.<br />Stories.<br />
            <span style={{ color: 'var(--accent)' }}>Journeys.</span>
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)', color: 'rgba(255,255,255,0.6)', maxWidth: 480, lineHeight: 1.7, marginBottom: 36 }}>
            This is where I document my motorcycle, rides, gear, videos, and experiences.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => scrollTo('my-bike')}>
              🏍️ Explore My Bike
            </Button>
            <Button variant="ghost" onClick={() => scrollTo('vlogs')}>
              ▶ Watch Vlogs
            </Button>
            <Button variant="ghost" onClick={() => scrollTo('my-setup')}>
              🔧 View Setup
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
            marginTop: 56,
            maxWidth: 680,
          }}
        >
          {stats.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '20px 20px',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Latest Update strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(124,58,237,0.15)',
          borderTop: '1px solid rgba(124,58,237,0.25)',
          padding: '10px clamp(20px, 5vw, 60px)',
          display: 'flex', alignItems: 'center', gap: 12,
          zIndex: 2,
        }}
      >
        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 600 }}>
          Latest Update
        </span>
        <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.2)' }} />
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
          Full touring setup complete — Saddle bags + Top box installed · May 2026
        </span>
      </motion.div>
    </section>
  )
}

// ─── Section 02: My Bike ────────────────────────────────────────────────────
function MyBikeSection() {
  const [activeTab, setActiveTab] = useState('Overview')
  const tabs = ['Overview', 'Specifications', 'Modifications', 'Maintenance', 'Insurance', 'Documents']

  const tabContent = {
    Overview: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {bike.specs.overview.map((s, i) => <SpecCard key={i} {...s} />)}
      </div>
    ),
    Specifications: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {[...bike.specs.overview, ...bike.specs.performance].map((s, i) => <SpecCard key={i} {...s} />)}
      </div>
    ),
    Modifications: (
      <div style={{ color: 'var(--text)', lineHeight: 1.8 }}>
        <p style={{ margin: 0 }}>Bar end mirrors · Auxbeam LED aux lights · Custom handlebar grips · Flash-X hazard module · Engine guard · Chigee AIO-6 navigation display</p>
      </div>
    ),
    Maintenance: (
      <div>
        {maintenance.history.slice(0, 3).map((h, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '0.9rem' }}>{h.work}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginTop: 2 }}>{h.date} · {h.km.toLocaleString('en-IN')} KM · {h.shop}</div>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{h.cost.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>
    ),
    Insurance: (
      <div style={{ color: 'var(--text)', lineHeight: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 440 }}>
          {[['Policy Type', 'Comprehensive'], ['Insurer', 'HDFC Ergo'], ['Valid Until', 'Sep 2026'], ['IDV', '₹2,20,000'], ['Premium Paid', '₹8,500'], ['No Claim Bonus', '0%']].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: '0.72rem', opacity: 0.5, textTransform: 'uppercase' }}>{k}</div>
              <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    Documents: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {['Registration Certificate (RC)', 'Insurance Policy', 'Pollution Under Control (PUC)', 'Owner\'s Manual'].map(doc => (
          <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>📄</span>
            <span style={{ color: 'var(--text-h)', fontSize: '0.9rem' }}>{doc}</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent)' }}>View →</span>
          </div>
        ))}
      </div>
    ),
  }

  return (
    <section id="my-bike" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 02" title="My Bike" />

      {/* 3-col layout */}
      <div className="bike-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 28, marginBottom: 40, alignItems: 'start' }}>

        {/* Left — Bike Info */}
        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 8 }}>MY BIKE</div>
          <h3 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 800, color: 'var(--text-h)', margin: '0 0 4px', lineHeight: 1.2 }}>{bike.name}</h3>
          <p style={{ color: 'var(--text)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.5 }}>{bike.tagline}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '⚫', label: 'Color', value: bike.color },
              { icon: '📅', label: 'Purchased', value: bike.purchaseDate },
              { icon: '📍', label: 'Location', value: bike.location },
              { icon: '⏱️', label: 'Owned For', value: bike.ownership },
              { icon: '🔄', label: 'Odometer', value: bike.odometer.toLocaleString('en-IN') + ' KM' },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', width: 24, textAlign: 'center' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.5, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-h)', fontWeight: 500 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => document.getElementById('specifications').scrollIntoView({ behavior: 'smooth' })}>
              View Specs
            </Button>
          </div>
        </div>

        {/* Center — Image */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <motion.div
            whileHover={{ scale: 1.02, rotateY: 3 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{
              width: '100%',
              aspectRatio: '4/3',
              background: 'linear-gradient(135deg, var(--bg-secondary), var(--card-bg))',
              borderRadius: 20,
              border: '1px solid var(--border)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {img(bike.image) ? (
              <img src={img(bike.image)} alt={bike.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text)', opacity: 0.4 }}>
                <div style={{ fontSize: '3rem', marginBottom: 8 }}>🏍️</div>
                <div style={{ fontSize: '0.85rem' }}>{bike.name}</div>
              </div>
            )}
          </motion.div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.7, textAlign: 'center', maxWidth: 360 }}>{bike.story}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="outline" onClick={() => document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' })}>View Gallery</Button>
            <Button variant="outline" onClick={() => document.getElementById('vlogs').scrollIntoView({ behavior: 'smooth' })}>Watch Vlogs</Button>
          </div>
        </div>

        {/* Right — Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Total KM Ridden', value: bike.odometer.toLocaleString('en-IN'), unit: 'KM', icon: '🛣️' },
            { label: 'Average Mileage', value: '28.4', unit: 'KM/L', icon: '⛽' },
            { label: 'Longest Ride', value: '620', unit: 'KM', icon: '🏆' },
            { label: 'Rides Completed', value: '47', unit: '', icon: '🏁' },
            { label: 'Accessories', value: '15', unit: 'Installed', icon: '🔧' },
            { label: 'Total Investment', value: bike.totalInvestment, unit: '', icon: '💰' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '0.68rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '1rem' }}>
                  {s.value} <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text)' }}>{s.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tabContent[activeTab]}
        </motion.div>
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) { .bike-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── Section 03: Specifications ─────────────────────────────────────────────
function SpecificationsSection() {
  const [activeTab, setActiveTab] = useState('Overview')
  const tabs = ['Overview', 'Performance', 'Dimensions', 'Technology', 'Comfort']
  const specData = { Overview: bike.specs.overview, Performance: bike.specs.performance, Dimensions: bike.specs.dimensions, Technology: bike.specs.technology, Comfort: bike.specs.comfort }

  return (
    <section id="specifications" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 03" title="Specifications" />
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 40 }}>
            {(specData[activeTab] || []).map((s, i) => <SpecCard key={i} {...s} />)}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Factory vs Current vs Future */}
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', marginBottom: 20 }}>Configuration Comparison</h3>
        <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { title: 'Factory Configuration', icon: '🏭', data: bike.comparison.factory, color: 'var(--text)' },
            { title: 'Current Configuration', icon: '✅', data: bike.comparison.current, color: '#22c55e' },
            { title: 'Future Setup', icon: '🔮', data: bike.comparison.future, color: 'var(--accent)' },
          ].map(({ title, icon, data, color }) => (
            <div key={title} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ fontWeight: 700, color, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{icon}</span>{title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.map(({ field, value }) => (
                  <div key={field} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text)', opacity: 0.7 }}>{field}</span>
                    <span style={{ color: 'var(--text-h)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) { .compare-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── Section 04: What's On My Bike ──────────────────────────────────────────
function MySetupSection() {
  const categories = ['All', 'Navigation', 'Camera', 'Safety', 'Protection', 'Touring', 'Communication']
  const [active, setActive] = useState('All')

  const filtered = active === 'All' ? accessories : accessories.filter(a => a.category === active)

  return (
    <section id="my-setup" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 04" title="What's On My Bike?" />
      <TabBar tabs={categories} active={active} onChange={setActive} />

      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.map((acc, i) => (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 20,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                whileHover={{ scale: 1.01 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 52, height: 52,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0,
                  }}>
                    {acc.category === 'Navigation' ? '🗺️' : acc.category === 'Camera' ? '📷' : acc.category === 'Safety' ? '🛡️' : acc.category === 'Protection' ? '🦺' : acc.category === 'Touring' ? '🧳' : acc.category === 'Communication' ? '🎧' : '🔧'}
                  </div>
                  <span style={{
                    fontSize: '0.72rem', padding: '4px 10px', borderRadius: 999,
                    background: 'var(--accent-bg)', color: 'var(--accent)',
                    border: '1px solid var(--accent)', fontWeight: 600,
                  }}>{acc.category}</span>
                </div>

                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>{acc.name}</h4>
                <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text)', opacity: 0.7 }}>{acc.subtitle}</p>
                <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: 'var(--text)', lineHeight: 1.6 }}>{acc.reason}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text)', opacity: 0.6 }}>📅 {acc.purchaseDate}</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{acc.price.toLocaleString('en-IN')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Summary */}
      <div style={{ marginTop: 32, padding: 24, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {[
          { label: 'Total Accessories', value: accessories.length },
          { label: 'Total Setup Cost', value: `₹${accessories.reduce((s, a) => s + a.price, 0).toLocaleString('en-IN')}` },
          { label: 'Favorite', value: 'Chigee AIO-6' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: '0.72rem', opacity: 0.5, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '1.1rem' }}>{value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Section 05: Recommended Accessories ───────────────────────────────────
function RecommendedSection() {
  const [activeSection, setActiveSection] = useState('favorites')
  const scrollRef = useRef(null)
  const sections = [
    { id: 'favorites', label: 'My Favorites' },
    { id: 'budget', label: 'Budget Picks' },
    { id: 'premium', label: 'Premium Picks' },
  ]

  const filtered = recommendedAccessories.filter(a => a.section === activeSection)

  const scrollBy = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  return (
    <section id="recommended" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 05" title="Recommended Accessories" />

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: activeSection === s.id ? 'var(--accent)' : 'var(--card-bg)',
            color: activeSection === s.id ? '#fff' : 'var(--text)',
            fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.85rem',
            transition: 'all 0.2s',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        {/* Scroll arrows — hidden on mobile */}
        <button className="scroll-arrow" onClick={() => scrollBy(-1)} style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 40, height: 40, borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-h)' }}>‹</button>
        <button className="scroll-arrow" onClick={() => scrollBy(1)} style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 40, height: 40, borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-h)' }}>›</button>

        <div ref={scrollRef} style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
          {filtered.map((acc) => (
            <div key={acc.id} style={{
              minWidth: 260, maxWidth: 260,
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: 20,
              flexShrink: 0,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {acc.badge && (
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'var(--accent)', color: '#fff', alignSelf: 'flex-start' }}>
                  {acc.badge}
                </span>
              )}
              <div style={{
                height: 160, background: 'var(--bg-secondary)', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', border: '1px solid var(--border)',
              }}>
                {acc.category === 'Navigation' ? '🗺️' : acc.category === 'Camera' ? '📷' : '🔧'}
              </div>

              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>{acc.name}</h4>
                <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--text)', opacity: 0.6 }}>{acc.subtitle}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {acc.features.map(f => (
                    <div key={f} style={{ fontSize: '0.78rem', color: 'var(--text)', display: 'flex', gap: 6 }}>
                      <span style={{ color: 'var(--accent)' }}>✓</span>{f}
                    </div>
                  ))}
                </div>
              </div>

              <StarRating value={acc.rating} />

              {/* Coupon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text)', opacity: 0.7 }}>Code:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>{acc.coupon}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#22c55e', fontWeight: 600 }}>{acc.discount}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: '1.1rem' }}>₹{acc.price.toLocaleString('en-IN')}</span>
                  <span style={{ marginLeft: 6, fontSize: '0.8rem', color: 'var(--text)', opacity: 0.5, textDecoration: 'line-through' }}>₹{acc.originalPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <Button variant="primary" href={acc.buyUrl}>Buy Now ↗</Button>
              {acc.accessoryId && (
                <Link to={`/garage/accessories/${acc.accessoryId}`} style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none' }}>
                  Read My Review →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .scroll-arrow { display: none !important; } }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  )
}

// ─── Section 07: Vlogs & Ride Videos ───────────────────────────────────────
function VlogsSection() {
  const [activeCategory, setActiveCategory] = useState('Latest')
  const [playing, setPlaying] = useState(null)
  const categories = ['Latest', 'Popular', 'Shorts', 'Ride Stories', 'Setup']
  const categoryCounts = categories.reduce((acc, c) => ({ ...acc, [c]: vlogs.filter(v => v.category === c).length }), {})

  const filtered = vlogs.filter(v => v.category === activeCategory)

  return (
    <section id="vlogs" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 07" title="Vlogs & Ride Videos" />

      <div className="vlogs-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 32, alignItems: 'start' }}>
        {/* Main */}
        <div>
          <TabBar tabs={categories} active={activeCategory} onChange={setActiveCategory} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div
                  onClick={() => setPlaying(v)}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 14, overflow: 'hidden',
                    cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#1a1a2e', overflow: 'hidden' }}>
                    <img
                      src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                      alt={v.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <span style={{ fontSize: '2.5rem' }}>▶</span>
                    </div>
                    <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4 }}>{v.duration}</span>
                  </div>

                  <div style={{ padding: '14px 16px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.3 }}>{v.title}</h4>
                    {v.subtitle && <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: 'var(--text)', opacity: 0.6 }}>{v.subtitle}</p>}
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text)', opacity: 0.7, flexWrap: 'wrap' }}>
                      {v.distance && <span>📍 {v.distance}</span>}
                      <span>👁 {v.views >= 1000 ? `${(v.views / 1000).toFixed(1)}K` : v.views}</span>
                      <span>📅 {v.date}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-h)', marginBottom: 12, fontSize: '0.9rem' }}>VLOGS & RIDE VIDEOS</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: 16 }}>Stories from the road. Raw moments, long rides and epic memories.</p>
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)} style={{
                display: 'flex', justifyContent: 'space-between', width: '100%',
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeCategory === c ? 'var(--accent-bg)' : 'transparent',
                color: activeCategory === c ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'var(--sans)', fontWeight: activeCategory === c ? 600 : 400, fontSize: '0.85rem',
                marginBottom: 2,
              }}>
                <span>{c}</span>
                <span style={{ background: 'var(--bg-secondary)', borderRadius: 999, padding: '2px 8px', fontSize: '0.72rem' }}>{categoryCounts[c]}</span>
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 14, fontSize: '0.85rem' }}>RIDE STATS</div>
            {[
              ['Total Videos', vlogs.length],
              ['Total Views', '28.4K'],
              ['Total Watch Time', '542 Hours'],
              ['KM Covered', '12,547+'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>{k}</span>
                <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          <Button variant="primary" href={cfg.social.youtube?.href || '#'}>
            Subscribe on YouTube
          </Button>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlaying(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, background: '#000', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
              <button onClick={() => setPlaying(null)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 1, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem' }}>✕</button>
              <div style={{ aspectRatio: '16/9' }}>
                <iframe
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${playing.id}?autoplay=1`}
                  title={playing.title}
                  frameBorder="0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  style={{ display: 'block' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) { .vlogs-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── Section 08: Ride Map ───────────────────────────────────────────────────
function RideMapSection() {
  const [mode, setMode] = useState('completed')
  const filtered = routes.filter(r => r.mode === mode)
  const modeColors = { completed: '#22c55e', planned: '#f59e0b', dream: '#a78bfa' }

  return (
    <section id="ride-map" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 08" title="Ride Map & Journeys" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[{ id: 'completed', label: '✅ Completed' }, { id: 'planned', label: '📋 Planned' }, { id: 'dream', label: '💜 Dream' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '8px 18px', borderRadius: 999, cursor: 'pointer',
            border: `1px solid ${mode === m.id ? modeColors[m.id] : 'var(--border)'}`,
            background: mode === m.id ? `${modeColors[m.id]}20` : 'transparent',
            color: mode === m.id ? modeColors[m.id] : 'var(--text)',
            fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.83rem',
            transition: 'all 0.2s',
          }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Map placeholder — real react-simple-maps integration */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {[['Total KM Ridden', '12,547+'], ['Trips Completed', '24'], ['States Explored', '3'], ['Total Hours', '342h']].map(([k, v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: '1.3rem' }}>{v}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text)', opacity: 0.6 }}>{k}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 320, background: 'linear-gradient(135deg, #0f0f1a, #1a1025)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🗺️</div>
            <div style={{ fontSize: '0.9rem' }}>Interactive India Ride Map</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.7, marginTop: 4 }}>Showing {filtered.length} {mode} route{filtered.length !== 1 ? 's' : ''}</div>
          </div>
          {/* Route dots overlay */}
          {filtered.map((r, i) => (
            <div key={r.id} style={{
              position: 'absolute',
              left: `${20 + i * 18}%`, top: `${25 + (i % 3) * 22}%`,
              width: 10, height: 10, borderRadius: '50%',
              background: modeColors[mode],
              boxShadow: `0 0 12px ${modeColors[mode]}`,
              cursor: 'pointer',
            }} title={r.name} />
          ))}
        </div>
      </div>

      {/* Route cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map((r) => (
          <div key={r.id} style={{ background: 'var(--card-bg)', border: `1px solid ${modeColors[r.mode]}40`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h)' }}>{r.name}</h4>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: `${modeColors[r.mode]}20`, color: modeColors[r.mode], textTransform: 'uppercase' }}>{r.mode}</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--text)', opacity: 0.7, lineHeight: 1.5 }}>{r.description}</p>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem' }}>
              <span>📍 {r.distance}</span>
              <span>⏱️ {r.time}</span>
              {r.date !== 'Future' && <span>📅 {r.date}</span>}
              {r.rating && <span>⭐ {r.rating}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Section 09: Dream Garage ───────────────────────────────────────────────
function DreamGarageSection() {
  const statusColors = { completed: '#22c55e', active: 'var(--accent)', planned: '#f59e0b', future: 'var(--border)' }

  return (
    <section id="dream-garage" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 09" title="Dream Garage" />

      {/* Phase Roadmap */}
      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-h)', marginBottom: 24 }}>Dream Build Roadmap</h3>
      <div className="phases-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }}>
        {dreamGarage.phases.map((phase, i) => {
          const color = statusColors[phase.status]
          return (
            <motion.div key={phase.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{
                background: 'var(--card-bg)',
                border: `1px solid ${phase.status === 'completed' ? '#22c55e40' : phase.status === 'active' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 16, padding: 20,
                position: 'relative',
                boxShadow: phase.status === 'active' ? '0 0 20px var(--accent)30' : 'none',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{phase.label}</span>
                <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 999, background: `${color}20`, color, fontWeight: 600 }}>
                  {phase.status === 'completed' ? '✅ Done' : phase.status === 'active' ? '🔵 Active' : phase.status === 'planned' ? '📋 Planned' : '🔮 Future'}
                </span>
              </div>
              <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>{phase.title}</h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {phase.items.map(item => (
                  <li key={item} style={{ fontSize: '0.8rem', color: 'var(--text)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color, flexShrink: 0, marginTop: 1 }}>{phase.status === 'completed' ? '✓' : '○'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </div>

      {/* Dream Bikes */}
      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-h)', marginBottom: 20 }}>Motorcycles I Dream To Own</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {dreamGarage.dreamBikes.map((b, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ height: 120, background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', border: '1px solid var(--border)' }}>🏍️</div>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-h)' }}>{b.name}</h4>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>{b.price}</div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', opacity: 0.7, lineHeight: 1.5 }}>{b.reason}</p>
          </motion.div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) { .phases-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 580px) { .phases-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── Section 10: Wishlist ───────────────────────────────────────────────────
function WishlistSection() {
  const categories = ['All', 'Touring', 'Safety', 'Comfort', 'Protection', 'Communication', 'Future Bike', 'Experience']
  const [active, setActive] = useState('All')
  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

  const filtered = active === 'All' ? wishlist : wishlist.filter(w => w.category === active)

  const thisMonth = wishlist.filter(w => w.targetMonth === '2026-07' || w.targetMonth === '2026-06')
  const nextMonth = wishlist.filter(w => w.targetMonth === '2026-08')
  const later = wishlist.filter(w => !['2026-06', '2026-07', '2026-08'].includes(w.targetMonth))

  return (
    <section id="wishlist" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 10" title="Wishlist" />
      <TabBar tabs={categories} active={active} onChange={setActive} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 40 }}>
        {filtered.map((w, i) => (
          <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            style={{ background: 'var(--card-bg)', border: `1px solid ${priorityColors[w.priority]}30`, borderLeft: `3px solid ${priorityColors[w.priority]}`, borderRadius: '0 12px 12px 0', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.3 }}>{w.name}</h4>
              <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 999, background: `${priorityColors[w.priority]}20`, color: priorityColors[w.priority], fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                {w.priority.toUpperCase()}
              </span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text)', opacity: 0.7, lineHeight: 1.5 }}>{w.reason}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text)', opacity: 0.6 }}>📅 {w.targetMonth}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{w.price >= 100000 ? `${(w.price / 100000).toFixed(1)}L` : w.price.toLocaleString('en-IN')}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Planning Timeline */}
      <h3 style={{ fontSize: '1.05rem', color: 'var(--text-h)', marginBottom: 18 }}>Planning Timeline</h3>
      <div className="timeline-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {[{ label: 'This Month', items: thisMonth, color: '#22c55e' }, { label: 'Next Month', items: nextMonth, color: '#f59e0b' }, { label: 'Later', items: later, color: 'var(--text)' }].map(group => (
          <div key={group.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontWeight: 700, color: group.color, marginBottom: 12, fontSize: '0.88rem' }}>{group.label}</div>
            {group.items.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.5 }}>Nothing planned yet.</p>
            ) : (
              group.items.map(w => (
                <div key={w.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                  <div style={{ color: 'var(--text-h)', fontWeight: 500 }}>{w.name}</div>
                  <div style={{ color: 'var(--text)', opacity: 0.6, marginTop: 2 }}>₹{w.price >= 100000 ? `${(w.price / 100000).toFixed(1)}L` : w.price.toLocaleString('en-IN')}</div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) { .timeline-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── Section 11: Ride Stats ─────────────────────────────────────────────────
function RideStatsSection() {
  const [period, setPeriod] = useState('Monthly')

  // SVG donut
  const total = rideStats.rideTypes.reduce((s, r) => s + r.percent, 0)
  let offset = 0
  const cx = 60, cy = 60, r = 50, circumference = 2 * Math.PI * r
  const segments = rideStats.rideTypes.map(rt => {
    const dash = (rt.percent / total) * circumference
    const seg = { ...rt, dash, offset }
    offset += dash
    return seg
  })

  const chartData = rideStats.monthlyData.map(d => ({ label: d.month, value: d.km }))

  return (
    <section id="ride-stats" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 11" title="Ride Stats" />

      {/* Summary cards */}
      <div className="stats-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 36 }}>
        {[
          { label: 'Total Rides', value: rideStats.summary.totalRides, icon: '🏍️' },
          { label: 'Total Distance', value: rideStats.summary.totalDistance.toLocaleString('en-IN') + ' km', icon: '📍' },
          { label: 'Riding Time', value: rideStats.summary.rideHours + 'h', icon: '⏱️' },
          { label: 'Avg Mileage', value: rideStats.summary.avgMileage + ' km/l', icon: '⛽' },
          { label: 'Top Speed', value: rideStats.summary.topSpeed + ' km/h', icon: '🚀' },
          { label: 'Avg Speed', value: rideStats.summary.avgSpeed + ' km/h', icon: '📊' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: '1.15rem' }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text)', opacity: 0.6, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 28, marginBottom: 36, alignItems: 'start' }}>
        {/* Bar chart */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h)' }}>Distance Over Time</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Monthly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ padding: '4px 12px', borderRadius: 999, border: period === p ? '1px solid var(--accent)' : '1px solid var(--border)', background: period === p ? 'var(--accent-bg)' : 'transparent', color: period === p ? 'var(--accent)' : 'var(--text)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--sans)' }}>{p}</button>
              ))}
            </div>
          </div>
          <CSSBarChart data={chartData} color="var(--accent)" maxHeight={120} />
        </div>

        {/* Donut chart */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, minWidth: 220 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h)' }}>Ride Breakdown</h3>
          <svg width={120} height={120} viewBox="0 0 120 120" style={{ display: 'block', margin: '0 auto 16px' }}>
            {segments.map((seg, i) => (
              <circle key={i} cx={cx} cy={cy} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={16}
                strokeDasharray={`${seg.dash} ${circumference}`}
                strokeDashoffset={-seg.offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            ))}
          </svg>
          {rideStats.rideTypes.map((rt, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: rt.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text)' }}>{rt.type}</span>
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{rt.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent rides table */}
      <h3 style={{ fontSize: '1rem', color: 'var(--text-h)', marginBottom: 16 }}>Recent Rides</h3>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Date', 'Route', 'Distance', 'Time', 'Avg Speed', 'Mileage', 'Type'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text)', opacity: 0.6, fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rideStats.recentRides.map((ride, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: '0.83rem', color: 'var(--text)' }}>{ride.date}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.83rem', color: 'var(--text-h)', fontWeight: 500 }}>{ride.route}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.83rem', color: 'var(--text)' }}>{ride.km} km</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.83rem', color: 'var(--text)' }}>{ride.time}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.83rem', color: 'var(--text)' }}>{ride.avgSpeed}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.83rem', color: 'var(--text)' }}>{ride.mileage}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 999, background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600 }}>{ride.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── Section 12: Cost Tracker ───────────────────────────────────────────────
function CostTrackerSection() {
  const total = costTracker.categories.reduce((s, c) => s + c.amount, 0)

  return (
    <section id="cost-tracker" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 12" title="Cost Tracker" />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 36 }}>
        {[
          { label: 'Total Investment', value: `₹${costTracker.summary.totalCost.toLocaleString('en-IN')}`, icon: '💰' },
          { label: 'Monthly Avg', value: `₹${costTracker.summary.monthlyCost.toLocaleString('en-IN')}`, icon: '📅' },
          { label: 'Cost per KM', value: `₹${costTracker.summary.costPerKm}`, icon: '🛣️' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: '1.2rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.6 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category bars */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h)' }}>Spending Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {costTracker.categories.map((c, i) => {
            const pct = (c.amount / total) * 100
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-h)', fontWeight: 500 }}>{c.icon} {c.name}</span>
                  <span style={{ color: 'var(--text)', opacity: 0.8 }}>₹{c.amount.toLocaleString('en-IN')} <span style={{ opacity: 0.5 }}>({pct.toFixed(0)}%)</span></span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 999, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                    style={{ height: '100%', background: c.color, borderRadius: 999 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent expenses */}
      <h3 style={{ fontSize: '1rem', color: 'var(--text-h)', marginBottom: 16 }}>Recent Expenses</h3>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Date', 'Item', 'Category', 'Amount'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text)', opacity: 0.6, fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {costTracker.recentExpenses.map((e, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '11px 16px', fontSize: '0.82rem', color: 'var(--text)', opacity: 0.7 }}>{e.date}</td>
                <td style={{ padding: '11px 16px', fontSize: '0.82rem', color: 'var(--text-h)', fontWeight: 500 }}>{e.item}</td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 999, background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border)' }}>{e.category}</span>
                </td>
                <td style={{ padding: '11px 16px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent)' }}>₹{e.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ─── Section 13: Maintenance ────────────────────────────────────────────────
function MaintenanceSection() {
  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

  return (
    <section id="maintenance" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 13" title="Maintenance" />

      <h3 style={{ fontSize: '1.05rem', color: 'var(--text-h)', marginBottom: 16 }}>Upcoming Maintenance</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 40 }}>
        {maintenance.upcoming.map((item, i) => {
          const isDue = item.dueKm !== undefined
          const pct = isDue ? Math.min((item.currentKm / item.dueKm) * 100, 100) : null
          const daysUntil = item.dueDate ? Math.ceil((new Date(item.dueDate) - new Date('2026-06-02')) / (1000 * 60 * 60 * 24)) : null

          return (
            <div key={i} style={{
              background: 'var(--card-bg)',
              border: `1px solid var(--border)`,
              borderLeft: `4px solid ${priorityColors[item.priority]}`,
              borderRadius: '0 14px 14px 0',
              padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{item.icon}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '0.9rem' }}>{item.type}</span>
                </div>
                <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 999, background: `${priorityColors[item.priority]}20`, color: priorityColors[item.priority], fontWeight: 700 }}>
                  {item.priority.toUpperCase()}
                </span>
              </div>

              {isDue && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text)', marginBottom: 6 }}>
                    <span>Current: {item.currentKm.toLocaleString('en-IN')} KM</span>
                    <span>Due at: {item.dueKm.toLocaleString('en-IN')} KM</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : 'var(--accent)', borderRadius: 999, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text)', opacity: 0.6, marginTop: 4 }}>{(item.dueKm - item.currentKm).toLocaleString('en-IN')} KM remaining</div>
                </>
              )}

              {daysUntil !== null && (
                <div style={{ fontSize: '0.85rem', color: daysUntil < 30 ? '#ef4444' : 'var(--text)' }}>
                  Due: {item.dueDate} — <span style={{ fontWeight: 700 }}>{daysUntil} days remaining</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Service history */}
      <h3 style={{ fontSize: '1.05rem', color: 'var(--text-h)', marginBottom: 16 }}>Service History</h3>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Date', 'Odometer', 'Work Done', 'Cost', 'Shop'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text)', opacity: 0.6, fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {maintenance.history.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text)' }}>{h.date}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-h)', fontWeight: 600 }}>{h.km.toLocaleString('en-IN')} KM</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text)' }}>{h.work}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent)' }}>{h.cost === 0 ? 'Free' : `₹${h.cost.toLocaleString('en-IN')}`}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text)', opacity: 0.7 }}>{h.shop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// ─── Section 14: Gallery ────────────────────────────────────────────────────
function GallerySection() {
  const [activeSection, setActiveSection] = useState('photos')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const currentSection = garageGallery.sections.find(s => s.id === activeSection)
  const slides = (currentSection?.images || []).map(im => ({ src: img(im.src) || 'https://picsum.photos/seed/' + im.src + '/800/600' }))

  const openLightbox = (i) => { setLightboxIndex(i); setLightboxOpen(true) }

  return (
    <section id="gallery" style={{ padding: 'clamp(50px, 6vw, 80px) 0' }}>
      <SectionHeading label="Section 14" title="Gallery" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {garageGallery.sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '7px 18px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
            border: activeSection === s.id ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: activeSection === s.id ? 'var(--accent-bg)' : 'transparent',
            color: activeSection === s.id ? 'var(--accent)' : 'var(--text)',
            fontSize: '0.82rem', fontWeight: activeSection === s.id ? 600 : 400,
            fontFamily: 'var(--sans)', transition: 'all 0.2s',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {(currentSection?.images || []).map((im, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            onClick={() => openLightbox(i)}
            style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <img
              src={img(im.src) || `https://picsum.photos/seed/${i + activeSection}/400/300`}
              alt={im.location}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.src = `https://picsum.photos/seed/${i + activeSection}/400/300` }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
              opacity: 0, transition: 'opacity 0.25s',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '14px 12px',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{im.location}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{im.date} · {im.story}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={slides} index={lightboxIndex} />
    </section>
  )
}

// ─── Section 15: Connect ────────────────────────────────────────────────────
function ConnectSection() {
  const socials = [
    { platform: 'Instagram', icon: '📸', handle: cfg.social.instagram?.handle || '@sivashanmugavadivelv', href: cfg.social.instagram?.href || '#', color: '#e1306c', desc: 'Ride photos & daily moments' },
    { platform: 'YouTube', icon: '▶', handle: cfg.social.youtube?.handle || 'SIVA SHANMUGA VADIVEL', href: cfg.social.youtube?.href || '#', color: '#ff0000', desc: 'Vlogs, ride videos & reviews' },
    { platform: 'Blog', icon: '✍️', handle: 'Read Stories', href: '/blog', color: 'var(--accent)', desc: 'Ride stories & gear guides' },
    { platform: 'Email', icon: '✉️', handle: cfg.contact?.email || 'Get in touch', href: '/contact', color: '#22c55e', desc: 'Collabs & ride buddies welcome' },
  ]

  return (
    <section id="connect" style={{ padding: 'clamp(50px, 6vw, 80px) 0', paddingBottom: 'clamp(60px, 8vw, 100px)' }}>
      <SectionHeading label="Section 15" title="Connect" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 56 }}>
        {socials.map((s, i) => (
          <motion.a
            key={i}
            href={s.href}
            target={s.href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: '24px 20px',
              textDecoration: 'none',
              display: 'flex', flexDirection: 'column', gap: 10,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: '2rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '1rem' }}>{s.platform}</div>
              <div style={{ fontSize: '0.8rem', color: s.color, fontWeight: 500, marginTop: 2 }}>{s.handle}</div>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)', opacity: 0.7, lineHeight: 1.5 }}>{s.desc}</p>
          </motion.a>
        ))}
      </div>

      {/* Closing message */}
      <div style={{ textAlign: 'center', padding: '40px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--text-h)', marginBottom: 12 }}>
          Thanks for visiting my garage.
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text)', opacity: 0.7, maxWidth: 400, margin: '0 auto 8px' }}>
          See you on the next ride. 🏍️
        </p>
        <div style={{ width: 60, height: 3, background: 'var(--accent)', borderRadius: 999, margin: '20px auto 0' }} />
      </div>
    </section>
  )
}

// ─── View toggle strip ───────────────────────────────────────────────────────
function ViewToggle() {
  return (
    <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', gap: 2, background: 'var(--card-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', padding: '6px', borderRadius: 999 }} className="view-toggle">
      <div style={{ padding: '7px 20px', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'var(--sans)', background: 'var(--accent)', color: '#fff', borderRadius: 999, whiteSpace: 'nowrap' }}>
        Standard View
      </div>
      <Link to="/garage/premium" style={{ padding: '7px 18px', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'var(--sans)', color: 'var(--text)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
        Premium ✦
      </Link>
      <Link to="/garage/v3" style={{ padding: '7px 18px', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'var(--sans)', color: 'var(--text)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
        V3 ✦
      </Link>
      <style>{`@media (max-width: 480px) { .view-toggle { display: none !important; } }`}</style>
    </div>
  )
}

// ─── Main Garage Page ────────────────────────────────────────────────────────
export default function Garage() {
  return (
    <div style={{ padding: '0 clamp(16px, 4vw, 48px)' }}>
      <ViewToggle />
      <HeroSection />
      <MyBikeSection />
      <SpecificationsSection />
      <MySetupSection />
      <RecommendedSection />
      <VlogsSection />
      <RideMapSection />
      <DreamGarageSection />
      <WishlistSection />
      <RideStatsSection />
      <CostTrackerSection />
      <MaintenanceSection />
      <GallerySection />
      <ConnectSection />
    </div>
  )
}
