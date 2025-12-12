// Authentication hook
import { useState, useEffect, useCallback } from 'react'
import { signInWithGoogle, signOut, getCurrentUser } from '../api/firebase'
import { getAccessToken, getUserInfo } from '../api/axiosClient'
import { getPreference } from '../storage/preferences'
import { STORAGE_KEYS } from '../utils/constants'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const firebaseUser = getCurrentUser()
      const token = await getAccessToken()
      const userInfoStr = await getPreference(STORAGE_KEYS.USER_INFO)
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null

      // If we have a JWT token, trust that as authenticated and use stored userInfo.
      if (token) {
        if (firebaseUser) {
          setUser({
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            uid: firebaseUser.uid,
            ...userInfo,
          })
        } else if (userInfo) {
          // Non-Firebase login (manual email/password) - use stored user info
          setUser(userInfo)
        } else {
          // Token exists but no user info - mark authenticated without details
          setUser(null)
        }

        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Check auth error', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Starting login process...')
      const result = await signInWithGoogle()
      console.log('Login successful, updating state...', result.user)
      setUser(result.user)
      setIsAuthenticated(true)
      console.log('Login state updated, user authenticated:', true)
      return result
    } catch (error) {
      console.error('Login error in useAuth:', error)
      setUser(null)
      setIsAuthenticated(false)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setLoading(true)
      await signOut()
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Logout error', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth,
  }
}

