/* ══════════════════════════════════════════════════════════════════════
   MILEAGE — shared data for every mileage-design-*.html in this folder.
   One file, so all six designs are judged on the same number.

   ONE reading. Not a fuel log, not a history — the mileage the Bear
   currently returns, plus the handful of figures that fall out of it
   (range on a tank, cost per kilometre, what a full tank costs). Those
   are derived below, never typed twice: change `READING` and every
   design re-reads it with no other edit.
   ══════════════════════════════════════════════════════════════════════ */

const MILEAGE_BIKE = {
  name: 'Royal Enfield Bear 650',
  tank: 13.7,            // litres, usable
  currency: '₹',
  claimed: 30.0,         // the maker's figure, km/l — the line to beat
  fuel: 'Petrol · 95 RON',
}

/* the reading. `rate` is what a litre cost when it was taken, which is
   the only reason the cost figures below can exist. */
const READING = {
  kmpl: 30.4,
  odo: 787,                    // odometer at the reading, km
  date: '22 Aug 2026',
  rate: 103.20,                // ₹ per litre
  method: 'Full tank to full tank, measured on the highway run to Pollachi.',
}

/* ── derive ─────────────────────────────────────────────────────────── */

const MILEAGE = {
  ...READING,
  /* how far one full tank goes at this figure */
  range: Math.round(READING.kmpl * MILEAGE_BIKE.tank),
  /* what a kilometre costs to cover */
  costPerKm: +(READING.rate / READING.kmpl).toFixed(2),
  /* what filling it costs */
  tankCost: Math.round(MILEAGE_BIKE.tank * READING.rate),
  /* against the brochure */
  vsClaimed: +((READING.kmpl / MILEAGE_BIKE.claimed - 1) * 100).toFixed(1),
  /* litres to cover 100 km — the way the rest of the world quotes it */
  per100: +(100 / READING.kmpl).toFixed(2),
}

/* the supporting figures, in the order they should be read.
   `tone` marks the one comparison worth colouring. */
const MILEAGE_FACTS = [
  { key: 'range',  label: 'Range on a tank', value: String(MILEAGE.range), unit: 'km',
    sub: `${MILEAGE_BIKE.tank} L filled to the brim` },
  { key: 'cost',   label: 'Cost per km', value: MILEAGE_BIKE.currency + MILEAGE.costPerKm.toFixed(2), unit: '',
    sub: `at ${MILEAGE_BIKE.currency}${MILEAGE.rate.toFixed(2)} a litre` },
  { key: 'fill',   label: 'A full tank', value: MILEAGE_BIKE.currency + MILEAGE.tankCost.toLocaleString('en-IN'), unit: '',
    sub: `${MILEAGE_BIKE.tank} L of ${MILEAGE_BIKE.fuel}` },
  { key: 'claim',  label: 'Against the claim', value: (MILEAGE.vsClaimed >= 0 ? '+' : '') + MILEAGE.vsClaimed, unit: '%',
    sub: `maker says ${MILEAGE_BIKE.claimed} km/l`,
    tone: MILEAGE.vsClaimed >= 0 ? 'up' : 'dn' },
  { key: 'odo',    label: 'Odometer', value: MILEAGE.odo.toLocaleString('en-IN'), unit: 'km',
    sub: `read on ${MILEAGE.date}` },
  { key: 'per100', label: 'Per 100 km', value: MILEAGE.per100.toFixed(2), unit: 'L',
    sub: 'the other way round' },
]

/* shared section copy, so every design says the same thing */
const MILEAGE_COPY = {
  kicker: 'Real-world figure',
  title: 'Mileage',
  note: 'What the Bear actually returns — measured full tank to full tank, '
      + 'not read off a brochure.',
  empty: 'No reading taken yet. One tank filled to the brim, ridden down, '
       + 'and filled again is all it takes.',
}

/* designs read `?empty=1` to preview the nothing-measured-yet state */
const MILEAGE_EMPTY = new URLSearchParams(location.search).has('empty')

/* Every design here has a sequence to it — a needle sweep, a fill, a
   die coming down. All of that is decoration; the reading is content.
   Where this is true, a design skips straight to its end state instead
   of playing out with the animation merely made instant. */
const MILEAGE_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── small shared formatters ────────────────────────────────────────── */
const fmtKm = (n) => n.toLocaleString('en-IN')
const fmtRs = (n) => MILEAGE_BIKE.currency + Math.round(n).toLocaleString('en-IN')
