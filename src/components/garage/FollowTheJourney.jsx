/**
 * FollowTheJourney — the social links at the foot of /mygarage.
 *
 * Every channel is bolted on as a current Indian HSRP plate rather than a
 * button: the chromium Ashoka Chakra hologram at the top left with its
 * colours never sitting still, the hot-stamped blue IND beneath it, a
 * laser-etched permanent identification number along the bottom, the
 * colour-coded sticker carrying the platform's own mark, and the two
 * non-reusable snap locks. The registration reads TN 42 — the Bear's own
 * series — so the wall reads as one owner's plates.
 *
 * The links themselves come from ../../data/config.json, so this section
 * follows whatever is set there; a channel with no href is dropped rather
 * than rendered dead.
 *
 * Nothing animates until the section is actually scrolled to: `useInView`
 * puts the `in` class on the wrapper and every entrance hangs off that,
 * so a visitor who never reaches the bottom of the page never spends the
 * frames.
 */

import { useRef } from 'react'
import { useInView } from 'framer-motion'
import cfg from '../../data/config.json'
import ShowcaseCard from './ShowcaseCard'
import { CARD2, BD, BD2, OFF, D2, D3, ACC2 } from './showcaseTokens'

/* Plate face and lettering, fixed in both themes — a real HSRP is white
   with black characters, and tinting it would stop reading as a plate. */
const FACE_HI  = '#ffffff'
const FACE_LO  = '#e6e6df'
const INK      = '#0d0d0d'
const INK_SOFT = '#57544c'
const IND_BLUE = '#05299e'

/* ── platform marks ───────────────────────────────────────────────
   Same paths the floating social button uses, so a channel looks the
   same wherever it appears on the site. */
const PATHS = {
  youtube: 'M23.5 6.2a3 3 0 0 0-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.57A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.57a3 3 0 0 0 2.12-2.13A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z',
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.325 6.162 6.162 0 0 0 0-12.325zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z',
  twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z',
}

const Mark = ({ name }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={PATHS[name]} />
  </svg>
)

/* ── Ashoka Chakra ────────────────────────────────────────────────
   24 spokes off a filled hub, as on the plate's hologram. Drawn
   rather than shipped as an image so it stays crisp at 34px and
   takes the stroke colour from the stylesheet. */
const SPOKES = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2
  return {
    x1: (50 + Math.cos(a) * 11).toFixed(1), y1: (50 + Math.sin(a) * 11).toFixed(1),
    x2: (50 + Math.cos(a) * 41).toFixed(1), y2: (50 + Math.sin(a) * 41).toFixed(1),
  }
})

const Chakra = () => (
  <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <circle cx="50" cy="50" r="45" />
    {SPOKES.map((s, i) => <line key={i} {...s} />)}
    <circle className="hsrp-hub" cx="50" cy="50" r="9" />
  </svg>
)

/* ── channels ─────────────────────────────────────────────────────
   Built from config so this section never disagrees with the rest of
   the site, and so a channel that has no link simply isn't fitted. */

/** wa.me/918667451118 → "+91 86674 51118"; anything unexpected is left alone. */
function waHandle(href) {
  const d = String(href || '').replace(/\D/g, '')
  if (d.length !== 12) return d ? `+${d}` : ''
  return `+${d.slice(0, 2)} ${d.slice(2, 7)} ${d.slice(7)}`
}

const CHANNELS = [
  { key: 'youtube',   name: 'YouTube',   plate: 'YOUTUBE',  colour: '#FF0033' },
  { key: 'instagram', name: 'Instagram', plate: 'INSTAGRAM', colour: '#E4405F' },
  { key: 'twitter',   name: 'X',         plate: 'X',        colour: '#1D9BF0' },
  { key: 'facebook',  name: 'Facebook',  plate: 'FACEBOOK', colour: '#1877F2' },
  { key: 'linkedin',  name: 'LinkedIn',  plate: 'LINKEDIN', colour: '#0A66C2' },
  { key: 'whatsapp',  name: 'WhatsApp',  plate: 'WHATSAPP', colour: '#25D366' },
]
  .map(c => {
    const src = c.key === 'whatsapp' ? cfg.whatsapp : cfg.social?.[c.key]
    const href = src?.href || ''
    const handle = c.key === 'whatsapp' ? waHandle(href) : (src?.handle || '')
    return { ...c, href, handle }
  })
  .filter(c => c.href)

/* Laser-etched PIN — ten digits, fixed per channel so it reads as a real
   plate rather than something that changes on every render. */
const pinOf = i => `IN ${4210000000 + i * 76543}`

const SERIES = 'TN 42'

export default function FollowTheJourney({
  title = 'Follow the Journey',
  note = 'Every plate on the wall points somewhere I post from. Take whichever one you ride with.',
}) {
  const ref = useRef(null)
  /* once: the plates bolt on when the section is first reached and stay put */
  const inView = useInView(ref, { once: true, margin: '-70px' })

  return (
    <ShowcaseCard>
      {title && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: '0.58rem', color: ACC2, letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: 5,
          }}>
            Registered channels
          </div>
          <h3 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: OFF, margin: 0 }}>
            {title}
          </h3>
          {note && (
            <div style={{ fontSize: '0.74rem', color: D2, marginTop: 6, lineHeight: 1.6, maxWidth: 460, margin: '6px auto 0' }}>
              {note}
            </div>
          )}
        </div>
      )}

      <div ref={ref} className={`hsrp-wall${inView ? ' in' : ''}`}>
        {CHANNELS.map((c, i) => (
          <a
            key={c.key}
            className="hsrp-plate"
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${c.name} — ${c.handle}`}
            style={{ '--pc': c.colour, '--d': `${(i * 0.08).toFixed(2)}s` }}
          >
            {/* the two non-reusable snap locks */}
            <i className="hsrp-lock l1" aria-hidden />
            <i className="hsrp-lock l2" aria-hidden />

            <span className="hsrp-left" aria-hidden>
              <span className="hsrp-holo"><Chakra /></span>
              <span className="hsrp-ind">IND</span>
            </span>

            <span className="hsrp-txt">
              <span className="hsrp-reg">{SERIES} · {c.plate}</span>
              {c.handle && <span className="hsrp-handle">{c.handle}</span>}
            </span>

            <span className="hsrp-sticker" aria-hidden><Mark name={c.key} /></span>
            <span className="hsrp-pin" aria-hidden>{pinOf(i)}</span>
          </a>
        ))}
      </div>

      <style>{`
        /* ════ the wall ════
           Fixed column counts rather than auto-fit: a registration has to
           be read in full, and auto-fit will happily hand back a column
           too narrow for "TN 42 · INSTAGRAM" and ellipsis the plate. */
        .hsrp-wall {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          /* the plates tilt into the room rather than sliding flat */
          perspective: 1000px;
        }

        /* ════ the plate ════ */
        .hsrp-plate {
          position: relative;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 13px 15px;
          border-radius: 7px;
          overflow: hidden;
          text-decoration: none;
          background: linear-gradient(180deg, ${FACE_HI}, #f2f2ee 55%, ${FACE_LO});
          border: 2.5px solid #101010;
          box-shadow: 0 10px 24px -14px rgba(0, 0, 0, 0.75);
          transform-style: preserve-3d;
          /* held back until the section is reached */
          opacity: 0;
          transition:
            transform .42s cubic-bezier(.34, 1.4, .64, 1),
            box-shadow .35s;
        }
        /* The entrance animates the independent translate/rotate/scale
           properties rather than the transform shorthand — otherwise its
           forwards fill would win the cascade and swallow the hover tilt
           below. */
        .hsrp-wall.in .hsrp-plate {
          animation: hsrp-bolt .72s cubic-bezier(.34, 1.5, .64, 1) var(--d) forwards;
        }
        @keyframes hsrp-bolt {
          0%        { opacity: 0; translate: 0 24px; rotate: -7deg; scale: .9; }
          60%       { opacity: 1; }
          100%      { opacity: 1; translate: 0 0;    rotate: 0deg;  scale: 1;  }
        }
        .hsrp-plate:hover,
        .hsrp-plate:focus-visible {
          transform: rotateX(9deg) rotateY(-7deg) translateY(-4px);
          box-shadow: 0 24px 42px -18px rgba(0, 0, 0, 0.8);
        }
        .hsrp-plate:focus-visible { outline: 2px solid ${ACC2}; outline-offset: 3px; }

        /* the face catches the light as the plate tilts */
        .hsrp-plate::after {
          content: '';
          position: absolute;
          top: -50%;
          bottom: -50%;
          left: -70%;
          width: 42%;
          transform: skewX(-16deg);
          pointer-events: none;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,0.85), transparent);
        }
        .hsrp-plate:hover::after,
        .hsrp-plate:focus-visible::after { animation: hsrp-glint .8s ease-out; }
        @keyframes hsrp-glint { to { left: 130%; } }

        /* ════ snap locks ════ */
        .hsrp-lock {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #fff, #8d8a80 55%, #4a473f);
          box-shadow: inset 0 -1px 1px rgba(0, 0, 0, 0.45);
          transition: box-shadow .3s;
        }
        .hsrp-plate:hover .hsrp-lock {
          box-shadow: inset 0 -1px 1px rgba(0, 0, 0, 0.45), 0 0 9px rgba(255, 255, 255, 0.95);
        }
        .hsrp-lock.l1 { top: 5px; left: 50%; margin-left: -22px; }
        .hsrp-lock.l2 { bottom: 5px; left: 50%; margin-left: 14px; }

        /* ════ hologram + IND ════ */
        .hsrp-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          flex: none;
        }
        /* chromium finish: the sheen slides one way while the rainbow
           turns the other, so it never settles */
        .hsrp-holo {
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 4px;
          overflow: hidden;
          background: linear-gradient(135deg, #f6f9ff, #c9dcff 22%, #ffffff 41%, #bfe2ff 58%, #eef3ff 78%, #d7e5ff);
          background-size: 230% 230%;
          box-shadow: inset 0 0 0 1px rgba(5, 41, 158, 0.28);
          animation: hsrp-sheen 4.4s ease-in-out infinite;
        }
        @keyframes hsrp-sheen {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .hsrp-holo::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: .5;
          background: conic-gradient(from 0deg,
            rgba(255,0,140,0.4), rgba(0,220,255,0.4), rgba(170,255,0,0.32), rgba(255,0,140,0.4));
          animation: hsrp-spin 7s linear infinite;
        }
        @keyframes hsrp-spin { to { rotate: 360deg; } }
        .hsrp-holo svg {
          position: absolute;
          inset: 4px;
          width: calc(100% - 8px);
          height: calc(100% - 8px);
          fill: none;
          stroke: ${IND_BLUE};
          stroke-width: 5;
        }
        .hsrp-holo .hsrp-hub { fill: ${IND_BLUE}; stroke: none; }
        .hsrp-plate:hover .hsrp-holo svg { animation: hsrp-spin 6s linear infinite; }

        .hsrp-ind {
          font-family: var(--sans);
          font-weight: 900;
          font-size: 0.52rem;
          letter-spacing: 0.16em;
          color: ${IND_BLUE};
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        /* ════ registration ════ */
        .hsrp-txt { display: block; flex: 1; min-width: 0; }
        .hsrp-reg {
          display: block;
          font-family: var(--sans);
          font-weight: 900;
          font-size: 1.02rem;
          letter-spacing: 0.06em;
          color: ${INK};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hsrp-handle {
          display: block;
          margin-top: 4px;
          font-family: var(--mono);
          font-size: 0.5rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${INK_SOFT};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ════ laser-etched PIN ════ */
        .hsrp-pin {
          position: absolute;
          right: 13px;
          bottom: 3px;
          font-family: var(--mono);
          font-size: 0.42rem;
          letter-spacing: 0.22em;
          color: rgba(20, 20, 20, 0.42);
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
          opacity: 0;
        }
        /* etches itself in behind the plate it belongs to */
        .hsrp-wall.in .hsrp-pin {
          animation: hsrp-etch .5s ease-out calc(var(--d) + .55s) forwards;
        }
        @keyframes hsrp-etch {
          from { opacity: 0; letter-spacing: 0.6em; }
          to   { opacity: 1; letter-spacing: 0.22em; }
        }

        /* ════ colour-coded sticker ════
           Where a fuel-type sticker sits on a real plate — the one place
           the channel's own colour belongs without spoiling the plate. */
        .hsrp-sticker {
          position: relative;
          flex: none;
          width: 34px;
          height: 34px;
          border-radius: 6px;
          display: grid;
          place-items: center;
          background: var(--pc);
          color: #fff;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3), inset 0 0 0 1.5px rgba(255,255,255,0.55);
          transition: transform .35s cubic-bezier(.34, 1.6, .64, 1);
        }
        .hsrp-plate:hover .hsrp-sticker { transform: scale(1.09) rotate(-4deg); }
        .hsrp-sticker svg { width: 17px; height: 17px; fill: currentColor; display: block; }

        /* ════ narrower ════
           Each step down is taken while the registration still fits the
           column, never after it has started truncating. */
        @media (max-width: 1040px) {
          .hsrp-wall { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        /* One plate per row, everything else intact — the hologram and the
           etched PIN are the point, so they keep their size. */
        @media (max-width: 700px) {
          .hsrp-wall { grid-template-columns: minmax(0, 1fr); gap: 12px; }
        }
        @media (max-width: 460px) {
          .hsrp-plate  { gap: 9px; padding: 10px 11px 15px; }
          .hsrp-reg    { font-size: 0.92rem; letter-spacing: 0.04em; }
          .hsrp-holo,
          .hsrp-sticker { width: 30px; height: 30px; }
          .hsrp-sticker svg { width: 15px; height: 15px; }
        }

        /* Touch has no hover to tilt with, so the plate is simply fitted
           and the sheen is the only thing still moving. */
        @media (hover: none) {
          .hsrp-plate::after { display: none; }
        }

        /* The plates are content, so they still arrive — they just stop
           bolting themselves on and the hologram stops turning. */
        @media (prefers-reduced-motion: reduce) {
          .hsrp-plate { opacity: 1; }
          .hsrp-wall.in .hsrp-plate { animation: none; }
          .hsrp-plate:hover, .hsrp-plate:focus-visible { transform: none; }
          .hsrp-plate::after { display: none; }
          .hsrp-holo, .hsrp-holo::after,
          .hsrp-plate:hover .hsrp-holo svg { animation: none; }
          .hsrp-pin { opacity: 1; }
          .hsrp-wall.in .hsrp-pin { animation: none; }
          .hsrp-plate:hover .hsrp-sticker { transform: none; }
        }
      `}</style>
    </ShowcaseCard>
  )
}
