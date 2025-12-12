// Secure storage using Capacitor Preferences
import { Preferences } from '@capacitor/preferences'

/**
 * Save a value to preferences
 */
export async function setPreference(key, value) {
  try {
    await Preferences.set({ key, value: typeof value === 'string' ? value : JSON.stringify(value) })
    return true
  } catch (err) {
    console.error('setPreference error', err)
    throw err
  }
}

/**
 * Get a value from preferences
 */
export async function getPreference(key) {
  try {
    const { value } = await Preferences.get({ key })
    return value
  } catch (err) {
    console.error('getPreference error', err)
    return null
  }
}

/**
 * Remove a value from preferences
 */
export async function removePreference(key) {
  try {
    await Preferences.remove({ key })
    return true
  } catch (err) {
    console.error('removePreference error', err)
    throw err
  }
}

/**
 * Clear all preferences
 */
export async function clearPreferences() {
  try {
    await Preferences.clear()
    return true
  } catch (err) {
    console.error('clearPreferences error', err)
    throw err
  }
}

