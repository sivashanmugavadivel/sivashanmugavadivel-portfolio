// Burns: one scene per step.
import { C, clamp01, easeInOut, easeOut, lerp, NoSign, Phone, Scene, Seg, SideHand, span, Stopwatch, useLoop } from './kit';
import { StandingFront } from './people';

/** The burned forearm and hand, palm down, coming in from the right. */
function BurnArm({ dx = 0, dy = 0, burn = 1, children }) {
  return (
    <g transform={`translate(${dx} ${dy})`}>
      <path d="M338 136 L480 132 L480 180 L338 178 Z" fill={C.shirtA} />
      <path d="M338 136 Q332 157 338 178" stroke={C.shirtAShade} strokeWidth="5" fill="none" />
      <Seg a={[336, 158]} b={[290, 157]} w={27} c={C.skinA} />
      <SideHand at={[292, 157]} size={1.32} fill={C.skinA} shade={C.skinAShade} />
      <ellipse cx="250" cy="145.5" rx="17" ry="4.5" fill="#E24A4A" opacity={0.25 + 0.65 * burn} />
      <ellipse cx="250" cy="145.5" rx="9" ry="2.6" fill="#F28B7E" opacity={0.3 + 0.5 * burn} />
      {children}
    </g>
  );
}

function Table({ y }) {
  return (
    <g>
      <rect x="0" y={y} width="400" height={250 - y} fill="var(--em-floor)" />
      <rect x="0" y={y} width="400" height="3" fill="#000" opacity="0.06" />
    </g>
  );
}

/** Step 1: make it safe (power off first if electrical), move away from the heat, take off rings. */
function StopScene({ playing, phase }) {
  const { t, ms } = useLoop(playing, 4800, playing ? 0 : 0.95, phase);
  const away = easeInOut(span(t, 0.08, 0.38));
  const dx = lerp(-74, 10, away);
  const slide = easeInOut(span(t, 0.5, 0.72));
  const lift = easeOut(span(t, 0.72, 0.9));
  const f = (k) => Math.sin(ms / 70 + k) * 2;
  return (
    <Scene
      label="Hand pulled away from a hot pan on the stove, then a ring slid off the finger"
      caption={t < 0.45 ? 'Move away from the heat' : 'Take off rings near the burn'}
      sub={t < 0.45 ? 'Electrical? Power off before you touch them' : 'Unless it’s stuck to the skin'}
    >
      {/* stove and counter */}
      <rect x="150" y="176" width="250" height="74" fill="var(--em-floor)" />
      <rect x="0" y="176" width="150" height="74" fill={C.steel} />
      <rect x="0" y="170" width="150" height="8" rx="2" fill={C.steelHi} />
      <circle cx="34" cy="208" r="7" fill={C.steelHi} />
      <circle cx="62" cy="208" r="7" fill={C.steelHi} />
      {/* flames */}
      {[36, 56, 76, 96].map((x, i) => (
        <path
          key={x}
          d={`M${x - 7} 170 Q${x - 4 + f(i)} ${157 + f(i + 2)} ${x} ${152 + f(i)} Q${x + 4 + f(i + 1)} ${158} ${x + 7} 170 Z`}
          fill={C.flame}
        />
      ))}
      {[36, 56, 76, 96].map((x, i) => (
        <path key={`c${x}`} d={`M${x - 3.5} 170 Q${x} ${161 + f(i)} ${x + 3.5} 170 Z`} fill={C.flameCore} />
      ))}
      {/* pan and steam */}
      <path d="M18 138 h104 v16 q0 10 -10 10 h-84 q-10 0 -10 -10 z" fill="#2B2F34" />
      <line x1="122" y1="146" x2="178" y2="140" stroke="#2B2F34" strokeWidth="7" strokeLinecap="round" />
      {[40, 70, 100].map((x, i) => {
        const k = (ms / 1600 + i * 0.33) % 1;
        return (
          <path
            key={x}
            d={`M${x} ${130 - k * 30} q-6 -8 0 -16 q6 -8 0 -16`}
            stroke="var(--em-ink-2)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity={(1 - k) * 0.6}
          />
        );
      })}
      <BurnArm dx={dx} dy={-4}>
        <ellipse
          cx={292 + lerp(-52, -104, slide)}
          cy={156 - 40 * lift}
          rx="3.2"
          ry="7.5"
          fill="none"
          stroke={C.ring}
          strokeWidth="3"
          opacity={1 - lift * 0.7}
        />
      </BurnArm>
    </Scene>
  );
}

/** Step 2: cool under running water for 20 minutes. */
function CoolScene({ playing, phase }) {
  const { t, ms } = useLoop(playing, 6000, 0, phase);
  const cool = 1 - easeInOut(clamp01(t / 0.8));
  const flow = (ms * 0.12) % 22;
  const splash = (ms % 700) / 700;
  return (
    <Scene
      label="Burned hand held under cool running water from a tap"
      caption="Cool under running water"
      sub="Cool, not ice-cold"
    >
      <Stopwatch c={[360, 50]} r={20} turn={t} label="20 min" labelSide="left" />
      <rect x="0" y="196" width="400" height="12" fill="#D9DFE5" />
      <rect x="0" y="208" width="400" height="42" fill="var(--em-floor)" />
      <path
        d="M112 196 L344 196 L336 234 Q334 244 322 244 L134 244 Q122 244 120 234 Z"
        fill="#F1F4F7"
        stroke="#C7D0D8"
        strokeWidth="2"
      />
      <rect x="116" y="196" width="224" height="6" fill="#C7D0D8" />
      <rect x="146" y="186" width="26" height="11" rx="3" fill={C.chromeShade} />
      <path
        d="M159 188 L159 86 Q159 64 181 64 L218 64 Q240 64 240 86 L240 98"
        stroke={C.chrome}
        strokeWidth="15"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M154 180 L154 88 Q154 70 172 69" stroke={C.chromeHi} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M159 104 L136 94" stroke={C.chrome} strokeWidth="9" strokeLinecap="round" />
      <circle cx="134" cy="93" r="6" fill={C.chromeShade} />
      <rect x="233" y="102" width="14" height="42" fill={C.water} opacity="0.85" />
      <line
        x1="238"
        y1="102"
        x2="238"
        y2="144"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeDasharray="8 14"
        strokeDashoffset={-flow}
        opacity="0.85"
      />
      <path d="M226 166 Q232 200 228 240 L254 240 Q250 200 256 166 Z" fill={C.water} opacity="0.55" />
      <line
        x1="241"
        y1="168"
        x2="241"
        y2="238"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeDasharray="8 14"
        strokeDashoffset={-flow}
        opacity="0.6"
      />
      <BurnArm burn={cool} />
      {[-1, 1].map((s) => (
        <circle
          key={s}
          cx={240 + s * (6 + splash * 16)}
          cy={143 - Math.sin(splash * Math.PI) * 12}
          r={2.6 * (1 - splash) + 0.6}
          fill={C.waterDeep}
          opacity={1 - splash}
        />
      ))}
      <g transform="translate(52 104)">
        <rect
          x="-8"
          y="-20"
          width="28"
          height="28"
          rx="6"
          fill="#DCEFFC"
          stroke="#9CC7E8"
          strokeWidth="2"
          transform="rotate(12 6 -6)"
        />
        <path d="M-14 -26 L26 14" stroke={C.red} strokeWidth="4" strokeLinecap="round" />
        <text x="-14" y="30" className="em-scene-text em-scene-text--small">
          No ice
        </text>
      </g>
    </Scene>
  );
}

/** Step 3: lay cling film loosely over the burn. */
function CoverScene({ playing, phase }) {
  const { t } = useLoop(playing, 4200, playing ? 0 : 0.9, phase);
  const drop = easeOut(span(t, 0.12, 0.5));
  const settle = easeInOut(span(t, 0.48, 0.62));
  const sag = lerp(0, 1, settle);
  return (
    <Scene
      label="Cling film laid loosely over the burned hand"
      caption="Lay cling film over the burn"
      sub="Loosely, don’t wrap it tight"
    >
      <Table y={171} />
      {/* cling film roll */}
      <rect x="24" y="132" width="96" height="30" rx="5" fill="#DCE6EE" stroke="#B4C3D0" strokeWidth="2" />
      <rect x="30" y="137" width="84" height="8" rx="3" fill="#C4D7E6" />
      <BurnArm burn={0.75} />
      <g transform={`translate(0 ${lerp(-110, 0, drop)})`} opacity={clamp01(drop * 3)}>
        <path
          d={`M196 ${lerp(140, 171, sag)} C198 ${lerp(138, 150, sag)} 210 ${lerp(136, 139, sag)} 236 ${lerp(136, 138, sag)} C262 ${lerp(136, 137, sag)} 284 ${lerp(136, 140, sag)} 302 ${lerp(138, 143, sag)} C314 ${lerp(140, 146, sag)} 318 ${lerp(142, 160, sag)} 318 ${lerp(144, 171, sag)}`}
          fill="rgba(170, 215, 248, 0.5)"
          stroke="rgba(80, 150, 205, 0.95)"
          strokeWidth="2.2"
        />
        <path
          d={`M214 ${lerp(140, 144, sag)} q20 -3 40 -2`}
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
      </g>
    </Scene>
  );
}

/** Step 4: nothing on the burn. */
function NothingScene({ playing, phase }) {
  const { t } = useLoop(playing, 4600, playing ? 0 : 0.95, phase);
  const pop = (a) => span(t, a, a + 0.12);
  return (
    <Scene label="Ice, butter, toothpaste and oil each crossed out" caption="Nothing on the burn" sub="And don’t pop blisters">
      <Table y={196} />
      <BurnArm dx={-30} dy={26} burn={0.7} />
      <NoSign c={[56, 108]} r={26} pop={pop(0.06)} label="Ice">
        <rect
          x="-11"
          y="-11"
          width="22"
          height="22"
          rx="4"
          fill="#DCEFFC"
          stroke="#8CC3EA"
          strokeWidth="2"
          transform="rotate(10)"
        />
      </NoSign>
      <NoSign c={[146, 108]} r={26} pop={pop(0.22)} label="Butter">
        <rect x="-14" y="-6" width="28" height="14" rx="2" fill="#F2CF62" />
        <path d="M-14 -6 L-8 -12 H18 L14 -6 Z" fill="#F8E197" />
      </NoSign>
      <NoSign c={[236, 108]} r={26} pop={pop(0.38)} label="Toothpaste">
        <path d="M-16 6 L6 6 L12 0 L6 -6 L-16 -6 Z" fill="#EEF3F8" stroke="#9FB0C0" strokeWidth="1.5" />
        <rect x="12" y="-3" width="6" height="6" rx="1" fill="#3A7BD5" />
        <line x1="-12" y1="0" x2="2" y2="0" stroke="#3A7BD5" strokeWidth="2" />
      </NoSign>
      <NoSign c={[326, 108]} r={26} pop={pop(0.54)} label="Oil">
        <rect x="-8" y="-6" width="16" height="20" rx="4" fill="#E9B949" />
        <rect x="-3" y="-13" width="6" height="8" fill="#E9B949" />
        <rect x="-4" y="-17" width="8" height="4" rx="1" fill="#5A4632" />
      </NoSign>
    </Scene>
  );
}

/** Step 5: when to get medical help. */
function HelpScene({ playing, phase, number }) {
  const { ms } = useLoop(playing, 3600, 0, phase);
  const k = (ms % 1300) / 1300;
  const rings = [
    [110, 52, 20],
    [78, 166, 13],
    [142, 166, 13],
    [96, 233, 12],
    [124, 233, 12],
  ];
  return (
    <Scene
      label="Burns on the face, hands or feet, large burns, and burns on children need medical help"
      caption="Get medical help if it’s serious"
    >
      <rect x="0" y="236" width="400" height="14" fill="var(--em-floor)" />
      <g transform="translate(6 18) scale(0.93)">
        <StandingFront cx={110} />
        {rings.map(([x, y, r]) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={r * (1 + 0.3 * k)}
            fill="none"
            stroke={C.red}
            strokeWidth="3"
            opacity={1 - k}
          />
        ))}
        {rings.map(([x, y]) => (
          <circle key={`d${x}-${y}`} cx={x} cy={y} r="3.5" fill={C.red} />
        ))}
      </g>
      <Phone at={[300, 104]} number={number} ms={ms} size={1.2} />
      <g className="em-scene-text em-scene-text--small">
        <text x="214" y="178">
          Face, hands, feet, genitals
        </text>
        <text x="214" y="196">
          Bigger than their palm
        </text>
        <text x="214" y="214">
          Chemical or electrical
        </text>
        <text x="214" y="232">
          Any burn on a child
        </text>
      </g>
    </Scene>
  );
}

export function BurnsAnim({ playing, step = 1, phase, number = '112' }) {
  const scenes = [StopScene, CoolScene, CoverScene, NothingScene, HelpScene];
  const S = scenes[step] || CoolScene;
  return <S playing={playing} phase={phase} number={number} />;
}
