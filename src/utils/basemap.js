/**
 * The dark basemap under every Leaflet map on the site.
 *
 * Three maps draw one: the mini-map on /mygarage, the ride detail map, and the
 * route map on a vlog page. All three used to name the tile URL themselves.
 *
 * ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────
 *   They all pointed at Carto's hosted dark basemap
 *   (basemaps.cartocdn.com/dark_all), which now requires an API key. Unkeyed
 *   requests do not fail — they return a perfectly valid PNG with "API KEY
 *   REQUIRED · carto.com/basemaps/apikey" watermarked across it. So the maps
 *   kept working, kept drawing routes and pins on top, and just quietly grew a
 *   notice baked into the ground.
 *
 *   Three copies of a URL meant one provider change broke three files. The
 *   provider lives here now, once.
 *
 * ── WHICH PROVIDER ────────────────────────────────────────────────────────
 *   Esri's World Dark Gray Canvas, which needs no key and no account. It is
 *   built for exactly this job — a muted, low-contrast ground for bright data
 *   drawn over it — so the honey and red route lines read harder on it than
 *   they did on Carto.
 *
 *   To go back to Carto, put a key in .env as VITE_CARTO_API_KEY and this
 *   module switches to it on the next build. Nothing else has to change. Note
 *   that the key ships in the client bundle like any VITE_ var, so restrict it
 *   to the site's domain in the Carto dashboard.
 *
 * ── ATTRIBUTION ───────────────────────────────────────────────────────────
 *   Required by every provider here, and all three maps were built with
 *   `attributionControl: false` because Leaflet's default control is a white
 *   box on a dark map. `addBasemap` puts it back, restyled to suit, so a call
 *   site cannot forget it.
 *
 *   The exception is a map inside a rotated container — the ride detail map
 *   turns 90° for portrait routes, and a control inside it turns with it. Those
 *   pass `{ attribution: false }` and render `BASEMAP_CREDIT` themselves,
 *   outside the turn. That is the only reason to pass it.
 */

/* Set VITE_CARTO_API_KEY to switch back to Carto's dark basemap. */
const CARTO_KEY = import.meta.env.VITE_CARTO_API_KEY || ''

/**
 * Esri World Dark Gray Canvas — no key, no account. Note {z}/{y}/{x}.
 *
 * TWO LAYERS, and both are needed. Esri splits its Canvas basemaps in half:
 * `..._Base` is the ground with NO place names on it at all, and `..._Reference`
 * is the labels and nothing else, meant to be stacked on top. Add only the base
 * and you get a technically working map that reads as empty — grey shapes, no
 * towns, no road numbers. Carto's dark_all was a single layer with labels baked
 * in, so nothing here needed a second layer before.
 *
 * Both go in Leaflet's tilePane, so the labels sit under the route line and the
 * pins — the same stacking Carto's tiles had.
 */
const ESRI = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/'
    + 'Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/'
    + 'Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
  /* Its grey needs darkening and tinting — see `ensureBasemapStyle`. */
  tint: true,
  /* The service stops at level 16. `maxNativeZoom` lets Leaflet upscale that
     last tile past it rather than serving blanks, so the maps keep the zoom
     range they were built with — fitBounds on a short ride can ask for more. */
  options: { maxNativeZoom: 16, maxZoom: 19 },
  credit: 'Tiles © Esri — Esri, DeLorme, NAVTEQ',
  html: 'Tiles &copy; <a href="https://www.esri.com" target="_blank"'
    + ' rel="noopener noreferrer">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
}

/** Carto's dark basemap, used only when a key is configured. */
const carto = key => ({
  url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${key}`,
  options: { subdomains: 'abcd', maxZoom: 19 },
  credit: '© OpenStreetMap contributors © CARTO',
  html: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank"'
    + ' rel="noopener noreferrer">OpenStreetMap</a> contributors'
    + ' &copy; <a href="https://carto.com/attributions" target="_blank"'
    + ' rel="noopener noreferrer">CARTO</a>',
})

const basemap = CARTO_KEY ? carto(CARTO_KEY) : ESRI

/** Plain-text credit, for a map that has to render its own (see the note above). */
export const BASEMAP_CREDIT = basemap.credit

/**
 * The one stylesheet this module owns, injected on first use the same way each
 * map file injects its own. Two jobs:
 *
 * ── THE TINT ──────────────────────────────────────────────────────────────
 *   Esri's canvas ships as a mid-grey, which reads as washed out against these
 *   near-black panels. The ground is darkened and pushed towards navy in CSS.
 *
 *   Grey has no hue to rotate, so `hue-rotate` alone does nothing to it —
 *   `sepia` first gives the pixels a warm cast that there IS something to
 *   rotate, and 180° lands that warm cast on blue. `saturate` then decides how
 *   far from neutral it ends up and `brightness` how dark. To retune: lower
 *   `brightness` for blacker, raise `saturate` for bluer, drop `sepia` to 0 for
 *   a straight neutral black.
 *
 *   Only the GROUND is filtered. The labels are a separate layer, so the place
 *   names stay bright over a dark map instead of sinking into it — which is the
 *   whole reason the two-layer split is worth having.
 *
 * ── THE ATTRIBUTION BOX ───────────────────────────────────────────────────
 *   Leaflet's is white with dark text, which is wrong on all three of these
 *   maps. `pointer-events: auto` matters: two of them sit in a container with
 *   pointer-events off so a static plate cannot swallow a scroll, and the
 *   credit link has to stay clickable inside it.
 */
function ensureBasemapStyle() {
  if (document.getElementById('basemap-style')) return
  const s = document.createElement('style')
  s.id = 'basemap-style'
  s.textContent = `
    .bm-ground{
      filter:sepia(0.55) hue-rotate(178deg) saturate(2.1) brightness(0.46) contrast(1.06);
    }
    .bm-labels{ filter:brightness(1.12) contrast(1.06); }
    .leaflet-control-attribution{
      background:rgba(13,11,20,0.7)!important;
      color:rgba(240,238,232,0.45)!important;
      font-size:9px!important;line-height:1.5!important;
      padding:1px 6px!important;margin:0!important;
      border-radius:4px 0 0 0;pointer-events:auto;
      text-shadow:none!important;
    }
    .leaflet-control-attribution a{
      color:rgba(240,238,232,0.7)!important;text-decoration:none
    }
    .leaflet-control-attribution a:hover{text-decoration:underline}
  `
  document.head.appendChild(s)
}

/**
 * Add the basemap to a Leaflet map, with its attribution.
 *
 *   addBasemap(L, map)                        // the normal case
 *   addBasemap(L, map, { attribution: false }) // rotated container; credit it yourself
 *
 * Returns the tile layer, for anything that wants to hold on to it.
 */
export function addBasemap(L, map, { attribution = true } = {}) {
  /* Unconditional: the tint lives in this sheet too, and the ride detail map
     opts out of the attribution control while still needing the colour. */
  ensureBasemapStyle()

  const layer = L.tileLayer(basemap.url, {
    ...basemap.options,
    attribution: basemap.html,
    /* Leaflet puts this on the layer's own container, so the filter applies to
       every tile in it and to nothing else on the map. Only where the provider
       asks for it: Carto's dark_all is already near-black, and darkening that
       again would bury it. */
    className: basemap.tint ? 'bm-ground' : '',
  }).addTo(map)

  /* The place names, where the provider keeps them in their own layer. Added
     second so it stacks above the ground within the tile pane. */
  if (basemap.labels) {
    L.tileLayer(basemap.labels, { ...basemap.options, className: 'bm-labels' }).addTo(map)
  }

  if (attribution) {
    /* Every one of these maps is built with `attributionControl: false`, so
       there is nothing to show the layer's credit in. Leaflet's control picks
       up the attributions of layers already on the map when it is added, so
       adding it after the tiles is fine. `prefix: false` drops the "Leaflet"
       ribbon — the library does not need crediting in a 9px strip. */
    if (!map.attributionControl) {
      L.control.attribution({ prefix: false }).addTo(map)
    }
  }

  return layer
}
