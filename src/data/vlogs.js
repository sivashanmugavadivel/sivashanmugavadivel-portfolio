/**
 * Vlogs — one JSON file per vlog, in public/mygarage/vlog/config/.
 *
 * Drop a file in that folder and it appears; there is no list to register it
 * on. The folder is read at build time (see FILES below), so adding a vlog is
 * one new file and nothing else. Two views share the result — the vlog strip
 * on /mygarage and the detail page for a single vlog.
 *
 * Everything a detail page shows is either authored in that file or derived
 * from it; nothing is fetched at runtime.
 *
 * Mirrors how the blog works (src/data/blog/*.json, read by hooks/usePosts) —
 * per-item files rather than one long array.
 *
 * ── ORDER ────────────────────────────────────────────────────────────────
 *   OLDEST FIRST, by `created` — the list reads as a journey, so the garage
 *   section's road starts at the first vlog and the numbering (`n`, the "STOP
 *   01" label) counts up from it. Set `created` once when the file is added and
 *   leave it alone; it is what fixes the order. `date` is when the video was
 *   filmed and is what the page shows. Missing `created` falls back to `date`,
 *   then to the filename, so a file with neither still lands somewhere stable.
 *
 *   Anything that wants the NEWEST first reverses this list for itself — see
 *   `relatedVlogs` below. There is one order here, and it is ascending.
 *
 * ── SECTION CHROME ───────────────────────────────────────────────────────
 *   The heading and note around the list stay in garage.config.json → `vlogs`,
 *   since they describe the section rather than any one vlog:
 *
 *     "vlogs": {
 *       "title":   "Latest Vlogs",
 *       "note":    "…",
 *       "channel": "https://youtube.com/@…",   // the "all videos" link
 *       "folder":  "mygarage/vlog/config"      // documentation only — the glob
 *     }                                        //   below is what actually reads
 *
 * ── ONE FILE ─────────────────────────────────────────────────────────────
 *   public/mygarage/vlog/config/friends-trip-to-yercaud.json
 *
 *   Files whose name starts with `_` are skipped, so `_template.json` can sit
 *   in the folder as the copy-me reference without ever rendering.
 *
 *   {
 *     "created":  "2026-08-04",               // sorts the list, newest first
 *
 *     "id":       "friends-trip-to-yercaud",  // stable slug; the URL segment
 *                                             //   and the React key. Falls back
 *                                             //   to the filename, then the title.
 *
 *     "video":    "https://youtu.be/CGXdtOeAOgU",
 *                 // OPTIONAL. ANY YouTube link works — youtu.be/ID, watch?v=ID,
 *                 // /shorts/ID, /embed/ID, /live/ID, or the bare 11-char ID.
 *                 // Tracking junk like ?si=… is ignored. The id is pulled out
 *                 // of it and the poster, embed and watch URLs are built from
 *                 // that, so the link is the only thing you have to paste.
 *                 //
 *                 // Leave it empty and the vlog still gets its page and its
 *                 // card — it just has no player, and says the video is still
 *                 // to come. That way a ride can be written up, routed and
 *                 // illustrated before the cut is uploaded.
 *
 *     "title":    "Friends Trip to Yercaud",
 *     "subtitle": "Hairpins, hill air and…",  // optional; the line under the title
 *     "excerpt":  "…",                        // optional standfirst / card blurb
 *     "date":     "2025-12-30",               // ISO. What the page shows, and the
 *                                             //   fallback sort key when there
 *                                             //   is no `created`.
 *     "duration": "0:48",                     // optional "m:ss" or "h:mm:ss";
 *                                             //   the runtime badge, omitted if blank
 *     "views":    "31K",                      // optional, and authored — there is no
 *                                             //   YouTube API key in this project, so
 *                                             //   nothing can read the real count.
 *     "category": "Trips",                    // optional grouping / filter pill
 *     "tags":     ["Trip", "Hills"],          // optional
 *     "featured": true,                       // optional; surfaces it on /mygarage
 *     "type":     "short",                    // optional; inferred from a /shorts/
 *                                             //   link, else "film"
 *     "clip":     "video-previews/yarcadu.mp4",
 *                 // optional silent local mp4 for hover-to-play and for motion
 *                 // behind the hero, since a thumbnail cannot show movement.
 *                 // public/ path, or an absolute URL.
 *
 *     "rideId":   "r1",                       // optional; an id from ./garage.js →
 *                                             //   routes. Pulls in the real route,
 *                                             //   its map coordinates and its colour.
 *
 *     "description": [                        // optional; the write-up, in blocks
 *       "A paragraph.",                       //   string          → paragraph
 *       { "heading": "Getting there" },       //   { heading }     → subhead
 *       { "quote": "…", "cite": "…" }         //   { quote, cite } → pull quote
 *     ],
 *
 *     "images": [                             // optional; frame grabs / stills
 *       { "src": "gallery/travel/Travel1.jpg",
 *         "caption": "Leaving before the light",   // optional
 *         "at": "0:04",                            // optional timestamp
 *         "alt": "…" }                             // optional; falls back to caption
 *     ],
 *
 *     "videos": [                             // optional; more clips from this
 *                                             //   vlog, shown after the images
 *       "https://youtu.be/XXXXXXXXXXX",       // a bare link is enough, or:
 *       { "url":      "https://youtube.com/shorts/XXXXXXXXXXX",
 *         "title":    "The walkaround",       // optional
 *         "caption":  "…",                    // optional line under the title
 *         "duration": "1:20" },               // optional badge
 *       { "url":    "mygarage/vlog/images/first-start.mp4",
 *         "poster": "mygarage/vlog/images/first-start.jpg",
 *         "title":  "First start" }           //   a local file works too — any
 *     ],                                      //   .mp4/.webm/.mov in public/
 *
 *     "instagram": [                          // optional; reel or post permalinks
 *       "https://www.instagram.com/reel/DS5b8yIEl5K/",
 *       { "url": "https://www.instagram.com/p/XXXXXXXXXXX/",
 *         "caption": "Handing over the keys",
 *         "poster":  "mygarage/vlog/images/keys.jpg" }
 *     ],   // A bare link inherits its caption from the top-level `instagram`
 *          // list when the same post is already there, so nothing is written
 *          // twice. Give it an object with a `caption` when it isn't — an
 *          // unlabelled print leaves an empty band under the picture.
 *          // Reels and /p/ photo posts both work; each embeds as its own kind.
 *          //
 *          // `poster` is worth knowing about. With none, the print IS
 *          // Instagram's embed — it loads on its own so nothing is blank, but
 *          // it brings Instagram's action bar and sizes itself to whatever
 *          // shape that post's video is, so a landscape reel shows chrome.
 *          // Name a poster (a still you saved) and the print is just that
 *          // picture, cropped clean, with the tap going through to Instagram.
 *          //
 *          // STORY AND HIGHLIGHT LINKS (instagram.com/s/…) CANNOT EMBED.
 *          // They are the one kind Instagram serves no embed for — /p/ and
 *          // /reel/ answer the /embed endpoint, /s/ refuses it, because
 *          // stories expire after 24 hours and highlights were never in that
 *          // API. Nothing here can work around that.
 *          //
 *          // A bare /s/ link still appears: the print becomes a card naming
 *          // the story, which opens it on Instagram when tapped. Give it a
 *          // `poster` and you get a real picture in the frame instead — much
 *          // better, and the only way to have one. Screenshot the story, put
 *          // it in public/mygarage/vlog/images/, and name it here:
 *          //
 *          //   { "url": "https://www.instagram.com/s/AbC…?story_media_id=123…",
 *          //     "caption": "At the start line",
 *          //     "poster":  "mygarage/vlog/images/marathon/story-1.jpg" }
 *          //
 *          // Keep the ?story_media_id= on the link. It is what points at one
 *          // frame of a highlight — the /s/ shortcode alone is the whole
 *          // highlight, and is identical for every frame in it.
 *
 *     "posts": ["mulapari-festival-kariya-kalli-amman-temple"]
 *                 // optional slugs from src/data/blog/. Only the slug is stored —
 *                 // resolve titles with loadAllPosts() from hooks/usePosts, the
 *                 // same way /blog does. See `attachPosts` at the bottom.
 *   }
 *
 * ── ADDING A VLOG ────────────────────────────────────────────────────────
 *   Copy _template.json, rename it after the vlog, give it a title and a
 *   `created` date. That alone renders — a file in the folder is a page.
 *   Everything else is optional and fills in more of it: `video` adds the
 *   player, `description` writes the article, `images` the frame-grab strip,
 *   `videos` a grid of extra clips, `instagram` the reel wall, `rideId` the
 *   route map.
 *
 *   Photos go in public/mygarage/vlog/images/ and are referenced as
 *   'mygarage/vlog/images/<file>'.
 */

import cfg from './config.json'
import garageCfg from './garage.config.json'
import { routes } from './garage'

const BASE = import.meta.env.BASE_URL

/* The section's heading and note; the vlogs themselves come from the folder. */
const block = garageCfg.vlogs ?? {}

/**
 * Every vlog file in public/mygarage/vlog/config/, pulled in at build time.
 *
 * `eager` so the whole set is available synchronously — the list has to be
 * sortable and filterable the moment a component renders, and these are a few
 * KB of JSON each, not something worth a loading state.
 *
 * The path reaches into public/ because that is where the files live, which
 * means each one ships twice: once bundled here and once copied verbatim into
 * dist/ like everything else in public/. That is a few KB, and it buys the
 * files a stable public URL as well.
 *
 * The `!**\/_*.json` pattern keeps `_template.json` out of the bundle entirely,
 * rather than shipping its bytes and then filtering it out at runtime.
 */
const FILES = import.meta.glob(
  ['../../public/mygarage/vlog/config/*.json', '!**/_*.json'],
  { eager: true }
)

/** '.../config/friends-trip-to-yercaud.json' -> 'friends-trip-to-yercaud' */
const fileSlug = p => p.split('/').pop().replace(/\.json$/i, '')

/** Absolute URLs and data: URIs pass through; anything else is inside public/. */
const srcOf = src =>
  !src ? ''
    : /^(https?:)?\/\//.test(src) || src.startsWith('data:')
      ? src
      : BASE + String(src).split('/').map(encodeURIComponent).join('/')

/** Turn any title into a URL-safe slug, for entries that don't carry an id. */
const slugify = s => String(s ?? '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

/**
 * The video id out of any YouTube link.
 *
 * Matches how Videos.jsx reads the top-level `videos` list, so a link pasted
 * into either place behaves the same. Returns '' when nothing usable is found,
 * which is what `vlogs` filters on — a malformed link drops the entry rather
 * than rendering a broken player.
 */
function youTubeId(input) {
  const raw = String(input ?? '').trim()
  if (!raw) return ''
  if (/^[\w-]{11}$/.test(raw)) return raw           // already a bare id
  try {
    const url = new URL(raw.startsWith('//') ? 'https:' + raw : raw)
    if (url.hostname.endsWith('youtu.be')) {
      const id = url.pathname.slice(1).split('/')[0]
      return /^[\w-]{11}$/.test(id) ? id : ''
    }
    const v = url.searchParams.get('v')
    if (v && /^[\w-]{11}$/.test(v)) return v
    /* /shorts/ID, /embed/ID, /live/ID, /v/ID — the id is the segment after the kind */
    const parts = url.pathname.split('/').filter(Boolean)
    const i = parts.findIndex(p => ['shorts', 'embed', 'live', 'v'].includes(p))
    const id = i >= 0 ? parts[i + 1] : parts[parts.length - 1]
    return /^[\w-]{11}$/.test(id) ? id : ''
  } catch {
    return ''
  }
}

/** True when the link is a Shorts URL, so `type` doesn't have to be authored. */
const isShort = link => /\/shorts\//.test(String(link ?? ''))

/** '0:48' → 48 · '1:14:22' → 4462 · 135 → 135 · anything else → 0 */
function toSeconds(at) {
  if (typeof at === 'number' && isFinite(at)) return Math.max(0, Math.round(at))
  const parts = String(at ?? '').trim().split(':')
  if (!parts.length || parts.some(p => p === '' || isNaN(Number(p)))) return 0
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0)
}

/** 4462 → '1:14:22' · 48 → '0:48' */
function toClock(sec) {
  const s = Math.max(0, Math.round(sec || 0))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return (h ? h + ':' : '') + mm + ':' + String(r).padStart(2, '0')
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** '2025-12-30' → { label: '30 Dec 2025', short: 'Dec 2025', year, ms } */
function stamp(iso) {
  const [y, m, d] = String(iso ?? '').split('-').map(Number)
  if (!y || !m || !d) return { label: '', short: '', year: null, ms: 0 }
  return {
    label: `${d} ${MONTHS[m - 1]} ${y}`,
    short: `${MONTHS[m - 1]} ${y}`,
    year: y,
    ms: Date.UTC(y, m - 1, d),
  }
}

/* ── Instagram ──────────────────────────────────────────────────────────
   A vlog lists bare permalinks. The caption and category for each are looked
   up in the top-level `instagram` list by shortcode, so a reel that is already
   on the Instagram wall does not have to be described twice here. */
const IG_BY_CODE = new Map(
  (cfg.instagram ?? []).map(p => [igCode(p.url), p]).filter(([c]) => c)
)

/**
 * Split an Instagram permalink into the kind of thing it is and its shortcode.
 *
 * The kind matters: a photo post lives at /p/CODE and a reel at /reel/CODE, and
 * the embed has to be asked for under the same one. Hardcoding /reel/ breaks
 * every photo post in a list.
 *
 * ── STORIES AND HIGHLIGHTS (/s/) ──────────────────────────────────────────
 *   Accepted, but they are NOT embeddable, and that is Instagram's rule rather
 *   than a gap here. The /embed endpoint serves permanent posts only: /p/ and
 *   /reel/ both answer it with a full document, while the same request for an
 *   /s/ link is refused outright. Stories expire after 24 hours and highlights
 *   were never in the embed API.
 *
 *   So a /s/ entry can only ever be a still of your own that links out to
 *   Instagram — which the Polaroid already does for any entry with a `poster`.
 *   `igEntry` drops one that has no poster, because there would be nothing to
 *   put in the frame.
 */
function igParts(url) {
  const s = String(url ?? '')
  const m = s.match(/instagram\.com\/(reel|reels|p|tv|s)\/([\w-]+)/)
  if (!m) return null
  /* /reels/ is an alias for /reel/; everything else is already canonical */
  const kind = m[1] === 'reels' ? 'reel' : m[1]
  /* A /s/ link's shortcode identifies the HIGHLIGHT, so every frame in one
     shares it; which frame is meant rides in the query string. */
  const mediaId = s.match(/[?&]story_media_id=([\w-]+)/)?.[1] || ''
  return { kind, code: m[2], mediaId }
}

/** The shortcode out of /reel/CODE/, /p/CODE/ or /tv/CODE/. */
function igCode(url) {
  return igParts(url)?.code ?? ''
}

/**
 * One Instagram entry. Accepts a bare permalink, or an object when the post
 * needs a caption of its own — reels that aren't already on the top-level
 * `instagram` wall have nothing to inherit, and an unlabelled print leaves an
 * empty band under the picture.
 */
function igEntry(entry) {
  const raw0 = typeof entry === 'string' ? { url: entry } : (entry || {})
  const url = raw0.url || raw0.link || ''
  const parts = igParts(url)
  if (!parts) return null
  const { kind, code, mediaId } = parts
  /* the entry's own words win; otherwise inherit from the wall */
  const known = { ...(IG_BY_CODE.get(code) ?? {}), ...raw0 }
  const raw = (known.caption || '').trim()
  /* Captions are split so a card can show prose on one line and tags on
     another. Plenty of these reels are captioned with nothing but hashtags,
     though, which would leave the prose line blank — so fall back to the raw
     caption, then to the category, rather than rendering an empty heading. */
  const prose = raw.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim()
  const thumbnail = srcOf(known.poster || known.thumbnail || '')

  /* A story or highlight has no embed to fall back on — see `igParts`. It is
     kept anyway, poster or not: with one the print is that still, and without
     one the page draws a card that links out to Instagram. Dropping it would
     mean a link written into this file rendering as nothing at all, which
     reads as a bug however well documented it is. */
  const embeddable = kind !== 's'

  return {
    code,
    /* The React key. It cannot be `code` alone: every frame of one highlight
       carries the same shortcode, so two of them in a list would collide. */
    key: mediaId ? `${code}-${mediaId}` : code,
    kind,
    embeddable,
    url: known.url || url,
    /* /embed renders the post itself in an iframe with no Instagram script.
       Under the link's own kind, so a photo post isn't asked for as a reel. */
    embed: embeddable ? `https://www.instagram.com/${kind}/${code}/embed` : '',
    caption: prose || raw || known.category || '',
    hashtags: raw.match(/#\S+/g) ?? [],
    category: known.category || '',
    /* A still of your own. Instagram exposes no thumbnail without an API
       token, so the alternative is its embed — which brings its own action bar
       and sizes itself to the post's video, chrome and all. Name a poster and
       the print is just that picture, with the embed kept for the tap.
       REQUIRED for a story or highlight, which has no embed to fall back on. */
    thumbnail,
  }
}

/* ── Extra videos ───────────────────────────────────────────────────────
   The `videos` list is more clips belonging to this vlog — a second angle, a
   cut that didn't make the main edit, a walkaround. Separate from the top-level
   `video`, which is the vlog itself, and from `related`, which is other vlogs.

   An entry can be a bare link or an object. Both a YouTube link (any of the
   forms `youTubeId` accepts) and a local file are allowed, because either is a
   reasonable thing to have: a published clip, or an mp4 sitting in public/.
──────────────────────────────────────────────────────────────────────────── */
function videoEntry(v, k) {
  const raw = typeof v === 'string' ? { url: v } : (v || {})
  const link = raw.url || raw.video || raw.src || raw.id || ''
  const yt = youTubeId(link)
  /* not a YouTube link, but it names a video file → treat it as a local one */
  const isFile = !yt && /\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i.test(link)
  if (!yt && !isFile) return null
  return {
    key: yt || `v${k + 1}`,
    yt,
    isFile,
    /* one of these two is set, and the page switches on `isFile` */
    src: isFile ? srcOf(link) : '',
    embed: yt ? `https://www.youtube.com/embed/${yt}` : '',
    url: yt ? `https://youtu.be/${yt}` : srcOf(link),
    /* a local file has no thumbnail service, so it leans on `poster` if the
       entry names one and otherwise shows its own first frame */
    poster: raw.poster ? srcOf(raw.poster)
      : yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : '',
    title: raw.title || '',
    caption: raw.caption || raw.blurb || '',
    duration: raw.duration || '',
  }
}

/* ── Description blocks ─────────────────────────────────────────────────
   Normalised so a renderer can switch on `type` instead of sniffing shapes. */
function descBlocks(description) {
  return (Array.isArray(description) ? description : [])
    .map(b => {
      if (typeof b === 'string') return b.trim() ? { type: 'p', text: b } : null
      if (!b || typeof b !== 'object') return null
      if (b.heading) return { type: 'heading', text: b.heading }
      if (b.quote) return { type: 'quote', text: b.quote, cite: b.cite || '' }
      if (b.text) return { type: 'p', text: b.text }
      return null
    })
    .filter(Boolean)
}

/* ── One vlog ─────────────────────────────────────────────────────────────
   `slug` is the filename, used as the id when the file doesn't name one. */
function build(item, slug) {
  /* The video is optional. Every file in the folder becomes a page, so a vlog
     can be written up before it is filmed — or before the cut is uploaded. An
     entry with no usable link keeps everything else and simply has no player;
     `hasVideo` is what the pages switch on. */
  const yt = youTubeId(item.video)
  const hasVideo = !!yt

  const type = item.type || (isShort(item.video) ? 'short' : 'film')
  const when = stamp(item.date)
  /* what the list is ordered by — see the ORDER note at the top */
  const created = stamp(item.created)

  const totalSec = toSeconds(item.duration)

  const still = hasVideo ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : ''

  const images = (Array.isArray(item.images) ? item.images : [])
    .filter(p => p?.src)
    .map((p, k) => ({
      id: p.id ?? `i${k + 1}`,
      src: srcOf(p.src),
      caption: p.caption || '',
      at: p.at ? toClock(toSeconds(p.at)) : '',
      alt: p.alt || p.caption || item.title || 'Vlog still',
    }))

  /* The one picture that stands for the vlog: its own first frame grab, else
     the video's thumbnail. Empty when a file has neither, which the pages
     handle by drawing a placeholder rather than a broken image. */
  const cover = images[0]?.src || still

  const ride = item.rideId ? routes.find(r => r.id === item.rideId) ?? null : null

  return {
    id: item.id || slug || slugify(item.title) || yt,
    slug,
    yt,
    hasVideo,
    type,
    isShort: type === 'short',
    /* the label a blog post would put where the read time goes. With no link
       yet there is no runtime to describe, so it says so instead. */
    kind: !hasVideo ? 'Not filmed yet' : type === 'short' ? 'Short' : 'Full film',

    title: item.title || '',
    subtitle: item.subtitle || '',
    excerpt: item.excerpt || '',
    category: item.category || '',
    tags: item.tags ?? [],
    featured: !!item.featured,

    date: item.date || '',
    when,
    created: item.created || '',
    /* the value the sort actually uses: created, else the filmed date */
    orderMs: created.ms || when.ms || 0,
    duration: item.duration ? toClock(totalSec) : (totalSec ? toClock(totalSec) : ''),
    totalSec,
    views: item.views || '',

    /* everything the player needs, from the one pasted link. All empty strings
       until that link exists — the pages check `hasVideo`, never these. */
    url: hasVideo ? `https://youtu.be/${yt}` : '',
    embed: hasVideo ? `https://www.youtube.com/embed/${yt}` : '',
    poster: still,
    posterBig: hasVideo ? `https://img.youtube.com/vi/${yt}/maxresdefault.jpg` : '',
    clip: srcOf(item.clip),

    description: descBlocks(item.description),
    images,
    videos: (Array.isArray(item.videos) ? item.videos : [])
      .map(videoEntry).filter(Boolean),
    instagram: (item.instagram ?? []).map(igEntry).filter(Boolean),
    postSlugs: item.posts ?? [],
    ride,

    cover,
  }
}

/* ── Exports ────────────────────────────────────────────────────────────── */

export const vlogsTitle = block.title ?? 'Latest Vlogs'
export const vlogsNote = block.note ?? ''
export const vlogsChannel = block.channel ?? cfg.social?.youtube?.href ?? ''

/**
 * Every vlog, OLDEST `created` first — see the ORDER note at the top.
 *
 * One file in the folder is one vlog, with no other condition: a file that has
 * not been filled in yet still gets a page, so work in progress is visible
 * rather than silently missing. The only files skipped are those named with a
 * leading `_` — that's `_template.json` — and anything that isn't a JSON
 * object. The filename is the tie-breaker, so two files created the same day
 * keep a stable order instead of shuffling per build.
 *
 * `n` is stamped after the sort, so it is position in this list: the first vlog
 * is stop 01 and each new one takes the next number.
 */
export const vlogs = Object.entries(FILES)
  .map(([path, mod]) => [fileSlug(path), mod?.default ?? mod])
  .filter(([slug, data]) => !slug.startsWith('_') && data && typeof data === 'object')
  .map(([slug, data]) => build(data, slug))
  .sort((a, b) => (a.orderMs - b.orderMs) || a.slug.localeCompare(b.slug))
  .map((v, i) => ({ ...v, n: i + 1 }))

/** The newest vlog — the last one, now that the list runs oldest first. */
export const latestVlog = () => vlogs[vlogs.length - 1] ?? null

export const vlogCount = vlogs.length
export const vlogById = id => vlogs.find(v => v.id === id || v.yt === id) ?? null

/**
 * The others, same category first — what a detail page puts under "Up next".
 *
 * Newest first within each group, which is the opposite of `vlogs` itself: the
 * road on /mygarage is a journey and reads forwards, but "Up next" is a
 * what-to-watch list and the most recent vlog belongs at the front of it. Hence
 * the reverse rather than reading `vlogs` in place.
 */
export function relatedVlogs(vlog, limit = 6) {
  const newestFirst = [...vlogs].reverse()
  if (!vlog) return newestFirst.slice(0, limit)
  const rest = newestFirst.filter(v => v.id !== vlog.id)
  return [
    ...rest.filter(v => v.category === vlog.category),
    ...rest.filter(v => v.category !== vlog.category),
  ].slice(0, limit)
}

/**
 * The image a post card should show.
 *
 * Most posts don't set `coverImage`, so fall back to the first picture in the
 * body — which is what a reader would think of as the post's image anyway.
 * Paths in posts are already rooted at /, so they only need the base prefix
 * when the site is served from a sub-path.
 */
function postCover(post) {
  const direct = post.meta?.coverImage
  const fromBody = (post.sections ?? []).reduce((found, s) => {
    if (found) return found
    if (s?.src && /image|photo|figure/i.test(s.type || '')) return s.src
    if (Array.isArray(s?.images) && s.images[0]?.src) return s.images[0].src
    return found
  }, null)
  const src = direct || fromBody
  if (!src) return ''
  if (/^(https?:)?\/\//.test(src)) return src
  return BASE.replace(/\/$/, '') + (src.startsWith('/') ? src : '/' + src)
}

/**
 * Resolve a vlog's `posts` slugs into records a card can render.
 *
 * Async and separate because the blog is read through hooks/usePosts, which
 * loads Markdown lazily — pulling that in eagerly here would drag every post
 * body into this module's chunk just to render a few titles. Call it from the
 * page instead:
 *
 *   const posts = await attachPosts(vlog)
 *
 * Returns `{ slug, title, excerpt, category, icon, date, when, cover, href }`,
 * so the page never has to know the difference between a Markdown post and a
 * JSON one.
 */
export async function attachPosts(vlog) {
  if (!vlog?.postSlugs?.length) return []
  const { loadPost } = await import('../hooks/usePosts')
  const loaded = await Promise.all(
    vlog.postSlugs.map(slug => loadPost(slug).catch(() => null))
  )
  return loaded.filter(Boolean).map(post => {
    const fm = post.frontmatter ?? {}
    return {
      slug: post.slug,
      title: fm.title || post.slug,
      excerpt: fm.excerpt || '',
      category: fm.category || '',
      icon: fm.icon || post.meta?.icon || '',
      date: fm.date || '',
      when: stamp(fm.date),
      cover: postCover(post),
      href: `/blog/${post.slug}`,
    }
  })
}
