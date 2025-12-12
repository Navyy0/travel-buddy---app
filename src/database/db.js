import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

let connection = null
let db = null
const DB_NAME = 'travel_buddy_db'

async function ensureInit() {
  if (db) return

  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite)

    // For web platform initialize the web store (jeep-sqlite). Do NOT call
    // web-only methods when running on native Android/iOS — they are not
    // implemented and will throw "not implemented" errors.
    try {
      await sqlite.checkConnectionsConsistency()

      const platform = typeof window !== 'undefined' ? (window.Capacitor ? window.Capacitor.getPlatform && window.Capacitor.getPlatform() : null) : null
      const isWeb = platform === 'web' || platform === 'electron' || (!platform && typeof window !== 'undefined')

      if (isWeb) {
        // Ensure the jeep-sqlite custom element is present in the DOM for web builds
        try {
          if (typeof document !== 'undefined' && !document.querySelector('jeep-sqlite')) {
            const el = document.createElement('jeep-sqlite')
            document.body.appendChild(el)
            await customElements.whenDefined('jeep-sqlite')
          }
        } catch (e) {
          // ignore DOM issues and continue; the next init call may fail which we'll catch
        }

        // Prefer the connection helper's initWebStore if available, else fall back
        // to the CapacitorSQLite helper (some versions expose one or the other).
        if (typeof sqlite.initWebStore === 'function') {
          await sqlite.initWebStore()
        } else if (CapacitorSQLite && typeof CapacitorSQLite.initWebStore === 'function') {
          await CapacitorSQLite.initWebStore()
        }
      }
    } catch (e) {
      // ignore consistency/init errors and continue
    }

    connection = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1)
    await connection.open()

    // Create itineraries table
    const create = `CREATE TABLE IF NOT EXISTS itineraries (id TEXT PRIMARY KEY, json TEXT, createdAt TEXT);`
    await connection.execute(create)

    db = connection
  } catch (err) {
    console.error('SQLite init failed', err)
    throw err
  }
}

function _generateId() {
  // simple unique id: timestamp + random
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

async function saveItinerary(itineraryJson) {
  await ensureInit()

  // accept either object or string
  const jsonString = typeof itineraryJson === 'string' ? itineraryJson : JSON.stringify(itineraryJson)
  let parsed = null
  try { parsed = typeof itineraryJson === 'string' ? JSON.parse(itineraryJson) : itineraryJson } catch (e) { parsed = null }

  const id = (parsed && parsed.id) ? String(parsed.id) : _generateId()
  const createdAt = new Date().toISOString()

  const stmt = `INSERT OR REPLACE INTO itineraries (id, json, createdAt) VALUES (?, ?, ?);`
  try {
    await db.run(stmt, [id, jsonString, createdAt])
    return { id, createdAt }
  } catch (err) {
    console.error('saveItinerary error', err)
    throw err
  }
}

async function getAllOfflineItineraries() {
  await ensureInit()
  try {
    const res = await db.query('SELECT id, json, createdAt FROM itineraries ORDER BY createdAt DESC')
    // res.values is an array of rows
    const rows = res && res.values ? res.values : []
    return rows.map(r => ({ id: r.id, json: r.json, createdAt: r.createdAt }))
  } catch (err) {
    console.error('getAllOfflineItineraries error', err)
    return []
  }
}

async function getOfflineItinerary(id) {
  await ensureInit()
  try {
    const res = await db.query('SELECT id, json, createdAt FROM itineraries WHERE id = ?', [id])
    const row = res && res.values && res.values[0] ? res.values[0] : null
    return row
  } catch (err) {
    console.error('getOfflineItinerary error', err)
    return null
  }
}

async function deleteOfflineItinerary(id) {
  await ensureInit()
  try {
    await db.run('DELETE FROM itineraries WHERE id = ?', [id])
    return true
  } catch (err) {
    console.error('deleteOfflineItinerary error', err)
    return false
  }
}

export { saveItinerary, getAllOfflineItineraries, getOfflineItinerary, deleteOfflineItinerary }
export default { saveItinerary, getAllOfflineItineraries, getOfflineItinerary, deleteOfflineItinerary }
