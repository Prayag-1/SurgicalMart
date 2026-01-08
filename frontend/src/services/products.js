import { apiRequest, buildQueryString } from './apiClient'

const useJsonForPayload = (payload) => !(typeof FormData !== 'undefined' && payload instanceof FormData)

export const fetchProducts = async (params = {}) =>
  apiRequest(`/api/admin/products/${buildQueryString(params)}`, { method: 'GET' })

export const fetchProduct = async (id) => apiRequest(`/api/admin/products/${id}/`, { method: 'GET' })

export const createProduct = async (payload) =>
  apiRequest(`/api/admin/products/`, {
    method: 'POST',
    body: payload,
    useJson: useJsonForPayload(payload),
  })

export const updateProduct = async (id, payload) =>
  apiRequest(`/api/admin/products/${id}/`, {
    method: 'PATCH',
    body: payload,
    useJson: useJsonForPayload(payload),
  })

export const updateProductStock = async (id, stock) =>
  apiRequest(`/api/admin/products/${id}/stock/`, { method: 'PATCH', body: { stock } })

export const toggleProductActive = async (id) =>
  apiRequest(`/api/admin/products/${id}/toggle/`, { method: 'PATCH' })
