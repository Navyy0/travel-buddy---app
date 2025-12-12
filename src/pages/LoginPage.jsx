// Login page with Google Sign-In
import React, { useState, useEffect } from 'react'
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonText,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon
} from '@ionic/react'
import { useHistory } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { api, setAuthTokens } from '../api/axiosClient'
import { logoGoogle } from 'ionicons/icons'

export function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const history = useHistory()
  const { login, isAuthenticated, checkAuth } = useAuthContext()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      history.replace('/home')
    }
  }, [isAuthenticated, history])

  const handleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('Login button clicked, calling login()...')
      await login()
      // Refresh auth context to ensure provider state is up-to-date
      try {
        await checkAuth()
      } catch (e) {
        console.warn('checkAuth after login failed', e)
      }
      console.log('Login completed, navigating to /home...')
      history.replace('/home')
    } catch (err) {
      console.error('Login error in LoginPage:', err)
      const errorMessage = err?.response?.data?.detail || 
                           err?.response?.data?.message || 
                           err?.message || 
                           'Failed to sign in with Google. Please check if your backend is running.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await api.auth.login(email, password)
      const data = resp.data
      const access = data.access_token || data.access
      const refresh = data.refresh_token || data.refresh
      const user = data.user || null

      if (!access) {
        throw new Error('No access token returned from server')
      }

      await setAuthTokens(access, refresh, user)

      // Refresh auth context so app recognizes the new token and user
      try {
        await checkAuth()
      } catch (e) {
        console.warn('checkAuth after email login failed', e)
      }
      history.replace('/home')
    } catch (err) {
      console.error('Email login error', err)
      const msg = err?.response?.data?.detail || err?.message || 'Email login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Travel Buddy</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <IonCard style={{ width: '100%' }}>
            <IonCardHeader>
              <IonCardTitle style={{ textAlign: 'center', fontSize: '24px' }}>
                Welcome to Travel Buddy
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p style={{ textAlign: 'center', marginBottom: '8px', color: '#666' }}>
                Sign in with your Google account or use your email and password
              </p>

              {/* Email / password form */}
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #e6e6e6' }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e6e6e6' }}
                />
                <IonButton expand="block" onClick={handleEmailLogin} style={{ marginTop: '10px' }} disabled={loading}>
                  {loading ? <IonSpinner name="crescent" /> : 'Sign in with Email'}
                </IonButton>
              </div>
              
              {error && (
                <IonText color="danger" style={{ display: 'block', textAlign: 'center', marginBottom: '16px' }}>
                  {error}
                </IonText>
              )}

              <IonButton 
                expand="block" 
                onClick={handleLogin} 
                disabled={loading}
                style={{ marginTop: '16px' }}
              >
                {loading ? (
                  <>
                    <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <IonIcon icon={logoGoogle} style={{ marginRight: '8px', fontSize: '20px' }} />
                    Sign in with Google
                  </>
                )}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default LoginPage

