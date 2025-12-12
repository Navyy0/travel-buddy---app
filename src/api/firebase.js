// Firebase authentication service
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { ENV } from '../utils/env'
import { api, setAuthTokens, clearAuth, getAccessToken } from './axiosClient'

// Firebase configuration
const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

/**
 * Sign in with Google and exchange Firebase ID token for backend JWT
 */
export async function signInWithGoogle() {
  try {
    // Sign in with Google via Firebase
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    if (!user) {
      throw new Error('No user returned from Firebase sign-in')
    }

    // Get Firebase ID token
    const idToken = await user.getIdToken()

    // Send ID token to backend to exchange for app JWTs
    console.log('Sending Firebase ID token to backend...')
    let response
    try {
      response = await api.auth.firebase(idToken)
      console.log('Backend response received:', response.data)
    } catch (apiError) {
      console.error('Backend API error:', apiError)
      console.error('Response data:', apiError.response?.data)
      console.error('Response status:', apiError.response?.status)
      throw new Error(
        apiError.response?.data?.detail || 
        apiError.response?.data?.message || 
        apiError.message || 
        'Failed to authenticate with backend. Please check if your backend is running on port 8000.'
      )
    }

    // Backend returns: { access_token, token_type, user }
    // Map to our expected format
    const access = response.data.access_token || response.data.access
    const refresh = response.data.refresh_token || response.data.refresh
    const userInfo = response.data.user || {}

    if (!access) {
      console.error('No access token received from backend:', response.data)
      throw new Error('Backend did not return an access token. Please check your backend authentication endpoint.')
    }

    console.log('Storing tokens...')
    // Store tokens securely
    await setAuthTokens(access, refresh, {
      ...userInfo,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid,
    })
    console.log('Tokens stored successfully')

    return {
      user: {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid,
        ...userInfo,
      },
      tokens: { access, refresh },
    }
  } catch (error) {
    console.error('Firebase sign-in failed', error)
    // Provide more user-friendly error messages
    if (error.message) {
      throw error
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.')
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups for this site.')
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.')
    } else {
      throw new Error(error.message || 'Failed to sign in with Google. Please try again.')
    }
  }
}

/**
 * Sign out from Firebase and clear app tokens
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth)
    await clearAuth()
    return true
  } catch (error) {
    console.error('Sign out failed', error)
    throw error
  }
}

/**
 * Get current Firebase user
 */
export function getCurrentUser() {
  return auth.currentUser
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const user = auth.currentUser
  if (!user) return false
  
  try {
    // Check if we have a valid access token
    const token = await getAccessToken()
    return !!token
  } catch (error) {
    return false
  }
}

export default auth

