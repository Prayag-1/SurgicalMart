import { getAccessToken, clearTokens } from '../utils/tokenStorage'

const BASE_URL = 'http://127.0.0.1:8000'

const authHeaders = () => {
  const token = getAccessToken()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

const handleResponse = async (response) => {
  const payload = await response.json().catch(() => ({}))

  if (response.status === 401 || response.status === 403) {
    clearTokens()
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const detail = payload.detail || 'Something went wrong'
    throw new Error(detail)
  }

  return payload
}

export const fetchOrders = async () => {
  const response = await fetch(`${BASE_URL}/api/admin/orders/`, {
    method: 'GET',
    headers: authHeaders(),
  })

  const payload = await handleResponse(response)
  if (Array.isArray(payload)) {
    return payload
  }
  if (Array.isArray(payload?.results)) {
    return payload.results
  }
  return []
}

export const fetchOrderDetail = async (orderId) => {
  const response = await fetch(`${BASE_URL}/api/admin/orders/${orderId}/`, {
    method: 'GET',
    headers: authHeaders(),
  })

  return handleResponse(response)
}

export const updateOrderStatus = async (orderId, status) => {
  const response = await fetch(`${BASE_URL}/api/admin/orders/${orderId}/status/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  })

  return handleResponse(response)
}
