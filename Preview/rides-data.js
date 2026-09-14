/* ══════════════════════════════════════════════════════════════════════
   RIDES — shared data for every rides-design-*.html in this folder.
   One file, so all six designs are judged on the same six rides.

   Mirrors public/mygarage/rideandroute/*.json as src/data/rides.js
   normalises it, flattened so each preview stays a standalone file you can
   open straight off the disk. Nothing imports this at build time.

   THREE THINGS TO DESIGN AROUND — all three are real, none are edge cases
   invented to be difficult:

   1. NO RIDE HAS A PHOTO. `photos` is empty on all six. A design that
      leans on imagery has nothing to lean on. What there is instead is
      real geography — every stop carries a true lat/lng, so routes can be
      plotted, bearings computed and distances measured rather than drawn.

   2. ONE RIDE 2026 HAS A SINGLE STOP. It is a global date, not a course —
      you ride wherever you like — so only `home` is fixed. No second stop
      means no route, no bearing, no map. Every design must render it as a
      first-class ride anyway. `mapped:false` marks it.

   3. ITS DISTANCE IS THE STRING "TBD". Not a number, not zero. `km` is 0
      and `tbd` is true; print `distance` verbatim and never arithmetic.

   Totals follow the real page: only COMPLETED rides are summed, which is
   why doneKm and aheadKm are kept apart.
   ══════════════════════════════════════════════════════════════════════ */

window.RD = (function () {

  const BASE = '../public/'

  /* ── the six ride files, verbatim (authoring notes stripped) ─────────── */

  const FILES = [
    {
      order: 10,
      id: 'bear-650-delivery',
      name: 'Bear 650 Delivery Day',
      subtitle: 'Senthur Motors, Dharapuram → Vattamalai Murugan Temple → Home (Kariya Kattu Valasu)',
      mode: 'completed',
      distance: '34 KM', time: '0:45', date: '3 Aug 2026', rating: null,
      fromCity: 'Dharapuram', toCity: 'Kangayam',
      states: ['Tamil Nadu'], color: '#ef4444',
      description: 'Off the showroom floor at Dharapuram, up to the Vattamalai hill temple, then home to Kangayam.',
      story: 'The first ride on the Bear 650, and the one that brought it home. Out of Senthur Motors at Dharapuram, north to the Arulmigu Muthukumaraswamy temple at Vattamalai for the first blessing, then the last stretch into Kariyakattu Valasu. Short, familiar roads — but the first time the bike and these roads met.',
      highlights: ['Delivery Day', 'Vattamalai Murugan Temple', 'First Ride Home'],
      via: ['Vattamalai Murugan Temple'],
      mapCenter: [10.87, 77.54], mapZoom: 11, photos: [],
      stops: [
        { id: 'dharapuram', label: 'Royal Enfield, Dharapuram', icon: 'showroom', lat: 10.73, lng: 77.52, dir: 'left' },
        { id: 'vattamalai', label: 'Vattamalai Murugan Temple', icon: 'temple', lat: 10.9456, lng: 77.5431, dir: 'right' },
        { id: 'kangayam', label: 'Kariya Kattu Valasu', icon: 'home', lat: 11.035075, lng: 77.618430, home: true, dir: 'left' },
      ],
    },
    {
      order: 11,
      id: 'r6',
      name: 'Bear 650 First Service',
      subtitle: 'Home (Kariya Kattu Valasu) → Kangayam → Avinashipalayam → Senthur Motors, Dharapuram',
      mode: 'completed',
      distance: '54 KM', time: null, date: '22 Aug 2026', rating: null,
      fromCity: 'Kariya Kattu Valasu', toCity: 'Royal Enfield Senthur Motors, Dharapuram',
      states: ['Tamil Nadu'], color: '#14b8a6',
      description: 'Back to the showroom the Bear came from, for its first service.',
      story: 'The first service run — out of Kariya Kattu Valasu through Kangayam and Avinashipalayam, and down to Senthur Motors at Dharapuram, the same showroom the bike was delivered from. The delivery ride came the other way up this road on day one.',
      highlights: ['First Service', 'Senthur Motors', 'Avinashipalayam Road', 'Back Where It Started'],
      via: ['Kangayam', 'Avinashipalayam'],
      mapCenter: [10.9, 77.5], mapZoom: 10, photos: [],
      /* estimate the router gives for this chain, shown when `time` is null */
      estimate: '56 mins',
      stops: [
        { id: 'kangayam', label: 'Kariya Kattu Valasu', icon: 'home', lat: 11.035075, lng: 77.618430, home: true, dir: 'left' },
        { id: 'kangayam-town', label: 'Kangayam', lat: 11.0060598, lng: 77.5607403, dir: 'right' },
        { id: 'avinashipalayam', label: 'Avinashipalayam', lat: 10.9694897, lng: 77.4354180, dir: 'left' },
        { id: 'dharapuram', label: 'Royal Enfield Senthur Motors', icon: 'showroom', lat: 10.73, lng: 77.52, dir: 'left' },
      ],
    },
    {
      order: 12,
      id: 'r5',
      name: 'KovaiON Marathon',
      subtitle: 'Home (Kariya Kattu Valasu) → Palladam → Sulur → Hindusthan College, Coimbatore',
      mode: 'completed',
      distance: '80 KM', time: null, date: '23 Aug 2026', rating: null,
      fromCity: 'Kariya Kattu Valasu', toCity: 'Hindusthan College of Arts and Sciences, Coimbatore',
      states: ['Tamil Nadu'], color: '#3b82f6',
      description: 'The run down to Coimbatore for the KovaiON marathon at Hindusthan College.',
      story: 'Ridden for the KovaiON marathon at Hindusthan College of Arts and Sciences, Coimbatore. Out of Kariya Kattu Valasu through Kangayam, then west along the Avinashipalayam and Palladam road, Sulur, and into the city through Singanallur to the campus.',
      highlights: ['KovaiON Marathon', 'Hindusthan College', 'Palladam Road', 'City Approach'],
      via: ['Kangayam', 'Avinashipalayam', 'Palladam', 'Sulur', 'Singanallur'],
      mapCenter: [11.01, 77.3], mapZoom: 10, photos: [],
      estimate: '1hr 32mins',
      stops: [
        { id: 'kangayam', label: 'Kariya Kattu Valasu', icon: 'home', lat: 11.035075, lng: 77.618430, home: true, dir: 'left' },
        { id: 'kangayam-town', label: 'Kangayam', lat: 11.0060598, lng: 77.5607403, dir: 'right' },
        { id: 'avinashipalayam', label: 'Avinashipalayam', lat: 10.9694897, lng: 77.4354180, dir: 'left' },
        { id: 'palladam', label: 'Palladam', lat: 10.9962313, lng: 77.2835582, dir: 'right' },
        { id: 'sulur', label: 'Sulur', lat: 11.0268912, lng: 77.1258565, dir: 'left' },
        { id: 'singanallur', label: 'Singanallur', lat: 11.0028585, lng: 77.0234948, dir: 'right' },
        { id: 'hindusthan-college', label: 'Hindusthan College', icon: '🎓', lat: 11.0196820, lng: 76.9947731, dir: 'left' },
      ],
    },
    {
      order: 20,
      id: 'one-ride-2026',
      name: 'One Ride 2026',
      subtitle: 'Home (Kariya Kattu Valasu), Kangayam → route to be decided',
      mode: 'upcoming',
      distance: 'TBD', time: null, date: '20 Sep 2026', rating: null,
      fromCity: 'Kariya Kattu Valasu', toCity: 'To be decided',
      states: ['Tamil Nadu'], color: '#dc2626',
      description: "Royal Enfield's global One Ride — one date, riders out on every road there is.",
      story: "One Ride is Royal Enfield's annual worldwide ride, and 2026 is the 15th edition of it: Sunday 20 September, riders in every country out on the same day under one line — Every Rider. Every Road. Everywhere. There is no set course, which is the point of it. Registration is open, and the first thousand riders to sign up get the One Ride tee. It falls in the year Royal Enfield turns 125, the oldest motorcycle brand still in continuous production since 1901 — so the Bear's first One Ride lands on a good one.",
      highlights: ['One Ride 2026', '15th Global Edition', 'Every Rider. Every Road. Everywhere.', '125 Years of Royal Enfield'],
      via: [],
      mapCenter: [11.035075, 77.618430], mapZoom: 10, photos: [],
      stops: [
        { id: 'kangayam', label: 'Kariya Kattu Valasu', icon: 'home', lat: 11.035075, lng: 77.618430, home: true, dir: 'left' },
      ],
    },
    {
      order: 30,
      id: 'r2',
      name: 'The 450 KM Run',
      subtitle: 'Home (Kariya Kattu Valasu), Kangayam → Erode → Salem → Ulundurpet → Chennai',
      mode: 'planned',
      distance: '450 KM', time: null, date: 'Planned', rating: null,
      fromCity: 'Kangayam', toCity: 'Chennai',
      states: ['Tamil Nadu'], color: '#f97316',
      description: 'The long haul from home to Chennai.',
      story: 'Not ridden yet. The full stretch from home to Chennai in one go — the longest planned so far.',
      highlights: ['Longest Planned Ride', 'Salem Highway', 'One-day Attempt'],
      via: ['Erode', 'Salem', 'Ulundurpet'],
      mapCenter: [12.0, 79.0], mapZoom: 8, photos: [],
      stops: [
        { id: 'kangayam', label: 'Kariya Kattu Valasu', lat: 11.035075, lng: 77.618430, home: true, dir: 'left' },
        { id: 'chennai', label: 'Chennai', lat: 13.0827, lng: 80.2707, dir: 'right' },
      ],
    },
    {
      order: 40,
      id: 'r4',
      name: 'East Coast Road Run',
      subtitle: 'Chennai → Mahabalipuram → Kalpakkam → Pondicherry',
      mode: 'planned',
      distance: '150 KM', time: null, date: 'Planned', rating: null,
      fromCity: 'Chennai', toCity: 'Pondicherry',
      states: ['Tamil Nadu', 'Puducherry'], color: '#38bdf8',
      description: 'East Coast Road — one of the most scenic routes in South India.',
      story: 'Planned. ECR the whole way down: the Bay of Bengal on the right, a stop at Mahabalipuram, and into the French Quarter at the other end.',
      highlights: ['East Coast Road', 'Bay of Bengal Views', 'Mahabalipuram', 'French Quarter'],
      via: ['ECR', 'Mahabalipuram', 'Kalpakkam'],
      mapCenter: [12.5, 80.0], mapZoom: 9, photos: [],
      stops: [
        { id: 'chennai', label: 'Chennai', lat: 13.0827, lng: 80.2707, dir: 'right' },
        { id: 'pondy', label: 'Pondicherry', lat: 11.9416, lng: 79.8083, dir: 'right' },
      ],
    },
  ]

  /* the three tiers, from garage.config.json */
  const MODES = [
    { key: 'completed', label: 'Completed', plural: 'Completed Rides', color: '#22c55e' },
    { key: 'upcoming', label: 'Upcoming', plural: 'Upcoming Rides', color: '#f59e0b' },
    { key: 'planned', label: 'Planned', plural: 'Planned Rides', color: '#8b5cf6' },
  ]

  /* ── small helpers ───────────────────────────────────────────────────── */

  /* "0:45" → "45mins" · "1:45" → "1hr 45mins" · null → null.
     Same wording src/data/rides.js produces, so copy reads identical. */
  function hm(clock) {
    if (!clock) return null
    const [h, m] = String(clock).split(':').map(Number)
    const parts = []
    if (h) parts.push(h + (h === 1 ? 'hr' : 'hrs'))
    if (m) parts.push(m + 'mins')
    return parts.join(' ') || '0mins'
  }

  /* leading number of "450 KM" — "TBD" has none, which is the whole point */
  const km = d => parseFloat(String(d).replace(/[^\d.]/g, '')) || 0

  /* "1:45" → 105 minutes; null → null */
  function minutes(clock) {
    if (!clock) return null
    const [h, m] = String(clock).split(':').map(Number)
    return h * 60 + m
  }
  /* "56 mins" → 56 · "1hr 32mins" → 92 — the router's estimate, as typed */
  function estMinutes(s) {
    if (!s) return null
    const h = /(\d+)\s*hr/.exec(s), m = /(\d+)\s*min/.exec(s)
    const n = (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0)
    return n || null
  }

  const R = 6371 // km
  const rad = x => x * Math.PI / 180

  /* great-circle distance between two stops, km */
  function crow(a, b) {
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(s))
  }

  /* initial bearing a → b, degrees clockwise from true north */
  function bearing(a, b) {
    const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat))
    const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
      Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng))
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  }

  const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const compass = deg => POINTS[Math.round(deg / 22.5) % 16]

  /* ── dates ───────────────────────────────────────────────────────────── */
  /* `date` is a display string, and two of the six are the word "Planned"
     rather than a day. So parsing returns null for those instead of an
     Invalid Date, and `dated` says whether a ride can sit on a time axis
     at all. A design that plots time needs somewhere to put the undated
     ones — they are not late, they are unscheduled.                     */

  const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }

  function parseDate(s) {
    const m = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/.exec(String(s).trim())
    if (!m) return null
    const mo = MON[m[2].slice(0, 3).toLowerCase()]
    if (mo == null) return null
    return new Date(Date.UTC(+m[3], mo, +m[1]))
  }

  const DAY = 86400000
  const todayUTC = () => {
    const n = new Date()
    return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))
  }
  /* whole days from today: negative is past, 0 is today, positive is ahead */
  const daysTo = when => when ? Math.round((when - todayUTC()) / DAY) : null

  /* ── build ───────────────────────────────────────────────────────────── */

  const rides = FILES
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(r => {
      const stops = r.stops || []
      const mapped = stops.length > 1
      const legs = stops.slice(1).map((s, i) => ({
        from: stops[i], to: s,
        crow: +crow(stops[i], s).toFixed(1),
        bearing: +bearing(stops[i], s).toFixed(1),
        compass: compass(bearing(stops[i], s)),
      }))
      const first = stops[0], last = stops[stops.length - 1]
      const n = km(r.distance)
      const when = parseDate(r.date)
      /* running distance at each stop, so a design can travel the route */
      let run = 0
      const marks = stops.map((s, i) => {
        if (i) run += legs[i - 1].crow
        return { stop: s, at: +run.toFixed(2) }
      })
      return {
        ...r,
        slug: r.id,
        km: n,
        when, dated: !!when, days: daysTo(when),
        marks,
        /* "TBD" — print `distance` as typed, never compute with it */
        tbd: n === 0,
        mapped,
        time: hm(r.time),
        timeRaw: r.time,
        /* duration in whole minutes, from the clock if it was logged, else
           from the router's estimate, else null. A design that animates a
           ride in real proportions needs a number, not "1hr 32mins". */
        mins: minutes(r.time) != null ? minutes(r.time) : estMinutes(r.estimate),
        estimated: r.time == null && !!r.estimate,
        /* what to print in a time slot: the real clock, else the router's
           estimate, else nothing. Designs should mark an estimate as one. */
        estimate: r.estimate || null,
        done: r.mode === 'completed',
        bearing: mapped ? +bearing(first, last).toFixed(1) : null,
        compass: mapped ? compass(bearing(first, last)) : null,
        crow: mapped ? +crow(first, last).toFixed(1) : 0,
        /* the great-circle length of the whole chain, stop to stop */
        chain: +legs.reduce((t, l) => t + l.crow, 0).toFixed(1),
        legs, stops,
        /* the tier record, so a design never re-looks-up the colour */
        tier: MODES.find(m => m.key === r.mode) || MODES[2],
      }
    })

  const byMode = key => rides.filter(r => r.mode === key)
  const byId = id => rides.find(r => r.id === id)

  /* ── the network ─────────────────────────────────────────────────────── */
  /* The stops are not six separate lists — they share places, and the
     sharing is real: Kariya Kattu Valasu is on five of the six rides, and
     Dharapuram, Kangayam, Avinashipalayam and Chennai each carry two. That
     makes this a network with genuine interchanges, which is worth knowing
     before drawing it as anything else. Keyed on rounded lat/lng, because
     the same place is authored with identical coordinates across files. */

  function network() {
    const byKey = new Map()
    rides.forEach(r => r.stops.forEach((s, i) => {
      const key = s.lat.toFixed(4) + ',' + s.lng.toFixed(4)
      if (!byKey.has(key)) {
        byKey.set(key, { key, label: s.label, lat: s.lat, lng: s.lng,
          home: !!s.home, rides: [], ends: 0 })
      }
      const st = byKey.get(key)
      st.home = st.home || !!s.home
      if (!st.rides.includes(r.id)) st.rides.push(r.id)
      if (i === 0 || i === r.stops.length - 1) st.ends++
      /* keep the fullest spelling of a name that appears more than once */
      if (s.label.length > st.label.length) st.label = s.label
    }))
    const stations = [...byKey.values()]
      .map(s => ({ ...s, lines: s.rides.length, interchange: s.rides.length > 1 }))
      .sort((a, b) => b.lines - a.lines)
    return {
      stations,
      byKey: k => byKey.get(k),
      keyOf: s => s.lat.toFixed(4) + ',' + s.lng.toFixed(4),
      interchanges: stations.filter(s => s.interchange),
      hub: stations[0],
    }
  }

  const done = rides.filter(r => r.done)
  const doneKm = done.reduce((n, r) => n + r.km, 0)
  const aheadKm = rides.filter(r => !r.done).reduce((n, r) => n + r.km, 0)
  const allStates = [...new Set(rides.flatMap(r => r.states))]
  /* longest RIDDEN, which is the only one that is a fact rather than a plan */
  const longest = done.reduce((a, r) => (r.km > (a ? a.km : 0) ? r : a), null)
  const furthest = rides.reduce((a, r) => (r.km > (a ? a.km : 0) ? r : a), null)

  const summary = {
    count: rides.length,
    done: done.length,
    open: rides.length - done.length,
    doneKm, aheadKm, totalKm: doneKm + aheadKm,
    longest, furthest,
    states: allStates,
    stateCount: allStates.length,
    /* unique places with a fix, not raw stop rows — home repeats across rides */
    stopCount: new Set(rides.flatMap(r => r.stops.map(s => s.lat + ',' + s.lng))).size,
    legCount: rides.reduce((n, r) => n + r.legs.length, 0),
  }

  /* the header tally: "3 completed · 1 upcoming · 2 planned" */
  const tally = MODES
    .filter(m => byMode(m.key).length)
    .map(m => `${byMode(m.key).length} ${m.label.toLowerCase()}`)
    .join(' · ')

  /* ── projection ──────────────────────────────────────────────────────── */
  /* Web-Mercator plot of a set of stops into a w × h box, so a design can
     draw the true shape of a route in plain SVG with no map tiles. One
     scale on both axes, so nothing is ever stretched.                    */

  function projector(stops, w, h, pad) {
    pad = pad == null ? 24 : pad
    const my = s => Math.log(Math.tan(Math.PI / 4 + s.lat * Math.PI / 360))
    const ys = stops.map(my), xs = stops.map(s => s.lng)
    const x0 = Math.min(...xs), x1 = Math.max(...xs)
    const y0 = Math.min(...ys), y1 = Math.max(...ys)
    const sx = (x1 - x0) || 1e-4, sy = (y1 - y0) || 1e-4
    const k = Math.min((w - pad * 2) / sx, (h - pad * 2) / sy)
    const ox = (w - sx * k) / 2, oy = (h - sy * k) / 2
    const at = s => [ox + (s.lng - x0) * k, h - (oy + (my(s) - y0) * k)]
    return { of: at, pts: stops.map(at) }
  }

  /* a single ride fitted to its own box; a one-stop ride lands dead centre */
  const one = (ride, w, h, pad) => projector(ride.stops, w, h, pad)
  /* every mapped ride in one frame, so routes sit in true relative position */
  const fit = (w, h, pad) => projector(rides.flatMap(r => r.stops), w, h, pad)

  /* straight polyline through projected points */
  function path(pts) {
    if (!pts.length) return ''
    return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  }

  /* the same, bowed into soft arcs — reads as road rather than survey line */
  function curve(pts) {
    if (pts.length < 2) return path(pts)
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]
      const mx = (x0 + x1) / 2, my2 = (y0 + y1) / 2
      const dx = x1 - x0, dy = y1 - y0
      const len = Math.hypot(dx, dy) || 1
      const bow = len * 0.13
      d += ` Q${(mx - dy / len * bow).toFixed(1)} ${(my2 + dx / len * bow).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
    }
    return d
  }

  return {
    title: 'Rides & Journeys',
    note: 'Every road has a story.',
    rides, modes: MODES, byMode, byId, summary, tally, network,
    hm, km, crow, bearing, compass,
    parseDate, daysTo, today: todayUTC, DAY,
    one, fit, path, curve,
    /* the point `d` km along a ride's chain, as [x,y] in a w × h box, plus
       the heading there. What a design needs to travel a route.         */
    along(ride, d, w, h, pad) {
      const P = one(ride, w, h, pad)
      if (!ride.mapped) return { xy: P.pts[0], deg: 0, leg: null, i: 0 }
      const total = ride.chain || 1
      const want = Math.max(0, Math.min(total, d))
      let run = 0
      for (let i = 0; i < ride.legs.length; i++) {
        const L = ride.legs[i]
        if (run + L.crow >= want || i === ride.legs.length - 1) {
          const t = L.crow ? (want - run) / L.crow : 0
          const a = P.pts[i], b = P.pts[i + 1]
          return {
            xy: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
            deg: L.bearing, leg: L, i, t,
          }
        }
        run += L.crow
      }
      return { xy: P.pts[P.pts.length - 1], deg: 0, leg: null, i: ride.legs.length - 1 }
    },
    /* photos resolve against public/ — every array is empty today, but
       wired so a design keeps working the day the first one lands */
    url(file) { return BASE + String(file).replace(/^\/+/, '') },
  }
})()
