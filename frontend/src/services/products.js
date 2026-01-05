import { clearTokens, getAccessToken } from '../utils/tokenStorage'

const BASE_URL = 'http://127.0.0.1:8000'

const getTokenOrThrow = () => {
  const token = getAccessToken()
  if (!token) {
    clearTokens()
    throw new Error('Unauthorized. Please log in again.')
  }
  return token
}

const authHeaders = (useJson = true) => {
  const headers = {
    Authorization: `Bearer ${getTokenOrThrow()}`,
  }
  if (useJson) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

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

const toQueryString = (params = {}) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.append(key, value)
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const fetchProducts = async (params = {}) => {
  const response = await fetch(`${BASE_URL}/api/admin/products/${toQueryString(params)}`, {
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

export const createProduct = async (payload) => {
  const isForm = typeof FormData !== 'undefined' && payload instanceof FormData
  const response = await fetch(`${BASE_URL}/api/admin/products/`, {
    method: 'POST',
    headers: authHeaders(!isForm),
    body: isForm ? payload : JSON.stringify(payload),
  })

  return handleResponse(response)
}

export const updateProduct = async (id, payload) => {
  const isForm = typeof FormData !== 'undefined' && payload instanceof FormData
  const response = await fetch(`${BASE_URL}/api/admin/products/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(!isForm),
    body: isForm ? payload : JSON.stringify(payload),
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
