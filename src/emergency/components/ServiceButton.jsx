import { Phone, Siren } from 'lucide-react';
import { telHref } from '../utils';

// One emergency number in "Get help now", drawn as what it sends: an ambulance for 108, a
// police SUV for 100, a fire engine for 101, and an emergency beacon for 112. A service the
// page can't place (a helpline the owner added) keeps the plain tile.

const RED = '#c8102e';
const RED_DARK = '#9e0c24';
const LIGHT_RED = '#e0233f';
const LIGHT_BLUE = '#2f6fe0';
const AMBER = '#ffb000';
const OUTLINE = '#8c98a4';
const GLASS = '#a9d8f5';
const TYRE = '#1b2a38';
const HUB = '#c9d1d9';

/** Which picture a service gets: by its name first, then by the Indian number. */
function serviceKind({ label = '', number = '' }) {
  const l = label.toLowerCase();
  const n = String(number).replace(/\D/g, '');
  if (l.includes('ambul') || l.includes('medic') || n === '108' || n === '102') return 'ambulance';
  if (l.includes('police') || n === '100') return 'police';
  if (l.includes('fire') || n === '101') return 'fire';
  if (l.includes('emergenc') || n === '112') return 'emergency';
  return null;
}

/** The number painted on the vehicle, shrunk to fit if the owner entered a long one. */
function PaintedNumber({ x, y, width, size, fill, children }) {
  const text = String(children);
  const fontSize = Math.min(size, width / (Math.max(text.length, 1) * 0.5));
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={fontSize} fill={fill} className="em-veh__num">
      {text}
    </text>
  );
}

function Wheel({ x }) {
  return (
    <g>
      <circle cx={x} cy="114" r="16" fill={TYRE} />
      <circle cx={x} cy="114" r="6" fill={HUB} />
    </g>
  );
}

function LightBar({ x, y, width, left = LIGHT_RED, right = LIGHT_BLUE }) {
  const half = (width - 8) / 2;
  return (
    <g>
      <rect x={x} y={y} width={width} height="11" rx="4" fill={TYRE} />
      <rect x={x + 3} y={y + 2} width={half} height="7" rx="2.5" fill={left} className="em-veh__flash" />
      <rect x={x + 5 + half} y={y + 2} width={half} height="7" rx="2.5" fill={right} className="em-veh__flash em-veh__flash--b" />
    </g>
  );
}

function AmbulanceShape({ number }) {
  return (
    <svg viewBox="0 0 240 140" aria-hidden="true">
      <ellipse cx="120" cy="130" rx="108" ry="5" className="em-veh__shadow" />
      <LightBar x={58} y={16} width={46} />
      <rect x="8" y="27" width="152" height="87" rx="9" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
      <path d="M158 48 H196 Q205 48 210 56 L226 81 Q230 87 230 94 V106 Q230 114 222 114 H158 Z" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
      <path d="M168 56 H194 Q199 56 202 61 L214 80 H168 Z" fill={GLASS} />
      <rect x="221" y="86" width="7" height="6" rx="2" fill={AMBER} />
      <rect x="9" y="92" width="220" height="8" fill={RED} />
      <path d="M42 40 h12 v12 h12 v12 h-12 v12 h-12 v-12 h-12 v-12 h12 z" fill={RED} />
      <PaintedNumber x={114} y={80} width={76} size={50} fill={RED}>
        {number}
      </PaintedNumber>
      <Wheel x={52} />
      <Wheel x={194} />
    </svg>
  );
}

function PoliceShape({ number }) {
  return (
    <svg viewBox="0 0 240 140" aria-hidden="true">
      <ellipse cx="120" cy="130" rx="108" ry="5" className="em-veh__shadow" />
      <LightBar x={62} y={20} width={56} />
      <path d="M22 64 V40 Q22 31 31 31 H150 Q158 31 163 37 L184 64 Z" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
      <rect x="30" y="38" width="50" height="21" rx="3" fill={GLASS} />
      <rect x="86" y="38" width="52" height="21" rx="3" fill={GLASS} />
      <path d="M144 38 H155 Q159 38 161 41 L176 59 H144 Z" fill={GLASS} />
      <path d="M10 72 Q10 64 18 64 H200 L224 76 Q232 80 232 88 V106 Q232 114 224 114 H16 Q10 114 10 108 Z" fill="#fff" stroke={OUTLINE} strokeWidth="2" />
      <rect x="11" y="99" width="220" height="9" fill="#1f4fa8" />
      <rect x="224" y="82" width="7" height="6" rx="2" fill={AMBER} />
      <PaintedNumber x={112} y={96} width={90} size={39} fill="#1f4fa8">
        {number}
      </PaintedNumber>
      <Wheel x={54} />
      <Wheel x={190} />
    </svg>
  );
}

function FireShape({ number }) {
  const rungs = Array.from({ length: 13 }, (_, i) => 18 + i * 12);
  return (
    <svg viewBox="0 0 240 140" aria-hidden="true">
      <ellipse cx="120" cy="130" rx="110" ry="5" className="em-veh__shadow" />
      <g fill={HUB}>
        <rect x="12" y="25" width="166" height="4" rx="2" />
        <rect x="12" y="35" width="166" height="4" rx="2" />
        {rungs.map((x) => (
          <rect key={x} x={x} y="27" width="3" height="10" />
        ))}
      </g>
      <rect x="32" y="39" width="6" height="8" fill={OUTLINE} />
      <rect x="150" y="39" width="6" height="8" fill={OUTLINE} />
      <LightBar x={184} y={27} width={32} left={LIGHT_RED} right={AMBER} />
      <rect x="6" y="46" width="170" height="68" rx="6" fill={RED} stroke={RED_DARK} strokeWidth="2" />
      <path d="M174 38 H206 Q214 38 218 46 L230 74 Q232 79 232 86 V106 Q232 114 224 114 H174 Z" fill={RED} stroke={RED_DARK} strokeWidth="2" />
      <path d="M182 46 H204 Q208 46 210 50 L221 72 H182 Z" fill={GLASS} />
      <rect x="224" y="82" width="7" height="6" rx="2" fill={AMBER} />
      <rect x="7" y="94" width="224" height="7" fill="#ffd23f" />
      <path d="M40 50 V90 M146 50 V90" stroke={RED_DARK} strokeWidth="2" />
      <PaintedNumber x={93} y={86} width={92} size={52} fill="#fff">
        {number}
      </PaintedNumber>
      <Wheel x={36} />
      <Wheel x={72} />
      <Wheel x={204} />
    </svg>
  );
}

function BeaconShape({ number }) {
  // Light rays around the dome, from its centre at (120, 72).
  const rays = [-180, -150, -120, -90, -60, -30, 0].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return { x1: 120 + 56 * Math.cos(a), y1: 72 + 56 * Math.sin(a), x2: 120 + 68 * Math.cos(a), y2: 72 + 68 * Math.sin(a) };
  });
  return (
    <svg viewBox="0 0 240 140" aria-hidden="true">
      <ellipse cx="120" cy="130" rx="84" ry="5" className="em-veh__shadow" />
      <g stroke={LIGHT_RED} strokeWidth="5" strokeLinecap="round" className="em-veh__rays">
        {rays.map((r) => (
          <line key={`${r.x1}-${r.y1}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
        ))}
      </g>
      <path d="M70 98 V80 Q70 30 120 30 Q170 30 170 80 V98 Z" fill={LIGHT_RED} stroke={RED_DARK} strokeWidth="2" />
      <ellipse cx="96" cy="56" rx="7" ry="15" fill="#fff" opacity="0.35" transform="rotate(25 96 56)" />
      <rect x="56" y="96" width="128" height="22" rx="6" fill={TYRE} />
      <rect x="44" y="114" width="152" height="11" rx="4" fill="#2c3e50" />
      <PaintedNumber x={120} y={88} width={84} size={46} fill="#fff">
        {number}
      </PaintedNumber>
    </svg>
  );
}

const SHAPES = { ambulance: AmbulanceShape, police: PoliceShape, fire: FireShape, emergency: BeaconShape };

export default function ServiceButton({ service }) {
  const { label = '', number = '', description = '' } = service;
  const kind = serviceKind(service);
  const Shape = SHAPES[kind];

  if (!Shape) {
    return (
      <a className="em-tile" href={telHref(number)}>
        <Siren className="em-tile__icon" aria-hidden="true" />
        <span className="em-tile__num">{number}</span>
        <span className="em-tile__label">{label}</span>
        {description && <span className="em-tile__desc">{description}</span>}
      </a>
    );
  }

  return (
    <a
      className={`em-svc em-svc--${kind}`}
      href={telHref(number)}
      aria-label={`Call ${number}, ${label}${description ? `: ${description}` : ''}`}
    >
      <Shape number={number} />
      <span className="em-svc__label">
        <Phone aria-hidden="true" />
        {label}
      </span>
      {description && <span className="em-svc__desc">{description}</span>}
    </a>
  );
}
