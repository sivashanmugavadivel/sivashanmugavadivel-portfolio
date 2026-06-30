import { useState, useEffect } from 'react'

const sections = [
  { id: 'garage-hero', label: 'The Garage' },
  { id: 'my-bike', label: 'My Bike' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'my-setup', label: 'My Setup' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'vlogs', label: 'Vlogs & Videos' },
  { id: 'ride-map', label: 'Ride Map' },
  { id: 'dream-garage', label: 'Dream Garage' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'ride-stats', label: 'Ride Stats' },
  { id: 'cost-tracker', label: 'Cost Tracker' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'connect', label: 'Connect' },
]

export default function GarageSidebar() {
  const [active, setActive] = useState('garage-hero')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <nav style={{
        width: 220,
        flexShrink: 0,
        position: 'sticky',
        top: 80,
        height: 'fit-content',
        padding: '8px 0',
      }}>
        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text)', opacity: 0.45, marginBottom: 12, paddingLeft: 12 }}>
          BIKE SECTIONS
        </div>
        {sections.map(({ id, label }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '9px 12px',
                background: isActive ? 'var(--accent-bg)' : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                color: isActive ? 'var(--accent)' : 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 400,
                fontFamily: 'var(--sans)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-h)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)' } }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: isActive ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.2s',
              }} />
              {label}
            </button>
          )
        })}
      </nav>
      <style>{`
        @media (max-width: 900px) {
          .garage-sidebar { display: none !important; }
        }
      `}</style>
    </>
  )
}
