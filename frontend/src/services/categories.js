import { apiRequest, buildQueryString } from './apiClient'

export const fetchCategoryTree = async () =>
  apiRequest(`/api/admin/categories/tree/`, { method: 'GET' })

export const fetchCategories = async (params = {}) =>
  apiRequest(`/api/admin/categories/${buildQueryString(params)}`, { method: 'GET' })

export const fetchCategory = async (id) =>
  apiRequest(`/api/admin/categories/${id}/`, { method: 'GET' })

export const createCategory = async (payload) =>
  apiRequest(`/api/admin/categories/`, { method: 'POST', body: payload })

export const updateCategory = async (id, payload) =>
  apiRequest(`/api/admin/categories/${id}/`, { method: 'PATCH', body: payload })

export const deleteCategory = async (id) => {
  const res = await apiRequest(`/api/admin/categories/${id}/`, { method: 'DELETE' })
  return res ?? true
}
