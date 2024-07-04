export default function Home() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#333' }}>Welcome to Operation Tracker</h1>
      <p style={{ color: '#666' }}>This is a Next.js page created directly on GitHub.</p>
      <p style={{ color: '#999' }}>Current time: {new Date().toLocaleString()}</p>
    </div>
  )
}
