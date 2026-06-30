import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Button from '../components/ui/Button'
import { accessoryDetails, accessories, recommendedAccessories } from '../data/garage'

const BASE = import.meta.env.BASE_URL
const img = (path) => path ? `${BASE}${path}` : null

function StarRating({ value, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', gap: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ color: i < Math.round(value) ? '#fbbf24' : 'var(--border)', fontSize: '1rem' }}>★</span>
        ))}
      </span>
      <span style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '1rem' }}>{value}</span>
      {count && <span style={{ fontSize: '0.85rem', color: 'var(--text)', opacity: 0.6 }}>({count} Reviews)</span>}
    </div>
  )
}

export default function GarageAccessoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const detail = accessoryDetails[id]
  const [activeTab, setActiveTab] = useState('Overview')
  const [copied, setCopied] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (!detail) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 80 }}>
        <div style={{ fontSize: '3rem' }}>🔧</div>
        <h2 style={{ color: 'var(--text-h)', margin: 0 }}>Accessory Not Found</h2>
        <p style={{ color: 'var(--text)', opacity: 0.7 }}>The accessory "{id}" doesn't exist yet.</p>
        <Button variant="primary" to="/garage">← Back to Garage</Button>
      </div>
    )
  }

  const tabs = ['Overview', 'Features', 'Installation', 'Gallery', 'FAQ']

  const copyCoupon = () => {
    navigator.clipboard.writeText(detail.coupon).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const gallerySlides = (detail.gallery || []).map((g, i) => ({
    src: img(g) || `https://picsum.photos/seed/${id}-${i}/800/600`
  }))

  const related = (detail.relatedIds || [])
    .map(rid => accessories.find(a => a.id === rid) || recommendedAccessories.find(a => a.accessoryId === rid))
    .filter(Boolean)

  const tabContent = {
    Overview: (
      <div>
        <div className="overview-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 12 }}>Why I Use {detail.name}?</h3>
            <p style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '0.9rem' }}>{detail.overview}</p>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-bg)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>S</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '0.9rem' }}>Siva Shanmugavadivel</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text)', opacity: 0.6 }}>RIDER · EXPLORER · STORYTELLER</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
            {detail.videoId ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', cursor: 'pointer' }}
                onClick={() => window.open(`https://youtube.com/watch?v=${detail.videoId}`, '_blank')}
              >
                <img src={`https://img.youtube.com/vi/${detail.videoId}/mqdefault.jpg`} alt="Video thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', gap: 8 }}>
                  <span style={{ fontSize: '2.5rem' }}>▶</span>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>See it in action on my bike</span>
                </div>
              </div>
            ) : (
              <span style={{ fontSize: '3rem', opacity: 0.4 }}>▶</span>
            )}
          </div>
        </div>

        {/* Highlights */}
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-h)', marginBottom: 14 }}>Key Highlights</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {(detail.highlights || []).map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    Features: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(detail.features || []).map((f, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-bg)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)', flexShrink: 0, fontSize: '0.85rem' }}>{i + 1}</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-h)', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    ),

    Installation: (
      <div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
          <div style={{ padding: '14px 20px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Time</div>
            <div style={{ fontWeight: 700, color: 'var(--text-h)' }}>{detail.installation?.time}</div>
          </div>
          <div style={{ padding: '14px 20px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Difficulty</div>
            <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{detail.installation?.difficulty}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(detail.installation?.steps || []).map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ paddingTop: 6, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6 }}>{step}</div>
            </div>
          ))}
        </div>
        {detail.rideExperience && (
          <div style={{ marginTop: 32, padding: 24, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)' }}>Ride Experience</h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.8 }}>{detail.rideExperience}</p>
          </div>
        )}
        <div className="pros-cons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 28 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid #22c55e40', borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 12 }}>✅ Pros</div>
            {(detail.pros || []).map((p, i) => <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text)', display: 'flex', gap: 8, marginBottom: 8 }}><span style={{ color: '#22c55e' }}>+</span>{p}</div>)}
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid #ef444440', borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>⚠️ Cons</div>
            {(detail.cons || []).map((c, i) => <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text)', display: 'flex', gap: 8, marginBottom: 8 }}><span style={{ color: '#ef4444' }}>−</span>{c}</div>)}
          </div>
        </div>
        <style>{`@media (max-width: 580px) { .pros-cons { grid-template-columns: 1fr !important; } }`}</style>
      </div>
    ),

    Gallery: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {(detail.gallery || []).map((g, i) => (
          <motion.div key={i} whileHover={{ scale: 1.02 }} onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}
            style={{ aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <img src={img(g) || `https://picsum.photos/seed/${id}-${i}/400/300`} alt={`${detail.name} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = `https://picsum.photos/seed/${id}-${i}/400/300` }} />
          </motion.div>
        ))}
      </div>
    ),

    FAQ: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(detail.faq || []).map((f, i) => (
          <FAQItem key={i} q={f.q} a={f.a} />
        ))}
      </div>
    ),
  }

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ padding: '16px clamp(20px, 5vw, 60px)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text)', opacity: 0.7, borderBottom: '1px solid var(--border)' }}>
        <Link to="/garage" style={{ color: 'var(--text)', textDecoration: 'none' }}>Bike</Link>
        <span>›</span>
        <Link to="/garage" onClick={() => setTimeout(() => document.getElementById('recommended')?.scrollIntoView({ behavior: 'smooth' }), 100)} style={{ color: 'var(--text)', textDecoration: 'none' }}>Recommended Accessories</Link>
        <span>›</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{detail.name}</span>
      </div>

      <div style={{ padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 60px)' }}>
        <div className="detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>

          {/* Left — main content */}
          <div>
            {/* Hero */}
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 28, background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <div style={{ aspectRatio: '16/9' }}>
                <img src={img(detail.gallery?.[0]) || `https://picsum.photos/seed/${id}/900/506`} alt={detail.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = `https://picsum.photos/seed/${id}/900/506` }} />
              </div>
              {detail.badge && (
                <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--accent)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: 999 }}>{detail.badge} ⭐</div>
              )}
            </div>

            {/* Gallery thumbnails */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, overflowX: 'auto' }}>
              {(detail.gallery || []).map((g, i) => (
                <div key={i} onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }} style={{ width: 70, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', border: '2px solid var(--border)', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <img src={img(g) || `https://picsum.photos/seed/${id}-${i}/140/104`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = `https://picsum.photos/seed/${id}-${i}/140/104` }} />
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 28, overflowX: 'auto' }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'var(--sans)', fontWeight: activeTab === tab ? 700 : 400, fontSize: '0.88rem',
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text)',
                  borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                  transition: 'color 0.2s', whiteSpace: 'nowrap',
                }}>
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {tabContent[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right — sticky purchase card */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>TOP PICK ⭐</div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-h)', margin: '0 0 4px' }}>{detail.name}</h1>
              <p style={{ margin: '0 0 12px', color: 'var(--text)', opacity: 0.7, fontSize: '0.9rem' }}>{detail.subtitle}</p>
              <StarRating value={detail.rating} count={detail.reviewCount} />

              <div style={{ margin: '20px 0', display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-h)' }}>₹{detail.price.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '1rem', color: 'var(--text)', opacity: 0.5, textDecoration: 'line-through' }}>₹{detail.originalPrice.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#22c55e', background: '#22c55e20', padding: '3px 8px', borderRadius: 999 }}>{detail.discount}</span>
              </div>

              {/* Coupon */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--accent)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: '0.72rem', opacity: 0.6, marginBottom: 4 }}>Coupon Code</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em' }}>{detail.coupon}</span>
                  <button onClick={copyCoupon} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s' }}>
                    {copied ? '✓ Copied!' : 'COPY'}
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text)', opacity: 0.6, marginTop: 6 }}>Use this code at checkout to get extra {detail.discount}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[['🚚', 'Free Shipping', 'Delivery in 3-5 days'], ['🛡️', '1 Year Warranty', 'Official warranty included'], ['🔄', '7 Days Easy Returns', 'Hassle free return policy']].map(([icon, title, sub]) => (
                  <div key={title} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.82rem' }}>
                    <span style={{ fontSize: '1rem' }}>{icon}</span>
                    <div><span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{title}</span> <span style={{ color: 'var(--text)', opacity: 0.7 }}>— {sub}</span></div>
                  </div>
                ))}
              </div>

              <Button variant="primary" href={detail.buyUrl} style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
                Buy Now ↗
              </Button>
              {detail.amazonUrl && (
                <Button variant="outline" href={detail.amazonUrl} style={{ width: '100%', justifyContent: 'center' }}>
                  Buy on Amazon ↗
                </Button>
              )}

              {/* Compatibility */}
              {detail.compatibility && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-h)', marginBottom: 8 }}>COMPATIBLE WITH</div>
                  {detail.compatibility.map((c, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text)', opacity: 0.75, marginBottom: 4 }}>• {c}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related accessories */}
        {related.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--text-h)', marginBottom: 20 }}>Related Accessories</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {related.map((acc, i) => (
                <Link key={i} to={`/garage/accessories/${acc.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: 12, textAlign: 'center' }}>🔧</div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-h)' }}>{acc.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', opacity: 0.6 }}>{acc.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={gallerySlides} index={lightboxIndex} />

      <style>{`
        @media (max-width: 900px) {
          .detail-layout { grid-template-columns: 1fr !important; }
          .overview-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--sans)', fontWeight: 600, color: 'var(--text-h)', fontSize: '0.9rem', textAlign: 'left' }}>
        {q}
        <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', color: 'var(--accent)', flexShrink: 0 }}>▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 18px 16px', fontSize: '0.87rem', color: 'var(--text)', lineHeight: 1.7, borderTop: '1px solid var(--border)', paddingTop: 14 }}>{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
