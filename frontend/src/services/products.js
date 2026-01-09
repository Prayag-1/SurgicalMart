import { apiRequest, buildQueryString } from './apiClient'

const useJsonForPayload = (payload) => !(typeof FormData !== 'undefined' && payload instanceof FormData)

const sanitizePayload = (payload) => {
  if (typeof FormData !== 'undefined' && payload instanceof FormData) {
    return payload
  }
  const cleaned = {}
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined) return
    if (value === '') {
      cleaned[key] = null
      return
    }
    cleaned[key] = value
  })
  return cleaned
}

export const fetchProducts = async (params = {}) =>
  apiRequest(`/api/admin/products/${buildQueryString(params)}`, { method: 'GET' })

export const fetchProduct = async (id) => apiRequest(`/api/admin/products/${id}/`, { method: 'GET' })

export const createProduct = async (payload) =>
  apiRequest(`/api/admin/products/`, {
    method: 'POST',
    body: sanitizePayload(payload),
    useJson: useJsonForPayload(payload),
  })

export const updateProduct = async (id, payload) =>
  apiRequest(`/api/admin/products/${id}/`, {
    method: 'PATCH',
    body: sanitizePayload(payload),
    useJson: useJsonForPayload(payload),
  })

export const updateProductStock = async (id, stock) =>
  apiRequest(`/api/admin/products/${id}/stock/`, { method: 'PATCH', body: { stock } })

export const toggleProductActive = async (id) =>
  apiRequest(`/api/admin/products/${id}/toggle/`, { method: 'PATCH' })
