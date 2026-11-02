import { Globe, UserRound } from 'lucide-react';
import Section from './Section';

/** Section 8 */
export default function AboutMe({ about = {}, name, updatedAt }) {
  const links = [
    about.website && { label: 'Website', href: about.website },
    about.linkedin && { label: 'LinkedIn', href: about.linkedin },
    about.github && { label: 'GitHub', href: about.github },
  ].filter(Boolean);

  return (
    <Section id="em-about" title={`About ${name ? name.split(' ')[0] : 'me'}`} icon={UserRound}>
      <div className="em-about">
        {about.headline && <p className="em-about__headline">{about.headline}</p>}
        {about.bio && <p className="em-about__bio">{about.bio}</p>}
        {(about.occupation || about.employer) && (
          <dl className="em-details">
            {about.occupation && (
              <div>
                <dt>Work</dt>
                <dd>{about.occupation}</dd>
              </div>
            )}
            {about.employer && (
              <div>
                <dt>Employer</dt>
                <dd>{about.employer}</dd>
              </div>
            )}
          </dl>
        )}
        {links.length > 0 && (
          <div className="em-links">
            {links.map((l) => (
              <a key={l.label} className="em-btn" href={l.href} target="_blank" rel="noreferrer">
                <Globe aria-hidden="true" /> {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
      {updatedAt && (
        <p className="em-updated">
          Details last updated{' '}
          {new Date(updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}
    </Section>
  );
}
