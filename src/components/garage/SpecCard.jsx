export default function SpecCard({ label, value, unit, icon }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent)20' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {icon && <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>}
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-h)', lineHeight: 1.2 }}>
          {value}
          {unit && <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text)', marginLeft: 4 }}>{unit}</span>}
        </div>
      </div>
    </div>
  )
}
