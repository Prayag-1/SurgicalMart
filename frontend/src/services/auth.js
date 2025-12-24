import { clearTokens } from '../utils/tokenStorage'

const BASE_URL = 'http://127.0.0.1:8000'

export const login = async (email, password) => {
  const response = await fetch(`${BASE_URL}/api/admin/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: email,
      password,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const detail = errorBody.detail || 'Login failed'
    throw new Error(detail)
  }

  const data = await response.json()
  const { access, refresh } = data
  return { access, refresh }
}

export const register = async (email, password) => {
  const response = await fetch(`${BASE_URL}/api/shop/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const detail = errorBody.detail || 'Registration failed'
    throw new Error(detail)
  }

  return response.json()
}

export const logout = () => {
  clearTokens()
}
