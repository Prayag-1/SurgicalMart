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

const authHeaders = () => ({
  Authorization: `Bearer ${getTokenOrThrow()}`,
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

const toQueryString = (params = {}) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.append(key, value)
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const fetchCategoryTree = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/categories/tree/`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export const fetchCategories = async (params = {}) => {
  const res = await fetch(`${BASE_URL}/api/admin/categories/${toQueryString(params)}`, {
    method: 'GET',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  })
  return handleResponse(res)
}

export const fetchCategory = async (id) => {
  const res = await fetch(`${BASE_URL}/api/admin/categories/${id}/`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export const createCategory = async (payload) => {
  const res = await fetch(`${BASE_URL}/api/admin/categories/`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export const updateCategory = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/api/admin/categories/${id}/`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export const deleteCategory = async (id) => {
  const res = await fetch(`${BASE_URL}/api/admin/categories/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (res.status === 204) return true
  return handleResponse(res)
}
