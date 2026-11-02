// Choking: coughing, back blows, abdominal thrusts, repeat, collapse.
import {
  Arm,
  C,
  easeIn,
  easeInOut,
  easeOut,
  Floor,
  HeadSide,
  Leg,
  mixP,
  mixPose,
  Scene,
  Seg,
  Shadow,
  timeline,
  Torso,
  useLoop,
} from './kit';
import { CprPushScene } from './cpr';

const CH_LEGS = {
  cB: { hip: [184, 156], knee: [190, 194], ankle: [192, 230], toe: [178, 232] },
  cF: { hip: [176, 156], knee: [168, 194], ankle: [162, 230], toe: [148, 232] },
  rB: { hip: [230, 156], knee: [242, 194], ankle: [248, 230], toe: [234, 232] },
  rF: { hip: [222, 156], knee: [210, 193], ankle: [204, 230], toe: [190, 232] },
};

const CH_UPRIGHT = {
  cHead: [154, 54],
  cHeadRot: 0,
  cSh: [168, 90],
  cHip: [180, 154],
  cNS: [166, 97],
  cNE: [144, 116],
  cNH: [154, 76],
  cFS: [172, 95],
  cFE: [150, 110],
  cFH: [160, 74],
  rHead: [214, 52],
  rSh: [218, 90],
  rHip: [226, 154],
  rFS: [222, 96],
  rFE: [202, 124],
  rFH: [160, 118],
  rNS: [214, 98],
  rNE: [196, 128],
  rNH: [152, 122],
  cough: 0,
};
const CH_THRUST_IN = {
  ...CH_UPRIGHT,
  cHead: [152, 51],
  cSh: [166, 87],
  cNH: [152, 73],
  cFH: [158, 71],
  rFE: [205, 117],
  rFH: [165, 110],
  rNE: [200, 120],
  rNH: [158, 113],
};
const CH_COUGH = {
  ...CH_UPRIGHT,
  rFE: [224, 124],
  rFH: [226, 150],
  rNE: [208, 126],
  rNH: [194, 106],
};
const CH_COUGH_JERK = { ...CH_COUGH, cHead: [151, 58], cSh: [166, 93], cNH: [151, 79], cFH: [157, 77], cough: 1 };
const CH_BENT_RAISED = {
  ...CH_UPRIGHT,
  cHead: [114, 104],
  cHeadRot: -45,
  cSh: [138, 110],
  cHip: [184, 154],
  cNS: [140, 117],
  cNE: [134, 146],
  cNH: [139, 170],
  cFS: [145, 114],
  cFE: [141, 144],
  cFH: [146, 167],
  rFS: [222, 96],
  rFE: [194, 126],
  rFH: [150, 134],
  rNS: [214, 98],
  rNE: [198, 70],
  rNH: [178, 56],
};
const CH_BENT_IMPACT = {
  ...CH_BENT_RAISED,
  cHead: [111, 107],
  cSh: [136, 113],
  cNS: [138, 120],
  cFS: [143, 117],
  rNE: [190, 88],
  rNH: [163, 104],
};

function chokingPose(mode, ms) {
  if (mode === 'cough') {
    const t = (ms % 2400) / 2400;
    const k = [0.1, 0.32, 0.54].reduce((acc, at) => Math.max(acc, Math.max(0, 1 - Math.abs(t - at) / 0.07)), 0);
    return { pose: mixPose(CH_COUGH, CH_COUGH_JERK, easeOut(k)), label: 'Keep coughing' };
  }
  const blows = (local) => {
    const n = Math.min(4, Math.floor(local / 800));
    const u = (local % 800) / 800;
    const pose = timeline(
      [
        [0, CH_BENT_RAISED, easeIn],
        [0.22, CH_BENT_IMPACT],
        [0.34, CH_BENT_IMPACT],
        [0.8, CH_BENT_RAISED],
        [1, CH_BENT_RAISED],
      ],
      u,
    );
    return { pose, label: `Back blow ${n + 1} of 5` };
  };
  const thrusts = (local) => {
    const n = Math.min(4, Math.floor(local / 900));
    const u = (local % 900) / 900;
    const pose = timeline(
      [
        [0, CH_UPRIGHT, easeIn],
        [0.2, CH_THRUST_IN],
        [0.32, CH_THRUST_IN],
        [0.75, CH_UPRIGHT],
        [1, CH_UPRIGHT],
      ],
      u,
    );
    return { pose, label: `Abdominal thrust ${n + 1} of 5` };
  };
  if (mode === 'blows') return blows(ms % 4000);
  if (mode === 'thrusts') return thrusts(ms % 4500);
  // alternate: 5 blows, stand up, 5 thrusts, lean forward, repeat
  const t = ms % 10000;
  if (t < 4000) return blows(t);
  if (t < 4700) return { pose: mixPose(CH_BENT_RAISED, CH_UPRIGHT, easeInOut((t - 4000) / 700)), label: 'Switch to thrusts' };
  if (t < 9200) return thrusts(t - 4700);
  return { pose: mixPose(CH_UPRIGHT, CH_BENT_RAISED, easeInOut((t - 9200) / 800)), label: 'Switch to back blows' };
}

export function ChokingAnim({ playing, step = 0, phase, number = '112' }) {
  const { ms } = useLoop(playing, 10000, 0, phase);
  if (step === 4) {
    return (
      <CprPushScene
        playing={playing}
        phase={phase}
        caption={`If they collapse: call ${number}`}
        sub="Lower them to the floor and start CPR"
      />
    );
  }
  const mode = ['cough', 'blows', 'thrusts', 'alternate'][step] || 'alternate';
  const { pose: p, label } = chokingPose(mode, ms);
  const bent = p.cHeadRot < -10;
  const mouth = [p.cHead[0] - 14, p.cHead[1] + 8];
  const sub = {
    cough: 'If they can cough, let them',
    blows: 'Heel of the hand, between the shoulder blades',
    thrusts: 'Fist above the navel, pull in and up',
    alternate: 'Until the object comes out',
  }[mode];

  return (
    <Scene label="Helper standing behind a choking person, giving back blows and abdominal thrusts" caption={label} sub={sub}>
      <Floor y={234} />
      <g transform="translate(24 28) scale(0.88)">
        <Shadow cx={200} cy={233} rx={70} ry={4} />
        {/* helper: far arm and body (behind the person) */}
        <Arm s={p.rFS} e={p.rFE} h={p.rFH} sleeve={C.shirtBShade} skin={C.skinBShade} w={12} />
        <Leg {...CH_LEGS.rB} pants={C.pantsBShade} />
        <Leg {...CH_LEGS.rF} pants={C.pantsB} />
        <Seg a={mixP(p.rSh, p.rHead, 0.15)} b={mixP(p.rSh, p.rHead, 0.62)} w={13} c={C.skinBShade} />
        <Torso s={p.rSh} h={p.rHip} w={36} shirt={C.shirtB} pants={C.pantsB} />
        <HeadSide c={p.rHead} r={17} rot={bent ? -14 : -6} flip skin={C.skinB} shade={C.skinBShade} />

        {/* person choking */}
        <Arm s={p.cFS} e={p.cFE} h={p.cFH} sleeve={C.shirtAShade} skin={C.skinAShade} w={11} />
        <Leg {...CH_LEGS.cB} hip={[p.cHip[0] + 4, p.cHip[1] + 2]} pants={C.pantsAShade} />
        <Leg {...CH_LEGS.cF} hip={[p.cHip[0] - 4, p.cHip[1] + 2]} pants={C.pantsA} />
        <Seg a={mixP(p.cSh, p.cHead, 0.15)} b={mixP(p.cSh, p.cHead, 0.62)} w={13} c={C.skinAShade} />
        <Torso s={p.cSh} h={p.cHip} w={36} shirt={C.shirtA} pants={C.pantsA} />
        <HeadSide c={p.cHead} r={17} rot={p.cHeadRot} flip skin={C.skinA} shade={C.skinAShade} mouth="open" />
        <Arm s={p.cNS} e={p.cNE} h={p.cNH} sleeve={C.shirtA} skin={C.skinA} w={11} />

        {/* helper's near arm: on the back, striking, or wrapped round for thrusts */}
        <Arm s={p.rNS} e={p.rNE} h={p.rNH} sleeve={C.shirtB} skin={C.skinB} w={12} hand={7.5} />
        {!bent && mode !== 'cough' && <circle cx={p.rNH[0] - 3} cy={p.rNH[1] - 3} r="5.5" fill={C.skinBShade} />}

        {/* cough puffs */}
        {p.cough > 0.05 &&
          [0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${mouth[0] - 6 - p.cough * 10 - i * 7} ${mouth[1] - 6 + i * 6} q-6 4 0 9`}
              stroke="var(--em-ink-2)"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              opacity={p.cough * 0.9}
            />
          ))}
      </g>
    </Scene>
  );
}
