import { Car, Phone } from 'lucide-react';
import Section from './Section';
import { formatDay, isPastDay, telHref } from '../utils';
import { vehicleCovers } from '../vehicles';

/** Section 7 */
export default function VehicleInfo({ vehicles = [] }) {
  const list = vehicles.filter((v) => v.plate || v.make || v.model);
  return (
    <Section id="em-vehicle" title={list.length > 1 ? 'Vehicles' : 'Vehicle'} icon={Car}>
      {list.length === 0 ? (
        <p className="em-empty">No vehicle added</p>
      ) : (
        <div className="em-vehicles">
          {list.map((v, i) => (
            <article key={`${v.plate}-${i}`} className="em-vehicle">
              {v.plate && (
                <div className="em-plate" aria-label={`Registration number ${v.plate}`}>
                  {v.country && (
                    <span className="em-plate__country" aria-hidden="true">
                      {v.country}
                    </span>
                  )}
                  <span className="em-plate__num">{v.plate}</span>
                </div>
              )}
              <dl className="em-details">
                <div>
                  <dt>Vehicle</dt>
                  <dd>
                    {[v.color, v.make, v.model].filter(Boolean).join(' ')}
                    {v.type && ` (${v.type.toLowerCase()})`}
                  </dd>
                </div>
                {vehicleCovers(v).map((c) => (
                  <div key={c.key}>
                    <dt>{c.label}</dt>
                    <dd className="em-cover">
                      {c.insurer && <span>{c.insurer}</span>}
                      {(c.both || c.policyNumber || c.validUntil) && (
                        <span className="em-sub em-sub--split">
                          {c.both && <span>Third-party and own damage</span>}
                          {c.policyNumber && <span>Policy {c.policyNumber}</span>}
                          {c.validUntil &&
                            (isPastDay(c.validUntil) ? (
                              <span className="em-cover__expired">Expired {formatDay(c.validUntil)}</span>
                            ) : (
                              <span>Valid until {formatDay(c.validUntil)}</span>
                            ))}
                        </span>
                      )}
                      {c.phone && (
                        <a className="em-btn em-cover__call" href={telHref(c.phone)}>
                          <Phone aria-hidden="true" /> Call insurer
                          <span className="em-sr-only"> ({c.both ? 'vehicle insurance' : c.label.toLowerCase()})</span>
                        </a>
                      )}
                    </dd>
                  </div>
                ))}
                {v.notes && (
                  <div>
                    <dt>Notes</dt>
                    <dd>{v.notes}</dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
