import axios from 'axios'

// Base URL is configurable per-environment via VITE_API_BASE_URL (see
// .env.example). Never hardcode a production URL here.
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: apiBaseUrl,
})

let currentIdToken = null
let unauthorizedHandler = null
let adminOnlyHandler = null

export const setAuthToken = (token) => {
  currentIdToken = token
}

// Registered by the auth store with a function that attempts a silent token
// refresh and returns the new idToken (or null on failure), so a 401 can be
// retried once instead of surfacing to the caller. Mirrors the pattern in
// app/src/services/api.js.
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler
}

// Registered by the auth store. Fires whenever any admin-gated request comes
// back 403 ADMIN_ONLY - not just the initial post-login gate check - so a
// session that loses admin access mid-use gets logged out instead of leaving
// a broken/partial dashboard on screen.
export const setAdminOnlyHandler = (handler) => {
  adminOnlyHandler = handler
}

api.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  if (currentIdToken) {
    config.headers.Authorization = `Bearer ${currentIdToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    if (response?.status === 401 && config && !config._retry && unauthorizedHandler) {
      config._retry = true
      const newToken = await unauthorizedHandler()
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`
        return api(config)
      }
    }
    if (response?.status === 403 && response?.data?.error?.code === 'ADMIN_ONLY' && adminOnlyHandler) {
      adminOnlyHandler()
    }
    throw error
  },
)

// Prefers the API's own deliberately-written message - never falls back to
// err.message, which is axios's own plumbing wording ("Network Error",
// "timeout of 20000ms exceeded") and isn't fit to show someone.
export const getErrorMessage = (err) => {
  const serverMessage = err?.response?.data?.error?.message
  if (typeof serverMessage === 'string' && serverMessage.trim()) return serverMessage

  if (!err?.response) return 'Please check your internet connection and try again.'
  return 'Something went wrong. Please try again.'
}

export const getErrorCode = (err) => err?.response?.data?.error?.code || null
