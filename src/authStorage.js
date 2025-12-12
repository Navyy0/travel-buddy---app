import { Preferences } from '@capacitor/preferences'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

async function saveAccessToken(token) {
  try {
    await Preferences.set({ key: ACCESS_KEY, value: token })
  } catch (err) {
    console.error('saveAccessToken error', err)
    throw err
  }
}

async function getAccessToken() {
  try {
    const { value } = await Preferences.get({ key: ACCESS_KEY })
    return value
  } catch (err) {
    console.error('getAccessToken error', err)
    return null
  }
}

async function saveRefreshToken(token) {
  try {
    await Preferences.set({ key: REFRESH_KEY, value: token })
  } catch (err) {
    console.error('saveRefreshToken error', err)
    throw err
  }
}

async function getRefreshToken() {
  try {
    const { value } = await Preferences.get({ key: REFRESH_KEY })
    return value
  } catch (err) {
    console.error('getRefreshToken error', err)
    return null
  }
}

async function clearTokens() {
  try {
    await Preferences.remove({ key: ACCESS_KEY })
    await Preferences.remove({ key: REFRESH_KEY })
  } catch (err) {
    console.error('clearTokens error', err)
    throw err
  }
}

export { saveAccessToken, getAccessToken, saveRefreshToken, getRefreshToken, clearTokens }
export default { saveAccessToken, getAccessToken, saveRefreshToken, getRefreshToken, clearTokens }
