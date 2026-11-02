// CPR: one scene per step.
import {
  Bubble,
  C,
  clamp01,
  easeInOut,
  Floor,
  HeadSide,
  headPoint,
  IkArm,
  lerp,
  mixP,
  Phone,
  Scene,
  Seg,
  Shadow,
  span,
  useLoop,
} from './kit';
import { FloorPhone, HelperFrontArms, HelperFrontBody, HelperSide, LyingPerson } from './people';

function PushCue({ u }) {
  return (
    <g opacity={0.25 + 0.75 * u} stroke={C.red} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M84 110 V148" />
      <path d="M75 139 L84 149 L93 139" />
    </g>
  );
}

function Aed({ ms, u }) {
  const blink = Math.floor(ms / 450) % 2 === 0;
  return (
    <g>
      <path d="M352 190 C330 138 228 140 118 187" stroke="#4A525B" strokeWidth="2.5" fill="none" />
      <path d="M364 190 C342 150 262 150 182 189" stroke="#4A525B" strokeWidth="2.5" fill="none" />
      <rect x="106" y={185 + 2 * u} width="22" height="7" rx="2" fill="#FFFFFF" stroke="#9AA5B1" strokeWidth="1.5" />
      <rect x="170" y={187 + 2 * u} width="22" height="7" rx="2" fill="#FFFFFF" stroke="#9AA5B1" strokeWidth="1.5" />
      <path d="M350 186 q0 -11 11 -11 h14 q11 0 11 11" stroke={C.aedShade} strokeWidth="5" fill="none" />
      <rect x="338" y="185" width="58" height="41" rx="8" fill={C.aed} />
      <rect x="346" y="193" width="24" height="13" rx="2" fill="#DDF3E6" />
      <path d="M383 214 c-8 -5 -10 -10 -7 -13 c2 -2 5 -1 7 1 c2 -2 5 -3 7 -1 c3 3 1 8 -7 13 z" fill="#FFFFFF" />
      <path d="M384 202 l-3 5 h4 l-3 5" stroke={C.aed} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      <circle cx="354" cy="217" r="3.2" fill={blink ? '#FFE066' : '#5E7A68'} />
    </g>
  );
}

/** Step 3: compressions (also reused for "keep going" with an AED, and choking collapse). */
export function CprPushScene({
  playing,
  phase,
  caption = 'Push hard and fast',
  sub = '5–6 cm deep, 100–120 a minute',
  aed = false,
}) {
  const { t, ms } = useLoop(playing, 545, 0, phase);
  const u = Math.sin(t * Math.PI) ** 1.4;
  const dy = 7 * u;
  return (
    <Scene
      label="Helper kneeling beside the person, arms straight, pushing hard and fast on the centre of the chest"
      caption={caption}
      sub={sub}
    >
      <g transform="translate(0 10)">
        <Floor y={226} />
        <Shadow cx={196} cy={227} rx={150} ry={5} />
        <FloorPhone ms={ms} />
        <HelperFrontBody dy={dy} />
        <LyingPerson chest={u} />
        {aed && <Aed ms={ms} u={u} />}
        <HelperFrontArms dy={dy} />
        <PushCue u={u} />
        {aed && <Bubble at={[290, 116]} w={112} text="Continue CPR" to={[350, 176]} />}
      </g>
    </Scene>
  );
}

/** Step 1: tap and shout, then call the emergency number on speaker. */
function CprCheckScene({ playing, phase, number }) {
  const { t, ms } = useLoop(playing, 4400, playing ? 0 : 0.3, phase);
  const asking = t < 0.5;
  const tap = asking ? Math.abs(Math.sin(span(t, 0.05, 0.45) * Math.PI * 4)) : 0;
  return (
    <Scene
      label={`Helper tapping the person's shoulders and asking if they are OK, then calling ${number} on speaker`}
      caption={asking ? 'Tap their shoulders and shout' : `No response? Call ${number}`}
      sub={asking ? '' : 'Put it on speaker. Send someone for an AED'}
    >
      <Floor y={226} />
      <Shadow cx={250} cy={227} rx={150} ry={5} />
      <HelperSide
        knee={[46, 222]}
        foot={[12, 224]}
        hip={[62, 176]}
        sh={[98, 130]}
        head={[118, 106]}
        headRot={40}
        near={[176, 190 - tap * 5]}
        far={[164, 188 - tap * 5]}
        L={50}
      />
      <LyingPerson x={60} />
      <IkArm s={[98, 130]} h={[176, 190 - tap * 5]} L={50} bend={1} sleeve={C.shirtB} skin={C.skinB} w={12} hand={6.5} />
      <Bubble
        at={[196, 70]}
        w={112}
        text="Are you OK?"
        to={[134, 100]}
        o={asking ? clamp01(span(t, 0.03, 0.08) * (1 - span(t, 0.44, 0.5)) * 1) : 0}
      />
      <g opacity={span(t, 0.5, 0.58)}>
        <Phone at={[318, 108]} number={number} ms={ms} size={1.25} />
      </g>
    </Scene>
  );
}

/** Step 2: heel of one hand on the centre of the chest, other hand on top. */
function CprHandsScene({ playing, phase }) {
  const { t, ms } = useLoop(playing, 3400, playing ? 0 : 0.9, phase);
  const a = easeInOut(span(t, 0.15, 0.42));
  const b = easeInOut(span(t, 0.47, 0.72));
  const hL = mixP([114, 144], [136, 184], a);
  const hR = mixP([158, 144], [136, 178], b);
  const ring = (ms % 900) / 900;
  return (
    <Scene
      label="Helper placing the heel of one hand on the centre of the chest, then the other hand on top with fingers locked"
      caption={t < 0.45 ? 'Heel of one hand on the chest' : 'Other hand on top, fingers locked'}
      sub="Centre of the chest, lower half of the breastbone"
    >
      <g transform="translate(0 10)">
        <Floor y={226} />
        <Shadow cx={196} cy={227} rx={150} ry={5} />
        <HelperFrontBody />
        <LyingPerson />
        <g opacity={1 - a}>
          <circle cx="136" cy="191" r={8 + ring * 10} fill="none" stroke={C.red} strokeWidth="3" opacity={1 - ring} />
          <circle cx="136" cy="191" r="4" fill={C.red} />
        </g>
        <HelperFrontArms hL={hL} hR={hR} locked={b > 0.99} />
      </g>
    </Scene>
  );
}

/** Step 4: two rescue breaths (for trained helpers), chest rising. */
function CprBreathsScene({ playing, phase }) {
  const { t, ms } = useLoop(playing, 3600, playing ? 0 : 0.25, phase);
  const b1 = span(t, 0.06, 0.4);
  const b2 = span(t, 0.52, 0.86);
  const env = (u) => clamp01(Math.min(u / 0.2, (1 - u) / 0.2));
  const m = Math.max(env(b1), env(b2));
  const rise = Math.sin(b1 * Math.PI) + Math.sin(b2 * Math.PI);
  const head = mixP([146, 164], [132, 180], m);
  const rot = lerp(38, 75, m);
  const sh = mixP([102, 150], [100, 158], m);
  const mouth = headPoint(head, 16, rot, false, 0.74, 0.48);
  const flow = (ms * 0.08) % 16;
  const arms = { near: [112, 197], far: [139, 201] };
  return (
    <Scene
      label="Trained helper kneeling at the head, tilting it back and giving a rescue breath while the chest rises"
      caption="If trained: 2 breaths after 30 pushes"
      sub="Not trained? Keep pushing without breaths"
    >
      <Floor y={226} />
      <Shadow cx={250} cy={227} rx={150} ry={5} />
      <HelperSide
        knee={[44, 222]}
        foot={[10, 224]}
        hip={[60, 176]}
        sh={sh}
        head={head}
        headRot={rot}
        near={arms.near}
        far={arms.far}
        L={42}
      />
      <LyingPerson x={60} chest={-rise} headRot={-12} />
      {/* helper's face over theirs, one hand on the forehead, fingers lifting the chin */}
      <HeadSide c={head} r={16} rot={rot} skin={C.skinB} shade={C.skinBShade} />
      <IkArm s={sh} h={arms.far} L={42} bend={1} sleeve={C.shirtBShade} skin={C.skinBShade} w={12} hand={6} />
      <IkArm s={sh} h={arms.near} L={42} bend={1} sleeve={C.shirtB} skin={C.skinB} w={12} hand={6.5} />
      {/* air going in */}
      <path
        d={`M${mouth[0] + 2} ${mouth[1] + 4} C 150 204 172 198 ${206} ${190 - rise * 2}`}
        stroke={C.air}
        strokeWidth="3"
        strokeDasharray="6 10"
        strokeDashoffset={-flow}
        fill="none"
        strokeLinecap="round"
        opacity={m * 0.9}
      />
      <g opacity={0.3 + 0.7 * clamp01(rise)}>
        <path
          d="M214 176 V164 M208 170 L214 163 L220 170"
          stroke={C.air}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="228" y="174" className="em-scene-text em-scene-text--small">
          Chest rises
        </text>
      </g>
    </Scene>
  );
}

export function CprAnim({ playing, step = 2, phase, number = '112' }) {
  if (step === 0) return <CprCheckScene playing={playing} phase={phase} number={number} />;
  if (step === 1) return <CprHandsScene playing={playing} phase={phase} />;
  if (step === 3) return <CprBreathsScene playing={playing} phase={phase} />;
  if (step === 4)
    return (
      <CprPushScene
        playing={playing}
        phase={phase}
        aed
        caption="Use an AED as soon as it arrives"
        sub="Follow its voice prompts"
      />
    );
  return <CprPushScene playing={playing} phase={phase} />;
}
