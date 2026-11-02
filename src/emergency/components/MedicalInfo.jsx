import { Phone, Stethoscope } from 'lucide-react';
import Section, { Block } from './Section';
import { healthPolicies } from '../healthInsurance';
import { formatDay, isPastDay, severityTone, telHref } from '../utils';

/** Section 3 */
export default function MedicalInfo({ medical = {}, profile = {} }) {
  const { allergies = [], conditions = [], medications = [], doctor = {} } = medical;
  const policies = healthPolicies(medical);
  // What a screen reader's links list says for each Call helpline: the policy, by insurer and type,
  // and its place when two policies would still sound the same.
  const callNames = policies.map((p) => ['health insurance', p.provider, p.type].filter(Boolean).join(', '));
  const callName = (i) => (callNames.filter((n) => n === callNames[i]).length > 1 ? `${callNames[i]}, policy ${i + 1}` : callNames[i]);

  return (
    <Section id="em-medical" title="Medical info" icon={Stethoscope}>
      <dl className="em-vitals">
        <div>
          <dt>Blood group</dt>
          <dd>{profile.bloodGroup || 'Not set'}</dd>
        </div>
        <div>
          <dt>Height</dt>
          <dd>{medical.height || 'Not set'}</dd>
        </div>
        <div>
          <dt>Weight</dt>
          <dd>{medical.weight || 'Not set'}</dd>
        </div>
      </dl>

      <Block title="Allergies">
        {allergies.length ? (
          <ul className="em-rows">
            {allergies.map((a, i) => (
              <li key={`${a.name}-${i}`}>
                <div>
                  <strong>{a.name}</strong>
                  {a.reaction && <span className="em-sub">{a.reaction}</span>}
                </div>
                <span className={`em-pill em-pill--${severityTone(a.severity)}`}>{a.severity || 'Severity unknown'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="em-empty">No known allergies</p>
        )}
      </Block>

      <Block title="Conditions">
        {conditions.length ? (
          <ul className="em-chips">
            {conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ) : (
          <p className="em-empty">None listed</p>
        )}
      </Block>

      <Block title="Medications">
        {medications.length ? (
          <ul className="em-rows">
            {medications.map((m, i) => (
              <li key={`${m.name}-${i}`}>
                <div>
                  <strong>{m.name}</strong>
                  <span className="em-sub em-sub--split">
                    {m.dose && <span>{m.dose}</span>}
                    {m.frequency && <span>{m.frequency}</span>}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="em-empty">No regular medication</p>
        )}
      </Block>

      {medical.devices && (
        <Block title="Devices and implants">
          <p className="em-plain">{medical.devices}</p>
        </Block>
      )}

      {(doctor.name || policies.length > 0) && (
        <div className="em-split">
          {doctor.name && (
            <Block title="Doctor">
              <div className="em-card">
                <strong>{doctor.name}</strong>
                {doctor.hospital && <span className="em-sub">{doctor.hospital}</span>}
                {doctor.phone && (
                  <a className="em-btn" href={telHref(doctor.phone)}>
                    <Phone aria-hidden="true" /> Call doctor
                  </a>
                )}
              </div>
            </Block>
          )}
          {policies.length > 0 && (
            <Block title="Health insurance">
              <div className="em-cards">
                {policies.map((p, i) => (
                  <div key={i} className="em-card em-policy">
                    <div className="em-policy__head">
                      <strong>{p.provider || 'Health insurance'}</strong>
                      {p.type && <span className="em-pill">{p.type}</span>}
                    </div>
                    {(p.policyNumber || p.memberId || p.validUntil) && (
                      <span className="em-sub em-sub--split">
                        {p.policyNumber && <span>Policy {p.policyNumber}</span>}
                        {p.memberId && <span>Member ID {p.memberId}</span>}
                        {p.validUntil &&
                          (isPastDay(p.validUntil) ? (
                            <span className="em-policy__expired">Expired {formatDay(p.validUntil)}</span>
                          ) : (
                            <span>Valid until {formatDay(p.validUntil)}</span>
                          ))}
                      </span>
                    )}
                    {p.phone && (
                      <a className="em-btn" href={telHref(p.phone)}>
                        <Phone aria-hidden="true" /> Call helpline
                        <span className="em-sr-only"> ({callName(i)})</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Block>
          )}
        </div>
      )}

      {medical.notes && (
        <Block title="Notes for responders">
          <p className="em-note">{medical.notes}</p>
        </Block>
      )}
    </Section>
  );
}
