import { useEffect, useState } from 'react'
import AuthPage from './pages/AuthPage'
import { clearTokens, isAuthenticated } from './utils/tokenStorage'

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated())

  useEffect(() => {
    const syncAuth = () => setAuthenticated(isAuthenticated())
    window.addEventListener('storage', syncAuth)

    return () => {
      window.removeEventListener('storage', syncAuth)
    }
  }, [])

  const handleLogout = () => {
    clearTokens()
    setAuthenticated(false)
  }

  const handleAuthSuccess = () => {
    setAuthenticated(true)
  }

  if (!authenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div style={{ padding: 40 }}>
      <div>App Loaded (Authenticated)</div>
      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}

export default App
