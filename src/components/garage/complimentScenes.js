/**
 * Little animated scenes for a ride's compliments, chosen by what each one SAYS.
 *
 * "Evening tea/coffee + snacks" draws a cup with a tea bag bobbing in it, steam
 * coming off the top and tiffin on a leaf beside it. "Lucky rider wins a
 * special gift" draws a trophy catching the light. The drawing IS the content,
 * not decoration next to it — which matters because a compliments list is
 * short, repetitive in wording, and otherwise reads as a wall of small text.
 *
 * Same idea as ./mileageScene.js: the art lives beside the component that uses
 * it, so the component file stays about layout.
 *
 * ── HOW A SCENE IS PICKED ─────────────────────────────────────────────────
 *   `kindOf` runs the perk text past an ORDERED list of patterns and takes the
 *   first hit. Order is the whole design: "accommodation with breakfast
 *   included" matches both `bed` and `plate`, and it is a room that happens to
 *   feed you, so `bed` is tested first. Anything unmatched falls to `tick`,
 *   which is the same fallback the config's iconless entries already used.
 *
 *   Nothing here reads the entry's emoji. A compliment authored as a plain
 *   string has none, and those are exactly the ones that most need a picture.
 *
 * ── HOW THEY ARE DRAWN ────────────────────────────────────────────────────
 *   Full colour with real shading. Four rules keep fourteen separate drawings
 *   looking like one set:
 *
 *     ONE LIGHT, TOP LEFT.  Every gradient runs light to dark downward and
 *       every highlight sits upper left. Two light directions across a set of
 *       icons is the fastest way to make them look bought from different places.
 *     EVERYTHING SITS ON SOMETHING.  A soft contact shadow under each object,
 *       or the drawing floats in the middle of its box.
 *     THREE TONES, NO MORE.  Body gradient, one highlight, one shadow. More
 *       turns to mud at the 48-64px these are viewed at.
 *     A BEAT OF LIFE.  Something moves as if alive rather than merely
 *       animating — the tea bag bobs and waves, the nozzle drips, wheels turn.
 *
 *   GRADIENTS ARE SHARED. `SCENE_DEFS` is rendered ONCE by the component into a
 *   hidden <svg>; every scene references those ids. Repeating <defs> per scene
 *   would multiply the same seventeen gradients across the document.
 *
 *   Each scene keeps ONE element on `currentColor`, so the ride's accent still
 *   appears without the crockery changing colour from ride to ride.
 *
 * ── WHY THE ART IS STRINGS ────────────────────────────────────────────────
 *   These are injected with `dangerouslySetInnerHTML`. The content is authored
 *   in this file and never touches ride config or anything a reader supplies,
 *   so there is nothing to escape; hand-converting fourteen drawings to JSX
 *   would buy nothing and lose a diffable relationship with the design studies
 *   in Preview/compliments-*.html that these came from.
 *
 * ── SIZE ──────────────────────────────────────────────────────────────────
 *   Drawn for 48-80px. Below about 44 the shading stops reading and a flat icon
 *   would do the job better.
 */

/* first match wins — see HOW A SCENE IS PICKED */
const RULES = [
  /* Both a drink AND food named: the one case with its own drawing, because
     "Evening tea/coffee + snacks" is two things on a table and showing one of
     them loses half the perk. Tested before either `brew` or `plate`, which
     would each swallow it. */
  [/(tea|coffee|chai).*(snack|breakfast|food|combo|refreshment)|(snack|breakfast|food|combo|refreshment).*(tea|coffee|chai)/i, 'brewplate'],
  /* Before `plate`: "accommodation with breakfast included" is a room that
     happens to feed you. The other way round it drew a dinner plate for a
     three-night stay. */
  [/room|stay|accommodat|night|hotel|twin.?shar|sleep/i, 'bed'],
  [/breakfast|snack|lunch|dinner|meal|food|combo|refreshment/i, 'plate'],
  [/tea|coffee|chai|drink|beverage/i, 'brew'],
  [/mechanic|spare|backup|van|breakdown|tool|service support/i, 'spanner'],
  [/medical|medic|first.?aid|ambulance|doctor|safety/i, 'aid'],
  [/fuel|petrol|refuel|tank/i, 'fuel'],
  [/lucky|draw|prize|win|trophy|champion/i, 'trophy'],
  [/badge|sticker|patch|tee|t.?shirt|jersey|merch/i, 'badge'],
  [/gift|surprise|goodie|hamper|souvenir/i, 'gift'],
  [/bike|motorcycle|brand|rider|ride/i, 'bike'],
  [/photo|photograph|picture|shoot|camera/i, 'camera'],
  [/water|bottle|hydrat/i, 'bottle'],
]

/** Which drawing a compliment gets. */
export const kindOf = text =>
  (RULES.find(([re]) => re.test(String(text || '')))?.[1]) || 'tick'

/**
 * Compliments that draw the same picture, merged into one entry.
 *
 * A ride commonly lists "Breakfast combo with tea/coffee" AND "Evening
 * tea/coffee + snacks". Both are genuinely separate inclusions, but both draw a
 * cup of tea — and the same illustration twice in one column reads as a
 * rendering bug rather than as two meals. Merged, the picture is shown once and
 * both lines sit beside it.
 *
 * Returns `[{ kind, texts }]` in first-appearance order, so the list keeps the
 * order the ride authored. Nothing is discarded: every text survives in
 * `texts`, and a COUNT must still be summed from `texts.length` — four
 * inclusions shown in three rows is four inclusions.
 */
export function groupByScene(items) {
  const order = []
  const seen = new Map()
  for (const c of items ?? []) {
    const text = typeof c === 'string' ? c : (c?.text || '')
    const kind = kindOf(text)
    const hit = seen.get(kind)
    if (hit) { hit.texts.push(text); continue }
    const group = { kind, texts: [text] }
    seen.set(kind, group)
    order.push(group)
  }
  return order
}

/* ── the paint ──────────────────────────────────────────────────────────────
   Every gradient runs light at the top to dark at the bottom — see ONE LIGHT,
   TOP LEFT. Rendered once by the component. */
export const SCENE_DEFS = `
  <linearGradient id="sg-porc" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef2f7"/>
    <stop offset="1" stop-color="#c3ccd8"/></linearGradient>
  <linearGradient id="sg-porc2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fbfdff"/><stop offset="1" stop-color="#b9c3d1"/></linearGradient>
  <radialGradient id="sg-tea" cx=".35" cy=".3" r=".8">
    <stop offset="0" stop-color="#d69a5c"/><stop offset="1" stop-color="#8b5324"/></radialGradient>
  <linearGradient id="sg-bag" x1="0" y1="0" x2=".4" y2="1">
    <stop offset="0" stop-color="#f7e6c0"/><stop offset="1" stop-color="#c9a468"/></linearGradient>
  <linearGradient id="sg-pastry" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0" stop-color="#e6b878"/><stop offset="1" stop-color="#9c6631"/></linearGradient>
  <linearGradient id="sg-leaf" x1=".1" y1="0" x2=".5" y2="1">
    <stop offset="0" stop-color="#86d94f"/><stop offset=".55" stop-color="#5cb033"/>
    <stop offset="1" stop-color="#2f7a1f"/></linearGradient>
  <radialGradient id="sg-idli" cx=".35" cy=".3" r=".8">
    <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e2e6dd"/></radialGradient>
  <radialGradient id="sg-sambar" cx=".35" cy=".3" r=".8">
    <stop offset="0" stop-color="#f7ab53"/><stop offset="1" stop-color="#c2551a"/></radialGradient>
  <linearGradient id="sg-gold" x1="0" y1="0" x2=".35" y2="1">
    <stop offset="0" stop-color="#ffe9a3"/><stop offset=".5" stop-color="#f0b93f"/>
    <stop offset="1" stop-color="#b07d16"/></linearGradient>
  <linearGradient id="sg-silver" x1="0" y1="0" x2=".35" y2="1">
    <stop offset="0" stop-color="#f4f7fb"/><stop offset="1" stop-color="#95a1b2"/></linearGradient>
  <linearGradient id="sg-red" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0" stop-color="#ff8b7e"/><stop offset="1" stop-color="#c02a1e"/></linearGradient>
  <linearGradient id="sg-blue" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0" stop-color="#9cc6f5"/><stop offset="1" stop-color="#2f5fa8"/></linearGradient>
  <linearGradient id="sg-green" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0" stop-color="#9ade72"/><stop offset="1" stop-color="#3c8a2b"/></linearGradient>
  <linearGradient id="sg-wood" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0" stop-color="#c98f54"/><stop offset="1" stop-color="#794d26"/></linearGradient>
  <linearGradient id="sg-dark" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0" stop-color="#5b6675"/><stop offset="1" stop-color="#232a35"/></linearGradient>
  <linearGradient id="sg-cloth" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0" stop-color="#dbe4f0"/><stop offset="1" stop-color="#8e9cb0"/></linearGradient>
  <radialGradient id="sg-cast" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#000" stop-opacity=".42"/>
    <stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`

/* the contact shadow every object stands on */
const cast = (cx, cy, rx, ry) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#sg-cast)"/>`

/* The tea bag character. The face is two dots, a highlight and an open mouth,
   and that is all a face needs at this size. */
const TEABAG = `
  <g class="sc-dunk">
    <path d="M26 8h11v15l-5.5 5-5.5-5z" fill="url(#sg-bag)" stroke="#a9823f" stroke-width=".8"/>
    <path d="M26 8h11l-5.5 5z" fill="#000" fill-opacity=".1"/>
    <circle cx="29.4" cy="14" r="1.5" fill="#3a2a12"/>
    <circle cx="34" cy="14" r="1.5" fill="#3a2a12"/>
    <circle cx="29.9" cy="13.5" r=".5" fill="#fff"/>
    <circle cx="34.5" cy="13.5" r=".5" fill="#fff"/>
    <ellipse cx="31.7" cy="18.4" rx="1.7" ry="2.2" fill="#7a3b22"/>
    <path class="sc-arm sc-arm-l" d="M26 13c-3.5-1-5.5-3.5-5.5-6.5" fill="none"
          stroke="#3a2a12" stroke-width="1.5" stroke-linecap="round"/>
    <path class="sc-arm sc-arm-r" d="M37 13c3.5-1 5.5-3.5 5.5-6.5" fill="none"
          stroke="#3a2a12" stroke-width="1.5" stroke-linecap="round"/>
  </g>`

/** kind -> the inner markup of a 64x64 <svg>. */
export const SCENE_ART = {
  /* Tea with the bag still in it, steam off the top, tiffin on a leaf beside
     it. The one most rides actually hit. */
  brewplate: `
    ${cast(27, 56, 25, 5)}
    <path class="sc-st sc-st1" d="M17 19c0-4 4-4 4-8s-4-4-4-8"/>
    <path class="sc-st sc-st2" d="M24 17c0-4 4-4 4-8"/>
    ${TEABAG}
    <path d="M8 55c12 4 24 4 36 0l-3-2H11z" fill="url(#sg-porc2)"/>
    <ellipse cx="26" cy="51" rx="22" ry="5.5" fill="url(#sg-porc2)"/>
    <ellipse cx="26" cy="50" rx="18" ry="4" fill="#000" fill-opacity=".07"/>
    <path d="M44 32a8 8 0 0 1 0 12" fill="none" stroke="url(#sg-porc)" stroke-width="4"
          stroke-linecap="round"/>
    <path d="M10 27h34l-2.5 17a7 7 0 0 1-7 6H19.5a7 7 0 0 1-7-6z" fill="url(#sg-porc)"/>
    <path d="M14 30l-1.5 13a6 6 0 0 0 2 4" fill="none" stroke="#fff" stroke-width="2.4"
          stroke-opacity=".75" stroke-linecap="round"/>
    <ellipse cx="27" cy="27.5" rx="17" ry="4.6" fill="url(#sg-tea)"/>
    <ellipse cx="22" cy="26.5" rx="6" ry="1.6" fill="#fff" fill-opacity=".22"/>
    <path d="M31.5 28v-5" stroke="#c8a25e" stroke-width="1" stroke-opacity=".9"/>
    ${cast(51, 55, 13, 3)}
    <path d="M38 48Q44 40 51 40Q58 40 64 48Q58 55 51 55Q44 55 38 48Z" fill="url(#sg-leaf)"/>
    <path d="M39 48H63" stroke="#245f18" stroke-width=".8" stroke-opacity=".7"/>
    <g class="sc-bob sc-b2">
      <circle cx="46" cy="46" r="5" fill="url(#sg-idli)"/>
      <ellipse cx="44.4" cy="44.2" rx="1.9" ry="1.1" fill="#fff" fill-opacity=".7"/>
    </g>
    <g class="sc-bob sc-b3">
      <circle cx="56" cy="47" r="4.6" fill="url(#sg-pastry)"/>
      <circle cx="56" cy="47" r="1.6" fill="#7a4a20"/>
    </g>`,

  brew: `
    ${cast(32, 56, 26, 5)}
    <path class="sc-st sc-st1" d="M22 19c0-4 4-4 4-8s-4-4-4-8"/>
    <path class="sc-st sc-st2" d="M30 17c0-4 4-4 4-8s-4-4-4-7"/>
    <path class="sc-st sc-st3" d="M39 19c0-4 4-4 4-8"/>
    <ellipse cx="32" cy="52" rx="24" ry="6" fill="url(#sg-porc2)"/>
    <ellipse cx="32" cy="51" rx="19" ry="4.2" fill="#000" fill-opacity=".07"/>
    <path d="M50 32a9 9 0 0 1 0 13" fill="none" stroke="url(#sg-porc)" stroke-width="4.4"
          stroke-linecap="round"/>
    <path d="M13 26h38l-3 19a7 7 0 0 1-7 6H23a7 7 0 0 1-7-6z" fill="url(#sg-porc)"/>
    <path d="M18 29l-1.6 15a6 6 0 0 0 2 4" fill="none" stroke="#fff" stroke-width="2.6"
          stroke-opacity=".75" stroke-linecap="round"/>
    <ellipse cx="32" cy="26.5" rx="19" ry="5" fill="url(#sg-tea)"/>
    <ellipse cx="26" cy="25.5" rx="6.5" ry="1.8" fill="#fff" fill-opacity=".22"/>
    <ellipse cx="32" cy="26.5" rx="19" ry="5" fill="none" stroke="currentColor"
             stroke-width="1" stroke-opacity=".5"/>`,

  /* BREAKFAST OR LUNCH — a South Indian thali on a banana leaf. A generic
     dinner plate was wrong for a Tamil Nadu ride; this is what a club's
     "breakfast combo" actually is. */
  plate: `
    ${cast(32, 57, 29, 4)}
    <path class="sc-st sc-st1" d="M27 19c0-3.5 3.5-3.5 3.5-7s-3.5-3.5-3.5-6.5"/>
    <path class="sc-st sc-st2" d="M36 17c0-3.5 3.5-3.5 3.5-7"/>
    <path d="M2 33Q12 12 32 12Q52 12 62 33Q52 56 32 56Q12 56 2 33Z" fill="url(#sg-leaf)"/>
    <path d="M2 33Q12 12 32 12Q52 12 62 33Q42 26 2 33Z" fill="#fff" fill-opacity=".13"/>
    <path d="M4 33H60" stroke="#245f18" stroke-width="1.2" stroke-opacity=".8"/>
    <g stroke="#245f18" stroke-width=".7" stroke-opacity=".34" fill="none">
      <path d="M13 31l-4-7M24 29l-3-8M35 28l-2-8M46 29l2-8M56 31l4-7"/>
      <path d="M13 35l-4 7M24 37l-3 8M35 38l-2 8M46 37l2 8M56 35l4 7"/>
    </g>
    <circle cx="20" cy="25" r="7" fill="url(#sg-silver)"/>
    <circle cx="20" cy="25" r="5.4" fill="url(#sg-sambar)"/>
    <ellipse cx="18" cy="23" rx="2" ry="1.1" fill="#fff" fill-opacity=".3"/>
    <ellipse cx="21.5" cy="25" rx="2.4" ry="1.2" fill="#1f5c18" transform="rotate(-24 21.5 25)"/>
    <circle cx="37" cy="23" r="6.4" fill="url(#sg-silver)"/>
    <circle cx="37" cy="23" r="4.9" fill="#f6f8f2"/>
    <g fill="#2c3a28"><circle cx="35.4" cy="21.6" r=".5"/><circle cx="38.4" cy="22.6" r=".5"/>
      <circle cx="36.6" cy="24.6" r=".5"/></g>
    <circle cx="52" cy="27" r="5" fill="url(#sg-sambar)"/>
    <ellipse cx="52.6" cy="27" rx="2.2" ry="1.1" fill="#1f5c18" transform="rotate(-24 52.6 27)"/>
    <g class="sc-bob sc-b1">
      <circle cx="19" cy="44" r="8" fill="url(#sg-idli)"/>
      <ellipse cx="16.4" cy="41" rx="3" ry="1.8" fill="#fff" fill-opacity=".7"/>
    </g>
    <g class="sc-bob sc-b2">
      <circle cx="31" cy="47" r="7.2" fill="url(#sg-idli)"/>
      <ellipse cx="28.6" cy="44.4" rx="2.6" ry="1.6" fill="#fff" fill-opacity=".7"/>
    </g>
    <g class="sc-bob sc-b3">
      <circle cx="47" cy="45" r="7" fill="url(#sg-pastry)"/>
      <circle cx="47" cy="45" r="2.4" fill="#7a4a20"/>
      <ellipse cx="44.6" cy="42.4" rx="2.4" ry="1.4" fill="#fff" fill-opacity=".22"/>
    </g>`,

  gift: `
    ${cast(32, 56, 22, 4)}
    <g class="sc-lid">
      <rect x="11" y="21" width="42" height="11" rx="3" fill="url(#sg-red)"/>
      <rect x="11" y="21" width="42" height="3.5" rx="1.7" fill="#fff" fill-opacity=".3"/>
      <rect x="28" y="21" width="8" height="11" fill="currentColor"/>
      <path d="M32 21c-7-11-17-6-11 0M32 21c7-11 17-6 11 0" fill="none"
            stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>
    </g>
    <rect x="15" y="33" width="34" height="21" rx="3" fill="url(#sg-red)"/>
    <rect x="15" y="33" width="34" height="21" rx="3" fill="#000" fill-opacity=".12"/>
    <rect x="17" y="35" width="4" height="17" rx="2" fill="#fff" fill-opacity=".22"/>
    <rect x="28" y="33" width="8" height="21" fill="currentColor"/>
    <g class="sc-spark sc-s1"><path d="M9 17l1.7 4.5L15 23l-4.3 1.5L9 29l-1.7-4.5L3 23l4.3-1.5z" fill="#ffe9a3"/></g>
    <g class="sc-spark sc-s2"><path d="M55 13l1.2 3.2L59.4 17l-3.2 1.2L55 21l-1.2-2.8L50.6 17l3.2-1.2z" fill="#ffe9a3"/></g>`,

  trophy: `
    ${cast(32, 56, 18, 4)}
    <g class="sc-conf sc-c1"><rect x="13" y="6" width="3.4" height="5.5" rx="1.4" fill="url(#sg-red)"/></g>
    <g class="sc-conf sc-c2"><rect x="31" y="4" width="3.4" height="5.5" rx="1.4" fill="url(#sg-blue)"/></g>
    <g class="sc-conf sc-c3"><rect x="48" y="7" width="3.4" height="5.5" rx="1.4" fill="url(#sg-green)"/></g>
    <path d="M20 14h24v10a12 12 0 0 1-24 0z" fill="url(#sg-gold)"/>
    <path d="M23 15v9a9 9 0 0 0 4 7.4" fill="none" stroke="#fff" stroke-width="2.4"
          stroke-opacity=".55" stroke-linecap="round"/>
    <path d="M20 16h-5.5a7 7 0 0 0 7 7M44 16h5.5a7 7 0 0 1-7 7" fill="none"
          stroke="url(#sg-gold)" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="28.5" y="35" width="7" height="7" fill="url(#sg-gold)"/>
    <rect x="19" y="42" width="26" height="7" rx="2.2" fill="url(#sg-gold)"/>
    <rect x="21" y="43.4" width="22" height="1.8" rx=".9" fill="#fff" fill-opacity=".45"/>
    <rect x="24" y="18" width="16" height="4" rx="2" fill="currentColor" fill-opacity=".9"/>
    <rect class="sc-shine" x="15" y="6" width="7" height="46" fill="#fff" fill-opacity=".5"/>`,

  badge: `
    ${cast(32, 58, 16, 3.5)}
    <g class="sc-rock">
      <path d="M24 44l-4 16 12-5.5L44 60l-4-16z" fill="currentColor"/>
      <path d="M24 44l-4 16 12-5.5z" fill="#000" fill-opacity=".18"/>
      <path d="M32 6l5.4 4.4 7-.8 2.1 6.7 6.2 3.3-2.5 6.6 2.5 6.6-6.2 3.3-2.1 6.7-7-.8L32 47l-5.4-4.6-7 .8-2.1-6.7-6.2-3.3 2.5-6.6-2.5-6.6 6.2-3.3 2.1-6.7 7 .8z"
            fill="url(#sg-gold)"/>
      <circle cx="32" cy="26.5" r="9.5" fill="url(#sg-red)"/>
      <circle cx="32" cy="26.5" r="9.5" fill="none" stroke="#fff" stroke-width="1.4" stroke-opacity=".5"/>
      <path d="M29 26.5l2.4 2.4 5-5" fill="none" stroke="#fff" stroke-width="2.4"
            stroke-linecap="round" stroke-linejoin="round"/>
      <rect class="sc-shine" x="13" y="2" width="6" height="50" fill="#fff" fill-opacity=".55"/>
    </g>`,

  bike: `
    ${cast(32, 55, 27, 4)}
    <g class="sc-spin" style="transform-origin:17px 39px">
      <circle cx="17" cy="39" r="11.5" fill="url(#sg-dark)"/>
      <circle cx="17" cy="39" r="6.5" fill="url(#sg-silver)"/>
      <circle cx="17" cy="39" r="2" fill="#4a5464"/>
      <path d="M17 32.5v13M10.5 39h13M12.4 34.4l9.2 9.2M21.6 34.4l-9.2 9.2"
            stroke="#8e9cb0" stroke-width="1.2"/>
    </g>
    <g class="sc-spin" style="transform-origin:47px 39px">
      <circle cx="47" cy="39" r="11.5" fill="url(#sg-dark)"/>
      <circle cx="47" cy="39" r="6.5" fill="url(#sg-silver)"/>
      <circle cx="47" cy="39" r="2" fill="#4a5464"/>
      <path d="M47 32.5v13M40.5 39h13M42.4 34.4l9.2 9.2M51.6 34.4l-9.2 9.2"
            stroke="#8e9cb0" stroke-width="1.2"/>
    </g>
    <path d="M17 39l10-12h12l8 12" fill="none" stroke="currentColor" stroke-width="3.4"
          stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M25 27h-6M39 27l6-6h5" fill="none" stroke="#5b6675" stroke-width="2.8"
          stroke-linecap="round"/>
    <path d="M26 24h13l3 4H25z" fill="url(#sg-red)"/>
    <path d="M26 24h13l-1 1.6H26.6z" fill="#fff" fill-opacity=".35"/>
    <circle cx="50" cy="21" r="3.4" fill="url(#sg-gold)"/>
    <path class="sc-road" d="M2 54h60" stroke="#8e9cb0" stroke-width="2.4"
          stroke-opacity=".5" stroke-dasharray="8 7" stroke-linecap="round"/>`,

  bed: `
    ${cast(32, 55, 26, 4)}
    <text class="sc-z sc-z1" x="41" y="20" font-family="system-ui,sans-serif"
          font-size="12" font-weight="800" fill="currentColor">z</text>
    <text class="sc-z sc-z2" x="49" y="13" font-family="system-ui,sans-serif"
          font-size="8.5" font-weight="800" fill="currentColor">z</text>
    <rect x="5" y="24" width="4.5" height="26" rx="2" fill="url(#sg-wood)"/>
    <rect x="54.5" y="34" width="4.5" height="16" rx="2" fill="url(#sg-wood)"/>
    <rect x="7" y="36" width="50" height="12" rx="3" fill="url(#sg-cloth)"/>
    <rect x="7" y="36" width="50" height="3.5" rx="1.7" fill="#fff" fill-opacity=".45"/>
    <path d="M7 42h50" stroke="currentColor" stroke-width="2" stroke-opacity=".7"/>
    <rect x="10" y="29" width="15" height="8" rx="4" fill="#fbfdff"/>
    <rect x="10" y="29" width="15" height="8" rx="4" fill="url(#sg-porc2)" fill-opacity=".5"/>
    <circle cx="30" cy="33.5" r="4.2" fill="url(#sg-pastry)"/>
    <path d="M28.4 33.2h.01M31.6 33.2h.01" stroke="#5a3a1a" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="5" y="48" width="4.5" height="6" rx="2" fill="url(#sg-wood)"/>
    <rect x="54.5" y="48" width="4.5" height="6" rx="2" fill="url(#sg-wood)"/>`,

  spanner: `
    ${cast(32, 56, 20, 4)}
    <g class="sc-turn" style="transform-origin:40px 36px">
      <path d="M40 25l9.5 5.5v11L40 47l-9.5-5.5v-11z" fill="url(#sg-dark)"/>
      <path d="M40 25l9.5 5.5L40 36l-9.5-5.5z" fill="#fff" fill-opacity=".16"/>
      <circle cx="40" cy="36" r="4" fill="#232a35"/>
    </g>
    <g class="sc-wrench" style="transform-origin:46px 46px">
      <path d="M21 14a10 10 0 0 0 13 13l14.5 14.5a5 5 0 0 1-7 7L27 34A10 10 0 0 0 14 21z"
            fill="url(#sg-silver)"/>
      <path d="M21 14a10 10 0 0 0 13 13l14.5 14.5" fill="none" stroke="#fff"
            stroke-width="2" stroke-opacity=".6" stroke-linecap="round"/>
      <circle cx="45" cy="45" r="2.4" fill="currentColor"/>
    </g>`,

  aid: `
    ${cast(32, 54, 23, 4)}
    <circle class="sc-ring" cx="32" cy="33" r="20" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <rect x="10" y="18" width="44" height="31" rx="6" fill="url(#sg-red)"/>
    <rect x="10" y="18" width="44" height="6" rx="5" fill="#fff" fill-opacity=".25"/>
    <rect x="25" y="13" width="14" height="6" rx="2.4" fill="url(#sg-dark)"/>
    <rect x="10" y="30" width="44" height="4" fill="#000" fill-opacity=".16"/>
    <path class="sc-pulse" d="M28 26h8v6h6v8h-6v6h-8v-6h-6v-8h6z" fill="#fff"/>`,

  fuel: `
    ${cast(24, 56, 20, 4)}
    <path d="M8 54V16a7 7 0 0 1 7-7h11a7 7 0 0 1 7 7v38z" fill="url(#sg-red)"/>
    <path d="M10 16a5 5 0 0 1 5-5h4v43h-9z" fill="#fff" fill-opacity=".18"/>
    <rect x="13" y="16" width="16" height="11" rx="2.4" fill="url(#sg-dark)"/>
    <rect x="15" y="18" width="12" height="3" rx="1.5" fill="currentColor" fill-opacity=".9"/>
    <path d="M33 24h8a5 5 0 0 1 5 5v14a4.5 4.5 0 0 0 9 0V26l-5-6" fill="none"
          stroke="url(#sg-silver)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="4" y="53" width="36" height="4" rx="2" fill="url(#sg-dark)"/>
    <circle class="sc-drop" cx="46" cy="32" r="3" fill="url(#sg-blue)"/>`,

  camera: `
    ${cast(32, 56, 24, 4)}
    <path class="sc-flash" d="M11 10l3.4 5.4L11 21l6.6-2.4L21 24l1-6.6 6.4-2.2-6.4-2.2-1-6.6-3.4 4.6z" fill="#ffe9a3"/>
    <rect x="8" y="24" width="48" height="30" rx="6" fill="url(#sg-dark)"/>
    <rect x="8" y="24" width="48" height="6" rx="5" fill="#fff" fill-opacity=".14"/>
    <path d="M23 24l3.4-5.4h11.2L41 24z" fill="url(#sg-dark)"/>
    <circle cx="32" cy="39" r="11" fill="#39424f"/>
    <circle cx="32" cy="39" r="8" fill="url(#sg-blue)"/>
    <circle class="sc-pulse" cx="32" cy="39" r="4" fill="#0e1620"/>
    <circle cx="29" cy="36" r="2.2" fill="#fff" fill-opacity=".55"/>
    <circle cx="49" cy="30" r="2.4" fill="currentColor"/>`,

  bottle: `
    ${cast(32, 57, 15, 3.5)}
    <path d="M26 9h12v6l4.5 7v29a4.5 4.5 0 0 1-4.5 4.5H26A4.5 4.5 0 0 1 21.5 51V22l4.5-7z"
          fill="url(#sg-porc2)" fill-opacity=".55"/>
    <path d="M26 9h4v6l-4.5 7v29a4.5 4.5 0 0 0 1.5 3.4H26A4.5 4.5 0 0 1 21.5 51V22l4.5-7z"
          fill="#fff" fill-opacity=".45"/>
    <rect x="24.5" y="5" width="15" height="6" rx="2.4" fill="currentColor"/>
    <path class="sc-slosh" d="M21.5 33h21v18a4.5 4.5 0 0 1-4.5 4.5H26A4.5 4.5 0 0 1 21.5 51z"
          fill="url(#sg-blue)" fill-opacity=".8"/>
    <rect x="23.5" y="36" width="17" height="7" rx="2" fill="#fff" fill-opacity=".25"/>`,

  /* the fallback, and the one an iconless compliment already used */
  tick: `
    ${cast(32, 56, 18, 3.5)}
    <circle cx="32" cy="31" r="21" fill="url(#sg-green)"/>
    <circle cx="32" cy="31" r="21" fill="none" stroke="#fff" stroke-width="1.6" stroke-opacity=".35"/>
    <ellipse cx="25" cy="22" rx="7" ry="4.5" fill="#fff" fill-opacity=".25"
             transform="rotate(-35 25 22)"/>
    <path class="sc-draw" d="M21 32l8 8 15-16" fill="none" stroke="#fff"
          stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>`,
}

/** The drawings' own animations. Rendered once by the component. */
export const SCENE_CSS = `
.sc{display:block;width:100%;height:100%;overflow:visible}
.sc *{transform-box:fill-box}

/* steam — three wisps on staggered clocks, so it curls rather than pulses */
.sc-st{fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;opacity:0;
  transform-origin:50% 100%;animation:sc-steam 2.8s ease-out infinite}
.sc-st2{animation-delay:.6s}.sc-st3{animation-delay:1.25s}
@keyframes sc-steam{
  0%{opacity:0;transform:translateY(7px) scaleY(.5)}
  28%{opacity:.55}
  100%{opacity:0;transform:translateY(-9px) scaleY(1.2)}}

/* the tea bag bobs and waves on different periods, so it never looks mechanical */
.sc-dunk{transform-origin:50% 100%;animation:sc-dunk 2.7s ease-in-out infinite}
@keyframes sc-dunk{0%,100%{transform:translateY(0) rotate(-2deg)}
  50%{transform:translateY(3.5px) rotate(2deg)}}
.sc-arm{transform-origin:100% 100%;animation:sc-wave 1.5s ease-in-out infinite}
.sc-arm-r{transform-origin:0% 100%;animation-delay:.35s}
@keyframes sc-wave{0%,100%{transform:rotate(0)}50%{transform:rotate(-16deg)}}

.sc-bob{transform-origin:50% 100%;animation:sc-bob 3.4s ease-in-out infinite}
.sc-b2{animation-delay:.5s}.sc-b3{animation-delay:1s}
@keyframes sc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.8px)}}

.sc-lid{transform-origin:50% 100%;animation:sc-lid 2.9s cubic-bezier(.34,1.4,.6,1) infinite}
@keyframes sc-lid{0%,58%,100%{transform:translateY(0) rotate(0)}
  22%{transform:translateY(-8px) rotate(-5deg)}}
.sc-spark{transform-origin:50% 50%;animation:sc-spark 2.9s ease-in-out infinite}
.sc-s2{animation-delay:.7s}
@keyframes sc-spark{0%,55%,100%{opacity:0;transform:scale(.3)}
  25%{opacity:1;transform:scale(1)}}

.sc-shine{transform-origin:50% 50%;transform:rotate(18deg);
  animation:sc-shine 3.6s cubic-bezier(.4,0,.25,1) infinite}
@keyframes sc-shine{0%{transform:rotate(18deg) translateX(-18px);opacity:0}
  12%{opacity:.85}35%{transform:rotate(18deg) translateX(44px);opacity:0}
  100%{transform:rotate(18deg) translateX(44px);opacity:0}}

.sc-conf{animation:sc-conf 2.6s linear infinite}
.sc-c2{animation-delay:.85s}.sc-c3{animation-delay:1.6s}
@keyframes sc-conf{0%{opacity:0;transform:translateY(-6px) rotate(0)}
  18%{opacity:1}100%{opacity:0;transform:translateY(32px) rotate(220deg)}}

.sc-rock{transform-origin:50% 75%;animation:sc-rock 4s ease-in-out infinite}
@keyframes sc-rock{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}

.sc-spin{animation:sc-spin 1.9s linear infinite}
@keyframes sc-spin{to{transform:rotate(360deg)}}
.sc-road{animation:sc-road 1.1s linear infinite}
@keyframes sc-road{to{stroke-dashoffset:-15}}

.sc-z{opacity:0;transform-origin:50% 100%;animation:sc-z 3s ease-out infinite}
.sc-z2{animation-delay:1.1s}
@keyframes sc-z{0%{opacity:0;transform:translateY(4px) scale(.6)}
  30%{opacity:.9}100%{opacity:0;transform:translateY(-12px) scale(1.1)}}

.sc-wrench{animation:sc-wrench 2.4s cubic-bezier(.5,0,.4,1) infinite}
@keyframes sc-wrench{0%,100%{transform:rotate(0)}35%,55%{transform:rotate(-17deg)}}
.sc-turn{animation:sc-turn 2.4s cubic-bezier(.5,0,.4,1) infinite}
@keyframes sc-turn{0%,30%{transform:rotate(0)}55%,100%{transform:rotate(-60deg)}}

.sc-ring{transform-origin:50% 50%;opacity:0;animation:sc-ring 2.4s ease-out infinite}
@keyframes sc-ring{0%{opacity:.7;transform:scale(.72)}100%{opacity:0;transform:scale(1.25)}}
.sc-pulse{transform-origin:50% 50%;animation:sc-pulse 2.4s ease-in-out infinite}
@keyframes sc-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}

.sc-drop{opacity:0;animation:sc-drop 2.2s ease-in infinite}
@keyframes sc-drop{0%{opacity:0;transform:translateY(0)}
  15%{opacity:1}70%{opacity:1;transform:translateY(17px)}
  80%,100%{opacity:0;transform:translateY(19px) scaleY(.4)}}

.sc-flash{transform-origin:50% 50%;opacity:0;animation:sc-flash 3.2s ease-out infinite}
@keyframes sc-flash{0%,70%,100%{opacity:0;transform:scale(.5)}
  8%{opacity:1;transform:scale(1.15)}20%{opacity:0;transform:scale(.8)}}

.sc-slosh{transform-origin:50% 100%;animation:sc-slosh 3.6s ease-in-out infinite}
@keyframes sc-slosh{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}

.sc-draw{stroke-dasharray:34;animation:sc-draw 3s ease-in-out infinite}
@keyframes sc-draw{0%{stroke-dashoffset:34}
  35%,72%{stroke-dashoffset:0}100%{stroke-dashoffset:34}}

@media(prefers-reduced-motion:reduce){
  .sc *{animation:none!important}
  .sc-st,.sc-z,.sc-spark,.sc-conf,.sc-drop,.sc-flash,.sc-ring{opacity:.55}
  .sc-shine{opacity:0}
}`
