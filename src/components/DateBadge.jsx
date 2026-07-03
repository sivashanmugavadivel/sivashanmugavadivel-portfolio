/*
 * DateBadge — a small desk-calendar style badge showing today's date in a given
 * timezone, styled after the Framer "Calendio" component: a blue card with a
 * thin frame + top band (for the clip rings) and a large frosted panel that
 * fades from light blue to dark, with a big white day number and grey month.
 */
export default function DateBadge({ timeZone = 'Asia/Kolkata' }) {
  const now = new Date()
  const fmt = (opts) => now.toLocaleDateString('en-US', { timeZone, ...opts })
  const day = fmt({ day: 'numeric' })
  const month = fmt({ month: 'short' }) // e.g. "Jul"

  const ring = (side) => ({
    position: 'absolute', top: -8, [side]: '34%',
    width: 9, height: 19, borderRadius: 5, background: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
  })

  return (
    <div style={{
      position: 'relative', width: 120, flexShrink: 0,
      background: '#2460ED', borderRadius: 22,
      // thin frame on sides/bottom, taller blue band on top for the clips
      padding: '20px 5px 5px',
      boxShadow: '0 14px 30px rgba(0,0,0,0.35)',
    }}>
      {/* Clip rings poking over the top edge */}
      <span style={ring('left')} />
      <span style={ring('right')} />

      <div style={{
        borderRadius: 18, padding: '20px 8px 16px', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.14) 42%, rgba(8,10,18,0.7) 100%)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      }}>
        <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1, color: '#fff' }}>{day}</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a8a8a8', marginTop: 10 }}>{month}</div>
      </div>
    </div>
  )
}
