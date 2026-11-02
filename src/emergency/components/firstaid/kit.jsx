// Shared drawing kit for the first-aid scenes: colours, animation timing, and body parts.
// People are drawn from joints (head, shoulders, elbows, hands, hips, knees, feet); scenes
// describe key poses and the animation moves smoothly between them.
import { useEffect, useId, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Palette (figures keep their colours in light and dark mode)
// ---------------------------------------------------------------------------
export const C = {
  skinA: '#C98C62', // person needing help
  skinAShade: '#A9704B',
  skinB: '#8F5B3D', // helper
  skinBShade: '#734731',
  hair: '#261A13',
  shirtA: '#E2A33A',
  shirtAShade: '#C2851F',
  pantsA: '#3D5578',
  pantsAShade: '#2F4362',
  shirtB: '#2F6FB3',
  shirtBShade: '#245A92',
  pantsB: '#2E3842',
  pantsBShade: '#232B33',
  shoe: '#231E1B',
  glove: '#7DB4E6',
  gloveShade: '#5C98D0',
  cloth: '#FFFFFF',
  clothLine: '#D4DCE4',
  blood: '#A31328',
  bloodDark: '#7E0E1F',
  water: '#8ED0F5',
  waterDeep: '#4AA6E0',
  chrome: '#B4BEC8',
  chromeHi: '#E6ECF1',
  chromeShade: '#8D99A5',
  red: '#D2283F',
  mouth: '#5B1A1A',
  green: '#22A35A',
  skinPale: '#D9BBA4',
  skinPaleShade: '#BE9D86',
  blanket: '#B4473F',
  blanketShade: '#93362F',
  aed: '#2E9E5B',
  aedShade: '#237F48',
  wood: '#A27A57',
  woodShade: '#7E5C40',
  steel: '#3B4148',
  steelHi: '#5A626B',
  flame: '#F28C28',
  flameCore: '#FFD25A',
  ring: '#E3B341',
  air: '#6FB7E8',
};

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
export function useLoop(playing, duration, initial = 0, fixed) {
  const [state, setState] = useState({ t: initial, ms: initial * duration });
  const progress = useRef(initial * duration);
  useEffect(() => {
    if (fixed != null || !playing) return undefined;
    let raf;
    const start = performance.now() - progress.current;
    const tick = (now) => {
      // rAF passes the frame's start time, which can be a few ms before `start` was taken.
      // A negative time gives a negative t, and e.g. sin(t·π) ** 1.4 is then NaN.
      const ms = Math.max(0, now - start);
      progress.current = ms;
      setState({ t: (ms % duration) / duration, ms });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, fixed]);
  return fixed != null ? { t: fixed, ms: fixed * duration } : state;
}

export const lerp = (a, b, u) => a + (b - a) * u;
export const mixP = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
export const clamp01 = (u) => Math.min(1, Math.max(0, u));
export const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
export const easeOut = (u) => 1 - (1 - u) ** 3;
export const easeIn = (u) => u * u * u;
/** Progress 0–1 of t through the window [a, b]. */
export const span = (t, a, b) => clamp01((t - a) / (b - a));
/** 0 → 1 → 0 across the window [a, b]. */
export const bump = (t, a, b) => Math.sin(span(t, a, b) * Math.PI);
/** Pop-in with a small overshoot. */
export const easeOutBack = (u) => 1 + 2.2 * (u - 1) ** 3 + 1.2 * (u - 1) ** 2;

/** Two-bone arm/leg solver: where the elbow goes for a given shoulder, hand and bone length. */
export function ik(s, h, L, bend = 1) {
  const dx = h[0] - s[0];
  const dy = h[1] - s[1];
  const d = Math.hypot(dx, dy) || 1;
  const half = Math.min(d / 2, L);
  const off = Math.sqrt(Math.max(0, L * L - half * half)) * bend;
  return [s[0] + dx / 2 + (-dy / d) * off, s[1] + dy / 2 + (dx / d) * off];
}

/** A point on a HeadSide head (local coords drawn facing right) after rotation/flip. */
export function headPoint(c, r, rot, flip, lx, ly) {
  const x = (flip ? -1 : 1) * lx * r;
  const y = ly * r;
  const a = (rot * Math.PI) / 180;
  return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
}

export function mixPose(a, b, u) {
  const out = {};
  Object.keys(a).forEach((k) => {
    const va = a[k];
    const vb = b[k] ?? va;
    if (Array.isArray(va)) out[k] = mixP(va, vb, u);
    else if (typeof va === 'number') out[k] = lerp(va, vb, u);
    else out[k] = u < 0.5 ? va : vb;
  });
  return out;
}

/** keys: [[time 0–1, pose, ease?], …] */
export function timeline(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i += 1) {
    const [t0, p0, ease = easeInOut] = keys[i];
    const [t1, p1] = keys[i + 1];
    if (t <= t1) return mixPose(p0, p1, ease(clamp01((t - t0) / (t1 - t0 || 1))));
  }
  return keys[keys.length - 1][1];
}

// ---------------------------------------------------------------------------
// Drawing primitives
// ---------------------------------------------------------------------------
export function Seg({ a, b, w, c, o }) {
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" opacity={o} />;
}

export function Arm({ s, e, h, sleeve, skin, w = 12, sleeveTo = 0.55, hand = 6.5 }) {
  const cuff = mixP(s, e, sleeveTo);
  return (
    <g>
      <Seg a={s} b={e} w={w - 1} c={skin} />
      <Seg a={e} b={h} w={w - 2} c={skin} />
      <Seg a={s} b={cuff} w={w + 3} c={sleeve} />
      <circle cx={h[0]} cy={h[1]} r={hand} fill={skin} />
    </g>
  );
}

/** Shirt over a pants waistband, from shoulder s to hip h. */
export function IkArm({ s, h, L = 40, bend = 1, ...rest }) {
  return <Arm s={s} e={ik(s, h, L, bend)} h={h} {...rest} />;
}

export function Torso({ s, h, w = 36, shirt, pants }) {
  return (
    <g>
      <Seg a={mixP(s, h, 0.78)} b={h} w={w - 3} c={pants} />
      <Seg a={s} b={mixP(s, h, 0.88)} w={w} c={shirt} />
    </g>
  );
}

export function Shadow({ cx, cy, rx, ry = 4 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000" opacity="0.09" />;
}

export function Leg({ hip, knee, ankle, toe, pants, w = 18 }) {
  return (
    <g>
      <Seg a={hip} b={knee} w={w} c={pants} />
      <Seg a={knee} b={ankle} w={w - 3} c={pants} />
      <Seg a={ankle} b={toe} w={11} c={C.shoe} />
    </g>
  );
}

/** Head in profile, drawn facing right. flip = face left. rot rotates the whole head. */
export function HeadSide({ c, r = 17, rot = 0, flip = false, skin, shade, eye = 'open', mouth = 'closed' }) {
  const hair = `M${-r * 0.98} ${r * 0.28} C${-r * 1.12} ${-r * 0.7} ${-r * 0.35} ${-r * 1.2} ${r * 0.38} ${-r * 1.02} C${r * 0.86} ${-r * 0.9} ${r * 1.02} ${-r * 0.52} ${r * 0.9} ${-r * 0.3} C${r * 0.55} ${-r * 0.56} ${r * 0.12} ${-r * 0.56} ${-r * 0.06} ${-r * 0.3} C${-r * 0.2} ${-r * 0.05} ${-r * 0.28} ${r * 0.36} ${-r * 0.55} ${r * 0.64} C${-r * 0.8} ${r * 0.62} ${-r * 0.95} ${r * 0.48} ${-r * 0.98} ${r * 0.28} Z`;
  const nose = `M${r * 0.9} ${-r * 0.22} L${r * 1.17} ${r * 0.16} L${r * 0.88} ${r * 0.3} Z`;
  return (
    <g transform={`translate(${c[0]} ${c[1]}) rotate(${rot}) scale(${flip ? -1 : 1} 1)`}>
      <circle r={r} fill={skin} />
      <path d={nose} fill={skin} strokeLinejoin="round" stroke={skin} strokeWidth="2" />
      <path d={hair} fill={C.hair} />
      <ellipse cx={-r * 0.1} cy={r * 0.1} rx={r * 0.17} ry={r * 0.24} fill={shade} />
      {eye === 'open' ? (
        <circle cx={r * 0.55} cy={-r * 0.1} r={r * 0.11} fill={C.hair} />
      ) : (
        <path
          d={`M${r * 0.4} ${-r * 0.06} q${r * 0.15} ${r * 0.13} ${r * 0.3} 0`}
          stroke={C.hair}
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {mouth === 'open' ? (
        <ellipse cx={r * 0.74} cy={r * 0.48} rx={r * 0.13} ry={r * 0.17} fill={C.mouth} />
      ) : (
        <path d={`M${r * 0.6} ${r * 0.5} l${r * 0.24} 0`} stroke={shade} strokeWidth="1.8" strokeLinecap="round" />
      )}
    </g>
  );
}

/** Head seen from the front (or from above when rotated). */
export function HeadFront({ c, r = 17, rot = 0, skin, shade, eyes = 'down', nose = false }) {
  const hair = `M${-r} ${r * 0.08} C${-r * 1.06} ${-r * 0.92} ${-r * 0.42} ${-r * 1.17} 0 ${-r * 1.13} C${r * 0.6} ${-r * 1.16} ${r * 1.07} ${-r * 0.86} ${r} ${r * 0.08} C${r * 0.84} ${-r * 0.34} ${r * 0.5} ${-r * 0.56} ${r * 0.08} ${-r * 0.5} C${-r * 0.32} ${-r * 0.64} ${-r * 0.82} ${-r * 0.42} ${-r} ${r * 0.08} Z`;
  const eyeY = eyes === 'down' ? r * 0.24 : r * 0.08;
  return (
    <g transform={`translate(${c[0]} ${c[1]}) rotate(${rot})`}>
      <circle cx={-r * 0.97} cy={r * 0.12} r={r * 0.2} fill={shade} />
      <circle cx={r * 0.97} cy={r * 0.12} r={r * 0.2} fill={shade} />
      <circle r={r} fill={skin} />
      <path d={hair} fill={C.hair} />
      {eyes === 'closed' ? (
        <g stroke={C.hair} strokeWidth="1.7" fill="none" strokeLinecap="round">
          <path d={`M${-r * 0.5} ${eyeY} q${r * 0.15} ${r * 0.12} ${r * 0.3} 0`} />
          <path d={`M${r * 0.2} ${eyeY} q${r * 0.15} ${r * 0.12} ${r * 0.3} 0`} />
        </g>
      ) : (
        <g fill={C.hair}>
          <circle cx={-r * 0.36} cy={eyeY} r={r * 0.1} />
          <circle cx={r * 0.36} cy={eyeY} r={r * 0.1} />
        </g>
      )}
      {nose && <ellipse cx="0" cy={r * 0.36} rx={r * 0.12} ry={r * 0.1} fill={shade} />}
      <path d={`M${-r * 0.16} ${r * 0.62} l${r * 0.32} 0`} stroke={shade} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

/** A hand seen from the side, palm down, fingers pointing left. Wrist at the origin. */
export const HAND_SIDE =
  'M3,-8 C-8,-11 -20,-11 -29,-8 C-39,-6 -49,-4 -56,-1 C-61,1 -60,6 -55,6.5 C-45,7 -35,7.5 -25,8.5 L-6,9.5 C0,9.5 4,6 4,1 C4,-4 4,-7 3,-8 Z';
export const THUMB_SIDE = 'M-12,3 C-19,8 -29,12 -35,11.5 C-39,11 -38,7 -32,5.5 C-25,3.5 -19,2 -13,0.5 Z';

export function SideHand({ at, rot = 0, flip = false, size = 1, fill, shade, lines = true }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${rot}) scale(${(flip ? -1 : 1) * size} ${size})`}>
      <path d={HAND_SIDE} fill={fill} />
      <path d={THUMB_SIDE} fill={shade} />
      {lines && <path d="M-31,-4 L-53,0.5 M-30,1.5 L-50,4" stroke={shade} strokeWidth="1.4" strokeLinecap="round" fill="none" />}
    </g>
  );
}

export function Stopwatch({ c, r = 20, turn, label, labelSide = 'right', progress, alarm = false }) {
  const a = turn * Math.PI * 2;
  const arc = (frac) => {
    const f = Math.min(frac, 0.9999);
    const ang = f * Math.PI * 2;
    const R = r + 7;
    return `M${c[0]} ${c[1] - R} A${R} ${R} 0 ${f > 0.5 ? 1 : 0} 1 ${c[0] + Math.sin(ang) * R} ${c[1] - Math.cos(ang) * R}`;
  };
  return (
    <g>
      <rect x={c[0] - r * 0.25} y={c[1] - r - r * 0.45} width={r * 0.5} height={r * 0.35} rx="2" fill="var(--em-ink)" />
      {progress != null && (
        <>
          <circle cx={c[0]} cy={c[1]} r={r + 7} fill="none" stroke="var(--em-line)" strokeWidth="5" />
          <path d={arc(progress)} fill="none" stroke={alarm ? C.red : C.green} strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      <circle
        cx={c[0]}
        cy={c[1]}
        r={r}
        fill="var(--em-surface)"
        stroke={alarm ? C.red : 'var(--em-ink)'}
        strokeWidth={Math.min(6, Math.max(3, r * 0.2))}
      />
      <line
        x1={c[0]}
        y1={c[1]}
        x2={c[0] + Math.sin(a) * (r - 6)}
        y2={c[1] - Math.cos(a) * (r - 6)}
        stroke={C.red}
        strokeWidth={Math.max(3, r * 0.12)}
        strokeLinecap="round"
      />
      <circle cx={c[0]} cy={c[1]} r={Math.max(2.6, r * 0.1)} fill="var(--em-ink)" />
      {label && (
        <text
          x={labelSide === 'right' ? c[0] + r + 8 : c[0] - r - 8}
          y={c[1] + 5}
          textAnchor={labelSide === 'right' ? 'start' : 'end'}
          className="em-scene-text"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export function Floor({ y }) {
  return <rect x="0" y={y} width="400" height={250 - y} fill="var(--em-floor)" />;
}

export function Scene({ label, caption, sub, children }) {
  return (
    <svg viewBox="0 0 400 250" role="img" aria-label={label} className="em-scene">
      {children}
      {caption && (
        <text x="16" y="28" className="em-scene-text">
          {caption}
        </text>
      )}
      {sub && (
        <text x="16" y="46" className="em-scene-text em-scene-text--sub">
          {sub}
        </text>
      )}
    </svg>
  );
}

/** A phone, upright, showing the number being called, with ringing waves. */
export function Phone({ at, number = '112', ms = 0, size = 1, speaker = true }) {
  const ph = (ms % 1200) / 1200;
  // The owner's number can be longer than 112; squeeze it onto the screen rather than spill over.
  const squeeze = String(number).length > 4;
  return (
    <g transform={`translate(${at[0]} ${at[1]}) scale(${size})`}>
      {[-1, 1].map((side) =>
        [0, 1, 2].map((i) => (
          <path
            key={`${side}-${i}`}
            d={`M${side * (24 + i * 7)} -10 q${side * 6} 10 0 20`}
            stroke={C.green}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            opacity={clamp01(Math.sin((ph - i * 0.16) * Math.PI * 2) * 0.9 + 0.1)}
          />
        )),
      )}
      <rect x="-18" y="-33" width="36" height="66" rx="7" fill="#1E2329" />
      <rect x="-15" y="-27" width="30" height="52" rx="3" fill="#EAF2F9" />
      <text
        x="0"
        y="-12"
        textAnchor="middle"
        className="em-scene-text--phone"
        textLength={squeeze ? 26 : undefined}
        lengthAdjust={squeeze ? 'spacingAndGlyphs' : undefined}
      >
        {number}
      </text>
      {speaker && (
        <path
          d="M-6 -2 h3 l4 -3.5 v11 l-4 -3.5 h-3 z M4 -2.5 q2.5 3 0 6"
          fill="#14202B"
          stroke="#14202B"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      )}
      <circle cx="0" cy="15" r="6" fill={C.red} />
      <path d="M-3 14 q3 3 6 0" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Speech bubble with its tail pointing at `to`. */
export function Bubble({ at, text, w = 104, to, o = 1 }) {
  const [x, y] = at;
  const tip = to || [x - w / 2 + 16, y + 26];
  const bx = Math.min(Math.max(tip[0], x - w / 2 + 14), x + w / 2 - 14);
  return (
    <g opacity={o}>
      <path
        d={`M${bx - 7} ${y + 12} L${tip[0]} ${tip[1]} L${bx + 7} ${y + 12} Z`}
        fill="var(--em-surface)"
        stroke="var(--em-ink-2)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect
        x={x - w / 2}
        y={y - 14}
        width={w}
        height="28"
        rx="14"
        fill="var(--em-surface)"
        stroke="var(--em-ink-2)"
        strokeWidth="2"
      />
      <rect x={bx - 6} y={y + 9} width="12" height="5" fill="var(--em-surface)" />
      <text x={x} y={y + 5} textAnchor="middle" className="em-scene-text em-scene-text--small">
        {text}
      </text>
    </g>
  );
}

/** Red "don't" sign around a small icon (icon drawn around 0,0). */
export function NoSign({ c, r = 24, pop = 1, label, children }) {
  const k = easeOutBack(clamp01(pop));
  if (pop <= 0) return null;
  return (
    <g transform={`translate(${c[0]} ${c[1]}) scale(${k})`} opacity={clamp01(pop * 2)}>
      <circle r={r} fill="var(--em-surface)" stroke={C.red} strokeWidth="4" />
      {children}
      <line x1={-r * 0.7} y1={-r * 0.7} x2={r * 0.7} y2={r * 0.7} stroke={C.red} strokeWidth="4" strokeLinecap="round" />
      {label && (
        <text y={r + 17} textAnchor="middle" className="em-scene-text em-scene-text--small">
          {label}
        </text>
      )}
    </g>
  );
}

/** A hand seen from the front, fingers up. Wrist at the origin. */
export function HandFront({ at, rot = 0, size = 1, fill, shade }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${rot}) scale(${size})`}>
      <line x1="-14" y1="-13" x2="-25" y2="-29" stroke={fill} strokeWidth="9" strokeLinecap="round" />
      <rect x="-14" y="-33" width="28" height="35" rx="11" fill={fill} />
      {[
        [-10.5, -30, -50],
        [-3.5, -32, -57],
        [3.5, -32, -55],
        [10.5, -30, -48],
      ].map(([x, y1, y2]) => (
        <line key={x} x1={x} y1={y1} x2={x} y2={y2} stroke={fill} strokeWidth="7" strokeLinecap="round" />
      ))}
      <path d="M-8 -14 q8 5 16 -2" stroke={shade} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Unique, CSS-safe id for clip paths. */
export function useSvgId(prefix) {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}
