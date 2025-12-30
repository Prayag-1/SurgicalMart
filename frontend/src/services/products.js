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
    const detail = payload.detail || 'Unable to complete the request'
    const err = new Error(detail)
    err.fields = payload
    throw err
  }

  return payload
}

export const fetchProducts = async () => {
  const response = await fetch(`${BASE_URL}/api/admin/products/`, {
    method: 'GET',
    headers: authHeaders(),
  })

  return handleResponse(response)
}

export const fetchProduct = async (id) => {
  const response = await fetch(`${BASE_URL}/api/admin/products/${id}/`, {
    method: 'GET',
    headers: authHeaders(),
  })

  return handleResponse(response)
}

export const updateProduct = async (id, payload) => {
  const response = await fetch(`${BASE_URL}/api/admin/products/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })

  return handleResponse(response)
}

export const updateProductStock = async (id, stock) => {
  const response = await fetch(`${BASE_URL}/api/admin/products/${id}/stock/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ stock }),
  })

  return handleResponse(response)
}

export const toggleProductActive = async (id) => {
  const response = await fetch(`${BASE_URL}/api/admin/products/${id}/toggle/`, {
    method: 'PATCH',
    headers: authHeaders(),
  })

  return handleResponse(response)
}
