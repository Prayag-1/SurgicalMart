import { clearTokens, getAccessToken } from '../utils/tokenStorage'

const BASE_URL = 'http://127.0.0.1:8000'

const authHeaders = () => ({
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

export const fetchBrands = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/brands/`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export const createBrand = async (payload) => {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value)
    }
  })

  const res = await fetch(`${BASE_URL}/api/admin/brands/`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  return handleResponse(res)
}

export const updateBrand = async (id, payload) => {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value)
    }
  })

  const res = await fetch(`${BASE_URL}/api/admin/brands/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: formData,
  })
  return handleResponse(res)
}

export const deleteBrand = async (id) => {
  const res = await fetch(`${BASE_URL}/api/admin/brands/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (res.status === 204) return true
  return handleResponse(res)
}
