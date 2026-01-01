import { getAccessToken, clearTokens } from '../utils/tokenStorage'

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
    const detail = payload.detail || 'Unable to complete the request'
    const err = new Error(detail)
    err.fields = payload
    throw err
  }

  return payload
}

export const getSettings = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/settings/`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export const updateSettings = async (payload) => {
  const res = await fetch(`${BASE_URL}/api/admin/settings/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}
