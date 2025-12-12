// Axios-based API client with JWT handling and auto-refresh
import axios from 'axios'
import { ENV } from '../utils/env'
import { STORAGE_KEYS } from '../utils/constants'
import { getPreference, setPreference, removePreference } from '../storage/preferences'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: ENV.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false
let failedQueue = []
// In-memory access token cache to ensure requests attach token immediately
let currentAccessToken = null

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor - attach JWT token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Prefer in-memory token if available (faster and works even before Preferences resolves)
    const token = currentAccessToken || await getPreference(STORAGE_KEYS.ACCESS_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      // Helpful debug when running on emulator/device to know why header missing
      if (typeof window !== 'undefined') {
        // Keep this a debug line — the user can enable remote console to see it
        console.debug('[axios] No access token found for request', config.url)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = await getPreference(STORAGE_KEYS.REFRESH_TOKEN)
        
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // Call refresh endpoint
        const response = await axios.post(
          `${ENV.API_URL}/auth/refresh`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        )

        // Backend may return access_token or access
        const access = response.data.access_token || response.data.access
        const refresh = response.data.refresh_token || response.data.refresh

        if (access) {
          await setPreference(STORAGE_KEYS.ACCESS_TOKEN, access)
        }
        if (refresh) {
          await setPreference(STORAGE_KEYS.REFRESH_TOKEN, refresh)
        }

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`

        // Process queued requests
        processQueue(null, access)

        // Retry the original request
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        processQueue(refreshError, null)
        await clearAuthTokens()
        
        // Redirect to login if we're in a browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

/**
 * Clear authentication tokens
 */
async function clearAuthTokens() {
  await removePreference(STORAGE_KEYS.ACCESS_TOKEN)
  await removePreference(STORAGE_KEYS.REFRESH_TOKEN)
  await removePreference(STORAGE_KEYS.USER_INFO)
  // clear in-memory cache too
  currentAccessToken = null
}

/**
 * Set authentication tokens
 */
export async function setAuthTokens(accessToken, refreshToken, userInfo = null) {
  await setPreference(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  if (refreshToken) {
    await setPreference(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
  }
  if (userInfo) {
    await setPreference(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))
  }
  // keep a copy in memory so subsequent requests immediately attach token
  currentAccessToken = accessToken
}

/**
 * Get current access token
 */
export async function getAccessToken() {
  // prefer the in-memory cache
  if (currentAccessToken) return currentAccessToken
  return await getPreference(STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * Get current refresh token
 */
export async function getRefreshToken() {
  return await getPreference(STORAGE_KEYS.REFRESH_TOKEN)
}

/**
 * Get user info
 */
export async function getUserInfo() {
  try {
    const info = await getPreference(STORAGE_KEYS.USER_INFO)
    return info ? JSON.parse(info) : null
  } catch (err) {
    return null
  }
}

/**
 * Clear all auth data
 */
export async function clearAuth() {
  await clearAuthTokens()
}

// API methods
export const api = {
  // Auth endpoints
  auth: {
    firebase: (idToken) => {
      console.log('Calling /auth/firebase endpoint...')
      return axiosInstance.post('/auth/firebase', { id_token: idToken })
    },
    refresh: (refreshToken) => axiosInstance.post('/auth/refresh', { refresh: refreshToken }),
    // Manual email/password login
    login: (email, password) => axiosInstance.post('/auth/login', { email, password }),
    // Register endpoint (optional)
    register: (email, password, full_name) => axiosInstance.post('/auth/register', { email, password, full_name }),
  },
  
  // Itinerary endpoints
  itineraries: {
    getAll: () => axiosInstance.get('/itineraries'),
    getById: (id) => axiosInstance.get(`/itineraries/${id}`),
    create: (data) => axiosInstance.post('/itineraries', data),
    update: (id, data) => axiosInstance.put(`/itineraries/${id}`, data),
    delete: (id) => axiosInstance.delete(`/itineraries/${id}`),
  },
}

export default axiosInstance
