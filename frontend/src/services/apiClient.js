import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from '../utils/tokenStorage'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export class ApiError extends Error {
  constructor(message, status, payload = {}, isUnauthorized = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
    this.fields = payload
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

const refreshAccessToken = async () => {
  const refresh = getRefreshToken()
  if (!refresh) return null

  const response = await fetch(`${BASE_URL}/api/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })

  if (!response.ok) {
    clearTokens()
    return null
  }

  const data = await response.json().catch(() => ({}))
  if (data.access) {
    setAccessToken(data.access)
    return data.access
  }

  clearTokens()
  return null
}

const isUnauthorizedStatus = (status) => status === 401 || status === 403

export const apiRequest = async (
  path,
  { method = 'GET', body = undefined, headers = {}, useJson = true, requireAuth = true, raw = false } = {},
) => {
  const serializedBody = serializeBody(body, useJson)
  let accessToken = getAccessToken()

  if (requireAuth && !accessToken) {
    accessToken = await refreshAccessToken()
    if (!accessToken) {
      throw new ApiError('Unauthorized. Please log in again.', 401, {}, true)
    }
  }

  const doFetch = async (token) => {
    const finalHeaders = {
      ...(useJson && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(requireAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    }

    return fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: serializedBody,
    })
  }

  let response = await doFetch(accessToken)

  if (isUnauthorizedStatus(response.status) && requireAuth) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await doFetch(refreshed)
    }
  }

  if (raw) {
    if (isUnauthorizedStatus(response.status) && requireAuth) {
      throw new ApiError('Unauthorized. Please log in again.', response.status, {}, true)
    }
    if (!response.ok) {
      const rawPayload = await response
        .clone()
        .json()
        .catch(() => ({}))
      throw new ApiError('Unable to complete the request', response.status, rawPayload, false)
    }
    return response
  }

  let payload = {}
  try {
    payload = await response.json()
  } catch {
    payload = {}
  }

  if (isUnauthorizedStatus(response.status) && requireAuth) {
    clearTokens()
    throw new ApiError(payload.detail || 'Unauthorized. Please log in again.', response.status, payload, true)
  }

  if (!response.ok) {
    const detail = payload.detail || payload.error || 'Unable to complete the request'
    throw new ApiError(detail, response.status, payload, false)
  }

  return payload
}
