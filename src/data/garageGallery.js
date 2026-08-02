/**
 * The garage photo wall, read straight out of `config.json` → `garage.gallery`.
 *
 * Same idea as ../data/accessories.js: the content lives in config so photos and
 * captions can be edited without opening a component. Rendered by the polaroid
 * ticker on /mygarage (see components/garage/PolaroidTicker.jsx).
 *
 * Not to be confused with `garageGallery` in ./garage.js — that's the older
 * hard-coded tabbed gallery still used by the /garage prototypes.
 *
 * Config shape:
 *   {
 *     "title": "Ride Gallery",          // optional section heading
 *     "note":  "…",                     // optional line under the heading
 *     "ticker": { … },                  // optional; see TICKER_DEFAULTS below
 *     "photos": [
 *       {
 *         "src":      "mygarage/gallery/yelagiri.jpg",  // public/ path, or an https URL
 *         "caption":  "First light on the ghat",        // the handwritten line
 *         "location": "Yelagiri Hills",                 // optional
 *         "date":     "May 2026",                       // optional
 *         "alt":      "…",                              // optional; falls back to caption
 *         "link":     "https://…"                       // optional; makes the polaroid clickable
 *       }
 *     ]
 *   }
 *
 * To swap the samples for real photos: drop the files into
 * public/mygarage/gallery/ and change each `src` to its path relative to
 * public/ — absolute URLs are left alone, so the two can be mixed while the
 * real set is still being shot.
 */

import cfg from './config.json'

const BASE = import.meta.env.BASE_URL

const gallery = cfg.garage?.gallery ?? {}

/** Ticker tuning, with the defaults the design was drawn at. */
const TICKER_DEFAULTS = {
  photoSize: 210,     // px — the square photo inside the frame
  gap: 34,            // px between polaroids
  tilt: 8,            // deg — the max either way; each card gets its own angle
  speed: 46,          // px/s of idle drift, leftwards
  scrollBoost: 2.2,   // how hard page scroll shoves the strip along
  pauseOnHover: true,
}

/** Absolute URLs pass through; anything else is a path inside public/. */
const srcOf = src =>
  /^(https?:)?\/\//.test(src) || src?.startsWith('data:') ? src : BASE + String(src ?? '')

export const galleryTitle = gallery.title ?? 'Ride Gallery'
export const galleryNote = gallery.note ?? ''
export const galleryTicker = { ...TICKER_DEFAULTS, ...(gallery.ticker ?? {}) }

/** Every photo, resolved and given a fallback `alt`. Entries with no src are dropped. */
export const galleryPhotos = (gallery.photos ?? [])
  .filter(p => p?.src)
  .map((p, i) => ({
    id: p.id ?? `g${i + 1}`,
    ...p,
    src: srcOf(p.src),
    alt: p.alt || p.caption || p.location || 'Ride photo',
  }))

export const galleryCount = galleryPhotos.length
