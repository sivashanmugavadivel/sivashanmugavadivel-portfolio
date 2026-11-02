// Severe bleeding: one scene per step.
import {
  Bubble,
  C,
  clamp01,
  easeInOut,
  easeOut,
  Floor,
  HandFront,
  IkArm,
  lerp,
  Phone,
  Scene,
  Seg,
  Shadow,
  SideHand,
  span,
  Stopwatch,
  useLoop,
  useSvgId,
} from './kit';
import { HelperSide, LyingPerson } from './people';

/** The injured forearm lying on the floor, close up. */
function InjuredArm({ pool = 1, seep = 0, wound = false, ms = 0, dripping = false }) {
  const drip = (ms % 650) / 650;
  return (
    <g>
      <ellipse cx="200" cy="214" rx={46 * pool} ry={5.5 * pool} fill={C.blood} opacity="0.85" />
      <path d="M44 164 C120 161 200 162 270 168 L270 196 C200 200 120 203 44 203 Z" fill={C.skinA} />
      <path d="M44 196 C120 197 200 195 270 192 L270 196 C200 200 120 203 44 203 Z" fill={C.skinAShade} opacity="0.5" />
      <SideHand at={[266, 182]} rot={4} flip fill={C.skinA} shade={C.skinAShade} />
      <path d="M0 156 L54 156 Q62 183 54 210 L0 210 Z" fill={C.shirtA} />
      <path d="M46 157 Q53 183 46 209" stroke={C.shirtAShade} strokeWidth="3" fill="none" />
      {seep > 0 && <ellipse cx="188" cy="166" rx="44" ry="5" fill={C.blood} opacity={seep} />}
      {wound && (
        <g>
          <ellipse cx="190" cy="164" rx="24" ry="4.5" fill={C.blood} />
          <path d="M172 164 Q190 159 208 164" stroke={C.bloodDark} strokeWidth="4" strokeLinecap="round" fill="none" />
          {dripping && <circle cx="214" cy={201 + drip * 12} r={3.4 - drip} fill={C.blood} />}
        </g>
      )}
    </g>
  );
}

/** Helper's gloved hands, one on top of the other. dy moves them down (pressing). */
function GlovedHands({ dy = 0 }) {
  const H = (p) => [p[0], p[1] + dy];
  return (
    <g>
      <Seg a={H([244, 136])} b={H([300, 44])} w={24} c={C.skinB} />
      <Seg a={H([290, 62])} b={H([318, 16])} w={29} c={C.shirtB} />
      <Seg a={H([238, 142])} b={H([252, 120])} w={26} c={C.glove} />
      <SideHand at={H([240, 146])} rot={-2} size={1.3} fill={C.glove} shade={C.gloveShade} />
      <Seg a={H([256, 122])} b={H([326, 30])} w={24} c={C.skinBShade} />
      <Seg a={H([316, 46])} b={H([344, 8])} w={29} c={C.shirtBShade} />
      <Seg a={H([250, 128])} b={H([264, 106])} w={26} c={C.gloveShade} />
      <SideHand at={H([252, 131])} rot={-5} size={1.25} fill={C.gloveShade} shade={C.glove} />
    </g>
  );
}

function Pad({ y, squash = 0, stain = 0 }) {
  const top = y + squash * 2;
  return (
    <g>
      <rect x="148" y={top} width="80" height={17 - squash * 2} rx="4" fill={C.cloth} stroke={C.clothLine} strokeWidth="1.5" />
      <path
        d={[160, 172, 184, 196, 208].map((x) => `M${x} ${top + 2} v${12 - squash * 2}`).join(' ')}
        stroke={C.clothLine}
        strokeWidth="1"
      />
      {stain > 0 && (
        <g opacity={stain}>
          <ellipse cx="158" cy={top + 9} rx={4 + 7 * stain} ry="5" fill={C.blood} opacity="0.85" />
          <ellipse cx="190" cy={top + 12} rx={34 * stain} ry="3.5" fill={C.blood} opacity="0.7" />
        </g>
      )}
    </g>
  );
}

function PressCue({ u }) {
  return (
    <g stroke={C.red} strokeWidth="3" strokeLinecap="round" opacity={0.15 + 0.85 * u}>
      <path d="M136 146 l-10 -6 M134 160 l-12 0 M240 162 l12 0" />
    </g>
  );
}

/** Step 1: call the emergency number and put on gloves. */
function CallScene({ playing, phase, number }) {
  const { t, ms } = useLoop(playing, 4400, playing ? 0 : 0.85, phase);
  const g = easeInOut(span(t, 0.22, 0.76));
  const clipY = lerp(70, 234, g);
  const cuffY = Math.min(clipY, 226);
  const id = useSvgId('em-glove');
  return (
    <Scene
      label={`Phone calling ${number} while a glove is pulled onto the helper's hand`}
      caption={t < 0.22 ? `Call ${number} for heavy bleeding` : 'Put on gloves if you have them'}
      sub="A plastic bag over your hand works too"
    >
      <defs>
        <clipPath id={id}>
          <rect x="60" y="40" width="200" height={Math.max(0, clipY - 40)} />
        </clipPath>
      </defs>
      <Phone at={[318, 128]} number={number} ms={ms} size={1.35} />
      <Seg a={[150, 214]} b={[150, 262]} w={36} c={C.skinB} />
      <Seg a={[150, 240]} b={[150, 274]} w={46} c={C.shirtB} />
      <HandFront at={[150, 206]} size={1.6} fill={C.skinB} shade={C.skinBShade} />
      <g clipPath={`url(#${id})`}>
        <HandFront at={[150, 206]} size={1.66} fill={C.glove} shade={C.gloveShade} />
        <Seg a={[150, 196]} b={[150, 228]} w={42} c={C.glove} />
      </g>
      {g > 0.02 && <line x1="128" y1={cuffY} x2="172" y2={cuffY} stroke={C.gloveShade} strokeWidth="3" strokeLinecap="round" />}
    </Scene>
  );
}

/** Step 2: press a clean pad on the wound. */
function PlaceScene({ playing, phase }) {
  const { t, ms } = useLoop(playing, 3800, playing ? 0 : 0.9, phase);
  const land = easeInOut(span(t, 0.28, 0.56));
  const off = lerp(-52, 0, land);
  const press = t > 0.58 ? Math.sin(span(t, 0.58, 1) * Math.PI * 3) ** 2 : 0;
  return (
    <Scene
      label="Gloved hands bringing a clean pad down onto a bleeding wound and pressing hard"
      caption={land < 1 ? 'Cover the wound with a pad' : 'Press down hard'}
      sub="Clean cloth, or your hand if nothing else"
    >
      <Floor y={206} />
      <InjuredArm pool={0.55} seep={land > 0.98 ? 1 : 0} wound={land < 0.98} ms={ms} dripping={land < 0.7} />
      <Pad y={150 + off} squash={press} />
      <GlovedHands dy={off + 4 * press} />
      {land > 0.98 && <PressCue u={press} />}
    </Scene>
  );
}

/** Step 3: keep pressing for 10 minutes. */
function HoldScene({ playing, phase }) {
  const { t, ms } = useLoop(playing, 1800, 0, phase);
  const u = easeInOut(Math.sin(t * Math.PI));
  return (
    <Scene
      label="Gloved hands pressing firmly on the pad for ten minutes"
      caption="Keep pressing for 10 minutes"
      sub="Don’t lift to check"
    >
      <Floor y={206} />
      <Stopwatch c={[42, 90]} r={18} turn={(ms % 10000) / 10000} label="10 min" />
      <InjuredArm pool={1} seep={1} />
      <Pad y={150} squash={u} />
      <GlovedHands dy={4 * u} />
      <PressCue u={u} />
    </Scene>
  );
}

/** Step 4: blood soaks through, add another pad on top and press harder (tourniquet if a limb still spurts). */
function AddScene({ playing, phase }) {
  const { t } = useLoop(playing, 4800, playing ? 0 : 0.92, phase);
  const stain = easeInOut(span(t, 0.04, 0.34));
  const up = easeInOut(span(t, 0.36, 0.46));
  const drop = easeOut(span(t, 0.46, 0.6));
  const down = easeInOut(span(t, 0.62, 0.74));
  const press = t > 0.76 ? Math.sin(span(t, 0.76, 1) * Math.PI * 2) ** 2 : 0;
  const handsY = t < 0.62 ? -38 * up : lerp(-38, -16, down);
  return (
    <Scene
      label="Blood soaks through the first pad, a second pad is added on top and pressure continues"
      caption={t < 0.36 ? 'Blood soaking through?' : 'Add a pad and press harder'}
      sub={t < 0.36 ? 'Keep the first pad where it is' : 'Arm or leg spurting? Tourniquet above it'}
    >
      <Floor y={206} />
      <InjuredArm pool={0.9} seep={1} />
      <Pad y={150} stain={stain} />
      {t > 0.46 && <Pad y={lerp(-40, 134, drop)} squash={press} />}
      <GlovedHands dy={handsY + 4 * press} />
      {t > 0.76 && <PressCue u={press} />}
    </Scene>
  );
}

/** Step 5: lying down, kept warm, watched for shock. */
function ShockScene({ playing, phase }) {
  const { t } = useLoop(playing, 5200, playing ? 0 : 0.9, phase);
  const cover = easeOut(span(t, 0.12, 0.5));
  return (
    <Scene
      label="Person lying down, pale, being covered with a blanket while the helper reassures them"
      caption="Keep them lying down and warm"
      sub="Pale, cold, clammy skin can mean shock"
    >
      <Floor y={226} />
      <Shadow cx={250} cy={227} rx={150} ry={5} />
      <HelperSide
        knee={[88, 222]}
        foot={[54, 224]}
        hip={[96, 174]}
        sh={[120, 130]}
        head={[136, 106]}
        headRot={40}
        near={[156, 193]}
        far={[146, 194]}
        L={44}
      />
      <LyingPerson x={60} pale />
      <g transform={`translate(0 ${lerp(-80, 0, cover)})`} opacity={clamp01(cover * 4)}>
        <path
          d="M166 228 L166 192 Q168 182 184 181 L296 184 Q330 185 344 178 Q356 172 368 182 L392 196 Q400 212 398 228 Z"
          fill={C.blanket}
        />
        <path d="M206 182 L206 228 M218 182 L218 228" stroke={C.blanketShade} strokeWidth="5" />
        <path d="M166 192 Q168 182 184 181 L296 184" stroke={C.blanketShade} strokeWidth="3" fill="none" />
      </g>
      <IkArm s={[120, 130]} h={[156, 193]} L={44} bend={1} sleeve={C.shirtB} skin={C.skinB} w={12} hand={6.5} />
      <Bubble at={[226, 74]} w={150} text="Help is on the way" to={[146, 100]} o={span(t, 0.55, 0.62)} />
    </Scene>
  );
}

export function BleedingAnim({ playing, step = 2, phase, number = '112' }) {
  const scenes = [CallScene, PlaceScene, HoldScene, AddScene, ShockScene];
  const S = scenes[step] || HoldScene;
  return <S playing={playing} phase={phase} number={number} />;
}
