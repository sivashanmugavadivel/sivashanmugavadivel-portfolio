/**
 * Mileage — the Bear's real-world figure, read straight out of
 * `garage.config.json` → "mileage".
 *
 * Nothing here is authored in this file. The reading, the tank, the rate
 * and the section's own words all live in the config so the figure can
 * be updated without opening a component, the same way a service is
 * logged (see maintenance.js) or a ride is added (rides.js).
 *
 * ONE reading, not a log. Everything else is DERIVED from it below and
 * never typed twice — range on a tank, cost per kilometre, what a fill
 * costs, how it compares to the maker's claim, litres per 100km. Change
 * `reading` in the config and all of them follow.
 *
 * Config shape:
 *
 *   "mileage": {
 *     "kicker":      "Real-world figure",     // above the heading
 *     "title":       "Mileage",
 *     "note":        "…",                     // line under the heading
 *     "currency":    "₹",
 *     "tank":        13.7,                    // litres, usable
 *     "claimed":     30.0,                    // the maker's figure, km/l
 *     "grade":       "poWer 95 / Speed 95 / XP95",   // the pump's buttons
 *     "gradeOnPump": "POWER 95",              // the one selected
 *     "reading": {
 *       "kmpl":   30.4,
 *       "odo":    787,                        // odometer when taken, km
 *       "date":   "22 Aug 2026",
 *       "rate":   103.20,                     // ₹ a litre, when taken
 *       "method": "…"                         // how it was measured
 *     }
 *   }
 *
 * NOTE: Preview/mileage-data.js carries the same numbers for the design
 * previews in /Preview. Those pages are opened straight off disk, so
 * they cannot import JSON and cannot share this. They are scratch
 * copies; /mygarage reads the config and is the one that counts.
 */
import garageCfg from './garage.config.json'

const cfg = garageCfg.mileage

/* Deliberately loud. A missing key here would otherwise render a
   confident "₹NaN" and "undefined km/l", and a mileage figure shown
   wrongly is worse than one that fails to show at all. */
if (!cfg || !cfg.reading) {
  throw new Error(
    'garage.config.json has no "mileage" section (or no "mileage.reading"). '
    + 'The figure is read from there and nowhere else.',
  )
}

export const MILEAGE_BIKE = {
  tank: cfg.tank,               // litres, usable
  currency: cfg.currency,
  claimed: cfg.claimed,         // the maker's figure — the line to beat
  grade: cfg.grade,             // the three the bike runs on
  gradeOnPump: cfg.gradeOnPump, // the one the dispenser is set to
}

/* `rate` is what a litre cost when the reading was taken, which is the
   only reason the money below can exist. */
const READING = cfg.reading

export const MILEAGE = {
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

/* the section's own words, so the heading is config too */
export const MILEAGE_COPY = {
  kicker: cfg.kicker,
  title: cfg.title,
  note: cfg.note,
}

export const fmtKm = (n) => n.toLocaleString('en-IN')
export const fmtRs = (n) => MILEAGE_BIKE.currency + Math.round(n).toLocaleString('en-IN')
