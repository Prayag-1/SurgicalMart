import { useEffect, useState } from 'react'
import { logout as authLogout } from '../services/auth'
import { isAuthenticated as checkAuthenticated } from '../utils/tokenStorage'

const useAuth = () => {
  const [authenticated, setAuthenticated] = useState(checkAuthenticated())

  useEffect(() => {
    const syncAuthState = () => setAuthenticated(checkAuthenticated())
    window.addEventListener('storage', syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
    }
  }, [])

  const logout = () => {
    authLogout()
    setAuthenticated(false)
  }

  return {
    isAuthenticated: authenticated,
    logout,
  }
}

export default useAuth

