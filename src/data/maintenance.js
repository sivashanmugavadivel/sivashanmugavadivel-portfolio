/**
 * Service & maintenance records, read straight out of `garage.config.json` →
 * `maintenance`.
 *
 * Same idea as ./accessories.js and ./garageGallery.js: the content lives in
 * config so a service can be logged without opening a component. Rendered by
 * the maintenance section on /mygarage (see
 * components/garage/MaintenanceLog.jsx).
 *
 * Not to be confused with `maintenance` in ./garage.js — that's the older
 * hard-coded due-list still used by the /garage prototypes.
 *
 * Config shape:
 *   {
 *     "title":    "Service & Maintenance",   // optional section heading
 *     "note":     "…",                       // optional line under the heading
 *     "currency": "₹",                       // optional; prefixes every amount
 *     "owner":    "Royal Enfield · Bear 650",// optional receipt eyebrow
 *     "services": [                          // newest first — the order shown
 *       {
 *         "id":       "svc-2026-07",         // optional; stable React key
 *         "name":     "Second Free Service",
 *         "summary":  "Oil, chain, brake check",   // the one-liner in the list
 *         "date":     "12 Jul 2026",
 *         "odometer": 4820,                  // km at the time of service
 *         "type":     "Scheduled",           // Scheduled · Running Repair · …
 *         "workshop": "Royal Enfield · Tiruppur",
 *         "invoice":  "RE0000485721",        // optional bill reference
 *         "items": [                         // the bill, pre-tax
 *           { "label": "Engine Oil 15W-50", "qty": "3.0 L", "amount": 1890 }
 *         ],
 *         "discount": 0,                     // optional, off the subtotal
 *         "taxRate":  18,                    // optional GST %, applied after
 *         "nextDue":  { "km": 10000, "date": "Jan 2027" },   // optional
 *         "notes":    "…"                    // optional footer line
 *       }
 *     ]
 *   }
 *
 * Nothing about a bill is typed twice: subtotal, tax and total are all worked
 * out from `items` here, so the cost shown against a service in the list and
 * the receipt beside it are the same number by construction. Log a service by
 * adding an entry with its line items and every figure follows.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The records shipped in config are SAMPLE DATA, the same way the gallery ships
 * placeholder photos. Replace them with the real bills as they come in.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import garageCfg from './garage.config.json'

const cfgMaint = garageCfg.maintenance ?? {}

const num = n => (Number.isFinite(+n) ? +n : 0)

export const maintenanceTitle = cfgMaint.title ?? 'Service & Maintenance'
export const maintenanceNote = cfgMaint.note ?? ''
export const maintenanceOwner = cfgMaint.owner ?? 'Royal Enfield · Bear 650'
export const currency = cfgMaint.currency ?? '₹'

/** `₹1,890` — Indian grouping, whole rupees, because service bills come that way. */
export const money = n => `${currency}${Math.round(num(n)).toLocaleString('en-IN')}`

/** `4,820 km`, or an em dash when the reading is missing. */
export const km = n => (num(n) > 0 ? `${Math.round(num(n)).toLocaleString('en-IN')} km` : '—')

/** One service with its bill totalled up from the line items. */
function priced(svc, i) {
  const items = (svc.items ?? [])
    .filter(Boolean)
    .map(it => ({ ...it, amount: num(it.amount) }))
  const subtotal = items.reduce((a, it) => a + it.amount, 0)
  const discount = Math.min(num(svc.discount), subtotal)
  const taxRate = num(svc.taxRate)
  const taxed = subtotal - discount
  const tax = Math.round((taxed * taxRate) / 100)
  return {
    ...svc,
    id: svc.id ?? `svc-${i + 1}`,
    items,
    subtotal,
    discount,
    taxRate,
    tax,
    total: taxed + tax,
  }
}

/** Every logged service, in config order (newest first). */
export const services = (cfgMaint.services ?? []).filter(s => s?.name).map(priced)

export const serviceCount = services.length

/**
 * Headline numbers for the section, derived from `services` so they can never
 * fall out of step with the list underneath them. `costPerKm` needs an odometer
 * reading to mean anything, so it's null until one is logged.
 */
export const maintenanceSummary = (() => {
  const spent = services.reduce((a, s) => a + s.total, 0)
  const readings = services.map(s => num(s.odometer)).filter(n => n > 0)
  const latestKm = readings.length ? Math.max(...readings) : 0
  return {
    spent,
    count: serviceCount,
    avg: serviceCount ? spent / serviceCount : 0,
    latestKm,
    costPerKm: latestKm > 0 ? spent / latestKm : null,
    /* config is newest first, so the oldest entry is the last one */
    firstDate: services[serviceCount - 1]?.date ?? null,
    latestDate: services[0]?.date ?? null,
    /* the next thing due, taken off the most recent service */
    nextDue: services[0]?.nextDue ?? null,
  }
})()

/** The four-up strip above the list. Only the stats that have a value. */
export const maintenanceStats = (() => {
  const s = maintenanceSummary
  return [
    ['Total Spent', money(s.spent)],
    ['Services', String(s.count)],
    ['Avg / Service', money(s.avg)],
    ...(s.costPerKm != null ? [['Cost / KM', `${currency}${s.costPerKm.toFixed(2)}`]] : []),
  ]
})()
