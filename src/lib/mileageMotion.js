/* ══════════════════════════════════════════════════════════════════
   MILEAGE · MOTION — the shared motion library the forecourt scene
   runs on. Copied from Preview/mileage-motion.js with nothing changed
   but the last line: the preview pages load it as a classic script and
   read it off the window, the app imports it.
   ══════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════
   MILEAGE · MOTION — the shared motion library for designs 7-12.

   The first six designs animate with CSS transitions and hand-picked
   cubic-beziers. That is fine for a fade, and it is the wrong tool for
   anything with weight: a bezier has no memory, so it cannot be
   interrupted, retargeted, or thrown. Everything in batch two runs on
   the primitives below instead.

     Spring    a real integrator — mass, stiffness, damping — stepped at
               a fixed 1/240 s so the motion is identical at 60, 120 or
               144 Hz, and retargetable mid-flight without a jump.
     Lag       a ring buffer of a driver's past positions, so a follower
               genuinely trails it rather than easing to the same place
               a bit later. This is what follow-through actually is.
     flip      First, Last, Invert, Play. Measure both layouts, animate
               the difference. Nothing ever jumps to a new position.
     arc       a quadratic path, so things travel on curves. Almost
               nothing in the physical world moves in a straight line.

   One rAF drives every spring on the page, not one per spring, and it
   stops itself when everything has settled.

   Deliberately a CLASSIC script exposing one `MM` global, not an ES
   module: these previews are opened straight off the file system, and
   Chrome blocks module imports on a file:// origin.
   ══════════════════════════════════════════════════════════════════════ */

const MM = (function () {
  'use strict'

  /* ── the shared clock ──────────────────────────────────────────────
     A fixed-timestep accumulator. Variable-dt integration is unstable
     at high stiffness — the same spring blows up on a 144 Hz monitor
     and crawls in a throttled tab. Fixed steps make the result the same
     everywhere, and the leftover is carried into the next frame. */
  const live = new Set()
  let raf = 0
  let prev = 0
  const STEP = 1 / 240
  const MAX_FRAME = 1 / 20      // a long stall integrates 50 ms, not 3 s

  function tick(now) {
    const dt = Math.min((now - prev) / 1000, MAX_FRAME)
    prev = now
    for (const s of live) s._advance(dt)
    raf = live.size ? requestAnimationFrame(tick) : 0
  }
  function wake() {
    if (raf) return
    prev = performance.now()
    raf = requestAnimationFrame(tick)
  }

  /* ── Spring ────────────────────────────────────────────────────────
     Semi-implicit Euler. `stiffness` is how hard it pulls toward the
     target, `damping` how much it resists moving, `mass` how much it
     resents being asked. Defaults are tuned for interface work: quick,
     one soft overshoot, no ringing.

     `.to()` retargets without discontinuity — the current velocity is
     kept, which is the whole reason to use a spring over a tween.
     `.kick()` adds velocity, so a thing can be thrown. */
  class Spring {
    constructor(opts) {
      opts = opts || {}
      this.k = opts.stiffness != null ? opts.stiffness : 170
      this.c = opts.damping != null ? opts.damping : 22
      this.m = opts.mass != null ? opts.mass : 1
      this.x = opts.from != null ? opts.from : 0
      this.v = 0
      this.target = opts.to != null ? opts.to : this.x
      /* below these a spring is visually at rest, and keeping the rAF
         alive for it costs a frame a tick forever */
      this.epsX = opts.epsilon != null ? opts.epsilon : 0.0015
      this.epsV = opts.epsilonV != null ? opts.epsilonV : 0.015
      this._subs = []
      this._done = []
      this._acc = 0
      this.settled = true
    }

    onChange(fn) { this._subs.push(fn); return this }
    onSettle(fn) { this._done.push(fn); return this }

    to(target) {
      if (target === this.target && !this.settled) return this
      this.target = target
      this.settled = false
      live.add(this); wake()
      return this
    }

    /* jump there with no motion at all — the reduced-motion path, and
       the right thing to do on a resize */
    snap(target) {
      this.target = this.x = target
      this.v = 0
      this.settled = true
      live.delete(this)
      this._emit()
      return this
    }

    kick(velocity) {
      this.v += velocity
      this.settled = false
      live.add(this); wake()
      return this
    }

    /* drive it by hand — dragging, scrubbing */
    hold(x) {
      this.v = 0
      this.x = x
      this._emit()
      return this
    }

    _advance(dt) {
      this._acc += dt
      let n = 0
      while (this._acc >= STEP && n++ < 64) {
        const f = -this.k * (this.x - this.target) - this.c * this.v
        this.v += (f / this.m) * STEP
        this.x += this.v * STEP
        this._acc -= STEP
      }
      if (Math.abs(this.x - this.target) < this.epsX && Math.abs(this.v) < this.epsV) {
        this.x = this.target
        this.v = 0
        this.settled = true
        live.delete(this)
        this._emit()
        for (const fn of this._done) fn(this.x)
        return
      }
      this._emit()
    }

    _emit() { for (const fn of this._subs) fn(this.x, this.v) }
  }

  /* ── Lag ───────────────────────────────────────────────────────────
     A follower reads the driver's position from N frames ago. That is
     what makes a trailer follow a car rather than arrive beside it: the
     follower is not heading for the target, it is heading for where the
     driver WAS. Cheap, and it looks right in a way an eased delay does
     not — the shape of the motion is preserved, not merely shifted. */
  class Lag {
    constructor(frames) {
      this.n = Math.max(1, (frames || 6) | 0)
      this.buf = new Float64Array(this.n)
      this.i = 0
      this.primed = false
    }
    push(v) {
      if (!this.primed) { this.buf.fill(v); this.primed = true }
      this.buf[this.i] = v
      this.i = (this.i + 1) % this.n
      return this.buf[this.i]        // the oldest sample = N frames ago
    }
    reset(v) { this.buf.fill(v || 0); this.primed = false }
  }

  /* ── squash & stretch ──────────────────────────────────────────────
     Volume-preserving: what a body gains in one axis it gives up in the
     other, so it deforms rather than merely scaling. Driven by velocity
     and clamped, because exaggeration stops being appeal and starts
     being a rendering bug somewhere past about fifteen percent. */
  function squash(velocity, amount, limit) {
    amount = amount != null ? amount : 0.00035
    limit = limit != null ? limit : 0.14
    const s = Math.max(-limit, Math.min(limit, velocity * amount))
    return { sx: 1 - s, sy: 1 + s }
  }

  /* ── curves ────────────────────────────────────────────────────────
     Named, because a curve with a name gets reused and a curve typed
     inline gets guessed at. Nothing here is linear: the only thing in
     an interface that should move linearly is something that genuinely
     is a machine. */
  const EASE = {
    /* the workhorse — leaves fast, arrives slow */
    out: 'cubic-bezier(.22, 1, .36, 1)',
    /* pulls back before it goes, for a move that needs to be noticed */
    anticipate: 'cubic-bezier(.68, -.4, .27, 1.2)',
    /* overshoots and returns, for bounce that does not need a spring */
    overshoot: 'cubic-bezier(.34, 1.56, .64, 1)',
    /* symmetric, for something already moving that changes direction */
    inOut: 'cubic-bezier(.65, 0, .35, 1)',
    /* sharp exit for something leaving that is not coming back */
    exit: 'cubic-bezier(.4, 0, 1, 1)',
  }

  /* ── FLIP ──────────────────────────────────────────────────────────
     Measure where things are, let the layout change, measure again, put
     them back where they were with a transform, then release. The
     browser only ever animates transform and opacity — never width, top
     or left — so a full re-pack costs the compositor nothing.

     `mutate` may be any DOM change at all: reordering, re-parenting,
     changing the grid. Elements absent from the first measurement grow
     in from where they land; nothing is ever cross-faded. */
  function flip(els, mutate, opts) {
    opts = opts || {}
    const duration = opts.duration != null ? opts.duration : 620
    const easing = opts.easing || EASE.out
    const stag = opts.stagger || 0
    const list = Array.prototype.slice.call(els)

    const first = new Map()
    for (const el of list) first.set(el, el.getBoundingClientRect())

    mutate()

    if (opts.reduced) return Promise.resolve()

    const anims = []
    list.forEach(function (el, i) {
      const last = el.getBoundingClientRect()
      const f = first.get(el)
      if (!f || (!f.width && !f.height)) {
        anims.push(el.animate(
          [{ transform: 'scale(.86)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: duration * 0.7, easing: easing, delay: i * stag + duration * 0.25, fill: 'both' },
        ))
        return
      }
      const dx = f.left - last.left
      const dy = f.top - last.top
      const sx = last.width ? f.width / last.width : 1
      const sy = last.height ? f.height / last.height : 1
      if (!dx && !dy && Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return
      anims.push(el.animate(
        [
          { transformOrigin: 'top left', transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + sx + ', ' + sy + ')' },
          { transformOrigin: 'top left', transform: 'none' },
        ],
        { duration: duration, easing: easing, delay: i * stag, fill: 'both' },
      ))
    })
    return Promise.all(anims.map(function (a) { return a.finished.catch(function () {}) }))
  }

  /* ── arcs ──────────────────────────────────────────────────────────
     A quadratic through two points, bent perpendicular to the line
     between them. `bend` is a signed fraction of the span, so a row of
     things arriving can alternate and not look mechanical. */
  function arc(x0, y0, x1, y1, bend) {
    bend = bend != null ? bend : 0.3
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    const dx = x1 - x0
    const dy = y1 - y0
    const cx = mx - dy * bend
    const cy = my + dx * bend
    return function (t) {
      const u = 1 - t
      return {
        x: u * u * x0 + 2 * u * t * cx + t * t * x1,
        y: u * u * y0 + 2 * u * t * cy + t * t * y1,
        /* the tangent, so a thing can bank into its own turn */
        angle: Math.atan2(
          2 * u * (cy - y0) + 2 * t * (y1 - cy),
          2 * u * (cx - x0) + 2 * t * (x1 - cx),
        ) * 180 / Math.PI,
      }
    }
  }

  /* the same curve as an SVG `d`, for drawing the path a thing took */
  function arcPath(x0, y0, x1, y1, bend) {
    bend = bend != null ? bend : 0.3
    const cx = (x0 + x1) / 2 - (y1 - y0) * bend
    const cy = (y0 + y1) / 2 + (x1 - x0) * bend
    return 'M ' + x0 + ' ' + y0 + ' Q ' + cx + ' ' + cy + ' ' + x1 + ' ' + y1
  }

  /* ── staggering ────────────────────────────────────────────────────
     Delays for a group. `from` picks where the wave starts. The point is
     that a group should never arrive as a block: the eye reads a wave as
     one movement, and a block as a jump cut. */
  function stagger(count, opts) {
    opts = opts || {}
    const each = opts.each != null ? opts.each : 45
    const from = opts.from || 'start'
    const out = new Array(count)
    for (let i = 0; i < count; i++) {
      let rank
      if (from === 'end') rank = count - 1 - i
      else if (from === 'center') rank = Math.abs(i - (count - 1) / 2)
      else if (from === 'edges') rank = (count - 1) / 2 - Math.abs(i - (count - 1) / 2)
      else rank = i
      out[i] = rank * each
    }
    return out
  }

  /* ── timing ────────────────────────────────────────────────────────
     A tiny sequencer, because the difference between motion that reads
     as directed and motion that reads as busy is mostly the pauses. A
     hold is a real instruction here, not the absence of one: pass a
     bare number and nothing happens for that many milliseconds. */
  function sequence(steps, opts) {
    opts = opts || {}
    const rate = opts.rate || 1
    const timers = []
    let t = 0
    for (const s of steps) {
      if (typeof s === 'number') { t += s; continue }
      const at = Array.isArray(s) ? s[0] : 0
      const fn = Array.isArray(s) ? s[1] : s
      t += at
      timers.push(setTimeout(fn, t / rate))
    }
    if (opts.onDone) timers.push(setTimeout(opts.onDone, t / rate))
    return function cancel() { timers.forEach(clearTimeout) }
  }

  /* ── velocity from a pointer ───────────────────────────────────────
     Sampled over a short window rather than frame to frame — a single
     frame's delta is mostly noise, and a flick judged on it throws
     wildly. */
  function tracker() {
    let samples = []
    return {
      add(v) {
        const now = performance.now()
        samples.push([now, v])
        while (samples.length > 1 && now - samples[0][0] > 90) samples.shift()
      },
      velocity() {
        if (samples.length < 2) return 0
        const a = samples[0]
        const b = samples[samples.length - 1]
        const dt = (b[0] - a[0]) / 1000
        return dt > 0 ? (b[1] - a[1]) / dt : 0
      },
      reset() { samples = [] },
    }
  }

  return {
    Spring, Lag, squash, flip, arc, arcPath, stagger, sequence, tracker, EASE,
    REDUCED: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
})()

export default MM
