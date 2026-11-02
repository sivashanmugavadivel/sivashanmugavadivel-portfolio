// Seizure: one scene per step.
import {
  Arm,
  C,
  easeInOut,
  Floor,
  HandFront,
  HeadSide,
  Leg,
  lerp,
  mixP,
  NoSign,
  Phone,
  Scene,
  Seg,
  Shadow,
  span,
  Stopwatch,
  Torso,
  useLoop,
} from './kit';
import { HelperSide } from './people';
import { RecoveryStepScene } from './recovery';

/** Person on the floor having a seizure. headY 210 = head on the floor, 192 = on a cushion. */
function SeizingPerson({ ms, headY = 192, jerk = 1 }) {
  const s = ms / 1000;
  const j1 = Math.sin(s * Math.PI * 2 * 3) * jerk;
  const j2 = Math.sin(s * Math.PI * 2 * 3 + 1.4) * jerk;
  const j3 = Math.sin(s * Math.PI * 2 * 3 + 2.6) * jerk;
  return (
    <g>
      <Leg hip={[258, 207]} knee={[304, 194 + j2 * 3]} ankle={[350, 214]} toe={[352, 198]} pants={C.pantsAShade} />
      <Arm s={[154, 206]} e={[174, 214]} h={[184, 192 + j3 * 5]} sleeve={C.shirtAShade} skin={C.skinAShade} w={11} />
      <Seg a={[132, headY + 4]} b={[148, 206]} w={12} c={C.skinA} />
      <Torso s={[154, 210 + j1 * 0.6]} h={[258, 210]} w={32} shirt={C.shirtA} pants={C.pantsA} />
      <Leg hip={[258, 214]} knee={[306, 200 + j1 * 4]} ankle={[352, 219]} toe={[356, 203]} pants={C.pantsA} />
      <Arm s={[160, 214]} e={[186, 222]} h={[198, 198 + j1 * 6]} sleeve={C.shirtA} skin={C.skinA} w={11} />
      <HeadSide c={[118, headY]} r={16} rot={-90 + j2 * 5} skin={C.skinA} shade={C.skinAShade} eye="closed" />
      <g stroke="var(--em-ink-2)" strokeWidth="2" strokeLinecap="round" opacity={(0.3 + 0.5 * Math.abs(j1)) * jerk}>
        <path d="M196 180 l6 -6 M208 186 l7 -4 M300 178 l4 -7 M314 182 l6 -5" />
      </g>
    </g>
  );
}

function Jacket({ at }) {
  return (
    <g>
      <rect x={at[0] - 27} y={at[1] - 9} width="54" height="18" rx="7" fill={C.shirtBShade} />
      <path d={`M${at[0] - 21} ${at[1] - 1} H${at[0] + 21}`} stroke={C.shirtB} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Chair({ dx = 0, o = 1 }) {
  return (
    <g transform={`translate(${dx - 62} 0)`} opacity={o}>
      <Seg a={[392, 142]} b={[392, 226]} w={6} c={C.woodShade} />
      <Seg a={[392, 150]} b={[392, 176]} w={11} c={C.wood} />
      <Seg a={[360, 187]} b={[394, 187]} w={7} c={C.wood} />
      <Seg a={[363, 187]} b={[363, 226]} w={6} c={C.wood} />
    </g>
  );
}

const fmt = (secs) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;

/** Step 1: note the time. */
function TimeScene({ playing, phase }) {
  const { t, ms } = useLoop(playing, 6000, playing ? 0 : 0.3, phase);
  return (
    <Scene
      label="Helper kneeling beside a person having a seizure, timing it"
      caption="Note the time it started"
      sub="Stay calm and stay with them"
    >
      <Floor y={226} />
      <Shadow cx={236} cy={227} rx={130} ry={5} />
      <Stopwatch c={[360, 54]} r={20} turn={t} label={fmt((ms / 1000) % 600)} labelSide="left" />
      <HelperSide />
      <Jacket at={[121, 217]} />
      <SeizingPerson ms={ms} />
    </Scene>
  );
}

/** Step 2: clear the space, cushion the head. */
function SpaceScene({ playing, phase }) {
  const { t, ms } = useLoop(playing, 5400, playing ? 0 : 0.95, phase);
  const away = easeInOut(span(t, 0.06, 0.34));
  const place = easeInOut(span(t, 0.42, 0.74));
  const back = easeInOut(span(t, 0.8, 0.94));
  const jacket = mixP([104, 150], [121, 217], place);
  const hand = t < 0.8 ? mixP([96, 146], [116, 206], place) : mixP([116, 206], [100, 164], back);
  return (
    <Scene
      label="Helper moving a chair away and sliding a folded jacket under the head"
      caption={t < 0.4 ? 'Move hard or sharp things away' : 'Put something soft under their head'}
    >
      <Floor y={226} />
      <Shadow cx={236} cy={227} rx={130} ry={5} />
      <Chair dx={130 * away} o={1 - away} />
      {t > 0.36 && <Jacket at={jacket} />}
      <HelperSide near={hand} />
      <SeizingPerson ms={ms} headY={lerp(210, 192, place)} />
    </Scene>
  );
}

/** Step 3: don't restrain, nothing in the mouth. */
function NoHoldScene({ playing, phase }) {
  const { t, ms } = useLoop(playing, 4800, playing ? 0 : 0.92, phase);
  const reach = easeInOut(span(t, 0.08, 0.3));
  const back = easeInOut(span(t, 0.4, 0.58));
  const hand = mixP([100, 164], [168, 180], reach * (1 - back));
  return (
    <Scene
      label="Helper's hand stops short and pulls back instead of holding the person down; no spoon in the mouth"
      caption="Don’t hold them down"
      sub="Never put anything in their mouth"
    >
      <Floor y={226} />
      <Shadow cx={236} cy={227} rx={130} ry={5} />
      <HelperSide near={hand} />
      <Jacket at={[121, 217]} />
      <SeizingPerson ms={ms} />
      <NoSign c={[232, 104]} r={24} pop={span(t, 0.3, 0.42)} label="Holding down">
        <HandFront at={[0, 13]} size={0.42} fill={C.skinB} shade={C.skinBShade} />
      </NoSign>
      <NoSign c={[342, 104]} r={24} pop={span(t, 0.55, 0.67)} label="In the mouth">
        <ellipse cx="-6" cy="-5" rx="7" ry="5" fill="#AEB9C3" transform="rotate(35 -6 -5)" />
        <line x1="-1" y1="0" x2="11" y2="11" stroke="#8D99A5" strokeWidth="3.5" strokeLinecap="round" />
      </NoSign>
    </Scene>
  );
}

/** Step 5: over 5 minutes, call the emergency number. */
function CallScene({ playing, phase, number }) {
  const { t, ms } = useLoop(playing, 6400, playing ? 0 : 0.95, phase);
  const secs = lerp(268, 312, easeInOut(span(t, 0.02, 0.7)));
  const over = secs >= 300;
  return (
    <Scene
      label={`Stopwatch passing five minutes, then a phone calling ${number}`}
      caption={`Over 5 minutes? Call ${number}`}
      sub="Also if another seizure starts"
    >
      <Stopwatch c={[112, 144]} r={52} turn={(secs % 60) / 60} progress={Math.min(secs / 300, 1)} alarm={over} />
      <text
        x="112"
        y="236"
        textAnchor="middle"
        className={`em-scene-text em-scene-text--big${over ? ' em-scene-text--alarm' : ''}`}
      >
        {fmt(secs)}
      </text>
      <g opacity={span(t, 0.66, 0.74)}>
        <Phone at={[300, 140]} number={number} ms={ms} size={1.35} />
      </g>
    </Scene>
  );
}

/** Step 4: once it stops, check breathing; recovery position only if it's normal. */
function AfterScene({ playing, phase }) {
  return (
    <RecoveryStepScene
      playing={playing}
      phase={phase}
      step={3}
      caption="When the jerking stops"
      sub="Breathing normally? Recovery position"
    />
  );
}

export function SeizureAnim({ playing, step = 0, phase, number = '112' }) {
  const scenes = [TimeScene, SpaceScene, NoHoldScene, AfterScene, CallScene];
  const S = scenes[step] || TimeScene;
  return <S playing={playing} phase={phase} number={number} />;
}
