/**
 * Shared data for the vlog section design previews (vlog-design-*.html).
 *
 * Same idea as storefront-data.js: nothing imports this at build time, it
 * exists only so the six previews can show real content without each one
 * carrying its own copy.
 *
 * WHERE THE CONTENT COMES FROM
 *   `items` are the real videos in src/data/config.json → `videos`, narrowed
 *   to the travel / ride / on-the-road ones, with the local silent clips in
 *   public/video-previews attached where config already pairs them. Titles,
 *   blurbs, dates, categories and YouTube links are all genuine.
 *
 *   `duration` and `views` are NOT real — config carries neither, and the
 *   designs need something in those slots to be judged at the right density.
 *   Treat them as lorem numbers; they get replaced by the real figures when
 *   the section is built for real.
 *
 * WHY THE REAL GARAGE LIST ISN'T USED
 *   src/data/garage.js → `vlogs` is still `[]` — no Bear 650 ride has been
 *   filmed yet. Every design therefore also ships an empty state; add
 *   `?empty=1` to any preview URL to see it.
 *
 * Paths resolve against public/, which is where the dev server and a plain
 * file:// open both find them.
 */
window.VLOG = (function () {
  const BASE = 'public/'

  /* Local silent clips, used for hover-to-play and for the inline stage.
     Short, muted, loopable — the real thing a thumbnail can't show. */
  const CLIP = f => BASE + 'video-previews/' + f

  /**
   * type:  'film'  — a full-length video
   *        'short' — a vertical short
   * cat:   the grouping the designs filter and colour by
   * clip:  local mp4 for motion, or null (falls back to the YouTube still)
   */
  const items = [
    {
      yt: 'yqxAY4R4NxE', type: 'film', cat: 'Ride Films', fav: true,
      title: 'Exploring Chicago in One Day',
      blurb: 'Skydeck, the architecture cruise and Navy Pier fireworks, start to finish in twenty-four hours.',
      date: '2026-06-20', duration: '14:22', views: '18K',
      clip: CLIP('chicago_ovr.mp4'),
    },
    {
      yt: 'U1Tq5lcd0EI', type: 'film', cat: 'Ride Films', fav: true,
      title: 'One Day Tour in Chicago',
      blurb: 'The whole city in twenty-four hours — what made the cut and what did not.',
      date: '2026-06-20', duration: '11:08', views: '12K',
      clip: CLIP('chicago_river.mp4'),
    },
    {
      yt: 'CGXdtOeAOgU', type: 'short', cat: 'Trips', fav: true,
      title: 'Friends Trip to Yercaud',
      blurb: 'Hairpins, hill air and a boot full of nothing useful.',
      date: '2025-12-30', duration: '0:48', views: '31K',
      clip: CLIP('yarcadu.mp4'),
    },
    {
      yt: 'ca_OxBwZhac', type: 'short', cat: 'Trips', fav: true,
      title: 'Kanthalloor Trip with Friends',
      blurb: 'Up into the Kanthalloor valley — the drive in is half the trip.',
      date: '2024-12-21', duration: '0:59', views: '27K',
      clip: CLIP('kandhalur.mp4'),
    },
    {
      yt: '1ryqkAPUrfE', type: 'short', cat: 'Trips',
      title: 'Kanthalloor Campfire',
      blurb: 'The part of the trip nobody films properly. Fire, cold, everyone talking at once.',
      date: '2024-12-22', duration: '0:36', views: '9.4K',
      clip: CLIP('trip1.mp4'),
    },
    {
      yt: 'sxzayekAnfM', type: 'short', cat: 'Trips',
      title: 'Kanthalloor Zipline',
      blurb: 'Straight down the valley on a wire. Thirty seconds, no second take.',
      date: '2024-12-22', duration: '0:31', views: '15K',
      clip: CLIP('recap.mp4'),
    },
    {
      yt: '1Ka9nSAiby4', type: 'short', cat: 'City Nights', fav: true,
      title: 'Office la Work… Night la Fun',
      blurb: 'Chennai after the shift ends — the city the day never shows you.',
      date: '2025-06-04', duration: '0:44', views: '22K',
      clip: null,
    },
    {
      yt: '_5hXByi7xRg', type: 'short', cat: 'City Nights', fav: true,
      title: 'Sila Views Words la Solla Mudiyadhu',
      blurb: 'Some views do not survive being described. Chicago, from up there.',
      date: '2023-10-31', duration: '0:28', views: '41K',
      clip: null,
    },
    {
      yt: 'D2RHDnm8_IY', type: 'film', cat: 'On the Road',
      title: 'KCBT — Kalaignar Centenary Bus Terminal',
      blurb: 'A walk through the biggest bus terminal in the country, before the crowds found it.',
      date: '2025-01-10', duration: '18:40', views: '54K',
      clip: null,
    },
    {
      yt: 'WgBVEAekYuY', type: 'short', cat: 'On the Road',
      title: 'India to Dubai',
      blurb: 'Gate to gate, window seat, no narration needed.',
      date: '2025-01-25', duration: '0:52', views: '11K',
      clip: null,
    },
    {
      yt: '_CDNL_B_1zA', type: 'short', cat: 'On the Road',
      title: 'Chicago to Dubai, Over the Sky',
      blurb: 'Thirteen hours of nothing, and the twenty seconds of it worth keeping.',
      date: '2025-05-13', duration: '0:24', views: '8.7K',
      clip: null,
    },
    {
      yt: '1PVaLLKoGno', type: 'short', cat: 'City Nights',
      title: 'USA Snowfall',
      blurb: 'First real snow. Filmed with cold hands, which you can tell.',
      date: '2026-02-06', duration: '0:33', views: '19K',
      clip: CLIP('chicago_trip.mp4'),
    },
  ]

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  /** '2026-06-20' → { label: '20 Jun 2026', short: 'Jun 2026', year: 2026 } */
  function stamp(iso) {
    const [y, m, d] = iso.split('-').map(Number)
    return {
      label: `${d} ${MONTHS[m - 1]} ${y}`,
      short: `${MONTHS[m - 1]} ${y}`,
      year: y,
      ms: Date.UTC(y, m - 1, d),
    }
  }

  const all = items
    .map(v => ({
      ...v,
      url: `https://youtu.be/${v.yt}`,
      /* hqdefault exists for every video, including shorts */
      poster: `https://img.youtube.com/vi/${v.yt}/hqdefault.jpg`,
      posterBig: `https://img.youtube.com/vi/${v.yt}/maxresdefault.jpg`,
      when: stamp(v.date),
    }))
    .sort((a, b) => b.when.ms - a.when.ms)
    /* `i` is the position in THIS list, newest first — designs index straight
       back into `all` with it, so it has to be assigned after the sort. */
    .map((v, i) => ({ ...v, i, n: i + 1 }))

  const cats = [...new Set(all.map(v => v.cat))]

  /* ── Detail-page extras ───────────────────────────────────────────────
     The detail designs are the vlog equivalent of BlogPost.jsx, so they
     need chapter marks and frame grabs on top of what a card needs.

     Neither exists in config.json yet. `chapters` below are therefore
     STRUCTURE, not truth — same standing as `duration` and `views` above:
     invented so the layouts can be judged at a realistic density, and
     replaced the moment real timestamps are pulled from the videos.

     `stills` reuse photos that ARE real, out of public/gallery, standing
     in for the frame grabs a finished vlog would carry.
  ──────────────────────────────────────────────────────────────────────── */
  const still = (folder, file) => BASE + 'gallery/' + folder + '/' + file

  const STILLS = [
    { src: still('travel', 'Travel1.jpg'), cap: 'Leaving before the light' },
    { src: still('travel', 'Travel2.jpg'), cap: 'The long straight bit' },
    { src: still('capture', 'Capture3.jpg'), cap: 'Somewhere worth stopping' },
    { src: still('capture', 'Capture7.jpg'), cap: 'Coffee nobody asked for' },
    { src: still('nature', 'Nature2.jpg'), cap: 'Green, and a lot of it' },
    { src: still('travel', 'Travel5.jpg'), cap: 'Climbing into the sun' },
    { src: still('travel', 'Travel6.jpg'), cap: 'Helmet off at the top' },
    { src: still('capture', 'Capture9.jpg'), cap: 'The bit before dark' },
    { src: still('travel', 'Travel8.jpg'), cap: 'The way back, unfilmed' },
    { src: still('nature', 'Nature3.jpg'), cap: 'Nothing in particular' },
    { src: still('capture', 'Capture5.jpg'), cap: 'Gear laid out' },
    { src: still('travel', 'Travel9.jpg'), cap: 'Last frame of the day' },
  ]

  /* The YouTube stills need the network. Opened from the file system — which is
     how these previews are meant to be judged — they never arrive, so every
     item also carries a local photo to fall back to. One per item, stable, so
     a design that shows the same video twice shows the same picture twice. */
  all.forEach((v, i) => { v.still = STILLS[i % STILLS.length].src })

  /* ── Instagram reels ──────────────────────────────────────────────────
     Real, straight out of config.json → `instagram`. `code` is the reel
     shortcode, so `/reel/<code>/embed` renders the post itself in an
     iframe with no Instagram script needed. Captions carry their own
     hashtags, split out below so a design can show them as chips.

     Instagram serves no thumbnail we can reach, so each reel also names a
     local still to sit under it until the embed is asked for.
  ──────────────────────────────────────────────────────────────────────── */
  const IG = [
    ['DaYPUxPB6Hz', 'Chicago one day trip', 'chicago', '#river_cruise #chicago #trip #one_day_trip'],
    ['DZziZ1wR1Lf', 'Chicago downtown Indian food restaurant', 'chicago', '#chicago #indianfood #restaurant'],
    ['DZ3mDTaRLGI', 'Chicago one day trip', 'chicago', '#chicago #trip #one_day_trip'],
    ['DaF42gOxKX7', 'Chicago one day short video', 'chicago', '#chicago #trip #one_day_trip'],
    ['DaHk80bgQeZ', 'Mount Vernon', 'Mount Vernon', '#aviationday #mountvernon #trip #friends'],
    ['DVLgz1vkSRC', 'Mushroom omelet in 1 minute 🍳🔥', 'cooking', '#tamil #shorts #recipe'],
    ['DS5b8yIEl5K', 'Yercaud with friends', 'Trip', '#Trip #Yarcaud #Friends #2025'],
    ['DPSxW6Gj2Rq', 'Ayudha pooja 🙏', 'Culture', '#ayudhapooja #festival #tradition'],
  ].map(([code, caption, cat, tags], k) => ({
    code, caption, cat,
    tags: tags.split(' ').filter(Boolean),
    url: `https://www.instagram.com/reel/${code}/`,
    embed: `https://www.instagram.com/reel/${code}/embed`,
    still: STILLS[(k * 5) % STILLS.length].src,
  }))

  /* ── Blog posts ───────────────────────────────────────────────────────
     Real, from src/data/blog/*.json and *.md — same four posts /blog
     lists. Covers are the paths those posts already use, re-rooted at
     public/ so they resolve from a file:// open too.
  ──────────────────────────────────────────────────────────────────────── */
  const POSTS = [
    {
      slug: 'maha-kumbhabhishekam-kariyakali-amman-kovil', icon: '🛕', cat: 'Culture',
      title: 'Maha Kumbhabhishekam at Maniyan Kulam Shri Kariyakali Amman Kovil',
      date: '2025-08-28', place: 'Nathakadaiyur, Tamil Nadu',
      excerpt: 'Vedic chants, homams and the blessings of thousands of devotees, at a temple ' +
               'twenty minutes from home.',
      cover: BASE + 'blog/mahakumb/f1.png',
      tags: ['culture', 'temple', 'festival', 'Tamil Nadu'],
    },
    {
      slug: 'mulapari-festival-kariya-kalli-amman-temple', icon: '🛕', cat: 'Culture',
      title: 'Mulapari Festival at Kariya Kalli Amman Temple',
      date: '2025-08-26', place: 'Kariya Kattu Valasu Village, Tamil Nadu',
      excerpt: 'The women of the village carry grain pots to the goddess in a procession that ' +
               'has not changed in generations.',
      cover: BASE + 'blog/mahakumb/f3_1.jpg',
      tags: ['culture', 'festival', 'village', 'Tamil Nadu'],
    },
    {
      slug: 'spiced-shrimp-veggie-yogurt-salad-bowl', icon: '🦐', cat: 'Food',
      title: 'Spiced Shrimp & Veggie Yogurt Salad Bowl',
      date: '2026-03-18', place: null,
      excerpt: 'A protein-rich breakfast bowl — juicy shrimp, lightly cooked vegetables and a ' +
               'creamy yogurt finish.',
      cover: BASE + 'blog/photos/Shrimp-Salad.jpg',
      tags: ['recipe', 'breakfast', 'high-protein'],
    },
    {
      slug: 'spicy-mushroom-masala-omelet', icon: '🍄', cat: 'Food',
      title: 'Spicy Mushroom Masala Omelet',
      date: '2026-02-10', place: null,
      excerpt: 'Bold spices, earthy mushrooms and fluffy eggs, together in about ten minutes.',
      cover: BASE + 'blog/photos/Spicy-Omelet-with-Mushrooms.jpg',
      tags: ['recipe', 'breakfast', 'healthy'],
    },
  ].map(p => ({ ...p, when: stamp(p.date), href: `/blog/${p.slug}` }))

  /* ── Rides ────────────────────────────────────────────────────────────
     Real, from src/data/garage.js → `routes`, including each ride's own
     `mode`, distance and accent colour. Start and end coordinates are the
     ones already in that file; the intermediate `via` coordinates are
     approximate, added here only so a design has a line to draw.
  ──────────────────────────────────────────────────────────────────────── */
  const ROUTES = [
    {
      id: 'r1', name: 'Nathakadaiyur Temple Ride', sub: 'Dharapuram → Home → Nathakadaiyur',
      mode: 'upcoming', distance: '38 KM', date: '2 Aug 2026', colour: '#a78bfa',
      mapCenter: [10.87, 77.54], mapZoom: 11, time: null,
      states: ['Tamil Nadu'],
      highlights: ['Bala Thandayuthapani Temple', 'Home Roads', 'First Ride'],
      story: 'The first ride planned on the Bear 650 — Dharapuram back home to Kangayam, then ' +
             'out to the temple at Nathakadaiyur. Short, familiar roads, met for the first time.',
      points: [
        [77.5200, 10.7300, 'Dharapuram'],
        [77.5606, 11.0057, 'Kangayam (Home)'],
        [77.5450, 10.9400, 'Nathakadaiyur'],
      ],
    },
    {
      id: 'r3', name: 'Kangayam to Coimbatore', sub: 'Hidden Routes & Raw Nature',
      mode: 'planned', distance: '70 KM', date: 'Planned', colour: '#22c55e',
      mapCenter: [11.01, 77.25], mapZoom: 10, time: null,
      states: ['Tamil Nadu'],
      highlights: ['Rural Back Roads', 'Sugarcane Fields', 'Nilgiris Foothills'],
      story: 'State highways instead of the NH, to see what rural Tamil Nadu looks like from a ' +
             'motorcycle. The Coimbatore approach through the foothills should be the payoff.',
      points: [
        [77.5606, 11.0057, 'Kangayam'],
        [77.3500, 11.1085, 'Tiruppur'],
        [77.2670, 11.1930, 'Avinashi'],
        [76.9558, 11.0168, 'Coimbatore'],
      ],
    },
    {
      id: 'r2', name: 'Kangayam to Chennai', sub: 'Home to the City',
      mode: 'planned', distance: '450 KM', date: 'Planned', colour: '#f97316',
      mapCenter: [12.0, 79.0], mapZoom: 8, time: null,
      states: ['Tamil Nadu'],
      highlights: ['All-day Ride', 'NH Miles', 'City Arrival'],
      story: 'Four hundred and fifty kilometres in one go — the longest single day planned so far.',
      points: [
        [77.5606, 11.0057, 'Kangayam'],
        [77.7172, 11.3410, 'Erode'],
        [78.1460, 11.6643, 'Salem'],
        [79.3200, 11.6700, 'Ulundurpet'],
        [80.2707, 13.0827, 'Chennai'],
      ],
    },
    {
      id: 'r4', name: 'Chennai to Pondicherry', sub: 'Scenic Roads & Good Vibes',
      mode: 'planned', distance: '150 KM', date: 'Planned', colour: '#38bdf8',
      mapCenter: [12.5, 80.0], mapZoom: 9, time: null,
      states: ['Tamil Nadu', 'Puducherry'],
      highlights: ['ECR Coast Road', 'Sea on One Side', 'French Quarter'],
      story: 'The East Coast Road, with the sea on the left the whole way down.',
      points: [
        [80.2707, 13.0827, 'Chennai'],
        [80.2500, 12.9000, 'ECR'],
        [80.1945, 12.6269, 'Mahabalipuram'],
        [80.1600, 12.5200, 'Kalpakkam'],
        [79.8083, 11.9416, 'Pondicherry'],
      ],
    },
  ]

  /* Two shapes come off each ride, because the designs need both:

     `stops` — lng/lat projected into 0–100 percentages inside the ride's own
       bounding box, so a design can draw the line at any size with no map
       library at all. y is flipped, since latitude grows upward and screens
       grow downward.

     `fromCity`/`toCity`/`via`/`osrm` — the same field names the real ride page
       (GarageV7RideDetail) reads, so a design that wants the actual Leaflet +
       OSRM map from /mygarage/rides/:id can hand this object straight over
       without translating anything. `via` is the real list from garage.js:
       the labels on the middle points here match it.
  */
  ROUTES.forEach(r => {
    const lng = r.points.map(p => p[0]), lat = r.points.map(p => p[1])
    const x0 = Math.min(...lng), x1 = Math.max(...lng)
    const y0 = Math.min(...lat), y1 = Math.max(...lat)
    const span = (a, b) => (b - a) || 1
    /* 10% padding each side so end markers aren't clipped */
    r.stops = r.points.map(([ln, la, label], k) => ({
      label,
      x: 10 + ((ln - x0) / span(x0, x1)) * 80,
      y: 90 - ((la - y0) / span(y0, y1)) * 80,
      first: k === 0,
      last: k === r.points.length - 1,
    }))
    r.km = parseInt(r.distance, 10) || 0

    const a = r.points[0], b = r.points[r.points.length - 1]
    r.fromCity = a[2]
    r.toCity = b[2]
    r.via = r.points.slice(1, -1).map(p => p[2])
    r.osrm = { fromLng: a[0], fromLat: a[1], toLng: b[0], toLat: b[1] }
  })

  /* ── Cross-linking ────────────────────────────────────────────────────
     A vlog's detail page pulls in the Instagram reels, blog posts and ride
     that belong with it. Nothing in config records those relationships
     yet, so they are matched on shared words and then padded out — good
     enough to judge a layout, and the one place to swap for real ids.
  ──────────────────────────────────────────────────────────────────────── */
  const words = s => s.toLowerCase().match(/[a-z]{4,}/g) || []

  function rank(list, text, textOf) {
    const want = new Set(words(text))
    return [...list]
      .map(o => ({ o, hits: words(textOf(o)).filter(w => want.has(w)).length }))
      .sort((a, b) => b.hits - a.hits)
      .map(x => x.o)
  }

  /** '14:22' → 862 · '0:48' → 48 */
  function toSec(dur) {
    const p = dur.split(':').map(Number)
    return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]
  }

  /* Chapter titles + blurbs, cycled so each video gets a plausible spread.
     Shorts are under a minute, so they get three marks; films get seven. */
  const BEATS = [
    ['Cold Start', 'Lights still on, nobody using them, and an engine warming up too loudly.'],
    ['Out and Moving', 'Empty road, first proper roll-on, and the day finally starting.'],
    ['The Detour', 'Not on the plan. Better than the plan.'],
    ['Stopping for Nothing', 'Eleven minutes that justify themselves completely.'],
    ['The Good Stretch', 'Low light, long shadows, and very little talking.'],
    ['Almost There', 'The part where you stop filming and just look at it.'],
    ['Last Frame', 'Helmet off, engine ticking as it cools. That is the trip.'],
  ]

  /**
   * Build the detail-page view model for one item.
   *   chapters — evenly spread marks across the real runtime
   *   stills   — a rotating slice of the gallery, stable per video
   *   related  — other videos: same category first, then whatever else
   *   insta    — Instagram reels shot on the same trip
   *   posts    — blog posts that cover the same ground
   *   route    — the ride the vlog belongs to, as a drawable line
   *
   * The last four are what make this a hub page rather than just a player:
   * one trip, told across YouTube, Instagram, the blog and the map.
   */
  function detail(item) {
    const v = item || all[0]
    const total = toSec(v.duration)
    const marks = total < 90 ? 3 : BEATS.length
    const offset = v.i % BEATS.length

    const chapters = Array.from({ length: marks }, (_, k) => {
      const sec = Math.round((total * k) / marks)
      const [title, blurb] = BEATS[(offset + k) % BEATS.length]
      const m = Math.floor(sec / 60), s = sec % 60
      return {
        sec, title, blurb,
        at: `${m}:${String(s).padStart(2, '0')}`,
        pct: (sec / total) * 100,
        photo: STILLS[(v.i * 3 + k) % STILLS.length].src,
      }
    })

    const sameCat = all.filter(o => o.yt !== v.yt && o.cat === v.cat)
    const rest = all.filter(o => o.yt !== v.yt && o.cat !== v.cat)

    return {
      ...v,
      totalSec: total,
      chapters,
      stills: STILLS.map((s, k) => ({
        ...s,
        /* a timestamp for each grab, spread across the runtime */
        at: (() => {
          const sec = Math.round((total * (k + 0.5)) / STILLS.length)
          return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
        })(),
      })),
      related: [...sameCat, ...rest].slice(0, 6),
      embed: `https://www.youtube.com/embed/${v.yt}`,
      /* the label a design puts where a blog post would put read time */
      kind: v.type === 'short' ? 'Short' : 'Full film',

      /* the other three feeds, and the map */
      insta: rank(IG, v.title + ' ' + v.blurb + ' ' + v.cat, r => r.caption + ' ' + r.cat + ' ' + r.tags.join(' '))
        .slice(0, 4),
      posts: rank(POSTS, v.title + ' ' + v.blurb + ' ' + v.cat, p => p.title + ' ' + p.excerpt + ' ' + p.tags.join(' '))
        .slice(0, 3),
      route: ROUTES[v.i % ROUTES.length],
    }
  }

  /** `?v=<youtube-id>` opens a specific one; otherwise the newest film. */
  function current() {
    const want = new URLSearchParams(location.search).get('v')
    return detail(all.find(v => v.yt === want) || all.find(v => v.type === 'film') || all[0])
  }

  return {
    stills: STILLS,
    detail,
    current,
    toSec,

    /* the other feeds, whole, for a design that wants more than the
       cross-linked slice a single detail page gets */
    insta: IG,
    posts: POSTS,
    routes: ROUTES,
    social: {
      instagram: 'https://www.instagram.com/sivashanmugavadivel/',
      youtube: 'https://www.youtube.com/@sivashanmugavadivel',
      handle: '@sivashanmugavadivel',
    },

    /* ── How many the SECTION shows ──
       The section on /mygarage is a teaser, not the archive: five, then a way
       through to the full list. `shown` is what a section design renders,
       `more` is how many it is holding back, `page` is where the button goes
       (App.jsx → <Route path="/videos">). The detail designs ignore all
       three and work off `all`. */
    LIMIT: 5,
    shown: all.slice(0, 5),
    more: Math.max(0, all.length - 5),
    page: '/videos',

    heading: 'Latest Vlogs',
    kicker: 'On the Road',
    note: 'Rides, trips and the bits in between — filmed on the Insta360 rig bolted to the bike.',
    channel: 'https://www.youtube.com/@sivashanmugavadivel',
    channelName: '@sivashanmugavadivel',

    all,
    cats,
    count: all.length,
    films: all.filter(v => v.type === 'film'),
    shorts: all.filter(v => v.type === 'short'),
    favs: all.filter(v => v.fav),
    withClip: all.filter(v => v.clip),
    byCat: cat => all.filter(v => v.cat === cat),

    /** `?empty=1` on any preview shows the design's coming-soon state. */
    isEmpty: new URLSearchParams(location.search).has('empty'),

    /** public/bear650 holds a 37-frame 360° spin of the bike, wild-honey01..37. */
    bike(n) {
      const i = ((Math.round(n) - 1) % 37 + 37) % 37 + 1
      return BASE + 'bear650/wild-honey' + String(i).padStart(2, '0') + '.png'
    },
  }
})()
