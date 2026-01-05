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

export const fetchBrands = async (params = {}) => {
  const res = await fetch(`${BASE_URL}/api/admin/brands/${toQueryString(params)}`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export const fetchBrand = async (id) => {
  const res = await fetch(`${BASE_URL}/api/admin/brands/${id}/`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export const createBrand = async (payload) => {
  const isForm = typeof FormData !== 'undefined' && payload instanceof FormData
  const res = await fetch(`${BASE_URL}/api/admin/brands/`, {
    method: 'POST',
    headers: authHeaders(!isForm),
    body: isForm ? payload : JSON.stringify(payload),
  })
  return handleResponse(res)
}

export const updateBrand = async (id, payload) => {
  const isForm = typeof FormData !== 'undefined' && payload instanceof FormData
  const res = await fetch(`${BASE_URL}/api/admin/brands/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(!isForm),
    body: isForm ? payload : JSON.stringify(payload),
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
