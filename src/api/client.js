import { API_URL } from '../config'
import {
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
  saveRefreshToken,
  clearTokens
} from '../authStorage'
import { isOnline } from '../network'
import { getAllOfflineItineraries } from '../database/db'

class APIClient {
  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this._refreshing = null
  }

  async request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}/${path.replace(/^\//, '')}`

    // Prepare init and headers
    const init = { method: options.method || 'GET', ...options }
    const headers = new Headers(init.headers || {})

    // Attach access token if available
    const token = await getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    // If body is a plain object, stringify and set JSON content-type
    if (init.body && typeof init.body === 'object' && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
      init.body = JSON.stringify(init.body)
    }

    init.headers = headers

    // If this is a GET to /itineraries and device is offline, return local SQLite results
    const method = (init.method || 'GET').toUpperCase()
    if (method === 'GET' && (/\/?itineraries\/?$/.test(path) || /\/itineraries(\/.+)?$/.test(path)) ) {
      try {
        if (!isOnline()) {
          const offline = await getAllOfflineItineraries()
          return offline
        }
      } catch (e) {
        // fall through to try network request
        console.warn('Offline fallback error', e)
      }
    }

    let res = await fetch(url, init)

    // If unauthorized, try refresh once and retry
    if (res.status === 401) {
      const refreshed = await this._tryRefresh()
      if (refreshed) {
        const newToken = await getAccessToken()
        if (newToken) headers.set('Authorization', `Bearer ${newToken}`)
        init.headers = headers
        res = await fetch(url, init)
      }
    }

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || ''
      const body = contentType.includes('application/json') ? await res.json() : await res.text()
      const err = new Error('API request failed')
      err.status = res.status
      err.body = body
      throw err
    }

    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) return res.json()
    return res.text()
  }

  async _tryRefresh() {
    // serialize refresh calls
    if (this._refreshing) return this._refreshing

    this._refreshing = (async () => {
      try {
        const refresh = await getRefreshToken()
        if (!refresh) {
          await clearTokens()
          return false
        }

        const resp = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh })
        })

        if (!resp.ok) {
          await clearTokens()
          return false
        }

        const data = await resp.json()
        // Expecting { access: '...', refresh: '...' }
        if (data.access) await saveAccessToken(data.access)
        if (data.refresh) await saveRefreshToken(data.refresh)
        return true
      } catch (e) {
        await clearTokens()
        return false
      } finally {
        this._refreshing = null
      }
    })()

    return this._refreshing
  }

  // Convenience helpers
  get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' })
  }

  post(path, body, options = {}) {
    return this.request(path, { ...options, method: 'POST', body })
  }

  put(path, body, options = {}) {
    return this.request(path, { ...options, method: 'PUT', body })
  }

  delete(path, options = {}) {
    return this.request(path, { ...options, method: 'DELETE' })
  }
}

// Export a singleton client instance
const apiClient = new APIClient()
export { APIClient }
export default apiClient
