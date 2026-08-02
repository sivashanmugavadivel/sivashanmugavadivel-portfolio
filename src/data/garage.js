// ─── The Garage — all static data ───────────────────────────────────────────

export const bike = {
  name: 'Royal Enfield Shotgun 650',
  nickname: 'The Beast',
  tagline: 'Built for the road. Made for the stories.',
  purchaseDate: '15 May 2024',
  color: 'Graphite Black',
  location: 'Chennai, India',
  odometer: 12547,
  ownership: '1 Year 1 Month',
  totalInvestment: '₹3,42,000',
  image: 'garage/bike/shotgun-650.jpg',
  sideImage: 'garage/bike/shotgun-650-side.jpg',
  story: `Royal Enfield Shotgun 650 is more than just a machine for me. It's my partner for long rides, weekend escapes and creating unforgettable memories on the road. This bike represents freedom, passion and the journey of chasing dreams one ride at a time.`,
  quickMetrics: [
    { label: 'Longest Ride', value: '620 KM', icon: '🛣️' },
    { label: 'Best Mileage', value: '34 KM/L', icon: '⛽' },
    { label: 'Ride Count', value: '47', icon: '🏍️' },
    { label: 'Service Count', value: '3', icon: '🔧' },
  ],
  specs: {
    overview: [
      { label: 'Engine', value: '648cc', unit: '', icon: '⚙️' },
      { label: 'Power', value: '46.3 PS', unit: '@ 7250 rpm', icon: '💪' },
      { label: 'Torque', value: '52.3 Nm', unit: '@ 5650 rpm', icon: '🔩' },
      { label: 'Cooling', value: 'Oil Cooled', unit: '', icon: '🌡️' },
      { label: 'Transmission', value: '6 Speed', unit: 'Manual', icon: '⚡' },
      { label: 'Fuel Tank', value: '13.8 L', unit: '', icon: '⛽' },
      { label: 'Kerb Weight', value: '240 kg', unit: '', icon: '⚖️' },
      { label: 'Seat Height', value: '795 mm', unit: '', icon: '📏' },
    ],
    performance: [
      { label: 'Top Speed', value: '161 km/h', unit: '', icon: '🚀' },
      { label: 'Avg Mileage', value: '28 km/l', unit: '', icon: '⛽' },
      { label: '0–60 km/h', value: '5.8 sec', unit: '', icon: '⏱️' },
      { label: 'Max Power', value: '46.3 PS', unit: '@ 7250 rpm', icon: '💥' },
      { label: 'Max Torque', value: '52.3 Nm', unit: '@ 5650 rpm', icon: '🔩' },
      { label: 'Fuel Type', value: 'Petrol', unit: 'BS6', icon: '🔥' },
    ],
    dimensions: [
      { label: 'Length', value: '2177 mm', unit: '', icon: '↔️' },
      { label: 'Width', value: '840 mm', unit: '', icon: '↕️' },
      { label: 'Height', value: '1100 mm', unit: '', icon: '📐' },
      { label: 'Wheelbase', value: '1480 mm', unit: '', icon: '🔵' },
      { label: 'Ground Clearance', value: '170 mm', unit: '', icon: '🛞' },
      { label: 'Seat Height', value: '795 mm', unit: '', icon: '🪑' },
    ],
    technology: [
      { label: 'ABS', value: 'Dual Channel', unit: '', icon: '🛡️' },
      { label: 'Display', value: 'Tripper Pod', unit: '', icon: '📱' },
      { label: 'Bluetooth', value: 'Yes', unit: '', icon: '📶' },
      { label: 'Navigation', value: 'Turn-by-turn', unit: '', icon: '🗺️' },
      { label: 'USB Charging', value: 'Yes', unit: '', icon: '🔌' },
      { label: 'Switchable ABS', value: 'Yes', unit: '', icon: '⚙️' },
    ],
    comfort: [
      { label: 'Seat Type', value: 'Split Scrambler', unit: '', icon: '🪑' },
      { label: 'Handlebar', value: 'Wide Touring Bar', unit: '', icon: '🤝' },
      { label: 'Footpeg', value: 'Mid-set', unit: '', icon: '👣' },
      { label: 'Suspension Front', value: '43mm USD Forks', unit: '', icon: '🔧' },
      { label: 'Suspension Rear', value: 'Twin Coil-Over', unit: '', icon: '🔧' },
    ],
  },
  comparison: {
    factory: [
      { field: 'Handlebar', value: 'Stock Wide Bar' },
      { field: 'Mirrors', value: 'Stock Round Mirrors' },
      { field: 'Exhaust', value: 'Stock Exhaust' },
      { field: 'Footpegs', value: 'Stock Mid Pegs' },
      { field: 'Headlight', value: 'Stock LED' },
    ],
    current: [
      { field: 'Handlebar', value: 'Stock Wide Bar' },
      { field: 'Mirrors', value: 'Bar End Mirrors' },
      { field: 'Exhaust', value: 'Stock Exhaust' },
      { field: 'Footpegs', value: 'Stock Mid Pegs' },
      { field: 'Headlight', value: 'Stock LED + Aux Light' },
    ],
    future: [
      { field: 'Handlebar', value: 'Biltwell Tracker Bar' },
      { field: 'Mirrors', value: 'Bar End Mirrors' },
      { field: 'Exhaust', value: 'Custom Slip-On' },
      { field: 'Footpegs', value: 'Touring Pegs' },
      { field: 'Headlight', value: 'LED Halo Ring' },
    ],
  },
}

export const accessories = [
  {
    id: 'chigee-aio6',
    name: 'Chigee AIO-6',
    subtitle: 'Smart Rider Display',
    category: 'Navigation',
    installed: true,
    purchaseDate: 'Jul 2024',
    price: 18999,
    coupon: 'SIVA10',
    rating: 4.5,
    image: 'garage/accessories/chigee-aio6.jpg',
    reason: 'All-in-one navigation, music and phone connectivity on the go.',
    review: 'Completely transformed the riding experience. Navigation and music at a glance.',
    hotspotPosition: { x: 48, y: 28 },
  },
  {
    id: 'quad-lock',
    name: 'Quad Lock Phone Mount',
    subtitle: 'Motorcycle Mount Pro',
    category: 'Navigation',
    installed: true,
    purchaseDate: 'Jun 2024',
    price: 3499,
    coupon: 'SIVA5',
    rating: 4.8,
    image: 'garage/accessories/quad-lock.jpg',
    reason: 'Secure phone mounting for navigation and vlogging.',
    review: 'Rock solid. Never had a single vibration issue even on rough roads.',
    hotspotPosition: { x: 44, y: 30 },
  },
  {
    id: 'insta360-x4',
    name: 'Insta360 X4',
    subtitle: 'Action Camera 360°',
    category: 'Camera',
    installed: true,
    purchaseDate: 'Aug 2024',
    price: 37490,
    coupon: 'SIVA7',
    rating: 4.8,
    image: 'garage/accessories/insta360-x4.jpg',
    reason: 'Capture every ride from every angle without thinking about framing.',
    review: 'The reframe feature in editing is a game changer for vlogs.',
    hotspotPosition: { x: 55, y: 22 },
  },
  {
    id: 'tpms',
    name: 'Fobo TPMS',
    subtitle: 'Tyre Pressure Monitor',
    category: 'Safety',
    installed: true,
    purchaseDate: 'Sep 2024',
    price: 4500,
    coupon: 'SIVA3',
    rating: 4.3,
    image: 'garage/accessories/tpms.jpg',
    reason: 'Real-time tyre pressure monitoring for long ride safety.',
    review: 'Peace of mind on highway rides. Pairs well with Chigee display.',
    hotspotPosition: { x: 22, y: 72 },
  },
  {
    id: 'crash-guard',
    name: 'Legendury Crash Guard',
    subtitle: 'Frame Slider Protection',
    category: 'Protection',
    installed: true,
    purchaseDate: 'Jun 2024',
    price: 3200,
    coupon: 'SIVA5',
    rating: 4.6,
    image: 'garage/accessories/crash-guard.jpg',
    reason: 'Essential protection for the engine and frame.',
    review: 'Solid build. Saved the bike during a slow-speed parking drop.',
    hotspotPosition: { x: 32, y: 55 },
  },
  {
    id: 'saddle-stay',
    name: 'Himalayan Saddle Stay',
    subtitle: 'Luggage Carrier',
    category: 'Touring',
    installed: true,
    purchaseDate: 'Oct 2024',
    price: 2800,
    coupon: 'SIVA3',
    rating: 4.4,
    image: 'garage/accessories/saddle-stay.jpg',
    reason: 'Mount saddle bags for long touring rides.',
    review: 'Perfect fit for the Shotgun. Strong enough for a full day\'s luggage.',
    hotspotPosition: { x: 72, y: 48 },
  },
  {
    id: 'cardo-intercom',
    name: 'Cardo Packtalk Edge',
    subtitle: 'Helmet Intercom',
    category: 'Communication',
    installed: true,
    purchaseDate: 'Nov 2024',
    price: 36990,
    coupon: 'SIVA7',
    rating: 4.9,
    image: 'garage/accessories/cardo-intercom.jpg',
    reason: 'Stay connected with fellow riders on group rides.',
    review: 'Crystal clear audio even at 120 km/h. Mesh network is flawless.',
    hotspotPosition: { x: 60, y: 18 },
  },
  {
    id: 'flash-x',
    name: 'Flash-X Hazard Module',
    subtitle: 'Emergency Hazard Light',
    category: 'Safety',
    installed: true,
    purchaseDate: 'Jul 2024',
    price: 1200,
    coupon: 'SIVA3',
    rating: 4.2,
    image: 'garage/accessories/flash-x.jpg',
    reason: 'Add hazard light functionality that RE bikes lack.',
    review: 'Simple install. Works exactly as advertised. Must-have for safety.',
    hotspotPosition: { x: 78, y: 38 },
  },
]

export const recommendedAccessories = [
  {
    id: 'rec-chigee',
    accessoryId: 'chigee-aio6',
    name: 'Chigee AIO-6',
    subtitle: 'Smart Riding System',
    section: 'favorites',
    image: 'garage/accessories/chigee-aio6.jpg',
    description: 'All-in-one navigation, CarPlay, Android Auto, TPMS and Bluetooth.',
    features: ['CarPlay / Android Auto', 'IP67 Waterproof', 'TPMS Support'],
    rating: 4.9,
    reviews: 128,
    price: 35999,
    originalPrice: 39999,
    coupon: 'SIVA10',
    discount: '10% OFF',
    buyUrl: '#',
    badge: 'TOP PICK',
  },
  {
    id: 'rec-insta360',
    accessoryId: 'insta360-x4',
    name: 'Insta360 X4',
    subtitle: 'Action Camera',
    section: 'favorites',
    image: 'garage/accessories/insta360-x4.jpg',
    description: '8K 360° recording with FlowState stabilization. Best for vlogs.',
    features: ['4K 60fps Recording', '360° Capture', 'Best for Vlogs'],
    rating: 4.8,
    reviews: 96,
    price: 37490,
    originalPrice: 39999,
    coupon: 'SIVA5',
    discount: '5% OFF',
    buyUrl: '#',
    badge: 'BEST CAMERA',
  },
  {
    id: 'rec-cardo',
    accessoryId: 'cardo-intercom',
    name: 'Cardo Packtalk Edge',
    subtitle: 'Helmet Intercom',
    section: 'favorites',
    image: 'garage/accessories/cardo-intercom.jpg',
    description: 'Mesh communication system, 15-rider connectivity, JBL speakers.',
    features: ['Mesh Communication', 'Long Battery Life', 'Sound by JBL'],
    rating: 4.7,
    reviews: 64,
    price: 36990,
    originalPrice: 39900,
    coupon: 'SIVA7',
    discount: '7% OFF',
    buyUrl: '#',
    badge: 'MUST HAVE',
  },
  {
    id: 'rec-topbox',
    accessoryId: null,
    name: 'Givi B42 Top Box',
    subtitle: 'Monolock Case',
    section: 'premium',
    image: 'garage/accessories/givi-topbox.jpg',
    description: '42L top box with waterproof design and sturdy build.',
    features: ['42L Capacity', 'Strong & Durable Build', 'Water Resistant'],
    rating: 4.6,
    reviews: 43,
    price: 12499,
    originalPrice: 13150,
    coupon: 'SIVA3',
    discount: '5% OFF',
    buyUrl: '#',
    badge: 'TRUSTED',
  },
  {
    id: 'rec-quadlock',
    accessoryId: 'quad-lock',
    name: 'Quad Lock Pro',
    subtitle: 'Motorcycle Mount',
    section: 'favorites',
    image: 'garage/accessories/quad-lock.jpg',
    description: 'Vibration-damped motorcycle mount for secure phone mounting.',
    features: ['Vibration Damping', 'Universal Fit', 'Tool-Free Install'],
    rating: 4.8,
    reviews: 210,
    price: 3499,
    originalPrice: 4199,
    coupon: 'SIVA5',
    discount: '5% OFF',
    buyUrl: '#',
    badge: null,
  },
  {
    id: 'rec-tpms',
    accessoryId: 'tpms',
    name: 'Fobo TPMS',
    subtitle: 'Tyre Pressure Monitor',
    section: 'budget',
    image: 'garage/accessories/tpms.jpg',
    description: 'Real-time tyre pressure and temperature monitoring on your phone.',
    features: ['Real-time Alerts', 'Easy Install', 'Bluetooth Connect'],
    rating: 4.3,
    reviews: 88,
    price: 4500,
    originalPrice: 5500,
    coupon: 'SIVA3',
    discount: '10% OFF',
    buyUrl: '#',
    badge: null,
  },
  {
    id: 'rec-flashx',
    accessoryId: 'flash-x',
    name: 'Flash-X Hazard Module',
    subtitle: 'Hazard Light Plug-n-Play',
    section: 'budget',
    image: 'garage/accessories/flash-x.jpg',
    description: 'Add hazard lights to any Royal Enfield. Plug and play install.',
    features: ['Plug & Play', 'RE Compatible', 'Easy 5-min Install'],
    rating: 4.2,
    reviews: 312,
    price: 1200,
    originalPrice: 1500,
    coupon: 'SIVA3',
    discount: '10% OFF',
    buyUrl: '#',
    badge: null,
  },
  {
    id: 'rec-auxbeam',
    accessoryId: null,
    name: 'Auxbeam LED Lights',
    subtitle: 'Auxiliary Fog Lights',
    section: 'budget',
    image: 'garage/accessories/auxbeam-led.jpg',
    description: 'Bright LED auxiliary lights for better visibility on night rides.',
    features: ['2000 Lumen', 'IP68 Waterproof', 'Universal Mount'],
    rating: 4.1,
    reviews: 167,
    price: 2499,
    originalPrice: 3499,
    coupon: 'SIVA3',
    discount: '5% OFF',
    buyUrl: '#',
    badge: null,
  },
]

/**
 * Ride vlogs. Empty until the first one is actually filmed — anything that
 * renders these shows a "coming soon" state while the list is empty, so it
 * fills itself in the moment a real video lands here.
 *
 * Shape, for when the first one is added:
 *   { id: '<youtube-id>', title, subtitle, category, distance, duration, views, date }
 *
 * `category` is one of: Latest · Popular · Shorts · Ride Stories · Setup.
 */
export const vlogs = []

/**
 * Every ride, in the order they'll happen.
 *
 *   mode: 'completed' — actually ridden. The only rides that feed the odometer
 *                       totals in `rideSummary`, so `distance` and `states`
 *                       have to be truthful here.
 *   mode: 'upcoming'  — next up, with a date already set.
 *   mode: 'planned'   — decided on, no date yet.
 *   mode: 'dream'     — someday.
 *
 * A ride graduates upward as it happens: planned → upcoming (once it has a
 * date) → completed (fill in `time`, `rating` and `stats`). `RIDE_MODES`
 * below is the one place the labels and colours for each are defined.
 *
 * `distance` is the display string; the leading number is what gets summed,
 * so keep it as "<km> KM".
 */
export const routes = [
  {
    id: 'r1', name: 'Nathakadaiyur Temple Ride', subtitle: 'Dharapuram → Home → Nathakadaiyur',
    mode: 'upcoming', distance: '38 KM', time: null, date: '2 Aug 2026', rating: null,
    from: [77.5200, 10.7300], to: [77.5450, 10.9400],
    fromCity: 'Dharapuram', toCity: 'Nathakadaiyur',
    // OSRM: Dharapuram → Kangayam (home) → Nathakadaiyur, [lng,lat]
    osrm: { fromLng: 77.5200, fromLat: 10.7300, toLng: 77.5450, toLat: 10.9400 },
    states: ['Tamil Nadu'],
    description: 'Dharapuram back home to Kangayam, then out to the Nathakadaiyur temple.',
    story: `The first ride planned on the Bear 650 — Dharapuram back home to Kangayam, then out to the Bala Thandayuthapani temple at Nathakadaiyur. Short, familiar roads, but the first time the bike and these roads will meet.`,
    highlights: ['Bala Thandayuthapani Temple', 'Home Roads', 'First Ride'],
    mapCenter: [10.87, 77.54], mapZoom: 11,
    color: '#a78bfa',
    videoId: null,
    photos: [],
    stats: null,
    via: ['Kangayam (Home)'],
  },
  {
    id: 'r3', name: 'Kangayam to Coimbatore', subtitle: 'Hidden Routes & Raw Nature',
    mode: 'planned', distance: '70 KM', time: null, date: 'Planned', rating: null,
    from: [77.5606, 11.0057], to: [76.9558, 11.0168],
    fromCity: 'Kangayam', toCity: 'Coimbatore',
    osrm: { fromLng: 77.5606, fromLat: 11.0057, toLng: 76.9558, toLat: 11.0168 },
    states: ['Tamil Nadu'],
    description: 'Hidden backroads through rural Tamil Nadu.',
    story: `Planned. State highways instead of the NH, to see what rural Tamil Nadu looks like from a motorcycle — sugarcane fields, small temples, chai stops. The Coimbatore approach through the Nilgiris foothills should be the payoff.`,
    highlights: ['Rural Back Roads', 'Sugarcane Fields', 'Local Villages', 'Nilgiris Foothills'],
    mapCenter: [11.01, 77.25], mapZoom: 10,
    color: '#22c55e',
    videoId: null,
    photos: [],
    stats: null,
    via: ['Tiruppur', 'Avinashi'],
  },
  {
    id: 'r2', name: 'Kangayam to Chennai', subtitle: 'Home to the City',
    mode: 'planned', distance: '450 KM', time: null, date: 'Planned', rating: null,
    from: [77.5606, 11.0057], to: [80.2707, 13.0827],
    fromCity: 'Kangayam', toCity: 'Chennai',
    osrm: { fromLng: 77.5606, fromLat: 11.0057, toLng: 80.2707, toLat: 13.0827 },
    states: ['Tamil Nadu'],
    description: 'The long haul from home to Chennai.',
    story: `Not ridden yet. The full stretch from home to Chennai in one go — the longest planned so far.`,
    highlights: ['Longest Planned Ride', 'Salem Highway', 'One-day Attempt'],
    mapCenter: [12.0, 79.0], mapZoom: 8,
    color: '#f97316',
    videoId: null,
    photos: [],
    stats: null,
    via: ['Erode', 'Salem', 'Ulundurpet'],
  },
  {
    id: 'r4', name: 'Chennai to Pondicherry', subtitle: 'Scenic Roads & Good Vibes',
    mode: 'planned', distance: '150 KM', time: null, date: 'Planned', rating: null,
    from: [80.2707, 13.0827], to: [79.8083, 11.9416],
    fromCity: 'Chennai', toCity: 'Pondicherry',
    osrm: { fromLng: 80.2707, fromLat: 13.0827, toLng: 79.8083, toLat: 11.9416 },
    states: ['Tamil Nadu', 'Puducherry'],
    description: 'East Coast Road — one of the most scenic routes in South India.',
    story: `Planned. ECR the whole way down: the Bay of Bengal on the right, a stop at Mahabalipuram, and into the French Quarter at the other end.`,
    highlights: ['East Coast Road', 'Bay of Bengal Views', 'Mahabalipuram', 'French Quarter'],
    mapCenter: [12.5, 80.0], mapZoom: 9,
    color: '#38bdf8',
    videoId: null,
    photos: [],
    stats: null,
    via: ['ECR', 'Mahabalipuram', 'Kalpakkam'],
  },
  {
    id: 'r8', name: 'Bharat Parikrama', subtitle: 'The Ultimate India Loop',
    mode: 'dream', distance: '18000+ KM', time: '60 Days', date: 'Future', rating: null,
    from: [80.27, 13.08], to: [80.27, 13.08],
    fromCity: 'Chennai', toCity: 'Chennai',
    osrm: null,
    description: 'A complete loop around the perimeter of India — the ultimate journey.',
    story: `A clockwise loop around the entire border of India. Starting and ending in Chennai. Every coastal road, every border district, every type of terrain India has to offer. The dream of dreams.`,
    highlights: ['All States', 'Both Coasts', 'Himalayas', 'Deserts'],
    mapCenter: [20.0, 78.0], mapZoom: 5,
    color: '#e8630a',
    videoId: null,
    photos: [],
    stats: null,
    via: ['Everywhere'],
  },
]

/**
 * The three ride tiers, in the order they should ever be listed, plus how each
 * one presents itself. Anything that groups, labels or colour-codes rides
 * reads from here rather than hard-coding a mode string — `dream` is
 * deliberately absent, it's shown on its own elsewhere.
 */
export const RIDE_MODES = [
  { key: 'completed', label: 'Completed', plural: 'Completed Rides', color: '#22c55e' },
  { key: 'upcoming',  label: 'Upcoming',  plural: 'Upcoming Rides',  color: '#f59e0b' },
  { key: 'planned',   label: 'Planned',   plural: 'Planned Rides',   color: '#8b5cf6' },
]

/** Rides of one mode, e.g. ridesByMode('planned'). */
export const ridesByMode = mode => routes.filter(r => r.mode === mode)

/** Completed first, then upcoming, then planned — the canonical display order. */
export const ridesInOrder = () => RIDE_MODES.flatMap(m => ridesByMode(m.key))

/**
 * Headline numbers for the "Rides & Routes" panel, derived from `routes` so
 * they can never drift from the list underneath them. Mark a ride
 * `mode: 'completed'` and every figure here updates on its own.
 *
 * Until the first ride is actually done there is nothing to total up, so the
 * panel counts what's lined up instead and relabels itself — an honest
 * "4 rides lined up" beats four zeroes. `counting` says which set is on show.
 */
export const rideSummary = (() => {
  const tally = list => {
    const km = list.map(r => parseFloat(r.distance) || 0)
    return {
      rides: list.length,
      km: km.reduce((a, b) => a + b, 0),
      longest: km.length ? Math.max(...km) : 0,
      states: new Set(list.flatMap(r => r.states || [])).size,
    }
  }
  const done = tally(ridesByMode('completed'))
  // Nothing ridden yet: upcoming and planned both count as "lined up"
  const ahead = tally([...ridesByMode('upcoming'), ...ridesByMode('planned')])
  const ridden = done.rides > 0
  const live = ridden ? done : ahead
  const fmt = n => Math.round(n).toLocaleString('en-IN')
  const dash = n => (n > 0 ? `${fmt(n)} km` : '—')
  return {
    ...live,
    counting: ridden ? 'completed' : 'ahead',
    stats: [
      [ridden ? 'Total Rides'     : 'Rides Lined Up',   String(live.rides)],
      [ridden ? 'Total Distance'  : 'Distance Ahead',   dash(live.km)],
      [ridden ? 'Longest Ride'    : 'Longest Planned',  dash(live.longest)],
      [ridden ? 'States Explored' : 'States Covered',   String(live.states)],
    ],
  }
})()

export const dreamGarage = {
  phases: [
    {
      id: 'phase1',
      label: 'Phase 1',
      title: 'Essentials',
      status: 'completed',
      items: ['Chigee AIO-6 Navigation', 'Quad Lock Mount', 'Crash Guard', 'Flash-X Hazard', 'TPMS Sensor'],
    },
    {
      id: 'phase2',
      label: 'Phase 2',
      title: 'Touring Setup',
      status: 'active',
      items: ['Saddle Bags', 'Top Box', 'Touring Handlebar', 'Auxbeam LED Lights', 'Heated Grips'],
    },
    {
      id: 'phase3',
      label: 'Phase 3',
      title: 'Comfort & Comm',
      status: 'planned',
      items: ['Cardo Intercom', 'Gel Seat Cushion', 'Engine Guard', 'Windshield Upgrade', 'Rear Rack'],
    },
    {
      id: 'phase4',
      label: 'Final Goal',
      title: 'Ultimate Touring Dream',
      status: 'future',
      items: ['Full Tank Bag Setup', 'Off-road Tyres', 'Custom Exhaust', 'Adventure Camera Rig', 'Satellite Communicator'],
    },
  ],
  dreamBikes: [
    { name: 'Royal Enfield Himalayan 450', price: '~₹2.5L', reason: 'Perfect adventure tourer for mountain rides and Ladakh.', image: 'garage/dream/himalayan-450.jpg' },
    { name: 'BMW R 1250 GS', price: '~₹20L', reason: 'The ultimate adventure touring machine for world travel.', image: 'garage/dream/bmw-gs.jpg' },
    { name: 'Royal Enfield Super Meteor 650', price: '~₹3.5L', reason: 'A cruiser upgrade from the Shotgun 650.', image: 'garage/dream/super-meteor.jpg' },
    { name: 'KTM 390 Adventure', price: '~₹3.2L', reason: 'Lightweight and nimble for off-road adventures.', image: 'garage/dream/ktm-390.jpg' },
  ],
}

/**
 * The real "dream garage" — every vehicle actually owned, in order, plus the
 * one that's next. `cc` drives the displacement bar (null = undecided), so
 * keep it numeric. Add the next chapter to the end when it happens.
 */
export const garageJourney = [
  {
    id: 'j1',
    chapter: '01',
    name: 'Hercules Bicycle',
    type: 'Bicycle',
    cc: 0,
    ccLabel: 'Pedal',
    icon: '🚲',
    note: 'The first vehicle that was mine. Every street in the neighbourhood, learnt on it.',
    status: 'owned',
  },
  {
    id: 'j2',
    chapter: '02',
    name: 'TVS XL Super 100',
    type: 'Moped',
    cc: 99.7,
    ccLabel: '99.7',
    icon: '⛽',
    note: 'First engine, first fuel bill. Carried school bags, groceries and half the family.',
    status: 'owned',
  },
  {
    id: 'j3',
    chapter: '03',
    name: 'Suzuki Avenis 125',
    type: 'Scooter',
    cc: 124,
    ccLabel: '124',
    icon: '🛵',
    note: 'The daily commuter. City traffic stopped being something to plan around.',
    status: 'owned',
  },
  {
    id: 'j4',
    chapter: '04',
    name: 'Royal Enfield Bear 650',
    type: 'Motorcycle',
    cc: 648,
    ccLabel: '648',
    icon: '🏍️',
    note: 'The one the highway was waiting for. Where the long rides actually began.',
    status: 'current',
  },
  {
    id: 'j5',
    chapter: '05',
    name: 'A Car',
    type: 'Yet to decide',
    cc: null,
    ccLabel: '?',
    icon: '🚗',
    note: 'Four wheels next. Model still undecided — the shortlist changes every month.',
    status: 'upcoming',
  },
]

export const wishlist = [
  { id: 'w1', name: 'Rynox Expedition Saddle Bags', category: 'Touring', price: 18500, priority: 'high', reason: 'Essential for multi-day tours. Keeps gear organized and dry.', targetMonth: '2026-07', status: 'planning' },
  { id: 'w2', name: 'Auxbeam LED Auxiliary Lights', category: 'Safety', price: 8999, priority: 'high', reason: 'Better night visibility on highways.', targetMonth: '2026-07', status: 'planning' },
  { id: 'w3', name: 'Oxford Heated Grips', category: 'Comfort', price: 4500, priority: 'medium', reason: 'Cold early morning rides to office.', targetMonth: '2026-08', status: 'planning' },
  { id: 'w4', name: 'Givi B42 Top Box + Plate', category: 'Touring', price: 14500, priority: 'high', reason: 'Secure locked storage for daily commute and tours.', targetMonth: '2026-09', status: 'planning' },
  { id: 'w5', name: 'Custom Gel Seat Pad', category: 'Comfort', price: 3200, priority: 'medium', reason: 'Reduce seat fatigue on long rides 500+ km.', targetMonth: '2026-08', status: 'planning' },
  { id: 'w6', name: 'Engine Guard (S&S Style)', category: 'Protection', price: 5500, priority: 'medium', reason: 'Extra protection for the engine cases.', targetMonth: '2026-09', status: 'planning' },
  { id: 'w7', name: 'Cardo Packtalk Edge Intercom', category: 'Communication', price: 36990, priority: 'low', reason: 'Group ride communication once the friend group grows.', targetMonth: '2026-10', status: 'planning' },
  { id: 'w8', name: 'Windshield (Puig Naked)', category: 'Comfort', price: 6500, priority: 'low', reason: 'Wind protection for highway touring.', targetMonth: '2026-11', status: 'planning' },
  { id: 'w9', name: 'BMW R 1250 GS (Dream Bike)', category: 'Future Bike', price: 2000000, priority: 'low', reason: 'The ultimate adventure touring machine.', targetMonth: '2028-01', status: 'dreaming' },
  { id: 'w10', name: 'Ladakh Ride Trip (Dream Trip)', category: 'Experience', price: 85000, priority: 'medium', reason: 'The most awaited ride of my life.', targetMonth: '2026-06', status: 'planning' },
]

export const rideStats = {
  summary: {
    totalRides: 47,
    totalDistance: 12547,
    rideHours: 342,
    avgMileage: 28.4,
    topSpeed: 142,
    avgSpeed: 67,
  },
  monthlyData: [
    { month: 'Jun', km: 320 },
    { month: 'Jul', km: 580 },
    { month: 'Aug', km: 740 },
    { month: 'Sep', km: 420 },
    { month: 'Oct', km: 890 },
    { month: 'Nov', km: 1100 },
    { month: 'Dec', km: 680 },
    { month: 'Jan', km: 950 },
    { month: 'Feb', km: 1240 },
    { month: 'Mar', km: 1580 },
    { month: 'Apr', km: 2100 },
    { month: 'May', km: 1947 },
  ],
  rideTypes: [
    { type: 'Highway', percent: 42, color: '#a78bfa' },
    { type: 'City', percent: 33, color: '#60a5fa' },
    { type: 'Long Ride', percent: 17, color: '#34d399' },
    { type: 'Off-road', percent: 8, color: '#fb923c' },
  ],
  topRoutes: [
    { name: 'Chennai to Pondicherry', distance: '210 km', time: '3h 45m', speed: '68 km/h', count: 3 },
    { name: 'Yelagiri Hills Loop', distance: '160 km', time: '2h 50m', speed: '57 km/h', count: 2 },
    { name: 'Coimbatore Ghat Roads', distance: '120 km', time: '2h 30m', speed: '48 km/h', count: 2 },
  ],
  recentRides: [
    { date: '31 May 2024', route: 'Chennai to Pondicherry', km: 210, time: '3h 45m', avgSpeed: '68 km/h', topSpeed: '128 km/h', mileage: '31.2 km/l', type: 'Highway' },
    { date: '29 May 2024', route: 'Yelagiri Hills Loop', km: 160, time: '2h 50m', avgSpeed: '57 km/h', topSpeed: '112 km/h', mileage: '29.1 km/l', type: 'City' },
    { date: '26 May 2024', route: 'Coimbatore Ghat Roads', km: 120, time: '2h 30m', avgSpeed: '48 km/h', topSpeed: '98 km/h', mileage: '27.8 km/l', type: 'Twisty' },
    { date: '20 May 2024', route: 'Marina Beach Loop', km: 45, time: '1h 10m', avgSpeed: '38 km/h', topSpeed: '72 km/h', mileage: '24.5 km/l', type: 'City' },
    { date: '15 May 2024', route: 'ECR Highway Run', km: 180, time: '2h 45m', avgSpeed: '65 km/h', topSpeed: '138 km/h', mileage: '30.8 km/l', type: 'Highway' },
  ],
}

export const costTracker = {
  summary: {
    totalCost: 312450,
    monthlyCost: 8200,
    costPerKm: 24.9,
  },
  categories: [
    { name: 'Bike Purchase', amount: 205000, icon: '🏍️', color: '#a78bfa' },
    { name: 'Accessories', amount: 54000, icon: '🔧', color: '#60a5fa' },
    { name: 'Service & Maintenance', amount: 12600, icon: '🛠️', color: '#34d399' },
    { name: 'Fuel', amount: 18400, icon: '⛽', color: '#fb923c' },
    { name: 'Insurance', amount: 8500, icon: '🛡️', color: '#f472b6' },
    { name: 'Trips & Rides', amount: 13950, icon: '🗺️', color: '#facc15' },
  ],
  recentExpenses: [
    { date: '10 May 2026', item: 'Petrol (Full Tank)', category: 'Fuel', amount: 1200 },
    { date: '05 May 2026', item: 'Second Service + Oil Change', category: 'Service', amount: 2800 },
    { date: '28 Apr 2026', item: 'Rynox Gloves', category: 'Accessories', amount: 1800 },
    { date: '15 Apr 2026', item: 'Yelagiri Ride Hotel + Food', category: 'Trips', amount: 3500 },
    { date: '02 Apr 2026', item: 'Annual Insurance Renewal', category: 'Insurance', amount: 8500 },
    { date: '20 Mar 2026', item: 'Chain Lubrication Kit', category: 'Service', amount: 450 },
    { date: '10 Mar 2026', item: 'Auxbeam LED Lights', category: 'Accessories', amount: 2499 },
  ],
}

export const maintenance = {
  upcoming: [
    { type: 'Insurance Renewal', dueDate: '2026-09-15', currentDate: '2026-06-02', priority: 'high', icon: '🛡️' },
    { type: 'Engine Oil Service', dueKm: 14000, currentKm: 12547, priority: 'medium', icon: '🛢️' },
    { type: 'Tyre Replacement (Rear)', dueKm: 15000, currentKm: 12547, priority: 'medium', icon: '🛞' },
    { type: 'Chain Lubrication', dueKm: 13000, currentKm: 12547, priority: 'low', icon: '⛓️' },
    { type: 'Brake Fluid Change', dueKm: 20000, currentKm: 12547, priority: 'low', icon: '🔴' },
  ],
  history: [
    { date: '05 May 2026', km: 12200, work: 'Second Service — Oil Change, Filter, Brake Check', cost: 2800, shop: 'Royal Enfield Service Centre, Chennai' },
    { date: '12 Feb 2026', km: 10500, work: 'Chain Lubrication & Tyre Pressure Check', cost: 450, shop: 'Local Workshop' },
    { date: '18 Nov 2025', km: 8900, work: 'First Service — Full Oil Change, All Fluids', cost: 2100, shop: 'Royal Enfield Service Centre, Chennai' },
    { date: '10 Sep 2025', km: 6500, work: 'Wheel Alignment & Balancing', cost: 600, shop: 'Local Workshop' },
    { date: '15 Jul 2024', km: 2000, work: 'PDI Service (Pre-Delivery Inspection)', cost: 0, shop: 'Royal Enfield Dealer' },
  ],
}

export const garageGallery = {
  sections: [
    {
      id: 'photos',
      label: 'Photos',
      images: [
        { src: 'garage/gallery/photo-1.jpg', location: 'Yelagiri Hills', date: 'May 2024', story: 'First sunrise ride up the ghat road.' },
        { src: 'garage/gallery/photo-2.jpg', location: 'East Coast Road, Chennai', date: 'Apr 2024', story: 'Golden hour along the coastline.' },
        { src: 'garage/gallery/photo-3.jpg', location: 'Rameswaram', date: 'Mar 2024', story: 'End of the longest ride so far.' },
        { src: 'garage/gallery/photo-4.jpg', location: 'Coimbatore Ghat', date: 'Apr 2024', story: 'Mid-ride break at the viewpoint.' },
        { src: 'garage/gallery/photo-5.jpg', location: 'Chennai Marina', date: 'Feb 2024', story: 'Evening city ride.' },
        { src: 'garage/gallery/photo-6.jpg', location: 'Pondicherry', date: 'Apr 2024', story: 'French Quarter streets.' },
      ],
    },
    {
      id: 'ride-moments',
      label: 'Ride Moments',
      images: [
        { src: 'garage/gallery/ride-1.jpg', location: 'ECR Highway', date: 'May 2024', story: 'Highway stretch with zero traffic.' },
        { src: 'garage/gallery/ride-2.jpg', location: 'Yelagiri Ghat', date: 'May 2024', story: 'The hairpin bends were pure joy.' },
        { src: 'garage/gallery/ride-3.jpg', location: 'Rameswaram Bridge', date: 'Mar 2024', story: 'Pamban Bridge crossing.' },
      ],
    },
    {
      id: 'setup-photos',
      label: 'Setup Photos',
      images: [
        { src: 'garage/gallery/setup-1.jpg', location: 'Home Garage', date: 'Aug 2024', story: 'Chigee AIO-6 installation day.' },
        { src: 'garage/gallery/setup-2.jpg', location: 'Home Garage', date: 'Oct 2024', story: 'Saddle stay mounted and ready.' },
        { src: 'garage/gallery/setup-3.jpg', location: 'Parking', date: 'Nov 2024', story: 'Full touring setup complete.' },
      ],
    },
    {
      id: 'behind-scenes',
      label: 'Behind Scenes',
      images: [
        { src: 'garage/gallery/bts-1.jpg', location: 'Roadside', date: 'Apr 2024', story: 'Setting up the Insta360 for the ride.' },
        { src: 'garage/gallery/bts-2.jpg', location: 'Pondicherry', date: 'Apr 2024', story: 'Post-ride thumbnail shoot.' },
      ],
    },
    {
      id: 'travel',
      label: 'Travel',
      images: [
        { src: 'garage/gallery/travel-1.jpg', location: 'Mahabalipuram', date: 'Feb 2024', story: 'Temple visit on the way back.' },
        { src: 'garage/gallery/travel-2.jpg', location: 'Rameswaram Temple', date: 'Mar 2024', story: 'Ramanathaswamy Temple visit.' },
        { src: 'garage/gallery/travel-3.jpg', location: 'Yelagiri', date: 'May 2024', story: 'Local market stop in Yelagiri.' },
      ],
    },
  ],
}

export const accessoryDetails = {
  'chigee-aio6': {
    id: 'chigee-aio6',
    name: 'Chigee AIO-6',
    subtitle: 'Smart Riding System',
    badge: 'TOP PICK',
    rating: 4.9,
    reviewCount: 128,
    price: 35999,
    originalPrice: 39999,
    coupon: 'SIVA10',
    discount: '10% OFF',
    buyUrl: '#',
    amazonUrl: '#',
    hero: { tagline: 'GEAR I TRUST. GEAR I USE.', image: 'garage/accessories/chigee-aio6.jpg' },
    gallery: [
      'garage/accessories/chigee-aio6.jpg',
      'garage/accessories/chigee-aio6-mount.jpg',
      'garage/accessories/chigee-aio6-screen.jpg',
      'garage/accessories/chigee-aio6-install.jpg',
    ],
    highlights: ['6" HD IPS Touch Display (1280×720)', 'Wireless Apple CarPlay & Android Auto', 'IP67 Waterproof & Sunlight Readable', 'TPMS Support (Optional)', 'Bluetooth 5.0 — Intercom & Headset Support', 'OTA Updates & Cloud Sync'],
    overview: `It has completely transformed the way I ride. Navigation, music, calls, and TPMS — everything I need right in front of me, without taking my eyes off the road. The bright display is perfect even under direct sunlight and the wireless connectivity works flawlessly. For long rides and vlogs, it's a game changer.`,
    features: [
      { title: '6-inch IPS Display', desc: 'Full HD sunlight-readable screen at 1000 nits brightness.' },
      { title: 'Wireless CarPlay & Android Auto', desc: 'Seamless wireless connection, no cables needed.' },
      { title: 'IP67 Waterproof', desc: 'Rain and splash proof — tested through multiple monsoon rides.' },
      { title: 'TPMS Integration', desc: 'Real-time tyre pressure monitoring on the main screen.' },
      { title: 'Bluetooth 5.0', desc: 'Connect to intercom and headsets simultaneously.' },
    ],
    installation: {
      time: '45 min',
      difficulty: 'Medium',
      steps: [
        'Mount the RAM ball on the handlebar.',
        'Connect the power cable to the battery or USB port.',
        'Clip the Chigee mount onto the RAM ball.',
        'Pair with phone via Bluetooth or WiFi.',
        'Set up CarPlay / Android Auto in settings.',
      ],
    },
    rideExperience: `After 8 months and 8000+ km with the Chigee AIO-6, it has become the most indispensable part of my setup. On the Chennai–Rameswaram ride, it guided me through unknown roads flawlessly. The brightness never failed even in noon sun. TPMS alerts saved me once from a potential blowout.`,
    pros: ['Bright, sunlight-readable display', 'Wireless CarPlay works flawlessly', 'TPMS integration is very useful', 'Waterproof — survived heavy monsoon rain', 'OTA updates keep improving the software'],
    cons: ['Mount can vibrate on rough roads (fix with RAM X-Grip addon)', 'App connectivity can sometimes drop on Android', 'Price is on the higher side'],
    compatibility: ['Royal Enfield Shotgun 650', 'Royal Enfield Interceptor 650', 'Royal Enfield Continental GT 650', 'Universal fit with RAM Mount system'],
    videoId: 'dQw4w9WgXcQ',
    faq: [
      { q: 'Does it work without a SIM card?', a: 'Yes, it works via your phone\'s hotspot or WiFi for navigation.' },
      { q: 'Is it compatible with any phone?', a: 'Works with iPhone (CarPlay) and Android phones (Android Auto).' },
      { q: 'Can it handle rain?', a: 'Yes, IP67 rated. I\'ve ridden through heavy rain with no issues.' },
      { q: 'How long does installation take?', a: 'About 45 minutes including wiring. Very straightforward.' },
    ],
    relatedIds: ['quad-lock', 'tpms', 'cardo-intercom'],
  },
}
