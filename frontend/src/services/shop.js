import { BASE_URL } from './apiClient'

const jsonHeaders = {
  'Content-Type': 'application/json',
}

const handleResponse = async (response) => {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = payload.detail || 'Something went wrong'
    const err = new Error(detail)
    err.fields = payload
    throw err
  }
  return payload
}

export const listProducts = async (params = {}) => {
  const qs = new URLSearchParams()
  if (params.search) qs.append('search', params.search)
  if (params.category) qs.append('category__slug', params.category)
  if (params.brand) qs.append('brand', params.brand)
  if (params.is_featured) qs.append('is_featured', 'true')
  const res = await fetch(`${BASE_URL}/api/shop/products/?${qs.toString()}`, {
    method: 'GET',
  })
  return handleResponse(res)
}

export const getProduct = async (slug) => {
  const res = await fetch(`${BASE_URL}/api/shop/products/${slug}/`, { method: 'GET' })
  return handleResponse(res)
}

export const listCategories = async () => {
  const res = await fetch(`${BASE_URL}/api/shop/categories/`, { method: 'GET' })
  return handleResponse(res)
}

export const listBrands = async () => {
  // backend doesn't expose public brands; return empty list for now
  return []
}

export const fetchCart = async () => {
  const res = await fetch(`${BASE_URL}/api/shop/cart/`, {
    method: 'GET',
    credentials: 'include',
  })
  return handleResponse(res)
}

export const addToCart = async (productId, quantity = 1) => {
  const res = await fetch(`${BASE_URL}/api/shop/cart/add/`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ product_id: productId, quantity }),
  })
  return handleResponse(res)
}

export const updateCartItem = async (productId, quantity = 1) => {
  const res = await fetch(`${BASE_URL}/api/shop/cart/update/`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ product_id: productId, quantity }),
  })
  return handleResponse(res)
}

export const removeCartItem = async (productId) => {
  const res = await fetch(`${BASE_URL}/api/shop/cart/remove/`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ product_id: productId }),
  })
  return handleResponse(res)
}

export const clearCart = async () => {
  const res = await fetch(`${BASE_URL}/api/shop/cart/clear/`, {
    method: 'POST',
    credentials: 'include',
  })
  return handleResponse(res)
}

export const checkout = async (payload) => {
  const res = await fetch(`${BASE_URL}/api/shop/checkout/`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export const fetchHomepageConfig = async () => {
  const res = await fetch(`${BASE_URL}/api/shop/homepage/`, { method: 'GET' })
  return handleResponse(res)
}
