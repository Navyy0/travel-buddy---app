import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import firebaseConfig from './firebaseConfig'

import { Plugins } from '@capacitor/core'
import { saveAccessToken, saveRefreshToken } from './authStorage'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

async function storeTokensSecurely(key, value) {
  try {
    // Try community secure storage via dynamic import to handle different plugin shapes
    try {
      const pkgName = '@capacitor-community/secure-storage'
      const mod = await import(pkgName)
      // plugin may export default, SecureStorage, or a plugin instance
      const candidate = mod.default || mod.SecureStorage || mod.SecureStoragePlugin || mod
      // if candidate is a constructor, create an instance
      const instance = typeof candidate === 'function' ? new candidate() : candidate
      if (instance && typeof instance.set === 'function') {
        // some versions accept an object { key, value }
        await instance.set({ key, value })
        return
      }
      // some modules export set directly
      if (typeof mod.set === 'function') {
        await mod.set({ key, value })
        return
      }
    } catch (e) {
      // dynamic import failed or plugin not installed; fall back
      // console.debug('Secure storage plugin not available, falling back', e)
    }

    // Fallback to Capacitor Storage if secure storage not available
    const { Storage } = Plugins
    await Storage.set({ key, value })
  } catch (err) {
    console.error('Failed storing token securely', err)
    throw err
  }
}

async function signInWithGoogleAndExchange() {
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    if (!user) throw new Error('No user returned from Firebase sign-in')

    // Get Firebase ID token
    const idToken = await user.getIdToken()

    // Send ID token to backend to exchange for app JWTs
    const resp = await fetch('/auth/firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idToken })
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Backend /auth/firebase failed: ${resp.status} ${text}`)
    }

    const data = await resp.json()
    // Expecting { access: '...', refresh: '...' } or similar
    if (data.access) {
      await saveAccessToken(data.access)
    }
    if (data.refresh) {
      await saveRefreshToken(data.refresh)
    }

    return { user, tokens: data }
  } catch (err) {
    console.error('Firebase sign-in/exchange failed', err)
    throw err
  }
}

export { signInWithGoogleAndExchange }
export default auth
