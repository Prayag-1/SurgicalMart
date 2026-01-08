import { clearTokens } from '../utils/tokenStorage'
import { BASE_URL } from './apiClient'

export const login = async (email, password) => {
  const response = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: email,
      email,
      password,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const detail = errorBody.detail || 'Invalid credentials'
    throw new Error(detail)
  }

  const data = await response.json()
  const { access, refresh } = data
  return { access, refresh }
}

export const logout = () => {
  clearTokens()
}
