import { apiRequest } from './apiClient'

export const fetchDashboard = async () => apiRequest(`/api/admin/dashboard/`, { method: 'GET' })
