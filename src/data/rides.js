/**
 * Rides & Routes — one JSON file per ride, in public/mygarage/rideandroute/.
 *
 * Drop a file in that folder and the ride appears; there is no list to register
 * it on. The folder is read at build time (see FILES below), so adding a ride is
 * one new file and nothing else. Three views share the result — the "Rides &
 * Routes" panel on /mygarage, the list at /mygarage/rides, and the detail page
 * at /mygarage/rides/<id>.
 *
 * Same idea as ./vlogs.js (public/mygarage/vlog/config/*.json) — per-item files
 * rather than one long array. Nothing is fetched at runtime.
 *
 * ── WHY BUILD-TIME AND NOT fetch() ───────────────────────────────────────
 *   `routes` is read synchronously at module-eval time by ./vlogs.js, which
 *   resolves each vlog's `rideId` into a real ride while it builds its own
 *   list. A runtime fetch would make `routes` a promise and break that, plus
 *   every component that renders a ride list without a loading state. The glob
 *   keeps the whole set available the moment anything imports it.
 *
 *   The files still ship to dist/ verbatim like everything else in public/, so
 *   each one also has a stable public URL if something ever wants to read it
 *   over HTTP.
 *
 * ── ORDER ────────────────────────────────────────────────────────────────
 *   `order` fixes the sequence — low first. It only settles ties *within* a
 *   mode: every list goes through `ridesInOrder`, which groups by RIDE_MODES
 *   (completed → upcoming → planned) first. Leave gaps of 10 so a ride can be
 *   slotted between two others without renumbering. Missing `order` sorts last,
 *   then by filename, so a file without one still lands somewhere stable.
 *
 * ── MODES ────────────────────────────────────────────────────────────────
 *   "completed" — actually ridden. The only rides that feed the totals in
 *                 `rideSummary`, so `distance` and `states` have to be truthful.
 *   "upcoming"  — next up, with a date already set.
 *   "planned"   — decided on, no date yet.
 *
 *   A ride graduates upward as it happens: planned → upcoming (once it has a
 *   date) → completed (fill in `time`, `rating` and `stats`). Labels and colours
 *   for each tier live in garage.config.json → `rides.modes`.
 *
 *   Any other mode still gets a detail page but appears in no list, since the
 *   lists are built from the tiers above. That is the escape hatch for a
 *   someday-maybe ride you don't want on the board yet.
 *
 * ── ONE FILE ─────────────────────────────────────────────────────────────
 *   public/mygarage/rideandroute/r1-nathakadaiyur-temple-ride.json
 *
 *   Files whose name starts with `_` are skipped, so `_template.json` can sit
 *   in the folder as the copy-me reference without ever rendering.
 *
 *   {
 *     "order": 10,                      // sorts the list, low first
 *     "id":    "r1",                    // stable slug; the URL segment and the
 *                                       //   React key. Falls back to the
 *                                       //   filename with any `rN-` prefix
 *                                       //   stripped. CHANGING IT CHANGES THE
 *                                       //   URL — existing links break.
 *
 *     "name":     "Nathakadaiyur Temple Ride",
 *     "subtitle": "Dharapuram → Home → Nathakadaiyur",
 *     "mode":     "upcoming",
 *
 *     "distance": "38 KM",              // display string. The leading number is
 *                                       //   what gets summed, so keep the
 *                                       //   "<km> KM" shape.
 *     "time":     "1:45",               // what the ride ACTUALLY took, as a clock,
 *                                       //   H:MM. Shown as words — "1:45" renders
 *                                       //   "1hr 45mins", "0:45" renders
 *                                       //   "45mins". A bare number is minutes.
 *                                       //   Anything non-numeric passes through
 *                                       //   as typed. MUST BE QUOTED: `1:45`
 *                                       //   without quotes is not valid JSON and
 *                                       //   takes the whole garage down with it.
 *                                       //   null until it's been ridden.
 *
 *     "estimateTime": null,             // what the route SHOULD take. Same
 *                                       //   format, same quoting rule — but
 *                                       //   normally left null, because the
 *                                       //   detail page works it out from the
 *                                       //   router: OSRM returns a duration
 *                                       //   beside the geometry it draws the line
 *                                       //   from, so the estimate is the road
 *                                       //   network's own answer for the exact
 *                                       //   stops below, recalculated whenever
 *                                       //   they change. Set it only to override
 *                                       //   that — a stated value always wins.
 *     "date":     "2 Aug 2026",         // or "Planned" while there isn't one
 *     "rating":   null,                 // 1–5, once it's been ridden
 *
 *     "fromCity": "Dharapuram",
 *     "toCity":   "Nathakadaiyur",
 *     "states":   ["Tamil Nadu"],       // counted by `rideSummary`
 *     "color":    "#a78bfa",            // the ride's accent, used for its route
 *                                       //   line, card border and pins
 *
 *     "description": "…",               // the blurb on the ride card
 *     "story":       "…",               // the write-up on the detail page
 *     "highlights":  ["…"],             // the pill strip
 *     "via":         ["Kangayam (Home)"],
 *                    // prose waypoint names for the sidebar and the map header.
 *                    // Free text — NOT coordinates, and not what the route is
 *                    // drawn through. That's `stops` below.
 *
 *     "mapCenter": [10.87, 77.54],      // [lat, lng] — the detail map's opening
 *     "mapZoom":   11,                  //   view, before the route fits itself
 *
 *     "videoId": null,                  // bare YouTube id; adds the embed
 *     "photos":  [],                    // public/ paths or absolute URLs
 *     "stats":   null,                  // optional { label: value } table, e.g.
 *                                       //   { "topSpeed": "112 km/h", … }
 *
 *     "stops": [                        // the ride's GEOMETRY, in order
 *       { "id":    "dharapuram",        //   dedup key across rides — the same
 *                                       //   place in two rides is one pin
 *         "label": "Dharapuram",        //   the pin's tooltip
 *         "lat":   10.73,
 *         "lng":   77.52,
 *         "home":  false,               //   optional; the bigger accent pin
 *         "dir":   "left",              //   optional; which side the label sits.
 *                                       //     Both maps show every label always,
 *                                       //     so this is the only lever for pins
 *                                       //     close enough to collide. On the
 *                                       //     turned detail map "left" reads as
 *                                       //     above the route, "right" as below.
 *         "color": "#22c55e",           //   optional; this stop's pin colour.
 *                                       //     Omit and it takes the next colour
 *                                       //     from the detail page's palette.
 *         "icon":  "temple" },          //   optional; WHAT KIND of place this is,
 *                                       //     which puts that symbol on the map
 *                                       //     instead of a lettered pin. Names
 *                                       //     like temple · home · office ·
 *                                       //     showroom · restaurant · hotel ·
 *                                       //     shop · beach · fuel · waterfall —
 *                                       //     the full list is PLACE_ICONS in
 *                                       //     pages/GarageV7RideDetail.jsx. An
 *                                       //     emoji works verbatim too, so a
 *                                       //     place with no name in the list can
 *                                       //     still have its own symbol. Omit,
 *                                       //     or use a name that isn't known,
 *                                       //     and the stop falls back to the
 *                                       //     lettered pin.
 *       …
 *     ]
 *   }
 *
 * ── `stops` DRIVES EVERYTHING GEOGRAPHIC ─────────────────────────────────
 *   Coordinates are authored once, here, and every map reads them:
 *     · `from` / `to`  — first and last stop, as [lng, lat]
 *     · `osrm`         — first → last, what the detail map routes and draws.
 *                        null when a ride has fewer than two stops.
 *     · `mapStops`     — the whole chain, so the mini-map on /mygarage can route
 *                        *through* the intermediate ones
 *     · `mapCities`    — every stop of every drawable ride, deduped, which is
 *                        the mini-map's pin set
 *
 *   A ride with fewer than two stops has nothing to draw, so it gets no `osrm`
 *   and is left off the mini-map. It still has a detail page.
 *
 * ── ADDING A RIDE ────────────────────────────────────────────────────────
 *   Copy _template.json, rename it after the ride, give it an `id`, a `name`,
 *   a `mode` and an `order`. That alone renders. Fill in `stops` and it appears
 *   on both maps; fill in `stats`, `photos` and `videoId` as the ride actually
 *   happens.
 *
 *   Photos go in public/mygarage/ and are referenced as 'mygarage/<file>'.
 */

import garageCfg from './garage.config.json'

const BASE = import.meta.env.BASE_URL

/* The section's heading and the mode tiers; the rides come from the folder. */
const block = garageCfg.rides ?? {}

/**
 * Every ride file in public/mygarage/rideandroute/, pulled in at build time.
 *
 * `eager` so the whole set is available synchronously — see the WHY note above.
 * The `!**\/_*.json` pattern keeps `_template.json` out of the bundle entirely,
 * rather than shipping its bytes and then filtering it out at runtime.
 */
const FILES = import.meta.glob(
  ['../../public/mygarage/rideandroute/*.json', '!**/_*.json'],
  { eager: true }
)

/** '.../r1-nathakadaiyur-temple-ride.json' -> 'r1-nathakadaiyur-temple-ride' */
const fileSlug = p => p.split('/').pop().replace(/\.json$/i, '')

/** Absolute URLs and data: URIs pass through; anything else is inside public/. */
const srcOf = src =>
  !src ? ''
    : /^(https?:)?\/\//.test(src) || src.startsWith('data:')
      ? src
      : BASE + String(src).split('/').map(encodeURIComponent).join('/')

const num = n => (Number.isFinite(+n) ? +n : null)

/**
 * A ride's duration, authored as a clock and rendered as words.
 *
 *   "1:45"    -> "1hr 45mins"      "0:45" -> "45mins"
 *   "2:00"    -> "2hrs"            "1:00" -> "1hr"
 *   "3:05"    -> "3hrs 5mins"      "0:01" -> "1min"
 *   "1:45:30" -> "1hr 46mins"      (H:MM:SS, seconds rounded into the minutes)
 *   "105"     -> "1hr 45mins"      (a bare number is minutes)
 *
 * TWO parts are H:MM, not M:SS — a ride is hours long, and "1:45" meaning one
 * minute forty-five would be the wrong guess for every entry in this folder.
 *
 * Anything that isn't one of those numeric shapes passes through untouched, so a
 * hand-written "3h 45m" or "60 Days" still renders as authored. Empty or zero
 * gives '' rather than "0mins", which is what the pages treat as "no duration
 * yet" — see `MyGarageVlogDetail`'s `ride.time || '—'`.
 */
function durationLabel(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  if (!/^\d+(:\d{1,2}){0,2}$/.test(s)) return s   // already prose — leave it alone

  const p = s.split(':').map(Number)
  const mins = p.length === 1
    ? p[0]                                        // bare number: minutes
    : p.length === 2
      ? p[0] * 60 + p[1]                          // H:MM
      : p[0] * 60 + p[1] + Math.round(p[2] / 60)  // H:MM:SS

  return wordsFromMinutes(mins)
}

/**
 * The same words, from a duration in seconds.
 *
 * This is the shape a router answers in: OSRM returns `routes[0].duration` in
 * seconds beside the geometry, which is where a ride's ESTIMATED time comes from
 * when its file doesn't state one. Rounded to the nearest minute — a road-network
 * estimate is not accurate to the second and shouldn't pretend to be.
 */
export function labelFromSeconds(sec) {
  const n = Number(sec)
  if (!Number.isFinite(n) || n <= 0) return ''
  return wordsFromMinutes(Math.round(n / 60))
}

/** "1hr 45mins" · "45mins" · "2hrs" — and '' for nothing, never "0mins". */
function wordsFromMinutes(mins) {
  if (!Number.isFinite(mins) || mins <= 0) return ''
  const h = Math.floor(mins / 60), m = mins % 60
  const out = []
  if (h) out.push(`${h}hr${h > 1 ? 's' : ''}`)
  if (m) out.push(`${m}min${m > 1 ? 's' : ''}`)
  return out.join(' ')
}

/** Turn any label into a stop id, for stops that don't carry one. */
const slugify = s => String(s ?? '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

/**
 * One stop, with its coordinates validated.
 *
 * A stop missing either number is dropped rather than defaulted to [0, 0] —
 * that would silently pin the ride off the west coast of Africa, which reads as
 * a bug in the map instead of a gap in the data.
 */
function stopOf(s, k) {
  const lat = num(s?.lat)
  const lng = num(s?.lng)
  if (lat === null || lng === null) return null
  const label = s.label || s.name || ''
  return {
    id: s.id || slugify(label) || `s${k + 1}`,
    label,
    lat,
    lng,
    home: !!s.home,
    dir: s.dir || 'left',
    /* null means "use the next colour in the page's palette", so a stop only
       needs a colour when you want to pin a specific one to it. */
    color: s.color || null,
    /* What KIND of place this is — "temple", "home", "showroom". Empty means the
       stop gets the plain lettered pin instead. The names are resolved by the
       detail page, which owns the glyphs; nothing here needs to know them. */
    icon: String(s.icon ?? '').trim(),
  }
}

/* ── One ride ─────────────────────────────────────────────────────────────
   `slug` is the filename, used as the id when the file doesn't name one. The
   `rN-` prefix is stripped so r1-nathakadaiyur-temple-ride.json falls back to
   'r1' — the prefix is there to make the folder listing readable, not to become
   part of the URL. */
function build(item, slug) {
  const stops = (Array.isArray(item.stops) ? item.stops : [])
    .map(stopOf)
    .filter(Boolean)

  const first = stops[0] ?? null
  const last = stops.length > 1 ? stops[stops.length - 1] : null

  /* Two stops is the minimum that describes a line, so it's what gates every
     drawn route. One stop (or none) still gets a page — it just has no map. */
  const routable = !!(first && last)

  const idFallback = slug.replace(/^r\d+-/, '')

  return {
    id: item.id || idFallback || slug,
    slug,
    order: num(item.order) ?? Number.MAX_SAFE_INTEGER,

    name: item.name || '',
    subtitle: item.subtitle || '',
    mode: item.mode || 'planned',

    distance: item.distance || '',
    /* `time` is the rendered label, because all eleven places that show a ride's
       duration render it straight — none of them branch on it. Authoring stays a
       clock ("1:45"); the words are worked out here once. `timeRaw` keeps what
       the file actually said, for anything that needs to sort or compare.

       `time` is what the ride ACTUALLY took. `estimateTime` is what the route
       was supposed to take — and it is usually blank, because the detail page
       fills it in from the router at runtime. See the note on the field below. */
    time: durationLabel(item.time),
    timeRaw: item.time ?? null,
    estimateTime: durationLabel(item.estimateTime),
    estimateTimeRaw: item.estimateTime ?? null,
    date: item.date || '',
    rating: item.rating ?? null,

    fromCity: item.fromCity || first?.label || '',
    toCity: item.toCity || last?.label || '',
    states: item.states ?? [],
    color: item.color || '#a78bfa',

    description: item.description || '',
    story: item.story || '',
    highlights: item.highlights ?? [],
    via: item.via ?? [],

    mapCenter: Array.isArray(item.mapCenter) ? item.mapCenter : null,
    mapZoom: num(item.mapZoom) ?? null,

    videoId: item.videoId || null,
    photos: (Array.isArray(item.photos) ? item.photos : []).map(srcOf).filter(Boolean),
    stats: item.stats ?? null,

    /* ── derived geometry, all of it from `stops` ───────────────────────── */
    stops,
    /* [lng, lat] — the order the older overview maps expect */
    from: first ? [first.lng, first.lat] : null,
    to: last ? [last.lng, last.lat] : (first ? [first.lng, first.lat] : null),
    /* what the detail map routes and draws; null when there's no line to draw */
    osrm: routable
      ? { fromLng: first.lng, fromLat: first.lat, toLng: last.lng, toLat: last.lat }
      : null,
    /* the full chain, for the mini-map — it routes through the middle stops */
    mapStops: routable ? stops : [],
  }
}

/* ── Exports ────────────────────────────────────────────────────────────── */

export const ridesTitle = block.title ?? 'Rides & Routes'
export const ridesNote = block.note ?? ''

/**
 * The ride tiers, in the order they should ever be listed, plus how each one
 * presents itself. Anything that groups, labels or colour-codes rides reads
 * from here rather than hard-coding a mode string.
 *
 * A mode that isn't listed here is deliberately invisible: its rides keep their
 * detail pages but appear in no list. See the MODES note at the top.
 */
export const RIDE_MODES = block.modes ?? [
  { key: 'completed', label: 'Completed', plural: 'Completed Rides', color: '#22c55e' },
  { key: 'upcoming', label: 'Upcoming', plural: 'Upcoming Rides', color: '#f59e0b' },
  { key: 'planned', label: 'Planned', plural: 'Planned Rides', color: '#8b5cf6' },
]

/**
 * Every ride, by `order`.
 *
 * One file in the folder is one ride, with no other condition: a file that has
 * not been filled in yet still gets a page, so work in progress is visible
 * rather than silently missing. The only files skipped are those named with a
 * leading `_` — that's `_template.json` — and anything that isn't a JSON object.
 * The filename is the tie-breaker, so two files with the same `order` keep a
 * stable order instead of shuffling per build.
 */
export const routes = Object.entries(FILES)
  .map(([path, mod]) => [fileSlug(path), mod?.default ?? mod])
  .filter(([slug, data]) => !slug.startsWith('_') && data && typeof data === 'object')
  .map(([slug, data]) => build(data, slug))
  .sort((a, b) => (a.order - b.order) || a.slug.localeCompare(b.slug))

export const rideCount = routes.length

/** Rides of one mode, e.g. ridesByMode('planned'). */
export const ridesByMode = mode => routes.filter(r => r.mode === mode)

/** Completed first, then upcoming, then planned — the canonical display order. */
export const ridesInOrder = () => RIDE_MODES.flatMap(m => ridesByMode(m.key))

export const rideById = id => routes.find(r => r.id === id) ?? null

/**
 * Headline numbers for the "Rides & Routes" panel, derived from `routes` so they
 * can never drift from the list underneath them. Mark a ride `"mode":
 * "completed"` and every figure here updates on its own.
 *
 * Until the first ride is actually done there is nothing to total up, so the
 * panel counts what's lined up instead and relabels itself — an honest
 * "4 rides lined up" beats four zeroes. `counting` says which set is on show.
 */
export const rideSummary = (() => {
  const tally = list => {
    const km = list.map(r => parseFloat(r.distance) || 0)
    return {
      rides: list.length,
      km: km.reduce((a, b) => a + b, 0),
      longest: km.length ? Math.max(...km) : 0,
      states: new Set(list.flatMap(r => r.states || [])).size,
    }
  }
  const done = tally(ridesByMode('completed'))
  // Nothing ridden yet: upcoming and planned both count as "lined up"
  const ahead = tally([...ridesByMode('upcoming'), ...ridesByMode('planned')])
  const ridden = done.rides > 0
  const live = ridden ? done : ahead
  const fmt = n => Math.round(n).toLocaleString('en-IN')
  const dash = n => (n > 0 ? `${fmt(n)} km` : '—')
  return {
    ...live,
    counting: ridden ? 'completed' : 'ahead',
    stats: [
      [ridden ? 'Total Rides' : 'Rides Lined Up', String(live.rides)],
      [ridden ? 'Total Distance' : 'Distance Ahead', dash(live.km)],
      [ridden ? 'Longest Ride' : 'Longest Planned', dash(live.longest)],
      [ridden ? 'States Explored' : 'States Covered', String(live.states)],
    ],
  }
})()

/* ── Mini-map data ────────────────────────────────────────────────────────
   The /mygarage mini-map used to carry its own copy of these — a city table and
   a route table with the coordinates, colours and ride ids written out a second
   time. Both are derived from the ride files now, so a new ride file puts
   itself on the map and there is no second place for a coordinate to go stale.
──────────────────────────────────────────────────────────────────────────── */

/** Only rides that describe a line; the rest have nothing to draw. */
const drawable = () => ridesInOrder().filter(r => r.mapStops.length > 1)

/**
 * Every stop of every drawable ride, deduped by stop id — the mini-map's pins.
 *
 * `home` merges rather than first-wins: whichever file marks a stop home makes it
 * home everywhere, so the accent pin doesn't depend on which ride happens to be
 * read first.
 */
export const mapCities = (() => {
  const out = new Map()
  drawable().forEach(r => r.mapStops.forEach(s => {
    const prev = out.get(s.id)
    if (!prev) { out.set(s.id, { ...s }); return }
    out.set(s.id, { ...prev, home: prev.home || s.home })
  }))
  return Object.fromEntries(out)
})()

/**
 * One entry per drawable ride: the stop chain to route through, its colour, and
 * where a click goes.
 *
 * `planned` is what the map draws dashed — an undated ride is a dashed line, so
 * the map reads the same way the ride list does. It's derived from the mode, not
 * authored, so a ride graduating from planned to upcoming redraws itself solid.
 */
export const mapRoutes = drawable().map(r => ({
  rid: r.id,
  color: r.color,
  stops: r.mapStops,
  planned: r.mode === 'planned',
}))
