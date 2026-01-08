import { clearTokens, getAccessToken } from '../utils/tokenStorage'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export class ApiError extends Error {
  constructor(message, status, payload = {}, isUnauthorized = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
    this.code = isUnauthorized ? 'unauthorized' : payload.code || null
    this.isUnauthorized = isUnauthorized
  }
}

const serializeBody = (body, useJson) => {
  if (!body) return undefined
  if (body instanceof FormData) return body
  return useJson ? JSON.stringify(body) : body
}

export const buildQueryString = (params = {}) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.append(key, value)
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const apiRequest = async (
  path,
  { method = 'GET', body = undefined, headers = {}, useJson = true, requireAuth = true, raw = false } = {},
) => {
  const token = getAccessToken()

  if (requireAuth && !token) {
    clearTokens()
    throw new ApiError('Unauthorized. Please log in again.', 401, {}, true)
  }

  const finalHeaders = {
    ...(useJson && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(requireAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: serializeBody(body, useJson),
  })

  if (raw) {
    if (response.status === 401 || response.status === 403) {
      clearTokens()
      throw new ApiError('Unauthorized. Please log in again.', response.status, {}, true)
    }
    return response
  }

  let payload = {}
  try {
    payload = await response.json()
  } catch {
    payload = {}
  }

  if (response.status === 401 || response.status === 403) {
    clearTokens()
    throw new ApiError('Unauthorized. Please log in again.', response.status, payload, true)
  }

  if (!response.ok) {
    const detail = payload.detail || payload.error || 'Unable to complete the request'
    throw new ApiError(detail, response.status, payload, false)
  }

  return payload
}
