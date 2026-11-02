export default function Section({ id, title, icon: Icon, action, children }) {
  return (
    <section id={id} className="em-section" aria-labelledby={`${id}-title`}>
      <div className="em-section__head">
        <h2 id={`${id}-title`} className="em-section__title">
          {Icon && <Icon className="em-section__icon" aria-hidden="true" />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Block({ title, children, className = '' }) {
  return (
    <div className={`em-block ${className}`}>
      <h3 className="em-block__title">{title}</h3>
      {children}
    </div>
  );
}
