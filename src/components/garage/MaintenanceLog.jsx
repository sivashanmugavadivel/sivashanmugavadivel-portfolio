/**
 * MaintenanceLog — the service & maintenance section on /mygarage.
 *
 * Two panes, side by side. The left is the picker: every logged service as a
 * selectable row carrying its cost summary. The right is the bill: a torn-off
 * receipt showing the complete details of whichever service is open — the
 * reference number, the odometer reading, every line item, the tax and the
 * amount.
 *
 * Layout follows the "Quote Flow" pattern (list on the left, live document on
 * the right, selection filled in the accent colour). The document itself is
 * the "Service Receipt Card" pattern instead of Quote Flow's own cream slip:
 * a near-black receipt with scalloped top and bottom edges, a centred
 * eyebrow + title, label/value rows and a ghost footer button.
 *
 * Closing the open service hands the receipt over to a lifetime summary — the
 * per-service totals, the overall spend and the cost per kilometre — so the
 * pane is useful in both states rather than sitting empty.
 *
 * Every figure comes from ../../data/maintenance, which totals each bill up
 * from its line items; nothing here does arithmetic of its own.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import ShowcaseCard from './ShowcaseCard'
import { CARD2, BD, BD2, OFF, D1, D2, D3, ACC, ACC2 } from './showcaseTokens'
import {
  services, serviceCount, maintenanceTitle, maintenanceNote, maintenanceOwner,
  maintenanceSummary, maintenanceStats, money, km, currency,
} from '../../data/maintenance'

/* The receipt sits well below the panel it's on, dark enough that the panel
   shows clearly between the scallops — otherwise the torn edges vanish and it
   reads as just another card. */
const RC = '#05040c'
const SCALLOP = 11        // px radius of the bumps along the top and bottom edges
const STACK_AT = 880      // px — below this the two panes stack

/** A free service is worth saying so, rather than showing ₹0. */
const costOf = s => (s.total > 0 ? money(s.total) : 'Free')

/** Line-item amounts carry no symbol — only the totals do. */
const plain = n => Math.round(n).toLocaleString('en-IN')

/** "10,000 km · Jan 2027", with whichever half is missing left out. */
const dueLabel = due =>
  [due?.km > 0 ? km(due.km) : null, due?.date || null].filter(Boolean).join(' · ')

export default function MaintenanceLog({ title = maintenanceTitle }) {
  /* Nothing open on arrival. The section leads with the lifetime summary
     — total spent, services, average, cost per kilometre — and a bill is
     opened only by asking for one. Opening the newest by default put a
     single service's full receipt in front of a reader who had not asked
     to see it, and made the log look like it held one record. */
  const [openId, setOpenId] = useState(null)
  const receiptRef = useRef(null)
  /* Only a pick scrolls the receipt up; nothing should move on mount. */
  const picked = useRef(false)
  const reduce = useReducedMotion()

  const open = services.find(s => s.id === openId) ?? null

  /* Stacked on a phone the receipt is below the fold of the list, so a pick
     has no visible effect until it's brought up. Side by side it's already in
     view and moving the page would be an unasked-for jump. */
  useEffect(() => {
    if (!picked.current || !openId) return
    if (window.matchMedia(`(min-width: ${STACK_AT + 1}px)`).matches) return
    receiptRef.current?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'nearest',
    })
  }, [openId, reduce])

  if (!serviceCount) {
    return (
      <ShowcaseCard>
        {title && (
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: OFF, margin: 0 }}>{title}</h3>
          </div>
        )}
        <div style={{
          border: `1px dashed ${BD2}`, borderRadius: 12, background: CARD2,
          padding: 'clamp(30px,6vw,48px) 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <div style={{ fontSize: '1.9rem', lineHeight: 1 }}>🔧</div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACC2, fontWeight: 700 }}>
            Nothing Logged Yet
          </div>
          <div style={{ fontSize: '0.8rem', color: D2, maxWidth: 420, lineHeight: 1.6 }}>
            Service bills land here as the bike goes in for them.
          </div>
        </div>
      </ShowcaseCard>
    )
  }

  /* Remounts on every pick, so the new receipt animates itself in. Keyed on
     the open id — 'all' is the summary state. */
  const rise = {
    key: openId ?? 'all',
    initial: reduce ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  }

  return (
    <ShowcaseCard>
      {title && (
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", color: OFF, margin: 0 }}>{title}</h3>
          {maintenanceNote && (
            <div style={{ fontSize: '0.74rem', color: D2, marginTop: 6, lineHeight: 1.6 }}>{maintenanceNote}</div>
          )}
        </div>
      )}

      {/* ── lifetime cost summary, above both panes ── */}
      <div className="mlog-stats">
        {maintenanceStats.map(([label, value]) => (
          <div key={label} className="mlog-stat">
            <div className="mlog-stat-v">{value}</div>
            <div className="mlog-stat-l">{label}</div>
          </div>
        ))}
      </div>

      <div className="mlog-grid">
        {/* ─────────── left: the picker ─────────── */}
        <div>
          <div className="mlog-eyebrow mlog-list-head">
            <span>Service Log</span>
            <span className="mlog-count">{serviceCount} records</span>
          </div>

          <div className="mlog-list">
            {services.map(s => {
              const isOpen = s.id === openId
              return (
                <button
                  key={s.id}
                  type="button"
                  className="mlog-row"
                  data-open={isOpen ? '' : undefined}
                  aria-expanded={isOpen}
                  onClick={() => { picked.current = true; setOpenId(isOpen ? null : s.id) }}
                >
                  <span className="mlog-row-main">
                    <span className="mlog-row-name">{s.name}</span>
                    {s.summary && <span className="mlog-row-sub">{s.summary}</span>}
                    <span className="mlog-row-meta">
                      {[s.date, km(s.odometer), s.type].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="mlog-row-right">
                    <span className="mlog-row-cost">{costOf(s)}</span>
                    <span className="mlog-more">
                      {isOpen ? 'Hide' : 'More'}
                      <span className="mlog-more-i" aria-hidden>{isOpen ? '×' : '+'}</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ─────────── right: the receipt ─────────── */}
        <div className="mlog-receipt-col" ref={receiptRef}>
          <div className="mlog-receipt">
            <div className="mlog-edge mlog-edge-t" aria-hidden />
            <motion.div className="mlog-body" {...rise}>
              {open
                ? <ServiceReceipt s={open} onAll={() => setOpenId(null)} />
                : <SummaryReceipt onLatest={() => { picked.current = true; setOpenId(services[0].id) }} />}
            </motion.div>
            <div className="mlog-edge mlog-edge-b" aria-hidden />
          </div>
        </div>
      </div>

      <style>{`
        /* ════ lifetime summary strip ════ */
        .mlog-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }
        .mlog-stat {
          background: ${CARD2};
          border: 1px solid ${BD};
          border-radius: 10px;
          padding: 12px 14px;
          text-align: center;
        }
        .mlog-stat-v { font-size: 1.02rem; font-weight: 800; color: ${OFF}; line-height: 1.2; }
        .mlog-stat-l {
          margin-top: 4px;
          font-family: var(--mono);
          font-size: 0.53rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${D3};
        }

        /* ════ the two panes ════
           The receipt is the fixed-width pane and the list takes the rest, so
           the slip keeps its proportions however wide the page is. */
        .mlog-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 320px);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: ${STACK_AT}px) {
          .mlog-grid { grid-template-columns: minmax(0, 1fr); }
          .mlog-receipt-col { justify-self: center; width: 100%; max-width: 340px; }
        }

        .mlog-eyebrow {
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${D3};
        }
        .mlog-list-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 10px;
        }
        .mlog-count { color: ${D3}; letter-spacing: 0.1em; }

        /* ════ picker rows ════ */
        .mlog-list { display: flex; flex-direction: column; gap: 8px; }
        .mlog-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          width: 100%;
          padding: 13px 14px;
          border: 1px solid ${BD};
          border-radius: 12px;
          background: ${CARD2};
          font-family: var(--sans);
          text-align: left;
          cursor: pointer;
          transition: background .22s ease, border-color .22s ease, transform .22s ease;
        }
        .mlog-row:hover { border-color: ${BD2}; transform: translateY(-1px); }
        .mlog-row:focus-visible { outline: 2px solid ${ACC2}; outline-offset: 2px; }
        .mlog-row[data-open] {
          background: ${ACC};
          border-color: ${ACC};
          transform: none;
        }

        .mlog-row-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .mlog-row-name { font-size: 0.84rem; font-weight: 700; color: ${OFF}; line-height: 1.3; }
        .mlog-row-sub { font-size: 0.72rem; color: ${D1}; line-height: 1.45; }
        .mlog-row-meta {
          margin-top: 2px;
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.06em;
          color: ${D3};
        }
        .mlog-row[data-open] .mlog-row-name { color: #fff; }
        .mlog-row[data-open] .mlog-row-sub { color: rgba(255,255,255,0.82); }
        .mlog-row[data-open] .mlog-row-meta { color: rgba(255,255,255,0.62); }

        .mlog-row-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: none;
        }
        .mlog-row-cost { font-size: 0.92rem; font-weight: 800; color: ${OFF}; white-space: nowrap; }
        .mlog-row[data-open] .mlog-row-cost { color: #fff; }

        /* the affordance the whole row is really about */
        .mlog-more {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 6px 5px 11px;
          border: 1px solid ${BD2};
          border-radius: 999px;
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${D1};
          white-space: nowrap;
          transition: color .22s ease, border-color .22s ease;
        }
        .mlog-row:hover .mlog-more { color: ${OFF}; border-color: ${ACC2}; }
        .mlog-more-i {
          display: grid;
          place-items: center;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          font-size: 0.72rem;
          line-height: 1;
        }
        .mlog-row[data-open] .mlog-more {
          color: #fff;
          border-color: rgba(255,255,255,0.45);
        }
        .mlog-row[data-open] .mlog-more-i { background: #fff; color: ${ACC}; font-weight: 700; }

        /* ════ the receipt ════
           Sticks alongside the list on a wide screen, so scrolling a long log
           keeps the bill in view. */
        .mlog-receipt-col { position: sticky; top: 96px; }
        @media (max-width: ${STACK_AT}px) {
          .mlog-receipt-col { position: static; }
        }
        .mlog-receipt { filter: drop-shadow(0 14px 30px rgba(0,0,0,0.42)); }

        /* Scalloped edges: one strip above the body and one below, each a row
           of half-discs in the receipt's own colour. Painted as a repeating
           background rather than masked, so no compositing support is needed. */
        .mlog-edge { height: ${SCALLOP}px; background-repeat: repeat-x; }
        .mlog-edge-t {
          background-image: radial-gradient(circle ${SCALLOP}px at ${SCALLOP}px ${SCALLOP}px, ${RC} 97%, transparent 100%);
          background-size: ${SCALLOP * 2}px ${SCALLOP}px;
        }
        .mlog-edge-b {
          background-image: radial-gradient(circle ${SCALLOP}px at ${SCALLOP}px 0, ${RC} 97%, transparent 100%);
          background-size: ${SCALLOP * 2}px ${SCALLOP}px;
        }

        .mlog-body {
          background: ${RC};
          padding: 6px 20px 18px;
        }

        /* ── receipt head ── */
        .mlog-rc-owner {
          text-align: center;
          font-family: var(--mono);
          font-size: 0.53rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${D3};
        }
        .mlog-rc-title {
          margin: 5px 0 0;
          text-align: center;
          font-size: 1.06rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.25;
        }
        .mlog-rule {
          width: 62%;
          height: 1px;
          margin: 14px auto;
          background: rgba(255,255,255,0.16);
        }

        /* ── label / value rows ── */
        .mlog-kv {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding: 4px 0;
          font-size: 0.74rem;
        }
        .mlog-kv-k { color: ${D2}; }
        .mlog-kv-v { color: #fff; font-weight: 600; text-align: right; }
        .mlog-kv-v[data-mono] { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.04em; }

        /* A perforation, not a border — the gaps are the point. */
        .mlog-dash {
          height: 1px;
          margin: 13px 0;
          background-image: repeating-linear-gradient(90deg,
            rgba(255,255,255,0.24) 0 5px, transparent 5px 11px);
        }
        .mlog-solid {
          height: 1px;
          margin: 12px 0;
          background: rgba(255,255,255,0.34);
        }

        /* ── line items ── */
        .mlog-items { display: flex; flex-direction: column; gap: 9px; margin-top: 10px; }
        .mlog-item {
          display: grid;
          grid-template-columns: 1.55em minmax(0, 1fr) auto;
          gap: 8px;
          align-items: baseline;
          font-size: 0.73rem;
        }
        .mlog-item-n { font-family: var(--mono); font-size: 0.6rem; color: ${D3}; }
        .mlog-item-l { color: ${D1}; line-height: 1.4; }
        .mlog-item-q {
          display: block;
          margin-top: 2px;
          font-family: var(--mono);
          font-size: 0.57rem;
          letter-spacing: 0.06em;
          color: ${D3};
        }
        .mlog-item-a {
          font-family: var(--mono);
          font-size: 0.72rem;
          color: #fff;
          white-space: nowrap;
        }
        .mlog-item-a[data-free] {
          font-size: 0.57rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${D3};
        }

        /* ── the amount ── */
        .mlog-total {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        .mlog-total-k { font-size: 0.82rem; color: ${OFF}; }
        .mlog-total-v { font-size: 1.34rem; font-weight: 800; color: #fff; line-height: 1.1; }

        .mlog-due {
          margin-top: 12px;
          text-align: center;
          font-family: var(--mono);
          font-size: 0.56rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${ACC2};
        }

        /* ── ghost footer button ── */
        .mlog-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          margin-top: 15px;
          padding: 12px 14px;
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 8px;
          background: transparent;
          font-family: var(--sans);
          font-size: 0.76rem;
          color: ${D1};
          cursor: pointer;
          transition: color .22s ease, border-color .22s ease, background .22s ease;
        }
        .mlog-cta:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.05);
        }
        .mlog-cta:focus-visible { outline: 2px solid ${ACC2}; outline-offset: 2px; }
        .mlog-cta-i { font-family: var(--mono); opacity: 0.6; }

        .mlog-note {
          margin: 13px 0 0;
          text-align: center;
          font-size: 0.66rem;
          line-height: 1.55;
          color: ${D2};
        }

        @media (prefers-reduced-motion: reduce) {
          .mlog-row, .mlog-more, .mlog-cta { transition: none; }
          .mlog-row:hover { transform: none; }
        }
      `}</style>
    </ShowcaseCard>
  )
}

/* ── one service, in full ────────────────────────────────────────────────── */
function ServiceReceipt({ s, onAll }) {
  const due = dueLabel(s.nextDue)
  const rows = [
    ['Reference No.', s.invoice, true],
    ['Date', s.date],
    ['Odometer', km(s.odometer), true],
    ['Service Type', s.type],
    ['Workshop', s.workshop],
  ].filter(([, v]) => v)

  return (
    <>
      <div className="mlog-rc-owner">{maintenanceOwner}</div>
      <h4 className="mlog-rc-title">Service Receipt</h4>
      <div className="mlog-rule" />

      {rows.map(([k, v, mono]) => (
        <div key={k} className="mlog-kv">
          <span className="mlog-kv-k">{k}</span>
          <span className="mlog-kv-v" data-mono={mono ? '' : undefined}>{v}</span>
        </div>
      ))}

      {s.items.length > 0 && (
        <>
          <div className="mlog-dash" />
          <div className="mlog-eyebrow">Items &amp; Labour</div>
          <div className="mlog-items">
            {s.items.map((it, i) => (
              <div key={i} className="mlog-item">
                <span className="mlog-item-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="mlog-item-l">
                  {it.label}
                  {it.qty && <span className="mlog-item-q">{it.qty}</span>}
                </span>
                <span className="mlog-item-a" data-free={it.amount > 0 ? undefined : ''}>
                  {it.amount > 0 ? plain(it.amount) : 'Included'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mlog-dash" />
      <div className="mlog-kv">
        <span className="mlog-kv-k">Subtotal</span>
        <span className="mlog-kv-v" data-mono>{money(s.subtotal)}</span>
      </div>
      {s.discount > 0 && (
        <div className="mlog-kv">
          <span className="mlog-kv-k">Discount / Warranty</span>
          <span className="mlog-kv-v" data-mono>−{money(s.discount)}</span>
        </div>
      )}
      {s.tax > 0 && (
        <div className="mlog-kv">
          <span className="mlog-kv-k">GST ({s.taxRate}%)</span>
          <span className="mlog-kv-v" data-mono>{money(s.tax)}</span>
        </div>
      )}

      <div className="mlog-solid" />
      <div className="mlog-total">
        <span className="mlog-total-k">Amount</span>
        <span className="mlog-total-v">{costOf(s)}</span>
      </div>

      {due && <div className="mlog-due">Next due · {due}</div>}

      <button type="button" className="mlog-cta" onClick={onAll}>
        <span className="mlog-cta-i" aria-hidden>»</span>
        All Services · {money(maintenanceSummary.spent)}
      </button>

      {s.notes && <p className="mlog-note">{s.notes}</p>}
    </>
  )
}

/* ── every service at once ───────────────────────────────────────────────── */
function SummaryReceipt({ onLatest }) {
  const sum = maintenanceSummary
  const rows = [
    ['Services Logged', String(sum.count), true],
    ['First Service', sum.firstDate],
    ['Latest Service', sum.latestDate],
    ['Odometer', km(sum.latestKm), true],
  ].filter(([, v]) => v)

  return (
    <>
      <div className="mlog-rc-owner">{maintenanceOwner}</div>
      <h4 className="mlog-rc-title">Maintenance Summary</h4>
      <div className="mlog-rule" />

      {rows.map(([k, v, mono]) => (
        <div key={k} className="mlog-kv">
          <span className="mlog-kv-k">{k}</span>
          <span className="mlog-kv-v" data-mono={mono ? '' : undefined}>{v}</span>
        </div>
      ))}

      <div className="mlog-dash" />
      <div className="mlog-eyebrow">Per Service</div>
      <div className="mlog-items">
        {services.map((s, i) => (
          <div key={s.id} className="mlog-item">
            <span className="mlog-item-n">{String(i + 1).padStart(2, '0')}</span>
            <span className="mlog-item-l">
              {s.name}
              <span className="mlog-item-q">{s.date}</span>
            </span>
            <span className="mlog-item-a" data-free={s.total > 0 ? undefined : ''}>
              {s.total > 0 ? plain(s.total) : 'Free'}
            </span>
          </div>
        ))}
      </div>

      <div className="mlog-solid" />
      <div className="mlog-total">
        <span className="mlog-total-k">Total Spent</span>
        <span className="mlog-total-v">{money(sum.spent)}</span>
      </div>
      {sum.costPerKm != null && (
        <div className="mlog-kv" style={{ marginTop: 6 }}>
          <span className="mlog-kv-k">Cost / KM</span>
          <span className="mlog-kv-v" data-mono>{currency}{sum.costPerKm.toFixed(2)}</span>
        </div>
      )}

      {dueLabel(sum.nextDue) && <div className="mlog-due">Next due · {dueLabel(sum.nextDue)}</div>}

      <button type="button" className="mlog-cta" onClick={onLatest}>
        <span className="mlog-cta-i" aria-hidden>»</span>
        Latest Service · {services[0].date}
      </button>
    </>
  )
}
