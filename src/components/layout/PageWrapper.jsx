export default function PageWrapper({ children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
