import { Car } from 'lucide-react';
import Section from './Section';

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
                {v.insurer && (
                  <div>
                    <dt>Insurer</dt>
                    <dd>{v.insurer}</dd>
                  </div>
                )}
                {v.policyNumber && (
                  <div>
                    <dt>Policy</dt>
                    <dd>{v.policyNumber}</dd>
                  </div>
                )}
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
