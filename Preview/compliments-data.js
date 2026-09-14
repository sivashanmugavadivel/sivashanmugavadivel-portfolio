/**
 * Sample rides for the Compliments poster designs.
 *
 * Every design in this folder reads this one file, the same way the vlog design
 * studies share vlog-data.js — so the six can be judged on their design rather
 * than on which of them got the flattering copy.
 *
 * WHAT A COMPLIMENT IS
 *   The perks an organised ride comes with — the inclusions list off the event
 *   poster. In the real data it lives on a ride as `compliments`, either a
 *   plain string or { icon, text }, and the detail page skips the whole panel
 *   when the list is empty, which is most rides. See src/data/rides.js.
 *
 * THE THREE FIXTURES
 *   `dhondenling` is REAL — it is r7-dhondenling-tibetan-settlement.json,
 *   verbatim. The other two are TEST CASES built to break a layout, and are
 *   labelled as such in the picker:
 *
 *     `plain` — no icons and no organiser. Every entry falls back to a tick,
 *               and the "included with" footer has nothing to show. A design
 *               that leans on emoji for colour falls apart here.
 *     `long`  — eight entries, two of them long enough to wrap. This is the
 *               one that finds designs which only work at five short lines.
 *
 * Each design takes ?ride=<id> and defaults to the first.
 */
window.COMPLIMENTS = (function () {
  const rides = [
    {
      id: 'dhondenling',
      label: 'Dhondenling · 4 perks, icons, club (real)',
      name: 'Dhondenling Tibetan Settlement',
      subtitle: 'One Day September Ride 2026 · More Than A Destination',
      date: '27 Sep 2026',
      organizer: "Biker's Club CBE",
      organizerLogo: null,
      color: '#eab308',
      registration: '₹349',
      compliments: [
        { icon: '☕', text: 'Breakfast combo with tea/coffee' },
        { icon: '🍽️', text: 'Evening tea/coffee + snacks' },
        { icon: '🎁', text: 'Badge · Stickers · Surprise gift' },
        { icon: '🏆', text: 'Lucky rider wins a special gift' },
      ],
    },
    {
      id: 'plain',
      label: 'Plain · 3 perks, no icons, self-organised',
      name: 'Nilgiris Weekend Run',
      subtitle: 'Two up, no schedule',
      date: '12 Oct 2026',
      organizer: 'Self',
      organizerLogo: null,
      color: '#38bdf8',
      registration: '',
      /* deliberately bare strings — this is the tick-fallback case */
      compliments: [
        'Fuel stop at Mettupalayam',
        'Packed lunch',
        'Room booked at Coonoor',
      ],
    },
    {
      id: 'long',
      label: 'Long · 7 perks, two of them wrap',
      name: 'Deccan Odyssey',
      subtitle: 'Three states, four days',
      date: '14 Nov 2026',
      organizer: 'Royal Enfield',
      organizerLogo: null,
      color: '#dc2626',
      registration: '₹4,999',
      compliments: [
        { icon: '🛏️', text: 'Three nights twin-sharing accommodation with breakfast included' },
        { icon: '☕', text: 'Breakfast combo' },
        { icon: '🍽️', text: 'Evening snacks' },
        { icon: '🔧', text: 'Mechanic and spares backup van running the full route both ways' },
        { icon: '⛑️', text: 'Medical support' },
        { icon: '🎁', text: 'Badge · Stickers' },
        { icon: '🏆', text: 'Lucky draw' },
      ],
    },
  ]

  /** { icon, text } out of either shape, with the tick fallback the real page uses. */
  const normalise = c =>
    typeof c === 'string' ? { icon: '', text: c } : { icon: c.icon || '', text: c.text || '' }

  const byId = id => {
    const r = rides.find(x => x.id === id) || rides[0]
    return { ...r, compliments: r.compliments.map(normalise) }
  }

  /** The ride named in the query string, else the first. */
  const current = () =>
    byId(new URLSearchParams(location.search).get('ride'))

  return { rides, byId, current }
})()
