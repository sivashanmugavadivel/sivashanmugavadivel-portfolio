// Recovery position, seen from above. Each step animates its own movement.
import { Arm, C, HeadFront, HeadSide, Leg, mixP, Scene, Seg, timeline, useLoop } from './kit';

const RP = [];
RP[0] = {
  // on their back, arms by their sides
  tA: [104, 118],
  tB: [198, 118],
  tW: 58,
  side: 0,
  head: [62, 118],
  headRot: 0,
  nS: [104, 146],
  nE: [150, 154],
  nH: [194, 156],
  fS: [104, 90],
  fE: [150, 82],
  fH: [194, 80],
  nHip: [206, 130],
  nKnee: [270, 131],
  nAnk: [334, 132],
  nToe: [345, 132],
  fHip: [206, 106],
  fKnee: [270, 105],
  fAnk: [334, 104],
  fToe: [345, 104],
  kneeUp: 0,
  r1: [150, 290],
  r2: [250, 290],
};
RP[1] = { ...RP[0], nE: [104, 196], nH: [62, 198], r1: [62, 202] }; // near arm out at a right angle, palm up
RP[2] = { ...RP[1], fE: [134, 124], fH: [74, 134], r1: [78, 140] }; // far hand against near cheek
RP[3] = { ...RP[2], fKnee: [246, 100], fAnk: [252, 120], fToe: [256, 126], kneeUp: 1, r2: [244, 104] }; // far knee bent up
RP[4] = {
  // rolled toward the helper onto their side
  ...RP[3],
  tA: [104, 130],
  tB: [198, 130],
  tW: 40,
  side: 1,
  head: [64, 130],
  nS: [104, 142],
  fS: [104, 120],
  fE: [128, 150],
  fH: [80, 146],
  fHip: [206, 124],
  fKnee: [214, 182],
  fAnk: [278, 186],
  fToe: [282, 198],
  nHip: [206, 138],
  nKnee: [270, 140],
  nAnk: [334, 141],
  nToe: [338, 154],
  kneeUp: 0,
  r1: [82, 156],
  r2: [222, 186],
};
RP[5] = { ...RP[4], headRot: -14, r1: [46, 122], r2: [150, 290] }; // head tilted back, airway open

// Where the helper's hands start for each step, so they already hold the limb they move.
const RP_START = [{ ...RP[0], r1: RP[0].nH }, { ...RP[1], r1: RP[1].fH }, { ...RP[2], r2: RP[2].fKnee }, RP[3], RP[4]];

/** Torso seen from above: broad shoulders, narrower waist, hips. */
function OverheadTorso({ a, b, w, side }) {
  const ws = w;
  const ww = w * 0.84;
  const wh = w * (0.88 + 0.16 * side);
  const m = mixP(a, b, 0.6);
  const pts = [
    [a[0], a[1] - ws / 2],
    [m[0], m[1] - ww / 2],
    [b[0], b[1] - wh / 2],
    [b[0], b[1] + wh / 2],
    [m[0], m[1] + ww / 2],
    [a[0], a[1] + ws / 2],
  ];
  return (
    <polygon
      points={pts.map((pt) => pt.join(',')).join(' ')}
      fill={C.shirtA}
      stroke={C.shirtA}
      strokeWidth="12"
      strokeLinejoin="round"
    />
  );
}

function OverheadPerson({ p, breathe }) {
  const tW = p.tW + breathe;
  const faceUp = 1 - p.side;
  return (
    <g>
      {/* legs */}
      <Leg hip={p.fHip} knee={p.fKnee} ankle={p.fAnk} toe={p.fToe} pants={C.pantsAShade} w={22} />
      {p.kneeUp > 0.05 && <circle cx={p.fKnee[0]} cy={p.fKnee[1]} r={13} fill={C.pantsA} opacity={p.kneeUp} />}
      <Leg hip={p.nHip} knee={p.nKnee} ankle={p.nAnk} toe={p.nToe} pants={C.pantsA} w={22} />
      {/* hips / waistband */}
      <rect
        x={p.tB[0] - 10}
        y={p.tB[1] - (tW * (0.88 + 0.16 * p.side)) / 2 + 2}
        width="30"
        height={tW * (0.88 + 0.16 * p.side) - 4}
        rx="9"
        fill={C.pantsA}
      />
      {/* near (bottom) arm, torso, far arm */}
      <Arm s={p.nS} e={p.nE} h={p.nH} sleeve={C.shirtA} skin={C.skinA} w={13} hand={7.5} />
      <Seg a={[p.tA[0] - 26, p.tA[1]]} b={p.tA} w={16} c={C.skinAShade} />
      <OverheadTorso a={[p.tA[0] + 4, p.tA[1]]} b={[p.tB[0], p.tB[1]]} w={tW - 10} side={p.side} />
      {/* head: face up turning to face the helper */}
      <g opacity={faceUp}>
        <HeadFront c={p.head} r={21} rot={-90 + p.headRot} skin={C.skinA} shade={C.skinAShade} eyes="closed" nose />
      </g>
      <g opacity={p.side}>
        <HeadSide c={p.head} r={21} rot={-90 + p.headRot} flip skin={C.skinA} shade={C.skinAShade} eye="closed" />
      </g>
      <Arm s={p.fS} e={p.fE} h={p.fH} sleeve={C.shirtA} skin={C.skinA} w={13} hand={7.5} />
    </g>
  );
}

function HelperArm({ base, hand, flip = 1 }) {
  if (hand[1] > 262) return null;
  const mid = mixP(base, hand, 0.5);
  const dx = hand[0] - base[0];
  const dy = hand[1] - base[1];
  const len = Math.hypot(dx, dy) || 1;
  const elbow = [mid[0] + (-dy / len) * 16 * flip, mid[1] + (dx / len) * 16 * flip];
  return <Arm s={base} e={elbow} h={hand} sleeve={C.shirtB} skin={C.skinB} w={17} sleeveTo={0.72} hand={9.5} />;
}

const CAPTIONS = [
  'Arm nearest you out, palm up',
  'Back of far hand to their cheek',
  'Bend the far knee up',
  'Roll them toward you',
  'Tilt the head back, check breathing',
];

export function RecoveryStepScene({ playing, step = 0, phase, caption, sub = 'Seen from above' }) {
  const { t, ms } = useLoop(playing, 3600, playing ? 0 : 0.75, phase);
  const s = Math.min(step, 4);
  const before = RP_START[s];
  const after = RP[s + 1];
  const p =
    t < 0.95
      ? timeline(
          [
            [0, before],
            [0.15, before],
            [0.62, after],
            [0.95, after],
          ],
          t,
        )
      : before;
  const fade = t > 0.9 ? 1 - Math.sin(((t - 0.9) / 0.1) * Math.PI) : 1;
  const breathe = s === 4 ? Math.sin((ms / 3000) * Math.PI * 2) * 2.5 : 0;
  return (
    <Scene
      label="Person being rolled into the recovery position, seen from above, with the helper's hands guiding each movement"
      caption={caption || CAPTIONS[s]}
      sub={sub}
    >
      <rect x="0" y="0" width="400" height="250" fill="var(--em-floor)" />
      <g opacity={fade} transform="translate(-26 -4) scale(1.17)">
        <OverheadPerson p={p} breathe={breathe} />
        <HelperArm base={[150, 268]} hand={p.r1} flip={-1} />
        <HelperArm base={[250, 268]} hand={p.r2} flip={1} />
      </g>
    </Scene>
  );
}

export function RecoveryAnim({ playing, step = 0, phase }) {
  return <RecoveryStepScene playing={playing} step={step} phase={phase} />;
}
