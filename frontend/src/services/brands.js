import { apiRequest, buildQueryString } from './apiClient'

const useJsonForPayload = (payload) => !(typeof FormData !== 'undefined' && payload instanceof FormData)

export const fetchBrands = async (params = {}) =>
  apiRequest(`/api/admin/brands/${buildQueryString(params)}`, { method: 'GET' })

export const fetchBrand = async (id) => apiRequest(`/api/admin/brands/${id}/`, { method: 'GET' })

export const createBrand = async (payload) =>
  apiRequest(`/api/admin/brands/`, {
    method: 'POST',
    body: payload,
    useJson: useJsonForPayload(payload),
  })

export const updateBrand = async (id, payload) =>
  apiRequest(`/api/admin/brands/${id}/`, {
    method: 'PATCH',
    body: payload,
    useJson: useJsonForPayload(payload),
  })

export const deleteBrand = async (id) => {
  const res = await apiRequest(`/api/admin/brands/${id}/`, { method: 'DELETE' })
  return res ?? true
}
