const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

export const setTokens = ({ access, refresh }) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const isAuthenticated = () => Boolean(getAccessToken())

