import { apiRequest } from './apiClient'

export const getSettings = async () => apiRequest(`/api/admin/settings/`, { method: 'GET' })

export const updateSettings = async (payload) =>
  apiRequest(`/api/admin/settings/`, { method: 'PATCH', body: payload })

export const getHomepageSettings = async () =>
  apiRequest(`/api/admin/settings/homepage/`, { method: 'GET' })

export const updateHomepageSettings = async (payload) =>
  apiRequest(`/api/admin/settings/homepage/`, { method: 'PATCH', body: payload })

const useJsonForPayload = (payload) => !(typeof FormData !== 'undefined' && payload instanceof FormData)

export const fetchSlides = async () => apiRequest(`/api/admin/settings/slides/`, { method: 'GET' })

export const createSlide = async (payload) =>
  apiRequest(`/api/admin/settings/slides/`, {
    method: 'POST',
    body: payload,
    useJson: useJsonForPayload(payload),
  })

export const updateSlide = async (id, payload) =>
  apiRequest(`/api/admin/settings/slides/${id}/`, {
    method: 'PATCH',
    body: payload,
    useJson: useJsonForPayload(payload),
  })

export const deleteSlide = async (id) => apiRequest(`/api/admin/settings/slides/${id}/`, { method: 'DELETE' })
