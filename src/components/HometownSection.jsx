import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import cfg from '../data/config.json'

// ── TWEAK THESE to adjust image fit inside Kangayam boundary ──
const KGM_IMG_SCALE   = 1.8   // 1.0 = fit exactly, 1.5 = 50% larger, 0.8 = 80% size
const KGM_IMG_OFFSET_X = 0    // shift image left (-) or right (+) in SVG units
const KGM_IMG_OFFSET_Y = -35    // shift image up (-) or down (+) in SVG units
const KGM_IMG_OPACITY  = 0.55 // 0 = invisible, 1 = fully visible

/* Clipped image that tracks the path's bounding box as it moves */
function KgmClippedImage({ clipD, imgSrc }) {
  const pathRef = useRef(null)
  const [box, setBox] = useState(null)

  useEffect(() => {
    let raf
    const measure = () => {
      if (pathRef.current) {
        try {
          const b = pathRef.current.getBBox()
          if (b.width > 0) {
            setBox({ x: b.x, y: b.y, w: b.width, h: b.height })
          }
        } catch {}
      }
      raf = requestAnimationFrame(measure)
    }
    raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [clipD])

  return (
    <>
      <defs>
        <clipPath id="kgm-boundary-clip">
          <path d={clipD} />
        </clipPath>
      </defs>
      <path ref={pathRef} d={clipD} fill="none" stroke="none" />
      <g clipPath="url(#kgm-boundary-clip)">
        <image
          href={imgSrc}
          x={(box?.x ?? 0) + KGM_IMG_OFFSET_X - (box?.w ?? 800) * (KGM_IMG_SCALE - 1) / 2}
          y={(box?.y ?? 0) + KGM_IMG_OFFSET_Y - (box?.h ?? 600) * (KGM_IMG_SCALE - 1) / 2}
          width={(box?.w ?? 800) * KGM_IMG_SCALE}
          height={(box?.h ?? 600) * KGM_IMG_SCALE}
          preserveAspectRatio="xMidYMid meet"
          style={{ opacity: KGM_IMG_OPACITY }}
        />
      </g>
    </>
  )
}

/* Kangayam boundary with image fill */
function KangayamWithImage({ geo, opacity, imgSrc }) {
  // Extract only the real boundary path — the bounding rect sub-path
  // always has coordinates > 1000, the real boundary has small coords
  const clipD = (() => {
    if (!geo.svgPath) return null
    const subPaths = geo.svgPath.split(/(?=M)/).filter(Boolean)
    if (subPaths.length <= 1) return geo.svgPath
    // Find the sub-path where all numbers are reasonable (< 1000)
    for (const p of subPaths) {
      const nums = p.match(/-?\d+\.?\d*/g) || []
      const hasHuge = nums.some(n => Math.abs(parseFloat(n)) > 5000)
      if (!hasHuge) return p
    }
    return subPaths[0]
  })()

  return (
    <g opacity={opacity}>
      {clipD && (
        <KgmClippedImage clipD={clipD} imgSrc={imgSrc} />
      )}
      <Geography
        geography={geo}
        style={{
          default: {
            fill: clipD ? 'transparent' : 'var(--accent)',
            fillOpacity: clipD ? 0 : 0.2,
            stroke: 'var(--accent)',
            strokeWidth: 2.5,
            strokeOpacity: 1,
            filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.6))',
          },
          hover: {
            fill: clipD ? 'transparent' : 'var(--accent)',
            fillOpacity: clipD ? 0 : 0.25,
            stroke: 'var(--accent)',
            strokeWidth: 3,
            strokeOpacity: 1,
            filter: 'drop-shadow(0 0 12px rgba(167,139,250,0.8))',
          },
          pressed: { fill: 'transparent', stroke: 'var(--accent)' },
        }}
      />
    </g>
  )
}

const BASE = import.meta.env.BASE_URL
const ht   = cfg.hometown
const INDIA_GEO    = `${BASE}india_states.geojson`
const TIRUPPUR_GEO = `${BASE}tn_districts.geojson`
const KANGAYAM_GEO = `${BASE}kangayam.geojson`

export default function HometownSection() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const [mapCenter, setMapCenter] = useState(ht.tamilNaduCenter)
  const [mapScale, setMapScale]   = useState(ht.tamilNaduScale)
  const [zoomProgress, setZoomProgress] = useState(0) // 0→1 as we zoom in

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (v < 0.1) {
      setMapCenter(ht.tamilNaduCenter)
      setMapScale(ht.tamilNaduScale)
      setZoomProgress(0)
    } else if (v > 0.45) {
      setMapCenter(ht.coords)
      setMapScale(ht.zoomScale)
      setZoomProgress(1)
    } else {
      const t = (v - 0.1) / 0.35
      const eased = t * t * (3 - 2 * t)
      setMapCenter([
        ht.tamilNaduCenter[0] + (ht.coords[0] - ht.tamilNaduCenter[0]) * eased,
        ht.tamilNaduCenter[1] + (ht.coords[1] - ht.tamilNaduCenter[1]) * eased,
      ])
      setMapScale(ht.tamilNaduScale + (ht.zoomScale - ht.tamilNaduScale) * eased)
      setZoomProgress(eased)
    }
  })

  // Other states fade out, TN always visible as outline
  const otherStatesOpacity = Math.max(0, 1 - zoomProgress * 3)
  // TN fill fades, stroke stays but blurs when zoomed deep
  const tnFill             = Math.max(0, 0.4 * (1 - zoomProgress * 2.5))
  const tnStroke           = Math.max(0.15, 0.5 * (1 - zoomProgress * 0.8))
  // Background blur increases as we zoom into Kangayam
  const bgBlur             = Math.min(4, zoomProgress * 6)
  // Tiruppur appears at 35%, Kangayam at 55%
  const tiruppurOpacity    = Math.max(0, Math.min(1, (zoomProgress - 0.35) / 0.2))
  const tiruppurBlur       = Math.min(3, Math.max(0, (zoomProgress - 0.7) * 10))
  const kangayamOpacity    = Math.max(0, Math.min(1, (zoomProgress - 0.55) / 0.2))


  const titleOpacity  = useTransform(scrollYProgress, [0.02, 0.08], [0, 1])
  const mapOpacity    = useTransform(scrollYProgress, [0.04, 0.12], [0, 1])
  const textOpacity   = useTransform(scrollYProgress, [0.5, 0.6], [0, 1])
  const watermarkOpacity = useTransform(scrollYProgress, [0.4, 0.55], [0, 1])
  const textY         = useTransform(scrollYProgress, [0.5, 0.6], [30, 0])

  return (
    <section ref={containerRef} style={{ position: 'relative', height: '300vh', background: 'var(--bg)' }}>
      <div style={{
        position: 'sticky', top: 0,
        height: '100vh', width: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>

        {/* Title */}
        <motion.div style={{ opacity: titleOpacity, position: 'absolute', top: '6vh', zIndex: 10, textAlign: 'center' }}>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--accent)', fontFamily: 'var(--mono)',
          }}>{ht.label}</span>
          <h2 style={{
            fontFamily: 'var(--heading)', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
            fontWeight: 700, color: 'var(--text-h)', marginTop: 8, lineHeight: 1.2,
          }}>{ht.heading}</h2>
          <p style={{
            fontSize: '0.9rem', color: 'var(--text)', marginTop: 6, opacity: 0.7,
          }}>{ht.subtext}</p>
        </motion.div>

        {/* Map — full viewport */}
        <motion.div style={{
          opacity: mapOpacity,
          position: 'absolute', inset: 0,
        }}>
          <style>{`.rsm-svg { background: transparent !important; } .rsm-geography { outline: none; }`}</style>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: mapCenter, scale: mapScale }}
            width={800}
            height={600}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          >
            {/* India state boundaries — blurs as we zoom into Kangayam */}
            <g style={{ filter: `blur(${bgBlur}px)` }}>
            <Geographies geography={INDIA_GEO}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const isTN = geo.properties.NAME_1 === 'Tamil Nadu'
                  if (!isTN && otherStatesOpacity <= 0) return null
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: isTN ? 'var(--accent)' : 'var(--border)',
                          fillOpacity: isTN ? tnFill : otherStatesOpacity * 0.2,
                          stroke: isTN ? 'var(--accent)' : 'var(--bg)',
                          strokeOpacity: isTN ? tnStroke : otherStatesOpacity * 0.3,
                          strokeWidth: isTN ? 1 : 0.5,
                        },
                        hover: {
                          fill: isTN ? 'var(--accent)' : 'var(--border)',
                          fillOpacity: isTN ? tnFill : otherStatesOpacity * 0.25,
                          stroke: isTN ? 'var(--accent)' : 'var(--bg)',
                          strokeOpacity: isTN ? tnStroke : otherStatesOpacity * 0.3,
                          strokeWidth: isTN ? 1 : 0.5,
                        },
                        pressed: {
                          fill: isTN ? 'var(--accent)' : 'var(--border)',
                          fillOpacity: isTN ? tnFill : 0,
                        },
                      }}
                    />
                  )
                })
              }
            </Geographies>
            </g>

            {/* Tiruppur district outline — blurs when Kangayam takes focus */}
            {tiruppurOpacity > 0 && (
              <g style={{ filter: `blur(${tiruppurBlur}px)` }}>
              <Geographies geography={TIRUPPUR_GEO}>
                {({ geographies }) =>
                  geographies
                    .filter(geo => (geo.properties.shapeName || '').match(/Tiruppur|Tirupur/i))
                    .map(geo => (
                      <Geography
                        key={geo.rsmKey || 'tiruppur'}
                        geography={geo}
                        style={{
                          default: {
                            fill: 'transparent',
                            stroke: 'var(--accent)',
                            strokeWidth: 1.5,
                            strokeOpacity: tiruppurOpacity * 0.5,
                          },
                          hover: { fill: 'transparent', stroke: 'var(--accent)', strokeWidth: 1.5, strokeOpacity: tiruppurOpacity * 0.6 },
                          pressed: { fill: 'transparent' },
                        }}
                      />
                    ))
                }
              </Geographies>
              </g>
            )}

            {/* Kangayam taluk boundary — with image clipped inside */}
            {kangayamOpacity > 0 && (
              <Geographies geography={KANGAYAM_GEO}>
                {({ geographies }) =>
                  geographies.map(geo => (
                    <KangayamWithImage
                      key={geo.rsmKey || 'kangayam'}
                      geo={geo}
                      opacity={kangayamOpacity}
                      imgSrc={`${BASE}${ht.images?.[0] || ''}`}
                    />
                  ))
                }
              </Geographies>
            )}

          </ComposableMap>
        </motion.div>

        {/* KANGAYAM watermark text */}
        <motion.div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: watermarkOpacity,
          pointerEvents: 'none', zIndex: 2,
        }}>
          <span style={{
            fontFamily: "'Sekuya', sans-serif",
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            fontWeight: 400,
            color: 'var(--text-h)',
            opacity: 0.07,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}>KANGAYAM</span>
        </motion.div>

        {/* Description + Know More — dark card below map */}
        <motion.div style={{
          opacity: textOpacity, y: textY,
          position: 'absolute', bottom: '3vh',
          textAlign: 'center', maxWidth: 540, padding: '20px 28px',
          zIndex: 12,
          background: 'var(--accent-bg)',
          borderRadius: 16,
          border: '1px solid rgba(167,139,250,0.15)',
          backdropFilter: 'blur(12px)',
        }}>
          <p style={{
            fontSize: '0.88rem', color: 'var(--text-h)', lineHeight: 1.75,
            marginBottom: 16, opacity: 0.85,
          }}>{ht.description}</p>
          {ht.knowMoreUrl && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text)', opacity: 0.7, margin: 0 }}>
              {ht.knowMoreLabel || 'Know more about my village'}{' '}
              <a
                href={ht.knowMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--accent)', fontWeight: 600,
                  textDecoration: 'underline', textUnderlineOffset: '3px',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.target.style.opacity = '0.7'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >Click here</a>
            </p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
