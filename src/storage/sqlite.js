// SQLite offline storage service
import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import { DB_CONFIG } from '../utils/constants'
import { safeJsonParse, safeJsonStringify } from '../utils/helpers'

let connection = null
let db = null
let isInitialized = false
let isBrowser = false

/**
 * Check if running in browser
 */
function checkIsBrowser() {
  if (typeof window === 'undefined') return false
  const platform = Capacitor.getPlatform()
  return platform === 'web'
}

/**
 * Initialize SQLite database
 */
async function ensureInit() {
  if (isInitialized && db) return

  // Check if we're in browser - SQLite requires special setup for web
  isBrowser = checkIsBrowser()
  
  if (isBrowser) {
    // In browser, SQLite requires jeep-sqlite element in DOM. Try to set it
    // up so the web fallback works. If that fails, we'll gracefully disable
    // offline features for this session.
    try {
      if (typeof document !== 'undefined' && !document.querySelector('jeep-sqlite')) {
        const el = document.createElement('jeep-sqlite')
        document.body.appendChild(el)
        await customElements.whenDefined('jeep-sqlite')
      }
    } catch (e) {
      console.warn('Failed to ensure jeep-sqlite element in DOM', e)
      console.warn('SQLite is not available in browser. Offline features will be limited.')
      isInitialized = true // Mark as initialized to prevent repeated attempts
      return
    }
  }

  // If running on a native platform but the CapacitorSQLite plugin is not registered,
  // avoid throwing and gracefully disable offline features until native build includes plugin.
  try {
    const pluginAvailable = !!(globalThis.Capacitor && globalThis.Capacitor.Plugins && globalThis.Capacitor.Plugins.CapacitorSQLite)
    if (Capacitor.isNativePlatform && Capacitor.isNativePlatform() && !pluginAvailable) {
      console.warn('CapacitorSQLite plugin not present in native project. Offline SQLite disabled.')
      isInitialized = true
      return
    }
  } catch (e) {
    // ignore and continue to attempt initialization
  }

  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite)

    // Initialize web store only when running in web environment (jeep-sqlite)
    try {
      await sqlite.checkConnectionsConsistency()
      // initWebStore is a web-only helper (jeep-sqlite). Calling it on native
      // Android will surface a "not implemented" error. Only invoke it when
      // we detect the `web` platform. Prefer the sqlite connection helper if
      // it exposes the method, otherwise fall back to the CapacitorSQLite
      // helper.
      if (checkIsBrowser()) {
        if (typeof sqlite.initWebStore === 'function') {
          await sqlite.initWebStore()
        } else if (CapacitorSQLite && typeof CapacitorSQLite.initWebStore === 'function') {
          await CapacitorSQLite.initWebStore()
        }
      }
    } catch (e) {
      console.warn('SQLite consistency check failed', e)
      // If consistency check fails, we might be in browser without jeep-sqlite
      if (checkIsBrowser()) {
        console.warn('SQLite not available in browser. Offline features disabled.')
        isInitialized = true
        return
      }
      throw e
    }

    // Create connection
    // Parameters: database, encrypted, mode, version, readonly
    connection = await sqlite.createConnection(
      DB_CONFIG.NAME,
      DB_CONFIG.ENCRYPTION,
      'no-encryption',
      DB_CONFIG.VERSION,
      false // readonly = false
    )
    await connection.open()

    // Create itineraries table
    const createTable = `
      CREATE TABLE IF NOT EXISTS itineraries (
        id TEXT PRIMARY KEY,
        json TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        isOffline INTEGER DEFAULT 1
      );
    `
    await connection.execute(createTable)

    db = connection
    isInitialized = true
  } catch (err) {
    // Always handle initialization errors gracefully in the app runtime so
    // they don't produce uncaught promise rejections during dev/live-reload.
    console.error('SQLite init failed', err)
    console.warn('Offline SQLite disabled due to initialization error.')
    // Mark as initialized to prevent repeated attempts during this session.
    isInitialized = true
    db = null
    connection = null
    return
  }
}

/**
 * Save itinerary to SQLite
 */
export async function saveItineraryOffline(itinerary) {
  await ensureInit()
  if (isBrowser || !db) {
    console.warn('SQLite not available. Cannot save offline in browser.')
    return null
  }

  const jsonString = safeJsonStringify(itinerary)
  const parsed = safeJsonParse(jsonString, {})
  const id = parsed.id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
  const createdAt = new Date().toISOString()
  const updatedAt = new Date().toISOString()

  const stmt = `INSERT OR REPLACE INTO itineraries (id, json, createdAt, updatedAt, isOffline) VALUES (?, ?, ?, ?, ?);`
  
  try {
    await db.run(stmt, [id, jsonString, createdAt, updatedAt, 1])
    return { id, createdAt, updatedAt }
  } catch (err) {
    console.error('saveItineraryOffline error', err)
    throw err
  }
}

/**
 * Get all offline itineraries
 */
export async function getAllOfflineItineraries() {
  await ensureInit()
  if (isBrowser || !db) {
    console.warn('SQLite not available. Cannot load offline data in browser.')
    return []
  }
  
  try {
    const result = await db.query('SELECT id, json, createdAt, updatedAt FROM itineraries ORDER BY createdAt DESC')
    const rows = result?.values || []
    
    return rows.map(row => {
      const parsed = safeJsonParse(row.json, {})
      return {
        id: row.id,
        ...parsed,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        _isOffline: true
      }
    })
  } catch (err) {
    console.error('getAllOfflineItineraries error', err)
    return []
  }
}

/**
 * Get a single offline itinerary by ID
 */
export async function getOfflineItinerary(id) {
  await ensureInit()
  if (isBrowser || !db) {
    console.warn('SQLite not available. Cannot load offline itinerary in browser.')
    return null
  }
  
  try {
    const result = await db.query('SELECT id, json, createdAt, updatedAt FROM itineraries WHERE id = ?', [id])
    const row = result?.values?.[0]
    
    if (!row) return null
    
    const parsed = safeJsonParse(row.json, {})
    return {
      id: row.id,
      ...parsed,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      _isOffline: true
    }
  } catch (err) {
    console.error('getOfflineItinerary error', err)
    return null
  }
}

/**
 * Delete offline itinerary
 */
export async function deleteOfflineItinerary(id) {
  await ensureInit()
  if (isBrowser || !db) {
    console.warn('SQLite not available. Cannot delete offline itinerary in browser.')
    return false
  }
  
  try {
    await db.run('DELETE FROM itineraries WHERE id = ?', [id])
    return true
  } catch (err) {
    console.error('deleteOfflineItinerary error', err)
    return false
  }
}

/**
 * Check if itinerary exists offline
 */
export async function isItineraryOffline(id) {
  await ensureInit()
  if (isBrowser || !db) {
    return false // In browser, nothing is offline
  }
  
  try {
    const result = await db.query('SELECT id FROM itineraries WHERE id = ?', [id])
    return (result?.values?.length || 0) > 0
  } catch (err) {
    console.error('isItineraryOffline error', err)
    return false
  }
}
