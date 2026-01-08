import { apiRequest, buildQueryString, BASE_URL } from './apiClient'

export const fetchOrders = async (params = {}) => {
  const qs = buildQueryString(params)
  const payload = await apiRequest(`/api/admin/orders/${qs}`, { method: 'GET' })

  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export const fetchOrderDetail = async (orderId) =>
  apiRequest(`/api/admin/orders/${orderId}/`, { method: 'GET' })

export const updateOrderStatus = async (orderId, status, reason) =>
  apiRequest(`/api/admin/orders/${orderId}/status/`, {
    method: 'POST',
    body: { status, reason },
  })

export const addShipment = async (orderId, payload) =>
  apiRequest(`/api/admin/orders/${orderId}/shipment/`, { method: 'POST', body: payload })

export const markPaymentReceived = async (orderId) =>
  apiRequest(`/api/admin/orders/${orderId}/payment-received/`, { method: 'POST' })

export const fetchTimeline = async (orderId) =>
  apiRequest(`/api/admin/orders/${orderId}/timeline/`, { method: 'GET' })

export const generateInvoice = async (orderId) =>
  apiRequest(`/api/admin/orders/${orderId}/invoice/`, { method: 'POST' })

export const exportOrdersCsv = async (params = {}) => {
  const qs = buildQueryString(params)
  const response = await apiRequest(`/api/admin/orders/export/${qs}`, { method: 'GET', raw: true })
  if (!response.ok) {
    throw new Error('Unable to export orders')
  }
  const blob = await response.blob()
  const filename = response.headers.get('Content-Disposition')?.split('filename=')?.[1]?.replace(/"/g, '') || 'orders.csv'
  return { blob, filename }
}

export const getInvoiceDownloadUrl = (orderId) => `${BASE_URL}/api/admin/orders/${orderId}/invoice/?download=1`
