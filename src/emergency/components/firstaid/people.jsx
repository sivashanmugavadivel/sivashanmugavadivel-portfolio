// Reusable people. Coordinates are in the 400 × 250 scene; the floor is at y = 226.
import { Arm, C, clamp01, HeadFront, HeadSide, ik, IkArm, Leg, mixP, Seg, Torso } from './kit';

/** Person lying on their back, side view, head on the left. chest > 0 compresses, < 0 rises. */
export function LyingPerson({ x = 0, chest = 0, pale = false, nearHand, headLift = 0, headRot = 0 }) {
  const skin = pale ? C.skinPale : C.skinA;
  const shade = pale ? C.skinPaleShade : C.skinAShade;
  const P = (px, py) => [px + x, py];
  const chestW = 34 - 4 * chest;
  const s = P(106, 216);
  const hand = nearHand || P(196, 221);
  return (
    <g>
      <Leg hip={P(206, 205)} knee={P(266, 207)} ankle={P(326, 209)} toe={P(328, 193)} pants={C.pantsAShade} />
      <Seg a={P(76, 209 - headLift * 0.6)} b={P(92, 209)} w={12} c={skin} />
      <Torso s={P(100, 226 - chestW / 2)} h={P(204, 210)} w={chestW} shirt={C.shirtA} pants={C.pantsA} />
      <Leg hip={P(206, 213)} knee={P(266, 214)} ankle={P(326, 216)} toe={P(331, 200)} pants={C.pantsA} />
      <Arm s={s} e={ik(s, hand, 45.6, 1)} h={hand} sleeve={C.shirtA} skin={skin} w={11} hand={6} />
      <HeadSide c={P(62, 209 - headLift)} r={17} rot={-90 + headRot} skin={skin} shade={shade} eye="closed" />
    </g>
  );
}

/** Helper kneeling behind the person, seen from the front. dy moves the upper body down. */
export function HelperFrontBody({ dy = 0 }) {
  const R = (p) => [p[0], p[1] + dy];
  return (
    <g>
      <Seg a={[122, 156]} b={[119, 214]} w={23} c={C.pantsBShade} />
      <Seg a={[150, 156]} b={[153, 214]} w={23} c={C.pantsB} />
      <path d="M112 150 L160 150 L158 170 L114 170 Z" fill={C.pantsB} />
      <Seg a={R([136, 70])} b={R([136, 92])} w={14} c={C.skinBShade} />
      <path
        d={`M108 ${100 + dy} Q110 ${87 + dy} 124 ${86 + dy} L148 ${86 + dy} Q162 ${87 + dy} 164 ${100 + dy} L158 156 L114 156 Z`}
        fill={C.shirtB}
        stroke={C.shirtB}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d={`M128 ${87 + dy} Q136 ${95 + dy} 144 ${87 + dy}`}
        stroke={C.shirtBShade}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <HeadFront c={R([136, 64])} r={17} skin={C.skinB} shade={C.skinBShade} eyes="down" />
    </g>
  );
}

/** The kneeling helper's arms. Hands either locked together on the chest or placed separately. */
export function HelperFrontArms({ dy = 0, hL = [131, 183], hR = [141, 183], locked = true }) {
  const sL = [115, 102 + dy];
  const sR = [157, 102 + dy];
  const hl = [hL[0], hL[1] + dy];
  const hr = [hR[0], hR[1] + dy];
  return (
    <g>
      <Arm s={sL} e={ik(sL, hl, 43, 1)} h={hl} sleeve={C.shirtB} skin={C.skinB} w={13} sleeveTo={0.42} hand={0.1} />
      <Arm s={sR} e={ik(sR, hr, 43, -1)} h={hr} sleeve={C.shirtB} skin={C.skinB} w={13} sleeveTo={0.42} hand={0.1} />
      {locked ? (
        <g>
          <ellipse cx="136" cy={186 + dy} rx="15" ry="6.5" fill={C.skinB} />
          <ellipse cx="136" cy={181.5 + dy} rx="12.5" ry="5.5" fill={C.skinBShade} />
          <path
            d={`M128 ${180 + dy} l3 5 M134 ${179.5 + dy} l2 5.5 M140 ${179.5 + dy} l1 5.5`}
            stroke={C.skinB}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g>
          <ellipse cx={hl[0]} cy={hl[1] + 3} rx="14" ry="6.5" fill={C.skinB} />
          <ellipse cx={hr[0]} cy={hr[1] + 3} rx="12.5" ry="5.8" fill={C.skinBShade} />
        </g>
      )}
    </g>
  );
}

/** Helper kneeling on the left, side view, facing right. Hands are placed by position. */
export function HelperSide({
  knee = [48, 222],
  foot = [14, 224],
  hip = [54, 176],
  sh = [64, 114],
  head = [74, 84],
  headRot = 24,
  near = [100, 164],
  far = [70, 168],
  L = 40,
  nearBend = 1,
  farBend = 1,
}) {
  return (
    <g>
      <Seg a={knee} b={foot} w={15} c={C.pantsB} />
      <Seg a={foot} b={[foot[0] - 7, foot[1] - 4]} w={10} c={C.shoe} />
      <Seg a={knee} b={hip} w={19} c={C.pantsB} />
      <IkArm s={sh} h={far} L={L} bend={farBend} sleeve={C.shirtBShade} skin={C.skinBShade} w={12} />
      <Seg a={mixP(sh, head, 0.25)} b={mixP(sh, head, 0.7)} w={13} c={C.skinBShade} />
      <Torso s={sh} h={hip} w={34} shirt={C.shirtB} pants={C.pantsB} />
      <HeadSide c={head} r={16} rot={headRot} skin={C.skinB} shade={C.skinBShade} />
      <IkArm s={sh} h={near} L={L} bend={nearBend} sleeve={C.shirtB} skin={C.skinB} w={12} hand={6.5} />
    </g>
  );
}

/** Person standing, seen from the front. */
export function StandingFront({ cx = 110 }) {
  return (
    <g>
      <ellipse cx={cx} cy="236" rx="34" ry="4" fill="#000" opacity="0.09" />
      <Arm s={[cx - 22, 92]} e={[cx - 30, 130]} h={[cx - 32, 166]} sleeve={C.shirtA} skin={C.skinA} w={12} hand={7} />
      <Arm s={[cx + 22, 92]} e={[cx + 30, 130]} h={[cx + 32, 166]} sleeve={C.shirtA} skin={C.skinA} w={12} hand={7} />
      <Seg a={[cx - 10, 150]} b={[cx - 11, 228]} w={18} c={C.pantsA} />
      <Seg a={[cx + 10, 150]} b={[cx + 11, 228]} w={18} c={C.pantsA} />
      <ellipse cx={cx - 14} cy="233" rx="10" ry="5" fill={C.shoe} />
      <ellipse cx={cx + 14} cy="233" rx="10" ry="5" fill={C.shoe} />
      <rect x={cx - 21} y="140" width="42" height="20" rx="6" fill={C.pantsA} />
      <Seg a={[cx, 66]} b={[cx, 84]} w={13} c={C.skinAShade} />
      <path
        d={`M${cx - 24} 94 Q${cx - 24} 82 ${cx - 12} 82 L${cx + 12} 82 Q${cx + 24} 82 ${cx + 24} 94 L${cx + 20} 148 L${cx - 20} 148 Z`}
        fill={C.shirtA}
        stroke={C.shirtA}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <HeadFront c={[cx, 52]} r={18} skin={C.skinA} shade={C.skinAShade} eyes="open" nose />
    </g>
  );
}

/** Phone lying on the floor on speaker. */
export function FloorPhone({ ms, x = 12 }) {
  const wave = (ms % 1400) / 1400;
  return (
    <g>
      <rect x={x} y="219" width="30" height="7" rx="2.5" fill="#1E2329" />
      <rect x={x + 3} y="220.5" width="24" height="3" rx="1" fill="#5FB0F0" />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${x + 6 - i * 5} ${212 - i * 5} q9 -${7 + i * 4} 18 0`}
          stroke="var(--em-ink-2)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity={clamp01(Math.sin((wave - i * 0.18) * Math.PI * 2) * 0.8 + 0.1)}
        />
      ))}
    </g>
  );
}
