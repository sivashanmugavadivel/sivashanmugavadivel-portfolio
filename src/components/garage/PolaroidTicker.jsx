/**
 * Polaroid ticker — a strip of photos in polaroid frames that drifts sideways
 * on its own and gets shoved along by page scroll.
 *
 * Ported from the Framer "PolaroidTicker" component the design came from, with
 * its defaults kept: ~50px/s idle drift, scroll velocity multiplied on top,
 * ±8° of per-card tilt, and a hover that scales the card and straightens it up.
 * Two things were added for this site: the loop pauses on hover so a caption
 * can actually be read, and it stops running entirely while off-screen.
 *
 * The loop itself: one measured set of photos is repeated enough times to cover
 * the viewport, and `x` is wrapped into [-setWidth, 0) every frame, so the strip
 * never reaches an end to run out of. Nothing here re-renders per frame — the
 * position is a motion value and the hover is pure CSS.
 *
 * Content comes from ../../data/garageGallery (config.json → garage.gallery).
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion'
import { OFF } from './showcaseTokens'

/* Frame proportions. The photo is square and the frame is wider at the bottom —
   that bottom lip is what a polaroid caption gets written on. */
const FRAME_PAD = 13
const CAPTION_H = 52
const FRAME_BG = '#f7f5ef'   // warm white; pure #fff reads as a plain card
const HOVER_ROT = 3          // deg the card swings on hover
const HOVER_SCALE = 1.05

/* Per-card tilt, as a fraction of the configured max. Keyed off the photo's
   index rather than randomised, so a card looks the same in every repeat of the
   set — a random angle would make the loop visibly seam. */
const TILT_SEQ = [0.65, -0.85, 0.25, -0.45, 0.95, -0.2, 0.5, -0.7, 0.35, -0.95]

/**
 * One framed photo.
 *
 * `echo` marks a card in one of the repeated sets: same photo, hidden from
 * assistive tech, and taken out of the tab order so focus doesn't stop at the
 * same photo several times over.
 *
 * `onExpand` makes the whole frame the button that opens the expanded view —
 * that's the primary action, so a photo's own `link` moves into the expanded
 * view rather than competing for the same click here.
 */
function Polaroid({ photo, tilt, size, echo, onExpand }) {
  const inner = (
    <>
      <span className="pt-shot" style={{ width: size, height: size }}>
        <img
          src={photo.src}
          alt={photo.alt}
          loading="lazy"
          draggable={false}
          style={{ display: 'block', width: size, height: size, objectFit: 'cover', background: '#e8e4da' }}
        />
        {/* the "there's more of this" cue — only where there's something to open */}
        {onExpand && <span className="pt-zoom" aria-hidden>⤢</span>}
      </span>
      <div className="pt-cap" style={{ width: size }}>
        <span className="pt-cap-l">{photo.caption}</span>
        {(photo.location || photo.date) && (
          <span className="pt-cap-m">
            {[photo.location, photo.date].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>
    </>
  )

  const shared = {
    className: 'pt-card',
    style: { '--tilt': `${tilt.toFixed(2)}deg` },
    tabIndex: echo ? -1 : undefined,
  }

  if (onExpand) {
    return (
      <button
        {...shared}
        type="button"
        onClick={onExpand}
        aria-label={`Expand photo: ${photo.caption || photo.alt}`}
      >
        {inner}
      </button>
    )
  }

  /* No expanded view to open, but the photo points somewhere: the frame is the
     link, so the whole polaroid is the hit area. */
  return photo.link ? (
    <a {...shared} href={photo.link} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <div className="pt-card" style={shared.style}>{inner}</div>
  )
}

/**
 * @param {object[]} photos       from `galleryPhotos`
 * @param {number}   photoSize    px, the square photo inside the frame
 * @param {number}   gap          px between frames
 * @param {number}   tilt         deg, the max either way
 * @param {number}   speed        px/s of idle leftward drift
 * @param {number}   scrollBoost  extra px of travel per px of page scroll
 * @param {boolean}  pauseOnHover
 * @param {function} onExpand     called with a photo's index when its frame is
 *                                clicked; omit and the frames aren't clickable
 * @param {boolean}  paused       freeze from outside, e.g. while the expanded
 *                                view is covering the page
 */
export default function PolaroidTicker({
  photos = [],
  photoSize = 210,
  gap = 34,
  tilt = 8,
  speed = 46,
  scrollBoost = 2.2,
  pauseOnHover = true,
  onExpand,
  paused = false,
}) {
  const reduce = useReducedMotion()
  const viewportRef = useRef(null)
  const setRef = useRef(null)
  const x = useMotionValue(0)

  /* Loop period — one set plus the gap that follows it. Held in a ref because
     the animation frame reads it, and it must not trigger renders. */
  const period = useRef(0)
  const [copies, setCopies] = useState(2)

  /* Scroll travel that hasn't been spent yet, in px. The listener adds to it,
     each frame eats a slice, so a flick of the wheel eases out instead of
     stopping dead. */
  const pending = useRef(0)
  const lastY = useRef(0)
  /* Both have to be true for the strip to move. Kept apart so a pointer
     leaving while the section is off-screen can't restart it. */
  const visible = useRef(true)
  const hovered = useRef(false)
  /* `paused` mirrored into a ref, because the animation frame reads it outside
     of React's render cycle. */
  const frozen = useRef(paused)
  useEffect(() => { frozen.current = paused }, [paused])

  /* ── measure one set, then repeat it enough times to cover the strip ── */
  useEffect(() => {
    const set = setRef.current
    const vp = viewportRef.current
    if (!set || !vp) return

    const measure = () => {
      /* the fractional width, not offsetWidth's rounded one — a rounding error
         here is a seam that opens a little wider on every lap */
      const w = set.getBoundingClientRect().width + gap
      period.current = w
      if (w > 0) setCopies(Math.max(2, Math.ceil(vp.offsetWidth / w) + 1))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(vp)
    ro.observe(set)
    return () => ro.disconnect()
  }, [gap, photoSize, photos.length])

  /* ── page scroll feeds the strip ── */
  useEffect(() => {
    if (reduce) return
    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      pending.current += (y - lastY.current) * scrollBoost
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduce, scrollBoost])

  /* ── idle while nobody's looking ── */
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting })
    io.observe(vp)
    return () => io.disconnect()
  }, [])

  useAnimationFrame((_, delta) => {
    const w = period.current
    if (reduce || !w) return

    /* Standing still forgets the scroll that happened meanwhile, so hovering
       through a long scroll doesn't bank up a lurch for when the pointer
       leaves. */
    if (!visible.current || hovered.current || frozen.current) {
      pending.current = 0
      return
    }

    /* A tab that was in the background hands over a huge delta on its first
       frame back; cap it so the strip doesn't jump. */
    const dt = Math.min(delta, 64) / 1000

    /* Frame-rate independent ease-out on the scroll push: ~63% of what's left
       is spent per 100ms, whatever the refresh rate. */
    const spend = pending.current * (1 - Math.exp(-dt * 10))
    pending.current -= spend
    if (Math.abs(pending.current) < 0.05) pending.current = 0

    /* Wrap into [-w, 0) — the double modulo keeps it correct when a scroll up
       pushes the strip backwards past zero. */
    const next = x.get() - speed * dt - spend
    x.set(((next % w) + w) % w - w)
  })

  if (!photos.length) return null

  const tiltOf = i => TILT_SEQ[i % TILT_SEQ.length] * tilt

  /* Reduced motion: no drift, no scroll coupling — one set of photos in a strip
     that can be scrolled by hand instead. */
  const sets = reduce ? [0] : Array.from({ length: copies }, (_, i) => i)

  return (
    <div
      ref={viewportRef}
      className={`pt-strip${reduce ? ' pt-static' : ''}`}
      onPointerEnter={() => { if (pauseOnHover) hovered.current = true }}
      onPointerLeave={() => { hovered.current = false }}
    >
      <motion.div className="pt-rail" style={reduce ? { gap } : { gap, x }}>
        {sets.map(c => (
          <div
            key={c}
            ref={c === 0 ? setRef : undefined}
            className="pt-set"
            style={{ gap }}
            /* the repeats are the same photos again — read the list once */
            aria-hidden={c > 0 || undefined}
          >
            {photos.map((photo, i) => (
              <Polaroid
                key={photo.id ?? i}
                photo={photo}
                tilt={tiltOf(i)}
                size={photoSize}
                echo={c > 0}
                /* the index in the source list, so the expanded view opens on
                   this photo no matter which repeat was clicked */
                onExpand={onExpand && (() => onExpand(i))}
              />
            ))}
          </div>
        ))}
      </motion.div>

      <style>{`
        .pt-strip {
          position: relative;
          overflow: hidden;
          /* Room for what the tilt costs. A card is wider than it is tall by
             the time it's rotated 11° (its own tilt plus the hover swing), and
             the hover scale and drop shadow add a little more on top — without
             this the corners get sliced off by the overflow clip. */
          padding: 38px 0 40px;
          /* fade the ends so photos enter and leave instead of being clipped */
          mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
        }
        .pt-rail { display: flex; width: max-content; will-change: transform; }
        .pt-set { display: flex; flex-shrink: 0; }

        .pt-card {
          --tilt: 0deg;
          flex-shrink: 0;
          display: block;
          padding: ${FRAME_PAD}px;
          padding-bottom: 0;
          background: ${FRAME_BG};
          border: 0;
          border-radius: 4px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.38);
          text-align: inherit;
          text-decoration: none;
          font: inherit;
          transform: rotate(var(--tilt));
          transition: transform .3s ease, box-shadow .3s ease;
        }
        /* focus reaches the same state as hover, so keyboard use gets the lift
           and the expand cue too */
        .pt-card:hover,
        .pt-card:focus-visible {
          transform: rotate(calc(var(--tilt) + ${HOVER_ROT}deg)) scale(${HOVER_SCALE});
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
          z-index: 2;
        }
        a.pt-card, button.pt-card { cursor: pointer; -webkit-appearance: none; appearance: none; }
        .pt-card:focus-visible { outline: 2px solid ${OFF}; outline-offset: 3px; }

        /* ── the photo, and what sits over it on hover ── */
        .pt-shot { position: relative; display: block; overflow: hidden; }
        .pt-shot::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(10, 8, 18, 0.34);
          opacity: 0;
          transition: opacity .25s ease;
        }
        .pt-card:hover .pt-shot::after,
        .pt-card:focus-visible .pt-shot::after { opacity: 1; }

        .pt-zoom {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 1;
          width: 40px;
          height: 40px;
          margin: -20px 0 0 -20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.5);
          background: rgba(10, 8, 18, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          color: #fff;
          font-size: 1rem;
          line-height: 1;
          opacity: 0;
          transform: scale(0.8);
          transition: opacity .25s ease, transform .3s cubic-bezier(.34, 1.56, .64, 1);
        }
        .pt-card:hover .pt-zoom,
        .pt-card:focus-visible .pt-zoom { opacity: 1; transform: scale(1); }

        /* the written-on lip at the bottom of the frame */
        .pt-cap {
          height: ${CAPTION_H}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 0 4px;
          text-align: center;
        }
        .pt-cap-l {
          font-size: 0.76rem;
          font-weight: 600;
          line-height: 1.2;
          color: #1c1a24;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }
        .pt-cap-m {
          font-family: var(--mono);
          font-size: 0.5rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(28, 26, 36, 0.55);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        /* Standing still, so it has to be scrollable by hand — and the ends
           stop fading, or the first and last photo would sit permanently
           half-erased with no drift to carry them out of it. */
        .pt-static {
          overflow-x: auto;
          scrollbar-width: none;
          mask-image: none;
          -webkit-mask-image: none;
          padding-left: 24px;
          padding-right: 24px;
        }
        .pt-static::-webkit-scrollbar { display: none; }
        .pt-static .pt-rail { will-change: auto; }

        @media (max-width: 700px) {
          /* top and bottom only — a shorthand here would undo .pt-static's
             side padding, which is declared above this */
          .pt-strip { padding-top: 30px; padding-bottom: 32px; }
          .pt-cap-l { font-size: 0.7rem; }
          /* no hover on a touch screen, so the cue can't be hidden behind one */
          .pt-zoom { opacity: 1; transform: scale(1); }
        }

        /* The lift is an affordance rather than decoration, so it stays — it
           just arrives without the travel. */
        @media (prefers-reduced-motion: reduce) {
          .pt-card, .pt-zoom, .pt-shot::after { transition: none; }
          .pt-card:hover, .pt-card:focus-visible { transform: rotate(var(--tilt)); }
        }
      `}</style>
    </div>
  )
}
