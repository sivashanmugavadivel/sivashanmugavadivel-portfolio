import { HeartHandshake, MapPin, TriangleAlert } from 'lucide-react';
import { ageFrom, initials, severityTone } from '../utils';

/** Section 1: who this is, plus the facts a responder needs in the first few seconds. */
export default function ProfileHeader({ profile = {}, medical = {} }) {
  const age = ageFrom(profile.dob);
  const allergies = (medical.allergies || []).filter((a) => a.name);
  const conditions = (medical.conditions || []).filter(Boolean);

  return (
    <section id="em-profile" className="em-hero" aria-labelledby="em-profile-title">
      {profile.criticalNote && (
        <div className="em-band" role="note">
          <TriangleAlert aria-hidden="true" />
          <p>{profile.criticalNote}</p>
        </div>
      )}

      <div className="em-hero__body">
        <div className="em-hero__id">
          <div className="em-avatar">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={`Photo of ${profile.name}`} />
            ) : (
              <span aria-hidden="true">{initials(profile.name)}</span>
            )}
          </div>
          <div className="em-hero__who">
            <h1 id="em-profile-title" className="em-hero__name">
              {profile.name || 'Name not set'}
            </h1>
            <dl className="em-facts">
              {age != null && (
                <div>
                  <dt>Age</dt>
                  <dd>{age}</dd>
                </div>
              )}
              {profile.gender && (
                <div>
                  <dt>Gender</dt>
                  <dd>{profile.gender}</dd>
                </div>
              )}
              {profile.languages?.length > 0 && (
                <div>
                  <dt>Speaks</dt>
                  <dd>{profile.languages.join(', ')}</dd>
                </div>
              )}
            </dl>
          </div>
          {profile.bloodGroup && (
            <div className="em-blood">
              <span className="em-blood__label">Blood group</span>
              <strong className="em-blood__value">{profile.bloodGroup}</strong>
            </div>
          )}
        </div>

        {(allergies.length > 0 || conditions.length > 0 || profile.organDonor) && (
          <ul className="em-flags" aria-label="Key medical facts">
            {allergies.map((a) => (
              <li key={`a-${a.name}`} className={`em-flag em-flag--${severityTone(a.severity)}`}>
                Allergic to {a.name}
              </li>
            ))}
            {conditions.map((c) => (
              <li key={`c-${c}`} className="em-flag">
                {c}
              </li>
            ))}
            {profile.organDonor && (
              <li className="em-flag em-flag--green">
                <HeartHandshake aria-hidden="true" /> Organ donor
              </li>
            )}
          </ul>
        )}

        {profile.address && (
          <p className="em-hero__address">
            <MapPin aria-hidden="true" />
            <span>{profile.address}</span>
          </p>
        )}
      </div>
    </section>
  );
}
