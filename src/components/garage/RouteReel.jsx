/**
 * Route Reel — the garage's vlog section.
 *
 * The vlogs are laid out as stops on a road running down the section. The
 * tarmac paints itself in as the page scrolls, the Bear 650 rides down at the
 * head of the paint turning through its own 360° frames, and each stop swings
 * in from its side as the bike reaches it. Five stops, then a board that
 * carries on to /videos for the rest.
 *
 * Everything scroll-driven is written straight to the nodes from inside a rAF,
 * the same way the 360° spin on /mygarage is — one scroll frame costs a handful
 * of style writes and no React render.
 *
 * Content comes from ../../data/garageVlogs, which reshapes the vlogs read out
 * of public/mygarage/vlog/config/ — one JSON file per vlog. Nothing here
 * invents a figure: a vlog with no runtime shows no runtime badge, and the
 * counters up top only count things the list actually knows.
 *
 * Each stop is a link to that vlog's own page (/mygarage/vlogs/<id>), not to
 * YouTube — the detail page carries the write-up, the route and the reels, and
 * has its own player.
 */

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import {
  vlogsShown, vlogsMore, vlogCount, vlogStats, VLOG_LIMIT, VLOGS_PAGE,
  vlogsTitle, vlogsNote,
} from '../../data/garageVlogs'
import { CARD, CARD2, BD, BD2, OFF, D1, D2, D3, ACC, ACC2 } from './showcaseTokens'

/* Wild Honey tank yellow, sampled from the badge in the bike frames — the same
   value MyGarage uses for the spec callouts, so the two read as one page. */
const HONEY = '#e0bb3c'

const frameSrc = (i) => {
  const n = ((Math.round(i) - 1) % 37 + 37) % 37 + 1
  return `${import.meta.env.BASE_URL}bear650/wild-honey${String(n).padStart(2, '0')}.png`
}

/* The frames the bike turns through on the way down. A dozen of the 37 is
   enough to read as a turn and keeps the swaps cheap; /mygarage has already
   pulled all 37 into cache by the time this section is reached, but the
   preload below covers the section being used on its own. */
const TURN = [28, 31, 34, 37, 3, 6, 9, 12, 15, 18, 21, 24]

const PlayMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden focusable="false">
    <path d="M8 5v14l11-7z" />
  </svg>
)

/* ── the counters above the road ──
   They run up once, when the section first comes into view. Only figures the
   list can actually answer are here — there is no runtime total because
   config carries no runtimes. */
function Odometer() {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const cells = [...el.querySelectorAll('[data-to]')]
    if (reduce) {
      cells.forEach((c) => { c.textContent = c.dataset.to })
      return
    }
    cells.forEach((c) => { c.textContent = '0' })

    let raf = 0
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      io.disconnect()
      const t0 = performance.now()
      const step = (ts) => {
        const p = Math.min(1, (ts - t0) / 1100)
        const e = 1 - (1 - p) ** 3
        cells.forEach((c) => { c.textContent = String(Math.round(+c.dataset.to * e)) })
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, { threshold: 0.4 })

    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [reduce])

  return (
    <div className="rr-odo" ref={ref}>
      <div><b data-to={vlogStats.total}>{vlogStats.total}</b><s>Videos filmed</s></div>
      <div><b data-to={vlogStats.films}>{vlogStats.films}</b><s>Full films</s></div>
      <div><b data-to={vlogStats.shorts}>{vlogStats.shorts}</b><s>Shorts</s></div>
      <div><b>{vlogStats.latest}</b><s>Latest stop</s></div>
    </div>
  )
}

/**
 * What the card's link says. Not "Watch": it doesn't go to YouTube, it opens
 * the vlog's own page — the write-up, the frame grabs, the route it was filmed
 * on, and the reels and posts from the same day. One constant, so it's a
 * one-line change if another wording reads better.
 */
const STOP_CTA = 'Full story'

/**
 * One stop. The whole card is the link to that vlog's page, so the thumbnail
 * and the heading are clickable too rather than just the words at the bottom.
 * The thumbnail rolls its silent clip on hover where the vlog has one.
 */
function Stop({ v, elRef }) {
  const vidRef = useRef(null)
  const cardRef = useRef(null)

  const roll = () => {
    const vid = vidRef.current
    if (!vid) return
    vid.play().then(() => cardRef.current?.classList.add('rr-roll')).catch(() => {})
  }
  const halt = () => {
    const vid = vidRef.current
    if (!vid) return
    cardRef.current?.classList.remove('rr-roll')
    vid.pause()
    vid.currentTime = 0
  }

  return (
    <div className="rr-stop" ref={elRef}>
      <Link
        className="rr-card"
        to={v.href}
        ref={cardRef}
        onPointerEnter={roll}
        onPointerLeave={halt}
        aria-label={`${v.title} — ${STOP_CTA.toLowerCase()}`}
      >
        <div className="rr-shot">
          {v.poster && (
            <img
              src={v.poster}
              alt=""
              loading="lazy"
              /* The YouTube still needs the network. Swap to one of the vlog's own
                 frame grabs if it doesn't arrive, and only give up on the picture
                 if that fails too — a hidden tile keeps the card's shape. */
              onError={(e) => {
                const img = e.currentTarget
                if (v.fallback && img.src !== v.fallback) img.src = v.fallback
                else img.style.visibility = 'hidden'
              }}
            />
          )}
          {v.clip && (
            <video ref={vidRef} src={v.clip} muted loop playsInline preload="none" />
          )}
          {v.duration && <span className="rr-dur">{v.duration}</span>}
          {/* a stop with no video yet gets a marker instead of a play badge, so
              the card never promises something it cannot do */}
          {v.hasVideo
            ? <span className="rr-pl"><PlayMark /></span>
            : <span className="rr-soon">Soon</span>}
        </div>

        <div className="rr-tx">
          <div className="rr-top">
            {v.cat}<s>·</s>{v.type === 'short' ? 'Short' : 'Full film'}
            {v.fav && <><s>·</s>★</>}
          </div>
          <h4>{v.title}</h4>
          {v.blurb && <p>{v.blurb}</p>}
          <div className="rr-foot">
            {v.when.label && <span>{v.when.label}</span>}
            {v.views && <span>{v.views} views</span>}
            <span className="rr-cta">{STOP_CTA} <span aria-hidden>→</span></span>
          </div>
        </div>
      </Link>

      <div className="rr-pin">
        <b>STOP {String(v.n).padStart(2, '0')}</b>
        <i />
      </div>
    </div>
  )
}

/* ── the road has nothing on it yet ── */
function NoStops({ title }) {
  return (
    <div className="rr-sec">
      <RouteStyle />
      <div className="rr-head">
        <div>
          <span className="rr-kick">On the Road</span>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="rr-empty">
        <div className="rr-lane"><i /></div>
        <div className="rr-ico">🛣️</div>
        <div className="rr-lab">Road not ridden yet</div>
        <p>
          Every ride that gets filmed becomes a stop on this road. Nothing to
          mark until the first one is in the can.
        </p>
      </div>
    </div>
  )
}

export default function RouteReel({ title = vlogsTitle, note = vlogsNote }) {
  const routeRef = useRef(null)
  const paintRef = useRef(null)
  const bikeRef = useRef(null)
  const bikeImgRef = useRef(null)
  const stopsRef = useRef([])
  const reduce = useReducedMotion()

  /* ── scroll → how far down the road the bike has got ──
     One number drives the paint height, the bike's position and which stops
     have been passed, so a scroll frame is three style writes and a class
     toggle per stop. */
  useEffect(() => {
    if (!routeRef.current) return

    /* the frames the bike turns through, pulled into cache before the first
       swap so it is never blank for a frame */
    if (!reduce) TURN.forEach((n) => { const im = new Image(); im.src = frameSrc(n) })

    let raf = 0
    let lastFrame = -1

    const paint = () => {
      raf = 0
      const route = routeRef.current
      if (!route) return

      const r = route.getBoundingClientRect()
      const span = r.height + window.innerHeight * 0.45
      const p = Math.max(0, Math.min(1, (window.innerHeight * 0.62 - r.top) / span))
      const y = p * r.height

      if (paintRef.current) paintRef.current.style.height = `${y}px`
      if (bikeRef.current) bikeRef.current.style.transform = `translate3d(0, ${y - 34}px, 0)`

      if (!reduce && bikeImgRef.current) {
        const k = Math.min(TURN.length - 1, Math.floor(p * TURN.length))
        if (k !== lastFrame) {
          lastFrame = k
          bikeImgRef.current.src = frameSrc(TURN[k])
        }
      }

      for (const el of stopsRef.current) {
        if (!el) continue
        el.classList.toggle('rr-in', el.getBoundingClientRect().top < window.innerHeight * 0.82)
      }
    }

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint) }

    /* The section is wrapped in a reveal that animates its own transform for
       about a second after it scrolls into view, and a transform on a parent
       moves what getBoundingClientRect reports. Repainting across that first
       second means the road is right even if the page never scrolls again. */
    let settle = 0
    const t0 = performance.now()
    const settleLoop = (ts) => {
      paint()
      if (ts - t0 < 1200) settle = requestAnimationFrame(settleLoop)
    }
    settle = requestAnimationFrame(settleLoop)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(settle)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reduce])

  if (!vlogCount) return <NoStops title={title} />

  return (
    <div className="rr-sec">
      <RouteStyle />

      <div className="rr-head">
        <div>
          <span className="rr-kick">On the Road</span>
          <h3>{title}</h3>
          {note && <div className="rr-note">{note}</div>}
        </div>
        <Link className="rr-all" to={VLOGS_PAGE}>All vlogs →</Link>
      </div>

      <Odometer />

      <div className="rr-route" ref={routeRef}>
        <div className="rr-road">
          <span className="rr-dash" />
          <span className="rr-paint" ref={paintRef} />
        </div>

        <div className="rr-bike" ref={bikeRef} aria-hidden>
          <img ref={bikeImgRef} src={frameSrc(TURN[0])} alt="" />
        </div>

        <div className="rr-stops">
          {vlogsShown.map((v, i) => (
            <Stop
              key={v.id}
              v={v}
              elRef={(el) => { stopsRef.current[i] = el }}
            />
          ))}
        </div>
      </div>

      {vlogsMore > 0 ? (
        <div className="rr-finish">
          <Link to={VLOGS_PAGE}>
            <span className="rr-n">+{vlogsMore}</span>
            <span className="rr-ftx">
              <b>The road carries on</b>
              <s>{VLOG_LIMIT} stops here · {vlogCount} in total</s>
            </span>
            <span className="rr-arrow" aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <div className="rr-finish">
          <Link to={VLOGS_PAGE}>
            <span className="rr-ftx">
              <b>End of the road</b>
              <s>every vlog, on one page</s>
            </span>
            <span className="rr-arrow" aria-hidden>→</span>
          </Link>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   Styles. Class-prefixed rather than inline because almost all of it is
   pseudo-elements, hover states, media queries and keyframes — none of which
   a style object can carry.
   ══════════════════════════════════════════════════════════════════════════ */
function RouteStyle() {
  return (
    <style>{`
      .rr-sec{
        position:relative;background:${CARD};border:1px solid ${BD};border-radius:16px;
        padding:26px clamp(14px,3vw,30px) 34px;overflow:hidden;
        --lane:38px;--honey:${HONEY};
        --ease:cubic-bezier(.22,1,.36,1);
      }
      .rr-sec::before{
        content:'';position:absolute;inset:0;pointer-events:none;
        background:radial-gradient(60% 40% at 50% 0%,rgba(224,187,60,0.07),transparent 70%);
      }
      .rr-sec > *{position:relative;z-index:2}

      /* ── heading ── */
      .rr-head{display:flex;align-items:flex-end;gap:18px;flex-wrap:wrap;margin-bottom:8px}
      .rr-kick{
        display:block;margin-bottom:7px;font-family:var(--mono);font-size:0.58rem;
        letter-spacing:0.24em;text-transform:uppercase;color:var(--honey);
      }
      .rr-head h3{
        font-family:'Playfair Display',serif;font-size:clamp(1.2rem,3.4vw,1.7rem);
        font-weight:700;color:${OFF};line-height:1.1;margin:0;
      }
      .rr-note{font-size:0.76rem;color:${D2};line-height:1.65;max-width:400px;margin-top:8px}
      .rr-all{
        margin-left:auto;font-size:0.7rem;color:${ACC2};text-decoration:none;padding:7px 15px;
        border-radius:999px;border:1px solid rgba(167,139,250,0.28);white-space:nowrap;
        transition:.3s var(--ease);
      }
      .rr-all:hover{background:${ACC};color:#fff;border-color:${ACC};transform:translateY(-2px)}

      /* ── the counters ── */
      .rr-odo{
        display:flex;flex-wrap:wrap;margin:18px 0 6px;border:1px solid ${BD};
        border-radius:10px;background:${CARD2};overflow:hidden;
      }
      .rr-odo div{flex:1 1 110px;padding:12px 16px;border-right:1px solid ${BD}}
      .rr-odo div:last-child{border-right:0}
      .rr-odo b{
        display:block;font-family:var(--mono);font-size:1.15rem;font-weight:700;color:${OFF};
        font-variant-numeric:tabular-nums;letter-spacing:-0.01em;
      }
      .rr-odo s{
        display:block;text-decoration:none;font-family:var(--mono);font-size:0.5rem;
        letter-spacing:0.18em;text-transform:uppercase;color:${D3};margin-top:4px;
      }

      /* ══ the road ══ */
      .rr-route{position:relative;padding:30px 0 10px}
      .rr-road{
        position:absolute;top:0;bottom:0;left:50%;width:var(--lane);
        margin-left:calc(var(--lane) / -2);background:#191527;
        border-left:1px solid ${BD};border-right:1px solid ${BD};
        border-radius:3px;overflow:hidden;
      }
      .rr-dash{
        position:absolute;left:50%;top:0;bottom:0;width:3px;margin-left:-1.5px;opacity:.35;
        background:repeating-linear-gradient(180deg,rgba(255,255,255,.34) 0 16px,transparent 16px 34px);
      }
      /* the paint that fills in behind the bike */
      .rr-paint{
        position:absolute;left:0;right:0;top:0;height:0;
        background:linear-gradient(180deg,rgba(224,187,60,0.22),rgba(224,187,60,0.06));
        box-shadow:0 0 26px 2px rgba(224,187,60,0.28);
      }
      .rr-paint::after{
        content:'';position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--honey);
        box-shadow:0 0 14px 2px rgba(224,187,60,.8);
      }

      /* the bike, riding at the head of the paint */
      .rr-bike{
        position:absolute;left:50%;top:0;width:110px;margin-left:-55px;z-index:6;
        pointer-events:none;will-change:transform;
        filter:drop-shadow(0 12px 16px rgba(0,0,0,.75));
      }
      .rr-bike img{width:100%;display:block}
      .rr-bike::after{
        content:'';position:absolute;left:50%;bottom:-6px;width:70px;height:12px;margin-left:-35px;
        border-radius:50%;filter:blur(3px);
        background:radial-gradient(ellipse,rgba(0,0,0,.55),transparent 70%);
      }

      /* ── one stop ── */
      .rr-stops{position:relative;display:flex;flex-direction:column;gap:clamp(22px,4vh,40px)}
      .rr-stop{display:grid;grid-template-columns:1fr var(--lane) 1fr;align-items:center}
      /* Both children are pinned to row 1. Without it the card on a right-hand
         stop takes column 3, which walks the auto-placement cursor past the end
         of the row, and the pin — asking for column 2 behind it — drops onto a
         second row and sits under the card instead of beside it. */
      .rr-stop .rr-card{
        grid-column:1;grid-row:1;margin-right:26px;opacity:0;transform:translateX(-38px) rotate(-1deg);
        transition:opacity .7s var(--ease),transform .7s var(--ease),
                   border-color .35s,box-shadow .45s var(--ease);
      }
      .rr-stop:nth-child(even) .rr-card{
        grid-column:3;margin-right:0;margin-left:26px;transform:translateX(38px) rotate(1deg);
      }
      .rr-stop.rr-in .rr-card{opacity:1;transform:none}

      /* the pin on the road */
      .rr-pin{
        grid-column:2;grid-row:1;align-self:center;justify-self:center;position:relative;z-index:5;
        width:var(--lane);height:var(--lane);display:grid;place-items:center;
      }
      .rr-pin i{
        width:13px;height:13px;border-radius:50%;background:${CARD};border:2px solid ${BD2};
        transition:.45s var(--ease);
      }
      .rr-stop.rr-in .rr-pin i{
        background:var(--honey);border-color:var(--honey);transform:scale(1.15);
        box-shadow:0 0 0 5px rgba(224,187,60,.16),0 0 20px 2px rgba(224,187,60,.55);
      }
      .rr-pin::after{
        content:'';position:absolute;inset:6px;border-radius:50%;
        border:1px solid var(--honey);opacity:0;
      }
      .rr-stop.rr-in .rr-pin::after{animation:rr-ping 2.6s var(--ease) infinite}
      @keyframes rr-ping{
        0%{transform:scale(.7);opacity:.7}
        70%,100%{transform:scale(2.3);opacity:0}
      }
      .rr-pin b{
        position:absolute;top:-16px;left:50%;transform:translateX(-50%);white-space:nowrap;
        font-family:var(--mono);font-size:0.48rem;letter-spacing:0.12em;color:${D3};
      }

      /* ── the card ── */
      /* the whole card is the link to the vlog's page, so it has to shed the
         anchor defaults and pass its own colours down */
      .rr-card{
        position:relative;background:${CARD2};border:1px solid ${BD};border-radius:12px;
        overflow:hidden;display:grid;grid-template-columns:minmax(0,132px) minmax(0,1fr);
        text-decoration:none;color:inherit;
      }
      .rr-card:focus-visible{
        outline:none;border-color:var(--honey);
        box-shadow:0 0 0 3px rgba(224,187,60,.28);
      }
      .rr-stop.rr-in .rr-card:hover{
        border-color:rgba(224,187,60,.5);
        box-shadow:0 22px 40px -22px #000,0 0 0 1px rgba(224,187,60,.28);
      }
      .rr-stop:nth-child(even) .rr-card{grid-template-columns:minmax(0,1fr) minmax(0,132px)}
      .rr-stop:nth-child(even) .rr-shot{order:2}

      .rr-shot{position:relative;background:#000;min-height:112px;overflow:hidden}
      .rr-shot img,.rr-shot video{
        position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
        transition:transform .7s var(--ease);
      }
      .rr-card:hover .rr-shot img{transform:scale(1.07)}
      .rr-shot video{opacity:0;transition:opacity .45s ease}
      .rr-card.rr-roll .rr-shot video{opacity:1}
      .rr-dur{
        position:absolute;right:5px;bottom:5px;font-family:var(--mono);font-size:0.5rem;
        padding:2px 6px;border-radius:3px;background:rgba(0,0,0,.8);color:#fff;
      }
      .rr-pl{
        position:absolute;inset:0;display:grid;place-items:center;opacity:0;transition:.35s;
        background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.45));
      }
      .rr-card:hover .rr-pl{opacity:1}
      .rr-pl svg{width:15px;height:15px;fill:#fff;filter:drop-shadow(0 2px 6px #000)}
      /* no video on this stop yet */
      .rr-soon{
        position:absolute;left:5px;bottom:5px;font-family:var(--mono);font-size:0.46rem;
        letter-spacing:0.14em;text-transform:uppercase;padding:2px 6px;border-radius:3px;
        background:rgba(0,0,0,.75);color:var(--honey);border:1px solid rgba(224,187,60,.35);
      }
      /* the tile still has to fill when a stop has no picture at all */
      .rr-shot:empty,.rr-shot:has(> .rr-soon:only-child){
        background:linear-gradient(135deg,#241f33,#191527 60%,#1f1a2d);
      }

      .rr-tx{
        padding:13px 15px 14px;min-width:0;display:flex;flex-direction:column;gap:6px;
        justify-content:center;
      }
      .rr-top{
        display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:0.5rem;
        letter-spacing:0.16em;text-transform:uppercase;color:var(--honey);
      }
      .rr-top s{text-decoration:none;color:${D3}}
      /* published titles run long — two lines is the card's budget */
      .rr-tx h4{
        font-size:0.9rem;font-weight:700;color:${OFF};line-height:1.32;margin:0;overflow:hidden;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
      }
      .rr-tx p{
        font-size:0.73rem;line-height:1.6;color:${D2};margin:0;overflow:hidden;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
      }
      .rr-foot{
        display:flex;align-items:center;gap:9px;margin-top:2px;font-family:var(--mono);
        font-size:0.5rem;letter-spacing:0.12em;color:${D3};
      }
      /* the call to action reads as a link, but the card is what carries it */
      .rr-cta{
        margin-left:auto;color:${ACC2};font-size:0.62rem;letter-spacing:0;
        font-family:var(--sans);font-weight:600;white-space:nowrap;
        transition:color .25s,transform .25s var(--ease);
      }
      .rr-cta span{display:inline-block;transition:transform .25s var(--ease)}
      .rr-card:hover .rr-cta,.rr-card:focus-visible .rr-cta{color:var(--honey)}
      .rr-card:hover .rr-cta span{transform:translateX(4px)}

      /* ── the board at the end of the road ── */
      .rr-finish{margin-top:30px;display:flex;justify-content:center}
      .rr-finish a{
        position:relative;display:flex;align-items:center;gap:14px;padding:14px 22px;
        border-radius:12px;background:${CARD2};border:1px solid rgba(224,187,60,.28);
        text-decoration:none;overflow:hidden;transition:.35s var(--ease);
      }
      .rr-finish a:hover{
        transform:translateY(-3px);border-color:var(--honey);
        box-shadow:0 22px 40px -20px #000,0 0 0 1px rgba(224,187,60,.4);
      }
      /* chequered edge, the way a finish board is marked */
      .rr-finish a::before{
        content:'';position:absolute;left:0;top:0;bottom:0;width:9px;
        background:repeating-conic-gradient(${OFF} 0 25%,#161018 0 50%) 0 0/9px 9px;
      }
      .rr-n{
        padding-left:8px;font-family:var(--mono);font-size:1.2rem;font-weight:700;
        color:var(--honey);line-height:1;
      }
      .rr-ftx{padding-left:8px}
      .rr-n + .rr-ftx{padding-left:0}
      .rr-ftx b{display:block;font-size:0.84rem;font-weight:700;color:${OFF}}
      .rr-ftx s{
        display:block;text-decoration:none;font-family:var(--mono);font-size:0.5rem;
        letter-spacing:0.16em;text-transform:uppercase;color:${D3};margin-top:4px;
      }
      .rr-arrow{font-size:1.05rem;color:var(--honey);transition:transform .35s var(--ease)}
      .rr-finish a:hover .rr-arrow{transform:translateX(5px)}

      /* ── nothing filmed yet ── */
      .rr-empty{
        position:relative;border:1px dashed ${BD2};border-radius:12px;background:${CARD2};
        padding:clamp(34px,6vw,58px) 24px;text-align:center;display:flex;flex-direction:column;
        align-items:center;gap:11px;overflow:hidden;margin-top:18px;
      }
      .rr-lane{
        position:absolute;left:50%;top:0;bottom:0;width:38px;margin-left:-19px;
        background:#191527;opacity:.55;
      }
      .rr-lane i{
        position:absolute;left:50%;top:0;bottom:0;width:3px;margin-left:-1.5px;
        background:repeating-linear-gradient(180deg,rgba(255,255,255,.3) 0 16px,transparent 16px 34px);
        animation:rr-run 1.4s linear infinite;
      }
      @keyframes rr-run{to{transform:translateY(34px)}}
      .rr-empty > *:not(.rr-lane){position:relative;z-index:2}
      .rr-ico{font-size:2rem;animation:rr-bob 2.6s ease-in-out infinite}
      @keyframes rr-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      .rr-lab{
        font-size:0.6rem;letter-spacing:0.22em;text-transform:uppercase;
        color:var(--honey);font-weight:700;
      }
      .rr-empty p{font-size:0.8rem;color:${D2};max-width:420px;line-height:1.65;margin:0}

      /* ── the road moves to the left edge once there is no room either side ── */
      @media(max-width:820px){
        .rr-sec{--lane:26px}
        .rr-route{padding-left:6px}
        .rr-road{left:20px;margin-left:0}
        .rr-bike{left:20px;width:74px;margin-left:-37px}
        .rr-stop{grid-template-columns:var(--lane) minmax(0,1fr)}
        .rr-pin{grid-column:1}
        .rr-stop .rr-card,
        .rr-stop:nth-child(even) .rr-card{
          grid-column:2;margin:0 0 0 18px;transform:translateX(26px);
          grid-template-columns:minmax(0,110px) minmax(0,1fr);
        }
        .rr-stop.rr-in .rr-card{transform:none}
        .rr-stop:nth-child(even) .rr-shot{order:0}
      }

      /* The stops are content, so they still arrive — they just stop sliding,
         and the bike stops turning. */
      @media(prefers-reduced-motion:reduce){
        .rr-sec *{animation:none !important;transition-duration:.001s !important}
        .rr-stop .rr-card,
        .rr-stop:nth-child(even) .rr-card{opacity:1;transform:none}
      }
    `}</style>
  )
}
