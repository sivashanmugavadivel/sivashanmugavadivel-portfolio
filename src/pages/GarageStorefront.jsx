/**
 * GarageStorefront — /mygarage/storefront
 *
 * "Cinema Scroll": one accessory per full screen, snapping as you scroll,
 * with the stage and the copy swapping sides slide to slide. Categories get a
 * full-screen chapter card, and the page's accent colour eases to that
 * category's hue — so the whole screen changes mood, not just a badge.
 *
 * Nothing about the product list lives here; see src/data/accessories.js for
 * the shape and how the photos in public/mygarage/items get matched up.
 *
 *  - Left-edge film strip: one mark per product, grouped by category
 *  - Scroll snapping is added to <html> on mount and removed on unmount
 *  - Lightbox on the stage photo
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { accessoryCategories, accessoriesNote, accessoryCount, allAccessories } from '../data/accessories'
import './GarageStorefront.css'

/* Back lands on the accessories block rather than the top of My Garage — you
   came from there, so that's where you should end up. ScrollToTop in App.jsx
   resolves the hash once the lazy page has mounted. */
const BACK_TO = '/mygarage#accessories'

/* One hue per category. Categories live in config.json and can be added
   without touching this file, so anything unlisted falls back to the cycle. */
const HUE = {
  camera: '#5ec8ff',
  lighting: '#ffcc3d',
  helmet: '#7c6cff',
  safety: '#ff5f56',
  essentials: '#39d98a',
}
const HUE_CYCLE = ['#5ec8ff', '#ffcc3d', '#7c6cff', '#ff5f56', '#39d98a', '#ff8a6b']
const hueFor = (id, i) => HUE[id] || HUE_CYCLE[i % HUE_CYCLE.length]

const EASE = [0.16, 1, 0.3, 1]
const VIEWPORT = { once: true, amount: 0.4 }

/** Fade-and-rise, used for most of the slide furniture. */
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
  transition: { duration: 0.75, delay, ease: EASE },
})

/**
 * A line of display type that wipes up out of its own overflow.
 *
 * The observer has to sit on the *outer* span, not the one that moves: the
 * inner span starts translated fully below the clipping box, and a clipped
 * element reports zero intersection — so watching it directly would mean
 * whileInView never fires and the text stayed parked out of sight. The outer
 * span keeps its layout box (transforms don't affect layout), so it's a
 * reliable trigger, and the child follows by variant propagation.
 */
function RiseLine({ children, delay = 0 }) {
  return (
    <motion.span
      className="sf-line"
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}>
      <motion.span
        style={{ display: 'block' }}
        variants={{ hidden: { y: '104%' }, show: { y: 0 } }}
        transition={{ duration: 1.05, delay, ease: EASE }}>
        {children}
      </motion.span>
    </motion.span>
  )
}

/** One product, taking the whole screen. `flip` alternates which side the photo sits on. */
function ItemSlide({ item, category, n, total, flip, onZoom }) {
  const [active, setActive] = useState(0)
  const images = item.images || []
  const cover = images[active]

  const facts = [
    ['Category', `${category.icon} ${category.label}`],
    ['Sourced', item.links?.map(l => l.vendor).join(' · ') || 'Pending'],
    ['Plates', images.length || '—'],
    ['Status', item.featured ? 'Fitted · headline pick' : 'Fitted'],
  ]

  return (
    <section
      className={`sf-slide sf-item${flip ? ' rev' : ''}`}
      data-acc={category.hue}
      data-cat={category.label}
      data-n={n}
      id={`item-${item.id}`}>

      <motion.div
        className="sf-stage"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ duration: 1.05, ease: EASE }}>
        <span className="sf-ghost" aria-hidden="true">{String(n).padStart(2, '0')}</span>
        {cover
          ? <img
              className="sf-shot"
              src={cover}
              alt={item.name}
              loading="lazy"
              onClick={() => onZoom(item, active)}
            />
          : <span className="sf-noshot" aria-hidden="true">{category.icon}</span>}
      </motion.div>

      <div className="sf-say">
        <motion.div className="sf-no" {...rise(0.05)}>
          {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')} — {category.label}
        </motion.div>

        <h3 className="sf-name"><RiseLine delay={0.12}>{item.name}</RiseLine></h3>

        {item.desc && (
          <motion.p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.75 }} {...rise(0.2)}>
            {item.desc}
          </motion.p>
        )}

        <motion.dl className="sf-facts" {...rise(0.26)}>
          {facts.map(([k, v]) => (
            <div className="sf-fact" key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </motion.dl>

        {images.length > 1 && (
          <motion.div className="sf-reel" {...rise(0.32)}>
            {images.map((src, i) => (
              <button
                key={src}
                className={i === active ? 'on' : undefined}
                onClick={() => setActive(i)}
                aria-label={`${item.name} photo ${i + 1}`}>
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </motion.div>
        )}

        <motion.div className="sf-acts" {...rise(0.38)}>
          {item.links?.length
            ? item.links.map((l, i) => (
                <a
                  key={l.url + i}
                  className={`sf-go ${i === 0 ? 'p' : 's'}`}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer">
                  {i === 0 ? `Buy on ${l.vendor}` : l.vendor} ↗
                </a>
              ))
            : <span className="sf-soon">Link coming soon</span>}
        </motion.div>
      </div>
    </section>
  )
}

export default function GarageStorefront() {
  const [lb, setLb] = useState({ open: false, slides: [], index: 0 })
  const rootRef = useRef(null)

  /* Categories with their hue resolved once, and a flat running order so each
     product keeps a stable number across the whole page. */
  const cats = useMemo(
    () => accessoryCategories.map((c, i) => ({ ...c, hue: hueFor(c.id, i) })),
    [],
  )
  const order = useMemo(
    () => cats.flatMap(c => c.items.map(item => ({ item, category: c }))),
    [cats],
  )
  const photoCount = allAccessories.reduce((n, a) => n + a.images.length, 0)

  const [active, setActive] = useState({ n: 0, cat: 'Opening', acc: cats[0]?.hue || HUE_CYCLE[0] })

  /* Snapping is a document-level behaviour, so it has to be cleaned up when
     you navigate away — otherwise every other page inherits it. */
  useEffect(() => {
    document.documentElement.classList.add('sf-snap')
    return () => document.documentElement.classList.remove('sf-snap')
  }, [])

  /* Whichever slide is filling the screen drives the accent, the counter and
     the film strip. Kept separate from the reveal animations above, which are
     framer-motion's job. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const slides = root.querySelectorAll('[data-acc]')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (!e.isIntersecting) return
        const el = e.target
        setActive({
          n: Number(el.dataset.n) || 0,
          cat: el.dataset.cat,
          acc: el.dataset.acc,
        })
      }),
      { threshold: 0.55 },
    )
    slides.forEach(s => io.observe(s))
    return () => io.disconnect()
  }, [order.length])

  const openLightbox = (item, index) =>
    setLb({ open: true, index, slides: item.images.map(src => ({ src, description: item.name })) })

  const jumpTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="sf" ref={rootRef} style={{ '--sf-acc': active.acc }}>
      <div className="sf-wash" />
      <div className="sf-vig" />
      <div className="sf-noise" />

      <div className="sf-hud">
        <b>{String(active.n).padStart(2, '0')}</b>
        <i />
        <span>{String(accessoryCount).padStart(2, '0')}</span>
        <u>{active.cat}</u>
      </div>
      <Link className="sf-crumb" to={BACK_TO}>✕ My Garage</Link>

      {/* One mark per product, grouped under its category */}
      <nav className="sf-strip" aria-label="Jump to a part">
        {cats.map(c => (
          <div key={c.id} style={{ display: 'contents' }}>
            <div className="sf-strip-head">{c.label.split(' ')[0]}</div>
            {c.items.map(item => {
              const n = order.findIndex(o => o.item.id === item.id) + 1
              return (
                <button
                  key={item.id}
                  className={`sf-dot${active.n === n ? ' on' : ''}`}
                  title={item.name}
                  aria-label={item.name}
                  onClick={() => jumpTo(`item-${item.id}`)}
                />
              )
            })}
          </div>
        ))}
      </nav>

      {/* Opening title card */}
      <section className="sf-slide sf-open" data-acc={cats[0]?.hue || HUE_CYCLE[0]} data-cat="Opening">
        <motion.div className="sf-kick" {...rise(0.05)}>A reel of every part</motion.div>
        <h1 className="sf-title">
          <RiseLine delay={0.14}>The</RiseLine>
          <RiseLine delay={0.28}><em>Storefront</em></RiseLine>
        </h1>
        <motion.p className="sf-lede" {...rise(0.5)}>
          {accessoriesNote || 'Every accessory on the bike, and where each one came from.'}
        </motion.p>
        <motion.div className="sf-figs" {...rise(0.6)}>
          {[['Parts', accessoryCount], ['Chapters', cats.length], ['Plates', photoCount]].map(([l, v]) => (
            <div key={l}><b>{v}</b><span>{l}</span></div>
          ))}
        </motion.div>
        <div className="sf-cue"><i />Scroll</div>
      </section>

      {/* A chapter card, then its products */}
      {cats.map((c, ci) => (
        <div key={c.id} style={{ display: 'contents' }}>
          <section className="sf-slide sf-chapter" id={`cat-${c.id}`} data-acc={c.hue} data-cat={c.label}>
            <motion.div
              className="sf-ch-ic"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.85, ease: EASE }}>
              {c.icon}
            </motion.div>
            <motion.div className="sf-ch-sub" {...rise(0.28)}>
              Chapter {String(ci + 1).padStart(2, '0')}
            </motion.div>
            <h2 className="sf-ch-title"><RiseLine delay={0.1}>{c.label}</RiseLine></h2>
            {/* scaleX, not width: a zero-width element has no area, so the
                viewport threshold could never be met and it would never draw */}
            <motion.div
              className="sf-ch-rule"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={VIEWPORT}
              transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
            />
          </section>

          {c.items.map(item => {
            const n = order.findIndex(o => o.item.id === item.id) + 1
            return (
              <ItemSlide
                key={item.id}
                item={item}
                category={c}
                n={n}
                total={accessoryCount}
                flip={n % 2 === 0}
                onZoom={openLightbox}
              />
            )
          })}
        </div>
      ))}

      {/* Closing card */}
      <section className="sf-slide sf-close" data-acc={cats[cats.length - 1]?.hue || HUE_CYCLE[0]} data-cat="Fin">
        <motion.h2 {...rise()}>That&rsquo;s the build.</motion.h2>
        <motion.p {...rise(0.12)}>
          Everything above is bolted to the bike right now. Nothing sponsored, nothing staged,
          nothing sitting in a box.
        </motion.p>
        <motion.div {...rise(0.22)}>
          <Link className="sf-back" to={BACK_TO}>← Back to My Garage</Link>
        </motion.div>
      </section>

      <Lightbox
        open={lb.open}
        close={() => setLb(s => ({ ...s, open: false }))}
        slides={lb.slides}
        index={lb.index}
      />
    </div>
  )
}
