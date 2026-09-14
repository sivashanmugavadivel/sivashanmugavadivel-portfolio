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
 *   "cancelled" — was dated, didn't happen. Keeps its page and its place in the
 *                 list, counts towards nothing.
 *
 *   A ride graduates upward as it happens: planned → upcoming (once it has a
 *   date) → completed (fill in `time`, `rating` and `stats`), or sideways to
 *   cancelled if the day falls through. Labels, colours and the word each tier
 *   is stamped with live in garage.config.json → `rides.modes`.
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
 *     "organizer": "Biker's Club CBE",   // who is running the ride. Leave it out
 *                                        //   for your own rides — it defaults to
 *                                        //   "Self", so every file written before
 *                                        //   this field existed is already right.
 *                                        //   Shown only when it ISN'T Self.
 *     "organizerLogo": "Royal-Enfield-Logo.png",
 *                                        // optional. A public/ path like `photos`.
 *                                        //   Most clubs have no logo file, so
 *                                        //   every place that shows an organizer
 *                                        //   reads fine from the name alone, and
 *                                        //   a path that 404s falls back to it.
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
 *     "fromPlace": "Kariya Kattu Valasu",  // WHERE EXACTLY — a village, a
 *     "destPlace": "Nathakadaiyur Temple", //   showroom, a temple. The name you
 *                                          //   would actually say out loud.
 *     "fromCity":  "Kangayam",             // WHICH TOWN it belongs to. This is
 *     "destCity":  "Nathakadaiyur",        //   what the compact "A → B" lines
 *                                          //   show, where a long place name
 *                                          //   would not fit. Both pairs are
 *                                          //   optional and fall back to each
 *                                          //   other — see `build` below.
 *                                          //   `dest*` is WHERE IT WAS GOING,
 *                                          //   which on a round trip is NOT the
 *                                          //   last stop — see ROUND TRIPS.
 *     "states":   ["Tamil Nadu"],       // counted by `rideSummary`
 *     "color":    "#a78bfa",            // the ride's accent, used for its route
 *                                       //   line, card border and pins
 *
 *     "description": "…",               // the blurb on the ride card
 *     "story":       "…",               // the write-up on the detail page
 *     "highlights":  ["…"],             // the pill strip
 *     "compliments": [                  // what the ride COMES WITH — the perks
 *       "All brand bikes welcome",      //   an organised ride's poster lists.
 *       { "icon": "☕",                  //   Plain strings or {icon,text}; the
 *         "text": "Breakfast combo" }   //   icon is an emoji written verbatim,
 *     ],                                //   and an entry without one gets a
 *                                       //   tick. Rendered on the detail page
 *                                       //   as a poster panel, skipped when
 *                                       //   empty — which is most rides.
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
 *         "dest":  false,               //   optional; THE POINT OF THE RIDE, on
 *                                       //     a ride that comes back. Only read
 *                                       //     on a round trip — see below.
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
 * ── ROUND TRIPS ──────────────────────────────────────────────────────────
 *   A ride that comes home has the same place at both ends of `stops`, which
 *   makes "where did it go?" unanswerable from the chain alone: the last stop
 *   is the first one. Asked naively, r7 goes "Kangayam → Kangayam".
 *
 *   So a loop's ends are split into two different questions:
 *
 *     `destPlace` / `destCity`  WHAT IT WENT FOR — the turnaround. Dhondenling.
 *     `endPlace`  / `endCity`   WHERE THE WHEELS STOPPED — home again.
 *     `roundTrip`               true, which is what puts "· Round Trip" on the
 *                               compact line so the split is visible, not silent.
 *
 *   On a one-way ride the two pairs are identical and nothing changes.
 *
 *   The turnaround is found by `destOf`: a stop marked `"dest": true` if there
 *   is one, otherwise the middle of the chain, which is the far end of a
 *   there-and-back by construction. Mark it explicitly on any loop whose route
 *   out differs from the route back — r7's does — and it can never drift.
 *
 *   Pages read `dest*` for "where was it going" and `end*` for the finish. The
 *   only two places that genuinely mean the finish are the End row in the two
 *   sidebars and the label on the last map pin.
 *
 *   These were called `toPlace`/`toCity` until the split, which is why the pair
 *   still sits opposite `from*` rather than a matching `start*`: the UI asks
 *   "From / To", and `dest*` is the honest answer to the To.
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

/**
 * An endpoint written out in full: "Kariya Kattu Valasu, Kangayam".
 *
 * Both detail pages show a ride's start and end this way, so the rule for
 * joining them lives here rather than twice over in the pages. The two
 * degenerate cases are the point of it: a place with no city named, and a place
 * that IS its city — "Chennai, Chennai" — both collapse to the single name
 * instead of printing the same word twice.
 */
export function placeLabel(place, city) {
  const p = String(place ?? '').trim()
  const c = String(city ?? '').trim()
  if (!p) return c || '—'
  if (!c || p === c) return p
  /* The city is already inside the place name — "Dhondenling Tibetan
     Settlement" in "Dhondenling" — so printing both says the word twice for no
     gain. Same reason as the p === c case above, one step looser. */
  if (new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(p)) return p
  return `${p}, ${c}`
}

/**
 * The compact "where to where" line: "Kangayam → Chennai".
 *
 * `to` is the ride's DESTINATION, not the last stop — on a loop those are two
 * different places, and the destination is the one worth naming. Pass
 * `roundTrip` and the line says so rather than leaving the reader to guess why
 * a ride that ends at home is billed as going somewhere else:
 *
 *   routeLabel('Kangayam', 'Dhondenling', true) -> "Kangayam → Dhondenling · Round Trip"
 *
 * A loop with no destination worked out still collapses to "Kangayam · Round
 * Trip", rather than rendering "Kangayam → Kangayam" — which reads as a bug in
 * the page instead of a loop in the road. Used by every tight spot that has room
 * for one line; the sidebars use `placeLabel` instead, which has the width for
 * the full answer.
 */
export function routeLabel(from, to, roundTrip = false) {
  const a = String(from ?? '').trim()
  const b = String(to ?? '').trim()
  if (!a && !b) return ''
  if (!b || a === b) return a ? `${a} · Round Trip` : b
  if (!a) return b
  return roundTrip ? `${a} → ${b} · Round Trip` : `${a} → ${b}`
}

/**
 * One thing that comes with the ride — a perk off the event poster.
 *
 * Two shapes are accepted because most entries need nothing but words:
 *
 *   "All brand bikes welcome"
 *   { "icon": "☕", "text": "Breakfast combo with tea/coffee" }
 *
 * `icon` is written verbatim — an emoji, not a name from a lookup table. These
 * are perks, not places, so there is no fixed vocabulary to match against the
 * way `stops[].icon` has one. An entry without one gets a tick from the poster
 * panel, which is what "included" looks like anyway.
 */
function complimentOf(c, k) {
  const text = String(
    (typeof c === 'string' ? c : c?.text ?? c?.label) ?? ''
  ).trim()
  if (!text) return null
  return {
    id: (typeof c === 'object' && c?.id) || `c${k + 1}`,
    icon: typeof c === 'object' ? String(c?.icon ?? '').trim() : '',
    text,
  }
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
    /* THE POINT OF THE RIDE, on a ride that comes back. A loop's last stop is
       its first one, so "where was it going?" cannot be answered from the chain
       — the turnaround has to be named. See `destOf` below, which falls back to
       the middle of the chain when no stop claims it. Meaningless on a one-way
       ride, where the destination is simply the end. */
    dest: !!s.dest,
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

/**
 * Does this ride come back to where it started?
 *
 * Matched on the stop id first, because a loop is authored by repeating the
 * same stop — r7's chain opens and closes on `kangayam`, deliberately identical
 * so the two pins land as one. Coordinates are the fallback, for a chain that
 * returns to the same spot under two different ids.
 */
function isRoundTrip(first, last) {
  if (!first || !last || first === last) return false
  if (first.id && first.id === last.id) return true
  const near = (a, b) => Math.abs(a - b) < 0.0005   // ~50 m
  return near(first.lat, last.lat) && near(first.lng, last.lng)
}

/**
 * WHERE THE RIDE WAS ACTUALLY GOING, on a ride that comes back.
 *
 * A loop's last stop is its first one, so taking the end of the chain as the
 * destination answers "Kangayam → Kangayam" — true, and useless. The turnaround
 * is the answer, and there are two ways to find it:
 *
 *   1. A stop marked `"dest": true`. Always right, because a person said so.
 *   2. The middle of the chain. A there-and-back is symmetric by construction,
 *      so its midpoint IS the far end — and this is why the far end is not
 *      computed as "the stop furthest from home", which sounds obvious and is
 *      wrong: on r7, Kollegal is 14 km further out than Dhondenling, yet
 *      Dhondenling is the place the day was built around.
 *
 * Null on a one-way ride — there the destination is just the last stop, and the
 * caller already has it.
 */
function destOf(stops, roundTrip) {
  if (!roundTrip || stops.length < 3) return null
  return stops.find(s => s.dest) ?? stops[Math.floor(stops.length / 2)] ?? null
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

  /* ── "dest" and "end" are the same place, until the ride loops ───────────
     On a one-way ride the destination IS the last stop and these all collapse
     to what they have always been. On a loop they come apart: the ride GOES to
     Dhondenling and ENDS at home, and a page that calls both of them "to" is
     the bug being fixed here. So:

       fromPlace/fromCity — where it set off
       destPlace/destCity — WHAT IT WENT FOR. The turnaround on a loop.
       endPlace/endCity   — WHERE THE WHEELS STOPPED. Back home on a loop.

     Everything that asks "where was this ride going" reads `dest*`; the two
     spots that genuinely mean the finish — the End row in the sidebars and the
     label on the last map pin — read `end*`. An authored `destPlace`/`destCity`
     still wins over all of it, because a file that names the destination
     outright knows better than any rule here. */
  const roundTrip = isRoundTrip(first, last)
  const dest = destOf(stops, roundTrip)

  const fromPlace = item.fromPlace || first?.label || ''
  const fromCity = item.fromCity || item.fromPlace || first?.label || ''

  const destPlace = item.destPlace || dest?.label || last?.label || ''
  const destCity = item.destCity || item.destPlace || dest?.label || last?.label || ''

  /* A loop ends where it started, so the start is the honest answer and it is
     taken from the START fields rather than re-derived — otherwise the two ends
     of the same ride could print the same place two different ways. */
  const endPlace = roundTrip ? fromPlace : destPlace
  const endCity = roundTrip ? fromCity : destCity

  return {
    id: item.id || idFallback || slug,
    slug,
    order: num(item.order) ?? Number.MAX_SAFE_INTEGER,

    name: item.name || '',
    subtitle: item.subtitle || '',
    mode: item.mode || 'planned',
    /* Who put the ride together. Most of them are your own, so the absent case
       is the common one and it answers "Self" rather than blank — which also
       means every file written before this field existed reads correctly
       without being touched. */
    organizer: item.organizer || 'Self',
    /* Optional, and genuinely so: most clubs hand out a poster and nothing else,
       so every place that shows an organizer has to read correctly from the name
       alone. Same public/ path treatment as `photos`. */
    organizerLogo: srcOf(item.organizerLogo),

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

    /* Two grains of "where": the exact spot, and the town it sits in.
       `fromPlace` is Kariya Kattu Valasu; `fromCity` is Kangayam. The detail
       pages show both together, the cards and map headers show the city alone
       because a full place name does not fit on one line there.

       Each falls back to the other, so a file may state either, both, or
       neither: one that only sets `fromCity` — every file written before these
       fields existed — behaves exactly as it did, and one that only sets
       `fromPlace` echoes it into the city slot rather than dropping to a stop
       label. */
    fromPlace,
    destPlace,
    fromCity,
    destCity,
    /* where it finished, which is only different from `dest*` on a loop */
    endPlace,
    endCity,
    /* Does it come back? Drives the "· Round Trip" wording, and tells a reader
       why a ride billed as going to Dhondenling has its End row at home. */
    roundTrip,
    states: item.states ?? [],
    color: item.color || '#a78bfa',

    description: item.description || '',
    story: item.story || '',
    highlights: item.highlights ?? [],
    /* What the ride comes WITH — breakfast, a badge, a lucky draw. Straight off
       an event poster, and rendered as one on the detail page. Empty for a ride
       you simply went on, which is most of them, and the panel is skipped
       entirely rather than printing an empty frame. */
    compliments: (Array.isArray(item.compliments) ? item.compliments : [])
      .map(complimentOf)
      .filter(Boolean),
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
  { key: 'completed', label: 'Completed', plural: 'Completed Rides', stamp: 'Ridden', color: '#22c55e' },
  { key: 'upcoming', label: 'Upcoming', plural: 'Upcoming Rides', stamp: 'Scheduled', color: '#f59e0b' },
  { key: 'planned', label: 'Planned', plural: 'Planned Rides', stamp: 'Planned', color: '#8b5cf6' },
  { key: 'cancelled', label: 'Cancelled', plural: 'Cancelled Rides', stamp: 'Called Off', color: '#9ca3af' },
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
 * `planned` is what the map draws dashed — a line that is not a fixed ride, so
 * the map reads the same way the ride list does. Two modes qualify: undated
 * (planned) and called off (cancelled), because neither is a road anyone is
 * committed to. It's derived from the mode, not authored, so a ride graduating
 * from planned to upcoming redraws itself solid.
 */
export const mapRoutes = drawable().map(r => ({
  rid: r.id,
  color: r.color,
  stops: r.mapStops,
  planned: r.mode === 'planned' || r.mode === 'cancelled',
}))
