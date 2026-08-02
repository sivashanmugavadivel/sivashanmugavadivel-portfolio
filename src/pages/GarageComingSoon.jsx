import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

/* ── Delivery stages ──────────────────────────────────────────────
   Move `status` along as things progress: 'done' → 'active' → 'todo'.
   The connector fill, the road, and the status pill all derive from
   whichever stage is marked 'active', so this array is the only thing
   to edit.

   `showBike` is where the bike itself lives — it was built at that
   stage, so that is where the model sits, whatever the status.
   ──────────────────────────────────────────────────────────────── */
const STAGES = [
  { key: 'booked',     icon: '📋', label: 'Booking Confirmed',      note: '22 July 2026',    status: 'done' },
  { key: 'building',   icon: '🔧', label: 'Building Bike',          note: '28 July 2026',    status: 'done', showBike: true },
  { key: 'dispatched', icon: '🏬', label: 'Dispatched to Showroom', note: 'Arrives 31 July', status: 'active' },
  { key: 'delivered',  icon: '🏁', label: 'Delivered',              note: '2 Aug 2026',      status: 'todo' },
]

const ACTIVE_INDEX = Math.max(0, STAGES.findIndex(s => s.status === 'active'))

/* The leg the shipment is currently on: the one leaving the last
   finished stage. That is the leg drawn as a road with a truck on it. */
const ROAD_LEG = ACTIVE_INDEX - 1

/* ── Bike assembly ────────────────────────────────────────────────
   The real Bear 650 product shot, sliced into part regions that fly
   in one by one — wheels, engine, frame, tank, front end.

   The six regions tile the 800×501 source exactly, so however rough
   the mid-flight arrangement looks, the assembled state is always a
   pixel-perfect reconstruction of the photo. Each part is a div with
   the photo as its background, offset so only its own region shows.
   ──────────────────────────────────────────────────────────────── */
const BUILD_SRC = `${import.meta.env.BASE_URL}bear650/wild-honey01.png`
const BIKE_W = 800
const BIKE_H = 501
const ASSEMBLE_MS = 3600     // one full build pass, then it replays

/* Where the bike actually sits inside its frame, measured off the source
   PNG. The tracker needs both, to stand the bike on the ground line and
   to keep the road clear of it.

   Frame 01 is not centred in its canvas: the bodywork runs x 59…728 and
   y 7…430 of 800 × 501, so there is far more empty space below the tyres
   than above the mirrors. */
const BIKE_GROUND = 0.858    // tyre bottoms, as a fraction of frame height
const BIKE_HALF = 0.427      // bodywork half-width, as a fraction of frame width

/* x/y/w/h are source pixels; dx/dy is where the part flies in from */
const BIKE_PARTS = [
  { key: 'rear-wheel',  x: 0,   y: 200, w: 270, h: 301, dx: -95, dy:  40 },
  { key: 'front-wheel', x: 505, y: 200, w: 295, h: 301, dx:  95, dy:  40 },
  { key: 'engine',      x: 270, y: 200, w: 235, h: 301, dx:   0, dy:  85 },
  { key: 'frame-seat',  x: 0,   y: 0,   w: 340, h: 200, dx: -45, dy: -85 },
  { key: 'fuel-tank',   x: 340, y: 0,   w: 220, h: 200, dx:   0, dy: -95 },
  { key: 'front-end',   x: 560, y: 0,   w: 240, h: 200, dx:  75, dy: -70 },
]

const partVariants = {
  hidden: ({ dx, dy }) => ({ opacity: 0, x: dx, y: dy, scale: 0.94 }),
  show: {
    opacity: 1, x: 0, y: 0, scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
}

function BuildingBike({ height = 170 }) {
  const reduce = useReducedMotion()
  const [cycle, setCycle] = useState(0)

  /* Re-keying the group replays the entry animation. Simpler and better
     synced than looping each part's keyframes independently. */
  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setCycle(c => c + 1), ASSEMBLE_MS)
    return () => clearInterval(id)
  }, [reduce])

  const k = height / BIKE_H          // source pixels → screen pixels
  const box = { position: 'relative', height, width: BIKE_W * k }

  const partStyle = p => ({
    position: 'absolute',
    left: p.x * k,
    top: p.y * k,
    width: p.w * k,
    height: p.h * k,
    backgroundImage: `url(${BUILD_SRC})`,
    backgroundSize: `${BIKE_W * k}px ${BIKE_H * k}px`,
    backgroundPosition: `-${p.x * k}px -${p.y * k}px`,
    backgroundRepeat: 'no-repeat',
  })

  if (reduce) {
    return (
      <div style={box} role="img" aria-label="Royal Enfield Bear 650">
        <img src={BUILD_SRC} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    )
  }

  return (
    <div style={box} role="img" aria-label="Royal Enfield Bear 650 being assembled">
      {/* faint ghost of the whole bike, so parts have somewhere to land */}
      <img
        src={BUILD_SRC}
        alt=""
        aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.09 }}
      />

      <motion.div
        key={cycle}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.2, delayChildren: 0.15 } } }}
        initial="hidden"
        animate="show"
        style={{ position: 'absolute', inset: 0 }}
      >
        {BIKE_PARTS.map(p => (
          <motion.div
            key={p.key}
            variants={partVariants}
            custom={{ dx: p.dx * k, dy: p.dy * k }}
            style={partStyle(p)}
          />
        ))}
      </motion.div>
    </div>
  )
}

/* ── The bike's own node ──────────────────────────────────────────
   Where the bike was built, so where the model lives. Mid-build it is
   still flying together; once that stage is signed off it just sits
   there, finished, with a tick pinned to it.
   ──────────────────────────────────────────────────────────────── */
function BikeNode({ stage, height }) {
  const reduce = useReducedMotion()
  if (stage.status === 'active') return <BuildingBike height={height} />

  return (
    <div style={{ position: 'relative', width: height * (BIKE_W / BIKE_H), height }}>
      <motion.img
        src={BUILD_SRC}
        alt=""
        draggable={false}
        animate={reduce ? undefined : { y: [0, -3, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
        role="img"
        aria-label="Royal Enfield Bear 650, built"
      />
      {/* kept above BIKE_GROUND, so the badge does not dangle below the
          line the bike is standing on */}
      <span
        aria-hidden
        style={{
          position: 'absolute', right: '3%', bottom: `${(1 - BIKE_GROUND) * 100 + 2}%`,
          width: height * 0.19, height: height * 0.19, borderRadius: '50%',
          background: GREEN, boxShadow: `0 0 12px ${GREEN}77`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg
          width={height * 0.11} height={height * 0.11} viewBox="0 0 24 24"
          fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M4 12.5 L9.5 18 L20 6" />
        </svg>
      </span>
    </div>
  )
}

/* ── Delivery truck ───────────────────────────────────────────────
   Drawn rather than an emoji, so it can be sized to the road, take the
   site accent on its cargo box, and have wheels that actually turn.

   The viewBox is set so the wheels touch its bottom edge — sit the SVG
   directly on top of the road strip and it lands on the surface.
   ──────────────────────────────────────────────────────────────── */
const TRUCK_VB_W = 68
const TRUCK_VB_H = 34
const WHEELS = [13, 46]        // wheel centres along the viewBox

function DeliveryTruck({ height, spin = true }) {
  return (
    <svg
      viewBox={`0 0 ${TRUCK_VB_W} ${TRUCK_VB_H}`}
      height={height}
      width={height * (TRUCK_VB_W / TRUCK_VB_H)}
      aria-hidden
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* exhaust, puffing off the back as it goes */}
      {spin && [0, 1].map(i => (
        <motion.circle
          key={i}
          cy={17}
          fill="var(--text)"
          animate={{ cx: [2, -9], r: [1.3, 4.2], opacity: [0.32, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: i * 0.6 }}
        />
      ))}

      {/* cargo box */}
      <rect x="3" y="4" width="36" height="21" rx="2" fill="var(--accent)" />
      <rect x="3" y="10.5" width="36" height="1.6" fill="#000" opacity="0.16" />
      <rect x="9" y="14" width="14" height="7" rx="1" fill="#fff" opacity="0.82" />

      {/* cab, windscreen and headlight */}
      <path d="M39 10 L47 10 L54 17.5 L54 25 L39 25 Z" fill="var(--accent)" />
      <path d="M39 10 L47 10 L54 17.5 L39 17.5 Z" fill="#000" opacity="0.22" />
      <path d="M45.4 11.6 L46.9 11.6 L51.4 16.6 L45.4 16.6 Z" fill="#dCE7F5" opacity="0.9" />
      <circle cx="52.6" cy="22" r="1.5" fill="#ffd85a" />

      {/* chassis */}
      <rect x="3" y="25" width="51" height="2.6" rx="1" fill="#22202a" />

      {WHEELS.map(cx => (
        <motion.g
          key={cx}
          animate={spin ? { rotate: 360 } : undefined}
          transition={{ duration: 0.55, repeat: Infinity, ease: 'linear' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <circle cx={cx} cy="29.5" r="4.5" fill="#1b1922" />
          <circle cx={cx} cy="29.5" r="1.9" fill="#8d8a99" />
          <path
            d={`M${cx - 3.2} ${29.5} H${cx + 3.2} M${cx} ${26.3} V${32.7}`}
            stroke="#5d5a6b"
            strokeWidth="0.9"
          />
        </motion.g>
      ))}
    </svg>
  )
}

/* ── The road ─────────────────────────────────────────────────────
   Replaces the plain connector on whichever leg the bike is travelling.
   Two stacked pieces: a strip of asphalt sitting on the node centre
   line, and a truck driving along on top of it.

   Asphalt stays dark on both themes, because a road is dark. The lane
   dashes do not scroll — the road is what is standing still here, and
   the truck is what is moving.
   ──────────────────────────────────────────────────────────────── */
function RoadLeg({ left, len, groundY }) {
  const reduce = useReducedMotion()

  /* both sized off the road's own length, not the column, because the road
     gets shortened wherever it has to keep clear of the bike */
  const roadH = Math.max(6, Math.min(11, len * 0.075))
  const truckH = Math.max(14, Math.min(26, len * 0.17))
  const truckW = truckH * (TRUCK_VB_W / TRUCK_VB_H)

  return (
    <>
      {/* asphalt */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left, width: len,
          top: groundY - roadH / 2, height: roadH,
          borderRadius: 2, overflow: 'hidden',
          background: 'linear-gradient(180deg, #4b4857 0 30%, #322f3c 30% 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09)',
        }}
      >
        {/* lane dashes down the middle of the surface */}
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5,
            marginTop: -0.75,
            backgroundImage: 'repeating-linear-gradient(90deg, #cfc9b4 0 9px, transparent 9px 20px)',
            opacity: 0.55,
          }}
        />
      </div>

      {/* the truck, riding on the surface */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left, width: len,
          top: groundY - roadH / 2 - truckH, height: truckH,
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={
            reduce
              ? { x: len * 0.5 - truckW / 2 }
              : { x: [-truckW, len], y: [0, -0.9, 0], opacity: [0, 1, 1, 0] }
          }
          transition={
            reduce
              ? { duration: 0 }
              : {
                  x: { duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 0.7 },
                  opacity: {
                    duration: 5, times: [0, 0.07, 0.9, 1],
                    repeat: Infinity, ease: 'linear', repeatDelay: 0.7,
                  },
                  y: { duration: 0.42, repeat: Infinity, ease: 'easeInOut' },
                }
          }
          style={{ position: 'absolute', left: 0, bottom: 0 }}
        >
          <DeliveryTruck height={truckH} spin={!reduce} />
        </motion.div>
      </div>
    </>
  )
}

/* The stage under way — an accent node with a ring going out of it. */
function ActiveNode({ size, icon }) {
  const reduce = useReducedMotion()
  return (
    <span
      style={{
        position: 'relative', width: size, height: size, flex: 'none',
        borderRadius: '50%', background: 'var(--accent-bg)',
        border: '2px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.46,
        boxShadow: '0 0 20px rgba(124,58,237,0.35)',
      }}
    >
      {!reduce && (
        <motion.span
          aria-hidden
          animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '2px solid var(--accent)' }}
        />
      )}
      {icon}
    </span>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

/* ── Stage tracker ───────────────────────────────────────────────── */
const GREEN = '#22c55e'
const NODE = 52

/* ── Under-construction sign ──────────────────────────────────────
   The source GIF only animated its two beacon lamps, and came on a
   white studio background. So it is one background-removed frame with
   the lamp flashes recreated as CSS glows — transparent on both
   themes, one 30 KB PNG instead of a 41 KB looping GIF.
   ──────────────────────────────────────────────────────────────── */
const UC_SRC = `${import.meta.env.BASE_URL}under-construction.png`
const UC_RATIO = 400 / 450
/* lamp centres as a % of the artwork, measured off the frame */
const UC_LAMPS = [
  { left: 19.6, top: 23.3, size: 0.3, delay: 0 },
  { left: 59.6, top: 26.5, size: 0.24, delay: 0.55 },
]

function UnderConstructionSign({ width = 220 }) {
  const reduce = useReducedMotion()
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: 'clamp(10px, 2.5vw, 40px)',
        bottom: 'clamp(20px, 3vh, 36px)',
        width, height: width * UC_RATIO,
        pointerEvents: 'none', zIndex: 2,
      }}
    >
      <img src={UC_SRC} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
      {UC_LAMPS.map(l => {
        const s = width * l.size
        return (
          <motion.span
            key={l.left}
            animate={reduce ? undefined : { opacity: [0.12, 1, 0.12] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: l.delay }}
            style={{
              position: 'absolute',
              left: `${l.left}%`, top: `${l.top}%`,
              width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2,
              borderRadius: '50%', mixBlendMode: 'screen',
              background: 'radial-gradient(circle, rgba(255,216,90,0.95) 0%, rgba(255,186,32,0.4) 38%, transparent 70%)',
            }}
          />
        )
      })}
    </div>
  )
}

/* Completed step — the tick draws itself in, with a green ring pulsing out. */
function GreenTick({ size = NODE }) {
  const reduce = useReducedMotion()
  return (
    <span
      style={{
        position: 'relative', width: size, height: size, flex: 'none',
        borderRadius: '50%', background: GREEN, border: `2px solid ${GREEN}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 18px ${GREEN}66`,
      }}
    >
      {!reduce && (
        <motion.span
          aria-hidden
          animate={{ scale: [1, 1.55], opacity: [0.55, 0] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: `2px solid ${GREEN}` }}
        />
      )}
      <svg
        width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24"
        fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"
      >
        <motion.path
          d="M4 12.5 L9.5 18 L20 6"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.55, delay: 0.45, ease: 'easeOut' }}
        />
      </svg>
    </span>
  )
}

/* Viewport probe so the active node can be genuinely large on desktop
   without overflowing its grid column on a phone. */
function useIsWide(px = 900) {
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(min-width:${px}px)`).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(min-width:${px}px)`)
    const onChange = () => setWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [px])
  return wide
}

/* Measured container width, so node sizes can be derived from the space a
   column actually has rather than guessed at breakpoints. */
function useMeasuredWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(entries => setW(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

function StageTracker() {
  const [wrapRef, wrapW] = useMeasuredWidth()
  const legs = STAGES.length - 1

  /* Size hierarchy: the bike > active node > completed tick > pending
     circle. All of them come off the column width, so the ordering holds
     at every screen size. */
  const colW = (wrapW || 960) / STAGES.length
  /* deliberately under a full column: whatever the bike takes, the road
     next to it gives up, and the truck needs somewhere to travel */
  const bikeW = Math.min(colW * 0.86, 220)
  const bikeH = bikeW / (BIKE_W / BIKE_H)
  const doneSize = Math.max(24, Math.min(46, bikeH * 0.28))
  const todoSize = Math.max(20, Math.min(36, doneSize * 0.74))
  const activeSize = Math.max(32, Math.min(60, doneSize * 1.32))
  const maxNode = Math.max(doneSize, todoSize, activeSize)

  /* Everything stands on one line: the bike on its tyres, the truck on the
     road, the small nodes centred on it. That line is where the bike's
     tyres fall, so the connectors read as the ground rather than as a rail
     drawn through the middle of the bike. */
  const groundY = bikeH * BIKE_GROUND
  const rowH = Math.max(bikeH, groundY + maxNode / 2)

  /* Legs run node centre to node centre — except either side of the bike,
     where they stop short of it. Otherwise the connector would cross the
     bodywork, and the truck would spend a third of its run peeking through
     the gaps in the bike. */
  const bikeIndex = STAGES.findIndex(s => s.showBike)
  const clear = bikeW * BIKE_HALF + 6
  const legs_ = Array.from({ length: legs }, (_, i) => {
    const x0 = (i + 0.5) * colW + (i === bikeIndex ? clear : 0)
    const x1 = (i + 1.5) * colW - (i + 1 === bikeIndex ? clear : 0)
    return { i, x0, len: Math.max(24, x1 - x0) }
  })

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      {/* connectors behind the nodes, one per leg */}
      {legs_.map(({ i, x0, len }) => {
        if (i === ROAD_LEG) {
          return <RoadLeg key={`leg-${i}`} left={x0} len={len} groundY={groundY} />
        }
        /* travelled already, or still ahead */
        const doneLeg = i < ROAD_LEG
        return (
          <div
            key={`leg-${i}`}
            aria-hidden
            style={{
              position: 'absolute', left: x0, width: len,
              top: groundY - 2, height: 4, borderRadius: 999,
              background: 'var(--border)', overflow: 'hidden',
            }}
          >
            {doneLeg && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 + i * 0.25 }}
                style={{ height: '100%', borderRadius: 999, background: GREEN }}
              />
            )}
          </div>
        )
      })}

      <ol
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, position: 'relative' }}
      >
        {STAGES.map(stage => {
          const done = stage.status === 'done'
          const active = stage.status === 'active'
          const on = done || active
          return (
            <li
              key={stage.key}
              aria-current={active ? 'step' : undefined}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 0 }}
            >
              {/* fixed-height row, with the bike stood on the ground line and
                  the small nodes centred on it */}
              <div style={{ position: 'relative', width: '100%', height: rowH }}>
                {/* The bike sits at the stage it was built at, whatever that
                    stage's status — bare, with no plate or ring behind it. */}
                {stage.showBike ? (
                  <div
                    style={{
                      position: 'absolute', left: '50%', top: 0,
                      transform: 'translateX(-50%)',
                      width: bikeW, height: bikeH,
                    }}
                  >
                    <BikeNode stage={stage} height={bikeH} />
                  </div>
                ) : (
                  <div
                    style={{
                      position: 'absolute', left: '50%', top: groundY,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {done && <GreenTick size={doneSize} />}

                    {active && <ActiveNode size={activeSize} icon={stage.icon} />}

                    {!on && (
                      <span
                        style={{
                          width: todoSize, height: todoSize, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: todoSize * 0.42,
                          background: 'var(--card-bg)',
                          border: '2px solid var(--border)',
                          filter: 'grayscale(1)', opacity: 0.5,
                        }}
                      >
                        {stage.icon}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', padding: '0 4px' }}>
                <div
                  style={{
                    fontSize: active
                      ? 'clamp(0.82rem, 2.1vw, 1.02rem)'
                      : done
                        ? 'clamp(0.72rem, 1.8vw, 0.88rem)'
                        : 'clamp(0.66rem, 1.6vw, 0.78rem)',
                    fontWeight: on ? 700 : 500,
                    color: on ? 'var(--text-h)' : 'var(--text)',
                    lineHeight: 1.3,
                  }}
                >
                  {stage.label}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)',
                    color: done ? GREEN : active ? 'var(--accent)' : 'var(--text)',
                    opacity: on ? 1 : 0.7,
                    marginTop: 3,
                    fontWeight: done ? 600 : 400,
                  }}
                >
                  {stage.note}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function GarageComingSoon() {
  const current = STAGES[ACTIVE_INDEX]
  /* decorative, and it would crowd the content on a narrow screen */
  const roomForSign = useIsWide(1000)

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'var(--bg)',
        padding: '120px 24px 80px',
      }}
    >
      {/* Soft accent glow */}
      <motion.div
        animate={{ opacity: [0.25, 0.5, 0.25], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 'min(680px, 90vw)', height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 68%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', width: '100%', maxWidth: 960,
        }}
      >
        {/* Current stage pill */}
        <motion.div
          variants={item}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999, marginBottom: 22,
            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}
        >
          {current.icon} {current.label}
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={item}
          style={{
            margin: 0, fontWeight: 900, color: 'var(--text-h)',
            fontSize: 'clamp(2.4rem, 8vw, 4.5rem)', lineHeight: 1.02, letterSpacing: '-0.02em',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>Coming Soon</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={item}
          style={{
            margin: '20px 0 0', color: 'var(--text)', lineHeight: 1.7,
            fontSize: 'clamp(0.95rem, 2.4vw, 1.1rem)', maxWidth: 460,
          }}
        >
          The Bear 650 is built and on its way to the showroom. Follow the last
          stretch below — rides, gear, and the stories land here once it rolls
          home. 🏍️
        </motion.p>

        {/* Stage tracker */}
        <motion.div variants={item} style={{ width: '100%', marginTop: 42 }}>
          <StageTracker />
        </motion.div>

        {/* Back home */}
        <motion.div variants={item} style={{ marginTop: 46 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 26px', borderRadius: 999,
              background: 'var(--accent)', color: '#fff',
              fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </motion.div>
      </motion.div>

      {/* Under-construction sign, bottom-left */}
      {roomForSign && <UnderConstructionSign width={230} />}

      {/* Construction stripe at the very bottom */}
      <motion.div
        animate={{ backgroundPositionX: ['0px', '56px'] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 10,
          backgroundImage: 'repeating-linear-gradient(45deg, #f5b301 0 14px, #1a1a1a 14px 28px)',
          backgroundSize: '56px 56px', opacity: 0.85,
        }}
      />
    </motion.section>
  )
}
