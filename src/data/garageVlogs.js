/**
 * The vlogs the garage section shows, adapted from ./vlogs.js.
 *
 * ./vlogs.js is the one source of truth for vlog content: one JSON file per
 * vlog in public/mygarage/vlog/config/, normalised there. This module only
 * reshapes that into what the Route Reel section renders and works out the
 * counters above the road — it holds no content of its own.
 *
 * WHY THERE IS NO FALLBACK
 *   This used to fall back to the channel's own videos (config.json → `videos`)
 *   whenever the garage list was empty, so the section would never look bare.
 *   That backfired: it filled the road with Chicago and Dubai clips that were
 *   never filmed on the bike, and they looked authored rather than borrowed.
 *   An empty folder now shows the "road not ridden yet" state instead, which is
 *   the truth. Every stop on this road is a real entry in that folder.
 *
 * WHAT IS AND ISN'T REAL
 *   `duration` and `views` are typed into each vlog's JSON by hand — there is
 *   no YouTube API key in this project, so nothing can read the real figures.
 *   Leave them out of a file and the section simply omits those slots; nothing
 *   here invents a number.
 */

import { vlogs, vlogsTitle, vlogsNote } from './vlogs'

/** How many the section on /mygarage shows before handing off. */
export const VLOG_LIMIT = 5

/** Where the "the road carries on" board goes. */
export const VLOGS_PAGE = '/videos'

/** A vlog's own page — the Collage detail design. Matches App.jsx's route. */
const vlogHref = v => `/mygarage/vlogs/${v.id}`

/* Re-exported so the section can label itself from the same config block that
   names it, rather than hard-coding a heading. */
export { vlogsTitle, vlogsNote }

/**
 * One normalised vlog → the shape a stop on the road renders.
 *
 * Two images, in that order of preference. `poster` is the video's own YouTube
 * still, which is what someone expects to see on a card for a video. `fallback`
 * is the vlog's first frame grab, used when the still cannot be fetched — img
 * .youtube.com needs the network, and these pages are often opened without it.
 * `cover` in ./vlogs.js already resolves to the still itself when a vlog has no
 * images of its own, so the fallback is never empty.
 */
const toStop = (v, i) => ({
  id: v.id,
  href: vlogHref(v),
  url: v.url,
  title: v.title,
  /* the line under the heading — the standfirst, or the subtitle if there
     is no excerpt written */
  blurb: v.excerpt || v.subtitle || '',
  /* the label on the card */
  cat: v.category || (v.isShort ? 'Short' : 'Film'),
  type: v.type,
  fav: v.featured,
  when: v.when,
  duration: v.duration || null,
  views: v.views || null,
  clip: v.clip || null,
  hasVideo: v.hasVideo,
  /* with no link yet there is no YouTube still, so the vlog's own picture is
     all there is — and `cover` is already empty when it has none of those
     either, which the card draws as an empty tile rather than a broken image */
  poster: v.poster || v.cover,
  fallback: v.cover,
  posterBig: v.posterBig || v.cover,
  n: i + 1,
})

export const garageVlogs = vlogs.map(toStop)

export const vlogCount = garageVlogs.length
export const vlogsShown = garageVlogs.slice(0, VLOG_LIMIT)
export const vlogsMore = Math.max(0, vlogCount - VLOG_LIMIT)

/** For the counters above the road — everything countable from the real list. */
export const vlogStats = {
  total: vlogCount,
  films: garageVlogs.filter(v => v.type === 'film').length,
  shorts: garageVlogs.filter(v => v.type === 'short').length,
  cats: [...new Set(garageVlogs.map(v => v.cat))].length,
  latest: garageVlogs.length
    ? garageVlogs.reduce((a, b) => (b.when.ms > a.when.ms ? b : a)).when.short
    : '—',
}
