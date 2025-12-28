import { clearTokens, getAccessToken } from '../utils/tokenStorage'

const BASE_URL = 'http://127.0.0.1:8000'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAccessToken()}`,
})

const handleResponse = async (response) => {
  const payload = await response.json().catch(() => ({}))

  if (response.status === 401 || response.status === 403) {
    clearTokens()
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const detail = payload.detail || 'Unable to load dashboard'
    throw new Error(detail)
  }

  return payload
}

export const fetchDashboard = async () => {
  const response = await fetch(`${BASE_URL}/api/admin/dashboard/`, {
    method: 'GET',
    headers: authHeaders(),
  })

  return handleResponse(response)
}
