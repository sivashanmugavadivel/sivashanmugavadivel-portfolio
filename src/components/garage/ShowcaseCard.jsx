import { CARD, BD } from './showcaseTokens'

/** Dark panel shell used by every showcase section. */
export default function ShowcaseCard({ children, style: sx, pad = true }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 16, overflow: 'hidden', padding: pad ? 24 : 0, ...sx }}>
      {children}
    </div>
  )
}
