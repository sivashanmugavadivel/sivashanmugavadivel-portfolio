/**
 * Who ran a ride — the club's logo when there is one, its name otherwise.
 *
 * Four places show this (the ride hero on /mygarage/rides, the detail page's
 * stat strip and sidebar, and the vlog sidebar), which is why the rules live
 * here rather than four times over:
 *
 *   · THE LOGO IS OPTIONAL, and not as an afterthought. Most clubs hand out a
 *     poster and nothing else, so the mark is designed around the name and the
 *     logo is a bonus on top of it — never the other way round.
 *
 *   · A LOGO THAT FAILS TO LOAD HIDES ITSELF. A wrong path, a file not yet
 *     dropped into public/, a typo in an extension — all of them land on the
 *     same result as no logo at all, instead of the browser's broken-image
 *     glyph sitting next to a club's name. `onError` is the whole mechanism,
 *     and under `logoOnly` it is what keeps the mark from rendering nothing
 *     at all: a broken logo falls back to the name, not to a blank.
 *
 *   · "Self" IS NOT AN ORGANIZER. It is `build`'s default in ../../data/rides
 *     for the rides you put together yourself, which is most of them, so
 *     printing it would put the same word on nearly every screen. Callers do
 *     that check; this component renders whatever name it is handed.
 *
 * ── logoOnly ──────────────────────────────────────────────────────────────
 *   A wordmark already says the club's name, so setting it next to that name
 *   in text prints the same thing twice. `logoOnly` shows ONE of them: the
 *   logo if there is a usable one, the name if there isn't. The ride pages
 *   pass it; the vlog sidebar does not, because there the mark sits in a
 *   narrow column where a bare logo has no label beside it to explain what it
 *   is. Every caller that passes it prints its own "Organised by" heading.
 *
 *   The logo stops being decorative the moment it is alone — it is then the
 *   only thing carrying the club's name, so it takes `alt={name}` instead of
 *   the empty alt and aria-hidden it gets when the name is beside it. A
 *   `title` puts the name back on hover for sighted readers.
 */
import { useState } from 'react'

export default function OrganizerMark({
  name,
  logo,
  size = 20,
  gap = 8,
  style,
  logoStyle,
  logoOnly = false,
}) {
  const [broken, setBroken] = useState(false)
  if (!name) return null

  const hasLogo = !!logo && !broken
  /* Alone, the logo speaks for the club; beside the name it is decoration. */
  const soloLogo = hasLogo && logoOnly

  /* A BARE LOGO NEEDS MORE HEIGHT THAN ONE SITTING BESIDE TEXT.
     `size` is picked by callers to match the text on its line, which is the
     right height for a mark that has a name next to it and the wrong one for a
     mark that IS the name — at 22px the Royal Enfield wordmark reads as a smudge.
     Worse, these files are logos on a wide empty canvas (that one is 3840x2160,
     16:9, with the wordmark floating in the middle of it), so `height` buys far
     less ink than it looks like it should — most of the box it is given is
     transparent padding baked into the file. 2.4x is the correction; the width
     cap scales with it so a wide wordmark isn't clamped back down.

     CROP THE ASSET AND THIS COMES BACK DOWN. The multiplier is compensating for
     the padding, not for the design; a logo trimmed to its own bounding box
     would fill the box at something nearer 1x. */
  const h = soloLogo ? Math.round(size * 2.4) : size

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap, minWidth: 0, ...style }}
      title={soloLogo ? name : undefined}
    >
      {hasLogo && (
        <img
          src={logo}
          alt={soloLogo ? name : ''}
          aria-hidden={soloLogo ? undefined : 'true'}
          onError={() => setBroken(true)}
          style={{
            height: h,
            width: 'auto',
            /* Logos arrive at wildly different aspect ratios — a round club
               badge and a long wordmark both have to sit on this line without
               shoving the name off it. */
            maxWidth: h * 3.4,
            objectFit: 'contain',
            flexShrink: 0,
            display: 'block',
            ...logoStyle,
          }}
        />
      )}
      {!soloLogo && <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{name}</span>}
    </span>
  )
}
