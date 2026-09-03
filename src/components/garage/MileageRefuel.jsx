/* ══════════════════════════════════════════════════════════════════
   MileageRefuel — the mileage section on /mygarage.

   A Bear at a pump, its cut-away tank filling, ending on the figure
   the section exists to show. The drawing and the animation live in
   mileageScene.js, which is imperative on purpose; this component's
   job is to give it somewhere to build, tell it which arrangement to
   use, and take it down again.

   Everything below is scoped under .mrf. The scene's own ids are
   prefixed mrf- for the same reason: this markup shares a document
   with the rest of the page now, which the preview never had to
   worry about.
   ══════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react'
import { mountRefuelScene } from './mileageScene'
import { MILEAGE_COPY } from '../../data/mileage'

const NARROW = '(max-width: 700px)'

export default function MileageRefuel() {
  const hostRef = useRef(null)
  /* Stacked on a phone, side by side otherwise. The scene is built once
     from this, so crossing the breakpoint has to rebuild it — the
     standalone page reloaded itself to do that, which a single-page app
     obviously cannot. Making it state instead means the effect below
     re-runs and the scene is torn down and redrawn in the new shape. */
  const [portrait, setPortrait] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(NARROW).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(NARROW)
    const onChange = (e) => setPortrait(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    return mountRefuelScene(host, portrait)
  }, [portrait])

  return (
    <section className="mrf" aria-labelledby="mrf-heading">
      <div className="mrf-head">
        <span className="kick">{MILEAGE_COPY.kicker}</span>
        <h2 id="mrf-heading">{MILEAGE_COPY.title}</h2>
        <p className="note">{MILEAGE_COPY.note}</p>
      </div>
      <div ref={hostRef} />

      <style>{`
        /* The scene was drawn against these, and the page it came from
           set them on :root. Declaring them on the section keeps the
           colours identical without putting anything on the document. */
        .mrf {
          --mrf-card: #141220;
          --mrf-bd: rgba(255,255,255,0.07);
          --mrf-off: #f0eef6;
          --mrf-d2: rgba(240,238,246,0.4);
          --mrf-d3: rgba(240,238,246,0.22);
          --mrf-honey: #e0bb3c;
          --mrf-mono: 'JetBrains Mono', ui-monospace, monospace;
          --mrf-serif: 'Playfair Display', Georgia, serif;
          --mrf-ease: cubic-bezier(.22,1,.36,1);

          position: relative;
          background: var(--mrf-card);
          border: 1px solid var(--mrf-bd);
          border-radius: 16px;
          padding: 26px clamp(14px, 3vw, 30px) 30px;
          overflow: hidden;
        }
        .mrf::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(60% 45% at 50% 0%, rgba(224,187,60,0.08), transparent 70%);
        }

        .mrf .mrf-head { position: relative; z-index: 2; margin-bottom: 4px; }
        .mrf .kick {
          display: block;
          font-family: var(--mrf-mono);
          font-size: 0.58rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--mrf-honey);
          margin-bottom: 7px;
        }
        .mrf h2 {
          font-family: var(--mrf-serif);
          font-size: clamp(1.35rem, 3.6vw, 2rem);
          font-weight: 700;
          color: var(--mrf-off);
          line-height: 1.1;
          margin: 0;
        }
        .mrf .note {
          font-size: 0.76rem;
          color: var(--mrf-d2);
          line-height: 1.65;
          max-width: 440px;
          margin: 8px 0 0;
        }

        /* ══ the forecourt ══ */
        .mrf .rig {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          aspect-ratio: 1020 / 560;
        }
        .mrf .rig svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .mrf #mrf-bike {
          filter: brightness(.42) saturate(.48) contrast(1.05);
          transition: filter 1.6s var(--mrf-ease);
        }
        .mrf .rig.lit #mrf-bike { filter: brightness(.64) saturate(.76) contrast(1.02); }
        .mrf #mrf-trigger { transform-box: fill-box; transform-origin: 52% 5%; }

        /* ══ the readout ══ */
        .mrf .float {
          position: absolute;
          z-index: 6;
          transform: translate(-50%, -100%);
          pointer-events: none;
          will-change: transform, opacity;
          opacity: 0;
        }
        .mrf .float.up { opacity: 1; }
        .mrf .chip {
          display: flex;
          align-items: flex-end;
          gap: 7px;
          padding: 9px 14px 10px;
          border-radius: 13px;
          background: rgba(12,10,18,.88);
          border: 1px solid rgba(224,187,60,.45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 20px 40px -22px #000, 0 0 30px -6px rgba(224,187,60,.45);
          white-space: nowrap;
        }
        .mrf .chip b {
          font-family: var(--mrf-mono);
          font-size: clamp(1.3rem, 3.6vw, 2.1rem);
          font-weight: 700;
          color: var(--mrf-off);
          line-height: .9;
          letter-spacing: -.035em;
          font-variant-numeric: tabular-nums;
        }
        .mrf .chip s {
          text-decoration: none;
          font-family: var(--mrf-mono);
          font-size: 0.5rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--mrf-honey);
          padding-bottom: 3px;
        }
        .mrf .tether {
          position: absolute;
          left: 50%;
          top: 100%;
          width: 1px;
          transform: translateX(-50%);
          background: linear-gradient(180deg, rgba(224,187,60,.75), rgba(224,187,60,.05));
        }
        .mrf .tether::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -3px;
          width: 7px;
          height: 7px;
          margin-left: -3.5px;
          border-radius: 50%;
          background: var(--mrf-honey);
          box-shadow: 0 0 12px 2px rgba(224,187,60,.6);
        }

        .mrf .caption {
          position: absolute;
          left: 50%;
          bottom: 6px;
          transform: translateX(-50%);
          z-index: 7;
          font-family: var(--mrf-mono);
          font-size: 0.5rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--mrf-d3);
          white-space: nowrap;
          transition: color .3s;
        }
        .mrf .caption.on { color: var(--mrf-honey); }
      `}</style>
    </section>
  )
}
