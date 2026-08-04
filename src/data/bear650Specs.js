/* ════════════════════════════════════════════════════════════════
   Royal Enfield Bear 650 — spec stops for the /mygarage scroll spin
   ════════════════════════════════════════════════════════════════

   The spin runs 37 → 01 as the page scrolls, so the views arrive in
   this order:

     37…31  right profile        (exhaust side)
     30…27  front three-quarter
     26…25  head on
     24…21  front three-quarter, other side
     20…18  left profile         (chain side)
     17…14  rear three-quarter
     13     tail on
     12…07  rear three-quarter, other side
     06…01  right profile again

   Each stop below is pinned to one frame in that list and only shows
   while the spin is near it, so a spec is on screen exactly when the
   part it describes is facing the camera.

   `pins` is the only part of a stop that gets drawn — a dot on the
   bodywork, a label, and the detail behind a hover or a tap. The
   `view` / `title` / `blurb` / `stats` fields are text-only: they feed
   the screen-reader copy of the specs further down the page.

   ── Coordinates ──────────────────────────────────────────────────
   `x` / `y` are fractions of the 800 × 501 product frame, read off
   the frame the stop is centred on. The frames are drawn into a box
   of that same aspect ratio, so the fractions land on the box
   directly. (0,0) is top-left.

   `dir` is where the label sits relative to the part — 'u'/'d' for
   up/down, 'l'/'r' for left/right — and `len` stretches the leader
   line when a label needs pushing further clear of the bodywork.
   ──────────────────────────────────────────────────────────────── */

export const FRAME_COUNT = 37
export const LOOPS = 1          // full 360° rotations across the scroll track

/* Leader length for `len: 1`, as a fraction of the box on both axes.
   Equal fractions on a 800 × 501 box draw the line at roughly 32°. */
const LEADER = 0.062

/* How long a stop stays up, in frames of spin either side of its own
   frame: HOLD is the fully-opaque plateau, FADE the ramp on each end.
   Kept just under the tightest gap between stops (4 frames) so at most
   two neighbours ever cross-fade, and only at the very edge. */
export const HOLD = 1.0
export const FADE = 1.15

export const SPEC_STOPS = [
  {
    id: 'stance',
    frame: 34,
    view: 'Side profile',
    title: 'Built for the Big Bear',
    blurb: 'Scrambler geometry under a flat bench seat — long, low-slung and made to be stood on.',
    stats: [['Wheelbase', '1,460 mm'], ['Kerb weight', '216 kg']],
    pins: [
      {
        label: 'Seat height', value: '830 mm', x: 0.275, y: 0.325, dir: 'ul',
        detail: 'Tall for a roadster, low for a scrambler. The bench is flat the whole way, so you can slide back under braking or get up on the pegs.',
      },
      {
        label: 'Ground clearance', value: '184 mm', x: 0.47, y: 0.715, dir: 'dl', len: 1.2,
        detail: 'Measured under the sump, with the exhaust tucked up out of the way — enough to clear a rut rather than find it.',
      },
    ],
  },
  {
    id: 'front-end',
    frame: 29,
    view: 'Front three-quarter',
    title: 'Big-piston front end',
    blurb: 'Showa inverted forks and a single big front rotor, with ABS you can switch off at the rear.',
    stats: [['Front travel', '130 mm'], ['ABS', 'Dual channel']],
    pins: [
      {
        label: 'Front forks', value: '43 mm Showa USD', x: 0.645, y: 0.44, dir: 'ur', len: 1.3,
        detail: 'Inverted big-piston forks — stiffer than a conventional pair of the same diameter, with 130 mm of travel for broken tarmac.',
      },
      {
        label: 'Front brake', value: '320 mm ByBre disc', x: 0.585, y: 0.705, dir: 'dr', len: 1.2,
        detail: 'One big rotor, twin-piston ByBre caliper. ABS runs on both wheels, and the rear channel switches off when you want it to.',
      },
    ],
  },
  {
    id: 'face',
    frame: 25,
    view: 'Head on',
    title: 'One round eye',
    blurb: 'A full-LED headlamp with the Tripper Dash sat right above it — turn-by-turn Google Maps on a round screen.',
    stats: [['Navigation', 'Google Maps'], ['Indicators', 'LED']],
    pins: [
      {
        label: 'Headlamp', value: 'Full LED', x: 0.495, y: 0.305, dir: 'ul', len: 1.4,
        detail: 'A single round unit running both low and high beam, in a chrome bezel that keeps the whole face period-correct.',
      },
      {
        label: 'Tripper Dash', value: '4in round TFT', x: 0.495, y: 0.19, dir: 'ur', len: 1.1,
        detail: 'A round colour screen that pairs to your phone and puts turn-by-turn Google Maps navigation where the speedo normally sits.',
      },
      {
        label: 'Front tyre', value: '100/90-19', x: 0.47, y: 0.72, dir: 'dl', len: 1.4,
        detail: 'A 19-inch front on a dual-purpose block pattern. The taller wheel rolls over what a smaller one would trip on.',
      },
    ],
  },
  {
    id: 'engine',
    frame: 20,
    view: 'Side profile',
    title: '648 cc parallel twin',
    blurb: 'Air- and oil-cooled SOHC twin on a 270° crank — the same long-legged thump, breathing through a new exhaust.',
    stats: [['Valvetrain', 'SOHC, 4v'], ['Crank', '270°']],
    pins: [
      {
        label: 'Peak power', value: '47 PS @ 7,150 rpm', x: 0.475, y: 0.485, dir: 'ur', len: 3.0,
        detail: 'The familiar 648 cc twin, air- and oil-cooled, tuned to pull from low down rather than chase a redline.',
      },
      {
        label: 'Peak torque', value: '56.5 Nm @ 5,150 rpm', x: 0.51, y: 0.645, dir: 'dl', len: 1.4,
        detail: 'Up on the Interceptor’s 52 Nm, and it lands lower in the rev range. The new two-into-one exhaust is where most of that came from.',
      },
      {
        label: 'Gearbox', value: '6-speed, slip-assist', x: 0.655, y: 0.645, dir: 'dr', len: 1.4,
        detail: 'Six speeds with a slip-and-assist clutch: a lighter lever at the bar, and no hop from the back wheel on a clumsy downshift.',
      },
    ],
  },
  {
    id: 'tail',
    frame: 13,
    view: 'Tail on',
    title: 'Twin shocks, preload adjustable',
    blurb: 'Piggyback Showa units either side of a 17-inch rear, wearing the fat end of a dual-purpose tyre pair.',
    stats: [['Rear travel', '115 mm'], ['Frame', 'Steel tubular']],
    pins: [
      {
        label: 'Rear shocks', value: 'Twin Showa, 115 mm', x: 0.455, y: 0.575, dir: 'dl', len: 1.4,
        detail: 'Piggyback reservoirs either side, adjustable for preload, so they can be firmed up for a pillion or a loaded rack.',
      },
      {
        label: 'Tail lamp', value: 'LED', x: 0.515, y: 0.36, dir: 'ur', len: 1.4,
        detail: 'An LED unit in a round housing, mounted high on the tail alongside the rack.',
      },
      {
        label: 'Rear tyre', value: '140/80-17', x: 0.515, y: 0.75, dir: 'dr', len: 1.4,
        detail: 'A 17-inch rear and the fat end of the pair, carrying the same dual-purpose block tread as the front.',
      },
    ],
  },
  {
    id: 'exhaust',
    frame: 6,
    view: 'Side profile',
    title: 'Two into one',
    blurb: 'Both header pipes feed a single silencer that signs off through a twin outlet — the Bear’s whole voice comes from here.',
    stats: [['Colour', 'Wild Honey'], ['Kerb weight', '216 kg']],
    pins: [
      {
        label: 'Exhaust', value: '2-into-1, dual outlet', x: 0.26, y: 0.645, dir: 'dr', len: 1.4,
        detail: 'Both header pipes merge into one silencer that signs off through a twin outlet. It is the main reason the Bear makes more torque than its siblings.',
      },
      {
        /* a long leader, to lift the label clear of the BEAR650 side badge */
        label: 'Rear brake', value: '270 mm disc', x: 0.185, y: 0.70, dir: 'ur', len: 2.5,
        detail: 'A single-piston caliper on a 270 mm rotor — and the ABS channel you can turn off when you want the back wheel to come round.',
      },
      {
        label: 'Fuel tank', value: '13.7 litres', x: 0.51, y: 0.325, dir: 'ur', len: 1.4,
        detail: 'A teardrop tank in Wild Honey with a chrome front panel, hand-painted pinstripe and the Royal Enfield script laid over it.',
      },
    ],
  },
]

/* Scroll progress (0…1 along the track) at which a given 1-based frame
   is on screen. Inverse of the page's frame picker, which counts the
   spin down from 37, so frame 37 sits at the very top of the track and
   frame 01 at the very bottom. */
const progressOfFrame = (frame) =>
  (FRAME_COUNT - frame + 0.5) / (FRAME_COUNT * LOOPS)

/* Frame aspect. A leader runs diagonally, but its two components are
   fractions of different axes, so the vertical one is converted into
   width units — that lets the line be drawn as a single rotated element
   whose length is a percentage of the box width, at an angle that never
   changes with the viewport. */
const ASPECT = 501 / 800

/* The detail popover is a fixed 224px against a 900px frame box, so it
   needs about a quarter of the width to itself. A label closer than that
   to an edge has its detail opened off the other side of the label
   instead, which is what keeps it inside the frame. */
const DETAIL_W = 0.25

function pinGeometry({ x, y, dir, len = 1 }) {
  const d = LEADER * len
  const dx = dir.includes('l') ? -d : d
  const dy = dir.includes('u') ? -d : d
  const dyw = dy * ASPECT
  const lx = x + dx
  const ly = y + dy
  /* a label to the left of its part meets the line with its right edge */
  const align = dx < 0 ? 'l' : 'r'

  return {
    lx,                                             // where the label attaches
    ly,
    lead: Math.hypot(dx, dyw),                      // fraction of the box width
    angle: (Math.atan2(dyw, dx) * 180) / Math.PI,   // degrees, clockwise
    align,
    /* which side its detail opens from, and which way it goes: down unless
       the label already sits low enough that a detail below it would hang
       off the bottom of the frame */
    dh: (align === 'l' && lx < DETAIL_W + 0.05) ? 'r'
      : (align === 'r' && lx > 1 - DETAIL_W - 0.05) ? 'l'
      : align,
    vdir: ly > 0.58 ? 'u' : 'd',
  }
}

/* Stops resolved to everything the renderer needs, computed once. */
export const SPEC_LAYOUT = SPEC_STOPS.map((stop, i) => ({
  ...stop,
  index: i,
  at: progressOfFrame(stop.frame),
  pins: stop.pins.map((pin) => ({ ...pin, ...pinGeometry(pin) })),
}))
