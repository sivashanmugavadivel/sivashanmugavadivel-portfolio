import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Cross, Pause, Phone, Play, TriangleAlert, Volume2, VolumeX } from 'lucide-react';
import Section from './Section';
import { ANIMATIONS } from './firstaid/index.js'; // not './firstaid': on Windows and macOS that resolves to this file
import { FIRST_AID } from '../firstAidData';
import { useMetronome, usePrefersReducedMotion } from '../hooks';
import { telHref } from '../utils';

const CPR_BPM = 110;

/** Section 6 */
export default function FirstAid({ emergencyNumber = '112' }) {
  const reducedMotion = usePrefersReducedMotion();
  const [topicId, setTopicId] = useState(FIRST_AID[0].id);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(!reducedMotion);
  const [beatOn, setBeatOn] = useState(false);
  const [count, setCount] = useState(0);

  const topic = FIRST_AID.find((t) => t.id === topicId) || FIRST_AID[0];
  const Anim = ANIMATIONS[topic.anim];
  const lastStep = topic.steps.length - 1;
  // Clamped here, not reset in an effect: a topic with fewer steps must never be read at the old index.
  const shown = Math.min(step, lastStep);
  const current = topic.steps[shown];
  // Steps say {number} so they always name the number this page calls.
  const fill = (text) => text?.replaceAll('{number}', emergencyNumber);

  const onBeat = useCallback(() => setCount((c) => (c % 30) + 1), []);
  useMetronome(beatOn && topic.metronome, CPR_BPM, onBeat);

  const selectTopic = (id) => {
    if (id === topicId) return; // re-tapping the open tab mustn't stop the beat mid-CPR
    setTopicId(id);
    setStep(0);
    setBeatOn(false);
    setCount(0);
  };

  return (
    <Section id="em-firstaid" title="First aid guidance" icon={Cross}>
      <div className="em-callout">
        <p>Call {emergencyNumber} first, then follow the steps.</p>
        <a className="em-btn em-btn--red" href={telHref(emergencyNumber)}>
          <Phone aria-hidden="true" /> Call {emergencyNumber}
        </a>
      </div>

      <div className="em-topics" role="tablist" aria-label="First aid topics">
        {FIRST_AID.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`em-tab-${t.id}`}
            aria-selected={t.id === topicId}
            aria-controls="em-aid-panel"
            onClick={() => selectTopic(t.id)}
          >
            <strong>{t.title}</strong>
            <span>{t.when}</span>
          </button>
        ))}
      </div>

      <div id="em-aid-panel" role="tabpanel" aria-labelledby={`em-tab-${topic.id}`} className="em-aid">
        <div className="em-anim">
          {Anim && <Anim key={`${topic.id}-${shown}`} playing={playing} step={shown} number={emergencyNumber} />}
          <div className="em-anim__controls">
            <button type="button" className="em-btn em-btn--quiet" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {playing ? 'Pause' : 'Play'}
            </button>
            {topic.metronome && (
              <button type="button" className="em-btn em-btn--quiet" onClick={() => setBeatOn((b) => !b)} aria-pressed={beatOn}>
                {beatOn ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                {beatOn ? 'Stop beat' : `Beat at ${CPR_BPM} a minute`}
              </button>
            )}
            {beatOn && topic.metronome && (
              <span className="em-beat" aria-hidden="true">
                {count}
                <small>/30</small>
              </span>
            )}
          </div>
        </div>

        <div className="em-steps">
          <div className="em-step-current" aria-live="polite">
            <span className="em-step-current__n">
              Step {shown + 1} of {topic.steps.length}
            </span>
            <h3>{fill(current.title)}</h3>
            <p>{fill(current.detail)}</p>
          </div>
          <div className="em-step-nav">
            <button type="button" className="em-btn" disabled={shown === 0} onClick={() => setStep(shown - 1)}>
              <ChevronLeft aria-hidden="true" /> Back
            </button>
            <button
              type="button"
              className="em-btn em-btn--solid"
              disabled={shown === lastStep}
              onClick={() => setStep(shown + 1)}
            >
              Next step <ChevronRight aria-hidden="true" />
            </button>
          </div>
          <ol className="em-steplist">
            {topic.steps.map((s, i) => (
              <li key={s.title} className={i === shown ? 'is-current' : undefined}>
                <button type="button" onClick={() => setStep(i)} aria-current={i === shown ? 'step' : undefined}>
                  <span>{i + 1}</span>
                  {fill(s.title)}
                </button>
              </li>
            ))}
          </ol>
          {topic.caution && (
            <p className="em-caution">
              <TriangleAlert aria-hidden="true" />
              <span>{fill(topic.caution)}</span>
            </p>
          )}
        </div>
      </div>
      <p className="em-fineprint">A reminder, not a substitute for training. Follow what the emergency operator tells you.</p>
    </Section>
  );
}
