/* ══════════════════════════════════════════════════════════════════════
   NEXT RIDE — shared data for every nextride-design-*.html in this folder.

   The card these designs are for sits on the Rides & Journeys landing page
   and answers one question: what is the next ride, and how soon?

   Mirrors public/mygarage/rideandroute/*.json for the rides that are still
   ahead. Nothing imports this at build time — it exists so each preview
   stays a standalone file you can open straight off the disk.

   WHAT THESE CARDS DELIBERATELY DO NOT SHOW: a map or a route line. The
   landing page already draws the road; repeating it in the card says
   nothing new. So the material here is time, cost, company and what the
   day includes — the things a rider actually needs before setting off.

   Three things to design around, all real:

   1. THE TWO RIDES ARE NOT ALIKE. One Ride is 154 km with a ₹499 ticket
      and no stated start time. Dhondenling is 615 km, ₹349, assembling at
      5:30 AM. A card that only fits one shape of ride is the wrong card.

   2. `organizerLogo` IS OFTEN NULL. Royal Enfield has one; the Biker's
      Club does not, and its folder does not exist yet. Every design must
      look deliberate with the badge missing, not broken.

   3. THE COUNTDOWN CROSSES ZERO. Ride day arrives, then passes. A card
      that only knows how to say "in N days" is wrong twice a year;
      `phase` says which of the four states you are in.
   ══════════════════════════════════════════════════════════════════════ */

window.NR = (function () {

  const BASE = '../public/'

  /* ── the rides that are still ahead, verbatim ─────────────────────────── */

  const UPCOMING = [
    {
      order: 20,
      id: 'one-ride-2026',
      name: 'One Ride 2026',
      subtitle: 'Home (Kariya Kattu Valasu) → Dharapuram → Palladam → Coimbatore → Tuskers Hill, Anaikatti',
      mode: 'upcoming',
      organizer: 'Royal Enfield',
      /* resolves against public/ — this one really is at the root */
      organizerLogo: 'Royal-Enfield-Logo.png',
      distance: '154 KM',
      date: '20 Sep 2026',
      /* no assemble time stated for this one, which is the case a card has
         to survive: it falls back to a sensible first-light start */
      startAt: null,
      fromPlace: 'Kariya Kattu Valasu',
      fromCity: 'Kangayam',
      destPlace: 'Poppys Tuskers Hill Resort',
      destCity: 'Anaikatti',
      states: ['Tamil Nadu'],
      color: '#dc2626',
      description: "Royal Enfield's global One Ride, ridden west to the Anaikatti hills — Dharapuram, Palladam, Coimbatore, then up to Tuskers Hill.",
      tagline: 'Every Rider. Every Road. Everywhere.',
      highlights: ['One Ride 2026', '15th Global Edition', 'Every Rider. Every Road. Everywhere.',
        'Anaikatti Hills', '125 Years of Royal Enfield'],
      via: ['Dharapuram', 'Palladam', 'Coimbatore'],
      compliments: [
        { icon: '☕', text: 'Breakfast, tea / coffee' },
        { icon: '🎯', text: 'Activities' },
        { icon: '🍽️', text: 'Tea / coffee and snacks' },
        { icon: '🎁', text: 'Welcome kit' },
      ],
      stats: { registration: '₹499' },
      stopCount: 5,
      loop: false,
    },
    {
      order: 25,
      id: 'dhondenling-2026',
      name: 'Dhondenling Tibetan Settlement',
      subtitle: 'Home (Kariya Kattu Valasu) → Coimbatore → Dhimbam → Kollegal → Dhondenling → Kadambur → Home',
      mode: 'upcoming',
      organizer: "Biker's Club CBE",
      /* null, and the folder for it does not exist — the designed-for case */
      organizerLogo: null,
      distance: '615 KM',
      date: '27 Sep 2026',
      startAt: '6:00 AM',
      assembleAt: '5:30 AM',
      fromPlace: 'Kariya Kattu Valasu',
      fromCity: 'Kangayam',
      destPlace: 'Dhondenling Tibetan Settlement',
      destCity: 'Dhondenling',
      states: ['Tamil Nadu', 'Karnataka'],
      color: '#eab308',
      description: 'A Tibetan settlement in the Biligiri Rangan hills — out over the Dhimbam hairpins, back down the Kadambur ghat.',
      tagline: 'More Than A Destination',
      highlights: ['One Day September Ride 2026', 'More Than A Destination', 'Tibetan Settlement',
        'Dzogchen Monastery', 'Dhimbam Hairpins', 'Kadambur Ghat', "Biker's Club CBE"],
      via: ['Bannari', 'Dhimbam', 'Kollegal', 'Germalam', 'Kadambur', 'Sathyamangalam'],
      compliments: [
        { icon: '☕', text: 'Breakfast combo with tea/coffee' },
        { icon: '🍽️', text: 'Evening tea/coffee + snacks' },
        { icon: '🎁', text: 'Badge · Stickers · Surprise gift' },
        { icon: '🏆', text: 'Lucky rider wins a special gift' },
      ],
      stats: { assemble: '5:30 AM', rideStart: '6:00 AM', registration: '₹349' },
      stopCount: 11,
      loop: true,
    },
  ]

  /* the garage as a whole, for cards that want to say "3rd of 7" */
  const GARAGE = { total: 7, completed: 3, upcoming: 2, planned: 2, riddenKm: 168 }

  /* ── dates ───────────────────────────────────────────────────────────── */

  const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }

  /** "20 Sep 2026" → a local Date at the ride's start time. */
  function dateOf(r) {
    const m = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/.exec(String(r.date).trim())
    if (!m) return null
    const mo = MON[m[2].slice(0, 3).toLowerCase()]
    if (mo == null) return null
    /* Assemble time if the ride states one, else the ride start, else first
       light — a countdown to midnight would be a lie about when you leave. */
    const clock = r.assembleAt || r.startAt || '6:00 AM'
    const t = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(clock.trim())
    let hh = t ? +t[1] : 6
    const mm = t ? +t[2] : 0
    if (t && t[3]) {
      const pm = t[3].toUpperCase() === 'PM'
      if (pm && hh < 12) hh += 12
      if (!pm && hh === 12) hh = 0
    }
    return new Date(+m[3], mo, +m[1], hh, mm, 0, 0)
  }

  const DAY = 86400000

  /** Whole days from today to a ride's day, ignoring the time of day. */
  function daysTo(r) {
    const d = dateOf(r)
    if (!d) return null
    const n = new Date()
    const a = new Date(n.getFullYear(), n.getMonth(), n.getDate())
    const b = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    return Math.round((b - a) / DAY)
  }

  /* ── build ───────────────────────────────────────────────────────────── */

  const rides = UPCOMING
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(r => {
      const when = dateOf(r)
      const days = daysTo(r)
      const km = parseFloat(String(r.distance).replace(/[^\d.]/g, '')) || 0
      return {
        ...r,
        when, days, km,
        /* what the ride is actually called in a sentence */
        dest: r.destCity || r.destPlace || '',
        /* a loop ends where it started, and saying "→ home" is the honest
           reading of that rather than repeating the turnaround */
        endsAt: r.loop ? (r.fromCity || 'home') : (r.destCity || r.destPlace || ''),
        fee: (r.stats && r.stats.registration) || null,
        assemble: (r.stats && r.stats.assemble) || null,
        rideStart: (r.stats && r.stats.rideStart) || null,
        logo: r.organizerLogo ? BASE + r.organizerLogo : null,
        /* Initials, for the badge when there is no logo file. Apostrophes are
           DELETED rather than turned into spaces: "Biker's Club CBE" split on
           non-letters yields Biker / s / Club, and the badge reads BS. */
        initials: String(r.organizer || '')
          .replace(/['’]/g, '')
          .replace(/[^A-Za-z ]/g, ' ')
          .trim().split(/\s+/)
          .filter(w => w.length > 1)
          .slice(0, 2).map(w => w[0]).join('').toUpperCase(),
      }
    })

  /* the next ride is the soonest one that has not already happened */
  const next = rides.filter(r => r.days !== null && r.days >= 0)
    .sort((a, b) => a.when - b.when)[0] || rides[0]
  const after = rides.filter(r => r !== next && r.days !== null && r.days >= 0)
    .sort((a, b) => a.when - b.when)[0] || null

  /* ── the countdown ───────────────────────────────────────────────────── */
  /* Returns everything a design might want to print, plus `phase`, because a
     countdown that only knows how to say "in N days" is wrong on the day and
     wrong after it. Call it on a timer; it reads the clock each time.      */

  function countdown(r) {
    const target = r && r.when
    if (!target) return { phase: 'unknown', d: 0, h: 0, m: 0, s: 0, total: 0 }
    const ms = target - Date.now()
    const abs = Math.abs(ms)
    const d = Math.floor(abs / DAY)
    const h = Math.floor((abs % DAY) / 3600000)
    const m = Math.floor((abs % 3600000) / 60000)
    const s = Math.floor((abs % 60000) / 1000)
    let phase
    if (ms <= 0) {
      /* still "today" for the length of a long ride day */
      phase = abs < 18 * 3600000 ? 'riding' : 'past'
    } else if (ms < DAY) phase = 'tomorrow'
    else phase = 'counting'
    return { phase, d, h, m, s, total: ms, ahead: ms > 0 }
  }

  /**
   * "in 4 days" · "tomorrow" · "today" — the one-line version.
   *
   * Counted from the CLOCK, not the calendar, so it agrees with the digits
   * beside it. The two disagree more often than you would think: at nine on
   * a Tuesday evening a Sunday-morning ride is five calendar days away and
   * four-and-a-bit real ones, and a card showing a big "4" next to the words
   * "in 5 days" looks broken even though both are defensible.
   * `days` keeps the calendar figure, which is what picks the next ride.
   */
  function whenWords(r) {
    const c = countdown(r)
    if (c.phase === 'riding') return 'today'
    if (c.phase === 'past') return 'just ridden'
    if (c.d === 0) return c.h <= 1 ? 'within the hour' : 'today'
    if (c.d === 1) return 'tomorrow'
    return `in ${c.d} days`
  }

  const pad = n => String(n).padStart(2, '0')

  /* weekday + long date, for cards with room for it */
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const MONS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const longDate = r => r.when
    ? `${DAYS[r.when.getDay()]}, ${r.when.getDate()} ${MONS[r.when.getMonth()]} ${r.when.getFullYear()}`
    : r.date
  const weekday = r => (r.when ? DAYS[r.when.getDay()] : '')
  const monthShort = r => (r.when ? MONS[r.when.getMonth()].slice(0, 3) : '')

  return {
    rides, next, after, garage: GARAGE,
    countdown, whenWords, longDate, weekday, monthShort, pad, daysTo,
    url(file) { return BASE + String(file).replace(/^\/+/, '') },
  }
})()
